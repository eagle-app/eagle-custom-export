import { ref, shallowRef, markRaw, nextTick } from 'vue';

/**
 * 漸進式載入器 - 用於大量任務的非阻塞載入
 * 參考 eagle-plugin-image-convertor 的成功模式
 */
export function useProgressiveLoader() {
    // 載入狀態
    const isLoading = ref(false);
    const isComplete = ref(false);
    const isCancelled = ref(false);

    // 進度狀態
    const progress = ref({
        total: 0,
        loaded: 0,
        currentBatch: 0,
        totalBatches: 0,
        percentage: 0,
        estimatedTime: 0
    });

    // 內部狀態
    let startTime = 0;
    let cancelToken = false;
    let taskIdSet = new Set(); // O(1) 重複檢查

    /**
     * 分批載入任務，避免 UI 阻塞
     * @param {Array} items - 要載入的項目陣列
     * @param {Object} options - 載入選項
     * @param {Function} options.createTask - 任務創建函數
     * @param {Function} options.onProgress - 進度回調
     * @param {Function} options.onBatchComplete - 批次完成回調
     * @param {Function} options.onComplete - 完成回調
     * @param {number} options.batchSize - 批次大小，預設 200
     * @param {number} options.batchDelay - 批次間延遲(ms)，預設 16 (60fps)
     * @returns {Promise<Array>} 已載入的任務陣列
     */
    const loadTasksProgressively = async (items, options = {}) => {
        const {
            createTask,
            onProgress = () => {},
            onBatchComplete = () => {},
            onComplete = () => {},
            batchSize = 200,
            batchDelay = 16 // 1 frame at 60fps
        } = options;

        // 重置狀態
        isLoading.value = true;
        isComplete.value = false;
        isCancelled.value = false;
        cancelToken = false;
        startTime = Date.now();

        // 初始化進度
        progress.value = {
            total: items.length,
            loaded: 0,
            currentBatch: 0,
            totalBatches: Math.ceil(items.length / batchSize),
            percentage: 0,
            estimatedTime: 0
        };

        console.log(
            `Progressive loader: Starting to load ${items.length} items in ${progress.value.totalBatches} batches`
        );

        // 分批處理
        const batches = chunkArray(items, batchSize);
        const loadedTasks = [];

        try {
            for (let i = 0; i < batches.length; i++) {
                // 檢查取消狀態
                if (cancelToken) {
                    isCancelled.value = true;
                    console.log('Progressive loader: Cancelled by user');
                    break;
                }

                const batch = batches[i];
                const batchStartTime = Date.now();

                // 關鍵：讓出控制權給 UI 線程
                await new Promise((resolve) => setTimeout(resolve, batchDelay));

                // 處理當前批次
                const batchTasks = [];
                for (const item of batch) {
                    // 避免重複載入
                    if (!taskIdSet.has(item.id)) {
                        taskIdSet.add(item.id);

                        if (createTask) {
                            const task = await createTask(item);
                            if (task) {
                                // 使用 markRaw 避免深度響應式追蹤
                                batchTasks.push(markRaw(task));
                            }
                        } else {
                            batchTasks.push(markRaw(item));
                        }
                    }
                }

                loadedTasks.push(...batchTasks);

                // 更新進度
                progress.value.loaded += batch.length;
                progress.value.currentBatch = i + 1;
                progress.value.percentage = Math.round(
                    (progress.value.loaded / progress.value.total) * 100
                );

                // 估算剩餘時間
                const elapsed = Date.now() - startTime;
                const avgTimePerItem = elapsed / progress.value.loaded;
                const remainingItems = progress.value.total - progress.value.loaded;
                progress.value.estimatedTime = Math.round((avgTimePerItem * remainingItems) / 1000);

                // 觸發回調
                onProgress({
                    ...progress.value,
                    batchTasks,
                    batchTime: Date.now() - batchStartTime
                });

                // 關鍵：使用 nextTick 確保 DOM 更新
                await nextTick();

                onBatchComplete(i, batchTasks, {
                    batchIndex: i,
                    batchSize: batch.length,
                    totalLoaded: progress.value.loaded
                });

                console.log(
                    `Batch ${i + 1}/${progress.value.totalBatches} completed: ${batchTasks.length} tasks loaded`
                );
            }

            // 完成載入
            isComplete.value = true;
            const totalTime = Date.now() - startTime;

            console.log(
                `Progressive loader: Completed in ${totalTime}ms. Loaded ${loadedTasks.length} tasks`
            );

            onComplete({
                success: true,
                totalTasks: loadedTasks.length,
                totalTime,
                cancelled: isCancelled.value
            });
        } catch (error) {
            console.error('Progressive loader error:', error);

            onComplete({
                success: false,
                error: error.message,
                totalTasks: loadedTasks.length,
                cancelled: isCancelled.value
            });
        } finally {
            isLoading.value = false;
        }

        return loadedTasks;
    };

    /**
     * 取消載入操作
     */
    const cancel = () => {
        cancelToken = true;
        isCancelled.value = true;
        console.log('Progressive loader: Cancel requested');
    };

    /**
     * 重置載入器狀態
     */
    const reset = () => {
        isLoading.value = false;
        isComplete.value = false;
        isCancelled.value = false;
        cancelToken = false;
        taskIdSet.clear();

        progress.value = {
            total: 0,
            loaded: 0,
            currentBatch: 0,
            totalBatches: 0,
            percentage: 0,
            estimatedTime: 0
        };
    };

    /**
     * 估算最佳批次大小（基於裝置效能）
     * @param {number} totalItems - 總項目數
     * @returns {number} 建議的批次大小
     */
    const getOptimalBatchSize = (totalItems) => {
        // 基於記憶體和效能的簡單啟發式
        if (totalItems <= 500) return 100;
        if (totalItems <= 1000) return 150;
        if (totalItems <= 2000) return 200;
        if (totalItems <= 5000) return 250;
        return 300; // 大量資料時使用較大批次
    };

    return {
        // 狀態
        isLoading,
        isComplete,
        isCancelled,
        progress,

        // 方法
        loadTasksProgressively,
        cancel,
        reset,
        getOptimalBatchSize
    };
}

/**
 * 將陣列分割成指定大小的批次
 * @param {Array} array - 要分割的陣列
 * @param {number} chunkSize - 批次大小
 * @returns {Array<Array>} 分割後的批次陣列
 */
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
