import uuid
import json
from .data_objects import ToolCall, Message, SC_Chunk
from ..database_manager.conversation_interface import ConvDBInterface

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

    @classmethod
    def from_dict(cls, data):
        conversation = cls(name=data.get("name"))
        conversation.conv_id = data.get("id", conversation.conv_id)
        for message_data in data.get("messages", []):
            conversation.messages.append(Message.from_dict(message_data))
        return conversation

    def to_openai(self):
        oai_conversation = []

        for message in self.messages:
            oai_conversation.extend(message.to_openai())

        return oai_conversation

class ConversationManager:
    def __init__(self, db_path="conversations.db"):
        self.db_path = db_path
        self._db_interface = ConvDBInterface(db_path)
        self._db_writer = self._db_interface.db_writer
        self.current_conversation = None

    def create_conversation_if_not_exist(self):
        if self.current_conversation is None:
            self.create_conversation()
            return True
        return False

    def create_conversation(self, name=None):
        conversation = Conversation(name)
        self._db_writer.run("INSERT INTO conversations (id, name) VALUES (?, ?)", (conversation.conv_id, conversation.name))
        self.current_conversation = conversation
        return conversation

    def switch_conversation(self, conversation_id):
        conversation_dict = self._db_interface.load(conversation_id)
        if not conversation_dict:
            return None
        self.current_conversation = Conversation.from_dict(conversation_dict)
        return self.current_conversation

    def get_conversation(self, conversation_id):
        conversation_dict = self._db_interface.load(conversation_id)
        if not conversation_dict:
            return None
        conversation = Conversation.from_dict(conversation_dict)
        return conversation

    def delete_conversation(self, conversation_id):
        if self.current_conversation.conv_id == conversation_id:
            self.current_conversation = None

        self._db_writer.runmany([
            ("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,)),
            ("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        ])

    def rename_conversation(self, conversation_id, name):
        self._db_writer.run("UPDATE conversations SET name = ? WHERE id = ?", (name, conversation_id))

    def get_conversations(self, offset=0, limit=20):
        conversations = self._db_writer.queryall("SELECT id, name FROM conversations ORDER BY updated_at DESC LIMIT ? OFFSET ?", (limit, offset))

        conversations_list = []
        for conversation in conversations:
            conversation_dict = {
                "id": conversation["id"],
                "name": conversation["name"],
            }
            conversations_list.append(conversation_dict)
        return conversations_list

    def add_user_message(self, message_id, prompt):
        message = Message(role="user", message_id=message_id)
        message.add_content("normal", prompt)
        self.current_conversation.add_message(message)
        return message

    def save_current_conversation(self):
        if self.current_conversation is None:
            return
        self._db_interface.save(self.current_conversation)

