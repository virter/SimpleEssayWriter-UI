function openPage(url) {
    window.open(url, '_blank');
}

class DialogComponent {
    constructor() {
        this.tagName = 'sew-dialog';

        this.template = new DialogTemplate();
        this.eventService = new EventService();

        //this.initialText = '';
        this.text = '';

        //this.mode = 'normal';
        //this.highlightEnabled = true;
        this.textPrepared = false;
        this.appendInterval = false;

        this.copyTipStart = null;
        this.copyTipInterval = null;

        this.analyticsService = window.gcc.services.analyticsService;

        this.textCompareService = window.gcc.services.textCompareService;
        this.requestService = window.gcc.services.requestService;
        this.responseService = window.gcc.services.responseService;

        this.create();
        this.initListeners();
    }

    define() {
        if (customElements.get(this.tagName) !== undefined) return;
        customElements.define(this.tagName, class extends HTMLElement {
            connectedCallback() { }
        });
    }

    async create() {
        this.define();

        this.wrapper = createElement(
            this.tagName,
            {
                'display': 'block',
                'position': 'fixed',
                'left': '0px',
                'top': '0px',
                'transform': 'translate(1000vw, 1000vh)',
                'z-index': 10020
            }
        );
        this.shadow = this.wrapper.attachShadow({ mode: 'closed' });
        this.shadow.innerHTML += `<style>${this.template.style}</style>${this.template.html}`;

        document.body.appendChild(this.wrapper);

        await this.initElements();
    }

    async initLangDropdown() {
        const store = await chrome.storage.local.get(['languageList', 'language']);
        if (!('languageList' in store)) return;

        const items = store.languageList.map(item => {
            return {
                name: item.name,
                value: item.code
            };
        });


        this.levelSelect = new SearchDropdown({
            block: this.shadow.querySelector('[data-level_select]'),
            items: [
                { name: 'Elementary', value: 'elementary' },
                { name: 'Middle School', value: 'middle_school' },
                { name: 'High School', value: 'high_school' },
                { name: 'College', value: 'college' },
                { name: 'Graduate School', value: 'graduate_school' },
            ],
            active: 'college',
        });

        this.levelSelect = new SearchDropdown({
            block: this.shadow.querySelector('[data-essay_style_select]'),
            items: [
                { name: 'Classic', value: 'classic' },
                { name: 'Compare/Contrast', value: 'compare_contrast' },
                { name: 'Argumentative', value: 'argumentative' },
                { name: 'Persuasive', value: 'college' },
                { name: 'Critique', value: 'persuasive' },
                { name: 'Memoir', value: 'memoir' }
            ],
            active: 'classic',
        });

        this.levelSelect = new SearchDropdown({
            block: this.shadow.querySelector('[data-ref_style_select]'),
            items: [
                { name: 'APA', value: 'apa' },
                { name: 'Chicago', value: 'chicago' },
                { name: 'Harvard', value: 'harvard' },
                { name: 'MLA', value: 'mla' }
            ],
            active: 'mla',
        });

        


        const activeLanguage = 'language' in store ? store.language : null;

        this.languageSelect = new SearchDropdown({
            block: this.shadow.querySelector('[data-language_select]'),
            items: items,
            active: activeLanguage,
            handlers: {
                onChange: (data) => {
                    chrome.runtime.sendMessage({
                        action: 'setLanguage',
                        language: data.value
                    });
                }
            }
        });
    }

    async initElements() {
        this.dialog = this.shadow.querySelector('[data-dialog]');
        this.btnClose = this.shadow.querySelectorAll('[data-btn_close]');
        this.sendBtn = this.shadow.querySelector('[data-send_btn]');
        this.resultText = this.shadow.querySelector('[data-result_text]');
        //this.highlightText = this.shadow.querySelector('[data-highlight_text]');
        this.copyBtn = this.shadow.querySelector('[data-copy_btn]');
        //this.highlightBtn = this.shadow.querySelector('[data-highlight_btn]');
        this.copyTip = this.shadow.querySelector('[data-copy_tip]');
        this.rateLine = this.shadow.querySelector('[data-rate_line]');
        this.sendDescription = this.shadow.querySelector('[data-send_description]');

        this.rateBlock = new RateBlock(
            this.shadow.querySelector('[data-rate_block]'),
            () => {
                openPage('https://docs.google.com/forms/d/e/1FAIpQLSfOHXmNDwTGK0-5VhoxxlIGvLxs0sw0yDruaK4v4RfSTuax2Q/viewform');
            },
            () => {
                // PAGE FEEDBACK
                openPage('https://chrome.google.com/webstore/detail/ai-essay-writer/blcamfmkmjdbigcliokaebahmolamlfp/reviews');
            }
        );

        this.initLangDropdown();
    }

