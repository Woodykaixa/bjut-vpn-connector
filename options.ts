import { $, msg } from './util'
import * as util from './util'
let popupSwitch = <HTMLInputElement>$('popupSwitch')
let autoRedirectSwitch = <HTMLInputElement>$('autoRedirectSwitch')
let contextMenuSwitch = <HTMLInputElement>$('contextMenuSwitch')

const announceOptionsChanged = (option: string, changeTo: boolean) => {
    chrome.runtime.sendMessage(msg('optionsChanged', {
        option,
        changeTo
    }))
}

popupSwitch.addEventListener('click', () => {
    chrome.storage.local.set({ PopupNotificationOn: popupSwitch.checked })
})

autoRedirectSwitch.addEventListener('click', () => {
    chrome.storage.local.set({ AutoRedirectOn: autoRedirectSwitch.checked })
    announceOptionsChanged('AutoRedirectOn', autoRedirectSwitch.checked)
})

contextMenuSwitch.addEventListener('click', () => {
    let optionContextMenuOn = contextMenuSwitch.checked
    let msg = `网址导航功能已${optionContextMenuOn ? '开启' : '关闭'}，请重新加载本扩展或重启浏览器以应用设置`
    util.checkPermissions(['contextMenus']).then((granted) => {
        util.requestBackgroundAlert(msg)
        if (granted && !optionContextMenuOn) {
            chrome.permissions.remove({ permissions: ['contextMenus'] })
        } else if (!granted && optionContextMenuOn) {
            chrome.permissions.request({ permissions: ['contextMenus'] })
        }
    })
})

document.addEventListener('DOMContentLoaded', () => {
    util.getLocalStorage(['PopupNotificationOn', 'AutoRedirectOn']).then((result) => {
        popupSwitch.checked = (result.PopupNotificationOn === true)
        autoRedirectSwitch.checked = (result.AutoRedirectOn === true)
    })
    util.checkPermissions(['contextMenus']).then((granted) => {
        contextMenuSwitch.checked = granted
    })
})