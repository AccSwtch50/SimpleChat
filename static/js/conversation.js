const message_bubbles = await import(FLASK_STATIC_JS_URL + "message_bubbles.js");
const process_deltas = await import(FLASK_STATIC_JS_URL + "conversation_process_delta.js");
const load_conversations_js = await import(FLASK_STATIC_JS_URL + "load_conversations.js");
const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");

if (document.readyState == "loading") {
    document.addEventListener('DOMContentLoaded', observe_keyboard);
} else {
    observe_keyboard();
}

function observe_keyboard() {
    const prompt_button = document.querySelector(".prompt-button");
    const input_textarea = document.querySelector(".prompt-input");

    if (!input_textarea) return;

    input_textarea.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        if (prompt_button.disabled) return;
        window.send_prompt();
    });
}

window.send_prompt = async function() {
    const input_textarea = document.querySelector(".prompt-input");
    const prompt_button = document.querySelector(".prompt-button");
    const message_text = input_textarea.value.trim();

    if (!message_text) {
        console.warn("Cannot send empty message.");
        return;
    }

    prompt_button.disabled = true;

    let message_id = self.crypto.randomUUID();
    const user_message_bubble = message_bubbles.insert_message_bubble(message_bubbles.get_message_object("user"), message_id)
    message_bubbles.insert_message_container("normal", user_message_bubble).textContent = message_text;

    const temporary_input_value = input_textarea.value;
    input_textarea.value = "";

    try {
        await send_prompt_to_api(message_text, message_id);
    } catch (error) {
        console.error("Failed sending message:", error);
        input_textarea.value = temporary_input_value;
        user_message_bubble.remove();
        alert("Failed to send prompt, check browser console for details.");
    } finally {
        prompt_button.disabled = false;
    }
}

async function send_prompt_to_api(message_text, message_id) {
    const response = await fetch("/backend-api/send_message", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({prompt: message_text, message_id: message_id})
    });

    if (!response.ok) throw new Error('Network response error');

    const assistant_message_bubble = message_bubbles.insert_message_bubble(message_bubbles.get_message_object("assistant"))

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const stream_state = {
        last_delta_type: null,
        message_container: null
    };

    while (true) {
        const {value, done} = await reader.read();

        if (done && buffer.trim()) handle_stream_failure(assistant_message_bubble);
        if (done) break;

        buffer += decoder.decode(value, {stream: true});
        const lines = buffer.split("\n");
        buffer = lines.pop();

        process_deltas.process_message_deltas(lines, assistant_message_bubble, stream_state);
    }
}

function handle_stream_failure(assistant_message_bubble) {
    if (assistant_message_bubble) assistant_message_bubble.remove();
    throw new Error("Streaming error");
}

async function create_conversation_if_nonexistent() {
    let response = await fetch("/backend-api/get-conversation", {
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

    let conversation = await response.json();

    if (conversation) return;

    response = await fetch("/backend-api/new-conversation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })

    if (!response.ok) {
        console.error(response);
        return;
    }

    conversation = await response.json();

    history.pushState({conv_id: conversation.id}, "", `/c/${conversation.id}`);
    conversation_element = load_conversations_js.construct_conversation_element(conversation);
    conversation_list_element = document.querySelector(".conversation-list")
    conversation_list_element.prepend(conversation_element);
    icon_theme_switcher.initialize_icons(icon_theme);
    return conversation;
}
