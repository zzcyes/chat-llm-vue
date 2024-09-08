import Dexie from 'dexie'
import { Conversation } from './ChatDataType'

class ChatDatabase extends Dexie {
  conversations!: Dexie.Table<Conversation, number>

  constructor() {
    super('ChatDatabase')
    this.version(1).stores({
      conversations: '++id, title'
    })
  }
}

const db = new ChatDatabase()

export function useIndexedDB() {
  const getAll = async (): Promise<Conversation[]> => {
    return await db.conversations.toArray()
  }

  const add = async (conversation: Conversation): Promise<number> => {
    return await db.conversations.add(conversation)
  }

  const update = async (id: number, conversation: Partial<Conversation>): Promise<number> => {
    const updateData: Partial<Conversation> = {}
    if (conversation.title !== undefined) {
      updateData.title = conversation.title
    }
    if (conversation.messages !== undefined) {
      updateData.messages = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        position: msg.position,
        type: msg.type,
        _id: msg._id,
        error: msg.error
      }))
    }
    return await db.conversations.update(id, updateData)
  }

  const remove = async (id: number): Promise<void> => {
    await db.conversations.delete(id)
  }

  const getById = async (id: number): Promise<Conversation | undefined> => {
    return await db.conversations.get(id)
  }

  const clearAll = async (): Promise<void> => {
    await db.conversations.clear()
  }

  return { getAll, add, update, remove, getById, clearAll }
}
