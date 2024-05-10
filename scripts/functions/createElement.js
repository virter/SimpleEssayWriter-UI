function createElement(tagName, styles = {}) {
    const element = document.createElement(tagName);

    for (let propName in styles) {
        element.style[propName] = styles[propName];
    }

    return element;
}