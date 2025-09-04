<script setup>
import interact from 'interactjs';
const utils = require(`${__dirname}/modules/utils`);

const props = defineProps({
    container: {
        type: String,
        default: '.pinch-zoom-container'
    },
    fit: {
        type: Boolean,
        default: false
    },
    dragMove: {
        type: Boolean,
        default: false
    }
});

const pinchZoomEl = ref(null);

const scaleStep = [0.05, 0.1, 0.25, 0.5, 1, 1.25, 1.5, 2, 3, 4, 8];

const boundary = 100;

const isReady = ref(false);

const isTrust = ref(false);

const offset = reactive({
    x: 0,
    y: 0,
    ratio: 1
});

const container = reactive({
    width: 0,
    height: 0
});

const child = reactive({
    width: 0,
    height: 0
});

const fit = () => {
    offset.ratio = Math.min(container.width / child.width, container.height / child.height);
    center();
    updateTransform();
};

const scale = async (ratio) => {
    offset.ratio = ratio;
    center();
    updateTransform();
};

const updateTransform = () => {
    pinchZoomEl.value.setTransform({
        x: offset.x,
        y: offset.y,
        scale: offset.ratio
    });
};

const getOffset = () => {
    offset.x = pinchZoomEl.value.x;
    offset.y = pinchZoomEl.value.y;
    offset.ratio = pinchZoomEl.value.scale;
};

const setOffset = (x, y, ratio) => {
    offset.x = x;
    offset.y = y;
    offset.ratio = ratio;
    updateTransform();
};

const resize = async () => {
    if (!pinchZoomEl.value) return;

    await utils.time.imgLoad(pinchZoomEl.value.children);

    container.width = pinchZoomEl.value.clientWidth;
    container.height = pinchZoomEl.value.clientHeight;
    child.width = pinchZoomEl.value.firstElementChild.clientWidth;
    child.height = pinchZoomEl.value.firstElementChild.clientHeight;
    if (props.fit) {
        fit();
    } else {
        center();
        updateTransform();
    }
};

const center = () => {
    offset.x = (container.width - child.width * offset.ratio) / 2;
    offset.y = (container.height - child.height * offset.ratio) / 2;
};

const wheelEventHandle = async (event) => {
    if (event.metaKey || event.ctrlKey || props.dragMove) getOffset();

    if (props.dragMove) {
        move(0, 0);
    } else {
        const divisor = 2;
        const deltaX = (-1 * event.deltaX) / divisor;
        const deltaY = (-1 * event.deltaY) / divisor;

        move(deltaX, deltaY);
    }

    await utils.time.sleep(1);
    updateTransform();
};

const mousedownEventHandle = (event) => {
    if (props.dragMove) document.querySelector(props.container).style.cursor = 'grabbing';
    isTrust.value = true;
};

const mousemoveEventHandle = (event) => {
    if (isTrust.value) {
        const deltaX = event.movementX;
        const deltaY = event.movementY;
        move(deltaX, deltaY);
    }
};

const mouseupEventHandle = (event) => {
    if (props.dragMove) document.querySelector(props.container).style.cursor = 'grab';
    isTrust.value = false;
};
const move = (x, y) => {
    offset.x += x;
    offset.y += y;

    if (container.width >= child.width * offset.ratio) {
        offset.x = Math.max(offset.x, 0);
        offset.x = Math.min(offset.x, container.width - child.width * offset.ratio);
    } else {
        offset.x = Math.min(offset.x, boundary);
        offset.x = Math.max(offset.x, container.width - child.width * offset.ratio - boundary);
    }

    if (container.height >= child.height * offset.ratio) {
        offset.y = Math.max(offset.y, 0);
        offset.y = Math.min(offset.y, container.height - child.height * offset.ratio);
    } else {
        offset.y = Math.min(offset.y, boundary);
        offset.y = Math.max(offset.y, container.height - child.height * offset.ratio - boundary);
    }

    updateTransform();
};

const scaleIn = () => {
    const ratio = scaleStep.find((e) => e > offset.ratio);
    if (!ratio) return;
    offset.ratio = ratio;
    center();
    updateTransform();
};

const scaleOut = () => {
    const ratio = scaleStep.findLast((e) => e < offset.ratio);
    if (!ratio) return;
    offset.ratio = ratio;
    center();
    updateTransform();
};

const view = async (x, y, width, height) => {
    const left = -1 * offset.x <= x * offset.ratio;
    const right = (x + width) * offset.ratio <= -1 * offset.x + container.width;
    const top = -1 * offset.y <= y * offset.ratio;
    const bottom = (y + height) * offset.ratio <= -1 * offset.y + container.height;
    if (top && right && bottom && left) return;
    offset.x = -1 * (x + width / 2) * offset.ratio + container.width / 2;
    offset.y = -1 * (y + height / 2) * offset.ratio + container.height / 2;
    offset.ratio =
        Math.min(
            container.width / width,
            container.height / height,
            scaleStep[scaleStep.length - 1]
        ) / 1.5;

    updateTransform();
};

const resizeObserver = new ResizeObserver(resize);
const mutationObserver = new MutationObserver(resize);

