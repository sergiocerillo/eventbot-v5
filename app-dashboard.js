// ════════════════════════════════════════════════════════════════
// EventBot Dashboard v5.1
// Sistema de Gerenciamento de Eventos com Google Calendar Sync
// ════════════════════════════════════════════════════════════════

// ── GLOBAL STATE ──
let events = [];
let venues = [];
let artists = {};
let darkMode = true;
let currentTab = 'home';
let currentFilter = 'all';
let currentVenueFilter = null;
let currentArtistFilter = null;

// Google API State
let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;

// Chatbot drag/resize state
let isDragging = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;

// ── CONFIG ──
const cfg = {
  clientId: '483752309274-of13qhrd0udioaen2dvf8cno2egimsvq.apps.googleusercontent.com',
  apiKey: 'AIzaSyBHopQnhjbP569baNBOxAMcHAnN-faQnm8',
  calendarId: '39fbbd9c5f4505e1cb6cd6e61371d3563d8cc9d5fff677fc87e7b32abe14f767@group.calendar.google.com',
};

// ── INITIALIZATION ──
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Iniciando EventBot Dashboard...');
  
  loadData();
  initTheme();
  setupNavigation();
  setupChatbot();
  setupFilterButtons();
  renderDashboard();
  
  // Initialize Google API
  await initGoogleAPI();
  
  // Welcome message
  setTimeout(() => {
    chatMessage('bot', '👋 Bem-vindo ao EventBot! Digite "ajuda" para ver os comandos disponíveis.');
  }, 500);
});

// ── DATA MANAGEMENT ──
function loadData() {
  // Load events
  try {
    const saved = localStorage.getItem('eventbot_events');
    events = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Erro ao carregar eventos:', e);
    events = [];
  }
  
  // Load venues
  try {
    const saved = localStorage.getItem('eventbot_venues');
    venues = saved ? JSON.parse(saved) : getDefaultVenues();
  } catch (e) {
    venues = getDefaultVenues();
  }
  
  // Extract artists
  extractArtists();
  
  console.log(`📊 Dados carregados: ${events.length} eventos, ${venues.length} locais`);
}

function saveEvents() {
  try {
    localStorage.setItem('eventbot_events', JSON.stringify(events));
  } catch (e) {
    console.error('Erro ao salvar eventos:', e);
  }
}

function extractArtists() {
  artists = {};
  events.forEach(ev => {
    const title = (ev.title || 'Sem nome').trim();
    if (title) {
      artists[title] = (artists[title] || 0) + 1;
    }
  });
}

function getDefaultVenues() {
  return [
    {name:'Allianz Parque',addr:'Av. Francisco Matarazzo, 1705 - Água Branca, São Paulo - SP'},
    {name:'Audio',addr:'Av. Francisco Matarazzo, 694 - Barra Funda, São Paulo - SP'},
    {name:'Autódromo de Interlagos',addr:'Av. Sen. Teotonio Vilela, 261 - Jardim Malia I, São Paulo - SP'},
    {name:'Burning House',addr:'Av. Santa Marina, 247 - Água Branca, São Paulo - SP'},
    {name:'Carioca Club',addr:'Rua Cardeal Arcoverde, 2899 - Pinheiros, São Paulo - SP'},
    {name:'Cine Joia',addr:'Praça Carlos Gomes, 82 - Liberdade, São Paulo - SP'},
    {name:'Espaço Unimed',addr:'R. Tagipuru, 795 - Barra Funda, São Paulo - SP'},
    {name:'Tokio Marine Hall',addr:'R. Bragança Paulista, 1281 - Várzea de Baixo, São Paulo - SP'},
    {name:'Vibra São Paulo',addr:'Av. das Nações Unidas, 17955 - Vila Almeida, São Paulo - SP'},
  ];
}

// ── GOOGLE CALENDAR API ──
async function initGoogleAPI() {
  console.log('🔄 Carregando Google APIs...');
  updateLoginButton('loading');
  
  try {
    // Load GAPI
    await loadScript('https://apis.google.com/js/api.js');
    await new Promise((resolve) => gapi.load('client', resolve));
    await gapi.client.init({
      apiKey: cfg.apiKey,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    gapiInited = true;
    console.log('✅ GAPI inicializado');
    
    // Load GIS
    await loadScript('https://accounts.google.com/gsi/client');
    
    // Wait for google.accounts to be available
    let attempts = 0;
    while (!window.google?.accounts && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.google?.accounts) {
      throw new Error('google.accounts não carregou');
    }
    
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: cfg.clientId,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: handleAuthResponse,
    });
    gisInited = true;
    console.log('✅ GIS inicializado');
    
    updateLoginButton('ready');
    chatMessage('bot', '✅ Google API pronto! Clique em "Login Google" para conectar.');
  } catch (error) {
    console.error('❌ Erro ao inicializar Google API:', error);
    updateLoginButton('error');
    chatMessage('bot', `❌ Erro ao carregar Google API: ${error.message}`);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.head.appendChild(script);
  });
}

