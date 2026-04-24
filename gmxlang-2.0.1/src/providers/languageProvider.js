const vscode = require('vscode');

class TopItpLanguageProvider {
    constructor() {
        this.sectionRegex = /^\s*\[\s*([^\]]+)\s*\]/;
        this.moleculeTypeRegex = /^\s*\[\s*moleculetype\s*\]/i;
        this.atomTypesRegex = /^\s*\[\s*atomtypes\s*\]/i;
        this.bondsRegex = /^\s*\[\s*bonds\s*\]/i;
        this.anglesRegex = /^\s*\[\s*angles\s*\]/i;
        this.dihedralsRegex = /^\s*\[\s*dihedrals\s*\]/i;
        this.atomsRegex = /^\s*\[\s*atoms\s*\]/i;
    }

    // 提供文档大纲
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentSection = null;
        let currentSectionStart = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const sectionMatch = line.match(this.sectionRegex);

            if (sectionMatch) {
                // 结束上一个section
                if (currentSection) {
                    const range = new vscode.Range(
                        currentSectionStart, 0,
                        i - 1, lines[i - 1].length
                    );
                    currentSection.range = range;
                    currentSection.selectionRange = new vscode.Range(
                        currentSectionStart, 0,
                        currentSectionStart, lines[currentSectionStart].length
                    );
                    symbols.push(currentSection);
                }

                // 开始新的section
                const sectionName = sectionMatch[1].trim();
                const symbolKind = this.getSectionSymbolKind(sectionName);

                currentSection = new vscode.DocumentSymbol(
                    sectionName,
                    this.getSectionDescription(sectionName),
                    symbolKind,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                currentSection.children = [];
                currentSectionStart = i;

                // 解析section内容
                this.parseSectionContent(lines, i + 1, currentSection, sectionName);
            }
        }

        // 处理最后一个section
        if (currentSection) {
            const range = new vscode.Range(
                currentSectionStart, 0,
                lines.length - 1, lines[lines.length - 1].length
            );
            currentSection.range = range;
            currentSection.selectionRange = new vscode.Range(
                currentSectionStart, 0,
                currentSectionStart, lines[currentSectionStart].length
            );
            symbols.push(currentSection);
        }

        return symbols;
    }

    // 解析section内容
    parseSectionContent(lines, startIndex, parentSymbol, sectionName) {
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();

            // 如果遇到新的section，停止解析
            if (line.match(this.sectionRegex)) {
                break;
            }

            // 跳过注释和空行
            if (line.startsWith(';') || line.startsWith('*') || line === '') {
                continue;
            }

            // 根据section类型解析内容
            const childSymbol = this.parseLineContent(line, i, sectionName);
            if (childSymbol) {
                parentSymbol.children.push(childSymbol);
            }
        }
    }

    // 解析行内容
    parseLineContent(line, lineIndex, sectionName) {
        const parts = line.split(/\s+/).filter(part => part.length > 0);

        if (parts.length === 0) return null;

        switch (sectionName.toLowerCase()) {
        case 'moleculetype':
            if (parts.length >= 2) {
                const symbol = new vscode.DocumentSymbol(
                    parts[0],
                    `Molecule: ${parts[0]} (nrexcl: ${parts[1]})`,
                    vscode.SymbolKind.Class,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
                symbol.children = [];
                return symbol;
            }
            break;

        case 'atomtypes':
            if (parts.length >= 6) {
                const symbol = new vscode.DocumentSymbol(
                    parts[0],
                    `Atom Type: ${parts[0]} (mass: ${parts[2]}, charge: ${parts[3]})`,
                    vscode.SymbolKind.Property,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
                symbol.children = [];
                return symbol;
            }
            break;

        case 'atoms':
            if (parts.length >= 4) {
                const symbol = new vscode.DocumentSymbol(
                    `${parts[0]}: ${parts[4] || parts[1]}`,
                    `Atom ${parts[0]}: type=${parts[1]}, residue=${parts[2]}, name=${parts[4] || 'N/A'}`,
                    vscode.SymbolKind.Variable,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
                symbol.children = [];
                return symbol;
            }
            break;

        case 'bonds':
            if (parts.length >= 3) {
                const symbol = new vscode.DocumentSymbol(
                    `${parts[0]}-${parts[1]}`,
                    `Bond: ${parts[0]}-${parts[1]} (type: ${parts[2]})`,
                    vscode.SymbolKind.Method,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
                symbol.children = [];
                return symbol;
            }
            break;

        case 'angles':
            if (parts.length >= 4) {
                const symbol = new vscode.DocumentSymbol(
                    `${parts[0]}-${parts[1]}-${parts[2]}`,
                    `Angle: ${parts[0]}-${parts[1]}-${parts[2]} (type: ${parts[3]})`,
                    vscode.SymbolKind.Method,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
                symbol.children = [];
                return symbol;
            }
            break;

        case 'dihedrals':
            if (parts.length >= 5) {
                const symbol = new vscode.DocumentSymbol(
                    `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`,
                    `Dihedral: ${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]} (type: ${parts[4]})`,
                    vscode.SymbolKind.Method,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
                symbol.children = [];
                return symbol;
            }
            break;
        }

        return null;
    }

    // 获取section的符号类型
    getSectionSymbolKind(sectionName) {
        switch (sectionName.toLowerCase()) {
        case 'moleculetype':
            return vscode.SymbolKind.Class;
        case 'atomtypes':
            return vscode.SymbolKind.Enum;
        case 'atoms':
            return vscode.SymbolKind.Array;
        case 'bonds':
        case 'angles':
        case 'dihedrals':
            return vscode.SymbolKind.Function;
        case 'system':
            return vscode.SymbolKind.Module;
        case 'molecules':
            return vscode.SymbolKind.Namespace;
        default:
            return vscode.SymbolKind.Object;
        }
    }

    // 获取section描述
    getSectionDescription(sectionName) {
        switch (sectionName.toLowerCase()) {
        case 'moleculetype':
            return 'Molecule type definition';
        case 'atomtypes':
            return 'Atom type parameters';
        case 'atoms':
            return 'Atom definitions';
        case 'bonds':
            return 'Bond parameters';
        case 'angles':
            return 'Angle parameters';
        case 'dihedrals':
            return 'Dihedral parameters';
        case 'system':
            return 'System information';
        case 'molecules':
            return 'Molecule composition';
        default:
            return `Section: ${sectionName}`;
        }
    }

    // 提供代码折叠
    provideFoldingRanges(document) {
        const config = vscode.workspace.getConfiguration('gmxlang.outline');
        const foldNonImportant = config.get('foldNonImportantSections', true);

        const foldingRanges = [];
        const text = document.getText();
        const lines = text.split('\n');

        let sectionStart = -1;
        let sectionName = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const sectionMatch = line.match(this.sectionRegex);

            if (sectionMatch) {
                // 结束上一个section的折叠
                if (sectionStart !== -1 && i > sectionStart + 1) {
                    const isImportant = this.isImportantSection(sectionName);
                    const shouldAutoFold = foldNonImportant && !isImportant;
                    const foldingRange = new vscode.FoldingRange(
                        sectionStart,
                        i - 1,
                        shouldAutoFold ? vscode.FoldingRangeKind.Comment : vscode.FoldingRangeKind.Region
                    );
                    foldingRanges.push(foldingRange);
                }

                // 开始新的section折叠
                sectionStart = i;
                sectionName = sectionMatch[1].trim();
            }
        }

        // 处理最后一个section
        if (sectionStart !== -1 && sectionStart < lines.length - 1) {
            const isImportant = this.isImportantSection(sectionName);
            const shouldAutoFold = foldNonImportant && !isImportant;
            const foldingRange = new vscode.FoldingRange(
                sectionStart,
                lines.length - 1,
                shouldAutoFold ? vscode.FoldingRangeKind.Comment : vscode.FoldingRangeKind.Region
            );
            foldingRanges.push(foldingRange);
        }

        return foldingRanges;
    }

    // 判断是否为重要section（不自动折叠）
    isImportantSection(sectionName) {
        const importantSections = ['moleculetype', 'atoms', 'system', 'molecules'];
        return importantSections.some(section =>
            sectionName.toLowerCase().includes(section.toLowerCase())
        );
    }
}

class GroLanguageProvider {
    constructor() {
        this.atomLineRegex = /^\s*(\d+)([A-Za-z]+)\s+([A-Za-z0-9]+)\s+(\d+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/;
    }

    // 提供文档大纲
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');

        let atomCount = 0;
        let currentResidue = null;
        let residueAtoms = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 跳过标题行和原子数量行
            if (i === 0 || (i === 1 && /^\d+$/.test(line))) {
                continue;
            }

            // 跳过盒子尺寸行
            if (i === lines.length - 1 && /^[\d.\s]+$/.test(line)) {
                continue;
            }

            const atomMatch = line.match(this.atomLineRegex);
            if (atomMatch) {
                const residueNum = atomMatch[1];
                const residueName = atomMatch[2];
                const atomName = atomMatch[3];
                const atomNum = atomMatch[4];
                const x = parseFloat(atomMatch[5]);
                const y = parseFloat(atomMatch[6]);
                const z = parseFloat(atomMatch[7]);

                // 创建原子符号
                const atomSymbol = new vscode.DocumentSymbol(
                    `${atomName} (${atomNum})`,
                    `Atom ${atomNum}: ${atomName} at (${x.toFixed(3)}, ${y.toFixed(3)}, ${z.toFixed(3)})`,
                    vscode.SymbolKind.Variable,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, atomName.length)
                );
                atomSymbol.children = [];

                // 检查是否是新的残基
                const residueKey = `${residueNum}${residueName}`;
                if (currentResidue !== residueKey) {
                    // 保存上一个残基
                    if (currentResidue && residueAtoms.length > 0) {
                        const residueSymbol = new vscode.DocumentSymbol(
                            `${currentResidue}`,
                            `Residue ${currentResidue} (${residueAtoms.length} atoms)`,
                            vscode.SymbolKind.Class,
                            new vscode.Range(
                                residueAtoms[0].range.start.line,
                                0,
                                residueAtoms[residueAtoms.length - 1].range.end.line,
                                residueAtoms[residueAtoms.length - 1].range.end.character
                            ),
                            new vscode.Range(
                                residueAtoms[0].range.start.line,
                                0,
                                residueAtoms[0].range.start.line,
                                currentResidue.length
                            )
                        );
                        residueSymbol.children = [...residueAtoms];
                        symbols.push(residueSymbol);
                    }

                    // 开始新的残基
                    currentResidue = residueKey;
                    residueAtoms = [];
                }

                residueAtoms.push(atomSymbol);
                atomCount++;
            }
        }

        // 处理最后一个残基
        if (currentResidue && residueAtoms.length > 0) {
            const residueSymbol = new vscode.DocumentSymbol(
                `${currentResidue}`,
                `Residue ${currentResidue} (${residueAtoms.length} atoms)`,
                vscode.SymbolKind.Class,
                new vscode.Range(
                    residueAtoms[0].range.start.line,
                    0,
                    residueAtoms[residueAtoms.length - 1].range.end.line,
                    residueAtoms[residueAtoms.length - 1].range.end.character
                ),
                new vscode.Range(
                    residueAtoms[0].range.start.line,
                    0,
                    residueAtoms[0].range.start.line,
                    currentResidue.length
                )
            );
            residueSymbol.children = [...residueAtoms];
            symbols.push(residueSymbol);
        }

        return symbols;
    }

    // 提供代码折叠
    provideFoldingRanges(document) {
        const config = vscode.workspace.getConfiguration('gmxlang.outline');
        const foldProteinResidues = config.get('foldProteinResidues', true);

        const foldingRanges = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentResidue = null;
        let residueStart = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            const atomMatch = line.match(this.atomLineRegex);
            if (atomMatch) {
                const residueNum = atomMatch[1];
                const residueName = atomMatch[2];
                const residueKey = `${residueNum}${residueName}`;

                if (currentResidue !== residueKey) {
                    // 结束上一个残基的折叠
                    if (currentResidue && residueStart !== -1 && i > residueStart + 1) {
                        const shouldAutoFold = foldProteinResidues && this.isProteinResidue(currentResidue);
                        const foldingRange = new vscode.FoldingRange(
                            residueStart,
                            i - 1,
                            shouldAutoFold ? vscode.FoldingRangeKind.Comment : vscode.FoldingRangeKind.Region
                        );
                        foldingRanges.push(foldingRange);
                    }

                    // 开始新的残基折叠
                    currentResidue = residueKey;
                    residueStart = i;
                }
            }
        }

        // 处理最后一个残基
        if (currentResidue && residueStart !== -1) {
            // 找到最后一个原子行
            let lastAtomLine = -1;
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].match(this.atomLineRegex)) {
                    lastAtomLine = i;
                    break;
                }
            }

            if (lastAtomLine > residueStart + 1) {
                const shouldAutoFold = foldProteinResidues && this.isProteinResidue(currentResidue);
                const foldingRange = new vscode.FoldingRange(
                    residueStart,
                    lastAtomLine,
                    shouldAutoFold ? vscode.FoldingRangeKind.Comment : vscode.FoldingRangeKind.Region
                );
                foldingRanges.push(foldingRange);
            }
        }

        return foldingRanges;
    }

    // 判断是否为蛋白质残基（自动折叠）
    isProteinResidue(residueKey) {
        const standardResidues = [
            'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
            'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL'
        ];
        const terminalResidues = [
            'NALA', 'NARG', 'NASN', 'NASP', 'NCYS', 'NGLN', 'NGLU', 'NGLY', 'NHIS', 'NILE',
            'NLEU', 'NLYS', 'NMET', 'NPHE', 'NPRO', 'NSER', 'NTHR', 'NTRP', 'NTYR', 'NVAL',
            'CALA', 'CARG', 'CASN', 'CASP', 'CCYS', 'CGLN', 'CGLU', 'CGLY', 'CHIS', 'CILE',
            'CLEU', 'CLYS', 'CMET', 'CPHE', 'CPRO', 'CSER', 'CTHR', 'CTRP', 'CTYR', 'CVAL',
            'ACE', 'NME', 'NH2', 'CT3'  // 其他常见端基
        ];

        // 从residueKey中提取残基名称（去掉数字）
        const residueName = residueKey.replace(/^\d+/, '').toUpperCase();
        return standardResidues.includes(residueName) || terminalResidues.includes(residueName);
    }
}

