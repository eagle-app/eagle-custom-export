import { ref, reactive, computed, inject, watch } from 'vue';

/**
 * 統一設置狀態管理 - Linus 的設計原則：好的數據結構是關鍵
 * 
 * 取代原本散亂的 20+ 個 ref，用單一響應式對象管理所有設置
 * 消除特殊情況，用配置驅動所有邏輯
 */

// 格式配置 - 消除所有特殊情況判斷的核心數據結構
export const FORMAT_CONFIG = {
  original: { hasQuality: false, hasAnimation: false, extensions: [] },
  jpg: { hasQuality: true, hasAnimation: false, extensions: ['jpg', 'jpeg'] },
  png: { hasQuality: false, hasAnimation: true, extensions: ['png'] },
  webp: { hasQuality: true, hasAnimation: true, extensions: ['webp'] },
  bmp: { hasQuality: false, hasAnimation: false, extensions: ['bmp'] },
  gif: { hasQuality: false, hasAnimation: true, extensions: ['gif'] },
  tif: { hasQuality: false, hasAnimation: false, extensions: ['tif', 'tiff'] },
  avif: { hasQuality: true, hasAnimation: false, extensions: ['avif'] },
  jxl: { hasQuality: true, hasAnimation: false, extensions: ['jxl'] },
  ico: { hasQuality: false, hasAnimation: false, extensions: ['ico'] },
  exr: { hasQuality: false, hasAnimation: false, extensions: ['exr'] },
  hdr: { hasQuality: false, hasAnimation: false, extensions: ['hdr'] },
  tga: { hasQuality: false, hasAnimation: false, extensions: ['tga'] },
  mp4: { hasQuality: true, hasAnimation: true, hasCodec: true, extensions: ['mp4'] },
  webm: { hasQuality: true, hasAnimation: true, hasCodec: true, extensions: ['webm'] }
};

// 驗證規則 - 統一所有數值驗證邏輯
export const VALIDATION_RULES = {
  sizeValue: (v, defaultValue = 900) => Math.max(1, Math.floor(Number(v) || defaultValue)),
  startNumber: (v, defaultValue = 1) => Math.max(1, Math.floor(Number(v) || defaultValue)),
  quality: (v, defaultValue = 100) => Math.max(5, Math.min(100, Math.floor(Number(v) || defaultValue)))
};

// 生成品質選項的工廠函數
const generateQualityOptions = () => {
  const options = [];
  for (let i = 100; i > 0; i -= 5) {
    options.push(i);
  }
  return options;
};

export function useSettingsState() {
  // 注入依賴
  const main = inject('main');
  const updateExportSettings = inject('updateExportSettings');
  const { updateAllTasksNewFormat } = inject('taskManager');

  // 從 localStorage 獲取初始設置
  const localStorageSetting = main?.localStorageSetting || {};

  // 🎯 核心：統一的設置狀態對象 - 替代原本 20+ 個散亂的 ref
  const settingsState = reactive({
    // 格式設置
    format: localStorageSetting?.format || 'jpg',
    quality: localStorageSetting?.quality || 100,
    animatedFps: localStorageSetting?.animatedFps || 30,
    codec: localStorageSetting?.codec || null,

    // 尺寸設置
    sizeType: localStorageSetting?.sizeType || 'original',
    sizeValue: localStorageSetting?.sizeValue || 900,

    // 命名設置
    nameType: localStorageSetting?.nameType || 'original',
    newFileName: localStorageSetting?.newFileName || 'newFileName',
    startNumber: localStorageSetting?.startNumber || 1
  });

  // 選項配置
  const options = {
    formatOptions: [
      {
        label: 'original',
        options: ['original']
      },
      {
        label: 'common',
        options: ['jpg', 'png', 'bmp', 'gif', 'tif', 'ico']
      },
      {
        label: 'nextGen',
        options: ['webp', 'avif']
      },
      {
        label: 'other',
        options: ['hdr', 'exr', 'tga']
      },
      {
        label: 'video',
        options: ['mp4', 'webm']
      }
    ],
    qualityOptions: generateQualityOptions(),
    codecOptions: [
      {
        label: 'mp4',
        options: ['h264', 'h265']
      },
      {
        label: 'webm',
        options: ['vp8', 'vp9']
      }
    ],
    sizeOptions: [
      'original', 'maxWidth', 'maxHeight', 'minWidth',
      'minHeight', 'maxSide', 'minSide'
    ],
    fpsOptions: ['sameAsSource', 5, 10, 12, 15, 20, 23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60]
  };

  // 下拉選單狀態 - 統一管理
  const dropdownStates = ref({
    format: false,
    quality: false,
    size: false,
    fps: false,
    codec: false,
    nameType: false
  });

  // 統一的設置更新方法
  const updateSetting = (key, value) => {
    // 應用驗證規則，優先使用 localStorage 的值作為預設值
    const validator = VALIDATION_RULES[key];
    const defaultValue = localStorageSetting?.[key];
    const validatedValue = validator ? validator(value, defaultValue) : value;

    // 更新狀態
    settingsState[key] = validatedValue;

    // 同步到父組件
    syncToParent();

    // 特殊處理：格式變化時更新任務管理器
    if (key === 'format') {
      updateAllTasksNewFormat(validatedValue);
    }
  };

  // 同步設置到父組件
  const syncToParent = () => {
    if (updateExportSettings) {
      updateExportSettings({
        format: settingsState.format,
        quality: settingsState.quality,
        animatedFps: settingsState.animatedFps,
        codec: settingsState.codec,
        sizeType: settingsState.sizeType,
        sizeValue: settingsState.sizeValue,
        nameType: settingsState.nameType,
        newFileName: settingsState.newFileName,
        startNumber: settingsState.startNumber,
      });
    }
  };

  // 下拉選單狀態管理
  const updateDropdownState = (key, visible) => {
    dropdownStates.value[key] = visible;
  };

  // 數值驗證方法 - 保持與原有邏輯兼容
  const validateNumberValue = (event, fieldType) => {
    const currentValue = event.target.value;
    const numValue = Number(currentValue);

    if (!isNaN(numValue) && currentValue !== '') {
      updateSetting(fieldType, numValue);
      // 強制更新 input 值為驗證後的值（處理 0 和其他無效值的情況）
      if (settingsState[fieldType] !== numValue) {
        event.target.value = settingsState[fieldType];
      }
    } else {
      // 恢復原值
      event.target.value = settingsState[fieldType];
    }
  };

  // 監聽所有設置變化，自動同步
  watch(
    settingsState,
    () => {
      syncToParent();
    },
    { deep: true }
  );

  // 初始同步
  syncToParent();

  return {
    settingsState,
    options,
    dropdownStates,
    updateSetting,
    updateDropdownState,
    validateNumberValue,
    syncToParent
  };
}