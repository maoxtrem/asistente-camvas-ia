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
