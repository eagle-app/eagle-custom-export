<template>
    <div class="video-export__footer"></div>

    <DialogVue v-model="replaceDialog.visible" :type="replaceDialog.type" @ok="replaceDialog.ok">
        <template #title>{{ $translate('footer.dialog.replace.title') }}</template>
        <template #description>{{ $translate('footer.dialog.replace.description') }}</template>
        <template #cancel>{{ $translate('footer.dialog.replace.cancel') }}</template>
        <template #ok>{{ $translate('footer.dialog.replace.ok') }}</template>
    </DialogVue>

    <DialogVue
        v-model="errorDialog.visible"
        :type="errorDialog.type"
        @ok="errorDialog.ok"
        :showOkBtn="false"
    >
        <template v-if="main.errorType != 'unknownError'" #title>{{
            $translate(`footer.dialog.error.${main.errorType}.title`)
        }}</template>
        <template v-else #title>{{
            $translate('footer.dialog.error.unknownError.title')
        }}</template>

        <template v-if="main.errorType != 'unknownError'" #description>
            {{ $translate(`footer.dialog.error.${main.errorType}.description`) }}
        </template>
        <template v-else #description>
            <textarea class="error-description" readonly v-model="main.errorDescription"></textarea>
        </template>

        <template #cancel>{{ $translate(`footer.dialog.error.close`) }}</template>
    </DialogVue>
</template>

<script setup>
import { inject, ref, reactive } from 'vue';

const main = inject('main');
const exportSettings = inject('exportSettings');
const isExporting = ref(false);
const currentFrame = ref(0);
const totalFrames = ref(0);

const errorDialog = reactive({
    visible: false,
    type: 'warning',
    cancel: () => {
        errorDialog.visible = false;
        isExporting.value = false;
        return;
    }
});


</script>

<style scoped lang="scss">
.video-export__footer {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.button-section {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--color-border-primary);
}

.button-section--exporting {
    border: none;
}

.progress-section {
    position: relative;
    height: 36px;
    border-radius: 6px;
    overflow: hidden;
    width: 100%;
}

.progress-bar {
    width: 100%;
    height: 2px;
    background: var(--color-border-primary);
    border-radius: 1px;
    overflow: hidden;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: -1px;
        left: -1px;
        right: -1px;
        bottom: -1px;
        border: 1px solid var(--color-primary);
        border-radius: 2px;
        opacity: 0.3;
    }

    &__fill {
        height: 100%;
        background: var(--color-primary);
        transition: width var(--animation-normal);
    }
}

.progress-text {
    position: absolute;
    width: 100%;
    text-align: center;
    top: 75%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 13px;
    color: var(--color-text-primary);
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.export-button {
    width: 100%;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    border: 1px solid var(--color-border-primary);
    background: var(--color-primary);
    color: var(--color-white);

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &__text {
        font-weight: var(--font-weight-bold);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
}

.error-description {
    max-width: 258px;
    max-height: 60px;
    min-width: 200px;
    min-height: 50px;
    border: none;
    outline: none;

    &:focus {
        outline: var(--color-primary) 1px solid;
    }
}
</style>
