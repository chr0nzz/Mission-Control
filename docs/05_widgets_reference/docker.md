# Docker Containers Widget 🐳📋

**Purpose**: Displays a list of your Docker containers, their status (running, exited, etc.), and the image they are based on. Optionally allows basic actions like start/stop/restart if the secure Docker socket proxy is configured to permit these.

**⚠️ Security First!** This widget **MUST** communicate with Docker via a secure Docker socket proxy (e.g., `11notes/socket-proxy` or similar). Direct exposure of the host's Docker socket (`/var/run/docker.sock`) to the Mission Control application container is a major security risk.

---

## 🖼️ Preview

*(Imagine a screenshot of the Docker widget showing a list of containers with their names, status (e.g., green dot for running, red for exited), and image names. Optional start/stop buttons next to each.)*

+-------------------------------------------------+| Docker Containers 🐳                            |+-------------------------------------------------+| NAME                STATUS    IMAGE             || ------------------- --------- ----------------- || mission-control     🟢 Running your/mc:latest   || portainer           🟢 Running portainer/ce     || glances             🟡 Exited nicolargo/glances || my_web_app          🟢 Running nginx:alpine     ||   [▶️ Start] [⏹️ Stop] [🔄 Restart]             |+-------------------------------------------------+
---

## ⚙️ Configuration Options (`options` in `dashboard.yml`)

| Name                    | Type    | Description                                                                                                                                                           | Required | Default Value                 | Example                                    |
| ----------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- | ------------------------------------------ |
| `proxy_url`             | string  | The URL of your secure Docker socket proxy service (e.g., the internal Docker network address of the proxy container like `http://socket-proxy:2375`).                 | Yes      | N/A                           | `"http://docker-proxy.internal:2375"`      |
| `show_all_containers`   | boolean | If `true`, shows all containers. If `false`, shows only currently running containers.                                                                                 | No       | `false`                       | `true`                                     |
| `allow_actions`         | boolean | If `true`, enables Start/Stop/Restart buttons for containers. **This requires the Docker socket proxy to be configured to allow these specific write operations.** | No       | `false`                       | `true`                                     |
| `refresh_interval`      | number  | How often the widget should fetch updated container list and statuses, in seconds.                                                                                      | No       | `15`                          | `30`                                       |
| `display_fields`        | array of strings | (Optional) Which container fields to display (e.g., `['name', 'status', 'image', 'ports']`). Widget specific.                                                 | No       | `['name', 'status', 'image']` | `['name', 'status', 'image', 'created']`   |

---

## 🔌 Data Sources

* **Primary**: Secure Docker Socket Proxy (e.g., `11notes/socket-proxy`).
    * The Mission Control backend acts as a client to this proxy. The `proxy_url` tells the backend where to connect.
    * The backend then makes Docker Engine API calls *through* the proxy.
    * Example Docker Engine API endpoints used via the proxy:
        * `GET /containers/json` (to list containers, with filters like `status=running` if `show_all_containers: false`)
        * `POST /containers/{id}/start` (if `allow_actions: true` and proxy permits)
        * `POST /containers/{id}/stop` (if `allow_actions: true` and proxy permits)
        * `POST /containers/{id}/restart` (if `allow_actions: true` and proxy permits)

---

## 📡 MQTT Topics

* This widget typically polls the Docker socket proxy via the backend. It does not usually rely on MQTT for Docker status updates, though Docker events could theoretically be published to MQTT by another tool.

---

## 💡 Troubleshooting Tips

* **"Proxy Unreachable" / "Error Fetching Container List"**:
    * Ensure your Docker socket proxy service (e.g., `11notes/socket-proxy`) is running and correctly configured in your `docker-compose.yml`.
    * Verify the `proxy_url` in the widget options is correct and accessible from the Mission Control backend container (check Docker networking, service names).
    * Check the logs of the Docker socket proxy service for any errors. It might indicate permission issues with `/var/run/docker.sock` or misconfiguration of allowed API calls.
* **"Actions Failed" (Start/Stop/Restart)**:
    * If `allow_actions: true` but actions don't work, the Docker socket proxy is likely not configured to permit these `POST` requests to the relevant Docker API endpoints. The `11notes/socket-proxy` has environment variables to control which API calls (and HTTP methods like `POST`) are allowed. **This is a security feature of the proxy.** You must explicitly enable write operations on the proxy if you need them.
    * **⚠️ Be extremely cautious when enabling write access through the Docker socket proxy.** Only allow the specific actions needed.
* **Container List Incomplete or Incorrect**:
    * Check the `show_all_containers` option.
    * The data comes from the Docker Engine API via the proxy. If it seems wrong, use `docker ps -a` on the host to compare.
* **Security of the Docker Socket Proxy**:
    * Refer to the documentation for your chosen Docker socket proxy.
    * For `11notes/socket-proxy`, ensure the `user` in `docker-compose.yml` is correctly set to access the host's Docker socket (e.g., `user: "0:DOCKER_SOCKET_GID"`).
    * Mount `/var/run/docker.sock` as read-only (`:ro`) to the proxy container if you only need read access.
    * Use environment variables on the proxy to restrict API access as much as possible (e.g., deny all `POST`, `DELETE` requests if you only want to view containers).
