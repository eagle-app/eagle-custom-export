/**
 * TaskItem - Linus style data model
 * "Bad programmers worry about the code. Good programmers worry about data structures."
 * 
 * This class eliminates all scattered status checking by centralizing business logic
 * in the data structure itself. No more if/else hell in templates.
 */

import { calculateItemDimensions } from '@/utils/imageResize.js';
import taskValidator from '@/utils/taskValidator.js';

export class TaskItem {
    constructor(rawTask, exportSettings, index = 0, translate = null) {
        // Store references for reactivity, not copies
        this._raw = rawTask;
        this._settings = exportSettings;
        this._index = index;
        this._translate = translate;

        // Core properties - direct access for performance
        this.id = rawTask.id;
        this.item = rawTask.item;
        this.status = rawTask.status;
        this.exportPath = rawTask.exportPath;
        this.newFileName = rawTask.newFileName;
        this.newFormat = rawTask.newFormat;
        this.thumbnailUrl = rawTask.thumbnailUrl;

        // Linus style: Bind methods to avoid this hell
        this.handleNameClick = this.handleNameClick.bind(this);
        this.handleThumbnailError = this.handleThumbnailError.bind(this);
    }

    // Status computations - eliminate scattered checks
    get isError() {
        return this.status && ['warn', 'failed'].includes(this.status);
    }

    get isSuccess() {
        return this.status === 'success' && this.exportPath;
    }

    get isWaiting() {
        return this.status === 'waiting';
    }

    // Status display properties
    get statusClass() {
        return [`icon-${this.status}`, 'status'];
    }

    get statusMessage() {
        if (!this._translate) return '';

        if (this.status === 'warn' || this.status === 'failed') {
            return this._translate(this._raw.errorMessage);
        }
        return this._translate(`main.taskList.statusLabels.${this.status}`);
    }

    // Name display logic - consolidated from original displayName function
    get displayName() {
        const isWaiting = this.isWaiting;
        const useCustomName = this._settings?.nameType === 'custom';

        if (isWaiting && useCustomName) {
            return `${this._settings.newFileName}${this._settings.startNumber + this._index}`;
        }

        return isWaiting ? this.item?.name : this.newFileName || this.item?.name;
    }

    get nameClass() {
        return { 'filename-link': this.isSuccess };
    }

    // Thumbnail properties
    get thumbnailStyle() {
        if (!this.item?.width || !this.item?.height) return {};
        return { 'aspect-ratio': `${this.item.width}/${this.item.height}` };
    }

    get showThumbnailPlaceholder() {
        return !this.thumbnailUrl;
    }

    // Format display logic
    get originalFormatText() {
        return this.formatText(this.item?.ext);
    }

    get newFormatText() {
        if (this.isError) return '-';

        // FIXED: 不直接修改 this.newFormat，避免狀態不一致
        const targetFormat = this._settings?.format?.toLowerCase() || this.newFormat;
        return targetFormat === 'original' ?
            this.formatText(this.item?.ext) :
            this.formatText(targetFormat);
    }

    get formatStyle() {
        return {
            color: this.isError ? 'var(--color-warning)' : ''
        };
    }

    get formatMessage() {
        if (!this.isError || !this._translate) return '';

        return this.status === 'warn' ?
            this._translate('error.fileNotSupported') :
            this._translate(`main.taskList.statusLabels.${this.status}`);
    }

    get newFormatClass() {
        const classes = [];
        if (this.isError) classes.push('empty');

        const originalFormat = this.item?.ext?.toLowerCase();
        const targetFormat = this._settings?.format?.toLowerCase() || this.newFormat?.toLowerCase();

        if (targetFormat !== 'original' && originalFormat && targetFormat && originalFormat !== targetFormat) {
            classes.push('format-changed');
        }

        return classes;
    }

    get showFormatArrow() {
        return this._settings?.format !== 'original';
    }

    // Dimensions logic
    get exportDimensions() {
        return calculateItemDimensions(
            this.item,
            this._settings?.sizeType,
            this._settings?.sizeValue
        );
    }

    get showDimensionArrow() {
        return this._settings?.sizeType !== 'original';
    }

    get dimensionsDisplay() {
        if (this.isError) {
            return { original: '-', export: '-' };
        }

        const original = this.item ? {
            width: this.item.width,
            height: this.item.height
        } : { width: '-', height: '-' };

        const exportDims = this.exportDimensions;

        return {
            original,
            export: exportDims
        };
    }

    // Helper methods
    formatText(ext) {
        if (!ext || !this._translate) return '';

        const key = `main.itemExportFormat.format-options.${ext.toLowerCase()}`;
        const translation = this._translate(key);
        return translation === key ? ext.toUpperCase() : translation;
    }

    // Action handlers - methods, not getters (actions vs display)
    async handleNameClick() {
        // Linus style: Robust checking - handle undefined status
        if (this.status !== 'success' || !this.exportPath) return;

        try {
            await eagle.shell.showItemInFolder(this.exportPath);
        } catch (error) {
            console.error('Failed to show item in folder:', error);
        }
    }

    handleThumbnailError(event) {
        console.warn('Thumbnail failed to load:', event.target.src);
        // Let parent handle the UI update
        return { showPlaceholder: true };
    }

    // Static factory method for batch creation
    static fromRawTasks(rawTasks, exportSettings, translate) {
        return rawTasks.map((task, index) =>
            new TaskItem(task, exportSettings, index, translate)
        );
    }

    // 驗證方法 - 使用統一的驗證器
    validate(exportSettings) {
        return taskValidator.validateTask(this.item, exportSettings);
    }

    // 檢查是否需要重新驗證
    needsRevalidation(oldSettings, newSettings) {
        return taskValidator.needsRevalidation(oldSettings, newSettings);
    }

    // Debug info - useful for development
    toDebugString() {
        return `TaskItem(${this.id}, ${this.status}, ${this.displayName})`;
    }
}

export default TaskItem;