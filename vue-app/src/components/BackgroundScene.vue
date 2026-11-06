<template>
  <LightBackgroundScene v-if="!themeStore.isDark" :height="height" />
  <DarkBackgroundScene v-else :height="height" />
</template>

<script setup>
import { useThemeStore } from '../store/theme'
import DarkBackgroundScene from './DarkBackgroundScene.vue'
import LightBackgroundScene from './LightBackgroundScene.vue'
defineProps({ height: { type: Number, default: 0 } })
const themeStore = useThemeStore()
</script>
