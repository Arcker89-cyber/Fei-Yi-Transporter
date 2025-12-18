// drivers.js - จัดการคนขับ

import { auth, db } from "./firebase.js";
import { requireAuth, logout } from "./auth.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== ตรวจสอบ Authentication =====
requireAuth();

// ===== Logout Button =====
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const confirmed = await showConfirm(
    'คุณต้องการออกจากระบบหรือไม่?',
    '🚪 ออกจากระบบ',
    '❓'
  );
  if (confirmed) {
    await logout();
  }
});

// ===== Global Variables =====
let allDrivers = [];

// ===== โหลดข้อมูลเมื่อเริ่มต้น =====
document.addEventListener('DOMContentLoaded', () => {
  loadDriverStats();
  loadDrivers();
  
  // Search
  document.getElementById('searchInput').addEventListener('input', function() {
    filterDrivers();
  });
  
  // Status Filter
  document.getElementById('statusFilter').addEventListener('change', function() {
    filterDrivers();
  });
});

// ===== โหลดสถิติ =====
async function loadDriverStats() {
  try {
    const querySnapshot = await getDocs(collection(db, "drivers"));
    
    let total = 0;
    let active = 0;
    let expiringSoon = 0;
    
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    querySnapshot.forEach((doc) => {
      const driver = doc.data();
      total++;
      
      if (driver.status === 'active') {
        active++;
      }
      
      // ตรวจสอบใบขับขี่ใกล้หมดอายุ (30 วัน)
      if (driver.licenseExpiry) {
        const expiryDate = new Date(driver.licenseExpiry);
        if (expiryDate <= thirtyDaysLater && expiryDate >= today) {
          expiringSoon++;
        }
      }
    });
    
    document.getElementById('totalDrivers').textContent = total;
    document.getElementById('activeDrivers').textContent = active;
    document.getElementById('expiringSoon').textContent = expiringSoon;
    
  } catch (error) {
    console.error("❌ Error loading stats:", error);
  }
}

