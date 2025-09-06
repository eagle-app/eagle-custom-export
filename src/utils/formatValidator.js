import MainProcessor from '@scripts/main.js';

/**
 * 格式驗證工具 - 基於 main.js 中的支援格式列表
 * 提供檔案格式支援檢查與錯誤信息處理
 */
class FormatValidator {
    constructor() {
        // CRITICAL: 直接使用 main.js 中已定義的 suppertedFileTypes 陣列
        // 避免重複定義，確保單一事實來源
        const mainInstance = new MainProcessor();
        this.supportedFormats = mainInstance.suppertedFileTypes || [
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

        this.supportedExportFormats = [
            'jpg', 'png', 'bmp', 'gif', 'tif', 'tiff', 'ico', 'webp', 'avif', 'hdr', 'exr', 'tga', 'mp4', 'webm'
        ]

        // 定義影片格式列表
        this.videoFormats = ['mp4', 'mov', 'webm', 'mkv', 'm4v'];

        // 定義圖片格式列表
        this.imageFormats = this.supportedFormats.filter(
            format => !this.videoFormats.includes(format)
        );

        // 錯誤信息映射
        this.errorMessages = {
            fileNotSupported: 'error.fileNotSupported',
            formatInvalid: 'error.formatInvalid'
        };
    }

    /**
     * 檢查檔案格式是否支援
     * @param {string} extension - 檔案副檔名 (可包含或不包含點號)
     * @returns {boolean} 是否支援該格式
     */
    isFormatSupported(extension) {
        if (!extension) return false;

        const normalizedExt = extension.toLowerCase().replace(/^\./, '');
        return this.supportedFormats.includes(normalizedExt);
    }

    /**
     * 檢查是否為影片格式
     * @param {string} extension - 檔案副檔名
     * @returns {boolean} 是否為影片格式
     */
    isVideoFormat(extension) {
        if (!extension) return false;
        const normalizedExt = extension.toLowerCase().replace(/^\./, '');
        return this.videoFormats.includes(normalizedExt);
    }

    /**
     * 檢查是否為圖片格式
     * @param {string} extension - 檔案副檔名
     * @returns {boolean} 是否為圖片格式
     */
    isImageFormat(extension) {
        if (!extension) return false;
        const normalizedExt = extension.toLowerCase().replace(/^\./, '');
        return this.imageFormats.includes(normalizedExt);
    }

    /**
     * 獲取格式不支援的錯誤信息鍵值
     * @returns {string} i18n 錯誤信息鍵值
     */
    getUnsupportedFormatError() {
        return this.errorMessages.fileNotSupported;
    }

    /**
     * 獲取支援的格式列表
     * @returns {Array<string>} 支援的格式陣列
     */
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    /**
     * 靜態方法：快速檢查格式支援 (便於直接調用)
     * @param {string} extension - 檔案副檔名
     * @returns {boolean} 是否支援該格式
     */
    static isSupported(extension) {
        const validator = new FormatValidator();
        return validator.isFormatSupported(extension);
    }

    /**
     * 驗證任務物件的格式支援狀態
     * @param {Object} item - 任務項目物件
     * @param {string} targetFormat - 目標導出格式 (可選)
     * @returns {Object} 驗證結果 { isSupported, errorType, errorMessage, status }
     */
    validateTaskFormat(item, targetFormat = null) {
        if (!item || !item.ext) {
            return {
                isSupported: false,
                status: 'error',
                errorType: 'format',
                errorMessage: this.errorMessages.formatInvalid
            };
        }

        const isSupported = this.isFormatSupported(item.ext);

        // 如果不支援原始格式
        if (!isSupported) {
            return {
                isSupported: false,
                status: 'error',
                errorType: 'format',
                errorMessage: this.errorMessages.fileNotSupported
            };
        }

        // 如果有目標格式，檢查影片轉檔規則
        if (targetFormat) {
            const sourceIsVideo = this.isVideoFormat(item.ext);
            const targetIsImage = this.isImageFormat(targetFormat);

            // 如果來源是影片但目標是圖片，設置為警告狀態
            if (sourceIsVideo && targetIsImage) {
                return {
                    isSupported: false,
                    status: 'warn',
                    errorType: 'format',
                    errorMessage: this.errorMessages.fileNotSupported
                };
            }

            targetFormat = (targetFormat === "original") ? item.ext : targetFormat;

            // 如果導出格式不支援，設置為警告狀態
            if (!this.supportedExportFormats.includes(targetFormat)) {
                return {
                    isSupported: false,
                    status: 'warn',
                    errorType: 'format',
                    errorMessage: this.errorMessages.fileNotSupported
                };
            }
        }

        return {
            isSupported: true,
            status: 'ok',
            errorType: null,
            errorMessage: null
        };
    }

    /**
     * 獲取格式驗證統計資訊
     * @param {Array} items - 項目陣列
     * @param {string} targetFormat - 目標導出格式 (可選)
     * @returns {Object} 統計資訊
     */
    getValidationStats(items, targetFormat = null) {
        if (!Array.isArray(items)) return { supported: 0, unsupported: 0, warnings: 0, total: 0 };

        const stats = items.reduce(
            (acc, item) => {
                const validation = this.validateTaskFormat(item, targetFormat);

                if (validation.status === 'ok') {
                    acc.supported++;
                } else if (validation.status === 'warn') {
                    acc.warnings++;
                } else {
                    acc.unsupported++;
                }
                acc.total++;
                return acc;
            },
            { supported: 0, unsupported: 0, warnings: 0, total: 0 }
        );

        return stats;
    }
}

// 導出類別和單例實例
export { FormatValidator };
export default new FormatValidator();
