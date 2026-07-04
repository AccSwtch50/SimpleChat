import uuid
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

conversations = []

for index in range(50):
    conversations.append({"id": str(uuid.uuid4()), "name": f"New Chat {index + 1}"})

models = []

for index in range(50):
    models.append({"name": f"model_{index + 1}", "friendly_name": f"Model {index + 1}"})

@app.route("/")
def main():
    return render_template("Interface.html", conversations=conversations[:20], models=models)

@app.route("/backend-api/conversations")
def get_conversations():
    conversation_offset = 20
    conversation_fetched = 20

    conversation_offset = int(request.headers.get("Conversation-Offset"))
    conversation_fetched = int(request.headers.get('Conversation-Fetched'))
    conversation_endstop = conversation_offset + conversation_fetched

    return jsonify(conversations[(conversation_offset):min(conversation_endstop, len(conversations))])

if __name__ == "__main__":
    app.run(debug=True)
