import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

const STORAGE_KEY = 'umedh-chatbot-state';
const SUPPORT_EVENT = 'umedh-open-support';

const defaultMessage: Message = {
  id: 1,
  text: "Hello! I'm Umedh Assistant. How can I help you today?",
  sender: 'bot',
  timestamp: new Date().toISOString(),
};

const quickReplies = [
  'How to donate?',
  'Become a volunteer',
  'Sponsor a child',
  'View campaigns',
  'Contact support',
];

const responses: Record<string, string> = {
  'how to donate': 'Open Donate from the sidebar, choose a campaign or general donation, select amount and payment method, then complete the contribution.',
  'become a volunteer': 'Open the Volunteer section to see live opportunities. You can register there and our team will review your availability and skills.',
  'sponsor a child': 'Open Sponsorship to browse available beneficiary profiles. Choose one and confirm the monthly sponsorship to create a live record in Firebase.',
  'view campaigns': 'Open Campaigns to see active fundraisers, live progress, and campaign details before donating.',
  'contact support': 'You can use this chat for quick help, or contact the support team at contact@umedh.org and +91 98765 43210 between 9 AM and 6 PM IST.',
  support: 'Support is here. Share the issue you are facing and include the page name if possible, and we will guide you step by step.',
  default:
    "I'm here to help with donations, volunteering, sponsorships, reports, wishlist items, and support questions. Tell me what you need.",
};

function getBotReply(message: string) {
  const normalized = message.toLowerCase();
  const matchedKey = Object.keys(responses).find(
    (key) => key !== 'default' && normalized.includes(key)
  );

  return matchedKey ? responses[matchedKey] : responses.default;
}

function loadStoredState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      isOpen: false,
      messages: [defaultMessage],
      quickRepliesDismissed: false,
    };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      isOpen: Boolean(parsed.isOpen),
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0 ? parsed.messages : [defaultMessage],
      quickRepliesDismissed: Boolean(parsed.quickRepliesDismissed),
    };
  } catch (error) {
    console.error('Failed to restore chatbot state:', error);
    return {
      isOpen: false,
      messages: [defaultMessage],
      quickRepliesDismissed: false,
    };
  }
}

export function Chatbot() {
  const initialState = useMemo(() => loadStoredState(), []);
  const [isOpen, setIsOpen] = useState(initialState.isOpen);
  const [messages, setMessages] = useState<Message[]>(initialState.messages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickRepliesDismissed, setQuickRepliesDismissed] = useState(initialState.quickRepliesDismissed);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isOpen,
        messages,
        quickRepliesDismissed,
      })
    );
  }, [isOpen, messages, quickRepliesDismissed]);

  const hasUserMessages = messages.some((message) => message.sender === 'user');
  const showQuickReplies = !quickRepliesDismissed && !hasUserMessages;

  const appendConversation = (text: string) => {
    if (!text.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setQuickRepliesDismissed(true);
    setIsTyping(true);

    window.setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        text: getBotReply(text),
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages((current) => [...current, botMessage]);
      setIsTyping(false);
    }, 700);
  };

  useEffect(() => {
    const handleSupportOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
      const prompt = customEvent.detail?.prompt || 'Contact support';

      setIsOpen(true);
      appendConversation(prompt);
    };

    window.addEventListener(SUPPORT_EVENT, handleSupportOpen as EventListener);

    return () => {
      window.removeEventListener(SUPPORT_EVENT, handleSupportOpen as EventListener);
    };
  }, []);

  const handleSend = () => {
    const message = input.trim();
    if (!message) {
      return;
    }

    setInput('');
    appendConversation(message);
  };

  const handleQuickReply = (reply: string) => {
    appendConversation(reply);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-48px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Umedh Assistant</h3>
                  <p className="text-xs text-white/80">Online • Responds instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-96 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((index) => (
                        <motion.div
                          key={index}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: index * 0.2 }}
                          className="h-2 w-2 rounded-full bg-foreground/50"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {showQuickReplies && (
              <div className="px-4 pb-4">
                <p className="mb-2 text-xs text-muted-foreground">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <motion.button
                      key={reply}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickReply(reply)}
                      className="rounded-full bg-muted px-3 py-1.5 text-xs transition-colors hover:bg-muted/80"
                    >
                      {reply}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border border-transparent bg-muted/50 px-4 py-2 focus:border-primary focus:outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white"
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white shadow-2xl"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!isOpen && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-background bg-green-500" />
        )}
      </motion.button>
    </>
  );
}
