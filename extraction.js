// ════════════════════════════════════════════════════════════════
// EXTRACTOR v2.0 — Sistema Avançado de Extração de Dados de Eventos
// com múltiplos métodos de scraping e IA inteligente
// ════════════════════════════════════════════════════════════════

// ── CONSTANTS ──
const EXTRACTOR_VERSION = '2.0.0';

const SCRAPING_METHODS = {
  DIRECT: 'direct',           // Scraping direto via CORS proxy
  API_SCRAPER: 'api_scraper', // API de scraping (serpapi, etc)
  HEADLESS: 'headless',       // Browser headless (puppeteer/Playwright)
  AI_EXTRACT: 'ai_extract',   // IA apenas para extração
  MANUAL: 'manual'            // Entrada manual com validação
};

const PLATFORM_PATTERNS = {
  sympla: /sympla\.com\.br/,
  eventbrite: /eventbrite\.com/,
  ingresso: /ingresso\.com/,
  ingressos: /ingressos\.com/,
  pix: /pix\.com\.br/,
  stubhub: /stubhub\.com/,
  ticketmaster: /ticketmaster\.com\.br/
};

const DEFAULT_EXTRACTOR_CONFIG = {
  useCache: true,
  cacheTTL: 3600000,          // 1 hora em ms
  maxRetries: 3,
  timeout: 10000,             // 10 segundos
  preferAI: true,
  fallbackToManual: true,
  platforms: ['sympla', 'eventbrite', 'ingresso', 'ingressos', 'pix']
};

// ── CACHE SYSTEM ──
const extractionCache = new Map();

function getCacheKey(url) {
  return 'extract_' + btoa(url).replace(/=/g, '');
}

function getFromCache(url) {
  if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return null;
  
  const key = getCacheKey(url);
  const cached = extractionCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < DEFAULT_EXTRACTOR_CONFIG.cacheTTL) {
    console.log('[Extractor] Cache hit for:', url);
    return cached.data;
  }
  
  return null;
}

function setCache(url, data) {
  if (!DEFAULT_EXTRACTOR_CONFIG.useCache) return;
  
  const key = getCacheKey(url);
  extractionCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  
  console.log('[Extractor] Cached:', url);
}

// ── PLATFORM DETECTORS ──
function detectPlatform(url) {
  for (const [name, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url.toLowerCase())) {
      return name;
    }
  }
  return 'generic';
}

function getPlatformConfig(platform) {
  const configs = {
    sympla: {
      name: 'Sympla',
      urlRegex: /sympla\.com\.br\/[^\s]+/i,
      fields: {
        title: ['.event-header h1', '.event-title h1', 'h1[data-test="event-title"]'],
        date: ['.event-date', '.date-display', '[data-test="event-date"]'],
        time: ['.event-time', '.time-display', '[data-test="event-time"]'],
        venue: ['.event-venue', '.venue-name', '[data-test="event-venue"]'],
        price: ['.ticket-price', '.price-display', '[data-test="ticket-price"]']
      }
    },
    eventbrite: {
      name: 'Eventbrite',
      urlRegex: /eventbrite\.com\/[^\s]+/i,
      fields: {
        title: ['h1.event-title', '.event-header h1', '#event-title'],
        date: ['.date-display', '.event-date', '[data-test="event-date"]'],
        time: ['.time-display', '[data-test="event-time"]'],
        venue: ['.venue-name', '.event-venue', '[data-test="event-venue"]'],
        price: ['.ticket-price', '.price-display']
      }
    },
    ingresso: {
      name: 'Ingresso.com',
      urlRegex: /ingresso\.com\/[^\s]+/i,
      fields: {
        title: ['.event-header h1', '.event-title h1', 'h1[itemprop="name"]'],
        date: ['.event-date', '[data-test="event-date"]'],
        time: ['.event-time', '[data-test="event-time"]'],
        venue: ['.event-venue', '.localizacao-evento', '[data-test="event-venue"]'],
        price: ['.price-display', '.ticket-price']
      }
    },
    generic: {
      name: 'Generic',
      urlRegex: /.*/,
      fields: {
        title: ['h1', 'h2.event-title', '.event-title'],
        date: ['.date', '.event-date', '[data-date]', 'time[datetime]'],
        time: ['.time', '.event-time'],
        venue: ['.venue', '.local', '[data-venue]']
      }
    }
  };
  
  return configs[platform] || configs.generic;
}

// ── SCRAPING METHODS ──

