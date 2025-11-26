// src/components/Nav.jsx
import React, { useEffect, useState } from "react";

function readUser() {
  try {
    const raw = localStorage.getItem("ems_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Nav() {
  const [user, setUser] = useState(() => readUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(readUser());
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("ems-auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("ems-auth-changed", handleAuthChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("ems_token");
    localStorage.removeItem("ems_user");
    window.dispatchEvent(new Event("ems-auth-changed"));
    // use full redirect to avoid needing useNavigate()
    window.location.href = "/login";
  };

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-20 flex items-center justify-between gap-4">
          {/* Left: EMS logo in the corner */}
          <a
            href="/"
            className="flex items-center gap-2 group"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-sm group-hover:shadow-md transition-shadow">
              EMS
            </div>
          </a>

          {/* Center: Title */}
          <div className="flex-1 flex justify-center">
            <div className="text-center">
              <div className="text-sm sm:text-base font-semibold tracking-tight text-slate-900">
                Employee Management System
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500">
                Modern workspace for admins and employees
              </div>
            </div>
          </div>

          {/* Right: Auth actions */}
          <nav className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            {!user && (
              <a
                href="/login"
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-4 py-2 shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Login
              </a>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-[11px] sm:text-xs text-slate-600">
                  Hi,{" "}
                  <span className="font-semibold text-slate-900">
                    {user.name || user.email || "User"}
                  </span>
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
