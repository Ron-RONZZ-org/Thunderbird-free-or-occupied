// Background script for Free or Occupied extension

// Function to generate FREE-BUSY ICS content
function generateFreeBusyICS(events, email) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Free or Occupied//Thunderbird Extension//EN',
    'METHOD:PUBLISH',
    'BEGIN:VFREEBUSY',
    `ORGANIZER:mailto:${email}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${timestamp}`,
  ];
  
  // Add FREEBUSY lines for each event
  events.forEach(event => {
    if (event.startDate && event.endDate) {
      const start = formatICSDate(event.startDate);
      const end = formatICSDate(event.endDate);
      icsContent.push(`FREEBUSY;FBTYPE=BUSY:${start}/${end}`);
    }
  });
  
  icsContent.push('END:VFREEBUSY');
  icsContent.push('END:VCALENDAR');
  
  return icsContent.join('\r\n');
}

// Format date to ICS format (YYYYMMDDTHHMMSSZ)
function formatICSDate(dateString) {
  // dateString is in iCalendar format (e.g., "20240203T140000Z")
  // If it's already in the correct format, return it
  if (typeof dateString === 'string' && /^\d{8}T\d{6}Z?$/.test(dateString)) {
    return dateString.endsWith('Z') ? dateString : dateString + 'Z';
  }
  
  // Otherwise, parse and format
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Listen for messages from popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'generateFreeBusy') {
    try {
      console.log('Starting FREE-BUSY generation...');
      
      // Check if calendar API is available
      if (!browser.calendar) {
        throw new Error('Calendar API not available. Please ensure the extension is properly installed.');
      }
      
      // Get all calendar events using our experimental API
      console.log('Fetching calendar events...');
      const allEvents = await browser.calendar.getAllEvents();
      console.log(`Retrieved ${allEvents.length} events`);
      
      // Get user email (fallback to default)
      const email = message.email || 'user@example.com';
      
      // Generate ICS content
      console.log('Generating ICS content...');
      const icsContent = generateFreeBusyICS(allEvents, email);
      console.log('ICS content generated successfully');
      
      return { success: true, content: icsContent };
    } catch (error) {
      console.error('Error generating FREE-BUSY:', error);
      console.error('Error stack:', error.stack);
      return { 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      };
    }
  }
});

console.log('Free or Occupied extension loaded');
