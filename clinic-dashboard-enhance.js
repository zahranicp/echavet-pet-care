/* Penyempurnaan khusus beranda portal klinik. */
(function () {
  if (!document.title.includes('Portal Klinik')) return;

  const palette = document.createElement('style');
  palette.textContent = `
    body{--bg:#f8f7f2;--surface:#fff;--surface2:#f1f6ef;--ink:#213b2e;--muted:#65776b;--brand:#367354;--brand2:#5b9671;--line:#dbe7dc;--accent:#dfefe1;--ok:#367354;--shadow:0 14px 36px rgba(33,59,46,.08)}
    .nav button[onclick*="codes"]{display:none}.bell .count{place-items:center}.quick button:hover,.quick button:focus{border-color:var(--brand);background:#f4faf3}.booking-link{display:block;text-decoration:none;color:inherit}.clinic-empty{padding:26px 0;color:var(--muted)}
    .visit-date{margin:0 0 11px;color:var(--brand);font-size:18px}.visit-row{padding:14px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:18px;align-items:center}.visit-row small{display:block;margin-top:4px;color:var(--muted)}.visit-time{color:var(--brand);font-weight:800;white-space:nowrap}
  `;
  document.head.appendChild(palette);

  const isDoctor = localStorage.getItem('echavetClinicRole') === 'doctor';
  const app = document.getElementById('app');
  const heading = (title, sub) => `<div class="heading"><h1>${title}</h1><p>${sub}</p></div>`;
  const esc = (value) => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const dateLabel = value => new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'long', year:'numeric' }).format(new Date(`${value}T00:00:00`));

  async function updateNotificationBadge() {
    const badge = document.querySelector('.bell .count');
    if (!badge || !window.echavetDb) return;
    const [petsResult, messagesResult] = await Promise.all([
      window.echavetDb.from('pets').select('id,owner_id'),
      window.echavetDb.from('consultation_messages').select('pet_id,sender_id')
    ]);
    if (petsResult.error || messagesResult.error) return;
    const owners = new Map((petsResult.data || []).map(pet => [pet.id, pet.owner_id]));
    const pawrentsWithChat = new Set((messagesResult.data || [])
      .filter(message => owners.get(message.pet_id) === message.sender_id)
      .map(message => owners.get(message.pet_id)));
    const total = pawrentsWithChat.size;
    badge.textContent = total;
    badge.style.display = total ? 'grid' : 'none';
  }

  async function doctorHome(button) {
    window.nav?.(button);
    app.innerHTML = heading('Beranda dokter', 'Kunjungan yang telah dikonfirmasi staf akan muncul otomatis di sini.') + '<section class="card"><h2>Jadwal kunjungan terkonfirmasi</h2><div class="clinic-empty">Memuat jadwal…</div></section>';
    const [online, walkin] = await Promise.all([
      window.echavetDb.from('appointment_requests').select('id,pawrent_name,species,visit_date,visit_time,purposes,staff_note,fasting_hours').eq('status','dikonfirmasi').order('visit_date').order('visit_time'),
      window.echavetDb.from('walk_in_visits').select('id,pet_name,species,visit_date,visit_time,purposes').eq('status','menunggu').order('visit_date').order('visit_time')
    ]);
    if (online.error || walkin.error) { app.querySelector('.clinic-empty').textContent = 'Jadwal belum dapat dimuat.'; return; }
    const data = [
      ...(online.data || []).map(v => ({...v, patient:v.pawrent_name || 'Pawrent', source:'Booking online', priority:0})),
      ...(walkin.data || []).map(v => ({...v, patient:v.pet_name || 'Walk-in', source:'Kunjungan langsung', priority:1, staff_note:'Tidak ada catatan khusus dari staf.'}))
    ].sort((a,b) => String(a.visit_date).localeCompare(String(b.visit_date)) || String(a.visit_time).localeCompare(String(b.visit_time)) || a.priority-b.priority);
    if (!data.length) { app.querySelector('.clinic-empty').textContent = 'Belum ada kunjungan terkonfirmasi.'; return; }
    const grouped = data.reduce((all, item) => ((all[item.visit_date] ||= []).push(item), all), {});
    app.querySelector('.card').innerHTML = '<h2>Jadwal kunjungan</h2>' + Object.entries(grouped).map(([date, visits]) => `<section><h3 class="visit-date">Kunjungan ${dateLabel(date)}</h3>${visits.map(v => `<div class="visit-row"><div><b>${esc(v.patient)} · ${esc(v.species)}</b><small>${esc(v.source)} · ${esc((v.purposes || []).join(', '))}${v.fasting_hours ? ` · Puasa ${v.fasting_hours} jam` : ''}</small><small style="margin-top:8px"><b>Catatan staf:</b> ${esc(v.staff_note || 'Tidak ada catatan khusus dari staf.')}</small></div><span class="visit-time">${esc(String(v.visit_time).slice(0,5))}</span></div>`).join('')}</section>`).join('');
  }

  function staffHome(button) {
    window.nav?.(button);
    app.innerHTML = heading('Dashboard klinik', 'Kelola booking, stok layanan, dan pasien rawat inap untuk shift ini.') + `
      <div class="grid"><section class="card"><h2>Operasional klinik</h2>
        <div class="list-item"><div><b>Booking kunjungan</b><small>Tinjau, ubah jadwal, dan ACC setelah kunjungan disepakati.</small></div><button class="primary" onclick="location='clinic-bookings.html'">Buka</button></div>
        <div class="list-item"><div><b>Pasien rawat inap</b><small>Pantau lama perawatan dan perbarui status pulang Pawrent.</small></div><button class="primary" onclick="location='clinic-inpatients.html'">Buka</button></div>
      </section><aside class="card"><h2>Akses cepat</h2><div class="quick">
        <button onclick="location='clinic-bookings.html'"><span>📋</span><b>Booking</b><small>Konfirmasi kunjungan</small></button>
        <button onclick="location='clinic-inventory.html'"><span>💊</span><b>Stok layanan</b><small>Obat dan perlengkapan</small></button>
        <button onclick="schedule()"><span>📅</span><b>Jadwal shift</b><small>Dokter jaga</small></button>
        <button onclick="consult()"><span>💬</span><b>Konsultasi</b><small>Pesan pawrent</small></button>
      </div></aside></div>`;
  }

  async function staffQueueHome(button) {
    window.nav?.(button);
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const dateTitle = new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'long', year:'numeric' }).format(today);
    app.innerHTML = heading('Dashboard klinik', 'Antrean kunjungan diperbarui dari pendaftaran langsung dan booking yang telah di-ACC.') + `<div class="grid"><section class="card"><h2>Kunjungan ${dateTitle}</h2><div class="clinic-empty">Memuat antrean hari ini…</div></section><aside class="card"><h2>Akses cepat</h2><div class="quick"><button onclick="location='clinic-bookings.html'"><span>📋</span><b>Booking</b><small>Konfirmasi kunjungan</small></button><button onclick="location='clinic-walkins.html'"><span>📝</span><b>Kunjungan langsung</b><small>Daftarkan Pawrent walk-in</small></button><button onclick="location='clinic-inventory.html'"><span>💊</span><b>Stok layanan</b><small>Obat dan perlengkapan</small></button><button onclick="location='clinic-inpatients.html'"><span>🏥</span><b>Rawat inap</b><small>Pasien dalam perawatan</small></button></div></aside></div>`;
    const [online, walkin] = await Promise.all([
      window.echavetDb.from('appointment_requests').select('pawrent_name,species,visit_time,purposes').eq('status','dikonfirmasi').eq('visit_date', localDate),
      window.echavetDb.from('walk_in_visits').select('owner_name,pet_name,species,visit_time,purposes,created_at').eq('status','menunggu').eq('visit_date', localDate)
    ]);
    const host = app.querySelector('.clinic-empty');
    if (online.error || walkin.error) { host.textContent = 'Antrean belum dapat dimuat. Pastikan SQL pembaruan sudah dijalankan.'; return; }
    const queue = [
      ...(online.data || []).map(x => ({ ...x, name:x.pawrent_name || 'Pawrent', kind:'Booking online', priority:0 })),
      ...(walkin.data || []).map(x => ({ ...x, name:x.pet_name || x.owner_name || 'Walk-in', kind:'Kunjungan langsung', priority:1 }))
    ].sort((a,b) => String(a.visit_time).localeCompare(String(b.visit_time)) || a.priority - b.priority);
    if (!queue.length) { host.textContent = 'Belum ada antrean kunjungan untuk hari ini.'; return; }
    host.outerHTML = queue.map((x, index) => `<div class="visit-row"><div><b>${index + 1}. ${esc(x.name)} · ${esc(x.species)}</b><small>${esc(x.kind)} · ${(x.purposes || []).map(esc).join(', ')}</small></div><span class="visit-time">${esc(String(x.visit_time).slice(0,5))}</span></div>`).join('');
  }

  window.home = function (button) { return isDoctor ? doctorHome(button) : staffQueueHome(button); };

  window.consult = async function (button) {
    window.nav?.(button);
    app.innerHTML = heading('Konsultasi Pawrent', 'Hanya percakapan yang sudah dimulai Pawrent yang ditampilkan di sini.') + '<section class="card"><div class="clinic-empty">Memuat pesan Pawrent…</div></section>';
    const auth = await window.echavetDb.auth.getUser();
    const [petResult, messageResult] = await Promise.all([
      window.echavetDb.from('pets').select('id,name,species,monitoring_code,owner_id'),
      window.echavetDb.from('consultation_messages').select('id,pet_id,sender_id,body,created_at').order('created_at')
    ]);
    if (petResult.error || messageResult.error) { app.querySelector('.clinic-empty').textContent = 'Pesan belum dapat dimuat.'; return; }
    const pets = new Map((petResult.data || []).map(p => [p.id, p]));
    const grouped = {};
    (messageResult.data || []).forEach(message => {
      const pet = pets.get(message.pet_id);
      if (!pet || message.sender_id !== pet.owner_id) return;
      (grouped[pet.id] ||= { pet, messages: [] }).messages.push(message);
    });
    const threads = Object.values(grouped).sort((a,b) => new Date(b.messages.at(-1).created_at) - new Date(a.messages.at(-1).created_at));
    const card = app.querySelector('.card');
    if (!threads.length) { card.innerHTML = '<div class="clinic-empty">Belum ada chat dari Pawrent.</div>'; return; }
    card.innerHTML = threads.map(thread => {
      const latest = thread.messages.at(-1);
      return `<div class="visit-row"><div><b>${esc(thread.pet.name)} · ${esc(thread.pet.species)}</b><small>Kode ${esc(thread.pet.monitoring_code || '-')} · ${thread.messages.length} pesan dari Pawrent<br>${esc(latest.body.slice(0,115))}</small></div><button class="primary" onclick="openClinicalChat('${thread.pet.id}')" aria-label="Buka chat dengan Pawrent">+</button></div>`;
    }).join('');
  };

  window.openClinicalChat = async function (petId) {
    const [petResult, messagesResult, authResult] = await Promise.all([
      window.echavetDb.from('pets').select('id,name,species,monitoring_code,owner_id').eq('id', petId).single(),
      window.echavetDb.from('consultation_messages').select('*').eq('pet_id', petId).order('created_at'),
      window.echavetDb.auth.getUser()
    ]);
    const pet = petResult.data, messages = messagesResult.data || [], staffId = authResult.data.user?.id;
    if (!pet) { window.toast?.('Data Pawrent tidak ditemukan.'); return; }
    app.innerHTML = heading(`Chat ${esc(pet.name)}`, `Kode ${esc(pet.monitoring_code || '-')} · ${esc(pet.species)}`) + `<section class="card"><div class="chat"><div class="msgs">${messages.map(m => `<div class="msg ${m.sender_id === pet.owner_id ? '' : 'me'}">${esc(m.body)}<small>${new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')}</div><form class="compose" onsubmit="sendClinicalMessage(event,'${pet.id}')"><input id="clinicalReply" required maxlength="4000" placeholder="Tulis balasan untuk Pawrent…"><button class="primary">Kirim</button></form></div></section>`;
  };

  window.sendClinicalMessage = async function (event, petId) {
    event.preventDefault();
    const body = document.getElementById('clinicalReply').value.trim();
    if (!body) return;
    const auth = await window.echavetDb.auth.getUser();
    const result = await window.echavetDb.from('consultation_messages').insert({ pet_id: petId, sender_id: auth.data.user.id, body }).select().single();
    if (result.error) { window.toast?.(result.error.message); return; }
    window.openClinicalChat(petId);
  };
  updateNotificationBadge();
  window.setInterval(updateNotificationBadge, 15000);
  if (isDoctor) window.home();
})();

