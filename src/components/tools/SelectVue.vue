<template>
    <el-dropdown
        ref="dropdown"
        trigger="click"
        :class="dropdownClass"
        placement="bottom-start"
        :popper-options="{
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [-1, 5]
                    }
                }
            ]
        }"
        @visible-change="handleVisibleChange"
        v-bind="$attrs"
    >
        <slot>
            <span class="el-dropdown-link">
                {{ displayLabel }}
            </span>
        </slot>
        <template #dropdown>
            <div class="select-wrapper">
                <!-- 搜尋欄位 - 可控制顯示 -->
                <div v-if="showSearch" class="search-header" @click.stop>
                    <el-icon class="icon icon-search"></el-icon>
                    <input
                        ref="searchInput"
                        v-model="searchQuery"
                        type="text"
                        class="search-input"
                        :placeholder="$translate('search')"
                        @keydown="handleKeyDown"
                    />
                </div>
                <!-- 選項列表 -->
                <el-dropdown-menu ref="dropdownMenu">
                    <el-dropdown-item
                        v-for="(option, index) in filteredOptions"
                        :key="option.value || option"
                        :class="{
                            active: currentIndex === index,
                            selected: isSelected(option)
                        }"
                        @click="handleSelect(option)"
                        @mouseenter="currentIndex = index"
                    >
                        <span v-if="translatePrefix">
                            {{ $translate(translatePrefix + option) }}
                        </span>
                        <span v-else>
                            {{ option.label || option }}
                        </span>
                    </el-dropdown-item>
                    <div v-if="filteredOptions.length === 0" class="no-results">
                        {{ $translate('main.itemExportFormat.format-options.no-results') }}
                    </div>
                </el-dropdown-menu>
            </div>
        </template>
    </el-dropdown>
</template>

<script>
export default {
    name: 'SelectVue',
    props: {
        modelValue: {
            type: [String, Number, Object],
            default: null
        },
        options: {
            type: Array,
            required: true
        },
        dropdownClass: {
            type: String,
            default: ''
        },
        showSearch: {
            type: Boolean,
            default: false
        },
        translatePrefix: {
            type: String,
            default: ''
        }
    },
    emits: ['update:modelValue', 'visible-change'],
    data() {
        return {
            searchQuery: '',
            currentIndex: 0,
            isVisible: false
        };
    },
    computed: {
        displayLabel() {
            if (!this.modelValue) return '';

            // 如果有翻譯前綴，使用翻譯
            if (this.translatePrefix) {
                return this.$translate(this.translatePrefix + this.modelValue);
            }

            // 如果是物件，返回 label
            if (typeof this.modelValue === 'object' && this.modelValue.label) {
                return this.modelValue.label;
            }

            return this.modelValue;
        },
        filteredOptions() {
            // 如果沒有搜尋功能或沒有搜尋查詢，直接返回所有選項
            if (!this.showSearch || !this.searchQuery) return this.options;

            const query = this.searchQuery.toLowerCase();
            return this.options.filter((option) => {
                // 獲取選項的顯示文字
                let label = '';
                if (typeof option === 'string') {
                    // 如果有翻譯前綴，使用翻譯後的文字
                    if (this.translatePrefix) {
                        label = this.$translate(this.translatePrefix + option) || option;
                    } else {
                        label = option;
                    }
                } else if (option.label) {
                    label = option.label;
                }

                // 同時搜尋值和標籤
                const value = (option.value || option).toString().toLowerCase();
                label = label.toString().toLowerCase();

                return label.includes(query) || value.includes(query);
            });
        }
    },
    watch: {
        filteredOptions() {
            // 重置高亮索引，但要確保不超出範圍
            this.currentIndex = this.filteredOptions.length > 0 ? 0 : -1;
        }
    },
    methods: {
        handleVisibleChange(visible) {
            this.isVisible = visible;
            this.$emit('visible-change', visible);

            if (visible) {
                // 重置搜尋
                this.searchQuery = '';

                // 重置高亮索引
                this.currentIndex = this.options.length > 0 ? 0 : -1;

                // 只有在顯示搜尋功能時才自動聚焦搜尋框
                if (this.showSearch) {
                    this.$nextTick(() => {
                        setTimeout(() => {
                            const searchInput = this.$refs.searchInput;
                            if (searchInput) {
                                searchInput.focus();
                                searchInput.select(); // 選中所有文字（如果有的話）
                            }
                        }, 50); // 給一點時間讓 dropdown 完全展開
                    });
                }
            }
        },
        handleSelect(option) {
            const value = option.value || option;
            this.$emit('update:modelValue', value);
            this.$refs.dropdown.handleClose();
        },
        isSelected(option) {
            const value = option.value || option;
            return value === this.modelValue;
        },
        handleKeyDown(event) {
            const { key } = event;

            switch (key) {
                case 'ArrowUp':
                    event.preventDefault();
                    if (this.filteredOptions.length === 0) return;

                    if (this.currentIndex > 0) {
                        this.currentIndex--;
                    } else {
                        this.currentIndex = this.filteredOptions.length - 1;
                    }
                    this.scrollToActive();
                    break;

                case 'ArrowDown':
                    event.preventDefault();
                    if (this.filteredOptions.length === 0) return;

                    if (this.currentIndex < this.filteredOptions.length - 1) {
                        this.currentIndex++;
                    } else {
                        this.currentIndex = 0;
                    }
                    this.scrollToActive();
                    break;

                case 'Enter':
                    event.preventDefault();
                    if (this.filteredOptions.length > 0 && this.currentIndex >= 0) {
                        this.handleSelect(this.filteredOptions[this.currentIndex]);
                    }
                    break;

                case 'Escape':
                    event.preventDefault();
                    this.$refs.dropdown.handleClose();
                    break;
            }
        },
        scrollToActive() {
            this.$nextTick(() => {
                try {
                    // 使用 ref 直接訪問元素
                    const dropdownMenu = this.$refs.dropdownMenu?.$el;
                    const activeItem = dropdownMenu?.querySelector(
                        '.el-dropdown-menu__item.active'
                    );

                    if (!dropdownMenu || !activeItem) {
                        // 備用方案：使用 document 查詢
                        const fallbackMenu = document.querySelector('.el-dropdown-menu');
                        const fallbackActiveItem = fallbackMenu?.querySelector(
                            '.el-dropdown-menu__item.active'
                        );

                        if (fallbackMenu && fallbackActiveItem) {
                            fallbackActiveItem.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                                inline: 'nearest'
                            });
                        }
                        return;
                    }

                    // 使用 scrollIntoView
                    activeItem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'nearest'
                    });
                } catch (error) {
                    // 靜默處理錯誤
                }
            });
        }
    }
};
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.select-wrapper {
    // width: 120px;
    min-width: 120px;
    max-width: 140px;
}

