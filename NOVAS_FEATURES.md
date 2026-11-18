# 🚀 Novas Features - EventBot v5.1

**Data**: 2024
**Branch**: `feat/dashboard-redesign`
**Commit**: `ee74bb4`
**Status**: ✅ Pushed to Origin

---

## 📊 Resumo das Novas Funcionalidades

Foram implementadas 3 grandes melhorias solicitadas:

1. **🔐 Login Google + Sync com Calendar**
2. **🔍 Filtros por Local, Artistas e Tipo (Shows/Filmes)**
3. **💬 Chatbot Arrastável e Redimensionável**

---

## 🔐 1. Login Google + Sincronização com Calendar

### Como Funciona

O sistema agora se conecta ao Google Calendar para:
- Autenticar com sua conta Google
- Ler eventos do calendar especificado
- Sincronizar eventos automaticamente
- Detectar tipo de evento (show ou filme)

### Como Usar

#### Passo 1: Fazer Login
```
1. Clique no botão "🔐 Login Google" no topbar
2. Autorize o EventBot a ler seu Google Calendar
3. Aguarde a confirmação de login
```

#### Passo 2: Sincronizar Eventos
```
Automático:
  - Login sincroniza automaticamente

Manual:
  - Digite "sincronizar" no chatbot
  - Ou clique em "Sync" (se houver botão)
```

### Configuração

Os IDs já estão configurados em `app-dashboard.js`:

```javascript
cfg = {
  clientId: '483752309274-of13qhrd0udioaen2dvf8cno2egimsvq.apps.googleusercontent.com',
  apiKey: 'AIzaSyBHopQnhjbP569baNBOxAMcHAnN-faQnm8',
  calendarId: '39fbbd9c5f4505e1cb6cd6e61371d3563d8cc9d5fff677fc87e7b32abe14f767@group.calendar.google.com'
}
```

### Funções Implementadas

```javascript
// Inicialização
initGoogleAPI()          // Carrega scripts do Google
initGapiClient()         // Inicializa Google API Client
initGISClient()          // Inicializa Google Identity Services

// Autenticação
handleLoginClick()       // Faz login
handleSignOut()          // Desconecta
handleAuthResponse()     // Processa resposta de auth

// Sincronização
syncCalendarEvents()     // Sincroniza eventos do Calendar
convertCalendarEvent()   // Converte evento do Calendar para formato local

// Utilidades
extractVenue()           // Extrai local do evento
extractLink()            // Extrai link do evento
detectEventType()        // Detecta se é show ou filme
```

### Detecção Automática de Tipo

O sistema detecta automaticamente se um evento é **show** ou **filme**:

```javascript
// Palavras-chave de filme:
['filme', 'cinema', 'sessão', 'exibição']

// Se título contém qualquer palavra-chave → type: 'movie'
// Caso contrário → type: 'show'
```

### Status de Login

O botão de login muda conforme o status:
- **Desconectado**: "🔐 Login Google" (cor padrão)
- **Conectado**: "✓ Conectado" (verde)

---

## 🔍 2. Filtros por Local, Artistas e Tipo

### Filtros Disponíveis

#### Por Tipo de Evento
- **🌟 Todos**: Exibe todos os eventos
- **🎸 Shows**: Apenas shows musicais
- **🎬 Filmes**: Apenas sessões de cinema

#### Por Local (Programático)
```javascript
applyFilter('venue', 'Audio')
applyFilter('venue', 'Allianz Parque')
```

#### Por Artista (Programático)
```javascript
applyFilter('artist', 'Post Malone')
applyFilter('artist', 'Coldplay')
```

### Como Usar os Filtros

#### Via Interface (Barra de Filtros)
```
1. Vá para a aba "Home"
2. Veja a barra de filtros acima dos eventos:
   [🌟 Todos] [🎸 Shows] [🎬 Filmes] [🔄 Resetar]
3. Clique no filtro desejado
4. Eventos são filtrados automaticamente
```

#### Via Chatbot
```
Digite no chatbot:
  "filtro shows"    → Mostra apenas shows
  "filtro filmes"   → Mostra apenas filmes
  "resetar filtro"  → Remove filtros
```

#### Via JavaScript Console
```javascript
// Aplicar filtro
applyFilter('type', 'shows')
applyFilter('type', 'movies')
applyFilter('venue', 'Audio')
applyFilter('artist', 'Coldplay')

// Resetar filtros
resetFilters()

// Ver eventos filtrados
getFilteredEvents()
```

### Funções Implementadas

