require('../sdk'); // Add Centricient to window

const conversationId = 'conversationId';
const userId = 'userId';
const tenantId = 'tenantId';
const extensionId = 'extensionId';
const testHost = 'https://sdk-test.centricient.com';

const testContact = {
  externalId: '+14065551234',
  phoneNumber: '+14065551234',
  facebookId: null,
  firstName: 'Lauren',
  lastName: 'Ipsum',
};

const testConversation = {
  id: conversationId,
  owner: 'userId',
  status: 'active',
  contact: testContact,
  messages: [{
    id: 'message1',
    text: 'Marco',
    author: '+14065551234',
    timestamp: 1234567,
    sourcePlatform: 'SMS',
    fromCustomer: true,
  }, {
    id: 'message2',
    text: 'Polo',
    author: 'userId',
    timestamp: 1234569,
    sourcePlatform: 'SMS',
    fromCustomer: false,
  }],
  metrics: {startTime: 1234567, endTime: null},
};

const simulateEvent = (eventType, data) => {
  const testEvent = new MessageEvent('message', {
    data: { eventType, data },
  });
  window.dispatchEvent(testEvent);
};

describe('Centricient SDK', () => {
  beforeEach(() => {
    window.parent.postMessage = jest.fn();
    simulateEvent('init', {
      conversationId,
      conversation: testConversation,
      userId,
      tenantId,
      extensionId,
      extensionData: JSON.stringify({favCookie:'chocolate chip'}),
    });
  });

  describe('before calling init', () => {
    it('does not allow sending messages to the messaging app', () => {
      const initError = 'You need to call `init` before posting messages to Centricient';
      expect(Centricient.prepareMessage).toThrowError(initError);
      expect(Centricient.sendOnClose).toThrowError(initError);
      expect(Centricient.updateContactDisplayName).toThrowError(initError);
    });
  });


  describe('data', () => {
    describe('getConversation', () => {
      it('returns the conversation object', () => {
        expect(Centricient.getConversation()).toEqual(testConversation);
      });
    });

    describe('getUserId', () => {
      it('returns the userId', () => {
        expect(Centricient.getUserId()).toEqual(userId);
      });
    });

    describe('getTenantId', () => {
      it('returns the tenantId', () => {
        expect(Centricient.getTenantId()).toEqual(tenantId);
      });
    });

    describe('getExtensionData', () => {
      it('returns the extension data', () => {
        expect(JSON.parse(Centricient.getExtensionData())).toEqual({favCookie: 'chocolate chip'});
      });
    });

    describe('setExtensionData', () => {
      const successHandler = jest.fn();
      const errorHandler = jest.fn();
      const newData = JSON.stringify({favCookie: 'peanut butter'});

      beforeEach(() => {
        Centricient.init(testHost);
      });

      // requestCounter is at 0 here
      describe('when save is successful', () => {
        it('posts the message to the app and calls the success callback', () => {
          window.parent.postMessage.mockImplementationOnce(() => {
            simulateEvent('setExtensionData.success0', {data: newData});
          });

          return Centricient.setExtensionData(newData).then((data) => {
            expect(data).toEqual(newData);
            expect(window.parent.postMessage).toBeCalledWith({
              eventType: 'setExtensionData',
              data: {
                requestCounter: 0,
                conversationId,
                extensionId,
                data: newData,
              },
            }, testHost);
          });
        });
      });

      // requestCounter is at 1 here
      describe('when save is not successful', () => {
        it('posts the message to the app and calls the error callback', () => {
          window.parent.postMessage.mockImplementationOnce(() => {
            simulateEvent('setExtensionData.error1', 'uh oh!');
          });

          return Centricient.setExtensionData(newData).then(() => {}, (error) => {
            expect(error).toEqual('uh oh!');
            expect(window.parent.postMessage).toBeCalledWith({
              eventType: 'setExtensionData',
              data: {
                requestCounter: 1,
                conversationId,
                extensionId,
                data: newData,
              },
            }, testHost);
          });
        });
      });

      // TODO: Test request counter incrementing
    });
  });

  describe('events', () => {
    describe('init', () => {
      const initHandler = jest.fn();

      beforeEach(() => {
        Centricient.on('init', initHandler);
        simulateEvent('init', {
          conversationId,
          conversation: testConversation,
          userId,
          tenantId,
          extensionId,
          extensionData: JSON.stringify({favCookie:'chocolate chip'}),
        });
      });

      it('passes the conversation info', () => {
        expect(initHandler).toBeCalledWith(jasmine.objectContaining(
          {conversationId, conversation: testConversation}
        ));
      });
    });

    describe('conversationAccepted', () => {
      const handler = jest.fn();

      beforeEach(() => {
        Centricient.on('conversationAccepted', handler);
        simulateEvent('conversationAccepted', {conversationId});
      });

      it('passes the conversationId', () => {
        expect(handler).toBeCalledWith({conversationId});
      });
    });

    describe('messageAdded', () => {
      const handler = jest.fn();

      beforeEach(() => {
        Centricient.on('messageAdded', handler);
        simulateEvent('messageAdded', {conversationId, text: 'spongebob'});
      });

      it('passes the conversationId and message text', () => {
        expect(handler).toBeCalledWith({conversationId, text: 'spongebob'});
      });
    });

    describe('messageReceived', () => {
      const handler = jest.fn();
      const message = {
        id: 'message3',
        text: 'spongebob',
        author: '+14065551234',
        timestamp: 1234571,
        sourcePlatform: 'SMS',
        fromCustomer: true,
      };

      beforeEach(() => {
        Centricient.on('messageReceived', handler);
        simulateEvent('messageReceived', {conversationId, message});
      });

      it('passes the conversationId and message object', () => {
        expect(handler).toBeCalledWith({conversationId, message});
      });
    });

    describe('conversationStatusChanged', () => {
      const handler = jest.fn();

      beforeEach(() => {
        Centricient.on('conversationStatusChanged', handler);
        simulateEvent('conversationStatusChanged', {id: conversationId, status: 'inactive'});
      });

      it('passes the conversationId and new status', () => {
        expect(handler).toBeCalledWith({id: conversationId, status: 'inactive'});
      });
    });

    describe('extensionDataChanged', () => {
      const handler = jest.fn();
      const data = JSON.stringify({favCookie: 'peanut butter'});

      beforeEach(() => {
        Centricient.on('extensionDataChanged', handler);
        simulateEvent('extensionDataChanged', {conversationId, extensionId, data});
      });

      it('passes the conversationId, extensionId, and new data', () => {
        expect(handler).toBeCalledWith({conversationId, extensionId, data});
      });

      it('updates the value returned by getExtensionData', () => {
        expect(JSON.parse(Centricient.getExtensionData())).toEqual({favCookie: 'peanut butter'});
      });
    });
  });

  describe('actions', () => {
    describe('after calling init', () => {
      beforeEach(() => {
        Centricient.init(testHost);
      });

      describe('prepareMessage', () => {
        it('posts an event to message-ui', () => {
          Centricient.prepareMessage('hello', 'append');
          expect(window.parent.postMessage).toBeCalledWith({
            eventType: 'prepareMessage',
            data: { conversationId, message: 'hello', method: 'append' },
          }, testHost);
        });
      });

      describe('sendOnClose', () => {
        it('posts an event to message-ui', () => {
          Centricient.sendOnClose('hello');
          expect(window.parent.postMessage).toBeCalledWith({
            eventType: 'sendOnClose',
            data: { conversationId, message: 'hello' },
          }, testHost);
        });
      });

      describe('updateContactDisplayName', () => {
        it('posts an event to message-ui', () => {
          const newName = {firstName: 'Sherlock', lastName: 'Holmes'};
          Centricient.updateContactDisplayName({
            firstName: 'Sherlock',
            lastName: 'Holmes',
          });
          expect(window.parent.postMessage).toBeCalledWith({
            eventType: 'updateContactDisplayName',
            data: { conversationId, contact: newName },
          }, testHost);
        });
      });
    });
  });
});
