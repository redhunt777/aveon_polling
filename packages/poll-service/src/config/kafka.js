'use strict';
const { createProducer } = require('@aveon/shared');

let _publish = null;
let _producer = null;

const connectKafkaProducer = async () => {
    const { producer, publish } = await createProducer('poll-service');
    _producer = producer;
    _publish = publish;
};

const publishEvent = async (eventType, payload) => {
    if (!_publish) {
        console.warn('[Kafka] Producer not initialized — skipping event publish:', eventType);
        return;
    }
    await _publish(eventType, payload);
};

const disconnectKafkaProducer = async () => {
    if (_producer) await _producer.disconnect();
};

module.exports = { connectKafkaProducer, publishEvent, disconnectKafkaProducer };
