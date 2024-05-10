class WelcomeBlock {
    constructor(blockSelector, parent = document) {
        this.block = parent.querySelector(blockSelector);
        this.emailBlock = this.block.querySelector('[data-email_block]');
        
        this.userService = new UserService();

        this.init();
    }

    async init() {
        const email = await this.userService.getEmail();
        if (!email) {
            this.hide();
            return;
        }
    
        this.show(email);
    }

    setEmail(email) {
        this.emailBlock.textContent = email;
    }

    hide() {
        this.setEmail('');
        this.block.classList.add('hidden');
    }

    show(email) {
        this.setEmail(email);
        this.block.classList.remove('hidden');
    }
}