<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import Mock from 'mockjs'
import {
  Layout,
  Button,
  Input,
  Avatar,
} from '@arco-design/web-vue'
import {
  IconMenuFold,
  IconMenuUnfold,
  IconPlus,
  IconUser,
  IconSettings,
  IconSearch,
  IconRobot,
  IconArrowUp,
  IconLoading
} from '@arco-design/web-vue/es/icon'

const md = new MarkdownIt()

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  type: 'text' | 'markdown' | 'code'
}

interface Conversation {
  id: number
  title: string
  messages: ChatMessage[]
}

const conversations = ref<Conversation[]>([])
const currentConversationId = ref(0)
const inputMessage = ref('')
const isCollapsed = ref(false)
const userName = ref('Admin')
const searchQuery = ref('')
const isLoading = ref(false)

const currentConversation = computed(() =>
  conversations.value.find((c: Conversation) => c.id === currentConversationId.value) || { id: 0, title: '新对话', messages: [] }
)

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value
  return conversations.value.filter((conv: Conversation) =>
    conv.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const startNewConversation = () => {
  const newId = conversations.value.length + 1
  conversations.value.push({ id: newId, title: `新对话 ${newId}`, messages: [] })
  currentConversationId.value = newId
}

const selectConversation = (id: number) => {
  currentConversationId.value = id
}

const chatMessagesRef = ref<HTMLDivElement | null>(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return

  const newMessage: ChatMessage = {
    role: 'user',
    content: inputMessage.value,
    type: 'text'
  }

  if (!currentConversation.value.messages.length) {
    currentConversation.value.title = inputMessage.value.slice(0, 20) + '...'
  }

  currentConversation.value.messages.push(newMessage)
  scrollToBottom()

  inputMessage.value = ''
  isLoading.value = true

  try {
    const botResponse = await simulateBotResponse()
    currentConversation.value.messages.push(botResponse)
    scrollToBottom()
  } catch (error) {
    console.error('生成回复时出错', error)
    // 可以在这里添加错误处理逻辑，比如显示一条错误消息
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const simulateBotResponse = async (): Promise<ChatMessage> => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 使用 Mockjs 生成模拟数据
  const mockResponse = Mock.mock({
    'type|1': ['text', 'markdown', 'code'],
    'content': function () {
      if (this.type === 'text') {
        return Mock.Random.sentence(5, 20)
      } else if (this.type === 'markdown') {
        return `# ${Mock.Random.title()}\n\n${Mock.Random.paragraph()}\n\n- ${Mock.Random.word()}\n- ${Mock.Random.word()}\n- ${Mock.Random.word()}`
      } else {
        return `\`\`\`python\n${Mock.Random.sentence()}\nprint("${Mock.Random.word()}")\n\`\`\``
      }
    }
  })

  return {
    role: 'bot',
    content: mockResponse.content,
    type: mockResponse.type as 'text' | 'markdown' | 'code'
  }
}

// 监听 conversations 的变化，如果为空则创建新对话
watch(conversations, (newConversations: Conversation[]) => {
  if (newConversations.length === 0) {
    startNewConversation()
  }
}, { immediate: true })
</script>

<template>
  <Layout class="chat-container">
    <Layout.Sider v-if="!isCollapsed" :width="250" class="sidebar">
      <div class="panel">
        <div class="panel-header">
          <Button @click="toggleSidebar" shape="circle">
            <IconMenuFold />
          </Button>
          <Button @click="startNewConversation" shape="circle">
            <IconPlus />
          </Button>
        </div>
        <div class="search-bar">
          <Input v-model="searchQuery" placeholder="搜索对话...">
          <template #prefix>
            <IconSearch />
          </template>
          </Input>
        </div>
        <div class="panel-content">
          <div class="conversation-list">
            <div v-for="conv in filteredConversations" :key="conv.id"
              :class="['conversation-item', { 'active': conv.id === currentConversationId }]"
              @click="selectConversation(conv.id)">
              {{ conv.title }}
            </div>
          </div>
        </div>
        <div class="panel-footer" style="padding: 0px 16px;">
          <Avatar :size="32">
            <IconUser />
          </Avatar>
          <span style="margin-left: 8px;">{{ userName }}</span>
        </div>
      </div>
    </Layout.Sider>
    <Layout class="main-content">
      <div class="panel">
        <div class="panel-header">
          <Button v-if="isCollapsed" @click="toggleSidebar" shape="circle" style="margin-right: 10px;">
            <IconMenuUnfold />
          </Button>
          <div class="conversation-title">
            <span>当前对话1: {{ currentConversation.title }}</span>
            <Button shape="circle">
              <IconSettings />
            </Button>
          </div>
        </div>
        <div class="panel-content chat-messages" ref="chatMessagesRef">
          <div class="chat-messages-body">
            <div v-for="(message, index) in currentConversation.messages" :key="index"
              :class="['message', message.role]">
              <div class="message-avatar" v-if="message.role === 'bot'">
                <Avatar :size="32">
                  <IconRobot />
                </Avatar>
              </div>
              <div class="message-content">
                <div v-if="message.type === 'text'">{{ message.content }}</div>
                <div v-else-if="message.type === 'markdown'" v-html="md.render(message.content)"></div>
                <pre v-else-if="message.type === 'code'"><code v-html="md.render(message.content)"></code></pre>
              </div>
            </div>
            <!-- 添加加载提示 -->
            <div v-if="isLoading" class="message bot">
              <div class="message-avatar">
                <Avatar :size="32">
                  <IconRobot />
                </Avatar>
              </div>
              <div class="message-content loading">
                <IconLoading />
              </div>
            </div>
          </div>
        </div>

        <div class="panel-footer input-wrapper">
          <div class="chat-input-body">
            <input v-model="inputMessage" type="text" placeholder="输入您的问题，按回车发送" @keyup.enter="sendMessage"
              class="custom-input" />
            <Button v-if="inputMessage.trim()" @click="sendMessage" shape="circle" class="send-button">
              <IconArrowUp />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  </Layout>
</template>

<style lang="less" scoped>
.chat-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: var(--color-bg-1);
}

.sidebar,
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}


.panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;

  &-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  &-footer {
    display: flex;
    align-items: center;
    height: 64px;
    border-top: 1px solid var(--color-border);
    background-color: var(--color-bg-2);
  }
}

.conversation {
  &-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &-list {
    display: flex;
    flex-direction: column;
  }

  &-item {
    padding: 10px 16px;
    border-radius: 4px;
    transition: all 0.3s;
    margin-bottom: 4px;
    font-size: 14px;
    line-height: 1.4;
    cursor: pointer;
    color: var(--color-text-1);

    &.active {
      background-color: var(--color-primary-light-1);
      color: var(--color-primary);
      font-weight: 500;
    }

    &:hover:not(.active) {
      color: var(--color-primary);
    }
  }
}

.search-bar {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}


.chat-messages {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scroll-behavior: smooth;
  width: 100%;
  padding: 0;
}

.chat-messages-body {
  width: calc(100vw - 282px);
  padding: 16px;
  align-self: center;
}

.message {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;

  &-avatar {
    flex-shrink: 0;
    margin-right: 12px;
  }

  &-content {
    flex: 0 1 auto;
    min-width: 0;
    font-size: 16px;
    line-height: 1.5;
    padding: 6px 12px;
    border-radius: 8px;
    max-width: 60%;

    &.loading {
      display: flex;
      align-items: center;
      color: var(--color-text-3);

      .arco-icon {
        margin-right: 8px;
        animation: spin 1s linear infinite;
      }
    }
  }

  &.user {
    flex-direction: row-reverse;

    .message-content {
      margin-left: 12px;
      margin-right: 0;
      background-color: var(--color-primary-light-1);
    }
  }

  &.bot .message-content {
    max-width: 80%;
    margin-right: 12px;
    background-color: var(--color-fill-2);
  }
}


.input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.chat-input-body {
  display: flex;
  align-items: center;
  width: calc(100vw - 282px);
}

.custom-input {
  flex: 1;
  border-radius: 24px;
  border: 1px solid var(--color-neutral-3);
  background-color: transparent;
  padding: 8px 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  color: var(--color-text-1);


  &:focus {
    border-color: var(--color-primary);
  }

  &::placeholder {
    color: var(--color-text-3);
  }
}

.send-button {
  margin-left: 8px;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>