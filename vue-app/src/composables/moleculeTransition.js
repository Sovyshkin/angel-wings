import { reactive } from 'vue'

// This state intentionally lives outside individual route components. The video
// belongs to App.vue, so changing routes can never recreate it or reset playback.
export const moleculeTransition = reactive({
  stage: 'home',
  isRunning: false
})
