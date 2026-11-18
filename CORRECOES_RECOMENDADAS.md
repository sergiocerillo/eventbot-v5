# CORREÇÕES RECOMENDADAS - CÓDIGO CORRIGIDO

## 1. ADICIONAR FUNÇÕES FALTANTES EM extraction.js

### Adicionar no início do arquivo (após CONSTANTS):

```javascript
// ── UTILITY FUNCTIONS ──

function isUrl(s) {
  return /^https?:\/\//i.test(String(s || '').trim());
}

// Referência para função que será injetada
let openRouterCall = null;

function setOpenRouterCallback(fn) {
  openRouterCall = fn;
}
```

### Modificar `extractWithAI()` para usar callback:

```javascript
// Antes (ERRADO):
async function extractWithAI(url, context = {}) {
  // ...
  const txt = await callOpenRouter(prompt); // ❌ callOpenRouter não existe aqui
}

// Depois (CORRETO):
async function extractWithAI(url, context = {}) {
  // ...
  if (!openRouterCall) {
    throw new Error('OpenRouter não configurado. Configure em app.js');
  }
  const txt = await openRouterCall(prompt); // ✓ Usa callback injetado
}
```

### No app.js, após carregar extraction.js:

```javascript
// Após carregar extraction.js via script tag
if (typeof setOpenRouterCallback === 'function') {
  setOpenRouterCallback(callOpenRouter);
}
```

---

## 2. ADICIONAR VARIÁVEIS FALTANTES EM app.js

### No início do arquivo com STATE:

```javascript
// ── ESTADO (ADICIONAR) ──
let cfg = { /* ... existing ... */ };

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
let currentPage = 'chat';
let selectedEventNum = null;
let duplicateCache = {};

// ✅ ADICIONAR ESTAS LINHAS:
let gcalIndex = [];  // ← NOVO
let lastAction = null; // ← NOVO (já estava mas pode estar no lugar errado)
```

---

## 3. ADICIONAR FUNÇÕES FALTANTES EM app.js

### Adicionar após `initGIS()`:

```javascript
// ── GCAL INDEX REFRESH ──

let _gcalRefreshing = false;

async function refreshGcalIndex(force = false) {
  if (!force && _gcalRefreshing) {
    console.log('[GCal] Refresh já em progresso');
    return gcalIndex;
  }
  
  _gcalRefreshing = true;
  
  try {
    await ensureAuth();
    
    const now = new Date();
    const tMin = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    const tMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
    
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' + 
      encodeURIComponent(cfg.calendarId) +
      '/events?timeMin=' + encodeURIComponent(tMin) +
      '&timeMax=' + encodeURIComponent(tMax) +
      '&singleEvents=true&maxResults=250';
    
    const r = await fetch(url, {
      headers: {'Authorization': 'Bearer ' + accessToken}
    });
    
    if (!r.ok) {
      const e = await r.json();
      throw new Error(e?.error?.message || 'HTTP ' + r.status);
    }
    
    const data = await r.json();
    gcalIndex = (data.items || []).map(ev => ({
      id: ev.id,
      title: ev.summary || '',
      date: (ev.start?.dateTime || ev.start?.date || '').substring(0, 10),
      time: (ev.start?.dateTime || '').substring(11, 16) || '00:00'
    }));
    
    console.log('[GCal] Index atualizado:', gcalIndex.length, 'eventos');
    return gcalIndex;
  } catch(e) {
    console.warn('[GCal] Erro ao atualizar index:', e.message);
    return [];
  } finally {
    _gcalRefreshing = false;
  }
}

function checkDuplicate(ev) {
  if (!gcalIndex || !gcalIndex.length) return false;
  
  return gcalIndex.some(item => 
    item.title?.toLowerCase() === (ev.title || '').toLowerCase() && 
    item.date === ev.date
  );
}
```

### Adicionar `initDarkMode()`:

