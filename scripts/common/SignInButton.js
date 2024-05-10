class SignInButton {
    constructor(args) {
        const {
            selector,
            parent = document,
            onSignIn = () => {}
        } = args;

        this.block = parent.querySelector(selector);
        this.btn = this.block.querySelector('[data-sign_in_btn]');

        this.onSignIn = onSignIn;

        this.userService = new UserService();

        this.init();
    }

    async init() {
        const token = await this.userService.getToken();
        if (token) return;
    
        this.show();
    
        this.btn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'login' }, async (response) => {
                if (!response.token || !response.email) return;

                await this.userService.setToken(response.token);
                await this.userService.setEmail(response.email);

                this.onSignIn({
                    token: response.token,
                    email: response.email
                });

                this.hide();
    
                return true;
            });
        });
    }

    hide() {
        this.block.classList.add('hidden');
    }

    show() {
        this.block.classList.remove('hidden');
    }
}