onMounted(async () => {
    interact('#scrollbar-vertical-thumb')
        .styleCursor(false)
        .draggable({
            lockAxis: 'y',
            listeners: {
                move: (event) => {
                    const ratio = container.height / (child.height * offset.ratio);
                    offset.y -= event.dy / ratio;

                    offset.y = Math.min(offset.y, boundary);

                    offset.y = Math.max(
                        offset.y,
                        container.height - child.height * offset.ratio - boundary
                    );

                    updateTransform();
                }
            }
        });

    interact('#scrollbar-horizontal-thumb')
        .styleCursor(false)
        .draggable({
            lockAxis: 'x',
            listeners: {
                move: (event) => {
                    const ratio = container.width / (child.width * offset.ratio);
                    offset.x -= event.dx / ratio;

                    offset.x = Math.min(offset.x, boundary);

                    offset.x = Math.max(
                        offset.x,
                        container.width - child.width * offset.ratio - boundary
                    );

                    updateTransform();
                }
            }
        });

    const containerEl = document.querySelector(props.container);
    containerEl.style.overflow = 'hidden';
    if (props.dragMove) containerEl.style.cursor = 'grab';
    containerEl.addEventListener('wheel', wheelEventHandle, { passive: true });
    if (props.dragMove) {
        containerEl.addEventListener('mousedown', mousedownEventHandle);
        window.addEventListener('mousemove', mousemoveEventHandle);
        window.addEventListener('mouseup', mouseupEventHandle);
    }
    const containerChildEl = containerEl.firstElementChild;
    const className = `pinchZoom-trigger-${utils.string.generateRandomString(5)}`;
    containerChildEl.classList.add(className);
    pinchZoomEl.value.setAttribute('container', `.${className}`);
    pinchZoomEl.value.setAttribute('min-scale', scaleStep[0]);
    pinchZoomEl.value.setAttribute('max-scale', scaleStep[scaleStep.length - 1]);
    pinchZoomEl.value.setAttribute('drag-move', props.dragMove);

    await utils.time.imgLoad(pinchZoomEl.value.children);

    resizeObserver.observe(containerEl);
    if (pinchZoomEl.value) {
        mutationObserver.observe(pinchZoomEl.value.firstElementChild, {
            attributes: true
        });
    }

    isReady.value = true;
});

onBeforeUnmount(() => {
    const containerEl = document.querySelector(props.container);
    containerEl.style.overflow = '';
    containerEl.removeEventListener('wheel', wheelEventHandle);
    if (props.dragMove) {
        containerEl.removeEventListener('mousedown', mousedownEventHandle);
        window.removeEventListener('mousemove', mousemoveEventHandle);
        window.removeEventListener('mouseup', mouseupEventHandle);
    }

    resizeObserver.disconnect();
    mutationObserver.disconnect();
});

defineExpose({
    offset,
    scaleStep,
    fit,
    scale,
    scaleIn,
    scaleOut,
    width: () => child.width,
    height: () => child.height,
    view,
    setOffset,
    element: () => pinchZoomEl.value
});
</script>

<template>
    <div class="pinch-zoom-container" v-show="isReady">
        <pinch-zoom class="pinch-zoom" ref="pinchZoomEl">
            <slot></slot>
        </pinch-zoom>
        <div
            class="scrollbar scrollbar-vertical"
            v-show="Math.floor(child.height * offset.ratio) > container.height"
            @mousedown.self.prevent.stop="
                ($event) => {
                    percent = $event.offsetY / $event.target.clientHeight;
                    offset.y = -1 * child.height * offset.ratio * percent;
                    offset.y += $event.target.clientHeight / 2;
                    updateTransform();
                }
            "
        >
            <div
                id="scrollbar-vertical-thumb"
                class="scrollbar-thumb"
                :style="{
                    top: `${((-1 * offset.y) / (child.height * offset.ratio)) * 100}%`,
                    height: `${(container.height / (child.height * offset.ratio)) * 100}%`
                }"
                @mousedown.stop
            ></div>
        </div>
        <div
            class="scrollbar scrollbar-horizontal"
            v-show="Math.floor(child.width * offset.ratio) > container.width"
            @mousedown.prevent.stop="
                ($event) => {
                    percent = $event.offsetX / $event.target.clientWidth;
                    offset.x = -1 * child.width * offset.ratio * percent;
                    offset.x += $event.target.clientWidth / 2;
                    updateTransform();
                }
            "
        >
            <div
                id="scrollbar-horizontal-thumb"
                class="scrollbar-thumb"
                :style="{
                    left: `${((-1 * offset.x) / (child.width * offset.ratio)) * 100}%`,
                    width: `${(container.width / (child.width * offset.ratio)) * 100}%`
                }"
                @mousedown.stop
            ></div>
        </div>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.pinch-zoom-container {
    width: 100%;
    height: 100%;
    .pinch-zoom {
        width: 100%;
        height: 100%;
        //background: var(--color-theme-90);
    }

    .scrollbar {
        $margin: 2px;
        $size: 4px;
        position: absolute;
        z-index: 10;
        overflow: hidden;
        border-radius: 2px;
        cursor: default;

        .scrollbar-thumb {
            --background-color: var(--color-black-15);
            @include mixins.dark {
                --background-color: var(--color-white-15);
            }
            position: absolute;
            background-color: var(--background-color);

            &:hover {
                --background-color: var(--color-black-30);
                @include mixins.dark {
                    --background-color: var(--color-white-30);
                }
                background-color: var(--background-color);
            }
        }

        &.scrollbar-vertical {
            right: 0;
            top: 0;
            bottom: 0;
            width: $size + $margin * 2;
            .scrollbar-thumb {
                margin-left: $margin;
                width: calc(100% - $margin * 2);
            }
        }

        &.scrollbar-horizontal {
            bottom: 0;
            left: 0;
            right: 0;
            height: $size + $margin * 2;
            .scrollbar-thumb {
                margin-top: $margin;
                height: calc(100% - $margin * 2);
            }
        }
    }
}
</style>
