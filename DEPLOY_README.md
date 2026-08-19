# EventBot v5.0 — Guia de Deploy

## 🚀 Passo a Passo Completo

### 1️⃣ Preparar o projeto

```bash
cd "/Users/sergiocerillo/Documents/Web Systems/Personal Systems/Events"
./cleanup.sh
```

Isso remove arquivos desnecessários.

---

### 2️⃣ Verificar se está pronto

```bash
./verify_setup.sh
```

Você deve ver tudo com ✅ verde.

---

### 3️⃣ Criar repo no GitHub

1. Acesse https://github.com
2. Click em **New repository**
3. Nome: `eventbot-v5` (ou outro)
4. Public ou Private
5. Click **Create repository**

---

### 4️⃣ Enviar código para GitHub

No Terminal:

```bash
cd "/Users/sergiocerillo/Documents/Web Systems/Personal Systems/Events"

git init
git config --global user.email "SEU_EMAIL"
git config --global user.name "Seu Nome"

git add index.html app.js extraction.js extraction_config.js config.js db.js README.md README_V5.md
git commit -m "Initial commit v5.0"

git remote add origin https://github.com/SEU_USERNAME/eventbot-v5.git
git push -u origin main
```

---

### 5️⃣ Configurar GitHub Pages

1. Acesse seu repo: `https://github.com/SEU_USERNAME/eventbot-v5`
2. Settings → Pages
3. Source: **main** branch
4. Save
5. Site em: `https://SEU_USERNAME.github.io/eventbot-v5/`

---

### 6️⃣ Criar projeto no Supabase

1. Acesse https://supabase.com
2. New Project
3. Project name: `eventbot-v5`
4. Password e Region
5. Free tier
6. Aguarde ~2 minutos

---

### 7️⃣ Atualizar config.js

1. No Supabase dashboard → Settings → API
2. Copie:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public key**: `eyJhbG...`

3. Atualize `config.js`:

```javascript
const SUPABASE_CONFIG = {
  url: 'https://[project-ref].supabase.co',
  anonKey: 'eyJhbG...'
};
```

---

### 8️⃣ Criar schema do banco

No Supabase SQL Editor, execute:

**users:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  name TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**events:**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TEXT[],
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  ticket_link TEXT,
  description TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**venues:**
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false
);
```

**user_profiles:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]',
  theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14
);
```

---

### 9️⃣ Configurar CORS no Supabase

Supabase → Authentication → URL Allowlist:
- Adicione: `https://SEU_USERNAME.github.io`

---

### 🔟 Testar

1. Acesse: `https://SEU_USERNAME.github.io/eventbot-v5/`
2. F12 → Console (verificar erros)
3. Tente cadastrar um evento

---

## 📊 Estrutura final

```
Events/
├── index.html                 ✅
├── app.js                     ✅
├── extraction.js              ✅
├── extraction_config.js       ✅
├── config.js                  ✅ (SEU SUPABASE)
├── db.js                      ✅
├── README.md                  ✅
├── README_V5.md               ✅
├── DEPLOY_README.md           ✅
├── cleanup.sh                 ✅
└── verify_setup.sh            ✅
```

---

## 🔧 Troubleshooting

### Erro: "Supabase not defined"
- Verifique se `config.js` está carregado
- Verifique se a URL está correta

### Erro: "CORS"
- Adicione seu domínio no URL Allowlist do Supabase

### Erro: "Table doesn't exist"
- Execute os migrations no SQL Editor

---

## 📞 Suporte

Para dúvidas sobre Supabase:
- Docs: https://supabase.com/docs
- Community: https://discord.supabase.com

---

**Status**: Pronto para deploy! 🚀
