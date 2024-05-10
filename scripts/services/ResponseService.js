class ResponseService {
    constructor() {
        this.errors = {
            local_limit: {
                tip: chrome.i18n.getMessage('status_tip_local_limit'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_local_limit'),
                    text: chrome.i18n.getMessage('status_notice_text_local_limit')
                },
                color: '#FF9E00'
            },
            unsupported_site: {
                tip: chrome.i18n.getMessage('status_tip_unsupported_site'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_unsupported_site'),
                    text: chrome.i18n.getMessage('status_notice_text_unsupported_site')
                },
                color: '#C8C8C8'
            },
            plugin_disabled: {
                tip: chrome.i18n.getMessage('status_tip_plugin_disabled'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_plugin_disabled'),
                    text: chrome.i18n.getMessage('status_notice_text_plugin_disabled')
                },
                color: '#C8C8C8'
            },
            no_backend_answer: {
                tip: chrome.i18n.getMessage('status_tip_no_backend_answer'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_backend_answer'),
                    text: chrome.i18n.getMessage('status_notice_text_backend_answer')
                },
                color: '#FF9E00'
            },
            unsupported_language: {
                tip: chrome.i18n.getMessage('status_tip_unsupported_language'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_unsupported_language'),
                    text: chrome.i18n.getMessage('status_notice_text_unsupported_language')
                },
                color: '#C8C8C8'
            },
            daily_limit_reached: {
                tip: chrome.i18n.getMessage('status_tip_daily_limit_reached'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_daily_limit_reached'),
                    text: chrome.i18n.getMessage('status_notice_text_daily_limit_reached')
                },
                color: '#FEC800'
            },
            monthly_limit_reached: {
                tip: chrome.i18n.getMessage('status_tip_monthly_limit_reached'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_monthly_limit_reached'),
                    text: chrome.i18n.getMessage('status_notice_text_monthly_limit_reached')
                },
                color: '#FEC800'
            },
            overall_limit_reached: {
                tip: chrome.i18n.getMessage('status_tip_overall_limit_reached'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_overall_limit_reached'),
                    text: chrome.i18n.getMessage('status_notice_text_overall_limit_reached')
                },
                color: '#FEC800'
            },
            not_required_version: {
                tip: chrome.i18n.getMessage('status_tip_not_required_version'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_not_required_version'),
                    text: chrome.i18n.getMessage('status_notice_text_not_required_version')
                },
                color: '#FF9E00'
            },
            user_disabled: {
                tip: chrome.i18n.getMessage('status_tip_user_disabled'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_user_disabled'),
                    text: chrome.i18n.getMessage('status_notice_text_user_disabled')
                },
                color: '#FF9E00'
            },
            min_text_limit: {
                tip: chrome.i18n.getMessage('status_tip_min_text_limit'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_min_text_limit'),
                    text: chrome.i18n.getMessage('status_notice_text_min_text_limit')
                },
                color: '#FF9E00'
            },
            max_text_limit: {
                tip: chrome.i18n.getMessage('status_tip_max_text_limit'),
                notice: {
                    title: chrome.i18n.getMessage('status_notice_title_max_text_limit'),
                    text: chrome.i18n.getMessage('status_notice_text_max_text_limit')
                },
                color: '#FF9E00'
            },
        };
    }

    getErrorText(errorLabel = '') {
        if (!this.errors.hasOwnProperty(errorLabel)) {
            return this.errors['no_backend_answer'].notice.title;
        }

        return this.errors[errorLabel].notice.title;
    }
}