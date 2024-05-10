class ResponseQueue {
    constructor(handlers = {
        item: async () => { },
        end: async () => { }
    }) {
        this.queue = {};

        this.current = 1;

        this.handlers = handlers;
        this.endHandler = 
        this.walkProcess = false;
    }

    push(args) {
        const {
            text,
            order,
            code = '',
            end = false
        } = args;

        this.queue[order] = {
            text: text,
            code: code,
            end: end
        };

        if (this.current === order) this.walk();
    }

    async walk() {
        if (this.walkProcess) return;

        this.walkProcess = true;
        while (this.walkProcess) {
            if (!this.queue.hasOwnProperty(this.current)) {
                this.walkProcess = false;
                break;
            }

            const item = this.queue[this.current];
            if (item.code) {
                if (!this.handlers.hasOwnProperty(`code_${item.code}`)) continue;

                await this.handlers[`code_${item.code}`]({
                    text: item.text
                });
            } else if (item.end === false) {
                await this.handlers.item({
                    text: item.text
                });
            } else {
                this.handlers.end();
                this.walkProcess = false;
                break;
            }

            this.current++;
        }

        this.stop();
    }

    stop() {
        this.walkProcess = false;   
    }
}