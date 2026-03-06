import React, { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import { backendUrl } from "./config";
import { Plus, Trash2, Edit, X ,Cog } from "lucide-react";
import DisplaySettingsContent from "./DisplaySettings";
import { toast } from "react-toastify";

const cn = (...args) => {
  return args.filter(Boolean).join(" ");
};

// --- Main LaborForm Component with Tabs ---
const LaborForm = ({canEdit}) => {
  const [activeTab, setActiveTab] = useState("OrganizationSettings");

  const [budgetHeaderDateFormat, setBudgetHeaderDateFormat] = useState(""); // Default to empty for "Select"
  const [reportVarianceCalculation, setReportVarianceCalculation] =
    useState(""); // Default to empty for "Select"

  // NEW states for additional fields from the image
  const [reportHeaderDateFormatOrg, setReportHeaderDateFormatOrg] =
    useState("01/3109");
  const [reportHeaderDateFormatProject, setReportHeaderDateFormatProject] =
    useState("JAN-09");
  const [dropdownListDateFormat, setDropdownListDateFormat] =
    useState("01/3109");
  const [reportPrecisionDollar, setReportPrecisionDollar] = useState("2");
  const [reportPrecisionHour, setReportPrecisionHour] = useState("1");
  const [reportPrecisionPercent, setReportPrecisionPercent] = useState("2");
  const [poLagDays, setPoLagDays] = useState("3");
  const [financialStatementCode, setFinancialStatementCode] =
    useState("INDSTM");

  // NEW states for checkboxes
  const [includeInactiveOrganizations, setIncludeInactiveOrganizations] =
    useState(false);
  const [includeInactiveVendors, setIncludeInactiveVendors] = useState(false);
  const [includeEmployeeVendors, setIncludeEmployeeVendors] = useState(false);
  const [includeVendorEmployees, setIncludeVendorEmployees] = useState(false);
  const [includeCostOfMoneyRevenueFee, setIncludeCostOfMoneyRevenueFee] =
    useState(false);
  const [displayDetailAccounts, setDisplayDetailAccounts] = useState(false);
  const [
    includePendingApprovedRequisitions,
    setIncludePendingApprovedRequisitions,
  ] = useState(false);
  const [includeUnreleasedBlanketPO, setIncludeUnreleasedBlanketPO] =
    useState(false);
  const [pendingChangesReportingMethod, setPendingChangesReportingMethod] =
    useState("Exclude From Total Cost");
 
      const [version, setVersion] = useState([]);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [groupNames, setGroupNames] = useState({});
      
      // Form state
      const [isFormOpen, setIsFormOpen] = useState(false);
      const [editingVersion, setEditingVersion] = useState(null);
      const [newVersion, setNewVersion] = useState({
        id: "",
        versionCodeValue: ""
      });
    
      // Fetch templates and pools on mount
    

  // Handle saving Display Settings to an API
  const handleSaveSettings = useCallback(async () => {
    // console.log("Attempting to save Display Settings...");

    // Basic validation for required fields
    if (!budgetHeaderDateFormat) {
      // alert("Please select a Budget Header Date Format.");
      toast.info("Please select a Budget Header Date Format.");
      return;
    }
    if (!reportVarianceCalculation) {
      // alert("Please select a Report Variance Calculation option.");
      toast.info("Please select a Report Variance Calculation option.");
      return;
    }
    if (!reportPrecisionPercent) {
      // alert("Report Precision Percent is required.");
      toast.info("Report Precision Percent is required.");
      return;
    }
    if (!poLagDays) {
      // alert("PO Lag Days is required.");
      toast.info("PO Lag Days is required.");
      return;
    }
    if (!financialStatementCode) {
      // alert("Financial Statement Code is required.");
      toast.info("Financial Statement Code is required.");
      return;
    }

    // Placeholder API endpoint for saving Display Settings
    // You will need to replace this with your actual API endpoint.
    // api/Configuration/UpdateConfigValues
    const updateApiUrl = `${backendUrl}/api/Configuration/bulk-upsert`;

    const dataToSave = {
      budgetHeaderDateFormat: budgetHeaderDateFormat,
      reportVarianceCalculation: reportVarianceCalculation,
      reportHeaderDateFormatOrg: reportHeaderDateFormatOrg,
      reportHeaderDateFormatProject: reportHeaderDateFormatProject,
      dropdownListDateFormat: dropdownListDateFormat,
      reportPrecisionDollar: reportPrecisionDollar,
      reportPrecisionHour: reportPrecisionHour,
      reportPrecisionPercent: reportPrecisionPercent,
      poLagDays: poLagDays,
      financialStatementCode: financialStatementCode,
      includeInactiveOrganizations: includeInactiveOrganizations,
      includeInactiveVendors: includeInactiveVendors,
      includeEmployeeVendors: includeEmployeeVendors,
      includeVendorEmployees: includeVendorEmployees,
      includeCostOfMoneyRevenueFee: includeCostOfMoneyRevenueFee,
      displayDetailAccounts: displayDetailAccounts,
      includePendingApprovedRequisitions: includePendingApprovedRequisitions,
      includeUnreleasedBlanketPO: includeUnreleasedBlanketPO,
      pendingChangesReportingMethod: pendingChangesReportingMethod,
    };

    // console.log("Display Settings Data to Save:", dataToSave);

    try {
      const response = await fetch(updateApiUrl, {
        method: "POST", // Or 'PUT' or 'PATCH' as per your API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error" }));
        throw new Error(
          `Failed to save settings: ${errorData.message || response.statusText}`,
        );
      }

      const result = await response.json();
      // console.log('Display settings saved successfully:', result);
      // alert("Display settings saved successfully!"); // Provide user feedback
      toast.success("Display settings saved successfully!");
    } catch (e) {
      // console.error("Error saving Display settings:", e);
      alert(`Error saving Display settings: ${e.message}`);
      toast.error(`Error saving Display settings: ${e.message}`); // Provide user feedback
    }
  }, [
    budgetHeaderDateFormat,
    reportVarianceCalculation,
    reportHeaderDateFormatOrg,
    reportHeaderDateFormatProject,
    dropdownListDateFormat,
    reportPrecisionDollar,
    reportPrecisionHour,
    reportPrecisionPercent,
    poLagDays,
    financialStatementCode,
    includeInactiveOrganizations,
    includeInactiveVendors,
    includeEmployeeVendors,
    includeVendorEmployees,
    includeCostOfMoneyRevenueFee,
    displayDetailAccounts,
    includePendingApprovedRequisitions,
    includeUnreleasedBlanketPO,
    pendingChangesReportingMethod,
  ]);

  // States from LaborFormContent
  const [projectBudgetPeriodMethod, setProjectBudgetPeriodMethod] = useState(
    "Accounting Periods ONLY",
  );
  const [unlockEACLastClosedPeriod, setUnlockEACLastClosedPeriod] =
    useState(false);
  const [projectAccountGroupCode, setProjectAccountGroupCode] = useState("");
  const [resourceBudgetCommitFlagDefault, setResourceBudgetCommitFlagDefault] =
    useState(false);
  const [autoPlugCalculation, setAutoPlugCalculation] = useState("On");
  const [
    importBudgetEACsFromExcelCommitFlagDefault,
    setImportBudgetEACsFromExcelCommitFlagDefault,
  ] = useState(false);
  const [timesheetImportHistory, setTimesheetImportHistory] = useState(36); // Default to 36
  const [
    importNewBusinessBudgetFromExcelCommitFlag,
    setImportNewBusinessBudgetFromExcelCommitFlag,
  ] = useState(false);
  const [timesheetScheduleCode, setTimesheetScheduleCode] = useState("");
  const [
    checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault,
    setCheckTheProjectBudgetEnableSubtaskRowHideOptionByDefault,
  ] = useState(false);
  const [laborEscalationMonth, setLaborEscalationMonth] = useState(""); // Initialize as empty for API data
  const [enableProjectHideBudEAC, setEnableProjectHideBudEAC] = useState(false);
  const [laborEscalationValue, setLaborEscalationValue] = useState(""); // Initialize as empty for API data
  const [showBudEACOnlyDefault, setShowBudEACOnlyDefault] = useState(false);
  const [projectSecurityToBeBasedOn, setProjectSecurityToBeBasedOn] = useState(
    "Project Budget Security",
  );
  const [enableBudgetAutoInspect, setEnableBudgetAutoInspect] = useState(false);
  const [
    allowBUDEACCreationPriorToPeriodClose,
    setAllowBUDEACCreationPriorToPeriodClose,
  ] = useState("Create BUD/EACs based on Current Period");
  const [
    ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning,
    setIfLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning,
  ] = useState("Yes");
  const [defaultBurdenTemplate, setDefaultBurdenTemplate] = useState("DEFAULT");
  const [projectBudgetSequentialLocking, setProjectBudgetSequentialLocking] =
    useState(false);
  const [workforceRule, setWorkforceRule] = useState("Enforce"); // Default value
  const [orgLevelDisplay, setOrgLevelDisplay] = useState(4); // Default value
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [availableProjects, setAvailableProjects] = useState([]); // To store fetched project IDs/
  const [closingPeriod, setClosingPeriod] = useState("");
  const [loading, setLoading] = useState(true); // Initial loading for projects and config
  const [error, setError] = useState(null);
  const [configValues, setConfigValues] = useState([]);
  const [closingPeriodId, setClosingPeriodId] = useState("");
  const [escalationPercentId, setEscalationPercentId] = useState("");
  const [escalationMonthId, setEscalationMonthId] = useState("");
  const [isEditableId, setIsEditableId] = useState("");
  const [escalationPercent, setEscalationPercent] = useState("");
  const [escalationMonth, setEscalationMonth] = useState("");
  const [isEditable, setIsEditable] = useState(false);

  // Month options mapping numeric values to display text
  const monthOptions = [
    { value: "0", label: "Employee's Anniversary Month" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const workforceRules = ["Enforce", "Do Not Enforce"];

  const handleLaborEscalationValueChange = (value) => {
    // Allow only numbers and a single decimal point (up to 5 decimal places)
    const regex = /^[0-9]*(\.[0-9]{0,5})?$/;
    if (value === "" || regex.test(value)) {
      setLaborEscalationValue(value);
    }
  };

  // States from NewTabContent
  const [paidTimeOffExpenseAccount, setPaidTimeOffExpenseAccount] =
    useState("60-100-001");
  const [updateEmployeeHomeOrg, setUpdateEmployeeHomeOrg] = useState(false);
  const [holidayExpenseAccount, setHolidayExpenseAccount] =
    useState("60-100-001");
  const [updateEmployeeAccrualRate, setUpdateEmployeeAccrualRate] =
    useState(false);
  const [ptoCalculationMethod, setPtoCalculationMethod] = useState("Hours");
  const [
    applyProbabilityToNewBusinessBudgets,
    setApplyProbabilityToNewBusinessBudgets,
  ] = useState(false);
  const [defaultPtoAccrualRate, setDefaultPtoAccrualRate] =
    useState("10.000000");
  const [orgBudgetSequentialLocking, setOrgBudgetSequentialLocking] =
    useState(false);
  const [partTimeHolidayCalculation, setPartTimeHolidayCalculation] =
    useState("0.500000");
  const [defaultFeeRate, setDefaultFeeRate] = useState("0.070000");
  const [defaultUtilization, setDefaultUtilization] = useState("0.820000");
  const [laborExpenseOrgLevels, setLaborExpenseOrgLevels] = useState("4");
  const [nonLaborExpenseOrgLevels, setNonLaborExpenseOrgLevels] = useState("4");
  const [orgBudgetRevenueCalculation, setOrgBudgetRevenueCalculation] =
    useState("Project Plus Org Revenue Adjustment");
  const [nlabHistoryMethod, setNlabHistoryMethod] = useState(
    "Populate GL Account History",
  );

  const handleNumericInput = (setter) => (e) => {
    const value = e.target.value;
    const regex = /^[0-9]*(\.[0-9]*)?$/;
    if (value === "" || regex.test(value)) {
      setter(value);
    }
  };

  const projectOptions = availableProjects.map((project) => ({
    value: project.projectId,
    label: project.name
      ? `${project.projectId} - ${project.name}`
      : project.projectId,
  }));

  // useEffect(() => {
  //   const fetchClosingPeriod = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await fetch(
  //         `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
  //       );
  //       if (!res.ok) throw new Error("Failed to fetch closing period");

  //       const data = await res.json(); // 👈 parse JSON
  //       const rawValue = (data?.value || "").trim();
  //       setClosingPeriodId(data?.id || null);
  //       let formattedDate = "";

  //       if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
  //         // Already yyyy-MM-dd
  //         formattedDate = rawValue;
  //       } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
  //         // Convert dd-MM-yyyy → yyyy-MM-dd
  //         const [day, month, year] = rawValue.split("-");
  //         formattedDate = `${year}-${month}-${day}`;
  //       } else if (rawValue) {
  //         // console.warn("Unexpected closing_period format:", rawValue);
  //       }

  //       setClosingPeriod(formattedDate);
  //     } catch (err) {
  //       // console.error("Error fetching closing period:", err);
  //       setClosingPeriod("");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchClosingPeriod();
  // }, []);

  // --- API Fetching for ALL available Project IDs ---

  useEffect(() => {
    const fetchOrgConfig = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`,
        );
        if (!res.ok) throw new Error("Failed to fetch organization config");
        const configArray = await res.json();

        // Fetch values by name
        const closingConfig = configArray.find(
          (cfg) => cfg.name === "closing_period",
        );
        const percentConfig = configArray.find(
          (cfg) => cfg.name === "escallation_percent",
        );
        const monthConfig = configArray.find(
          (cfg) => cfg.name === "escallation_month",
        );
        const isEditableConfig = configArray.find(
          (cfg) => cfg.name === "isClosedPeriodEditable",
        );

        setClosingPeriodId(closingConfig?.id || 0);
        setEscalationPercentId(percentConfig?.id || 0);
        setEscalationMonthId(monthConfig?.id || 0);
        setIsEditableId(isEditableConfig?.id || 0);

        // Format date for input type="date" (yyyy-MM-dd)
        // let formattedDate = "";
        // if (closingConfig?.value) {
        //   const rawValue = closingConfig.value.trim();
        //   if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        //     formattedDate = rawValue;
        //   } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
        //     const [day, month, year] = rawValue.split("-");
        //     formattedDate = `${year}-${month}-${day}`;
        //   }
        // }
        // setClosingPeriod(formattedDate);
        let formattedDate = "";

if (closingConfig?.value) {
  const rawValue = closingConfig.value.trim();

  // YYYY-MM-DD → YYYY-MM
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    formattedDate = rawValue.slice(0, 7);
  }
  // DD-MM-YYYY → YYYY-MM
  else if (/^\d{2}-\d{2}-\d{4}$/.test(rawValue)) {
    const [, month, year] = rawValue.split("-");
    formattedDate = `${year}-${month}`;
  }
}

setClosingPeriod(formattedDate);
        setEscalationPercent(percentConfig?.value || "");
        setEscalationMonth(monthConfig?.value?.toString() || "");
        setIsEditable(isEditableConfig?.value === "true");
      } catch (err) {
        setClosingPeriod("");
        setEscalationPercent("");
        setEscalationMonth("");
        setIsEditable(false);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgConfig();
  }, []);

  useEffect(() => {
    const fetchAllProjects = async () => {
      setLoading(true); // Set loading to true for initial project list fetch
      setError(null);
      try {
        const apiUrl = `${backendUrl}/Project/GetAllProjects`; // Your API endpoint to get ALL projects

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        setAvailableProjects(projects);

        // Automatically select the first project if available
        if (projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        } else {
          setLoading(false); // No projects to load config for
        }
      } catch (e) {
        // console.error("Failed to fetch project list:", e);
        setError(
          "Failed to load project list. Please check your API connection.",
        );
        setLoading(false);
      }
    };

    fetchAllProjects();
  }, []); // Runs once on component mount to get the list of projects

  useEffect(() => {
    const fetchEscalationData = async () => {
      if (!selectedProjectId) {
        // Reset state if no project selected
        setLaborEscalationMonth("");
        setLaborEscalationValue("");
        setWorkforceRule("");
        setConfigValues([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiUrl = `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/${selectedProjectId}`;
        const response = await fetch(apiUrl);

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const fetchedConfigValues = (await response.json()) || [];

        if (fetchedConfigValues.length === 0) {
          // ✅ If nothing in backend, initialize defaults
          const defaults = [
            {
              id: 0,
              name: "escallation_month",
              value: "",
              projId: selectedProjectId,
            },
            {
              id: 0,
              name: "escallation_percent",
              value: "",
              projId: selectedProjectId,
            },
            { id: 0, name: "workforce", value: "", projId: selectedProjectId },
          ];
          setConfigValues(defaults);
        } else {
          setConfigValues(fetchedConfigValues);
        }

        // Set state for individual fields
        const monthConfig = fetchedConfigValues.find(
          (c) => c.name === "escallation_month",
        );
        const percentConfig = fetchedConfigValues.find(
          (c) => c.name === "escallation_percent",
        );
        const workforceConfig = fetchedConfigValues.find(
          (c) => c.name === "workforce",
        );

        setLaborEscalationMonth(monthConfig?.value ?? "");
        setLaborEscalationValue(percentConfig?.value ?? "");
        setWorkforceRule(
          workforceConfig?.value != null
            ? String(workforceConfig.value).toLowerCase() === "true"
              ? "Enforce"
              : "Do Not Enforce"
            : "",
        );
      } catch (e) {
        // console.error(
        //   `Failed to fetch config for project ${selectedProjectId}:`,
        //   e
        // );
        setError(
          `Failed to load settings for project ${selectedProjectId}. Please try again.`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEscalationData();
  }, [selectedProjectId]);

  const handleSaveProjectSettings = useCallback(async () => {
    if (!selectedProjectId) {
      alert("Please select a Project ID to save settings.");
      return;
    }

    const updateApiUrl = `${backendUrl}/api/Configuration/UpdateConfigValues`;
    const nowIsoString = new Date().toISOString();

    let dataToSave = [];

    if (configValues.length > 0) {
      // Map over existing configValues
      dataToSave = configValues.map((config) => {
        let newValue = config.value;

        if (config.name === "escallation_month")
          newValue = String(laborEscalationMonth);
        if (config.name === "escallation_percent")
          newValue = String(laborEscalationValue);
        if (config.name === "workforce")
          newValue = workforceRule === "Enforce" ? "true" : "false";

        return {
          id: config.id || 0, // ✅ always include id
          name: config.name,
          value: newValue,
          createdAt: nowIsoString,
          projId: selectedProjectId,
        };
      });
    } else {
      // ✅ If nothing came from backend, build payload fresh from UI
      dataToSave = [
        {
          id: 0,
          name: "escallation_month",
          value: String(laborEscalationMonth || "0"),
          createdAt: nowIsoString,
          projId: selectedProjectId,
        },
        {
          id: 0,
          name: "escallation_percent",
          value: String(laborEscalationValue || "0"),
          createdAt: nowIsoString,
          projId: selectedProjectId,
        },
        {
          id: 0,
          name: "workforce",
          value: workforceRule === "Enforce" ? "true" : "false",
          createdAt: nowIsoString,
          projId: selectedProjectId,
        },
      ];
    }

    // console.log("Project Settings Data to Save:", dataToSave);

    try {
      const response = await fetch(updateApiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error" }));
        throw new Error(errorData.message || response.statusText);
      }

      const result = await response.json();
      // console.log("Project settings saved successfully:", result);
      alert("Project settings saved successfully!");
    } catch (e) {
      // console.error("Error saving project settings:", e);
      alert(`Error saving project settings: ${e.message}`);
    }
  }, [
    selectedProjectId,
    laborEscalationMonth,
    laborEscalationValue,
    workforceRule,
    configValues,
  ]);

  const getMonthEndDate = (yearMonth) => {
  if (!yearMonth) return "";

  const [year, month] = yearMonth.split("-").map(Number);

  // month is 1-based → Date expects 0-based
  const lastDay = new Date(year, month, 0).getDate();

  return `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
};


  const handleSaveOrganizationSettings = useCallback(async () => {
    // if (!selectedProjectId) {
    //   alert("Please select a Project ID first.");
    //   return;
    // }

    // console.log("Attempting to save Closing Period...");
    if (!closingPeriod) {
  toast.error("Please select a Closing Period before saving.");
  return;
}


    const updateApiUrl = `${backendUrl}/api/Configuration/UpdateConfigValues`;

    const nowIsoString = new Date().toISOString();

    // Build payload ONLY for closing period
    const closingPeriodPayload = [
      {
        id: closingPeriodId, // 0 = let backend assign, or use existing id if you fetched it
        name: "closing_period",
        // value: closingPeriod,
        //  // <-- your state variable for closing period
        value: getMonthEndDate(closingPeriod),
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
      {
        id: escalationMonthId, // 0 = let backend assign, or use existing id if you fetched it
        name: "escallation_month",
        value: escalationMonth, // <-- your state variable for closing period
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
      {
        id: escalationPercentId, // 0 = let backend assign, or use existing id if you fetched it
        name: "escallation_percent",
        value: escalationPercent, // <-- your state variable for closing period
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
      {
        id: isEditableId,
        name: "isClosedPeriodEditable",
        value: isEditable.toString(), // ✅ Boolean → "true"/"false"
        createdAt: nowIsoString,
        projId: "xxxxx",
      },
    ];

    // console.log("Closing Period Payload:", closingPeriodPayload);

    try {
      const response = await fetch(updateApiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(closingPeriodPayload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error" }));
        throw new Error(
          `Failed to save closing period: ${
            errorData.message || response.statusText
          }`,
        );
      }

      const result = await response.json();
      // console.log("Closing period saved successfully:", result);
      toast.success("Setting saved successfully!");
      // alert("Closing period saved successfully!");
    } catch (e) {
      // console.error("Error saving Closing Period:", e);
      // alert(`Error saving Closing Period: ${e.message}`);
      toast.error(`Error saving Closing Period: ${e.message}`);
    }
  }, [
    closingPeriod,
    escalationMonth,
    escalationPercent,
    closingPeriodId,
    escalationMonthId,
    escalationPercentId,
    isEditableId,
    isEditable,
  ]);

  const handleSaveAllSettings = async () => {
    // console.log("Saving all settings...");
    if (activeTab === "projectSettings") {
      await handleSaveProjectSettings();
    } else if (activeTab === "OrganizationSettings") {
      await handleSaveOrganizationSettings();
    } else if (activeTab === "displaySettings") {
      await handleSaveSettings();
    }
  };

  // version code
    // Fetch All Version Codes
const fetchVersionCode = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${backendUrl}/Orgnization/GetAllVersionCodes`);
    if (!response.ok) throw new Error("Failed to fetch Version Codes");
    const data = await response.json();
    setVersion(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  // Only fetch if we are on the correct tab to save resources
  if (activeTab === "versionCodeType") {
    fetchVersionCode();
  }
}, [activeTab]); // This triggers the fetch whenever the tab changes

// Handle Save (Create or Update)
const handleSave = async (e) => {
  e.preventDefault();
  
  if (!newVersion.versionCodeValue) {
    setError("Please fill all fields");
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    const method = editingVersion ? "PUT" : "POST";
    const url = editingVersion
      ? `${backendUrl}/Orgnization/UpdateVersionCode/${editingVersion.id}`
      : `${backendUrl}/Orgnization/CreateVersionCode`;

    // Map your state to the expected API payload
    const payload = {
      id: newVersion.id || 0,
      versionCodeValue: newVersion.versionCodeValue
    };

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Failed to ${editingVersion ? 'update' : 'create'} Version Code`);

    // Refresh and close
    await fetchVersionCode();
    closeForm();
    toast.success(editingVersion ? "Version Code updated!" : "Version Code created!");
    
  } catch (err) {
    console.error("Save error:", err);
    setError(err.message || "Failed to save");
    toast.error(err.message || "Failed to save");
  } finally {
    setIsSubmitting(false);
  }
};

// Handle Delete
const handleDelete = async (version) => {
  if (!confirm(`Are you sure you want to delete Version Code "${version.id}"?`)) return;
  
  try {
    const response = await fetch(`${backendUrl}/Orgnization/DeleteVersionCode/${version.id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete Version Code");

    toast.success("Deleted Successfully!!");
    await fetchVersionCode();
  } catch (err) {
    setError(err.message || "Failed to delete");
    toast.error(err.message || "Failed to delete");
  }
};

      const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewVersion(prev => ({ ...prev, [name]: value }));
    };

    const openForm = (version = null) => {
      setEditingVersion(version);
      setNewVersion({
        id: version?.id || "",
        versionCodeValue: version?.versionCodeValue || ""
      });
      setIsFormOpen(true);
    };

    const closeForm = () => {
      setIsFormOpen(false);
      setEditingVersion(null);
      setNewVersion({ id: "", versionCodeValue: "" });
      setError(null);
    };

  const filteredProjects = availableProjects.filter((project) => {
    const keyword = selectedProjectId ? selectedProjectId.toLowerCase() : "";
    const projectIdMatch =
      typeof project.projectId === "string" &&
      project.projectId.toLowerCase().includes(keyword);
    const nameMatch =
      typeof project.name === "string" &&
      project.name.toLowerCase().includes(keyword);
    return projectIdMatch || nameMatch;
  });

  if (loading && availableProjects.length === 0 && !error) {
    return (
      <div className="p-4 text-center text-blue-600">
        Loading available projects...
      </div>
    );
  }

    

  if (error) {
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  }

  // Options for Budget Header Date Format dropdown (from previous iteration)
  const dateFormatOptions = [
    { label: "01/31/09", value: "1" },
    { label: "01/31/2009", value: "2" },
    { label: "01/01-01/31*09", value: "3" },
    { label: "FY09-1", value: "4" },
    { label: "FY09-1-2", value: "5" },
    { label: "01/31/09 (160/176)", value: "6" },
    { label: "01/31/2009 (160/176)", value: "7" },
    { label: "01/01-01/31*09 (160/176)", value: "8" },
    { label: "FY09-1 (160/176)", value: "9" },
    { label: "FY09-1-2 (80/88)", value: "10" },
    { label: "MMM-YY (xxx/xxx)", value: "11" },
    { label: "2009_1_2 (xxx/xxx)", value: "12" },
  ];

  // Options for Report Variance Calculation dropdown (from previous iteration)
  const varianceCalculationOptions = [
    { label: "Actuals", value: "Actuals" },
    { label: "Budgets", value: "Budgets" },
  ];

  // New dropdown options for Report Header Date Format - Project
  const projectDateFormatOptions = [
    { label: "JAN-09", value: "JAN-09" },
    { label: "FEB-09", value: "FEB-09" },
    { label: "MAR-09", value: "MAR-09" },
    { label: "APR-09", value: "APR-09" },
    // Add more options as needed based on actual requirements
  ];

  // New dropdown options for Drop-Down List Date Format
  const dropDownListDateFormatOptions = [
    { label: "01/3109", value: "01/3109" },
    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    // Add more options as needed
  ];

  // New dropdown options for Pending Changes Reporting Method
  const pendingChangesReportingMethodOptions = [
    { label: "Exclude From Total Cost", value: "Exclude From Total Cost" },
    { label: "Include In Total Cost", value: "Include In Total Cost" },
    // Add more options as needed
  ];

  return (
    <div className="min-h-screen text-gray-900 flex justify-center">
      {/* Retained w-full px-8 for wider display within its parent */}
      <div className="w-full space-y-2">
        <div className="p-4 flex items-center justify-between bg-white rounded-sm">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Cog size={20} className="text-blue-500" />
            Settings
          </h2>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-sm p-4">
          {/* Tab Navigation */}
          <div className="flex  justify-between items-center">
            <div className="flex gap-x-2">
              <button
                // className={cn(
                //   "py-2 px-4 text-[16px] rounded-lg  focus:outline-none",
                //   activeTab === "OrganizationSettings"
                //     ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
                //     : "text-gray-600 hover:text-gray-800 bg-gray-100",
                // )}
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeTab === "OrganizationSettings"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveTab("OrganizationSettings")}
              >
                Organization Settings
              </button>
              <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeTab === "projectSettings"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveTab("projectSettings")}
              >
                Project Settings
              </button>
              {/* <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeTab === "displaySettings"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveTab("displaySettings")}
              >
                Display Settings
              </button> */}
              <button
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors
          ${
            activeTab === "versionCodeType"
              ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
              : "text-gray-600 hover:text-gray-800 bg-gray-100"
          }`}
                onClick={() => setActiveTab("versionCodeType")}
              >
                Configure Version Code
              </button>
            </div>

            {(activeTab != "versionCodeType" && canEdit("globalConfiguration") &&
            <div className="flex justify-end ">
              <button
                type="button"
                onClick={handleSaveAllSettings}
                className="btn1 btn-blue cursor-pointer"
              >
                Save
              </button>
            </div>
            )}
          </div>
          {activeTab === "OrganizationSettings" && (
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between"></div>
              {/* Changed gap-y-8 back to gap-y-5 for more compact layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* closing period */}
                  <div className="label-input-div">
                    <label htmlFor="closingPeriod" className="input-label">
                      Closing Period <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="closingPeriod"
                      type="month"
                      value={closingPeriod}
                      onChange={(e) => setClosingPeriod(e.target.value)}
                      className="input-style"
                      // disabled={loading || !selectedProjectId}
                    />
                  </div>

                  {/* Labor Escalation Month */}
                  <div className="label-input-div">
                    <label
                      htmlFor="laborEscalationMonth"
                      className="input-label"
                    >
                      Labor Escalation Month{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="laborEscalationMonth"
                      value={escalationMonth}
                      onChange={(e) => setEscalationMonth(e.target.value)}
                      className="input-style"
                      disabled={loading}
                    >
                      <option value="">Select Option</option>
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Labor Escalation Value */}
                  <div className="label-input-div">
                    <label
                      htmlFor="laborEscalationValue"
                      className="input-label"
                    >
                      Labor Escalation Value{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {/* <div className=" "> */}
                    <input
                      id="laborEscalationValue"
                      type="text"
                      value={escalationPercent ? `${escalationPercent}%` : ""}
                      onChange={(e) =>
                        setEscalationPercent(e.target.value.replace("%", ""))
                      }
                      placeholder="0.00000"
                      className="input-style"
                      disabled={loading}
                    />
                    {/* </div> */}
                  </div>

                  <div className="label-input-div">
                    <label htmlFor="isEditableId" className="input-label">
                      Is Closed Period Editable for EAC
                    </label>
                    <div className="flex justify-start w-[60%]">
                    <input
                      id="isEditableId"
                      type="checkbox"
                      checked={isEditable}
                      onChange={(e) => setIsEditable(e.target.checked)}
                      className="rounded-md h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    </div>
                  </div>

                  {/* <div className="label-input-div">
                    <label
                      htmlFor="paidTimeOffExpenseAccount"
                      className="input-label"
                    >
                      Paid Time Off Expense Account{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="paidTimeOffExpenseAccount"
                      type="text"
                      value={paidTimeOffExpenseAccount}
                      onChange={(e) =>
                        setPaidTimeOffExpenseAccount(e.target.value)
                      }
                      className="input-style"
                    />
                  </div> */}

                  {/* Holiday Expense Account */}
                  {/* <div className="label-input-div">
                    <label
                      htmlFor="holidayExpenseAccount"
                      className="input-label"
                    >
                      Holiday Expense Account{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="holidayExpenseAccount"
                      type="text"
                      value={holidayExpenseAccount}
                      onChange={(e) => setHolidayExpenseAccount(e.target.value)}
                      className="input-style"
                    />
                  </div> */}

                  {/* PTO Calculation Method */}
                  {/* <div className="label-input-div">
                    <label
                      htmlFor="ptoCalculationMethod"
                      className="input-label"
                    >
                      PTO Calculation Method{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="ptoCalculationMethod"
                      value={ptoCalculationMethod}
                      onChange={(e) => setPtoCalculationMethod(e.target.value)}
                      className="input-style"
                    >
                      <option key="pto-hours" value="Hours">
                        Hours
                      </option>
                    </select>
                  </div> */}

                  {/* Default PTO Accrual Rate */}
                  {/* <div className="label-input-div">
                    <label
                      htmlFor="defaultPtoAccrualRate"
                      className="input-label"
                    >
                      Default PTO Accrual Rate{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultPtoAccrualRate"
                      type="text"
                      value={defaultPtoAccrualRate}
                      onChange={handleNumericInput(setDefaultPtoAccrualRate)}
                      className="input-style"
                    />
                  </div> */}

                  {/* Part-Time Holiday Calculation % */}
                  {/* <div className="label-input-div">
                    <label
                      htmlFor="partTimeHolidayCalculation"
                      className="input-label"
                    >
                      Part-Time Holiday Calculation %{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="partTimeHolidayCalculation"
                      type="text"
                      value={partTimeHolidayCalculation}
                      onChange={handleNumericInput(
                        setPartTimeHolidayCalculation,
                      )}
                      className="input-style"
                    />
                  </div> */}
                </div>

                {/* Right Column (Checkboxes) */}
                {/* <div className="space-y-4"> */}
                {/* Default Fee Rate */}
                {/* <div className="label-input-div">
                    <label htmlFor="defaultFeeRate" className="input-label">
                      Default Fee Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultFeeRate"
                      type="text"
                      value={defaultFeeRate}
                      onChange={handleNumericInput(setDefaultFeeRate)}
                      className="input-style"
                    />
                  </div> */}
                {/* Default Utilization % */}
                {/* <div className="label-input-div">
                    <label htmlFor="defaultUtilization" className="input-label">
                      Default Utilization %{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultUtilization"
                      type="text"
                      value={defaultUtilization}
                      onChange={handleNumericInput(setDefaultUtilization)}
                      className="input-style"
                    />
                  </div> */}
                {/* Labor Expense Org Level(s) */}
                {/* <div className="label-input-div">
                    <label
                      htmlFor="laborExpenseOrgLevels"
                      className="input-label"
                    >
                      Labor Expense Org Level(s){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="laborExpenseOrgLevels"
                      type="text"
                      value={laborExpenseOrgLevels}
                      onChange={(e) => setLaborExpenseOrgLevels(e.target.value)}
                      className="input-style"
                    />
                  </div> */}
                {/* Non-Labor Expense Org Level(s) */}
                {/* <div className="label-input-div">
                    <label
                      htmlFor="nonLaborExpenseOrgLevels"
                      className="input-label"
                    >
                      Non-Labor Expense Org Level(s){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nonLaborExpenseOrgLevels"
                      type="text"
                      value={nonLaborExpenseOrgLevels}
                      onChange={(e) =>
                        setNonLaborExpenseOrgLevels(e.target.value)
                      }
                      className="input-style"
                    />
                  </div> */}
                {/* Org Budget Revenue Calculation */}
                {/* <div className="label-input-div">
                    <label
                      htmlFor="orgBudgetRevenueCalculation"
                      className="input-label"
                    >
                      Org Budget Revenue Calculation{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="orgBudgetRevenueCalculation"
                      value={orgBudgetRevenueCalculation}
                      onChange={(e) =>
                        setOrgBudgetRevenueCalculation(e.target.value)
                      }
                      className="input-style"
                    >
                      <option
                        key="org-budget-revenue-project-plus-org-revenue"
                        value="Project Plus Org Revenue Adjustment"
                      >
                        Project Plus Org Revenue Adjustment
                      </option>
                    </select>
                  </div> */}
                {/* NLAB $ History Method */}
                {/* <div className="label-input-div">
                    <label htmlFor="nlabHistoryMethod" className="input-label">
                      NLAB $ History Method{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="nlabHistoryMethod"
                      value={nlabHistoryMethod}
                      onChange={(e) => setNlabHistoryMethod(e.target.value)}
                      className="input-style"
                    >
                      <option
                        key="nlab-populate-gl-account-history"
                        value="Populate GL Account History"
                      >
                        Populate GL Account History
                      </option>
                    </select>
                  </div>{" "} */}
                {/* Adjusted space-y to 4 for checkboxes for slightly less spacing */}
                {/* Closed Period Editable */}

                {/* <div className="flex flex-col gap-y-1"> */}
                {/* <div className="flex items-center space-x-2">
                      <input
                        id="isEditableId"
                        type="checkbox"
                        checked={isEditable}
                        onChange={(e) => setIsEditable(e.target.checked)}
                        className="rounded-md h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="isEditableId" className="text-sm">
                        Is Closed Period Editable for EAC
                      </label>
                    </div> */}

                {/* Update Employee Home Org */}
                {/* <div className="flex items-center space-x-2">
                      <input
                        id="updateEmployeeHomeOrg"
                        type="checkbox"
                        checked={updateEmployeeHomeOrg}
                        onChange={(e) =>
                          setUpdateEmployeeHomeOrg(e.target.checked)
                        }
                        className="rounded-md h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor="updateEmployeeHomeOrg"
                        className="text-sm"
                      >
                        Update Employee Home Org
                      </label>
                    </div> */}
                {/* Update Employee Accrual Rate */}
                {/* <div className="flex items-center space-x-2">
                      <input
                        id="updateEmployeeAccrualRate"
                        type="checkbox"
                        checked={updateEmployeeAccrualRate}
                        onChange={(e) =>
                          setUpdateEmployeeAccrualRate(e.target.checked)
                        }
                        className="rounded-md h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor="updateEmployeeAccrualRate"
                        className="text-sm"
                      >
                        Update Employee Accrual Rate
                      </label>
                    </div> */}
                {/* Apply % Probability to New Business Budgets */}
                {/* <div className="flex items-center space-x-2">
                      <input
                        id="applyProbabilityToNewBusinessBudgets"
                        type="checkbox"
                        checked={applyProbabilityToNewBusinessBudgets}
                        onChange={(e) =>
                          setApplyProbabilityToNewBusinessBudgets(
                            e.target.checked,
                          )
                        }
                        className="rounded-md h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor="applyProbabilityToNewBusinessBudgets"
                        className="text-sm"
                      >
                        Apply % Probability to New Business Budgets
                      </label>
                    </div> */}
                {/* Org Budget Sequential Locking */}
                {/* <div className="flex items-center space-x-2">
                      <input
                        id="orgBudgetSequentialLocking"
                        type="checkbox"
                        checked={orgBudgetSequentialLocking}
                        onChange={(e) =>
                          setOrgBudgetSequentialLocking(e.target.checked)
                        }
                        className="rounded-md h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label
                        htmlFor="orgBudgetSequentialLocking"
                        className="text-sm"
                      >
                        Org Budget Sequential Locking
                      </label>
                    </div> */}
                {/* </div> */}
                {/* </div> */}
              </div>
            </div>
          )}
          {activeTab === "projectSettings" && (
            <div className="p-4">
              <div className="flex items-center justify-between"></div>
              {/* Changed gap-y-8 back to gap-y-5 for more compact layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Project ID Dropdown */}
                  {/* <div>
                    <label
                      htmlFor="projectId"
                      className="block text-sm font-medium"
                    >
                      Project ID <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectId"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="input-style"
                      disabled={loading}
                    >
                      <option key="select-project-placeholder" value="">
                        Select a Project
                      </option>
                      
                      {availableProjects.map((project, index) => (
                        <option
                          key={
                            project.projectId
                              ? String(project.projectId)
                              : `project-idx-${index}`
                          }
                          value={project.projectId}
                        >
                          {project.name
                            ? `${project.projectId} - ${project.name}`
                            : project.id}
                        </option>
                      ))}
                    </select>
                  </div> */}

                  <div className="label-input-div">
                    <label htmlFor="projectId" className="input-label">
                      Project ID <span className="text-red-500">*</span>
                    </label>
                    <Select
                      inputId="projectId"
                      className="w-[60%]"
                      options={projectOptions}
                      isLoading={loading}
                      value={
                        projectOptions.find(
                          (opt) => opt.value === selectedProjectId,
                        ) || null
                      }
                      onChange={(opt) =>
                        setSelectedProjectId(opt ? opt.value : "")
                      }
                      isSearchable
                      placeholder="Search & select a project"
                      menuPlacement="auto"
                    />
                  </div>

                  {/* Project Budget Period Method */}
                  {/* <div>
                    <label
                      htmlFor="projectBudgetPeriodMethod"
                      className="block text-sm font-medium"
                    >
                      Project Budget Period Method{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectBudgetPeriodMethod"
                      value={projectBudgetPeriodMethod}
                      onChange={(e) => setProjectBudgetPeriodMethod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId} // Disable if no project selected
                    >
                      <option
                        key="pbp-accounting-periods-only"
                        value="Accounting Periods ONLY"
                      >
                        Accounting Periods ONLY
                      </option>
                    </select>
                  </div> */}

                  {/* Project Account Group Code */}
                  {/* <div>
                    <label
                      htmlFor="projectAccountGroupCode"
                      className="block text-sm font-medium"
                    >
                      Project Account Group Code
                    </label>
                    <input
                      id="projectAccountGroupCode"
                      type="text"
                      value={projectAccountGroupCode}
                      onChange={(e) => setProjectAccountGroupCode(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}

                  {/* Auto Plug Calculation */}
                  {/* <div>
                    <label
                      htmlFor="autoPlugCalculation"
                      className="block text-sm font-medium"
                    >
                      Auto Plug Calculation <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="autoPlugCalculation"
                      value={autoPlugCalculation}
                      onChange={(e) => setAutoPlugCalculation(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option key="apc-on" value="On">
                        On
                      </option>
                      <option key="apc-off" value="Off">
                        Off
                      </option>
                    </select>
                  </div> */}

                  {/* Timesheet Import History */}
                  {/* <div>
                    <label
                      htmlFor="timesheetImportHistory"
                      className="block text-sm font-medium"
                    >
                      Timesheet Import History
                    </label>
                    <div className="flex items-center mt-1">
                      <input
                        id="timesheetImportHistory"
                        type="number"
                        value={timesheetImportHistory}
                        onChange={(e) =>
                          setTimesheetImportHistory(parseInt(e.target.value, 10))
                        }
                        className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading || !selectedProjectId}
                      />
                      <span className="ml-2 text-sm text-gray-600">Months</span>
                    </div>
                  </div> */}

                  {/* Timesheet Schedule Code */}
                  {/* <div>
                    <label
                      htmlFor="timesheetScheduleCode"
                      className="block text-sm font-medium"
                    >
                      Timesheet Schedule Code
                    </label>
                    <input
                      id="timesheetScheduleCode"
                      type="text"
                      value={timesheetScheduleCode}
                      onChange={(e) => setTimesheetScheduleCode(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}

                  {/* Labor Escalation Month */}
                  <div className="label-input-div">
                    <label
                      htmlFor="laborEscalationMonth"
                      className="input-label"
                    >
                      Labor Escalation Month{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="laborEscalationMonth"
                      value={laborEscalationMonth}
                      onChange={(e) => setLaborEscalationMonth(e.target.value)}
                      className="input-style"
                      disabled={loading || !selectedProjectId}
                    >
                      <option key="lem-select-option" value="">
                        Select Option
                      </option>
                      {monthOptions.map((option) => (
                        // Ensured option.value is a string for key
                        <option key={String(option.value)} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Labor Escalation Value */}
                  <div className="label-input-div">
                    <label
                      htmlFor="laborEscalationValue"
                      className="input-label"
                    >
                      Labor Escalation Value{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    {/* <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        %
                      </span> */}
                    <input
                      id="laborEscalationValue"
                      type="text"
                      value={
                        laborEscalationValue ? `${laborEscalationValue}%` : ""
                      }
                      onChange={(e) => {
                        let val = e.target.value.replace("%", ""); // strip % when typing
                        handleLaborEscalationValueChange(val);
                      }}
                      placeholder="0.00000"
                      className="input-style"
                      disabled={loading || !selectedProjectId}
                    />
                  </div>

                  {/* Project Security to be based on */}
                  {/* <div>
                    <label
                      htmlFor="projectSecurityToBeBasedOn"
                      className="block text-sm font-medium"
                    >
                      Project Security to be based on{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="projectSecurityToBeBasedOn"
                      value={projectSecurityToBeBasedOn}
                      onChange={(e) => setProjectSecurityToBeBasedOn(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option
                        key="ps-project-budget-security"
                        value="Project Budget Security"
                      >
                        Project Budget Security
                      </option>
                      <option key="ps-org-id" value="Org ID">
                        Org ID
                      </option>
                    </select>
                  </div> */}

                  {/* Allow BUD/EAC Creation Prior to Period Close */}
                  {/* <div>
                    <label
                      htmlFor="allowBUDEACCreationPriorToPeriodClose"
                      className="block text-sm font-medium"
                    >
                      Allow BUD/EAC creation prior to period close{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="allowBUDEACCreationPriorToPeriodClose"
                      value={allowBUDEACCreationPriorToPeriodClose}
                      onChange={(e) =>
                        setAllowBUDEACCreationPriorToPeriodClose(e.target.value)
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option
                        key="ace-current-period"
                        value="Create BUD/EACs based on Current Period"
                      >
                        Create BUD/EACs based on Current Period
                      </option>
                      <option
                        key="ace-last-closed-period"
                        value="Create BUD/EACs based on Last Closed Period (Standard function)"
                      >
                        Create BUD/EACs based on Last Closed Period (Standard function)
                      </option>
                    </select>
                  </div> */}

                  {/* If Labor Suppression is off, do you want to show Employee Labor Rate Planning */}
                  {/* <div>
                    <label
                      htmlFor="ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning"
                      className="block text-sm font-medium"
                    >
                      If Labor Suppression is off, do you want to show Employee Labor
                      Rate Planning?
                    </label>
                    <select
                      id="ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning"
                      value={
                        ifLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning
                      }
                      onChange={(e) =>
                        setIfLaborSuppressionIsOffDoYouWantToShowEmployeeLaborRatePlanning(
                          e.target.value
                        )
                      }
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    >
                      <option key="slrp-yes" value="Yes">
                        Yes
                      </option>
                      <option key="slrp-no" value="No">
                        No
                      </option>
                    </select>
                  </div> */}

                  {/* Default Burden Template */}
                  {/* <div>
                    <label
                      htmlFor="defaultBurdenTemplate"
                      className="block text-sm font-medium"
                    >
                      Default Burden Template <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="defaultBurdenTemplate"
                      type="text"
                      value={defaultBurdenTemplate}
                      onChange={(e) => setDefaultBurdenTemplate(e.target.value)}
                      readOnly
                      className="w-full mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm cursor-not-allowed"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}

                  {/* Workforce Rule */}
                  <div className="label-input-div">
                    <label htmlFor="workforceRule" className="input-label">
                      Workforce Rule <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="workforceRule"
                      value={workforceRule}
                      onChange={(e) => setWorkforceRule(e.target.value)}
                      className="input-style"
                      disabled={loading || !selectedProjectId}
                    >
                      {workforceRules.map((rule) => (
                        <option key={rule} value={rule}>
                          {rule}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Org Level Display */}
                  {/* <div>
                    <label
                      htmlFor="orgLevelDisplay"
                      className="block text-sm font-medium"
                    >
                      Org Level Display <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="orgLevelDisplay"
                      type="number"
                      value={orgLevelDisplay}
                      onChange={(e) => setOrgLevelDisplay(parseInt(e.target.value, 10))}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}
                  {/* closing period */}
                  {/* <div>
                    <label
                      htmlFor="closingPeriod"
                      className="block text-sm font-medium"
                    >
                      Closing Period <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="closingPeriod"
                      type="date"
                      value={closingPeriod}
                      onChange={(e) => setClosingPeriod(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !selectedProjectId}
                    />
                  </div> */}
                </div>

                {/* Right Column (Checkboxes) */}
                {/* Adjusted space-y-4 to space-y-5 to match left column if desired, or keep at space-y-4 for slightly tighter checkbox groups */}
                <div className="flex flex-col gap-y-1 ">
                  {" "}
                  {/* Adjusted to space-y-5 for consistency */}
                  {/* Unlock EAC Last Closed Period */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="unlockEACLastClosedPeriod"
                      type="checkbox"
                      checked={unlockEACLastClosedPeriod}
                      onChange={(e) =>
                        setUnlockEACLastClosedPeriod(e.target.checked)
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="unlockEACLastClosedPeriod"
                      className="text-sm"
                    >
                      Unlock EAC Last Closed Period
                    </label>
                  </div> */}
                  {/* Resource Budget Commit Flag Default */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="resourceBudgetCommitFlagDefault"
                      type="checkbox"
                      checked={resourceBudgetCommitFlagDefault}
                      onChange={(e) =>
                        setResourceBudgetCommitFlagDefault(e.target.checked)
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="resourceBudgetCommitFlagDefault"
                      className="text-sm"
                    >
                      Resource Budget Commit Flag Default
                    </label>
                  </div> */}
                  {/* Import Budget/EACs from Excel Commit Flag Default */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="importBudgetEACsFromExcelCommitFlagDefault"
                      type="checkbox"
                      checked={importBudgetEACsFromExcelCommitFlagDefault}
                      onChange={(e) =>
                        setImportBudgetEACsFromExcelCommitFlagDefault(
                          e.target.checked,
                        )
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="importBudgetEACsFromExcelCommitFlagDefault"
                      className="text-sm"
                    >
                      Import Budget/EACs from Excel Commit Flag Default
                    </label>
                  </div> */}
                  {/* Import New Business Budget from Excel Commit Flag */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="importNewBusinessBudgetFromExcelCommitFlag"
                      type="checkbox"
                      checked={importNewBusinessBudgetFromExcelCommitFlag}
                      onChange={(e) =>
                        setImportNewBusinessBudgetFromExcelCommitFlag(
                          e.target.checked,
                        )
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="importNewBusinessBudgetFromExcelCommitFlag"
                      className="text-sm"
                    >
                      Import New Business Budget from Excel Commit Flag
                    </label>
                  </div> */}
                  {/* Check the Project Budget "Enable Subtask Row Hide" option by default */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault"
                      type="checkbox"
                      checked={
                        checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault
                      }
                      onChange={(e) =>
                        setCheckTheProjectBudgetEnableSubtaskRowHideOptionByDefault(
                          e.target.checked,
                        )
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="checkTheProjectBudgetEnableSubtaskRowHideOptionByDefault"
                      className="text-sm"
                    >
                      Check the Project Budget "Enable Subtask Row Hide" option
                      by default
                    </label>
                  </div> */}
                  {/* Enable Project "Hide Bud/EAC" */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="enableProjectHideBudEAC"
                      type="checkbox"
                      checked={enableProjectHideBudEAC}
                      onChange={(e) =>
                        setEnableProjectHideBudEAC(e.target.checked)
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="enableProjectHideBudEAC"
                      className="text-sm"
                    >
                      Enable Project "Hide Bud/EAC"
                    </label>
                  </div> */}
                  {/* Show Budget/EAC Only Default */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="showBudEACOnlyDefault"
                      type="checkbox"
                      checked={showBudEACOnlyDefault}
                      onChange={(e) =>
                        setShowBudEACOnlyDefault(e.target.checked)
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label htmlFor="showBudEACOnlyDefault" className="text-sm">
                      Show Budget/EAC Only Default
                    </label>
                  </div> */}
                  {/* Enable Budget Auto Inspect */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="enableBudgetAutoInspect"
                      type="checkbox"
                      checked={enableBudgetAutoInspect}
                      onChange={(e) =>
                        setEnableBudgetAutoInspect(e.target.checked)
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="enableBudgetAutoInspect"
                      className="text-sm"
                    >
                      Enable Budget Auto Inspect
                    </label>
                  </div> */}
                  {/* Project Budget Sequential Locking */}
                  {/* <div className="flex items-center space-x-2">
                    <input
                      id="projectBudgetSequentialLocking"
                      type="checkbox"
                      checked={projectBudgetSequentialLocking}
                      onChange={(e) =>
                        setProjectBudgetSequentialLocking(e.target.checked)
                      }
                      className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      disabled={loading || !selectedProjectId}
                    />
                    <label
                      htmlFor="projectBudgetSequentialLocking"
                      className="text-sm"
                    >
                      Project Budget Sequential Locking
                    </label>
                  </div> */}
                </div>
              </div>
            </div>
          )}
          {activeTab === "displaySettings" && (
            <div>
              {/* Changed max-w-5xl to w-full px-8 for wider display */}
              <div className="w-full space-y-2 ">
                {/* Changed text-center to text-left */}
                {/* <div className="p-4  flex items-center justify-between rounded-sm bg-white">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Cog size={20} className="text-blue-500" />
              Display Settings
            </h2>
        </div> */}
                {/* Added bg-gray-50, p-4, rounded-lg, border, and border-gray-300 to the grid container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-white p-4 rounded-sm">
                  {/* Left Column Fields */}
                  <div className="space-y-4">
                    {" "}
                    {/* No changes to this inner div */}
                    {/* Budget Header Date Format (Existing) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="budgetHeaderDateFormat"
                        className="input-label"
                      >
                        Budget Header Date Format{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="budgetHeaderDateFormat"
                        value={budgetHeaderDateFormat}
                        onChange={(e) =>
                          setBudgetHeaderDateFormat(e.target.value)
                        }
                        className="input-style"
                      >
                        <option value="">Select</option>
                        {dateFormatOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Report Header Date Format - Org (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="reportHeaderDateFormatOrg"
                        className="input-label"
                      >
                        Report Header Date Format - Org
                      </label>
                      <input
                        id="reportHeaderDateFormatOrg"
                        type="text"
                        value={reportHeaderDateFormatOrg}
                        onChange={(e) =>
                          setReportHeaderDateFormatOrg(e.target.value)
                        }
                        className="input-style"
                      />
                    </div>
                    {/* Report Header Date Format - Project (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="reportHeaderDateFormatProject"
                        className="input-label"
                      >
                        Report Header Date Format - Project
                      </label>
                      <select
                        id="reportHeaderDateFormatProject"
                        value={reportHeaderDateFormatProject}
                        onChange={(e) =>
                          setReportHeaderDateFormatProject(e.target.value)
                        }
                        className="input-style"
                      >
                        {projectDateFormatOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Drop-Down List Date Format (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="dropdownListDateFormat"
                        className="input-label"
                      >
                        Drop-Down List Date Format
                      </label>
                      <select
                        id="dropdownListDateFormat"
                        value={dropdownListDateFormat}
                        onChange={(e) =>
                          setDropdownListDateFormat(e.target.value)
                        }
                        className="input-style"
                      >
                        {dropDownListDateFormatOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Report Precision Dollar (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="reportPrecisionDollar"
                        className="input-label"
                      >
                        Report Precision Dollar
                      </label>
                      <input
                        id="reportPrecisionDollar"
                        type="text" // Using text to allow empty or partial numeric input
                        value={reportPrecisionDollar}
                        onChange={handleNumericInput(setReportPrecisionDollar)}
                        className="input-style"
                      />
                    </div>
                    {/* Report Precision Hour (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="reportPrecisionHour"
                        className="input-label"
                      >
                        Report Precision Hour
                      </label>
                      <input
                        id="reportPrecisionHour"
                        type="text"
                        value={reportPrecisionHour}
                        onChange={handleNumericInput(setReportPrecisionHour)}
                        className="input-style"
                      />
                    </div>
                    {/* Report Precision Percent (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="reportPrecisionPercent"
                        className="input-label"
                      >
                        Report Precision Percent{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="reportPrecisionPercent"
                        type="text"
                        value={reportPrecisionPercent}
                        onChange={handleNumericInput(setReportPrecisionPercent)}
                        className="input-style"
                      />
                    </div>
                    {/* PO Lag Days (NEW) */}
                    <div className="label-input-div">
                      <label htmlFor="poLagDays" className="input-label">
                        PO Lag Days <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="poLagDays"
                        type="text"
                        value={poLagDays}
                        onChange={handleNumericInput(setPoLagDays)}
                        className="input-style"
                      />
                    </div>
                  </div>

                  {/* Right Column Checkboxes and other fields */}
                  <div className="space-y-4 md:mt-0">
                    {/* Financial Statement Code (NEW) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="financialStatementCode"
                        className="input-label"
                      >
                        Financial Statement Code{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="financialStatementCode"
                        type="text"
                        value={financialStatementCode}
                        onChange={(e) =>
                          setFinancialStatementCode(e.target.value)
                        }
                        className="input-style"
                      />
                    </div>
                    {/* Report Variance Calculation in favor of (Existing) */}
                    <div className="label-input-div">
                      <label
                        htmlFor="reportVarianceCalculation"
                        className="input-label"
                      >
                        Report Variance Calculation in favor of{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="reportVarianceCalculation"
                        value={reportVarianceCalculation}
                        onChange={(e) =>
                          setReportVarianceCalculation(e.target.value)
                        }
                        className="input-style"
                      >
                        <option value="">Select</option>
                        {varianceCalculationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>{" "}
                    <div className="label-input-div">
                      <label
                        htmlFor="pendingChangesReportingMethod"
                        className="input-label"
                      >
                        Pending Changes Reporting Method
                      </label>
                      <select
                        id="pendingChangesReportingMethod"
                        value={pendingChangesReportingMethod}
                        onChange={(e) =>
                          setPendingChangesReportingMethod(e.target.value)
                        }
                        className="input-style"
                      >
                        {pendingChangesReportingMethodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* No changes to this inner div */}
                    {/* Checkboxes */}
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center space-x-2">
                        <input
                          id="includeInactiveOrganizations"
                          type="checkbox"
                          checked={includeInactiveOrganizations}
                          onChange={(e) =>
                            setIncludeInactiveOrganizations(e.target.checked)
                          }
                          className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="includeInactiveOrganizations"
                          className="text-sm"
                        >
                          Include Inactive Organizations in Lookups and dropdown
                          lists
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="includeInactiveVendors"
                          type="checkbox"
                          checked={includeInactiveVendors}
                          onChange={(e) =>
                            setIncludeInactiveVendors(e.target.checked)
                          }
                          className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="includeInactiveVendors"
                          className="text-sm"
                        >
                          Include Inactive Vendors in Lookups and dropdown lists
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="includeEmployeeVendors"
                          type="checkbox"
                          checked={includeEmployeeVendors}
                          onChange={(e) =>
                            setIncludeEmployeeVendors(e.target.checked)
                          }
                          className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="includeEmployeeVendors"
                          className="text-sm"
                        >
                          Include Employee Vendors in Vendor Lookups and
                          dropdown lists
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="includeVendorEmployees"
                          type="checkbox"
                          checked={includeVendorEmployees}
                          onChange={(e) =>
                            setIncludeVendorEmployees(e.target.checked)
                          }
                          className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="includeVendorEmployees"
                          className="text-sm"
                        >
                          Include Vendor Employees in Vendor Lookups and
                          dropdown lists
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="includeCostOfMoneyRevenueFee"
                          type="checkbox"
                          checked={includeCostOfMoneyRevenueFee}
                          onChange={(e) =>
                            setIncludeCostOfMoneyRevenueFee(e.target.checked)
                          }
                          className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="includeCostOfMoneyRevenueFee"
                          className="text-sm"
                        >
                          Include Cost of Money Revenue Fee
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="displayDetailAccounts"
                          type="checkbox"
                          checked={displayDetailAccounts}
                          onChange={(e) =>
                            setDisplayDetailAccounts(e.target.checked)
                          }
                          className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label
                          htmlFor="displayDetailAccounts"
                          className="text-sm"
                        >
                          Display Detail Accounts in Active Level Reports and
                          PSR
                        </label>
                      </div>
                    </div>
                    {/* Pending section */}
                    <div className="mt-4">
                      <span className="input-label">Pending</span>
                      <div className="flex flex-col gap-y-1">
                        <div className="flex items-center space-x-2">
                          <input
                            id="includePendingApprovedRequisitions"
                            type="checkbox"
                            checked={includePendingApprovedRequisitions}
                            onChange={(e) =>
                              setIncludePendingApprovedRequisitions(
                                e.target.checked,
                              )
                            }
                            className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label
                            htmlFor="includePendingApprovedRequisitions"
                            className="text-sm"
                          >
                            Include Pending/Approved Requisitions
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            id="includeUnreleasedBlanketPO"
                            type="checkbox"
                            checked={includeUnreleasedBlanketPO}
                            onChange={(e) =>
                              setIncludeUnreleasedBlanketPO(e.target.checked)
                            }
                            className="rounded-md  h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label
                            htmlFor="includeUnreleasedBlanketPO"
                            className="text-sm"
                          >
                            Include Unreleased Blanket PO Amount in Pending
                          </label>
                        </div>
                      </div>
                    </div>
                    {/* Pending Changes Reporting Method (NEW) */}
                    {/* <div className="flex justify-end mt-6">
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="bg-[#17414d] text-white group-hover:text-gray font-semibold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                      >
                        Save Settings
                      </button>
                    </div> */}
                  </div>
                </div>

                {/* Submit button for this standalone form */}
              </div>
            </div>
          )}
          {activeTab === "versionCodeType" && (
  <div>
    <div className="flex justify-end items-center mb-6">
      <button
        onClick={() => openForm()}
        className="btn1 btn-blue flex items-center gap-1"
        disabled={isSubmitting}
      >
        <Plus className="w-4 h-4" />
        <span>Add Version Code</span>
      </button>
    </div>

    {/* Form Section */}
    {isFormOpen && (
      <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">
            {editingVersion ? `Edit Version: ${editingVersion.id}` : "New Version Code"}
          </h3>
          <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div className="flex flex-col gap-1">
              <label className="input-label">Version Code</label>
              <input
                type="text"
                name="id"
                value={newVersion.id}
                onChange={handleInputChange}
                className="input-style"
                placeholder="e.g., V1, BURDEN_2024"
                required
                disabled={isSubmitting}
              />
            </div> */}
            <div className="flex flex-col gap-1">
              <label className="input-label">Version Code</label>
              <input
                type="text"
                name="versionCodeValue"
                value={newVersion.versionCodeValue}
                onChange={handleInputChange}
                className="input-style"
                placeholder="Enter description..."
                required
                disabled={isSubmitting}
              />
            </div>
            {/* <div className="flex flex-col gap-1">
              <label className="input-label">Description</label>
              <input
                type="text"
                name="versionCodeValue"
                value={newVersion.versionCodeValue}
                onChange={handleInputChange}
                className="input-style"
                placeholder="Enter description..."
                required
                disabled={isSubmitting}
              />
            </div> */}
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <div className="flex gap-2">
            <button type="submit" className="btn1 btn-blue" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingVersion ? "Update Version" : "Save Version"}
            </button>
            <button type="button" onClick={closeForm} className="btn1 bg-gray-200 text-gray-700 hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}

    {/* Table Section */}
    <div className="overflow-x-auto border border-gray-300 rounded">
      <table className="min-w-full table">
        <thead className="thead">
          <tr>
            <th className="th-thead">Version Code</th>
            {/* <th className="th-thead">Description</th> */}
            {canEdit("globalConfiguration") && <th className="th-thead">Actions</th>}
          </tr>
        </thead>
        <tbody className="tbody">
          {version.map((version) => (
            <tr key={version.id} className="hover:bg-gray-50">
              {/* <td className="tbody-td">{version.id}</td> */}
              <td className="tbody-td">{version.versionCodeValue}</td>
              {/* <td className="tbody-td">{version.versionCodeValue}</td> */}
              {canEdit("globalConfiguration") && <td className="tbody-td">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => openForm(version)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(version)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>}
            </tr>
          ))}
          {version.length === 0 && (
            <tr>
              <td colSpan="3" className="tbody-td text-center py-8 text-gray-500">
                No Version Codes found. Click "Add Version Code" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
        </div>
        

        {/* Submit button for the whole form - can be moved inside each tab if needed */}
        {/* <div className="flex justify-end mt-6 h-10">
          <button
            type="button"
            onClick={handleSaveAllSettings}
            className="bg-[#17414d] text-white group-hover:text-gray font-semibold py-2.5 px-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Save Setting
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default LaborForm;