    destroy() {
        //console.log(this.wrapper);

        this.terminateListeners();
        this.wrapper.remove();
    }

    initListeners() {
        this.eventService.add({
            event: 'mousedown',
            element: this.btnClose,
            handler: (event) => {
                this.hide();
            }
        });

        this.eventService.add({
            event: 'mousedown',
            element: this.sendBtn,
            handler: (event) => {
                if (this.sendBtn.dataset['loading'] === 'true') return;
                this.sendRequest(true);
            }
        });

        this.eventService.add({
            event: 'mousedown',
            element: this.copyBtn,
            handler: (event) => {
                this.copyResult();
            }
        });

        /*
        this.eventService.add({
            event: 'mousedown',
            element: this.highlightBtn,
            handler: (event) => {
                this.toggleHighlight();
            }
        });
        */
    }

    terminateListeners() {
        this.eventService.removeAll();
    }

    showRateLine() {
        this.rateLine.classList.remove('hidden');
    }

    show() {
        this.resetProperties();

        this.wrapper.style.transform = 'unset';
    }

    hide() {
        this.wrapper.style.transform = 'translate(1000vw, 1000vh)';
    }

    setText(text) {
        //this.inputText.value = text;
    }

    reset() {
        this.hide();
        this.setText('');
    }

    prepareHTML(text, newline = '<br>') {
        return text.replaceAll('\n', newline);
    }

    clearAppendInterval() {
        clearInterval(this.appendInterval);
        this.appendInterval = null;
    }

    resetText() {
        this.textPrepared = false;

        //this.initialText = '';

        this.text = '';
        this.html = '';

        this.resultText.innerHTML = '';
    }

    resetHighlightText() {
        this.highlightText.innerHTML = '';
    }

    createBrElement() {
        return document.createElement('br');
    }

    createSingleHighlightElement(text, type) {
        const span = document.createElement('span');
        span.classList.add('sew_highlight');
        span.innerHTML = text;

        if (!text.length) {
            span.classList.add('empty');
            return span;
        }

        if (type === -1) {
            span.classList.add('red');
        } else if (type === 1) {
            span.classList.add('green');
        }

        return span;
    }

    createHighlightElements(diffItem) {
        const type = diffItem[0];
        let text = diffItem[1].replaceAll('\r', '');

        const res = [];
        let pos = text.indexOf('\n');

        while (pos !== -1) {
            const line = text.substring(0, pos);
            const element = this.createSingleHighlightElement(line, type);
            if (element) res.push(element);

            const br = this.createBrElement();
            res.push(br);

            text = text.substring(pos + 1);
            pos = text.indexOf('\n');
        }

        const element = this.createSingleHighlightElement(text, type); // last line add
        if (element) res.push(element);

        return res;
    }

    updateHighlightText() {
        if (!this.highlightEnabled) return;

        this.resetHighlightText();

        const textDiff = this.textCompareService.compare(
            this.initialText,
            this.text
        );

        const newElements = [];

        textDiff.map(item => {
            const elements = this.createHighlightElements(item);
            elements.map(element => newElements.push(element));
        });

        newElements.map(element => {
            this.highlightText.appendChild(element);
        });

        return true;
    }

    async appendText(text, duration = 15) {
        this.textPrepared = true;

        this.text += text;
        this.html += this.prepareHTML(text);

        if (duration === 0) {
            this.resultText.innerHTML = this.html;
            return new Promise(resolve => { resolve(true); });
        }

        return new Promise(resolve => {
            let i = 0;

            this.appendInterval = setInterval(() => {
                const ch = text.substring(i, i + 1);
                this.resultText.innerHTML += this.prepareHTML(ch);
                //this.updateHighlightText();

                i++;

                if (i === text.length) {
                    this.clearAppendInterval();
                    resolve(true);
                }
            }, duration);
        });
    }

    showSendDescription() {
        this.sendDescription.classList.add('visible');
    }

    hideSendDescription() {
        this.sendDescription.classList.remove('visible');
    }

    resetProperties() {
        this.clearAppendInterval();
        this.resetText();
        this.unsetSendButtonLoading();
        this.hideSendDescription();
        //this.resetHighlightText();
    }

    toggleHighlight() {
        if (!this.highlightEnabled) return false;

        if (this.mode === 'normal') {
            this.showHighlight();
        } else if (this.mode === 'highlight') {
            this.hideHighlight();
        }
    }

    showHighlight() {
        if (!this.highlightEnabled) return false;

        this.mode = 'highlight';
        this.dialog.classList.add('highlight');
    }

    hideHighlight() {
        this.mode = 'normal';
        this.dialog.classList.remove('highlight');
    }

    enableHighlight() {
        this.highlightEnabled = true;
    }

