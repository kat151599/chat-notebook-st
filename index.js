import {
    extension_settings,
    saveSettingsDebounced,
} from "../../../extensions.js";

import {
    getContext,
} from "../../../extensions.js";

const extensionName = "chat-notebook";

let currentChatId = null;

function ensureDataStructure() {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }

    if (!extension_settings[extensionName].notes) {
        extension_settings[extensionName].notes = {};
    }
}

function getCurrentNote() {
    ensureDataStructure();

    return extension_settings[extensionName]
        .notes[currentChatId] || "";
}

function setCurrentNote(value) {
    ensureDataStructure();

    extension_settings[extensionName]
        .notes[currentChatId] = value;

    saveSettingsDebounced();
}

function buildUI() {
    if ($("#chat_notebook_container").length) {
        return;
    }

    const html = `
    <div id="chat_notebook_container">
        <textarea
            id="chat_notebook_textarea"
            placeholder="Private notes for this chat..."
        ></textarea>

        <div id="chat_notebook_status">
            Local only • Not sent to API
        </div>
    </div>
    `;

    $("#extensions_settings").append(html);

    $("#chat_notebook_textarea").on("input", function () {
        setCurrentNote($(this).val());
    });
}

function loadChatNote() {
    const context = getContext();

    currentChatId = context.chatId;

    if (!currentChatId) {
        $("#chat_notebook_textarea").val("");
        return;
    }

    $("#chat_notebook_textarea").val(
        getCurrentNote()
    );
}

jQuery(async () => {
    buildUI();

    const context = getContext();

    context.eventSource.on(
        context.event_types.CHAT_CHANGED,
        () => {
            loadChatNote();
        }
    );

    loadChatNote();
});
