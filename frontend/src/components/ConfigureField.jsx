import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { PLC_PROJECT_COLUMNS, PLC_EMPLOYEE_COLUMNS, PLC_VENDOR_COLUMNS } from "./PLCComponent";
import { backendUrl } from "./config";
import { HOURS_EMPLOYEE_COLUMNS } from "./ProjectHoursDetails";
import { AMOUNTS_EMPLOYEE_COLUMNS } from "./ProjectAmountsTable";
import { HOUR_BUTTON } from "./ProjectBudgetStatus";

// Table Headers Sections (existing)
const tableSections = [
  {
    id: "projectHours",
    label: "Project Hours",
    // fields: HOURS_EMPLOYEE_COLUMNS.map((c) => ({ id: c.key, label: c.label })),
    fields: [{ id: 'perHourRate', label: 'Hour Rate' },{ id: 'revenue', label: 'Revenue' },{ id: 'cost', label: 'Cost' }],
  },
  // {
  //   id: "projectAmounts",
  //   label: "Project Amounts",
  //   fields: AMOUNTS_EMPLOYEE_COLUMNS.map((c) => ({
  //     id: c.key,
  //     label: c.label,
  //   })),
  // },
  {
    id: "projectBudgetStatus",
    label: "Project Budget",
    fields: HOUR_BUTTON.map((c) => ({
      id: c.key,
      label: c.label,
    })),
  },

  // {
  //   id: "revenueAnalysis",
  //   label: "Revenue Details",
  //   // adminOnly: true,
  //   fields: [
  //     { id: "revenueAmount", label: "Revenue Amount" },
  //     { id: "backlog", label: "Backlog" }
  //   ],
  // },
  // {
  //   id: "analysisByPeriod",
  //   label: "Monthly Forecast",
  //   // adminOnly: true,
  //   fields: [
  //     { id: "forecastTable", label: "Forecast Data" }
  //   ],
  // },
  // {
  //   id: "plcProject",
  //   label: "PLC Project Rates",
  //   // adminOnly: true,
  //   fields: PLC_PROJECT_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  // },
  // {
  //   id: "plcEmployee",
  //   label: "PLC Employee Rates",
  //   // adminOnly: true,
  //   fields: PLC_EMPLOYEE_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  // },
  // {
  //   id: "plcVendor",
  //   label: "PLC Vendor Rates",
  //   // adminOnly: true,
  //   fields: PLC_VENDOR_COLUMNS.map(c => ({ id: c.key, label: c.label })),
  // },
  // {
  //   id: "revenueSetup",
  //   label: "Revenue Definition",
  //   // adminOnly: true,
  //   fields: [
  //     { id: "revenueSetup", label: "Revenue Setup" }
  //   ],
  // },
  // {
  //   id: "revenueCeiling",
  //   label: "Adjustment",
  //   // adminOnly: true,
  //   fields: [
  //     { id: "revenueCeiling", label: "Revenue Ceiling" }
  //   ],
  // },
  // {
  //   id: "funding",
  //   label: "Funding",
  //   // adminOnly: true,
  //   fields: [
  //     { id: "fundingAmount", label: "Funding Amount" },
  //     { id: "modNumber", label: "Mod Number" }
  //   ],
  // },
  // {
  //   id: "warning",
  //   label: "Warning",
  //   adminOnly: false,
  //   fields: [
  //     { id: "warningComponent", label: "Warnings" }
  //   ],
  // },
];

