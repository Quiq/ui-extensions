Quiq Extension SDK
=========================

[![Build Status](https://travis-ci.org/Quiq/ui-extensions.svg?branch=master)](https://travis-ci.org/Quiq/ui-extensions)

This is an SDK to simplify communications between the Quiq
messaging client and any extensions that are added to it.

An extension is just a webpage that can be loaded into an iframe in the
Quiq messaging client to add additional functionality. _This webpage must
also be hosted from a site using https._

## Usage

The SDK exports the `Quiq` object to the window of the browser.
Just include the SDK in a script tag before your code.

To send messages back to the Quiq client, you also need to call `init`
and pass the hostname of the page you're hosting the extension in.

```javascript
Quiq.init('https://mycompany.centricient.corp');
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
Quiq.on(eventName, handler);
```

The eventName is a string of the type of event to listen to. The handler
should be a function that accepts the event data as an argument.

#### Example

```javascript
Quiq.on('messageAdded', function(data) {
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

#### collaborationMessageReceived

Called when a collaborator sends a message in the collaboration

Data:
- `conversationId` (string) - The id of the service conversation
- `collaborationId` (string) - The id of the collaboration
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

You can dispatch actions in the Quiq client by calling methods on
`Quiq`.


### `prepareMessage(text, method? = 'replace')`

Prepares a message to send the customer, but doesn't send it

Arguments:
- `message` (string) - The message to send to the customer
- `method` ('replace' | 'append' | 'prepend') - Whether the text should replace the text in the textbox or be appended or prepended to it


### `sendOnClose(text)`

Sets a message to send as soon as the conversation is closed by the user.

Arguments:
- `message` (string) - The message to send to the customer

A couple notes
- The extension can only send one message at the end of the conversation. Calling this method more than once will change the message rather than queueing up new messages. If you call it with an empty string, it shoudn't send anything.
- The message will only be sent if the conversation is ended by the user clicking the End button while the extension is loaded. It won't send it if the conversation is closed from inactivity or if it's closed by an agent that doesn't have the extension.
- The message won't be sent if the conversation is marked as spam or if the user clicks End without ever responding
- The message also won't send in the "long goodbye" case (i.e. The conversation is closed and then the customer texts back something that the agent clicks end without responding to)


### `updateContactDisplayName(contact)`

Updates the name shown in the app for the contact of the conversation

Arguments:
- `contact` (Object: {firstName:string, lastName:string}) - An object containing the firstName and lastName of the contact


## Data

You can get data for the context of the extension by using the getters
provided by `Quiq`. You can only read this data. The only way to
modify data is by using actions.

### Accessing conversation data

```javascript
var conversation = Quiq.getConversation();
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
- `sourcePlatform` (string) - What platform the message was sent over (i.e. 'SMS', 'Facebook', 'Quiq')

#### ConversationMetrics
- `startTime` (number) - The timestamp for when the conversation was started
- `endTime` (number?) - The timestamp for when the conversation ended, or `null` if it hasn't yet

### Getting id's

You can also get the userId for the logged in agent, as well as the id for the
tenant (if your extension is for more than one company)

```javascript
var userId = Quiq.getUserId();
var tenantId = Quiq.getTenantId();
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
var data = Quiq.getExtensionData();

var newData = { foo: 'bar' };

// Save the new data
Quiq.setExtensionData(JSON.stringify(newData))
  .then(function() {
    console.log('Data is saved');
  });
```

## Async data

You can fetch data for the addin by calling `fetchUsers` which is a
function that returns a promise. Eventually we'll be able to add more of
these.

```javascript
Quiq.fetchUsers().then(function(data) {
  // Do something with the users data
});
```
