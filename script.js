/* scripts.js */

// Initialize Firebase
// Replace with your actual Firebase configuration values
const firebaseConfig = {
    apiKey: "AIzaSyDVaBz_3sVQH-pXkk8KXf-NY2aTmx2aSOw",
    authDomain: "churchapp-9129f.firebaseapp.com",
    projectId: "churchapp-9129f",
    storageBucket: "churchapp-9129f.firebasestorage.app",
    messagingSenderId: "187242836197",
    appId: "1:187242836197:web:a9f20def98252a513c240c",
    measurementId: "G-6C2FP23JTR"
  };
  
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // Handle login form submission if present on the page
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
  
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("Login successful:", userCredential.user);
          // Redirect to the dashboard page upon successful login
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          console.error("Error during sign in:", error);
          document.getElementById('error-message').textContent = error.message;
        });
    });
  }
  
  console.log("Church App Scripts Loaded!");
  