import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Clock, Plus, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { subscribeToEvents, type EventRecord, createEvent } from '../../services/events';
import { createRecord } from '../../services/firebaseCrud';
import { 
  subscribeToEventRegistrations, 
  type EventRegistrationRecord,
  isVolunteerRegisteredForEvent 
} from '../../services/eventRegistrations';
import { createNotification } from '../../services/notifications';

export function EventsPage() {
  const { role, userEmail, userName } = useRole();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'my-events'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'fundraiser' | 'volunteer' | 'awareness' | 'celebration'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistrationRecord[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    eventType: 'volunteer',
    volunteersNeeded: '',
    skillsRequired: '',
    contactPerson: userName || '',
    contactEmail: userEmail || '',
    contactPhone: '',
    image: null as File | string | null,
  });

  useEffect(() => subscribeToEvents(setEvents), []);
  useEffect(() => subscribeToEventRegistrations(setEventRegistrations), []);

  // Check if user can create events (only staff and admin)
  const canCreateEvents = role === 'staff' || role === 'admin';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter events for display
  const availableEvents = events.filter(
    (event) => new Date(event.date).getTime() >= today.getTime()
  );

  const myEvents = events.filter((event) => {
    if (role === 'volunteer' && userEmail) {
      return eventRegistrations.some(
        (registration) =>
          registration.eventId === event.id &&
          registration.volunteerEmail === userEmail &&
          registration.status === 'approved'
      );
    }

    if ((role === 'staff' || role === 'admin') && userEmail) {
      return event.contactEmail === userEmail;
    }

    return false;
  });

  const getEventStatus = (event: EventRecord) => {
    const eventDate = new Date(event.date);
    if (Number.isNaN(eventDate.getTime())) {
      return 'upcoming';
    }

    eventDate.setHours(0, 0, 0, 0);
    if (eventDate.getTime() < today.getTime()) {
      return 'completed';
    }

    if (eventDate.getTime() === today.getTime()) {
      return 'ongoing';
    }

    return 'upcoming';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createEvent(formData);
      toast.success('Event created successfully!');
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: '',
        location: '',
        eventType: 'volunteer',
        volunteersNeeded: '',
        skillsRequired: '',
        contactPerson: userName || '',
        contactEmail: userEmail || '',
        contactPhone: '',
        image: null,
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Could not create event. Please try again.');
    }
  };

  const handleRegister = async (event: EventRecord) => {
    try {
      // Create registration request for admin approval
      await createRecord('approvals', {
        type: 'event',
        title: `Event Registration: ${event.title}`,
        description: `${userName || 'Volunteer'} wants to register for event "${event.title}" on ${event.date} at ${event.time}. Location: ${event.location}. Contact: ${userEmail}`,
        requestedBy: userEmail || 'unknown',
        requestedDate: new Date().toISOString(),
        status: 'pending',
        eventData: {
          eventId: event.id,
          eventTitle: event.title,
          volunteerName: userName || 'Volunteer',
          volunteerEmail: userEmail || 'unknown',
          registrationDate: new Date().toISOString(),
        }
      });

      await Promise.all([
        createNotification({
          title: 'New event registration request',
          message: `${userName || 'A volunteer'} requested to join ${event.title}.`,
          type: 'approval',
          audience: 'roles',
          roles: ['admin', 'staff'],
          link: '/dashboard/approvals',
        }),
        createNotification({
          title: 'Registration request submitted',
          message: `Your registration request for ${event.title} is pending review.`,
          type: 'event',
          audience: 'user',
          userEmail: userEmail || 'unknown',
          link: '/dashboard/events',
        }),
      ]);

      toast.success('Registration request sent! Awaiting admin approval.');
    } catch (error) {
      console.error('Failed to submit registration:', error);
      toast.error('Could not submit registration. Please try again.');
    }
  };

  const baseEvents = selectedTab === 'all' ? events : myEvents;
  const displayEvents = baseEvents.filter((event) => {
    const matchesType = selectedType === 'all' || event.eventType === selectedType;
    const matchesStatus = selectedStatus === 'all' || getEventStatus(event) === selectedStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">Join and manage community events</p>
        </div>
        {canCreateEvents && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
          >
            {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showCreateForm ? 'Cancel' : 'Create Event'}
          </motion.button>
        )}
      </div>

      {showCreateForm && canCreateEvents && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 border border-border"
        >
          <h2 className="text-2xl font-heading font-bold mb-6">Create New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter event title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Describe your event..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Type</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="fundraiser">Fundraiser</option>
                  <option value="awareness">Awareness</option>
                  <option value="celebration">Celebration</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Volunteers Needed</label>
                <input
                  type="number"
                  value={formData.volunteersNeeded}
                  onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Number of volunteers needed"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg"
            >
              Create Event
            </motion.button>
          </form>
        </motion.div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              selectedTab === 'all'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setSelectedTab('my-events')}
            className={`px-6 py-2 rounded-xl font-medium transition-all ${
              selectedTab === 'my-events'
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            My Events ({myEvents.length})
          </button>
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
          className="px-4 py-2 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="fundraiser">Fundraiser</option>
          <option value="volunteer">Volunteer</option>
          <option value="awareness">Awareness</option>
          <option value="celebration">Celebration</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
          className="px-4 py-2 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: events.length, icon: Calendar },
          { label: 'Upcoming Events', value: availableEvents.length, icon: Clock },
          { label: 'My Registrations', value: myEvents.length, icon: CheckCircle },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {displayEvents.length === 0 && (
          <div className="md:col-span-2 text-center py-12 bg-card border border-border rounded-xl text-muted-foreground">
            No events available yet.
          </div>
        )}
        {displayEvents.map((event, i) => {
          const volunteersNeeded = Number(event.volunteersNeeded || 0);
          console.log('Event progress calculation:', {
            eventId: event.id,
            eventTitle: event.title,
            volunteersNeeded: event.volunteersNeeded,
            volunteersNeededNumber: volunteersNeeded,
            volunteersRegistered: event.volunteersRegistered,
            progress: volunteersNeeded > 0 ? (event.volunteersRegistered / volunteersNeeded) * 100 : 0
          });
          const progress = volunteersNeeded > 0 ? (event.volunteersRegistered / volunteersNeeded) * 100 : 0;
          
          // Check if volunteer is registered for this event using event registrations
          const isRegistered = role === 'volunteer' && userEmail 
            ? isVolunteerRegisteredForEvent(eventRegistrations, event.id, userEmail)
            : false;
          const isUpcoming = new Date(event.date).getTime() >= new Date().setHours(0, 0, 0, 0);

          return (
            <motion.div
              key={event.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg"
            >
            <div className="relative h-48">
              <img src={event.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop'} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full text-sm font-medium">
                {isUpcoming ? '📅 Upcoming' : '🔴 Past'}
              </div>
              <div className="absolute top-4 left-4 px-3 py-1 bg-secondary/90 backdrop-blur-sm rounded-full text-xs text-white capitalize">
                {event.eventType}
              </div>
              {isRegistered && (
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-xs text-white flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Registered
                </div>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-xl font-heading font-semibold mb-2">{event.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Contact: {event.contactPerson}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Volunteers Progress</span>
                  <span className="font-medium">
                    {event.volunteersRegistered} registered, {Math.max(0, volunteersNeeded - event.volunteersRegistered)} spots left
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full ${
                      progress >= 90
                        ? 'bg-red-500'
                        : progress >= 70
                        ? 'bg-yellow-500'
                        : 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]'
                    }`}
                  ></motion.div>
                </div>
              </div>

              {isUpcoming && role === 'volunteer' && (
                <motion.button
                  whileHover={{ scale: isRegistered ? 1 : 1.02 }}
                  whileTap={{ scale: isRegistered ? 1 : 0.98 }}
                  onClick={() => !isRegistered && handleRegister(event)}
                  disabled={isRegistered || event.volunteersRegistered >= volunteersNeeded}
                  className={`w-full md:w-auto px-6 py-2 rounded-xl font-medium transition-colors ${
                    isRegistered
                      ? 'bg-green-500/20 text-green-600 cursor-default'
                      : event.volunteersRegistered >= volunteersNeeded
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white hover:shadow-lg'
                  }`}
                >
                  {isRegistered ? '✓ Registered' : event.volunteersRegistered >= volunteersNeeded ? 'Event Full' : 'Register as Volunteer'}
                </motion.button>
              )}

              {isRegistered && isUpcoming && (
                <div className="bg-green-500/10 text-green-500 py-3 rounded-xl text-center font-medium">
                  ✓ You are registered for this event
                </div>
              )}

              {!isUpcoming && (
                <div className="bg-muted/50 py-3 rounded-xl text-center text-muted-foreground">
                  Event has passed
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}
