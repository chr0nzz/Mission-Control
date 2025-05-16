const mqtt = require('mqtt');

class MqttService {
  constructor() {
    this.client = null;
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'; // Default MQTT broker URL
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl);

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker');
        resolve();
      });

      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
        reject(error);
      });
    });
  }

  async subscribe(topic, callback) {
    if (!this.client) {
      throw new Error('MQTT client not connected. Call connect() first.');
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Error subscribing to topic ${topic}:`, err);
      } else {
        console.log(`Subscribed to topic ${topic}`);
      }
    });

    this.client.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        callback(message.toString()); // Convert buffer to string
      }
    });
  }

  async publish(topic, message) {
    if (!this.client) {
      throw new Error('MQTT client not connected. Call connect() first.');
    }

    this.client.publish(topic, message, (err) => {
      if (err) {
        console.error(`Error publishing to topic ${topic}:`, err);
      } else {
        console.log(`Published to topic ${topic}: ${message}`);
      }
    });
  }

  async disconnect() {
    if (this.client) {
      this.client.end(() => {
        console.log('Disconnected from MQTT broker');
        this.client = null;
      });
    }
  }
}

module.exports = MqttService;