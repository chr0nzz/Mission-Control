# 🛠️ 02: Installation

Getting Mission Control up and running is a straightforward process, thanks to Docker and Docker Compose. Follow these steps to launch your new dashboard!

## 1. Prerequisites ✅

Before you begin, ensure you have the following installed on your host system (e.g., your server, Raspberry Pi, or desktop computer):

* **Docker**: Mission Control is distributed as a Docker image. [Install Docker Engine](https://docs.docker.com/engine/install/).
* **Docker Compose**: For easy management of the Mission Control container and its configuration. [Install Docker Compose](https://docs.docker.com/compose/install/).
* **A Host System**: Any machine that can run Docker (Linux, macOS with appropriate setup, Windows with WSL2).
* **Basic Command Line Familiarity**: You'll need to run a few commands in your terminal.

## 2. Obtain Project Files 📂

You'll need the `docker-compose.yml` file and the example configuration files.

* **Option A: Clone the Repository (Recommended if available)**
    If the Mission Control project is hosted on a Git repository (like GitHub), clone it:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_MISSION_CONTROL_REPO.git](https://github.com/YOUR_USERNAME/YOUR_MISSION_CONTROL_REPO.git) mission-control
    cd mission-control
    ```
    This will give you all necessary files, including the `Dockerfile`, `docker-compose.yml`, and the `example-config/` directory.

* **Option B: Create Files Manually**
    If you don't have a Git repository, you'll need to create the following files manually in a new directory (e.g., `~/mission-control/`):
    * `docker-compose.yml` (Content provided in this project's documentation or generation)
    * `Dockerfile` (Content provided)
    * Create an `example-config/` directory and inside it:
        * `settings.example.yml` (Content provided)
        * `dashboard.example.yml` (Content provided, ensure it's the responsive grid layout version)

## 3. Prepare Host Directories for Persistent Data 💾

Mission Control needs to store its configuration and data persistently outside the Docker container. The `docker-compose.yml` file maps directories on your host system to directories inside the container.

In the same directory where you placed your `docker-compose.yml` file (e.g., `~/mission-control/`), create the `app_data` directory structure. This is where your actual live configuration and data will be stored.

```bash
mkdir -p app_data/config
mkdir -p app_data/data
# Optional: mkdir -p app_data/custom_widgets # If you plan to use custom widgets
./app_data/config: This is critical! It will store your live settings.yml, dashboard.yml, and custom.css../app_data/data: This will store the SQLite database (mission_control.db) and any other persistent data.🛡️ Importance of Volumes: Using these volume mounts (defined in docker-compose.yml) ensures that your configurations and data survive container restarts, updates, or even removal. Without them, all your settings would be lost if the container is recreated.4. Initialize Configuration Files 📝For the very first run, Mission Control needs its initial configuration files.Copy Example Configuration:Navigate to your project directory (e.g., ~/mission-control/). If you cloned the repository, the example-config/ directory will be present. If you created files manually, ensure you have the content for settings.example.yml and dashboard.example.yml.Place in app_data/config/:Copy the contents of the example files into your live app_data/config/ directory and rename them:Copy example-config/settings.example.yml to app_data/config/settings.ymlCopy example-config/dashboard.example.yml to app_data/config/dashboard.ymlYou can do this with commands like:cp example-config/settings.example.yml app_data/config/settings.yml
cp example-config/dashboard.example.yml app_data/config/dashboard.yml
Or, download/create them and place them manually.These files provide a starting point. You will customize app_data/config/settings.yml and app_data/config/dashboard.yml to define your specific dashboard.5. Review docker-compose.yml 🧐Open your docker-compose.yml file and review/adjust the following:image vs. build:If you have a pre-built Docker image (e.g., yourusername/mission-control:latest), ensure the image: line is uncommented and correct.If you want to build the image locally from the Dockerfile in the current directory, ensure the build: . line is uncommented and the image: line is commented out or removed.Ports:The default is ports: - "3000:3000". This maps port 3000 on your host to port 3000 inside the container. If port 3000 on your host is already in use, change the first number (e.g., "3001:3000").Volumes:Ensure the volume paths (./app_data/config:/app/config and ./app_data/data:/app/data) correctly point to the app_data subdirectories you created on your host, relative to where your docker-compose.yml file is located.Environment Variables:TZ (Timezone): This is very important! Change America/New_York to your actual tz database time zone name (e.g., Europe/London, Asia/Tokyo). This ensures correct time display in widgets.PUID and PGID (Optional): If you encounter file permission issues with the mounted app_data directory, you might need to set these to your host user's UID and GID. Find them with id -u and id -g in your terminal. The node user inside the official Docker images often has UID/GID 1000.Optional Services:If you want to run an MQTT broker (like Mosquitto) or the Docker Socket Proxy alongside Mission Control, uncomment their service definitions in docker-compose.yml and configure them as needed (e.g., Mosquitto config volume, Docker socket GID for the proxy).6. Start the Application! 🚀Navigate to the directory containing your docker-compose.yml file in your terminal and run:If building the image locally first (recommended for initial setup or development):docker-compose build mission-control # Or just 'docker-compose build' if it's the only service building
docker-compose up -d
If using a pre-built image:docker-compose pull mission-control # Ensure you have the latest image if specified
docker-compose up -d
The -d flag runs the containers in "detached" mode (in the background).Docker will now either build the image or pull it, and then start the Mission Control container (and any other services you uncommented).7. Access Your Dashboard 🖥️Once the container is running (it might take a few moments the first time, especially if building), you can access Mission Control in your web browser.By default (if you used port 3000 on the host), it will be available at: http://localhost:3000If you changed the host port in docker-compose.yml (e.g., from "3000:3000" to "3001:3000"), use that port instead (e.g., http://localhost:3001). If you are accessing it from another computer on your local network, replace localhost with the IP address or hostname of the machine running Docker.🎉 Congratulations! Mission Control should now be up and running with the example configuration.Next Steps ➡️Explore your new dashboard!Customize app_data/config/settings.yml for application-wide settings (like MQTT broker details).Begin customizing your dashboard layout and widgets by editing app_data/config/dashboard.yml or using the on-page editor as described in 🖌️ Dashboard Customization.Refer to ⚙️ Configuration Overview for details on the YAML files.Troubleshooting Initial Startup 🐛Port Conflicts: If another service on your host is already using the host port you've mapped, Docker Compose will fail to start. Change the host port in docker-compose.yml.Volume Mount Issues: Ensure paths in volumes: are correct and the host directories exist. Check file permissions if the container reports errors writing to /app/config or /app/data.Check Logs: If the container doesn't start or you can't access the dashboard:docker-compose logs mission-control
Or for live logs:docker-compose logs -f mission-control

