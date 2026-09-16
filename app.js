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
const classPickerPage = document.getElementById("class-picker-page");
const welcomeOverlay = document.getElementById("welcome-overlay");
const welcomeTitle = document.getElementById("welcome-title");
const welcomeSubtitle = document.getElementById("welcome-subtitle");
const googleLoginBtn = document.getElementById("google-login-btn");
const authStatus = document.getElementById("auth-status");
const logoutBtn = document.getElementById("logout-btn");
const statusBanner = document.getElementById("status-banner");
const pendingView = document.getElementById("pending-view");
const userPill = document.getElementById("user-pill");
const topbarRole = document.getElementById("topbar-role");
const classViewLabel = document.getElementById("class-view-label");
const classCodeDisplay = document.getElementById("class-code-display");
const copyClassCodeBtn = document.getElementById("copy-class-code-btn");
const openTestModeBtn = document.getElementById("open-test-mode-btn");
const chooseClassroomBtn = document.getElementById("choose-classroom-btn");
const screensGrid = document.getElementById("screens-grid");
const studentsList = document.getElementById("students-list");
const settingsClassNameInput = document.getElementById("settings-class-name");
const settingsClassTypeInput = document.getElementById("settings-class-type");
const blockedDomainsInput = document.getElementById("blocked-domains");
const blockedCategoriesSelect = document.getElementById("blocked-categories");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const pendingTeachers = document.getElementById("pending-teachers");
const districtList = document.getElementById("district-list");
const districtClassrooms = document.getElementById("district-classrooms");
const districtBlockedDomainsInput = document.getElementById("district-blocked-domains");
const districtBlockedCategoriesSelect = document.getElementById("district-blocked-categories");
const districtAllowlistToggle = document.getElementById("district-allowlist-toggle");
const districtAllowlistLinksWrap = document.getElementById("district-allowlist-links-wrap");
const districtAllowedLinksInput = document.getElementById("district-allowed-links");
const saveDistrictSettingsBtn = document.getElementById("save-district-settings-btn");
const adminTabBtn = document.getElementById("admin-tab-btn");
const districtScopeText = document.getElementById("district-scope");
const adminDistrictCount = document.getElementById("admin-district-count");
const adminPendingCount = document.getElementById("admin-pending-count");
const adminTeacherCount = document.getElementById("admin-teacher-count");
const adminClassroomCount = document.getElementById("admin-classroom-count");
const openCreateDistrictBtn = document.getElementById("open-create-district-btn");
const districtNameInput = document.getElementById("district-name-input");
const districtJoinCodeInput = document.getElementById("district-join-code-input");
const createDistrictBtn = document.getElementById("create-district-btn");
const createDistrictModal = document.getElementById("create-district-modal");
const cancelCreateDistrictBtn = document.getElementById("cancel-create-district-btn");
const districtCodeBar = document.getElementById("district-code-bar");
const districtCodeLabel = document.getElementById("district-code-label");
const copyDistrictCodeBtn = document.getElementById("copy-district-code-btn");
const regenerateDistrictCodeBtn = document.getElementById("regenerate-district-code-btn");
const districtTeachersModal = document.getElementById("district-teachers-modal");
const districtTeachersTitle = document.getElementById("district-teachers-title");
const districtTeachersList = document.getElementById("district-teachers-list");
const closeDistrictTeachersBtn = document.getElementById("close-district-teachers-btn");
const managedClassroomBar = document.getElementById("managed-classroom-bar");
const managedClassroomLabel = document.getElementById("managed-classroom-label");
const closeManagedClassroomBtn = document.getElementById("close-managed-classroom-btn");
const setupModal = document.getElementById("setup-modal");
const teacherNameInput = document.getElementById("teacher-name");
const classTypeInput = document.getElementById("class-type");
const completeSetupBtn = document.getElementById("complete-setup-btn");
const classPickerList = document.getElementById("class-picker-list");
const newClassBtn = document.getElementById("new-class-btn");
const viewAllClassesBtn = document.getElementById("view-all-classes-btn");
const closeClassPickerBtn = document.getElementById("close-class-picker-btn");
const classCreateModal = document.getElementById("class-create-modal");
const newClassNameInput = document.getElementById("new-class-name");
const newClassTypeInput = document.getElementById("new-class-type");
const classStudentsList = document.getElementById("class-students-list");
const createClassBtn = document.getElementById("create-class-btn");
const cancelClassCreateBtn = document.getElementById("cancel-class-create-btn");
const openAddStudentsBtn = document.getElementById("open-add-students-btn");
const addStudentsModal = document.getElementById("add-students-modal");
const addStudentsList = document.getElementById("add-students-list");
const cancelAddStudentsBtn = document.getElementById("cancel-add-students-btn");
const confirmAddStudentsBtn = document.getElementById("confirm-add-students-btn");
const testModeModal = document.getElementById("test-mode-modal");
const testModeLinks = document.getElementById("test-mode-links");
const enableTestModeBtn = document.getElementById("enable-test-mode-btn");
const disableTestModeBtn = document.getElementById("disable-test-mode-btn");
const closeTestModeBtn = document.getElementById("close-test-mode-btn");
const refreshScreensBtn = document.getElementById("refresh-screens-btn");
const screenModal = document.getElementById("screen-modal");
const screenModalImage = document.getElementById("screen-modal-image");
const screenModalTitle = document.getElementById("screen-modal-title");
const screenModalTabs = document.getElementById("screen-modal-tabs");
const tabsCount = document.getElementById("tabs-count");
const toggleHistoryBtn = document.getElementById("toggle-history-btn");
const historyControls = document.getElementById("history-controls");
const historyFilterSelect = document.getElementById("history-filter-select");
const historySearchInput = document.getElementById("history-search-input");
const closeScreenModal = document.getElementById("close-screen-modal");
const settingsToggles = document.querySelectorAll("[data-settings-toggle]");

const screensTabBtn = document.querySelector('[data-tab="screens"]');
const studentsTabBtn = document.querySelector('[data-tab="students"]');
const settingsTabBtn = document.querySelector('[data-tab="settings"]');
const screensTab = document.getElementById("screens-tab");
const studentsTab = document.getElementById("students-tab");
const settingsTab = document.getElementById("settings-tab");
const adminTab = document.getElementById("admin-tab");
const appLayout = document.querySelector(".layout");

let currentUser = null;
let userProfile = null;
let classRefPath = "";
let classroomData = null;
let selectedStudentContext = null;
let adminContext = null;
let districtsCache = {};
let pendingCache = {};
let classroomsCache = {};
let managedClassroomId = null;
let pendingStudentsCache = {};
let teacherClassesCache = {};
let usersCache = {};

let stopUserWatcher = null;
let stopClassroomWatcher = null;
let stopPendingWatcher = null;
let stopDistrictsWatcher = null;
let stopAdminClassroomsWatcher = null;
let stopPendingStudentsWatcher = null;
let stopTeacherClassesWatcher = null;
let stopTeacherDistrictWatcher = null;
let stopUsersWatcher = null;
let lastApprovedState = false;
let teacherHeartbeatTimer = null;
let activeTeacherClassId = null;
let viewingAllClassrooms = false;
let allClassroomSelection = new Set();
let lastWelcomeEmail = "";
let showingStudentHistory = false;

