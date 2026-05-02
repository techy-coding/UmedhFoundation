import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book, Gift, HeartHandshake, Shirt, ShoppingCart, Stethoscope, Utensils, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { createDonation } from '../../services/donations';
import {
  subscribeToNeeds,
  updateNeed,
  getDonorEntries,
  type NeedRecord,
  type DonorEntry,
} from '../../services/wishlist';

const categoryMap = {
  all: { label: 'All Items', icon: ShoppingCart },
  education: { label: 'Education', icon: Book },
  food: { label: 'Food & Nutrition', icon: Utensils },
  clothing: { label: 'Clothing', icon: Shirt },
  medical: { label: 'Healthcare', icon: Stethoscope },
  shelter: { label: 'Infrastructure', icon: Wrench },
} as const;

type WishlistCategory = keyof typeof categoryMap;

function toNeedNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;

  const parsed = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function applyNeedProgressUpdate(
  need: NeedRecord,
  fulfilledQuantity: number,
  status: NeedRecord['status'],
  donorInfo: DonorEntry,
  donors: DonorEntry[]
): NeedRecord {
  return {
    ...need,
    fulfilledQuantity,
    status,
    donorInfo,
    donors,
  };
}

export function WishlistPage() {
  const { role, userName, userEmail } = useRole();
  const canDonateToWishlist = role === 'donor';
  const [selectedCategory, setSelectedCategory] = useState<WishlistCategory>('all');
  const [needs, setNeeds] = useState<NeedRecord[]>([]);
  const [optimisticNeedUpdates, setOptimisticNeedUpdates] = useState<Record<string, Partial<NeedRecord>>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Array<{ itemId: string; quantity: number }>>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(
    () =>
      subscribeToNeeds((items) => {
        setNeeds(items);
        setOptimisticNeedUpdates((current) => {
          const next = { ...current };

          for (const item of items) {
            const optimisticItem = current[item.id];
            if (!optimisticItem) {
              continue;
            }

            const optimisticFulfilled = toNeedNumber(optimisticItem.fulfilledQuantity);
            const actualFulfilled = toNeedNumber(item.fulfilledQuantity);

            if (actualFulfilled >= optimisticFulfilled) {
              delete next[item.id];
            }
          }

          return next;
        });
      }),
    []
  );

  const displayNeeds = useMemo(
    () =>
      needs.map((item) => ({
        ...item,
        ...(optimisticNeedUpdates[item.id] || {}),
      })),
    [needs, optimisticNeedUpdates]
  );

  // Exclude empty/placeholder records that have no meaningful data so the
  // wishlist page never renders blank cards (no name, 0 qty, ₹0 cost, etc.).
  const validNeeds = useMemo(() => {
    return displayNeeds.filter((item) => {
      const hasItemName = Boolean(item.item && item.item.trim());
      const hasCategory = Boolean(item.category && item.category.trim());
      const hasQuantity = toNeedNumber(item.quantity) > 0;
      const hasCost = toNeedNumber(item.estimatedCost) > 0;

      return hasItemName && hasCategory && (hasQuantity || hasCost);
    });
  }, [displayNeeds]);

  const wishlistStats = useMemo(() => {
    const totalRequired = validNeeds.reduce((sum, item) => sum + toNeedNumber(item.quantity), 0);
    const totalFulfilled = validNeeds.reduce(
      (sum, item) => sum + toNeedNumber(item.fulfilledQuantity),
      0
    );
    const urgentNeeds = validNeeds.filter(
      (item) => item.priority === 'urgent' || item.priority === 'high'
    ).length;

    return [
      { label: 'Total Items Needed', value: Math.max(totalRequired - totalFulfilled, 0) },
      { label: 'Items Fulfilled', value: totalFulfilled },
      { label: 'Urgent Needs', value: urgentNeeds },
      { label: 'Categories', value: Object.keys(categoryMap).length - 1 },
    ];
  }, [validNeeds]);

  const filteredItems = useMemo(() => {
    const activeNeeds = validNeeds.filter((item) => item.status !== 'fulfilled');
    if (selectedCategory === 'all') {
      return activeNeeds;
    }

    return activeNeeds.filter((item) => item.category === selectedCategory);
  }, [validNeeds, selectedCategory]);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const need = displayNeeds.find((entry) => entry.id === item.itemId);
    return sum + toNeedNumber(need?.estimatedCost) * item.quantity;
  }, 0);

  const addToCart = (itemId: string) => {
    if (!canDonateToWishlist) {
      toast.error('Only donor accounts can add wishlist items.');
      return;
    }

    const quantity = quantities[itemId] || 1;
    const need = displayNeeds.find((entry) => entry.id === itemId);

    if (!need) {
      return;
    }

    const remaining = Math.max(toNeedNumber(need.quantity) - toNeedNumber(need.fulfilledQuantity), 0);
    if (quantity > remaining) {
      toast.error(`Only ${remaining} item(s) are still needed.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((entry) => entry.itemId === itemId);
      if (existing) {
        return current.map((entry) =>
          entry.itemId === itemId ? { ...entry, quantity: Math.min(entry.quantity + quantity, remaining) } : entry
        );
      }

      return [...current, { itemId, quantity }];
    });

    toast.success(`Added ${quantity} × ${need.item} to cart`);
  };

  const handleCheckout = async () => {
    if (!canDonateToWishlist) {
      toast.error('Only donor accounts can complete wishlist checkout.');
      return;
    }

    if (cart.length === 0) {
      return;
    }

    setIsCheckingOut(true);

    // Pull up-to-date phone number from the saved user profile so it can be
    // stored alongside each donor entry (rather than a hardcoded placeholder).
    let donorPhone = '';
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        donorPhone = parsedUser.phone || '';
      }
    } catch {
      donorPhone = '';
    }

    try {
      for (const cartItem of cart) {
        const need = displayNeeds.find((entry) => entry.id === cartItem.itemId);
        if (!need) {
          continue;
        }

        const unitCost = toNeedNumber(need.estimatedCost);
        const nextFulfilled = toNeedNumber(need.fulfilledQuantity) + cartItem.quantity;
        const targetQuantity = toNeedNumber(need.quantity);
        const nextStatus =
          nextFulfilled >= targetQuantity ? 'fulfilled' : nextFulfilled > 0 ? 'partial' : 'pending';

        await createDonation({
          amount: String(unitCost * cartItem.quantity),
          category: need.category,
          paymentMethod: 'netbanking',
          tax80G: true,
          campaign: `${need.item} Wishlist`,
          isRecurring: false,
          frequency: 'one-time',
          message: `Wishlist support for ${need.item}`,
          isAnonymous: false,
          campaignId: '',
        });

        const newDonor: DonorEntry = {
          name: userName || 'Anonymous',
          email: userEmail || 'anonymous@example.com',
          phone: donorPhone,
          donationDate: new Date().toISOString(),
          quantity: cartItem.quantity,
          amount: unitCost * cartItem.quantity,
        };

        // Append the new donor to the existing list so every contribution is
        // preserved (not just the most recent one).
        const existingDonors = getDonorEntries(need);
        const nextDonors = [...existingDonors, newDonor];

        const nextNeedState = applyNeedProgressUpdate(
          need,
          nextFulfilled,
          nextStatus,
          newDonor,
          nextDonors
        );

        setOptimisticNeedUpdates((current) => ({
          ...current,
          [need.id]: nextNeedState,
        }));

        setNeeds((current) =>
          current.map((entry) => (entry.id === need.id ? nextNeedState : entry))
        );

        await updateNeed(
          need.id,
          {
            item: need.item,
            category: need.category,
            quantity: need.quantity,
            priority: need.priority,
            requiredBy: need.requiredBy,
            beneficiaryName: need.beneficiaryName,
            purpose: need.purpose,
            estimatedCost: need.estimatedCost,
          },
          nextFulfilled,
          nextStatus,
          nextDonors
        );

        setQuantities((current) => ({
          ...current,
          [need.id]: 1,
        }));
      }

      setCart([]);
      setQuantities({});
      toast.success('Wishlist donation completed and saved to Firebase.');
    } catch (error) {
      console.error('Failed to complete wishlist checkout:', error);
      toast.error('Could not complete wishlist donation.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-heading font-bold">Wishlist & Needs</h1>
          <p className="text-muted-foreground">Browse live need items and sponsor exactly what is required.</p>
        </div>
        <div className="flex items-center gap-3">
          {canDonateToWishlist && cartItemsCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] px-6 py-3 font-medium text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              <ShoppingCart className="h-5 w-5" />
              {isCheckingOut ? 'Processing...' : `Checkout (${cartItemsCount} • ₹${cartTotal.toLocaleString()})`}
            </motion.button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">How to add wishlist items:</span> staff and admin users can add real needs from the
        {' '}
        <Link to="/dashboard/wishlist-manage" className="text-primary underline-offset-4 hover:underline">
          Wishlist Management
        </Link>
        {' '}
        page. Donors use this page to fulfill those needs.
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {wishlistStats.map((stat) => (
          <div key={`${stat.label}-${stat.value}`} className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-1 text-sm text-muted-foreground">{stat.label}</p>
            <p key={stat.value} className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {Object.entries(categoryMap).map(([id, config]) => {
          const Icon = config.icon;
          const isActive = selectedCategory === id;

          return (
            <motion.button
              key={id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategory(id as WishlistCategory)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className="h-5 w-5" />
              {config.label}
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredItems.length === 0 && (
          <div className="md:col-span-2 rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
            No wishlist items are available in this category yet.
          </div>
        )}

        {filteredItems.map((item) => {
          const itemQuantity = toNeedNumber(item.quantity);
          const fulfilledQuantity = toNeedNumber(item.fulfilledQuantity);
          const remaining = Math.max(itemQuantity - fulfilledQuantity, 0);
          const progress = itemQuantity > 0 ? (fulfilledQuantity / itemQuantity) * 100 : 0;
          const quantity = quantities[item.id] || 1;
          const Icon =
            item.category === 'education'
              ? Book
              : item.category === 'food'
                ? Utensils
                : item.category === 'clothing'
                  ? Shirt
                  : item.category === 'medical'
                    ? Stethoscope
                    : Gift;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7]">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-semibold">{item.item}</h3>
                    <p className="text-sm text-muted-foreground">{item.purpose || 'Immediate need from the wishlist.'}</p>
                    {item.beneficiaryName && (
                      <p className="mt-2 text-xs uppercase tracking-wide text-primary">For {item.beneficiaryName}</p>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {item.priority}
                </span>
              </div>

              <div className="mb-4 rounded-xl bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {fulfilledQuantity}/{itemQuantity}
                  </span>
                </div>
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{remaining} item(s) still needed</p>
              </div>

              <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Required by {item.requiredBy || 'Open need'}</span>
                <span className="font-medium text-primary">₹{toNeedNumber(item.estimatedCost).toLocaleString()} per item</span>
              </div>

              {canDonateToWishlist ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-border">
                    <button
                      onClick={() =>
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: Math.max(1, quantity - 1),
                        }))
                      }
                      className="px-4 py-2 transition-colors hover:bg-muted"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={remaining}
                      value={quantity}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: Math.max(1, Math.min(remaining || 1, Number(event.target.value) || 1)),
                        }))
                      }
                      className="w-16 border-x border-border bg-transparent text-center focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: Math.min(remaining || 1, quantity + 1),
                        }))
                      }
                      className="px-4 py-2 transition-colors hover:bg-muted"
                    >
                      +
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(item.id)}
                    disabled={remaining <= 0}
                    className={`flex-1 rounded-xl py-2 font-medium transition-colors ${
                      remaining <= 0
                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {remaining <= 0 ? 'Already Fulfilled' : `Add ${quantity} item(s)`}
                  </motion.button>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Only donor accounts can add wishlist items to cart and complete checkout.
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 p-8">
        <h3 className="mb-6 text-2xl font-heading font-bold">How It Works</h3>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { step: '1', title: 'Browse Items', desc: 'Choose a live wishlist item created by staff or admin.' },
            { step: '2', title: 'Pick Quantity', desc: 'Select how many units you want to support.' },
            { step: '3', title: 'Checkout', desc: 'We save the support as a donation record in Firebase.' },
            { step: '4', title: 'Track Impact', desc: 'Fulfilled quantities update live across the dashboard.' },
          ].map((step) => (
            <div key={step.step} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] text-2xl font-bold text-white">
                {step.step}
              </div>
              <h4 className="mb-2 text-lg font-semibold">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>

        {!canDonateToWishlist && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <HeartHandshake className="h-5 w-5 text-primary" />
            This page is view-only for non-donor accounts. Only donors can add items and checkout wishlist support.
          </div>
        )}
      </div>
    </div>
  );
}
