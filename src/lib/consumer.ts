import "dotenv/config";
import { Kafka } from "kafkajs";
import { REQUESTS_TOPIC, type RequestEvent } from "./kafka";

const kafka = new Kafka({
  clientId: "impact-hub",
  brokers: [process.env.KAFKA_BROKER!],
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  },
});

const consumer = kafka.consumer({ groupId: "analytics-group" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: REQUESTS_TOPIC });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      const event = JSON.parse(message.value.toString()) as RequestEvent;

      console.log("EVENT LOG:", event);

      if (event.type === "REQUEST_CREATED") {
        console.log("New request created");
      }

      if (event.type === "REQUEST_UPDATED") {
        console.log("Request updated");
      }
    },
  });
}

run().catch((error) => {
  console.error("Kafka consumer error:", error);
  process.exit(1);
});