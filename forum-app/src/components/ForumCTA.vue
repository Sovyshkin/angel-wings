<template>
  <section v-if="content.visible" class="cta-section wrap">
    <div class="cta-panel">
      <video v-if="content.video" class="cta-panel__background" :src="content.video" muted autoplay loop playsinline preload="metadata" aria-hidden="true"></video>
      <img v-else-if="content.image" class="cta-panel__background" :src="content.image" alt="" loading="lazy" decoding="async">
      <div class="cta-panel__shade" aria-hidden="true"></div>
      <img v-if="content.leftMolecule" class="cta-panel__molecule cta-panel__molecule--left" :src="content.leftMolecule" alt="" loading="lazy" decoding="async">
      <img v-if="content.rightMolecule" class="cta-panel__molecule cta-panel__molecule--right" :src="content.rightMolecule" alt="" loading="lazy" decoding="async">
      <div class="cta-panel__copy">
        <ForumTitle :title="content.title" />
        <p data-reveal-soft>{{ content.description }}</p>
      </div>
      <a v-if="showForm" class="btn btn-primary" href="#application" @click="track('forum_apply_click')"><span>{{ content.button }} <b>→</b></span></a>
    </div>
  </section>
</template>

<script setup>
import ForumTitle from './ForumTitle.vue'

defineProps({ content: { type: Object, required: true }, showForm: Boolean, track: Function })
</script>

<style scoped src="./forumCTA.css"></style>
