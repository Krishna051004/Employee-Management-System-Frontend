// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { CheckCircle, Clock, Play, ArrowUpRight } from "lucide-react";

/* Status → Color & icon */
const STATUS_META = {
  "Not Started": { color: "#cbd5e1", icon: <Clock className="w-4 h-4" /> },
  "In Progress": { color: "#fbbf24", icon: <Play className="w-4 h-4" /> },
  Completed: { color: "#10b981", icon: <CheckCircle className="w-4 h-4" /> },
};

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [filter, setFilter] = useState("all"); // all / Not Started / In Progress / Completed

  useEffect(() => {
    loadForCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLoggedUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem("ems_user") || "{}");
      return u?._id || u?.id || null;
    } catch (e) {
      return null;
    }
  };

  const loadForCurrentUser = async () => {
    const id = getLoggedUserId();
    if (!id) {
      toast.error("No logged-in user found. Please login.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/employees/tasks/${id}`); // returns { employee, tasks }
      const payload = res.data.data || res.data; // tolerate shapes
      setEmployee(payload.employee || payload.employee || payload);
      setTasks(payload.tasks || []);
    } catch (err) {
      console.error("Failed to load tasks for employee:", err);
      toast.error(err.response?.data?.message || "Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  // aggregated counts for the chart
  const statusCounts = useMemo(() => {
    const map = { "Not Started": 0, "In Progress": 0, Completed: 0 };
    tasks.forEach((t) => (map[t.status] = (map[t.status] || 0) + 1));
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [tasks]);

  // progress percent
  const progressPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  // update status: optimistic UI + API call
  const updateStatus = async (taskId, newStatus) => {
    // avoid duplicate updates
    setUpdatingIds((s) => new Set(s).add(taskId));
    const prevTasks = tasks.slice();
    // optimistic update
    setTasks((t) => t.map((x) => (x._id === taskId ? { ...x, status: newStatus } : x)));
    try {
      // try PUT first (our backend updateEmployee uses PUT). Many APIs accept PUT /tasks/:id
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      toast.success("Task status updated");
    } catch (err) {
      // if PUT not supported, attempt PATCH
      try {
        await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        toast.success("Task status updated");
      } catch (err2) {
        // rollback optimistic
        setTasks(prevTasks);
        console.error("Failed to update task status", err, err2);
        toast.error(err2.response?.data?.message || "Failed to update task status");
      }
    } finally {
      setUpdatingIds((s) => {
        const next = new Set(s);
        next.delete(taskId);
        return next;
      });
    }
  };

  const filtered = tasks.filter((t) => (filter === "all" ? true : t.status === filter));

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold">Welcome{employee?.name ? `, ${employee.name}` : ""}</h2>
        <p className="text-gray-500 mt-1">Here are your assigned tasks and progress.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-4 border">
          <h4 className="text-sm text-gray-500">Overall Progress</h4>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gray-50 border">
              <div className="text-xl font-bold">{progressPercent}%</div>
              <div className="text-xs text-gray-500">done</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Completed {tasks.filter(t => t.status === "Completed").length} of {tasks.length}</div>
              <div className="w-full bg-gray-100 rounded-full h-3 mt-3 overflow-hidden">
                <div style={{ width: `${progressPercent}%` }} className="h-3 bg-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-xl p-4 border col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm text-gray-500">Task Status Overview</h4>
            <div className="flex items-center gap-2">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="all">All</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <button onClick={loadForCurrentUser} className="text-sm px-3 py-1 border rounded">Refresh</button>
            </div>
          </div>

          <div style={{ width: "100%", height: 160 }} className="mt-3">
            <ResponsiveContainer>
              <BarChart data={statusCounts}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value">
                  {statusCounts.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_META[entry.name]?.color || "#8884d8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="bg-white shadow rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Tasks</h3>
          <div className="text-sm text-gray-500">Click a status to update</div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No tasks found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <motion.div key={t._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{t.title}</h4>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}</span>
                    {t.priority && <span className="ml-2 px-2 py-1 text-xs rounded bg-red-50 text-red-600">{t.priority}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{t.description}</p>

                  {t.resources && t.resources.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {t.resources.map((r, i) => (
                        <a key={i} href={r} target="_blank" rel="noreferrer" className="text-xs bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-2">
                          <ArrowUpRight className="w-3 h-3" /> <span className="truncate max-w-xs">{r}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* status badges / actions */}
                  {["Not Started", "In Progress", "Completed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(t._id, s)}
                      disabled={updatingIds.has(t._id) || t.status === s}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 border
                        ${t.status === s ? "bg-gray-800 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                      title={`Mark as ${s}`}
                    >
                      <span style={{ background: STATUS_META[s].color }} className="w-3 h-3 rounded-full inline-block" />
                      <span className="hidden sm:inline">{s}</span>
                    </button>
                  ))}

                  {/* small current status text on mobile */}
                  <div className="text-xs text-gray-500 ml-2 sm:hidden">{t.status}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
