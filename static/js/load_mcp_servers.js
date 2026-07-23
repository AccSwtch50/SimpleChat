const list_loading = await import(FLASK_STATIC_JS_URL + "list_loading.js");

if (document.readyState == "loading") {
    document.addEventListener('DOMContentLoaded', auto_load_mcp_servers);
} else {
    auto_load_mcp_servers()
}

function auto_load_mcp_servers() {
    const load_trigger_class = ".mcp-tool.load-trigger";
    list_loading.auto_load_list(load_trigger_class, load_more_mcp_servers);
}

export function load_more_mcp_servers() {
    const mcp_list = {
        load_more_button_class: ".mcp-tool.load-trigger",
        auxilary_button_class: ".mcp-tool.auxilary",
        item_type_class: ".mcp-tool",
        max_item_fetched: 20,
        container_class: ".mcp-list",
        api_endpoint: "/backend-api/mcp-servers",
        apply_element_function: process_mcp_servers
    }

    list_loading.load_list_function(mcp_list);
}

function process_mcp_servers(element_objects, mcp_servers) {
    const parser = new DOMParser();
    const template_string = "<button class=\"button transparent-button mcp-tool\">{{ mcp_server.friendly_name }}</button>";
    const template = parser.parseFromString(template_string, 'text/html').querySelector("button");
    const checkbox_string = "<div class=\"checkbox mcp-checkbox\"><div class=\"icon-simplechat checkbox-icon\"></div></div>"
    const checkbox = parser.parseFromString(checkbox_string, 'text/html').querySelector(".mcp-checkbox");

    let template_clone;
    let checkbox_clone;
    let index;
    for (index = 0; index < mcp_servers.length; index++) {
        const mcp_server = mcp_servers[index];

        template_clone = template.cloneNode(true);
        template_clone.setAttribute("mcp_name", mcp_server.name);
        template_clone.setAttribute("onclick", `select_mcp("${mcp_server.name}")`);
        template_clone.textContent = mcp_server.friendly_name;
        checkbox_clone = checkbox.cloneNode(true);
        template_clone.prepend(checkbox_clone);
        element_objects.list_container.insertBefore(template_clone, element_objects.first_additional_button);
    }
}

window.load_more_mcp_servers = load_more_mcp_servers;
