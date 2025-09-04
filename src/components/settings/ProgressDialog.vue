<template>
  <!-- Progress overlay with custom progress bar -->
  <div v-if="visible" class="progress-dialog-wrapper">
    <!-- Full-screen semi-transparent overlay -->
    <div class="overlay" @click="handleOverlayClick"></div>

    <!-- Custom progress container matching Figma design -->
    <div class="progress-container">
      <div class="progress-box">
        <!-- Progress text -->
        <div class="progress-text">
          {{ $translate('main.progressDialog.title') }}
          <span class="progress-info">{{ progressInfo }}</span>

          <!-- ETA -->
          <EtaComponent :curr="currentFrame" :total="totalFrames" :interval="500" />
        </div>

        <!-- Progress bar -->
        <div class="progress-bar-wrapper">
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: progressBarWidth }"></div>
          </div>
        </div>

        <!-- Cancel button -->
        <button class="progress-cancel-button" @click="handleCancelClick"
          :aria-label="$translate('main.progressDialog.cancel')">
          {{ $translate('main.progressDialog.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';
import { ProgressDialogProps, ExportEvents } from './types/ExportTypes.js';
import EtaComponent from '@/components/settings/EtaComponent.vue';

// 獲取全局翻譯函數
const { proxy } = getCurrentInstance();
const $translate = proxy.$translate;

// Props 定義 - 使用標準化接口
const props = defineProps({
  ...ProgressDialogProps
});

// Events 定義
const emit = defineEmits([
  ExportEvents.PROGRESS_CANCEL
]);

/**
 * 計算進度信息文本
 * 格式：當前進度/總進度
 * 確保響應式更新
 */
const progressInfo = computed(() => {
  const current = props.currentFrame || 0;
  const total = props.totalFrames || 0;

  if (total === 0) {
    return '0/0';
  }
  return `${current}/${total}`;
});

/**
 * 計算進度條寬度
 * 確保總是返回有效的百分比字符串
 */
const progressBarWidth = computed(() => {
  if (props.progressPercentage < 0) return '0%';
  if (props.progressPercentage > 100) return '100%';
  return `${props.progressPercentage}%`;
});

/**
 * 處理取消按鈕點擊
 * 向父組件發送取消事件
 */
const handleCancelClick = () => {
  emit(ExportEvents.PROGRESS_CANCEL);
};

/**
 * 處理覆蓋層點擊
 * 通常不允許點擊覆蓋層關閉進度對話框，保持當前行為
 */
const handleOverlayClick = () => {
  // 進度對話框不允許點擊外部關閉
  // 保持原有行為：只能通過取消按鈕關閉
};
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

// Progress dialog wrapper
.progress-dialog-wrapper {

  // Full-screen overlay style
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-black-25);
    z-index: 999;
  }

  // Progress container - centered on screen
  .progress-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;

    .progress-box {
      background: var(--color-white);
      border-radius: 12px;
      padding: 12px;
      min-width: 320px;
      box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--color-border-primary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      @include mixins.dark {
        background: var(--color-dark);
      }

      // Progress text and frame info
      .progress-text {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 13px;
        color: var(--color-text-primary);
        gap: 4px;
        text-align: center;
        font-weight: var(--font-weight-bold);

        .progress-info {
          color: var(--color-text-primary);
        }
      }

      // Progress bar wrapper
      .progress-bar-wrapper {
        width: 100%;
        padding: 0 4px;

        .progress-bar {
          height: 4px;
          background: var(--color-bg-hover);
          border-radius: 2px;
          overflow: hidden;
          position: relative;

          .progress-bar-fill {
            height: 100%;
            background: var(--color-primary);
            border-radius: 2px;
            transition: width var(--animation-slow);
            min-width: 2px; // 確保即使是 0% 也有一點視覺反饋
          }
        }
      }

      // ETA text
      .eta-text {
        font-size: 12px;
        color: var(--color-text-secondary);
        text-align: center;
        min-height: 16px; // 防止佈局抖動
      }

      // Cancel button
      .progress-cancel-button {
        width: 90px;
        height: 32px;
        background: var(--color-bg-hover);
        border: 1px solid var(--color-border-primary);
        border-radius: 6px;
        color: var(--color-text-primary);
        font-size: 13px;
        font-weight: var(--font-weight-normal);
        cursor: pointer;
        transition: all var(--animation-normal);

        &:hover {
          background: var(--color-bg-active);
        }

        &:active {
          transform: scale(0.98);
        }

        &:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
      }
    }
  }
}
</style>