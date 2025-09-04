<template>
    <div class="task-actions">
        <!-- Remove action -->
        <el-icon 
            class="icon icon-trash remove" 
            @click="handleRemove"
            v-tippy="{
                content: removeTooltip,
                placement: 'left',
                delay: [200, 0],
                duration: [150, 0]
            }"
        ></el-icon>
    </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue';

// Props - receive task and actions
const props = defineProps({
    task: {
        type: Object,
        required: true
    }
});

// Emits - communicate actions to parent
const emit = defineEmits(['remove']);

// Translation helper
const { proxy } = getCurrentInstance();
const $translate = proxy.$translate;

// Computed properties
const removeTooltip = $translate('main.taskList.remove');

// Event handlers - delegate to parent via events
const handleRemove = () => {
    emit('remove', props.task.id);
};
</script>

<style lang="scss" scoped>
.task-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    
    .remove {
        cursor: pointer;
        opacity: 0;
        border-radius: 4px;
        transition: all var(--animation-normal);

        &:hover {
            opacity: 1;
            background-color: var(--color-bg-hover);
        }
    }
    
    // Show on row hover - will be triggered by parent table row
    :deep(.v-tr:hover) & .remove {
        opacity: 0.8;
    }
}
</style>