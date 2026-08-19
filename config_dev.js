// ════════════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION (DEVELOPMENT MODE)
// EventBot v5.0
// 
// Este arquivo é para desenvolvimento local sem Supabase.
// Ele usa localStorage como fallback.
// ════════════════════════════════════════════════════════════════

// Use localStorage para testes sem Supabase
const SUPABASE_CONFIG = {
  url: 'https://localhost:54321',  // URL fake - não usada em dev mode
  anonKey: 'dev-mode',
  devMode: true  // Ativa modo desenvolvimento
};
