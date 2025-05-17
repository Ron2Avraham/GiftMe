export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}-notification`;
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${icons[type]}</span>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}; 