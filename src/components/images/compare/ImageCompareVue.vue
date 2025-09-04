<script setup>
import ImageSplitVue from './ImageSplitVue.vue';
import ImageSyncVue from './ImageSyncVue.vue';
import ImageOverlayVue from './ImageOverlayVue.vue';

const utils = require(`${__dirname}/modules/utils`);
const mousetrap = inject('mousetrap');

const props = defineProps({
    sync: {
        type: Boolean,
        default: true
    },
    split: {
        type: Boolean,
        default: true
    },
    overlap: {
        type: Boolean,
        default: true
    }
});

const typeIndex = ref(0);

const ratio = ref(0);
const pinchZoomOneEl = ref(null);
const pinchZoomTwoEl = ref(null);

onMounted(async () => {
    mousetrap.bind(['command+0', 'ctrl+0'], () => {
        pinchZoomOneEl.value.scale(1);
        pinchZoomTwoEl.value.scale(1);
        return false;
    });
    mousetrap.bind(['command+9', 'ctrl+9'], () => {
        pinchZoomOneEl.value.fit();
        pinchZoomTwoEl.value.fit();
        return false;
    });
    mousetrap.bind(['+', '=', 'command++', 'command+=', 'ctrl++', 'ctrl+='], () => {
        pinchZoomOneEl.value.scaleIn();
        pinchZoomTwoEl.value.scaleIn();
        return false;
    });
    mousetrap.bind(['-', 'command+-', 'ctrl+-'], () => {
        pinchZoomOneEl.value.scaleOut();
        pinchZoomTwoEl.value.scaleOut();
        return false;
    });
});

watchEffect(() => {
    ratio.value = pinchZoomOneEl.value?.offset.ratio;
});

const syncPinchZoomOne = async () => {
    await utils.time.sleep(1);
    const offset = pinchZoomTwoEl.value.offset;
    pinchZoomOneEl.value.setOffset(offset.x, offset.y, offset.ratio);
};

const syncPinchZoomTwo = async () => {
    await utils.time.sleep(1);
    const offset = pinchZoomOneEl.value.offset;
    pinchZoomTwoEl.value.setOffset(offset.x, offset.y, offset.ratio);
};
</script>

<template>
    <div class="image-compare-vue">
        <Component :is="[ImageSyncVue, ImageSplitVue, ImageOverlayVue][typeIndex]">
            <template #one>
                <PinchZoomVue
                    fit
                    class="pinch-zoom-one"
                    container=".image-compare-vue"
                    ref="pinchZoomOneEl"
                    :dragMove="true"
                    @mousemove.prevent="syncPinchZoomTwo"
                    @wheel.prevent="syncPinchZoomTwo"
                >
                    <slot name="one"></slot>
                </PinchZoomVue>
            </template>
            <template #two>
                <PinchZoomVue
                    fit
                    class="pinch-zoom-two"
                    container=".image-compare-vue"
                    ref="pinchZoomTwoEl"
                    :dragMove="true"
                    @mousemove.prevent="syncPinchZoomOne"
                    @wheel.prevent="syncPinchZoomOne"
                >
                    <slot name="two"></slot>
                </PinchZoomVue>
            </template>
        </Component>
    </div>
    <div class="toolbar">
        <slot name="prefix"></slot>
        <div class="toolbar-group">
            <SlideBarVue
                v-model="ratio"
                class="toolbar-group-item no-hover"
                :data="pinchZoomOneEl?.scaleStep ?? []"
                @changed="
                    (value) => {
                        pinchZoomOneEl?.scale(value);
                        pinchZoomTwoEl?.scale(value);
                    }
                "
            ></SlideBarVue>
            <el-dropdown
                class="toolbar-group-item"
                style="width: 76px"
                trigger="click"
                placement="top"
            >
                {{ Math.round(pinchZoomOneEl?.offset.ratio * 100) }}%
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                            class="keyboard"
                            :class="{
                                active: pinchZoomOneEl?.offset.ratio === i
                            }"
                            v-for="i in pinchZoomOneEl?.scaleStep ?? []"
                            :key="i"
                            @click="
                                () => {
                                    pinchZoomOneEl?.scale(i);
                                    pinchZoomTwoEl?.scale(i);
                                }
                            "
                        >
                            {{ i * 100 }}%
                        </el-dropdown-item>
                        <el-dropdown-item
                            class="keyboard no-tick"
                            @click="
                                () => {
                                    pinchZoomOneEl?.scale(1);
                                    pinchZoomTwoEl?.scale(1);
                                }
                            "
                            divided
                        >
                            <div class="name">
                                {{ $translate('component.compare.toolbar.scale.origin') }}
                            </div>
                            <keys>
                                <key v-for="key in [$keyboard('⌘'), '0']" :key="key">{{ key }}</key>
                            </keys>
                        </el-dropdown-item>
                        <el-dropdown-item
                            class="keyboard no-tick"
                            @click="
                                () => {
                                    pinchZoomOneEl?.fit();
                                    pinchZoomTwoEl?.fit();
                                }
                            "
                        >
                            <div class="name">
                                {{ $translate('component.compare.toolbar.scale.fit') }}
                            </div>
                            <keys>
                                <key v-for="key in [$keyboard('⌘'), '9']" :key="key">{{ key }}</key>
                            </keys>
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <slot></slot>
        <div class="toolbar-group">
            <template v-for="(type, index) in ['sync', 'split', 'overlap']" :key="type">
                <div
                    v-if="props[type]"
                    v-tippy="{
                        content: t(`component.compare.${type}.tip`),
                        delay: [0, 0],
                        duration: [200, 0]
                    }"
                    class="toolbar-group-item"
                    :class="{ active: typeIndex === index }"
                    @click="typeIndex = index"
                >
                    <ImageVue
                        width="15"
                        height="16"
                        :src="`light/base/ic-image-compare-${type}.svg`"
                        :darkSrc="`dark/base/ic-image-compare-${type}.svg`"
                    ></ImageVue>
                </div>
            </template>
        </div>
        <slot name="postfix"></slot>
    </div>
</template>

<style lang="scss">
@use '@styles/modules/mixins' as mixins;
.image-compare-vue {
    width: 100%;
    height: 100%;
    position: relative;
}
.toolbar {
    display: flex;
    gap: 8px;
    position: absolute;
    bottom: 16px;
    width: calc(100% - 240px);
    justify-content: center;
    .toolbar-group {
        display: flex;
        border-radius: 4px;
        background: var(--box-background);
        border-top: var(--box-border-top);
        border-left: var(--box-border-left);
        border-right: var(--box-border-right);
        border-bottom: var(--box-border-bottom);
        box-shadow: var(--box-border-shadow);
        backdrop-filter: var(--box-background-blur);
        .toolbar-group-item {
            display: flex;
            position: relative;
            min-width: 32px;
            height: 32px;
            line-height: 32px;
            padding: 0 4px;
            border-radius: 0;
            align-items: center;
            justify-content: center;
            &:only-child {
                border-radius: 4px;
            }
            &:first-child {
                border-radius: 4px 0 0 4px;
            }
            &:last-child {
                border-radius: 0 4px 4px 0;
            }
            &:not(.no-hover):hover {
                background-color: var(--color-bg-hover);
            }
            &.active {
                background-color: var(--color-bg-active);
                &:hover {
                    background-color: var(--color-bg-active);
                }
            }
            &:not(:first-child) {
                &::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 1px;
                    height: 100%;
                    background: var(--color-border-secondary);
                }
            }
        }
    }
}
</style>
