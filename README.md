# 🚀 Mission Control Dashboard

Welcome to Mission Control, your customizable, Dockerized dashboard application designed to be a centralized front-end for managing and monitoring your self-hosted applications and services!

Mission Control provides a unified and configurable interface, built with modularity, security, and user-customizability in mind.

## ✨ Features

-   **Modular Widget System:** Add, remove, rearrange, and resize widgets to build your perfect dashboard layout.
-   **Extensive Customization:**
    -   🎨 **Comprehensive Theming:** Choose from multiple dark modes and a wide array of accent colors.
    -   🖼️ **Flexible Icons:** Support for Material Design Icons, Simple Icons, and selfh.st/icons.
-   **Secure Integrations:** Connect to your self-hosted services (Sonarr, Radarr, Home Assistant, Docker, etc.) with API keys managed securely on the backend.
-   **Real-time Updates:** Stay informed with live data updates via MQTT.
-   **Custom Widget Support:** Extend functionality by adding your own user-created widgets (with secure sandboxing).
-   **System Notifications:** Integrate with a self-hosted NTfy server for push notifications from your services.
-   **Backup & Restore:** Easily back up and restore your dashboard configuration and data.
-   **Dockerized Deployment:** Simple setup and management using Docker and Docker Compose.

## 🛠️ Installation

Mission Control is designed to be deployed using Docker Compose.

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/chr0nzz/mission-control.git
    cd mission-control
    ```

2.  **Configure Docker Socket Proxy (Required for Docker Widget):**
    If you plan to use the Docker widget, you **must** set up a secure socket proxy. We recommend using `tecnativa/docker-socket-proxy`. Add the following service to your `docker-compose.yml` file (it's already included in the provided file, but verify the configuration):

    ```yaml
      socket-proxy:
        image: tecnativa/docker-socket-proxy
        container_name: mission-control-socket-proxy
        environment:
          # Configure for read-only access - DO NOT enable POST or other write operations unless you understand the risks!
          - CONTAINERS=1 # Allow access to /containers endpoints (for list, inspect, logs, stats)
          - EVENTS=1     # Allow access to /events endpoint (for real-time events)
          - POST=0       # Crucially, disallow POST requests (no start, stop, create, etc.)
          # Explicitly disable other potentially dangerous API sections
          - EXEC=0
          - BUILD=0
          - IMAGES=0
          - VOLUMES=0
          - NETWORKS=0
          - SERVICES=0
          - SECRETS=0
          - CONFIGS=0
          - NODES=0
          - SWARM=0
          - DISTRIBUTION=0
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock:ro # Mount the host Docker socket (read-only for the proxy itself)
        networks:
          - mission-control-net
        restart: unless-stopped # Ensure the proxy restarts if it crashes
    ```
    **⚠️ Security Warning:** Directly mounting `/var/run/docker.sock` into a container is a major security risk. Using `tecnativa/docker-socket-proxy` with the strict read-only configuration above is essential to mitigate this risk. Ensure `POST=0` and disable all unnecessary API sections.

3.  **Deploy with Docker Compose:**
    ```bash
    docker compose up -d
    ```
    This will build the images (if not already built) and start the backend, frontend, socket-proxy, and MQTT broker containers.

4.  **Access Mission Control:**
    The dashboard should now be accessible in your web browser at `http://localhost:8080`.

## ⚙️ Configuration

Configuration is primarily done through the Mission Control Settings Application, accessible via the dashboard UI.

-   **Global Settings:** Configure application-wide preferences like the default theme, NTfy server details, and backup options.
-   **Service Configuration:** Add and manage connections to your self-hosted services (Sonarr, Radarr, Home Assistant, etc.) by entering their URLs and API keys. These credentials are encrypted and stored securely on the backend.
-   **Custom Widget Management:** Install, view, and delete custom widgets from ZIP files or Git repositories.

## 🧑‍💻 Development

Interested in contributing or building your own custom widgets? Check out the Developer Guide (TODO: Link to Developer Guide).

## 🤝 Contributing

We welcome contributions! Please see our Contribution Guidelines (TODO: Link to Contribution Guidelines) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (TODO: Create LICENSE file)

---

*This README is a work in progress and will be expanded with more details.*