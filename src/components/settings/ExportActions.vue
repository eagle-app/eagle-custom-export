<template>
  <div class="export-actions">
    <!-- 導出按鈕組件 -->
    <ExportButton :is-exporting="exportState.isExporting" :operation-mode="operationMode"
      :exportable-task-count="exportState.exportableTaskCount" :processing-status="main?.status"
      @export-clicked="handleExportClick" @close-clicked="handleCloseClick" />

    <!-- 錯誤和衝突對話框組件 -->
    <ErrorDialogs :error-dialog="errorDialogState" :conflict-dialog="conflictDialogState"
      @error-dismissed="handleErrorDismissed" @conflict-resolved="handleConflictResolved" />

    <!-- 進度對話框組件 -->
    <ProgressDialog :visible="exportState.isExporting" :current-frame="exportState.currentFrame"
      :total-frames="exportState.totalFrames" :progress-percentage="exportState.progressPercentage"
      @progress-cancel="handleProgressCancel" />

    <!-- NotifyVue Component -->
    <NotifyVue ref="notifyVueRef" />

    <!-- 導出流程協調器 -->
    <ExportOrchestrator ref="exportOrchestratorRef" :export-state="exportState" :export-settings="exportSettings"
      :operation-mode="operationMode" @status-changed="handleStatusChanged" @progress-updated="handleProgressUpdated"
      @error-occurred="handleErrorOccurred" @conflict-detected="handleConflictDetected" />
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted, reactive } from 'vue';
import NotifyVue from '@/components/tools/NotifyVue.vue';
import ExportButton from './ExportButton.vue';
import ProgressDialog from './ProgressDialog.vue';
import ErrorDialogs from './ErrorDialogs.vue';
import ExportOrchestrator from './ExportOrchestrator.vue';
import {
  createExportState,
  createErrorState,
  createConflictState,
  ExportStatus,
  ErrorType,
  ConflictAction
} from './types/ExportTypes.js';

// 注入依賴 - 保持與原組件完全一致
const main = inject('main');
const exportSettings = inject('exportSettings');
const { operationMode } = inject('modeManager');
const { tasks, updateTaskStatus } = inject('taskManager');
const triggerExport = inject('triggerExport');

// 組件引用
const notifyVueRef = ref(null);
const exportOrchestratorRef = ref(null);

// 導出狀態管理 - 統一的狀態中心
const exportState = reactive(createExportState());
const errorDialogState = reactive(createErrorState());
const conflictDialogState = reactive(createConflictState());

/**
 * 重置導出狀態 - 好品味：單一函數處理所有重置
 * 消除特殊情況，確保狀態一致性
 */
const resetExportState = () => {
  exportState.currentFrame = 0;
  exportState.totalFrames = 0;
  exportState.progressPercentage = 0;
  exportState.exportStartTime = null;
};

/**
 * 按鈕事件處理
 * 立即重置進度狀態，避免顯示上次的100%
 */
const handleExportClick = () => {
  if (exportOrchestratorRef.value && !exportState.isExporting) {
    // 立即重置進度狀態，消除特殊情況
    resetExportState();
    exportOrchestratorRef.value.executeExport();
  }
};

const handleCloseClick = () => {
  window.close();
};

/**
 * 進度對話框事件處理
 */
const handleProgressCancel = async () => {
  if (exportOrchestratorRef.value) {
    await exportOrchestratorRef.value.cancelExport();
    // 取消時也重置狀態，確保一致性
    resetExportState();
  }
};

/**
 * 錯誤對話框事件處理
 */
const handleErrorDismissed = () => {
  errorDialogState.visible = false;
};

/**
 * 衝突對話框事件處理
 */
const handleConflictResolved = (resolution) => {
  conflictDialogState.visible = false;

  if (conflictDialogState.pendingOperation) {
    if (resolution.cancelled) {
      // 用戶取消不是錯誤，直接 resolve 一個特殊值
      conflictDialogState.pendingOperation.resolve({ cancelled: true });
    } else {
      conflictDialogState.pendingOperation.resolve(resolution.action);
    }
    conflictDialogState.pendingOperation = null;
  }
};

/**
 * 導出狀態變更處理
 * 確保狀態切換時的一致性
 */
const handleStatusChanged = (status) => {
  exportState.isExporting = (status === ExportStatus.EXPORTING);

  // 當導出結束時（完成、取消、錯誤），重置進度狀態
  if (status === ExportStatus.COMPLETED ||
    status === ExportStatus.CANCELLED ||
    status === ExportStatus.ERROR) {
    // 小延遲讓用戶看到100%完成狀態
    setTimeout(() => {
      if (!exportState.isExporting) {
        resetExportState();
      }
    }, 1000);
  }
};

/**
 * 進度更新處理
 */
const handleProgressUpdated = (progress) => {
  // 更新導出狀態
  if (progress.currentFrame !== undefined) {
    exportState.currentFrame = progress.currentFrame;
  }
  if (progress.totalFrames !== undefined) {
    exportState.totalFrames = progress.totalFrames;
  }
  if (progress.progressPercentage !== undefined) {
    exportState.progressPercentage = progress.progressPercentage;
  }
  if (progress.exportStartTime !== undefined) {
    exportState.exportStartTime = progress.exportStartTime;
  }

  // 處理導出完成
  if (progress.completed && progress.summary) {
    const summary = progress.summary;
    const successCount = summary.successfulTasks?.length || 0;

    if (successCount > 0 && notifyVueRef.value) {
      const lastSuccessfulTask = summary.successfulTasks[summary.successfulTasks.length - 1];
      if (lastSuccessfulTask && lastSuccessfulTask.outputPath) {
        notifyVueRef.value.showExportSuccess(
          lastSuccessfulTask.outputPath,
          successCount,
          main.items.length
        );
      }
    }
  }
};

/**
 * 錯誤發生處理
 */
const handleErrorOccurred = (error) => {
  // 用戶取消不是錯誤，不需要顯示對話框
  if (error.type === ErrorType.USER_CANCELLED) {
    resetExportState();
    return;
  }

  // 錯誤發生時重置進度狀態
  resetExportState();

  errorDialogState.visible = true;
  errorDialogState.errorType = error.type || ErrorType.UNKNOWN;
  errorDialogState.errorDescription = error.description || '';
};

/**
 * 衝突檢測處理
 */
const handleConflictDetected = (conflictData) => {
  conflictDialogState.visible = true;
  conflictDialogState.conflictFiles = conflictData.conflictFiles || [];
  conflictDialogState.pendingOperation = {
    resolve: conflictData.resolve,
    reject: conflictData.reject
  };
};

// 計算導出任務數量
const updateExportableTaskCount = () => {
  exportState.exportableTaskCount = tasks.value?.length > 0
    ? tasks.value.filter(task => task.status === 'success' && task.item).length
    : main.items?.length || 0;
};

// 監聽器 - 統一處理
watch(triggerExport, () => !exportState.isExporting && handleExportClick());
watch(tasks, updateExportableTaskCount, { deep: true });
watch(() => main.items, updateExportableTaskCount, { deep: true });

onMounted(() => {
  // 初始化導出任務數量
  updateExportableTaskCount();
});
</script>

<style lang="scss" scoped>
.export-actions {
  display: flex;
  flex-direction: column;
}
</style>