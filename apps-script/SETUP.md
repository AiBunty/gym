Google Apps Script Setup

1. Create a Google Sheet.
2. Open Extensions > Apps Script.
3. Replace default code with content from apps-script/Code.gs.
4. Set SPREADSHEET_ID in Code.gs from your Google Sheet URL.

Direct Cloud Update from This Repo

1. Install Node.js if not already installed.
2. From project root run:

npm run appscript:login

3. In folder apps-script, create .clasp.json from .clasp.json.example and set scriptId.

Example:
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}

4. Push code directly to Apps Script cloud:

npm run appscript:push

5. Deploy/update web app from local code:

npm run appscript:deploy

6. If you want to update an existing deployment id instead of creating new one:

cd apps-script
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -DeploymentId "YOUR_DEPLOYMENT_ID" -Description "latest cms update"

Deploy

1. Click Deploy > New deployment.
2. Select type: Web app.
3. Execute as: Me.
4. Who has access: Anyone.
5. Deploy and copy the Web App URL ending with /exec.

Environment variables (.env.local)

Use full Web App URL, not only Script ID.

APPS_SCRIPT_CMS_URL=https://script.google.com/macros/s/xxxx/exec
APPS_SCRIPT_CMS_WRITE_URL=https://script.google.com/macros/s/xxxx/exec
APPS_SCRIPT_FORM_URL=https://script.google.com/macros/s/xxxx/exec
ADMIN_PANEL_KEY=your-strong-secret-key

How it maps to your app

1. Public website CMS read: GET /api/cms -> APPS_SCRIPT_CMS_URL
2. Admin save CMS: POST /api/admin/cms -> APPS_SCRIPT_CMS_WRITE_URL (or APPS_SCRIPT_CMS_URL fallback)
3. Form submissions: POST /api/submit -> APPS_SCRIPT_FORM_URL

CMS data structure expected by website

{
  "pricingPlans": [
    {
      "name": "1 Month",
      "price": "2500",
      "features": ["All Gym Access", "Group Classes"],
      "attendance": "Physical Attendance",
      "highlight": false
    }
  ],
  "batchTimings": {
    "morning": ["6:00 AM", "7:00 AM", "8:00 AM"],
    "evening": ["5:00 PM", "7:00 PM"],
    "note": "Note text"
  },
  "featuredEvent": {
    "enabled": true,
    "title": "Event Title",
    "subtitle": "Subtitle",
    "offerings": ["Item 1", "Item 2"],
    "products": ["Product 1", "Product 2"],
    "ctaText": "Book Now"
  }
}

Quick test

1. Start app: npm run dev
2. Open website: / should load CMS data.
3. Open admin: /admin
4. Enter ADMIN_PANEL_KEY and save a change.
5. Refresh homepage and verify timings/pricing/event updates.
