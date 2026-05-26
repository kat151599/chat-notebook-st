function addNotebookButton() {
    if ($("#chat_notebook_button").length) return;

    const btn = $(`
        <div id="chat_notebook_button"
             style="
                position: fixed;
                right: 20px;
                bottom: 120px;
                z-index: 9999;
                padding: 10px 12px;
                background: #444;
                color: white;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
             ">
            Notebook
        </div>
    `);

    btn.on("click", () => {
        $("#chat_notebook_modal").toggle();
    });

    $("body").append(btn);
}
function addNotebookModal() {
    if ($("#chat_notebook_modal").length) return;

    const modal = $(`
        <div id="chat_notebook_modal"
             style="
                display:none;
                position: fixed;
                right: 20px;
                bottom: 170px;
                width: 300px;
                height: 400px;
                background: var(--SmartThemeBlurTintColor);
                border: 1px solid var(--SmartThemeBorderColor);
                border-radius: 12px;
                z-index: 9999;
                padding: 10px;
             ">
            <textarea id="chat_notebook_textarea"
                style="width:100%; height:100%; resize:none;"></textarea>
        </div>
    `);

    $("body").append(modal);
}
jQuery(async () => {
    addNotebookButton();
    addNotebookModal();
    loadChatNote();
});