const tabs = document.querySelectorAll(".tab-btn");

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("hidden")) return;
    activateTab(btn.dataset.tab);
  });
});

settingsToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const group = toggle.closest(".settings-group");
    if (group) {
      group.classList.toggle("collapsed");
    }
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
openTestModeBtn.addEventListener("click", openTestModeModal);
chooseClassroomBtn.addEventListener("click", showClassPicker);
openCreateDistrictBtn.addEventListener("click", () => {
  createDistrictModal.classList.remove("hidden");
});
cancelCreateDistrictBtn.addEventListener("click", () => {
  createDistrictModal.classList.add("hidden");
});
createDistrictBtn.addEventListener("click", createDistrict);
copyDistrictCodeBtn.addEventListener("click", copyDistrictCode);
regenerateDistrictCodeBtn.addEventListener("click", regenerateDistrictCode);
saveDistrictSettingsBtn.addEventListener("click", saveDistrictGlobalSettings);
districtAllowlistToggle.addEventListener("change", () => {
  districtAllowlistLinksWrap.classList.toggle("hidden", !districtAllowlistToggle.checked);
});
closeManagedClassroomBtn.addEventListener("click", closeManagedClassroom);
closeDistrictTeachersBtn.addEventListener("click", () => {
  districtTeachersModal.classList.add("hidden");
});
closeScreenModal.addEventListener("click", () => {
  selectedStudentContext = null;
  showingStudentHistory = false;
  if (historyFilterSelect) historyFilterSelect.value = "all";
  if (historySearchInput) historySearchInput.value = "";
  updateHistoryControlsVisibility();
  if (toggleHistoryBtn) {
    toggleHistoryBtn.textContent = "View History";
    toggleHistoryBtn.classList.remove("active");
  }
  screenModal.classList.add("hidden");
});

toggleHistoryBtn?.addEventListener("click", () => {
  if (!selectedStudentContext) return;
  showingStudentHistory = !showingStudentHistory;
  toggleHistoryBtn.textContent = showingStudentHistory ? "View Open Tabs" : "View History";
  toggleHistoryBtn.classList.toggle("active", showingStudentHistory);
  updateHistoryControlsVisibility();

  const focusedStudent = viewingAllClassrooms
    ? teacherClassesCache
        .find((room) => room.classId === selectedStudentContext.classId)
        ?.students?.[selectedStudentContext.studentId]
    : classroomData?.students?.[selectedStudentContext.studentId];

  if (focusedStudent) {
    renderStudentModalPanel(focusedStudent);
  }
});

historyFilterSelect?.addEventListener("change", () => {
  if (!showingStudentHistory || !selectedStudentContext) return;
  rerenderFocusedStudentModalPanel();
});

historySearchInput?.addEventListener("input", () => {
  if (!showingStudentHistory || !selectedStudentContext) return;
  rerenderFocusedStudentModalPanel();
});
window.addEventListener("beforeunload", () => {
  stopTeacherHeartbeat();
});
newClassBtn.addEventListener("click", () => {
  classCreateModal.classList.remove("hidden");
  renderClassStudentsPicker();
});
viewAllClassesBtn.addEventListener("click", openAllClassroomsView);
closeClassPickerBtn.addEventListener("click", () => {
  if (!activeTeacherClassId && !viewingAllClassrooms) {
    statusBanner.textContent = "Select a classroom or open an all-classrooms view to continue.";
    return;
  }
  hideClassPickerPage();
});
cancelClassCreateBtn.addEventListener("click", () => {
  classCreateModal.classList.add("hidden");
});
createClassBtn.addEventListener("click", createClassFromPicker);
openAddStudentsBtn.addEventListener("click", () => {
  renderAddStudentsPicker();
  addStudentsModal.classList.remove("hidden");
});
cancelAddStudentsBtn.addEventListener("click", () => {
  addStudentsModal.classList.add("hidden");
});
confirmAddStudentsBtn.addEventListener("click", addSelectedStudentsToCurrentClass);
closeTestModeBtn.addEventListener("click", () => testModeModal.classList.add("hidden"));
enableTestModeBtn.addEventListener("click", () => setTestModeEnabled(true));
disableTestModeBtn.addEventListener("click", () => setTestModeEnabled(false));

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  cleanupAllWatchers();
  stopTeacherHeartbeat();
  classRefPath = "";
  classroomData = null;
  userProfile = null;
  adminContext = null;
  managedClassroomId = null;
  lastApprovedState = false;
  activeTeacherClassId = null;
  viewingAllClassrooms = false;
  allClassroomSelection = new Set();
  selectedStudentContext = null;

  if (!user) {
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
    welcomeOverlay.classList.add("hidden");
    topbarRole.textContent = "";
    lastWelcomeEmail = "";
    return;
  }

  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  userPill.textContent = user.email;
  teacherNameInput.value = user.displayName || "";
  await playWelcomeSequence(user);

  if (normalizeEmail(user.email) === normalizeEmail(SUPER_ADMIN_EMAIL)) {
    await ensureSuperAdminRecord(user);
    await showSuperAdminPanel();
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

function formatWelcomeName(user) {
  const raw = String(user?.displayName || "").trim();
  if (!raw) {
    const fallback = String(user?.email || "Teacher").split("@")[0];
    return `Welcome, ${fallback}`;
  }

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return `Welcome, ${parts[0]}`;
  }

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `Welcome, ${lastName}, ${firstName}`;
}

async function playWelcomeSequence(user) {
  const email = normalizeEmail(user?.email || "");
  if (!email || lastWelcomeEmail === email) return;

  lastWelcomeEmail = email;
  welcomeTitle.textContent = formatWelcomeName(user);
  welcomeSubtitle.textContent = "Preparing your classroom...";
  welcomeOverlay.classList.remove("hidden");
  await delay(10000);
  welcomeOverlay.classList.add("hidden");
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
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
  let snap;
  try {
    snap = await get(userRef);
  } catch (error) {
    handleDatabasePermissionError(error);
    return;
  }

  if (!snap.exists()) {
    try {
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
    } catch (error) {
      handleDatabasePermissionError(error);
      return;
    }
  }

  stopUserWatcher = onValue(userRef, async (profileSnap) => {
    userProfile = profileSnap.val() || {};
    const justApproved = !lastApprovedState && Boolean(userProfile.approved);
    lastApprovedState = Boolean(userProfile.approved);

    if (userProfile.role === "super_admin") {
      await showSuperAdminPanel();
      return;
    }

    if (!userProfile.approved) {
      resetMainPanels();
      topbarRole.textContent = "Role: Pending Approval";
      statusBanner.textContent = "Waiting for district assignment and approval.";
      setupModal.classList.add("hidden");
      hideClassPickerPage();
      classCreateModal.classList.add("hidden");
      addStudentsModal.classList.add("hidden");
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
    watchPendingStudents();
    watchTeacherClasses();
    watchTeacherDistrict();

    if (viewingAllClassrooms && allClassroomSelection.size) {
      classRefPath = "";
      classroomData = null;
      stopTeacherHeartbeat();
      renderCurrentViewLabel();
      renderClassroomViews();
      return;
    }

    if (!activeTeacherClassId) {
      if (justApproved) {
        statusBanner.textContent = "Approved. Select or create a classroom to continue.";
      }
      showClassPicker();
      stopTeacherHeartbeat();
      return;
    }

    classRefPath = `classrooms/${activeTeacherClassId}`;
    startTeacherHeartbeat(activeTeacherClassId);
    renderCurrentViewLabel();
    watchClassroom();
  });
}

function setRoleUI(role) {
  resetMainPanels();
  const showTeacherTabs = role === "teacher" || role === "admin_manage";
  const showAdminTab = role === "admin" || role === "admin_manage";

  screensTabBtn.classList.toggle("hidden", !showTeacherTabs);
  studentsTabBtn.classList.toggle("hidden", !showTeacherTabs);
  settingsTabBtn.classList.toggle("hidden", !showTeacherTabs);
  adminTabBtn.classList.toggle("hidden", !showAdminTab);
  forceSectionVisibility(role);

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

function resetMainPanels() {
  pendingView.classList.add("hidden");
  screensTab.classList.add("hidden");
  studentsTab.classList.add("hidden");
  settingsTab.classList.add("hidden");
  adminTab.classList.add("hidden");
  screensTabBtn.classList.add("hidden");
  studentsTabBtn.classList.add("hidden");
  settingsTabBtn.classList.add("hidden");
  adminTabBtn.classList.add("hidden");
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
}

function forceSectionVisibility(role) {
  const showTeacher = role === "teacher" || role === "admin_manage";
  const showAdmin = role === "admin" || role === "admin_manage";
  const showPending = role === "pending";

  screensTab.classList.toggle("hidden", !showTeacher);
  studentsTab.classList.toggle("hidden", !showTeacher);
  settingsTab.classList.toggle("hidden", !showTeacher);
  adminTab.classList.toggle("hidden", !showAdmin);
  pendingView.classList.toggle("hidden", !showPending);
}

function activateTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));

  const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const targetTab = document.getElementById(`${tabName}-tab`);

  if (targetBtn && !targetBtn.classList.contains("hidden")) targetBtn.classList.add("active");
  if (targetTab) targetTab.classList.add("active");
}

