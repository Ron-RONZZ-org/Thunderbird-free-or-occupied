// Popup script for Free or Occupied extension

document.addEventListener('DOMContentLoaded', function() {
  const generateBtn = document.getElementById('generateBtn');
  const emailInput = document.getElementById('email');
  const statusDiv = document.getElementById('status');
  
  // Try to get user's identity/email
  browser.accounts.list().then(accounts => {
    if (accounts.length > 0 && accounts[0].identities.length > 0) {
      emailInput.value = accounts[0].identities[0].email;
    }
  }).catch(err => {
    console.log('Could not get account info:', err);
  });
  
  generateBtn.addEventListener('click', async function() {
    const email = emailInput.value.trim();
    
    if (!email) {
      showStatus('Please enter your email address', 'error');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus('Please enter a valid email address', 'error');
      return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
      // Send message to background script
      const response = await browser.runtime.sendMessage({
        action: 'generateFreeBusy',
        email: email
      });
      
      if (response.success) {
        // Create and download the ICS file
        downloadICS(response.content, email);
        showStatus('FREE-BUSY file generated successfully!', 'success');
      } else {
        showStatus('Error: ' + response.error, 'error');
      }
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate FREE-BUSY File';
    }
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    // Hide after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  }
  
  function downloadICS(content, email) {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const filename = `freebusy-${email.replace('@', '-')}-${Date.now()}.ics`;
    
    // Create download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
