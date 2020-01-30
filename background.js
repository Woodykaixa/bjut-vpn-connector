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

class VpnConnector {

    id = ''
    pwd = ''
    postData = ''
    cookies = null
    static ConnectionStatus = 'not_connected'
    static LoginUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/login'
    static LogoutUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/logout'

    constructor() {
    }
    /**
     * 设置登录信息
     * @param {string} loginId 
     * @param {string} password 
     */
    setLoginInfo(loginId, password) {
        this.id = loginId
        this.pwd = password
        this.postData = `method=&uname=${this.id}&pwd1=${this.pwd}&pwd2=
            &pwd=${this.pwd}&submitbutton=%E7%99%BB%E5%BD%95`
    }
    /**
     * 生成以 https://vpn.bjut.edu.cn/prx/000/ 为前缀的重定向链接
     * @param {string} url 
     */
    static makeRedirectUrl(url) {
        if (/^https?:\/\/(?!vpn)[^.]+\.bjut\.edu\.cn\/.*$/.test(url)) {
            let redirectUrl = url.replace(/^http:\/\//, 'https://vpn.bjut.edu.cn/prx/000/http/')
            if (redirectUrl === url) {
                redirectUrl = url.replace(/^https:\/\//, 'https://vpn.bjut.edu.cn/prx/000/https/')
            }
            alert(redirectUrl)
            return redirectUrl
        }
    }

    static announceStatusChanged() {
        chrome.runtime.sendMessage(msg('change_status', VpnConnector.ConnectionStatus))
    }

    tryConnect() {
        let postData = this.postData
        let request = new XMLHttpRequest()
        VpnConnector.ConnectionStatus = 'connecting'
        request.open('POST', VpnConnector.LoginUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.responseURL.indexOf('welcome') !== -1) {
                    VpnConnector.ConnectionStatus = 'connected'
                    VpnConnector.announceStatusChanged()
                }
            }
        }
        request.send(postData)
    }

    tryDisconnect() {
        VpnConnector.ConnectionStatus = 'disconnecting'
        let request = new XMLHttpRequest()
        request.open('GET', VpnConnector.LogoutUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                alert(request.responseURL)
                VpnConnector.ConnectionStatus = 'not_connected'
                VpnConnector.announceStatusChanged()
            }
        }
        request.send()
    }

    /**
     * 判断登录id是否合法。应为8位数字
     * @param {string} loginId 
     */
    static isValidId(loginId) {
        return /^\d{8}$/.test(loginId)
    }

}

/**
 * 处理登录请求
 * @param {{id:string,pwd:string}} content 
 */
const handleLogin = (content) => {
    let id = content.id
    let password = content.pwd
    if (VpnConnector.isValidId(id)) {
        connector.setLoginInfo(id, password)
        connector.tryConnect()
        return 'posted'
    } else {
        return 'invalid'
    }
}

/**
 * 处理查询请求
 * @param {{what:string}} content 查询内容
 */
const handleQuery = (content) => {
    if (content.what === 'connection status') {
        return VpnConnector.ConnectionStatus
    }
    return `cannot query content: ${content.what}`
}

/**
 * 处理登出请求
 */
const handleLogout = () => {
    connector.tryDisconnect()
    return 'posted'
}

const handler = {
    login: handleLogin,
    query: handleQuery,
    logout: handleLogout
}

/**
 * 接收popup消息的监听器。
 * @param {{type:string,content:any}} message 
 * @param {*} sender 
 * @param {function ({msg:any}) } sendResponse 使用这个函数回应消息
 */
const onMessageListener = (message, sender, sendResponse) => {
    const type = message.type
    const content = message.content
    let responseMsg = handler[type](content)
    sendResponse({ msg: responseMsg })
}

chrome.runtime.onMessage.addListener(onMessageListener)

/**
 * 在请求发生前调用，重定向链接。
 */
const onBeforeRequestListener = (detail) => {
    if (VpnConnector.ConnectionStatus !== 'connected') {
        return null
    }
    return {
        redirectUrl: VpnConnector.makeRedirectUrl(detail.url)
    }

}

chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    { urls: ['*://*.bjut.edu.cn/*'] },
    ['blocking']
)

let connector = null
document.addEventListener('DOMContentLoaded', () => {
    connector = new VpnConnector()
})