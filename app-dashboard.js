// ════════════════════════════════════════════════════════════════
// EventBot Dashboard v5.1
// Sistema de Gerenciamento de Eventos com Google Calendar Sync
// ════════════════════════════════════════════════════════════════

// ── STATE ──
let events = [];
let venues = [];
let artists = {};
let darkMode = true;
let currentTab = 'home';
let currentFilter = 'all'; // 'all', 'shows', 'movies'
let currentVenueFilter = null;
let currentArtistFilter = null;

// Google API State
let gapiLoaded = false;
let gisLoaded = false;
let tokenClient = null;
let accessToken = null;
let isSignedIn = false;

// Chatbot draggable state
let isDragging = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let chatbotX = 0;
let chatbotY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;

// ── INIT ──
window.addEventListener('load', async () => {
  loadConfig();
  loadEvents();
  loadVenues();
  initTheme();
  setupNavigation();
  setupChatbot();
  updateLoginButton(); // Show loading state immediately
  initGoogleAPI();
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
  clientId: '483752309274-of13qhrd0udioaen2dvf8cno2egimsvq.apps.googleusercontent.com',
  apiKey: 'AIzaSyBHopQnhjbP569baNBOxAMcHAnN-faQnm8',
  calendarId: '39fbbd9c5f4505e1cb6cd6e61371d3563d8cc9d5fff677fc87e7b32abe14f767@group.calendar.google.com',
  openRouterKey: '',
  serviceAccount: null,
};

// ── GOOGLE CALENDAR API ──
let apiLoadAttempts = 0;
const MAX_API_LOAD_ATTEMPTS = 20; // 20 tentativas = 10 segundos

function initGoogleAPI() {
  // Load Google API scripts
  loadScript('https://apis.google.com/js/api.js', () => {
    gapi.load('client', initGapiClient);
  });
  
  loadScript('https://accounts.google.com/gsi/client', () => {
    initGISClient();
  });
  
  // Check if APIs loaded successfully after timeout
  checkAPILoadStatus();
}

function checkAPILoadStatus() {
  const checkInterval = setInterval(() => {
    apiLoadAttempts++;
    
    if (gapiLoaded && gisLoaded) {
      clearInterval(checkInterval);
      console.log('✅ Todas as APIs do Google carregadas com sucesso');
      return;
    }
    
    if (apiLoadAttempts >= MAX_API_LOAD_ATTEMPTS) {
      clearInterval(checkInterval);
      console.warn('⚠️ Timeout ao carregar APIs do Google. Recarregue a página.');
      chatMessage('bot', '⚠️ Erro ao carregar Google API. Por favor, recarregue a página.');
      
      const btn = document.getElementById('btn-google-login');
      if (btn) {
        btn.textContent = '❌ Erro - Recarregue';
        btn.disabled = true;
      }
    }
  }, 500);
}

function loadScript(src, callback) {
  const script = document.createElement('script');
  script.src = src;
  script.onload = callback;
  script.onerror = () => console.error(`Failed to load ${src}`);
  document.head.appendChild(script);
}

async function initGapiClient() {
  try {
    await gapi.client.init({
      apiKey: cfg.apiKey,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    gapiLoaded = true;
    console.log('✅ Google API Client inicializado');
    updateLoginButton();
  } catch (e) {
    console.error('❌ Erro ao inicializar GAPI:', e);
  }
}

function initGISClient() {
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: cfg.clientId,
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      callback: handleAuthResponse,
    });
    gisLoaded = true;
    console.log('✅ Google Identity Services inicializado');
    updateLoginButton();
  } catch (e) {
    console.error('❌ Erro ao inicializar GIS:', e);
  }
}

function handleAuthResponse(response) {
  if (response.error) {
    console.error('❌ Erro de autenticação:', response.error);
    return;
  }
  
  accessToken = response.access_token;
  isSignedIn = true;
  updateLoginButton();
  syncCalendarEvents();
  chatMessage('bot', '✅ Login realizado com sucesso! Sincronizando eventos...');
}

function updateLoginButton() {
  const btn = document.getElementById('btn-google-login');
  if (!btn) return;
  
  if (isSignedIn) {
    btn.textContent = '✓ Conectado';
    btn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    btn.disabled = false;
  } else if (gapiLoaded && gisLoaded) {
    btn.textContent = '🔐 Login Google';
    btn.style.background = '';
    btn.disabled = false;
  } else {
    btn.textContent = '⏳ Carregando...';
    btn.style.opacity = '0.6';
    btn.disabled = true;
  }
}

