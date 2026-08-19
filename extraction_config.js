// ════════════════════════════════════════════════════════════════
// EXTRACTOR CONFIGURATION
// Customize these settings for your needs
// ════════════════════════════════════════════════════════════════

// ── EXTRACTION PREFERENCES ──
const EXTRACTION_PREFERENCES = {
  // Cache settings
  useCache: true,
  cacheTTL: 3600000,          // 1 hour in milliseconds
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000,           // 1 second between retries
  
  // Timeout settings
  timeout: 10000,             // 10 seconds per request
  
  // Method preferences
  preferStructured: true,     // Try structured extraction first
  preferAI: true,             // Use AI when structured fails
  fallbackToManual: true,     // Allow manual correction
  
  // Platform-specific settings
  platforms: [
    'sympla',       // Most common in Brazil
    'eventbrite',
    'ingresso',
    'ingressos',
    'pix',
    'stubhub',
    'ticketmaster'
  ],
  
  // Scraping settings
  maxContentLength: 8000,     // Max characters from page
  stripElements: [            // Elements to remove before extraction
    'script', 'style', 'nav', 'footer', 'header', 'aside',
    'iframe', '.ads', '.newsletter', '.cookie-banner',
    '.modal', '.popup', '.overlay'
  ],
  
  // AI settings
  openRouterModels: [
    'openrouter/auto',
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-4-scout:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free'
  ],
  
  // Extraction priority (for structured method)
  priorityFields: {
    title: 30,
    date: 25,
    time: 25,
    venue: 20
  },
  
  // Minimum score for structured extraction (0-100)
  minStructuredScore: 60,
  
  // Validation settings
  validate: true,
  correctAutomatically: true,
  
  // Logging
  verbose: false
};

// ── LOGGING CONFIG ──
const EXTRACTOR_LOG = {
  level: 'info',              // 'debug', 'info', 'warn', 'error'
  showTimestamp: true,
  showMethod: true,
  showCache: true
};

// ── CUSTOM PLATFORMS ──
// Add your own platform patterns here
const CUSTOM_PLATFORMS = {
  // Example:
  // mysite: {
  //   name: 'MySite',
  //   urlRegex: /mysite\.com/i,
  //   fields: {
  //     title: ['.custom-title'],
  //     date: ['.custom-date'],
  //     time: ['.custom-time'],
  //     venue: ['.custom-venue']
  //   }
  // }
};

// ── CUSTOM SCRAPING PROXIES ──
// Add your own proxies if needed
const CUSTOM_PROXIES = [
  // Example:
  // u => 'https://your-proxy.com/?url=' + encodeURIComponent(u)
];

// ── CACHE STORAGE ──
// localStorage key for cache
const CACHE_STORAGE_KEY = 'eb_extraction_cache';

// ── EXPORT ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EXTRACTION_PREFERENCES,
    EXTRACTOR_LOG,
    CUSTOM_PLATFORMS,
    CUSTOM_PROXIES,
    CACHE_STORAGE_KEY
  };
}
