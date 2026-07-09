const list_loading = await import(FLASK_STATIC_JS_URL + "list_loading.js");

if (document.readyState == "loading") {
    document.addEventListener('DOMContentLoaded', auto_load_models);
} else {
    auto_load_models()
}

function auto_load_models() {
    const load_trigger_class = ".model-load-trigger";
    list_loading.auto_load_list(load_trigger_class, load_more_models);
}

export function load_more_models() {
    const model_list = {
        load_more_button_class: ".model-load-trigger",
        auxilary_button_class: ".model.auxilary",
        item_type_class: ".model",
        max_item_fetched: 20,
        container_class: ".model-list",
        api_endpoint: "/backend-api/models",
        apply_element_function: process_models
    }

    list_loading.load_list_function(model_list);
}

function process_models(element_objects, models) {
    const parser = new DOMParser();
    const template_string = "<button class=\"button transparent-button model\"></button>";
    const template = parser.parseFromString(template_string, 'text/html').querySelector("button");

    let template_clone;
    let index;
    for (index = 0; index < models.length; index++) {
        const model = models[index];

        template_clone = template.cloneNode(true);
        template_clone.setAttribute("onclick", `model_select("${model.name}")`);
        template_clone.textContent = model.friendly_name;
        element_objects.list_container.insertBefore(template_clone, element_objects.first_additional_button);
    }
}

window.load_more_models = load_more_models;
