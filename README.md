# Wani's Club Level Up Website

This is a Next.js app with Google Apps Script integration for:

- storing form submissions in Google Sheets
- managing pricing cards from Google Sheets
- managing batch timings from Google Sheets
- controlling featured event popups from Google Sheets

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and set your Apps Script web app URLs:

```bash
copy .env.example .env.local
```

3. Update `.env.local`:

```env
APPS_SCRIPT_CMS_URL=YOUR_CMS_WEB_APP_URL
APPS_SCRIPT_FORM_URL=YOUR_FORM_WEB_APP_URL
APPS_SCRIPT_CMS_WRITE_URL=YOUR_CMS_WRITE_WEB_APP_URL
ADMIN_PANEL_KEY=YOUR_ADMIN_SECRET_KEY
```

4. Start dev server:

```bash
npm run dev
```

## Google Apps Script Contract

### CMS endpoint (`APPS_SCRIPT_CMS_URL`)

The app expects a JSON payload like:

```json
{
	"pricingPlans": [
		{
			"name": "1 Month",
			"price": "2500",
			"features": ["All Gym Access", "Group Classes"],
			"attendance": "Physical Attendance",
			"highlight": false
		},
		{
			"name": "Online Class",
			"price": "1800",
			"features": ["Live Online Sessions"],
			"attendance": "Online Attendance",
			"highlight": false
		}
	],
	"batchTimings": {
		"morning": ["6:00 AM", "7:00 AM", "8:00 AM"],
		"evening": ["5:00 PM", "7:00 PM"],
		"note": "Note: 4 PM & 6 PM slots are reserved for Personal Training"
	},
	"featuredEvent": {
		"enabled": true,
		"title": "Summer Transformation Camp",
		"subtitle": "Limited period offer",
		"offerings": ["Free Body Assessment", "Diet Kickstart Plan"],
		"products": ["Fat Burn Starter", "Mobility Bundle"],
		"ctaText": "Book Now"
	}
}
```

When `featuredEvent.enabled` is `true`, the popup appears on page load.

### Form endpoint (`APPS_SCRIPT_FORM_URL`)

The app posts both forms (`trial` and `plan_enquiry`) in this structure:

```json
{
	"formType": "trial",
	"data": {
		"name": "Member Name",
		"goal": "Weight Loss",
		"batch": "7:00 AM"
	},
	"source": "wani-club-level-up-site",
	"submittedAt": "2026-03-18T10:00:00.000Z"
}
```

For `plan_enquiry`, the `data` object includes selected plan and complete user details.

For weight-loss registration, the app posts:

```json
{
	"formType": "weight_loss_program",
	"data": {
		"name": "Member Name",
		"phone": "9999999999",
		"goal": "Fat Loss",
		"program": "7 Days",
		"eventTitle": "Summer Transformation Camp"
	},
	"source": "wani-club-level-up-site",
	"submittedAt": "2026-03-18T10:00:00.000Z"
}
```

### CMS write endpoint (`APPS_SCRIPT_CMS_WRITE_URL`)

Admin panel saves to `/api/admin/cms`, which forwards this payload to Apps Script:

```json
{
	"action": "saveCms",
	"data": {
		"pricingPlans": [],
		"batchTimings": {},
		"featuredEvent": {}
	}
}
```

If `APPS_SCRIPT_CMS_WRITE_URL` is not set, the app uses `APPS_SCRIPT_CMS_URL` for writes as well.

## Admin Control Panel

Open `/admin` in your app to manage the website CMS.

You can:

- update batch timings and note
- add, edit, highlight, or remove pricing plans
- add/edit features per pricing plan
- enable/disable featured event announcements and popup
- configure event offerings and product features

Saving requires the `ADMIN_PANEL_KEY` value entered in the panel.

## Scripts

- `npm run dev` - start local server
- `npm run lint` - run lint checks
- `npm run build` - build for production
