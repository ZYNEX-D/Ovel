"use client";

import React, { useState } from "react";
import { MessageSquare, Check, RotateCcw } from "lucide-react";
import { getReminders, INITIAL_REMINDERS, simulateWhatsAppReply } from "@/lib/platform-store";
import { useClientStore } from "@/lib/use-client-store";
import { useAudio } from "@/components/AudioController";
import { useAuth } from "@/lib/auth-context";

export default function DashboardRemindersPage() {
  const { profile, isLoading } = useAuth();
  const { playSuccess } = useAudio();
  const wsId = profile?.organizationId;
  const reminders = useClientStore(() => getReminders(wsId), () => INITIAL_REMINDERS);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSimulateWhatsApp = (bookingId: string, replyBody: "1" | "2") => {
    playSuccess();
    simulateWhatsAppReply(bookingId, replyBody, wsId);
    showToast(
      replyBody === "1"
        ? "Client replied '1': Appointment automatically confirmed!"
        : "Client replied '2': Reschedule flow initiated."
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
            2-Way WhatsApp Interactive Reminders Engine
          </h1>
          <p className="text-xs text-[#3A9295] mt-1">
            Automated WhatsApp reminders dispatched at T-24h and T-2h with instant reply parsing.
          </p>
        </div>

        <div className="text-xs px-3 py-1 rounded-full bg-[#E8F5E9] text-[#2E7D32] font-medium border border-[#A5D6A7]">
          Webhook Active: /api/webhooks/whatsapp
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl border border-black/5 bg-white text-center space-y-3 select-none">
          <video
            src="/animations/noresult.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-28 h-28 sm:w-32 sm:h-32 mx-auto object-contain pointer-events-none mb-1"
          />
          <h3 className="text-base font-medium text-[#105F68]">No WhatsApp reminders dispatched yet</h3>
          <p className="text-xs text-[#3A9295] max-w-md mx-auto">
            Automated WhatsApp reminders are sent at T-24h and T-2h before upcoming bookings with 2-way reply confirmation parsing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className="p-5 rounded-2xl border border-black/5 bg-white shadow-sm space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2E7D32]" />
                  <span className="font-medium text-[#105F68]">{rem.clientName}</span>
                  <span className="text-[#3A9295]">({rem.clientPhone})</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-[#3A9295]">
                    {rem.triggerType}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                    rem.status === "replied_confirmed"
                      ? "bg-[#63C1BB]/20 text-[#105F68]"
                      : rem.status === "replied_cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {rem.status.replace("_", " ")}
                </span>
              </div>

              <p className="p-3 rounded-xl bg-[#E8F5E9]/60 text-[#1B5E20] border border-[#A5D6A7]/40 leading-relaxed font-mono">
                {rem.messageText}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/5">
                <span className="text-[11px] text-[#3A9295]">
                  Simulate Incoming Client WhatsApp Reply:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSimulateWhatsApp(rem.bookingId, "1")}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[11px] font-medium transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    <span>Reply &quot;1&quot; (Confirm Booking)</span>
                  </button>

                  <button
                    onClick={() => handleSimulateWhatsApp(rem.bookingId, "2")}
                    className="px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-medium transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reply &quot;2&quot; (Reschedule)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#105F68] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-[#63C1BB]" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
