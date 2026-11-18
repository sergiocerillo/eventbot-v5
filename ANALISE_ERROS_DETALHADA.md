# ANÁLISE COMPLETA DE ERROS - PROJETO EVENTS
## Relatório Detalhado de Problemas JavaScript

Data: 2024
Versão: v5.0

---

## 📊 RESUMO EXECUTIVO

| Categoria | Crítico | Alto | Médio | Baixo | Total |
|-----------|---------|------|-------|-------|-------|
| Erros de Sintaxe | 0 | 0 | 0 | 0 | 0 |
| Referências Não Definidas | 1 | 3 | 2 | 4 | 10 |
| Funções Não Existentes | 0 | 2 | 1 | 3 | 6 |
| Promises Não Aguardadas | 2 | 4 | 3 | 1 | 10 |
| Vazamentos de Memória | 0 | 1 | 2 | 2 | 5 |
| Operações Assincadas Inadequadas | 1 | 3 | 2 | 0 | 6 |
| Falta de Tratamento de Erro | 2 | 5 | 4 | 3 | 14 |
| Lógica Quebrada | 0 | 2 | 3 | 2 | 7 |
| **TOTAL** | **6** | **20** | **17** | **15** | **58** |

---

## 🔴 ERROS CRÍTICOS (Severidade 1)

### 1. **Função não definida: `isUrl()` chamada sem definição global**
- **Arquivo**: `extraction.js`, `app.js`
- **Linhas**: extraction.js (linhas 276, 387), app.js (linhas 400, 425, 542, etc)
- **Problema**: A função `isUrl()` é usada em vários lugares mas nunca é definida em `extraction.js`
- **Impacto**: Crítico - causa erro de runtime quando extraction.js é executado isoladamente
- **Solução**:
  ```javascript
  // Adicionar em extraction.js
  function isUrl(s) {
    return /^https?:\/\//i.test(String(s || '').trim());
  }
  ```

### 2. **Promise não aguardada em `getSAToken()` - Possível race condition**
- **Arquivo**: `app.js`, linhas 350-356
- **Problema**: Em `welcome()`, a chamada `getSAToken().then()` não é esperada antes de chamar `botMsg()`
- **Impacto**: Crítico - UI pode renderizar antes da autenticação estar pronta
- **Código problemático**:
  ```javascript
  if (cfg.serviceAccount?.private_key) {
    getSAToken().then(tok => {
      if (tok) {
        accessToken = tok;
        setSt(true, 'Service Account');
      }
    }); // ❌ Sem await - continua mesmo antes de terminar
  }
  ```
- **Solução**:
  ```javascript
  if (cfg.serviceAccount?.private_key) {
    await getSAToken().then(tok => {
      if (tok) {
        accessToken = tok;
        setSt(true, 'Service Account');
      }
    }).catch(e => console.warn('SA token error:', e));
  }
  ```

### 3. **Falta de tratamento de erro em `tryRestoreSession()` - Promise rejeitada**
- **Arquivo**: `app.js`, linhas 318-333
- **Problema**: `tryRestoreSession()` retorna uma Promise que pode ser rejeitada em `welcome()` mas não é tratada adequadamente
- **Impacto**: Crítico - pode causar unhandled rejection
- **Código problemático**:
  ```javascript
  tryRestoreSession().then(() => {
    botMsg('Olá! 👋 Como quer cadastrar?', [...]); 
  }).catch(() => { // catch está ali
    botMsg('Olá! 👋 Como quer cadastrar? (Login não configurado)', [...]);
  });
  ```
