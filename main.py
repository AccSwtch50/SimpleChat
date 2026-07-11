import uuid
from flask import Flask, render_template, request, jsonify

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

    user_prompt = data["prompt"];

    response = {
        "response": user_prompt
    }

    return jsonify(response);

if __name__ == "__main__":
    app.run(debug=True)
