const message_bubbles = await import(FLASK_STATIC_JS_URL + "message_bubbles.js");

const conversation_container = document.querySelector(".conversation-content");

export async function open_conversation(conversation_id="") {
    conversation_container.textContent = "";

    const response = await fetch("/backend-api/get-conversation", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Conversation-Id": conversation_id
        }
    })

    if (!response.ok) console.error(response);

    const messages = await response.json();
    if (messages == "") return;

    for (const message of messages) {
        const message_template = message_bubbles.get_message_object(message.role);
        message_bubbles.insert_message_bubble(message_template, message.message, message.message_id)
    }
}

window.open_conversation = open_conversation;
