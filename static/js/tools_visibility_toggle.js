function toggle_tools_visibility() {
    const visibility_button = event.target.closest('.toggle-tools-visibility');
    const content = visibility_button.parentElement.querySelector(".content-text");
    const chevrons = visibility_button.querySelectorAll(".icon-simplechat");

    content.classList.toggle("reasoning-hidden");
    for (const chevron of chevrons) {
        chevron.classList.toggle("reasoning-hidden");
    }
}
