import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBE2-qaGOOlmhn9QA01J5wizJ_CcMMh7qE",
  authDomain: "ifix-store-eecd9.firebaseapp.com",
  projectId: "ifix-store-eecd9",
  storageBucket: "ifix-store-eecd9.firebasestorage.app",
  messagingSenderId: "862863699996",
  appId: "1:862863699996:web:7af653f4de7d0baa0fafd9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 1. مراقبة حالة تسجيل الدخول (حل مشكلة الزر المختفي في أي متصفح)
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById("loginBtn");
    const profileBox = document.getElementById("userProfileBox");
    const photoEl = document.getElementById("headerUserPhoto");
    const letterEl = document.getElementById("headerUserLetter");

    if (user) {
        // العميل مسجل دخول: اخفي زر الدخول وظهر البروفايل
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
                const firstLetter = displayName.trim().charAt(0).toUpperCase();
                letterEl.innerText = firstLetter;
                letterEl.style.display = "flex";
            }
        }
    } else {
        // العميل مش مسجل دخول: ظهر زر تسجيل الدخول فوراً في أي متصفح
        if (loginBtn) loginBtn.style.display = "flex";
        if (profileBox) profileBox.style.display = "none";
    }
});

// 2. حدث تسجيل الدخول عند الضغط على الزر
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            window.location.reload();
        } catch (error) {
            console.error("خطأ في تسجيل الدخول:", error);
        }
    });
}

// 3. الانتقال لصفحة البروفايل عند الضغط على الصورة (بدون ريفرش أو تعليق)
document.addEventListener("click", (e) => {
    const profileBox = e.target.closest("#userProfileBox");
    if (profileBox) {
        e.preventDefault();
        window.location.href = "profile.html";
    }
});
