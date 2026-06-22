(function () {
    if (window.__asistenteCamvasiaLauncherInitialized) {
        console.log('[asistentecamvasia-launcher] init skipped');
        return;
    }

    window.__asistenteCamvasiaLauncherInitialized = true;

    const normalizeText = (value, fallback = '') => {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed !== '' ? trimmed : fallback;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        return fallback;
    };

    const getElementType = (element) => {
        if (!element) {
            return 'unknown';
        }

        const classList = element.classList || [];
        if (classList.contains('text-item')) return 'text';
        if (classList.contains('svg-shape') || classList.contains('shape-item')) return 'shape';
        if (classList.contains('line-item')) return 'line';
        if (classList.contains('image-item') || element.tagName === 'IMG') return 'image';
        if (classList.contains('html-item')) return 'html';

        return element.tagName ? element.tagName.toLowerCase() : 'unknown';
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
            console.warn('[asistentecamvasia-launcher] transform parse fallback', error);
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

    const collectElementSnapshot = (element) => {
        if (!element) {
            return null;
        }

        const container = document.getElementById('design-area-container');
        const rect = element.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect?.() || null;
        const computedStyle = window.getComputedStyle(element);
        const textContent = normalizeText(element.textContent, '');
        const sourceElement = element.querySelector?.(':scope > .text-render-source') || element;
        const src = element.getAttribute?.('src') || element.src || null;
        const bounds = {
            left: Math.round(containerRect ? rect.left - containerRect.left : rect.left),
            top: Math.round(containerRect ? rect.top - containerRect.top : rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
        };
        const transforms = getElementTransforms(element);
        const snapshot = {
            id: element.id || null,
            type: getElementType(element),
            tagName: element.tagName ? element.tagName.toLowerCase() : null,
            classList: Array.from(element.classList || []),
            cssText: element.style?.cssText || '',
            text: textContent !== '' ? textContent.slice(0, 240) : null,
            content: normalizeText(sourceElement?.innerHTML, null),
            src,
            dataset: {...element.dataset},
            rect: {
                x: bounds.left,
                y: bounds.top,
                width: bounds.width,
                height: bounds.height,
            },
            bounds,
            transforms,
            style: {
                color: normalizeCssValue(computedStyle.color),
                backgroundColor: normalizeCssValue(computedStyle.backgroundColor),
                backgroundImage: normalizeCssValue(computedStyle.backgroundImage),
                backgroundRepeat: normalizeCssValue(computedStyle.backgroundRepeat),
                backgroundPosition: normalizeCssValue(computedStyle.backgroundPosition),
                backgroundSize: normalizeCssValue(computedStyle.backgroundSize),
                fontFamily: normalizeCssValue(computedStyle.fontFamily),
                fontSize: normalizeCssValue(computedStyle.fontSize),
                fontWeight: normalizeCssValue(computedStyle.fontWeight),
                fontStyle: normalizeCssValue(computedStyle.fontStyle),
                borderColor: normalizeCssValue(computedStyle.borderColor),
                borderWidth: normalizeCssValue(computedStyle.borderWidth),
                borderStyle: normalizeCssValue(computedStyle.borderStyle),
                opacity: normalizeCssValue(computedStyle.opacity),
                zIndex: normalizeCssValue(computedStyle.zIndex),
                width: normalizeCssValue(computedStyle.width),
                height: normalizeCssValue(computedStyle.height),
                boxShadow: normalizeCssValue(computedStyle.boxShadow),
                objectFit: normalizeCssValue(computedStyle.objectFit),
                objectPosition: normalizeCssValue(computedStyle.objectPosition),
            },
        };

        if (element.dataset.rawTransform) {
            snapshot.rawTransform = element.dataset.rawTransform;
        }

        if (snapshot.type === 'text') {
            const clonTexto = element.cloneNode(true);
            clonTexto.querySelectorAll?.('img').forEach((vista) => vista.remove());
            const contenedorFuente = clonTexto.querySelector?.(':scope > .text-render-source') || clonTexto;
            const contieneImagenInterna = !!contenedorFuente.querySelector?.('img');
            const estiloTexto = computedStyle;
            snapshot.contentHtml = contieneImagenInterna ? normalizeText(contenedorFuente.innerHTML, '') : null;
            snapshot.content = !contieneImagenInterna ? (normalizeText(contenedorFuente.textContent, '') || 'Texto') : null;
            snapshot.color = element.dataset.color || element.style.color || estiloTexto.color || null;
            snapshot.fontFamily = element.style.fontFamily || estiloTexto.fontFamily || 'Poppins, sans-serif';
            snapshot.fontSize = String(parseInt(element.style.fontSize, 10) || parseInt(estiloTexto.fontSize, 10) || 24);
            snapshot.outlineWidth = element.dataset.outlineWidth || estiloTexto.webkitTextStrokeWidth || null;
            snapshot.outlineColor = element.dataset.outlineColor || estiloTexto.webkitTextStrokeColor || null;
            snapshot.fontWeight = element.style.fontWeight || estiloTexto.fontWeight || 'normal';
            snapshot.fontStyle = element.style.fontStyle || estiloTexto.fontStyle || 'normal';
            snapshot.shadow = element.dataset.shadow || null;
            snapshot.hasShadow = element.dataset.hasShadow || null;
            snapshot.backgroundImageUrl = element.dataset.backgroundImageUrl || null;
            snapshot.backgroundSize = element.style.backgroundSize || estiloTexto.backgroundSize || null;
            snapshot.backgroundRepeat = element.style.backgroundRepeat || estiloTexto.backgroundRepeat || null;
            snapshot.backgroundPosition = element.style.backgroundPosition || estiloTexto.backgroundPosition || null;
        } else if (snapshot.type === 'shape' || snapshot.type === 'svg') {
            const svg = element.querySelector?.('svg');
            const paths = svg ? Array.from(svg.querySelectorAll('path')) : [];
            const pathPrincipal = paths.find((pathElement) => (pathElement.getAttribute('fill') || '').toLowerCase() !== 'none') || paths[0] || null;
            const imagenSvg = svg?.querySelector?.('image');
            const pathClipDom = svg?.querySelector?.('clipPath path');
            const path = element.dataset.shapePath || element.dataset.iconPath || (pathPrincipal ? pathPrincipal.getAttribute('d') : '') || '';
            const color = element.dataset.color || (pathPrincipal ? pathPrincipal.getAttribute('fill') : '') || '#060e19';
            const colorBorde = element.dataset.shapeOutlineColor || element.dataset.iconOutlineColor || (pathPrincipal ? pathPrincipal.getAttribute('stroke') : '') || 'rgba(0,0,0,0.48)';
            const anchoBorde = element.dataset.shapeOutlineWidth || element.dataset.iconOutlineWidth || (pathPrincipal ? pathPrincipal.getAttribute('stroke-width') : '') || '1';
            let svgImageHref = element.dataset.svgImageHref || element.dataset.backgroundImageUrl || null;
            if (!svgImageHref && imagenSvg) {
                svgImageHref = imagenSvg.getAttribute('href') || imagenSvg.getAttribute('xlink:href') || null;
            }
            let clipPathD = element.dataset.clipPathD || (pathClipDom ? pathClipDom.getAttribute('d') : null) || null;
            if (!clipPathD && path) {
                clipPathD = path;
            }
            let svgImageAttrs = null;
            if (element.dataset.svgImageAttrs) {
                try {
                    svgImageAttrs = JSON.parse(element.dataset.svgImageAttrs);
                } catch (error) {
                    svgImageAttrs = null;
                }
            }
            if (!svgImageAttrs && imagenSvg) {
                svgImageAttrs = {
                    x: imagenSvg.getAttribute('x'),
                    y: imagenSvg.getAttribute('y'),
                    width: imagenSvg.getAttribute('width'),
                    height: imagenSvg.getAttribute('height'),
                    preserveAspectRatio: imagenSvg.getAttribute('preserveAspectRatio'),
                };
            }

            snapshot.subtype = element.dataset.subtype || (element.classList.contains('icon-item') ? 'icon' : 'shape');
            snapshot.path = path;
            snapshot.color = color;
            snapshot.shapeOutlineColor = colorBorde;
            snapshot.shapeOutlineWidth = anchoBorde;
            snapshot.svgId = element.dataset.shapeId || element.dataset.svgId || null;
            snapshot.svgImageHref = svgImageHref;
            snapshot.clipPathD = svgImageHref ? clipPathD : null;
            snapshot.svgImageAttrs = svgImageHref ? svgImageAttrs : null;
            snapshot.gradientType = element.dataset.gradientType || null;
            snapshot.gradientColor1 = element.dataset.gradientColor1 || null;
            snapshot.gradientColor2 = element.dataset.gradientColor2 || null;
            snapshot.gradientDirection = element.dataset.gradientDirection || null;
        } else if (snapshot.type === 'image') {
            snapshot.cropData = element.dataset.cropData || null;
            snapshot.originalSrc = element.dataset.originalSrc || null;
        } else if (snapshot.type === 'html') {
            const botonInterno = element.querySelector?.('button');
            const contenido = botonInterno ? botonInterno.innerHTML : (element.querySelector?.('.html-content-wrapper')?.innerHTML || element.innerHTML);
            const colorFondo = botonInterno?.style?.backgroundColor || element.dataset.htmlBackgroundColor || element.dataset.color || null;
            const colorTextoHtml = botonInterno?.style?.color || element.dataset.htmlTextColor || null;
            snapshot.content = contenido;
            snapshot.classList = botonInterno ? Array.from(botonInterno.classList) : snapshot.classList;
            snapshot.cssText = botonInterno ? botonInterno.style.cssText : snapshot.cssText;
            snapshot.backgroundColor = colorFondo;
            snapshot.fontSize = botonInterno?.style.fontSize || null;
            snapshot.fontFamily = botonInterno?.style.fontFamily || null;
            snapshot.fontWeight = botonInterno?.style.fontWeight || null;
            snapshot.htmlType = element.dataset.htmlType || null;
            snapshot.link = element.dataset.link || null;
            snapshot.textColor = colorTextoHtml;
        } else if (snapshot.type === 'line') {
            snapshot.lineType = element.dataset.lineType || 'solid';
            snapshot.thickness = element.dataset.thickness || 2;
            snapshot.color = element.dataset.color || '#000000';
        }

        return snapshot;
    };

    const collectCanvasSnapshot = () => {
        const canvasContainer = document.getElementById('canvas-container');
        const designAreaContainer = document.getElementById('design-area-container');
        const designArea = document.getElementById('design-area');
        const tamanoLienzo = document.getElementById('tamanoLienzo');
        const usarMedidasManuales = document.getElementById('usarMedidasManuales');
        const anchoManual = document.getElementById('anchoManual');
        const altoManual = document.getElementById('altoManual');
        const colorPrimario = document.getElementById('colorPrimario');
        const colorSecundario = document.getElementById('colorSecundario');
        const backgroundColorRadio = document.getElementById('backgroundTypeColor');
        const backgroundImageRadio = document.getElementById('backgroundTypeImage');
        const backgroundImageInput = document.getElementById('backgroundImageInput');
        const selectedBackgroundType = backgroundColorRadio?.checked
            ? 'color'
            : (backgroundImageRadio?.checked ? 'image' : null);

        const containerRect = (designAreaContainer || canvasContainer || designArea)?.getBoundingClientRect?.() || {
            width: 0,
            height: 0,
        };

        const manualSizeEnabled = !!usarMedidasManuales?.checked;
        const widthValue = manualSizeEnabled
            ? Number(anchoManual?.value || 0)
            : Number.parseInt(String(tamanoLienzo?.value || '').split('x')[0] || '', 10);
        const heightValue = manualSizeEnabled
            ? Number(altoManual?.value || 0)
            : Number.parseInt(String(tamanoLienzo?.value || '').split('x')[1] || '', 10);
        const canvasWidth = Number.isFinite(widthValue) && widthValue > 0 ? widthValue : Math.round(containerRect.width || 0);
        const canvasHeight = Number.isFinite(heightValue) && heightValue > 0 ? heightValue : Math.round(containerRect.height || 0);
        const elements = Array.from(designArea?.querySelectorAll('.draggable-item') || [])
            .map(collectElementSnapshot)
            .filter(Boolean);

        const elementTypes = elements.reduce((accumulator, element) => {
            accumulator[element.type] = (accumulator[element.type] || 0) + 1;
            return accumulator;
        }, {});

        return {
            canvas: {
                width: canvasWidth,
                height: canvasHeight,
                size: tamanoLienzo?.value || null,
                manualSizeEnabled,
                backgroundType: selectedBackgroundType,
                colors: {
                    primary: colorPrimario?.value || null,
                    secondary: colorSecundario?.value || null,
                },
                backgroundImageSelected: !!backgroundImageInput?.files?.length,
            },
            elements,
            context: {
                origin: 'marketing',
                bubble: true,
                pathname: window.location.pathname,
                action: 'collect_canvas_state',
                elementCount: elements.length,
                elementTypes,
            },
            metadata: {
                source: 'asistente-camvas-ia-widget',
                requestedAt: new Date().toISOString(),
                canvasContainer: {
                    width: Math.round(containerRect.width || 0),
                    height: Math.round(containerRect.height || 0),
                },
            },
        };
    };

    window.__asistenteCamvasiaCollectCanvasSnapshot = collectCanvasSnapshot;
    window.__asistenteCamvasiaBuildPayload = (message, conversationHistory = []) => {
        const snapshot = collectCanvasSnapshot();

        return {
            message,
            tenant: document.getElementById('asistentecamvasia-widget')?.dataset.tenant || 'marketing',
            locale: 'es',
            mode: 'generate',
            canvas: snapshot.canvas,
            elements: snapshot.elements,
            snapshot,
            context: {
                ...snapshot.context,
                action: normalizeText(message, 'collect_canvas_state'),
                snapshot,
            },
            metadata: {
                ...snapshot.metadata,
                source: 'asistente-camvas-ia-widget',
                requestedAt: new Date().toISOString(),
            },
            history: conversationHistory.slice(-8),
        };
    };

    const initializeLauncher = () => {
        const launcher = document.getElementById('btnCanvasAssistant');
        console.log('[asistentecamvasia-launcher] initialize', {
            launcherFound: !!launcher,
            ready: launcher?.dataset.asistenteCamvasiaLauncherReady === '1',
        });
        if (!launcher || launcher.dataset.asistenteCamvasiaLauncherReady === '1') {
            return;
        }

        launcher.dataset.asistenteCamvasiaLauncherReady = '1';
        launcher.addEventListener('click', (event) => {
            console.log('[asistentecamvasia-launcher] click', {
                targetTag: event.target?.tagName,
                targetId: event.target?.id || null,
                isTrusted: event.isTrusted,
            });
            event.preventDefault();
            event.stopImmediatePropagation();
            launcher.setAttribute('aria-expanded', launcher.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');

            window.dispatchEvent(new CustomEvent('asistente-camvas-ia:toggle', {
                detail: {
                    source: 'asistente-camvas-ia-bundle',
                },
            }));
        }, true);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLauncher, { once: true });
    } else {
        initializeLauncher();
    }
})();
