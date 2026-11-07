<template>
  <section v-if="content.visible" id="events" class="events-section section">
    <div class="wrap">
      <div class="section-heading">
        <span class="eyebrow"><i></i>{{ content.eyebrow }}</span>
        <ForumTitle :title="content.title" />
        <p v-if="content.description" class="forum-events__description">{{ content.description }}</p>
      </div>

      <div class="forum-events__grid" data-reveal-events>
        <component
          :is="event.link ? 'a' : 'article'"
          v-for="(event, index) in visibleItems"
          :key="`${event.title}-${index}`"
          :href="event.link || undefined"
          class="forum-event-card"
          :aria-label="event.link ? `Подробнее: ${event.title}` : undefined"
        >
          <div class="forum-event-card__media" aria-hidden="true">
            <video v-if="event.video" :src="event.video" autoplay muted loop playsinline preload="metadata"></video>
            <img v-else-if="event.image" :src="event.image" alt="" loading="lazy" decoding="async" width="721" height="724">
          </div>
          <div class="forum-event-card__content">
            <span class="forum-event-card__date" :class="{ 'is-pending': !event.date }"><Icon name="calendar" /><span>{{ event.date || content.datePendingLabel }}</span></span>
            <h3>{{ event.title }}</h3>
            <span class="forum-event-card__place" :class="{ 'is-pending': !event.place }"><Icon name="pin" /><span>{{ event.place || content.placePendingLabel }}</span></span>
          </div>
        </component>
      </div>
    </div>
  </section>
</template>

<script setup>
import Icon from './Icon.vue'
import ForumTitle from './ForumTitle.vue'

import { computed } from 'vue'
const props = defineProps({ content: { type: Object, required: true } })
const visibleItems = computed(() => props.content.items.filter(item => item.visible !== false))
</script>

<style scoped src="./forumEvents.css"></style>
