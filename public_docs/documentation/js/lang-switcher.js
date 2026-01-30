// Auto-redirect based on user's locale preference from xR2 portal
(function() {
    var savedLocale = localStorage.getItem('locale');
    var isRussian = window.location.pathname.startsWith('/ru');
    var currentPath = window.location.pathname;

    // Only redirect on first visit (not if user manually switched)
    var hasManuallySelected = sessionStorage.getItem('docs_lang_selected');

    if (!hasManuallySelected && savedLocale) {
        if (savedLocale === 'ru' && !isRussian) {
            // User prefers Russian but is on English page - redirect to Russian
            var newPath = '/ru' + (currentPath === '/' ? '/' : currentPath);
            window.location.replace(newPath);
            return;
        } else if (savedLocale === 'en' && isRussian) {
            // User prefers English but is on Russian page - redirect to English
            var newPath = currentPath.replace(/^\/ru/, '') || '/';
            window.location.replace(newPath);
            return;
        }
    }
})();

// Show only the "switch to other language" link
document.addEventListener('DOMContentLoaded', function() {
    var isRussian = window.location.pathname.startsWith('/ru');

    // Find language links
    var links = document.querySelectorAll('.wy-menu a');
    links.forEach(function(link) {
        var href = link.getAttribute('href');
        if (href === '/' && isRussian) {
            // On Russian page - show EN link, rename to "Switch to English"
            link.textContent = '🌐 Switch to English';
            link.addEventListener('click', function() {
                sessionStorage.setItem('docs_lang_selected', 'true');
            });
        } else if (href === '/' && !isRussian) {
            // On English page - hide EN link
            link.parentElement.style.display = 'none';
        } else if (href === '/ru/' && !isRussian) {
            // On English page - show RU link, rename to "Переключить на русский"
            link.textContent = '🌐 Переключить на русский';
            link.addEventListener('click', function() {
                sessionStorage.setItem('docs_lang_selected', 'true');
            });
        } else if (href === '/ru/' && isRussian) {
            // On Russian page - hide RU link
            link.parentElement.style.display = 'none';
        }
    });
});
