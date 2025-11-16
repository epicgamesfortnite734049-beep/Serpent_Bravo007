
import React from 'react';
import { Message, Role } from '../types';
import { BotIcon } from './icons';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  message: Message;
}

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


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
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
