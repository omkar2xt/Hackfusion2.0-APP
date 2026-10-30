import { Check } from 'lucide-react';
import type { IncidentStatus } from '../types';

interface IncidentTimelineProps {
  currentStatus: IncidentStatus;
}

interface Stage {
  key: IncidentStatus;
  label: string;
}

const stages: Stage[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved', label: 'Resolved' },
];

function getStageIndex(status: IncidentStatus): number {
  const idx = stages.findIndex((s) => s.key === status);
  if (status === 'closed') return stages.length;
  return idx >= 0 ? idx : 0;
}

export default function IncidentTimeline({ currentStatus }: IncidentTimelineProps) {
  const currentIdx = getStageIndex(currentStatus);

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx && currentStatus !== 'closed';
          const isFuture = idx > currentIdx;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 flex-1">
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`
                    absolute top-3.5 right-1/2 h-0.5 w-full -z-10
                    transition-colors duration-300
                    ${idx <= currentIdx ? 'bg-[#315E63]' : 'bg-[#E5E9ED]'}
                  `}
                />
              )}

              {/* Node */}
              <div
                className={`
                  relative w-7 h-7 rounded-full flex items-center justify-center
                  border-2 transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-[#27845A] border-[#27845A]'
                      : isCurrent
                        ? 'bg-[#315E63]/15 border-[#315E63]'
                        : 'bg-[#F7F8FA] border-[#E5E9ED]'
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={14} className="text-white" strokeWidth={3} />
                ) : isCurrent ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#315E63] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#315E63]" />
                  </span>
                ) : (
                  <span
                    className={`
                      w-2 h-2 rounded-full
                      ${isFuture ? 'bg-slate-300' : 'bg-slate-400'}
                    `}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-[10px] leading-tight text-center
                  ${
                    isCompleted
                      ? 'text-[#27845A] font-semibold'
                      : isCurrent
                        ? 'text-[#315E63] font-bold'
                        : 'text-[#64748B]'
                  }
                `}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