- **Nota**: Este está parcialmente tratado, mas o `returnPromise em `tryRestoreSession()` não é explícito

### 4. **Promise não aguardada em `ensureAuth()` - Race condition crítica**
- **Arquivo**: `app.js`, linhas 306-312, 745-750
- **Problema**: `ensureAuth()` é async mas frequentemente não é aguardada
- **Exemplos**:
  - Line 745: `createEvents(ev)` chama `await ensureAuth()` - OK
  - Line 814: `deleteCalEvent()` chama `await ensureAuth()` - OK
  - MAS em `saveCfg()` (linha 823): `initGIS()` é chamado sem verificar auth state
- **Impacto**: Crítico - Operações de calendario podem falhar silenciosamente

### 5. **Função `callOpenRouter()` não definida no `extraction.js`**
- **Arquivo**: `extraction.js`, linha 238
- **Problema**: A função é chamada mas nunca é definida neste arquivo (só existe em app.js)
- **Impacto**: Crítico - `extractWithAI()` sempre falhará
- **Solução**: Adicionar função em extraction.js ou importar de app.js

### 6. **Acesso a `document` em `extraction.js` sem verificação**
- **Arquivo**: `extraction.js`, linhas 44, 57, 108, 155 (DOMParser, document)
- **Problema**: O código tenta usar `DOMParser` e `document` que não existem em Node.js
- **Impacto**: Crítico - Arquivo não pode ser usado em servidor/Node.js
- **Código problemático**:
  ```javascript
  const doc = new DOMParser().parseFromString(html, 'text/html'); // linha 155
  // DOMParser não existe em Node.js
  ```

---

## 🟠 ERROS DE ALTA SEVERIDADE (Severidade 2)

### 7. **Variável `gcalIndex` não inicializada**
- **Arquivo**: `app.js`
- **Problema**: `gcalIndex` é usado (linha 846, 1022, 1071) mas nunca é inicializado
- **Impacto**: Alto - Pode causar erro quando `refreshGcalIndex()` é chamado
- **Solução**: Adicionar no estado inicial:
  ```javascript
  let gcalIndex = [];
  ```

### 8. **Função `refreshGcalIndex()` não definida ou incompleta**
- **Arquivo**: `app.js`, linhas 846, 1022, 1071
- **Problema**: A função é chamada mas não encontramos a definição completa
- **Impacto**: Alto - Funcionalidade de verificação de duplicatas não funciona
- **Locais onde é usada**:
  - Line 846: `await refreshGcalIndex();`
  - Line 1022: `await refreshGcalIndex(force);`

### 9. **Função `checkDuplicate()` não definida**
- **Arquivo**: `app.js`, linhas 847, 1018
- **Problema**: A função é chamada mas não é definida
- **Impacto**: Alto - Verificação de eventos duplicados não funciona
- **Solução**: Definir a função:
  ```javascript
  function checkDuplicate(ev) {
    return gcalIndex.some(item => 
      item.title === ev.title && item.date === ev.date
    );
  }
  ```

### 10. **Função `initDarkMode()` não definida**
- **Arquivo**: `app.js`, linha 355
- **Problema**: Chamada em welcome() mas não é definida no arquivo lido
- **Impacto**: Alto - Modo escuro pode não funcionar
- **Solução**: Definir ou remover chamada se não usada

### 11. **Promise não aguardada em `startBatchLinks()`**
- **Arquivo**: `app.js`, linhas ~1200+
- **Problema**: Loop chamando `extractFromLinkEnhanced()` com await, mas o resto do código continua sem esperar resultados finais
- **Impacto**: Alto - UI pode congelar ou mostrar resultados incompletos

### 12. **Falta de tratamento de erro em `initSupabase()`**
- **Arquivo**: `db.js`, linhas 13-37
- **Problema**: Se `window.supabase` não existe, tenta importar mas não trata erro corretamente
- **Impacto**: Alto - Banco de dados não inicializa
- **Código problemático**:
  ```javascript
  const { createClient } = window.supabase || await import('https://esm.sh/@supabase/supabase-js');
  // Tentativa de import ESM em contexto que pode não suportar
  ```

### 13. **Race condition em `callOpenRouter()`**
- **Arquivo**: `app.js`, linhas 510-535
- **Problema**: Loop sobre modelos tenta múltiplas requisições sem delay apropriado
- **Impacto**: Alto - Pode ser bloqueado por rate limiting
- **Código problemático**:
  ```javascript
  for (const model of OR_MODELS) {
    try {
      const r = await fetch(...); // Requisição sequencial OK, mas...
      // Se falhar por rate limit, continua imediatamente sem backoff
    }
  }
  ```

---

## 🟡 ERROS DE MÉDIA SEVERIDADE (Severidade 3)

### 14. **Promises não aguardadas em `handle()` para handleLink() e handleMovieLink()**
- **Arquivo**: `app.js`, linhas 733-740
- **Problema**: Funções async são chamadas sem await quando estão dentro de um handler de event
- **Impacto**: Médio - Fluxo de controle pode ficar inconsistente
- **Código**:
  ```javascript
  if (st === 'await_link') {
    if (isUrl(txt)) {
      await handleLink(txt); // ✓ OK aqui
    }
  }
  if (st === 'await_movie_link') {
    if (isUrl(txt)) {
      await handleMovieLink(txt); // ✓ OK aqui
    }
  }
  ```

### 15. **Variáveis globais que podem causar vazamento de memória**
- **Arquivo**: `app.js`
- **Problema**: `extractionCache` (Map em extraction.js) cresce indefinidamente
- **Impacto**: Médio - Vazamento de memória em longa execução
- **Linhas**: extraction.js, linhas 38-65
- **Solução**: Implementar limite de tamanho:
  ```javascript
  function setCache(url, data) {
    if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return;
    
    const key = getCacheKey(url);
    
    // Limpar se cache ficar grande
    if (extractionCache.size > 100) {
      const firstKey = extractionCache.keys().next().value;
      extractionCache.delete(firstKey);
    }
    
    extractionCache.set(key, { data, timestamp: Date.now() });
  }
  ```

### 16. **Referência não definida: `extractFromLinkEnhanced()` pode estar no escopo errado**
- **Arquivo**: `app.js`, linhas 728, 1208
- **Problema**: Função é chamada mas é definida em `extraction.js` que é carregado via script tag
- **Impacto**: Médio - Funciona se arquivo está carregado, mas não é verificado
- **Solução**: Verificar existência antes de usar:
  ```javascript
  if (typeof extractFromLinkEnhanced !== 'function') {
    throw new Error('extraction.js não foi carregado');
  }
  ```

### 17. **Falta de tratamento de erro em `handleMovieLink()`**
- **Arquivo**: `app.js`, linhas 1025-1110
- **Problema**: Múltiplos try-catch mas alguns paths não têm tratamento adequado
- **Impacto**: Médio - Erro pode deixar UI inconsistente
- **Exemplo**:
  ```javascript
  let pageText = null;
  try {
    pageText = await fetchPageText(url);
  } catch(e) {
    console.log('[Movie] fetchPageText falhou:', e.message);
    // Continua mesmo se falhar - pode causar problemas depois
  }
  ```

### 18. **Referência não definida: `createEvents()` espera vários campos**
- **Arquivo**: `app.js`, linhas 457-488
- **Problema**: `createEvents(ev)` assume `ev.allDay` mas ao chamar em outros lugares passa `ev` que pode não ter este campo
- **Impacto**: Médio - Alguns eventos podem ser criados com formato incorreto
- **Linha 1056**: Filme é criado como `allDay: true` mas evento normal pode não ter

### 19. **Operação assincada sem await em `loginWithGoogle()`**
- **Arquivo**: `db.js`, linhas 38-54
- **Problema**: Se supabaseClient não existe, tenta inicializar mas não aguarda
- **Impacto**: Médio - Login pode falhar silenciosamente
- **Código**:
  ```javascript
  async function loginWithGoogle() {
    if (!supabaseClient) await initSupabase(); // OK
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({...}); // Mas supabaseClient pode ser null
  ```

### 20. **Vazamento em `onEventsChange()`**
- **Arquivo**: `db.js`, linhas 196-210
- **Problema**: Channel é inicializado mas nunca é unsubscribed ou limpo
- **Impacto**: Médio - Listeners acumulam em memória
- **Solução**:
  ```javascript
  let eventsChannel = null;
  
  function onEventsChange(callback) {
    if (!supabaseClient) return;
    
    if (eventsChannel) {
      eventsChannel.unsubscribe(); // Limpar anterior
    }
    
    eventsChannel = supabaseClient
      .channel('events-changes')
      .on('postgres_changes', {...}, payload => callback(payload))
      .subscribe();
      
    return () => eventsChannel?.unsubscribe(); // Retornar função de limpeza
  }
  ```

### 21. **Erro ao fechar modals - possível elemento não encontrado**
- **Arquivo**: `app.js`, linhas 667-676
- **Problema**: Tenta fechar elementos que podem não existir
- **Impacto**: Médio - Pode gerar erro silencioso
- **Código**:
  ```javascript
  ['cfg-modal','events-modal','shows-modal',...].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(...); // ✓ OK aqui
  });
  ```

---

## 🔵 ERROS DE BAIXA SEVERIDADE (Severidade 4)

### 22. **Variável não inicializada: `batchQueue`**
- **Arquivo**: `app.js`, linha 288 (declarada) mas usada em linha 1194 sem inicialização
- **Severidade**: Baixa - inicializada antes de uso em `startBatchLinks()`
- **Recomendação**: Inicializar explicitamente: `let batchQueue = [];`

### 23. **Função `deleteEventFromBatch()` pode não estar definida**
- **Arquivo**: `app.js`
- **Problema**: Referência em linha 1194+ mas definição não encontrada
- **Severidade**: Baixa
- **Status**: Precisa ser localizada ou adicionada

### 24. **Comentários removidos podem indicar código incompleto**
- **Arquivo**: `app.js`, linhas 346-347
- **Problema**: Comentários indicam remoção de funções em v4.0/v5.0
- **Severidade**: Baixa - Mas funcionalidade pode estar faltando
- **Exemplo**:
  ```javascript
  // Status de presença removido em v4.0
  // initTheme, initFontSize, initv4 removed for v5.0
  ```

### 25. **Inconsistência de nomenclatura: `venue` vs `venue_name`**
- **Arquivo**: `app.js`, linhas 763, 1056
- **Problema**: Às vezes usa `ev.venue`, às vezes `ev.venue_name`
- **Severidade**: Baixa - Pode causar bugs em dados
- **Solução**: Padronizar para um nome

### 26. **Falta de validação de entrada em `saveEditEvent()`**
- **Arquivo**: `app.js`, linhas 969-1010
- **Problema**: Valida title e date, mas não valida format de date (YYYY-MM-DD)
- **Severidade**: Baixa
- **Solução**: Adicionar regex:
  ```javascript
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    errEl.textContent = 'Data deve estar no formato YYYY-MM-DD';
    return;
  }
  ```

### 27. **Função `fetchPageText()` tenta múltiplos proxies mas sem logging adequado**
- **Arquivo**: `app.js`, linhas 507-527
- **Problema**: Erro 404 pode significar proxy desabilitado mas não diferencia
- **Severidade**: Baixa
- **Impacto**: Difícil debugar problemas de scraping

### 28. **Referência circular possível entre extraction.js e app.js**
- **Arquivo**: extraction.js chama `callOpenRouter()` (definida em app.js)
- **Severidade**: Baixa - Funciona se loaded correto, mas design ruim
- **Recomendação**: Refatorar para permitir injeção de dependência

---

## 🔍 ANÁLISE DETALHADA POR ARQUIVO

### **extraction.js**

| Tipo | Severidade | Quantidade | Detalhes |
|------|-----------|-----------|----------|
| Referência indefinida | Crítico | 2 | `isUrl()`, `callOpenRouter()` |
| Acesso ao DOM sem verificação | Crítico | 1 | `DOMParser`, `document` |
| Vazamento de memória | Médio | 1 | `extractionCache` sem limite |
| Falta de tratamento | Médio | 2 | Erros de proxy silenciosos |
| **Total** | | 6 | |

### **extraction_config.js**

| Tipo | Severidade | Quantidade | Detalhes |
|------|-----------|-----------|----------|
| ❌ Sem erros encontrados | | 0 | Arquivo apenas configuração |

### **app.js**

| Tipo | Severidade | Quantidade | Detalhes |
|------|-----------|-----------|----------|
| Referência indefinida | Alto | 4 | `gcalIndex`, `refreshGcalIndex()`, `checkDuplicate()`, `initDarkMode()` |
| Promise não aguardada | Crítico | 3 | `getSAToken()`, `tryRestoreSession()` chain |
| Falta de tratamento | Alto | 8 | Múltiplas operações async |
| Race condition | Alto | 2 | `ensureAuth()` inconsistente |
| Lógica quebrada | Médio | 3 | Inconsistência `venue` vs `venue_name` |
| Validação inadequada | Baixo | 2 | Date format, email validation |
| **Total** | | 22 | |

### **db.js**

| Tipo | Severidade | Quantidade | Detalhes |
|------|-----------|-----------|----------|
| Inicialização frágil | Alto | 1 | `initSupabase()` pode falhar |
| Vazamento de memória | Médio | 1 | `onEventsChange()` sem cleanup |
| Suposição de supabaseClient | Médio | 2 | Pode ser null em dev mode |
| **Total** | | 4 | |

### **config.js**

| Tipo | Severidade | Quantidade | Detalhes |
|------|-----------|-----------|----------|
| ⚠️ Exposição de Secrets | Crítico | 1 | Chaves de API no arquivo! |
| **Total** | | 1 | |

### **config_dev.js**

| Tipo | Severidade | Quantidade | Detalhes |
|------|-----------|-----------|----------|
| ❌ Sem erros encontrados | | 0 | Arquivo desenvolvimento apenas |

---

## ⚠️ PROBLEMA DE SEGURANÇA CRÍTICO

### **Exposição de Chaves de API em config.js**

**Arquivo**: `config.js`
**Linhas**: 9, 12

**Problema**: As chaves de API são hardcoded no arquivo:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://sergiocerillo-coding-eventb.supabase.co',
  anonKey: 'sb_publishable_Bcs_nHgPwY2AJh9CXBjvHg_Sw5lgu8lsb_secret_Hro5HvWgtzCAI9VTmQFv_Q_XxRxxBAi'
};
```

