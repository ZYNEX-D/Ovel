"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Fingerprint, 
  Mail, 
  KeyRound, 
  UserPlus, 
  Shield, 
  Lock, 
  Trash2, 
  Check, 
  X, 
  Send 
} from "lucide-react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { useAudio } from "@/components/AudioController";
import Toast from "@/components/arc/toast/toast";
import { Dialog, DialogContent, DialogClose } from "@/components/arc/dialog/dialog";

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
    showToast(`Auth invite & Supabase magic link dispatched to ${inviteEmail}`);
  };

  const handleSendMagicLink = async (email: string) => {
    playClick();
    await sendMagicLinkToUser(email);
    showToast(`Passwordless magic login link sent to ${email}`);
  };

  const handleSendPasswordReset = async (email: string) => {
    playClick();
    await resetPasswordForEmail(email);
    showToast(`Password recovery link dispatched to ${email}`);
  };

  const handleToggleMemberStatus = (id: string, currentStatus?: string) => {
    playClick();
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    updateTeamMember(id, { status: nextStatus });
    showToast(`User account status updated to ${nextStatus.toUpperCase()}`);
  };

  const handleRemoveMember = (id: string, name: string) => {
    playClick();
    removeTeamMember(id);
    showToast(`Revoked authentication credentials for ${name}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#105F68] tracking-tight">
          Team Accounts &amp; Authentication Control
        </h1>
        <p className="text-xs text-[#3A9295] mt-1">
          Manage staff credentials, dispatch passwordless magic links, and enforce role-based permissions.
        </p>
      </div>

      {/* Auth Session Status Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#105F68] to-[#0D4F57] text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
              <Fingerprint className="w-6 h-6 text-[#63C1BB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-white">
                  Authenticated as {profile?.fullName || "Owner"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider font-semibold">
                  {profile?.role.replace("_", " ") || "business owner"}
                </span>
              </div>
              <p className="text-xs text-[#C8E6E2] font-light">
                Identity ID: <span className="font-mono">{profile?.id || "usr_owner_1"}</span> • Email: <span className="font-mono">{profile?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => profile?.email && handleSendMagicLink(profile.email)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20 transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Send Me Magic Link</span>
            </button>
            <button
              onClick={() => profile?.email && handleSendPasswordReset(profile.email)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white border border-white/20 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#63C1BB]" />
              <span>Trigger Password Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-[#C8E6E2] block">Identity Provider</span>
            <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase Auth (PostgreSQL RLS)
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-[#C8E6E2] block">Tenant Scope</span>
            <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3.5 h-3.5 text-[#63C1BB]" />
              Multi-Tenant RLS Isolated
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-[#C8E6E2] block">Active Session Token</span>
            <span className="font-medium text-white flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3.5 h-3.5 text-[#63C1BB]" />
              JWT Valid (Auto-refreshed via Supabase)
            </span>
          </div>
        </div>
      </div>

      {/* Team Accounts Table */}
      <div className="bg-white rounded-3xl border border-[#105F68]/10 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-light text-[#105F68] tracking-tight">
              Team Accounts Roster
            </h3>
            <p className="text-xs text-[#3A9295]">
              Members belonging to your organization
            </p>
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
                <th className="pb-3 font-medium">User Member</th>
                <th className="pb-3 font-medium">Auth Role</th>
                <th className="pb-3 font-medium">Permissions</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last Login</th>
                <th className="pb-3 font-medium text-right">Auth Actions</th>
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
                          title="Send Supabase Magic Link"
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

      {/* Invite Team Member Modal with Arc Dialog */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent
          title="Invite Team Member"
          description="Create Supabase Auth credentials and grant role permissions."
        >
          <div className="pt-2">
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
                  <option value="staff">Specialist Staff (Manage appointments &amp; view clients)</option>
                  <option value="business_owner">Business Owner (Full management, invoicing, staff)</option>
                  <option value="client">Client (Self-service appointments &amp; invoice payment)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#3A9295] font-medium block mb-2">Granular Role Permissions</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: "bookings:read", label: "View Appointments" },
                    { key: "bookings:write", label: "Create / Reschedule Bookings" },
                    { key: "invoicing:manage", label: "Issue Quotes & Invoices" },
                    { key: "whatsapp:manage", label: "Send WhatsApp CRM Replies" },
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
                <DialogClose asChild>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full text-xs text-[#3A9295] hover:text-[#105F68]"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#105F68] text-white text-xs font-light hover:bg-[#0D4F57] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Magic Link &amp; Grant Access</span>
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Arc UI Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50">
        <Toast
          open={Boolean(notification)}
          onOpenChange={(open) => { if (!open) setNotification(null); }}
          title={notification || ""}
          duration={3500}
        />
      </div>
    </div>
  );
}
