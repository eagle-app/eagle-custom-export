<template>
  <div class="export-orchestrator">
    <!-- 純邏輯組件，不渲染 UI -->
  </div>
</template>

<script setup>
import { ref, inject, onUnmounted } from 'vue';
import { 
  ExportOrchestratorProps, 
  ExportEvents, 
  ExportStatus,
  ErrorType,
  ConflictAction
} from './types/ExportTypes.js';
import { 
  convertSettings, 
  getOutputPath, 
  checkFileConflicts,   
} from './utils/ExportUtils.js';
import { 
  createTaskStateUpdater, 
  createSettingsSaver, 
  createExportCallbacks 
} from './utils/ExportCallbacks.js';

// Props 定義
const props = defineProps({
  ...ExportOrchestratorProps
});

// Events 定義
const emit = defineEmits([
  ExportEvents.STATUS_CHANGED,
  ExportEvents.PROGRESS_UPDATED,
  ExportEvents.ERROR_OCCURRED,
  ExportEvents.CONFLICT_DETECTED
]);

// 注入依賴
const main = inject('main');
const exportSettings = inject('exportSettings');
const { operationMode } = inject('modeManager');
const { updateTaskStatus, updateTaskNewFormat, tasks, pauseAllTasks } = inject('taskManager');

// 內部狀態
const batchConflictAction = ref(null);

/**
 * 處理文件衝突
 * 簡化的控制流，消除特殊情況
 */
const handleFileConflicts = async (items, outputPath, settings, conflictAction = ConflictAction.ASK) => {
  // 替換模式：直接執行，無衝突檢查
  if (operationMode.value === 'replace') {
    emit(ExportEvents.STATUS_CHANGED, ExportStatus.EXPORTING);
    return await main.convertBatch(items, outputPath, settings);
  }

  // 檢查衝突
  const conflicts = await checkFileConflicts(items, outputPath, settings);
  const action = batchConflictAction.value || conflictAction;
  
  // 統一的設置處理
  const createSettings = (additionalProps = {}) => ({
    ...settings,
    runtimeConflictAction: action === ConflictAction.ASK ? null : action,
    keepBothMode: action === ConflictAction.KEEP_BOTH,
    ...additionalProps
  });

  // 無衝突或已決定動作：直接執行
  if (conflicts.length === 0 || action !== ConflictAction.ASK) {
    emit(ExportEvents.STATUS_CHANGED, ExportStatus.EXPORTING);
    return await main.convertBatch(items, outputPath, createSettings());
  }

  // 需要用戶決策：發送衝突事件
  return new Promise((resolve, reject) => {
    emit(ExportEvents.CONFLICT_DETECTED, {
      conflictFiles: conflicts,
      resolve: async (userAction) => {
        try {
          // 檢查用戶是否取消
          if (userAction && userAction.cancelled) {
            cleanup();
            resolve(); // 用戶取消不是錯誤，直接 resolve
            return;
          }
          
          batchConflictAction.value = userAction;
          const result = await handleFileConflicts(items, outputPath, settings, userAction);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      reject
    });
  });
};

// 工具函數實例
const updateTaskStates = createTaskStateUpdater(tasks, updateTaskStatus);
const saveSettings = createSettingsSaver(exportSettings, main, convertSettings);
const createBatchCallbacks = () => createExportCallbacks(emit, cleanup, updateTaskStates, saveSettings);

/**
 * 清理資源
 */
const cleanup = () => {
  batchConflictAction.value = null;
};

/**
 * 主要導出處理函數 - 簡潔版本
 */
const executeExport = async () => {
  try {
    // 初始化 - 使用 tasks 作為單一事實來源
    const validTasks = tasks.value.filter(task => 
      task.item && 
      task.status !== 'failed' && 
      task.isFormatSupported !== false
    );
    
    if (validTasks.length === 0) {
      throw new Error(i18next.t('error.noItemsSelected'));
    }

    const startTime = Date.now();
    emit(ExportEvents.PROGRESS_UPDATED, {
      currentFrame: 0,
      totalFrames: validTasks.length,
      exportStartTime: startTime,      
    });    

    // 準備設置和路徑 - 使用 Eagle 格式的 items 用於路徑計算
    const eagleItems = validTasks.map(task => task.item);
    const outputPath = await getOutputPath(eagleItems, operationMode.value);
    
    // 如果用戶取消選擇文件夾，直接返回（不是錯誤）
    if (outputPath === null) {
      cleanup();
      return;
    }
    
    const settings = {
      ...convertSettings(exportSettings.value),
      isReplaceMode: operationMode.value === 'replace',
      callbacks: createBatchCallbacks()
    };

    // 更新任務格式並準備轉換用的 items
    const items = validTasks.map(task => {
      updateTaskNewFormat(task.id, settings.format);
      return task.item; // 返回 Eagle 格式給轉換器
    });    

    // 執行導出
    await handleFileConflicts(items, outputPath, settings);
    
  } catch (error) {
    cleanup();
    
    // 用戶取消不是錯誤，直接返回不發送錯誤事件
    if (error.message.includes('userCanceled') || error.message.includes('User cancelled')) {
      return;
    }
    
    emit(ExportEvents.ERROR_OCCURRED, {
      type: ErrorType.UNKNOWN,
      description: error.message
    });
  }
};

/**
 * 取消導出
 */
const cancelExport = async () => {
  if (main.cancelConversion) main.cancelConversion();
  
  // 重置所有處理中的任務狀態為等待中
  if (pauseAllTasks) {
    await pauseAllTasks();
  }
  
  cleanup();
  emit(ExportEvents.STATUS_CHANGED, ExportStatus.CANCELLED);
};

// 暴露方法
defineExpose({
  executeExport,
  cancelExport,
  setBatchConflictAction: (action) => { batchConflictAction.value = action; },
  clearBatchConflictAction: () => { batchConflictAction.value = null; }
});

onUnmounted(cleanup);
</script>

<style lang="scss" scoped>
.export-orchestrator {
  // 純邏輯組件，不需要樣式
  display: none;
}
</style>