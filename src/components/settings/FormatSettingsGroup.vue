<template>
  <div class="format-settings-group">
    <div class="settings-option">
      <label>{{ $translate('main.SettingSidebar.format.label') }}</label>
      
      <ComboBoxVue 
        :model-value="settingsState.format" 
        @update:model-value="updateSetting('format', $event)"
        :options="options.formatOptions"
        :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')"
        :translate-prefix="'main.SettingSidebar.format.format-options.'" 
        class="settings-combobox"
        @visible-change="(visible) => updateDropdownState('format', visible)" 
        :tabindex="1"
        :aria-label="$translate('main.SettingSidebar.format.label')" 
      />
    </div>
  </div>
</template>

<script setup>
import ComboBoxVue from '@/components/tools/ComboBoxVue.vue';

// Props 接收統一狀態管理
defineProps({
  settingsState: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: true
  },
  updateSetting: {
    type: Function,
    required: true
  },
  updateDropdownState: {
    type: Function,
    required: true
  }
});
</script>

<style lang="scss" scoped>
@use '@styles/partials/settings-common' as *;

.format-settings-group {
  @extend %settings-group-base;
}

// 下拉選單樣式
:deep(.settings-combobox) {
  @extend %settings-combobox-base;
}
</style>