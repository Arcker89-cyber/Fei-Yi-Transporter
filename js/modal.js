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
          ตรง
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

// Export functions
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showSuccess = showSuccess;
window.showError = showError;
window.showLoading = showLoading;
window.closeModal = closeModal;
window.handleModalConfirm = handleModalConfirm;
window.handleModalCancel = handleModalCancel;
