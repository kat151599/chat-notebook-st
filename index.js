// ============================================================
//  Chat Notebook — SillyTavern extension
//  Stores a separate note for every chat, persisted via
//  extensionSettings from getContext() (saved in settings.json).
// ============================================================

const MODULE_NAME = "chat-notebook";

const DEFAULT_SETTINGS = Object.freeze({ notes: {} });

// ── Settings helpers ─────────────────────────────────────────
// IMPORTANT: always call getContext().extensionSettings — not
// window.extension_settings — so we use the live reference that
// ST populates from the server before handing it to extensions.

function getSettings() {
    const { extensionSettings } = SillyTavern.getContext();
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(DEFAULT_SETTINGS);
    }
    // forward-compat: add any missing keys from defaults
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (!Object.hasOwn(extensionSettings[MODULE_NAME], key)) {
            extensionSettings[MODULE_NAME][key] = structuredClone(DEFAULT_SETTINGS[key]);
        }
    }
    return extensionSettings[MODULE_NAME];
}

function save() {
    const { saveSettingsDebounced } = SillyTavern.getContext();
    saveSettingsDebounced();
}

function getNote(chatId) {
    if (!chatId) return "";
    return getSettings().notes[chatId] ?? "";
}

function setNote(chatId, text) {
    if (!chatId) return;
    getSettings().notes[chatId] = text;
    save();
    console.log(`[Notebook] saved note for ${chatId} (${text.length} chars)`);
}

// ── Current chat id ──────────────────────────────────────────

function getCurrentChatId() {
    return SillyTavern.getContext?.()?.chatId ?? null;
}

// ── Load note into textarea ──────────────────────────────────

function loadNote() {
    const chatId = getCurrentChatId();
    if (!chatId) {
        console.log("[Notebook] loadNote: no active chat");
        return;
    }
    const text = getNote(chatId);
    const $ta = $("#chat_notebook_textarea");
    if ($ta.val() !== text) $ta.val(text);
    const len = text.length;
    $("#chat_notebook_chars").text(len + " char" + (len !== 1 ? "s" : ""));
    $("#chat_notebook_status").text("");
    console.log(`[Notebook] loaded note for ${chatId} (${len} chars)`);
}

// ── Open / toggle modal ──────────────────────────────────────

function openNotebook() {
    const $modal = $("#chat_notebook_modal");
    if ($modal.is(":visible")) {
        $modal.hide();
        return;
    }
    loadNote();
    $modal.show();
    $("#chat_notebook_textarea").focus();
}

// ── Build modal ──────────────────────────────────────────────

function buildModal() {
    if ($("#chat_notebook_modal").length) return;

    $("body").append(`
        <div id="chat_notebook_modal">
            <div id="chat_notebook_header">
                <span id="chat_notebook_title">
                    <i class="fa-solid fa-book"></i>&nbsp;Chat Notebook
                </span>
                <div id="chat_notebook_actions">
                    <button id="chat_notebook_clear" title="Clear note" class="menu_button interactable">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button id="chat_notebook_close" title="Close" class="menu_button interactable">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <textarea
                id="chat_notebook_textarea"
                placeholder="Write your notes for this chat here…"
                spellcheck="false"
            ></textarea>
            <div id="chat_notebook_footer">
                <span id="chat_notebook_status"></span>
                <span id="chat_notebook_chars">0 chars</span>
            </div>
        </div>
    `);

    // auto-save with debounce
    let saveTimeout = null;
    $("#chat_notebook_textarea").on("input", function () {
        const chatId = getCurrentChatId();
        if (!chatId) return;
        const text = $(this).val();
        const len = text.length;
        $("#chat_notebook_chars").text(len + " char" + (len !== 1 ? "s" : ""));
        clearTimeout(saveTimeout);
        $("#chat_notebook_status").text("Saving…");
        saveTimeout = setTimeout(() => {
            setNote(chatId, text);
            $("#chat_notebook_status").text("Saved ✓");
            setTimeout(() => $("#chat_notebook_status").text(""), 1500);
        }, 600);
    });

    $("#chat_notebook_close").on("click", () => $("#chat_notebook_modal").hide());

    $("#chat_notebook_clear").on("click", () => {
        const chatId = getCurrentChatId();
        if (!chatId) return;
        if (!confirm("Clear the note for this chat?")) return;
        setNote(chatId, "");
        $("#chat_notebook_textarea").val("");
        $("#chat_notebook_chars").text("0 chars");
        $("#chat_notebook_status").text("Cleared");
        setTimeout(() => $("#chat_notebook_status").text(""), 1500);
    });

    makeDraggable($("#chat_notebook_modal"), $("#chat_notebook_header"));

    $(document).on("keydown.notebook", (e) => {
        if (e.key === "Escape" && $("#chat_notebook_modal").is(":visible")) {
            $("#chat_notebook_modal").hide();
        }
    });
}

// ── Add item to Extensions menu ──────────────────────────────

function addToExtensionsMenu() {
    const menu = document.getElementById("extensionsMenu");
    if (!menu || document.getElementById("notebook_menu_item")) return;

    const container = document.createElement("div");
    container.id = "notebook_menu_item";
    container.className = "extension_container interactable";
    container.tabIndex = 0;
    container.setAttribute("role", "listitem");
    container.innerHTML = `
        <div class="list-group-item flex-container flexGap5 interactable">
            <div class="fa-solid fa-book extensionsMenuExtensionButton"></div>
            <span>Chat Notebook</span>
        </div>
    `;
    container.addEventListener("click", openNotebook);
    container.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") openNotebook();
    });
    menu.appendChild(container);
}

// ── Drag helper ──────────────────────────────────────────────

function makeDraggable($el, $handle) {
    let dragging = false, ox = 0, oy = 0;
    $handle.css("cursor", "move");
    $handle.on("mousedown", (e) => {
        if (e.button !== 0) return;
        dragging = true;
        const r = $el[0].getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
        e.preventDefault();
    });
    $(document).on("mousemove.notebook_drag", (e) => {
        if (!dragging) return;
        const x = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - $el.outerWidth()));
        const y = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - $el.outerHeight()));
        $el.css({ left: x, top: y, right: "auto", bottom: "auto" });
    });
    $(document).on("mouseup.notebook_drag", () => { dragging = false; });
}

// ── Init ─────────────────────────────────────────────────────

function init() {
    console.log("[Chat Notebook] init");

    buildModal();
    addToExtensionsMenu();

    // getContext() is the live object — extensionSettings is already
    // populated with data loaded from the server by the time init() runs.
    // No need to wait for a SETTINGS_LOADED event.
    getSettings(); // ensure our key exists
    console.log("[Notebook] notes on load:", Object.keys(getSettings().notes).length);

    const context = SillyTavern.getContext();
    // eventTypes (no underscores) is the correct property name in getContext()
    const { eventSource, eventTypes } = context;

    if (!eventSource || !eventTypes) {
        console.warn("[Notebook] eventSource / eventTypes not available");
        return;
    }

    eventSource.on(eventTypes.CHAT_CHANGED, () => {
        console.log("[Notebook] CHAT_CHANGED");
        loadNote();
    });
}

jQuery(init);
