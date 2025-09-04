<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue';
import ComboBoxVue from '@/components/tools/ComboBoxVue.vue';

// 注入 main 實例和關閉面板方法
const main = inject('main');
const closeCreatePanel = inject('closeCreatePanel');

// 注入編輯模式相關變數
const editMode = inject('editMode', ref(false));
const editingPreset = inject('editingPreset', ref(null));
const editingIndex = inject('editingIndex', ref(-1));

// 響應式數據
const presetName = ref('');

const format = ref('');

const formatOptions = ref([
    {
        label: 'original',
        options: ['original']
    },
    {
        label: 'common',
        options: ['jpg', 'png', 'bmp', 'gif', 'tif', 'ico']
    },
    {
        label: 'nextGen',
        options: ['webp', 'avif']
    },
    {
        label: 'other',
        options: ['hdr', 'exr', 'tga']
    },
    {
        label: 'video',
        options: ['mp4', 'webm']
    }
]);

// 下拉選單狀態
const dropdownStates = ref({
    format: false,
    quality: false,
    size: false,
    fps: false, // FPS 下拉選單狀態
    codec: false // 新增 Codec 下拉選單狀態
});

const quality = ref();
// 使用 for 循環生成品質選項 (100, 95, 90, ..., 5)
const generateQualityOptions = () => {
    const options = [];
    for (let i = 100; i > 0; i -= 5) {
        options.push(i);
    }
    return options;
};
const qualityOptions = ref(generateQualityOptions());
const sizeType = ref();
const sizeValue = ref(900);
const sizeOptions = ref([
    'original',
    'maxWidth',
    'maxHeight',
    'minWidth',
    'minHeight',
    'maxSide',
    'minSide'
]);

// 新增：動畫 FPS 設定
const animatedFps = ref(30);
const fpsOptions = ref([10, 15, 24, 30, 60]);

// 新增：編解碼器設定
const codec = ref('');
const codecOptions = ref([
    {
        label: 'mp4',
        options: ['h264', 'h265']
    },
    {
        label: 'webm',
        options: ['vp8', 'vp9']
    }
]);

const updateDropdownState = (key, visible) => {
    dropdownStates.value[key] = visible;
};

const showQualityOption = computed(() => {
    // 需要quality參數的格式（有損格式）
    const qualityFormats = ['jpg', 'jpeg', 'webp', 'avif', 'jxl', 'mp4', 'webm'];
    return qualityFormats.includes(format.value);
});

// 新增：是否顯示 FPS 設定
const showFpsOption = computed(() => {
    // 支援動畫的格式
    const animatedFormats = ['gif', 'webp', 'mp4', 'webm'];
    return animatedFormats.includes(format.value);
});

// 新增：是否顯示編解碼器設定
const showCodecOption = computed(() => {
    // 需要編解碼器選擇的格式
    const codecFormats = ['mp4', 'webm'];
    return codecFormats.includes(format.value);
});

// 獲取當前格式的編解碼器選項
const getCodecOptions = () => {
    return codecOptions.value.find(option => option.label === format.value)?.options || [];
};

// 編解碼器選項列表
const codecOptionsList = computed(() => {
    return getCodecOptions();
});

// 獲取預設編解碼器
const getDefaultCodec = () => {
    const options = getCodecOptions();
    if (options.includes(codec.value)) {
        return codec.value;
    }
    codec.value = options[0] || '';    
    return codec.value;
};

// 預設編解碼器
const defaultCodec = computed(() => {
    return getDefaultCodec();
});

const showSizeInput = computed(() => {
    return sizeType.value !== 'original' && sizeType.value !== '';
});

// 驗證 sizeValue, startNumber 數值合法性的函數
const validateNumberValue = (event, fieldType) => {
    const currentValue = event.target.value;
    const numValue = Number(currentValue);

    // 檢查是否為有效數字
    if (!isNaN(numValue) && currentValue !== '') {
        // 根據欄位類型更新對應的響應式數據
        if (fieldType === 'startNumber') {
            startNumber.value = Math.max(1, Math.floor(numValue)); // 確保至少為1且為整數
        } else if (fieldType === 'sizeValue') {
            sizeValue.value = Math.max(1, Math.floor(numValue)); // 確保至少為1
        }
    } else {
        // 如果無效，恢復原值
        if (fieldType === 'startNumber') {
            event.target.value = startNumber.value;
        } else if (fieldType === 'sizeValue') {
            event.target.value = sizeValue.value;
        }
    }
};

// 初始化表單值的函數
const initializeFormValues = () => {
    if (editMode.value && editingPreset.value) {
        console.log('初始化編輯表單值:', editingPreset.value);
        presetName.value = editingPreset.value.name || '';
        format.value = editingPreset.value.format || '';
        quality.value = editingPreset.value.quality || '';
        sizeType.value = editingPreset.value.sizeType || '';
        sizeValue.value = editingPreset.value.sizeValue || '';
        animatedFps.value = editingPreset.value.animatedFps || '';
        codec.value = editingPreset.value.codec || '';
    } else {
        // 重置表單值（新建模式）
        presetName.value = '';
        format.value = '';
        quality.value = '';
        sizeType.value = '';
        sizeValue.value = 900;
        animatedFps.value = 30;
        codec.value = '';
    }
};

