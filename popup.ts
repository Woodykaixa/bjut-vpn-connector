import * as common from "./common"
/**
 * 通过id获取HTML元素，有点像JQuery那个$。但是想到没准以后要用JQuery，所以
 * 换了个名字。直接调这个函数能少写一笔是一笔。
 * @param id 
 */
const getElement = (id: string) => {
    return document.getElementById(id)
}

let nameInput = <HTMLInputElement>getElement("studentId")
let pwdInput = <HTMLInputElement>getElement('password')
let connectButton = <HTMLButtonElement>getElement('connect')
let disconnectButton = <HTMLButtonElement>getElement('disconnect')
let rememberMeCheckbox = <HTMLInputElement>getElement('rememberMe')
let ConnectionStatusCode: number = null
let rememberLoginInfo: boolean = null

/**
 * HTML中用于显示状态的元素集合。
 */
const StatusBoxes = [
    getElement('statusNotConnected'),
    getElement('statusConnecting'),
    getElement('statusConnected'),
    getElement('statusDisconnecting')
]

/**
 * 改变vpn_login.html中显示的连接状态
 * @param status 想要页面显示的连接状态
 */
const changeDisplayedStatus = (status: number) => {
    StatusBoxes.forEach((element) => {
        element.style.display = 'none'
    })
    StatusBoxes[status].style.removeProperty('display')
}

/**
 * 向background获取Vpn的连接状态，并根据获得的状态改变网页中显示的状态
 * response = { msg: any }
 * @returns 返回Promise，以便于获取状态后的下一步操作
 */
const queryConnectionStatus = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(common.msg('query', { what: 'connection status' }), (response) => {
            ConnectionStatusCode = response.msg
            resolve()
        })
    })
}

/**
 * 将popup端的连接状态改变为statusCode对应的状态
 * @param statusCode 想要切换的连接状态
 */
const changeStatus = (statusCode: number) => {
    console.info('修改连接状态为: code ' + statusCode)
    if (statusCode === null) {
        console.info('Connection Status is null.')
        return
    }
    changeDisplayedStatus(statusCode)
    if (statusCode === common.ConnectionStatus['connected']) {
        connectButton.style.display = 'none'
        disconnectButton.style.removeProperty('display')
    } else if (statusCode === common.ConnectionStatus['not_connected']) {
        disconnectButton.style.display = 'none'
        connectButton.style.removeProperty('display')
    }
}

const saveLoginInfo = () => {
    if (rememberLoginInfo) {
        let theId = nameInput.value
        let thePassword = pwdInput.value
        chrome.storage.local.set({ 'name': theId })
        chrome.storage.local.set({ 'password': thePassword })
    }
}

const getLocalLoginInfo = () => {
    chrome.storage.local.get(['rememberMe'], (result) => {
        rememberLoginInfo = result.rememberMe
        rememberMeCheckbox.checked = rememberLoginInfo
        if (rememberLoginInfo) {
            chrome.storage.local.get(['name', 'password'], (result) => {
                if (result.name !== null && result.password !== null) {
                    nameInput.value = result.name
                    pwdInput.value = result.password
                }
            })
        }
    })
}

const requestBackgroundAlert = (msg: string) => {
    chrome.runtime.sendMessage(common.msg('alert', msg))
}

/**
 * 连接按钮点击事件。向background发送登录用的数据。
 */
connectButton.addEventListener('click', () => {
    changeStatus(common.ConnectionStatus['connecting'])
    let loginInfo = {
        id: nameInput.value,
        pwd: pwdInput.value
    }
    chrome.runtime.sendMessage(common.msg('login', loginInfo), (response) => {
        if (response.msg === 'invalid') {
            changeStatus(common.ConnectionStatus['not_connected'])
            requestBackgroundAlert('请检查用户名是否输入正确')
        }
    })
})


/**
 * 断开按钮点击事件。
 */
disconnectButton.addEventListener('click', () => {
    changeStatus(common.ConnectionStatus['disconnecting'])
    chrome.runtime.sendMessage(common.msg('logout', null))
})


rememberMeCheckbox.addEventListener('click', () => {
    rememberLoginInfo = rememberMeCheckbox.checked
    chrome.storage.local.set({ 'rememberMe': rememberLoginInfo })
    if (rememberLoginInfo) {
        chrome.storage.local.set({ 'name': null })
        chrome.storage.local.set({ 'password': null })
    }
})

/**
 * 接收background消息的监听器。
 * @param message 
 * @param sender 
 * @param sendResponse 使用这个函数回应消息
 */
const onMessageListener = (message: common.Message, sender, sendResponse: common.ResponseFunction) => {
    if (message.type === 'change_status') {
        changeStatus(message.content.changeTo)
    }
    if (message.content.reason === 'login successful') {
        saveLoginInfo()
    }
    else if (message.content.reason === 'login failed') {
        requestBackgroundAlert('连接失败，请检查密码')
    }
}

chrome.runtime.onMessage.addListener(onMessageListener)

const createNotification = () => {
    chrome.notifications.create('AboutExtension', {
        type: 'basic',
        iconUrl: './img/about.png',
        title: '关于本插件',
        message: '本插件仅限于连接教务网站以及图书馆网站使用，连接my网请使用 https://webvpn.bjut.edu.cn',
        contextMessage: '您可以在设置页面启用自动转跳功能转跳到webvpn页面',
        buttons: [
            { title: '不再提示' }
        ]
    })
}

const buttonClickListener = (notificationId: string, buttonIndex: number) => {
    
}

chrome.notifications.onButtonClicked.addListener(buttonClickListener)

/**
 * 向DOM添加监听器，DOM加载完成时向background查询Vpn连接状态
 */
document.addEventListener('DOMContentLoaded', () => {
    queryConnectionStatus()
        .then(() => changeStatus(ConnectionStatusCode))
    getLocalLoginInfo()
    createNotification()
})
