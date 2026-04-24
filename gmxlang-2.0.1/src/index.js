// GMXHelper 主要模块导出
// 这个文件提供了所有核心功能的统一入口

// 语言提供者
const { TopItpLanguageProvider, GroLanguageProvider, PdbLanguageProvider, NdxLanguageProvider, PrmtopLanguageProvider } = require('./providers/languageProvider.js');

// 悬停信息提供者
const hover = require('./providers/hover.js');

// 查看器
const XvgViewerProvider = require('./viewers/xvgViewer.js');
const StructureViewerProvider = require('./viewers/structureViewer.js');

module.exports = {
    // 语言提供者
    TopItpLanguageProvider,
    GroLanguageProvider,
    PdbLanguageProvider,
    NdxLanguageProvider,
    PrmtopLanguageProvider,

    // 悬停信息
    hover,

    // 查看器
    XvgViewerProvider,
    StructureViewerProvider
};
