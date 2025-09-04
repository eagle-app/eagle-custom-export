<template>
    <div v-if="visible" class="hover-preview" :style="previewStyle" ref="previewRef">
        <img v-if="imageUrl" :src="imageUrl" :alt="alt" class="preview-image" @load="handleImageLoad"
            @error="handleImageError" />
        <div v-else class="preview-placeholder">
            <el-icon class="icon-image"></el-icon>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    imageUrl: {
        type: String,
        default: ''
    },
    alt: {
        type: String,
        default: ''
    },
    mouseX: {
        type: Number,
        default: 0
    },
    mouseY: {
        type: Number,
        default: 0
    }
});

// Refs
const previewRef = ref(null);
const imageLoaded = ref(false);
const imageError = ref(false);

// Constants
const MAX_SIZE = 300;
const OFFSET = 10; // 距離鼠標的偏移量

// Computed styles for positioning
const previewStyle = computed(() => {
    if (!props.visible) {
        return {
            display: 'none'
        };
    }

    // 獲取窗口尺寸
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = props.mouseX + OFFSET;
    let top = props.mouseY + OFFSET;

    // 檢查是否會超出右邊界，如果會則顯示在鼠標左側
    if (left + MAX_SIZE > windowWidth) {
        left = props.mouseX - MAX_SIZE - OFFSET;
    }

    // 檢查是否會超出下邊界，如果會則顯示在鼠標上方
    if (top + MAX_SIZE > windowHeight) {
        top = props.mouseY - MAX_SIZE - OFFSET;
    }

    // 確保不會超出左邊界和上邊界
    left = Math.max(OFFSET, left);
    top = Math.max(OFFSET, top);

    return {
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: imageLoaded.value ? 1 : 0,
        transition: 'opacity 0.2s ease'
    };
});

// Event handlers
const handleImageLoad = () => {
    imageLoaded.value = true;
    imageError.value = false;
};

const handleImageError = () => {
    imageLoaded.value = false;
    imageError.value = true;
};

// Watch for visibility changes to reset states
import { watch } from 'vue';
watch(() => props.visible, (newVal) => {
    if (!newVal) {
        imageLoaded.value = false;
        imageError.value = false;
    } else if (props.imageUrl) {
        // 當顯示預覽時立即開始載入圖片
        imageLoaded.value = false;
        imageError.value = false;
    }
});

// Watch for imageUrl changes to reset load state
watch(() => props.imageUrl, () => {
    imageLoaded.value = false;
    imageError.value = false;
});
</script>

<style lang="scss" scoped>
.hover-preview {
    background: var(--color-bg-primary);    
    border: 1px solid var(--color-border-primary);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    pointer-events: none;
    display: inline-block;

    .preview-image {
        max-width: 300px;
        max-height: 300px;
        display: block;
        object-fit: contain;
        width: auto;
        height: auto;
    }

    .preview-placeholder {
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-lightgray-20);
        color: var(--color-text-placeholder);
        font-size: 24px;
    }
}

// Dark theme support
@media (prefers-color-scheme: dark) {
    .hover-preview {
        background: var(--color-theme-80);
        border-color: var(--color-border-secondary);

        .preview-placeholder {
            background: var(--color-theme-60);
        }
    }
}
</style>