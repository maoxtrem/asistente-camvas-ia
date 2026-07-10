export const SELECTORS = {
    widget: '#asistentecamvasia-widget',
    panel: '#asistentecamvasia-panel',
    closeButton: '#asistentecamvasia-close',
    launchButton: '#btnCanvasAssistant',
    form: '#asistentecamvasia-form',
    messageInput: '#asistentecamvasia-message',
    sendButton: '#asistentecamvasia-send',
    messagesBox: '#asistentecamvasia-messages',
    galleryBox: '#asistentecamvasia-gallery',
};

export const UI_TEXTS = {
    locale: 'es',
    closeLabel: 'Cerrar',
    composerLabel: 'Escribe un mensaje',
    placeholder: 'Escribe tu pregunta',
    sendLabel: 'Enviar',
    sendingLabel: 'Enviando…',
    processingLabel: 'Procesando la respuesta…',
    userLabel: 'Tú',
    assistantLabel: 'Canvas IA',
    noEndpoint: 'No se encontró el endpoint de generación.',
    responseReceived: 'Respuesta recibida.',
    sendFailed: 'No fue posible enviar la pregunta',
};

export function readUiTexts(widget) {
    return {
        locale: widget.dataset.widgetLocale || UI_TEXTS.locale,
        closeLabel: widget.dataset.uiCloseLabel || UI_TEXTS.closeLabel,
        composerLabel: widget.dataset.uiComposerLabel || UI_TEXTS.composerLabel,
        placeholder: widget.dataset.uiPlaceholder || UI_TEXTS.placeholder,
        sendLabel: widget.dataset.uiSendLabel || UI_TEXTS.sendLabel,
        sendingLabel: widget.dataset.uiSendingLabel || UI_TEXTS.sendingLabel,
        processingLabel: widget.dataset.uiProcessingLabel || UI_TEXTS.processingLabel,
        userLabel: widget.dataset.uiUserLabel || UI_TEXTS.userLabel,
        assistantLabel: widget.dataset.uiAssistantLabel || UI_TEXTS.assistantLabel,
        noEndpoint: widget.dataset.uiNoEndpoint || UI_TEXTS.noEndpoint,
        responseReceived: widget.dataset.uiResponseReceived || UI_TEXTS.responseReceived,
        sendFailed: widget.dataset.uiSendFailed || UI_TEXTS.sendFailed,
    };
}
