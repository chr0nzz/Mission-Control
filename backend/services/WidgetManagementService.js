class WidgetManagementService {
  constructor() {
    console.log("WidgetManagementService initialized");
  }

  async addWidget(source, file, repoUrl) {
    console.log(`Adding widget from source: ${source}, file: ${file}, repoUrl: ${repoUrl}`);
  }

  async deleteWidget(widgetId) {
    console.log(`Deleting widget with id: ${widgetId}`);
  }

  async getWidgetMetadata(widgetId) {
    console.log(`Getting widget metadata for id: ${widgetId}`);
    return null;
  }

  async getAllWidgets() {
    console.log("Getting all widgets");
    return [];
  }
}

module.exports = WidgetManagementService;