async function showSuperAdminPanel() {
  resetMainPanels();
  topbarRole.textContent = "Role: Super Admin";
  statusBanner.textContent = "Super admin access enabled.";
  forceSectionVisibility("admin");
  setupModal.classList.add("hidden");
  hideClassPickerPage();
  classCreateModal.classList.add("hidden");
  addStudentsModal.classList.add("hidden");
  adminTabBtn.classList.remove("hidden");
  activateTab("admin");
  await mountAdminPanel({ role: "super_admin", districtId: null, districtName: "All districts" });
}

async function mountAdminPanel(profile) {
  adminContext = {
    role: profile.role,
    districtId: profile.role === "super_admin" ? null : profile.districtId || null,
    districtName: profile.role === "super_admin" ? "All districts" : profile.districtName || "Unknown district",
    activeDistrictId: profile.role === "super_admin" ? null : profile.districtId || null
  };

  openCreateDistrictBtn.classList.toggle("hidden", adminContext.role !== "super_admin");
  managedClassroomBar.classList.toggle("hidden", !managedClassroomId);
  districtCodeBar.classList.add("hidden");

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
    renderDistrictCode();
    renderAdminStats();
    renderDistrictSettingsPanel();
  });

  stopPendingWatcher = onValue(ref(db, "pendingTeachers"), (snapshot) => {
    pendingCache = snapshot.val() || {};
    renderPendingApprovals();
    renderAdminStats();
  });

  stopAdminClassroomsWatcher = onValue(ref(db, "classrooms"), (snapshot) => {
    classroomsCache = snapshot.val() || {};
    renderDistrictClassrooms();
    renderAdminStats();
  });

  stopUsersWatcher = onValue(ref(db, "users"), (snapshot) => {
    usersCache = snapshot.val() || {};
    renderAdminStats();
  });

  setupModal.classList.add("hidden");
  if (!managedClassroomId) {
    classRefPath = "";
    classroomData = null;
    if (stopClassroomWatcher) {
      stopClassroomWatcher();
      stopClassroomWatcher = null;
    }
    stopTeacherHeartbeat();
  }
}

function renderAdminStats() {
  if (!adminDistrictCount || !adminPendingCount || !adminTeacherCount || !adminClassroomCount) return;

  const districtEntries = Object.entries(districtsCache || {});
  const pendingCount = Object.keys(pendingCache || {}).length;
  const scopeDistrictId = getAdminScopeDistrictId();

  const teacherCount = Object.values(usersCache || {}).filter((user) => {
    if (!(user?.approved && user?.role === "teacher")) return false;
    if (!scopeDistrictId) return true;
    return user?.districtId === scopeDistrictId;
  }).length;

  const classroomCount = Object.values(classroomsCache || {}).filter((room) => {
    if (!scopeDistrictId) return true;
    return room?.districtId === scopeDistrictId;
  }).length;

  adminDistrictCount.textContent = String(districtEntries.length);
  adminPendingCount.textContent = String(pendingCount);
  adminTeacherCount.textContent = String(teacherCount);
  adminClassroomCount.textContent = String(classroomCount);
}

function getAdminScopeDistrictId() {
  if (!adminContext) return null;
  return adminContext.role === "super_admin" ? adminContext.activeDistrictId : adminContext.districtId;
}

