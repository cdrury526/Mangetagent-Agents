import { Check, Trash2, ChevronRight, ChevronDown, ListPlus } from 'lucide-react';
import type { Task } from '../../types/database';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask?: () => void;
  hasSubtasks?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  isSubtask?: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  completionPercentage?: number;
  transactionName?: string;
}

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  hasSubtasks,
  isExpanded,
  onToggleExpanded,
  isSubtask,
  subtaskCount,
  completedSubtaskCount,
  completionPercentage,
  transactionName,
}: TaskItemProps) {
  const formatDate = (date: string | null) => {
    if (!date) return null;
    const dateObj = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);

    if (dateObj.getTime() === today.getTime()) return 'Today';
    if (dateObj.getTime() === tomorrow.getTime()) return 'Tomorrow';

    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear().toString().slice(-2);

    return `${month} ${day}, ${year}`;
  };

  const isOverdue = (date: string | null) => {
    if (!date || task.completed) return false;
    const dueDate = new Date(date);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const isDueSoon = (date: string | null) => {
    if (!date || task.completed) return false;
    const dueDate = new Date(date);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    threeDaysFromNow.setHours(0, 0, 0, 0);

    return dueDate >= today && dueDate <= threeDaysFromNow;
  };

  const overdue = isOverdue(task.due_date);
  const dueSoon = isDueSoon(task.due_date);

  return (
    <div className={`flex items-start p-4 hover:bg-gray-50 transition-colors ${isSubtask ? 'pl-12 bg-gray-50/50' : ''}`}>
      {isSubtask && (
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-300" />
      )}

      <div className="flex items-start flex-1 min-w-0">
        {!isSubtask && hasSubtasks && onToggleExpanded && (
          <button
            onClick={onToggleExpanded}
            className="mr-2 text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={() => onToggleComplete(task)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
            task.completed
              ? 'bg-green-600 border-green-600'
              : overdue
              ? 'border-red-500 hover:border-red-600'
              : dueSoon
              ? 'border-orange-500 hover:border-orange-600'
              : 'border-gray-300 hover:border-blue-600'
          }`}
        >
          {task.completed && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium break-words ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {task.name}
              </p>
              {task.description && (
                <p className="text-sm text-gray-500 mt-1 break-words">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 mt-2">
            {!isSubtask && task.due_date && (
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  task.completed
                    ? 'bg-gray-100 text-gray-500'
                    : overdue
                    ? 'bg-red-100 text-red-700'
                    : dueSoon
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {formatDate(task.due_date)}
              </span>
            )}
            {!isSubtask && !task.transaction_id && (
              <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                Personal Task
              </span>
            )}
            {!isSubtask && transactionName && (
              <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">
                {transactionName}
              </span>
            )}
            {!isSubtask && hasSubtasks && completionPercentage !== undefined && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-blue-700">
                  {Math.round(completionPercentage)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ml-4 flex items-center gap-2 flex-shrink-0">
        {!isSubtask && onAddSubtask && (
          <button
            onClick={onAddSubtask}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Add subtask"
          >
            <ListPlus className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-blue-600 transition-colors text-xs font-medium"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
