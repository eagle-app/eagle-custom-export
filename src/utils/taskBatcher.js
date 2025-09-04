/**
 * 任務分批處理工具
 * 提供高效能的重複檢查、記憶體優化和批次處理功能
 */

/**
 * 任務去重器 - 使用 Map 和 Set 實現 O(1) 查找
 */
export class TaskDeduplicator {
    constructor() {
        this.taskIds = new Set(); // O(1) ID 查找
        this.taskMap = new Map(); // 快速任務存取
        this.memoryPressure = 0;
    }

    /**
     * 過濾新項目，移除重複
     * @param {Array} items - 待檢查的項目陣列
     * @returns {Array} 去除重複後的新項目
     */
    filterNewItems(items) {
        const newItems = items.filter((item) => !this.taskIds.has(item.id));
        return newItems;
    }

    /**
     * 添加任務到映射
     * @param {Object} task - 任務物件
     */
    addTask(task) {
        this.taskMap.set(task.id, task);
    }

    /**
     * 移除任務
     * @param {string} taskId - 任務 ID
     */
    removeTask(taskId) {
        if (this.taskIds.has(taskId)) {
            this.taskIds.delete(taskId);
            this.taskMap.delete(taskId);
        }
    }

    /**
     * 檢查任務是否存在
     * @param {string} taskId - 任務 ID
     * @returns {boolean}
     */
    hasTask(taskId) {
        return this.taskIds.has(taskId);
    }

    /**
     * 獲取任務
     * @param {string} taskId - 任務 ID
     * @returns {Object|null}
     */
    getTask(taskId) {
        return this.taskMap.get(taskId) || null;
    }

    /**
     * 清空所有任務
     */
    clear() {
        this.taskIds.clear();
        this.taskMap.clear();
        this.memoryPressure = 0;
    }

    /**
     * 估算項目記憶體大小
     * @param {Object} item - 項目物件
     * @returns {number} 估算的位元組數
     */
    estimateItemSize(item) {
        // 簡單的記憶體估算
        const str = JSON.stringify(item);
        return str.length * 2; // Unicode 字符約 2 位元組
    }

    /**
     * 獲取統計資訊
     * @returns {Object}
     */
    getStats() {
        return {
            totalTasks: this.taskIds.size,
            memoryPressure: this.memoryPressure,
            memoryPressureMB: Math.round((this.memoryPressure / (1024 * 1024)) * 100) / 100
        };
    }
}

/**
 * 任務批次處理器
 */
export class TaskBatcher {
    constructor(options = {}) {
        this.deduplicator = new TaskDeduplicator();
        this.options = {
            batchSize: 200,
            maxMemoryMB: 100, // 最大記憶體使用量 (MB)
            autoTune: true, // 自動調整批次大小
            ...options
        };

        this.currentBatchSize = this.options.batchSize;
        this.performanceMetrics = {
            avgBatchTime: 0,
            totalBatches: 0,
            memoryPeak: 0
        };
    }

