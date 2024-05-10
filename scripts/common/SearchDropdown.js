class SearchDropdown {
    constructor(args) {
        const {
            block,
            items,
            active = null,
            handlers = {}
        } = args;

        this.block = block;
        this.dataItems = items;
        this.handlers = handlers;
        this.selected = {
            item: null,
            name: '',
            value: null
        };

        this.eventService = new EventService();

        this.initElements();
        this.initListeners();

        if (active) this.selectItemByValue(active, false);
    }

    initElements() {
        this.input = this.block.querySelector('[data-dropdown_input]');
        this.dropBlock = this.block.querySelector('[data-dropdown_block]');
        this.list = this.block.querySelector('[data-dropdown_list]');

        this.activeItemElement = this.block.querySelector('[data-active_item]');
        this.activeItemLabel = this.block.querySelector('[data-active_item_label]');
        //this.cross = this.block.querySelector('[data-dropdown_cross]');

        this.list.innerHTML = '';
        this.dataItems.forEach(item => {
            this.list.innerHTML += `<button class="sew_item" data-value="${item.value}" data-item>${item.name}</button>`
        })

        this.items = this.list.querySelectorAll('[data-item]');
    }

    initListeners() {
        this.eventService.add({
            event: 'focus',
            element: this.input,
            handler: (event) => {
                this.showList();
            }
        });

        this.eventService.add({
            event: 'mousedown',
            element: this.input,
            occlude: false,
            handler: (event) => {
                this.toggleList();
            }
        });

        this.eventService.add({
            event: 'focusout',
            element: this.input,
            handler: (event) => {
                this.showSelectedItem();
                this.hideList(1);
            }
        });

        this.eventService.add({
            event: 'click',
            element: this.input,
            handler: (event) => { /* prevent bubbling */ }
        });

        this.eventService.add({
            event: 'keydown',
            element: document,
            occlude: false,
            handler: (event) => {
                if (event.key === 'Tab' || event.key === 'Escape' ) {
                    this.showSelectedItem();
                    this.hideList(3);
                }
            }
        });

        this.eventService.add({
            event: 'input',
            element: this.input,
            handler: (event) => {
                this.search();
            }
        });

        this.eventService.add({
            event: 'mousedown',
            element: this.items,
            handler: (event) => {
                this.selectItem(event.target);
                this.hideList(4);
                this.unfocusInput();
            }
        });
    }

    showList() {
        this.showAllSearchItems();
        this.dropBlock.classList.add('visible');
    }

    hideList() {
        this.dropBlock.classList.remove('visible');
    }

    toggleList() {
        if (!this.dropBlock.classList.contains('visible')) {
            this.showList();
        } else {
            this.hideList();
        }
    }

    showCross() {
        this.cross.classList.add('visible');
    }

    hideCross() {
        this.cross.classList.remove('visible');
    }

    resetItemsVisibility() {
        this.items.forEach(item => item.classList.remove('hidden'));
    }

    onCross() {
        this.resetSelectedItem();
        this.showSelectedItem();
    }

    search() {
        const query = this.input.value.toLowerCase();
        if (!query.length) this.resetItemsVisibility();

        for (const item of this.items) {
            if (!item.textContent.toLowerCase().includes(query)) {
                item.classList.add('search-hidden');
            } else {
                item.classList.remove('search-hidden');
            }
        }
    }

    hideItem(item) {
        item.classList.add('hidden');
    }

    showAllItems() {
        const list = this.block.querySelectorAll('[data-item].hidden');
        list.forEach(item => item.classList.remove('hidden'));
    }

    showAllSearchItems() {
        const list = this.block.querySelectorAll('[data-item].search-hidden');
        list.forEach(item => item.classList.remove('search-hidden'));
    }

    selectItem(item, withHandler = true) {
        if (!item) {
            this.resetSelectedItem();
            return;
        }

        this.selected.item = item;
        this.selected.name = item.textContent;
        this.selected.value = item.dataset['value'];

        this.showAllItems();
        this.hideItem(item);
        
        this.setActiveItem(this.selected.name);
        this.showSelectedItem();

        if (withHandler && this.handlers.hasOwnProperty('onChange')) {
            this.handlers.onChange({
                name: this.selected.name,
                value: this.selected.value
            });
        }
    }

    selectItemByValue(value, withHandler = true) {
        let item = this.list.querySelector(`[data-value="${value}"]`);
        item = !item ? null : item;

        this.selectItem(item, withHandler);
    }

    setActiveItem(name) {
        if (!name) {
            this.activeItemElement.classList.add('hidden');
            this.activeItemLabel.textContent = '';
            return;
        }

        this.activeItemElement.classList.remove('hidden');
        this.activeItemLabel.textContent = name;
    }

    resetSelectedItem(withHandler = true) {
        this.selected.item = null;
        this.selected.name = '';
        this.selected.value = null;

        this.showAllItems();

        this.setActiveItem('');

        if (withHandler && this.handlers.hasOwnProperty('onChange')) {
            this.handlers.onChange(this.getSelectedItem());
        }
    }

    showSelectedItem() {
        if (!this.selected.name) {
            this.input.value = '';
            return;
        }

        this.input.value = this.selected.name;
    }

    unfocusInput() {
        this.input.disabled = true;
        this.input.disabled = false;
    }

    getSelectedItem() {
        return {
            name: this.selected.name,
            value: this.selected.value
        };
    }
}