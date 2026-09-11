'use strict';
const { createProducer } = require('@aveon/shared');

let _publish = null;
let _producer = null;

/**
 * Connect the Kafka producer. Call once on service startup.
 */
const connectKafkaProducer = async () => {
    const { producer, publish } = await createProducer('auth-service');
    _producer = producer;
    _publish = publish;
};

/**
 * Publish an event to the aveon.events Kafka topic.
 * @param {string} eventType
 * @param {object} payload
 */
const publishEvent = async (eventType, payload) => {
    if (!_publish) {
        console.warn('[Kafka] Producer not initialized — skipping event publish:', eventType);
        return;
    }
    await _publish(eventType, payload);
};

/**
 * Gracefully disconnect the producer.
 */
const disconnectKafkaProducer = async () => {
    if (_producer) await _producer.disconnect();
};

module.exports = { connectKafkaProducer, publishEvent, disconnectKafkaProducer };
