import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Award, Calendar, Target, Trophy, Star, Clock } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { subscribeToAchievements, type AchievementRecord } from '../../services/achievements';
import { subscribeToTasks, type TaskRecord } from '../../services/tasks';

export function AchievementsPage() {
  const { userEmail, userName } = useRole();
  const [achievements, setAchievements] = useState<AchievementRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  useEffect(() => subscribeToAchievements(setAchievements), []);
  useEffect(() => subscribeToTasks(setTasks), []);

  const myAchievements = useMemo(
    () =>
      achievements.filter(
        (item) => item.volunteerEmail.toLowerCase() === userEmail.toLowerCase()
      ),
    [achievements, userEmail]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.assignedToEmail &&
          task.assignedToEmail.toLowerCase() === userEmail.toLowerCase() &&
          task.status === 'completed'
      ),
    [tasks, userEmail]
  );

  const totalPoints = useMemo(
    () => myAchievements.reduce((sum, achievement) => sum + (achievement.points || 0), 0),
    [myAchievements]
  );

  const achievedCompletedTaskCount = useMemo(() => {
    if (completedTasks.length === 0) {
      return 0;
    }

    const achievementTaskIds = new Set(
      myAchievements.map((achievement) => achievement.taskId).filter(Boolean)
    );

    return completedTasks.filter((task) => achievementTaskIds.has(task.id)).length;
  }, [completedTasks, myAchievements]);

  const achievementRate = useMemo(
    () =>
      completedTasks.length > 0
        ? Math.round((achievedCompletedTaskCount / completedTasks.length) * 100)
        : 0,
    [achievedCompletedTaskCount, completedTasks.length]
  );

  const recentAchievements = useMemo(
    () => [...myAchievements].sort((a, b) => new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime()).slice(0, 6),
    [myAchievements]
  );

  const stats = [
    {
      label: 'Total Achievements',
      value: myAchievements.length.toString(),
      icon: Trophy,
      color: 'from-[#FF6B35] to-[#FF8B35]',
    },
    {
      label: 'Total Points',
      value: totalPoints.toString(),
      icon: Star,
      color: 'from-[#6C5CE7] to-[#8C7CE7]',
    },
    {
      label: 'Completed Tasks',
      value: completedTasks.length.toString(),
      icon: Target,
      color: 'from-[#FFD93D] to-[#FFE93D]',
    },
    {
      label: 'Achievement Rate',
      value: `${achievementRate}%`,
      icon: Award,
      color: 'from-[#4ECDC4] to-[#6EDDC4]',
    },
  ];

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      general: '🏆',
      event: '🎉',
      community: '🤝',
      education: '📚',
      health: '🏥',
      environment: '🌱',
    };
    return icons[category] || '🏅';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">My Achievements</h1>
          <p className="text-muted-foreground">
            {userName ? `Congratulations ${userName}! ` : ''}Track your accomplishments and earned badges.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy className="w-4 h-4" />
          <span>{totalPoints} total points earned</span>
        </div>
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
              <h3 className="text-xl font-heading font-semibold">Recent Achievements</h3>
              <p className="text-sm text-muted-foreground">
                {myAchievements.length > 0
                  ? `${myAchievements.length} achievement${myAchievements.length === 1 ? '' : 's'} earned`
                  : 'Complete tasks to earn achievements'}
              </p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              Level {Math.floor(totalPoints / 100) + 1}
            </span>
          </div>

          {myAchievements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Trophy className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No achievements yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete volunteer tasks to start earning achievements and badges!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAchievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{getCategoryIcon(achievement.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{achievement.title}</h4>
                          {achievement.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-600">
                            {achievement.points || 10} pts
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(achievement.earnedDate)}
                          </p>
                        </div>
                      </div>
                      {achievement.category && (
                        <div className="mt-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary capitalize">
                            {achievement.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-4">Progress Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Level</span>
                <span className="text-lg font-bold">Level {Math.floor(totalPoints / 100) + 1}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                  style={{ width: `${(totalPoints % 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {100 - (totalPoints % 100)} points to next level
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasks Completed</span>
                <span className="font-medium">{completedTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Achievement Rate</span>
                <span className="font-medium">{achievementRate}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Points</span>
                <span className="font-medium">{totalPoints}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Keep up the great work!</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.min(5, Math.floor(totalPoints / 200) + 1)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
