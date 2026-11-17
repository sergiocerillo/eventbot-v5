// ════════════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION
// EventBot v5.0
// 
// ⚠️ IMPORTANTE: Configure através de .env
// Nunca commite chaves reais no repositório!
// Copie .env.example para .env e preencha com seus valores
// ════════════════════════════════════════════════════════════════

const SUPABASE_CONFIG = {
  // Carregado de .env ou variáveis de ambiente
  url: process.env.SUPABASE_URL || localStorage.getItem('supabase_url') || '',
  anonKey: process.env.SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '',
  devMode: process.env.DEV_MODE === 'true' || !process.env.SUPABASE_URL
};

// Validação básica
if (!SUPABASE_CONFIG.devMode && (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey)) {
  console.warn('⚠️ config.js: Configure SUPABASE_URL e SUPABASE_ANON_KEY via .env');
}
