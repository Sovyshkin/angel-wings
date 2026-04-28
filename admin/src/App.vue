<template>
  <div class="app">
    <router-view />
  </div>
</template>

<script setup>
import { useThemeStore } from './store/theme'
const themeStore = useThemeStore()
</script>

<style>
.app {
  min-height: 100vh;
}
</style>