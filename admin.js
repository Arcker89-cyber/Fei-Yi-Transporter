import { db } from "./firebase.js";
import { 
  collection, 
  addDoc, 
  getDocs,
  orderBy,
  query 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("tripForm");
const tripListDiv = document.getElementById("tripList");

// ===== เพิ่มรอบรถ =====
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    route: document.getElementById("route").value,
    time: document.getElementById("time").value,
    seats: Number(document.getElementById("seats").value),
    price: Number(document.getElementById("price").value),
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

  try {
    await addDoc(collection(db, "trips"), data);
    alert("✅ เพิ่มรอบรถเรียบร้อย");
    form.reset();
    document.getElementById("active").checked = true;
    await loadTrips(); // โหลดรายการใหม่
  } catch (error) {
    console.error("❌ Error:", error);
    alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
  }
});

// ===== โหลดรายการรอบรถ =====
async function loadTrips() {
  tripListDiv.innerHTML = '<div class="loading"></div>';

  try {
    const q = query(collection(db, "trips"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      tripListDiv.innerHTML = '<p style="text-align:center; color:#999;">ยังไม่มีรอบรถ</p>';
      return;
    }

    let html = '<h3 style="color: #667eea; margin-bottom: 15px;">📋 รายการรอบรถทั้งหมด</h3>';

    querySnapshot.forEach((doc) => {
      const trip = doc.data();
      const statusClass = trip.active ? "" : "inactive";
      const statusText = trip.active ? "✅ เปิดใช้งาน" : "❌ ปิดใช้งาน";

      html += `
        <div class="trip-item ${statusClass}">
          <p><strong>🚐 เส้นทาง:</strong> ${trip.route}</p>
          <p><strong>🕐 เวลา:</strong> ${trip.time}</p>
          <p><strong>💺 ที่นั่ง:</strong> ${trip.seats} ที่นั่ง</p>
          <p><strong>💰 ราคา:</strong> ฿${trip.price}</p>
          <p><strong>สถานะ:</strong> ${statusText}</p>
        </div>
      `;
    });

    tripListDiv.innerHTML = html;
  } catch (error) {
    console.error("❌ Error loading trips:", error);
    tripListDiv.innerHTML = '<p style="color:red; text-align:center;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
}

// ===== โหลดข้อมูลตอน page load =====
loadTrips();
