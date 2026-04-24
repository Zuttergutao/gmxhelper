# GMXHelper - GROMACS Language Support for VS Code

> **开发说明**: 此项目由 Trae Claude AI 助手结合之前的开源项目重新开发和优化而来，旨在为 GROMACS 分子动力学模拟提供更好的 VS Code 开发体验。

![GMXHelper Logo](images/logo.png)

GMXHelper is a comprehensive VS Code extension designed specifically for GROMACS molecular dynamics simulations. It provides syntax highlighting, code completion, 3D visualization, and intelligent code folding for various molecular file formats.

## ✨ Features

### 🎨 Syntax Highlighting

Supports syntax highlighting for all major GROMACS and molecular file formats:

- `.mdp` - Molecular Dynamics Parameters
- `.top` - Topology files
- `.itp` - Include topology files
- `.gro` - GROMACS coordinate files
- `.pdb` - Protein Data Bank files
- `.ndx` - Index files
- `.xvg` - XmGrace data files
- `.fasta` - Sequence files
- `.mol2` - Tripos MOL2 files
- `.xyz` - XYZ coordinate files
- `.cif` - Crystallographic Information Files
- `.sdf` - Structure Data Files
- `.mol` - MDL Molfile format

#### 🧪 Amber File Format Support

- `.in/.inp` - Amber input parameter files
- `.out/.info` - Amber output log files
- `.prmtop/.parm7` - Amber parameter topology files
- `.rst7/.rst/.inpcrd/.crd` - Amber coordinate and restart files

Features include:

- Syntax highlighting for Amber keywords, parameters, and values
- Hover tooltips with detailed explanations of simulation parameters
- Support for molecular dynamics, minimization, and enhanced sampling keywords
- Comprehensive coverage of AMBER control namelist parameters

#### ⚛️ Quantum Chemistry Software Support

- **Gaussian**: `.gjf`, `.com`, `.g09`, `.g16` - Gaussian input files
- **ORCA**: `.inp`, `.orca` - ORCA input files
- **CP2K**: `.inp`, `.cp2k` - CP2K input files

Features include:

- Syntax highlighting for keywords, functionals, basis sets, and parameters
- Hover tooltips with detailed explanations of methods and options
- Code snippets for common calculation types (optimization, frequency, TD-DFT, MD)
- Support for both simple and complex input formats

### 🧬 3D Molecular Visualization

Powered by the NGLViewer library, providing:

- Interactive 3D structure visualization
- Multiple representation styles (Cartoon, Ball & Stick, Spacefill, Line, Surface)
- Various color schemes (Element, Residue, Chain, Secondary Structure)
- Real-time structure information display
- Export functionality for structure images

### 📝 Code Intelligence

- **Smart Code Completion**: Snippets for `.mdp` files
- **Hover Information**: Detailed parameter descriptions and amino acid information
- **Code Formatting**: Automatic formatting for `.mdp`, `.gro`, and `.in` (Amber) files
- **Document Outline**: Navigate large files with ease
- **Intelligent Folding**: Automatic section folding for better readability

### 🔍 Advanced Navigation

- Document symbol provider for quick navigation
- Outline view with hierarchical structure
- Section-based code folding
- Quick jump to specific molecular components

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "GMXHelper" or "gmxlang"
4. Click Install

### From VSIX Package

1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Press Ctrl+Shift+P and type "Extensions: Install from VSIX"
4. Select the downloaded `.vsix` file

## 📖 Usage

### Syntax Highlighting

Simply open any supported file format (`.mdp`, `.gro`, `.top`, etc.) and enjoy automatic syntax highlighting with color-coded elements.

### 3D Visualization

1. Right-click on any `.pdb`, `.gro`, or `.mol2` file in the explorer
2. Select "View 3D Structure" from the context menu
3. Interact with the 3D viewer using mouse controls
4. Customize representation and colors using the control panel

### Code Completion

- Type in `.mdp` files to get intelligent suggestions
- Use snippets for common GROMACS parameters
- Hover over parameters for detailed documentation

### Code Folding

- Sections in `.top` and `.itp` files automatically fold for better readability
- Access folding commands from the Command Palette (Ctrl+Shift+P)

## ⚙️ Configuration

Customize GMXHelper behavior in VS Code settings:

```json
{
  "gmxlang.outline.autoFold": true,
  "gmxlang.outline.autoCollapseOutlineView": true
}
```

### 🎨 Automatic Color Configuration

GMXHelper automatically manages syntax highlighting colors for optimal visual experience:

- **Smart Color Updates**: When the extension updates with new color rules, they are automatically merged with your existing VS Code color customizations
- **Non-Destructive**: Your personal color preferences are preserved while new molecular file highlighting rules are added
- **Incremental Updates**: Only new color rules are added, preventing duplication and conflicts
- **Global Integration**: Color rules are seamlessly integrated into your global VS Code settings (`editor.tokenColorCustomizations`)

No manual configuration required - GMXHelper intelligently handles color scheme updates while respecting your existing customizations.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open in VS Code
4. Press F5 to launch a new Extension Development Host

### npm run lint

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- nglviewer for 3D molecular visualization
- GROMACS community for the molecular dynamics software
- VS Code team for the excellent extension API

## 📞 Support

If you encounter any issues or have suggestions:

- Contact the maintainer: Casea1998

---

**Enjoy molecular dynamics with GMXHelper! 🧬✨**