function normalizeDistrictSettings(settings = {}) {
  const blockedDomains = Array.isArray(settings.blockedDomains)
    ? settings.blockedDomains.map((d) => String(d || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const blockedCategories = Array.isArray(settings.blockedCategories)
    ? settings.blockedCategories.map((c) => String(c || "").trim()).filter(Boolean)
    : [];
  const allowedLinks = Array.isArray(settings.allowedLinks)
    ? settings.allowedLinks.map((link) => String(link || "").trim()).filter(Boolean)
    : [];

  return {
    blockedDomains,
    blockedCategories,
    strictAllowlistEnabled: Boolean(settings.strictAllowlistEnabled),
    allowedLinks
  };
}

function setDistrictSettingsControlsDisabled(disabled) {
  districtBlockedDomainsInput.disabled = disabled;
  districtBlockedCategoriesSelect.disabled = disabled;
  districtAllowlistToggle.disabled = disabled;
  districtAllowedLinksInput.disabled = disabled;
  saveDistrictSettingsBtn.disabled = disabled;
}

function renderDistrictSettingsPanel() {
  const scopeDistrictId = getAdminScopeDistrictId();
  if (!scopeDistrictId || !districtsCache[scopeDistrictId]) {
    districtBlockedDomainsInput.value = "";
    districtAllowedLinksInput.value = "";
    districtAllowlistToggle.checked = false;
    districtAllowlistLinksWrap.classList.add("hidden");
    Array.from(districtBlockedCategoriesSelect.options).forEach((option) => {
      option.selected = false;
    });
    setDistrictSettingsControlsDisabled(true);
    return;
  }

  setDistrictSettingsControlsDisabled(false);
  const settings = normalizeDistrictSettings(districtsCache[scopeDistrictId]?.settings || {});
  districtBlockedDomainsInput.value = settings.blockedDomains.join(", ");
  districtAllowedLinksInput.value = settings.allowedLinks.join("\n");
  districtAllowlistToggle.checked = settings.strictAllowlistEnabled;
  districtAllowlistLinksWrap.classList.toggle("hidden", !settings.strictAllowlistEnabled);

  const selectedCategories = new Set(settings.blockedCategories);
  Array.from(districtBlockedCategoriesSelect.options).forEach((option) => {
    option.selected = selectedCategories.has(option.value);
  });
}

async function saveDistrictGlobalSettings() {
  const scopeDistrictId = getAdminScopeDistrictId();
  if (!scopeDistrictId) {
    statusBanner.textContent = "Select a district first.";
    return;
  }

  const blockedDomains = districtBlockedDomainsInput.value
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const blockedCategories = Array.from(districtBlockedCategoriesSelect.selectedOptions).map((option) => option.value);
  const strictAllowlistEnabled = Boolean(districtAllowlistToggle.checked);
  const allowedLinks = districtAllowedLinksInput.value
    .split(/[,\n]/)
    .map((link) => link.trim())
    .filter(Boolean);

  await update(ref(db, `districts/${scopeDistrictId}/settings`), {
    blockedDomains,
    blockedCategories,
    strictAllowlistEnabled,
    allowedLinks,
    updatedAt: Date.now(),
    updatedBy: currentUser?.uid || null
  });

  statusBanner.textContent = "District global settings saved.";
}

function renderPendingApprovals() {
  pendingTeachers.innerHTML = "";
  if (!adminContext) return;

  const pendingList = Object.values(pendingCache || {});
  if (!pendingList.length) {
    pendingTeachers.innerHTML = '<p class="admin-empty">No pending users.</p>';
    return;
  }

  pendingList.forEach((pendingUser) => {
    const row = document.createElement("div");
    row.className = "admin-row";

    const left = document.createElement("div");
    left.className = "admin-row-main";
    left.innerHTML = `
      <div class="admin-row-title">${pendingUser.displayName || "Unknown"}</div>
      <div class="admin-row-subtitle">${pendingUser.email || "No email"}</div>
    `;

    const controls = document.createElement("div");
    controls.className = "approval-controls admin-row-actions";

    const districtSelect = document.createElement("select");
    districtSelect.className = "approve-select";

    if (adminContext.role === "super_admin") {
      districtSelect.innerHTML = '<option value="">Select district</option>';
      if (!Object.keys(districtsCache).length) {
        const autoOption = document.createElement("option");
        autoOption.value = "__auto__";
        autoOption.textContent = "Create General District";
        districtSelect.appendChild(autoOption);
        districtSelect.value = "__auto__";
      }
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

    const approveBtn = document.createElement("button");
    approveBtn.className = "btn primary";
    approveBtn.textContent = "Approve";
    approveBtn.addEventListener("click", async () => {
      let districtId = districtSelect.value;
      if (!districtId) {
        statusBanner.textContent = "Select a district before approving.";
        return;
      }

      if (districtId === "__auto__") {
        districtId = push(ref(db, "districts")).key;
        await set(ref(db, `districts/${districtId}`), {
          districtId,
          name: "General District",
          joinCode: generateJoinCode(),
          createdBy: currentUser.uid,
          createdAt: Date.now()
        });
      }

      const districtName = districtsCache[districtId]?.name || "General District";
      await update(ref(db, `users/${pendingUser.uid}`), {
        approved: true,
        role: "teacher",
        districtId,
        districtName,
        deniedAt: null,
        updatedAt: Date.now()
      });

      await remove(ref(db, `pendingTeachers/${pendingUser.uid}`));
      statusBanner.textContent = `Approved ${pendingUser.email} in ${districtName}.`;
    });

    const denyBtn = document.createElement("button");
    denyBtn.className = "btn danger";
    denyBtn.textContent = "Deny";
    denyBtn.addEventListener("click", async () => {
      await update(ref(db, `users/${pendingUser.uid}`), {
        approved: false,
        deniedAt: Date.now(),
        updatedAt: Date.now()
      });
      await remove(ref(db, `pendingTeachers/${pendingUser.uid}`));
      statusBanner.textContent = `Denied ${pendingUser.email}.`;
    });

    controls.appendChild(districtSelect);
    controls.appendChild(approveBtn);
    controls.appendChild(denyBtn);

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
    districtList.innerHTML = '<p class="admin-empty">No districts created yet.</p>';
    districtScopeText.textContent = "Scope: no district selected";
    renderAdminStats();
    return;
  }

  entries
    .sort((a, b) => (a[1]?.name || "").localeCompare(b[1]?.name || ""))
    .forEach(([districtId, district]) => {
      if (adminContext.role !== "super_admin" && districtId !== adminContext.districtId) return;

      const row = document.createElement("div");
      row.className = "admin-row";

      const left = document.createElement("div");
      left.className = "admin-row-main";
      left.innerHTML = `
        <div class="admin-row-title">${district.name}</div>
        <div class="admin-row-subtitle">ID: ${districtId}</div>
      `;

      const controls = document.createElement("div");
      controls.className = "approval-controls admin-row-actions";

      const teachersBtn = document.createElement("button");
      teachersBtn.className = "btn";
      teachersBtn.textContent = "View Teachers";
      teachersBtn.addEventListener("click", () => {
        openDistrictTeachers(districtId, district.name);
      });

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
        districtCodeBar.classList.add("hidden");
        if (stopClassroomWatcher) {
          stopClassroomWatcher();
          stopClassroomWatcher = null;
        }
        setRoleUI("admin");
        renderDistrictList();
        renderDistrictClassrooms();
        renderPendingApprovals();
        renderDistrictCode();
        renderDistrictSettingsPanel();
      });

      controls.appendChild(teachersBtn);
      controls.appendChild(openBtn);
      row.appendChild(left);
      row.appendChild(controls);
      districtList.appendChild(row);
    });

  const scopeDistrict = adminContext.activeDistrictId ? districtsCache[adminContext.activeDistrictId]?.name : null;
  districtScopeText.textContent = scopeDistrict
    ? `Scope: ${scopeDistrict}`
    : "Scope: select a district";
  renderAdminStats();
}

function openDistrictTeachers(districtId, districtName) {
  const teachers = Object.values(usersCache || {}).filter((user) => {
    return user?.approved && user?.role === "teacher" && user?.districtId === districtId;
  });

  districtTeachersTitle.textContent = `${districtName} Teachers`;
  districtTeachersList.innerHTML = "";

  if (!teachers.length) {
    districtTeachersList.innerHTML = '<p class="admin-empty">No approved teachers in this district.</p>';
  } else {
    teachers
      .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""))
      .forEach((teacher) => {
        const row = document.createElement("div");
        row.className = "admin-row";
        row.innerHTML = `
          <div class="admin-row-main">
            <div class="admin-row-title">${teacher.displayName || "Unknown"}</div>
            <div class="admin-row-subtitle">${teacher.email || "No email"}</div>
          </div>
        `;
        districtTeachersList.appendChild(row);
      });
  }

  districtTeachersModal.classList.remove("hidden");
}

function renderDistrictCode() {
  if (!adminContext) return;
  const scopeDistrictId = getAdminScopeDistrictId();
  if (!scopeDistrictId) {
    districtCodeBar.classList.add("hidden");
    return;
  }
  const district = districtsCache[scopeDistrictId];
  if (!district) {
    districtCodeBar.classList.add("hidden");
    return;
  }
  districtCodeBar.classList.remove("hidden");
  districtCodeLabel.textContent = `District join code: ${district.joinCode || "Not set"}`;
}

