import { Filter } from 'lucide-react';

interface TaskFiltersProps {
  statusFilter: 'all' | 'incomplete' | 'completed';
  onStatusFilterChange: (filter: 'all' | 'incomplete' | 'completed') => void;
  typeFilter: 'all' | 'personal' | 'transaction';
  onTypeFilterChange: (filter: 'all' | 'personal' | 'transaction') => void;
  sortBy: 'dueDate' | 'created' | 'phase';
  onSortByChange: (sort: 'dueDate' | 'created' | 'phase') => void;
}

export function TaskFilters({
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
}: TaskFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tasks</option>
            <option value="incomplete">Incomplete</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Tasks</option>
            <option value="personal">Personal Tasks</option>
            <option value="transaction">Transaction Tasks</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="dueDate">Due Date</option>
            <option value="created">Created Date</option>
            <option value="phase">Phase</option>
          </select>
        </div>
      </div>
    </div>
  );
}
