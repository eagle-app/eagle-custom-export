<script setup>
const mousetrap = inject('mousetrap');

const isAlwaysOnTop = ref(false);

const toggleAlwaysOnTop = async () => {
    isAlwaysOnTop.value = !isAlwaysOnTop.value;
    await eagle.window.setAlwaysOnTop(isAlwaysOnTop.value);
};

onMounted(async () => {
    mousetrap.bind(['shift+t'], toggleAlwaysOnTop);

    isAlwaysOnTop.value = await eagle.window.isAlwaysOnTop();
});
</script>

<template>
    <tippy allowHTML placement="bottom" duration="[200,0]" delay="[0,0]">
        <template #default>
            <ImageVue
                class="icon"
                :class="{
                    'icon-active': isAlwaysOnTop
                }"
                width="24"
                height="24"
                :src="
                    isAlwaysOnTop
                        ? 'light/base/ic-thumbtack-pinned.svg'
                        : 'light/base/ic-thumbtack.svg'
                "
                :darkSrc="
                    isAlwaysOnTop
                        ? 'dark/base/ic-thumbtack-pinned.svg'
                        : 'dark/base/ic-thumbtack.svg'
                "
                @click="toggleAlwaysOnTop"
            ></ImageVue>
        </template>

        <template #content>
            <span style="margin-right: 2px">
                {{
                    isAlwaysOnTop
                        ? $translate('header.thumbtack.isNotAlwaysOnTop')
                        : $translate('header.thumbtack.isAlwaysOnTop')
                }}
            </span>
            <key>{{ $keyboard('shift') }}</key>
            <key>{{ $keyboard('T') }}</key>
        </template>
    </tippy>
</template>

<style lang="scss"></style>
