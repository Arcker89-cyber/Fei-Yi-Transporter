import { db } from "./firebase.js";
import { 
  collection, 
  addDoc,
  getDocs,
  query,
  where 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== สมัครสมาชิก =====
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const idCard = document.getElementById("idCard").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();

  // Validation
  if (idCard.length !== 13 || !/^[0-9]{13}$/.test(idCard)) {
    showError("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
    return;
  }

  if (phone.length !== 10 || !/^0[0-9]{9}$/.test(phone)) {
    showError("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");
    return;
  }

  try {
    showLoading("กำลังตรวจสอบข้อมูล...");

    // ตรวจสอบว่าบัตรประชาชนซ้ำหรือไม่
    const idCardQuery = query(
      collection(db, "members"), 
      where("idCard", "==", idCard)
    );
    const idCardSnapshot = await getDocs(idCardQuery);
    
    if (!idCardSnapshot.empty) {
      closeModal();
      showError("เลขบัตรประชาชนนี้ถูกใช้งานแล้ว");
      return;
    }

    // ตรวจสอบว่าเบอร์โทรซ้ำหรือไม่
    const phoneQuery = query(
      collection(db, "members"), 
      where("phone", "==", phone)
    );
    const phoneSnapshot = await getDocs(phoneQuery);
    
    if (!phoneSnapshot.empty) {
      closeModal();
      showError("เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว");
      return;
    }

    // บันทึกข้อมูลสมาชิก
    const memberData = {
      idCard: idCard,
      fullName: fullName,
      phone: phone,
      email: email || "",
      memberSince: new Date().toISOString(),
      points: 0,
      totalBookings: 0,
      status: "active"
    };

    await addDoc(collection(db, "members"), memberData);

    closeModal();
    
    showSuccess(
      `สมัครสมาชิกสำเร็จ!<br><br>
      <strong>${fullName}</strong><br>
      เบอร์โทร: ${phone}<br><br>
      คุณสามารถใช้เบอร์โทรนี้รับส่วนลดสมาชิกได้ทันที`,
      "✅ ยินดีต้อนรับสู่ Fei Yi Member"
    );

    // Reset form
    document.getElementById("registerForm").reset();

  } catch (error) {
    closeModal();
    console.error("❌ Error:", error);
    showError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }
});

// ===== ตรวจสอบสมาชิก =====
window.checkMembership = async function() {
  const phone = document.getElementById("checkPhone").value.trim();

  if (!phone) {
    showError("กรุณากรอกเบอร์โทรศัพท์");
    return;
  }

  if (phone.length !== 10) {
    showError("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");
    return;
  }

  try {
    showLoading("กำลังค้นหาข้อมูลสมาชิก...");

    const q = query(
      collection(db, "members"), 
      where("phone", "==", phone)
    );
    const querySnapshot = await getDocs(q);

    closeModal();

    if (querySnapshot.empty) {
      showError("ไม่พบข้อมูลสมาชิก<br>กรุณาสมัครสมาชิกก่อนใช้งาน");
      document.getElementById("memberInfo").style.display = "none";
      return;
    }

    // แสดงข้อมูลสมาชิก
    const memberDoc = querySnapshot.docs[0];
    const member = memberDoc.data();
    
    const memberSince = new Date(member.memberSince);
    const memberDate = memberSince.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    document.getElementById("memberInfo").innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 3em; margin-bottom: 10px;">⭐</div>
        <h3 style="color: #667eea; margin-bottom: 10px;">${member.fullName}</h3>
        <p style="color: #555; margin: 5px 0;">
          <strong>เบอร์โทร:</strong> ${member.phone}
        </p>
        <p style="color: #555; margin: 5px 0;">
          <strong>สมาชิกตั้งแต่:</strong> ${memberDate}
        </p>
        <p style="color: #555; margin: 5px 0;">
          <strong>คะแนนสะสม:</strong> ${member.points || 0} คะแนน
        </p>
        <p style="color: #555; margin: 5px 0;">
          <strong>จองทั้งหมด:</strong> ${member.totalBookings || 0} ครั้ง
        </p>
        <div style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 8px;">
          <p style="color: #2e7d32; font-weight: 600; margin: 0;">
            ✅ สถานะ: ใช้งานปกติ
          </p>
        </div>
      </div>
    `;
    
    document.getElementById("memberInfo").style.display = "block";

    showSuccess("พบข้อมูลสมาชิก! ตรวจสอบรายละเอียดด้านล่าง");

  } catch (error) {
    closeModal();
    console.error("❌ Error:", error);
    showError("เกิดข้อผิดพลาดในการค้นหาข้อมูล");
  }
};

// ฟอร์แมต input เลขบัตรประชาชน (เฉพาะตัวเลข)
document.getElementById("idCard").addEventListener("input", function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});

// ฟอร์แมต input เบอร์โทร (เฉพาะตัวเลข)
document.getElementById("phone").addEventListener("input", function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById("checkPhone").addEventListener("input", function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});
