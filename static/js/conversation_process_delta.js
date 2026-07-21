const message_bubbles = await import(FLASK_STATIC_JS_URL + "message_bubbles.js");

export function process_message_deltas(deltas, message_bubble, stream_state) {
    for (const delta of deltas) {

        if (delta.trim() === "") continue;
        const parsed_delta = JSON.parse(delta);

        message_bubble.setAttribute("message-id", parsed_delta.message_id);

        const delta_type = parsed_delta.message_type;
        if (delta_type === "tool") {
            console.log(parsed_delta)
            stream_state.last_delta_type = delta_type;
            continue
        }

        if (delta_type !== stream_state.last_delta_type) stream_state.message_container = message_bubbles.insert_message_container(delta_type, message_bubble);

        stream_state.message_container.textContent += parsed_delta.message_delta;
        stream_state.last_delta_type = delta_type;
    }
}
