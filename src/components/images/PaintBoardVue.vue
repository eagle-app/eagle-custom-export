<script setup>
const utils = require(`${__dirname}/modules/utils`);

const brushSize = defineModel('brushSize');

const props = defineProps({
    trigger: {
        type: String,
        default: ''
    },
    src: {
        type: String,
        default: ''
    },
    offset: {
        type: Object,
        default: () => ({
            x: 0,
            y: 0,
            ratio: 1
        })
    }
});

const boundary = {
    width: 0,
    height: 48
};

const width = ref(0);
const height = ref(0);

const emit = defineEmits(['startDrawing', 'drawing', 'endDrawing']);

const canvasEl = ref(null);
const ctx = ref(null);

const showLayers = ref(true);

let painting = false;

function startDrawing(e) {
    painting = true;
    draw(e);

    emit('startDrawing');
}

function endDrawing() {
    if (!painting) return;

    painting = false;

    ctx.value.beginPath();

    emit('endDrawing');
}

function draw(e) {
    if (!painting) return;
    ctx.value.lineWidth = props.brushSize / props.offset.ratio;
    ctx.value.lineCap = 'round';
    ctx.value.strokeStyle = 'white';

    const x =
        (e.clientX - canvasEl.value.offsetLeft - props.offset.x - boundary.width) /
        props.offset.ratio;
    const y =
        (e.clientY - canvasEl.value.offsetTop - props.offset.y - boundary.height) /
        props.offset.ratio;

    ctx.value.lineTo(x, y);
    ctx.value.stroke();
    ctx.value.beginPath();
    ctx.value.moveTo(x, y);
}

const eye = async () => {
    showLayers.value = !showLayers.value;
};

const exportBase64 = async () => {
    const srcToBase64 = async (src) => {
        const img = await utils.image.create(src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/png');
    };

    const imageBase64 = await srcToBase64(props.src);

    const maskBase64 = canvasEl.value.toDataURL('image/png');

    return {
        imageBase64,
        maskBase64
    };
};

let triggerEl = null;

onMounted(async () => {
    const img = await utils.image.create(props.src);
    width.value = img.width;
    height.value = img.height;
    canvasEl.value.width = img.width;
    canvasEl.value.height = img.height;
    ctx.value = canvasEl.value.getContext('2d');

    triggerEl = document.querySelector(canvasEl.value.className);
    if (props.trigger && document.querySelector(props.trigger)) {
        triggerEl = document.querySelector(props.trigger);
    }
    triggerEl.addEventListener('mousedown', startDrawing);
    triggerEl.addEventListener('mousemove', draw);
    triggerEl.addEventListener('mouseup', endDrawing);
    triggerEl.addEventListener('mouseleave', endDrawing);
});

onUnmounted(() => {
    triggerEl.removeEventListener('mousedown', startDrawing);
    triggerEl.removeEventListener('mousemove', draw);
    triggerEl.removeEventListener('mouseup', endDrawing);
    triggerEl.removeEventListener('mouseleave', endDrawing);
});

function clear() {
    ctx.value.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
}

defineExpose({
    eye,
    exportBase64,
    clear
});
</script>

<template>
    <div
        class="paint-board-vue"
        :style="{
            width: width + 'px',
            height: height + 'px'
        }"
    >
        <img class="img" :src="props.src" :alt="props.src" />
        <canvas ref="canvasEl" class="canvas"> </canvas>
    </div>
    <CursorVue container=".pinch-zoom-container" :size="brushSize"></CursorVue>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.paint-board-vue {
    position: relative;
    .img,
    .layers,
    .layers img,
    .canvas {
        position: absolute;
    }
    .canvas {
        opacity: 0.7;
    }
}
</style>
