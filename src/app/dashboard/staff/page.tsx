"use client";

import React, { useState } from "react";
import { Users, Clock, Plus, Sparkles, UserCheck, Calendar } from "lucide-react";
import { getStaff, INITIAL_STAFF, saveStaff, StaffMember } from "@/lib/platform-store";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import { useClientStore } from "@/lib/use-client-store";

const DEFAULT_HOURS = {
  monday: { start: "09:00", end: "18:00", active: true },
  tuesday: { start: "09:00", end: "18:00", active: true },
  wednesday: { start: "09:00", end: "18:00", active: true },
  thursday: { start: "09:00", end: "18:00", active: true },
  friday: { start: "09:00", end: "18:00", active: true },
  saturday: { start: "10:00", end: "16:00", active: true },
  sunday: { start: "00:00", end: "00:00", active: false },
};

export default function DashboardStaffPage() {
  const { profile, isLoading } = useAuth();
  const { playClick, playSuccess } = useAudio();
  const wsId = profile?.organizationId;
  const staff = useClientStore(() => getStaff(wsId), () => INITIAL_STAFF);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Team Member");
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    playSuccess();

    const newMember: StaffMember = {
      id: "st_" + Date.now(),
      name: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      role: newRole,
      workingHours: DEFAULT_HOURS,
      isActive: true,
    };

    const updated = [...staff, newMember];
    saveStaff(updated, wsId);
    setIsAddStaffOpen(false);
    setNewName("");
    setNewEmail("");
    setNewRole("Team Member");
    showToast(`"${newMember.name}" added to team`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notification && (
        <div className="p-3 bg-[#105F68] text-white text-xs rounded-2xl flex items-center justify-between shadow-lg">
          <span>{notification}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            Staff
          </h1>
          <p className="text-xs text-[#3A9295] mt-1 max-w-2xl leading-relaxed">
            Shifts and availability.
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            setIsAddStaffOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Team Member</span>
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="p-12 rounded-3xl border border-slate-200/80 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-900">No team members added yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Add your team, stylists, instructors, or consultants to enable online bookings, automatic schedule assignment, and collective availability.
            </p>
          </div>
          <button
            onClick={() => {
              playClick();
              setIsAddStaffOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Your First Team Member</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {staff.map((st) => (
            <div
              key={st.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#105F68] text-white flex items-center justify-center text-sm font-medium shrink-0">
                  {st.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{st.name}</h4>
                  <p className="text-xs text-[#105F68] font-medium">{st.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{st.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Weekly Availability
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(st.workingHours).map(([day, shift]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-200/60"
                    >
                      <span className="capitalize text-slate-700 font-medium">{day.slice(0, 3)}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {shift.active ? `${shift.start} - ${shift.end}` : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#105F68] text-white flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Add Team Member</h3>
                <p className="text-xs text-slate-500">Role and availability.</p>
              </div>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-xs text-slate-700 font-medium block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-medium block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alex@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-medium block mb-1">Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Consultant, Lead Stylist, Instructor, Specialist"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#105F68] text-white text-xs font-medium hover:bg-[#0D4F57] shadow-xs"
                >
                  Add to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
