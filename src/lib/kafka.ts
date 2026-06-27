import { Kafka } from "kafkajs";

export const REQUESTS_TOPIC = "requests";

export type RequestEvent = {
  type: "REQUEST_CREATED" | "REQUEST_UPDATED";
  data: unknown;
};

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


const producer = kafka.producer();

let isConnected = false;

async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log("Kafka connected");
  }
}

export async function sendEvent(event: RequestEvent) {
  try {
    await connectProducer();

    await producer.send({
      topic: REQUESTS_TOPIC,
      messages: [
        {
          value: JSON.stringify(event),
        },
      ],
    });

    console.log("Event sent:", event);
  } catch (error) {
    console.error("Kafka error:", error);
  }
}
