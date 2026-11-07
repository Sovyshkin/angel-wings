<template>
  <section v-if="content.visible" id="application" class="form-section section">
    <div class="wrap forum-checkout-wrap">
      <form class="forum-checkout" @submit.prevent="submit">
        <img v-if="content.topMolecule" class="forum-checkout__molecule forum-checkout__molecule--top" :src="content.topMolecule" alt="" aria-hidden="true" loading="lazy">
        <img v-if="content.bottomMolecule" class="forum-checkout__molecule forum-checkout__molecule--bottom" :src="content.bottomMolecule" alt="" aria-hidden="true" loading="lazy">
        <div class="forum-checkout__content">
          <header class="forum-checkout__heading">
            <span v-if="content.eyebrow" class="eyebrow"><i></i>{{ content.eyebrow }}</span>
            <ForumTitle :title="content.title" />
            <p data-reveal-soft>{{ content.description }}</p>
          </header>

          <div class="forum-checkout__fields">
            <div v-for="field in visibleFields" :key="field.key" class="forum-checkout__field" :class="`forum-checkout__field--${field.key}`">
              <label :for="`forum-field-${field.key}`">{{ field.label }} <em v-if="field.required">*</em></label>
              <div class="forum-checkout__glass" :class="{ 'forum-checkout__glass--error': errors[field.key] }">
                <img :src="icons[field.key] || icons.name" alt="" aria-hidden="true">
                <input :id="`forum-field-${field.key}`" v-model.trim="form[field.key]" :type="field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'"
                  :autocomplete="autocomplete[field.key] || 'off'" :placeholder="field.placeholder" :required="field.required"
                  :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `error-${field.key}` : undefined"
                  @focus="start" @input="errors[field.key] = ''">
              </div>
              <small v-if="errors[field.key]" :id="`error-${field.key}`" role="alert">{{ errors[field.key] }}</small>
            </div>
          </div>

          <input v-model="form.website" class="honeypot" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="forum-checkout__actions">
            <label class="forum-checkout__consent">
              <input v-model="form.consent" type="checkbox" required>
              <span>{{ content.policyText }} <a :href="content.policyLink" target="_blank" rel="noopener">{{ content.policyLabel }}</a>.</span>
            </label>
            <button class="btn btn-primary forum-checkout__submit" type="submit" :disabled="sending || success">
              <span>{{ sending ? 'Отправляем…' : content.button }} <b>→</b></span>
            </button>
          </div>
          <p v-if="error" class="forum-checkout__error" role="alert">{{ error }}</p>
          <p v-if="success" class="forum-checkout__success" role="status">{{ content.success }}</p>
        </div>
      </form>
    </div>
  </section>
</template>
<script setup>
import { computed, reactive, ref } from 'vue'
import ForumTitle from './ForumTitle.vue'
const props=defineProps({content:Object,track:Function})
const form=reactive({name:'',company:'',position:'',email:'',phone:'',website:'',consent:false})
const errors=reactive({})
const error=ref(''),success=ref(false),sending=ref(false),started=ref(false)
const autocomplete={name:'name',company:'organization',position:'organization-title',email:'email',phone:'tel'}
const icons={name:'/checkout-assets/icon-user.svg',phone:'/checkout-assets/icon-phone.svg',email:'/checkout-assets/icon-email.svg',company:'/checkout-assets/icon-company.svg',position:'/checkout-assets/icon-position.svg'}
const fieldOrder=['name','phone','email','company','position']
const visibleFields=computed(()=>props.content.fields.filter(field=>field.visible).sort((a,b)=>{
 const left=fieldOrder.indexOf(a.key),right=fieldOrder.indexOf(b.key)
 return (left<0?fieldOrder.length:left)-(right<0?fieldOrder.length:right)
}))
function start(){if(!started.value){started.value=true;props.track('forum_form_start')}}
async function submit(){
 if(sending.value||success.value)return
 error.value='';Object.keys(errors).forEach(key=>delete errors[key])
 if(form.name.length<3)errors.name='Укажите ФИО'
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))errors.email='Укажите корректный email'
 if(form.phone.replace(/\D/g,'').length<10)errors.phone='Укажите корректный телефон'
 for(const field of visibleFields.value){if(field.required&&field.key!=='name'&&field.key!=='email'&&field.key!=='phone'&&!String(form[field.key]||'').trim())errors[field.key]='Заполните поле'}
 if(Object.keys(errors).length)return
 if(!form.consent){error.value='Подтвердите согласие на обработку данных';return}
 sending.value=true
 try{const extraFields=Object.fromEntries(visibleFields.value.filter(field=>field.key.startsWith('custom_')).map(field=>[field.key,form[field.key]||'']));const response=await fetch('/api/forum/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,extraFields})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Не удалось отправить заявку');success.value=true;props.track('forum_application_success')}
 catch(e){error.value=e.message||'Не удалось отправить заявку. Попробуйте ещё раз.'}
 finally{sending.value=false}
}
</script>

<style scoped src="./forumCheckout.css"></style>