// 在 onMounted 中初始化表單值
onMounted(() => {
    initializeFormValues();
});

// 監聽編輯模式變化
watch([editMode, editingPreset], () => {
    console.log('編輯模式變化:', editMode.value, editingPreset.value);
    initializeFormValues();
}, { immediate: true });

// 修改 handleCreatePreset 支援編輯模式
const handleCreatePreset = () => {
    // 檢查預設名稱是否填寫
    if (!presetName.value) {
        console.warn('預設名稱不能為空');
        return;
    }

    // 從 localStorage 獲取現有的設定
    const existingSettings = JSON.parse(localStorage.getItem(main.localStorageKey) || '{}');

    // 初始化 preset 陣列（如果不存在）
    if (!existingSettings.preset) {
        existingSettings.preset = [];
    }

    // 準備要儲存的預設參數
    const presetData = {
        id: editMode.value ? editingPreset.value.id : Date.now().toString(),
        name: presetName.value,
        format: format.value,
        quality: quality.value,
        sizeType: sizeType.value,
        sizeValue: sizeValue.value,
        animatedFps: animatedFps.value,
        codec: codec.value,
        createdAt: editMode.value ? editingPreset.value.createdAt : new Date().toISOString()
    };    

    if (editMode.value) {
        // 編輯模式：更新現有預設
        existingSettings.preset[editingIndex.value] = presetData;
    } else {
        // 建立模式：新增預設
        existingSettings.preset.push(presetData);
    }

    // 儲存回 localStorage
    localStorage.setItem(main.localStorageKey, JSON.stringify(existingSettings));

    // 更新 main 的 localStorageSetting
    main.localStorageSetting = existingSettings;

    // 清空表單
    presetName.value = '';

    // 觸發成功通知
    console.log(editMode.value ? '預設參數已更新:' : '預設參數已儲存:', presetData);

    // 關閉建立面板，返回預設列表
    if (closeCreatePanel) {
        closeCreatePanel();
    }
};

const validateForm = () => {
    const validateQuality = showQualityOption.value ? quality.value : true;
    const validateFps = showFpsOption.value ? animatedFps.value : true;
    const validateCodec = showCodecOption.value ? codec.value : true;
    return presetName.value && format.value && validateQuality && validateFps && validateCodec && sizeType.value;
};

// 監聽格式變化，重置編解碼器
watch(() => format.value, () => {
    if (showCodecOption.value) {
        codec.value = getCodecOptions()[0] || '';
    }
});

</script>

