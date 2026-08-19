# EventBot v3.0 — Sistema Simplificado + Melhorias

Sistema de gerenciamento de eventos musicais com integração ao Google Calendar.

## 🎯 Mudanças da Versão 3.0

### ✨ Novas Funcionalidades

1. **Modo Claro/Escuro (Light Mode)**
   - Alterna entre tema escuro (padrão) e claro
   - Persistente em localStorage
   - Botão ☀️/🌙 na barra superior

2. **Página de Eventos**
   - Lista todos os eventos cadastrados
   - Exibição formatada com data, hora e local
   - Indicadores de duplicação de eventos
   - Botões para editar ou remover eventos
   - Seleção rápida de eventos por número

3. **Detecção de Duplicidade**
   - Detecta eventos com título e data similares
   - Badge de aviso (⚠️ Duplicado) na lista
   - Normalização de strings para comparação

4. **Melhorias na Conversa**
   - Opção "Voltar" (⬅️) em menus
   - Botões numerados para seleção rápida
   - Interface mais intuitiva e amigável

5. **Layout Principal Ajustado**
   - Caixa de chat com 920px fixo (melhor legibilidade)
   - Espaço lateral para futuros widgets
   - Sidebar de 280px + Chat 920px + Espaço extra

### ✅ Melhorias da Versão 2.0

1. **Login Persistente do Google**
   - Autenticação automática ao abrir o aplicativo
   - Suporte a Service Account (login permanente sem popup)
   - Token armazenado em sessão para não precisar fazer login toda vez

2. **Código Reorganizado**
   - Arquivo JavaScript modularizado e comentado
   - Funções agrupadas por categoria
   - Código reduzido de 2013 para ~1400 linhas
   - Melhor legibilidade e manutenção

3. **Funcionalidade de Playlist Removida**
   - Interface simplificada focada em eventos
   - Menos dependências externas
   - Código mais leve e rápido

### 🚀 Como Usar

#### Modo Claro/Escuro

- Clique no botão **☀️ / 🌙** na barra superior
- Sua preferência é salva automaticamente
- Temas otimizados para conforto visual

#### Página de Eventos

- Clique na aba **"Eventos"** ou botão 📋
- Veja todos os eventos cadastrados com:
  - Número sequencial (para seleção rápida)
  - Título do evento
  - Data, hora e local
  - Indicador de presença (Vou/Pensando/Não vou)
  - Aviso de duplicação se encontrar eventos similares
- Botões para editar ou remover eventos individuais

#### Seleção por Número

- Muitos menus agora mostram opções numeradas
- Digite o número ou clique no botão correspondente
- Use o botão **⬅️ Voltar** para retornar ao menu anterior

#### Opção 1: Login com OAuth (Popup)

1. Abra `index.html` no navegador
2. Clique em "Config" no canto superior direito
3. Configure:
   - **Google Client ID**: Seu OAuth Client ID
   - **Google API Key**: Sua chave de API
   - **Calendar ID**: ID do calendário (ou "primary")
   - **OpenRouter API Key**: Para extração automática de dados

4. Na primeira vez, será solicitado login no Google
5. O token fica salvo na sessão — não precisa fazer login novamente

#### Opção 2: Service Account (Sem Popup)

1. Vá em Config → "Sem Login"
2. Crie uma Service Account no Google Cloud Console
3. Baixe o JSON e cole no campo
4. Compartilhe seu calendário com o email da Service Account
5. Pronto! Login permanente sem popup

### 📋 Funcionalidades

- ✅ Cadastro de eventos por link (com IA)
- ✅ Cadastro manual de eventos
- ✅ Cadastro em lote (múltiplos links)
- ✅ Cadastro de filmes (ingresso.com)
- ✅ Gerenciamento de locais
- ✅ Status de presença (vou/talvez/não vou)
- ✅ Edição de eventos
- ✅ Visualização de eventos do calendário
- ✅ Histórico de eventos cadastrados

### 🔧 Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Google Cloud Project com Calendar API habilitada
- Chave de API do OpenRouter (opcional, para extração automática)

### 📁 Estrutura de Arquivos

```
Events/
├── index.html       # Interface do usuário
├── app.js           # Lógica da aplicação (simplificada)
├── server.py        # Servidor local Python
├── start.command    # Script de inicialização (macOS)
└── README.md        # Este arquivo
```

### 🎨 Tecnologias

- HTML5 + CSS3 (design responsivo)
- JavaScript Vanilla (sem frameworks)
- Google Calendar API
- OpenRouter AI (extração de dados)
- Python (servidor local)

### 💡 Dicas

1. **Use Service Account** para não precisar fazer login toda vez
2. **Configure OpenRouter** para extração automática de dados de links
3. **Adicione seus locais favoritos** no gerenciador de locais
4. **Use o cadastro em lote** para adicionar vários eventos de uma vez

### 🐛 Solução de Problemas

**Erro de autenticação:**
- Verifique se você adicionou `http://localhost:8080` e `http://127.0.0.1:8080` nas origens autorizadas
- Limpe o cache do navegador
- Tente usar Service Account

**Erro ao criar evento:**
- Verifique se o Calendar ID está correto
- Confirme que você tem permissão de escrita no calendário
- Se usar Service Account, compartilhe o calendário com o email da SA

**Extração de link não funciona:**
- Configure a chave de API do OpenRouter
- Verifique se o link é de um site suportado (Sympla, Eventbrite, etc.)
- Tente o cadastro manual como alternativa

---

**Versão:** 2.0  
**Data:** Abril 2026  
**Autor:** EventBot Team
