'use strict';
const { Kafka, logLevel } = require('kafkajs');

/**
 * Create a configured KafkaJS instance.
 * @param {string} clientId - Unique identifier for this client (e.g. 'auth-service')
 * @returns {Kafka}
 */
const createKafkaClient = (clientId) => {
    const broker = process.env.KAFKA_BROKER || 'localhost:29092';
    return new Kafka({
        clientId,
        brokers: [broker],
        logLevel: logLevel.WARN,
        retry: {
            initialRetryTime: 300,
            retries: 10,
        },
    });
};

/**
 * Create and connect a Kafka producer.
 * @param {string} clientId
 * @returns {{ producer, publish }}
 */
const createProducer = async (clientId) => {
    const kafka = createKafkaClient(clientId);
    const producer = kafka.producer();
    await producer.connect();
    console.log(`[Kafka] Producer connected (clientId: ${clientId})`);

    /**
     * Publish an event to the aveon.events topic.
     * @param {string} eventType
     * @param {object} payload
     */
    const publish = async (eventType, payload) => {
        const message = {
            type: eventType,
            timestamp: new Date().toISOString(),
            ...payload,
        };
        await producer.send({
            topic: 'aveon.events',
            messages: [{ key: eventType, value: JSON.stringify(message) }],
        });
        console.log(`[Kafka] Published event: ${eventType}`);
    };

    return { producer, publish };
};

/**
 * Create and subscribe a Kafka consumer.
 * @param {string} clientId
 * @param {string} groupId  - Consumer group ID
 * @returns {import('kafkajs').Consumer}
 */
const createConsumer = async (clientId, groupId) => {
    const kafka = createKafkaClient(clientId);
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    console.log(`[Kafka] Consumer connected (clientId: ${clientId}, groupId: ${groupId})`);
    return consumer;
};

module.exports = { createKafkaClient, createProducer, createConsumer };
