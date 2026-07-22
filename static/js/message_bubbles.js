const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");

const assistant_role = "<div class=\"message message-assistant\"><div class=\"message-heading message-assistant\"><div class=\"icon-simplechat assistant-icon model-icon role-icon\"></div><span class=\"role-heading\">AI</span></div><div class=\"message-content message-assistant\"></div></div>";

const user_role = "<div class=\"message message-user\"><div class=\"message-heading message-user\"><span class=\"role-heading\">User</span><div class=\"icon-simplechat user-icon role-icon\"></div></div><div class=\"message-content message-user\"></div></div>";

const hide_reasoning_button = "<button class=\"button hide-reasoning-button\">Reasoning<div class=\"icon-simplechat chevron-down\"></div><div class=\"icon-simplechat chevron-up\"></div></button>";

const chevrons = "<div class=\"chevrons\"><div class=\"icon-simplechat chevron-down\"></div><div class=\"icon-simplechat chevron-up\"></div>";

const tool_icon_str = "<div class=\"icon-simplechat tool-icon\"></div>";

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
        reasoning: "container-reasoning",
        tool: "container-tool"
    }

    let hide_button = null;

    if (type === "reasoning") {
        const parser = new DOMParser();
        const hide_button_base = parser.parseFromString(hide_reasoning_button, 'text/html').querySelector(".hide-reasoning-button");
        hide_button = hide_button_base.cloneNode(true);
        hide_button.setAttribute("onclick", 'toggle_cot_visibility()');
    }

    if (type === "tool") {
        const parser = new DOMParser();
        const hide_button_base = parser.parseFromString(hide_reasoning_button, 'text/html').querySelector(".hide-reasoning-button");
        hide_button = hide_button_base.cloneNode(true);
        hide_button.classList.remove("hide-reasoning-button")
        hide_button.classList.add("toggle-tools-visibility")
        hide_button.firstChild.nodeValue = "Tools";
        hide_button.setAttribute("onclick", 'toggle_tools_visibility()');
        const tool_icon = parser.parseFromString(tool_icon_str, 'text/html').querySelector(".tool-icon");
        hide_button.prepend(tool_icon);
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

export function insert_tool(tool_container, tool_object) {
    if (!tool_object || !tool_object.name) return;
    const parser = new DOMParser();

    const tool_element = document.createElement("div");
    tool_element.classList.add("tool")
    tool_element.setAttribute("tool-id", tool_object.id);

    const full_name = tool_object.name.split("__");

    const tool_label = document.createElement("button");
    tool_label.classList.add("button");
    tool_label.classList.add("transparent-button");
    tool_label.classList.add("tool-name");
    tool_label.textContent = `${full_name[0] || ""} - ${full_name[1] || ""}`;
    const chevrons_element = parser.parseFromString(chevrons, 'text/html').querySelector(".chevrons");
    tool_label.appendChild(chevrons_element);
    tool_label.setAttribute("onclick", 'toggle_tool_visibility()');
    const tool_icon = parser.parseFromString(tool_icon_str, 'text/html').querySelector(".tool-icon");
    tool_label.prepend(tool_icon);
    tool_element.appendChild(tool_label);

    const tool_content_element = document.createElement("div");
    tool_content_element.classList.add("tool-content")

    const tool_result = document.createElement("pre");
    tool_result.classList.add("tool-result");
    tool_content_element.appendChild(tool_result);

    const tool_args_element = document.createElement("div");
    tool_args_element.classList.add("tool-args");
    const tool_arguments = JSON.parse(tool_object.arguments);
    for (const[arg_name, arg_value] of Object.entries(tool_arguments)) {
        insert_tool_argument(tool_args_element, arg_name, arg_value)
    }
    tool_content_element.appendChild(tool_args_element);

    tool_element.appendChild(tool_content_element);
    tool_container.appendChild(tool_element);
    icon_theme_switcher.initialize_icons(icon_theme);
    return tool_element;
}

function insert_tool_argument(tool_args_container, name, value) {
    const tool_argument = document.createElement("div");
    tool_argument.classList.add("tool-argument");

    const name_label = document.createElement("span");
    const value_label = document.createElement("span");
    name_label.classList.add("tool-name-label");
    name_label.textContent = name;
    value_label.classList.add("tool-value-label");
    value_label.textContent = value;

    tool_argument.appendChild(name_label);
    tool_argument.appendChild(value_label);

    tool_args_container.appendChild(tool_argument);
}
