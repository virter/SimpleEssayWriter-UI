class ContenteditableSelector extends EditorSelector {
    constructor() {
        super('*[contenteditable="true"],*[contenteditable=""]');
    }
}