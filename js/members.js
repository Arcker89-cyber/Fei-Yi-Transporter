import { db } from "./firebase.js";
import { 
  collection, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { requireAuth, logout } from "./auth.js";

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

let allMembers = []; // เก็บข้อมูลสมาชิกทั้งหมด

// ===== โหลดสถิติสมาชิก =====
async function loadMemberStats() {
  try {
    const membersSnapshot = await getDocs(collection(db, "members"));
    
    let totalMembers = 0;
    let activeMembers = 0;
    let totalPoints = 0;
    let totalBookings = 0;

    membersSnapshot.forEach((doc) => {
      const member = doc.data();
      totalMembers++;
      
      if (member.status === 'active') {
        activeMembers++;
      }
      
      totalPoints += member.points || 0;
      totalBookings += member.totalBookings || 0;
    });

    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('activeMembers').textContent = activeMembers;
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();

  } catch (error) {
    console.error("❌ Error loading member stats:", error);
  }
}

// ===== โหลดรายการสมาชิก =====
async function loadMembers() {
  const container = document.getElementById('membersList');
  
  try {
    const q = query(collection(db, "members"), orderBy("memberSince", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">⭐</div>
          <h3>ยังไม่มีสมาชิก</h3>
          <p>เริ่มต้นโดยการเพิ่มสมาชิกใหม่</p>
        </div>
      `;
      return;
    }

    allMembers = [];
    querySnapshot.forEach((doc) => {
      allMembers.push({ id: doc.id, ...doc.data() });
    });

    displayMembers(allMembers);

  } catch (error) {
    console.error("❌ Error loading members:", error);
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

// ===== แสดงรายการสมาชิก =====
function displayMembers(members) {
  const container = document.getElementById('membersList');
  
  if (members.length === 0) {
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
            <th>รหัสบัตร</th>
            <th>เบอร์โทร</th>
            <th>คะแนน</th>
            <th>การจอง</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Table Body
  members.forEach((member) => {
    const memberSince = new Date(member.memberSince);
    const dateStr = memberSince.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const statusBadge = member.status === 'active' ? 
      '<span class="badge badge-success">✅ ใช้งาน</span>' : 
      '<span class="badge badge-danger">❌ ระงับ</span>';

    html += `
      <tr>
        <td>
          <div class="member-name">
            <strong>${member.fullName}</strong>
            <small>สมัคร: ${dateStr}</small>
          </div>
        </td>
        <td class="text-center">
          <code>${member.idCard}</code>
        </td>
        <td>
          <div class="contact-info">
            <span>📞 ${member.phone}</span>
            <small>${member.email || '-'}</small>
          </div>
        </td>
        <td class="text-center">
          <span class="badge badge-points">💎 ${member.points || 0}</span>
        </td>
        <td class="text-center">
          <span class="badge badge-bookings">📋 ${member.totalBookings || 0}</span>
        </td>
        <td class="text-center">
          ${statusBadge}
        </td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-action btn-edit" onclick="openEditModal('${member.id}')" title="แก้ไข">
              ✏️
            </button>
            <button class="btn-action btn-delete" onclick="deleteMember('${member.id}', '${member.fullName}')" title="ลบ">
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

// ===== ค้นหาสมาชิก =====
function searchMembers(searchTerm, statusFilter) {
  let filtered = allMembers;

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(member => 
      member.fullName.toLowerCase().includes(term) ||
      member.phone.includes(term) ||
      member.idCard.includes(term) ||
      (member.email && member.email.toLowerCase().includes(term))
    );
  }

  // Filter by status
  if (statusFilter !== 'all') {
    filtered = filtered.filter(member => member.status === statusFilter);
  }

  displayMembers(filtered);
}

// ===== Event Listeners =====
document.getElementById('searchInput').addEventListener('input', function() {
  const searchTerm = this.value.trim();
  const statusFilter = document.getElementById('statusFilter').value;
  searchMembers(searchTerm, statusFilter);
});

document.getElementById('statusFilter').addEventListener('change', function() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  const statusFilter = this.value;
  searchMembers(searchTerm, statusFilter);
});

// ===== เปิด Modal แก้ไข =====
window.openEditModal = async (memberId) => {
  try {
    const member = allMembers.find(m => m.id === memberId);
    
    if (!member) {
      await showError("ไม่พบข้อมูลสมาชิก");
      return;
    }

    // กรอกข้อมูลในฟอร์ม
    document.getElementById("editMemberId").value = memberId;
    document.getElementById("editFullName").value = member.fullName;
    document.getElementById("editPhone").value = member.phone;
    document.getElementById("editEmail").value = member.email || '';
    document.getElementById("editPoints").value = member.points || 0;
    document.getElementById("editStatus").checked = member.status === 'active';

    // แสดง Modal
    document.getElementById("editModal").classList.add("active");

  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด");
  }
};

// ===== ปิด Modal =====
window.closeEditModal = () => {
  document.getElementById("editModal").classList.remove("active");
};

// ===== บันทึกการแก้ไข =====
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const memberId = document.getElementById("editMemberId").value;
  const data = {
    fullName: document.getElementById("editFullName").value,
    phone: document.getElementById("editPhone").value,
    email: document.getElementById("editEmail").value,
    points: Number(document.getElementById("editPoints").value),
    status: document.getElementById("editStatus").checked ? 'active' : 'inactive'
  };

  // Validation
  if (!/^0[0-9]{9}$/.test(data.phone)) {
    await showWarning("เบอร์โทรศัพท์ไม่ถูกต้อง\n(ต้องเป็น 10 หลัก เริ่มต้นด้วย 0)");
    return;
  }

  try {
    const memberRef = doc(db, "members", memberId);
    await updateDoc(memberRef, data);
    
    await showSuccess("แก้ไขข้อมูลเรียบร้อย");
    
    closeEditModal();
    
    // Reload data
    await loadMemberStats();
    await loadMembers();
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
});

// ===== ลบสมาชิก =====
window.deleteMember = async (memberId, memberName) => {
  const confirmed = await showConfirm(
    `คุณต้องการลบสมาชิก "${memberName}" หรือไม่?\n\n⚠️ การดำเนินการนี้ไม่สามารถยกเลิกได้`,
    '🗑️ ลบสมาชิก',
    '⚠️'
  );
  
  if (!confirmed) {
    return;
  }

  try {
    await deleteDoc(doc(db, "members", memberId));
    await showSuccess("ลบสมาชิกเรียบร้อย");
    
    // Reload data
    await loadMemberStats();
    await loadMembers();
  } catch (error) {
    console.error("❌ Error:", error);
    await showError("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
};

// ===== โหลดข้อมูลเมื่อเปิดหน้า =====
async function init() {
  await loadMemberStats();
  await loadMembers();
}

init();
