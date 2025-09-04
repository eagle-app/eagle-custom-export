<script setup>
const props = defineProps({
    modelValue: {
        type: Number,
        required: true
    },
    min: {
        type: Number,
        default: -Infinity
    },
    max: {
        type: Number,
        default: Infinity
    },
    readonly: {
        type: Boolean,
        default: false
    },
    showPoint: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue']);

const inputEl = ref(null);

const integer = computed(() => props.modelValue.toString().split('.')[0]);
const point = computed(() => props.modelValue.toString().split('.')[1] || 0);

const showValue = computed(() => (props.showPoint ? value : value | 1));

const getShowValue = (value) => value.toString().split('.')[0];

const inputValue = computed({
    get() {
        return integer.value;
    },
    set(value) {
        const old_value = integer.value;
        value = Number(value.toString() + '.' + point.value) || props.modelValue;
        value = Math.min(props.max, value);
        value = Math.max(props.min, value);
        const new_value = value.toString().split('.')[0];
        emit('update:modelValue', value);
        const selection = window.getSelection();
        let offset = selection.focusOffset;
        event.target.innerHTML = getShowValue(value);
        if (old_value.length == new_value.length) offset = Math.max(offset - 1, 0);
        const range = document.createRange();
        const startNode = event.target.firstChild;
        range.setStart(startNode, offset);
        range.setEnd(startNode, offset);
        selection.removeAllRanges();
        selection.addRange(range);
    }
});

const keyHandle = (event) => {
    const selection = window.getSelection();
    const range = document.createRange();
    let offset = selection.focusOffset;
    const startNode = event.target.firstChild;

    let value = Number(integer.value + '.' + point.value);

    switch (event.code) {
        case 'ArrowUp':
            value += event.shiftKey ? 10 : 1;
            event.preventDefault();
            break;
        case 'ArrowDown':
            value -= event.shiftKey ? 10 : 1;
            event.preventDefault();
            break;
        case 'KeyA':
            if (event.metaKey || event.ctrlKey) {
                range.setStart(startNode, 0);
                range.setEnd(startNode, event.target.innerText.length);
                selection.removeAllRanges();
                selection.addRange(range);
                event.preventDefault();
                return;
            }
            break;
        default:
            return;
    }
    value = Math.min(props.max, value);
    value = Math.max(props.min, value);

    inputValue.value = getShowValue(value);
    range.setStart(startNode, offset);
    range.setEnd(startNode, offset);
    selection.removeAllRanges();
    selection.addRange(range);
};

const focus = () => {
    inputEl.value.focus();
};
</script>

<template>
    <div class="input-vue" @click="focus">
        <div class="prefix">
            <slot name="prefix"></slot>
        </div>
        <div
            class="input"
            :contenteditable="!props.readonly"
            @input="inputValue = $event.target.innerText"
            @keydown="keyHandle"
            ref="inputEl"
        >
            {{ inputValue }}
        </div>
        <div class="suffix">
            <slot name="suffix"></slot>
        </div>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.input-vue {
    --border-color: transparent;
    height: 24px;
    font-size: 13px;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    align-items: center;
    border-radius: 6px;
    padding: 0 6px;
    border: 1px solid var(--border-color);

    &:has(.input[contenteditable='true']) {
        cursor: text;
    }

    &:hover,
    &:has(> .input:focus-visible) {
        --background: var(--color-white-50);
        @include mixins.dark {
            --background: var(--color-black-20);
        }
        background: var(--background);
    }

    &:hover {
        --border-color: var(--color-border-primary);
    }

    &:has(> .input:focus-visible) {
        --border-color: var(--color-primary);
    }

    .prefix,
    .suffix {
        user-select: none;
        color: var(--color-text-tertiary);
    }

    .input {
        flex: 1;
        margin: 0 6px;
        color: var(--color-text-primary);

        &:focus-visible {
            outline: none;
        }
    }
}
</style>
