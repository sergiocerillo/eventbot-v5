// ════════════════════════════════════════════════════════════════
// SUPABASE CLIENT - EventBot v5.0
// ════════════════════════════════════════════════════════════════

// Configuração de desenvolvimento (sem Supabase)
const SUPABASE_CONFIG_DEV = {
  url: 'https://localhost:54321',
  anonKey: 'dev-mode',
  devMode: true
};

let supabaseClient = null;
let currentUser = null;
let isDevMode = false;

// Check if config.js is loaded
if (typeof SUPABASE_CONFIG === 'undefined') {
  console.warn('⚠️ config.js não carregado! Usando modo desenvolvimento.');
  isDevMode = true;
} else {
  isDevMode = SUPABASE_CONFIG.devMode || false;
}

async function initSupabase() {
  if (isDevMode) {
    console.log('ℹ️ Modo desenvolvimento (sem Supabase)');
    return null;
  }
  
  try {
    const { createClient } = window.Supabase || await import('https://esm.sh/@supabaseClient/supabaseClient-js');
    
    supabaseClient = createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );
    
    console.log('✅ Supabase conectado!');
    
    // Check current session
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
      currentUser = session.user;
      console.log('✅ Usuário logado:', session.user.email);
    }
    
    return session;
  } catch (error) {
    console.error('❌ Erro ao conectar Supabase:', error);
    throw error;
  }
}

// Auth Functions
async function loginWithGoogle() {
  if (!supabaseClient) await initSupabase();
  
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('❌ Erro no login Google:', error);
    return { success: false, error: error.message };
  }
}

async function logout() {
  if (!supabaseClient) return;
  
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('❌ Erro ao fazer logout:', error);
  } else {
    currentUser = null;
    console.log('✅ Logout realizado');
  }
}

async function getCurrentUser() {
  if (currentUser) return currentUser;
  
  if (!supabaseClient) await initSupabase();
  
  const { data: { user } } = await supabaseClient.auth.getUser();
  currentUser = user;
  return user;
}

// Event Functions
async function saveEvent(event) {
  if (!supabaseClient) await initSupabase();
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuário não está logado');
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('events')
      .insert([{
        user_id: user.id,
        title: event.title,
        date: event.date,
        time_start: JSON.stringify(event.times || ['19:00']),
        venue_name: event.venue,
        venue_address: event.venue_addr,
        ticket_link: event.ticketLink,
        description: event.desc || '',
        platform: event.platform || 'manual',
        price_info: event.price || ''
      }]);
    
    if (error) {
      console.error('❌ Erro ao salvar evento:', error);
      throw error;
    }
    
    console.log('✅ Evento salvo:', data[0].id);
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao salvar evento:', error);
    throw error;
  }
}

async function loadEvents() {
  if (!supabaseClient) await initSupabase();
  
  try {
    const { data, error } = await supabaseClient
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao carregar eventos:', error);
      return [];
    }
    
    // Parse time_start back to array
    return data.map(e => ({
      ...e,
      times: typeof e.time_start === 'string' ? JSON.parse(e.time_start) : e.time_start
    }));
  } catch (error) {
    console.error('❌ Erro ao carregar eventos:', error);
    return [];
  }
}

async function deleteEvent(eventId) {
  if (!supabaseClient) await initSupabase();
  
  try {
    const { error } = await supabaseClient
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error('❌ Erro ao deletar evento:', error);
      throw error;
    }
    
    console.log('✅ Evento deletado:', eventId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error);
    throw error;
  }
}

async function updateEvent(eventId, updates) {
  if (!supabaseClient) await initSupabase();
  
  try {
    const { data, error } = await supabaseClient
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select();
    
    if (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
    
    console.log('✅ Evento atualizado:', data[0].id);
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error);
    throw error;
  }
}

// Venue Functions
async function saveVenue(venue) {
  if (!supabaseClient) await initSupabase();
  
  const user = await getCurrentUser();
  
  try {
    const { data, error } = await supabaseClient
      .from('venues')
      .insert([{
        user_id: user.id,
        name: venue.name,
        address: venue.address,
        is_default: venue.is_default || false
      }]);
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('❌ Erro ao salvar local:', error);
    throw error;
  }
}

async function loadVenues() {
  if (!supabaseClient) await initSupabase();
  
  try {
    const { data, error } = await supabaseClient
      .from('venues')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar locais:', error);
    return [];
  }
}

// Profile Functions
async function getProfile() {
  if (!supabaseClient) await initSupabase();
  
  const user = await getCurrentUser();
  
  try {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || {
      user_id: user.id,
      points: 0,
      badges: [],
      theme: 'dark',
      font_size: 14
    };
  } catch (error) {
    console.error('❌ Erro ao carregar perfil:', error);
    return null;
  }
}

async function updateProfile(updates) {
  if (!supabaseClient) await initSupabase();
  
  const user = await getCurrentUser();
  
  try {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    throw error;
  }
}

// Realtime
function onEventsChange(callback) {
  if (!supabaseClient) return;
  
  supabaseClient
    .channel('events-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events'
    }, payload => {
      callback(payload);
    })
    .subscribe();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSupabase,
    loginWithGoogle,
    logout,
    getCurrentUser,
    saveEvent,
    loadEvents,
    deleteEvent,
    updateEvent,
    saveVenue,
    loadVenues,
    getProfile,
    updateProfile,
    onEventsChange
  };
}
