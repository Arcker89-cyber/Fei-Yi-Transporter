import { db } from "./firebase.js";
import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
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

// ===== Global Variables =====
let revenueChart = null;
let bookingsChart = null;

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

    // โหลดข้อมูลการจองทั้งหมด
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    
    // คำนวณสถิติ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    // เดือนนี้
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let todayBookings = 0;
    let totalSeatsBooked = 0;
    let todayRevenue = 0;
    let monthRevenue = 0;

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : null;
      const totalPrice = booking.totalPrice || 0;
      
      if (bookingDate) {
        // วันนี้
        if (bookingDate >= today && bookingDate < todayEnd) {
          todayBookings++;
          totalSeatsBooked += booking.seats || 0;
          todayRevenue += totalPrice;
        }
        
        // เดือนนี้
        if (bookingDate >= monthStart) {
          monthRevenue += totalPrice;
        }
      }
    });

    // แสดงผลสถิติ
    document.getElementById('totalTrips').textContent = totalTrips;
    document.getElementById('activeTrips').textContent = activeTrips;
    document.getElementById('totalBookings').textContent = todayBookings;
    document.getElementById('totalSeatsBooked').textContent = totalSeatsBooked;
    document.getElementById('todayRevenue').textContent = `฿${todayRevenue.toLocaleString()}`;
    document.getElementById('monthRevenue').textContent = `฿${monthRevenue.toLocaleString()}`;

  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// ===== สร้างกราฟรายได้ =====
async function createRevenueChart() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    
    // สร้างข้อมูล 7 วันย้อนหลัง
    const days = [];
    const revenues = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      let dayRevenue = 0;
      
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : null;
        
        if (bookingDate && bookingDate >= date && bookingDate < nextDate) {
          dayRevenue += booking.totalPrice || 0;
        }
      });
      
      // Format วันที่
      const dayLabel = date.toLocaleDateString('th-TH', { 
        day: '2-digit', 
        month: 'short' 
      });
      
      days.push(dayLabel);
      revenues.push(dayRevenue);
    }
    
    // สร้างกราฟ
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
      revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'รายได้ (บาท)',
          data: revenues,
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'รายได้: ฿' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '฿' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error("Error creating revenue chart:", error);
  }
}

// ===== สร้างกราฟยอดจอง =====
async function createBookingsChart() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    
    // สร้างข้อมูล 7 วันย้อนหลัง
    const days = [];
    const bookingCounts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      let count = 0;
      
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : null;
        
        if (bookingDate && bookingDate >= date && bookingDate < nextDate) {
          count++;
        }
      });
      
      // Format วันที่
      const dayLabel = date.toLocaleDateString('th-TH', { 
        day: '2-digit', 
        month: 'short' 
      });
      
      days.push(dayLabel);
      bookingCounts.push(count);
    }
    
    // สร้างกราฟ
    const ctx = document.getElementById('bookingsChart').getContext('2d');
    
    if (bookingsChart) {
      bookingsChart.destroy();
    }
    
    bookingsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'จำนวนการจอง',
          data: bookingCounts,
          backgroundColor: '#2563eb',
          borderColor: '#1e40af',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'จำนวนการจอง: ' + context.parsed.y + ' รายการ';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error("Error creating bookings chart:", error);
  }
}

