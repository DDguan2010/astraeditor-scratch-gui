import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { connect } from 'react-redux';
import { addTab, removeTab, activateTab, updateTabCode, setTabSaved } from '../../reducers/extension-editor-tabs';
import ExtensionEditor, { extensionEditorStorage, ExtensionEditorStorageContent, ExtensionEditorWizardPanel } from 'scratch-extension-editor';
import VMScratchBlocks from '../../lib/blocks';
import { manuallyTrustExtension } from '../../containers/tw-security-manager.jsx';
import styles from './extension-editor-tabs.css';

const messages = defineMessages({
    newTab: {
        defaultMessage: 'New Tab',
        description: 'Button to create a new tab',
        id: 'tw.extensionEditorTabs.newTab'
    },
    settings: {
        defaultMessage: 'Settings',
        description: 'Button to open settings',
        id: 'tw.extensionEditorTabs.settings'
    },
    welcomeTitle: {
        defaultMessage: 'Extension Editor',
        description: 'Title of the welcome screen',
        id: 'tw.extensionEditorTabs.welcomeTitle'
    },
    createNewExtension: {
        defaultMessage: 'Create New Extension',
        description: 'Button to create a new extension',
        id: 'tw.extensionEditorTabs.createNewExtension'
    },
    loadExistingExtension: {
        defaultMessage: 'Load Existing Extension',
        description: 'Button to load an existing extension',
        id: 'tw.extensionEditorTabs.loadExistingExtension'
    },
    noExtensionsFound: {
        defaultMessage: 'No saved extensions found',
        description: 'Message when no extensions are saved',
        id: 'tw.extensionEditorTabs.noExtensionsFound'
    },
    nameLabel: {
        defaultMessage: 'Extension Name',
        description: 'Label for extension name input',
        id: 'tw.extensionEditorTabs.nameLabel'
    },
    namePlaceholder: {
        defaultMessage: 'My Extension',
        description: 'Placeholder for extension name input',
        id: 'tw.extensionEditorTabs.namePlaceholder'
    },
    idLabel: {
        defaultMessage: 'Extension ID',
        description: 'Label for extension ID input',
        id: 'tw.extensionEditorTabs.idLabel'
    },
    idPlaceholder: {
        defaultMessage: 'myextension',
        description: 'Placeholder for extension ID input',
        id: 'tw.extensionEditorTabs.idPlaceholder'
    },
    idHint: {
        defaultMessage: 'Must be lowercase, no spaces, only letters, numbers, and underscores',
        description: 'Hint for extension ID input',
        id: 'tw.extensionEditorTabs.idHint'
    },
    colorLabel: {
        defaultMessage: 'Extension Color',
        description: 'Label for extension color picker',
        id: 'tw.extensionEditorTabs.colorLabel'
    },
    color1Label: {
        defaultMessage: 'Primary',
        description: 'Label for primary color',
        id: 'tw.extensionEditorTabs.color1Label'
    },
    color2Label: {
        defaultMessage: 'Secondary',
        description: 'Label for secondary color',
        id: 'tw.extensionEditorTabs.color2Label'
    },
    color3Label: {
        defaultMessage: 'Tertiary',
        description: 'Label for tertiary color',
        id: 'tw.extensionEditorTabs.color3Label'
    },
    closeButton: {
        defaultMessage: 'Close',
        description: 'Button to close the create form',
        id: 'tw.extensionEditorTabs.closeButton'
    },
    nextButton: {
        defaultMessage: 'Next',
        description: 'Button to go to next step',
        id: 'tw.extensionEditorTabs.nextButton'
    },
    backButton: {
        defaultMessage: 'Back',
        description: 'Button to go to previous step',
        id: 'tw.extensionEditorTabs.backButton'
    },
    createButton: {
        defaultMessage: 'Create',
        description: 'Button to create the extension',
        id: 'tw.extensionEditorTabs.createButton'
    },
    nameError: {
        defaultMessage: 'Please enter a name',
        description: 'Error message when name is empty',
        id: 'tw.extensionEditorTabs.nameError'
    },
    nameErrorInvalidClassName: {
        defaultMessage: 'Name must be a valid JavaScript class name (letters, numbers, underscores, dollar signs, not a reserved word)',
        description: 'Error message when name is not a valid JavaScript class name',
        id: 'tw.extensionEditorTabs.nameErrorInvalidClassName'
    },
    idError: {
        defaultMessage: 'Please enter a valid ID (lowercase letters, numbers, and underscores only)',
        description: 'Error message when ID is invalid',
        id: 'tw.extensionEditorTabs.idError'
    },
    nowName: {
        defaultMessage: 'Extension Name: ',
        description: 'message about extension name on id input',
        id: 'tw.extensionEditorTabs.nowname'
    },
    export: {
        defaultMessage: 'Export',
        description: 'Button to export extension as file',
        id: 'tw.extensionEditorTabs.export'
    },
    runExtension: {
        defaultMessage: 'Run Extension',
        description: 'Button to run the current extension in the VM',
        id: 'tw.extensionEditorTabs.runExtension'
    },
    loadingExtension: {
        defaultMessage: 'Loading extension...',
        description: 'Loading extension message',
        id: 'tw.extensionEditorTabs.loadingExtension'
    },
    loadingPleaseWait: {
        defaultMessage: 'Please wait',
        description: 'Please wait message',
        id: 'tw.extensionEditorTabs.loadingPleaseWait'
    },
    loadFailed: {
        defaultMessage: 'Load failed',
        description: 'Load failed message',
        id: 'tw.extensionEditorTabs.loadFailed'
    },
    checkSyntax: {
        defaultMessage: 'Please check the code syntax and try again',
        description: 'Check syntax suggestion',
        id: 'tw.extensionEditorTabs.checkSyntax'
    },
    runExtensionFirst: {
        defaultMessage: 'Please run the extension first',
        description: 'Run extension first message',
        id: 'tw.extensionEditorTabs.runExtensionFirst'
    },
    runExtensionButton: {
        defaultMessage: 'Click "Run Extension" button to load block preview',
        description: 'Run extension button hint',
        id: 'tw.extensionEditorTabs.runExtensionButton'
    },
    extensionNotLoaded: {
        defaultMessage: 'Extension not loaded',
        description: 'Extension not loaded message',
        id: 'tw.extensionEditorTabs.extensionNotLoaded'
    },
    noBlocksDefined: {
        defaultMessage: 'No blocks defined',
        description: 'No blocks defined message',
        id: 'tw.extensionEditorTabs.noBlocksDefined'
    },
    noBlocksXML: {
        defaultMessage: 'No blocks XML',
        description: 'No blocks XML message',
        id: 'tw.extensionEditorTabs.noBlocksXML'
    },
    renderFailed: {
        defaultMessage: 'Render failed',
        description: 'Render failed message',
        id: 'tw.extensionEditorTabs.renderFailed'
    },
    checkBlockDefinition: {
        defaultMessage: 'Please check if block definition is correct',
        description: 'Check block definition suggestion',
        id: 'tw.extensionEditorTabs.checkBlockDefinition'
    },
    loadExtension: {
        defaultMessage: 'Load Extension',
        description: 'Load extension button',
        id: 'tw.extensionEditorTabs.loadExtension'
    },
    importExtension: {
        defaultMessage: 'Import extension from file',
        description: 'Import extension from file',
        id: 'tw.extensionEditorTabs.importExtension'
    },
    manageStorage: {
        defaultMessage: 'Manage Storage',
        description: 'Manage IndexedDB storage',
        id: 'tw.extensionEditorTabs.manageStorage'
    },
    storedExtensions: {
        defaultMessage: 'Stored Extensions',
        description: 'Stored extensions title',
        id: 'tw.extensionEditorTabs.storedExtensions'
    },
    deleteExtension: {
        defaultMessage: 'Delete',
        description: 'Delete extension button',
        id: 'tw.extensionEditorTabs.deleteExtension'
    },
    clearAll: {
        defaultMessage: 'Clear All',
        description: 'Clear all stored extensions',
        id: 'tw.extensionEditorTabs.clearAll'
    },
    noStoredExtensions: {
        defaultMessage: 'No stored extensions',
        description: 'No stored extensions message',
        id: 'tw.extensionEditorTabs.noStoredExtensions'
    },
    lastModified: {
        defaultMessage: 'Last modified: ',
        description: 'Last modified label',
        id: 'tw.extensionEditorTabs.lastModified'
    },
    back: {
        defaultMessage: 'Back',
        description: 'Back button',
        id: 'tw.extensionEditorTabs.back'
    },
    wizardTitle: {
        defaultMessage: 'Wizard',
        description: 'Wizard title',
        id: 'tw.extensionEditorTabs.wizardTitle'
    }
});

class ExtensionEditorTabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showCreateForm: false,
            currentStep: 0,
            createForm: {
                name: '',
                id: '',
                color1: '#FF6680',
                color2: '#FF4D6A',
                color3: '#CC3D55'
            },
            errors: {
                name: '',
                id: ''
            },
            savedExtensions: [],
            isLoadingExtension: false,
            loadError: null,
            loadedExtensionIds: {}, // 记录每个标签卡已加载的扩展ID {tabId: extensionId}
            showStorageManager: false, // 显示存储管理器
            blocksPanelMode: 'preview' // blocksPanel 显示模式: 'preview' (积木预览) 或 'wizard' (向导)
        };
        this.flyoutContainer = React.createRef();
        this.previewWorkspace = null;
        this.previewFlyout = null;
        this.blocksInfoListenerAdded = false;
        this.runExtensionDebounce = null;
        this.fileInputRef = React.createRef();
    }
    componentDidMount() {
        this.loadSavedExtensions();
        if (this.props.vm && !this.blocksInfoListenerAdded) {
            this.props.vm.addListener('BLOCKSINFO_UPDATE', this.renderBlockPreviewFromVM);
            this.blocksInfoListenerAdded = true;
        }
    }
    componentDidUpdate(prevProps, prevState) {
        // When switching to extension editor tab
        if (prevProps.activeTabIndex !== this.props.activeTabIndex && this.props.activeTabIndex === 3) {
            this.renderBlockPreviewFromVM();
        }
        // When create form state changes or active tab changes
        if (prevState.showCreateForm !== this.state.showCreateForm ||
            prevState.currentStep !== this.state.currentStep ||
            prevProps.activeTabId !== this.props.activeTabId) {
            this.renderBlockPreviewFromVM();
        }
    }
    componentWillUnmount() {
        if (this.flyoutUpdateTimeout) {
            clearTimeout(this.flyoutUpdateTimeout);
        }
        if (this.runExtensionDebounce) {
            clearTimeout(this.runExtensionDebounce);
        }
        this.disposeFlyout();
    }
    disposeFlyout = () => {
        // 先清理flyout引用
        if (this.previewFlyout) {
            this.previewFlyout = null;
        }
        // 清理workspace
        if (this.previewWorkspace) {
            this.previewWorkspace.dispose();
            this.previewWorkspace = null;
        }
        // 清理容器内容
        if (this.flyoutContainer.current) {
            this.flyoutContainer.current.innerHTML = '';
        }
    };
    renderBlockPreviewFromVM = () => {
        const { vm } = this.props;
        const container = this.flyoutContainer.current;
        if (!vm || !vm.runtime || !container) return;
        // 如果正在加载扩展，显示加载状态
        if (this.state.isLoadingExtension) {
            const loadingText = this.getTranslation(messages.loadingExtension.id, messages.loadingExtension.defaultMessage);
            const waitText = this.getTranslation(messages.loadingPleaseWait.id, messages.loadingPleaseWait.defaultMessage);
            container.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 14px; margin-bottom: 10px;">${loadingText}</div>
                        <div style="font-size: 12px;">${waitText}</div>
                    </div>
                `;
            return;
        }
        // 如果有加载错误，显示错误信息
        if (this.state.loadError) {
            const loadFailedText = this.getTranslation(messages.loadFailed.id, messages.loadFailed.defaultMessage);
            const checkSyntaxText = this.getTranslation(messages.checkSyntax.id, messages.checkSyntax.defaultMessage);
            container.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,100,100,0.9);">
                        <div style="font-size: 14px; margin-bottom: 10px;">✕ ${loadFailedText}</div>
                        <div style="font-size: 12px; margin-bottom: 8px;">${this.state.loadError}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${checkSyntaxText}</div>
                    </div>
                `;
            return;
        }
        // Show loading state if no extension has been loaded yet
        if (!vm.runtime._blockInfo || vm.runtime._blockInfo.length === 0) {
            const runExtensionText = this.getTranslation(messages.runExtensionFirst.id, messages.runExtensionFirst.defaultMessage);
            const runButtonHint = this.getTranslation(messages.runExtensionButton.id, messages.runExtensionButton.defaultMessage);
            container.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 14px; margin-bottom: 10px;">🔄 ${runExtensionText}</div>
                        <div style="font-size: 12px;">${runButtonHint}</div>
                    </div>
                `;
            return;
        }
        this.disposeFlyout();
        const activeTab = this.getActiveTab();
        if (!activeTab) return;
        const idMatch = activeTab.code.match(/id:\s*['"]([^'"]+)['"]/);
        if (!idMatch) return;
        const extensionId = idMatch[1];
        const blockInfo = vm.runtime._blockInfo;
        if (!blockInfo) return;
        const extensionInfo = blockInfo.find(b => b.id === extensionId);
        if (!extensionInfo || !extensionInfo.blocks) {
            const notLoadedText = this.getTranslation(messages.extensionNotLoaded.id, messages.extensionNotLoaded.defaultMessage);
            const runButtonHint = this.getTranslation(messages.runExtensionButton.id, messages.runExtensionButton.defaultMessage);
            container.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 14px; margin-bottom: 10px;">${notLoadedText}</div>
                        <div style="font-size: 12px;">${runButtonHint}</div>
                    </div>
                `;
            console.warn('Extension info not found:', extensionId);
            return;
        }
        const ScratchBlocks = VMScratchBlocks(vm, false);
        if (!ScratchBlocks) return;
        try {
            /* ===== 定义 block json ===== */
            const jsonBlocks = extensionInfo.blocks
                .filter(b => b.json)
                .map(b => b.json);
            if (!jsonBlocks.length) {
                const noBlocksText = this.getTranslation(messages.noBlocksDefined.id, messages.noBlocksDefined.defaultMessage);
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 14px;">${noBlocksText}</div>
                    </div>
                `;
                console.warn('No blocks to define');
                return;
            }
            ScratchBlocks.defineBlocksWithJsonArray(jsonBlocks);
            /* ===== 准备 toolbox XML ===== */
            // 参考make-toolbox-xml.js的方式构建category XML
            const extensionBlocksXML = extensionInfo.blocks
                .filter(b => b.xml)
                .map(b => b.xml)
                .join('');
            if (!extensionBlocksXML) {
                const noXMLText = this.getTranslation(messages.noBlocksXML.id, messages.noBlocksXML.defaultMessage);
                container.innerHTML = `
                                <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                                    <div style="font-size: 14px;">${noXMLText}</div>
                                </div>
                            `;
                console.warn('No blocks XML');
                return;
            }
            // 构建完整的toolbox XML
            // 添加图标支持
            let iconURI = '';
            if (extensionInfo.blockIconURI) {
                iconURI = `iconURI="${extensionInfo.blockIconURI}"`;
            }
            const toolboxXML = `<xml><category name="${extensionInfo.name}" id="${extensionInfo.id}" colour="${extensionInfo.color1}" secondaryColour="${extensionInfo.color2}" ${iconURI}>${extensionBlocksXML}</category></xml>`;
            /* ===== Workspace ===== */
            const workspace = ScratchBlocks.inject(container, {
                rtl: false,
                scrollbars: false,
                trashcan: false,
                sounds: false,
                toolbox: toolboxXML,
                zoom: {
                    controls: false,
                    wheel: false,
                    startScale: 0.85,
                    maxScale: 0.85,
                    minScale: 0.85
                }
            });
            if (workspace) {
                // 获取flyout
                const flyout = workspace.getFlyout();
                if (flyout) {
                    this.previewFlyout = flyout;
                    // 使用标准的Blockly API设置flyout宽度
                    if (flyout.setWidth) {
                        flyout.setWidth(450);
                    }
                    // 强制重新布局以应用新宽度
                    if (flyout.reflow) {
                        flyout.reflow();
                    }
                    // 强制重新定位
                    if (flyout.position) {
                        flyout.position();
                    }
                    console.log('Flyout created and configured with width 450px, blocks:', extensionBlocksXML);
                } else {
                    console.warn('Flyout not created');
                }
            }
            this.previewWorkspace = workspace;
        } catch (error) {
            console.error('Error rendering block preview:', error);
            // 显示渲染错误
            const renderFailedText = this.getTranslation(messages.renderFailed.id, messages.renderFailed.defaultMessage);
            const checkBlockText = this.getTranslation(messages.checkBlockDefinition.id, messages.checkBlockDefinition.defaultMessage);
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: rgba(255,100,100,0.9);">
                    <div style="font-size: 14px; margin-bottom: 10px;">✕ ${renderFailedText}</div>
                    <div style="font-size: 12px; margin-bottom: 8px;">${error.message}</div>
                    <div style="font-size: 11px; opacity: 0.7;">${error.stack || checkBlockText}</div>
                </div>
            `;
        }
    };
    async loadSavedExtensions() {
        try {
            const extensions = await extensionEditorStorage.getAllExtensions();
            this.setState({ savedExtensions: extensions });
            // Always show create form at startup
            this.setState({
                showCreateForm: true,
                currentStep: 0,
                createForm: {
                    name: '',
                    id: '',
                    color1: '#FF6680',
                    color2: '#FF4D6A',
                    color3: '#CC3D55'
                },
                errors: { name: '', id: '' }
            });
        } catch (error) {
            console.error('Failed to load saved extensions:', error);
            this.setState({
                showCreateForm: true,
                currentStep: 0,
                createForm: {
                    name: '',
                    id: '',
                    color1: '#FF6680',
                    color2: '#FF4D6A',
                    color3: '#CC3D55'
                },
                errors: { name: '', id: '' }
            });
        }
    }
    createNewTab = () => {
        this.setState({
            showCreateForm: true,
            currentStep: 0,
            createForm: {
                name: '',
                id: '',
                color1: '#FF6680',
                color2: '#FF4D6A',
                color3: '#CC3D55'
            },
            errors: { name: '', id: '' }
        });
    };
    handleNextStep = () => {
        if (this.validateCurrentStep()) {
            this.setState({ currentStep: this.state.currentStep + 1 });
        }
    };
    handlePrevStep = () => {
        if (this.state.currentStep > 0) {
            this.setState({ currentStep: this.state.currentStep - 1 });
        }
    };
    isValidClassName(name) { // 复制的
        if (!/^[A-Z_a-z$][\w$]*$/.test(name)) {
            return false;
        }
        const reservedWords = [
            'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
            'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
            'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
            'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
            'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
            'null', 'package', 'private', 'protected', 'public', 'return', 'short',
            'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
            'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
            'with', 'yield'
        ];
        if (reservedWords.includes(name)) {
            return false;
        }
        const futureReservedWords = [
            'enum', 'implements', 'interface', 'let', 'package', 'private',
            'protected', 'public', 'static', 'yield'
        ];
        if (futureReservedWords.includes(name)) {
            return false;
        }
        return true;
    }
    validateCurrentStep = () => {
        if (this.state.currentStep === 1) {
            // Step 2: Name
            if (!this.state.createForm.name.trim()) {
                this.setState({ errors: { name: this.props.intl.formatMessage(messages.nameError), id: '' } });
                return false;
            } else if (!this.isValidClassName(this.state.createForm.name)) {
                this.setState({ errors: { name: this.props.intl.formatMessage(messages.nameErrorInvalidClassName), id: '' } });
                return false;
            }
        } else if (this.state.currentStep === 2) {
            // Step 3: ID
            if (!this.state.createForm.id.trim()) {
                this.setState({ errors: { name: '', id: this.props.intl.formatMessage(messages.idError) } });
                return false;
            } else if (!/^[a-z0-9_]+$/.test(this.state.createForm.id)) {
                this.setState({ errors: { name: '', id: this.props.intl.formatMessage(messages.idError) } });
                return false;
            }
        }
        return true;
    };
    handleCreateFormChange = (field, value) => {
        if (field === 'name') {
            // Auto-generate ID from name when name changes
            const autoGeneratedId = value.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            this.setState({
                createForm: { ...this.state.createForm, name: value, id: autoGeneratedId },
                errors: { ...this.state.errors, name: '', id: '' }
            });
        } else if (field === 'id') {
            this.setState({
                createForm: { ...this.state.createForm, [field]: value },
                errors: { ...this.state.errors, [field]: '' }
            });
        } else {
            this.setState({ createForm: { ...this.state.createForm, [field]: value } });
        }
    };
    handleCreateExtension = () => {
        if (this.validateCurrentStep()) {
            const id = extensionEditorStorage.generateId();
            const code = this.generateExtensionCode({
                name: this.state.createForm.name,
                id: this.state.createForm.id,
                color1: this.state.createForm.color1,
                color2: this.generateSecondaryColor(this.state.createForm.color1),
                color3: this.generateTertiaryColor(this.state.createForm.color1)
            });
            this.props.addTab({
                id: id,
                name: this.state.createForm.name,
                code: code,
                isSaved: false
            });
            this.setState({
                showCreateForm: false,
                currentStep: 0,
                createForm: {
                    name: '',
                    id: '',
                    color1: '#FF6680',
                    color2: '#FF4D6A',
                    color3: '#CC3D55'
                },
                errors: { name: '', id: '' }
            });
        }
    };
    generateSecondaryColor(hex) {
        // Generate a darker shade of the primary color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `#${Math.max(0, r - 30).toString(16).padStart(2, '0')}${Math.max(0, g - 30).toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`;
    }
    generateTertiaryColor(hex) {
        // Generate an even darker shade of the primary color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `#${Math.max(0, r - 60).toString(16).padStart(2, '0')}${Math.max(0, g - 60).toString(16).padStart(2, '0')}${Math.max(0, b - 60).toString(16).padStart(2, '0')}`;
    }
    handleCancelCreate = () => {
        this.setState({
            showCreateForm: false,
            currentStep: 0,
            createForm: {
                name: '',
                id: '',
                color1: '#FF6680',
                color2: '#FF4D6A',
                color3: '#CC3D55'
            },
            errors: { name: '', id: '' }
        });
    };
    handleLoadExtension = () => {
        if (this.fileInputRef.current) {
            this.fileInputRef.current.click();
        }
    };
    handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const content = await file.text();
            const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
            const nameMatch = content.match(/Name:\s*([^\n]+)/);
            const extensionId = idMatch ? idMatch[1] : `ext_${Date.now()}`;
            const extensionName = nameMatch ? nameMatch[1].trim() : file.name.replace('.js', '');
            this.props.addTab({
                id: extensionId,
                name: extensionName,
                code: content,
                isSaved: true
            });
            this.props.activateTab(extensionId);
            this.setState({ showCreateForm: false });
        } catch (error) {
            console.error('Failed to load extension file:', error);
            alert(this.props.intl.formatMessage(messages.loadFailed) || 'Failed to load extension file');
        }
        event.target.value = '';
    };
    handleOpenStorageManager = async () => {
        try {
            const extensions = await extensionEditorStorage.getAllExtensions();
            this.setState({
                showStorageManager: true,
                showCreateForm: false,
                currentStep: 0,
                savedExtensions: extensions
            });
        } catch (error) {
            console.error('Failed to load saved extensions:', error);
        }
    };
    handleCloseStorageManager = () => {
        this.setState({ showStorageManager: false });
    };
    handleLoadFromStorage = async (extension) => {
        try {
            console.log('Loading extension from storage:', extension);
            if (!extension || !extension.id || !extension.name || !extension.code) {
                console.error('Invalid extension object:', extension);
                alert('Invalid extension data');
                return;
            }
            let newExtensionId = extension.id;
            let existingTab = this.props.tabs.find(tab => tab.id === newExtensionId);
            let counter = 1;
            while (existingTab) {
                newExtensionId = `${extension.id}_${counter}`;
                existingTab = this.props.tabs.find(tab => tab.id === newExtensionId);
                counter++;
            }
            let finalCode = extension.code;
            if (newExtensionId !== extension.id) {
                finalCode = finalCode.replace(
                    /id:\s*['"]([^'"]+)['"]/,
                    `id: '${newExtensionId}'`
                );
                console.log('Updated extension ID in code from', extension.id, 'to', newExtensionId);
            }
            this.props.addTab({
                id: newExtensionId,
                name: extension.name,
                code: finalCode,
                isSaved: true
            });
            this.props.activateTab(newExtensionId);
            this.setState({ showStorageManager: false });
            console.log('Extension loaded successfully with ID:', newExtensionId);
        } catch (error) {
            console.error('Failed to load extension from storage:', error);
            alert('Failed to load extension: ' + error.message);
        }
    };
    handleDeleteFromStorage = async (extensionId) => {
        try {
            await extensionEditorStorage.deleteExtension(extensionId);
            const extensions = await extensionEditorStorage.getAllExtensions();
            this.setState({ savedExtensions: extensions });
        } catch (error) {
            console.error('Failed to delete extension:', error);
        }
    };
    handleClearAllStorage = async () => {
        if (!confirm(this.props.intl.formatMessage(messages.clearAll) + '?')) {
            return;
        }
        try {
            for (const extension of this.state.savedExtensions) {
                await extensionEditorStorage.deleteExtension(extension.id);
            }
            this.setState({ savedExtensions: [] });
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    };
    handleToggleWizardPanel = () => {
        this.setState(prevState => ({
            blocksPanelMode: prevState.blocksPanelMode === 'wizard' ? 'preview' : 'wizard'
        }), () => {
            if (this.state.blocksPanelMode === 'preview') {
                this.renderBlockPreviewFromVM();
            }
        });
    };
    renderWizardPanel = () => {
        return <ExtensionEditorWizardPanel />;
    };
    generateExtensionCode = (config) => {
        const { name, id, color1, color2, color3 } = config;
        return `// Name: ${name}
// ID: ${id}

class ${this.toClassName(id)} {
  constructor(runtime) {
    this.runtime = runtime;
  }
  getInfo() {
    return {
      id: '${id}',
      name: '${name}',
      color1: '${color1}',
      color2: '${color2}',
      color3: '${color3}',
      blocks: [
        {
          opcode: 'hello',
          blockType: 'command',
          text: 'Hello [MESSAGE]',
          arguments: {
            MESSAGE: {
              type: 'string',
              defaultValue: 'World'
            }
          }
        },
        {
          opcode: 'getRandomNumber',
          blockType: 'reporter',
          text: 'Random [MIN] 到 [MAX]',
          arguments: {
            MIN: {
              type: 'number',
              defaultValue: 1
            },
            MAX: {
              type: 'number',
              defaultValue: 100
            }
          }
        }
      ]
    };
  }
  hello(args) {
    console.log('Hello, ' + args.MESSAGE);
  }
  getRandomNumber(args) {
    const min = args.MIN;
    const max = args.MAX;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

Scratch.extensions.register(new ${this.toClassName(id)}());
`;
    };
    toClassName(id) {
        // Convert ID to class name (e.g., 'my_extension' -> 'MyExtension')
        return id
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }
    handleTabClick = (tabId) => {
        if (tabId !== this.props.activeTabId) {
            // 在切换标签卡之前，卸载当前标签卡的扩展
            this.unloadCurrentTabExtension();
            this.props.activateTab(tabId);
        }
    };
    unloadCurrentTabExtension = () => {
        const activeTab = this.getActiveTab();
        if (!activeTab) return;
        const extensionId = this.state.loadedExtensionIds[activeTab.id];
        if (!extensionId) return;
        if (this.props.vm && this.props.vm.extensionManager) {
            if (this.props.vm.extensionManager.isExtensionLoaded(extensionId)) {
                console.log('Unloading extension when switching tab:', extensionId);
                this.props.vm.extensionManager.unloadExtension(extensionId);
                // 清理VM内部状态
                if (this.props.vm.runtime && this.props.vm.runtime._blockInfo) {
                    this.props.vm.runtime._blockInfo = this.props.vm.runtime._blockInfo.filter(
                        info => info.id !== extensionId
                    );
                    console.log('Cleaned up blockInfo for extension:', extensionId);
                }
            }
        }
    };
    handleTabClose = (tabId, event) => {
        event.stopPropagation();
        // 卸载该标签卡的扩展
        const extensionId = this.state.loadedExtensionIds[tabId];
        if (extensionId && this.props.vm && this.props.vm.extensionManager) {
            if (this.props.vm.extensionManager.isExtensionLoaded(extensionId)) {
                console.log('Unloading extension when closing tab:', extensionId);
                this.props.vm.extensionManager.unloadExtension(extensionId);
                // 清理VM内部状态
                if (this.props.vm.runtime && this.props.vm.runtime._blockInfo) {
                    this.props.vm.runtime._blockInfo = this.props.vm.runtime._blockInfo.filter(
                        info => info.id !== extensionId
                    );
                    console.log('Cleaned up blockInfo for extension:', extensionId);
                }
            }
        }
        // 从记录中删除
        const newLoadedIds = { ...this.state.loadedExtensionIds };
        delete newLoadedIds[tabId];
        this.setState({ loadedExtensionIds: newLoadedIds });
        this.props.removeTab(tabId);
    };
    handleCodeChange = (code) => {
        this.props.updateTabCode(this.props.activeTabId, code);
        // Auto-save to IndexedDB
        const activeTab = this.getActiveTab();
        if (activeTab) {
            extensionEditorStorage.saveExtension({
                id: activeTab.id,
                name: activeTab.name,
                code: code,
                createdAt: activeTab.createdAt,
                updatedAt: Date.now()
            }).then(() => {
                this.props.setTabSaved(activeTab.id, true);
            }).catch(error => {
                console.error('Failed to auto-save extension:', error);
            });
        }
        // 防抖延迟执行，避免频繁重新加载扩展
        if (this.runExtensionDebounce) {
            clearTimeout(this.runExtensionDebounce);
        }
        this.runExtensionDebounce = setTimeout(() => {
            this.handleRunExtension();
        }, 100);
    };
    handleExport = async () => {
        const activeTab = this.getActiveTab();
        if (!activeTab) return;
        const blob = new Blob([activeTab.code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab.name}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    handleRunExtension = async () => {
        const activeTab = this.getActiveTab();
        if (!activeTab || !activeTab.code) return;
        // Parse extension ID from code
        const idMatch = activeTab.code.match(/id:\s*['"]([^'"]+)['"]/);
        const newExtensionId = idMatch ? idMatch[1] : `ext_${Date.now()}`;
        console.log('Running extension:', newExtensionId);
        // 显示加载状态
        this.setState({ isLoadingExtension: true, loadError: null }, () => {
            this.renderBlockPreviewFromVM();
        });
        this.disposeFlyout();
        // Unload existing extension if loaded
        if (this.props.vm && this.props.vm.extensionManager) {
            // 先卸载之前记录的扩展ID（如果用户修改了id，这个ID可能与新的不同）
            const oldExtensionId = this.state.loadedExtensionIds[activeTab.id];
            if (oldExtensionId && this.props.vm.extensionManager.isExtensionLoaded(oldExtensionId)) {
                console.log('Unloading previously loaded extension:', oldExtensionId);
                this.props.vm.extensionManager.unloadExtension(oldExtensionId);
                // 清理VM内部状态
                if (this.props.vm.runtime && this.props.vm.runtime._blockInfo) {
                    this.props.vm.runtime._blockInfo = this.props.vm.runtime._blockInfo.filter(
                        info => info.id !== oldExtensionId
                    );
                    console.log('Cleaned up blockInfo for old extension:', oldExtensionId);
                }
            }
            // 再检查新的扩展ID是否已加载（防止重复加载）
            if (this.props.vm.extensionManager.isExtensionLoaded(newExtensionId)) {
                console.log('Unloading extension with same ID:', newExtensionId);
                this.props.vm.extensionManager.unloadExtension(newExtensionId);
                // 清理VM内部状态
                if (this.props.vm.runtime && this.props.vm.runtime._blockInfo) {
                    this.props.vm.runtime._blockInfo = this.props.vm.runtime._blockInfo.filter(
                        info => info.id !== newExtensionId
                    );
                    console.log('Cleaned up blockInfo for extension:', newExtensionId);
                }
                // 清理workerURLs数组中的data URL引用
                const wrappedCode = `
                    (function() {
                        ${activeTab.code}
                    })();
                `;
                const dataUrl = `data:application/javascript,${encodeURIComponent(wrappedCode)}`;
                const workerURLs = this.props.vm.extensionManager.workerURLs;
                console.log('Worker URLs before cleanup:', workerURLs);
                const urlIndex = workerURLs.indexOf(dataUrl);
                if (urlIndex !== -1) {
                    workerURLs.splice(urlIndex, 1);
                    console.log('Removed data URL from workerURLs at index:', urlIndex);
                } else {
                    console.log('Data URL not found in workerURLs');
                }
                console.log('Worker URLs after cleanup:', workerURLs);
                // 等待一段时间让VM完全清理
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        // Load the extension using data URL (standard flow)
        if (this.props.vm && this.props.vm.extensionManager) {
            try {
                // 使用IIFE包裹代码，避免全局作用域污染导致的重复声明错误
                const wrappedCode = `
                    (function() {
                        ${activeTab.code}
                    })();
                `;
                // 使用data URL格式，与原版自定义扩展加载保持一致
                const dataUrl = `data:application/javascript,${encodeURIComponent(wrappedCode)}`;
                console.log('Loading extension from data URL...');
                // 信任此扩展URL，使其使用无沙箱模式加载
                manuallyTrustExtension(dataUrl);
                await this.props.vm.extensionManager.loadExtensionURL(dataUrl);
                console.log('Extension loaded successfully');
                // 记录新加载的扩展ID
                this.setState({
                    loadedExtensionIds: {
                        ...this.state.loadedExtensionIds,
                        [activeTab.id]: newExtensionId
                    },
                    isLoadingExtension: false,
                    loadError: null
                });
                // Update flyout after extension is loaded
                requestAnimationFrame(() => {
                    this.renderBlockPreviewFromVM();
                });
            } catch (error) {
                console.error('Failed to load extension:', error);
                // 加载失败时显示错误信息
                this.setState({
                    isLoadingExtension: false,
                    loadError: error.message || '加载扩展失败'
                }, () => {
                    this.renderBlockPreviewFromVM();
                });
            }
        }
    };
    getActiveTab() {
        return this.props.tabs.find(tab => tab.id === this.props.activeTabId);
    }
    // Helper function to get translated message
    getTranslation(id, defaultMessage, values = {}) {
        return this.props.intl.formatMessage(
            { id, defaultMessage },
            values
        );
    }
    render() {
        const activeTab = this.getActiveTab();
        const code = activeTab ? activeTab.code : '';
        return (
            <div className={styles.container}>
                <div className={styles.tabBar}>
                    <div className={styles.tabs}>
                        {this.props.tabs.map(tab => (
                            <div
                                key={tab.id}
                                className={`${styles.tab} ${tab.id === this.props.activeTabId ? styles.active : ''}`}
                                onClick={() => this.handleTabClick(tab.id)}
                            >
                                <span className={styles.tabName}>
                                    {tab.name}
                                    {!tab.isSaved && <span className={styles.unsavedIndicator}>●</span>}
                                </span>
                                <button
                                    className={styles.tabCloseButton}
                                    onClick={(e) => this.handleTabClose(tab.id, e)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.newTabButton}
                            onClick={this.createNewTab}
                            title={this.props.intl.formatMessage(messages.newTab)}
                        >
                            +
                        </button>
                    </div>
                    {activeTab && (
                        <div className={styles.toolbar}>
                            <button
                                className={styles.toolbarButton}
                                onClick={this.handleRunExtension}
                                title={this.props.intl.formatMessage(messages.runExtension)}
                            >
                                <FormattedMessage {...messages.runExtension} />
                            </button>
                            <button
                                className={styles.toolbarButton}
                                onClick={this.handleExport}
                                title={this.props.intl.formatMessage(messages.export)}
                            >
                                <FormattedMessage {...messages.export} />
                            </button>
                            <button
                                className={styles.toolbarButton}
                                onClick={this.props.onOpenExtensionEditorSettings}
                                title={this.props.intl.formatMessage(messages.settings)}
                            >
                                ⚙️
                            </button>
                        </div>
                    )}
                </div>
                <div className={styles.editorContainer}>
                    <div className={styles.editorContent}>
                        {this.state.showCreateForm ? (
                            this.renderCreateForm()
                        ) : null}
                        {this.state.showStorageManager ? (
                            this.renderStorageManager()
                        ) : null}
                        {!this.state.showCreateForm && !this.state.showStorageManager && (
                            <div className={styles.workArea}>
                                <div className={styles.blocksPanel}>
                                    {this.state.blocksPanelMode === 'wizard' ? (
                                        this.renderWizardPanel()
                                    ) : (
                                        <div ref={this.flyoutContainer}>
                                            {/* Flyout will be moved here */}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.codePanel}>
                                    {activeTab ? (
                                        <ExtensionEditor
                                            key={activeTab.id}
                                            vm={this.props.vm}
                                            initialCode={code}
                                            onCodeChange={this.handleCodeChange}
                                            onOpenExtensionEditorSettings={this.props.onOpenExtensionEditorSettings}
                                            fontSize={this.props.fontSize}
                                            onFontSizeChange={this.props.onFontSizeChange}
                                            onToggleWizard={this.handleToggleWizardPanel}
                                            wizardActive={this.state.blocksPanelMode === 'wizard'}
                                        />
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <h2><FormattedMessage {...messages.welcomeTitle} /></h2>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    renderCreateForm() {
        return (
            <div className={styles.createForm}>
                <button
                    className={styles.closeButton}
                    onClick={this.handleCancelCreate}
                    title={this.props.intl.formatMessage(messages.closeButton)}
                >
                    ✕
                </button>
                <div className={styles.createFormContent}>
                    <div className={styles.stepsProgress}>
                        <div
                            className={styles.stepsProgressBar}
                            style={{ width: `${this.state.currentStep === 0 ? 0 : this.state.currentStep === 1 ? 25 : this.state.currentStep === 2 ? 50 : this.state.currentStep === 3 ? 75 : 100}%` }}
                        />
                    </div>
                    {this.renderStepContent()}
                </div>
                <div className={styles.createFormActions}>
                    {this.state.currentStep > 0 && this.state.currentStep !== 4 && (
                        <button
                            className={styles.backButton}
                            onClick={this.handlePrevStep}
                        >
                            <FormattedMessage {...messages.backButton} />
                        </button>
                    )}
                    {this.state.currentStep === 1 && (
                        <button
                            className={styles.nextButton}
                            onClick={this.handleNextStep}
                            disabled={!this.state.createForm.name.trim()}
                        >
                            <FormattedMessage {...messages.nextButton} />
                        </button>
                    )}
                    {this.state.currentStep === 2 && (
                        <button
                            className={styles.nextButton}
                            onClick={this.handleNextStep}
                            disabled={!this.state.createForm.name.trim() || !this.state.createForm.id.trim()}
                        >
                            <FormattedMessage {...messages.nextButton} />
                        </button>
                    )}
                    {this.state.currentStep === 3 && (
                        <button
                            className={styles.createButton}
                            onClick={this.handleCreateExtension}
                            disabled={!this.state.createForm.name.trim() || !this.state.createForm.id.trim()}
                        >
                            <FormattedMessage {...messages.createButton} />
                        </button>
                    )}
                </div>
            </div>
        );
    }
    renderStorageManager() {
        return (
            <div className={styles.createForm}>
                <ExtensionEditorStorageContent
                    savedExtensions={this.state.savedExtensions}
                    onClose={this.handleCloseStorageManager}
                    onLoadFromStorage={this.handleLoadFromStorage}
                    onDeleteFromStorage={this.handleDeleteFromStorage}
                    onClearAllStorage={this.handleClearAllStorage}
                />
            </div>
        );
    }
    renderStepContent() {
        switch (this.state.currentStep) {
            case 0:
                return (
                    <div className={styles.stepContent}>
                        <div className={styles.welcomeActions}>
                            <button
                                className={styles.welcomeButton}
                                onClick={() => this.setState({ currentStep: 1 })}
                            >
                                <FormattedMessage {...messages.createNewExtension} />
                            </button>
                            <button
                                className={styles.welcomeButton}
                                onClick={this.handleLoadExtension}
                            >
                                <FormattedMessage {...messages.loadExtension} />
                            </button>
                            <button
                                className={styles.welcomeButton}
                                onClick={this.handleOpenStorageManager}
                            >
                                <FormattedMessage {...messages.manageStorage} />
                            </button>
                        </div>
                        <input
                            ref={this.fileInputRef}
                            type="file"
                            accept=".js"
                            style={{ display: 'none' }}
                            onChange={this.handleFileSelect}
                        />
                    </div>
                );
            case 1:
                return (
                    <div className={styles.stepContent}>
                        <h3><FormattedMessage {...messages.nameLabel} /></h3>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder={this.props.intl.formatMessage(messages.namePlaceholder)}
                            value={this.state.createForm.name}
                            onChange={(e) => this.handleCreateFormChange('name', e.target.value)}
                            autoFocus
                        />
                        {this.state.errors.name && (
                            <div className={styles.formError}>{this.state.errors.name}</div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className={styles.stepContent}>
                        <h3><FormattedMessage {...messages.idLabel} /></h3>
                        <div className={styles.nowName}>
                            <FormattedMessage {...messages.nowName}></FormattedMessage>{this.state.createForm.name}
                        </div>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder={this.props.intl.formatMessage(messages.idPlaceholder)}
                            value={this.state.createForm.id}
                            onChange={(e) => this.handleCreateFormChange('id', e.target.value)}
                            autoFocus
                        />
                        <div className={styles.formHint}>
                            <FormattedMessage {...messages.idHint} />
                        </div>
                        {this.state.errors.id && (
                            <div className={styles.formError}>{this.state.errors.id}</div>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className={styles.stepContent}>
                        <h3><FormattedMessage {...messages.colorLabel} /></h3>
                        <div className={styles.colorPickers}>
                            <div className={styles.colorPicker}>
                                <label className={styles.colorLabel}>
                                    <FormattedMessage {...messages.color1Label} />
                                </label>
                                <input
                                    type="color"
                                    className={styles.colorInput}
                                    value={this.state.createForm.color1}
                                    onChange={(e) => this.handleCreateFormChange('color1', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }
}

ExtensionEditorTabs.propTypes = {
    vm: PropTypes.object,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        code: PropTypes.string.isRequired,
        isSaved: PropTypes.bool.isRequired,
        createdAt: PropTypes.number,
        updatedAt: PropTypes.number
    })).isRequired,
    activeTabId: PropTypes.string,
    activeTabIndex: PropTypes.number.isRequired,
    addTab: PropTypes.func.isRequired,
    removeTab: PropTypes.func.isRequired,
    activateTab: PropTypes.func.isRequired,
    updateTabCode: PropTypes.func.isRequired,
    setTabSaved: PropTypes.func.isRequired,
    openExtensionEditorCreate: PropTypes.func.isRequired,
    onOpenExtensionEditorSettings: PropTypes.func,
    fontSize: PropTypes.number,
    onFontSizeChange: PropTypes.func
};

const mapStateToProps = state => ({
    tabs: state.scratchGui.extensionEditorTabs.tabs,
    activeTabId: state.scratchGui.extensionEditorTabs.activeTabId,
    fontSize: state.scratchGui.extensionEditor.fontSize,
    activeTabIndex: state.scratchGui.editorTab.activeTabIndex
});

const mapDispatchToProps = dispatch => ({
    addTab: (tab) => dispatch(addTab(tab)),
    removeTab: (tabId) => dispatch(removeTab(tabId)),
    activateTab: (tabId) => dispatch(activateTab(tabId)),
    updateTabCode: (tabId, code) => dispatch(updateTabCode(tabId, code)),
    setTabSaved: (tabId, isSaved) => dispatch(setTabSaved(tabId, isSaved)),
    openExtensionEditorCreate: () => dispatch(openExtensionEditorCreate())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ExtensionEditorTabs));
