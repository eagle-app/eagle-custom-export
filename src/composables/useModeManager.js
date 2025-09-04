import { ref, computed, watch } from 'vue';

export function useModeManager() {
    const operationMode = ref('export'); // 預設為導出模式

    // 計算屬性
    const isExportMode = computed(() => operationMode.value === 'export');
    const isReplaceMode = computed(() => operationMode.value === 'replace');

    // 命名設定可見性
    const showNamingSettings = computed(() => isExportMode.value);

    // 模式切換方法
    const setOperationMode = (mode) => {
        if (['export', 'replace'].includes(mode)) {
            operationMode.value = mode;
            // 保存到 localStorage
            localStorage.setItem('eagle.plugin.operationMode', mode);
        }
    };

    // 從 localStorage 載入設定
    const loadSavedMode = () => {
        const saved = localStorage.getItem('eagle.plugin.operationMode');
        if (saved && ['export', 'replace'].includes(saved)) {
            operationMode.value = saved;
        }
    };

    // 監聽模式變化
    watch(operationMode, (newMode) => {
        console.log(`Operation mode switched to: ${newMode}`);
        // 可以在這裡添加額外的邏輯
    });

    // 獲取檔案輸出配置
    const getOutputConfig = (originalItem, settings) => {
        if (isReplaceMode.value) {
            return {
                useOriginalPath: true,
                fileName: originalItem.name,
                shouldReplace: true
            };
        } else {
            return {
                useOriginalPath: false,
                fileName:
                    settings.nameType === 'original' ? originalItem.name : settings.newFileName,
                shouldReplace: false
            };
        }
    };

    // 初始化時載入保存的模式
    loadSavedMode();

    return {
        // 響應式狀態
        operationMode,

        // 計算屬性
        isExportMode,
        isReplaceMode,
        showNamingSettings,

        // 方法
        setOperationMode,
        loadSavedMode,
        getOutputConfig
    };
}