// Navigation Sidebar Sections
const navigationSections = [
  {
    id: "planning",
    label: "Planning Menu",
    adminOnly: false,
    fields: [
      { id: "projectBudgetStatus", label: "Project Planning" },
      { id: "projectReport", label: "Reporting" },
      { id: "massUtility", label: "Mass Utility" },
      // { id: "newBusiness", label: "New Business" }
    ],
  },
  {
    id: "newBusiness",
    label: "New Business Budget",
    adminOnly: false,
    fields: [
      { id: "manageNewBusiness", label: "Manage New Business" },
      { id: "transferUtility", label: "Transfer Project Budget" },
      // { id: "massUtility", label: "Mass Utility" },
      // { id: "newBusiness", label: "New Business" }
    ],
  },
  {
    id: "manage",
    label: "Manage",
    fields: [
      { id: "manageUser", label: "Manage Users" },
      { id: "manageGroups", label: "Manage Groups" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    // adminOnly: true,
    fields: [
      { id: "globalConfiguration", label: "Configuration Settings" },
      { id: "poolRateTabs", label: "Burden Setup" },
      { id: "analogRate", label: "NBIs Analogous Rate" },
      { id: "accountMapping", label: "Account Mapping" },
      { id: "projectOrgSecurity", label: "Project Org Security" },
      { id: "prospectiveIdSetup", label: "Prospective ID Setup" },
      { id: "ceilingConfiguration", label: "Ceiling Configuration" },
      { id: "annualHolidays", label: "Annual Holidays" },
      { id: "fiscalYearPeriods", label: "Fiscal Year Periods" },
      { id: "roleRights", label: "Rights Settings" },
    ],
  },
];

const ConfigureField = ({ externalSections }) => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [visibility, setVisibility] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("tableHeaders"); // "tableHeaders" | "navigation"
  const [selectedUserIds, setSelectedUserIds] = useState([]);
const [userSearch, setUserSearch] = useState("");
const [configMode, setConfigMode] = useState("user");
const [selectedUserRole,setSelectedUserRole] = useState("")

  const parentRefs = useRef({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/User`);
        if (res.data) {
          setUsers(res.data);
          if (res.data.length > 0) {
            setSelectedUserId(String(res.data[0].userId));
          }
        }
      } catch (e) {
        console.error("User fetch failed", e);
      }
    };
    fetchUsers();
  }, []);

  const selectedUser = users.find(
    (u) => String(u.userId) === String(selectedUserId)
  );

  const selectedUserLabel = selectedUser
    ? `${selectedUser.userId} - ${selectedUser.username} (${selectedUser.fullName})`
    : "";

  // Get current sections based on active tab
  const getCurrentSections = () => {
    return activeTab === "navigation" ? navigationSections : tableSections;
  };

  // 2. Load Visibility when User Selection changes
  useEffect(() => {
    if (!selectedUserId) return;
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/Configuration/GetVisibilityByUser/${selectedUserId}`);
        setVisibility(res.data || {});
      } catch (e) {
        // Fallback: Default visibility based on sections
        const defaultVis = {};
        getCurrentSections().forEach(tab => {
          defaultVis[tab.id] = !tab.adminOnly;
          tab.fields.forEach(f => defaultVis[`${tab.id}.${f.id}`] = !tab.adminOnly);
        });
        setVisibility(defaultVis);
      } finally { 
        setLoading(false); 
      }
    };
    loadConfig();
  }, [selectedUserId, activeTab]);

  const toggleTabVisibility = (tabId, checked) => {
    const newVis = { ...visibility, [tabId]: checked };
    // Also toggle all children headers automatically
    const tab = getCurrentSections().find(t => t.id === tabId);
    if (tab) {
      tab.fields.forEach(f => newVis[`${tab.id}.${f.id}`] = checked);
    }
    setVisibility(newVis);
  };

  const filteredUsers = users.filter(u => {
  const q = userSearch.trim().toLowerCase();
  if (!q) return true;
  return (
    String(u.userId).toLowerCase().includes(q) ||
    u.username?.toLowerCase().includes(q) ||
    u.fullName?.toLowerCase().includes(q)
  );
});

const allVisibleIds = filteredUsers.map(u => String(u.userId));
const isAllSelected =
  allVisibleIds.length > 0 &&
  allVisibleIds.every(id => selectedUserIds.includes(id));


