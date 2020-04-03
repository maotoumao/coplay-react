const {app, BrowserWindow, ipcMain, BrowserView} = require('electron');
const url = require('url');
const path = require('path');

// 只有一个窗口。原因：如果使用多个窗口，相当于是另开一个窗口重新加载文件，就不对了
let mainWindow;

// browserView
let webpageView;

// 加载的html
// const URL_PATH = 'http://localhost:3000';
const URL_PATH = url.format({
    pathname: path.join(__dirname, './build/index.html'),
    protocol: 'file:',
    slashes: true
});

// 初始界面，登录窗口
function createLoginWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        resizable: false,
        webPreferences: {
            nodeIntegration: true
        }

    });

    mainWindow.setMenu(null);
    // 加载界面，需要判断是否是开发模式，如果是开发模式就用3000端口，否则使用react打包后的文件地址
    mainWindow.loadURL(URL_PATH);
    // mainWindow.webContents.openDevTools();
    mainWindow.on('close', function () {
        mainWindow = null;
    })
}

// 变更为视频窗口
function changeIntoRoomWindow() {
    mainWindow.movable = false;
    webpageView = new BrowserView();
    mainWindow.setBrowserView(webpageView);
    webpageView.webContents.loadURL('https://www.baidu.com');
    mainWindow.maximize();
    // 计算大小
    let size = mainWindow.getContentSize();
    // 放置页面view
    webpageView.setBounds({x: Math.floor(size[0] * 0.2), y: 0, width: Math.floor(size[0] * 0.8), height: size[1]});
    webpageView.webContents.on('enter-html-full-screen', (e) => {
        // 全屏的时候，重新设置窗口的宽度
        let windowSize = mainWindow.getSize();
        webpageView.setBounds({
            x: Math.floor(size[0] * 0.2),
            y: 0,
            width: Math.floor(size[0] * 0.8),
            height: windowSize[1]
        });
    });
    webpageView.webContents.on('leave-html-full-screen', () => {
        // 重新让窗口最大化
        mainWindow.maximize();
        let contentSize = mainWindow.getContentSize();
        webpageView.setBounds({
            x: Math.floor(contentSize[0] * 0.2),
            y: 0,
            width: Math.floor(contentSize[0] * 0.8),
            height: contentSize[1]
        });
    })

}

// 窗口事件
app.whenReady().then(() => {
    createLoginWindow();
});
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 监听渲染进程的消息
// 登录成功
ipcMain.on('login-success', function (e) {
    // 修改窗口
    changeIntoRoomWindow();
    // 改个标题
});

// 监听url变动
ipcMain.on('change-url', function (e, data) {
    webpageView.webContents.loadURL(data.url);
});

// 获取url
ipcMain.on('get-url', function (event) {
    event.returnValue = webpageView.webContents.getURL();
})

// 监听设置进度事件
ipcMain.on('set-current-time', async function (event, data) {
    let js = 'var video = document.querySelector(\'video\'); video';
    try {
        let hasVideo = await webpageView.webContents.executeJavaScript(js);
        // 没有找到video组件
        if (!hasVideo) {
            event.returnValue = undefined;
            event.sender.send('fail-to-find-video');
        } else {
            event.returnValue = await webpageView.webContents.executeJavaScript(`video.currentTime = ${data.currentTime};`);
        }
    } catch (e) {
        event.sender.send('fail-to-execute-javascript');
    }
});

// 监听获取进度事件
ipcMain.on('get-current-time', async function (event) {
    let js = 'var video = document.querySelector(\'video\'); video';
    try {
        let hasVideo = await webpageView.webContents.executeJavaScript(js);
        // 没有找到video组件
        if (!hasVideo) {
            event.returnValue = undefined;
            event.sender.send('fail-to-find-video');
        } else {
            event.returnValue = await webpageView.webContents.executeJavaScript('video.currentTime;');
        }
    } catch (e) {
        event.sender.send('fail-to-execute-javascript');
    }

});

// 监听播放事件
ipcMain.on('play-video', async function (event) {
    let js = 'var video = document.querySelector(\'video\'); video';
    try {
        let hasVideo = await webpageView.webContents.executeJavaScript(js);
        // 没有找到video组件
        if (!hasVideo) {
            event.sender.send('fail-to-find-video');
        } else {
            webpageView.webContents.executeJavaScript('video.play();');
        }
    } catch (e) {
        event.sender.send('fail-to-execute-javascript');
    }
});

// 监听暂停事件
ipcMain.on('pause-video', async function (event) {
    let js = 'var video = document.querySelector(\'video\'); video';
    try {
        let hasVideo = await webpageView.webContents.executeJavaScript(js);
        // 没有找到video组件
        if (!hasVideo) {
            event.sender.send('fail-to-find-video');
            // event.sender.send('fail-to-find-video');
        } else {
            webpageView.webContents.executeJavaScript('video.pause();');
        }
    } catch (e) {

        event.sender.send('fail-to-execute-javascript');
    }
});

