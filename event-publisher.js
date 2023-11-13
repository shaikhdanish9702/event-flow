const client = require('amqplib');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const queueSubscriber = require('./event-management-setup');
dayjs.extend(utc);

class QueueConnection {
    constructor() {
        this.channel = undefined;
    }

    async init(url) {
        const ZYPE_QUEUE_NAME = process.env.ZYPE_QUEUE_NAME || '';
        console.log(`Initialising Queue connection with ${url}`);
        const connection = await client.connect(url);
        console.log(`Connection created`);
        this.channel = await connection.createChannel();
        console.log(`Channel created`);
        await this.channel.assertQueue(ZYPE_QUEUE_NAME);
        console.log(`Asserting queue for ${ZYPE_QUEUE_NAME}`);
        return this.channel;
    }

    async sendMessage(userId, eventKey, eventPayload) {
        const ZYPE_QUEUE_NAME = process.env.ZYPE_QUEUE_NAME || '';
        let currTime = dayjs.utc().format('YYYY-MM-DDTHH:mm:SS+0530');
        console.log(`Current timestamp for ${eventKey} is ${currTime} for userid ${userId}`);
        if (this.channel) {
            const messageObject = {};
            messageObject["userId"] = userId;
            messageObject["eventName"] = eventKey;
            messageObject["eventData"] = eventPayload;
            messageObject["eventTime"] = currTime;
            console.log(`Message Object is ${JSON.stringify(messageObject)}`);
            this.channel.sendToQueue(ZYPE_QUEUE_NAME, Buffer.from(JSON.stringify(messageObject)));
            console.log(`Message Sent to ${ZYPE_QUEUE_NAME} for userid ${userId}`);
            console.log(Buffer.from(JSON.stringify(messageObject)));
            await queueSubscriber.receiveMessage(Buffer.from(JSON.stringify(messageObject)))
        } else {
            console.log(`Message channel was not initialised`);
        }
    }

    close() {
        console.log(`Closing channel`);
        this.channel?.close();
    }
}

const conn = new QueueConnection();

exports.sendMessage = async (userId, eventKey, eventPayload) => {
    await conn.sendMessage(userId, eventKey, eventPayload);
};

exports.init = async (url) => {
    await conn.init(url);
};

exports.closeConnection = () => {
    conn.close();
};

class EventKeyConstants {
    static MANDATE_PRESENTATION = "MANDATE_PRESENTATION" 
}

// Export EventKeyConstants if needed
exports.EventKeyConstants = EventKeyConstants;
