<script setup>
const props = defineProps({
    width: {
        type: Number
    },
    height: {
        type: Number
    },
    offset: {
        type: Object,
        default: () => ({
            x: 0,
            y: 0,
            ratio: 1
        })
    }
});

const emit = defineEmits(['selectionAdded', 'selectionRemoved', 'selectionToggled']);

const boundary = {
    width: 0,
    height: 48
};

const min_width = 50;
const min_height = 50;

const location = reactive({
    x: 0,
    y: 0
});

const isCropping = ref(false);

const selections = ref([]);

const currentSelection = ref(null);
const hoverSelection = ref(null);

const croppingSelection = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0
});

const onMouseDown = (event) => {
    isCropping.value = true;
    croppingSelection.x = event.x - boundary.width;
    croppingSelection.y = event.y - boundary.height;
    croppingSelection.width = 0;
    croppingSelection.height = 0;
    toggle(null);
};

const onMouseMove = (event) => {
    location.x = event.x - boundary.width;
    location.y = event.y - boundary.height;
    if (isCropping.value) {
        croppingSelection.width = location.x - croppingSelection.x;
        croppingSelection.height = location.y - croppingSelection.y;
        if (event.shiftKey) {
            const size =
                (Math.abs(croppingSelection.width) + Math.abs(croppingSelection.height)) / 2;

            croppingSelection.width = (croppingSelection.width < 0 ? -1 : 1) * size;
            croppingSelection.height = (croppingSelection.height < 0 ? -1 : 1) * size;
        }
    }
};

const onMouseUp = () => {
    if (!isCropping.value) return;
    isCropping.value = false;

    const selection = {
        x: (croppingRect.value.x - props.offset.x) / props.offset.ratio,
        y: (croppingRect.value.y - props.offset.y) / props.offset.ratio,
        width: croppingRect.value.width / props.offset.ratio,
        height: croppingRect.value.height / props.offset.ratio
    };

    add(selection);
};

const add = async (selection) => {
    if (selection.x < 0) {
        if (selection.x + selection.width < 0) return;
        selection.width += selection.x;
        selection.x = 0;
    }
    if (selection.y < 0) {
        if (selection.y + selection.height < 0) return;
        selection.height += selection.y;
        selection.y = 0;
    }
    if (selection.x + selection.width > props.width) {
        if (selection.x > props.width) return;
        selection.width = props.width - selection.x;
    }
    if (selection.y + selection.height > props.height) {
        if (selection.y > props.height) return;
        selection.height = props.height - selection.y;
    }

    if (selection.width < min_width || selection.height < min_height) return;

    selections.value.push(selection);

    await toggle(selections.value.length - 1);

    emit('selectionAdded', selection);
};

const remove = async (index) => {
    const selection = selections.value.splice(index, 1)[0];

    emit('selectionRemoved', selection);
};
const toggle = async (index) => {
    currentSelection.value = selections.value[index];
    if (!currentSelection.value) return;
    emit('selectionToggled', currentSelection.value);
    await nextTick();
    document.querySelector('.selection.active').focus();
    const container = document.querySelector('.crop-vue');
    container.scrollTop = 0;
    container.scrollLeft = 0;
};

const croppingRect = computed(() => {
    return {
        x:
            croppingSelection.width > 0
                ? croppingSelection.x
                : croppingSelection.x + croppingSelection.width,
        y:
            croppingSelection.height > 0
                ? croppingSelection.y
                : croppingSelection.y + croppingSelection.height,
        width: Math.abs(croppingSelection.width),
        height: Math.abs(croppingSelection.height)
    };
});

const hover = (index) => {
    hoverSelection.value = selections.value[index];
};

defineExpose({
    selections,
    currentSelection,
    hoverSelection,
    add,
    toggle,
    hover
});
</script>

<template>
    <div class="crop-vue">
        <div
            class="img"
            @mousedown.left.prevent="onMouseDown"
            @mousemove.prevent="onMouseMove"
            @mouseup.left.prevent="onMouseUp"
        >
            <slot></slot>
        </div>
        <div
            v-if="isCropping"
            class="cropping"
            :style="{
                top: `${croppingRect.y}px`,
                left: `${croppingRect.x}px`,
                width: `${croppingRect.width}px`,
                height: `${croppingRect.height}px`
            }"
        ></div>

        <div
            :style="{
                position: 'absolute',
                top: props.offset.y + 'px',
                left: props.offset.x + 'px',
                width: props.width * props.offset.ratio + 'px',
                height: props.height * props.offset.ratio + 'px',
                pointerEvents: 'none'
            }"
        >
            <template v-for="(selection, index) in selections" :key="selection">
                <SelectionVue
                    class="selection"
                    :class="{
                        active: currentSelection === selection || hoverSelection === selection
                    }"
                    :style="{
                        pointerEvents: isCropping ? 'none' : 'all'
                    }"
                    @focus.prevent="toggle(index)"
                    @mousedown.prevent="toggle(index)"
                    @blur="toggle(null)"
                    @keydown.delete.prevent="remove(index)"
                    @keydown.tab.prevent="toggle((index + 1) % selections.length)"
                    @keydown.shift.tab.prevent="
                        toggle(index - 1 < 0 ? selections.length - 1 : index - 1)
                    "
                    @mouseenter="hover(index)"
                    @mouseleave="hover(null)"
                    @click.right.prevent="
                        useContextMenu([
                            {
                                label: '刪除選區',
                                shortcut: '⌫',
                                onClick: () => remove(index)
                            }
                        ])
                    "
                    :offset="props.offset"
                    :boundary="{
                        top: 0,
                        right: props.width,
                        bottom: props.height,
                        left: 0
                    }"
                    :min_width="min_width"
                    :min_height="min_height"
                    v-model:x="selection.x"
                    v-model:y="selection.y"
                    v-model:width="selection.width"
                    v-model:height="selection.height"
                >
                    <GridVue v-show="currentSelection === selection"></GridVue>
                </SelectionVue>
            </template>
        </div>

        <slot name="container"></slot>
    </div>
</template>

<style lang="scss">
.crop-vue {
    overflow: hidden;
    position: relative;
    width: 100%;
    height: 100%;
    cursor: crosshair;

    & > {
        .img {
            width: 100%;
            height: 100%;
        }

        .cropping {
            z-index: 5;
            position: absolute;
            box-sizing: border-box;
            border: 1px solid var(--color-white);
            pointer-events: none;
            will-change: top, left, width, height;
        }
    }

    .selection {
        --background-color: transparent;
        border: none;
        background-color: var(--background-color);
        &::before,
        &::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
        }

        &::before {
            border: 1px solid var(--color-black);
        }
        &::after {
            border: 1px dashed var(--color-white-80);
            background-color: var(--color-primary-10);
        }
        &:hover,
        &.active {
            --background-color: var(--color-primary-15);
            &::after {
                background-color: var(--color-primary-25);
            }
        }
    }
}
</style>