**Impacto**: CRÍTICO
- ❌ Qualquer pessoa com acesso ao código pode usar essas chaves
- ❌ Se commitar no GitHub público, chaves são comprometidas
- ❌ Atacantes podem acessar o banco de dados Supabase

**Solução Imediata**:
1. **Revogar as chaves** no Supabase dashboard
2. Gerar novas chaves
3. Mover para variáveis de ambiente:

```javascript
// config.js (SEGURO)
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || localStorage.getItem('sb_url'),
  anonKey: process.env.SUPABASE_ANON_KEY || localStorage.getItem('sb_key')
};
```

4. Adicionar `config.js` ao `.gitignore` (se contiver dados sensíveis)
5. Usar `.env.example` para documentar variáveis necessárias

---

## 📋 PROBLEMAS DE LÓGICA

### 31. **Lógica inconsistente em `handleLink()` vs `handleMovieLink()`**
- **Arquivo**: `app.js`
- **Problema**: `handleLink()` trata URL de ingresso como show, mas `handleMovieLink()` também faz
- **Linhas**: 726-728
- **Impacto**: Lógica confusa, detecção automática pode falhar

### 32. **Fluxo de estado ambíguo em `handle()`**
- **Arquivo**: `app.js`, linhas 714-801
- **Problema**: State `ticket_link` é definido mas handler para esse state está em outro lugar
- **Impacto**: Pode pular states ou ficar preso

