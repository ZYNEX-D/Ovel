"use client";

import React, { useState } from "react";
import { X, Check, Calendar, Clock, User, ShieldCheck, ArrowRight, MessageSquare, CheckCircle2 } from "lucide-react";
import { useAudio } from "./AudioController";

interface BookingDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingDemoModal({ isOpen, onClose }: BookingDemoModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState("Aesthetic Consultation & Plan");
  const [selectedStaff, setSelectedStaff] = useState("Dr. Genevieve Moreau");
  const [selectedDate, setSelectedDate] = useState("Tomorrow, 10:30 AM");
  const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
  const { playClick, playSuccess } = useAudio();

  if (!isOpen) return null;

  const handleNext = () => {
    playClick();
    if (step < 4) {
      setStep((step + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSimulateWhatsApp = () => {
    playSuccess();
    setWhatsappConfirmed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-[2.5rem] border border-[#105F68]/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-black/5 bg-[#F6FAF9]/80">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#105F68] text-white flex items-center justify-center text-xs font-semibold">
              {step}/4
            </span>
            <div>
              <h3 className="text-xl font-light text-[#105F68] tracking-tight">
                {step === 1 && "Select Service & Specialist"}
                {step === 2 && "Choose Date & Instant Slot"}
                {step === 3 && "Deposit & Zero-Fee Checkout"}
                {step === 4 && "2-Way WhatsApp Confirmation"}
              </h3>
              <p className="text-xs text-[#3A9295] font-light">
                Ovel Live Engine Simulation (Zero Take-Rate)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#105F68] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex-1 overflow-y-auto max-h-[70vh]">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs uppercase tracking-widest text-[#3A9295] font-light block mb-3">
                  1. Select Service
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: "Aesthetic Consultation & Plan", price: "$120", time: "45 min" },
                    { name: "Hydrafacial Glow & Lymphatic", price: "$195", time: "60 min" },
                    { name: "Executive Precision Styling", price: "$85", time: "40 min" },
                    { name: "Ceramic Coating Detail", price: "$350", time: "180 min" },
                  ].map((srv) => (
                    <div
                      key={srv.name}
                      onClick={() => {
                        playClick();
                        setSelectedService(srv.name);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedService === srv.name
                          ? "border-[#105F68] bg-[#C8E6E2]/25 shadow-sm"
                          : "border-black/5 hover:border-[#105F68]/30 bg-[#FBFDFD]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-[#105F68]">{srv.name}</span>
                        <span className="text-xs font-semibold text-[#105F68]">{srv.price}</span>
                      </div>
                      <span className="text-xs text-[#3A9295] font-light">{srv.time} duration</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-[#3A9295] font-light block mb-3">
                  2. Select Specialist / Staff
                </label>
                <div className="flex flex-wrap gap-3">
                  {["Dr. Genevieve Moreau", "Camille Laurent", "Marcus Vance", "Any Available"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        playClick();
                        setSelectedStaff(st);
                      }}
                      className={`px-4 py-2.5 rounded-full text-xs font-light tracking-tight transition-all flex items-center gap-2 border ${
                        selectedStaff === st
                          ? "bg-[#105F68] text-white border-[#105F68]"
                          : "bg-white text-[#105F68] border-black/10 hover:border-[#105F68]/40"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#C8E6E2]/20 border border-[#9ED5D1]/40 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#105F68]" />
                <div className="text-xs text-[#105F68]">
                  <p className="font-medium">Real-Time Availability Slot Engine</p>
                  <p className="text-[#3A9295]">Staff working hours minus calendar sync minus 15m buffer.</p>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-[#3A9295] font-light block mb-3">
                  Available Slots
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    "Tomorrow, 09:30 AM",
                    "Tomorrow, 10:30 AM",
                    "Tomorrow, 02:00 PM",
                    "Tomorrow, 03:45 PM",
                    "Friday, 11:00 AM",
                    "Friday, 01:30 PM",
                  ].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        playClick();
                        setSelectedDate(slot);
                      }}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${
                        selectedDate === slot
                          ? "border-[#105F68] bg-[#105F68] text-white"
                          : "border-black/5 hover:border-[#105F68]/40 text-[#105F68] bg-[#FBFDFD]"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 mb-1.5 opacity-70" />
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#F6FAF9] border border-[#105F68]/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#3A9295]">Service:</span>
                  <span className="font-medium text-[#105F68]">{selectedService}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#3A9295]">Specialist:</span>
                  <span className="font-medium text-[#105F68]">{selectedStaff}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#3A9295]">Slot:</span>
                  <span className="font-medium text-[#105F68]">{selectedDate}</span>
                </div>
                <div className="h-px bg-black/5 my-2"></div>
                <div className="flex justify-between text-sm font-semibold text-[#105F68]">
                  <span>Required Deposit (Card on File):</span>
                  <span>$35.00</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#3A9295]">
                  <ShieldCheck className="w-4 h-4 text-[#105F68]" />
                  <span>0% Ovel Platform Take-Rate. 100% routed to merchant via Stripe Connect.</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#C8E6E2] text-[#105F68] flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-light text-[#105F68] tracking-tight">
                Appointment Booked & Locked
              </h4>
              <p className="text-xs text-[#3A9295] max-w-md mx-auto">
                A live confirmation SMS and calendar invite have been dispatched. Below is the automated interactive 2-way reminder simulator:
              </p>

              {/* Simulated WhatsApp Notification Box */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] text-left text-xs text-[#1B5E20] space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <MessageSquare className="w-4 h-4 text-[#2E7D32]" />
                  <span>WhatsApp Business: Ovel Dispatcher</span>
                </div>
                <p>
                  &quot;Hi Sarah! Reminder for your {selectedService} appointment with {selectedStaff} on {selectedDate}. Reply <b>1</b> to Confirm or <b>2</b> to Reschedule.&quot;
                </p>
                {!whatsappConfirmed ? (
                  <button
                    onClick={handleSimulateWhatsApp}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-[#2E7D32] text-white font-medium hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2"
                  >
                    Simulate Client Replying &quot;1&quot; (Confirm)
                  </button>
                ) : (
                  <div className="mt-2 p-2 rounded bg-white/80 text-[#2E7D32] font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Appointment confirmed automatically in real-time database!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 border-t border-black/5 bg-[#F6FAF9]/80 flex justify-between items-center">
          {step > 1 && step < 4 ? (
            <button
              onClick={() => {
                playClick();
                setStep((step - 1) as 1 | 2 | 3);
              }}
              className="text-xs text-[#3A9295] hover:text-[#105F68] font-light"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light tracking-tight hover:bg-[#0D4F57] transition-all flex items-center gap-2 shadow-sm"
            >
              {step === 3 ? "Confirm & Pay Deposit" : "Continue"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="px-6 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light tracking-tight hover:bg-[#0D4F57] transition-all"
            >
              Close Simulation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
