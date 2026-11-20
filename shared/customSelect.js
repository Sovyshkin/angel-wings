import './customSelect.css'

let current = null
let pointerSelect = null
let pointerTime = 0
let selectedSelect = null
let selectedAt = 0
const touchTargets = new Map()
const touchButtons = new WeakMap()
let touchSyncScheduled = false

const isSelect = target => target instanceof HTMLSelectElement && !target.multiple && target.size <= 1
const isMobile = () => window.matchMedia('(max-width: 640px)').matches

function updateTouchTarget(select, button) {
  if (!select.isConnected || !select.parentElement) return
  const parent = select.parentElement
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'
  if (button.parentElement !== parent || button.previousElementSibling !== select) select.after(button)
  const rect = select.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  Object.assign(button.style, {
    left: `${rect.left - parentRect.left - parent.clientLeft + parent.scrollLeft}px`,
    top: `${rect.top - parentRect.top - parent.clientTop + parent.scrollTop}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    display: rect.width && rect.height ? '' : 'none'
  })
  button.disabled = select.disabled
  button.setAttribute('aria-label', selectTitle(select))
}

function syncTouchTargets() {
  touchSyncScheduled = false
  for (const [select, entry] of touchTargets) {
    if (select.isConnected && isSelect(select)) continue
    entry.observer.disconnect()
    entry.attributeObserver.disconnect()
    entry.button.remove()
    select.removeAttribute('aria-hidden')
    select.classList.remove('aw-custom-select-source')
    select.tabIndex = entry.tabIndex
    touchTargets.delete(select)
  }
  for (const select of document.querySelectorAll('select')) {
    if (!isSelect(select)) continue
    let entry = touchTargets.get(select)
    if (!entry) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'aw-select-touch-target'
      button.setAttribute('aria-haspopup', 'listbox')
      touchButtons.set(button, select)
      button.addEventListener('pointerdown', event => {
        event.preventDefault()
        event.stopPropagation()
        pointerSelect = select
        pointerTime = Date.now()
        openMenu(select)
      })
      button.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        if (pointerSelect !== select || Date.now() - pointerTime > 600) openMenu(select)
      })
      const observer = new ResizeObserver(() => updateTouchTarget(select, button))
      observer.observe(select)
      const attributeObserver = new MutationObserver(() => updateTouchTarget(select, button))
      attributeObserver.observe(select, { attributes: true, attributeFilter: ['disabled', 'aria-label', 'class'] })
      entry = { button, observer, attributeObserver, tabIndex: select.tabIndex }
      touchTargets.set(select, entry)
      select.tabIndex = -1
      select.setAttribute('aria-hidden', 'true')
      select.classList.add('aw-custom-select-source')
    }
    updateTouchTarget(select, entry.button)
  }
}

function scheduleTouchTargetSync() {
  if (touchSyncScheduled) return
  touchSyncScheduled = true
  requestAnimationFrame(syncTouchTargets)
}

function selectTitle(select) {
  if (select.getAttribute('aria-label')) return select.getAttribute('aria-label')
  const label = select.labels?.[0] || select.closest('label')
  if (!label) return 'Выберите вариант'
  const copy = label.cloneNode(true)
  copy.querySelectorAll('select, input, textarea, button').forEach(node => node.remove())
  return copy.textContent.trim().replace(/\s+/g, ' ') || 'Выберите вариант'
}

function getOptions(select) {
  return Array.from(select.options)
    .filter(option => !option.hidden)
    .map(option => ({
      value: option.value,
      label: option.label || option.textContent.trim(),
      group: option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : '',
      disabled: option.disabled || option.parentElement?.disabled === true
    }))
}

function positionMenu(state) {
  if (state.mobile) return
  const rect = state.select.getBoundingClientRect()
  const gap = 7
  const width = Math.min(Math.max(rect.width, 230), window.innerWidth - 24)
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
  const below = window.innerHeight - rect.bottom - gap - 12
  const above = rect.top - gap - 12
  const opensAbove = below < 190 && above > below
  const height = Math.min(360, Math.max(130, opensAbove ? above : below))
  Object.assign(state.menu.style, {
    width: `${width}px`,
    left: `${left}px`,
    maxHeight: `${height}px`,
    top: opensAbove ? `${Math.max(12, rect.top - gap - height)}px` : `${rect.bottom + gap}px`
  })
}

function closeMenu(restoreFocus = false) {
  if (!current) return
  const state = current
  current = null
  state.observer.disconnect()
  state.detachmentObserver.disconnect()
  state.menu.remove()
  state.scrim.remove()
  state.select.removeAttribute('aria-expanded')
  state.select.removeAttribute('aria-controls')
  state.select.removeAttribute('aria-activedescendant')
  const button = touchTargets.get(state.select)?.button
  button?.removeAttribute('aria-expanded')
  button?.removeAttribute('aria-controls')
  button?.removeAttribute('aria-activedescendant')
  if (restoreFocus && state.select.isConnected) {
    const target = touchTargets.get(state.select)?.button || state.select
    target.focus({ preventScroll: true })
  }
}

function chooseOption(state, index) {
  if (current !== state) return
  const option = state.options[index]
  if (!option || option.disabled) return
  const changed = state.select.value !== option.value
  state.select.value = option.value
  selectedSelect = state.select
  selectedAt = Date.now()
  closeMenu(!state.mobile)
  if (changed) {
    state.select.dispatchEvent(new Event('input', { bubbles: true }))
    state.select.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function renderOptions(state) {
  const query = state.search?.value.trim().toLocaleLowerCase() || ''
  const visible = state.options.map((option, index) => ({ ...option, index }))
    .filter(option => !query || `${option.group} ${option.label}`.toLocaleLowerCase().includes(query))
  state.list.replaceChildren()
  let lastGroup = null
  if (!visible.length) {
    state.select.removeAttribute('aria-activedescendant')
    const empty = document.createElement('p')
    empty.className = 'aw-select-empty'
    empty.textContent = 'Ничего не найдено'
    state.list.append(empty)
    return
  }
  for (const option of visible) {
    if (option.group && option.group !== lastGroup) {
      const heading = document.createElement('div')
      heading.className = 'aw-select-group'
      heading.textContent = option.group
      state.list.append(heading)
    }
    lastGroup = option.group
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'aw-select-option'
    row.setAttribute('role', 'option')
    row.setAttribute('aria-selected', String(state.select.value === option.value))
    row.disabled = option.disabled
    row.dataset.index = String(option.index)
    row.id = `${state.menu.id}-option-${option.index}`
    row.textContent = option.label
    if (option.index === state.activeIndex) row.classList.add('is-active')
    let touchStart = null
    row.addEventListener('pointerdown', event => {
      if (state.mobile && event.pointerType !== 'mouse') touchStart = { x: event.clientX, y: event.clientY }
    })
    row.addEventListener('pointerup', event => {
      if (!touchStart) return
      const moved = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10
      touchStart = null
      if (moved) return
      event.preventDefault()
      chooseOption(state, option.index)
    })
    row.addEventListener('pointercancel', () => { touchStart = null })
    row.addEventListener('click', event => {
      event.stopPropagation()
      chooseOption(state, option.index)
    })
    state.list.append(row)
  }
  const button = touchTargets.get(state.select)?.button
  if (state.activeIndex >= 0) button?.setAttribute('aria-activedescendant', `${state.menu.id}-option-${state.activeIndex}`)
  else button?.removeAttribute('aria-activedescendant')
}

function moveActive(state, direction) {
  const visible = Array.from(state.list.querySelectorAll('.aw-select-option:not(:disabled)'))
  if (!visible.length) return
  const previous = visible.findIndex(row => Number(row.dataset.index) === state.activeIndex)
  const next = previous < 0 ? visible[direction > 0 ? 0 : visible.length - 1] : visible[(previous + direction + visible.length) % visible.length]
  state.activeIndex = Number(next.dataset.index)
  renderOptions(state)
  state.list.querySelector(`.aw-select-option[data-index="${state.activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
}

function openMenu(select) {
  if (select.disabled || !select.isConnected) return
  if (select === selectedSelect && Date.now() - selectedAt < 500) return
  closeMenu()
  const options = getOptions(select)
  if (!options.length) return
  const mobile = isMobile()
  const scrim = document.createElement('div')
  scrim.className = `aw-select-scrim${mobile ? ' is-mobile' : ''}`
  scrim.addEventListener('pointerdown', event => { event.preventDefault(); closeMenu() })
  const menu = document.createElement('div')
  menu.className = `aw-select-menu${mobile ? ' is-mobile' : ''}`
  menu.id = `aw-select-menu-${Math.random().toString(36).slice(2)}`
  menu.setAttribute('role', 'listbox')
  menu.setAttribute('aria-label', selectTitle(select))
  const state = { select, options, menu, scrim, mobile, openedAt: Date.now(), activeIndex: options.findIndex(option => option.value === select.value && !option.disabled), observer: null, detachmentObserver: null, list: null, search: null }
  if (mobile) {
    const header = document.createElement('div')
    header.className = 'aw-select-header'
    const title = document.createElement('strong')
    title.textContent = selectTitle(select)
    header.append(title)
    menu.append(header)
  }
  if (options.length > 8) {
    const search = document.createElement('input')
    search.type = 'search'
    search.className = 'aw-select-search'
    search.placeholder = 'Поиск по списку'
    search.setAttribute('aria-label', 'Поиск по списку')
    search.addEventListener('input', () => { state.activeIndex = -1; renderOptions(state) })
    state.search = search
    menu.append(search)
  }
  const list = document.createElement('div')
  list.className = 'aw-select-list'
  state.list = list
  menu.append(list)
  scrim.addEventListener('click', () => { if (Date.now() - state.openedAt > 350) closeMenu() })
  document.body.append(scrim, menu)
  current = state
  select.setAttribute('aria-expanded', 'true')
  select.setAttribute('aria-controls', menu.id)
  const button = touchTargets.get(select)?.button
  button?.setAttribute('aria-expanded', 'true')
  button?.setAttribute('aria-controls', menu.id)
  renderOptions(state)
  positionMenu(state)
  state.observer = new MutationObserver(() => {
    if (!select.isConnected || select.disabled) { closeMenu(); return }
    state.options = getOptions(select)
    renderOptions(state)
  })
  state.observer.observe(select, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['disabled', 'hidden', 'label', 'value', 'selected']
  })
  state.detachmentObserver = new MutationObserver(() => { if (!select.isConnected) closeMenu() })
  state.detachmentObserver.observe(document.body, { childList: true, subtree: true })
  if (!mobile && state.search) state.search.focus({ preventScroll: true })
  else {
    touchTargets.get(select)?.button.focus({ preventScroll: true })
    state.list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }
}

function onPointerDown(event) {
  if (!isSelect(event.target)) return
  event.preventDefault()
  pointerSelect = event.target
  pointerTime = Date.now()
  openMenu(event.target)
}

function onClick(event) {
  const label = event.target instanceof Element ? event.target.closest('label') : null
  const labelSelect = label?.control
  if (isSelect(labelSelect) && touchTargets.has(labelSelect)) {
    event.preventDefault()
    if (pointerSelect !== labelSelect || Date.now() - pointerTime > 600) openMenu(labelSelect)
    return
  }
  if (!isSelect(event.target)) return
  event.preventDefault()
  if (pointerSelect !== event.target || Date.now() - pointerTime > 600) openMenu(event.target)
}

function onKeyDown(event) {
  const select = isSelect(event.target) ? event.target : touchButtons.get(event.target) || null
  const state = current
  if (!select && (!state || (event.target !== state.search && !state.menu.contains(event.target)))) return
  if (event.key === 'Escape' && state) { event.preventDefault(); closeMenu(true); return }
  if (event.key === 'Tab') { closeMenu(); return }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!state || (select && state.select !== select)) openMenu(select)
    if (current) moveActive(current, event.key === 'ArrowDown' ? 1 : -1)
    return
  }
  if ((event.key === 'Home' || event.key === 'End') && state && event.target !== state.search) {
    event.preventDefault()
    const visible = Array.from(state.list.querySelectorAll('.aw-select-option:not(:disabled)'))
    const edge = event.key === 'Home' ? visible[0] : visible.at(-1)
    if (edge) {
      state.activeIndex = Number(edge.dataset.index)
      renderOptions(state)
      state.list.querySelector(`#${state.menu.id}-option-${state.activeIndex}`)?.scrollIntoView({ block: 'nearest' })
    }
    return
  }
  if (event.key === 'Enter' || (event.key === ' ' && event.target !== state?.search)) {
    event.preventDefault()
    if (!state || (select && state.select !== select)) openMenu(select)
    else chooseOption(state, state.activeIndex)
    return
  }
  if (select && event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    if (!state || state.select !== select) openMenu(select)
    if (current?.search) { current.search.value += event.key; current.search.dispatchEvent(new Event('input')); current.search.focus({ preventScroll: true }) }
  }
}

export function installCustomSelects() {
  if (typeof document === 'undefined') return
  syncTouchTargets()
  new MutationObserver(scheduleTouchTargetSync).observe(document.body, { childList: true, subtree: true })
  document.addEventListener('pointerdown', onPointerDown, true)
  if (!window.PointerEvent) {
    document.addEventListener('mousedown', onPointerDown, true)
    document.addEventListener('touchstart', onPointerDown, { capture: true, passive: false })
  }
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('invalid', event => {
    if (!isSelect(event.target) || !touchTargets.has(event.target)) return
    event.preventDefault()
    openMenu(event.target)
  }, true)
  window.addEventListener('scroll', event => {
    if (!current || current.menu.contains(event.target)) return
    if (!current.select.isConnected) closeMenu()
    else positionMenu(current)
    scheduleTouchTargetSync()
  }, true)
  window.addEventListener('resize', () => { if (current) positionMenu(current); scheduleTouchTargetSync() })
}
