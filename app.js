// ════════════════════════════════════════════════════════════════
// EVENTBOT — Sistema de Gerenciamento de Eventos Musicais
// Versão simplificada com login persistente do Google
// ════════════════════════════════════════════════════════════════

// ── CONSTANTS ──
const DEFAULT_VENUES = [
  {name:'Allianz Parque',addr:'Av. Francisco Matarazzo, 1705 - Água Branca, São Paulo - SP'},
  {name:'Audio',addr:'Av. Francisco Matarazzo, 694 - Barra Funda, São Paulo - SP'},
  {name:'Autódromo de Interlagos',addr:'Av. Sen. Teotonio Vilela, 261 - Jardim Malia I, São Paulo - SP'},
  {name:'Burning House',addr:'Av. Santa Marina, 247 - Água Branca, São Paulo - SP'},
  {name:'Carioca Club Pinheiros',addr:'Rua Cardeal Arcoverde, 2899 - Pinheiros, São Paulo - SP'},
  {name:'Cine Joia',addr:'Praça Carlos Gomes, 82 - Liberdade, São Paulo - SP'},
  {name:'City Lights Music Hall',addr:'R. Padre Garcia Velho, 61 - Pinheiros, São Paulo - SP'},
  {name:'Espaço Unimed',addr:'R. Tagipuru, 795 - Barra Funda, São Paulo - SP'},
  {name:'Espaço Usine',addr:'R. Barra Funda, 973 - Barra Funda, São Paulo - SP'},
  {name:'Estádio do Morumbi',addr:'Praça Roberto Gomes Pedrosa, 1 - Morumbi, São Paulo - SP'},
  {name:'Fabrique Club',addr:'R. Barra Funda, 1071 - Barra Funda, São Paulo - SP'},
  {name:'Fenda 315',addr:'Rua Doutor Cândido Espinheira, 315 - Perdizes, São Paulo - SP'},
  {name:'Hangar 110',addr:'R. Rodolfo Miranda, 110 - Bom Retiro, São Paulo - SP'},
  {name:'La Iglesia',addr:'Rua João Moura, 515 - Galpão 06, São Paulo - SP'},
  {name:'Manifesto',addr:'Rua Ramos Batista, 207 - Vila Olímpia, São Paulo - SP'},
  {name:'Memorial da América Latina',addr:'Av. Mario de Andrade, 664 - Barra Funda, São Paulo - SP'},
  {name:'Red Star Studios',addr:'R. Teodoro Sampaio, 462 - Pinheiros, São Paulo - SP'},
  {name:'Sesc Belenzinho',addr:'R. Padre Adelino, 1000 - Belenzinho, São Paulo - SP'},
  {name:'Sesc Bom Retiro',addr:'Alameda Nothmann, 185 - Campos Elísios, São Paulo - SP'},
  {name:'Suhai Music Hall',addr:'Av. das Nações Unidas, 22540 - Jurubatuba, São Paulo - SP'},
  {name:'Terra SP',addr:'Av. Salim Antonio Curiati, 160 - Campo Grande, São Paulo - SP'},
  {name:'Tokio Marine Hall',addr:'R. Bragança Paulista, 1281 - Várzea de Baixo, São Paulo - SP'},
  {name:'Vibra São Paulo',addr:'Av. das Nações Unidas, 17955 - Vila Almeida, São Paulo - SP'},
  {name:'Vip Station',addr:'R. Gibraltar, 346 - Santo Amaro, São Paulo - SP'},
];

const SLOTS = ['11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const END_T = '23:30';
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
// Status de presença removido em v4.0
// Foco simplificado: apenas cadastro de eventos

// ── EXTRACTION SYSTEM (v2.0) ──
// Carregado via script tag no index.html

// ── STATE ──
let cfg = {
  clientId: '483752309274-of13qhrd0udioaen2dvf8cno2egimsvq.apps.googleusercontent.com',
  apiKey: 'AIzaSyBHopQnhjbP569baNBOxAMcHAnN-faQnm8',
  calendarId: '39fbbd9c5f4505e1cb6cd6e61371d3563d8cc9d5fff677fc87e7b32abe14f767@group.calendar.google.com',
  openRouterKey: '',
  serviceAccount: null,
};

let VENUES = [];
let flow = {state: 'idle', data: {}};
let evHist = [];
let sessionVenues = new Set();
let gapiReady = false;
let tokenClient = null;
let accessToken = null;
let userPhoto = null;
let editingEventId = null;
let editingHistIdx = null;
let batchQueue = [];
let batchIdx = 0;
let darkMode = true;
let currentPage = 'chat'; // 'chat', 'events', 'dashboard', 'profile'
let selectedEventNum = null;
let duplicateCache = {};

// v4.0: Gamification & Theme System
let userPoints = 0;
let userBadges = [];
let currentTheme = 'dark'; // 'dark', 'light', 'ocean', 'forest', 'sunset'
let fontSize = 14;
let sidebarCompact = false;

// ── BOOT ──
window.addEventListener('load', () => {
  loadConfig();
  loadVenues();
  loadGapi();
  setupTextarea();
  setupKeyboardShortcuts();
  setTimeout(welcome, 380);
});

function loadConfig() {
  try {
    const s = JSON.parse(localStorage.getItem('eb_cfg') || '{}');
    Object.keys(s).forEach(k => { if (s[k]) cfg[k] = s[k]; });
  } catch(e) {}
  
  try {
    const sa = localStorage.getItem('eb_sa');
    if (sa) cfg.serviceAccount = JSON.parse(sa);
  } catch(e) {}
}

function loadVenues() {
  try {
    const v = localStorage.getItem('eb_venues');
    if (v) VENUES = JSON.parse(v);
    else VENUES = JSON.parse(JSON.stringify(DEFAULT_VENUES));
  } catch(e) {
    VENUES = JSON.parse(JSON.stringify(DEFAULT_VENUES));
  }
}

function setupTextarea() {
  const el = document.getElementById('chat-input');
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  el.addEventListener('input', () => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeEventsModal();
      closeEditModal();
      closeBatchModal();
    }
  });
  
  ['cfg-modal','events-modal','edit-modal','batch-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => {
      if (e.target === el) el.classList.add('hidden');
    });
  });
}

function saveVenues() {
  localStorage.setItem('eb_venues', JSON.stringify(VENUES));
}

// ════════════════════════════════════════════════════════════════
// GOOGLE AUTH — Simplified with persistent login
// ════════════════════════════════════════════════════════════════

function b64url(s) {
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

function j64(o) {
  return b64url(JSON.stringify(o));
}

// Service Account JWT generation
async function getSAToken() {
  const sa = cfg.serviceAccount;
  if (!sa?.private_key || !sa?.client_email) return null;
  
  try {
    const cached = JSON.parse(sessionStorage.getItem('sa_tok') || 'null');
    if (cached && cached.exp > Date.now()/1000 + 60) return cached.tok;
    
    const now = Math.floor(Date.now()/1000);
    const msg = j64({alg:'RS256',typ:'JWT'}) + '.' + j64({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/calendar.events',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    });
    
    const pem = sa.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');
    const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8', der,
      {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'},
      false, ['sign']
    );
    
    const sig = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(msg)
    );
    
    const jwt = msg + '.' + b64url(String.fromCharCode(...new Uint8Array(sig)));
    
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt
    });
    
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e.error_description || e.error);
    }
    
    const d = await r.json();
    sessionStorage.setItem('sa_tok', JSON.stringify({
      tok: d.access_token,
      exp: now + 3500
    }));
    
    return d.access_token;
  } catch(e) {
    console.warn('SA:', e.message);
    return null;
  }
}

let _gR = false, _gsR = false, _gQ = [], _gsQ = [];
function waitGapi() { return _gR ? Promise.resolve() : new Promise(r => _gQ.push(r)); }
function waitGIS() { return _gsR ? Promise.resolve() : new Promise(r => _gsQ.push(r)); }
function _rG() { _gR = true; _gQ.forEach(r => r()); _gQ = []; }
function _rGS() { _gsR = true; _gsQ.forEach(r => r()); _gsQ = []; }

function loadGapi() {
  const s1 = document.createElement('script');
  s1.src = 'https://apis.google.com/js/api.js';
  s1.onload = () => { gapiReady = true; _rG(); };
  s1.onerror = () => { gapiReady = true; _rG(); };
  document.head.appendChild(s1);
  
  const s2 = document.createElement('script');
  s2.src = 'https://accounts.google.com/gsi/client';
  s2.onload = () => { initGIS(); _rGS(); };
  s2.onerror = () => _rGS();
  document.head.appendChild(s2);
}

function initGIS() {
  if (!cfg.clientId || typeof google === 'undefined') return;
  
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: cfg.clientId,
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile',
    callback: resp => {
      if (resp.error) {
        console.warn('GIS', resp);
        return;
      }
      accessToken = resp.access_token;
      sessionStorage.setItem('oauth_tok', JSON.stringify({
        tok: resp.access_token,
        exp: Math.floor(Date.now()/1000) + 3300
      }));
      setSt(true, 'Conectado');
      fetchUserPhoto();
    },
  });
  
  // Try to restore session
  tryRestoreSession();
}

async function tryRestoreSession() {
  // Try Service Account first
  if (cfg.serviceAccount?.private_key) {
    const tok = await getSAToken();
    if (tok) {
      accessToken = tok;
      setSt(true, 'Service Account');
      return;
    }
  }
  
  // Try cached OAuth token
  try {
    const c = JSON.parse(sessionStorage.getItem('oauth_tok') || 'null');
    if (c && c.exp > Date.now()/1000 + 60) {
      accessToken = c.tok;
      setSt(true, 'Conectado');
      fetchUserPhoto();
      return;
    }
  } catch(e) {}
}

function fetchUserPhoto() {
  if (!accessToken) return;
  
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {'Authorization': 'Bearer ' + accessToken}
  })
  .then(r => r.json())
  .then(d => {
    if (d.picture) {
      userPhoto = d.picture;
      document.querySelectorAll('.msg.user .av').forEach(av => {
        av.textContent = '';
        const img = document.createElement('img');
        img.src = d.picture;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
        av.appendChild(img);
      });
    }
  })
  .catch(() => {});
}

function setSt(on, label) {
  document.getElementById('sdot').classList.toggle('on', on);
  document.getElementById('slabel').textContent = on ? (label || 'Conectado') : 'Desconectado';
  document.getElementById('status-pill').classList.toggle('on', on);
}

