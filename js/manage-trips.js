import { db } from "./firebase.js";
import { 
  collection, 
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { requireAuth, logout } from "./auth.js";

// ===== ตรวจสอบ Authentication =====
requireAuth().catch(() => {
  // จะ redirect ไป login อัตโนมัติ
});

// ===== Logout Button =====
document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
    await logout();
  }
});

// ===== เพิ่มรอบรถใหม่ =====
// ตั้งค่าวันที่เป็นวันนี้
const today = new Date().toISOString().split('T')[0];
document.getElementById("date").value = today;

document.getElementById("tripForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    route: document.getElementById("route").value,
    time: document.getElementById("time").value,
    date: document.getElementById("date").value,
    seats: Number(document.getElementById("seats").value),
    price: Number(document.getElementById("price").value),
    memberDiscount: Number(document.getElementById("memberDiscount").value),
    active: document.getElementById("active").checked,
    createdAt: new Date().toISOString()
  };

  // Validation
  if (data.seats < 1) {
    alert("⚠️ จำนวนที่นั่งต้องมากกว่า 0");
    return;
  }

  if (data.price < 0) {
    alert("⚠️ ราคาต้องไม่ติดลบ");
    return;
  }

  if (data.memberDiscount < 0 || data.memberDiscount > 100) {
    alert("⚠️ ส่วนลดสมาชิกต้องอยู่ระหว่าง 0-100%");
    return;
  }

  try {
    await addDoc(collection(db, "trips"), data);
    alert("✅ เพิ่มรอบรถเรียบร้อย");
    
    // Reset form
    document.getElementById("tripForm").reset();
    document.getElementById("active").checked = true;
    document.getElementById("memberDiscount").value = 10;
    
    // ตั้งค่าวันที่เป็นวันนี้
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").value = today;
    
    // Reload list
    await loadTrips();
  } catch (error) {
    console.error("❌ Error:", error);
    alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
});

