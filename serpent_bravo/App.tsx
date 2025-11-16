
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, Role } from './types';
import { ChatMessage } from './components/ChatMessage';
import { SendIcon } from './components/icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        // FIX: The API key must be obtained from `process.env.API_KEY` per the guidelines.
        // This also resolves the `import.meta.env` TypeScript error.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: "You are Serpent_Bravo, a world-class Python programming expert chatbot created by Arsh Kumar Gupta. You specialize in teaching beginners. Your goal is to provide the shortest, simplest, and most efficient Python code to solve the user's request. First, provide the Python code block. Then, immediately after the code block, provide a brief, easy-to-understand explanation of the code's logic, tailored for a beginner. The response must always contain a Python code block followed by its explanation.",
          },
        });
      } catch (e) {
        if (e instanceof Error) {
            setError(`Failed to initialize chat: ${e.message}`);
        } else {
            setError("An unknown error occurred during chat initialization.");
        }
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { role: Role.USER, content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: inputValue });
      
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: Role.MODEL, content: '...' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Error generating response: ${errorMessage}`);
        setMessages((prev) => prev.slice(0, -1)); // Remove the placeholder
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text font-sans">
      <header className="grid grid-cols-3 items-center p-4 border-b border-brand-muted shadow-md">
        <div className="justify-self-start">
            <div className="text-xs text-brand-subtle">created by</div>
            <div className="text-base font-semibold">Arsh Kumar Gupta</div>
        </div>
        <h1 className="text-xl font-bold text-center col-start-2">Serpent_Bravo</h1>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-brand-subtle">
                <div className="text-center max-w-lg">
                    <h2 className="text-2xl font-semibold">Welcome to Serpent_Bravo!</h2>
                    <p className="mt-2">I am a Python coding assistant created by Arsh Kumar Gupta.</p>
                    <p className="mt-1">My purpose is to provide you with simple, efficient Python code and explain how it works in a beginner-friendly way.</p>
                    <p className="text-sm mt-4">Try asking for something like "a function to reverse a string" or "binary search implementation".</p>
                </div>
            </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </main>

      <footer className="p-4 border-t border-brand-muted">
        {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
        <div className="max-w-3xl mx-auto flex items-center gap-4 bg-brand-surface rounded-xl p-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a Python coding prompt..."
            className="flex-1 bg-transparent resize-none focus:outline-none p-2 placeholder-brand-subtle"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-brand-primary p-2 rounded-lg text-white disabled:bg-brand-muted disabled:cursor-not-allowed hover:bg-brand-secondary transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
