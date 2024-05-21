//post-process:import:./vendors/webcomponents-bundle.js
//post-process:import:./vendors/pusher.min.js
//post-process:import:./functions/createElement.js
//post-process:import:./functions/getUuid.js
//post-process:import:./functions/getUrl.js
//post-process:import:./components/DialogComponent.js
//post-process:import:./controllers/PositionController.js
//post-process:import:./common/RateBlock.js
//post-process:import:./common/SearchDropdown.js
//post-process:import:./services/RequestService.js
//post-process:import:./services/ResponseService.js
//post-process:import:./services/EventService.js
//post-process:import:./services/StateService.js
//post-process:import:./services/AnalyticsService.js
//post-process:import:./services/TextCompareService.js
//post-process:import:./services/UserService.js


window.gcc = {
    user: {},
    components: {},
    services: {}
};

const onPageActions = new Map();

onPageActions.set('openDialog', (request, sender, sendResponse) => {
    const text = request.hasOwnProperty('details')
        && request.details.hasOwnProperty('text')
        && request.details.text
        ? request.details.text
        : '';

    openDialog(text);
    return true;
});

function onMessageHandler(request, sender, sendResponse) {
    if (!onPageActions.has(request.action)) return false;
    const callback = onPageActions.get(request.action);
    callback(request, sender, sendResponse);
    return true;
}


async function load() {
    window.gcc.services.userService = new UserService();
    window.gcc.user.id = await window.gcc.services.userService.getId();

    window.gcc.services.analyticsService = new AnalyticsService();
    window.gcc.services.requestService = new RequestService(window.gcc.user.id);
    window.gcc.services.responseService = new ResponseService();
    window.gcc.services.textCompareService = new TextCompareService();

    window.gcc.components.dialog = new DialogComponent();

    initMenu();

    chrome.runtime.onMessage.addListener(onMessageHandler);
}

function initMenu() {
    chrome.runtime.sendMessage({ action: 'menu', state: 'init' });
}

function destroyMenu() {
    chrome.runtime.sendMessage({ action: 'menu', state: 'destroy' });
}

function enable() {
    if (document.readyState === "complete") {
        load();
        return;
    }

    const loadHandler = () => {
        load();
        window.removeEventListener('load', loadHandler, false);
    };

    window.addEventListener('load', loadHandler);
}

function disable() {
    //console.log('disable');

    chrome.extension.onRequest.removeListener(onMessageHandler);

    destroyMenu();

    window.gcc.services.userService = null;
    window.gcc.user.id = null;

    window.gcc.services.analyticsService = null;
    window.gcc.services.requestService = null;
    window.gcc.services.responseService = null;
    window.gcc.services.textCompareService = null;

    window.gcc.components.dialog.destroy();
    window.gcc.components.dialog = null;
}

function openDialog(text) {
    window.gcc.components.dialog.setText(text);
    window.gcc.components.dialog.show();
}

async function root() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
            case 'enable':
                enable();
                break;
            case 'disable':
                disable();
                break;
        }

        sendResponse(true);

        return true;
    });

    const store = await chrome.storage.local.get(['enabled']);
    const enabled = store['enabled'];
    if (enabled) enable();
}

root();