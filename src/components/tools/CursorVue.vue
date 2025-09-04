<script setup>
const props = defineProps({
    container: {
        type: String,
        default: '.cursor-vue'
    },
    size: {
        type: Number,
        default: 50
    },
    showTip: {
        type: Boolean,
        default: true
    }
});

const x = ref(0);
const y = ref(0);

function update(event) {
    x.value = event.x;
    y.value = event.y - 48;
}

onMounted(() => {
    window.addEventListener('mousemove', update);
    document.querySelector(props.container).style.cursor = 'none';
});

onUnmounted(() => window.removeEventListener('mousemove', update));
</script>

<template>
    <div
        class="cursor-vue"
        :style="{
            transform: `translate(${x}px, ${y}px)`
        }"
    >
        <tippy allowHTML placement="right" duration="[200,0]" delay="[0,0]">
            <template #default>
                <div
                    class="cursor"
                    :style="{
                        '--size': size + 'px'
                    }"
                ></div>
            </template>
            <template #content> 測試123 </template>
        </tippy>
        <!-- <div v-show="showTip" class="tip">
          {{  $translate('component.crosshair.tip') }}
        </div> -->
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.cursor-vue {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 999;
    will-change: transform;
    .cursor {
        --size: 50px;
        position: inherit;
        display: block;
        width: var(--size);
        height: var(--size);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--color-white-70);
        box-shadow:
            0 0 0 1px var(--color-black-50) inset,
            0 0 0 2px var(--color-white-50) inset;
    }
    .tip {
        position: inherit;
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
</style>