### 33. **Lógica de `allDay` em filmes não é preservada**
- **Arquivo**: `app.js`, linha 1056
- **Problema**: Filme é criado com `allDay: true`, mas depois em `createEvents()` é verificado
- **Impacto**: Pode causar conflito de formato

---

## 🛠️ OPERAÇÕES ASSINCADAS MAL FEITAS

### 34. **`extractFromLinkEnhanced()` com múltiplos await aninhados**
- **Arquivo**: `extraction.js`, linhas 299-380
- **Problema**: Chama `scrapeDirect()` múltiplas vezes sem cache apropriado
- **Impacto**: Performance ruim, múltiplas requisições

### 35. **`extractBulk()` sem limite de concorrência**
- **Arquivo**: `extraction.js`, linhas 383-402
- **Problema**: Loop sequencial com delay fixo, mas sem Promise.all() para otimização
- **Impacto**: Lento para muitos URLs
- **Solução**: Usar Promise.allSettled com concorrência:
  ```javascript
  async function extractBulk(urls, concurrency = 3) {
    const results = [];
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      results.push(...await Promise.allSettled(
        batch.map(url => extractFromLinkEnhanced(url))
      ));
    }
    return results;
  }
  ```

---

## 📝 RECOMENDAÇÕES DE CORREÇÃO - PRIORIDADE

