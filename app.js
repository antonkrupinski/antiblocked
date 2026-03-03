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

const SUPER_ADMIN_EMAIL = "antonkrupinski0@gmail.com";

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
const copyClassCodeBtn = document.getElementById("copy-class-code-btn");
const screensGrid = document.getElementById("screens-grid");
const studentsList = document.getElementById("students-list");
const blockedDomainsInput = document.getElementById("blocked-domains");
const blockedCategoriesSelect = document.getElementById("blocked-categories");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const pendingTeachers = document.getElementById("pending-teachers");
const districtList = document.getElementById("district-list");
const districtClassrooms = document.getElementById("district-classrooms");
const adminTabBtn = document.getElementById("admin-tab-btn");
const districtScopeText = document.getElementById("district-scope");
const districtControls = document.getElementById("district-controls");
const districtNameInput = document.getElementById("district-name-input");
const createDistrictBtn = document.getElementById("create-district-btn");
const managedClassroomBar = document.getElementById("managed-classroom-bar");
const managedClassroomLabel = document.getElementById("managed-classroom-label");
const closeManagedClassroomBtn = document.getElementById("close-managed-classroom-btn");
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

const screensTabBtn = document.querySelector('[data-tab="screens"]');
const studentsTabBtn = document.querySelector('[data-tab="students"]');
const settingsTabBtn = document.querySelector('[data-tab="settings"]');

let currentUser = null;
let userProfile = null;
let classRefPath = "";
let classroomData = null;
let selectedStudentId = "";
let adminContext = null;
let districtsCache = {};
let pendingCache = {};
let classroomsCache = {};
let managedClassroomId = null;

let stopUserWatcher = null;
let stopClassroomWatcher = null;
let stopPendingWatcher = null;
let stopDistrictsWatcher = null;
let stopAdminClassroomsWatcher = null;
let lastApprovedState = false;

const tabs = document.querySelectorAll(".tab-btn");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("hidden")) return;
    activateTab(btn.dataset.tab);
  });
});

googleLoginBtn.addEventListener("click", handleGoogleLogin);
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});
completeSetupBtn.addEventListener("click", createClassroomForTeacher);
saveSettingsBtn.addEventListener("click", saveClassroomSettings);
refreshScreensBtn.addEventListener("click", renderClassroomViews);
copyClassCodeBtn.addEventListener("click", copyClassCode);
createDistrictBtn.addEventListener("click", createDistrict);
closeManagedClassroomBtn.addEventListener("click", closeManagedClassroom);
closeScreenModal.addEventListener("click", () => screenModal.classList.add("hidden"));
lockUrlBtn.addEventListener("click", () => pushControlCommand("LOCK_URL"));
unlockUrlBtn.addEventListener("click", () => pushControlCommand("UNLOCK_URL"));

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  cleanupAllWatchers();
  classRefPath = "";
  classroomData = null;
  userProfile = null;
  adminContext = null;
  managedClassroomId = null;
  lastApprovedState = false;

  if (!user) {
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
    topbarRole.textContent = "";
    return;
  }

  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  userPill.textContent = user.email;
  teacherNameInput.value = user.displayName || "";

  if (user.email === SUPER_ADMIN_EMAIL) {
    await ensureSuperAdminRecord(user);
    topbarRole.textContent = "Role: Super Admin";
    setRoleUI("admin");
    await mountAdminPanel({ role: "super_admin", districtId: null, districtName: "All districts" });
    return;
  }

  await mountUserFlow(user);
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

async function ensureSuperAdminRecord(user) {
  await set(ref(db, `users/${user.uid}`), {
    email: user.email,
    displayName: user.displayName || "Super Admin",
    role: "super_admin",
    approved: true,
    districtId: null,
    districtName: "All districts",
    updatedAt: Date.now()
  });
}

