const { spawn } = require('child_process');
const { fileURLToPath } = require('url');

/**
 * FFprobe - 使用 ffprobe 獲取媒體檔案的實際尺寸
 * 
 * "The right way to solve a problem is often to first understand the data,
 * not to try to work around it." - Linus Torvalds
 * 
 * 這個模組專注於一件事：準確獲取媒體檔案的實際寬高，
 * 避免依賴可能不準確的 Eagle metadata。
 */
class FFprobe {
    constructor() {
        // 支援的媒體格式 - ffprobe 可以處理的格式
        this.supportedFormats = [
            // 常見圖片格式
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif',
            // 高級圖片格式
            'avif', 'heic', 'heif', 'jxl', 'svg', 'ico', 'exr', 'hdr', 'tga', 'dds',
            // 影片格式
            'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', '3gp',
            // 音訊格式 (雖然沒有寬高，但可能需要檢查)
            'mp3', 'aac', 'wav', 'flac', 'ogg'
        ];

        // 快取已解析的尺寸，避免重複解析相同檔案
        this.dimensionsCache = new Map();

        // 效能統計
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            totalRequests: 0,
            averageProcessingTime: 0
        };
    }

    /**
     * 檢查檔案格式是否支援
     * @param {string} filePath 檔案路徑
     * @returns {boolean}
     */
    isSupported(filePath) {
        if (!filePath) return false;

        const ext = this._getFileExtension(filePath);
        return this.supportedFormats.includes(ext.toLowerCase());
    }

    /**
     * 獲取媒體檔案的尺寸資訊
     * @param {string} filePath 檔案路徑 (可以是 file:// URL 或普通路徑)
     * @returns {Promise<{width: number, height: number, duration?: number, fps?: number}>}
     */
    async getDimensions(filePath) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            // 標準化檔案路徑
            const normalizedPath = this._normalizeFilePath(filePath);

            // 檢查快取
            const cacheKey = normalizedPath;
            if (this.dimensionsCache.has(cacheKey)) {
                this.stats.cacheHits++;
                return { ...this.dimensionsCache.get(cacheKey) };
            }

            this.stats.cacheMisses++;

            // // 檢查格式支援
            // if (!this.isSupported(normalizedPath)) {
            //     throw new Error(`Unsupported file format: ${this._getFileExtension(normalizedPath)}`);
            // }

            // 使用 ffprobe 獲取資訊
            const mediaInfo = await this._probeWithFFprobe(normalizedPath);

            // 更新效能統計
            const processingTime = Date.now() - startTime;
            this._updateAverageProcessingTime(processingTime);

            // 快取結果
            this.dimensionsCache.set(cacheKey, mediaInfo);

            return mediaInfo;
        } catch (error) {
            console.error(`FFprobe failed for ${filePath}:`, error.message);
            throw error;
        }
    }

    /**
     * 批量獲取多個檔案的尺寸資訊
     * @param {Array<string>} filePaths 檔案路徑陣列
     * @param {Object} options 選項
     * @param {number} options.concurrency 並行數量，預設為 3
     * @param {Function} options.onProgress 進度回調
     * @returns {Promise<Array<{filePath: string, dimensions: Object, error?: string}>>}
     */
    async getBatchDimensions(filePaths, options = {}) {
        const { concurrency = 3, onProgress } = options;
        const results = [];

        // 分批處理以控制並行數量
        for (let i = 0; i < filePaths.length; i += concurrency) {
            const batch = filePaths.slice(i, i + concurrency);

            const batchResults = await Promise.allSettled(
                batch.map(async (filePath) => {
                    try {
                        const dimensions = await this.getDimensions(filePath);
                        return { filePath, dimensions };
                    } catch (error) {
                        return { filePath, error: error.message };
                    }
                })
            );

            // 處理批次結果
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    results.push({
                        filePath: batch[results.length % batch.length],
                        error: result.reason.message
                    });
                }
            }

            // 報告進度
            if (onProgress) {
                onProgress({
                    completed: results.length,
                    total: filePaths.length,
                    percentage: Math.round((results.length / filePaths.length) * 100)
                });
            }
        }

        return results;
    }

    /**
     * 檢查檔案是否為動態圖片
     * @param {string} filePath 檔案路徑
     * @returns {Promise<boolean>}
     */
    async isAnimatedImage(filePath) {
        const ffmpegPaths = await eagle.extraModule.ffmpeg.getPaths();
        const ffprobePath = ffmpegPaths.ffprobe;

        const args = [
            '-v', 'error',
            '-select_streams', 'v:0',
            '-count_frames',
            '-show_entries', 'stream=nb_read_frames',
            '-of', 'default=nokey=1:noprint_wrappers=1',
            filePath
        ]

        return new Promise((resolve, reject) => {
            const process = spawn(ffprobePath, args);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    const fileExtension = filePath.split('.').pop();
                    const animatedWebp = stderr.includes('image data not found') && fileExtension === 'webp';
                    const frames = parseInt(stdout.trim(), 10);
                    resolve(frames > 1 || animatedWebp);  // 幀數 > 1 → 動態圖 ， 或 WebP 檔案因為目前 ffmpeg 沒辦法處理 動態webp 所以用這種反邏輯來推測輸入是動態webp
                } else {
                    reject(new Error(stderr || `ffprobe exited with code ${code}`));
                }
            });
        });
    }

    /**
     * 使用 ffprobe 檢查檔案資訊
     * @private
     * @param {string} filePath 正規化的檔案路徑
     * @returns {Promise<Object>}
     */
    async _probeWithFFprobe(filePath) {
        try {
            // 獲取 ffprobe 路徑
            const ffmpegPaths = await eagle.extraModule.ffmpeg.getPaths();
            const ffprobePath = ffmpegPaths.ffprobe;

            return new Promise((resolve, reject) => {
                // ffprobe 參數 - 獲取影片流資訊為 JSON 格式
                const args = [
                    '-v', 'quiet',          // 安靜模式，減少輸出
                    '-print_format', 'json', // JSON 輸出格式
                    '-show_streams',         // 顯示串流資訊
                    '-show_format',          // 顯示格式資訊 
                    filePath
                ];

                const process = spawn(ffprobePath, args);
                let stdout = '';
                let stderr = '';

                // 收集標準輸出
                process.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                // 收集錯誤輸出
                process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                // 處理完成
                process.on('close', (code) => {
                    if (code === 0 && stdout) {
                        try {
                            const probeData = JSON.parse(stdout);
                            const mediaInfo = this._parseProbeData(probeData, filePath);
                            resolve(mediaInfo);
                        } catch (parseError) {
                            reject(new Error(`Failed to parse ffprobe output: ${parseError.message}`));
                        }
                    } else {
                        const errorMessage = stderr || `ffprobe exited with code ${code}`;
                        reject(new Error(`ffprobe failed: ${errorMessage}`));
                    }
                });

                // 處理程序錯誤
                process.on('error', (error) => {
                    reject(new Error(`Failed to start ffprobe: ${error.message}`));
                });

                // 設定超時 (10 秒)
                setTimeout(() => {
                    if (!process.killed) {
                        process.kill('SIGTERM');
                        reject(new Error('ffprobe timeout after 10 seconds'));
                    }
                }, 10000);
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * 解析 ffprobe 輸出數據
     * @private
     * @param {Object} probeData ffprobe JSON 輸出
     * @param {string} filePath 檔案路徑 (用於錯誤資訊)
     * @returns {Object} 解析後的媒體資訊
     */
    _parseProbeData(probeData, filePath) {
        const { streams, format } = probeData;

        if (!streams || !Array.isArray(streams) || streams.length === 0) {
            throw new Error('No streams found in media file');
        }

        // 尋找第一個影片流
        const videoStream = streams.find(stream => stream.codec_type === 'video');

        if (!videoStream) {
            throw new Error('No video stream found in media file');
        }

        // 提取基本尺寸資訊
        const result = {
            width: parseInt(videoStream.width) || 0,
            height: parseInt(videoStream.height) || 0
        };

        // 驗證尺寸
        if (result.width <= 0 || result.height <= 0) {
            throw new Error(`Invalid dimensions: ${result.width}x${result.height}`);
        }

        // 添加額外資訊 (如果有的話)
        if (format && format.duration) {
            result.duration = parseFloat(format.duration);
        }

        if (videoStream.r_frame_rate) {
            // 解析幀率 (格式通常是 "30/1" 或 "29970/1000")
            const [numerator, denominator] = videoStream.r_frame_rate.split('/').map(Number);
            if (numerator && denominator) {
                result.fps = Math.round((numerator / denominator) * 100) / 100;
            }
        }

        // 添加編解碼器資訊
        if (videoStream.codec_name) {
            result.codec = videoStream.codec_name;
        }

        // 添加像素格式資訊
        if (videoStream.pix_fmt) {
            result.pixelFormat = videoStream.pix_fmt;
        }

        return result;
    }

    /**
     * 標準化檔案路徑
     * @private
     * @param {string} filePath 檔案路徑
     * @returns {string} 標準化後的路徑
     */
    _normalizeFilePath(filePath) {
        if (!filePath) {
            throw new Error('File path is required');
        }

        // 如果是 file:// URL，轉換為普通路徑
        if (filePath.startsWith('file://')) {
            return fileURLToPath(filePath);
        }

        return filePath;
    }

    /**
     * 獲取檔案副檔名
     * @private
     * @param {string} filePath 檔案路徑
     * @returns {string} 副檔名 (不含點)
     */
    _getFileExtension(filePath) {
        const parts = filePath.split('.');
        return parts.length > 1 ? parts.pop() : '';
    }

    /**
     * 更新平均處理時間統計
     * @private
     * @param {number} processingTime 處理時間 (毫秒)
     */
    _updateAverageProcessingTime(processingTime) {
        const totalTime = this.stats.averageProcessingTime * (this.stats.totalRequests - 1);
        this.stats.averageProcessingTime = (totalTime + processingTime) / this.stats.totalRequests;
    }

    /**
     * 清除快取
     */
    clearCache() {
        this.dimensionsCache.clear();
        console.log('FFprobe cache cleared');
    }

    /**
     * 獲取統計資訊
     * @returns {Object} 統計資訊
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.dimensionsCache.size,
            cacheHitRate: this.stats.totalRequests > 0
                ? Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100)
                : 0
        };
    }
}

module.exports = new FFprobe();