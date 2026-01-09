// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Firebase Configuration
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

document.addEventListener("DOMContentLoaded", () => {
    const appointmentForm = document.getElementById("appointmentForm");

    // Check if user is logged in
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            alert("You must be logged in to book an appointment!");
            window.location.href = "index.html"; // Redirect to home page if not logged in
        }
    });

    // Handle form submission
    appointmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            alert("You need to be logged in to book an appointment.");
            return;
        }

        // Get form values
        const patientName = document.getElementById("patientName").value.trim();
        const patientEmail = document.getElementById("patientEmail").value.trim();
        const doctor = document.getElementById("doctor").value;
        const appointmentDate = document.getElementById("appointmentDate").value;
        const appointmentTime = document.getElementById("appointmentTime").value;

        // Validate form inputs
        if (!patientName || !patientEmail || !doctor || !appointmentDate || !appointmentTime) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            // Save appointment to Firestore
            await addDoc(collection(db, "appointments"), {
                userId: user.uid,
                patientName,
                patientEmail,
                doctor,
                appointmentDate,
                appointmentTime,
                timestamp: new Date()
            });

            alert("Appointment booked successfully!");
            appointmentForm.reset();

            // Redirect to Home Page after successful booking
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500); // Small delay to show success message

        } catch (error) {
            alert("Error booking appointment: " + error.message);
        }
    });
});
