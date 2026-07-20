import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Code2,
  Trophy,
  Building2,
  Trash2,
  Edit,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  ShieldAlert,
  Loader2,
  X,
} from 'lucide-react';
import api from '@/services/api';
import { Card, Skeleton, Button, DifficultyBadge } from '@/components/ui';
import toast from 'react-hot-toast';

interface Overview {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  totalInterviews: number;
  activeContests: number;
}

export default function AdminPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'problems' | 'companies' | 'contests'>('overview');

  // Generic data states
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Problems helper list (for associating problems with contests or companies)
  const [allProblems, setAllProblems] = useState<any[]>([]);

  // Modal control states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states
  const [problemForm, setProblemForm] = useState({
    title: '',
    difficulty: 'Easy',
    tags: '',
    conceptTags: '',
    statement: '',
    constraints: '',
    starterCodeJS: '',
    starterCodePy: '',
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
  });

  const [contestForm, setContestForm] = useState({
    title: '',
    slug: '',
    description: '',
    durationMinutes: 60,
    startTime: '',
    endTime: '',
    problems: [] as string[],
    isVirtual: false,
  });

  // Fetch Overview Data
  const fetchOverview = () => {
    setLoadingOverview(true);
    api
      .get('/admin/overview')
      .then((res) => setOverview(res.data.overview))
      .catch(() => setOverview(null))
      .finally(() => setLoadingOverview(false));
  };

  // Fetch all problems (unpaginated) for dropdown associations
  const fetchAllProblems = () => {
    api
      .get('/problems?limit=100')
      .then((res) => setAllProblems(res.data.problems || []))
      .catch(() => setAllProblems([]));
  };

  useEffect(() => {
    fetchOverview();
    fetchAllProblems();
  }, []);

  // Fetch items based on active tab
  const fetchTabItems = async () => {
    if (tab === 'overview') return;
    setLoadingItems(true);
    try {
      let endpoint = `/admin/${tab}`;
      // In case problems lists are fetched from public route, admins can also use admin route
      if (tab === 'problems') {
        endpoint = `/problems`; // use public paginated endpoint
      }
      
      const { data } = await api.get(endpoint, {
        params: { page, limit: 10, search: search || undefined },
      });

      if (tab === 'users') {
        setItems(data.users || []);
      } else if (tab === 'problems') {
        setItems(data.problems || []);
      } else if (tab === 'companies') {
        setItems(data.companies || []);
      } else if (tab === 'contests') {
        setItems(data.contests || []);
      }
      
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      toast.error(`Failed to load ${tab} list`);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTabItems();
  }, [tab, search]);

  useEffect(() => {
    fetchTabItems();
  }, [page]);

  // Modal Open Hooks
  const openCreateModal = () => {
    setEditingItem(null);
    if (tab === 'problems') {
      setProblemForm({
        title: '',
        difficulty: 'Easy',
        tags: '',
        conceptTags: '',
        statement: '',
        constraints: '',
        starterCodeJS: 'function solve() {\n  \n}',
        starterCodePy: 'def solve():\n    pass',
        testCases: [{ input: '', expectedOutput: '', isHidden: false }],
      });
    } else if (tab === 'companies') {
      setCompanyForm({ name: '', slug: '', description: '', logoUrl: '' });
    } else if (tab === 'contests') {
      setContestForm({
        title: '',
        slug: '',
        description: '',
        durationMinutes: 60,
        startTime: '',
        endTime: '',
        problems: [],
        isVirtual: false,
      });
    }
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    if (tab === 'problems') {
      // Fetch full problem details for edit
      api.get(`/problems/${item.slug}`).then((res) => {
        const fullProb = res.data.problem;
        setProblemForm({
          title: fullProb.title,
          difficulty: fullProb.difficulty,
          tags: fullProb.tags?.join(', ') || '',
          conceptTags: fullProb.conceptTags?.join(', ') || '',
          statement: fullProb.statement,
          constraints: fullProb.constraints?.join('\n') || '',
          starterCodeJS: fullProb.starterCode?.javascript || '',
          starterCodePy: fullProb.starterCode?.python || '',
          testCases: fullProb.testCases?.length
            ? fullProb.testCases
            : [{ input: '', expectedOutput: '', isHidden: false }],
        });
        setShowModal(true);
      });
    } else if (tab === 'companies') {
      setCompanyForm({
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        logoUrl: item.logoUrl || '',
      });
      setShowModal(true);
    } else if (tab === 'contests') {
      // Format dates for input type datetime-local
      const formatLocal = (dStr: string) => {
        if (!dStr) return '';
        const d = new Date(dStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };
      setContestForm({
        title: item.title,
        slug: item.slug,
        description: item.description || '',
        durationMinutes: item.durationMinutes || 60,
        startTime: formatLocal(item.startTime),
        endTime: formatLocal(item.endTime),
        problems: item.problems?.map((p: any) => p._id || p) || [],
        isVirtual: !!item.isVirtual,
      });
      setShowModal(true);
    }
  };

  // CRUD Operations
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let endpoint = `/admin/${tab}`;
      const payload: any = {};

      if (tab === 'problems') {
        payload.title = problemForm.title;
        payload.difficulty = problemForm.difficulty;
        payload.statement = problemForm.statement;
        payload.tags = problemForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
        payload.conceptTags = problemForm.conceptTags.split(',').map((t) => t.trim()).filter(Boolean);
        payload.constraints = problemForm.constraints.split('\n').map((c) => c.trim()).filter(Boolean);
        payload.starterCode = {
          javascript: problemForm.starterCodeJS,
          python: problemForm.starterCodePy,
        };
        payload.testCases = problemForm.testCases.filter((tc) => tc.input && tc.expectedOutput);
        payload.slug = problemForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      } else if (tab === 'companies') {
        Object.assign(payload, companyForm);
      } else if (tab === 'contests') {
        Object.assign(payload, contestForm);
      }

      if (editingItem) {
        await api.patch(`${endpoint}/${editingItem._id}`, payload);
        toast.success('Updated successfully.');
      } else {
        await api.post(endpoint, payload);
        toast.success('Created successfully.');
      }

      setShowModal(false);
      fetchTabItems();
      fetchOverview();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/admin/${tab}/${id}`);
      toast.success('Deleted successfully.');
      fetchTabItems();
      fetchOverview();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const toggleUserActive = async (userItem: any) => {
    try {
      await api.patch(`/admin/users/${userItem._id}`, { isActive: !userItem.isActive });
      toast.success(`${userItem.name} has been ${userItem.isActive ? 'deactivated' : 'activated'}.`);
      fetchTabItems();
    } catch (err: any) {
      toast.error('Failed to change user status.');
    }
  };

  const toggleUserRole = async (userItem: any) => {
    const nextRole = userItem.role === 'admin' ? 'user' : 'admin';
    try {
      await api.patch(`/admin/users/${userItem._id}`, { role: nextRole });
      toast.success(`${userItem.name} role changed to ${nextRole}.`);
      fetchTabItems();
    } catch (err: any) {
      toast.error('Failed to update user role.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'problems', label: 'Problems', icon: Code2 },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'contests', label: 'Contests', icon: Trophy },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-mint" />
        <h1 className="font-display text-2xl text-ink">Admin Panel</h1>
      </div>

      {/* Tabs list */}
      <div className="flex gap-1.5 bg-surface-raised border border-border rounded-lg p-1 w-fit overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              tab === id ? 'bg-mint text-base' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' &&
        (loadingOverview ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Total Users" value={overview.totalUsers} />
            <MetricCard label="Problems" value={overview.totalProblems} />
            <MetricCard label="Submissions" value={overview.totalSubmissions} />
            <MetricCard label="Interviews" value={overview.totalInterviews} />
            <MetricCard label="Active Contests" value={overview.activeContests} />
          </div>
        ) : (
          <Card>
            <p className="text-sm text-ink-muted font-display">
              Couldn't load admin overview data. Make sure you are logged into an admin account.
            </p>
          </Card>
        ))}

      {/* Tab CRUD Interfaces */}
      {tab !== 'overview' && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder={`Search ${tab}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs py-2"
              />
            </div>

            {/* Create Trigger */}
            {tab !== 'users' && (
              <Button onClick={openCreateModal} className="text-xs py-1.5 px-4 flex items-center gap-1 shrink-0">
                <Plus className="h-3.5 w-3.5" /> Create {tab.slice(0, -1)}
              </Button>
            )}
          </div>

          {loadingItems ? (
            <div className="space-y-2 py-8">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-ink-muted text-center py-12">No records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-ink-muted uppercase text-[10px] tracking-wider">
                    {tab === 'users' && (
                      <>
                        <th className="py-2.5">User</th>
                        <th className="py-2.5">Role</th>
                        <th className="py-2.5">XP</th>
                        <th className="py-2.5">Solved</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </>
                    )}
                    {tab === 'problems' && (
                      <>
                        <th className="py-2.5">Title</th>
                        <th className="py-2.5">Difficulty</th>
                        <th className="py-2.5">Acceptance Rate</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </>
                    )}
                    {tab === 'companies' && (
                      <>
                        <th className="py-2.5">Name</th>
                        <th className="py-2.5">Slug</th>
                        <th className="py-2.5">Description</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </>
                    )}
                    {tab === 'contests' && (
                      <>
                        <th className="py-2.5">Title</th>
                        <th className="py-2.5">Duration</th>
                        <th className="py-2.5">Timeframe</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-b border-border/50 hover:bg-surface-raised/30">
                      {tab === 'users' && (
                        <>
                          <td className="py-3">
                            <div className="font-semibold text-ink">{item.name}</div>
                            <div className="text-[10px] text-ink-muted">{item.email}</div>
                          </td>
                          <td className="py-3 capitalize">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                              item.role === 'admin' ? 'bg-signal/15 text-signal' : 'bg-surface-raised text-ink-muted'
                            }`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="py-3 font-mono">{item.xp}</td>
                          <td className="py-3 font-mono">{item.problemsSolved}</td>
                          <td className="py-3 text-right space-x-1.5">
                            <button
                              onClick={() => toggleUserActive(item)}
                              className={`p-1.5 rounded transition-colors ${
                                item.isActive ? 'text-difficulty-hard hover:bg-difficulty-hard/10' : 'text-mint hover:bg-mint/10'
                              }`}
                              title={item.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {item.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => toggleUserRole(item)}
                              className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                              title="Toggle Admin Privilege"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </>
                      )}

                      {tab === 'problems' && (
                        <>
                          <td className="py-3">
                            <Link to={`/problems/${item.slug}`} className="font-semibold text-ink hover:text-mint">
                              {item.title}
                            </Link>
                          </td>
                          <td className="py-3">
                            <DifficultyBadge difficulty={item.difficulty} />
                          </td>
                          <td className="py-3 font-mono">
                            {item.stats?.acceptanceRate ? `${item.stats.acceptanceRate}%` : '—'}
                          </td>
                          <td className="py-3 text-right space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 rounded text-difficulty-hard hover:bg-difficulty-hard/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </>
                      )}

                      {tab === 'companies' && (
                        <>
                          <td className="py-3 font-semibold text-ink">{item.name}</td>
                          <td className="py-3 font-mono">{item.slug}</td>
                          <td className="py-3 text-ink-muted max-w-xs truncate">{item.description}</td>
                          <td className="py-3 text-right space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 rounded text-difficulty-hard hover:bg-difficulty-hard/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </>
                      )}

                      {tab === 'contests' && (
                        <>
                          <td className="py-3 font-semibold text-ink">{item.title}</td>
                          <td className="py-3">{item.durationMinutes} mins</td>
                          <td className="py-3 text-ink-muted font-mono text-[10px]">
                            {new Date(item.startTime).toLocaleDateString()} - {new Date(item.endTime).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right space-x-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 rounded text-difficulty-hard hover:bg-difficulty-hard/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
              <span className="text-ink-muted">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="py-1 px-2.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="py-1 px-2.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* CRUD Form Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-background border border-border shadow-2xl relative max-h-[90vh] flex flex-col p-0">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-ink-muted hover:text-ink"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="p-5 border-b border-border">
              <h3 className="font-display text-sm font-semibold text-ink">
                {editingItem ? 'Edit' : 'Create'} {tab.slice(0, -1).toUpperCase()}
              </h3>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Problem Form */}
              {tab === 'problems' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Title</label>
                      <input
                        type="text"
                        required
                        value={problemForm.title}
                        onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">Difficulty</label>
                      <select
                        value={problemForm.difficulty}
                        onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                        className="input text-xs"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Statement</label>
                    <textarea
                      required
                      value={problemForm.statement}
                      onChange={(e) => setProblemForm({ ...problemForm, statement: e.target.value })}
                      className="input text-xs"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Tags (comma separated)</label>
                      <input
                        type="text"
                        value={problemForm.tags}
                        onChange={(e) => setProblemForm({ ...problemForm, tags: e.target.value })}
                        className="input text-xs"
                        placeholder="e.g. Array, Hash Table"
                      />
                    </div>
                    <div>
                      <label className="label">Concept Tags</label>
                      <input
                        type="text"
                        value={problemForm.conceptTags}
                        onChange={(e) => setProblemForm({ ...problemForm, conceptTags: e.target.value })}
                        className="input text-xs"
                        placeholder="e.g. dynamic-programming, graph"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Constraints (one per line)</label>
                    <textarea
                      value={problemForm.constraints}
                      onChange={(e) => setProblemForm({ ...problemForm, constraints: e.target.value })}
                      className="input text-xs font-mono"
                      rows={2}
                      placeholder="e.g. 1 <= nums.length <= 10^4"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Starter Code (JS)</label>
                      <textarea
                        value={problemForm.starterCodeJS}
                        onChange={(e) => setProblemForm({ ...problemForm, starterCodeJS: e.target.value })}
                        className="input text-xs font-mono"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="label">Starter Code (Python)</label>
                      <textarea
                        value={problemForm.starterCodePy}
                        onChange={(e) => setProblemForm({ ...problemForm, starterCodePy: e.target.value })}
                        className="input text-xs font-mono"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-1">
                      <span className="text-xs font-semibold text-ink">Test Cases</span>
                      <button
                        type="button"
                        onClick={() =>
                          setProblemForm({
                            ...problemForm,
                            testCases: [...problemForm.testCases, { input: '', expectedOutput: '', isHidden: false }],
                          })
                        }
                        className="text-xxs text-mint hover:underline"
                      >
                        + Add Test Case
                      </button>
                    </div>
                    {problemForm.testCases.map((tc, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 items-center bg-surface-raised p-2 rounded-lg relative">
                        <div>
                          <label className="text-[10px] text-ink-muted">Input</label>
                          <input
                            type="text"
                            required
                            value={tc.input}
                            onChange={(e) => {
                              const updated = [...problemForm.testCases];
                              updated[idx].input = e.target.value;
                              setProblemForm({ ...problemForm, testCases: updated });
                            }}
                            className="input text-[11px] py-1"
                            placeholder="[2,7,11,15]\n9"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-ink-muted">Expected Output</label>
                          <input
                            type="text"
                            required
                            value={tc.expectedOutput}
                            onChange={(e) => {
                              const updated = [...problemForm.testCases];
                              updated[idx].expectedOutput = e.target.value;
                              setProblemForm({ ...problemForm, testCases: updated });
                            }}
                            className="input text-[11px] py-1"
                            placeholder="[0,1]"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <label className="flex items-center gap-1 text-[11px] text-ink-muted cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tc.isHidden}
                              onChange={(e) => {
                                const updated = [...problemForm.testCases];
                                updated[idx].isHidden = e.target.checked;
                                setProblemForm({ ...problemForm, testCases: updated });
                              }}
                            />
                            Hidden
                          </label>
                          {problemForm.testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = problemForm.testCases.filter((_, i) => i !== idx);
                                setProblemForm({ ...problemForm, testCases: updated });
                              }}
                              className="text-difficulty-hard hover:underline text-[10px] pl-2"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Company Form */}
              {tab === 'companies' && (
                <>
                  <div>
                    <label className="label">Company Name</label>
                    <input
                      type="text"
                      required
                      value={companyForm.name}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        setCompanyForm({ ...companyForm, name: e.target.value, slug });
                      }}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="label">Slug</label>
                    <input
                      type="text"
                      required
                      value={companyForm.slug}
                      onChange={(e) => setCompanyForm({ ...companyForm, slug: e.target.value })}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea
                      value={companyForm.description}
                      onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                      className="input text-xs"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Contest Form */}
              {tab === 'contests' && (
                <>
                  <div>
                    <label className="label">Contest Title</label>
                    <input
                      type="text"
                      required
                      value={contestForm.title}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        setContestForm({ ...contestForm, title: e.target.value, slug });
                      }}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="label">Slug</label>
                    <input
                      type="text"
                      required
                      value={contestForm.slug}
                      onChange={(e) => setContestForm({ ...contestForm, slug: e.target.value })}
                      className="input text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        value={contestForm.durationMinutes}
                        onChange={(e) => setContestForm({ ...contestForm, durationMinutes: Number(e.target.value) })}
                        className="input text-xs"
                      />
                    </div>
                    <div className="flex items-center pt-6 pl-2">
                      <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contestForm.isVirtual}
                          onChange={(e) => setContestForm({ ...contestForm, isVirtual: e.target.checked })}
                        />
                        Allow Virtual Starts (after End Time)
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={contestForm.startTime}
                        onChange={(e) => setContestForm({ ...contestForm, startTime: e.target.value })}
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={contestForm.endTime}
                        onChange={(e) => setContestForm({ ...contestForm, endTime: e.target.value })}
                        className="input text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Assign Problems (Multi-select)</label>
                    <div className="border border-border rounded-lg p-2 max-h-36 overflow-y-auto space-y-1.5 bg-surface-raised">
                      {allProblems.map((p) => {
                        const checked = contestForm.problems.includes(p._id);
                        return (
                          <label key={p._id} className="flex items-center gap-2 text-xxs text-ink cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const newProbs = e.target.checked
                                  ? [...contestForm.problems, p._id]
                                  : contestForm.problems.filter((id) => id !== p._id);
                                setContestForm({ ...contestForm, problems: newProbs });
                              }}
                            />
                            {p.title} ({p.difficulty})
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="p-5 border-t border-border flex justify-end gap-2 bg-background sticky bottom-0">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="text-xs py-1.5 px-4">
                  Close
                </Button>
                <Button type="submit" className="text-xs py-1.5 px-4">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <p className="stat-number">{value}</p>
      <p className="text-xs text-ink-muted mt-1">{label}</p>
    </Card>
  );
}
