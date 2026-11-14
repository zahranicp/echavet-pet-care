(function(){
  if(!document.title.includes('Portal Klinik'))return;
  const app=document.getElementById('app');
  let patients=[];
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const heading=(a,b)=>'<div class="heading"><h1>'+a+'</h1><p>'+b+'</p></div>';
  const markup='<section class="card formcard"><form onsubmit="saveInpatientMonitoring(event)"><div class="form"><div class="field wide"><label>Pasien & kode monitoring</label><select id="inpatientSelect" required onchange="loadInpatientDetails()"><option value="">Pilih pasien rawat inap</option></select></div><div class="field"><label>Spesies</label><input id="inpatientSpecies" readonly></div><div class="field"><label>Ruang rawat</label><input id="inpatientRoom" readonly></div><div class="field"><label>Suhu (°C)</label><input id="inTemp" required placeholder="Contoh: 38.4"></div><div class="field"><label>Berat (kg)</label><input id="inWeight" placeholder="Contoh: 4.2"></div><div class="field"><label>Makan</label><input id="inFood" placeholder="Contoh: Baik"></div><div class="field"><label>Minum</label><input id="inWater" placeholder="Contoh: Mau minum"></div><div class="field"><label>Pup</label><input id="inStool" placeholder="Contoh: Padat / normal"></div><div class="field"><label>Muntah</label><input id="inVomit" placeholder="Contoh: Tidak muntah"></div><div class="field"><label>Aktivitas</label><input id="inActivity" placeholder="Contoh: Aktif dan nyaman"></div><div class="field"><label>Obat / tindakan</label><input id="inTreatment" placeholder="Contoh: Observasi rutin"></div><div class="field wide"><label>Catatan untuk Pawrent</label><textarea id="inNotes" placeholder="Informasi perkembangan yang perlu diketahui Pawrent."></textarea></div></div><button class="primary">Simpan monitoring</button></form></section>';
  window.data=async function(button){
    window.nav?.(button);
    app.innerHTML=heading('Monitoring pasien rawat inap','Hanya pasien yang masih dirawat dapat diisi monitoringnya.')+'<div class="clinic-empty">Memuat pasien rawat inap…</div>';
    const r=await window.echavetDb.from('inpatient_stays').select('id,pet_name,species,room,monitoring_code').eq('status','dirawat').order('admitted_at');
    if(r.error){app.querySelector('.clinic-empty').textContent='Data pasien belum dapat dimuat.';return}
    patients=r.data||[];
    if(!patients.length){app.querySelector('.clinic-empty').textContent='Belum ada pasien rawat inap aktif.';return}
    app.querySelector('.clinic-empty').outerHTML=markup;
    inpatientSelect.innerHTML='<option value="">Pilih pasien rawat inap</option>'+patients.map(p=>'<option value="'+p.id+'">'+esc(p.pet_name)+' · '+esc(p.monitoring_code||'-')+'</option>').join('');
  };
  window.loadInpatientDetails=function(){let p=patients.find(x=>x.id===inpatientSelect.value);inpatientSpecies.value=p?.species||'';inpatientRoom.value=p?.room||'Belum dipilih'};
  window.saveInpatientMonitoring=async function(event){
    event.preventDefault();if(!inpatientSelect.value)return;
    const auth=await window.echavetDb.auth.getUser();
    const r=await window.echavetDb.from('inpatient_monitoring_logs').insert({inpatient_id:inpatientSelect.value,temperature:inTemp.value,weight:inWeight.value,food:inFood.value,water:inWater.value,stool:inStool.value,vomit:inVomit.value,activity:inActivity.value,treatment:inTreatment.value,notes:inNotes.value,recorded_by:auth.data.user?.id});
    if(r.error){window.toast?.(r.error.message);return}window.toast?.('Monitoring tersimpan dan diperbarui untuk Pawrent.');event.target.reset();inpatientSpecies.value='';inpatientRoom.value='';
  };
  const navButton=document.querySelector('.nav button[onclick*="data"]');
  if(navButton){navButton.textContent='🐾  Monitoring rawat inap';navButton.style.whiteSpace='nowrap';navButton.style.fontSize='16px'}
})();

/* Detail injeksi dicatat pada monitoring yang sama dan otomatis terbaca di rekap. */
(function(){
  if(!document.title.includes('Portal Klinik'))return;
  const previousData=window.data;
  window.data=async function(button){
    await previousData(button);
    const form=document.querySelector('form[onsubmit*="saveInpatientMonitoring"]');
    if(!form||document.getElementById('injectionGiven'))return;
    const treatment=form.querySelector('#inTreatment')?.closest('.field');
    if(!treatment)return;
    treatment.insertAdjacentHTML('afterend','<div class="field"><label>Status injeksi</label><select id="injectionGiven"><option value="false">Tidak ada injeksi</option><option value="true">Ada injeksi</option></select></div><div class="field"><label>Jenis injeksi</label><input id="injectionName" placeholder="Contoh: Bius sterilisasi / anti radang"></div><div class="field wide"><label>Catatan injeksi</label><input id="injectionNote" placeholder="Dosis atau informasi penting untuk rekam perawatan"></div>');
  };
  window.saveInpatientMonitoring=async function(event){
    event.preventDefault();if(!inpatientSelect.value)return;
    const given=injectionGiven.value==='true',name=injectionName.value.trim();
    if(given&&!name){window.toast?.('Isi jenis injeksi yang diberikan.');return}
    const auth=await window.echavetDb.auth.getUser();
    const result=await window.echavetDb.from('inpatient_monitoring_logs').insert({inpatient_id:inpatientSelect.value,temperature:inTemp.value,weight:inWeight.value,food:inFood.value,water:inWater.value,stool:inStool.value,vomit:inVomit.value,activity:inActivity.value,treatment:inTreatment.value,notes:inNotes.value,injection_given:given,injection_name:given?name:null,injection_note:given?injectionNote.value.trim():null,recorded_by:auth.data.user?.id});
    if(result.error){window.toast?.(result.error.message);return}
    window.toast?.('Monitoring dan detail tindakan tersimpan.');event.target.reset();inpatientSpecies.value='';inpatientRoom.value='';
  };
})();
