// Auto-redirect based on domain or user's locale preference
(function() {
    var hostname = window.location.hostname;
    var isXr2Site = hostname.indexOf('xr2.site') !== -1;  // Russian domain
    var isDocsXr2Uk = hostname.indexOf('docs.xr2.uk') !== -1;  // English domain

    // On production domains, no auto-redirect needed — domain determines language
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

// Hide language switcher on production domains, show on localhost
document.addEventListener('DOMContentLoaded', function() {
    var hostname = window.location.hostname;
    var isXr2Site = hostname.indexOf('xr2.site') !== -1;
    var isDocsXr2Uk = hostname.indexOf('docs.xr2.uk') !== -1;
    var isRussian = window.location.pathname.indexOf('/ru') !== -1;

    var links = document.querySelectorAll('.wy-menu a');
    links.forEach(function(link) {
        var href = link.getAttribute('href');
        if (!href) return;

        var isEnLink = href === '/' || href === '/documentation/';
        var isRuLink = href === '/ru/' || href === '/documentation/ru/';

        if (isXr2Site || isDocsXr2Uk) {
            // Production: hide all language switcher links
            if (isEnLink || isRuLink) {
                link.parentElement.style.display = 'none';
            }
        } else {
            // Localhost: show only the "switch to other language" link
            if (isEnLink && isRussian) {
                link.textContent = '🌐 Switch to English';
                link.addEventListener('click', function() {
                    sessionStorage.setItem('docs_lang_selected', 'true');
                });
            } else if (isEnLink && !isRussian) {
                link.parentElement.style.display = 'none';
            } else if (isRuLink && !isRussian) {
                link.textContent = '🌐 Переключить на русский';
                link.addEventListener('click', function() {
                    sessionStorage.setItem('docs_lang_selected', 'true');
                });
            } else if (isRuLink && isRussian) {
                link.parentElement.style.display = 'none';
            }
        }
    });
});
