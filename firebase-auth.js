import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore, doc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// =====================================================
// 2M Elshazly - Firebase
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
const customerTypeInputs = document.querySelectorAll('input[name="customerType"]');
const welcomeGiftModal = document.getElementById("welcomeGiftModal");
const chooseDiscountGift = document.getElementById("chooseDiscountGift");
const chooseFreeGamesGift = document.getElementById("chooseFreeGamesGift");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    loginBtn.disabled = true;
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("2M Elshazly Google Login Error:", error);
      alert("حصل خطأ أثناء تسجيل الدخول. تأكد إن Google Login مفعّل في Firebase.");
    } finally {
      loginBtn.disabled = false;
    }
  });
}

function showProfile(user) {
  if (loginBtn) loginBtn.style.display = "none";
  if (profileBox) profileBox.style.display = "flex";
  const displayName = user.displayName || "مستخدم";

  if (user.photoURL) {
    let cleanUrl = user.photoURL.replace("http://", "https://");
    if (cleanUrl.includes("googleusercontent.com")) cleanUrl = cleanUrl.replace(/=s\d+-c/, "=s0");
    if (photoEl) { photoEl.src = cleanUrl; photoEl.style.display = "block"; }
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
  if (loginBtn) loginBtn.style.display = "flex";
  if (profileBox) profileBox.style.display = "none";
  if (whatsappModal) whatsappModal.style.display = "none";
  if (welcomeGiftModal) welcomeGiftModal.style.display = "none";
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
        customerType: "",
        points: FIRST_LOGIN_BONUS,
        lifetimePoints: FIRST_LOGIN_BONUS,
        totalPointsEarned: FIRST_LOGIN_BONUS,
        level: "NORMAL",
        firstLoginBonusAwarded: true,
        welcomeGiftStatus: "available",
        welcomeGiftType: "",
        welcomeGiftGames: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    return { points: FIRST_LOGIN_BONUS, lifetimePoints: FIRST_LOGIN_BONUS, whatsapp: "", customerType: "", welcomeGiftStatus: "available" };
  }

  // تحديث الحسابات القديمة بدون لمس الرصيد الموجود.
  if (snap.exists()) {
    const d = snap.data();
    const patch = {};
    if (d.points === undefined) patch.points = 0;
    if (d.lifetimePoints === undefined) patch.lifetimePoints = Number(d.totalPointsEarned || d.points || 0);
    if (d.totalPointsEarned === undefined) patch.totalPointsEarned = Number(d.lifetimePoints || d.points || 0);
    if (d.level === undefined) patch.level = Number(d.lifetimePoints || d.totalPointsEarned || d.points || 0) >= VIP_THRESHOLD ? "VIP" : "NORMAL";
    if (d.customerType === undefined) patch.customerType = "";
    if (d.welcomeGiftStatus === undefined) patch.welcomeGiftStatus = "used"; // الحسابات القديمة لا تأخذ هدية بأثر رجعي.
    if (Object.keys(patch).length) await runTransaction(db, async t => t.set(userRef, {...patch, updatedAt: serverTimestamp()}, {merge:true}));
    return {...d, ...patch};
  }
}

async function checkPhoneAndGift(user) {
  const data = await prepareUserDocument(user);
  const phone = String(data?.whatsapp || "").trim();
  const customerType = String(data?.customerType || "").trim();

  if (!phone || !customerType) {
    if (whatsappInput) whatsappInput.value = phone;
    customerTypeInputs.forEach(input => {
      input.checked = input.value === customerType;
    });
    if (whatsappModal) whatsappModal.style.display = "flex";
    return;
  }

  if (whatsappModal) whatsappModal.style.display = "none";

  const giftStatus = data?.welcomeGiftStatus || "used";
  if (giftStatus === "available") {
    if (welcomeGiftModal) welcomeGiftModal.style.display = "flex";
  } else {
    if (welcomeGiftModal) welcomeGiftModal.style.display = "none";
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { showLogin(); return; }
  showProfile(user);
  try {
    await checkPhoneAndGift(user);
  } catch (error) {
    console.error("خطأ في تجهيز حساب العميل:", error);
    if (whatsappModal) whatsappModal.style.display = "flex";
    if (whatsappError) {
      whatsappError.style.display = "block";
      whatsappError.innerText = "حصل خطأ في تحميل بيانات حسابك. حاول تحديث الصفحة.";
    }
  }
});

