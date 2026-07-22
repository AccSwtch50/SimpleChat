const message_bubbles = await import(FLASK_STATIC_JS_URL + "message_bubbles.js");

const conversation_container = document.querySelector(".conversation-content");

function load_submessages(message_bubble, message) {
    const submessages = message.content;

    let text_container;
    for (const submessage of submessages) {
        text_container = message_bubbles.insert_message_container(submessage.type, message_bubble);
        if (submessage.type === "tool") {
            handle_tool(text_container, submessage.content);
            continue;
        }
        text_container.textContent = submessage.content;
    }
}

function handle_tool(tools_container, tools) {
    for (const tool of tools) {
        const tool_container = message_bubbles.insert_tool(tools_container, {
            id: tool.call_id,
            name: tool.name,
            arguments: tool.arguments
        });

        if (!tool.result) {
            continue;
        }

        const result_element = tool_container.querySelector(".tool-result");
        result_element.textContent = tool.result;
    }
}

export async function open_conversation(conversation_id="") {
    conversation_container.textContent = "";

    const response = await fetch("/backend-api/get-conversation", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Conversation-Id": conversation_id
        }
    })

    if (!response.ok) {
        console.error(response);
        return;
    }

    const conversation = await response.json();

    if (!conversation || !conversation.messages) return;

    for (const message of conversation.messages) {
        const message_template = message_bubbles.get_message_object(message.role);
        const message_bubble = message_bubbles.insert_message_bubble(message_template, message.message_id);
        load_submessages(message_bubble, message);
    }
}

window.open_conversation = open_conversation;
