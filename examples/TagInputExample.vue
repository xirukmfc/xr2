<template>
  <div class="example-container">
    <h1>Пример использования TagInput компонента</h1>
    
    <div class="example-section">
      <h2>Базовое использование</h2>
      <TagInput
        v-model="tags"
        :existing-tags="availableTags"
        placeholder="Введите тег..."
        :max-tags="5"
        @tag-added="onTagAdded"
        @tag-removed="onTagRemoved"
      />
      
      <div class="tags-info">
        <p>Выбранные теги: {{ tags.join(', ') || 'нет' }}</p>
        <p>Количество: {{ tags.length }}</p>
      </div>
    </div>

    <div class="example-section">
      <h2>Доступные теги</h2>
      <div class="available-tags">
        <span
          v-for="tag in availableTags"
          :key="tag"
          class="available-tag"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TagInput from './TagInput.vue'

const tags = ref<string[]>(['важный', 'тест'])
const availableTags = ref<string[]>([
  'важный',
  'тест',
  'разработка',
  'дизайн',
  'маркетинг',
  'продажи',
  'поддержка',
  'документация'
])

const onTagAdded = (tag: string) => {
  console.log('Добавлен тег:', tag)
}

const onTagRemoved = (tag: string) => {
  console.log('Удален тег:', tag)
}
</script>

<style scoped>
.example-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 28px;
  margin-bottom: 30px;
  color: #1f2937;
}

h2 {
  font-size: 20px;
  margin-bottom: 16px;
  color: #374151;
}

.example-section {
  margin-bottom: 40px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 8px;
}

.tags-info {
  margin-top: 16px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  color: #6b7280;
}

.tags-info p {
  margin: 4px 0;
}

.available-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.available-tag {
  padding: 6px 12px;
  background: #e5e7eb;
  border-radius: 16px;
  font-size: 14px;
  color: #374151;
}
</style>
