from . import DatabaseWriter
import json

class ConvDBInterface:
    def __init__(self, db_path):
        self.db_writer = DatabaseWriter(db_path)
        self._init_db()

    def _init_db(self):
        self.db_writer.run("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.db_writer.run("""\
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sequence INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        """)

    def load(self, conv_id):
        conv_row = self.db_writer.query("SELECT id, name FROM conversations WHERE id = ?", (conv_id,))
        if not conv_row: return None

        conversation_dict = {
            "id": conv_row["id"],
            "name": conv_row["name"],
            "messages": []
        }

        message_rows = self.db_writer.queryall("SELECT role, id, content FROM messages WHERE conversation_id = ? ORDER BY sequence ASC", (conv_id,))

        for message in message_rows:
            message_dict = {
                "role": message["role"],
                "message_id": message["id"],
                "content": json.loads(message["content"])
            }
            conversation_dict["messages"].append(message_dict)

        return conversation_dict

    def save(self, conv):
        statements = [
            ("UPDATE conversations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conv.name, conv.conv_id)),
            ("DELETE FROM messages WHERE conversation_id = ?", (conv.conv_id,))
        ]

        for sequence, message in enumerate(conv.to_dict()["messages"]):
            statements.append(("INSERT INTO messages (id, conversation_id, role, content, sequence) VALUES (?, ?, ?, ?, ?)",(
                message["message_id"],
                conv.conv_id,
                message["role"],
                json.dumps(message["content"]),
                sequence)
            ))

        self.db_writer.runmany(statements)