```javascript
function initDarkMode() {
  const isDark = localStorage.getItem('eb_dark') !== 'false';
  darkMode = isDark;
  document.documentElement.classList.toggle('dark-mode', darkMode);
  
  // Se houver toggle button
  const toggle = document.getElementById('dark-toggle');
  if (toggle) {
    toggle.checked = darkMode;
    toggle.addEventListener('change', () => {
      darkMode = toggle.checked;
      localStorage.setItem('eb_dark', darkMode ? 'true' : 'false');
      document.documentElement.classList.toggle('dark-mode', darkMode);
    });
  }
}
```

---

## 4. CORRIGIR welcome() PARA AGUARDAR PROMISES

### Antes:

```javascript
if (cfg.serviceAccount?.private_key) {
  getSAToken().then(tok => {
    if (tok) {
      accessToken = tok;
      setSt(true, 'Service Account');
    }
  });
}
```

### Depois:

```javascript
if (cfg.serviceAccount?.private_key) {
  try {
    await getSAToken().then(tok => {
      if (tok) {
        accessToken = tok;
        setSt(true, 'Service Account');
      }
    }).catch(e => console.warn('SA Token error:', e.message));
  } catch(e) {
    console.warn('SA Token initialization failed:', e.message);
  }
}
```

---

## 5. CORRIGIR VAZAMENTO DE MEMÓRIA EM extraction.js

### Modificar `setCache()`:

```javascript
// Antes (ERRADO - cache cresce infinitamente):
function setCache(url, data) {
  if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return;
  
  const key = getCacheKey(url);
  extractionCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  console.log('[Extractor] Cached:', url);
}

// Depois (CORRETO - com limite):
function setCache(url, data) {
  if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return;
  
  const key = getCacheKey(url);
  
  // Limpar se cache ficar muito grande (máximo 150 entradas)
  const MAX_CACHE_SIZE = 150;
  if (extractionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = extractionCache.keys().next().value;
    extractionCache.delete(oldestKey);
    console.log('[Extractor] Cache cleared oldest entry to maintain limit');
  }
  
  extractionCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  console.log('[Extractor] Cached:', url, `(${extractionCache.size}/${MAX_CACHE_SIZE})`);
}
```

### Adicionar função de limpeza:

```javascript
function cleanExpiredCache() {
  const now = Date.now();
  const expired = [];
  
  for (const [key, entry] of extractionCache.entries()) {
    if (now - entry.timestamp > DEFAULT_EXTRACTOR_CONFIG.cacheTTL) {
      expired.push(key);
    }
  }
  
  expired.forEach(key => {
    extractionCache.delete(key);
    console.log('[Extractor] Cleaned expired cache entry');
  });
  
  return expired.length;
}

// Chamar periodicamente
setInterval(cleanExpiredCache, 60000); // A cada 1 minuto
```

---

## 6. CORRIGIR VAZAMENTO EM db.js

### Antes:

```javascript
function onEventsChange(callback) {
  if (!supabaseClient) return;
  
  supabaseClient
    .channel('events-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events'
    }, payload => {
      callback(payload);
    })
    .subscribe();
}
```

### Depois (com cleanup):

```javascript
let eventsChannel = null;

function onEventsChange(callback) {
  if (!supabaseClient) {
    return () => {}; // Return empty unsubscribe
  }
  
  // Limpar subscription anterior se existir
  if (eventsChannel) {
    console.log('[DB] Unsubscribing from previous channel');
    eventsChannel.unsubscribe();
  }
  
  eventsChannel = supabaseClient
    .channel('events-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events'
    }, payload => {
      try {
        callback(payload);
      } catch(e) {
        console.error('[DB] Callback error:', e);
      }
    })
    .subscribe();
  
  // Retornar função para unsubscribe
  return () => {
    if (eventsChannel) {
      eventsChannel.unsubscribe();
      eventsChannel = null;
    }
  };
}

// Uso:
// const unsub = onEventsChange(myCallback);
// unsub(); // Para parar de escutar
```

---

## 7. CORRIGIR initSupabase() EM db.js

### Antes:

```javascript
async function initSupabase() {
  if (isDevMode) {
    console.log('ℹ️ Modo desenvolvimento (sem Supabase)');
    return null;
  }
  
  try {
    const { createClient } = window.supabase || await import('https://esm.sh/@supabase/supabase-js');
    // ... resto do código
  } catch (error) {
    console.error('❌ Erro ao conectar Supabase:', error);
    throw error;
  }
}
```

