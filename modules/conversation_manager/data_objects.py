from .message_content_types import MessageContent, ToolCallAssembler, ToolCall

class Message:
    def __init__(self, role, message_id, tool_calls=None):
        self.role = role
        self.content = MessageContent()
        self.message_id = message_id
        self.tool_calls = tool_calls or []

        self._tool_asm = ToolCallAssembler()

    def add_content(self, submessage_type, subcontent=""):
        if subcontent is None: return

        if submessage_type == "tool":
            self._tool_asm.add_delta(subcontent)
            self.tool_calls = self._tool_asm.to_list()
            return

        self.content.append(submessage_type, subcontent)

    def to_dict(self):
        return {
            "role": self.role,
            "content": self.content.to_list(),
            "message_id": self.message_id,
            "tools_calls": [tool_call.to_dict() for tool_call in self.tool_calls]
        }

    def to_openai(self):
        messages = []

        openai_message = {"role": self.role}
        content = self.content.get_text("normal")

        if content:
            openai_message["content"] = content

        if self.role != "assistant":
            messages.append(openai_message)
            return messages

        reasoning = self.content.get_text("reasoning")
        if reasoning:
            openai_message["reasoning"] = reasoning

        if not self.tool_calls:
            messages.append(openai_message)
            return messages

        openai_message["tool_calls"] = []
        tool_role_messages = []
        for tool_call in self.tool_calls:
            openai_message["tool_calls"].append(tool_call.to_openai())
            if tool_call.result_content is None:
                continue
            tool_role_messages.append({"role": "tool", "tool_call_id": tool_call.call_id, "content": tool_call.result_content})

        messages.append(openai_message)
        messages.extend(tool_role_messages)

        return messages

class SC_Chunk:
    def __init__(self, chunk):
        delta_type = "normal"
        delta_content = ""

        try:
            delta = chunk.choices[0].delta
        except:
            self.chunk_type = delta_type
            self.chunk_content = delta_content
            return

        message_types = {
            "tool": "tool_calls",
            "reasoning": "reasoning",
            "normal": "content"
        }

        for message_type in message_types.keys():
            delta_content = getattr(delta, message_types[message_type], None)
            if delta_content is None: continue
            delta_type = message_type
            break

        if delta_content is None: delta_content = ""

        self.chunk_type = delta_type
        if delta_type != "tool":
            self.chunk_content = delta_content
            return

        self.chunk_content = {}
        for tool_call in delta.tool_calls:
            index = tool_call.index
            self.chunk_content[index] = self._parse_tool_call(tool_call, index)



    def _parse_tool_call(self, tool_call, tool_call_index):
        tool_call_content = {
            "id": getattr(tool_call, "id", None),
            "name": None,
            "arguments": None
        }

        if not getattr(tool_call, "function", None):
            return tool_call_content

        if getattr(tool_call.function, "name", None):
            tool_call_content["name"] = tool_call.function.name

        if getattr(tool_call.function, "arguments", None):
            tool_call_content["arguments"] = tool_call.function.arguments

        return tool_call_content
