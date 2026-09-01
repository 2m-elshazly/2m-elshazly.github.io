import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

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

// دالة تسجيل الدخول عند الضغط على الزر
export function handleGoogleSignIn() {
    signInWithPopup(auth, provider)
        .then((result) => {
            // تم تسجيل الدخول بنجاح
            const user = result.user;
            console.log("Logged in as:", user.displayName);
            window.location.reload(); // إعادة تحميل الصفحة لتحديث حالة الهيدر والبروفايل
        })
        .catch((error) => {
            console.error("Login Error:", error.message);
        });
}
