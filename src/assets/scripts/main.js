'use strict';
import DataHistoryManager from '@scripts/DataHistoryManager';
import { FileNameAllocator } from '@/utils/taskBatcher';

const fileConverter = require(`${__dirname}/modules/fileConverter`);

export default class {
    constructor() {
        this.isLoading = false;
        this.suppertedFileTypes = [
            'bmp',
            'exr',
            'gif',
            'hdr',
            'heic',
            'heif',
            'hif',
            'ico',
            'jpeg',
            'jpg',
            'jfif',
            'png',
            'svg',
            'tga',
            'tif',
            'tiff',
            'webp',
            'avif',
            'insp',
            'jxl',
            'jpe',
            'dds',
            'mp4',
            'webm',
            'mov',
            'm4v',
            'mkv'
        ];

        this.isInputEmpty = false;
        this.isInputError = false;
        this.errorType = '';
        this.errorDescription = '';

        this.item_id = null;

        this.brushSize = 50;
        this.status = '';
        this.imageHistoryManager = new DataHistoryManager();

        this.localStorageKey = '';
        this.localStorageSetting = {};

        this.items = null;
        this.taskManager = null; // Will be injected by App.vue
    }

    // 新增方法以注入 taskManager
    setTaskManager(taskManager) {
        this.taskManager = taskManager;
    }

    /**
     * 生成唯一的檔案名稱（避免檔名衝突）
     * @param {string} outputDir 輸出目錄
     * @param {string} fileName 基礎檔名（不含副檔名）
     * @param {string} extension 副檔名
     * @returns {Promise<string>} 唯一的檔名（不含副檔名）
     */
    async generateUniqueFileName(outputDir, fileName, extension) {
        const fs = require('fs').promises;
        const path = require('path');
        let testFileName = fileName;
        let counter = 0;

        while (true) {
            const testPath = path.join(outputDir, `${testFileName}.${extension}`);
            try {
                await fs.access(testPath);
                // 檔案存在，增加 copy 後綴
                if (counter === 0) {
                    testFileName = `${fileName} copy`;
                } else {
                    testFileName = `${fileName} copy ${counter}`;
                }
                counter++;
            } catch {
                // 檔案不存在，使用這個檔名
                return testFileName;
            }
        }
    }