function renderDistrictClassrooms() {
  districtClassrooms.innerHTML = "";
  if (!adminContext) return;

  const scopeDistrictId = getAdminScopeDistrictId();
  if (!scopeDistrictId) {
    districtClassrooms.innerHTML = '<p class="admin-empty">Select a district to manage classrooms.</p>';
    renderAdminStats();
    return;
  }

  const classrooms = Object.values(classroomsCache || {}).filter((room) => {
    return room.districtId && room.districtId === scopeDistrictId;
  });

  if (!classrooms.length) {
    districtClassrooms.innerHTML = '<p class="admin-empty">No classrooms found for this scope.</p>';
    renderAdminStats();
    return;
  }

  classrooms
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach((room) => {
      const row = document.createElement("div");
      row.className = "admin-row";
      const left = document.createElement("div");
      left.className = "admin-row-main";
      left.innerHTML = `
        <div class="admin-row-title">${room.className || room.classType || "Class"}</div>
        <div class="admin-row-subtitle">${room.teacherName || "Unknown Teacher"} · Code: ${room.classCode || "N/A"}</div>
        <div class="admin-row-subtitle">${room.districtName || "No district"}</div>
      `;
      const openBtn = document.createElement("button");
      openBtn.className = "btn primary";
      openBtn.textContent = "Open classroom";
      openBtn.addEventListener("click", () => openManagedClassroom(room));
      row.appendChild(left);
      row.appendChild(openBtn);
      districtClassrooms.appendChild(row);
    });

  renderAdminStats();
}

async function createDistrict() {
  if (!adminContext || adminContext.role !== "super_admin") return;

  const name = districtNameInput.value.trim();
  const joinCode = districtJoinCodeInput.value.trim().toUpperCase();
  if (!name) {
    statusBanner.textContent = "Enter a district name.";
    return;
  }
  if (!joinCode) {
    statusBanner.textContent = "Enter a custom district code.";
    return;
  }

  const duplicate = Object.values(districtsCache).some((district) => (district?.joinCode || "").toUpperCase() === joinCode);
  if (duplicate) {
    statusBanner.textContent = "That district code already exists.";
    return;
  }

  const districtId = push(ref(db, "districts")).key;
  await set(ref(db, `districts/${districtId}`), {
    districtId,
    name,
    joinCode,
    createdBy: currentUser.uid,
    createdAt: Date.now()
  });

  adminContext.activeDistrictId = districtId;
  districtNameInput.value = "";
  districtJoinCodeInput.value = "";
  createDistrictModal.classList.add("hidden");
  statusBanner.textContent = `District created: ${name}`;
}

async function regenerateDistrictCode() {
  if (!adminContext) return;
  const scopeDistrictId = getAdminScopeDistrictId();
  if (!scopeDistrictId) return;
  const joinCode = generateJoinCode();
  await update(ref(db, `districts/${scopeDistrictId}`), {
    joinCode,
    updatedAt: Date.now()
  });
  statusBanner.textContent = `New district code generated: ${joinCode}`;
}

async function copyDistrictCode() {
  if (!adminContext) return;
  const scopeDistrictId = getAdminScopeDistrictId();
  const code = districtsCache[scopeDistrictId]?.joinCode;
  if (!code) {
    statusBanner.textContent = "No district code available.";
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    statusBanner.textContent = `District code copied: ${code}`;
  } catch {
    statusBanner.textContent = `Copy failed. District code: ${code}`;
  }
}

function openManagedClassroom(room) {
  if (!room?.classId) return;
  managedClassroomId = room.classId;
  selectedStudentContext = null;
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
  selectedStudentContext = null;
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
  stopTeacherHeartbeat();
  statusBanner.textContent = "Returned to district admin controls.";
  setRoleUI("admin");
  activateTab("admin");
}

async function createClassroomForTeacher() {
  // Deprecated by class picker flow; kept for legacy compatibility.
  return;
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

function getScreenPreviewMarkup(student, fallbackLabel = "Preview unavailable for this tab.") {
  if (student.lastScreenshot) {
    return `<img src="${student.lastScreenshot}" alt="${student.displayName || "Student"}">`;
  }

  return `
    <div class="screen-unavailable">
      <strong>${student.screenshotReason || fallbackLabel}</strong>
      <span>${student.currentUrl || "Protected or internal Chrome tab"}</span>
    </div>
  `;
}

function setScreenModalPreview(student) {
  if (student.lastScreenshot) {
    screenModalImage.src = student.lastScreenshot;
    screenModalImage.alt = student.displayName || "Student screen";
    screenModalImage.classList.remove("preview-unavailable");
    return;
  }

  screenModalImage.src = "";
  screenModalImage.alt = student.screenshotReason || "Preview unavailable";
  screenModalImage.classList.add("preview-unavailable");
}

function renderClassroomViews() {
  const entries = [];
  let settings = { blockedDomains: [], blockedCategories: [] };

  if (viewingAllClassrooms) {
    teacherClassesCache
      .filter((room) => allClassroomSelection.has(room.classId))
      .forEach((room) => {
        Object.entries(room.students || {})
          .filter(([, student]) => student?.active)
          .forEach(([studentId, student]) => {
            entries.push({
              renderId: `${room.classId}:${studentId}`,
              classId: room.classId,
              className: room.className || room.classType || "Class",
              studentId,
              student
            });
          });
      });
  } else {
    if (!classroomData) return;
    settings = classroomData.settings || settings;
    Object.entries(classroomData.students || {})
      .filter(([, student]) => student?.active)
      .forEach(([studentId, student]) => {
        entries.push({
          renderId: studentId,
          classId: activeTeacherClassId,
          className: classroomData.className || classroomData.classType || "Class",
          studentId,
          student
        });
      });
  }

  screensGrid.innerHTML = "";
  studentsList.innerHTML = "";

  if (!entries.length) {
    screensGrid.innerHTML = "<p>No students connected yet.</p>";
    studentsList.innerHTML = "<p>No students connected yet.</p>";
  }

  entries.forEach((entry) => {
    const { student, studentId, classId, className } = entry;

    const screenCard = document.createElement("div");
    screenCard.className = "screen-card";
    const activeTab = Array.isArray(student.openTabs) ? student.openTabs.find((tab) => tab?.active) : null;
    screenCard.innerHTML = `
      ${getScreenPreviewMarkup(student)}
      <div class="screen-meta">
        <strong>${student.displayName || "Student"}</strong><br>
        <small>${student.email || "No email"}</small>
        ${viewingAllClassrooms ? `<div class="screen-tabs-preview">${className}</div>` : ""}
        <div class="screen-tabs-preview">${activeTab?.title || student.currentUrl || "No active tab info yet"}</div>
      </div>
    `;
    screenCard.addEventListener("click", () => openScreenModal(studentId, classId, student, className));
    screensGrid.appendChild(screenCard);

    const row = document.createElement("div");
    row.className = "student-row";
    row.innerHTML = `
      <div>
        <strong>${student.displayName || "Student"}</strong><br>
        ${student.email || "No email"}
        ${viewingAllClassrooms ? `<br><small>${className}</small>` : ""}
      </div>
    `;

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      await update(ref(db, `classrooms/${classId}/students/${studentId}`), {
        active: false,
        removedAt: Date.now()
      });
    });

    row.appendChild(removeBtn);
    studentsList.appendChild(row);
  });

  if (!screenModal.classList.contains("hidden") && selectedStudentContext) {
    const focusedStudent = viewingAllClassrooms
      ? teacherClassesCache
          .find((room) => room.classId === selectedStudentContext.classId)
          ?.students?.[selectedStudentContext.studentId]
      : classroomData?.students?.[selectedStudentContext.studentId];

    if (focusedStudent?.active) {
      const activeClassName = viewingAllClassrooms
        ? teacherClassesCache.find((room) => room.classId === selectedStudentContext.classId)?.className
          || teacherClassesCache.find((room) => room.classId === selectedStudentContext.classId)?.classType
          || "Class"
        : classroomData?.className || classroomData?.classType || "Class";

      screenModalTitle.textContent = viewingAllClassrooms
        ? `${focusedStudent.displayName || "Student screen"} · ${activeClassName}`
        : focusedStudent.displayName || "Student screen";
      setScreenModalPreview(focusedStudent);
      renderStudentModalPanel(focusedStudent);
    } else {
      screenModal.classList.add("hidden");
      selectedStudentContext = null;
    }
  }

  blockedDomainsInput.disabled = viewingAllClassrooms;
  blockedCategoriesSelect.disabled = viewingAllClassrooms;
  settingsClassNameInput.disabled = viewingAllClassrooms;
  settingsClassTypeInput.disabled = viewingAllClassrooms;
  saveSettingsBtn.disabled = viewingAllClassrooms;
  openTestModeBtn.disabled = viewingAllClassrooms || !classRefPath;
  openTestModeBtn.textContent = viewingAllClassrooms
    ? "Test Mode"
    : (settings.testModeEnabled ? "Test Mode On" : "Test Mode");
  settingsClassNameInput.value = viewingAllClassrooms ? "" : (classroomData?.className || "");
  settingsClassTypeInput.value = viewingAllClassrooms ? "Other" : (classroomData?.classType || "Other");
  blockedDomainsInput.value = viewingAllClassrooms ? "" : (settings.blockedDomains || []).join(", ");
  const selectedCategories = new Set(viewingAllClassrooms ? [] : settings.blockedCategories || []);
  Array.from(blockedCategoriesSelect.options).forEach((option) => {
    option.selected = selectedCategories.has(option.value);
  });
}

