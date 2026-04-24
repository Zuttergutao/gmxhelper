const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class XvgViewerProvider {
    constructor(context) {
        this.context = context;
    }

    /**
     * 解析XVG文件内容
     * @param {string} filePath XVG文件路径
     * @returns {Object} 解析后的数据
     */
    parseXvgFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');

            const metadata = {
                title: '',
                xlabel: '',
                ylabel: '',
                legends: []
            };

            const data = [];

            for (const line of lines) {
                const trimmedLine = line.trim();

                // 解析元数据
                if (trimmedLine.startsWith('@')) {
                    if (trimmedLine.includes('title')) {
                        metadata.title = this.extractQuotedValue(trimmedLine);
                    } else if (trimmedLine.includes('xaxis label')) {
                        metadata.xlabel = this.extractQuotedValue(trimmedLine);
                    } else if (trimmedLine.includes('yaxis label')) {
                        metadata.ylabel = this.extractQuotedValue(trimmedLine);
                    } else if (trimmedLine.includes('legend')) {
                        metadata.legends.push(this.extractQuotedValue(trimmedLine));
                    }
                }
                // 跳过注释行
                else if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue;
                }
                // 解析数据行
                else {
                    const values = trimmedLine.split(/\s+/).map(v => parseFloat(v));
                    if (values.length >= 2 && !values.some(isNaN)) {
                        data.push(values);
                    }
                }
            }

            return { metadata, data };
        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing XVG file: ${error.message}`);
            return null;
        }
    }

    /**
     * 从XVG元数据行中提取引号内的值
     * @param {string} line 元数据行
     * @returns {string} 提取的值
     */
    extractQuotedValue(line) {
        const match = line.match(/"([^"]*)"/);
        return match ? match[1] : '';
    }

    /**
     * 创建并显示XVG查看器面板
     * @param {string} filePath XVG文件路径
     */
    showXvgViewer(filePath) {
        const parsedData = this.parseXvgFile(filePath);
        if (!parsedData) {
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'xvgViewer',
            `XVG Viewer - ${path.basename(filePath)}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getWebviewContent(parsedData, path.basename(filePath));

        // 处理来自webview的消息
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                case 'exportData':
                    this.exportData(parsedData, message.format);
                    break;
                case 'showInfo':
                    vscode.window.showInformationMessage(
                        `XVG文件包含 ${parsedData.data.length} 个数据点，${parsedData.data[0]?.length || 0} 列数据`
                    );
                    break;
                case 'openFile':
                    vscode.window.showOpenDialog({
                        canSelectMany: false,
                        openLabel: 'Open XVG File',
                        filters: {
                            'XVG Files': ['xvg'],
                            'All Files': ['*']
                        }
                    }).then(fileUri => {
                        if (fileUri && fileUri[0]) {
                            this.showXvgViewer(fileUri[0].fsPath);
                        }
                    });
                    break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    /**
     * 导出数据
     * @param {Object} parsedData 解析后的数据
     * @param {string} format 导出格式
     */
    async exportData(parsedData, format) {
        try {
            let content = '';

            if (format === 'csv') {
                // 导出为CSV格式
                const headers = ['X', ...parsedData.metadata.legends.slice(0, parsedData.data[0].length - 1)];
                content = headers.join(',') + '\n';
                content += parsedData.data.map(row => row.join(',')).join('\n');
            } else if (format === 'json') {
                // 导出为JSON格式
                content = JSON.stringify({
                    metadata: parsedData.metadata,
                    data: parsedData.data
                }, null, 2);
            }

            const uri = await vscode.window.showSaveDialog({
                filters: {
                    'CSV files': ['csv'],
                    'JSON files': ['json'],
                    'All files': ['*']
                },
                defaultUri: vscode.Uri.file(`data.${format}`)
            });

            if (uri) {
                fs.writeFileSync(uri.fsPath, content);
                vscode.window.showInformationMessage(`数据已导出到 ${uri.fsPath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`导出失败: ${error.message}`);
        }
    }

    /**
     * 生成webview的HTML内容
     * @param {Object} parsedData 解析后的数据
     * @param {string} filename 文件名
     * @returns {string} HTML内容
     */
    getWebviewContent(parsedData, filename) {
        const { metadata, data } = parsedData;

        // 计算数据范围
        const xValues = data.map(d => d[0]);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GROMACS Energies</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #ffffff;
            background: linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #2d3748 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #81c784;
        }
        .header h1 {
            font-size: 2.5em;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            margin: 5px 0;
            opacity: 0.8;
        }
        .controls {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(129, 199, 132, 0.2);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .control-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            align-items: end;
        }
        .chart-specific-controls {
            background: rgba(129, 199, 132, 0.1);
            border-radius: 10px;
            padding: 15px;
            margin-top: 10px;
        }
        .control-section-title {
            font-size: 16px;
            font-weight: 600;
            color: #81c784;
            margin-bottom: 15px;
            text-align: center;
        }
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .control-group label {
            font-size: 14px;
            font-weight: 600;
            color: #e3f2fd;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        select, input, button {
            padding: 8px 12px;
            background: rgba(255,255,255,0.15);
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        select:focus, input:focus {
            outline: none;
            border-color: #81c784;
            box-shadow: 0 0 0 2px rgba(129, 199, 132, 0.3);
        }
        button {
            background: linear-gradient(45deg, #4caf50, #81c784);
            border: none;
            cursor: pointer;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        button:hover {
            background: linear-gradient(45deg, #388e3c, #66bb6a);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .slider-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .slider {
            flex: 1;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            outline: none;
            -webkit-appearance: none;
        }
        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: #81c784;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .value-input {
            width: 60px;
            padding: 4px 8px;
            border: 1px solid #4CAF50;
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            font-size: 12px;
            text-align: center;
        }
        .value-input:focus {
            outline: none;
            border-color: #66BB6A;
            background: rgba(255, 255, 255, 0.15);
        }
        .value-display {
            min-width: 40px;
            text-align: center;
            font-size: 12px;
            color: #ffffff;
        }
        .chart-container {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
            height: 600px;
        }
        .legend-container {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.1);
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
        }
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #e3f2fd;
            font-size: 14px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #81c784;
        }
        .range-input {
            width: 80px;
        }
        .color-input {
            width: 50px;
            height: 35px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .hidden {
            display: none;
        }
        
        /* 响应式设计 - 自动缩放 */
        @media screen and (max-width: 1200px) {
            body {
                padding: 15px;
            }
            .header h1 {
                font-size: 2em;
            }
            .control-row {
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 10px;
            }
            .chart-container {
                height: 500px;
                padding: 15px;
            }
            .stats {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
            }
        }
        
        @media screen and (max-width: 768px) {
            body {
                padding: 10px;
            }
            .header h1 {
                font-size: 1.5em;
            }
            .controls {
                padding: 15px;
                gap: 15px;
            }
            .control-row {
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 8px;
            }
            .chart-specific-controls {
                padding: 10px;
            }
            .chart-container {
                height: 400px;
                padding: 10px;
            }
            .legend-container {
                gap: 10px;
            }
            .legend-item {
                padding: 6px 10px;
                font-size: 12px;
            }
            .stats {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            .stat-card {
                padding: 15px;
            }
            .stat-value {
                font-size: 20px;
            }
            button {
                padding: 6px 10px;
                font-size: 12px;
            }
        }
        
        @media screen and (max-width: 480px) {
            body {
                padding: 8px;
            }
            .header h1 {
                font-size: 1.2em;
            }
            .controls {
                padding: 10px;
                gap: 10px;
            }
            .control-row {
                grid-template-columns: 1fr;
                gap: 6px;
            }
            .chart-container {
                height: 300px;
                padding: 8px;
            }
            .legend-container {
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }
            .value-input {
                width: 50px;
                font-size: 11px;
            }
            .range-input {
                width: 60px;
            }
            .color-input {
                width: 40px;
                height: 30px;
            }
        }
        
        /* 容器自适应 */
        .container {
            max-width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
        }
        
        /* 防止组件重合的额外样式 */
        * {
            box-sizing: border-box;
        }
        
        .control-group {
            min-width: 0;
            overflow: hidden;
        }
        
        .control-group label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        select, input, button {
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
        }
        
        .slider-container {
            min-width: 0;
            flex-wrap: nowrap;
        }
        
        .slider {
            min-width: 60px;
        }
        
        /* 图表容器响应式 */
        .chart-container canvas {
            max-width: 100% !important;
            height: auto !important;
        }
        
        /* 确保按钮不会重合 */
        .control-row button {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 80px;
        }
        
        /* 快速操作按钮样式 */
        .quick-actions {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
        }
        
        .quick-btn {
            background: rgba(129, 199, 132, 0.9);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .quick-btn:hover {
            background: rgba(129, 199, 132, 1);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="quick-actions">
                <button class="quick-btn" onclick="openFile()">📁 Open File</button>
            </div>
            <h1>GROMACS Energies</h1>
            <p>Source: ${filename} | Data series: ${data[0]?.length - 1 || 0}</p>
        </div>

    <div class="controls">
        <div class="control-row">
            <div class="control-group">
                <label>Chart Type</label>
                <select id="chartType">
                    <option value="line">Line Chart</option>
                    <option value="scatter">Scatter</option>
                    <option value="bar">Bar Chart</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>X Min</label>
                <input type="number" id="xMin" class="range-input" value="${xMin.toFixed(1)}" step="0.1">
            </div>
            
            <div class="control-group">
                <label>X Max</label>
                <input type="number" id="xMax" class="range-input" value="${xMax.toFixed(1)}" step="0.1">
            </div>
            
            <div class="control-group">
                <label>Y Min</label>
                <input type="number" id="yMin" class="range-input" placeholder="Auto" step="0.1">
            </div>
            
            <div class="control-group">
                <label>Y Max</label>
                <input type="number" id="yMax" class="range-input" placeholder="Auto" step="0.1">
            </div>
            
            <div class="control-group">
                <label>Background Color</label>
                <input type="color" id="backgroundColor" class="color-input" value="#1e3c72">
            </div>
            
            <div class="control-group">
                <label>Default Line Color</label>
                <input type="color" id="defaultLineColor" class="color-input" value="#81c784">
            </div>
            
            <button onclick="resetZoom()">Reset Zoom</button>
            <button onclick="exportData('svg')">Export SVG</button>
            <button onclick="exportData('csv')">Export Data</button>
        </div>
        
        <!-- Line Chart Specific Controls -->
        <div id="lineControls" class="chart-specific-controls">
            <div class="control-section-title">Line Chart Settings</div>
            <div class="control-row">
                <div class="control-group">
                    <label>Line Width</label>
                    <div class="slider-container">
                        <input type="range" id="lineWidth" class="slider" min="1" max="8" value="2">
                        <input type="number" id="lineWidthInput" class="value-input" min="1" max="8" step="1" value="2">
                    </div>
                </div>
                <div class="control-group">
                    <label>Line Tension</label>
                    <div class="slider-container">
                        <input type="range" id="lineTension" class="slider" min="0" max="1" step="0.1" value="0.1">
                        <input type="number" id="lineTensionInput" class="value-input" min="0" max="1" step="0.1" value="0.1">
                    </div>
                </div>
                <div class="control-group">
                    <label>Point Size</label>
                    <div class="slider-container">
                        <input type="range" id="linePointSize" class="slider" min="0" max="10" value="3">
                        <input type="number" id="linePointSizeInput" class="value-input" min="0" max="10" step="1" value="3">
                    </div>
                </div>
                <div class="control-group">
                    <label>Fill Area</label>
                    <select id="fillArea">
                        <option value="false">No Fill</option>
                        <option value="origin">Fill to Origin</option>
                        <option value="start">Fill to Start</option>
                        <option value="end">Fill to End</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Scatter Chart Specific Controls -->
        <div id="scatterControls" class="chart-specific-controls hidden">
            <div class="control-section-title">Scatter Plot Settings</div>
            <div class="control-row">
                <div class="control-group">
                    <label>Point Size</label>
                    <div class="slider-container">
                        <input type="range" id="scatterPointSize" class="slider" min="2" max="15" value="5">
                        <input type="number" id="scatterPointSizeInput" class="value-input" min="2" max="15" step="1" value="5">
                    </div>
                </div>
                <div class="control-group">
                    <label>Point Style</label>
                    <select id="pointStyle">
                        <option value="circle">Circle</option>
                        <option value="triangle">Triangle</option>
                        <option value="rect">Rectangle</option>
                        <option value="rectRounded">Rounded Rectangle</option>
                        <option value="rectRot">Rotated Rectangle</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Point Opacity</label>
                    <div class="slider-container">
                        <input type="range" id="pointOpacity" class="slider" min="0.1" max="1" step="0.1" value="0.8">
                        <input type="number" id="pointOpacityInput" class="value-input" min="0.1" max="1" step="0.1" value="0.8">
                    </div>
                </div>
                <div class="control-group">
                    <label>Show Lines</label>
                    <select id="showLines">
                        <option value="false">No Lines</option>
                        <option value="true">Show Lines</option>
                    </select>
                </div>
            </div>
        </div>
        
        <!-- Bar Chart Specific Controls -->
        <div id="barControls" class="chart-specific-controls hidden">
            <div class="control-section-title">Bar Chart Settings</div>
            <div class="control-row">
                <div class="control-group">
                    <label>Bar Width</label>
                    <div class="slider-container">
                        <input type="range" id="barWidth" class="slider" min="0.1" max="1" step="0.1" value="0.8">
                        <input type="number" id="barWidthInput" class="value-input" min="0.1" max="1" step="0.1" value="0.8">
                    </div>
                </div>
                <div class="control-group">
                    <label>Bar Opacity</label>
                    <div class="slider-container">
                        <input type="range" id="barOpacity" class="slider" min="0.1" max="1" step="0.1" value="0.8">
                        <input type="number" id="barOpacityInput" class="value-input" min="0.1" max="1" step="0.1" value="0.8">
                    </div>
                </div>
                <div class="control-group">
                    <label>Border Width</label>
                    <div class="slider-container">
                        <input type="range" id="borderWidth" class="slider" min="0" max="5" value="1">
                        <input type="number" id="borderWidthInput" class="value-input" min="0" max="5" step="1" value="1">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="chart-container">
        <div class="legend-container" id="legendContainer"></div>
        <canvas id="chart"></canvas>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-title">Data Points</div>
            <div class="stat-value">${data.length}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">X Range</div>
            <div class="stat-value">${xMin.toExponential(2)} → ${xMax.toExponential(2)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Y Range</div>
            <div class="stat-value" id="yRangeValue">Auto</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Series Count</div>
            <div class="stat-value">${data[0]?.length - 1 || 0}</div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const data = ${JSON.stringify(data)};
        const metadata = ${JSON.stringify(metadata)};
        let chart;
        
        const colors = [
            '#81c784', '#64b5f6', '#ffb74d', '#f06292', 
            '#9575cd', '#4db6ac', '#ff8a65', '#a1887f'
        ];
        
        function toggleChartControls() {
            const chartType = document.getElementById('chartType').value;
            const lineControls = document.getElementById('lineControls');
            const scatterControls = document.getElementById('scatterControls');
            const barControls = document.getElementById('barControls');
            
            // Hide all controls first
            lineControls.classList.add('hidden');
            scatterControls.classList.add('hidden');
            barControls.classList.add('hidden');
            
            // Show relevant controls
            switch(chartType) {
                case 'line':
                    lineControls.classList.remove('hidden');
                    break;
                case 'scatter':
                    scatterControls.classList.remove('hidden');
                    break;
                case 'bar':
                    barControls.classList.remove('hidden');
                    break;
            }
        }
        
        function syncSliderAndInput(sliderId, inputId) {
            const slider = document.getElementById(sliderId);
            const input = document.getElementById(inputId);
            
            // Sync slider to input
            slider.addEventListener('input', function() {
                input.value = this.value;
                initChart();
            });
            
            // Sync input to slider
            input.addEventListener('input', function() {
                const value = parseFloat(this.value);
                const min = parseFloat(this.min);
                const max = parseFloat(this.max);
                
                if (value >= min && value <= max) {
                    slider.value = this.value;
                    initChart();
                }
            });
        }
        
        function updateBackgroundColor() {
            const backgroundColor = document.getElementById('backgroundColor').value;
            document.body.style.background = 'linear-gradient(135deg, ' + backgroundColor + ' 0%, ' + adjustBrightness(backgroundColor, -20) + ' 100%)';
            initChart();
        }
        
        function adjustBrightness(hex, percent) {
            // Convert hex to RGB
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        }
        
        function getDefaultColor(index) {
            const defaultLineColor = document.getElementById('defaultLineColor').value;
            const baseColors = [
                '#81c784', '#64b5f6', '#ffb74d', '#f06292',
                '#9575cd', '#4db6ac', '#ff8a65', '#a1887f'
            ];
            
            // If user selected a custom default color, use variations of it
            if (defaultLineColor !== '#81c784') {
                const hue = getHueFromHex(defaultLineColor);
                return 'hsl(' + ((hue + index * 45) % 360) + ', 70%, 65%)';
            }
            
            return baseColors[index % baseColors.length];
        }
        
        function getHueFromHex(hex) {
            const r = parseInt(hex.substr(1, 2), 16) / 255;
            const g = parseInt(hex.substr(3, 2), 16) / 255;
            const b = parseInt(hex.substr(5, 2), 16) / 255;
            
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h;
            
            if (max === min) {
                h = 0;
            } else {
                const d = max - min;
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            
            return h * 360;
        }

        function createLegend() {
            const container = document.getElementById('legendContainer');
            container.innerHTML = '';
            
            if (data[0] && data[0].length > 1) {
                for (let i = 1; i < data[0].length; i++) {
                    const legendItem = document.createElement('div');
                    legendItem.className = 'legend-item';
                    
                    const colorBox = document.createElement('div');
                    colorBox.className = 'legend-color';
                    colorBox.style.backgroundColor = getDefaultColor(i-1);
                    
                    const label = document.createElement('span');
                    label.textContent = metadata.legends[i-1] || 'Series ' + i;
                    
                    legendItem.appendChild(colorBox);
                    legendItem.appendChild(label);
                    container.appendChild(legendItem);
                }
            }
        }

        function initChart() {
            const ctx = document.getElementById('chart').getContext('2d');
            const chartType = document.getElementById('chartType').value;
            
            if (chart) {
                chart.destroy();
            }
            
            const datasets = [];
            if (data[0] && data[0].length > 1) {
                for (let i = 1; i < data[0].length; i++) {
                    const color = getDefaultColor(i-1);
                    let config = {
                        label: metadata.legends[i-1] || 'Series ' + i,
                        data: data.map(row => ({x: row[0], y: row[i]})),
                        borderColor: color,
                        backgroundColor: color + '40'
                    };
                    
                    // Configure based on chart type
                    switch(chartType) {
                        case 'line':
                            const lineWidth = parseInt(document.getElementById('lineWidthInput').value);
                            const lineTension = parseFloat(document.getElementById('lineTensionInput').value);
                            const linePointSize = parseInt(document.getElementById('linePointSizeInput').value);
                            const fillArea = document.getElementById('fillArea').value;
                            
                            config.borderWidth = lineWidth;
                            config.tension = lineTension;
                            config.pointRadius = linePointSize;
                            config.pointHoverRadius = linePointSize + 2;
                            config.showLine = true;
                            config.fill = fillArea !== 'false' ? fillArea : false;
                            break;
                            
                        case 'scatter':
                            const scatterPointSize = parseInt(document.getElementById('scatterPointSizeInput').value);
                            const pointStyle = document.getElementById('pointStyle').value;
                            const pointOpacity = parseFloat(document.getElementById('pointOpacityInput').value);
                            const showLines = document.getElementById('showLines').value === 'true';
                            
                            config.pointRadius = scatterPointSize;
                            config.pointHoverRadius = scatterPointSize + 2;
                            config.pointStyle = pointStyle;
                            config.backgroundColor = color + Math.round(pointOpacity * 255).toString(16).padStart(2, '0');
                            config.showLine = showLines;
                            config.fill = false;
                            break;
                            
                        case 'bar':
                            const barWidth = parseFloat(document.getElementById('barWidthInput').value);
                            const barOpacity = parseFloat(document.getElementById('barOpacityInput').value);
                            const borderWidth = parseInt(document.getElementById('borderWidthInput').value);
                            
                            config.backgroundColor = color + Math.round(barOpacity * 255).toString(16).padStart(2, '0');
                            config.borderWidth = borderWidth;
                            config.barPercentage = barWidth;
                            config.pointRadius = 0;
                            config.pointHoverRadius = 0;
                            config.showLine = false;
                            config.fill = false;
                            break;
                            
                        default:
                            config.pointRadius = 3;
                            config.pointHoverRadius = 5;
                            config.tension = 0.1;
                            config.fill = false;
                    }
                    
                    datasets.push(config);
                }
            }
            
            const xMin = parseFloat(document.getElementById('xMin').value);
            const xMax = parseFloat(document.getElementById('xMax').value);
            const yMin = document.getElementById('yMin').value ? parseFloat(document.getElementById('yMin').value) : undefined;
            const yMax = document.getElementById('yMax').value ? parseFloat(document.getElementById('yMax').value) : undefined;
            
            chart = new Chart(ctx, {
                type: chartType,
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            min: xMin,
                            max: xMax,
                            title: {
                                display: true,
                                text: metadata.xlabel || 'Time (ps)',
                                color: '#ffffff',
                                font: { size: 14, weight: 'bold' }
                            },
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: {
                            min: yMin,
                            max: yMax,
                            title: {
                                display: true,
                                text: metadata.ylabel || 'Energy (kJ/mol)',
                                color: '#ffffff',
                                font: { size: 14, weight: 'bold' }
                            },
                            ticks: { color: '#ffffff' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: metadata.title || 'GROMACS Energies',
                            color: '#ffffff',
                            font: { size: 18, weight: 'bold' }
                        },
                        zoom: {
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                mode: 'xy'
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            }
                        }
                    }
                }
            });
            
            updateYRangeDisplay();
        }
        
        function updateYRangeDisplay() {
            if (chart && chart.scales.y) {
                const yMin = chart.scales.y.min;
                const yMax = chart.scales.y.max;
                document.getElementById('yRangeValue').textContent = 
                    yMin.toExponential(2) + ' → ' + yMax.toExponential(2);
            }
        }
        
        function resetZoom() {
            if (chart) {
                chart.resetZoom();
                updateYRangeDisplay();
            }
        }
        
        function openFile() {
            vscode.postMessage({
                command: 'openFile'
            });
        }
        
        function exportData(format) {
            if (format === 'svg') {
                // 创建SVG元素
                const canvas = document.getElementById('chart');
                const canvasPosition = Chart.helpers.getRelativePosition(chart.canvas, chart);
                const chartArea = chart.chartArea;
                
                // 获取图表数据
                const datasets = chart.data.datasets;
                const xScale = chart.scales.x;
                const yScale = chart.scales.y;
                
                // 创建SVG字符串
                let svgContent = \`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">\`;
                
                // 添加背景
                svgContent += \`<rect width="800" height="600" fill="#1e3c72"/>\`;
                
                // 添加标题
                 svgContent += '<text x="400" y="30" text-anchor="middle" fill="white" font-size="18" font-weight="bold">' + (metadata.title || 'GROMACS Energies') + '</text>';
                 
                 // 添加坐标轴
                 svgContent += '<line x1="80" y1="520" x2="720" y2="520" stroke="white" stroke-width="2"/>'; // X轴
                 svgContent += '<line x1="80" y1="80" x2="80" y2="520" stroke="white" stroke-width="2"/>'; // Y轴
                 
                 // 添加轴标签
                 svgContent += '<text x="400" y="550" text-anchor="middle" fill="white" font-size="14">' + (metadata.xlabel || 'Time (ps)') + '</text>';
                 svgContent += '<text x="30" y="300" text-anchor="middle" fill="white" font-size="14" transform="rotate(-90 30 300)">' + (metadata.ylabel || 'Energy (kJ/mol)') + '</text>';
                
                // 绘制数据线
                datasets.forEach((dataset, datasetIndex) => {
                    if (dataset.data && dataset.data.length > 0) {
                        let pathData = 'M';
                        dataset.data.forEach((point, pointIndex) => {
                             const x = 80 + (point.x - xScale.min) / (xScale.max - xScale.min) * 640;
                             const y = 520 - (point.y - yScale.min) / (yScale.max - yScale.min) * 440;
                             pathData += pointIndex === 0 ? (x + ',' + y) : (' L' + x + ',' + y);
                         });
                        svgContent += '<path d="' + pathData + '" stroke="' + dataset.borderColor + '" stroke-width="2" fill="none"/>';
                    }
                });
                
                svgContent += '</svg>';
                
                // 下载SVG文件
                const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (metadata.title || 'chart') + '.svg';
                a.click();
                URL.revokeObjectURL(url);
            } else {
                vscode.postMessage({
                    command: 'exportData',
                    format: format
                });
            }
        }
        
        // 事件监听器
        document.getElementById('chartType').addEventListener('change', function() {
            toggleChartControls();
            initChart();
        });
        document.getElementById('xMin').addEventListener('change', initChart);
        document.getElementById('xMax').addEventListener('change', initChart);
        document.getElementById('yMin').addEventListener('change', initChart);
        document.getElementById('yMax').addEventListener('change', initChart);
        
        // Color controls
        document.getElementById('backgroundColor').addEventListener('change', updateBackgroundColor);
        document.getElementById('defaultLineColor').addEventListener('change', function() {
            createLegend();
            initChart();
        });
        
        // Initialize slider-input synchronization
        syncSliderAndInput('lineWidth', 'lineWidthInput');
        syncSliderAndInput('lineTension', 'lineTensionInput');
        syncSliderAndInput('linePointSize', 'linePointSizeInput');
        syncSliderAndInput('scatterPointSize', 'scatterPointSizeInput');
        syncSliderAndInput('pointOpacity', 'pointOpacityInput');
        syncSliderAndInput('barWidth', 'barWidthInput');
        syncSliderAndInput('barOpacity', 'barOpacityInput');
        syncSliderAndInput('borderWidth', 'borderWidthInput');
        
        // Other controls
        document.getElementById('fillArea').addEventListener('change', initChart);
        document.getElementById('pointStyle').addEventListener('change', initChart);
        document.getElementById('showLines').addEventListener('change', initChart);
        
        // 窗口大小变化时重新调整图表
        function handleResize() {
            if (chart) {
                chart.resize();
                updateYRangeDisplay();
            }
        }
        
        // 防抖函数，避免频繁触发
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = function() {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        // 添加窗口大小变化监听器
        window.addEventListener('resize', debounce(handleResize, 250));
        
        // 初始化
        window.addEventListener('load', function() {
            createLegend();
            toggleChartControls(); // 初始化控制面板显示
            initChart();
        });
    </script>
    </div> <!-- 容器结束 -->
</body>
</html>`;
    }
}

module.exports = XvgViewerProvider;
