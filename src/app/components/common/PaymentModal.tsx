import { useState } from 'react';
import { Modal } from './Modal';
import { motion } from 'motion/react';
import { CreditCard, Smartphone, Building2, Wallet, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  onSuccess: () => void;
  purpose: string;
}

export function PaymentModal({ isOpen, onClose, amount, onSuccess, purpose }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [processing, setProcessing] = useState(false);

  const upiApps = [
    { name: 'Google Pay', icon: '🔵', id: 'gpay' },
    { name: 'PhonePe', icon: '🟣', id: 'phonepe' },
    { name: 'Paytm', icon: '🔵', id: 'paytm' },
    { name: 'BHIM', icon: '🟢', id: 'bhim' },
  ];

  const organizationUPI = 'umedh@okaxis';

  const handlePayment = () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      toast.success('Payment successful!');
      onSuccess();
      onClose();
    }, 2000);
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(organizationUPI);
    toast.success('UPI ID copied to clipboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment" size="md">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white p-6 rounded-xl">
          <p className="text-sm opacity-90 mb-1">Amount to Pay</p>
          <p className="text-3xl font-bold">₹{parseInt(amount).toLocaleString()}</p>
          <p className="text-sm opacity-90 mt-2">{purpose}</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setPaymentMethod('upi')}
            className={`p-3 rounded-xl border-2 transition-all ${
              paymentMethod === 'upi'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Smartphone className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">UPI</p>
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-3 rounded-xl border-2 transition-all ${
              paymentMethod === 'card'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <CreditCard className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">Card</p>
          </button>
          <button
            onClick={() => setPaymentMethod('netbanking')}
            className={`p-3 rounded-xl border-2 transition-all ${
              paymentMethod === 'netbanking'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Building2 className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">Banking</p>
          </button>
          <button
            onClick={() => setPaymentMethod('wallet')}
            className={`p-3 rounded-xl border-2 transition-all ${
              paymentMethod === 'wallet'
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Wallet className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">Wallet</p>
          </button>
        </div>

        {paymentMethod === 'upi' && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Organization UPI ID</p>
                <button
                  onClick={copyUPI}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <p className="font-mono text-lg font-semibold text-center py-2 bg-background rounded-lg">
                {organizationUPI}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Pay using your UPI app</p>
              <div className="grid grid-cols-4 gap-3">
                {upiApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={handlePayment}
                    className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="text-3xl mb-1">{app.icon}</div>
                    <p className="text-xs">{app.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">OR</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Enter Your UPI ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePayment}
                  disabled={!upiId}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay
                </motion.button>
              </div>
            </div>

            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>

            {showQR && (
              <div className="bg-white p-6 rounded-xl flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center mb-3">
                  <div className="text-center text-gray-500">
                    <p className="text-4xl mb-2">📱</p>
                    <p className="text-xs">QR Code</p>
                    <p className="text-xs">Scan to Pay</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Scan using any UPI app</p>
              </div>
            )}
          </div>
        )}

        {paymentMethod === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white"
            >
              Pay ₹{parseInt(amount).toLocaleString()}
            </motion.button>
          </div>
        )}

        {paymentMethod === 'netbanking' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">Select Your Bank</label>
            <select className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Choose your bank</option>
              <option value="sbi">State Bank of India</option>
              <option value="hdfc">HDFC Bank</option>
              <option value="icici">ICICI Bank</option>
              <option value="axis">Axis Bank</option>
              <option value="pnb">Punjab National Bank</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white"
            >
              Proceed to Bank
            </motion.button>
          </div>
        )}

        {paymentMethod === 'wallet' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'].map((wallet) => (
                <button
                  key={wallet}
                  onClick={handlePayment}
                  className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <p className="font-medium">{wallet}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {processing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-2xl text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Processing Payment...</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
