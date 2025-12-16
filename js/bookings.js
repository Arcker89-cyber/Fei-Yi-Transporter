import { db } from "./firebase.js";
import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allBookings = [];
let allTrips = [];

// ===== โหลดรอบรถเพื่อใช้ใน Filter =====
async function loadTripsForFilter() {
  try {
    const querySnapshot = await getDocs(collection(db, "trips"));
    const filterSelect = document.getElementById("filterTrip");
    
    querySnapshot.forEach((doc) => {
      const trip = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${trip.route} | ${trip.time}`;
      filterSelect.appendChild(option);
      
      // เก็บข้อมูลรอบรถไว้ใช้
      allTrips.push({ id: doc.id, ...trip });
    });
  } catch (error) {
    console.error("❌ Error loading trips:", error);
  }
}

// ===== โหลดรายการจองทั้งหมด =====
async function loadBookings() {
  const container = document.getElementById("bookingsList");
  container.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';

  try {
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    
    if (bookingsSnapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <h3>ยังไม่มีการจอง</h3>
          <p>รอลูกค้าจองคิว</p>
        </div>
      `;
      document.getElementById("bookingCount").textContent = "0 รายการ";
      return;
    }

    // เก็บข้อมูลทั้งหมด
    allBookings = [];
    bookingsSnapshot.forEach((doc) => {
      allBookings.push({ id: doc.id, ...doc.data() });
    });

    // เรียงตามวันที่จองล่าสุด
    allBookings.sort((a, b) => 
      new Date(b.bookingDate) - new Date(a.bookingDate)
    );

    displayBookings(allBookings);

  } catch (error) {
    console.error("❌ Error loading bookings:", error);
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

// ===== แสดงผลรายการจอง =====
function displayBookings(bookings) {
  const container = document.getElementById("bookingsList");
  
  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>ไม่พบรายการจอง</h3>
        <p>ลองเปลี่ยนเงื่อนไขการค้นหา</p>
      </div>
    `;
    document.getElementById("bookingCount").textContent = "0 รายการ";
    return;
  }

  let html = '<table class="data-table"><thead><tr>';
  html += '<th>วันที่จอง</th>';
  html += '<th>ชื่อผู้จอง</th>';
  html += '<th>เบอร์โทร</th>';
  html += '<th>เส้นทาง</th>';
  html += '<th>เวลา</th>';
  html += '<th>ที่นั่ง</th>';
  html += '<th>ราคา</th>';
  html += '<th>จัดการ</th>';
  html += '</tr></thead><tbody>';

  bookings.forEach((booking) => {
    const date = new Date(booking.bookingDate);
    const dateStr = date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });

    html += '<tr>';
    html += `<td>${dateStr}<br><small style="color: #7f8c8d;">${timeStr}</small></td>`;
    html += `<td><strong>${booking.customerName}</strong></td>`;
    html += `<td>📞 ${booking.customerPhone}</td>`;
    html += `<td>🚐 ${booking.route}</td>`;
    html += `<td>🕐 ${booking.time}</td>`;
    html += `<td>💺 ${booking.seats} ที่นั่ง</td>`;
    html += `<td><strong>฿${booking.totalPrice}</strong></td>`;
    html += `<td>
      <button class="btn-primary btn-small" onclick="showDetail('${booking.id}')">
        👁️ ดู
      </button>
    </td>`;
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
  
  document.getElementById("bookingCount").textContent = `${bookings.length} รายการ`;
}

// ===== แสดงรายละเอียดการจอง =====
window.showDetail = (bookingId) => {
  const booking = allBookings.find(b => b.id === bookingId);
  if (!booking) return;

  const date = new Date(booking.bookingDate);
  const dateStr = date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <div style="line-height: 1.8;">
      <p><strong>📅 วันที่จอง:</strong> ${dateStr}</p>
      <hr style="margin: 15px 0; border: none; border-top: 1px solid #e0e0e0;">
      
      <h3 style="color: #667eea; margin: 15px 0;">👤 ข้อมูลผู้จอง</h3>
      <p><strong>ชื่อ:</strong> ${booking.customerName}</p>
      <p><strong>📞 เบอร์โทร:</strong> ${booking.customerPhone}</p>
      
      <hr style="margin: 15px 0; border: none; border-top: 1px solid #e0e0e0;">
      
      <h3 style="color: #667eea; margin: 15px 0;">🚐 ข้อมูลการเดินทาง</h3>
      <p><strong>📍 เส้นทาง:</strong> ${booking.route}</p>
      <p><strong>🕐 เวลา:</strong> ${booking.time}</p>
      <p><strong>💺 จำนวนที่นั่ง:</strong> ${booking.seats} ที่นั่ง</p>
      
      <hr style="margin: 15px 0; border: none; border-top: 1px solid #e0e0e0;">
      
      <h3 style="color: #667eea; margin: 15px 0;">💰 ข้อมูลการชำระเงิน</h3>
      <p><strong>ราคารวม:</strong> <span style="font-size: 1.5em; color: #27ae60;">฿${booking.totalPrice}</span></p>
      <p><strong>สถานะ:</strong> <span class="status-badge active">${booking.status === 'confirmed' ? '✅ ยืนยันแล้ว' : '⏳ รอยืนยัน'}</span></p>
    </div>
  `;

  document.getElementById("bookingDetail").innerHTML = html;
  document.getElementById("detailModal").classList.add("active");
};

// ===== ปิด Modal =====
window.closeDetailModal = () => {
  document.getElementById("detailModal").classList.remove("active");
};

// ===== กรองข้อมูล =====
window.applyFilters = () => {
  const selectedTrip = document.getElementById("filterTrip").value;
  const selectedDate = document.getElementById("filterDate").value;
  const searchPhone = document.getElementById("searchPhone").value.trim();

  let filtered = [...allBookings];

  // กรองตามรอบรถ
  if (selectedTrip) {
    filtered = filtered.filter(b => b.tripId === selectedTrip);
  }

  // กรองตามวันที่
  if (selectedDate) {
    const filterDate = new Date(selectedDate);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    filtered = filtered.filter(b => {
      const bookingDate = new Date(b.bookingDate);
      return bookingDate >= filterDate && bookingDate < nextDay;
    });
  }

  // ค้นหาตามเบอร์โทร
  if (searchPhone) {
    filtered = filtered.filter(b => 
      b.customerPhone.includes(searchPhone)
    );
  }

  displayBookings(filtered);
};

// ===== รีเซ็ตตัวกรอง =====
window.resetFilters = () => {
  document.getElementById("filterTrip").value = "";
  document.getElementById("filterDate").value = "";
  document.getElementById("searchPhone").value = "";
  displayBookings(allBookings);
};

// ===== ปิด Modal เมื่อคลิกนอก =====
document.getElementById("detailModal").addEventListener("click", (e) => {
  if (e.target.id === "detailModal") {
    closeDetailModal();
  }
});

// ===== โหลดข้อมูลเมื่อเปิดหน้า =====
async function init() {
  await loadTripsForFilter();
  await loadBookings();
}

init();
