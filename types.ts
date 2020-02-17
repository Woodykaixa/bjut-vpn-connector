/**
 * 在background, options和popup之间通信使用的消息类型对象
 * @property type 消息类型
 * @property content 消息内容
 */
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
