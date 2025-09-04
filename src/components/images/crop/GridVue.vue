<script setup></script>

<template>
    <div class="grid-vue">
        <div class="third-line third-line-left"></div>
        <div class="third-line third-line-right"></div>
        <div class="third-line third-line-top"></div>
        <div class="third-line third-line-bottom"></div>

        <div class="border border-north-west"></div>
        <div class="border border-north"></div>
        <div class="border border-north-east"></div>
        <div class="border border-west"></div>
        <div class="border border-east"></div>
        <div class="border border-south-west"></div>
        <div class="border border-south"></div>
        <div class="border border-south-east"></div>
    </div>
</template>

<style lang="scss">
.grid-vue {
    z-index: 9487;
    position: absolute;
    @each $name in ('top', 'right', 'bottom', 'left') {
        #{$name}: 0;
    }
    container-type: size;
    .third-line {
        --color: var(--color-white-50);
        position: inherit;
        box-shadow: 0 0 0 1px var(--color);
        &.third-line-left,
        &.third-line-right {
            top: inherit;
            bottom: inherit;
        }
        &.third-line-top,
        &.third-line-bottom {
            left: inherit;
            right: inherit;
        }
        @each $name in ('top', 'right', 'bottom', 'left') {
            &.third-line-#{$name} {
                #{$name}: 33%;
            }
        }
    }
    .border {
        --color: var(--color-white);
        --size: 16px;
        --border-size: 4px;
        --min-size: 10px;
        position: inherit;
        box-sizing: border-box;

        &.border-north-west {
            top: 0;
            left: 0;
            width: var(--size);
            height: var(--size);
            border-top: var(--border-size) solid var(--color);
            border-left: var(--border-size) solid var(--color);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(-50%, -50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-north {
            top: 0;
            left: 50%;
            width: var(--size);
            height: var(--size);
            border-top: var(--border-size) solid var(--color);
            transform: translateX(-50%);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(-50%, -50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-north-east {
            top: 0;
            right: 0;
            width: var(--size);
            height: var(--size);
            border-top: var(--border-size) solid var(--color);
            border-right: var(--border-size) solid var(--color);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(50%, -50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-west {
            top: 50%;
            left: 0;
            width: var(--size);
            height: var(--size);
            border-left: var(--border-size) solid var(--color);
            transform: translateY(-50%);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(-50%, -50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-east {
            top: 50%;
            right: 0;
            width: var(--size);
            height: var(--size);
            border-right: var(--border-size) solid var(--color);
            transform: translateY(-50%);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(50%, -50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-south-west {
            bottom: 0;
            left: 0;
            width: var(--size);
            height: var(--size);
            border-bottom: var(--border-size) solid var(--color);
            border-left: var(--border-size) solid var(--color);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(-50%, 50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-south {
            bottom: 0;
            left: 50%;
            width: var(--size);
            height: var(--size);
            border-bottom: var(--border-size) solid var(--color);
            transform: translateX(-50%);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(-50%, 50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
        &.border-south-east {
            bottom: 0;
            right: 0;
            width: var(--size);
            height: var(--size);
            border-bottom: var(--border-size) solid var(--color);
            border-right: var(--border-size) solid var(--color);
            @container (width < 100px) or (height < 100px) {
                border: none;
                width: var(--min-size);
                height: var(--min-size);
                background: var(--color);
                transform: translate(50%, 50%);
            }
            @container (width < 25px) or (height < 25px) {
                display: none;
            }
        }
    }
}
</style>