    /**
     * 處理大量項目的分批載入
     * @param {Array} items - 要處理的項目陣列
     * @param {Function} processor - 處理函數
     * @param {Object} options - 處理選項
     * @returns {Promise<Array>} 處理結果
     */
    async processBatch(items, processor, options = {}) {
        const { onProgress = () => { }, onBatchComplete = () => { }, batchDelay = 16 } = options;

        // 去除重複項目
        const uniqueItems = this.deduplicator.filterNewItems(items);
        console.log(
            `TaskBatcher: Processing ${uniqueItems.length} unique items (${items.length - uniqueItems.length} duplicates filtered)`
        );

        if (uniqueItems.length === 0) {
            return [];
        }

        // 根據記憶體壓力調整批次大小
        if (this.options.autoTune) {
            this.adjustBatchSize();
        }

        const batches = this.createBatches(uniqueItems, this.currentBatchSize);
        const results = [];

        for (let i = 0; i < batches.length; i++) {
            const batchStartTime = Date.now();
            const batch = batches[i];

            // 處理批次
            const batchResults = [];
            for (const item of batch) {
                try {
                    const result = await processor(item);
                    if (result) {
                        batchResults.push(result);
                        this.deduplicator.addTask(result);
                    }
                } catch (error) {
                    console.warn(`TaskBatcher: Error processing item ${item.id}:`, error);
                }
            }

            results.push(...batchResults);

            // 更新效能指標
            const batchTime = Date.now() - batchStartTime;
            this.updatePerformanceMetrics(batchTime);

            // 進度回調
            onProgress({
                batchIndex: i + 1,
                totalBatches: batches.length,
                batchSize: batch.length,
                batchTime,
                memoryStats: this.deduplicator.getStats(),
                currentBatchSize: this.currentBatchSize
            });

            // 批次完成回調
            onBatchComplete(i, batchResults);

            // 記憶體壓力檢查
            if (this.checkMemoryPressure()) {
                console.warn('TaskBatcher: High memory pressure detected, triggering cleanup');
                await this.performMemoryCleanup();
            }

            // 讓出控制權給 UI 線程
            if (i < batches.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, batchDelay));
            }
        }

        console.log(
            `TaskBatcher: Completed processing ${results.length} items in ${batches.length} batches`
        );

        return results;
    }

    /**
     * 創建批次陣列
     * @param {Array} items - 項目陣列
     * @param {number} batchSize - 批次大小
     * @returns {Array<Array>} 批次陣列
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * 根據效能調整批次大小
     */
    adjustBatchSize() {
        const stats = this.deduplicator.getStats();
        const memoryUsageMB = stats.memoryPressureMB;

        // 根據記憶體使用量調整
        if (memoryUsageMB > this.options.maxMemoryMB * 0.8) {
            // 記憶體壓力高，減少批次大小
            this.currentBatchSize = Math.max(50, Math.floor(this.currentBatchSize * 0.8));
        } else if (
            memoryUsageMB < this.options.maxMemoryMB * 0.3 &&
            this.performanceMetrics.avgBatchTime < 50
        ) {
            // 記憶體充足且處理速度快，增加批次大小
            this.currentBatchSize = Math.min(500, Math.floor(this.currentBatchSize * 1.2));
        }

        console.log(
            `TaskBatcher: Adjusted batch size to ${this.currentBatchSize} (Memory: ${memoryUsageMB}MB)`
        );
    }

    /**
     * 更新效能指標
     * @param {number} batchTime - 批次處理時間
     */
    updatePerformanceMetrics(batchTime) {
        this.performanceMetrics.totalBatches++;

        // 計算平均批次時間
        const total =
            this.performanceMetrics.avgBatchTime * (this.performanceMetrics.totalBatches - 1) +
            batchTime;
        this.performanceMetrics.avgBatchTime = total / this.performanceMetrics.totalBatches;

        // 更新記憶體峰值
        const currentMemory = this.deduplicator.getStats().memoryPressureMB;
        if (currentMemory > this.performanceMetrics.memoryPeak) {
            this.performanceMetrics.memoryPeak = currentMemory;
        }
    }

    /**
     * 檢查記憶體壓力
     * @returns {boolean}
     */
    checkMemoryPressure() {
        const stats = this.deduplicator.getStats();
        return stats.memoryPressureMB > this.options.maxMemoryMB;
    }

    /**
     * 執行記憶體清理
     * @returns {Promise}
     */
    async performMemoryCleanup() {
        // 觸發垃圾回收（如果可用）
        if (global.gc) {
            global.gc();
        }

        // 等待一個事件循環週期
        await new Promise((resolve) => setTimeout(resolve, 0));

        console.log('TaskBatcher: Memory cleanup performed');
    }

    /**
     * 獲取效能統計
     * @returns {Object}
     */
    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            currentBatchSize: this.currentBatchSize,
            dedupStats: this.deduplicator.getStats()
        };
    }

    /**
     * 重置批次處理器
     */
    reset() {
        this.deduplicator.clear();
        this.currentBatchSize = this.options.batchSize;
        this.performanceMetrics = {
            avgBatchTime: 0,
            totalBatches: 0,
            memoryPeak: 0
        };
    }
}

/**
 * 檔名分配器 - 在批次開始前預分配所有檔名
 */
export class FileNameAllocator {
    constructor() {
        this.nameMap = new Map(); // taskId -> exportName
        this.usedNames = new Map(); // baseName -> Set of used full names
    }

