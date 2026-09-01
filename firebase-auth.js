import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

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
const provider = new GoogleAuthProvider();

// مراقبة حالة تسجيل الدخول وتحديث الهيدر فوراً
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById("loginBtn");
    const profileBox = document.getElementById("userProfileBox");
    const photoEl = document.getElementById("headerUserPhoto");
    const letterEl = document.getElementById("headerUserLetter");

    if (user) {
        // العميل مسجل دخول: إخفاء زر الدخول وإظهار البروفايل وصورته
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
    } else {
        // العميل غير مسجل دخول: إظهار زر تسجيل الدخول
        if (loginBtn) loginBtn.style.display = "flex";
        if (profileBox) profileBox.style.display = "none";
    }
});

// تفعيل حدث الضغط على زر تسجيل الدخول بـ Google
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            window.location.reload();
        } catch (error) {
            console.error("خطأ في تسجيل الدخول:", error);
            alert("حدث خطأ أثناء تسجيل الدخول، تأكد من تفعيل Google Provider في Firebase.");
        }
    });
}
