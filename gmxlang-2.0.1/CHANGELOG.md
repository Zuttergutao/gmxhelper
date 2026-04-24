# Change Log

All notable changes to the "gmxlang" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Versions

---

## 2.0.1 (Latest) - 2025-01-XX

### 🎨 Smart Color Configuration Management

**✨ NEW FEATURES**

- **NEW**: Intelligent color configuration update system
  - **Smart Merging**: Automatically detects and adds new color rules from `color.json` updates
  - **Non-Destructive Updates**: Preserves existing user color customizations while adding new rules
  - **Incremental Updates**: Only adds missing color rules, preventing duplication
  - **Seamless Integration**: New color rules are automatically applied to global VS Code settings
  - **Update-Safe**: Plugin updates now properly apply new syntax highlighting colors
- **IMPROVED**: Enhanced extension activation logic for better color rule management
- **FIXED**: Issue where updated color rules in `color.json` were not applied after plugin updates

---

## 2.0.0 - 2025-07-13

### 🧪 Amber File Format Support

**✨ NEW FEATURES**

- **NEW**: Enhanced Amber molecular dynamics file format support with consolidated file type handling:
  - `.in`, `.inp` - Amber input parameter files with keyword highlighting
  - `.out`, `.info` - Amber output log files with unified energy and timing info highlighting
  - `.prmtop`, `.parm7` - Amber parameter topology files with enhanced syntax highlighting:
    - `%FLAG` sections with outline view support and intelligent folding
    - `%FORMAT` directives highlighting with hover information
    - Amino acid residue recognition (20 standard amino acids)
    - Atom names and types identification
    - Water molecules and ion recognition (SOL, WAT, Na+, Cl-, etc.)
    - Comment support (`;` and `*` prefixed lines)
    - Scientific notation number formatting
    - **NEW**: Advanced language provider with document symbols and outline navigation
    - **NEW**: Intelligent data parsing for atoms, charges, masses, and residues
    - **NEW**: Hover tooltips for FLAG descriptions and format specifications
    - **NEW**: Smart folding with auto-collapse for non-essential sections
  - `.inpcrd`, `.crd`, `.rst7`, `.rst` - Amber coordinate files with consolidated coordinate highlighting
- **NEW**: Optimized syntax highlighting using predefined color schemes from `color.json`
- **NEW**: Consolidated language definitions reducing redundancy between similar file types
- **NEW**: Code optimization by merging duplicate language definitions
- **NEW**: Documentation for Amber file format support

---

## 2.0.0 - 2025-07-13

### 🚀 Major Release - Complete Project Restructure

**🔄 BREAKING CHANGES**

- **RESTRUCTURED**: Complete project architecture overhaul by Trae Claude AI assistant
- **MOVED**: All source code reorganized into modular `src/` directory structure
- **UPDATED**: All file paths and imports updated to new structure
- **ENHANCED**: Improved code organization and maintainability

**✨ NEW FEATURES**

- **NEW**: Support for additional molecular file formats:
  - `.cif` - Crystallographic Information Files
  - `.sdf` - Structure Data Files
  - `.mol` - MDL Molfile format
  - `.xyz` - XYZ coordinate files
  - `.mol2` - Tripos MOL2 files
- **NEW**: Enhanced 3D structure viewer with support for all molecular formats
- **NEW**: Professional GMXHelper icon design with molecular dynamics themes
- **NEW**: Comprehensive project documentation and README updates
- **NEW**: Modular code structure with separate providers, viewers, and configurations

**🔧 IMPROVEMENTS**

- **IMPROVED**: Better error handling and user feedback
- **IMPROVED**: Enhanced syntax highlighting for all supported formats
- **IMPROVED**: Optimized file loading and processing performance
- **IMPROVED**: More intuitive user interface and commands
- **IMPROVED**: Better integration with VS Code ecosystem

**🏗️ TECHNICAL ENHANCEMENTS**

- **REFACTORED**: Separated language providers into dedicated modules
- **REFACTORED**: Isolated viewer components for better maintainability
- **REFACTORED**: Centralized configuration management
- **REFACTORED**: Improved code documentation and comments
- **UPDATED**: Modern JavaScript patterns and best practices
- **UPDATED**: Enhanced error handling throughout the codebase

**📁 PROJECT STRUCTURE**

```
src/
├── config/         # Configuration files and snippets
├── providers/      # Language providers and hover information
├── syntaxes/       # Syntax highlighting definitions
├── viewers/        # 3D structure and data viewers
└── index.js        # Main module exports
```

**🎨 VISUAL IMPROVEMENTS**

- **NEW**: Custom GMXHelper logo and branding
- **NEW**: Molecular dynamics themed icon design
- **UPDATED**: Enhanced syntax highlighting colors
- **UPDATED**: Improved 3D viewer interface

---

## 1.0.17

- **FIXED**: Mol* Viewer Loading Issues - Improved CDN loading with timeout handling and backup CDN support
- **FIXED**: Enhanced Error Handling - Added retry mechanism and better error messages for network issues
- **FIXED**: Loading Timeout - Implemented 30-second timeout with retry button for slow connections
- **FIXED**: Script Loading - Dynamic script loading with fallback to alternative CDN (jsdelivr)
- **IMPROVED**: Console Logging - Added detailed logging for debugging viewer initialization
- **TECHNICAL**: Removed static script tag in favor of dynamic loading
- **TECHNICAL**: Added `loadMolstarScript()` function with error recovery
- **TECHNICAL**: Implemented loading timeout and retry functionality
- **TECHNICAL**: Simplified viewer configuration for better performance

