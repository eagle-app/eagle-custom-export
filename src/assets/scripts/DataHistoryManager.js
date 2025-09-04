/**
 * 這個類用於管理數據的歷史記錄，允許進行撤銷（undo）和重做（redo）操作。
 */
export default class {
    /**
     * @param {string} [data] - 可選擇性初始化時設定的原始數據
     */
    constructor(data = null) {
        this.original = data;
        this.current = data;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * 設定原始數據
     *
     * @param {string} data - 原始數據
     */
    setOriginal(data) {
        this.original = data;
        this.current = data;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * 獲取當前數據
     *
     * @return {string} 當前數據
     */
    get view() {
        return this.current;
    }

    /**
     * 添加新數據
     *
     * @param {string} data - 新數據
     */
    add(data) {
        if (!data) return;
        if (this.original === null) {
            this.setOriginal(data);
        } else {
            this.undoStack.push(this.current);
            this.current = data;
            this.redoStack = [];
        }
    }

    /**
     * 撤銷操作
     */
    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.current);
            this.current = this.undoStack.pop();
        } else {
            console.warn('No more undos available');
        }
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.current);
            this.current = this.redoStack.pop();
        } else {
            console.warn('No more redos available');
        }
    }

    /**
     * 重置
     */
    reset() {
        this.original = null;
        this.current = null;
        this.undoStack = [];
        this.redoStack = [];
    }
}
