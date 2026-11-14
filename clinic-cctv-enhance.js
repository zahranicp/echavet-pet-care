(function(){
  if(!document.title.includes('CCTV Rawat Inap'))return;
  let cctvPatients=[];
  window.render=function(){
    rooms.innerHTML=allRooms.map((room,i)=>{const p=cctvPatients.find(x=>x.room===room);const details=p?p.pet_name+' · '+p.species+' · Kode '+p.monitoring_code:'Belum ada pasien rawat inap';const hint=p?(p.status==='menunggu_pulang'?'CCTV tetap aktif sampai '+new Date(p.cctv_until).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'CCTV siap untuk '+p.pet_name):'Preview CCTV '+room;return '<article class="room"><div class="preview"><video id="video'+i+'" autoplay muted playsinline></video><div class="empty" id="empty'+i+'"><img src="cctv-icon.png" alt="CCTV"><br><small>'+hint+'</small></div></div><div class="copy"><h2>'+room+'</h2><p>'+details+'</p>'+(p?'<button class="primary" onclick="start('+i+')">Nyalakan CCTV</button><button class="off" onclick="stop('+i+')">Matikan CCTV</button><span class="live" id="live'+i+'" hidden>LIVE</span>':'<span class="badge">Kamar kosong</span>')+'</div></article>'}).join('');
  };
  window.load=async function(){
    const now=new Date().toISOString();
    const r=await echavetDb.from('inpatient_stays').select('pet_name,species,room,monitoring_code,status,cctv_until').in('status',['dirawat','menunggu_pulang']);
    if(r.error){rooms.innerHTML='<p class="sub">Data CCTV belum dapat dimuat.</p>';return}
    cctvPatients=(r.data||[]).filter(p=>p.status==='dirawat'||(p.cctv_until&&p.cctv_until>now));
    document.querySelectorAll('video').forEach(video=>{const roomCard=video.closest('.room');const roomName=roomCard?.querySelector('h2')?.textContent;if(roomName&&!cctvPatients.some(p=>p.room===roomName)&&video.srcObject){video.srcObject.getTracks().forEach(track=>track.stop());video.srcObject=null;}});
    window.patients=cctvPatients;render();
  };
  load();
})();
