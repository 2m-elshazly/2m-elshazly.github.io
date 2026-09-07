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
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc
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

// =====================================================
// 2M Elshazly Settings
// =====================================================
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

// =====================================================
// 2M Elshazly - Notification System
// =====================================================

let stopNotifications = null;

function installNotificationUI() {

  if (document.getElementById("m2mNotificationBell")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "m2mNotificationStyle";

  style.textContent = `
    #m2mNotificationWrap{
      position:fixed;
      top:16px;
      right:18px;
      z-index:99999;
      font-family:Arial,sans-serif;
      direction:rtl
    }

    #m2mNotificationBell{
      border:1px solid rgba(255,255,255,.18);
      background:#111;
      color:#fff;
      width:46px;
      height:46px;
      border-radius:50%;
      cursor:pointer;
      font-size:21px;
      box-shadow:0 8px 25px rgba(0,0,0,.35);
      position:relative
    }

    #m2mNotificationBadge{
      position:absolute;
      top:-4px;
      left:-4px;
      background:#e11d48;
      color:#fff;
      min-width:20px;
      height:20px;
      padding:0 5px;
      border-radius:20px;
      font-size:11px;
      font-weight:900;
      display:none;
      align-items:center;
      justify-content:center;
      border:2px solid #111
    }

    #m2mNotificationPanel{
      display:none;
      position:absolute;
      top:54px;
      right:0;
      width:min(360px,calc(100vw - 30px));
      max-height:70vh;
      overflow:auto;
      background:#151515;
      color:#fff;
      border:1px solid #2c2c2c;
      border-radius:18px;
      box-shadow:0 18px 60px rgba(0,0,0,.55);
      padding:12px
    }

    #m2mNotificationPanel.open{
      display:block
    }

    .m2mNotifHead{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:4px 4px 10px;
      border-bottom:1px solid #282828;
      margin-bottom:8px
    }

    .m2mNotifHead b{
      font-size:15px
    }

    .m2mNotifItem{
      padding:12px;
      border:1px solid #282828;
      border-radius:13px;
      background:#101010;
      margin-bottom:8px;
      cursor:pointer
    }

    .m2mNotifItem.unread{
      border-color:#0070d1;
      background:rgba(0,112,209,.10)
    }

    .m2mNotifItem b{
      display:block;
      font-size:13px;
      margin-bottom:5px
    }

    .m2mNotifItem p{
      margin:0;
      color:#aaa;
      font-size:12px;
      line-height:1.7
    }

    .m2mNotifItem small{
      display:block;
      color:#666;
      margin-top:7px;
      font-size:10px
    }

    .m2mNotifEmpty{
      padding:20px;
      text-align:center;
      color:#777;
      font-size:12px
    }
  `;

  document.head.appendChild(style);

  const wrap = document.createElement("div");

  wrap.id = "m2mNotificationWrap";

  wrap.innerHTML = `
    <button id="m2mNotificationBell" type="button" aria-label="الإشعارات">
      🔔
      <span id="m2mNotificationBadge">0</span>
    </button>

    <div id="m2mNotificationPanel">

      <div class="m2mNotifHead">
        <b>🔔 إشعارات 2M Elshazly</b>
      </div>

      <div id="m2mNotificationList">
        <div class="m2mNotifEmpty">
          لا توجد إشعارات جديدة.
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(wrap);

  document
    .getElementById("m2mNotificationBell")
    .addEventListener("click", e => {

      e.stopPropagation();

      document
        .getElementById("m2mNotificationPanel")
        .classList.toggle("open");

    });

  document.addEventListener("click", e => {

    if (!wrap.contains(e.target)) {

      document
        .getElementById("m2mNotificationPanel")
        ?.classList.remove("open");

    }

  });

}

// =====================================================
// Notification Date
// =====================================================

function notificationDate(value) {

  try {

    const d =
      value?.toDate
        ? value.toDate()
        : new Date(value);

    return isNaN(d.getTime())
      ? ""
      : d.toLocaleString(
          "ar-EG",
          {
            dateStyle:"short",
            timeStyle:"short"
          }
        );

  } catch {

    return "";

  }

}

// =====================================================
// Start Notifications
// =====================================================

function startNotifications(user, customerData) {

  installNotificationUI();

  if (stopNotifications) {
    stopNotifications();
  }

  const listEl =
    document.getElementById("m2mNotificationList");

  const badgeEl =
    document.getElementById("m2mNotificationBadge");

  const customerTypeValue =
    customerData?.customerType || "";

  let all = [];
  let personal = [];

  // ===================================================
  // Render Notifications
  // ===================================================

  const render = () => {

    const merged =
      [...all, ...personal]

        .filter((n,i,a) =>
          a.findIndex(x => x.id === n.id) === i
        )

        .filter(n => {

          // إشعار شخصي
          if (n.targetUserId === user.uid) {
            return true;
          }

          // مش إشعار عام
          if (n.target !== "all") {
            return false;
          }

          // عام لكل العملاء
          if (!n.customerType) {
            return true;
          }

          // حسب نوع العميل
          return n.customerType === customerTypeValue;

        })

        .sort((a,b) => {

          const ad =
            a.createdAt?.toMillis?.() || 0;

          const bd =
            b.createdAt?.toMillis?.() || 0;

          return bd - ad;

        })

        .slice(0,30);

    // =================================================
    // Unread Count
    // =================================================

    const unread =
      merged.filter(n => n.read !== true);

    badgeEl.textContent =
      unread.length > 99
        ? "99+"
        : String(unread.length);

    badgeEl.style.display =
      unread.length
        ? "flex"
        : "none";

    // =================================================
    // List
    // =================================================

    listEl.innerHTML =

      merged.length

        ? merged.map(n => `

          <div
            class="m2mNotifItem ${n.read ? "" : "unread"}"
            data-notif-id="${n.id}"
          >

            <b>
              ${escapeNotificationText(
                n.title || "إشعار جديد"
              )}
            </b>

            <p>
              ${escapeNotificationText(
                n.message || ""
              )}
            </p>

            <small>
              ${notificationDate(n.createdAt)}
            </small>

          </div>

        `).join("")

        :

        `
        <div class="m2mNotifEmpty">
          لا توجد إشعارات حتى الآن.
        </div>
        `;

    // =================================================
    // Click Notification
    // =================================================

    listEl
      .querySelectorAll("[data-notif-id]")
      .forEach(item => {

        item.addEventListener("click", async () => {

          const id =
            item.dataset.notifId;

          const n =
            merged.find(x => x.id === id);

          try {

            if (n && n.read !== true) {

              await updateDoc(
                doc(
                  db,
                  "notifications",
                  id
                ),
                {
                  read:true
                }
              );

            }

            if (n?.link) {

              window.location.href =
                n.link;

            }

          } catch(error) {

            console.error(
              "2M notification read error:",
              error
            );

          }

        });

      });

  };

  // ===================================================
  // ALL CUSTOMERS
  // ===================================================

  const stopAll = onSnapshot(

    query(
      collection(db,"notifications"),
      where("target","==","all")
    ),

    snapshot => {

      all =
        snapshot.docs.map(
          d => ({
            id:d.id,
            ...d.data()
          })
        );

      render();

    },

    error => {

      console.error(
        "2M public notifications listener error:",
        error
      );

    }

  );

  // ===================================================
  // PERSONAL
  // ===================================================

  const stopPersonal = onSnapshot(

    query(
      collection(db,"notifications"),
      where(
        "targetUserId",
        "==",
        user.uid
      )
    ),

    snapshot => {

      personal =
        snapshot.docs.map(
          d => ({
            id:d.id,
            ...d.data()
          })
        );

      render();

    },

    error => {

      console.error(
        "2M personal notifications listener error:",
        error
      );

    }

  );

  stopNotifications = () => {

    stopAll();
    stopPersonal();

  };

}

// =====================================================
// Escape Notification Text
// =====================================================

function escapeNotificationText(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      c => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[c])
    );

}

// =====================================================
// Show Profile
// =====================================================

function showProfile(user) {

  if (loginBtn) {
    loginBtn.style.display = "none";
  }

  if (profileBox) {
    profileBox.style.display = "flex";
  }

  const displayName =
    user.displayName || "مستخدم";

  if (user.photoURL) {

    let cleanUrl =
      user.photoURL.replace(
        "http://",
        "https://"
      );

    if (
      cleanUrl.includes(
        "googleusercontent.com"
      )
    ) {

      cleanUrl =
        cleanUrl.replace(
          /=s\d+-c/,
          "=s0"
        );

    }

    if (photoEl) {

      photoEl.src = cleanUrl;
      photoEl.style.display = "block";

    }

    if (letterEl) {
      letterEl.style.display = "none";
    }

  } else {

    if (photoEl) {
      photoEl.style.display = "none";
    }

    if (letterEl) {

      letterEl.innerText =
        displayName
          .trim()
          .charAt(0)
          .toUpperCase();

      letterEl.style.display =
        "flex";

    }

  }

}

// =====================================================
// Show Login
// =====================================================

function showLogin() {

  if (loginBtn) {

    loginBtn.style.display = "flex";
    loginBtn.disabled = false;

  }

  if (profileBox) {
    profileBox.style.display = "none";
  }

  if (whatsappModal) {
    whatsappModal.style.display = "none";
  }

  if (welcomeGiftModal) {
    welcomeGiftModal.style.display = "none";
  }

}

// =====================================================
// Auth Error
// =====================================================

function explainAuthError(error) {

  const code =
    error?.code || "";

  if (
    code ===
    "auth/popup-closed-by-user"
  ) {
    return "تم إغلاق نافذة تسجيل الدخول.";
  }

  if (
    code ===
    "auth/popup-blocked"
  ) {
    return "المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة للموقع ثم حاول مرة أخرى.";
  }

  if (
    code ===
    "auth/unauthorized-domain"
  ) {
    return "الدومين الحالي غير مضاف في Firebase. أضف دومين الموقع من Authentication > Settings > Authorized domains.";
  }

  if (
    code ===
    "auth/operation-not-allowed"
  ) {
    return "تسجيل الدخول بواسطة Google غير مفعّل في Firebase Authentication.";
  }

  if (
    code ===
    "auth/network-request-failed"
  ) {
    return "مشكلة في الإنترنت. حاول مرة أخرى.";
  }

  if (
    code ===
    "auth/cancelled-popup-request"
  ) {
    return "تم إلغاء نافذة تسجيل الدخول السابقة.";
  }

  return "حصل خطأ أثناء تسجيل الدخول. افتح Console لو استمرت المشكلة.";

}

// =====================================================
// Google Login
// =====================================================

if (loginBtn) {

  loginBtn.addEventListener(
    "click",
    async () => {

      loginBtn.disabled = true;

      const oldText =
        loginBtn.innerText;

      loginBtn.innerText =
        "جاري تسجيل الدخول...";

      try {

        await signInWithPopup(
          auth,
          provider
        );

        // onAuthStateChanged
        // يتولى باقي الخطوات

      } catch (error) {

        console.error(
          "2M Elshazly Google Login Error:",
          error
        );

        alert(
          explainAuthError(error)
        );

        loginBtn.disabled = false;
        loginBtn.innerText = oldText;

      }

    }
  );

}

// =====================================================
// Prepare User Document
// =====================================================

async function prepareUserDocument(user) {

  const userRef =
    doc(db,"users",user.uid);

  const snap =
    await getDoc(userRef);

  // ===================================================
  // New User
  // ===================================================

  if (!snap.exists()) {

    await runTransaction(
      db,
      async transaction => {

        const fresh =
          await transaction.get(
            userRef
          );

        if (fresh.exists()) {
          return;
        }

        transaction.set(
          userRef,
          {

            uid:user.uid,

            name:
              user.displayName ||
              "مستخدم جديد",

            email:
              user.email || "",

            photoURL:
              user.photoURL || "",

            whatsapp:"",

            points:0,

            lifetimePoints:0,

            totalPointsEarned:0,

            level:"NORMAL",

            firstLoginBonusAwarded:false,

            welcomeGiftStatus:"available",

            welcomeGiftType:"",

            welcomeGiftGames:[],

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()

          }
        );

      }
    );

    return {

      points:0,

      lifetimePoints:0,

      whatsapp:"",

      welcomeGiftStatus:
        "available"

    };

  }

  // ===================================================
  // Existing User
  // ===================================================

  const d =
    snap.data();

  const patch = {};

  if (d.points === undefined) {
    patch.points = 0;
  }

  if (
    d.lifetimePoints === undefined
  ) {

    patch.lifetimePoints =
      Number(
        d.totalPointsEarned ||
        d.points ||
        0
      );

  }

  if (
    d.totalPointsEarned === undefined
  ) {

    patch.totalPointsEarned =
      Number(
        d.lifetimePoints ||
        d.points ||
        0
      );

  }

  if (d.level === undefined) {

    const lifetime =
      Number(
        d.lifetimePoints ||
        d.totalPointsEarned ||
        d.points ||
        0
      );

    patch.level =
      lifetime >= VIP_THRESHOLD
        ? "VIP"
        : "NORMAL";

  }

  // الحسابات القديمة لا تحصل على هدية تسجيل بأثر رجعي
  if (
    d.welcomeGiftStatus === undefined
  ) {

    patch.welcomeGiftStatus =
      "used";

  }

  if (Object.keys(patch).length) {

    await runTransaction(
      db,
      async transaction => {

        transaction.set(
          userRef,
          {
            ...patch,
            updatedAt:
              serverTimestamp()
          },
          {
            merge:true
          }
        );

      }
    );

  }

  return {
    ...d,
    ...patch
  };

}

// =====================================================
// Phone + Welcome Gift
// =====================================================

async function checkPhoneAndGift(user) {

  const data =
    await prepareUserDocument(user);

  const phone =
    String(
      data?.whatsapp || ""
    ).trim();

  if (!phone) {

    if (whatsappInput) {
      whatsappInput.value = "";
    }

    if (whatsappModal) {
      whatsappModal.style.display =
        "flex";
    }

    return;

  }

  if (whatsappModal) {
    whatsappModal.style.display =
      "none";
  }

  if (
    data?.welcomeGiftStatus ===
    "available"
  ) {

    if (welcomeGiftModal) {
      welcomeGiftModal.style.display =
        "flex";
    }

  } else {

    if (welcomeGiftModal) {
      welcomeGiftModal.style.display =
        "none";
    }

  }

}

// =====================================================
// Auth State
// =====================================================

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      showLogin();

      return;

    }

    showProfile(user);

    try {

      const userData =
        await prepareUserDocument(
          user
        );

      startNotifications(
        user,
        userData
      );

      await checkPhoneAndGift(
        user
      );

    } catch (error) {

      console.error(
        "2M Elshazly account setup error:",
        error
      );

      if (whatsappModal) {
        whatsappModal.style.display =
          "flex";
      }

      if (whatsappError) {

        whatsappError.style.display =
          "block";

        whatsappError.innerText =
          "حصل خطأ في تحميل بيانات حسابك. تأكد من Firestore Rules ثم حاول مرة أخرى.";

      }

    }

  }
);

// =====================================================
// Save Phone
// =====================================================

if (saveWhatsappBtn) {

  saveWhatsappBtn.addEventListener(
    "click",
    async () => {

      const raw =
        (
          whatsappInput?.value ||
          ""
        ).trim();

      const cleanNumber =
        raw.replace(
          /\D/g,
          ""
        );

      if (
        !/^01[0125][0-9]{8}$/.test(
          cleanNumber
        )
      ) {

        if (whatsappError) {

          whatsappError.style.display =
            "block";

          whatsappError.innerText =
            "اكتب رقم موبايل مصري صحيح مثل: 01012345678";

        }

        return;

      }

      const user =
        auth.currentUser;

      if (!user) {
        return;
      }

      saveWhatsappBtn.disabled =
        true;

      saveWhatsappBtn.innerText =
        "جاري الحفظ... ⏳";

      try {

        const userRef =
          doc(
            db,
            "users",
            user.uid
          );

        await runTransaction(
          db,
          async transaction => {

            const snap =
              await transaction.get(
                userRef
              );

            const old =
              snap.exists()
                ? snap.data()
                : {};

            const lifetime =
              Number(
                old.lifetimePoints ??
                old.totalPointsEarned ??
                0
              );

            transaction.set(
              userRef,
              {

                uid:user.uid,

                name:
                  user.displayName ||
                  old.name ||
                  "مستخدم جديد",

                email:
                  user.email ||
                  old.email ||
                  "",

                photoURL:
                  user.photoURL ||
                  old.photoURL ||
                  "",

                whatsapp:
                  cleanNumber,

                points:
                  Number(
                    old.points || 0
                  ),

                lifetimePoints:
                  lifetime,

                totalPointsEarned:
                  Number(
                    old.totalPointsEarned ??
                    lifetime
                  ),

                level:
                  lifetime >=
                  VIP_THRESHOLD
                    ? "VIP"
                    : "NORMAL",

                updatedAt:
                  serverTimestamp()

              },
              {
                merge:true
              }
            );

          }
        );

        if (whatsappError) {
          whatsappError.style.display =
            "none";
        }

        if (whatsappModal) {
          whatsappModal.style.display =
            "none";
        }

        const fresh =
          await getDoc(userRef);

        if (
          fresh.exists() &&
          fresh.data()?.welcomeGiftStatus ===
            "available"
        ) {

          if (welcomeGiftModal) {

            welcomeGiftModal.style.display =
              "flex";

          }

        }

      } catch (error) {

        console.error(
          "2M Elshazly phone save error:",
          error
        );

        if (whatsappError) {

          whatsappError.style.display =
            "block";

          whatsappError.innerText =
            "حصل خطأ أثناء حفظ الرقم. تأكد من Firestore Rules وحاول مرة أخرى.";

        }

      } finally {

        saveWhatsappBtn.disabled =
          false;

        saveWhatsappBtn.innerText =
          "حفظ ومتابعة";

      }

    }
  );

}

// =====================================================
// Welcome Gift
// =====================================================

async function chooseWelcomeGift(type) {

  const user =
    auth.currentUser;

  if (!user) {
    return;
  }

  if (chooseDiscountGift) {
    chooseDiscountGift.disabled =
      true;
  }

  if (chooseFreeGamesGift) {
    chooseFreeGamesGift.disabled =
      true;
  }

  try {

    const userRef =
      doc(
        db,
        "users",
        user.uid
      );

    await runTransaction(
      db,
      async transaction => {

        const snap =
          await transaction.get(
            userRef
          );

        if (!snap.exists()) {
          throw new Error(
            "حساب العميل غير موجود"
          );
        }

        const d =
          snap.data();

        if (
          d.welcomeGiftStatus !==
          "available"
        ) {

          throw new Error(
            "الهدية تم استخدامها بالفعل"
          );

        }

        transaction.set(
          userRef,
          {

            welcomeGiftStatus:
              type === "discount20"
                ? "discount20"
                : "free10_pending",

            welcomeGiftType:
              type,

            welcomeGiftGames:[],

            updatedAt:
              serverTimestamp()

          },
          {
            merge:true
          }
        );

      }
    );

    if (welcomeGiftModal) {
      welcomeGiftModal.style.display =
        "none";
    }

    if (type === "free10") {

      window.location.href =
        "games.html?welcomeGift=free10";

    } else {

      alert(
        "🎉 تم تفعيل خصم 20% على أول طلب لك من 2M Elshazly!"
      );

    }

  } catch (error) {

    console.error(
      "2M Elshazly welcome gift error:",
      error
    );

    alert(
      error.message ||
      "حصل خطأ أثناء اختيار الهدية."
    );

    if (welcomeGiftModal) {
      welcomeGiftModal.style.display =
        "flex";
    }

  } finally {

    if (chooseDiscountGift) {
      chooseDiscountGift.disabled =
        false;
    }

    if (chooseFreeGamesGift) {
      chooseFreeGamesGift.disabled =
        false;
    }

  }

}

// =====================================================
// Welcome Gift Buttons
// =====================================================

if (chooseDiscountGift) {

  chooseDiscountGift.addEventListener(
    "click",
    () =>
      chooseWelcomeGift(
        "discount20"
      )
  );

}

if (chooseFreeGamesGift) {

  chooseFreeGamesGift.addEventListener(
    "click",
    () =>
      chooseWelcomeGift(
        "free10"
      )
  );

}

// =====================================================
// Exports
// =====================================================

export {
  auth,
  db,
  VIP_THRESHOLD,
  FIRST_LOGIN_BONUS
};
