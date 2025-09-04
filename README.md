<img width="1200" height="900" alt="image" src="https://github.com/user-attachments/assets/5ad7f2e2-74b8-4606-a90b-7657f5f07392" />

# Eagle Custom Format Export Plugin

A comprehensive image and video format conversion plugin for [Eagle](https://en.eagle.cool/), supporting batch processing with advanced conversion options and wide format compatibility.

## 🎯 Overview

This plugin extends Eagle's functionality to support batch image and video format conversion with various quality, sizing, and naming options. Built with Vue 3 and powered by multiple conversion engines including FFmpeg, Canvas API, and specialized WASM decoders.

## ✨ Key Features

- **🔄 Batch Processing**: Convert multiple files simultaneously with queue-based processing
- **🎨 Wide Format Support**: Extensive input and output format compatibility
- **⚙️ Advanced Options**: Quality control, size adjustment, custom naming, and more
- **🌐 Multi-language**: Support for 8 languages (EN, ZH_TW, ZH_CN, JA, ES, RU, DE, KO)
- **🔧 Multiple Conversion Engines**: Automatic fallback between different conversion methods
- **📊 Real-time Progress**: Live conversion progress tracking with detailed feedback

## 📁 Supported Formats

### Input Formats
`bmp`, `exr`, `gif`, `hdr`, `heic`, `heif`, `hif`, `ico`, `jpeg`, `jpg`, `jfif`, `png`, `svg`, `tga`, `tif`, `tiff`, `webp`, `avif`, `insp`, `jxl`, `jpe`, `mp4`, `mov`, `webm`, `mkv`, `m4v`

### Output Formats
`jpg`, `png`, `bmp`, `gif`, `tif`, `ico`, `webp`, `avif`, `hdr`, `exr`, `tga`, `mp4`, `webm`

## 🛠️ Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework with Composition API
- **Element Plus** - Vue 3 UI component library
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **SCSS** - Enhanced CSS with modular architecture

### Image/Video Processing
- **FFmpeg** - Universal multimedia framework for video and advanced image processing
- **Canvas API** - Browser-based image processing for basic operations
- **libheif.js (WASM)** - HEIC/HEIF format support via WebAssembly
- **libjxl (WASM)** - JPEG XL format decoding via WebAssembly  
- **WebP WASM** - WebP format processing via WebAssembly

### Development Tools
- **Vitest** - Fast unit testing framework
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting

## 🏗️ Architecture

### Core Components

- **App.vue** - Main application entry point handling Eagle plugin lifecycle
- **ItemExportSettingsVue.vue** - Export configuration interface
- **main.js** - Core business logic orchestration

### Conversion System

The plugin uses a modular converter architecture with multiple engines:

#### 1. **FFmpeg Converter** (`public/modules/fileConverter/toolkits/ffmpegConverter/`)
- Handles video formats and advanced image processing
- Format-specific argument builders for optimal conversion parameters
- Support for animated images (GIF, WebP, AVIF)

#### 2. **Canvas Converter** (`public/modules/fileConverter/toolkits/canvasConverter/`)
- Browser-based image processing using HTML5 Canvas API
- Fast processing for standard image formats
- Real-time preview capabilities

#### 3. **Specialized Decoders**
- **HEIC/HEIF Converter**: macOS native support via `sips` + cross-platform libheif.js fallback
- **JXL Decoder**: JPEG XL support via libjxl WASM
- **WebP Decoder**: Enhanced WebP processing via libwebp WASM

### Format Handlers

Each supported format has dedicated handlers (`public/modules/handlers/`) that:
- Detect format-specific features (animation, transparency, etc.)
- Optimize conversion parameters
- Handle format-specific edge cases

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Eagle application

### Setup
```bash
# Install dependencies
npm install

# Build for production
npm run build

```

## 🔧 Development

### Project Structure
```
├── src/                          # Vue 3 application source
│   ├── views/App.vue            # Main application component
│   ├── components/              # UI components
│   └── assets/                  # Styles and utilities
├── public/
│   ├── modules/                 # Conversion engine modules
│   │   ├── fileConverter/       # Main conversion orchestrator
│   │   ├── handlers/            # Format-specific handlers  
│   │   └── utils/               # Utility functions
│   ├── manifest.json            # Eagle plugin configuration
│   └── _locales/               # Internationalization files
└── dist/                       # Built plugin files
```

## 🌟 Core Features

### Batch Processing
- **Queue Management**: Concurrent processing with progress tracking
- **Memory Optimization**: Automatic memory cleanup for large batch operations
- **Error Recovery**: Graceful handling of failed conversions with retry options

### Conversion Options

#### Quality Control
- **Lossy Formats**: Adjustable quality from 1-100%
- **Lossless Formats**: Automatic optimization while preserving quality
- **Format-specific Optimization**: Tailored settings for each output format

#### Size Management
- **Resize Options**: Max/min width/height, max/min side, exact dimensions
- **Aspect Ratio**: Automatic preservation or custom adjustment
- **Resolution Limits**: Built-in safeguards for maximum processing dimensions

#### Naming Flexibility
- **Original Names**: Preserve source filenames
- **Custom Naming**: User-defined names with sequential numbering
- **Format Extensions**: Automatic extension handling

### Advanced Features

#### Animation Support
- **Animated GIF**: Full animation preservation and optimization
- **Animated WebP**: Support for animated WebP with quality control
- **Video Processing**: MP4, WebM, and other video formats

#### Cross-platform Compatibility
- **macOS**: Native HEIC support via system tools
- **Windows/Linux**: WASM-based fallbacks for all formats
- **Universal**: Consistent behavior across all platforms

## 📖 Open Source Libraries

This plugin leverages several open-source libraries:

### Core Libraries

- **[FFmpeg](https://ffmpeg.org/)** - Universal multimedia processing framework
  - License: GPL/LGPL
  - Note: This project uses the official FFmpeg binaries for video and image processing. 
    FFmpeg itself is not distributed with this project. For more details, please see the FFmpeg license.

- **[libjxl](https://github.com/libjxl/libjxl)** - JPEG XL reference implementation  
  - License: BSD-3-Clause
  - Used for: JPEG XL format decoding and encoding

- **[libheif](https://github.com/strukturag/libheif)** - HEIF/HEIC format support
  - License: LGPL-3.0
  - Used for: HEIC/HEIF format processing via WebAssembly

- **[WebP](https://developers.google.com/speed/webp)** - Modern image format
  - License: BSD
  - Used for: WebP format processing via WASM

### Vue.js Ecosystem

- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[Element Plus](https://element-plus.org/)** - Vue 3 UI component library
- **[Vue Tippy](https://vue-tippy.netlify.app/)** - Tooltip and popover library
- **[Vue Virtual Scroller](https://github.com/Akryum/vue-virtual-scroller)** - Performance-optimized virtual scrolling
- **[Vue Context Menu](https://imengyu.top/pages/vue3-context-menu-docs/)** - Right-click context menu support

### Utility Libraries

- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework  
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[VeeValidate](https://vee-validate.logaretm.com/)** - Form validation library

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Reporting Issues
Please use the GitHub issue tracker to report bugs or suggest features.

## 📄 License

This project is open source. Please check individual dependencies for their specific licenses.

## 🙏 Acknowledgments

Special thanks to the open-source community and the developers of:
- The FFmpeg project for universal multimedia processing
- The JPEG XL team for next-generation image compression
- The libheif developers for HEIC/HEIF format support
- All Vue.js ecosystem contributors
- The Eagle team for creating an extensible platform

---

**Made with ❤️ for the Eagle community**
