import { ref, computed, shallowRef, markRaw } from 'vue';
import { useProgressiveLoader } from './useProgressiveLoader.js';
import {
    TaskBatcher,
    TaskDeduplicator,
    createLightTask,
    TaskObjectPool
} from '@/utils/taskBatcher.js';
import taskValidator from '@/utils/taskValidator.js';
const fs = require('fs');
const { fileURLToPath } = require('url');

// 導入 ffprobe 轉換器用於獲取實際媒體尺寸
const ffprobe = require(`${__dirname}/modules/fileConverter/toolkits/ffprobe`);

// 檢查檔案是否存在的輔助函數
async function checkFileExists(filePath) {
    try {
        // 將 file:// URL 轉換為普通路徑
        let normalPath = fileURLToPath(filePath);

        // 檢查檔案是否存在
        await fs.promises.access(normalPath);
        return filePath; // 返回原始路徑以保持 URL 格式
    } catch (error) {
        // 檔案不存在或無法訪問
        return null;
    }
}

export function useTaskManager(exportSettings, mainInstance) {
    // 使用 shallowRef 避免深度響應式追蹤大型陣列
    const tasks = shallowRef([]);

    // 初始化優化工具
    const progressiveLoader = useProgressiveLoader();
    const taskBatcher = new TaskBatcher({
        batchSize: 200,
        maxMemoryMB: 50, // 限制記憶體使用
        autoTune: true
    });
    const taskObjectPool = new TaskObjectPool(200);

    // 載入狀態
    const isLoadingTasks = ref(false);
    const loadProgress = computed(() => progressiveLoader.progress.value);

    // 計算屬性：不同狀態的任務數量
    const pendingTasks = computed(() => tasks.value.filter((task) => task.status === 'waiting'));

    const processingTasks = computed(() =>
        tasks.value.filter((task) => task.status === 'processing')
    );

    const completedTasks = computed(() => tasks.value.filter((task) => task.status === 'success'));

    const failedTasks = computed(() => tasks.value.filter((task) => task.status === 'failed'));

    // 計算屬性：任務統計
    const taskStats = computed(() => ({
        total: tasks.value.length,
        pending: pendingTasks.value.length,
        processing: processingTasks.value.length,
        completed: completedTasks.value.length,
        failed: failedTasks.value.length
    }));

    // 格式化檔案大小
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = [i18next.t('units.fileSize.bytes'), i18next.t('units.fileSize.kilobytes'), i18next.t('units.fileSize.megabytes'), i18next.t('units.fileSize.gigabytes')];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 添加任務 (統一驗證)
    const addTask = async (item) => {
        // 檢查是否已經存在相同ID的任務
        const existingTask = tasks.value.find((task) => task.id === item.id);
        if (existingTask) {
            console.warn(i18next.t('console.warnings.taskAlreadyExists', { id: item.id }));
            return existingTask;
        }

        // 使用統一驗證器
        const validation = taskValidator.validateTask(item, exportSettings?.value);

        let task = {
            // 核心屬性 - 保留 id 方便快速存取
            id: item.id,
            item: item, // 保存完整的 Eagle item 物件

            // 轉換相關屬性
            newFormat: exportSettings?.value?.format || '',
            convertedSize: 0,
            status: validation.isValid ? 'waiting' : 'warn',
            thumbnailUrl: await checkFileExists(item.thumbnailURL),

            // 錯誤相關屬性 - 統一處理
            error: validation.errorMessage,
            isFormatSupported: validation.isValid,
            errorType: validation.errorType,
            errorMessage: validation.errorMessage,

            // 時間戳記
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // 使用 ffprobe 獲取實際尺寸和動畫資訊並覆寫 item 屬性
        try {
            if (item.filePath && ffprobe.isSupported(item.filePath)) {
                // 並行獲取尺寸和動畫資訊
                const [dimensions, isAnimated] = await Promise.all([
                    ffprobe.getDimensions(item.filePath),
                    ffprobe.isAnimatedImage(item.filePath)
                ]);

                // 只有當 dimensions 有有效的寬高值時才覆寫
                if (dimensions && dimensions.width && dimensions.height) {
                    // 直接修改 item 屬性，而不是替換整個物件
                    task.item.width = dimensions.width;
                    task.item.height = dimensions.height;
                    task.item.isAnimated = isAnimated;

                    console.log(`Updated media info for ${item.name}: ${dimensions.width}x${dimensions.height}, animated: ${isAnimated}`);
                } else {
                    console.log(`No valid dimensions from ffprobe for ${item.name}, keeping original values`);
                }
            }
        } catch (error) {
            // ffprobe 失敗不影響任務創建，只記錄警告
            console.warn(`Failed to get media info for ${item.name}:`, error.message);
        }

        tasks.value.push(task);

        // 記錄不支援的任務
        if (!validation.isValid) {
            console.warn(`Task validation failed for ${item.name}: ${validation.errorMessage}`);
        }

        return task;
    };

    // 舊的批量添加任務（保持向後相容性）
    const addMultipleTasks = async (items) => {
        console.warn(
            'useTaskManager: addMultipleTasks is deprecated, use addTasksProgressively instead'
        );
        return await addTasksProgressively(items);
    };

    /**
     * 漸進式批量添加任務 - 主要的批次載入方法
     * @param {Array} items - 要添加的項目陣列
     * @param {Object} options - 載入選項
     * @returns {Promise<Array>} 已添加的任務陣列
     */
    const addTasksProgressively = async (items, options = {}) => {
        if (!items || items.length === 0) {
            return [];
        }

        console.log(`TaskManager: Starting progressive loading of ${items.length} items`);

        isLoadingTasks.value = true;

        // 收集需要更新尺寸的任務
        const tasksNeedingDimensionUpdate = [];

        try {
            // 使用任務批次處理器進行高效處理
            const newTasks = await taskBatcher.processBatch(
                items,
                async (item) => {
                    // 檢查是否已經存在相同ID的任務
                    const existingTask = tasks.value.find((task) => task.id === item.id);
                    if (existingTask) {
                        return null; // 跳過重複項目
                    }

                    // 使用統一驗證器
                    const validation = taskValidator.validateTask(item, exportSettings?.value);

                    // 從物件池獲取或創建輕量任務
                    const task = taskObjectPool.acquire(item);

                    // 使用批次檢查的結果設置縮圖 URL
                    const thumbnailUrl = await checkFileExists(item.thumbnailURL);
                    task.thumbnailUrl = thumbnailUrl;

                    // 設定新格式
                    task.newFormat = exportSettings?.value?.format || '';

                    // 統一應用驗證結果
                    task.status = validation.isValid ? 'waiting' : 'warn';
                    task.error = validation.errorMessage;
                    task.isFormatSupported = validation.isValid;
                    task.errorType = validation.errorType;
                    task.errorMessage = validation.errorMessage;

                    // 檢查是否需要獲取尺寸，但不同步等待
                    if (item.filePath && ffprobe.isSupported(item.filePath)) {
                        tasksNeedingDimensionUpdate.push(task);
                        // console.log(`Queued dimension update for ${item.name}`);
                    }

                    // 記錄不支援的任務
                    if (!validation.isValid) {
                        console.warn(`Task validation failed: ${item.ext} for file ${item.name} - ${validation.errorMessage}`);
                    }

                    // 使用 markRaw 避免深度響應式追蹤
                    return markRaw(task);
                },
                {
                    onProgress: (progressInfo) => {
                        // 載入進度回調
                        console.log(
                            `Progress: Batch ${progressInfo.batchIndex}/${progressInfo.totalBatches}, Memory: ${progressInfo.memoryStats.memoryPressureMB}MB`
                        );

                        // 觸發進度事件（如果需要）
                        if (options.onProgress) {
                            options.onProgress(progressInfo);
                        }
                    },
                    onBatchComplete: (batchIndex, batchTasks) => {
                        // 批次完成後立即更新 UI
                        if (batchTasks.length > 0) {
                            tasks.value = [...tasks.value, ...batchTasks];

                            console.log(
                                `Batch ${batchIndex + 1} completed: Added ${batchTasks.length} tasks, Total: ${tasks.value.length}`
                            );
                        }

                        // 觸發批次完成事件（如果需要）
                        if (options.onBatchComplete) {
                            options.onBatchComplete(batchIndex, batchTasks);
                        }
                    },
                    batchDelay: options.batchDelay || 16 // 60fps
                }
            );

            console.log(
                `TaskManager: Progressive loading completed. Total tasks: ${tasks.value.length}`
            );

            // 觸發完成回調
            if (options.onComplete) {
                options.onComplete({
                    success: true,
                    totalLoaded: newTasks.length,
                    totalTasks: tasks.value.length,
                    pendingDimensionUpdates: tasksNeedingDimensionUpdate.length,
                    performanceStats: taskBatcher.getPerformanceStats()
                });
            }

            return newTasks;
        } catch (error) {
            console.error(i18next.t('console.errors.progressiveLoading', { error: error.message }));

            if (options.onComplete) {
                options.onComplete({
                    success: false,
                    error: error.message,
                    totalLoaded: 0,
                    totalTasks: tasks.value.length
                });
            }

            throw error;
        } finally {
            isLoadingTasks.value = false;
        }
    };

    /**
     * 取消進行中的任務載入
     */
    const cancelTaskLoading = () => {
        if (isLoadingTasks.value) {
            progressiveLoader.cancel();
            console.log(i18next.t('console.info.taskLoadingCancelled'));
        }
    };

    // 移除任務
    const removeTask = (taskId) => {
        const index = tasks.value.findIndex((task) => task.id === taskId);
        if (index > -1) {
            const removedTask = tasks.value[index];

            // 從任務批次處理器中移除
            taskBatcher.deduplicator.removeTask(taskId);

            // 將任務返回物件池
            taskObjectPool.release(removedTask);

            // 從陣列中移除
            const newTasks = [...tasks.value];
            newTasks.splice(index, 1);
            tasks.value = newTasks;

            return true;
        }
        return false;
    };

    // 更新任務狀態
    const updateTaskStatus = (taskId, status, progress = null, error = null) => {
        const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks.value[taskIndex];

            // 使用對象展開來確保響應式更新
            const updatedTask = {
                ...task,
                status,
                updatedAt: new Date(),
                errorMessage: error || null,
                ...(progress !== null && { progress }),
                ...(error !== null && { error })
            };

            // 對於 shallowRef，需要替換整個陣列來觸發響應式更新
            const newTasks = [...tasks.value];
            newTasks[taskIndex] = updatedTask;
            tasks.value = newTasks;

            return updatedTask;
        }

        console.warn(i18next.t('console.errors.taskNotFound', { taskId: taskId }));
        return null;
    };

    // 批次更新多個任務狀態 (新增方法)
    const updateMultipleTaskStatus = (updates) => {
        const updatedTasks = [];
        const newTasksArray = [...tasks.value];

        updates.forEach(({ taskId, status, progress = null, error = null }) => {
            const taskIndex = newTasksArray.findIndex((task) => task.id === taskId);
            if (taskIndex !== -1) {
                const task = newTasksArray[taskIndex];

                // 使用對象展開來確保響應式更新
                const updatedTask = {
                    ...task,
                    status,
                    updatedAt: new Date(),
                    ...(progress !== null && { progress }),
                    ...(error !== null && { error })
                };

                newTasksArray[taskIndex] = updatedTask;
                updatedTasks.push(updatedTask);
            } else {
                console.warn(`Task ${taskId} not found for batch status update`);
            }
        });

        // 一次性更新整個陣列以減少響應式觸發次數
        if (updatedTasks.length > 0) {
            tasks.value = newTasksArray;
            console.log(`Batch updated ${updatedTasks.length} tasks`);
        }

        return updatedTasks;
    };

    // 更新任務新格式
    const updateTaskNewFormat = (taskId, newFormat) => {
        const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks.value[taskIndex];
            const updatedTask = {
                ...task,
                newFormat,
                updatedAt: new Date()
            };

            // 對於 shallowRef，需要替換整個陣列來觸發響應式更新
            const newTasks = [...tasks.value];
            newTasks[taskIndex] = updatedTask;
            tasks.value = newTasks;
            return updatedTask;
        }
        return null;
    };

    // 更新所有任務的新格式
    const updateAllTasksNewFormat = (newFormat) => {
        // 對於 shallowRef，需要創建新陣列
        const newTasks = tasks.value.map((task) => {
            return {
                ...task,
                newFormat,
                updatedAt: new Date()
            };
        });
        tasks.value = newTasks;
    };

    /**
     * 統一重新驗證所有任務 - 當設定變更時呼叫
     * 使用統一驗證器，避免重複邏輯
     */
    const revalidateAllTasks = () => {
        const settings = exportSettings?.value;
        if (!settings) return;

        console.log(`Revalidating all tasks for settings change: format=${settings.format}, sizeType=${settings.sizeType}`);

        // 對於 shallowRef，需要創建新陣列
        const newTasks = tasks.value.map((task) => {
            // 跳過已完成或失敗的任務
            if (task.status === 'success' || task.status === 'failed') {
                return task;
            }

            // 使用統一驗證器重新驗證
            const validation = taskValidator.validateTask(task.item, settings);

            // 檢查狀態是否需要更新
            const shouldUpdate = (
                (validation.isValid && task.status === 'warn') ||  // 從警告恢復為正常
                (!validation.isValid && task.status === 'waiting') || // 從正常變為警告
                (task.errorType !== validation.errorType) // 錯誤類型改變
            );

            if (shouldUpdate) {
                const newStatus = validation.isValid ? 'waiting' : 'warn';

                console.log(
                    `Task ${task.item.name} validation changed: ` +
                    `${task.status}→${newStatus} (${validation.errorType || 'none'})`
                );

                return {
                    ...task,
                    status: newStatus,
                    error: validation.errorMessage,
                    errorMessage: validation.errorMessage,
                    errorType: validation.errorType,
                    isFormatSupported: validation.isValid, // FIXED: 正確的邏輯
                    updatedAt: new Date()
                };
            }

            return task;
        });

        tasks.value = newTasks;
    };

    /**
     * 處理設定變更 - 集中業務邏輯，避免 UI 層處理
     * @param {Object} oldSettings - 舊設定
     * @param {Object} newSettings - 新設定
     */
    const handleSettingsChange = (oldSettings, newSettings) => {
        // 使用統一驗證器檢查是否需要重新驗證
        if (taskValidator.needsRevalidation(oldSettings, newSettings)) {
            console.log('Settings change requires task revalidation');
            revalidateAllTasks();
        }

        // 更新所有等待中任務的新格式
        if (oldSettings?.format !== newSettings?.format && newSettings?.format) {
            updateAllTasksNewFormat(newSettings.format);
        }
    };

    // 更新任務轉換後大小
    const updateTaskConvertedSize = (taskId, convertedSize) => {
        const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks.value[taskIndex];
            const updatedTask = {
                ...task,
                convertedSize,
                updatedAt: new Date()
            };

            // 對於 shallowRef，需要替換整個陣列來觸發響應式更新
            const newTasks = [...tasks.value];
            newTasks[taskIndex] = updatedTask;
            tasks.value = newTasks;
            return updatedTask;
        }
        return null;
    };

    // 更新任務轉換結果資訊
    const updateTaskExportInfo = (taskId, exportInfo) => {
        const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks.value[taskIndex];
            const updatedTask = {
                ...task,
                exportPath: exportInfo.outputPath || null,
                convertedSize: exportInfo.convertedSize || 0,
                originalDimensions: exportInfo.originalDimensions || null,
                exportDimensions: exportInfo.exportDimensions || null,
                newFileName: exportInfo.newFileName || null,
                updatedAt: new Date()
            };

            // 對於 shallowRef，需要替換整個陣列來觸發響應式更新
            const newTasks = [...tasks.value];
            newTasks[taskIndex] = updatedTask;
            tasks.value = newTasks;
            return updatedTask;
        }
        return null;
    };

    // 更新任務的 item 資訊
    const updateTaskItemInfo = (taskId, updates) => {
        const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks.value[taskIndex];
            const updatedTask = {
                ...task,
                item: {
                    ...task.item,
                    ...updates
                },
                updatedAt: new Date()
            };

            const newTasks = [...tasks.value];
            newTasks[taskIndex] = updatedTask;
            tasks.value = newTasks;
            return updatedTask;
        }
        return null;
    };

    // 獲取任務
    const getTask = (taskId) => {
        return tasks.value.find((task) => task.id === taskId);
    };

    // 獲取格式化的任務數據（用於表格顯示）
    const getFormattedTasks = computed(() => {
        return tasks.value.map((task) => ({
            ...task,
            originalSizeFormatted: formatFileSize(task.originalSize),
            convertedSizeFormatted:
                task.convertedSize > 0 ? formatFileSize(task.convertedSize) : '-',
            statusText: getStatusText(task.status)
        }));
    });

    // 獲取狀態文本
    const getStatusText = (status) => {
        const statusMap = {
            waiting: '等待中',
            processing: '處理中',
            success: '已完成',
            failed: '失敗'
        };
        return statusMap[status] || status;
    };

    // 重置任務狀態（重新開始處理）
    const resetTaskStatus = (taskId) => {
        const taskIndex = tasks.value.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks.value[taskIndex];
            const updatedTask = {
                ...task,
                status: 'waiting',
                progress: 0,
                error: null,
                convertedSize: 0,
                updatedAt: new Date()
            };

            // 對於 shallowRef，需要替換整個陣列來觸發響應式更新
            const newTasks = [...tasks.value];
            newTasks[taskIndex] = updatedTask;
            tasks.value = newTasks;
            return updatedTask;
        }
        return null;
    };

    // 重置所有失敗任務的狀態
    const resetAllFailedTasks = () => {
        // 對於 shallowRef，需要創建新陣列
        const newTasks = tasks.value.map((task) => {
            if (task.status === 'failed') {
                return {
                    ...task,
                    status: 'waiting',
                    progress: 0,
                    error: null,
                    convertedSize: 0,
                    updatedAt: new Date()
                };
            }
            return task;
        });
        tasks.value = newTasks;
    };

    /**
     * 獲取效能統計資訊
     * @returns {Object} 效能統計
     */
    const getPerformanceStats = () => {
        return {
            taskBatcher: taskBatcher.getPerformanceStats(),
            objectPool: taskObjectPool.getStats(),
            ffprobe: ffprobe.getStats(), // 添加 ffprobe 統計
            loadProgress: loadProgress.value,
            totalTasks: tasks.value.length,
            memoryOptimization: {
                tasksInPool: taskObjectPool.getStats().poolSize,
                tasksInUse: taskObjectPool.getStats().inUse,
                deduplicationRate: taskBatcher.deduplicator.getStats()
            }
        };
    };

    /**
     * 強制記憶體清理（開發/除錯用）
     */
    const forceMemoryCleanup = async () => {
        // 清理已完成的任務
        const completedTasks = tasks.value.filter((task) => task.status === 'success');
        completedTasks.forEach((task) => {
            taskObjectPool.release(task);
        });

        // 移除已完成的任務
        tasks.value = tasks.value.filter((task) => task.status !== 'success');

        // 觸發批次處理器清理
        await taskBatcher.performMemoryCleanup();

        // 清理 ffprobe 快取
        ffprobe.clearCache();

        console.log('TaskManager: Forced memory cleanup completed');
    };

    /**
     * Pause all processing tasks
     * @returns {Promise<void>}
     */
    const pauseAllTasks = async () => {
        // First, cancel the actual conversion in progress
        if (mainInstance && typeof mainInstance.cancelConversion === 'function') {
            const cancelled = mainInstance.cancelConversion();
            if (cancelled) {
                console.log('TaskManager: Cancelled ongoing conversion');
            }
        }

        // Then update task statuses
        const processingTaskIds = tasks.value
            .filter((task) => task.status === 'processing')
            .map((task) => task.id);

        if (processingTaskIds.length > 0) {
            const updates = processingTaskIds.map((taskId) => ({
                taskId,
                status: 'waiting',
                progress: null,
                error: null
            }));

            updateMultipleTaskStatus(updates);
            console.log(`TaskManager: Paused ${processingTaskIds.length} processing tasks`);
        }
    };

    // Clear all tasks
    const clearAllTasks = () => {
        // Return all tasks to object pool
        tasks.value.forEach(task => taskObjectPool.release(task));

        // Clear tasks array
        tasks.value = [];

        // Clear deduplicator
        taskBatcher.deduplicator.clear();

        console.log('TaskManager: All tasks cleared');
    };

    // Clear completed tasks only
    const clearCompletedTasks = () => {
        const completedTasks = tasks.value.filter(task => task.status === 'success');

        // Return completed tasks to object pool
        completedTasks.forEach(task => taskObjectPool.release(task));

        // Keep only non-completed tasks
        tasks.value = tasks.value.filter(task => task.status !== 'success');

        console.log(`TaskManager: Cleared ${completedTasks.length} completed tasks`);
    };

    return {
        // 響應式數據
        tasks,

        // 計算屬性
        pendingTasks,
        processingTasks,
        completedTasks,
        failedTasks,
        taskStats,
        getFormattedTasks,

        // 載入狀態
        isLoadingTasks,
        loadProgress,

        // 核心方法
        addTask,
        addMultipleTasks, // 保持向後相容性
        addTasksProgressively, // 新的主要方法
        cancelTaskLoading,
        removeTask,

        // 任務操作方法
        updateTaskStatus,
        updateMultipleTaskStatus,
        updateTaskNewFormat,
        updateAllTasksNewFormat,
        revalidateAllTasks,
        handleSettingsChange,
        updateTaskConvertedSize,
        updateTaskExportInfo,
        updateTaskItemInfo,
        getTask,
        resetTaskStatus,
        resetAllFailedTasks,

        // 工具方法
        formatFileSize,
        getStatusText,
        getPerformanceStats,
        forceMemoryCleanup,
        pauseAllTasks,
        clearAllTasks,
        clearCompletedTasks,

        // 相容性別名 - 保持舊 API 不破壞
        checkAndUpdateSizeLimitations: revalidateAllTasks,

        // 直接存取優化工具（進階用法）
        progressiveLoader,
        taskBatcher
    };
}
