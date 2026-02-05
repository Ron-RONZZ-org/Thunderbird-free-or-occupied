var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

var calendar = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      calendar: {
        async getCalendars() {
          try {
            console.log("getCalendars: Getting calendar manager...");
            
            // Try to import calendar module and get manager
            let calManager;
            let importError;
            
            try {
              const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
              console.log("Successfully imported calendar module from resource:///modules/calendar/calUtils.jsm");
              calManager = cal.getCalendarManager();
            } catch (e) {
              importError = e;
              console.error("Failed to import from resource:///modules/calendar/calUtils.jsm:", e.message);
              
              try {
                const { cal } = ChromeUtils.import("resource://calendar/modules/calUtils.jsm");
                console.log("Successfully imported calendar module from resource://calendar/modules/calUtils.jsm");
                calManager = cal.getCalendarManager();
              } catch (e2) {
                console.error("Failed to import from resource://calendar/modules/calUtils.jsm:", e2.message);
                throw new Error(`Could not import calendar module. Original error: ${importError.message}, Second attempt: ${e2.message}`);
              }
            }
            
            if (!calManager) {
              throw new Error("Calendar manager is null or undefined");
            }
            
            console.log("Getting calendars from manager...");
            const calendars = calManager.getCalendars();
            console.log(`Found ${calendars.length} calendar(s)`);
            
            return calendars.map(calendar => ({
              id: calendar.id,
              name: calendar.name
            }));
          } catch (error) {
            console.error("Error in getCalendars:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to get calendars: ${error.message}`);
          }
        },

        async getEvents(calendarId) {
          try {
            console.log(`getEvents: Getting events for calendar: ${calendarId}`);
            
            const { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
            const calManager = cal.getCalendarManager();
            const calendar = calManager.getCalendarById(calendarId);
            
            if (!calendar) {
              console.log(`Calendar not found: ${calendarId}`);
              return [];
            }

            return await this._getCalendarEvents(calendar, cal);
          } catch (error) {
            console.error(`Error in getEvents for ${calendarId}:`, error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to get events: ${error.message}`);
          }
        },

        async getAllEvents() {
          try {
            console.log("getAllEvents: Starting...");
            
            // Try to import calendar module
            let cal, calManager;
            try {
              const calImport = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");
              cal = calImport.cal;
              console.log("Successfully imported calendar module");
            } catch (e) {
              console.error("Failed to import calendar module:", e.message);
              try {
                const calImport = ChromeUtils.import("resource://calendar/modules/calUtils.jsm");
                cal = calImport.cal;
                console.log("Successfully imported calendar module from alternative path");
              } catch (e2) {
                console.error("Failed alternative import:", e2.message);
                throw new Error(`Could not import calendar module: ${e.message}`);
              }
            }
            
            console.log("Getting calendar manager...");
            calManager = cal.getCalendarManager();
            
            if (!calManager) {
              throw new Error("Calendar manager is null");
            }
            
            console.log("Getting all calendars...");
            const calendars = calManager.getCalendars();
            
            if (!calendars || calendars.length === 0) {
              console.log("No calendars found");
              return [];
            }
            
            console.log(`Found ${calendars.length} calendar(s), fetching events...`);
            
            // Get events from all calendars
            const allEvents = [];
            for (const calendar of calendars) {
              try {
                console.log(`Fetching events from calendar: ${calendar.name}`);
                const events = await this._getCalendarEvents(calendar, cal);
                console.log(`Got ${events.length} events from ${calendar.name}`);
                allEvents.push(...events);
              } catch (error) {
                console.error(`Error fetching events from calendar ${calendar.name}:`, error.message);
                // Continue with other calendars
              }
            }
            
            console.log(`Retrieved ${allEvents.length} total events from ${calendars.length} calendar(s)`);
            return allEvents;
          } catch (error) {
            console.error("Error in getAllEvents:", error.message);
            console.error("Error stack:", error.stack);
            throw new Error(`Failed to get all events: ${error.message}`);
          }
        },

        // Helper method to get events from a single calendar
        async _getCalendarEvents(calendar, cal) {
          return new Promise((resolve, reject) => {
            try {
              console.log(`_getCalendarEvents: Starting for ${calendar.name}`);
              
              // Create date range
              const now = cal.dtz.now();
              const oneYearFromNow = now.clone();
              oneYearFromNow.year += 1;
              
              const allEvents = [];
              
              const listener = {
                onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetail) {
                  if (Components.isSuccessCode(aStatus)) {
                    console.log(`Operation completed for ${calendar.name}: ${allEvents.length} events`);
                    resolve(allEvents);
                  } else {
                    console.error(`Operation failed for ${calendar.name} with status: ${aStatus}`);
                    resolve([]); // Return empty array on error
                  }
                },
                onGetResult(aCalendar, aStatus, aItemType, aDetail, aItems) {
                  if (Components.isSuccessCode(aStatus)) {
                    console.log(`Received ${aItems.length} items from ${calendar.name}`);
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

              console.log(`Calling getItems for ${calendar.name}`);
              calendar.getItems(
                Ci.calICalendar.ITEM_FILTER_TYPE_EVENT,
                0,
                now,
                oneYearFromNow,
                listener
              );
            } catch (error) {
              console.error(`Error in _getCalendarEvents for ${calendar.name}:`, error.message);
              console.error("Error stack:", error.stack);
              resolve([]); // Return empty array on error
            }
          });
        }
      }
    };
  }
};
