import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, MapPin, Clock, CheckCircle, Award, Target } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeToEvents, type EventRecord } from '../../services/events';
import { subscribeToUsers, type UserRecord } from '../../services/users';
import { createRecord } from '../../services/firebaseCrud';
import { useRole } from '../../context/RoleContext';
import { createNotification } from '../../services/notifications';

export function VolunteerPage() {
  const { userName, userEmail } = useRole();
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    phone: '',
    skills: '',
    availability: '',
  });

  useEffect(() => subscribeToEvents(setEvents), []);
  useEffect(() => subscribeToUsers(setUsers), []);

  const volunteerUsers = useMemo(() => users.filter((user) => user.role === 'volunteer'), [users]);
  const availableEvents = useMemo(
    () => events.filter((event) => new Date(event.date).getTime() >= new Date().setHours(0, 0, 0, 0)),
    [events]
  );

  const myTasks = useMemo(
    () => availableEvents.filter((event) => event.contactEmail === userEmail || event.contactPerson === userName).slice(0, 5),
    [availableEvents, userEmail, userName]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create approval request for admin
      await createRecord('approvals', {
        type: 'user',
        title: `Volunteer Application: ${formData.name}`,
        description: `New volunteer application from ${formData.name} (${formData.email}). Skills: ${formData.skills}. Availability: ${formData.availability}. Phone: ${formData.phone}`,
        requestedBy: formData.email,
        requestedDate: new Date().toISOString(),
        status: 'pending',
        applicantData: {
          ...formData,
          createdAt: new Date().toISOString(),
          applicationType: 'volunteer'
        }
      });

      // Also save to volunteerApplications for reference
      await createRecord('volunteerApplications', {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });

      await Promise.all([
        createNotification({
          title: 'New volunteer application',
          message: `${formData.name} submitted a volunteer application for review.`,
          type: 'approval',
          audience: 'roles',
          roles: ['admin', 'staff'],
          link: '/dashboard/approvals',
        }),
        createNotification({
          title: 'Application received',
          message: 'Your volunteer application was submitted successfully and is waiting for admin approval.',
          type: 'approval',
          audience: 'user',
          userEmail: formData.email,
          link: '/dashboard/events',
        }),
      ]);

      toast.success('Volunteer application submitted! Awaiting admin approval.');
      setShowForm(false);
      setFormData({ name: userName || '', email: userEmail || '', phone: '', skills: '', availability: '' });
    } catch (error) {
      console.error('Failed to save volunteer application:', error);
      toast.error('Could not save volunteer application.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Volunteer Opportunities</h1>
          <p className="text-muted-foreground">Volunteer opportunities are now loaded from live Firebase events</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg"
        >
          {showForm ? 'View Opportunities' : 'Register as Volunteer'}
        </motion.button>
      </div>

      {showForm ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 border border-border max-w-2xl mx-auto">
          <h2 className="text-2xl font-heading font-bold mb-6">Volunteer Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Availability</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Select availability</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="flexible">Flexible</option>
                  <option value="monthly">Once a Month</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Skills & Interests</label>
              <textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <div className="flex gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg">
                Submit Application
              </motion.button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-border rounded-xl hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <>
          <div className="grid lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Volunteers', value: volunteerUsers.length.toString(), icon: Users, color: 'from-[#FF6B35] to-[#FF8B35]' },
              { label: 'Open Events', value: availableEvents.length.toString(), icon: Clock, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
              { label: 'Active Programs', value: events.length.toString(), icon: Target, color: 'from-[#FFD93D] to-[#FFE93D]' },
              { label: 'My Assigned Events', value: myTasks.length.toString(), icon: Award, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={`${stat.label}-${stat.value}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                  <p key={stat.value} className="text-3xl font-bold">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold mb-4">Available Opportunities</h2>
                {availableEvents.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                    <p className="text-lg font-medium">No volunteer events available yet.</p>
                    <p className="mt-2 text-sm text-muted-foreground">Create events in Firebase and they will appear here automatically.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {availableEvents.map((event, i) => {
                      const volunteersNeeded = Number(event.volunteersNeeded || 0);
                      const progress = volunteersNeeded > 0 ? (event.volunteersRegistered / volunteersNeeded) * 100 : 0;
                      const image = event.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop';

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                          className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg"
                        >
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="relative h-48 md:h-auto">
                              <img src={image} alt={event.title} className="w-full h-full object-cover" />
                              <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                                {event.volunteersRegistered}/{volunteersNeeded || 0} volunteers
                              </div>
                            </div>
                            <div className="md:col-span-2 p-6">
                              <h3 className="text-xl font-heading font-semibold mb-2">{event.title}</h3>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  {event.date} • {event.time}
                                </div>
                              </div>
                              <div className="mb-4">
                                <p className="text-sm text-muted-foreground mb-2">Skills needed:</p>
                                <div className="flex flex-wrap gap-2">
                                  {(event.skillsRequired ? event.skillsRequired.split(',') : ['General support']).map((skill) => (
                                    <span key={skill.trim()} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                      {skill.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{Math.round(progress)}% filled</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"></motion.div>
                                </div>
                              </div>
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => toast.success('Open the registration form to submit your volunteer application.')} className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors">
                                Apply Now
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-2xl p-6 border border-border backdrop-blur-sm">
                <h3 className="text-xl font-heading font-semibold mb-4">My Tasks</h3>
                {myTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks assigned to this account yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <motion.div key={task.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-card/80 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">upcoming</span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {task.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {task.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {task.location}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border">
                <h3 className="text-xl font-heading font-semibold mb-4">Why Volunteer?</h3>
                <ul className="space-y-3">
                  {[
                    'Join live events from the Firebase events collection',
                    'Submit applications directly into the database',
                    'Track assigned events from your account details',
                    'Coordinate with staff using event contact details',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
