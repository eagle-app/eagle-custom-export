<template>
    <div class="mode-toggle-container">
        <ToggleSwitchSliderVue
            :model-value="modelValue"
            @update:model-value="$emit('update:modelValue', $event)"
            :data="options"
            class="mode-toggle-control"
        >
            <template #default="{ data }">
                {{ getOptionLabel(data) }}
            </template>
        </ToggleSwitchSliderVue>
    </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';
import ToggleSwitchSliderVue from '@/components/tools/ToggleSwitchSliderVue.vue';

// 定義 props
const props = defineProps({
    modelValue: {
        type: String,
        required: true
    },
    options: {
        type: Array,
        default: () => ['export', 'replace']
    },
    translationPrefix: {
        type: String,
        default: 'main.SettingSidebar.operationMode'
    }
});

// 定義 emits
defineEmits(['update:modelValue']);

// 注入翻譯函數
const { proxy } = getCurrentInstance();
const $translate = proxy.$translate;

// 獲取選項標籤
const getOptionLabel = (option) => {
    return $translate(`${props.translationPrefix}.${option}`);
};
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.mode-toggle-container {
    margin-bottom: 0;
    padding: 0;

    .mode-toggle-control {
        width: 100%;

        // 覆蓋 ToggleSwitchSliderVue 的背景色以符合您的需求
        :deep(.toggle-switch-slider-vue) {
            --background-color: var(--color-dark-15);

            @include mixins.dark {
                --background-color: var(--color-black-30);
            }

            background-color: var(--background-color);

            .slider-background {
                --slider-bg-color: var(--color-white);

                @include mixins.dark {
                    --slider-bg-color: var(--color-theme-90);
                }

                background-color: var(--slider-bg-color);
            }
        }
    }
}

// 命名設定區塊過渡動畫
.naming-settings-transition {
    &-enter-active,
    &-leave-active {
        transition: all var(--animation-slow);
        overflow: hidden;
    }

    &-enter-from,
    &-leave-to {
        opacity: 0;
        height: 0;
        margin-bottom: 0;
    }

    &-enter-to,
    &-leave-from {
        opacity: 1;
        height: auto;
        margin-bottom: 16px;
    }
}
</style>
