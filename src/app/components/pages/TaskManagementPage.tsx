import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Users, Calendar, MapPin, Clock, CheckCircle, X, Edit, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { subscribeToTasks, type TaskRecord, createTask, updateTask, deleteTask, setTaskStatus } from '../../services/tasks';
import { createAchievement } from '../../services/achievements';
import { subscribeToUsers, type UserRecord } from '../../services/users';
import { subscribeToEvents, type EventRecord } from '../../services/events';

export function TaskManagementPage() {
  const { role, userName, userEmail } = useRole();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToEmail: '',
    assignedToName: '',
    dueDate: '',
    location: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high',
    eventId: '',
    points: 10,
  });
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => subscribeToTasks(setTasks), []);
  useEffect(() => subscribeToUsers(setUsers), []);
  useEffect(() => subscribeToEvents(setEvents), []);

  // Filter volunteers only
  const volunteers = users.filter(user => user.role === 'volunteer');
  const upcomingEvents = events.filter(event => new Date(event.date).getTime() >= new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assignedToEmail || !formData.title || !formData.dueDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      const assignedVolunteer = volunteers.find(v => v.email === formData.assignedToEmail);
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignedToEmail: formData.assignedToEmail,
        assignedToName: assignedVolunteer?.name || '',
        dueDate: formData.dueDate,
        location: formData.location || undefined,
        category: formData.category || undefined,
        priority: formData.priority,
        createdBy: userEmail || '',
        eventId: formData.eventId || undefined,
        points: formData.points,
      };

      if (editingTask) {
        await updateTask(editingTask.id, taskData, editingTask);
        toast.success('Task updated successfully!');
      } else {
        await createTask(taskData);
        toast.success('Task assigned successfully!');
      }

      setShowCreateForm(false);
      setEditingTask(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Could not save task. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedToEmail: '',
      assignedToName: '',
      dueDate: '',
      location: '',
      category: 'general',
      priority: 'medium',
      eventId: '',
      points: 10,
    });
  };

  const handleEdit = (task: TaskRecord) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignedToEmail: task.assignedToEmail,
      assignedToName: task.assignedToName,
      dueDate: task.dueDate,
      location: task.location || '',
      category: task.category || 'general',
      priority: task.priority || 'medium',
      eventId: task.eventId || '',
      points: task.points || 10,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteTask(taskId);
      toast.success('Task deleted successfully!');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Could not delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (task: TaskRecord) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-yellow-500/10 text-yellow-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const assignedVolunteer = volunteers.find(v => v.email === formData.assignedToEmail);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Task Management</h1>
          <p className="text-muted-foreground">Assign and manage tasks for volunteers</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingTask(null);
            resetForm();
            setShowCreateForm(!showCreateForm);
          }}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
        >
          {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showCreateForm ? 'Cancel' : 'Assign Task'}
        </motion.button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: CheckCircle, color: 'from-[#FF6B35] to-[#FF8B35]' },
          { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length, icon: Clock, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, icon: Users, color: 'from-[#FFD93D] to-[#FFE93D]' },
          { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Task Creation Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 border border-border"
        >
          <h2 className="text-2xl font-heading font-bold mb-6">
            {editingTask ? 'Edit Task' : 'Assign New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assign to Volunteer *</label>
                <select
                  value={formData.assignedToEmail}
                  onChange={(e) => setFormData({ ...formData, assignedToEmail: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Select volunteer</option>
                  {volunteers.map((volunteer) => (
                    <option key={volunteer.id} value={volunteer.email}>
                      {volunteer.name} ({volunteer.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="Describe the task requirements"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Points</label>
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Task location (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="community">Community</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Related Event</label>
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">No related event</option>
                {upcomingEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.date}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg"
              >
                {editingTask ? 'Update Task' : 'Assign Task'}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTask(null);
                  resetForm();
                }}
                className="px-6 py-3 border border-border rounded-xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tasks assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first task to get started</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      disabled={updatingTaskId === task.id}
                      aria-label={
                        task.status === 'completed' ? 'Mark task as pending' : 'Mark task as complete'
                      }
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-muted-foreground hover:border-primary'
                      } ${updatingTaskId === task.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {task.status === 'completed' && (
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
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${getPriorityColor(task.priority || 'medium')}`}>
                      {task.priority}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {task.points} points
                    </span>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assigned to: {task.assignedToName} ({task.assignedToEmail})
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    {task.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {task.location}
                      </div>
                    )}
                    {task.eventId && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Related to event
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(task)}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(task.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
