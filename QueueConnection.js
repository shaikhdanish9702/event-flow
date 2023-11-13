const amqp = require("amqplib");

class QueueConnection {
    constructor(eventManager) {
        this.channel = undefined;
        this.queue = process.env.ZYPE_QUEUE_NAME;
        this.eventManager = eventManager;
    }

    async init() {
        try {
            const amqpUrl = process.env.AMQP_BASE_URL;
            if (amqpUrl) {
                const connection = await amqp.connect(amqpUrl);
                this.channel = await connection.createChannel();
                if (this.queue) {
                    await this.channel.assertQueue(this.queue);
                    return this.channel;
                } else {
                    console.log('AMQP_EVENTS_QUEUE_NAME not set : ');
                }
            } else {
                console.log('AMQP_BASE_URL not set : ');
            }
        } catch (err) {
            console.log("Unable to create amqp connection : ", err);
        }
    }

    consumer(msg) {
        return () => {
            if (msg) {
                try {
                    const t = msg.toString();
                    console.log("Received message : ", { t });
                    const event = JSON.parse(t);
                    console.log("Generated Event is : ", { event });
                    // Acknowledge the message
                    // this.channel?.ack(msg);
                    console.log("Event received : ", { event });
                    this.eventManager.processEventKey(event["eventName"], event);
                } catch (err) {
                    console.log("Could not parse message due to : ", err);
                }
            }else{
                console.log("no msg")
            }
        };
    }

    async receiveMessage(msg) {
        if (this.queue) {
            await this.channel?.consume(this.queue, this.consumer(msg)());
        } else {
            console.log('AMQP_EVENTS_QUEUE_NAME not set while fetching for consumer : ');
        }
    }

    close() {
        console.log('Closing queue connection : ');
        this.channel?.close();
    }
}

module.exports = QueueConnection;
