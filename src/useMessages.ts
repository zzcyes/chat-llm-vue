import { ref, computed } from 'vue'

function getRandomString() {
  const x = 2147483648
  return (
    Math.floor(Math.random() * x).toString(36) +
    // eslint-disable-next-line no-bitwise
    Math.abs(Math.floor(Math.random() * x) ^ Date.now()).toString(36)
  )
}

type Messages = MessageProps[]

type MessageWithoutId = Omit<MessageProps, '_id'> & {
  _id?: MessageId
}

const TIME_GAP = 5 * 60 * 1000
let lastTs = 0

const makeMsg = (msg: MessageWithoutId, id?: MessageId) => {
  const ts = msg.createdAt || Date.now()
  const hasTime = msg.hasTime || ts - lastTs > TIME_GAP

  if (hasTime) {
    lastTs = ts
  }

  return {
    ...msg,
    _id: msg._id || id || getRandomString(),
    createdAt: ts,
    position: msg.position || 'left',
    hasTime
  }
}

export function useMessages(initialState: (MessageWithoutId | any)[] = []) {
  const messages = ref<Messages>(initialState.map((msg) => makeMsg(msg)))

  const prependMsgs = (msgs: Messages) => {
    messages.value = [...msgs, ...messages.value]
  }

  const updateMsg = (id: MessageId, msg: MessageWithoutId) => {
    messages.value = messages.value.map((m) => (m._id === id ? makeMsg(msg, id) : m))
  }

  const appendMsg = (msg: MessageWithoutId) => {
    const newMsg = makeMsg(msg)
    messages.value = [...messages.value, newMsg]
  }

  const deleteMsg = (id: MessageId) => {
    messages.value = messages.value.filter((m) => m._id !== id)
  }

  const resetList = (list: MessageWithoutId[] = []) => {
    messages.value = list.map((msg) => makeMsg(msg))
  }

  return {
    messages: computed(() => messages.value),
    prependMsgs,
    appendMsg,
    updateMsg,
    deleteMsg,
    resetList
  }
}

export type MessageId = string | number

export interface MessageProps {
  /**
   * 唯一ID
   */
  _id: MessageId
  /**
   * 消息类型
   */
  type: string
  /**
   * 消息内容
   */
  content?: any
  /**
   * 消息创建时间
   */
  createdAt?: number
  /**
   * 消息发送者信息
   */
  user?: User
  /**
   * 消息位置
   */
  position?: 'left' | 'right' | 'center' | 'pop'
  /**
   * 是否显示时间
   */
  hasTime?: boolean
  /**
   * 状态
   */
  status?: IMessageStatus
  /**
   * 消息内容渲染函数
   */
  renderMessageContent?: (message: MessageProps) => any
}

export type IMessageStatus = 'pending' | 'sent' | 'fail'

export interface User {
  avatar?: string
  name?: string
  url?: string
  [k: string]: any
}
