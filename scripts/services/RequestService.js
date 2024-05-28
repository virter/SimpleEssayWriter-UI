class RequestService {
    constructor(userId) {
        this.userId = userId;

        this.apiUrl = 'https://aiwordchecker.online/api/essay/v1/generate';
        this.userService = new UserService();
    }

    async sendRequest(args) {
        const rid = getUuid();

        const userEmail = await this.userService.getEmail();

        //const store = await chrome.storage.local.get(['language']);
        //const lang = 'language' in store ? store.language : 'en-us';

        const data = {
            ...{
                rid: rid,
                v: 1,
                visitorId: this.userId,
                email: userEmail,
                refStyle: ''
            },
            ... args.data
        };

        console.log('request data', data);


        if (args.hasOwnProperty('before')) await args.before(rid);

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            });

            const responseBody = await response.json();
            if (responseBody.hasOwnProperty('error')) {
                args.fail&&args.fail(responseBody.error);
                return;
            }

            if (args.callback) {
                await args.callback(responseBody);
            }
        } catch (error) {
            console.log(error);

            if (args.fail) {
                await args.fail();
            }
        }
    }
}