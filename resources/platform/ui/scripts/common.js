window.onfocus = function () {
    if (!Cookies.get('x-authenticated')) {
        if (window.parent)
            window.parent.location.reload();
        else
            window.location.reload();
    }
};

window.toast = swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
});

window.copyToClipboard = function (str) {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

(function () {
    if ('registerElement' in document
        && 'import' in document.createElement('link')
        && 'content' in document.createElement('template')) {
        // platform is good!
    } else {
        // polyfill the platform!
        var e = document.createElement('script');
        e.src = ' https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.2.0/webcomponents-lite.js';
        document.body.appendChild(e);
    }

    $('.open-new-window').on('click', function () {
        window.open(window.location.href, '_blank');
    })
})();