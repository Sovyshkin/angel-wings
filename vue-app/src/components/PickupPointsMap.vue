<template>
  <div class="pickup-map-shell">
    <div ref="mapElement" class="pickup-map" role="application" aria-label="Карта пунктов выдачи СДЭК"></div>
    <div v-if="!mappablePoints.length" class="pickup-map-empty">У этих пунктов нет координат. Выберите ПВЗ в списке рядом.</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { distanceKm, pickupCoordinates } from '../utils/pickupMap'

const props = defineProps({
  points: { type: Array, default: () => [] },
  activeCode: { type: String, default: '' },
  favoriteCodes: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null },
  focusLocation: { type: Number, default: 0 }
})
const emit = defineEmits(['preview'])
const mapElement = ref(null)
const mappablePoints = computed(() => props.points.filter(point => pickupCoordinates(point)))
let map = null
let pointLayer = null
let userLayer = null
let resizeObserver = null
const markers = new Map()

function markerIcon(active = false, favorite = false) {
  return L.divIcon({
    className: 'pickup-map-marker-wrap',
    html: `<span class="pickup-map-marker${active ? ' is-active' : ''}${favorite ? ' is-favorite' : ''}" aria-hidden="true">${favorite ? '★' : active ? '✓' : ''}</span>`,
    iconSize: [32, 40],
    iconAnchor: [16, 38]
  })
}

function renderPoints(fit = true) {
  if (!map || !pointLayer) return
  pointLayer.clearLayers()
  markers.clear()
  const bounds = []
  for (const point of mappablePoints.value) {
    const coordinates = pickupCoordinates(point)
    const position = [coordinates.latitude, coordinates.longitude]
    const marker = L.marker(position, { icon: markerIcon(point.code === props.activeCode, props.favoriteCodes.includes(point.code)), title: point.name || point.address || point.code })
    marker.on('click', () => emit('preview', point))
    marker.addTo(pointLayer)
    markers.set(point.code, marker)
    bounds.push(position)
  }
  if (fit && bounds.length) {
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 })
  }
}

function renderUser() {
  if (!map) return
  if (userLayer) {
    map.removeLayer(userLayer)
    userLayer = null
  }
  if (!props.userLocation) return
  const { latitude, longitude, accuracy } = props.userLocation
  userLayer = L.layerGroup().addTo(map)
  L.circleMarker([latitude, longitude], {
    radius: 9,
    color: '#fff',
    weight: 3,
    fillColor: '#3b82f6',
    fillOpacity: 1
  }).bindTooltip('Вы здесь').addTo(userLayer)
  if (Number.isFinite(accuracy) && accuracy > 0 && accuracy < 5000) {
    L.circle([latitude, longitude], { radius: accuracy, color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.09 }).addTo(userLayer)
  }
}

onMounted(async () => {
  await nextTick()
  if (!mapElement.value) return
  map = L.map(mapElement.value, { zoomControl: true, scrollWheelZoom: false }).setView([55.75, 37.62], 10)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)
  pointLayer = L.layerGroup().addTo(map)
  renderPoints()
  renderUser()
  resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }))
  resizeObserver.observe(mapElement.value)
})

watch(() => props.points, () => renderPoints(), { deep: false })
watch(() => props.activeCode, code => {
  for (const [pointCode, marker] of markers) marker.setIcon(markerIcon(pointCode === code, props.favoriteCodes.includes(pointCode)))
  const marker = markers.get(code)
  if (marker) map?.panInside(marker.getLatLng(), { padding: [50, 50] })
})
watch(() => props.favoriteCodes, codes => {
  for (const [pointCode, marker] of markers) marker.setIcon(markerIcon(pointCode === props.activeCode, codes.includes(pointCode)))
})
watch(() => props.userLocation, renderUser)
watch(() => props.focusLocation, () => {
  if (!map || !props.userLocation) return
  const nearest = props.points.find(point => point.code === props.activeCode)
  const coordinates = pickupCoordinates(nearest)
  if (coordinates && distanceKm(props.userLocation, coordinates) <= 50) {
    map.fitBounds([
      [props.userLocation.latitude, props.userLocation.longitude],
      [coordinates.latitude, coordinates.longitude]
    ], { padding: [42, 42], maxZoom: 14 })
  } else {
    map.flyTo([props.userLocation.latitude, props.userLocation.longitude], 13)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<style scoped>
.pickup-map-shell { position: relative; min-height: 420px; overflow: hidden; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-secondary); }
.pickup-map { width: 100%; height: 420px; z-index: 0; }
.pickup-map-empty { position: absolute; z-index: 500; inset: 0; display: grid; place-items: center; padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-secondary); }
:deep(.pickup-map-marker-wrap) { background: transparent; border: 0; }
:deep(.pickup-map-marker) { display: grid; place-items: center; width: 32px; height: 32px; border: 3px solid white; border-radius: 11px 11px 11px 3px; transform: rotate(-45deg); background: #8faaff; box-shadow: 0 5px 16px rgba(18, 25, 57, .45); color: #15204c; font-weight: 900; }
:deep(.pickup-map-marker.is-active) { background: #ffffff; border-color: #456cff; color: #2d4ec5; box-shadow: 0 0 0 5px rgba(78, 111, 255, .24); }
:deep(.pickup-map-marker.is-favorite) { background: #ffdc86; border-color: #fff8db; color: #594020; font-size: 14px; }
:deep(.pickup-map-marker.is-favorite.is-active) { box-shadow: 0 0 0 5px rgba(255, 210, 105, .4); }
:deep(.leaflet-control-attribution) { font-size: 10px; }
@media (max-width: 640px) { .pickup-map-shell { min-height: 340px; } .pickup-map { height: 340px; } }
</style>