// Method 1: Direct scraping (fallback)
async function scrapeDirect(url) {
  const proxies = [
    u => 'https://corsproxy.io/?' + encodeURIComponent(u),
    u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
    u => 'https://api.allorigins.win/get?url=' + encodeURIComponent(u),
  ];
  
  for (const mk of proxies) {
    try {
      const r = await fetch(mk(url), {signal: AbortSignal.timeout(8000)});
      if (!r.ok) continue;
      
      const html = await r.text();
      return html;
    } catch(e) {
      console.log('[Extractor] Proxy failed:', e.message);
    }
  }
  
  throw new Error('Todos os proxies de scraping falharam');
}

// Method 2: Structured extraction using platform-specific selectors
async function extractStructured(url) {
  const html = await scrapeDirect(url);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const platform = detectPlatform(url);
  const config = getPlatformConfig(platform);
  
  const result = {
    platform: platform,
    extracted: true,
    score: 0,
    fields: {}
  };
  
  // Extract title
  const titleSelectors = config.fields.title || ['h1', 'title'];
  for (const selector of titleSelectors) {
    const el = doc.querySelector(selector);
    if (el && el.textContent.trim().length > 5) {
      result.fields.title = el.textContent.trim();
      result.score += 30;
      break;
    }
  }
  
  // Extract date
  const dateSelectors = config.fields.date || ['.date', '[data-date]', 'time'];
  for (const selector of dateSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      let dateVal = el.getAttribute('datetime') || el.textContent.trim();
      // Try to normalize date format
      const dateMatch = dateVal.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        result.fields.date = `${dateMatch[3]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[1]).padStart(2, '0')}`;
        result.score += 25;
      } else if (dateVal.length >= 10) {
        result.fields.date = dateVal.substring(0, 10);
        result.score += 20;
      }
      break;
    }
  }
  
  // Extract time
  const timeSelectors = config.fields.time || ['.time', '[data-time]'];
  for (const selector of timeSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      const timeVal = el.textContent.trim().match(/(\d{1,2}:\d{2})/);
      if (timeVal) {
        result.fields.time_start = timeVal[1];
        result.score += 25;
      }
      break;
    }
  }
  
  // Extract venue
  const venueSelectors = config.fields.venue || ['.venue', '.local'];
  for (const selector of venueSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      result.fields.venue_name = el.textContent.trim();
      result.score += 20;
      break;
    }
  }
  
  // Extract price
  const priceSelectors = config.fields.price || ['.price', '.ticket-price'];
  for (const selector of priceSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      result.fields.price_info = el.textContent.trim();
      result.score += 10;
      break;
    }
  }
  
  // Check if we got enough data
  if (result.score >= 60) {
    return result;
  }
  
  throw new Error('Extração estruturada falhou (score baixo)');
}

// Method 3: AI-based extraction (primary method)
async function extractWithAI(url, context = {}) {
  const html = await scrapeDirect(url);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const platform = detectPlatform(url);
  
  // Create platform-aware prompt
  const platformConfig = getPlatformConfig(platform);
  
  // Get page title
  const pageTitle = doc.querySelector('title')?.textContent || '';
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const metaOGTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
  const metaOGDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
  
  // Get visible text (cleaned)
  const body = doc.body.cloneNode(true);
  body.querySelectorAll('script, style, nav, footer, header, aside, iframe, .ads, .newsletter').forEach(el => el.remove());
  const visibleText = body.innerText.replace(/\s+/g, ' ').trim().substring(0, 8000);
  
  const prompt = `Extract event data from this page and return ONLY valid JSON.
  
Platform detected: ${platform}
Page title: ${pageTitle}
Meta description: ${metaDesc}
OG Title: ${metaOGTitle}
OG Description: ${metaOGDesc}

Extracted page content (first 8000 chars):
${visibleText}

Required format:
{
  "title": "Event Name",
  "date": "YYYY-MM-DD",
  "time_start": "HH:MM",
  "venue_name": "Venue Name",
  "venue_address": "Full Address (optional)",
  "ticket_link": "Ticket URL (optional)",
  "description": "Short description (optional)",
  "price_info": "Price info (optional)"
}

Rules:
1. If date/time are not explicit, infer from context
2. Use Brazilian Portuguese for description if possible
3. Make reasonable assumptions if data is missing
4. Return only the JSON object, no markdown, no extra text
5. Date format MUST be YYYY-MM-DD
6. Time format MUST be HH:MM

Return:`;
  
  const txt = await callOpenRouter(prompt);
  const clean = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  
  if (!match) throw new Error('Resposta inválida da IA.');
  
  const data = JSON.parse(match[0]);
  
  return {
    platform: platform,
    extracted: true,
    method: 'ai',
    aiConfidence: 0.85,
    fields: data
  };
}