// ===== โหลดรายการรอบรถ =====
async function loadTrips() {
  const container = document.getElementById("tripsList");
  container.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';

  try {
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🚐</div>
          <h3>ยังไม่มีรอบรถ</h3>
          <p>เริ่มต้นโดยการเพิ่มรอบรถใหม่</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>เส้นทาง</th>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>ราคา</th>
              <th>ส่วนลด</th>
              <th>ที่นั่ง</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
    `;

    querySnapshot.forEach((docSnap) => {
      const trip = docSnap.data();
      const tripId = docSnap.id;
      
      const isFull = trip.seats === 0;
      const isLowSeats = trip.seats > 0 && trip.seats <= 3;
      
      let statusBadge = trip.active ? 
        '<span class="badge badge-success">✅ เปิดใช้งาน</span>' : 
        '<span class="badge badge-danger">❌ ปิดใช้งาน</span>';
      
      if (isFull) {
        statusBadge = '<span class="badge badge-warning">⚠️ เต็ม</span>';
      }
      
      let seatsClass = '';
      let seatsBadge = 'badge-seats';
      if (isFull) {
        seatsClass = 'full';
        seatsBadge = 'badge-danger';
      } else if (isLowSeats) {
        seatsClass = 'low';
        seatsBadge = 'badge-warning';
      }

      const memberDiscount = trip.memberDiscount || 0;
      
      // แสดงวันที่
      let dateDisplay = '-';
      if (trip.date) {
        const tripDate = new Date(trip.date);
        dateDisplay = tripDate.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }

      html += `
        <tr>
          <td>
            <strong>🚐 ${trip.route}</strong>
          </td>
          <td class="text-center">
            ${dateDisplay}
          </td>
          <td class="text-center">
            <strong>🕐 ${trip.time}</strong>
          </td>
          <td class="text-center">
            <span class="badge badge-price">฿${trip.price}</span>
          </td>
          <td class="text-center">
            <span class="badge badge-discount">🎁 ${memberDiscount}%</span>
          </td>
          <td class="text-center">
            <span class="badge ${seatsBadge}">💺 ${trip.seats}</span>
          </td>
          <td class="text-center">
            ${statusBadge}
          </td>
          <td class="text-center">
            <div class="action-buttons">
              <button class="btn-action btn-edit" onclick="openEditModal('${tripId}')" title="แก้ไข">
                ✏️
              </button>
              <button class="btn-action btn-delete" onclick="deleteTrip('${tripId}', '${trip.route}')" title="ลบ">
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

  } catch (error) {
    console.error("❌ Error loading trips:", error);
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

// ===== เปิด Modal แก้ไข =====
window.openEditModal = async (tripId) => {
  try {
    // ดึงข้อมูลรอบรถ
    const querySnapshot = await getDocs(collection(db, "trips"));
    let tripData = null;
    
    querySnapshot.forEach((doc) => {
      if (doc.id === tripId) {
        tripData = doc.data();
      }
    });

    if (!tripData) {
      alert("❌ ไม่พบข้อมูลรอบรถ");
      return;
    }

    // กรอกข้อมูลในฟอร์ม
    document.getElementById("editTripId").value = tripId;
    document.getElementById("editRoute").value = tripData.route;
    document.getElementById("editTime").value = tripData.time;
    document.getElementById("editDate").value = tripData.date || new Date().toISOString().split('T')[0];
    document.getElementById("editSeats").value = tripData.seats;
    document.getElementById("editPrice").value = tripData.price;
    document.getElementById("editMemberDiscount").value = tripData.memberDiscount || 0;
    document.getElementById("editActive").checked = tripData.active;

    // แสดง Modal
    document.getElementById("editModal").classList.add("active");

  } catch (error) {
    console.error("❌ Error:", error);
    alert("เกิดข้อผิดพลาด");
  }
};

// ===== ปิด Modal =====
window.closeEditModal = () => {
  document.getElementById("editModal").classList.remove("active");
};

// ===== บันทึกการแก้ไข =====
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const tripId = document.getElementById("editTripId").value;
  const data = {
    route: document.getElementById("editRoute").value,
    time: document.getElementById("editTime").value,
    date: document.getElementById("editDate").value,
    seats: Number(document.getElementById("editSeats").value),
    price: Number(document.getElementById("editPrice").value),
    memberDiscount: Number(document.getElementById("editMemberDiscount").value),
    active: document.getElementById("editActive").checked
  };

  if (data.seats < 0) {
    alert("⚠️ จำนวนที่นั่งต้องไม่ติดลบ");
    return;
  }

  if (data.price < 0) {
    alert("⚠️ ราคาต้องไม่ติดลบ");
    return;
  }

  if (data.memberDiscount < 0 || data.memberDiscount > 100) {
    alert("⚠️ ส่วนลดสมาชิกต้องอยู่ระหว่าง 0-100%");
    return;
  }

  try {
    const tripRef = doc(db, "trips", tripId);
    await updateDoc(tripRef, data);
    
    alert("✅ แก้ไขรอบรถเรียบร้อย");
    closeEditModal();
    await loadTrips();
    
  } catch (error) {
    console.error("❌ Error:", error);
    alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
});

// ===== ลบรอบรถ =====
window.deleteTrip = async (tripId, route) => {
  const confirmMsg = `คุณแน่ใจหรือไม่ที่จะลบรอบรถ?\n\n📍 ${route}\n\n⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้`;
  
  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "trips", tripId));
    alert("✅ ลบรอบรถเรียบร้อย");
    await loadTrips();
    
  } catch (error) {
    console.error("❌ Error:", error);
    alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
};

// ===== ปิด Modal เมื่อคลิกนอก Modal =====
document.getElementById("editModal").addEventListener("click", (e) => {
  if (e.target.id === "editModal") {
    closeEditModal();
  }
});

// ===== โหลดรายการเมื่อเปิดหน้า =====
loadTrips();
