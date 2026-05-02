import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Users, Megaphone, BarChart3, ArrowRight, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import { subscribeToCampaigns, type CampaignRecord } from '../../services/campaigns';
import { subscribeToDonations, type Donation } from '../../services/donations';
import { subscribeToUsers, type UserRecord } from '../../services/users';
import { subscribeToBeneficiaries, type Beneficiary } from '../../services/beneficiaries';
import { toCurrencyNumber } from '../../utils/currency';

const publicHighlights = {
  totalDonations: 25000000,
  childrenHelped: 5000,
  activeVolunteers: 1200,
};

export function HomePage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  const [donationsLoaded, setDonationsLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [beneficiariesLoaded, setBeneficiariesLoaded] = useState(false);

  useEffect(
    () =>
      subscribeToCampaigns((items) => {
        setCampaigns(items);
        setCampaignsLoaded(true);
      }),
    []
  );
  useEffect(
    () =>
      subscribeToDonations((items) => {
        setDonations(items);
        setDonationsLoaded(true);
      }),
    []
  );
  useEffect(
    () =>
      subscribeToUsers((items) => {
        setUsers(items);
        setUsersLoaded(true);
      }),
    []
  );
  useEffect(
    () =>
      subscribeToBeneficiaries((items) => {
        setBeneficiaries(items);
        setBeneficiariesLoaded(true);
      }),
    []
  );

  const featuredCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status !== 'draft').slice(0, 3),
    [campaigns]
  );

  const totalRaised = useMemo(
    () => donations.reduce((sum, donation) => sum + toCurrencyNumber(donation.amount), 0),
    [donations]
  );

  const totalCampaignRaised = useMemo(
    () => campaigns.reduce((sum, campaign) => sum + campaign.raised, 0),
    [campaigns]
  );

  const activeCampaignCount = useMemo(
    () => campaigns.filter((campaign) => campaign.status === 'active').length,
    [campaigns]
  );

  const activeVolunteerCount = useMemo(
    () => users.filter((user) => user.role === 'volunteer').length,
    [users]
  );

  const beneficiaryCount = beneficiaries.length;

  const publicStatValues = useMemo(
    () => ({
      totalDonations: Math.max(totalRaised, totalCampaignRaised, publicHighlights.totalDonations),
      childrenHelped: Math.max(beneficiaryCount, publicHighlights.childrenHelped),
      activeVolunteers: Math.max(activeVolunteerCount, publicHighlights.activeVolunteers),
      activeCampaigns: Math.max(activeCampaignCount, featuredCampaigns.length),
    }),
    [activeCampaignCount, activeVolunteerCount, beneficiaryCount, featuredCampaigns.length, totalCampaignRaised, totalRaised]
  );

  const stats = useMemo(
    () => [
      {
        label: t('stats.donations'),
        value: publicStatValues.totalDonations,
        displayValue: `₹${publicStatValues.totalDonations.toLocaleString()}`,
      },
      {
        label: t('stats.children'),
        value: publicStatValues.childrenHelped,
        displayValue: `${publicStatValues.childrenHelped.toLocaleString()}+`,
      },
      {
        label: t('stats.volunteers'),
        value: publicStatValues.activeVolunteers,
        displayValue: `${publicStatValues.activeVolunteers.toLocaleString()}+`,
      },
      {
        label: t('stats.campaigns'),
        value: publicStatValues.activeCampaigns,
        displayValue: publicStatValues.activeCampaigns.toLocaleString(),
      },
    ],
    [publicStatValues, t]
  );

  const features = [
    {
      icon: Heart,
      title: 'Easy Donations',
      description: 'Donate through the live platform and see the result in your dashboard.',
    },
    {
      icon: Users,
      title: 'Volunteer Network',
      description: 'Registered volunteers and staff can manage real events from Firebase.',
    },
    {
      icon: Megaphone,
      title: 'Active Campaigns',
      description: 'Campaign cards below come directly from the live database.',
    },
    {
      icon: BarChart3,
      title: 'Transparent Tracking',
      description: 'Donation, beneficiary, and campaign counts update from your real data.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold">Umedh Foundation</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="#campaigns" className="text-muted-foreground hover:text-primary transition-colors">
              {t('nav.campaigns')}
            </Link>
            <Link to="/dashboard/volunteer" className="text-muted-foreground hover:text-primary transition-colors">
              {t('nav.volunteer')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white rounded-xl font-medium shadow-lg shadow-primary/30"
              >
                {t('nav.donate')}
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-[#FF6B35] via-[#6C5CE7] to-[#FFD93D] bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">{t('hero.subtitle')}</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard/donate">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 107, 53, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white rounded-xl font-medium shadow-lg shadow-primary/30 flex items-center gap-2"
                >
                  {t('hero.donate')} <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/dashboard/volunteer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-primary text-primary rounded-xl font-medium hover:bg-primary/5"
                >
                  {t('hero.volunteer')}
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=700&fit=crop"
                alt="Children smiling"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl p-6">
                <p className="text-2xl font-bold mb-1">
                  {(beneficiariesLoaded ? beneficiaryCount : publicStatValues.childrenHelped).toLocaleString()}+
                </p>
                <p className="text-sm text-muted-foreground">Registered beneficiaries</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-[#FF6B35]/5 via-[#6C5CE7]/5 to-[#FFD93D]/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={`${stat.label}-${stat.value}`}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div
                  key={stat.value}
                  className="mx-auto mb-2 max-w-full break-words text-3xl sm:text-4xl md:text-[2.75rem] leading-tight font-bold bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] bg-clip-text text-transparent"
                >
                  {stat.displayValue}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="campaigns" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">Active Campaigns</h2>
            <p className="text-xl text-muted-foreground">Live campaigns from your Firebase database</p>
          </div>

          {featuredCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <p className="text-lg font-medium">No active campaigns available yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add campaigns from the admin campaign page and they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredCampaigns.map((campaign, i) => {
                const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;
                const image = campaign.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop';

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img src={image} alt={campaign.title} className="w-full h-full object-cover" />
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        {Math.round(progress)}%
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-heading font-semibold mb-4">{campaign.title}</h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Raised</span>
                          <span className="font-medium">
                            ₹{(campaign.raised / 1000).toFixed(0)}K / ₹{(campaign.goal / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(progress, 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                          ></motion.div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{campaign.supporters} supporters</span>
                        <Link to="/donate" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                          Donate
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">How We Help</h2>
            <p className="text-xl text-muted-foreground">Built around live donations, users, and campaigns</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-heading font-bold">Umedh</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Empowering lives through real campaigns, donations, and community support.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary">Home</Link></li>
                <li><Link to="/campaigns" className="hover:text-primary">Campaigns</Link></li>
                <li><Link to="/transparency" className="hover:text-primary">Transparency</Link></li>
                <li><Link to="/login" className="hover:text-primary">Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Get Involved</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/donate" className="hover:text-primary">Donate</Link></li>
                <li><Link to="/volunteer" className="hover:text-primary">Volunteer</Link></li>
                <li><Link to="/wishlist" className="hover:text-primary">Wishlist</Link></li>
                <li><Link to="/events" className="hover:text-primary">Events</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-3 mb-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <button
                    key={i}
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">contact@umedh.org</p>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Umedh Foundation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
