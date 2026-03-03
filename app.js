import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
  remove,
  push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const ADMIN_EMAIL = "antonkrupinski0@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

const authView = document.getElementById("auth-view");
const appView = document.getElementById("app-view");
const googleLoginBtn = document.getElementById("google-login-btn");
const authStatus = document.getElementById("auth-status");
const logoutBtn = document.getElementById("logout-btn");
const statusBanner = document.getElementById("status-banner");
const userPill = document.getElementById("user-pill");
const topbarRole = document.getElementById("topbar-role");
const classCodeDisplay = document.getElementById("class-code-display");
const screensGrid = document.getElementById("screens-grid");
const studentsList = document.getElementById("students-list");
const blockedDomainsInput = document.getElementById("blocked-domains");
const categoryBoxes = document.querySelectorAll(".cat-box");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const pendingTeachers = document.getElementById("pending-teachers");
const adminTabBtn = document.getElementById("admin-tab-btn");
const setupModal = document.getElementById("setup-modal");
const teacherNameInput = document.getElementById("teacher-name");
const classTypeInput = document.getElementById("class-type");
const completeSetupBtn = document.getElementById("complete-setup-btn");
const refreshScreensBtn = document.getElementById("refresh-screens-btn");
const screenModal = document.getElementById("screen-modal");
const screenModalImage = document.getElementById("screen-modal-image");
const screenModalTitle = document.getElementById("screen-modal-title");
const closeScreenModal = document.getElementById("close-screen-modal");
const lockUrlInput = document.getElementById("lock-url-input");
const lockUrlBtn = document.getElementById("lock-url-btn");
const unlockUrlBtn = document.getElementById("unlock-url-btn");

let currentUser = null;
let teacherProfile = null;
let classRefPath = "";
let classroomData = null;
let selectedStudentId = "";
let stopTeacherWatcher = null;
let stopClassroomWatcher = null;

const tabs = document.querySelectorAll(".tab-btn");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    const tab = document.getElementById(`${btn.dataset.tab}-tab`);
    if (tab) tab.classList.add("active");
  });
});

googleLoginBtn.addEventListener("click", handleGoogleLogin);

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

completeSetupBtn.addEventListener("click", createClassroomForTeacher);
saveSettingsBtn.addEventListener("click", saveClassroomSettings);
refreshScreensBtn.addEventListener("click", renderClassroomViews);
closeScreenModal.addEventListener("click", () => screenModal.classList.add("hidden"));
lockUrlBtn.addEventListener("click", () => pushControlCommand("LOCK_URL"));
unlockUrlBtn.addEventListener("click", () => pushControlCommand("UNLOCK_URL"));

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (stopTeacherWatcher) {
    stopTeacherWatcher();
    stopTeacherWatcher = null;
  }
  if (!user) {
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
    return;
  }

  authView.classList.add("hidden");
  appView.classList.remove("hidden");

  userPill.textContent = user.email;
  teacherNameInput.value = user.displayName || "";

  if (user.email === ADMIN_EMAIL) {
    await ensureAdminRecord(user);
    topbarRole.textContent = "Role: Admin";
    adminTabBtn.classList.remove("hidden");
    await mountAdminPanel();
  } else {
    adminTabBtn.classList.add("hidden");
    await mountTeacherFlow(user);
  }
});

initRedirectResult();

async function initRedirectResult() {
  try {
    await getRedirectResult(auth);
  } catch (error) {
    setAuthError(error);
  }
}

