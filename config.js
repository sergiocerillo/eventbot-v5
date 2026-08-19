// ════════════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION
// EventBot v5.0
// 
// ⚠️ IMPORTANTE: Substitua as chaves abaixo pelas do seu projeto
// Acesse: https://supabase.com/dashboard → Settings → API
// ════════════════════════════════════════════════════════════════

const SUPABASE_CONFIG = {
  // Substitua pelo seu URL do projeto (ex: https://xyz.supabase.co)
  url: 'https://sergiocerillo-coding-eventb.supabase.co',
  
  // Substitua pela sua anon key (pública)
  anonKey: 'sb_publishable_Bcs_nHgPwY2AJh9CXBjvHg_Sw5lgu8lsb_secret_Hro5HvWgtzCAI9VTmQFv_Q_XxRxxBAi'
};

// Validação básica
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
  console.error('❌ config.js: URL ou anonKey não definidos!');
}