async function ensureAuth() {
  // Try Service Account first
  if (cfg.serviceAccount?.private_key) {
    const tok = await getSAToken();
    if (tok) {
      accessToken = tok;
      setSt(true, 'Service Account');
      return;
    }
  }
  
  // Try cached OAuth token
  try {
    const c = JSON.parse(sessionStorage.getItem('oauth_tok') || 'null');
    if (c && c.exp > Date.now()/1000 + 60) {
      accessToken = c.tok;
      setSt(true, 'Conectado');
      return;
    }
  } catch(e) {}
  
  // If we have a token, assume it's still valid
  if (accessToken) {
    setSt(true, 'Conectado');
    return;
  }
  
  // Need to authenticate
  if (!cfg.clientId) {
    throw new Error('Configure o Client ID ou Service Account nas Configurações.');
  }
  
  await Promise.all([waitGapi(), waitGIS()]);
  
  if (!tokenClient) initGIS();
  if (!tokenClient) {
    const origin = window.location.origin;
    throw new Error('Erro ao inicializar Google Sign-In. Verifique se "' + origin + '" está nas Origens autorizadas do seu OAuth Client ID no Google Cloud Console.');
  }
  
  return new Promise((res, rej) => {
    tokenClient.callback = resp => {
      if (resp.error) return rej(new Error('Login cancelado: ' + resp.error));
      accessToken = resp.access_token;
      sessionStorage.setItem('oauth_tok', JSON.stringify({
        tok: resp.access_token,
        exp: Math.floor(Date.now()/1000) + 3300
      }));
      setSt(true, 'Conectado');
      res();
      fetchUserPhoto();
    };
    tokenClient.requestAccessToken({prompt: ''});
  });
}

// ════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR API
// ════════════════════════════════════════════════════════════════

async function createEvents(ev) {
  await ensureAuth();
  const out = [];
  
  for (const slot of (ev.times || ['11:00'])) {
    const resource = {
      summary: ev.title,
      location: ev.venue_addr || ev.venue || '',
      description: ev.ticketLink ? 'Ingressos: ' + ev.ticketLink : (ev.desc || ''),
      start: {
        dateTime: ev.date + 'T' + slot + ':00',
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: ev.date + 'T' + END_T + ':00',
        timeZone: 'America/Sao_Paulo'
      },
    };
    
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' + 
                encodeURIComponent(cfg.calendarId) + '/events';
    
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resource)
    });
    
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      let msg = err?.error?.message || 'HTTP ' + r.status;
      if (r.status === 403 || msg.includes('writer')) {
        msg += cfg.serviceAccount?.client_email
          ? ' — Compartilhe o calendário com: ' + cfg.serviceAccount.client_email
          : ' — Verifique permissões ou use "primary" como Calendar ID.';
      }
      throw new Error(msg);
    }
    
    out.push(await r.json());
  }
  
  return out;
}

// ════════════════════════════════════════════════════════════════
// OPENROUTER AI
// ════════════════════════════════════════════════════════════════

const OR_MODELS = [
  'openrouter/auto',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-4-scout:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
];

async function fetchPageText(url) {
  const proxies = [
    u => 'https://corsproxy.io/?' + encodeURIComponent(u),
    u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
  ];
  
  for (const mk of proxies) {
    try {
      const r = await fetch(mk(url), {signal: AbortSignal.timeout(7000)});
      if (!r.ok) continue;
      const d = document.createElement('div');
      d.innerHTML = await r.text();
      d.querySelectorAll('script,style,nav,footer,header,aside,iframe').forEach(el => el.remove());
      const t = d.innerText.replace(/\s+/g, ' ').trim().substring(0, 6000);
      if (t.length > 80) return t;
    } catch(e) {}
  }
  return '';
}

