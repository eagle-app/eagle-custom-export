<script setup>
import Main from '@scripts/main';
import { ref, computed, reactive, provide, onMounted, markRaw } from 'vue';
import { useModeManager } from '@/composables/useModeManager';
import { useTaskManager } from '@/composables/useTaskManager';
import { useHoverPreview } from '@/composables/useHoverPreview';
import HoverPreview from '@/components/common/HoverPreview.vue';

const mousetrap = inject('mousetrap');
const main = reactive(new Main());

main.localStorageKey = `eagle.plugin.${eagle.plugin.manifest.id}.setting`;
main.localStorageSetting = JSON.parse(localStorage.getItem(main.localStorageKey) || '{}');

// 提供 modeManager
const modeManager = useModeManager();
provide('modeManager', modeManager);

// 添加導出設置的狀態 (移到 taskManager 之前)
const exportSettings = ref({
    exportType: '',
    frameValue: '',
    secondValue: '',
    format: '',
    quality: '',
    sizeType: '',
    sizeValue: '',
    nameType: '',
    newFileName: '',
    startNumber: '',
    exportCount: ''
});

// 提供給所有子組件
provide(
    'exportSettings',
    computed(() => exportSettings.value)
);

// 添加更新設置的方法 - 清理業務邏輯
const updateExportSettings = (newSettings) => {
    const oldSettings = { ...exportSettings.value };
    exportSettings.value = { ...exportSettings.value, ...newSettings };

    // 將驗證邏輯委託給 TaskManager
    taskManager.handleSettingsChange(oldSettings, exportSettings.value);
};
provide('updateExportSettings', updateExportSettings);

// 提供 taskManager (單例) - 傳入 exportSettings 和 main 實例
const taskManager = useTaskManager(computed(() => exportSettings.value), markRaw(main));
provide('taskManager', taskManager);

// 提供全局 hover preview
const { globalHoverPreview } = useHoverPreview();

// 建立導出觸發器
const triggerExport = ref(0);
provide('triggerExport', triggerExport);

// 注入 taskManager 到 main 實例
main.setTaskManager(taskManager);


// 添加主題支援
const eagleTheme = ref('light');

// 初始化主題
const initializeTheme = () => {
    const theme = eagle.app.theme;
    const THEME_SUPPORT = {
        Auto: eagle.app.isDarkColors() ? 'dark' : 'light',
        LIGHT: 'light',
        LIGHTGRAY: 'light',
        GRAY: 'dark',
        DARK: 'dark',
        BLUE: 'dark',
        PURPLE: 'dark'
    };
    eagleTheme.value = THEME_SUPPORT[theme] ?? 'light';
};

let isIinit = false;

// 提供主題資訊
provide('eagleTheme', eagleTheme);

// 監聽主題變化
eagle.onThemeChanged(() => {
    initializeTheme();
});

onMounted(async () => {
    // 初始化主題
    initializeTheme();

    mousetrap.bind(['mod+enter'], () => {
        // 使用 Vue 的響應式系統觸發導出
        triggerExport.value++;
        return false;
    });

    mousetrap.bind(['esc'], () => {
        window.close();
        return false;
    });
});

eagle.onPluginRun(async (plugin) => {

    if (!isIinit) {
        await new Promise(resolve => setTimeout(resolve, 50));
        await eagle.window.setOpacity(1);
    }
    isIinit = true;

    // const ids = plugin?.args?.ids ?? null;
    let items = await eagle.item.getSelected();

    // 清空既有的 task list
    taskManager.tasks.value = [];

    if (!items.length) window.close();

    main.items = items.map((item) => markRaw(item));
});

eagle.onLibraryChanged((libraryPath) => {
    console.log(`偵測到資源庫切換，新的資源庫路徑: ${libraryPath}`);
    window.close();
});

provide('main', main);
</script>

<template>
    <BodyVue>
        <LayoutVue />
        <!-- 全局 Hover Preview -->
        <HoverPreview :visible="globalHoverPreview.visible" :imageUrl="globalHoverPreview.imageUrl"
            :alt="globalHoverPreview.alt" :mouseX="globalHoverPreview.mouseX" :mouseY="globalHoverPreview.mouseY" />
    </BodyVue>
</template>
