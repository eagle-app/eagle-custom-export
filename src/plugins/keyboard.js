export default {
    install: (app, options) => {
        app.config.globalProperties.$keyboard = (s) => {
            s = s.toUpperCase();
            const data = [
                ['CTRL', '⌘'],
                ['ALT', '⌥'],
                ['SHIFT', '⇧']
            ];
            if (eagle.app.isMac) {
                for (let i of data) {
                    s = s.replace(i[0], i[1]);
                }
            } else {
                for (let i of data) {
                    s = s.replace(i[1], i[0]);
                }
            }
            return s;
        };
    }
};
