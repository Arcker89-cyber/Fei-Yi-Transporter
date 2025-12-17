# ✅ ปรับปรุงระบบราคาและ Navigation สำเร็จ!

## 🎯 สิ่งที่ปรับปรุง

### 1. **ปุ่ม Admin + ติดต่อ → Footer**
ย้ายปุ่ม Admin, ติดต่อสอบถาม, และ LINE Official ไปอยู่ที่ Footer (ด้านล่างติดหน้าจอ)

### 2. **ปุ่มเลือกประเภทราคา**
เปลี่ยนจากปุ่มเลือกประเภทผู้ใช้ → เป็นปุ่มเลือกประเภทราคา
- 👤 **ลูกค้าทั่วไป** - ราคาเต็ม 100%
- ⭐ **ลูกค้าสมาชิก** - ส่วนลด 10%

### 3. **แสดงราคาเมื่อเลือกรอบรถ**
เพิ่มการแสดงราคาอัตโนมัติ:
- 💰 ราคาต่อที่นั่ง
- 🎁 ส่วนลดสมาชิก (ถ้าเลือกสมาชิก)
- **รวมทั้งสิ้น**

---

## 📱 การจัดวางใหม่

```
┌────────────────────────────────────────────┐
│       🚐 Fei Yi Transporter                │
│       ระบบจองคิวรถออนไลน์                   │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 💰 เลือกประเภทราคา                         │
│                                            │
│ ┌─────────────────┬─────────────────────┐ │
│ │ 👤 ลูกค้าทั่วไป  │ ⭐ ลูกค้าสมาชิก    │ │
│ │ ราคาเต็ม 100%   │ ส่วนลด 10%        │ │
│ └─────────────────┴─────────────────────┘ │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 📍 เลือกรอบรถ                              │
│ [-- กรุณาเลือกรอบรถ --]                   │
│                                            │
│ 💰 ราคาต่อที่นั่ง:        ฿500            │
│ 🎁 ส่วนลดสมาชิก:        -฿50             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│ รวม (1 ที่นั่ง):         ฿450            │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ 📝 ข้อมูลผู้จอง                            │
│ ...                                        │
└────────────────────────────────────────────┘

═══════════════════════════════════════════════
│ © 2025 Fei Yi Transporter                   │
│ [🔐 Admin] [📞 ติดต่อสอบถาม] [💬 LINE]    │
═══════════════════════════════════════════════
```

---

## 🎨 การทำงานของระบบราคา

### **เมื่อเลือก "ลูกค้าทั่วไป":**
```
ราคาต่อที่นั่ง: ฿500
รวม (1 ที่นั่ง):  ฿500
```

### **เมื่อเลือก "ลูกค้าสมาชิก":**
```
ราคาต่อที่นั่ง:   ฿500
ส่วนลดสมาชิก:    -฿50  (10%)
━━━━━━━━━━━━━━━━━━━━━━━━
รวม (1 ที่นั่ง):   ฿450
```

### **การคำนวณ:**
- **ลูกค้าทั่วไป:** ราคาเต็ม 100%
- **ลูกค้าสมาชิก:** ราคา × 0.9 (ลด 10%)

---

## 🔄 Flow การใช้งาน

### **สำหรับลูกค้าทั่วไป:**
1. เปิดหน้าเว็บ
2. ปุ่ม "ลูกค้าทั่วไป" active อยู่แล้ว ✅
3. เลือกรอบรถ → **แสดงราคาเต็ม**
4. กรอกข้อมูล → จอง

### **สำหรับลูกค้าสมาชิก:**
1. เปิดหน้าเว็บ
2. **คลิกปุ่ม "ลูกค้าสมาชิก"** ⭐
3. เลือกรอบรถ → **แสดงราคาลด 10%**
4. กรอกข้อมูล → จอง

### **สำหรับแอดมิน:**
1. **Scroll ลงด้านล่าง**
2. คลิกปุ่ม **"🔐 Admin"** ที่ Footer
3. ไปหน้า Dashboard

---

## 📥 ไฟล์ที่แก้ไข

### 1. **index.html**

#### เพิ่ม: ปุ่มเลือกประเภทราคา
```html
<section class="card price-type-card">
  <h2>💰 เลือกประเภทราคา</h2>
  
  <div class="price-type-buttons">
    <button class="price-btn customer-btn active">
      <span class="icon">👤</span>
      <div class="price-info">
        <span class="text">ลูกค้าทั่วไป</span>
        <span class="price-detail">ราคาเต็ม 100%</span>
      </div>
    </button>
    
    <button class="price-btn member-btn">
      <span class="icon">⭐</span>
      <div class="price-info">
        <span class="text">ลูกค้าสมาชิก</span>
        <span class="price-detail">ส่วนลด 10%</span>
      </div>
    </button>
  </div>
</section>
```

#### เพิ่ม: แสดงราคา
```html
<div id="priceDisplay" class="price-display hidden">
  <div class="price-row">
    <span class="price-label">💰 ราคาต่อที่นั่ง:</span>
    <span id="pricePerSeat">฿0</span>
  </div>
  <div class="price-row" id="discountRow">
    <span class="price-label">🎁 ส่วนลดสมาชิก:</span>
    <span id="discountAmount">-฿0</span>
  </div>
  <div class="price-row total-row">
    <span class="price-label">รวม (1 ที่นั่ง):</span>
    <span id="totalPrice">฿0</span>
  </div>
</div>
```

