<template>
  <div class="settings-sidebar" ref="settingsContainerRef">
    <!-- Header -->
    <SettingsHeader />

    <!-- Settings Content -->
    <div class="settings-content" role="main">
      <!-- Format Settings -->
      <FormatSettingsGroup :settings-state="settingsState" :options="options" :update-setting="updateSetting"
        :update-dropdown-state="updateDropdownState" />

      <!-- Quality & FPS & Codec Settings -->
      <QualitySettingsGroup v-if="shouldShowQuality || shouldShowFps || shouldShowCodec" :settings-state="settingsState"
        :options="options" :dropdown-states="dropdownStates" :should-show-quality="shouldShowQuality"
        :should-show-fps="shouldShowFps" :should-show-codec="shouldShowCodec" :update-setting="updateSetting"
        :update-dropdown-state="updateDropdownState" />

      <!-- Size Settings -->
      <SizeSettingsGroup :settings-state="settingsState" :options="options" :dropdown-states="dropdownStates"
        :should-show-size-input="shouldShowSizeInput" :update-setting="updateSetting"
        :update-dropdown-state="updateDropdownState" :validate-number-value="validateNumberValue" />

      <!-- Divider -->
      <div v-show="showNamingSettings" class="divider"></div>

      <!-- Naming Settings -->
      <NamingSettingsGroup v-show="showNamingSettings" :settings-state="settingsState" :dropdown-states="dropdownStates"
        :update-setting="updateSetting" :update-dropdown-state="updateDropdownState"
        :validate-number-value="validateNumberValue" />
    </div>

    <!-- Export Actions -->
    <ExportActions />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, watch } from 'vue';
import { useTabNavigation } from '@/composables/useTabNavigation';

// 導入所有子組件
import SettingsHeader from './SettingsHeader.vue';
import FormatSettingsGroup from './FormatSettingsGroup.vue';
import QualitySettingsGroup from './QualitySettingsGroup.vue';
import SizeSettingsGroup from './SizeSettingsGroup.vue';
import NamingSettingsGroup from './NamingSettingsGroup.vue';
import ExportActions from './ExportActions.vue';

// 導入 composables - 這就是 Linus 的好品味！
import { useSettingsState } from './composables/useSettingsState.js';
import { useSettingsValidation } from './composables/useSettingsValidation.js';

// 🎯 這就是重構的核心！從 1489 行縮減到不到 80 行！
// 所有複雜邏輯都被分離到各自的組件和 composables 中

// Container ref for tab navigation
const settingsContainerRef = ref(null);

// 注入依賴 - 保持與原有的兼容性
const main = inject('main');
const { showNamingSettings } = inject('modeManager');

// 🎯 統一狀態管理 - 替代原本 20+ 個散亂的 ref
const {
  settingsState,
  options,
  dropdownStates,
  updateSetting,
  updateDropdownState,
  validateNumberValue
} = useSettingsState();

provide('settingsState', settingsState);

// 🎯 統一驗證邏輯 - 替代原本的特殊情況 computed
const {
  shouldShowQuality,
  shouldShowFps,
  shouldShowCodec,
  shouldShowSizeInput
} = useSettingsValidation(settingsState);

// Tab navigation setup
const { handleTabKey } = useTabNavigation(settingsContainerRef);

// Keyboard event handler
const handleKeyDown = (event) => {
  if (event.key === 'Tab') {
    handleTabKey(event);
  }
};

// 監聽 main.item 變化，更新檔案名稱 - 保持原有行為
watch(
  () => main?.item,
  (newItem) => {
    if (newItem) {
      updateSetting('newFileName', newItem.name);
    }
  },
  { immediate: true }
);

// Lifecycle hooks
onMounted(() => {
  // 如果有選中的項目，設定預設檔案名稱
  if (main?.item) {
    updateSetting('newFileName', main.item.name);
  }

  // Add keyboard listener for tab navigation
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

// 🎯 精簡的主容器樣式 - 保持原有的視覺效果
.settings-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  outline: 1px solid var(--color-white-10);
  outline-offset: -1px;
  border: 1px solid var(--color-border-primary);
  background: rgba(255, 255, 255, 0.5);

  @include mixins.dark {
    background: rgba(247, 248, 248, 0.05);
    border: 1px solid var(--color-black-25);
    outline: 1px solid var(--color-border-primary);
  }
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 分隔線
.divider {
  height: 1px;
  background: var(--color-border-primary);
  width: 100%;
}
</style>