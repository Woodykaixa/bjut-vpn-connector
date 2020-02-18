import { Message } from './types'
/**
 * 创建@interface Message 对象。
 * @param type 消息类型
 * @param content 消息内容
 */
export const msg = (type: string, content: any): Message => {
    return {
        type: type,
        content: content
    }
}

/**
 * 只能通过id来获取元素
 */
export const $ = (elementId: string) => {
    return document.getElementById(elementId)
}

export const checkPermissions = (permissions: string[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        chrome.permissions.contains({ permissions }, (granted: boolean) => {
            resolve(granted)
        })
    })
}

/**
 * 当popup和options想要通过 alert() 向用户传达信息时，通过此函数告知background
 * 由background来调用alert
 */
export const requestBackgroundAlert = (message: string) => {
    chrome.runtime.sendMessage(msg('alert', message))
}

/**
 * 对于经常调用的storage api进行promisify处理
 * @param items 想要获取的内容的keys
 */
export const getLocalStorage = (items: string[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(items, (result) => {
            resolve(result)
        })
    })
}