<script setup>
import interact from 'interactjs';
const utils = require(`${__dirname}/modules/utils`);

const uid = utils.string.generateRandomString(36);

const props = defineProps({
    offset: {
        type: Object,
        default: () => ({
            x: 0,
            y: 0,
            ratio: 1
        })
    },
    x: {
        type: Number,
        default: 0
    },
    y: {
        type: Number,
        default: 0
    },
    width: {
        type: Number,
        default: 0
    },
    height: {
        type: Number,
        default: 0
    },
    boundary: {
        type: Object,
        default: () => ({
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        })
    },
    min_width: {
        type: Number,
        default: 50
    },
    min_height: {
        type: Number,
        default: 50
    }
});

const emit = defineEmits(['update:x', 'update:y', 'update:width', 'update:height']);

onMounted(() => {
    interact('#' + uid)
        .resizable({
            edges: { top: true, left: true, bottom: true, right: true },
            modifiers: [
                interact.modifiers.restrictEdges({
                    outer: 'parent'
                })
            ],
            listeners: {
                move: function (event) {
                    let { x, y, width, height } = props;

                    const { top, right, bottom, left } = event.edges;

                    if (top) {
                        y = props.y + event.deltaRect.top / props.offset.ratio;
                        height = props.height - event.deltaRect.top / props.offset.ratio;
                        if (height < props.min_height) {
                            const diff = height - props.min_height;
                            height = props.min_height;
                            y += diff;
                        }
                    }
                    if (right) {
                        x = props.x + event.deltaRect.left / props.offset.ratio;
                        width = event.rect.width / props.offset.ratio;
                        width = Math.max(width, props.min_width);
                    }
                    if (bottom) {
                        y = props.y + event.deltaRect.top / props.offset.ratio;
                        height = event.rect.height / props.offset.ratio;
                        height = Math.max(height, props.min_height);
                    }
                    if (left) {
                        x = props.x + event.deltaRect.left / props.offset.ratio;
                        width = props.width - event.deltaRect.left / props.offset.ratio;
                        if (width < props.min_width) {
                            const diff = width - props.min_width;
                            width = props.min_width;
                            x += diff;
                        }
                    }

                    if (event.shiftKey) {
                        let length = Math.max(width, height);
                        length = Math.min(length, props.boundary.right - x);
                        length = Math.min(length, props.boundary.bottom - y);
                        width = length;
                        height = length;
                    }

                    emit('update:y', y);
                    emit('update:x', x);
                    emit('update:height', height);
                    emit('update:width', width);
                }
            }
        })
        .draggable({
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent'
                })
            ],
            listeners: {
                move(event) {
                    let x = props.x + event.dx / props.offset.ratio;
                    let y = props.y + event.dy / props.offset.ratio;

                    emit('update:x', x);
                    emit('update:y', y);
                }
            }
        });
});

const eventHandle = (event) => {
    const speed = event.shiftKey ? 10 : 1;

    let x = props.x;
    let y = props.y;
    let width = props.width;
    let height = props.height;

    switch (event.code) {
        case 'ArrowUp':
            if (event.metaKey) {
                height = Math.max(height - speed, props.min_height);
            } else {
                y = Math.max(props.boundary.top, y - speed);
            }
            break;
        case 'ArrowRight':
            if (event.metaKey) {
                width = Math.min(width + speed, props.boundary.right - x);
            } else {
                x = Math.min(props.boundary.right - width, x + speed);
            }
            break;
        case 'ArrowDown':
            if (event.metaKey) {
                height = Math.min(height + speed, props.boundary.bottom - y);
            } else {
                y = Math.min(props.boundary.bottom - height, y + speed);
            }
            break;
        case 'ArrowLeft':
            if (event.metaKey) {
                width = Math.max(width - speed, props.min_width);
            } else {
                x = Math.max(props.boundary.left, x - speed);
            }
            break;
    }

    emit('update:x', x);
    emit('update:y', y);
    emit('update:width', width);
    emit('update:height', height);
};
</script>

<template>
    <div
        tabindex="0"
        @keydown="eventHandle"
        :id="uid"
        class="resize-drag"
        :style="{
            top: `${props.y * props.offset.ratio}px`,
            left: `${props.x * props.offset.ratio}px`,
            width: `${props.width * props.offset.ratio}px`,
            height: `${props.height * props.offset.ratio}px`
        }"
    >
        <slot></slot>
        <div class="information">
            x: {{ Math.floor(props.x) }} y: {{ Math.floor(props.y) }},
            {{ Math.floor(props.width) }} × {{ Math.floor(props.height) }}
        </div>
    </div>
</template>

<style lang="scss">
.resize-drag {
    &:focus-visible {
        outline: none;
    }
    will-change: top, left, width, height;
    box-sizing: border-box;
    position: absolute;
    border: 1px dashed yellow;
    background-color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    &.active {
        background-color: rgba(0, 255, 0, 0.3);
        .information {
            display: block;
        }
        &,
        .information {
            z-index: 1;
        }
    }
    .information {
        user-select: none;
        pointer-events: none;
        display: none;
        position: absolute;
        top: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
        background:
            linear-gradient(0deg, rgba(247, 248, 248, 0.05), rgba(247, 248, 248, 0.05)),
            rgba(55, 56, 60, 0.9);
        box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.15) inset,
            0 0 0 1px rgba(0, 0, 0, 0.5),
            0 0 4px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(7.5px);
        border-radius: 3px;
        padding: 0 6px;
        height: 24px;
        line-height: 24px;
        white-space: nowrap;
        color: #ffffff;
        font-size: 12px;
    }
}
</style>
