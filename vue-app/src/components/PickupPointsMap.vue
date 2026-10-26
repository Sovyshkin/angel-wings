<template>
  <div class="pickup-map-shell">
    <div ref="mapElement" class="pickup-map" role="application" aria-label="Карта пунктов выдачи СДЭК"></div>
    <div v-if="!mappablePoints.length" class="pickup-map-message">У этих пунктов нет координат. Выберите ПВЗ в списке рядом.</div>
    <div v-else-if="mapState !== 'ready'" class="pickup-map-message" role="status">
      {{ mapState === 'loading' ? 'Загружаем карту ПВЗ…' : 'Карта временно недоступна. Выберите ПВЗ в списке рядом.' }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { distanceKm, pickupCoordinates } from '../utils/pickupMap'
import { loadYandexMaps } from '../utils/yandexMaps'

const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim()

const props = defineProps({
  points: { type: Array, default: () => [] },
  activeCode: { type: String, default: '' },
  favoriteCodes: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null },
  focusLocation: { type: Number, default: 0 }
})
const emit = defineEmits(['preview'])
const mapElement = ref(null)
const mapState = ref('loading')
const mappablePoints = computed(() => props.points.filter(point => pickupCoordinates(point)))
let ymaps = null
let map = null
let pointCollection = null
let userCollection = null
let resizeObserver = null
let unmounted = false
const markers = new Map()

function markerColor(code) {
  if (code === props.activeCode) return '#4468f6'
  return props.favoriteCodes.includes(code) ? '#e4a632' : '#8faaff'
}

function fitPoints(collection, maxZoom = 14) {
  if (!map || !collection.getLength()) return
  if (collection.getLength() === 1) {
    map.setCenter(collection.getBounds()[0], maxZoom)
    return
  }
  map.setBounds(collection.getBounds(), { zoomMargin: 36 }).then(() => {
    if (map && map.getZoom() > maxZoom) map.setZoom(maxZoom)
  })
}

function renderPoints(fit = true) {
  if (!map || !pointCollection) return
  pointCollection.removeAll()
  markers.clear()
  for (const point of mappablePoints.value) {
    const coordinates = pickupCoordinates(point)
    const marker = new ymaps.Placemark(
      [coordinates.latitude, coordinates.longitude],
      {},
      { preset: 'islands#circleDotIcon', iconColor: markerColor(point.code), hasBalloon: false, hasHint: false }
    )
    marker.events.add('click', () => emit('preview', point))
    pointCollection.add(marker)
    markers.set(point.code, marker)
  }
  if (fit) fitPoints(pointCollection)
}

function renderUser() {
  if (!map || !userCollection) return
  userCollection.removeAll()
  if (!props.userLocation) return
  const { latitude, longitude, accuracy } = props.userLocation
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
  const position = [latitude, longitude]
  userCollection.add(new ymaps.Placemark(position, { hintContent: 'Вы здесь' }, {
    preset: 'islands#circleDotIcon', iconColor: '#2563eb', hasBalloon: false
  }))
  if (Number.isFinite(accuracy) && accuracy > 0 && accuracy < 5000) {
    userCollection.add(new ymaps.Circle([position, accuracy], {}, {
      strokeColor: '#3b82f6', strokeWidth: 1, fillColor: '#3b82f617'
    }))
  }
}

onMounted(async () => {
  await nextTick()
  if (!mapElement.value || unmounted) return
  if (!apiKey) {
    mapState.value = 'error'
    return
  }
  try {
    ymaps = await loadYandexMaps(apiKey)
    if (unmounted || !mapElement.value) return
    map = new ymaps.Map(mapElement.value, {
      center: [55.75, 37.62], zoom: 10, controls: ['zoomControl']
    }, { suppressMapOpenBlock: true })
    map.behaviors.disable('scrollZoom')
    pointCollection = new ymaps.GeoObjectCollection()
    userCollection = new ymaps.GeoObjectCollection()
    map.geoObjects.add(pointCollection).add(userCollection)
    renderPoints()
    renderUser()
    resizeObserver = new ResizeObserver(() => map?.container.fitToViewport())
    resizeObserver.observe(mapElement.value)
    mapState.value = 'ready'
  } catch (error) {
    console.error('[PickupPointsMap] Не удалось загрузить Яндекс Карты:', error)
    mapState.value = 'error'
  }
})

watch(() => props.points, () => renderPoints(), { deep: false })
watch(() => props.activeCode, code => {
  for (const [pointCode, marker] of markers) marker.options.set('iconColor', markerColor(pointCode))
  const marker = markers.get(code)
  if (marker) map?.panTo(marker.geometry.getCoordinates(), { flying: false })
})
watch(() => props.favoriteCodes, () => {
  for (const [pointCode, marker] of markers) marker.options.set('iconColor', markerColor(pointCode))
})
watch(() => props.userLocation, renderUser)
watch(() => props.focusLocation, () => {
  if (!map || !props.userLocation) return
  const nearest = props.points.find(point => point.code === props.activeCode)
  const coordinates = pickupCoordinates(nearest)
  if (coordinates && distanceKm(props.userLocation, coordinates) <= 50) {
    const bounds = [
      [Math.min(props.userLocation.latitude, coordinates.latitude), Math.min(props.userLocation.longitude, coordinates.longitude)],
      [Math.max(props.userLocation.latitude, coordinates.latitude), Math.max(props.userLocation.longitude, coordinates.longitude)]
    ]
    map.setBounds(bounds, { zoomMargin: 42 }).then(() => {
      if (map && map.getZoom() > 14) map.setZoom(14)
    })
  } else {
    map.setCenter([props.userLocation.latitude, props.userLocation.longitude], 13, { duration: 350 })
  }
})

onUnmounted(() => {
  unmounted = true
  resizeObserver?.disconnect()
  map?.destroy()
  map = null
})
</script>

<style scoped>
.pickup-map-shell { position: relative; min-height: 420px; overflow: hidden; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-secondary); }
.pickup-map { width: 100%; height: 420px; }
.pickup-map-message { position: absolute; z-index: 1; inset: 0; display: grid; place-items: center; padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-secondary); }
@media (max-width: 640px) { .pickup-map-shell { min-height: 340px; } .pickup-map { height: 340px; } }
</style>
