const script_template = document.createElement("script");
script_template.type = "text/javascript";

const external_scripts = [
	"icon_theme_switcher.js"
];

external_scripts.forEach(script => {
	script_template.src = script;
	document.querySelector("head").append(script_template.cloneNode(true));
});