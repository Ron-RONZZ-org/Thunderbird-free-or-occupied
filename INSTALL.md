# Installation Guide

This guide will help you install the Free or Occupied Thunderbird extension.

## Method 1: Install from Source (Development Mode)

1. **Download or Clone the Repository**
   ```bash
   git clone https://github.com/Ron-RONZZ-org/Thunderbird-free-or-occupied.git
   cd Thunderbird-free-or-occupied
   ```

2. **Open Thunderbird**
   - Launch Thunderbird on your computer

3. **Access Add-ons Manager**
   - Click on the menu (☰) or press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
   - Select "Add-ons and Themes"

4. **Install the Extension**
   - Click the gear icon (⚙️) in the top-right
   - Select "Debug Add-ons"
   - Click "Load Temporary Add-on"
   - Navigate to the extension folder and select any file (e.g., `manifest.json`)

5. **Verify Installation**
   - You should see "Free or Occupied" in your extensions list
   - A new icon should appear in your Thunderbird toolbar

## Method 2: Install from XPI File (Packaged Extension)

1. **Create XPI Package**
   ```bash
   cd Thunderbird-free-or-occupied
   zip -r free-or-occupied.xpi manifest.json background.js popup.html popup.js icons/
   ```

2. **Install in Thunderbird**
   - Open Thunderbird
   - Go to Add-ons and Themes (`Ctrl+Shift+A`)
   - Click the gear icon (⚙️)
   - Select "Install Add-on From File..."
   - Select the `free-or-occupied.xpi` file
   - Click "Install" when prompted

## Using the Extension

1. **Click the Extension Icon**
   - Find the "Free or Occupied" icon in your toolbar
   - Click it to open the popup

2. **Generate FREE-BUSY File**
   - Your email should be auto-filled
   - If not, enter your email address
   - Click "Generate FREE-BUSY File"
   - The ICS file will be downloaded to your default download location

3. **Use the ICS File**
   - Share the file with colleagues
   - Import into calendar systems
   - Use for scheduling meetings

## Troubleshooting

### Extension Not Loading
- Make sure you're using Thunderbird 78.0 or later
- Check the Browser Console (Ctrl+Shift+J) for error messages

### No Calendar Events
- Ensure you have calendar events in Thunderbird
- Check that the calendar is enabled

### Email Not Auto-Filled
- Manually enter your email address
- Verify your account is configured in Thunderbird

### Download Issues
- Check your browser/download settings
- Ensure you have write permissions to the download folder

## Uninstalling

1. Go to Add-ons and Themes (`Ctrl+Shift+A`)
2. Find "Free or Occupied" in the list
3. Click the "..." menu
4. Select "Remove"

## Support

For issues, questions, or contributions, please visit:
https://github.com/Ron-RONZZ-org/Thunderbird-free-or-occupied
