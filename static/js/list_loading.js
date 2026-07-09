const icon_theme_switcher = await import(FLASK_STATIC_JS_URL + "icon_theme_switcher.js");

export function auto_load_list(load_trigger_class, load_list_function) {
    const load_trigger = document.querySelector(load_trigger_class)
    if (!load_trigger) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                load_list_function();
            }
        });
    }, {
        root: null,
        rootMargin: "300%",
        threshold: 0.1
    });

    observer.observe(load_trigger);
}

export function load_list_function(list_type) {
    const element_objects = {
        more_items_button: document.querySelector(list_type.load_more_button_class),
        additional_buttons: document.querySelectorAll(list_type.auxilary_button_class),
        item_quantity: document.querySelectorAll(list_type.item_type_class).length,
        max_item_fetched: list_type.max_item_fetched,
        list_container: document.querySelector(list_type.container_class),
    }
    element_objects.more_items_text = element_objects.more_items_button?.textContent;
    element_objects.first_additional_button = element_objects.additional_buttons[0];
    element_objects.item_offset = element_objects.item_quantity - element_objects.additional_buttons.length;

    const items_string = fetch(list_type.api_endpoint, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Item-Offset": element_objects.item_offset,
            "Max-Item-Fetched": element_objects.max_item_fetched
        }
    })
    .then(items_string => items_string.json())
    .then(items => {
        element_objects.more_items_button.textContent = "Loading...";

        list_type.apply_element_function(element_objects, items);

        if (items.length != 0) {
            icon_theme_switcher.initialize_icons(icon_theme);
        } else {
            element_objects.more_items_button.style.display = "none";
        }

        element_objects.more_items_button.textContent = element_objects.more_items_text;
    })
    .catch(error => console.error("Error:", error));
}