async function callOpenRouter(prompt) {
  if (!cfg.openRouterKey) {
    throw new Error('Configure a chave de API do OpenRouter nas Configurações.');
  }
  
  for (const model of OR_MODELS) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.openRouterKey,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'EventBot'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Você é um extrator de dados de eventos musicais do Brasil. Responda SOMENTE com JSON válido, sem markdown.'
            },
            {role: 'user', content: prompt}
          ],
          max_tokens: 400,
          temperature: 0.1
        }),
      });
      
      const data = await r.json();
      
      if (!r.ok) {
        const msg = data?.error?.message || 'HTTP ' + r.status;
        if (r.status === 429 || r.status === 404 || msg.includes('endpoint') || msg.includes('quota')) {
          continue;
        }
        throw new Error(msg);
      }
      
      const txt = data.choices?.[0]?.message?.content;
      if (txt) return txt;
    } catch(e) {
      if (e.message.includes('endpoint') || e.message.includes('quota')) continue;
      throw e;
    }
  }
  
  throw new Error('Nenhum modelo OpenRouter disponível. Tente em instantes.');
}

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function toH(s) {
  return String(s)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function tNow() {
  return new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
}

function isUrl(s) {
  return /^https?:\/\//i.test(s.trim());
}

function fmtDate(iso) {
  if (!iso) return '-';
  try {
    const p = iso.split('-');
    return p[2] + ' de ' + MS[parseInt(p[1]) - 1] + ' de ' + p[0];
  } catch(e) {
    return iso;
  }
}

function toast(msg, type) {
  const el = document.getElementById('toast');
  document.getElementById('t-msg').textContent = msg;
  el.className = 'toast ' + (type || '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 4000);
}

function MC() {
  return document.getElementById('msgs');
}

function makeAv(isUser) {
  const el = document.createElement('div');
  el.className = 'av';
  if (isUser && userPhoto) {
    const img = document.createElement('img');
    img.src = userPhoto;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
    el.appendChild(img);
  } else {
    el.textContent = isUser ? 'EU' : 'EB';
  }
  return el;
}

// ════════════════════════════════════════════════════════════════
// CHAT UI
// ════════════════════════════════════════════════════════════════

function botMsg(html, qrs = []) {
  const wrap = document.createElement('div');
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = toH(html);
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  wrap.appendChild(m);
  
  if (qrs.length) {
    const q = document.createElement('div');
    q.className = 'qrs';
    qrs.forEach(r => {
      const b = document.createElement('button');
      b.className = 'qr';
      b.textContent = r.label;
      b.onclick = () => {
        userMsg(r.label);
        q.remove();
        r.cb();
      };
      q.appendChild(b);
    });
    wrap.appendChild(q);
  }
  
  MC().appendChild(wrap);
  MC().scrollTop = 9999;
  return wrap;
}

function userMsg(txt) {
  const m = document.createElement('div');
  m.className = 'msg user';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = txt;
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(true));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'typing';
  el.id = 'typing';
  el.appendChild(makeAv(false));
  
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  el.appendChild(dots);
  
  MC().appendChild(el);
  MC().scrollTop = 9999;
}

function hideTyping() {
  document.getElementById('typing')?.remove();
}

// ════════════════════════════════════════════════════════════════
// CALENDAR WIDGET
// ════════════════════════════════════════════════════════════════

function showCalendar(onPick) {
  const today = new Date();
  let yr = today.getFullYear();
  let mo = today.getMonth();
  
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = 'Selecione a <strong>data do evento</strong>:<div class="cal-wrap" id="cwrap"></div>';
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
  
  let sel = null;
  
  function render() {
    const cEl = document.getElementById('cwrap');
    const first = new Date(yr, mo, 1).getDay();
    const days = new Date(yr, mo + 1, 0).getDate();
    
    let h = '<div class="cal-header">' +
      '<button class="cal-nav" id="cprev">&#8249;</button>' +
      '<div class="cal-month">' + MONTHS[mo] + ' ' + yr + '</div>' +
      '<button class="cal-nav" id="cnext">&#8250;</button>' +
      '</div><div class="cal-grid">';
    
    DAYS.forEach(d => h += '<div class="cal-dn">' + d + '</div>');
    
    for (let i = 0; i < first; i++) {
      h += '<div class="cal-d empty"></div>';
    }
    
    for (let d = 1; d <= days; d++) {
      const dObj = new Date(yr, mo, d);
      const iso = yr + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      let cls = 'cal-d';
      
      if (dObj.toDateString() === today.toDateString()) cls += ' today';
      if (dObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) cls += ' past';
      if (sel === iso) cls += ' selected';
      
      h += '<div class="' + cls + '" data-iso="' + iso + '">' + d + '</div>';
    }
    
    h += '</div><button class="cal-confirm" id="cok"' + (sel ? '' : ' disabled') + '>' +
      (sel ? 'Confirmar ' + fmtDate(sel) : 'Escolha uma data') + '</button>';
    
    cEl.innerHTML = h;
    
    cEl.querySelectorAll('.cal-d:not(.empty):not(.past)').forEach(el => {
      el.onclick = () => {
        sel = el.dataset.iso;
        render();
      };
    });
    
    cEl.querySelector('#cprev').onclick = () => {
      if (mo > 0) mo--;
      else { mo = 11; yr--; }
      render();
    };
    
    cEl.querySelector('#cnext').onclick = () => {
      if (mo < 11) mo++;
      else { mo = 0; yr++; }
      render();
    };
    
    cEl.querySelector('#cok').onclick = () => {
      if (!sel) return;
      m.remove();
      onPick(sel);
    };
  }
  
  render();
}

// ════════════════════════════════════════════════════════════════
// TIME PICKER
// ════════════════════════════════════════════════════════════════

function showTimePicker(onDone) {
  let sel = new Set();
  
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = 'Selecione os <strong>horários de início</strong>:' +
    '<br><small>Todos terminam às ' + END_T + '</small>' +
    '<div class="time-picker">' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px" id="swrap">' +
    SLOTS.map(t => '<button class="slot-toggle" data-t="' + t + '">' + t + '</button>').join('') +
    '</div>' +
    '<div class="time-acts">' +
    '<button class="btn-sm" id="sall">Todos</button>' +
    '<button class="btn-sm" id="sclr">Limpar</button>' +
    '<button class="btn-sm pri" id="sok">Confirmar</button>' +
    '</div></div>';
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
  
  m.querySelectorAll('.slot-toggle').forEach(b => {
    b.onclick = () => {
      const t = b.dataset.t;
      if (sel.has(t)) {
        sel.delete(t);
        b.classList.remove('active');
      } else {
        sel.add(t);
        b.classList.add('active');
      }
    };
  });
  
  m.querySelector('#sall').onclick = () => {
    sel = new Set(SLOTS);
    m.querySelectorAll('.slot-toggle').forEach(b => b.classList.add('active'));
  };
  
  m.querySelector('#sclr').onclick = () => {
    sel.clear();
    m.querySelectorAll('.slot-toggle').forEach(b => b.classList.remove('active'));
  };
  
  m.querySelector('#sok').onclick = () => {
    if (!sel.size) {
      toast('Selecione ao menos um horário', 'error');
      return;
    }
    m.remove();
    onDone(Array.from(sel).sort());
  };
}

// ════════════════════════════════════════════════════════════════
// VENUE PICKER
// ════════════════════════════════════════════════════════════════

function showVenuePicker(onPick) {
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  cw.style.cssText = 'max-width:80%;width:100%';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.maxWidth = '100%';
  bubble.innerHTML = 'Escolha o <strong>local do evento</strong>:' +
    '<div style="margin-top:10px">' +
    '<input class="venue-search" id="vsrch" placeholder="Filtrar local..."/>' +
    '<div class="venue-list" id="vlist">' +
    VENUES.map((v, i) => 
      '<div class="venue-item" data-i="' + i + '">' +
      '<div class="vn">' + esc(v.name) + '</div>' +
      '<div class="va">' + esc(v.addr) + '</div>' +
      '</div>'
    ).join('') +
    '</div></div>';
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
  
  m.querySelectorAll('.venue-item').forEach(el => {
    el.onclick = () => {
      m.remove();
      onPick(VENUES[+el.dataset.i]);
    };
  });
  
  m.querySelector('#vsrch').oninput = function() {
    const q = this.value.toLowerCase();
    m.querySelectorAll('.venue-item').forEach(el => {
      const v = VENUES[+el.dataset.i];
      el.style.display = (v.name.toLowerCase().includes(q) || v.addr.toLowerCase().includes(q)) ? '' : 'none';
    });
  };
}

// ════════════════════════════════════════════════════════════════
// STATUS PICKER
// ════════════════════════════════════════════════════════════════

// v4.0: Função showStatusPicker removida - foco simplificado em cadastro

// ════════════════════════════════════════════════════════════════
// EVENT PREVIEW
// ════════════════════════════════════════════════════════════════

function showPreview(ev) {
  flow.state = 'preview';
  
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  cw.style.cssText = 'max-width:82%;width:100%';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.maxWidth = '100%';
  
  const sH = (ev.times || ['11:00']).map(t => 
    '<span class="slot-chip">' + t + ' - ' + END_T + '</span>'
  ).join('');
  
  const stBadge = '';
  
  bubble.innerHTML = 'Confira e confirme:' +
    '<div class="ev-card">' +
    '<div class="ev-card-head">' +
    '<div style="flex:1;padding-left:8px">' +
    '<div class="ev-title">' + esc(ev.title) + '</div>' +
    '<div style="margin-top:7px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
    '<span class="ev-date-badge">' + fmtDate(ev.date) + '</span>' +
    stBadge +
    '</div></div></div>' +
    '<div class="ev-card-body">' +
    '<div class="ev-row"><span class="ev-row-lbl">Local</span><span class="ev-row-val">' + esc(ev.venue || ev.venue_name || '-') + '</span></div>' +
    '<div class="ev-row"><span class="ev-row-lbl">Horários</span><div><div class="slots-wrap">' + sH + '</div></div></div>' +
    (ev.ticketLink ? '<div class="ev-row"><span class="ev-row-lbl">Ingressos</span><span class="ev-row-val" style="font-size:12.5px;word-break:break-all">' + esc(ev.ticketLink) + '</span></div>' : '') +
    '<div class="ev-row"><span class="ev-row-lbl">Término</span><span class="ev-row-val">' + END_T + ' (fixo)</span></div>' +
    '</div>' +
    '<div class="ev-card-foot">' +
    '<button class="btn-primary" id="ev-ok">Confirmar e cadastrar</button>' +
    '<button class="btn-edit" id="ev-edit">Editar</button>' +
    '<button class="btn-ghost" id="ev-no">Cancelar</button>' +
    '</div>' +
    '</div>';
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
  
  const okBtn = m.querySelector('#ev-ok');
  const editBtn = m.querySelector('#ev-edit');
  const noBtn = m.querySelector('#ev-no');
  
  const dis = () => {
    okBtn.disabled = true;
    editBtn.disabled = true;
    noBtn.disabled = true;
  };
  
  okBtn.onclick = async () => {
    dis();
    showTyping();
    try {
      const res = await createEvents(ev);
      hideTyping();
      if (res && res[0] && res[0].id) ev._gcalId = res[0].id;
      addHist(ev);
      botMsg('<strong>Evento cadastrado!</strong> ' + res.length + ' entrada(s) no Google Calendar.', [
        {label: 'Por link', cb: startLink},
        {label: 'Manual', cb: startManual}
      ]);
      toast('Evento cadastrado!', 'success');
      flow = {state: 'idle', data: {}};
    } catch(e) {
      hideTyping();
      botMsg('<strong>Erro:</strong> ' + esc(e.message), [
        {label: 'Configuracoes', cb: () => openModal('api')},
        {label: 'Tentar novamente', cb: () => showPreview(ev)}
      ]);
      toast(e.message, 'error');
      flow.state = 'idle';
    }
  };
  
  editBtn.onclick = () => {
    openEditModal(ev, null, ev._gcalId || null);
  };
  
  noBtn.onclick = () => {
    dis();
    botMsg('Cancelado.', [
      {label: 'Por link', cb: startLink},
      {label: 'Manual', cb: startManual}
    ]);
    flow = {state: 'idle', data: {}};
  };
}

// ════════════════════════════════════════════════════════════════
// CONVERSATION FLOWS
// ════════════════════════════════════════════════════════════════

function welcome() {
  // Alert if Google OAuth is not configured properly
  if (!cfg.serviceAccount?.private_key && !cfg.clientId) {
    botMsg('⚠️ <strong>Atenção:</strong> Você precisa configurar o Google OAuth para usar o sistema de login. <br>Clique em "Configurações" no menu lateral e configure seu Client ID.', [
      {label: 'Configurar', cb: () => openModal('cfg')}
    ]);
  } else if (!cfg.serviceAccount?.private_key) {
    // Try to restore session
    tryRestoreSession().then(() => {
      botMsg('Olá! 👋 Como quer cadastrar?', [
        {label: 'Show por link', cb: startLink},
        {label: 'Show manual', cb: startManual},
        {label: 'Filme', cb: startMovie},
        {label: 'Lote de links', cb: openBatchModal},
      ]);
    }).catch(() => {
      botMsg('Olá! 👋 Como quer cadastrar? (Login não configurado)', [
        {label: 'Show por link', cb: startLink},
        {label: 'Show manual', cb: startManual},
        {label: 'Configurar Google', cb: () => openModal('cfg')},
        {label: 'Lote de links', cb: openBatchModal},
      ]);
    });
    return;
  }
  
  if (cfg.serviceAccount?.private_key) {
    getSAToken().then(tok => {
      if (tok) {
        accessToken = tok;
        setSt(true, 'Service Account');
      }
    });
  }
  
  try {
    initDarkMode();
    initTheme();
    initFontSize();
    initv4();
  } catch(e) {
    console.log('Init error:', e.message);
  }
  
  botMsg('Olá! 👋 Como quer cadastrar?', [
    {label: 'Show por link', cb: startLink},
    {label: 'Show manual', cb: startManual},
    {label: 'Filme', cb: startMovie},
    {label: 'Lote de links', cb: openBatchModal},
  ]);
}

function askShowHow() {
  botMsg('Como quer cadastrar?', [
    {label: 'Por link', cb: startLink},
    {label: 'Manual', cb: startManual},
  ]);
}

function startLink() {
  flow = {state: 'await_link', data: {}};
  botMsg('Cole o <strong>link do evento</strong> (Sympla, Fastix, Eventbrite...)');
}

function startManual() {
  flow = {state: 'manual_name', data: {}};
  botMsg('Qual e o <strong>nome do evento</strong>?');
}

function startMovie() {
  flow = {state: 'await_movie_link', data: {type: 'movie'}};
  botMsg('Cole o link do filme no <strong>ingresso.com</strong>:');
}

function qa(t) {
  if (t === 'link') {
    userMsg('Por link');
    startLink();
  } else if (t === 'manual') {
    userMsg('Manual');
    startManual();
  } else {
    userMsg('Ver locais');
    let html = '<strong>Locais disponíveis (' + VENUES.length + '):</strong><br><br>';
    VENUES.forEach((v, i) => {
      html += (i + 1) + '. <strong>' + esc(v.name) + '</strong><br>' +
        '<span style="color:var(--sage);font-size:12.5px">' + esc(v.addr) + '</span><br><br>';
    });
    botMsg(html, [
      {label: 'Manual', cb: startManual},
      {label: 'Por link', cb: startLink}
    ]);
    flow.state = 'idle';
  }
}

// ════════════════════════════════════════════════════════════════
// MESSAGE HANDLER
// ════════════════════════════════════════════════════════════════

async function send() {
  const el = document.getElementById('chat-input');
  const txt = el.value.trim();
  if (!txt) return;
  
  el.value = '';
  el.style.height = 'auto';
  userMsg(txt);
  await handle(txt);
}

async function handle(txt) {
  const lo = txt.toLowerCase();
  const st = flow.state;
  
  if (st === 'idle') {
    if (isUrl(txt)) {
      // Auto-detect: ingresso.com = movie, else = show
      if (txt.includes('ingresso.com') || txt.includes('ingresso.')) {
        flow = {state: 'await_movie_link', data: {type: 'movie'}};
        handleMovieLink(txt);
      } else {
        flow = {state: 'await_link', data: {}};
        handleLink(txt);
      }
    } else if (lo.includes('link')) {
      startLink();
    } else if (lo.includes('filme') || lo.includes('movie') || lo.includes('cinema')) {
      startMovie();
    } else if (lo.includes('manual') || lo.includes('cadastr') || lo.includes('event') || lo.includes('show')) {
      botMsg('Como deseja cadastrar?', [
        {label: 'Por link', cb: startLink},
        {label: 'Manual', cb: startManual},
        {label: 'Filme', cb: startMovie}
      ]);
    } else {
      botMsg('Como posso ajudar?', [
        {label: 'Por link', cb: startLink},
        {label: 'Manual', cb: startManual},
        {label: 'Filme', cb: startMovie},
        {label: 'Ver locais', cb: () => qa('list')},
      ]);
    }
    return;
  }
  
  if (st === 'await_link') {
    if (isUrl(txt)) {
      await handleLink(txt);
    } else {
      botMsg('Isso não parece uma URL válida. Cole o link completo (https://...).');
    }
    return;
  }
  
  if (st === 'await_movie_link') {
    if (isUrl(txt)) {
      await handleMovieLink(txt);
    } else {
      botMsg('Isso não parece uma URL válida. Cole o link do ingresso.com.');
    }
    return;
  }
  
  if (st === 'await_movie_title') {
    flow.data.title = txt;
    if (!flow.data.date) {
      botMsg('Filme: <strong>' + esc(txt) + '</strong><br>Selecione a data:');
      showCalendar(date => {
        flow.data.date = date;
        showMoviePreview(flow.data);
      });
    } else {
      showMoviePreview(flow.data);
    }
    return;
  }
  
  if (st === 'manual_name') {
    flow.data.title = txt;
    flow.state = 'manual_venue';
    botMsg('Evento: <strong>"' + esc(txt) + '"</strong><br>Escolha o local:');
    showVenuePicker(v => {
      flow.data.venue = v.name;
      flow.data.venue_addr = v.addr;
      flow.state = 'manual_date';
      botMsg('Local: <strong>' + esc(v.name) + '</strong><br>Selecione a data:');
      showCalendar(date => {
        flow.data.date = date;
        flow.state = 'manual_times';
        botMsg('Data: <strong>' + fmtDate(date) + '</strong><br>Selecione os horários:');
        showTimePicker(times => {
          flow.data.times = times;
          flow.state = 'manual_status';
          botMsg('Horários: <strong>' + times.join(', ') + '</strong> (término ' + END_T + ')');
          flow.state = 'manual_ticket';
          botMsg('Tem <strong>link de ingressos</strong>? Cole aqui ou envie "não" para pular.');
        });
      });
    });
    return;
  }
  
  if (st === 'manual_ticket') {
    const skip = ['não', 'n', 'nope', 'pular', 'skip'];
    if (!skip.includes(lo)) flow.data.ticketLink = txt;
    showPreview(flow.data);
    return;
  }
  
  botMsg('Não entendi.', [
    {label: 'Por link', cb: startLink},
    {label: 'Manual', cb: startManual}
  ]);
  flow.state = 'idle';
}

// ════════════════════════════════════════════════════════════════
// LINK HANDLER
// ════════════════════════════════════════════════════════════════

async function handleLink(url) {
  flow.state = 'idle';
  
  if (!cfg.openRouterKey) {
    botMsg('OpenRouter não configurado. Qual é o <strong>nome do evento</strong>?');
    flow.data.ticketLink = url;
    flow.state = 'manual_name';
    return;
  }
  
  showTyping();
  botMsg('Analisando link...');
  
  try {
    const ex = await extractFromLinkEnhanced(url);
    hideTyping();
    
    flow.data = {
      title: ex.title || '',
      date: ex.date || '',
      times: ex.times || ['19:00'],
      venue: ex.venue || '',
      venue_addr: ex.venue_addr || '',
      ticketLink: ex.ticketLink || url,
      desc: ex.desc || '',
    };
    
    if (!flow.data.title) {
      flow.state = 'manual_name';
      botMsg('Não encontrei o nome. Qual é o <strong>nome do evento</strong>?');
      return;
    }
    
    if (!flow.data.date) {
      botMsg('Evento: <strong>' + esc(flow.data.title) + '</strong><br>Não encontrei a data:');
      showCalendar(date => {
        flow.data.date = date;
        afterLink();
      });
      return;
    }
    
    afterLink();
  } catch(e) {
    hideTyping();
    const isQuota = e.message.toLowerCase().includes('quota') || e.message.toLowerCase().includes('cota');
    
    if (isQuota) {
      botMsg('Cota da API esgotada. Qual e o <strong>nome do evento</strong>?');
      flow.data.ticketLink = url;
      flow.state = 'manual_name';
    } else {
      botMsg('<strong>Erro:</strong> ' + esc(e.message), [
        {label: 'Cadastro manual', cb: startManual},
        {label: 'Configuracoes', cb: () => openModal('api')},
      ]);
    }
  }
}

function afterLink() {
  const d = flow.data;
  botMsg('Dados extraidos:<br>' +
    '- <strong>Evento:</strong> ' + esc(d.title) + '<br>' +
    '- <strong>Data:</strong> ' + fmtDate(d.date) + '<br>' +
    '- <strong>Horário:</strong> ' + d.times.join(', ') + '<br>' +
    '- <strong>Local:</strong> ' + esc(d.venue || '-'), [
    {label: 'Confirmar', cb: () => {
      showPreview(flow.data);
    }},
    {label: 'Editar horários', cb: () => {
      showTimePicker(t => {
        flow.data.times = t;
        showPreview(flow.data);
      });
    }},
  ]);
}

// ════════════════════════════════════════════════════════════════
// MOVIE FLOW
// ════════════════════════════════════════════════════════════════

async function handleMovieLink(url) {
  flow.state = 'idle';
  
  if (!cfg.openRouterKey) {
    toast('Configure a chave de API do OpenRouter nas Configurações', 'error');
    botMsg('OpenRouter não configurado. Veja as Configurações.');
    return;
  }
  
  showTyping();
  botMsg('Extraindo dados do filme...');
  
  try {
    const pageText = await fetchPageText(url);
    const prompt = 'Extraia dados do filme e retorne SOMENTE JSON valido, sem markdown. ' +
      'Formato: {"title":"Nome do Filme","date":"YYYY-MM-DD"} ' +
      'Regras: title deve ser apenas o nome do filme sem cinema/sala; date pode ser null. ' +
      'URL: ' + url + ' Conteudo: ' + (pageText || '(indisponivel)');
    
    const txt = await callOpenRouter(prompt);
    const clean = txt.trim();
    const match = clean.match(/\{[\s\S]*\}/);
    
    if (!match) throw new Error('Resposta invalida do modelo.');
    
    const ex = JSON.parse(match[0]);
    hideTyping();
    
    const ev = {
      type: 'movie',
      title: ex.title || '',
      date: ex.date || '',
      ticketLink: url,
      allDay: true,
      colorId: '8', // Grafite
    };
    
    if (!ev.title) {
      botMsg('Não encontrei o nome do filme. Qual é o <strong>nome</strong>?');
      flow = {state: 'await_movie_title', data: ev};
      return;
    }
    
    if (!ev.date) {
      botMsg('Filme: <strong>' + esc(ev.title) + '</strong><br>Não encontrei a data:');
      showCalendar(date => {
        ev.date = date;
        showMoviePreview(ev);
      });
      return;
    }
    
    showMoviePreview(ev);
  } catch(e) {
    hideTyping();
    botMsg('<strong>Erro:</strong> ' + esc(e.message), [
      {label: 'Tentar novamente', cb: startMovie},
      {label: 'Configuracoes', cb: () => openModal('api')},
    ]);
  }
}

function showMoviePreview(ev) {
  flow.state = 'preview';
  
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  cw.style.cssText = 'max-width:80%;width:100%';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.maxWidth = '100%';
  
  bubble.innerHTML = 'Confirme o cadastro do filme:' +
    '<div class="ev-card">' +
    '<div class="ev-card-head"><div style="flex:1;padding-left:8px;min-width:0">' +
    '<div class="ev-title">' + esc(ev.title) + '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">' +
    '<span class="ev-date-badge">' + fmtDate(ev.date) + '</span>' +
    '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(97,97,97,.2);border:1px solid rgba(97,97,97,.4);color:#aaa">Dia inteiro</span>' +
    '</div>' +
    '</div></div>' +
    '<div class="ev-card-body">' +
    '<div class="ev-row"><span class="ev-row-lbl">Tipo</span><span class="ev-row-val">Filme</span></div>' +
    (ev.ticketLink ? '<div class="ev-row"><span class="ev-row-lbl">Link</span><span class="ev-row-val" style="font-size:12px;word-break:break-all">' + esc(ev.ticketLink) + '</span></div>' : '') +
    '<div class="ev-row"><span class="ev-row-lbl">Cor</span><span class="ev-row-val" style="display:flex;align-items:center;gap:6px"><span style="width:11px;height:11px;border-radius:50%;background:#616161;display:inline-block"></span>Grafite (marrom mais proximo)</span></div>' +
    '</div>' +
    '<div class="ev-card-foot">' +
    '<button class="btn-primary" id="mov-ok">Confirmar e cadastrar</button>' +
    '<button class="btn-ghost" id="mov-no">Cancelar</button>' +
    '</div></div>';
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
  
  const dis = () => {
    m.querySelector('#mov-ok').disabled = true;
    m.querySelector('#mov-no').disabled = true;
  };
  
  m.querySelector('#mov-ok').onclick = async () => {
    dis();
    showTyping();
    
    try {
      await ensureAuth();
      
      const resource = {
        summary: ev.title,
        description: ev.ticketLink ? 'Ingressos: ' + ev.ticketLink : '',
        start: {date: ev.date},
        end: {date: ev.date},
        colorId: ev.colorId || '8',
      };
      
      const url = 'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(cfg.calendarId) + '/events';
      
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resource),
      });
      
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'HTTP ' + r.status);
      }
      
      const res = await r.json();
      hideTyping();
      ev._gcalId = res.id;
      addHist(ev);
      
      botMsg('<strong>Filme cadastrado!</strong> Evento de dia inteiro no Google Calendar.', [
        {label: 'Cadastrar outro filme', cb: startMovie},
        {label: 'Show / Evento', cb: askShowHow},
      ]);
      
      toast('Filme cadastrado!', 'success');
      flow = {state: 'idle', data: {}};
    } catch(e) {
      hideTyping();
      botMsg('<strong>Erro:</strong> ' + esc(e.message), [
        {label: 'Tentar novamente', cb: () => showMoviePreview(ev)},
        {label: 'Configuracoes', cb: () => openModal('api')},
      ]);
      toast(e.message, 'error');
      flow.state = 'idle';
    }
  };
  
  m.querySelector('#mov-no').onclick = () => {
    dis();
    botMsg('Cancelado.', [
      {label: 'Show / Evento', cb: askShowHow},
      {label: 'Filme', cb: startMovie},
    ]);
    flow = {state: 'idle', data: {}};
  };
}

