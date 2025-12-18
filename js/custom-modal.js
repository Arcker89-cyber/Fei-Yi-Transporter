// custom-modal.js - Custom Modal สำหรับแทน alert() และ confirm()

// ===== สร้าง Modal HTML =====
function createModalHTML() {
  // ตรวจสอบว่ามี modal อยู่แล้วหรือยัง
  if (document.getElementById('customModal')) return;

  const modalHTML = `
    <!-- Custom Modal -->
    <div id="customModal" class="custom-modal">
      <div class="custom-modal-overlay"></div>
      <div class="custom-modal-content">
        <div class="custom-modal-icon" id="modalIcon"></div>
        <div class="custom-modal-body">
          <h3 id="modalTitle"></h3>
          <p id="modalMessage"></p>
        </div>
        <div class="custom-modal-footer" id="modalFooter">
          <!-- Buttons will be added here -->
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== แสดง Alert =====
function showAlert(message, title = '📢 แจ้งเตือน', icon = '💬') {
  return new Promise((resolve) => {
    createModalHTML();
    
    const modal = document.getElementById('customModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalFooter = document.getElementById('modalFooter');

    // ตั้งค่าเนื้อหา
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    // ปุ่ม OK
    modalFooter.innerHTML = `
      <button class="modal-btn modal-btn-primary" id="modalOkBtn">
        ✅ ตลอด
      </button>
    `;

    // แสดง modal
    modal.classList.add('active');

    // Event: ปุ่ม OK
    document.getElementById('modalOkBtn').addEventListener('click', function() {
      modal.classList.remove('active');
      resolve(true);
    });

    // Event: คลิกนอก modal
    modal.querySelector('.custom-modal-overlay').addEventListener('click', function() {
      modal.classList.remove('active');
      resolve(true);
    });
  });
}

// ===== แสดง Confirm =====
function showConfirm(message, title = '❓ ยืนยันการทำงาน', icon = '⚠️') {
  return new Promise((resolve) => {
    createModalHTML();
    
    const modal = document.getElementById('customModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalFooter = document.getElementById('modalFooter');

    // ตั้งค่าเนื้อหา
    modalIcon.textContent = icon;
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    // ปุ่ม Confirm + Cancel
    modalFooter.innerHTML = `
      <button class="modal-btn modal-btn-secondary" id="modalCancelBtn">
        ❌ ยกเลิก
      </button>
      <button class="modal-btn modal-btn-danger" id="modalConfirmBtn">
        ✅ ยืนยัน
      </button>
    `;

    // แสดง modal
    modal.classList.add('active');

    // Event: ปุ่ม Confirm
    document.getElementById('modalConfirmBtn').addEventListener('click', function() {
      modal.classList.remove('active');
      resolve(true);
    });

    // Event: ปุ่ม Cancel
    document.getElementById('modalCancelBtn').addEventListener('click', function() {
      modal.classList.remove('active');
      resolve(false);
    });

    // Event: คลิกนอก modal
    modal.querySelector('.custom-modal-overlay').addEventListener('click', function() {
      modal.classList.remove('active');
      resolve(false);
    });
  });
}

// ===== แสดง Success =====
function showSuccess(message, title = '✅ สำเร็จ') {
  return showAlert(message, title, '✅');
}

// ===== แสดง Error =====
function showError(message, title = '❌ ข้อผิดพลาด') {
  return showAlert(message, title, '❌');
}

// ===== แสดง Warning =====
function showWarning(message, title = '⚠️ คำเตือน') {
  return showAlert(message, title, '⚠️');
}

// Export functions
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
