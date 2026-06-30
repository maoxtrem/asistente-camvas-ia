(function () {
    if (window.__asistenteCamvasiaLauncherInitialized) {
        return;
    }

    window.__asistenteCamvasiaLauncherInitialized = true;

    const initializeLauncher = () => {
        const launcher = document.getElementById('btnCanvasAssistant');
        
        if (!launcher || launcher.dataset.ready === '1') {
            return;
        }

        launcher.dataset.ready = '1';
        
        launcher.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            
            const isExpanded = launcher.getAttribute('aria-expanded') === 'true';
            launcher.setAttribute('aria-expanded', String(!isExpanded));

            window.dispatchEvent(new CustomEvent('asistente-camvas-ia:toggle', {
                detail: { source: 'asistente-camvas-ia-bundle' },
            }));
        }, true);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLauncher, { once: true });
    } else {
        initializeLauncher();
    }
})();