// ════════════════════════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════════════════════════

function addHist(ev) {
  evHist.unshift(ev);
  if (ev.venue) sessionVenues.add(ev.venue);
  addPoints(10, 'Evento cadastrado');
  checkBadges();
  renderHist();
}

function renderHist() {
  document.getElementById('stat-count').textContent = evHist.length;
  document.getElementById('stat-venues').textContent = sessionVenues.size;
  
  const stColor = {going: '#6fcf7a', maybe: '#F6BF26', nogo: '#e57373'};
  const stBg = {going: 'rgba(111,207,122,.12)', maybe: 'rgba(246,191,38,.12)', nogo: 'rgba(229,115,115,.12)'};
  const stLabel = {going: 'Vou', maybe: 'Pensando', nogo: 'Não vou'};
  
  if (!evHist.length) {
    document.getElementById('hist-list').innerHTML = '<div class="h-empty">Nenhum evento ainda.</div>';
    return;
  }
  
  document.getElementById('hist-list').innerHTML = evHist.map((e, i) => {
    const typeBadge = e.type === 'movie'
      ? '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:rgba(97,97,97,.25);color:#aaa;margin-left:4px">filme</span>'
      : '';
    
    return '<div class="h-item" onclick="editEventFromHist(' + i + ')">' +
      '<div class="ht">' + esc(e.title || '-') + typeBadge + '</div>' +
      '<div class="hm">' + fmtDate(e.date) + (e.venue ? ' &middot; ' + esc(e.venue) : '') + '</div>' +
      '</div>';
  }).join('');
}

