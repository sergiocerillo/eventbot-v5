# EventBot v5.0 (GitHub Pages + Supabase) — README

## 🚀 Status: EM DESENVOLVIMENTO

Esta é uma versão de preparação para deployment em:
- **Frontend**: GitHub Pages ( gratuito, rápido, CDN global )
- **Backend**: Supabase ( PostgreSQL + Auth + Storage )

---

## 📋 O que mudou no v5.0

| Componente | v4.0 (Local) | v5.0 (GitHub Pages + Supabase) |
|-----------|--------------|--------------------------------|
| **Deployment** | Local (Python server) | GitHub Pages (free CDN) |
| **Database** | localStorage | Supabase PostgreSQL |
| **Auth** | Google OAuth | Supabase Auth + Google |
| **Storage** | Browser localStorage | Supabase Storage |
| **Backend** | None | Supabase Functions (Node.js) |
| **Sync** | Single device | Multi-device (realtime) |

---

## 🛠️ Arquitetura v5.0

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB PAGES                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  index.html + app.js + CSS + assets                     │   │
│  │  (Frontend React/Vue/Svelte - future)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   users      │  │   events     │  │   venues     │          │
│  │   profiles   │  │   venues     │  │   config     │          │
│  │   sessions   │  │   sessions   │  │   cache      │          │
│  └──────────────┘  └──────────────��  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ Auth         │  │ Storage      │                             │
│  │ (Google)     │  │ (images)     │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIs                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Google APIs  │  │ OpenRouter   │  │ Scrapers     │          │
│  │ (Calendar)   │  │ (AI)         │  │ (optional)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

### Arquivos para remover antes do deploy:
```
❌ server.py              (não necessário no GitHub Pages)
❌ start.command          (só para desenvolvimento local)
❌ TEST.html              (testes)
❌ UPDATES_SUMMARY.txt    (resumos internos)
❌ v4.0_SUMMARY.txt
❌ v4.0_CHECKLIST.md
❌ COMPLETION_SUMMARY_v4.0.md
❌ INICIO_RAPIDO.md
```

### Arquivos para manter:
```
✅ index.html             (interface principal)
✅ app.js                 (lógica)
✅ extraction.js          (sistema de extração v2.0)
✅ extraction_config.js   (configuração do extractor)
✅ README_V5.md           (este arquivo)
```

### Arquivos para criar (futuro):
```
📁 Supabase/
├── supabase/            (configuração do Supabase)
│   ├── migrations/      (scripts SQL)
│   ├── functions/       (Edge Functions)
│   └── config.toml      (config do Supabase CLI)
├── config.js            (chaves do Supabase)
└── db.js                (client Supabase)
```

---

## 🚀 Deploy em 5 passos

### Passo 1: Criar projeto no GitHub
```bash
# Criar novo repo no GitHub
# Nome: eventbot-v5
# Public ou Private (secrets em Private)

git init
git add index.html app.js extraction.js extraction_config.js README_V5.md
git commit -m "Initial commit v5.0"
git remote add origin https://github.com/SEU_USERNAME/eventbot-v5.git
git push -u origin main
```

### Passo 2: Criar projeto no Supabase
1. Acesse https://supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `eventbot-v5`
   - Database Password: (use a strong password)
   - Region: (closest to you)
4. Wait for provisioning (~2 min)

### Passo 3: Configurar GitHub Pages
1. Go to your repo → Settings → Pages
2. Source: `main` branch
3. Click Save
4. Your site will be live at: `https://SEU_USERNAME.github.io/eventbot-v5/`

### Passo 4: Configurar Supabase
1. In Supabase dashboard → Settings → API
2. Copy:
   - `Project URL` (e.g., `https://xyz.supabase.co`)
   - `anon public key` (e.g., `eyJhbGci...`)
3. Save these in your repo (secrets if private repo)

