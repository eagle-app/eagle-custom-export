<template>
  <div class="error-dialogs">

    <!-- 檔案重複處理對話框 -->
    <DialogVue 
      v-model="localConflictDialog.visible" 
      :type="localConflictDialog.type" 
      :showThirdBtn="true"
      thirdBtnType="default" 
      @cancel="handleConflictCancel" 
      @ok="handleConflictReplace"
      @third="handleConflictKeepBoth"
    >
      <template #title>
        {{ $translate('main.SettingSidebar.dialogs.fileDuplication.title') }}
      </template>
      
      <template #description>
        <div v-html="getConflictDescription()"></div>
      </template>
      
      <template #cancel>
        {{ $translate('main.SettingSidebar.dialogs.fileDuplication.cancel') }}
      </template>
      
      <template #third>
        {{ $translate('main.SettingSidebar.dialogs.fileDuplication.keepBoth') }}
      </template>
      
      <template #ok>
        {{ $translate('main.SettingSidebar.dialogs.fileDuplication.replace') }}
      </template>
    </DialogVue>
  </div>
</template>

<script setup>
import { computed, reactive, watch, getCurrentInstance } from 'vue';
import DialogVue from '@/components/tools/DialogVue.vue';
import { 
  ErrorDialogsProps, 
  ExportEvents, 
  ErrorType, 
  ConflictAction 
} from './types/ExportTypes.js';

// 獲取全局翻譯函數
const { proxy } = getCurrentInstance();
const $translate = proxy.$translate;

// Props 定義
const props = defineProps({
  ...ErrorDialogsProps
});

// Events 定義
const emit = defineEmits([
  ExportEvents.ERROR_DISMISSED,
  ExportEvents.CONFLICT_RESOLVED
]);

// 本地狀態 - 響應式代理原始數據
const localErrorDialog = reactive({
  visible: false,
  type: 'error',
  errorType: ErrorType.UNKNOWN,
  errorDescription: ''
});

const localConflictDialog = reactive({
  visible: false,
  type: 'warning',
  conflictFiles: []
});

// 監聽外部數據變化
watch(() => props.errorDialog, (newVal) => {
  if (newVal) {
    Object.assign(localErrorDialog, newVal);
  }
}, { deep: true, immediate: true });

watch(() => props.conflictDialog, (newVal) => {
  if (newVal) {
    Object.assign(localConflictDialog, newVal);
  }
}, { deep: true, immediate: true });

// 計算屬性 - 統一處理所有文本邏輯
const isUnknownError = computed(() => localErrorDialog.errorType === ErrorType.UNKNOWN);
const getErrorTitle = () => $translate(`footer.dialog.error.${isUnknownError.value ? 'unknownError' : localErrorDialog.errorType}.title`);
const getErrorDescription = () => isUnknownError.value ? '' : $translate(`footer.dialog.error.${localErrorDialog.errorType}.description`);
const getConflictDescription = () => $translate('main.SettingSidebar.dialogs.fileDuplication.description', { count: localConflictDialog.conflictFiles?.length || 0 });

/**
 * 處理錯誤對話框確定
 */
const handleErrorOk = () => {
  localErrorDialog.visible = false;
  emit(ExportEvents.ERROR_DISMISSED);
};

/**
 * 處理衝突對話框 - 取消
 */
const handleConflictCancel = () => {
  localConflictDialog.visible = false;
  emit(ExportEvents.CONFLICT_RESOLVED, {
    action: ConflictAction.ASK,
    cancelled: true
  });
};

/**
 * 處理衝突對話框 - 替換
 */
const handleConflictReplace = () => {
  localConflictDialog.visible = false;
  emit(ExportEvents.CONFLICT_RESOLVED, {
    action: ConflictAction.REPLACE,
    cancelled: false,
    conflictFiles: localConflictDialog.conflictFiles
  });
};

/**
 * 處理衝突對話框 - 保留兩者
 */
const handleConflictKeepBoth = () => {
  localConflictDialog.visible = false;
  emit(ExportEvents.CONFLICT_RESOLVED, {
    action: ConflictAction.KEEP_BOTH,
    cancelled: false,
    conflictFiles: localConflictDialog.conflictFiles
  });
};
</script>