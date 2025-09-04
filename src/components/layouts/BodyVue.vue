<script setup></script>

<template>
    <div class="body-vue">
        <slot></slot>
    </div>
</template>

<style lang="scss">
.body-vue {
    position: relative;
    height: 100%;
    border-radius: inherit;
    overflow: overlay;
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
}
</style>
