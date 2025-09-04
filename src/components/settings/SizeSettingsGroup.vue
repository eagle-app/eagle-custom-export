<template>
  <div class="size-settings-group">
    <!-- 尺寸類型設置 -->
    <div class="settings-option">
      <label>{{ $translate('main.SettingSidebar.size.label') }}</label>
      
      <ComboBoxVue 
        :model-value="settingsState.sizeType" 
        @update:model-value="updateSetting('sizeType', $event)"
        :options="options.sizeOptions"
        :translate-prefix="'main.SettingSidebar.size.size-options.'" 
        class="settings-combobox"
        :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')"
        :class="dropdownStates.size ? 'is-active' : ''"
        @visible-change="(visible) => updateDropdownState('size', visible)" 
        :tabindex="4"
        :aria-label="$translate('main.SettingSidebar.size.label')" 
      />
    </div>

    <!-- 尺寸數值輸入 -->
    <div class="settings-option" v-if="shouldShowSizeInput">
      <label>
        {{ $translate('main.SettingSidebar.size.size-options.' + settingsState.sizeType) }}
      </label>
      <div class="size-input-wrapper">
        <input 
          type="number" 
          :value="settingsState.sizeValue" 
          class="settings-input settings-size-input" 
          @keydown="handleKeydown"
          @blur="(e) => validateNumberValue(e, 'sizeValue')" 
          :tabindex="5" 
          :aria-label="$translate('main.SettingSidebar.size.size-options.' + settingsState.sizeType)" 
        />
        <span class="unit">px</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, watch } from 'vue';
import ComboBoxVue from '@/components/tools/ComboBoxVue.vue';

// Props 接收統一狀態和驗證邏輯
const props = defineProps({
  settingsState: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: true
  },
  dropdownStates: {
    type: Object,
    required: true
  },
  shouldShowSizeInput: {
    type: Boolean,
    required: true
  },
  updateSetting: {
    type: Function,
    required: true
  },
  updateDropdownState: {
    type: Function,
    required: true
  },
  validateNumberValue: {
    type: Function,
    required: true
  }
});

// 防止輸入非法字符
const handleKeydown = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

// 監聽尺寸類型變化，自動 focus 到輸入框
// 保持原有的用戶體驗
watch(() => props.settingsState.sizeType, (newValue) => {
  if (newValue !== 'original') {
    nextTick(() => {
      document.querySelector('.settings-size-input')?.focus();
    });
  }
});
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.size-settings-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 設置選項通用樣式
.settings-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 0 0 4px;
  gap: 8px;

  > label {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
    line-height: 20px;
    min-width: 60px;
    text-align: left;
    user-select: none;
    flex: 0 0 auto;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

// 輸入框樣式
.settings-input {
  height: 32px;
  outline: 1px solid var(--color-border-primary);
  outline-offset: -1px;
  border-radius: 6px;
  padding: 0 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  background: var(--color-white-50);

  @include mixins.dark {
    background: var(--color-black-20);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

// 尺寸輸入包裝器
.size-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 120px;

  .settings-input {
    flex: 1;
    width: 88px;
  }

  .unit {
    font-size: 13px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
}

// 下拉選單樣式
:deep(.settings-combobox) {
  min-width: 120px;
  max-width: 120px;
  height: 32px;

  .combobox-button {
    width: 100%;
    height: 100%;
    background: var(--color-white-50);
    border: none;
    outline: 1px solid var(--color-border-primary);
    outline-offset: -1px;

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  .is-active {
    outline: 1px solid var(--color-primary);
    outline-offset: -1px;
  }
}

// 確保輸入框內數字不會被隱藏
input[type='number'] {
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}
</style>