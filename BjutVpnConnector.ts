import { msg } from './util'


export enum VpnConnectionStatus {
    not_connected,
    connecting,
    connected,
    disconnecting
}

export class VpnConnector {

    static readonly LoginUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/login'
    static readonly LogoutUrl = 'https://vpn.bjut.edu.cn/prx/000/http/localhost/logout'
    static readonly WebVpnUrl = 'https://webvpn.bjut.edu.cn'
    static HidePassword: boolean
    private id: string
    private pwd: string
    private statusCode: number
    private postData: string

    constructor(hidePassword: boolean) {
        console.info('VpnConnector created')
        this.id = ''
        this.pwd = ''
        this.postData = ''
        this.statusCode = VpnConnectionStatus['not_connected']
        VpnConnector.HidePassword = hidePassword
        console.info('日志是否隐藏密码: ' + VpnConnector.HidePassword)

    }

    public getStatusCode() {
        console.info(`VpnConnector连接状态为: ${VpnConnectionStatus[this.statusCode]},
            状态码: ${this.statusCode}`)
        return this.statusCode
    }

    public setStatusCode(statusCode: number) {
        console.info('VpnConnector连接状态修改为: ' + statusCode)
        this.statusCode = statusCode
    }

    /**
     * 设置登录信息
     */
    setLoginInfo(loginId: string, password: string) {
        console.info('设置登录信息')
        console.info('  用户名: ' + loginId)
        console.info(`  密码:  ${VpnConnector.HidePassword ? `<password len=${password.length}>` : password}`)
        this.id = loginId
        this.pwd = password
        this.postData = `method=&uname=${this.id}&pwd1=${this.pwd}&pwd2=
            &pwd=${this.pwd}&submitbutton=%E7%99%BB%E5%BD%95`
    }

    /**
     * 告知popup更改连接状态,更改为VpnConnector.ConnectionStatus
     * @param reason 更改原因
     */
    announceStatusChanged(reason: string) {
        console.info(`请求修改popup页面状态为: code ${this.statusCode}, 因为: ${reason}`)
        chrome.runtime.sendMessage(msg('change_status', {
            changeTo: this.statusCode,
            reason: reason
        }))
    }

    tryConnect() {
        console.info('开始连接vpn')
        let request = new XMLHttpRequest()
        this.setStatusCode(VpnConnectionStatus['connecting'])
        request.open('POST', VpnConnector.LoginUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.responseURL.indexOf('welcome') !== -1) {
                    this.setStatusCode(VpnConnectionStatus['connected'])
                    this.announceStatusChanged('login successful')
                } else {
                    this.setStatusCode(VpnConnectionStatus['not_connected'])
                    this.announceStatusChanged('login failed')
                }
            }
        }
        request.send(this.postData)
    }

    tryDisconnect() {
        this.setStatusCode(VpnConnectionStatus['disconnecting'])
        let request = new XMLHttpRequest()
        request.open('GET', VpnConnector.LogoutUrl, true)
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                this.setStatusCode(VpnConnectionStatus['not_connected'])
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