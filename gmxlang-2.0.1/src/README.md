# GMXHelper 源代码结构

这个目录包含了GMXHelper扩展的所有核心源代码，按功能模块进行了组织。

## 📁 目录结构

```
src/
├── index.js              # 主要模块导出文件
├── providers/             # 语言服务提供者
│   ├── hover.js          # 悬停信息提供者
│   └── languageProvider.js # 语言特性提供者
├── viewers/              # 文件查看器
│   ├── structureViewer.js # 3D分子结构查看器
│   └── xvgViewer.js      # XVG数据图表查看器
├── syntaxes/             # 语法高亮定义
│   ├── *.tmLanguage.json # TextMate语法文件
│   ├── language-configuration.json # 语言配置
│   ├── color.json        # 颜色方案定义
│   └── themecolor.json   # 主题颜色配置
└── config/               # 配置文件
    └── snippets.json     # 代码片段配置
```

## 🔧 模块说明

### providers/ - 语言服务提供者
- **hover.js**: 为各种文件格式提供悬停信息显示
- **languageProvider.js**: 提供语法高亮、代码折叠、文档大纲等语言特性

### viewers/ - 文件查看器
- **structureViewer.js**: 使用Mol*库实现的3D分子结构可视化
- **xvgViewer.js**: XVG数据文件的图表可视化

### syntaxes/ - 语法高亮定义
- ***.tmLanguage.json**: TextMate语法文件，定义各种文件格式的语法高亮规则
- **language-configuration.json**: 语言配置文件，定义注释、括号匹配等特性
- **color.json**: 颜色方案定义文件
- **themecolor.json**: 主题颜色配置文件

### config/ - 配置文件
- **snippets.json**: MDP文件的代码片段和自动补全配置

## 📦 模块导出

所有模块通过 `src/index.js` 统一导出，提供了清晰的API接口：

```javascript
const {
    TopItpLanguageProvider,
    GroLanguageProvider,
    PdbLanguageProvider,
    NdxLanguageProvider,
    hover,
    XvgViewerProvider,
    StructureViewerProvider
} = require('./src/index.js');
```

## 🚀 开发指南

1. **添加新的语言提供者**: 在 `providers/` 目录下创建新文件
2. **添加新的查看器**: 在 `viewers/` 目录下创建新文件
3. **修改配置**: 编辑 `config/` 目录下的相应文件
4. **更新导出**: 在 `index.js` 中添加新模块的导出

这种模块化的结构使得代码更易于维护、测试和扩展。