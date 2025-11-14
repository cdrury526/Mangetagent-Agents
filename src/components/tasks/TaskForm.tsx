import { useState } from 'react';
import { X } from 'lucide-react';
import { TransactionSelector } from './TransactionSelector';
import type { Task } from '../../types/database';

interface TaskFormProps {
  task?: Task;
  parentTask?: Task;
  onSubmit: (data: Partial<Task>) => void;
  onCancel: () => void;
  agentId: string;
  transactionId?: string | null;
  showTransactionSelector?: boolean;
}

export function TaskForm({
  task,
  parentTask,
  onSubmit,
  onCancel,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { transaction_name, ...taskData } = formData;
    onSubmit({
      ...taskData,
      description: taskData.description || null,
      phase: isSubtask ? null : (taskData.phase || null),
      due_date: isSubtask ? null : (taskData.due_date || null),
      transaction_id: taskData.transaction_id,
    });
  };

  const handleTransactionChange = (transactionId: string | null, transactionName?: string) => {
    setFormData({
      ...formData,
      transaction_id: transactionId,
      transaction_name: transactionName || '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {task ? (isSubtask ? 'Edit Subtask' : 'Edit Task') : (isSubtask ? 'New Subtask' : 'New Task')}
            </h3>
            {isSubtask && parentTask && (
              <p className="text-sm text-gray-500 mt-1">
                Parent: {parentTask.name}
              </p>
            )}
            {!isSubtask && !showTransactionSelector && transactionId && (
              <p className="text-sm text-emerald-600 mt-1">
                Linked to current transaction
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isSubtask ? 'Add subtask description (optional)' : 'Add task description (optional)'}
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
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase
                </label>
                <select
                  value={formData.phase}
                  onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select phase</option>
                  <option value="pre_offer">Pre-Offer</option>
                  <option value="offer">Offer</option>
                  <option value="inspection">Inspection</option>
                  <option value="appraisal">Appraisal</option>
                  <option value="financing">Financing</option>
                  <option value="closing">Closing</option>
                  <option value="post_closing">Post-Closing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {isSubtask && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Subtasks are simple action items without due dates or phases. They inherit these from their parent task.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
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
          </div>
        </form>
      </div>
    </div>
  );
}
