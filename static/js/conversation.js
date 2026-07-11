window.send_prompt = function() {
    const input_textarea = document.querySelector(".prompt-input");
    const message_text = input_textarea.value.trim();

    if (!message_text) {
        console.warn("Cannot send empty message.");
        return;
    }

    try {
        send_prompt_to_api(message_text);
    } catch (error) {
        console.error("Failed sending message:", error);
        alert("Failed to send prompt, check browser console for details.")
    }
}

function send_prompt_to_api(message_text) {
    const response = fetch("/backend-api/send_message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({prompt: message_text})
    })
    .then(response_json => response_json.json())
    .then(response => {
        console.log(response);
    })
}
