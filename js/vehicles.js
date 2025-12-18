// vehicles.js - จัดการรถ

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
requireAuth().catch(() => {
  // จะ redirect ไป login อัตโนมัติ
});

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
let allVehicles = [];

// ===== โหลดข้อมูลเมื่อเริ่มต้น =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadVehicleStats();
  await loadVehicles();
  
  // Search
  document.getElementById('searchInput').addEventListener('input', function() {
    filterVehicles();
  });
  
  // Type Filter
  document.getElementById('typeFilter').addEventListener('change', function() {
    filterVehicles();
  });
  
  // Status Filter
  document.getElementById('statusFilter').addEventListener('change', function() {
    filterVehicles();
  });
});

// ===== โหลดสถิติ =====
async function loadVehicleStats() {
  try {
    const querySnapshot = await getDocs(collection(db, "vehicles"));
    
    let total = 0;
    let active = 0;
    let totalSeats = 0;
    let vanCount = 0;
    
    querySnapshot.forEach((doc) => {
      const vehicle = doc.data();
      total++;
      
      if (vehicle.status === 'active') {
        active++;
        totalSeats += vehicle.seats || 0;
      }
      
      if (vehicle.vehicleType === 'van') {
        vanCount++;
      }
    });
    
    document.getElementById('totalVehicles').textContent = total;
    document.getElementById('activeVehicles').textContent = active;
    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('vanCount').textContent = vanCount;
    
  } catch (error) {
    console.error("❌ Error loading stats:", error);
  }
}

