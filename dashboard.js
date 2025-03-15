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

// Global variables for current user, role, and name
let currentUser = null;
let userRole = 'member'; // default role
let currentUserName = ""; // to store the logged-in user's name

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

          // Check for auto-expiration
          if (announcement.autoExpire && announcement.expiresAt) {
            const now = new Date();
            const expiryDate = announcement.expiresAt.toDate();
            if (now > expiryDate) {
              // Skip this announcement if expired
              return;
            }
          }

          const docId = doc.id;
          const container = document.createElement('div');
          container.classList.add('announcement-item');
          container.innerHTML = `
            <h4>${announcement.title}</h4>
            <p>${announcement.message}</p>
            <small>
              Posted by ${announcement.postedByName || 'Unknown'} (${announcement.postedByRole || 'unknown'}) on 
              ${announcement.createdAt ? new Date(announcement.createdAt.toDate()).toLocaleString() : ''}
            </small>
          `;

          // If the user is an admin (pastor or admin), add Edit and Delete buttons.
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
    
    // Calculate expiration time: 2 days from now
    const expiresAt = firebase.firestore.Timestamp.fromDate(
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    );

    db.collection('announcements').add({
      title: title,
      message: message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser ? currentUser.uid : null,
      postedByName: currentUserName,
      postedByRole: userRole,
      autoExpire: true,       // All announcements auto-expire
      expiresAt: expiresAt
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
// YOUTH MEETING SECTION
// ------------------------------
// ------------------------------------------------
// ------------------------------
// ------------------------------
// Youth Programme Items Section
// ------------------------------

let youthProgrammeMode = "upcoming"; // default mode

// Function: Load Youth Programme Items based on toggle mode
function loadYouthProgrammeItems() {
  const now = new Date();
  let query;
  
  if (youthProgrammeMode === "upcoming") {
    // For upcoming meetings: meetingDate >= now, order ascending
    query = db.collection('youthProgrammeItems')
              .where('meetingDate', '>=', firebase.firestore.Timestamp.fromDate(now))
              .orderBy('meetingDate', 'asc')
              .limit(10);
  } else {
    // For previous meetings: meetingDate <= now, order descending
    query = db.collection('youthProgrammeItems')
              .where('meetingDate', '<=', firebase.firestore.Timestamp.fromDate(now))
              .orderBy('meetingDate', 'desc')
              .limit(10);
  }
  
  query.onSnapshot(snapshot => {
    const listContainer = document.getElementById('youth-program-list');
    if (listContainer) {
      listContainer.innerHTML = ''; // Clear current list
      
      snapshot.forEach(doc => {
        const item = doc.data();
        const docId = doc.id;
        const container = document.createElement('div');
        container.classList.add('youth-program-item');
        container.innerHTML = `
          <h4>${item.category}</h4>
          <p>Assignment: ${item.assignment}</p>
          <small>Meeting Date: ${item.meetingDate ? new Date(item.meetingDate.toDate()).toLocaleDateString() : ''}</small>
          <br>
          <small>Posted by ${item.postedByName || 'Unknown'} (${item.postedByRole || 'unknown'})</small>
        `;
        
        // If admin, add edit and delete buttons
        if (userRole === 'pastor' || userRole === 'admin') {
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.addEventListener('click', () => editProgrammeItem(docId, item));
          
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Delete';
          deleteBtn.addEventListener('click', () => deleteProgrammeItem(docId));
          
          container.appendChild(editBtn);
          container.appendChild(deleteBtn);
        }
        
        listContainer.appendChild(container);
      });
    }
  });
}

// Toggle event listeners for programme items
const togglePreviousProgramme = document.getElementById('toggle-previous');
const toggleUpcomingProgramme = document.getElementById('toggle-upcoming');

if (togglePreviousProgramme && toggleUpcomingProgramme) {
  togglePreviousProgramme.addEventListener('click', () => {
    youthProgrammeMode = "previous";
    togglePreviousProgramme.classList.add('active');
    toggleUpcomingProgramme.classList.remove('active');
    loadYouthProgrammeItems();
  });
  
  toggleUpcomingProgramme.addEventListener('click', () => {
    youthProgrammeMode = "upcoming";
    toggleUpcomingProgramme.classList.add('active');
    togglePreviousProgramme.classList.remove('active');
    loadYouthProgrammeItems();
  });
}

// Function: Create a new programme item.
if (document.getElementById('youth-program-form')) {
  document.getElementById('youth-program-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const category = document.getElementById('programme-category').value;
    const assignment = document.getElementById('programme-assignment').value;
    const dateValue = document.getElementById('programme-date').value;
    const meetingDate = firebase.firestore.Timestamp.fromDate(new Date(dateValue));
    
    db.collection('youthProgrammeItems').add({
      category: category,
      assignment: assignment,
      meetingDate: meetingDate,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser ? currentUser.uid : null,
      postedByName: currentUserName,
      postedByRole: userRole
    })
    .then(() => {
      document.getElementById('youth-program-form').reset();
      console.log("Programme item added successfully.");
    })
    .catch(error => {
      console.error("Error adding programme item: ", error);
    });
  });
}

// Function: Delete a programme item.
function deleteProgrammeItem(id) {
  if (confirm("Are you sure you want to delete this programme item?")) {
    db.collection('youthProgrammeItems').doc(id).delete()
      .then(() => console.log("Programme item deleted."))
      .catch(error => console.error("Error deleting programme item: ", error));
  }
}

// Function: Edit a programme item using prompt inputs.
function editProgrammeItem(id, item) {
  const newCategory = prompt("Edit category:", item.category);
  const newAssignment = prompt("Edit assignment:", item.assignment);
  
  if (newCategory !== null && newAssignment !== null) {
    db.collection('youthProgrammeItems').doc(id).update({
      category: newCategory,
      assignment: newAssignment
    })
    .then(() => console.log("Programme item updated."))
    .catch(error => console.error("Error updating programme item: ", error));
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
    // User is logged in
    currentUser = user;
    console.log("Current user UID:", currentUser.uid);
    
    // Fetch the user's data (name and role) from Firestore
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        userRole = userData.role; // e.g., "pastor" or "admin"
        currentUserName = userData.name || user.email; // store globally
        document.getElementById('current-user').textContent = `Welcome, ${currentUserName}`;
      } else {
        userRole = 'member';
        currentUserName = user.email;
        document.getElementById('current-user').textContent = `Welcome, ${currentUserName}`;
      }
      
      // Hide forms if not admin
      if (userRole !== 'pastor' && userRole !== 'admin') {
        const annFormContainer = document.getElementById('announcement-form-container');
        if (annFormContainer) annFormContainer.style.display = 'none';
        const youthFormContainer = document.getElementById('youth-program-form-container');
        if (youthFormContainer) youthFormContainer.style.display = 'none';
      }
      
      
      // Load data after role is determined
      loadAnnouncements();
      loadYouthProgrammeItems(); // Add this call to load youth programme items
      console.log("User role:", userRole);
    }).catch(error => {
      console.error("Error fetching user role:", error);
      userRole = 'member';
      const annFormContainer = document.getElementById('announcement-form-container');
      if (annFormContainer) annFormContainer.style.display = 'none';
      const youthFormContainer = document.getElementById('youth-program-form-container');
      if (youthFormContainer) youthFormContainer.style.display = 'none';
      loadAnnouncements();
      loadYouthProgrammeItems(); // Also load here in case of error
    });
  }
});

// ------------------------------
// Sign Out Button Functionality
// ------------------------------
const signOutBtn = document.getElementById('sign-out-btn');
if (signOutBtn) {
  signOutBtn.addEventListener('click', () => {
    firebase.auth().signOut()
      .then(() => {
        console.log("User signed out.");
        window.location.href = "index.html"; // or any page you want
      })
      .catch((error) => {
        console.error("Error signing out: ", error);
      });
  });
}