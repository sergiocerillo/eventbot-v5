# 🚀 Como Usar o Novo Dashboard - EventBot v5.0

## 🎯 Início Rápido

### 1. Abrir o Dashboard
```bash
# Opção 1: Abrir diretamente no navegador
open index.html

# Opção 2: Usar um servidor local (recomendado)
python -m http.server 8000
# Então acesse: http://localhost:8000
```

### 2. Interface Inicial
- **Topbar**: Logo + Navegação + Status
- **Home Tab**: Dashboard com eventos
- **Venues Tab**: Lista de locais
- **Artists Tab**: Artistas e contagem
- **Chatbot**: Widget no canto inferior direito

---

## 📊 Dashboard Home

### Stats (Resumo)
Exibe 4 cards com informações:
- **Eventos**: Número total de eventos cadastrados
- **Locais**: Número de venues disponíveis (24 padrão)
- **Artistas**: Número de artistas únicos
- **Próximo**: Data do próximo evento

### Events Grid
Grid responsivo com cards de eventos:
- Mostra todos os eventos cadastrados
- Cada card contém:
  - Título do evento
  - Data formatada
  - Local
  - Horários (múltiplos)
  - Link de ingressos (se houver)
  - Descrição (se houver)
  - Botões: Editar / Deletar

### Como Adicionar Eventos
1. Use o **chatbot** no canto direito
2. Escreva mensagens como:
   - "Novo evento"
   - "Criar show"
   - "Adicionar banda"
3. Siga as instruções do bot

---

## 📍 Venues Tab

### Visualização de Locais
- Grid com cards de locais
- Cada card mostra:
  - Nome do local
  - Endereço completo
  - Ícone de localização

### Locais Padrão (24 total)
```
- Allianz Parque
- Audio
- Autódromo de Interlagos
- Burning House
- Carioca Club Pinheiros
- ... (19 mais)
```

### Adicionar Novo Local
1. Abra o chatbot
2. Pergunte: "Adicionar local"
3. Forneça nome e endereço

---

## 🎤 Artists Tab

### Artistas / Bandas
- Grid com cards de artistas
- Cada card mostra:
  - Ícone de artista (🎤)
  - Nome do artista
  - Contagem de eventos

### Contagem Automática
- Sistema conta automaticamente eventos por artista
- Atualiza em tempo real ao adicionar eventos

---

## 💬 Chatbot Flutuante

### Como Usar
1. **Widget no canto direito** (bottom-right)
2. **Escreva uma mensagem** no input
3. **Pressione Enter** ou clique em ➤

### Comandos Disponíveis

#### Criar Evento
```
"novo evento"
"criar show"
"adicionar evento"
```
Resposta: Instruções para criar novo evento

#### Ver Eventos
```
"quantos eventos?"
"eventos"
"meus eventos"
```
Resposta: Total de eventos cadastrados

#### Explorar Locais
```
"locais"
"venues"
"quantos locais?"
```
Resposta: Total de venues disponíveis

#### Ver Artistas
```
"artistas"
"bandas"
"quantas bandas?"
```
Resposta: Total de artistas únicos

### Minimizar Chatbot
- Clique no botão ✕ (canto superior direito do chat)
- Chat volta a aparecer na próxima vez

---

## 🎨 Temas e Aparência

### Alternar Tema
1. Clique no botão **☀ ou 🌙** no topbar
2. Interface alterna entre modo claro/escuro

### Temas Disponíveis
- **Default**: Marrom escuro (padrão)
- **Ocean**: Azul claro
- **Forest**: Verde
- **Sunset**: Laranja/Vermelho
- **Light**: Modo claro

### Como Mudar Tema (Futuro)
```javascript
// No console do navegador:
document.body.className = 'theme-ocean';
// Opções: theme-ocean, theme-forest, theme-sunset, light-mode
```

---

## 💾 Persistência de Dados

### LocalStorage
- Todos os eventos são salvos automaticamente
- Dados persistem ao recarregar a página
- Armazenado em `eventbot_events`

### Como Visualizar Dados
```javascript
// No console do navegador (F12):

// Ver eventos
JSON.parse(localStorage.getItem('eventbot_events'))

// Ver configuração
JSON.parse(localStorage.getItem('eventbot_config'))

// Limpar tudo
localStorage.clear()
```

### Estrutura de Evento
```javascript
{
  id: "2024-11-15",
  title: "Show da Banda X",
  date: "2024-11-15",
  times: ["19:00", "20:00"],
  venue: "Audio",
  venue_addr: "Av. Francisco Matarazzo, 694",
  ticketLink: "https://...",
  desc: "Show imperdível",
  price: "R$ 50",
  platform: "manual"
}
```

