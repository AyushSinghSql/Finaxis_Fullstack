import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { backendUrl } from "./config";
import { toast } from "react-toastify";
import { AiOutlineFundProjectionScreen } from "react-icons/ai";


const UserOrgProjectMapping = ({canEdit}) => {
  // Global lists
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);

  // Select options
  const [projectOptions, setProjectOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);

  // Selections per mode
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedUsersForProject, setSelectedUsersForProject] = useState([]);

  const [selectedUserIdForGroups, setSelectedUserIdForGroups] = useState("");
  const [selectedGroupsForUser, setSelectedGroupsForUser] = useState([]);

  const [selectedGroupIdForOrgs, setSelectedGroupIdForOrgs] = useState("");
  const [selectedOrgsForGroup, setSelectedOrgsForGroup] = useState([]);

  const [selectedUserIdForOrgs, setSelectedUserIdForOrgs] = useState("");
  const [selectedOrgsForUser, setSelectedOrgsForUser] = useState([]);

  // UI state
 const [activeMainTab, setActiveMainTab] = useState("projectUsers");
// "projectUsers" | "userGroups" | "groupOrgs" | "userOrgs" | "manageGroups" | "manageUsers"


  const [searchTermUsers, setSearchTermUsers] = useState("");
  const [searchTermGroups, setSearchTermGroups] = useState("");
  const [searchTermOrgs, setSearchTermOrgs] = useState("");
  const [searchTermUserOrgs, setSearchTermUserOrgs] = useState("");

  // Manage Groups form state
const [editingGroupId, setEditingGroupId] = useState(null);
const [groupCodeInput, setGroupCodeInput] = useState("");
const [groupNameInput, setGroupNameInput] = useState("");
const [groupDescription,setGroupDescription] = useState("")
const [groupFormLoading, setGroupFormLoading] = useState(false);

// Manage Users form state
const [editingUserId, setEditingUserId] = useState(null);
const [userNameInput, setUserNameInput] = useState("");
const [userFullNameInput, setUserFullNameInput] = useState("");
const [userEmailInput, setUserEmailInput] = useState("");
const [userFormLoading, setUserFormLoading] = useState(false);
const [searchTermManageUsers, setSearchTermManageUsers] = useState("");
const [selectedUserIdsForDelete, setSelectedUserIdsForDelete] = useState([]);
const [userPasswordInput, setUserPasswordInput] = useState("");
const [userRoleInput, setUserRoleInput] = useState("");


  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState(null);


  // ------------Manage Users------------
  const applyUserSorting = (userData) => {
  // newest (highest userId) first; adjust if you have createdAt
  return [...(userData || [])].sort(
    (a, b) => (b.userId ?? 0) - (a.userId ?? 0)
  );
};

const resetUserForm = () => {
  setEditingUserId(null);
  setUserNameInput("");
  setUserFullNameInput("");
  setUserEmailInput("");
  setUserPasswordInput("");
  setUserRoleInput("");
};


const startEditUser = (u) => {
  setEditingUserId(u.userId);
  setUserNameInput(u.username || "");
  setUserFullNameInput(u.fullName || "");
  setUserEmailInput(u.email || "");
  setUserPasswordInput("");          // typically not loaded back
  setUserRoleInput(u.role || "");
};


