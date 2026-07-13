const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");

const assistant_role = "<div class=\"message message-assistant\"><div class=\"message-heading message-assistant\"><div class=\"icon-simplechat assistant-icon model-icon role-icon\"></div><span class=\"role-heading\">AI</span></div><div class=\"message-content message-assistant\"></div></div>";

const user_role = "<div class=\"message message-user\"><div class=\"message-heading message-user\"><span class=\"role-heading\">User</span><div class=\"icon-simplechat user-icon role-icon\"></div></div><div class=\"message-content message-user\"></div></div>"

const conversation_container = document.querySelector(".conversation-content");

export function get_message_object(role) {
    const roles = {
        assistant: assistant_role,
        user: user_role
    };
    return roles[role];
}

export function insert_message_bubble(html_string, message="", message_id="0") {
    const parser = new DOMParser();
    const template_base = parser.parseFromString(html_string, 'text/html').querySelector(".message");
    const template = template_base.cloneNode(true);

    template.querySelector(".message-content").textContent = message;
    template.setAttribute("message-id", message_id);
    conversation_container.appendChild(template);

    icon_theme_switcher.initialize_icons(icon_theme);

    return template;
}

/*export append_message_bubble(message_id, message="") {

}*/
