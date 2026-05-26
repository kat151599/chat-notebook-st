let currentChatId = null;

const EXT = "chat-notebook";

function getStore() {
    window.extension_settings = window.extension_settings || {};

    if (!window.extension_settings["chat-notebook"]) {
        window.extension_settings["chat-notebook"] = { notes: {} };
    }

    return window.extension_settings["chat-notebook"];
}

function getNote(chatId) {
    return getStore().notes?.[chatId] || "";
}

function setNote(chatId, value) {
    if (!chatId) {
        console.log("[Notebook] NO chatId!");
        return;
    }

    const store = getStore();
    store.notes[chatId] = value;

    console.log("[Notebook] saved:", chatId);

    if (typeof window.saveSettingsDebounced === "function") {
        window.saveSettingsDebounced();
    }
}

function buildModal() {
    if ($("#chat_notebook_modal").length) return;

    $("body").append(`
        <div id="chat_notebook_modal" style="
            display:none;
            position:fixed;
            right:20px;
            bottom:170px;
            width:360px;
            height:420px;
            background:var(--SmartThemeBlurTintColor);
            border:1px solid var(--SmartThemeBorderColor);
            border-radius:12px;
            z-index:99999;
            padding:10px;
        ">
            <textarea id="chat_notebook_textarea"
                style="
                    width:100%;
                    height:100%;
                    resize:none;
                    background:transparent;
                    border:none;
                    outline:none;
                    color:var(--SmartThemeBodyColor);
                    font-size:14px;
                    line-height:1.4;
                "
                placeholder="Chat notebook..."></textarea>
        </div>
    `);

$("#chat_notebook_textarea").on("input", function () {
    console.log("INPUT WORKS", $(this).val());
});
}

function loadNote() {
    const context = SillyTavern.getContext?.();

    currentChatId = context?.chatId;

    console.log("[Notebook] load chatId:", currentChatId);

    if (!currentChatId) return;

    const text = getStore().notes[currentChatId] || "";

    $("#chat_notebook_textarea").val(text);
}

function addToExtensionsMenu() {
    const menu = document.getElementById("extensionsMenu");
    if (!menu) return;

    if (document.getElementById("notebook_menu_item")) return;

    const container = document.createElement("div");
    container.id = "notebook_wand_container";
    container.className = "extension_container interactable";
    container.tabIndex = 0;

    container.innerHTML = `
        <div id="open_notebook_item"
             class="list-group-item flex-container flexGap5 interactable"
             role="listitem"
             tabindex="0">
             
            <div class="fa-solid fa-book extensionsMenuExtensionButton"></div>
            <span>Chat Notebook</span>
        </div>
    `;

    container.addEventListener("click", () => {
        $("#chat_notebook_modal").toggle();
        loadNote();
    });

    menu.appendChild(container);
}

function init() {
    console.log("[Chat Notebook] loaded");

    buildModal();
    addToExtensionsMenu();

    const context = SillyTavern.getContext?.();

    context?.eventSource?.on(
        context.event_types.CHAT_CHANGED,
        () => loadNote()
    );
}

jQuery(init);
