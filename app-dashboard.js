// ════════════════════════════════════════════════════════════════
// EventBot Dashboard v5.0
// Sistema de Gerenciamento de Eventos com Dashboard Home
// ════════════════════════════════════════════════════════════════

// ── STATE ──
let events = [];
let venues = [];
let artists = {};
let darkMode = true;
let currentTab = 'home';

// ── INIT ──
window.addEventListener('load', async () => {
  loadConfig();
  loadEvents();
  loadVenues();
  initTheme();
  setupNavigation();
  setupChatbot();
  renderDashboard();
  welcome();
});

// ── CONFIG ──
function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem('eventbot_config') || '{}');
    Object.assign(cfg, saved);
  } catch (e) {}
}

let cfg = {
  clientId: '',
  apiKey: '',
  calendarId: '',
  openRouterKey: '',
  serviceAccount: null,
};

// ── THEME ──
function initTheme() {
  const saved = localStorage.getItem('theme');
  darkMode = saved !== 'light';
  applyTheme();
}

function applyTheme() {
  if (!darkMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = darkMode ? '☀' : '🌙';
}

function toggleTheme() {
  darkMode = !darkMode;
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  applyTheme();
}

// ── DATA LOADING ──
function loadEvents() {
  try {
    const saved = localStorage.getItem('eventbot_events');
    events = saved ? JSON.parse(saved) : [];
  } catch (e) {
    events = [];
  }
  
  // Extrair artistas dos eventos
  extractArtists();
}

function loadVenues() {
  try {
    const saved = localStorage.getItem('eventbot_venues');
    venues = saved ? JSON.parse(saved) : getDefaultVenues();
  } catch (e) {
    venues = getDefaultVenues();
  }
}

function getDefaultVenues() {
  return [
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
}

function extractArtists() {
  artists = {};
  events.forEach(ev => {
    const title = (ev.title || 'Sem artista').toLowerCase();
    artists[title] = (artists[title] || 0) + 1;
  });
}

// ── NAVIGATION ──
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });

  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-settings')?.addEventListener('click', openSettings);
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update active tab button
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Hide all tabs
  document.getElementById('home-tab')?.classList.add('hidden');
  document.getElementById('venues-tab')?.classList.add('hidden');
  document.getElementById('artists-tab')?.classList.add('hidden');
  
  // Show selected tab
  const tabEl = document.getElementById(`${tabName}-tab`);
  if (tabEl) {
    tabEl.classList.remove('hidden');
    renderTab(tabName);
  }
}

function renderTab(tabName) {
  if (tabName === 'venues') {
    renderVenues();
  } else if (tabName === 'artists') {
    renderArtists();
  }
}

// ── RENDERING ──
function renderDashboard() {
  renderStats();
  renderEvents();
  renderVenues();
}

function renderStats() {
  document.getElementById('stat-events').textContent = events.length;
  document.getElementById('stat-venues').textContent = venues.length;
  document.getElementById('stat-artists').textContent = Object.keys(artists).length;
  
  // Next event
  const nextEvent = getNextEvent();
  if (nextEvent) {
    const date = new Date(nextEvent.date);
    document.getElementById('stat-next').textContent = date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  }
}

function getNextEvent() {
  const now = new Date();
  const upcoming = events.filter(ev => new Date(ev.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  return upcoming[0];
}

function renderEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (events.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--sage); padding: 40px; font-style: italic;">Nenhum evento cadastrado. Use o chatbot para criar eventos!</div>';
    return;
  }
  
  events.forEach(ev => {
    const card = createEventCard(ev);
    grid.appendChild(card);
  });
}

function createEventCard(ev) {
  const card = document.createElement('div');
  card.className = 'event-card';
  
  const times = Array.isArray(ev.times) ? ev.times : (ev.time_start ? JSON.parse(ev.time_start) : ['19:00']);
  
  card.innerHTML = `
    <div class="event-card-header">
      <div class="event-title">${ev.title || 'Sem título'}</div>
      <span class="event-date">${formatDate(ev.date)}</span>
    </div>
    <div class="event-card-body">
      <div class="event-row">
        <span class="event-label">📍 Local</span>
        <span class="event-value">${ev.venue || 'Sem local'}</span>
      </div>
      <div class="event-row">
        <span class="event-label">🕐 Horário</span>
        <div class="time-slots">
          ${times.map(t => `<span class="time-slot">${t}</span>`).join('')}
        </div>
      </div>
      ${ev.ticketLink ? `
        <div class="event-row">
          <span class="event-label">🎫 Link</span>
          <span class="event-value"><a href="${ev.ticketLink}" target="_blank" style="color: var(--bl);">Ver ingressos</a></span>
        </div>
      ` : ''}
      ${ev.desc ? `
        <div class="event-row">
          <span class="event-label">📝 Desc</span>
          <span class="event-value">${ev.desc}</span>
        </div>
      ` : ''}
    </div>
    <div class="event-card-footer">
      <button class="btn-small" onclick="editEvent('${ev.id || ev.date}')">Editar</button>
      <button class="btn-small" onclick="deleteEvent('${ev.id || ev.date}')">Deletar</button>
    </div>
  `;
  
  return card;
}

