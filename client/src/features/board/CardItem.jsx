import { Calendar, MessageSquare, CheckSquare, AlertCircle } from 'lucide-react';
import useUiStore from '../../stores/uiStore';
import Avatar from '../../components/Avatar';
import { formatDate } from '../../utils/formatters';
import { isPast, parseISO } from 'date-fns';

const LABEL_TONES = [
  'bg-stone-300',
  'bg-zinc-400',
  'bg-neutral-300',
  'bg-slate-300',
  'bg-stone-400',
];

export default function CardItem({ card, listId, overlay }) {
  const openCard = useUiStore((s) => s.openCard);

  const isOverdue = card.due_date && isPast(parseISO(card.due_date)) && !card.completed_at;
  const checklistTotal = card.checklist_items_total || 0;
  const checklistDone = card.checklist_items_done || 0;
  const hasChecklist = checklistTotal > 0;

  return (
    <div
      className={[
        'bg-surface rounded-xl p-3 shadow-xs border border-border/60 group',
        'hover:shadow-card transition-shadow duration-150',
        overlay ? 'shadow-elevated rotate-1 opacity-95' : 'cursor-pointer',
        isOverdue ? 'border-l-2 border-l-red-200 bg-red-50/30' : '',
      ].join(' ')}
      onClick={() => !overlay && openCard(card.public_id || card.id)}
    >
      {/* Label dots */}
      {card.labels?.length > 0 && (
        <div className="flex gap-1 mb-2">
          {card.labels.slice(0, 5).map((label, i) => (
            <span
              key={label.id || i}
              className={`h-1.5 w-8 rounded-pill ${LABEL_TONES[i % LABEL_TONES.length]}`}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-body text-ink leading-snug mb-2.5">{card.title}</p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Due date */}
        {card.due_date && (
          <span className={`flex items-center gap-1 text-xs rounded-pill px-2 py-0.5 ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-muted'}`}>
            {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            {formatDate(card.due_date)}
          </span>
        )}

        {/* Priority dot */}
        {card.priority && (
          <span
            className={`h-2 w-2 rounded-full flex-shrink-0 ${
              card.priority === 1 ? 'bg-ink' : card.priority === 2 ? 'bg-stone-600' : card.priority === 3 ? 'bg-stone-400' : 'bg-stone-300'
            }`}
            title={`Priority: ${card.priority === 1 ? 'Critical' : card.priority === 2 ? 'High' : card.priority === 3 ? 'Medium' : 'Low'}`}
          />
        )}

        {/* Checklist */}
        {hasChecklist && (
          <span className={`flex items-center gap-1 text-xs text-muted ${checklistDone === checklistTotal ? 'text-emerald-700' : ''}`}>
            <CheckSquare className="h-3 w-3" />
            {checklistDone}/{checklistTotal}
          </span>
        )}

        {/* Comment count */}
        {card.comments_count > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted ml-auto">
            <MessageSquare className="h-3 w-3" />
            {card.comments_count}
          </span>
        )}

        {/* Assignees */}
        {card.assignees?.length > 0 && (
          <div className="flex -space-x-1 ml-auto">
            {card.assignees.slice(0, 3).map((u) => (
              <Avatar key={u.id} name={u.name} src={u.avatar_url} size="xs" className="ring-1 ring-surface" />
            ))}
            {card.assignees.length > 3 && (
              <div className="h-5 w-5 rounded-full bg-stone-100 ring-1 ring-surface flex items-center justify-center text-[8px] text-secondary">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
