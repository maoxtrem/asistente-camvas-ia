export const normalizeText = (value, fallback = '') => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' ? trimmed : fallback;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (value && typeof value === 'object') {
        const message = typeof value.message === 'string' ? value.message.trim() : '';
        if (message !== '') {
            return message;
        }

        const errorMessage = typeof value.error?.message === 'string' ? value.error.message.trim() : '';
        if (errorMessage !== '') {
            return errorMessage;
        }
    }

    return fallback;
};

export const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const renderMarkdownLite = (text) => {
    const safeText = escapeHtml(text);
    return safeText
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
};

export const normalizeGalleryUrl = (value) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || '';
    }

    if (value && typeof value === 'object') {
        return normalizeGalleryUrl(
            value.url ||
            value.image ||
            value.image_url ||
            value.path ||
            value.src ||
            value.imageUrl ||
            value.public_url ||
            value.publicUrl ||
            value.file_url ||
            value.fileUrl ||
            value.data?.url ||
            value.data?.image ||
            value.data?.image_url ||
            value.data?.path ||
            value.data?.src ||
            value.data?.imageUrl ||
            value.data?.public_url ||
            value.data?.publicUrl ||
            value.data?.file_url ||
            value.data?.fileUrl
        );
    }

    return '';
};

export const extractGalleryItems = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && typeof payload === 'object') {
        const candidates = [
            payload.images,
            payload.data,
            payload.items,
            payload.records,
            payload.results,
            payload.gallery,
            payload.body?.records,
            payload.data?.records,
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }
    }

    return [];
};
