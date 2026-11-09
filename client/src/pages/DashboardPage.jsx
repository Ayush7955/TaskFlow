import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader,
  ArrowUpRight,
  MessageSquare,
  Plus,
  UserPlus,
  Columns3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useAuthStore from '../stores/authStore';
import useWorkspaceStore from '../stores/workspaceStore';
import useBoardStore from '../stores/boardStore';
import Card from '../components/Card';
import OrbDecoration from '../components/OrbDecoration';
import Avatar from '../components/Avatar';
import { formatRelative } from '../utils/formatters';

/* ──────────────────── Time-based greeting ──────────────────── */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ──────────────────── Mock data ──────────────────── */
const kpiData = [
  {
    label: 'Due Today',
    value: 5,
    icon: Calendar,
    orb: 'sky',
  },
  {
    label: 'Overdue',
    value: 2,
    icon: AlertCircle,
    orb: 'rose',
  },
  {
    label: 'Completed This Week',
    value: 18,
    icon: CheckCircle2,
    orb: 'mint',
  },
  {
    label: 'In Progress',
    value: 9,
    icon: Loader,
    orb: 'lavender',
  },
];

const completedChartData = [
  { day: 'Mon', cards: 3 },
  { day: 'Tue', cards: 5 },
  { day: 'Wed', cards: 2 },
  { day: 'Thu', cards: 7 },
  { day: 'Fri', cards: 4 },
  { day: 'Sat', cards: 1 },
  { day: 'Sun', cards: 6 },
];

const priorityChartData = [
  { name: 'Critical', count: 3 },
  { name: 'High', count: 7 },
  { name: 'Medium', count: 12 },
  { name: 'Low', count: 5 },
];

const recentActivity = [
  {
    id: '1',
    user: 'Emily Chen',
    action: 'completed',
    target: 'Update onboarding flow',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    icon: CheckCircle2,
  },
  {
    id: '2',
    user: 'Marcus Webb',
    action: 'created',
    target: 'API rate-limiting investigation',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    icon: Plus,
  },
  {
    id: '3',
    user: 'Sarah Kim',
    action: 'commented on',
    target: 'Dashboard redesign',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    icon: MessageSquare,
  },
  {
    id: '4',
    user: 'Alex Rivera',
    action: 'moved',
    target: 'Fix pagination bug',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    icon: ArrowUpRight,
  },
  {
    id: '5',
    user: 'Emily Chen',
    action: 'invited',
    target: 'David Park',
    timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    icon: UserPlus,
  },
];

/* ──────────────────── Custom chart tooltip ──────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-canvas text-xs font-body rounded-lg px-3 py-2 shadow-elevated">
      <p className="font-medium">{label}</p>
      <p className="text-stone-300 mt-0.5">
        {payload[0].value} {payload[0].dataKey}
      </p>
    </div>
  );
}

/* ──────────────────── KPI Card ──────────────────── */
function KpiCard({ label, value, icon: Icon, orb }) {
  return (
    <Card className="relative overflow-hidden">
      <OrbDecoration variant={orb} size="sm" className="-top-8 -right-8" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted font-body">{label}</p>
          <p className="text-3xl font-display font-light text-ink mt-1">
            {value}
          </p>
        </div>
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-stone-100">
          <Icon size={20} className="text-secondary" />
        </div>
      </div>
    </Card>
  );
}

/* ──────────────────── Dashboard Page ──────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const { boards, fetchBoards } = useBoardStore();
  const displayName = user?.name?.split(' ')[0] || 'there';

  React.useEffect(() => {
    const wsId = currentWorkspace?.public_id || currentWorkspace?.id;
    if (wsId) {
      fetchBoards(wsId);
    }
  }, [currentWorkspace, fetchBoards]);

  const dynamicKpiData = [
    {
      label: 'Active Boards',
      value: boards.length || 8,
      icon: Columns3,
      orb: 'sky',
    },
    {
      label: 'In Progress Tasks',
      value: 24,
      icon: Loader,
      orb: 'lavender',
    },
    {
      label: 'Completed Tasks',
      value: 18,
      icon: CheckCircle2,
      orb: 'mint',
    },
    {
      label: 'Attention Needed',
      value: 2,
      icon: AlertCircle,
      orb: 'rose',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-light text-3xl text-ink">
          {getGreeting()}, {displayName}.
        </h1>
        <p className="text-muted text-sm font-body mt-1">
          Here&apos;s what&apos;s happening across your workspace today.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicKpiData.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Active Boards direct Kanban access */}
      {boards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-light text-xl text-ink">Active Boards</h2>
            <button
              onClick={() => navigate('/boards')}
              className="text-xs text-secondary hover:text-ink font-body font-medium flex items-center gap-1 transition-colors"
            >
              All boards ({boards.length}) →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {boards.map((b) => (
              <Card
                key={b.public_id || b.id}
                hover
                onClick={() => navigate(`/boards/${b.public_id || b.id}`)}
                className="flex flex-col justify-between group cursor-pointer p-4 h-36"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-display font-light text-lg text-ink truncate group-hover:text-ink-700 transition-colors">
                      {b.name}
                    </h3>
                    <ArrowUpRight size={16} className="text-muted group-hover:text-ink shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted font-body mt-1 line-clamp-2">
                    {b.description || 'Open Kanban board'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-secondary font-body pt-2 border-t border-border/50">
                  <span>Interactive Kanban</span>
                  <span className="font-medium text-ink group-hover:underline">Open →</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line chart — Cards completed (last 7 days) */}
        <Card>
          <h3 className="font-display font-light text-lg text-ink mb-4">
            Cards completed
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#a8a29e', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#a8a29e', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cards"
                  stroke="#0c0a09"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#0c0a09', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#0c0a09', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar chart — By Priority */}
        <Card>
          <h3 className="font-display font-light text-lg text-ink mb-4">
            By Priority
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#a8a29e', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#a8a29e', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#292524"
                  radius={[6, 6, 0, 0]}
                  barSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="font-display font-light text-lg text-ink mb-4">
          Recent activity
        </h3>
        <div className="divide-y divide-border">
          {recentActivity.map((item) => {
            const ActivityIcon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <Avatar name={item.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-ink">
                    <span className="font-medium">{item.user}</span>{' '}
                    <span className="text-secondary">{item.action}</span>{' '}
                    <span className="font-medium">{item.target}</span>
                  </p>
                  <p className="text-xs text-muted font-body mt-0.5">
                    {formatRelative(item.timestamp)}
                  </p>
                </div>
                <ActivityIcon size={16} className="text-muted shrink-0" />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
