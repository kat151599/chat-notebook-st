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
