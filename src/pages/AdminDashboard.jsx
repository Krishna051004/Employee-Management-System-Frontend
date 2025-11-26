import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

import {
  Plus,
  Users,
  Settings,
  UserPlus,
  Trash2,
  Edit,
  FileBarChart,
  ClipboardCheck,
  Search,
  ClipboardList,
} from "lucide-react";

/* Status → Color */
const STATUS_COLORS = {
  "Not Started": "#cbd5e1",
  "In Progress": "#fbbf24",
  Completed: "#10b981",
};

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(null);
  const [showPerfModal, setShowPerfModal] = useState(null);

  // Form data
  const [newEmp, setNewEmp] = useState({ name: "", email: "", position: "", resources: "", password: "" });
  const [editEmp, setEditEmp] = useState({});
  const [taskForm, setTaskForm] = useState({ title: "", description: "", dueDate: "", resources: "" });

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empRes, taskRes] = await Promise.all([api.get("/employees"), api.get("/tasks")]);
      setEmployees(empRes.data.data || []);
      setTasks(taskRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* =============== ADD EMPLOYEE =============== */
  const createEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newEmp.name,
        email: newEmp.email,
        position: newEmp.position,
        resources: newEmp.resources ? newEmp.resources.split(",").map((x) => x.trim()) : [],
        password: newEmp.password || undefined,
      };

      const res = await api.post("/employees", payload);
      setEmployees((prev) => [res.data.data, ...prev]);
      toast.success("Employee added");
      setShowAddModal(false);

      setNewEmp({ name: "", email: "", position: "", resources: "", password: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating employee");
    }
  };

  /* =============== ASSIGN TASK =============== */
  const assignTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        resources: taskForm.resources ? taskForm.resources.split(",").map((x) => x.trim()) : [],
      };

      const res = await api.post(`/employees/${showAssignModal}/assign-task`, payload);
      setTasks((prev) => [res.data.data, ...prev]);
      toast.success("Task assigned");

      setTaskForm({ title: "", description: "", dueDate: "", resources: "" });
      setShowAssignModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error assigning task");
    }
  };

  /* =============== EDIT EMPLOYEE =============== */
 async function updateEmployee(e) {
  e.preventDefault();
  if (!showEditModal) {
    toast.error("No employee selected");
    return;
  }
  const id = showEditModal;
  try {
    const payload = {
      name: editEmp?.name || "",
      position: editEmp?.position || "",
      resources: editEmp?.resources ? (Array.isArray(editEmp.resources) ? editEmp.resources : editEmp.resources.split(",").map(s=>s.trim())) : [],
      ...(editEmp?.password ? { password: editEmp.password } : {}),
    };
    const res = await api.put(`/employees/${id}`, payload);
    setEmployees(prev => prev.map(emp => (emp._id === id ? res.data.data : emp)));
    toast.success("Employee updated");
    setShowEditModal(null);
    setEditEmp({});
  } catch (err) {
    console.error("updateEmployee failed", err);
    toast.error(err.response?.data?.message || "Failed to update employee");
  }
}


  /* =============== DELETE EMPLOYEE =============== */
  const deleteEmployee = async (id) => {
    if (!confirm("Delete this employee?")) return;

    try {
      await api.delete(`/employees/${id}`);
      setEmployees((prev) => prev.filter((x) => x._id !== id));
      toast.success("Employee deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting employee");
    }
  };

  /* =============== VIEW EMPLOYEE & TASKS =============== */
  const viewEmployee = async (id) => {
    try {
      const res = await api.get(`/employees/${id}`);
      setShowViewModal(res.data.data);
    } catch (err) {
      toast.error("Failed to load employee tasks");
    }
  };

  /* =============== PERFORMANCE DATA =============== */
  const performanceData = (empId) => {
    const empTasks = tasks.filter((t) => t.assignedTo === empId || (t.assignedTo && t.assignedTo._id === empId));
    const map = { "Not Started": 0, "In Progress": 0, Completed: 0 };
    empTasks.forEach((t) => (map[t.status] = (map[t.status] || 0) + 1));

    return Object.keys(map).map((k) => ({
      name: k,
      value: map[k],
    }));
  };

  /* FILTER EMPLOYEES */
  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  /* GLOBAL TASK STATUS STATS */
  const tasksByStatus = useMemo(() => {
    const map = { "Not Started": 0, "In Progress": 0, Completed: 0 };
    tasks.forEach((t) => (map[t.status] = (map[t.status] || 0) + 1));
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [tasks]);

  /* =================== UI START =================== */

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Manage employees, assign tasks, track performance</p>
      </motion.div>

      {/* TOP CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Employees" value={employees.length} icon={<Users />} />
        <StatCard title="Total Tasks" value={tasks.length} icon={<ClipboardList />} />
        <StatCard title="Completed Tasks" value={tasks.filter((x) => x.status === "Completed").length} icon={<ClipboardCheck />} />
      </div>

      {/* TASKS STATUS CHART */}
      <SectionCard title="Tasks Overview">
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={tasksByStatus}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value">
                {tasksByStatus.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* EMPLOYEES TABLE */}
      <SectionCard
        title="Employees"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700">
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        }
      >
        {/* search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Position</th>
                <th className="p-3">Tasks</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3 text-gray-500">{emp.email}</td>
                  <td className="p-3">{emp.position}</td>

                  <td className="p-3">
                    <button
                      onClick={() => viewEmployee(emp._id)}
                      className="text-blue-600 hover:underline text-sm">
                      View tasks
                    </button>
                  </td>

            <td className="p-3 flex gap-2">
  <ActionButton
    icon={<Edit />}
    label="Edit"
    onClick={() => {
      console.log("Edit clicked for", emp._id);
      // ensure emp object exists before setting state
      if (!emp || !emp._id) {
        console.error("Invalid emp object", emp);
        return;
      }
      setEditEmp({ ...emp });          // copy object (non-null)
      setShowEditModal(emp._id);       // store id as modal key
    }}
  />
  <ActionButton
    icon={<ClipboardList />}
    label="Assign"
    onClick={() => {
      console.log('Assign clicked for', emp._id);
      setShowAssignModal(emp._id);
      setTaskForm({ title: '', description: '', dueDate: '', resources: '' });
    }}
  />
  <ActionButton
    icon={<FileBarChart />}
    label="Perf"
    onClick={() => {
      console.log('Perf clicked for', emp._id);
      setShowPerfModal(emp);
    }}
  />
  <ActionButton
    icon={<Trash2 />}
    label="Delete"
    danger
    onClick={() => {
      console.log('Delete clicked for', emp._id);
      deleteEmployee(emp._id);
    }}
  />
</td>


                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-5 text-center text-gray-500">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ----------- MODALS ----------- */}
      <AnimatePresence>
        {showAddModal && (
  <Modal title="Add Employee" onClose={() => setShowAddModal(false)} size="xl">
    <EmployeeForm state={newEmp} setState={setNewEmp} onSubmit={createEmployee} />
  </Modal>
)}


        {/* Edit Employee Modal */}
{showEditModal && (
  <Modal
    title="Edit Employee"
    onClose={() => { setShowEditModal(null); setEditEmp({}); }}
    size="xl"
  >
    {/* show a loading fallback if editEmp isn't populated yet */}
    {!editEmp || Object.keys(editEmp).length === 0 ? (
      <div className="p-6 text-center text-gray-500">Loading employee data...</div>
    ) : (
      <EmployeeForm
        state={editEmp}
        setState={setEditEmp}
        onSubmit={async (e) => {
          e.preventDefault();
          await updateEmployee(e); // ensure updateEmployee uses showEditModal id
        }}
        edit
      />
    )}
  </Modal>
)}



        {showAssignModal && (
  <Modal title="Assign Task" onClose={() => setShowAssignModal(null)} size="xl">
    <TaskForm state={taskForm} setState={setTaskForm} onSubmit={assignTask} />
  </Modal>
)}


        {showViewModal && (
          <Modal title={`Tasks for ${showViewModal.employee.name}`} onClose={() => setShowViewModal(null)}>
            <EmployeeTasks data={showViewModal.tasks} />
          </Modal>
        )}

        {showPerfModal && (
          <Modal title={`${showPerfModal.name} — Performance`} onClose={() => setShowPerfModal(null)}>
            <PerformanceChart data={performanceData(showPerfModal._id)} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------- COMPONENTS -------------------- */

/* Stylish Stat Card */
function StatCard({ title, value, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-5 border">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">{icon}</div>
        <div>
          <h3 className="text-sm text-gray-500">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* Section Card */
function SectionCard({ title, children, action }) {
  return (
    <div className="bg-white shadow rounded-xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* Icon Button */
/* ActionButton — richer, larger hit area + subtle hover */
/* ActionButton — robust click handling */
function ActionButton({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={(ev) => {
        ev.stopPropagation();
        try { onClick && onClick(ev); } catch (e) { console.error("ActionButton onClick error:", e); }
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150
      ${danger ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-white text-gray-700 hover:bg-gray-50"}
      border border-transparent hover:shadow-sm`}
      title={label}
      aria-label={label}
    >
      <span className="w-4 h-4">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}





/* Modal Wrapper */
/* Modal Wrapper (replace existing Modal) */
function Modal({ title, children, onClose, size = "md" }) {
  // size: 'sm' | 'md' | 'lg' | 'xl'
  const sizeMap = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-4xl",
  };
  const cls = sizeMap[size] || sizeMap.md;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        className={`bg-white shadow-2xl rounded-2xl p-6 z-50 w-full ${cls}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}


/* Employee Form (Add/Edit) */
/* Employee Form (Add / Edit) — larger inputs + separate resource boxes */
// Defensive EmployeeForm — safe when `state` might be undefined
function EmployeeForm({ state = {}, setState = () => {}, onSubmit = (e) => e.preventDefault(), edit = false, onCancel = () => {} }) {
  // normalize state to avoid crashes
  const s = state || {};
  const name = s.name ?? "";
  const email = s.email ?? "";
  const position = s.position ?? "";
  const password = s.password ?? "";
  const resourcesRaw = Array.isArray(s.resources) ? s.resources.join(", ") : (typeof s.resources === "string" ? s.resources : "");
  const resourcesArr = resourcesRaw.split(",").map(r => r.trim()).filter(Boolean);

  const addResource = (val) => {
    if (!val) return;
    const arr = [...resourcesArr, val].filter(Boolean);
    setState({ ...s, resources: arr.join(", ") });
  };

  const removeResourceAt = (idx) => {
    const arr = resourcesArr.filter((_, i) => i !== idx);
    setState({ ...s, resources: arr.join(", ") });
  };

  // internal submit wrapper to ensure default prevented if caller forgot
  const handleSubmit = (e) => {
    e.preventDefault();
    // caller's onSubmit should handle async + state reading
    return onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Full name</div>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setState({ ...s, name: e.target.value })}
            className="w-full border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
            placeholder="John Doe"
            autoComplete="name"
          />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Email</div>
          <input
            name="email"
            required={!edit}
            disabled={edit}
            value={email}
            onChange={(e) => setState({ ...s, email: e.target.value })}
            className={`w-full border rounded-xl px-4 py-3 text-lg shadow-sm ${edit ? "bg-gray-50 text-gray-500" : ""}`}
            placeholder="john@example.com"
            type="email"
            autoComplete="email"
          />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Position</div>
          <input
            name="position"
            value={position}
            onChange={(e) => setState({ ...s, position: e.target.value })}
            className="w-full border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
            placeholder="Frontend Developer"
            autoComplete="organization-title"
          />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Temporary password</div>
          <input
            name="password"
            value={password}
            onChange={(e) => setState({ ...s, password: e.target.value })}
            className="w-full border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
            placeholder={edit ? "Leave blank to keep current password" : "Set a temporary password"}
            type="password"
            autoComplete={edit ? "new-password" : "password"}
          />
        </label>
      </div>

      {/* Resources: chips + input */}
      <div>
        <div className="text-sm text-gray-600 mb-2">Resources (click + to add)</div>

        <div className="flex flex-wrap gap-2 mb-3">
          {resourcesArr.length === 0 && <div className="text-sm text-gray-400">No resources added</div>}
          {resourcesArr.map((r, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm">
              <span>{r}</span>
              <button
                type="button"
                onClick={() => removeResourceAt(idx)}
                className="text-xs text-red-500"
                aria-label={`Remove resource ${r}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <ResourceInput
          onAdd={(val) => {
            if (!val) return;
            addResource(val);
          }}
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => onCancel()}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button type="submit" className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg shadow">
          {edit ? "Save Changes" : "Create Employee"}
        </button>
      </div>
    </form>
  );
}

/* ResourceInput component (include if you don't already have it) */
function ResourceInput({ onAdd, placeholder = "e.g. Laptop, Figma link" }) {
  const [val, setVal] = React.useState("");
  const submit = () => {
    const v = val.trim();
    if (!v) return;
    onAdd(v);
    setVal("");
  };
  return (
    <div className="flex gap-2 items-center">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
        placeholder={placeholder}
        className="flex-1 border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
      />
      <button type="button" onClick={submit} className="px-4 py-3 rounded-xl bg-blue-600 text-white shadow">
        +
      </button>
    </div>
  );
}





/* Task Form */
/* TaskForm — large inputs + resource chips */
function TaskForm({ state, setState, onSubmit }) {
  // state.resources stored as comma-separated string
  const resourcesArr = (state.resources || "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const addResource = (val) => {
    if (!val) return;
    const arr = [...resourcesArr, val];
    setState({ ...state, resources: arr.join(", ") });
  };
  const removeResourceAt = (idx) => {
    const arr = resourcesArr.filter((_, i) => i !== idx);
    setState({ ...state, resources: arr.join(", ") });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Task Title</div>
          <input
            required
            value={state.title}
            onChange={(e) => setState({ ...state, title: e.target.value })}
            className="w-full border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
            placeholder="Implement login page UI"
          />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600 mb-1">Due date</div>
          <input
            type="date"
            value={state.dueDate || ""}
            onChange={(e) => setState({ ...state, dueDate: e.target.value })}
            className="w-full border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <label className="block">
        <div className="text-sm text-gray-600 mb-1">Description</div>
        <textarea
          value={state.description}
          onChange={(e) => setState({ ...state, description: e.target.value })}
          rows={4}
          className="w-full border rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-2 focus:ring-blue-200"
          placeholder="Detailed description about the task..."
        />
      </label>

      <div>
        <div className="text-sm text-gray-600 mb-2">Resources</div>

        <div className="flex flex-wrap gap-2 mb-3">
          {resourcesArr.length === 0 && <div className="text-sm text-gray-400">No resources added</div>}
          {resourcesArr.map((r, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm">
              <span>{r}</span>
              <button type="button" onClick={() => removeResourceAt(idx)} className="text-xs text-red-500">✕</button>
            </div>
          ))}
        </div>

        <ResourceInput
          onAdd={(val) => {
            if (!val) return;
            addResource(val);
          }}
          placeholder="Add resource (e.g. Figma link, API docs)"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => { /* parent closes modal */ }} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
        <button type="submit" className="px-6 py-3 rounded-lg bg-blue-600 text-white text-lg shadow">Assign Task</button>
      </div>
    </form>
  );
}


/* Tasks List in Modal */
function EmployeeTasks({ data }) {
  return (
    <div className="space-y-3 max-h-80 overflow-auto pr-2">
      {data.length === 0 && <p className="text-gray-500 italic">No tasks assigned.</p>}
      {data.map((t) => (
        <div key={t._id} className="p-3 border rounded-lg shadow-sm bg-gray-50">
          <div className="flex justify-between">
            <h4 className="font-semibold">{t.title}</h4>
            <span className="text-xs px-2 py-1 rounded bg-gray-200">{t.status}</span>
          </div>
          <p className="text-sm text-gray-600">{t.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

/* Performance Chart */
function PerformanceChart({ data }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value">
            {data.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Small input styling (Tailwind utility shortcut) */
const inputClass = `
  border w-full px-3 py-2 rounded-lg shadow-sm
  focus:outline-none focus:ring-2 focus:ring-blue-300
`;
document.body.classList.add("bg-gray-50");

