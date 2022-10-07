const axios = require('axios');

exports.handler = async function (context, event, callback) {
    // Create webhook response
    const response = new Twilio.Response();

    // Calendly Auth token
    const authToken = context.AUTH_TOKEN_1 + context.AUTH_TOKEN_2;

    // Extract Calendly event webhook payload from Twilio Event body 
    const eventWebhookPayload = event.payload;

    try {

        var options = {
            method: 'GET',
            url: eventWebhookPayload.event,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };
        // Get request to the event URI
        const getEventInformation = await axios.request(options);

        // Store event information in the variable
        const eventInformation = getEventInformation.data.resource;

        if (eventInformation.event_type === context.CALENDLY_EVENT_TYPE_URI) {
            // Initialise task Client
            const taskRouterClient = context.getTwilioClient().taskrouter.workspaces(context.TWILIO_TASKROUTER_WORKSPACE_SID);

            //Create new task in flex
            await taskRouterClient.tasks.create({
                attributes: JSON.stringify({
                    callerName: eventWebhookPayload.name,
                    callerEmail: eventWebhookPayload.email,
                    startTime: eventInformation.start_time,
                    name: eventInformation.location.location,
                    callbackNumber: eventInformation.location.location,
                    type: 'calendly',
                    questions: {
                        ...eventWebhookPayload.questions_and_answers
                    }
                })
            });

            response.setStatusCode(200);
            return callback(null, response);
        } else {
            response.setStatusCode(200);
            return callback("Error: This is not our event type", response);
        }
    } catch (error) {
        // Persist the error to your logs so you can debug
        console.error(error);
        return callback(null, error);
    }
}