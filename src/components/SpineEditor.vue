<template>
  <div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
      Spine Configuration
    </h3>
    
    <!-- Background Color -->
    <div>
      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
        Background Color
      </label>
      <div class="flex items-center gap-2">
        <input
          type="color"
          :value="modelValue.backgroundColor"
          @input="updateField('backgroundColor', $event.target.value)"
          class="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
        />
        <input
          type="text"
          :value="modelValue.backgroundColor"
          @input="updateField('backgroundColor', $event.target.value)"
          class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white font-mono"
        />
      </div>
    </div>
    
    <!-- Artist Name + Color + Style -->
    <div class="grid grid-cols-[1fr,auto,auto] gap-2">
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Artist Name
        </label>
        <input
          type="text"
          :value="modelValue.artistName"
          @input="updateField('artistName', $event.target.value)"
          placeholder="Artist name for spine"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Style
        </label>
        <div class="flex gap-1">
          <button
            @click="updateField('artistBold', !modelValue.artistBold)"
            :class="[
              'w-9 h-10 flex items-center justify-center border rounded-lg text-sm font-bold transition-colors',
              modelValue.artistBold
                ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            ]"
            title="Bold"
          >B</button>
          <button
            @click="updateField('artistItalic', !modelValue.artistItalic)"
            :class="[
              'w-9 h-10 flex items-center justify-center border rounded-lg text-sm italic transition-colors',
              modelValue.artistItalic
                ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            ]"
            title="Italic"
          >I</button>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Color
        </label>
        <input
          type="color"
          :value="modelValue.artistColor || modelValue.textColor"
          @input="updateField('artistColor', $event.target.value)"
          class="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
        />
      </div>
    </div>
    
    <!-- Separator -->
    <div>
      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
        Separator
      </label>
      <div class="flex gap-2">
        <button
          v-for="sep in separatorOptions"
          :key="sep.value"
          @click="updateField('separator', sep.value)"
          :class="[
            'px-3 py-1.5 text-sm border rounded-lg transition-colors',
            modelValue.separator === sep.value
              ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
          ]"
        >
          {{ sep.label }}
        </button>
      </div>
    </div>
    
    <!-- Album Name + Color + Style -->
    <div class="grid grid-cols-[1fr,auto,auto] gap-2">
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Album Name
        </label>
        <input
          type="text"
          :value="modelValue.albumName"
          @input="updateField('albumName', $event.target.value)"
          placeholder="Album name for spine"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Style
        </label>
        <div class="flex gap-1">
          <button
            @click="updateField('albumBold', !modelValue.albumBold)"
            :class="[
              'w-9 h-10 flex items-center justify-center border rounded-lg text-sm font-bold transition-colors',
              modelValue.albumBold
                ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            ]"
            title="Bold"
          >B</button>
          <button
            @click="updateField('albumItalic', !modelValue.albumItalic)"
            :class="[
              'w-9 h-10 flex items-center justify-center border rounded-lg text-sm italic transition-colors',
              modelValue.albumItalic
                ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-400'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
            ]"
            title="Italic"
          >I</button>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Color
        </label>
        <input
          type="color"
          :value="modelValue.albumColor || modelValue.textColor"
          @input="updateField('albumColor', $event.target.value)"
          class="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
        />
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
      <!-- Text Alignment -->
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Text Alignment
        </label>
        <select
          :value="modelValue.alignment"
          @change="updateField('alignment', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>
      
      <!-- Font Size -->
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Font Size: {{ modelValue.fontSize }}pt
        </label>
        <input
          type="range"
          :value="modelValue.fontSize"
          @input="updateField('fontSize', parseFloat($event.target.value))"
          min="5"
          max="12"
          step="0.5"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>
    </div>
    
    <!-- Rotation Options -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Left Spine Rotation
        </label>
        <select
          :value="modelValue.leftRotation || 'bottom-to-top'"
          @change="updateField('leftRotation', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="bottom-to-top">↑ Bottom to Top</option>
          <option value="top-to-bottom">↓ Top to Bottom</option>
        </select>
      </div>
      
      <div>
        <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
          Right Spine Rotation
        </label>
        <select
          :value="modelValue.rightRotation || 'top-to-bottom'"
          @change="updateField('rightRotation', $event.target.value)"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="bottom-to-top">↑ Bottom to Top</option>
          <option value="top-to-bottom">↓ Top to Bottom</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      backgroundColor: '#000000',
      textColor: '#ffffff',
      artistName: '',
      artistColor: null,
      artistBold: false,
      artistItalic: false,
      albumName: '',
      albumColor: null,
      albumBold: false,
      albumItalic: false,
      separator: ' - ',
      alignment: 'center',
      fontSize: 7,
      leftRotation: 'bottom-to-top',
      rightRotation: 'top-to-bottom',
    })
  }
})

const emit = defineEmits(['update:modelValue'])

const separatorOptions = [
  { label: '—', value: ' — ' },      // em dash
  { label: '-', value: ' - ' },       // hyphen
  { label: '·', value: ' · ' },       // middle dot
  { label: '|', value: ' | ' },       // pipe
  { label: '/', value: ' / ' },       // slash
  { label: '(space)', value: '   ' }, // just space
  { label: 'none', value: '' },       // no separator
]

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>
