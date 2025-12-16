import { db } from "./firebase.js";
import { collection, addDoc } from "firebase/firestore";

const form = document.getElementById("tripForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    route: route.value,
    time: time.value,
    seats: Number(seats.value),
    price: Number(price.value),
    active: active.checked
  };

  await addDoc(collection(db, "trips"), data);

  alert("✅ เพิ่มรอบรถเรียบร้อย");
  form.reset();
});
