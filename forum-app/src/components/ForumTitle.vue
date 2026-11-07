<template><component :is="tag" :data-reveal-title="tag==='h1'?undefined:''"><span v-for="(line,index) in lines" :key="index" class="reveal-line" :class="{accent:index===lines.length-1&&accentLast}"><span>{{ line }}</span></span></component></template>
<script setup>
import {computed} from 'vue'
const props=defineProps({title:{type:String,default:''},tag:{type:String,default:'h2'},accentLast:{type:Boolean,default:false}})
const preferred={'Форум современных пептидных решений':['Форум','современных','пептидных решений'],'Почему стоит участвовать?':['Почему стоит','участвовать?'],'Ключевые решения Angel Wings':['Ключевые решения','Angel Wings'],'Angel Wings — наука и качество':['Angel Wings —','наука и качество'],'Станьте частью сообщества Angel Wings':['Станьте частью','сообщества Angel Wings']}
const lines=computed(()=>{const title=props.title.trim();if(!title)return[];if(title.includes('\n'))return title.split('\n').map(x=>x.trim()).filter(Boolean);if(preferred[title])return preferred[title];if(title.length<28)return[title];const words=title.split(/\s+/),half=title.length/2;let cut=1,length=words[0].length;for(let i=1;i<words.length-1;i++){if(Math.abs(length-half)>Math.abs(length+1+words[i].length-half)){length+=1+words[i].length;cut=i+1}else break}return[words.slice(0,cut).join(' '),words.slice(cut).join(' ')]})
</script>
