/**
 * 導出組件共享類型定義
 * 
 * 這個文件定義了 ExportActions 相關組件之間的數據接口
 * 遵循 "好品味" 原則：清晰的數據結構消除特殊情況
 */

// 導出狀態枚舉
export const ExportStatus = {
  IDLE: 'idle',
  EXPORTING: 'exporting',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ERROR: 'error'
};

// 錯誤類型枚舉
export const ErrorType = {
  UNKNOWN: 'unknownError',
  NO_ITEMS: 'noItemsSelected',
  USER_CANCELLED: 'userCanceled',
  INVALID_PATH: 'cannotDetermineSourcePath',
  CONVERSION_FAILED: 'conversionFailed'
};

// 衝突處理動作枚舉
export const ConflictAction = {
  ASK: 'ask',
  REPLACE: 'replace',
  KEEP_BOTH: 'keepBoth'
};

// 對話框類型枚舉
export const DialogType = {
  INFO: 'info',
  ERROR: 'error',
  WARNING: 'warning',
  CONFIRM: 'warning'
};

/**
 * 導出狀態接口
 * 核心狀態數據，所有組件的單一事實來源
 */
export const createExportState = () => ({
  status: ExportStatus.IDLE,
  isExporting: false,
  currentFrame: 0,
  totalFrames: 0,
  progressPercentage: 0,
  exportStartTime: null,
  exportableTaskCount: 0
});

/**
 * 錯誤狀態接口
 */
export const createErrorState = () => ({
  visible: false,
  type: DialogType.ERROR,
  errorType: ErrorType.UNKNOWN,
  errorDescription: '',
  ok: () => { }
});

/**
 * 進度對話框狀態接口
 */
export const createProgressState = () => ({
  visible: false
});

/**
 * 文件衝突對話框狀態接口
 */
export const createConflictState = () => ({
  visible: false,
  type: DialogType.CONFIRM,
  conflictFiles: [],
  pendingOperation: null,
  cancel: () => { },
  replace: () => { },
  keepBoth: () => { }
});

/**
 * 衝突文件信息接口
 */
export const createConflictFile = (originalFile, outputFile, fileName, itemName) => ({
  originalFile,
  outputFile,
  fileName,
  itemName
});

/**
 * 導出設置接口
 * 轉換後的標準化設置格式
 */
export const createExportSettings = (settings = {}) => ({
  format: settings.format || 'png',
  quality: settings.quality || 80,
  animatedFps: settings.animatedFps || 30,
  codec: settings.codec || null,
  exportType: settings.exportType || 'current',
  sizeType: settings.sizeType || 'original',
  sizeValue: settings.sizeValue || 100,
  nameType: settings.nameType || 'original',
  newFileName: settings.newFileName || '',
  startNumber: settings.startNumber || 1,
  exportCount: settings.exportCount || 0,
  isReplaceMode: settings.isReplaceMode || false,
  runtimeConflictAction: settings.runtimeConflictAction || null,
  keepBothMode: settings.keepBothMode || false
});

/**
 * 導出回調接口
 * 統一的事件處理接口，消除特殊情況
 */
export const createExportCallbacks = () => ({
  onTaskComplete: (result) => { },
  onProgress: (progress) => { },
  onError: (error) => { },
  onCancelled: (summary) => { },
  onComplete: (summary) => { }
});

/**
 * 導出事件枚舉
 * 組件間通訊的標準事件名稱
 */
export const ExportEvents = {
  // 按鈕事件
  EXPORT_CLICKED: 'export-clicked',
  CLOSE_CLICKED: 'close-clicked',

  // 進度事件
  PROGRESS_CANCEL: 'progress-cancel',

  // 錯誤事件
  ERROR_OCCURRED: 'error-occurred',
  ERROR_DISMISSED: 'error-dismissed',

  // 衝突事件
  CONFLICT_DETECTED: 'conflict-detected',
  CONFLICT_RESOLVED: 'conflict-resolved',

  // 狀態變更事件
  STATUS_CHANGED: 'status-changed',
  PROGRESS_UPDATED: 'progress-updated'
};

/**
 * 組件 Props 接口定義
 */
export const ExportButtonProps = {
  isExporting: { type: Boolean, default: false },
  operationMode: { type: String, default: 'export' },
  exportableTaskCount: { type: Number, default: 0 },
  processingStatus: { type: String, default: null }
};

export const ProgressDialogProps = {
  visible: { type: Boolean, default: false },
  currentFrame: { type: Number, default: 0 },
  totalFrames: { type: Number, default: 0 },
  progressPercentage: { type: Number, default: 0 },
};

export const ErrorDialogsProps = {
  errorDialog: { type: Object, required: true },
  conflictDialog: { type: Object, required: true }
};

export const ExportOrchestratorProps = {
  exportState: { type: Object, required: true },
  exportSettings: { type: Object, required: true },
  operationMode: { type: String, default: 'export' }
};