import { useDispatch } from "react-redux";
import {
  createNewChat,
  addNewMessage,
  addMessages,
  addTypingMessage,
  replaceTypingMessage,
  setChats,
  setCurrentChatId,
  setLoading,
} from "../chat.slice";
import { initializeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages } from "../service/chat.api";

export const useChat = () => {
  const dispatch = useDispatch();

  const handleSendMessage = async ({ message, chatId }) => {
    dispatch(setLoading(true));

    // Create new chat if chatId null
    let chat_id = chatId;
    if (!chat_id) {
      const newId = "chat-" + Date.now();
      chat_id = newId;
      dispatch(createNewChat({ chatId: newId, title: "New Chat" }));
      dispatch(setCurrentChatId(newId));
    }

    dispatch(addNewMessage({ chatId: chat_id, content: message, role: "user" }));

    // Typing effect
    dispatch(addTypingMessage({ chatId: chat_id }));

    // Call backend API
    const data = await sendMessage({ message, chatId: chat_id });
    const { aiMessage } = data;

    // Replace typing with AI message
    setTimeout(() => {
      dispatch(replaceTypingMessage({ chatId: chat_id, content: aiMessage.content }));
    }, 800);

    dispatch(setLoading(false));
  };

  const handleGetChats = async () => {
    dispatch(setLoading(true));
    const data = await getChats();
    const { chats } = data;
    dispatch(
      setChats(
        chats.reduce((acc, chat) => {
          acc[chat._id] = {
            id: chat._id,
            title: chat.title,
            messages: [],
            lastUpdated: chat.updatedAt,
          };
          return acc;
        }, {})
      )
    );
    dispatch(setLoading(false));
  };

  const handleOpenChat = async (chatId) => {
    const data = await getMessages(chatId);
    const { messages } = data;
    const formatted = messages.map((msg) => ({ content: msg.content, role: msg.role }));
    dispatch(addMessages({ chatId, messages: formatted }));
    dispatch(setCurrentChatId(chatId));
  };

  return {
    initializeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChat,
  };
};
