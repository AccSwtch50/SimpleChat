const message_bubbles = await import(FLASK_STATIC_JS_URL + "message_bubbles.js");

const conversation_container = document.querySelector(".conversation-content");

function load_submessages(message_bubble, message) {
    const submessages = message.content;

    let text_container;
    for (const submessage of submessages) {
        if (!submessage.content) continue;

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

export async function open_conversation(conversation_id="", clear_conversation=false) {
    conversation_container.textContent = "";

    if (conversation_id) {
        history.pushState({conv_id: conversation_id}, "", `/c/${conversation_id}`);
    } else {
        history.replaceState({}, "", "/");
    }

    const response = await fetch("/backend-api/open-conversation", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Conversation-Id": conversation_id,
            "Clear-Conv": clear_conversation
        }
    })

    if (!response.ok) {
        console.error(response);
        return;
    }

    const conversation = await response.json();

    if (!conversation || !conversation.messages) return;

    let last_role = null;
    let message_bubble;

    for (const message of conversation.messages) {
        message_bubble = conversation_container.lastElementChild;
        if (message.role !== last_role) {
            const message_template = message_bubbles.get_message_object(message.role);
            message_bubble = message_bubbles.insert_message_bubble(message_template, message.message_id);
        }
        load_submessages(message_bubble, message);
        last_role = message.role;
    }
}

window.open_conversation = open_conversation;

window.new_chat = function() {
    open_conversation("", true);
}

window.addEventListener("popstate", () => {
    const match = window.location.pathname.match(/^\/c\/(.+)$/);
    open_conversation(match ? match[1] : "");
});
