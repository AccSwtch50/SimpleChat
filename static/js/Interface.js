const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");
globalThis.icon_theme = icon_theme_switcher.get_theme_object("fontawesome");
icon_theme_switcher.setup_icons(icon_theme);

const load_conversations = await import(FLASK_STATIC_JS_URL + "load_conversations.js");
window.load_more_conversations = load_conversations.load_more_conversations;

const load_models = await import(FLASK_STATIC_JS_URL + "load_models.js");
const load_mcp_servers = await import(FLASK_STATIC_JS_URL + "load_mcp_servers.js");

const script_template = document.createElement("script");
script_template.type = "text/javascript";

const external_scripts = [
	"dropdown.js"
];

external_scripts.forEach(script => {
	script_template.src = FLASK_STATIC_JS_URL + script;
	document.querySelector("head").append(script_template.cloneNode(true));
});
