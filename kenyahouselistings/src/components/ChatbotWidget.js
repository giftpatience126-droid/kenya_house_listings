import { useEffect, useMemo, useRef, useState } from "react";
import { getChatbotReply } from "../utils/chatbot";
import "./ChatbotWidget.css";

function ChatbotWidget({ listings = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "I can suggest homes, hotels, restaurants, or airbnbs based on your budget and location."
    }
  ]);
  const messagesRef = useRef(null);

  const quickPrompts = useMemo(
    () => [
      "Show me an airbnb in Nyali",
      "Find a home under 30000",
      "I need a hotel in Nairobi",
      "Suggest a restaurant in Kisumu"
    ],
    []
  );

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isOpen]);

  const submitPrompt = (prompt) => {
    if (!prompt.trim()) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: prompt
    };

    const result = getChatbotReply(prompt, listings);
    const assistantMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      text: result.reply,
      suggestions: result.suggestions
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setIsOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitPrompt(input);
  };

  const sendPrompt = (prompt) => {
    submitPrompt(prompt);
  };

  return (
    <div className={`chatbot-widget${isOpen ? " is-open" : ""}`}>
      {isOpen && (
        <div className="chatbot-widget__panel">
          <div className="chatbot-widget__header">
            <div>
              <strong>Marketplace assistant</strong>
              <p>Suggestion engine with shortlist recommendations</p>
            </div>
            <button
              type="button"
              className="chatbot-widget__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close smart assistant"
            >
              x
            </button>
          </div>

          <div ref={messagesRef} className="chatbot-widget__messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-widget__message chatbot-widget__message--${message.role}`}
              >
                <p>{message.text}</p>

                {message.suggestions?.length > 0 && (
                  <div className="chatbot-widget__suggestions">
                    {message.suggestions.map((listing) => (
                      <span key={listing.id}>
                        {listing.title} - {listing.location}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chatbot-widget__quick-prompts">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form className="chatbot-widget__form" onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask for a category, place, or budget"
            />
            <button type="submit">Ask</button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chatbot-widget__toggle"
        onClick={() => setIsOpen((current) => !current)}
      >
        Smart assistant
      </button>
    </div>
  );
}

export default ChatbotWidget;
