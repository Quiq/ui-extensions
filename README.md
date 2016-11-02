Centricient Extension SDK
=========================

This is an SDK to simplify communications between the Centricient
messaging client and any extensions that are added to it.

An extension is just a webpage that can be loaded into an iframe in the
Centricient messaging client to add additional functionality. _This webpage must
also be hosted from a site using https._

## Usage

The SDK exports the `Centricient` object to the window of the browser.
Just include the SDK in a script tag before your code.

To send messages back to the Centricient client, you also need to call `init`
and pass the hostname of the page you're hosting the extension in.

```javascript
Centricient.init('https://mycompany.centricient.corp');
```

### Cache busting
Due to various problems across browsers with iframes, you will likely want to add this
code to your HTML page.
Without this code, you and your users will likely experience a significant delay 
before any page modifications are available.

```html
<head>
    <meta http-Equiv="Cache-Control" Content="no-cache" />
    <meta http-Equiv="Pragma" Content="no-cache" />
    <meta http-Equiv="Expires" Content="0" />
</head>
```

## Events

You can subscribe to events using the `on` method.

#### Syntax

```javascript
Centricient.on(eventName, handler);
```

The eventName is a string of the type of event to listen to. The handler
should be a function that accepts the event data as an argument.

#### Example

```javascript
Centricient.on('messageAdded', function(data) {
  console.log('Agent said ' + data.text);
});
```

### Available events

#### init

Called when the add-in first loads

Data:
- `conversationId` (string) - The id of the conversation
- `conversation` (object) - The conversation object


#### conversationAccepted

Called when the agent accepts a conversation

Data:
- `conversationId` (string) - The id of the conversation

#### messageAdded

Called when the agent sends a message to the customer

Data:
- `conversationId` (string) - The id of the conversation
- `text` (string) - The text of the message sent


#### messageReceived

Called when the customer sends a message to the agent

Data:
- `conversationId` (string) - The id of the conversation
- `message` (object) - The message object received by the agent


#### conversationStatusChanged

Called when the conversation is marked active or inactive

Data:
- `id` (string) - The id of the conversation
- `status` (string) - The new status: `'active'` or `'inactive'`


#### extensionDataChanged

Called when the extension data string changes

Data:
- `data` (string) - The new extension data value
- `conversationId` (string)- The id of the conversation
- `extensionId` (string)- The id of the extension


## Actions

You can dispatch actions in the Centricient client by calling methods on
`Centricient`.


### `prepareMessage(text)`

Prepares a message to send the customer, but doesn't send it

Arguments:
- `message` (string) - The message to send to the customer


## Data

You can get data for the context of the extension by using the getters
provided by `Centricient`. You can only read this data. The only way to
modify data is by using actions.

### Accessing conversation data

```javascript
var conversation = Centricient.getConversation();
```

#### Conversation object
- `id` (string) - The id of the conversation
- `owner` (string) - The id of the agent the conversation is assigned to
- `contact` (Contact?) - The contact data for the conversation (or `null` if conversation is a collaboration)
- `messages` (array<Message>) - The array of messages for the conversation
- `collaboration` (Conversation?) - The conversation object of the collaboration (or `null` if there isn't one)
- `metrics` (ConversationMetrics) - Some metrics for the conversation

#### Contact object
- `firstName` (string)
- `lastName` (string)
- `phoneNumber` (string) - If contact is using SMS
- `facebookId` (string) - If contact is using Facebook
- `externalId` (string) - If there is an integration with another CRM

#### Message object
- `id` (string) - The id of the message
- `text` (string) - The text of the message
- `timestamp` (number) - The timestamp of the message
- `author` (string) - The agentId (if sent by an agent) or whatever id is used for the channel the customer is using (i.e. phoneNumber or facebookId)
- `fromCustomer` (boolean) - If the message is from the customer or not
- `sourcePlatform` (string) - What platform the message was sent over (i.e. 'SMS', 'Facebook', 'Centricient')

#### ConversationMetrics
- `startTime` (number) - The timestamp for when the conversation was started
- `endTime` (number?) - The timestamp for when the conversation ended, or `null` if it hasn't yet

### Getting id's

You can also get the userId for the logged in agent, as well as the id for the
tenant (if your extension is for more than one company)

```javascript
var userId = Centricient.getUserId();
var tenantId = Centricient.getTenantId();
```

### Extension data

You can store a string of data on the conversation object which will be persisted
along with the conversation data. It must be stored as a string, but you can use
`JSON.stringify` and `JSON.parse` to store more complex data.

You can use `getExtensionData` to retrieve the current value of the data and
`setExtensionData` to update the value on the server. `setExtensionData` returns
a promise so that you can fire additional events after the request is successful,
or hook up any error handling if the save fails for some reason.

```javascript
// Get the current value of your extension data
var data = Centricient.getExtensionData();

var newData = { foo: 'bar' };

// Save the new data
Centricient.setExtensionData(JSON.stringify(newData))
  .then(function() {
    console.log('Data is saved');
  });
```

## Async data

You can fetch data for the addin by calling `fetchUsers` which is a
function that returns a promise. Eventually we'll be able to add more of
these.

```javascript
Centricient.fetchUsers().then(function(data) {
  // Do something with the users data
});
```
