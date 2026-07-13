const message_bubbles = await import(FLASK_STATIC_JS_URL + "message_bubbles.js");

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
    message_bubbles.insert_message_container("container-message", user_message_bubble).textContent = message_text;

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

        process_message_deltas(lines, assistant_message_bubble, stream_state);
    }
}

function handle_stream_failure(assistant_message_bubble) {
    if (assistant_message_bubble) assistant_message_bubble.remove();
    throw new Error("Streaming error");
}

function process_message_deltas(deltas, message_bubble, stream_state) {
    for (const delta of deltas) {

        if (delta.trim() === "") continue;
        const parsed_delta = JSON.parse(delta);
        const structured_delta = structure_delta(parsed_delta);

        message_bubble.setAttribute("message-id", parsed_delta.message_id);

        const delta_type = structured_delta.delta_type;
        console.log(delta_type + " " + stream_state.last_delta_type);
        if (delta_type !== stream_state.last_delta_type) stream_state.message_container = message_bubbles.insert_message_container(delta_type, message_bubble);

        stream_state.message_container.textContent += structured_delta.delta_message;
        stream_state.last_delta_type = delta_type;
    }
}

function structure_delta(delta, message_bubble) {
    let delta_type;
    let delta_message;
    const message_types = {
        "container-message": delta.message_delta,
        "container-reasoning": delta.reasoning_delta
    }

    for (const message_type in message_types) {
        if (message_types[message_type] === "") continue;
        delta_type = message_type;
        delta_message = message_types[message_type];
    }

    const structured_delta = {
        delta_type: delta_type,
        delta_message: delta_message
    }
    return structured_delta;
}
