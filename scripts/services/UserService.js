class UserService {
    constructor() {}

    async setId(id) {
        await chrome.storage.local.set({ 'userId': id });
    }

    async getId() {
        const store = await chrome.storage.local.get(['userId']);
        return 'userId' in store ? store['userId'] : null;
    }

    async setEmail(email) {
        await chrome.storage.local.set({ 'userEmail': email });
    }

    async getEmail() {
        const store = await chrome.storage.local.get(['userEmail']);
        if (!('userEmail' in store)) return '';
        return store.userEmail;
    }

    async setToken(token) {
        await chrome.storage.local.set({ 'userToken': token });
    }

    async getToken() {
        const store = await chrome.storage.local.get(['userToken']);
        if (!('userToken' in store)) return '';
        return store.userToken;
    }
}