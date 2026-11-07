import { onBeforeUnmount, ref, watch } from 'vue'

// The same scene spans all sections. Measure its real content height so hiding
// a block or loading catalogue images never leaves gaps in the composition.
export function useSceneHeight(root) {
  const height = ref(0)
  let observer
  let frame
  const measure = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      frame = null
      height.value = root.value?.offsetHeight || 0
    })
  }
  watch(root, node => {
    observer?.disconnect()
    if (!node) return
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(node)
    }
  }, { flush: 'post' })
  window.addEventListener('resize', measure, { passive: true })
  onBeforeUnmount(() => {
    observer?.disconnect()
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('resize', measure)
  })
  return height
}
