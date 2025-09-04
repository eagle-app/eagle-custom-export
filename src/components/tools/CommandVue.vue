<script setup>
import { ref, inject, watch, getCurrentInstance } from 'vue'

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'

// 獲取全局屬性
const { proxy } = getCurrentInstance();
const $translate = proxy?.$translate;

const main = inject('main');
const settingsState = inject('settingsState', null);

// 注入來自 presetPopoverVue 的方法（提供默認值以防止錯誤）
const setEditMode = inject('setEditMode', null);
const closeDialog = inject('closeDialog', null);
const isCreatePreset = inject('isCreatePreset', null);

const presetList = ref(main.localStorageSetting.preset || []);

// 監聽 localStorage 變化
watch(() => main.localStorageSetting.preset, (newPresets) => {
    presetList.value = newPresets || [];
}, { deep: true });

// 為每個 preset 建立獨立的開啟狀態
const openStates = ref({});

// 安全的 localStorage 操作
const safeGetLocalStorage = () => {
    try {
        return JSON.parse(localStorage.getItem(main.localStorageKey) || '{}');
    } catch (error) {
        console.error('Failed to parse localStorage:', error);
        return { preset: [] };
    }
};

const safeSetLocalStorage = (settings) => {
    try {
        localStorage.setItem(main.localStorageKey, JSON.stringify(settings));
        main.localStorageSetting = settings;
        presetList.value = settings.preset || [];
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        alert($translate('main.SettingSidebar.preset.error.saveFailed'));
        return false;
    }
};

// 套用預設參數
const handleApplyPreset = (preset) => {

    settingsState.format = preset.format;
    settingsState.quality = preset.quality;
    settingsState.sizeType = preset.sizeType;
    settingsState.sizeValue = preset.sizeValue;
    settingsState.animatedFps = preset.animatedFps;
    settingsState.codec = preset.codec;

    // 關閉 popover
    if (closeDialog) closeDialog();
};

// 處理編輯
const handleEdit = (preset, index) => {

    if (index < 0 || index >= presetList.value.length) {
        console.error('Invalid preset index:', index);
        return;
    }

    const editingPreset = { ...preset };
    const editingIndex = index;

    // 通知 presetPopoverVue 切換到編輯模式
    if (setEditMode) {
        setEditMode(editingPreset, editingIndex);
    } else {
        console.error('setEditMode not found in injection');
    }
};

