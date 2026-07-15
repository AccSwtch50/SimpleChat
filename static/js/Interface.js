const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");
globalThis.icon_theme = icon_theme_switcher.get_theme_object("breeze");
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
	"reasoning_visibility_toggle.js"
];

external_scripts.forEach(script => {
	script_template.src = FLASK_STATIC_JS_URL + script;
	document.querySelector("head").append(script_template.cloneNode(true));
});