const save = async () => {
  setSaving(true);
  try {
    if (configMode === "user") {
      // Handle multiple selected users as ARRAY [1,2,3]
      if (selectedUserIds.length === 0) {
        alert("Please select at least one user");
        return;
      }
      
      await axios.put(
        `${backendUrl}Configuration/UpdateVisibilityByUser`,
        { 
          userIds: selectedUserIds,  // Send as array [1,2,3]
          visibility, 
          configType: activeTab 
        }
      );
      
      alert(`Configuration saved successfully for ${selectedUserIds.length} user(s)!`);
      
    } else {
      // Role mode (unchanged)
      if (!selectedUserRole) {
        alert("Please select a role");
        return;
      }
      await axios.put(
        `${backendUrl}Configuration/UpdateVisibilityByRole/${encodeURIComponent(selectedUserRole)}`,
        { role: selectedUserRole, visibility, configType: activeTab }
      );
      alert("Configuration saved successfully!");
    }
  } catch (e) {
    console.error("Save error:", e);
    alert("Failed to save configuration");
  } finally {
    setSaving(false);
  }
};

  const renderSection = (tab) => {
    const isVisible = !!visibility[tab.id];
    return (
      <div key={tab.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* TAB LEVEL */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <input 
              ref={el => { if (el) parentRefs.current[tab.id] = el; }}
              type="checkbox" 
              checked={isVisible} 
              onChange={(e) => toggleTabVisibility(tab.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-semibold text-gray-900 text-sm">{tab.label}</span>
              {/* {tab.adminOnly && (
                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                  Admin Only
                </span>
              )} */}
            </div>
          </div>
          <button 
            onClick={() => setExpanded(prev => ({...prev, [tab.id]: !prev[tab.id]}))}
            className="text-blue-600 text-sm hover:text-blue-700 font-medium hover:underline p-1 rounded"
          >
            {expanded[tab.id] ? "Hide Items" : `(${tab.fields.length}) Show Items`}
          </button>
        </div>

        {/* ITEMS LEVEL */}
        {expanded[tab.id] && (
          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tab.fields.map(field => {
                const fieldId = `${tab.id}.${field.id}`;
                return (
                  <label key={fieldId} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100">
                    <input 
                      type="checkbox"
                      disabled={!isVisible}
                      checked={!!visibility[fieldId]}
                      onChange={(e) => setVisibility(prev => ({...prev, [fieldId]: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-medium ${
                      !isVisible 
                        ? "text-gray-400 line-through" 
                        : visibility[fieldId] 
                          ? "text-gray-900" 
                          : "text-gray-600"
                    }`}>
                      {field.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 w-full mx-auto bg-white shadow-xl rounded-2xl">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Access Configuration</h2>
      </div>
      {/* User Selection */}
      {/* <div className="mb-8 p-6 bg-gray-50 rounded-xl border">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select User to Configure:
        </label>
        <select
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={loading}
        >
          {users.length === 0 ? (
            <option>No users loaded</option>
          ) : (
            users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.userId} - {u.username} ({u.fullName})
              </option>
            ))
          )}
        </select>
        {selectedUserLabel && (
          <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">{selectedUserLabel}</p>
        )}
      </div> */}
<div className="mb-4 flex gap-3 items-center">
  <span className="text-sm font-medium text-gray-700">Configure by:</span>
  <button
    type="button"
    onClick={() => setConfigMode("user")}
    className={`px-3 py-1.5 text-xs rounded border ${
      configMode === "user"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    User
  </button>
  {/* <button
    type="button"
    onClick={() => setConfigMode("role")}
    className={`px-3 py-1.5 text-xs rounded border ${
      configMode === "role"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-700 border-gray-300"
    }`}
  >
    Role
  </button> */}
</div>

{configMode === "user" ? (
      <div className="mb-2 p-4 bg-gray-50 rounded-xl border">
  <label className="block text-sm font-semibold text-gray-700 mb-3">
    Select User(s) to Configure:
  </label>

  {/* Search + All + multi-select in one */}
  <div className="space-y-2">
    <input
      type="text"
      placeholder="Search by ID, username, or name..."
      value={userSearch}
      onChange={(e) => setUserSearch(e.target.value)}
      disabled={loading}
      className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />

    <div className="border-2 border-gray-300 rounded-xl max-h-56 overflow-y-auto bg-white">
      {/* All toggle */}
      <label className="flex items-center gap-2 px-4 py-2 border-b text-sm cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={isAllSelected}
          disabled={loading || filteredUsers.length === 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
            } else {
              setSelectedUserIds((prev) => prev.filter(id => !allVisibleIds.includes(id)));
            }
          }}
        />
        <span className="font-semibold">All (visible)</span>
      </label>

          <div className="max-h-30 overflow-y-auto">
      {users.length === 0 ? (
        <div className="px-4 py-2 text-xs text-gray-500">No users loaded</div>
      ) : filteredUsers.length === 0 ? (
        <div className="px-4 py-2 text-xs text-gray-500">No matches</div>
      ) : (
        filteredUsers.map((u) => {
          const id = String(u.userId);
          const checked = selectedUserIds.includes(id);
          return (
            <label
              key={id}
              className="flex items-center gap-2 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={checked}
                disabled={loading}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUserIds((prev) => [...prev, id]);
                  } else {
                    setSelectedUserIds((prev) => prev.filter(x => x !== id));
                  }
                }}
              />
              <span>
                {u.userId} - {u.username} ({u.fullName})
              </span>
            </label>
          );
        })
      )}
    </div>
  </div>
  </div>  

  {selectedUserIds.length > 0 && (
    <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
      Selected: {selectedUserIds.join(", ")}
    </p>
  )}
</div>
): (<div className="mb-8 p-6 bg-gray-50 rounded-xl border">
    <label className="block text-sm font-semibold text-gray-700 mb-3">
      Select Role to Configure:
    </label>
    <select
      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
      value={selectedUserRole}
      onChange={(e) => setSelectedUserRole(e.target.value)}
      disabled={loading}
    >
      {/* {roles.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))} */}
    </select>
  </div>
)}

   {/* Tab Switcher */}
      <div className="mb-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "tableHeaders"
                ? "bg-white shadow-sm text-blue-700 border-2 border-blue-200"
                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("tableHeaders")}
          >
            Table Headers
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all ${
              activeTab === "navigation"
                ? "bg-white shadow-sm text-blue-700 border-2 border-blue-200"
                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("navigation")}
          >
            Navigation Menu
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-12 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Loading configuration...
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4 mb-4">
        {getCurrentSections().map(renderSection)}
      </div>

      {/* Save Button */}

      <button 
        onClick={save}
        disabled={saving || loading || !selectedUserId}
        className="w-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-2 rounded-xl text-xs shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
            Saving...
          </>
        ) : (
          `Save ${activeTab === "navigation" ? "Navigation" : "Table"} Configuration`
        )}
      </button>
    </div>
  );
};

export default ConfigureField;
