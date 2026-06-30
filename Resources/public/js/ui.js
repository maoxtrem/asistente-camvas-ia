import { normalizeGalleryUrl, renderMarkdownLite } from './utils.js';

export function setPanelOpen(panel, isOpen, messageInput) {
    panel.classList.toggle('is-open', isOpen);
    panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen && messageInput) {
        window.setTimeout(() => messageInput.focus(), 50);
    }
}

export function setTypingState(sendButton, isTyping, ui) {
    if (!sendButton) {
        return;
    }

    sendButton.disabled = isTyping;
    sendButton.textContent = isTyping ? ui.sendingLabel : ui.sendLabel;
}

export function scrollMessagesToBottom(messagesBox) {
    if (messagesBox) {
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }
}

export function scrollGalleryToStart(galleryBox) {
    if (galleryBox) {
        galleryBox.scrollTop = 0;
    }
}

export function addChatMessage(messagesBox, role, content, ui, options = {}) {
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
    scrollMessagesToBottom(messagesBox);

    return entry;
}

export function renderGallery(galleryBox, items, onSelect = null) {
    if (!galleryBox) {
        return;
    }

    galleryBox.innerHTML = '';

    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'asistentecamvasia-gallery__empty';
        empty.textContent = 'No hay imagenes disponibles.';
        galleryBox.appendChild(empty);
        return;
    }

    items.forEach((item) => {
        const url = normalizeGalleryUrl(item);
        if (!url) {
            return;
        }

        const itemBox = document.createElement(onSelect ? 'button' : 'div');
        itemBox.className = 'asistentecamvasia-gallery__item';
        itemBox.title = 'Imagen generada';
        if (onSelect) {
            itemBox.type = 'button';
            itemBox.addEventListener('click', () => onSelect(url, item));
        }

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Imagen generada';
        img.loading = 'lazy';
        img.decoding = 'async';

        itemBox.appendChild(img);
        galleryBox.appendChild(itemBox);
    });
}
