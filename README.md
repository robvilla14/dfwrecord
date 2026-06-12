Daily Field Work Record

A browser-based digital implementation of the Daily Field Work Record form
used by environmental, archaeological, and construction monitoring field teams.
Designed to replace paper forms with a tablet-friendly digital workflow that
produces a print-ready PDF matching the original form layout.

 What It Does

Field staff complete the form on a tablet or laptop, save it locally, and print
a clean single-page record at the end of the day. Records are stored in the
browser and can be exported as JSON backups for archiving or transfer.

 Who It's For

Environmental monitors, archaeologists, survey crews, and field technicians who
need to document daily site activities on federally or state-funded projects.
Also suitable for any field discipline that uses a structured daily work record.

 Features

- Company setup with logo upload, contact info, and color scheme selection
- Multi-record dashboard — save and manage records across an entire project
- Auto-calculated total hours from Time In, Time Out, and Lunch
- Work report with 2200-character limit and live character counter
- Auto-expanding Work Report textarea — grows with content, no scrollbar until limit
- Attachment indicators for Photo Log, Map, Supplementary Sheets, GPS Log, and Other
- Phone number auto-formatting to (XXX) XXX-XXXX
- Export backup as JSON — filename includes job name and timestamp
- Multi-file import — select multiple backup files to merge into one dataset
- Print-ready single-page output matching the original paper form layout
- Company logo, color-coded footer band, and contact info on every printed form

 Color Schemes

Five built-in color schemes applied to the app header and printed form footer:

| Scheme | Primary Color | Label |
|--------|--------------|-------|
| Navy | #1B2A47 | MB |
| Slate Blue | #1E3A5F | Slate Blue |
| Charcoal | #2C2C2E | Charcoal |
| Forest | #1A3C28 | Forest |
| Maroon | #7B1D1D | Maroon |

To add a custom scheme, edit the 'SCHEMES' constant in the JavaScript section.

 Usage

Open in any modern browser — Chrome, Firefox, Safari, or Edge. No installation,
no internet connection required after the initial page load. All data is processed
and stored locally in the browser.

Recommended for field use: tablet (landscape orientation) or laptop.

- First-time setup
1. Open the file in a browser
2. Tap Setup in the top-right corner
3. Enter your company name, address, phone, and email
4. Upload your company logo (PNG or JPG recommended)
5. Select a color scheme
6. Tap Save Setup

- Creating a record
1. Tap + New Record on the dashboard
2. Complete all applicable sections
3. Tap Save in the header to save and keep editing,
   or Save Record at the bottom to save and return to the dashboard
4. Tap Print to open the browser's print dialog — select Save as PDF
   to generate a PDF file

- Backup and transfer
--Export Backup — saves all records as a single JSON file
--Import Backup — accepts one or multiple JSON files; merges all records
  and deduplicates by ID, keeping the most recently saved version of any duplicate

 Form Sections

| Section | Fields |
|---------|--------|
| Job Information | Job Number, Job Name, Date, Work Location, Total Pages |
| Work Type | Survey, Archaeological Excavation, Monitoring, Other (with text field) |
| Personnel | Your Name, Crew (name and affiliation) |
| Time | Time In, Time Out, Lunch (minutes), Total Hours (auto-calculated) |
| Additional Personnel | Visitors, Native American Monitor, Construction Crew |
| Vehicle | Vehicle, Start Location, Total Miles |
| Work Report | Free text, 2200 character maximum |
| Attachments | Photo Log, Map, Supplementary Sheets, GPS Log, Other (with text field) |

 Print Output

The printed form includes:

--Header: Company logo (left), "Daily Field Work Record" title (center),
  page number (right)
--Body: All form fields in labeled rows matching the original paper form layout
--Work Report: Fixed-height ruled area — text beyond the print area is truncated.
  Check Supplementary Sheets in Attachments if additional pages are needed.
--Attachments row: Checkbox indicators just above the footer
--Footer band: Company address, phone, and email in the selected scheme color

Print tips
- Use Letter paper size (8.5 × 11 in)
- Set margins to Default or None — the '@page' rule controls margins
- Enable Background graphics in print settings to render the footer color band
- Select Save as PDF in the print dialog to generate a PDF file

 Storage

All data is saved to the browser's 'localStorage' under two keys:

-'dfwr_setup' - company profile and color scheme
- 'dfwr_records' - array of all saved records

Important: Clearing browser data will erase all saved records.
Export a backup regularly, especially after field sessions.

The storage meter on the dashboard shows current usage against the ~5MB browser limit.

---Export Format

Backup files are JSON arrays. Each record contains all form fields plus system
metadata ('id', 'created', 'updated' timestamps).

-Filename format: 'dfwr-[JobName]_backup-YYYY-MM-DD-HHMM.json'

Example: 'dfwr-Stadium_Build_backup-2026-06-10-1430.json'

For Developers

The tool is a single HTML file with no external dependencies. The code is
extensively commented to explain the architecture, data model, and every
non-obvious implementation decision. It is designed to be readable and modifiable
by someone learning from it.

Key constants at the top of the JavaScript section:

---javascript
const STORE_KEY = 'dfwr_records';  // localStorage key for records
const SETUP_KEY = 'dfwr_setup';    // localStorage key for setup
const MAX_REPORT_CHARS = 2200;     // Work Report character limit
---

To add a new color scheme:

---javascript
const SCHEMES = {
  // Add a new entry here — key is the scheme identifier
  yourScheme: { primary: '#123456', text: '#FFFFFF', label: 'Your Label' },
};
---

To add a new form field:
1. Add it to 'blankRecord()' with a default value
2. Add the HTML input in the form view
3. Add it to 'populateForm()' to load saved values
4. Add it to 'saveRecord()' to capture the value on save
5. Add it to 'populatePrintView()' to display it on print

Compliance Reference

This tool is designed for use on public works projects and cultural resource
management field work. The form structure follows standard daily field documentation
practices for environmental monitoring, archaeological survey, and construction
inspection activities.

License

Developed by Labor Compliance Solutions.

---

*Part of the Labor Compliance Solutions digital toolkit.*
*For platform access and subscription information, visit insightworkx.co.*
