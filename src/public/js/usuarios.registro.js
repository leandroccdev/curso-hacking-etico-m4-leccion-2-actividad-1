(() => {
    let username = document.querySelector('#username');
    let username_min_length = username.getAttribute('minlength');
    let username_max_length = username.getAttribute('maxlength');
    let original_username_class = username.classList.toString();
    let password = document.querySelector('#password');
    let password2 = document.querySelector('#password2');
    let original_password_class = password.classList.toString();
    let original_password2_class = password2.classList.toString();
    let register_btn = document.querySelector('#registrar-btn');

    // Errores
    let err_passsword_not_match = document.querySelector('#err-password2-not-match');

    /**
     * Verifica que el nombre de usuario no sea vacío
     * @returns True cuando el nombre de usuario es válido, false de lo contrario.
     */
    function check_user_name() {
        // Resetear campo
        username.classList.remove('bg-lime-200');
        username.classList.remove('bg-red-200');

        // Campo vacío
        if (username.value.length == 0)
            return false;

        let is_valid = username.value.length > username_min_length &&
            username.value.length <= username_max_length;

        if (is_valid) {
            username.setAttribute('class', original_username_class);
            username.classList.add('bg-lime-200');
        } else {
            username.classList.add('bg-red-200');
        }

        return is_valid;
    }

    /**
     * Valida que las contraseñas concuerden
     * @returns True cuando ambas contraseñas concuerdan, false de lo contrario.
     */
    function check_passwords() {
        // Resetear campos
        password.classList.remove('bg-lime-200');
        password2.classList.remove('bg-lime-200');
        password.classList.remove('bg-red-200');
        password2.classList.remove('bg-red-200');

        // Campos vacíos
        if (password.value.length == 0 || password2.value.length == 0) {
            // Restaura clases originales de elementos
            password.setAttribute('class', original_password_class);
            password2.setAttribute('class', original_password2_class);
            err_passsword_not_match.classList.add('hidden');
            return false;
        }

        // Contraseñas concuerdan
        if (password.value === password2.value) {
            password.classList.add('bg-lime-200');
            password2.classList.add('bg-lime-200');
            err_passsword_not_match.classList.add('hidden');
            // Contraseñas no concuerdan
        } else {
            password.classList.add('bg-red-200');
            password2.classList.add('bg-red-200');
            err_passsword_not_match.classList.remove('hidden');
        }

        return password.value === password2.value;
    }

    /**
     * Habilita/deshabilita el botón para registrar un usuario
     */
    function enable_register_btn() {
        let user_ok = check_user_name();
        let pass_ok = check_passwords();
        register_btn.disabled = !(user_ok && pass_ok);
    }

    username.addEventListener('keyup', enable_register_btn)
    password.addEventListener('keyup', enable_register_btn);
    password2.addEventListener('keyup', enable_register_btn)
})();