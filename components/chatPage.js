"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Smile, Search, ArrowLeft, Plus, Users,
  Edit2, Trash2, UserPlus, MessageSquare, Loader2, RefreshCw,
} from "lucide-react";

import { useSocket }      from "@/src/hooks/useSocket";
import { useGroups }      from "@/src/hooks/useGroups";
import { useGroupChat }   from "@/src/hooks/useGroupChat";
import { useDirectChat }  from "@/src/hooks/useDirectChat";
import { useAttachments } from "@/src/hooks/useAttachments";

import { fetchAllUsers, fetchGroupMembers } from "@/src/lib/api";
import { getCurrentUserId }                 from "@/src/lib/auth";

import { Avatar, Toast, ConnectionBanner, TypingIndicator, MessageBubble } from "@/src/components/chat/ui";
import { CreateGroupModal, RenameGroupModal, DeleteGroupModal, AddMemberModal, MembersModal } from "@/src/components/chat/GroupModals";
import { AttachmentButton, AttachmentPreview } from "@/src/components/chat/AttachmentUI";

const TAB = { GROUPS:"groups", DIRECT:"direct" };

export default function ChatPage() {
  const { socketRef, connected, onlineUsers, connectionError } = useSocket();
  const { groups, groupsLoading, createGroup, updateGroupName, deleteGroup, addMember, removeMember, makeAdmin } = useGroups();
  const { pendingFiles, uploading, uploadError, addFiles, removeFile, clearFiles, sendDirect, sendGroup, hasPending } = useAttachments();

  const [allUsers,     setAllUsers]     = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  useEffect(() => {
    setUsersLoading(true);
    fetchAllUsers().then(l=>setAllUsers(Array.isArray(l)?l:[])).catch(()=>setAllUsers([])).finally(()=>setUsersLoading(false));
  }, []);

  // Members stored in a Map — never lost on group switch
  const [membersMap,     setMembersMap]     = useState(new Map());
  const [membersLoading, setMembersLoading] = useState(false);

  const [activeTab,     setActiveTab]    = useState(TAB.GROUPS);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [showSidebar,   setShowSidebar]   = useState(true);

  const {
    messages: groupMessages, messagesLoading: groupLoading,
    sendMessage: sendGroupMsg, emitTyping: emitGroupTyping,
    typingUsers: groupTypingIds, loadMoreMessages: loadMoreGroup, hasMore: groupHasMore,
    addMessage: addGroupMessage, editMessage: editGroupMessage, deleteMessage: deleteGroupMessage,
  } = useGroupChat(selectedGroup, socketRef);

  const {
    messages: directMessages, messagesLoading: directLoading,
    sendMessage: sendDirectMsg, emitTyping: emitDirectTyping,
    isRemoteTyping: partnerTyping, loadMoreMessages: loadMoreDirect, hasMore: directHasMore,
    addMessage: addDirectMessage, editMessage: editDirectMessage, deleteMessage: deleteDirectMessage,
  } = useDirectChat(selectedUser, socketRef);

  const [inputMsg,      setInputMsg]      = useState("");
  const [search,        setSearch]        = useState("");
  const [toast,         setToast]         = useState(null);
  const [modal,         setModal]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const msgEndRef     = useRef(null);
  const inputRef      = useRef(null);
  const currentUserId = getCurrentUserId();
  const notify        = useCallback((msg,type="success")=>setToast({msg,type}),[]);
  const closeModal    = useCallback(()=>setModal(null),[]);

  // Restore session
  useEffect(() => {
    try {
      const t=localStorage.getItem("chat_active_tab");
      const g=localStorage.getItem("chat_selected_group");
      const u=localStorage.getItem("chat_selected_user");
      if(t) setActiveTab(t);
      if(g) setSelectedGroup(JSON.parse(g));
      if(u) setSelectedUser(JSON.parse(u));
    } catch {}
  }, []);

  // Fetch members into Map — only once per group
  useEffect(() => {
    const id = selectedGroup?.id;
    if (!id || membersMap.has(id)) return;
    setMembersLoading(true);
    fetchGroupMembers(id)
      .then(members => setMembersMap(p=>{ const n=new Map(p); n.set(id,Array.isArray(members)?members:[]); return n; }))
      .catch(()=>setMembersMap(p=>{ const n=new Map(p); n.set(id,[]); return n; }))
      .finally(()=>setMembersLoading(false));
  }, [selectedGroup?.id]);

  useEffect(()=>{ clearFiles(); },[selectedGroup?.id, selectedUser?.id]);
  useEffect(()=>{ msgEndRef.current?.scrollIntoView({behavior:"smooth"}); },[groupMessages,directMessages]);
  useEffect(()=>{ if(selectedGroup||selectedUser) inputRef.current?.focus(); },[selectedGroup?.id,selectedUser?.id]);

  const currentMembers   = membersMap.get(selectedGroup?.id) ?? [];
  const groupMemberUsers = allUsers.filter(u=>currentMembers.some(m=>Number(m.user_id)===Number(u.id)));
  const nonMemberUsers   = allUsers.filter(u=>Number(u.id)!==Number(currentUserId)&&!currentMembers.some(m=>Number(m.user_id)===Number(u.id)));
  const groupTypingNames = groupTypingIds.map(id=>allUsers.find(u=>Number(u.id)===Number(id))?.first_name??"Someone").filter(Boolean);

  const filteredGroups = groups.filter(g=>(g.group_name||"").toLowerCase().includes(search.toLowerCase()));
  const filteredUsers  = allUsers.filter(u=>{ if(Number(u.id)===Number(currentUserId)) return false; return `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()); });

  const isGroupTab   = activeTab === TAB.GROUPS;
  const messages     = isGroupTab ? groupMessages  : directMessages;
  const msgLoading   = isGroupTab ? groupLoading   : directLoading;
  const hasMore      = isGroupTab ? groupHasMore   : directHasMore;
  const loadMore     = isGroupTab ? loadMoreGroup  : loadMoreDirect;
  const chatTitle    = isGroupTab ? (selectedGroup?.group_name??"") : selectedUser?`${selectedUser.first_name} ${selectedUser.last_name}`:"";
  const chatSubtitle = isGroupTab
    ? `${selectedGroup?.group_type??"group"} · ${groupMemberUsers.length} member${groupMemberUsers.length!==1?"s":""}${membersLoading?" (loading…)":""}`
    : selectedUser?(onlineUsers.has(String(selectedUser.id))?"Online":"Offline"):"";

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputMsg.trim() && !hasPending) return;
    try {
      if (isGroupTab && selectedGroup) {
        if (hasPending) { const s=await sendGroup(selectedGroup.id,inputMsg); if(s) addGroupMessage(s); }
        else sendGroupMsg(inputMsg);
      } else if (!isGroupTab && selectedUser) {
        if (hasPending) { const s=await sendDirect(selectedUser.id,inputMsg); if(s) addDirectMessage(s); }
        else sendDirectMsg(inputMsg);
      }
      setInputMsg("");
    } catch(err) { notify(err.message||"Failed to send","error"); }
  };

  const handleInputChange = (e) => {
    setInputMsg(e.target.value);
    if(isGroupTab&&selectedGroup) emitGroupTyping();
    else if(!isGroupTab&&selectedUser) emitDirectTyping();
  };

  // ── Group CRUD ────────────────────────────────────────────────────────────
  const handleCreateGroup = async (name,type) => {
    setActionLoading(true);
    try { const g=await createGroup(name,type); notify("Group created!"); closeModal(); if(g) handleSelectGroup(g); }
    catch(err) { notify(err.message||"Failed","error"); } finally { setActionLoading(false); }
  };
  const handleRenameGroup = async (name) => {
    setActionLoading(true);
    try { await updateGroupName(selectedGroup.id,name); setSelectedGroup(s=>s?{...s,group_name:name}:s); notify("Group renamed!"); closeModal(); }
    catch(err) { notify(err.message,"error"); } finally { setActionLoading(false); }
  };
  const handleDeleteGroup = async () => {
    setActionLoading(true);
    try { await deleteGroup(selectedGroup.id); setSelectedGroup(null); localStorage.removeItem("chat_selected_group"); notify("Group deleted"); closeModal(); }
    catch(err) { notify(err.message,"error"); } finally { setActionLoading(false); }
  };
  const handleAddMember = async (userId) => {
    setActionLoading(true);
    try {
      await addMember(selectedGroup.id,userId);
      setMembersMap(p=>{ const n=new Map(p); n.set(selectedGroup.id,[...(p.get(selectedGroup.id)??[]),{user_id:Number(userId),role:"member"}]); return n; });
      notify("Member added!"); closeModal();
    } catch(err) { notify(err.message,"error"); } finally { setActionLoading(false); }
  };
  const handleRemoveMember = async (userId) => {
    setActionLoading(true);
    try {
      await removeMember(selectedGroup.id,userId);
      setMembersMap(p=>{ const n=new Map(p); n.set(selectedGroup.id,(p.get(selectedGroup.id)??[]).filter(m=>Number(m.user_id)!==Number(userId))); return n; });
      notify("Member removed");
    } catch(err) { notify(err.message,"error"); } finally { setActionLoading(false); }
  };
  const handleMakeAdmin = async (userId) => {
    setActionLoading(true);
    try {
      await makeAdmin(selectedGroup.id,userId);
      setMembersMap(p=>{ const n=new Map(p); n.set(selectedGroup.id,(p.get(selectedGroup.id)??[]).map(m=>Number(m.user_id)===Number(userId)?{...m,role:"admin"}:m)); return n; });
      notify("Promoted to admin!");
    } catch(err) { notify(err.message,"error"); } finally { setActionLoading(false); }
  };

  // ── Message edit/delete wrappers ──────────────────────────────────────────
  const handleEditMsg   = isGroupTab ? editGroupMessage   : editDirectMessage;
  const handleDeleteMsg = isGroupTab ? deleteGroupMessage : deleteDirectMessage;

  // ── Select handlers ───────────────────────────────────────────────────────
  const handleSelectGroup = (g) => {
    setActiveTab(TAB.GROUPS); setSelectedGroup(g); setSelectedUser(null);
    localStorage.setItem("chat_active_tab",TAB.GROUPS); localStorage.setItem("chat_selected_group",JSON.stringify(g)); localStorage.removeItem("chat_selected_user");
    if(window.innerWidth<640) setShowSidebar(false);
  };
  const handleSelectUser = (u) => {
    setActiveTab(TAB.DIRECT); setSelectedUser(u); setSelectedGroup(null);
    localStorage.setItem("chat_active_tab",TAB.DIRECT); localStorage.setItem("chat_selected_user",JSON.stringify(u)); localStorage.removeItem("chat_selected_group");
    if(window.innerWidth<640) setShowSidebar(false);
  };

  return (
    <>
      <style>{`@keyframes slide-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.animate-slide-up{animation:slide-up .25s ease-out}`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}

      <div className="flex bg-gray-50 h-[calc(100vh-64px)] overflow-hidden font-sans">

        {/* SIDEBAR */}
        <aside className={`${showSidebar?"w-full sm:w-80":"w-0 overflow-hidden"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 flex-shrink-0`}>
          <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-400 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Chats</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected?"bg-emerald-300":"bg-red-300 animate-pulse"}`}/>
                {activeTab===TAB.GROUPS&&<button onClick={()=>setModal("create")} className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg"><Plus size={14}/> New Group</button>}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={15}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={activeTab===TAB.GROUPS?"Search groups…":"Search people…"}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40"/>
            </div>
            <div className="flex gap-1 bg-white/20 p-1 rounded-lg">
              <button onClick={()=>setActiveTab(TAB.GROUPS)} className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 ${activeTab===TAB.GROUPS?"bg-white text-orange-600":"text-white/80 hover:text-white"}`}><Users size={12}/> Groups</button>
              <button onClick={()=>setActiveTab(TAB.DIRECT)} className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors flex items-center justify-center gap-1 ${activeTab===TAB.DIRECT?"bg-white text-orange-600":"text-white/80 hover:text-white"}`}><MessageSquare size={12}/> Direct</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {activeTab===TAB.GROUPS&&(
              <>
                {groupsLoading&&<div className="flex items-center justify-center p-8"><Loader2 size={20} className="animate-spin text-orange-400"/></div>}
                {!groupsLoading&&filteredGroups.length===0&&<div className="p-8 text-center text-gray-400 text-sm">{search?"No groups found":"No groups yet. Create one!"}</div>}
                {filteredGroups.map(g=>{
                  const isActive=selectedGroup?.id===g.id;
                  const cnt=membersMap.has(g.id)?(membersMap.get(g.id)??[]).length:(g.members??[]).length;
                  return (
                    <div key={g.id} onClick={()=>handleSelectGroup(g)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive?"bg-orange-50 border-l-4 border-orange-500":"hover:bg-gray-50 border-l-4 border-transparent"}`}>
                      <Avatar name={g.group_name||"Group"} size={11}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{g.group_name||"Unnamed"}</p>
                        <p className="text-xs text-gray-400">{g.group_type} · {cnt} member{cnt!==1?"s":""}</p>
                      </div>
                      <Users size={14} className="text-gray-300 flex-shrink-0"/>
                    </div>
                  );
                })}
              </>
            )}
            {activeTab===TAB.DIRECT&&(
              <>
                {usersLoading&&<div className="flex items-center justify-center p-8"><Loader2 size={20} className="animate-spin text-orange-400"/></div>}
                {!usersLoading&&filteredUsers.length===0&&<div className="p-8 text-center text-gray-400 text-sm">{search?"No users found":"No users available"}</div>}
                {filteredUsers.map(u=>{
                  const isActive=selectedUser?.id===u.id;
                  const isOnline=onlineUsers.has(String(u.id));
                  const name=`${u.first_name} ${u.last_name}`.trim();
                  return (
                    <div key={u.id} onClick={()=>handleSelectUser(u)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive?"bg-orange-50 border-l-4 border-orange-500":"hover:bg-gray-50 border-l-4 border-transparent"}`}>
                      <Avatar name={name} photo={u.profile_photo} size={11} online={isOnline}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                        <p className="text-xs text-gray-400">{isOnline?"🟢 Online":"Offline"}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        {/* CHAT AREA */}
        <main className={`flex-1 flex flex-col min-w-0 ${showSidebar?"hidden sm:flex":"flex"}`}>
          <ConnectionBanner connected={connected} error={connectionError}/>

          {!selectedGroup&&!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center"><MessageSquare size={36} className="text-orange-300"/></div>
              <p className="font-medium text-gray-500">Select a conversation to start chatting</p>
              <button onClick={()=>setModal("create")} className="text-sm text-orange-500 hover:underline font-medium">+ Create a new group</button>
            </div>
          ) : (
            <>
              <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={()=>setShowSidebar(true)} className="sm:hidden p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} className="text-gray-600"/></button>
                  {isGroupTab?<Avatar name={chatTitle} size={10}/>:<Avatar name={chatTitle} photo={selectedUser?.profile_photo} size={10} online={onlineUsers.has(String(selectedUser?.id))}/>}
                  <div><h3 className="font-bold text-gray-900 text-sm leading-tight">{chatTitle}</h3><p className="text-xs text-gray-400">{chatSubtitle}</p></div>
                </div>
                {isGroupTab&&selectedGroup&&(
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setModal("addMember")} className="p-2 hover:bg-orange-50 rounded-lg group" title="Add member"><UserPlus size={18} className="text-gray-500 group-hover:text-orange-500"/></button>
                    <button onClick={()=>setModal("members")}   className="p-2 hover:bg-orange-50 rounded-lg group" title="Members"><Users size={18} className="text-gray-500 group-hover:text-orange-500"/></button>
                    <button onClick={()=>setModal("rename")}    className="p-2 hover:bg-orange-50 rounded-lg group" title="Rename"><Edit2 size={18} className="text-gray-500 group-hover:text-orange-500"/></button>
                    <button onClick={()=>setModal("delete")}    className="p-2 hover:bg-red-50 rounded-lg group"    title="Delete"><Trash2 size={18} className="text-gray-500 group-hover:text-red-500"/></button>
                  </div>
                )}
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-orange-50/30 to-white">
                {hasMore&&!msgLoading&&<div className="flex justify-center"><button onClick={loadMore} className="text-xs text-orange-500 hover:underline flex items-center gap-1"><RefreshCw size={12}/> Load older messages</button></div>}
                {msgLoading&&messages.length===0&&<div className="flex items-center justify-center pt-12"><Loader2 size={24} className="animate-spin text-orange-400"/></div>}
                {!msgLoading&&messages.length===0&&<div className="text-center text-gray-400 text-sm mt-12">No messages yet. Say hello! 👋</div>}
                {messages.map(m=>(
                  <MessageBubble key={m.id} message={m} showSender={isGroupTab}
                    onEdit={handleEditMsg} onDelete={handleDeleteMsg}/>
                ))}
                <div ref={msgEndRef}/>
              </div>

              {isGroupTab&&groupTypingNames.length>0&&<TypingIndicator names={groupTypingNames}/>}
              {!isGroupTab&&partnerTyping&&<TypingIndicator names={[selectedUser?.first_name??""]}/>}

              <AttachmentPreview files={pendingFiles} onRemove={removeFile}/>
              {uploadError&&(
                <div className="bg-red-50 border-t border-red-100 px-4 py-1.5 flex items-center justify-between">
                  <p className="text-xs text-red-500">{uploadError}</p>
                  <button onClick={()=>clearFiles()} className="text-xs text-red-400 hover:text-red-600 font-medium">Clear</button>
                </div>
              )}

              <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <AttachmentButton onFiles={addFiles} disabled={uploading}/>
                  <button className="p-2 hover:bg-gray-100 rounded-lg"><Smile size={18} className="text-gray-500"/></button>
                  <input ref={inputRef} value={inputMsg} onChange={handleInputChange}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
                    placeholder={hasPending?"Add a caption… (optional)":`Message ${chatTitle}…`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"/>
                  <button onClick={handleSend} disabled={(!inputMsg.trim()&&!hasPending)||uploading}
                    className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {uploading?<Loader2 size={18} className="animate-spin"/>:<Send size={18}/>}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {modal==="create"&&<CreateGroupModal onClose={closeModal} onCreate={handleCreateGroup} loading={actionLoading}/>}
      {modal==="rename"&&selectedGroup&&<RenameGroupModal group={selectedGroup} onClose={closeModal} onRename={handleRenameGroup} loading={actionLoading}/>}
      {modal==="delete"&&selectedGroup&&<DeleteGroupModal group={selectedGroup} onClose={closeModal} onDelete={handleDeleteGroup} loading={actionLoading}/>}
      {modal==="addMember"&&selectedGroup&&<AddMemberModal group={selectedGroup} nonMembers={nonMemberUsers} onClose={closeModal} onAdd={handleAddMember} loading={actionLoading||membersLoading}/>}
      {modal==="members"&&selectedGroup&&(
        <MembersModal group={{...selectedGroup,members:currentMembers}} members={groupMemberUsers}
          onClose={closeModal} onRemove={handleRemoveMember} onMakeAdmin={handleMakeAdmin} loading={actionLoading||membersLoading}/>
      )}
    </>
  );
}