# 🐛❓ 09: Troubleshooting

Encountering issues? Don't worry! This guide covers common problems and how to diagnose and solve them.

## 🔎 General Diagnostic Steps

1.  **Check Docker Container Logs**: This is often the first place to look for errors.
    * To see logs for the Mission Control container:
        ```bash
        docker logs mission_control
        ```
    * To follow logs in real-time (useful for seeing errors as they happen):
        ```bash
        docker logs -f mission_control
        ```
    * If you're running other related services via Docker Compose (like an MQTT broker or a Docker socket proxy), check their logs too:
        ```bash
        docker logs mqtt_broker
        docker logs docker_socket_proxy
        ```

2.  **Browser Developer Console**: For frontend issues (widgets not loading, UI glitches, MQTT WebSocket errors).
    * Open your browser's developer tools (usually by pressing F12, or right-click -> Inspect).
    * Look at the "Console" tab for JavaScript errors or failed network requests.
    * The "Network" tab can show you if API calls from the frontend to the backend are succeeding or failing.

3.  **Verify Configuration Files**: Typos or incorrect formatting in `settings.yml` or `dashboard.yml` are common culprits.
    * **YAML Syntax**: YAML is sensitive to indentation. Use a YAML linter or an editor with YAML validation to check your files.
    * **Correct Values**: Ensure URLs, API keys, widget types, and options are spelled correctly and are valid.
    * Refer to the example configuration files and the documentation for each setting/widget.

4.  **Restart the Application**: Sometimes a simple restart can resolve temporary glitches.
    ```bash
    docker-compose restart mission_control
    # Or, to restart all services defined in the docker-compose.yml:
    # docker-compose restart
    ```

5.  **Hard Refresh Browser**: Clear your browser's cache for the Mission Control page (Ctrl+Shift+R or Cmd+Shift+R) to ensure you're not seeing an outdated version of the frontend.

## 🐳 Docker & Deployment Issues

* **Container Not Starting / Exiting Immediately**:
    * **Port Conflicts**: If the host port mapped in `docker-compose.yml` (e.g., `3000`) is already in use by another application on your host system.
        * **Solution**: Stop the other application or change the host port in `docker-compose.yml` (e.g., `ports: - "3001:3000"`). Remember to access Mission Control on the new host port.
    * **Volume Mount Issues**:
        * Paths in `docker-compose.yml` might be incorrect, or the source directories (`./app_data/config`, `./app_data/data`) might not exist where Docker Compose expects them (relative to the `docker-compose.yml` file).
        * File permissions on the host for the mounted `app_data` directories might prevent the container from reading/writing. Ensure the user running inside the container (often `node` or a specific UID/GID) has permissions.
    * **Missing Dependencies / Build Errors**: If building from source, the Docker build might have failed. Check the build log.
    * **Incorrect `CMD` or `ENTRYPOINT` in Dockerfile**: If the command to start the application inside the container is wrong.
    * **Insufficient Resources**: Your host system might be out of memory or CPU.

* **"Image not found"**:
    * If using `image: yourusername/mission-control:latest` in `docker-compose.yml`, ensure the image name and tag are correct and that the image has been pulled (`docker-compose pull mission-control`) or exists locally.
    * If using `build: .`, ensure a `Dockerfile` exists in the current directory.

## ⚙️ Configuration-Related Problems

* **Dashboard Loads but is Empty or Shows Errors**:
    * Likely an issue in `dashboard.yml`.
    * Check for YAML syntax errors.
    * Ensure widget `type` names are correct and match available built-in or custom widgets.
    * Verify all widget `id`s are unique.
    * Check that widget `options` are correct for each widget type (see [🧩 Widgets Reference](./05_widgets_reference/index.md)).
* **Application Not Using Settings from `settings.yml`**:
    * Ensure `settings.yml` is correctly named and located in `/app_data/config/`.
    * Check for YAML syntax errors in `settings.yml`.
    * Some settings (like `port`) might require an application restart to take effect.

## 🧩 Widget-Specific Issues

* **Widget Shows "Error Fetching Data," "API Unreachable," or "Invalid API Key"**:
    * **URL Incorrect**: The `url` option for the widget (e.g., to Glances, Sonarr, Pi-hole) is wrong, or the service is down.
    * **API Key Incorrect**: The `apiKey` or token is wrong, expired, or lacks permissions. Double-check it carefully.
    * **Network Accessibility**: The Mission Control backend container must be able to reach the target service's URL.
        * If both are Docker containers on the same custom Docker network, use the service name as the hostname (e.g., `http://sonarr:8989`).
        * If the service is on your host or LAN, use the host's IP address that's accessible from within the Docker container (often not `localhost` from the container's perspective; use the host's actual LAN IP or a Docker internal host like `host.docker.internal` if supported).
    * **Firewall**: A firewall on the host running the target service, or on your network, might be blocking access.
    * **Reverse Proxy Issues**: If the target service is behind a reverse proxy, ensure the proxy is configured correctly and the URL used by the widget is the correct one to reach the service *through* the proxy.
    * **CORS Issues (Less common if using backend proxy)**: If a widget tries to fetch data directly from the frontend and the target service doesn't have permissive CORS headers.
* **Widget Data is Stale or Not Updating**:
    * Check the widget's `refresh_interval` option (if available) or the application's default polling interval.
    * If using MQTT or WebSockets for real-time updates, check the connection to the MQTT broker or WebSocket server (see below).

## 📡 MQTT Integration Problems

* **Mission Control Cannot Connect to MQTT Broker**:
    * Verify `mqtt.broker_url` in `settings.yml` is correct.
    * Ensure `mqtt.username` and `mqtt.password` are correct if your broker uses authentication.
    * Check that the MQTT broker is running and accessible from the Mission Control backend container (and frontend if using WebSockets).
    * Broker logs are essential here.
* **MQTT Subscriber Widget Not Receiving Messages**:
    * Ensure the `topic` configured in the widget options is *exactly* the same (case-sensitive) as the topic messages are being published to.
    * Use a tool like MQTT Explorer to connect to your broker and verify messages are present on that topic.
    * Check QoS settings on both publisher and subscriber.

## 🎨 Theming & UI Glitches

* **Custom CSS Not Applying**:
    * Ensure your custom CSS file is named `custom.css` (or the name specified in `settings.yml`) and is located in `/app_data/config/`.
    * Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R).
    * Use browser developer tools to inspect elements and see if your custom styles are being overridden or not applied due to selector issues.
* **UI Elements Misaligned or Broken**:
    * Could be a bug in the application or an interaction with custom CSS.
    * Try commenting out your custom CSS temporarily to see if it resolves the issue.
    * Check the browser console for JavaScript errors.

## 🤗 Still Stuck? We're Here to Help!

If you've gone through these steps and are still facing issues:

1.  **Check the Project's Issue Tracker**: Someone else might have encountered the same problem (e.g., on GitHub Issues for the Mission Control project).
2.  **Search Online**: Use key error messages from logs to search for solutions.
3.  **Ask the Community**: If the project has a discussion forum, Discord server, or subreddit, ask for help there. Provide as much detail as possible:
    * What you're trying to do.
    * What you expected to happen.
    * What actually happened (including error messages from logs, browser console).
    * Relevant parts of your `docker-compose.yml`, `settings.yml`, and `dashboard.yml` (⚠️ **be sure to redact any sensitive information like API keys or passwords before sharing!**).
    * Steps you've already tried.

Good luck, and we hope you get your Mission Control running smoothly! 🚀
