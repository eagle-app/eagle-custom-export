<template>
    <!-- Linus style: Simple, clean, data-driven -->
    <TableVue :header="tableHeaders" :data="displayTasks" v-show="hasAnyTasks" class="v-table">
        <!-- Status Column - Data knows how to display itself -->
        <template #status="{ row }">
            <el-icon :class="row.statusClass" v-tippy="{
                content: row.statusMessage,
                delay: [200, 0],
                duration: [150, 0]
            }"></el-icon>
        </template>

        <!-- Thumbnail Column - Delegate to specialized component -->
        <template #thumbnail="{ row }">
            <TaskThumbnail :task="row" />
        </template>

        <!-- Name Column - Linus style: Delegate to model -->
        <template #name="{ row }">
            <span class="text-ellipsis filename-text" :class="row.nameClass" @click="row.handleNameClick">
                {{ row.displayName }}
            </span>
        </template>

        <!-- Format Column - Data-driven display -->
        <template #format="{ row }">
            <div class="format-cell">
                <span class="original-format" :style="row.formatStyle" v-tippy="{
                    content: row.formatMessage,
                    show: row.isError,
                    delay: [200, 0],
                    duration: [150, 0]
                }">
                    {{ row.originalFormatText }}
                </span>
                <template v-if="row.showFormatArrow">
                    <el-icon class="icon-arrow"></el-icon>
                    <span class="new-format" :class="row.newFormatClass">
                        {{ row.newFormatText }}
                    </span>
                </template>
            </div>
        </template>

        <!-- Dimensions Column - Linus style: Delegate to specialized component -->
        <template #dimensions="{ row }">
            <DimensionDisplay :task="row" />
        </template>

        <!-- Remove Column - Delegate to specialized component -->
        <template #remove="{ row }">
            <TaskActions :task="row" @remove="taskManager.removeTask" />
        </template>
    </TableVue>

    <!-- Empty State - Keep it simple -->
    <el-empty v-show="isEmpty" :description="$translate('main.taskList.emptyText')" :image-size="128">
        <template #image>
            <el-icon class="icon icon-empty"></el-icon>
        </template>
        {{ $translate('main.taskList.emptyText') }}
    </el-empty>
</template>

<script setup>
// Linus style: Import only what you need
import { inject, watch, getCurrentInstance, computed } from 'vue';
import TableVue from '@/components/tables/TableVue.vue';
import TaskThumbnail from './TaskThumbnail.vue';
import TaskActions from './TaskActions.vue';
import DimensionDisplay from './DimensionDisplay.vue';
import { TaskItem } from '@/models/TaskItem.js';

// Linus style: Simple dependency injection
const main = inject('main');
const exportSettings = inject('exportSettings');
const taskManager = inject('taskManager');
const { proxy } = getCurrentInstance();
const $translate = proxy.$translate;

// Table config - minimal, clean configuration
const tableHeaders = {
    status: { name: '', minWidth: 36 },
    thumbnail: { name: '', minWidth: 32 },
    name: { name: '', minWidth: 200, fill: true, line: true, padding: '8px' },
    format: { name: '', minWidth: 120, line: true, padding: '8px' },
    dimensions: { name: '', minWidth: 240, line: true, padding: '8px' },
    remove: { name: '', minWidth: 36, align: 'center' }
};

// THE KEY IMPROVEMENT - Data structure does the work
// No more scattered if/else logic, no processItems garbage
const displayTasks = computed(() =>
    TaskItem.fromRawTasks(taskManager.getFormattedTasks.value, exportSettings.value, $translate)
);

// Linus style: Simple computed properties
const hasAnyTasks = computed(() =>
    displayTasks.value.length > 0 || taskManager.isLoadingTasks.value
);

const isEmpty = computed(() =>
    displayTasks.value.length === 0 && !taskManager.isLoadingTasks.value
);

// Core processing - Linus style: Let TaskManager handle complexity
// No more processItems with 3 if statements and 2 returns!
const addNewItems = (items) => {
    if (!items?.length) return;

    // TaskManager handles deduplication, validation, everything
    // No need for complex state tracking here
    taskManager.addTasksProgressively(items, {
        batchDelay: 16 // 60fps
    });
};

// Simple watch - no complex state management
watch(
    () => main?.items,
    () => {
        addNewItems(main.items);
    },
    { immediate: true }
);

// API - Clean interface
defineExpose({
    // Direct access to task manager methods
    tasks: taskManager.tasks,
    taskStats: taskManager.taskStats,
    clearAllTasks: taskManager.clearAllTasks,
    clearCompletedTasks: taskManager.clearCompletedTasks,
    removeTask: taskManager.removeTask,
    resetTaskStatus: taskManager.resetTaskStatus
});
</script>

<style lang="scss" scoped>
// Linus style: Only the essential styles
.v-table {
    padding-top: 12px;
}

// Row hover effects - keep existing behavior
:deep(.v-tr) {
    &:hover {
        .remove {
            opacity: 0.8;
        }
    }

    .status {
        margin: auto;
    }

    .icon-arrow {
        background-repeat: no-repeat;
    }
}

// Essential layout styles
.text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
}

.filename-text {
    user-select: text;
    cursor: text;
}

.filename-link {
    &:hover {
        opacity: 0.8;
        cursor: pointer;
        text-decoration: underline;
        transition: all var(--animation-normal);
    }
}

// Dimension styles moved to DimensionDisplay.vue - Linus style: single responsibility

.format-cell {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;

    .original-format {
        color: var(--color-text-secondary);
        width: 40px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-family-mono);
    }

    .new-format {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-normal);
        width: 40px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: var(--font-family-mono);

        &.empty {
            opacity: 0.25;
        }
    }
}

// Format changed styling
:deep(.format-changed) {
    color: #409eff;
    font-weight: var(--font-weight-bold);
}
</style>