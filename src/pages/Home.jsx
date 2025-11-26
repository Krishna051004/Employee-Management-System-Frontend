// src/pages/Home.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { useNavigate } from "react-router-dom";

/**
 * Home.jsx — Login page as homepage
 *
 * Notes:
 * - toggles role (admin/employee) and hits either
 *    /auth/admin/login  OR  /auth/employee/login
 * - requires `src/api.js` to exist (axios with base '/api')
 * - place an optional image at public/3d-computer.png for nicer visuals,
 *   otherwise a styled SVG/shape will render.
 */

export default function Home() {
  const nav = useNavigate();
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loginPath =
    role === "admin" ? "/auth/admin/login" : "/auth/employee/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(loginPath, { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem("ems_token", token);
      localStorage.setItem("ems_user", JSON.stringify(user));
      window.dispatchEvent(new Event("ems-auth-changed"));
      // redirect based on role
      if (user.role === "admin") nav("/admin");
      else nav("/employee");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center">
      <div className="container mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Login card */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-lg w-full mx-auto bg-gradient-to-b from-white via-slate-50 to-slate-100/80 backdrop-blur rounded-3xl shadow-2xl border border-slate-200/70 p-7 sm:p-9"
        >
          <div className="mb-5">
            <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">
              Welcome back
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Sign in to EMS
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Choose your role and enter your credentials to access the
              dashboard.
            </p>
          </div>

          {/* Role toggle with smooth transition */}
          <div className="mb-7">
            <div className="inline-flex p-1 rounded-full bg-slate-900/5 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`px-5 py-1.5 rounded-full transition-all ${
                  role === "admin"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-700"
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("employee")}
                className={`px-5 py-1.5 rounded-full transition-all ${
                  role === "employee"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-700"
                }`}
              >
                Employee
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={role}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-3 text-xs text-slate-500"
              >
                {role === "admin"
                  ? "Admins can manage employees, tasks and analytics."
                  : "Employees can view their tasks, update progress and add feedback."}
              </motion.p>
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 flex items-center px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex justify-center items-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Signing in..." : `Sign in as ${role}`}
            </button>

            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
              By signing in you agree to the company policies. Admins receive
              access to all employee and task data. Employees only see their own
              tasks and feedback.
            </p>
          </form>
        </motion.div>

        {/* Right: Role-specific information panel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative w-full max-w-xl">
            <div
              className="absolute -inset-10 blur-3xl opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, #60a5fa, transparent 55%), radial-gradient(circle at 100% 100%, #7c3aed, transparent 55%)",
              }}
            />

            <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 text-slate-50 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.8)] border border-slate-700/60 p-9">
              <AnimatePresence mode="wait">
                {role === "admin" ? (
                  <motion.div
                    key="admin-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="text-2xl font-semibold tracking-tight">
                      Admin overview
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Monitor employees, assign tasks and track progress in a
                      single dashboard built for managers.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Team visibility
                        </div>
                        <p className="text-slate-300/90">
                          See workload, task statuses and recent activity across
                          your organization.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Smart analytics
                        </div>
                        <p className="text-slate-300/90">
                          Understand completion rates and bottlenecks with clear
                          visual summaries.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Task control
                        </div>
                        <p className="text-slate-300/90">
                          Create, assign and update tasks in real time for any
                          employee.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Feedback loop
                        </div>
                        <p className="text-slate-300/90">
                          Capture feedback on tasks to keep projects improving
                          over time.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="employee-panel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h3 className="text-2xl font-semibold tracking-tight">
                      Employee experience
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Stay focused on what matters with a clear view of your
                      tasks, priorities and feedback.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Personal task list
                        </div>
                        <p className="text-slate-300/90">
                          See everything assigned to you, including due dates
                          and current status.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Progress updates
                        </div>
                        <p className="text-slate-300/90">
                          Quickly move tasks between Not Started, In Progress
                          and Completed.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Feedback channel
                        </div>
                        <p className="text-slate-300/90">
                          Share short updates or questions with admins directly
                          on each task.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-50">
                          Clear priorities
                        </div>
                        <p className="text-slate-300/90">
                          Focus on today&apos;s work with a clean, distraction-free
                          layout.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature highlights under the login container */}
      <section className="mt-10 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Instant feedback
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Employees can share quick comments on tasks so admins always
                know what&apos;s blocked and what&apos;s moving forward.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Task management
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Create, assign and track work in one place with clear statuses:
                Not Started, In Progress and Completed.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Clear visibility
              </h3>
              <p className="mt-2 text-xs text-slate-600">
                Dashboards for admins and employees keep everyone aligned on
                priorities, timelines and performance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
