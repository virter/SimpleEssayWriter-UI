class PusherService {
    constructor(userId) {
        this.userId = userId;

        this.appKey = '65fb93a197e68b969671';
        this.config = {
            appId: '1718384',
            secret: '9d0789c40ed201a253ef',
            cluster: 'eu'
        };

        this.timeout = 90*1000;
        this.timeoutId = null;

        this.pusher = null;

        this.callbacks = {};
    }

/*
    getTimestamp() {
        return Math.trunc((new Date()).getTime()/1000);
    }
*/

    async connect() {
        if (this.pusher !== null) {
            this.setDisconnectTimeout();
            return;
        }

        this.pusher = new Pusher(this.appKey, this.config);

        const channel = this.pusher.subscribe(`gramma_${this.userId}`);
        channel.bind('client-new_message', (data) => {
            //console.log(data);
            if (data.hasOwnProperty('rid')) {
                const callback = this.getCallback(data.rid);
                if (callback) callback(data);
            }

            this.setDisconnectTimeout();
        });

        this.setDisconnectTimeout();
    }

    setDisconnectTimeout() {
        clearTimeout(this.timeoutId);

        this.timeoutId = setTimeout(() => {
            this.disconnect();
        }, this.timeout);
    }

    disconnect() {
        if (!this.pusher) return;
        this.pusher.disconnect();
        this.pusher = null;
    }

    removeAllCallbacks() {
        this.callbacks = {};
        return true;
    }

    getCallback(rid) {
        if (!this.callbacks.hasOwnProperty(rid)) return null;
        return this.callbacks[rid];
    }

    addCallback(rid, callback) {
        const prevCallback = this.getCallback(rid);
        if (prevCallback) return false;

        this.callbacks[rid] = callback;
        return true;
    }

    removeCallback(rid) {
        delete this.callbacks[rid];
        return true;
    }
}
