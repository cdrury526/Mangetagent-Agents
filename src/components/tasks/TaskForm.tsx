import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TransactionSelector } from './TransactionSelector';
import { DatePicker } from '../forms/DatePicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task, TaskPhase } from '../../types/database';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  parentTask?: Task;
  initialSubtasks?: Task[];
  onSubmit: (data: Partial<Task>, newSubtasks: string[], subtaskIdsToDelete: string[]) => void;
  agentId: string;
  transactionId?: string | null;
  showTransactionSelector?: boolean;
}

export function TaskForm({
  isOpen,
  onClose,
  task,
  parentTask,
  initialSubtasks = [],
  onSubmit,
  agentId,
  transactionId,
  showTransactionSelector = false,
}: TaskFormProps) {
  const isSubtask = !!parentTask || !!task?.parent_task_id;

  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    phase: task?.phase || '',
    due_date: task?.due_date || '',
    transaction_id: task?.transaction_id || transactionId || null,
    transaction_name: '',
  });

  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskIdsToDelete, setSubtaskIdsToDelete] = useState<string[]>([]);
  const [currentSubtaskInput, setCurrentSubtaskInput] = useState('');

  // Reset form state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: task?.name || '',
        description: task?.description || '',
        phase: task?.phase || '',
        due_date: task?.due_date || '',
        transaction_id: task?.transaction_id || transactionId || null,
        transaction_name: '',
      });
      setNewSubtasks([]);
      setSubtaskIdsToDelete([]);
      setCurrentSubtaskInput('');
    }
  }, [isOpen, task, transactionId]);

  // Filter out deleted initial subtasks for display
  const visibleInitialSubtasks = initialSubtasks.filter(
    (st) => !subtaskIdsToDelete.includes(st.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { transaction_name, ...taskData } = formData;
    
    onSubmit(
      {
        ...taskData,
        description: taskData.description || null,
        phase: isSubtask ? null : (taskData.phase as TaskPhase | null),
        due_date: isSubtask ? null : (taskData.due_date || null),
        transaction_id: taskData.transaction_id,
      },
      newSubtasks,
      subtaskIdsToDelete
    );
  };

  const handleAddSubtask = () => {
    if (!currentSubtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, currentSubtaskInput.trim()]);
    setCurrentSubtaskInput('');
  };

  const handleRemoveNewSubtask = (index: number) => {
    setNewSubtasks(newSubtasks.filter((_, i) => i !== index));
  };

  const handleRemoveInitialSubtask = (id: string) => {
    setSubtaskIdsToDelete([...subtaskIdsToDelete, id]);
  };

  const handleTransactionChange = (transactionId: string | null, transactionName?: string) => {
    setFormData({
      ...formData,
      transaction_id: transactionId,
      transaction_name: transactionName || '',
    });
  };

  const titleText = task
    ? (isSubtask ? 'Edit Subtask' : 'Edit Task')
    : (isSubtask ? 'New Subtask' : 'New Task');

  const descriptionText = isSubtask && parentTask
    ? `Parent: ${parentTask.name}`
    : !isSubtask && !showTransactionSelector && transactionId
      ? 'Linked to current transaction'
      : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          {descriptionText && (
            <DialogDescription className={isSubtask ? 'text-gray-500' : 'text-emerald-600'}>
              {descriptionText}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isSubtask ? 'Subtask' : 'Task'} Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isSubtask ? 'Enter subtask name' : 'Enter task name'}
            />
          </div>

          {!isSubtask && showTransactionSelector && (
            <TransactionSelector
              value={formData.transaction_id}
              onChange={handleTransactionChange}
              agentId={agentId}
            />
          )}

          {!isSubtask && (
            <DatePicker
              label="Due Date"
              value={formData.due_date}
              onChange={(value) => setFormData({ ...formData, due_date: value })}
            />
          )}

          {!isSubtask && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtasks
              </label>
              
              {/* List existing subtasks */}
              <div className="space-y-2 mb-3">
                {visibleInitialSubtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span className="truncate">{st.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInitialSubtask(st.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {newSubtasks.map((stName, idx) => (
                  <div key={`new-${idx}`} className="flex items-center justify-between bg-blue-50 p-2 rounded text-sm border border-blue-100">
                    <span className="truncate">{stName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewSubtask(idx)}
                      className="text-blue-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSubtaskInput}
                  onChange={(e) => setCurrentSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Add a subtask..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!currentSubtaskInput.trim()}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {isSubtask && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Subtasks are simple action items without due dates or phases. They inherit these from their parent task.
              </p>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}