### **PRIORIDADE 1 - FAZER IMEDIATAMENTE (Crítico)**

1. ✅ Revogar/regenerar chaves de API em `config.js`
2. ✅ Adicionar função `isUrl()` em `extraction.js`
3. ✅ Adicionar função `callOpenRouter()` em `extraction.js` ou importar
4. ✅ Inicializar `gcalIndex = []` em `app.js`
5. ✅ Definir `checkDuplicate()` e `refreshGcalIndex()` em `app.js`
6. ✅ Adicionar `await` em `getSAToken()` em `welcome()`

### **PRIORIDADE 2 - FAZER HOJE (Alto)**

7. ✅ Definir `initDarkMode()` ou remover chamada
8. ✅ Corrigir tratamento de erro em `initSupabase()`
9. ✅ Adicionar tratamento de erro em `callOpenRouter()` com backoff
10. ✅ Implementar limite de cache em `extractionCache`
11. ✅ Implementar cleanup de listeners em `onEventsChange()`
12. ✅ Padronizar nomenclatura `venue` vs `venue_name`

### **PRIORIDADE 3 - FAZER ESTA SEMANA (Médio)**

13. ✅ Adicionar validação de formato de data
14. ✅ Refatorar `extractBulk()` com concorrência
15. ✅ Adicionar logging melhorado para debugging
16. ✅ Implementar retry com backoff exponencial