function updateLoginButton(state) {
  const btn = document.getElementById('btn-google-login');
  if (!btn) return;
  
  switch (state) {
    case 'loading':
      btn.textContent = '⏳ Carregando...';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      break;
    case 'ready':
      btn.textContent = '🔐 Login Google';
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.background = '';
      break;
    case 'connected':
      btn.textContent = '✓ Conectado';
      btn.disabled = false;
      btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
      break;
    case 'error':
      btn.textContent = '❌ Erro';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      break;
  }
}

function handleLoginClick() {
  if (!gapiInited || !gisInited) {
    chatMessage('bot', '⚠️ Google API ainda não está pronto. Aguarde alguns segundos.');
    return;
  }
  
  if (accessToken) {
    handleSignOut();
  } else {
    tokenClient.requestAccessToken();
  }
}

function handleAuthResponse(response) {
  if (response.error) {
    console.error('Erro de autenticação:', response.error);
    chatMessage('bot', `❌ Erro: ${response.error}`);
    return;
  }
  
  accessToken = response.access_token;
  updateLoginButton('connected');
  chatMessage('bot', '✅ Login realizado! Sincronizando eventos...');
  
  syncCalendarEvents();
}

function handleSignOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
  updateLoginButton('ready');
  chatMessage('bot', '👋 Desconectado do Google Calendar');
}

async function syncCalendarEvents() {
  if (!accessToken) {
    chatMessage('bot', '⚠️ Faça login primeiro');
    return;
  }
  
  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: cfg.calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const calendarEvents = response.result.items || [];
    
    if (calendarEvents.length === 0) {
      chatMessage('bot', '📅 Nenhum evento encontrado no calendário');
      return;
    }
    
    chatMessage('bot', `📅 ${calendarEvents.length} eventos encontrados. Importando...`);
    
    // Convert and merge events
    const newEvents = calendarEvents.map(convertCalendarEvent);
    
    // Add only new events (avoid duplicates)
    let addedCount = 0;
    newEvents.forEach(newEv => {
      const exists = events.some(ev => 
        ev.id === newEv.id || 
        (ev.title === newEv.title && ev.date === newEv.date)
      );
      if (!exists) {
        events.push(newEv);
        addedCount++;
      }
    });
    
    saveEvents();
    extractArtists();
    renderDashboard();
    
    chatMessage('bot', `✅ ${addedCount} novos eventos adicionados!`);
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    chatMessage('bot', `❌ Erro: ${error.message}`);
  }
}

function convertCalendarEvent(calEvent) {
  const startDate = calEvent.start?.dateTime || calEvent.start?.date;
  const date = startDate ? new Date(startDate) : new Date();
  
  return {
    id: calEvent.id,
    title: calEvent.summary || 'Sem título',
    date: date.toISOString().split('T')[0],
    times: [date.toTimeString().slice(0, 5)],
    venue: extractVenue(calEvent.location || calEvent.description || ''),
    venue_addr: calEvent.location || '',
    ticketLink: extractLink(calEvent.description || ''),
    desc: calEvent.description || '',
    type: detectEventType(calEvent.summary || ''),
    platform: 'google-calendar',
  };
}

function extractVenue(text) {
  const lowerText = text.toLowerCase();
  for (const venue of venues) {
    if (lowerText.includes(venue.name.toLowerCase())) {
      return venue.name;
    }
  }
  return 'Local não especificado';
}

function extractLink(text) {
  const match = text.match(/https?:\/\/[^\s<>"]+/);
  return match ? match[0] : '';
}

function detectEventType(title) {
  const movieKeywords = ['filme', 'cinema', 'sessão', 'exibição'];
  const lowerTitle = title.toLowerCase();
  return movieKeywords.some(kw => lowerTitle.includes(kw)) ? 'movie' : 'show';
}

// ── THEME ──
function initTheme() {
  const saved = localStorage.getItem('theme');
  darkMode = saved !== 'light';
  applyTheme();
}

function applyTheme() {
  document.body.classList.toggle('light-mode', !darkMode);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = darkMode ? '☀' : '🌙';
}

function toggleTheme() {
  darkMode = !darkMode;
  localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  applyTheme();
}

// ── FILTERS ──
function setupFilterButtons() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterType = btn.dataset.filter;
      
      if (filterType === 'reset') {
        resetFilters();
      } else {
        applyFilter('type', filterType);
      }
      
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      if (filterType !== 'reset') {
        btn.classList.add('active');
      } else {
        document.querySelector('[data-filter="all"]')?.classList.add('active');
      }
    });
  });
}

