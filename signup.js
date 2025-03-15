// signup.js

const auth = firebase.auth();
const db = firebase.firestore();

// For simplicity, we're using a constant invitation code.
// In production, you might store valid codes in Firestore.
const VALID_INVITE_CODE = "CHURCH2025";

const signupForm = document.getElementById("signup-form");
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const inviteCode = document.getElementById("invite-code").value.trim();

  // Validate the invitation code
  if (inviteCode !== VALID_INVITE_CODE) {
    document.getElementById("signup-error-message").textContent = "Invalid invitation code.";
    return;
  }

  // Validate that passwords match
  if (password !== confirmPassword) {
    document.getElementById("signup-error-message").textContent = "Passwords do not match.";
    return;
  }

  // Create the user with Firebase Authentication
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      // Create a Firestore document for the new user with extra info
      return db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        role: "member"  // default role for new sign-ups
      });
    })
    .then(() => {
      // Redirect to dashboard after successful sign-up
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error("Error during sign up:", error);
      document.getElementById("signup-error-message").textContent = error.message;
    });
});