    disableHighlight() {
        this.highlightEnabled = false;
        //this.hideHighlightButton();
        this.hideHighlight();
        this.resetHighlightText();
    }

    showCopyTip() {
        this.copyTip.classList.add('visible');

        this.copyTipStart = new Date();

        if (this.copyTipInterval !== null) return;

        this.copyTipInterval = setInterval(() => {
            const delta = new Date() - this.copyTipStart;
            if (delta < 1000) return;

            this.hideCopyTip();
            clearInterval(this.copyTipInterval);

            this.copyTipStart = null;
            this.copyTipInterval = null;
        }, 200);
    }

    hideCopyTip() {
        this.copyTip.classList.remove('visible');
    }

    copyResult() {
        navigator.clipboard.writeText(this.text).then(() => {
            this.showCopyTip();
        }).catch((error) => {
            console.log(error);
        });
    }

    setSendButtonLoading() {
        this.sendBtn.classList.add('sew_loading');
        this.sendBtn.dataset['loading'] = true;
    }

    unsetSendButtonLoading() {
        this.sendBtn.classList.remove('sew_loading');
        this.sendBtn.dataset['loading'] = false;
    }

    getRequestData() {
        const fields = this.shadow.querySelectorAll('[data-field]');
        const data = [];

        fields.forEach((item) => {
            const fieldName = item.dataset.field;
            if (!fieldName) return true;

            let value = item.dataset.value ? item.dataset.value : null;
            value = value === null && item.value ? item.value : value;

            data[fieldName] = value;
        });

        return data;
    }

    sendRequest(reset = false) {
        if (reset) this.resetProperties();

        let needShowRateLine = true;

        const data = this.getRequestData();

        this.requestService.sendRequest({
            data: data,
            before: (rid) => {
                this.setSendButtonLoading();
                this.showSendDescription();
            },
            callback: async (response) => {
                this.appendText(response.data, 0);

                if (needShowRateLine) this.showRateLine();
                this.unsetSendButtonLoading();
            },
            fail: async (errorLabel) => {
                const text = this.responseService.getErrorText(errorLabel);
                //this.setError();
                this.appendText(text, 0);

                this.unsetSendButtonLoading();
            }
        });
    }
}


