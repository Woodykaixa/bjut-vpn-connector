import * as common from "./common"

/**
 * 隐藏密码
 * @param {string} password
 */
const wrapPassword = (password: string) => {
    if (HidePassword) {
        return `<password len=${password.length}>`
    }
    return password
}

class VpnConnector {

    static readonly LoginUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/login'
    static readonly LogoutUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/logout'
    private id: string
    private pwd: string
    private ConnectionStatus: number
    private postData: string

    constructor() {
        console.info('VpnConnector created')
        this.id = ''
        this.pwd = ''
        this.postData = ''
        this.ConnectionStatus = common.ConnectionStatus['not_connected']
    }

    public getConnectionStatus() {
        console.info(`VpnConnector连接状态为: ${common.ConnectionStatus[this.ConnectionStatus]},
            状态码: ${this.ConnectionStatus}`)
        return this.ConnectionStatus
    }

    public setConnectionStatus(statusCode: number) {
        console.info('VpnConnector连接状态修改为: ' + statusCode)
        this.ConnectionStatus = statusCode
    }

    /**
     * 设置登录信息
     */
    setLoginInfo(loginId: string, password: string) {
        console.info('设置登录信息')
        console.info('  用户名: ' + loginId)
        console.info('  密码: ' + wrapPassword(password))
        this.id = loginId
        this.pwd = password
        this.postData = `method=&uname=${this.id}&pwd1=${this.pwd}&pwd2=
            &pwd=${this.pwd}&submitbutton=%E7%99%BB%E5%BD%95`
    }
    /**
     * 生成以 https://vpn.bjut.edu.cn/prx/000/ 为前缀的重定向链接
     */
    static makeRedirectUrl(url: string) {
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
     * @param reason 更改原因
     */
    announceStatusChanged(reason: string) {
        console.info(`请求修改popup页面状态为: code ${this.ConnectionStatus}, 因为: ${reason}`)
        chrome.runtime.sendMessage(common.msg('change_status', {
            changeTo: this.ConnectionStatus,
            reason: reason
        }))
    }

    tryConnect() {
        console.info('开始连接vpn')
        let request = new XMLHttpRequest()
        this.setConnectionStatus( common.ConnectionStatus['connecting'])
        request.open('POST', VpnConnector.LoginUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.responseURL.indexOf('welcome') !== -1) {
                    this.setConnectionStatus( common.ConnectionStatus['connected'])
                    this.announceStatusChanged('login successful')
                } else {
                    this.setConnectionStatus( common.ConnectionStatus['not_connected'])
                    this.announceStatusChanged('login failed')
                }
            }
        }
        request.send(this.postData)
    }

    tryDisconnect() {
        this.setConnectionStatus( common.ConnectionStatus['disconnecting'])
        let request = new XMLHttpRequest()
        request.open('GET', VpnConnector.LogoutUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                this.setConnectionStatus( common.ConnectionStatus['not_connected'])
                this.announceStatusChanged('logout successful')
            }
        }
        request.send()
    }

    /**
     * 判断登录id是否合法。应为8位数字
     * @param loginId 
     */
    static isValidId(loginId: string) {
        return /^\d{8}$/.test(loginId)
    }

}

/**
 * 处理登录请求
 * @param content 
 */
const handleLogin = (content: common.LoginContent) => {
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
 * @param content 查询内容
 */
const handleQuery = (content: common.QueryContent) => {
    if (content.what === 'connection status') {
        return connector.getConnectionStatus()
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

const handleBackgroundAlert = (content: string) => {
    alert(content)
}

const handler = {
    login: handleLogin,
    query: handleQuery,
    logout: handleLogout,
    alert: handleBackgroundAlert
}

/**
 * 接收popup消息的监听器。
 * @param message 
 * @param sender 
 * @param sendResponse 使用这个函数回应消息
 */
const onMessageListener = (message: common.Message, sender, sendResponse: common.ResponseFunction) => {
    const type = message.type
    const content = message.content
    let responseMsg = handler[type](content)
    sendResponse({ msg: responseMsg })
}

chrome.runtime.onMessage.addListener(onMessageListener)

/**
 * 在请求发生前调用，重定向链接。
 */
const onBeforeRequestListener = (detail: chrome.webRequest.WebRequestBodyDetails)
    : chrome.webRequest.BlockingResponse | void => {
    if (connector.getConnectionStatus() !== common.ConnectionStatus['connected']) {
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
let connector: VpnConnector = null
document.addEventListener('DOMContentLoaded', () => {
    console.info('日志是否隐藏密码: ' + HidePassword);
    connector = new VpnConnector()
})