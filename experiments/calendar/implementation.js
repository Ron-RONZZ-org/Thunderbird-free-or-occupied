var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

var calendar = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    // Safely get the calendar service - tries different Thunderbird versions
    const getCalendarService = () => {
      try {
        let cal;
        
        // Try Thunderbird 115+ path with ESM loader
        try {
          cal = ChromeUtils.importESModule("resource:///modules/calendar/utils/calUtils.sys.mjs").cal;
          console.log("✓ Loaded calendar from ESM: resource:///modules/calendar/utils/calUtils.sys.mjs");
          return cal;
        } catch (e) {
          console.log("✗ TB 115+ ESM path failed:", e.message);
        }
        
        // Try Thunderbird 102+ path with ESM loader (.sys.mjs)
        try {
          cal = ChromeUtils.importESModule("resource:///modules/calendar/calUtils.sys.mjs").cal;
          console.log("✓ Loaded calendar from ESM: resource:///modules/calendar/calUtils.sys.mjs");
          return cal;
        } catch (e) {
          console.log("✗ TB 102+ ESM path failed:", e.message);
        }
        
        // Try Thunderbird 91+ path with JSM loader (.jsm)
        try {
          cal = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm").cal;
          console.log("✓ Loaded calendar from JSM: resource:///modules/calendar/calUtils.jsm");
          return cal;
        } catch (e) {
          console.log("✗ TB 91+ JSM path failed:", e.message);
        }
        
        // Try legacy path with JSM loader
        try {
          cal = ChromeUtils.import("resource://calendar/modules/calUtils.jsm").cal;
          console.log("✓ Loaded calendar from legacy path: resource://calendar/modules/calUtils.jsm");
          return cal;
        } catch (e) {
          console.log("✗ Legacy calendar path failed:", e.message);
        }
        
        throw new Error("Could not load calendar module from any known path (TB 78-115+). Calendar add-on may not be installed or enabled.");
      } catch (error) {
        console.error("Fatal error loading calendar service:", error);
        throw error;
      }
    };

    return {
      calendar: {
        async getCalendars() {
          console.log("=== getCalendars called ===");
          try {
            const cal = getCalendarService();
            console.log("Getting calendar manager...");
            const calManager = cal.getCalendarManager();
            
            if (!calManager) {
              throw new Error("Calendar manager is null");
            }
            
            console.log("Getting calendars...");
            const calendars = calManager.getCalendars();
            console.log(`Found ${calendars.length} calendar(s)`);
            
            return calendars.map(calendar => ({
              id: calendar.id,
              name: calendar.name
            }));
          } catch (error) {
            console.error("Error in getCalendars:", error.message);
            console.error("Stack:", error.stack);
            throw error;
          }
        },

        async getEvents(calendarId) {
          console.log(`=== getEvents called for ${calendarId} ===`);
          try {
            const cal = getCalendarService();
            const calManager = cal.getCalendarManager();
            const calendar = calManager.getCalendarById(calendarId);
            
            if (!calendar) {
              console.log(`Calendar not found: ${calendarId}`);
              return [];
            }

            return await this._fetchEventsFromCalendar(calendar, cal);
          } catch (error) {
            console.error(`Error in getEvents:`, error.message);
            throw error;
          }
        },

        async getAllEvents() {
          console.log("=== getAllEvents called ===");
          try {
            const cal = getCalendarService();
            console.log("Getting calendar manager...");
            const calManager = cal.getCalendarManager();
            
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
                console.log(`Fetching from: ${calendar.name}`);
                const events = await this._fetchEventsFromCalendar(calendar, cal);
                console.log(`Got ${events.length} events from ${calendar.name}`);
                allEvents.push(...events);
              } catch (error) {
                console.error(`Error with calendar ${calendar.name}:`, error.message);
              }
            }
            
            console.log(`Total events retrieved: ${allEvents.length}`);
            return allEvents;
          } catch (error) {
            console.error("Error in getAllEvents:", error.message);
            console.error("Stack:", error.stack);
            throw error;
          }
        },

        async _fetchEventsFromCalendar(calendar, cal) {
          return new Promise((resolve) => {
            try {
              console.log(`_fetchEventsFromCalendar for: ${calendar.name}`);
              
              // Create date range
              const now = cal.dtz.now();
              const oneYearFromNow = now.clone();
              oneYearFromNow.year += 1;
              
              const allEvents = [];
              
              const listener = {
                onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetail) {
                  if (Components.isSuccessCode(aStatus)) {
                    console.log(`Completed: ${calendar.name}, ${allEvents.length} events`);
                    resolve(allEvents);
                  } else {
                    console.error(`Failed: ${calendar.name}, status: ${aStatus}`);
                    resolve([]);
                  }
                },
                onGetResult(aCalendar, aStatus, aItemType, aDetail, aItems) {
                  if (Components.isSuccessCode(aStatus)) {
                    console.log(`Batch received: ${aItems.length} items from ${calendar.name}`);
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
              console.error(`Error in _fetchEventsFromCalendar:`, error.message);
              resolve([]);
            }
          });
        }
      }
    };
  }
};
