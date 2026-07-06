"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Paperclip, Smile, Search, ArrowLeft, Plus, Users,
  Edit2, Trash2, UserPlus, UserMinus, Shield, X, Check,
  AlertCircle, Loader2
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';



const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      ''
    : '';

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const colorFor = (str = '') => {
  const palette = [
    'bg-rose-500','bg-orange-500','bg-amber-500','bg-emerald-500',
    'bg-teal-500','bg-sky-500','bg-indigo-500','bg-violet-500','bg-pink-500',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
};

const Avatar = ({ name, photo, size = 10 }) => {
  const sz = `w-${size} h-${size}`;
  if (photo) return <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <span className={`${sz} rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-xs ${colorFor(name)}`}>
      {getInitials(name)}
    </span>
  );
};

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-up
      ${type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
      {type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
      {msg}
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-5">{children}</div>
    </div>
  </div>
);

export default function ChatPage() {
  const [groups, setGroups]           = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [selectedGroup, setSelected]  = useState(null);
  const [messages, setMessages]       = useState([]);
  const [inputMsg, setInputMsg]       = useState('');
  const [search, setSearch]           = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [toast, setToast]             = useState(null);

  const [modal, setModal]               = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [renameVal, setRenameVal]       = useState('');
  // FIX 2: dropdown selected user id (string)
  const [selectedUserId, setSelectedUserId] = useState('');

  const msgEndRef = useRef(null);



const [selectedImage, setSelectedImage] = useState(null);
const [imagePreview, setImagePreview] = useState('');
const [fullImage, setFullImage] = useState(null);

const fileInputRef = useRef(null);


  const notify = (msg, type = 'success') => setToast({ msg, type });
  const closeModal = () => {
    setModal(null);
    setNewGroupName('');
    setRenameVal('');
    setSelectedUserId('');
  };

  // ── API ──────────────────────────────────────────────────────────────────────
  const apiFetch = useCallback(async (path, opts = {}) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const data = await apiFetch('/chat/groups');
      // Adjust the key below to match your API response shape:
      // e.g. data.groups | data.data | data.data.groups
      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.groups)
        ? data.groups
        : Array.isArray(data)
        ? data
        : [];
      setGroups(list);
    } catch (err) {
      if (err.message !== 'UNAUTHORIZED') {
        // endpoint may not exist yet — fail silently
        console.warn('loadGroups failed:', err.message);
      }
      setGroups([]);
    }
  }, [apiFetch]);

  // FIX 1: API returns { users: [...] } — not data.data
  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/auth/all');
      setAllUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') notify('Session expired — please log in again', 'error');
      setAllUsers([]);
    }
  }, [apiFetch]);

  // Re-fetch whenever the page gains focus (e.g. after login redirect)
  useEffect(() => {
    loadGroups();
    loadUsers();
  }, [loadGroups, loadUsers]);

  useEffect(() => {
    const onFocus = () => { loadGroups(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadGroups]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Group CRUD ───────────────────────────────────────────────────────────────
  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch('/chat/create-group', {
        method: 'POST',
        body: JSON.stringify({ group_name: newGroupName.trim(), group_type: 'custom' }),
      });
      const g = data?.data;
      if (g) { setGroups(prev => [g, ...prev]); notify('Group created!'); }
      closeModal();
    } catch (err) {
      notify(err.message === 'UNAUTHORIZED' ? 'Not authorized' : 'Failed to create group', 'error');
    } finally { setLoading(false); }
  };

  const renameGroup = async () => {
    if (!renameVal.trim() || !selectedGroup) return;
    setLoading(true);
    try {
      await apiFetch(`/chat/update-group-name/${selectedGroup.id}`, {
        method: 'PUT',
        body: JSON.stringify({ group_name: renameVal.trim() }),
      });
      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, group_name: renameVal.trim() } : g));
      setSelected(s => ({ ...s, group_name: renameVal.trim() }));
      notify('Group renamed!');
      closeModal();
    } catch (err) {
      notify(err.message === 'UNAUTHORIZED' ? 'Not authorized' : 'Failed to rename group', 'error');
    } finally { setLoading(false); }
  };

  const deleteGroup = async (gid) => {
    setLoading(true);
    try {
      await apiFetch(`/chat/delete-group/${gid}`, { method: 'DELETE' });
      setGroups(prev => prev.filter(g => g.id !== gid));
      if (selectedGroup?.id === gid) setSelected(null);
      notify('Group deleted');
      closeModal();
    } catch (err) {
      notify(err.message === 'UNAUTHORIZED' ? 'Not authorized' : 'Failed to delete group', 'error');
    } finally { setLoading(false); }
  };

  // FIX 3 & 4: addMember uses dropdown selectedUserId; updates members immediately
  const addMember = async () => {
    if (!selectedGroup || !selectedUserId) return;
    const userId = Number(selectedUserId);
    setLoading(true);
    try {
      await apiFetch(`/chat/add-member/${selectedGroup.id}`, {
        method: 'POST',
        body: JSON.stringify({ userId: String(userId) }),
      });
      notify('Member added!');
      const updatedMembers = [...(selectedGroup.members || []), userId];
      setGroups(prev => prev.map(g =>
        g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g
      ));
      setSelected(s => ({ ...s, members: updatedMembers }));
      setSelectedUserId('');
    } catch (err) {
      notify(err.message === 'UNAUTHORIZED' ? 'Not authorized' : 'Failed to add member', 'error');
    } finally { setLoading(false); }
  };

  // FIX 5: removeMember uses DELETE
  const removeMember = async (userId) => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      await apiFetch(`/chat/remove-member/${selectedGroup.id}/${userId}`, { method: 'DELETE' });
      notify('Member removed');
      const updatedMembers = (selectedGroup.members || []).filter(m => m !== userId);
      setGroups(prev => prev.map(g =>
        g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g
      ));
      setSelected(s => ({ ...s, members: updatedMembers }));
    } catch (err) {
      notify(err.message === 'UNAUTHORIZED' ? 'Not authorized' : 'Failed to remove member', 'error');
    } finally { setLoading(false); }
  };

  const makeAdmin = async (userId) => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      await apiFetch(`/chat/make-user-admin/${selectedGroup.id}`, {
        method: 'POST',
        body: JSON.stringify({ userId: String(userId) }),
      });
      notify('User promoted to admin!');
    } catch (err) {
      notify(err.message === 'UNAUTHORIZED' ? 'Not authorized' : 'Failed to make admin', 'error');
    } finally { setLoading(false); }
  };


  const handleImageSelect = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  setSelectedImage(file);
  setImagePreview(URL.createObjectURL(file));
};





