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
        } else if (href === '/' && !isRussian) {
            // On English page - hide EN link
            link.parentElement.style.display = 'none';
        } else if (href === '/ru/' && !isRussian) {
            // On English page - show RU link, rename to "Переключить на русский"
            link.textContent = '🌐 Переключить на русский';
        } else if (href === '/ru/' && isRussian) {
            // On Russian page - hide RU link
            link.parentElement.style.display = 'none';
        }
    });
});
