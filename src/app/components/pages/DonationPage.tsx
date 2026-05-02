import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Building, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { useLanguage } from '../../context/LanguageContext';
import { createDonation } from '../../services/donations';
import { subscribeToCampaigns, type CampaignRecord } from '../../services/campaigns';

let razorpayScriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export function DonationPage() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'netbanking'>('netbanking');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const parsedUser = savedUser ? JSON.parse(savedUser) : null;

  const presetAmounts = [100, 500, 1000, 2500, 5000, 10000];

  useEffect(() => {
    return subscribeToCampaigns((items) => {
      setCampaigns(items);
      const requestedCampaignId = searchParams.get('campaign');
      const matchedCampaign = items.find((campaign) => campaign.id === requestedCampaignId);
      setSelectedCampaign((current) => current || matchedCampaign?.id || items[0]?.id || '');
    });
  }, [searchParams]);

  const currentAmount = useMemo(
    () => (Number.isFinite(selectedAmount) && selectedAmount > 0 ? selectedAmount : 0),
    [selectedAmount]
  );

  const selectedCampaignRecord = campaigns.find((campaign) => campaign.id === selectedCampaign);
  const canDonate = role === 'donor';

  const getDisplayProgress = (campaign: CampaignRecord) => {
    const rawProgress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;
    const width = rawProgress > 0 ? Math.max(rawProgress, 2) : 0;
    const label =
      rawProgress > 0 && rawProgress < 1 ? `${rawProgress.toFixed(1)}%` : `${Math.round(rawProgress)}%`;

    return {
      rawProgress,
      width: Math.min(width, 100),
      label,
    };
  };

  const getImpactMessage = (amt: number) => {
    if (amt >= 5000) return `₹${amt.toLocaleString()} can support a high-priority need this month`;
    if (amt >= 2500) return `₹${amt.toLocaleString()} can cover learning or nutrition support`;
    if (amt >= 1000) return `₹${amt.toLocaleString()} can help fund daily essentials`;
    if (amt >= 500) return `₹${amt.toLocaleString()} can contribute to one beneficiary's weekly support`;
    return `₹${amt.toLocaleString()} contributes to our mission`;
  };

  const createRazorpayOrder = async () => {
    const response = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(currentAmount * 100),
        currency: 'INR',
        receipt: `donation_${Date.now()}`,
        notes: {
          campaignId: selectedCampaignRecord?.id || '',
          campaign: selectedCampaignRecord?.title || 'General Donation',
          donorEmail: parsedUser?.email || localStorage.getItem('userEmail') || '',
          donationType,
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.message || 'Unable to create Razorpay order.');
    }

    return payload as { id: string; amount: number; currency: string };
  };

  const verifyRazorpayPayment = async (payment: RazorpayPaymentSuccessResponse) => {
    const response = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment),
    });

    const payload = await response.json();

    if (!response.ok || !payload?.verified) {
      throw new Error(payload?.message || 'Payment verification failed.');
    }
  };

  const handleDonate = async () => {
    if (!canDonate) {
      toast.error('Only donor accounts can complete donations.');
      return;
    }

    if (!currentAmount) {
      toast.error('Please enter a valid donation amount.');
      return;
    }

    if (!razorpayKeyId) {
      toast.error('Razorpay key is missing. Add your test key ID to the environment first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isCheckoutReady = await loadRazorpayScript();

      if (!isCheckoutReady || !window.Razorpay) {
        throw new Error('Razorpay checkout could not be loaded.');
      }

      const order = await createRazorpayOrder();

      const methodPreference = {
        upi: false,
        card: false,
        netbanking: true,
        wallet: false,
        emi: false,
        paylater: false,
      };

      const checkout = new window.Razorpay({
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'Umedh Foundation',
        description: `${donationType === 'monthly' ? 'Monthly' : 'One-time'} donation${selectedCampaignRecord ? ` for ${selectedCampaignRecord.title}` : ''}`,
        prefill: {
          name: parsedUser?.name || localStorage.getItem('userName') || '',
          email: parsedUser?.email || localStorage.getItem('userEmail') || '',
        },
        notes: {
          campaign: selectedCampaignRecord?.title || 'General Donation',
          donorRole: role,
        },
        theme: {
          color: '#FF6B35',
        },
        method: methodPreference,
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            toast.message('Razorpay checkout was closed before payment completed.');
          },
        },
        handler: async (payment) => {
          try {
            await verifyRazorpayPayment(payment);

            await createDonation({
              amount: currentAmount.toString(),
              category: selectedCampaignRecord?.category || 'General',
              paymentMethod,
              tax80G: true,
              campaign: selectedCampaignRecord?.title || 'General Donation',
              campaignId: selectedCampaignRecord?.id || '',
              isRecurring: donationType === 'monthly',
              frequency: donationType === 'monthly' ? 'monthly' : 'one-time',
              message: '',
              isAnonymous: false,
              paymentGateway: 'razorpay',
              paymentId: payment.razorpay_payment_id,
              paymentOrderId: payment.razorpay_order_id,
              paymentSignature: payment.razorpay_signature,
            });

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FF6B35', '#6C5CE7', '#FFD93D'],
            });
            setShowSuccess(true);
            toast.success('Payment completed through Razorpay and donation saved successfully.');
          } catch (error) {
            console.error('Failed to verify or save donation:', error);
            toast.error(error instanceof Error ? error.message : 'Could not verify Razorpay payment.');
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      checkout.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Razorpay payment failed.');
        setIsSubmitting(false);
      });

      checkout.open();
    } catch (error) {
      console.error('Failed to initialize Razorpay payment:', error);
      toast.error(error instanceof Error ? error.message : 'Could not start Razorpay checkout.');
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center min-h-[600px]"
      >
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-3xl font-heading font-bold mb-4">Thank You!</h2>
          <p className="text-lg text-muted-foreground mb-6">
            {t('donation.verified').replace('{amount}', currentAmount.toLocaleString())}
          </p>
          <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-2xl p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-2">{t('donation.impact_created')}</p>
            <p className="font-medium">{getImpactMessage(currentAmount)}</p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="w-full px-6 py-3 border border-border rounded-xl hover:bg-muted transition-colors"
          >
            {t('donation.make_another')}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-3 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t('donation.go_dashboard')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">{t('donation.title')}</h1>
        <p className="text-muted-foreground">{t('donation.subtitle')}</p>
      </div>

      {!canDonate && (
        <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          {t('donation.view_only')}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-xl font-heading font-semibold mb-4">{t('donation.type')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDonationType('one-time')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  donationType === 'one-time' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">{t('donation.one_time')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('donation.single')}</p>
              </button>
              <button
                onClick={() => setDonationType('monthly')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  donationType === 'monthly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="font-medium">{t('donation.monthly')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('donation.recurring')}</p>
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-heading font-semibold mb-4">{t('donation.select_campaign')}</h3>
            {campaigns.length === 0 ? (
              <div className="rounded-xl bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                {t('donation.no_campaigns')}
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {campaigns.map((campaign) => {
                  const progress = getDisplayProgress(campaign);
                  const image = campaign.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=200&fit=crop';

                  return (
                    <button
                      key={campaign.id}
                      onClick={() => setSelectedCampaign(campaign.id)}
                      className={`text-left rounded-xl overflow-hidden border-2 transition-all ${
                        selectedCampaign === campaign.id ? 'border-primary' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={image}
                        alt={campaign.title}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&h=200&fit=crop';
                        }}
                      />
                      <div className="p-3">
                        <p className="font-medium text-sm mb-2">{campaign.title}</p>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                            style={{ width: `${progress.width}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {progress.label} {t('donation.funded')}
                          {campaign.raised > 0 && ` • ₹${campaign.raised.toLocaleString()} ${t('donation.raised')}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-heading font-semibold mb-4">{t('donation.select_amount')}</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {presetAmounts.map((preset) => (
                <motion.button
                  key={preset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`p-4 rounded-xl border-2 font-medium transition-all ${
                    selectedAmount === preset && !customAmount
                      ? 'border-primary bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] text-white'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  ₹{preset.toLocaleString()}
                </motion.button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('donation.custom_amount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomAmount(value);

                    const parsed = parseInt(value, 10);
                    setSelectedAmount(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
                  }}
                  placeholder={t('donation.enter_custom_amount')}
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-heading font-semibold mb-4">{t('donation.payment_method')}</h3>
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">{t('donation.net_banking')}</p>
                <p className="text-sm text-muted-foreground">{t('donation.net_banking_help')}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-card rounded-2xl p-6 border border-border h-fit sticky top-24"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-semibold">{t('donation.summary')}</h3>
              <p className="text-sm text-muted-foreground">{t('donation.summary_subtitle')}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('donation.amount')}</span>
              <span className="font-semibold">₹{currentAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('donation.type_label')}</span>
              <span className="font-semibold capitalize">{donationType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('donation.campaign')}</span>
              <span className="font-semibold text-right">{selectedCampaignRecord?.title || t('donation.general')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('donation.payment')}</span>
              <span className="font-semibold uppercase">RAZORPAY ({paymentMethod})</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">{t('donation.impact_preview')}</p>
            <p className="font-medium">{getImpactMessage(currentAmount)}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDonate}
            disabled={isSubmitting || !canDonate}
            className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!canDonate ? t('donation.donor_required') : isSubmitting ? t('donation.opening_razorpay') : t('donation.pay_razorpay')}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
