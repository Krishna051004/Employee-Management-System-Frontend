import React from "react";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">EMS</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Built for modern teams.</span>
          <div className="flex gap-3">
            <a
              href="#about"
              className="hover:text-slate-800 transition-colors"
            >
              About us
            </a>
            <a
              href="#contact"
              className="hover:text-slate-800 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