class PdbLanguageProvider {
    constructor() {
        this.atomRegex = /^ATOM\s+(\d+)\s+(\w+)\s+(\w+)\s+([A-Z])\s+(\d+)/;
        this.headerRegex = /^(HEADER|TITLE|COMPND|SOURCE|KEYWDS|EXPDTA|AUTHOR|REVDAT|JRNL|REMARK)/;
        this.connectRegex = /^(CONECT|HETATM|TER|END)/;
    }

    // 提供文档大纲
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentResidue = null;
        let residueAtoms = [];
        let headerLines = [];
        let connectLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 处理头部信息
            if (this.headerRegex.test(line)) {
                headerLines.push({
                    line: i,
                    content: line
                });
                continue;
            }

            // 处理连接信息
            if (this.connectRegex.test(line)) {
                connectLines.push({
                    line: i,
                    content: line
                });
                continue;
            }

            // 处理ATOM记录
            const atomMatch = line.match(this.atomRegex);
            if (atomMatch) {
                const atomNum = atomMatch[1];
                const atomName = atomMatch[2];
                const residueName = atomMatch[3];
                const chainId = atomMatch[4];
                const residueNum = atomMatch[5];

                const atomSymbol = new vscode.DocumentSymbol(
                    `${atomName} (${atomNum})`,
                    `Atom ${atomNum}: ${atomName} at (${line.substring(30, 38).trim()}, ${line.substring(38, 46).trim()}, ${line.substring(46, 54).trim()})`,
                    vscode.SymbolKind.Variable,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, atomName.length)
                );

