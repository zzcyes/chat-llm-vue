<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import { Message, QuickReply } from '../types'

const props = defineProps({
    navbar: {
        type: Object as PropType<{ title: string }>,
        required: true
    },
    messages: {
        type: Array as PropType<Message[]>,
        required: true
    },
    quickReplies: {
        type: Array as PropType<QuickReply[]>,
        default: () => []
    }
})

const emit = defineEmits(['send', 'quickReplyClick'])

const inputMessage = ref('')

const handleSend = () => {
    if (inputMessage.value.trim()) {
        emit('send', inputMessage.value)
        inputMessage.value = ''
    }
}

const handleQuickReplyClick = (reply: QuickReply) => {
    emit('quickReplyClick', reply)
}

// ... 其他必要的逻辑
</script>

<template>
    <div class="chat-container">
        <div class="chat-navbar">
            <h2>{{ navbar.title }}</h2>
        </div>

        <div class="chat-messages">
            <div v-for="message in messages" :key="message.id" :class="['message', message.type]">
                <!-- 渲染消息内容 -->
            </div>
        </div>

        <div class="chat-input">
            <input v-model="inputMessage" @keyup.enter="handleSend" placeholder="输入消息..." />
            <button @click="handleSend">发送</button>
        </div>

        <div class="quick-replies" v-if="quickReplies.length">
            <button v-for="reply in quickReplies" :key="reply.id" @click="handleQuickReplyClick(reply)">
                {{ reply.title }}
            </button>
        </div>
    </div>
</template>

<style scoped>