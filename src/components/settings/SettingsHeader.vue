<template>
  <div class="settings-header">
    <div class="header-drag">
      <img class="header-icon" src="/logo.png" :alt="$translate('main.SettingSidebar.header.iconAlt')" />
      <span class="header-title">{{ $translate('manifest.app.name') }}</span>
    </div>
    <div class="button-group">
      <PresetDialogVue />
      <button class="header-button" @click="handleClose"
        :aria-label="$translate('main.SettingSidebar.header.close')" tabindex="99">
        <el-icon class="icon icon-close"></el-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import PresetDialogVue from '@/components/settings/preset/presetDialogVue.vue';

// 簡潔明了 - 只負責頭部邏輯
const handleClose = () => {
  window.close();
};
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  user-select: none;
  flex-shrink: 0;

  .header-drag {
    -webkit-app-region: drag;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;

    .header-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
    }

    .header-title {
      color: var(--color-text-primary);
      font-size: 14px;
      font-weight: var(--font-weight-bold);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .button-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  :deep(.header-button) {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all var(--animation-normal);
    background: transparent;
    opacity: 0.8;

    &:hover,
    &.is-active {
      background: var(--color-bg-hover);
      opacity: 1;
    }
  }
}
</style>