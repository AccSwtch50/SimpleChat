export async function detect_enabled_mcps() {
    for (const mcp_entry of document.querySelectorAll(".mcp-tool")) {
        const checkbox_icon = mcp_entry.querySelector(".checkbox-icon")
        if (!checkbox_icon) continue;
        checkbox_icon.classList.remove("enabled");
    }

    const response = await fetch("/backend-api/list_selected_mcps", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) throw new Error('Network response error');

    const enabled_servers = await response.json();

    for (const enabled_server of enabled_servers) {
        const mcp_entry_element = document.querySelector(`[mcp_name="${enabled_server}"]`);

        if (!mcp_entry_element) continue;

        mcp_entry_element.querySelector(".checkbox-icon").classList.add("enabled");
    }
}

async function select_mcp(server_name) {
    const response = await fetch("/backend-api/select-mcp", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "MCP-Name": server_name
        }
    });

    if (!response.ok) throw new Error('Network response error');

    const parsed_response = await response.json();

    if (parsed_response !== server_name) throw new Error('Network response error');

    detect_enabled_mcps()
}

window.select_mcp = select_mcp
