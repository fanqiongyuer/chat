from typing import Any, Dict


def supervisor_node(state: Dict[str, Any]) -> Dict[str, str]:
    """主管路由：当前统一走检索链路，可按需扩展更复杂分流规则。"""
    messages = state.get("messages", [])
    if not messages:
        return {"next_agent": "retriever"}

    last_content = messages[-1].get("content", "")
    # 预留实验路由分支，当前仍回落到 retriever。
    if any(keyword in last_content for keyword in ["实验", "protocol", "方法"]):
        return {"next_agent": "experiment"}

    return {"next_agent": "retriever"}
