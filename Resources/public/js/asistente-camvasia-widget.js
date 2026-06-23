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
        placeholder: widget.dataset.uiPlaceholder || 'Escribe tu mensaje y envíalo al canvas',
        sendLabel: widget.dataset.uiSendLabel || 'Enviar',
        sendingLabel: widget.dataset.uiSendingLabel || 'Enviando…',
        processingLabel: widget.dataset.uiProcessingLabel || 'Procesando la respuesta…',
        userLabel: widget.dataset.uiUserLabel || 'Tú',
        assistantLabel: widget.dataset.uiAssistantLabel || 'Canvas IA',
        noEndpoint: widget.dataset.uiNoEndpoint || 'No se encontró el endpoint de generación.',
        responseReceived: widget.dataset.uiResponseReceived || 'Respuesta recibida.',
        designApplied: widget.dataset.uiDesignApplied || 'Diseño aplicado al lienzo.',
        sendFailed: widget.dataset.uiSendFailed || 'No fue posible enviar la prueba',
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

    const parseDimension = (value) => {
        const numeric = Number.parseFloat(String(value || '').replace('px', ''));
        return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
    };

    const extractTranslateFromTransform = (transform) => {
        if (!transform || transform === 'none') {
            return null;
        }

        const matchTranslate3d = transform.match(/translate3d\(\s*([-+]?\d*\.?\d+)px,\s*([-+]?\d*\.?\d+)px,\s*[-+]?\d*\.?\d+px\s*\)/i);
        if (matchTranslate3d) {
            return {
                x: parseFloat(matchTranslate3d[1]),
                y: parseFloat(matchTranslate3d[2]),
            };
        }

        const matchTranslate = transform.match(/translate\(\s*([-+]?\d*\.?\d+)px(?:\s*,\s*|\s)([-+]?\d*\.?\d+)px\s*\)/i);
        if (matchTranslate) {
            return {
                x: parseFloat(matchTranslate[1]),
                y: parseFloat(matchTranslate[2]),
            };
        }

        return null;
    };

    const getElementTransforms = (element) => {
        if (!element) {
            return { x: 0, y: 0, rotation: 0, skew: 0, scaleX: 1, scaleY: 1 };
        }

        const style = window.getComputedStyle(element);
        const transform = style.transform;
        const datasetTransforms = {
            x: parseFloat(element.dataset.x) || 0,
            y: parseFloat(element.dataset.y) || 0,
            rotation: parseFloat(element.dataset.rotation) || 0,
            skew: parseFloat(element.dataset.skew) || 0,
            scaleX: parseFloat(element.dataset.scaleX) || 1,
            scaleY: parseFloat(element.dataset.scaleY) || 1,
        };

        if (transform === 'none') {
            return datasetTransforms;
        }

        try {
            const matrix = new DOMMatrix(transform);
            const translateFromTransform = extractTranslateFromTransform(transform);
            const datasetX = parseFloat(element.dataset.x);
            const datasetY = parseFloat(element.dataset.y);
            const x = !Number.isNaN(datasetX)
                ? datasetX
                : (translateFromTransform ? translateFromTransform.x : matrix.m41);
            const y = !Number.isNaN(datasetY)
                ? datasetY
                : (translateFromTransform ? translateFromTransform.y : matrix.m42);
            let scaleX = Math.sqrt(matrix.m11 * matrix.m11 + matrix.m12 * matrix.m12);
            let scaleY = Math.sqrt(matrix.m21 * matrix.m21 + matrix.m22 * matrix.m22);
            const rotation = Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
            const tanSkew = (matrix.m11 * matrix.m21 + matrix.m12 * matrix.m22) /
                (matrix.m11 * matrix.m22 - matrix.m12 * matrix.m21);
            const skew = Math.atan(tanSkew) * (180 / Math.PI);
            if (Math.abs(scaleX - 1) < 0.01) scaleX = 1;
            if (Math.abs(scaleY - 1) < 0.01) scaleY = 1;

            return {
                x: Math.round(x),
                y: Math.round(y),
                rotation: parseFloat(rotation.toFixed(2)),
                skew: parseFloat(skew.toFixed(2)),
                scaleX: parseFloat(scaleX.toFixed(3)),
                scaleY: parseFloat(scaleY.toFixed(3)),
            };
        } catch (error) {
            console.warn('[asistentecamvasia-widget] transform parse fallback', error);
            return datasetTransforms;
        }
    };

    const normalizeCssValue = (value) => {
        if (value === null || value === undefined) {
            return null;
        }

        const text = String(value).trim();
        return text === '' ? null : text;
    };

    const normalizeElementSchema = (element = {}) => {
        const normalized = isPlainObject(element) ? {...element} : {};
        const transforms = isPlainObject(normalized.transforms) ? {...normalized.transforms} : {};

        if (normalized.font_size !== undefined && normalized.fontSize === undefined) {
            normalized.fontSize = normalized.font_size;
        }
        if (normalized.font_color !== undefined && normalized.color === undefined) {
            normalized.color = normalized.font_color;
        }
        if (normalized.position_x !== undefined && transforms.x === undefined) {
            transforms.x = normalized.position_x;
        }
        if (normalized.position_y !== undefined && transforms.y === undefined) {
            transforms.y = normalized.position_y;
        }
        if (normalized.rotation !== undefined && transforms.rotation === undefined) {
            transforms.rotation = normalized.rotation;
        }
        if (normalized.skew !== undefined && transforms.skew === undefined) {
            transforms.skew = normalized.skew;
        }
        if (normalized.scale_x !== undefined && transforms.scaleX === undefined) {
            transforms.scaleX = normalized.scale_x;
        }
        if (normalized.scale_y !== undefined && transforms.scaleY === undefined) {
            transforms.scaleY = normalized.scale_y;
        }
        if (Object.keys(transforms).length > 0) {
            normalized.transforms = transforms;
        }
        if (normalized.align !== undefined && normalized.alignment === undefined) {
            normalized.alignment = normalized.align;
        }

        return normalized;
    };

    const isPlainObject = (value) => Boolean(value) && !Array.isArray(value) && typeof value === 'object';

    const clearCanvas = () => {
        const area = document.getElementById('design-area');
        const container = document.getElementById('design-area-container');
        if (!area || !container) {
            return;
        }

        area.querySelectorAll('.draggable-item').forEach((element) => element.remove());
    };

    const parseCanvasSize = (value) => {
        const match = String(value || '').trim().match(/^(\d+)\s*x\s*(\d+)$/i);
        if (!match) {
            return null;
        }

        return {
            width: Number(match[1]),
            height: Number(match[2]),
        };
    };

    const applyCanvasSize = (canvasData = {}) => {
        const area = document.getElementById('design-area');
        const container = document.getElementById('design-area-container');
        if (!area || !container) {
            return;
        }

        const width = parseDimension(canvasData.width);
        const height = parseDimension(canvasData.height);
        if (width) {
            container.style.width = `${Math.round(width)}px`;
            area.style.width = `${Math.round(width)}px`;
        }
        if (height) {
            container.style.height = `${Math.round(height)}px`;
            area.style.height = `${Math.round(height)}px`;
        }

        const colorPrimario = document.getElementById('colorPrimario');
        const colorSecundario = document.getElementById('colorSecundario');
        if (canvasData.colors?.primary && colorPrimario) {
            colorPrimario.value = canvasData.colors.primary;
        }
        if (canvasData.colors?.secondary && colorSecundario) {
            colorSecundario.value = canvasData.colors.secondary;
        }

        const backgroundTypeColor = document.getElementById('backgroundTypeColor');
        const backgroundTypeImage = document.getElementById('backgroundTypeImage');
        if (canvasData.backgroundType === 'image' && backgroundTypeImage) {
            backgroundTypeImage.checked = true;
        } else if (backgroundTypeColor) {
            backgroundTypeColor.checked = true;
        }
    };

    const getElementBounds = (element, container) => {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect?.();
        const offsetX = containerRect ? elementRect.left - containerRect.left : elementRect.left;
        const offsetY = containerRect ? elementRect.top - containerRect.top : elementRect.top;

        return {
            left: Math.round(offsetX),
            top: Math.round(offsetY),
            width: Math.round(elementRect.width),
            height: Math.round(elementRect.height),
        };
    };

    const buildElementNode = (item = {}) => {
        const normalizedItem = normalizeElementSchema(item);
        const type = normalizeText(normalizedItem.type, 'unknown');
        const element = document.createElement(type === 'image' ? 'img' : 'div');
        element.classList.add('draggable-item');
        element.dataset.snapshotType = type;
        if (normalizedItem.id) {
            element.id = normalizedItem.id;
        }
        element.style.position = 'absolute';
        element.style.left = '0px';
        element.style.top = '0px';
        element.style.zIndex = String(normalizedItem.zIndex ?? item.zIndex ?? 1);
        element.style.transformOrigin = 'center center';

        if (normalizedItem.width) {
            element.style.width = String(normalizedItem.width).includes('px') ? String(normalizedItem.width) : `${normalizedItem.width}px`;
        }
        if (normalizedItem.height) {
            element.style.height = String(normalizedItem.height).includes('px') ? String(normalizedItem.height) : `${normalizedItem.height}px`;
        }
        if (normalizedItem.cssText) {
            element.style.cssText = `${element.style.cssText};${normalizedItem.cssText}`;
        }
        if (normalizedItem.dataset && typeof normalizedItem.dataset === 'object') {
            Object.entries(normalizedItem.dataset).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    element.dataset[key] = String(value);
                }
            });
        }

        if (type === 'text') {
            element.classList.add('text-item');
            if (normalizedItem.contentHtml) {
                element.innerHTML = normalizedItem.contentHtml;
            } else {
                element.textContent = normalizedItem.content || normalizedItem.text || '';
            }
            element.style.fontFamily = normalizedItem.fontFamily || normalizedItem.dataset?.fontFamily || 'Poppins, sans-serif';
            element.style.fontSize = normalizedItem.fontSize ? `${parseFloat(normalizedItem.fontSize)}px` : '24px';
            element.style.color = normalizedItem.color || normalizedItem.dataset?.color || '#ffffff';
            if (normalizedItem.fontWeight) {
                element.style.fontWeight = normalizedItem.fontWeight;
            }
            if (normalizedItem.fontStyle) {
                element.style.fontStyle = normalizedItem.fontStyle;
            }
            if (normalizedItem.alignment) {
                element.style.textAlign = normalizedItem.alignment;
            }
            element.style.whiteSpace = 'nowrap';
            element.style.cursor = 'move';
            element.style.border = '1px solid transparent';
            if (normalizedItem.outlineWidth) {
                element.dataset.outlineWidth = String(normalizedItem.outlineWidth);
                element.style.webkitTextStrokeWidth = `${parseFloat(normalizedItem.outlineWidth)}px`;
            }
            if (normalizedItem.outlineColor) {
                element.dataset.outlineColor = String(normalizedItem.outlineColor);
                element.style.webkitTextStrokeColor = String(normalizedItem.outlineColor);
            }
            if (normalizedItem.hasShadow !== undefined) {
                element.dataset.hasShadow = String(normalizedItem.hasShadow);
            }
            if (normalizedItem.shadow !== undefined) {
                element.dataset.shadow = String(normalizedItem.shadow);
            }
            if (normalizedItem.shadowColor) {
                element.dataset.shadowColor = String(normalizedItem.shadowColor);
            }
            if (normalizedItem.shadowBlur) {
                element.dataset.shadowBlur = String(normalizedItem.shadowBlur);
            }
            if (normalizedItem.shadowOffset) {
                element.dataset.shadowOffset = String(normalizedItem.shadowOffset);
            }
            if (normalizedItem.gradientType === 'linear') {
                element.dataset.gradientType = 'linear';
                element.dataset.gradientColor1 = normalizedItem.gradientColor1 || '#ffffff';
                element.dataset.gradientColor2 = normalizedItem.gradientColor2 || '#000000';
                element.dataset.gradientDirection = normalizedItem.gradientDirection || 'to right';
                element.dataset.backgroundType = 'gradient';
            }
            if (normalizedItem.backgroundImageUrl) {
                element.style.backgroundImage = `url("${normalizedItem.backgroundImageUrl}")`;
                element.style.backgroundRepeat = normalizedItem.backgroundRepeat || 'no-repeat';
                element.style.backgroundPosition = normalizedItem.backgroundPosition || 'center';
                element.style.backgroundSize = normalizedItem.backgroundSize || 'cover';
                element.style.webkitBackgroundClip = 'text';
                element.style.backgroundClip = 'text';
                element.style.webkitTextFillColor = 'transparent';
            }
        } else if (type === 'image') {
            element.classList.add('image-item');
            element.src = normalizedItem.src || normalizedItem.originalSrc || '';
            element.alt = normalizedItem.alt || '';
            element.style.objectFit = 'cover';
            if (normalizedItem.cropData) {
                element.dataset.cropData = String(normalizedItem.cropData);
            }
            if (normalizedItem.originalSrc) {
                element.dataset.originalSrc = String(normalizedItem.originalSrc);
            }
        } else if (type === 'html') {
            element.classList.add('html-item');
            const wrapper = document.createElement('div');
            wrapper.className = 'html-content-wrapper';
            wrapper.innerHTML = normalizedItem.content || '';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';
            wrapper.style.pointerEvents = 'none';
            element.appendChild(wrapper);
            if (Array.isArray(normalizedItem.classList)) {
                normalizedItem.classList.forEach((className) => {
                    if (!['draggable-item', 'html-item'].includes(className)) {
                        element.classList.add(className);
                    }
                });
            }
            if (normalizedItem.htmlType) {
                element.dataset.htmlType = String(normalizedItem.htmlType);
            }
            if (normalizedItem.link) {
                element.dataset.link = String(normalizedItem.link);
            }
            if (normalizedItem.backgroundColor) {
                element.dataset.htmlBackgroundColor = String(normalizedItem.backgroundColor);
            }
            if (normalizedItem.textColor) {
                element.dataset.htmlTextColor = String(normalizedItem.textColor);
            }
            if (normalizedItem.fontSize) {
                element.style.fontSize = String(normalizedItem.fontSize).includes('px') ? String(normalizedItem.fontSize) : `${parseFloat(normalizedItem.fontSize)}px`;
            }
            if (normalizedItem.fontFamily) {
                element.style.fontFamily = normalizedItem.fontFamily;
            }
            if (normalizedItem.fontWeight) {
                element.style.fontWeight = normalizedItem.fontWeight;
            }
            if (normalizedItem.cssText) {
                element.style.cssText = `${element.style.cssText};${normalizedItem.cssText}`;
            }
        } else if (type === 'line') {
            element.classList.add('line-item');
            element.style.height = normalizedItem.thickness ? `${normalizedItem.thickness}px` : '2px';
            element.style.width = normalizedItem.width || '120px';
            element.style.background = normalizedItem.color || '#000000';
            element.dataset.lineType = normalizedItem.lineType || 'solid';
            element.dataset.thickness = String(normalizedItem.thickness || 2);
            element.dataset.color = normalizedItem.color || '#000000';
        } else if (type === 'shape' || type === 'svg') {
            element.classList.add('shape-item');
            if (type === 'svg') {
                element.classList.add('svg-shape');
            }
            if (normalizedItem.subtype === 'icon') {
                element.classList.add('icon-item');
                element.dataset.subtype = 'icon';
            } else if (normalizedItem.subtype === 'shape') {
                element.dataset.subtype = 'shape';
            }
            if (normalizedItem.path) {
                element.dataset.shapePath = normalizedItem.path;
                element.dataset.iconPath = normalizedItem.path;
            }
            if (normalizedItem.color) {
                element.dataset.color = normalizedItem.color;
                element.style.color = normalizedItem.color;
            }
            if (normalizedItem.shapeOutlineColor) {
                element.dataset.shapeOutlineColor = normalizedItem.shapeOutlineColor;
            }
            if (normalizedItem.shapeOutlineWidth !== undefined) {
                element.dataset.shapeOutlineWidth = String(normalizedItem.shapeOutlineWidth);
            }
            if (normalizedItem.svgId) {
                element.dataset.shapeId = String(normalizedItem.svgId);
                element.dataset.svgId = String(normalizedItem.svgId);
            }
            if (normalizedItem.svgImageHref) {
                element.dataset.svgImageHref = String(normalizedItem.svgImageHref);
            }
            if (normalizedItem.clipPathD) {
                element.dataset.clipPathD = String(normalizedItem.clipPathD);
            }
            if (normalizedItem.svgImageAttrs && typeof normalizedItem.svgImageAttrs === 'object') {
                element.dataset.svgImageAttrs = JSON.stringify(normalizedItem.svgImageAttrs);
            }
            if (normalizedItem.gradientType === 'linear') {
                element.dataset.gradientType = 'linear';
                element.dataset.gradientColor1 = normalizedItem.gradientColor1 || '#ffffff';
                element.dataset.gradientColor2 = normalizedItem.gradientColor2 || '#000000';
                element.dataset.gradientDirection = normalizedItem.gradientDirection || 'to right';
            }
            element.style.background = normalizedItem.backgroundColor || normalizedItem.color || '#0d6efd';
        } else {
            element.classList.add('shape-item');
            element.style.background = normalizedItem.color || normalizedItem.backgroundColor || '#0d6efd';
        }

        if (normalizedItem.transforms && typeof normalizedItem.transforms === 'object') {
            const x = Number(normalizedItem.transforms.x ?? 0) || 0;
            const y = Number(normalizedItem.transforms.y ?? 0) || 0;
            const rotation = Number(normalizedItem.transforms.rotation ?? 0) || 0;
            const skew = Number(normalizedItem.transforms.skew ?? 0) || 0;
            const scaleX = Number(normalizedItem.transforms.scaleX ?? 1) || 1;
            const scaleY = Number(normalizedItem.transforms.scaleY ?? 1) || 1;
            element.dataset.x = String(x);
            element.dataset.y = String(y);
            element.dataset.rotation = String(rotation);
            element.dataset.skew = String(skew);
            element.dataset.scaleX = String(scaleX);
            element.dataset.scaleY = String(scaleY);
            element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) skewX(${skew}deg) scale(${scaleX}, ${scaleY})`;
        }

        return element;
    };

    const applyDesignToCanvas = (design) => {
        if (!design || typeof design !== 'object') {
            return false;
        }

        const area = document.getElementById('design-area');
        if (!area) {
            return false;
        }

        area.style.backgroundImage = '';
        area.style.backgroundColor = '';
        area.style.backgroundRepeat = '';
        area.style.backgroundPosition = '';
        area.style.backgroundSize = '';

        if (design.canvas && typeof design.canvas === 'object') {
            applyCanvasSize(design.canvas);
        } else if (design.canvasSize) {
            const parsedSize = parseCanvasSize(design.canvasSize);
            if (parsedSize) {
                applyCanvasSize(parsedSize);
            }
        }

        clearCanvas();

        const elements = Array.isArray(design.designElements)
            ? design.designElements
            : (Array.isArray(design.elements) ? design.elements : []);

        if (Array.isArray(elements)) {
            elements.map(normalizeElementSchema).forEach((item) => {
                const element = buildElementNode(item);
                area.appendChild(element);
            });
        }

        const backgroundType = design.backgroundType || design.canvas?.backgroundType || null;
        const backgroundImage = design.backgroundImage || design.canvas?.backgroundImage || null;
        const primaryColor = design.primaryColor || design.canvas?.colors?.primary || null;
        const secondaryColor = design.secondaryColor || design.canvas?.colors?.secondary || null;
        const canvasSize = design.canvasSize || null;

        if (primaryColor || secondaryColor) {
            const colorPrimario = document.getElementById('colorPrimario');
            const colorSecundario = document.getElementById('colorSecundario');
            if (primaryColor && colorPrimario) {
                colorPrimario.value = primaryColor;
            }
            if (secondaryColor && colorSecundario) {
                colorSecundario.value = secondaryColor;
            }
        }

        if (backgroundType === 'image' && backgroundImage) {
            area.style.backgroundImage = `url("${backgroundImage}")`;
            area.style.backgroundSize = 'cover';
            area.style.backgroundPosition = 'center';
        } else if (primaryColor || secondaryColor) {
            const first = primaryColor || '#0d6efd';
            const second = secondaryColor || first;
            area.style.backgroundImage = `linear-gradient(135deg, ${first}, ${second})`;
        }

        return true;
    };

    const mergeObject = (baseObject = {}, nextObject = {}) => {
        const result = {...baseObject};
        Object.entries(nextObject).forEach(([key, value]) => {
            if (isPlainObject(value) && isPlainObject(baseObject[key])) {
                result[key] = mergeObject(baseObject[key], value);
                return;
            }

            result[key] = value;
        });

        return result;
    };

    const collectCanvasSnapshotFallback = () => ({
        design: null,
        canvas: {
            width: 0,
            height: 0,
            colors: {
                primary: document.getElementById('colorPrimario')?.value || null,
                secondary: document.getElementById('colorSecundario')?.value || null,
            },
            backgroundType: document.getElementById('backgroundTypeColor')?.checked ? 'color' : (document.getElementById('backgroundTypeImage')?.checked ? 'image' : null),
            backgroundImage: document.getElementById('backgroundImageInput')?.value || null,
        },
        elements: [],
        backgroundType: null,
        backgroundImage: null,
    });

    const normalizeCanvasDesign = (design, snapshot) => {
        if (!isPlainObject(design)) {
            return {
                valid: false,
                reason: 'El design recibido debe ser un objeto.',
                design: null,
            };
        }

        const baseSnapshot = isPlainObject(snapshot) ? snapshot : {};
        const designMeta = isPlainObject(design.design) ? design.design : {};
        const elements = Array.isArray(design.designElements)
            ? design.designElements
            : (Array.isArray(design.elements) ? design.elements : (Array.isArray(baseSnapshot.elements) ? baseSnapshot.elements : []));
        const normalizedDesign = {
            id: design.id ?? baseSnapshot.id ?? null,
            name_usar_medida: design.name_usar_medida ?? baseSnapshot.name_usar_medida ?? null,
            token: design.token ?? baseSnapshot.token ?? null,
            url: design.url ?? baseSnapshot.url ?? null,
            backgroundType: design.backgroundType ?? baseSnapshot.backgroundType ?? null,
            borderStyle: design.borderStyle ?? designMeta.borde ?? baseSnapshot.borderStyle ?? null,
            canvasSize: design.canvasSize ?? designMeta.lienzo ?? baseSnapshot.canvasSize ?? null,
            nombreCampana: design.nombreCampana ?? baseSnapshot.nombreCampana ?? null,
            primaryColor: design.primaryColor ?? designMeta.fondo ?? baseSnapshot.primaryColor ?? design.canvas?.colors?.primary ?? null,
            secondaryColor: design.secondaryColor ?? designMeta.acento ?? baseSnapshot.secondaryColor ?? design.canvas?.colors?.secondary ?? null,
            designElements: elements,
            backgroundImage: design.backgroundImage ?? baseSnapshot.backgroundImage ?? null,
            fotoMostrar: design.fotoMostrar ?? baseSnapshot.fotoMostrar ?? null,
        };

        if (!Array.isArray(normalizedDesign.designElements)) {
            return {
                valid: false,
                reason: 'El design recibido debe incluir designElements como lista.',
                design: null,
            };
        }

        return { valid: true, reason: '', design: normalizedDesign };
    };

    const setTypingState = (isTyping) => {
        if (!sendButton) {
            return;
        }

        sendButton.disabled = isTyping;
        sendButton.textContent = isTyping ? ui.sendingLabel : ui.sendLabel;
    };

    const buildTestPayload = (message) => {
        if (typeof window.__asistenteCamvasiaBuildPayload === 'function') {
            return window.__asistenteCamvasiaBuildPayload(message, conversationHistory);
        }

        const snapshot = typeof window.__asistenteCamvasiaCollectCanvasSnapshot === 'function'
            ? window.__asistenteCamvasiaCollectCanvasSnapshot()
            : collectCanvasSnapshotFallback();

        return {
            message,
            tenant: widget.dataset.tenant || 'marketing',
            locale: ui.locale,
            mode: 'restore',
            design: snapshot,
            canvas: snapshot.canvas,
            elements: snapshot.elements,
            snapshot,
            context: {
                origin: 'marketing',
                bubble: true,
                pathname: window.location.pathname,
                action: message,
            },
            metadata: {
                source: 'asistente-camvas-ia-widget',
                requestedAt: new Date().toISOString(),
                contract: 'canvas.restore.v1',
            },
            history: conversationHistory.slice(-8),
        };
    };

    const applyAssistantPayloadToCanvas = (payload, snapshot) => {
        const applyBridge = window.__asistenteCamvasiaApplyPayload;
        if (typeof applyBridge === 'function') {
            return Boolean(applyBridge(payload, snapshot));
        }

        const validation = normalizeCanvasDesign(payload, snapshot);
        if (!validation.valid) {
            return false;
        }

        return applyDesignToCanvas(validation.design);
    };

    const extractAssistantText = (payload) => {
        if (!payload) {
            return '';
        }

        if (typeof payload === 'string') {
            return payload;
        }

        return normalizeText(payload.message, '');
    };

    const tryParseJsonObject = (value) => {
        if (typeof value !== 'string') {
            return null;
        }

        const trimmed = value.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed);
            return isPlainObject(parsed) ? parsed : null;
        } catch (error) {
            return null;
        }
    };

    const extractDesignPayload = (payload) => {
        const candidates = [
            payload?.design,
            payload?.data?.design,
            payload?.raw?.design,
            payload?.raw?.data?.design,
            payload?.raw?.payload?.design,
        ];

        for (const candidate of candidates) {
            if (isPlainObject(candidate)) {
                return candidate;
            }

            const parsedCandidate = tryParseJsonObject(candidate);
            if (parsedCandidate?.canvas || parsedCandidate?.elements) {
                return parsedCandidate;
            }
        }

        const parsedMessage = tryParseJsonObject(payload?.message);
        if (parsedMessage?.design) {
            return parsedMessage.design;
        }

        const parsedRawContent = tryParseJsonObject(payload?.raw?.assistant_response?.content);
        if (parsedRawContent?.design) {
            return parsedRawContent.design;
        }

        return null;
    };

    const sendTestMessage = async () => {
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

        const requestPayload = buildTestPayload(message);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestPayload),
            });

            const payload = await response.json().catch(() => null);
            clearPendingState();
            const assistantText = response.ok
                ? extractAssistantText(payload) || ui.responseReceived
                : normalizeText(payload, `Error HTTP ${response.status}`);

            addMessage(response.ok ? 'assistant' : 'assistant', assistantText);
            conversationHistory.push({ role: 'assistant', content: assistantText });

            const designPayload = extractDesignPayload(payload);

            if (response.ok && designPayload) {
                const validation = normalizeCanvasDesign(designPayload, requestPayload.snapshot);
                if (validation.valid) {
                    const applied = applyAssistantPayloadToCanvas(validation.design, requestPayload.snapshot);
                    if (applied) {
                        addMessage('assistant', ui.designApplied);
                        conversationHistory.push({ role: 'assistant', content: ui.designApplied });
                    }
                } else {
                    addMessage('assistant', validation.reason);
                    conversationHistory.push({ role: 'assistant', content: validation.reason });
                }
            }
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
        void sendTestMessage();
    });

    messageInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }

        event.preventDefault();
        void sendTestMessage();
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
        if (target instanceof Node && !widget.contains(target) && target !== launchButton) {
            setOpen(false);
        }
    });

})();
