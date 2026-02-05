var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");

var calendar = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    // Helper function to create date range (current time to one year from now)
    const getDateRange = () => {
      const now = cal.dtz.now();
      const oneYearFromNow = now.clone();
      oneYearFromNow.year += 1;
      return { start: now, end: oneYearFromNow };
    };

    // Helper function to get events from a calendar
    const getCalendarEvents = (calendar) => {
      const { start, end } = getDateRange();
      
      return new Promise((resolve) => {
        const listener = {
          onOperationComplete(aCalendar, aStatus, aOperationType, aId, aDetail) {
            // Operation complete
          },
          onGetResult(aCalendar, aStatus, aItemType, aDetail, aItems) {
            if (Components.isSuccessCode(aStatus)) {
              const events = aItems.map(item => ({
                id: item.id,
                title: item.title || "",
                startDate: item.startDate ? item.startDate.icalString : "",
                endDate: item.endDate ? item.endDate.icalString : ""
              }));
              resolve(events);
            } else {
              resolve([]);
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
      });
    };

    return {
      calendar: {
        async getCalendars() {
          try {
            const calManager = cal.getCalendarManager();
            const calendars = calManager.getCalendars();
            
            return calendars.map(calendar => ({
              id: calendar.id,
              name: calendar.name
            }));
          } catch (error) {
            console.error("Error getting calendars:", error);
            return [];
          }
        },

        async getEvents(calendarId) {
          try {
            const calManager = cal.getCalendarManager();
            const calendar = calManager.getCalendarById(calendarId);
            
            if (!calendar) {
              return [];
            }

            return await getCalendarEvents(calendar);
          } catch (error) {
            console.error("Error getting events:", error);
            return [];
          }
        },

        async getAllEvents() {
          try {
            const calManager = cal.getCalendarManager();
            const calendars = calManager.getCalendars();
            
            // Fetch events from all calendars concurrently
            const eventPromises = calendars.map(calendar => getCalendarEvents(calendar));
            const allEventsArrays = await Promise.all(eventPromises);
            const allEvents = allEventsArrays.flat();
            
            return allEvents;
          } catch (error) {
            console.error("Error getting all events:", error);
            return [];
          }
        }
      }
    };
  }
};
