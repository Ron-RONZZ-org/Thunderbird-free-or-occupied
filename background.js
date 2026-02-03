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
function formatICSDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Listen for messages from popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'generateFreeBusy') {
    try {
      // Get calendar events
      const calendars = await browser.calendar.calendars.query({});
      let allEvents = [];
      
      for (const calendar of calendars) {
        const events = await browser.calendar.items.query({
          calendarId: calendar.id,
          type: 'event'
        });
        allEvents = allEvents.concat(events);
      }
      
      // Get user email (fallback to default)
      const email = message.email || 'user@example.com';
      
      // Generate ICS content
      const icsContent = generateFreeBusyICS(allEvents, email);
      
      return { success: true, content: icsContent };
    } catch (error) {
      console.error('Error generating FREE-BUSY:', error);
      return { success: false, error: error.message };
    }
  }
});

console.log('Free or Occupied extension loaded');
