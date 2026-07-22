function toggle_tool_visibility() {
    const visibility_button = event.target.closest('.tool-name');
    const content = visibility_button.parentElement.querySelector(".tool-content");
    const chevrons = visibility_button.querySelectorAll(".icon-simplechat");

    content.classList.toggle("reasoning-hidden");
    for (const chevron of chevrons) {
        chevron.classList.toggle("reasoning-hidden");
    }
}
