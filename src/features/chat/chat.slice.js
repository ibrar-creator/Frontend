import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: {},
    currentChatId: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    createNewChat: (state, action) => {
      const { chatId, title } = action.payload;
      if (!state.chats[chatId]) {
        state.chats[chatId] = {
          id: chatId,
          title,
          messages: [],
          lastUpdated: new Date().toISOString(),
        };
      }
    },
    addNewMessage: (state, action) => {
      const { chatId, content, role } = action.payload;
      if (!state.chats[chatId]) {
        state.chats[chatId] = {
          id: chatId,
          title: "New Chat",
          messages: [],
          lastUpdated: new Date().toISOString(),
        };
      }
      state.chats[chatId].messages.push({ content, role });
    },
    addMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      if (!state.chats[chatId]) return;
      state.chats[chatId].messages = messages;
    },
   deleteChat: (state, action) => {
  const { chatId } = action.payload;

  if (state.chats[chatId]) {
    delete state.chats[chatId];

    // Agar deleted chat current chat hai, set first available chat or null
    const remainingChats = Object.keys(state.chats);
    state.currentChatId =
      state.currentChatId === chatId ? (remainingChats[0] || null) : state.currentChatId;
  }
},


    addTypingMessage: (state, action) => {
      const { chatId } = action.payload;
      if (!state.chats[chatId]) return;
      state.chats[chatId].messages.push({
        content: "Typing...",
        role: "assistant",
        isTyping: true,
      });
    },
    replaceTypingMessage: (state, action) => {
      const { chatId, content } = action.payload;
      const messages = state.chats[chatId].messages;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.isTyping) {
        lastMsg.content = content;
        lastMsg.isTyping = false;
      }
    },
   addNewMessage: (state, action) => {
  const { chatId, content, role, type = "text" } = action.payload;

  if (!state.chats[chatId]) {
    state.chats[chatId] = {
      id: chatId,
      title: "New Chat",
      messages: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  state.chats[chatId].messages.push({ content, role, type });
},

    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setCurrentChatId: (state, action) => {
      state.currentChatId = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  createNewChat,
  addNewMessage,
  addMessages,
  addTypingMessage,
  replaceTypingMessage,
  setChats,
  setCurrentChatId,
  setLoading,
  setError,
  
  deleteChat, // ✅ added
} = chatSlice.actions;

export default chatSlice.reducer;
