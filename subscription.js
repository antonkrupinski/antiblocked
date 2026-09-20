import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, push, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const districtEmail = document.getElementById("district-email");
const districtPassword = document.getElementById("district-password");
const districtName = document.getElementById("district-name");
const districtStudents = document.getElementById("district-students");
const districtSubscribeBtn = document.getElementById("district-subscribe-btn");

const teacherEmail = document.getElementById("teacher-email");
const teacherPassword = document.getElementById("teacher-password");
const teacherDistrictName = document.getElementById("teacher-district-name");
const teacherClassName = document.getElementById("teacher-class-name");
const teacherName = document.getElementById("teacher-name");
const teacherSubject = document.getElementById("teacher-subject");
const teacherStudents = document.getElementById("teacher-students");
const teacherSubscribeBtn = document.getElementById("teacher-subscribe-btn");

const statusEl = document.getElementById("subscription-status");

function setStatus(message) {
  statusEl.textContent = message;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function createDistrictPlan() {
  const email = normalizeEmail(districtEmail.value);
  const password = String(districtPassword.value || "");
  const name = String(districtName.value || "").trim();
  const students = Number(districtStudents.value || 0);

  if (!email || !password || !name || students <= 0) {
    setStatus("Complete all district fields.");
    return;
  }

  setStatus("Processing Stripe payment and creating district...");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const districtId = push(ref(db, "districts")).key;

  await set(ref(db, `districts/${districtId}`), {
    districtId,
    name,
    joinCode: generateJoinCode(),
    createdBy: credential.user.uid,
    createdAt: Date.now(),
    subscription: {
      plan: "district",
      pricePerStudent: 12.5,
      students,
      amount: Number((students * 12.5).toFixed(2)),
      provider: "stripe",
      status: "active"
    }
  });

  await set(ref(db, `users/${credential.user.uid}`), {
    email,
    displayName: "District Administrator",
    role: "admin",
    approved: true,
    districtId,
    districtName: name,
    updatedAt: Date.now()
  });

  setStatus("District created. You can now sign in.");
  setTimeout(() => {
    window.location.href = "./index.html";
  }, 1200);
}

async function createTeacherPlan() {
  const email = normalizeEmail(teacherEmail.value);
  const password = String(teacherPassword.value || "");
  const districtNameValue = String(teacherDistrictName.value || "").trim();
  const className = String(teacherClassName.value || "").trim();
  const displayName = String(teacherName.value || "").trim();
  const subject = String(teacherSubject.value || "").trim() || "Other";
  const students = Number(teacherStudents.value || 0);

  if (!email || !password || !districtNameValue || !className || !displayName || students <= 0) {
    setStatus("Complete all teacher fields.");
    return;
  }
  if (students > 40) {
    setStatus("Teacher plan supports up to 40 students.");
    return;
  }

  setStatus("Processing Stripe payment and creating teacher plan...");
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  const districtsSnap = await get(ref(db, "districts"));
  const districts = districtsSnap.val() || {};
  let districtId = Object.keys(districts).find((id) => String(districts[id]?.name || "").toLowerCase() === districtNameValue.toLowerCase());

  if (!districtId) {
    districtId = push(ref(db, "districts")).key;
    await set(ref(db, `districts/${districtId}`), {
      districtId,
      name: districtNameValue,
      joinCode: generateJoinCode(),
      createdBy: credential.user.uid,
      createdAt: Date.now(),
      subscription: {
        plan: "teacher",
        pricePerStudent: 3.5,
        students,
        amount: Number((students * 3.5).toFixed(2)),
        provider: "stripe",
        status: "active"
      }
    });
  }

  await set(ref(db, `users/${credential.user.uid}`), {
    email,
    displayName,
    role: "teacher",
    approved: true,
    districtId,
    districtName: districtNameValue,
    activeClassId: null,
    updatedAt: Date.now()
  });

  const classId = push(ref(db, "classrooms")).key;
  await set(ref(db, `classrooms/${classId}`), {
    classId,
    classCode: generateClassCode(),
    className,
    classType: subject,
    teacherId: credential.user.uid,
    teacherName: displayName,
    districtId,
    districtName: districtNameValue,
    createdAt: Date.now(),
    subscription: {
      plan: "teacher",
      maxStudents: 40,
      purchasedStudents: students
    },
    settings: {
      blockedDomains: [],
      blockedCategories: [],
      allowedLinks: ["antonkrupinski.com"],
      showScreenWatchStatus: false,
      testModeEnabled: false,
      testModeAllowedLinks: []
    },
    commands: {}
  });

  await update(ref(db, `users/${credential.user.uid}`), {
    activeClassId: classId,
    updatedAt: Date.now()
  });

  setStatus("Teacher plan created. You can now sign in.");
  setTimeout(() => {
    window.location.href = "./index.html";
  }, 1200);
}

districtSubscribeBtn.addEventListener("click", () => {
  createDistrictPlan().catch((error) => setStatus(error?.message || "Failed to create district plan."));
});

teacherSubscribeBtn.addEventListener("click", () => {
  createTeacherPlan().catch((error) => setStatus(error?.message || "Failed to create teacher plan."));
});