### Depois (melhorado):

```javascript
async function initSupabase() {
  if (isDevMode) {
    console.log('ℹ️ Modo desenvolvimento (sem Supabase)');
    return null;
  }
  
  try {
    let createClient;
    
    // Tentar usar global primeiro
    if (window.supabase?.createClient) {
      createClient = window.supabase.createClient;
    } else {
      // Fallback para import
      const mod = await import('https://esm.sh/@supabase/supabase-js@2');
      createClient = mod.createClient;
    }
    
    if (!createClient) {
      throw new Error('createClient não encontrado em Supabase');
    }
    
    supabaseClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    
    console.log('✅ Supabase conectado!');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.warn('⚠️ Erro ao obter sessão:', sessionError.message);
    }
    
    if (session) {
      currentUser = session.user;
      console.log('✅ Usuário logado:', session.user.email);
    }
    
    return session;
  } catch (error) {
    console.error('❌ Erro ao conectar Supabase:', error);
    isDevMode = true; // Fallback para dev mode
    return null;
  }
}
```

---

## 8. CORRIGIR config.js - REMOVER CHAVES

### Antes (❌ INSEGURO):

```javascript
const SUPABASE_CONFIG = {
  url: 'https://sergiocerillo-coding-eventb.supabase.co',
  anonKey: 'sb_publishable_Bcs_nHgPwY2AJh9CXBjvHg_Sw5lgu8lsb_secret_Hro5HvWgtzCAI9VTmQFv_Q_XxRxxBAi'
};
```

### Depois (✅ SEGURO):

```javascript
// config.js
const SUPABASE_CONFIG = {
  // Usar variáveis de ambiente ou localStorage (preenchido pelo usuário)
  url: import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '',
  anonKey: import.meta.env.VITE_SUPABASE_KEY || localStorage.getItem('supabase_key') || ''
};

// Validação
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.warn('⚠️ Supabase não configurado. Use as variáveis de ambiente:');
  console.warn('  VITE_SUPABASE_URL');
  console.warn('  VITE_SUPABASE_KEY');
}
```

### Criar `.env.example`:

```
# .env.example
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here

# OpenRouter API
VITE_OPENROUTER_KEY=

# Google OAuth
VITE_GOOGLE_CLIENT_ID=
```

### Adicionar ao `.gitignore`:

```
# .gitignore
.env
.env.local
.env.*.local
config.js
db-config.json
secrets.json
```

---

## 9. MELHORAR ERROR HANDLING EM callOpenRouter()

### Antes:

```javascript
async function callOpenRouter(prompt) {
  if (!cfg.openRouterKey) {
    throw new Error('Configure a chave de API do OpenRouter nas Configurações.');
  }
  
  for (const model of OR_MODELS) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        // ... request body
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
```

### Depois (melhorado com retry):

