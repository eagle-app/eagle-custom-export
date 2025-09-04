<!-- 拖拉上傳組件 -->
<script setup>
const props = defineProps({
    style: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['drop']);
const main = inject('main');

const active = ref(false);

const onDrop = (e) => {
    setInactive();
    const files = [...e.dataTransfer.files];
    emit('drop', files);
};

function setActive() {
    active.value = true;
}
function setInactive() {
    active.value = false;
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop'];

function preventDefaults(e) {
    e.preventDefault();
}

onMounted(() => {
    events.forEach((eventName) => {
        document.body.addEventListener(eventName, preventDefaults);
    });
});

onUnmounted(() => {
    events.forEach((eventName) => {
        document.body.removeEventListener(eventName, preventDefaults);
    });
});
</script>

<template>
    <div class="drop-zone-vue" :class="{
        dropping: active,
        'no-style': !props.style,
        'no-main-items': !main.items
    }" @dragenter.prevent.stop="setActive">
        <slot></slot>

        <div class="overlay" @dragleave.prevent.stop="setInactive" @drop.prevent.stop="onDrop">
        
        </div>
    </div>
</template>

<style lang="scss">
.drop-zone-vue {
    position: relative;
    width: inherit;
    height: inherit;

    &.no-main-items {
        border-radius: 8px;
        border: 1px dashed var(--color-border-primary);
        margin: 12px;
    }

    .overlay {
        z-index: 999;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-primary-20);
        pointer-events: none;
        opacity: 0;
        border: 1px dashed var(--color-primary);
        border-radius: inherit;
        margin: 12px 12px 12px 0px;

    }

    &.dropping {
        .overlay {
            opacity: 1;
            pointer-events: all;
        }
    }

    &.no-style {
        .overlay {
            .tip {
                display: none;
            }
        }
    }

    @keyframes drop-tip {
        0% {
            transform: translateX(-50%) translateY(0);
        }

        40% {
            transform: translateX(-50%) translateY(-10px);
        }

        100% {
            transform: translateX(-50%) translateY(0%);
        }
    }
}
</style>
