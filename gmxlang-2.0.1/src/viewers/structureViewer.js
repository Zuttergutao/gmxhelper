const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class StructureViewerProvider {
    constructor(context) {
        this.context = context;
    }

    showStructureViewer(filePath) {
        const fileExtension = path.extname(filePath).toLowerCase();
        const supportedFormats = ['.mol2', '.xyz', '.cif', '.sdf', '.mol', '.pdb', '.gro'];

        if (!supportedFormats.includes(fileExtension)) {
            vscode.window.showErrorMessage(`Unsupported file format: ${fileExtension}`);
            return;
        }

        // 根据文件类型设置不同的标题
        let title;
        if (fileExtension === '.gro') {
            title = `GRO 3D Viewer - ${path.basename(filePath)}`;
        } else if (fileExtension === '.pdb') {
            title = `PDB 3D Viewer - ${path.basename(filePath)}`;
        } else {
            title = `3D Structure Viewer - ${path.basename(filePath)}`;
        }

        const panel = vscode.window.createWebviewPanel(
            'structureViewer',
            title,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // 读取结构文件内容
        const structureContent = fs.readFileSync(filePath, 'utf-8');
        panel.webview.html = this.getWebviewContent(structureContent, path.basename(filePath), fileExtension);

        // 处理来自webview的消息
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                case 'openFile':
                    vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: {
                            'Structure files': ['mol2', 'xyz', 'cif', 'sdf', 'mol', 'pdb', 'gro'],
                            'PDB Files': ['pdb'],
                            'GRO Files': ['gro'],
                            'All files': ['*']
                        }
                    }).then(fileUri => {
                        if (fileUri && fileUri[0]) {
                            const newContent = fs.readFileSync(fileUri[0].fsPath, 'utf-8');
                            const newExtension = path.extname(fileUri[0].fsPath).toLowerCase();
                            panel.webview.postMessage({
                                command: 'loadStructure',
                                content: newContent,
                                filename: path.basename(fileUri[0].fsPath),
                                extension: newExtension
                            });
                        }
                    });
                    break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    getWebviewContent(structureContent, filename, fileExtension) {
        // 如果是GRO或XYZ文件，转换为PDB格式
        let processedContent = structureContent;
        let fileFormat = fileExtension.substring(1); // 移除点号

        if (fileExtension.toLowerCase() === '.gro') {
            processedContent = this.convertGroToPdb(structureContent);
            fileFormat = 'pdb';
        } else if (fileExtension.toLowerCase() === '.xyz') {
            processedContent = this.convertXyzToPdb(structureContent);
            fileFormat = 'pdb';
        }

        // 转义内容以便在JavaScript中使用
        const escapedContent = processedContent.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n');

        // 根据文件类型设置不同的背景和主题色
        let backgroundGradient, primaryColor, borderColor;
        if (fileExtension.toLowerCase() === '.gro') {
            backgroundGradient = 'linear-gradient(135deg, #2e1a2e 0%, #3e1650 50%, #601060 100%)';
            primaryColor = '#ba68c8';
            borderColor = 'rgba(186, 104, 200, 0.3)';
        } else if (fileExtension.toLowerCase() === '.pdb') {
            backgroundGradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
            primaryColor = '#64b5f6';
            borderColor = 'rgba(100, 181, 246, 0.3)';
        } else {
            backgroundGradient = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
            primaryColor = '#64b5f6';
            borderColor = 'rgba(100, 181, 246, 0.3)';
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Structure Viewer</title>
    <script src="https://unpkg.com/ngl@2.0.0-dev.37/dist/ngl.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: ${backgroundGradient};
            color: #ffffff;
            overflow: hidden;
            min-height: 100vh;
        }
        .container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            height: 100vh;
            position: relative;
        }
        .header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 8px 15px;
            border-bottom: 1px solid ${borderColor};
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            flex-wrap: nowrap;
            gap: 8px;
            min-height: 45px;
            position: relative;
            z-index: 1000;
        }
        .title {
            font-size: 18px;
            font-weight: 600;
            color: ${primaryColor};
            line-height: 1.2;
            flex-shrink: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .controls {
            display: flex;
            gap: 6px;
            align-items: center;
            flex-wrap: nowrap;
            flex-shrink: 0;
            min-width: fit-content;
            overflow-x: auto;
        }
        
        /* 确保在大屏幕时控制面板始终显示 */
        @media (min-width: 901px) {
            .controls {
                display: flex !important;
                flex-direction: row !important;
                flex-wrap: nowrap !important;
            }
            .menu-toggle {
                display: none !important;
            }
        }
        .control-group {
            display: flex;
            align-items: center;
            gap: 3px;
            flex-shrink: 0;
        }
        .control-group label {
            font-size: 12px;
            color: #e3f2fd;
        }
        select, button {
            padding: 3px 6px;
            background: rgba(255,255,255,0.15);
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            line-height: 1.2;
            white-space: nowrap;
        }
        button {
            background: linear-gradient(45deg, ${primaryColor === '#ba68c8' ? '#9c27b0, #ba68c8' : '#2196f3, #64b5f6'});
            border: none;
            font-weight: 600;
        }
        button:hover {
            background: linear-gradient(45deg, ${primaryColor === '#ba68c8' ? '#7b1fa2, #ab47bc' : '#1976d2, #42a5f5'});
            transform: translateY(-1px);
        }
        .viewer-container {
            flex: 1;
            position: relative;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 0;
            overflow: hidden;
        }
        #viewer {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
        .info-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 15px;
            max-width: 250px;
            font-size: 12px;
            z-index: 100;
        }
        .info-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .info-label {
            color: ${primaryColor};
            font-weight: 600;
        }
        .info-value {
            color: #81c784;
        }
        .style-buttons {
            display: flex;
            gap: 3px;
            flex-wrap: nowrap;
        }
        .style-btn {
            padding: 2px 5px;
            font-size: 10px;
            border-radius: 3px;
            line-height: 1.2;
            white-space: nowrap;
        }
        .style-btn.active {
            background: linear-gradient(45deg, #4caf50, #81c784);
        }
        .settings-panel {
            position: absolute;
            top: 50px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 15px;
            max-width: 300px;
            font-size: 12px;
            z-index: 101;
            display: none;
        }
        .setting-group {
            margin-bottom: 15px;
        }
        .setting-label {
            color: ${primaryColor === '#ba68c8' ? '#ce93d8' : '#e3f2fd'};
            font-weight: 600;
            margin-bottom: 5px;
            display: block;
        }
        .setting-input {
            width: 100%;
            padding: 5px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 3px;
            color: white;
            font-size: 11px;
        }
        .setting-value {
            color: #81c784;
            font-size: 10px;
            margin-left: 10px;
            min-width: 30px;
            display: inline-block;
        }
        .setting-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .setting-group input[type="range"] {
            flex: 1;
            margin-right: 10px;
        }
        .quick-actions {
            position: absolute;
            top: 10px;
            right: 270px;
            display: flex;
            gap: 10px;
            z-index: 100;
        }
        .quick-btn {
            background: rgba(${primaryColor === '#ba68c8' ? '156, 39, 176' : '33, 150, 243'}, 0.9);
            color: white;
            border: none;
            border-radius: 5px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
        }
        .quick-btn:hover {
            background: rgba(${primaryColor === '#ba68c8' ? '123, 31, 162' : '25, 118, 210'}, 1);
        }
        .box-info {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            border-radius: 10px;
            padding: 15px;
            font-size: 12px;
            z-index: 100;
            display: none;
        }
        
        /* 响应式设计 */
        @media (max-width: 1200px) {
              .header {
                  padding: 6px 12px;
                  min-height: 40px;
                  flex-wrap: nowrap;
              }
              .title {
                  font-size: 16px;
                  flex-shrink: 1;
                  min-width: 0;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }
              .controls {
                  flex-shrink: 0;
                  gap: 4px;
                  flex-wrap: nowrap;
              }
              .control-group {
                  gap: 2px;
              }
              .style-buttons {
                  gap: 2px;
              }
          }
        
        @media (max-width: 900px) {
             .control-group {
                 flex-direction: row;
                 align-items: center;
                 gap: 2px;
                 flex-wrap: nowrap;
             }
             .control-group label {
                 font-size: 10px;
                 flex-shrink: 0;
             }
             select, button {
                 padding: 2px 4px;
                 font-size: 10px;
             }
             .style-btn {
                 padding: 2px 4px;
                 font-size: 9px;
             }
         }
        
        @media (max-width: 600px) {
              .header {
                  padding: 5px 8px;
                  min-height: 35px;
              }
              .title {
                  font-size: 15px;
              }
              .controls {
                  gap: 3px;
                  padding: 6px;
                  flex-wrap: wrap;
                  justify-content: center;
              }
              .control-group {
                  margin-bottom: 0;
                  gap: 1px;
              }
              .control-group label {
                  font-size: 9px;
              }
              select, button {
                  padding: 2px 4px;
                  font-size: 9px;
              }
              .style-buttons {
                  gap: 1px;
              }
              .style-btn {
                  padding: 1px 3px;
                  font-size: 8px;
              }
              .info-panel {
                  top: 5px;
                  right: 5px;
                  max-width: 200px;
                  padding: 8px;
                  font-size: 10px;
              }
              .settings-panel {
                  top: 5px;
                  right: 5px;
                  max-width: 250px;
                  padding: 8px;
                  font-size: 10px;
              }
              .box-info {
                  bottom: 5px;
                  left: 5px;
                  padding: 6px;
                  font-size: 9px;
              }
          }
         
         @media (max-width: 400px) {
              .info-panel, .settings-panel {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  max-width: 90vw;
                  max-height: 80vh;
                  overflow-y: auto;
              }
          }
          
          /* 汉堡菜单样式 */
          .menu-toggle {
              display: none;
              background: none;
              border: none;
              color: ${primaryColor};
              font-size: 18px;
              cursor: pointer;
              padding: 5px;
          }
          
          @media (max-width: 900px) {
               .menu-toggle {
                   display: block;
                   z-index: 1002;
                   position: relative;
                   flex-shrink: 0;
               }
               .controls {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.95);
                    backdrop-filter: blur(10px);
                    padding: 8px;
                    border-top: 1px solid ${borderColor};
                    z-index: 1001;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 4px;
                    justify-content: center;
                }
               .controls.show {
                   display: flex !important;
               }
               .header {
                   position: relative;
                   z-index: 1000;
               }
           }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">3D Structure Viewer - ${filename}</div>
            <button class="menu-toggle" onclick="toggleMenu()">☰</button>
            <div class="controls" id="controls">
                <div class="control-group">
                    <label>Style:</label>
                    <div class="style-buttons">
                        <button class="style-btn" onclick="setStyle('cartoon', this)">Cartoon</button>
                        <button class="style-btn" onclick="setStyle('stick', this)">Stick</button>
                        <button class="style-btn" onclick="setStyle('sphere', this)">Sphere</button>
                        <button class="style-btn active" onclick="setStyle('line', this)">Line</button>
                    </div>
                </div>
                <div class="control-group">
                    <label>Color:</label>
                    <select id="colorScheme" onchange="updateColorScheme()">
                            '<option value="atom">By Atom</option><option value="residue">By Residue</option><option value="chain">By Chain</option><option value="spectrum">Spectrum</option>'
                    </select>
                </div>
                <button onclick="resetView()">Reset View</button>
                ${fileExtension.toLowerCase() === '.gro' ? '<button onclick="toggleBox()">Toggle Box</button>' : ''}
                <button onclick="toggleSettings()">Settings</button>
                <button onclick="toggleSelection()">Selection</button>
                <button onclick="openFile()">Open File</button>
            </div>
        </div>
        
        <div class="viewer-container">
            ${fileExtension.toLowerCase() === '.gro' ? '<div class="loading" id="loading">Loading 3D structure...</div>' : ''}
            <div id="viewer"></div>
            
            <div class="settings-panel" id="settingsPanel">
                <div class="setting-group">
                    <label class="setting-label">Stick Radius</label>
                    <input type="range" id="stickRadius" min="0.1" max="1.5" step="0.05" value="${fileExtension.toLowerCase() === '.gro' ? '1' : '1'}" class="setting-input">
                    <span class="setting-value" id="stickRadiusValue">${fileExtension.toLowerCase() === '.gro' ? '1' : '1'}</span>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Ball Scale (Aspect Ratio)</label>
                    <input type="range" id="ballScale" min="1.0" max="10.0" step="0.5" value="3.0" class="setting-input">
                    <span class="setting-value" id="ballScaleValue">2.0</span>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Sphere Radius</label>
                    <input type="range" id="sphereRadius" min="0.1" max="2.0" step="0.1" value="${fileExtension.toLowerCase() === '.gro' ? '0.8' : '1.0'}" class="setting-input">
                    <span class="setting-value" id="sphereRadiusValue">${fileExtension.toLowerCase() === '.gro' ? '0.8' : '1.0'}</span>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Cartoon Thickness</label>
                    <input type="range" id="cartoonThickness" min="0.1" max="1.0" step="0.05" value="${fileExtension.toLowerCase() === '.gro' ? '0.3' : '0.4'}" class="setting-input">
                    <span class="setting-value" id="cartoonThicknessValue">${fileExtension.toLowerCase() === '.gro' ? '0.3' : '0.4'}</span>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Line Width</label>
                    <input type="range" id="lineWidth" min="1" max="3" step="0.5" value="2" class="setting-input">
                    <span class="setting-value" id="lineWidthValue">2</span>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Opacity</label>
                    <input type="range" id="opacity" min="0.1" max="1.0" step="0.1" value="1.0" class="setting-input">
                    <span class="setting-value" id="opacityValue">1.0</span>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Background Color</label>
                    <input type="color" id="backgroundColor" value="#000000" class="setting-input">
                </div>
            </div>
            
            <div class="settings-panel" id="selectionPanel" style="top: 50px; right: 320px; display: none;">
                <div class="setting-group">
                    <label class="setting-label">Selection Type</label>
                    <select id="selectionType" class="setting-input">
                        <option value="all">Show All</option>
                        <option value="residue">By Residue</option>
                        <option value="atom">By Atom</option>
                        <option value="chain">By Chain</option>
                        <option value="element">By Element</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Selection Query</label>
                    <input type="text" id="selectionQuery" placeholder="e.g., :A or resname LIG or element C" class="setting-input">
                    <small style="color: #aaa; font-size: 10px;">Examples:<br/>:A (chain A)<br/>resname LIG<br/>element C<br/>resno 1-10</small>
                </div>
                <div class="setting-group">
                    <label class="setting-label">Quick Selections</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                        <button class="style-btn" onclick="applyQuickSelection('protein')">Protein</button>
                        <button class="style-btn" onclick="applyQuickSelection('water')">Water</button>
                        <button class="style-btn" onclick="applyQuickSelection('ion')">Ions</button>
                        <button class="style-btn" onclick="applyQuickSelection('ligand')">Ligand</button>
                    </div>
                </div>
                <div class="setting-group">
                    <button onclick="applySelection()" style="width: 100%; background: linear-gradient(45deg, #4caf50, #81c784); color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">Apply Selection</button>
                    <button onclick="clearSelection()" style="width: 100%; background: linear-gradient(45deg, #f44336, #ef5350); color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; margin-top: 5px;">Clear Selection</button>
                </div>
            </div>
            
            <div class="info-panel" id="infoPanel">
                <div class="info-item">
                    <span class="info-label">Format:</span>
                    <span class="info-value" id="fileFormat">${fileExtension.substring(1).toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Atoms:</span>
                    <span class="info-value" id="atomCount">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Residues:</span>
                    <span class="info-value" id="residueCount">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">${fileExtension.toLowerCase() === '.gro' ? 'Molecules:' : 'Chains:'}</span>
                    <span class="info-value" id="chainCount">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Style:</span>
                    <span class="info-value" id="currentStyle">'Line'</span>
                </div>
            </div>
            
            <div class="box-info" id="boxInfo">
                <div class="info-item">
                    <span class="info-label">Box X:</span>
                    <span class="info-value" id="boxX">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Box Y:</span>
                    <span class="info-value" id="boxY">-</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Box Z:</span>
                    <span class="info-value" id="boxZ">-</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        let stage;
        let currentStyleType = 'line';
        let component;
        let boxVisible = false;
        let boxDimensions = null;
        let styleParams = {
            stickRadius: ${fileExtension.toLowerCase() === '.gro' ? '0.2' : '0.3'},
            sphereRadius: ${fileExtension.toLowerCase() === '.gro' ? '0.8' : '1.0'},
            cartoonThickness: ${fileExtension.toLowerCase() === '.gro' ? '0.3' : '0.4'},
            lineWidth: 2,
            ballScale: 2.0,
            opacity: 1.0
        };
        let currentSelection = 'all';
        let selectionQuery = '';
        
        async function initViewer() {
            try {
                const element = document.getElementById('viewer');
                stage = new NGL.Stage(element, {
                    backgroundColor: 'black',
                    quality: 'high'
                });
                
                const structureData = '${escapedContent}';
                const blob = new Blob([structureData], { type: 'text/plain' });
                
                stage.loadFile(blob, { ext: '${fileFormat}' }).then(function (comp) {
                    component = comp;
                    ${fileExtension.toLowerCase() === '.gro' ? 'document.getElementById(\'loading\').style.display = \'none\';' : ''}
                    setStyle('line');
                    
                    // 延迟执行autoView以确保组件完全加载
                    setTimeout(() => {
                        stage.autoView();
                    }, 100);
                    
                    updateStats();
                    setupInteractions();
                    
                    // 如果是GRO文件，尝试解析盒子信息
                    if ('${fileExtension}'.toLowerCase() === '.gro') {
                        parseBoxDimensions('${structureContent.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n')}');
                    }
                    
                    // 添加事件监听器
                    setupStyleListeners();
                });
                
            } catch (error) {
                console.error('Failed to initialize NGL viewer:', error);
                ${fileExtension.toLowerCase() === '.gro' ? 'document.getElementById(\'loading\').textContent = \'Failed to load 3D structure\';' : ''}
            }
        }
        
        function setStyle(styleType, element) {
            if (!component) return;
            
            document.querySelectorAll('.style-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (element) {
                element.classList.add('active');
            } else {
                // Fallback for initial call
                const buttonToActivate = Array.from(document.querySelectorAll('.style-btn')).find(btn => btn.textContent.toLowerCase().includes(styleType.toLowerCase()));
                if (buttonToActivate) {
                    buttonToActivate.classList.add('active');
                }
            }
            
            currentStyleType = styleType;
            document.getElementById('currentStyle').textContent = 
                styleType.charAt(0).toUpperCase() + styleType.slice(1);
            
            try {
                // 清除现有的表示
                component.removeAllRepresentations();
                
                const colorScheme = getColorScheme();
                const selection = selectionQuery || 'all';
                
                switch(styleType) {
                    case 'cartoon':
                        component.addRepresentation('cartoon', {
                            color: colorScheme,
                            radiusScale: styleParams.cartoonThickness,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                    case 'stick':
                        component.addRepresentation('ball+stick', {
                            color: colorScheme,
                            radiusScale: styleParams.stickRadius,
                            aspectRatio: styleParams.ballScale,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                    case 'sphere':
                        component.addRepresentation('spacefill', {
                            color: colorScheme,
                            radiusScale: styleParams.sphereRadius,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                    case 'line':
                        component.addRepresentation('line', {
                            color: colorScheme,
                            linewidth: styleParams.lineWidth,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                }
                
            } catch (error) {
                console.error('Failed to set style:', error);
            }
        }
        
        function getColorScheme() {
            const colorScheme = document.getElementById('colorScheme').value;
            switch(colorScheme) {
                case 'spectrum': return 'residueindex';
                case 'chain': return 'chainname';
                case 'residue': return 'resname';
                case 'atom': return 'element';
                case 'secondary': return 'sstruc';
                default: return 'element';
            }
        }
        
        function updateColorScheme() {
            if (!component) return;
            // 重新应用当前样式以更新颜色方案
            setStyle(currentStyleType);
        }
        
        function resetView() {
            if (!stage) return;
            try {
                stage.autoView();
            } catch (error) {
                console.error('Failed to reset view:', error);
            }
        }
        
        function toggleBox() {
            // GRO文件的盒子显示功能
            console.log('Box toggle functionality for GRO files');
            // 这里可以添加具体的盒子显示逻辑
        }
        
        
        function toggleSettings() {
            const panel = document.getElementById('settingsPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                // 关闭选择面板
                const selectionPanel = document.getElementById('selectionPanel');
                if (selectionPanel) {
                    selectionPanel.style.display = 'none';
                }
            }
        }
        
        function toggleSelection() {
            const panel = document.getElementById('selectionPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                // 关闭设置面板
                const settingsPanel = document.getElementById('settingsPanel');
                if (settingsPanel) {
                    settingsPanel.style.display = 'none';
                }
            }
        }
        
        function toggleMenu() {
            const controls = document.getElementById('controls');
            if (controls) {
                controls.classList.toggle('show');
            }
        }
        
        // 点击外部区域关闭菜单
        document.addEventListener('click', function(event) {
            const controls = document.getElementById('controls');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (controls && menuToggle && 
                !controls.contains(event.target) && 
                !menuToggle.contains(event.target) &&
                controls.classList.contains('show')) {
                controls.classList.remove('show');
            }
        });
        
        // 窗口大小改变时重置菜单状态和重绘3D视图
        window.addEventListener('resize', function() {
            const controls = document.getElementById('controls');
            if (controls && window.innerWidth > 900) {
                controls.classList.remove('show');
            }
            // 延迟重绘以确保布局完成
            setTimeout(function() {
                if (stage) {
                    stage.handleResize();
                }
            }, 100);
        });
        
        function applyQuickSelection(type) {
            let query = '';
            switch(type) {
                case 'protein':
                    query = 'protein';
                    break;
                case 'water':
                    query = 'water';
                    break;
                case 'ion':
                    query = 'ion';
                    break;
                case 'ligand':
                    query = 'hetero and not water and not ion';
                    break;
            }
            document.getElementById('selectionQuery').value = query;
            applySelection();
        }
        
        function applySelection() {
            if (!component) return;
            
            const query = document.getElementById('selectionQuery').value.trim();
            currentSelection = query || 'all';
            selectionQuery = query;
            
            try {
                // 清除现有表示
                component.removeAllRepresentations();
                
                const colorScheme = getColorScheme();
                let selection = query || 'all';
                
                // 应用当前样式到选择的原子
                switch(currentStyleType) {
                    case 'cartoon':
                        component.addRepresentation('cartoon', {
                            color: colorScheme,
                            radiusScale: styleParams.cartoonThickness,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                    case 'stick':
                         component.addRepresentation('ball+stick', {
                             color: colorScheme,
                             radiusScale: styleParams.stickRadius,
                             aspectRatio: styleParams.ballScale,
                             opacity: styleParams.opacity,
                             sele: selection
                         });
                        break;
                    case 'sphere':
                        component.addRepresentation('spacefill', {
                            color: colorScheme,
                            radiusScale: styleParams.sphereRadius,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                    case 'line':
                        component.addRepresentation('line', {
                            color: colorScheme,
                            linewidth: styleParams.lineWidth,
                            opacity: styleParams.opacity,
                            sele: selection
                        });
                        break;
                }
                
                console.log('Applied selection:', selection);
            } catch (error) {
                console.error('Failed to apply selection:', error);
                alert('Invalid selection query. Please check the syntax.');
            }
        }
        
        function clearSelection() {
            document.getElementById('selectionQuery').value = '';
            currentSelection = 'all';
            selectionQuery = '';
            setStyle(currentStyleType, document.querySelector('.style-btn.active'));
        }
        
        function updateStyleParams() {
            const stickRadius = parseFloat(document.getElementById('stickRadius').value);
            const sphereRadius = parseFloat(document.getElementById('sphereRadius').value);
            const cartoonThickness = parseFloat(document.getElementById('cartoonThickness').value);
            const lineWidth = parseFloat(document.getElementById('lineWidth').value);
            const ballScale = parseFloat(document.getElementById('ballScale').value);
            const opacity = parseFloat(document.getElementById('opacity').value);
            const backgroundColor = document.getElementById('backgroundColor').value;

            styleParams.stickRadius = stickRadius;
            styleParams.sphereRadius = sphereRadius;
            styleParams.cartoonThickness = cartoonThickness;
            styleParams.lineWidth = lineWidth;
            styleParams.ballScale = ballScale;
            styleParams.opacity = opacity;

            // 更新显示值
            document.getElementById('stickRadiusValue').textContent = stickRadius;
            document.getElementById('sphereRadiusValue').textContent = sphereRadius;
            document.getElementById('cartoonThicknessValue').textContent = cartoonThickness;
            document.getElementById('lineWidthValue').textContent = lineWidth;
            document.getElementById('ballScaleValue').textContent = ballScale;
            document.getElementById('opacityValue').textContent = opacity;

            if (stage) {
                stage.setParameters({ backgroundColor: backgroundColor });
            }
            
            setStyle(currentStyleType, document.querySelector('.style-btn.active'));
        }
        
        function setupStyleListeners() {
            document.getElementById('stickRadius').addEventListener('input', updateStyleParams);
            document.getElementById('sphereRadius').addEventListener('input', updateStyleParams);
            document.getElementById('cartoonThickness').addEventListener('input', updateStyleParams);
            document.getElementById('lineWidth').addEventListener('input', updateStyleParams);
            document.getElementById('ballScale').addEventListener('input', updateStyleParams);
            document.getElementById('opacity').addEventListener('input', updateStyleParams);
            document.getElementById('backgroundColor').addEventListener('change', updateStyleParams);
        }
        
        function openFile() {
            const vscode = acquireVsCodeApi();
            vscode.postMessage({ command: 'openFile' });
        }
        
        function updateStats() {
            if (!component) {
                document.getElementById('atomCount').textContent = 'Loading...';
                document.getElementById('residueCount').textContent = 'Loading...';
                document.getElementById('chainCount').textContent = 'Loading...';
                return;
            }
            
            try {
                const structure = component.structure;
                const atomCount = structure.atomCount;
                const residueCount = structure.residueStore.count;
                const chainCount = structure.chainStore.count;
                
                document.getElementById('atomCount').textContent = atomCount;
                document.getElementById('residueCount').textContent = residueCount;
                document.getElementById('chainCount').textContent = chainCount;
            } catch (error) {
                console.error('Failed to get stats:', error);
                document.getElementById('atomCount').textContent = 'N/A';
                document.getElementById('residueCount').textContent = 'N/A';
                document.getElementById('chainCount').textContent = 'N/A';
            }
        }
        
        function setupInteractions() {
            if (!stage) return;
            
            try {
                // NGL viewer的交互设置
                stage.signals.clicked.add(function(pickingProxy) {
                    if (pickingProxy && pickingProxy.atom) {
                        const atom = pickingProxy.atom;
                        const info = 'Atom: ' + (atom.atomname || 'N/A') + '\\nResidue: ' + (atom.resname || 'N/A') + ' ' + (atom.resno || 'N/A') + '\\nChain: ' + (atom.chainname || 'N/A');
                        alert(info);
                    }
                });
                
                stage.signals.hovered.add(function(pickingProxy) {
                    if (pickingProxy && pickingProxy.atom) {
                        const atom = pickingProxy.atom;
                        const tooltip = (atom.resname || '') + ' ' + (atom.resno || '');
                        console.log('Hovered:', tooltip);
                    }
                });
            } catch (error) {
                console.error('Failed to setup interactions:', error);
            }
        }
        
        function parseBoxDimensions(groContent) {
            const lines = groContent.split('\\n');
            if (lines.length >= 3) {
                const lastLine = lines[lines.length - 1].trim();
                if (lastLine && lastLine.split(/\\s+/).length >= 3) {
                    const parts = lastLine.split(/\\s+/);
                    const boxX = parseFloat(parts[0]);
                    const boxY = parseFloat(parts[1]);
                    const boxZ = parseFloat(parts[2]);
                    
                    if (!isNaN(boxX) && !isNaN(boxY) && !isNaN(boxZ)) {
                        document.getElementById('boxX').textContent = boxX.toFixed(3) + ' nm';
                        document.getElementById('boxY').textContent = boxY.toFixed(3) + ' nm';
                        document.getElementById('boxZ').textContent = boxZ.toFixed(3) + ' nm';
                        document.getElementById('boxInfo').style.display = 'block';
                    }
                }
            }
        }
        
        // 监听来自扩展的消息
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadStructure':
                    loadStructureFromContent(message.content, message.filename, message.extension);
                    break;
            }
        });
        
        function loadStructureFromContent(content, filename, extension) {
            if (stage) {
                stage.removeAllComponents();
                
                let processedContent = content;
                let fileFormat = extension.substring(1);
                
                if (extension.toLowerCase() === '.gro') {
                    processedContent = convertGroToPdb(content);
                    fileFormat = 'pdb';
                } else if (extension.toLowerCase() === '.xyz') {
                    processedContent = convertXyzToPdb(content);
                    fileFormat = 'pdb';
                }
                
                const blob = new Blob([processedContent], { type: 'text/plain' });
                
                stage.loadFile(blob, { ext: fileFormat }).then(function (comp) {
                    component = comp;
                    setStyle(currentStyleType);
                    setTimeout(() => {
                        stage.autoView();
                        updateStats();
                        setupInteractions();
                        setupStyleListeners();
                        
                        if (extension.toLowerCase() === '.gro') {
                            parseBoxDimensions(content);
                        }
                    }, 100);
                }).catch(function(error) {
                    console.error('Error loading structure:', error);
                    alert('Error loading structure file. Please check the file format.');
                });
                
                document.getElementById('fileFormat').textContent = extension.substring(1).toUpperCase();
            }
        }
        
        function convertXyzToPdb(xyzContent) {
            const lines = xyzContent.split('\\n').filter(line => line.trim());
            if (lines.length < 2) return '';

            const atomCount = parseInt(lines[0].trim());
            const title = lines[1].trim() || 'XYZ Structure';

            let pdbContent = 'HEADER    ' + title + '\\n';
            let atomIndex = 1;

            for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const parts = line.split(/\\s+/);
                if (parts.length < 4) continue;

                const element = parts[0];
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);

                if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

                // 格式化PDB ATOM记录
                const atomName = element.padEnd(4);
                const resName = 'UNL'; // Unknown ligand
                const chainId = 'A';
                const resSeq = '1'.padStart(4);
                const xStr = x.toFixed(3).padStart(8);
                const yStr = y.toFixed(3).padStart(8);
                const zStr = z.toFixed(3).padStart(8);
                const occupancy = '1.00';
                const tempFactor = '0.00';
                const elementSymbol = element.padEnd(2);

                pdbContent += \`ATOM  \${atomIndex.toString().padStart(5)} \${atomName} \${resName} \${chainId}\${resSeq}    \${xStr}\${yStr}\${zStr}  \${occupancy}  \${tempFactor}          \${elementSymbol}\\n\`;
                atomIndex++;
            }

            pdbContent += 'END\\n';
            return pdbContent;
        }
        
        function convertGroToPdb(groContent) {
            const lines = groContent.split('\\n');
            if (lines.length < 3) return '';

            const title = lines[0].trim();
            const atomCount = parseInt(lines[1].trim());

            let pdbContent = 'HEADER    ' + title + '\\n';
            let atomIndex = 1;

            for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
                const line = lines[i];
                if (line.length < 20) continue;

                try {
                    const resNum = parseInt(line.substring(0, 5).trim());
                    const resName = line.substring(5, 10).trim();
                    const atomName = line.substring(10, 15).trim();
                    const atomNum = parseInt(line.substring(15, 20).trim());
                    const x = parseFloat(line.substring(20, 28).trim()) * 10;
                    const y = parseFloat(line.substring(28, 36).trim()) * 10;
                    const z = parseFloat(line.substring(36, 44).trim()) * 10;

                    const pdbLine = 'ATOM  ' + atomIndex.toString().padStart(5) + ' ' + atomName.padEnd(4) + ' ' + resName.padEnd(3) + ' A' + resNum.toString().padStart(4) + '    ' + x.toFixed(3).padStart(8) + y.toFixed(3).padStart(8) + z.toFixed(3).padStart(8) + '  1.00  0.00           ' + getElementFromAtomName(atomName).padStart(2);
                    pdbContent += pdbLine + '\\n';
                    atomIndex++;
                } catch (error) {
                    continue;
                }
            }

            pdbContent += 'END\\n';
            return pdbContent;
        }
        
        function getElementFromAtomName(atomName) {
            const name = atomName.trim().toUpperCase();
            if (name.startsWith('C')) return 'C';
            if (name.startsWith('N')) return 'N';
            if (name.startsWith('O')) return 'O';
            if (name.startsWith('H')) return 'H';
            if (name.startsWith('S')) return 'S';
            if (name.startsWith('P')) return 'P';
            if (name.startsWith('F')) return 'F';
            if (name.startsWith('CL')) return 'Cl';
            if (name.startsWith('BR')) return 'Br';
            if (name.startsWith('I')) return 'I';
            return name.charAt(0);
        }
        
        // 已在上面合并处理
        
        window.addEventListener('load', function() {
            if (typeof NGL !== 'undefined') {
                initViewer();
            } else {
                setTimeout(initViewer, 1000);
            }
        });
    </script>
</body>
</html>`;
    }

    // GRO到PDB转换方法
    convertGroToPdb(groContent) {
        const lines = groContent.split('\n');
        if (lines.length < 3) return '';

        const title = lines[0].trim();
        const atomCount = parseInt(lines[1].trim());

        let pdbContent = 'HEADER    ' + title + '\n';
        let atomIndex = 1;

        for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
            const line = lines[i];
            if (line.length < 20) continue;

            try {
                // GRO格式解析
                const resNum = parseInt(line.substring(0, 5).trim());
                const resName = line.substring(5, 10).trim();
                const atomName = line.substring(10, 15).trim();
                const atomNum = parseInt(line.substring(15, 20).trim());
                const x = parseFloat(line.substring(20, 28).trim()) * 10; // nm to Å
                const y = parseFloat(line.substring(28, 36).trim()) * 10;
                const z = parseFloat(line.substring(36, 44).trim()) * 10;

                // 转换为PDB格式
                const pdbLine = 'ATOM  ' + atomIndex.toString().padStart(5) + ' ' + atomName.padEnd(4) + ' ' + resName.padEnd(3) + ' A' + resNum.toString().padStart(4) + '    ' + x.toFixed(3).padStart(8) + y.toFixed(3).padStart(8) + z.toFixed(3).padStart(8) + '  1.00  0.00           ' + this.getElementFromAtomName(atomName).padStart(2);
                pdbContent += pdbLine + '\n';
                atomIndex++;
            } catch (error) {
                // 跳过解析失败的行
                continue;
            }
        }

        pdbContent += 'END\n';
        return pdbContent;
    }

    // XYZ到PDB转换方法
    convertXyzToPdb(xyzContent) {
        const lines = xyzContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) return '';

        const atomCount = parseInt(lines[0].trim());
        const title = lines[1].trim() || 'XYZ Structure';

        let pdbContent = 'HEADER    ' + title + '\n';
        let atomIndex = 1;

        for (let i = 2; i < 2 + atomCount && i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(/\s+/);
            if (parts.length < 4) continue;

            const element = parts[0];
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);

            if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

            // 格式化PDB ATOM记录
            const atomName = element.padEnd(4);
            const resName = 'UNL'; // Unknown ligand
            const chainId = 'A';
            const resSeq = '1'.padStart(4);
            const xStr = x.toFixed(3).padStart(8);
            const yStr = y.toFixed(3).padStart(8);
            const zStr = z.toFixed(3).padStart(8);
            const occupancy = '1.00';
            const tempFactor = '0.00';
            const elementSymbol = element.padEnd(2);

            pdbContent += `ATOM  ${atomIndex.toString().padStart(5)} ${atomName} ${resName} ${chainId}${resSeq}    ${xStr}${yStr}${zStr}  ${occupancy}  ${tempFactor}          ${elementSymbol}\n`;
            atomIndex++;
        }

        pdbContent += 'END\n';
        return pdbContent;
    }

    // 从原子名称推断元素
    getElementFromAtomName(atomName) {
        const name = atomName.trim().toUpperCase();
        if (name.startsWith('C')) return 'C';
        if (name.startsWith('N')) return 'N';
        if (name.startsWith('O')) return 'O';
        if (name.startsWith('H')) return 'H';
        if (name.startsWith('S')) return 'S';
        if (name.startsWith('P')) return 'P';
        if (name.startsWith('F')) return 'F';
        if (name.startsWith('CL')) return 'Cl';
        if (name.startsWith('BR')) return 'Br';
        if (name.startsWith('I')) return 'I';
        return name.charAt(0);
    }
}

module.exports = StructureViewerProvider;