```javascript
async function callOpenRouter(prompt, maxRetries = 3) {
  if (!cfg.openRouterKey) {
    throw new Error('Configure a chave de API do OpenRouter nas Configurações.');
  }
  
  for (const model of OR_MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
          signal: AbortSignal.timeout(30000)
        });
        
        const data = await r.json();
        
        if (!r.ok) {
          const msg = data?.error?.message || 'HTTP ' + r.status;
          
          // Retry em rate limit
          if (r.status === 429) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`[OpenRouter] Rate limited. Retry ${attempt + 1}/${maxRetries} em ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          
          // Skip modelo se não disponível
          if (r.status === 404 || msg.includes('endpoint') || msg.includes('not available')) {
            console.log(`[OpenRouter] Modelo ${model} não disponível`);
            break; // Próximo modelo
          }
          
          // Quota esgotada
          if (msg.includes('quota')) {
            console.log(`[OpenRouter] Quota esgotada`);
            break; // Próximo modelo
          }
          
          throw new Error(msg);
        }
        
        const txt = data.choices?.[0]?.message?.content;
        if (txt) {
          console.log(`[OpenRouter] Sucesso com modelo ${model}`);
          return txt;
        }
      } catch(e) {
        if (e.name === 'AbortError') {
          console.warn(`[OpenRouter] Timeout em ${model}`);
          break;
        }
        
        if (attempt === maxRetries - 1) {
          console.warn(`[OpenRouter] Falha final em ${model}:`, e.message);
          break;
        }
        
        const delay = Math.pow(2, attempt) * 500;
        console.log(`[OpenRouter] Erro em ${model}, retry ${attempt + 1}/${maxRetries} em ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw new Error('Nenhum modelo OpenRouter disponível. Tente em instantes.');
}
```

---

## 10. MELHORAR extractBulk() COM CONCORRÊNCIA

### Antes (sequencial, lento):

```javascript
async function extractBulk(urls) {
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i].trim();
    if (!isUrl(url)) {
      results.push({ url, success: false, error: 'URL inválida' });
      continue;
    }
    
    try {
      const data = await extractFromLinkEnhanced(url);
      results.push({ url, success: true, data });
    } catch(e) {
      results.push({ url, success: false, error: e.message });
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  return results;
}
```

### Depois (paralelo com limite):

```javascript
async function extractBulk(urls, concurrency = 3) {
  const results = [];
  const processing = new Set();
  
  async function processUrl(url, index) {
    try {
      url = url.trim();
      
      if (!isUrl(url)) {
        return { url, index, success: false, error: 'URL inválida' };
      }
      
      const data = await extractFromLinkEnhanced(url);
      return { url, index, success: true, data };
    } catch(e) {
      return { url, index, success: false, error: e.message };
    }
  }
  
  async function worker(startIdx) {
    for (let i = startIdx; i < urls.length; i += concurrency) {
      const result = await processUrl(urls[i], i);
      results.push(result);
    }
  }
  
  // Executar com limite de concorrência
  const workers = [];
  for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
    workers.push(worker(i));
  }
  
  await Promise.all(workers);
  
  // Ordenar por índice original
  results.sort((a, b) => a.index - b.index);
  
  return results.map(r => {
    const { index, ...rest } = r;
    return rest;
  });
}
```

---

## 11. ADICIONAR VALIDAÇÃO DE FORMATO DE DATA

### Adicionar validação robusta:

```javascript
function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Validar ranges
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Validar data real
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return false;
  }
  
  // Não permitir datas muito antigas ou muito futuras
  const now = new Date();
  const minYear = now.getFullYear() - 1;
  const maxYear = now.getFullYear() + 2;
  
  if (year < minYear || year > maxYear) {
    return false;
  }
  
  return true;
}

// Usar em saveEditEvent():
if (!isValidDate(date)) {
  errEl.textContent = 'Data inválida. Use formato YYYY-MM-DD (ex: 2024-12-25)';
  errEl.style.display = 'block';
  return;
}
```

---

## RESUMO DAS CORREÇÕES

| Arquivo | Tipo | Linhas | Ação |
|---------|------|--------|------|
| extraction.js | Função faltante | - | Adicionar `isUrl()` |
| extraction.js | Dependência | 238 | Usar callback para `callOpenRouter()` |
| extraction.js | Vazamento | 57 | Implementar limite de cache |
| app.js | Variável não inicializada | - | Adicionar `gcalIndex = []` |
| app.js | Função faltante | - | Adicionar `refreshGcalIndex()` |
| app.js | Função faltante | - | Adicionar `checkDuplicate()` |
| app.js | Função faltante | - | Adicionar `initDarkMode()` |
| app.js | Promise não aguardada | 352 | Adicionar `await` em `getSAToken()` |
| app.js | Nomenclatura | várias | Padronizar `venue` |
| app.js | Validação | 973 | Adicionar `isValidDate()` |
| db.js | Vazamento | 196 | Implementar cleanup em listeners |
| db.js | Inicialização | 19 | Melhorar `initSupabase()` |
| config.js | Segurança | 9,12 | Remover chaves de API |
| - | - | - | Adicionar `.env.example` |

