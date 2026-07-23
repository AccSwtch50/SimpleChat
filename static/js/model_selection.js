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
