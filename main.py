import uuid
from flask import Flask, render_template

app = Flask(__name__)

conversations = []

for index in range(50):
    conversations.append({"id": str(uuid.uuid4()), "name": f"New Chat {index + 1}"})

@app.route("/")
def main():
    return render_template("Interface.html", conversations=conversations[:20])

if __name__ == "__main__":
    app.run(debug=True)
