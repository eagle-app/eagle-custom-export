<script setup>
import { ref, inject, watch, nextTick, onMounted, onUnmounted } from 'vue';

const main = inject('main');

// 通知元素的 ref
const notifyRef = ref(null);

// 動態位置偏移（基於居中後的微調）
const positionOffset = ref(0);

// 分離的匯出通知狀態 (只處理成功狀態)
const exportNotification = ref({
    show: false,
    outputPath: null,
    successCount: 0,
    totalCount: 0
});

// 計算並調整位置 - 基於 .layout-main 容器居中
const adjustPosition = async () => {
    await nextTick();
    if (notifyRef.value && exportNotification.value.show) {
        const element = notifyRef.value;
        const elementWidth = element.offsetWidth;
        
        // 尋找 .layout-main 元素
        const layoutMainElement = document.querySelector('.layout-main');
        
        if (layoutMainElement) {
            // 基於 .layout-main 計算居中位置
            const layoutMainRect = layoutMainElement.getBoundingClientRect();
            const layoutMainCenterX = layoutMainRect.left + layoutMainRect.width / 2;
            const elementHalfWidth = elementWidth / 2;
            
            // 檢查是否會超出 .layout-main 邊界（留24px邊距）
            const margin = 24;
            const leftBoundary = layoutMainRect.left + margin;
            const rightBoundary = layoutMainRect.right - margin;
            
            let targetLeft = layoutMainCenterX;
            
            // 邊界檢查與調整：確保通知框完全在 .layout-main 內
            if (layoutMainCenterX - elementHalfWidth < leftBoundary) {
                // 左邊界溢出：調整到最小安全位置
                targetLeft = leftBoundary + elementHalfWidth;
            }
            else if (layoutMainCenterX + elementHalfWidth > rightBoundary) {
                // 右邊界溢出：調整到最大安全位置  
                targetLeft = rightBoundary - elementHalfWidth;
            }
            
            // 計算相對於視口50%位置的偏移量
            const viewportCenterX = window.innerWidth / 2;
            positionOffset.value = targetLeft - viewportCenterX;
        } else {
            // 回退到原始視口居中邏輯（安全措施）
            const viewportWidth = window.innerWidth;
            const idealCenterX = viewportWidth / 2;
            const elementHalfWidth = elementWidth / 2;
            
            const margin = 24;
            const leftBoundary = margin;
            const rightBoundary = viewportWidth - margin;
            
            let targetLeft = idealCenterX;
            
            if (idealCenterX - elementHalfWidth < leftBoundary) {
                targetLeft = leftBoundary + elementHalfWidth;
            }
            else if (idealCenterX + elementHalfWidth > rightBoundary) {
                targetLeft = rightBoundary - elementHalfWidth;
            }
            
            const centerPosition = viewportWidth / 2;
            positionOffset.value = targetLeft - centerPosition;
        }
    }
};

// 顯示匯出成功通知
const showExportSuccess = (outputPath, successCount, totalCount = null) => {
    exportNotification.value = {
        show: true,
        outputPath: outputPath,
        successCount: successCount,
        totalCount: totalCount || successCount
    };

    // 顯示後調整位置
    adjustPosition();
};

// 隱藏通知
const hideNotification = () => {
    exportNotification.value.show = false;
};

// 開啟輸出資料夾
const openOutputFolder = async () => {
    if (exportNotification.value.outputPath) {
        try {
            await eagle.shell.showItemInFolder(exportNotification.value.outputPath);
        } catch (error) {
            console.error('Failed to open output folder:', error);
        }
    }
};

watch(() => main.status, (newStatus) => {
    if (newStatus === 'processing') {
        hideNotification();
    }
});

// 監聽內容變化，重新計算位置
watch(() => exportNotification.value, () => {
    if (exportNotification.value.show) {
        adjustPosition();
    }
}, { deep: true });

// 窗口大小變化監聽器
const handleResize = () => {
    if (exportNotification.value.show) {
        adjustPosition();
    }
};

// 添加和移除事件監聽器
onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

// 暴露方法給父組件使用
defineExpose({
    showExportSuccess,
    hideNotification
});
</script>

<template>
    <!-- 匯出成功通知 (只在所有任務完成且有成功時顯示) -->
    <div ref="notifyRef" class="notify-vue" v-show="exportNotification.show" :style="{ transform: `translateX(calc(-50% + ${positionOffset}px))` }">
        <div class="tip">
            <div class="content">
                <el-icon class="icon icon-success"></el-icon>
                <span class="text">
                    {{
                        $translate('main.notification.exportPartialSuccess', {
                            successCount: exportNotification.successCount,
                            totalCount: exportNotification.totalCount
                        })
                    }}
                    <span class="open-folder-link" @click="openOutputFolder">
                        {{ $translate('main.notification.openFolder') }}
                    </span>
                </span>
            </div>
            <div class="divider"></div>
            <button class="close-button" @click="hideNotification">
                <el-icon class="icon icon-close"></el-icon>
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.notify-vue {
    position: fixed;
    left: 50%; // CSS居中基準點
    // transform 現在由動態樣式控制，實現精確的位置調整
    bottom: 24px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 6px;

    @include mixins.dark {
        background: rgba(55, 56, 60, 0.9);
    }

    .tip {
        position: relative;
        border-radius: 6px;
        font-size: 13px;
        height: 36px;
        display: flex;
        align-items: center;
        white-space: nowrap;
        user-select: none;
        outline: 1px solid var(--color-border-primary);
        outline-offset: -1px;
        overflow: hidden;
        border: var(--color-black-10);

        background: rgba(52, 199, 89, 0.1);

        @include mixins.dark {
            background: rgba(48, 209, 89, 0.15);
            border: var(--color-black-50);
        }

        .content {
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 8px;
            flex: 1;

            .text {
                display: flex;
                align-items: center;
                color: var(--color-text-primary);

                .open-folder-link {
                    margin-left: 12px;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    cursor: pointer;
                    font-weight: var(--font-weight-normal);

                    &:hover {
                        color: var(--color-text-primary);
                    }
                }
            }
        }

        .divider {
            width: 1px;
            height: 20px;
            background: var(--color-text-primary);
            opacity: 0.1;
            flex-shrink: 0;
        }

        .close-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--color-white);
            padding: 0;
        }
    }
}
</style>
