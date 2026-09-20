import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, push } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const inviteHeadline = document.getElementById("invite-headline");
const inviteFormCard = document.getElementById("invite-form-card");
const inviteEmail = document.getElementById("invite-email");
const invitePassword = document.getElementById("invite-password");
const inviteTeacherFields = document.getElementById("invite-teacher-fields");
const inviteTeacherName = document.getElementById("invite-teacher-name");
const inviteClassName = document.getElementById("invite-class-name");
const inviteClassSubject = document.getElementById("invite-class-subject");
const inviteAdminFields = document.getElementById("invite-admin-fields");
const inviteFirstName = document.getElementById("invite-first-name");
const inviteLastName = document.getElementById("invite-last-name");
const acceptInviteBtn = document.getElementById("accept-invite-btn");
const inviteStatus = document.getElementById("invite-status");

const token = new URLSearchParams(window.location.search).get("token") || "";
let invite = null;
let teacherAccountUid = null;
let teacherAccountEmail = "";

function setStatus(message) {
  inviteStatus.textContent = message;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function loadInvite() {
  if (!token) {
    inviteHeadline.textContent = "Invalid invite link.";
    inviteFormCard.classList.add("hidden");
    return;
  }

  const snap = await get(ref(db, `inviteTokens/${token}`));
  invite = snap.val();

  if (!invite || invite.used) {
    inviteHeadline.textContent = "This invite is no longer available.";
    inviteFormCard.classList.add("hidden");
    return;
  }

  if ((invite.expiresAt || 0) < Date.now()) {
    inviteHeadline.textContent = "This invite has expired.";
    inviteFormCard.classList.add("hidden");
    return;
  }

  inviteHeadline.textContent = `You were invited to ${invite.districtName || "a district"} as ${invite.role === "admin" ? "District Administrator" : "Teacher"}.`;
  inviteEmail.value = invite.email || "";
  inviteTeacherFields.classList.add("hidden");
  inviteAdminFields.classList.toggle("hidden", invite.role !== "admin");
  if (invite.role === "teacher") {
    acceptInviteBtn.textContent = "Create account";
  }
}

async function acceptInvite() {
  if (!invite) return;

  const email = normalizeEmail(inviteEmail.value);
  const password = String(invitePassword.value || "");
  if (!email || !password) {
    setStatus("Enter email and password.");
    return;
  }

  if (invite.role === "teacher") {
    if (!teacherAccountUid) {
      setStatus("Creating account...");
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      teacherAccountUid = credential.user.uid;
      teacherAccountEmail = email;

      await set(ref(db, `users/${teacherAccountUid}`), {
        email,
        displayName: "Teacher",
        role: "teacher",
        approved: true,
        districtId: invite.districtId,
        districtName: invite.districtName || "District",
        updatedAt: Date.now()
      });

      inviteTeacherFields.classList.remove("hidden");
      inviteEmail.disabled = true;
      invitePassword.disabled = true;
      acceptInviteBtn.textContent = "Create classroom";
      setStatus("Account created. Enter classroom details.");
      return;
    }

    const displayName = String(inviteTeacherName.value || "").trim();
    const className = String(inviteClassName.value || "").trim();
    const classType = String(inviteClassSubject.value || "").trim() || "Other";
    if (!displayName || !className) {
      setStatus("Enter your name and classroom name.");
      return;
    }

    await set(ref(db, `users/${teacherAccountUid}`), {
      email: teacherAccountEmail,
      displayName,
      role: "teacher",
      approved: true,
      districtId: invite.districtId,
      districtName: invite.districtName || "District",
      updatedAt: Date.now()
    });

    const classId = push(ref(db, "classrooms")).key;
    await set(ref(db, `classrooms/${classId}`), {
      classId,
      classCode: generateClassCode(),
      className,
      classType,
      teacherId: teacherAccountUid,
      teacherName: displayName,
      districtId: invite.districtId,
      districtName: invite.districtName || "District",
      createdAt: Date.now(),
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

    await update(ref(db, `users/${teacherAccountUid}`), {
      activeClassId: classId,
      updatedAt: Date.now()
    });

    await update(ref(db, `inviteTokens/${token}`), { used: true, usedAt: Date.now(), usedByUid: teacherAccountUid });
    await update(ref(db, `districtInvites/${invite.districtId}/${token}`), { used: true, usedAt: Date.now(), usedByUid: teacherAccountUid });
    setStatus("Classroom created. Redirecting...");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1000);
    return;
  } else {
    const firstName = String(inviteFirstName.value || "").trim();
    const lastName = String(inviteLastName.value || "").trim();
    if (!firstName || !lastName) {
      setStatus("Enter first and last name.");
      return;
    }

    setStatus("Creating account...");
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await set(ref(db, `users/${credential.user.uid}`), {
      email,
      displayName: `${firstName} ${lastName}`.trim(),
      role: "admin",
      approved: true,
      districtId: invite.districtId,
      districtName: invite.districtName || "District",
      updatedAt: Date.now()
    });

    await update(ref(db, `inviteTokens/${token}`), { used: true, usedAt: Date.now(), usedByUid: credential.user.uid });
    await update(ref(db, `districtInvites/${invite.districtId}/${token}`), { used: true, usedAt: Date.now(), usedByUid: credential.user.uid });
    setStatus("Account created. Redirecting...");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1000);
    return;
  }
}

acceptInviteBtn.addEventListener("click", () => {
  acceptInvite().catch((error) => {
    setStatus(error?.message || "Failed to accept invite.");
  });
});

loadInvite().catch((error) => {
  inviteHeadline.textContent = error?.message || "Failed to load invite.";
  inviteFormCard.classList.add("hidden");
});
