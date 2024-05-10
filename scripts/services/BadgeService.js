class BadgeService {
    constructor() {}

    async init() {
        const store = await chrome.storage.local.get(['enabled']);
        if (store.enabled) {
            this.setBadge('on');
        } else {
            this.setBadge('off');
        }
    }

    setBadge(status = 'on') {
        if (status === 'on') {
            chrome.action.setBadgeText({ text: '' });
        } else {
            chrome.action.setBadgeText({ text: 'off' });
            chrome.action.setBadgeBackgroundColor({ color: '#FF2A51' });
            chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
        }
    }
}

const badgeService = new BadgeService();