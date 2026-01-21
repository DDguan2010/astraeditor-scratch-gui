/**
 * Scratch SB3 Project Analyzer - Main JavaScript Module
 * This file contains the core logic for analyzing Scratch SB3 files
 */

class ScratchAnalyser {
    constructor() {
        this.projectData = null;
        this.chartInstance = null; // Store chart instance
        this.mathLogicChartInstance = null; // Store math logic chart instance
        
        // 确保DOM加载完成后再设置事件监听器
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            // DOM已经加载完成
            this.setupEventListeners();
        }
    }

    /**
     * Initialize event listeners for full-page drag-drop functionality
     */
    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        
        // 检查元素是否存在
        if (!fileInput) {
            console.error('File input not found!');
            return;
        }
        
        
        
        // 全页面拖拽事件监听
        const body = document.body;
        
        // 防止默认拖拽行为
        body.addEventListener('dragover', (e) => {
            e.preventDefault();
            body.classList.add('drag-active');
        });
        
        body.addEventListener('dragleave', (e) => {
            // 只有当拖拽离开页面时才移除类
            if (e.clientX === 0 && e.clientY === 0) {
                body.classList.remove('drag-active');
            }
        });
        
        // 全页面放置事件
        body.addEventListener('drop', (e) => {
            e.preventDefault();
            body.classList.remove('drag-active');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                
                this.handleFile(files[0]);
            }
        });
        
        // File input change event (备用)
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Scoring criteria button event
        this.setupScoringCriteriaButton();
        
        // Theme switch button event
        this.setupThemeSwitchButton();
    }

    /**
     * Handle file upload and validation
     * @param {File} file - The uploaded file
     */
    async handleFile(file) {
        if (!file.name.endsWith('.sb3')) {
            this.showError('请选择有效的 SB3 文件');
            return;
        }
        
        this.showLoading(true);
        this.hideError();
        
        try {
            const zip = new JSZip();
            const content = await zip.loadAsync(file);
            const projectJson = await content.file('project.json').async('string');
            this.projectData = JSON.parse(projectJson);
            
            // 保存ZIP内容和文件对象供后续分析使用
            this.currentZipContent = content;
            this.currentFile = file;
            
            await this.analyzeProject();
        } catch (error) {
            this.showError('文件解析失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Main analysis function that coordinates all analysis tasks
     */
    async analyzeProject() {
        const analysis = {
            totalBlocks: 0,
            codeTypes: {},
            extensions: [],
            sprites: 0,
            stageInfo: {},
            editorPlatform: 'Unknown',
            // 新增统计字段
            effectiveBlocks: 0,
            functionDefinitions: 0,
            projectSize: 0,
            costumesSize: 0,
            soundsSize: 0
        };
        
        // First analyze extensions (async to get Chinese names)
        await this.analyzeExtensions(analysis);
        
        // Create extension name mapping
        const extensionNameMap = {};
        analysis.extensions.forEach(ext => {
            extensionNameMap[ext.id] = ext.name;
            
        });
        
        // Analyze code blocks (using parsed extension names)
        this.analyzeBlocks(analysis, extensionNameMap);
        
        // Analyze sprites and stage
        this.analyzeSprites(analysis);
        
        // Analyze effective blocks and function definitions
        this.analyzeEffectiveBlocks(analysis);
        
        // Analyze file sizes
        await this.analyzeFileSizes(analysis, this.currentFile);
        
        // Detect editor platform
        this.detectEditorPlatform(analysis);
        
        
        this.displayResults(analysis);
    }

    /**
     * Analyze all code blocks in the project
     * @param {Object} analysis - The analysis object to store results
     * @param {Object} extensionNameMap - Mapping of extension IDs to their Chinese names
     */
    analyzeBlocks(analysis, extensionNameMap = {}) {
        const targets = this.projectData.targets || [];
        
        targets.forEach(target => {
            const blocks = target.blocks || {};
            
            Object.values(blocks).forEach(block => {
                if (block.opcode) {
                    analysis.totalBlocks++;
                    
                    const category = this.getBlockCategory(block.opcode, extensionNameMap);
                    analysis.codeTypes[category] = (analysis.codeTypes[category] || 0) + 1;
                }
            });
        });
    }

    /**
     * Get the category name for a block opcode
     * @param {string} opcode - The block opcode
     * @param {Object} extensionNameMap - Mapping of extension IDs to their Chinese names
     * @returns {string} The category name
     */
    getBlockCategory(opcode, extensionNameMap = {}) {
        if (opcode.startsWith('motion_')) return '运动';
        if (opcode.startsWith('looks_')) return '外观';
        if (opcode.startsWith('sound_')) return '声音';
        if (opcode.startsWith('event_')) return '事件';
        if (opcode.startsWith('control_')) return '控制';
        if (opcode.startsWith('sensing_')) return '侦测';
        if (opcode.startsWith('operator_')) return '运算';
        if (opcode.startsWith('data_')) return '数据';
        if (opcode.startsWith('video_')) return '视频';
        
        // Custom functions and parameters
        if (opcode.startsWith('procedures_')) return '自定义函数';
        if (opcode.startsWith('argument_')) return '自定义函数';
        
        // Extension block handling (including pen_ which is actually an extension)
        if (!this.isStandardBlock(opcode)) {
            const extensionId = this.getExtensionIdFromOpcode(opcode);
            // Prioritize parsed Chinese names
            if (extensionNameMap[extensionId]) {
                
                return extensionNameMap[extensionId];
            }
            // Fallback to default name
            return this.getExtensionNameFromId(extensionId);
        }
        
        return '其他';
    }

    /**
     * Check if a block is a standard Scratch block
     * @param {string} opcode - The block opcode
     * @returns {boolean} True if it's a standard block
     */
    isStandardBlock(opcode) {
        const standardCategories = [
            'motion_', 'looks_', 'sound_', 'event_', 'control_', 
            'sensing_', 'operator_', 'data_', 'video_',
            'procedures_', 'argument_'
        ];
        
        return standardCategories.some(category => opcode.startsWith(category));
    }

    /**
     * Extract extension ID from block opcode
     * @param {string} opcode - The block opcode
     * @returns {string} The extension ID
     */
    getExtensionIdFromOpcode(opcode) {
        // Extension block opcode format is usually "extensionID_functionName"
        const underscoreIndex = opcode.indexOf('_');
        if (underscoreIndex > 0) {
            return opcode.substring(0, underscoreIndex);
        }
        return opcode;
    }

    /**
     * Analyze extensions used in the project
     * @param {Object} analysis - The analysis object to store results
     */
    async analyzeExtensions(analysis) {
        const extensions = this.projectData.extensions || [];
        const extensionURLs = this.projectData.extensionURLs || {};
        
        // Get all extension block opcodes
        const extensionBlocks = this.getExtensionBlocks();
        
        // Analyze extension information
        const extensionPromises = extensions.map(async ext => {
            const defaultExtensionNames = {
                'music': '音乐',
                'pen': '画笔',
                'videoSensing': '视频侦测',
                'text2speech': '文字转语音',
                'translate': '翻译',
                'makeymakey': 'Makey Makey',
                'microbit': 'micro:bit',
                'ev3': 'LEGO EV3',
                'wedo2': 'LEGO WeDo 2.0',
                'boost': 'LEGO BOOST'
            };
            
            let extensionName = defaultExtensionNames[ext] || ext;
            let extensionColor = null;
            
            // Try to get Chinese name and color from extension source code
            if (extensionURLs[ext]) {
                try {
                    const extensionInfo = await this.getExtensionChineseName(extensionURLs[ext], ext);
                    extensionName = extensionInfo.name;
                    extensionColor = extensionInfo.color;
                } catch (error) {
                    console.warn(`无法获取扩展 ${ext} 的信息:`, error);
                }
            }
            
            const extensionInfo = {
                id: ext,
                name: extensionName,
                color: extensionColor,
                url: extensionURLs[ext] || null,
                blocks: extensionBlocks.filter(block => block.extensionId === ext)
            };
            
            return extensionInfo;
        });
        
        // Also check for pen extension usage (it's a built-in extension that may not be in extensions list)
        const penBlocks = extensionBlocks.filter(block => block.extensionId === 'pen');
        if (penBlocks.length > 0 && !extensions.includes('pen')) {
            const penExtensionInfo = {
                id: 'pen',
                name: '画笔',
                color: '#0FBD8C', // Pen extension color
                url: null,
                blocks: penBlocks
            };
            extensionPromises.push(Promise.resolve(penExtensionInfo));
        }
        
        analysis.extensions = await Promise.all(extensionPromises);
        
        // Filter out extensions with no blocks
        analysis.extensions = analysis.extensions.filter(ext => ext.blocks.length > 0);
        
        // Detect extensions used but not in extensions list (identified by opcode)
        const detectedExtensions = this.detectExtensionsFromBlocks(extensionBlocks);
        const detectedExtensionPromises = detectedExtensions.map(async detectedExt => {
            if (!analysis.extensions.find(ext => ext.id === detectedExt.id)) {
                let extensionName = detectedExt.name;
                let extensionColor = null;
                
                if (extensionURLs[detectedExt.id]) {
                    try {
                        const extensionData = await this.getExtensionChineseName(extensionURLs[detectedExt.id], detectedExt.id);
                        extensionName = extensionData.name;
                        extensionColor = extensionData.color;
                    } catch (error) {
                        console.warn(`无法获取扩展 ${detectedExt.id} 的信息:`, error);
                    }
                }
                
                return {
                    id: detectedExt.id,
                    name: extensionName,
                    color: extensionColor,
                    url: extensionURLs[detectedExt.id] || null,
                    blocks: detectedExt.blocks
                };
            }
            return null;
        });
        
        const detectedExtensionsInfo = await Promise.all(detectedExtensionPromises);
        
        for (const extInfo of detectedExtensionsInfo) {
            if (extInfo) {
                let extensionName = extInfo.name;
                let extensionColor = null;
                
                if (extensionURLs[extInfo.id]) {
                    try {
                        const extensionData = await this.getExtensionChineseName(extensionURLs[extInfo.id], extInfo.id);
                        extensionName = extensionData.name;
                        extensionColor = extensionData.color;
                    } catch (error) {
                        console.warn(`无法获取扩展 ${extInfo.id} 的信息:`, error);
                    }
                }
                
                // Only add extensions that have blocks
                if (extInfo.blocks.length > 0) {
                    analysis.extensions.push({
                        id: extInfo.id,
                        name: extensionName,
                        color: extensionColor,
                        url: extensionURLs[extInfo.id] || null,
                        blocks: extInfo.blocks
                    });
                }
            }
        }
    }

    /**
     * Get all extension blocks from the project
     * @returns {Array} Array of extension block information
     */
    getExtensionBlocks() {
        const extensionBlocks = [];
        const targets = this.projectData.targets || [];
        
        targets.forEach(target => {
            const blocks = target.blocks || {};
            
            Object.values(blocks).forEach(block => {
                if (block.opcode && !this.isStandardBlock(block.opcode)) {
                    const extensionId = this.getExtensionIdFromOpcode(block.opcode);
                    if (extensionId) {
                        extensionBlocks.push({
                            opcode: block.opcode,
                            extensionId: extensionId,
                            blockId: block.id
                        });
                    }
                }
            });
        });
        
        return extensionBlocks;
    }

    /**
     * Detect extensions from blocks (for extensions not in extensions list)
     * @param {Array} extensionBlocks - Array of extension blocks
     * @returns {Array} Array of detected extension information
     */
    detectExtensionsFromBlocks(extensionBlocks) {
        const extensionMap = new Map();
        
        extensionBlocks.forEach(block => {
            const { extensionId } = block;
            
            if (!extensionMap.has(extensionId)) {
                extensionMap.set(extensionId, {
                    id: extensionId,
                    name: this.getExtensionNameFromId(extensionId),
                    blocks: []
                });
            }
            
            extensionMap.get(extensionId).blocks.push(block);
        });
        
        return Array.from(extensionMap.values());
    }

    /**
     * Get extension name from ID (fallback method)
     * @param {string} extensionId - The extension ID
     * @returns {string} The extension name
     */
    getExtensionNameFromId(extensionId) {
        const knownExtensions = {
            'music': '音乐',
            'pen': '画笔',
            'videoSensing': '视频侦测',
            'text2speech': '文字转语音',
            'translate': '翻译',
            'makeymakey': 'Makey Makey',
            'microbit': 'micro:bit',
            'ev3': 'LEGO EV3',
            'wedo2': 'LEGO WeDo 2.0',
            'boost': 'LEGO BOOST'
        };
        
        return knownExtensions[extensionId] || extensionId;
    }

    /**
     * Get Chinese name and color from extension source code
     * @param {string} extensionUrl - URL or data URL of the extension
     * @param {string} extensionId - The extension ID
     * @returns {Object} Object containing name and color
     */
    async getExtensionChineseName(extensionUrl, extensionId) {
        let sourceCode;
        
        if (extensionUrl.startsWith('data:')) {
            // Handle data URL
            const match = extensionUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
                const mimeType = match[1];
                const base64Data = match[2];
                
                if (mimeType === 'text/javascript' || mimeType === 'application/javascript') {
                    sourceCode = atob(base64Data);
                } else {
                    throw new Error(`不支持的MIME类型: ${mimeType}`);
                }
            } else {
                throw new Error('无效的data URL格式');
            }
        } else {
            // Handle regular URL
            const response = await fetch(extensionUrl);
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            sourceCode = await response.text();
        }
        
        return this.parseExtensionTranslation(sourceCode, extensionId);
    }

    /**
     * Parse extension source code for translation and color information
     * @param {string} sourceCode - The extension source code
     * @param {string} extensionId - The extension ID
     * @returns {Object} Object containing name and color
     */
    parseExtensionTranslation(sourceCode, extensionId) {
        // Find Scratch.translate.setup call
        const translateSetupMatch = sourceCode.match(/Scratch\.translate\.setup\s*\(\s*({[\s\S]*?})\s*\)/);
        
        if (!translateSetupMatch) {
            return { name: extensionId, color: null }; // No translation setup found
        }
        
        try {
            const translationJson = JSON.parse(translateSetupMatch[1]);
            const zhCnTranslations = translationJson['zh-cn'];
            
            // Find getInfo function and extract complete information
            const getInfoMatch = sourceCode.match(/getInfo\s*\(\s*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\s*\}/);
            
            if (!getInfoMatch) {
                return { name: extensionId, color: null }; // getInfo not found
            }
            
            const returnContent = getInfoMatch[1];
            let extensionName = extensionId;
            let extensionColor = null;
            
            // Extract color1 value
            const colorMatch = returnContent.match(/color1\s*:\s*['"`]([^'"`]+)['"`]/);
            if (colorMatch) {
                extensionColor = colorMatch[1];
            }
            
            // Extract name field
            const nameMatch = returnContent.match(/name\s*:\s*([\s\S]*?)\s*[,}]/);
            if (nameMatch) {
                const nameValue = nameMatch[1].trim();
                
                if (zhCnTranslations) {
                    // Check if Scratch.translate function is used
                    const translateMatch = nameValue.match(/Scratch\.translate\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/);
                    
                    if (translateMatch) {
                        // Extract Scratch.translate parameter, add underscore prefix
                        const translateKey = `_${translateMatch[1]}`;
                        const translatedName = zhCnTranslations[translateKey];
                        
                        if (translatedName) {
                            extensionName = translatedName;
                        }
                    } else {
                        // If no Scratch.translate or translation not found, try direct string matching
                        const directStringMatch = nameValue.match(/['"`]([^'"`]+)['"`]/);
                        if (directStringMatch) {
                            const directString = directStringMatch[1];
                            const translatedName = zhCnTranslations[`_${directString}`] || zhCnTranslations[directString];
                            
                            if (translatedName) {
                                extensionName = translatedName;
                            } else {
                                extensionName = directString;
                            }
                        }
                    }
                } else {
                    // No Chinese translation, use original name directly
                    const directStringMatch = nameValue.match(/['"`]([^'"`]+)['"`]/);
                    if (directStringMatch) {
                        extensionName = directStringMatch[1];
                    }
                }
            }
            
            return { name: extensionName, color: extensionColor };
            
        } catch (error) {
            console.warn('解析翻译JSON失败:', error);
            return { name: extensionId, color: null };
        }
    }

    /**
     * Analyze sprites and stage information
     * @param {Object} analysis - The analysis object to store results
     */
    analyzeSprites(analysis) {
        const targets = this.projectData.targets || [];
        analysis.sprites = targets.filter(target => !target.isStage).length;
        
        const stage = targets.find(target => target.isStage);
        if (stage) {
            // Collect variable names and list names from Array[0]
            const variableNames = [];
            const listNames = [];
            
            // Extract variable names from Array[0]
            if (stage.variables) {
                Object.values(stage.variables).forEach(variable => {
                    if (Array.isArray(variable) && variable.length > 0) {
                        variableNames.push(variable[0]);
                    }
                });
            }
            
            // Extract list names from Array[0]
            if (stage.lists) {
                Object.values(stage.lists).forEach(list => {
                    if (Array.isArray(list) && list.length > 0) {
                        listNames.push(list[0]);
                    }
                });
            }
            
            analysis.stageInfo = {
                variables: {
                    count: variableNames.length,
                    names: variableNames
                },
                lists: {
                    count: listNames.length,
                    names: listNames
                },
                broadcasts: Object.keys(stage.broadcasts || {}).length
            };
        }
    }

    /**
     * Detect the editor platform used
     * @param {Object} analysis - The analysis object to store results
     */
    detectEditorPlatform(analysis) {
        // Try to detect from metadata
        const meta = this.projectData.meta || {};
        
        // First try to get platform name from meta.platform.name
        if (meta.platform && meta.platform.name) {
            analysis.editorPlatform = meta.platform.name;
        } 
        // If no platform.name, try to get from meta.platform.url
        else if (meta.platform && meta.platform.url) {
            // Extract platform name from URL
            const url = meta.platform.url;
            if (url.includes('scratch.mit.edu')) {
                analysis.editorPlatform = 'Scratch Online Editor';
            } else if (url.includes('turbowarp.org')) {
                analysis.editorPlatform = 'TurboWarp';
            } else if (url.includes('forkphorus.github.io')) {
                analysis.editorPlatform = 'Forkphorus';
            } else {
                analysis.editorPlatform = url;
            }
        }
        // Fallback to traditional detection methods
        else if (meta.vm) {
            analysis.editorPlatform = 'Scratch 3.0';
        } else if (this.projectData.hasOwnProperty('targets')) {
            analysis.editorPlatform = 'Scratch 3.0';
        } else {
            analysis.editorPlatform = 'Undefined';
        }
    }

    /**
     * Display all analysis results
     * @param {Object} analysis - The analysis object containing all results
     */
    displayResults(analysis) {
        // Display statistics
        this.displayStats(analysis);
        
        // Display code type chart
        this.displayCodeTypeChart(analysis.codeTypes, analysis);
        
        // Display Dr.Scratch scores
        this.displayDrScratchScores(analysis);
        
        // Display extensions
        this.displayExtensions(analysis.extensions);
        
        // Display project information
        this.displayProjectInfo(analysis);
        
        // Show results section
        const resultsElement = document.getElementById('results');
        resultsElement.classList.remove('mdui-hidden');
    }

    /**
     * Display statistics cards
     * @param {Object} analysis - The analysis object
     */
    displayStats(analysis) {
        const statsGrid = document.getElementById('statsGrid');
        const totalExtensionBlocks = analysis.extensions.reduce((sum, ext) => sum + ext.blocks.length, 0);
        
        statsGrid.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${analysis.totalBlocks}</div>
                <div class="stat-label">总代码块数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${analysis.effectiveBlocks}</div>
                <div class="stat-label">有效积木</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${analysis.functionDefinitions}</div>
                <div class="stat-label">函数定义</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatFileSize(analysis.projectSize)}</div>
                <div class="stat-label">工程大小</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatFileSize(analysis.costumesSize)}</div>
                <div class="stat-label">造型大小</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${this.formatFileSize(analysis.soundsSize)}</div>
                <div class="stat-label">音频大小</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${analysis.sprites}</div>
                <div class="stat-label">精灵数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Object.keys(analysis.codeTypes).length}</div>
                <div class="stat-label">代码类型数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${analysis.extensions.length}</div>
                <div class="stat-label">扩展数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalExtensionBlocks}</div>
                <div class="stat-label">扩展代码块</div>
            </div>
        `;
    }

    /**
     * Display code type distribution chart
     * @param {Object} codeTypes - Object with code type counts
     * @param {Object} analysis - The analysis object
     */
    displayCodeTypeChart(codeTypes, analysis) {
        // Destroy existing chart if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
        
        const ctx = document.getElementById('codeTypeChart').getContext('2d');
        
        // Define fixed order for standard categories
        const standardOrder = ['运动', '外观', '声音', '事件', '控制', '侦测', '运算', '数据', '自定义函数'];
        
        // Separate standard and extension categories
        const standardCategories = {};
        const extensionCategories = {};
        
        Object.keys(codeTypes).forEach(category => {
            if (standardOrder.includes(category)) {
                standardCategories[category] = codeTypes[category];
            } else {
                extensionCategories[category] = codeTypes[category];
            }
        });
        
        // Arrange standard categories in fixed order
        const orderedStandard = {};
        standardOrder.forEach(category => {
            if (standardCategories[category]) {
                orderedStandard[category] = standardCategories[category];
            }
        });
        
        // Sort extension categories alphabetically
        const sortedExtensions = {};
        Object.keys(extensionCategories).sort().forEach(category => {
            sortedExtensions[category] = extensionCategories[category];
        });
        
        // Merge sorted data
        const sortedCodeTypes = { ...orderedStandard, ...sortedExtensions };
        const sortedLabels = Object.keys(sortedCodeTypes);
        const sortedData = Object.values(sortedCodeTypes);
        
        // Define colors for each category
        const categoryColors = {
            '运动': '#4C97FF',
            '外观': '#9966FF',
            '声音': '#CF63CF',
            '事件': '#FFBF00',
            '控制': '#FFAB19',
            '侦测': '#5CB1D6',
            '运算': '#59C059',
            '数据': '#FF8C1A',
            '自定义函数': '#FF6680'
        };
        
        // Generate default colors for extensions
        const extensionColors = [
            '#3498DB', '#E74C3C', '#F39C12', '#27AE60', '#16A085', 
            '#2ECC71', '#E67E22', '#95A5A6', '#34495E', '#7F8C8D', 
            '#9B59B6', '#1ABC9C', '#2C3E50', '#F1C40F', '#D35400', 
            '#C0392B', '#BDC3C7', '#7F8C8D', '#95A5A6'
        ];
        
        // Assign corresponding colors to each label
        const assignedColors = sortedLabels.map((label, index) => {
            if (categoryColors[label]) {
                return categoryColors[label];
            } else {
                // Check if it's an extension with custom color
                const extension = analysis.extensions.find(ext => ext.name === label);
                if (extension && extension.color) {
                    return extension.color;
                }
                // Extensions use循环 colors
                const extIndex = (index - Object.keys(categoryColors).length) % extensionColors.length;
                return extensionColors[Math.max(0, extIndex)];
            }
        });
        
        // Create new chart and store instance
        this.chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedLabels,
                datasets: [{
                    data: sortedData,
                    backgroundColor: assignedColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            },
                            padding: 15,
                            // Ensure legend displays in data order
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    const dataset = data.datasets[0];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    
                                    return data.labels.map((label, i) => {
                                        const value = dataset.data[i];
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        
                                        return {
                                            text: `${label}: ${value} (${percentage}%)`,
                                            fillStyle: dataset.backgroundColor[i],
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Download extension file
     * @param {string} url - The extension URL
     * @param {string} filename - The filename for download
     */
    async downloadExtension(url, filename) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
        } catch (error) {
            console.error('下载扩展失败:', error);
            // Fallback to opening in new tab if download fails
            window.open(url, '_blank');
        }
    }

    /**
     * Display extension information
     * @param {Array} extensions - Array of extension information
     */
    displayExtensions(extensions) {
        const extensionList = document.getElementById('extensionList');
        
        if (extensions.length === 0) {
            extensionList.innerHTML = '<div class="mdui-typo-body1">未使用扩展</div>';
        } else {
            extensionList.innerHTML = extensions.map(ext => {
                const extensionColor = ext.color || '#667eea';
                const downloadUrl = ext.url;
                
                return `
                    <div class="extension-card">
                        <div class="extension-header">
                            <div class="extension-color-indicator" style="background-color: ${extensionColor};"></div>
                            <div class="extension-info">
                                <div class="extension-name">${ext.name}</div>
                                <div class="extension-id">${ext.id}</div>
                            </div>
                        </div>
                        <div class="extension-footer">
                            <span class="block-count">${ext.blocks.length} 个代码块</span>
                            ${downloadUrl ? `
                                <button class="download-btn" onclick="window.scratchAnalyser.downloadExtension('${downloadUrl}', '${ext.id}.js')">
                                    <i class="material-icons">download</i>
                                    下载扩展
                                </button>
                            ` : `
                                <button class="download-btn" disabled>
                                    <i class="material-icons">block</i>
                                    内置扩展
                                </button>
                            `}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    /**
     * Truncate long URLs for display
     * @param {string} url - The URL to truncate
     * @returns {string} Truncated URL
     */
    truncateUrl(url) {
        if (url.length > 50) {
            return url.substring(0, 47) + '...';
        }
        return url;
    }

    /**
     * Display project information
     * @param {Object} analysis - The analysis object
     */
    displayProjectInfo(analysis) {
        const projectInfo = document.getElementById('projectInfo');
        const stageInfo = analysis.stageInfo || {};
        
        projectInfo.innerHTML = `
            <div class="mdui-list">
                <div class="mdui-list-item">
                    <i class="mdui-list-item-icon mdui-icon material-icons">computer</i>
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title">编辑器平台</div>
                        <div class="mdui-list-item-text">${analysis.editorPlatform}</div>
                    </div>
                </div>
                <div class="mdui-list-item">
                    <i class="mdui-list-item-icon mdui-icon material-icons">data_object</i>
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title">变量数量</div>
                        <div class="mdui-list-item-text">${stageInfo.variables ? stageInfo.variables.count : 0}</div>
                    </div>
                </div>
                <div class="mdui-list-item">
                    <i class="mdui-list-item-icon mdui-icon material-icons">format_list_bulleted</i>
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title">列表数量</div>
                        <div class="mdui-list-item-text">${stageInfo.lists ? stageInfo.lists.count : 0}</div>
                    </div>
                </div>
                <div class="mdui-list-item">
                    <i class="mdui-list-item-icon mdui-icon material-icons">send</i>
                    <div class="mdui-list-item-content">
                        <div class="mdui-list-item-title">广播消息数量</div>
                        <div class="mdui-list-item-text">${stageInfo.broadcasts || 0}</div>
                    </div>
                </div>
            </div>
        `;
    }

    

    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show the loading indicator
     */
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        const resultsElement = document.getElementById('results');
        
        if (show) {
            // Hide results and show loading
            resultsElement.classList.add('mdui-hidden');
            loadingElement.classList.remove('mdui-hidden');
        } else {
            // Hide loading and show results
            loadingElement.classList.add('mdui-hidden');
        }
    }

    /**
     * Display error message
     * @param {string} message - The error message to display
     */
    showError(message) {
        const errorElement = document.getElementById('error');
        const errorMessageElement = errorElement.querySelector('.error-message');
        errorMessageElement.textContent = message;
        errorElement.classList.remove('mdui-hidden');
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorElement = document.getElementById('error');
        errorElement.classList.add('mdui-hidden');
    }

    /**
     * Display Dr.Scratch scores
     * @param {Object} analysis - The analysis object containing all results
     */
    displayDrScratchScores(analysis) {
        const scores = this.calculateDrScratchScores();
        this.displayDrScratchRadarChart(scores);
        this.displayDrScratchScoreSummary(scores);
        
        // 显示新的分析模块
        const mathScores = this.calculateMathLogicScores();
        this.displayMathLogicRadarChart(mathScores);
        this.displayMathLogicScoreSummary(mathScores);
        
        this.displayCodeTypeDistribution();
        this.displayDrScratchBlockDetails(); // 新增：显示积木块种类详情
    }

    /**
     * Calculate Dr.Scratch scores based on project analysis
     * @returns {Object} Object containing scores for each concept
     */
    calculateDrScratchScores() {
        const scores = {
            'Abstraction and problem decomposition': 0,
            'Parallelism': 0,
            'Logical thinking': 0,
            'Synchronization': 0,
            'Flow control': 0,
            'User Interactivity': 0,
            'Data representation': 0
        };

        const targets = this.projectData.targets || [];
        const blockTypes = new Set(); // 存储所有使用的积木块种类
        const eventBlockTypes = new Set(); // 存储事件积木块种类
        const controlBlockTypes = new Set(); // 存储控制积木块种类
        const operatorBlockTypes = new Set(); // 存储运算积木块种类
        const dataBlockTypes = new Set(); // 存储数据积木块种类
        const sensingBlockTypes = new Set(); // 存储侦测积木块种类
        const motionBlockTypes = new Set(); // 存储运动积木块种类
        const looksBlockTypes = new Set(); // 存储外观积木块种类
        const soundBlockTypes = new Set(); // 存储声音积木块种类
        const procedureBlockTypes = new Set(); // 存储自定义积木块种类
        const variableNames = new Set();
        const listNames = new Set();

        // 收集所有积木块种类
        targets.forEach(target => {
            const blocks = target.blocks || {};
            Object.values(blocks).forEach(block => {
                if (block.opcode) {
                    blockTypes.add(block.opcode);
                    
                    // 分类收集积木块种类
                    if (block.opcode.startsWith('event_')) {
                        eventBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('control_')) {
                        controlBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('operator_')) {
                        operatorBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('data_')) {
                        dataBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('sensing_')) {
                        sensingBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('motion_')) {
                        motionBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('looks_')) {
                        looksBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('sound_')) {
                        soundBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('procedures_')) {
                        procedureBlockTypes.add(block.opcode);
                    }
                }
            });

            // 收集变量和列表名称
            if (target.variables) {
                Object.values(target.variables).forEach(variable => {
                    if (Array.isArray(variable) && variable.length > 0) {
                        variableNames.add(variable[0]);
                    }
                });
            }
            if (target.lists) {
                Object.values(target.lists).forEach(list => {
                    if (Array.isArray(list) && list.length > 0) {
                        listNames.add(list[0]);
                    }
                });
            }
        });

        // 1. 抽象和问题分解 (Abstraction and problem decomposition)
        // 完全基于积木块种类评分
        const spriteCount = targets.filter(t => !t.isStage).length;
        const hasMultipleSprites = spriteCount > 1;
        const hasMultipleScripts = eventBlockTypes.size > 1; // 多种事件积木表示多个脚本
        const hasCustomBlocks = procedureBlockTypes.has('procedures_definition');
        const hasClones = controlBlockTypes.has('control_create_clone_of') || controlBlockTypes.has('control_start_as_clone');
        
        if (hasMultipleSprites && hasMultipleScripts) {
            scores['Abstraction and problem decomposition'] = 1; // Basic
        }
        if (hasCustomBlocks) {
            scores['Abstraction and problem decomposition'] = 2; // Developing
        }
        if (hasClones) {
            scores['Abstraction and problem decomposition'] = 3; // Proficiency
        }

        // 2. 并行性 (Parallelism)
        // 基于不同的事件积木块种类
        const hasGreenFlag = eventBlockTypes.has('event_whenflagclicked');
        const hasKeyEvents = eventBlockTypes.has('event_whenkeypressed');
        const hasClickEvents = eventBlockTypes.has('event_whenthisspriteclicked');
        const hasMessageEvents = eventBlockTypes.has('event_whenbroadcastreceived');
        const hasCloneEvents = controlBlockTypes.has('control_create_clone_of');
        const hasSensorEvents = eventBlockTypes.has('event_whengreaterthan');
        const hasBackdropEvents = eventBlockTypes.has('event_whenbackdropswitchesto');
        
        if (hasGreenFlag && eventBlockTypes.size > 1) {
            scores['Parallelism'] = 1; // Basic - 多个绿旗脚本
        }
        if ((hasKeyEvents || hasClickEvents) && (eventBlockTypes.size > 2)) {
            scores['Parallelism'] = 2; // Developing - 按键或点击事件
        }
        if (hasMessageEvents || hasCloneEvents || hasSensorEvents || hasBackdropEvents) {
            scores['Parallelism'] = 3; // Proficiency - 消息、克隆或传感器事件
        }

        // 3. 逻辑思维 (Logical thinking)
        // 基于不同的逻辑积木块种类
        const hasIf = controlBlockTypes.has('control_if');
        const hasIfElse = controlBlockTypes.has('control_if_else');
        const hasLogicOps = operatorBlockTypes.has('operator_and') || 
                           operatorBlockTypes.has('operator_or') || 
                           operatorBlockTypes.has('operator_not');
        
        if (hasIf) {
            scores['Logical thinking'] = 1; // Basic
        }
        if (hasIfElse) {
            scores['Logical thinking'] = 2; // Developing
        }
        if (hasLogicOps) {
            scores['Logical thinking'] = 3; // Proficiency
        }

        // 4. 同步 (Synchronization)
        // 基于不同的同步积木块种类
        const hasWait = controlBlockTypes.has('control_wait');
        const hasBroadcast = eventBlockTypes.has('event_broadcast');
        const hasReceiveMessage = eventBlockTypes.has('event_whenbroadcastreceived');
        const hasStopAll = controlBlockTypes.has('control_stop_all');
        const hasStopThis = controlBlockTypes.has('control_stop_this_script');
        const hasStopOther = controlBlockTypes.has('control_stop_other_scripts_in_sprite');
        const hasWaitUntil = controlBlockTypes.has('control_wait_until');
        const hasBackdropChange = looksBlockTypes.has('looks_nextbackdrop') || looksBlockTypes.has('looks_switchbackdropto');
        const hasBroadcastAndWait = eventBlockTypes.has('event_broadcastandwait');
        
        if (hasWait) {
            scores['Synchronization'] = 1; // Basic
        }
        if (hasBroadcast || hasReceiveMessage || hasStopAll || hasStopThis || hasStopOther) {
            scores['Synchronization'] = 2; // Developing
        }
        if (hasWaitUntil || hasBackdropChange || hasBroadcastAndWait) {
            scores['Synchronization'] = 3; // Proficiency
        }

        // 5. 流程控制 (Flow control)
        // 基于不同的流程控制积木块种类
        const hasSequence = blockTypes.size > 0; // 任何积木块都表示有序列
        const hasRepeat = controlBlockTypes.has('control_repeat') || controlBlockTypes.has('control_forever');
        const hasRepeatUntil = controlBlockTypes.has('control_repeat_until');
        
        if (hasSequence) {
            scores['Flow control'] = 1; // Basic
        }
        if (hasRepeat) {
            scores['Flow control'] = 2; // Developing
        }
        if (hasRepeatUntil) {
            scores['Flow control'] = 3; // Proficiency
        }

        // 6. 用户交互 (User Interactivity)
        // 基于不同的交互积木块种类
        const hasGreenFlagEvent = eventBlockTypes.has('event_whenflagclicked');
        const hasKeyPressedEvent = eventBlockTypes.has('event_whenkeypressed');
        const hasSpriteClickedEvent = eventBlockTypes.has('event_whenthisspriteclicked');
        const hasAskWait = sensingBlockTypes.has('sensing_askandwait');
        const hasMouseBlocks = sensingBlockTypes.has('sensing_mousedown') || 
                              sensingBlockTypes.has('sensing_mousex') || 
                              sensingBlockTypes.has('sensing_mousey');
        const hasSensorGreater = eventBlockTypes.has('event_whengreaterthan');
        const hasVideo = Array.from(blockTypes).some(type => type.startsWith('video_'));
        const hasAudioInteraction = soundBlockTypes.has('sound_playuntildone') || 
                                   soundBlockTypes.has('sound_setvolumeto') ||
                                   soundBlockTypes.has('sound_changevolumeby');
        
        if (hasGreenFlagEvent) {
            scores['User Interactivity'] = 1; // Basic
        }
        if (hasKeyPressedEvent || hasSpriteClickedEvent || hasAskWait || hasMouseBlocks) {
            scores['User Interactivity'] = 2; // Developing
        }
        if (hasSensorGreater || hasVideo || hasAudioInteraction) {
            scores['User Interactivity'] = 3; // Proficiency
        }

        // 7. 数据表示 (Data representation)
        // 基于不同的数据积木块种类
        const hasSpriteModifiers = motionBlockTypes.size > 0 || looksBlockTypes.size > 0 || soundBlockTypes.size > 0;
        const hasVariableOperations = variableNames.size > 0 && dataBlockTypes.size > 0;
        const hasListOperations = listNames.size > 0 && Array.from(dataBlockTypes).some(type => type.includes('list'));
        
        if (hasSpriteModifiers) {
            scores['Data representation'] = 1; // Basic
        }
        if (hasVariableOperations) {
            scores['Data representation'] = 2; // Developing
        }
        if (hasListOperations) {
            scores['Data representation'] = 3; // Proficiency
        }

        return scores;
    }

    /**
     * Display Dr.Scratch radar chart with hover functionality
     * @param {Object} scores - Dr.Scratch scores object
     */
    displayDrScratchRadarChart(scores) {
        const canvas = document.getElementById('drScratchRadarChart');
        const tooltip = document.getElementById('radarTooltip');
        const ctx = canvas.getContext('2d');

        /**
         * Calculate overall color based on total score
         * @param {Object} scores - All scores object
         * @returns {string} RGB color string
         */
        const getOverallColor = (scores) => {
            // 计算总分
            const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
            const averageScore = totalScore / Object.keys(scores).length;
            
            if (averageScore <= 1.3) {
                // 红色系 (低分平均)
                return 'rgb(231, 76, 60)'; // 鲜红色
            } else if (averageScore <= 2.0) {
                // 橙黄色系 (中等分数平均)
                return 'rgb(241, 196, 15)'; // 金黄色
            } else if (averageScore <= 2.7) {
                // 蓝绿色系 (中高分平均)
                return 'rgb(46, 204, 113)'; // 绿松石色
            } else {
                // 深蓝色系 (高分平均)
                return 'rgb(52, 152, 219)'; // 天蓝色
            }
            return 'rgb(149, 165, 166)'; // 灰色 (默认)
        };

        /**
         * Calculate fill color with transparency
         * @param {string} baseColor - Base RGB color
         * @returns {string} RGBA color string with transparency
         */
        const getFillColor = (baseColor) => {
            // 提取RGB值并添加透明度
            return baseColor.replace('rgb', 'rgba').replace(')', ', 0.3)');
        };

        // 计算整体颜色
        const overallColor = getOverallColor(scores);
        const overallFillColor = getFillColor(overallColor);
        
        // 设置canvas尺寸
        canvas.width = 400;
        canvas.height = 400;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;
        
        // 七个维度的标签
        const labels = [
            '抽象和问题分解',
            '并行性',
            '逻辑思维',
            '同步',
            '流程控制',
            '用户交互',
            '数据表示'
        ];
        
        const values = [
            scores['Abstraction and problem decomposition'],
            scores['Parallelism'],
            scores['Logical thinking'],
            scores['Synchronization'],
            scores['Flow control'],
            scores['User Interactivity'],
            scores['Data representation']
        ];

        const scoreKeys = [
            'Abstraction and problem decomposition',
            'Parallelism',
            'Logical thinking',
            'Synchronization',
            'Flow control',
            'User Interactivity',
            'Data representation'
        ];

        // 存储端点位置用于悬停检测
        const pointPositions = [];
        
        // 绘制函数
        const drawChart = () => {
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制七边形网格
            for (let level = 1; level <= 3; level++) {
                ctx.beginPath();
                for (let i = 0; i < 7; i++) {
                    const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * radius * (level / 3);
                    const y = centerY + Math.sin(angle) * radius * (level / 3);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.strokeStyle = '#e0e0e0';
                ctx.stroke();
            }
            
            // 绘制轴线
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = '#e0e0e0';
                ctx.stroke();
            }
            
            // 绘制整体数据多边形
            ctx.beginPath();
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
                const value = values[i] / 3; // 归一化到0-1
                const x = centerX + Math.cos(angle) * radius * value;
                const y = centerY + Math.sin(angle) * radius * value;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            
            // 使用整体颜色填充
            ctx.fillStyle = overallFillColor;
            ctx.fill();
            
            // 使用整体颜色绘制边框
            ctx.strokeStyle = overallColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 绘制数据点并存储位置
            pointPositions.length = 0; // 清空数组
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
                const value = values[i] / 3;
                const x = centerX + Math.cos(angle) * radius * value;
                const y = centerY + Math.sin(angle) * radius * value;
                
                // 存储端点位置
                pointPositions.push({
                    x: x,
                    y: y,
                    label: labels[i],
                    score: values[i],
                    scoreKey: scoreKeys[i]
                });
                
                // 绘制数据点
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                
                // 使用整体颜色
                ctx.fillStyle = overallColor;
                ctx.fill();
                
                // 白色边框
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // 内部小圆点增强视觉效果
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
            }
            
            // 绘制标签
            ctx.font = '12px Arial';
            ctx.fillStyle = '#333';
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * (radius + 25);
                const y = centerY + Math.sin(angle) * (radius + 25);
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 调整标签位置避免重叠
                let adjustedY = y;
                if (i === 0) adjustedY -= 10; // 顶部
                else if (i === 3) adjustedY += 10; // 底部
                else if (i === 1 || i === 2) adjustedY -= 5; // 右上
                else if (i === 5 || i === 6) adjustedY += 5; // 左下
                
                ctx.fillText(labels[i], x, adjustedY);
            }
        };

        // 鼠标移动事件处理
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            let hoveredPoint = null;
            
            // 检查是否悬停在端点上
            for (const point of pointPositions) {
                const distance = Math.sqrt(
                    Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
                );
                
                if (distance <= 8) { // 8px 的悬停范围
                    hoveredPoint = point;
                    break;
                }
            }
            
            if (hoveredPoint) {
                // 显示提示框
                tooltip.style.display = 'block';
                
                // 设置内容
                tooltip.querySelector('.tooltip-title').textContent = hoveredPoint.label;
                const levelText = hoveredPoint.score === 1 ? 'Basic' : hoveredPoint.score === 2 ? 'Developing' : 'Proficiency';
                tooltip.querySelector('.tooltip-score').textContent = `${hoveredPoint.score}分 - ${levelText}`;
                
                // 设置提示框边框颜色为整体颜色
                tooltip.style.borderColor = overallColor;
                tooltip.style.borderWidth = '2px';
                tooltip.style.borderStyle = 'solid';
                
                // 使用相对于画布的坐标定位
                const canvasRect = canvas.getBoundingClientRect();
                const containerRect = canvas.parentElement.getBoundingClientRect();
                
                // 计算相对于容器的坐标
                let left = (e.clientX - containerRect.left) + 15;
                let top = (e.clientY - containerRect.top) - 30;
                
                // 边界检测（相对于容器）
                const tooltipWidth = 120; // 预估宽度
                const tooltipHeight = 40; // 预估高度
                
                if (left + tooltipWidth > containerRect.width) {
                    left = (e.clientX - containerRect.left) - tooltipWidth - 15;
                }
                
                if (left < 0) {
                    left = 5;
                }
                
                if (top < 0) {
                    top = (e.clientY - containerRect.top) + 15;
                }
                
                if (top + tooltipHeight > containerRect.height) {
                    top = containerRect.height - tooltipHeight - 5;
                }
                
                // 应用位置
                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
                
                canvas.style.cursor = 'pointer';
            } else {
                // 隐藏提示框
                tooltip.style.display = 'none';
                canvas.style.cursor = 'default';
            }
        });

        // 鼠标离开画布时隐藏提示框
        canvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            canvas.style.cursor = 'default';
        });

        // 初始绘制
        drawChart();
    }

    /**
     * Display Dr.Scratch score summary
     * @param {Object} scores - Dr.Scratch scores object
     */
    displayDrScratchScoreSummary(scores) {
        const totalScoreElement = document.getElementById('totalScore');
        const scoreLevelElement = document.getElementById('scoreLevel');
        
        // 计算总分
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        totalScoreElement.textContent = totalScore;
        
        // 确定等级
        let level = '';
        if (totalScore <= 7) {
            level = '初级水平 (Basic Level)';
        } else if (totalScore <= 14) {
            level = '发展中水平 (Developing Level)';
        } else {
            level = '熟练水平 (Proficiency Level)';
        }
        
        scoreLevelElement.textContent = `评估等级：${level}`;
    }

    /**
     * Calculate math and logic scores based on core math ability assessment
     * @returns {Object} Object containing math and logic scores
     */
    calculateMathLogicScores() {
        const targets = this.projectData.targets || [];
        
        // 统计各类积木块数量（模仿HTTB的核心数学能力评估）
        let operatorCount = 0;    // 运算复杂度
        let controlCount = 0;     // 逻辑深度
        let dataCount = 0;        // 数据量级

        targets.forEach(target => {
            const blocks = target.blocks || {};
            Object.values(blocks).forEach(block => {
                if (!block.opcode) return;
                
                // 统计运算类积木块（运算复杂度）
                if (block.opcode.startsWith('operator_')) {
                    operatorCount++;
                }
                
                // 统计控制类积木块（逻辑深度）
                if (block.opcode.startsWith('control_')) {
                    controlCount++;
                }
                
                // 统计数据类积木块（数据量级）
                if (block.opcode.startsWith('data_')) {
                    dataCount++;
                }
            });
        });

        const scores = {
            '运算复杂度': operatorCount,
            '逻辑深度': controlCount,
            '数据量级': dataCount
        };

        // 调试信息
        

        return scores;
    }

    /**
     * Display math and logic radar chart (模仿HTTB风格)
     * @param {Object} scores - Math and logic scores object
     */
    displayMathLogicRadarChart(scores) {
        const canvas = document.getElementById('mathLogicRadarChart');
        
        if (!canvas) {
            console.error('数学雷达图canvas元素未找到');
            return;
        }

        // 确保Canvas有正确的尺寸
        const container = canvas.parentElement;
        if (container) {
            const containerWidth = container.clientWidth;
            canvas.width = containerWidth;
            canvas.height = 350;
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = '350px';
            
            console.log('Canvas尺寸设置:', {
                width: canvas.width,
                height: canvas.height,
                containerWidth: containerWidth
            });
        }
        
        // 三个维度的标签和原始数据
        const labels = ['运算复杂度', '逻辑深度', '数据量级'];
        const originalValues = [
            scores['运算复杂度'],
            scores['逻辑深度'],
            scores['数据量级']
        ];

        // 数据标准化：将最大值作为1，其他按比例缩放
        const maxValue = Math.max(...originalValues, 1); // 避免除以0
        const normalizedValues = originalValues.map(value => value / maxValue);

        // 销毁旧图表
        if (this.mathLogicChartInstance) {
            this.mathLogicChartInstance.destroy();
            this.mathLogicChartInstance = null;
        }

        

        try {
            // 完善的Chart.js雷达图配置
            this.mathLogicChartInstance = new Chart(canvas, { 
                type: 'radar', 
                data: { 
                    labels: labels, 
                    datasets: [{
                        label: '相对强度', 
                        data: normalizedValues, 
                        borderColor: '#E65100', 
                        backgroundColor: 'rgba(230,81,0,0.2)',
                        borderWidth: 2,
                        pointBackgroundColor: '#E65100',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#E65100',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }] 
                }, 
                options: { 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#333'
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const originalValue = originalValues[index];
                                    const normalizedValue = normalizedValues[index];
                                    return [
                                        `原始数值: ${originalValue} 个积木`,
                                        `相对强度: ${(normalizedValue * 100).toFixed(1)}%`
                                    ];
                                }
                            }
                        }
                    },
                    scales: { 
                        r: { 
                            min: 0,
                            max: 1, // 标准化后的最大值为1
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            angleLines: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            pointLabels: {
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                color: '#333'
                            },
                            ticks: {
                                stepSize: 0.2, // 使用固定的步长
                                font: {
                                    size: 10
                                },
                                color: '#666',
                                backdropColor: 'transparent',
                                callback: function(value) {
                                    return (value * 100).toFixed(0) + '%'; // 显示为百分比
                                }
                            }
                        } 
                    },
                    elements: {
                        line: {
                            tension: 0  // 设置为0使边线变为直线
                        }
                    }
                } 
            });
            
            

        } catch (error) {
            console.error('雷达图创建失败:', error);
            
            // 如果Chart.js创建失败，显示错误信息
            const ctx = canvas.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillStyle = '#E65100';
            ctx.textAlign = 'center';
            ctx.fillText('图表加载失败', canvas.width / 2, canvas.height / 2);
        }
    }

    /**
     * Display math and logic score summary
     * @param {Object} scores - Math and logic scores object
     */
    displayMathLogicScoreSummary(scores) {
        const totalScoreElement = document.getElementById('mathTotalScore');
        const scoreLevelElement = document.getElementById('mathScoreLevel');
        
        // 计算总分（三个维度的积木块数量总和）
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        totalScoreElement.textContent = totalScore;
        
        // 确定等级（基于积木块数量）
        let level = '';
        if (totalScore <= 10) {
            level = '基础水平 (Basic Level)';
        } else if (totalScore <= 25) {
            level = '发展中水平 (Developing Level)';
        } else if (totalScore <= 50) {
            level = '熟练水平 (Proficiency Level)';
        } else {
            level = '精通水平 (Expert Level)';
        }
        
        scoreLevelElement.textContent = `评估等级：${level}`;
    }

    /**
     * Display code type distribution chart (模仿HTTB气泡图，显示单个opcode)
     */
    displayCodeTypeDistribution() {
        const canvas = document.getElementById('codeTypeDistributionChart');
        
        if (!canvas) {
            console.error('代码分布图canvas元素未找到');
            return;
        }

        // 确保Canvas有正确的尺寸
        const container = canvas.parentElement;
        if (container) {
            const containerWidth = container.clientWidth;
            canvas.width = containerWidth;
            canvas.height = 450;
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = '450px';
        }

        // 销毁旧图表
        if (this.distributionChartInstance) {
            this.distributionChartInstance.destroy();
            this.distributionChartInstance = null;
        }

        // 定义代码块分类和颜色（模仿HTTB）
        const CAT_COLORS = { 
            motion: '#4C97FF', looks: '#9966FF', sound: '#CF63CF', 
            event: '#FFBF00', control: '#FFAB19', sensing: '#5CB1D6', 
            operator: '#59C059', data: '#FF8C1A', procedures: '#FF6680', other: '#969696' 
        };

        // 内嵌中文翻译数据（避免CORS问题）
        const CHINESE_TRANSLATIONS = {
            "CONTROL_FOREVER": "重复执行",
            "CONTROL_REPEAT": "重复执行 %1 次",
            "CONTROL_IF": "如果 %1 那么",
            "CONTROL_ELSE": "否则",
            "CONTROL_STOP": "停止",
            "CONTROL_STOP_ALL": "全部脚本",
            "CONTROL_STOP_THIS": "这个脚本",
            "CONTROL_STOP_OTHER": "该角色的其他脚本",
            "CONTROL_WAIT": "等待 %1 秒",
            "CONTROL_WAITUNTIL": "等待 %1",
            "CONTROL_REPEATUNTIL": "重复执行直到 %1",
            "CONTROL_WHILE": "当 %1 重复执行",
            "CONTROL_FOREACH": "对于 %2 中的每个 %1",
            "CONTROL_STARTASCLONE": "当作为克隆体启动时",
            "CONTROL_CREATECLONEOF": "克隆 %1",
            "CONTROL_CREATECLONEOF_MYSELF": "自己",
            "CONTROL_DELETETHISCLONE": "删除此克隆体",
            "CONTROL_COUNTER": "计数器",
            "CONTROL_INCRCOUNTER": "计数器加一",
            "CONTROL_CLEARCOUNTER": "计数器归零",
            "CONTROL_ALLATONCE": "所有脚本",
            "DATA_SETVARIABLETO": "将 %1 设为 %2",
            "DATA_CHANGEVARIABLEBY": "将 %1 增加 %2",
            "DATA_SHOWVARIABLE": "显示变量 %1",
            "DATA_HIDEVARIABLE": "隐藏变量 %1",
            "DATA_ADDTOLIST": "将 %1 加入 %2",
            "DATA_DELETEOFLIST": "删除 %2 的第 %1 项",
            "DATA_DELETEALLOFLIST": "删除 %1 的全部项目",
            "DATA_INSERTATLIST": "在 %3 的第 %2 项前插入 %1",
            "DATA_REPLACEITEMOFLIST": "将 %2 的第 %1 项替换为 %3",
            "DATA_ITEMOFLIST": "%2 的第 %1 项",
            "DATA_ITEMNUMOFLIST": "%2 中第一个 %1 的编号",
            "DATA_LENGTHOFLIST": "%1 的项目数",
            "DATA_LISTCONTAINSITEM": "%1 包含 %2 ?",
            "DATA_SHOWLIST": "显示列表 %1",
            "DATA_HIDELIST": "隐藏列表 %1",
            "DATA_INDEX_ALL": "全部",
            "DATA_INDEX_LAST": "末尾",
            "DATA_INDEX_RANDOM": "随机",
            "EVENT_WHENFLAGCLICKED": "当 %1 被点击",
            "EVENT_WHENTHISSPRITECLICKED": "当角色被点击",
            "EVENT_WHENSTAGECLICKED": "当舞台被点击",
            "EVENT_WHENTOUCHINGOBJECT": "当该角色碰到 %1",
            "EVENT_WHENBROADCASTRECEIVED": "当接收到 %1",
            "EVENT_WHENBACKDROPSWITCHESTO": "当背景换成 %1",
            "EVENT_WHENGREATERTHAN": "当 %1 > %2",
            "EVENT_WHENGREATERTHAN_TIMER": "计时器",
            "EVENT_WHENGREATERTHAN_LOUDNESS": "响度",
            "EVENT_BROADCAST": "广播 %1",
            "EVENT_BROADCASTANDWAIT": "广播 %1 并等待",
            "EVENT_WHENKEYPRESSED": "当按下 %1 键",
            "EVENT_WHENKEYPRESSED_SPACE": "空格",
            "EVENT_WHENKEYPRESSED_LEFT": "←",
            "EVENT_WHENKEYPRESSED_RIGHT": "→",
            "EVENT_WHENKEYPRESSED_DOWN": "↓",
            "EVENT_WHENKEYPRESSED_UP": "↑",
            "EVENT_WHENKEYPRESSED_ANY": "任意",
            "LOOKS_SAYFORSECS": "说 %1 %2 秒",
            "LOOKS_SAY": "说 %1",
            "LOOKS_HELLO": "你好！",
            "LOOKS_THINKFORSECS": "思考 %1 %2 秒",
            "LOOKS_THINK": "思考 %1",
            "LOOKS_HMM": "嗯……",
            "LOOKS_SHOW": "显示",
            "LOOKS_HIDE": "隐藏",
            "LOOKS_HIDEALLSPRITES": "隐藏所有角色",
            "LOOKS_EFFECT_COLOR": "颜色",
            "LOOKS_EFFECT_FISHEYE": "鱼眼",
            "LOOKS_EFFECT_WHIRL": "漩涡",
            "LOOKS_EFFECT_PIXELATE": "像素化",
            "LOOKS_EFFECT_MOSAIC": "马赛克",
            "LOOKS_EFFECT_BRIGHTNESS": "亮度",
            "LOOKS_EFFECT_GHOST": "虚像",
            "LOOKS_CHANGEEFFECTBY": "将 %1 特效增加 %2",
            "LOOKS_SETEFFECTTO": "将 %1 特效设定为 %2",
            "LOOKS_CLEARGRAPHICEFFECTS": "清除图形特效",
            "LOOKS_CHANGESIZEBY": "将大小增加 %1",
            "LOOKS_SETSIZETO": "将大小设为 %1",
            "LOOKS_SIZE": "大小",
            "LOOKS_CHANGESTRETCHBY": "伸缩%1",
            "LOOKS_SETSTRETCHTO": "设置伸缩为%1 %",
            "LOOKS_SWITCHCOSTUMETO": "换成 %1 造型",
            "LOOKS_NEXTCOSTUME": "下一个造型",
            "LOOKS_SWITCHBACKDROPTO": "换成 %1 背景",
            "LOOKS_GOTOFRONTBACK": "移到最 %1 ",
            "LOOKS_GOTOFRONTBACK_FRONT": "前面",
            "LOOKS_GOTOFRONTBACK_BACK": "后面",
            "LOOKS_GOFORWARDBACKWARDLAYERS": "%1 %2 层",
            "LOOKS_GOFORWARDBACKWARDLAYERS_FORWARD": "前移",
            "LOOKS_GOFORWARDBACKWARDLAYERS_BACKWARD": "后移",
            "LOOKS_BACKDROPNUMBERNAME": "背景 %1",
            "LOOKS_COSTUMENUMBERNAME": "造型 %1",
            "LOOKS_NUMBERNAME_NUMBER": "编号",
            "LOOKS_NUMBERNAME_NAME": "名称",
            "LOOKS_SWITCHBACKDROPTOANDWAIT": "换成 %1 背景并等待",
            "LOOKS_NEXTBACKDROP_BLOCK": "下一个背景",
            "LOOKS_NEXTBACKDROP": "下一个背景",
            "LOOKS_PREVIOUSBACKDROP": "上一个背景",
            "LOOKS_RANDOMBACKDROP": "随机背景",
            "MOTION_MOVESTEPS": "移动 %1 步",
            "MOTION_TURNLEFT": "左转 %1 %2 度",
            "MOTION_TURNRIGHT": "右转 %1 %2 度",
            "MOTION_POINTINDIRECTION": "面向 %1 方向",
            "MOTION_POINTTOWARDS": "面向 %1",
            "MOTION_POINTTOWARDS_POINTER": "鼠标指针",
            "MOTION_POINTTOWARDS_RANDOM": "随机方向",
            "MOTION_GOTO": "移到 %1",
            "MOTION_GOTO_POINTER": "鼠标指针",
            "MOTION_GOTO_RANDOM": "随机位置",
            "MOTION_GOTOXY": "移到 x: %1 y: %2",
            "MOTION_GLIDESECSTOXY": "在 %1 秒内滑行到 x: %2 y: %3",
            "MOTION_GLIDETO": "在 %1 秒内滑行到 %2",
            "MOTION_GLIDETO_POINTER": "鼠标指针",
            "MOTION_GLIDETO_RANDOM": "随机位置",
            "MOTION_CHANGEXBY": "将x坐标增加 %1",
            "MOTION_SETX": "将x坐标设为 %1",
            "MOTION_CHANGEYBY": "将y坐标增加 %1",
            "MOTION_SETY": "将y坐标设为 %1",
            "MOTION_IFONEDGEBOUNCE": "碰到边缘就反弹",
            "MOTION_SETROTATIONSTYLE": "将旋转方式设为 %1",
            "MOTION_SETROTATIONSTYLE_LEFTRIGHT": "左右翻转",
            "MOTION_SETROTATIONSTYLE_DONTROTATE": "不可旋转",
            "MOTION_SETROTATIONSTYLE_ALLAROUND": "任意旋转",
            "MOTION_XPOSITION": "x 坐标",
            "MOTION_YPOSITION": "y 坐标",
            "MOTION_DIRECTION": "方向",
            "MOTION_SCROLLRIGHT": "向右滚动 %1",
            "MOTION_SCROLLUP": "向上滚动 %1",
            "MOTION_ALIGNSCENE": "和场景 %1 对齐",
            "MOTION_ALIGNSCENE_BOTTOMLEFT": "左下角",
            "MOTION_ALIGNSCENE_BOTTOMRIGHT": "右下角",
            "MOTION_ALIGNSCENE_MIDDLE": "中间",
            "MOTION_ALIGNSCENE_TOPLEFT": "左上角",
            "MOTION_ALIGNSCENE_TOPRIGHT": "右上角",
            "MOTION_XSCROLL": "x滚动位置",
            "MOTION_YSCROLL": "y滚动位置",
            "MOTION_STAGE_SELECTED": "选中了舞台：不可使用运动类积木",
            "OPERATORS_ADD": "%1 + %2",
            "OPERATORS_SUBTRACT": "%1 - %2",
            "OPERATORS_MULTIPLY": "%1 * %2",
            "OPERATORS_DIVIDE": "%1 / %2",
            "OPERATORS_RANDOM": "在 %1 和 %2 之间取随机数",
            "OPERATORS_GT": "%1 > %2",
            "OPERATORS_LT": "%1 < %2",
            "OPERATORS_EQUALS": "%1 = %2",
            "OPERATORS_AND": "%1 与 %2",
            "OPERATORS_OR": "%1 或 %2",
            "OPERATORS_NOT": "%1 不成立",
            "OPERATORS_JOIN": "连接 %1 和 %2",
            "OPERATORS_JOIN_APPLE": "苹果",
            "OPERATORS_JOIN_BANANA": "香蕉",
            "OPERATORS_LETTEROF": "%2 的第 %1 个字符",
            "OPERATORS_LETTEROF_APPLE": "果",
            "OPERATORS_LENGTH": "%1 的字符数",
            "OPERATORS_CONTAINS": "%1 包含 %2 ?",
            "OPERATORS_MOD": "%1 除以 %2 的余数",
            "OPERATORS_ROUND": "四舍五入 %1",
            "OPERATORS_MATHOP": "%1 %2",
            "OPERATORS_MATHOP_ABS": "绝对值",
            "OPERATORS_MATHOP_FLOOR": "向下取整",
            "OPERATORS_MATHOP_CEILING": "向上取整",
            "OPERATORS_MATHOP_SQRT": "平方根",
            "OPERATORS_MATHOP_SIN": "sin",
            "OPERATORS_MATHOP_COS": "cos",
            "OPERATORS_MATHOP_TAN": "tan",
            "OPERATORS_MATHOP_ASIN": "asin",
            "OPERATORS_MATHOP_ACOS": "acos",
            "OPERATORS_MATHOP_ATAN": "atan",
            "OPERATORS_MATHOP_LN": "ln",
            "OPERATORS_MATHOP_LOG": "log",
            "OPERATORS_MATHOP_EEXP": "e ^",
            "OPERATORS_MATHOP_10EXP": "10 ^",
            "PROCEDURES_DEFINITION": "定义 %1",
            "SENSING_TOUCHINGOBJECT": "碰到 %1 ?",
            "SENSING_TOUCHINGOBJECT_POINTER": "鼠标指针",
            "SENSING_TOUCHINGOBJECT_EDGE": "舞台边缘",
            "SENSING_TOUCHINGCOLOR": "碰到颜色 %1 ?",
            "SENSING_COLORISTOUCHINGCOLOR": "颜色 %1 碰到 %2 ?",
            "SENSING_DISTANCETO": "到 %1 的距离",
            "SENSING_DISTANCETO_POINTER": "鼠标指针",
            "SENSING_ASKANDWAIT": "询问 %1 并等待",
            "SENSING_ASK_TEXT": "你叫什么名字？",
            "SENSING_ANSWER": "回答",
            "SENSING_KEYPRESSED": "按下 %1 键?",
            "SENSING_MOUSEDOWN": "按下鼠标?",
            "SENSING_MOUSEX": "鼠标的x坐标",
            "SENSING_MOUSEY": "鼠标的y坐标",
            "SENSING_SETDRAGMODE": "将拖动模式设为 %1",
            "SENSING_SETDRAGMODE_DRAGGABLE": "可拖动",
            "SENSING_SETDRAGMODE_NOTDRAGGABLE": "不可拖动",
            "SENSING_LOUDNESS": "响度",
            "SENSING_LOUD": "响声？",
            "SENSING_TIMER": "计时器",
            "SENSING_RESETTIMER": "计时器归零",
            "SENSING_OF": "%2 的 %1",
            "SENSING_OF_XPOSITION": "x 坐标",
            "SENSING_OF_YPOSITION": "y 坐标",
            "SENSING_OF_DIRECTION": "方向",
            "SENSING_OF_COSTUMENUMBER": "造型编号",
            "SENSING_OF_COSTUMENAME": "造型名称",
            "SENSING_OF_SIZE": "大小",
            "SENSING_OF_VOLUME": "音量",
            "SENSING_OF_BACKDROPNUMBER": "背景编号",
            "SENSING_OF_BACKDROPNAME": "背景名称",
            "SENSING_OF_STAGE": "舞台",
            "SENSING_CURRENT": "当前时间的 %1",
            "SENSING_CURRENT_YEAR": "年",
            "SENSING_CURRENT_MONTH": "月",
            "SENSING_CURRENT_DATE": "日",
            "SENSING_CURRENT_DAYOFWEEK": "星期",
            "SENSING_CURRENT_HOUR": "时",
            "SENSING_CURRENT_MINUTE": "分",
            "SENSING_CURRENT_SECOND": "秒",
            "SENSING_DAYSSINCE2000": "2000年至今的天数",
            "SENSING_USERNAME": "用户名",
            "SENSING_USERID": "用户id",
            "SOUND_PLAY": "播放声音 %1",
            "SOUND_PLAYUNTILDONE": "播放声音 %1 等待播完",
            "SOUND_STOPALLSOUNDS": "停止所有声音",
            "SOUND_SETEFFECTO": "将 %1 音效设为 %2",
            "SOUND_CHANGEEFFECTBY": "将 %1 音效增加 %2",
            "SOUND_CLEAREFFECTS": "清除音效",
            "SOUND_EFFECTS_PITCH": "音调",
            "SOUND_EFFECTS_PAN": "左右平衡",
            "SOUND_CHANGEVOLUMEBY": "将音量增加 %1",
            "SOUND_SETVOLUMETO": "将音量设为 %1%",
            "SOUND_VOLUME": "音量",
            "SOUND_RECORD": "录制…",
            "CATEGORY_MOTION": "运动",
            "CATEGORY_LOOKS": "外观",
            "CATEGORY_SOUND": "声音",
            "CATEGORY_EVENTS": "事件",
            "CATEGORY_CONTROL": "控制",
            "CATEGORY_SENSING": "侦测",
            "CATEGORY_OPERATORS": "运算",
            "CATEGORY_VARIABLES": "变量",
            "CATEGORY_MYBLOCKS": "自制积木",
            "DUPLICATE": "复制",
            "DELETE": "删除",
            "ADD_COMMENT": "添加注释",
            "REMOVE_COMMENT": "删除注释",
            "DELETE_BLOCK": "删除",
            "DELETE_X_BLOCKS": "删除 %1 积木",
            "DELETE_ALL_BLOCKS": "删除全部 %1 积木？",
            "CLEAN_UP": "整理积木",
            "HELP": "帮助",
            "UNDO": "撤销",
            "REDO": "重做",
            "EDIT_PROCEDURE": "编辑",
            "SHOW_PROCEDURE_DEFINITION": "查看定义",
            "WORKSPACE_COMMENT_DEFAULT_TEXT": "说些什么……",
            "COLOUR_HUE_LABEL": "颜色",
            "COLOUR_SATURATION_LABEL": "饱和度",
            "COLOUR_BRIGHTNESS_LABEL": "亮度",
            "CHANGE_VALUE_TITLE": "更改变量：",
            "RENAME_VARIABLE": "修改变量名",
            "RENAME_VARIABLE_TITLE": "将所有的「%1」变量名改为：",
            "RENAME_VARIABLE_MODAL_TITLE": "修改变量名",
            "NEW_VARIABLE": "建立一个变量",
            "NEW_VARIABLE_TITLE": "新变量名：",
            "VARIABLE_MODAL_TITLE": "新建变量",
            "VARIABLE_ALREADY_EXISTS": "已经存在名为「%1」的变量。",
            "VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE": "已经存在一个名为「%1」的变量，其类型为「%2」。",
            "DELETE_VARIABLE_CONFIRMATION": "删除%1处「%2」变量吗？",
            "CANNOT_DELETE_VARIABLE_PROCEDURE": "无法删除变量「%1」，因为函数「%2」的定义中用到了它",
            "DELETE_VARIABLE": "删除变量「%1」",
            "NEW_PROCEDURE": "制作新的积木",
            "PROCEDURE_ALREADY_EXISTS": "已经存在名为「%1」的程序。",
            "PROCEDURE_DEFAULT_NAME": "积木名称",
            "PROCEDURE_USED": "在删除一个积木定义前，请先把该积木从所有使用的地方删除。",
            "NEW_LIST": "建立一个列表",
            "NEW_LIST_TITLE": "新的列表名：",
            "LIST_MODAL_TITLE": "新建列表",
            "LIST_ALREADY_EXISTS": "名为 「%1」 的列表已存在。",
            "RENAME_LIST_TITLE": "将所有的「%1」列表改名为：",
            "RENAME_LIST_MODAL_TITLE": "修改列表名",
            "DEFAULT_LIST_ITEM": "东西",
            "DELETE_LIST": "删除「%1」列表",
            "RENAME_LIST": "修改列表名",
            "NEW_BROADCAST_MESSAGE": "新消息",
            "NEW_BROADCAST_MESSAGE_TITLE": "新消息的名称：",
            "BROADCAST_MODAL_TITLE": "新消息",
            "DEFAULT_BROADCAST_MESSAGE_NAME": "消息1"
    };

        // 统计每个单独的opcode数量
        const opcodeCounts = {};
        const targets = this.projectData.targets || [];
        
        targets.forEach(target => {
            const blocks = target.blocks || {};
            Object.values(blocks).forEach(block => {
                if (block.opcode) {
                    opcodeCounts[block.opcode] = (opcodeCounts[block.opcode] || 0) + 1;
                }
            });
        });

        // 创建散点数据（每个opcode一个气泡）

                const scatterPoints = Object.entries(opcodeCounts).map(([opcode, count]) => {

                    // 获取类别

                    const category = this.getBlockCategoryForDistribution(opcode);

                    

                    let x = 0, y = 0;

                    

                    // X轴分布：基础 → 高级

                    if (category === 'motion' || category === 'event' || category === 'looks') {

                        x = -1.8; // 基础

                    } else if (category === 'control' || category === 'sensing' || category === 'operator') {

                        x = 0.2; // 中级

                    } else if (category === 'data' || category === 'procedures') {

                        x = 1.8; // 高级

                    } else {

                        x = 0.2; // 其他归类为中级

                    }

                    

                    // Y轴分布：表现层 → 算法层

                    if (category === 'looks' || category === 'sound' || category === 'motion') {

                        y = 1.2; // 表现层

                    } else if (category === 'event' || category === 'sensing') {

                        y = 0; // 交互层

                    } else {

                        y = -1.2; // 算法层

                    }

                    

                    // 添加随机偏移，避免重叠

                    x += (Math.random() - 0.5) * 0.7;

                    y += (Math.random() - 0.5) * 0.7;
            
            // 获取颜色
            const color = CAT_COLORS[category] || CAT_COLORS.other;
            
            // 计算气泡大小（基于使用频次）
            const radius = Math.min(20, 4 + Math.sqrt(count) * 2);
            
            // 获取中文翻译 - 修复大小写转换
            const translationKey = opcode.toUpperCase();
            const chineseName = CHINESE_TRANSLATIONS[translationKey] || opcode;
            
            const pointData = { 
                x, 
                y, 
                r: radius, 
                opcode: opcode,
                chineseName: chineseName,
                count: count,
                color: color,
                category: category
            };
            
            // 验证创建的数据

            
            return pointData;
        });



        try {
            // 创建气泡图（完全模仿HTTB）
            this.distributionChartInstance = new Chart(canvas, { 
                type: 'bubble', 
                data: { 
                    datasets: [{
                        data: scatterPoints,
                        backgroundColor: scatterPoints.map(p => p.color + '80'), // 添加透明度
                        borderColor: scatterPoints.map(p => p.color),
                        borderWidth: 1
                    }]
                }, 
                options: { 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // 不显示图例
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                title: function(context) {
                                    return ''; // 返回空字符串，隐藏Title
                                },
                                label: function(context) {
                                    const point = context.raw;
                                    
                                    if (!point) {
                                        return ['数据加载中...'];
                                    }
                                    
                                    return [
                                        `中文名称: ${point.chineseName || point.opcode || '未知'}`,
                                        `Opcode: ${point.opcode || '未知'}`,
                                        `使用次数: ${point.count || 0} 次`,
                                        `类别: ${point.category || '未知'}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: -3,
                            max: 3,
                            title: {
                                display: true,
                                text: '基础 ← 中级 → 高级',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                display: false // 不显示刻度值
                            }
                        },
                        y: {
                            min: -2,
                            max: 2,
                            title: {
                                display: true,
                                text: '表现层 ← 交互层 → 算法层',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                display: false // 不显示刻度值
                            }
                        }
                    }
                }
            });
            


        } catch (error) {
            console.error('代码分布气泡图创建失败:', error);
            
            // 如果Chart.js创建失败，显示错误信息
            const ctx = canvas.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillStyle = '#E65100';
            ctx.textAlign = 'center';
            ctx.fillText('图表加载失败', canvas.width / 2, canvas.height / 2);
        }
    }

    /**
     * Get block category for distribution chart
     * @param {string} opcode - Block opcode
     * @returns {string|null} Category name
     */
    getBlockCategoryForDistribution(opcode) {
        if (opcode.startsWith('motion_')) return 'motion';
        if (opcode.startsWith('looks_')) return 'looks';
        if (opcode.startsWith('sound_')) return 'sound';
        if (opcode.startsWith('event_')) return 'event';
        if (opcode.startsWith('control_')) return 'control';
        if (opcode.startsWith('sensing_')) return 'sensing';
        if (opcode.startsWith('operator_')) return 'operator';
        if (opcode.startsWith('data_')) return 'data';
        if (opcode.startsWith('pen_')) return 'pen';
        if (opcode.startsWith('video_')) return 'video';
        if (opcode.startsWith('procedures_')) return 'procedures';
        return null;
    }

    /**
     * Setup scoring criteria button with proper event handling
     */
    setupScoringCriteriaButton() {
        // Simple and reliable button setup
        const setupButton = () => {
            const button = document.getElementById('showScoringCriteria');
            if (button) {
                // Remove any existing listeners by cloning
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Add fresh event listener
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showScoringDialog();
                });
                
                
                return true;
            }
            return false;
        };

        // Try immediate setup
        if (!setupButton()) {
            // Try after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupButton);
            } else {
                // Try with a small delay
                setTimeout(setupButton, 100);
            }
        }
    }

    /**
     * Show scoring criteria dialog
     */
    showScoringDialog() {
        
        
        const overlay = document.getElementById('scoringDialogOverlay');
        if (!overlay) {
            console.error('Dialog overlay not found');
            return;
        }

        // Show overlay
        overlay.style.display = 'flex';
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Setup close handlers
        this.setupScoringDialogCloseHandlers();
        
        
    }

    /**
     * Setup close handlers for scoring dialog
     */
    setupScoringDialogCloseHandlers() {
        const overlay = document.getElementById('scoringDialogOverlay');
        const dialog = document.getElementById('scoringDialog');
        const closeBtn = document.getElementById('scoringDialogClose');
        const closeBtnFooter = document.querySelector('.scoring-dialog-close-btn');

        // Function to close dialog
        const closeDialog = () => {
            if (overlay) {
                overlay.style.display = 'none';
            }
            document.body.style.overflow = '';
            
            // Remove event listeners
            document.removeEventListener('keydown', escHandler);
            window.removeEventListener('scroll', scrollHandler);
            
            
        };

        // Close button handlers
        if (closeBtn) {
            closeBtn.onclick = closeDialog;
        }
        if (closeBtnFooter) {
            closeBtnFooter.onclick = closeDialog;
        }

        // Overlay click handler
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    closeDialog();
                }
            };
        }

        // ESC key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeDialog();
            }
        };
        document.addEventListener('keydown', escHandler);

        // Scroll handler
        const scrollHandler = () => {
            closeDialog();
        };
        window.addEventListener('scroll', scrollHandler);
    }

    /**
     * Display detailed block types used for each Dr.Scratch dimension
     * This shows users exactly which blocks contribute to their scores
     */
    displayDrScratchBlockDetails() {
        const targets = this.projectData.targets || [];
        const blockTypes = new Set();
        const eventBlockTypes = new Set();
        const controlBlockTypes = new Set();
        const operatorBlockTypes = new Set();
        const dataBlockTypes = new Set();
        const sensingBlockTypes = new Set();
        const motionBlockTypes = new Set();
        const looksBlockTypes = new Set();
        const soundBlockTypes = new Set();
        const procedureBlockTypes = new Set();
        const variableNames = new Set();
        const listNames = new Set();

        // 收集所有积木块种类
        targets.forEach(target => {
            const blocks = target.blocks || {};
            Object.values(blocks).forEach(block => {
                if (block.opcode) {
                    blockTypes.add(block.opcode);
                    
                    // 分类收集积木块种类
                    if (block.opcode.startsWith('event_')) {
                        eventBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('control_')) {
                        controlBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('operator_')) {
                        operatorBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('data_')) {
                        dataBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('sensing_')) {
                        sensingBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('motion_')) {
                        motionBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('looks_')) {
                        looksBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('sound_')) {
                        soundBlockTypes.add(block.opcode);
                    }
                    if (block.opcode.startsWith('procedures_')) {
                        procedureBlockTypes.add(block.opcode);
                    }
                }
            });

            // 收集变量和列表名称
            if (target.variables) {
                Object.values(target.variables).forEach(variable => {
                    if (Array.isArray(variable) && variable.length > 0) {
                        variableNames.add(variable[0]);
                    }
                });
            }
            if (target.lists) {
                Object.values(target.lists).forEach(list => {
                    if (Array.isArray(list) && list.length > 0) {
                        listNames.add(list[0]);
                    }
                });
            }
        });

        // 创建积木块类型详情HTML
        const createBlockDetailHTML = (title, blockTypes, blockNames = {}) => {
            const blockList = Array.from(blockTypes).map(opcode => {
                const name = blockNames[opcode] || this.getBlockDisplayName(opcode);
                return `<li><code>${opcode}</code> - ${name}</li>`;
            }).join('');
            
            return `
                <div class="block-detail-section">
                    <h4>${title}</h4>
                    <ul class="block-list">
                        ${blockList || '<li>未使用相关积木块</li>'}
                    </ul>
                </div>
            `;
        };

        // 积木块名称映射
        const blockNames = {
            'event_whenflagclicked': '当绿旗被点击',
            'event_whenkeypressed': '当按下按键',
            'event_whenthisspriteclicked': '当这个精灵被点击',
            'event_whenbroadcastreceived': '当接收到消息',
            'event_whenbackdropswitchesto': '当背景切换到',
            'event_whengreaterthan': '当 >',
            'event_broadcast': '广播消息',
            'event_broadcastandwait': '广播并等待',
            'control_if': '如果...那么',
            'control_if_else': '如果...那么...否则',
            'control_wait': '等待 秒',
            'control_wait_until': '等待直到',
            'control_repeat': '重复 次',
            'control_forever': '重复执行',
            'control_repeat_until': '重复直到',
            'control_stop_all': '停止全部脚本',
            'control_stop_this_script': '停止这个脚本',
            'control_stop_other_scripts_in_sprite': '停止这个精灵的其他脚本',
            'control_create_clone_of': '创建 克隆',
            'control_start_as_clone': '当作为克隆体启动时',
            'control_delete_this_clone': '删除此克隆体',
            'operator_add': '+',
            'operator_subtract': '-',
            'operator_multiply': '×',
            'operator_divide': '÷',
            'operator_random': '随机数',
            'operator_mod': '取余',
            'operator_round': '四舍五入',
            'operator_mathop': '数学函数',
            'operator_equals': '=',
            'operator_gt': '>',
            'operator_lt': '<',
            'operator_and': '与',
            'operator_or': '或',
            'operator_not': '不',
            'operator_join': '连接字符串',
            'operator_letter_of': '第 个字符',
            'operator_length': '字符串长度',
            'operator_contains': '包含',
            'sensing_mousedown': '鼠标是否按下',
            'sensing_mousex': '鼠标的x坐标',
            'sensing_mousey': '鼠标的y坐标',
            'sensing_askandwait': '询问并等待',
            'sensing_answer': '回答',
            'sensing_touchingobject': '碰到',
            'sensing_touchingcolor': '碰到颜色',
            'sensing_coloristouchingcolor': '颜色碰到颜色',
            'sensing_distanceto': '到 的距离',
            'sensing_timer': '计时器',
            'sensing_resettimer': '重置计时器',
            'sensing_loudness': '响度',
            'sensing_loud': '响度是否 >',
            'procedures_definition': '定义积木块',
            'procedures_call': '调用积木块'
        };

        // 创建详情HTML
        const detailsHTML = `
            <div class="dr-scratch-details">
                ${createBlockDetailHTML('事件积木块', eventBlockTypes, blockNames)}
                ${createBlockDetailHTML('控制积木块', controlBlockTypes, blockNames)}
                ${createBlockDetailHTML('运算积木块', operatorBlockTypes, blockNames)}
                ${createBlockDetailHTML('数据积木块', dataBlockTypes, blockNames)}
                ${createBlockDetailHTML('侦测积木块', sensingBlockTypes, blockNames)}
                ${createBlockDetailHTML('运动积木块', motionBlockTypes, blockNames)}
                ${createBlockDetailHTML('外观积木块', looksBlockTypes, blockNames)}
                ${createBlockDetailHTML('声音积木块', soundBlockTypes, blockNames)}
                ${createBlockDetailHTML('自定义积木块', procedureBlockTypes, blockNames)}
                ${variableNames.size > 0 ? `<div class="block-detail-section"><h4>使用的变量</h4><ul>${Array.from(variableNames).map(v => `<li>${v}</li>`).join('')}</ul></div>` : ''}
                ${listNames.size > 0 ? `<div class="block-detail-section"><h4>使用的列表</h4><ul>${Array.from(listNames).map(l => `<li>${l}</li>`).join('')}</ul></div>` : ''}
            </div>
        `;

        // 在Dr.Scratch评分卡片中添加详情区域
        const drScratchCard = document.querySelector('[class*="mdui-card"]:has(#drScratchRadarChart)');
        if (drScratchCard) {
            // 移除旧的详情区域（如果存在）
            const oldDetails = drScratchCard.querySelector('.block-details-container');
            if (oldDetails) {
                oldDetails.remove();
            }

            // 创建新的详情区域
            const detailsContainer = document.createElement('div');
            detailsContainer.className = 'block-details-container mdui-m-t-3';
            detailsContainer.innerHTML = `
                <div class="mdui-collapse mdui-collapse-item" id="block-details-collapse">
                    <div class="mdui-collapse-item-header">
                        <i class="mdui-icon material-icons">code</i>
                        <div class="mdui-collapse-item-title">查看使用的积木块种类</div>
                        <i class="mdui-icon material-icons mdui-collapse-item-arrow">keyboard_arrow_down</i>
                    </div>
                    <div class="mdui-collapse-item-body mdui-hidden">
                        ${detailsHTML}
                    </div>
                </div>
            `;

            drScratchCard.appendChild(detailsContainer);

            // 手动设置折叠功能
            const collapseHeader = detailsContainer.querySelector('.mdui-collapse-item-header');
            const collapseBody = detailsContainer.querySelector('.mdui-collapse-item-body');
            const collapseArrow = detailsContainer.querySelector('.mdui-collapse-item-arrow');
            
            collapseHeader.addEventListener('click', function() {
                if (collapseBody.classList.contains('mdui-hidden')) {
                    // 展开内容
                    collapseBody.classList.remove('mdui-hidden');
                    collapseArrow.style.transform = 'rotate(180deg)';
                } else {
                    // 折叠内容
                    collapseBody.classList.add('mdui-hidden');
                    collapseArrow.style.transform = 'rotate(0deg)';
                }
            });

            // 确保默认是折叠状态
            collapseBody.classList.add('mdui-hidden');
        }
    }

    /**
     * Get display name for block opcode
     * @param {string} opcode - Block opcode
     * @returns {string} Display name
     */
    getBlockDisplayName(opcode) {
        const categoryNames = {
            'motion': '运动',
            'looks': '外观',
            'sound': '声音',
            'event': '事件',
            'control': '控制',
            'sensing': '侦测',
            'operator': '运算',
            'data': '数据',
            'pen': '画笔',
            'video': '视频',
            'procedures': '自定义函数',
            'argument': '自定义参数'
        };

        // 尝试从opcode中提取类别
        for (const [key, name] of Object.entries(categoryNames)) {
            if (opcode.startsWith(key)) {
                return `${name} - ${opcode}`;
            }
        }

        return opcode; // 如果无法识别，返回原始opcode
    }

    /**
     * Setup theme switch button functionality
     */
    setupThemeSwitchButton() {
        const themeSwitchBtn = document.getElementById('themeSwitchBtn');
        if (themeSwitchBtn) {
            themeSwitchBtn.addEventListener('click', () => {
                this.openThemeDialog();
            });
        }

        // Load saved theme on startup
        this.loadSavedTheme();
    }

    /**
     * Open theme color selection dialog
     */
    openThemeDialog() {
        const overlay = document.getElementById('themeDialogOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            this.initializeThemeColors();
            this.setupThemeDialogEvents();
        }
    }

    /**
     * Close theme dialog
     */
    closeThemeDialog() {
        const overlay = document.getElementById('themeDialogOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Initialize theme color options
     */
    initializeThemeColors() {
        const themeColors = [
            { name: '天蓝', primary: '#66ccff', dark: '#4da6ff', light: '#99ddff' },
            { name: '深蓝', primary: '#667eea', dark: '#764ba2', light: '#8b9fee' },
            { name: '紫色', primary: '#a855f7', dark: '#9333ea', light: '#c084fc' },
            { name: '粉色', primary: '#ec4899', dark: '#db2777', light: '#f472b6' },
            { name: '红色', primary: '#ef4444', dark: '#dc2626', light: '#f87171' },
            { name: '橙色', primary: '#f97316', dark: '#ea580c', light: '#fb923c' },
            { name: '黄色', primary: '#eab308', dark: '#ca8a04', light: '#facc15' },
            { name: '绿色', primary: '#22c55e', dark: '#16a34a', light: '#4ade80' },
            { name: '青色', primary: '#06b6d4', dark: '#0891b2', light: '#22d3ee' },
            { name: '灰色', primary: '#6b7280', dark: '#4b5563', light: '#9ca3af' },
            { name: '靛蓝', primary: '#6366f1', dark: '#4f46e5', light: '#818cf8' },
            { name: '玫瑰', primary: '#f43f5e', dark: '#e11d48', light: '#fb7185' }
        ];

        const colorGrid = document.getElementById('themeColorGrid');
        if (colorGrid) {
            colorGrid.innerHTML = '';

            themeColors.forEach((color, index) => {
                const colorItem = document.createElement('div');
                colorItem.className = 'theme-color-item';
                colorItem.dataset.theme = JSON.stringify(color);
                
                // Check if this is the current theme
                const currentTheme = this.getCurrentTheme();
                if (currentTheme && currentTheme.primary === color.primary) {
                    colorItem.classList.add('active');
                }

                colorItem.innerHTML = `
                    <div class="theme-color-preview" style="background: linear-gradient(135deg, ${color.primary} 0%, ${color.dark} 100%)"></div>
                    <div class="theme-color-name">${color.name}</div>
                `;

                colorItem.addEventListener('click', () => {
                    this.selectTheme(color);
                });

                colorGrid.appendChild(colorItem);
            });
        }
    }

    /**
     * Setup theme dialog event handlers
     */
    setupThemeDialogEvents() {
        const closeBtn = document.getElementById('themeDialogClose');
        const closeBtnFooter = document.querySelector('.theme-dialog-close-btn');
        const overlay = document.getElementById('themeDialogOverlay');

        // Close button handlers
        if (closeBtn) {
            closeBtn.onclick = () => this.closeThemeDialog();
        }
        if (closeBtnFooter) {
            closeBtnFooter.onclick = () => this.closeThemeDialog();
        }

        // Overlay click handler
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.closeThemeDialog();
                }
            };
        }

        // ESC key handler
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeThemeDialog();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Select and apply theme
     * @param {Object} theme - Theme color object
     */
    selectTheme(theme) {
        // Update CSS variables
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.primary);
        root.style.setProperty('--theme-primary-dark', theme.dark);
        root.style.setProperty('--theme-primary-light', theme.light);
        
        // Extract RGB values for CSS custom properties
        const rgb = this.hexToRgb(theme.primary);
        root.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

        // Update MDUI theme variables
        root.style.setProperty('--mdui-color-primary', theme.primary);
        root.style.setProperty('--mdui-color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        root.style.setProperty('--mdui-color-primary-light', theme.light);
        root.style.setProperty('--mdui-color-primary-dark', theme.dark);

        // Apply theme to all MDUI components
        this.applyThemeToMDUI(theme);

        // Update active state
        document.querySelectorAll('.theme-color-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-theme*="${theme.primary}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Save to localStorage
        this.saveTheme(theme);

        // Update body background
        document.body.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.dark} 100%)`;
    }

    /**
     * Apply theme to MDUI components
     * @param {Object} theme - Theme color object
     */
    applyThemeToMDUI(theme) {
        // Update top app bar
        const topAppBar = document.querySelector('.mdui-top-app-bar');
        if (topAppBar) {
            topAppBar.style.backgroundColor = theme.primary;
        }

        // Update all buttons with theme color
        document.querySelectorAll('.mdui-btn, .mdui-color-theme').forEach(btn => {
            btn.style.backgroundColor = theme.primary;
        });

        // Update cards
        document.querySelectorAll('.mdui-card').forEach(card => {
            card.style.borderLeftColor = theme.primary;
        });

        // Update stat items with proper contrast
        document.querySelectorAll('.stat-item').forEach(item => {
            item.style.background = `linear-gradient(135deg, ${this.hexToRgba(theme.primary, 0.9)} 0%, ${this.hexToRgba(theme.primary, 0.8)} 100%)`;
            item.style.color = 'white';
            
            // Ensure text elements have proper contrast
            const valueElement = item.querySelector('.stat-value');
            const labelElement = item.querySelector('.stat-label');
            if (valueElement) {
                valueElement.style.color = 'white';
                valueElement.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
            }
            if (labelElement) {
                labelElement.style.color = 'white';
                labelElement.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
            }
        });

        // Update spinner
        document.querySelectorAll('.mdui-spinner').forEach(spinner => {
            spinner.style.borderColor = theme.primary;
            spinner.style.borderTopColor = 'transparent';
        });

        // Update input focus states
        const style = document.createElement('style');
        style.textContent = `
            input:focus, textarea:focus {
                border-color: ${theme.primary} !important;
            }
            a {
                color: ${theme.primary} !important;
            }
        `;
        
        // Remove old theme style if exists
        const oldStyle = document.getElementById('dynamic-theme-style');
        if (oldStyle) {
            oldStyle.remove();
        }
        
        style.id = 'dynamic-theme-style';
        document.head.appendChild(style);
    }

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color code
     * @returns {Object} RGB object
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert hex color to RGBA
     * @param {string} hex - Hex color code
     * @param {number} alpha - Alpha value (0-1)
     * @returns {string} RGBA color string
     */
    hexToRgba(hex, alpha) {
        const rgb = this.hexToRgb(hex);
        return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : hex;
    }

    /**
     * Save theme to localStorage
     * @param {Object} theme - Theme color object
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('scratchAnalyzerTheme', JSON.stringify(theme));
        } catch (e) {
            console.warn('无法保存主题设置:', e);
        }
    }

    /**
     * Load saved theme from localStorage
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('scratchAnalyzerTheme');
            if (savedTheme) {
                const theme = JSON.parse(savedTheme);
                this.selectTheme(theme);
            }
        } catch (e) {
            console.warn('无法加载保存的主题:', e);
        }
    }

    /**
     * Get current theme
     * @returns {Object|null} Current theme object
     */
    getCurrentTheme() {
        try {
            const savedTheme = localStorage.getItem('scratchAnalyzerTheme');
            return savedTheme ? JSON.parse(savedTheme) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Analyze effective blocks and function definitions
     * @param {Object} analysis - The analysis object to store results
     */
    analyzeEffectiveBlocks(analysis) {
        const targets = this.projectData.targets || [];
        let effectiveBlocks = 0;
        let functionDefinitions = 0;

        // 遍历所有精灵和舞台
        targets.forEach(target => {
            const blocks = target.blocks || {};
            
            // 统计所有非shadow积木块作为有效积木
            Object.values(blocks).forEach(block => {
                if (typeof block !== 'object' || !block.opcode) return;
                
                // 有效积木 = 非shadow积木块
                if (!block.shadow) {
                    effectiveBlocks++;
                }
                
                // 统计函数定义
                if (block.opcode === 'procedures_definition') {
                    functionDefinitions++;
                }
            });
        });

        // 调试信息
        

        analysis.effectiveBlocks = effectiveBlocks;
        analysis.functionDefinitions = functionDefinitions;
    }

    /**
     * Analyze file sizes including project size, costumes size, and sounds size
     * @param {Object} analysis - The analysis object to store results
     * @param {File} file - The uploaded SB3 file
     */
    async analyzeFileSizes(analysis, file = null) {
        if (file) {
            // 如果有原始文件对象，直接获取文件大小
            analysis.projectSize = file.size;
        } else {
            // 如果没有原始文件对象，使用估算值（这种情况很少见）
            analysis.projectSize = 0;
        }

        // 分析压缩包中的文件大小
        try {
            // 重新解析项目文件以获取压缩包内容
            if (this.currentZipContent) {
                await this.analyzeZipContentSize(analysis);
            }
        } catch (error) {
            console.warn('无法分析压缩包内容:', error);
            analysis.costumesSize = 0;
            analysis.soundsSize = 0;
        }
    }

    /**
     * Analyze the content size within the ZIP file
     * @param {Object} analysis - The analysis object
     */
    async analyzeZipContentSize(analysis) {
        if (!this.currentZipContent) {
            return;
        }

        let costumesSize = 0;
        let soundsSize = 0;

        // 使用异步方式获取文件大小
        for (const [filename, file] of Object.entries(this.currentZipContent.files)) {
            if (!file.dir) { // 只处理文件，不处理目录
                let fileSize = 0;
                
                try {
                    // 异步获取文件内容
                    const content = await file.async('uint8array');
                    fileSize = content.length;
                } catch (error) {
                    fileSize = 0;
                }

                // 根据文件扩展名判断文件类型
                const extension = filename.toLowerCase().split('.').pop();
                
                if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(extension)) {
                    // 图像文件
                    costumesSize += fileSize;
                } else if (['wav', 'mp3', 'ogg', 'flac'].includes(extension)) {
                    // 音频文件
                    soundsSize += fileSize;
                }
            }
        }

        analysis.costumesSize = costumesSize;
        analysis.soundsSize = soundsSize;
    }

    /**
     * Format file size to human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
    }
}

// Initialize the analyzer immediately
window.scratchAnalyser = new ScratchAnalyser();