                const residueKey = `${chainId}:${residueNum}${residueName}`;
                if (currentResidue !== residueKey) {
                    // 保存上一个残基
                    if (currentResidue && residueAtoms.length > 0) {
                        const residueSymbol = new vscode.DocumentSymbol(
                            `${currentResidue}`,
                            `Residue ${currentResidue} (${residueAtoms.length} atoms)`,
                            vscode.SymbolKind.Class,
                            new vscode.Range(
                                residueAtoms[0].range.start.line,
                                0,
                                residueAtoms[residueAtoms.length - 1].range.end.line,
                                residueAtoms[residueAtoms.length - 1].range.end.character
                            ),
                            new vscode.Range(
                                residueAtoms[0].range.start.line,
                                0,
                                residueAtoms[0].range.start.line,
                                currentResidue.length
                            )
                        );
                        residueSymbol.children = [...residueAtoms];
                        symbols.push(residueSymbol);
                    }

                    // 开始新的残基
                    currentResidue = residueKey;
                    residueAtoms = [];
                }

                residueAtoms.push(atomSymbol);
            }
        }

        // 处理最后一个残基
        if (currentResidue && residueAtoms.length > 0) {
            const residueSymbol = new vscode.DocumentSymbol(
                `${currentResidue}`,
                `Residue ${currentResidue} (${residueAtoms.length} atoms)`,
                vscode.SymbolKind.Class,
                new vscode.Range(
                    residueAtoms[0].range.start.line,
                    0,
                    residueAtoms[residueAtoms.length - 1].range.end.line,
                    residueAtoms[residueAtoms.length - 1].range.end.character
                ),
                new vscode.Range(
                    residueAtoms[0].range.start.line,
                    0,
                    residueAtoms[0].range.start.line,
                    currentResidue.length
                )
            );
            residueSymbol.children = [...residueAtoms];
            symbols.push(residueSymbol);
        }

        // 添加头部信息组
        if (headerLines.length > 0) {
            const headerSymbol = new vscode.DocumentSymbol(
                'Header Information',
                `PDB Header (${headerLines.length} lines)`,
                vscode.SymbolKind.Module,
                new vscode.Range(
                    headerLines[0].line,
                    0,
                    headerLines[headerLines.length - 1].line,
                    headerLines[headerLines.length - 1].content.length
                ),
                new vscode.Range(
                    headerLines[0].line,
                    0,
                    headerLines[0].line,
                    headerLines[0].content.length
                )
            );
            symbols.unshift(headerSymbol); // 添加到开头
        }

        // 添加连接信息组
        if (connectLines.length > 0) {
            const connectSymbol = new vscode.DocumentSymbol(
                'Connectivity',
                `Connection data (${connectLines.length} lines)`,
                vscode.SymbolKind.Module,
                new vscode.Range(
                    connectLines[0].line,
                    0,
                    connectLines[connectLines.length - 1].line,
                    connectLines[connectLines.length - 1].content.length
                ),
                new vscode.Range(
                    connectLines[0].line,
                    0,
                    connectLines[0].line,
                    connectLines[0].content.length
                )
            );
            symbols.push(connectSymbol);
        }

        return symbols;
    }

    // 提供代码折叠
    provideFoldingRanges(document) {
        const config = vscode.workspace.getConfiguration('gmxlang.outline');
        const foldProteinResidues = config.get('foldProteinResidues', true);

        const foldingRanges = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentResidue = null;
        let residueStart = -1;
        let headerStart = -1;
        let connectStart = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 处理头部信息折叠
            if (this.headerRegex.test(line)) {
                if (headerStart === -1) {
                    headerStart = i;
                }
                continue;
            } else if (headerStart !== -1) {
                // 结束头部信息区域
                if (i > headerStart + 1) {
                    foldingRanges.push(new vscode.FoldingRange(headerStart, i - 1));
                }
                headerStart = -1;
            }

            // 处理连接信息折叠
            if (this.connectRegex.test(line)) {
                if (connectStart === -1) {
                    connectStart = i;
                }
                continue;
            } else if (connectStart !== -1) {
                // 结束连接信息区域
                if (i > connectStart + 1) {
                    foldingRanges.push(new vscode.FoldingRange(connectStart, i - 1));
                }
                connectStart = -1;
            }

            // 处理ATOM记录折叠
            const atomMatch = line.match(this.atomRegex);
            if (atomMatch && foldProteinResidues) {
                const residueName = atomMatch[3];
                const chainId = atomMatch[4];
                const residueNum = atomMatch[5];
                const residueKey = `${chainId}:${residueNum}${residueName}`;

                if (currentResidue !== residueKey) {
                    // 结束上一个残基的折叠
                    if (currentResidue && residueStart !== -1 && i > residueStart + 1) {
                        foldingRanges.push(new vscode.FoldingRange(residueStart, i - 1));
                    }

                    // 开始新的残基
                    currentResidue = residueKey;
                    residueStart = i;
                }
            }
        }

        // 处理最后的区域
        if (headerStart !== -1 && lines.length > headerStart + 1) {
            foldingRanges.push(new vscode.FoldingRange(headerStart, lines.length - 1));
        }
        if (connectStart !== -1 && lines.length > connectStart + 1) {
            foldingRanges.push(new vscode.FoldingRange(connectStart, lines.length - 1));
        }
        if (currentResidue && residueStart !== -1 && lines.length > residueStart + 1) {
            foldingRanges.push(new vscode.FoldingRange(residueStart, lines.length - 1));
        }

        return foldingRanges;
    }
}

