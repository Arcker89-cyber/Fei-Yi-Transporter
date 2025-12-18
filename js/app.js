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
    // โหลดรอบรถที่ active = true
    const q = query(
      collection(db, "trips"), 
      where("active", "==", true)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      tripSelect.innerHTML += '<option value="" disabled>ยังไม่มีรอบรถที่พร้อมให้บริการ</option>';
      return;
    }

    // เรียงข้อมูลตามวันที่และเวลา (ถ้ามี)
    const trips = [];
    querySnapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() });
    });

    trips.sort((a, b) => {
      // ถ้ามีวันที่ให้เรียงตามวันที่
      if (a.date && b.date && a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // ถ้าไม่มีวันที่หรือวันที่เหมือนกัน ให้เรียงตามเวลา
      return a.time.localeCompare(b.time);
    });

    // แสดงรายการรอบรถ
    trips.forEach(trip => {
      const option = document.createElement("option");
      option.value = trip.id;
      
      // สร้างข้อความแสดงรอบรถ
      let displayText = '';
      
      // ถ้ามีวันที่ ให้แสดงวันที่
      if (trip.date) {
        const tripDate = new Date(trip.date);
        const formattedDate = tripDate.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short'
        });
        displayText += `${formattedDate} | `;
      }
      
      // แสดงข้อมูลรอบรถ
      const routeName = trip.route || trip.routeName || 'ไม่ระบุเส้นทาง';
      displayText += `${trip.time} | ${routeName} | ${trip.seats} ที่ | ฿${trip.price}`;
      
      option.textContent = displayText;
      option.dataset.seats = trip.seats;
      option.dataset.price = trip.price;
      option.dataset.memberDiscount = trip.memberDiscount || 0;
      option.dataset.route = routeName;
      option.dataset.time = trip.time;
      option.dataset.date = trip.date || new Date().toISOString().split('T')[0]; // ถ้าไม่มี date ใช้วันนี้
      tripSelect.appendChild(option);
    });

    console.log("✅ โหลดรอบรถสำเร็จ:", trips.length, "รอบ");
  } catch (error) {
    console.error("❌ Error loading trips:", error);
    showError("เกิดข้อผิดพลาดในการโหลดรอบรถ", "ผิดพลาด");
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
    showError("กรุณาเลือกรอบรถ", "แจ้งเตือน");
    return;
  }

  if (!name) {
    showError("กรุณากรอกชื่อผู้จอง", "แจ้งเตือน");
    return;
  }

  if (!phone || phone.length !== 10 || !/^0[0-9]{9}$/.test(phone)) {
    showError("กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง", "แจ้งเตือน");
    return;
  }

  if (!requestedSeats || requestedSeats < 1) {
    showError("กรุณากรอกจำนวนที่นั่ง", "แจ้งเตือน");
    return;
  }

  const selectedOption = tripSelect.options[tripSelect.selectedIndex];
  const availableSeats = Number(selectedOption.dataset.seats);

  if (requestedSeats > availableSeats) {
    showError(`ที่นั่งไม่พอ<br>ที่นั่งว่าง: ${availableSeats} ที่นั่ง<br>คุณต้องการจอง: ${requestedSeats} ที่นั่ง`, "ที่นั่งไม่พอ");
    return;
  }

  try {
    // ตรวจสอบประเภทลูกค้า (customer หรือ member)
    const isMemberBooking = window.currentPriceType === 'member';
    let memberData = null;

    // ถ้าเลือกจองแบบสมาชิก ต้องตรวจสอบว่าเป็นสมาชิกจริง
    if (isMemberBooking) {
      showLoading("กำลังตรวจสอบสมาชิก...");
      
      const memberQuery = query(
        collection(db, "members"), 
        where("phone", "==", phone)
      );
      const memberSnapshot = await getDocs(memberQuery);
      
      closeModal();

      if (memberSnapshot.empty) {
        // ไม่พบสมาชิก
        showConfirm(
          `ไม่พบข้อมูลสมาชิกของเบอร์ ${phone}<br><br>
          คุณต้องการ:<br>
          • <strong>สมัครสมาชิก</strong> เพื่อรับส่วนลด<br>
          • หรือ <strong>จองแบบทั่วไป</strong> (ราคาเต็ม)`,
          "⚠️ ไม่พบข้อมูลสมาชิก",
          () => {
            // ไปหน้าสมัครสมาชิก
            window.location.href = "register-member.html";
          },
          () => {
            // เปลี่ยนเป็นลูกค้าทั่วไป
            document.querySelector('.customer-btn').classList.add('active');
            document.querySelector('.member-btn').classList.remove('active');
            window.currentPriceType = 'customer';
            updatePriceDisplay();
            showAlert("เปลี่ยนเป็นลูกค้าทั่วไป (ราคาเต็ม) แล้ว<br>กรุณากดจองคิวอีกครั้ง", "แจ้งเตือน", "info");
          }
        );
        return;
      }

      // พบสมาชิก
      memberData = memberSnapshot.docs[0].data();
      memberData.id = memberSnapshot.docs[0].id;
    }

    // คำนวณราคา
    const basePrice = Number(selectedOption.dataset.price);
    const memberDiscount = Number(selectedOption.dataset.memberDiscount) || 0;
    const discountAmount = isMemberBooking ? Math.round(basePrice * (memberDiscount / 100)) : 0;
    const pricePerSeat = basePrice - discountAmount;
    const totalPrice = pricePerSeat * requestedSeats;
    const totalDiscount = discountAmount * requestedSeats;

    // ข้อมูลการจอง
    const tripDate = new Date(selectedOption.dataset.date);
    const formattedDate = tripDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // สร้างข้อความยืนยัน
    let confirmMsg = `
      <div style="text-align: left;">
        <p><strong>📅 วันที่:</strong> ${formattedDate}</p>
        <p><strong>🕐 เวลา:</strong> ${selectedOption.dataset.time}</p>
        <p><strong>📍 เส้นทาง:</strong> ${selectedOption.dataset.route}</p>
        <p><strong>👤 ชื่อ:</strong> ${name}</p>
        <p><strong>📞 เบอร์:</strong> ${phone}</p>
        <p><strong>💺 จำนวนที่นั่ง:</strong> ${requestedSeats} ที่นั่ง</p>
        <hr style="margin: 15px 0;">
        <p><strong>💰 ราคาต่อที่นั่ง:</strong> ฿${basePrice.toLocaleString()}</p>
    `;

    if (isMemberBooking && totalDiscount > 0) {
      confirmMsg += `
        <p style="color: #27ae60;"><strong>🎁 ส่วนลดสมาชิก:</strong> -฿${totalDiscount.toLocaleString()} (${memberDiscount}%)</p>
      `;
    }

    confirmMsg += `
        <p style="font-size: 1.2em; color: #667eea;"><strong>รวมทั้งสิ้น:</strong> ฿${totalPrice.toLocaleString()}</p>
      </div>
    `;

    // ยืนยันการจอง
    showConfirm(
      confirmMsg,
      "🎫 ยืนยันการจอง",
      async () => {
        try {
          showLoading("กำลังบันทึกการจอง...");

          // บันทึกการจอง
          const bookingData = {
            tripId: tripSelect.value,
            date: selectedOption.dataset.date,
            route: selectedOption.dataset.route,
            time: selectedOption.dataset.time,
            customerName: name,
            customerPhone: phone,
            seats: requestedSeats,
            basePrice: basePrice,
            pricePerSeat: pricePerSeat,
            totalPrice: totalPrice,
            bookingType: isMemberBooking ? "member" : "customer",
            discount: totalDiscount,
            discountPercent: isMemberBooking ? memberDiscount : 0,
            bookingDate: new Date().toISOString(),
            status: "confirmed"
          };

          // ถ้าเป็นสมาชิก เพิ่มข้อมูลสมาชิก
          if (isMemberBooking && memberData) {
            bookingData.memberId = memberData.id;
            bookingData.memberName = memberData.fullName;
            bookingData.memberIdCard = memberData.idCard;
          }

          await addDoc(collection(db, "bookings"), bookingData);

          // อัพเดทที่นั่งที่เหลือ
          const tripRef = doc(db, "trips", tripSelect.value);
          await updateDoc(tripRef, {
            seats: availableSeats - requestedSeats
          });

          // ถ้าเป็นสมาชิก อัพเดทจำนวนการจอง
          if (isMemberBooking && memberData) {
            const memberRef = doc(db, "members", memberData.id);
            await updateDoc(memberRef, {
              totalBookings: (memberData.totalBookings || 0) + 1,
              points: (memberData.points || 0) + Math.floor(totalPrice / 100) // 1 คะแนนต่อ 100 บาท
            });
          }

          closeModal();

          // แสดงผลลัพธ์
          const displayDate = tripDate.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          // แสดง Booking Summary Modal
          showBookingSummary({
            route: bookingData.route,
            time: bookingData.time,
            date: bookingData.date,
            name: bookingData.customerName,
            phone: bookingData.customerPhone,
            seats: bookingData.seats,
            pricePerSeat: basePrice,
            totalPrice: bookingData.totalPrice,
            discount: totalDiscount,
            isMember: isMemberBooking
          });

          // Clear form
          document.getElementById("name").value = "";
          document.getElementById("phone").value = "";
          seatsInput.value = "";
          tripSelect.value = "";
          document.getElementById("priceDisplay").classList.add("hidden");

          // Reload trips
          await loadTrips();

        } catch (error) {
          closeModal();
          console.error("❌ Booking error:", error);
          showError("เกิดข้อผิดพลาดในการจองคิว<br>กรุณาลองใหม่อีกครั้ง", "ผิดพลาด");
        }
      },
      () => {
        // กดยกเลิก
        console.log("Booking cancelled");
      }
    );

  } catch (error) {
    closeModal();
    console.error("❌ Error:", error);
    showError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", "ผิดพลาด");
  }
});

// ===== โหลดรอบรถตอน page load =====
loadTrips();
