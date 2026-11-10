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

          <div v-if="steps.length > 1" class="forum-checkout__progress" aria-label="Этапы заявки">
            <div class="forum-checkout__steps">
              <div v-for="(stage, index) in steps" :key="stage.key" class="forum-checkout__step-marker" :class="{ 'is-active': index === stepIndex, 'is-complete': index < stepIndex }" :aria-current="index === stepIndex ? 'step' : undefined">
                <span class="forum-checkout__step-number"><span :key="index < stepIndex ? 'done' : 'number'">{{ index < stepIndex ? '✓' : String(index + 1).padStart(2, '0') }}</span></span>
                <span class="forum-checkout__step-title">{{ stage.title }}</span>
              </div>
            </div>
            <div class="forum-checkout__progress-track" aria-hidden="true"><span :style="{ width: `${((stepIndex + 1) / steps.length) * 100}%` }"></span></div>
          </div>

          <div ref="panelFrame" class="forum-checkout__panel-frame">
          <Transition :name="stepDirection === 'forward' ? 'forum-step-forward' : 'forum-step-back'" mode="out-in" @before-leave="lockPanelHeight" @enter="resizePanel" @after-enter="unlockPanelHeight">
          <div :key="currentStep.key" class="forum-checkout__step-panel">
          <div class="forum-checkout__fields">
            <div v-for="(field, fieldIndex) in currentStep.fields" :key="field.key" class="forum-checkout__field" :class="`forum-checkout__field--${field.key}`" :style="{ '--field-index': fieldIndex }">
              <fieldset v-if="field.type === 'multiselect'" class="forum-checkout__topics" :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `error-${field.key}` : undefined">
                <legend>{{ field.label }} <em v-if="field.required">*</em></legend>
                <div class="forum-checkout__topic-options">
                  <label v-for="option in field.options" :key="option" class="forum-checkout__topic">
                    <input v-model="form.topics" type="checkbox" :value="option" @change="start(); errors[field.key] = ''">
                    <span>{{ option }}</span>
                  </label>
                </div>
              </fieldset>
              <template v-else>
                <label :for="`forum-field-${field.key}`">{{ field.label }} <em v-if="field.required">*</em></label>
                <div class="forum-checkout__glass" :class="{ 'forum-checkout__glass--error': errors[field.key] }">
                  <img :src="icons[field.key] || icons.name" alt="" aria-hidden="true">
                  <select v-if="field.type === 'select'" :id="`forum-field-${field.key}`" v-model="form[field.key]" :required="field.required"
                    :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `error-${field.key}` : undefined"
                    @focus="start" @change="errors[field.key] = ''">
                    <option value="" disabled>{{ field.placeholder || 'Выберите вариант' }}</option>
                    <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
                  </select>
                  <input v-else :id="`forum-field-${field.key}`" v-model.trim="form[field.key]" :type="field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'"
                    :autocomplete="autocomplete[field.key] || 'off'" :placeholder="field.placeholder" :required="field.required"
                    :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `error-${field.key}` : undefined"
                    @focus="start" @input="errors[field.key] = ''">
                </div>
              </template>
              <small v-if="errors[field.key]" :id="`error-${field.key}`" role="alert">{{ errors[field.key] }}</small>
            </div>
          </div>
          </div>
          </Transition>
          </div>

          <input v-model="form.website" class="honeypot" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="forum-checkout__actions">
            <button v-if="stepIndex > 0" type="button" class="forum-checkout__back" @click="previousStep"><span aria-hidden="true">←</span> {{ content.backButton }}</button>
            <label v-if="isLastStep" class="forum-checkout__consent">
              <input v-model="form.consent" type="checkbox" required>
              <span>{{ content.policyText }} <a :href="content.policyLink" target="_blank" rel="noopener">{{ content.policyLabel }}</a>.</span>
            </label>
            <button v-if="!isLastStep" class="btn btn-primary forum-checkout__submit" type="button" @click="nextStep">
              <span>{{ content.nextButton }} <b>→</b></span>
            </button>
            <button v-else class="btn btn-primary forum-checkout__submit" type="submit" :disabled="sending || success">
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
const form=reactive({name:'',company:'',position:'',email:'',phone:'',city:'',role:'',topics:[],website:'',consent:false})
const errors=reactive({})
const error=ref(''),success=ref(false),sending=ref(false),started=ref(false)
const autocomplete={name:'name',company:'organization',position:'organization-title',email:'email',phone:'tel',city:'address-level2'}
const icons={name:'/checkout-assets/icon-user.svg',phone:'/checkout-assets/icon-phone.svg',email:'/checkout-assets/icon-email.svg',company:'/checkout-assets/icon-company.svg',position:'/checkout-assets/icon-position.svg',city:'/checkout-assets/icon-company.svg',role:'/checkout-assets/icon-user.svg'}
const fieldOrder=['name','phone','email','city','role','position','company','topics']
const visibleFields=computed(()=>props.content.fields.filter(field=>field.visible).sort((a,b)=>{
 const left=fieldOrder.indexOf(a.key),right=fieldOrder.indexOf(b.key)
 return (left<0?fieldOrder.length:left)-(right<0?fieldOrder.length:right)
}))
const stepIndex=ref(0)
const stepDirection=ref('forward')
const panelFrame=ref(null)
const steps=computed(()=>[
 {key:'contacts',title:props.content.stepContactTitle,fields:visibleFields.value.filter(field=>['name','phone','email'].includes(field.key))},
 {key:'profile',title:props.content.stepProfileTitle,fields:visibleFields.value.filter(field=>['city','role','position','company'].includes(field.key)||field.key.startsWith('custom_'))},
 {key:'interests',title:props.content.stepInterestsTitle,fields:visibleFields.value.filter(field=>field.key==='topics')}
].filter(step=>step.fields.length))
const currentStep=computed(()=>steps.value[stepIndex.value])
const isLastStep=computed(()=>stepIndex.value===steps.value.length-1)
function start(){if(!started.value){started.value=true;props.track('forum_form_start')}}
function validateFields(fields){
 for(const field of fields){
  const value=form[field.key]
  if(field.key==='name'&&String(value||'').trim().length<3)errors.name='Укажите ФИО'
  else if(field.key==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value||''))errors.email='Укажите корректный email'
  else if(field.key==='phone'&&String(value||'').replace(/\D/g,'').length<10)errors.phone='Укажите корректный телефон'
  else if(field.required&&(Array.isArray(value)?!value.length:!String(value||'').trim()))errors[field.key]='Заполните поле'
  else delete errors[field.key]
 }
 return !fields.some(field=>errors[field.key])
}
function nextStep(){
 error.value=''
 if(!validateFields(currentStep.value.fields))return
 start()
 stepDirection.value='forward'
 stepIndex.value=Math.min(stepIndex.value+1,steps.value.length-1)
 props.track(`forum_form_step_${stepIndex.value+1}`)
}
function previousStep(){
 error.value=''
 stepDirection.value='back'
 stepIndex.value=Math.max(0,stepIndex.value-1)
}
function lockPanelHeight(element){
 if(panelFrame.value)panelFrame.value.style.height=`${element.offsetHeight}px`
}
function resizePanel(element){
 if(panelFrame.value)panelFrame.value.style.height=`${element.offsetHeight}px`
}
function unlockPanelHeight(){
 if(panelFrame.value)panelFrame.value.style.height=''
}
async function submit(){
 if(sending.value||success.value)return
 error.value=''
 for(const [index,stage] of steps.value.entries()){
  if(!validateFields(stage.fields)){
   stepDirection.value=index < stepIndex.value ? 'back' : 'forward'
   stepIndex.value=index
   return
  }
 }
 if(!form.consent){error.value='Подтвердите согласие на обработку данных';return}
 sending.value=true
 try{const extraFields=Object.fromEntries(visibleFields.value.filter(field=>['city','role','topics'].includes(field.key)||field.key.startsWith('custom_')).map(field=>[field.key,form[field.key]||'']));const response=await fetch('/api/forum/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,extraFields})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Не удалось отправить заявку');success.value=true;props.track('forum_application_success')}
 catch(e){error.value=e.message||'Не удалось отправить заявку. Попробуйте ещё раз.'}
 finally{sending.value=false}
}
</script>

<style scoped src="./forumCheckout.css"></style>