// ===== โหลดรายการรถ =====
async function loadVehicles() {
  const container = document.getElementById('vehiclesList');
  container.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
  
  try {
    const q = query(collection(db, "vehicles"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🚙</div>
          <h3>ยังไม่มีรถ</h3>
          <p>เริ่มต้นโดยการเพิ่มรถใหม่</p>
        </div>
      `;
      return;
    }
    
    allVehicles = [];
    querySnapshot.forEach((docSnap) => {
      allVehicles.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    displayVehicles(allVehicles);
    
  } catch (error) {
    console.error("❌ Error loading vehicles:", error);
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

// ===== แสดงรายการรถ =====
function displayVehicles(vehicles) {
  const container = document.getElementById('vehiclesList');
  
  if (vehicles.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>ไม่พบข้อมูล</h3>
        <p>ลองค้นหาด้วยคำค้นอื่น</p>
      </div>
    `;
    return;
  }
  
  const vehicleTypeLabels = {
    'van': '🚐 รถตู้',
    'bus': '🚌 รถบัส',
    'vip': '✨ รถ VIP'
  };
  
  let html = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ทะเบียนรถ</th>
            <th>ประเภท</th>
            <th>ยี่ห้อ/รุ่น</th>
            <th>ปี</th>
            <th>ที่นั่ง</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  vehicles.forEach((vehicle) => {
    const statusBadge = vehicle.status === 'active' ? 
      '<span class="badge badge-success">✅ ใช้งาน</span>' : 
      '<span class="badge badge-danger">❌ ระงับ</span>';
    
    const vehicleTypeLabel = vehicleTypeLabels[vehicle.vehicleType] || vehicle.vehicleType;
    
    html += `
      <tr>
        <td>
          <strong style="font-size: 1.1em;">${vehicle.licensePlate}</strong>
        </td>
        <td class="text-center">
          <span class="badge badge-info">${vehicleTypeLabel}</span>
        </td>
        <td>
          ${vehicle.brand || '-'}
        </td>
        <td class="text-center">
          ${vehicle.year || '-'}
        </td>
        <td class="text-center">
          <span class="badge badge-seats">💺 ${vehicle.seats}</span>
        </td>
        <td class="text-center">
          ${statusBadge}
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-action btn-edit" onclick="openEditModal('${vehicle.id}')" title="แก้ไข">
              ✏️
            </button>
            <button class="btn-action btn-delete" onclick="deleteVehicle('${vehicle.id}', '${vehicle.licensePlate}')" title="ลบ">
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

// ===== กรองรถ =====
function filterVehicles() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  
  let filtered = allVehicles.filter(vehicle => {
    const matchSearch = !searchTerm || 
      vehicle.licensePlate.toLowerCase().includes(searchTerm) ||
      (vehicle.brand && vehicle.brand.toLowerCase().includes(searchTerm));
    
    const matchType = typeFilter === 'all' || vehicle.vehicleType === typeFilter;
    const matchStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchSearch && matchType && matchStatus;
  });
  
  displayVehicles(filtered);
}

// ===== เปิด Modal เพิ่มรถ =====
window.openAddModal = () => {
  document.getElementById('modalTitle').textContent = '➕ เพิ่มรถใหม่';
  document.getElementById('vehicleForm').reset();
  document.getElementById('vehicleId').value = '';
  document.getElementById('status').checked = true;
  document.getElementById('vehicleModal').classList.add('active');
};

// ===== เปิด Modal แก้ไข =====
window.openEditModal = async (vehicleId) => {
  try {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) {
      await showError("ไม่พบข้อมูลรถ");
      return;
    }
    
    document.getElementById('modalTitle').textContent = '✏️ แก้ไขข้อมูลรถ';
    document.getElementById('vehicleId').value = vehicleId;
    document.getElementById('licensePlate').value = vehicle.licensePlate;
    document.getElementById('vehicleType').value = vehicle.vehicleType;
    document.getElementById('seats').value = vehicle.seats;
    document.getElementById('brand').value = vehicle.brand || '';
    document.getElementById('year').value = vehicle.year || '';
    document.getElementById('status').checked = vehicle.status === 'active';
    
    document.getElementById('vehicleModal').classList.add('active');
    
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด");
  }
};

// ===== ปิด Modal =====
window.closeVehicleModal = () => {
  document.getElementById('vehicleModal').classList.remove('active');
};

// ===== บันทึกข้อมูล =====
document.getElementById('vehicleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const vehicleId = document.getElementById('vehicleId').value;
  const data = {
    licensePlate: document.getElementById('licensePlate').value.trim(),
    vehicleType: document.getElementById('vehicleType').value,
    seats: Number(document.getElementById('seats').value),
    brand: document.getElementById('brand').value.trim() || null,
    year: document.getElementById('year').value ? Number(document.getElementById('year').value) : null,
    status: document.getElementById('status').checked ? 'active' : 'inactive'
  };
  
  // Validation
  if (!data.licensePlate) {
    await showWarning("กรุณากรอกทะเบียนรถ");
    return;
  }
  
  if (!data.vehicleType) {
    await showWarning("กรุณาเลือกประเภทรถ");
    return;
  }
  
  if (data.seats < 1 || data.seats > 50) {
    await showWarning("จำนวนที่นั่งต้องอยู่ระหว่าง 1-50");
    return;
  }
  
  try {
    if (vehicleId) {
      // Update
      const vehicleRef = doc(db, "vehicles", vehicleId);
      await updateDoc(vehicleRef, data);
      await showSuccess("แก้ไขข้อมูลรถเรียบร้อย");
    } else {
      // Add
      data.createdAt = Timestamp.now();
      await addDoc(collection(db, "vehicles"), data);
      await showSuccess("เพิ่มรถใหม่เรียบร้อย");
    }
    
    closeVehicleModal();
    await loadVehicleStats();
    await loadVehicles();
    
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
});

// ===== ลบรถ =====
window.deleteVehicle = async (vehicleId, licensePlate) => {
  const confirmed = await showConfirm(
    `คุณต้องการลบรถทะเบียน "${licensePlate}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`,
    '🗑️ ลบรถ',
    '⚠️'
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, "vehicles", vehicleId));
    await showSuccess("ลบรถเรียบร้อย");
    
    await loadVehicleStats();
    await loadVehicles();
    
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
};
