
/**
 * 本函数返回在background和popup之间通信使用的
 * 消息对象。
 * @param type 消息类型
 * @param content 消息内容
 */
export const msg = (type: string, content: any): Message => {
    return {
        type: type,
        content: content
    }
}

export interface Message {
    type: string,
    content: any
}

export interface LoginContent {
    id: string,
    pwd: string
}

export interface QueryContent {
    what: string
}

export interface ResponseMessage {
    msg: any
}

export interface ResponseFunction {
    (response?: ResponseMessage): void
}

export enum ConnectionStatus {
    not_connected,
    connecting,
    connected,
    disconnecting
}

export const checkPermissions = (permissions: string[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        chrome.permissions.contains({ permissions }, (granted: boolean) => {
            resolve(granted)
        })
    })
}