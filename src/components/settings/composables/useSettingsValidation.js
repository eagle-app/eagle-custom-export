import { computed, inject } from 'vue';
import { FORMAT_CONFIG } from './useSettingsState.js';

/**
 * 統一驗證系統 - 消除所有特殊情況邏輯
 * 
 * 取代原本的 showQualityOption、showFpsOption 等 computed
 * 用配置驅動的方式統一所有顯示/隱藏邏輯
 */

export function useSettingsValidation(settingsState) {
  // 注入任務管理器
  const { tasks } = inject('taskManager');

  // 🎯 核心：配置驅動的顯示邏輯 - 消除特殊情況
  const shouldShowQuality = computed(() => {
    const config = FORMAT_CONFIG[settingsState.format];
    return config?.hasQuality ?? false;
  });

  const shouldShowFps = computed(() => {
    const config = FORMAT_CONFIG[settingsState.format];
    if (!config?.hasAnimation) return false;

    const isAnimatedFormat = ['png', 'webp', 'gif', 'mp4', 'webm', 'mov', 'm4v', 'mkv'];

    // 檢查是否有動畫文件 - 保持原有邏輯
    return tasks.value.some(
      (task) => isAnimatedFormat.includes(task.item?.ext)
    );
  });

  const shouldShowSizeInput = computed(() => {
    return settingsState.sizeType !== 'original';
  });

  const shouldShowCodec = computed(() => {
    const config = FORMAT_CONFIG[settingsState.format];
    return config?.hasCodec ?? false;
  });

  // 預設表單驗證
  const validatePresetForm = (presetData) => {
    const { name, format, quality, animatedFps, sizeType } = presetData;

    // 基本必填驗證
    if (!name || !format || !sizeType) {
      return false;
    }

    // 配置驅動的條件驗證
    const config = FORMAT_CONFIG[format];
    if (config?.hasQuality && !quality) {
      return false;
    }

    if (config?.hasAnimation && shouldShowFps.value && !animatedFps) {
      return false;
    }

    return true;
  };

  // 格式特定的配置獲取
  const getFormatConfig = (format) => {
    return FORMAT_CONFIG[format] || FORMAT_CONFIG.original;
  };

  // 支援的格式檢查
  const isSupportedFormat = (format) => {
    return Object.keys(FORMAT_CONFIG).includes(format);
  };

  // 動畫格式檢查
  const isAnimatedFormat = (format) => {
    return FORMAT_CONFIG[format]?.hasAnimation ?? false;
  };

  // 有損格式檢查（需要品質設置）
  const isLossyFormat = (format) => {
    return FORMAT_CONFIG[format]?.hasQuality ?? false;
  };

  return {
    shouldShowQuality,
    shouldShowFps,
    shouldShowCodec,
    shouldShowSizeInput,
    validatePresetForm,
    getFormatConfig,
    isSupportedFormat,
    isAnimatedFormat,
    isLossyFormat
  };
}