document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;

  // Check for saved dark mode preference
  if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    updateDarkModeIcon();
  }

  function updateDarkModeIcon() {
    const icon = darkModeToggle?.querySelector('i');
    const span = darkModeToggle?.querySelector('span');
    if (body.classList.contains('dark-mode')) {
      if (icon) icon.classList.remove('fa-moon');
      if (icon) icon.classList.add('fa-sun');
      if (span) span.textContent = 'Light Mode';
    } else {
      if (icon) icon.classList.remove('fa-sun');
      if (icon) icon.classList.add('fa-moon');
      if (span) span.textContent = 'Dark Mode';
    }
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
      } else {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
      }
      updateDarkModeIcon();
    });
    
    updateDarkModeIcon();
  }
});