// 處理克隆
const handleClone = (preset, index) => {
    const existingSettings = safeGetLocalStorage();

    if (!existingSettings.preset) {
        existingSettings.preset = [];
    }

    // 建立克隆的預設（確保唯一 ID）
    const clonedPreset = {
        ...preset,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${preset.name}`,
        createdAt: new Date().toISOString()
    };

    // 在指定位置插入（原預設的下一個位置）
    const targetIndex = Math.min(index + 1, existingSettings.preset.length);
    existingSettings.preset.splice(targetIndex, 0, clonedPreset);

    safeSetLocalStorage(existingSettings);
};

// 處理移除
const handleRemove = (preset, index) => {
    const existingSettings = safeGetLocalStorage();

    if (!existingSettings.preset || existingSettings.preset.length === 0) {
        return;
    }

    // 移除指定預設
    existingSettings.preset.splice(index, 1);

    safeSetLocalStorage(existingSettings);
};

// 程式化開啟特定 preset 的 context menu
const openContextMenu = (presetId, event) => {
    event.stopPropagation(); // 防止事件冒泡
    event.preventDefault();

    // 建立並觸發一個合成的右鍵事件
    const target = event.currentTarget.closest('.command-item');
    if (target) {
        const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: event.clientX,
            clientY: event.clientY,
        });
        target.dispatchEvent(contextMenuEvent);
    }
};

</script>

<template>
    <Command class="rounded-lg shadow-md max-w-[450px] command-wrapper">
        <CommandInput :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')"
            class="command-input" />
        <CommandList class="overflow-y-hidden">

            <CommandEmpty>{{ $translate('main.SettingSidebar.preset.command.noResults') }}</CommandEmpty>

            <CommandGroup class="presets-group">

                <ContextMenu v-for="(preset, index) in presetList" :key="preset.id"
                    v-model:open="openStates[preset.id]">

                    <ContextMenuTrigger as-child>
                        <CommandItem @click="handleApplyPreset(preset)" class="command-item">
                            <span>{{ preset.name }}</span>
                            <el-icon class="icon icon-more" @click="openContextMenu(preset.id, $event)"></el-icon>
                        </CommandItem>
                    </ContextMenuTrigger>

                    <ContextMenuContent class="context-menu-content">
                        <ContextMenuItem @click="handleEdit(preset, index)" class="context-menu-item">
                            <el-icon class="icon-edit"></el-icon>
                            {{ $translate('main.SettingSidebar.preset.command.edit') }}
                        </ContextMenuItem>
                        <ContextMenuSeparator class="context-menu-separator" />
                        <ContextMenuItem @click="handleClone(preset, index)" class="context-menu-item">
                            <el-icon class="icon-clone"></el-icon>
                            {{ $translate('main.SettingSidebar.preset.command.clone') }}
                        </ContextMenuItem>
                        <ContextMenuItem @click="handleRemove(preset, index)" class="context-menu-item">
                            <el-icon class="icon-remove"></el-icon>
                            {{ $translate('main.SettingSidebar.preset.command.remove') }}
                        </ContextMenuItem>
                    </ContextMenuContent>

                </ContextMenu>

            </CommandGroup>

            <CommandSeparator class="command-separator" />

            <CommandGroup class="shrink-0">

                <CommandItem class="new-preset-section command-item" @click="isCreatePreset = true">
                    <el-icon class="icon-plus"></el-icon>
                    <span v-if="main?.status !== 'processing'">
                        {{ $translate('main.SettingSidebar.preset.command.createPreset') }}
                        <span v-if="exportableTaskCount > 0" class="count">({{ exportableTaskCount }})</span>
                    </span>
                </CommandItem>

            </CommandGroup>
        </CommandList>

    </Command>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.command-wrapper {
    background: var(--color-bg-primary);

    .command-input::placeholder {
        color: var(--color-text-tertiary);
    }

    .presets-group {
        overflow-y: auto;
        max-height: 200px;
        padding: 8px;
        display: grid;
        gap: 2px;
    }
}

.command-separator {
    background: var(--color-border-secondary);
}

.command-item {
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 6px;
    padding-right: 4px;
    font-size: 13px;

    &:hover {
        background: var(--color-bg-hover);
    }

    &[data-highlighted] {
        background: var(--color-bg-hover);
    }
}

.button-more {
    border-radius: 4px;

    &:hover {
        background: var(--color-bg-hover);
    }
}

.icon-more {
    opacity: 0.8;

    &:hover {
        opacity: 1;
    }
}

.icon-remove {
    width: 16px !important;
    height: 16px !important;
}

.new-preset-section {
    margin: 8px;
    height: 32px;
    justify-content: flex-start;

    .new-preset-button {
        width: 100%;
    }
}

:has(.context-menu-content) {
    border-radius: 8px;
}

.context-menu-content {
    background: var(--box-background);
    box-shadow: var(--box-border-shadow);
    border-top: var(--box-border-top);
    border-left: var(--box-border-left);
    border-right: var(--box-border-right);
    border-bottom: var(--box-border-bottom);
    backdrop-filter: var(--box-background-blur);
    padding: 4px;
    font-size: 13px;

    .context-menu-separator {
        background: var(--color-border-secondary);
        margin: 4px 0;
    }

    .context-menu-item {
        font-size: 13px;
        padding: 0px 6px;
        height: 26px;
        gap: 6px;

        &:hover {
            background: var(--color-bg-hover);
        }

        &[data-highlighted] {
            background: var(--color-bg-hover);
        }
    }
}
</style>