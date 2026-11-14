// Klien Supabase untuk website HTML statis Echavet.
// Publishable key aman dipakai di browser; RLS tetap menjaga setiap data.
(function () {
  // Skrip dipanggil dari <head>, jadi tunggu halaman selesai dibuat dahulu.
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.art') && document.querySelector('#sloganTitle')) {
      const style = document.createElement('style');
      style.textContent = ".art{background:linear-gradient(90deg,rgba(37,66,89,.92),rgba(37,66,89,.60)),url('pawrent-care-hero.png') center/cover no-repeat}";
      document.head.appendChild(style);
    }

    // Tambahkan akses operasional hanya pada dashboard klinik.
    const clinicalNav = document.querySelector('.layout .nav');
    const isClinicalDashboard = document.title.includes('Portal Klinik');
    if (clinicalNav && isClinicalDashboard && !document.getElementById('bookingStockNav')) {
      const bookingButton = document.createElement('button');
      bookingButton.id = 'bookingStockNav';
      bookingButton.type = 'button';
      bookingButton.textContent = '📋  Booking';
      bookingButton.addEventListener('click', () => { window.location.href = 'clinic-bookings.html'; });
      clinicalNav.appendChild(bookingButton);

      const inventoryButton = document.createElement('button');
      inventoryButton.id = 'inventoryNav';
      inventoryButton.type = 'button';
      inventoryButton.textContent = '💊  Stok layanan';
      inventoryButton.addEventListener('click', () => { window.location.href = 'clinic-inventory.html'; });
      clinicalNav.appendChild(inventoryButton);

      const inpatientButton = document.createElement('button');
      inpatientButton.id = 'inpatientNav';
      inpatientButton.type = 'button';
      inpatientButton.textContent = '🏥  Pasien rawat inap';
      inpatientButton.addEventListener('click', () => { window.location.href = 'clinic-inpatients.html'; });
      clinicalNav.appendChild(inpatientButton);

      const walkinButton = document.createElement('button');
      walkinButton.id = 'walkinNav';
      walkinButton.type = 'button';
      walkinButton.textContent = '📝  Kunjungan langsung';
      walkinButton.addEventListener('click', () => { window.location.href = 'clinic-walkins.html'; });
      clinicalNav.appendChild(walkinButton);

      const enhancement = document.createElement('script');
      enhancement.src = 'clinic-dashboard-enhance.js';
      document.head.appendChild(enhancement);
      const monitoringEnhancement = document.createElement('script');
      monitoringEnhancement.src = 'clinic-inpatient-monitoring.js';
      document.head.appendChild(monitoringEnhancement);
    }

    // Status rawat inap yang disimpan staf tampil di beranda Pawrent terkait.
    if (document.title.includes('Pawrent Portal') && window.echavetDb) {
      const consultationEnhancement = document.createElement('script');
      consultationEnhancement.src = 'pawrent-consult-enhance.js';
      document.head.appendChild(consultationEnhancement);
      const inpatientEnhancement = document.createElement('script');
      inpatientEnhancement.src = 'pawrent-inpatient-monitoring.js';
      document.head.appendChild(inpatientEnhancement);
      setTimeout(async () => {
        const auth = await window.echavetDb.auth.getUser();
        if (!auth.data.user) return;
        const result = await window.echavetDb
          .from('inpatient_stays')
          .select('pet_name,status,admitted_at,discharged_at')
          .eq('pawrent_id', auth.data.user.id)
          .order('admitted_at', { ascending: false })
          .limit(1);
        const stay = result.data?.[0];
        const app = document.getElementById('app');
        if (!stay || !app) return;
        const notice = document.createElement('div');
        notice.className = 'notice';
        notice.innerHTML = stay.status === 'pulang'
          ? `<b>${stay.pet_name} sudah dapat pulang.</b><br>Silakan hubungi EchaVet untuk proses kepulangan.`
          : `<b>${stay.pet_name} sedang menjalani rawat inap.</b><br>Status perawatan diperbarui langsung oleh tim EchaVet.`;
        app.prepend(notice);
      }, 0);
    }

    if (document.title.includes('Kunjungan Langsung')) {
      const tidyPurpose = document.createElement('style');
      tidyPurpose.textContent = '#purposes{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#purposes label{min-height:58px;padding:0 18px;display:flex;align-items:center;justify-content:flex-start;gap:12px;text-align:left;line-height:1.35}#purposes input{margin:0;flex:0 0 auto;width:18px;height:18px;accent-color:#367354}#bookingSlotNotice{grid-column:1/-1;margin:-6px 0 2px;color:#a84a39;font-size:12px;line-height:1.45}@media(max-width:620px){#purposes{grid-template-columns:1fr}}';
      document.head.appendChild(tidyPurpose);

      const dateInput = document.getElementById('visitDate');
      const timeInput = document.getElementById('visitTime');
      const visitForm = document.getElementById('form');
      if (dateInput && timeInput && visitForm && window.echavetDb) {
        const notice = document.createElement('p');
        notice.id = 'bookingSlotNotice';
        timeInput.closest('.field').after(notice);
        let bookedTimes = new Set();
        const refreshBookedTimes = async () => {
          const date = dateInput.value;
          bookedTimes = new Set();
          timeInput.disabled = true;
          notice.textContent = date ? 'Memeriksa jam yang sudah dibooking Pawrentâ€¦' : '';
          if (!date) { timeInput.disabled = false; return; }
          const result = await window.echavetDb.from('appointment_requests').select('visit_time').eq('status','dikonfirmasi').eq('visit_date',date);
          if (date !== dateInput.value) return;
          timeInput.disabled = false;
          if (result.error) { notice.textContent = 'Slot booking online belum dapat dimuat. Coba pilih ulang tanggal.'; return; }
          bookedTimes = new Set((result.data || []).map(item => String(item.visit_time).slice(0,5)));
          notice.textContent = bookedTimes.size ? `Jam ${Array.from(bookedTimes).sort().join(', ')} sudah dibooking Pawrent dan tidak tersedia untuk kunjungan langsung.` : 'Belum ada jam booking online pada tanggal ini.';
          if (bookedTimes.has(timeInput.value)) timeInput.value = '';
        };
        const rejectBookedTime = event => {
          if (!bookedTimes.has(timeInput.value)) return false;
          event?.preventDefault();
          event?.stopImmediatePropagation();
          timeInput.value = '';
          notice.textContent = 'Jam tersebut sudah dibooking Pawrent. Pilih jam kunjungan lain.';
          timeInput.focus();
          return true;
        };
        dateInput.addEventListener('change', refreshBookedTimes);
        timeInput.addEventListener('change', rejectBookedTime);
        visitForm.addEventListener('submit', rejectBookedTime, true);
        refreshBookedTimes();
      }
    }

    if (document.title.includes('CCTV Rawat Inap')) {
      const cctvEnhancement = document.createElement('script');
      cctvEnhancement.src = 'clinic-cctv-enhance.js';
      document.head.appendChild(cctvEnhancement);
    }
  });

  const config = window.PAWTALK_CONFIG;
  if (!config?.supabaseUrl || !config?.supabasePublishableKey || !window.supabase) {
    window.echavetDb = null;
    return;
  }

  window.echavetDb = window.supabase.createClient(
    config.supabaseUrl,
    config.supabasePublishableKey
  );

  window.echavetHistory = {
    async latestMonitoring(petId) {
      return window.echavetDb
        .from('monitoring_logs')
        .select('*')
        .eq('pet_id', petId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    },

    async addMonitoring(log) {
      return window.echavetDb.from('monitoring_logs').insert(log).select().single();
    },

    async messages(petId) {
      return window.echavetDb
        .from('consultation_messages')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: true });
    },

    async addMessage(message) {
      return window.echavetDb
        .from('consultation_messages')
        .insert(message)
        .select()
        .single();
    },
  };
})();