### Passo 5: Criar config.js
```javascript
// config.js (criar este arquivo)
const SUPABASE_CONFIG = {
  url: 'https://xyz.supabase.co',
  anonKey: 'eyJhbGci...'
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG };
}
```

---

## 🔐 Segurança

### GitHub Secrets (recomendado)
```bash
# Se repo for público, use GitHub Secrets:
# Settings → Secrets and variables → Actions → New repository secret

SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...  (só para server-side)
```

### .env.example (para desenvolvimento)
```env
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
OPENROUTER_API_KEY=sk_...
```

---

## 📊 Database Schema (Supabase)

### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  name TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]',
  theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TIME[],
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  ticket_link TEXT,
  description TEXT,
  price_info TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: venues
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: sync_log
```sql
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,  -- 'insert', 'update', 'delete'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔌 Integração Supabase

### Exemplo de uso no app.js
```javascript
// Depois de carregar config.js
async function initSupabase() {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js');
  
  supabase = createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
  
  // Check session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // User is logged in
    user = session.user;
  } else {
    // User is not logged in
    // Try to restore from Supabase auth
    await supabase.auth.restoreSession();
  }
}

// Save event to Supabase
async function saveEventToSupabase(event) {
  const { data, error } = await supabase
    .from('events')
    .insert([{
      user_id: user.id,
      title: event.title,
      date: event.date,
      time_start: event.times,
      venue_name: event.venue,
      venue_address: event.venue_addr,
      ticket_link: event.ticketLink,
      description: event.desc,
      platform: event.platform || 'manual'
    }]);
  
  if (error) {
    console.error('Error saving event:', error);
    return null;
  }
  
  return data[0];
}

// Load events from Supabase
async function loadEventsFromSupabase() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading events:', error);
    return [];
  }
  
  return data;
}
```

---

## 🎯 Próximos passos

### Semana 1: Setup
- [ ] Criar repo no GitHub
- [ ] Criar projeto no Supabase
- [ ] Configurar GitHub Pages
- [ ] Criar schema do banco de dados

### Semana 2: Integração
- [ ] Criar config.js
- [ ] Criar db.js (client Supabase)
- [ ] Integração de Auth
- [ ] CRUD de eventos

### Semana 3: Features
- [ ] Sincronização multi-dispositivo
- [ ] Realtime updates
- [ ] Upload de imagens (Supabase Storage)
- [ ] Exportação de dados

### Semana 4: Testing
- [ ] Testes em múltiplos dispositivos
- [ ] Performance testing
- [ ] Security review
- [ ] Documentation

---

## 📝 Notas importantes

1. **Backup antes de migrar**: Sempre faça backup do localStorage antes de migrate para Supabase
2. **Migration script**: Crie um script para migrar dados antigos
3. **Offline first**: Use Supabase Realtime para sync
4. **Rate limits**: Cuidado com rate limits do GitHub Pages (100 requests/min)

---

## 🆘 Troubleshooting

### "CORS error" ao usar Supabase
- Verifique se adicionou seu domínio em Supabase → Authentication → URL Allowlist
- GitHub Pages: `https://SEU_USERNAME.github.io`

### "Auth session not found"
- Use `supabase.auth.getSession()` para check
- Use `supabase.auth.onAuthStateChange()` para listen to changes

### "Table doesn't exist"
- Execute os migrations no Supabase SQL Editor
- Verifique se o nome da table está correto

---

## 📚 Recursos

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎉 Conclusão

O v5.0 é a versão final do EventBot, pronta para deploy em produção com:
- Frontend no GitHub Pages (free, fast, CDN)
- Backend no Supabase (PostgreSQL, Auth, Storage)
- Múltiplos dispositivos
- Realtime sync
- Segurança profissional

---

**Versão**: 5.0.0 (alpha)  
**Status**: ⚠️ Em desenvolvimento  
**Data**: Agosto 2026  
**Autor**: EventBot Team
