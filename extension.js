// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
let beforeTheme = vscode.workspace.getConfiguration().get("GmxLang.nonBioTheme");

function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "gmxlang" is now active!');
    let autoTheme = vscode.workspace.getConfiguration().get("GmxLang.autoSwitchTheme");
    let activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations();
    }
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            updateDecorations();
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            updateDecorations();
        }
    }, null, context.subscriptions);

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        let lang = activeEditor.document.languageId;
        if (autoTheme) {
            if (lang === "top" || lang === "pdb" || lang === "gro" ||
                lang === "itp" || lang === "mdp" || lang === "ndx" || lang === "xvg") {
                // update theme
                vscode.workspace.getConfiguration().update("workbench.colorTheme", "gmxLang", true);
            } else {
                vscode.workspace.getConfiguration().update("workbench.colorTheme", beforeTheme, true);
            }
        }
    }
    vscode.languages.registerDocumentFormattingEditProvider('mdp', {
        provideDocumentFormattingEdits: function(document) {
            var text = document.getText().split(/[\n\r]+/g);
            var result = [];
            var section = []
            for (let i in text) {
                if (text[i].search(/=/g) !== -1) {
                    section = text[i].split(/=/g)
                    result[i] = section[0].padEnd(26, " ").concat("= ").concat(section[1].trimStart())
                } else {
                    result[i] = text[i];
                }
            }
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const range = new vscode.Range(start, end);
            return [vscode.TextEdit.replace(range, result.join("\n"))];
        }
    });
    vscode.languages.registerDocumentFormattingEditProvider('gro', {
        provideDocumentFormattingEdits: function(document) {
            var text = document.getText().split(/[\n\r]+/g);
            var result = [];
            var section = [];
            for (var i in text) {
                if ((text[i].search(/^[\s]*[0-9]+[\s]*[a-zA-Z]+/g)) !== -1) {
                    section = text[i].split(/[\s]+/g)
                    for (var j in section) {
                        if (section[j] === "") {
                            section.shift()
                            if (section.length === 7 || section.length === 10) {
                                section[1] = section[0].concat(section[1])
                                section[0] = ""
                                section.shift()
                            }
                        }
                    }
                    if (section.length === 6) {
                        result[i] = section[0].padStart(10, " ").concat(section[1].padStart(5, " ")).concat(section[2].padStart(5, " ")).concat(parseFloat(section[3]).toFixed(3).padStart(8, " ")).concat(parseFloat(section[4]).toFixed(3).padStart(8, " ")).concat(parseFloat(section[5]).toFixed(3).padStart(8, " "))
                    } else if (section.length === 9) {
                        result[i] = section[0].padStart(10, " ").concat(section[1].padStart(5, " ")).concat(section[2].padStart(5, " ")).concat(parseFloat(section[3]).toFixed(3).padStart(8, " ")).concat(parseFloat(section[4]).toFixed(3).padStart(8, " ")).concat(parseFloat(section[5]).toFixed(3).padStart(8, " ")).concat(parseFloat(section[6]).toFixed(4).padStart(8, " ")).concat(parseFloat(section[7]).toFixed(4).padStart(8, " ")).concat(parseFloat(section[8]).toFixed(4).padStart(8, " "))
                    } else {
                        break
                    }
                } else {
                    result[i] = text[i]
                }
            }
            const start = new vscode.Position(0, 0);
            const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
            const range = new vscode.Range(start, end);
            return [vscode.TextEdit.replace(range, result.join("\n"))];
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
                    new vscode.CompletionItem('-DFEXIBLE', vscode.CompletionItemKind.Value),
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
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}