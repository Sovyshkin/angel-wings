<template>
  <section v-if="content.visible" id="application" class="form-section section">
    <div class="wrap forum-checkout-wrap">
      <div v-if="ticketId" class="forum-checkout forum-ticket" role="status">
        <span class="eyebrow"><i></i>ВАШ БИЛЕТ</span>
        <h2>Билет на розыгрыш оформлен</h2>
        <p>{{ content.success }}</p>
        <span class="forum-ticket__label">Уникальный номер билета</span>
        <strong class="forum-ticket__number">{{ ticketId }}</strong>
        <p class="forum-ticket__note">{{ ticketSaveError ? 'Браузер не разрешил сохранить номер. Скопируйте его сейчас.' : 'Сохраните номер. Он также останется в этом браузере.' }}</p>
        <div class="forum-ticket__email" aria-live="polite">
          <strong>{{ emailStatus === 'sent' ? 'Билет отправлен на почту' : emailStatus === 'failed' ? 'Письмо пока не отправлено' : emailStatus === 'cooldown' ? 'Письмо недавно отправлялось' : ticketCheckError ? 'Статус письма недоступен' : 'Проверяем отправку письма' }}</strong>
          <p v-if="emailStatus === 'sent'">Проверьте входящие письма и папку «Спам».</p>
          <p v-else>Билет уже оформлен и сохранён здесь. Вы сможете повторить отправку письма.</p>
          <button type="button" :disabled="emailSending || emailRetryLeft > 0" @click="resendTicketEmail">{{ emailSending ? 'Отправляем…' : emailRetryLeft > 0 ? `Повторить через ${emailRetryLeft} с` : 'Отправить письмо ещё раз' }}</button>
        </div>
        <p v-if="ticketCheckError" class="forum-ticket__warning">Не удалось проверить билет на сервере. Номер сохранён в этом браузере.</p>
        <div class="forum-ticket__actions">
          <button type="button" class="btn btn-primary" @click="copyTicket">{{ copied ? 'Номер скопирован' : 'Скопировать номер' }}</button>
        </div>
      </div>
      <form v-else class="forum-checkout" @submit.prevent="submit">
        <img v-if="content.topMolecule" class="forum-checkout__molecule forum-checkout__molecule--top" :src="content.topMolecule" alt="" aria-hidden="true" loading="lazy">
        <img v-if="content.bottomMolecule" class="forum-checkout__molecule forum-checkout__molecule--bottom" :src="content.bottomMolecule" alt="" aria-hidden="true" loading="lazy">
        <div class="forum-checkout__content">
          <header class="forum-checkout__heading">
            <span v-if="content.eyebrow" class="eyebrow"><i></i>{{ content.eyebrow }}</span>
            <ForumTitle :title="content.title" />
            <p data-reveal-soft>{{ content.description }}</p>
            <div class="forum-checkout__prize" aria-label="Розыгрыш 50 тысяч рублей">
              <div><span>РОЗЫГРЫШ ANGEL WINGS</span><strong>50 000 ₽</strong></div>
              <p>Заполните заявку — после отправки вы получите уникальный номер билета на экране и по почте.</p>
            </div>
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
                  <input v-else :id="`forum-field-${field.key}`" :value="form[field.key] || ''" :type="field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'"
                    :autocomplete="autocomplete[field.key] || 'off'" :placeholder="field.placeholder" :required="field.required"
                    :inputmode="field.key === 'phone' ? 'tel' : field.key === 'email' ? 'email' : undefined"
                    :aria-invalid="!!errors[field.key]" :aria-describedby="errors[field.key] ? `error-${field.key}` : undefined"
                    @focus="start" @input="handleFieldInput($event, field.key)" @compositionend="handleFieldInput($event, field.key)" @blur="validateFields([field])">
                </div>
                <div v-if="field.key === 'email' && emailSuggestionOptions.length" class="forum-checkout__email-suggestions" aria-label="Подсказки для почты">
                  <span>Быстрый выбор:</span>
                  <button v-for="suggestion in emailSuggestionOptions" :key="suggestion" type="button" @mousedown.prevent @click="applyEmailSuggestion(suggestion)">{{ suggestion }}</button>
                </div>
                <span v-if="field.key === 'email'" class="forum-checkout__field-hint">На эту почту отправим ваш билет после оформления.</span>
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
        </div>
      </form>
    </div>
  </section>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import ForumTitle from './ForumTitle.vue'
