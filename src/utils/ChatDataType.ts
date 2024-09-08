export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  position?: 'left' | 'right'
  type?: 'text' | 'markdown' | 'code'
  _id?: string
  error?: boolean
}

export interface Conversation {
  id?: number
  title: string
  messages: ChatMessage[]
}
