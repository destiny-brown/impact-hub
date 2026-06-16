import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "impact-hub",
  brokers: ["impact-hub-kafka-impact-hub.e.aivencloud.com:22479"],

  ssl: true,

  sasl: {
    mechanism: "plain",
    username: "avnadmin",
    password: "AVNS_YpfbuenZBJghMjR-GwX",
  },
});

const producer = kafka.producer();

export async function sendEvent(message: any) {
  try {
    await producer.connect();

    await producer.send({
      topic: "requests",
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    await producer.disconnect();

    console.log("Event sent:", message);
  } catch (error) {
    console.error("Kafka error:", error);
  }
}