// ════════════════════════════════════════════════════════════════
// MODALS
// ════════════════════════════════════════════════════════════════

function switchTab(t) {
  document.querySelectorAll('.modal-tab').forEach((el, i) => 
    el.classList.toggle('active', ['api', 'sa', 'venues'][i] === t)
  );
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  
  if (t === 'venues') renderVenueManager();
  if (t === 'sa') renderSAStatus();
}

function openModal(tab) {
  if (tab === 'events') {
    const mon = document.getElementById('ev-month');
    if (mon) {
      const now = new Date();
      mon.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }
    document.getElementById('events-modal').classList.remove('hidden');
    loadCalendarEvents();
    return;
  }
  
  document.getElementById('c-cid').value = cfg.clientId;
  document.getElementById('c-key').value = cfg.apiKey;
  document.getElementById('c-cal').value = cfg.calendarId;
  document.getElementById('c-gem').value = cfg.openRouterKey;
  document.getElementById('cfg-modal').classList.remove('hidden');
  switchTab(tab || 'api');
}

function closeModal() {
  document.getElementById('cfg-modal').classList.add('hidden');
}

function closeEventsModal() {
  document.getElementById('events-modal').classList.add('hidden');
}

function saveCfg() {
  cfg.clientId = document.getElementById('c-cid').value.trim();
  cfg.apiKey = document.getElementById('c-key').value.trim();
  cfg.calendarId = document.getElementById('c-cal').value.trim() || 'primary';
  cfg.openRouterKey = document.getElementById('c-gem').value.trim();
  
  localStorage.setItem('eb_cfg', JSON.stringify(cfg));
  closeModal();
  
  accessToken = null;
  sessionStorage.removeItem('oauth_tok');
  setSt(false);
  initGIS();
  
  toast('Configuracoes salvas!', 'success');
}

// ── SERVICE ACCOUNT ──
function renderSAStatus() {
  const sa = cfg.serviceAccount;
  const stEl = document.getElementById('sa-status');
  const cbEl = document.getElementById('sa-clear-btn');
  
  if (sa?.client_email) {
    stEl.style.display = 'block';
    stEl.innerHTML = 'Ativa: <strong>' + esc(sa.client_email) + '</strong><br>' +
      '<small style="opacity:.7">Login permanente habilitado</small>';
    cbEl.style.display = '';
    document.getElementById('sa-json').value = '';
  } else {
    stEl.style.display = 'none';
    cbEl.style.display = 'none';
  }
}

function saveSA() {
  const raw = document.getElementById('sa-json').value.trim();
  if (!raw) {
    toast('Cole o JSON da Service Account', 'error');
    return;
  }
  
  try {
    const sa = JSON.parse(raw);
    if (!sa.private_key || !sa.client_email) {
      throw new Error('Campos obrigatorios ausentes');
    }
    if (sa.type !== 'service_account') {
      throw new Error('Campo "type" deve ser "service_account"');
    }
    
    cfg.serviceAccount = sa;
    localStorage.setItem('eb_sa', JSON.stringify(sa));
    sessionStorage.removeItem('sa_tok');
    renderSAStatus();
    
    ensureAuth()
      .then(() => {
        toast('Service Account ativa!', 'success');
        setSt(true, 'Service Account');
      })
      .catch(e => toast('Erro ao testar: ' + e.message, 'error'));
  } catch(e) {
    toast('JSON invalido: ' + e.message, 'error');
  }
}

function clearSA() {
  cfg.serviceAccount = null;
  localStorage.removeItem('eb_sa');
  sessionStorage.removeItem('sa_tok');
  accessToken = null;
  setSt(false);
  renderSAStatus();
  toast('Service Account removida', '');
}

// ── CALENDAR EVENTS VIEWER ──
async function loadCalendarEvents() {
  const listEl = document.getElementById('ev-list');
  const loadEl = document.getElementById('ev-loading');
  const monEl = document.getElementById('ev-month');
  
  if (!monEl?.value) return;
  
  const [yrS, moS] = monEl.value.split('-');
  const yr = +yrS;
  const mo = +moS;
  const tMin = new Date(yr, mo - 1, 1).toISOString();
  const tMax = new Date(yr, mo, 1).toISOString();
  
  loadEl.style.display = '';
  listEl.innerHTML = '';
  
  try {
    await ensureAuth();
    
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' + 
      encodeURIComponent(cfg.calendarId) +
      '/events?timeMin=' + encodeURIComponent(tMin) +
      '&timeMax=' + encodeURIComponent(tMax) +
      '&singleEvents=true&orderBy=startTime&maxResults=100';
    
    const r = await fetch(url, {
      headers: {'Authorization': 'Bearer ' + accessToken}
    });
    
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e?.error?.message || 'HTTP ' + r.status);
    }
    
    const data = await r.json();
    const items = data.items || [];
    
    loadEl.style.display = 'none';
    
    if (!items.length) {
      listEl.innerHTML = '<div style="font-size:13px;color:var(--sage);text-align:center;padding:24px">Nenhum evento neste mes</div>';
      return;
    }
    
    const byDate = {};
    items.forEach(ev => {
      const d = (ev.start?.dateTime || ev.start?.date || '').substring(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(ev);
    });
    
    let html = '';
    Object.entries(byDate).forEach(([date, evs]) => {
      html += '<div style="margin-bottom:12px">' +
        '<div style="font-size:10px;font-weight:600;color:var(--sage);letter-spacing:.8px;text-transform:uppercase;padding:4px 0;border-bottom:1px solid rgba(162,123,92,.1);margin-bottom:6px">' +
        fmtDate(date) + '</div>';
      
      evs.forEach(ev => {
        const start = (ev.start?.dateTime || '').substring(11, 16);
        const loc = ev.location || '';
        const desc = ev.description || '';
        const link = (desc.match(/https?:\/\/\S+/) || [''])[0];
        
        html += '<div class="ev-viewer-item">' +
          '<div style="flex:1;min-width:0">' +
          '<div class="ev-viewer-title">' + esc(ev.summary || '-') + '</div>' +
          '<div class="ev-viewer-meta">' + (start ? start + ' &mdash; ' : '') + esc(loc.split(',')[0] || '') + '</div>' +
          '</div>' +
          '<div class="ev-viewer-actions">' +
          (link ? '<a href="' + link + '" target="_blank" class="ev-viewer-btn ticket">Ingressos</a>' : '') +
          '<button data-evid="' + ev.id + '" data-title="' + esc(ev.summary || '') + '" data-date="' + date +
          '" data-time="' + start + '" data-loc="' + esc(loc.split(',')[0] || '') + '" data-ticket="' + esc(link) +
          '" onclick="openEditFromCalendar(this)" class="ev-viewer-btn" style="color:var(--bl);border-color:rgba(162,123,92,.22);background:transparent">Editar</button>' +
          '<button data-evid="' + ev.id + '" onclick="deleteCalEvent(this)" class="ev-viewer-btn remove">Remover</button>' +
          '</div></div>';
      });
      
      html += '</div>';
    });
    
    listEl.innerHTML = html;
  } catch(e) {
    loadEl.style.display = 'none';
    listEl.innerHTML = '<div style="font-size:13px;color:#c07070;padding:10px">' + esc(e.message) + '</div>';
  }
}

async function deleteCalEvent(btn) {
  const eventId = btn.dataset.evid;
  if (!confirm('Remover este evento do Google Calendar?')) return;
  
  btn.textContent = '...';
  btn.disabled = true;
  
  try {
    await ensureAuth();
    
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' + 
      encodeURIComponent(cfg.calendarId) + '/events/' + eventId;
    
    const r = await fetch(url, {
      method: 'DELETE',
      headers: {'Authorization': 'Bearer ' + accessToken}
    });
    
    if (!r.ok && r.status !== 204) {
      const e = await r.json();
      throw new Error(e?.error?.message || 'Erro');
    }
    
    btn.closest('.ev-viewer-item').remove();
    toast('Evento removido', 'success');
  } catch(e) {
    btn.textContent = 'Remover';
    btn.disabled = false;
    toast('Erro: ' + e.message, 'error');
  }
}

// ── VENUE MANAGER ──
function renderVenueManager() {
  const list = document.getElementById('vm-list');
  
  if (!VENUES.length) {
    list.innerHTML = '<div class="h-empty">Nenhum local.</div>';
    return;
  }
  
  list.innerHTML = VENUES.map((v, i) => 
    '<div class="vm-item">' +
    '<div style="flex:1"><div class="vm-name">' + esc(v.name) + '</div><div class="vm-addr">' + esc(v.addr) + '</div></div>' +
    '<button class="vm-del" onclick="deleteVenue(' + i + ')" title="Remover">&#215;</button>' +
    '</div>'
  ).join('');
}

