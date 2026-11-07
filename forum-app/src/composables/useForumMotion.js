import { onBeforeUnmount, watch, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
gsap.registerPlugin(ScrollTrigger)
export function useForumMotion(root, ready) {
  let context
  let lenis
  let tick
  const magnetic = []
  watch(ready, async value => {
    if (!value) return
    await nextTick()
    const node = root.value
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(min-width: 901px) and (pointer: fine)').matches) {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: { offset: -20 } })
      lenis.on('scroll', ScrollTrigger.update)
      tick = time => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }
    context = gsap.context(() => {
      const reduceDelay = window.innerWidth < 768 ? .075 : .12
      gsap.from('.site-header', { y: -28, opacity: 0, duration: .65 })
      gsap.utils.toArray('[data-reveal-title]').forEach(title => {
        const lines = title.querySelectorAll('.reveal-line > span')
        if (!lines.length) return
        gsap.fromTo(lines, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, clearProps: 'transform,opacity', duration: .95, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: title, start: 'top 92%', once: true } })
      })
      gsap.utils.toArray('[data-reveal-soft]').forEach(el => gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, clearProps: 'transform,opacity', duration: .78, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } }))
      gsap.utils.toArray('[data-reveal-cards]').forEach(group => gsap.fromTo(Array.from(group.children), { y: 24, opacity: 0 }, { y: 0, opacity: 1, clearProps: 'transform,opacity,translate,scale,rotate', duration: .86, stagger: reduceDelay, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 95%', once: true } }))
      gsap.utils.toArray('[data-reveal-events]').forEach(group => gsap.fromTo(Array.from(group.children), { y: 35, scale: .97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, clearProps: 'transform,opacity,translate,scale', duration: .85, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 92%', once: true } }))
      gsap.utils.toArray('[data-mask-reveal]').forEach(el => gsap.fromTo(el, { clipPath: 'inset(0 100% 0 0)', scale: 1.035 }, { clipPath: 'inset(0 0% 0 0)', scale: 1, clearProps: 'clipPath,transform', duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true } }))
      gsap.utils.toArray('[data-parallax]').forEach(el => gsap.to(el, { y: window.innerWidth < 768 ? -16 : -38, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 } }))
      gsap.utils.toArray('[data-count]').forEach(el => { const target = Number(el.dataset.count); if (!target) return; const obj = { value: 0 }; gsap.to(obj, { value: target, duration: 1.35, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, onUpdate: () => { el.textContent = `${Math.round(obj.value).toLocaleString('ru-RU')}+` } }) })
      if (window.matchMedia('(pointer: fine)').matches) {
        node.querySelectorAll('.btn-primary').forEach(button => {
          const inner = button.querySelector('span')
          if (!inner) return
          const move = event => {
            const rect = button.getBoundingClientRect()
            const x = Math.max(-6, Math.min(6, (event.clientX - rect.left - rect.width / 2) * .08))
            const y = Math.max(-6, Math.min(6, (event.clientY - rect.top - rect.height / 2) * .08))
            gsap.to(inner, { x, y, duration: .25, overwrite: true })
          }
          const leave = () => gsap.to(inner, { x: 0, y: 0, duration: .4, overwrite: true })
          button.addEventListener('pointermove', move)
          button.addEventListener('pointerleave', leave)
          magnetic.push(() => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave) })
        })
      }
    }, node)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, { flush: 'post' })
  onBeforeUnmount(() => { magnetic.forEach(cleanup => cleanup()); context?.revert(); if (tick) gsap.ticker.remove(tick); lenis?.destroy() })
}
