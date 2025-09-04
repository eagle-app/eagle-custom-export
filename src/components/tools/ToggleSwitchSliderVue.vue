<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Number],
        required: true
    },
    data: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['update:modelValue']);

const value = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        emit('update:modelValue', value);
    }
});

const name = crypto.randomUUID();

// Sliding animation
const sliderRef = ref(null);
const sliderStyle = ref({
    transform: 'translateX(0)',
    width: '0'
});

const updateSliderPosition = async () => {
    await nextTick();
    if (!sliderRef.value) return;
    
    const container = sliderRef.value;
    const activeLabel = container.querySelector('label:has(input[type="radio"]:checked)');
    
    if (activeLabel) {
        // 獲取容器的 padding 值
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft);
        
        // 使用 offsetLeft 並減去容器的 padding
        const offsetX = activeLabel.offsetLeft - paddingLeft;
        const width = activeLabel.offsetWidth;
        
        sliderStyle.value = {
            transform: `translateX(${offsetX}px)`,
            width: `${width}px`
        };
    }
};

onMounted(() => {
    updateSliderPosition();
});

watch(() => props.modelValue, () => {
    updateSliderPosition();
});
</script>

<template>
    <div class="toggle-switch-slider-vue" ref="sliderRef">
        <div class="slider-background" :style="sliderStyle"></div>
        <template v-for="data in props.data" :key="data">
            <label :for="`toggle-switch-slider-${data}`">
                <input
                    v-model="value"
                    type="radio"
                    :id="`toggle-switch-slider-${data}`"
                    :name="name"
                    :value="data"
                    hidden
                />
                <slot :data="data">
                    {{ data }}
                </slot>
            </label>
        </template>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.toggle-switch-slider-vue {
    --background-color: var(--color-dark-5);
    @include mixins.dark {
        --background-color: var(--color-black-20);
    }
    background-color: var(--background-color);
    position: relative;
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 6px;
    
    .slider-background {
        position: absolute;
        top: 2px;
        left: 2px;
        height: 28px;
        border-radius: 4px;
        --slider-bg-color: var(--color-white-90);
        @include mixins.dark {
            --slider-bg-color: var(--color-lightgray-10);
        }
        background-color: var(--slider-bg-color);
        transition: transform var(--animation-slow);
        z-index: 1;
    }
    
    label {
        position: relative;
        z-index: 2;
        flex: 1;
        text-align: center;
        height: 28px;
        line-height: 28px;
        border-radius: 4px;
        font-size: 13px;
        color: var(--color-text-tertiary);
        cursor: pointer;
        user-select: none;
        transition: color var(--animation-normal), font-weight var(--animation-normal);
        
        &:has(input[type='radio']:checked) {
            color: var(--color-text-primary);
            font-weight: var(--font-weight-bold);
        }
    }
}
</style>
