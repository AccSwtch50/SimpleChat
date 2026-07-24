import uuid
import time
import json
import os
from flask import Flask, render_template, request, jsonify, Response, redirect, url_for
from dotenv import load_dotenv
from modules import conversation_manager
from modules import mcp_manager

stream_manager = None
config = {}
models = []
mcp_servers_list = []
conv_manager = None

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

    global conv_manager
    conv_manager = conversation_manager.ConversationManager()

def get_list_with_range(input_list, input_range):
    if (len(input_list) - 1) < input_range:
        return input_list
    return input_list[:input_range]

app = Flask(__name__)

def render_interface():
    return render_template("Interface.html",
        conversations=conv_manager.get_conversations(limit=20),
        models=get_list_with_range(models, 20),
        mcp_servers=get_list_with_range(mcp_servers_list, 20),
        current_model=stream_manager.get_current_model()
    )

current_conversation = conversation_manager.Conversation()

@app.route("/")
def main():
    return render_interface()

@app.route("/c/<conv_id>")
def conversation_page(conv_id):
    conv = conv_manager.switch_conversation(conv_id)
    if not conv:
        return redirect(url_for("main"), code=307)
    return render_interface()


@app.route("/backend-api/conversations")
def get_conversations():
    conversation_offset = 20
    conversation_fetched = 20

    conversation_offset = int(request.headers.get("Item-Offset"))
    conversation_fetched = int(request.headers.get('Max-Item-Fetched'))

    return jsonify(conv_manager.get_conversations(offset=conversation_offset, limit=conversation_fetched))

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

    if conv_manager.current_conversation is None:
        conv_manager.create_conversation_if_not_exist()
    conv_manager.add_user_message(data["message_id"], data["prompt"])

    def stream_with_save():
        yield from stream_manager.generate_reply_stream(data["prompt"], conv_manager.current_conversation)
        conv_manager.save_current_conversation()

    return Response(stream_with_save(), mimetype="application/x-ndjson")

@app.route("/backend-api/get-conversation")
def get_conversation():
    conv_id = request.headers.get("Conversation-ID")
    if not conv_id:
        if not conv_manager.current_conversation: return {}
        return jsonify(conv_manager.current_conversation.to_dict())
    return jsonify(conv_manager.get_conversation(conv_id).to_dict())

@app.route("/backend-api/new-conversation", methods=["POST"])
def new_conversation():
    conversation = conv_manager.create_conversation()
    return jsonify({
        "id": conversation.conv_id,
        "name": conversation.name
    })

@app.route("/backend-api/open-conversation")
def open_conversation():
    conv_id = request.headers.get("Conversation-ID")
    clear_conversation = request.headers.get("Clear-Conv")
    if clear_conversation:
        conv_manager.current_conversation = None
        return {}
    if not conv_id:
        return jsonify({"status": "error", "message": "No conversation ID provided"}), 400
    conv = conv_manager.switch_conversation(conv_id)
    if not conv:
        return jsonify({"status": "error", "message": "Conversation not found"}), 404
    return jsonify(conv.to_dict())

@app.route("/backend-api/delete-conversation", methods=["DELETE"])
def delete_conversation():
    conv_id = request.headers.get("Conversation-ID")
    if not conv_id:
        return jsonify({"status": "error", "message": "No conversation ID provided"}), 400
    conv_manager.delete_conversation(conv_id)
    return jsonify({"status": "success"})

if __name__ == "__main__":
    initialize()
    app.run(debug=True)
