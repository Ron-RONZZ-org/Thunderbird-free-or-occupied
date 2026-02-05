var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

var calendar = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    // Helper function to get the calendar manager
    const getCalendarManager = () => {
      try {
        // Try the new module first (Thunderbird 91+)
        const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
        return cal.getCalendarManager();
      } catch (e) {
        try {
          // Try alternative import path
          const { cal } = ChromeUtils.import("resource://calendar/modules/calUtils.jsm");
          return cal.getCalendarManager();
        } catch (e2) {
          // Try direct access
          if (typeof cal !== 'undefined' && cal.getCalendarManager) {
            return cal.getCalendarManager();
          }
          throw new Error("Could not access calendar manager. Calendar might not be installed or enabled.");
        }
      }
    };

    // Helper function to create date range (current time to one year from now)
    const getDateRange = () => {
      try {
        const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
        const now = cal.dtz.now();
        const oneYearFromNow = now.clone();
        oneYearFromNow.year += 1;
        return { start: now, end: oneYearFromNow };
      } catch (e) {
        // Fallback to JavaScript dates
        const now = new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(now.getFullYear() + 1);
        return { start: now, end: oneYearFromNow };
      }
    };

    // Helper function to get events from a calendar
    const getCalendarEvents = (calendar) => {
      return new Promise((resolve, reject) => {
        try {
          const { start, end } = getDateRange();
          const allEvents = [];
          
          const listener = {
            onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetail) {
              // Operation complete - resolve with all collected events
              if (Components.isSuccessCode(aStatus)) {
                console.log(`Calendar operation completed successfully for calendar: ${calendar.name}, events: ${allEvents.length}`);
                resolve(allEvents);
              } else {
                console.error(`Calendar operation failed with status: ${aStatus} for calendar: ${calendar.name}`);
                resolve([]); // Return empty array on error instead of rejecting
              }
            },
            onGetResult(aCalendar, aStatus, aItemType, aDetail, aItems) {
              // This can be called multiple times with batches of results
              if (Components.isSuccessCode(aStatus)) {
                console.log(`Received ${aItems.length} items from calendar: ${calendar.name}`);
                const events = aItems.map(item => ({
                  id: item.id,
                  title: item.title || "",
                  startDate: item.startDate ? item.startDate.icalString : "",
                  endDate: item.endDate ? item.endDate.icalString : ""
                }));
                allEvents.push(...events);
              }
            }
          };

          calendar.getItems(
            Ci.calICalendar.ITEM_FILTER_TYPE_EVENT,
            0,
            start,
            end,
            listener
          );
        } catch (error) {
          console.error("Error calling getItems:", error, error.stack);
          resolve([]); // Return empty array on error
        }
      });
    };

    return {
      calendar: {
        async getCalendars() {
          try {
            console.log("Getting calendar manager...");
            const calManager = getCalendarManager();
            console.log("Getting calendars...");
            const calendars = calManager.getCalendars();
            console.log(`Found ${calendars.length} calendar(s)`);
            
            return calendars.map(calendar => ({
              id: calendar.id,
              name: calendar.name
            }));
          } catch (error) {
            console.error("Error getting calendars:", error, error.stack);
            throw error;
          }
        },

        async getEvents(calendarId) {
          try {
            console.log(`Getting events for calendar: ${calendarId}`);
            const calManager = getCalendarManager();
            const calendar = calManager.getCalendarById(calendarId);
            
            if (!calendar) {
              console.log(`Calendar not found: ${calendarId}`);
              return [];
            }

            return await getCalendarEvents(calendar);
          } catch (error) {
            console.error("Error getting events:", error, error.stack);
            throw error;
          }
        },

        async getAllEvents() {
          try {
            console.log("Getting calendar manager for getAllEvents...");
            const calManager = getCalendarManager();
            console.log("Getting all calendars...");
            const calendars = calManager.getCalendars();
            
            if (!calendars || calendars.length === 0) {
              console.log("No calendars found");
              return [];
            }
            
            console.log(`Found ${calendars.length} calendar(s), fetching events...`);
            
            // Fetch events from all calendars concurrently
            const eventPromises = calendars.map(calendar => getCalendarEvents(calendar));
            const allEventsArrays = await Promise.all(eventPromises);
            const allEvents = allEventsArrays.flat();
            
            console.log(`Retrieved ${allEvents.length} events from ${calendars.length} calendar(s)`);
            return allEvents;
          } catch (error) {
            console.error("Error getting all events:", error, error.stack);
            throw error;
          }
        }
      }
    };
  }
};
