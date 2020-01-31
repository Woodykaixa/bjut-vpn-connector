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

/**
 * 隐藏密码
 * @param {string} password
 */
const wrapPassword = (password) => {
    if (HidePassword) {
        return `<password len=${password.length}>`
    }
    return password
}


class VpnConnector {

    static LoginUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/login'
    static LogoutUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/logout'

    constructor() {
        console.info('VpnConnector created')
        this._id = ''
        this._pwd = ''
        this._postData = ''
        this._ConnectionStatus = 'not_connected'
    }

    get postData() {
        return this._postData
    }

    get ConnectionStatus() {
        console.info('VpnConnector连接状态为: ' + this._ConnectionStatus)
        return this._ConnectionStatus
    }

    set ConnectionStatus(s) {
        console.info('VpnConnector连接状态修改为: ' + s)
        this._ConnectionStatus = s
    }

    /**
     * 设置登录信息
     * @param {string} loginId 
     * @param {string} password 
     */
    setLoginInfo(loginId, password) {
        console.info('设置登录信息')
        console.info('  用户名: ' + loginId)
        console.info('  密码: ' + wrapPassword(password))
        this._id = loginId
        this._pwd = password
        this._postData = `method=&uname=${this._id}&pwd1=${this._pwd}&pwd2=
            &pwd=${this._pwd}&submitbutton=%E7%99%BB%E5%BD%95`
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
            console.info('原url: ' + url)
            console.info('重定向至: ' + redirectUrl)
            return redirectUrl
        }
    }

    /**
     * 告知popup更改连接状态,更改为VpnConnector.ConnectionStatus
     * @param {string} reason 更改原因
     */
    announceStatusChanged(reason) {
        console.info(`请求修改popup页面状态为: ${this.ConnectionStatus}, 因为: ${reason}`)
        chrome.runtime.sendMessage(msg('change_status', {
            changeTo: this.ConnectionStatus,
            reason: reason
        }))
    }

    tryConnect() {
        console.info('开始连接vpn')
        let request = new XMLHttpRequest()
        this.ConnectionStatus = 'connecting'
        request.open('POST', VpnConnector.LoginUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.responseURL.indexOf('welcome') !== -1) {
                    this.ConnectionStatus = 'connected'
                    this.announceStatusChanged('login successful')
                } else {
                    this.ConnectionStatus = 'not_connected'
                    this.announceStatusChanged('login failed')
                }
            }
        }
        request.send(this.postData)
    }

    tryDisconnect() {
        VpnConnector.ConnectionStatus = 'disconnecting'
        let request = new XMLHttpRequest()
        request.open('GET', VpnConnector.LogoutUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                this.ConnectionStatus = 'not_connected'
                this.announceStatusChanged('logout successful')
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
        console.info('用户名错误，拒绝尝试连接')
        return 'invalid'
    }
}

/**
 * 处理查询请求
 * @param {{what:string}} content 查询内容
 */
const handleQuery = (content) => {
    if (content.what === 'connection status') {
        return connector.ConnectionStatus
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
    if (connector.ConnectionStatus !== 'connected') {
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

const HidePassword = true
let connector = null
document.addEventListener('DOMContentLoaded', () => {
    console.info('日志是否隐藏密码: ' + HidePassword);
    connector = new VpnConnector()
})