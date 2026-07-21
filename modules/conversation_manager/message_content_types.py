class ToolCall:
    def __init__(self, name=None, arguments=None, call_id=None):
        self.name = name
        self.arguments = arguments or ""
        self.call_id = call_id
        self.result_content = None

    def set_result(self, content: str):
        self.result_content = content

    def to_dict(self):
        return {
            "call_id": self.call_id,
            "name": self.name,
            "arguments": self.arguments,
            "result": self.result_content
        }

    def to_openai(self):
        tool_function = {
            "name": self.name,
            "arguments": self.arguments
        }

        return {
            "id": self.call_id,
            "type": "function",
            "function": tool_function
        }

class MessageContent:
    def __init__(self):
        self._content = []

    def append(self, submessage_type: str, content=""):
        if content is None:
            return

        if not self._content or self._content[-1]["type"] != submessage_type:
            self._content.append({"type": submessage_type, "content": content})
        else:
            self._content[-1]["content"] += content

    def get_text(self, message_type: str) -> str:
        return "".join(item["content"] for item in self._content if item["type"] == message_type)

    def to_list(self):
        return list(self._content)

class ToolCallAssembler:
    def __init__(self):
        self._buffer = {}

    def add_delta(self, delta_map: dict) -> None:
        for index, delta in delta_map.items():
            buffered_tool = self._buffer.setdefault(index, {
                "id": "",
                "name": "",
                "arguments": ""
            })

            if delta.get("id"):
                buffered_tool["id"] = delta["id"]
            if delta.get("name"):
                buffered_tool["name"] += delta["name"]
            if delta.get("arguments"):
                buffered_tool["arguments"] += delta["arguments"]

    def to_list(self) -> list[ToolCall]:
        formatted_tools = []
        for _, buffered_tool in sorted(self._buffer.items()):
            formatted_tools.append(ToolCall(
                name=buffered_tool["name"],
                arguments=buffered_tool["arguments"],
                call_id=buffered_tool["id"]
            ))

        return formatted_tools