function addVenue() {
  const name = document.getElementById('vm-name').value.trim();
  const addr = document.getElementById('vm-addr').value.trim();
  
  if (!name) {
    toast('Digite o nome do local', 'error');
    return;
  }
  
  VENUES.push({name, addr});
  saveVenues();
  
  document.getElementById('vm-name').value = '';
  document.getElementById('vm-addr').value = '';
  
  renderVenueManager();
  toast('Local adicionado', 'success');
}

function deleteVenue(i) {
  const name = VENUES[i].name;
  VENUES.splice(i, 1);
  saveVenues();
  renderVenueManager();
  toast('Removido: ' + name, '');
}

// ── EDIT EVENT ──
function openEditModal(ev, histIdx, gcalId) {
  editingHistIdx = histIdx !== undefined ? histIdx : null;
  editingEventId = gcalId || ev._gcalId || null;
  
  document.getElementById('edit-title').value = ev.title || '';
  document.getElementById('edit-date').value = ev.date || '';
  document.getElementById('edit-ticket').value = ev.ticketLink || '';
  document.getElementById('edit-error').style.display = 'none';
  
  // Populate venue dropdown
  const locSel = document.getElementById('edit-location');
  locSel.innerHTML = '<option value="">-- Selecione o local --</option>';
  const currentVenue = ev.venue || ev.venue_name || ev.location || '';
  let found = false;
  
  VENUES.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = v.name;
    if (v.name === currentVenue) {
      opt.selected = true;
      found = true;
    }
    locSel.appendChild(opt);
  });
  
  if (currentVenue && !found) {
    const opt = document.createElement('option');
    opt.value = currentVenue;
    opt.textContent = currentVenue;
    opt.selected = true;
    locSel.insertBefore(opt, locSel.children[1]);
  }
  
  // Set time dropdown
  const timeSel = document.getElementById('edit-time');
  const currentTime = (ev.times && ev.times[0]) || '11:00';
  let timeFound = false;
  
  Array.from(timeSel.options).forEach(o => {
    if (o.value === currentTime) {
      o.selected = true;
      timeFound = true;
    }
  });
  
  if (!timeFound) {
    const opt = document.createElement('option');
    opt.value = currentTime;
    opt.textContent = currentTime;
    opt.selected = true;
    timeSel.insertBefore(opt, timeSel.children[0]);
  }
  
  document.getElementById('edit-modal').classList.remove('hidden');
}

function editEventFromHist(idx) {
  const ev = evHist[idx];
  if (!ev) return;
  openEditModal(ev, idx, ev._gcalId || null);
}

function openEditFromCalendar(btn) {
  openEditModal({
    title: btn.dataset.title || '',
    date: btn.dataset.date || '',
    times: [btn.dataset.time || '11:00'],
    venue: btn.dataset.loc || '',
    location: btn.dataset.loc || '',
    ticketLink: btn.dataset.ticket || '',
  }, null, btn.dataset.evid);
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  editingEventId = null;
  editingHistIdx = null;
}

async function saveEditEvent() {
  const title = document.getElementById('edit-title').value.trim();
  const date = document.getElementById('edit-date').value;
  const time = document.getElementById('edit-time').value || '11:00';
  const locName = document.getElementById('edit-location').value;
  const venueObj = VENUES.find(v => v.name === locName);
  const locAddr = venueObj ? venueObj.addr : locName;
  const ticket = document.getElementById('edit-ticket').value.trim();
  const errEl = document.getElementById('edit-error');
  
  if (!title) {
    errEl.textContent = 'O título é obrigatório.';
    errEl.style.display = 'block';
    return;
  }
  
  if (!date) {
    errEl.textContent = 'A data e obrigatoria.';
    errEl.style.display = 'block';
    return;
  }
  
  errEl.style.display = 'none';
  
  // Update history
  if (editingHistIdx !== null && evHist[editingHistIdx]) {
    const e = evHist[editingHistIdx];
    e.title = title;
    e.date = date;
    e.times = [time];
    e.venue = locName;
    e.venue_addr = locAddr;
    e.ticketLink = ticket;
    renderHist();
  }
  
  // Update Google Calendar
  if (editingEventId) {
    try {
      await ensureAuth();
      
      const resource = {
        summary: title,
        location: locAddr || locName,
        description: ticket ? 'Ingressos: ' + ticket : '',
        start: {
          dateTime: date + 'T' + time + ':00',
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: date + 'T' + END_T + ':00',
          timeZone: 'America/Sao_Paulo'
        },
      };
      
      const url = 'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(cfg.calendarId) + '/events/' + editingEventId;
      
      const r = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resource)
      });
      
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.error?.message || 'HTTP ' + r.status);
      }
      
      toast('Evento atualizado no Google Calendar!', 'success');
    } catch(e) {
      toast('Salvo localmente. Erro no Calendar: ' + e.message, 'error');
    }
  } else {
    toast('Evento atualizado!', 'success');
  }
  
  closeEditModal();
}

// ════════════════════════════════════════════════════════════════
// BATCH LINKS
// ════════════════════════════════════════════════════════════════

function openBatchModal() {
  document.getElementById('batch-links').value = '';
  document.getElementById('batch-status').style.display = 'none';
  document.getElementById('batch-progress').style.display = 'none';
  document.getElementById('batch-start-btn').disabled = false;
  document.getElementById('batch-modal').classList.remove('hidden');
}

function closeBatchModal() {
  document.getElementById('batch-modal').classList.add('hidden');
}

