<template>
  <div class="export-buttons">
    <!-- 導出按鈕 -->
    <el-button type="primary" class="primary-button" @click="handleExportClick" :tabindex="9" :disabled="isExporting"
      :aria-label="$translate(`main.SettingSidebar.operationMode.${operationMode}`)">
      <!-- 正常狀態顯示操作模式和數量 -->
      <span v-if="!isProcessing" class="button-text">
        {{ $translate(`main.SettingSidebar.operationMode.${operationMode}`) }}
        <span v-if="exportableTaskCount > 0" class="count">({{ exportableTaskCount }})</span>
      </span>
      <!-- 處理中狀態顯示圖標 -->
      <el-icon v-else class="icon icon-processing"></el-icon>
    </el-button>

    <!-- 關閉按鈕 -->
    <el-button @click="handleCloseClick" class="secondary-button" :tabindex="10"
      :aria-label="$translate('main.SettingSidebar.header.close')">
      {{ $translate('main.SettingSidebar.header.close') }}
    </el-button>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';
import { ExportButtonProps, ExportEvents } from './types/ExportTypes.js';

// 獲取全局翻譯函數
const { proxy } = getCurrentInstance();
const $translate = proxy.$translate;

// Props 定義 - 使用標準化接口
const props = defineProps({
  ...ExportButtonProps
});

// Events 定義 - 統一事件名稱
const emit = defineEmits([
  ExportEvents.EXPORT_CLICKED,
  ExportEvents.CLOSE_CLICKED
]);

// 計算屬性 - 消除模板中的複雜邏輯
const isProcessing = computed(() => {
  return props.processingStatus === 'processing';
});

/**
 * 處理導出點擊事件
 * 簡單轉發，不包含業務邏輯
 */
const handleExportClick = () => {
  if (!props.isExporting) {
    emit(ExportEvents.EXPORT_CLICKED);
  }
};

/**
 * 處理關閉點擊事件
 * 簡單轉發，不包含業務邏輯
 */
const handleCloseClick = () => {
  emit(ExportEvents.CLOSE_CLICKED);
};
</script>

<style lang="scss" scoped>
.export-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  padding: 12px;
  height: 60px;
  border-top: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.primary-button {
  width: 70%;

  .icon-processing {
    animation: spin 1s linear infinite;
  }
}

.secondary-button {
  width: 30%;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>