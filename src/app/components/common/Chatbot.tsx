import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Trash2, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRole, type UserRole } from '../../context/RoleContext';
import { useLanguage } from '../../context/LanguageContext';

interface ChatAction {
  label: string;
  path?: string;
  prompt?: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  actions?: ChatAction[];
}

const STORAGE_KEY = 'umedh-chatbot-state';
const SUPPORT_EVENT = 'umedh-open-support';

const createDefaultMessage = (userName?: string): Message => ({
  id: 1,
  text: userName
    ? `Hello ${userName}! I'm Umedh Assistant. I can help you navigate the platform, answer questions, and open the right section for you.`
    : "Hello! I'm Umedh Assistant. I can help you navigate the platform, answer questions, and open the right section for you.",
  sender: 'bot',
  timestamp: new Date().toISOString(),
  actions: [
    { label: 'Open dashboard', path: '/dashboard' },
    { label: 'Get support', prompt: 'Contact support' },
  ],
});

function getQuickReplies(role: UserRole) {
  switch (role) {
    case 'donor':
      return ['How to donate?', 'Sponsor a child', 'View reports', 'Need support'];
    case 'volunteer':
      return ['View events', 'My achievements', 'Need support'];
    case 'staff':
      return ['Manage needs', 'View events', 'Check beneficiaries', 'Need support'];
    case 'admin':
      return ['Review approvals', 'Manage campaigns', 'View users', 'Need support'];
    default:
      return ['How to donate?', 'View campaigns', 'Become a volunteer', 'Contact support'];
  }
}

function buildReply(message: string, role: UserRole, userName: string) {
  const normalized = message.toLowerCase().trim();

  if (normalized.includes('donat')) {
    return {
      text:
        role === 'donor'
          ? 'Open Donate from the sidebar, choose a campaign or general donation, select an amount, and complete the Razorpay payment.'
          : 'The donation flow lives in the Donate page. I can open it for donor users, or help you view campaign progress and donation activity.',
      actions: [
        { label: 'Open Donate', path: '/dashboard/donate' },
        { label: 'View Campaigns', path: role === 'admin' ? '/dashboard/campaigns' : '/dashboard/donate' },
      ],
    };
  }

  if (normalized.includes('sponsor')) {
    return {
      text:
        role === 'donor'
          ? 'Open Sponsorship to browse live profiles and create a monthly sponsorship. Your sponsorship history and receipts are saved in the platform.'
          : 'The sponsorship section shows active sponsorships and beneficiary support progress. I can open it for you.',
      actions: [
        { label: 'Open Sponsorship', path: '/dashboard/sponsorship' },
        { label: 'View Reports', path: '/dashboard/reports' },
      ],
    };
  }

  if (normalized.includes('report') || normalized.includes('receipt') || normalized.includes('80g')) {
    return {
      text:
        role === 'staff'
          ? 'Staff users do not have Reports access. If you need a donor receipt or admin export, ask the appropriate user role to generate it.'
          : 'Reports includes receipts, tax documents, and PDF exports. I can open it directly for you.',
      actions:
        role === 'staff'
          ? [{ label: 'Contact support', prompt: 'I need help with reports access' }]
          : [{ label: 'Open Reports', path: '/dashboard/reports' }],
    };
  }

  if (normalized.includes('wishlist') || normalized.includes('need')) {
    return {
      text:
        role === 'admin' || role === 'staff'
          ? 'Use Wishlist for viewing live needs and Manage Needs to add or maintain inventory and request items.'
          : 'Wishlist lets you support specific live needs item by item. You can browse items, add quantities, and checkout from there.',
      actions: [
        { label: 'Open Wishlist', path: '/dashboard/wishlist' },
        ...(role === 'admin' || role === 'staff'
          ? [{ label: 'Manage Needs', path: '/dashboard/wishlist-manage' }]
          : []),
      ],
    };
  }

  if (normalized.includes('campaign')) {
    return {
      text:
        role === 'admin'
          ? 'Campaigns lets you review active fundraising campaigns, inspect progress, and manage campaign records.'
          : 'Campaigns show active fundraisers, progress, and current goals. I can open the right campaign-related page for you.',
      actions: [
        { label: 'Open Campaigns', path: role === 'admin' ? '/dashboard/campaigns' : '/dashboard/donate' },
        ...(role === 'admin' ? [{ label: 'Review Approvals', path: '/dashboard/approvals' }] : []),
      ],
    };
  }

  if (normalized.includes('event') || normalized.includes('volunteer')) {
    return {
      text:
        role === 'volunteer'
          ? 'Your Events page shows live opportunities and registrations. You can use filters there to find the right events quickly.'
          : 'Events can be managed or joined from the Events page. I can take you there directly.',
      actions: [{ label: 'Open Events', path: '/dashboard/events' }],
    };
  }

  if (normalized.includes('approval') || normalized.includes('approve')) {
    return {
      text:
        role === 'admin'
          ? 'Approvals shows pending requests, event registrations, and approval actions in real time.'
          : 'Approvals are handled by admin users. I can open the approvals page if your role has access.',
      actions: [{ label: 'Open Approvals', path: '/dashboard/approvals' }],
    };
  }

  if (normalized.includes('user')) {
    return {
      text:
        role === 'admin'
          ? 'The Users section lets you review user roles, status, and admin actions from the table menu.'
          : 'User management is available to admin users. I can still help you find your own profile and account settings.',
      actions:
        role === 'admin'
          ? [{ label: 'Open Users', path: '/dashboard/admin' }]
          : [{ label: 'Open Dashboard', path: '/dashboard' }],
    };
  }

  if (normalized.includes('impact')) {
    return {
      text: 'The Impact page shows live donation, beneficiary, campaign, and quality metrics with period-based analytics.',
      actions: [{ label: 'Open Impact', path: '/dashboard/impact' }],
    };
  }

  if (normalized.includes('support') || normalized.includes('help') || normalized.includes('issue') || normalized.includes('problem')) {
    return {
      text: `I'm here to help${userName ? `, ${userName}` : ''}. Tell me the page name and what went wrong, and I’ll guide you step by step. For direct help, you can also contact contact@umedh.org or +91 98765 43210.`,
      actions: [
        { label: 'Share support issue', prompt: 'I need help with a page issue' },
        { label: 'Open dashboard', path: '/dashboard' },
      ],
    };
  }

  return {
    text:
      role === 'admin'
        ? 'I can help you review users, approvals, campaigns, needs, impact, and support issues. Ask for a task or tap one of the quick actions.'
        : role === 'donor'
          ? 'I can help you donate, sponsor, support wishlist items, open reports, or explain any page. Ask me naturally and I’ll guide you.'
          : 'I can help you navigate the platform, explain features, and open the right section for you.',
    actions: [
      { label: 'Open dashboard', path: '/dashboard' },
      { label: 'Get support', prompt: 'Contact support' },
    ],
  };
}

