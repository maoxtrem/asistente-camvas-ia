import { SELECTORS, readUiTexts } from './config.js';
import { fetchGallery, sendQuestionRequest } from './api.js';
import {
    addChatMessage,
    renderGallery,
    scrollGalleryToStart,
    setPanelOpen,
    setTypingState,
} from './ui.js';
import { extractGalleryItems, normalizeText } from './utils.js';

(function () {
    if (window.__asistenteCamvasiaWidgetInitialized) {
        console.log('[asistentecamvasia-widget] init skipped');
        return;
    }

    window.__asistenteCamvasiaWidgetInitialized = true;

    const widget = document.querySelector(SELECTORS.widget);
    const panel = document.querySelector(SELECTORS.panel);
    const closeButton = document.querySelector(SELECTORS.closeButton);
    const launchButton = document.querySelector(SELECTORS.launchButton);
    const form = document.querySelector(SELECTORS.form);
    const messageInput = document.querySelector(SELECTORS.messageInput);
    const sendButton = document.querySelector(SELECTORS.sendButton);
    const messagesBox = document.querySelector(SELECTORS.messagesBox);
    const galleryBox = document.querySelector(SELECTORS.galleryBox);

    if (!widget || !panel) {
        console.log('[asistentecamvasia-widget] init aborted');
        return;
    }

    const ui = readUiTexts(widget);
    const conversationHistory = [];
    const tenant = widget.dataset.tenant || 'marketing';
    const usuario = widget.dataset.usuario || '';
    const entorno = widget.dataset.entorno || 'dev';
    const imagesLimit = Number.parseInt(widget.dataset.imagesLimit || '10', 10);

    const cargarImagenGeneradaPorIa = (agregarImagenFn, url) => {
        if (typeof agregarImagenFn !== 'function') {
            console.warn('[asistentecamvasia-widget] agregarImagenFn no es una funcion');
            return false;
        }

        if (typeof url !== 'string' || url.trim() === '') {
            console.warn('[asistentecamvasia-widget] url de imagen no proporcionada');
            return false;
        }

        agregarImagenFn(url);
        return true;
    };

    window.__cargarImagenGeneradaPorIa = cargarImagenGeneradaPorIa;

    const openPanel = () => {
        setPanelOpen(panel, true, messageInput);
        void loadGallery();
    };

    const closePanel = () => {
        setPanelOpen(panel, false, messageInput);
    };

    const loadGallery = async () => {
        if (!widget || !galleryBox) {
            return;
        }

        const endpoint = widget.dataset.imagesEndpoint;
        if (!endpoint) {
            renderGallery(galleryBox, []);
            return;
        }

        galleryBox.innerHTML = '<p class="asistentecamvasia-gallery__empty">Cargando imagenes...</p>';

        try {
            const { response, payload } = await fetchGallery(endpoint, {
                tenant,
                usuario,
                entorno,
                limit: Number.isFinite(imagesLimit) && imagesLimit > 0 ? imagesLimit : 10,
            });
            if (!response.ok) {
                throw new Error(normalizeText(payload, `Error HTTP ${response.status}`));
            }

            renderGallery(galleryBox, extractGalleryItems(payload), (url) => {
                if (typeof window.__cargarImagenGeneradaPorIa !== 'function') {
                    console.warn('[asistentecamvasia-widget] no esta disponible el puente de insercion');
                    return;
                }

                const addImageBridge = typeof window.__asistenteCamvasiaAddImage === 'function'
                    ? window.__asistenteCamvasiaAddImage
                    : null;

                window.__cargarImagenGeneradaPorIa(addImageBridge, url);
            });
        } catch (error) {
            galleryBox.innerHTML = '';
            const empty = document.createElement('p');
            empty.className = 'asistentecamvasia-gallery__empty';
            empty.textContent = `No fue posible cargar la galeria: ${error instanceof Error ? error.message : String(error)}`;
            galleryBox.appendChild(empty);
        } finally {
            scrollGalleryToStart(galleryBox);
        }
    };

    let pendingAssistantMessage = null;

    const showPendingState = () => {
        if (pendingAssistantMessage || !messagesBox) {
            return;
        }

        pendingAssistantMessage = addChatMessage(messagesBox, 'assistant', ui.processingLabel, ui, { isPending: true });
    };

    const clearPendingState = () => {
        if (!pendingAssistantMessage) {
            return;
        }

        pendingAssistantMessage.remove();
        pendingAssistantMessage = null;
    };

    const extractAssistantText = (payload) => {
        if (!payload) {
            return '';
        }

        if (typeof payload === 'string') {
            return payload;
        }

        const candidates = [
            payload.message,
            payload.answer,
            payload.response,
            payload.text,
            payload.content,
            payload.data?.message,
            payload.data?.answer,
            payload.data?.response,
            payload.data?.text,
            payload.data?.content,
        ];

        for (const candidate of candidates) {
            const text = normalizeText(candidate, '');
            if (text !== '') {
                return text;
            }
        }

        try {
            return JSON.stringify(payload, null, 2);
        } catch (error) {
            return '';
        }
    };

    const sendQuestion = async () => {
        if (!form || !messageInput || !sendButton) {
            return;
        }

        const endpoint = form.dataset.generateEndpoint;
        const message = String(messageInput.value || '').trim();

        if (!endpoint) {
            addChatMessage(messagesBox, 'assistant', ui.noEndpoint, ui);
            return;
        }

        if (!message) {
            messageInput.focus();
            return;
        }

        addChatMessage(messagesBox, 'user', message, ui);
        conversationHistory.push({ role: 'user', content: message });
        messageInput.value = '';
        setTypingState(sendButton, true, ui);
        showPendingState();

        try {
            const { response, payload } = await sendQuestionRequest(endpoint, {
                message,
                question: message,
                tenant,
                usuario,
                locale: ui.locale,
                metadata: {
                    source: 'bundle-canvas',
                },
            });

            if (response.ok) {
                conversationHistory.push({ role: 'assistant', content: extractAssistantText(payload) || ui.responseReceived });
                await loadGallery();
            } else {
                const assistantText = normalizeText(payload, `Error HTTP ${response.status}`);
                addChatMessage(messagesBox, 'assistant', assistantText, ui);
                conversationHistory.push({ role: 'assistant', content: assistantText });
            }
        } catch (error) {
            const errorText = `${ui.sendFailed}: ${error instanceof Error ? error.message : String(error)}`;
            addChatMessage(messagesBox, 'assistant', errorText, ui);
            conversationHistory.push({ role: 'assistant', content: errorText });
        } finally {
            clearPendingState();
            setTypingState(sendButton, false, ui);
        }
    };

    window.__toggleAsistenteCanvas = () => {
        if (panel.classList.contains('is-open')) {
            closePanel();
            return;
        }

        openPanel();
    };
    window.__openAsistenteCanvas = () => openPanel();
    window.__closeAsistenteCanvas = () => closePanel();

    closeButton?.addEventListener('click', (event) => {
        event.preventDefault();
        closePanel();
    });

    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        void sendQuestion();
    });

    messageInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }

        event.preventDefault();
        void sendQuestion();
    });

    window.addEventListener('asistente-camvas-ia:open', () => {
        openPanel();
    });
    window.addEventListener('asistente-camvas-ia:close', () => {
        closePanel();
    });
    window.addEventListener('asistente-camvas-ia:toggle', (event) => {
        if (typeof event?.detail?.open === 'boolean') {
            if (event.detail.open) {
                openPanel();
                return;
            }

            closePanel();
            return;
        }

        if (panel.classList.contains('is-open')) {
            closePanel();
            return;
        }

        openPanel();
    });

    document.addEventListener('click', (event) => {
        if (!panel.classList.contains('is-open')) {
            return;
        }

        const target = event.target;
        const clickedLauncher = target instanceof Node && launchButton instanceof Element && launchButton.contains(target);
        if (target instanceof Node && !widget.contains(target) && !clickedLauncher) {
            closePanel();
        }
    });

})();
