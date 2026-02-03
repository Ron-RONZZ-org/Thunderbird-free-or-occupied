# Thunderbird Free or Occupied

A Thunderbird extension that generates FREE-BUSY ICS files from your calendar events.

## Features

- Export your calendar availability as a FREE-BUSY ICS file
- Compatible with Thunderbird 78.0+
- Simple and intuitive user interface
- Automatically detects your email address from Thunderbird

## Installation

1. Download the latest release or clone this repository
2. Open Thunderbird
3. Go to **Add-ons and Themes** (Tools → Add-ons and Themes or press Ctrl+Shift+A)
4. Click the gear icon ⚙️ and select **Install Add-on From File**
5. Navigate to this directory and select the `manifest.json` file, or create a ZIP file containing all files and select it
6. The extension will be installed and activated

## Usage

1. Click the **Free or Occupied** icon in the Thunderbird toolbar
2. Enter your email address (it should be auto-filled from your account)
3. Click **Generate FREE-BUSY File**
4. The ICS file will be downloaded automatically

## What is FREE-BUSY?

FREE-BUSY is an iCalendar (ICS) standard that allows you to share your calendar availability without revealing the details of your events. It shows time periods when you are:
- **BUSY**: You have events scheduled
- **FREE**: You have no events scheduled

This is useful for:
- Sharing availability with colleagues
- Scheduling meetings
- Calendar synchronization between systems

## File Structure

```
.
├── manifest.json       # Extension manifest
├── background.js       # Background script for ICS generation
├── popup.html          # User interface
├── popup.js            # UI logic
├── icons/              # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md           # This file
```

## Development

The extension is built using the WebExtension API for Thunderbird. Key components:

- **manifest.json**: Defines the extension metadata and permissions
- **background.js**: Handles calendar data retrieval and ICS generation
- **popup.html/js**: Provides the user interface for generating FREE-BUSY files

### Permissions

The extension requires the following permission:
- `calendar`: To read calendar events from Thunderbird

## ICS Format

The generated ICS file follows the iCalendar standard (RFC 5545) and contains:
- VCALENDAR wrapper
- VFREEBUSY component with:
  - ORGANIZER (your email)
  - DTSTAMP (current timestamp)
  - FREEBUSY entries for each event

Example output:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Free or Occupied//Thunderbird Extension//EN
METHOD:PUBLISH
BEGIN:VFREEBUSY
ORGANIZER:mailto:user@example.com
DTSTAMP:20240203T120000Z
DTSTART:20240203T120000Z
FREEBUSY;FBTYPE=BUSY:20240203T140000Z/20240203T150000Z
FREEBUSY;FBTYPE=BUSY:20240204T100000Z/20240204T110000Z
END:VFREEBUSY
END:VCALENDAR
```

## License

See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.