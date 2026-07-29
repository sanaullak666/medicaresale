function toggleDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown.style.display === 'block') {
    dropdown.style.display = 'none';
  } else {
    dropdown.style.display = 'block';
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const userIcon = document.querySelector('.user-icon');
  const dropdown = document.getElementById('userDropdown');
  if (!userIcon.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.style.display = 'none';
  }
});