async function handleLoginClick() {
  const btn = document.getElementById('btn-google-login');
  
  if (!gapiLoaded || !gisLoaded) {
    const missingAPIs = [];
    if (!gapiLoaded) missingAPIs.push('GAPI');
    if (!gisLoaded) missingAPIs.push('GIS');
    
    chatMessage('bot', `⚠️ Aguardando carregar: ${missingAPIs.join(', ')}. Tente novamente em alguns segundos.`);
    
    if (btn) {
      btn.textContent = '⏳ Carregando API...';
      btn.disabled = true;
    }
    return;
  }
  
  if (isSignedIn) {
    handleSignOut();
    return;
  }
  
  // Request token
  if (btn) {
    btn.textContent = '🔄 Aguardando autorização...';
    btn.disabled = true;
  }
  
  tokenClient.requestAccessToken();
}

function handleSignOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Token revogado');
    });
  }
  accessToken = null;
  isSignedIn = false;
  updateLoginButton();
  chatMessage('bot', '👋 Desconectado do Google Calendar');
}

async function syncCalendarEvents() {
  if (!isSignedIn || !cfg.calendarId) {
    chatMessage('bot', '⚠️ Configure o Calendar ID nas configurações primeiro');
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
    chatMessage('bot', `📅 ${calendarEvents.length} eventos encontrados no Google Calendar`);
    
    // Convert calendar events to our format
    const convertedEvents = calendarEvents.map(ev => convertCalendarEvent(ev));
    
    // Merge with existing events
    events = [...events, ...convertedEvents];
    
    // Remove duplicates
    events = events.filter((ev, index, self) =>
      index === self.findIndex(e => e.id === ev.id || (e.title === ev.title && e.date === ev.date))
    );
    
    // Save and render
    localStorage.setItem('eventbot_events', JSON.stringify(events));
    extractArtists();
    renderDashboard();
    
    chatMessage('bot', `✅ ${convertedEvents.length} eventos sincronizados!`);
  } catch (e) {
    console.error('❌ Erro ao sincronizar:', e);
    chatMessage('bot', '❌ Erro ao sincronizar eventos. Verifique suas permissões.');
  }
}

function convertCalendarEvent(calEvent) {
  const startDate = calEvent.start.dateTime || calEvent.start.date;
  const date = new Date(startDate);
  
  return {
    id: calEvent.id,
    title: calEvent.summary || 'Sem título',
    date: date.toISOString().split('T')[0],
    times: [date.toTimeString().slice(0, 5)],
    venue: extractVenue(calEvent.location || calEvent.description || ''),
    venue_addr: calEvent.location || '',
    ticketLink: extractLink(calEvent.description || ''),
    desc: calEvent.description || '',
    price: '',
    platform: 'google-calendar',
    type: detectEventType(calEvent.summary || '')
  };
}

function extractVenue(text) {
  const venueNames = venues.map(v => v.name);
  for (const venueName of venueNames) {
    if (text.toLowerCase().includes(venueName.toLowerCase())) {
      return venueName;
    }
  }
  return 'Local não especificado';
}

function extractLink(text) {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : '';
}

function detectEventType(title) {
  const movieKeywords = ['filme', 'cinema', 'sessão', 'exibição'];
  const titleLower = title.toLowerCase();
  
  for (const keyword of movieKeywords) {
    if (titleLower.includes(keyword)) return 'movie';
  }
  
  return 'show';
}

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

// ── FILTERS ──
function applyFilter(filterType, value) {
  if (filterType === 'type') {
    currentFilter = value;
  } else if (filterType === 'venue') {
    currentVenueFilter = value;
  } else if (filterType === 'artist') {
    currentArtistFilter = value;
  }
  
  renderEvents();
  chatMessage('bot', `🔍 Filtro aplicado: ${value}`);
}

function getFilteredEvents() {
  let filtered = [...events];
  
  // Filter by type (shows, movies, all)
  if (currentFilter === 'shows') {
    filtered = filtered.filter(ev => ev.type !== 'movie');
  } else if (currentFilter === 'movies') {
    filtered = filtered.filter(ev => ev.type === 'movie');
  }
  
  // Filter by venue
  if (currentVenueFilter && currentVenueFilter !== 'all') {
    filtered = filtered.filter(ev => ev.venue === currentVenueFilter);
  }
  
  // Filter by artist
  if (currentArtistFilter && currentArtistFilter !== 'all') {
    filtered = filtered.filter(ev => ev.title.toLowerCase() === currentArtistFilter.toLowerCase());
  }
  
  return filtered;
}