function watchPendingStudents() {
  if (!userProfile?.districtId) return;
  if (stopPendingStudentsWatcher) {
    stopPendingStudentsWatcher();
    stopPendingStudentsWatcher = null;
  }
  stopPendingStudentsWatcher = onValue(ref(db, `districtPending/${userProfile.districtId}`), (snapshot) => {
    pendingStudentsCache = snapshot.val() || {};
  });
}

function watchTeacherDistrict() {
  if (!userProfile?.districtId) return;
  if (stopTeacherDistrictWatcher) {
    stopTeacherDistrictWatcher();
    stopTeacherDistrictWatcher = null;
  }
  stopTeacherDistrictWatcher = onValue(ref(db, `districts/${userProfile.districtId}`), (snapshot) => {
    const district = snapshot.val();
    classCodeDisplay.textContent = district?.joinCode || "--------";
  });
}

function watchTeacherClasses() {
  if (!currentUser) return;
  if (stopTeacherClassesWatcher) {
    stopTeacherClassesWatcher();
    stopTeacherClassesWatcher = null;
  }
  stopTeacherClassesWatcher = onValue(ref(db, "classrooms"), (snapshot) => {
    const all = snapshot.val() || {};
    teacherClassesCache = Object.values(all).filter((room) => room.teacherId === currentUser.uid);
    renderClassPicker();
    renderCurrentViewLabel();
    if (viewingAllClassrooms) renderClassroomViews();
  });
}

function showClassPicker() {
  classPickerPage.classList.remove("hidden");
  appLayout.classList.add("hidden");
  renderClassPicker();
}

function hideClassPickerPage() {
  classPickerPage.classList.add("hidden");
  appLayout.classList.remove("hidden");
}

