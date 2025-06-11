import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const useChatStore = create((set, get) => ({
  /****************************************************************
   * STATE
   ****************************************************************/
  isConnected: false,
  customerChat: { sessionId: null, messages: [] },
  activeAdminChat: { sessionId: null, messages: [] },
  typingPeers: {},

  /****************************************************************
   * ACTIONS
   ****************************************************************/
  actions: {
    /**
     * Updates the connection status of the WebSocket.
     * @param {boolean} status - The connection status.
     */
    setConnected: (status) => set({ isConnected: status }),

    /**
     * Initializes or resumes a customer's chat session.
     * @param {object} sessionData - Contains sessionId and message history.
     */
    initializeCustomerSession: (sessionData) => {
      set({
        customerChat: {
          sessionId: sessionData.sessionId,
          messages: sessionData.history || [],
        },
      });
    },
    
    /**
     * Sets the currently active chat session for an admin user.
     * @param {object} chatData - Contains the sessionId and messages for the active chat.
     */
    setActiveAdminChat: (chatData) => {
      set({ activeAdminChat: chatData });
    },

    /**
     * Adds a final, server-confirmed message to the correct chat session,
     * replacing the optimistic message if one exists.
     * @param {object} message - The message object from the server.
     */
    addMessage: (message) => {
      // This ID is sent from the server to match the optimistic message
      const optimisticIdToRemove = message.optimisticId; 

      set(state => {
        const updateMessages = (chat) => {
          if (chat.sessionId && String(chat.sessionId) === String(message.session_id)) {
            // Filter out the optimistic message if its ID was provided
            const filteredMessages = optimisticIdToRemove 
              ? chat.messages.filter(m => m.id !== optimisticIdToRemove)
              : chat.messages;
              
            return { ...chat, messages: [...filteredMessages, message] };
          }
          return chat;
        };

        return {
          customerChat: updateMessages(state.customerChat),
          activeAdminChat: updateMessages(state.activeAdminChat),
        };
      });
    },

    /**
     * Adds a temporary "optimistic" message to the UI for immediate feedback.
     * @param {object} message - The message data being sent.
     * @returns {string} The temporary ID of the optimistic message.
     */
    addOptimisticMessage: (message) => {
      const optimisticMsg = {
          ...message,
          id: `local-${uuidv4()}`, // Generate a unique temporary ID
          created_at: new Date().toISOString(),
      };

      set(state => {
          const updateMessages = (chat) => {
              if (chat.sessionId && String(chat.sessionId) === String(optimisticMsg.session_id)) {
                  return { ...chat, messages: [...chat.messages, optimisticMsg] };
              }
              return chat;
          };
          return {
              customerChat: updateMessages(state.customerChat),
              activeAdminChat: updateMessages(state.activeAdminChat),
          };
      });

      return optimisticMsg.id; // Return temp ID to the mutation
    },
    
    /**
     * Removes an optimistic message if the server returns an error.
     * @param {string} optimisticId - The temporary ID of the message to remove.
     * @param {string} sessionId - The session the message belonged to.
     */
    revertOptimisticMessage: (optimisticId, sessionId) => {
        set(state => {
            const updateMessages = (chat) => {
                if (chat.sessionId === sessionId) {
                    return {
                        ...chat,
                        messages: chat.messages.filter(m => m.id !== optimisticId)
                    };
                }
                return chat;
            };
            return {
                customerChat: updateMessages(state.customerChat),
                activeAdminChat: updateMessages(state.activeAdminChat),
            };
        });
    },

    /**
     * Sets the typing status for a peer in a specific session.
     * @param {string} sessionId - The session ID where typing is occurring.
     * @param {string} userName - The name of the user who is typing.
     */
    setPeerTyping: (sessionId, userName) => {
      set(state => ({
        typingPeers: { ...state.typingPeers, [sessionId]: userName || true }
      }));
    },

    /**
     * Clears the typing status for a peer.
     * @param {string} sessionId - The session ID where typing has stopped.
     */
    clearPeerTyping: (sessionId) => {
      set(state => {
        const newPeers = { ...state.typingPeers };
        delete newPeers[sessionId];
        return { typingPeers: newPeers };
      });
    },
  },
}));
