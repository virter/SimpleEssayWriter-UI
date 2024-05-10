class RateBlock {
    constructor(
        block,
        lowRateCallback = () => {},
        highRateCallback = () => {}
    ) {
        this.block = block;
        this.lowRateCallback = lowRateCallback;
        this.highRateCallback = highRateCallback;

        this.maxRate = 5;

        this.init();
    }

    init() {
        this.stars = this.block.querySelectorAll('[data-rate_star]');

        this.mouseOverHandler = (event) => {
            const rate = parseInt(event.target.dataset['rate_star'], 10);
            this.unsetClass('hover');
            this.unsetClass('unhover');
            this.setClass(rate, 'hover', 'unhover');
        };

        this.mouseOutHandler = (event) => {
            this.unsetClass('hover');
            this.unsetClass('unhover');
        };

        this.clickHandler = (event) => {
            const rate = parseInt(event.target.dataset['rate_star'], 10);

            this.unsetClass('active');
            this.setClass(rate, 'active');

            this.rateAction(rate);
        };

        this.stars.forEach(item => {
            item.addEventListener('mouseover', this.mouseOverHandler);
            item.addEventListener('mouseout', this.mouseOutHandler);
            item.addEventListener('click', this.clickHandler);
        });
    
        this.setClass(this.maxRate, 'active');
    }

    unsetClass(cls) {
        this.stars.forEach(item => {
            item.classList.remove(cls);
        });
    }

    setClass(num, class1, class2 = null) {
        for (let i = 1; i <= num; i++) {
            const element = this.block.querySelector(`[data-rate_star="${i}"]`);
            if (!element) continue;
            element.classList.add(class1);
        }

        if (!class2) return;

        for (let i = num + 1; i <= this.maxRate; i++) {
            const element = this.block.querySelector(`[data-rate_star="${i}"]`);
            if (!element) continue;
            element.classList.add(class2);
        }
    }

    rateAction(num) {
        if (num >= 4) {
            this.highRateCallback && this.highRateCallback();
        } else {
            this.lowRateCallback && this.lowRateCallback();
        }
    }

    destroy() {
        this.stars.forEach(item => {
            item.removeEventListener('mouseover', this.mouseOverHandler);
            item.removeEventListener('mouseout', this.mouseOutHandler);
            item.removeEventListener('click', this.clickHandler);
            this.block.remove();
        });
    }
}