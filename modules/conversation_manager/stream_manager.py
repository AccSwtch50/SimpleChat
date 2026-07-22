import uuid
import json
from openai import OpenAI
from .data_objects import ToolCall, Message, SC_Chunk
from .conversation_manager import Conversation

class StreamManager:
    def __init__(self, api_key, base_url, mcp_servers=None):
        self.api_key = api_key
        self.base_url = base_url
        self.oai_client = None
        self.mcp_servers = mcp_servers or {}

        if self.api_key:
            self.oai_client = OpenAI(api_key=api_key, base_url=base_url)

    def get_all_tools_openai(self):
        oai_tools = []
        for server in self.mcp_servers.values():
            server.connect_server()
            oai_tools.extend(server.get_tools_openai())

        return oai_tools if oai_tools else None

    def generate_reply_stream(self, prompt, conversation):
        tools = self.get_all_tools_openai()

        while True:
            yield from self._generate_reply_stream_once(prompt, conversation, tools)

            last_message = conversation.messages[-1]
            if last_message.role != "assistant":
                break

            current_tools = last_message.content.get_tools()
            if not current_tools:
                break

            for tool_call in current_tools:
                if tool_call.result_content is not None:
                    continue
                yield self._execute_tool(tool_call, last_message)

    def _execute_tool(self, tool_call, last_message):
        full_name = tool_call.name
        arguments = tool_call.arguments

        server_name, tool_name = full_name.split("__", 1) if "__" in full_name else ("", full_name)

        server = self.mcp_servers.get(server_name)
        result_text = self._run_mcp_tool(server, server_name, tool_name, arguments)

        tool_call.set_result(result_text)

        response_data = {
            "message_id": last_message.message_id,
            "message_type": "tool_result",
            "tool_call_id": tool_call.call_id,
            "message_delta": result_text
        }

        return json.dumps(response_data) + "\n"

    def _run_mcp_tool(self, server, server_name, tool_name, arguments):
        if not server:
            return f"MCP: {server_name} is not registered."

        tool_object = None
        for tool in server.get_tools():
            if tool.name != tool_name:
                continue
            tool_object = tool
            break

        if not tool_object:
            return f"MCP: \"{tool_name}\" tool not found on server \"{server_name}\"."

        return server.call_tool(tool_object, arguments)

    def _generate_reply_stream_once(self, prompt, conversation, tools):
        kwargs = {
            "model": "gemma4:31b-cloud",
            "reasoning_effort": "medium",
            "messages": conversation.to_openai(),
            "stream": True
        }
        if tools:
            kwargs["tools"] = tools

        openai_stream = self.oai_client.chat.completions.create(**kwargs)
        message = Message(role="assistant", message_id=str(uuid.uuid4()))

        for chunk in openai_stream:
            yield self.process_oai_chunk(chunk, message)

        conversation.add_message(message)

        print(conversation.to_dict())

    def process_oai_chunk(self, chunk, message):
        parsed_chunk = SC_Chunk(chunk)
        message.add_content(parsed_chunk.chunk_type, parsed_chunk.chunk_content)

        response_data = {
            "message_id": message.message_id,
            "message_type": parsed_chunk.chunk_type,
            "message_delta": parsed_chunk.chunk_content
        }
        return json.dumps(response_data) + "\n"

