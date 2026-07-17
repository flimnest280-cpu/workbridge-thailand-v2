import React, { useState } from 'react';
import { Search, User as UserIcon, Shield, Trash2, ArrowLeftRight } from 'lucide-react';

interface User {
  id: string;
  phone: string;
  role: 'seeker' | 'employer' | 'admin';
  fullName?: string;
  lineId?: string;
  createdAt: string;
}

interface AdminUsersViewProps {
  users: User[];
  adminUserSearch: string;
  setAdminUserSearch: (v: string) => void;
  adminUserRoleFilter: 'all' | 'seeker' | 'employer' | 'admin';
  setAdminUserRoleFilter: (v: 'all' | 'seeker' | 'employer' | 'admin') => void;
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: 'seeker' | 'employer' | 'admin') => Promise<void>;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  adminUserSearch,
  setAdminUserSearch,
  adminUserRoleFilter,
  setAdminUserRoleFilter,
  onDeleteUser,
  onUpdateRole
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null);

  const handleDeleteClick = (userId: string) => {
    if (deleteConfirmId === userId) {
      onDeleteUser(userId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(userId);
      // Automatically reset confirmation after 3 seconds of inactivity
      setTimeout(() => {
        setDeleteConfirmId((prev) => (prev === userId ? null : prev));
      }, 3000);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'seeker' | 'employer' | 'admin') => {
    await onUpdateRole(userId, newRole);
    setRoleChangingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">User Account Management</h3>
        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
          {users.length} registered
        </span>
      </div>

      {/* Users Search & Filter Bar */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
        <div className="relative">
          <input 
            type="text"
            placeholder="Search users by name, phone, LINE ID..."
            value={adminUserSearch}
            onChange={(e) => setAdminUserSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-slate-800"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {(['all', 'seeker', 'employer', 'admin'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setAdminUserRoleFilter(role)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold capitalize whitespace-nowrap transition-colors border ${
                adminUserRoleFilter === role 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* User cards list */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
            <UserIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">No matching users found</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 shadow-3xs relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    user.role === 'admin' 
                      ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                      : user.role === 'employer'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {user.role === 'admin' ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{user.fullName || "Unnamed User"}</h4>
                    <p className="text-[10px] text-slate-400 capitalize font-semibold">{user.role} Account</p>
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 font-mono">
                  Since: {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Contact Info list */}
              <div className="text-[9px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-xl">
                <div>📞 Phone: <span className="font-semibold text-slate-700">{user.phone}</span></div>
                {user.lineId && (
                  <div>💬 LINE ID: <span className="font-semibold text-slate-700">{user.lineId}</span></div>
                )}
                <div className="text-[8px] text-slate-400 font-mono truncate">ID: {user.id}</div>
              </div>

              {/* Actions panel */}
              <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-50">
                {/* Role Switcher */}
                {roleChangingId === user.id ? (
                  <div className="flex gap-1">
                    {(['seeker', 'employer', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(user.id, r)}
                        className={`px-2 py-1 text-[8px] font-bold rounded-md capitalize transition-all ${
                          user.role === r
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      onClick={() => setRoleChangingId(null)}
                      className="px-2 py-1 text-[8px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRoleChangingId(user.id)}
                    className="flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors border border-blue-100"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Change Role
                  </button>
                )}

                {/* Delete button (confirm workflow) */}
                <button
                  onClick={() => handleDeleteClick(user.id)}
                  className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-md border transition-all ${
                    deleteConfirmId === user.id
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{deleteConfirmId === user.id ? 'Confirm Delete?' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
