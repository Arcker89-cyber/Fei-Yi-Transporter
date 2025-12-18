import { db } from "./firebase.js";
import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { requireAuth, logout } from "./auth.js";

// ===== ตรวจสอบ Authentication =====
requireAuth().catch(() => {
  // จะ redirect ไป login อัตโนมัติใน auth.js
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

// ===== โหลดสถิติ Dashboard =====
async function loadDashboardStats() {
  try {
    // โหลดข้อมูลรอบรถ
    const tripsSnapshot = await getDocs(collection(db, "trips"));
    const totalTrips = tripsSnapshot.size;
    
    let activeTrips = 0;
    tripsSnapshot.forEach(doc => {
      if (doc.data().active) activeTrips++;
    });

    // โหลดข้อมูลการจองวันนี้
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    let todayBookings = 0;
    let totalSeatsBooked = 0;

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const bookingDate = new Date(booking.bookingDate);
      
      if (bookingDate >= today) {
        todayBookings++;
        totalSeatsBooked += booking.seats || 0;
      }
    });

    // แสดงผลสถิติ
    document.getElementById("totalTrips").textContent = totalTrips;
    document.getElementById("activeTrips").textContent = activeTrips;
    document.getElementById("totalBookings").textContent = todayBookings;
    document.getElementById("totalSeatsBooked").textContent = totalSeatsBooked;

  } catch (error) {
    console.error("❌ Error loading stats:", error);
  }
}

// ===== โหลดภาพรวมรอบรถ =====
async function loadTripsOverview() {
  const container = document.getElementById("tripsOverview");
  
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

    querySnapshot.forEach((doc) => {
      const trip = doc.data();
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

      html += `
        <div class="trip-card ${cardClass}">
          <div class="trip-info">
            <h3>🚐 ${trip.route}</h3>
            <p><strong>🕐 เวลา:</strong> ${trip.time}</p>
            <p><strong>💰 ราคา:</strong> ฿${trip.price}</p>
          </div>
          <div class="trip-status">
            ${statusBadge}
            <div class="seats-info ${seatsClass}">
              💺 ${trip.seats} ที่นั่งว่าง
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

// ===== โหลดการจองล่าสุด =====
async function loadRecentBookings() {
  const container = document.getElementById("recentBookings");
  
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
      return;
    }

    // เรียงตามวันที่จองล่าสุด
    const bookings = [];
    bookingsSnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });
    
    bookings.sort((a, b) => 
      new Date(b.bookingDate) - new Date(a.bookingDate)
    );

    // แสดง 5 รายการล่าสุด
    let html = '';
    const recentBookings = bookings.slice(0, 5);

    recentBookings.forEach((booking) => {
      const date = new Date(booking.bookingDate);
      const dateStr = date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      html += `
        <div class="booking-card">
          <h4>👤 ${booking.customerName}</h4>
          <p>📍 <strong>เส้นทาง:</strong> ${booking.route}</p>
          <p>🕐 <strong>เวลา:</strong> ${booking.time}</p>
          <p>📞 <strong>เบอร์:</strong> ${booking.customerPhone}</p>
          <p>💺 <strong>ที่นั่ง:</strong> ${booking.seats} ที่นั่ง | 💰 <strong>ราคา:</strong> ฿${booking.totalPrice}</p>
          <p style="color: #7f8c8d; font-size: 0.85em;">📅 ${dateStr}</p>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (error) {
    console.error("❌ Error loading bookings:", error);
    container.innerHTML = `
      <div class="empty-state">
        <p style="color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

// ===== โหลดข้อมูลเมื่อเปิดหน้า =====
async function init() {
  await loadDashboardStats();
  await loadTripsOverview();
  await loadRecentBookings();
}

init();
