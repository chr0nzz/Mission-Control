# ✨ 01: Getting Started with Mission Control

Welcome aboard, Commander! 🧑‍🚀 This guide will help you understand what Mission Control is all about and what you'll need to get it up and running.

## 🚀 What is Mission Control?

Mission Control is a self-hostable dashboard application designed specifically for homelab enthusiasts and anyone running multiple self-hosted services. Its primary goal is to provide a single, elegant interface where you can:

* 👀 **Monitor** the status and key metrics of your services.
* 📊 **Visualize** data from various sources in a unified view.
* ⚙️ **Customize** your dashboard layout and content to perfectly match your needs.
* ⏱️ **Save time** by having all essential information readily available at a glance.

Think of it as your personal command center for your digital services!

## 🧠 Core Philosophy

Mission Control is built with a few key principles in mind:

* 🏡 **Local-First**: Designed for your local network. Your data stays with you.
* 🔒 **User-Owned Data**: Configuration is managed through YAML files that you control, making backups and versioning straightforward.
* 🎨 **High Customizability**: From the widgets displayed to the overall theme, make it your own.
* 🧩 **Extensibility**: A flexible widget system allows for the integration of new services and custom displays.
* 💡 **Simplicity**: Easy to deploy with Docker and configure with human-readable YAML.

## 🎯 Intended Use Cases

Mission Control is perfect for:

* Monitoring system resources (CPU, RAM, disk, network) of your servers using tools like Glances.
* Keeping an eye on your media ecosystem (Sonarr, Radarr, Plex/Tautulli).
* Tracking download client activity (qBittorrent).
* Checking the status of your network ad-blocker (Pi-hole).
* Overseeing the uptime of your services (Uptime Kuma).
* Displaying environmental data (weather, sensor readings via MQTT).
* Providing quick access to frequently needed information (date/time, custom MQTT messages).
* Managing Docker containers (via a secure proxy).
* Integrating with Home Assistant to display entity states.
* And much more, especially with custom widgets!

## ✅ Prerequisites

Before you can launch Mission Control, you'll need a few things set up on your host system (e.g., your server, Raspberry Pi, or desktop):

1.  **Docker**: Mission Control is distributed as a Docker image. You'll need Docker installed and running.
    * [Install Docker Engine](https://docs.docker.com/engine/install/)
2.  **Docker Compose**: For easy management of the Mission Control container and its configuration.
    * [Install Docker Compose](https://docs.docker.com/compose/install/)
3.  **A Host System**: Any machine that can run Docker (Linux, macOS, Windows with WSL2).
4.  **Basic Command Line Familiarity**: You'll need to run a few commands in your terminal.

With these prerequisites met, you're ready to proceed to the [🛠️ Installation Guide](./02_installation.md)!
