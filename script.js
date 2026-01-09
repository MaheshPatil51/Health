// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, sendPasswordResetEmail, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
    getFirestore, collection, addDoc, getDoc, getDocs, updateDoc, doc, setDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD-VoVtqXZ3BILqWcjSthfSD-Dff-dIhRQ",
    authDomain: "hospital-management-b850a.firebaseapp.com",
    projectId: "hospital-management-b850a",
    storageBucket: "hospital-management-b850a.appspot.com",
    messagingSenderId: "894878469846",
    appId: "1:894878469846:web:f4526756889120b0a1c377",
    measurementId: "G-VHBLK493CT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Update Navbar and Buttons Based on Auth State
onAuthStateChanged(auth, async (user) => {
    const authLink = document.getElementById("authLink");
    const bookBtn = document.getElementById("bookAppointmentBtn");
    const adminPanel = document.getElementById("adminPanel");
    const viewAppointmentsLink = document.getElementById("viewAppointmentsLink");

    if (authLink) {
        if (user) {
            authLink.innerText = "Logout";
            authLink.style.color = "red";
            authLink.onclick = logout;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "admin") {
                if (adminPanel) adminPanel.style.display = "block";
            } else {
                if (adminPanel) adminPanel.style.display = "none";
            }
        } else {
            authLink.innerText = "Login/Register";
            authLink.style.color = "blue";
            authLink.onclick = () => window.location.href = "login.html";
            if (adminPanel) adminPanel.style.display = "none";
        }
    }

    if (bookBtn) bookBtn.disabled = !user;
    if (viewAppointmentsLink) viewAppointmentsLink.style.display = user ? "inline" : "none";
});

// Register New User
window.registerUser = function () {
    const name = document.getElementById("registerName").value.trim();
    const age = document.getElementById("registerAge").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const role = document.getElementById("registerRole").value;

    if (!name || !age || !phone || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name, age, phone, email, role
            });

            alert("User Registered Successfully!");
            window.location.href = "login.html";
        })
        .catch((error) => alert("Error: " + error.message));
};

// Login User
window.loginUser = function () {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                alert("Login Successful!");
                window.location.href = userData.role === "admin" ? "admin.html" : "index.html";
            } else {
                alert("User data not found!");
            }
        })
        .catch((error) => alert("Error: " + error.message));
};

// Logout
window.logout = function () {
    signOut(auth)
        .then(() => {
            alert("User Logged Out!");
            window.location.href = "index.html";
        })
        .catch((error) => alert("Error: " + error.message));
};

// Reset Password
window.resetPassword = function () {
    const email = document.getElementById("resetEmail").value.trim();

    if (!email) {
        alert("Please enter your email for password reset.");
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => alert("Password reset link sent! Check your email."))
        .catch((error) => alert("Error: " + error.message));
};

// Book Appointment
window.bookAppointment = function () {
    const patientName = document.getElementById("patientName").value.trim();
    const appointmentDate = document.getElementById("appointmentDate").value.trim();
    const doctor = document.getElementById("doctorSelect").value;

    if (!patientName || !appointmentDate || !doctor) {
        alert("Please fill in all fields.");
        return;
    }

    if (!auth.currentUser) {
        alert("Please login to book an appointment.");
        return;
    }

    addDoc(collection(db, "appointments"), {
        name: patientName,
        date: appointmentDate,
        doctor: doctor,
        userId: auth.currentUser.uid,
        status: "Pending"
    })
        .then(() => {
            alert("Appointment booked successfully!");
            setTimeout(() => window.location.href = "index.html", 1000);
        })
        .catch((error) => alert("Error booking appointment: " + error.message));
};

// Load All Appointments (for Admin)
async function loadAppointments() {
    const appointmentsTable = document.getElementById("appointmentsTable");
    if (!appointmentsTable) return;

    appointmentsTable.innerHTML = "";

    const snapshot = await getDocs(collection(db, "appointments"));
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const row = `
        <tr>
            <td>${data.name}</td>
            <td>${data.date}</td>
            <td>${data.doctor}</td>
            <td>${data.status}</td>
            <td>
                <button onclick="updateAppointmentStatus('${docSnap.id}', 'Approved')">Approve</button>
                <button onclick="updateAppointmentStatus('${docSnap.id}', 'Rejected')">Reject</button>
            </td>
        </tr>`;
        appointmentsTable.innerHTML += row;
    });
}

// Update Appointment Status
window.updateAppointmentStatus = function (id, status) {
    updateDoc(doc(db, "appointments", id), { status })
        .then(() => {
            alert(`Appointment ${status}`);
            loadAppointments();
        })
        .catch((error) => alert("Error: " + error.message));
};

// Add Doctor
window.addDoctor = function () {
    const doctorName = document.getElementById("doctorName").value.trim();
    if (!doctorName) {
        alert("Please enter a doctor's name.");
        return;
    }

    addDoc(collection(db, "doctors"), { name: doctorName })
        .then(() => {
            alert("Doctor Added Successfully!");
            location.reload();
        })
        .catch((error) => alert("Error: " + error.message));
};

// View Appointments (for Users)
window.viewAppointments = function () {
    if (!auth.currentUser) {
        alert("Please log in to view your appointments.");
        return;
    }
    window.location.href = "viewAppointments.html";
};

// Auto-load admin appointments if on Admin Panel
document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("adminPanel")) {
        loadAppointments();
    }
});
document.getElementById("appointmentForm").addEventListener("submit", function (e) {
    e.preventDefault();
  
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const doctor = document.getElementById("doctor").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const appointmentId = "APT-" + Date.now(); // Simple unique ID
  
    // Save to Firebase (if needed)
    // firebase.firestore().collection("appointments").add({...});
  
    // Send Email using EmailJS
    emailjs.send("bhushanwani989@gmail.com", "template_keuvwyb", {
      name: name,
      email: email,
      doctor: doctor,
      date: date,
      time: time,
      Appointment_id: appointmentId
    }).then(function (response) {
      alert("Appointment confirmation sent to " + email);
      document.getElementById("appointmentForm").reset();
    }, function (error) {
      console.error("EmailJS error:", error);
      alert("Failed to send confirmation email.");
    });
  });
  