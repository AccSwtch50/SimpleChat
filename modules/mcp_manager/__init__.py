import asyncio
import json
import os
from contextlib import AsyncExitStack
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class MCP_Tool:
    def __init__(self, name, mcp_server_name, parameters=None, description=None):
        self.name = name
        self.mcp_server_name = mcp_server_name
        self.parameters = parameters or {"type": "object","properties": {},"additionalProperties": "false"}
        self.description = description or ""

    def to_dict(self):
        return {
            "name": self.name,
            "mcp_server_name": self.mcp_server_name,
            "parameters": self.parameters,
            "description": self.description
        }

    def to_openai(self):
        oai_function = {
            "name": f"{self.mcp_server_name}__{self.name}",
            "description": self.description,
            "parameters": self.parameters
        }

        return {
            "type": "function",
            "function": oai_function
        }

class MCP_Server:
    def __init__(self, name, command, args=None, env=None, friendly_name=None):
        self.name = name
        self.command = command
        self.args = args or []
        self.env = env
        self.friendly_name = friendly_name or name

        self.exit_stack = AsyncExitStack()
        self.session = None
        self.loop = asyncio.new_event_loop()

    def _fetch_env_vars(self, env):
        full_env = os.environ.copy()
        if not env: return full_env

        for key, value in env.items():
            if not isinstance(value, str):
                full_env[key] = str(value)

            if value.startswith("$"):
                full_env[key] = os.environ.get(value[1:]) or ""

        return full_env

    async def _connect(self, server_params):
        try:
            read, write = await self.exit_stack.enter_async_context(stdio_client(server_params))

            self.session = await self.exit_stack.enter_async_context(ClientSession(read, write))

            await self.session.initialize()
            print(f"MCP: Connected to {self.friendly_name} ({self.name}) successfully.")
        except Exception as e:
            print(f"MCP: Failed to connect to {self.friendly_name} ({self.name}): {e}")

    def connect_server(self):
        server_params = StdioServerParameters(command=self.command, args=self.args, env=self.env)

        self.loop.run_until_complete(self._connect(server_params))

    def get_tools(self):
        return self.loop.run_until_complete(self._get_tools_async())

    async def _get_tools_async(self):
        tools = []
        if not self.session: return tools

        try:
            response = await self.session.list_tools()
            for tool in response.tools:
                tools.append(MCP_Tool(
                    name=tool.name,
                    mcp_server_name=self.name,
                    parameters=tool.inputSchema,
                    description=tool.description
                ))
        except Exception as e:
            print(f"MCP: Failed to load tools for {self.friendly_name} ({self.name}): {e}")

        return tools

    def get_tools_openai(self):
        oai_tools = []

        tools = self.get_tools()

        for tool in tools:
            oai_tools.append(tool.to_openai())

        return oai_tools

    def call_tool(self, tool, arguments):
        if tool.mcp_server_name != self.name:
            return f"Error: The server {self.friendly_name} ({self.name}) does not own tool '{tool.name}' on namespace {tool.mcp_server_name}."

        if not self.session:
            return f"Error: The server {self.friendly_name} ({self.name}) is offline."

        return self.loop.run_until_complete(self._call_tool_async(tool, arguments))

    async def _call_tool_async(self, tool, arguments):
        try:
            if isinstance(arguments, str):
                arguments = json.loads(arguments)

            result = await self.session.call_tool(tool.name, arguments=arguments)

            return self._stringify_output_blocks(result)
        except Exception as e:
            return f"Error: runtime exception on {tool.name} from {self.friendly_name} ({self.name}): {str(e)}"

    def _stringify_output_blocks(self, tool_call_result):
        output_blocks = []
        for piece in tool_call_result.content:
            output_blocks.append(self._extract_text_from_piece(piece))
        return "\n".join(output_blocks)

    def _extract_text_from_piece(self, piece):
        if hasattr(piece, "text"):
            return piece.text
        if isinstance(piece, dict) and "text" in piece:
            return piece["text"]
        return str(piece)

    def close(self):
        if not self.session:
            return
        self.loop.run_until_complete(self.exit_stack.aclose())
        self.session = None

def parse_config(server_configs):
    mcp_servers = {}
    for name, config in server_configs.items():
        mcp_servers[name] = MCP_Server(
            name=name,
            command=config.get("command"),
            args=config.get("args"),
            env=config.get("env"),
            friendly_name=config.get("friendly_name")
        )
    return mcp_servers
