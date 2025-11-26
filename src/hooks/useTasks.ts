import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskWithSubtasks } from '../types/database';
import { getErrorMessage } from '../utils/errorHandler';

interface UseTasksOptions {
  transactionId?: string | null;
  agentId?: string;
}

export function useTasks(options: UseTasksOptions | string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { transactionId, agentId } = typeof options === 'string'
    ? { transactionId: options, agentId: undefined }
    : typeof options === 'object' && options !== null
    ? options
    : { transactionId: undefined, agentId: undefined };

  useEffect(() => {
    if (!transactionId && !agentId) {
      setLoading(false);
      return;
    }

    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: transactionId ? `transaction_id=eq.${transactionId}` : undefined,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, agentId]); // fetchTasks is intentionally excluded - it's stable and including it would cause infinite loops

  const parentTasks = useMemo(() => {
    return tasks.filter((t) => !t.parent_task_id);
  }, [tasks]);

  const parentTasksWithSubtasks = useMemo((): TaskWithSubtasks[] => {
    return parentTasks.map((parent) => {
      const subtasks = tasks.filter((t) => t.parent_task_id === parent.id);
      const completedSubtasks = subtasks.filter((t) => t.completed);
      const subtaskCount = subtasks.length;
      const completedSubtaskCount = completedSubtasks.length;
      const completionPercentage = subtaskCount > 0
        ? Math.round((completedSubtaskCount / subtaskCount) * 100)
        : 0;

      return {
        ...parent,
        parent_task_id: null,
        subtasks,
        subtaskCount,
        completedSubtaskCount,
        completionPercentage,
      } as TaskWithSubtasks;
    });
  }, [tasks, parentTasks]);

  const getSubtasks = (parentId: string) => {
    return tasks.filter((t) => t.parent_task_id === parentId);
  };

  async function fetchTasks() {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*');

      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      } else if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error: fetchError } = await query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setTasks(data || []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    const { data: created, error: createError } = await supabase
      .from('tasks')
      .insert([data])
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }

  async function createSubtask(parentId: string, data: { name: string; description?: string | null; agent_id: string; transaction_id: string }) {
    const { data: created, error: createError } = await supabase
      .from('tasks')
      .insert([{
        agent_id: data.agent_id,
        transaction_id: data.transaction_id,
        parent_task_id: parentId,
        name: data.name,
        description: data.description || null,
        phase: null,
        due_date: null,
        completed: false,
        completed_at: null,
        sort_order: null,
      }])
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  async function deleteTask(id: string) {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);

    if (deleteError) throw deleteError;
  }

  async function deleteTaskWithSubtasks(id: string) {
    const subtasks = tasks.filter((t) => t.parent_task_id === id);

    if (subtasks.length > 0) {
      const subtaskIds = subtasks.map((t) => t.id);
      const { error: deleteSubtasksError } = await supabase
        .from('tasks')
        .delete()
        .in('id', subtaskIds);

      if (deleteSubtasksError) throw deleteSubtasksError;
    }

    return deleteTask(id);
  }

  async function toggleComplete(id: string, currentValue: boolean) {
    const updates: Partial<Task> = {
      completed: !currentValue,
      completed_at: !currentValue ? new Date().toISOString() : null,
    };
    return updateTask(id, updates);
  }

  async function reorderTasks(reorderedTasks: Task[]) {
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      sort_order: index,
    }));

    const promises = updates.map((update) =>
      supabase
        .from('tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      throw new Error('Failed to reorder tasks');
    }
  }

  return {
    tasks,
    parentTasks,
    parentTasksWithSubtasks,
    loading,
    error,
    createTask,
    createSubtask,
    updateTask,
    deleteTask,
    deleteTaskWithSubtasks,
    toggleComplete,
    reorderTasks,
    getSubtasks,
    refetch: fetchTasks,
  };
}
