"use client";

import React, { useState } from "react";
import { 
  Fingerprint, 
  Mail, 
  KeyRound, 
  UserPlus, 
  Shield, 
  Trash2, 
  Check, 
  X, 
  Send 
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";

export default function DashboardTeamPage() {
  const { playClick, playSuccess } = useAudio();
  const { 
    profile, 
    teamMembers, 
    inviteTeamMember, 
    updateTeamMember, 
    removeTeamMember, 
    sendMagicLinkToUser, 
    resetPasswordForEmail 
  } = useAuth();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("staff");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "bookings:read", 
    "bookings:write"
  ]);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    playSuccess();

    await inviteTeamMember({
      fullName: inviteName,
      email: inviteEmail,
      role: inviteRole,
      permissions: selectedPermissions,
    });

    setIsInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setSelectedPermissions(["bookings:read", "bookings:write"]);
    showToast(`Invite sent to ${inviteEmail}.`);
  };

  const handleSendMagicLink = async (email: string) => {
    playClick();
    await sendMagicLinkToUser(email);
    showToast(`Login link sent to ${email}.`);
  };

  const handleSendPasswordReset = async (email: string) => {
    playClick();
    await resetPasswordForEmail(email);
    showToast(`Reset link sent to ${email}.`);
  };

  const handleToggleMemberStatus = (id: string, currentStatus?: string) => {
    playClick();
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    updateTeamMember(id, { status: nextStatus });
    showToast(`Account updated.`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    playClick();
    removeTeamMember(id);
    showToast(`Removed ${name}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Team
        </h1>
        <p className="text-xs text-[#3A9295] mt-1">
          Members and roles.
        </p>
      </div>

      {/* Session */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#105F68] to-[#0D4F57] text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-[#63C1BB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-white">
                  {profile?.fullName || "Owner"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider font-semibold">
                  {profile?.role?.replace("_", " ") || "owner"}
                </span>
              </div>
              <p className="text-xs text-[#C8E6E2]">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => profile?.email && handleSendMagicLink(profile.email)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20 transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Send login link</span>
            </button>
            <button
              onClick={() => profile?.email && handleSendPasswordReset(profile.email)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Reset password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Team Accounts Table */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-light text-[#105F68] tracking-tight">
              Members
            </h3>
          </div>

          <button
            onClick={() => {
              playClick();
              setIsInviteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 text-[#3A9295] uppercase tracking-wider">
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Permissions</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last Login</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {teamMembers.map((member) => {
                const initials = member.fullName.split(" ").map(n => n[0]).join("").slice(0, 2);
                const isOwner = member.role === "business_owner";
                return (
                  <tr key={member.id} className="hover:bg-[#F6FAF9]/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#105F68] text-white flex items-center justify-center font-medium text-xs">
                          {initials}
                        </div>
                        <div>
                          <span className="font-medium text-[#105F68] block">{member.fullName}</span>
                          <span className="text-[11px] text-[#3A9295] font-mono">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        member.role === "business_owner" 
                          ? "bg-[#105F68] text-white" 
                          : member.role === "super_admin"
                          ? "bg-purple-100 text-purple-800"
                          : member.role === "staff"
                          ? "bg-[#63C1BB]/20 text-[#105F68]"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {member.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(member.permissions || ["bookings:read"]).map((p) => (
                          <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 text-[#3A9295] font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        member.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : member.status === "invited"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          member.status === "active" ? "bg-emerald-500" : member.status === "invited" ? "bg-amber-500" : "bg-red-500"
                        }`}></span>
                        {member.status?.toUpperCase() || "ACTIVE"}
                      </span>
                    </td>

                    <td className="py-4 text-[#3A9295] font-mono text-[11px]">
                      {member.lastLogin || "Recently"}
                    </td>

                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleSendMagicLink(member.email)}
                          title="Send login link"
                          className="p-1.5 rounded-lg border border-black/10 hover:bg-[#F6FAF9] text-[#105F68] transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSendPasswordReset(member.email)}
                          title="Send Password Reset Email"
                          className="p-1.5 rounded-lg border border-black/10 hover:bg-[#F6FAF9] text-[#3A9295] transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {!isOwner && (
                          <button
                            onClick={() => handleToggleMemberStatus(member.id, member.status)}
                            title={member.status === "active" ? "Suspend Account" : "Activate Account"}
                            className="p-1.5 rounded-lg border border-black/10 hover:bg-[#F6FAF9] text-amber-600 transition-all"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isOwner && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.fullName)}
                            title="Revoke User Access"
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Team Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#105F68]/20 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#105F68] text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-light text-[#105F68]">Invite Team Member</h3>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-[#3A9295] hover:text-[#105F68] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteTeamMember} className="space-y-4">
              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Work Email</label>
                <input
                  type="email"
                  placeholder="elena@business.co"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                />
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-1">Access Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F6FAF9] border border-black/10 text-xs text-[#105F68] focus:outline-none focus:border-[#105F68]"
                >
                  <option value="staff">Staff</option>
                  <option value="business_owner">Owner</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: "bookings:read", label: "View Appointments" },
                    { key: "bookings:write", label: "Create / Reschedule Bookings" },
                    { key: "invoicing:manage", label: "Issue Quotes & Invoices" },
                    { key: "whatsapp:manage", label: "Send WhatsApp replies" },
                    { key: "staff:manage", label: "Edit Specialist Hours" },
                    { key: "reports:view", label: "Access Financial Reports" },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 p-2 rounded-xl bg-[#F6FAF9] border border-black/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.key]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                          }
                        }}
                        className="rounded border-[#105F68] text-[#105F68] focus:ring-0"
                      />
                      <span className="text-[11px] text-[#105F68]">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send invite</span>
                </button>
              </div>
            </form>
          </div>
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
