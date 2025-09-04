<script setup>
import { computed, inject } from 'vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    container: {
        type: [HTMLElement, String, null],
        default: null
    },
    class: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const closeDialog = inject('closeDialog', null);

const handleClickOutside = (e) => {
    if (e.target.classList.contains('custom-dialog-overlay')) {
        closeDialog();
    }
};

</script>

<template>
    <Teleport :to="container || 'body'">
        <Transition name="dialog-wrapper">
            <div v-if="isOpen" class="custom-dialog-wrapper">
                <!-- Overlay -->
                <div class="custom-dialog-overlay" @click="handleClickOutside"></div>

                <!-- Content -->
                <div :class="['custom-dialog-content', props.class]">
                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

// Dialog wrapper 動畫 - 控制 overlay 和 content
.dialog-wrapper-enter-active {
    transition: all 250ms ease-out;
    
    .custom-dialog-overlay {
        transition: opacity 200ms ease-out;
    }
    
    .custom-dialog-content {
        transition: all 250ms cubic-bezier(0.34, 1.26, 0.64, 1);
    }
}

.dialog-wrapper-leave-active {
    transition: all 200ms ease-out;
    
    .custom-dialog-overlay {
        transition: opacity 200ms ease-out;
    }
    
    .custom-dialog-content {
        transition: all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
}

.dialog-wrapper-enter-from {
    .custom-dialog-overlay {
        opacity: 0;
    }
    
    .custom-dialog-content {
        opacity: 0;
        transform: scale(0.95) translateY(-30px);
    }
}

.dialog-wrapper-leave-to {
    .custom-dialog-overlay {
        opacity: 0;
    }
    
    .custom-dialog-content {
        opacity: 0;
        transform: scale(0.98) translateY(-30px);
    }
}

.custom-dialog-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 0px 12px;
}

.custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);

    @include mixins.dark {
        background: rgba(0, 0, 0, 0.6);
    }
}

.custom-dialog-content {
    position: relative;
    border-radius: 8px;
    width: 100%;
    max-width: 425px;
    max-height: 80vh;
    overflow-y: auto;
    top: 50px;
    background: var(--box-background);
    box-shadow: var(--box-border-shadow);
    border-top: var(--box-border-top);
    border-left: var(--box-border-left);
    border-right: var(--box-border-right);
    border-bottom: var(--box-border-bottom);
    backdrop-filter: var(--box-background-blur);
}
</style>