if (saveWhatsappBtn) {
  saveWhatsappBtn.addEventListener("click", async () => {
    const raw = (whatsappInput?.value || "").trim();
    const cleanNumber = raw.replace(/\D/g, "");
    if (!/^01[0125][0-9]{8}$/.test(cleanNumber)) {
      if (whatsappError) { whatsappError.style.display = "block"; whatsappError.innerText = "اكتب رقم موبايل مصري صحيح مثل: 01012345678"; }
      return;
    }

    const selectedCustomerType = document.querySelector('input[name="customerType"]:checked')?.value || "";
    if (!selectedCustomerType) {
      if (whatsappError) { whatsappError.style.display = "block"; whatsappError.innerText = "اختار الأول: صاحب محل ولا عميل بيت."; }
      return;
    }

    const user = auth.currentUser;
    if (!user) return;
    saveWhatsappBtn.disabled = true;
    saveWhatsappBtn.innerText = "جاري الحفظ... ⏳";
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const snap = await transaction.get(userRef);
        const old = snap.exists() ? snap.data() : {};
        transaction.set(userRef, {
          uid: user.uid,
          name: user.displayName || old.name || "مستخدم جديد",
          email: user.email || old.email || "",
          photoURL: user.photoURL || old.photoURL || "",
          whatsapp: cleanNumber,
          customerType: selectedCustomerType,
          points: Number(old.points || 0),
          lifetimePoints: Number(old.lifetimePoints ?? old.totalPointsEarned ?? 0),
          totalPointsEarned: Number(old.totalPointsEarned || old.lifetimePoints || 0),
          level: Number(old.lifetimePoints ?? old.totalPointsEarned ?? 0) >= VIP_THRESHOLD ? "VIP" : "NORMAL",
          updatedAt: serverTimestamp()
        }, {merge:true});
      });
      if (whatsappModal) whatsappModal.style.display = "none";
      const snap = await getDoc(doc(db, "users", user.uid));
      if ((snap.data()?.welcomeGiftStatus || "used") === "available" && welcomeGiftModal) welcomeGiftModal.style.display = "flex";
    } catch (error) {
      console.error("خطأ في حفظ رقم الهاتف:", error);
      if (whatsappError) { whatsappError.style.display = "block"; whatsappError.innerText = "حصل خطأ أثناء حفظ الرقم. حاول مرة أخرى."; }
    } finally {
      saveWhatsappBtn.disabled = false;
      saveWhatsappBtn.innerText = "حفظ ومتابعة";
    }
  });
}

async function chooseWelcomeGift(type) {
  const user = auth.currentUser;
  if (!user) return;
  chooseDiscountGift && (chooseDiscountGift.disabled = true);
  chooseFreeGamesGift && (chooseFreeGamesGift.disabled = true);
  try {
    const userRef = doc(db, "users", user.uid);
    await runTransaction(db, async transaction => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error("حساب العميل غير موجود");
      const d = snap.data();
      if ((d.welcomeGiftStatus || "used") !== "available") throw new Error("الهدية تم استخدامها بالفعل");
      transaction.set(userRef, {
        welcomeGiftStatus: type === "discount20" ? "discount20" : "free10_pending",
        welcomeGiftType: type,
        welcomeGiftGames: [],
        updatedAt: serverTimestamp()
      }, {merge:true});
    });

    if (welcomeGiftModal) welcomeGiftModal.style.display = "none";
    if (type === "free10") {
      window.location.href = "games.html?welcomeGift=free10";
    } else {
      alert("🎉 تم تفعيل خصم 20% لأول طلب لك في 2M Elshazly!");
    }
  } catch (error) {
    console.error(error);
    alert(error.message || "حصل خطأ أثناء اختيار الهدية.");
    if (welcomeGiftModal) welcomeGiftModal.style.display = "flex";
  } finally {
    chooseDiscountGift && (chooseDiscountGift.disabled = false);
    chooseFreeGamesGift && (chooseFreeGamesGift.disabled = false);
  }
}

chooseDiscountGift?.addEventListener("click", () => chooseWelcomeGift("discount20"));
chooseFreeGamesGift?.addEventListener("click", () => chooseWelcomeGift("free10"));

export { auth, db, VIP_THRESHOLD, FIRST_LOGIN_BONUS };