// ===== โหลดรายการคนขับ =====
async function loadDrivers() {
  const container = document.getElementById('driversList');
  container.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
  
  try {
    const q = query(collection(db, "drivers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">👨‍✈️</div>
          <h3>ยังไม่มีคนขับ</h3>
          <p>เริ่มต้นโดยการเพิ่มคนขับใหม่</p>
        </div>
      `;
      return;
    }
    
    allDrivers = [];
    querySnapshot.forEach((docSnap) => {
      allDrivers.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    displayDrivers(allDrivers);
    
  } catch (error) {
    console.error("❌ Error loading drivers:", error);
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

// ===== แสดงรายการคนขับ =====
function displayDrivers(drivers) {
  const container = document.getElementById('driversList');
  
  if (drivers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>ไม่พบข้อมูล</h3>
        <p>ลองค้นหาด้วยคำค้นอื่น</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ชื่อ-นามสกุล</th>
            <th>เบอร์โทร</th>
            <th>เลขใบขับขี่</th>
            <th>วันหมดอายุ</th>
            <th>ประสบการณ์</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  drivers.forEach((driver) => {
    const statusBadge = driver.status === 'active' ? 
      '<span class="badge badge-success">✅ ใช้งาน</span>' : 
      '<span class="badge badge-danger">❌ ระงับ</span>';
    
    let expiryDisplay = '-';
    let expiryBadge = '';
    
    if (driver.licenseExpiry) {
      const expiryDate = new Date(driver.licenseExpiry);
      const formattedDate = expiryDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      if (expiryDate < today) {
        expiryBadge = '<span class="badge badge-danger">หมดอายุแล้ว!</span>';
        expiryDisplay = formattedDate;
      } else if (expiryDate <= thirtyDaysLater) {
        expiryBadge = '<span class="badge badge-warning">ใกล้หมดอายุ</span>';
        expiryDisplay = formattedDate;
      } else {
        expiryDisplay = formattedDate;
      }
    }
    
    const experienceDisplay = driver.experience ? `${driver.experience} ปี` : '-';
    
    html += `
      <tr>
        <td>
          <strong style="font-size: 1.05em;">👨‍✈️ ${driver.fullName}</strong>
        </td>
        <td>
          📞 ${driver.phone}
        </td>
        <td class="text-center">
          <code>${driver.licenseNumber}</code>
        </td>
        <td class="text-center">
          ${expiryDisplay}
          ${expiryBadge}
        </td>
        <td class="text-center">
          ${experienceDisplay}
        </td>
        <td class="text-center">
          ${statusBadge}
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-action btn-edit" onclick="openEditModal('${driver.id}')" title="แก้ไข">
              ✏️
            </button>
            <button class="btn-action btn-delete" onclick="deleteDriver('${driver.id}', '${driver.fullName}')" title="ลบ">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
}

// ===== กรองคนขับ =====
function filterDrivers() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  
  let filtered = allDrivers.filter(driver => {
    const matchSearch = !searchTerm || 
      driver.fullName.toLowerCase().includes(searchTerm) ||
      driver.phone.includes(searchTerm) ||
      driver.licenseNumber.toLowerCase().includes(searchTerm);
    
    const matchStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchSearch && matchStatus;
  });
  
  displayDrivers(filtered);
}

// ===== เปิด Modal เพิ่มคนขับ =====
window.openAddModal = () => {
  document.getElementById('modalTitle').textContent = '➕ เพิ่มคนขับใหม่';
  document.getElementById('driverForm').reset();
  document.getElementById('driverId').value = '';
  document.getElementById('status').checked = true;
  document.getElementById('driverModal').classList.add('active');
};

// ===== เปิด Modal แก้ไข =====
window.openEditModal = async (driverId) => {
  try {
    const driver = allDrivers.find(d => d.id === driverId);
    
    if (!driver) {
      await showError("ไม่พบข้อมูลคนขับ");
      return;
    }
    
    document.getElementById('modalTitle').textContent = '✏️ แก้ไขข้อมูลคนขับ';
    document.getElementById('driverId').value = driverId;
    document.getElementById('fullName').value = driver.fullName;
    document.getElementById('phone').value = driver.phone;
    document.getElementById('licenseNumber').value = driver.licenseNumber;
    document.getElementById('licenseExpiry').value = driver.licenseExpiry || '';
    document.getElementById('experience').value = driver.experience || '';
    document.getElementById('notes').value = driver.notes || '';
    document.getElementById('status').checked = driver.status === 'active';
    
    document.getElementById('driverModal').classList.add('active');
    
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด");
  }
};

// ===== ปิด Modal =====
window.closeDriverModal = () => {
  document.getElementById('driverModal').classList.remove('active');
};

// ===== บันทึกข้อมูล =====
document.getElementById('driverForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const driverId = document.getElementById('driverId').value;
  const data = {
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    licenseNumber: document.getElementById('licenseNumber').value.trim(),
    licenseExpiry: document.getElementById('licenseExpiry').value || null,
    experience: document.getElementById('experience').value ? Number(document.getElementById('experience').value) : null,
    notes: document.getElementById('notes').value.trim() || null,
    status: document.getElementById('status').checked ? 'active' : 'inactive'
  };
  
  // Validation
  if (!/^0[0-9]{9}$/.test(data.phone)) {
    await showWarning("เบอร์โทรศัพท์ไม่ถูกต้อง\n(ต้องเป็น 10 หลัก เริ่มต้นด้วย 0)");
    return;
  }
  
  try {
    if (driverId) {
      // Update
      const driverRef = doc(db, "drivers", driverId);
      await updateDoc(driverRef, data);
      await showSuccess("แก้ไขข้อมูลคนขับเรียบร้อย");
    } else {
      // Add
      data.createdAt = Timestamp.now();
      await addDoc(collection(db, "drivers"), data);
      await showSuccess("เพิ่มคนขับใหม่เรียบร้อย");
    }
    
    closeDriverModal();
    await loadDriverStats();
    await loadDrivers();
    
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
});

// ===== ลบคนขับ =====
window.deleteDriver = async (driverId, fullName) => {
  const confirmed = await showConfirm(
    `คุณต้องการลบคนขับ "${fullName}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`,
    '🗑️ ลบคนขับ',
    '⚠️'
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, "drivers", driverId));
    await showSuccess("ลบคนขับเรียบร้อย");
    
    await loadDriverStats();
    await loadDrivers();
    
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
};
