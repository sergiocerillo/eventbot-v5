# PLANO DE AÇÃO DETALHADO
## Correção de 58 Problemas JavaScript - Projeto Events

---

## 🎯 OBJETIVO

Corrigir todos os problemas críticos e altos identificados na análise, garantindo:
- ✅ Segurança (sem exposição de chaves)
- ✅ Funcionalidade (todas as features funcionam)
- ✅ Confiabilidade (sem race conditions)
- ✅ Performance (sem vazamentos de memória)

**Tempo total estimado**: 7-9 horas  
**Pessoas necessárias**: 1 desenvolvedor

---

## FASE 1: SEGURANÇA (1 hora)

### PASSO 1.1: Revogar/Regenerar Chaves de Segurança
**Tempo**: 15 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `config.js`

**Checklist**:
- [ ] Abrir [Supabase Dashboard](https://app.supabase.com)
- [ ] Ir em Settings → API
- [ ] Localizar a chave exposta: `sb_publishable_Bcs_nHgPwY2AJh9CXBjvHg_Sw5lgu8lsb_...`
- [ ] Clicar em "Revoke"
- [ ] Gerar nova chave (Copy)
- [ ] Armazenar em local seguro (NOT no código)

**Evidência de Conclusão**:
```bash
# Verificar que config.js não tem chaves:
grep -n "sb_publishable\|sb_secret" config.js
# Não deve retornar nada
```

---

### PASSO 1.2: Criar Arquivo de Configuração .env
**Tempo**: 10 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `.env.example` (novo)

**Arquivo**: `/Users/sergiocerillo/Documents/Web\ Systems/Events/.env.example`

```bash
# Criar arquivo
cat > .env.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key-here

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id-here
VITE_GOOGLE_API_KEY=your-api-key-here

# OpenRouter API
VITE_OPENROUTER_KEY=your-key-here
EOF
```

**Checklist**:
- [ ] Arquivo `.env.example` criado
- [ ] Todos os placeholders sem valores reais
- [ ] Comentários explicativos

---

### PASSO 1.3: Atualizar .gitignore
**Tempo**: 5 minutos  
**Severidade**: 🔴 CRÍTICA

**Arquivo**: `.gitignore` (atualizar ou criar)

```bash
# Adicionar ao final:
.env
.env.local
.env.*.local
config.js
secrets.json
```

**Checklist**:
- [ ] `.gitignore` atualizado
- [ ] `config.js` será ignorado no próximo commit
- [ ] `.env` será ignorado

**Verificar**:
```bash
git check-ignore config.js  # Deve retornar config.js
git check-ignore .env       # Deve retornar .env
```

---

### PASSO 1.4: Atualizar config.js para usar .env
**Tempo**: 10 minutos  
**Arquivo**: `config.js`

**Antes**:
```javascript
const SUPABASE_CONFIG = {
  url: 'https://sergiocerillo-coding-eventb.supabase.co',
  anonKey: 'sb_publishable_Bcs_nHgPwY2AJh9CXBjvHg_Sw5lgu8lsb_secret_Hro5HvWgtzCAI9VTmQFv_Q_XxRxxBAi'
};
```

**Depois**:
```javascript
const SUPABASE_CONFIG = {
  // Para Vite/Vue.js
  url: import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('sb_url') || '',
  anonKey: import.meta.env.VITE_SUPABASE_KEY || localStorage.getItem('sb_key') || ''
};

// Ou para ambiente Node/browser genérico:
const SUPABASE_CONFIG = {
  url: window.SUPABASE_URL || localStorage.getItem('sb_url') || '',
  anonKey: window.SUPABASE_KEY || localStorage.getItem('sb_key') || ''
};

// Validação com warning (não erro)
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.warn('⚠️ Supabase não configurado. Configure em Runtime ou via .env');
}
```

**Checklist**:
- [ ] Chaves removidas de config.js
- [ ] Configuração via .env/.local variables
- [ ] Fallback para localStorage para usuários
- [ ] Validação não quebra app (apenas warning)

---

## FASE 2: FUNÇÕES CRÍTICAS (1.5 horas)

### PASSO 2.1: Adicionar Função `isUrl()` em extraction.js
**Tempo**: 15 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `extraction.js`

**Localização**: Após `// ── CONSTANTS ──`, antes de `// ── CACHE SYSTEM ──`

**Adicionar**:
```javascript
// ── UTILITY FUNCTIONS ──

function isUrl(s) {
  return /^https?:\/\//i.test(String(s || '').trim());
}
```

**Verificar**:
```bash
grep -n "^function isUrl" extraction.js
# Deve retornar a linha onde foi adicionado
```

---

### PASSO 2.2: Implementar Callback para OpenRouter
**Tempo**: 20 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `extraction.js`

**Passo A - Adicionar em extraction.js (linha ~45)**:
```javascript
// Referência para função que será injetada
let openRouterCall = null;

function setOpenRouterCallback(fn) {
  openRouterCall = fn;
}
```

**Passo B - Modificar extractWithAI() em extraction.js (linha ~238)**:

**Antes**:
```javascript
const txt = await callOpenRouter(prompt); // ❌ callOpenRouter não existe
```

**Depois**:
```javascript
if (!openRouterCall) {
  throw new Error('OpenRouter não configurado. Configure a chave nas Configurações de app.js');
}
const txt = await openRouterCall(prompt); // ✓ Usa callback injetado
```

**Passo C - Injetar em app.js (após carregar extraction.js via script tag)**:

**Localização**: No final de `loadGapi()` ou em um novo `initExtractor()`

```javascript
function initExtractor() {
  if (typeof setOpenRouterCallback === 'function') {
    setOpenRouterCallback(callOpenRouter);
    console.log('[Init] Extractor initialized with OpenRouter callback');
  } else {
    console.warn('[Init] extraction.js not loaded');
  }
}

// Chamar em window.addEventListener('load')
window.addEventListener('load', () => {
  loadConfig();
  loadVenues();
  loadHist();
  renderHist();
  loadGapi();
  initExtractor();  // ← ADICIONAR
  setupTextarea();
  setupKeyboardShortcuts();
  setTimeout(welcome, 380);
});
```

**Verificar**:
```bash
grep -n "setOpenRouterCallback" app.js extraction.js
# Ambos devem retornar resultados
```

---

### PASSO 2.3: Inicializar Variáveis Globais em app.js
**Tempo**: 20 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `app.js`

**Localização**: Na seção `// ── STATE ──` (linha ~286)

**Adicionar após `let duplicateCache = {}`**:
```javascript
// ── CALENDAR STATE ──
let gcalIndex = [];           // Índice de eventos do Google Calendar
let _gcalRefreshing = false;  // Flag para evitar refresh simultâneos
let lastAction = null;        // Para sistema de undo
```

**Verificar**:
```bash
grep -n "let gcalIndex" app.js
grep -n "let _gcalRefreshing" app.js
grep -n "let lastAction" app.js
# Deve retornar 3 linhas com os declares
```

---

### PASSO 2.4: Adicionar Função `checkDuplicate()`
**Tempo**: 10 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `app.js`

**Localização**: Após `function setSt()` (procure por essa função)

**Adicionar**:
```javascript
// ── DUPLICATE DETECTION ──

function checkDuplicate(ev) {
  if (!gcalIndex || !gcalIndex.length) return false;
  
  return gcalIndex.some(item => 
    item.title?.toLowerCase() === (ev.title || '').toLowerCase() && 
    item.date === ev.date
  );
}
```

**Verificar**:
```bash
grep -n "function checkDuplicate" app.js
# Deve retornar a linha
```

---

### PASSO 2.5: Adicionar Função `refreshGcalIndex()`
**Tempo**: 25 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `app.js`

**Localização**: Após `function checkDuplicate()` (que acabou de adicionar)

**Adicionar**:
```javascript
// ── GCAL INDEX REFRESH ──

async function refreshGcalIndex(force = false) {
  if (!force && _gcalRefreshing) {
    console.log('[GCal] Refresh já em progresso');
    return gcalIndex;
  }
  
  _gcalRefreshing = true;
  
  try {
    await ensureAuth();
    
    // Período: últimos 2 meses até próximos 3 meses
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
```

**Verificar**:
```bash
grep -n "async function refreshGcalIndex" app.js
# Deve retornar a linha
```

---

### PASSO 2.6: Adicionar Função `initDarkMode()`
**Tempo**: 15 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `app.js`

**Localização**: Após `refreshGcalIndex()` (que acabou de adicionar)

**Adicionar**:
```javascript
// ── DARK MODE ──

function initDarkMode() {
  const isDark = localStorage.getItem('eb_dark_mode') !== 'false';
  darkMode = isDark;
  
  const html = document.documentElement;
  html.classList.toggle('dark-mode', darkMode);
  html.style.colorScheme = darkMode ? 'dark' : 'light';
  
  // Se houver toggle button no HTML
  const toggle = document.getElementById('dark-toggle');
  if (toggle) {
    toggle.checked = darkMode;
    toggle.addEventListener('change', () => {
      darkMode = toggle.checked;
      localStorage.setItem('eb_dark_mode', darkMode ? 'true' : 'false');
      document.documentElement.classList.toggle('dark-mode', darkMode);
      document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
    });
  }
  
  console.log('[Init] Dark mode:', darkMode ? 'ON' : 'OFF');
}
```

**Modificar linha 355 em welcome()**:

**Antes**:
```javascript
try {
  initDarkMode();
  // initTheme, initFontSize, initv4 removed for v5.0
} catch(e) {
  console.log('Init error:', e.message);
}
```

**Depois**:
```javascript
try {
  initDarkMode();
  // initTheme, initFontSize, initv4 removed for v5.0
} catch(e) {
  console.warn('Init error (non-critical):', e.message);
  // Não quebra app se falhar
}
```

**Verificar**:
```bash
grep -n "function initDarkMode" app.js
# Deve retornar a linha
```

---

## FASE 3: ASYNC/PROMISES (1.5 horas)

### PASSO 3.1: Corrigir getSAToken() em welcome()
**Tempo**: 15 minutos  
**Severidade**: 🔴 CRÍTICA  
**Arquivo**: `app.js`

**Localização**: Função `welcome()` (procure por essa função)

**Antes** (linhas ~350-356):
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

**Depois**:
```javascript
if (cfg.serviceAccount?.private_key) {
  getSAToken()
    .then(tok => {
      if (tok) {
        accessToken = tok;
        setSt(true, 'Service Account');
      }
    })
    .catch(e => {
      console.warn('[Auth] SA token error:', e.message);
      setSt(false, 'Erro no Service Account');
    });
}
```

**Checklist**:
- [ ] `.catch()` adicionado
- [ ] Erro é logado
- [ ] UI é atualizada em caso de erro

---

### PASSO 3.2: Melhorar callOpenRouter() com Retry e Backoff
**Tempo**: 30 minutos  
**Severidade**: 🟠 ALTO  
**Arquivo**: `app.js`

**Localização**: Função `callOpenRouter()` (procure por essa função)

**Substituir função inteira**:

```javascript
async function callOpenRouter(prompt, maxRetries = 3) {
  if (!cfg.openRouterKey) {
    throw new Error('Configure a chave de API do OpenRouter nas Configurações.');
  }
  
  let lastError = null;
  
  for (const model of OR_MODELS) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
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
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await r.json();
        
        if (!r.ok) {
          const msg = data?.error?.message || 'HTTP ' + r.status;
          lastError = new Error(msg);
          
          // Retry em rate limit com backoff exponencial
          if (r.status === 429) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`[OpenRouter] Rate limited (${model}). Retry ${attempt + 1}/${maxRetries} em ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          
          // Skip modelo se não disponível
          if (r.status === 404 || msg.includes('endpoint') || msg.includes('not available')) {
            console.log(`[OpenRouter] Modelo ${model} não disponível`);
            break;
          }
          
          // Quota esgotada
          if (msg.includes('quota')) {
            console.log(`[OpenRouter] Quota esgotada`);
            break;
          }
          
          throw lastError;
        }
        
        const txt = data.choices?.[0]?.message?.content;
        if (txt) {
          console.log(`[OpenRouter] ✓ Sucesso com ${model}`);
          return txt;
        }
      } catch(e) {
        if (e.name === 'AbortError') {
          console.warn(`[OpenRouter] Timeout em ${model}`);
          lastError = new Error('Timeout ao chamar API');
          break;
        }
        
        lastError = e;
        
        if (attempt === maxRetries - 1) {
          console.warn(`[OpenRouter] Falha final em ${model}:`, e.message);
          break;
        }
        
        const delay = Math.pow(2, attempt) * 500;
        console.log(`[OpenRouter] Erro em ${model} (${e.message}), retry ${attempt + 1}/${maxRetries} em ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  throw lastError || new Error('Nenhum modelo OpenRouter disponível. Tente em instantes.');
}
```

**Checklist**:
- [ ] Retry com backoff exponencial implementado
- [ ] Timeout de 30s implementado
- [ ] Diferenciação de erros (429, 404, etc)
- [ ] Logging detalhado

---

### PASSO 3.3: Standardizar uso de ensureAuth()
**Tempo**: 20 minutos  
**Severidade**: 🟠 ALTO  
**Arquivo**: `app.js`

**Procurar todas as chamadas**:
```bash
grep -n "ensureAuth\|createEvents\|deleteCalEvent" app.js | head -20
```

**Verificar que TODAS as operações de Calendar têm await**:

```javascript
// ✓ CORRETO - tem await
const res = await createEvents(ev);

// ✓ CORRETO - é async, tem await
await ensureAuth();

// ❌ ERRADO - não tem await
ensureAuth();
createEvents(ev);

// ✓ CORRETO - .catch() tratado
ensureAuth().catch(e => console.warn('Auth error:', e));
```

**Procurar e corrigir**:
1. Linhas 745, 814, 969: ✓ OK (têm await)
2. Linhas com Google Calendar API: todas devem ter await
3. Linhas com fetch(): todas devem ter await

**Adicionar verificação de auth antes de Calendar operations**:

```javascript
// Antes de qualquer operação de Calendar:
try {
  await ensureAuth();
  // ... resto da operação
} catch(e) {
  toast('Erro de autenticação: ' + e.message, 'error');
  throw e;
}
```

**Checklist**:
- [ ] Todas as operações de Calendar têm `await ensureAuth()`
- [ ] Todas têm try-catch
- [ ] Erros são tratados com toast

---

### PASSO 3.4: Adicionar Tratamento em handleMovieLink()
**Tempo**: 15 minutos  
**Severidade**: 🟠 ALTO  
**Arquivo**: `app.js`

**Localização**: Função `handleMovieLink()` (linha ~1025)

**Adicionar try-catch wrapper** se não houver já:

```javascript
async function handleMovieLink(url) {
  flow.state = 'idle';
  showTyping();
  botMsg('Extraindo dados do filme...');
  
  try {
    // ... resto do código
  } catch(e) {
    hideTyping();
    console.error('[Movie] Erro inesperado:', e);
    botMsg('<strong>Erro:</strong> ' + esc(e.message || 'Tente novamente'), [
      {label: 'Tentar com outro link', cb: startMovie},
      {label: 'Preencher manualmente', cb: startManual},
    ]);
    flow.state = 'idle';
  }
}
```

**Checklist**:
- [ ] Erro é tratado
- [ ] UI é atualizada
- [ ] User tem opções de retry

---

## FASE 4: VAZAMENTOS DE MEMÓRIA (1.5 horas)

### PASSO 4.1: Adicionar Limite de Cache em extraction.js
**Tempo**: 20 minutos  
**Severidade**: 🟠 ALTO  
**Arquivo**: `extraction.js`

**Localização**: Função `setCache()` (linha ~57)

**Antes**:
```javascript
function setCache(url, data) {
  if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return;
  
  const key = getCacheKey(url);
  extractionCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  console.log('[Extractor] Cached:', url);
}
```

**Depois**:
```javascript
function setCache(url, data) {
  if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return;
  
  const key = getCacheKey(url);
  
  // Limite de cache: máximo 150 entradas
  const MAX_CACHE_SIZE = 150;
  if (extractionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = extractionCache.keys().next().value;
    extractionCache.delete(oldestKey);
    console.log('[Extractor] Cache limite atingido, removendo entrada antiga');
  }
  
  extractionCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  console.log('[Extractor] Cached:', url, `(${extractionCache.size}/${MAX_CACHE_SIZE})`);
}
```

**Adicionar função de limpeza** (após `setCache()`):

```javascript
function cleanExpiredCache() {
  const now = Date.now();
  const expired = [];
  
  for (const [key, entry] of extractionCache.entries()) {
    if (now - entry.timestamp > DEFAULT_EXTRACTOR_CONFIG.cacheTTL) {
      extractionCache.delete(key);
      expired.push(key);
    }
  }
  
  if (expired.length > 0) {
    console.log('[Extractor] Limpeza de cache: removidas', expired.length, 'entradas expiradas');
  }
  
  return expired.length;
}

// Chamar periodicamente (a cada 1 minuto)
setInterval(cleanExpiredCache, 60000);
```

**Checklist**:
- [ ] `setCache()` agora limita a 150 entradas
- [ ] `cleanExpiredCache()` remove entradas expiradas
- [ ] Cleanup roda a cada 1 minuto
- [ ] Logs adicionados para monitoring

---

### PASSO 4.2: Implementar Cleanup em db.js
**Tempo**: 25 minutos  
**Severidade**: 🟠 ALTO  
**Arquivo**: `db.js`

**Localização**: Início do arquivo (após `let currentUser = null;`)

**Adicionar**:
```javascript
let eventsChannel = null;  // Track subscription channel
```

**Substituir função `onEventsChange()`** (linha ~196):

**Antes**:
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

**Depois**:
```javascript
function onEventsChange(callback) {
  if (!supabaseClient) {
    return () => {}; // Return no-op unsubscribe
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
  
  console.log('[DB] Subscribed to events-changes');
  
  // Retornar função para unsubscribe
  return () => {
    if (eventsChannel) {
      console.log('[DB] Unsubscribing from events-changes');
      eventsChannel.unsubscribe();
      eventsChannel = null;
    }
  };
}
```

**Usar em app.js** (se usado):

```javascript
// Ao iniciar listener
const unsubscribe = onEventsChange(callback);

// Ao parar (ex: ao logout)
unsubscribe();
```

**Checklist**:
- [ ] `eventsChannel` declarado no topo
- [ ] Cleanup da subscription anterior
- [ ] Error handling em callback
- [ ] Retorna função de cleanup
- [ ] Logs para debugging

---

### PASSO 4.3: Melhorar initSupabase() em db.js
**Tempo**: 20 minutos  
**Severidade**: 🟠 ALTO  
**Arquivo**: `db.js`

**Localização**: Função `initSupabase()` (linha ~19)

**Antes** (problemático):
```javascript
async function initSupabase() {
  if (isDevMode) {
    console.log('ℹ️ Modo desenvolvimento (sem Supabase)');
    return null;
  }
  
  try {
    const { createClient } = window.supabase || await import('https://esm.sh/@supabase/supabase-js');
    // ...
  } catch (error) {
    console.error('❌ Erro ao conectar Supabase:', error);
    throw error;
  }
}
```

**Depois** (melhorado):
```javascript
async function initSupabase() {
  if (isDevMode) {
    console.log('ℹ️ Modo desenvolvimento (sem Supabase)');
    return null;
  }
  
  try {
    let createClient;
    
    // Tentar usar global window.supabase primeiro
    if (window.supabase && window.supabase.createClient) {
      createClient = window.supabase.createClient;
      console.log('[DB] Usando Supabase global');
    } else {
      // Fallback para importação ESM
      try {
        const mod = await import('https://esm.sh/@supabase/supabase-js@2');
        createClient = mod.createClient;
        console.log('[DB] Importou Supabase via ESM');
      } catch(importError) {
        console.error('[DB] Erro ao importar Supabase:', importError.message);
        isDevMode = true;
        console.log('[DB] Fallback para dev mode');
        return null;
      }
    }
    
    if (!createClient) {
      throw new Error('createClient function not found');
    }
    
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
      console.warn('[DB] Supabase config incomplete, entering dev mode');
      isDevMode = true;
      return null;
    }
    
    supabaseClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    
    console.log('[DB] ✓ Supabase connected');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    if (sessionError) {
      console.warn('[DB] Session error:', sessionError.message);
    }
    
    if (session) {
      currentUser = session.user;
      console.log('[DB] ✓ User logged in:', session.user.email);
    }
    
    return session;
  } catch (error) {
    console.error('[DB] ❌ Error initializing Supabase:', error);
    isDevMode = true;
    console.log('[DB] Fallback to dev mode');
    return null;
  }
}
```

**Checklist**:
- [ ] Múltiplas estratégias de carregamento
- [ ] Fallback para dev mode em caso de erro
- [ ] Logs detalhados
- [ ] Config é validada antes de usar
- [ ] Não quebra a app

---

## FASE 5: VALIDAÇÃO E TESTES (1 hora)

### PASSO 5.1: Adicionar Validação de Data
**Tempo**: 15 minutos  
**Severidade**: 🟡 MÉDIO  
**Arquivo**: `app.js`

**Localização**: Nova função (adicionar antes de `saveEditEvent()`)

**Adicionar**:
```javascript
// ── DATE VALIDATION ──

function isValidDate(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Validar ranges básicos
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Validar data real (não 31 de fevereiro)
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
```

**Usar em `saveEditEvent()`** (linha ~973):

**Adicionar após validação de date**:
```javascript
if (!date) {
  errEl.textContent = 'A data é obrigatória.';
  errEl.style.display = 'block';
  return;
}

// ✅ ADICIONAR VALIDAÇÃO:
if (!isValidDate(date)) {
  errEl.textContent = 'Data inválida. Use formato YYYY-MM-DD (ex: 2024-12-25)';
  errEl.style.display = 'block';
  return;
}
```

**Checklist**:
- [ ] Função `isValidDate()` adicionada
- [ ] Validação usada em `saveEditEvent()`
- [ ] Mensagem de erro clara para usuário

---

### PASSO 5.2: Teste Manual - Autenticação
**Tempo**: 10 minutos  
**Severidade**: 🔴 CRÍTICA

**Checklist de Teste**:
- [ ] App carrega sem erros no console
- [ ] Service Account: App conecta com SA (se config existe)
- [ ] OAuth: Botão de login funciona
- [ ] Session: Token é persistido em sessionStorage
- [ ] Refresh: Página recarregada mantém autenticação

**Comandos no Console**:
```javascript
// Verificar estado
console.log('accessToken:', accessToken ? 'SET' : 'NOT SET');
console.log('cfg.serviceAccount:', cfg.serviceAccount ? 'LOADED' : 'NOT LOADED');
console.log('gcalIndex:', gcalIndex.length, 'eventos');

// Testar função
typeof refreshGcalIndex === 'function' ? 'OK' : 'MISSING';
typeof checkDuplicate === 'function' ? 'OK' : 'MISSING';
typeof initDarkMode === 'function' ? 'OK' : 'MISSING';
typeof isUrl === 'function' ? 'OK' : 'MISSING';
```

---

### PASSO 5.3: Teste Manual - Extração
**Tempo**: 15 minutos  
**Severidade**: 🔴 CRÍTICA

**Checklist de Teste**:
- [ ] Colar URL de Sympla → extrai dados
- [ ] Colar URL inválida → mostra erro
- [ ] API offline → fallback para manual
- [ ] Cache funciona (segunda URL mais rápida)

**URLs para Testar**:
```
// Teste 1: URL válida Sympla
https://www.sympla.com.br/evento/

// Teste 2: URL inválida
https://invalid-url-12345.com

// Teste 3: Cache (colar primeira URL novamente)
// Deve ser instantâneo (< 100ms)
```

---

### PASSO 5.4: Teste de Vazamento
**Tempo**: 10 minutos  
**Severidade**: 🟠 ALTO

**Checklist**:
- [ ] Abrir DevTools → Memory
- [ ] Tirar screenshot do memory inicial
- [ ] Extrair 50 URLs
- [ ] Tirar screenshot do memory final
- [ ] Memory não cresceu mais que 20MB

**Comando no Console**:
```javascript
console.log('[Cache] Size:', extractionCache.size, 'entries');
console.log('[Cache] Limit: 150 entries');
console.log('[Cache] Utilization:', 
  Math.round(extractionCache.size / 150 * 100) + '%');
```

---

## FASE 6: COMMIT E DOCUMENTAÇÃO (30 minutos)

### PASSO 6.1: Verificar Antes de Commit
**Tempo**: 10 minutos

**Checklist**:
- [ ] `grep -r "sb_publishable\|sb_secret" config.js` = (vazio)
- [ ] `.gitignore` contém `config.js` e `.env`
- [ ] Não há chaves no `.env.example`
- [ ] `let gcalIndex = []` inicializado
- [ ] Todas as funções adicionadas compilam sem erro

---

### PASSO 6.2: Criar Commit
**Tempo**: 10 minutos

```bash
# Stage mudanças
git add -u  # Atualizar arquivos modificados
git add .env.example
git add .gitignore

# Verificar status
git status

# Commit com mensagem descritiva
git commit -m "fix: Critical security and stability improvements

SECURITY:
- Removed API keys from config.js
- Implemented .env configuration
- Added .gitignore for sensitive files

CRITICAL FIXES:
- Added missing isUrl() function in extraction.js
- Initialize gcalIndex global variable
- Added checkDuplicate() and refreshGcalIndex() functions
- Added initDarkMode() function
- Fixed unhandled promises in getSAToken()
- Implemented retry with backoff in callOpenRouter()

MEMORY LEAKS:
- Added cache size limit (150 entries)
- Implemented cleanup for Supabase listeners
- Added memory monitoring logs

STABILITY:
- Improved error handling in initialization
- Added proper async/await patterns
- Enhanced logging for debugging

Fixes #1 #2 #3"
```

---

### PASSO 6.3: Push para Remote
**Tempo**: 5 minutos

```bash
# Se for novo branch:
git push -u origin fix/critical-issues

# Se for branch existente:
git push
```

---

## FASE 7: VERIFICAÇÃO FINAL

### Checklist de Conclusão

- [ ] ✅ Segurança: Chaves removidas (config.js vazio)
- [ ] ✅ Críticos: Todas as 6 funções adicionadas
- [ ] ✅ Promises: Await adicionado onde necessário
- [ ] ✅ Vazamentos: Cache e listeners limitados
- [ ] ✅ Erro Handling: Try-catch adicionado
- [ ] ✅ Validação: Data validada
- [ ] ✅ Testes: Manual tests passaram
- [ ] ✅ Commits: Mudanças commited
- [ ] ✅ Documentação: Este plano preenchido

### Resultado Esperado

**Antes**: App instável, chances de crash, exposição de segurança  
**Depois**: App estável, sem race conditions, seguro

---

## 📞 PRÓXIMAS AÇÕES

1. **Implementar testes automatizados** (Jest/Vitest)
2. **Adicionar ESLint** para detectar problemas automaticamente
3. **Setup CI/CD** para rodar testes em cada commit
4. **Code review** de todas as mudanças
5. **Performance testing** com 500+ URLs

---

**Tempo Total Estimado**: 7-9 horas  
**Desenvolvedor**: 1 pessoa  
**Status**: Pronto para começar

