<template>
    <div class="dimensions-cell">
        <template
            v-if="!task.isError && (task.dimensionsDisplay.original.width && task.dimensionsDisplay.original.height)">
            <div class="dimension-original-item">
                <span class="dimension-item-width">{{ task.dimensionsDisplay.original.width }}</span>
                <span class="dimension-item-separator">×</span>
                <span class="dimension-item-height">{{ task.dimensionsDisplay.original.height }}</span>
            </div>
            <template v-if="task.showDimensionArrow">
                <el-icon class="icon-arrow"></el-icon>
                <span class="dimension-export-item">
                    <span class="dimension-item-width">{{ task.dimensionsDisplay.export.width }}</span>
                    <span class="dimension-item-separator">×</span>
                    <span class="dimension-item-height">{{ task.dimensionsDisplay.export.height }}</span>
                </span>
            </template>
        </template>
        <span v-else class="dimension-original-item empty">-</span>
    </div>
</template>

<script setup>
// Linus style: Single responsibility - only dimension display
const props = defineProps({
    task: {
        type: Object,
        required: true
    }
});
</script>

<style lang="scss" scoped>
.dimensions-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 8px;

    .dimension-original-item {
        color: var(--color-text-secondary);
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;

        &>span {
            font-family: var(--font-family-mono);
        }

        &.empty {
            text-align: right;
            opacity: 0.25;
        }
    }

    .dimension-export-item {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-normal);
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;

        &>span {
            font-family: var(--font-family-mono);
        }
    }

    .dimension-item-width {
        width: 40px;
        text-align: right;
    }

    .dimension-item-height {
        width: 40px;
        text-align: left;
    }
}
</style>