function applyFilter(filterType, value) {
  if (filterType === 'type') {
    currentFilter = value;
  } else if (filterType === 'venue') {
    currentVenueFilter = value;
  } else if (filterType === 'artist') {
    currentArtistFilter = value;
  }
  
  renderEvents();
}

function resetFilters() {
  currentFilter = 'all';
  currentVenueFilter = null;
  currentArtistFilter = null;
  renderEvents();
  chatMessage('bot', '� Filtros resetados');
}

function getFilteredEvents() {
  let filtered = [...events];
  
  if (currentFilter === 'shows') {
    filtered = filtered.filter(ev => ev.type !== 'movie');
  } else if (currentFilter === 'movies') {
    filtered = filtered.filter(ev => ev.type === 'movie');
  }
  
  if (currentVenueFilter) {
    filtered = filtered.filter(ev => ev.venue === currentVenueFilter);
  }
  
  if (currentArtistFilter) {
    filtered = filtered.filter(ev => ev.title === currentArtistFilter);
  }
  
  return filtered;
}

// ── NAVIGATION ──
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-google-login')?.addEventListener('click', handleLoginClick);
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Update buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Hide all content
  ['home-tab', 'venues-tab', 'artists-tab'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
  
  // Show selected content
  const tab = document.getElementById(`${tabName}-tab`);
  if (tab) {
    tab.classList.remove('hidden');
    
    // Render specific tab content
    if (tabName === 'venues') renderVenues();
    if (tabName === 'artists') renderArtists();
  }
}

// ── RENDERING ──
function renderDashboard() {
  renderStats();
  renderEvents();
  renderVenues();
  renderArtists();
}

function renderStats() {
  const statEls = {
    events: document.getElementById('stat-events'),
    venues: document.getElementById('stat-venues'),
    artists: document.getElementById('stat-artists'),
    next: document.getElementById('stat-next'),
  };
  
  if (statEls.events) statEls.events.textContent = events.length;
  if (statEls.venues) statEls.venues.textContent = venues.length;
  if (statEls.artists) statEls.artists.textContent = Object.keys(artists).length;
  
  if (statEls.next) {
    const nextEvent = getNextEvent();
    if (nextEvent) {
      const date = new Date(nextEvent.date);
      statEls.next.textContent = date.toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      statEls.next.textContent = '—';
    }
  }
}

function getNextEvent() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return events
    .filter(ev => new Date(ev.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
}

function renderEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  
  const filtered = getFilteredEvents();
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">📅</div>
        <div style="color: var(--sage); font-size: 16px;">
          ${events.length === 0 ? 'Nenhum evento cadastrado' : 'Nenhum evento encontrado com os filtros aplicados'}
        </div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  filtered.forEach(ev => {
    grid.appendChild(createEventCard(ev));
  });
}

