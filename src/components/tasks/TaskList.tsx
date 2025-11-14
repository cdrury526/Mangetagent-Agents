import { useState } from 'react';
import { TaskItem } from './TaskItem';
import type { Task, TaskWithSubtasks } from '../../types/database';

interface TaskListProps {
  tasks: TaskWithSubtasks[];
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAddSubtask: (task: Task) => void;
  getSubtasks: (parentId: string) => Task[];
  transactionNames?: Record<string, string>;
}

export function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  getSubtasks,
  transactionNames = {},
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
        No tasks found. Create your first task to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const subtasks = getSubtasks(task.id);
        const hasSubtasks = subtasks.length > 0;
        const isExpanded = expandedTasks.has(task.id);
        const transactionName = task.transaction_id ? transactionNames[task.transaction_id] : undefined;

        return (
          <div key={task.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <TaskItem
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              onAddSubtask={() => onAddSubtask(task)}
              hasSubtasks={hasSubtasks}
              isExpanded={isExpanded}
              onToggleExpanded={() => toggleExpanded(task.id)}
              subtaskCount={task.subtaskCount}
              completedSubtaskCount={task.completedSubtaskCount}
              completionPercentage={task.completionPercentage}
              transactionName={transactionName}
            />
            {hasSubtasks && isExpanded && (
              <div className="bg-gray-50/50 border-t border-gray-200">
                {subtasks.map((subtask, index) => (
                  <div
                    key={subtask.id}
                    className={`relative ${index !== subtasks.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <TaskItem
                      task={subtask}
                      onToggleComplete={onToggleComplete}
                      onEdit={() => onEdit(subtask)}
                      onDelete={() => onDelete(subtask)}
                      isSubtask
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
