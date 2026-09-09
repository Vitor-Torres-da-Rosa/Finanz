// Configuração usada só pelos testes: manda o app falar com o emulador
// local em vez do Supabase de verdade.
window.FINANZ_CONFIG = {
  supabaseUrl: 'http://127.0.0.1:54321',
  supabaseAnonKey: 'sb_publishable_teste'
};
