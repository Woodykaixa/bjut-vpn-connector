import * as types from './types'
import * as helper from './RedirectHelper'
import { SiteMenuCreator } from './BjutSitesMenu'
import { getLocalStorage, checkPermissions } from './util'
import { VpnConnector, VpnConnectionStatus } from './BjutVpnConnector'

const handleLogin = (content: types.LoginContent) => {
    let id = content.id
    let password = content.pwd
    if (VpnConnector.isValidId(id)) {
        connector.setLoginInfo(id, password)
        connector.tryConnect()
        return 'posted'
    } else {
        console.info('用户名格式错误，拒绝尝试连接')
        return 'invalid'
    }
}

const handleQuery = (content: types.QueryContent) => {
    if (content.what === 'connection status') {
        return connector.getStatusCode()
    }
    return `cannot query content: ${content.what}`
}

const handleLogout = () => {
    connector.tryDisconnect()
    return 'posted'
}

const handleBackgroundAlert = (content: string) => {
    alert(content)
}

const handleChangeOption = (content: any) => {
    console.log(`选项${content.option}状态改变为${content.changeTo}`)
    if (content.option === 'AutoRedirectOn') {
        autoRedirectOn = content.changeTo
    }
}

const handler = {
    login: handleLogin,
    query: handleQuery,
    logout: handleLogout,
    alert: handleBackgroundAlert,
    optionsChanged: handleChangeOption
}

/**
 * 处理从popup和options发来的消息
 */
const handleMessage = (message: types.Message, sender, sendResponse: types.ResponseFunction) => {
    const type = message.type
    const content = message.content
    let responseMsg = handler[type](content)
    sendResponse({ msg: responseMsg })
}

chrome.runtime.onMessage.addListener(handleMessage)

/**
 * 在请求发生前调用，重定向链接。
 */
const onBeforeRequestListener = (detail: chrome.webRequest.WebRequestBodyDetails)
    : chrome.webRequest.BlockingResponse | void => {
    const type = helper.getRedirectionType(detail.url)
    switch (type) {
        case helper.RedirectionType.noRedirect:
            console.log(`链接无需重定向: ${detail.url}`)
            return null
        case helper.RedirectionType.vpnRedirect:
            if (connector.getStatusCode() !== VpnConnectionStatus['connected']) {
                console.log(`VPN未连接，不进行重定向: ${detail.url}`)
                return null
            }
            let RedirectUrl = helper.makeVpnRedirectUrl(detail.url)
            console.log(`VPN已连接，将url: ${detail.url} 重定向至 ${RedirectUrl}`)
            return {
                redirectUrl: RedirectUrl
            }
        case helper.RedirectionType.autoRedirect:
            let request = new XMLHttpRequest()
            try {
                request.open('GET', 'https://my.bjut.edu.cn', false)
                request.send()
                console.log(`校园网环境，无需重定向: ${detail.url}`)
                return null
            } catch (e) {
                if (autoRedirectOn) {
                    console.log(`非校园网环境，自动重定向: ${detail.url}`)
                    return {
                        redirectUrl: VpnConnector.WebVpnUrl
                    }
                }
                console.log(`自动重定向未启用: ${detail.url}`)
                return null
            }
    }
}

chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestListener,
    { urls: ['*://*.bjut.edu.cn/*'] },
    ['blocking']
)

let connector: VpnConnector = null
let menuCreator: SiteMenuCreator = null
let autoRedirectOn: boolean = false

document.addEventListener('DOMContentLoaded', () => {
    connector = new VpnConnector(true)
    menuCreator = new SiteMenuCreator('BJUTNetworkHelperRightClickMenu',
        '北京工业大学网址导航')
    getLocalStorage(['AutoRedirectOn']).then((result) => {
        autoRedirectOn = (result.AutoRedirectOn === true)
        console.log(`非校园网环境自动重定向功能是否启用：${autoRedirectOn}`)
    })
    checkPermissions(['contextMenus']).then((granted) => {
        if (granted) {
            menuCreator.createSiteMenu()
        }
    })
})
