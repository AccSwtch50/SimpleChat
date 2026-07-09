const injected_resources = new Set();

function inject_css(href) {
	if (injected_resources.has(href)) return;
	const css_snippet = document.createElement("link");
	css_snippet.rel = "stylesheet";
	css_snippet.type = "text/css";
	css_snippet.href = href;
	document.querySelector("head").append(css_snippet);
	injected_resources.add(href);
}

function inject_js(source, cross_origin = null) {
	if (injected_resources.has(source)) return;
	const js_snippet = document.createElement("script");
	js_snippet.src = source;
	if (cross_origin) {
		js_snippet.crossOrigin = cross_origin;
	}
	document.querySelector("head").append(js_snippet);
	injected_resources.add(source);
}

function process_resources(icon_theme) {
	if (!icon_theme) return;

	if (icon_theme.css_resources) {
		icon_theme.css_resources.forEach(href => inject_css(href));
	}

	if (icon_theme.js_resources) {
		icon_theme.js_resources.forEach(resource => inject_js(resource.source, resource.cross_origin));
	}
}

const lucide = {
	name: "lucide",
	icon_type: "svg",
	new_chat_string: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>',
	conversation_icon_string: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-icon lucide-message-square"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>',
	model_icon_string: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-icon lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
	dropdown_icon_string: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>',
	prompt_button_icon_string: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-icon lucide-send"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
	user_icon_string: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-icon lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>'
}

const breeze = {
	name: "breeze",
	css_resources: ["https://cdn.kde.org/breeze-icons/icons.css"],
	icon_type: "i",
	new_chat_string: '<i class="icon icon_list-add"></i>',
	conversation_icon_string: '<i class="icon icon_dialog-messages"></i>',
	model_icon_string: '<i class="icon icon_flower-shape"></i>',
	dropdown_icon_string: '<i class="icon icon_go-down"></i>',
	prompt_button_icon_string: '<i class="icon icon_document-send"></i>',
	user_icon_string: '<i class="icon icon_im-user"></i>'
}

const fontawesome = {
	name: "fontawesome",
	js_resources: [{source: "https://kit.fontawesome.com/827364b194.js", cross_origin: "anonymous"}],
	icon_type: "i",
	new_chat_string: '<i class="fa-solid fa-pen-to-square"></i>',
	conversation_icon_string: '<i class="fa-regular fa-message"></i>',
	model_icon_string: '<i class="fa-solid fa-robot"></i>',
	dropdown_icon_string: '<i class="fa-solid fa-chevron-down"></i>',
	prompt_button_icon_string: '<i class="fa-solid fa-paper-plane"></i>',
	user_icon_string: '<i class="fa-regular fa-user"></i>'
}

export function get_theme_object(theme_name) {
	const themes = {lucide, breeze, fontawesome};
	const theme = themes[theme_name];
	return theme;
}

function copy_icon_classes(parent_element, child_element) {
	parent_element.classList.forEach(cls => {
		if (cls !== "icon-simplechat") {
			child_element.classList.add(cls);
		}
	});
}

function fill_icon_placeholders(html_code, element_type, placeholder_class, theme_name) {
	const parser = new DOMParser();
	const icon_element = parser.parseFromString(html_code, 'text/html').querySelector(element_type);
	
	icon_element.classList.add(theme_name);
	
	const placeholder_elements = document.querySelectorAll(".icon-simplechat" + placeholder_class);
	placeholder_elements.forEach(el => {
		if (el.children.length > 0) return;
		copy_icon_classes(el, icon_element)
		el.appendChild(icon_element.cloneNode(true));
		
	});
}

export function initialize_icons(icon_theme) {
	const icon_type = icon_theme.icon_type;
	fill_icon_placeholders(icon_theme.new_chat_string, icon_type, ".new-chat-icon",icon_theme.name);
	fill_icon_placeholders(icon_theme.conversation_icon_string, icon_type, ".conversation-icon",icon_theme.name);
	fill_icon_placeholders(icon_theme.model_icon_string, icon_type, ".model-icon",icon_theme.name);
	fill_icon_placeholders(icon_theme.dropdown_icon_string, icon_type, ".dropdown-icon",icon_theme.name);
	fill_icon_placeholders(icon_theme.prompt_button_icon_string, icon_type, ".prompt-button-icon",icon_theme.name);
	fill_icon_placeholders(icon_theme.user_icon_string, icon_type, ".user-icon",icon_theme.name);
}

export function setup_icons(icon_theme) {
	process_resources(icon_theme)
	if (document.readyState == "loading") {
		document.addEventListener('DOMContentLoaded', () => initialize_icons(icon_theme));
	} else {
		initialize_icons(icon_theme);
	}
}