async function handleGoogleLogin() {
  setAuthMessage("Opening Google sign-in...");
  try {
    await signInWithPopup(auth, googleProvider);
    setAuthMessage("");
  } catch (error) {
    if (shouldFallbackToRedirect(error)) {
      setAuthMessage("Popup was blocked/closed. Redirecting to Google sign-in...");
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    setAuthError(error);
  }
}

async function ensureAdminRecord(user) {
  const userRef = ref(db, `users/${user.uid}`);
  await set(userRef, {
    email: user.email,
    displayName: user.displayName || "Admin",
    role: "admin",
    approved: true,
    updatedAt: Date.now()
  });
}

async function mountTeacherFlow(user) {
  topbarRole.textContent = "Role: Teacher";
  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    await set(userRef, {
      email: user.email,
      displayName: user.displayName || "",
      role: "teacher",
      approved: false,
      updatedAt: Date.now()
    });
    await set(ref(db, `pendingTeachers/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      requestedAt: Date.now()
    });
  }

  stopTeacherWatcher = onValue(userRef, (profileSnap) => {
    teacherProfile = profileSnap.val() || {};

    if (!teacherProfile.approved) {
      statusBanner.textContent = "Waiting for admin approval from antonkrupinski0@gmail.com.";
      setupModal.classList.add("hidden");
      return;
    }

    statusBanner.textContent = "Approved.";
    if (!teacherProfile.classId) {
      setupModal.classList.remove("hidden");
    } else {
      setupModal.classList.add("hidden");
      classRefPath = `classrooms/${teacherProfile.classId}`;
      watchClassroom();
    }
  });
}

async function mountAdminPanel() {
  onValue(ref(db, "pendingTeachers"), (snapshot) => {
    pendingTeachers.innerHTML = "";
    const data = snapshot.val() || {};
    const values = Object.values(data);

    if (!values.length) {
      pendingTeachers.innerHTML = "<p>No pending teachers.</p>";
      return;
    }

    values.forEach((teacher) => {
      const row = document.createElement("div");
      row.className = "student-row";
      row.innerHTML = `<div><strong>${teacher.displayName || "Unknown"}</strong><br>${teacher.email}</div>`;

      const approveBtn = document.createElement("button");
      approveBtn.className = "btn primary";
      approveBtn.textContent = "Approve";
      approveBtn.addEventListener("click", async () => {
        await update(ref(db, `users/${teacher.uid}`), {
          approved: true,
          role: "teacher",
          updatedAt: Date.now()
        });
        await remove(ref(db, `pendingTeachers/${teacher.uid}`));
      });

      row.appendChild(approveBtn);
      pendingTeachers.appendChild(row);
    });
  });
}

async function createClassroomForTeacher() {
  const teacherName = teacherNameInput.value.trim();
  const classType = classTypeInput.value;

  if (!teacherName) {
    statusBanner.textContent = "Enter your name first.";
    return;
  }

  const classId = push(ref(db, "classrooms")).key;
  const classCode = generateClassCode();

  await set(ref(db, `classrooms/${classId}`), {
    classId,
    classCode,
    teacherId: currentUser.uid,
    teacherName,
    classType,
    createdAt: Date.now(),
    settings: {
      blockedDomains: [],
      blockedCategories: []
    },
    commands: {}
  });

  await update(ref(db, `users/${currentUser.uid}`), {
    displayName: teacherName,
    classId,
    approved: true,
    role: "teacher",
    updatedAt: Date.now()
  });

  setupModal.classList.add("hidden");
  classRefPath = `classrooms/${classId}`;
  watchClassroom();
}

function watchClassroom() {
  if (!classRefPath) return;
  if (stopClassroomWatcher) {
    stopClassroomWatcher();
    stopClassroomWatcher = null;
  }
  stopClassroomWatcher = onValue(ref(db, classRefPath), (snapshot) => {
    classroomData = snapshot.val();
    renderClassroomViews();
  });
}

function renderClassroomViews() {
  if (!classroomData) return;

  classCodeDisplay.textContent = `Class code: ${classroomData.classCode || "N/A"}`;

  const students = classroomData.students || {};
  const studentIds = Object.keys(students).filter((id) => students[id]?.active);

  screensGrid.innerHTML = "";
  studentsList.innerHTML = "";

  if (!studentIds.length) {
    screensGrid.innerHTML = "<p>No students connected yet.</p>";
    studentsList.innerHTML = "<p>No students connected yet.</p>";
  }

  studentIds.forEach((id) => {
    const student = students[id];

    const screenCard = document.createElement("div");
    screenCard.className = "screen-card";
    screenCard.innerHTML = `
      <img src="${student.lastScreenshot || ""}" alt="${student.displayName || "Student"}">
      <div class="screen-meta">
        <strong>${student.displayName || "Student"}</strong><br>
        <small>${student.email || "No email"}</small>
      </div>
    `;
    screenCard.addEventListener("click", () => openScreenModal(id, student));
    screensGrid.appendChild(screenCard);

    const row = document.createElement("div");
    row.className = "student-row";
    row.innerHTML = `<div><strong>${student.displayName || "Student"}</strong><br>${student.email || "No email"}</div>`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      await update(ref(db, `${classRefPath}/students/${id}`), {
        active: false,
        removedAt: Date.now()
      });
    });

    row.appendChild(removeBtn);
    studentsList.appendChild(row);
  });

  const settings = classroomData.settings || {};
  blockedDomainsInput.value = (settings.blockedDomains || []).join(", ");
  categoryBoxes.forEach((box) => {
    box.checked = (settings.blockedCategories || []).includes(box.value);
  });
}

function openScreenModal(studentId, student) {
  selectedStudentId = studentId;
  screenModalTitle.textContent = student.displayName || "Student screen";
  screenModalImage.src = student.lastScreenshot || "";
  lockUrlInput.value = student.lockUrl || "";
  screenModal.classList.remove("hidden");
}

async function pushControlCommand(type) {
  if (!selectedStudentId || !classRefPath) return;

  const payload = {
    type,
    createdAt: Date.now(),
    targetStudentId: selectedStudentId,
    lockUrl: lockUrlInput.value.trim() || null
  };

  await push(ref(db, `${classRefPath}/commands`), payload);
  statusBanner.textContent = `Sent command: ${type}`;
}

async function saveClassroomSettings() {
  if (!classRefPath) return;

  const domains = blockedDomainsInput.value
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const categories = Array.from(categoryBoxes)
    .filter((box) => box.checked)
    .map((box) => box.value);

  await update(ref(db, `${classRefPath}/settings`), {
    blockedDomains: domains,
    blockedCategories: categories,
    updatedAt: Date.now()
  });

  statusBanner.textContent = "Settings saved.";
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shouldFallbackToRedirect(error) {
  const code = error?.code || "";
  return code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

function setAuthError(error) {
  const code = error?.code || "unknown";
  const message = error?.message || "Google sign-in failed.";
  setAuthMessage(`${message} (${code})`);
}

function setAuthMessage(message) {
  if (authStatus) authStatus.textContent = message;
}
