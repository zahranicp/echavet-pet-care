(function(){
  if(!document.title.includes('Pawrent Portal'))return;
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function getStay(){
    const code=localStorage.getItem('echavetPetCode')||'';
    const r=await window.echavetDb.from('inpatient_stays').select('*').eq('monitoring_code',code).in('status',['dirawat','menunggu_pulang']).maybeSingle();
    const stay=r.data;
    if(stay?.status==='menunggu_pulang' && stay.cctv_until && new Date(stay.cctv_until)<=new Date()) return null;
    return stay;
  }
  window.camera=async function(button){
    window.nav?.(button);
    const app=document.getElementById('app');app.innerHTML='<div class="heading"><h1>CCTV rawat inap</h1><p>Memuat pemantauan kamar…</p></div><section class="card"><p class="sub">Memuat data…</p></section>';
    const stay=await getStay();if(!stay){app.querySelector('.card').innerHTML='<p class="sub">Belum ada pemantauan rawat inap aktif untuk kode ini.</p>';return}
    const logs=await window.echavetDb.from('inpatient_monitoring_logs').select('*').eq('inpatient_id',stay.id).order('recorded_at',{ascending:false}).limit(1);
    const latest=logs.data?.[0];
    app.innerHTML='<div class="heading"><h1>CCTV rawat inap</h1><p>'+esc(stay.pet_name)+' · Ruang '+esc(stay.room||'-')+' · Kode '+esc(stay.monitoring_code)+'</p></div><div class="grid"><section class="card"><h2>Monitoring kamera · '+esc(stay.room||'Ruang rawat')+'</h2><div class="camera"><div class="cam-copy"><span>🎥</span><p>Feed CCTV untuk '+esc(stay.pet_name)+' akan tampil dari kamera ruang '+esc(stay.room||'rawat')+'.</p></div></div></section><aside class="card"><h2>Pembaruan staf terbaru</h2><p class="sub">'+(latest?'<b>Suhu:</b> '+esc(latest.temperature||'-')+' °C<br><b>Makan:</b> '+esc(latest.food||'-')+'<br><b>Minum:</b> '+esc(latest.water||'-')+'<br><b>Aktivitas:</b> '+esc(latest.activity||'-')+'<br><br>'+esc(latest.notes||'Tidak ada catatan tambahan.'):'Belum ada monitoring yang diinput staf.')+'</p></aside></div>';
  };
  window.setInterval(()=>{ if(document.querySelector('.heading h1')?.textContent==='CCTV rawat inap') window.camera(); },10000);
})();
