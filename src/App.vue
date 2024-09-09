<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import Mock from 'mockjs'
import {
  Layout,
  Button,
  Input,
  Avatar,
  Spin,
  Dropdown,
  Message,
  Modal
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
  IconDown,
  IconDelete,
  IconMore,
  IconStop
} from '@arco-design/web-vue/es/icon'
import { useIndexedDB } from './utils/ChatDatabase'
import { moonshot } from './request'

function getRandomString() {
  const x = 2147483648
  return (
    Math.floor(Math.random() * x).toString(36) +
    // eslint-disable-next-line no-bitwise
    Math.abs(Math.floor(Math.random() * x) ^ Date.now()).toString(36)
  )
}

const md = new MarkdownIt()

interface ChatMessage {
  role: 'user' | "assistant"
  content: string
  position?: 'left' | 'right'
  type?: 'text' | 'markdown' | 'code'
  _id?: string
  error?: boolean
}

interface Conversation {
  id?: number
  title: string
  messages: ChatMessage[]
}

const { getAll, add, update, getById, clearAll, remove } = useIndexedDB()


const developerOptions = [
  {
    name: 'Moonshot',
    value: 'moonshot'
  }, {
    name: 'Simulate',
    value: 'simulate'
  }]

const conversations = ref<Conversation[]>([])
const currentConversationId = ref<number | null>(null)
const inputMessage = ref('')
const isCollapsed = ref(false)
const userName = ref('Admin')
const searchQuery = ref('')
const isLoading = ref(false)
const isEditingTitle = ref(false)
const developerType = ref('simulate')


const currentConversation = computed(() =>
  conversations.value.find((c: Conversation) => c.id === currentConversationId.value) || null
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

const startNewConversation = async (initialMessage?: string): Promise<Conversation> => {
  const newConversation: Conversation = {
    title: initialMessage ? initialMessage.slice(0, 20) + '...' : '新对话',
    messages: []
  }
  const id = await add(newConversation)
  newConversation.id = id
  conversations.value.unshift(newConversation) // 确保新对话被添加到列表中
  currentConversationId.value = id
  return newConversation
}

const selectConversation = (id: number) => {
  currentConversationId.value = id
}

const chatMessagesRef = ref<HTMLDivElement | null>(null)
const loadingMessagesRef = ref<HTMLDivElement | null>(null)

const scrollToLoading = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      const scrollContainer = chatMessagesRef.value;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      scrollContainer.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const simulateBotResponse = async (): Promise<ChatMessage> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const botResponse: ChatMessage = {
    role: 'assistant',
    content: Mock.mock(function () {
      const type = Mock.Random.pick(['text', 'markdown', 'code'])
      if (type === 'text') {
        return Mock.Random.sentence(5, 20)
      } else if (type === 'markdown') {
        return `# ${Mock.Random.title()}\n\n${Mock.Random.paragraph()}\n\n- ${Mock.Random.word()}\n- ${Mock.Random.word()}\n- ${Mock.Random.word()}`
      } else {
        return `\`\`\`python\n${Mock.Random.sentence()}\nprint("${Mock.Random.word()}")\n\`\`\``
      }
    }),
    position: "left",
    type: "text"
  }
  return botResponse;
}


const formatPrevMessage = (msgList: ChatMessage[]) => {
  return msgList.map((msg) => {
    return {
      role: msg.role,
      content: msg.content,
    }
  })
}

async function handleSend(message: ChatMessage) {
  try {
    if (!currentConversation.value) {
      throw new Error("当前对话不存在")
    }
    console.debug("handleSend", message)
    // eslint-disable-next-line no-unsafe-optional-chaining
    const postValue = formatPrevMessage([...currentConversation?.value?.messages!, message]);
    const res = await moonshot(postValue);
    const botResponse: ChatMessage = {
      role: res.role,
      content: res.content ?? "",
      position: "left",
      type: "text"
    }
    return botResponse;
  } catch (e) {
    throw new Error(e?.toString?.() ?? "未知错误");
  }
}

