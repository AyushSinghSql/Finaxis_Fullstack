import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { backendUrl } from "./config";
import { toast } from "react-toastify";
import { MdGroups2 } from "react-icons/md";

const ManageGroups = () => {
  // Global lists
   
  const [groups, setGroups] = useState([]);

  // Select options
 
  const [groupOptions, setGroupOptions] = useState([]);



  // UI state
  const [activeMainTab, setActiveMainTab] = useState("manageGroups");
  // "projectUsers" | "userGroups" | "groupOrgs" | "userOrgs" | "manageGroups" | "manageUsers"

  const [searchTermGroups, setSearchTermGroups] = useState("");
  

  // Manage Groups form state
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupCodeInput, setGroupCodeInput] = useState("");
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupFormLoading, setGroupFormLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------Manage Groups-----------

  const [selectedGroupIdsForDelete, setSelectedGroupIdsForDelete] = useState(
    [],
  );

  const toggleSelectedGroupForDelete = (id) => {
    setSelectedGroupIdsForDelete((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
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
          },
        );
        toast.success("Group updated.");
      }

      // Refresh list
      const groupsRes = await axios.get(
        `${backendUrl}/api/user-projects/GetGroups`,
      );
      const groupData = applyGroupSorting(groupsRes.data);
      setGroups(groupData);
      setGroupOptions(
        groupData.map((g) => ({
          value: g.orgGroupId,
          label: `${g.orgGroupId} - ${g.orgGroupName || ""}`,
        })),
      );

      resetGroupForm();
    } catch (e) {
      console.error("Save group failed", e);
      // toast.error("Failed to save group.");
      const apiMessage =
        e?.response?.data?.message ||
        e?.response?.data?.title || // common for ASP.NET
        (typeof e?.response?.data === "string" ? e.response.data : null);

      if (apiMessage) {
        toast.error(apiMessage); // e.g. "OrgGroupCode already exists."
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
        selectedGroupIdsForDelete,
      );
      // if your API expects { ids: [...] } then:
      // await axios.post(`${backendUrl}/api/user-projects/OrgGroups/BulkDelete`, {
      //   ids: selectedGroupIdsForDelete,
      // });

      toast.success("Selected groups deleted.");

      const groupsRes = await axios.get(
        `${backendUrl}/api/user-projects/GetGroups`,
      );
      const groupData = applyGroupSorting(groupsRes.data);
      setGroups(groupData);
      setGroupOptions(
        groupData.map((x) => ({
          value: x.orgGroupId,
          label: `${x.orgGroupId} - ${x.orgGroupName || ""}`,
        })),
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
      (a, b) => (b.orgGroupId ?? 0) - (a.orgGroupId ?? 0),
      // or: (new Date(b.createdAt)) - (new Date(a.createdAt))
    );
  };

  // ---------- Fetch base lists on mount ----------
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        
        setGroupLoading(true);

        // Groups
        const groupsRes = await axios.get(
          `${backendUrl}/api/user-projects/GetGroups`,
        );
        const groupData = groupsRes.data || [];
        setGroups(groupData);
        setGroupOptions(
          groupData.map((g) => ({
            value: g.orgGroupId,
            label: `${g.orgGroupId} - ${g.orgGroupName || ""}`,
          })),
        );

       
      } catch (e) {
        console.error("Base data fetch failed", e);
        setError("Failed to load initial data.");
      } finally {
        
        setGroupLoading(false);
      }
    };

    fetchBaseData();
  }, []);


  const renderManageGroupsTab = () => {
    const filteredGroups = groups.filter((g) =>
      `${g.orgGroupId} ${g.orgGroupCode || ""} ${g.orgGroupName || ""}`
        .toLowerCase()
        .includes(searchTermGroups.toLowerCase()),
    );

    const allSelected = areAllGroupsSelected(filteredGroups);

    return (
      <>
        {/* Create / Edit Group */}
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {editingGroupId ? "Edit Group" : "Create Group"}
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <label className="input-label">Group Code</label>
              <input
                type="text"
                value={groupCodeInput}
                onChange={(e) => setGroupCodeInput(e.target.value)}
                className="input-style"
                placeholder="Group code"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="input-label">Group Name</label>
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="input-style"
                placeholder="Group name"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="input-label">Description</label>
              <input
                type="text"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="input-style"
                placeholder="Description"
              />
            </div>
          </div>

          {/* <div className="flex justify-end gap-2 mt-4">
            {editingGroupId && (
              <button
                type="button"
                onClick={resetGroupForm}
                className="btn1 btn-blue"
                disabled={groupFormLoading}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleCreateOrUpdateGroup}
              className="btn1 btn-blue disabled:opacity-60"
              disabled={groupFormLoading}
            >
              {groupFormLoading
                ? "Saving..."
                : editingGroupId
                  ? "Update Group"
                  : "Create Group"}
            </button>
          </div> */}
        </div>

        {/* Existing Groups */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2 items-center">
              <h3 className="input-label">Existing Groups</h3>
              <input
                type="text"
                placeholder="Search by id, code, name..."
                value={searchTermGroups}
                onChange={(e) => setSearchTermGroups(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm w-64"
              />
            </div>
            <div className=" flex items-center gap-x-2">
              <button
                type="button"
                onClick={handleCreateOrUpdateGroup}
                className="btn1 btn-blue disabled:opacity-60"
                disabled={groupFormLoading}
              >
                {groupFormLoading
                  ? "Saving..."
                  : editingGroupId
                    ? "Update Group"
                    : "Create Group"}
              </button>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={resetGroupForm}
                  className="btn1 btn-blue"
                  disabled={groupFormLoading}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleBulkDeleteGroups}
                className={`btn1 btn-red disabled:opacity-50 ${
                  groupFormLoading || selectedGroupIdsForDelete.length === 0
                    ? "hidden"
                    : ""
                }`}
                disabled={
                  groupFormLoading || selectedGroupIdsForDelete.length === 0
                }
              >
                Delete ({selectedGroupIdsForDelete.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead className="thead"> 
                <tr className="bg-white border-b border-gray-300">
                  <th className="th-thead bg-[#e5f3fb] text-black text-xs w-10">
                    <input
                      type="checkbox"
                      className="w-3 h-3"
                      checked={allSelected}
                      onChange={() => toggleSelectAllGroups(filteredGroups)}
                    />
                  </th>
                  <th className="th-thead bg-[#e5f3fb] text-black text-xs">
                    Code
                  </th>
                  <th className="th-thead bg-[#e5f3fb] text-black text-xs">
                    Name
                  </th>
                  <th className="th-thead bg-[#e5f3fb] text-black text-xs">
                    Description
                  </th>
                  <th className="th-thead bg-[#e5f3fb] text-black text-xs text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {
                groupLoading ? (
                      /* SHOW LOADING SPINNER INSTEAD OF BLANK */
                      <tr>
                        <td colSpan={7} className="px-3 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            {/* <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div> */}
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium">Fetching group(s)...</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      No groups found.
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => {
                    const selected = selectedGroupIdsForDelete.includes(
                      g.orgGroupId,
                    );

                    return (
                      <tr
                        key={g.orgGroupId}
                        className="hover:bg-gray-50 border-b border-gray-300"
                      >
                        <td className="tbody-td">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={selected}
                            onChange={() =>
                              toggleSelectedGroupForDelete(g.orgGroupId)
                            }
                          />
                        </td>
                        <td className="tbody-td">{g.orgGroupCode}</td>
                        <td className="tbody-td">{g.orgGroupName}</td>
                        <td className="tbody-td">{g.description}</td>
                        <td className="tbody-td text-right">
                          <button
                            type="button"
                            onClick={() => startEditGroup(g)}
                            className="btn1 btn-blue"
                          >
                            Edit
                          </button>
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


  return (
    <div className="flex flex-col gap-2">
      <div className="p-4 rounded-sm flex items-center justify-between bg-white">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MdGroups2 size={20} className="text-blue-600" />
          Manage Groups
        </h2>
      </div>

      <div className="p-3 w-full mx-auto bg-white rounded shadow">
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {activeMainTab === "manageGroups" && renderManageGroupsTab()}
      </div>
    </div>
  );
};

export default ManageGroups;