async function mountUserFlow(user) {
  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    await set(userRef, {
      email: user.email,
      displayName: user.displayName || "",
      role: "teacher",
      approved: false,
      districtId: null,
      districtName: "",
      updatedAt: Date.now()
    });

    await set(ref(db, `pendingTeachers/${user.uid}`), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      requestedAt: Date.now()
    });
  }

  stopUserWatcher = onValue(userRef, async (profileSnap) => {
    userProfile = profileSnap.val() || {};
    const justApproved = !lastApprovedState && Boolean(userProfile.approved);
    lastApprovedState = Boolean(userProfile.approved);

    if (!userProfile.approved) {
      topbarRole.textContent = "Role: Pending Approval";
      statusBanner.textContent = "Waiting for district assignment and approval.";
      setupModal.classList.add("hidden");
      setRoleUI("pending");
      return;
    }

    if (userProfile.role === "admin") {
      topbarRole.textContent = `Role: District Admin (${userProfile.districtName || "No district"})`;
      statusBanner.textContent = "Open a district classroom to manage Screens, Students, and Settings.";
      setupModal.classList.add("hidden");
      setRoleUI("admin");
      await mountAdminPanel(userProfile);
      return;
    }

    topbarRole.textContent = `Role: Teacher (${userProfile.districtName || "No district"})`;
    statusBanner.textContent = "Approved.";
    setRoleUI("teacher");
    cleanupAdminWatchers();

    if (!userProfile.classId) {
      if (justApproved) {
        statusBanner.textContent = "Approved. Set up your classroom to continue.";
      }
      setupModal.classList.remove("hidden");
      activateTab("screens");
      if (stopClassroomWatcher) {
        stopClassroomWatcher();
        stopClassroomWatcher = null;
      }
      return;
    }

    setupModal.classList.add("hidden");
    classRefPath = `classrooms/${userProfile.classId}`;
    watchClassroom();
  });
}

function setRoleUI(role) {
  const showTeacherTabs = role === "teacher" || role === "admin_manage";
  const showAdminTab = role === "admin" || role === "admin_manage";

  screensTabBtn.classList.toggle("hidden", !showTeacherTabs);
  studentsTabBtn.classList.toggle("hidden", !showTeacherTabs);
  settingsTabBtn.classList.toggle("hidden", !showTeacherTabs);
  adminTabBtn.classList.toggle("hidden", !showAdminTab);

  if (role === "teacher" || role === "admin_manage") {
    if (document.querySelector(".tab-btn.active")?.dataset.tab === "admin") {
      activateTab("screens");
    }
    if (!document.querySelector(".tab-btn.active") || document.querySelector(".tab-btn.active").classList.contains("hidden")) {
      activateTab("screens");
    }
  } else if (role === "admin") {
    activateTab("admin");
  } else {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    statusBanner.textContent = "Waiting for approval.";
  }
}

function activateTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));

  const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const targetTab = document.getElementById(`${tabName}-tab`);

  if (targetBtn && !targetBtn.classList.contains("hidden")) targetBtn.classList.add("active");
  if (targetTab) targetTab.classList.add("active");
}

async function mountAdminPanel(profile) {
  adminContext = {
    role: profile.role,
    districtId: profile.role === "super_admin" ? null : profile.districtId || null,
    districtName: profile.role === "super_admin" ? "All districts" : profile.districtName || "Unknown district",
    activeDistrictId: profile.role === "super_admin" ? null : profile.districtId || null
  };

  districtControls.classList.toggle("hidden", adminContext.role !== "super_admin");
  managedClassroomBar.classList.toggle("hidden", !managedClassroomId);

  cleanupAdminWatchers();

  stopDistrictsWatcher = onValue(ref(db, "districts"), (snapshot) => {
    districtsCache = snapshot.val() || {};
    if (adminContext.role === "super_admin" && !adminContext.activeDistrictId) {
      const firstDistrictId = Object.keys(districtsCache)[0] || null;
      if (firstDistrictId) adminContext.activeDistrictId = firstDistrictId;
    }
    renderDistrictList();
    renderPendingApprovals();
    renderDistrictClassrooms();
  });

  stopPendingWatcher = onValue(ref(db, "pendingTeachers"), (snapshot) => {
    pendingCache = snapshot.val() || {};
    renderPendingApprovals();
  });

  stopAdminClassroomsWatcher = onValue(ref(db, "classrooms"), (snapshot) => {
    classroomsCache = snapshot.val() || {};
    renderDistrictClassrooms();
  });

  setupModal.classList.add("hidden");
  if (!managedClassroomId) {
    classRefPath = "";
    classroomData = null;
    if (stopClassroomWatcher) {
      stopClassroomWatcher();
      stopClassroomWatcher = null;
    }
  }
}

