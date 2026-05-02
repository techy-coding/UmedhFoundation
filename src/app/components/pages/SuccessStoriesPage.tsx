import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, TrendingUp, Award, MessageCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import { subscribeToBeneficiaries, type Beneficiary } from '../../services/beneficiaries';

type StoryCategory = 'education' | 'healthcare' | 'family';

interface StoryCard {
  id: string;
  name: string;
  age: string;
  category: StoryCategory;
  image: string;
  beforeTitle: string;
  beforeDescription: string;
  afterTitle: string;
  afterDescription: string;
  journey: string;
  achievement: string;
  testimonial: string;
  date: string;
}

function mapBeneficiaryToStory(item: Beneficiary): StoryCard {
  const category: StoryCategory =
    item.category === 'elderly' ? 'healthcare' : item.category === 'disabled' ? 'family' : 'education';

  return {
    id: item.id,
    name: item.name,
    age: item.age || 'Unknown',
    category,
    image: item.photo || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop',
    beforeTitle: 'Needs Support',
    beforeDescription: item.specialNeeds || item.medicalHistory || 'Support needs were recorded in the platform.',
    afterTitle: 'Receiving Care',
    afterDescription: item.education || item.healthStatus || 'Now connected to ongoing care and support.',
    journey: item.address
      ? `${item.name} is registered in the platform with support coordinated from ${item.address}. Their current care record includes health status "${item.healthStatus || 'not specified'}" and category "${item.category}".`
      : `${item.name} is now part of the foundation support system with live data managed in Firebase.`,
    achievement: item.education || item.healthStatus || 'Active support plan in progress',
    testimonial: item.guardianName
      ? `${item.guardianName} is listed as the connected guardian or contact for this care journey.`
      : 'This story is built from the live beneficiary record now stored in Firebase.',
    date: item.admissionDate || 'Recently added',
  };
}

export function SuccessStoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToBeneficiaries(
      (items) => {
        setBeneficiaries(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load beneficiaries from Firebase:', error);
        toast.error('Could not load beneficiaries from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const stories = useMemo(() => beneficiaries.map(mapBeneficiaryToStory), [beneficiaries]);

  const categories = [
    { id: 'all', label: 'All Stories', icon: '📚' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  ];

  const filteredStories = selectedCategory === 'all' ? stories : stories.filter((story) => story.category === selectedCategory);

  const stats = [
    { label: 'Stories Available', value: stories.length.toString(), icon: Heart },
    { label: 'Children in Care', value: beneficiaries.filter((item) => item.category !== 'elderly').length.toString(), icon: TrendingUp },
    { label: 'Elderly Supported', value: beneficiaries.filter((item) => item.category === 'elderly').length.toString(), icon: Award },
    { label: 'Live Beneficiary Records', value: beneficiaries.length.toString(), icon: MessageCircle },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-[#FF6B35] via-[#6C5CE7] to-[#FFD93D] bg-clip-text text-transparent">
          Success Stories
        </h1>
        <p className="text-xl text-muted-foreground">Story cards now come from live beneficiary records</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={`${stat.label}-${stat.value}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p key={stat.value} className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive ? 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white shadow-lg' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </motion.button>
          );
        })}
      </div>

      {filteredStories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">No live success stories available yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add beneficiary records in Firebase and they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredStories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg"
            >
              <div className="grid lg:grid-cols-5 gap-0">
                <div className="lg:col-span-2 relative h-64 lg:h-auto">
                  <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-white mb-1">{story.name}</h3>
                      <p className="text-white/90">{story.age} years old</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium capitalize">
                      {story.category}
                    </span>
                    <span className="text-sm text-muted-foreground">{story.date}</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-red-500/10 rounded-xl p-4 border-l-4 border-red-500">
                      <p className="text-sm text-muted-foreground mb-2">Before</p>
                      <h4 className="font-semibold mb-2">{story.beforeTitle}</h4>
                      <p className="text-sm text-muted-foreground">{story.beforeDescription}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-xl p-4 border-l-4 border-green-500">
                      <p className="text-sm text-muted-foreground mb-2">After</p>
                      <h4 className="font-semibold mb-2">{story.afterTitle}</h4>
                      <p className="text-sm text-muted-foreground">{story.afterDescription}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">The Journey</h4>
                    <p className="text-muted-foreground leading-relaxed">{story.journey}</p>
                  </div>

                  <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-xl p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-2">Record Note</p>
                    <p className="italic">&ldquo;{story.testimonial}&rdquo;</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">Achievement: {story.achievement}</div>
                    <div className="text-sm text-muted-foreground">Live Firebase-backed story</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
