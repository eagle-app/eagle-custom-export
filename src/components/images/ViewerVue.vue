<script setup>
const props = defineProps({
    // 圖片來源
    src: {
        type: String,
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    // 裁切區域
    selection: {
        type: Object,
        required: true,
        default: () => {
            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        }
    }
});

const viewerEl = ref(null);

const size = computed(() => {
    return {
        width: viewerEl.value?.clientWidth || 0,
        height: viewerEl.value?.clientHeight || 0
    };
});

const ratio = computed(() => {
    const width_ratio = size.value.width / props.selection.width;
    const height_ratio = size.value.height / props.selection.height;
    return Math.min(width_ratio, height_ratio);
});
</script>
<template>
    <div class="viewer" ref="viewerEl">
        <div
            class="img"
            :style="{
                backgroundImage: `url('${props.src.replace(/\\/g, '/')}')`,
                backgroundPosition: `-${props.selection.x * ratio}px -${
                    props.selection.y * ratio
                }px`,
                backgroundSize: `${props.width * ratio}px ${props.height * ratio}px`,
                width: `${props.selection.width * ratio}px`,
                height: `${props.selection.height * ratio}px`,
                backgroundRepeat: 'no-repeat'
            }"
        ></div>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.viewer {
    --background-color: var(--color-white-50);
    @include mixins.dark {
        --background-color: var(--color-dark-50);
    }
    width: 100px;
    height: 100px;
    background-color: var(--background-color);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    .img {
        will-change: background-position, background-size, width, height;
        border-radius: 2px;
    }
}
</style>