.search-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 36px;
    border-bottom: 1px solid var(--color-white-10);
    background: transparent;
    border-radius: 6px 6px 0 0;

    .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 13px;
        line-height: 20px;
        width: 100%;
        color: var(--color-text-secondary);

        &::placeholder {
            color: var(--color-text-secondary);
        }
    }
}

// 整個 dropdown 容器的樣式 - 修復對齊和寬度問題
:deep(.el-dropdown__popper) {
    // 確保下拉選單與觸發器對齊
    transform-origin: center top !important;

    .el-dropdown__list {
        width: 120px !important;
        min-width: 120px !important;
        max-width: 120px !important;
        box-sizing: border-box;

        .el-dropdown-menu {
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            max-height: 300px;
            overflow-y: auto;
            overflow-x: hidden; // 防止橫向滾動條
            padding: 4px;
            scroll-behavior: smooth;
            gap: 2px;
            display: flex;
            flex-direction: column;
            margin: 0;
            box-sizing: border-box;
        }
    }
}

// 覆蓋 el-dropdown 的預設樣式以匹配 Figma 設計
:deep(.el-dropdown-menu) {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden; // 防止橫向滾動條
    padding: 4px;
    scroll-behavior: smooth;
    gap: 2px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .el-dropdown-menu__item {
        height: 28px !important;
        line-height: 20px !important;
        padding: 4px !important;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        box-sizing: border-box;
        width: 100%;
        min-width: 0; // 防止 flex 項目溢出

        &:before {
            width: 20px;
            height: 20px;
            margin-right: 0;
            flex-shrink: 0;
        }

        &.active {
            background-color: var(--color-bg-selected);
            border-radius: 6px;

            &:before {
                opacity: 0 !important; // 鍵盤導航不顯示打勾
            }
        }

        &.selected {
            &:before {
                opacity: 1 !important; // 只有已選中項目顯示打勾
            }
        }
    }
}

.no-results {
    padding: 12px;
    text-align: center;
    color: var(--color-text-tertiary);
    font-size: 13px;
}
</style>
