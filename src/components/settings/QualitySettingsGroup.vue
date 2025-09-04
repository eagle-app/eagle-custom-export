<template>
  <div class="quality-settings-group">
    <!-- 品質設置 -->
    <div class="settings-option" v-if="shouldShowQuality">
      <label>{{ $translate('main.SettingSidebar.quality.label') }}</label>

      <ComboBoxVue :model-value="settingsState.quality" @update:model-value="updateSetting('quality', $event)"
        :options="options.qualityOptions" class="settings-combobox"
        :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')"
        :class="dropdownStates.quality ? 'is-active' : ''"
        @visible-change="(visible) => updateDropdownState('quality', visible)" :tabindex="2"
        :aria-label="$translate('main.SettingSidebar.quality.label')" />
    </div>

    <!-- FPS 設置（動畫格式） -->
    <div class="settings-option" v-if="shouldShowFps">
      <label>{{ $translate('main.SettingSidebar.fps.label') }}</label>

      <ComboBoxVue :model-value="settingsState.animatedFps" @update:model-value="updateSetting('animatedFps', $event)"
        :options="options.fpsOptions" class="settings-combobox"
        :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')"
        :translate-prefix="'main.SettingSidebar.fps.fps-options.'"
        :class="dropdownStates.fps ? 'is-active' : ''"
        @visible-change="(visible) => updateDropdownState('fps', visible)" :tabindex="3" />
    </div>

    <!-- Codec 設置 -->
    <div class="settings-option" v-if="shouldShowCodec">
      <label>{{ $translate('main.SettingSidebar.codec.label') }}</label>

      <ComboBoxVue :model-value="defaultCodec" @update:model-value="updateSetting('codec', $event)"
        :options="codecOptionsList" class="settings-combobox"
        :placeholder="$translate('main.SettingSidebar.combobox.searchPlaceholder')"
        :translate-prefix="'main.SettingSidebar.codec.codec-options.'" :class="dropdownStates.codec ? 'is-active' : ''"
        @visible-change="(visible) => updateDropdownState('codec', visible)" :tabindex="4" />
    </div>
  </div>
</template>

<script setup>
import ComboBoxVue from '@/components/tools/ComboBoxVue.vue';

const settingsState = inject('settingsState');

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
  shouldShowQuality: {
    type: Boolean,
    required: true
  },
  shouldShowFps: {
    type: Boolean,
    required: true
  },
  shouldShowCodec: {
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
  }
});

// 先定義函數
const getCodecOptions = (settingsState, options) => {
  return options.codecOptions.find(option => option.label === settingsState.format)?.options || [];
}

const getDefaultCodec = (settingsState, options) => {
  const codecOptionsList = getCodecOptions(settingsState, options);
  if (codecOptionsList.includes(settingsState.codec)) {
    return settingsState.codec;
  }
  settingsState.codec = codecOptionsList[0];
  return codecOptionsList[0];
}

// 使用 computed 建立響應式變數
const codecOptionsList = computed(() => {
  return getCodecOptions(settingsState, props.options);
});

const defaultCodec = computed(() => {
  return getDefaultCodec(settingsState, props.options);
});

// 當 format 改變時，重設 codec 為新格式的預設值
watch(() => settingsState.format, () => {
  codecOptionsList.value = getCodecOptions(settingsState, props.options);
  defaultCodec.value = getDefaultCodec(settingsState, props.options);
});

</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.quality-settings-group {
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

  >label {
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