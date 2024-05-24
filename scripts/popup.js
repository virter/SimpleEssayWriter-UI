//post-process:import:./common/RateBlock.js
//post-process:import:./common/SignInButton.js
//post-process:import:./common/WelcomeBlock.js
//post-process:import:./functions/getUrl.js
//post-process:import:./functions/getUuid.js
//post-process:import:./services/StateService.js
//post-process:import:./services/EventService.js
//post-process:import:./services/UserService.js


async function initStateSwitcher() {
    const state = await stateService.getState();
    document.querySelector('[data-state_switch]').checked = state;

    document.querySelector('[data-state_switch]').addEventListener('change', async (event) => {
        if (event.target.checked) {
            chrome.runtime.sendMessage({ action: 'setState', state: 'on' });
        } else {
            chrome.runtime.sendMessage({ action: 'setState', state: 'off' });
        }
    });
}

function localize() {
    const localizeList = document.querySelectorAll('[data-localize]');
    for (let item of localizeList) {
        const label = item.dataset['localize'];
        item.innerHTML = chrome.i18n.getMessage(label);
    }
}

function openPage(url) {
    chrome.tabs.create({url: url});
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function checkUnavailable() {
    const store = await chrome.storage.local.get(['siteSupport']);

    if (!('siteSupport' in store)) return true;

    const tab = await getCurrentTab();
    if (!(tab && 'url' in tab)) return true;

    for (let item of store.siteSupport.unavailable) {
        if (tab.url.indexOf(item.domain) === -1) continue;
        return true;
    };

    return false;
}

async function checkAvailable() {
    const store = await chrome.storage.local.get(['siteSupport']);
    if (!('siteSupport' in store)) return false;

    const tab = await getCurrentTab();
    if (!(tab && 'url' in tab)) return false;

    for (let item of store.siteSupport.available) {
        if (tab.url.indexOf(item.domain) === -1) continue;
        return true;
    };

    return false;
}

async function initUnsupportedNotice() {
    //const unavailable = await checkUnavailable();
    //if (!unavailable) return;

    const unavailable = await checkUnavailable();
    if (!unavailable) return;

    const noticeBlock = document.querySelector('[data-unsupported_notice]');
    noticeBlock.classList.add('visible');

    const unsupportedHide = document.querySelectorAll('[data-unsupported_hide]');
    unsupportedHide.forEach((item) => {
        item.classList.add('hidden');
    });
}

function closeModal() {
    const feedbackModal = document.querySelector('[data-feedback_modal]');
    feedbackModal.classList.remove('-frogtool-modal--open');

    const mainModal = document.querySelector('[data-main_modal]');
    mainModal.classList.remove('hidden');
}

function showModal(type) {
    closeModal();

    switch (type) {
        case 'feedback':
            const mainModal = document.querySelector('[data-main_modal]');
            mainModal.classList.add('hidden');

            const feedbackModal = document.querySelector('[data-feedback_modal]');
            feedbackModal.classList.add('-frogtool-modal--open');

            break;
        case 'share':
            //this.shareModal.classList.add('-frogtool-modal--open');
            break;
    }
}

function initNavButtons() {
    const feedbackBtn = document.querySelector('[data-feedback_open_btn]');
    feedbackBtn.addEventListener('click', () => {
        openPage('https://docs.google.com/forms/d/e/1FAIpQLSfOHXmNDwTGK0-5VhoxxlIGvLxs0sw0yDruaK4v4RfSTuax2Q/viewform');
        //showModal('feedback');
    });

    const closeBtn = document.querySelectorAll('[data-close]');
    closeBtn.forEach((item) => {
        item.addEventListener('click', () => {
            closeModal();
        });
    });
}

function initOpenDialogBtn() {
    const btn = document.querySelector('[data-open_dialog_btn]');

    btn.addEventListener('click', () => {
        chrome.tabs.query(
            { currentWindow: true, active: true },
            async (list) => {
                const tab = list[0];
                await chrome.tabs.sendMessage(tab.id, { action: 'openDialog' });
            }
        );
    });
}


const userService = new UserService();


async function init() {
    initStateSwitcher();

    localize();
    initNavButtons();

    //const introduceBlock = document.querySelector('[data-introduce_block]');
    const token = await userService.getToken();

    /*
    if (token) {
        introduceBlock.classList.add('hidden');
    } else {
        introduceBlock.classList.remove('hidden');
    }
    */

    const welcomeBlock = new WelcomeBlock('[data-welcome_block]');
    /*
    const signInButton = new SignInButton({
        selector: '[data-sign_in_item]',
        onSignIn: (data) => {
            welcomeBlock.show(data.email);
            introduceBlock.classList.add('hidden');
        }
    });
    */

    const rateBlock = new RateBlock(
        document.querySelector('[data-rate_block]'),
        () => {
            openPage('https://docs.google.com/forms/d/e/1FAIpQLSfOHXmNDwTGK0-5VhoxxlIGvLxs0sw0yDruaK4v4RfSTuax2Q/viewform');
        },
        () => {
            // CHANGE PAGE FEEDBACK
            openPage('https://chrome.google.com/webstore/detail/grammar-check/hbffkehliekjohgiklfhbeoecbplbhdb/reviews');
        }
    );

    initOpenDialogBtn();
}

init();