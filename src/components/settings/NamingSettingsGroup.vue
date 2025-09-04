<template>
  <div class="naming-settings-group">
    <!-- 命名類型選擇 -->
    <div class="settings-option">
      <label>{{ $translate('main.SettingSidebar.namingSettings.nameType.label') }}</label>
      
      <ComboBoxVue 
        :model-value="settingsState.nameType" 
        @update:model-value="updateSetting('nameType', $event)"
        :options="['original', 'custom']" 
        class="settings-combobox"
        :translate-prefix="'main.SettingSidebar.namingSettings.nameType.'" 
        :placeholder="$translate('main.SettingSidebar.namingSettings.nameType.searchPlaceholder')"
        :class="dropdownStates.nameType ? 'is-active' : ''"
        @visible-change="(visible) => updateDropdownState('nameType', visible)" 
        :tabindex="6"
        :aria-label="$translate('main.SettingSidebar.namingSettings.nameType.label')" 
      />
    </div>

    <!-- 自定義名稱輸入 -->
    <div class="settings-option" v-if="settingsState.nameType === 'custom'">
      <label for="newNameInput">
        {{ $translate('main.SettingSidebar.namingSettings.customName.label') }}
      </label>
      <input 
        type="text" 
        :value="settingsState.newFileName" 
        @input="updateSetting('newFileName', $event.target.value)"
        id="newNameInput" 
        class="settings-input"
        :tabindex="7" 
      />
    </div>

    <!-- 起始編號設置 -->
    <div class="settings-option" v-if="settingsState.nameType === 'custom'">
      <label>{{ $translate('main.SettingSidebar.namingSettings.startNumber.label') }}</label>
      
      <div class="settings-counter">
        <button 
          class="settings-counter-button settings-counter-button-minus"
          @click="decreaseNumber" 
          :class="{ 'settings-counter-button-disabled': settingsState.startNumber <= 1 }" 
          :aria-label="$translate('main.SettingSidebar.namingSettings.decreaseNumber')"
        >
          <ImageVue name="minus" src="light/base/ic-slide-bar-minus.svg"
            darkSrc="dark/base/ic-slide-bar-minus.svg" />
        </button>
        
        <input 
          type="number" 
          class="settings-counter-display" 
          :value="settingsState.startNumber"
          @blur="(e) => validateNumberValue(e, 'startNumber')" 
          :tabindex="8" 
        />
        
        <button 
          class="settings-counter-button settings-counter-button-plus" 
          @click="increaseNumber"
          :aria-label="$translate('main.SettingSidebar.namingSettings.increaseNumber')"
        >
          <ImageVue name="plus" src="light/base/ic-slide-bar-plus.svg"
            darkSrc="dark/base/ic-slide-bar-plus.svg" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import ComboBoxVue from '@/components/tools/ComboBoxVue.vue';
import ImageVue from '@/components/images/ImageVue.vue';

// Props 接收統一狀態和方法
const props = defineProps({
  settingsState: {
    type: Object,
    required: true
  },
  dropdownStates: {
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
  },
  validateNumberValue: {
    type: Function,
    required: true
  }
});

// 數字控制方法
const increaseNumber = () => {
  props.updateSetting('startNumber', props.settingsState.startNumber + 1);
};

const decreaseNumber = () => {
  if (props.settingsState.startNumber > 1) {
    props.updateSetting('startNumber', props.settingsState.startNumber - 1);
  }
};
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.naming-settings-group {
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

// 計數器樣式
.settings-counter {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-primary);
  border-radius: 6px;
  width: 120px;
  overflow: hidden;
  background: var(--color-white-50);

  @include mixins.dark {
    background: var(--color-black-20);
  }

  .settings-counter-button {
    background: transparent;
    color: var(--color-text-primary);
    border: none;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all var(--animation-normal);

    &:hover:not(.settings-counter-button-disabled) {
      background: var(--color-bg-hover);
    }

    &.settings-counter-button-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.settings-counter-button-minus {
      border-right: 1px solid var(--color-border-primary);
    }

    &.settings-counter-button-plus {
      border-left: 1px solid var(--color-border-primary);
    }
  }

  .settings-counter-display {
    background: transparent;
    color: var(--color-text-primary);
    border: none;
    font-size: 13px;
    text-align: center;
    width: 56px;
    height: 32px;
    margin: 0;
    padding: 0;
    user-select: none;

    &:focus {
      outline: none;
    }

    // 隱藏數字輸入框的調節按鈕
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
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
</style>