<script setup></script>

<template>
    <div class="image-sync-vue">
        <div>
            <slot name="one"></slot>
        </div>
        <div class="line">
            <slot name="two"></slot>
        </div>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.image-sync-vue {
    width: 100%;
    height: 100%;
    display: flex;
    & > div {
        flex: 1;
        overflow: hidden;
    }
    .line {
        border-left: 1px solid var(--color-border-primary);
    }
}
</style>
