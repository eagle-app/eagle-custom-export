const BaseBuilder = require("./base");

class Mp4Builder extends BaseBuilder {
    constructor() {
        super();
    }

    buildArgs(src, dest, options) {
        const baseArgs = super.buildArgs(src, dest, options);
        const ffmpegModes = {
            "h264": "libx264",
            "h265": "libx265",
        }
        this.args = [
            '-c:v', ffmpegModes[options.codec],
            // 當前 eagle ffmpeg 版本 h265不支援透明
            // '-pix_fmt', 'yuva420p',
            // 開發階段，先用最快，到時候再討論是否要做UI給使用者選
            '-preset', 'ultrafast',
            ...this.getFrameRateArgs(options),
            ...baseArgs,
        ];
        return this.args.filter(arg => arg);
    }

    getQualityArgs(options) {
        // 品質控制，數字越低越清晰但檔案越大（常用範圍 18–28）。        
        const ffmpegQuality = Math.round(28 - ((options.quality / 100) * 28));
        return ['-crf', ffmpegQuality.toString()];
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

module.exports = new Mp4Builder();