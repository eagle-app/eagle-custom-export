/**
 * TaskValidator - 統一任務驗證器
 * "Good programmers worry about data structures and their relationships"
 * 
 * 整合所有任務驗證邏輯，消除格式與尺寸檢查的重複代碼
 * 單一事實來源原則，避免驗證結果不一致
 */

import formatValidator from './formatValidator.js';
import { calculateItemDimensions } from './imageResize.js';

export class TaskValidator {
    constructor() {
        // 尺寸驗證策略 - 策略模式
        this.sizeValidationStrategies = {
            // WebP/AVIF：檢查單邊超限
            webp: this._createSideLimitStrategy(16384),
            avif: this._createSideLimitStrategy(16384),

            // ICO：不判斷，因為超過我會幫她導出 256x256
            ico: () => ({ isValid: true }),

            // 其他格式：檢查總像素超限  
            default: this._createPixelLimitStrategy(16384)
        };

        // 錯誤類型常數
        this.ERROR_TYPES = {
            FORMAT: 'format',
            SIZE: 'size',
            ANIMATION: 'animation',
            INVALID: 'invalid'
        };
    }

    /**
     * 創建單邊限制策略
     * @private
     */
    _createSideLimitStrategy(maxSide) {
        return (width, height) => {
            if (width > maxSide || height > maxSide) {
                return {
                    isValid: false,
                    exceedsWidth: width > maxSide,
                    exceedsHeight: height > maxSide,
                    limit: { maxWidth: maxSide, maxHeight: maxSide }
                };
            }
            return { isValid: true };
        };
    }

    /**
     * 創建總像素限制策略
     * @private
     */
    _createPixelLimitStrategy(maxSide) {
        const maxPixels = maxSide * maxSide;
        return (width, height) => {
            const totalPixels = width * height;
            if (totalPixels > maxPixels) {
                return {
                    isValid: false,
                    exceedsWidth: false,
                    exceedsHeight: false,
                    limit: { maxPixels }
                };
            }
            return { isValid: true };
        };
    }

    /**
     * 完整驗證任務項目（格式 + 尺寸）
     * @param {Object} item - Eagle 項目物件
     * @param {Object} exportSettings - 導出設定
     * @returns {Object} 完整驗證結果
     */
    validateTask(item, exportSettings) {
        // 基礎格式驗證
        const formatValidation = this._validateFormat(item, exportSettings.format);

        // 如果格式不支援，直接返回格式錯誤
        if (!formatValidation.isValid) {
            return {
                isValid: false,
                errorType: formatValidation.errorType,
                errorMessage: formatValidation.errorMessage,
                validationDetails: {
                    format: formatValidation,
                    size: { isValid: true }, // 格式不支援時跳過尺寸檢查
                    animation: { isValid: true } // 格式不支援時跳過動畫檢查
                }
            };
        }

        // 尺寸驗證（只在格式和動畫都支援時進行）
        const sizeValidation = this._validateSize(item, exportSettings);

        // 組合驗證結果
        const isValid = formatValidation.isValid && sizeValidation.isValid;

        // 錯誤優先序：尺寸 > 動畫 > 格式
        const errorInfo = !sizeValidation.isValid ? sizeValidation : formatValidation;

        return {
            isValid,
            errorType: errorInfo.errorType,
            errorMessage: errorInfo.errorMessage,
            validationDetails: {
                format: formatValidation,
                size: sizeValidation
            }
        };
    }

    /**
     * 批次驗證多個任務
     * @param {Array} items - 項目陣列
     * @param {Object} exportSettings - 導出設定
     * @returns {Array} 驗證結果陣列
     */
    validateTasks(items, exportSettings) {
        if (!Array.isArray(items)) return [];

        return items.map(item => ({
            itemId: item.id,
            validation: this.validateTask(item, exportSettings)
        }));
    }

    /**
     * 檢查設定變更是否需要重新驗證
     * @param {Object} oldSettings - 舊設定
     * @param {Object} newSettings - 新設定  
     * @returns {boolean} 是否需要重新驗證
     */
    needsRevalidation(oldSettings, newSettings) {
        // 影響驗證結果的設定項目
        const criticalSettings = ['format', 'sizeType', 'sizeValue'];

        return criticalSettings.some(key =>
            oldSettings?.[key] !== newSettings?.[key]
        );
    }

    /**
     * 獲取驗證統計
     * @param {Array} validationResults - 驗證結果陣列
     * @returns {Object} 統計信息
     */
    getValidationStats(validationResults) {
        if (!Array.isArray(validationResults)) return { valid: 0, invalid: 0, total: 0 };

        const stats = validationResults.reduce((acc, result) => {
            const validation = result.validation || result;
            if (validation.isValid) {
                acc.valid++;
            } else {
                acc.invalid++;
                // 統計錯誤類型
                acc.errorTypes[validation.errorType] = (acc.errorTypes[validation.errorType] || 0) + 1;
            }
            acc.total++;
            return acc;
        }, {
            valid: 0,
            invalid: 0,
            total: 0,
            errorTypes: {}
        });

        return {
            ...stats,
            validPercentage: stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0,
            invalidPercentage: stats.total > 0 ? Math.round((stats.invalid / stats.total) * 100) : 0
        };
    }

    // === 私有方法 ===

    /**
     * 驗證檔案格式
     * @private
     */
    _validateFormat(item, targetFormat = null) {
        const validation = formatValidator.validateTaskFormat(item, targetFormat);

        return {
            isValid: validation.isSupported,
            errorType: validation.errorType,
            errorMessage: validation.errorMessage
        };
    }

    /**
     * 驗證尺寸限制
     * @private  
     */
    _validateSize(item, exportSettings) {
        if (!item || !exportSettings) {
            return { isValid: true }; // 無資料時視為通過
        }

        // 計算導出尺寸
        const exportDimensions = calculateItemDimensions(
            item,
            exportSettings.sizeType,
            exportSettings.sizeValue
        );

        if (!exportDimensions || (!exportDimensions.width && !exportDimensions.height)) {
            return { isValid: true }; // 無法計算尺寸時視為通過
        }

        const targetFormat = exportSettings.format?.toLowerCase();

        // 選擇驗證策略：優先使用格式特定策略，否則使用默認策略
        const strategy = this.sizeValidationStrategies[targetFormat] ||
            this.sizeValidationStrategies.default;

        // 執行策略驗證
        const result = strategy(exportDimensions.width, exportDimensions.height);

        if (!result.isValid) {
            return {
                isValid: false,
                errorType: this.ERROR_TYPES.SIZE,
                errorMessage: 'main.status.imageTooLarge',
                sizeInfo: {
                    current: exportDimensions,
                    limit: result.limit,
                    exceeds: { width: result.exceedsWidth, height: result.exceedsHeight }
                }
            };
        }

        return { isValid: true };
    }
}

// 導出單例實例
export default new TaskValidator();