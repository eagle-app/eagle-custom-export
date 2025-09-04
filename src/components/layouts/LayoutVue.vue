<template>
    <div class="layout-container">
        <div class="layout-sidebar">
            <SettingsSidebarVue />
        </div>
        <div class="layout-main">
            <div class="drag-helper"></div>
            <TaskListVue v-if="main.items" />
        </div>
    </div>
</template>

<script setup>
import { inject } from 'vue';

// 導入子組件
import TaskListVue from '@/components/tasks/TaskListVue.vue';
import SettingsSidebarVue from '@/components/settings/SettingsSidebarVue.vue';

const main = inject('main');

</script>

<style lang="scss" scoped>
@use '@styles/modules/mixins' as mixins;

.layout-container {
    display: flex;
    height: 100%;
    width: 100%;
    gap: 0;
    overflow: hidden;

    .layout-sidebar {
        min-width: 300px;
        max-width: 340px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        overflow: visible;
        padding: 6px;
    }

    .layout-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: inherit;
        position: relative;

        .drag-helper {
            -webkit-app-region: drag;
            position: absolute;
            left: 0;
            right: 0;
            height: 28px;
            width: 100%;
        }
    }
}
</style>
