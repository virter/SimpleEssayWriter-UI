class EventService {
    constructor() {
        this.events = {};
    }

    add(args) {
        let { event, element, handler, type = 'event', useCapture = false, occlude = false} = args;

        let elements = [];

        if (Array.isArray(element)) {
            elements = element;
        } else if (element instanceof NodeList) {
            elements = Array.from(element);
        } else {
            elements = [element];
        }

        const modyfiedHandler = !occlude
            ? handler
            : (event) => {
                event.stopPropagation();
                event.preventDefault();
                handler(event);
        }

        elements.forEach(item => {
            try {
                item.addEventListener(event, modyfiedHandler, useCapture);
            } catch (error) {
                console.log(error);
            }
        });

        const eventId = getUuid();
        this.events[eventId] = {
            event: event,
            handler: modyfiedHandler,
            elements: elements
        };

        return eventId;
    }

    remove(eventId) {
        if (!(eventId in this.events)) return true;

        const event = this.events[eventId]
        event.elements.forEach((item) => {
            try {
                item.removeEventListener(event.event, event.handler);
            } catch (error) {
                console.log(error);
            }
        });

        delete this.events[eventId];

        return true;
    }

    removeAll() {
        for (let eventId of Object.keys(this.events)) {
            this.remove(eventId);
        }
    }
}