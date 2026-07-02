const script_template = document.createElement("script");
script_template.type = "text/javascript";

const external_scripts = [
	"icon_theme_switcher.js"
];

external_scripts.forEach(script => {
	script_template.src = script;
	document.querySelector("head").append(script_template.cloneNode(true));
});

function model_dropdown_clicked() {
	document.getElementById("model-dropdown-list").classList.toggle("show-dropdown");
}

function close_dropdowns_if_unfocused() {
	const dropdowns = document.getElementsByClassName("dropdown-content");
	for (const dropdown of dropdowns) {
		if (!dropdown.classList.contains("show-dropdown")) {
			continue;
		}
		dropdown.classList.remove("show-dropdown");
	}
}

window.onclick = function(event) {
	if (!event.target.closest('.dropdown-button')) {
		close_dropdowns_if_unfocused();
	}
}