import { msg, checkPermissions } from './common'
let popupSwitch = <HTMLInputElement>document.getElementById('popupSwitch')
let autoRedirectSwitch = <HTMLInputElement>document.getElementById('autoRedirectSwitch')
let contextMenuSwitch = <HTMLInputElement>document.getElementById('contextMenuSwitch')

const announceOptionsChanged = (option: string, changeTo: boolean) => {
    chrome.runtime.sendMessage(msg('optionsChanged', {
        option,
        changeTo
    }))
}


const requestBackgroundAlert = (message: string) => {
    chrome.runtime.sendMessage(msg('alert', message))
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
    checkPermissions(['contextMenus']).then((granted) => {
        requestBackgroundAlert(msg)
        if (granted && !optionContextMenuOn) {
            chrome.permissions.remove({ permissions: ['contextMenus'] })
        } else if (!granted && optionContextMenuOn) {
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
        contextMenuSwitch.checked = granted
    })
})