/* Tampilan antrean staf: hari ini hingga tiga hari berikutnya. */
(function () {
  return;
  const previousHome = window.home;
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const dateLabel = value => new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'long', year:'numeric' }).format(new Date(`${value}T00:00:00`));
  const localDate = value => `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;

  async function fourDayQueue(button) {
    if (localStorage.getItem('echavetClinicRole') === 'doctor') return previousHome(button);
    window.nav?.(button);
    const app = document.getElementById('app');
    if (!app || !window.echavetDb) return;
    const today = new Date();
    const dates = Array.from({length:4}, (_, index) => localDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()+index)));
    app.innerHTML = `<div class="heading"><h1>Dashboard klinik</h1><p>Antrean kunjungan hari ini hingga tiga hari berikutnya, dari booking yang telah di-ACC dan pendaftaran langsung.</p></div><div class="grid"><section class="card"><h2>Antrean kunjungan 4 hari ke depan</h2><div class="clinic-empty">Memuat antrean kunjunganâ€¦</div></section><aside class="card"><h2>Akses cepat</h2><div class="quick"><button onclick="location='clinic-bookings.html'"><span>ðŸ“‹</span><b>Booking</b><small>Konfirmasi kunjungan</small></button><button onclick="location='clinic-walkins.html'"><span>ðŸ“</span><b>Kunjungan langsung</b><small>Daftarkan Pawrent walk-in</small></button><button onclick="location='clinic-inventory.html'"><span>ðŸ’Š</span><b>Stok layanan</b><small>Obat dan perlengkapan</small></button><button onclick="location='clinic-inpatients.html'"><span>ðŸ¥</span><b>Rawat inap</b><small>Pasien dalam perawatan</small></button></div></aside></div>`;
    const [online, walkin] = await Promise.all([
      window.echavetDb.from('appointment_requests').select('pawrent_name,species,visit_date,visit_time,purposes').eq('status','dikonfirmasi').gte('visit_date',dates[0]).lte('visit_date',dates[3]),
      window.echavetDb.from('walk_in_visits').select('owner_name,pet_name,species,visit_date,visit_time,purposes').eq('status','menunggu').gte('visit_date',dates[0]).lte('visit_date',dates[3])
    ]);
    const host = app.querySelector('.clinic-empty');
    if (online.error || walkin.error) { host.textContent='Antrean belum dapat dimuat. Pastikan SQL pembaruan sudah dijalankan.'; return; }
    const queue=[...(online.data||[]).map(item=>({...item,name:item.pawrent_name||'Pawrent',kind:'Booking online',priority:0})),...(walkin.data||[]).map(item=>({...item,name:item.pet_name||item.owner_name||'Walk-in',kind:'Kunjungan langsung',priority:1}))].sort((a,b)=>String(a.visit_date).localeCompare(String(b.visit_date))||String(a.visit_time).localeCompare(String(b.visit_time))||a.priority-b.priority);
    const byDate=queue.reduce((all,item)=>((all[item.visit_date] ||= []).push(item),all),{});
    host.outerHTML=dates.map((date,index)=>{const visits=byDate[date]||[];const relative=['Hari ini','Besok','Lusa','3 hari lagi'][index];return `<section class="queue-day"><h3 class="visit-date">${relative} Â· Kunjungan ${dateLabel(date)}</h3>${visits.length?visits.map((item,position)=>`<div class="visit-row"><div><b>${position+1}. ${esc(item.name)} Â· ${esc(item.species)}</b><small>${esc(item.kind)} Â· ${(item.purposes||[]).map(esc).join(', ')}</small></div><span class="visit-time">${esc(String(item.visit_time).slice(0,5))}</span></div>`).join(''):'<div class="clinic-empty">Belum ada antrean kunjungan.</div>'}</section>`}).join('');
  }
  window.home=fourDayQueue;
  if (localStorage.getItem('echavetClinicRole') !== 'doctor') fourDayQueue();
})();

/* Tampilan antrean yang rapi, dengan ikon HTML agar tidak rusak oleh encoding. */
(function () {
  if (!document.title.includes('Portal Klinik')) return;
  const oldHome=window.home;
  const esc=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const label=value=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T00:00:00`));
  const iso=value=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
  const style=document.createElement('style');
  style.textContent='.queue-day{padding:18px 0;border-top:1px solid var(--line)}.queue-day:first-of-type{border-top:0;padding-top:10px}.queue-day:last-of-type{padding-bottom:0}.queue-day .visit-date{margin:0 0 8px;color:var(--ink);font-size:18px}.queue-day .clinic-empty{padding:9px 0 2px;font-size:13px}.quick button span{display:block;margin-bottom:13px;font-size:27px;line-height:1}.nav #visitHistoryNav{display:flex;align-items:center;gap:12px;white-space:nowrap;padding:11px 12px;font-size:inherit;letter-spacing:normal;line-height:normal}.nav #visitHistoryNav .history-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;font-size:20px;line-height:1;flex:0 0 28px}';
  document.head.appendChild(style);
  const menu=document.querySelector('.nav');
  if(menu&&!document.getElementById('visitHistoryNav')){const button=document.createElement('button');button.id='visitHistoryNav';button.type='button';button.innerHTML='<span class="history-icon">&#128202;</span><span>Rekap kunjungan</span>';button.addEventListener('click',()=>location='clinic-visit-history.html');menu.appendChild(button)}
  async function home(button){
    if(localStorage.getItem('echavetClinicRole')==='doctor')return oldHome(button);
    window.nav?.(button);const app=document.getElementById('app');if(!app||!window.echavetDb)return;
    const now=new Date(),dates=Array.from({length:4},(_,i)=>iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+i)));
    app.innerHTML=`<div class="heading"><h1>Dashboard klinik</h1><p>Antrean kunjungan empat hari ke depan dari booking yang telah di-ACC dan pendaftaran langsung.</p></div><div class="grid"><section class="card"><h2>Antrean kunjungan</h2><div class="clinic-empty">Memuat antrean kunjungan...</div></section><aside class="card"><h2>Akses cepat</h2><div class="quick"><button onclick="location='clinic-bookings.html'"><span>&#128203;</span><b>Booking</b><small>Konfirmasi kunjungan</small></button><button onclick="location='clinic-walkins.html'"><span>&#128221;</span><b>Kunjungan langsung</b><small>Daftarkan Pawrent walk-in</small></button><button onclick="location='clinic-inventory.html'"><span>&#128138;</span><b>Stok layanan</b><small>Obat dan perlengkapan</small></button><button onclick="location='clinic-inpatients.html'"><span>&#127973;</span><b>Rawat inap</b><small>Pasien dalam perawatan</small></button></div></aside></div>`;
    const [online,walkin]=await Promise.all([window.echavetDb.from('appointment_requests').select('pawrent_name,species,visit_date,visit_time,purposes').eq('status','dikonfirmasi').gte('visit_date',dates[0]).lte('visit_date',dates[3]),window.echavetDb.from('walk_in_visits').select('owner_name,pet_name,species,visit_date,visit_time,purposes').eq('status','menunggu').gte('visit_date',dates[0]).lte('visit_date',dates[3])]);
    const host=app.querySelector('.clinic-empty');if(online.error||walkin.error){host.textContent='Antrean belum dapat dimuat. Pastikan SQL pembaruan sudah dijalankan.';return}
    const visits=[...(online.data||[]).map(x=>({...x,name:x.pawrent_name||'Pawrent',source:'Booking online',priority:0})),...(walkin.data||[]).map(x=>({...x,name:x.pet_name||x.owner_name||'Walk-in',source:'Kunjungan langsung',priority:1}))].sort((a,b)=>String(a.visit_date).localeCompare(String(b.visit_date))||String(a.visit_time).localeCompare(String(b.visit_time))||a.priority-b.priority);
    const grouped=visits.reduce((all,item)=>((all[item.visit_date] ||= []).push(item),all),{});
    host.outerHTML=dates.map(date=>{const items=grouped[date]||[];return `<section class="queue-day"><h3 class="visit-date">Kunjungan ${label(date)}</h3>${items.length?items.map((item,index)=>`<div class="visit-row"><div><b>${index+1}. ${esc(item.name)} &middot; ${esc(item.species)}</b><small>${esc(item.source)} &middot; ${(item.purposes||[]).map(esc).join(', ')}</small></div><span class="visit-time">${esc(String(item.visit_time).slice(0,5))}</span></div>`).join(''):'<div class="clinic-empty">Belum ada antrean kunjungan.</div>'}</section>`}).join('');
  }
  window.home=home;if(localStorage.getItem('echavetClinicRole')!=='doctor')home();
})();
