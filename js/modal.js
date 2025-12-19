// ===== Modal System =====

// สร้าง Modal Container
function createModalContainer() {
  const existingModal = document.getElementById('modal-overlay');
  if (existingModal) {
    return existingModal;
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  document.body.appendChild(overlay);
  
  // คลิกนอก modal เพื่อปิด
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  return overlay;
}

// ปิด Modal
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.innerHTML = '';
    }, 300);
  }
}

// แสดง Alert Modal
function showAlert(message, title = 'แจ้งเตือน', type = 'info') {
  const overlay = createModalContainer();
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-icon ${type}">${iconMap[type] || iconMap.info}</div>
        <p style="text-align: center; font-size: 1.1em;">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-primary" onclick="closeModal()">
          ตกลง
        </button>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
}

// แสดง Confirm Modal
function showConfirm(message, title = 'ยืนยัน', onConfirm, onCancel) {
  const overlay = createModalContainer();
  
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-icon warning">⚠️</div>
        <p style="text-align: center; font-size: 1.1em;">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" onclick="handleModalCancel()">
          ยกเลิก
        </button>
        <button class="modal-btn modal-btn-danger" onclick="handleModalConfirm()">
          ยืนยัน
        </button>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
  
  // ป้องกันการปิด modal เมื่อคลิกนอก modal
  // ต้องกดปุ่มเท่านั้น
  overlay.onclick = (e) => {
    // ไม่ทำอะไร - บังคับให้กดปุ่ม
    e.stopPropagation();
  };
  
  // Store callbacks
  window.modalConfirmCallback = onConfirm;
  window.modalCancelCallback = onCancel;
}

// Handle Confirm
function handleModalConfirm() {
  if (typeof window.modalConfirmCallback === 'function') {
    window.modalConfirmCallback();
  }
  closeModal();
}

// Handle Cancel
function handleModalCancel() {
  if (typeof window.modalCancelCallback === 'function') {
    window.modalCancelCallback();
  }
  closeModal();
}

// แสดง Success Modal
function showSuccess(message, title = 'สำเร็จ!') {
  showAlert(message, title, 'success');
}

// แสดง Error Modal
function showError(message, title = 'เกิดข้อผิดพลาด') {
  showAlert(message, title, 'error');
}

// แสดง Loading Modal
function showLoading(message = 'กำลังประมวลผล...') {
  const overlay = createModalContainer();
  
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-loading">
        <div class="modal-spinner"></div>
        <p style="font-size: 1.1em; color: #555;">${message}</p>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
}

// แสดง Booking Summary Modal
function showBookingSummary(bookingData) {
  const overlay = createModalContainer();
  
  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const {
    route = '-',
    time = '-',
    date = '-',
    name = '-',
    phone = '-',
    seats = 0,
    pricePerSeat = 0,
    totalPrice = 0,
    discount = 0,
    isMember = false
  } = bookingData;
  
  const discountHtml = discount > 0 ? `
    <div class="summary-item discount">
      <span class="label">🎁 ส่วนลดสมาชิก:</span>
      <span class="value">-฿${formatPrice(discount)}</span>
    </div>
  ` : '';
  
  overlay.innerHTML = `
    <div class="modal-box booking-summary-modal">
      <div class="modal-header success-header">
        <div class="success-icon">✅</div>
        <h3 class="modal-title">จองคิวสำเร็จ!</h3>
      </div>
      <div class="modal-body">
        <div class="booking-summary">
          <div class="summary-section">
            <h4 class="section-title">📋 ข้อมูลรอบรถ</h4>
            <div class="summary-item">
              <span class="label">🚐 เส้นทาง:</span>
              <span class="value">${route}</span>
            </div>
            <div class="summary-item">
              <span class="label">📅 วันที่:</span>
              <span class="value">${formatDate(date)}</span>
            </div>
            <div class="summary-item">
              <span class="label">🕐 เวลา:</span>
              <span class="value">${time} น.</span>
            </div>
          </div>
          
          <div class="summary-divider"></div>
          
          <div class="summary-section">
            <h4 class="section-title">👤 ข้อมูลผู้จอง</h4>
            <div class="summary-item">
              <span class="label">ชื่อ:</span>
              <span class="value">${name}</span>
            </div>
            <div class="summary-item">
              <span class="label">📞 เบอร์โทร:</span>
              <span class="value">${phone}</span>
            </div>
            <div class="summary-item">
              <span class="label">💺 จำนวนที่นั่ง:</span>
              <span class="value">${seats} ที่นั่ง</span>
            </div>
          </div>
          
          <div class="summary-divider"></div>
          
          <div class="summary-section">
            <h4 class="section-title">💰 ข้อมูลการชำระเงิน</h4>
            <div class="summary-item">
              <span class="label">ราคาต่อที่นั่ง:</span>
              <span class="value">฿${formatPrice(pricePerSeat)}</span>
            </div>
            <div class="summary-item">
              <span class="label">จำนวนที่นั่ง:</span>
              <span class="value">× ${seats}</span>
            </div>
            ${discountHtml}
            <div class="summary-item total">
              <span class="label"><strong>💵 ราคารวมทั้งหมด:</strong></span>
              <span class="value price-highlight">฿${formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
        
        <div class="booking-note">
          <p class="note-icon">📌</p>
          <div class="note-text">
            <p><strong>กรุณาเก็บข้อมูลการจองนี้ไว้</strong></p>
            <p>เพื่อใช้เป็นหลักฐานในการขึ้นรถ</p>
            <p class="contact-info">หากมีข้อสงสัย ติดต่อ: <strong>02-XXX-XXXX</strong></p>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn modal-btn-primary" onclick="handleBookingConfirm()">
          ✅ รับทราบแล้ว
        </button>
      </div>
    </div>
  `;
  
  overlay.classList.add('active');
  
  // ป้องกันการปิด modal เมื่อคลิกนอก modal
  // ต้องกดปุ่มยืนยันเท่านั้น
  overlay.onclick = (e) => {
    // ไม่ทำอะไร - บังคับให้กดปุ่มยืนยัน
    e.stopPropagation();
  };
}

// Handle Booking Confirm
function handleBookingConfirm() {
  closeModal();
  // Reload หรือ redirect ถ้าต้องการ
  // window.location.reload();
}

// Export functions
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showSuccess = showSuccess;
window.showError = showError;
window.showLoading = showLoading;
window.showBookingSummary = showBookingSummary;
window.handleBookingConfirm = handleBookingConfirm;
window.closeModal = closeModal;
window.handleModalConfirm = handleModalConfirm;
window.handleModalCancel = handleModalCancel;
