import './customSelect.css'

let current = null
let pointerSelect = null
let pointerTime = 0

const isSelect = target => target instanceof HTMLSelectElement && !target.multiple && target.size <= 1
const isMobile = () => window.matchMedia('(max-width: 640px)').matches

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
  if (restoreFocus && state.select.isConnected) state.select.focus({ preventScroll: true })
}

function chooseOption(state, index) {
  const option = state.options[index]
  if (!option || option.disabled) return
  const changed = state.select.value !== option.value
  state.select.value = option.value
  closeMenu(true)
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
    row.addEventListener('click', () => chooseOption(state, option.index))
    state.list.append(row)
  }
  if (state.activeIndex >= 0) state.select.setAttribute('aria-activedescendant', `${state.menu.id}-option-${state.activeIndex}`)
  else state.select.removeAttribute('aria-activedescendant')
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
  const state = { select, options, menu, scrim, mobile, activeIndex: options.findIndex(option => option.value === select.value && !option.disabled), observer: null, detachmentObserver: null, list: null, search: null }
  if (mobile) {
    const header = document.createElement('div')
    header.className = 'aw-select-header'
    const title = document.createElement('strong')
    title.textContent = selectTitle(select)
    const done = document.createElement('button')
    done.type = 'button'
    done.textContent = 'Готово'
    done.addEventListener('click', () => closeMenu(true))
    header.append(title, done)
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
  scrim.addEventListener('click', () => closeMenu())
  document.body.append(scrim, menu)
  current = state
  select.setAttribute('aria-expanded', 'true')
  select.setAttribute('aria-controls', menu.id)
  renderOptions(state)
  positionMenu(state)
  state.observer = new MutationObserver(() => {
    if (!select.isConnected || select.disabled) { closeMenu(); return }
    state.options = getOptions(select)
    renderOptions(state)
  })
  state.observer.observe(select, { childList: true, subtree: true, characterData: true, attributes: true })
  state.detachmentObserver = new MutationObserver(() => { if (!select.isConnected) closeMenu() })
  state.detachmentObserver.observe(document.body, { childList: true, subtree: true })
  select.focus({ preventScroll: true })
  if (!mobile && state.search) state.search.focus({ preventScroll: true })
  else state.list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}

function onPointerDown(event) {
  if (!isSelect(event.target)) return
  event.preventDefault()
  pointerSelect = event.target
  pointerTime = Date.now()
  openMenu(event.target)
}

function onClick(event) {
  if (!isSelect(event.target)) return
  event.preventDefault()
  if (pointerSelect !== event.target || Date.now() - pointerTime > 600) openMenu(event.target)
}

function onKeyDown(event) {
  const select = isSelect(event.target) ? event.target : null
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
  document.addEventListener('pointerdown', onPointerDown, true)
  if (!window.PointerEvent) {
    document.addEventListener('mousedown', onPointerDown, true)
    document.addEventListener('touchstart', onPointerDown, { capture: true, passive: false })
  }
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('scroll', event => {
    if (!current || current.menu.contains(event.target)) return
    if (!current.select.isConnected) closeMenu()
    else positionMenu(current)
  }, true)
  window.addEventListener('resize', () => { if (current) positionMenu(current) })
}