const sendMessage = async () => {
  console.debug("sendMessage", inputMessage.value, isLoading.value)
  if (!inputMessage.value.trim() || isLoading.value) return

  let currentConv = currentConversation.value

  if (!currentConv) {
    currentConv = await startNewConversation(inputMessage.value.trim())
  } else {
    // 如果当前对话已存在但没有消息,新标题
    if (currentConv.messages.length === 0) {
      currentConv.title = inputMessage.value.slice(0, 20) + '...'
    }
  }

  const newMessage: ChatMessage = {
    _id: "m_" + getRandomString(),
    role: 'user',
    content: inputMessage.value.trim(),
    position: "right",
    type: 'text'
  }

  currentConv.messages.push(newMessage)

  if (currentConv.id) {
    await update(currentConv.id, {
      title: currentConv.title,
      messages: currentConv.messages
    })
  }

  inputMessage.value = ''
  isLoading.value = true

  scrollToLoading()

  try {
    console.debug("developerType", developerType.value)
    const botResponse = developerType.value === 'moonshot' ?
      await handleSend(newMessage) :
      await simulateBotResponse()
    currentConv.messages.push(botResponse)
    if (currentConv.id) {
      await update(currentConv.id, {
        messages: currentConv.messages
      })
    }
    scrollToBottom()
  } catch (error) {
    console.error('生成回复时出错', error)
    currentConv.messages.push({
      _id: "m_" + getRandomString(),
      role: 'assistant',
      content: error?.toString?.() ?? "似乎出了点问题...",
      position: "left",
      type: 'text',
      error: true
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const stopLoading = () => {
  isLoading.value = false
  // 这里可以添加停止 API 请求的逻辑,如果需要的话
}

const initConversations = async () => {
  const storedConversations = await getAll()
  conversations.value = storedConversations
  if (storedConversations.length > 0) {
    currentConversationId.value = storedConversations[0].id ?? null
  }
}

const titleTextSpanRef = ref<HTMLElement | null>(null)

const startEditingTitle = () => {
  if (!isEditingTitle.value) {
    isEditingTitle.value = true
    nextTick(() => {
      if (titleTextSpanRef.value) {
        titleTextSpanRef.value.focus()
        // 将光标移到文本末尾
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(titleTextSpanRef.value)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    })
  }
}

const saveEditedTitle = async () => {
  if (currentConversation.value && currentConversation.value.id && titleTextSpanRef.value) {
    const newTitle = titleTextSpanRef.value.textContent?.trim() || '新对话'
    const truncatedTitle = newTitle.slice(0, 20)
    await update(currentConversation.value.id, { title: truncatedTitle })

    // 重新获取更新后的对话
    const updatedConversation = await getById(currentConversation.value.id)
    if (updatedConversation) {
      // 更新当前对话的标题
      currentConversation.value.title = updatedConversation.title
    }

    isEditingTitle.value = false

    // 更新 DOM 中显示的标题
    if (titleTextSpanRef.value) {
      titleTextSpanRef.value.textContent = currentConversation.value.title
    }
  }
}

const handleDeveloperClick = (type: string) => {
  console.debug("handleDeveloperClick", type)
  developerType.value = type
  switch (type.toLowerCase()) {
    case 'moonshot':
      Message.success(`选择了 https://api.moonshot.cn/v1 模型`)
      break;
    case 'simulate':
      Message.success(`选择了 Mock.mock`)
      break;
    default:
      break;
  }
}

// 新增系统菜单选项
const systemMenuOptions = ref([
  {
    key: 'clearData',
    label: '清空数据',
    icon: IconDelete,
    danger: true
  }
  // 可以在这里添加更多系统菜单选项
])

// 处理系统菜单选择
const handleSystemMenuClick = (key: string) => {
  switch (key) {
    case 'clearData':
      Modal.confirm({
        title: '确认清空数据',
        content: '此操作将清空所有对话数据，确定要继续吗？',
        onOk: clearAllData
      })
      break
    // 可以在这里添加更多菜单项的处理逻辑
    default:
      console.warn(`未处理的菜单项: ${key}`)
  }
}

// 清空所有数据
const clearAllData = async () => {
  try {
    await clearAll()
    conversations.value = []
    currentConversationId.value = null
    Message.success('所有数据已清空')
  } catch (error) {
    console.error('清空数据时出错', error)
    Message.error('清空数据失败')
  }
}

// 添加删除对话的函数
const deleteConversation = async (id: number) => {
  try {
    await remove(id)
    conversations.value = conversations.value.filter(conv => conv.id !== id)
    if (currentConversationId.value === id) {
      currentConversationId.value = conversations.value[0]?.id ?? null
    }
    Message.success('对话已删除')
  } catch (error) {
    console.error('删除对话时出错', error)
    Message.error('删除对话失败')
  }
}

// 添加对话操作菜单选项
const conversationMenuOptions = [
  {
    key: 'delete',
    label: '删除对话',
    icon: IconDelete,
    danger: true
  }
  // 可以在这里添加更多对话操作选项
]

// 处理对话菜单选择
const handleConversationMenuClick = (key: string, convId: number) => {
  switch (key) {
    case 'delete':
      Modal.confirm({
        title: '确认删除对话',
        content: '此操作将永久删除该对话，确定要继续吗？',
        onOk: () => deleteConversation(convId)
      })
      break
    // 可以在这里添加更多菜单项的处理逻辑
    default:
      console.warn(`未处理的菜单项: ${key}`)
  }
}

initConversations()
</script>

<template>
  <Layout class="chat-container">
    <Layout.Sider v-if="!isCollapsed" :width="250" class="sidebar">
      <div class="panel panel-sidebar">
        <div class="panel-header">
          <Button @click="toggleSidebar" shape="circle">
            <IconMenuFold />
          </Button>
          <Button @click="() => startNewConversation()" shape="circle">
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
            <div v-for="conv in  filteredConversations " :key="conv.id"
              :class="['conversation-item', { 'active': conv.id === currentConversationId }]"
              @click="selectConversation(conv.id!)" :title="conv.title">
              <span class="conversation-title">{{ conv.title }}</span>
              <Dropdown @select="(key: string) => handleConversationMenuClick(key, conv.id!)" trigger="click">
                <div class="conversation-menu-trigger">
                  <IconMore />
                </div>
                <template #content>
                  <Dropdown.Option v-for="option in conversationMenuOptions" :key="option.key" :value="option.key">
                    <div class="conversation-menu-item">
                      <component :is="option.icon" :class="{ 'danger-icon': option.danger }" />
                      <span :class="{ 'danger-text': option.danger }">{{ option.label }}</span>
                    </div>
                  </Dropdown.Option>
                </template>
              </Dropdown>
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
        <div class="panel-header" style="border-bottom: 1px solid var(--color-border);">
          <Button v-if="isCollapsed" @click="toggleSidebar" shape="circle" style="margin-right: 10px;">
            <IconMenuUnfold />
          </Button>
          <div class="conversation-title">
            <Dropdown @select="handleDeveloperClick">
              <div class="developer-type-selector">
                <span>
                  {{ developerOptions.find(option => option.value === developerType)?.name }}
                </span>
                <IconDown />
              </div>
              <template #content>
                <Dropdown.Option v-for=" option  in  developerOptions " :key="option.value" :value="option.value">
                  {{ option.name }}
                </Dropdown.Option>
              </template>
            </Dropdown>
            <div class="title-container">
              <div class="title-container-block" :class="{ 'editing': isEditingTitle }">
                <span ref="titleTextSpanRef" class="title-text" :contenteditable="isEditingTitle"
                  @click="startEditingTitle" @blur="saveEditedTitle" @keydown.enter.prevent="saveEditedTitle">
                  {{ currentConversation?.title }}
                </span>
              </div>
            </div>
            <div class="header-icons">
              <Dropdown @select="handleSystemMenuClick">
                <Button shape="circle" style="margin-left: 8px;">
                  <IconSettings />
                </Button>
                <template #content>
                  <Dropdown.Option v-for="option in systemMenuOptions" :key="option.key" :value="option.key">
                    <div class="system-menu-item">
                      <component :is="option.icon" :class="{ 'danger-icon': option.danger }" />
                      <span :class="{ 'danger-text': option.danger }">{{ option.label }}</span>
                    </div>
                  </Dropdown.Option>
                </template>
              </Dropdown>
            </div>
          </div>
        </div>
        <div class="panel-content chat-messages" ref="chatMessagesRef">
          <div v-if="conversations.length === 0" class="empty-state">
            <p>没有对话记录</p>
            <p>输入内容并发送以开始新对话</p>
          </div>
          <div v-else class="chat-messages-body">
            <div v-for="( message, index ) in  currentConversation?.messages " :key="index"
              :class="['message', `position-${message.position}`]">
              <div class="message-avatar" v-if="message.position === 'left'">
                <Avatar :size="32">
                  <IconRobot />
                </Avatar>
              </div>
              <div :class="['message-content', message.error && 'error']">
                <div v-if="message.type === 'text'">{{ message.content }}</div>
                <div v-else-if="message.type === 'markdown'" v-html="md.render(message.content)"></div>
                <pre v-else-if="message.type === 'code'"><code v-html="md.render(message.content)"></code></pre>
              </div>
            </div>
            <!-- 添加加载提示 -->
            <div v-if="isLoading" class="message position-left" ref="loadingMessagesRef">
              <div class="message-avatar">
                <Avatar :size="32">
                  <IconRobot />
                </Avatar>
              </div>
              <div class="message-content loading">
                <Spin dot color="var(--color-primary)" />
              </div>
            </div>
          </div>
        </div>

        <div class="panel-footer input-wrapper">
          <div class="chat-input-body">
            <input v-model="inputMessage" type="text" placeholder="输入您的问题，按回车发送" @keyup.enter="sendMessage"
              :disabled="isLoading" class="custom-input" />
            <Button v-if="inputMessage.trim() && !isLoading" @click="sendMessage" shape="circle" class="send-button">
              <IconArrowUp />
            </Button>
            <Button v-else-if="isLoading" @click="stopLoading" shape="circle" class="send-button stop-button">
              <IconStop />
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

  &.panel-sidebar {
    background-color: var(--color-fill-2)
  }

  &-header {
    padding: 12px 16px;
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
  }
}

.conversation {
  &-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 40px; // 设置一个固定高度

    .developer-type-selector {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
      height: 100%; // 使用100%高度

      &:hover {
        background-color: var(--color-fill-2);
      }

      span {
        margin-right: 4px;
      }
    }

    .title-container {
      flex: 1;

      &-block {
        margin: 0 10px;
        cursor: text;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.3s;
        height: 100%;
        display: inline-block;
        align-items: center;

        &:hover,
        &.editing {
          background-color: var(--color-fill-2);
        }
      }
    }



    .title-text {
      padding: 0;
      font-size: 16px;
      line-height: 1.5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 20px;
      outline: none;
      display: inline-block;
      max-width: 100%;

      &[contenteditable="true"] {
        border-bottom: 1px solid var(--color-primary);
        padding-bottom: 2px;
        background-color: transparent; // 确保编辑时背景透明
      }
    }

    .header-icons {
      display: flex;
      align-items: center;
      height: 100%; // 使用100%高度
    }
  }

  &-list {
    display: flex;
    flex-direction: column;
  }

  &-item {
    padding: 0px 12px;
    border-radius: 4px;
    transition: all 0.3s;
    margin-bottom: 4px;
    font-size: 14px;
    line-height: 1.4;
    cursor: pointer;
    color: var(--color-text-1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative; // 添加相对定位


    &:hover:not(.active),
    &.active {
      background-color: var(--color-neutral-3);
      color: var(--color-primary);
      font-weight: 500;

      .conversation-menu-trigger {
        opacity: 1;
      }
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 40px;
      bottom: 0;
      width: 30px; // 调整阴影宽度
      background: linear-gradient(to right, transparent, var(--color-neutral-3));
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none; // 确保不影响鼠标事件
    }

    &:hover::after,
    &.active::after {
      opacity: 1;
    }
  }

  &-title {
    position: relative;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 4px;
  }


  &-menu-trigger {
    opacity: 0;
    transition: all 0.3s;
    padding: 4px;
    border-radius: 4px;
    z-index: 1; // 确保在阴影之上
    font-size: 18px;
    color: var(--color-text-3);

    &:hover {
      background-color: var(--color-fill-3);
      color: var(--color-text-1); // 悬浮时高亮颜色
    }
  }

  &-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .danger-icon,
    .danger-text {
      color: var(--color-danger-light-4);
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

  &.position-right {
    flex-direction: row-reverse;

    .message-content {
      margin-left: 12px;
      margin-right: 0;
      background-color: var(--color-primary-light-1);
    }
  }

  &.position-left .message-content {
    max-width: 80%;
    margin-right: 12px;
    background-color: var(--color-fill-2);


    &.error {
      font-weight: bold;
      color: var(--color-danger-light-4);
    }
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

  &.stop-button {
    background-color: var(--color-danger-light-1);
    color: var(--color-danger);

    &:hover {
      background-color: var(--color-danger-light-2);
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.system-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .danger-icon {
    color: var(--color-danger-light-4);
  }

  .danger-text {
    color: var(--color-danger-light-4);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-3);
  font-size: 16px;
  text-align: center;

  p {
    margin: 8px 0;
  }
}
</style>