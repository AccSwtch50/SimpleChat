import uuid
import json
from openai import OpenAI

class Message:
    def __init__(self, role, message_id):
        self.role = role;
        self.content = []
        self.message_id = message_id

    def __add_submessage(self, submessage_type, subcontent=""):
        self.content.append({
            "type": submessage_type,
            "content": subcontent
        })

    def add_content(self, submessage_type, subcontent=""):
        if not self.content or self.content[-1]["type"] != submessage_type:
            self.__add_submessage(submessage_type, subcontent)
            return
        self.content[-1]["content"] += subcontent

    def to_dict(self):
        return {
            "role": self.role,
            "content": self.content,
            "message_id": self.message_id
        }

    def to_openai(self):
        content = "".join(submessage["content"] for submessage in self.content if submessage["type"] == "normal")
        reasoning = "".join(submessage["content"] for submessage in self.content if submessage["type"] == "reasoning")

        openai_message = {
            "role": self.role
        }

        if content:
            openai_message["content"] = content
        if reasoning:
            openai_message["reasoning"] = reasoning

        return openai_message

class Conversation:
    def __init__(self, name=None):
        self.conv_id = str(uuid.uuid4())
        self.name = name or "New Chat"
        self.messages = []

    def add_message(self, message):
        self.messages.append(message)

    def to_dict(self):
        output_dict = {
            "id": self.conv_id,
            "name": self.name,
            "messages": []
        }

        for message in self.messages:
            output_dict["messages"].append(message.to_dict())

        return output_dict

    def to_openai(self):
        oai_conversation = []

        for message in self.messages:
            oai_conversation.append(message.to_openai())

        return oai_conversation

class ConversationManager:
    def __init__(self):
        self.conversations = {}

    def create_conversation(self, name=None):
        conv = Conversation(name)
        self.conversations[conv.conv_id] = conv
        return conv

class StreamManager:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.oai_client = None

        if self.api_key:
            self.oai_client = OpenAI(api_key=api_key, base_url=base_url)

    def generate_reply_stream(self, prompt, conversation):
        openai_stream = self.oai_client.chat.completions.create(
            model = "gemma4:31b-cloud",
            reasoning_effort = "medium",
            messages = conversation.to_openai(),
            stream = True
        )

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

class SC_Chunk:
    def __init__(self, chunk):
        delta = chunk.choices[0].delta

        message_types = {
            "reasoning": "reasoning",
            "normal": "content"
        }

        delta_type = "normal"
        delta_content = ""

        for message_type in message_types.keys():
            delta_content = getattr(delta, message_types[message_type], None)
            if delta_content is None: continue
            delta_type = message_type
            break

        self.chunk_type = delta_type
        self.chunk_content = delta_content
