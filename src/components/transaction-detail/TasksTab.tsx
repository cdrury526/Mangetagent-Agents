import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { TaskList } from '../tasks/TaskList';
import { TaskForm } from '../tasks/TaskForm';
import type { Task } from '../../types/database';

interface TasksTabProps {
  transactionId: string;
}

export function TasksTab({ transactionId }: TasksTabProps) {
  const { user } = useAuth();
  const {
    parentTasksWithSubtasks,
    loading,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    deleteTaskWithSubtasks,
    toggleComplete,
    getSubtasks,
  } = useTasks(transactionId);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);

  const handleCreateTask = async (
    taskData: Partial<Task>,
    newSubtasks: string[] = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subtaskIdsToDelete: string[] = []
  ) => {
    try {
      const newTask = await createTask({
        agent_id: user!.id,
        transaction_id: transactionId,
        parent_task_id: null,
        name: taskData.name!,
        description: taskData.description || null,
        phase: taskData.phase || null,
        due_date: taskData.due_date || null,
        completed: false,
        completed_at: null,
        sort_order: null,
      });

      if (newTask && newSubtasks.length > 0) {
        await Promise.all(
          newSubtasks.map((name) =>
            createSubtask(newTask.id, {
              agent_id: user!.id,
              transaction_id: transactionId,
              name,
              description: null,
            })
          )
        );
      }
      setShowForm(false);
    } catch (err: unknown) {
      alert('Failed to create task: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCreateSubtask = async (taskData: Partial<Task>) => {
    if (!parentTaskForSubtask) return;
    try {
      await createSubtask(parentTaskForSubtask.id, {
        agent_id: user!.id,
        transaction_id: transactionId,
        name: taskData.name!,
        description: taskData.description || null,
      });
      setParentTaskForSubtask(null);
    } catch (err: unknown) {
      alert('Failed to create subtask: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleUpdateTask = async (
    taskData: Partial<Task>,
    newSubtasks: string[] = [],
    subtaskIdsToDelete: string[] = []
  ) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, taskData);

      if (newSubtasks.length > 0) {
        await Promise.all(
          newSubtasks.map((name) =>
            createSubtask(editingTask.id, {
              agent_id: user!.id,
              transaction_id: transactionId,
              name,
              description: null,
            })
          )
        );
      }

      if (subtaskIdsToDelete.length > 0) {
        await Promise.all(subtaskIdsToDelete.map((id) => deleteTask(id)));
      }

      setEditingTask(null);
    } catch (err: unknown) {
      alert('Failed to update task: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const subtasks = getSubtasks(task.id);
    const hasSubtasks = subtasks.length > 0;

    const message = hasSubtasks
      ? `This task has ${subtasks.length} subtask(s). Deleting it will also delete all subtasks. Are you sure?`
      : 'Are you sure you want to delete this task?';

    if (!confirm(message)) return;

    try {
      if (hasSubtasks) {
        await deleteTaskWithSubtasks(task.id);
      } else {
        await deleteTask(task.id);
      }
    } catch (err: unknown) {
      alert('Failed to delete task: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await toggleComplete(task.id, task.completed);
    } catch (err: unknown) {
      alert('Failed to update task: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
      </div>

      {parentTasksWithSubtasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          No tasks yet. Create your first task to get started.
        </div>
      ) : (
        <TaskList
          tasks={parentTasksWithSubtasks}
          onToggleComplete={handleToggleComplete}
          onEdit={setEditingTask}
          onDelete={handleDeleteTask}
          onAddSubtask={setParentTaskForSubtask}
          getSubtasks={getSubtasks}
        />
      )}

      <TaskForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateTask}
        agentId={user!.id}
        transactionId={transactionId}
      />

      <TaskForm
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask ?? undefined}
        parentTask={editingTask?.parent_task_id ? parentTasksWithSubtasks.find((p) => p.id === editingTask.parent_task_id) : undefined}
        initialSubtasks={editingTask && !editingTask.parent_task_id ? getSubtasks(editingTask.id) : []}
        onSubmit={handleUpdateTask}
        agentId={user!.id}
        transactionId={transactionId}
      />

      <TaskForm
        isOpen={!!parentTaskForSubtask}
        onClose={() => setParentTaskForSubtask(null)}
        parentTask={parentTaskForSubtask ?? undefined}
        onSubmit={handleCreateSubtask}
        agentId={user!.id}
        transactionId={transactionId}
      />
    </div>
  );
}
