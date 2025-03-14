// ------------------------------
// Sidebar Navigation
// ------------------------------
document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.sidebar nav ul li');
  const sections = document.querySelectorAll('.section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Hide all sections
      sections.forEach(sec => sec.style.display = 'none');
      // Show the clicked section
      const target = item.getAttribute('data-section');
      document.getElementById(target).style.display = 'block';
    });
  });
});

// ------------------------------
// Firestore and Announcements CRUD
// ------------------------------

// Assumes firebase.initializeApp(firebaseConfig) was called in dashboard.html

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables for current user and role
let currentUser = null;
let userRole = 'member'; // default role

// Function: Load Announcements from Firestore in real time.
function loadAnnouncements() {
  db.collection('announcements')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const announcementList = document.getElementById('announcement-list');
      if (announcementList) {
        announcementList.innerHTML = ''; // Clear existing content
      
        snapshot.forEach(doc => {
          const announcement = doc.data();
          const docId = doc.id;
          const container = document.createElement('div');
          container.classList.add('announcement-item');
          container.innerHTML = `
            <h4>${announcement.title}</h4>
            <p>${announcement.message}</p>
            <small>${announcement.createdAt ? new Date(announcement.createdAt.toDate()).toLocaleString() : ''}</small>
          `;
          
          // If the user is an admin (pastor or secretary), add Edit and Delete buttons.
          if (userRole === 'pastor' || userRole === 'admin') {
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => editAnnouncement(docId, announcement));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteAnnouncement(docId));
            
            container.appendChild(editBtn);
            container.appendChild(deleteBtn);
          }
          
          announcementList.appendChild(container);
        });
      }
    });
}

// Function: Create a new announcement.
if (document.getElementById('announcement-form')) {
  document.getElementById('announcement-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('announcement-title').value;
    const message = document.getElementById('announcement-message').value;
    
    db.collection('announcements').add({
      title: title,
      message: message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser ? currentUser.uid : null
    })
    .then(() => {
      document.getElementById('announcement-form').reset();
      console.log("Announcement added successfully.");
    })
    .catch(error => {
      console.error("Error adding announcement: ", error);
    });
  });
}

// Function: Delete an announcement.
function deleteAnnouncement(id) {
  if (confirm("Are you sure you want to delete this announcement?")) {
    db.collection('announcements').doc(id).delete()
      .then(() => console.log("Announcement deleted."))
      .catch(error => console.error("Error deleting announcement: ", error));
  }
}

// Function: Edit an announcement using simple prompt inputs.
function editAnnouncement(id, announcement) {
  const newTitle = prompt("Edit title:", announcement.title);
  const newMessage = prompt("Edit message:", announcement.message);
  
  if (newTitle !== null && newMessage !== null) {
    db.collection('announcements').doc(id).update({
      title: newTitle,
      message: newMessage
    })
    .then(() => console.log("Announcement updated."))
    .catch(error => console.error("Error updating announcement: ", error));
  }
}

// ------------------------------
// Authentication and Role Fetching
// ------------------------------
auth.onAuthStateChanged(user => {
  if (!user) {
    // Not logged in, redirect to login page
    window.location.href = "index.html";
  } else {
    currentUser = user;
    // Fetch the user's role from Firestore (from "users" collection)
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        userRole = doc.data().role; // e.g., "pastor" or "secretary"
      } else {
        userRole = 'member';
      }
      
      // Hide announcement form if the user is not an admin.
      if (userRole !== 'pastor' && userRole !== 'admin') {
        const formContainer = document.getElementById('announcement-form-container');
        if (formContainer) formContainer.style.display = 'none';
      }
      
      // Load announcements after role is determined.
      loadAnnouncements();
      console.log("User role:", userRole);
    }).catch(error => {
      console.error("Error fetching user role: ", error);
      userRole = 'member';
      const formContainer = document.getElementById('announcement-form-container');
      if (formContainer) formContainer.style.display = 'none';
      loadAnnouncements();
    });
  }
});
