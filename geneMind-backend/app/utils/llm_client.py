import json
from typing import AsyncGenerator, Optional

import httpx

from app.core.config import settings


class LLMUnavailableError(RuntimeError):
    pass


def _resolve_provider() -> str:
    if settings.LLM_PROVIDER in {"ollama", "openai_compatible"}:
        return settings.LLM_PROVIDER

    if (
        settings.OPENAI_COMPAT_BASE_URL
        and settings.OPENAI_COMPAT_API_KEY
        and settings.OPENAI_COMPAT_MODEL
    ):
        return "openai_compatible"

    return "ollama"


def _build_timeout() -> httpx.Timeout:
    return httpx.Timeout(
        connect=settings.LLM_CONNECT_TIMEOUT,
        read=settings.LLM_READ_TIMEOUT,
        write=10.0,
        pool=10.0,
    )


async def _stream_from_ollama(
    prompt: str,
    system_prompt: Optional[str],
    model: Optional[str],
) -> AsyncGenerator[str, None]:
    payload = {
        "model": model or settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
    }
    if system_prompt:
        payload["system"] = system_prompt

    url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=_build_timeout()) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    token = data.get("response", "")
                    if token:
                        yield token

                    if data.get("done", False):
                        break
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        raise LLMUnavailableError(f"Ollama 不可用：{exc}") from exc


async def _stream_from_openai_compatible(
    prompt: str,
    system_prompt: Optional[str],
    model: Optional[str],
) -> AsyncGenerator[str, None]:
    if not (
        settings.OPENAI_COMPAT_BASE_URL
        and settings.OPENAI_COMPAT_API_KEY
        and settings.OPENAI_COMPAT_MODEL
    ):
        raise LLMUnavailableError(
            "远端模型未配置，请设置 OPENAI_COMPAT_BASE_URL / OPENAI_COMPAT_API_KEY / OPENAI_COMPAT_MODEL"
        )

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model or settings.OPENAI_COMPAT_MODEL,
        "messages": messages,
        "stream": True,
    }

    url = f"{settings.OPENAI_COMPAT_BASE_URL.rstrip('/')}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_COMPAT_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=_build_timeout()) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue

                    raw = line[len("data:") :].strip()
                    if raw == "[DONE]":
                        break

                    try:
                        data = json.loads(raw)
                    except json.JSONDecodeError:
                        continue

                    choices = data.get("choices", [])
                    if not choices:
                        continue

                    token = choices[0].get("delta", {}).get("content", "")
                    if token:
                        yield token
    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        raise LLMUnavailableError(f"远端模型不可用：{exc}") from exc


async def stream_llm(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    provider = _resolve_provider()

    if provider == "openai_compatible":
        async for token in _stream_from_openai_compatible(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
        ):
            yield token
        return

    async for token in _stream_from_ollama(prompt=prompt, system_prompt=system_prompt, model=model):
        yield token