class NdxLanguageProvider {
    constructor() {
        this.groupRegex = /^\s*\[\s*([^\]]+)\s*\]/;
    }

    // 提供文档大纲
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentGroup = null;
        let currentGroupStart = 0;
        let atomCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const groupMatch = line.match(this.groupRegex);

            if (groupMatch) {
                // 结束上一个group
                if (currentGroup) {
                    const range = new vscode.Range(
                        currentGroupStart, 0,
                        i - 1, lines[i - 1].length
                    );
                    currentGroup.range = range;
                    currentGroup.selectionRange = new vscode.Range(
                        currentGroupStart, 0,
                        currentGroupStart, lines[currentGroupStart].length
                    );
                    // 更新描述以包含原子数量
                    currentGroup.detail = `Index group (${atomCount} atoms)`;
                    symbols.push(currentGroup);
                }

                // 开始新的group
                const groupName = groupMatch[1].trim();
                currentGroup = new vscode.DocumentSymbol(
                    groupName,
                    'Index group',
                    vscode.SymbolKind.Class,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                currentGroupStart = i;
                atomCount = 0;
            } else if (currentGroup && line.length > 0 && !line.startsWith(';')) {
                // 计算当前行的原子数量
                const numbers = line.split(/\s+/).filter(item => /^\d+$/.test(item));
                atomCount += numbers.length;
            }
        }

        // 处理最后一个group
        if (currentGroup) {
            const range = new vscode.Range(
                currentGroupStart, 0,
                lines.length - 1, lines[lines.length - 1].length
            );
            currentGroup.range = range;
            currentGroup.selectionRange = new vscode.Range(
                currentGroupStart, 0,
                currentGroupStart, lines[currentGroupStart].length
            );
            currentGroup.detail = `Index group (${atomCount} atoms)`;
            symbols.push(currentGroup);
        }

        return symbols;
    }

    // 提供代码折叠
    provideFoldingRanges(document) {
        const config = vscode.workspace.getConfiguration('gmxlang.outline');
        const foldNonImportantSections = config.get('foldNonImportantSections', true);

        if (!foldNonImportantSections) {
            return [];
        }

        const foldingRanges = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentGroupStart = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const groupMatch = line.match(this.groupRegex);

            if (groupMatch) {
                // 结束上一个group的折叠
                if (currentGroupStart !== -1 && i > currentGroupStart + 1) {
                    foldingRanges.push(new vscode.FoldingRange(currentGroupStart, i - 1));
                }

                // 开始新的group
                currentGroupStart = i;
            }
        }

        // 处理最后一个group
        if (currentGroupStart !== -1 && lines.length > currentGroupStart + 1) {
            foldingRanges.push(new vscode.FoldingRange(currentGroupStart, lines.length - 1));
        }

        return foldingRanges;
    }
}

