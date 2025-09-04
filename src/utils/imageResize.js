/**
 * Image Resize Utilities
 * Linus式數據驅動的尺寸計算工具集
 * 
 * "Bad programmers worry about the code. Good programmers worry about data structures."
 * - 將複雜的switch case邏輯轉換為簡潔的策略模式
 * - 消除所有特殊情況，實現統一的計算模式
 */

// 比例縮放工具函數 - 純函數，無副作用
export const scaleProportional = (width, height, ratio) => [
    Math.round(width * ratio),
    Math.round(height * ratio)
];

// 計算安全比例 - 防止除零錯誤
const safeRatio = (target, current) => current > 0 ? target / current : 1;

// Linus式策略映射表 - 數據驅動，消除條件判斷地獄
export const RESIZE_STRATEGIES = {
    maxSide: (w, h, target) => {
        const maxDim = Math.max(w, h);
        return maxDim > target ? scaleProportional(w, h, safeRatio(target, maxDim)) : [w, h];
    },
    
    minSide: (w, h, target) => {
        const minDim = Math.min(w, h);
        return minDim > target ? scaleProportional(w, h, safeRatio(target, minDim)) : [w, h];
    },
    
    maxWidth: (w, h, target) => {
        return w > target ? [target, Math.floor(h * safeRatio(target, w))] : [w, h];
    },
    
    maxHeight: (w, h, target) => {
        return h > target ? [Math.floor(w * safeRatio(target, h)), target] : [w, h];
    },
    
    minWidth: (w, h, target) => {
        return w < target ? [target, Math.floor(h * safeRatio(target, w))] : [w, h];
    },
    
    minHeight: (w, h, target) => {
        return h < target ? [Math.floor(w * safeRatio(target, h)), target] : [w, h];
    },
    
    original: (w, h) => [w, h]
};

/**
 * 統一的尺寸計算接口
 * @param {number} width - 原始寬度
 * @param {number} height - 原始高度  
 * @param {string} sizeType - 縮放類型
 * @param {number} targetSize - 目標尺寸
 * @returns {[number, number]} 新的 [寬度, 高度]
 */
export const calculateDimensions = (width, height, sizeType = 'original', targetSize = 900) => {
    // 輸入驗證 - 防禦性編程
    if (!width || !height || width <= 0 || height <= 0) {
        return [width || 0, height || 0];
    }
    
    // 獲取策略函數，回退到原始尺寸
    const strategy = RESIZE_STRATEGIES[sizeType] || RESIZE_STRATEGIES.original;
    
    // 執行策略，返回結果
    return strategy(width, height, parseInt(targetSize) || 900);
};

/**
 * 便利的尺寸計算包裝器 - 返回對象格式
 * @param {Object} item - 包含width/height的項目對象
 * @param {string} sizeType - 縮放類型
 * @param {number} targetSize - 目標尺寸
 * @returns {Object|null} {width, height} 或 null
 */
export const calculateItemDimensions = (item, sizeType, targetSize) => {
    if (!item?.width || !item?.height) return null;
    
    const [width, height] = calculateDimensions(item.width, item.height, sizeType, targetSize);
    return { width, height };
};

// 導出所有策略類型供類型檢查使用
export const SUPPORTED_RESIZE_TYPES = Object.keys(RESIZE_STRATEGIES);

/**
 * 檢查是否為支持的縮放類型
 * @param {string} sizeType - 縮放類型
 * @returns {boolean}
 */
export const isSupportedResizeType = (sizeType) => {
    return SUPPORTED_RESIZE_TYPES.includes(sizeType);
};