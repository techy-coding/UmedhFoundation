import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AddEventForm, EventFormData } from '../forms/AddEventForm';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  createEvent,
  deleteEvent,
  fallbackEvents,
  subscribeToEvents,
  updateEvent,
  type EventRecord as Event,
} from '../../services/events';

export function EventsManagePage() {
  const [events, setEvents] = useState<Event[]>(fallbackEvents);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToEvents(
      (items: any[]) => {
        setEvents(items);
        setIsLoading(false);
      },
      (error: any) => {
        console.error('Failed to load events from Firebase:', error);
        toast.error('Could not load events from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleSubmit = async (data: EventFormData) => {
    try {
      if (editingEvent) {
        if (!isFirebaseConfigured) {
          setEvents((current) =>
            current.map((e) =>
              e.id === editingEvent.id
                ? {
                    ...e,
                    ...data,
                    volunteersRegistered: editingEvent.volunteersRegistered,
                    image: typeof data.image === 'string' ? data.image : e.image,
                  }
                : e
            )
          );
        } else {
          await updateEvent(
            editingEvent.id,
            data,
            editingEvent.volunteersRegistered,
            editingEvent.image || ''
          );
        }
        toast.success('Event updated successfully');
      } else {
        if (!isFirebaseConfigured) {
          const newEvent: Event = {
            id: Date.now().toString(),
            ...data,
            volunteersRegistered: 0,
            image: typeof data.image === 'string' ? data.image : '',
          };
          setEvents((current) => [...current, newEvent]);
        } else {
          await createEvent(data);
        }
        toast.success('Event created successfully');
      }

      setShowModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('Could not save event.');
    }
  };

  const handleDelete = async () => {
    if (deleteEvent) {
      try {
        if (!isFirebaseConfigured) {
          setEvents((current) => current.filter((e) => e.id !== deleteEvent.id));
        } else {
          await deleteEvent(deleteEvent.id);
        }

        toast.success('Event deleted successfully');
        setDeleteEvent(null);
      } catch (error) {
        console.error('Failed to delete event:', error);
        toast.error('Could not delete event.');
      }
    }
  };

  const eventTypeLabels: Record<string, string> = {
    volunteering: 'Volunteering',
    fundraiser: 'Fundraiser',
    awareness: 'Awareness',
    training: 'Training',
    celebration: 'Celebration',
    distribution: 'Distribution',
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground mt-1">Organize and manage volunteer events</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8C7CE7] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </motion.button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && (
          <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Loading events from Firebase...
          </div>
        )}
        {filteredEvents.map((event) => {
          const progress = (event.volunteersRegistered / parseInt(event.volunteersNeeded)) * 100;
          return (
            <div key={event.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs">
                      {eventTypeLabels[event.eventType]}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {event.volunteersRegistered}/{event.volunteersNeeded} volunteers
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#8C7CE7]"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Volunteer registration: {progress.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingEvent(event);
                      setShowModal(true);
                    }}
                    className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteEvent(event)}
                    className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        size="md"
      >
        <AddEventForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          initialData={editingEvent || undefined}
          isEdit={!!editingEvent}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteEvent?.title}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
