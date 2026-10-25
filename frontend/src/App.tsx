import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, apiError, type Task, type User, type PaginatedTasks } from "./api";
import { Check, Circle, ClipboardList, LogOut, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

type AuthMode = "login" | "register";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin@123");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("starter_token");
    if (!token) return;
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("starter_token");
      setUser(null);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedTasks>("/tasks?page=1&limit=100");
      setTasks(data.data);
    } catch (error) {
      setMessage(apiError(error));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadMe(); }, [loadMe]);
  useEffect(() => { void loadTasks(); }, [loadTasks]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload = authMode === "login" ? { email, password } : { name, email, password };
      const { data } = await api.post<{ token: string; user: User }>(endpoint, payload);
      localStorage.setItem("starter_token", data.token);
      setUser(data.user);
      setMessage(`Welcome, ${data.user.name}.`);
    } catch (error) {
      setMessage(apiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setMessage("");
    try {
      const { data } = await api.post<{ task: Task }>("/tasks", {
        title: title.trim(), description: description.trim() || undefined,
      });
      setTasks((current) => [data.task, ...current]);
      setTitle("");
      setDescription("");
    } catch (error) { setMessage(apiError(error)); }
  }

  async function toggleTask(task: Task) {
    try {
      const { data } = await api.patch<{ task: Task }>(`/tasks/${task.id}`, { completed: !task.completed });
      setTasks((current) => current.map((item) => item.id === task.id ? data.task : item));
    } catch (error) { setMessage(apiError(error)); }
  }

  async function deleteTask(id: string) {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) { setMessage(apiError(error)); }
  }

  function logout() {
    localStorage.removeItem("starter_token");
    setUser(null);
    setTasks([]);
    setMessage("You have signed out.");
  }

  const visibleTasks = tasks.filter((task) =>
    filter === "all" ? true : filter === "open" ? !task.completed : task.completed,
  );

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="brand-mark"><ClipboardList size={25} /></div>
          <p className="eyebrow">HEADLESS FULL-STACK STARTER</p>
          <h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="muted">A clean foundation for your next project.</p>
          {message && <div className="notice" role="status">{message}</div>}
          <form className="stack" onSubmit={submitAuth}>
            {authMode === "register" && <label>Full name<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></label>}
            <label>Email address<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
            <button className="primary full" disabled={loading}>{loading ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <p className="switch-auth">
            {authMode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button className="link-button" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setMessage(""); }}>
              {authMode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="hint">Demo admin: admin@example.com · admin@123</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark small"><ClipboardList size={20} /></span><span>Starter<span className="brand-light">Stack</span></span></a>
        <div className="user-menu">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <div className="user-meta"><strong>{user.name}</strong><span>{user.role.replace("_", " ")}</span></div>
          <button className="icon-button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
        </div>
      </header>
      <section className="welcome">
        <div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1><p className="muted">A little progress each day adds up.</p></div>
        <div className="role-chip"><ShieldCheck size={16} /> {user.role.replaceAll("_", " ")}</div>
      </section>
      {message && <div className="notice page-notice" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss message">×</button></div>}
      <section className="stats-grid">
        <article className="stat-card"><span className="stat-icon"><ClipboardList size={19} /></span><span className="stat-label">Total tasks</span><strong>{tasks.length}</strong><small>In your workspace</small></article>
        <article className="stat-card"><span className="stat-icon success"><Check size={19} /></span><span className="stat-label">Completed</span><strong>{tasks.filter((t) => t.completed).length}</strong><small>Things you've finished</small></article>
        <article className="stat-card"><span className="stat-icon pending"><Circle size={19} /></span><span className="stat-label">In progress</span><strong>{tasks.filter((t) => !t.completed).length}</strong><small>One step at a time</small></article>
      </section>
      <section className="content-grid">
        <div className="panel task-panel">
          <div className="panel-heading"><div><h2>Tasks</h2><p className="muted">Manage your work and keep moving.</p></div><button className="icon-button" onClick={() => void loadTasks()} title="Refresh tasks" aria-label="Refresh tasks"><RefreshCw size={17} /></button></div>
          <form className="add-task" onSubmit={addTask}>
            <label className="sr-only" htmlFor="task-title">Task title</label>
            <input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" maxLength={160} required />
            <button className="primary" type="submit"><Plus size={17} /> Add task</button>
            <label className="sr-only" htmlFor="task-description">Task description</label>
            <input id="task-description" className="description-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a short description (optional)" maxLength={2000} />
          </form>
          <div className="task-toolbar">
            <span>{visibleTasks.length} {visibleTasks.length === 1 ? "task" : "tasks"}</span>
            <div className="filters" aria-label="Filter tasks">
              {(["all", "open", "done"] as const).map((item) => <button key={item} className={filter === item ? "filter active" : "filter"} onClick={() => setFilter(item)}>{item === "all" ? "All" : item === "open" ? "In progress" : "Completed"}</button>)}
            </div>
          </div>
          <div className="task-list">
            {loading && <p className="empty-state">Loading your tasks…</p>}
            {!loading && visibleTasks.length === 0 && <div className="empty-state"><span className="empty-icon"><Check size={22} /></span><strong>All clear for now</strong><p>Add a task above to get started.</p></div>}
            {visibleTasks.map((task) => <article className={`task-row ${task.completed ? "is-done" : ""}`} key={task.id}>
              <button className="check-button" onClick={() => void toggleTask(task)} aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}>{task.completed ? <Check size={17} /> : <Circle size={19} />}</button>
              <div className="task-copy"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}</div>
              <button className="icon-button delete-button" onClick={() => void deleteTask(task.id)} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={17} /></button>
            </article>)}
          </div>
        </div>
        <aside className="panel quick-panel"><p className="eyebrow">STARTER TOOLKIT</p><h2>Built to build on.</h2><p className="muted">A practical baseline for interviews, prototypes, and production-minded projects.</p>
          <ul className="feature-list"><li><span><Check size={15} /></span>JWT authentication</li><li><span><Check size={15} /></span>Role-based authorization</li><li><span><Check size={15} /></span>REST API + Prisma ORM</li><li><span><Check size={15} /></span>TypeScript end to end</li><li><span><Check size={15} /></span>Responsive SPA layout</li></ul>
          <div className="api-status"><span className="status-dot" /><div><strong>API configured</strong><small>{import.meta.env.VITE_API_URL || "http://localhost:4000/api"}</small></div></div>
        </aside>
      </section>
      <footer className="footer"><span>StarterStack · Built for your next idea</span><span>React · Express · Prisma</span></footer>
    </main>
  );
}