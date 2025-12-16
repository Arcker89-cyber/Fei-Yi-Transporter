import { trips } from "./trips.js";
import { app, auth, db } from "./firebase.js";

console.log("✅ Firebase ready:", app);
console.log("🚐 Trips loaded:", trips);

// ตัวอย่างใช้งาน
const tripSelect = document.getElementById("tripSelect");

trips.forEach(trip => {
  const option = document.createElement("option");
  option.value = trip.id;
  option.textContent = `${trip.route} | ${trip.time} | ว่าง ${trip.seats} ที่นั่ง`;
  tripSelect.appendChild(option);
});
