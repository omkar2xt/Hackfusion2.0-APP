import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  RotateCw,
  Plus,
  ChevronRight,
  Clock,
} from 'lucide-react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useIncidents } from '../hooks/useIncidents';
import { formatDate } from '../utils/helpers';

export default function MyReportsPage() {
  const navigate = useNavigate();
  const { incidents, loading, refreshIncidents } = useIncidents();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshIncidents();
    setRefreshing(false);
  };

  const filteredIncidents = incidents.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  const filterOptions: { id: string; label: string }[] = [
    { id: 'all', label: 'All Reports' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'triaged', label: 'Triaged' },
    { id: 'investigating', label: 'Investigating' },
    { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="My Reports"
        subtitle="Track submitted cybersecurity incidents"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        {/* Action Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/report')}
            className="py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition"
          >
            <Plus size={15} />
            File New Incident
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh reports list"
            className="p-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-slate-300 hover:text-teal-400 transition-colors cursor-pointer"
          >
            <RotateCw size={16} className={refreshing ? 'animate-spin text-teal-400' : ''} />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === opt.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Content list */}
        {loading && !refreshing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <EmptyState
            icon={<FileText size={36} className="text-slate-600" />}
            title="No Incidents Found"
            description={
              selectedFilter === 'all'
                ? 'You have not submitted any cybersecurity incident reports yet.'
                : `No reports currently in '${selectedFilter}' status.`
            }
            action={
              selectedFilter === 'all'
                ? {
                    label: 'File an Incident',
                    onClick: () => navigate('/report'),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                onClick={() => navigate(`/reports/${incident.id}`)}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 cursor-pointer active:scale-[0.99] transition-all space-y-3 shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        #{incident.id.slice(0, 8)}
                      </span>
                      <span className="text-sm font-bold text-white capitalize">
                        {incident.category.replace('_', ' ')}
                      </span>
                    </div>
                    <StatusBadge status={incident.severity} variant="severity" />
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {incident.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock size={13} />
                    <span>{formatDate(incident.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={incident.status} variant="incident" />
                    <ChevronRight size={15} className="text-slate-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}