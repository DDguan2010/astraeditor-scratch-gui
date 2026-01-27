renderBlockPreview() {
        if (!this.flyoutContainer.current) return;

        // 状态1: 没有任何tab
        if (!this.props.tabs || this.props.tabs.length === 0) {
            this.flyoutContainer.current.innerHTML = `
                <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;">🧩</div>
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">扩展编辑器</div>
                    <div style="font-size: 14px; margin-bottom: 20px; opacity: 0.8;">创建自己的Scratch扩展</div>
                    <div style="font-size: 13px; line-height: 1.6; opacity: 0.6; max-width: 280px;">
                        点击右上角的 "+" 按钮开始创建新扩展<br>
                        在这里编辑代码，左侧实时预览积木
                    </div>
                </div>
            `;
            return;
        }

        // 状态2: 创建表单打开中
        if (this.state.showCreateForm) {
            const stepMessages = [
                { title: '开始创建', desc: '点击下方按钮开始' },
                { title: '扩展名称', desc: '输入扩展的显示名称' },
                { title: '扩展ID', desc: '设置唯一标识符' },
                { title: '选择颜色', desc: '自定义积木颜色' }
            ];
            const currentStepInfo = stepMessages[this.state.currentStep] || stepMessages[0];
            
            this.flyoutContainer.current.innerHTML = `
                <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 32px; margin-bottom: 15px;">✨</div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${currentStepInfo.title}</div>
                    <div style="font-size: 13px; opacity: 0.7;">${currentStepInfo.desc}</div>
                </div>
            `;
            return;
        }

        // 状态3: 正在编辑扩展
        try {
            const activeTab = this.getActiveTab();
            
            if (!activeTab || !activeTab.code) {
                this.flyoutContainer.current.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 16px; margin-bottom: 10px;">没有激活的扩展</div>
                        <div style="font-size: 13px;">点击上方的标签页选择一个扩展</div>
                    </div>
                `;
                return;
            }

            // 解析扩展信息
            const extensionInfo = this.parseExtensionInfo(activeTab.code);
            
            if (!extensionInfo || !extensionInfo.blocks) {
                this.flyoutContainer.current.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                        <div style="font-size: 16px; margin-bottom: 10px;">无法解析扩展</div>
                        <div style="font-size: 13px;">请检查扩展代码格式</div>
                    </div>
                `;
                return;
            }

            // 显示积木预览
            this.flyoutContainer.current.innerHTML = '';
            const previewContainer = document.createElement('div');
            previewContainer.style.cssText = 'padding: 10px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; height: 100%;';

            const color1 = extensionInfo.color1 || '#FF6680';
            const color2 = extensionInfo.color2 || '#FF4D6A';

            // 类别标题
            const header = document.createElement('div');
            header.style.cssText = `
                font-size: 14px;
                font-weight: bold;
                color: white;
                background: ${color1};
                padding: 8px 12px;
                border-radius: 4px;
                margin-bottom: 8px;
            `;
            header.textContent = extensionInfo.name || 'Extension';
            previewContainer.appendChild(header);

            // 积木列表
            extensionInfo.blocks.forEach(block => {
                const blockEl = document.createElement('div');
                blockEl.style.cssText = `
                    font-size: 13px;
                    color: white;
                    background: ${color2};
                    padding: 8px 12px;
                    border-radius: 4px;
                    border-left: 4px solid ${color1};
                    cursor: pointer;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    transition: transform 0.1s ease, opacity 0.1s ease;
                `;
                
                blockEl.onmouseenter = () => {
                    blockEl.style.transform = 'translateX(2px)';
                    blockEl.style.opacity = '0.9';
                };
                blockEl.onmouseleave = () => {
                    blockEl.style.transform = 'translateX(0)';
                    blockEl.style.opacity = '1';
                };

                // 参数高亮
                let blockText = block.text.replace(/\[([^\]]+)\]/g, '<span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px; margin: 0 2px;">$1</span>');
                blockEl.innerHTML = blockText;

                previewContainer.appendChild(blockEl);
            });

            this.flyoutContainer.current.appendChild(previewContainer);
        } catch (error) {
            console.error('Failed to render block preview:', error);
        }
    }