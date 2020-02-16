import { msg, checkPermissions } from './common'
let popupSwitch = <HTMLInputElement>document.getElementById('popupSwitch')
let autoRedirectSwitch = <HTMLInputElement>document.getElementById('autoRedirectSwitch')
let contextMenuSwitch = <HTMLInputElement>document.getElementById('contextMenuSwitch')

popupSwitch.addEventListener('click', () => {
    chrome.storage.local.set({ PopupNotificationOn: popupSwitch.checked })
})

autoRedirectSwitch.addEventListener('click', () => {
    chrome.storage.local.set({ AutoRedirectOn: autoRedirectSwitch.checked })
    chrome.runtime.sendMessage(msg('optionsChanged', {
        option: 'AutoRedirectOn',
        changeTo: autoRedirectSwitch.checked
    }))
})

contextMenuSwitch.addEventListener('click', () => {
    let optionContextMenuOn = contextMenuSwitch.checked
    checkPermissions(['contextMenus']).then((granted) => {
        if (granted && !optionContextMenuOn) {
            console.log(`移除授权`)
            chrome.permissions.remove({ permissions: ['contextMenus'] })
        } else if (!granted && optionContextMenuOn) {
            console.log(`获取授权`)
            chrome.permissions.request({ permissions: ['contextMenus'] })
        }
    })
})

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get([
        'PopupNotificationOn',
        'AutoRedirectOn'
    ], (result) => {
        popupSwitch.checked = (result.PopupNotificationOn === true)
        autoRedirectSwitch.checked = (result.AutoRedirectOn === true)
    })
    checkPermissions(['contextMenus']).then((granted) => {
        console.log(`授权状态: ${granted}`)
        contextMenuSwitch.checked = granted
    })
})