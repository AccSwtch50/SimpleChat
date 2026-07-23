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
models = []
mcp_servers_list = []

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
    global models
    models = stream_manager.get_models()
    global mcp_servers_list
    if not mcp_servers: return
    for mcp_server in mcp_servers.values():
        mcp_servers_list.append(mcp_server.to_dict())
        stream_manager.toggle_mcp_enablement(mcp_server.name)

def get_list_with_range(input_list, input_range):
    if (len(input_list) - 1) < input_range:
        return input_list
    return input_list[:input_range]

app = Flask(__name__)

conversations = []

for index in range(50):
    conversations.append({"id": str(uuid.uuid4()), "name": f"New Chat {index + 1}"})

current_conversation = conversation_manager.Conversation()

@app.route("/")
def main():
    print(models)
    return render_template("Interface.html", conversations=get_list_with_range(conversations, 20), models=get_list_with_range(models, 20), mcp_servers=get_list_with_range(mcp_servers_list, 20), current_model=stream_manager.get_current_model())

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

@app.route("/backend-api/get-model")
def get_current_model():
    return jsonify(stream_manager.get_current_model())

@app.route("/backend-api/set-model", methods=["PUT"])
def set_model():
    requested_model = request.headers.get("Model")
    return jsonify(stream_manager.set_model(requested_model))

@app.route("/backend-api/mcp-servers")
def get_mcp_servers():
    if len(mcp_servers_list) < 20:
        return jsonify([])
    mcp_server_offset = 20
    mcp_server_fetched = 20

    mcp_server_offset = int(request.headers.get("Item-Offset"))
    mcp_server_fetched = int(request.headers.get('Max-Item-Fetched'))
    mcp_server_endstop = min((mcp_server_offset + mcp_server_fetched), len(mcp_servers))

    return jsonify(mcp_servers_list[(mcp_server_offset):mcp_server_endstop])

@app.route("/backend-api/select-mcp", methods=["PUT"])
def select_mcp():
    selected_mcp = request.headers.get("MCP-Name")
    stream_manager.toggle_mcp_enablement(selected_mcp)
    return jsonify(selected_mcp)

@app.route("/backend-api/list_selected_mcps")
def list_selected_mcps():
    return jsonify(stream_manager.enabled_mcps)

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
