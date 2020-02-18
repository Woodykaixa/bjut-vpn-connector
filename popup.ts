import * as types from './types'
import * as util from './util'
import { $, msg } from "./util"
import { VpnConnectionStatus } from './BjutVpnConnector'


let nameInput = <HTMLInputElement>$("studentId")
let pwdInput = <HTMLInputElement>$('password')
let connectButton = <HTMLButtonElement>$('connect')
let disconnectButton = <HTMLButtonElement>$('disconnect')
let rememberMeCheckbox = <HTMLInputElement>$('rememberMe')
let connectionStatusCode: number = null
let rememberLoginInfo: boolean = null

/**
 * HTML中用于显示状态的元素集合。
 */
const StatusBoxes = [
    $('statusNotConnected'),
    $('statusConnecting'),
    $('statusConnected'),
    $('statusDisconnecting')
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
        chrome.runtime.sendMessage(msg('query', { what: 'connection status' }), (response) => {
            connectionStatusCode = response.msg
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
    if (statusCode === VpnConnectionStatus['connected']) {
        connectButton.style.display = 'none'
        disconnectButton.style.removeProperty('display')
    } else if (statusCode === VpnConnectionStatus['not_connected']) {
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


/**
 * 连接按钮点击事件。向background发送登录用的数据。
 */
connectButton.addEventListener('click', () => {
    changeStatus(VpnConnectionStatus['connecting'])
    let loginInfo = {
        id: nameInput.value,
        pwd: pwdInput.value
    }
    chrome.runtime.sendMessage(msg('login', loginInfo), (response) => {
        if (response.msg === 'invalid') {
            changeStatus(VpnConnectionStatus['not_connected'])
            util.requestBackgroundAlert(chrome.i18n.getMessage('checkLoginIdMessage'))
        }
    })
})

/**
 * 断开按钮点击事件。
 */
disconnectButton.addEventListener('click', () => {
    changeStatus(VpnConnectionStatus['disconnecting'])
    chrome.runtime.sendMessage(msg('logout', null))
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
const onMessageListener = (message: types.Message, sender, sendResponse: types.ResponseFunction) => {
    if (message.type === 'change_status') {
        changeStatus(message.content.changeTo)
    }
    if (message.content.reason === 'login successful') {
        saveLoginInfo()
    }
    else if (message.content.reason === 'login failed') {
        util.requestBackgroundAlert(chrome.i18n.getMessage('loginFailMessage'))
    }
}

chrome.runtime.onMessage.addListener(onMessageListener)

const createNotification = (PopupNotificationOn: boolean) => {
    if (PopupNotificationOn !== false) {
        chrome.notifications.create('AboutExtension', {
            type: 'basic',
            iconUrl: './img/about.png',
            title: chrome.i18n.getMessage('aboutExtensionTitle'),
            message: chrome.i18n.getMessage('aboutExtensionMessage'),
            contextMessage: chrome.i18n.getMessage('aboutExtensionContextMessage'),
            buttons: [
                { title: chrome.i18n.getMessage('aboutExtensionButtonTitle') }
            ]
        })
    }
}

const buttonClickListener = (notificationId: string, buttonIndex: number) => {
    chrome.storage.local.set({ PopupNotificationOn: false })
}

chrome.notifications.onButtonClicked.addListener(buttonClickListener)

document.addEventListener('DOMContentLoaded', () => {
    queryConnectionStatus().then(() =>
        changeStatus(connectionStatusCode)
    )
    util.getLocalStorage([
        'PopupNotificationOn',
        'rememberMe',
        'name',
        'password'
    ]).then((result) => {
        createNotification(result.PopupNotificationOn)
        return result
    }).then((result) => {
        rememberMeCheckbox.checked = result.rememberMe
        if (result.rememberMe && result.name !== null && result.password !== null) {
            nameInput.value = result.name
            pwdInput.value = result.password
        }
    })
})