function loadStoredState(defaultMessage: Message) {
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
  const navigate = useNavigate();
  const location = useLocation();
  const { role, userName } = useRole();
  const { t } = useLanguage();
  const defaultMessage = useMemo(() => createDefaultMessage(userName), [userName]);
  const initialState = useMemo(() => loadStoredState(defaultMessage), [defaultMessage]);
  const [isOpen, setIsOpen] = useState(initialState.isOpen);
  const [messages, setMessages] = useState<Message[]>(initialState.messages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickRepliesDismissed, setQuickRepliesDismissed] = useState(initialState.quickRepliesDismissed);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const quickReplies = useMemo(() => getQuickReplies(role), [role]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

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
      const reply = buildReply(text, role, userName);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: reply.text,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        actions: reply.actions,
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

  const handleActionClick = (action: ChatAction) => {
    if (action.path) {
      if (location.pathname !== action.path) {
        navigate(action.path);
      }
      setIsOpen(false);
      return;
    }

    if (action.prompt) {
      appendConversation(action.prompt);
    }
  };

  const handleReset = () => {
    const nextDefaultMessage = createDefaultMessage(userName);
    setMessages([nextDefaultMessage]);
    setQuickRepliesDismissed(false);
    setInput('');
    setIsTyping(false);
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
                  <p className="text-xs text-white/80">{t('chat.status')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 1 && (
                  <button
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                    title={t('chat.clear')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20"
                  title={t('chat.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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
                    {message.sender === 'bot' && message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <button
                            key={`${message.id}-${action.label}`}
                            onClick={() => handleActionClick(action)}
                            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background"
                          >
                            {action.label}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
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
              <div ref={messagesEndRef} />
            </div>

            {showQuickReplies && (
              <div className="px-4 pb-4">
                <p className="mb-2 text-xs text-muted-foreground">{t('chat.quick_actions')}</p>
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
                  placeholder={t('chat.placeholder')}
                  className="flex-1 rounded-xl border border-transparent bg-muted/50 px-4 py-2 focus:border-primary focus:outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white disabled:cursor-not-allowed disabled:opacity-50"
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