const toggleSelectedUserForDelete = (id) => {
  setSelectedUserIdsForDelete((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const areAllUsersSelected = (list) =>
  list.length > 0 &&
  list.every((u) => selectedUserIdsForDelete.includes(u.userId));

const toggleSelectAllUsers = (list) => {
  if (areAllUsersSelected(list)) {
    setSelectedUserIdsForDelete([]);
  } else {
    setSelectedUserIdsForDelete(list.map((u) => u.userId));
  }
};

const handleCreateOrUpdateUser = async () => {
  if (!userNameInput.trim() || !userFullNameInput.trim()) {
    toast.warn("Username and full name are required.");
    return;
  }

  try {
    setUserFormLoading(true);

    if (editingUserId == null) {
      // CREATE
      await axios.post(`${backendUrl}/api/User`, {
        username: userNameInput.trim(),
        fullName: userFullNameInput.trim(),
        email: userEmailInput.trim(),
        password: userPasswordInput.trim(),
        role: userRoleInput.trim(),
      });
      toast.success("User created.");
    } else {
      // UPDATE
      await axios.put(`${backendUrl}/api/User/${editingUserId}`, {
        userId: editingUserId,
        username: userNameInput.trim(),
        fullName: userFullNameInput.trim(),
        email: userEmailInput.trim(),
        // optional: only send password if user entered something
        password: userPasswordInput.trim() || undefined,
        role: userRoleInput.trim(),
      });
      toast.success("User updated.");
    }

    const userRes = await axios.get(`${backendUrl}/api/User`);
    const userData = applyUserSorting(userRes.data);
    setUsers(userData);
    setUserOptions(
      userData.map((u) => ({
        value: u.userId,
        // ${u.userId} - 
        label: `${u.username || u.fullName || ""}`,
      }))
    );

    resetUserForm();
  } catch (e) {
    console.error("Save user failed", e);
    const apiMessage =
      e?.response?.data?.message ||
      e?.response?.data?.title ||
      (typeof e?.response?.data === "string" ? e.response.data : null);
    toast.error(apiMessage || "Failed to save user.");
  } finally {
    setUserFormLoading(false);
  }
};


const handleBulkDeleteUsers = async () => {
  if (selectedUserIdsForDelete.length === 0) {
    toast.warn("Select at least one user to delete.");
    return;
  }
  if (!window.confirm(`Delete ${selectedUserIdsForDelete.length} users?`)) {
    return;
  }

  try {
    setUserFormLoading(true);

    // bulk delete: body [1,2,...]
    await axios.post(
      `${backendUrl}/api/User/BulkDelete`,
      selectedUserIdsForDelete
    );
    toast.success("Selected users deleted.");

    const userRes = await axios.get(`${backendUrl}/api/User`);
    const userData = applyUserSorting(userRes.data);
    setUsers(userData);
    setUserOptions(
      userData.map((u) => ({
        value: u.userId,
        // ${u.userId} - 
        label: `${u.username || u.fullName || ""}`,
      }))
    );
    setSelectedUserIdsForDelete([]);

    if (
      editingUserId &&
      !userData.some((u) => u.userId === editingUserId)
    ) {
      resetUserForm();
    }
  } catch (e) {
    console.error("Bulk delete users failed", e);
    const apiMessage =
      e?.response?.data?.message ||
      e?.response?.data?.title ||
      (typeof e?.response?.data === "string" ? e.response.data : null);
    if (apiMessage) {
      toast.error(apiMessage);
    } else {
      toast.error("Failed to delete selected users.");
    }
  } finally {
    setUserFormLoading(false);
  }
};


  // -----------------Manage Groups-----------

  const [selectedGroupIdsForDelete, setSelectedGroupIdsForDelete] = useState([]);

const toggleSelectedGroupForDelete = (id) => {
  setSelectedGroupIdsForDelete((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

const areAllGroupsSelected = (list) =>
  list.length > 0 &&
  list.every((g) => selectedGroupIdsForDelete.includes(g.orgGroupId));

const toggleSelectAllGroups = (list) => {
  if (areAllGroupsSelected(list)) {
    setSelectedGroupIdsForDelete([]);
  } else {
    setSelectedGroupIdsForDelete(list.map((g) => g.orgGroupId));
  }
};


  const resetGroupForm = () => {
  setEditingGroupId(null);
  setGroupCodeInput("");
  setGroupNameInput("");
  setGroupDescription("");
};

const startEditGroup = (g) => {
  setEditingGroupId(g.orgGroupId);
  setGroupCodeInput(g.orgGroupCode || "");
  setGroupNameInput(g.orgGroupName || "");
  setGroupDescription(g.description || "");
};

const handleCreateOrUpdateGroup = async () => {
  if (!groupCodeInput.trim() || !groupNameInput.trim()) {
    toast.warn("Group code and name are required.");
    return;
  }

  try {
    setGroupFormLoading(true);

    if (editingGroupId == null) {
      // CREATE
      await axios.post(`${backendUrl}/api/user-projects/OrgGroups`, {
        orgGroupCode: groupCodeInput.trim(),
        orgGroupName: groupNameInput.trim(),
        description: groupDescription.trim(),
        isActive: true,
      });
      toast.success("Group created.");
    } else {
      // UPDATE
      await axios.put(
        `${backendUrl}/api/user-projects/OrgGroups/${editingGroupId}`,
        {
          orgGroupId: editingGroupId,
          orgGroupCode: groupCodeInput.trim(),
          orgGroupName: groupNameInput.trim(),
          description: groupDescription.trim(),
          isActive: true,
        }
      );
      toast.success("Group updated.");
    }

    // Refresh list
    const groupsRes = await axios.get(
  `${backendUrl}/api/user-projects/GetGroups`
);
const groupData = applyGroupSorting(groupsRes.data);
setGroups(groupData);
setGroupOptions(
  groupData.map((g) => ({
    value: g.orgGroupId,
    // ${g.orgGroupId} - 
    label: `${g.orgGroupName || ""}`,
  }))
);


    resetGroupForm();
  } catch (e) {
    console.error("Save group failed", e);
    // toast.error("Failed to save group.");
     const apiMessage =
    e?.response?.data?.message ||
    e?.response?.data?.title ||          // common for ASP.NET
    (typeof e?.response?.data === "string"
      ? e.response.data
      : null);

  if (apiMessage) {
    toast.error(apiMessage);            // e.g. "OrgGroupCode already exists."
  } else {
    toast.error("Failed to save group.");
  }
  } finally {
    setGroupFormLoading(false);
  }
};
 

const handleBulkDeleteGroups = async () => {
  if (selectedGroupIdsForDelete.length === 0) {
    toast.warn("Select at least one group to delete.");
    return;
  }
  if (!window.confirm(`Delete ${selectedGroupIdsForDelete.length} groups?`)) {
    return;
  }

  try {
    setGroupFormLoading(true);

    // ✅ single bulk call with array [1,2,...]
    await axios.post(
      `${backendUrl}/api/user-projects/OrgGroups/BulkDelete`,
      selectedGroupIdsForDelete
    );
    // if your API expects { ids: [...] } then:
    // await axios.post(`${backendUrl}/api/user-projects/OrgGroups/BulkDelete`, {
    //   ids: selectedGroupIdsForDelete,
    // });

    toast.success("Selected groups deleted.");

    const groupsRes = await axios.get(
      `${backendUrl}/api/user-projects/GetGroups`
    );
    const groupData = applyGroupSorting(groupsRes.data);
setGroups(groupData);
setGroupOptions(
  groupData.map((x) => ({
    value: x.orgGroupId,
    // ${x.orgGroupId} -
    label: ` ${x.orgGroupName || ""}`,
  }))
);
    setSelectedGroupIdsForDelete([]);

    if (
      editingGroupId &&
      !groupData.some((g) => g.orgGroupId === editingGroupId)
    ) {
      resetGroupForm();
    }
  } catch (e) {
    console.error("Bulk delete groups failed", e);
    toast.error("Failed to delete selected groups.");
  } finally {
    setGroupFormLoading(false);
  }
};

//Sort new created at the top
const applyGroupSorting = (groupData) => {
  // assuming orgGroupId is incremental; use createdAt if you prefer
  return [...(groupData || [])].sort(
    (a, b) => (b.orgGroupId ?? 0) - (a.orgGroupId ?? 0)
    // or: (new Date(b.createdAt)) - (new Date(a.createdAt))
  );
};



  // ---------- Fetch base lists on mount ----------
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setProjectLoading(true);
        setUserLoading(true);
        setGroupLoading(true);
        setOrgLoading(true);

        // Projects
        const projRes = await fetch(`${backendUrl}/Project/GetAllProjects`);
        if (!projRes.ok) throw new Error("Project fetch failed");
        const projData = await projRes.json();
        setProjects(projData);
        setProjectOptions(
          (projData || []).map((p) => ({
            value: p.projectId || p.id || "",
            label: `${p.name || p.projectName || "Unnamed"} - ${
              p.projectId || p.id || ""
            }`,
          }))
        );

        // Users
        const userRes = await axios.get(`${backendUrl}/api/User`);
        const userData = userRes.data || [];
        setUsers(userData);
        setUserOptions(
          userData.map((u) => ({
            value: u.userId,
            // ${u.userId} -
            label: ` ${u.username || u.fullName || ""}`,
          }))
        );

        // Groups
        const groupsRes = await axios.get(
          `${backendUrl}/api/user-projects/GetGroups`
        );
        const groupData = groupsRes.data || [];
        setGroups(groupData);
        setGroupOptions(
          groupData.map((g) => ({
            value: g.orgGroupId,
            // ${g.orgGroupId} -
            label: ` ${g.orgGroupName || ""}`,
          }))
        );

        // Orgs
        const orgRes = await axios.get(
          `${backendUrl}/Orgnization/GetAllOrgs`
        );
        const orgData = orgRes.data || [];
        setOrgs(orgData);
      } catch (e) {
        console.error("Base data fetch failed", e);
        setError("Failed to load initial data.");
      } finally {
        setProjectLoading(false);
        setUserLoading(false);
        setGroupLoading(false);
        setOrgLoading(false);
      }
    };

    fetchBaseData();
  }, []);

  // ---------- Mode 1: Project ↔ Users ----------
  useEffect(() => {
    if (!selectedProjectId) {
      setSelectedUsersForProject([]);
      return;
    }

    const fetchUsersForProject = async () => {
      setUserLoading(true);
      try {
        const mappedRes = await axios.get(
          `${backendUrl}/api/user-projects/users/${selectedProjectId}`
        );
        const mappedUsers = mappedRes.data || [];
        const mappedIds = Array.isArray(mappedUsers)
          ? mappedUsers.map((u) => (typeof u === "object" ? u.userId : u))
          : [];
        setSelectedUsersForProject(mappedIds);
      } catch (e) {
        console.error("Fetch mapped users for project failed", e);
        setSelectedUsersForProject([]);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUsersForProject();
  }, [selectedProjectId]);

  const filteredUsersForProject = users.filter((u) =>
    `${u.userId} ${u.username || ""} ${u.fullName || ""}`
      .toLowerCase()
      .includes(searchTermUsers.toLowerCase())
  );
  const sortedUsersForProject = [...filteredUsersForProject].sort((a, b) => {
    const aSel = selectedUsersForProject.includes(a.userId);
    const bSel = selectedUsersForProject.includes(b.userId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleUserForProject = (userId) => {
    setSelectedUsersForProject((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const saveProjectUsers = async () => {
    if (!selectedProjectId) {
      toast.warn("Select a project first.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${backendUrl}/api/user-projects/bulk-sync`, {
        projId: selectedProjectId,
        userIds: selectedUsersForProject,
      });
      toast.success("Project ↔ Users mapping updated.");

      const mappedRes = await axios.get(
        `${backendUrl}/api/user-projects/users/${selectedProjectId}`
      );
      const mappedUsers = mappedRes.data || [];
      const mappedIds = Array.isArray(mappedUsers)
        ? mappedUsers.map((u) => (typeof u === "object" ? u.userId : u))
        : [];
      setSelectedUsersForProject(mappedIds);
    } catch (e) {
      console.error("Save project-users failed", e);
      toast.error("Failed to update project-users mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 2: User ↔ Groups ----------
  useEffect(() => {
    if (!selectedUserIdForGroups) {
      setSelectedGroupsForUser([]);
      return;
    }

    const fetchGroupsForUser = async () => {
      setGroupLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/user-projects/Groups/${selectedUserIdForGroups}`
        );
        const mappedGroups = res.data || [];
        const mappedIds = Array.isArray(mappedGroups)
          ? mappedGroups.map((g) =>
              typeof g === "object" ? g.orgGroupId : g
            )
          : [];
        setSelectedGroupsForUser(mappedIds);
      } catch (e) {
        console.error("Fetch groups for user failed", e);
        setSelectedGroupsForUser([]);
      } finally {
        setGroupLoading(false);
      }
    };

    fetchGroupsForUser();
  }, [selectedUserIdForGroups]);

  const filteredGroupsForUser = groups.filter((g) =>
    `${g.orgGroupId} ${g.orgGroupName || ""}`
      .toLowerCase()
      .includes(searchTermGroups.toLowerCase())
  );
  const sortedGroupsForUser = [...filteredGroupsForUser].sort((a, b) => {
    const aSel = selectedGroupsForUser.includes(a.orgGroupId);
    const bSel = selectedGroupsForUser.includes(b.orgGroupId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleGroupForUser = (orgGroupId) => {
    setSelectedGroupsForUser((prev) =>
      prev.includes(orgGroupId)
        ? prev.filter((id) => id !== orgGroupId)
        : [...prev, orgGroupId]
    );
  };

  const saveUserGroups = async () => {
    if (!selectedUserIdForGroups) {
      toast.warn("Select a user first.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/BulkSyncUsersGroups`,
        {
          userId: selectedUserIdForGroups,
          groupIds: selectedGroupsForUser,
        }
      );
      toast.success("User ↔ Groups mapping updated.");

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Groups/${selectedUserIdForGroups}`
      );
      const mappedGroups = res.data || [];
      const mappedIds = Array.isArray(mappedGroups)
        ? mappedGroups.map((g) =>
            typeof g === "object" ? g.orgGroupId : g
          )
        : [];
      setSelectedGroupsForUser(mappedIds);
    } catch (e) {
      console.error("Save user-groups failed", e);
      toast.error("Failed to update user-groups mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 3: Group ↔ Orgs ----------
  useEffect(() => {
    if (!selectedGroupIdForOrgs) {
      setSelectedOrgsForGroup([]);
      return;
    }

    const fetchOrgsForGroup = async () => {
      setOrgLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/user-projects/Orgs/${selectedGroupIdForOrgs}`
        );
        const mappedOrgs = res.data || [];
        const mappedIds = Array.isArray(mappedOrgs)
          ? mappedOrgs.map((o) =>
              typeof o === "object" ? o.orgId : o
            )
          : [];
        setSelectedOrgsForGroup(mappedIds);
      } catch (e) {
        console.error("Fetch orgs for group failed", e);
        setSelectedOrgsForGroup([]);
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrgsForGroup();
  }, [selectedGroupIdForOrgs]);

  const filteredOrgsForGroup = orgs.filter((o) =>
    `${o.orgId} ${o.orgName || ""}`
      .toLowerCase()
      .includes(searchTermOrgs.toLowerCase())
  );
  const sortedOrgsForGroup = [...filteredOrgsForGroup].sort((a, b) => {
    const aSel = selectedOrgsForGroup.includes(a.orgId);
    const bSel = selectedOrgsForGroup.includes(b.orgId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleOrgForGroup = (orgId) => {
    setSelectedOrgsForGroup((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const saveGroupOrgs = async () => {
    if (!selectedGroupIdForOrgs) {
      toast.warn("Select a group first.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/BulkSyncGroupOrgs`,
        {
          groupId: selectedGroupIdForOrgs,
          orgIds: selectedOrgsForGroup,
        }
      );
      toast.success("Group ↔ Orgs mapping updated.");

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Orgs/${selectedGroupIdForOrgs}`
      );
      const mappedOrgs = res.data || [];
      const mappedIds = Array.isArray(mappedOrgs)
        ? mappedOrgs.map((o) =>
            typeof o === "object" ? o.orgId : o
          )
        : [];
      setSelectedOrgsForGroup(mappedIds);
    } catch (e) {
      console.error("Save group-orgs failed", e);
      toast.error("Failed to update group-orgs mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mode 4: User ↔ Orgs ----------
  useEffect(() => {
    if (!selectedUserIdForOrgs) {
      setSelectedOrgsForUser([]);
      return;
    }

    const fetchOrgsForUser = async () => {
      setOrgLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/api/user-projects/Orgs/${selectedUserIdForOrgs}`
        );
        const mappedOrgs = res.data || [];
        const mappedIds = Array.isArray(mappedOrgs)
          ? mappedOrgs.map((o) =>
              typeof o === "object" ? o.orgId : o
            )
          : [];
        setSelectedOrgsForUser(mappedIds);
      } catch (e) {
        console.error("Fetch orgs for user failed", e);
        setSelectedOrgsForUser([]);
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrgsForUser();
  }, [selectedUserIdForOrgs]);

  const filteredOrgsForUser = orgs.filter((o) =>
    `${o.orgId} ${o.orgName || ""}`
      .toLowerCase()
      .includes(searchTermUserOrgs.toLowerCase())
  );
  const sortedOrgsForUser = [...filteredOrgsForUser].sort((a, b) => {
    const aSel = selectedOrgsForUser.includes(a.orgId);
    const bSel = selectedOrgsForUser.includes(b.orgId);
    if (aSel === bSel) return 0;
    return aSel ? -1 : 1;
  });

  const toggleOrgForUser = (orgId) => {
    setSelectedOrgsForUser((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const saveUserOrgs = async () => {
    if (!selectedUserIdForOrgs) {
      toast.warn("Select a user first.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${backendUrl}/api/user-projects/BulkSyncUsersOrgs`,
        {
          userId: selectedUserIdForOrgs,
          orgIds: selectedOrgsForUser,
        }
      );
      toast.success("User ↔ Orgs mapping updated.");

      const res = await axios.get(
        `${backendUrl}/api/user-projects/Orgs/${selectedUserIdForOrgs}`
      );
      const mappedOrgs = res.data || [];
      const mappedIds = Array.isArray(mappedOrgs)
        ? mappedOrgs.map((o) =>
            typeof o === "object" ? o.orgId : o
          )
        : [];
      setSelectedOrgsForUser(mappedIds);
    } catch (e) {
      console.error("Save user-orgs failed", e);
      toast.error("Failed to update user-orgs mapping.");
    } finally {
      setLoading(false);
    }
  };

  // ---------Manage Groups------------
const renderManageGroupsTab = () => {
  const filteredGroups = groups.filter((g) =>
    `${g.orgGroupId} ${g.orgGroupCode || ""} ${g.orgGroupName || ""}`
      .toLowerCase()
      .includes(searchTermGroups.toLowerCase())
  );

  const allSelected = areAllGroupsSelected(filteredGroups);

  return (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {editingGroupId ? "Edit Group" : "Create Group"}
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Group Code
            </label>
            <input
              type="text"
              value={groupCodeInput}
              onChange={(e) => setGroupCodeInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Group code"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Group name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              type="text"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Description"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-4">
          {editingGroupId && (
            <button
              type="button"
              onClick={resetGroupForm}
              className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
              disabled={groupFormLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateOrUpdateGroup}
            className="px-5 py-2 text-sm rounded bg-[#17414d] text-white group-hover:text-gray font-semibold disabled:opacity-60"
            disabled={groupFormLoading}
          >
            {groupFormLoading
              ? "Saving..."
              : editingGroupId
              ? "Update Group"
              : "Create Group"}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Existing Groups
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by id, code, name..."
              value={searchTermGroups}
              onChange={(e) => setSearchTermGroups(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
            />
            <button
              type="button"
              onClick={handleBulkDeleteGroups}
              className="px-4 py-2 text-xs rounded  disabled:opacity-50 bg-red-600 text-white"
              disabled={groupFormLoading || selectedGroupIdsForDelete.length === 0}
            >
              Delete({selectedGroupIdsForDelete.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="thead">
              <tr className="bg-white border-b">
                <th className="px-3 py-2 text-left text-gray-500 text-xs w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={allSelected}
                    onChange={() => toggleSelectAllGroups(filteredGroups)}
                  />
                </th>
                {/* <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  ID
                </th> */}
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Code
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Description
                </th>
                <th className="px-3 py-2 text-right text-gray-500 text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No groups found.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => {
                  const selected = selectedGroupIdsForDelete.includes(
                    g.orgGroupId
                  );
                  return (
                    <tr key={g.orgGroupId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() =>
                            toggleSelectedGroupForDelete(g.orgGroupId)
                          }
                        />
                      </td>
                      {/* <td className="px-3 py-2">{g.orgGroupId}</td> */}
                      <td className="px-3 py-2">{g.orgGroupCode}</td>
                      <td className="px-3 py-2">{g.orgGroupName}</td>
                      <td className="px-3 py-2">{g.description}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditGroup(g)}
                          className="text-xs px-3 py-1 rounded border border-blue-500 text-blue-600"
                        >
                          Edit
                        </button>
                        {/* <button
                          type="button"
                          onClick={() => handleDeleteGroup(g)}
                          className="text-xs px-3 py-1 rounded border border-red-500 text-red-600"
                        >
                          Delete
                        </button> */}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ----- user tabs--------
const renderManageUsersTab = () => {
  const filteredUsers = users.filter((u) =>
    `${u.userId} ${u.username || ""} ${u.fullName || ""} ${u.email || ""}`
      .toLowerCase()
      .includes(searchTermManageUsers.toLowerCase())
  );

  const allSelected = areAllUsersSelected(filteredUsers);

  return (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 ">
          {editingUserId ? "Edit User" : "Create User"}
        </h3> 

        <div className="grid md:grid-cols-3 gap-4">
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      Username
    </label>
    <input
      type="text"
      value={userNameInput}
      onChange={(e) => setUserNameInput(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      placeholder="Username"
    />
  </div>
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      Full Name
    </label>
    <input
      type="text"
      value={userFullNameInput}
      onChange={(e) => setUserFullNameInput(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      placeholder="Full name"
    />
  </div>
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      Email
    </label>
    <input
      type="email"
      value={userEmailInput}
      onChange={(e) => setUserEmailInput(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      placeholder="Email"
    />
  </div>
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">
      Password
    </label>
    <input
      type="password"
      value={userPasswordInput}
      onChange={(e) => setUserPasswordInput(e.target.value)}
      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      placeholder="Password"
    />
  </div>
  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">
    Role
  </label>
  <select
    value={userRoleInput}
    onChange={(e) => setUserRoleInput(e.target.value)}
    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
  >
    <option value="">Select role</option>
    <option value="admin">Admin</option>
    {/* <option value="manager">Manager</option> */}
    <option value="user">User</option>
  </select>
</div>

</div>


        <div className="flex gap-3 justify-end mt-4">
          {editingUserId && (
            <button
              type="button"
              onClick={resetUserForm}
              className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white"
              disabled={userFormLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateOrUpdateUser}
            className="px-5 py-2 text-sm rounded bg-[#17414d] text-white group-hover:text-gray  font-semibold disabled:opacity-60"
            disabled={userFormLoading}
          >
            {userFormLoading
              ? "Saving..."
              : editingUserId
              ? "Update User"
              : "Create User"}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Existing Users
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by id, username, name, email..."
              value={searchTermManageUsers}
              onChange={(e) => setSearchTermManageUsers(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
            />
            <button
              type="button"
              onClick={handleBulkDeleteUsers}
              className="px-4 py-2 text-xs rounded border border-red-500 text-red-600 disabled:opacity-50"
              disabled={
                userFormLoading || selectedUserIdsForDelete.length === 0
              }
            >
              Delete Selected ({selectedUserIdsForDelete.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="thead">
              <tr className="bg-white border-b">
                <th className="px-3 py-2 text-left text-gray-500 text-xs w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={allSelected}
                    onChange={() => toggleSelectAllUsers(filteredUsers)}
                  />
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  ID
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Username
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Full Name
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Email
                </th>
                <th className="px-3 py-2 text-right text-gray-500 text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const selected = selectedUserIdsForDelete.includes(u.userId);
                  return (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() =>
                            toggleSelectedUserForDelete(u.userId)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">{u.userId}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{u.fullName}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditUser(u)}
                          className="text-xs px-3 py-1 rounded border border-blue-500 text-blue-600"
                        >
                          Edit
                        </button>
                        {/* <button
                          type="button"
                          onClick={() => handleBulkDeleteUsers([u.userId])}
                          className="text-xs px-3 py-1 rounded border border-red-500 text-red-600"
                        >
                          Delete
                        </button> */}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};


  // ---------- Render helpers ----------
  const renderProjectUsersTab = () => (
    <>
      <div className="mb-2 rounded flex items-center gap-x-4 w-full">
        <label className="input-label">
          Project <span className="text-red-500">*</span>
        </label>
        <Select
          options={projectOptions}
          isLoading={projectLoading}
          className="outline-none w-[40%]"
          value={
            selectedProjectId
              ? projectOptions.find((o) => o.value === selectedProjectId)
              : null
          }
          onChange={(opt) => setSelectedProjectId(opt ? opt.value : "")}
          isSearchable
          placeholder="Search & select a project"
        />
        {/* {selectedProjectId && (
          <p className="mt-2 text-xs text-green-600">
            Selected project: <strong>{selectedProjectId}</strong>
          </p>
        )} */}
      </div>

      <div className="rounded mb-4 ">
        <div className="flex items-center gap-x-4  mb-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Users for project
            </h3>
            <span className="text-sm text-blue-600">
              {/* {selectedUsersForProject.length} selected */}
            </span>
          </div>

          {selectedProjectId && (
            <>
            {/* <div className=" "> */}
              <div className="flex items-center">
              <input
                type="text"
                placeholder="Search users by ID, name..."
                value={searchTermUsers}
                onChange={(e) => setSearchTermUsers(e.target.value)}
                className="border outline-none border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm bg-white shadow-inner  "
              />
              {/* <button
              onClick={() => fetchEmployees()} // Calls the API with current searchTerm
              className="px-2 py-1.5 bg-[#17414D] text-white rounded-r hover:bg-[#17414D] transition-colors border border-[#17414D] flex items-center justify-center"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button> */}
            </div>
            <div className="flex flex-1 justify-end">
        <button
          onClick={saveProjectUsers}
          disabled={!selectedProjectId || loading || !canEdit("projectOrgSecurity")}
          className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update Project ↔ Users"}
        </button>
      </div>
      </>
          )}
        </div>
        

        <div className="overflow-x-auto max-h-80 border border-gray-300 rounded">
          <table className="w-full text-sm">
            <thead className="thead">
              <tr className="bg-white border-b border-gray-300">
                <th className="th-thead w-10 text-left text-black text-xs">
                  Select
                </th>
                {/* <th className="th-thead text-left text-black text-xs">
                  User ID
                </th> */}
                <th className="th-thead text-left text-black text-xs">Name</th>
                <th className="th-thead text-left text-black text-xs">Role</th>
              </tr>
            </thead>
            <tbody>
              {!selectedProjectId ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a project to view users.
                  </td>
                </tr>
              ) : userLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : sortedUsersForProject.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                sortedUsersForProject.map((u) => {
                  const selected = selectedUsersForProject.includes(u.userId);
                  return (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="tbody-td">
                        <input
                          type="checkbox"
                          className="w-3 h-3"
                          checked={selected}
                          disabled={!canEdit("projectOrgSecurity")}
                          onChange={() => toggleUserForProject(u.userId)}
                        />
                      </td>
                      {/* <td className="tbody-td">{u.userId}</td> */}
                      <td className="tbody-td">
                        {u.username || u.fullName || "-"}
                      </td>
                      <td className="tbody-td capitalize">{(u.role) || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* <div className="flex justify-end">
        <button
          onClick={saveProjectUsers}
          disabled={!selectedProjectId || loading}
          className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update Project ↔ Users"}
        </button>
      </div> */}
    </>
  );

  const renderUserGroupsTab = () => (
    <>
      {/* User select row (match Project design) */}
      <div className="mb-2 rounded flex items-center gap-x-4 w-full">
        <label className="input-label">
          User <span className="text-red-500">*</span>
        </label>
        <Select
          options={userOptions}
          isLoading={userLoading}
          className="outline-none w-[40%]"
          value={
            selectedUserIdForGroups
              ? userOptions.find((o) => o.value === selectedUserIdForGroups)
              : null
          }
          onChange={(opt) => setSelectedUserIdForGroups(opt ? opt.value : "")}
          isSearchable
          placeholder="Search & select a user"
        />
      </div>

      {/* Groups section */}
      <div className="rounded mb-4">
        <div className="flex items-center gap-x-4 mb-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Groups for user
            </h3>
            {/* <span className="text-sm text-blue-600">
              {selectedGroupsForUser.length} selected
            </span> */}
          </div>

          {selectedUserIdForGroups && (
            <>
            {/* <div> */}
              <div className="flex items-center">
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTermGroups}
                onChange={(e) => setSearchTermGroups(e.target.value)}
                className="border outline-none border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm bg-white shadow-inner"
              />
            </div>
            <div className="flex flex-1 justify-end">
        <button
          onClick={saveUserGroups}
          disabled={!selectedUserIdForGroups || loading || !canEdit("projectOrgSecurity")}
          className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update User ↔ Groups"}
        </button>
      </div>
      </>
          )}
        </div>

        <div className="overflow-x-auto max-h-80 border border-gray-300 rounded">
          <table className="w-full text-sm">
            <thead className="thead">
              <tr className="bg-white border-b border-gray-300">
                <th className="th-thead w-10 text-left text-black text-xs">
                  Select
                </th>
                {/* <th className="th-thead text-left text-black text-xs">
                  Group ID
                </th> */}
                <th className="th-thead text-left text-black text-xs">
                  Group Name
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedUserIdForGroups ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a user to view groups.
                  </td>
                </tr>
              ) : groupLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Loading groups...
                  </td>
                </tr>
              ) : sortedGroupsForUser.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No groups found.
                  </td>
                </tr>
              ) : (
                sortedGroupsForUser.map((g) => {
                  const selected = selectedGroupsForUser.includes(g.orgGroupId);
                  return (
                    <tr key={g.orgGroupId} className="hover:bg-gray-50">
                      <td className="tbody-td">
                        <input
                          type="checkbox"
                          className="w-3 h-3"
                          checked={selected}
                          disabled={!canEdit("projectOrgSecurity")}
                          onChange={() => toggleGroupForUser(g.orgGroupId)}
                        />
                      </td>
                      {/* <td className="tbody-td">{g.orgGroupId}</td> */}
                      <td className="tbody-td">{g.orgGroupName || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* <div className="flex justify-end">
        <button
          onClick={saveUserGroups}
          disabled={!selectedUserIdForGroups || loading}
          className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update User ↔ Groups"}
        </button>
      </div> */}
    </>
  );

const renderGroupOrgsTab = () => (
  <>
    {/* Group select row (match Project design) */}
    <div className="mb-2 rounded flex items-center gap-x-4 w-full">
      <label className="input-label">
        Group <span className="text-red-500">*</span>
      </label>
      <Select
        options={groupOptions}
        isLoading={groupLoading}
        className="outline-none w-[40%]"
        value={
          selectedGroupIdForOrgs
            ? groupOptions.find((o) => o.value === selectedGroupIdForOrgs)
            : null
        }
        onChange={(opt) => setSelectedGroupIdForOrgs(opt ? opt.value : "")}
        isSearchable
        placeholder="Search & select a group"
      />
    </div>

    {/* Orgs section */}
    <div className="rounded mb-4">
      <div className="flex items-center gap-x-4 mb-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Organizations for group
          </h3>
          {/* <span className="text-sm text-blue-600">
            {selectedOrgsForGroup.length} selected
          </span> */}
        </div>

        {selectedGroupIdForOrgs && (
          <>
          {/* // <div> */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTermOrgs}
              onChange={(e) => setSearchTermOrgs(e.target.value)}
              className="border outline-none border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm bg-white shadow-inner"
            />
          </div>
          <div className="flex flex-1 justify-end">
      <button
        onClick={saveGroupOrgs}
        disabled={!selectedGroupIdForOrgs || loading || !canEdit("projectOrgSecurity")}
        className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
      >
        {loading ? "Saving..." : "Update Group ↔ Orgs"}
      </button>
    </div>
    </>
        )}
        
      </div>

      <div className="overflow-x-auto max-h-80 border border-gray-300 rounded">
        <table className="w-full text-sm">
          <thead className="thead">
            <tr className="bg-white border-b border-gray-300">
              <th className="th-thead w-10 text-left text-black text-xs">
                Select
              </th>
              <th className="th-thead text-left text-black text-xs">Org ID</th>
              <th className="th-thead text-left text-black text-xs">
                Org Name
              </th>
            </tr>
          </thead>
          <tbody>
            {!selectedGroupIdForOrgs ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                  Select a group to view organizations.
                </td>
              </tr>
            ) : orgLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                  Loading organizations...
                </td>
              </tr>
            ) : sortedOrgsForGroup.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                  No organizations found.
                </td>
              </tr>
            ) : (
              sortedOrgsForGroup.map((o) => {
                const selected = selectedOrgsForGroup.includes(o.orgId);
                return (
                  <tr key={o.orgId} className="hover:bg-gray-50">
                    <td className="tbody-td">
                      <input
                        type="checkbox"
                        className="w-3 h-3"
                        checked={selected}
                        disabled={!canEdit("projectOrgSecurity")}
                        onChange={() => toggleOrgForGroup(o.orgId)}
                      />
                    </td>
                    <td className="tbody-td">{o.orgId}</td>
                    <td className="tbody-td">{o.orgName || "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* <div className="flex justify-end">
      <button
        onClick={saveGroupOrgs}
        disabled={!selectedGroupIdForOrgs || loading}
        className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
      >
        {loading ? "Saving..." : "Update Group ↔ Orgs"}
      </button>
    </div> */}
  </>
);

  const renderUserOrgsTab = () => (
    <>
      <div className="mb-6 bg-gray-50 p-4 rounded-xl border">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User <span className="text-red-500">*</span>
        </label>
        <Select
          options={userOptions}
          isLoading={userLoading}
          value={
            selectedUserIdForOrgs
              ? userOptions.find((o) => o.value === selectedUserIdForOrgs)
              : null
          }
          onChange={(opt) =>
            setSelectedUserIdForOrgs(opt ? opt.value : "")
          }
          isSearchable
          placeholder="Search & select a user"
        />
        {selectedUserIdForOrgs && (
          <p className="mt-2 text-xs text-green-600">
            Selected user: <strong>{selectedUserIdForOrgs}</strong>
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Organizations for user
          </h3>
          <span className="text-sm text-blue-600">
            {selectedOrgsForUser.length} selected
          </span>
        </div>

        {selectedUserIdForOrgs && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTermUserOrgs}
              onChange={(e) => setSearchTermUserOrgs(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
        )}

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="thead">
              <tr className="bg-white border-b">
                <th className="px-3 py-2 w-10 text-left text-gray-500 text-xs">
                  Select
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Org ID
                </th>
                <th className="px-3 py-2 text-left text-gray-500 text-xs">
                  Org Name
                </th>
              </tr>
            </thead>
            <tbody>
              {!selectedUserIdForOrgs ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Select a user to view organizations.
                  </td>
                </tr>
              ) : orgLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Loading organizations...
                  </td>
                </tr>
              ) : sortedOrgsForUser.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                sortedOrgsForUser.map((o) => {
                  const selected = selectedOrgsForUser.includes(o.orgId);
                  return (
                    <tr key={o.orgId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selected}
                          onChange={() => toggleOrgForUser(o.orgId)}
                        />
                      </td>
                      <td className="px-3 py-2">{o.orgId}</td>
                      <td className="px-3 py-2">
                        {o.orgName || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveUserOrgs}
          disabled={!selectedUserIdForOrgs || loading}
          className="bg-[#17414d] btn1 btn-blue disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update User ↔ Orgs"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen text-gray-900 flex w-full">
      {/* <h2 className="text-2xl font-bold mb-2">
        User, Group & Org Mapping
      </h2> */}
      <div className="w-full  p-2 mt-10 space-y-2">
        <div className="p-4 border-b w-full rounded-sm border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <AiOutlineFundProjectionScreen
              size={20}
              className="text-blue-500"
            />
            Project Org Mapping
          </h2>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <div className="bg-white p-4 w-full rounded">
          <div className="flex justify-between items-center rounded  mb-4">
            <div className="flex gap-x-2">
              <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeMainTab === "projectUsers"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveMainTab("projectUsers")}
              >
                Project ↔ Users
              </button>

              <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeMainTab === "userGroups"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveMainTab("userGroups")}
              >
                User ↔ Groups
              </button>

              <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeMainTab === "groupOrgs"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveMainTab("groupOrgs")}
              >
                Group ↔ Orgs
              </button>
            </div>
          </div>

          {activeMainTab === "projectUsers" && renderProjectUsersTab()}
          {activeMainTab === "userGroups" && renderUserGroupsTab()}
          {activeMainTab === "groupOrgs" && renderGroupOrgsTab()}
          {activeMainTab === "userOrgs" && renderUserOrgsTab()}
          {/* {activeMainTab === "manageGroups" && renderManageGroupsTab()}
      {activeMainTab === "manageUsers" && renderManageUsersTab()} */}
        </div>
      </div>
    </div>
  );
};

export default UserOrgProjectMapping;