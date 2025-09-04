<script setup>
import { ref, provide, inject, onMounted } from 'vue';

const isCreatePreset = ref(false);
const isDialogOpen = ref(false);
const containerRef = ref(null);

const main = inject('main');

// 獲取 SettingsSidebar 的容器
onMounted(() => {
    // 找到最近的 settings-sidebar 容器
    const sidebar = document.querySelector('.settings-sidebar');
    if (sidebar) {
        containerRef.value = sidebar;
    }
});

import CustomDialogContent from '@/components/settings/preset/CustomDialogContent.vue';
import PresetSettingsVue from '@/components/settings/preset/presetSettingsVue.vue';
import CommandVue from '@/components/tools/CommandVue.vue';
import ImageVue from '@/components/images/ImageVue.vue';

// 新增編輯模式管理
const editMode = ref(false);
const editingPreset = ref(null);
const editingIndex = ref(-1);

// 設定編輯模式
const setEditMode = (preset, index) => {
    editingPreset.value = preset;
    editingIndex.value = index;
    isCreatePreset.value = true;
    editMode.value = true;
};

// 提供關閉建立面板的方法給子組件
const closeCreatePanel = () => {
    isCreatePreset.value = false;
    editMode.value = false;
    editingPreset.value = null;
    editingIndex.value = -1;
};

// 關閉 Dialog 的方法
const closeDialog = () => {
    if (!isCreatePreset.value) {
        isDialogOpen.value = false;
        closeCreatePanel();
    }
};

// 提供給子組件
provide('closeCreatePanel', closeCreatePanel);
provide('setEditMode', setEditMode);
provide('editMode', editMode);
provide('editingPreset', editingPreset);
provide('editingIndex', editingIndex);
provide('closeDialog', closeDialog);
provide('isCreatePreset', isCreatePreset);

</script>

<template>

    <!-- 觸發按鈕 -->
    <button class="header-button" :class="{ 'is-active': isDialogOpen }" @click="isDialogOpen = true" v-tippy="{
        content: $translate('main.SettingSidebar.preset.dialog.tooltipTitle'),
        placement: 'bottom',
        delay: [200, 0],
        duration: [150, 0]
    }">
        <el-icon class="icon icon-export-preset"></el-icon>
    </button>

    <!-- 自定義 Dialog -->
    <CustomDialogContent v-model="isDialogOpen" :container="containerRef" class="preset-dialog">

        <div class="dialog-body">
            <template v-if="isCreatePreset">
                <PresetSettingsVue />
            </template>

            <template v-if="!main?.localStorageSetting?.preset?.length && !isCreatePreset">
                <ImageVue :darkSrc="`dark/preset-empty.png`" :src="`light/preset-empty.png`" />

                <div class="empty-state-text">
                    <span class="title">{{ $translate('main.SettingSidebar.preset.dialog.emptyTitle') }}</span>
                    <span class="subtitle">{{ $translate('main.SettingSidebar.preset.dialog.emptyDescription') }}</span>
                </div>

                <el-button type="primary" @click="isCreatePreset = true" :tabindex="9" class="create-preset-button"
                    :aria-label="$translate(`main.SettingSidebar.operationMode.${operationMode}`)">
                    <el-icon class="icon-btn-plus"></el-icon>
                    <span>
                        {{ $translate('main.SettingSidebar.preset.dialog.createButton') }}
                    </span>
                </el-button>
            </template>

            <template v-if="main?.localStorageSetting?.preset?.length && !isCreatePreset">
                <CommandVue />
            </template>
        </div>
    </CustomDialogContent>

</template>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.preset-dialog {
    padding: 0;
}

.dialog-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border-primary);

    .dialog-title {
        font-size: 16px;
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0;
    }
}

.dialog-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.preset-list {
    width: 100%;
}

.create-preset-button {
    margin-bottom: 12px;
    width: 230px;

    span {
        margin: 0px;
    }
}

.empty-state-text {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .title {
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0;
        line-height: 24px;
    }

    .subtitle {
        font-size: 12px;
        color: var(--color-text-secondary);
        opacity: 0.6;
        margin: 0;
        line-height: 18px;
        width: 230px;
    }
}
</style>