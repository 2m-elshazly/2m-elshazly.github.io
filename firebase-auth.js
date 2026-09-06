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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

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


// ==========================================
// ELEMENTS
// ==========================================

const loginBtn = document.getElementById("loginBtn");
const profileBox = document.getElementById("userProfileBox");

const photoEl = document.getElementById("headerUserPhoto");
const letterEl = document.getElementById("headerUserLetter");

const whatsappModal = document.getElementById("whatsappModal");
const whatsappInput = document.getElementById("whatsappInput");
const saveWhatsappBtn = document.getElementById("saveWhatsappBtn");
const whatsappError = document.getElementById("whatsappError");


// ==========================================
// GOOGLE LOGIN
// ==========================================

if (loginBtn) {

    loginBtn.addEventListener("click", async () => {

        try {

            await signInWithPopup(auth, provider);

            // مهم:
            // لا نعمل reload هنا
            // onAuthStateChanged هيكمل باقي العملية

        } catch (error) {

            console.error("خطأ في تسجيل الدخول:", error);

            alert(
                "حدث خطأ أثناء تسجيل الدخول.\n\n" +
                error.message
            );
        }

    });

}


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        // المستخدم غير مسجل
        if (loginBtn) {
            loginBtn.style.display = "flex";
        }

        if (profileBox) {
            profileBox.style.display = "none";
        }

        if (whatsappModal) {
            whatsappModal.style.display = "none";
        }

        return;
    }


    // ==========================================
    // المستخدم مسجل دخول
    // ==========================================

    if (loginBtn) {
        loginBtn.style.display = "none";
    }

    if (profileBox) {
        profileBox.style.display = "flex";
    }


    // ==========================================
    // صورة المستخدم
    // ==========================================

    const displayName = user.displayName || "مستخدم";

    if (user.photoURL) {

        let cleanUrl = user.photoURL.replace(
            "http://",
            "https://"
        );

        if (cleanUrl.includes("googleusercontent.com")) {

            cleanUrl = cleanUrl.replace(
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
                displayName.trim().charAt(0).toUpperCase();

            letterEl.style.display = "flex";

        }

    }


    // ==========================================
    // CHECK PHONE NUMBER
    // ==========================================

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnap = await getDoc(userRef);


        // العميل جديد أو ملوش رقم
        if (
            !userSnap.exists() ||
            !userSnap.data().whatsapp
        ) {

            if (whatsappModal) {

                whatsappModal.style.display = "flex";

            }

        } else {

            if (whatsappModal) {

                whatsappModal.style.display = "none";

            }

        }

    } catch (error) {

        console.error(
            "خطأ أثناء فحص بيانات المستخدم:",
            error
        );

    }

});


// ==========================================
// SAVE WHATSAPP NUMBER
// ==========================================

if (saveWhatsappBtn) {

    saveWhatsappBtn.addEventListener(
        "click",
        async () => {

            const whatsappVal =
                whatsappInput.value.trim();


            // ==================================
            // VALIDATION
            // ==================================

            // أرقام فقط
            const cleanNumber =
                whatsappVal.replace(/\D/g, "");


            if (
                cleanNumber.length !== 11 ||
                !cleanNumber.startsWith("01")
            ) {

                whatsappError.style.display = "block";

                whatsappError.innerText =
                    "من فضلك اكتب رقم واتساب مصري صحيح مثل: 01012345678";

                return;

            }


            // إخفاء الخطأ
            whatsappError.style.display = "none";


            try {

                const user = auth.currentUser;


                if (!user) {

                    whatsappError.style.display = "block";

                    whatsappError.innerText =
                        "حصلت مشكلة في تسجيل الدخول، حاول تسجيل الدخول مرة أخرى.";

                    return;

                }


                // ==================================
                // SAVE TO FIRESTORE
                // ==================================

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        uid: user.uid,

                        name:
                            user.displayName ||
                            "مستخدم جديد",

                        email:
                            user.email ||
                            "",

                        photoURL:
                            user.photoURL ||
                            "",

                        whatsapp:
                            cleanNumber,

                        updatedAt:
                            serverTimestamp(),

                        createdAt:
                            userSnapSafeCreatedAt()

                    },
                    {
                        merge: true
                    }
                );


                // ==================================
                // CLOSE MODAL
                // ==================================

                whatsappModal.style.display = "none";


                // تحديث الصفحة
                window.location.reload();


            } catch (error) {

                console.error(
                    "خطأ أثناء حفظ رقم الواتساب:",
                    error
                );

                whatsappError.style.display = "block";

                whatsappError.innerText =
                    "حصل خطأ أثناء حفظ الرقم. حاول مرة أخرى.";

            }

        }
    );

}


// ==========================================
// SAFE CREATED AT
// ==========================================

function userSnapSafeCreatedAt() {

    return serverTimestamp();

}

