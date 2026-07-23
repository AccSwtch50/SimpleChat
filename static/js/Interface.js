const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");
globalThis.icon_theme = icon_theme_switcher.get_theme_object("lucide");
icon_theme_switcher.setup_icons(icon_theme);

const load_conversations = await import(FLASK_STATIC_JS_URL + "load_conversations.js");
window.load_more_conversations = load_conversations.load_more_conversations;

const load_models = await import(FLASK_STATIC_JS_URL + "load_models.js");
const load_mcp_servers = await import(FLASK_STATIC_JS_URL + "load_mcp_servers.js");

const conversation_js = await import(FLASK_STATIC_JS_URL + "conversation.js");

const load_conversation = await import(FLASK_STATIC_JS_URL + "load_conversation.js");
await load_conversation.open_conversation()

/*const ai_role_string = message_bubbles.get_message_object("assistant_role");
const human_role_string = message_bubbles.get_message_object("user_role");

message_bubbles.insert_message_bubble(human_role_string, "What's your favorite food?");
message_bubbles.insert_message_bubble(ai_role_string, "My favorite food is pizza.");*/

const script_template = document.createElement("script");
script_template.type = "text/javascript";

const external_scripts = [
	"dropdown.js",
	"reasoning_visibility_toggle.js",
	"tool_visibility_toggle.js",
	"tools_visibility_toggle.js"
];

external_scripts.forEach(script => {
	script_template.src = FLASK_STATIC_JS_URL + script;
	document.querySelector("head").append(script_template.cloneNode(true));
});

async function set_model_dropdown_label() {
	const response = await fetch("/backend-api/get-model", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	});

	if (!response.ok) throw new Error('Network response error');

	const model_name = await response.json();

	const model_dropdown = document.querySelector(".model-dropdown");
	const model_label = model_dropdown.querySelector(".button-text");

	model_label.textContent = model_name;
}

async function model_select(model) {
	const response = await fetch("/backend-api/set-model", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Model": model
		}
	});

	if (!response.ok) throw new Error('Network response error');

	const parsed_response = await response.json();

	if (parsed_response === "Model cannot be set") {
		throw new Error('Model unable to be set');
	}

	await set_model_dropdown_label();
}

window.model_select = model_select
