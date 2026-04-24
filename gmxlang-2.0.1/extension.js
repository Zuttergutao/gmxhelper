// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const {
    TopItpLanguageProvider,
    GroLanguageProvider,
    PdbLanguageProvider,
    NdxLanguageProvider,
    PrmtopLanguageProvider,
    hover,
    XvgViewerProvider,
    StructureViewerProvider
} = require('./src/index.js');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */


function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "gmxlang" is now active!');

    // 判断插件是否第一次安装
    const extensionId = 'Casea1998.gmxlang';
    const extension = vscode.extensions.getExtension(extensionId);
    const jsonFilePath = path.join(__dirname, 'src/syntaxes/color.json');
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    const settings = JSON.parse(jsonData);
    const config = vscode.workspace.getConfiguration();

    // 获取当前用户的tokenColorCustomizations配置
    const currentConfig = vscode.workspace.getConfiguration('editor.tokenColorCustomizations').get('textMateRules', []);
    
    // 检查是否需要更新颜色配置
    let needsUpdate = false;
    
    if (currentConfig.length === 0) {
        // 如果用户没有任何textMateRules，直接应用所有规则
        needsUpdate = true;
    } else {
        // 检查是否有新的颜色规则需要添加
        const currentScopes = new Set(currentConfig.map(rule => rule.scope));
        const newRules = settings.textMateRules.filter(rule => !currentScopes.has(rule.scope));
        
        if (newRules.length > 0) {
            // 合并现有规则和新规则
            const mergedRules = [...currentConfig, ...newRules];
            settings.textMateRules = mergedRules;
            needsUpdate = true;
        }
    }
    
    if (needsUpdate) {
        // 更新全局设置中的自定义颜色
        config.update('editor.tokenColorCustomizations', settings, vscode.ConfigurationTarget.Global);
    }

    // hover激活
    context.subscriptions.push(...hover);

    // 注册TOP/ITP语言服务提供者
    const topItpProvider = new TopItpLanguageProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider('top', topItpProvider),
        vscode.languages.registerDocumentSymbolProvider('itp', topItpProvider),
        vscode.languages.registerFoldingRangeProvider('top', topItpProvider),
        vscode.languages.registerFoldingRangeProvider('itp', topItpProvider)
    );

    // 注册GRO语言服务提供者
    const groProvider = new GroLanguageProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider('gro', groProvider),
        vscode.languages.registerFoldingRangeProvider('gro', groProvider)
    );

    // 注册PDB语言服务提供者
    const pdbProvider = new PdbLanguageProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider('pdb', pdbProvider),
        vscode.languages.registerFoldingRangeProvider('pdb', pdbProvider)
    );

    // 注册NDX语言服务提供者
    const ndxProvider = new NdxLanguageProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider('ndx', ndxProvider),
        vscode.languages.registerFoldingRangeProvider('ndx', ndxProvider)
    );

    // 注册PRMTOP语言服务提供者
    const prmtopProvider = new PrmtopLanguageProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider('amber-prmtop', prmtopProvider),
        vscode.languages.registerFoldingRangeProvider('amber-prmtop', prmtopProvider),
        vscode.languages.registerHoverProvider('amber-prmtop', prmtopProvider)
    );

    // 配置自动折叠功能
    function applyAutoFolding(document) {
        const config = vscode.workspace.getConfiguration('gmxlang.outline');
        const autoFold = config.get('autoFold', true);
        const autoCollapseOutlineView = config.get('autoCollapseOutlineView', true);

        if (['top', 'itp', 'gro', 'pdb', 'ndx', 'amber-prmtop'].includes(document.languageId)) {
            // 延迟执行以确保文档完全加载
            setTimeout(() => {
                // 折叠编辑器中的代码
                if (autoFold) {
                    vscode.commands.executeCommand('editor.foldLevel1');
                }
                // 折叠侧边栏大纲
                if (autoCollapseOutlineView) {
                    vscode.commands.executeCommand('outline.collapse');
                }
            }, 100);
        }
    }

    vscode.workspace.onDidOpenTextDocument(applyAutoFolding);

    // 为当前已打开的文档应用折叠
    vscode.workspace.textDocuments.forEach(applyAutoFolding);

    // 监听配置变化
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('gmxlang.outline')) {
            // 配置变化时重新应用折叠
            vscode.workspace.textDocuments.forEach(document => {
                if (['top', 'itp', 'gro', 'pdb', 'ndx', 'amber-prmtop'].includes(document.languageId)) {
                    applyAutoFolding(document);
                }
            });
        }
    });

    // 注册大纲折叠命令
    context.subscriptions.push(
        vscode.commands.registerCommand('gmxlang.collapseOutline', () => {
            vscode.commands.executeCommand('outline.collapse');
        }),
        vscode.commands.registerCommand('gmxlang.expandOutline', () => {
            vscode.commands.executeCommand('outline.expand');
        }),
        vscode.commands.registerCommand('gmxlang.foldAllSections', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && ['top', 'itp', 'gro', 'pdb', 'ndx', 'amber-prmtop'].includes(editor.document.languageId)) {
                // 折叠编辑器中的所有区域
                vscode.commands.executeCommand('editor.foldAll');
                // 折叠侧边栏大纲
                vscode.commands.executeCommand('outline.collapse');
            }
        }),
        vscode.commands.registerCommand('gmxlang.unfoldAllSections', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && ['top', 'itp', 'gro', 'pdb', 'ndx', 'amber-prmtop'].includes(editor.document.languageId)) {
                // 展开编辑器中的所有区域
                vscode.commands.executeCommand('editor.unfoldAll');
                // 展开侧边栏大纲
                vscode.commands.executeCommand('outline.expand');
            }
        })
    );

    vscode.languages.registerDocumentFormattingEditProvider('mdp', {
        provideDocumentFormattingEdits: function(document) {
            var text = document.getText().split(/[\n\r]+/g);
            var result = [];
            var section = [];
            for (let i in text) {
                if (text[i].search(/=/g) !== -1) {
                    section = text[i].split(/=/g);
                    result[i] = section[0].padEnd(26, ' ').concat('= ').concat(section[1].trimStart());
                } else {
                    result[i] = text[i];
                }
            }
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const range = new vscode.Range(start, end);
            return [vscode.TextEdit.replace(range, result.join('\n'))];
        }
    });

    vscode.languages.registerDocumentFormattingEditProvider('gro', {
        provideDocumentFormattingEdits: function(document) {
            var text = document.getText().split(/[\n\r]+/g);
            var result = [];
            var section = [];
            var idx;
            for (var i in text) {
                if ((text[i].search(/^[\s]*[0-9]+[\s]*[a-zA-Z]+/g)) !== -1) {
                    section = text[i].split(/[\s]+/g);
                    for (var j in section) {
                        if (section[j] === '') {
                            section.shift();
                            if (section.length === 6 || section.length === 9) {
                                idx = section[0].search(/[a-zA-Z]+/g);
                                for (var m = section.length; m >= 2; m--) {
                                    section[m] = section[m - 1];
                                }
                                section[1] = section[0].slice(idx, );
                                section[0] = section[0].slice(0, idx);
                            }
                        }
                    }
                    if (section.length === 7) {
                        result[i] = section[0].padStart(5, ' ').concat(section[1].padEnd(5, ' ')).concat(section[2].padStart(5, ' ')).concat(section[3].padStart(5, ' ')).concat(parseFloat(section[4]).toFixed(3).padStart(8, ' ')).concat(parseFloat(section[5]).toFixed(3).padStart(8, ' ')).concat(parseFloat(section[6]).toFixed(3).padStart(8, ' '));
                    } else if (section.length === 10) {
                        result[i] = section[0].padStart(5, ' ').concat(section[1].padEnd(5, ' ')).concat(section[2].padStart(5, ' ')).concat(section[3].padStart(5, ' ')).concat(parseFloat(section[4]).toFixed(3).padStart(8, ' ')).concat(parseFloat(section[5]).toFixed(3).padStart(8, ' ')).concat(parseFloat(section[6]).toFixed(3).padStart(8, ' ')).concat(parseFloat(section[7]).toFixed(4).padStart(8, ' ')).concat(parseFloat(section[8]).toFixed(4).padStart(8, ' ')).concat(parseFloat(section[9]).toFixed(4).padStart(8, ' '));
                    } else {
                        break;
                    }
                } else {
                    result[i] = text[i];
                }
            }
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const range = new vscode.Range(start, end);
            return [vscode.TextEdit.replace(range, result.join('\n'))];
        }

    });

    // Helper function for smart comma splitting that respects quotes
    function smartSplitByComma(line) {
        let parameters = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            
            if ((char === '\'' || char === '"') && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
                current += char;
            } else if (char === ',' && !inQuotes) {
                parameters.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last parameter
        if (current.trim() !== '') {
            parameters.push(current);
        }
        
        return parameters;
    }

    // Amber input file formatting
    vscode.languages.registerDocumentFormattingEditProvider('amber-in', {
        provideDocumentFormattingEdits: function(document) {
            var text = document.getText().split(/[\n\r]+/g);
            var result = [];
            var resultIndex = 0;
            
            for (let i in text) {
                let line = text[i];
                
                // Skip formatting for section headers and endings
                if (line.trim().startsWith('&') || line.trim().startsWith('/') || line.trim() === '') {
                    result[resultIndex++] = line;
                    continue;
                }
                
                // Handle lines with multiple parameters (comma-separated)
                if (line.includes('=') && !line.trim().startsWith('&') && !line.trim().startsWith('/')) {
                    // Smart split by comma, considering quotes
                    let parameters = smartSplitByComma(line);
                    
                    for (let j = 0; j < parameters.length; j++) {
                        let param = parameters[j].trim();
                        if (param === '') continue; // Skip empty parts
                        
                        if (param.includes('=')) {
                            let [key, value] = param.split('=', 2);
                            key = key.trim();
                            value = value ? value.trim() : '';
                            let formattedParam = key.padEnd(20, ' ') + '= ' + value;
                            
                            // Add comma to all parameters except the last one
                            if (j < parameters.length - 1 || line.trim().endsWith(',')) {
                                formattedParam += ',';
                            }
                            
                            result[resultIndex++] = formattedParam;
                        } else {
                            // Handle cases where there might be a trailing comma without parameter
                            if (param.length > 0) {
                                result[resultIndex++] = param;
                            }
                        }
                    }
                } else {
                    result[resultIndex++] = line;
                }
            }
            
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const range = new vscode.Range(start, end);
            return [vscode.TextEdit.replace(range, result.join('\n'))];
        }
    });





    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    //let disposable = vscode.commands.registerCommand('gmxlang.helloWorld', function() {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    //    vscode.window.showInformationMessage('Thank you for using gmxhelper!');
    //});

    //context.subscriptions.push(disposable);

    const define = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('define=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('-DFLEXIBLE', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('-DPOSRES', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(define);

    const integrator = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('integrator=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('steep', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('cg', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('md', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('md-vv', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('md-vv-avek', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('sd', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('bd', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('l-bfgs', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('nm', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('tpi', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('tpic', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('mimic', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(integrator);

    const mts = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('mts=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(mts);

    const commmode = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('comm-mode=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('Linear', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Angular', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Linear-acceleration-correction', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('None', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(commmode);

    const cutoff = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('cutoff-scheme=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('Verlet', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('group', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(cutoff);

    const pbc = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pbc=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('xyz', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('xy', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pbc);

    const periodicmolecules = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('periodic-molecules=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(periodicmolecules);

    const coulombtype = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('coulombtype=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('Cut-off', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Ewald', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('PME', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('P3M-AD', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Reaction-Field', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('User', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('PME-Switch', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('PME-User', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('PME-User-Switch', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(coulombtype);

    const coulombmodifier = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('coulomb-modifier=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('Potential-shift', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('None', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(coulombmodifier);

    const vdwtype = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('vdwtype=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('Cut-off', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('PME', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Shift', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Switch', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('User', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(vdwtype);

    const vdwmodifier = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('vdw-modifier=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('Potential-shift', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('None', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Force-switch', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Potential-switch', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(vdwmodifier);

    const dispcorr = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('DispCorr=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('EnerPres', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Ener', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(dispcorr);

    const tcoupl = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('tcoupl=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('berendsen', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('nose-hoover', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('andersen', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('andersen-massive', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('v-rescale', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(tcoupl);

    const pcoupl = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pcoupl=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Berendsen', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('C-rescale', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('Parrinello-Rahman', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pcoupl);

    const pcoupltype = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pcoupltype=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('isotropic', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('semiisotropic', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('anisotropic', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('surface-tension', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pcoupltype);

    const refcoord = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('refcoord-scaling=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('all', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('com', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(refcoord);

    const annealing = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('annealing=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('single', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('periodic', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(annealing);

    const genvel = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('gen-vel=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(genvel);

    const constraints = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('constraints=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('none', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('h-bonds', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('all-bonds', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('h-angles', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('all-angles', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(constraints);


    const constraintsalgo = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('constraint-algorithm=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('LINCS', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('SHAKE', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(constraintsalgo);

    const walltype = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('wall-type=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('9-3', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('10-4', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('12-6', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(walltype);

    const pull = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pull);

    const pullprintcom = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-print-com=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullprintcom);

    const pullprintrefvalue = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-print-ref-value=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullprintrefvalue);

    const pullprintcomponents = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-print-components=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullprintcomponents);

    const pullpbc = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-pbc-ref-prev-step-com=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullpbc);

    const pullxout = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-xout-average=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullxout);

    const pullfout = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-fout-average=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullfout);

    const pullcoordl = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-coordl-type=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('umbrella', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('constraint', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('constant-force', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('flat-bottom', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('flat-bottom-high', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('external-potential', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullcoordl);

    const pullcoordlgeo = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-coordl-geometry=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('distance', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('direction', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('direction-periodic', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('direction-relative', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('cylinder', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('angle', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('angle-axis', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('dihedral', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullcoordlgeo);

    const pullcoordlstart = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('pull-coodl-start=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(pullcoordlstart);

    const awh = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awh=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awh);

    const awhpotential = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awh-potential=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('convolved', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('umbrella', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhpotential);

    const awhshare = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awh-share-multisim=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhshare);

    const awhlgrowth = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awhl-growth=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('exp-linear', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('linear', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhlgrowth);

    const awhlequil = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awhl-equilibrate-histogram=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhlequil);

    const awhltarget = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awhl-target=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('constant', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('cutoff', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('boltzmann', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('local-boltzmann', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhltarget);

    const awhluser = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awhl-user-cutoff=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhluser);

    const awhlshare = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awhl-share-group=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('0', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('positive', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhlshare);

    const awhldiml = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('awhl-diml-coord-provider=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('pull', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('fep-lambda', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(awhldiml);

    const rotation = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('rotation=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(rotation);

    const disre = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('disre=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('simple', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('ensemble', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(disre);

    const disreweight = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('disre-weighting=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('equal', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('conservative', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(disreweight);

    const disremixed = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('disre-mixed=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(disremixed);

    const orire = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('orire=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(orire);

    const freeenergy = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('free-energy=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(freeenergy);

    const couplelambda = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('couple-lambda0=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('vdw-q', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('vdw', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('q', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('none', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(couplelambda);

    const coupleintramol = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('couple-intramol=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(coupleintramol);

    const seperate = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('separate-dhdl-file=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(seperate);

    const lmcstats = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('lmc-stats=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('metropolis-transition', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('barker-transition', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('wang-landau', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('min-variance', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(lmcstats);

    const lmcmcmove = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('lmc-mv-move=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('metropolis-transition', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('barker-transition', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('gibbs', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('metropolized-gibbs', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(lmcmcmove);

    const lmcweight = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('lmc-weights-equil=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('no', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('yes', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('number-all-lambda', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('number-steps', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('number-samples', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('count-ratio', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(lmcweight);

    const simulatedtempering = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('simulated-tempering-scaling=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('linear', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('geometric', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('exponential', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(simulatedtempering);

    const densityguided = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('density-guided-simulation-similarity-measure=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('inner-product', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('relative-entropy', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('cross-correlation', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(densityguided);

    const densityguidedsim = vscode.languages.registerCompletionItemProvider(
        'mdp', {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                if (!linePrefix.endsWith('density-guided-simulation-atom-spreading-weight=')) {
                    return undefined;
                }
                return [
                    new vscode.CompletionItem('unity', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('mass', vscode.CompletionItemKind.Value),
                    new vscode.CompletionItem('charge', vscode.CompletionItemKind.Value),
                ];
            }
        },
        '=',
    );
    context.subscriptions.push(densityguidedsim);

    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('fasta', {
        provideFoldingRanges(document, context, token) {
            const text = document.getText().split(/[\n\r]+/g);
            // console.log(text[0])
            const RegExp = />.*/g;
            let match = [];
            let FoldingRange = [];
            for (let i in text) {
                while (RegExp.exec(text[i])) {
                    match.push(Number(i));
                }
            };
            match.push(text.length - 1);
            for (let m = 0; m < match.length - 1; m++) {
                if (m < match.length - 2) {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1] - 1, vscode.FoldingRangeKind.Comment));
                } else {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1], vscode.FoldingRangeKind.Comment));
                }
            }
            return FoldingRange;
        }
    }));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('itp', {
        provideFoldingRanges(document, context, token) {
            const text = document.getText().split(/[\n\r]+/g);
            const RegExp = /\s*\[.*\]/g;
            const LL = (document.getText().match(/\r\n?|\n/g) || []).length;
            for (let L = 0; L < LL; L++) {
                if (text[L] != document.lineAt(L).text) {
                    text.splice(L, 0, '\n');
                }
            }
            let match = [];
            let FoldingRange = [];

            for (let i in text) {
                while (RegExp.exec(text[i])) {
                    match.push(Number(i));
                }
            };
            match.push(text.length - 1);
            for (let m = 0; m < match.length - 1; m++) {
                if (m < match.length - 2) {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1] - 1, vscode.FoldingRangeKind.Comment));
                } else {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1], vscode.FoldingRangeKind.Comment));
                }
            }
            return FoldingRange;
        }
    }));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('top', {
        provideFoldingRanges(document, context, token) {
            const text = document.getText().split(/[\n\r]+/g);
            const RegExp = /\s*\[.*\]/g;
            const LL = (document.getText().match(/\r\n?|\n/g) || []).length;
            for (let L = 0; L < LL; L++) {
                if (text[L] != document.lineAt(L).text) {
                    text.splice(L, 0, '\n');
                }
            }
            let match = [];
            let FoldingRange = [];

            for (let i in text) {
                while (RegExp.exec(text[i])) {
                    match.push(Number(i));
                }
            };
            match.push(text.length - 1);
            for (let m = 0; m < match.length - 1; m++) {
                if (m < match.length - 2) {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1] - 1, vscode.FoldingRangeKind.Comment));
                } else {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1], vscode.FoldingRangeKind.Comment));
                }
            }
            return FoldingRange;
        }
    }));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('ndx', {
        provideFoldingRanges(document, context, token) {
            const text = document.getText().split(/[\n\r]+/g);
            const RegExp = /\s*\[.*\]/g;
            const LL = (document.getText().match(/\r\n?|\n/g) || []).length;
            for (let L = 0; L < LL; L++) {
                if (text[L] != document.lineAt(L).text) {
                    text.splice(L, 0, '\n');
                }
            }
            let match = [];
            let FoldingRange = [];

            for (let i in text) {
                while (RegExp.exec(text[i])) {
                    match.push(Number(i));
                }
            };
            match.push(text.length - 1);
            for (let m = 0; m < match.length - 1; m++) {
                if (m < match.length - 2) {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1] - 1, vscode.FoldingRangeKind.Comment));
                } else {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1], vscode.FoldingRangeKind.Comment));
                }
            }
            return FoldingRange;
        }
    }));
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider('mol2', {
        provideFoldingRanges(document, context, token) {
            const text = document.getText().split(/[\n\r]+/g);
            const RegExp = /@<TRIPOS>.*/g;
            const LL = (document.getText().match(/\r\n?|\n/g) || []).length;
            for (let L = 0; L < LL; L++) {
                if (text[L] != document.lineAt(L).text) {
                    text.splice(L, 0, '\n');
                }
            }
            let match = [];
            let FoldingRange = [];

            for (let i in text) {
                while (RegExp.exec(text[i])) {
                    match.push(Number(i));
                }
            };
            match.push(text.length - 1);
            for (let m = 0; m < match.length - 1; m++) {
                if (m < match.length - 2) {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1] - 1, vscode.FoldingRangeKind.Comment));
                } else {
                    FoldingRange.push(new vscode.FoldingRange(match[m], match[m + 1], vscode.FoldingRangeKind.Region));
                }
            }
            return FoldingRange;
        }
    }));

    // 注册XVG查看器命令
    const xvgViewerProvider = new XvgViewerProvider(context);
    const viewXvgCommand = vscode.commands.registerCommand('gmxlang.viewXvgFile', (uri) => {
        if (uri && uri.fsPath) {
            xvgViewerProvider.showXvgViewer(uri.fsPath);
        } else {
            // 如果没有传入URI，让用户选择文件
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'XVG files': ['xvg'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    xvgViewerProvider.showXvgViewer(fileUri[0].fsPath);
                }
            });
        }
    });

    context.subscriptions.push(viewXvgCommand);

    // 注册通用结构查看器实例
    const structureViewerProvider = new StructureViewerProvider(context);

    // 注册GRO查看器命令
    const viewGroCommand = vscode.commands.registerCommand('gmxlang.viewGroFile', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            // 如果没有传入URI，让用户选择文件
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'GRO files': ['gro'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });

    context.subscriptions.push(viewGroCommand);

    // 注册PDB查看器命令
    const viewPdbCommand = vscode.commands.registerCommand('gmxlang.viewPdbFile', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            // 如果没有传入URI，让用户选择文件
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'PDB files': ['pdb'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });

    context.subscriptions.push(viewPdbCommand);

    // 其他结构文件查看器命令

    // MOL2查看器命令
    const viewMol2Command = vscode.commands.registerCommand('gmxlang.viewMol2File', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'MOL2 files': ['mol2'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });
    context.subscriptions.push(viewMol2Command);

    // XYZ查看器命令
    const viewXyzCommand = vscode.commands.registerCommand('gmxlang.viewXyzFile', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'XYZ files': ['xyz'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });
    context.subscriptions.push(viewXyzCommand);

    // CIF查看器命令
    const viewCifCommand = vscode.commands.registerCommand('gmxlang.viewCifFile', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'CIF files': ['cif'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });
    context.subscriptions.push(viewCifCommand);

    // SDF查看器命令
    const viewSdfCommand = vscode.commands.registerCommand('gmxlang.viewSdfFile', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'SDF files': ['sdf'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });
    context.subscriptions.push(viewSdfCommand);

    // MOL查看器命令
    const viewMolCommand = vscode.commands.registerCommand('gmxlang.viewMolFile', (uri) => {
        if (uri && uri.fsPath) {
            structureViewerProvider.showStructureViewer(uri.fsPath);
        } else {
            vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'MOL files': ['mol'],
                    'All files': ['*']
                }
            }).then(fileUri => {
                if (fileUri && fileUri[0]) {
                    structureViewerProvider.showStructureViewer(fileUri[0].fsPath);
                }
            });
        }
    });
    context.subscriptions.push(viewMolCommand);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
