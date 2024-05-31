//post-process:import:./functions/getUuid.js
//post-process:import:./services/BadgeService.js
//post-process:import:./services/StateService.js
//post-process:import:./services/AnalyticsService.js
//post-process:import:./services/UserService.js
importScripts('./functions/getUuid.js'); //post-process:delete-line
importScripts('./services/BadgeService.js'); //post-process:delete-line
importScripts('./services/StateService.js'); //post-process:delete-line
importScripts('./services/AnalyticsService.js'); //post-process:delete-line
importScripts('./services/UserService.js'); //post-process:delete-line


async function init() {
    await loadSettings();
}

async function loadSettings() {
    const url = 'https://aiwordchecker.online/api/settings';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        settings = await response.json();

        await loadLanguageList(settings);
        await loadDomainList(settings);
    } catch (error) {
        throw error;
    }
}

async function loadLanguageList(settings) {
    if (!('languages' in settings)) return;
    await setLanguageList(settings.languages);
}

async function setLanguageList(languages) {
    const list = [];

    for (let item of languages) {
        list.push({
            'code': item.code,
            'name': item.name
        })
    }

    try {
        await chrome.storage.local.set({ 'languageList': list });
        await chrome.storage.local.set({ 'language': list[0].code });
    } catch {
        console.log(error);
    }
}

async function loadDomainList() {
    const domains = {
        unsupported_domains: [],
        supported_domains: []
    };

    if ('unsupported_domains' in settings) {
        domains.unsupported_domains = settings.unsupported_domains;
    }

    if ('supported_domains' in settings) {
        domains.supported_domains = settings.supported_domains;
    }

    await setDomainList(domains);
}

async function setDomainList(domains) {
    const siteSupport = {
        unavailable: [],
        available: []
    };

    if ('unsupported_domains' in domains) {
        for (let item of domains.unsupported_domains) {
            siteSupport.unavailable.push({
                domain: item
            });
        }
    }

    if ('supported_domains' in domains) {
        for (let item of domains.supported_domains) {
            siteSupport.available.push({
                domain: item
            });
        }
    }

    try {
        await chrome.storage.local.set({ 'siteSupport': siteSupport });
    } catch(error) {
        console.log(error);
    }
}

async function setDefaults() {
    const options = {
        'enabled': true
    };

    await chrome.storage.local.set(options);

    chrome.runtime.setUninstallURL('https://docs.google.com/forms/d/e/1FAIpQLSfOHXmNDwTGK0-5VhoxxlIGvLxs0sw0yDruaK4v4RfSTuax2Q/viewform');
}

function openPage(url) {
    chrome.tabs.create({ url: url });
}

function onClickContextMenu(info, tab) {
    if (info.menuItemId === 'openDialog') {
        chrome.tabs.sendMessage(tab.id, {
            action: 'openDialog',
            details: {
                text: info.selectionText
            }
        });
    }

    return true;
}

function initMenu() {
    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
        id: 'openDialog',
        title: chrome.i18n.getMessage('context_open_dialog_btn'),
        contexts: [
            'selection'
        ]
    });
    
    chrome.contextMenus.onClicked.addListener(onClickContextMenu);
}

function destroyMenu() {
    chrome.contextMenus.onClicked.removeListener(onClickContextMenu);
    chrome.contextMenus.removeAll();
}


chrome.runtime.onStartup.addListener(async () => {
    await init();
});

chrome.runtime.onInstalled.addListener(async (details) => {
    await init();
    await setDefaults();

    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        const userId = getUuid();
        const userService = new UserService();
        await userService.setId(userId);

        const analyticsService = new AnalyticsService();
        analyticsService.sendEvent(userId, 'extension_install');

        openPage('https://wordsuperb.com/simple-essay-start');
    } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        // When extension is updated
    } else if (details.reason === chrome.runtime.OnInstalledReason.CHROME_UPDATE) {
        // When browser is updated
    } else if (details.reason === chrome.runtime.OnInstalledReason.SHARED_MODULE_UPDATE) {
        // When a shared module is updated
    }
});


const backgroundActions = new Map();

backgroundActions.set('setState', (request, sender, sendResponse) => {
    badgeService.setBadge(request.state);
    stateService.setState(request.state);
    return true;
});

backgroundActions.set('menu', (request, sender, sendResponse) => {
    switch (request.state) {
        case 'init':
            initMenu();
            break;
        case 'destroy':
            destroyMenu();
            break;
    }
    return true;
});

backgroundActions.set('setLanguage', async (request, sender, sendResponse) => {
    try {
        await chrome.storage.local.set({ 'language': request.language });
        sendResponse(true);
        return true;
    } catch (error) {
        return false;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!backgroundActions.has(request.action)) return false;
    const callback = backgroundActions.get(request.action);
    callback(request, sender, sendResponse);
    return true;
});