import { Kafka } from "kafkajs";

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

export async function sendEvent(message: any) {
  try {
    await connectProducer();

    await producer.send({
      topic: "requests",
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    console.log("Event sent:", message);
  } catch (error) {
    console.error("Kafka error:", error);
  }
}
