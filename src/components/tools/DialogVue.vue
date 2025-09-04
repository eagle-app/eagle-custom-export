<!-- 對話框組件 -->
<script setup>
import { computed } from 'vue';
import ImageVue from '@/components/images/ImageVue.vue';
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
        required: true
    },
    type: {
        type: String,
        default: 'warning',
        required: true
    },
    closeOnClickModal: {
        type: Boolean,
        default: true
    },
    showCancelBtn: {
        type: Boolean,
        default: true
    },
    showOkBtn: {
        type: Boolean,
        default: true
    },
    // 新增：第三個按鈕支援
    showThirdBtn: {
        type: Boolean,
        default: false
    },
    thirdBtnType: {
        type: String,
        default: 'default'
    }
});

const emit = defineEmits(['ok', 'cancel', 'third', 'update:modelValue']);

const ok = () => {
    emit('ok');
    visible.value = false;
};

const cancel = () => {
    emit('cancel');
    visible.value = false;
};

const third = () => {
    emit('third');
    visible.value = false;
};

const visible = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value);
    }
});
</script>

<template>
    <el-dialog
        v-model="visible"
        class="dialog-vue"
        append-to-body
        align-center
        @close="cancel"
        :close-on-click-modal="props.closeOnClickModal"
    >
        <div class="dialog-container">
            <ImageVue
                class="dialog-icon"
                width="36"
                height="36"
                :src="`light/base/dialog-${props.type}.png`"
                :darkSrc="`dark/base/dialog-${props.type}.png`"
            ></ImageVue>
            <div class="main">
                <div class="title">
                    <slot name="title">title</slot>
                </div>
                <div class="description">
                    <slot name="description">description</slot>
                </div>
                <div class="action" :class="{ 'action--three-buttons': props.showThirdBtn }">
                    <el-button class="cancel" type="" @click="cancel" v-if="props.showCancelBtn">
                        <slot name="cancel">cancel</slot>
                    </el-button>
                    <el-button
                        class="third"
                        :type="props.thirdBtnType"
                        @click="third"
                        v-if="props.showThirdBtn"
                    >
                        <slot name="third">third</slot>
                    </el-button>
                    <el-button class="ok" type="primary" @click="ok" v-if="props.showOkBtn">
                        <slot name="ok">ok</slot>
                    </el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;

.dialog-vue {
    padding: 24px;

    .dialog-container {
        display: flex;
        gap: 16px;
        flex-direction: row;

        .dialog-icon {
            margin-top: 0;
            width: 36px;
        }

        .main {
            flex: 1;
            max-width: 320px;

            .title {
                font-size: 16px;
                margin-bottom: 8px;
                line-height: 24px;
                color: var(--color-text-primary);
                font-weight: var(--font-weight-bold);
            }

            .description {
                font-size: 13px;
                line-height: 20px;
                margin-bottom: 12px;
                color: var(--color-text-secondary);
            }

            .action {
                display: flex;
                gap: 8px;
                justify-content: flex-end;

                .cancel,
                .third,
                .ok {
                    margin: 0;
                }

                .cancel {
                    &:only-child {
                        flex: 1;
                    }
                }

                .ok {
                    flex: 1;
                }

                .third {
                    flex: 1;
                }

                // 三按鈕佈局
                &.action--three-buttons {
                    .cancel {
                        max-width: 30%;
                    }

                    .third {
                        max-width: 30%;
                    }

                    .ok {
                        max-width: 40%;
                    }
                }
            }
        }
    }
}
</style>
