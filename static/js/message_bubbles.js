const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");

const assistant_role = "<div class=\"message message-assistant\"><div class=\"message-heading message-assistant\"><div class=\"icon-simplechat assistant-icon model-icon role-icon\"></div><span class=\"role-heading\">AI</span></div><div class=\"message-content message-assistant\"></div></div>";

const user_role = "<div class=\"message message-user\"><div class=\"message-heading message-user\"><span class=\"role-heading\">User</span><div class=\"icon-simplechat user-icon role-icon\"></div></div><div class=\"message-content message-user\"></div></div>"

const hide_reasoning_button = "<button class=\"button hide-reasoning-button\">Reasoning<div class=\"icon-simplechat chevron-down\"></div><div class=\"icon-simplechat chevron-up\"></div></button>"

const conversation_container = document.querySelector(".conversation-content");

export function get_message_object(role) {
    const roles = {
        assistant: assistant_role,
        user: user_role
    };
    return roles[role];
}

export function insert_message_bubble(html_string, message_id="0") {
    const parser = new DOMParser();
    const template_base = parser.parseFromString(html_string, 'text/html').querySelector(".message");
    const template = template_base.cloneNode(true);

    template.setAttribute("message-id", message_id);
    conversation_container.appendChild(template);

    icon_theme_switcher.initialize_icons(icon_theme);

    return template;
}

export function insert_message_container(type, message_bubble) {
    const message_types = {
        normal: "container-message",
        reasoning: "container-reasoning"
    }

    let hide_button = null;

    if (type === "reasoning") {
        const parser = new DOMParser();
        const hide_button_base = parser.parseFromString(hide_reasoning_button, 'text/html').querySelector(".hide-reasoning-button");
        hide_button = hide_button_base.cloneNode(true);
        hide_button.setAttribute("onclick", 'toggle_cot_visibility()');
    }

    const final_type = message_types[type];

    const container = document.createElement("div");
    container.classList.add("content-container");
    container.classList.add(final_type);

    if (hide_button !== null) container.appendChild(hide_button);

    const text_container = document.createElement("div");
    text_container.classList.add("content-text");

    container.appendChild(text_container);
    message_bubble.querySelector(".message-content").appendChild(container);
    icon_theme_switcher.initialize_icons(icon_theme);
    return text_container;
}
