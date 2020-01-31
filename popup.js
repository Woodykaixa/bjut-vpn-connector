/**
 * 通过id获取HTML元素，有点像JQuery那个$。但是想到没准以后要用JQuery，所以
 * 换了个名字。直接调这个函数能少写一笔是一笔。
 * @param {string} id 
 */
const getElement = (id) => {
    return document.getElementById(id)
}

/**
 * 本函数返回在 @file background.js 和 @file popup.js 之间通信使用的
 * 消息对象。由于import引发了以下错误:
 *   Uncaught SyntaxError: Cannot use import statement outside a module
 * 加上函数的实现极其简单，我懒得配置webpack，所以就在两个文件中定义了相同的
 * 函数。
 * @param {string} type 消息类型
 * @param {any} content 消息内容
 */
const msg = (type, content) => {
    return {
        type: type,
        content: content
    }
}
let nameInput = getElement("studentId")
let connectButton = getElement('connect')
let disconnectButton = getElement('disconnect')
let rememberMeCheckbox = getElement('rememberMe')
let ConnectionStatus = null
let rememberLoginInfo = null


/**
 * 将VpnConnector的ConnectionStatus转为数组下标。与StatusBoxes配合使用，则可以
 * 根据不同的连接状态显示不同的图片。
 */
const StatusToCode = {
    not_connected: 0,
    connecting: 1,
    connected: 2,
    disconnecting: 3
}

/**
 * HTML中用于显示状态的元素集合。第一个是null因为未连接状态什么都不显示。第二个是正在连接的那个转圈图片。
 * 第三个是已连接的绿色对勾。与StatusToCode使用可以实现根据 VpnConnector.ConnectionStatus 获取对应的
 * HTML元素。
 * @example
 *  从background获取了当前连接状态 s
 *      let s = 'connecting'
 *      let box = StatusBoxes[StatusToCode[s]]
 *  box就是vpn_login.html中id为'statusConnecting'的元素，也就是那个转圈的。
 */
const StatusBoxes = [
    getElement('statusNotConnected'),
    getElement('statusConnecting'),
    getElement('statusConnected'),
    getElement('statusDisconnecting')
]
/**
 * 改变vpn_login.html中显示的连接状态
 * @param {string} status 想要页面显示的连接状态
 */
const changeDisplayedStatus = (status) => {
    StatusBoxes.forEach((element) => {
        element.style.display = 'none'
    })
    StatusBoxes[StatusToCode[status]].style.removeProperty('display')
}

/**
 * 向background获取Vpn的连接状态，并根据获得的状态改变网页中显示的状态
 * response = { msg: any }
 * @param {Function} extraFunction 获得response之后的动作
 */
const queryConnectionStatus = (extraFunction) => {
    chrome.runtime.sendMessage(msg('query', { what: 'connection status' }), (response) => {
        ConnectionStatus = response.msg
        if (extraFunction) {
            extraFunction()
        }
    })
}

/**
 * 将popup端的连接状态改变为@param status
 * @param {string} status 想要切换的连接状态
 */
const changeStatus = (status) => {
    console.info('修改连接状态为: ' + status)
    if (status === null) {
        console.info('Connection Status is null.')
        return
    }
    changeDisplayedStatus(status)
    if (status === 'connected') {
        connectButton.disabled = true
        connectButton.style.display = 'none'
        disconnectButton.disabled = false
        disconnectButton.style.removeProperty('display')
    } else if (status === 'not_connected') {
        disconnectButton.disabled = true
        disconnectButton.style.display = 'none'
        connectButton.disabled = false
        connectButton.style.removeProperty('display')
    }
}

const saveLoginInfo = () => {
    if (rememberLoginInfo) {
        let theId = getElement('studentId').value
        let thePassword = getElement('password').value
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
                    getElement('studentId').value = result.name
                    getElement('password').value = result.password
                }
            })
        }
    })
}

/**
 * 连接按钮点击事件。向background发送登录用的数据。
 */
connectButton.addEventListener('click', () => {
    changeStatus('connecting')
    let loginInfo = {
        id: getElement('studentId').value,
        pwd: getElement('password').value
    }
    chrome.runtime.sendMessage(msg('login', loginInfo), (response) => {
        if (response.msg === 'invalid') {
            changeStatus('not_connected')
            alert('请检查用户名是否输入正确')
        }
    })
})


/**
 * 断开按钮点击事件。
 */
disconnectButton.addEventListener('click', () => {
    changeStatus('disconnecting')
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
 * @param {{type:string,content:any}} message 
 * @param {*} sender 
 * @param {function ({msg:any}) } sendResponse 使用这个函数回应消息
 */
const onMessageListener = (message, sender, sendResponse) => {
    if (message.type === 'change_status') {
        changeStatus(message.content.changeTo)
    }
    if (message.content.reason === 'login successful') {
        saveLoginInfo()
    }
    else if (message.content.reason === 'login failed') {
        alert('连接失败，请检查密码')
    }
}

chrome.runtime.onMessage.addListener(onMessageListener)

/**
 * 向DOM添加监听器，DOM加载完成时向background查询Vpn连接状态
 */
document.addEventListener('DOMContentLoaded', () => {
    queryConnectionStatus(() => {
        changeStatus(ConnectionStatus)
    })
    getLocalLoginInfo()
})
