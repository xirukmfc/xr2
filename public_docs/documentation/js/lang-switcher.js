// Auto-redirect based on domain or user's locale preference
(function() {
    var hostname = window.location.hostname;
    var isXr2Site = hostname.indexOf('xr2.site') !== -1;
    var isDocsXr2Uk = hostname.indexOf('docs.xr2.uk') !== -1;

    // On production domains, no auto-redirect needed
    if (isXr2Site || isDocsXr2Uk) return;

    // Localhost: read locale from cookie or localStorage and redirect
    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }

    var savedLocale = getCookie('locale') || localStorage.getItem('locale');
    var isRussian = window.location.pathname.startsWith('/ru');
    var currentPath = window.location.pathname;

    var hasManuallySelected = sessionStorage.getItem('docs_lang_selected');

    if (!hasManuallySelected && savedLocale) {
        if (savedLocale === 'ru' && !isRussian) {
            var newPath = '/ru' + (currentPath === '/' ? '/' : currentPath);
            window.location.replace(newPath);
            return;
        } else if (savedLocale === 'en' && isRussian) {
            var newPath = currentPath.replace(/^\/ru/, '') || '/';
            window.location.replace(newPath);
            return;
        }
    }
})();

// Hide language switcher on production domains
document.addEventListener('DOMContentLoaded', function() {
    var hostname = window.location.hostname;
    var isXr2Site = hostname.indexOf('xr2.site') !== -1;
    var isDocsXr2Uk = hostname.indexOf('docs.xr2.uk') !== -1;
    var isRussian = window.location.pathname.indexOf('/ru') !== -1;

    var links = document.querySelectorAll('.wy-menu a');
    links.forEach(function(link) {
        var text = link.textContent || '';

        if (isXr2Site || isDocsXr2Uk) {
            // Production: hide ALL language switcher links (any link with 🌐)
            if (text.indexOf('🌐') !== -1) {
                link.parentElement.style.display = 'none';
            }
        } else {
            // Localhost: show only the "switch to other language" link
            if (text.indexOf('🌐 EN') !== -1) {
                if (isRussian) {
                    link.textContent = '🌐 Switch to English';
                    link.addEventListener('click', function() {
                        sessionStorage.setItem('docs_lang_selected', 'true');
                    });
                } else {
                    link.parentElement.style.display = 'none';
                }
            } else if (text.indexOf('🌐 RU') !== -1) {
                if (!isRussian) {
                    link.textContent = '🌐 Переключить на русский';
                    link.addEventListener('click', function() {
                        sessionStorage.setItem('docs_lang_selected', 'true');
                    });
                } else {
                    link.parentElement.style.display = 'none';
                }
            }
        }
    });
});
