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

class VpnConnector {

    id = ''
    pwd = ''
    postData = ''
    cookies = null
    static ConnectionStatus = 'not_connected'
    static VpnUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/login'

    constructor() {
    }

    setLoginInfo(loginId, password) {
        this.id = loginId
        this.pwd = password
        this.postData = `method=&uname=${this.id}&pwd1=${this.pwd}&pwd2=
            &pwd=${this.pwd}&submitbutton=%E7%99%BB%E5%BD%95`
    }

    static makeRedirectUrl(url) {
        if (detail.url.indexOf('http://') != -1) {
            alert('链接将重定向至:https://vpn.bjut.edu.cn/prx/000/http/' +
                detail.url.substring(7)
            )
            return 'https://vpn.bjut.edu.cn/prx/000/http/' +
                detail.url.substring(7)
        } else if (detail.url.indexOf('https://') != -1) {
            alert('链接将重定向至:https://vpn.bjut.edu.cn/prx/000/http/' +
                detail.url.substring(8)
            )
            return 'https://vpn.bjut.edu.cn/prx/000/http/' +
                detail.url.substring(8)
        }
    }

    tryConnect() {
        let postData = connector.postData
        let request = new XMLHttpRequest()
        VpnConnector.ConnectionStatus = 'connecting'
        request.open('POST', VpnConnector.VpnUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                alert(request.responseURL.indexOf('welcome') !== -1)
                if (request.responseURL.indexOf('welcome') !== -1) {
                    VpnConnector.ConnectionStatus = 'connected'
                    chrome.runtime.sendMessage(msg('change_status', 'connected'))
                    chrome.webRequest.onBeforeRequest.addListener((detail) => {
                        if (detail.url.indexOf('http://') != -1) {
                            alert('链接将重定向至:https://vpn.bjut.edu.cn/prx/000/http/' +
                                detail.url.substring(7)
                            )
                            return {
                                redirectUrl: 'https://vpn.bjut.edu.cn/prx/000/http/' +
                                    detail.url.substring(7)
                            }
                        }
                    }, { urls: ['*://*.bjut.edu.cn/*'] }, ['blocking'])
                }
                chrome.cookies.getAll({
                    domain: 'vpn.bjut.edu.cn'
                }, (cookies) => {
                    connector.cookies = cookies
                    alert(JSON.stringify(cookies))
                })
            }
        }
        request.send(postData)
    }

    static isValidId(loginId) {
        return /^\d{8}$/.test(loginId)
    }

}


let connector = null
document.addEventListener('DOMContentLoaded', () => {
    connector = new VpnConnector()
})

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

const handleQuery = (content) => {
    if (content.what === 'connection status') {
        return VpnConnector.ConnectionStatus
    }
    return `cannot query content: ${content.what}`
}

const handler = {
    login: handleLogin,
    query: handleQuery
}

const onMessageListener = (message, sender, sendResponse) => {
    const type = message.type
    const content = message.content
    let responseMsg = handler[type](content)
    sendResponse({ msg: responseMsg })
}

chrome.runtime.onMessage.addListener(onMessageListener)