class DialogTemplate {
    constructor() {
        this.style = `
    :host * {
        /*
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        */
        white-space: normal;
        font-family: Arial, Helvetica;
        font-size: 12px;
        visibility: visible!important;
    }

    .sew_back {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        background-color: rgba(19, 19, 19, 0.7);
        overflow-y: auto;
    }

    .sew_dialog {
        /*width: 900px;*/
        margin-top: 25px;
        max-width: calc(100vw - 20px);
        background-color: rgba(255, 255, 255, 1);
        border-radius: 8px;
        border: 1px solid rgba(230, 235, 255, 1);
    }

    .sew_header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: rgba(47, 55, 76, 1);
        background-color: rgba(249, 250, 255, 1);
        border-top-left-radius: 7px;
        border-top-right-radius: 7px;
        border-bottom: 1px solid rgba(230, 235, 255, 1);
        padding: 12px 15px;
    }

    .sew_header span {
        line-height: 18.4px;
        font-size: 16px;
        font-weight: 700;
    }

    .sew_close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border: 0px;
        padding: 0px;
        background-color: transparent;
        margin: 0px;
        cursor: pointer;
        transition: 0.3s;
    }

    .sew_close svg {
        width: 10px;
        height: 10px;
    }

    .sew_dialog-body {
        display: flex;
        align-items: stretch;
        justify-content: center;
        padding: 20px 0px;
    }

    .sew_dialog-body .sew_horizontal-separator {
        width: 1px;
        background-color: rgba(230, 235, 255, 1);
        margin-top: 25px;
    }

    .sew_dialog-body .sew_left {
        width: 500px;
        padding: 0px 27px;
        box-sizing: border-box;
    }

    .sew_dialog-body .sew_right {
        width: 500px;
        padding: 0px 27px;
        box-sizing: border-box;
    }

    .sew_input-group {
        display: block;
    }

    .sew_input-group + .sew_input-group {
        margin-top: 19px;
    }

    .sew_group-row {
        display: grid;
        column-gap: 20px;
        grid-template-columns: 1fr 1fr;
    }

    .sew_row-cell {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        flex-direction: column;
    }

    .sew_label {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 16px;
        font-weight: 700;
        line-height: 18.75px;
        color: rgba(47, 55, 76, 1);
        margin-bottom: 5px;
    }

    .sew_requirement-label {
        display: inline-block;
        color: rgba(255, 0, 0, 1);
        margin-left: 2px;
    }

    .sew_label span {
        font-size: 16px;
        font-weight: 700;
        line-height: 18.75px;
        color: rgba(156, 162, 189, 1);
    }

    .sew_label-tip {
        position: relative;
        width: 14px;
        height: 14px;
        margin-left: 7px;
    }

    .sew_tip-body {
        position: absolute;
        padding: 15px;
        border-radius: 6px;
        font-size: 12px;
        line-height: 14px;
        font-weight: 400;
        color: rgba(255, 255, 255, 1);
        background-color: rgba(63, 62, 237, 1);
        box-sizing: border-box;
        width: 320px;
        left: 0;
        top: 0;
        transform: translate(-50%, calc(-100% - 10px));
        opacity: 0;
        visibility: hidden !important;
        transition: opacity 0.3s 0s, visibility 0s 0.3s;
    }

    .sew_tip-body ul {
        padding-left: 15px;
        margin-top: 3px;
        margin-bottom: 0px;
    }

    .sew_label-tip:hover .sew_tip-body {
        opacity: 1;
        visibility: visible !important;
        transition: opacity 0.3s 0s, visibility 0s 0s;
    }

    .sew_input {
        width: 265px;
        height: 32px;
        border: 1px solid rgba(196, 203, 235, 1);
        border-radius: 4px;
        padding: 0px 7.8px;
        outline: none;
        font-size: 14px;
        color: rgba(26, 28, 38, 1);
    }

    .sew_input::-webkit-input-placeholder {
        font-size: 16px;
        color: rgba(173, 176, 208, 1);
    }

    .sew_select {
        position: relative;
        width: 265px;
        height: 32px;
        max-width: 100%;
        border: 1px solid rgba(196, 203, 235, 1);
        border-radius: 4px;
        padding: 0px;
        outline: none;
    }

    .sew_wide {
        width: 100%;
        box-sizing: border-box;
    }

    .sew_select .sew_select-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        width: 10px;
        height: 7px;
        right: 10px;
        top: calc(50% - 1px);
        transform: translate(-50%, 0);
        cursor: pointer;
        pointer-events: none;
    }

    .sew_select .sew_select-arrow svg {
        width: 100%;
        height: 100%;
    }

    .sew_select-input {
        height: 100%;
        width: 100%;
        padding: 0px 7.8px;
        border: 0px;
        outline: none;
        color: rgba(26, 28, 38, 1);
        background-color: rgba(255, 255, 255, 1);
        box-sizing: border-box;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
    }

    .sew_select-list {
        position: absolute;
        display: none;
        top: calc(100% + 5px);
        left: 0;
        width: 100%;
        padding: 5px;
        background-color: rgba(255, 255, 255, 1);
        border: 1px solid rgba(196, 203, 235, 1);
        border-radius: 4px;
        box-sizing: border-box;
        z-index: 10;
    }

    .sew_select-list.visible {
        display: block;
    }

    .sew_select-list .sew_item-active {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-direction: row;
        background-color: transparent;
        width: 100%;
        border: 0px;
        border-radius: 4px;
        padding: 7px;
        margin: 0px;
        cursor: pointer;
        font-size: 12px;
        line-height: 14px;
        font-weight: 700;
        color: rgba(26, 28, 38, 1);
        transition: 0.3s;
        box-sizing: border-box;
    }

    .sew_select-list .sew_item-active.hidden {
        display: none;
    }

    .sew_select-list .sew_item-active svg {
        margin-left: 5px;
    }

    .sew_list-body {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        width: 100%;
        max-height: 110px;
        overflow-y: auto;
    }

    .sew_list-body::-webkit-scrollbar {
        width: 5px;
    }

    .sew_list-body::-webkit-scrollbar-track {
        background-color: rgba(240, 243, 255, 1);
        border-radius: 10px;
    }

    .sew_list-body::-webkit-scrollbar-thumb {
        background-color: rgba(130, 136, 195, 1);
        border-radius: 10px;
    }

    .sew_list-body::-webkit-scrollbar-thumb:hover {
        background-color: #555;
    }

    .sew_action-btn {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border: 0px solid transparent;
        border-radius: 4px;
        background-color: rgba(63, 62, 237, 1);
        padding: 8px 10px;
        color: rgba(255, 255, 255, 1);
        transition: 0.3s;
        cursor: pointer;
    }

    .sew_action-btn:hover,
    .sew_action-btn:active {
        background-color: rgba(54, 53, 201, 1);
    }

    .sew_action-btn span {
        font-size: 14px;
        font-weight: 700;
        line-height: 16.41px;
        margin-left: 5px;
        margin-top: 2px;
    }

    .sew_select-list .sew_item {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-direction: row;
        background-color: transparent;
        width: 100%;
        border: 0px;
        border-radius: 4px;
        padding: 7px;
        margin: 0px;
        cursor: pointer;
        font-size: 12px;
        line-height: 14px;
        font-weight: 400;
        color: rgba(26, 28, 38, 1);
        transition: 0.3s;
        box-sizing: border-box;
    }

    .sew_select-list .sew_item.hidden,
    .sew_select-list .sew_item.search-hidden {
        display: none;
    }

    .sew_select-list .sew_item:hover {
        background-color: rgba(240, 243, 255, 1);
    }

    .sew_textarea {
        border: 1px solid rgba(196, 203, 235, 1);
        background-color: rgba(255, 255, 255, 1);
        color: rgba(26, 28, 38, 1);
        border-radius: 4px;
        padding: 5px 9px;
        font-size: 14px;
        width: 100%;
        height: 150px;
        outline: none;
        overflow-y: auto;
        resize: none;
        box-sizing: border-box;
    }

    .sew_textarea-description {
        height: 60px;
    }

    .sew_textarea-description::-webkit-input-placeholder {
        font-size: 16px;
        color: rgba(173, 176, 208, 1);
    }

    .sew_scrollbar::-webkit-scrollbar {
        width: 5px;!important;
        height: 5px;!important;
    }

    .sew_scrollbar::-webkit-scrollbar-track {
        border-radius: 10px;!important;
        background-color: rgba(226, 228, 242, 1);!important;
    }

    .sew_scrollbar::-webkit-scrollbar-thumb {
        border-radius: 10px;!important;
        background-color: rgba(173, 176, 208, 1);!important;
    }

    .sew_action-btn {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border: 0px solid transparent;
        border-radius: 4px;
        background-color: rgba(63, 62, 237, 1);
        padding: 8px 10px;
        color: rgba(255, 255, 255, 1);
        transition: background-color 0.3s;
        cursor: pointer;
    }

    .sew_action-btn:hover,
    .sew_action-btn:active {
        background-color: rgba(54, 53, 201, 1);
    }

    .sew_action-btn span {
        font-size: 14px;
        font-weight: 700;
        line-height: 16.41px;
        margin-left: 5px;
        margin-top: 2px;
    }

    .sew_green-btn {
        background-color: rgba(0, 210, 79, 1);
    }

    .sew_green-btn:hover,
    .sew_green-btn:active {
        background-color: rgba(13, 186, 78, 1);
    }

    .sew_send-btn {
        margin-top: 10px;
    }

    .sew_send-btn.sew_loading {
        color: transparent;
        background-image: url('${getUrl('img/icons/loader.svg')}');
        background-position: center;
        background-repeat: no-repeat;
        background-size: auto 10px;
    }

    .sew_send-btn.sew_loading svg {
        opacity: 0;
    }

    .sew_submit-description {
        display: none;
        font-size: 14px;
        color: rgba(77, 79, 85, 1);
        padding-top: 10px;
    }

    .sew_submit-description.visible {
        display: block;
    }

    .sew_result-text {
        border: 1px solid rgba(196, 203, 235, 1);
        border-radius: 4px;
        padding: 5px 9px;
        width: 100%;
        height: 450px;
        font-size: 14px;
        box-sizing: border-box;
        overflow-y: auto;
        color: rgba(26, 28, 38, 1);
    }

    .sew_dialog.highlight .sew_result-text {
        display: none;
    }

    .sew_highlight-text {
        display: none;
        border: 1px solid rgba(196, 203, 235, 1);
        border-radius: 4px;
        padding: 5px 9px;
        font-size: 14px;
        width: 100%;
        height: 150px;
        box-sizing: border-box;
        overflow-y: auto;
        color: rgba(26, 28, 38, 1);
    }

    .sew_dialog.highlight .sew_highlight-text {
        display: block;
    }

    .sew_highlight {
        display: inline;
        padding: 2px 0px;
        font-size: 14px;
        color: rgba(26, 28, 38, 1);
    }

    .sew_highlight.empty {
        background-color: transparent;
        padding: 0px;
    }

    .sew_highlight.red {
        background-color: rgba(255, 61, 61, 0.45);
        padding: 2px 1px;
    }

    .sew_highlight.green {
        background-color: rgba(0, 201, 76, 0.4);
        padding: 2px 1px;
    }

    .sew_rate-line {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        background-color: rgba(230, 238, 255, 1);
        padding: 8px 10px;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        box-sizing: border-box;
    }

    .sew_rate-line.hidden {
        display: none;
    }

    .sew_rate-line span {
        font-size: 14px;
        line-height: 16.41px;
        color: rgba(108, 120, 151, 1);
    }

    .sew_rate-block {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-left: 10px;
        margin-top: -2px;
    }

    .sew_rate-star {
        width: 17px;
        height: 17px;
    
        display: block;
        cursor: pointer;
        border: 0px;
        margin: 0px;
        padding: 0px;
    
        background-image: url('${getUrl('img/icons/rate-star2.svg')}');
        background-color: transparent;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
    
        user-select: none;
    }
    
    .sew_rate-star.active,
    .sew_rate-star.hover {
        background-image: url('${getUrl('img/icons/rate-star2-active.svg')}');
    }
    
    .sew_rate-star.unhover {
        background-image: url('${getUrl('img/icons/rate-star2.svg')}');
    }

    .sew_result-controls {
        position: relative;
        display: flex;
        justify-content: flex-start;
        align-itemns: center;
        margin-top: 20px;
    }

    .sew_outline-btn {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border: 1px solid rgba(196, 203, 235, 1);
        border-radius: 4px;
        background-color: transparent;
        padding: 8px 10px;
        color: rgba(26, 28, 38, 1);
        font-size: 14px;
        font-weight: 400;
        line-height: 16.41px;
        transition: 0.3s;
        cursor: pointer;
    }

    .sew_outline-btn:hover,
    .sew_outline-btn:active {
        color: rgba(255, 255, 255, 1);
        background-color: rgba(196, 203, 235, 1);
    }

    .sew_outline-btn svg * {
        transition: 0.3s;
    }

    .sew_outline-btn:hover svg *,
    .sew_outline-btn:active svg * {
        fill: rgba(255, 255, 255, 1);
    }

    .sew_outline-btn span {
        font-size: 14px;
        font-weight: 700;
        line-height: 16.41px;
        margin-left: 5px;
        margin-top: 2px;
    }

    .sew_result-controls button + button {
        margin-left: 10px;
    }

    .sew_result-controls .sew_tip-wrap + button {
        margin-left: 10px;
    }

    .sew_tip-wrap {
        position: relative;
    }

    .sew_copy-tip {
        position: absolute;
        left: 50%;
        top: 0px;
        border-radius: 2px;
        padding: 3px 6px;
        font-weight: 400;
        font-size: 12px;
        transform: translate(-50%, calc(-100% - 7px));
        color: rgba(255, 255, 255, 1);
        background-color: rgba(63, 62, 237, 1);
        white-space: nowrap;
        opacity: 0;
        visibility: hidden !important;
        transition: opacity 0.3s 0s, visibility 0s 0.3s;
    }

    .sew_copy-tip::after {
        content: '';
        position: absolute;
        left: 50%;
        top: calc(100% - 5px);
        width: 8px;
        height: 8px;
        background-color: rgba(63, 62, 237, 1);
        transform: translate(-50%, 0) rotate(45deg);
        z-index: -1;
    }

    .sew_copy-tip.visible {
        opacity: 1;
        visibility: visible !important;
        transition: opacity 0.3s 0s, visibility 0s 0s;
    }
    `;

        this.html = `<div class="sew_back">
        <div class="sew_dialog" data-dialog>
            <div class="sew_header">
                <span>${chrome.i18n.getMessage('dialog_title')}</span>
                <button class="sew_close" data-btn_close>
                    <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 1.00714L8.99286 0L5 3.99286L1.00714 0L0 1.00714L3.99286 5L0 8.99286L1.00714 10L5 6.00714L8.99286 10L10 8.99286L6.00714 5L10 1.00714Z" fill="#8288C3"/></svg>
                </button>
            </div>
            <div class="sew_dialog-body">
                <div class="sew_left">
                    <div class="sew_input-group">
                        <div class="sew_label">${chrome.i18n.getMessage('subject')}<div class="sew_requirement-label">*</div></div>
                        <input class="sew_input sew_wide" placeholder="${chrome.i18n.getMessage('subject_placeholder')}" data-field="subject"/>
                    </div>
                    <div class="sew_input-group">
                        <div class="sew_label">${chrome.i18n.getMessage('description')}</div>
                        <textarea class="sew_textarea sew_textarea-description sew_scrollbar" placeholder="${chrome.i18n.getMessage('description_placeholder')}" data-field="description"></textarea>
                    </div>
                    <div class="sew_input-group sew_group-row">
                        <div class="sew_row-cell">
                            <div class="sew_label">${chrome.i18n.getMessage('level')}<div class="sew_requirement-label">*</div></div>
                            <div class="sew_select sew_wide" data-level_select>
                                <input type="text" class="sew_select-input" placeholder="${chrome.i18n.getMessage('level_placeholder')}" data-dropdown_input data-field="level" />
                                <div class="sew_select-list" data-dropdown_block>
                                    <div class="sew_item-active hidden" data-active_item>
                                        <span data-active_item_label></span>
                                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 4.99664L5.99999 12.9966L2.33333 9.32997L3.27333 8.38997L5.99999 11.11L13.06 4.05664L14 4.99664Z" fill="#00C94C"/></svg>
                                    </div>
                                    <div class="sew_list-body" data-dropdown_list></div>
                                </div>
                                <div class="sew_select-arrow">
                                    <svg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4.71609 5.37622L9.04622 0.126221H0.385968L4.71609 5.37622Z' fill='#C4CBEB'/></svg>
                                </div>
                            </div>
                        </div>
                        <div class="sew_row-cell">
                            <div class="sew_label">${chrome.i18n.getMessage('text_language')}<div class="sew_requirement-label">*</div></div>
                            <div class="sew_select sew_wide" data-language_select>
                                <input type="text" class="sew_select-input" placeholder="${chrome.i18n.getMessage('language')}" data-dropdown_input data-field="lang" />
                                <div class="sew_select-list" data-dropdown_block>
                                    <div class="sew_item-active hidden" data-active_item>
                                        <span data-active_item_label></span>
                                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 4.99664L5.99999 12.9966L2.33333 9.32997L3.27333 8.38997L5.99999 11.11L13.06 4.05664L14 4.99664Z" fill="#00C94C"/></svg>
                                    </div>
                                    <div class="sew_list-body" data-dropdown_list></div>
                                </div>
                                <div class="sew_select-arrow">
                                    <svg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4.71609 5.37622L9.04622 0.126221H0.385968L4.71609 5.37622Z' fill='#C4CBEB'/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="sew_input-group sew_group-row">
                        <div class="sew_row-cell">
                            <div class="sew_label">${chrome.i18n.getMessage('essay_style')}<div class="sew_requirement-label">*</div></div>
                            <div class="sew_select sew_wide" data-essay_style_select>
                                <input type="text" class="sew_select-input" placeholder="${chrome.i18n.getMessage('essay_style_placeholder')}" data-dropdown_input data-field="essayStyle" />
                                <div class="sew_select-list" data-dropdown_block>
                                    <div class="sew_item-active hidden" data-active_item>
                                        <span data-active_item_label></span>
                                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 4.99664L5.99999 12.9966L2.33333 9.32997L3.27333 8.38997L5.99999 11.11L13.06 4.05664L14 4.99664Z" fill="#00C94C"/></svg>
                                    </div>
                                    <div class="sew_list-body" data-dropdown_list></div>
                                </div>
                                <div class="sew_select-arrow">
                                    <svg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4.71609 5.37622L9.04622 0.126221H0.385968L4.71609 5.37622Z' fill='#C4CBEB'/></svg>
                                </div>
                            </div>
                        </div>
                        <div class="sew_row-cell">
                            <div class="sew_label">${chrome.i18n.getMessage('ref_style')}<div class="sew_requirement-label">*</div></div>
                            <div class="sew_select sew_wide" data-ref_style_select>
                                <input type="text" class="sew_select-input" placeholder="${chrome.i18n.getMessage('ref_style_placeholder')}" data-dropdown_input data-field="refStyle" />
                                <div class="sew_select-list" data-dropdown_block>
                                    <div class="sew_item-active hidden" data-active_item>
                                        <span data-active_item_label></span>
                                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 4.99664L5.99999 12.9966L2.33333 9.32997L3.27333 8.38997L5.99999 11.11L13.06 4.05664L14 4.99664Z" fill="#00C94C"/></svg>
                                    </div>
                                    <div class="sew_list-body" data-dropdown_list></div>
                                </div>
                                <div class="sew_select-arrow">
                                    <svg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M4.71609 5.37622L9.04622 0.126221H0.385968L4.71609 5.37622Z' fill='#C4CBEB'/></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="sew_input-group">
                        <button class="sew_action-btn sew_send-btn" data-send_btn>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_2841_2)"><path d="M5.00012 3.73337L3.33346 4.66671L4.26679 3.00004L3.33346 1.33337L5.00012 2.26671L6.66679 1.33337L5.73346 3.00004L6.66679 4.66671L5.00012 3.73337ZM13.0001 10.2667L14.6668 9.33337L13.7335 11L14.6668 12.6667L13.0001 11.7334L11.3335 12.6667L12.2668 11L11.3335 9.33337L13.0001 10.2667ZM14.6668 1.33337L13.7335 3.00004L14.6668 4.66671L13.0001 3.73337L11.3335 4.66671L12.2668 3.00004L11.3335 1.33337L13.0001 2.26671L14.6668 1.33337ZM8.89346 8.52004L10.5201 6.89337L9.10679 5.48004L7.48012 7.10671L8.89346 8.52004ZM9.58012 4.86004L11.1401 6.42004C11.4001 6.66671 11.4001 7.10004 11.1401 7.36004L3.36012 15.14C3.10012 15.4 2.66679 15.4 2.42012 15.14L0.860123 13.58C0.600123 13.3334 0.600123 12.9 0.860123 12.64L8.64012 4.86004C8.90012 4.60004 9.33346 4.60004 9.58012 4.86004Z" fill="white"></path></g><defs><clipPath id="clip0_2841_2"><rect width="16" height="16" fill="white"></rect></clipPath></defs></svg>
                            <span>${chrome.i18n.getMessage('generate_text')}</span>
                        </button>
                    </div>
                    <div class="sew_submit-description" data-send_description>${chrome.i18n.getMessage('send_description')}</div>
                </div>
                <div class="sew_horizontal-separator"></div>
                <div class="sew_right">
                    <div class="sew_input-group sew_result-group">
                        <div class="sew_label">${chrome.i18n.getMessage('ai_result')}</div>
                        <div class="sew_result-text sew_scrollbar" data-result_text></div>
                        <div class="sew_highlight-text sew_scrollbar" data-highlight_text></div>
                        <div class="sew_rate-line hidden" data-rate_line>
                            <span>${chrome.i18n.getMessage('like_extension')}</span>
                            <div class="sew_rate-block" data-rate_block>
                                <button class="sew_rate-star" data-rate_star="1"></button>
                                <button class="sew_rate-star" data-rate_star="2"></button>
                                <button class="sew_rate-star" data-rate_star="3"></button>
                                <button class="sew_rate-star" data-rate_star="4"></button>
                                <button class="sew_rate-star" data-rate_star="5"></button>
                            </div>
                        </div>
                        <div class="sew_result-controls">
                            <div class="sew_tip-wrap">
                                <button class="sew_action-btn sew_green-btn sew_copy-btn" data-copy_btn>
                                    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.6667 14.5286H5.33334V5.19531H12.6667M12.6667 3.86198H5.33334C4.97971 3.86198 4.64058 4.00245 4.39053 4.2525C4.14048 4.50255 4 4.84169 4 5.19531V14.5286C4 14.8823 4.14048 15.2214 4.39053 15.4715C4.64058 15.7215 4.97971 15.862 5.33334 15.862H12.6667C13.0203 15.862 13.3594 15.7215 13.6095 15.4715C13.8595 15.2214 14 14.8823 14 14.5286V5.19531C14 4.84169 13.8595 4.50255 13.6095 4.2525C13.3594 4.00245 13.0203 3.86198 12.6667 3.86198ZM10.6667 1.19531H2.66667C2.31305 1.19531 1.97391 1.33579 1.72386 1.58584C1.47381 1.83589 1.33334 2.17502 1.33334 2.52865V11.862H2.66667V2.52865H10.6667V1.19531Z" fill="white"/></svg>                    
                                    <span>${chrome.i18n.getMessage('copy_text')}</span>
                                </button>
                                <div class="sew_copy-tip" data-copy_tip>${chrome.i18n.getMessage('text_coppied')}</div>
                            </div>
                            <!--
                            <button class="sew_outline-btn" data-highlight_btn>
                                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_2839_137)"><path d="M1.14519 8.23808H3.14519V9.57141H1.14519V8.23808ZM13.2119 3.23808L11.8119 4.63808L12.7452 5.57141L14.1452 4.17141L13.2119 3.23808ZM7.81185 1.57141H9.14519V3.57141H7.81185V1.57141ZM3.74519 3.23808L2.81185 4.17141L4.21185 5.57141L5.14519 4.63808L3.74519 3.23808ZM7.14519 15.5714C7.14519 15.9714 7.41185 16.2381 7.81185 16.2381H9.14519C9.54519 16.2381 9.81185 15.9714 9.81185 15.5714V14.9047H7.14519V15.5714ZM8.47852 4.90474C6.27852 4.90474 4.47852 6.70474 4.47852 8.90474C4.47852 10.3714 5.27852 11.7047 6.47852 12.3714V13.5714C6.47852 13.9714 6.74519 14.2381 7.14519 14.2381H9.81185C10.2119 14.2381 10.4785 13.9714 10.4785 13.5714V12.3714C11.6785 11.7047 12.4785 10.3714 12.4785 8.90474C12.4785 6.70474 10.6785 4.90474 8.47852 4.90474ZM9.14519 11.5047V12.2381H7.81185V11.5047C6.67852 11.2381 5.81185 10.1714 5.81185 8.90474C5.81185 7.43808 7.01185 6.23808 8.47852 6.23808C9.94519 6.23808 11.1452 7.43808 11.1452 8.90474C11.1452 10.1714 10.2785 11.1714 9.14519 11.5047ZM13.8119 8.23808H15.8119V9.57141H13.8119V8.23808Z" fill="#9297CA"/></g><defs><clipPath id="clip0_2839_137"><rect width="16" height="16" fill="white" transform="translate(0.478516 0.904785)"/></clipPath></defs></svg>                        
                                <span>${chrome.i18n.getMessage('highlight_changes')}</span>
                            </button>
                            -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    }
}