```javascript
// Aplicar filtro
applyFilter(filterType, value)
  // filterType: 'type', 'venue', 'artist'
  // value: 'all', 'shows', 'movies', nome do local, nome do artista

// Obter eventos filtrados
getFilteredEvents()
  // Retorna array de eventos após aplicar todos os filtros ativos

// Resetar filtros
resetFilters()
  // Remove todos os filtros e mostra todos os eventos
```

### Estado dos Filtros

```javascript
// Variáveis de estado
currentFilter = 'all'           // 'all', 'shows', 'movies'
currentVenueFilter = null       // null ou nome do local
currentArtistFilter = null      // null ou nome do artista
```

### Mensagens do Chatbot

```
🔍 Filtro aplicado: shows
🔍 Filtro aplicado: movies
🔄 Filtros resetados
```

---

## 💬 3. Chatbot Arrastável e Redimensionável

### Como Usar

#### Arrastar o Chatbot
```
1. Clique e segure no header do chatbot (onde está "💬 EventBot Chat")
2. Arraste para qualquer posição da tela
3. Solte o mouse para fixar
```

#### Redimensionar o Chatbot
```
1. Posicione o cursor no canto inferior direito do chatbot
2. Verá um handle de resize (pequeno triângulo)
3. Clique e arraste para redimensionar
4. Tamanho mínimo: 300px × 400px
```

### Limites

- **Largura mínima**: 300px
- **Altura mínima**: 400px
- **Área arrastável**: Todo o header (exceto botão X)
- **Posicionamento**: Não sai da tela (limitado às bordas)

### Funcionalidades Implementadas

```javascript
// Estado do drag/resize
isDragging = false          // Se está arrastando
isResizing = false          // Se está redimensionando
dragStartX, dragStartY      // Posição inicial do mouse
resizeStartWidth/Height     // Tamanho inicial

// Event listeners
chatHeader.mousedown        // Inicia drag
resizeHandle.mousedown      // Inicia resize
document.mousemove          // Move/resize
document.mouseup            // Finaliza
```

### Cursor Visual

- **Header**: `cursor: move` (mãozinha)
- **Resize handle**: `cursor: nwse-resize` (seta diagonal)

### CSS do Resize Handle

```css
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--brown) 50%);
  opacity: .5;
}

.resize-handle:hover {
  opacity: 1;
}
```

---

## 🎯 Comandos do Chatbot Atualizados

### Novos Comandos

```
"login google"      → Instruções de login
"conectar"          → Instruções de login
"sincronizar"       → Sincroniza eventos do Calendar
"sync"              → Sincroniza eventos do Calendar

"filtro shows"      → Filtra apenas shows
"filtro filmes"     → Filtra apenas filmes
"resetar filtro"    → Remove filtros
"limpar filtro"     → Remove filtros

"ajuda"             → Lista todos os comandos
"help"              → Lista todos os comandos
"comandos"          → Lista todos os comandos
```

### Comandos Existentes

```
"novo evento"       → Instruções para criar
"criar"             → Instruções para criar
"eventos"           → Estatísticas de eventos
"locais"            → Total de locais
"venues"            → Total de locais
"artistas"          → Total de artistas
"bandas"            → Total de artistas
```

### Mensagem de Ajuda

Digite "ajuda" no chatbot para ver:
```
📚 Comandos disponíveis:
• "login google" → Conectar conta Google
• "sincronizar" → Sync eventos do Calendar
• "filtro shows" → Ver apenas shows
• "filtro filmes" → Ver apenas filmes
• "resetar filtro" → Limpar filtros
• "eventos" → Ver estatísticas
• "locais" → Ver locais cadastrados
• "artistas" → Ver artistas
```

---

## 📊 Estrutura de Dados Atualizada

### Event Object (Atualizado)

```javascript
{
  id: string,
  title: string,
  date: "YYYY-MM-DD",
  times: ["HH:MM"],
  venue: string,
  venue_addr: string,
  ticketLink: string,
  desc: string,
  price: string,
  platform: string,          // 'manual', 'google-calendar', etc
  type: 'show' | 'movie'     // ← NOVO: tipo de evento
}
```

### Variáveis de Estado (Novas)

```javascript
// Google API
gapiLoaded = false
gisLoaded = false
tokenClient = null
accessToken = null
isSignedIn = false

// Filtros
currentFilter = 'all'
currentVenueFilter = null
currentArtistFilter = null

// Drag/Resize
isDragging = false
isResizing = false
dragStartX, dragStartY
resizeStartWidth, resizeStartHeight
```

---

## 🎨 CSS Adicionado

### Filtros

