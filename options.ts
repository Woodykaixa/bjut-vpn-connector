import { msg } from './common'
let popupSwitch = <HTMLInputElement>document.getElementById('popupSwitch')
let autoRedirectSwitch = <HTMLInputElement>document.getElementById('autoRedirectSwitch')

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

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get([
        'PopupNotificationOn',
        'AutoRedirectOn'
    ], (result) => {
        popupSwitch.checked = (result.PopupNotificationOn === true)
        autoRedirectSwitch.checked = (result.AutoRedirectOn === true)
    })
})