class PrmtopLanguageProvider {
    constructor() {
        this.flagRegex = /^%FLAG\s+([A-Z_]+)/;
        this.formatRegex = /^%FORMAT\s*\(([^)]+)\)/;
        this.versionRegex = /^%VERSION/;

        // 重要的 FLAG 部分（不自动折叠）
        this.importantFlags = [
            'TITLE', 'POINTERS', 'ATOM_NAME', 'CHARGE', 'MASS',
            'ATOM_TYPE_INDEX', 'RESIDUE_LABEL', 'RESIDUE_POINTER'
        ];

        // 原子相关的 FLAG
        this.atomFlags = [
            'ATOM_NAME', 'CHARGE', 'MASS', 'ATOM_TYPE_INDEX',
            'ATOMIC_NUMBER', 'RADII', 'SCREEN'
        ];

        // 残基相关的 FLAG
        this.residueFlags = [
            'RESIDUE_LABEL', 'RESIDUE_POINTER'
        ];

        // 键合相关的 FLAG
        this.bondFlags = [
            'BONDS_INC_HYDROGEN', 'BONDS_WITHOUT_HYDROGEN',
            'ANGLES_INC_HYDROGEN', 'ANGLES_WITHOUT_HYDROGEN',
            'DIHEDRALS_INC_HYDROGEN', 'DIHEDRALS_WITHOUT_HYDROGEN'
        ];
    }

    // 提供文档大纲
    provideDocumentSymbols(document) {
        const symbols = [];
        const text = document.getText();
        const lines = text.split('\n');

        let currentFlag = null;
        let currentFlagStart = 0;
        let currentFormat = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 检查 %VERSION 行
            const versionMatch = line.match(this.versionRegex);
            if (versionMatch) {
                const versionSymbol = new vscode.DocumentSymbol(
                    'VERSION',
                    `AMBER Parameter/Topology File Version: ${line.split('=')[1] || 'Unknown'}`,
                    vscode.SymbolKind.Module,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, 8)
                );
                versionSymbol.children = [];
                symbols.push(versionSymbol);
                continue;
            }

            // 检查 %FLAG 行
            const flagMatch = line.match(this.flagRegex);
            if (flagMatch) {
                // 结束上一个 FLAG
                if (currentFlag) {
                    const range = new vscode.Range(
                        currentFlagStart, 0,
                        i - 1, lines[i - 1].length
                    );
                    currentFlag.range = range;
                    currentFlag.selectionRange = new vscode.Range(
                        currentFlagStart, 0,
                        currentFlagStart, lines[currentFlagStart].length
                    );
                    symbols.push(currentFlag);
                }

                // 开始新的 FLAG
                const flagName = flagMatch[1];
                const symbolKind = this.getFlagSymbolKind(flagName);

                currentFlag = new vscode.DocumentSymbol(
                    flagName,
                    this.getFlagDescription(flagName),
                    symbolKind,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                currentFlag.children = [];
                currentFlagStart = i;
                currentFormat = null;

                continue;
            }

            // 检查 %FORMAT 行
            const formatMatch = line.match(this.formatRegex);
            if (formatMatch && currentFlag) {
                currentFormat = formatMatch[1];
                const formatSymbol = new vscode.DocumentSymbol(
                    `FORMAT: ${currentFormat}`,
                    `Data format specification: ${currentFormat}`,
                    vscode.SymbolKind.Property,
                    new vscode.Range(i, 0, i, line.length),
                    new vscode.Range(i, 0, i, line.length)
                );
                formatSymbol.children = [];
                currentFlag.children.push(formatSymbol);
                continue;
            }

            // 解析数据内容
            if (currentFlag && line && !line.startsWith(';') && !line.startsWith('*')) {
                const dataSymbol = this.parseDataContent(line, i, currentFlag.name, currentFormat);
                if (dataSymbol) {
                    currentFlag.children.push(dataSymbol);
                }
            }
        }

        // 处理最后一个 FLAG
        if (currentFlag) {
            const range = new vscode.Range(
                currentFlagStart, 0,
                lines.length - 1, lines[lines.length - 1].length
            );
            currentFlag.range = range;
            currentFlag.selectionRange = new vscode.Range(
                currentFlagStart, 0,
                currentFlagStart, lines[currentFlagStart].length
            );
            symbols.push(currentFlag);
        }

        return symbols;
    }

    // 解析数据内容
    parseDataContent(line, lineIndex, flagName, format) {
        // 跳过空行和注释
        if (!line.trim() || line.startsWith(';') || line.startsWith('*')) {
            return null;
        }

        const parts = line.trim().split(/\s+/).filter(part => part.length > 0);
        if (parts.length === 0) return null;

        switch (flagName) {
        case 'TITLE':
            return new vscode.DocumentSymbol(
                `Title: ${line.trim()}`,
                `System title: ${line.trim()}`,
                vscode.SymbolKind.String,
                new vscode.Range(lineIndex, 0, lineIndex, line.length),
                new vscode.Range(lineIndex, 0, lineIndex, Math.min(20, line.length))
            );

        case 'POINTERS':
            if (parts.length >= 10) {
                return new vscode.DocumentSymbol(
                    'System Info',
                    `Atoms: ${parts[0]}, Types: ${parts[1]}, Bonds: ${parts[2]}, Angles: ${parts[3]}`,
                    vscode.SymbolKind.Number,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, parts[0].length)
                );
            }
            break;

        case 'ATOM_NAME':
            // 每行可能包含多个原子名称
            if (parts.length > 0) {
                const atomNames = parts.slice(0, Math.min(10, parts.length)).join(', ');
                return new vscode.DocumentSymbol(
                    `Atoms: ${atomNames}${parts.length > 10 ? '...' : ''}`,
                    `Atom names (${parts.length} atoms): ${atomNames}`,
                    vscode.SymbolKind.Variable,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, Math.min(30, line.length))
                );
            }
            break;

        case 'CHARGE':
            if (parts.length > 0) {
                const charges = parts.slice(0, 3).map(c => parseFloat(c).toFixed(3)).join(', ');
                return new vscode.DocumentSymbol(
                    `Charges: ${charges}${parts.length > 3 ? '...' : ''}`,
                    `Atomic charges (${parts.length} values): ${charges}`,
                    vscode.SymbolKind.Number,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, Math.min(30, line.length))
                );
            }
            break;

        case 'MASS':
            if (parts.length > 0) {
                const masses = parts.slice(0, 3).map(m => parseFloat(m).toFixed(3)).join(', ');
                return new vscode.DocumentSymbol(
                    `Masses: ${masses}${parts.length > 3 ? '...' : ''}`,
                    `Atomic masses (${parts.length} values): ${masses}`,
                    vscode.SymbolKind.Number,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, Math.min(30, line.length))
                );
            }
            break;

        case 'RESIDUE_LABEL':
            if (parts.length > 0) {
                const residues = parts.slice(0, 5).join(', ');
                return new vscode.DocumentSymbol(
                    `Residues: ${residues}${parts.length > 5 ? '...' : ''}`,
                    `Residue names (${parts.length} residues): ${residues}`,
                    vscode.SymbolKind.Class,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, Math.min(30, line.length))
                );
            }
            break;

        default:
            // 对于其他数据，显示前几个值
            if (parts.length > 0) {
                const preview = parts.slice(0, 5).join(', ');
                return new vscode.DocumentSymbol(
                    `Data: ${preview}${parts.length > 5 ? '...' : ''}`,
                    `${flagName} data (${parts.length} values): ${preview}`,
                    vscode.SymbolKind.Array,
                    new vscode.Range(lineIndex, 0, lineIndex, line.length),
                    new vscode.Range(lineIndex, 0, lineIndex, Math.min(30, line.length))
                );
            }
        }

        return null;
    }

    // 获取 FLAG 的符号类型
    getFlagSymbolKind(flagName) {
        if (this.atomFlags.includes(flagName)) {
            return vscode.SymbolKind.Variable;
        } else if (this.residueFlags.includes(flagName)) {
            return vscode.SymbolKind.Class;
        } else if (this.bondFlags.includes(flagName)) {
            return vscode.SymbolKind.Function;
        } else if (flagName === 'TITLE') {
            return vscode.SymbolKind.String;
        } else if (flagName === 'POINTERS') {
            return vscode.SymbolKind.Struct;
        } else {
            return vscode.SymbolKind.Object;
        }
    }

    // 获取 FLAG 描述
    getFlagDescription(flagName) {
        const descriptions = {
            'TITLE': 'System title and description',
            'POINTERS': 'System size and topology pointers',
            'ATOM_NAME': 'Atom names for all atoms',
            'CHARGE': 'Atomic partial charges',
            'MASS': 'Atomic masses',
            'ATOM_TYPE_INDEX': 'Atom type indices',
            'RESIDUE_LABEL': 'Residue names',
            'RESIDUE_POINTER': 'Residue boundary pointers',
            'BONDS_INC_HYDROGEN': 'Bonds including hydrogen atoms',
            'BONDS_WITHOUT_HYDROGEN': 'Bonds not including hydrogen atoms',
            'ANGLES_INC_HYDROGEN': 'Angles including hydrogen atoms',
            'ANGLES_WITHOUT_HYDROGEN': 'Angles not including hydrogen atoms',
            'DIHEDRALS_INC_HYDROGEN': 'Dihedrals including hydrogen atoms',
            'DIHEDRALS_WITHOUT_HYDROGEN': 'Dihedrals not including hydrogen atoms',
            'BOND_FORCE_CONSTANT': 'Bond force constants',
            'BOND_EQUIL_VALUE': 'Bond equilibrium values',
            'ANGLE_FORCE_CONSTANT': 'Angle force constants',
            'ANGLE_EQUIL_VALUE': 'Angle equilibrium values',
            'DIHEDRAL_FORCE_CONSTANT': 'Dihedral force constants',
            'DIHEDRAL_PERIODICITY': 'Dihedral periodicity',
            'DIHEDRAL_PHASE': 'Dihedral phase angles',
            'LENNARD_JONES_ACOEF': 'Lennard-Jones A coefficients',
            'LENNARD_JONES_BCOEF': 'Lennard-Jones B coefficients'
        };

        return descriptions[flagName] || `AMBER topology data: ${flagName}`;
    }

    // 提供代码折叠
    provideFoldingRanges(document) {
        const config = vscode.workspace.getConfiguration('gmxlang.outline');
        const foldNonImportant = config.get('foldNonImportantSections', true);

        const foldingRanges = [];
        const text = document.getText();
        const lines = text.split('\n');

        let flagStart = -1;
        let flagName = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 检查 %FLAG 或 %VERSION 行
            const flagMatch = line.match(this.flagRegex) || line.match(this.versionRegex);
            if (flagMatch) {
                // 结束上一个 FLAG 的折叠
                if (flagStart !== -1 && i > flagStart + 1) {
                    const isImportant = this.isImportantFlag(flagName);
                    const shouldAutoFold = foldNonImportant && !isImportant;
                    const foldingRange = new vscode.FoldingRange(
                        flagStart,
                        i - 1,
                        shouldAutoFold ? vscode.FoldingRangeKind.Comment : vscode.FoldingRangeKind.Region
                    );
                    foldingRanges.push(foldingRange);
                }

                // 开始新的 FLAG 折叠
                flagStart = i;
                flagName = flagMatch[1] || 'VERSION';
            }
        }

        // 处理最后一个 FLAG
        if (flagStart !== -1 && flagStart < lines.length - 1) {
            const isImportant = this.isImportantFlag(flagName);
            const shouldAutoFold = foldNonImportant && !isImportant;
            const foldingRange = new vscode.FoldingRange(
                flagStart,
                lines.length - 1,
                shouldAutoFold ? vscode.FoldingRangeKind.Comment : vscode.FoldingRangeKind.Region
            );
            foldingRanges.push(foldingRange);
        }

        return foldingRanges;
    }

    // 判断是否为重要 FLAG（不自动折叠）
    isImportantFlag(flagName) {
        return this.importantFlags.includes(flagName) || flagName === 'VERSION';
    }

    // 提供悬停信息
    provideHover(document, position) {
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // 检查是否在 %FLAG 行上
        const flagMatch = lineText.match(this.flagRegex);
        if (flagMatch) {
            const flagName = flagMatch[1];
            const description = this.getFlagDescription(flagName);
            const markdown = new vscode.MarkdownString();
            markdown.appendCodeblock(`%FLAG ${flagName}`, 'amber-prmtop');
            markdown.appendMarkdown(`\n**${description}**\n\n`);

            // 添加额外信息
            if (this.atomFlags.includes(flagName)) {
                markdown.appendMarkdown('*Atom-related data section*');
            } else if (this.residueFlags.includes(flagName)) {
                markdown.appendMarkdown('*Residue-related data section*');
            } else if (this.bondFlags.includes(flagName)) {
                markdown.appendMarkdown('*Bonding topology data section*');
            }

            return new vscode.Hover(markdown);
        }

        // 检查是否在 %FORMAT 行上
        const formatMatch = lineText.match(this.formatRegex);
        if (formatMatch) {
            const format = formatMatch[1];
            const markdown = new vscode.MarkdownString();
            markdown.appendCodeblock(`%FORMAT(${format})`, 'amber-prmtop');
            markdown.appendMarkdown('\n**FORTRAN format specification**\n\n');
            markdown.appendMarkdown(`Format: \`${format}\`\n\n`);
            markdown.appendMarkdown('*Defines how the following data should be read*');

            return new vscode.Hover(markdown);
        }

        return null;
    }
}

module.exports = {
    TopItpLanguageProvider,
    GroLanguageProvider,
    PdbLanguageProvider,
    NdxLanguageProvider,
    PrmtopLanguageProvider
};
