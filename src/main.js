import { createApp } from 'vue';
import App from './views/App.vue';

import i18nPlugin from './plugins/i18n';
import keyboardPlugin from './plugins/keyboard';

import VueTippy from 'vue-tippy';
import VueMousetrapPlugin from 'vue-mousetrap';

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';
import '@styles/tailwind.css';
import '@styles/main.scss';

const utils = require(`${__dirname}/modules/utils`);

const app = createApp(App);

app.use(i18nPlugin);
app.use(keyboardPlugin);

app.use(VueTippy);
app.use(VueMousetrapPlugin).provide('mousetrap', app.config.globalProperties.$mousetrap);

eagle.onPluginCreate(async (plugin) => {
    const utils = require(`${__dirname}/modules/utils`);

    // if (eagle.app.platform === 'darwin') await utils.time.sleep(600);

    app.mount('#app');

    document.querySelector('html').setAttribute('lang', eagle.app.locale);

    toggleTheme();

    process.on('uncaughtException', (error) => {
        eagle.log.error('uncaughtException:' + error);
    });

    // 檢查 FFmpeg 相依性插件是否已經安裝
    const isFFemptInstalled = await eagle.extraModule.ffmpeg.isInstalled();

    // 從開啟插件中心，彈出安裝 FFmpeg 相依性插件頁面。
    if (!isFFemptInstalled) {
        await eagle.extraModule.ffmpeg.install();
        return;
    }
});

eagle.onThemeChanged((theme) => {
    toggleTheme();
});

window.addEventListener('load', async () => {
    await utils.file.deleteFolder(`${__dirname}/temp`);
    await utils.file.createFolder(`${__dirname}/temp`);
});

window.addEventListener('unload', async () => {
    await utils.file.deleteFolder(`${__dirname}/temp`);
});

const THEME_SUPPORT = {
    Auto: eagle.app.isDarkColors() ? 'gray' : 'light',
    LIGHT: 'light',
    LIGHTGRAY: 'lightgray',
    GRAY: 'gray',
    DARK: 'dark',
    BLUE: 'blue',
    PURPLE: 'purple'
};

// 切換主題
async function toggleTheme() {
    const theme = eagle.app.theme;
    const themeName = THEME_SUPPORT[theme] ?? 'dark';
    const htmlEl = document.querySelector('html');

    htmlEl.classList.add('no-transition');
    htmlEl.setAttribute('theme', themeName);
    htmlEl.setAttribute('platform', eagle.app.platform);
    
    // 為 shadcn-vue 添加 dark class
    if (['dark', 'gray', 'blue', 'purple'].includes(themeName)) {
        htmlEl.classList.add('dark');
    } else {
        htmlEl.classList.remove('dark');
    }
    
    await nextTick();
    htmlEl.classList.remove('no-transition');
}