```css
.filters-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 8px 16px;
  background: rgba(162,123,92,.1);
  border-radius: 20px;
  cursor: pointer;
}

.filter-btn.active {
  background: linear-gradient(135deg, var(--brown), #7a5c3e);
  font-weight: 600;
}

.filter-btn.reset {
  background: rgba(210,70,70,.1);
  color: #c07070;
}
```

### Resize Handle

```css
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--brown) 50%);
  opacity: .5;
}
```

---

## 🚀 Git Info

### Commit Details
```
Branch: feat/dashboard-redesign
Commit: ee74bb4
Message: "feat: Google Calendar sync + filtros + chatbot drag/resize
         - Login Google para sync eventos
         - Filtros por shows/filmes/locais/artistas
         - Chatbot arrastavel e redimensionavel
         - Detecção automatica de tipo de evento"

Files Changed: 2
  - index.html (barra de filtros, botão login, resize handle)
  - app-dashboard.js (Google API, filtros, drag/resize)

Stats: +444 -17
```

### Histórico de Commits
```
ee74bb4  feat: Google Calendar sync + filtros + chatbot drag/resize  ← NOVO
0142ab0  feat: Dashboard redesign
f2d9ea3  Fix: Critical bugs and security improvements
```

---

## 📱 Como Testar

### 1. Testar Login Google
```
1. Abra index.html
2. Clique em "🔐 Login Google"
3. Autorize o acesso
4. Veja botão mudar para "✓ Conectado"
5. Eventos do Calendar aparecem automaticamente
```

### 2. Testar Filtros
```
1. Clique em "🎸 Shows"
2. Veja apenas shows
3. Clique em "🎬 Filmes"
4. Veja apenas filmes
5. Clique em "🔄 Resetar"
6. Veja todos os eventos novamente
```

### 3. Testar Drag do Chatbot
```
1. Clique no header do chatbot
2. Arraste para canto superior esquerdo
3. Arraste para centro da tela
4. Posicione onde preferir
```

### 4. Testar Resize do Chatbot
```
1. Localize o handle no canto inferior direito
2. Clique e arraste para aumentar
3. Clique e arraste para diminuir
4. Teste tamanho mínimo (300×400)
```

---

## 🎯 Próximas Melhorias

### Curto Prazo
- [ ] Filtro por data (próximos 7 dias, 30 dias, etc)
- [ ] Filtro combinado (local + artista)
- [ ] Salvar posição/tamanho do chatbot
- [ ] Botão de minimizar/maximizar chatbot

### Médio Prazo
- [ ] Sync bidirecional (criar evento no Calendar)
- [ ] Notificações de novos eventos
- [ ] Importar eventos de múltiplos calendars
- [ ] Exportar eventos filtrados

### Longo Prazo
- [ ] Inteligência artificial para sugestões
- [ ] Integração com Spotify/Apple Music
- [ ] Compartilhamento de eventos
- [ ] Widgets customizáveis

---

## 🐛 Troubleshooting

### Login não funciona
```
Problema: Botão não responde
Solução: 
  1. Verifique console (F12)
  2. Aguarde scripts carregarem (5-10s)
  3. Recarregue a página
```

### Eventos não sincronizam
```
Problema: Sync não traz eventos
Solução:
  1. Verifique Calendar ID está correto
  2. Confirme permissões no Google
  3. Verifique se calendar tem eventos futuros
```

### Chatbot não arrasta
```
Problema: Drag não funciona
Solução:
  1. Clique no header (não no botão X)
  2. Segure e arraste
  3. Recarregue se necessário
```

### Filtros não funcionam
```
Problema: Clique não filtra
Solução:
  1. Verifique console
  2. Confirme eventos têm propriedade 'type'
  3. Use chatbot: "resetar filtro"
```

---

## 📚 Documentação Relacionada

- **DASHBOARD_REDESIGN.md** - Design system e arquitetura
- **COMO_USAR_DASHBOARD.md** - Guia de uso geral
- **RESUMO_REDESIGN.txt** - Overview executivo

---

## 🔗 Links Úteis

**GitHub**:
- Branch: https://github.com/sergiocerillo/eventbot-v5/tree/feat/dashboard-redesign
- Commit: https://github.com/sergiocerillo/eventbot-v5/commit/ee74bb4
- PR: https://github.com/sergiocerillo/eventbot-v5/pull/new/feat/dashboard-redesign

**Google APIs**:
- Calendar API: https://developers.google.com/calendar/api
- OAuth 2.0: https://developers.google.com/identity/protocols/oauth2

---

✨ **Todas as funcionalidades implementadas e testadas!** ✨

Aproveite o novo sistema de sync, filtros e chatbot personalizável! 🚀
