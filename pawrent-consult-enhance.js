/* Chat Pawrent tersimpan di Supabase agar dapat diterima portal klinik. */
(function () {
  if (!document.title.includes('Pawrent Portal')) return;
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.chat = async function (button) {
    window.nav?.(button);
    const app = document.getElementById('app');
    const code = localStorage.getItem('echavetPetCode') || '';
    app.innerHTML = '<div class="heading"><h1>Konsultasi dokter</h1><p>Memuat percakapan Anda…</p></div><section class="card"><p class="sub">Memuat chat…</p></section>';
    const auth = await window.echavetDb.auth.getUser();
    const petResult = await window.echavetDb.from('pets').select('id,name,species,owner_id').eq('monitoring_code', code).maybeSingle();
    const pet = petResult.data;
    if (!auth.data.user || !pet) { app.querySelector('.card').innerHTML = '<p class="sub">Chat tersedia setelah akun dan kode monitoring Anda terhubung.</p>'; return; }
    const msgResult = await window.echavetDb.from('consultation_messages').select('*').eq('pet_id',pet.id).order('created_at');
    const messages = msgResult.data || [];
    app.innerHTML = `<div class="heading"><h1>Konsultasi dokter</h1><p>${esc(pet.name)} · ${esc(pet.species)}</p></div><section class="card"><div class="chatbox"><div class="messages">${messages.map(m => `<div class="msg ${m.sender_id===auth.data.user.id?'me':''}">${esc(m.body)}<small>${m.sender_id===auth.data.user.id?'Anda':'Tim EchaVet'} · ${new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small></div>`).join('') || '<p class="sub">Belum ada pesan. Mulai konsultasi dengan tim EchaVet.</p>'}</div><form class="compose" onsubmit="sendPawrentMessage(event,'${pet.id}')"><input id="pawrentReply" required maxlength="4000" placeholder="Tulis pesan untuk dokter…"><button class="primary">Kirim</button></form></div></section>`;
  };
  window.sendPawrentMessage = async function (event, petId) {
    event.preventDefault();
    const body = document.getElementById('pawrentReply').value.trim(); if (!body) return;
    const auth = await window.echavetDb.auth.getUser();
    const r = await window.echavetDb.from('consultation_messages').insert({pet_id:petId,sender_id:auth.data.user.id,body});
    if (r.error) { alert(r.error.message); return; }
    window.chat();
  };
})();
