"use client";

import React, { useState, useEffect } from "react";
import { Users, Clock } from "lucide-react";
import { getStaff, StaffMember } from "@/lib/platform-store";

export default function DashboardStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    setStaff(getStaff());
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Specialists &amp; Staff Shift Engine
        </h1>
        <p className="text-xs text-[#3A9295] mt-1">
          Working hours and active shift intervals directly calculate available slots in your public Ovelink.
        </p>
      </div>

      {staff.length === 0 ? (
        <div className="p-12 rounded-3xl border border-black/5 bg-white text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C8E6E2]/40 text-[#105F68] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-light text-[#105F68]">No staff specialists added yet</h3>
          <p className="text-xs text-[#3A9295] max-w-md mx-auto">
            Specialists and shift schedules added here will power calendar availability, round-robin distribution, and collective bookings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {staff.map((st) => (
            <div
              key={st.id}
              className="p-6 rounded-3xl border border-black/5 bg-white space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#105F68] text-white flex items-center justify-center text-sm font-medium">
                  {st.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h4 className="text-base font-medium text-[#105F68]">{st.name}</h4>
                  <p className="text-xs text-[#3A9295]">{st.role}</p>
                  <p className="text-[11px] text-[#3A9295] font-mono">{st.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-black/5 space-y-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#3A9295]">
                  Weekly Shift Schedule
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(st.workingHours).map(([day, shift]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#F6FAF9] border border-black/5"
                    >
                      <span className="capitalize text-[#105F68] font-medium">{day.slice(0, 3)}</span>
                      <span className="text-[#3A9295] font-mono text-[11px]">
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
    </div>
  );
}