// Method 4: Smart hybrid extraction
async function extractSmart(url) {
  console.log('[Extractor] Smart extraction started for:', url);
  
  const cached = getFromCache(url);
  if (cached) return cached;
  
  // Try structured extraction first (fastest)
  try {
    const structured = await extractStructured(url);
    console.log('[Extractor] Structured extraction succeeded');
    setCache(url, structured);
    return structured;
  } catch(e) {
    console.log('[Extractor] Structured extraction failed:', e.message);
  }
  
  // Try AI extraction
  try {
    const ai = await extractWithAI(url);
    console.log('[Extractor] AI extraction succeeded');
    setCache(url, ai);
    return ai;
  } catch(e) {
    console.log('[Extractor] AI extraction failed:', e.message);
  }
  
  // Fallback to raw URL
  return {
    platform: 'generic',
    extracted: false,
    url: url,
    error: 'Extraction failed'
  };
}

// ── VALIDATION & CORRECTION ──

function validateEvent(data) {
  const errors = [];
  const warnings = [];
  
  // Title validation
  if (!data.title || data.title.length < 3) {
    errors.push('Título inválido ou muito curto');
  }
  
  // Date validation
  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push('Formato de data inválido (use YYYY-MM-DD)');
    } else {
      const date = new Date(data.date);
      if (date.getFullYear() < 2020 || date.getFullYear() > 2030) {
        warnings.push('Data parece ser de um ano incomum');
      }
    }
  } else {
    errors.push('Data é obrigatória');
  }
  
  // Time validation
  if (data.time_start) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(data.time_start)) {
      errors.push('Formato de horário inválido (use HH:MM)');
    }
  }
  
  // Venue validation
  if (!data.venue_name || data.venue_name.length < 3) {
    warnings.push('Local pode estar faltando');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data
  };
}

function correctEvent(data) {
  // Normalize title
  if (data.title) {
    data.title = data.title
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\bshow da\b/gi, 'Show da ')
      .replace(/\bshow de\b/gi, 'Show de ')
      .replace(/\bshow com\b/gi, 'Show com ');
  }
  
  // Normalize date
  if (data.date) {
    // Try to fix common date formats
    const formats = [
      { regex: /(\d{2})\/(\d{2})\/(\d{4})/, replace: '$3-$2-$1' },
      { regex: /(\d{4})(\d{2})(\d{2})/, replace: '$1-$2-$3' }
    ];
    
    for (const f of formats) {
      if (f.regex.test(data.date)) {
        data.date = data.date.replace(f.regex, f.replace);
        break;
      }
    }
  }
  
  // Normalize time
  if (data.time_start) {
    const match = data.time_start.match(/(\d{1,2}):?(\d{2})?/);
    if (match) {
      const h = String(match[1]).padStart(2, '0');
      const m = match[2] ? String(match[2]).padStart(2, '0') : '00';
      data.time_start = `${h}:${m}`;
    }
  }
  
  return data;
}

// ── MAIN EXTRACTOR FUNCTION ──

async function extractFromLinkEnhanced(url) {
  if (!url || !isUrl(url)) {
    throw new Error('URL inválida');
  }
  
  console.log('[Extractor] Starting extraction for:', url);
  
  const result = await extractSmart(url);
  
  if (!result.extracted) {
    throw new Error('Falha na extração de dados');
  }
  
  // Normalize result format
  const normalized = {
    title: result.fields.title,
    date: result.fields.date,
    times: result.fields.time_start ? [result.fields.time_start] : ['19:00'], // default
    venue: result.fields.venue_name,
    venue_addr: result.fields.venue_address || '',
    ticketLink: result.fields.ticket_link || result.fields.price_info || '',
    desc: result.fields.description || '',
    price: result.fields.price_info || ''
  };
  
  // Validate
  const validation = validateEvent(normalized);
  if (!validation.valid) {
    console.warn('[Extractor] Validation warnings:', validation.warnings);
  }
  
  console.log('[Extractor] Extraction complete:', normalized);
  
  return normalized;
}

// ── BULK EXTRACTION ──

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
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  return results;
}

// ── UTILITIES ──

function clearCache() {
  extractionCache.clear();
  console.log('[Extractor] Cache cleared');
}

function getCacheStats() {
  const keys = Array.from(extractionCache.keys());
  return {
    count: keys.length,
    keys: keys.slice(0, 10) // Show first 10
  };
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractFromLinkEnhanced,
    extractBulk,
    detectPlatform,
    getPlatformConfig,
    validateEvent,
    correctEvent,
    clearCache,
    getCacheStats,
    extractionCache,
    EXTRACTOR_VERSION
  };
}
