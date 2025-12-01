// Test script to verify navigation menu buttons are clickable
// Run this in the browser console to test navigation functionality

console.log('🔍 Testing navigation menu buttons...');

// Test desktop navigation links
const desktopNavLinks = document.querySelectorAll('nav a[href]');
console.log(`Found ${desktopNavLinks.length} desktop navigation links`);

desktopNavLinks.forEach((link, index) => {
  console.log(`Desktop link ${index + 1}:`, {
    href: link.getAttribute('href'),
    text: link.textContent,
    pointerEvents: window.getComputedStyle(link).pointerEvents,
    display: window.getComputedStyle(link).display,
    position: window.getComputedStyle(link).position,
    zIndex: window.getComputedStyle(link).zIndex,
  });
  
  // Test click event
  link.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(`✅ Desktop navigation link clicked: ${link.getAttribute('href')}`);
  });
  
  // Test hover state
  link.addEventListener('mouseenter', () => {
    console.log(`✅ Desktop navigation link hovered: ${link.getAttribute('href')}`);
  });
});

// Test mobile navigation links (if visible)
const mobileNavLinks = document.querySelectorAll('.verotrade-sidebar.mobile-visible a[href]');
console.log(`Found ${mobileNavLinks.length} mobile navigation links`);

mobileNavLinks.forEach((link, index) => {
  console.log(`Mobile link ${index + 1}:`, {
    href: link.getAttribute('href'),
    text: link.textContent,
    pointerEvents: window.getComputedStyle(link).pointerEvents,
    display: window.getComputedStyle(link).display,
    position: window.getComputedStyle(link).position,
    zIndex: window.getComputedStyle(link).zIndex,
  });
  
  // Test click event
  link.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(`✅ Mobile navigation link clicked: ${link.getAttribute('href')}`);
  });
});

// Test mobile menu button
const mobileMenuButton = document.querySelector('button[aria-label="Toggle navigation menu"]');
if (mobileMenuButton) {
  console.log('Mobile menu button found:', {
    pointerEvents: window.getComputedStyle(mobileMenuButton).pointerEvents,
    display: window.getComputedStyle(mobileMenuButton).display,
    position: window.getComputedStyle(mobileMenuButton).position,
    zIndex: window.getComputedStyle(mobileMenuButton).zIndex,
  });
  
  mobileMenuButton.addEventListener('click', () => {
    console.log('✅ Mobile menu button clicked');
  });
}

// Test logout button
const logoutButton = document.querySelector('button:has(.SafeLogOut)');
if (logoutButton) {
  console.log('Logout button found:', {
    pointerEvents: window.getComputedStyle(logoutButton).pointerEvents,
    display: window.getComputedStyle(logoutButton).display,
    position: window.getComputedStyle(logoutButton).position,
    zIndex: window.getComputedStyle(logoutButton).zIndex,
  });
  
  logoutButton.addEventListener('click', () => {
    console.log('✅ Logout button clicked');
  });
}

console.log('🔍 Navigation test setup complete. Try clicking the menu buttons!');