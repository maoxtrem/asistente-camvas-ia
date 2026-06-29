(function () {
    if (window.__asistenteCamvasiaWidgetInitialized) {
        console.log('[asistentecamvasia-widget] init skipped');
        return;
    }

    window.__asistenteCamvasiaWidgetInitialized = true;

    const widget = document.getElementById('asistentecamvasia-widget');
    const panel = document.getElementById('asistentecamvasia-panel');
    const closeButton = document.getElementById('asistentecamvasia-close');
    const launchButton = document.getElementById('btnCanvasAssistant');
    const form = document.getElementById('asistentecamvasia-form');
    const messageInput = document.getElementById('asistentecamvasia-message');
    const sendButton = document.getElementById('asistentecamvasia-send');
    const messagesBox = document.getElementById('asistentecamvasia-messages');

    if (!widget || !panel) {
        console.log('[asistentecamvasia-widget] init aborted');
        return;
    }

    const conversationHistory = [];
    const ui = {
        locale: widget.dataset.widgetLocale || 'es',
        closeLabel: widget.dataset.uiCloseLabel || 'Cerrar',
        composerLabel: widget.dataset.uiComposerLabel || 'Escribe un mensaje',
        placeholder: widget.dataset.uiPlaceholder || 'Escribe tu pregunta',
        sendLabel: widget.dataset.uiSendLabel || 'Enviar',
        sendingLabel: widget.dataset.uiSendingLabel || 'Enviando…',
        processingLabel: widget.dataset.uiProcessingLabel || 'Procesando la respuesta…',
        userLabel: widget.dataset.uiUserLabel || 'Tú',
        assistantLabel: widget.dataset.uiAssistantLabel || 'Canvas IA',
        noEndpoint: widget.dataset.uiNoEndpoint || 'No se encontró el endpoint de generación.',
        responseReceived: widget.dataset.uiResponseReceived || 'Respuesta recibida.',
        sendFailed: widget.dataset.uiSendFailed || 'No fue posible enviar la pregunta',
    };

    const setOpen = (isOpen) => {
        panel.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen && messageInput) {
            window.setTimeout(() => messageInput.focus(), 50);
        }
    };

    const toggle = (force = null) => {
        const shouldOpen = typeof force === 'boolean' ? force : !panel.classList.contains('is-open');
        setOpen(shouldOpen);
    };

    const normalizeText = (value, fallback = '') => {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed !== '' ? trimmed : fallback;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (value && typeof value === 'object') {
            if (typeof value.message === 'string' && value.message.trim() !== '') {
                return value.message.trim();
            }

            if (typeof value.error?.message === 'string' && value.error.message.trim() !== '') {
                return value.error.message.trim();
            }
        }

        return fallback;
    };

    const escapeHtml = (value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const renderMarkdownLite = (text) => {
        const safeText = escapeHtml(text);
        return safeText
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    };

    const scrollMessagesToBottom = () => {
        if (messagesBox) {
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }
    };

    let pendingAssistantMessage = null;

    const showPendingState = () => {
        if (pendingAssistantMessage || !messagesBox) {
            return;
        }

        pendingAssistantMessage = addMessage('assistant', ui.processingLabel, { isPending: true });
    };

    const clearPendingState = () => {
        if (!pendingAssistantMessage) {
            return;
        }

        pendingAssistantMessage.remove();
        pendingAssistantMessage = null;
    };

    const addMessage = (role, content, options = {}) => {
        if (!messagesBox) {
            return null;
        }

        const entry = document.createElement('article');
        entry.className = `asistentecamvasia-chat__message asistentecamvasia-chat__message--${role}`;
        if (options.isPending) {
            entry.classList.add('is-pending');
        }

        const meta = document.createElement('div');
        meta.className = 'asistentecamvasia-chat__meta';
        meta.textContent = role === 'user' ? ui.userLabel : ui.assistantLabel;

        const bubble = document.createElement('div');
        bubble.className = 'asistentecamvasia-chat__bubble';
        bubble.innerHTML = renderMarkdownLite(content);

        entry.appendChild(meta);
        entry.appendChild(bubble);
        messagesBox.appendChild(entry);
        scrollMessagesToBottom();

        return entry;
    };

    const setTypingState = (isTyping) => {
        if (!sendButton) {
            return;
        }

        sendButton.disabled = isTyping;
        sendButton.textContent = isTyping ? ui.sendingLabel : ui.sendLabel;
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
            addMessage('assistant', ui.noEndpoint);
            return;
        }

        if (!message) {
            messageInput.focus();
            return;
        }

        addMessage('user', message);
        conversationHistory.push({ role: 'user', content: message });
        messageInput.value = '';
        setTypingState(true);
        showPendingState();

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    question: message,
                    tenant: widget.dataset.tenant || 'marketing',
                    locale: ui.locale,
                }),
            });

            const payload = await response.json().catch(() => null);
            clearPendingState();
            const assistantText = response.ok
                ? extractAssistantText(payload) || ui.responseReceived
                : normalizeText(payload, `Error HTTP ${response.status}`);

            addMessage(response.ok ? 'assistant' : 'assistant', assistantText);
            conversationHistory.push({ role: 'assistant', content: assistantText });

        } catch (error) {
            clearPendingState();
            const errorText = `${ui.sendFailed}: ${error instanceof Error ? error.message : String(error)}`;
            addMessage('assistant', errorText);
            conversationHistory.push({ role: 'assistant', content: errorText });
        } finally {
            clearPendingState();
            setTypingState(false);
            scrollMessagesToBottom();
        }
    };

    window.__toggleAsistenteCanvas = () => toggle();
    window.__openAsistenteCanvas = () => toggle(true);
    window.__closeAsistenteCanvas = () => toggle(false);

    closeButton?.addEventListener('click', (event) => {
        event.preventDefault();
        toggle(false);
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

    window.addEventListener('asistente-camvas-ia:open', () => setOpen(true));
    window.addEventListener('asistente-camvas-ia:close', () => setOpen(false));
    window.addEventListener('asistente-camvas-ia:toggle', (event) => {
        const open = event?.detail?.open;
        setOpen(typeof open === 'boolean' ? open : !panel.classList.contains('is-open'));
    });

    document.addEventListener('click', (event) => {
        if (!panel.classList.contains('is-open')) {
            return;
        }

        const target = event.target;
        const clickedLauncher = target instanceof Node && launchButton instanceof Element && launchButton.contains(target);
        if (target instanceof Node && !widget.contains(target) && !clickedLauncher) {
            setOpen(false);
        }
    });

})();
