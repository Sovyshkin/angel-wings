<template>
  <section v-if="content.visible" id="events" class="events-section section">
    <div class="wrap">
      <div class="section-heading">
        <span class="eyebrow"><i></i>{{ content.eyebrow }}</span>
        <ForumTitle :title="content.title" />
      </div>

      <div class="forum-events__grid" data-reveal-events>
        <component
          :is="event.link ? 'a' : 'article'"
          v-for="(event, index) in content.items"
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
            <span v-if="event.date" class="forum-event-card__date"><Icon name="calendar" /><span>{{ event.date }}</span></span>
            <h3>{{ event.title }}</h3>
            <span v-if="event.place" class="forum-event-card__place"><Icon name="pin" /><span>{{ event.place }}</span></span>
          </div>
        </component>
      </div>
    </div>
  </section>
</template>

<script setup>
import Icon from './Icon.vue'
import ForumTitle from './ForumTitle.vue'

defineProps({ content: { type: Object, required: true } })
</script>

<style scoped src="./forumEvents.css"></style>