function renderVenues() {
  const grid = document.getElementById('venues-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  venues.forEach(venue => {
    const card = document.createElement('div');
    card.className = 'venue-card';
    card.innerHTML = `
      <div class="venue-name">${venue.name}</div>
      <div class="venue-address">📍 ${venue.addr}</div>
    `;
    grid.appendChild(card);
  });
}

function renderArtists() {
  const grid = document.getElementById('artists-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  const sortedArtists = Object.entries(artists).sort((a, b) => b[1] - a[1]);
  
  sortedArtists.forEach(([name, count]) => {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.innerHTML = `
      <div class="artist-icon">🎤</div>
      <div class="artist-name">${name}</div>
      <div class="artist-count">${count} ${count === 1 ? 'evento' : 'eventos'}</div>
    `;
    grid.appendChild(card);
  });
}

// ── EVENT ACTIONS ──
function editEvent(eventId) {
  alert('Edição de eventos será implementada em breve');
}

function deleteEvent(eventId) {
  if (confirm('Tem certeza que deseja deletar este evento?')) {
    events = events.filter(ev => (ev.id || ev.date) !== eventId);
    localStorage.setItem('eventbot_events', JSON.stringify(events));
    renderDashboard();
    chatMessage('bot', '✅ Evento deletado com sucesso!');
  }
}

// ── CHATBOT ──
function setupChatbot() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send');
  const closeBtn = document.getElementById('btn-chat-close');
  
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }
  
  if (sendBtn) sendBtn.addEventListener('click', sendChat);
  if (closeBtn) closeBtn.addEventListener('click', minimizeChat);
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = (input?.value || '').trim();
  if (!msg) return;
  
  chatMessage('user', msg);
  input.value = '';
  
  // Simple chatbot responses
  setTimeout(() => {
    if (msg.toLowerCase().includes('novo evento') || msg.toLowerCase().includes('criar')) {
      chatMessage('bot', 'Para criar um novo evento, descreva:\n📝 Nome do evento\n📍 Local\n📅 Data\n🕐 Horário(s)\n🎫 Link de ingressos (opcional)');
    } else if (msg.toLowerCase().includes('eventos')) {
      chatMessage('bot', `📊 Você tem ${events.length} eventos cadastrados. Use a aba "Home" para ver todos os detalhes!`);
    } else if (msg.toLowerCase().includes('locais')) {
      chatMessage('bot', `🗺️ Temos ${venues.length} locais cadastrados. Veja na aba "Locais"!`);
    } else if (msg.toLowerCase().includes('artista') || msg.toLowerCase().includes('banda')) {
      chatMessage('bot', `🎤 ${Object.keys(artists).length} artistas diferentes nos seus eventos!`);
    } else {
      chatMessage('bot', 'Desculpe, ainda não entendo bem esse comando. Tente perguntar sobre eventos, locais ou bandas!');
    }
  }, 500);
}

function chatMessage(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${role}`;
  msgEl.innerHTML = `
    <div class="chat-avatar">${role === 'bot' ? '🤖' : '👤'}</div>
    <div class="chat-bubble">${text}</div>
  `;
  
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function minimizeChat() {
  const chatbot = document.getElementById('chatbot');
  if (chatbot) {
    chatbot.style.display = 'none';
  }
}

function toggleChat() {
  const chatbot = document.getElementById('chatbot');
  if (chatbot) {
    chatbot.style.display = chatbot.style.display === 'none' ? 'flex' : 'none';
  }
}

// ── SETTINGS ──
function openSettings() {
  alert('Configurações:\n\nConfig Theme, API Keys, etc será implementado em breve!');
}

// ── WELCOME ──
function welcome() {
  chatMessage('bot', `👋 Bem-vindo ao EventBot!\n\nUse o chat para:\n✨ Criar novos eventos\n📊 Ver estatísticas\n🎤 Gerenciar artistas\n📍 Explorar locais`);
}

// ── UTILITIES ──
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  } catch (e) {
    return dateStr;
  }
}

// ── EXPORT ──
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.toggleChat = toggleChat;
window.sendChat = sendChat;
window.toggleTheme = toggleTheme;