    async convertBatch(items, dest, settings) {
        try {
            this.status = 'processing';
            console.time('batchProcess');
            eagle.log.info(`start batch converting with settings:`, settings);

            // Store reference to fileConverter for cancellation
            this.currentConversionTask = fileConverter;

            // 預先過濾不支援的格式和尺寸過大的圖片
            const validItems = items.filter((item) => {
                const isSupported = this.suppertedFileTypes.includes(item.ext.toLowerCase());
                if (!isSupported) {
                    console.warn(
                        `[Main.convertBatch] Unsupported format: ${item.ext} for ${item.name}`
                    );
                    // 立即更新任務狀態為失敗
                    if (this.taskManager) {
                        this.taskManager.updateTaskStatus(item.id, 'warn', 0, 'Unsupported format');
                    }
                    return false;
                }

                return true;
            });

            // 如果沒有有效的項目
            if (validItems.length === 0) {
                console.log('[Main.convertBatch] No valid items to convert');
                settings.callbacks?.onComplete?.({
                    successfulTasks: [],
                    failedTasks: items.map((item) => ({
                        src: item.filePath,
                        error: i18next.t('status.unsupportedFormat'),
                        itemId: item.id
                    })),
                    statistics: {
                        total: items.length,
                        succeeded: 0,
                        failed: items.length,
                        skipped: 0
                    }
                });
                return;
            }

            // 將所有有效任務設為 processing
            if (this.taskManager) {
                validItems.forEach((item) => {
                    this.taskManager.updateTaskStatus(item.id, 'processing', 0);
                });
            }

            // 使用 FileNameAllocator 預分配檔名
            const fileNameAllocator = new FileNameAllocator();

            // 準備任務資料給分配器
            const tasksForAllocation = validItems.map((item) => ({
                id: item.id,
                fileName:
                    item.name ||
                    item.filePath.split('/').pop().split('\\').pop().split('.').shift(),
                name: item.name,
                format: settings.format === 'original' ? item.ext : settings.format,
                ext: item.ext
            }));

            // 分配檔名
            const allocatedNames = fileNameAllocator.allocateFileNames(tasksForAllocation, {
                nameType: settings.nameType,
                customName: settings.newFileName,
                startNumber: parseInt(settings.startNumber) || 1
            });

            // 建立 ID 到檔名的映射
            const nameMap = new Map();
            allocatedNames.forEach((allocation) => {
                nameMap.set(allocation.id, allocation.exportName);
            });

            console.log('[Main.convertBatch] File names allocated:', fileNameAllocator.getStats());

            // 如果是 keepBoth 模式，檢查並生成唯一檔名
            if (settings.keepBothMode || settings.runtimeConflictAction === 'keepBoth') {
                console.log('[Main.convertBatch] KeepBoth mode detected, checking for conflicts...');

                // 對每個檔名進行衝突檢查
                for (const item of validItems) {
                    const originalName = nameMap.get(item.id);
                    if (originalName) {
                        const format = settings.format === 'original' ? item.ext : settings.format;
                        const uniqueName = await this.generateUniqueFileName(dest, originalName, format);

                        if (uniqueName !== originalName) {
                            console.log(`[Main.convertBatch] Conflict detected for "${originalName}", using "${uniqueName}"`);
                            nameMap.set(item.id, uniqueName);
                        }
                    }
                }
            }

            // 將項目轉換為任務格式
            const tasks = validItems.map((item, index) => {
                // 使用預分配的檔名（可能已經過衝突處理）
                const fileName = nameMap.get(item.id) || `unnamed_${index}`;

                return {
                    src: item.filePath,
                    itemId: item.id, // 保留 ID 以便後續查找
                    options: {
                        output: dest,
                        format:
                            settings.format === 'original'
                                ? item.filePath.split('.').pop()
                                : settings.format,
                        quality: settings.quality,
                        codec: settings.codec,
                        animatedFps: settings.animatedFps, // 新增：傳遞動畫 FPS 參數
                        sizeType: settings.sizeType,
                        sizeValue: settings.sizeValue,
                        fileName: fileName,
                        keepBothMode: settings.keepBothMode, // 新增：傳遞 keepBoth 標記
                        runtimeConflictAction: settings.runtimeConflictAction, // 新增：傳遞執行時衝突處理動作
                        usePreallocatedName: true // 標記使用預分配的檔名
                        // isReplaceMode: settings.isReplaceMode, // 傳遞替換模式標記
                    }
                };
            });

            // 初始化進度計數器
            let completedTasks = 0;

            // 執行轉換
            const result = await fileConverter.convert(tasks, {
                onTaskComplete: async (taskResult) => {
                    try {
                        // 根據結果更新狀態
                        if (this.taskManager) {
                            const item = validItems.find((i) => i.filePath === taskResult.src);
                            if (item) {
                                const status = taskResult.success ? 'success' : 'failed';
                                this.taskManager.updateTaskStatus(
                                    item.id,
                                    status,
                                    taskResult.success ? 100 : 0,
                                    taskResult.error
                                );

                                // 如果轉換成功，更新匯出資訊
                                if (taskResult.success && taskResult.outputPath) {
                                    const exportInfo = {
                                        outputPath: taskResult.outputPath,
                                        newFileName: taskResult.actualFileName // 新增：導出的實際檔名
                                    };

                                    // 嘗試獲取原始圖片尺寸
                                    try {
                                        if (item.width && item.height) {
                                            exportInfo.originalDimensions = {
                                                width: item.width,
                                                height: item.height
                                            };
                                        }
                                    } catch (error) {
                                        console.warn(i18next.t('console.warnings.failedToGetDimensions'), error);
                                    }

                                    // 嘗試獲取匯出圖片尺寸和大小
                                    try {
                                        const fs = require('fs');
                                        const stats = await fs.promises.stat(taskResult.outputPath);
                                        exportInfo.convertedSize = stats.size;

                                        // 獲取匯出圖片尺寸
                                        const exportDimensions = await this.getImageDimensions(
                                            taskResult.outputPath
                                        );
                                        if (exportDimensions) {
                                            exportInfo.exportDimensions = exportDimensions;
                                        }
                                    } catch (error) {
                                        console.warn(i18next.t('console.warnings.failedToGetExportInfo'), error);
                                    }

                                    this.taskManager.updateTaskExportInfo(item.id, exportInfo);
                                }

                                // 新增：替換模式下更新檔案路徑
                                if (settings.isReplaceMode && taskResult.replacedInEagle) {
                                    console.log(
                                        '[Main.onTaskComplete] Updating task for replace mode:',
                                        {
                                            taskId: item.id,
                                            oldPath: item.filePath,
                                            newPath: taskResult.outputPath
                                        }
                                    );

                                    const path = require('path');
                                    const newFilePath = taskResult.outputPath;
                                    const newExt = path.extname(newFilePath).slice(1);

                                    // 更新任務的 item 資訊
                                    this.taskManager.updateTaskItemInfo(item.id, {
                                        filePath: newFilePath,
                                        ext: newExt
                                    });

                                    console.log('[Main.onTaskComplete] Task updated successfully');
                                }
                            } else {
                                console.warn(
                                    '[Main.onTaskComplete] Task item not found:',
                                    taskResult.src
                                );
                            }
                        } else {
                            console.error(i18next.t('console.errors.taskComplete', { message: taskResult.error }), {
                                itemId: taskResult.itemId,
                                error: taskResult.error,
                                src: taskResult.src
                            });
                        }

                        // 更新已完成任務計數
                        completedTasks++;

                        // 保留原始回調（使用統一介面）
                        // 增強 taskResult 以包含進度信息
                        const enhancedTaskResult = {
                            ...taskResult,
                            currentFrame: completedTasks,
                            totalFrames: validItems.length
                        };
                        settings.callbacks?.onTaskComplete?.(enhancedTaskResult);
                    } catch (error) {
                        console.error(i18next.t('console.errors.taskCompleteError', { error: error.message }), {
                            error: error.message,
                            stack: error.stack,
                            result: taskResult,
                            settings: { isReplaceMode: settings.isReplaceMode }
                        });
                        // 繼續拋出錯誤以便上層處理
                        throw error;
                    }
                },
                onProgress: settings.callbacks?.onProgress,
                onError: settings.callbacks?.onError,
                onComplete: settings.callbacks?.onComplete,
                onCancelled: settings.callbacks?.onCancelled
            });

            eagle.log.info(`end batch converting`);
            console.timeEnd('batchProcess');

            this.status = 'success';
            return result;
        } catch (error) {
            // 錯誤處理：將所有 processing 的任務設為 failed
            if (this.taskManager) {
                items.forEach((item) => {
                    const task = this.taskManager.getTask(item.id);
                    if (task && task.status === 'processing') {
                        this.taskManager.updateTaskStatus(item.id, 'failed', 0, error.message);
                    }
                });
            }

            eagle.log.error(error);
            this.status = 'error';
            throw error;
        } finally {
            this.status = '';
            this.currentConversionTask = null;
        }
    }

