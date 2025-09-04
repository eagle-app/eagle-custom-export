<script setup>
import { Check, ChevronsUpDown } from 'lucide-vue-next';
import { ref, getCurrentInstance, watch } from 'vue';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Combobox,
    ComboboxAnchor,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxItemIndicator,
    ComboboxList,
    ComboboxTrigger
} from '@/components/ui/combobox';

// 獲取全局屬性
const { proxy } = getCurrentInstance();
const $translate = proxy?.$translate;

const props = defineProps({
    modelValue: {
        type: [String, Number, Object],
        default: null
    },
    options: {
        type: Array,
        required: true
    },
    placeholder: {
        type: String,
        default: ''
    },
    translatePrefix: {
        type: String,
        default: ''
    },
    tabindex: {
        type: [Number, String],
        default: 0
    }
});

const emit = defineEmits(['update:modelValue', 'visible-change']);

// 內部選中值
const selectedValue = ref(props.modelValue);
// 搜索輸入值 - 用於控制 Combobox 的搜索詞
const searchTerm = ref('');

// 監聽外部 modelValue 的變化並同步到內部狀態
watch(() => props.modelValue, (newValue) => {
    selectedValue.value = newValue;
});

// 處理下拉選單開啟/關閉
// 控制下拉選單的開啟狀態
const isOpen = ref(false);

const handleOpenChange = (open) => {
    isOpen.value = open;
    if (open) {
        // 開啟時清空搜索輸入
        searchTerm.value = '';
    }
    emit('visible-change', open);
};

// 處理按鈕的鍵盤事件
const handleKeyDown = (event) => {
    // 當按下向下鍵時，開啟下拉選單
    if (event.key === 'ArrowDown' && !isOpen.value) {
        event.preventDefault();
        isOpen.value = true;
    }
};
</script>

<template>
    <Combobox v-model="selectedValue" v-model:search-term="searchTerm" v-model:open="isOpen"
        @update:open="handleOpenChange">
        <ComboboxAnchor as-child>
            <div class="relative w-full max-w-sm items-center" style="height: inherit">
                <ComboboxTrigger as-child :tabindex="tabindex">
                    <Button variant="outline" class="w-full justify-between combobox-button text-left"
                        :class="{ 'is-active': isOpen }" @keydown="handleKeyDown">
                        <template v-if="selectedValue">
                            <span>
                                {{ $translate(translatePrefix + selectedValue) }}
                            </span>
                        </template>
                        <template v-else>
                            <span class="placeholder">
                                {{ placeholder }}
                            </span>
                        </template>
                        <ChevronsUpDown class="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </ComboboxTrigger>
            </div>
        </ComboboxAnchor>

        <ComboboxList align="end" side-offset="1" class="w-max min-w-[180px] combobox-list">
            <ComboboxInput
                class="focus-visible:ring-0 focus-visible:ring-offset-0 border-0 rounded-none h-10 w-full search-input"
                :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')" :display-value="() => ''" />

            <ComboboxEmpty>
                {{ $translate('main.SettingSidebar.combobox.noResults') }}
            </ComboboxEmpty>

            <div class="scrollable-content">
            <!-- 分組選項渲染 -->
            <template v-if="Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && options[0].label">
                <ComboboxGroup v-for="group in options" :key="group.label" class="combobox-group">
                    <ComboboxItem v-for="option in group.options" :key="option" :value="option" @select="
                        () => {
                            selectedValue = option;
                            emit('update:modelValue', option);
                        }
                    " class="relative flex items-center whitespace-nowrap">
                        <ComboboxItemIndicator class="absolute left-2">
                            <Check :class="cn('h-4 w-4')" />
                        </ComboboxItemIndicator>
                        <span class="pl-7 pr-4">
                            {{ $translate(translatePrefix + option) }}
                        </span>
                    </ComboboxItem>
                </ComboboxGroup>
            </template>
            <!-- 普通選項渲染（向後兼容） -->
            <ComboboxGroup v-else class="combobox-group">
                <ComboboxItem v-for="option in options" :key="option" :value="option" @select="
                    () => {
                        selectedValue = option;
                        emit('update:modelValue', option);
                    }
                " class="relative flex items-center whitespace-nowrap">
                    <ComboboxItemIndicator class="absolute left-2">
                        <Check :class="cn('h-4 w-4')" />
                    </ComboboxItemIndicator>
                    <span class="pl-7 pr-4">
                        {{ $translate(translatePrefix + option) }}
                    </span>
                </ComboboxItem>
                </ComboboxGroup>
            </div>
        </ComboboxList>
    </Combobox>
</template>

<style lang="scss" scoped>
/* ComboBox 搜索框文字大小 */
.combobox-list :deep(input) {
    font-size: 13px;
}

/* 移除 ComboBox 搜索框的 focus 效果 */
.combobox-list :deep(input:focus-visible) {
    outline: none !important;
    box-shadow: none !important;
}

/* ComboBox 下拉菜單項目文字大小 */
.combobox-group span {
    font-size: 13px;
}

/* ComboBox trigger 按鈕文字大小 */
.combobox-button {
    font-size: 13px;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

/* 空狀態文字大小 */
.combobox-list :deep([data-reka-combobox-empty]) {
    font-size: 13px;
}

/* 滾動內容區域 */
.combobox-list :deep(.scrollable-content) {
    max-height: 240px;
    overflow-y: auto;
}

/* 移除分組分隔線樣式，改用 border-bottom */

.placeholder {
    color: var(--color-text-tertiary);
}

:deep(.search-input::placeholder) {
    color: var(--color-text-tertiary);
}
</style>
