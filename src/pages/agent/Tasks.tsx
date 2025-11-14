import { useState, useEffect, useMemo } from 'react';
import { Plus, CheckSquare } from 'lucide-react';
import { AgentLayout } from '../../components/AgentLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { TaskList } from '../../components/tasks/TaskList';
import { TaskStats } from '../../components/tasks/TaskStats';
import { TaskFilters } from '../../components/tasks/TaskFilters';
import { TaskForm } from '../../components/tasks/TaskForm';
import { supabase } from '../../lib/supabase';
import type { Task, Transaction } from '../../types/database';

export function Tasks() {
  const { user } = useAuth();
  const {
    tasks,
    parentTasksWithSubtasks,
    loading,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    deleteTaskWithSubtasks,
    toggleComplete,
    getSubtasks,
  } = useTasks({ agentId: user?.id });

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'transaction'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'created' | 'phase'>('dueDate');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id]);

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('id, name')
      .eq('agent_id', user!.id);

    if (data) {
      setTransactions(data);
    }
  }

  const transactionNames = useMemo(() => {
    return transactions.reduce((acc, t) => {
      acc[t.id] = t.name;
      return acc;
    }, {} as Record<string, string>);
  }, [transactions]);

  const filteredTasks = useMemo(() => {
    let filtered = [...parentTasksWithSubtasks];

    if (statusFilter === 'incomplete') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }

    if (typeFilter === 'personal') {
      filtered = filtered.filter((t) => !t.transaction_id);
    } else if (typeFilter === 'transaction') {
      filtered = filtered.filter((t) => !!t.transaction_id);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === 'created') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'phase') {
        if (!a.phase && !b.phase) return 0;
        if (!a.phase) return 1;
        if (!b.phase) return -1;
        return a.phase.localeCompare(b.phase);
      }
      return 0;
    });

    return filtered;
  }, [parentTasksWithSubtasks, statusFilter, typeFilter, sortBy]);

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await createTask({
        agent_id: user!.id,
        transaction_id: taskData.transaction_id || null,
        parent_task_id: null,
        name: taskData.name!,
        description: taskData.description || null,
        phase: taskData.phase || null,
        due_date: taskData.due_date || null,
        completed: false,
        completed_at: null,
        sort_order: null,
      });
      setShowForm(false);
    } catch (err: any) {
      alert('Failed to create task: ' + err.message);
    }
  };

  const handleCreateSubtask = async (taskData: Partial<Task>) => {
    if (!parentTaskForSubtask) return;
    try {
      await createSubtask(parentTaskForSubtask.id, {
        agent_id: user!.id,
        transaction_id: parentTaskForSubtask.transaction_id || '',
        name: taskData.name!,
        description: taskData.description || null,
      });
      setParentTaskForSubtask(null);
    } catch (err: any) {
      alert('Failed to create subtask: ' + err.message);
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
    } catch (err: any) {
      alert('Failed to update task: ' + err.message);
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
    } catch (err: any) {
      alert('Failed to delete task: ' + err.message);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await toggleComplete(task.id, task.completed);
    } catch (err: any) {
      alert('Failed to update task: ' + err.message);
    }
  };

  return (
    <AgentLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-1">Manage your personal and transaction tasks</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {!loading && <TaskStats tasks={tasks} />}

        <TaskFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading tasks...</p>
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onAddSubtask={setParentTaskForSubtask}
            getSubtasks={getSubtasks}
            transactionNames={transactionNames}
          />
        )}

        {showForm && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowForm(false)}
            agentId={user!.id}
            showTransactionSelector
          />
        )}

        {editingTask && (
          <TaskForm
            task={editingTask}
            parentTask={editingTask.parent_task_id ? parentTasksWithSubtasks.find((p) => p.id === editingTask.parent_task_id) : undefined}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
            agentId={user!.id}
            showTransactionSelector={!editingTask.parent_task_id}
          />
        )}

        {parentTaskForSubtask && (
          <TaskForm
            parentTask={parentTaskForSubtask}
            onSubmit={handleCreateSubtask}
            onCancel={() => setParentTaskForSubtask(null)}
            agentId={user!.id}
            transactionId={parentTaskForSubtask.transaction_id}
          />
        )}
      </div>
    </AgentLayout>
  );
}