#### เพิ่ม: Footer ใหม่
```html
<footer>
  <div class="footer-content">
    <p class="copyright">© 2025 Fei Yi Transporter</p>
    
    <div class="footer-buttons">
      <a href="dashboard.html" class="footer-btn admin-btn">
        🔐 Admin
      </a>
      <a href="tel:0812345678" class="footer-btn contact-btn">
        📞 ติดต่อสอบถาม
      </a>
      <a href="#" class="footer-btn line-btn">
        💬 LINE Official
      </a>
    </div>
  </div>
</footer>
```

#### เพิ่ม: JavaScript คำนวณราคา
```javascript
function selectPriceType(type) {
  currentPriceType = type;
  // เปลี่ยน active state
  // อัพเดทราคา
}

function updatePriceDisplay() {
  const basePrice = ...;
  const isMember = currentPriceType === 'member';
  const discount = isMember ? basePrice * 0.1 : 0;
  const finalPrice = basePrice - discount;
  
  // แสดงราคา
}
```

### 2. **css/style.css**

#### เพิ่ม: CSS ปุ่มประเภทราคา
```css
.price-type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.price-btn {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-btn.active {
  border-color: #2196F3;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.member-btn.active {
  border-color: #FF9800;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
}
```

#### เพิ่ม: CSS แสดงราคา
```css
.price-display {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-left: 4px solid #4caf50;
}

.price-row {
  display: flex;
  justify-content: space-between;
}

.total-row {
  border-top: 2px solid #4caf50;
}
```

#### เพิ่ม: CSS Footer ใหม่
```css
footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.footer-buttons {
  display: flex;
  gap: 10px;
}

.footer-btn {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}
```

---

## 📱 Responsive Design

### **Desktop:**
- ปุ่มประเภทราคา: 2 คอลัมน์เรียงข้างกัน
- Footer: ติดด้านล่าง มีปุ่ม 3 ปุ่มเรียงกัน

### **Mobile:**
- ปุ่มประเภทราคา: 1 คอลัมน์ เรียงลงมา
- Footer: ติดด้านล่าง ปุ่มอาจจะ wrap

---

## 🎁 ฟีเจอร์เด่น

| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 💰 **คำนวณราคาอัตโนมัติ** | เลือกรอบรถ → แสดงราคาทันที |
| 🎁 **ส่วนลดสมาชิก** | ลด 10% สำหรับลูกค้าสมาชิก |
| ↔️ **สลับประเภทได้** | คลิกเปลี่ยนระหว่างทั่วไป/สมาชิก |
| 🔄 **อัพเดททันที** | เปลี่ยนประเภท → ราคาเปลี่ยนทันที |
| 📍 **Footer ติดหน้าจอ** | Scroll ขึ้นลง Footer ยังอยู่ |

---

## 🚀 ขั้นตอนการอัพเดท

### 1. **ดาวน์โหลดไฟล์**
- ✅ `index.html`
- ✅ `css/style.css`

### 2. **อัพโหลดไปที่ Render**
```bash
git add index.html css/style.css
git commit -m "Add price type selector and footer navigation"
git push
```

### 3. **Clear Cache & ทดสอบ**
- Hard Refresh: `Ctrl+Shift+R`
- ทดสอบ:
  1. เลือกประเภทราคา (ทั่วไป/สมาชิก)
  2. เลือกรอบรถ → เห็นราคา
  3. เปลี่ยนประเภท → ราคาเปลี่ยน
  4. Scroll ลง → เห็นปุ่ม Admin ที่ Footer

---

## 💡 คำแนะนำเพิ่มเติม

### **แก้ไขเบอร์โทรศัพท์:**
```html
<a href="tel:0812345678" class="footer-btn contact-btn">
```
เปลี่ยน `0812345678` เป็นเบอร์จริง

### **เพิ่ม LINE ID:**
```html
<a href="#" class="footer-btn line-btn" onclick="...">
```
เปลี่ยน `#` เป็น LINE URL หรือ `line://ti/p/@yourlineid`

### **ปรับเปอร์เซ็นต์ส่วนลด:**
ใน `index.html` บรรทัด ~148:
```javascript
const discount = isMember ? Math.round(basePrice * 0.1) : 0; // 0.1 = 10%
```
เปลี่ยน `0.1` เป็น `0.15` สำหรับส่วนลด 15%

---

## ✅ สรุป

- ✨ **ปุ่ม Admin ย้ายไป Footer แล้ว**
- 💰 **เลือกประเภทราคาได้ (ทั่วไป/สมาชิก)**
- 📊 **แสดงราคาชัดเจน พร้อมส่วนลด**
- 📱 **Responsive ใช้งานง่ายทุกอุปกรณ์**
- 🎨 **UI สวยงาม ใช้งานสะดวก**

---

**เสร็จสมบูรณ์! พร้อมใช้งาน 100%** 🎉