async function startBatchLinks() {
  const raw = document.getElementById('batch-links').value;
  const links = raw.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  
  if (!links.length) {
    toast('Cole ao menos um link', 'error');
    return;
  }
  
  if (!cfg.openRouterKey) {
    toast('Configure a OpenRouter API Key nas Configuracoes', 'error');
    return;
  }
  
  const btn = document.getElementById('batch-start-btn');
  btn.disabled = true;
  document.getElementById('batch-status').style.display = 'none';
  
  const progressEl = document.getElementById('batch-progress');
  const barEl = document.getElementById('batch-bar');
  const labelEl = document.getElementById('batch-label');
  progressEl.style.display = 'block';
  
  batchQueue = [];
  const errors = [];
  
  for (let i = 0; i < links.length; i++) {
    const url = links[i];
    barEl.style.width = Math.round((i / links.length) * 100) + '%';
    labelEl.textContent = 'Processando ' + (i + 1) + ' de ' + links.length + '...';
    
    try {
      const ex = await extractFromLinkEnhanced(url);
      batchQueue.push({
        title: ex.title || '',
        date: ex.date || '',
        times: ex.times || ['19:00'],
        venue: ex.venue || '',
        venue_addr: ex.venue_addr || '',
        ticketLink: ex.ticketLink || url,
        desc: ex.desc || '',
        _needsDate: !ex.date,
        _needsTitle: !ex.title,
      });
    } catch(e) {
      errors.push((url.split('/').pop() || url).substring(0, 40) + ': ' + e.message.substring(0, 50));
    }
    
    if (i < links.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  
  barEl.style.width = '100%';
  labelEl.textContent = batchQueue.length + ' extraido(s), ' + errors.length + ' erro(s).';
  
  setTimeout(() => {
    closeBatchModal();
    btn.disabled = false;
    
    if (errors.length) {
      botMsg('<strong>Lote processado:</strong> ' + batchQueue.length + ' eventos extraidos.' +
        (errors.length ? '<br><span style="color:var(--sage);font-size:13px">Erros:<br>' + errors.map(esc).join('<br>') + '</span>' : ''));
    }
    
    if (batchQueue.length > 0) {
      batchIdx = 0;
      reviewNextBatch();
    }
  }, 600);
}

function reviewNextBatch() {
  if (batchIdx >= batchQueue.length) {
    botMsg('Todos os eventos do lote foram revisados!', [
      {label: 'Novo lote', cb: openBatchModal},
      {label: 'Cadastro manual', cb: startManual},
    ]);
    batchQueue = [];
    batchIdx = 0;
    return;
  }
  
  const ev = batchQueue[batchIdx];
  const remaining = batchQueue.length - batchIdx;
  
  botMsg('<strong>Evento ' + (batchIdx + 1) + ' de ' + batchQueue.length + '</strong>' +
    (remaining > 1 ? ' &mdash; <span style="color:var(--sage);font-size:13px">' + (remaining - 1) + ' aguardando</span>' : ''));
  
  if (ev._needsTitle) {
    flow = {state: 'manual_name', data: {...ev, ticketLink: ev.ticketLink}};
    botMsg('Não encontrei o nome deste evento. Qual é o <strong>nome</strong>?');
    return;
  }
  
  if (ev._needsDate) {
    botMsg('Evento: <strong>' + esc(ev.title) + '</strong><br>Não encontrei a data:');
    showCalendar(date => {
      batchQueue[batchIdx].date = date;
      batchQueue[batchIdx]._needsDate = false;
      showBatchPreview(batchIdx);
    });
    return;
  }
  
  showBatchPreview(batchIdx);
}

function showBatchPreview(idx) {
  const ev = batchQueue[idx];
  flow.state = 'preview';
  
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  cw.style.cssText = 'max-width:82%;width:100%';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.maxWidth = '100%';
  
  const sH = (ev.times || ['11:00']).map(t => 
    '<span class="slot-chip">' + t + ' - ' + END_T + '</span>'
  ).join('');
  
  bubble.innerHTML = '<div class="ev-card">' +
    '<div class="ev-card-head"><div style="flex:1;padding-left:8px;min-width:0">' +
    '<div class="ev-title">' + esc(ev.title || '-') + '</div>' +
    '<div style="margin-top:8px"><span class="ev-date-badge">' + fmtDate(ev.date) + '</span></div>' +
    '</div></div>' +
    '<div class="ev-card-body">' +
    '<div class="ev-row"><span class="ev-row-lbl">Local</span><span class="ev-row-val">' + esc(ev.venue || '-') + '</span></div>' +
    '<div class="ev-row"><span class="ev-row-lbl">Horários</span><div><div class="slots-wrap">' + sH + '</div></div></div>' +
    (ev.ticketLink ? '<div class="ev-row"><span class="ev-row-lbl">Ingressos</span><span class="ev-row-val" style="font-size:12px;word-break:break-all">' + esc(ev.ticketLink) + '</span></div>' : '') +
    '</div>' +
    '<div class="ev-card-foot">' +
    '<button class="btn-primary" id="bev-ok">Confirmar</button>' +
    '<button class="btn-edit" id="bev-edit">Editar</button>' +
    '<button class="btn-sm" id="bev-status">Presença</button>' +
    '<button class="btn-ghost" id="bev-skip">Pular</button>' +
    '</div></div>';
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  
  MC().appendChild(m);
  MC().scrollTop = 9999;
  
  const disAll = () => ['bev-ok', 'bev-edit', 'bev-status', 'bev-skip'].forEach(id => {
    const el = m.querySelector('#' + id);
    if (el) el.disabled = true;
  });
  
  m.querySelector('#bev-ok').onclick = async () => {
    disAll();
    showTyping();
    
    try {
      const res = await createEvents(ev);
      hideTyping();
      
      if (res && res[0] && res[0].id) {
        batchQueue[idx]._gcalId = res[0].id;
      }
      
      addHist(ev);
      toast('Cadastrado: ' + ev.title, 'success');
    } catch(e) {
      hideTyping();
      toast('Erro: ' + e.message, 'error');
    }
    
    batchIdx++;
    reviewNextBatch();
  };
  
  m.querySelector('#bev-edit').onclick = () => {
    openEditModal(ev, null, ev._gcalId || null);
  };
  
  m.querySelector('#bev-skip').onclick = () => {
    disAll();
    botMsg('Evento pulado.');
    batchIdx++;
    reviewNextBatch();
  };
}

// ════════════════════════════════════════════════════════════════
// INITIALIZATION COMPLETE
// ════════════════════════════════════════════════════════════════

console.log('EventBot v2.0 — Simplified & Optimized');


// ════════════════════════════════════════════════════════════════
// LIGHT MODE & UI ENHANCEMENTS
// ════════════════════════════════════════════════════════════════

function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('light-mode', !darkMode);
  localStorage.setItem('eb_darkmode', darkMode ? '1' : '0');
  
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
  
  toast(darkMode ? 'Modo escuro ativado' : 'Modo claro ativado', 'success');
}

function initDarkMode() {
  const saved = localStorage.getItem('eb_darkmode');
  darkMode = saved === null || saved === '1';
  
  if (!darkMode) {
    document.body.classList.add('light-mode');
  }
  
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
}

// ════════════════════════════════════════════════════════════════
// EVENT PAGES - CHAT vs EVENTS LIST
// ════════════════════════════════════════════════════════════════

function switchPage(page) {
  currentPage = page;
  
  const chatArea = document.querySelector('.chat-area');
  const eventsPage = document.getElementById('events-page');
  
  if (page === 'chat') {
    if (chatArea) chatArea.classList.remove('hidden');
    if (eventsPage) eventsPage.classList.add('hidden');
    document.querySelector('[data-page="chat"]')?.classList.add('active');
    document.querySelector('[data-page="events"]')?.classList.remove('active');
  } else {
    if (chatArea) chatArea.classList.add('hidden');
    if (eventsPage) eventsPage.classList.remove('hidden');
    document.querySelector('[data-page="chat"]')?.classList.remove('active');
    document.querySelector('[data-page="events"]')?.classList.add('active');
    renderEventsPage();
  }
}

function renderEventsPage() {
  const page = document.getElementById('events-page');
  if (!page) return;
  
  if (!evHist.length) {
    page.innerHTML = '<div style="padding:40px;text-align:center;color:var(--sage)">Nenhum evento cadastrado. Crie um evento no chat!</div>';
    return;
  }
  
  let html = '<div style="padding:20px;max-width:1200px;margin:0 auto">';
  html += '<h2 style="font-size:22px;margin-bottom:20px;color:var(--sand)">Eventos Cadastrados (' + evHist.length + ')</h2>';
  html += '<div style="display:grid;gap:10px">';
  
  evHist.forEach((ev, idx) => {
    const isDuplicate = checkDuplicate(ev);
    const dupBadge = isDuplicate ? '<span style="background:#e57373;color:white;padding:2px 8px;border-radius:6px;font-size:10px;margin-left:8px">⚠️ Duplicado</span>' : '';
    
    html += '<div style="background:var(--dark2);border:1px solid rgba(162,123,92,.15);border-radius:12px;padding:16px;cursor:pointer;transition:all .2s" onclick="selectEventFromList(' + idx + ')">' +
      '<div style="display:flex;justify-content:space-between;align-items:start">' +
      '<div>' +
      '<div style="font-weight:600;font-size:15px;margin-bottom:6px">' + (idx + 1) + '. ' + esc(ev.title) + '</div>' +
      '<div style="font-size:12px;color:var(--sage);margin-bottom:6px">' +
        '<span>📅 ' + fmtDate(ev.date) + '</span> · ' +
        '<span>🕒 ' + (ev.times ? ev.times.join(', ') : 'Dia inteiro') + '</span> · ' +
        '<span>📍 ' + esc(ev.venue || '-') + '</span>' +
      '</div>' +
      dupBadge +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn-sm" onclick="editEventFromList(' + idx + ');event.stopPropagation()" style="background:rgba(162,123,92,.2)">Editar</button>' +
      '<button class="btn-sm" onclick="deleteEventFromList(' + idx + ');event.stopPropagation()" style="background:rgba(210,70,70,.1);color:#c07070">Remover</button>' +
      '<button class="btn-sm" onclick="shareEvent(evList[' + idx + '], \'twitter\');event.stopPropagation()" style="background:rgba(29,161,242,.15);color:#1da1f2" title="Compartilhar no Twitter">𝕏</button>' +
      '<button class="btn-sm" onclick="shareEvent(evList[' + idx + '], \'whatsapp\');event.stopPropagation()" style="background:rgba(37,211,102,.15);color:#25d366" title="Compartilhar no WhatsApp">💬</button>' +
      '</div>' +
      '</div>' +
    '</div>';
  });
  
  html += '</div></div>';
  page.innerHTML = html;
}

function selectEventFromList(idx) {
  selectedEventNum = idx + 1;
  toast('Evento #' + selectedEventNum + ' selecionado', 'success');
}

function editEventFromList(idx) {
  const ev = evHist[idx];
  if (!ev) return;
  
  // Try to open modal, or just show message
  try {
    if (typeof openEditModal === 'function') {
      openEditModal(ev, idx, ev._gcalId || null);
    } else {
      botMsg('Edição de eventos:' +
        '<br><strong>' + esc(ev.title) + '</strong>' +
        '<br>Data: ' + fmtDate(ev.date) +
        '<br>Horário: ' + (ev.times ? ev.times.join(', ') : 'Dia inteiro'));
    }
  } catch(e) {
    toast('Erro ao editar: ' + e.message, 'error');
  }
}

function deleteEventFromList(idx) {
  if (!confirm('Remover este evento?')) return;
  
  evHist.splice(idx, 1);
  renderHist();
  renderEventsPage();
  toast('Evento removido', 'success');
}

// ════════════════════════════════════════════════════════════════
// DUPLICATE DETECTION
// ════════════════════════════════════════════════════════════════

function normalizeStr(s) {
  return String(s || '').toLowerCase().replace(/[^\w]/g, '');
}

function checkDuplicate(ev) {
  // Detecta eventos similares (título e data similares)
  const normalized = normalizeStr(ev.title);
  
  for (let existing of evHist) {
    if (existing === ev) continue;
    if (normalizeStr(existing.title) === normalized && existing.date === ev.date) {
      return true;
    }
  }
  
  return false;
}

// ════════════════════════════════════════════════════════════════
// IMPROVED CHAT FLOW - NUMBER SELECTION & BACK OPTIONS
// ════════════════════════════════════════════════════════════════

function botMsgWithNumbers(html, items = [], backCb = null) {
  const wrap = document.createElement('div');
  const m = document.createElement('div');
  m.className = 'msg bot';
  
  const cw = document.createElement('div');
  cw.className = 'msg-wrap';
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = toH(html);
  
  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = tNow();
  
  cw.appendChild(bubble);
  cw.appendChild(time);
  m.appendChild(makeAv(false));
  m.appendChild(cw);
  wrap.appendChild(m);
  
  if (items.length) {
    const q = document.createElement('div');
    q.className = 'qrs';
    
    items.forEach((item, i) => {
      const b = document.createElement('button');
      b.className = 'qr';
      b.textContent = (i + 1) + '. ' + item.label;
      b.onclick = () => {
        userMsg((i + 1) + '. ' + item.label);
        q.remove();
        item.cb();
      };
      q.appendChild(b);
    });
    
    if (backCb) {
      const backBtn = document.createElement('button');
      backBtn.className = 'qr';
      backBtn.style.background = 'rgba(162,123,92,.07)';
      backBtn.textContent = '⬅️ Voltar';
      backBtn.onclick = () => {
        userMsg('⬅️ Voltar');
        q.remove();
        backCb();
      };
      q.appendChild(backBtn);
    }
    
    wrap.appendChild(q);
  }
  
  MC().appendChild(wrap);
  MC().scrollTop = 9999;
  return wrap;
}

// ════════════════════════════════════════════════════════════════
// IMPROVED WELCOME MESSAGE
// ════════════════════════════════════════════════════════════════

function welcomeImproved() {
  botMsg('Olá! 👋 Bem-vindo ao EventBot!' +
    '<br><br><strong>O que você gostaria de fazer?</strong>', [
    {label: 'Cadastrar evento por link', cb: startLink},
    {label: 'Cadastrar evento manualmente', cb: startManual},
    {label: 'Cadastrar filme', cb: startMovie},
    {label: 'Ver eventos', cb: () => switchPage('events')},
  ], () => {
    botMsg('Menu principal:', [
      {label: 'Cadastrar evento por link', cb: startLink},
      {label: 'Cadastrar evento manualmente', cb: startManual},
      {label: 'Cadastrar filme', cb: startMovie},
      {label: 'Ver eventos', cb: () => switchPage('events')},
    ]);
  });
}


// ════════════════════════════════════════════════════════════════
// v4.0 - NEW FEATURES: DASHBOARD, THEMES, GAMIFICATION, SOCIAL
// ════════════════════════════════════════════════════════════════

// ── DASHBOARD PAGE ──
function renderDashboard() {
  const page = document.getElementById('dashboard-page');
  if (!page) return;
  
  // Calcula estatísticas
  const totalEvents = evHist.length;
  const venues = [...new Set(evHist.map(e => e.venue))];
  const mostPopular = venues.length > 0 
    ? venues.reduce((a, b) => 
        evHist.filter(e => e.venue === a).length > evHist.filter(e => e.venue === b).length ? a : b
      )
    : 'N/A';
  
  const thisMonth = evHist.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  
  let html = '<div style="padding:30px;max-width:1200px;margin:0 auto">';
  html += '<h1 style="font-size:28px;margin-bottom:30px;color:var(--sand)">📊 Dashboard</h1>';
  
  // Cards
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:40px">';
  
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;border-left:4px solid #6fcf7a">';
  html += '<div style="font-size:12px;color:var(--sage);text-transform:uppercase;letter-spacing:1px">Total de Eventos</div>';
  html += '<div style="font-size:32px;font-weight:700;color:#6fcf7a;margin-top:10px">' + totalEvents + '</div>';
  html += '</div>';
  
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;border-left:4px solid #F6BF26">';
  html += '<div style="font-size:12px;color:var(--sage);text-transform:uppercase;letter-spacing:1px">Este Mês</div>';
  html += '<div style="font-size:32px;font-weight:700;color:#F6BF26;margin-top:10px">' + thisMonth + '</div>';
  html += '</div>';
  
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;border-left:4px solid #C49A72">';
  html += '<div style="font-size:12px;color:var(--sage);text-transform:uppercase;letter-spacing:1px">Locais Únicos</div>';
  html += '<div style="font-size:32px;font-weight:700;color:#C49A72;margin-top:10px">' + venues.length + '</div>';
  html += '</div>';
  
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;border-left:4px solid #e57373">';
  html += '<div style="font-size:12px;color:var(--sage);text-transform:uppercase;letter-spacing:1px">Pontos Acumulados</div>';
  html += '<div style="font-size:32px;font-weight:700;color:#e57373;margin-top:10px">' + userPoints + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Local mais popular
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;margin-bottom:20px">';
  html += '<h2 style="font-size:16px;margin-bottom:15px">📍 Local Mais Popular</h2>';
  html += '<div style="font-size:18px;font-weight:600;color:var(--bl)">' + mostPopular + '</div>';
  html += '<div style="font-size:12px;color:var(--sage);margin-top:5px">' + evHist.filter(e => e.venue === mostPopular).length + ' eventos</div>';
  html += '</div>';
  
  // Badges
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px">';
  html += '<h2 style="font-size:16px;margin-bottom:15px">🏆 Badges Desbloqueadas</h2>';
  html += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
  if (totalEvents > 0) html += '<span style="background:rgba(111,207,122,.2);color:#6fcf7a;padding:8px 12px;border-radius:8px">🎫 Primeiro Evento</span>';
  if (totalEvents > 5) html += '<span style="background:rgba(111,207,122,.2);color:#6fcf7a;padding:8px 12px;border-radius:8px">⭐ 5+ Eventos</span>';
  if (totalEvents > 10) html += '<span style="background:rgba(111,207,122,.2);color:#6fcf7a;padding:8px 12px;border-radius:8px">🔥 Frequentista</span>';
  if (thisMonth > 3) html += '<span style="background:rgba(246,191,38,.2);color:#F6BF26;padding:8px 12px;border-radius:8px">📅 Mês Ativo</span>';
  if (venues.length > 5) html += '<span style="background:rgba(196,154,114,.2);color:#C49A72;padding:8px 12px;border-radius:8px">🗺️ Explorador</span>';
  html += '</div></div>';
  
  html += '</div>';
  page.innerHTML = html;
}

// ── PROFILE PAGE (GAMIFICATION) ──
function renderProfile() {
  const page = document.getElementById('profile-page');
  if (!page) return;
  
  let html = '<div style="padding:30px;max-width:800px;margin:0 auto">';
  html += '<h1 style="font-size:28px;margin-bottom:30px">👤 Meu Perfil</h1>';
  
  // Pontos
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;margin-bottom:20px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<div><div style="font-size:12px;color:var(--sage)">PONTOS</div><div style="font-size:24px;font-weight:700;color:#F6BF26;margin-top:5px">' + userPoints + ' pts</div></div>';
  html += '<div style="font-size:40px">⭐</div>';
  html += '</div></div>';
  
  // Badges
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px;margin-bottom:20px">';
  html += '<h2 style="font-size:16px;margin-bottom:15px">🏆 Badges</h2>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
  html += '<div style="background:rgba(111,207,122,.1);padding:15px;border-radius:8px;text-align:center">';
  html += '<div style="font-size:24px">🎫</div><div style="font-size:11px;margin-top:8px;color:var(--sage)">Primeiro Evento</div></div>';
  html += '<div style="background:rgba(111,207,122,.1);padding:15px;border-radius:8px;text-align:center">';
  html += '<div style="font-size:24px">⭐</div><div style="font-size:11px;margin-top:8px;color:var(--sage)">5+ Eventos</div></div>';
  html += '<div style="background:rgba(111,207,122,.1);padding:15px;border-radius:8px;text-align:center">';
  html += '<div style="font-size:24px">🔥</div><div style="font-size:11px;margin-top:8px;color:var(--sage)">Frequentista</div></div>';
  html += '</div></div>';
  
  // Preferências
  html += '<div style="background:var(--dark2);padding:20px;border-radius:12px">';
  html += '<h2 style="font-size:16px;margin-bottom:15px">⚙️ Preferências</h2>';
  html += '<div style="margin-bottom:15px">';
  html += '<label style="font-size:12px;color:var(--sage);display:block;margin-bottom:8px">Tamanho da Fonte</label>';
  html += '<input type="range" min="12" max="18" value="' + fontSize + '" onchange="changeFontSize(this.value)" style="width:100%">';
  html += '</div>';
  html += '<div>';
  html += '<label style="font-size:12px;color:var(--sage);display:block;margin-bottom:8px">Tema</label>';
  html += '<select onchange="changeTheme(this.value)" style="background:rgba(10,10,8,.7);border:1px solid rgba(162,123,92,.16);color:var(--sand);padding:8px;border-radius:6px;width:100%">';
  html += '<option value="dark">🌙 Escuro</option>';
  html += '<option value="light">☀️ Claro</option>';
  html += '<option value="ocean">🌊 Oceano</option>';
  html += '<option value="forest">🌲 Floresta</option>';
  html += '<option value="sunset">🌅 Pôr do Sol</option>';
  html += '</select></div>';
  html += '</div>';
  
  html += '</div>';
  page.innerHTML = html;
}

// ── THEME SYSTEM ──
function changeTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('eb_theme', theme);
  document.body.classList.remove('light-mode');
  document.body.classList.remove('theme-ocean', 'theme-forest', 'theme-sunset');
  if (theme === 'default') {
    document.body.className = '';
  } else {
    document.body.className = 'theme-' + theme;
  }
  const themeName = {default: 'Padrão', ocean: 'Oceano', forest: 'Floresta', sunset: 'Pôr do sol'}[theme];
  toast('Tema: ' + themeName, 'success');
}

