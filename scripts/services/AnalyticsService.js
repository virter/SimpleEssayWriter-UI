class AnalyticsService {
    constructor() {
        this.apiKey = 'a938f4bda0de246d90f29f0262725d7';
        this.apiUrl = 'https://api2.amplitude.com/2/httpapi';
    }

    async sendEvent(userId, eventType) {
        const data = {
            api_key: this.apiKey,
            events: [
                {
                    user_id: userId,
                    event_type: eventType
                }
            ]
        };


        try {
            let response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Accept': '*/*'
                },
                body: JSON.stringify(data)
            });

            return response;
        } catch (error) {
            console.log(error);

            return false;
        }
    }
}