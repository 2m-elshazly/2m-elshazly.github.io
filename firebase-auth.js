import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// =====================================================
// 2M Elshazly - Firebase Authentication + Customer Profile
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyAeYbBx4yMyDCXhGAQS_X7KDhiKGPDZvWY",
  authDomain: "m-elshazly-e19a2.firebaseapp.com",
  projectId: "m-elshazly-e19a2",
  storageBucket: "m-elshazly-e19a2.firebasestorage.app",
  messagingSenderId: "1006926908276",
  appId: "1:1006926908276:web:ff1274fcea961f251afa21",
  measurementId: "G-HWXPWBVB75"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// نظام 2M Elshazly
const FIRST_LOGIN_BONUS = 0;
const VIP_THRESHOLD = 10000;

const loginBtn = document.getElementById("loginBtn");
const profileBox = document.getElementById("userProfileBox");
const photoEl = document.getElementById("headerUserPhoto");
const letterEl = document.getElementById("headerUserLetter");

const whatsappModal = document.getElementById("whatsappModal");
const whatsappInput = document.getElementById("whatsappInput");
const saveWhatsappBtn = document.getElementById("saveWhatsappBtn");
const whatsappError = document.getElementById("whatsappError");

const welcomeGiftModal = document.getElementById("welcomeGiftModal");
const chooseDiscountGift = document.getElementById("chooseDiscountGift");
const chooseFreeGamesGift = document.getElementById("chooseFreeGamesGift");

function showProfile(user) {
  if (loginBtn) loginBtn.style.display = "none";
  if (profileBox) profileBox.style.display = "flex";

  const displayName = user.displayName || "مستخدم";

  if (user.photoURL) {
    let cleanUrl = user.photoURL.replace("http://", "https://");
    if (cleanUrl.includes("googleusercontent.com")) {
      cleanUrl = cleanUrl.replace(/=s\d+-c/, "=s0");
    }

    if (photoEl) {
      photoEl.src = cleanUrl;
      photoEl.style.display = "block";
    }
    if (letterEl) letterEl.style.display = "none";
  } else {
    if (photoEl) photoEl.style.display = "none";
    if (letterEl) {
      letterEl.innerText = displayName.trim().charAt(0).toUpperCase();
      letterEl.style.display = "flex";
    }
  }
}

function showLogin() {
  if (loginBtn) {
    loginBtn.style.display = "flex";
    loginBtn.disabled = false;
  }
  if (profileBox) profileBox.style.display = "none";
  if (whatsappModal) whatsappModal.style.display = "none";
  if (welcomeGiftModal) welcomeGiftModal.style.display = "none";
}

function explainAuthError(error) {
  const code = error?.code || "";

  if (code === "auth/popup-closed-by-user") return "تم إغلاق نافذة تسجيل الدخول.";
  if (code === "auth/popup-blocked") return "المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة للموقع ثم حاول مرة أخرى.";
  if (code === "auth/unauthorized-domain") return "الدومين الحالي غير مضاف في Firebase. أضف دومين الموقع من Authentication > Settings > Authorized domains.";
  if (code === "auth/operation-not-allowed") return "تسجيل الدخول بواسطة Google غير مفعّل في Firebase Authentication.";
  if (code === "auth/network-request-failed") return "مشكلة في الإنترنت. حاول مرة أخرى.";
  if (code === "auth/cancelled-popup-request") return "تم إلغاء نافذة تسجيل الدخول السابقة.";

  return "حصل خطأ أثناء تسجيل الدخول. افتح Console لو استمرت المشكلة.";
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    loginBtn.disabled = true;
    const oldText = loginBtn.innerText;
    loginBtn.innerText = "جاري تسجيل الدخول...";

    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged يتولى إظهار الحساب والفورم؛ لا نحتاج reload.
    } catch (error) {
      console.error("2M Elshazly Google Login Error:", error);
      alert(explainAuthError(error));
      loginBtn.disabled = false;
      loginBtn.innerText = oldText;
    }
  });
}

