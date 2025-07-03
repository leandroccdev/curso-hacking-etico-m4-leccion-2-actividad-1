(() => {
    let title = document.querySelector('#title');
    let body = document.querySelector('#body');
    let save_btn = document.querySelector('#save-btn');

    /**
     * Habilita/deshabilita
     */
    function enable_save_btn() {
        let title_ok = title.value.length > 0;
        let body_ok = body.value.length;

        save_btn.disabled = !(title_ok && body_ok);
    }

    title.addEventListener('keyup', enable_save_btn);
    body.addEventListener('keyup', enable_save_btn);
})();