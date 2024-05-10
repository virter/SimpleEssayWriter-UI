class PositionCorner {
    constructor(h, v) {
        this.h = h;
        this.v = v;
    }

    invertHorizontal() {
        const h = this.h === 'left' ? 'right' : 'left';
        return new PositionCorner(h, this.v);
    }

    invertVertical() {
        const v = this.v === 'top' ? 'bottom' : 'top';
        return new PositionCorner(this.h, v);
    }
}

class PositionController {
    constructor(args) {
        const {
            target,
            elementCorner,
            targetCorner,
            gapX = 0,
            gapY = 0,
            handlerBefore = () => {}
        } = args;

        this.target = target;
        this.elementCorner = elementCorner;
        this.targetCorner = targetCorner;
        this.gapX = gapX;
        this.gapY = gapY;

        this.handlerBefore = handlerBefore;
    }

    copyElementRect(elementRect) {
        return {
            x: elementRect.x,
            y: elementRect.y,
            width: elementRect.width,
            height: elementRect.height
        };
    }

    resetPosition(elementRect) {
        this.handlerBefore();

        const rect = this.applyGap(this.copyElementRect(elementRect));
        const targetRect = this.target.getBoundingClientRect();

        const coordinates = this.getCoordinates(rect, targetRect);
        this.target.style.left = `${coordinates.x}px`;
        this.target.style.top = `${coordinates.y}px`;
    }

    applyGap(elementRect) {
        elementRect.x -= this.gapX;
        elementRect.width += 2*this.gapX;
        elementRect.y -= this.gapY;
        elementRect.height += 2*this.gapY;
        return elementRect;
    }

    getCoordinates(
        elementRect,
        targetRect,
        elementCorner = this.elementCorner,
        targetCorner = this.targetCorner
    ) {
        const x1 = elementCorner.h === 'left' ? elementRect.x : elementRect.x + elementRect.width;
        const y1 = elementCorner.v === 'top' ? elementRect.y : elementRect.y + elementRect.height;

        const x2 = targetCorner.h === 'left' ? 0 : -targetRect.width;
        const y2 = targetCorner.v === 'top' ? 0 : -targetRect.height;

        const x = x1 + x2;
        const y = y1 + y2;

        return {
            x: x,
            y: y
        };
    }
}