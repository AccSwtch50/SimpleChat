import uuid
import time
import json
import os
from flask import Flask, render_template, request, jsonify, Response
from openai import OpenAI

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "sk-PlaceholderAPIKey")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

oai_client = OpenAI(
    api_key=OPENAI_API_KEY,
    base_url=OPENAI_BASE_URL
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

current_conversation = []

def simplechat_to_openai(conversation):
    openai_conversation = []

    for message in conversation:
        openai_conversation.append({
            "role": message["role"].lower(),
            "content": message["message"]
        })
    return openai_conversation

def generate_reply_stream(prompt, message_id):
    openai_stream = oai_client.chat.completions.create(
        model = "gpt-5.6-luna",
        messages = simplechat_to_openai(current_conversation),
        stream = True
    )
    assistant_full_message = ""

    message_id = str(uuid.uuid4())

    for chunk in openai_stream:
        try:
            message_delta = chunk.choices[0].delta.content
        except:
            continue
        if not message_delta:
            continue

        assistant_full_message += message_delta
        response_data = {
            "message_id": message_id,
            "message_delta": message_delta
        }
        yield json.dumps(response_data) + "\n"
    current_conversation.append({
        "role": "Assistant",
        "message": assistant_full_message,
        "message_id": message_id
    })
    print(current_conversation)

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

    current_conversation.append({
        "role": "User",
        "message": data["prompt"],
        "message_id": data["message_id"]
    })

    return Response(generate_reply_stream(data["prompt"], data["message_id"]), mimetype="application/x-ndjson")

if __name__ == "__main__":
    app.run(debug=True)
