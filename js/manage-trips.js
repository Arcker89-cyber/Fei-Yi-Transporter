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

    let html = '';

    querySnapshot.forEach((docSnap) => {
      const trip = docSnap.data();
      const tripId = docSnap.id;
      
      const isFull = trip.seats === 0;
      const isLowSeats = trip.seats > 0 && trip.seats <= 3;
      
      let cardClass = trip.active ? '' : 'inactive';
      if (isFull) cardClass = 'full';
      
      let statusBadge = trip.active ? 
        '<span class="status-badge active">✅ เปิดใช้งาน</span>' : 
        '<span class="status-badge inactive">❌ ปิดใช้งาน</span>';
      
      if (isFull) {
        statusBadge = '<span class="status-badge full">⚠️ เต็ม</span>';
      }
      
      let seatsClass = '';
      if (isFull) seatsClass = 'full';
      else if (isLowSeats) seatsClass = 'low';

      const memberDiscount = trip.memberDiscount || 0;
      
      // แสดงวันที่ถ้ามี
      let dateDisplay = '';
      if (trip.date) {
        const tripDate = new Date(trip.date);
        const formattedDate = tripDate.toLocaleDateString('th-TH', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        dateDisplay = `<p><strong>📅 วันที่:</strong> ${formattedDate}</p>`;
      }

      html += `
        <div class="trip-card ${cardClass}">
          <div class="trip-info">
            <h3>🚐 ${trip.route}</h3>
            ${dateDisplay}
            <p><strong>🕐 เวลา:</strong> ${trip.time}</p>
            <p><strong>💰 ราคา:</strong> ฿${trip.price}</p>
            <p><strong>🎁 ส่วนลดสมาชิก:</strong> ${memberDiscount}%</p>
            <p><strong>💺 ที่นั่งว่าง:</strong> <span class="seats-info ${seatsClass}">${trip.seats} ที่นั่ง</span></p>
          </div>
          <div class="trip-status">
            ${statusBadge}
            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button class="btn-primary btn-small" onclick="openEditModal('${tripId}')">
                ✏️ แก้ไข
              </button>
              <button class="btn-danger btn-small" onclick="deleteTrip('${tripId}', '${trip.route}')">
                🗑️ ลบ
              </button>
            </div>
          </div>
        </div>
      `;
    });

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
