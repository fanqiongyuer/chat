from typing import Any, Dict, List, TypedDict

from langgraph.graph import END, StateGraph

from app.agents.compressor import compressor_node
from app.agents.memory_saver import memory_saver_node
from app.agents.reranker import reranker_node
from app.agents.responder import responder_node
from app.agents.retriever_agent import retriever_node
from app.agents.supervisor import supervisor_node


class AgentState(TypedDict):
    messages: List[Dict[str, str]]
    conversation_id: str
    next_agent: str
    raw_docs: List[Dict[str, Any]]
    filtered_docs: List[Dict[str, Any]]
    compressed_context: str
    final_answer: str


builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("retriever", retriever_node)
builder.add_node("reranker", reranker_node)
builder.add_node("compressor", compressor_node)
builder.add_node("memory_saver", memory_saver_node)
builder.add_node("responder", responder_node)

builder.set_entry_point("supervisor")


def route_supervisor(state: AgentState) -> str:
    return state.get("next_agent", "retriever")


builder.add_conditional_edges(
    "supervisor",
    route_supervisor,
    {
        "retriever": "retriever",
        "experiment": "retriever",
    },
)

builder.add_edge("retriever", "reranker")
builder.add_edge("reranker", "compressor")
builder.add_edge("compressor", "memory_saver")
builder.add_edge("memory_saver", "responder")
builder.add_edge("responder", END)

graph = builder.compile()


async def run_agent(conv_id: str, messages: List[Dict[str, str]]) -> str:
    initial: AgentState = {
        "messages": messages,
        "conversation_id": conv_id,
        "next_agent": "",
        "raw_docs": [],
        "filtered_docs": [],
        "compressed_context": "",
        "final_answer": "",
    }
    result = await graph.ainvoke(initial)
    return result.get("final_answer", "抱歉，我没有生成有效的回答。")
