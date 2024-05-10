class StateService {
    constructor() { }

    sendContentMessage(args) {
        chrome.tabs.query({}, tabs => {
            for (let tab of tabs) {
                chrome.tabs.sendMessage(tab.id, args, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("error:" + chrome.runtime.lastError);
                        console.log(chrome.runtime.lastError);
                    } else {
                        console.log("message successfully sent");
                    }
                });
            }
        });
    }

    async setState(status) {
        if (status === 'on') {
            await chrome.storage.local.set({ 'enabled': true });
            this.sendContentMessage({
                action: 'enable'
            });
        } else {
            await chrome.storage.local.set({ 'enabled': false });
            this.sendContentMessage({
                action: 'disable'
            });
        }
    }

    async getState() {
        const store = await chrome.storage.local.get(['enabled']);
        return await store.enabled;
    }
}

const stateService = new StateService();