(() => {
    let username = document.querySelector('#username');
    let original_username_class = username.getAttribute('class');
    let password = document.querySelector('#password');
    let original_password_class = password.getAttribute('class');
    let login_btn = document.querySelector('#login-btn');

    /**
     * Verifica que el nombre de usuario no esté vacío
     * @returns True cuando no está vacío, false de lo contrario
     */
    function check_username() {
        username.classList.remove('bg-lime-200');

        // Campo vacío
        if (username.value.length == 0) {
            username.setAttribute('class', original_username_class);
            return false;
        // Campo no está vacío
        } else {
            username.classList.add('bg-lime-200');
            return true;
        }
    }

    /**
     * Verifica que la contraseña del usuario no esté vacía
     * @returns True cuando o está vacía, false de lo contrario
     */
    function check_password() {
        password.classList.remove('bg-lime-200');

        // Campo vacío
        if (password.value.length == 0) {
            password.setAttribute('class', original_password_class);
            return false;
        // Campo no está vacío
        } else {
            password.classList.add('bg-lime-200');
            return true;
        }
    }

    /**
     * Habilita/deshabilita el botón para iniciar sesión
     */
    function enable_login_btn() {
        let user_ok = check_username();
        let pass_ok = check_password();

        login_btn.disabled = !(user_ok && pass_ok);
    }

    username.addEventListener('keyup', enable_login_btn);
    password.addEventListener('keyup', enable_login_btn);
})();