function renderClassPicker() {
  if (!classPickerList) return;
  classPickerList.innerHTML = "";
  viewAllClassesBtn.disabled = !teacherClassesCache.length;

  if (!teacherClassesCache.length) {
    classPickerList.innerHTML = "<div class=\"card\">No classes yet. Click + to create one.</div>";
    return;
  }

  teacherClassesCache.forEach((room) => {
    const card = document.createElement("div");
    card.className = "class-card";
    const studentCount = Object.values(room.students || {}).filter((s) => s?.active).length;
    const head = document.createElement("div");
    head.className = "class-card-head";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${room.className || room.classType || "Class"}</strong>`;

    const checkbox = document.createElement("input");
    checkbox.className = "class-card-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = allClassroomSelection.has(room.classId);
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        allClassroomSelection.add(room.classId);
      } else {
        allClassroomSelection.delete(room.classId);
      }
    });

    head.appendChild(title);
    head.appendChild(checkbox);

    const meta = document.createElement("div");
    meta.className = "class-card-meta";
    meta.innerHTML = `
      <div>${studentCount} students</div>
      <div>${room.classType || "Class"}</div>
      <div>${room.classCode || "No class code"}</div>
    `;

    card.appendChild(head);
    card.appendChild(meta);
    card.addEventListener("click", () => selectClassroom(room.classId));
    classPickerList.appendChild(card);
  });
}

function renderCurrentViewLabel() {
  if (viewingAllClassrooms) {
    const selectedRooms = teacherClassesCache.filter((room) => allClassroomSelection.has(room.classId));
    classViewLabel.textContent = selectedRooms.length
      ? `Viewing all students across ${selectedRooms.length} classrooms.`
      : "Select classrooms to view all screens.";
    return;
  }

  const activeRoom = teacherClassesCache.find((room) => room.classId === activeTeacherClassId);
  classViewLabel.textContent = activeRoom
    ? `${activeRoom.className || activeRoom.classType || "Class"}`
    : "Select a classroom to continue.";
}

function renderTestModeInputs(links = []) {
  testModeLinks.innerHTML = "";
  const values = Array.isArray(links) ? links.slice(0, 10) : [];

  for (let i = 0; i < 10; i += 1) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Allowed link ${i + 1}`;
    input.value = values[i] || "";
    input.dataset.testModeLink = "true";
    testModeLinks.appendChild(input);
  }
}

function openTestModeModal() {
  if (!classRefPath || viewingAllClassrooms) {
    statusBanner.textContent = "Open a single classroom to manage Test Mode.";
    return;
  }

  const settings = classroomData?.settings || {};
  renderTestModeInputs(settings.testModeAllowedLinks || []);
  const enabled = Boolean(settings.testModeEnabled);
  enableTestModeBtn.textContent = enabled ? "Save Allowed Links" : "Enable";
  disableTestModeBtn.classList.toggle("hidden", !enabled);
  testModeModal.classList.remove("hidden");
}

async function setTestModeEnabled(enabled) {
  if (!classRefPath || viewingAllClassrooms) return;

  const links = Array.from(testModeLinks.querySelectorAll("input[data-test-mode-link=\"true\"]"))
    .map((input) => input.value.trim())
    .filter(Boolean)
    .slice(0, 10);

  if (enabled && !links.length) {
    statusBanner.textContent = "Add at least one allowed link before enabling Test Mode.";
    return;
  }

  await update(ref(db, `${classRefPath}/settings`), {
    testModeEnabled: enabled,
    testModeAllowedLinks: links,
    updatedAt: Date.now()
  });

  statusBanner.textContent = enabled
    ? `Test Mode enabled with ${links.length} allowed link${links.length === 1 ? "" : "s"}.`
    : "Test Mode disabled.";
  testModeModal.classList.add("hidden");
}

async function selectClassroom(classId) {
  if (!currentUser || !classId) return;
  viewingAllClassrooms = false;
  activeTeacherClassId = classId;
  allClassroomSelection.add(classId);
  selectedStudentContext = null;
  await update(ref(db, `users/${currentUser.uid}`), {
    activeClassId: classId,
    updatedAt: Date.now()
  });
  classRefPath = `classrooms/${classId}`;
  hideClassPickerPage();
  renderCurrentViewLabel();
  startTeacherHeartbeat(classId);
  watchClassroom();
}

function openAllClassroomsView() {
  if (!allClassroomSelection.size) {
    statusBanner.textContent = "Select at least one classroom first.";
    return;
  }

  viewingAllClassrooms = true;
  activeTeacherClassId = null;
  selectedStudentContext = null;
  classRefPath = "";
  classroomData = null;
  if (stopClassroomWatcher) {
    stopClassroomWatcher();
    stopClassroomWatcher = null;
  }
  stopTeacherHeartbeat();
  hideClassPickerPage();
  activateTab("screens");
  renderCurrentViewLabel();
  renderClassroomViews();
}

function renderClassStudentsPicker() {
  classStudentsList.innerHTML = "";
  const entries = Object.entries(pendingStudentsCache || {}).filter(([, data]) => !data?.assignedClassId);
  if (!entries.length) {
    classStudentsList.innerHTML = "<div class=\"class-student-row\">No pending students.</div>";
    return;
  }

  entries.forEach(([pendingId, pending]) => {
    const row = document.createElement("label");
    row.className = "class-student-row";
    row.innerHTML = `
      <span>${pending.displayName || "Student"} (${pending.email || "No email"})</span>
      <input type="checkbox" value="${pendingId}">
    `;
    classStudentsList.appendChild(row);
  });
}

async function createClassFromPicker() {
  if (!userProfile || userProfile.role !== "teacher") return;
  const className = newClassNameInput.value.trim();
  const classType = newClassTypeInput.value || "Other";
  if (!className) {
    statusBanner.textContent = "Enter a class name.";
    return;
  }

  const classId = push(ref(db, "classrooms")).key;
  const classCode = generateClassCode();
  const selectedIds = Array.from(classStudentsList.querySelectorAll("input[type=\"checkbox\"]:checked"))
    .map((input) => input.value);

  await set(ref(db, `classrooms/${classId}`), {
    classId,
    classCode,
    className,
    classType,
    teacherId: currentUser.uid,
    teacherName: userProfile.displayName || "",
    districtId: userProfile.districtId || null,
    districtName: userProfile.districtName || "",
    createdAt: Date.now(),
    settings: {
      blockedDomains: [],
      blockedCategories: [],
      testModeEnabled: false,
      testModeAllowedLinks: []
    },
    commands: {}
  });

  for (const pendingId of selectedIds) {
    const pending = pendingStudentsCache[pendingId] || {};
    await update(ref(db, `classrooms/${classId}/students/${pendingId}`), {
      active: true,
      email: pending.email || "",
      displayName: pending.displayName || "Student",
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      lockUrl: null
    });
    await update(ref(db, `districtPending/${userProfile.districtId}/${pendingId}`), {
      assignedClassId: classId,
      assignedAt: Date.now(),
      assignedTeacherId: currentUser.uid,
      assignedTeacherName: userProfile.displayName || ""
    });
  }

  await update(ref(db, `users/${currentUser.uid}`), {
    activeClassId: classId,
    updatedAt: Date.now()
  });

  activeTeacherClassId = classId;
  viewingAllClassrooms = false;
  allClassroomSelection.add(classId);
  newClassNameInput.value = "";
  classCreateModal.classList.add("hidden");
  hideClassPickerPage();
  classRefPath = `classrooms/${classId}`;
  renderCurrentViewLabel();
  startTeacherHeartbeat(classId);
  watchClassroom();
}

function openScreenModal(studentId, classId, student, className = "") {
  selectedStudentContext = { studentId, classId };
  showingStudentHistory = false;
  if (historyFilterSelect) historyFilterSelect.value = "all";
  if (historySearchInput) historySearchInput.value = "";
  updateHistoryControlsVisibility();
  if (toggleHistoryBtn) {
    toggleHistoryBtn.textContent = "View History";
    toggleHistoryBtn.classList.remove("active");
  }
  screenModalTitle.textContent = className
    ? `${student.displayName || "Student screen"} · ${className}`
    : student.displayName || "Student screen";
  setScreenModalPreview(student);
  renderStudentModalPanel(student);
  screenModal.classList.remove("hidden");
}

function updateHistoryControlsVisibility() {
  historyControls?.classList.toggle("hidden", !showingStudentHistory);
}

function getFocusedStudent() {
  if (!selectedStudentContext) return null;
  return viewingAllClassrooms
    ? teacherClassesCache
        .find((room) => room.classId === selectedStudentContext.classId)
        ?.students?.[selectedStudentContext.studentId]
    : classroomData?.students?.[selectedStudentContext.studentId];
}

function rerenderFocusedStudentModalPanel() {
  const focusedStudent = getFocusedStudent();
  if (focusedStudent) {
    renderStudentModalPanel(focusedStudent);
  }
}

function renderStudentModalPanel(student) {
  if (showingStudentHistory) {
    renderStudentHistoryPanel(student);
  } else {
    renderStudentTabsPanel(student);
  }
}

function renderStudentTabsPanel(student) {
  const tabs = Array.isArray(student.openTabs) ? student.openTabs : [];
  tabsCount.textContent = tabs.length ? `${tabs.length} open` : "";
  screenModalTabs.innerHTML = "";
  if (!tabs.length) {
    screenModalTabs.innerHTML = "<div class=\"tab-row\">No tab data yet.</div>";
    return;
  }

  tabs.forEach((tab) => {
    const row = document.createElement("div");
    row.className = tab.active ? "tab-row active-tab" : "tab-row";

    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = tab.title || "Untitled";

    const url = document.createElement("div");
    url.className = "tab-url";
    url.textContent = tab.url || "";

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.type = "button";
    closeBtn.textContent = "X";
    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (typeof tab.id === "number") {
        pushControlCommand("CLOSE_TAB", { tabId: tab.id });
      }
    });

    row.addEventListener("click", () => {
      if (typeof tab.id === "number") {
        pushControlCommand("FOCUS_TAB", { tabId: tab.id });
      }
    });

    row.appendChild(title);
    row.appendChild(url);
    row.appendChild(closeBtn);
    screenModalTabs.appendChild(row);
  });
}

