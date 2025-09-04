import { ref, reactive, onBeforeUnmount } from 'vue';

// 全局狀態 - 單例模式
const globalState = reactive({
    visible: false,
    imageUrl: '',
    alt: '',
    mouseX: 0,
    mouseY: 0
});

// 定時器管理器 - 防止記憶體洩漏
class HoverTimerManager {
    constructor() {
        this.timers = new Map();
    }
    
    set(key, callback, delay = 250) {
        this.clear(key);
        const timer = setTimeout(callback, delay);
        this.timers.set(key, timer);
        return timer;
    }
    
    clear(key) {
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }
    
    clearAll() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
    }
}

const timerManager = new HoverTimerManager();

/**
 * HoverPreview 全局管理 Hook
 * 遵循 SOLID 原則：
 * - 單一職責：只管理 hover preview 狀態
 * - 開放封閉：可擴展但不需修改現有代碼
 * - 依賴倒置：通過接口而不是具體實現
 */
export function useHoverPreview() {
    // 內部方法 - 狀態更新
    const updateState = (updates) => {
        Object.assign(globalState, updates);
    };

    // 公共 API
    const showPreview = (imageUrl, alt = '', mouseX = 0, mouseY = 0) => {
        updateState({
            visible: true,
            imageUrl,
            alt,
            mouseX,
            mouseY
        });
    };

    const hidePreview = () => {
        updateState({ visible: false });
        timerManager.clearAll(); // 清理所有相關定時器
    };

    const updateMousePosition = (mouseX, mouseY) => {
        if (globalState.visible) {
            updateState({ mouseX, mouseY });
        }
    };

    // 組件級別的 hook - 自動清理
    const createHoverHandler = (getImageData) => {
        const componentId = Symbol('hover-component');
        
        const handleMouseEnter = (event) => {
            const { imageUrl, alt } = getImageData();
            if (!imageUrl) return;
            
            // 存儲事件數據避免閉包問題
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            
            timerManager.set(componentId, () => {
                showPreview(imageUrl, alt, mouseX, mouseY);
            });
        };

        const handleMouseLeave = () => {
            timerManager.clear(componentId);
            hidePreview();
        };

        const handleMouseMove = (event) => {
            updateMousePosition(event.clientX, event.clientY);
        };

        // 自動清理
        onBeforeUnmount(() => {
            timerManager.clear(componentId);
        });

        return {
            handleMouseEnter,
            handleMouseLeave,
            handleMouseMove
        };
    };

    return {
        // 狀態 (只讀)
        globalHoverPreview: globalState,
        
        // 低級 API (供全局使用)
        showPreview,
        hidePreview,
        updateMousePosition,
        
        // 高級 API (供組件使用)
        createHoverHandler
    };
}