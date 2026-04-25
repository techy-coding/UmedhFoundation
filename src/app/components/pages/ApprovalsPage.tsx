import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Clock, User, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import { subscribeToCollection, updateRecord, createRecord } from '../../services/firebaseCrud';
import { createNotification } from '../../services/notifications';
import { updateUserStatus } from '../../services/users';
import { registerWithEmail } from '../../services/auth';
import { subscribeToEvents, updateEvent, type EventRecord } from '../../services/events';
import { createEventRegistration } from '../../services/eventRegistrations';

interface Approval {
  id: string;
  type: 'user' | 'donation' | 'event' | 'beneficiary';
  title: string;
  description: string;
  requestedBy: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  applicantData?: any;
  eventData?: any;
}

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToCollection(
      'approvals',
      (items: any[]) => {
        setApprovals(items as Approval[]);
        setIsLoading(false);
      },
      [],
      (items: any[]) => [...items].sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()),
      (error: any) => {
        console.error('Failed to load approvals from Firebase:', error);
        toast.error('Could not load approvals from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleApprove = async (id: string) => {
    const approval = approvals.find(a => a.id === id);
    if (!approval) return;

    try {
      // Update approval status
      await updateRecord('approvals', id, { ...approval, status: 'approved' });
      
      // If this is a volunteer application, create user account
      if (approval.title.includes('Volunteer Application') && approval.applicantData) {
        const applicantData = approval.applicantData;
        
        // Create a temporary password for the volunteer
        const tempPassword = Math.random().toString(36).slice(-8);
        
        try {
          // Register the user as volunteer
          await registerWithEmail(
            applicantData.email,
            tempPassword,
            'volunteer',
            {
              firstName: applicantData.name.split(' ')[0],
              lastName: applicantData.name.split(' ').slice(1).join(' '),
              phone: applicantData.phone
            }
          );

          await createNotification({
            title: 'Volunteer application approved',
            message: `Your volunteer application has been approved. You can now participate in live events.`,
            type: 'approval',
            audience: 'user',
            userEmail: applicantData.email,
            link: '/dashboard/events',
          });
          
          toast.success(`Volunteer application approved! User account created for ${applicantData.name}. Temporary password: ${tempPassword}`);
        } catch (authError: any) {
          console.error('Failed to create user account:', authError);
          
          // If user already exists, just update their status
          if (authError.message?.includes('already')) {
            // Update existing user status to active
            try {
              // Find existing user and update status
              const unsubscribeUsers = subscribeToCollection(
                'users',
                (users: any[]) => {
                  const existingUser = users.find((u: any) => u.email === applicantData.email);
                  if (existingUser) {
                    updateUserStatus(existingUser, 'active');
                    toast.success(`Volunteer application approved! Existing user ${applicantData.name} activated.`);
                    unsubscribeUsers(); // Clean up subscription
                  }
                },
                [],
                (items: any[]) => items
              );
            } catch (updateError) {
              console.error('Failed to update existing user:', updateError);
              toast.error('Failed to activate existing user account.');
            }
          } else {
            toast.error('Failed to create user account. Please try again.');
          }
        }
      } 
      // If this is an event registration, update event registration count
      else if (approval.title.includes('Event Registration') && approval.eventData) {
        const eventData = approval.eventData;
        
        try {
          // Fetch current event data once (not as subscription to prevent infinite loop)
          const events = await new Promise<EventRecord[]>((resolve) => {
            const unsubscribe = subscribeToEvents((eventList) => {
              resolve(eventList);
              unsubscribe();
            });
          });
          
          const event = events.find(e => e.id === eventData.eventId);
          if (event) {
            console.log('Current event data:', event);
            console.log('Current volunteersRegistered:', event.volunteersRegistered);
            const newVolunteerCount = event.volunteersRegistered + 1;
            console.log('New volunteer count:', newVolunteerCount);
            
            // Update the event with new volunteer count using direct update
            const updatedEvent = {
              title: event.title,
              description: event.description,
              eventType: event.eventType,
              date: event.date,
              time: event.time,
              duration: event.duration,
              location: event.location,
              volunteersNeeded: event.volunteersNeeded,
              volunteersRegistered: newVolunteerCount,
              skillsRequired: event.skillsRequired,
              contactPerson: event.contactPerson,
              contactEmail: event.contactEmail,
              contactPhone: event.contactPhone,
              image: event.image,
            };
            
            await updateRecord('events', eventData.eventId, updatedEvent);
            
            // Create event registration record for the volunteer
            try {
              await createEventRegistration({
                eventId: eventData.eventId,
                eventTitle: eventData.eventTitle,
                volunteerEmail: eventData.volunteerEmail,
                volunteerName: eventData.volunteerName,
                registrationDate: eventData.registrationDate,
                status: 'approved',
              });

              await createNotification({
                title: 'Event registration approved',
                message: `Your registration for ${eventData.eventTitle} has been approved.`,
                type: 'approval',
                audience: 'user',
                userEmail: eventData.volunteerEmail,
                link: '/dashboard/events',
              });
              
              toast.success(`Event registration approved! ${eventData.volunteerName} registered for ${eventData.eventTitle}.`);
            } catch (regError) {
              console.error('Failed to create event registration record:', regError);
              toast.success(`Event registration approved! ${eventData.volunteerName} registered for ${eventData.eventTitle}.`);
            }
          } else {
            toast.error('Event not found.');
          }
        } catch (error) {
          console.error('Failed to update event registration:', error);
          toast.error('Failed to update event registration. Please try again.');
        }
      } else {
        toast.success('Request approved successfully');
      }
      
      setApprovals(approvals.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a)));
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Could not approve request. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const approval = approvals.find(a => a.id === id);
      await updateRecord('approvals', id, { ...approval, status: 'rejected' });
      if (approval?.applicantData?.email) {
        await createNotification({
          title: 'Application update',
          message: `Your request "${approval.title}" was rejected. Please contact support if you need help.`,
          type: 'approval',
          audience: 'user',
          userEmail: approval.applicantData.email,
          link: '/dashboard/profile',
        });
      } else if (approval?.eventData?.volunteerEmail) {
        await createNotification({
          title: 'Event registration update',
          message: `Your registration request for ${approval.eventData.eventTitle} was rejected.`,
          type: 'approval',
          audience: 'user',
          userEmail: approval.eventData.volunteerEmail,
          link: '/dashboard/events',
        });
      }
      setApprovals(approvals.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a)));
      toast.success('Request rejected');
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Could not reject request. Please try again.');
    }
  };

  const typeIcons: Record<string, any> = {
    user: Users,
    donation: FileText,
    event: FileText,
    beneficiary: User,
  };

  const typeColors: Record<string, string> = {
    user: 'bg-blue-500/10 text-blue-600',
    donation: 'bg-green-500/10 text-green-600',
    event: 'bg-purple-500/10 text-purple-600',
    beneficiary: 'bg-orange-500/10 text-orange-600',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    approved: 'bg-green-500/10 text-green-600',
    rejected: 'bg-red-500/10 text-red-600',
  };

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Approvals & Requests</h1>
          <p className="text-muted-foreground mt-1">Review and approve pending requests</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 text-yellow-600">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">{pendingCount} Pending</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-600">
            {approvals.filter((a) => a.status === 'approved').length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">
            {approvals.filter((a) => a.status === 'rejected').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {approvals.map((approval) => {
          const TypeIcon = typeIcons[approval.type];
          return (
            <div key={approval.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl ${typeColors[approval.type]} flex items-center justify-center`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{approval.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[approval.status]}`}>
                        {approval.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs capitalize">
                        {approval.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{approval.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Requested by: {approval.requestedBy}</span>
                      <span>Date: {new Date(approval.requestedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {approval.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApprove(approval.id)}
                      className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReject(approval.id)}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {approvals.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        )}
      </div>
    </div>
  );
}