<template>
    <div class="preset-settings">
        <div class="settings-header">

            <span class="header-title">{{ $translate('main.SettingSidebar.preset.settings.title') }}</span>

            <button class="header-button" @click="closeCreatePanel" tabindex="99">
                <el-icon class="icon icon-close"></el-icon>
            </button>
        </div>

        <div class="settings-content">

            <div class="settings-option">
                <label>{{ $translate('main.SettingSidebar.preset.settings.nameLabel') }}</label>

                <input type="text" class="settings-input settings-size-input" :tabindex="5" v-model="presetName"
                    :placeholder="$translate('main.SettingSidebar.preset.settings.namePlaceholder')" />
            </div>

            <div class="settings-option">
                <label>{{ $translate('main.SettingSidebar.format.label') }}</label>

                <ComboBoxVue v-model="format" :options="formatOptions"
                    :placeholder="$translate('main.SettingSidebar.preset.settings.selectPlaceholder')"
                    :translate-prefix="'main.SettingSidebar.format.format-options.'" class="settings-combobox"
                    @visible-change="(visible) => updateDropdownState('format', visible)" :tabindex="1"
                    :aria-label="$translate('main.SettingSidebar.format.label')" required />
            </div>

            <!-- 品質設置 -->
            <div class="settings-option" v-if="showQualityOption">
                <label>{{ $translate('main.SettingSidebar.quality.label') }}</label>

                <ComboBoxVue v-model="quality" :options="qualityOptions" class="settings-combobox"
                    :placeholder="$translate('main.SettingSidebar.preset.settings.selectPlaceholder')"
                    :class="dropdownStates.quality ? 'is-active' : ''"
                    @visible-change="(visible) => updateDropdownState('quality', visible)" :tabindex="2"
                    :aria-label="$translate('main.SettingSidebar.quality.label')" />
            </div>

            <!-- FPS 設置（動畫格式） -->
            <div class="settings-option" v-if="showFpsOption">
                <label>{{ $translate('main.SettingSidebar.fps.label') }}</label>

                <ComboBoxVue v-model="animatedFps" :options="fpsOptions" class="settings-combobox"
                    :placeholder="$translate('main.SettingSidebar.preset.settings.selectPlaceholder')"
                    :class="dropdownStates.fps ? 'is-active' : ''"
                    @visible-change="(visible) => updateDropdownState('fps', visible)" :tabindex="3" />
            </div>

            <!-- Codec 設置（視頻格式） -->
            <div class="settings-option" v-if="showCodecOption">
                <label>{{ $translate('main.SettingSidebar.codec.label') }}</label>

                <ComboBoxVue :model-value="defaultCodec" @update:model-value="codec = $event"
                    :options="codecOptionsList" class="settings-combobox"
                    :placeholder="$translate('main.SettingSidebar.preset.settings.selectPlaceholder')"
                    :translate-prefix="'main.SettingSidebar.codec.codec-options.'"
                    :class="dropdownStates.codec ? 'is-active' : ''"
                    @visible-change="(visible) => updateDropdownState('codec', visible)" :tabindex="4" />
            </div>

            <!-- 尺寸設置 -->
            <div class="settings-option">
                <label>{{ $translate('main.SettingSidebar.size.label') }}</label>

                <ComboBoxVue v-model="sizeType" :options="sizeOptions"
                    :translate-prefix="'main.SettingSidebar.size.size-options.'" class="settings-combobox"
                    :placeholder="$translate('main.SettingSidebar.preset.settings.selectPlaceholder')"
                    :class="dropdownStates.size ? 'is-active' : ''"
                    @visible-change="(visible) => updateDropdownState('size', visible)" :tabindex="4"
                    :aria-label="$translate('main.SettingSidebar.size.label')" />
            </div>

            <!-- 尺寸數值輸入 -->
            <div class="settings-option" v-if="showSizeInput">
                <label>
                    {{ $translate('main.SettingSidebar.size.size-options.' + sizeType) }}
                </label>
                <div class="size-input-wrapper">
                    <input type="text" :value="sizeValue" class="settings-input settings-size-input" @keydown="
                        (e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()
                    " @blur="validateNumberValue($event, 'sizeValue')" :tabindex="5" :aria-label="$translate('main.SettingSidebar.size.size-options.' + sizeType)
                        " />
                    <span class="unit">{{ $translate('main.SettingSidebar.preset.settings.pixelUnit') }}</span>
                </div>
            </div>

            <el-button type="primary" @click="handleCreatePreset" :tabindex="9" class="create-preset-button"
                :disabled="!validateForm()">
                {{ editMode ? $translate('main.SettingSidebar.preset.settings.updatePreset') :
                    $translate('main.SettingSidebar.preset.settings.createPreset') }}
            </el-button>
        </div>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.preset-settings {
    width: 100%;

    .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 48px;
        padding: 0 12px;
        user-select: none;
        flex-shrink: 0;
        width: 100%;
        padding-left: 16px;
        padding-right: 12px;
        border-bottom: 1px solid var(--color-border-secondary);
        font-size: 14px;
        font-weight: var(--font-weight-bold);

    }

    .settings-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;

        // 設置選項通用樣式
        .settings-option {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 32px;
            padding: 0 0 0 4px;
            gap: 8px;

            >label {
                flex-shrink: 0;
                font-size: 13px;
                font-weight: var(--font-weight-normal);
                color: var(--color-text-secondary);
                line-height: 20px;
                min-width: 60px;
                text-align: left;
                user-select: none;
                flex: 0 0 auto;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }

            // 輸入框樣式
            .settings-input {
                height: 32px;
                outline: 1px solid var(--color-border-primary);
                outline-offset: -1px;
                border-radius: 6px;
                padding: 0 10px;
                color: var(--color-text-primary);
                font-size: 13px;

                &::placeholder {
                    color: var(--color-text-tertiary);
                }

                background: var(--color-white-50);

                @include mixins.dark {
                    background: var(--color-black-20);
                }

                &:focus {
                    outline: none;
                    border-color: var(--color-primary);
                }
            }

            // 尺寸輸入包裝器
            .size-input-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 120px;

                .settings-input {
                    flex: 1;
                    width: 88px;
                }

                .unit {
                    font-size: 13px;
                    color: var(--color-text-secondary);
                    flex-shrink: 0;
                }
            }

        }
    }

}

// 下拉選單樣式
.settings-combobox {
    min-width: 120px;
    max-width: 120px;
    height: 32px;

    .combobox-button {
        width: 100%;
        height: 100%;
        background: var(--color-white-50);
        border: none;
        outline: 1px solid var(--color-border-primary);
        outline-offset: -1px;

        &:hover {
            background: var(--color-bg-hover);
        }
    }

    @include mixins.dark {
        .combobox-button {
            background: var(--color-black-20);
        }
    }

    .is-active {
        outline: 1px solid var(--color-primary);
        outline-offset: -1px;
    }
}
</style>