---

## 📱 Responsividade

### Desktop (1024px+)
- Layout completo
- Grid com múltiplas colunas
- Chatbot fixo no canto direito

### Tablet (768px - 1024px)
- Ajustado para tela média
- Grid com 2 colunas
- Chatbot ainda visível

### Mobile (<768px)
- Layout em coluna única
- Grid responsivo
- Chatbot em fullscreen

---

## ⚙️ Configurações (Futuro)

### Botão Settings
Clique em **⚙️** no topbar para:
- Configurar temas
- Adicionar API keys
- Gerenciar dados

### Arquivos de Config
```javascript
// config.js
{
  clientId: "",           // Google OAuth
  apiKey: "",            // Google API
  calendarId: "",        // Google Calendar
  openRouterKey: "",     // IA
  serviceAccount: null   // Supabase
}
```

---

## 🔧 Editando Eventos

### Botão Editar (Futuro)
1. Clique no botão **Editar** em um event card
2. Atualize os campos
3. Salve as mudanças

### Deletar Evento
1. Clique no botão **Deletar** em um event card
2. Confirme a ação
3. Evento será removido

---

## 🎬 Demo Completa

### Cenário 1: Adicionar Evento
```
1. Abra o dashboard
2. Clique no chatbot
3. Escreva: "novo evento"
4. Bot explica como criar
5. Adicione: Show do Post Malone - 15/nov - Audio - 19:00
6. Evento aparece na home
```

### Cenário 2: Explorar Dados
```
1. Vá para "Venues" → Veja 24 locais
2. Vá para "Artists" → Veja contagem de artistas
3. Volte para "Home" → Veja stats atualizadas
```

### Cenário 3: Gerenciar Tema
```
1. Clique em ☀️ no topbar
2. Interface fica em modo claro
3. Clique novamente em 🌙
4. Volta ao modo escuro
```

---

## 🐛 Troubleshooting

### Chatbot não funciona
- Verifique se JavaScript está ativado
- Recarregue a página (F5)
- Limpe o cache (Ctrl+Shift+Delete)

### Eventos não aparecem
- Verifique localStorage: `localStorage.getItem('eventbot_events')`
- Limpe dados: `localStorage.clear()`
- Recarregue a página

### Chatbot não está visível
- Scroll para baixo na página
- Verifique se há muitos elementos na página
- Abra DevTools (F12) e procure por `.chatbot-floating`

### Tema não salva
- Tema é salvo em localStorage automaticamente
- Se não funcionar: `localStorage.setItem('theme', 'dark')`

---

## 📚 Documentação Adicional

- **DASHBOARD_REDESIGN.md** - Detalhes técnicos do design
- **CORREÇÕES_IMPLEMENTADAS.md** - Melhorias anteriores
- **SETUP_GUIA.md** - Configuração de variáveis de ambiente

---

## 🚀 Próximas Funcionalidades

### Curto Prazo (Sprint 1)
- [ ] Edição de eventos
- [ ] Filtros de busca
- [ ] Integração com Google Calendar
- [ ] Exportar eventos

### Médio Prazo (Sprint 2)
- [ ] Supabase sync em tempo real
- [ ] Notificações de eventos
- [ ] Integração com IA para extração
- [ ] Dark/Light theme persistente

### Longo Prazo (Sprint 3)
- [ ] Aplicativo mobile
- [ ] Offline mode
- [ ] Integração com redes sociais
- [ ] Analytics e insights

---

## 💡 Dicas e Truques

### Atalho de Teclado
```
Enter: Enviar mensagem no chat
F12: Abrir DevTools (para debug)
Ctrl+L: Selecionar barra de endereço
```

### Comandos do Console
```javascript
// Ver todos os eventos
window.events

// Ver todas as venues
window.venues

// Ver artistas
window.artists

// Renderizar novamente
window.renderDashboard()

// Enviar mensagem do chatbot
window.chatMessage('bot', 'Olá!')
```

### Editar Estilos CSS
```javascript
// No console:
document.querySelector(':root').style.setProperty('--brown', '#FF0000');
// Isso muda a cor de accent para vermelho
```

---

## 📞 Suporte

### Documentação
- Ver arquivo `DASHBOARD_REDESIGN.md`
- Ver arquivo `SETUP_GUIA.md`

### GitHub
- Branch: `feat/dashboard-redesign`
- PR: https://github.com/sergiocerillo/eventbot-v5/pull/new/feat/dashboard-redesign

### Issues
- Abra uma issue no GitHub com detalhes do problema
- Include screenshot ou console error

---

**Aproveite o novo dashboard! 🎉**

Para perguntas, use o chatbot ou consulte a documentação.
