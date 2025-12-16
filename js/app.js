import { db } from "./firebase.js";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  query,
  where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== โหลดรอบรถจาก Firestore =====
async function loadTrips() {
  const tripSelect = document.getElementById("tripSelect");
  tripSelect.innerHTML = '<option value="">-- กรุณาเลือกรอบรถ --</option>';

  try {
    const q = query(collection(db, "trips"), where("active", "==", true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      tripSelect.innerHTML += '<option value="" disabled>ยังไม่มีรอบรถ</option>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const trip = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${trip.route} | ${trip.time} | ว่าง ${trip.seats} ที่นั่ง | ฿${trip.price}`;
      option.dataset.seats = trip.seats;
      option.dataset.price = trip.price;
      option.dataset.route = trip.route;
      option.dataset.time = trip.time;
      tripSelect.appendChild(option);
    });

    console.log("✅ โหลดรอบรถสำเร็จ");
  } catch (error) {
    console.error("❌ Error loading trips:", error);
    alert("เกิดข้อผิดพลาดในการโหลดรอบรถ");
  }
}

// ===== จองคิว =====
document.getElementById("bookBtn").addEventListener("click", async () => {
  const tripSelect = document.getElementById("tripSelect");
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const seatsInput = document.getElementById("seats");
  const requestedSeats = Number(seatsInput.value);

  // Validation
  if (!tripSelect.value) {
    alert("⚠️ กรุณาเลือกรอบรถ");
    return;
  }

  if (!name) {
    alert("⚠️ กรุณากรอกชื่อผู้จอง");
    return;
  }

  if (!phone || phone.length < 9) {
    alert("⚠️ กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
    return;
  }

  if (!requestedSeats || requestedSeats < 1) {
    alert("⚠️ กรุณากรอกจำนวนที่นั่ง");
    return;
  }

  const selectedOption = tripSelect.options[tripSelect.selectedIndex];
  const availableSeats = Number(selectedOption.dataset.seats);

  if (requestedSeats > availableSeats) {
    alert(`⚠️ ที่นั่งไม่พอ (เหลือ ${availableSeats} ที่นั่ง)`);
    return;
  }

  // ยืนยันการจอง
  const totalPrice = Number(selectedOption.dataset.price) * requestedSeats;
  const confirmMsg = `
📍 เส้นทาง: ${selectedOption.dataset.route}
🕐 เวลา: ${selectedOption.dataset.time}
👤 ชื่อ: ${name}
📞 เบอร์: ${phone}
💺 จำนวนที่นั่ง: ${requestedSeats}
💰 ราคารวม: ฿${totalPrice}

ยืนยันการจอง?
  `.trim();

  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    // บันทึกการจอง
    const bookingData = {
      tripId: tripSelect.value,
      route: selectedOption.dataset.route,
      time: selectedOption.dataset.time,
      customerName: name,
      customerPhone: phone,
      seats: requestedSeats,
      totalPrice: totalPrice,
      bookingDate: new Date().toISOString(),
      status: "confirmed"
    };

    await addDoc(collection(db, "bookings"), bookingData);

    // อัพเดทที่นั่งที่เหลือ
    const tripRef = doc(db, "trips", tripSelect.value);
    await updateDoc(tripRef, {
      seats: availableSeats - requestedSeats
    });

    // แสดงผลลัพธ์
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
      <h3>✅ จองสำเร็จ!</h3>
      <p><strong>หมายเลขการจอง:</strong> ${bookingData.bookingDate}</p>
      <p><strong>เส้นทาง:</strong> ${bookingData.route}</p>
      <p><strong>เวลา:</strong> ${bookingData.time}</p>
      <p><strong>ชื่อ:</strong> ${bookingData.customerName}</p>
      <p><strong>ที่นั่ง:</strong> ${bookingData.seats} ที่นั่ง</p>
      <p><strong>ราคารวม:</strong> ฿${bookingData.totalPrice}</p>
      <hr>
      <p style="color: #d32f2f;">⚠️ กรุณาชำระเงินก่อนขึ้นรถ</p>
    `;
    resultDiv.classList.remove("hidden");

    // Clear form
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    seatsInput.value = "";
    tripSelect.value = "";

    // Reload trips
    await loadTrips();

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    console.error("❌ Booking error:", error);
    alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }
});

// ===== โหลดรอบรถตอน page load =====
loadTrips();
