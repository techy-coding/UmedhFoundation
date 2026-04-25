import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Users, Target, DollarSign, Heart, Calendar, CheckSquare, Clock, Award, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  subscribeToDonations,
  type Donation,
} from '../../services/donations';
import {
  subscribeToCampaigns,
  type CampaignRecord,
} from '../../services/campaigns';
import {
  subscribeToUsers,
  type UserRecord,
} from '../../services/users';
import {
  subscribeToBeneficiaries,
} from '../../services/beneficiaries';
import { subscribeToEvents, type EventRecord } from '../../services/events';
import { setTaskStatus, subscribeToTasks, type TaskRecord } from '../../services/tasks';
import {
  createAchievement,
  subscribeToAchievements,
  type AchievementRecord,
} from '../../services/achievements';

import { DonorDashboard } from './DonorDashboard';
import { VolunteerDashboard } from './VolunteerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { BeneficiaryDashboard } from './BeneficiaryDashboard';

function StatCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
      className="bg-card rounded-2xl p-6 border border-border"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-muted-foreground text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </motion.div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { role, userEmail, userName } = useRole();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribeDonations = subscribeToDonations(setDonations);
    const unsubscribeCampaigns = subscribeToCampaigns(setCampaigns);
    const unsubscribeUsers = subscribeToUsers(setUsers);
    const unsubscribeBeneficiaries = subscribeToBeneficiaries(setBeneficiaries);

    if (role === 'volunteer') {
      const unsubscribeEvents = subscribeToEvents(setEvents);
      const unsubscribeTasks = subscribeToTasks(setTasks);
      const unsubscribeAchievements = subscribeToAchievements(setAchievements);
      return () => {
        unsubscribeDonations();
        unsubscribeCampaigns();
        unsubscribeUsers();
        unsubscribeBeneficiaries();
        unsubscribeEvents();
        unsubscribeTasks();
        unsubscribeAchievements();
      };
    }

    return () => {
      unsubscribeDonations();
      unsubscribeCampaigns();
      unsubscribeUsers();
      unsubscribeBeneficiaries();
    };
  }, [role]);

  // Volunteer-specific data
  const activeVolunteers = useMemo(
    () => users.filter((user) => user.role === 'volunteer' && user.status === 'active'),
    [users]
  );

  const openEvents = useMemo(
    () =>
      events.filter(
        (event) => new Date(event.date).getTime() >= new Date().setHours(0, 0, 0, 0)
      ),
    [events]
  );

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.assignedToEmail && task.assignedToEmail.toLowerCase() === userEmail.toLowerCase()
      ),
    [tasks, userEmail]
  );

  const myAchievements = useMemo(
    () =>
      achievements.filter(
        (item) => item.volunteerEmail.toLowerCase() === userEmail.toLowerCase()
      ),
    [achievements, userEmail]
  );

  const pendingTasks = useMemo(
    () => myTasks.filter((task) => task.status !== 'completed'),
    [myTasks]
  );

  // Admin/general data
  const totalDonations = useMemo(
    () => donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
    [donations]
  );

  const recentDonations = useMemo(() => donations.slice(0, 6), [donations]);

  const insights = useMemo(
    () => [
      `${campaigns.filter((campaign) => campaign.status === 'active').length} active campaigns live right now`,
      `${users.filter((user) => user.role === 'volunteer').length} volunteers registered in the platform`,
      `${beneficiaries.length} beneficiaries currently tracked in Firebase`,
    ],
    [beneficiaries.length, campaigns, users]
  );

  // Staff-controlled task completion handler
  const handleToggleComplete = async (task: TaskRecord) => {
    // Only staff users can toggle task completion
    if (role !== 'staff' && role !== 'admin') {
      toast.error('Only staff members can mark tasks as complete.');
      return;
    }

    if (task.status === 'completed') {
      try {
        setUpdatingTaskId(task.id);
        await setTaskStatus(task, 'pending');
        toast.success('Task re-opened.');
      } catch (error) {
        console.error('Failed to reopen task:', error);
        toast.error('Could not update task status.');
      } finally {
        setUpdatingTaskId(null);
      }
      return;
    }

    try {
      setUpdatingTaskId(task.id);
      await setTaskStatus(task, 'completed');
      
      // Create achievement for the volunteer who was assigned the task
      await createAchievement({
        title: task.title,
        description:
          task.description ||
          `Completed volunteer task "${task.title}"${task.location ? ` at ${task.location}` : ''}.`,
        volunteerEmail: task.assignedToEmail,
        volunteerName: task.assignedToName || 'Volunteer',
        taskId: task.id,
        category: task.category || 'general',
        icon: '🏅',
        points: task.points ?? 10,
      });
      
      toast.success(`Task completed for ${task.assignedToName}! Achievement added.`);
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Could not mark task complete. Please try again.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // If user is volunteer, show volunteer dashboard content
  if (role === 'volunteer') {
    const stats = [
      {
        label: 'Total Volunteers',
        value: activeVolunteers.length.toString(),
        icon: Users,
        color: 'from-[#FF6B35] to-[#FF8B35]',
      },
      {
        label: 'Open Events',
        value: openEvents.length.toString(),
        icon: Clock,
        color: 'from-[#6C5CE7] to-[#8C7CE7]',
      },
      {
        label: 'Active Programs',
        value: events.length.toString(),
        icon: Target,
        color: 'from-[#FFD93D] to-[#FFE93D]',
      },
      {
        label: 'My Assigned Events',
        value: myTasks.length.toString(),
        icon: Award,
        color: 'from-[#4ECDC4] to-[#6EDDC4]',
      },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2">Volunteer Dashboard</h1>
            <p className="text-muted-foreground">
              {userName ? `Welcome back, ${userName}. ` : ''}Track your tasks, progress and impact.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/events')}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg"
          >
            Browse Events
          </motion.button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-heading font-semibold">My Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingTasks.length > 0
                    ? `${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} waiting for you`
                    : 'All caught up — no pending tasks'}
                </p>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {myAchievements.length} earned
              </span>
            </div>

            {myTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">No tasks assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Staff will assign tasks to you here. Meanwhile, browse events to get involved.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const isBusy = updatingTaskId === task.id;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={`p-4 rounded-xl border transition-colors ${
                        isCompleted
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-muted/30 border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(task)}
                          disabled={isBusy || !['staff', 'admin'].includes(role)}
                          aria-label={
                            ['staff', 'admin'].includes(role)
                              ? isCompleted ? 'Mark task as pending' : 'Mark task as complete'
                              : isCompleted ? 'Task completed by staff' : 'Task pending staff approval'
                          }
                          className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : ['staff', 'admin'].includes(role)
                                ? 'border-muted-foreground hover:border-primary'
                                : 'border-muted-foreground cursor-not-allowed'
                          } ${isBusy ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          {isCompleted && (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4
                                className={`font-semibold ${
                                  isCompleted ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs capitalize shrink-0 ${
                                isCompleted
                                  ? 'bg-green-500/10 text-green-600'
                                  : task.status === 'in-progress'
                                    ? 'bg-yellow-500/10 text-yellow-600'
                                    : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Due {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {task.location}
                              </span>
                            )}
                            {task.priority && (
                              <span className="capitalize">{task.priority} priority</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-xl font-heading font-semibold mb-4">Upcoming Events</h3>
            {openEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events scheduled yet.</p>
            ) : (
              <div className="space-y-4">
                {openEvents.slice(0, 4).map((event) => {
                  const needed = Number(event.volunteersNeeded || 0);
                  const progress = needed > 0 ? (event.volunteersRegistered / needed) * 100 : 0;
                  return (
                    <div key={event.id} className="p-4 bg-muted/30 rounded-xl">
                      <h4 className="font-medium mb-2">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(event.date)}
                        {event.time ? ` • ${event.time}` : ''}
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Registrations</span>
                        <span className="font-medium">
                          {event.volunteersRegistered}/{needed || 0}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/events')}
                  className="w-full mt-2 px-4 py-2 border border-border rounded-xl text-sm hover:bg-muted transition-colors"
                >
                  View all events
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Live admin summary from Firebase data.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Last updated from live subscriptions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} title="Total Donations" value={`₹${totalDonations.toLocaleString()}`} />
        <StatCard icon={Users} title="Users" value={users.length.toLocaleString()} />
        <StatCard icon={Heart} title="Beneficiaries" value={beneficiaries.length.toLocaleString()} />
        <StatCard icon={Calendar} title="Campaigns" value={campaigns.length.toLocaleString()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-heading font-semibold mb-6">Recent Donation Activity</h3>
          {recentDonations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No donations recorded yet.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-auto">
              {recentDonations.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center text-white font-semibold">
                    {(activity.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName || activity.userEmail || 'Anonymous donor'}</span>{' '}
                      donated <span className="font-semibold text-primary">₹{Number(activity.amount || 0).toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-heading font-semibold mb-6">Platform Insights</h3>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight} className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
                {insight}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
