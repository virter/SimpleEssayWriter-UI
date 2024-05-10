class EditorSelector {
    constructor(selector) {
        this.selector = selector;
    }

    select(parent = document) {
        const list = parent.querySelectorAll(this.selector);
        const result = [];

        for (let element of list ) {
            if (this.filter(element)) result.push(element);
        }

        return result;
    }

    filter(element) {
        const styles = window.getComputedStyle(element);
        if (styles.width === 0) return false;
        if (styles.height === 0) return false;
        if (styles.visibility === 'hidden') return false;
        if (styles.display === 'none') return false;
        return true;
    }   
}