useEffect(() => {

  if (selectedGroup?.id) {
    loadMessages(selectedGroup.id);
  }

}, [selectedGroup]);




const loadGroupDetails = async (groupId) => {

  try {

    const token = getToken();

    const res = await fetch(
      `${API_BASE}/chats/user-chat-groups`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    console.log("GROUP DETAILS =>", data);

    const groups =
      data?.data ||
      data?.groups ||
      [];

    const foundGroup = groups.find(
      (g) => Number(g.id) === Number(groupId)
    );

    if (foundGroup) {
      setSelected(foundGroup);
    }

  } catch (err) {
    console.log(err);
  }
};



const loadMessages = async (groupId) => {

  try {

    const token = getToken();

    const res = await fetch(
      `${API_BASE}/chats/group-messages/${groupId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    console.log("GROUP MESSAGES =>", data);

    const msgs =
      data?.data ||
      data?.messages ||
      [];

    const formatted = msgs.map((m) => {

      const file = m.files?.[0];

      return {
        id: m.id,
        text: m.message,
        sender: m.sender?.first_name || "User",
        isOwn: true,

        image: file?.path
          ? `http://localhost:8080/${file.path.replace("public/", "")}`
          : null,

        fileType: file?.mime_type || "",

        time: new Date(m.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

    setMessages(formatted);

  } catch (err) {
    console.log(err);
  }
};

const sendMessage = async () => {

  if ((!inputMsg.trim() && !selectedImage) || !selectedGroup)
    return;

  try {

    const formData = new FormData();

    formData.append("message", inputMsg);

    // IMPORTANT
    if (selectedImage) {
      formData.append("files", selectedImage);
    }

    const token = getToken();

    // USE YOUR REAL API
    const res = await fetch(
      `${API_BASE}/chats/group-message/${selectedGroup.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await res.json();

    console.log("MESSAGE RESPONSE =>", data);

    // GET REAL IMAGE URL FROM BACKEND
    const uploadedFile =
      data?.files?.[0] ||
      data?.data?.files?.[0] ||
      data?.message?.files?.[0];

    const imageUrl =
      uploadedFile?.file_url ||
      uploadedFile?.url ||
      uploadedFile?.path ||
      imagePreview;


await loadMessages(selectedGroup.id);



    setInputMsg("");
    setSelectedImage(null);
    setImagePreview("");

  } catch (err) {
    console.log(err);
  }
};



  // ── Derived ──────────────────────────────────────────────────────────────────
  const filteredGroups = groups.filter(g =>
    (g.group_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // FIX 3: only users already in the group


const membersArray =
  selectedGroup?.members ||
  selectedGroup?.users ||
  [];

const groupMembers = selectedGroup
  ? allUsers.filter((u) =>
      membersArray.some(
        (m) =>
          Number(m.user_id || m.id || m) === Number(u.id)
      )
    )
  : [];




  // FIX 2: users NOT yet in the group, for the dropdown
const nonMembers = selectedGroup
  ? allUsers.filter(
      (u) =>
        !(selectedGroup.members || []).some(
          (m) =>
            Number(m.user_id || m.id) === Number(u.id)
        )
    )
  : [];



  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slide-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .animate-slide-up { animation: slide-up .25s ease-out }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex bg-gray-50 h-[calc(100vh-64px)] overflow-hidden font-sans">

        {/* Sidebar */}
        <aside className={`
          ${showSidebar ? 'w-full sm:w-80' : 'w-0 overflow-hidden'}
          bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0
        `}>
          <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-400 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Chats</h2>
              <button
                onClick={() => setModal('create')}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={14} /> New Group
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredGroups.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                {search ? 'No groups found' : 'No groups yet. Create one!'}
              </div>
            )}
            {filteredGroups.map(g => {
              const name = g.group_name || 'Unnamed Group';
              const isActive = selectedGroup?.id === g.id;
              return (
                <div
                  key={g.id}
            
onClick={async () => {

  await loadGroupDetails(g.id);

  if (window.innerWidth < 640) {
    setShowSidebar(false);
  }
}}


                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${isActive ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                >
                  <Avatar name={name} size={11} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {g.group_type === 'custom' ? 'Custom group' : g.group_type}
                      {' · '}
                      {new Date(g.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Users size={15} className="text-gray-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat Area */}
        <main className={`flex-1 flex flex-col min-w-0 ${showSidebar ? 'hidden sm:flex' : 'flex'}`}>
          {!selectedGroup ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
                <Users size={36} className="text-orange-300" />
              </div>
              <p className="font-medium text-gray-500">Select a group to start chatting</p>
              <button onClick={() => setModal('create')} className="text-sm text-orange-500 hover:underline font-medium">
                + Create a new group
              </button>
            </div>
          ) : (
            <>
              <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowSidebar(true)} className="sm:hidden p-2 rounded-lg hover:bg-gray-100">
                    <ArrowLeft size={18} className="text-gray-600" />
                  </button>
                  <Avatar name={selectedGroup.group_name} size={10} />
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{selectedGroup.group_name}</h3>
                    <p className="text-xs text-gray-400">
                      {selectedGroup.group_type} · {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal('addMember')} title="Add member" className="p-2 hover:bg-orange-50 rounded-lg transition-colors group">
                    <UserPlus size={18} className="text-gray-500 group-hover:text-orange-500" />
                  </button>
                  <button onClick={() => setModal('members')} title="View members" className="p-2 hover:bg-orange-50 rounded-lg transition-colors group">
                    <Users size={18} className="text-gray-500 group-hover:text-orange-500" />
                  </button>
                  <button
                    onClick={() => { setRenameVal(selectedGroup.group_name); setModal('rename'); }}
                    title="Rename group"
                    className="p-2 hover:bg-orange-50 rounded-lg transition-colors group"
                  >
                    <Edit2 size={18} className="text-gray-500 group-hover:text-orange-500" />
                  </button>
                  <button onClick={() => setModal('delete')} title="Delete group" className="p-2 hover:bg-red-50 rounded-lg transition-colors group">
                    <Trash2 size={18} className="text-gray-500 group-hover:text-red-500" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-orange-50/30 to-white">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 text-sm mt-12">No messages yet. Say hello! 👋</div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex gap-2 ${m.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar name={m.sender} size={8} />
                    <div className={`flex flex-col max-w-xs sm:max-w-sm ${m.isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                        ${m.isOwn
                          ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                        }`}>
                   <div className="space-y-2">

{m.image && m.fileType?.startsWith("image") && (
  <img
    src={m.image}
    alt=""
    onClick={() => setFullImage(m.image)}
    className="
      max-w-[260px]
      rounded-xl
      cursor-pointer
      hover:scale-[1.02]
      transition
    "
  />
)}
```jsx
{/* VIDEO */}
{m.image && m.fileType?.startsWith("video") && (
  <video
    controls
    className="max-w-[260px] rounded-xl"
  >
    <source src={m.image} type={m.fileType} />
  </video>
)}

{/* AUDIO */}
{m.image && m.fileType?.startsWith("audio") && (
  <audio controls>
    <source src={m.image} type={m.fileType} />
  </audio>
)}

{/* DOCUMENT */}
{m.image &&
 !m.fileType?.startsWith("image") &&
 !m.fileType?.startsWith("video") &&
 !m.fileType?.startsWith("audio") && (
  <a
    href={m.image}
    target="_blank"
    className="
      underline
      text-white
      flex items-center gap-2
    "
  >
    📄 Open File
  </a>
)}


  {m.text && (
    <p>{m.text}</p>
  )}
</div>
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-1">{m.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={msgEndRef} />
              </div>

              <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
                {imagePreview && (
  <div className="mb-3 relative w-fit">
    <img
      src={imagePreview}
      alt="preview"
      className="w-40 h-40 object-cover rounded-xl border"
    />

    <button
      onClick={() => {
        setSelectedImage(null);
        setImagePreview('');
      }}
      className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 text-xs"
    >
      ✕
    </button>
  </div>
)}
                <div className="flex items-center gap-2">
                
              <>
  <input
    type="file"
    accept="image/*"
    ref={fileInputRef}
    onChange={handleImageSelect}
    className="hidden"
  />

  <button
    onClick={() => fileInputRef.current.click()}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <Paperclip size={18} className="text-gray-500" />
  </button>
</>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Smile size={18} className="text-gray-500" />
                  </button>
                  <input
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={`Message ${selectedGroup.group_name}…`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMsg.trim()}
                    className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Modals ── */}

      {modal === 'create' && (
        <Modal title="Create New Group" onClose={closeModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input
                autoFocus
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createGroup()}
                placeholder="e.g. Sales Team"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <button
              onClick={createGroup}
              disabled={loading || !newGroupName.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Group
            </button>
          </div>
        </Modal>
      )}

      {modal === 'rename' && selectedGroup && (
        <Modal title="Rename Group" onClose={closeModal}>
          <div className="space-y-4">
            <input
              autoFocus
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && renameGroup()}
              placeholder="New group name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={renameGroup}
              disabled={loading || !renameVal.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        </Modal>
      )}

      {modal === 'delete' && selectedGroup && (
        <Modal title="Delete Group" onClose={closeModal}>
          <div className="space-y-5">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{selectedGroup.group_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Cancel
              </button>
              <button
                onClick={() => deleteGroup(selectedGroup.id)}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* FIX 2: Add Member — dropdown instead of search list */}
      {modal === 'addMember' && selectedGroup && (
        <Modal title="Add Member" onClose={closeModal}>
          <div className="space-y-4">
            {nonMembers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">All users are already members.</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-800"
                  >
                    <option value="">— choose a user —</option>
                    {nonMembers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addMember}
                  disabled={loading || !selectedUserId}
                  className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Add Member
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* FIX 3: Members modal — only shows current group members */}
      {modal === 'members' && selectedGroup && (
        <Modal title={`Members · ${selectedGroup.group_name}`} onClose={closeModal}>
          <div className="space-y-1">
            {groupMembers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">No members in this group yet.</p>
            )}
            {groupMembers.map(u => {
              const name = `${u.first_name} ${u.last_name}`;
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 transition-colors">
                  <Avatar name={name} photo={u.profile_photo} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => makeAdmin(u.id)}
                      title="Make admin"
                      className="p-1.5 rounded-lg hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => removeMember(u.id)}
                      title="Remove member"
                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
      {fullImage && (
  <div
    onClick={() => setFullImage(null)}
    className="
      fixed inset-0 z-[999]
      bg-black/90
      flex items-center justify-center
      p-5
    "
  >
    <img
      src={fullImage}
      alt="full"
      className="
        max-w-full
        max-h-full
        rounded-xl
      "
    />
  </div>
)}
    </>
  );
}