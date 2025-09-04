<template>
    <div 
        class="thumbnail-wrapper"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousemove="handleMouseMove"
    >
        <img 
            v-if="task.thumbnailUrl && !showPlaceholder" 
            :src="task.thumbnailUrl" 
            :alt="task.item?.name"
            class="task-thumbnail" 
            :style="task.thumbnailStyle" 
            @error="handleThumbnailError" 
        />
        <div 
            v-else 
            class="thumbnail-placeholder show-placeholder"
        >
            <el-icon class="icon-image"></el-icon>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useHoverPreview } from '@/composables/useHoverPreview';

// Props - single responsibility: only thumbnail display
const props = defineProps({
    task: {
        type: Object,
        required: true
    }
});

// Local state - only for UI placeholder handling
const showPlaceholder = ref(false);

// Hover preview integration - 使用高級 API
const { createHoverHandler } = useHoverPreview();

const { handleMouseEnter, handleMouseLeave, handleMouseMove } = createHoverHandler(() => ({
    imageUrl: props.task.thumbnailUrl && !showPlaceholder.value ? props.task.thumbnailUrl : '',
    alt: props.task.item?.name || ''
}));

// Linus style: Component handles its own errors, no delegation needed
const handleThumbnailError = (event) => {
    // Simple: if image fails to load, show placeholder
    showPlaceholder.value = true;
    
    // Optional: let TaskItem know for logging/stats, but don't depend on result
    props.task.handleThumbnailError?.(event);
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/modules/mixins';

.thumbnail-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    position: relative;
    padding: 2px;

    .task-thumbnail {
        max-width: 100%;
        max-height: 100%;
        border-radius: 4px;
    }

    .thumbnail-placeholder {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-lightgray-20);
        border: 1px solid var(--color-border-primary);
        border-radius: 4px;
        color: var(--color-text-placeholder);
        font-size: 14px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        @include mixins.dark {
            background: var(--color-theme-80);
        }
    }
}
</style>