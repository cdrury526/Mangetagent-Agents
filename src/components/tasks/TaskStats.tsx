import { CheckCircle, Circle, AlertCircle, Clock } from 'lucide-react';
import type { Task } from '../../types/database';

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const totalTasks = tasks.filter((t) => !t.parent_task_id).length;
  const completedTasks = tasks.filter((t) => !t.parent_task_id && t.completed).length;
  const incompleteTasks = totalTasks - completedTasks;

  const overdueTasks = tasks.filter((t) => {
    if (t.parent_task_id || t.completed || !t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const dueSoonTasks = tasks.filter((t) => {
    if (t.parent_task_id || t.completed || !t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    return dueDate >= today && dueDate <= threeDaysFromNow;
  }).length;

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Circle,
      color: 'from-slate-600 to-slate-700',
      bgColor: 'from-slate-50 to-slate-100',
    },
    {
      label: 'Incomplete',
      value: incompleteTasks,
      icon: Circle,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle,
      color: 'from-green-600 to-green-700',
      bgColor: 'from-green-50 to-green-100',
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'from-red-600 to-red-700',
      bgColor: 'from-red-50 to-red-100',
    },
    {
      label: 'Due Soon',
      value: dueSoonTasks,
      icon: Clock,
      color: 'from-orange-600 to-orange-700',
      bgColor: 'from-orange-50 to-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.bgColor} border border-gray-200 p-4 transition-all hover:shadow-md`}
          >
            <div className="flex flex-col">
              <p className="text-xs font-medium text-gray-600 mb-1">{stat.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
