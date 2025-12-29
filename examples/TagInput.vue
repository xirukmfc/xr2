<template>
  <div class="tag-input-container">
    <div class="tag-input-wrapper">
      <div class="tags-display">
        <span
          v-for="tag in tags"
          :key="tag"
          class="tag"
          :style="{ backgroundColor: getTagColor(tag) }"
        >
          {{ tag }}
          <button
            @click="removeTag(tag)"
            class="tag-remove"
            aria-label="Remove tag"
          >
            ×
          </button>
        </span>
      </div>
      
      <input
        v-model="inputValue"
        @keydown.enter.prevent="handleEnter"
        @keydown.backspace="handleBackspace"
        @input="handleInput"
        :placeholder="placeholder"
        class="tag-input"
        ref="inputRef"
      />
    </div>

    <!-- Suggestions dropdown -->
    <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions">
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="suggestion"
        @click="selectSuggestion(suggestion)"
        :class="['suggestion-item', { active: index === selectedIndex }]"
      >
        {{ suggestion }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface Props {
  modelValue: string[]
  existingTags?: string[]
  placeholder?: string
  maxTags?: number
}

const props = withDefaults(defineProps<Props>(), {
  existingTags: () => [],
  placeholder: 'Add tag...',
  maxTags: 10
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'tag-added': [tag: string]
  'tag-removed': [tag: string]
}>()

const tags = ref<string[]>([...props.modelValue])
const inputValue = ref('')
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)

// Popular colors for tags
const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#EC4899', // pink
  '#6B7280', // gray
]

// Computed properties
const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) {
    return props.existingTags.filter(tag => !tags.value.includes(tag))
  }
  
  const query = inputValue.value.toLowerCase().trim()
  return props.existingTags.filter(tag => 
    !tags.value.includes(tag) && 
    tag.toLowerCase().includes(query)
  )
})

// Methods
const getTagColor = (tag: string): string => {
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return TAG_COLORS[index % TAG_COLORS.length]
}

const addTag = (tag: string) => {
  const normalizedTag = tag.trim()
  
  if (!normalizedTag) return
  if (tags.value.includes(normalizedTag)) return
  if (tags.value.length >= props.maxTags) return
  
  tags.value.push(normalizedTag)
  inputValue.value = ''
  showSuggestions.value = false
  selectedIndex.value = -1
  
  emit('update:modelValue', [...tags.value])
  emit('tag-added', normalizedTag)
}

const removeTag = (tag: string) => {
  const index = tags.value.indexOf(tag)
  if (index > -1) {
    tags.value.splice(index, 1)
    emit('update:modelValue', [...tags.value])
    emit('tag-removed', tag)
  }
}

const handleEnter = () => {
  if (selectedIndex.value >= 0 && filteredSuggestions.value[selectedIndex.value]) {
    addTag(filteredSuggestions.value[selectedIndex.value])
  } else if (inputValue.value.trim()) {
    addTag(inputValue.value)
  }
}

const handleBackspace = (e: KeyboardEvent) => {
  if (inputValue.value === '' && tags.value.length > 0) {
    removeTag(tags.value[tags.value.length - 1])
  }
}

const handleInput = () => {
  showSuggestions.value = inputValue.value.trim().length > 0 || filteredSuggestions.value.length > 0
  selectedIndex.value = -1
}

const selectSuggestion = (suggestion: string) => {
  addTag(suggestion)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  tags.value = [...newValue]
}, { deep: true })

// Focus input when clicking container
const focusInput = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}
</script>

<style scoped>
.tag-input-container {
  position: relative;
  width: 100%;
}

.tag-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  min-height: 42px;
  align-items: center;
  cursor: text;
}

.tag-input-wrapper:focus-within {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
  border-color: #3b82f6;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  background-color: #3b82f6;
  user-select: none;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  padding: 4px 0;
  font-size: 14px;
  background: transparent;
}

.tag-input::placeholder {
  color: #9ca3af;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
}

.suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.15s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background-color: #f3f4f6;
}

.suggestion-item:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.suggestion-item:last-child {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}
</style>
