import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  Shield,
  Key,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut,
  Edit2,
  Save,
  X,
  Plus,
  ChevronRight,
  Clock,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import Header from '../components/Header';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import type {
  UserProfile,
  UserSession,
  InstitutionTree,
  RolePermissionMatrix,
  AuditLog,
  UserGroup,
} from '../types';

export default function ProfilePage() {
  const { signOut } = useAuthContext();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'hierarchy' | 'rbac' | 'security' | 'audit'
  >('profile');

  // Profile States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    designation: '',
    avatar_url: '',
  });
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Change Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Hierarchy States
  const [hierarchy, setHierarchy] = useState<InstitutionTree | null>(null);
  const [selectedNode, setSelectedNode] = useState<{
    type: 'institution' | 'campus' | 'department' | 'group';
    data: any;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({
    name: '',
    code: '',
    head_of_department: '',
  });

  // Sessions & Security States
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // RBAC States
  const [roleMatrix, setRoleMatrix] = useState<RolePermissionMatrix | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    target_email: '',
    target_user_id: '',
    new_role: 'Student',
    reason: 'Departmental Promotion',
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Fetch initial profile
  const fetchProfileData = async () => {
    try {
      const p = await api.getIamProfile();
      setProfile(p);
      setEditForm({
        full_name: p.full_name,
        phone_number: p.phone_number,
        designation: p.designation,
        avatar_url: p.avatar_url || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const fetchHierarchyData = async () => {
    try {
      const tree = await api.getInstitutionalHierarchy();
      setHierarchy(tree);
    } catch (err) {
      console.error('Failed to load hierarchy tree:', err);
    }
  };

  const fetchSecurityData = async () => {
    try {
      const [sessList, rbac, logs] = await Promise.allSettled([
        api.getUserSessions(),
        api.getRolePermissionMatrix(),
        api.getAuditLogs(),
      ]);
      if (sessList.status === 'fulfilled') setSessions(sessList.value);
      if (rbac.status === 'fulfilled') setRoleMatrix(rbac.value);
      if (logs.status === 'fulfilled') setAuditLogs(logs.value);
    } catch (err) {
      console.error('Failed to load security and IAM data:', err);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchHierarchyData();
    fetchSecurityData();
  }, []);

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const updated = await api.updateIamProfile(editForm);
      setProfile(updated);
      setIsEditing(false);
      setProfileSuccess('Profile changes saved successfully.');
      setTimeout(() => setProfileSuccess(null), 3500);
      fetchSecurityData();
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 1500);
      fetchSecurityData();
    } catch (err: any) {
      setPasswordError(err.message || 'Password update failed');
    }
  };

  // Revoke Session
  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this device session?')) return;
    try {
      await api.revokeUserSession(sessionId);
      fetchSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  // Assign Role
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.assignUserRole({
        target_user_id: assignForm.target_user_id || profile?.user_id || 'usr-sample',
        target_user_email: assignForm.target_email,
        new_role: assignForm.new_role,
        reason: assignForm.reason,
      });
      alert(res.message);
      setAssignModalOpen(false);
      fetchSecurityData();
      fetchProfileData();
    } catch (err: any) {
      alert(err.message || 'Role assignment failed');
    }
  };

  // Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment({
        campus_id: 'camp-vdit-01',
        name: newDeptForm.name,
        code: newDeptForm.code,
        head_of_department: newDeptForm.head_of_department,
      });
      alert(`Department '${newDeptForm.name}' registered into KLS VDIT hierarchy!`);
      setAddDeptModalOpen(false);
      setNewDeptForm({ name: '', code: '', head_of_department: '' });
      fetchHierarchyData();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    }
  };

  // Hierarchy Inspection Click
  const handleInspectNode = (
    type: 'institution' | 'campus' | 'department' | 'group',
    data: any
  ) => {
    setSelectedNode({ type, data });
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-28 font-sans">
      <Header
        title="Institutional IAM & Identity Center"
        subtitle="Personal Profile, Multi-Tier Hierarchy, Roles & Access Control"
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* TABS HEADER */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-[#E5E9ED]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <User size={15} />
            <span>Personal Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'hierarchy'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <Building size={15} />
            <span>Institutional Hierarchy</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <Shield size={15} />
            <span>Role-Based Access (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <Key size={15} />
            <span>Sessions & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#315E63] text-white shadow-sm'
                : 'bg-white text-[#64748B] hover:text-[#202A35] border border-[#E5E9ED]'
            }`}
          >
            <Clock size={15} />
            <span>Audit History ({auditLogs.length})</span>
          </button>
        </div>

        {/* NOTIFICATIONS & ALERTS */}
        {profileSuccess && (
          <div className="p-4 bg-[#27845A]/10 border border-[#27845A]/25 rounded-2xl flex items-center gap-3 text-[#27845A] text-xs font-semibold shadow-xs">
            <CheckCircle2 size={16} />
            <span>{profileSuccess}</span>
          </div>
        )}
        {profileError && (
          <div className="p-4 bg-[#C74747]/10 border border-[#C74747]/25 rounded-2xl flex items-center gap-3 text-[#C74747] text-xs font-semibold shadow-xs">
            <AlertTriangle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        {/* TAB 1: PERSONAL PROFILE */}
        {activeTab === 'profile' && profile && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Hero Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-18 h-18 rounded-2xl bg-[#315E63] text-white flex items-center justify-center text-xl font-bold border-3 border-white shadow-md">
                    {profile.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <span className="w-4 h-4 rounded-full bg-[#27845A] border-2 border-white absolute -bottom-1 -right-1 shadow-sm" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#202A35]">
                      {profile.full_name}
                    </h2>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#315E63]/10 text-[#315E63] border border-[#315E63]/20">
                      {profile.role}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#27845A]/10 text-[#27845A] border border-[#27845A]/20">
                      {profile.account_status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {profile.designation} • {profile.department_name}
                  </p>
                  <p className="text-[11px] font-mono text-[#315E63] mt-1">
                    ID: {profile.employee_or_student_id} | {profile.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit2 size={14} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white hover:bg-[#F0F4F4] text-[#64748B] border border-[#E5E9ED] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <X size={14} />
                    <span>Cancel</span>
                  </button>
                )}

                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-[#F0F4F4] text-[#315E63] border border-[#E5E9ED] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Lock size={14} />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 bg-white hover:bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Profile Fields Card */}
            <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#315E63]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#202A35]">
                    Institutional Profile Attributes
                  </h3>
                </div>
                <span className="text-[11px] text-[#64748B]">
                  Verified Karnatak Law Society Directory
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63] font-semibold"
                      required
                    />
                  ) : (
                    <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35] font-semibold">
                      {profile.full_name}
                    </p>
                  )}
                </div>

                {/* Email Address (Institutional Lock) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#202A35]">Email Address</label>
                    <span className="text-[10px] text-[#64748B]">(Institutional Lock)</span>
                  </div>
                  <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#64748B] font-mono">
                    {profile.email}
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63] font-mono"
                      required
                    />
                  ) : (
                    <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35] font-mono">
                      {profile.phone_number}
                    </p>
                  )}
                </div>

                {/* Employee / Student ID */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Student / Employee ID</label>
                  <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35] font-mono font-bold">
                    {profile.employee_or_student_id}
                  </p>
                </div>

                {/* Designation */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Official Designation</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] focus:outline-none focus:border-[#315E63]"
                      required
                    />
                  ) : (
                    <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35]">
                      {profile.designation}
                    </p>
                  )}
                </div>

                {/* Institution */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Parent Institution</label>
                  <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35]">
                    {profile.institution_name}
                  </p>
                </div>

                {/* Campus */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Assigned Campus</label>
                  <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35]">
                    {profile.campus_name}
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="font-bold text-[#202A35] block mb-1">Department</label>
                  <p className="p-3 bg-[#F7F8FA] border border-[#E5E9ED] rounded-xl text-[#202A35]">
                    {profile.department_name}
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9ED]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-[#64748B] hover:bg-[#F0F4F4] font-bold"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#315E63] hover:bg-[#274c50] text-white font-bold cursor-pointer transition shadow-sm flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: INTERACTIVE INSTITUTIONAL HIERARCHY */}
        {activeTab === 'hierarchy' && hierarchy && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hierarchy Header & Admin Controls */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#202A35]">
                  Multi-Tier Organizational Hierarchy
                </h3>
                <p className="text-xs text-[#64748B]">
                  Click any card to inspect departments, user groups, registered devices, and member telemetry
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddDeptModalOpen(true)}
                  className="px-4 py-2 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Department</span>
                </button>
              </div>
            </div>

            {/* Top Root: Institution Card */}
            <div
              onClick={() => handleInspectNode('institution', hierarchy)}
              className="p-5 rounded-3xl bg-white border-2 border-[#315E63]/40 hover:border-[#315E63] shadow-sm transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#315E63]/10 flex items-center justify-center text-[#315E63]">
                    <Building size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#315E63]">
                      Level 1: Institution Root
                    </span>
                    <h3 className="text-base font-extrabold text-[#202A35] group-hover:text-[#315E63] transition">
                      {hierarchy.name} ({hierarchy.code})
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#315E63]">
                    {hierarchy.domain}
                  </span>
                  <div className="text-[10px] text-[#64748B]">
                    {hierarchy.campuses.length} Campuses • {hierarchy.total_devices} Connected Devices
                  </div>
                </div>
              </div>
            </div>

            {/* Campuses & Departments Tree Grid */}
            <div className="space-y-4">
              {hierarchy.campuses.map((campus) => (
                <div key={campus.id} className="space-y-3">
                  {/* Campus Card */}
                  <div
                    onClick={() => handleInspectNode('campus', campus)}
                    className="p-4 rounded-2xl bg-white border border-[#E5E9ED] hover:border-[#397C78] shadow-xs cursor-pointer transition flex items-center justify-between ml-4 sm:ml-8 border-l-4 border-l-[#397C78]"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-[#397C78]" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#397C78]">
                          Level 2: Campus
                        </span>
                        <h4 className="text-sm font-bold text-[#202A35]">{campus.name}</h4>
                        <p className="text-[11px] text-[#64748B]">{campus.location}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#64748B]">
                      {campus.departments.length} Departments
                    </span>
                  </div>

                  {/* Departments Grid under Campus */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-8 sm:ml-16">
                    {campus.departments.map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => handleInspectNode('department', dept)}
                        className="p-4 rounded-2xl bg-white border border-[#E5E9ED] hover:border-[#315E63] hover:shadow-sm cursor-pointer transition space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#315E63]/10 text-[#315E63]">
                            {dept.code}
                          </span>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            {dept.device_count} Devices
                          </span>
                        </div>

                        <h5 className="font-bold text-xs text-[#202A35] group-hover:text-[#315E63] transition line-clamp-1">
                          {dept.name}
                        </h5>
                        <p className="text-[11px] text-[#64748B]">Head: {dept.head_of_department}</p>

                        <div className="pt-2 border-t border-[#E5E9ED]/60 flex items-center justify-between text-[10px] text-[#64748B]">
                          <span>{dept.user_groups.length} User Groups</span>
                          <ChevronRight size={13} className="text-[#315E63]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ROLE-BASED ACCESS CONTROL (RBAC) */}
        {activeTab === 'rbac' && roleMatrix && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#202A35]">
                  7-Tier Institutional Role Matrix & Permissions
                </h3>
                <p className="text-xs text-[#64748B]">
                  Enforces strict backend authorization rules across all operations with privilege self-elevation guardrails
                </p>
              </div>

              <button
                onClick={() => setAssignModalOpen(true)}
                className="px-4 py-2 bg-[#315E63] hover:bg-[#274c50] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                <Shield size={14} />
                <span>Assign User Role</span>
              </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleMatrix.roles.map((r, i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white border border-[#E5E9ED] space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#202A35]">{r.role_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#315E63]/10 text-[#315E63]">
                      {r.user_count} Users
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed min-h-[36px]">
                    {r.description}
                  </p>

                  <div className="pt-2 border-t border-[#E5E9ED]">
                    <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1.5">
                      Granted Permissions ({r.permissions.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((perm, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F7F8FA] border border-[#E5E9ED] text-[#202A35]"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVE SESSIONS & SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Active Device Sessions ({sessions.length})
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Manage authenticated terminal access and instantly revoke unrecognized sessions
                  </p>
                </div>
                <span className="text-xs font-bold text-[#27845A] bg-[#27845A]/10 px-2.5 py-1 rounded-full">
                  MFA Protected
                </span>
              </div>

              <div className="divide-y divide-[#E5E9ED]">
                {sessions.map((sess) => (
                  <div key={sess.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#315E63]/10 text-[#315E63] flex items-center justify-center shrink-0">
                        {sess.device_platform === 'windows' || sess.device_platform === 'macos' ? (
                          <Laptop size={20} />
                        ) : (
                          <Smartphone size={20} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#202A35]">{sess.device_name}</span>
                          <span className="w-2 h-2 rounded-full bg-[#27845A]" title="Active Now" />
                        </div>
                        <p className="text-[11px] text-[#64748B]">
                          IP: <span className="font-mono">{sess.ip_address}</span> • {sess.location_city}
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                          Last active: {new Date(sess.last_active_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#C74747]/30 text-[#C74747] hover:bg-[#C74747]/10 text-xs font-bold cursor-pointer transition shrink-0"
                    >
                      Revoke Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-white border border-[#E5E9ED] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
                <div>
                  <h3 className="text-sm font-bold text-[#202A35]">
                    Immutable IAM & Administrative Audit Trail
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Cryptographically recorded actor, action, timestamp, and target entity metadata
                  </p>
                </div>
                <span className="text-xs font-mono text-[#315E63] font-bold">
                  Tamper-Evident Log
                </span>
              </div>

              <div className="divide-y divide-[#E5E9ED]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#202A35]">{log.action}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#F0F4F4] text-[#315E63] font-mono">
                          {log.resource_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Actor: {log.actor_name} • Details: {JSON.stringify(log.details)}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#64748B] font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SIDE DRAWER: HIERARCHY NODE INSPECTION */}
      {drawerOpen && selectedNode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full h-full p-6 space-y-4 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#315E63] tracking-wider">
                    {selectedNode.type.toUpperCase()} DETAILS
                  </span>
                  <h3 className="text-base font-extrabold text-[#202A35]">
                    {selectedNode.data.name}
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-[#64748B] hover:text-[#202A35]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {selectedNode.data.code && (
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED] flex justify-between">
                    <span className="text-[#64748B]">Entity Code</span>
                    <span className="font-bold text-[#315E63]">{selectedNode.data.code}</span>
                  </div>
                )}
                {selectedNode.data.domain && (
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED] flex justify-between">
                    <span className="text-[#64748B]">Campus Domain</span>
                    <span className="font-mono text-[#202A35]">{selectedNode.data.domain}</span>
                  </div>
                )}
                {selectedNode.data.head_of_department && (
                  <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E5E9ED] flex justify-between">
                    <span className="text-[#64748B]">Head of Department</span>
                    <span className="font-semibold text-[#202A35]">{selectedNode.data.head_of_department}</span>
                  </div>
                )}

                {/* Sub-groups if department */}
                {selectedNode.data.user_groups && (
                  <div className="pt-2">
                    <span className="font-bold text-xs text-[#202A35] block mb-2">
                      Departmental User Groups ({selectedNode.data.user_groups.length})
                    </span>
                    <div className="space-y-2">
                      {selectedNode.data.user_groups.map((grp: UserGroup) => (
                        <div key={grp.id} className="p-3 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#202A35]">{grp.name}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#315E63]/10 text-[#315E63]">
                              {grp.role_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">{grp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setDrawerOpen(false)}
              className="w-full py-2.5 bg-[#F0F4F4] text-[#315E63] font-bold text-xs rounded-xl hover:bg-[#E5E9ED] transition"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35]">Change Account Password</h3>
              </div>
              <button onClick={() => setPasswordModalOpen(false)} className="text-[#64748B]">
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-[#C74747]/10 text-[#C74747] text-xs font-semibold">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-[#27845A]/10 text-[#27845A] text-xs font-semibold">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#202A35] block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#64748B] hover:bg-[#F0F4F4] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#315E63] text-white font-bold cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN USER ROLE */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35]">Assign Institutional Role</h3>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-[#64748B]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#202A35] block mb-1">Target User Email</label>
                <input
                  type="email"
                  value={assignForm.target_email}
                  onChange={(e) => setAssignForm({ ...assignForm, target_email: e.target.value })}
                  placeholder="e.g. faculty.lead@klsvdit.edu.in"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Select IAM Role</label>
                <select
                  value={assignForm.new_role}
                  onChange={(e) => setAssignForm({ ...assignForm, new_role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA] font-semibold"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Department Coordinator">Department Coordinator</option>
                  <option value="Campus Security Officer">Campus Security Officer</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Institution Administrator">Institution Administrator</option>
                  <option value="Super Administrator">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Reason / Authorization Reference</label>
                <input
                  type="text"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div className="p-3 bg-[#F0F4F4] text-[#315E63] rounded-xl text-[11px]">
                Note: Administrative role changes are cryptographically logged in the immutable audit trail.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#64748B] hover:bg-[#F0F4F4] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#315E63] text-white font-bold cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEPARTMENT */}
      {addDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E5E9ED] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E9ED] pb-3">
              <div className="flex items-center gap-2">
                <Building size={18} className="text-[#315E63]" />
                <h3 className="text-sm font-bold text-[#202A35]">Add Campus Department</h3>
              </div>
              <button onClick={() => setAddDeptModalOpen(false)} className="text-[#64748B]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#202A35] block mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  placeholder="e.g. Electrical & Electronics Engineering"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Department Code</label>
                <input
                  type="text"
                  value={newDeptForm.code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value })}
                  placeholder="e.g. EEE-VDIT"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#202A35] block mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  value={newDeptForm.head_of_department}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, head_of_department: e.target.value })}
                  placeholder="e.g. Dr. K. S. Pujar"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E9ED] bg-[#F7F8FA]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#64748B] hover:bg-[#F0F4F4] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#315E63] text-white font-bold cursor-pointer"
                >
                  Register Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
