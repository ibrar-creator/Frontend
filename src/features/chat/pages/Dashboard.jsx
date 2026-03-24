import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useSelector, useDispatch } from "react-redux";
import { useChat } from "../hooks/useChat";
import {
  createNewChat,
  setCurrentChatId,
  deleteChat,
  addNewMessage,
} from "../chat.slice";

const Dashboard = () => {
  const chat = useChat();
  const dispatch = useDispatch();

  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !selectedImage) return;

    let imageUrl = null;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("file", selectedImage);

      try {
        const res = await fetch("http://localhost:5000/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        imageUrl = data.url;
        setSelectedImage(null);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    if (imageUrl) {
      dispatch(
        addNewMessage({
          chatId: currentChatId,
          content: imageUrl,
          role: "user",
          type: "image",
        })
      );
    }

    if (chatInput.trim()) {
      chat.handleSendMessage({
        message: chatInput,
        chatId: currentChatId,
        type: "text",
      });
      setChatInput("");
    }
  };

  const handleNewChat = () => {
    const newId = "chat-" + Date.now();
    dispatch(createNewChat({ chatId: newId, title: "New Chat" }));
    dispatch(setCurrentChatId(newId));
    setSidebarOpen(false);
  };

  const handleDeleteChat = (chatId) => {
    dispatch(deleteChat({ chatId }));
  };

  const openChat = (chatId) => {
    dispatch(setCurrentChatId(chatId));
    if (!chats[chatId]?.messages || chats[chatId].messages.length === 0) {
      chat.handleOpenChat(chatId);
    }
    setSidebarOpen(false);
  };

  const filteredChats = Object.values(chats).filter((chatItem) =>
    chatItem.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen bg-[#0B0C10] text-white overflow-hidden">
      {/* Hamburger always fixed on top-left */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed z-50 top-2 left-2 md:hidden text-white text-2xl font-bold bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
      >
        ☰ 
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#11141f] p-4 transition-transform transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:flex md:flex-col`}
      >
        <h1 className="mb-4 text-2xl font-bold">Perplexity AI</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-2 px-3 py-2 rounded-xl bg-[#0B0C10] border border-gray-700 text-white outline-none focus:ring focus:ring-blue-500/30"
        />

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full mb-4 px-4 py-2 bg-blue-600 rounded-xl hover:bg-blue-700 font-semibold"
        >
          + New Chat
        </button>

        {/* Chat list */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filteredChats
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
            .map((chatItem) => (
              <div key={chatItem.id} className="flex items-center justify-between">
                <button
                  onClick={() => openChat(chatItem.id)}
                  className={`w-full text-left px-4 py-2 rounded-xl transition hover:bg-gray-700 ${
                    chatItem.id === currentChatId ? "bg-gray-700 font-semibold" : ""
                  }`}
                >
                  {chatItem.title}
                </button>
                <button
                  onClick={() => handleDeleteChat(chatItem.id)}
                  className="ml-2 text-red-500 font-bold hover:text-red-400"
                  title="Delete Chat"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex flex-1 flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentChatId &&
            chats[currentChatId]?.messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[60%] px-4 py-3 rounded-2xl text-sm md:text-base break-words ${
                  message.role === "user"
                    ? "ml-auto bg-[#1F2937] text-white rounded-br-none"
                    : "mr-auto bg-[#1e1f27] text-white/90 rounded-bl-none border border-gray-800"
                }`}
              >
                {message.type === "image" ? (
                  <img
                    src={message.content}
                    alt="uploaded"
                    className="rounded-lg max-w-full h-auto"
                  />
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
                      code: ({ children }) => (
                        <code className="rounded bg-gray-800 px-1 py-0.5">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="mb-2 overflow-x-auto rounded-xl bg-gray-900 p-3 text-white">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-800 bg-[#11141f]">
          <label
            htmlFor="fileUpload"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 cursor-pointer"
          >
            <span className="text-white text-2xl">+</span>
          </label>
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setSelectedImage(file);
            }}
          />
          {selectedImage && (
            <div className="relative">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="preview"
                className="w-12 h-12 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          )}

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-2xl border border-gray-700 bg-[#0B0C10] px-4 py-2 text-white outline-none focus:border-blue-500 focus:ring focus:ring-blue-500/30"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) handleSendMessage();
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!chatInput.trim() && !selectedImage}
            className="rounded-2xl bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
