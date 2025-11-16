import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Chat } from '@google/genai';

// --- TYPES ---
enum Role {
  USER = 'user',
  MODEL = 'model',
}

interface Message {
  role: Role;
  content: string;
}

// --- ICONS ---
const BotIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5 8.5C15.5 7.67157 14.8284 7 14 7C13.1716 7 12.5 7.67157 12.5 8.5C12.5 9.32843 13.1716 10 14 10C14.8284 10 15.5 9.32843 15.5 8.5Z" fill="currentColor"/>
    <path d="M8.5 8.5C8.5 7.67157 9.17157 7 10 7C10.8284 7 11.5 7.67157 11.5 8.5C11.5 9.32843 10.8284 10 10 10C9.17157 10 8.5 9.32843 8.5 8.5Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" fill="currentColor"/>
    <path d="M8 13.5C8 13.2239 8.22386 13 8.5 13H15.5C15.7761 13 16 13.2239 16 13.5V14.5C16 15.3284 15.3284 16 14.5 16H9.5C8.67157 16 8 15.3284 8 14.5V13.5Z" fill="currentColor"/>
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

// --- COMPONENTS ---

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
  };

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <div className="relative bg-[#0d1117] rounded-lg my-2">
      <div className="flex items-center justify-between px-4 py-2 bg-brand-muted rounded-t-lg">
        <span className="text-sm text-brand-subtle">Python</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-sm text-brand-subtle hover:text-brand-text transition-colors"
        >
          {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
          {isCopied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="language-python text-brand-text">{code}</code>
      </pre>
    </div>
  );
};

const ChatMessageContent: React.FC<{ content: string }> = ({ content }) => {
    const codeBlockRegex = /```python\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return (
        <div>
            {parts.map((part, index) => {
                if (index % 2 === 1) { // This is a code block
                    return <CodeBlock key={index} code={part.trim()} />;
                } else { // This is regular text
                    return part.split('\n').map((line, lineIndex) => (
                        <p key={`${index}-${lineIndex}`}>{line}</p>
                    ));
                }
            })}
        </div>
    );
};


const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isModel = message.role === Role.MODEL;

  return (
    <div className={`flex gap-4 p-4 ${isModel ? '' : 'justify-end'}`}>
      {isModel && (
        <div className="w-8 h-8 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center">
            <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xl lg:max-w-2xl xl:max-w-3xl rounded-lg px-4 py-3 ${
          isModel ? 'bg-brand-surface' : 'bg-brand-primary text-white'
        }`}
      >
        <ChatMessageContent content={message.content} />
      </div>
    </div>
  );
};

// --- MAIN APP ---
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

// --- RENDER APP ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);