function renderPendingApprovals() {
  pendingTeachers.innerHTML = "";
  if (!adminContext) return;

  const pendingList = Object.values(pendingCache || {});
  if (!pendingList.length) {
    pendingTeachers.innerHTML = "<p>No pending users.</p>";
    return;
  }

  if (!Object.keys(districtsCache).length && adminContext.role === "super_admin") {
    pendingTeachers.innerHTML = "<p>Create at least one district before approving users.</p>";
    return;
  }

  pendingList.forEach((pendingUser) => {
    const row = document.createElement("div");
    row.className = "student-row";

    const left = document.createElement("div");
    left.innerHTML = `<strong>${pendingUser.displayName || "Unknown"}</strong><br>${pendingUser.email}`;

    const controls = document.createElement("div");
    controls.className = "approval-controls";

    const districtSelect = document.createElement("select");
    districtSelect.className = "approve-select";

    if (adminContext.role === "super_admin") {
      districtSelect.innerHTML = '<option value="">Select district</option>';
      Object.entries(districtsCache).forEach(([id, district]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = district.name;
        districtSelect.appendChild(option);
      });
      if (adminContext.activeDistrictId) {
        districtSelect.value = adminContext.activeDistrictId;
      }
    } else {
      const option = document.createElement("option");
      option.value = adminContext.districtId || "";
      option.textContent = adminContext.districtName;
      districtSelect.appendChild(option);
      districtSelect.disabled = true;
    }

    const roleSelect = document.createElement("select");
    roleSelect.className = "approve-select";
    roleSelect.innerHTML = `
      <option value="teacher">Teacher</option>
      <option value="admin">Admin</option>
    `;

    const approveBtn = document.createElement("button");
    approveBtn.className = "btn primary";
    approveBtn.textContent = "Approve";
    approveBtn.addEventListener("click", async () => {
      const districtId = districtSelect.value;
      if (!districtId) {
        statusBanner.textContent = "Select a district before approving.";
        return;
      }

      const districtName = districtsCache[districtId]?.name || adminContext.districtName || "District";
      const chosenRole = roleSelect.value;

      await update(ref(db, `users/${pendingUser.uid}`), {
        approved: true,
        role: chosenRole,
        districtId,
        districtName,
        updatedAt: Date.now()
      });

      await remove(ref(db, `pendingTeachers/${pendingUser.uid}`));
      statusBanner.textContent = `Approved ${pendingUser.email} as ${chosenRole} in ${districtName}.`;
    });

    controls.appendChild(districtSelect);
    controls.appendChild(roleSelect);
    controls.appendChild(approveBtn);

    row.appendChild(left);
    row.appendChild(controls);
    pendingTeachers.appendChild(row);
  });
}

function renderDistrictList() {
  districtList.innerHTML = "";
  if (!adminContext) return;

  const entries = Object.entries(districtsCache || {});
  if (adminContext.role !== "super_admin" && adminContext.districtId && !districtsCache[adminContext.districtId]) {
    entries.push([adminContext.districtId, { name: adminContext.districtName }]);
  }
  if (!entries.length) {
    districtList.innerHTML = "<p>No districts created yet.</p>";
    districtScopeText.textContent = "Scope: no district selected";
    return;
  }

  entries
    .sort((a, b) => (a[1]?.name || "").localeCompare(b[1]?.name || ""))
    .forEach(([districtId, district]) => {
      if (adminContext.role !== "super_admin" && districtId !== adminContext.districtId) return;

      const row = document.createElement("div");
      row.className = "student-row";
      row.innerHTML = `<div><strong>${district.name}</strong><br><small>ID: ${districtId}</small></div>`;

      const openBtn = document.createElement("button");
      openBtn.className = "btn";
      openBtn.textContent = adminContext.activeDistrictId === districtId ? "Opened" : "Open district";
      openBtn.disabled = adminContext.activeDistrictId === districtId;
      openBtn.addEventListener("click", () => {
        adminContext.activeDistrictId = districtId;
        managedClassroomId = null;
        classRefPath = "";
        classroomData = null;
        managedClassroomBar.classList.add("hidden");
        if (stopClassroomWatcher) {
          stopClassroomWatcher();
          stopClassroomWatcher = null;
        }
        setRoleUI("admin");
        renderDistrictList();
        renderDistrictClassrooms();
        renderPendingApprovals();
      });

      row.appendChild(openBtn);
      districtList.appendChild(row);
    });

  const scopeDistrict = adminContext.activeDistrictId ? districtsCache[adminContext.activeDistrictId]?.name : null;
  districtScopeText.textContent = scopeDistrict
    ? `Scope: ${scopeDistrict}`
    : "Scope: select a district";
}

