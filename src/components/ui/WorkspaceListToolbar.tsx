import { Search } from "lucide-react";

interface WorkspaceListToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  statuses: string[];
  noun: string;
  count: number;
}

export function WorkspaceListToolbar({ query, onQueryChange, status, onStatusChange, statuses, noun, count }: WorkspaceListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input type="search" aria-label={`Search ${noun}`} placeholder={`Search ${noun}…`} value={query} onChange={(event) => onQueryChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm placeholder:text-slate-400" />
      </div>
      <select aria-label={`Filter ${noun} by status`} value={status} onChange={(event) => onStatusChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
        <option value="all">All statuses</option>
        {statuses.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}</option>)}
      </select>
      <span aria-live="polite" className="text-xs text-slate-500 sm:ml-auto">{count} {noun}</span>
    </div>
  );
}
