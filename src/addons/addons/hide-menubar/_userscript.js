
export default async function ({ addon, msg, Window }) {
        const topBar = await addon.tab.waitForElement("[class^='gui_menu-bar-position']", {
                markAsSeen: true,
                reduxEvents: [
                        "scratch-gui/mode/SET_PLAYER",
                        "fontsLoaded/SET_FONTS_LOADED",
                        "scratch-gui/locales/SELECT_LOCALE",
                ],
                reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        });
        const gui = await addon.tab.waitForElement("[class^='gui_page-wrapper']", {
                markAsSeen: true,
                reduxEvents: [
                        "scratch-gui/mode/SET_PLAYER",
                        "fontsLoaded/SET_FONTS_LOADED",
                        "scratch-gui/locales/SELECT_LOCALE",
                ],
                reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        });
        const VSCodeLayout = JSON.parse(localStorage.getItem('AESettings')).EnableVSCodeLayout
        const hind = document.getElementsByClassName('HindToolBar')[0];
        if (!VSCodeLayout) {
                hind.style.width = '40px';
        } else {
                hind.style.height = '30px';
        }

        const CHECK_AREA_HEIGHT = 60;
        const BACK_AREA_HEIGHT = 10;

        const button = document.createElement('button');
        const text = document.createElement('img');


        let isTouching = false;
        let isLock = false;
        let topBarHeight = topBar.offsetHeight //插件可以更改
        let isTouchingAnyMenu = false;
        let oldCheck = isTouching;

        button.className = "hide-switch"
        text.className = "hide-text"
        topBar.style.position = 'absolute';
        topBar.style.width = '100%';
        topBar.style.top = `-${topBarHeight}px`;
        topBar.style.transition = 'top 0.5s ease'
        button.style.setProperty('--traslate', `-10px`);
        button.style.opacity = '50%'

        text.style.setProperty('--rotate', '0')

        updateWorkSpace()

        function setToolBarLock() {
                topBar.style.position = 'relative';
                text.style.setProperty('--rotate', '180deg');
                button.style.setProperty('--traslate', `${40 + (topBarHeight - 48)}px`);
                topBar.style.top = '0';

        }

        function updateWorkSpace() {
                window.dispatchEvent(new Event('resize'));
        }

        function update(e) {
                const toolBar = document.querySelectorAll("[class*='menu_right']")
                if (toolBar.length == 0) isTouchingAnyMenu = false;
                else isTouchingAnyMenu = true;
                topBarHeight = topBar.offsetHeight //插件可以更改
                if (isLock) {
                        setToolBarLock()
                        return
                } else {
                        topBar.style.position = 'absolute';
                        text.style.setProperty('--rotate', '0');
                }
                const isTouchArea = e.clientY < BACK_AREA_HEIGHT;
                const isExitArea = isTouching && !(e.clientY < CHECK_AREA_HEIGHT)
                if (isTouchArea) { //在屏幕上边
                        topBar.style.top = '0';
                        button.style.setProperty('--traslate', `${40 + (topBarHeight - 48)}px`);
                        button.style.opacity = '100%'
                        isTouching = true;
                } else if (isExitArea && !isTouchingAnyMenu) {
                        topBar.style.top = `-${topBarHeight}px`;
                        button.style.setProperty('--traslate', `-10px`);
                        button.style.opacity = '50%'
                        isTouching = false;
                }
                if (oldCheck != isTouching) updateWorkSpace()

                oldCheck = isTouching



        }
        document.addEventListener('mouseenter', (e) => {
                update(e)
        })
        document.addEventListener('mousemove', (e) => {
                update(e)
        });
        button.addEventListener('mousedown', (e) => {
                isLock = !isLock //锁定
                setToolBarLock()
                updateWorkSpace()
                update(e)
        });

        const buttonImg = require('./button.svg')
        text.src = buttonImg
        button.appendChild(text)
        gui.appendChild(button)


}