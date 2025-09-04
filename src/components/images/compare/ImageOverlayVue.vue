<script setup></script>

<template>
    <div class="overlap-vue">
        <slot name="one"></slot>
        <slot name="two"></slot>
    </div>
</template>

<style lang="scss">
.overlap-vue {
    * {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        &:nth-child(2) {
            opacity: 0.5;
        }
    }
}
</style>