import { emailSuggestions, maskPhoneInput, normalizeEmailInput, subscriberDigits } from '../utils/contactInput.js'
const props=defineProps({content:Object,track:Function})
const ticketStorageKey='angel-wings:giveaway-ticket:v1'
const browserStorageKey='angel-wings:giveaway-browser:v1'
const ticketFormat=/^AW-(?:[A-F0-9]{4}-){3}[A-F0-9]{4}$/
const browserIdFormat=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
function savedTicket(){try{const value=localStorage.getItem(ticketStorageKey);return ticketFormat.test(value||'')?value:null}catch{return null}}
function getBrowserId(){
 try{
  const saved=localStorage.getItem(browserStorageKey)
  if(browserIdFormat.test(saved||''))return saved
  const bytes=window.crypto.getRandomValues(new Uint8Array(16))
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128
  const hex=[...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('')
  const created=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
  localStorage.setItem(browserStorageKey,created)
  const current=localStorage.getItem(browserStorageKey)
  return browserIdFormat.test(current||'')?current:null
 }catch{return null}
}
const ticketId=ref(savedTicket())
const ticketCheckError=ref(false),ticketSaveError=ref(false),copied=ref(false)
const emailStatus=ref(''),emailSending=ref(false),emailRetryLeft=ref(0)
let emailRetryTimer=null
function applyEmailDelivery(result){
 if(result?.emailStatus)emailStatus.value=result.emailStatus
 clearInterval(emailRetryTimer)
 emailRetryLeft.value=Math.max(0,Number(result?.retryAfterSeconds)||0)
 if(emailRetryLeft.value)emailRetryTimer=setInterval(()=>{
  emailRetryLeft.value=Math.max(0,emailRetryLeft.value-1)
  if(!emailRetryLeft.value)clearInterval(emailRetryTimer)
 },1000)
}
function syncTicketFromOtherTab(event){
 if(event.key===ticketStorageKey&&ticketFormat.test(event.newValue||''))ticketId.value=event.newValue
}
onMounted(async()=>{
 window.addEventListener('storage',syncTicketFromOtherTab)
 if(!ticketId.value)return
 const checkedTicket=ticketId.value
 const browserId=getBrowserId()
 if(!browserId){ticketCheckError.value=true;return}
 try{
  const response=await fetch('/api/forum/applications/ticket/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticketId:checkedTicket,browserId})})
  if(ticketId.value!==checkedTicket)return
  if(response.status===404){clearTicket();return}
  if(!response.ok)throw new Error('Не удалось проверить билет')
  const result=await response.json()
  if(ticketId.value===checkedTicket&&ticketFormat.test(result.ticketId||'')){
   ticketId.value=result.ticketId
   applyEmailDelivery(result)
   try{localStorage.setItem(ticketStorageKey,result.ticketId)}catch{ticketSaveError.value=true}
  }
 }catch{if(ticketId.value===checkedTicket)ticketCheckError.value=true}
})
onBeforeUnmount(()=>{window.removeEventListener('storage',syncTicketFromOtherTab);clearInterval(emailRetryTimer)})
function clearTicket(){try{localStorage.removeItem(ticketStorageKey)}catch{}clearInterval(emailRetryTimer);ticketId.value=null;ticketCheckError.value=false;ticketSaveError.value=false;emailStatus.value='';emailRetryLeft.value=0;copied.value=false;success.value=false}
async function copyTicket(){try{await navigator.clipboard.writeText(ticketId.value);copied.value=true}catch{copied.value=false}}
async function resendTicketEmail(){
 if(emailSending.value||emailRetryLeft.value||!ticketId.value)return
 const browserId=getBrowserId()
 if(!browserId){emailStatus.value='failed';return}
 emailSending.value=true
 try{
  const response=await fetch('/api/forum/applications/ticket/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({browserId,ticketId:ticketId.value})})
  const result=await response.json()
  if(!response.ok)throw new Error(result.error||'Не удалось отправить письмо')
  applyEmailDelivery(result)
 }catch{emailStatus.value='failed'}
 finally{emailSending.value=false}
}
const form=reactive({name:'',company:'',position:'',email:'',phone:'',city:'',role:'',topics:[],website:'',consent:false})
const errors=reactive({})
const error=ref(''),success=ref(false),sending=ref(false),started=ref(false)
const emailSuggestionOptions=computed(()=>emailSuggestions(form.email))
function handleFieldInput(event,key){
 const input=event.target
 start()
 if(key==='phone'){
  const masked=maskPhoneInput(input.value,input.selectionStart??input.value.length,event.inputType,form.phone)
  form.phone=masked.value
  input.value=masked.value
  input.setSelectionRange(masked.caret,masked.caret)
 }else if(key==='email'){
  if(event.isComposing){form.email=input.value;return}
  const caret=normalizeEmailInput(input.value.slice(0,input.selectionStart??input.value.length)).length
  form.email=normalizeEmailInput(input.value)
  input.value=form.email
  input.setSelectionRange(caret,caret)
 }else form[key]=input.value
 errors[key]=''
}
function applyEmailSuggestion(value){form.email=value;errors.email='';document.getElementById('forum-field-email')?.focus()}
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
  else if(field.key==='phone'&&subscriberDigits(value).length!==10)errors.phone='Укажите номер из 10 цифр после +7'
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
 if(sending.value||success.value||ticketId.value)return
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
 try{
  const send=async()=>{
   const existing=savedTicket()
   if(existing){ticketId.value=existing;return}
   const browserId=getBrowserId()
   if(!browserId)throw new Error('Браузер не разрешил сохранить данные. Разрешите хранение данных сайта и попробуйте снова.')
   const extraFields=Object.fromEntries(visibleFields.value.filter(field=>['city','role','topics'].includes(field.key)||field.key.startsWith('custom_')).map(field=>[field.key,form[field.key]||'']))
   const response=await fetch('/api/forum/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,extraFields,browserId})})
   const result=await response.json()
   if(!response.ok||!result.ok)throw new Error(result.error||'Не удалось отправить заявку')
   if(!ticketFormat.test(result.ticketId||''))throw new Error('Заявка получена, но номер билета не пришёл. Обратитесь к нам.')
   ticketId.value=result.ticketId
   applyEmailDelivery(result)
   try{localStorage.setItem(ticketStorageKey,result.ticketId)}catch{ticketSaveError.value=true}
   success.value=true
   props.track(result.alreadyRegistered?'forum_application_existing':'forum_application_success')
  }
  if(navigator.locks?.request)await navigator.locks.request('angel-wings-giveaway-submit',send)
  else await send()
 }
 catch(e){error.value=e.message||'Не удалось отправить заявку. Попробуйте ещё раз.'}
 finally{sending.value=false}
}
</script>

<style scoped src="./forumCheckout.css"></style>
