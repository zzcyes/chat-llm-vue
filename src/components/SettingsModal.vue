<template>
    <Teleport to="body">
        <Transition name="modal-fade">
            <div v-if="isOpen" class="settings-modal-overlay" @click.self="closeModal">
                <Transition name="modal-slide">
                    <div v-if="isOpen" class="settings-modal">
                        <div class="modal-content">
                            <header class="modal-header">
                                <h2>设置</h2>
                                <button @click="closeModal" class="close-button">×</button>
                            </header>
                            <div class="modal-body">
                                <nav class="sidebar">
                                    <ul>
                                        <li v-for="item in menuItems" :key="item.id" @click="selectMenuItem(item.id)"
                                            :class="{ active: selectedMenuItem === item.id }">
                                            <i :class="item.icon"></i>
                                            {{ item.title }}
                                        </li>
                                    </ul>
                                </nav>
                                <div class="content">
                                    <div v-if="selectedMenuItem === 'general'">
                                        <!-- 通用设置内容 -->
                                        <h3>通用设置</h3>
                                        <p>这里是通用设置的内容。</p>
                                    </div>
                                    <!-- 其他菜单项的内容... -->
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isOpen = ref(false);
const selectedMenuItem = ref('general');

const menuItems = [
    { id: 'general', title: '通用', icon: 'icon-general' },
    { id: 'appearance', title: '外观', icon: 'icon-appearance' },
    { id: 'privacy', title: '隐私', icon: 'icon-privacy' },
    // 添加更多菜单项...
];

const closeModal = () => {
    isOpen.value = false;
};

const selectMenuItem = (id: string) => {
    selectedMenuItem.value = id;
};

// 暴露方法以供父组件调用
defineExpose({ isOpen });
</script>

<style scoped>
.settings-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.settings-modal {
    background-color: var(--color-bg-2);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--color-text-1);
}

.close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--color-text-3);
}

.modal-body {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.sidebar {
    width: 200px;
    border-right: 1px solid var(--color-border);
    overflow-y: auto;
}

.sidebar ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.sidebar li {
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--color-text-2);
}

.sidebar li:hover {
    background-color: var(--color-fill-2);
}

.sidebar li.active {
    background-color: var(--color-fill-3);
    color: var(--color-primary);
}

.sidebar li i {
    margin-right: 8px;
}

.content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

.content h3 {
    margin-top: 0;
    color: var(--color-text-1);
}

/* 添加过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
    transform: translateY(-50px);
    opacity: 0;
}
</style>