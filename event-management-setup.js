require('dotenv').config()
const QueueConnection = require("./QueueConnection");
const { EventKeyConstants } = require("./pubSub");
const axios = require('axios');
const express = require('express');
var eventManagerInstance;
function getWebengageConfig() {
    const config = {
        default: {
            url: process.env.WEBENGAGE_URL,
            apiKey: String(process.env.WEBENGAGE_API_KEY),
        }
    };

    return config.default;
}
const EventTypes={
    MARKETING:"MARKETING",
}
console.log(EventKeyConstants,EventTypes.MARKETING)
const EventKeyMap ={
    'MANDATE_PRESENTATION': [EventTypes.MARKETING]
} 

async function webEngageUserEvent(eventData) {
    const wbConfig = getWebengageConfig();
    const eventUrl = `${wbConfig.url}/events`;
    const apiKey = wbConfig.apiKey;

    if (!eventUrl || !apiKey) {
        console.log('Cannot read WEBENGAGE config keys');
        return;
    }

    try {
        const userEventResponse = await axios.post(eventUrl, eventData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        });
        console.log("Web Engage User Event : ", { userId: eventData.userId, userEventsResponses: userEventResponse?.data });
    } catch (error) {
        console.log("Web Engage User Event : ", error, { userId: eventData.userId });
    }
}
class MarketingEvent {
    constructor() {
        this.observers = [];
    }
    subscribe(observer) {
        const observerExists = this.observers.includes(observer);
        if (!observerExists) {
            this.observers.push(observer);
        }
    }

    unsubscribe(observer) {
        // Implementation for unsubscribe, if needed
    }

    notify(eventKey, eventPayload) {
        for (const observer of this.observers) {
            observer.update(eventKey, eventPayload);
        }
    }
}
class WebengageEventsObserver {
    async update(eventKey, event) {
        console.log("Inside update of webengage having eventKey: ", { eventKey });
        delete event["eventTime"];
        if (true) {
            await this.handleUserEvent(event);
        } else {
            console.log("Unrecognized eventKey : ", { eventKey });
            return;
        }
    }
     async handleUserEvent(event) {
        try {
          console.log("Inside User-Event of webengage having eventKey : ",{event});
          await webEngageUserEvent(event);
        } catch (error) {
          console.log("Error in handleUserEvent : ",{event});
        }
      }
}


class EventManager {
    constructor() {
        this.marketingEvent = undefined;
    }
    async registerEvents() {
        this.marketingEvent = new MarketingEvent();
        const webEngageObserver = new WebengageEventsObserver();
    this.marketingEvent.subscribe(webEngageObserver);
    }
    processMarketing(eventKey, event) {
        console.log("Processing Marketing");
    
        if (this.marketingEvent) {
            this.marketingEvent.notify(eventKey, event);
        } else {
            console.log("EventManager did not initialize marketingReward");
        }
    }
    async processEventKey(eventKey, event) {
        console.log('Begin processing : ', { eventKey });
    
        if ( EventKeyMap.hasOwnProperty(eventKey)) {
            const eventTypes = EventKeyMap[eventKey];
            // await this.logEvents(eventKey, eventTypes, event);
    
            eventTypes.forEach((element) => {
                console.log('Element to be processed is : ', { element });
    
                switch (element) {
                    case EventTypes.MARKETING:
                        this.processMarketing(eventKey, event);
                        break;
                    default:
                        console.log('No method to process event type : ', { element });
                }
            });
        } else {
            console.log('No handler for event key : ', { eventKey });
        }
    }
    
}
const getEventManager = () => {
      eventManagerInstance = new EventManager();
    return eventManagerInstance;
  };
const eventManager = getEventManager();
console.log(`Initialised Singular instance for event manager`);
const queueSubscriber = new QueueConnection(eventManager);
console.log(`Initialised Queue connection`);
eventManager
  .registerEvents()
  .then(async () => {
    console.log(`Registered Events to Observers`);
    await queueSubscriber.init();
    console.log('Consumer queue connection initialised : ');
    await queueSubscriber.receiveMessage();
    console.log('Event management consumer is open to receive messages : ');
    const app = express();
    const port = 3001;
    app.use(express.json({ limit: "100mb" }));
    app.listen(port, () => {
      console.log(`⚡️[server]: server is running`);
    });
  })
  .catch((err) => {
    console.log("Cannot Connect server : ",err);
    queueSubscriber.close();
    console.log('Closed the All connections :');
  });

  module.exports=queueSubscriber