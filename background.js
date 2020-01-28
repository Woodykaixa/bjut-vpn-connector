class VpnConnector {

    id = ''
    pwd = ''
    postData = ''
    static ConnectionStatus = 'not connected'
    static VpnUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/login'

    constructor() {
    }

    setLoginInfo(loginId, password) {
        this.id = loginId
        this.pwd = password
        this.postData = `method=&uname=${this.id}&pwd1=${this.pwd}&pwd2=
            &pwd=${this.pwd}&submitbutton=%E7%99%BB%E5%BD%95`
    }

    tryConnect() {
        let postData = connector.postData
        let request = new XMLHttpRequest()
        ConnectionStatus = 'connecting'
        request.open('POST', VpnConnector.VpnUrl, false)
        request.send(postData)
        return request.responseURL
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
        let url = connector.tryConnect()
        return url
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
