const BaseBuilder = require("./base");

class WebmBuilder extends BaseBuilder {
    constructor() {
        super();
    }

    buildArgs(src, dest, options) {
        const baseArgs = super.buildArgs(src, dest, options);
        const ffmpegModes = {
            "vp8": "libvpx",
            "vp9": "libvpx-vp9",
        };
        this.args = [
            '-c:v', ffmpegModes[options.codec],
            '-pix_fmt', 'yuva420p',
            // 開發階段，先用最快，到時候再討論是否要做UI給使用者選
            '-cpu-used', '5',
            ...(options.codec === 'vp8' ? ['-auto-alt-ref', '0'] : []),
            ...this.getFrameRateArgs(options),
            ...baseArgs,
        ];
        return this.args.filter(arg => arg);
    }

    getQualityArgs(options) {
        // VP8/VP9 CRF: 4–63, 越低越清晰，常用 15–35
        const crf = Math.round(63 - ((options.quality / 100) * 59));
        return ['-crf', crf.toString()];
    }

    getFrameRateArgs(options) {
        if (options.animatedFps && options.animatedFps !== 'sameAsSource') {
            return ['-r', options.animatedFps];
        }
        return [];
    }

    getSizeFilter(options) {
        if (!options.sizeType) {
            return null;
        }

        options.sizeValue = Math.ceil(options.sizeValue / 2) * 2;

        const sizeHandlers = {
            maxWidth: () => super._buildScaleFilter(`ceil(min'(iw,${options.sizeValue})'/2)*2`, '-2'),
            maxHeight: () => super._buildScaleFilter('-2', `ceil(min'(ih,${options.sizeValue})'/2)*2`),
            minWidth: () => super._buildScaleFilter(`ceil(max'(iw,${options.sizeValue})'/2)*2`, '-2'),
            minHeight: () => super._buildScaleFilter('-2', `ceil(max'(ih,${options.sizeValue})'/2)*2`),
            maxSide: () => super._buildMaxSideScaleFilter(options.sizeValue),
            minSide: () => super._buildMinSideScaleFilter(options.sizeValue),
            exact: () => super._buildExactScaleFilter(options)
        };

        const handler = sizeHandlers[options.sizeType];
        return handler ? handler() : null;
    }

}

module.exports = new WebmBuilder();