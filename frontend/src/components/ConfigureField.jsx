import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import axios from "axios";
import { backendUrl } from "./config";
import { IoAccessibility } from "react-icons/io5";
import { toast } from "react-toastify";

const ConfigureField = ({ externalSections, loadConfigMain }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [visibility, setVisibility] = useState({}); // Stores { key: { view: bool, edit: bool } }
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("navigation");
  const [configMode, setConfigMode] = useState("user");
  const [selectedUserRole, setSelectedUserRole] = useState("");

  // Static definitions strictly for UI mapping
  const navigationSections = [ 
    {
      id: "planning",
      label: "Project Planning",
      fields: [
        { id: "BUD/EAC", label: "BUD/EAC" },
        { id: "monthlyForecast", label: "Monthly Forecast" },
        { id: "laborCategories", label: "Labor Categories" },
        { id: "revenueDefinition", label: "Revenue Definition" },
        { id: "adjustment", label: "Adjustment" },
        { id: "funding", label: "Funding" },
        { id: "warning", label: "Warning" },
        { id: "projectReport", label: "Project Report" },
        { id: "massUtility", label: "Mass Utility" },
        { id: "otherCost", label: "Other Cost" },
        { id: "indirectCost", label: "Indirect Cost" },
        { id: "financialReport", label: "Financial Reporting" },
        { id: "pricing", label: "Pricing" },
      ],
    },
    {
      id: "newBusiness",
      label: "New Business Budget",
      adminOnly: false,
      fields: [
        { id: "manageNewBusiness", label: "Manage New Business" },
        { id: "transferUtility", label: "Transfer Project Budget" },
        { id: "impOpportunity", label: "Import Opportunity" },
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

  const tableSections = [
    {
      id: "projectHours",
      label: "Project Hours",
      fields: [
        { id: "perHourRate", label: "Hour Rate" },
        { id: "cost", label: "Cost" },
      ],
    },
  ];

  useEffect(() => {
    setSelectedUserRole("");
    setSelectedUserId("");
  }, [configMode]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/User`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("currentUser") || "{}").token ?? ""}`,
          },
        });
        if (res.data) setUsers(res.data);
      } catch (e) {
        console.error("User fetch failed", e);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await axios.get(`${backendUrl}/Orgnization/Roles`, {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("currentUser") || "{}").token ?? ""}`,
          },
        });
        if (res.data) setRoles(res.data);
      } catch (e) {
        console.error("User fetch failed", e);
      }
    };
    fetchRole();
  }, []);

  const getCurrentSections = () => {
    return activeTab === "navigation" ? navigationSections : tableSections;
  };

  // Load Configuration
  const loadConfig = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/Orgnization/${selectedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("currentUser") || "{}").token ?? ""}`,
          },
        },
      );
      const data = res.data || {};

      // Merge screens and fields into a single flat state for the UI checkboxes
      const mergedVisibility = {
        ...(data.screens || {}),
        ...(data.fields || {}),
      };
      setVisibility(mergedVisibility);
    } catch (e) {
      setVisibility({});
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadConfig();
  }, [selectedUserId, configMode]);

  useEffect(() => {
    if (!selectedUserRole) return;
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${backendUrl}/Orgnization/role-permissions/${selectedUserRole}`,
          {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem("currentUser") || "{}").token ?? ""}`,
            },
          },
        );
        const data = res.data || {};

        // Merge screens and fields into a single flat state for the UI checkboxes
        const mergedVisibility = {
          ...(data.screens || {}),
          ...(data.fields || {}),
        };
        setVisibility(mergedVisibility);
      } catch (e) {
        setVisibility({});
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, [selectedUserRole]);

  // const handleCheckboxChange = (fieldId, type, checked) => {
  //   setVisibility((prev) => ({
  //     ...prev,
  //     [fieldId]: {
  //       ...(prev[fieldId] || { view: false, edit: false }),
  //       [type]: checked,
  //     },
  //   }));
  // };

  const handleCheckboxChange = (fieldId, type, checked) => {
    setVisibility((prev) => {
      const current = prev[fieldId] || { view: false, edit: false };

      // If EDIT is checked → VIEW must be checked
      if (type === "edit" && checked) {
        return {
          ...prev,
          [fieldId]: { view: true, edit: true },
        };
      }

      // If VIEW is unchecked → EDIT must also be unchecked
      if (type === "view" && !checked) {
        return {
          ...prev,
          [fieldId]: { view: false, edit: false },
        };
      }

      // Normal toggle
      return {
        ...prev,
        [fieldId]: {
          ...current,
          [type]: checked,
        },
      };
    });
  };

  const save = async () => {
    console.log(visibility);
    setSaving(true);
    try {
      const screens = {};
      const fields = {};

      // Map visibility state back to specific objects based on the static lists
      navigationSections.forEach((sec) => {
        sec.fields.forEach((f) => {
          if (visibility[f.id]) screens[f.id] = visibility[f.id];
        });
      });

      tableSections.forEach((sec) => {
        sec.fields.forEach((f) => {
          if (visibility[f.id]) fields[f.id] = visibility[f.id];
        });
      });

      // Determine the identifier and endpoint based on configMode
      const isUserMode = configMode === "user";

      const payload = {
        ...(isUserMode
          ? { userid: Number(selectedUserId) }
          : { roleId: Number(selectedUserRole) }),
        screens: screens,
        fields: fields,
      };

      const endpoint = isUserMode
        ? `${backendUrl}/Orgnization/user-settings`
        : `${backendUrl}/Orgnization/role-settings`;

      await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("currentUser") || "{}").token ?? ""}`,
        },
      });
      await loadConfigMain();
      toast.success("Configuration saved successfully!");
      // alert("Configuration saved successfully!");
    } catch (e) {
      console.error("Save error:", e);
      // alert("Failed to save configuration");
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (section, type, checked) => {
    setVisibility((prev) => {
      const nextState = { ...prev };

      section.fields.forEach((field) => {
        const current = nextState[field.id] || { view: false, edit: false };

        if (type === "view") {
          // If unchecking view, must also uncheck edit
          nextState[field.id] = {
            view: checked,
            edit: checked ? current.edit : false,
          };
        } else if (type === "edit") {
          // If checking edit, must also check view
          nextState[field.id] = {
            view: checked ? true : current.view,
            edit: checked,
          };
        }
      });

      return nextState;
    });
  };

  const renderSection = (tab) => {
    const isAllView = tab.fields.every((f) => visibility[f.id]?.view);
    const isAllEdit = tab.fields.every((f) => visibility[f.id]?.edit);
    return (
      <div
        key={tab.id}
        className="border rounded border-gray-300 overflow-hidden"
      >
        <div
          className={`flex items-center justify-between p-2 ${expanded[tab.id]}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`input-label ${!selectedUserRole && !selectedUserId ? "text-gray-400" : ""}`}
            >
              {tab.label}
            </span>
            <div className="flex gap-2 ml-4 border-l pl-4 border-gray-400">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllView}
                  onChange={(e) =>
                    handleSelectAll(tab, "view", e.target.checked)
                  }
                  className="w-3 h-3 text-blue-600 rounded"
                  disabled={!selectedUserRole && !selectedUserId}
                />
                <span
                  className={`text-xs font-medium text ${!selectedUserRole && !selectedUserId ? "text-gray-400" : ""}`}
                >
                  Select All View
                </span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllEdit}
                  onChange={(e) =>
                    handleSelectAll(tab, "edit", e.target.checked)
                  }
                  className="w-3 h-3 text-blue-600 rounded"
                  disabled={!selectedUserRole && !selectedUserId}
                />
                <span
                  className={`text-xs font-medium text ${!selectedUserRole && !selectedUserId ? "text-gray-400" : ""}`}
                >
                  Select All Edit
                </span>
              </label>
            </div>
          </div>
          <button
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [tab.id]: !prev[tab.id] }))
            }
            className="text-xs font-medium hover:underline p-1 rounded cursor-pointer"
          >
            {expanded[tab.id]
              ? "Hide Items"
              : `(${tab.fields.length}) Show Items`}
          </button>
        </div>

        {expanded[tab.id] && (
          <div className="p-2 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tab.fields.map((field) => (
                <div
                  key={field.id}
                  className="p-2 border border-gray-200 rounded bg-gray-50 flex items-center justify-between"
                >
                  <span
                    className={`text-xs font-medium text-gray-700 ${!selectedUserRole && !selectedUserId ? "text-gray-400" : ""}`}
                  >
                    {field.label}
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          !!visibility[field.id]?.view ||
                          !!visibility[field.id]?.edit
                        }
                        onChange={(e) =>
                          handleCheckboxChange(
                            field.id,
                            "view",
                            e.target.checked,
                          )
                        }
                        className="w-3 h-3 text-blue-600 rounded"
                        disabled={!selectedUserRole && !selectedUserId}
                      />
                      <span
                        className={`text-[10px] ${!selectedUserRole && !selectedUserId ? "text-gray-400" : ""}`}
                      >
                        View
                      </span>
                    </label>
                    {/* Edit Checkbox - Hidden specifically for projectReport */}
                    {/* {field.id !== "projectReport" && ( */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!visibility[field.id]?.edit}
                        onChange={(e) =>
                          handleCheckboxChange(
                            field.id,
                            "edit",
                            e.target.checked,
                          )
                        }
                        disabled={!selectedUserRole && !selectedUserId}
                        className="w-3 h-3 text-blue-600 rounded"
                      />
                      <span
                        className={`text-[10px] ${!selectedUserRole && !selectedUserId ? "text-gray-400" : ""}`}
                      >
                        Edit
                      </span>
                    </label>
                    {/* )} */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-900 flex justify-center">
      <div className="w-full space-y-2">
        <div className="p-4 flex items-center justify-between bg-white rounded-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IoAccessibility size={20} className="text-blue-500" />
            User Access Configuration
          </h2>
        </div>

        <div className="bg-white rounded-sm p-4">
          <div className="mb-4 flex gap-2 items-center">
            <span className="input-label">Configure by:</span>
            <button
              onClick={() => setConfigMode("user")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer ${configMode === "user" ? "bg-[#17414d] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              User
            </button>
            <button
              onClick={() => setConfigMode("role")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer ${configMode === "role" ? "bg-[#17414d] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Role
            </button>
          </div>

          {configMode === "user" && (
            <div className="flex items-center gap-2 mb-2">
              <label className="label-input">Select User:</label>
              <Select
                options={users.map((u) => ({
                  value: u.userId,
                  label: u.fullName,
                }))}
                value={users.find((u) => u.value === selectedUserId)}
                onChange={(opt) => setSelectedUserId(opt ? opt.value : "")}
                className="w-[250px]"
                isClearable
              />
            </div>
          )}
          {configMode === "role" && (
            <div className="flex items-center gap-2 mb-2">
              <label className="label-input">Select Role:</label>
              <Select
                options={roles.map((u) => ({
                  value: u.roleId,
                  label: u.roleName,
                }))}
                value={roles.find((u) => u.value === selectedUserRole)}
                onChange={(opt) => setSelectedUserRole(opt ? opt.value : "")}
                className="w-[250px]"
                isClearable
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-sm p-4">
          <div className="flex items-center justify-between">
          <div className="flex gap-2 mb-4">
            <button
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === "navigation" ? "bg-[#17414d] text-white" : "bg-gray-100"}`}
              onClick={() => setActiveTab("navigation")}
            >
              Screens
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === "tableHeaders" ? "bg-[#17414d] text-white" : "bg-gray-100"}`}
              onClick={() => setActiveTab("tableHeaders")}
            >
              Fields
            </button>
          </div>

          <button
            onClick={save}
            disabled={saving || (!selectedUserRole && !selectedUserId)}
            className="btn1 btn-blue"
          >
            {saving ? "Saving..." : `Save Configuration`}
            {/* ${activeTab === "navigation" ? "Screen" : "Field"}  */}
          </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 mt-4">Loading...</span>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {getCurrentSections().map(renderSection)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigureField;
