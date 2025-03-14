// dashboard.js
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