async function prepareUserDocument(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await runTransaction(db, async (transaction) => {
      const fresh = await transaction.get(userRef);
      if (fresh.exists()) return;

      transaction.set(userRef, {
        uid: user.uid,
        name: user.displayName || "مستخدم جديد",
        email: user.email || "",
        photoURL: user.photoURL || "",
        whatsapp: "",
        points: 0,
        lifetimePoints: 0,
        totalPointsEarned: 0,
        level: "NORMAL",
        firstLoginBonusAwarded: false,
        welcomeGiftStatus: "available",
        welcomeGiftType: "",
        welcomeGiftGames: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    return {
      points: 0,
      lifetimePoints: 0,
      whatsapp: "",
      welcomeGiftStatus: "available"
    };
  }

  const d = snap.data();
  const patch = {};

  if (d.points === undefined) patch.points = 0;
  if (d.lifetimePoints === undefined) {
    patch.lifetimePoints = Number(d.totalPointsEarned || d.points || 0);
  }
  if (d.totalPointsEarned === undefined) {
    patch.totalPointsEarned = Number(d.lifetimePoints || d.points || 0);
  }
  if (d.level === undefined) {
    const lifetime = Number(d.lifetimePoints || d.totalPointsEarned || d.points || 0);
    patch.level = lifetime >= VIP_THRESHOLD ? "VIP" : "NORMAL";
  }
  // الحسابات القديمة لا تحصل على هدية تسجيل بأثر رجعي.
  if (d.welcomeGiftStatus === undefined) patch.welcomeGiftStatus = "used";

  if (Object.keys(patch).length) {
    await runTransaction(db, async (transaction) => {
      transaction.set(userRef, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    });
  }

  return { ...d, ...patch };
}

async function checkPhoneAndGift(user) {
  const data = await prepareUserDocument(user);
  const phone = String(data?.whatsapp || "").trim();

  if (!phone) {
    if (whatsappInput) whatsappInput.value = "";
    if (whatsappModal) whatsappModal.style.display = "flex";
    return;
  }

  if (whatsappModal) whatsappModal.style.display = "none";

  if (data?.welcomeGiftStatus === "available") {
    if (welcomeGiftModal) welcomeGiftModal.style.display = "flex";
  } else {
    if (welcomeGiftModal) welcomeGiftModal.style.display = "none";
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showLogin();
    return;
  }

  showProfile(user);

  try {
    await checkPhoneAndGift(user);
  } catch (error) {
    console.error("2M Elshazly account setup error:", error);
    if (whatsappModal) whatsappModal.style.display = "flex";
    if (whatsappError) {
      whatsappError.style.display = "block";
      whatsappError.innerText = "حصل خطأ في تحميل بيانات حسابك. تأكد من Firestore Rules ثم حاول مرة أخرى.";
    }
  }
});

if (saveWhatsappBtn) {
  saveWhatsappBtn.addEventListener("click", async () => {
    const raw = (whatsappInput?.value || "").trim();
    const cleanNumber = raw.replace(/\D/g, "");

    if (!/^01[0125][0-9]{8}$/.test(cleanNumber)) {
      if (whatsappError) {
        whatsappError.style.display = "block";
        whatsappError.innerText = "اكتب رقم موبايل مصري صحيح مثل: 01012345678";
      }
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    saveWhatsappBtn.disabled = true;
    saveWhatsappBtn.innerText = "جاري الحفظ... ⏳";

    try {
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(userRef);
        const old = snap.exists() ? snap.data() : {};
        const lifetime = Number(old.lifetimePoints ?? old.totalPointsEarned ?? 0);

        transaction.set(userRef, {
          uid: user.uid,
          name: user.displayName || old.name || "مستخدم جديد",
          email: user.email || old.email || "",
          photoURL: user.photoURL || old.photoURL || "",
          whatsapp: cleanNumber,
          points: Number(old.points || 0),
          lifetimePoints: lifetime,
          totalPointsEarned: Number(old.totalPointsEarned ?? lifetime),
          level: lifetime >= VIP_THRESHOLD ? "VIP" : "NORMAL",
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      if (whatsappError) whatsappError.style.display = "none";
      if (whatsappModal) whatsappModal.style.display = "none";

      const fresh = await getDoc(userRef);
      if (fresh.exists() && fresh.data()?.welcomeGiftStatus === "available") {
        if (welcomeGiftModal) welcomeGiftModal.style.display = "flex";
      }
    } catch (error) {
      console.error("2M Elshazly phone save error:", error);
      if (whatsappError) {
        whatsappError.style.display = "block";
        whatsappError.innerText = "حصل خطأ أثناء حفظ الرقم. تأكد من Firestore Rules وحاول مرة أخرى.";
      }
    } finally {
      saveWhatsappBtn.disabled = false;
      saveWhatsappBtn.innerText = "حفظ ومتابعة";
    }
  });
}

async function chooseWelcomeGift(type) {
  const user = auth.currentUser;
  if (!user) return;

  if (chooseDiscountGift) chooseDiscountGift.disabled = true;
  if (chooseFreeGamesGift) chooseFreeGamesGift.disabled = true;

  try {
    const userRef = doc(db, "users", user.uid);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error("حساب العميل غير موجود");

      const d = snap.data();
      if (d.welcomeGiftStatus !== "available") {
        throw new Error("الهدية تم استخدامها بالفعل");
      }

      transaction.set(userRef, {
        welcomeGiftStatus: type === "discount20" ? "discount20" : "free10_pending",
        welcomeGiftType: type,
        welcomeGiftGames: [],
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    if (welcomeGiftModal) welcomeGiftModal.style.display = "none";

    if (type === "free10") {
      window.location.href = "games.html?welcomeGift=free10";
    } else {
      alert("🎉 تم تفعيل خصم 20% على أول طلب لك من 2M Elshazly!");
    }
  } catch (error) {
    console.error("2M Elshazly welcome gift error:", error);
    alert(error.message || "حصل خطأ أثناء اختيار الهدية.");
    if (welcomeGiftModal) welcomeGiftModal.style.display = "flex";
  } finally {
    if (chooseDiscountGift) chooseDiscountGift.disabled = false;
    if (chooseFreeGamesGift) chooseFreeGamesGift.disabled = false;
  }
}

if (chooseDiscountGift) {
  chooseDiscountGift.addEventListener("click", () => chooseWelcomeGift("discount20"));
}
if (chooseFreeGamesGift) {
  chooseFreeGamesGift.addEventListener("click", () => chooseWelcomeGift("free10"));
}

export { auth, db, VIP_THRESHOLD, FIRST_LOGIN_BONUS };

