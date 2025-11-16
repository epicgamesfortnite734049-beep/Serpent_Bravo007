
import React, { useState, useEffect } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface CodeBlockProps {
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
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
