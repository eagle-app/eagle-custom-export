<script setup></script>

<template>
    <two-up class="image-split-vue" legacy-clip-compat>
        <slot name="one"></slot>
        <slot name="two"></slot>
    </two-up>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.image-split-vue {
    width: 100%;
    height: 100%;
    .styles_two-up-handle__2kVsP {
        --bar-size: 1px;
        position: relative;
        &::before {
            position: absolute;
            content: '';
            background: var(--color-white-25);
            box-shadow: none;
            left: calc(50% - var(--bar-size));
        }
        &::after {
            content: '';
            position: absolute;
            background: var(--color-black-25);
            width: var(--bar-size);
            height: 100%;
            left: 50%;
        }
        .styles_scrubber__39cN6 {
            --thumb-size: 48px;
            --background-color: var(--color-theme-90);
            --box-shadow: 0 0 4px 0 var(--color-black-10);
            @include mixins.dark {
                --box-shadow:
                    0 0 4px 0 var(--color-black-10), 0 0 0 1px var(--color-black-10),
                    0 0 0 1px var(--color-white-25) inset;
            }
            height: var(--thumb-size);
            box-shadow: var(--box-shadow);
            border: none;
            background: var(--background-color);
            backdrop-filter: blur(20px);
            z-index: 1;
            > * {
                display: none;
            }
            &::before,
            &::after {
                content: '';
                width: 6.5px;
                height: 12px;
                background-repeat: no-repeat;
                margin: auto;
            }
            &::before {
                --background-image: url('/images/light/base/ic-image-compare-split-left-arrow.svg');
                @include mixins.dark {
                    --background-image: url('/images/dark/base/ic-image-compare-split-left-arrow.svg');
                }
                background-image: var(--background-image);
            }
            &::after {
                --background-image: url('/images/light/base/ic-image-compare-split-right-arrow.svg');
                @include mixins.dark {
                    --background-image: url('/images/dark/base/ic-image-compare-split-right-arrow.svg');
                }
                background-image: var(--background-image);
            }
        }
    }
}
</style>
