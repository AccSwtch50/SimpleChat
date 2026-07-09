const list_loading = await import(FLASK_STATIC_JS_URL + "list_loading.js");

if (document.readyState == "loading") {
    document.addEventListener('DOMContentLoaded', auto_load_conversations);
} else {
    auto_load_conversations()
}

function auto_load_conversations() {
    const load_trigger_class = ".more-chats";
    list_loading.auto_load_list(load_trigger_class, load_more_conversations);
}

export function load_more_conversations() {
    const conversation_list = {
        load_more_button_class: ".more-chats",
        auxilary_button_class: ".auxilary-conversation-button",
        item_type_class: ".conversation",
        max_item_fetched: 20,
        container_class: ".conversation-list",
        api_endpoint: "/backend-api/conversations",
        apply_element_function: process_conversations
    }

    list_loading.load_list_function(conversation_list);
}

function process_conversations(element_objects, conversations) {
    const parser = new DOMParser();
    const template_string = "<button class=\"button sidebar-button conversation\"><div class=\"icon-simplechat conversation-icon\"></div><span class=\"button-text\"></span></button>";
    const template = parser.parseFromString(template_string, 'text/html').querySelector("button");

    let template_clone;
    let index;
    for (index = 0; index < conversations.length; index++) {
        const conversation = conversations[index];

        template_clone = template.cloneNode(true);
        template_clone.setAttribute("onclick", `open_conversation("${conversation.id}")`);
        template_clone.querySelector(".button-text").textContent = conversation.name;
        element_objects.list_container.insertBefore(template_clone, element_objects.first_additional_button);
    }
}