    /**
     * 為任務批次預分配檔名
     * @param {Array} tasks - 任務陣列 [{id, fileName, format}...]
     * @param {Object} options - 選項 {nameType: 'original'|'custom', customName, startNumber}
     * @returns {Array} [{id: taskId, exportName: 'XXX'}, ...]
     */
    allocateFileNames(tasks, options = {}) {
        const results = [];
        const { nameType = 'original', customName = 'file', startNumber = 1 } = options;

        tasks.forEach((task, index) => {
            let baseName;

            // 決定基礎檔名
            if (nameType === 'original') {
                baseName = task.fileName || task.name || 'unnamed';
            } else {
                // 自訂名稱模式
                const currentNumber = startNumber + index;
                baseName = `${customName} ${currentNumber}`;
            }

            const extension = task.format || task.ext || 'jpg';
            const baseKey = `${baseName}.${extension}`;

            // 取得此基礎名稱的使用記錄
            if (!this.usedNames.has(baseKey)) {
                this.usedNames.set(baseKey, new Set());
            }
            const usedSet = this.usedNames.get(baseKey);

            // 決定最終檔名
            let finalName = baseName;
            let fullName = `${finalName}.${extension}`;

            // 如果原始名稱已被使用，加上括號數字
            if (usedSet.has(fullName)) {
                let counter = 1;
                do {
                    finalName = `${baseName}(${counter})`;
                    fullName = `${finalName}.${extension}`;
                    counter++;
                } while (usedSet.has(fullName) && counter < 1000);
            }

            // 註冊使用的名稱
            usedSet.add(fullName);
            this.nameMap.set(task.id, finalName);

            results.push({
                id: task.id,
                exportName: finalName,
                originalName: baseName,
                extension: extension
            });
        });

        return results;
    }

    /**
     * 獲取任務的分配名稱
     * @param {string} taskId
     * @returns {string|null}
     */
    getExportName(taskId) {
        return this.nameMap.get(taskId) || null;
    }

    /**
     * 清空所有分配
     */
    clear() {
        this.nameMap.clear();
        this.usedNames.clear();
    }

    /**
     * 獲取統計資訊
     * @returns {Object}
     */
    getStats() {
        let totalAllocated = 0;
        let duplicateCount = 0;

        this.usedNames.forEach((usedSet, baseKey) => {
            totalAllocated += usedSet.size;
            if (usedSet.size > 1) {
                duplicateCount += usedSet.size - 1;
            }
        });

        return {
            totalAllocated,
            uniqueBaseNames: this.usedNames.size,
            duplicateCount,
            taskCount: this.nameMap.size
        };
    }
}

/**
 * 建立輕量化任務物件的工廠函數
 * @param {Object} item - Eagle 項目物件
 * @returns {Object} 輕量化任務物件
 */
export function createLightTask(item) {
    return {
        // 核心屬性 - 保留 id 方便快速存取
        id: item.id,
        item: item, // 保存完整的 item 物件

        // 轉換相關屬性
        status: 'waiting',
        newFormat: '',
        convertedSize: 0,
        thumbnailUrl: item.thumbnailURL,

        // 錯誤相關屬性
        error: null,

        // 時間戳記
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

/**
 * 任務物件池 - 重用任務物件以減少 GC 壓力
 */
export class TaskObjectPool {
    constructor(initialSize = 100) {
        this.pool = [];
        this.inUse = new Set();

        // 預先建立一些物件
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createEmptyTask());
        }
    }

    /**
     * 從池中獲取任務物件
     * @param {Object} item - Eagle 項目物件
     * @returns {Object} 任務物件
     */
    acquire(item) {
        let task;

        if (this.pool.length > 0) {
            task = this.pool.pop();
            this.resetTask(task, item);
        } else {
            task = createLightTask(item);
        }

        this.inUse.add(task);
        return task;
    }

    /**
     * 將任務物件返回池中
     * @param {Object} task - 任務物件
     */
    release(task) {
        if (this.inUse.has(task)) {
            this.inUse.delete(task);
            this.pool.push(task);
        }
    }

    /**
     * 建立空的任務物件
     * @returns {Object}
     */
    createEmptyTask() {
        return {
            id: '',
            item: null,
            status: 'waiting',
            newFormat: '',
            convertedSize: 0,
            thumbnailUrl: '',
            error: null,
            createdAt: 0,
            updatedAt: 0
        };
    }

    /**
     * 重置任務物件
     * @param {Object} task - 任務物件
     * @param {Object} item - Eagle 項目物件
     */
    resetTask(task, item) {
        task.id = item.id;
        task.item = item;
        task.status = 'waiting';
        task.newFormat = '';
        task.convertedSize = 0;
        task.thumbnailUrl = item.thumbnailURL;
        task.error = null;
        task.createdAt = Date.now();
        task.updatedAt = Date.now();
    }

    /**
     * 獲取池統計
     * @returns {Object}
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            inUse: this.inUse.size,
            total: this.pool.length + this.inUse.size
        };
    }
}
