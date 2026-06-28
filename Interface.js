const icon_theme = "fontawesome";

if (icon_theme == "lucide") {
	globalThis.icon_type = "svg"
	globalThis.new_chat_string = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-pen-icon lucide-square-pen"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>';
	globalThis.conversation_icon_string = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-icon lucide-message-square"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>';
	globalThis.model_icon_string = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-icon lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
	globalThis.dropdown_icon_string = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>';
	globalThis.prompt_button_icon_string = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-icon lucide-send"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>';
	globalThis.user_icon_string = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-icon lucide-user-round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>';
}
if (icon_theme == "breeze") {
	const kde_snippet = document.createElement("link");
	kde_snippet.rel = "stylesheet";
	kde_snippet.type = "text/css";
	kde_snippet.href = "https://cdn.kde.org/breeze-icons/icons.css";
	document.querySelector("head").append(kde_snippet);
	globalThis.icon_type = "i"
	globalThis.new_chat_string = '<i class="icon icon_list-add"></i>';
	globalThis.conversation_icon_string = '<i class="icon icon_dialog-messages"></i>';
	globalThis.model_icon_string = '<i class="icon icon_flower-shape"></i>';
	globalThis.dropdown_icon_string = '<i class="icon icon_go-down"></i>';
	globalThis.prompt_button_icon_string = '<i class="icon icon_document-send"></i>';
	globalThis.user_icon_string = '<i class="icon icon_im-user"></i>';
}
if (icon_theme == "fontawesome") {
	const fa_snippet = document.createElement("script");
	fa_snippet.src = "https://kit.fontawesome.com/827364b194.js";
	fa_snippet.crossOrigin = "anonymous";
	document.querySelector("head").append(fa_snippet);
	globalThis.icon_type = "i"
	globalThis.new_chat_string = '<i class="fa-solid fa-pen-to-square"></i>';
	globalThis.conversation_icon_string = '<i class="fa-regular fa-message"></i>';
	globalThis.model_icon_string = '<i class="fa-solid fa-robot"></i>';
	globalThis.dropdown_icon_string = '<i class="fa-solid fa-chevron-down"></i>';
	globalThis.prompt_button_icon_string = '<i class="fa-solid fa-paper-plane"></i>';
	globalThis.user_icon_string = '<i class="fa-regular fa-user"></i>';
}

function copy_icon_classes(parent_element, child_element) {
	parent_element.classList.forEach(cls => {
		if (cls != "icon-simplechat") {
			child_element.classList.add(cls);
		}
	});
}

function fill_icon_placeholders(html_code, element_type, placeholder_class) {
	const parser = new DOMParser();
	const icon_element = parser.parseFromString(html_code, 'text/html').querySelector(element_type);
	
	icon_element.classList.add(icon_theme);
	
	const placeholder_elements = document.querySelectorAll(placeholder_class);
	placeholder_elements.forEach(el => {
		copy_icon_classes(el, icon_element)
		el.appendChild(icon_element.cloneNode(true));
		
	});
}

document.addEventListener('DOMContentLoaded', () => {
	fill_icon_placeholders(new_chat_string, icon_type, ".new-chat-icon");
	fill_icon_placeholders(conversation_icon_string, icon_type, ".conversation-icon");
	fill_icon_placeholders(model_icon_string, icon_type, ".model-icon");
	fill_icon_placeholders(dropdown_icon_string, icon_type, ".dropdown-icon");
	fill_icon_placeholders(prompt_button_icon_string, icon_type, ".prompt-button-icon");
	fill_icon_placeholders(user_icon_string, icon_type, ".user-icon");
});