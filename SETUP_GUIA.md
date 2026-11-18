# 🚀 GUIA DE SETUP - EventBot v5.0

## Pré-requisitos

- ✅ Node.js 18+ (opcional para desenvolvimento local)
- ✅ Git configurado
- ✅ Conta GitHub
- ✅ Chaves de API (Google, Supabase, OpenRouter)

---

## 1️⃣ Configuração Inicial (OBRIGATÓRIO)

### Passo 1: Clone o Repositório
```bash
git clone https://github.com/sergiocerillo/eventbot-v5.git
cd eventbot-v5
```

### Passo 2: Criar arquivo .env
```bash
# Copiar template
cp .env.example .env

# Editar .env com seus valores reais
nano .env
```

### Passo 3: Preencher .env com seus dados
```env
# SUPABASE CONFIGURATION
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=seu_anon_key_aqui

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_API_KEY=sua_api_key_aqui
GOOGLE_CALENDAR_ID=seu_calendar_id_aqui

# OPENROUTER API (para IA)
OPENROUTER_KEY=sua_openrouter_key_aqui

# MODO DESENVOLVIMENTO
DEV_MODE=false
```

---

## 2️⃣ Onde Obter as Chaves

### 🔑 Supabase
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → API
4. Copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon key` → `SUPABASE_ANON_KEY`

### 🔑 Google OAuth
1. Acesse https://console.cloud.google.com
2. Crie um novo projeto
3. Ative as APIs:
   - Google Calendar API
   - Google Drive API
4. Crie credenciais (OAuth 2.0)
5. Copie:
   - `Client ID` → `GOOGLE_CLIENT_ID`
   - `API Key` → `GOOGLE_API_KEY`

### 🔑 OpenRouter (Opcional - para extração com IA)
1. Acesse https://openrouter.ai
2. Crie uma conta
3. Vá em Settings → API Keys
4. Copie a chave → `OPENROUTER_KEY`

---

## 3️⃣ Verificações de Segurança

### ✅ Garantir que .env não é versionado
```bash
# Verificar que .env está no .gitignore
grep -i "^\.env" .gitignore

# Output esperado: .env
```

### ✅ Verificar que chaves não estão no git
```bash
# Buscar por chaves vazadas (nunca deve retornar nada)
git log -p | grep -i "supabase_url\|supabase_anon_key\|client_id"
```

### ✅ Revogar chaves antigas (se necessário)
Se por acaso as chaves foram commitadas em versões anteriores:
1. Acesse o dashboard do Supabase
2. Regenere as chaves
3. Atualize .env com novas chaves
4. Commit seguro: `git commit --amend -m "chore: update keys"`

---

## 4️⃣ Carregamento de Variáveis

### Em Browser (HTML)
```javascript
// Variáveis de ambiente são lidas via localStorage
// durante a inicialização em app.js

// Você pode também defini-las manualmente:
localStorage.setItem('supabase_url', 'https://seu-url.supabase.co');
localStorage.setItem('supabase_anon_key', 'sua_chave');
```

### Em Node.js (Desenvolvimento)
```javascript
// Usar dotenv package:
require('dotenv').config();

console.log(process.env.SUPABASE_URL);
console.log(process.env.OPENROUTER_KEY);
```

---

## 5️⃣ Estrutura de Callbacks (Novo Sistema)

### Como funciona o novo sistema

1. **extraction.js** expõe `setOpenRouterCallback()`:
```javascript
setOpenRouterCallback((prompt) => {
  // Será injetado por app.js
});
```

2. **app.js** injeta durante boot:
```javascript
function initializeExtractor() {
  if (typeof setOpenRouterCallback === 'function') {
    setOpenRouterCallback(callOpenRouter);
  }
}
```

3. **extraction.js** usa callback:
```javascript
const txt = await (openRouterCall ? openRouterCall(prompt) : Promise.reject(...));
```

### Benefícios
- ✅ Desacoplamento entre módulos
- ✅ Funciona em browser e Node.js
- ✅ Sem conflito de escopos
- ✅ Fácil mocking para testes

---

## 6️⃣ Retry com Backoff Exponencial

### Como funciona o novo retry

```javascript
// Novo sistema em callOpenRouter():
- Tentativa 1: falha → aguarda 1s → retry
- Tentativa 2: falha → aguarda 2s → retry
- Tentativa 3: falha → aguarda 4s → retry
- Tentativa 4: erro final
```

### Códigos de erro tratados
- **429 (Rate Limit)**: Aplica backoff exponencial
- **404, 500**: Tenta próximo modelo
- **Outro**: Erro imediato

### Configuração
```javascript
// Em app.js, função callOpenRouter():
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 segundo

// Você pode alterar esses valores se necessário
```

---

## 7️⃣ Limpeza de Cache

### Cache de Extração (extraction.js)

```javascript
// Automático: cache é limitado a 150 entradas
// Quando exceder, as antigas são removidas

// Manual: chamar cleanup
cleanupCache();
```

### Listeners de Supabase (db.js)

```javascript
// Criados automaticamente
onEventsChange((payload) => {
  console.log('Evento mudou:', payload);
});

// Limpeza no unload
window.addEventListener('beforeunload', () => {
  cleanupSubscriptions();
});
```

---

## 8️⃣ Desenvolvimento Local

### Setup com Node.js (opcional)
```bash
# Instalar dependências (se houver)
npm install

# Rodar server local (se houver)
npm run dev

# Testar sintaxe
node -c app.js
node -c extraction.js
node -c db.js
```

### Debugging
```javascript
// Em app.js, adicionar logs
console.log('[App] Extractor inicializado');

// Em extraction.js
console.log('[Extractor] Cache hit for:', url);

// Em db.js
console.log('[Supabase] Conectado!');
```

---

## 9️⃣ Troubleshooting

### ❌ "Extractor não carregado"
**Solução**: Verificar que `initializeExtractor()` é chamada no boot

### ❌ "OpenRouter não configurado"
**Solução**: Adicionar `OPENROUTER_KEY` em `.env` e recarregar página

### ❌ "DOMParser error em Node.js"
**Solução**: Usar `extractWithAI()` apenas em browser ou usar API proxy

### ❌ "Cache crescendo infinitamente"
**Solução**: Verificar que `cleanupCache()` está sendo chamada

### ❌ "Listeners vazando memória"
**Solução**: Chamar `cleanupSubscriptions()` no beforeunload

---

## 🔟 Checklist de Deployment

Antes de enviar para produção:

- [ ] `.env` criado e preenchido
- [ ] `.env` não está versionado (no .gitignore)
- [ ] Chaves foram testadas e funcionam
- [ ] Console sem erros (F12 → Console)
- [ ] Login funciona (Google OAuth)
- [ ] Extração de eventos funciona
- [ ] Cache está sendo limpo (abrir DevTools → Storage)
- [ ] Listeners Supabase funcionam
- [ ] Mensagens de erro apropriadas

---

## 📞 Suporte

### Documentos relacionados
- `CORREÇÕES_IMPLEMENTADAS.md` - Detalhes de todas as correções
- `ANALISE_ERROS_DETALHADA.md` - Análise completa de problemas
- `.env.example` - Template de variáveis

### Git
```bash
# Ver branch de correções
git branch -a | grep fix/

# Ver commits
git log --oneline | head -5

# Ver mudanças
git diff main..fix/critical-bugs-and-security
```

---

**Última atualização**: 2024
**Versão**: 5.0
**Status**: ✅ Pronto para produção
