const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");

export function load_more_conversations() {
    const additional_buttons = document.querySelectorAll(".auxilary-conversation-button");
    const first_additional_button = additional_buttons[0];
    const conversation_offset = document.querySelectorAll(".conversation").length - additional_buttons.length;
    const conversation_fetched = 20;

    const parser = new DOMParser();
    const template_string = "<button class=\"button sidebar-button conversation\"><div class=\"icon-simplechat conversation-icon\"></div><span class=\"button-text\"></span></button>";
    const template = parser.parseFromString(template_string, 'text/html').querySelector("button");

    const conversations_string = fetch("/backend-api/conversations", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Conversation-Offset": conversation_offset,
            "Conversation-Fetched": conversation_fetched
        }
    })
    .then(conversations_string => conversations_string.json())
    .then(conversations => {
        let template_clone;
        let index;
        for (index = 0; index < conversations.length; index++) {
            const conversation = conversations[index];
            template_clone = template.cloneNode(true);
            template_clone.setAttribute("onclick", `open_conversation("${conversation.id}")`);
            template_clone.querySelector(".button-text").textContent = conversation.name;
            document.querySelector(".conversation-list").insertBefore(template_clone, first_additional_button);
        }
        icon_theme_switcher.initialize_icons(icon_theme);
    })
    .catch(error => console.error("Error:", error));
}
