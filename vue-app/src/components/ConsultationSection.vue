<template>
  <section id="consultation" class="consultation-section">
    <div class="consultation-section__glow" aria-hidden="true"></div>
    <div class="consultation-section__orb consultation-section__orb--one" aria-hidden="true"></div>
    <div class="consultation-section__orb consultation-section__orb--two" aria-hidden="true"></div>
    <div class="container consultation-section__layout">
      <div class="consultation-section__copy">
        <span class="consultation-section__eyebrow">ЭКСПРЕСС-КОНСУЛЬТАЦИЯ</span>
        <h2>Конкретный вопрос.<br><em>Профессиональный ответ.</em></h2>
        <p class="consultation-section__lead">Разберите вопрос о пептидах со специалистом — без обязательства проходить полный разбор.</p>
        <div class="consultation-section__metrics">
          <div><strong>4 000 ₽</strong><span>стоимость</span></div>
          <div><strong>до 20 мин</strong><span>длительность</span></div>
          <div><strong>1 запрос</strong><span>в фокусе</span></div>
        </div>
        <div class="consultation-section__reward" aria-label="Условия возврата баллов">
          <span class="consultation-section__reward-icon" aria-hidden="true">+</span>
          <div>
            <span class="consultation-section__reward-kicker">БОНУС ДЛЯ ВАШЕГО АККАУНТА</span>
            <strong>4 000 баллов вернутся на ваш баланс</strong>
            <p>После завершения консультации и первой успешной покупки.</p>
          </div>
        </div>
        <router-link class="btn btn-accent consultation-section__cta" to="/contact?consultation=express">Оставить заявку <span>→</span></router-link>
        <p class="consultation-section__note">Текстовые сообщения или созвон — формат и оплата согласуются напрямую со специалистом.</p>
      </div>
    </div>

    <div class="container consultation-details">
      <div class="consultation-details__copy">
        <span class="consultation-section__eyebrow">ЧТО ВЫ ПОЛУЧИТЕ</span>
        <h3>Ответ по вашему<br><em>конкретному запросу.</em></h3>
        <ul>
          <li>Применение выбранного пептида</li>
          <li>Дозировки, схемы и правила хранения</li>
          <li>Противопоказания и важные ограничения</li>
          <li>Оценку: достаточно ли экспресс-формата или нужен подробный разбор</li>
        </ul>
        <p class="consultation-details__important"><strong>Важно:</strong> это разовая экспресс-консультация. Она не предполагает постоянную переписку с врачом и ответы на любые вопросы каждый день.</p>
        <p>Если вам нужен более глубокий разбор, можно оформить полноценную консультацию — с анализом лабораторных показателей, подбором питания и дополнительных БАДов или лекарственных препаратов по показаниям.</p>
        <router-link class="consultation-details__link" to="/contact?consultation=express">Оставить заявку <b>→</b></router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.consultation-section { position:relative; isolation:isolate; overflow:hidden; padding:7rem 0 6rem; background:linear-gradient(135deg,#070b18 0%,#0b1227 48%,#07101f 100%); color:#f7f9ff; }
.consultation-section:before { position:absolute; z-index:-1; inset:0; background-image:linear-gradient(rgba(128,162,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(128,162,255,.035) 1px,transparent 1px); background-size:64px 64px; content:""; mask-image:linear-gradient(to bottom,black,transparent 75%); }
.consultation-section__glow { position:absolute; z-index:-1; width:60rem; height:34rem; right:-20rem; top:-16rem; border-radius:50%; background:radial-gradient(ellipse,rgba(51,101,237,.24),transparent 68%); filter:blur(18px); }
.consultation-section__orb { position:absolute; z-index:-1; border:1px solid rgba(143,173,255,.24); border-radius:50%; box-shadow:inset 0 0 28px rgba(46,100,255,.16),0 0 38px rgba(43,99,255,.12); }
.consultation-section__orb--one { width:32rem; height:32rem; right:-10rem; top:5rem; }.consultation-section__orb--two { width:11rem; height:11rem; right:29%; bottom:5rem; }
.consultation-section__layout { display:block; max-width:62rem; padding-left:4rem; position:relative; }
.consultation-section__copy { position:relative; }.consultation-section__copy:before { position:absolute; left:-4rem; top:.2rem; width:2rem; height:1px; background:#91adff; box-shadow:0 0 14px rgba(120,161,255,.85); content:""; }
.consultation-section__eyebrow { display:block; margin-bottom:1.1rem; color:#9db7ff; font:700 .72rem/1 var(--font-mono); letter-spacing:.18em; }
.consultation-section h2 { max-width:940px; margin:0; font-family:var(--font-display); font-size:clamp(3rem,6vw,6.8rem); line-height:.88; letter-spacing:-.06em; }.consultation-section h2 em,.consultation-details h3 em { color:#93adff; font-style:italic; }
.consultation-section__lead { max-width:44rem; margin:1.8rem 0 2.1rem; color:rgba(225,233,255,.72); font-size:1.08rem; line-height:1.65; }
.consultation-section__metrics { display:flex; max-width:62rem; margin-bottom:2rem; border:1px solid rgba(137,168,255,.34); border-radius:18px; overflow:hidden; background:linear-gradient(120deg,rgba(47,76,148,.26),rgba(10,20,48,.55)); box-shadow:inset 0 1px rgba(196,211,255,.12),0 12px 30px rgba(0,0,0,.13); }.consultation-section__metrics div { flex:1; padding:1rem 1.15rem; border-right:1px solid rgba(137,168,255,.22); }.consultation-section__metrics div:last-child{border:0}.consultation-section__metrics strong { display:block; font-family:var(--font-display); font-size:1.32rem; color:#f7f9ff; }.consultation-section__metrics span { display:block; margin-top:.2rem; color:rgba(184,202,255,.62); font-size:.7rem; }
.consultation-section__reward { display:flex; gap:.9rem; align-items:flex-start; width:min(100%,40rem); margin:-.8rem 0 1.3rem; padding:.85rem 1rem; border:1px solid rgba(166,191,255,.54); border-radius:14px; background:linear-gradient(105deg,rgba(82,119,226,.28),rgba(27,48,108,.44)); box-shadow:inset 0 1px rgba(229,236,255,.18),0 10px 25px rgba(9,20,61,.2); }.consultation-section__reward-icon { display:grid; flex:0 0 auto; width:1.75rem; height:1.75rem; margin-top:.05rem; place-items:center; border:1px solid rgba(225,234,255,.62); border-radius:50%; background:rgba(167,193,255,.18); box-shadow:0 0 18px rgba(119,158,255,.45),inset 0 1px rgba(255,255,255,.28); color:#dbe6ff; font:400 1.35rem/1 var(--font-display); }.consultation-section__reward-kicker { display:block; margin-bottom:.28rem; color:#a8c0ff; font:700 .62rem/1 var(--font-mono); letter-spacing:.14em; }.consultation-section__reward strong { display:block; color:#f4f7ff; font:700 1rem/1.25 var(--font-body); }.consultation-section__reward p { margin:.25rem 0 0; color:rgba(211,224,255,.72); font-size:.75rem; line-height:1.4; }
.consultation-section__cta,.consultation-modal__pay { padding:1rem 1.35rem; border:1px solid rgba(173,195,255,.72); border-radius:999px; background:linear-gradient(135deg,#91abfb,#758fe3); box-shadow:0 10px 24px rgba(67,103,220,.28),inset 0 1px rgba(255,255,255,.38); color:#071126; }.consultation-section__cta span { margin-left:.75rem; font-size:1.4rem; }.consultation-section__note { margin:.9rem 0 0; color:rgba(180,199,250,.56); font-size:.78rem; }
.consultation-specialists { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1.2rem; margin-top:5rem; }.consultation-specialist { position:relative; min-height:24rem; overflow:hidden; border:1px solid rgba(132,164,255,.38); border-radius:1.2rem; background:#0c1630; box-shadow:inset 0 1px rgba(201,216,255,.15),0 20px 42px rgba(0,0,0,.22); transition:border-color .45s cubic-bezier(.22,1,.36,1),box-shadow .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1); }.consultation-specialist:before { position:absolute; z-index:1; top:0; left:8%; right:8%; height:1px; background:linear-gradient(90deg,transparent,#b4c9ff,transparent); opacity:.7; content:""; }.consultation-specialist:after { position:absolute; z-index:1; inset:-35%; background:radial-gradient(circle at 50% 100%,rgba(110,151,255,.2),transparent 34%); opacity:0; pointer-events:none; transition:opacity .5s ease; content:""; }.consultation-specialist:hover { border-color:rgba(181,204,255,.78); box-shadow:inset 0 1px rgba(220,229,255,.34),0 22px 45px rgba(1,7,22,.42),0 0 24px rgba(74,118,240,.14); transform:translateY(-3px); }.consultation-specialist:hover:after { opacity:1; }.consultation-specialist img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center 26%; }.consultation-specialist__content { position:absolute; z-index:3; left:1.1rem; bottom:1.1rem; }.consultation-specialist a { display:inline-flex; align-items:center; gap:.55rem; padding:.78rem 1rem; border:1px solid rgba(218,228,255,.56); border-radius:999px; background:rgba(7,14,32,.88); box-shadow:0 8px 22px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.12); color:#f6f8ff; font:700 .75rem var(--font-body); text-decoration:none; transition:background .3s ease,border-color .3s ease,letter-spacing .3s ease; }.consultation-specialist:hover a { border-color:#c1d3ff; background:rgba(20,39,84,.92); letter-spacing:.012em; }.consultation-specialist a b { color:#b9ceff; font-size:1rem; line-height:1; transition:transform .3s ease; }.consultation-specialist:hover a b { transform:translateX(3px); }.consultation-details__link { display:inline-block; margin-top:1.2rem; color:#edf2ff; font:700 .75rem var(--font-body); text-decoration:none; }.consultation-details__link b { margin-left:.5rem; color:#b9ceff; }
.consultation-details { margin-top:5rem; padding:3rem; border:1px solid rgba(132,164,255,.26); border-radius:1.35rem; background:linear-gradient(120deg,rgba(41,68,133,.19),rgba(7,14,34,.62)); box-shadow:inset 0 1px rgba(200,215,255,.1); }.consultation-details h3 { margin:0; font-family:var(--font-display); font-size:clamp(2rem,3.5vw,3.5rem); line-height:.98; letter-spacing:-.04em; }.consultation-details ul { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem 1.5rem; margin:2rem 0; padding:0; list-style:none; }.consultation-details li { position:relative; padding-left:1rem; color:rgba(225,233,255,.78); font-size:.92rem; line-height:1.45; }.consultation-details li:before { position:absolute; left:0; top:.43rem; width:.35rem; height:.35rem; border-radius:50%; background:#91adff; box-shadow:0 0 9px #799fff; content:""; }.consultation-details p { max-width:42rem; margin:0; color:rgba(185,204,255,.62); font-size:.85rem; line-height:1.6; }.consultation-details__link { color:#b7caff; }
.consultation-modal { position:fixed; z-index:120; inset:0; display:grid; place-items:center; padding:1rem; background:rgba(4,8,19,.8); backdrop-filter:blur(10px); overflow:auto; }.consultation-modal__panel { position:relative; width:min(100%,40rem); padding:2rem; border:1px solid rgba(144,174,255,.4); border-radius:1.25rem; background:linear-gradient(145deg,#152141,#090f23); box-shadow:0 2rem 6rem rgba(0,0,0,.5),inset 0 1px rgba(210,222,255,.12); }.consultation-modal__panel h2 { font-size:2.2rem; }.consultation-modal__panel>p { color:var(--text-secondary); line-height:1.5; }.consultation-modal__close { position:absolute; right:1rem; top:.8rem; border:0; background:none; color:#fff; font-size:2rem; cursor:pointer; }.consultation-modal label { display:block; margin-top:.9rem; color:#dbe5ff; font-size:.78rem; }.consultation-modal input:not([type="radio"]):not([type="checkbox"]),.consultation-modal textarea { box-sizing:border-box; width:100%; margin-top:.35rem; padding:.75rem .85rem; border:1px solid rgba(143,173,255,.24); border-radius:.7rem; background:rgba(2,8,24,.45); color:#fff; font:inherit; }.consultation-modal textarea { resize:vertical; }.consultation-modal fieldset { display:flex; gap:1rem; margin:1rem 0 0; padding:.75rem; border:1px solid rgba(143,173,255,.2); border-radius:.7rem; }.consultation-modal fieldset label { margin:0; }.consultation-modal__specialists { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }.consultation-modal__specialists button { padding:.7rem; border:1px solid rgba(143,173,255,.25); border-radius:.65rem; background:transparent; color:#dce5ff; font:inherit; font-size:.75rem; cursor:pointer; }.consultation-modal__specialists button.active { border-color:#91adff; background:rgba(100,137,237,.17); color:#fff; }.consultation-modal__consent { display:flex!important; gap:.6rem; align-items:flex-start; }.consultation-modal__consent input { margin:.13rem 0 0; }.consultation-modal__consent span { line-height:1.4; }.consultation-modal__pay { width:100%; margin-top:1rem; }.consultation-modal__error { color:#ff9b9b!important; }.consultation-modal small { display:block; margin-top:.7rem; color:rgba(187,203,255,.48); font-size:.68rem; line-height:1.4; }
@media(max-width:760px){.consultation-section { padding:4rem 0; }.consultation-section__layout { padding-left:2rem; }.consultation-section__copy:before { left:-2rem; width:1rem; }.consultation-section h2 { font-size:clamp(2.8rem,14vw,4.5rem); }.consultation-section__metrics { flex-wrap:wrap; }.consultation-section__metrics div { min-width:28%; padding:.85rem; }.consultation-specialists { grid-template-columns:1fr; margin-top:3rem; }.consultation-specialist { min-height:21rem; }.consultation-details { margin-top:3rem; padding:1.5rem; }.consultation-details ul { grid-template-columns:1fr; margin:1.5rem 0; }.consultation-section__orb--one { width:20rem; height:20rem; right:-12rem; }.consultation-modal__panel { padding:1.35rem; }.consultation-modal fieldset { flex-direction:column; gap:.55rem; }}
@media (max-width: 760px) {
  .consultation-section__layout {
    padding-right: 1.5rem;
  }

  .consultation-section h2 {
    max-inline-size: 100%;
    font-size: clamp(2.65rem, 10.5vw, 3.3rem);
    line-height: .92;
    overflow-wrap: anywhere;
  }

  .consultation-section__reward {
    gap: .7rem;
    margin: -1rem 0 1.1rem;
    padding: .8rem;
  }

  .consultation-section__reward strong {
    font-size: .9rem;
  }

  .consultation-details {
    margin-top: 2.5rem;
  }
}

.consultation-details {
  margin-top: 3.5rem;
}

.consultation-details__important {
  margin-bottom: 1rem !important;
  padding: 1rem 1.1rem;
  border-left: 2px solid #9eb8ff;
  border-radius: .35rem;
  background: rgba(102, 140, 242, .1);
  color: rgba(223, 232, 255, .88) !important;
}

@media (max-width: 760px) {
  .consultation-details {
    margin-top: 2.5rem;
  }
}
</style>
