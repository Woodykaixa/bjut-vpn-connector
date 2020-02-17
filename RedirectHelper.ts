
export enum RedirectionType {
    vpnRedirect,
    autoRedirect,
    noRedirect
}

export const getRedirectionType = (url: string) => {
    if (/^https?:\/\/my(svr)?\.bjut\.edu\.cn\/.*$/.test(url)) {
        return RedirectionType.autoRedirect
    }
    else if (/^https?:\/\/(?!vpn)[^.]+\.bjut\.edu\.cn\/.*$/.test(url) &&
        url.indexOf('webvpn') === -1) {
        return RedirectionType.vpnRedirect
    } else {
        return RedirectionType.noRedirect
    }
}

export const makeVpnRedirectUrl = (url: string) => {
    let redirectUrl = url.replace(/^http:\/\//, 'https://vpn.bjut.edu.cn/prx/000/http/')
    if (redirectUrl === url) {
        redirectUrl = url.replace(/^https:\/\//, 'https://vpn.bjut.edu.cn/prx/000/https/')
    }
    console.info('原url: ' + url)
    console.info('重定向至: ' + redirectUrl)
    return redirectUrl
}