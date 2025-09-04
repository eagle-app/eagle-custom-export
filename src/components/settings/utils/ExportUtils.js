/**
 * 導出相關工具函數
 * 
 * 遵循 Linus 原則：
 * 1. 消除代碼重複
 * 2. 單一事實來源
 * 3. 簡單清晰的函數
 */

import { createExportSettings } from '../types/ExportTypes.js';

/**
 * 設置轉換函數
 * 統一的設置轉換邏輯
 */
export const convertSettings = (settings) => {  
  return createExportSettings({
    format: settings.format,
    quality: settings.quality,
    animatedFps: settings.animatedFps,
    codec: settings.codec,
    exportType: settings.exportType,
    sizeType: settings.sizeType,
    sizeValue: settings.sizeValue,
    nameType: settings.nameType,
    newFileName: settings.newFileName,
    startNumber: settings.startNumber,
    exportCount: settings.exportCount,
  });
};

/**
 * 獲取輸出路徑
 * 處理替換模式和選擇目錄模式
 */
export const getOutputPath = async (items, operationMode) => {
  if (operationMode === 'replace') {
    const firstItemPath = items[0].filePath;
    if (!firstItemPath) {
      throw new Error(i18next.t('error.cannotDetermineSourcePath'));
    }
    return path.dirname(firstItemPath);
  }

  const outputDialog = await eagle.dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });

  if (outputDialog.canceled) {
    return null; // 用戶取消選擇文件夾，返回 null 而不是拋出錯誤
  }

  return outputDialog.filePaths[0];
};

/**
 * 檢查文件衝突
 * 返回衝突文件列表
 */
export const checkFileConflicts = async (items, outputPath, settings) => {
  const fs = require('fs');
  const path = require('path');
  const { FileNameAllocator } = await import('@/utils/taskBatcher');
  const conflictFiles = [];

  const fileNameAllocator = new FileNameAllocator();
  const tasksForAllocation = items.map((item) => ({
    id: item.id,
    fileName: item.name || item.filePath.split('/').pop().split('\\').pop().split('.').shift(),
    name: item.name,
    format: settings.format === 'original' ? item.ext : settings.format,
    ext: item.ext
  }));

  const allocatedNames = fileNameAllocator.allocateFileNames(tasksForAllocation, {
    nameType: settings.nameType,
    customName: settings.newFileName,
    startNumber: parseInt(settings.startNumber) || 1
  });

  const nameMap = new Map();
  allocatedNames.forEach((allocation) => {
    nameMap.set(allocation.id, allocation.exportName);
  });

  for (const item of items) {
    const fileName = nameMap.get(item.id);
    const outputFormat = settings.format === 'original' ? item.ext : settings.format;
    const outputFileName = `${fileName}.${outputFormat}`;
    const outputFilePath = path.join(outputPath, outputFileName);

    try {
      await fs.promises.access(outputFilePath);
      conflictFiles.push({
        originalFile: item.filePath,
        outputFile: outputFilePath,
        fileName: outputFileName,
        itemName: item.name
      });
    } catch (error) {
      // 檔案不存在，沒有衝突
    }
  }

  return conflictFiles;
};