// ===== แสดง Top 5 Routes =====
async function loadTopRoutes() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    const tripsSnapshot = await getDocs(collection(db, "trips"));
    
    // สร้าง map ของ trips
    const tripsMap = {};
    tripsSnapshot.forEach(doc => {
      tripsMap[doc.id] = doc.data();
    });
    
    // นับจำนวนการจองแต่ละรอบ
    const routeCounts = {};
    
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const tripId = booking.tripId;
      
      if (tripId && tripsMap[tripId]) {
        const route = tripsMap[tripId].route || 'ไม่ระบุ';
        const key = `${route}|${tripId}`;
        
        if (!routeCounts[key]) {
          routeCounts[key] = {
            route: route,
            time: tripsMap[tripId].time || '-',
            count: 0,
            revenue: 0
          };
        }
        
        routeCounts[key].count += 1;
        routeCounts[key].revenue += booking.totalPrice || 0;
      }
    });
    
    // แปลงเป็น array และเรียงลำดับ
    const topRoutes = Object.values(routeCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // แสดงผล
    const container = document.getElementById('topRoutes');
    
    if (topRoutes.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">ยังไม่มีข้อมูลการจอง</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>อันดับ</th>
            <th>เส้นทาง</th>
            <th>เวลา</th>
            <th style="text-align: center;">จำนวนการจอง</th>
            <th style="text-align: right;">รายได้รวม</th>
          </tr>
        </thead>
        <tbody>
          ${topRoutes.map((route, index) => `
            <tr>
              <td style="text-align: center;">
                ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
              </td>
              <td><strong>${route.route}</strong></td>
              <td>${route.time} น.</td>
              <td style="text-align: center;">${route.count} รายการ</td>
              <td style="text-align: right; color: #27ae60; font-weight: bold;">
                ฿${route.revenue.toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
  } catch (error) {
    console.error("Error loading top routes:", error);
    document.getElementById('topRoutes').innerHTML = 
      '<p style="text-align: center; padding: 40px; color: #e74c3c;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
}

// ===== โหลด Trips Overview =====
async function loadTripsOverview() {
  try {
    const tripsSnapshot = await getDocs(
      query(collection(db, "trips"), orderBy("time", "asc"), limit(5))
    );

    const container = document.getElementById('tripsOverview');
    
    if (tripsSnapshot.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">ยังไม่มีรอบรถ</p>';
      return;
    }

    let html = '<table class="data-table"><thead><tr><th>เส้นทาง</th><th>เวลา</th><th>ที่นั่ง</th><th>ราคา</th><th>สถานะ</th></tr></thead><tbody>';

    tripsSnapshot.forEach(doc => {
      const trip = doc.data();
      const statusBadge = trip.active 
        ? '<span class="status-badge active">เปิดใช้งาน</span>'
        : '<span class="status-badge inactive">ปิดใช้งาน</span>';

      html += `
        <tr>
          <td><strong>${trip.route}</strong></td>
          <td>${trip.time} น.</td>
          <td>${trip.seats} ที่นั่ง</td>
          <td>฿${trip.price?.toLocaleString()}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (error) {
    console.error("Error loading trips:", error);
  }
}

// ===== โหลดการจองล่าสุด =====
async function loadRecentBookings() {
  try {
    const bookingsSnapshot = await getDocs(
      query(collection(db, "bookings"), limit(5))
    );

    const container = document.getElementById('recentBookings');
    
    if (bookingsSnapshot.empty) {
      container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">ยังไม่มีการจอง</p>';
      return;
    }

    let html = '<table class="data-table"><thead><tr><th>วันที่จอง</th><th>ชื่อ</th><th>เส้นทาง</th><th>ที่นั่ง</th><th>ราคา</th></tr></thead><tbody>';

    bookingsSnapshot.forEach(doc => {
      const booking = doc.data();
      const date = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('th-TH') : '-';

      html += `
        <tr>
          <td>${date}</td>
          <td>${booking.name}</td>
          <td>${booking.route || '-'}</td>
          <td>${booking.seats} ที่นั่ง</td>
          <td style="color: #27ae60; font-weight: bold;">฿${(booking.totalPrice || 0).toLocaleString()}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (error) {
    console.error("Error loading recent bookings:", error);
  }
}

// ===== โหลดข้อมูลทั้งหมด =====
async function loadAllData() {
  await loadDashboardStats();
  await createRevenueChart();
  await createBookingsChart();
  await loadTopRoutes();
  await loadTripsOverview();
  await loadRecentBookings();
}

// เริ่มต้น
loadAllData();