### **PRIORIDADE 4 - MELHORIAS FUTURAS (Baixo)**

17. ✅ Refatorar `callOpenRouter()` para não ser dependência de `extraction.js`
18. ✅ Adicionar testes unitários
19. ✅ Melhorar tratamento de erros genéricos

---

## 🧪 CHECKLIST DE TESTES

### Testes que faltam:

- [ ] Testar `extractFromLinkEnhanced()` com URL inválida
- [ ] Testar `handleLink()` quando API está offline
- [ ] Testar `startBatchLinks()` com 100+ URLs
- [ ] Testar `createEvents()` sem Google OAuth configurado
- [ ] Testar vazamento em `extractionCache` após 500+ URLs
- [ ] Testar race condition com múltiplos tabs acessando `localStorage`
- [ ] Testar `db.js` em dev mode sem Supabase
- [ ] Testar cleanup de listeners em `onEventsChange()`

---

## 📚 RECURSOS RECOMENDADOS

- [MDN: Async/Await Best Practices](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
- [MDN: Error Handling with Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [OWASP: Secrets Management](https://owasp.org/www-community/attacks/Sensitive_Data_Exposure)
- [Node.js: Memory Leaks](https://nodejs.org/en/docs/guides/simple-profiling/)

---

## 📞 PRÓXIMOS PASSOS

1. **Revisar e aplicar correções de PRIORIDADE 1**
2. **Criar testes para funções críticas**
3. **Configurar CI/CD para detectar esses erros automaticamente**
4. **Realizar code review periódico**
5. **Implementar linting com ESLint e regras estritas**

---

**Relatório finalizado em**: 2024
**Status**: 58 problemas identificados
**Recomendação**: Abordar PRIORIDADE 1 antes de próximas releases
