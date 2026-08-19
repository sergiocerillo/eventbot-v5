# Guia de Uso - EventBot v3.0

## 🎨 Novo: Light Mode / Dark Mode

### Como Usar
1. Clique no botão **☀️ / 🌙** na barra superior (topbar)
2. O tema muda imediatamente
3. Sua preferência é salva automaticamente

### Temas Disponíveis
- **Dark Mode (Padrão)**: Tema escuro relaxante, ideal para noite
- **Light Mode**: Tema claro otimizado para luz natural

### Configuração
- Preferência salva em `localStorage` como `eb_darkmode`
- Ao recarregar a página, mantém seu tema preferido

---

## 📅 Novo: Página de Eventos

### Como Acessar
1. **Opção 1**: Clique na aba **"Eventos"** na navegação
2. **Opção 2**: Clique no botão **📋** no topbar
3. **Opção 3**: Cadastre um evento e ele aparecerá na lista

### Informações Exibidas
Cada evento mostra:
```
[#1] Nome do Evento
📅 01 de julho de 2026 · 🕒 18:00, 19:00 · 📍 Local do Evento
Status: Vou ⚠️ Duplicado
[Editar] [Remover]
```

### Funcionalidades

#### Seleção de Eventos
- Clique em um evento para selecioná-lo (aparece mensagem: "Evento #X selecionado")
- Útil para referências rápidas

#### Edição
- Clique em **[Editar]** para abrir o modal de edição
- Modifique: título, data, horário, local, presença, link

#### Remoção
- Clique em **[Remover]** para deletar o evento
- Confirme a ação no dialog

#### Indicador de Duplicação
- Badge **⚠️ Duplicado** aparece se houver evento com título e data similares
- Ajuda a evitar cadastros duplicados

---

## 🔢 Melhorias na Conversa

### Botões Numerados
Muitos menus agora mostram opções numeradas:

```
Como quer cadastrar?
1. Show por link
2. Show manual
3. Filme
4. Lote de links
⬅️ Voltar
```

- **Clique no botão** com o número
- **OU** digite o número no chat
- Ambas as opções funcionam

### Botão Voltar (⬅️)
- Aparece em menus secundários
- Clique para retornar ao menu anterior
- Mantém histórico de navegação na conversa

### Fluxo Melhorado
```
Menu Principal
    ↓ (escolhe opção)
Menu Secundário
    ↓ (pode voltar ⬅️ ou escolher)
Próxima Etapa
```

---

## 📦 Layout Otimizado (920px)

### Estrutura
```
┌─ Sidebar (280px) ─┬─ Chat (920px) ─┬─ Espaço Extra ─┐
│  - Configurações │ - Conversa      │ (Reservado)    │
│  - Histórico    │ - Preview       │                │
│  - Estatísticas │ - Widgets       │                │
└─────────────────┴─────────────────┴────────────────┘
```

### Benefícios
- Chat com **largura fixa de 920px** para melhor legibilidade
- Sidebar sempre visível com histórico de eventos
- Espaço lateral reservado para expansões futuras
- Layout responsivo em mobile (colapsa para 1 coluna)

---

## 🎯 Detecção de Duplicidade

### Como Funciona
O sistema detecta eventos duplicados comparando:
1. **Título**: Normalizado (lowercase, sem acentos/caracteres especiais)
2. **Data**: Exata (YYYY-MM-DD)

### Exemplos de Detecção
```
✅ Detecta como duplicado:
- "Show da Anavitória" + "2026-07-15"
- "Show da Anavitória" + "2026-07-15" (segunda vez)

❌ NÃO detecta como duplicado:
- "Show da Anavitória" + "2026-07-15"
- "Show da Ana Vitória" + "2026-07-16" (data diferente)
- "Show do BaianaSystem" + "2026-07-15" (título diferente)
```

### Aviso Visual
Badge **⚠️ Duplicado** aparece na página de eventos para:
- Eventos com mesmo título e data (independente de hora/local)

---

## 💡 Dicas de Uso

### Fluxo Recomendado
1. ✅ Abra o app e veja a mensagem de boas-vindas
2. ✅ Cadastre eventos usando qualquer método:
   - Por link (extração com IA)
   - Manual (preencher dados)
   - Filme (ingresso.com)
   - Lote de links
3. ✅ Confira na aba "Eventos" a lista completa
4. ✅ Use Light Mode se preferir tema claro
5. ✅ Edite ou remova eventos conforme necessário

### Atalhos Rápidos
| Ação | Como |
|------|------|
| Alternar tema | Botão ☀️ / 🌙 no topbar |
| Ir para eventos | Botão 📋 ou aba "Eventos" |
| Voltar ao chat | Aba "Chat" ou botão ⬅️ em menus |
| Editar evento | Botão [Editar] na página de eventos |
| Remover evento | Botão [Remover] na página de eventos |

### Melhor Experiência
- **Use Light Mode** em ambientes bem iluminados
- **Use Dark Mode** para sessões noturnas
- **Cadastre em lote** se tiver muitos links para adicionar
- **Consulte a página de eventos** para revisar o que foi cadastrado
- **Edite diretamente** se encontrar erros de extração

---

## ❓ FAQ

### P: Meu tema não persiste ao recarregar?
**R:** Limpe o cache do navegador ou verifique se localStorage está habilitado.

### P: Como sou notificado de eventos duplicados?
**R:** Vá à aba "Eventos" - verá badge ⚠️ nos eventos similares.

### P: Posso editar um evento após cadastro?
**R:** Sim! Vá à aba "Eventos" e clique em [Editar], ou use o botão [Editar Evento] no sidebar.

### P: O que acontece se eu deletar um evento?
**R:** É removido da lista da sessão. Você também pode deletar do Google Calendar na aba "Calendário".

### P: Posso voltar nos menus?
**R:** Sim! Clique em ⬅️ Voltar ou use os botões de número para navegar.

---

## 🚀 Próximas Versões

Funcionalidades planejadas:
- ✨ Integração com mais plataformas de eventos
- ✨ Notificações para eventos próximos
- ✨ Exportação de eventos (CSV, PDF)
- ✨ Sincronização com múltiplos calendários
- ✨ Widget de próximos eventos na sidebar
- ✨ Dark mode com mais variações (sepia, high contrast, etc)
