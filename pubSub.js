const pub = require('./event-publisher')

const EventKeyConstants = pub.EventKeyConstants
const pubInit = async () => {
  try {
    console.log("connect",process.env.AMQP_BASE_URL)

    await pub.init(process.env.AMQP_BASE_URL)
    console.log("connect",process.env.AMQP_BASE_URL)

  } catch (e) {
   console.log(e,9)
  }
}
const pubSendMessage = async (customerId, eventKey, eventPayload) => {
  try {
    await pub.sendMessage(customerId, eventKey, eventPayload)
  } catch (e) {
    
  }
}
const pubCloseConn = async () => { pub.closeConnection() }
module.exports = { pubInit, pubSendMessage, pubCloseConn, EventKeyConstants }
