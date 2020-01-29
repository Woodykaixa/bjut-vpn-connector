const getElement = (id) => {
    return document.getElementById(id)
}

/**
 * 本函数返回在 @file background.js 和 @file vpn_login.js 之间通信使用的
 * 消息对象。由于import引发了以下错误:
 *   Uncaught SyntaxError: Cannot use import statement outside a module
 * 加上函数的实现极其简单，我懒得配置webpack，所以就在两个文件中定义了相同的
 * 函数。
 * @param {*} type 消息类型
 * @param {*} content 消息内容
 */
const msg = (type, content) => {
    return {
        type: type,
        content: content
    }
}

let connectButton = getElement('connect')

const StatusToCode = {
    not_connected: 0,
    connecting: 1,
    connected: 2
}

const StatusBoxes = [
    null,
    getElement('statusConnecting'),
    getElement('statusConnected')
]

const changeDisplayedStatus = (status) => {
    StatusBoxes.forEach((element) => {
        if (element !== null) {
            element.style.display = 'none'
        }
    })
    let box = StatusBoxes[StatusToCode[status]]
    if (box !== null) {
        box.style.removeProperty('display')
    }
}

const queryConnectionStatus = () => {
    chrome.runtime.sendMessage(msg('query', { what: 'connection status' }), (response) => {
        let status = response.msg
        changeDisplayedStatus(status)
        if (status === 'connected') {
            connectButton.disabled = true
        }

    })
}

connectButton.addEventListener('click', () => {
    changeDisplayedStatus('connecting')
    let loginInfo = {
        id: getElement('studentId').value,
        pwd: getElement('password').value
    }
    chrome.runtime.sendMessage(msg('login', loginInfo), (response) => {
        if (response.msg === 'invalid') {
            changeDisplayedStatus('not_connected')
            alert('请检查用户名是否输入正确')
        }
    })
})

const onMessageListener = (message, sender, sendResponse) => {
    if (message.type === 'change_status') {
        changeDisplayedStatus(message.content)
        connectButton.disabled = true
    }
}

chrome.runtime.onMessage.addListener(onMessageListener)

document.addEventListener('DOMContentLoaded', () => {
    queryConnectionStatus()
})