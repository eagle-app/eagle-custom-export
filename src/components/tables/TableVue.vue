<template>
    <div class="v-table">
        <RecycleScroller class="v-tbody" :items="list" :item-size="41" :buffer="200" v-slot="{ item, index }"
            ref="scroller" key-field="id" @wheel="onWheel" :emit-update="false">
            <div class="v-tr" :class="`task-row-${item.data.status || ''}`">
                <div class="v-td" :class="{
                    fill: value.fill,
                    striped: index % 2 == 1
                }" :style="{                    
                    minWidth: value.minWidth,
                    maxWidth: value.maxWidth,
                    justifyContent: value.align,
                    padding: value.padding
                }" v-for="value in thead" :key="value">
                    <slot :name="value.key" :row="item.data" :index="index">
                        {{ item.data[value.key] }}
                    </slot>
                </div>
            </div>
        </RecycleScroller>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

// Props 定義（保持與原有的兼容）
const props = defineProps({
    header: {
        type: Object,
        default(rawProps) {
            return {
                name: '',                
                minWidth: null,
                maxWidth: null,
                align: 'start',
                fill: false,
                line: false
            };
        },
        required: true
    },
    data: { type: Array, required: true },
    autoScrollDelay: { type: Number, default: 3 }
});

let thead = [];
const list = ref([]);

Object.entries(props.header).forEach((item) => {
    const [key, value] = item;
    const width = measureText(value.name).width;
    thead.push({
        key,
        ...value,
        width: `${width}px`,
        minWidth: value.minWidth ? `${value.minWidth}px` : 'auto',
        maxWidth: value.maxWidth ? `${value.maxWidth}px` : 'auto'
    });
});

function measureText(pText) {
    let div = document.createElement('div');

    document.body.appendChild(div);

    div.style.position = 'absolute';
    div.style.left = -1000;
    div.style.top = -1000;

    div.style.fontSize = '14px';

    div.textContent = pText;

    let result = {
        width: div.clientWidth,
        height: div.clientHeight
    };

    document.body.removeChild(div);
    div = null;

    return result;
}

watchEffect(() => {
    list.value = props.data.map((value, index) => {
        return { id: index, data: value };
    });
});

const scroller = ref(null);
const visibleLength = computed(() => 5);
const currentDelay = ref(0);

const onWheel = () => {
    currentDelay.value = props.autoScrollDelay;
};

setInterval(() => {
    if (currentDelay.value > 0) {
        currentDelay.value--;
    }
}, 1000);

defineExpose({
    scrollToIndex(index) {
        if (index < visibleLength.value || index >= props.data.length) return;
        if (currentDelay.value == 0) {
            scroller.value.scrollToItem(index - visibleLength.value);
        }
    }
});
</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.v-table {
    --table-row-hover-background-color: rgba(44, 47, 50, 0.06);
    --table-row-striped-background-color: rgba(44, 47, 50, 0.04);
    --table-row-hover-striped-background-color: rgba(44, 47, 50, 0.08);
    --table-row-border-color: var(--color-black-5);
    --table-text-color: var(--color-dark);
    --table-line-background-color: var(--color-whitesmoke);
    --table-background-color: var(--color-bg-primary);
    --table-border-color: var(--color-border-primary);

    @include mixins.dark {
        --table-row-hover-background-color: rgba(247, 248, 248, 0.02);
        --table-row-striped-background-color: rgba(247, 248, 248, 0.04);
        --table-row-hover-striped-background-color: rgba(247, 248, 248, 0.06);
        --table-row-border-color: var(--color-black-10);
        --table-text-color: var(--color-theme-lightgray);
        --table-line-background-color: var(--color-black-25);
        --table-background-color: var(--color-bg-primary-dark);
        --table-border-color: var(--color-border-primary-dark);
    }

    @mixin tr {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: nowrap;
        border-radius: 6px;
        overflow: hidden;
    }

    @mixin td {
        display: flex;
        align-items: center;
        height: 40px;
        line-height: 40px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        box-sizing: border-box;
        // padding: 0 12px;

        &.fill {
            flex: 1;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }

        &.line {
            position: relative;

            &::after {
                content: '';
                position: absolute;
                top: 50%;
                right: 0;
                width: 1px;
                height: 24px;
                background-color: var(--table-line-background-color);
                transform: translateY(-50%);
            }
        }
    }

    width: 100%;
    height: 100%;
    min-width: 300px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    color: var(--table-text-color);
    border-radius: 8px;
    overflow: hidden;

    .v-tbody {
        flex: 1;
        height: 100%;
        background: transparent;
        overflow: scroll;

        ::v-deep(.vue-recycle-scroller__item-wrapper) {
            min-width: 600px;
        }

        .v-tr {
            @include tr;
            user-select: none;
            transition: all var(--animation-normal);

            .v-td {
                @include td;
                transition: background-color var(--animation-normal);

                &:first-child {
                    border-top-left-radius: 6px;
                    border-bottom-left-radius: 6px;
                }

                &:last-child {
                    border-top-right-radius: 6px;
                    border-bottom-right-radius: 6px;
                }

                &.striped {
                    background-color: var(--table-row-striped-background-color);
                }

                &:empty {
                    &::before {
                        content: '-';
                        opacity: 0.5;
                    }
                }
            }

            &:hover {
                .v-td {
                    background-color: var(--table-row-hover-background-color);

                    &.striped {
                        background-color: var(--table-row-hover-striped-background-color);
                    }

                    &:first-child {
                        border-top-left-radius: 6px;
                        border-bottom-left-radius: 6px;
                    }

                    &:last-child {
                        border-top-right-radius: 6px;
                        border-bottom-right-radius: 6px;
                    }
                }
            }
        }
    }
}
</style>
