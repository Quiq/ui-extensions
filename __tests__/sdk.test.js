require('../sdk'); // Add Quiq to window

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

describe('Quiq SDK', () => {
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
      const initError = 'You need to call `init` before posting messages to Quiq';
      expect(Quiq.prepareMessage).toThrowError(initError);
      expect(Quiq.sendOnClose).toThrowError(initError);
      expect(Quiq.updateContactDisplayName).toThrowError(initError);
    });
  });


  describe('data', () => {
    describe('getConversation', () => {
      it('returns the conversation object', () => {
        expect(Quiq.getConversation()).toEqual(testConversation);
      });
    });

    describe('getUserId', () => {
      it('returns the userId', () => {
        expect(Quiq.getUserId()).toEqual(userId);
      });
    });

    describe('getTenantId', () => {
      it('returns the tenantId', () => {
        expect(Quiq.getTenantId()).toEqual(tenantId);
      });
    });

    describe('getExtensionData', () => {
      it('returns the extension data', () => {
        expect(JSON.parse(Quiq.getExtensionData())).toEqual({favCookie: 'chocolate chip'});
      });
    });

    describe('setExtensionData', () => {
      const successHandler = jest.fn();
      const errorHandler = jest.fn();
      const newData = JSON.stringify({favCookie: 'peanut butter'});

      beforeEach(() => {
        Quiq.init(testHost);
      });

      // requestCounter is at 0 here
      describe('when save is successful', () => {
        it('posts the message to the app and calls the success callback', () => {
          window.parent.postMessage.mockImplementationOnce(() => {
            simulateEvent('setExtensionData.success0', {data: newData});
          });

          return Quiq.setExtensionData(newData).then((data) => {
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

          return Quiq.setExtensionData(newData).then(() => {}, (error) => {
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
    });

    describe('fetchUsers', () => {
      const users = [
        {id: 'thing1', firstName: 'Thing', lastName: '1'},
        {id: 'thing2', firstName: 'Thing', lastName: '2'},
      ];

      it('posts the message to the app and calls the success callback', () => {
        window.parent.postMessage.mockImplementationOnce(() => {
          simulateEvent('fetchUsers.success2', {conversationId, data: users});
        });

        return Quiq.fetchUsers().then((data) => {
          expect(data).toEqual(users);
          expect(window.parent.postMessage).toBeCalledWith({
            eventType: 'fetchUsers',
            data: {
              requestCounter: 2,
              conversationId,
              extensionId,
              data: undefined,
            },
          }, testHost);
        });
      });
    });
  });

  describe('events', () => {
    describe('init', () => {
      const initHandler = jest.fn();

      beforeEach(() => {
        Quiq.on('init', initHandler);
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
        Quiq.on('conversationAccepted', handler);
        simulateEvent('conversationAccepted', {conversationId});
      });

      it('passes the conversationId', () => {
        expect(handler).toBeCalledWith({conversationId});
      });
    });

    describe('messageAdded', () => {
      const handler = jest.fn();

      beforeEach(() => {
        Quiq.on('messageAdded', handler);
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
        Quiq.on('messageReceived', handler);
        simulateEvent('messageReceived', {conversationId, message});
      });

      it('passes the conversationId and message object', () => {
        expect(handler).toBeCalledWith({conversationId, message});
      });
    });

    describe('collaborationMessageReceived', () => {
      const handler = jest.fn();
      const collaborationId = 'collaborationId';
      const message = {
        id: 'message3',
        text: 'spongebob',
        author: 'collaborator',
        timestamp: 1234571,
        sourcePlatform: 'Quiq',
        fromCustomer: false,
      };

      beforeEach(() => {
        Quiq.on('collaborationMessageReceived', handler);
        simulateEvent('collaborationMessageReceived', {conversationId, collaborationId, message});
      });

      it('passes the conversationId and message object', () => {
        expect(handler).toBeCalledWith({conversationId, collaborationId, message});
      });
    });

    describe('conversationStatusChanged', () => {
      const handler = jest.fn();

      beforeEach(() => {
        Quiq.on('conversationStatusChanged', handler);
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
        Quiq.on('extensionDataChanged', handler);
        simulateEvent('extensionDataChanged', {conversationId, extensionId, data});
      });

      it('passes the conversationId, extensionId, and new data', () => {
        expect(handler).toBeCalledWith({conversationId, extensionId, data});
      });

      it('updates the value returned by getExtensionData', () => {
        expect(JSON.parse(Quiq.getExtensionData())).toEqual({favCookie: 'peanut butter'});
      });
    });
  });

  describe('actions', () => {
    describe('after calling init', () => {
      beforeEach(() => {
        Quiq.init(testHost);
      });

      describe('prepareMessage', () => {
        it('posts an event to message-ui', () => {
          Quiq.prepareMessage('hello', 'append');
          expect(window.parent.postMessage).toBeCalledWith({
            eventType: 'prepareMessage',
            data: { conversationId, message: 'hello', method: 'append' },
          }, testHost);
        });
      });

      describe('sendOnClose', () => {
        it('posts an event to message-ui', () => {
          Quiq.sendOnClose('hello');
          expect(window.parent.postMessage).toBeCalledWith({
            eventType: 'sendOnClose',
            data: { conversationId, message: 'hello' },
          }, testHost);
        });
      });

      describe('updateContactDisplayName', () => {
        it('posts an event to message-ui', () => {
          const newName = {firstName: 'Sherlock', lastName: 'Holmes'};
          Quiq.updateContactDisplayName({
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