function createEventCard(ev) {
  const card = document.createElement('div');
  card.className = 'event-card';
  
  const times = Array.isArray(ev.times) ? ev.times : ['19:00'];
  const date = formatDate(ev.date);
  
  card.innerHTML = `
    <div class="event-card-header">
      <div class="event-title">${escapeHtml(ev.title || 'Sem título')}</div>
      <span class="event-date">${date}</span>
    </div>
    <div class="event-card-body">
      <div class="event-row">
        <span class="event-label">📍 Local</span>
        <span class="event-value">${escapeHtml(ev.venue || 'Sem local')}</span>
      </div>
      <div class="event-row">
        <span class="event-label">🕐 Horário</span>
        <div class="time-slots">
          ${times.map(t => `<span class="time-slot">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
      ${ev.ticketLink ? `
        <div class="event-row">
          <span class="event-label">🎫 Ingressos</span>
          <span class="event-value">
            <a href="${escapeHtml(ev.ticketLink)}" target="_blank" rel="noopener" style="color: var(--bl);">
              Ver ingressos
            </a>
          </span>
        </div>
      ` : ''}
    </div>
    <div class="event-card-footer">
      <button class="btn-small" onclick="deleteEvent('${escapeHtml(ev.id || ev.date)}')">🗑️ Deletar</button>
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
      <div class="venue-name">${escapeHtml(venue.name)}</div>
      <div class="venue-address">📍 ${escapeHtml(venue.addr)}</div>
    `;
    grid.appendChild(card);
  });
}

function renderArtists() {
  const grid = document.getElementById('artists-grid');
  if (!grid) return;
  
  const sorted = Object.entries(artists).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🎤</div>
        <div style="color: var(--sage); font-size: 16px;">Nenhum artista encontrado</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  sorted.forEach(([name, count]) => {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.innerHTML = `
      <div class="artist-icon">🎤</div>
      <div class="artist-name">${escapeHtml(name)}</div>
      <div class="artist-count">${count} ${count === 1 ? 'evento' : 'eventos'}</div>
    `;
    grid.appendChild(card);
  });
}

// ── EVENT ACTIONS ──
function deleteEvent(eventId) {
  if (!confirm('Tem certeza que deseja deletar este evento?')) return;
  
  const beforeLength = events.length;
  events = events.filter(ev => (ev.id || ev.date) !== eventId);
  
  if (events.length < beforeLength) {
    saveEvents();
    extractArtists();
    renderDashboard();
    chatMessage('bot', '✅ Evento deletado!');
  }
}

// ── CHATBOT ──
function setupChatbot() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send');
  const chatbot = document.getElementById('chatbot');
  const chatHeader = document.getElementById('chat-header');
  const resizeHandle = document.getElementById('resize-handle');
  
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
  }
  
  sendBtn?.addEventListener('click', sendChat);
  
  // Drag functionality
  if (chatHeader && chatbot) {
    chatHeader.style.cursor = 'move';
    
    chatHeader.addEventListener('mousedown', (e) => {
      if (e.target.closest('#btn-chat-close')) return;
      
      isDragging = true;
      const rect = chatbot.getBoundingClientRect();
      dragStartX = e.clientX - rect.left;
      dragStartY = e.clientY - rect.top;
      chatbot.style.transition = 'none';
    });
  }
  
  // Resize functionality
  if (resizeHandle && chatbot) {
    resizeHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isResizing = true;
      const rect = chatbot.getBoundingClientRect();
      resizeStartWidth = rect.width;
      resizeStartHeight = rect.height;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      chatbot.style.transition = 'none';
    });
  }
  
  // Global mouse handlers
  document.addEventListener('mousemove', (e) => {
    if (isDragging && chatbot) {
      const x = e.clientX - dragStartX;
      const y = e.clientY - dragStartY;
      
      chatbot.style.right = 'auto';
      chatbot.style.bottom = 'auto';
      chatbot.style.left = `${Math.max(0, Math.min(x, window.innerWidth - chatbot.offsetWidth))}px`;
      chatbot.style.top = `${Math.max(0, Math.min(y, window.innerHeight - chatbot.offsetHeight))}px`;
    }
    
    if (isResizing && chatbot) {
      const newWidth = Math.max(300, resizeStartWidth + (e.clientX - dragStartX));
      const newHeight = Math.max(400, resizeStartHeight + (e.clientY - dragStartY));
      
      chatbot.style.width = `${newWidth}px`;
      chatbot.style.height = `${newHeight}px`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging || isResizing) {
      chatbot.style.transition = '';
    }
    isDragging = false;
    isResizing = false;
  });
  
  // Close button
  document.getElementById('btn-chat-close')?.addEventListener('click', () => {
    if (chatbot) chatbot.style.display = 'none';
  });
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input?.value?.trim();
  if (!msg) return;
  
  chatMessage('user', msg);
  input.value = '';
  
  setTimeout(() => handleChatCommand(msg), 300);
}

function handleChatCommand(msg) {
  const lower = msg.toLowerCase();
  
  if (lower.includes('ajuda') || lower.includes('help')) {
    chatMessage('bot', `� Comandos disponíveis:
• "login" - Conectar Google Calendar
• "sync" - Sincronizar eventos
• "eventos" - Ver estatísticas
• "locais" - Ver locais cadastrados
• "artistas" - Ver artistas`);
  } else if (lower.includes('login') || lower.includes('conectar')) {
    chatMessage('bot', '🔐 Clique no botão "Login Google" no topo da página');
  } else if (lower.includes('sync') || lower.includes('sincronizar')) {
    if (accessToken) {
      syncCalendarEvents();
    } else {
      chatMessage('bot', '⚠️ Faça login primeiro');
    }
  } else if (lower.includes('eventos')) {
    chatMessage('bot', `📊 Total: ${events.length} eventos`);
  } else if (lower.includes('locais')) {
    chatMessage('bot', `🗺️ Total: ${venues.length} locais cadastrados`);
  } else if (lower.includes('artistas')) {
    chatMessage('bot', `🎤 Total: ${Object.keys(artists).length} artistas`);
  } else {
    chatMessage('bot', 'Digite "ajuda" para ver os comandos disponíveis');
  }
}

function chatMessage(role, text) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  
  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${role}`;
  
  const avatar = role === 'bot' ? '🤖' : '👤';
  msgEl.innerHTML = `
    <div class="chat-avatar">${avatar}</div>
    <div class="chat-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
  `;
  
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

// ── UTILITIES ──
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── EXPORTS ──
window.deleteEvent = deleteEvent;
window.handleLoginClick = handleLoginClick;
window.toggleTheme = toggleTheme;
