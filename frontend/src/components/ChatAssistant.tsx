import React, { useState, useRef, useEffect } from 'react';
import { askChat, fetchDocuments } from '../utils/api';
import type { ProcessedDocument } from '../utils/api';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  sourceIds?: number[];
  usedLlm?: boolean;
}

interface ChatAssistantProps {
  onInspectRecord: (record: ProcessedDocument) => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onInspectRecord }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your Intelligent Document Assistant. Ask me anything about the imported CSV files, resumes, or invoices. For example, 'Which invoices have an amount greater than 1000?' or 'Show me candidates with React experience.'",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts
  const suggestions = [
    'Summarize all records',
    'Find candidates with Python skills',
    'List all invoices over 500',
    'Which files are imported in the database?',
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageId = Math.random().toString(36).substring(2, 9);
    const newMessages: Message[] = [
      ...messages,
      { id: userMessageId, sender: 'user', text: textToSend },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await askChat(textToSend.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: res.answer,
          sourceIds: res.source_record_ids,
          usedLlm: res.used_llm,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Chat service returned an error');
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: `Sorry, I encountered an error while processing your request: ${err.message || 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Inspect the record matching a source ID
  const handleInspectSource = async (recordId: number) => {
    setIsLoading(true);
    try {
      const res = await fetchDocuments(undefined, undefined, 200, 0);
      const matched = res.items.find((item) => item.id === recordId);
      if (matched) {
        onInspectRecord(matched);
      } else {
        alert(`Document #${recordId} could not be located in the current repository view window.`);
      }
    } catch (err: any) {
      alert(`Error locating document details: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="view-panel chat-main-view">
      <div className="chat-container">
        {/* Messages History */}
        <div className="card chat-card-full">
          <div className="chat-history">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                <span className="chat-sender">{msg.sender === 'user' ? 'You' : 'Assistant'}</span>
                <div className="chat-body chat-body-prewrap">{msg.text}</div>

                {msg.sender === 'bot' && (msg.usedLlm !== undefined || (msg.sourceIds && msg.sourceIds.length > 0)) && (
                  <div className="chat-footer-info chat-reference-row">
                    {msg.usedLlm !== undefined && (
                      <span className={`badge ${msg.usedLlm ? 'badge-green' : 'badge-blue'}`}>
                        {msg.usedLlm ? 'AI LLM Mode' : 'Keyword Fallback'}
                      </span>
                    )}

                    {msg.sourceIds && msg.sourceIds.length > 0 && (
                      <>
                        <span>Referenced Documents:</span>
                        <div className="chat-sources-list">
                          {msg.sourceIds.map((id) => (
                            <span
                              key={id}
                              className="chat-source-tag"
                              onClick={() => handleInspectSource(id)}
                              title="Click to inspect this document details"
                            >
                              #{id}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-message bot chat-message-loading">
                <span className="chat-sender">Assistant</span>
                <div className="chat-loading-skeletons">
                  <div className="skeleton-text skeleton-full" />
                  <div className="skeleton-text skeleton-medium" />
                  <div className="skeleton-text skeleton-small" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions footer */}
          {!isLoading && messages.length === 1 && (
            <div className="chat-suggestions-footer">
              <div className="prompt-chips">
                {suggestions.map((s) => (
                  <span key={s} className="prompt-chip" onClick={() => sendMessage(s)}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <form onSubmit={handleFormSubmit} className="chat-input-area chat-input-form">
          <input
            type="text"
            className="input-field chat-input"
            placeholder="Type your question here (e.g. Show candidates who speak Bengali)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary chat-send-button"
            disabled={isLoading || !input.trim()}
          >
            Ask AI
          </button>
        </form>

        {error && (
          <div className="alert alert-error chat-error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
