import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  CheckSquare,
  Search,
  Trash2,
  CheckCircle,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";

import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "./utils";
import { backendUrl } from "./config";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SlCalender } from "react-icons/sl";

const COLUMN_LABELS = {
  selection: "",
  projId: "Project ID",
  projName: "Project Name",
  plType: "BUD/EAC",
  version: "Revision",
  versionCode: "Version Type",
  source: "Origin",
  templateId: "Template ID",
  status: "Status",
  projectStartDate: "Start Date",
  projectEndDate: "End Date",
};

const MassUtilityProject = ({ onPlanSelect, selectedPlan, projectId }) => {
  const [plans, setPlans] = useState([]);
  // Always operate on a safe array reference to avoid runtime errors when `plans` is null/undefined
  const safePlans = Array.isArray(plans) ? plans : [];
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const updatedRef = useRef(null);
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [versionFilter, setVersionFilter] = useState("All"); // All | Latest | Final
  const [versionCodeInput, setVersionCodeInput] = useState("");
  const [data, setData] = useState([])

  const [columns, setColumns] = useState([]);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [rowLoading, setRowLoading] = useState({});
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef(null);
  const [lastImportedVersion, setLastImportedVersion] = useState(null);
  const [lastImportTime, setLastImportTime] = useState(null);
  const [editingVersionCodeIdx, setEditingVersionCodeIdx] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [headerStartDate, setHeaderStartDate] = useState("");
  const [headerEndDate, setHeaderEndDate] = useState("");
  const [headerTemplateId, setHeaderTemplateId] = useState(0);
  // const [selectedProjectId, setSelectedProjectId] = useState(new Set());

  const fullProjectId = useRef("");
  const BOOLEAN_FIELDS = ["finalVersion", "isCompleted", "isApproved"];
  const [templates, setTemplates] = useState([]);

  const [templateMap, setTemplateMap] = useState({});

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`,
        );
        const data = Array.isArray(res.data) ? res.data : [];
        setTemplates(data);

        const map = {};
        data.forEach((t) => {
          // choose what to display; here using templateCode - description
          // map[t.id] = `${t.templateCode} - ${t.description}`;
          map[t.id] = `${t.templateCode}`;
        });
        setTemplateMap(map);
      } catch (err) {
        // toast.error("Failed to load templates.");
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    console.log(data)
  }, [data])

  const getAllData = async () => {
    console.log('run')
    try {
      const response = await axios.get(
        `${backendUrl}/Project/MassUtilityGetAllPlans?UserId=${userId}&Role=${role}`,
        {
          params: {
            search: "", // Maps to backend 'search'
            type: "" , // Maps to backend 'type' (BUD/EAC)
            status:  "" , // Maps to backend 'status'
            active: "",
          },
        },
      );
      if (response.data) {
        const transformed = await response.data.map((p) => ({
          ...p,
          plId: p.plId || p.id,
          // Ensure status mapping consistency for the filter
          status: (p.status || "In Progress")
            .replace("Working", "In Progress")
            .replace("Completed", "Submitted"),
        }));
        console.log(transformed)
        setData(transformed);
        //   toast.success("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project plans.");
    } finally {
      console.log(data)
    }
  };
  useEffect(() => {
    getAllData()
  }, [])

  const getCurrentUserContext = () => {
    try {
      const userString = localStorage.getItem("currentUser");
      if (!userString) return { userId: "", role: "" };
      const userObj = JSON.parse(userString);
      return {
        userId: userObj.userId ?? "",
        role: userObj.role ?? "",
      };
    } catch {
      return { userId: "", role: "" };
    }
  };

  const { userId, role } = getCurrentUserContext();

  const getTemplateName = (id) =>
    templates.find((t) => t.id === id)?.templateCode || "";

  // const handleSaveHeaderTemplateClick = async () => {
  //   const safePlans = Array.isArray(plans) ? plans : [];
  //   const templateId = Number(headerTemplateId) || 0;

  //   if (!templateId) {
  //     toast.warning("Please select a template.");
  //     return;
  //   }

  //   // resolve targets: multi-select first, then single selectedPlan
  //   let targetPlans = [];
  //   if (selectedRows && selectedRows.size > 0) {
  //     targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
  //   } else if (selectedPlan && selectedPlan.plId) {
  //     targetPlans = [selectedPlan];
  //   }

  //   if (targetPlans.length === 0) {
  //     toast.error("No plans selected to update template.");
  //     return;
  //   }

  //   // const notAllowed = targetPlans.filter(p => p.status !== "In Progress");
  //   const notAllowed = targetPlans.filter((p) => p.status !== "In Progress");
  //   if (notAllowed.length > 0) {
  //     toast.warning(
  //       "Template cannot be changed for plans with status In Progress.",
  //     );
  //     return;
  //   }

  //   try {
  //     setIsActionLoading(true);

  //     for (const plan of targetPlans) {
  //       const payload = { ...plan, templateId };
  //       await axios.put(`${backendUrl}/Project/UpdateProjectPlan`, payload);
  //     }

  //     // toast.success("Template updated successfully.", {
  //     //   toastId: "template-update-success",
  //     // });

  //     // refresh list once
  //     const projIdForRefresh = targetPlans[0].projId;
  //     if (projIdForRefresh) {
  //       await refreshPlans(projIdForRefresh);
  //     }

  //     // update selectedPlan so details reflect new template
  //     if (
  //       selectedPlan &&
  //       targetPlans.some((p) => p.plId === selectedPlan.plId)
  //     ) {
  //       const updatedPlan = { ...selectedPlan, templateId };
  //       if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
  //     }
  //   } catch (err) {
  //     toast.error(
  //       "Error updating template: " +
  //         (err.response?.data?.message || err.message),
  //     );
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };

  const handleSaveHeaderTemplateClick = async () => {
    const safePlans = Array.isArray(plans) ? plans : [];
    const templateId = Number(headerTemplateId) || 0;

    if (!templateId) {
      toast.warning("Please select a template.");
      return;
    }

    // 1. Resolve targets: multi-select first, then single selectedPlan
    let targetPlans = [];
    if (selectedRows && selectedRows.size > 0) {
      targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
    } else if (selectedPlan && selectedPlan.plId) {
      targetPlans = [selectedPlan];
    }

    if (targetPlans.length === 0) {
      toast.error("No plans selected to update template.");
      return;
    }

    // 2. Business Logic Validation (Status Check)
    // Ensure template can only be changed for "In Progress" plans
    const notAllowed = targetPlans.filter((p) => p.status !== "In Progress");
    if (notAllowed.length > 0) {
      toast.warning(
        "Template can only be changed for plans with status 'In Progress'.",
      );
      return;
    }

    const prevPlans = [...plans];

    try {
      setIsActionLoading(true);

      // 3. Prepare Parallel API Calls
      const updateTasks = targetPlans.map((plan) => {
        const payload = {
          ...plan,
          templateId,
          projId: plan.projId || fullProjectId.current, // Ensure projId is passed
        };
        return axios.put(`${backendUrl}/Project/UpdateProjectPlan`, payload);
      });

      // 4. Update Local State (Runtime UI Update)
      // This makes the table reflect changes instantly
      setPlans((currentPlans) => {
        const updatedList = currentPlans.map((p) => {
          if (targetPlans.some((tp) => tp.plId === p.plId)) {
            return { ...p, templateId };
          }
          return p;
        });

        // 5. Update Detail Panel (onPlanSelect) in runtime
        if (
          selectedPlan &&
          targetPlans.some((tp) => tp.plId === selectedPlan.plId)
        ) {
          const updatedSelected = updatedList.find(
            (p) => p.plId === selectedPlan.plId,
          );
          if (updatedSelected && typeof onPlanSelect === "function") {
            onPlanSelect(updatedSelected);
          }
        }

        return updatedList;
      });

      // 6. Execute all network requests together
      await Promise.all(updateTasks);

      // toast.success("Template updated successfully.");

      // 7. Refresh background data once (Optional if state update is sufficient)
      const projIdForRefresh = targetPlans[0].projId || fullProjectId.current;
      if (projIdForRefresh) {
        await refreshPlans(projIdForRefresh);
      }
    } catch (err) {
      // Rollback UI on network error
      setPlans(prevPlans);
      if (selectedPlan && typeof onPlanSelect === "function") {
        onPlanSelect(selectedPlan);
      }
      toast.error(
        "Error updating template: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleHeaderSaveAll = async () => {
    const safePlans = Array.isArray(plans) ? plans : [];

    // resolve target plans from selection
    let targetPlans = [];
    if (selectedRows && selectedRows.size > 0) {
      targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
    } else if (selectedPlan && selectedPlan.plId) {
      targetPlans = [selectedPlan];
    }

    if (targetPlans.length === 0) {
      toast.error("No plans selected to update.");
      return;
    }

    const tasks = [];

    // 1) dates
    const isFullDate = (v) =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

    const hasDates =
      headerStartDate &&
      headerEndDate &&
      isFullDate(headerStartDate) &&
      isFullDate(headerEndDate);

    if (hasDates) {
      tasks.push(
        handleSaveHeaderDatesClick(targetPlans, headerStartDate, headerEndDate),
      );
    }

    // 2) template
    const templateId = Number(headerTemplateId) || 0;
    if (templateId) {
      tasks.push(handleSaveHeaderTemplateClick(targetPlans, templateId));
    }

    // 3) version code
    if (versionCodeInput && versionCodeInput.trim() !== "") {
      tasks.push(handleSaveVersionCodeClick(targetPlans, versionCodeInput));
    }

    if (tasks.length === 0) {
      toast.info("Nothing to update.");
      return;
    }

    try {
      setIsActionLoading(true);
      await Promise.all(tasks);
      toast.success("Updates saved successfully.", {
        toastId: "header-save-all",
      });
    } catch (err) {
      toast.error(
        "Error saving updates: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTemplateChange = async (plan, value) => {
    const templateId = Number(value) || 0;
    if (!templateId) return;

    await handleSaveHeaderTemplateClick([{ ...plan, templateId }]);
  };

  // Refresh plans; if overrideProjId is supplied, fetch plans for that project
  const refreshPlans = async (overrideProjId = null) => {
    try {
      if (overrideProjId) {
        // Fetch plans for a single project and merge into existing plans
        const response = await axios.get(
          `${backendUrl}/Project/GetProjectPlans/${overrideProjId}`,
        );
        const fetched = (response.data || []).map((p) => ({
          ...p,
          plId: p.plId || p.id || 0,
          projId: p.fullProjectId || p.projId || p.projectId || overrideProjId,
          status: (p.status || "In Progress")
            .replace("Working", "In Progress")
            .replace("Completed", "Submitted"),
        }));

        setPlans((prev) => {
          const filtered = (prev || []).filter(
            (p) => p.projId !== overrideProjId,
          );
          const merged = [...filtered, ...fetched];
          //   return sortPlansByProjIdPlTypeVersion(merged);
        });
        return fetched;
      }

      // Otherwise, fetch all plans according to filters
      const response = await axios.get(
        `${backendUrl}/Project/MassUtilityGetAllPlans?UserId=${userId}&Role=${role}`,
        {
          params: {
            search: searchQuery || "",
            type: typeFilter === "All" ? "" : typeFilter,
            status: statusFilter === "All" ? "" : statusFilter,
            active:
              versionFilter === "All"
                ? ""
                : versionFilter === "Active"
                  ? "Y"
                  : "N",
          },
        },
      );

      const transformed = (response.data || []).map((p) => ({
        ...p,
        plId: p.plId || p.id || 0,
        projId: p.fullProjectId || p.projId || p.projectId || p.projId,
        status: (p.status || "In Progress")
          .replace("Working", "In Progress")
          .replace("Completed", "Submitted"),
      }));

      const sortedPlans = sortPlansByProjIdPlTypeVersion(transformed);
      setPlans(sortedPlans);
      return sortedPlans;
    } catch (error) {
      // toast.error("Failed to refresh plans.");
      return [];
    }
  };

  const handleRowClick = (plan, tempDates = manualProjectDates) => {
    const isDateMissing =
      filteredProjects.length > 0 &&
      !(filteredProjects[0].startDate || filteredProjects[0].projStartDt);

    const effectiveStartDate = plan.projStartDt || plan.startDate || "";
    const effectiveEndDate = plan.projEndDt || plan.endDate || "";

    //  const effectiveStartDate =
    //     tempDates?.startDate ??
    //     plan.projStartDt ??
    //     plan.startDate ??
    //     "";

    //   const effectiveEndDate =
    //     tempDates?.endDate ??
    //     plan.projEndDt ??
    //     plan.endDate ??
    //     "";

    const updatedPlan = {
      ...plan,
      status: plan.status,
      projStartDt: effectiveStartDate,
      projEndDt: effectiveEndDate,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
    };

    //    setEditingDates(prev => ({
    //   ...prev,
    //   [plan.plId]: {
    //     startDate: plan.projStartDt || plan.startDate || '',
    //     endDate: plan.projEndDt || plan.endDate || ''
    //   }
    // }));

    setEditingDates((prev) => ({
      ...prev,
      [plan.plId]: {
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      },
    }));

    const isSamePlanButDatesChanged =
      selectedPlan &&
      selectedPlan.plId === updatedPlan.plId &&
      selectedPlan.projId === updatedPlan.projId &&
      (selectedPlan.projStartDt !== updatedPlan.projStartDt ||
        selectedPlan.projEndDt !== updatedPlan.projEndDt);

    if (
      !selectedPlan ||
      updatedPlan.plId !== selectedPlan.plId ||
      updatedPlan.projId !== selectedPlan.projId ||
      isSamePlanButDatesChanged
    ) {
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    } else {
      if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
    }

    setVersionCodeInput(updatedPlan.versionCode || "");
    setHeaderStartDate(effectiveStartDate || "");
    setHeaderEndDate(effectiveEndDate || "");
    setHeaderTemplateId(plan.templateId || 0);
  };

  const handleDateCellChange = (plId, dateColumn, value) => {
    const dateType =
      dateColumn === "projectStartDate" ? "startDate" : "endDate";
    const currentDates = editingDates[plId] || {};
    const newDates = { ...currentDates, [dateType]: value };

    // Update state with new dates
    setEditingDates((prev) => ({ ...prev, [plId]: newDates }));

    // Check if we have both dates in valid format
    const isFullDate = (v) =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    const hasStartDate = isFullDate(newDates.startDate);
    const hasEndDate = isFullDate(newDates.endDate);
  };

  const handleSaveHeaderDatesClick = async () => {
    const safePlans = Array.isArray(plans) ? plans : [];

    // 1. Resolve target plans
    let targetPlans = [];
    if (selectedRows && selectedRows.size > 0) {
      targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
    } else if (selectedPlan && selectedPlan.plId) {
      targetPlans = [selectedPlan];
    }

    if (targetPlans.length === 0) {
      toast.error("No plans selected to update dates.");
      return;
    }

    const startDate = headerStartDate;
    const endDate = headerEndDate;

    const isFullDate = (v) =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (!isFullDate(startDate) || !isFullDate(endDate)) {
      toast.warning("Please select both start and end dates.");
      return;
    }

    try {
      setIsActionLoading(true);

      // 2. Prepare API calls (Parallel execution is faster than a loop)
      const updateTasks = targetPlans.map((plan) => {
        if (!plan.projId)
          throw new Error(`Missing project id for plan ${plan.plId}`);

        return axios.put(`${backendUrl}/Project/UpdateDates`, {
          projId: plan.projId,
          projStartDt: startDate,
          projEndDt: endDate,
        });
      });

      // 3. Execute all API calls simultaneously
      await Promise.all(updateTasks);

      // 4. Update the local "plans" state immediately for "Runtime" update
      setPlans((currentPlans) =>
        currentPlans.map((p) => {
          // If this plan was one of the targets, update its dates in the table
          if (targetPlans.some((tp) => tp.plId === p.plId)) {
            return {
              ...p,
              projStartDt: startDate,
              projEndDt: endDate,
            };
          }
          return p;
        }),
      );

      toast.success("Dates updated successfully", { autoClose: 2000 });

      // 5. Update Detail Panel (selectedPlan) if it was part of the update
      if (
        selectedPlan &&
        targetPlans.some((p) => p.plId === selectedPlan.plId)
      ) {
        const updatedPlan = {
          ...selectedPlan,
          projStartDt: startDate,
          projEndDt: endDate,
        };
        if (typeof onPlanSelect === "function") onPlanSelect(updatedPlan);
      }

      // 6. Refresh background data
      // await refreshPlans(targetPlans[0].projId);
    } catch (error) {
      toast.error(
        `Failed to update dates: ${error.response?.data?.message || error.message}`,
        { autoClose: 4000 },
      );
    } finally {
      setIsActionLoading(false);
    }
  };
  // const handleCheckboxChange = async (idx, field) => {
  //   const prevPlans = [...plans];
  //   const plan = plans[idx];
  //   const planId = plan.plId;
  //   if (!plan.plType || !plan.version) {
  //     toast.error(
  //       `Cannot update ${field}: Plan Type and Version are required.`,
  //       { toastId: "checkbox-error" },
  //     );
  //     return;
  //   }
  //   if (field === "isApproved" && !plan.isCompleted) {
  //     toast.error("You can't approve this row until Submitted is checked", {
  //       toastId: "checkbox-error",
  //     });
  //     return;
  //   }
  //   if (field === "finalVersion" && !plan.isApproved) {
  //     toast.error("You can't set Conclude until Approved is checked", {
  //       toastId: "checkbox-error",
  //     });
  //     return;
  //   }
  //   setPlans((currentPlans) => {
  //     const currentPlan = currentPlans[idx];
  //     if (!currentPlan) return currentPlans;

  //     let updated = { ...currentPlan };
  //     updated[field] = !currentPlan[field];

  //     if (field === "isCompleted") {
  //       updated.status = updated.isCompleted ? "Submitted" : "In Progress";
  //       if (!updated.isCompleted) {
  //         updated.isApproved = false;
  //         updated.finalVersion = false;
  //       }
  //     }
  //     if (field === "isApproved") {
  //       updated.status = updated.isApproved ? "Approved" : "Submitted";
  //       if (!updated.isApproved) updated.finalVersion = false;
  //     }
  //     if (field === "finalVersion") {
  //       updated.status = updated.finalVersion ? "Concluded" : "Approved";
  //     }

  //     let newPlans = currentPlans;

  //     if (field === "isCompleted" && !updated.isCompleted) {
  //       const isEAC = updated.plType === "EAC";
  //       const inProgressCount = currentPlans.filter(
  //         (p) =>
  //           p.status === "In Progress" &&
  //           p.plType === updated.plType &&
  //           p.projId === updated.projId,
  //       ).length;

  //       // if (inProgressCount > 0 && updated.status === "In Progress") {
  //       //   toast.error(
  //       //     `Only one ${isEAC ? "EAC" : "BUD"} plan can have In Progress status at a time.`,
  //       //     { toastId: "checkbox-error" }
  //       //   );
  //       //   return currentPlans;
  //       // }
  //     }

  //     if (field === "finalVersion" && updated.finalVersion) {
  //       newPlans = currentPlans.map((p, i) =>
  //         i === idx
  //           ? updated
  //           : p.plType === updated.plType && p.projId === updated.projId
  //             ? { ...p, finalVersion: false }
  //             : p,
  //       );
  //     } else {
  //       newPlans = currentPlans.map((p, i) => (i === idx ? updated : p));
  //     }

  //     // if (updated.status === "In Progress") {
  //     //   newPlans = newPlans.map((p, i) =>
  //     //     i !== idx &&
  //     //     p.status === "In Progress" &&
  //     //     p.plType === updated.plType &&
  //     //     p.projId === updated.projId
  //     //       ? { ...p, status: "Submitted", isCompleted: true }
  //     //       : p
  //     //   );
  //     // }

  //     // also keep onPlanSelect behavior
  //     if (typeof onPlanSelect === "function") onPlanSelect(updated);

  //     // expose updated object to the outer scope via closure
  //     updatedRef.current = updated;

  //     return newPlans;
  //   });

  //   const updated = updatedRef.current || plan;

  //   if (
  //     (BOOLEAN_FIELDS.includes(field) || field === "status") &&
  //     planId &&
  //     Number(planId) > 0
  //   ) {
  //     const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;

  //     const payload = {
  //       plId: updated.plId,
  //       projId: fullProjectId.current || updated.projId,
  //       plType: updated.plType,
  //       versionCode: updated.versionCode,
  //       finalVersion: updated.finalVersion,
  //       isCompleted: updated.isCompleted,
  //       isApproved: updated.isApproved,
  //       status: updated.status,
  //       approvedBy: updated.approvedBy,
  //       templateId: updated.templateId,
  //     };
  //     try {
  //       setRowLoading((prev) => ({ ...prev, [planId]: true }));
  //       await axios.put(updateUrl, payload);

  //       // Only refresh once for mass operations; callers can pass skipRefresh=true
  //       // if (!skipRefresh) {
  //       //   // Prefer refreshing the specific project to minimize data churn
  //       //   await refreshPlans(payload.projId);
  //       // }

  //       // toast.success("Status updated successfully.", {
  //       //   toastId: "plan-status-updated",
  //       // });
  //     } catch (err) {
  //       setPlans(prevPlans);
  //       toast.error(
  //         "Error updating plan: " +
  //           (err.response?.data?.message || err.message),
  //         { toastId: "checkbox-error" },
  //       );
  //     } finally {
  //       setRowLoading((prev) => ({ ...prev, [planId]: false }));
  //     }
  //   }
  // };

  const handleCheckboxChange = async (idx, field,isMassAction = false) => {
    const prevPlans = [...plans];
    const clickedPlan = plans[idx];

    // 1. Determine target plans (Multi-select support)
    let targetPlans = [];
    let targetIndices = [];

    if (!isMassAction && selectedRows.has(clickedPlan?.plId)) {
      plans.forEach((p, i) => {
        if (selectedRows.has(p.plId)) {
          targetPlans.push(p);
          targetIndices.push(i);
        }
      });
    } else {
      targetPlans = [clickedPlan];
      targetIndices = [idx];
    }

    // Defensive: filter out any undefined entries that may come from stale selection
    targetPlans = targetPlans.filter(Boolean);
    if (targetPlans.length === 0) {
      toast.error("No valid plans found for the selected rows.", {
        toastId: "checkbox-error",
      });
      return;
    }

    // 2. Validation
    for (const plan of targetPlans) {
      if (!plan.plType || !plan.version) {
        toast.error(`Required: Plan Type and Version for ${plan.projId}.`, {
          toastId: "checkbox-error",
        });
        return;
      }
      if (field === "isApproved" && !plan.isCompleted) {
        toast.error("Submit required before Approval", {
          toastId: "checkbox-error",
        });
        return;
      }
      if (field === "finalVersion" && !plan.isApproved) {
        toast.error("Approval required before Concluding", {
          toastId: "checkbox-error",
        });
        return;
      }
    }

    // Keep track of the updated version of the selected plan for runtime UI sync
    let plansAfterUpdate = null;

    // 3. Update Local State (Runtime UI Update)
    setPlans((currentPlans) => {
      let newPlans = [...currentPlans];

      if (idx < 0 || idx >= newPlans.length) return currentPlans;
      const clickedPlan = newPlans[idx];
      // const targetIndices = selectedRows.has(clickedPlan?.plId)
      //   ? newPlans
      //       .map((p, i) => (selectedRows.has(p.plId) ? i : null))
      //       .filter((i) => i !== null)
      //   : [idx];
      const targetIndices = (!isMassAction && selectedRows.has(clickedPlan?.plId))
      ? newPlans
          .map((p, i) => (selectedRows.has(p.plId) ? i : null))
          .filter((i) => i !== null)
      : [idx];

      targetIndices.forEach((targetIdx) => {
        const current = newPlans[targetIdx];
        let updated = { ...current, [field]: !current[field] };

        if (field === "isCompleted") {
          updated.status = updated.isCompleted ? "Submitted" : "In Progress";
          if (!updated.isCompleted) {
            updated.isApproved = false;
            updated.finalVersion = false;
          }
        } else if (field === "isApproved") {
          updated.status = updated.isApproved ? "Approved" : "Submitted";
          if (!updated.isApproved) updated.finalVersion = false;
        } else if (field === "finalVersion") {
          updated.status = updated.finalVersion ? "Concluded" : "Approved";
        }

        newPlans[targetIdx] = updated;
      });

      plansAfterUpdate = newPlans;
      return newPlans;
    });

    // 5. API Calls
    try {
      setIsActionLoading(true)
      const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;

      const updateTasks = targetPlans.map((plan) => {
        // Re-calculate the logic for the payload
        let v = { ...plan };
        v[field] = !plan[field];

        if (field === "isCompleted") {
          v.status = v.isCompleted ? "Submitted" : "In Progress";
          if (!v.isCompleted) {
            v.isApproved = false;
            v.finalVersion = false;
          }
        } else if (field === "isApproved") {
          v.status = v.isApproved ? "Approved" : "Submitted";
          if (!v.isApproved) v.finalVersion = false;
        } else if (field === "finalVersion") {
          v.status = v.finalVersion ? "Concluded" : "Approved";
        }

        const payload = {
          plId: plan.plId,
          projId: v.projId,
          plType: v.plType,
          versionCode: v.versionCode,
          finalVersion: v.finalVersion,
          isCompleted: v.isCompleted,
          isApproved: v.isApproved,
          status: v.status,
          approvedBy: v.approvedBy,
          templateId: v.templateId,
        };

        setRowLoading?.((prev) => ({ ...prev, [plan.plId]: true }));
        return axios.put(updateUrl, payload);
      });

      await Promise.all(updateTasks);
      // await fetchAllPlans();
      if (!isMassAction) {
       await fetchAllPlans(); // Use your existing fetch function
    }
    // toast.success("Updated Sucessfully!!")
      
    } catch (err) {
      setPlans(prevPlans); // Rollback
      // Also rollback Detail Panel
      if (selectedPlan && typeof onPlanSelect === "function")
        onPlanSelect(selectedPlan);

        // toast.error(
        //   "Error updating plans: " + (err.response?.data?.message || err.message),
        // );
    } finally {
      // targetPlans.forEach((p) =>
      //   setRowLoading?.((prev) => ({ ...prev, [p.plId]: false })),
      // );
      if (!isMassAction) setIsActionLoading(false);
      setIsActionLoading(false);
    }
  };

 
  const handleSaveVersionCodeClick = async () => {
    const safePlans = Array.isArray(plans) ? plans : [];

    // 1. Identify all target plans (Multi-select or Single-select)
    let targetPlans = [];
    if (selectedRows && selectedRows.size > 0) {
      targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
    } else if (selectedPlan && selectedPlan.plId) {
      targetPlans = [selectedPlan];
    }

    if (targetPlans.length === 0) {
      toast.error("No plans selected to update version code.");
      return;
    }

    const newValue = versionCodeInput;
    const prevPlans = [...plans];

    try {
      setIsActionLoading(true);

      // 2. Prepare the API payloads and tasks
      const updateTasks = targetPlans.map((plan) => {
        // Create the updated object for the API
        const updatedObj = {
          ...plan,
          versionCode: newValue,
          // Ensure other critical fields are preserved for the backend
          projId: plan.projId || fullProjectId.current,
        };

        const updateUrl = `${backendUrl}/Project/UpdateProjectPlan`;
        return axios.put(updateUrl, updatedObj);
      });

      // 3. Update Local State immediately for "Runtime" UI feel
      setPlans((currentPlans) => {
        const updatedPlans = currentPlans.map((p) => {
          if (targetPlans.some((tp) => tp.plId === p.plId)) {
            return { ...p, versionCode: newValue };
          }
          return p;
        });

        // 4. Update Detail Panel (onPlanSelect) if current selected plan is affected
        if (
          selectedPlan &&
          targetPlans.some((tp) => tp.plId === selectedPlan.plId)
        ) {
          const updatedSelected = updatedPlans.find(
            (p) => p.plId === selectedPlan.plId,
          );
          if (updatedSelected && typeof onPlanSelect === "function") {
            onPlanSelect(updatedSelected);
          }
        }

        return updatedPlans;
      });

      // 5. Execute all API calls in parallel
      await Promise.all(updateTasks);

      // toast.success("Version Type updated successfully");

      // 6. Refresh background data once
      // if (targetPlans.length > 0) {
      //   await refreshPlans(targetPlans[0].projId || fullProjectId.current);
      // }

      setEditingVersionCodeIdx(null);
    } catch (err) {
      // Rollback state on error
      setPlans(prevPlans);
      if (selectedPlan && typeof onPlanSelect === "function") {
        onPlanSelect(selectedPlan);
      }
      toast.error(
        "Error updating version codes: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // const handleSaveVersionCodeClick = () => {
  //   const safePlans = Array.isArray(plans) ? plans : [];

  //   // find all target plans
  //   let targetPlans = [];

  //   if (selectedRows && selectedRows.size > 0) {
  //     targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
  //   } else if (selectedPlan && selectedPlan.plId) {
  //     targetPlans = [selectedPlan];
  //   }

  //   if (targetPlans.length === 0) {
  //     toast.error("No plans selected to update version code.");
  //     return;
  //   }

  //   targetPlans.forEach((plan) => {
  //     if (plan.plId) {
  //       handleVersionCodeChange(plan.plId, versionCodeInput);
  //     }
  //   });
  // };

  const handleActionSelect = async (idx, action) => {
    const plan = plans[idx];
    if (!plan || action === "None") return;

    try {
      setIsActionLoading(true);

      // 1) Delete
      if (action === "Delete") {
        if (!plan.plId || Number(plan.plId) <= 0) {
          toast.error("Cannot delete: Invalid plan ID.");
          return;
        }

        const confirmed = window.confirm(
          "Are you sure you want to delete this plan?",
        );
        if (!confirmed) return;

        toast.info("Deleting plan...");

        try {
          await axios.delete(
            `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`,
          );
          toast.success("Plan deleted successfully!");
        } catch (err) {
          if (err.response?.status === 404) {
            toast.error(
              "Plan not found on server. It may have already been deleted.",
            );
          } else {
            toast.error(
              "Error deleting plan: " +
                (err.response?.data?.message || err.message),
            );
          }
          return;
        }

        // remove from local state
        setPlans((prev) => prev.filter((_, i) => i !== idx));

        // refresh project-specific plans to ensure server state sync
        // await refreshPlans(plan.projId);

        // clear selection if this was selected
        if (
          selectedPlan?.plId === plan.plId &&
          typeof onPlanSelect === "function"
        ) {
          onPlanSelect(null);
        }

        return;
      }

      // 2) Create new plan (Budget / Blank Budget / EAC / NB BUD)
      if (
        action === "Create Budget" ||
        action === "Create Blank Budget" ||
        action === "Create EAC" ||
        action === "Create NB BUD"
      ) {
        const actionProjId = fullProjectId?.current || plan.projId || "";

        const newPlType =
          action === "Create NB BUD"
            ? "NBBUD"
            : action === "Create Budget" || action === "Create Blank Budget"
              ? "BUD"
              : "EAC";

        const payloadTemplate = {
          projId: selectedPlan?.projId || plan.projId || actionProjId || "",
          plId: plan.plId || 0,
          plType: newPlType,
          source: plan.source || "",
          type:
            typeof isChildProjectId === "function" &&
            isChildProjectId(actionProjId)
              ? "SYSTEM"
              : plan.type || "",
          version: plan.version || 0,
          versionCode: plan.versionCode || "",
          finalVersion: false,
          isCompleted: false,
          isApproved: false,
          status: "In Progress",
          createdBy: plan.createdBy || "User",
          modifiedBy: plan.modifiedBy || "User",
          approvedBy: "",
          templateId: plan.templateId || 1,
          projStartDt: plan.projStartDt || null,
            projEndDt: plan.projEndDt || null
   
          // fiscalYear,
        };

        toast.info(
          `Creating ${
            action === "Create Budget"
              ? "Budget"
              : action === "Create Blank Budget"
                ? "Blank Budget"
                : action === "Create NB BUD"
                  ? "NB BUD"
                  : "EAC"
          }...`,
        );

        const response = await axios.post(
          `${backendUrl}/Project/AddProjectPlan?type=${
            action === "Create Blank Budget" ? "blank" : "actual"
          }`,
          payloadTemplate,
        );

        const rawCreatedPlan = response.data || {};

        // normalize created plan so projId matches what the grid uses
        const normalizedPlan = {
          ...plan,
          ...rawCreatedPlan,
          plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
          projId:
            rawCreatedPlan.fullProjectId ||
            rawCreatedPlan.projId ||
            plan.projId ||
            actionProjId,
          projName: rawCreatedPlan.projName || plan.projName || "",
          plType:
            rawCreatedPlan.plType === "Budget"
              ? "BUD"
              : rawCreatedPlan.plType === "EAC"
                ? "EAC"
                : newPlType,
          version: Number(rawCreatedPlan.version) || 0,
          status: "In Progress",
          finalVersion: false,
          isCompleted: false,
          isApproved: false,
          projStartDt: rawCreatedPlan.projStartDt || plan.projStartDt || "",
          projEndDt: rawCreatedPlan.projEndDt || plan.projEndDt || "",
        };

        if (!normalizedPlan.projId || !normalizedPlan.plType) {
          toast.error(
            "Plan returned from backend is missing required fields. Please reload and try again.",
          );
          return;
        }

        // use the normalized projId for refresh so the new plan appears in the grid
        // const effectiveProjIdForRefresh =
        //   fullProjectId?.current || normalizedPlan.projId || projectId || "";

        // const newPlans = await refreshPlans(effectiveProjIdForRefresh);

        // pick the plan we just created from refreshed list
        // if (newPlans && newPlans.length > 0) {
        //   const planToSelect =
        //     newPlans.find(
        //       (p) =>
        //         p.plId === normalizedPlan.plId &&
        //         p.projId === normalizedPlan.projId &&
        //         p.plType === normalizedPlan.plType,
        //     ) || normalizedPlan;

        //   // select in grid and notify parent
        //   handleRowClick(planToSelect);
        //   if (typeof onPlanCreated === "function") {
        //     onPlanCreated(planToSelect); // parent can set projectId = planToSelect.projId
        //   }
        // }

        toast.success(
          `${
            action === "Create Budget"
              ? "Budget"
              : action === "Create Blank Budget"
                ? "Blank Budget"
                : action === "Create NB BUD"
                  ? "NB BUD"
                  : "EAC"
          } created successfully!`,
        );
        return;
      }

      // 3) Other actions not implemented
      toast.info(`Action "${action}" selected (API call not implemented)`);
    } catch (err) {
      toast.error(
        "Error performing action: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const getProjectDotLevel = (projId) => {
    if (!projId || typeof projId !== "string") return 0;
    const dotCount = (projId.match(/\./g) || []).length;
    return dotCount;
  };

  const getActionOptions = (plan) => {
    let options = ["None"];

    if (!plan?.projId) {
      return options;
    }

    let lockDotLevel = null;
    const masterId = plan.projId.split(".")[0];
    const currentDotLevel = getProjectDotLevel(plan.projId);
    // --- 1. NBBUD SPECIFIC LOGIC ---
    // --- 1. NBBUD SPECIFIC LOGIC (No Level Locking) ---
    if (plan.plType === "NBBUD") {
      // We ignore lockNBLevel here as per your request not to use level logic for NBBUD
      if (plan.status === "In Progress") {
        return ["None", "Delete"];
      }
      if (plan.status === "Approved" || plan.status === "Concluded") {
        return ["None", "Create NB BUD"];
      }
      return options;
    }

    for (const p of plans) {
      if (p.plType === "BUD" && p.projId?.startsWith(masterId)) {
        lockDotLevel = getProjectDotLevel(p.projId);
        break;
      }
    }

    if (!plan.plType && !plan.version) {
      const currentDotLevel = getProjectDotLevel(selectedPlan.projId);
      const creationOptions = [
        "None",
        "Create Budget",
        "Create Blank Budget",
        // "Create EAC",
      ];

      if (lockDotLevel === null) {
        return creationOptions;
      }

      if (currentDotLevel === lockDotLevel) {
        return creationOptions;
      }

      return options;
    }

    if (plan.status === "In Progress") options = ["None", "Delete"];
    else if (plan.status === "Submitted")
      // options = ["None", "Create Budget", "Create Blank Budget"];
      options = ["None"];
    else if (plan.status === "Approved")
      options = [
        "None",
        "Create Budget",
        "Create Blank Budget",
        "Create EAC",
        // "Delete",
      ];
    else if (plan.status === "Concluded")
      options = ["None", "Create Budget", "Create Blank Budget", "Create EAC"];

    return options;
  };

  const getButtonAvailability = (plan, action) => {
    const options = getActionOptions(plan);
    return options.includes(action);
  };

  const isToggleAllowedForPlan = (plan, field) => {
    if (!plan || !plan.plType || !plan.version) return false;
    if (field === "isCompleted") return !plan.isApproved;
    if (field === "isApproved") return !!plan.isCompleted;
    if (field === "finalVersion") {
      if (!plan.isApproved) return false;
      // if it's already final, allow un-conclude
      if (plan.finalVersion) return true;
      // disallow setting final if another final exists for same projId and plType
      const anotherFinal = safePlans.find(
        (p) =>
          p.plId !== plan.plId &&
          p.plType === plan.plType &&
          p.projId === plan.projId &&
          p.finalVersion,
      );
      return !anotherFinal;
    }
    return false;
  };

  // Determine aggregate toggle state for mass-selected rows
  const getMassToggleProps = (field) => {
    if (selectedRows.size === 0)
      return { disabled: true, label: "", title: "No rows selected" };
    const selected = safePlans.filter((p) => selectedRows.has(p.plId));
    if (!selected || selected.length === 0)
      return { disabled: true, label: "", title: "No valid plans selected" };

    // If any selected is concluded while others are not, disable all toggles
    const statuses = selected.map((p) => (p.status || "").toLowerCase());
    const allConcluded = statuses.every((s) => s === "concluded");
    if (
      statuses.includes("concluded") &&
      !statuses.every((s) => s === "concluded")
    ) {
      return {
        disabled: true,
        label: "",
        title: "Mixed statuses (contains Concluded) - action disabled",
      };
    }
    // NEW: Disable if any selected plan is 'Transferred'
    if (statuses.includes("transferred")) {
      return {
        disabled: true,
        label: "",
        title: "Transferred plans cannot be modified",
      };
    }

    if (field === "isCompleted") {
      if (allConcluded)
        return {
          disabled: true,
          label: "Unsubmit",
          title: "Cannot unsubmit a Concluded plan",
        };
      const allTrue = selected.every((p) => !!p.isCompleted);
      const allFalse = selected.every((p) => !p.isCompleted);
      if (!allTrue && !allFalse)
        return { disabled: true, label: "", title: "Mixed submission states" };
      const allowed = selected.every((p) =>
        isToggleAllowedForPlan(p, "isCompleted"),
      );
      return {
        disabled: !allowed,
        label: allTrue ? "Unsubmit" : "Submit",
        title: allTrue ? "Unsubmit selected" : "Submit selected",
      };
    }

    if (field === "isApproved") {
      if (allConcluded)
        return {
          disabled: true,
          label: "Unapprove",
          title: "Cannot unapprove a Concluded plan",
        };
      const allTrue = selected.every((p) => !!p.isApproved);
      const allFalse = selected.every((p) => !p.isApproved);
      if (!allTrue && !allFalse)
        return { disabled: true, label: "", title: "Mixed approval states" };
      const allowed = selected.every((p) =>
        isToggleAllowedForPlan(p, "isApproved"),
      );
      return {
        disabled: !allowed,
        label: allTrue ? "Unapprove" : "Approve",
        title: allTrue ? "Unapprove selected" : "Approve selected",
      };
    }

    if (field === "finalVersion") {
      const allTrue = selected.every((p) => !!p.finalVersion);
      const allFalse = selected.every((p) => !p.finalVersion);
      if (!allTrue && !allFalse)
        return {
          disabled: true,
          label: "",
          title: "Mixed final/conclude states",
        };
      const allowed = selected.every((p) =>
        isToggleAllowedForPlan(p, "finalVersion"),
      );
      return {
        disabled: !allowed,
        label: allTrue ? "Unconclude" : "Conclude",
        title: allTrue ? "Unconclude selected" : "Conclude selected",
      };
    }

    return { disabled: true, label: "", title: "Unsupported field" };
  };

  const handleTopButtonToggle = async (field) => {
    if (!selectedPlan) {
      toast.error(`No plan selected to update ${field}.`, {
        toastId: "no-plan-selected",
      });
      return;
    }
    const idx = (plans || []).findIndex((p) => p.plId === selectedPlan.plId);
    if (idx === -1) {
      toast.error(`Selected plan not found.`, { toastId: "plan-not-found" });
      return;
    }
    setIsActionLoading(true);
    await handleCheckboxChange(idx, field);
    setIsActionLoading(false);
    await getAllData();
  };

  const handleCalc = async () => {
    if (!selectedPlan) {
      toast.error("No plan selected for calculation.", {
        toastId: "no-plan-selected",
      });
      return;
    }
    if (!selectedPlan.plId || !selectedPlan.templateId) {
      toast.error(
        "Cannot calculate: Missing required parameters (planID or templateId).",
        {
          toastId: "missing-params",
        },
      );
      return;
    }
    setIsActionLoading(true);
    try {
      const response = await axios.get(
        `${backendUrl}/Forecast/CalculateRevenueCost?planID=${selectedPlan.plId}&templateId=${selectedPlan.templateId}&type=actual`,
      );
      const message =
        typeof response.data === "string"
          ? response.data
          : response.data?.message || "Revenue Calculation successful!";
      toast.success(message);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Error during calculation.";
      toast.error(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Mass action helpers - single implementation for both single and multi-plan actions
  // `targets` is optional array of plan objects to operate on; if omitted, uses selectedRows
  const handleMassAction = async (action, targets = null) => {
    const selected =
      Array.isArray(targets) && targets.length > 0
        ? targets
        : safePlans.filter((p) => selectedRows.has(p.plId));

    if (!selected || selected.length === 0) {
      toast.error("No plans selected for mass action.", {
        toastId: "no-selected-mass",
      });
      return;
    }

    
    try {
      setIsActionLoading(true);
      // DELETE
      if (action === "Delete") {
        const results = [];
        for (const plan of selected) {
          if (!getButtonAvailability(plan, "Delete")) {
            results.push({ plan, ok: false, error: new Error("Not allowed") });
            continue;
          }
          try {
            await axios.delete(
              `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`,
            );
            results.push({ plan, ok: true });
          } catch (err) {
            results.push({ plan, ok: false, error: err });
          }
        }
        const failed = results.filter((r) => !r.ok);
        setPlans((prev) =>
          prev.filter((p) => !selected.some((s) => s.plId === p.plId)),
        );
        setSelectedRows(new Set());
        if (typeof onPlanSelect === "function") onPlanSelect(null);
        if (failed.length > 0) {
          toast.error(`${failed.length} plan(s) failed to delete.`);
        } else {
          toast.success("Selected plans deleted successfully.");
        }
        // refresh to ensure any project-level derived states are updated
        // await refreshPlans();
        return;
      }

      // CREATE variations
      if (
        action === "Create Budget" ||
        action === "Create Blank Budget" ||
        action === "Create EAC" ||
        action === "Create NB BUD"
      ) {
        const results = [];
        for (const plan of selected) {
          if (!getButtonAvailability(plan, action)) {
            results.push({ plan, ok: false, error: new Error("Not allowed") });
            continue;
          }

          const actionProjId =
            fullProjectId.current || plan.projId || projectId || "";
          const payloadTemplate = {
            projId: plan.projId || actionProjId || "",
            plId: plan.plId || 0,
            plType:
              action === "Create NB BUD"
                ? "NBBUD"
                : action === "Create Budget" || action === "Create Blank Budget"
                  ? "BUD"
                  : "EAC",
            source: plan.source || "",
            type:
              typeof isChildProjectId === "function" &&
              isChildProjectId(actionProjId)
                ? "SYSTEM"
                : plan.type || "",
            version: plan.version || 0,
            versionCode: plan.versionCode || "",
            finalVersion: false,
            isCompleted: false,
            isApproved: false,
            status: "In Progress",
            createdBy: plan.createdBy || "User",
            modifiedBy: plan.modifiedBy || "User",
            approvedBy: "",
            templateId: plan.templateId || 1,
              projStartDt: plan.projStartDt || null,
            projEndDt: plan.projEndDt || null 
            // fiscalYear: fiscalYear,
          };

          try {
            const response = await axios.post(
              `${backendUrl}/Project/AddProjectPlan?type=${action === "Create Blank Budget" ? "blank" : "actual"}`,
              payloadTemplate,
            );
            results.push({ plan, ok: true, data: response.data });
          } catch (err) {
            results.push({ plan, ok: false, error: err });
          }
        }

        // Refresh to pick up newly created plans
        // await refreshPlans();
        setSelectedRows(new Set());
        if (typeof onPlanSelect === "function") onPlanSelect(null);

        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          toast.error(`${failed.length} plan(s) failed during creation.`);
        } else {
          toast.success("Plans created successfully!");
        }

        // If single-target call and success, try to select created plan in UI
        if (
          Array.isArray(targets) &&
          targets.length === 1 &&
          results.length === 1 &&
          results[0].ok
        ) {
          // try to select the plan we just created
          const rawCreated = results[0].data || {};
          const normalizedPlan = {
            ...selected[0],
            ...rawCreated,
            plId: rawCreated.plId || rawCreated.id || selected[0].plId || 0,
            projId:
              rawCreated.fullProjectId ||
              rawCreated.projId ||
              rawCreated.projectId ||
              selected[0].projId ||
              "",
            projName: rawCreated.projName || selected[0].projName || "",
            plType:
              rawCreated.plType === "Budget"
                ? "BUD"
                : rawCreated.plType === "EAC"
                  ? "EAC"
                  : selected[0].plType,
            version: Number(rawCreated.version) || selected[0].version || 0,
          };
          // find in refreshed plans
          // const newPlans = await refreshPlans(
          //   normalizedPlan.projId || normalizedPlan.projId,
          // );
          // if (newPlans && newPlans.length > 0) {
          //   const planToSelect =
          //     newPlans.find(
          //       (p) =>
          //         p.plId === normalizedPlan.plId &&
          //         p.projId === normalizedPlan.projId &&
          //         p.plType === normalizedPlan.plType,
          //     ) || normalizedPlan;
          //   handleRowClick(planToSelect);
          //   if (typeof onPlanCreated === "function")
          //     onPlanCreated(planToSelect);
          // }
        }

        return;
      }

      toast.info(`Mass action "${action}" is not implemented yet.`);
    } catch (err) {
      toast.error(`Error performing mass action: ${err.message || err}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Add this inside MassUtilityProject component
  const isHeaderDisabled = useMemo(() => {
    const safePlans = Array.isArray(plans) ? plans : [];

    // 1. If rows are selected via checkboxes
    if (selectedRows && selectedRows.size > 0) {
      const targetPlans = safePlans.filter((p) => selectedRows.has(p.plId));
      // Disable if ANY selected plan is NOT "In Progress"
      return targetPlans.some((p) => p.status !== "In Progress");
    }

    // 2. Fallback to the single clicked row (selectedPlan)
    if (selectedPlan) {
      return selectedPlan.status !== "In Progress";
    }

    // 3. Disable if nothing is selected
    return true;
  }, [selectedRows, selectedPlan, plans]);

  const handleMassDelete = async () => {
    if (selectedRows.size === 0) {
      toast.error("No plans selected to delete.", {
        toastId: "no-selected-delete",
      });
      return;
    }
    const selected = safePlans.filter((p) => selectedRows.has(p.plId));
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selected.length} selected plan(s)?`,
    );
    if (!confirmed) return;

    setIsActionLoading(true);
    const results = [];
    try {
      for (const plan of selected) {
        if (!getButtonAvailability(plan, "Delete")) {
          results.push({ plan, ok: false, error: new Error("Not allowed") });
          continue;
        }
        try {
          await axios.delete(
            `${backendUrl}/Project/DeleteProjectPlan/${plan.plId}`,
          );
          results.push({ plan, ok: true });
        } catch (err) {
          results.push({ plan, ok: false, error: err });
        }
      }

      const failed = results.filter((r) => !r.ok);
      setPlans((prev) => prev.filter((p) => !selectedRows.has(p.plId)));
      setSelectedRows(new Set());
      if (typeof onPlanSelect === "function") onPlanSelect(null);
      if (failed.length > 0) {
        toast.error(`${failed.length} plan(s) failed to delete.`);
      } else {
        toast.success("Selected plans deleted successfully.");
      }
      // refresh to pick up any server-side side-effects
      // await refreshPlans();
    } catch (err) {
      toast.error("Error deleting selected plans: " + (err.message || err));
    } finally {
      setIsActionLoading(false);
    }
  };

  // const handleMassToggle = async (field) => {
  //   if (selectedRows.size === 0) return handleTopButtonToggle(field);
  //   // setIsActionLoading(true);
  //   try {
  //     const selected = safePlans.filter((p) => selectedRows.has(p.plId));
  //     for (const plan of selected) {
  //       const idx = (plans || []).findIndex((p) => p.plId === plan.plId);
  //       if (idx !== -1) await handleCheckboxChange(idx, field, true);
  //     }
  //     // Refresh once after all updates to ensure consistent server-side state
  //     //   await refreshPlans();
  //     setSelectedRows(new Set());
  //     if (typeof onPlanSelect === "function") onPlanSelect(null);
  //     await getAllData()
  //   } catch (err) {
  //     toast.error("Error performing mass toggle: " + (err.message || err));
  //   } finally {
  //     setIsActionLoading(false);
  //   }
  // };
  
    const handleMassToggle = async (field) => {
    if (selectedRows.size === 0) return handleTopButtonToggle(field);
    // setIsActionLoading(true);
    try {
      const selected = safePlans.filter((p) => selectedRows.has(p.plId));
      for (const plan of selected) {
        const idx = (plans || []).findIndex((p) => p.plId === plan.plId);
        if (idx !== -1) await handleCheckboxChange(idx, field, true);
      }
      // Refresh once after all updates to ensure consistent server-side state
      //   await refreshPlans();
      setSelectedRows(new Set());
      if (typeof onPlanSelect === "function") onPlanSelect(null);
      await getAllData()
      toast.success("Updated Sucessfully!!")
    } catch (err) {
      toast.error("Error performing mass toggle: " + (err.message || err));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMassCalc = async () => {
    if (selectedRows.size === 0) return handleCalc();
    setIsActionLoading(true);
    try {
      const selected = safePlans.filter((p) => selectedRows.has(p.plId));
      const results = [];
      for (const plan of selected) {
        if (!plan.plId || !plan.templateId) {
          results.push({ plan, ok: false, error: new Error("Missing params") });
          continue;
        }
        try {
          const response = await axios.get(
            `${backendUrl}/Forecast/CalculateRevenueCost?planID=${plan.plId}&templateId=${plan.templateId}&type=actual`,
          );
          results.push({ plan, ok: true, data: response.data });
        } catch (err) {
          results.push({ plan, ok: false, error: err });
        }
      }

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length} calculation(s) failed.`);
      } else {
        toast.success("Calculation(s) completed successfully.");
      }
      if (typeof onPlanSelect === "function") onPlanSelect(null);
    } catch (err) {
      toast.error("Error during mass calculation: " + (err.message || err));
    } finally {
      setIsActionLoading(false);
    }
  };

  //   const getTopButtonDisabled = (field) => {
  //     const currentPlan = getCurrentPlan();
  //     if (!currentPlan || !currentPlan.plType || !currentPlan.version)
  //       return true;
  //     if (field === "isCompleted") return !!currentPlan.isApproved;
  //     if (field === "isApproved") return !currentPlan.isCompleted;
  //     if (field === "finalVersion") {
  //       const anotherFinalVersionIdx = plans.findIndex(
  //         (p) =>
  //           p.plId !== currentPlan.plId &&
  //           p.plType === currentPlan.plType &&
  //           p.projId === currentPlan.projId &&
  //           p.finalVersion
  //       );
  //       if (anotherFinalVersionIdx !== -1) return true;
  //       return !currentPlan.isApproved;
  //     }
  //     return false;
  //   };

  // Returns the currently selected plan from local state, or null

  const getCurrentPlan = () => {
    if (!selectedPlan) return null;
    return (
      safePlans.find(
        (p) => p.plId === selectedPlan.plId && p.projId === selectedPlan.projId,
      ) || selectedPlan
    );
  };

  const getCalcButtonDisabled = () => {
    return !selectedPlan || !selectedPlan.plId || !selectedPlan.templateId;
  };

  const getTopButtonDisabled = (field) => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan || !currentPlan.plType || !currentPlan.version)
      return true;

    const status = (currentPlan.status || "").toLowerCase();
    const isConcluded = status === "concluded";

    // once concluded, no more submit/approve/conclude
    if (isConcluded) return true;

    if (field === "isCompleted") return !!currentPlan.isApproved;
    if (field === "isApproved") return !currentPlan.isCompleted;
    if (field === "finalVersion") {
      const anotherFinalVersionIdx = (plans || []).findIndex(
        (p) =>
          p.plId !== currentPlan.plId &&
          p.plType === currentPlan.plType &&
          p.projId === currentPlan.projId &&
          p.finalVersion,
      );
      if (anotherFinalVersionIdx !== -1) return true;
      return !currentPlan.isApproved;
    }

    return false;
  };

  const isAnyActionPerformed = (plansList, selectedProjId) => {
    if (!selectedProjId) return false;
    const selectedLevel = getProjectDotLevel(selectedProjId);
    return plansList.some(
      (plan) => !!plan.plType && plan.projId === selectedProjId,
    );
  };

  const getMasterProjects = (plansList) => {
    return plansList.filter((plan) => {
      const projId = plan.projId?.trim();
      if (!projId) return false;
      return !projId.includes(".");
    });
  };

  const getMasterAndRelatedProjects = (plansList, clickedProjId) => {
    if (!clickedProjId)
      return { master: null, related: [], sameLevelBud: false };

    const parts = clickedProjId.split(".");
    const masterId = parts[0];
    const selectedLevel = parts.length;

    const filtered = plansList.filter(
      (p) => p.projId?.startsWith(masterId) && p.plType === "BUD",
    );

    const seen = new Set();
    const related = filtered
      .filter((p) => {
        if (seen.has(p.projId)) return false;
        seen.add(p.projId);
        return true;
      })
      .map((p) => ({
        ...p,
        level: p.projId.split(".").length,
      }));

    if (related.length === 0) {
      return { master: masterId, related, selectedLevel, sameLevelBud: true };
    }

    const sameLevelBud = related.some((r) => r.level === selectedLevel);

    return { master: masterId, related, selectedLevel, sameLevelBud };
  };

  const fetchAllPlans = async () => {
    setIsActionLoading(true);
    // setSelectedProjectId(new Set());
    setSelectedRows(new Set());
    try {
      // Note: We call the base GetProjectPlans for the mass utility view
      // const response = await axios.get(`${backendUrl}/Project/GetAllPlans`);
      const response = await axios.get(
        `${backendUrl}/Project/MassUtilityGetAllPlans?UserId=${userId}&Role=${role}`,
        {
          params: {
            search: searchQuery || "", // Maps to backend 'search'
            type: typeFilter === "All" ? "" : typeFilter, // Maps to backend 'type' (BUD/EAC)
            status: statusFilter === "All" ? "" : statusFilter, // Maps to backend 'status'
            active:
              versionFilter === "All"
                ? ""
                : versionFilter === "Active"
                  ? "Y"
                  : "N",
          },
        },
      );
      if (response.data) {
        const transformed = response.data.map((p) => ({
          ...p,
          plId: p.plId || p.id,
          // Ensure status mapping consistency for the filter
          status: (p.status || "In Progress")
            .replace("Working", "In Progress")
            .replace("Completed", "Submitted"),
        }));
        setPlans(transformed);
        //   toast.success("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project plans.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Auto-fetch plans when filters change or on mount
  // useEffect(() => {
  //   fetchAllPlans();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchQuery, typeFilter, statusFilter, versionFilter]);

  // 2. Use the same function for initial load
  // useEffect(() => {
  //   fetchAllPlans();
  // }, []);
  //   useEffect(() => {
  //     const fetchAllPlans = async () => {
  //       setLoading(true);
  //       try {
  //         const response = await axios.get(`${backendUrl}/Project/GetAllPlans`);
  //         if (response.data) {
  //           const transformed = response.data.map(p => ({
  //             ...p,
  //             plId: p.plId || p.id
  //           }));
  //           setPlans(transformed);
  //         }
  //       } catch (err) {
  //         toast.error("Failed to load project plans.");
  //       } finally {
  //         setLoading(false);
  //       }
  //     };
  //     fetchAllPlans();
  //   }, []);

  // Memoized Filtered Plans (includes new version filter)

  const filteredPlans = useMemo(() => {
    const safePlans = Array.isArray(plans) ? plans : [];

    const latestMap = {};
    if (versionFilter === "Latest") {
      for (const p of safePlans) {
        const key = `${p.projId}::${p.plType}`;
        const ver = Number(p.version) || 0;
        if (!latestMap[key] || ver > latestMap[key]) latestMap[key] = ver;
      }
    }

    return safePlans.filter((plan) => {
      const matchesSearch =
        !searchQuery ||
        plan.projId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.projName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "All" || plan.plType === typeFilter;
      const matchesStatus =
        statusFilter === "All" || plan.status === statusFilter;

      let matchesVersion = true;
      if (versionFilter === "Final") matchesVersion = !!plan.finalVersion;
      else if (versionFilter === "Latest") {
        const key = `${plan.projId}::${plan.plType}`;
        const ver = Number(plan.version) || 0;
        matchesVersion = latestMap[key] === ver;
      }

      return matchesSearch && matchesType && matchesStatus && matchesVersion;
    });
  }, [plans, searchQuery, typeFilter, statusFilter, versionFilter]);

  const getRowKey = (p) =>
    `${p.projId || ""}::${p.plType || ""}::${p.version || ""}::${p.versionCode || ""}`;

  // FIXED: Select All Logic

  const safeFiltered = Array.isArray(filteredPlans) ? filteredPlans : [];

  // Ensure we always operate on an array to avoid runtime errors when `plans` is null/undefined
  // const safePlans = Array.isArray(plans) ? plans : [];
  const isAllSelected =
    safeFiltered.length > 0 &&
    safeFiltered.every((p) => selectedRows.has(p.plId));

  const toggleSelectAll = () => {
    const newSelection = new Set(selectedRows);
    // const newProjSelection = new Set(selectedRows);
    if (isAllSelected) {
      safeFiltered.forEach((p) => newSelection.delete(p.plId));
      // safeFiltered.forEach((p) => newProjSelection.delete(p.projId));
    } else {
      safeFiltered.forEach((p) => newSelection.add(p.plId));
      // safeFiltered.forEach((p) => newProjSelection.add(p.projId));
    }
    setSelectedRows(newSelection);
    // setSelectedProjectId(newProjSelection);
    // Clear single plan selection when toggling multiple selections
    if (typeof onPlanSelect === "function") onPlanSelect(null);
  };

  // const toggleRowSelection = (plan) => {
  //   const newSelection = new Set(selectedRows);
  //   if (newSelection.has(plan.plId)) {
  //     newSelection.delete(plan.plId);
  //   } else {
  //     newSelection.add(plan.plId);
  //   }
  //   setSelectedRows(newSelection);
  //   if (typeof onPlanSelect === "function")
  //     onPlanSelect(newSelection.has(plan.plId) ? plan : null);
  // };
  // const toggleRowSelection = (plan) => {
  //   // Toggle plan selection
  //   const newPlanSelection = new Set(selectedRows);
  //   if (newPlanSelection.has(plan.plId)) {
  //     newPlanSelection.delete(plan.plId);
  //   } else {
  //     newPlanSelection.add(plan.plId);
  //   }
  //   setSelectedRows(newPlanSelection);

  //   // Add or remove project ID based on plan selection
  //   setSelectedProjectId((prev) => {
  //     const newSet = new Set(prev);
  //     if (newPlanSelection.has(plan.plId)) {
  //       // Plan was selected, add projId
  //       newSet.add(plan.projId);
  //     } else {
  //       // Plan was deselected, remove projId
  //       newSet.delete(plan.projId);
  //     }
  //     return newSet;
  //   });

  //   // Optional callback for plan
  //   if (typeof onPlanSelect === "function") {
  //     onPlanSelect(newPlanSelection.has(plan.plId) ? plan : null);
  //   }
  // };

  
  // const selectedProjectId = useMemo(() => {
  //   const projArr = [];

  //   console.log(plans)

  //   if(data){
  //     data?.map((plan) => {
  //     if (selectedRows.has(plan.plId)) {
  //       projArr.push(plan.projId);
  //     }
  //   });
  //   console.log(data)
  //   }

  //   console.log(projArr);
  //   return projArr;
  // }, [selectedRows, data]);

  // const hasDuplicateProjectIds = useMemo(() => {
  //   return new Set(selectedProjectId).size !== selectedProjectId.length;
  // }, [selectedProjectId]);

//   const selectionMeta = useMemo(() => {
//   // 1. Identify which projects already have a concluded plan in the data
//   const projectsWithFinalVersion = new Set(
//     data?.filter((plan) => plan.finalVersion).map((plan) => plan.projId)
//   );

//   const selectedProjectIds = [];
//   let selectionHasAlreadyConcluded = false;

//   // 2. Map through data to build selection info
//   data?.forEach((plan) => {
//     if (selectedRows.has(plan.plId)) {
//       selectedProjectIds.push(plan.projId);
//       // Track if any of our CURRENTLY SELECTED rows are already concluded
//       if (plan.finalVersion) selectionHasAlreadyConcluded = true;
//     }
//   });

//   // 3. Check for duplicates WITHIN the checkmarks (e.g., checking two different revisions of RP-1710)
//   const hasInternalDuplicates = new Set(selectedProjectIds).size !== selectedProjectIds.length;

//   // 4. Check if we are selecting a project that ALREADY has a concluded version 
//   // that is NOT part of our current selection.
//   const selectionConflictsWithDatabase = selectedProjectIds.some((id) => {
//     const isProjectAlreadyFinalized = projectsWithFinalVersion.has(id);
    
//     // If the project is finalized, but the row we selected IS that finalized row, 
//     // it's not a conflict (it's an "Unconclude" opportunity).
//     // If the project is finalized elsewhere, it's a conflict.
//     return isProjectAlreadyFinalized && !selectionHasAlreadyConcluded;
//   });

//   return {
//     hasInternalDuplicates,
//     selectionConflictsWithDatabase,
//     selectionHasAlreadyConcluded,
//     count: selectedRows.size,
//   };
// }, [selectedRows, data]);

const selectionMeta = useMemo(() => {
  // 1. Map through the data to analyze ONLY what the user has currently checked
  const selectedCompositeKeys = [];
  let selectionHasAlreadyConcluded = false;

  data?.forEach((plan) => {
    if (selectedRows.has(plan.plId)) {
      // Create a unique key for the Project + Plan Type combo
      selectedCompositeKeys.push(`${plan.projId}-${plan.plType}`);
      
      // Check if any row in the current selection is already marked as finalized
      if (plan.finalVersion) {
        selectionHasAlreadyConcluded = true;
      }
    }
  });

  // 2. INTERNAL DUPLICATE CHECK (The "Blocker")
  // If the size of the Set is smaller than the array, it means 
  // the user selected the same ProjID + PlanType twice (e.g., Revision A and Revision B)
  const hasInternalDuplicates = new Set(selectedCompositeKeys).size !== selectedCompositeKeys.length;

  // 3. DATABASE CONFLICT CHECK
  // We are explicitly NOT blocking based on what's in the database anymore,
  // as per your requirement to "not block for concluded" database states.
  const selectionConflictsWithDatabase = false; 

  return {
    hasInternalDuplicates,           // This will be TRUE if ProjID & PlanType match within selection
    selectionConflictsWithDatabase, // Now remains false/ignored
    selectionHasAlreadyConcluded,   // Tells you if the selection includes a concluded row
    count: selectedRows.size,
  };
}, [selectedRows, data]);




  const toggleRowSelection = (plan) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(plan.plId)) {
        newSet.delete(plan.plId);
      } else {
        newSet.add(plan.plId);
      }
      return newSet;
    });

    // Optional callback for your usage
    if (typeof onPlanSelect === "function") {
      onPlanSelect(selectedRows.has(plan.plId) ? null : plan);
    }
  };


  const resetFilters = () => {
    setSearchQuery("");
    setTypeFilter("All");
    setStatusFilter("All");
    setVersionFilter("All");
  };

  // console.log(selectedRows);
  // console.log(filteredPlans);

  const buttonDisable = (plans, selectedRows) => {
    let firstStatus;

    for (const plan of plans) {
      if (!selectedRows.has(plan.plId)) continue;

      if (firstStatus === undefined) {
        firstStatus = plan.status;
      } else if (plan.status !== firstStatus) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className="w-full min-h-screen">
      {/* FILTER & ACTION SECTION */}
      <div className="bg-white rounded shadow-sm border border-gray-200 mb-2 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Filter size={20} className="text-blue-600" /> Update Multiple
            Projects
          </h2>
        </div>

        <div className="p-5  space-y-3">
          {/* Row 1: filters */}
          <div className="flex justify-between flex-wrap gap-y-4">
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex items-center flex-wrap gap-1">
                <label className="text-xs font-bold text-gray-500 whitespace-nowrap">
                  Search Project
                </label>
                <div className="relative ">
                  {/* <Search
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={12}
                  /> */}
                  <input
                    type="text"
                    placeholder="ID or Name..."
                    className="pl-2 py-2  border border-gray-200 rounded text-xs focus:ring-2 focus:ring-blue-100 outline-none transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Plan Type */}
              <div className="flex items-center gap-1">
                <label className="text-xs font-bold text-gray-500 whitespace-nowrap ">
                  Plan Type
                </label>
                <select
                  className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 "
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="BUD">BUD</option>
                  <option value="EAC">EAC</option>
                  <option value="NBBUD">NBBUD</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1">
                <label className="text-xs font-bold text-gray-500 whitespace-nowrap ">
                  Status
                </label>
                <select
                  className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 "
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                  }}
                >
                  <option value="All">All</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Concluded">Concluded</option>
                </select>
              </div>

              {/* Version */}
              <div className="flex items-center gap-1">
                <label className="text-xs font-bold text-gray-500 whitespace-nowrap ">
                  Version
                </label>
                <select
                  className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 "
                  value={versionFilter}
                  onChange={(e) => setVersionFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Latest">Latest</option>
                  <option value="Final">Final</option>
                </select>
              </div>
            </div>

            {/* Row 2: Clear + Fetch aligned right, small width */}
            <div className="flex justify-end gap-2">
              <button onClick={resetFilters} className="btn1 btn-blue">
                {/* <X size={14} /> */}
                Clear All
              </button>

              <button
                onClick={fetchAllPlans}
                disabled={loading || isActionLoading}
                // className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                className="btn-blue btn1"
              >
                {loading || isActionLoading ? "Loading..." : "Fetch Plans"}
                {/* {"Fetch Plans"} */}
              </button>
            </div>
          </div>
        </div>

        {/* MASS ACTIONS BAR */}
        {selectedRows.size > 0 && (
          <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
            {/* <span className="text-sm font-bold text-blue-700">{selectedRows.size} Projects Selected</span> */}
            <div className="flex justify-between items-center mb-2 gap-1">
              <div className="flex flex-col gap-y-2 ">
                {safePlans.length >= 0 && (
                  <>
                    <div className="flex gap-1  flex-wrap items-center">
                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0)
                            await handleMassAction("Create Budget");
                          else
                            await handleActionSelect(
                              safePlans.findIndex(
                                (p) => p.plId === selectedPlan?.plId,
                              ),
                              "Create Budget",
                            );
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            !Array.from(selectedRows)
                              .map((id) => safePlans.find((p) => p.plId === id))
                              .some(
                                (p) =>
                                  p &&
                                  getButtonAvailability(p, "Create Budget"),
                              )) ||
                          (selectedRows.size === 0 &&
                            (!selectedPlan ||
                              !getButtonAvailability(
                                selectedPlan,
                                "Create Budget",
                              ))) ||
                          (selectedRows.size > 0 &&
                            buttonDisable(filteredPlans, selectedRows))
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? !Array.from(selectedRows)
                                .map((id) =>
                                  safePlans.find((p) => p.plId === id),
                                )
                                .some(
                                  (p) =>
                                    p &&
                                    getButtonAvailability(p, "Create Budget"),
                                ) ||
                              (selectedRows.size > 0 &&
                                buttonDisable(filteredPlans, selectedRows))
                              ? "btn-disabled"
                              : "btn-blue"
                            : !selectedPlan ||
                                !getButtonAvailability(
                                  selectedPlan,
                                  "Create Budget",
                                )
                              ? "btn-disabled"
                              : "btn-blue"
                        }`}
                        title="Create Budget"
                      >
                        New Budget
                      </button>

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0)
                            await handleMassAction("Create Blank Budget");
                          else
                            await handleActionSelect(
                              safePlans.findIndex(
                                (p) => p.plId === selectedPlan?.plId,
                              ),
                              "Create Blank Budget",
                            );
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            !Array.from(selectedRows)
                              .map((id) => safePlans.find((p) => p.plId === id))
                              .some(
                                (p) =>
                                  p &&
                                  getButtonAvailability(
                                    p,
                                    "Create Blank Budget",
                                  ),
                              )) ||
                          (selectedRows.size === 0 &&
                            (!selectedPlan ||
                              !getButtonAvailability(
                                selectedPlan,
                                "Create Blank Budget",
                              ))) ||
                          (selectedRows.size > 0 &&
                            buttonDisable(filteredPlans, selectedRows))
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? !Array.from(selectedRows)
                                .map((id) =>
                                  safePlans.find((p) => p.plId === id),
                                )
                                .some(
                                  (p) =>
                                    p &&
                                    getButtonAvailability(
                                      p,
                                      "Create Blank Budget",
                                    ),
                                ) ||
                              (selectedRows.size > 0 &&
                                buttonDisable(filteredPlans, selectedRows))
                              ? "btn-disabled"
                              : "btn-blue"
                            : !selectedPlan ||
                                !getButtonAvailability(
                                  selectedPlan,
                                  "Create Blank Budget",
                                )
                              ? "btn-disabled"
                              : "btn-blue"
                        }`}
                        title="Create Blank Budget"
                      >
                        New Blank Budget
                      </button>

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0)
                            await handleMassAction("Create EAC");
                          else
                            await handleActionSelect(
                              safePlans.findIndex(
                                (p) => p.plId === selectedPlan?.plId,
                              ),
                              "Create EAC",
                            );
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            !Array.from(selectedRows)
                              .map((id) => safePlans.find((p) => p.plId === id))
                              .some(
                                (p) =>
                                  p && getButtonAvailability(p, "Create EAC"),
                              )) ||
                          (selectedRows.size === 0 &&
                            (!selectedPlan ||
                              !getButtonAvailability(
                                selectedPlan,
                                "Create EAC",
                              ))) ||
                          (selectedRows.size > 0 &&
                            buttonDisable(filteredPlans, selectedRows))
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? !Array.from(selectedRows)
                                .map((id) =>
                                  safePlans.find((p) => p.plId === id),
                                )
                                .some(
                                  (p) =>
                                    p && getButtonAvailability(p, "Create EAC"),
                                ) ||
                              (selectedRows.size > 0 &&
                                buttonDisable(filteredPlans, selectedRows))
                              ? "btn-disabled"
                              : "btn-blue"
                            : !selectedPlan ||
                                !getButtonAvailability(
                                  selectedPlan,
                                  "Create EAC",
                                )
                              ? "btn-disabled"
                              : "btn-blue"
                        }`}
                        title="Create EAC"
                      >
                        New EAC
                      </button>

                      {selectedPlan && selectedPlan.plType === "NBBUD" && (
                        <button
                          onClick={() => {
                            setIsActionLoading(true);
                            handleActionSelect(
                              safePlans.findIndex(
                                (p) => p.plId === selectedPlan?.plId,
                              ),
                              "Create NB BUD",
                            );
                          }}
                          className="btn1 btn-blue"
                          title="Create BUD"
                        >
                          CREATE NB BUD
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0) await handleMassDelete();
                          else
                            await handleActionSelect(
                              safePlans.findIndex(
                                (p) => p.plId === selectedPlan?.plId,
                              ),
                              "Delete",
                            );
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            !Array.from(selectedRows)
                              .map((id) => safePlans.find((p) => p.plId === id))
                              .some(
                                (p) =>
                                  p &&
                                  getButtonAvailability(p, "Delete") &&
                                  !p.isApproved &&
                                  getMasterAndRelatedProjects(
                                    safePlans,
                                    p.projId,
                                  ).sameLevelBud,
                              )) ||
                          (selectedRows.size === 0 &&
                            (!selectedPlan ||
                              selectedPlan.isApproved ||
                              !getButtonAvailability(selectedPlan, "Delete") ||
                              !getMasterAndRelatedProjects(
                                safePlans,
                                selectedPlan?.projId,
                              ).sameLevelBud)) ||
                          (selectedRows.size > 0 &&
                            buttonDisable(filteredPlans, selectedRows))
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? !Array.from(selectedRows)
                                .map((id) =>
                                  safePlans.find((p) => p.plId === id),
                                )
                                .some(
                                  (p) =>
                                    p &&
                                    getButtonAvailability(p, "Delete") &&
                                    !p.isApproved &&
                                    getMasterAndRelatedProjects(
                                      safePlans,
                                      p.projId,
                                    ).sameLevelBud,
                                ) ||
                              (selectedRows.size > 0 &&
                                buttonDisable(filteredPlans, selectedRows))
                              ? "btn-disabled"
                              : "btn-red"
                            : !selectedPlan ||
                                selectedPlan.isApproved ||
                                !getButtonAvailability(
                                  selectedPlan,
                                  "Delete",
                                ) ||
                                !getMasterAndRelatedProjects(
                                  safePlans,
                                  selectedPlan?.projId,
                                ).sameLevelBud
                              ? "btn-disabled"
                              : "btn-red"
                        }`}
                        title="Delete Selected Plan"
                      >
                        Delete
                      </button>

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0)
                            await handleMassToggle("isCompleted");
                          else await handleTopButtonToggle("isCompleted");
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            getMassToggleProps("isCompleted").disabled) ||
                          (selectedRows.size === 0 &&
                            (getTopButtonDisabled("isCompleted") ||
                              isActionLoading))
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? getMassToggleProps("isCompleted").disabled
                              ? "btn-disabled"
                              : getMassToggleProps("isCompleted").label ===
                                  "Unsubmit"
                                ? "btn-orange"
                                : "btn-blue"
                            : getTopButtonDisabled("isCompleted") ||
                                isActionLoading
                              ? "btn-disabled"
                              : getCurrentPlan()?.status === "Submitted"
                                ? "btn-orange"
                                : "btn-blue"
                        }`}
                        title={
                          selectedRows.size > 0
                            ? getMassToggleProps("isCompleted").title
                            : getCurrentPlan()?.status === "Submitted"
                              ? "Unsubmit"
                              : "Submit"
                        }
                      >
                        {selectedRows.size > 0
                          ? getMassToggleProps("isCompleted").label || "Submit"
                          : getCurrentPlan()?.status === "Submitted"
                            ? "Unsubmit"
                            : "Submit"}
                      </button>

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0)
                            await handleMassToggle("isApproved");
                          else await handleTopButtonToggle("isApproved");
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            getMassToggleProps("isApproved").disabled) ||
                          (selectedRows.size === 0 &&
                            (getTopButtonDisabled("isApproved") ||
                              isActionLoading)) ||
                          role === "user"
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? getMassToggleProps("isApproved").disabled
                              ? "btn-disabled"
                              : getMassToggleProps("isApproved").label ===
                                  "Unapprove"
                                ? "btn-orange"
                                : "btn-blue"
                            : getTopButtonDisabled("isApproved") ||
                                isActionLoading
                              ? "btn-disabled"
                              : getCurrentPlan()?.status === "Approved" ||
                                  getCurrentPlan()?.finalVersion
                                ? "btn-orange"
                                : "btn-blue"
                        }`}
                        title={
                          selectedRows.size > 0
                            ? getMassToggleProps("isApproved").title
                            : getCurrentPlan()?.status === "Approved"
                              ? "Unapprove"
                              : "Approve"
                        }
                      >
                        {selectedRows.size > 0
                          ? getMassToggleProps("isApproved").label || "Approve"
                          : getCurrentPlan()?.status === "Approved" ||
                              getCurrentPlan()?.finalVersion
                            ? "Unapprove"
                            : "Approve"}
                      </button>

                      {/* <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0)
                            await handleMassToggle("finalVersion");
                          else await handleTopButtonToggle("finalVersion");
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          hasDuplicateProjectIds ||
                          (selectedRows.size > 1 &&
                            hasDuplicateProjectIds.size === 1) ||
                          (selectedRows.size > 0 &&
                            getMassToggleProps("finalVersion").disabled) ||
                          (selectedRows.size === 0 &&
                            (getTopButtonDisabled("finalVersion") ||
                              isActionLoading)) ||
                          role === "user"
                        }
                        className={`btn1 ${
                          selectedRows.size > 0
                            ? getMassToggleProps("finalVersion").disabled
                              ? "btn-disabled"
                              : getMassToggleProps("finalVersion").label ===
                                  "Unconclude"
                                ? "btn-orange"
                                : "btn-blue"
                            : getTopButtonDisabled("finalVersion") ||
                                isActionLoading
                              ? "btn-disabled"
                              : getCurrentPlan()?.finalVersion
                                ? "btn-orange"
                                : "btn-blue"
                        }`}
                        title={
                          selectedRows.size > 0
                            ? getMassToggleProps("finalVersion").title
                            : getCurrentPlan()?.finalVersion
                              ? "Unconclude"
                              : "Conclude"
                        }
                      >
                        {selectedRows.size > 0
                          ? getMassToggleProps("finalVersion").label ||
                            "Conclude"
                          : getCurrentPlan()?.finalVersion
                            ? "Unconclude"
                            : "Conclude"}
                      </button> */}

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectionMeta.count > 0) {
                            await handleMassToggle("finalVersion");
                          } else {
                            await handleTopButtonToggle("finalVersion");
                          }
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          role === "user" ||
                          selectionMeta.hasInternalDuplicates ||
                          // Block if: Selection > 0 AND (it's a Conclude action AND a version already exists)
                          (selectionMeta.count > 0 &&
                            getMassToggleProps("finalVersion").label ===
                              "Conclude" &&
                            selectionMeta.selectionConflictsWithDatabase) ||
                          // Standard utility checks
                          (selectionMeta.count > 0 &&
                            getMassToggleProps("finalVersion").disabled) ||
                          (selectionMeta.count === 0 &&
                            getTopButtonDisabled("finalVersion"))
                        }
                        className={`btn1 ${
                          selectionMeta.count > 0
                            ? getMassToggleProps("finalVersion").disabled ||
                              (getMassToggleProps("finalVersion").label ===
                                "Conclude" &&
                                selectionMeta.selectionConflictsWithDatabase)
                              ? "btn-disabled"
                              : getMassToggleProps("finalVersion").label ===
                                  "Unconclude"
                                ? "btn-orange"
                                : "btn-blue"
                            : getTopButtonDisabled("finalVersion") ||
                                isActionLoading
                              ? "btn-disabled"
                              : getCurrentPlan()?.finalVersion
                                ? "btn-orange"
                                : "btn-blue"
                        }`}
                        title={
                          selectionMeta.count > 0
                            ? selectionMeta.selectionConflictsWithDatabase &&
                              getMassToggleProps("finalVersion").label ===
                                "Conclude"
                              ? "Project already has a concluded version"
                              : getMassToggleProps("finalVersion").title
                            : getCurrentPlan()?.finalVersion
                              ? "Unconclude"
                              : "Conclude"
                        }
                      >
                        {selectionMeta.count > 0
                          ? getMassToggleProps("finalVersion").label ||
                            "Conclude"
                          : getCurrentPlan()?.finalVersion
                            ? "Unconclude"
                            : "Conclude"}
                      </button>

                      <button
                        onClick={async () => {
                          setIsActionLoading(true);
                          if (selectedRows.size > 0) await handleMassCalc();
                          else await handleCalc();
                          setIsActionLoading(false);
                        }}
                        disabled={
                          isActionLoading ||
                          (selectedRows.size > 0 &&
                            !Array.from(selectedRows)
                              .map((id) => safePlans.find((p) => p.plId === id))
                              .some((p) => p && p.plId && p.templateId)) ||
                          (selectedRows.size === 0 &&
                            getCalcButtonDisabled()) ||
                          role === "user"
                        }
                        className={`btn1 ${
                          (selectedRows.size > 0 &&
                            !Array.from(selectedRows)
                              .map((id) => safePlans.find((p) => p.plId === id))
                              .some((p) => p && p.plId && p.templateId)) ||
                          getCalcButtonDisabled()
                            ? "btn-blue"
                            : "btn-disabled"
                        }`}
                        title="Calculate"
                      >
                        Calc
                      </button>
                    </div>

                    <div className="flex gap-1 flex-wrap items-center">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <button className="text-xs font-bold text-gray-500 whitespace-nowrap">
                            VERSION CODE:
                          </button>

                          <input
                            type="text"
                            disabled={isHeaderDisabled}
                            className={`w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                              isHeaderDisabled
                                ? "bg-gray-100 cursor-not-allowed text-gray-400"
                                : "bg-white"
                            }`}
                            value={versionCodeInput}
                            onChange={(e) =>
                              setVersionCodeInput(e.target.value)
                            }
                          />

                          {/* <button
    onClick={handleSaveVersionCodeClick}
    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
  >
    SAVE
  </button> */}
                        </div>
                      </div>

                      {/* <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 whitespace-nowrap">
                          Project Dates
                        </label>

                        <input
                          type="date"
                          disabled={isHeaderDisabled}
                          className={`border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300${
                            isHeaderDisabled
                              ? "bg-gray-100 cursor-not-allowed text-gray-400"
                              : "bg-white"
                          }`}
                          value={headerStartDate}
                          onChange={(e) => setHeaderStartDate(e.target.value)}
                        />

                        <span className="text-xs text-gray-500">to</span>

                        <input
                          type="date"
                          disabled={isHeaderDisabled}
                          className={`border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300${
                            isHeaderDisabled
                              ? "bg-gray-100 cursor-not-allowed text-gray-400"
                              : "bg-white"
                          }`}
                          value={headerEndDate}
                          onChange={(e) => setHeaderEndDate(e.target.value)}
                        /> */}

                      {/* <button
    onClick={handleSaveHeaderDatesClick}
    className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
  >
    SAVE
  </button> */}
                      {/* </div> */}

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                          Template
                        </span>

                        {(() => {
                          // Determine if template dropdown should be enabled
                          let canEditTemplate = false;
                          let disabledReason = "No plans selected";

                          if (selectedRows.size > 0) {
                            // Multi-select mode: check if ANY selected plan has "In Progress" status
                            const selected = safePlans.filter((p) =>
                              selectedRows.has(p.plId),
                            );
                            canEditTemplate = selected.some(
                              (p) => p.status === "In Progress",
                            );
                            if (!canEditTemplate) {
                              disabledReason =
                                "Selected plans must be 'In Progress' to change template";
                            }
                          } else if (selectedPlan) {
                            // Single select mode
                            canEditTemplate =
                              selectedPlan.status === "In Progress";
                            if (!canEditTemplate) {
                              disabledReason = `Plan status is "${selectedPlan.status}" - must be "In Progress"`;
                            }
                          }

                          return (
                            <select
                              value={headerTemplateId}
                              onChange={(e) =>
                                setHeaderTemplateId(Number(e.target.value) || 0)
                              }
                              disabled={isHeaderDisabled}
                              title={disabledReason}
                              className={`border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 ${
                                isHeaderDisabled
                                  ? "bg-gray-100 cursor-not-allowed text-gray-400"
                                  : "bg-white"
                              }`}
                            >
                              <option value={0}>Select Template</option>
                              {templates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.templateCode}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>

                      <button
                        onClick={handleHeaderSaveAll}
                        className="btn1 btn-blue cursor-pointer"
                      >
                        SAVE
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* <div className="flex items-center gap-1">
              <label
                htmlFor="fiscalYear"
                className="font-semibold text-xs whitespace-nowrap"
              >
                Fiscal Year:
              </label>
              <select
                id="fiscalYear"
                // value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={fiscalYearOptions?.length === 0}
              >
                {fiscalYearOptions?.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div> */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADJUSTABLE TABLE CONTAINER */}
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full table">
            <thead className="h-7 thead">
              <tr>
                <th className="th-thead w-10">
                  <input
                    type="checkbox"
                    className="th-thead"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                {Object.entries(COLUMN_LABELS).map(([key, label]) => {
                  if (key === "selection") return null;

                  // const isLeftCol = key === "projName" || key === "projId"

                  return (
                    <th
                      key={key}
                      className={"th-thead capitalize "}
                      // style={{
                      //   textAlign:
                      //     key === "projId" || key === "projName"
                      //       ? "left"
                      //       : "center",
                      // }}
                    >
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="tbody">
              {/* Global processing state */}
              {isActionLoading && (
                <tr>
                  <td colSpan={11} className="py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <span className="ml-2 text-sm text-gray-700">
                        Processing...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Loading state */}
              {!isActionLoading && loading && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-20 text-gray-400 animate-pulse"
                  >
                    Loading mass project data...
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!isActionLoading && !loading && filteredPlans.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-20 text-gray-400 font-medium"
                  >
                    No projects found. Try adjusting your filters.
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!isActionLoading &&
                !loading &&
                filteredPlans.length > 0 &&
                filteredPlans.map((plan) => (
                  <tr
                    key={plan.plId}
                    className={`transition-colors duration-150 ${
                      selectedRows.has(plan.plId)
                        ? "bg-blue-50/40"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="tbody-td">
                      <input
                        type="checkbox"
                        className="h-3 px-4 py-1 text-gray-700"
                        checked={selectedRows.has(plan.plId)}
                        onChange={() => toggleRowSelection(plan)}
                      />
                    </td>
                    <td className="px-2 py-1 text-xs border-r border-b border-gray-300 text-black ">
                      {plan.projId}
                    </td>
                    <td className="px-2 py-1 text-xs border-r border-b border-gray-300 text-black ">
                      {plan.projName}
                    </td>
                    <td className="tbody-td text-center">{plan.plType}</td>
                    <td className="tbody-td text-center">{plan.version}</td>
                    <td className="tbody-td text-center">{plan.versionCode}</td>
                    <td className="tbody-td text-center">{plan.source}</td>
                    <td className="tbody-td text-center">
                      {getTemplateName(plan.templateId || 0)}
                    </td>
                    <td className="px-2 py-2 text-xs border-r border-gray-300 text-black text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-[12px] capitalize tracking-tighter
                  ${
                    plan.status === "Approved"
                      ? "bg-green-100 text-black"
                      : plan.status === "In Progress"
                        ? "bg-red-100 text-black"
                        : plan.status === "Concluded"
                          ? "bg-blue-200 text-black"
                          : plan.status === "Submitted"
                            ? "bg-yellow-100 text-black"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="tbody-td text-center">
                      {formatDate(plan.projStartDt)}
                    </td>
                    <td className="tbody-td text-center">
                      {formatDate(plan.projEndDt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MassUtilityProject;
