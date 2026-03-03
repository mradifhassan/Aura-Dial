# Aura Dial

A minimalist, modern speed dial startup page inspired by Opera, built for Firefox users on Ubuntu. Aura Dial provides a clean, high-performance command center for your web browsing, featuring customizable groups and high-quality favicons.

![Aura Dial Preview](https://picsum.photos/seed/auradial/1200/600)

## Features

- **Speed Dials**: Add your favorite sites with high-quality icons fetched automatically.
- **Group Management**: Organize your workspace into custom groups (e.g., Work, Social, Dev).
- **Minimalist UI**: Modern dark theme with ambient glow, smooth animations, and a real-time clock.
- **Integrated Search**: Quick access to Google search directly from the dashboard.
- **Local Persistence**: Powered by SQLite to ensure your data stays on your machine.
- **System Integration**: Designed to run as a background service on Ubuntu.

## Installation (Ubuntu)

### 1. Prerequisites
Aura Dial requires **Node.js 20 or higher**. If you are on an older version, upgrade using `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

### 2. Setup Project
```bash
# Clone or download the repository
git clone https://github.com/yourusername/aura-dial.git
cd aura-dial

# Install dependencies
npm install
```

### 3. Run Manually
To test if everything is working:
```bash
npm run dev
```
Access the dashboard at `http://localhost:3000`.

## 🛠 Permanent Setup (systemd)

To make Aura Dial start automatically when you boot your computer:

1. **Create the service file**:
   ```bash
   sudo nano /etc/systemd/system/auradial.service
   ```

2. **Paste the configuration** (Replace `radif` with your username and verify the `npm` path using `which npm`):
   ```ini
   [Unit]
   Description=Aura Dial Speed Dial Page
   After=network.target

   [Service]
   Type=simple
   User=radif
   Group=radif
   WorkingDirectory=/home/radif/aura-dial
   ExecStart=/home/radif/.nvm/versions/node/v22.22.0/bin/npm run dev
   Restart=on-failure
   Environment=NODE_ENV=production
   Environment=PATH=/home/radif/.nvm/versions/node/v22.22.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and Start**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable auradial
   sudo systemctl start auradial
   ```

##  Firefox Configuration

1. **Homepage**: Go to `Settings > Home > Homepage and new windows` -> Select **Custom URLs** and enter `http://localhost:3000`.
2. **New Tab**: Install the [New Tab Override](https://addons.mozilla.org/en-US/firefox/addon/new-tab-override/) extension and set the URL to `http://localhost:3000`.

##  Troubleshooting

### `ERR_INVALID_URL_SCHEME` or `EBADENGINE`
This happens if you are using a Node.js version older than 20. Ensure you have upgraded to Node 22 using the `nvm` steps above.

### `status=203/EXEC` in systemd
This usually means the path to `npm` in your `ExecStart` is incorrect. Run `which npm` in your terminal and ensure the path in `auradial.service` matches exactly.

### Deletion not working
If you are running this in a restricted environment (like an iframe), browser `confirm()` dialogs might be blocked. The local version has been optimized to handle deletions smoothly.

---

Built with ❤️ for the Ubuntu Community.
