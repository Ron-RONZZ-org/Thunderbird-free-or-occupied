var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { cal } = ChromeUtils.import("resource:///modules/calendar/calUtils.jsm");

var calendar = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
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

            // Get events for the next year
            const now = cal.dtz.now();
            const oneYearFromNow = now.clone();
            oneYearFromNow.year += 1;

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
                now,
                oneYearFromNow,
                listener
              );
            });
          } catch (error) {
            console.error("Error getting events:", error);
            return [];
          }
        },

        async getAllEvents() {
          try {
            const calManager = cal.getCalendarManager();
            const calendars = calManager.getCalendars();
            
            let allEvents = [];
            
            for (const calendar of calendars) {
              // Get events for the next year
              const now = cal.dtz.now();
              const oneYearFromNow = now.clone();
              oneYearFromNow.year += 1;

              const events = await new Promise((resolve) => {
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
                  now,
                  oneYearFromNow,
                  listener
                );
              });

              allEvents = allEvents.concat(events);
            }
            
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
