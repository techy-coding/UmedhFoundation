import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckSquare, Calendar, Clock, Award, Users, Target, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { subscribeToEvents, type EventRecord } from '../../services/events';
import { subscribeToUsers, type UserRecord } from '../../services/users';
import { setTaskStatus, subscribeToTasks, type TaskRecord } from '../../services/tasks';
import {
  createAchievement,
  subscribeToAchievements,
  type AchievementRecord,
} from '../../services/achievements';

export function VolunteerDashboard() {
  const navigate = useNavigate();
  const { userEmail, userName } = useRole();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => subscribeToEvents(setEvents), []);
  useEffect(() => subscribeToUsers(setUsers), []);
  useEffect(() => subscribeToTasks(setTasks), []);
  useEffect(() => subscribeToAchievements(setAchievements), []);

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

  const handleToggleComplete = async (task: TaskRecord) => {
    if (task.status === 'completed') {
      // Optional toggle back to pending (does not remove achievement automatically).
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
      await createAchievement({
        title: task.title,
        description:
          task.description ||
          `Completed volunteer task "${task.title}"${task.location ? ` at ${task.location}` : ''}.`,
        volunteerEmail: userEmail,
        volunteerName: userName || task.assignedToName || 'Volunteer',
        taskId: task.id,
        category: task.category || 'general',
        icon: '🏅',
        points: task.points ?? 10,
      });
      toast.success('Task completed and added to your achievements!');
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
              key={`${stat.label}-${stat.value}`}
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
              <p key={stat.value} className="text-3xl font-bold">{stat.value}</p>
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
                        disabled={isBusy}
                        aria-label={
                          isCompleted ? 'Mark task as pending' : 'Mark task as complete'
                        }
                        className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-muted-foreground hover:border-primary'
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