function renderStudentHistoryPanel(student) {
  const history = Array.isArray(student.tabHistory) ? [...student.tabHistory] : [];
  history.sort((a, b) => (b?.at || 0) - (a?.at || 0));
  const eventFilter = historyFilterSelect?.value || "all";
  const search = String(historySearchInput?.value || "").trim().toLowerCase();

  const filtered = history.filter((entry) => {
    const eventType = String(entry?.eventType || "visited").toLowerCase();
    if (eventFilter !== "all" && eventType !== eventFilter) return false;

    if (!search) return true;
    const url = String(entry?.url || "").toLowerCase();
    const title = String(entry?.title || "").toLowerCase();
    let host = "";
    try {
      host = new URL(entry?.url || "").hostname.toLowerCase();
    } catch {
      host = "";
    }

    return url.includes(search) || title.includes(search) || host.includes(search);
  });

  tabsCount.textContent = history.length
    ? `${filtered.length}/${history.length} events`
    : "";
  screenModalTabs.innerHTML = "";

  if (!history.length) {
    screenModalTabs.innerHTML = '<div class="tab-row">No history data yet.</div>';
    return;
  }

  if (!filtered.length) {
    screenModalTabs.innerHTML = '<div class="tab-row">No history items match this filter.</div>';
    return;
  }

  filtered.forEach((entry) => {
    const row = document.createElement("div");
    const eventType = String(entry?.eventType || "visited").toLowerCase();
    row.className = eventType === "deleted" ? "tab-row deleted-tab" : "tab-row";

    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = entry.title || "Untitled";

    const url = document.createElement("div");
    url.className = "tab-url";
    url.textContent = entry.url || "";

    const eventBadge = document.createElement("span");
    eventBadge.className = `tab-event ${eventType === "deleted" ? "deleted" : "visited"}`;
    const time = entry?.at ? new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    eventBadge.textContent = `${eventType === "deleted" ? "Deleted" : "Visited"}${time ? ` · ${time}` : ""}`;

    row.appendChild(title);
    row.appendChild(url);
    row.appendChild(eventBadge);
    screenModalTabs.appendChild(row);
  });
}

async function pushControlCommand(type, extra = {}) {
  if (!selectedStudentContext?.studentId) return;

  const targetPath = selectedStudentContext.classId
    ? `classrooms/${selectedStudentContext.classId}`
    : classRefPath;
  if (!targetPath) return;

  const payload = {
    type,
    createdAt: Date.now(),
    targetStudentId: selectedStudentContext.studentId,
    ...extra
  };

  await push(ref(db, `${targetPath}/commands`), payload);
  statusBanner.textContent = `Sent command: ${type}`;
}

async function saveClassroomSettings() {
  if (!classRefPath || viewingAllClassrooms) return;

  const className = settingsClassNameInput.value.trim();
  const classType = settingsClassTypeInput.value || "Other";
  const domains = blockedDomainsInput.value
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const categories = Array.from(blockedCategoriesSelect.selectedOptions).map((option) => option.value);

  await update(ref(db, classRefPath), {
    className: className || classroomData?.className || "Class",
    classType,
    updatedAt: Date.now()
  });

  await update(ref(db, `${classRefPath}/settings`), {
    blockedDomains: domains,
    blockedCategories: categories,
    updatedAt: Date.now()
  });

  statusBanner.textContent = "Settings saved.";
}

async function copyClassCode() {
  const code = classCodeDisplay.textContent.trim();
  if (!code || code === "--------") {
    statusBanner.textContent = "No district code available yet.";
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    statusBanner.textContent = `District code copied: ${code}`;
  } catch {
    statusBanner.textContent = `Copy failed. District code: ${code}`;
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
  stopTeacherHeartbeat();
  if (stopPendingStudentsWatcher) {
    stopPendingStudentsWatcher();
    stopPendingStudentsWatcher = null;
  }
  if (stopTeacherClassesWatcher) {
    stopTeacherClassesWatcher();
    stopTeacherClassesWatcher = null;
  }
  if (stopTeacherDistrictWatcher) {
    stopTeacherDistrictWatcher();
    stopTeacherDistrictWatcher = null;
  }
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
  if (stopUsersWatcher) {
    stopUsersWatcher();
    stopUsersWatcher = null;
  }
}

function startTeacherHeartbeat(activeClassId) {
  const classId = activeClassId || userProfile?.activeClassId || userProfile?.classId;
  if (!userProfile || userProfile.role !== "teacher" || !classId) return;
  stopTeacherHeartbeat();
  setTeacherOnlineStatus(true, classId);
  teacherHeartbeatTimer = setInterval(() => {
    setTeacherOnlineStatus(true, classId);
  }, 15000);
}

function stopTeacherHeartbeat() {
  if (teacherHeartbeatTimer) {
    clearInterval(teacherHeartbeatTimer);
    teacherHeartbeatTimer = null;
  }
  const classId = userProfile?.activeClassId || userProfile?.classId;
  if (userProfile?.role === "teacher" && classId) {
    setTeacherOnlineStatus(false, classId);
  }
}

async function setTeacherOnlineStatus(online, classId) {
  if (!userProfile || userProfile.role !== "teacher" || !classId) return;
  try {
    await update(ref(db, `classrooms/${classId}/teacherStatus`), {
      online,
      lastSeen: Date.now(),
      teacherName: userProfile.displayName || "",
      classType: classroomData?.classType || null
    });
  } catch {
    // No-op for heartbeat failures.
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

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) {
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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function handleDatabasePermissionError(error) {
  if (error?.message?.includes("Permission denied")) {
    statusBanner.textContent = "Firebase Realtime Database denied access. Check your database rules for users and pendingTeachers.";
    pendingView.classList.remove("hidden");
    return;
  }
  statusBanner.textContent = error?.message || "Database request failed.";
}

function sanitizeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderAddStudentsPicker() {
  addStudentsList.innerHTML = "";
  const entries = Object.entries(pendingStudentsCache || {}).filter(([, data]) => !data?.assignedClassId);
  if (!entries.length) {
    addStudentsList.innerHTML = "<div class=\"class-student-row\">No district students waiting.</div>";
    return;
  }

  entries.forEach(([pendingId, pending]) => {
    const row = document.createElement("label");
    row.className = "class-student-row";
    row.innerHTML = `
      <span>${pending.displayName || "Student"} (${pending.email || "No email"})</span>
      <input type="checkbox" value="${pendingId}">
    `;
    addStudentsList.appendChild(row);
  });
}

async function addSelectedStudentsToCurrentClass() {
  if (!classRefPath || !userProfile?.districtId) {
    statusBanner.textContent = "Select a class first.";
    return;
  }
  const activeClassId = userProfile.activeClassId || userProfile.classId;
  const selectedIds = Array.from(addStudentsList.querySelectorAll("input[type=\"checkbox\"]:checked")).map((input) => input.value);
  if (!selectedIds.length) {
    statusBanner.textContent = "Select at least one student.";
    return;
  }

  for (const pendingId of selectedIds) {
    const pending = pendingStudentsCache[pendingId] || {};
    await update(ref(db, `${classRefPath}/students/${pendingId}`), {
      active: true,
      email: pending.email || "",
      displayName: pending.displayName || "Student",
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      lockUrl: null
    });
    await update(ref(db, `districtPending/${userProfile.districtId}/${pendingId}`), {
      assignedClassId: activeClassId,
      assignedAt: Date.now(),
      assignedTeacherId: currentUser.uid,
      assignedTeacherName: userProfile.displayName || ""
    });
  }

  addStudentsModal.classList.add("hidden");
  statusBanner.textContent = `Added ${selectedIds.length} student${selectedIds.length === 1 ? "" : "s"} to this class.`;
}
