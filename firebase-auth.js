import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// حط البيانات اللي طلعتلك في الشاشة هنا:
const firebaseConfig = {
  apiKey: "AIzaSyAeYbBx4yMyDCXhGAQS_X7KDhiKGPDZvWY",
  authDomain: "m-elshazly-e19a2.firebaseapp.com",
  projectId: "m-elshazly-e19a2",
  storageBucket: "m-elshazly-e19a2.appspot.com",
  messagingSenderId: "1006926908276",
  appId: "1:1006926908276:web:ff1274fcea961f251afa21",
  measurementId: "G-HWXPWBV75"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById('loginBtn');
const userProfileBox = document.getElementById('userProfileBox');
const headerUserPhoto = document.getElementById('headerUserPhoto');
const headerUserLetter = document.getElementById('headerUserLetter');

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("تم تسجيل الدخول بنجاح:", result.user);
      })
      .catch((error) => {
        console.error("خطأ في تسجيل الدخول:", error);
      });
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfileBox) userProfileBox.style.display = 'flex';

    if (user.photoURL) {
      if (headerUserPhoto) {
        headerUserPhoto.src = user.photoURL;
        headerUserPhoto.style.display = 'block';
      }
      if (headerUserLetter) headerUserLetter.style.display = 'none';
    } else {
      if (headerUserPhoto) headerUserPhoto.style.display = 'none';
      if (headerUserLetter) {
        headerUserLetter.style.display = 'flex';
        headerUserLetter.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';
      }
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userProfileBox) userProfileBox.style.display = 'none';
  }
});

// الانتقال لصفحة الملف الشخصي عند الضغط على الـ Box الخاص بالمستخدم
const profileBox = document.getElementById("userProfileBox");
if (profileBox) {
    profileBox.addEventListener("click", () => {
        window.location.href = "profile.html";
    });
}
