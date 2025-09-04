export default {
    install: (app, options) => {
        app.config.globalProperties.$translate = (s, options) => {
            return i18next.t(
                s
                    ?.trim()
                    .split(' ')
                    .map((s, i) => (i == 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
                    .join(''),
                options
            );
        };
    }
};