    /**
     * Cancel current batch conversion
     */
    cancelConversion() {
        if (this.currentConversionTask) {
            console.log('[Main] Cancelling current conversion task');
            this.currentConversionTask.cancel();
            this.currentConversionTask = null;
            return true;
        }
        this.status = 'cancelled';
        return false;
    }

    // 獲取圖片尺寸的輔助方法
    async getImageDimensions(filePath) {
        try {
            const path = require('path');
            const ext = path.extname(filePath).toLowerCase().slice(1);

            // 對於支援的圖片格式，使用 Canvas 獲取尺寸
            const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
            if (imageFormats.includes(ext)) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({ width: img.width, height: img.height });
                    };
                    img.onerror = () => {
                        resolve(null);
                    };
                    img.src = filePath;
                });
            }

            // 對於其他格式，使用 ffprobe 獲取尺寸
            if (eagle.ffmpeg && eagle.ffmpeg.ffprobe) {
                return new Promise((resolve) => {
                    eagle.ffmpeg.ffprobe(filePath, (err, metadata) => {
                        if (err || !metadata || !metadata.streams) {
                            resolve(null);
                            return;
                        }

                        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
                        if (videoStream && videoStream.width && videoStream.height) {
                            resolve({ width: videoStream.width, height: videoStream.height });
                        } else {
                            resolve(null);
                        }
                    });
                });
            }

            return null;
        } catch (error) {
            console.error(i18next.t('console.errors.gettingImageDimensions', { error: error.message }));
            return null;
        }
    }
}