function renderDistrictClassrooms() {
  districtClassrooms.innerHTML = "";
  if (!adminContext) return;

  const scopeDistrictId = adminContext.role === "super_admin" ? adminContext.activeDistrictId : adminContext.districtId;
  if (!scopeDistrictId) {
    districtClassrooms.innerHTML = "<p>Select a district to manage classrooms.</p>";
    return;
  }

  const classrooms = Object.values(classroomsCache || {}).filter((room) => {
    return room.districtId && room.districtId === scopeDistrictId;
  });

  if (!classrooms.length) {
    districtClassrooms.innerHTML = "<p>No classrooms found for this scope.</p>";
    return;
  }

  classrooms
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach((room) => {
      const row = document.createElement("div");
      row.className = "student-row";
      const left = document.createElement("div");
      left.innerHTML = `
        <strong>${room.teacherName || "Unknown Teacher"}</strong><br>
        ${room.classType || "Class"} · Code: ${room.classCode || "N/A"}<br>
        <small>${room.districtName || "No district"}</small>
      `;
      const openBtn = document.createElement("button");
      openBtn.className = "btn primary";
      openBtn.textContent = "Open classroom";
      openBtn.addEventListener("click", () => openManagedClassroom(room));
      row.appendChild(left);
      row.appendChild(openBtn);
      districtClassrooms.appendChild(row);
    });
}

async function createDistrict() {
  if (!adminContext || adminContext.role !== "super_admin") return;

  const name = districtNameInput.value.trim();
  if (!name) {
    statusBanner.textContent = "Enter a district name.";
    return;
  }

  const districtId = push(ref(db, "districts")).key;
  await set(ref(db, `districts/${districtId}`), {
    districtId,
    name,
    createdBy: currentUser.uid,
    createdAt: Date.now()
  });

  adminContext.activeDistrictId = districtId;
  districtNameInput.value = "";
  statusBanner.textContent = `District created: ${name}`;
}

function openManagedClassroom(room) {
  if (!room?.classId) return;
  managedClassroomId = room.classId;
  classRefPath = `classrooms/${room.classId}`;
  managedClassroomLabel.textContent = `Managing ${room.teacherName || "Teacher"} · ${room.classCode || "N/A"}`;
  managedClassroomBar.classList.remove("hidden");
  statusBanner.textContent = `Managing classroom ${room.classCode || "N/A"} in ${room.districtName || "district"}.`;
  setRoleUI("admin_manage");
  activateTab("screens");
  watchClassroom();
}

function closeManagedClassroom() {
  managedClassroomId = null;
  classRefPath = "";
  classroomData = null;
  screensGrid.innerHTML = "";
  studentsList.innerHTML = "";
  classCodeDisplay.textContent = "------";
  managedClassroomBar.classList.add("hidden");
  if (stopClassroomWatcher) {
    stopClassroomWatcher();
    stopClassroomWatcher = null;
  }
  statusBanner.textContent = "Returned to district admin controls.";
  setRoleUI("admin");
  activateTab("admin");
}

async function createClassroomForTeacher() {
  if (!userProfile || userProfile.role !== "teacher") return;

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
    districtId: userProfile.districtId || null,
    districtName: userProfile.districtName || "",
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
    districtId: userProfile.districtId || null,
    districtName: userProfile.districtName || "",
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

  classCodeDisplay.textContent = classroomData.classCode || "------";

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
  const selectedCategories = new Set(settings.blockedCategories || []);
  Array.from(blockedCategoriesSelect.options).forEach((option) => {
    option.selected = selectedCategories.has(option.value);
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
  const categories = Array.from(blockedCategoriesSelect.selectedOptions).map((option) => option.value);

  await update(ref(db, `${classRefPath}/settings`), {
    blockedDomains: domains,
    blockedCategories: categories,
    updatedAt: Date.now()
  });

  statusBanner.textContent = "Settings saved.";
}

async function copyClassCode() {
  const code = classCodeDisplay.textContent.trim();
  if (!code || code === "------") {
    statusBanner.textContent = "No class code yet. Create your classroom first.";
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    statusBanner.textContent = `Class code copied: ${code}`;
  } catch {
    statusBanner.textContent = `Copy failed. Class code: ${code}`;
  }
}

function cleanupAllWatchers() {
  if (stopUserWatcher) {
    stopUserWatcher();
    stopUserWatcher = null;
  }
  if (stopClassroomWatcher) {
    stopClassroomWatcher();
    stopClassroomWatcher = null;
  }
  cleanupAdminWatchers();
}

function cleanupAdminWatchers() {
  if (stopPendingWatcher) {
    stopPendingWatcher();
    stopPendingWatcher = null;
  }
  if (stopDistrictsWatcher) {
    stopDistrictsWatcher();
    stopDistrictsWatcher = null;
  }
  if (stopAdminClassroomsWatcher) {
    stopAdminClassroomsWatcher();
    stopAdminClassroomsWatcher = null;
  }
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
