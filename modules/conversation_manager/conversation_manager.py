import uuid
import json
from .data_objects import ToolCall, Message, SC_Chunk

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
            oai_conversation.extend(message.to_openai())

        return oai_conversation

class ConversationManager:
    def __init__(self):
        self.conversations = {}

    def create_conversation(self, name=None):
        conv = Conversation(name)
        self.conversations[conv.conv_id] = conv
        return conv

