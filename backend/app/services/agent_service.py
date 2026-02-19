import time
from typing import List, Optional
import json
from langchain.agents import create_openai_functions_agent, AgentExecutor
from langchain.tools import Tool, tool
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import get_settings
from app.core.logging import logger
from app.services.rag_service import _get_llm

settings = get_settings()

# Define Custom Tools
@tool
def calculator(expression: str) -> str:
    """Useful for when you need to answer questions about math."""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"Error evaluating expression: {str(e)}"

@tool
def get_current_weather(location: str) -> str:
    """Get the weather for a location."""
    # Mock weather tool
    return f"The weather in {location} is 72 degrees and sunny."

class AgentService:
    def __init__(self):
        self.llm = _get_llm()
        self.available_tools = {
            "calculator": calculator,
            "weather": get_current_weather
        }
        logger.info("agent_service_initialized", extra={
            "available_tools": list(self.available_tools.keys()),
            "llm_provider": settings.LLM_PROVIDER,
        })

    async def run_agent(self, input_text: str, tools_list: List[str], prompt_template: str = "You are a helpful assistant"):
        start = time.perf_counter()
        logger.info("agent_run_started", extra={
            "tools": tools_list, "input_length": len(input_text)
        })

        try:
            # For Gemini, use a simpler approach since it doesn't support OpenAI function calling
            if settings.LLM_PROVIDER == "gemini":
                output = await self._run_gemini_agent(input_text, tools_list, prompt_template)
            else:
                output = await self._run_openai_agent(input_text, tools_list, prompt_template)

            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info("agent_run_completed", extra={
                "tools": tools_list,
                "input_length": len(input_text),
                "output_length": len(output),
                "duration_ms": duration_ms,
            })
            return output
        except Exception as e:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error("agent_run_failed", extra={
                "tools": tools_list,
                "input_length": len(input_text),
                "duration_ms": duration_ms,
                "error": str(e),
            })
            raise

    async def _run_gemini_agent(self, input_text: str, tools_list: List[str], prompt_template: str) -> str:
        """Use Gemini with a direct prompt approach for tool usage."""
        # Build tool context
        tool_descriptions = []
        for t_name in tools_list:
            if t_name in self.available_tools:
                t = self.available_tools[t_name]
                tool_descriptions.append(f"- {t.name}: {t.description}")

        tool_context = ""
        if tool_descriptions:
            tool_context = "\n\nYou have access to these tools:\n" + "\n".join(tool_descriptions)
            tool_context += "\n\nIf a user asks something that requires a tool, use it by responding with TOOL_CALL: tool_name(argument). Otherwise, answer directly."

        messages = [
            ("system", prompt_template + tool_context),
            ("human", input_text),
        ]
        
        response = await self.llm.ainvoke(messages)
        result = response.content

        # Check if the model wants to use a tool
        if "TOOL_CALL:" in result:
            tool_call = result.split("TOOL_CALL:")[1].strip()
            tool_name = tool_call.split("(")[0].strip()
            tool_arg = tool_call.split("(")[1].rstrip(")").strip().strip('"').strip("'")
            
            if tool_name in self.available_tools:
                tool_result = self.available_tools[tool_name].invoke(tool_arg)
                # Feed result back to LLM
                messages.append(("assistant", result))
                messages.append(("human", f"Tool result: {tool_result}. Please provide a natural language answer."))
                final_response = await self.llm.ainvoke(messages)
                result = final_response.content

        return result

    async def _run_openai_agent(self, input_text: str, tools_list: List[str], prompt_template: str) -> str:
        """Use OpenAI function calling agent."""
        from langchain_openai import ChatOpenAI
        
        tools = []
        for t_name in tools_list:
            if t_name in self.available_tools:
                tools.append(self.available_tools[t_name])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", prompt_template),
            MessagesPlaceholder("chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])

        openai_llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model="gpt-4o-mini",
            temperature=0,
        )
        agent = create_openai_functions_agent(openai_llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        response = await agent_executor.ainvoke({"input": input_text})
        return response["output"]

agent_service = AgentService()
