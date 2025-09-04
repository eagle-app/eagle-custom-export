<!-- 十字線組件 -->
<script setup>
import { onMounted, onUnmounted } from 'vue';

const x = ref(0);
const y = ref(0);

function update(event) {
    x.value = event.x;
    y.value = event.y - 48;
}

onMounted(() => window.addEventListener('mousemove', update));

onUnmounted(() => window.removeEventListener('mousemove', update));

const props = defineProps({
    showTip: {
        type: Boolean,
        default: true
    }
});
</script>

<template>
    <div class="crosshair-vue">
        <div
            class="crosshair__line crosshair__line--horizontal"
            :style="{
                transform: `translateY(${y}px)`
            }"
        ></div>
        <div
            class="crosshair__line crosshair__line--vertical"
            :style="{
                transform: `translateX(${x}px)`
            }"
        ></div>
        <div
            v-show="showTip"
            class="crosshair__line tip"
            :style="{
                transform: `translate(${x}px, ${y}px)`
            }"
        >
            {{ $translate('component.crosshair.tip') }}
        </div>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.crosshair-vue {
    cursor: crosshair;
    .crosshair__line {
        pointer-events: none;
        position: absolute;
        z-index: 999;
        top: 0;
        &.crosshair__line--horizontal,
        &.crosshair__line--vertical {
            box-shadow: 0 0 0 1px rgba(128, 128, 128, 0.5);
        }
        &.crosshair__line--horizontal {
            left: 0;
            right: 0;
        }
        &.crosshair__line--vertical {
            left: 0;
            bottom: 0;
        }
        &.tip {
            margin: 6px;
            background: var(--box-background);
            border-top: var(--box-border-top);
            border-left: var(--box-border-left);
            border-right: var(--box-border-right);
            border-bottom: var(--box-border-bottom);
            border-radius: 4px;
            backdrop-filter: var(--box-background-blur);
            color: var(--color-text-primary);
            font-size: 13px;
            height: 24px;
            display: flex;
            align-items: center;
            padding: 0 6px;
            white-space: nowrap;
        }
    }
}
</style>