function initTheme() {
  const saved = localStorage.getItem('eb_theme') || 'default';
  currentTheme = saved;
  if (saved !== 'default') {
    document.body.className = 'theme-' + saved;
  }
}

// ── FONT SIZE ──
function changeFontSize(size) {
  fontSize = parseInt(size);
  document.body.style.fontSize = fontSize + 'px';
  localStorage.setItem('eb_fontSize', fontSize);
  toast('Tamanho da fonte: ' + size + 'px', 'success');
}

function initFontSize() {
  const saved = parseInt(localStorage.getItem('eb_fontSize') || '14');
  fontSize = saved;
  document.body.style.fontSize = fontSize + 'px';
}

// ── GAMIFICATION ──
function addPoints(amount, reason) {
  userPoints += amount;
  localStorage.setItem('eb_points', userPoints);
  toast('🎉 +' + amount + ' pontos: ' + reason, 'success');
}

function checkBadges() {
  const totalEvents = evHist.length;
  
  if (totalEvents === 1 && !userBadges.includes('first-event')) {
    userBadges.push('first-event');
    toast('🏆 Badge desbloqueado: Primeiro Evento!', 'success');
  }
  
  if (totalEvents === 5 && !userBadges.includes('five-events')) {
    userBadges.push('five-events');
    addPoints(25, 'Badge 5+ Eventos');
  }
  
  if (totalEvents === 10 && !userBadges.includes('frequentist')) {
    userBadges.push('frequentist');
    addPoints(50, 'Badge Frequentista');
  }
}

// ── SOCIAL SHARING ──
function shareEvent(ev, platform) {
  const text = '🎵 Vou para ' + ev.title + ' em ' + fmtDate(ev.date) + ' em ' + (ev.venue || 'um local incrível') + '!';
  const hashtags = '#EventBot #MusicEvent #Festival';
  
  if (platform === 'twitter') {
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text + ' ' + hashtags), '_blank');
  } else if (platform === 'linkedin') {
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=eventbot.local', '_blank');
  } else if (platform === 'whatsapp') {
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }
  
  addPoints(5, 'Compartilhado em ' + platform);
  toast('✓ Compartilhado!', 'success');
}

// ── EXTENDED PAGE SWITCHER ──
function switchPageExtended(page) {
  currentPage = page;
  
  const pages = {
    'chat': document.querySelector('.chat-area'),
    'events': document.getElementById('events-page'),
    'dashboard': document.getElementById('dashboard-page'),
    'profile': document.getElementById('profile-page')
  };
  
  // Hide all
  Object.values(pages).forEach(p => {
    if (p) p.classList.add('hidden');
  });
  
  // Show selected
  if (pages[page]) pages[page].classList.remove('hidden');
  
  // Update nav
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  
  // Render if needed
  if (page === 'dashboard') renderDashboard();
  if (page === 'profile') renderProfile();
}

// ── LOAD v4.0 ──
function initv4() {
  initTheme();
  initFontSize();
  
  const saved = localStorage.getItem('eb_points');
  if (saved) userPoints = parseInt(saved);
  
  const badges = localStorage.getItem('eb_badges');
  if (badges) userBadges = JSON.parse(badges);
}

// Override old switchPage
const originalSwitchPage = switchPage;
switchPage = switchPageExtended;