## 1.0.16

- **NEW**: Added 3D molecular structure visualization using Mol* library
- **NEW**: Support for PDB, GRO, and MOL2 file 3D visualization
- **NEW**: Interactive 3D viewer with multiple representation styles (Cartoon, Ball & Stick, Spacefill, Line, Surface)
- **NEW**: Various color schemes (Element, Residue, Chain, Secondary Structure, Uniform)
- **NEW**: Real-time structure information display
- **NEW**: Export functionality for structure images
- **NEW**: Automatic format conversion (GRO/MOL2 to PDB for visualization)
- **IMPROVED**: Enhanced right-click context menu for structure files

## 1.0.15 - 2023-06-15

### ✨ Major Feature Release

**NEW FEATURES**

- **NEW**: 3D molecular structure visualization using Mol* library
  - **GRO Viewer**: Interactive 3D visualization with automatic coordinate conversion (nm to Å)
  - **PDB Viewer**: Enhanced 3D visualization with improved error handling
  - **XVG Viewer**: Advanced data plotting capabilities
- **NEW**: Multiple representation styles (Cartoon, Ball & Stick, Spacefill, Line)
- **NEW**: Various color schemes (Element, Residue, Chain, Secondary Structure)
- **NEW**: Interactive parameter controls and background customization
- **NEW**: Full-screen mode support and real-time structure information
- **NEW**: Right-click context menu integration

**IMPROVEMENTS**

- **IMPROVED**: Enhanced error handling and user feedback
- **IMPROVED**: Comprehensive documentation updates

## 1.0.14 - 2023-05-20

### 🐛 Bug Fixes

- **FIXED**: Various stability improvements
- **FIXED**: Performance optimizations

## 1.0.13 - 2023-04-25

### 🔧 Code Optimization

- **REFACTORED**: Optimized `hover.js` code structure
- **THANKS**: Special thanks to MastorAaron@https://github.com/MastorAaron for the contribution!

## 1.0.12 - 2023-04-10

### 🎨 Theme System Overhaul

- **FIXED**: Theme compatibility issues resolved
- **NEW**: Users can now use their favorite themes without conflicts
- **CHANGED**: Token colors now written to global settings on first installation
- **REMOVED**: Automatic theme switching that sometimes failed

## 1.0.11 - 2023-03-28

### 🐛 Bug Fixes

- **FIXED**: Automatic theme changing issues

## 1.0.10 - 2023-03-15

### ✨ New Features

- **NEW**: Section folding support for better code organization
- **THANKS**: Special thanks to Itachi for valuable feedback!

## 1.0.9 - 2023-03-01

### 📖 Documentation Enhancement

- **NEW**: Hover information for parameters in `.mdp` files

## 1.0.8 - 2023-02-15

### ✨ FASTA Support

- **NEW**: Syntax highlighting for `.fasta` files
- **NEW**: Hover information for amino acids in `.fasta` files

## 1.0.7 - 2023-02-01

### 🐛 Bug Fixes

- **FIXED**: Theme changing automation issues

## 1.0.6 - 2023-01-20

### 🔧 Improvements

- **CHANGED**: Updated code formatting rules
- **ENHANCED**: More syntax highlighting for `.pdb` files

## 1.0.5 - 2023-01-15

### 🔧 Code Formatting

- **CHANGED**: Improved code formatting rules

## 1.0.4 - 2023-01-10

### ✨ Code Formatting

**NEW FEATURES**

- **NEW**: Code formatting support for `.mdp` files
- **NEW**: Code formatting support for `.gro` files

**BUG FIXES**

- **FIXED**: Various bug fixes and stability improvements

## 1.0.3 - 2023-01-05

### ✨ Extended Format Support

**NEW FEATURES**

- **NEW**: Syntax highlighting for `.xvg` files
- **NEW**: Syntax highlighting for `.ndx` files

**IMPROVEMENTS**

- **FIXED**: Various bug fixes
- **IMPROVED**: Updated project structure

## 1.0.2 - 2022-12-20

### 🐛 Bug Fixes

- **FIXED**: Minor stability improvements
- **IMPROVED**: Performance optimizations

## 1.0.1 - 2022-12-15

### 🐛 Bug Fixes

- **FIXED**: Initial release bug fixes
- **IMPROVED**: Enhanced stability

## 1.0.0 - 2022-02-07

### 🎉 First Major Release

**NEW FEATURES**

- **NEW**: Syntax highlighting for `.gro` files
- **NEW**: Syntax highlighting for `.itp` files
- **NEW**: Syntax highlighting for `.pdb` files
- **NEW**: Syntax highlighting for `.top` files

**IMPROVEMENTS**

- **UPDATED**: Renewed highlight colors
- **IMPROVED**: Enhanced syntax recognition

## 0.0.1 - 2022-01-15

### 🚀 Initial Release

- **NEW**: Initial extension release
- **NEW**: Basic GROMACS file support
- **NEW**: Foundation for molecular dynamics file editing in VS Code

---

## 📋 Legend

- 🚀 **Major Release** - Significant new features or breaking changes
- ✨ **New Features** - New functionality added
- 🔧 **Improvements** - Enhancements to existing features
- 🐛 **Bug Fixes** - Bug fixes and stability improvements
- 🎨 **Visual** - UI/UX improvements
- 📖 **Documentation** - Documentation updates
- 🔄 **Breaking Changes** - Changes that may break existing functionality

---
