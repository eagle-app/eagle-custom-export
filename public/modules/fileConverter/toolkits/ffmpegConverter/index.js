const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const { validateOutputFile, getOutputPath } = require('../../validate');

class FFmpegConverter {

    constructor() {
        // 不支援透明背景的格式
        this.nonTransparentFormats = [
            'jpeg',
            'jpg',
            'jpe',
            'jfif',
            'bmp',
            'tiff',
            'tif'
        ];
    }

    /**
     * 檢查格式是否支援透明
     * @param {string} format 
     * @returns {boolean}
     */
    isTransparentFormat(format) {
        return !this.nonTransparentFormats.includes(format.toLowerCase());
    }

    /**
     * 轉換單個圖片
     * @param {string} src 來源圖片路徑
     * @param {Object} options 輸出設置
     * @param {string} options.output 輸出目錄路徑
     * @param {string} options.format 輸出格式 ('jpg'|'png'|'webp'|'bmp'|'tiff'|'gif'|'heic'|'heif'|'jxl')
     * @param {number} options.quality 輸出品質 (1-100)
     * @param {string} options.sizeType 尺寸調整類型 ('maxWidth'|'maxHeight'|'minWidth'|'minHeight'|'maxSide'|'minSide'|'exact')
     * @param {number} options.sizeValue 尺寸值
     * @param {string} options.fileName 新檔名
     * @param {number} options.width 指定寬度 (當 sizeType 為 'exact' 時使用)
     * @param {number} options.height 指定高度 (當 sizeType 為 'exact' 時使用)
     * @param {number} options.animatedFps 動畫 FPS (用於 GIF 和 WebP 動畫)
     * @param {Function} options.onProgress 進度回調
     * @returns {Promise<void>}
     */
    async convert(src, dest, options) {
        try {
            // 驗證輸入參數            
            if (!src) throw new Error('sourceMissing');
            if (!dest) throw new Error('outputMissing');
            if (!options.format) throw new Error('formatMissing');
            // if (!options.fileName) throw new Error('fileNameMissing');

            // 確保輸出目錄存在
            await fs.mkdir(dest, { recursive: true });

            const result = await this._convertWithFFmpeg(src, dest, options);

            // 如果是可取消模式，等待 promise 完成
            if (options._enableCancellation && result.promise) {
                await result.promise;
            }

            // 驗證輸出文件
            const outputPath = getOutputPath(dest, options);
            await validateOutputFile(outputPath, {
                minSize: 1,
                timeout: 5000
            });

            // 如果是可取消模式，返回包含 killProcess 的結果
            if (options._enableCancellation && result.killProcess) {
                return result;
            }

        } catch (error) {
            throw error;
        }

    }

    /**
     * 使用 FFmpeg 進行轉換
     * @private
     */
    async _convertWithFFmpeg(src, dest, options) {
        const ffmpegPaths = await eagle.extraModule.ffmpeg.getPaths();
        const ffmpegPath = ffmpegPaths.ffmpeg;

        const inputArgs = options.imageData ? [
            '-f', 'rawvideo',
            '-pix_fmt', 'rgba',
            '-s', `${options.imageData[0].width}x${options.imageData[0].height}`,
            '-i', 'pipe:0',
        ] :
            ['-i', src];

        let args = [
            ...inputArgs,
            '-y',
            '-threads', '0',
        ];

        const buildFFmpegArgs = require('./buildFFmpegArgs');

        args = [
            ...args,
            ...buildFFmpegArgs(src, dest, options),
        ]

        // console.log(args);

        let ffmpegProcess = null;

        const promise = new Promise((resolve, reject) => {
            // console.time("ffmpeg command")
            ffmpegProcess = spawn(ffmpegPath, args);
            let stderr = '';

            if (options.imageData) {
                for (const frame of options.imageData) {
                    const imageBuffer = Buffer.from(frame.data);
                    ffmpegProcess.stdin.write(imageBuffer);
                }
                ffmpegProcess.stdin.end();
            }

            ffmpegProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                // console.log(stderr);
            });

            ffmpegProcess.on('close', async (code) => {
                // console.timeEnd("ffmpeg command")
                if (typeof options.onProgress === 'function') {
                    options.onProgress(100);
                }

                if (code === 0) {
                    resolve();
                } else if (code === null || code === 130 || code === 143) {
                    // Process was killed (SIGINT or SIGTERM)
                    reject(new Error('conversionCancelled'));
                } else {
                    if (stderr.includes('Could not open file')) {
                        reject(new Error('outputPathCouldNotOpen'));
                    } else if (stderr.includes('Invalid data found when processing input')) {
                        // reject(new Error('fileExtensionNotSupported'));
                        reject(new Error("Invalid data found when processing input"));
                    } else {
                        reject(new Error(stderr));
                    }
                }

                if (options.format === 'png' && options.isAnimated) {
                    const apngPath = path.join(dest, `${options.fileName}.apng`);
                    const pngPath = path.join(dest, `${options.fileName}.png`);                    
                    await fs.rename(apngPath, pngPath);
                }
            });

            ffmpegProcess.on('error', (err) => {
                reject(err);
            });
        });

        // 如果支援可取消轉換模式，返回 promise 和 kill 函數
        if (options._enableCancellation) {
            return {
                promise,
                killProcess: () => {
                    if (ffmpegProcess && !ffmpegProcess.killed) {
                        ffmpegProcess.kill('SIGTERM');
                        // 如果 SIGTERM 沒用，1秒後用 SIGKILL
                        setTimeout(() => {
                            if (ffmpegProcess && !ffmpegProcess.killed) {
                                ffmpegProcess.kill('SIGKILL');
                            }
                        }, 1000);
                    }
                }
            };
        }

        // 向後相容：直接返回 promise
        return promise;
    }

}

module.exports = new FFmpegConverter();