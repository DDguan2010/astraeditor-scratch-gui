export default async function ({ addon, msg, safeMsg, console }) {
  // 项目分析器类
  class SimpleProjectAnalyzer {
    constructor() {
      this.analyzeButton = null;
      this.analyzeModal = null;
      this.removeModal = null;
    }

    // 创建分析按钮
    async createAnalyzeButton() {
      // 尝试查找 find-bar 插件的位置
      const findBar = document.querySelector('.react-tabs');
      let targetElement;

      if (findBar) {
        // 如果 find-bar 存在，在其右边添加按钮
        targetElement = findBar.parentElement;
      } else {
        // 否则，在编辑器标签栏的最右方添加
        const tabBar = await addon.tab.waitForElement('[class*="react-tabs_react-tabs__tab-list"]', {
          markAsSeen: true
        });
        targetElement = tabBar;
      }

      if (!targetElement) return;

      this.analyzeButton = document.createElement('button');
      this.analyzeButton.className = addon.tab.scratchClass('menu-bar_menu-bar-button', {
        others: 'sa-analyze-button'
      });
      this.analyzeButton.textContent = msg('analyze-button');
      this.analyzeButton.title = msg('analyze-tooltip');


      // 禁用时隐藏按钮
      addon.tab.displayNoneWhileDisabled(this.analyzeButton);

      this.analyzeButton.addEventListener('click', () => this.showAnalysisModal());

      // 将按钮添加到目标位置
      if (findBar) {
        // 在 find-bar 右边添加
        targetElement.insertBefore(this.analyzeButton, findBar.nextSibling);
      } else {
        // 在标签栏最右方添加
        targetElement.appendChild(this.analyzeButton);
      }
    }

    // 显示分析结果模态框
    showAnalysisModal() {
      // 如果模态框已存在，先移除
      if (this.analyzeModal) {
        this.analyzeModal.remove();
      }

      // 使用 addon.tab.createModal 创建模态框
      const { backdrop, container, content, closeButton, remove } = addon.tab.createModal(msg('modal-title'), {
        isOpen: true
      });

      this.analyzeModal = backdrop;
      this.removeModal = remove;

      // 添加自定义 CSS 类
      container.classList.add('sa-analyze-modal-popup');
      content.classList.add('sa-analyze-modal-content');

      // 生成分析结果HTML
      const analysisHTML = this.generateAnalysisHTML();

      // 设置模态框内容
      content.innerHTML = `
        <div class="sa-analyze-loading" id="saAnalyzeLoading">
          <div class="sa-analyze-spinner"></div>
          <p>${msg('analyzing')}</p>
        </div>
        <div class="sa-analyze-results" id="saAnalyzeResults" style="display: none;">
          ${analysisHTML}
        </div>
      `;

      // 添加关闭事件监听器
      backdrop.addEventListener('click', () => this.closeModal());
      closeButton.addEventListener('click', () => this.closeModal());

      // 异步分析项目
      this.analyzeProject();
    }
    closeModal() {
      if (this.removeModal) {
        this.removeModal();
        this.analyzeModal = null;
        this.removeModal = null;
      }
    }
    // 分析项目
    async analyzeProject() {
      try {
        // 使用 vm.runtime.targets 获取项目数据，与 block-count 插件保持一致
        const vm = addon.tab.traps.vm;
        const analysis = this.performAnalysisFromVM(vm);

        // 更新UI
        this.updateAnalysisResults(analysis);
      } catch (error) {
        console.error('分析项目时出错:', error);
        document.getElementById('saAnalyzeLoading').innerHTML = `
          <p style="color: #d32f2f;">${msg('analysis-error')}</p>
        `;
      }
    }

    // 执行分析
    performAnalysis(projectData) {
      const targets = projectData.targets || [];
      const sprites = targets.filter(t => !t.isStage);
      const stage = targets.find(t => t.isStage);

      let totalBlocks = 0;
      let blockTypes = {};
      let extensions = new Set(projectData.extensions || []);

      // 统计舞台数据
      if (stage && stage.blocks) {
        const stageBlocks = Object.values(stage.blocks);
        totalBlocks += stageBlocks.length;
        this.countBlockTypes(stageBlocks, blockTypes);
      }

      // 统计精灵数据
      sprites.forEach(sprite => {
        if (sprite.blocks) {
          const spriteBlocks = Object.values(sprite.blocks);
          totalBlocks += spriteBlocks.length;
          this.countBlockTypes(spriteBlocks, blockTypes);
        }
      });

      // 计算Dr.Scratch评分
      const drScratchScore = this.calculateDrScratchScore(projectData);

      return {
        spriteCount: sprites.length,
        blockCount: totalBlocks,
        costumeCount: targets.reduce((sum, t) => sum + (t.costumes ? t.costumes.length : 0), 0),
        soundCount: targets.reduce((sum, t) => sum + (t.sounds ? t.sounds.length : 0), 0),
        variableCount: targets.reduce((sum, t) => sum + (t.variables ? Object.keys(t.variables).length : 0), 0),
        listCount: targets.reduce((sum, t) => sum + (t.lists ? Object.keys(t.lists).length : 0), 0),
        blockTypes: blockTypes,
        extensions: Array.from(extensions),
        drScratchScore: drScratchScore
      };
    }

    // 从 VM 执行分析（与 block-count 插件保持一致）
    performAnalysisFromVM(vm) {
      const targets = vm.runtime.targets || [];
      const sprites = targets.filter(t => !t.isStage);
      const stage = targets.find(t => t.isStage);

      let totalBlocks = 0;
      let effectiveBlocks = 0;
      let functionDefinitions = 0;
      let blockTypes = {};
      let extensions = new Set();

      // 统计所有目标（包括舞台和精灵）
      targets.forEach(target => {
        if (!target.sprite || !target.sprite.blocks || !target.sprite.blocks._blocks) return;

        const blocks = Object.values(target.sprite.blocks._blocks);

        blocks.forEach(block => {
          if (typeof block !== 'object' || !block.opcode) return;

          // 统计总积木数（包括 shadow）
          totalBlocks++;

          // 统计有效积木（非 shadow）
          if (!block.shadow) {
            effectiveBlocks++;
          }

          // 统计函数定义
          if (block.opcode === 'procedures_definition') {
            functionDefinitions++;
          }

          // 统计积木类型
          const category = block.opcode.split('_')[0];
          blockTypes[category] = (blockTypes[category] || 0) + 1;
        });
      });

      // 获取扩展列表
      if (vm.runtime.extensionManager && vm.runtime.extensionManager._loadedExtensions) {
        extensions = new Set(Object.keys(vm.runtime.extensionManager._loadedExtensions));
      }

      // 计算Dr.Scratch评分（使用 toJSON 数据）
      let drScratchScore = {};
      try {
        const projectJSON = JSON.parse(vm.toJSON());
        drScratchScore = this.calculateDrScratchScore(projectJSON);
      } catch (e) {
        drScratchScore = {
          abstraction: 0,
          parallelism: 0,
          logic: 0,
          synchronization: 0,
          flowControl: 0,
          userInteractivity: 0,
          dataRepresentation: 0
        };
      }

      // 计算数学运算评估（使用 toJSON 数据）
      let mathLogicScores = {};
      try {
        const projectJSON = JSON.parse(vm.toJSON());
        mathLogicScores = this.calculateMathLogicScores(projectJSON);
      } catch (e) {
        mathLogicScores = {
          '运算复杂度': 0,
          '逻辑深度': 0,
          '数据量级': 0
        };
      }

      return {
        spriteCount: sprites.length,
        blockCount: effectiveBlocks, // 使用有效积木数与 block-count 一致
        effectiveBlocks: effectiveBlocks,
        functionDefinitions: functionDefinitions,
        costumeCount: targets.reduce((sum, t) => sum + (t.costumes ? t.costumes.length : 0), 0),
        soundCount: targets.reduce((sum, t) => sum + (t.sounds ? t.sounds.length : 0), 0),
        variableCount: targets.reduce((sum, t) => sum + (t.variables ? Object.keys(t.variables).length : 0), 0),
        listCount: targets.reduce((sum, t) => sum + (t.lists ? Object.keys(t.lists).length : 0), 0),
        blockTypes: blockTypes,
        extensions: Array.from(extensions),
        drScratchScore: drScratchScore,
        mathLogicScores: mathLogicScores
      };
    }

    // 统计积木类型
    countBlockTypes(blocks, blockTypes) {
      blocks.forEach(block => {
        if (block.opcode) {
          const category = block.opcode.split('_')[0];
          blockTypes[category] = (blockTypes[category] || 0) + 1;
        }
      });
    }

    // 计算Dr.Scratch评分
    calculateDrScratchScore(projectData) {
      const targets = projectData.targets || [];
      let score = {
        abstraction: 0,
        parallelism: 0,
        logic: 0,
        synchronization: 0,
        flowControl: 0,
        userInteractivity: 0,
        dataRepresentation: 0
      };

      targets.forEach(target => {
        if (!target.blocks) return;

        const blocks = Object.values(target.blocks);

        // 抽象和问题分解
        if (blocks.some(b => b.opcode && b.opcode.includes('procedures'))) {
          score.abstraction = Math.max(score.abstraction, 2);
        }
        if (blocks.some(b => b.opcode && b.opcode.includes('clone'))) {
          score.abstraction = Math.max(score.abstraction, 3);
        } else if (target.isSprite === false && targets.length > 1) {
          score.abstraction = Math.max(score.abstraction, 1);
        }

        // 并行性
        const eventBlocks = blocks.filter(b => b.opcode && b.opcode.startsWith('event_when'));
        if (eventBlocks.length >= 2) {
          score.parallelism = Math.max(score.parallelism, 1);
          if (eventBlocks.some(b => b.opcode === 'event_whenbroadcastreceived')) {
            score.parallelism = Math.max(score.parallelism, 3);
          } else if (eventBlocks.some(b => b.opcode.includes('key') || b.opcode.includes('click'))) {
            score.parallelism = Math.max(score.parallelism, 2);
          }
        }

        // 逻辑思维
        if (blocks.some(b => b.opcode === 'control_if')) {
          score.logic = Math.max(score.logic, 1);
        }
        if (blocks.some(b => b.opcode === 'control_if_else')) {
          score.logic = Math.max(score.logic, 2);
        }
        if (blocks.some(b => b.opcode && b.opcode.includes('operator'))) {
          score.logic = Math.max(score.logic, 3);
        }

        // 同步
        if (blocks.some(b => b.opcode === 'control_wait')) {
          score.synchronization = Math.max(score.synchronization, 1);
        }
        if (blocks.some(b => b.opcode === 'event_broadcast' || b.opcode === 'event_broadcastandwait')) {
          score.synchronization = Math.max(score.synchronization, 2);
        }
        if (blocks.some(b => b.opcode === 'control_wait_until')) {
          score.synchronization = Math.max(score.synchronization, 3);
        }

        // 流程控制
        if (blocks.some(b => b.opcode && b.opcode.includes('control'))) {
          score.flowControl = Math.max(score.flowControl, 1);
        }
        if (blocks.some(b => b.opcode === 'control_repeat' || b.opcode === 'control_forever')) {
          score.flowControl = Math.max(score.flowControl, 2);
        }
        if (blocks.some(b => b.opcode === 'control_repeat_until')) {
          score.flowControl = Math.max(score.flowControl, 3);
        }

        // 用户交互
        if (blocks.some(b => b.opcode === 'event_whenflagclicked')) {
          score.userInteractivity = Math.max(score.userInteractivity, 1);
        }
        if (blocks.some(b => b.opcode && (b.opcode.includes('key') || b.opcode.includes('click') || b.opcode.includes('ask')))) {
          score.userInteractivity = Math.max(score.userInteractivity, 2);
        }
        if (blocks.some(b => b.opcode && (b.opcode.includes('video') || b.opcode.includes('sensing')))) {
          score.userInteractivity = Math.max(score.userInteractivity, 3);
        }

        // 数据表示
        if (blocks.some(b => b.opcode && (b.opcode.includes('motion') || b.opcode.includes('looks') || b.opcode.includes('sound')))) {
          score.dataRepresentation = Math.max(score.dataRepresentation, 1);
        }
        if (blocks.some(b => b.opcode && b.opcode.includes('data'))) {
          score.dataRepresentation = Math.max(score.dataRepresentation, 2);
        }
        if (blocks.some(b => b.opcode && b.opcode.includes('list'))) {
          score.dataRepresentation = Math.max(score.dataRepresentation, 3);
        }
      });

      return score;
    }

    // 生成分析结果HTML
    generateAnalysisHTML() {
      return `
        <div class="sa-analyze-stats">
          <div class="sa-analyze-stat">
            <div class="sa-analyze-stat-value" id="saSpriteCount">-</div>
            <div class="sa-analyze-stat-label">${msg('stat-sprites')}</div>
          </div>
          <div class="sa-analyze-stat">
            <div class="sa-analyze-stat-value" id="saBlockCount">-</div>
            <div class="sa-analyze-stat-label">${msg('stat-blocks')}</div>
          </div>
          <div class="sa-analyze-stat">
            <div class="sa-analyze-stat-value" id="saCostumeCount">-</div>
            <div class="sa-analyze-stat-label">${msg('stat-costumes')}</div>
          </div>
          <div class="sa-analyze-stat">
            <div class="sa-analyze-stat-value" id="saSoundCount">-</div>
            <div class="sa-analyze-stat-label">${msg('stat-sounds')}</div>
          </div>
          <div class="sa-analyze-stat">
            <div class="sa-analyze-stat-value" id="saVariableCount">-</div>
            <div class="sa-analyze-stat-label">${msg('stat-variables')}</div>
          </div>
          <div class="sa-analyze-stat">
            <div class="sa-analyze-stat-value" id="saListCount">-</div>
            <div class="sa-analyze-stat-label">${msg('stat-lists')}</div>
          </div>
        </div>
        
        <div class="sa-analyze-details">
          <h3>${msg('dr-scratch-score')}</h3>
          <div class="sa-analyze-chart" id="saDrScratchChart">
            ${msg('loading-chart')}
          </div>
        </div>
        
        <div class="sa-analyze-details">
          <h3>${msg('block-distribution')}</h3>
          <div class="sa-analyze-chart" id="saBlockChart">
            ${msg('loading-chart')}
          </div>
        </div>
        
        <div class="sa-analyze-details">
          <h3>${msg('extensions')}</h3>
          <div id="saExtensionList">
            ${msg('loading')}
          </div>
        </div>
      `;
    }

    // 更新分析结果
    updateAnalysisResults(analysis) {
      // 更新统计数据
      document.getElementById('saSpriteCount').textContent = analysis.spriteCount;
      document.getElementById('saBlockCount').textContent = analysis.blockCount;
      document.getElementById('saCostumeCount').textContent = analysis.costumeCount;
      document.getElementById('saSoundCount').textContent = analysis.soundCount;
      document.getElementById('saVariableCount').textContent = analysis.variableCount;
      document.getElementById('saListCount').textContent = analysis.listCount;

      // 更新Dr.Scratch评分
      const drScratchHTML = this.createDrScratchChart(analysis.drScratchScore);
      document.getElementById('saDrScratchChart').innerHTML = drScratchHTML;

      // 更新积木分布
      const blockChartHTML = this.createBlockChart(analysis.blockTypes);
      document.getElementById('saBlockChart').innerHTML = blockChartHTML;

      // 更新扩展列表
      const extensionHTML = this.createExtensionList(analysis.extensions);
      document.getElementById('saExtensionList').innerHTML = extensionHTML;

      // 显示结果，隐藏加载
      document.getElementById('saAnalyzeLoading').style.display = 'none';
      document.getElementById('saAnalyzeResults').style.display = 'block';
    }

    // 创建Dr.Scratch评分图表
    createDrScratchChart(score) {
      const totalScore = Object.values(score).reduce((sum, val) => sum + val, 0);
      const maxScore = Object.keys(score).length * 3;

      let html = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">';

      const scoreNames = {
        abstraction: msg('abstraction'),
        parallelism: msg('parallelism'),
        logic: msg('logic'),
        synchronization: msg('synchronization'),
        flowControl: msg('flow-control'),
        userInteractivity: msg('user-interactivity'),
        dataRepresentation: msg('data-representation')
      };

      Object.entries(score).forEach(([key, value]) => {
        const percentage = (value / 3) * 100;
        html += `
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>${scoreNames[key] || key}</span>
              <span>${value}/3</span>
            </div>
            <div style="height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${percentage}%; background: #4d97ff; transition: width 0.3s;"></div>
            </div>
          </div>
        `;
      });

      html += '</div>';
      html += `<div style="margin-top: 16px; text-align: center; font-weight: bold;">${msg('total-score')}: ${totalScore}/${maxScore}</div>`;

      return html;
    }

    // 创建积木分布图表
    createBlockChart(blockTypes) {
      const totalBlocks = Object.values(blockTypes).reduce((sum, count) => sum + count, 0);

      let html = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">';

      Object.entries(blockTypes).forEach(([category, count]) => {
        const percentage = totalBlocks > 0 ? (count / totalBlocks) * 100 : 0;
        html += `
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>${category}</span>
              <span>${count}</span>
            </div>
            <div style="height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${percentage}%; background: #4d97ff; transition: width 0.3s;"></div>
            </div>
          </div>
        `;
      });

      html += '</div>';

      return html;
    }

    // 创建扩展列表
    createExtensionList(extensions) {
      if (extensions.length === 0) {
        return `<p>${msg('no-extensions')}</p>`;
      }

      let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';

      extensions.forEach(extension => {
        html += `<span class="extension" style="padding: 4px 8px; border-radius: 4px;">${extension}</span>`;
      });

      html += '</div>';

      return html;
    }

    // 初始化插件
    async init() {
      await this.createAnalyzeButton();
    }
  }

  // 创建并初始化分析器
  const analyzer = new SimpleProjectAnalyzer();

  // 等待编辑器加载完成
  addon.tab.waitForElement('[class*="menu-bar_menu-bar"], [class*="react-tabs_react-tabs__tab-list"]', {
    markAsSeen: true
  }).then(() => {
    analyzer.init();
  });
}