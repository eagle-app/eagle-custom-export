/**
 * 導出回調工具函數
 * 
 * 將複雜的回調邏輯從組件中提取出來
 * 遵循 Linus 原則：每個函數只做一件事
 */

import { ExportEvents, ExportStatus } from '../types/ExportTypes.js';

/**
 * 創建任務狀態更新器
 */
export const createTaskStateUpdater = (tasks, updateTaskStatus) => {
  return (summary) => {
    // 更新成功任務
    summary.successfulTasks?.forEach((result) => {
      if (result.success) {
        const task = tasks.value.find((t) => t.item?.filePath === result.src);
        if (task && task.status !== 'success') {
          updateTaskStatus(task.id, 'success', 100);
        }
      }
    });

    // 更新失敗任務
    summary.failedTasks?.forEach((error) => {
      const task = tasks.value.find((t) => t.filePath === error.src);
      if (task && task.status !== 'failed') {
        updateTaskStatus(task.id, 'failed', 0, error.error);
      }
    });
  };
};

/**
 * 創建設置保存器
 */
export const createSettingsSaver = (exportSettings, main, convertSettings) => {
  return () => {
    const settingsToSave = {
      ...convertSettings(exportSettings.value),
      preset: main.localStorageSetting.preset
    };
    localStorage.setItem(main.localStorageKey, JSON.stringify(settingsToSave));
  };
};

/**
 * 創建導出回調工廠
 * 統一生成所有回調函數
 * 確保所有進度數據的一致性更新
 */
export const createExportCallbacks = (emit, cleanup, updateTaskStates, saveSettings) => ({
  onTaskComplete: (result) => {
    // 通知進度更新，確保包含所有必要數據
    emit(ExportEvents.PROGRESS_UPDATED, {
      currentFrame: result.currentFrame || 0,
      totalFrames: result.totalFrames || 0,
      progressPercentage: result.totalFrames > 0
        ? Math.round(((result.currentFrame || 0) / result.totalFrames) * 100)
        : 0
    });
  },

  onProgress: (progress) => {
    emit(ExportEvents.PROGRESS_UPDATED, { progressPercentage: progress });
  },

  onError: (error) => {
    const errorMessage = Object.entries(error).map(([key, value]) => `${key}: ${value}`).join(', ');
    console.error('Task failed:', errorMessage);
  },

  onCancelled: (summary) => {
    emit(ExportEvents.STATUS_CHANGED, ExportStatus.CANCELLED);
    cleanup();
  },

  onComplete: (summary) => {
    updateTaskStates(summary);
    saveSettings();
    emit(ExportEvents.STATUS_CHANGED, ExportStatus.COMPLETED);
    emit(ExportEvents.PROGRESS_UPDATED, { completed: true, summary });
    cleanup();
  }
});