(() => {
    let title = document.querySelector('#title');
    let original_title_class = title.getAttribute('class');
    let body = document.querySelector('#body');
    let original_body_class = body.getAttribute('class');
    let create_btn = document.querySelector('#create-btn');

    /**
     * Valida que el titulo tenga contenido
     * @returns True cuando el titulo tiene al menos un caracter
     */
    function check_title() {
        title.classList.remove('bg-lime-200');
        // Campo vacío
        if (title.value.length == 0) {
            title.setAttribute('class', original_title_class);
            console.log(title.getAttribute('class'));
            return false;
        }
        // Al menos un caracter
        else {
            title.classList.add('bg-lime-200');
        }

        return title.value.length > 0;
    }

    /**
     * Valida que el body del mensaje tenga al menos un caracter
     * @returns True cuando el body tiene al menos un caracter
     */
    function check_body() {
        body.classList.remove('bg-lime-200');
        // Campo vacío
        if (body.value.length === 0) {
            body.setAttribute('class', original_body_class);
            return false;
        }
        // Al menos 1 caracter
        else {
            body.classList.add('bg-lime-200');
        }

        return body.value.length > 0;
    }

    /**
     * Habilita/deshabilita
     */
    function enable_create_btn() {
        let title_ok = check_title();
        let body_ok = check_body();

        create_btn.disabled = !(title_ok && body_ok);
    }

    title.addEventListener('keyup', enable_create_btn);
    body.addEventListener('keyup', enable_create_btn);
})();