function resetFilters() {
  currentFilter = 'all';
  currentVenueFilter = null;
  currentArtistFilter = null;
  renderEvents();
  chatMessage('bot', '🔄 Filtros resetados');
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
  
  const filteredEvents = getFilteredEvents();
  
  if (filteredEvents.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--sage); padding: 40px; font-style: italic;">Nenhum evento encontrado com os filtros aplicados.</div>';
    return;
  }
  
  filteredEvents.forEach(ev => {
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
  const chatbot = document.getElementById('chatbot');
  const chatHeader = document.getElementById('chat-header');
  const resizeHandle = document.getElementById('resize-handle');
  
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }
  
  if (sendBtn) sendBtn.addEventListener('click', sendChat);
  if (closeBtn) closeBtn.addEventListener('click', minimizeChat);
  
  // Draggable chatbot
  if (chatHeader && chatbot) {
    chatHeader.style.cursor = 'move';
    
    chatHeader.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn || e.target.closest('#btn-chat-close')) return;
      
      isDragging = true;
      const rect = chatbot.getBoundingClientRect();
      dragStartX = e.clientX - rect.left;
      dragStartY = e.clientY - rect.top;
      
      chatbot.style.transition = 'none';
    });
  }
  
  // Resizable chatbot
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
      chatbot.style.left = Math.max(0, Math.min(x, window.innerWidth - chatbot.offsetWidth)) + 'px';
      chatbot.style.top = Math.max(0, Math.min(y, window.innerHeight - chatbot.offsetHeight)) + 'px';
    }
    
    if (isResizing && chatbot) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      const newWidth = Math.max(300, resizeStartWidth + deltaX);
      const newHeight = Math.max(400, resizeStartHeight + deltaY);
      
      chatbot.style.width = newWidth + 'px';
      chatbot.style.height = newHeight + 'px';
    }
  });
  
  document.addEventListener('mouseup', () => {
    if ((isDragging || isResizing) && chatbot) {
      chatbot.style.transition = '';
    }
    isDragging = false;
    isResizing = false;
  });
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = (input?.value || '').trim();
  if (!msg) return;
  
  chatMessage('user', msg);
  input.value = '';
  
  // Simple chatbot responses
  setTimeout(() => {
    const msgLower = msg.toLowerCase();
    
    if (msgLower.includes('login') || msgLower.includes('conectar') || msgLower.includes('google')) {
      chatMessage('bot', '🔐 Use o botão "Login Google" no topo da página para conectar sua conta');
    } else if (msgLower.includes('sincronizar') || msgLower.includes('sync')) {
      if (isSignedIn) {
        syncCalendarEvents();
      } else {
        chatMessage('bot', '⚠️ Faça login no Google primeiro para sincronizar eventos');
      }
    } else if (msgLower.includes('filtro') && msgLower.includes('show')) {
      applyFilter('type', 'shows');
    } else if (msgLower.includes('filtro') && msgLower.includes('filme')) {
      applyFilter('type', 'movies');
    } else if (msgLower.includes('resetar') || msgLower.includes('limpar filtro')) {
      resetFilters();
    } else if (msgLower.includes('novo evento') || msgLower.includes('criar')) {
      chatMessage('bot', 'Para criar um novo evento, descreva:\n📝 Nome do evento\n📍 Local\n📅 Data\n🕐 Horário(s)\n🎫 Link de ingressos (opcional)');
    } else if (msgLower.includes('eventos')) {
      const filtered = getFilteredEvents();
      chatMessage('bot', `📊 Você tem ${events.length} eventos cadastrados (${filtered.length} visíveis com filtros atuais)`);
    } else if (msgLower.includes('locais')) {
      chatMessage('bot', `🗺️ Temos ${venues.length} locais cadastrados. Veja na aba "Locais"!`);
    } else if (msgLower.includes('artista') || msgLower.includes('banda')) {
      chatMessage('bot', `🎤 ${Object.keys(artists).length} artistas diferentes nos seus eventos!`);
    } else if (msgLower.includes('ajuda') || msgLower.includes('help') || msgLower.includes('comandos')) {
      chatMessage('bot', `📚 Comandos disponíveis:
• "login google" → Conectar conta Google
• "sincronizar" → Sync eventos do Calendar
• "filtro shows" → Ver apenas shows
• "filtro filmes" → Ver apenas filmes
• "resetar filtro" → Limpar filtros
• "eventos" → Ver estatísticas
• "locais" → Ver locais cadastrados
• "artistas" → Ver artistas`);
    } else {
      chatMessage('bot', 'Desculpe, não entendi. Tente "ajuda" para ver os comandos disponíveis!');
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
window.handleLoginClick = handleLoginClick;
window.syncCalendarEvents = syncCalendarEvents;
window.applyFilter = applyFilter;
window.resetFilters = resetFilters;
