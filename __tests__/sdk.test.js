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

describe('Centricient SDK', () => {
  beforeEach(() => {
    window.parent.postMessage = jest.fn();
    const initEvent = new MessageEvent('message', {
      data: {
        eventType: 'init',
        data: {
          conversationId,
          conversation: testConversation,
          userId,
          tenantId,
          extensionId,
          extensionData: JSON.stringify({favCookie:'chocolate chip'}),
        },
      },
    });
    window.dispatchEvent(initEvent);
  });

  describe('data getters', () => {
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
  });

  describe('actions', () => {
    describe('before calling init', () => {
      it('does not allow sending messages to the messaging app', () => {
        const initError = 'You need to call `init` before posting messages to Centricient';
        expect(Centricient.prepareMessage).toThrowError(initError);
        expect(Centricient.sendOnClose).toThrowError(initError);
        expect(Centricient.updateContactDisplayName).toThrowError(initError);
      });
    });

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
