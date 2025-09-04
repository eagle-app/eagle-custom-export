<script setup>
const props = defineProps({
    modelValue: {
        required: true
    },
    name: {
        type: String,
        default: 'radio'
    },
    value: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:modelValue']);

const inputRadioValue = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value);
    }
});

// Add new method to handle click events
const handleClick = (event) => {
    // If the click target is or is inside an el-dropdown, prevent radio selection
    if (event.target.closest('.el-dropdown')) {
        event.preventDefault();
        return;
    }
    // Otherwise, allow normal radio selection behavior
};
</script>

<template>
    <label class="input-radio-vue" :for="props.value" @click="handleClick">
        <slot></slot>
        <input
            v-model="inputRadioValue"
            type="radio"
            :name="props.name"
            :value="props.value"
            :id="props.value"
            hidden
        />
    </label>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.input-radio-vue {
    display: inline-flex;
    align-items: center;
    height: 26px;
    cursor: pointer;
    color: var(--color-text-primary);
    font-size: 13px;
    white-space: nowrap;

    // &:hover {
    //   background-color: var(--color-bg-hover);
    // }
    // &:active {
    //   background-color: var(--color-bg-active);
    // }
    &::before {
        --border-color: var(--color-black-30);
        --background-color: var(--color-white-50);

        @include mixins.dark {
            --border-color: var(--color-white-30);
            --background-color: var(--color-black-20);
        }

        content: '';
        width: 16px;
        min-width: 16px;
        height: 16px;
        margin-right: 6px;
        border-radius: 50%;
        background-color: var(--background-color);
        box-shadow: 0 0 0 1px var(--border-color) inset;
    }

    &:has(input[type='radio']:checked) {
        &::before {
            --border-color: var(--color-black-15);
            --background-color: var(--color-white);
            box-shadow:
                0 0 0 4px var(--color-primary) inset,
                0 0 0 1px var(--border-color) inset;
        }
    }
}
</style>
