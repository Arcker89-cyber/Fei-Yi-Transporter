const tripSelect = document.getElementById("tripSelect");
const result = document.getElementById("result");

// โหลดรอบรถ
trips.forEach(trip => {
  const option = document.createElement("option");
  option.value = trip.id;
  option.textContent = `${trip.route} | ${trip.time} | ว่าง ${trip.seats} ที่นั่ง`;
  tripSelect.appendChild(option);
});

function bookQueue() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const seats = parseInt(document.getElementById("seats").value);
  const tripId = parseInt(tripSelect.value);

  const trip = trips.find(t => t.id === tripId);

  if (!name || !phone || !seats) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  if (seats > trip.seats) {
    alert("ที่นั่งไม่เพียงพอ");
    return;
  }

  trip.seats -= seats;

  result.innerHTML = `
    ✅ จองสำเร็จ<br>
    ชื่อ: ${name}<br>
    รอบ: ${trip.route} (${trip.time})<br>
    จำนวน: ${seats} ที่นั่ง
  `;

  tripSelect.innerHTML = "";
  trips.forEach(trip => {
    const option = document.createElement("option");
    option.value = trip.id;
    option.textContent = `${trip.route} | ${trip.time} | ว่าง ${trip.seats} ที่นั่ง`;
    tripSelect.appendChild(option);
  });
}
