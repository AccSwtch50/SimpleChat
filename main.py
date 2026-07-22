import uuid
import time
import json
import os
from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv
from modules import conversation_manager
from modules import mcp_manager

stream_manager = None
config = {}

def load_config():
    if not os.path.exists("config.json"):
        return
    global config
    with open("config.json", "r") as config_file:
        config = json.load(config_file)



def initialize():
    load_dotenv()
    load_config()
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "sk-PlaceholderAPIKey")
    OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
    mcp_servers = mcp_manager.parse_config(config["mcp_servers"]) if config["mcp_servers"] else None
    global stream_manager
    stream_manager = conversation_manager.StreamManager(
        api_key=OPENAI_API_KEY,
        base_url=OPENAI_BASE_URL,
        mcp_servers=mcp_servers
    )

app = Flask(__name__)

conversations = []

for index in range(50):
    conversations.append({"id": str(uuid.uuid4()), "name": f"New Chat {index + 1}"})

models = []

for index in range(50):
    models.append({"name": f"model_{index + 1}", "friendly_name": f"Model {index + 1}"})

mcp_servers = []

for index in range(50):
    mcp_servers.append({"name": f"mcp_{index + 1}", "friendly_name": f"MCP {index + 1}"})

current_conversation = conversation_manager.Conversation()

@app.route("/")
def main():
    return render_template("Interface.html", conversations=conversations[:20], models=models[:20], mcp_servers=mcp_servers[:20])

@app.route("/backend-api/conversations")
def get_conversations():
    conversation_offset = 20
    conversation_fetched = 20

    conversation_offset = int(request.headers.get("Item-Offset"))
    conversation_fetched = int(request.headers.get('Max-Item-Fetched'))
    conversation_endstop = min((conversation_offset + conversation_fetched), len(conversations))

    return jsonify(conversations[(conversation_offset):conversation_endstop])

@app.route("/backend-api/models")
def get_models():
    model_offset = 20
    model_fetched = 20

    model_offset = int(request.headers.get("Item-Offset"))
    model_fetched = int(request.headers.get('Max-Item-Fetched'))
    model_endstop = min((model_offset + model_fetched), len(models))

    return jsonify(models[(model_offset):model_endstop])

@app.route("/backend-api/mcp-servers")
def get_mcp_servers():
    mcp_server_offset = 20
    mcp_server_fetched = 20

    mcp_server_offset = int(request.headers.get("Item-Offset"))
    mcp_server_fetched = int(request.headers.get('Max-Item-Fetched'))
    mcp_server_endstop = min((mcp_server_offset + mcp_server_fetched), len(mcp_servers))

    return jsonify(mcp_servers[(mcp_server_offset):mcp_server_endstop])

@app.route("/backend-api/send_message", methods=["POST"])
def send_message():
    data = request.get_json()

    if not data or "prompt" not in data:
        return jsonify({"status": "error", "message": "No message received"}), 400

    user_message = conversation_manager.Message(role="user", message_id=data["message_id"])
    user_message.add_content("normal", data["prompt"])
    current_conversation.add_message(user_message)

    return Response(stream_manager.generate_reply_stream(data["prompt"], current_conversation), mimetype="application/x-ndjson")

@app.route("/backend-api/get-conversation")
def get_conversation():
    return jsonify(current_conversation.to_dict())

if __name__ == "__main__":
    initialize()
    app.run(debug=True)
