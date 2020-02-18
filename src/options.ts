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
    let msg = chrome.i18n.getMessage(`webSiteGuidance${optionContextMenuOn ? 'On' : 'Off'}`)
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