# CCF CW Ushering Ministry ERT Portal

Three portals that share the same records:

| File | Who uses it |
|---|---|
| `index.html` | Start page with links to the three portals |
| `admin.html` | **Volunteer Management**: Emergency Director, Deputy, coordinators (command PIN) |
| `leader.html` | **Team Leader's Portal**: unit leads and area team leads (team lead PIN) |
| `volunteer.html` | **Volunteer Portal**: every ERT volunteer |

The `js` folder holds the code: `core.js` (shared), `admin.js`, `leader.js`, `volunteer.js`, `theme.js` (colors) and `config.js` (your Firebase settings).

Roles follow the Ushering Ministry ERT org chart: Emergency Director, Deputy, Advisers, five units (Evacuation Team/Marshal, Fire Fighting, Search & Rescue, Medical Team, Security & Comms) with their positions, and the three area search, rescue & evacuation teams. Everything is editable from **Org Chart & Roles** in Volunteer Management.

The pages load Tailwind, Lucide icons and the Inter font from the internet, so the device needs a connection for the styling to appear.

---

## 1. Try it on one computer (offline mode)

Keep the folder structure as-is and double-click `index.html`. Records are saved in that browser only. The first time you open Volunteer Management, it asks you to create the **command PIN** and the **team lead PIN**.

Sample volunteers are included so you can try every screen. Remove them in **Settings & Backup → Remove sample records**. The org chart structure stays.

## 2. Put it online so phones on any Wi-Fi or mobile data can use it

You need two free accounts: **Firebase** (stores the records) and **GitHub** (hosts the pages). Everything can be done in a web browser, with no software to install.

### A. Create the Firebase database

1. Go to https://console.firebase.google.com and click **Create a project** (name it e.g. `ccf-cw-ert`). Analytics can be turned off.
2. In the left menu, open **Build → Realtime Database → Create database**. Choose the **Singapore (asia-southeast1)** location and start in **locked mode**.
3. Open the **Rules** tab, replace everything with the contents of `database.rules.json`, and click **Publish**.
4. Click the gear icon → **Project settings** → under **Your apps** click the **web** icon (`</>`), give it a name and click **Register app**.
5. Copy the `firebaseConfig` values it shows. Open `js/config.js` and replace `firebase: null` with them. Check that `databaseURL` is included. If it is missing, copy the URL shown at the top of the Realtime Database page.

### B. Host the pages on GitHub Pages

1. Sign in at https://github.com and create a new **public** repository, e.g. `ccf-cw-ert-portal`.
2. Click **Add file → Upload files** and drag in all the files *and* the `js` folder. Click **Commit changes**.
3. Open **Settings → Pages**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`, and save.
4. After a minute the portal is live at `https://<your-username>.github.io/ccf-cw-ert-portal/`.

The code is public on GitHub, but the records are not: they live in Firebase and can only be opened with your team access code.

### C. Create the team records

1. Open `admin.html` on the live site. It asks for a **team access code**. Make one up of at least 8 characters, for example `ccfcw-ert-7k2q9`. Treat it like a password.
2. Since the code is new, it offers to **create the team records**. Set both PINs and choose whether to include the sample volunteers.
3. In **Settings & Backup**, copy the share link (it contains the access code) and post it in the ERT Viber GC. Volunteers who open the link go straight in, and the code is remembered on their phone.

## 3. How access works (please read)

- The **team access code** keeps the public out. Anyone who has it can read and change records, including contact numbers and blood types. Share it only with ERT members, and change it if it leaks. To change it, create new records under a new code from an exported backup.
- The **PINs** keep volunteers out of the command and team lead portals. They are not strong security, because anyone with the access code could still reach the database directly. For stronger protection, add Firebase Authentication later.
- Volunteers open their portal by choosing their name. There is no personal password.
- Firebase's free plan allows **100 devices connected at the same time** and plenty of storage for an ERT roster. If more than 100 people will have the portal open at once during an activation, upgrade to the pay-as-you-go plan.

## 4. Backups

In **Settings & Backup** you can export a JSON backup, import a backup, and export the volunteer list as CSV for Excel. Export a backup after big changes.
