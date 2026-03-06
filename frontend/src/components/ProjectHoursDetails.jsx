import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/solid";
import axios from "axios";
import Warning from "./Warning";
import EmployeeSchedule from "./EmployeeSchedule";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";
import { formatDate } from "./utils";
import {
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "warning", label: "Warning" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" },
  // { key: "orgId", label: "Organization" },
  { key: "orgId", label: "Org ID" },
  { key: "orgName", label: "Org Name" },
  { key: "glcPlc", label: "PLC" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "perHourRate", label: "Hour Rate" },
  { key: "effectiveDate", label: "Escalation Month" },
  { key: "esc_Percent", label: "Esc Rate(%)" },
  { key: "total", label: "Total" },
  
];

const ID_TYPE_OPTIONS = [
  { value: "", label: "Select ID Type" },
  { value: "Employee", label: "Employee" },
  { value: "Vendor", label: "Vendor" },
  // { value: "Vendor", label: "Vendor Employee" },
  { value: "VendorEmployee", label: "Vendor Employee" },
  { value: "PLC", label: "PLC" },
  { value: "Other", label: "Other" },
];

export const HOURS_EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "warning", label: "Warning" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" },
  { key: "orgId", label: "Organization" },
  { key: "glcPlc", label: "PLC" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "perHourRate", label: "Hour Rate" },
  { key: "effectiveDate", label: "Effective Dt" },
  { key: "esc_Percent", label: "Esc Rate(%)" },
  { key: "total", label: "Total" },
];

// in ConfigureField parent:

const ROW_HEIGHT_DEFAULT = 24;

// function isMonthEditable(duration, closedPeriod, planType) {
//   if (planType !== "EAC") return true;
//   if (!closedPeriod) return true;
//   const closedDate = new Date(closedPeriod);
//   if (isNaN(closedDate)) return true;
//   const durationDate = new Date(duration.year, duration.monthNo - 1, 1);
//   const closedMonth = closedDate.getMonth();
//   const closedYear = closedDate.getFullYear();
//   const durationMonth = durationDate.getMonth();
//   const durationYear = durationDate.getFullYear();
//   return (
//     durationYear > closedYear ||
//     (durationYear === closedYear && durationMonth > closedMonth)
//   );
// }

const geistSansStyle = { fontFamily: "'Geist', 'Geist Fallback', sans-serif" };

const hoursFormatDateDisplay = (value) => {
  if (!value) return "N/A"; // 1. Check for YYYY-MM-DD format (like from date picker)
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-"); // Output MM/DD/YYYY directly from the string parts
    return `${month}/${day}/${year}`;
  } // 2. Fallback for ISO/other formats, try to format as UTC date string to avoid timezone shift
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "N/A"; // Use UTC getter methods to prevent local timezone shift
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1; // Month is 0-indexed
    const d = date.getUTCDate(); // Format as MM/DD/YYYY
    return `${m < 10 ? "0" + m : m}/${d < 10 ? "0" + d : d}/${y}`;
  } catch (e) {
    return "N/A";
  }
};


const ProjectHoursDetails = forwardRef(
  (
    {
      planId,
      projectId,
      status,
      planType,
      closedPeriod,
      startDate,
      endDate,
      templateId,
      fiscalYear,
      onSaveSuccess,
      onColumnTotalsChange,
      setRefreshPool,
      refreshKey,
      allData,
      allOrgData,
      isClosedPeriodEditable,
      allForcastData,
      durations,
      setIsDurationhrLoading,
      isDurationhrLoading,
      groupCd,
      canView,
      canEdit
    },
    ref,
  ) => {
    // ADD THIS RIGHT HERE - Normalize fiscal year
    const normalizedFiscalYear =
      fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();
    // ADD THIS BLOCK AFTER normalizedFiscalYear definition:

    // console.log("FISCAL YEAR DEBUG:", fiscalYear, "Normalized:", normalizedFiscalYear);

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const isAdmin = currentUser.role?.toLowerCase() === "admin";

    // const [durations, setDurations] = useState([]);
    const [isDurationLoading, setIsDurationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hiddenRows, setHiddenRows] = useState({});
    const [inputValues, setInputValues] = useState({});
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findValue, setFindValue] = useState("");
    const [replaceValue, setReplaceValue] = useState("");
    const [replaceScope, setReplaceScope] = useState("all");
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [selectedColumnKey, setSelectedColumnKey] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
  const [escalationPercent, setEscalationPercent] = useState(0);
  const [escalationMonth, setEscalationMonth] = useState(0);  
  const [escalationPercentId, setEscalationPercentId] = useState(0);
  const [escalationMonthId, setEscalationMonthId] = useState(0);  
        const [accountOptions, setAccountOptions] = useState([]);
  
    
      

    const [hourPage, setHourPage] = useState(1);
    const [totalPages, setTotalPages] = useState(10);

    const [newEntry, setNewEntry] = useState({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: "",
      acctId: "",
      orgId: "",
      plcGlcCode: "",
      perHourRate: "",
      status: "Act",
      effectiveDate: "",
      esc_Percent: 0,
    });
    const [newEntryPeriodHours, setNewEntryPeriodHours] = useState({});
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessageText, setSuccessMessageText] = useState("");
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [laborAccounts, setLaborAccounts] = useState([]);
    const [plcOptions, setPlcOptions] = useState([]);
    const [plcSearch, setPlcSearch] = useState("");
    const [showFillValues, setShowFillValues] = useState(false);
    const [fillMethod, setFillMethod] = useState("None");
    const [fillHours, setFillHours] = useState(0.0);
    const [sourceRowIndex, setSourceRowIndex] = useState(null);
    const [editedEmployeeData, setEditedEmployeeData] = useState({});
    const [localEmployees, setLocalEmployees] = useState([]);
    const [fillStartDate, setFillStartDate] = useState(startDate);
    const [fillEndDate, setFillEndDate] = useState(endDate);
    const [isLoading, setIsLoading] = useState(false);
    const [autoPopulatedPLC, setAutoPopulatedPLC] = useState(false); // Track if PLC is auto-populated
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [orgSearch, setOrgSearch] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedEmployeeScheduleId, setSelectedEmployeeScheduleId] =
      useState(null);
    const [filteredPlcOptions, setFilteredPlcOptions] = useState([]);
    const [accountOptionsWithNames, setAccountOptionsWithNames] = useState([]);
    const [modifiedHours, setModifiedHours] = useState({});
    const [hasUnsavedHoursChanges, setHasUnsavedHoursChanges] = useState(false);
    const [hasUnsavedEmployeeChanges, setHasUnsavedEmployeeChanges] =
      useState(false);
    const [updateAccountOptions, setUpdateAccountOptions] = useState([]);
    const [updateOrganizationOptions, setUpdateOrganizationOptions] = useState(
      [],
    );
    const [updatePlcOptions, setUpdatePlcOptions] = useState([]);
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [selectedEmployeeIdForWarning, setSelectedEmployeeIdForWarning] =
      useState(null);
    const [localWarnings, setLocalWarnings] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showCopyButton, setShowCopyButton] = useState(false);
    const [hasClipboardData, setHasClipboardData] = useState(false);
    const [copiedRowsData, setCopiedRowsData] = useState([]);
    const [newEntries, setNewEntries] = useState([]);
    const [newEntryPeriodHoursArray, setNewEntryPeriodHoursArray] = useState(
      [],
    );
    const [copiedMonthMetadata, setCopiedMonthMetadata] = useState([]);

    const [hasUnsavedPastedChanges, setHasUnsavedPastedChanges] =
      useState(false);

    const [pastedEntrySuggestions, setPastedEntrySuggestions] = useState({});
    const [pastedEntryAccounts, setPastedEntryAccounts] = useState({});
    const [pastedEntryOrgs, setPastedEntryOrgs] = useState({});
    const [pastedEntryPlcs, setPastedEntryPlcs] = useState({});

    const [showFindOnly, setShowFindOnly] = useState(false);
    const [findMatches, setFindMatches] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

    const [cachedProjectData, setCachedProjectData] = useState(null);
    const [cachedOrgData, setCachedOrgData] = useState(null);
    const [sortConfig, setSortConfig] = useState({
      key: null,
      direction: "asc",
    });
    const [showEmployeeSchedule, setShowEmployeeSchedule] = useState(false);

    const [selectedSourceIdx, setSelectedSourceIdx] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // const [isClosedPeriodEditable, setIsClosedPeriodEditable] = useState();
    const [laborCostByMonth, setLaborCostByMonth] = useState([]);

    const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
    const [findReplacePos, setFindReplacePos] = useState({ x: 0, y: 0 });

    // const [selectedSourceId, setSelectedSourceId] = useState("");

    const [checkedRows, setCheckedRows] = useState(new Set());
    // const [showCopyButton, setShowCopyButton] = useState(false);
    const [checkedColumns, setCheckedColumns] = useState(new Set());
    const [goToValue, setGoToValue] = useState(hourPage)
    const [ pageSize, setPageSize] = useState(15)

    const dragItem = useRef();

//     const handleDrag = (e, setPos, currentPos) => {
//   // Prevent text selection while dragging
//   e.preventDefault();
  
//   const startX = e.clientX - currentPos.x;
//   const startY = e.clientY - currentPos.y;

//   const onMouseMove = (moveEvent) => {
//     setPos({
//       x: moveEvent.clientX - startX,
//       y: moveEvent.clientY - startY
//     });
//   };

//   const onMouseUp = () => {
//     document.removeEventListener("mousemove", onMouseMove);
//     document.removeEventListener("mouseup", onMouseUp);
//   };

//   document.addEventListener("mousemove", onMouseMove);
//   document.addEventListener("mouseup", onMouseUp);
// };

//     const handleMouseDown = (e) => {
//   const element = dragItem.current;
//   if (!element) return;

//   let startX = e.clientX - modalPos.x;
//   let startY = e.clientY - modalPos.y;

//   const mouseMoveHandler = (moveEvent) => {
//     setModalPos({
//       x: moveEvent.clientX - startX,
//       y: moveEvent.clientY - startY,
//     });
//   };

//   const mouseUpHandler = () => {
//     document.removeEventListener("mousemove", mouseMoveHandler);
//     document.removeEventListener("mouseup", mouseUpHandler);
//   };

//   document.addEventListener("mousemove", mouseMoveHandler);
//   document.addEventListener("mouseup", mouseUpHandler);
// };

    //   useEffect(() => {
    //     setFillStartDate(startDate);
    //     setFillEndDate(endDate);
    // }, [startDate, endDate]);


      const handlePageClick = (page) => {
    if (page < 1 || page > totalPages) return;
    setHourPage(page);
  };
 
  const handleGoTo = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(goToValue);
      if (val >= 1 && val <= totalPages) {
        setHourPage(val);
        // setGoToValue("");
      }
    }
  };


const handleDrag = (e, setPos, currentPos) => {
 
  const isInteractive = e.target.closest('input, select, button, label, .pointer-events-auto');
  if (isInteractive) return;

  e.preventDefault(); // Only prevent default if we are actually dragging
  
  const startX = e.clientX - currentPos.x;
  const startY = e.clientY - currentPos.y;

  const onMouseMove = (moveEvent) => {
    setPos({
      x: moveEvent.clientX - startX,
      y: moveEvent.clientY - startY
    });
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};


 useEffect(() => {
    const fetchOrgConfig = async () => {
      
      try {
        const res = await fetch(
          `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
        );
        if (!res.ok) throw new Error("Failed to fetch organization config");
        const configArray = await res.json();

        // Fetch values by name
        // const closingConfig = configArray.find(
        //   (cfg) => cfg.name === "closing_period"
        // );
        const percentConfig = configArray.find(
          (cfg) => cfg.name === "escallation_percent"
        );
        const monthConfig = configArray.find(
          (cfg) => cfg.name === "escallation_month"
        );

        // setClosingPeriodId(closingConfig?.id || 0);
        setEscalationPercentId(percentConfig?.id || 0);
        setEscalationMonthId(monthConfig?.id || 0);

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
        setEscalationPercent(percentConfig?.value || "");
        setEscalationMonth(monthConfig?.value?.toString() || "");
      } catch (err) {
        // setClosingPeriod("");
        setEscalationPercent("");
        setEscalationMonth("");
      } 
    };
    fetchOrgConfig();
  }, []);
    

    // useEffect(() => {
    //   const fetchConfig = async () => {
    //     try {
    //       const response = await axios.get(
    //         `${backendUrl}/api/Configuration/GetConfigValueByName/isClosedPeriodEditable`,
    //       );
    //       console.log('hours', response.data)
    //       setIsClosedPeriodEditable(response.data?.value);
    //     } catch (err) {
    //       console.warn("Config fetch failed, defaulting to editable:", err);
    //       setIsClosedPeriodEditable(true);
    //     }
    //   };
    //   fetchConfig();
    // }, [planType]); // Re-fetch if planType changes

    // REPLACE the fetchAndSetLaborCost function:

    const fetchAndSetLaborCost = async () => {
      try {
        // ✅ FIXED: Pass planType correctly to the API
        const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

        const response = await axios.get(
          `${backendUrl}/Forecast/GetMonthlyData?planID=${planId}&planType=${apiPlanType}`,
        );

        const data = response?.data;

        if (!Array.isArray(data)) {
          setLaborCostByMonth([]);
          return;
        }

        // ✅ FIXED: Map the response correctly with all fields
        const transformed = data.map((item) => ({
          year: item.year,
          month: item.month,
          laborCost: Number(item.laborCost) || 0,
          nonLaborCost: Number(item.nonLaborCost) || 0,
          fringe: Number(item.fringe) || 0,
          gna: Number(item.gna) || 0,
          overhead: Number(item.overhead) || 0,
          revenue: Number(item.revenue) || 0,
          hours: Number(item.hours) || Number(item.hr) || 0, // ✅ Handle both 'hours' and 'hr' fields
          mnh: Number(item.mnh) || 0,
        }));

        setLaborCostByMonth(transformed);
      } catch (error) {
        console.error("Failed to fetch labor cost data", error);
        setLaborCostByMonth([]);
      }
    };

    useEffect(() => {
  if (showFindReplace && checkedRows.size > 0) {
    setReplaceScope("checked-rows");
  }
}, [checkedRows.size, showFindReplace]);


   useImperativeHandle(ref, () => ({
      newEntries,
      hasUnsavedEmployeeChanges,
      hasUnsavedHoursChanges,
      handleMasterSave,
      fetchEmployees
    }));

     const getMonthEndDate = (yearMonth) => {
  if (!yearMonth) return "";

  const [year, month] = yearMonth.split("-").map(Number);

  // month is 1-based → Date expects 0-based
  const lastDay = new Date(year, month, 0).getDate();

  return `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
};

const handleDelete = async() => {
  const selectedIndices = Array.from(checkedRows);
                        const idsToDelete = selectedIndices
                          .map((index) => localEmployees[index]?.emple_Id)
                          .filter((id) => id !== undefined);

                        if (idsToDelete.length === 0) {
                          toast.error("No valid records selected for deletion");
                          return;
                        }

                        if (
                          window.confirm(
                            `Are you sure you want to delete ${idsToDelete.length} selected record(s)?`,
                          )
                        ) {
                          setIsLoading(true);
                          setRefreshPool(true);
                          try {
                            // Execute all delete requests in parallel
                            await Promise.all(
                              idsToDelete.map((id) =>
                                axios.delete(
                                  `${backendUrl}/Employee/DeleteEmployee/${id}`,
                                ),
                              ),
                            );

                            toast.success(
                              "Selected record(s) deleted successfully!",
                            );

                            // Reset selection states
                            setCheckedRows(new Set());
                            setShowCopyButton(false);
                            setSelectedEmployeeId(null);
                            setSelectedEmployeeScheduleId(null);

                            // Refresh the data grid
                            await fetchEmployees();
                          } catch (err) {
                            toast.error(
                              "Failed to delete some records. Please try again.",
                            );
                            console.error("Multiple delete error:", err);
                          } finally {
                            setIsLoading(false);
                            setRefreshPool(false);
                          }
                        }
}

// Assume escalationMonth is "2" (from your API response)
const currentYear = new Date().getFullYear(); // 2026
const monthStr = String(escalationMonth).padStart(2, '0'); // "02"
// Construct the YYYY-MM string
const yearMonth = `${currentYear}-${monthStr}`; // "2026-02"
// Now pass it to your existing function
const defaultEffectiveDate = getMonthEndDate(yearMonth); 
// console.log(defaultEffectiveDate); // Output: "2026-02-28"

    // Update useEffect to include planType dependency:
    useEffect(() => {
      if(allForcastData) setLaborCostByMonth(allForcastData)
    }, [allForcastData]);

    function isMonthEditable(duration, closedPeriod, planType) {
      if (planType !== "EAC") return true;
      if (!closedPeriod) return true;

      // New API check for config value
      if (!isClosedPeriodEditable) return false;

      const closedDate = new Date(closedPeriod);
      if (isNaN(closedDate)) return true;
      const durationDate = new Date(duration.year, duration.monthNo - 1, 1);
      const closedMonth = closedDate.getMonth();
      const closedYear = closedDate.getFullYear();
      const durationMonth = durationDate.getMonth();
      const durationYear = durationDate.getFullYear();
      return (
        durationYear > closedYear ||
        (durationYear === closedYear && durationMonth > closedMonth)
      );
    }

    useEffect(() => {
      // This ensures that when a new plan is selected, or manual dates are entered,
      // the local state used by the fill tool correctly reflects the latest props.
      setFillStartDate(startDate);
      setFillEndDate(endDate);
    }, [startDate, endDate]);

    const sortedEmployees = useMemo(() => {
      if (!sortConfig.key) return localEmployees;

      const sorted = [...localEmployees];

      if (sortConfig.key === "acctId") {
        sorted.sort((a, b) => {
          const aVal = (a.emple?.accId ?? "").toString().toLowerCase();
          const bVal = (b.emple?.accId ?? "").toString().toLowerCase();
          if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      return sorted;
    }, [localEmployees, sortConfig]);

    const handleSort = (key) => {
      setSortConfig((prev) => {
        if (prev.key === key) {
          return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
        }
        return { key, direction: "asc" };
      });
    };

    const getSortIcon = (key) => {
      if (sortConfig.key !== key) return "↕";
      return sortConfig.direction === "asc" ? "↑" : "↓";
    };

    // useEffect(() => {
    //     // This ensures that when a new plan is selected, or manual dates are entered,
    //     // the local state used by the fill tool correctly reflects the latest props.
    //     setFillStartDate(startDate);
    //     setFillEndDate(endDate);
    // }, [startDate, endDate]);

    const sortedDurations = useMemo(() => {
      return [...durations]
        .filter((d) => {
          if (normalizedFiscalYear === "All") return true;
          return d.year === parseInt(normalizedFiscalYear);
        })
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.monthNo - b.monthNo;
        });
    }, [durations, normalizedFiscalYear]);

    const firstTableRef = useRef(null);
    const secondTableRef = useRef(null);
    const isPastingRef = useRef(false);

    const debounceTimeout = useRef(null);

    const scrollingLock = useRef(false);
    const [editingPerHourRateIdx, setEditingPerHourRateIdx] =
      React.useState(null);
    const [isEditingNewEntry, setIsEditingNewEntry] = React.useState(false);

    const shouldShowCTD = () => {
      if (normalizedFiscalYear === "All") return false;

      const selectedYear = parseInt(normalizedFiscalYear);
      const startYear = parseInt(startDate.split("-")[0]);

      // Don't show CTD if selected year is the Start Date year
      if (selectedYear === startYear) return false;

      // Show CTD only if selected year is at least 2 years after start year
      return selectedYear >= startYear + 2;
    };

    const shouldShowPriorYear = () => {
      if (normalizedFiscalYear === "All") return false;

      const selectedYear = parseInt(normalizedFiscalYear);
      const startYear = parseInt(startDate.split("-")[0]);

      // CRITICAL FIX: Don't show Prior Year if selected year is the Start Date year
      if (selectedYear === startYear) return false;

      // CRITICAL FIX: Show Prior Year for ANY year after start year (including current year like 2025)
      return selectedYear > startYear;
    };

    const syncScroll = (sourceRef, targetRef) => {
      if (!sourceRef.current || !targetRef.current) return;

      if (!scrollingLock.current) {
        scrollingLock.current = true;
        targetRef.current.scrollTop = sourceRef.current.scrollTop;

        setTimeout(() => {
          scrollingLock.current = false;
        }, 0);
      }
    };

    const handleFirstScroll = () => {
      syncScroll(firstTableRef, secondTableRef);
    };

    const handleSecondScroll = () => {
      syncScroll(secondTableRef, firstTableRef);
    };

    const isEditable = status === "In Progress";
    // const isEdit = status === "In Progress";

    const isBudPlan = planType === "BUD" || planType === "NBBUD";

    const isFieldEditable =
      planType === "BUD" || planType === "EAC" || planType === "NBBUD";

    // Add a new empty entry form
    const addNewEntryForm = () => {
      const newEntry = {
        id: "",
        firstName: "",
        lastName: "",
        isRev: false,
        isBrd: false,
        idType: "",
        acctId: "",
        orgId: "",
        plcGlcCode: "",
        perHourRate: "",
        status: "Act",
      };
      setNewEntries((prev) => [...prev, newEntry]);
      setNewEntryPeriodHoursArray((prev) => [...prev, {}]);
    };

    // Remove an entry form
    const removeNewEntryForm = (index) => {
      setNewEntries((prev) => prev.filter((_, i) => i !== index));
      setNewEntryPeriodHoursArray((prev) => prev.filter((_, i) => i !== index));
    };

    // Update a specific entry
    const updateNewEntry = (index, updates) => {
      setNewEntries((prev) =>
        prev.map((entry, i) =>
          i === index ? { ...entry, ...updates } : entry,
        ),
      );
    };

    // Update period hours for a specific entry
    const updateNewEntryPeriodHours = (index, periodHours) => {
      setNewEntryPeriodHoursArray((prev) =>
        prev.map((hours, i) =>
          i === index ? { ...hours, ...periodHours } : hours,
        ),
      );
    };

    // Clear all fields when ID type changes
    useEffect(() => {
      if (isPastingRef.current) {
        return;
      }

      if (newEntry.idType === "PLC") {
        setNewEntry({
          ...newEntry,
          id: "PLC",
          firstName: "",
          lastName: "",
          perHourRate: "",
          orgId: "",
          plcGlcCode: "",
          acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
        });
        setPlcSearch("");
        setAutoPopulatedPLC(false);
      } else if (newEntry.idType !== "") {
        // Clear all fields when switching to any other type
        setNewEntry((prev) => ({
          ...prev,
          id: "",
          firstName: "",
          lastName: "",
          perHourRate: "",
          orgId: "",
          plcGlcCode: "",
          acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
        }));
        setPlcSearch("");
        setAutoPopulatedPLC(false);
      }
    }, [newEntry.idType]);

    // Reset new entry form when planId changes (project/plan change)
    useEffect(() => {
      if (planId) {
        setShowNewForm(false);
        resetNewEntryForm(); // Use the reset function
        setNewEntry({
          id: "",
          firstName: "",
          lastName: "",
          isRev: false,
          isBrd: false,
          idType: "",
          acctId: "",
          orgId: "",
          plcGlcCode: "",
          perHourRate: "",
          status: "Act",
          effectiveDate: "",
          esc_Percent: 0
        });
        setNewEntryPeriodHours({});

        // Clear all related states
        setEmployeeSuggestions([]);
        setLaborAccounts([]);
        setPlcOptions([]);
        setFilteredPlcOptions([]);
        setPlcSearch("");
        setOrgSearch("");
        setAutoPopulatedPLC(false);

        // Clear any save-related states
        setHasUnsavedEmployeeChanges(false);
        setHasUnsavedHoursChanges(false);
        setEditedEmployeeData({});
        setModifiedHours({});
        setInputValues({});

        // Clear UI states
        setShowSuccessMessage(false);
        setSuccessMessageText("");
        setSelectedEmployeeId(null);
        setSelectedRowIndex(null);
        setSelectedColumnKey(null);

        // Clear warning states
        setLocalWarnings({});
        setShowWarningPopup(false);
        setSelectedEmployeeIdForWarning(null);

        // Clear update options
        setUpdateAccountOptions([]);
        setUpdateOrganizationOptions([]);
        setUpdatePlcOptions([]);
      }
    }, [planId]); // This will trigger when planId changes

    const isValidEmployeeId = (id) => {
      if (planType === "NBBUD") return true; // Add this line
      if (!id) return false;
      if (newEntry.idType === "Employee" || newEntry.idType === "Vendor") {
        return !!employeeSuggestions.find((emp) => emp.emplId === id);
      }
      if (newEntry.idType === "Other") {
        return !!employeeSuggestions.find((emp) => emp.emplId === id);
      }
      return true;
    };

    const isValidAccount = (val) => {
      if (planType === "NBBUD") return true; // Add this line
      return !val || laborAccounts.some((acc) => acc.id === val);
    };

    const isValidOrg = (val) => {
      if (planType === "NBBUD") return true; // Add this line
      if (!val) return false;
      const trimmed = val.toString().trim();
      if (!/^[\d.]+$/.test(trimmed)) return false;

      if (organizationOptions.length === 0) return true;

      return organizationOptions.some(
        (opt) => opt.value.toString() === trimmed,
      );
    };

    const isValidOrgForUpdate = (val, updateOptions) => {
      if (planType === "NBBUD") return true; // Add this line
      if (!val) return false;
      const trimmed = val.toString().trim();
      if (!/^[\d.]+$/.test(trimmed)) return false;
      return updateOptions.some((opt) => opt.value.toString() === trimmed);
    };

    const isValidAccountForUpdate = (val, updateOptions) => {
      if (planType === "NBBUD") return true; // Add this line
      if (!val) return false;
      const trimmed = val.toString().trim();
      return updateOptions.some((opt) => opt.id === trimmed);
    };

    const isValidPlc = (val) => {
      if (planType === "NBBUD") return true;
      if (!val) return true;
      if (plcOptions.length === 0) return true;

      const trimmedVal = val.toString().trim();
      const isValid = plcOptions.some((option) => {
        const optionValue = option.value ? option.value.toString().trim() : "";
        return optionValue === trimmedVal;
      });

      return isValid;
    };

    const isValidPlcForUpdate = (val, updateOptions) => {
      if (planType === "NBBUD") return true; // Add this line
      if (!val) return true;
      if (updateOptions.length === 0) return true;
      const trimmed = val.toString().trim();
      return updateOptions.some((option) => option.value === trimmed);
    };

    const formatCurrencyDisplay = (value) => {
      if (value === null || value === undefined || value === "") return "";

      const num = Number(String(value).replace(/,/g, ""));
      if (Number.isNaN(num)) return "";

      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    useEffect(() => {
      // A. Handle Browser Events (Refresh, Tab Close, External Links)
      const handleBeforeUnload = (event) => {
        if (hasUnsavedChanges()) {
          const msg = "Changes you made may not be saved.";
          event.preventDefault();
          event.returnValue = msg; // Standard for modern browsers
          return msg;
        }
      };

      // B. Handle Internal App Navigation (React Router / Tab switching)
      // Note: If your "proceed to another page" uses a state-based tab system
      // inside this component, you should check hasUnsavedChanges() in that toggle function.
      const handleInternalClick = (e) => {
        if (hasUnsavedChanges()) {
          // Find if the clicked element is a link or a navigation button
          const target =
            e.target.closest("a") ||
            e.target.closest('button[data-nav="true"]');
          if (target) {
            const confirmLeave = window.confirm(
              "You have unsaved changes. Do you want to continue without saving?",
            );
            if (!confirmLeave) {
              e.preventDefault();
              e.stopPropagation();
            }
          }
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("click", handleInternalClick, true); // Intercept clicks

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("click", handleInternalClick, true);
      };
    }, [
      newEntry,
      newEntries,
      newEntryPeriodHours,
      inputValues,
      editedEmployeeData,
    ]);

    // Track unsaved changes
    // const hasUnsavedChanges = () => {
    //   const isNewEntryModified =
    //     newEntry.id !== "" ||
    //     newEntry.firstName !== "" ||
    //     newEntry.lastName !== "" ||
    //     newEntry.isRev ||
    //     newEntry.isBrd ||
    //     newEntry.idType !== "" ||
    //     newEntry.acctId !== "" ||
    //     newEntry.orgId !== "" ||
    //     newEntry.plcGlcCode !== "" ||
    //     newEntry.perHourRate !== "" ||
    //     newEntry.status !== "Act";

    //   const isPeriodHoursModified = Object.keys(newEntryPeriodHours).length > 0;
    //   const isInputValuesModified = Object.keys(inputValues).length > 0;
    //   const isEditedEmployeeDataModified =
    //     Object.keys(editedEmployeeData).length > 0;

    //   return (
    //     isNewEntryModified ||
    //     isPeriodHoursModified ||
    //     isInputValuesModified ||
    //     isEditedEmployeeDataModified
    //   );
    // };

    const hasUnsavedChanges = () => {
      const hasMultipleNewEntries = newEntries.length > 0;

      // Check if the single manual entry fields are modified
      const isSingleEntryModified =
        newEntry.id !== "" ||
        newEntry.firstName !== "" ||
        newEntry.idType !== "" ||
        Object.keys(newEntryPeriodHours).length > 0;

      // Check if existing grid hours or employee fields were modified
      const isInputValuesModified = Object.keys(inputValues).length > 0;
      const isEditedEmployeeDataModified =
        Object.keys(editedEmployeeData).length > 0;

      return (
        hasMultipleNewEntries ||
        isSingleEntryModified ||
        isInputValuesModified ||
        isEditedEmployeeDataModified
      );
    };

    // const hasUnsavedChanges = () => {
    //   // 1. Check if the Multiple New Entries array has any items (from "New" button)
    //   const hasMultipleNewEntries = newEntries.length > 0;

    //   // 2. Check if the single manual entry state has typed data
    //   const isSingleEntryModified =
    //     newEntry.id !== "" ||
    //     newEntry.firstName !== "" ||
    //     newEntry.idType !== "" ||
    //     Object.keys(newEntryPeriodHours).length > 0;

    //   // 3. Check if existing grid hours or employee fields were modified
    //   const isInputValuesModified = Object.keys(inputValues).length > 0;
    //   const isEditedEmployeeDataModified =
    //     Object.keys(editedEmployeeData).length > 0;

    //   return (
    //     hasMultipleNewEntries ||
    //     isSingleEntryModified ||
    //     isInputValuesModified ||
    //     isEditedEmployeeDataModified
    //   );
    // };

    // Handle beforeunload event for unsaved changes
    useEffect(() => {
      if (!hasUnsavedChanges()) return;

      const handleBeforeUnload = (event) => {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave without saving?";
        return event.returnValue;
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, [newEntry, newEntryPeriodHours, inputValues, editedEmployeeData]);

    const fetchEmployees = async (resetPage = false) => {
      if (!planId) return;
      console.log('refresh')
      setIsLoading(true);
      if(resetPage) setHourPage(1)
      try {
        const year = new Date().getFullYear();
        const apiFiscalYear = fiscalYear === "All" ? "" : fiscalYear;
        const employeeApi =
          planType === "EAC"
            ? `${backendUrl}/Project/GetEmployeeForecastByPlanIDPaged/${planId}/${apiFiscalYear}?emplid=${searchTerm}&pageNumber=${hourPage}&pageSize=${pageSize}`
            : `${backendUrl}/Project/GetEmployeeForecastByPlanIDPaged/${planId}/${apiFiscalYear}?emplid=${searchTerm}&pageNumber=${hourPage}&pageSize=${pageSize}`;
        // /${searchTerm
        const response = await axios.get(employeeApi);
        setTotalRecords(response.data.totalRecords);
        const ceilValue = Math.ceil(response.data.totalRecords / pageSize);
        setTotalPages(ceilValue);
        setLocalEmployees(
          Array.isArray(response.data.data) ? response.data.data : [],
        );
      } catch (err) {
        setLocalEmployees([]);
        if (err.response && err.response.status === 500) {
          // toast.info("No forecast data available for this plan.", {
          //   toastId: "no-forecast-data",
          //   autoClose: 3000,
          // });
        } else {
          toast.error(
            "Failed to load forecast data: " +
              (err.response?.data?.message || err.message),
            {
              toastId: "forecast-error",
              autoClose: 3000,
            },
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchEmployees();
    }, [planId, planType, hourPage, fiscalYear, pageSize]);
    useEffect(() => {
      if(refreshKey) fetchAndSetLaborCost();
    }, [refreshKey]);

    // useEffect(() => {
    //   const fetchDurations = async () => {
    //     if (!startDate || !endDate) {
    //       setDurations([]);
    //       setIsDurationLoading(false);
    //       return;
    //     }
    //     setIsDurationLoading(true);
    //     setError(null);
    //     try {
    //       console.log(startDate, endDate)
    //       const durationResponse = await axios.get(
    //         `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`,
    //       );
    //       if (!Array.isArray(durationResponse.data)) {
    //         throw new Error("Invalid duration response format");
    //       }
    //       setDurations(durationResponse.data);
    //     } catch (err) {
    //       setError("Failed to load duration data. Please try again.");
    //       toast.error(
    //         "Failed to load duration data: " +
    //           (err.response?.data?.message || err.message),
    //         {
    //           toastId: "duration-error",
    //           autoClose: 3000,
    //         },
    //       );
    //     } finally {
    //       setIsDurationLoading(false);
    //     }
    //   };
    //   fetchDurations();
    // }, [startDate, endDate]);

    // ADD THIS useEffect after your existing useEffects
    // useEffect(() => {
    //   const loadOrganizationOptions = async () => {
    //     if (!showNewForm) return;

    //     try {
    //       const response = await axios.get(
    //         `${backendUrl}/Orgnization/GetAllOrgs`
    //       );
    //       const orgOptions = Array.isArray(response.data)
    //         ? response.data.map((org) => ({
    //             value: org.orgId,
    //             // label: org.orgId,
    //             // orgName: org.orgName,
    //             label: `${org.orgId} - ${org.orgName}`,
    //     orgName: org.orgName,
    //           }))
    //         : [];
    //       setOrganizationOptions(orgOptions);
    //     } catch (err) {
    //       // console.error("Failed to fetch organizations:", err);
    //     }
    //   };

    //   loadOrganizationOptions();
    // }, [showNewForm]);

    // PRE-LOAD organizations when component mounts (NOT just showNewForm)
    // useEffect(() => {
    //   const loadOrganizationOptions = async () => {
    //     try {
    //       const response = await axios.get(backendUrlOrgnizationGetAllOrgs);
    //       const orgOptions = Array.isArray(response.data)
    //         ? response.data.map(org => ({
    //             value: org.orgId,
    //             label: `${org.orgId} - ${org.orgName}`,
    //             orgName: org.orgName,
    //           }))
    //         : [];
    //       setOrganizationOptions(orgOptions);
    //     } catch (err) {
    //       console.error('Failed to fetch organizations', err);
    //     }
    //   };

    //   loadOrganizationOptions();
    // }, []); // Empty deps = run once on mount

    // useEffect(() => {
    //   const loadOrganizations = async () => {
    //     try {
    //       const response = await axios.get(
    //         `${backendUrl}/Orgnization/GetAllOrgs`
    //       );
    //       const orgOptions = Array.isArray(response.data)
    //         ? response.data.map((org) => ({
    //             value: org.orgId,
    //             label: org.orgId,
    //           }))
    //         : [];
    //       console.log(orgOptions);
    //       setOrganizationOptions(orgOptions);
    //     } catch (err) {
    //       console.error("Failed to preload organizations", err);
    //     }
    //   };
    //   loadOrganizations();
    // }, []); // Empty deps = run once on mount

    useEffect(() => {
      const loadOrganizations = async () => {
        try {
          // const response = await axios.get(
          //   `${backendUrl}/Orgnization/GetAllOrgs`,
          // );
          const response = allOrgData || []
          const orgOptions = Array.isArray(response)
            ? response.map((org) => ({
                value: org.orgId,
                label: org.orgId, // FIXED: Include orgName in label
                orgName: org.orgName, // FIXED: Add orgName property
              }))
            : [];
          
          setOrganizationOptions(orgOptions);
        } catch (err) {
          console.error("Failed to preload organizations", err);
        }
      };
      loadOrganizations();
    }, [allOrgData]);

    const ACCOUNT_KEYS = [
      "employeeLaborAccounts",
      "employeeNonLaborAccounts",
      "sunContractorLaborAccounts",
      "subContractorNonLaborAccounts",
      "otherDirectCostLaborAccounts",
      "otherDirectCostNonLaborAccounts",
      "plc",
    ];

useEffect(() => {
  if (!allData) return;

  const projects = Array.isArray(allData) ? allData : [allData];

  const accOptions = projects
    .flatMap((proj) =>
      ACCOUNT_KEYS.flatMap((key) => proj?.[key] || [])
    )
    .map((acc) => ({
      value: acc.accountId,
      label: `${acc.accountId} - ${acc.acctName}`,
      accountName: acc.acctName,
      function: acc.accountFunctionDescription,
      budgetSheet: acc.budgetSheet,
    }))
    // remove duplicates
    .filter(
      (acc, index, self) =>
        index === self.findIndex((a) => a.value === acc.value)
    );

  setAccountOptions(accOptions);

}, [allData]);




    useEffect(() => {
      const initializeUpdateOptions = async () => {
        if (localEmployees.length === 0) return;

        try {
          // Load organizations for updates
          // const orgResponse = await axios.get(
          //   `${backendUrl}/Orgnization/GetAllOrgs`,
          // );
          const orgResponse = allOrgData || []
          const orgOptions = Array.isArray(orgResponse)
            ? orgResponse.map((org) => ({
                value: org.orgId,
                label: org.orgId,
                // label: `${org.orgId} - ${org.orgName}`,
                name: org.orgName,
              }))
            : [];
             
          // Load project data for accounts and PLC options
          if (projectId) {
            try {
              // const response = await axios.get(
              //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
              // );
              // const response = await axios.get(
              //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`,
              // );
              const data = allData || []
              console.log(data)

              // Load ALL account types for updates (including PLC and Other types)
              let allAccounts = [];

              // Employee accounts
              if (
                data?.employeeLaborAccounts &&
                Array.isArray(data?.employeeLaborAccounts)
              ) {
                const employeeAccounts = data?.employeeLaborAccounts.map(
                  (account) => ({
                    id: account.accountId,
                    type: "employee",
                  }),
                );
                allAccounts.push(...employeeAccounts);
              }

              // ADD THIS - Store accounts with names for updates
              let allAccountsWithNames = [];

              if (
                data?.employeeLaborAccounts &&
                Array.isArray(data?.employeeLaborAccounts)
              ) {
                const employeeAccountsWithNames =
                  data?.employeeLaborAccounts.map((account) => ({
                    id: account.accountId,
                    name: account.acctName,
                    type: "employee",
                  }));
                allAccountsWithNames.push(...employeeAccountsWithNames);
              }

              if (
                data?.sunContractorLaborAccounts &&
                Array.isArray(data?.sunContractorLaborAccounts)
              ) {
                const vendorAccountsWithNames =
                  data?.sunContractorLaborAccounts.map((account) => ({
                    id: account.accountId,
                    name: account.acctName,
                    type: "vendor",
                  }));
                allAccountsWithNames.push(...vendorAccountsWithNames);
              }

              if (
                data?.otherDirectCostLaborAccounts &&
                Array.isArray(data?.otherDirectCostLaborAccounts)
              ) {
                const otherAccountsWithNames =
                  data?.otherDirectCostLaborAccounts.map((account) => ({
                    id: account.accountId,
                    name: account.acctName,
                    type: "other",
                  }));
                allAccountsWithNames.push(...otherAccountsWithNames);
              }

              // Remove duplicates from accountsWithNames too
              const uniqueAccountsWithNamesMap = new Map();
              allAccountsWithNames.forEach((acc) => {
                if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
                  uniqueAccountsWithNamesMap.set(acc.id, {
                    id: acc.id,
                    name: acc.name,
                  });
                }
              });
              const uniqueAccountsWithNames = Array.from(
                uniqueAccountsWithNamesMap.values(),
              );

              // Add this line where you set the other update options:
              setAccountOptionsWithNames(uniqueAccountsWithNames);

              // Vendor accounts
              if (
                data?.sunContractorLaborAccounts &&
                Array.isArray(data?.sunContractorLaborAccounts)
              ) {
                const vendorAccounts = data?.sunContractorLaborAccounts.map(
                  (account) => ({
                    id: account.accountId,
                    type: "vendor",
                  }),
                );
                allAccounts.push(...vendorAccounts);
              }

              // Other Direct Cost accounts (for "Other" ID type)
              if (
                data?.otherDirectCostLaborAccounts &&
                Array.isArray(data?.otherDirectCostLaborAccounts)
              ) {
                const otherAccounts = data?.otherDirectCostLaborAccounts.map(
                  (account) => ({
                    id: account.accountId,
                    type: "other",
                  }),
                );
                allAccounts.push(...otherAccounts);
              }

              const uniqueAccountsMap = new Map();
              allAccountsWithNames.forEach((acc) => {
                if (acc.id && !uniqueAccountsMap.has(acc.id)) {
                  uniqueAccountsMap.set(acc.id, {
                    id: acc.id,
                    name: acc.name,
                    type: acc.type,
                  });
                }
              });
              const uniqueAccounts = Array.from(uniqueAccountsMap.values());

              // Load PLC options
              let plcOptionsForUpdate = [];
              if (data?.plc && Array.isArray(data?.plc)) {
                plcOptionsForUpdate = data?.plc.map((plc) => ({
                  value: plc.laborCategoryCode,
                  label: `${plc.laborCategoryCode} - ${plc.description}`,
                }));
              }

              // Initialize all update options with ALL available accounts
              setUpdateAccountOptions(uniqueAccounts);
              setUpdateOrganizationOptions(orgOptions);
              setUpdatePlcOptions(plcOptionsForUpdate);

              // Also update main options if they're empty
              if (plcOptions.length === 0) {
                setPlcOptions(plcOptionsForUpdate);
                setFilteredPlcOptions(plcOptionsForUpdate);
              }
            } catch (err) {
              // console.error("Failed to load project data? for updates:", err);
              setUpdateAccountOptions(laborAccounts);
              setUpdateOrganizationOptions(orgOptions);
              setUpdatePlcOptions(plcOptions.length > 0 ? plcOptions : []);
            }
          }
        } catch (err) {
          // console.error("Failed to initialize update options:", err);
        }
      };

      initializeUpdateOptions();
    }, [localEmployees.length, projectId, allData, allOrgData]);

    const getTheAccountData = (idType) => {
      if (idType === "other" || idType === "plc") return updateAccountOptions;

      if (
        idType === "vendor employee" ||
        idType === "Vendor Employee" ||
        idType === "vendoremployee" ||
        idType === "VendorEmployee"
      )
        return updateAccountOptions.filter((acc) => acc.type === "vendor");

      return updateAccountOptions.filter((acc) => acc.type === idType);
    };

    useEffect(() => {
      // const fetchEmployeesSuggestions = async () => {
      //   // Skip fetching suggestions for NBBUD
      //   // if (planType === "NBBUD") {
      //   //   setEmployeeSuggestions([]);
      //   //   return;
      //   // }

      //   if (
      //     !projectId ||
      //     !showNewForm ||
      //     !newEntry.idType ||
      //     newEntry.idType === ""
      //   ) {
      //     setEmployeeSuggestions([]);
      //     // return;
      //   }

      //   try {
      //     const endpoint =
      //       newEntry.idType === "Vendor"
      //         ? `${backendUrl}/Project/GetVenderEmployeesByProject/${projectId}`
      //         : `${backendUrl}/Project/GetEmployeesByProject/${projectId}`;
      //     const response = await axios.get(endpoint);
      //     const suggestions = Array.isArray(response.data)
      //       ? response.data.map((emp) => {
      //           if (newEntry.idType === "Vendor") {
      //             return {
      //               emplId: String(emp.vendId),
      //               firstName: "",
      //               lastName: emp.employeeName || "",
      //               perHourRate: emp.perHourRate || emp.hrRate || "",
      //               plc: emp.plc || "",
      //               orgId: emp.orgId || "",
      //             };
      //           } else {
      //             const [lastName, firstName] = (emp.employeeName || "")
      //               .split(", ")
      //               .map((str) => str.trim());
      //             return {
      //               emplId: emp.empId,
      //               firstName: firstName || "",
      //               lastName: lastName || "",
      //               perHourRate: emp.perHourRate || emp.hrRate || "",
      //               plc: emp.plc || "",
      //               orgId: emp.orgId || "",
      //             };
      //           }
      //         })
      //       : [];
      //     setEmployeeSuggestions(suggestions);
      //   } catch (err) {
      //     setEmployeeSuggestions([]);
      //     toast.error(`Failed to fetch employee suggestions`, {
      //       toastId: "employee-fetch-error",
      //       autoClose: 3000,
      //     });
      //   }
      // };
      //     const fetchEmployeesSuggestions = async () => {
      //   if (!projectId || !showNewForm || !newEntry.idType) return;

      //   try {
      //     // Both 'Vendor' and 'Vendor Employee' use the same endpoint
      //     const isVendorRelated = newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee";

      //     const endpoint = isVendorRelated
      //       ? `${backendUrl}/Project/GetVenderEmployeesByProject/${projectId}`
      //       : `${backendUrl}/Project/GetEmployeesByProject/${projectId}`;

      //     const response = await axios.get(endpoint);

      //     const suggestions = Array.isArray(response.data)
      //       ? response.data.map((emp) => {
      //           if (newEntry.idType === "Vendor") {
      //             return {
      //               emplId: String(emp.vendId), // Show vendId for Vendor
      //               firstName: "",
      //               lastName: emp.employeeName || "",
      //               perHourRate: emp.perHourRate || emp.hrRate || "",
      //               plc: emp.plc || "",
      //               orgId: emp.orgId || "",
      //             };
      //           } else if (newEntry.idType === "Vendor Employee") {
      //             return {
      //               emplId: String(emp.empId), // Show empId for Vendor Employee
      //               firstName: "",
      //               lastName: emp.employeeName || "",
      //               perHourRate: emp.perHourRate || emp.hrRate || "",
      //               plc: emp.plc || "",
      //               orgId: emp.orgId || "",
      //             };
      //           } else {
      //             // Standard Employee Logic
      //             const [lastName, firstName] = (emp.employeeName || "").split(", ").map((str) => str.trim());
      //             return {
      //               emplId: emp.empId,
      //               firstName: firstName || "",
      //               lastName: lastName || "",
      //               perHourRate: emp.perHourRate || emp.hrRate || "",
      //               plc: emp.plc || "",
      //               orgId: emp.orgId || "",
      //             };
      //           }
      //         })
      //       : [];
      //     setEmployeeSuggestions(suggestions);
      //   } catch (err) {
      //     setEmployeeSuggestions([]);
      //   }
      // };

      const fetchEmployeesSuggestions = async () => {
        if (!projectId || !showNewForm || !newEntry.idType) return;

        try {
          // Both types use the same vendor endpoint
          const isVendorRelated =
            newEntry.idType === "Vendor" ||
            newEntry.idType === "VendorEmployee" ||
            newEntry.idType === "Vendor Employee"

          const endpoint = isVendorRelated
            // ? `${backendUrl}/Project/GetVenderEmployeesByProject/${projectId}?type=hours&accountGroupCode=${groupCd || ""}`
            ? `${backendUrl}/Project/GetVenderEmployeesByProject/${projectId}?type=hours`
            : `${backendUrl}/Project/GetEmployeesByProjectV1/${projectId}?type=hours&accountGroupCode=${groupCd || ""}`;

          const response = await axios.get(endpoint);

          const suggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                if (newEntry.idType === "Vendor") {
                  return {
                    emplId: String(emp.vendId), // Use vendId for Vendor
                    firstName: "",
                    lastName: emp.employeeName || "",
                    perHourRate: emp.perHourRate || emp.hrRate || "",
                    plc: emp.plc || "",
                    orgId: emp.orgId || "",
                    orgName: emp.orgName || "",
                    acctId: emp.acctId || emp.accId || "",
                    acctName: emp.acctName,
                    effectiveDate: emp.effectiveDate,
                    esc_Percent: emp.esc_Percent ,
                  };
                } else if (
                  newEntry.idType === "VendorEmployee" ||
                  newEntry.idType === "Vendor Employee"
                ) {
                  return {
                    emplId: String(emp.empId), // Use empId for Vendor Employee
                    firstName: "",
                    lastName: emp.employeeName || "",
                    perHourRate: emp.perHourRate || emp.hrRate || "",
                    plc: emp.plc || "",
                    orgId: emp.orgId || "",
                    orgName: emp.orgName || "",
                    acctId: emp.acctId || "",
                    acctName: emp.acctName || "",
                    effectiveDate: emp.effectiveDate,
                    esc_Percent: emp.esc_Percent
                  };
                } else {
                  // Standard Employee Logic
                  const [lastName, firstName] = (emp.employeeName || "")
                    .split(", ")
                    .map((str) => str.trim());
                  return {
                    emplId: emp.empId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    perHourRate: emp.hrRate || emp.perHourRate || "",
                    plc: emp.plc || "",
                    orgId: emp.orgId || "",
                    orgName: emp.orgName || "",
                    acctId: emp.acctId || emp.accId || "",
                    acctName: emp.acctName,
                    effectiveDate: emp.effectiveDate,
                    esc_Percent: emp.esc_Percent,
                  };
                }
              })
            : [];
          setEmployeeSuggestions(suggestions);
        } catch (err) {
          setEmployeeSuggestions([]);
        }
      };
      const fetchLaborAccounts = async () => {
        // if (planType === "NBBUD") return;

        if (!projectId || !showNewForm) return;
        try {
          // const response = await axios.get(
          //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}`
          // );
          // const response = await axios.get(
          //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`,
          // );
          const data = allData || []

          let accounts = [];
          let accountsWithNames = []; // ADD THIS

          if (newEntry.idType === "PLC") {
            // Combine both employee and vendor accounts for PLC
            const employeeAccounts = Array.isArray(data?.employeeLaborAccounts)
              ? data?.employeeLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            const vendorAccounts = Array.isArray(
              data?.sunContractorLaborAccounts,
            )
              ? data?.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            accounts = [...employeeAccounts, ...vendorAccounts];

            // ADD THIS - Store accounts with names
            const employeeAccountsWithNames = Array.isArray(
              data?.employeeLaborAccounts,
            )
              ? data?.employeeLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];

            const vendorAccountsWithNames = Array.isArray(
              data?.sunContractorLaborAccounts,
            )
              ? data?.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];

            accountsWithNames = [
              ...employeeAccountsWithNames,
              ...vendorAccountsWithNames,
            ];
          } else if (newEntry.idType === "Employee") {
            accounts = Array.isArray(data?.employeeLaborAccounts)
              ? data?.employeeLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            // ADD THIS
            accountsWithNames = Array.isArray(data?.employeeLaborAccounts)
              ? data?.employeeLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];
          } else if (newEntry.idType === "Vendor") {
            accounts = Array.isArray(data?.sunContractorLaborAccounts)
              ? data?.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            // ADD THIS
            accountsWithNames = Array.isArray(data?.sunContractorLaborAccounts)
              ? data?.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];
          } else if (newEntry.idType === "Other") {
            // accounts = Array.isArray(data?.otherDirectCostLaborAccounts)
            //   ? data?.otherDirectCostLaborAccounts.map((account) => ({
            //       id: account.accountId,
            //     }))
            //   : [];

            // // ADD THIS
            // accountsWithNames = Array.isArray(data?.otherDirectCostLaborAccounts)
            //   ? data?.otherDirectCostLaborAccounts.map((account) => ({
            //       id: account.accountId,
            //       name: account.acctName,
            //     }))
            //   : [];
            // 1. Get Other Direct Cost Labor Accounts (Existing Logic)
            const otherAccounts = Array.isArray(
              data?.otherDirectCostLaborAccounts,
            )
              ? data?.otherDirectCostLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            const otherAccountsWithNames = Array.isArray(
              data?.otherDirectCostLaborAccounts,
            )
              ? data?.otherDirectCostLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];

            // 2. Get Employee Accounts
            const employeeAccounts = Array.isArray(data?.employeeLaborAccounts)
              ? data?.employeeLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            const employeeAccountsWithNames = Array.isArray(
              data?.employeeLaborAccounts,
            )
              ? data?.employeeLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];

            // 3. Get Vendor Accounts
            const vendorAccounts = Array.isArray(
              data?.sunContractorLaborAccounts,
            )
              ? data?.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                }))
              : [];

            const vendorAccountsWithNames = Array.isArray(
              data?.sunContractorLaborAccounts,
            )
              ? data?.sunContractorLaborAccounts.map((account) => ({
                  id: account.accountId,
                  name: account.acctName,
                }))
              : [];

            // 4. Combine all accounts (IDs only and IDs with names)
            accounts = [
              ...otherAccounts,
              ...employeeAccounts,
              ...vendorAccounts,
            ];
            accountsWithNames = [
              ...otherAccountsWithNames,
              ...employeeAccountsWithNames,
              ...vendorAccountsWithNames,
            ];
          } else {
            accounts = [];
            accountsWithNames = []; // ADD THIS
          }

          // Remove duplicates
          const uniqueAccountsMap = new Map();
          const uniqueAccountsWithNamesMap = new Map(); // ADD THIS
          accounts.forEach((acc) => {
            if (acc.id && !uniqueAccountsMap.has(acc.id)) {
              uniqueAccountsMap.set(acc.id, acc);
            }
          });

          // ADD THIS
          accountsWithNames.forEach((acc) => {
            if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
              uniqueAccountsWithNamesMap.set(acc.id, acc);
            }
          });
          const uniqueAccounts = Array.from(uniqueAccountsMap.values());
          const uniqueAccountsWithNames = Array.from(
            uniqueAccountsWithNamesMap.values(),
          ); // ADD THIS

          setLaborAccounts(uniqueAccounts);
          setAccountOptionsWithNames(uniqueAccountsWithNames); // ADD THIS

          // Rest of your existing code for PLC options and organization...
          if (data.plc && Array.isArray(data.plc)) {
            const plcOptionsFromApi = data.plc.map((plc) => ({
              value: plc.laborCategoryCode,
              label: `${plc.laborCategoryCode} - ${plc.description}`,
            }));

            setPlcOptions(plcOptionsFromApi);
            setFilteredPlcOptions(plcOptionsFromApi);
          } else {
            setPlcOptions([]);
            setFilteredPlcOptions([]);
          }

          // Auto-populate organization for Vendor Employees if present
          if (newEntry.idType === "Vendor" && data.orgId) {
            setNewEntry((prev) => ({
              ...prev,
              orgId: data.orgId,
            }));
          }
        } catch (err) {
          // console.error("Error fetching labor accounts:", err);
          setLaborAccounts([]);
          setAccountOptionsWithNames([]); // ADD THIS
          setPlcOptions([]);
          setFilteredPlcOptions([]);
          toast.error("Failed to fetch labor accounts", {
            toastId: "labor-accounts-error",
            autoClose: 3000,
          });
        }
      };

      if (showNewForm) {
        fetchEmployeesSuggestions();
        fetchLaborAccounts();
      } else {
        setEmployeeSuggestions([]);
        setLaborAccounts([]);
        setPlcOptions([]);
        setFilteredPlcOptions([]); // ADD THIS LINE
        setPlcSearch("");
        setOrgSearch("");
        setAutoPopulatedPLC(false);
      }

      return () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, [projectId, showNewForm, newEntry.idType, planType]);

    // Initialize filtered PLC options when PLC options change
    useEffect(() => {
      if (plcOptions.length > 0) {
        setFilteredPlcOptions(plcOptions);
      }
    }, [plcOptions]);

    useEffect(() => {
      const initializeAccountNames = async () => {
        if (!projectId || !planType) return;

        try {
          // const response = await axios.get(
          //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`,
          // );
          const data = allData || []; 

          // Collect ALL account types with names for existing employees
          let allAccountsWithNames = [];

          if (
            data?.employeeLaborAccounts &&
            Array.isArray(data?.employeeLaborAccounts)
          ) {
            const employeeAccountsWithNames = data?.employeeLaborAccounts.map(
              (account) => ({
                id: account.accountId,
                name: account.acctName,
              }),
            );
            allAccountsWithNames.push(...employeeAccountsWithNames);
          }

          if (
            data?.sunContractorLaborAccounts &&
            Array.isArray(data?.sunContractorLaborAccounts)
          ) {
            const vendorAccountsWithNames = data?.sunContractorLaborAccounts.map(
              (account) => ({
                id: account.accountId,
                name: account.acctName,
              }),
            );
            allAccountsWithNames.push(...vendorAccountsWithNames);
          }

          if (
            data?.otherDirectCostLaborAccounts &&
            Array.isArray(data?.otherDirectCostLaborAccounts)
          ) {
            const otherAccountsWithNames =
              data?.otherDirectCostLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }));
            allAccountsWithNames.push(...otherAccountsWithNames);
          }

          // Remove duplicates
          const uniqueAccountsWithNamesMap = new Map();
          allAccountsWithNames.forEach((acc) => {
            if (acc.id && !uniqueAccountsWithNamesMap.has(acc.id)) {
              uniqueAccountsWithNamesMap.set(acc.id, {
                id: acc.id,
                name: acc.name,
              });
            }
          });
          // console.log(uniqueAccountsWithNamesMap);
          const uniqueAccountsWithNames = Array.from(
            uniqueAccountsWithNamesMap.values(),
          );

          setAccountOptionsWithNames(uniqueAccountsWithNames);
        } catch (err) {
          console.error("Failed to initialize account names:", err);
          setAccountOptionsWithNames([]);
        }
      };

      initializeAccountNames();
    }, [projectId, planType]); // Trigger when projectId or planType changes
console.log(editedEmployeeData)
    const handleEmployeeDataChange = (empIdx, field, value) => {
      if (!isEditable || !isFieldEditable) return;

      setEditedEmployeeData((prev) => ({
        ...prev,
        [empIdx]: {
          ...prev[empIdx],
          [field]: value,
        },
      }));

      // Mark as having unsaved changes
      setHasUnsavedEmployeeChanges(true);

      // Rest of your warning logic...
      const emp = localEmployees[empIdx];
      if (emp && emp.emple) {
        const emplId = emp.emple.emplId;

        if (field === "acctId") {
          const warningKey = generateFieldWarningKey(emplId, "account", value);
          const hasWarning = checkAccountInvalid(value, updateAccountOptions);

          setLocalWarnings((prev) => {
            const updated = { ...prev };
            if (hasWarning) {
              updated[warningKey] = true;
            } else {
              delete updated[warningKey];
            }
            return updated;
          });
        }

        if (field === "orgId") {
          const warningKey = generateFieldWarningKey(
            emplId,
            "organization",
            value,
          );
          const hasWarning = checkOrgInvalid(value, updateOrganizationOptions);

          setLocalWarnings((prev) => {
            const updated = { ...prev };
            if (hasWarning) {
              updated[warningKey] = true;
            } else {
              delete updated[warningKey];
            }
            return updated;
          });
        }
      }
    };

    // const handleOrgInputChangeForUpdate = (value, actualEmpIdx) => {
    //   const numericValue = value.replace(/[^0-9.]/g, "");

    //   // Remove real-time validation - only validate on blur
    //   handleEmployeeDataChange(actualEmpIdx, "orgId", numericValue);

    //   // 2. Find the name from the organizationOptions list
    //   const matchedOrg = organizationOptions.find(
    //       (opt) => opt.value.toString() === numericValue.toString()
    //   );

    //   // 3. Update the orgName in state if found, otherwise clear it
    //   if (matchedOrg) {
    //       handleEmployeeDataChange(actualEmpIdx, "orgName", matchedOrg.orgName);
    //   } else {
    //       handleEmployeeDataChange(actualEmpIdx, "orgName", "");
    //   }

    //   setOrgSearch(numericValue);

    //   // Clear previous timeout
    //   if (debounceTimeout.current) {
    //     clearTimeout(debounceTimeout.current);
    //   }

    //   // Always fetch filtered organizations when user types
    //   if (numericValue.length >= 1) {
    //     debounceTimeout.current = setTimeout(async () => {
    //       try {
    //         const response = await axios.get(
    //           `${backendUrl}/Orgnization/GetAllOrgs`
    //         );
    //         const filteredOptions = Array.isArray(response.data?)
    //           ? response.data
    //               .filter((org) => org.orgId.toString().startsWith(numericValue))
    //               .map((org) => ({
    //                 value: org.orgId,
    //                 label: org.orgId,
    //               }))
    //           : [];
    //         setUpdateOrganizationOptions(filteredOptions); // Use correct state variable
    //       } catch (err) {
    //         // console.error("Failed to fetch organizations:", err);
    //         setUpdateOrganizationOptions([]);
    //       }
    //     }, 300);
    //   } else {
    //     // Load all organizations when input is empty
    //     debounceTimeout.current = setTimeout(async () => {
    //       try {
    //         const response = await axios.get(
    //           `${backendUrl}/Orgnization/GetAllOrgs`
    //         );
    //         const orgOptions = Array.isArray(response.data)
    //           ? response.data.map((org) => ({
    //               value: org.orgId,
    //               label: org.orgId,
    //             }))
    //           : [];
    //         setUpdateOrganizationOptions(orgOptions);
    //       } catch (err) {
    //         // console.error("Failed to fetch organizations:", err);
    //         setUpdateOrganizationOptions([]);
    //       }
    //     }, 300);
    //   }
    // };

    // const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
    //   if (planType === "NBBUD") {
    //     handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
    //     setPlcSearch(value);
    //     return;
    //   }

    //   // Only allow empty value or values that start with available PLC options
    //   const isValidInput =
    //     value === "" ||
    //     plcOptions.some((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );

    //   if (!isValidInput) {
    //     // Don't update state if input doesn't match any PLC option
    //     toast.warning("Only values from the PLC suggestions are allowed", {
    //       autoClose: 2000,
    //     });
    //     return;
    //   }

    //   handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
    //   setPlcSearch(value);

    //   // Always filter from the original plcOptions
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter(
    //       (option) =>
    //         option.value.toLowerCase().includes(value.toLowerCase()) ||
    //         option.label.toLowerCase().includes(value.toLowerCase())
    //     );
    //     setUpdatePlcOptions(filtered);
    //   } else {
    //     // Reset to all available PLC options when input is empty
    //     setUpdatePlcOptions(plcOptions);
    //   }
    // };

    // const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
    //   if (planType === "NBBUD") {
    //     handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
    //     setPlcSearch(value);
    //     return;
    //   }

    //   // FIX: Removed the strict isValidInput check here.
    //   // This allows backspacing and typing freely.
    //   // The existing onBlur logic on the input field handles the final validation.

    //   handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
    //   setPlcSearch(value);

    //   // Always filter from the original plcOptions
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter(
    //       (option) =>
    //         option.value.toLowerCase().includes(value.toLowerCase()) ||
    //         option.label.toLowerCase().includes(value.toLowerCase())
    //     );
    //     setUpdatePlcOptions(filtered);
    //   } else {
    //     // Reset to all available PLC options when input is empty
    //     setUpdatePlcOptions(plcOptions);
    //   }
    // };

    // const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
    //   // 1. Update the PLC code
    //   handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
    //   setPlcSearch(value);

    //   // 2. Find the description (Label) for the new PLC
    //   // Use updatePlcOptions if populated, otherwise fallback to main plcOptions
    //   const currentOptions = updatePlcOptions.length > 0 ? updatePlcOptions : plcOptions;
    //   const selectedOption = currentOptions.find(
    //     (opt) => opt.value.toLowerCase() === value.toLowerCase()
    //   );

    //   // 3. Check if the employee is of type PLC and update the name (firstName)
    //   const emp = localEmployees[actualEmpIdx];
    //   // Check strictly if it is a PLC type row
    //   if (emp && emp.emple && (emp.emple.type === "PLC" || emp.emple.idType === "PLC")) {
    //       if (selectedOption) {
    //           // Update the edited state for firstName with the PLC Description
    //           handleEmployeeDataChange(actualEmpIdx, "firstName", selectedOption.label);
    //       } else if (value === "") {
    //           // Clear name if PLC is cleared
    //           handleEmployeeDataChange(actualEmpIdx, "firstName", "");
    //       }
    //   }

    //   // Filter logic for the datalist
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter(
    //       (option) =>
    //         option.value.toLowerCase().includes(value.toLowerCase()) ||
    //         option.label.toLowerCase().includes(value.toLowerCase())
    //     );
    //     setUpdatePlcOptions(filtered);
    //   } else {
    //     setUpdatePlcOptions(plcOptions);
    //   }
    // };

    //   const handleOrgInputChangeForUpdate = (value, actualEmpIdx) => {
    //   const numericValue = value.replace(/[^0-9]/g, '');  // Clean numeric only

    //   // 1. ALWAYS update orgId first
    //   handleEmployeeDataChange(actualEmpIdx, 'orgId', numericValue);

    //   // 2. Find orgName from BOTH lists (same logic as getEmployeeRow)
    //   let matchedOrg = null;
    //   if (organizationOptions?.length > 0) {
    //     matchedOrg = organizationOptions.find(
    //       opt => opt.value?.toString() === numericValue.toString()
    //     );
    //   }
    //   if (!matchedOrg && updateOrganizationOptions?.length > 0) {
    //     matchedOrg = updateOrganizationOptions.find(
    //       opt => opt.value?.toString() === numericValue.toString()
    //     );
    //   }

    //   // 3. Update orgName - blank if no match
    //   if (matchedOrg && (matchedOrg.orgName || matchedOrg.label)) {
    //     handleEmployeeDataChange(actualEmpIdx, 'orgName', matchedOrg.orgName || matchedOrg.label);
    //   } else {
    //     handleEmployeeDataChange(actualEmpIdx, 'orgName', '');
    //   }

    //   setOrgSearch(numericValue);
    // };

    // const handleOrgInputChangeForUpdate = (value, actualEmpIdx) => {
    //   // FIXED: Allow digits AND decimal points - NO stripping!
    //   const cleanValue = value.replace(/[^0-9.]/g, '');  // Keep dots!

    //   // 1. Update orgId with raw input (preserve decimals)
    //   handleEmployeeDataChange(actualEmpIdx, 'orgId', cleanValue);

    //   // 2. Find matching org from BOTH lists
    //   let matchedOrg = null;
    //   if (organizationOptions?.length > 0) {
    //     matchedOrg = organizationOptions.find(
    //       opt => opt.value?.toString() === cleanValue
    //     );
    //   }
    //   if (!matchedOrg && updateOrganizationOptions?.length > 0) {
    //     matchedOrg = updateOrganizationOptions.find(
    //       opt => opt.value?.toString() === cleanValue
    //     );
    //   }

    //   // 3. Update orgName display
    //   if (matchedOrg && (matchedOrg.orgName || matchedOrg.label)) {
    //     handleEmployeeDataChange(actualEmpIdx, 'orgName', matchedOrg.orgName || matchedOrg.label);
    //   } else {
    //     handleEmployeeDataChange(actualEmpIdx, 'orgName', '');
    //   }

    //   setOrgSearch(cleanValue);
    // };

    // const handleOrgInputChangeForUpdate = (value, actualEmpIdx) => {
    //   const cleanValue = value.replace(/[^0-9.]/g, "");
    //   handleEmployeeDataChange(actualEmpIdx, "orgId", cleanValue);

    //   // Search in both global and filtered options
    //   // let matchedOrg = organizationOptions?.find(opt => opt.value?.toString() === cleanValue) ||
    //   //                  updateOrganizationOptions?.find(opt => opt.value?.toString() === cleanValue);

    //   // if (matchedOrg) {
    //   //     handleEmployeeDataChange(actualEmpIdx, 'orgName', matchedOrg.orgName || matchedOrg.label);
    //   // } else {
    //   //     handleEmployeeDataChange(actualEmpIdx, 'orgName', '');
    //   // }
    //   // setOrgSearch(cleanValue);
    //   const matchedOrg =
    //     organizationOptions.find((opt) => opt.value?.toString() === cleanValue) ||
    //     updateOrganizationOptions.find(
    //       (opt) => opt.value?.toString() === cleanValue
    //     );
    //   if (matchedOrg) {
    //     handleEmployeeDataChange(
    //       actualEmpIdx,
    //       "orgName",
    //       matchedOrg.orgName || matchedOrg.label.split(" - ")[1]
    //     );
    //   } else {
    //     handleEmployeeDataChange(actualEmpIdx, "orgName", "");
    //   }

    //   setOrgSearch(cleanValue);
    // };

    const handleOrgInputChangeForUpdate = (value, actualEmpIdx) => {
      const cleanValue = value.replace(/[^0-9.]/g, "");
      handleEmployeeDataChange(actualEmpIdx, "orgId", cleanValue);

      // Search in both global and filtered options
      const matchedOrg =
        organizationOptions.find(
          (opt) => opt.value?.toString() === cleanValue,
        ) ||
        updateOrganizationOptions.find(
          (opt) => opt.value?.toString() === cleanValue,
        );

        console.log(organizationOptions)
        console.log(updateOrganizationOptions)
        console.log(matchedOrg)

      if (matchedOrg) {
        // FIXED: Properly extract orgName from label format "orgId - orgName"
        let orgNameValue = "";
        if (matchedOrg.orgName) {
          orgNameValue = matchedOrg.orgName;
        } else if (matchedOrg.label && matchedOrg.label.includes(" - ")) {
          orgNameValue = matchedOrg.label.split(" - ")[1] || "";
        }
        handleEmployeeDataChange(actualEmpIdx, "orgName", orgNameValue);
      } else {
        handleEmployeeDataChange(actualEmpIdx, "orgName", "");
      }

      setOrgSearch(cleanValue);
    };

    const handlePlcInputChangeForUpdate = (value, actualEmpIdx) => {
      // 1. Update the PLC code in state
      handleEmployeeDataChange(actualEmpIdx, "glcPlc", value);
      setPlcSearch(value);

      // 2. Find the matching PLC option to get the description
      // Use the full list of options to ensure we find the match
      const selectedOption = plcOptions.find(
        (opt) => opt.value.toLowerCase() === value.toLowerCase(),
      );

      // 3. Check if the row is a PLC type and update the name if a match is found
      const emp = localEmployees[actualEmpIdx];
      // Check strict type (API data might be "PLC" or "PLC Employee" depending on backend)
      const isPlcType =
        emp &&
        emp.emple &&
        (emp.emple.type === "PLC" || emp.emple.idType === "PLC");

      if (isPlcType) {
        if (selectedOption) {
          // Update the Name (stored in firstName for display) with the PLC Description
          handleEmployeeDataChange(
            actualEmpIdx,
            "firstName",
            selectedOption.label.split(" - ")[1],
          );
        } else if (value === "") {
          // Clear name if PLC is cleared
          handleEmployeeDataChange(actualEmpIdx, "firstName", "");
        }
      }

      // 4. Update the datalist options based on search
      if (value.length >= 1) {
        const filtered = plcOptions.filter(
          (option) =>
            option.value.toLowerCase().includes(value.toLowerCase()) ||
            option.label.toLowerCase().includes(value.toLowerCase()),
        );
        // console.log('filter plc option ', filtered)
        setUpdatePlcOptions(filtered);
      } else {
        setUpdatePlcOptions(plcOptions);
      }

      // console.log('updatedPlcOption ', updatePlcOptions)
    };

    const handleOrgInputChange = (value) => {
      const numericValue = value.replace(/[^0-9.]/g, "");

      // Remove real-time validation - only validate on blur
      setNewEntry((prev) => ({ ...prev, orgId: numericValue }));
      setOrgSearch(numericValue);

      // Clear previous timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Always fetch filtered organizations when user types
      if (numericValue.length >= 1) {
        debounceTimeout.current = setTimeout(async () => {
          try {
            const response = allOrgData || []
            // const response = await axios.get(
            //   `${backendUrl}/Orgnization/GetAllOrgs`,
            // );
            const filteredOptions = Array.isArray(response)
              ? response
                  .filter((org) =>
                    org.orgId.toString().startsWith(numericValue),
                  )
                  .map((org) => ({
                    value: org.orgId,
                    label: org.orgId,
                  }))
              : [];
            setOrganizationOptions(filteredOptions);
          } catch (err) {
            // console.error("Failed to fetch organizations:", err);
            setOrganizationOptions([]);
          }
        }, 300);
      } else {
        // Load all organizations when input is empty
        debounceTimeout.current = setTimeout(async () => {
          try {
            // const response = await axios.get(
            //   `${backendUrl}/Orgnization/GetAllOrgs`,
            // );
            const response = allOrgData
            const orgOptions = Array.isArray(response)
              ? response.map((org) => ({
                  value: org.orgId,
                  label: org.orgId,
                  orgName: org.orgName,
                }))
              : [];
            setOrganizationOptions(orgOptions);
          } catch (err) {
            // console.error("Failed to fetch organizations:", err);
            setOrganizationOptions([]);
          }
        }, 300);
      }
    };

    const handleIdTypeChange = (value) => {
      setNewEntry((prev) => ({
        id: "",
        firstName: "",
        lastName: "",
        isRev: false,
        isBrd: false,
        idType: value,
        acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
        orgId: "",
        plcGlcCode: "",
        perHourRate: "",
        // status: "Act",
        status: value === "Other" ? "ACT" : "Act",
      }));
      setPlcSearch("");
      setAutoPopulatedPLC(false);
    };

    const handlePlcInputChange = (value) => {
      // Search for the option regardless of plan type to get the name/label
      const selectedOption = plcOptions.find(
        (opt) => opt.value.toLowerCase() === value.toLowerCase(),
      );

      if (planType === "NBBUD") {
        setPlcSearch(value);
        setNewEntry((prev) => ({
          ...prev,
          plcGlcCode: value,
          // FIX: Update name for PLC type in NBBUD
          firstName:
            prev.idType === "PLC" && selectedOption
              ? selectedOption.label
              : prev.firstName,
        }));
        return;
      }

      const isValidInput =
        value === "" ||
        plcOptions.some((option) =>
          option.value.toLowerCase().startsWith(value.toLowerCase()),
        );

      if (!isValidInput) {
        toast.warning("Only values from the PLC suggestions are allowed", {
          autoClose: 2000,
        });
        return;
      }

      setPlcSearch(value);

      setNewEntry((prev) => ({
        ...prev,
        plcGlcCode: value,
        firstName:
          prev.idType === "PLC" && selectedOption
            ? selectedOption.label
            : prev.firstName,
      }));

      if (value.length >= 1) {
        const filtered = plcOptions.filter((option) =>
          option.value.toLowerCase().startsWith(value.toLowerCase()),
        );
        setFilteredPlcOptions(filtered);
      } else {
        setFilteredPlcOptions(plcOptions);
      }

      if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
        setAutoPopulatedPLC(false);
      }
    };

    // const handlePlcInputChange = (value) => {
    //   // Remove real-time validation - only validate on blur
    //   setPlcSearch(value);
    //   setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));

    //   // Filter PLC options
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );
    //     setFilteredPlcOptions(filtered);
    //   } else {
    //     setFilteredPlcOptions(plcOptions);
    //   }

    //   // Reset auto-populated flag when user manually types
    //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
    //     setAutoPopulatedPLC(false);
    //   }
    // };

    // const handlePlcInputChange = (value) => {
    //   if (planType === "NBBUD") {
    //     setPlcSearch(value);
    //     setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));
    //     return;
    //   }

    //   // Only allow typing if the value matches available PLC options
    //   const isValidInput =
    //     plcOptions.some((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     ) || value === "";

    //   if (!isValidInput && value.length > 0) {
    //     // Don't update if the input doesn't match any PLC option
    //     return;
    //   }

    //   setPlcSearch(value);
    //   setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));

    //   // Filter PLC options
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );
    //     setFilteredPlcOptions(filtered);
    //   } else {
    //     setFilteredPlcOptions(plcOptions);
    //   }

    //   // Reset auto-populated flag when user manually types
    //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
    //     setAutoPopulatedPLC(false);
    //   }
    // };

    //   const handlePlcInputChange = (value) => {
    //   if (planType === "NBBUD") {
    //     setPlcSearch(value);
    //     setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));
    //     return;
    //   }

    //   // Only allow empty value or values that start with available PLC options
    //   const isValidInput =
    //     value === "" ||
    //     plcOptions.some((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );

    //   if (!isValidInput) {
    //     toast.warning("Only values from the PLC suggestions are allowed", {
    //       autoClose: 2000,
    //     });
    //     return;
    //   }

    //   setPlcSearch(value);

    //   // --- FIX START: Only update Name if ID Type is PLC ---
    //   const selectedOption = plcOptions.find(
    //     (opt) => opt.value.toLowerCase() === value.toLowerCase()
    //   );

    //   setNewEntry((prev) => ({
    //     ...prev,
    //     plcGlcCode: value,
    //     // Only overwrite firstName if the specific ID Type is PLC
    //     firstName:
    //       prev.idType === "PLC" && selectedOption
    //         ? selectedOption.label
    //         : prev.firstName,
    //   }));
    //   // --- FIX END ---

    //   // Filter PLC options
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );
    //     setFilteredPlcOptions(filtered);
    //   } else {
    //     setFilteredPlcOptions(plcOptions);
    //   }

    //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
    //     setAutoPopulatedPLC(false);
    //   }
    // };

    // const handlePlcInputChange = (value) => {
    //   if (planType === "NBBUD") {
    //     setPlcSearch(value);
    //     setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));
    //     return;
    //   }

    //   // Only allow empty value or values that start with available PLC options
    //   const isValidInput =
    //     value === "" ||
    //     plcOptions.some((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );

    //   if (!isValidInput) {
    //     // Don't update state if input doesn't match any PLC option
    //     toast.warning("Only values from the PLC suggestions are allowed", {
    //       autoClose: 2000,
    //     });
    //     return;
    //   }

    //   setPlcSearch(value);
    //   const selectedOption = plcOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());

    //   setNewEntry((prev) => ({
    //     ...prev,
    //     plcGlcCode: value,
    //     // If we found a match, update the name. If newEntry.idType is PLC, this field is read-only in UI
    //     firstName: selectedOption ? selectedOption.label : prev.firstName
    //   }));

    //   // setNewEntry((prev) => ({ ...prev, plcGlcCode: value }));

    //   // Filter PLC options
    //   if (value.length >= 1) {
    //     const filtered = plcOptions.filter((option) =>
    //       option.value.toLowerCase().startsWith(value.toLowerCase())
    //     );
    //     setFilteredPlcOptions(filtered);
    //   } else {
    //     setFilteredPlcOptions(plcOptions);
    //   }

    //   // Reset auto-populated flag when user manually types
    //   if (autoPopulatedPLC && value !== newEntry.plcGlcCode) {
    //     setAutoPopulatedPLC(false);
    //   }
    // };

    const handleAccountBlur = (val) => {
      if (planType === "NBBUD") return; // Add this line
      if (val && !isValidAccount(val)) {
        toast.error("Please enter a valid Account from the available list.", {
          autoClose: 3000,
        });
        setNewEntry((prev) => ({ ...prev, acctId: "" }));
      }
    };

    const handleOrgBlur = (val) => {
      if (planType === "NBBUD") return; // Add this line
      if (!isValidOrg(val)) {
        toast.error(
          "Please enter a valid numeric Organization ID from the available list.",
          { autoClose: 3000 },
        );
        setNewEntry((prev) => ({ ...prev, orgId: "" }));
        setOrgSearch("");
      }
    };

    const handlePlcBlur = (val) => {
      if (planType === "NBBUD") return; // Add this line
      if (val && !isValidPlc(val)) {
        toast.error("Please enter a valid PLC from the available list.", {
          autoClose: 3000,
        });
        if (!autoPopulatedPLC) {
          setNewEntry((prev) => ({ ...prev, plcGlcCode: "" }));
          setPlcSearch("");
        }
      }
    };

    const handleAccountChange = (value) => {
      setNewEntry((prev) => ({ ...prev, acctId: value }));
    };

    const handleOrgChange = (value) => {
      setNewEntry((prev) => ({ ...prev, orgId: value }));
      setOrgSearch(value); // Add this line to track search
    };

    // const handleIdChange = (value) => {
    //   const trimmedValue = value.trim();

    //   if (planType === "NBBUD") {
    //     // For NBBUD, still try to populate from suggestions if available
    //     if (
    //       (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    //       employeeSuggestions.length > 0 &&
    //       trimmedValue
    //     ) {
    //       const selectedEmployee = employeeSuggestions.find(
    //         (emp) => emp.emplId === trimmedValue
    //       );

    //       if (selectedEmployee) {
    //         setNewEntry((prev) => ({
    //           ...prev,
    //           id: trimmedValue,
    //           firstName: selectedEmployee.firstName || "",
    //           lastName: selectedEmployee.lastName || "",
    //           perHourRate: selectedEmployee.perHourRate || "",
    //           orgId: selectedEmployee.orgId || prev.orgId,
    //           plcGlcCode: selectedEmployee.plc || "",
    //         }));
    //         setPlcSearch(selectedEmployee.plc || "");
    //       }
    //     }
    //     return;
    //   }

    //   // Skip all validation and suggestions for NBBUD
    //   // if (planType === "NBBUD") {
    //   //   setNewEntry((prev) => ({ ...prev, id: trimmedValue }));
    //   //   return;
    //   // }

    //   // 1. PLC type is always “PLC”
    //   if (newEntry.idType === "PLC") {
    //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
    //     return;
    //   }

    //   // 2. Persist whatever the user typed
    //   setNewEntry((prev) => ({ ...prev, id: trimmedValue }));

    //   // 3. If the field is cleared, reset most fields and exit
    //   if (!trimmedValue) {
    //     setNewEntry((prev) => ({
    //       ...prev,
    //       id: "",
    //       firstName: "",
    //       lastName: "",
    //       perHourRate: "",
    //       orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
    //       plcGlcCode: "",
    //       acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //     }));
    //     setPlcSearch("");
    //     setAutoPopulatedPLC(false);
    //     return;
    //   }

    //   // 5. “Other” type needs no further validation
    //   if (newEntry.idType === "Other") return;

    //   // 6. For Employee / Vendor types, try to auto-populate from suggestions
    //   if (
    //     (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    //     employeeSuggestions.length > 0
    //   ) {
    //     const selectedEmployee = employeeSuggestions.find(
    //       (emp) => emp.emplId === trimmedValue
    //     );

    //     if (selectedEmployee) {
    //       // Found a match – copy its details, *including PLC*
    //       setNewEntry((prev) => ({
    //         ...prev,
    //         id: trimmedValue,
    //         firstName: selectedEmployee.firstName || "",
    //         lastName: selectedEmployee.lastName || "",
    //         perHourRate: selectedEmployee.perHourRate || "",
    //         orgId: selectedEmployee.orgId || prev.orgId,
    //         plcGlcCode: selectedEmployee.plc || "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));
    //       setPlcSearch(selectedEmployee.plc || "");
    //       // setAutoPopulatedPLC(!!selectedEmployee.plc);
    //     } else {
    //       // No exact match – warn only if the entry is clearly invalid
    //       if (trimmedValue.length >= 3) {
    //         const partialMatch = employeeSuggestions.some((emp) =>
    //           emp.emplId.startsWith(trimmedValue)
    //         );
    //         if (!partialMatch) {
    //           toast.error("Invalid ID, please select a valid one!", {
    //             toastId: "invalid-id",
    //             autoClose: 3000,
    //           });
    //         }
    //       }

    //       // Leave any previously auto-populated PLC untouched;
    //       // only clear PLC when it wasn’t auto-filled.
    //       setNewEntry((prev) => ({
    //         ...prev,
    //         firstName: "",
    //         lastName: "",
    //         perHourRate: "",
    //         orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
    //         plcGlcCode:
    //           newEntry.idType === "Vendor" && autoPopulatedPLC
    //             ? prev.plcGlcCode
    //             : "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));

    //       if (!(newEntry.idType === "Vendor" && autoPopulatedPLC)) {
    //         setPlcSearch("");
    //         setAutoPopulatedPLC(false);
    //       }
    //     }
    //   }
    // };

    // Function to handle row selection

    //   const handleIdChange = (value) => {
    //   // FIX: Remove emojis immediately before processing
    //   const valueWithoutEmojis = value.replace(
    //     /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    //     ""
    //   );

    //   // Use the sanitized value
    //   const trimmedValue = valueWithoutEmojis.trim();

    //   if (planType === "NBBUD") {
    //     if (
    //       (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    //       employeeSuggestions.length > 0 &&
    //       trimmedValue
    //     ) {
    //       const selectedEmployee = employeeSuggestions.find(
    //         (emp) => emp.emplId === trimmedValue
    //       );

    //       if (selectedEmployee) {
    //         setNewEntry((prev) => ({
    //           ...prev,
    //           id: valueWithoutEmojis, // Use sanitized value
    //           firstName: selectedEmployee.firstName || "",
    //           lastName: selectedEmployee.lastName || "",
    //           perHourRate: selectedEmployee.perHourRate || "",
    //           orgId: selectedEmployee.orgId || prev.orgId,
    //           plcGlcCode: selectedEmployee.plc || "",
    //         }));
    //         setPlcSearch(selectedEmployee.plc || "");
    //         return;
    //       }
    //     }

    //     setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));
    //     return;
    //   }

    //   if (newEntry.idType === "PLC") {
    //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
    //     return;
    //   }

    //   // Persist sanitized value
    //   setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));

    //   if (!trimmedValue) {
    //     setNewEntry((prev) => ({
    //       ...prev,
    //       id: "",
    //       firstName: "",
    //       lastName: "",
    //       perHourRate: "",
    //       orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
    //       plcGlcCode: "",
    //       acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //     }));
    //     setPlcSearch("");
    //     setAutoPopulatedPLC(false);
    //     return;
    //   }

    //   if (newEntry.idType === "Other") return;

    //   if (
    //     (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    //     employeeSuggestions.length > 0
    //   ) {
    //     const selectedEmployee = employeeSuggestions.find(
    //       (emp) => emp.emplId === trimmedValue
    //     );

    //     if (selectedEmployee) {
    //       setNewEntry((prev) => ({
    //         ...prev,
    //         firstName: selectedEmployee.firstName || "",
    //         lastName: selectedEmployee.lastName || "",
    //         perHourRate: selectedEmployee.perHourRate || "",
    //         orgId: selectedEmployee.orgId || prev.orgId,
    //         plcGlcCode: selectedEmployee.plc || "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));
    //       setPlcSearch(selectedEmployee.plc || "");
    //     } else {
    //       if (trimmedValue.length >= 3) {
    //         const partialMatch = employeeSuggestions.some((emp) =>
    //           emp.emplId.startsWith(trimmedValue)
    //         );
    //         if (!partialMatch) {
    //           toast.error("Invalid ID, please select a valid one!", {
    //             toastId: "invalid-id",
    //             autoClose: 3000,
    //           });
    //         }
    //       }

    //       setNewEntry((prev) => ({
    //         ...prev,
    //         firstName: "",
    //         lastName: "",
    //         perHourRate: "",
    //         orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
    //         plcGlcCode:
    //           newEntry.idType === "Vendor" && autoPopulatedPLC
    //             ? prev.plcGlcCode
    //             : "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));

    //       if (!(newEntry.idType === "Vendor" && autoPopulatedPLC)) {
    //         setPlcSearch("");
    //         setAutoPopulatedPLC(false);
    //       }
    //     }
    //   }
    // };

    // const handleIdChange = (value) => {
    //   // FIX: Remove emojis immediately before processing
    //   const valueWithoutEmojis = value.replace(
    //     /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    //     ""
    //   );

    //   // Use the sanitized value
    //   const trimmedValue = valueWithoutEmojis.trim();

    //   if (planType === "NBBUD") {
    //     if (
    //       (newEntry.idType === "Employee" || newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") &&
    //       employeeSuggestions.length > 0 &&
    //       trimmedValue
    //     ) {
    //       const selectedEmployee = employeeSuggestions.find(
    //         (emp) => emp.emplId === trimmedValue
    //       );

    //       if (selectedEmployee) {
    //         setNewEntry((prev) => ({
    //           ...prev,
    //           id: valueWithoutEmojis, // Use sanitized value
    //           firstName: selectedEmployee.firstName || "",
    //           lastName: selectedEmployee.lastName || "",
    //           perHourRate: selectedEmployee.perHourRate || "",
    //           orgId: selectedEmployee.orgId || prev.orgId,
    //           plcGlcCode: selectedEmployee.plc || "",
    //         }));
    //         setPlcSearch(selectedEmployee.plc || "");
    //         return;
    //       }
    //     }

    //     setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));
    //     return;
    //   }

    //   if (newEntry.idType === "PLC") {
    //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
    //     return;
    //   }

    //   // Persist sanitized value
    //   setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));

    //   if (!trimmedValue) {
    //     setNewEntry((prev) => ({
    //       ...prev,
    //       id: "",
    //       firstName: "",
    //       lastName: "",
    //       perHourRate: "",
    //       orgId: (newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") ? prev.orgId : "",
    //       plcGlcCode: "",
    //       acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //     }));
    //     setPlcSearch("");
    //     setAutoPopulatedPLC(false);
    //     return;
    //   }

    //   if (newEntry.idType === "Other") return;

    //   if (
    //     (newEntry.idType === "Employee" || newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee") &&
    //     employeeSuggestions.length > 0
    //   ) {
    //     const selectedEmployee = employeeSuggestions.find(
    //       (emp) => emp.emplId === trimmedValue
    //     );

    //     if (selectedEmployee) {
    //       setNewEntry((prev) => ({
    //         ...prev,
    //         firstName: selectedEmployee.firstName || "",
    //         lastName: selectedEmployee.lastName || "",
    //         perHourRate: selectedEmployee.perHourRate || "",
    //         orgId: selectedEmployee.orgId || prev.orgId,
    //         plcGlcCode: selectedEmployee.plc || "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));
    //       setPlcSearch(selectedEmployee.plc || "");
    //     } else {
    //       if (trimmedValue.length >= 3) {
    //         const partialMatch = employeeSuggestions.some((emp) =>
    //           emp.emplId.startsWith(trimmedValue)
    //         );
    //         if (!partialMatch) {
    //           toast.error("Invalid ID, please select a valid one!", {
    //             toastId: "invalid-id",
    //             autoClose: 3000,
    //           });
    //         }
    //       }

    //       const isVendorType = newEntry.idType === "Vendor" || newEntry.idType === "Vendor Employee";

    //       setNewEntry((prev) => ({
    //         ...prev,
    //         firstName: "",
    //         lastName: "",
    //         perHourRate: "",
    //         orgId: isVendorType ? prev.orgId : "",
    //         plcGlcCode:
    //           isVendorType && autoPopulatedPLC
    //             ? prev.plcGlcCode
    //             : "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));

    //       if (!(isVendorType && autoPopulatedPLC)) {
    //         setPlcSearch("");
    //         setAutoPopulatedPLC(false);
    //       }
    //     }
    //   }
    // };

    // const handleIdChange = (value) => {
    //   const valueWithoutEmojis = value.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "");
    //   const trimmedValue = valueWithoutEmojis.trim();

    //   // 1. Allow PLC type to remain as is
    //   if (newEntry.idType === "PLC") {
    //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
    //     return;
    //   }

    //   // 2. Strict Search: Find the match in suggestions
    //   const suggestions = employeeSuggestions || [];
    //   const matchedEmp = suggestions.find(emp => emp.emplId === trimmedValue);

    //   if (matchedEmp) {
    //     // Found valid suggestion - Auto populate everything
    //     setNewEntry((prev) => ({
    //       ...prev,
    //       id: trimmedValue,
    //       firstName: matchedEmp.firstName || "",
    //       lastName: matchedEmp.lastName || "",
    //       perHourRate: matchedEmp.perHourRate || "",
    //       orgId: matchedEmp.orgId || prev.orgId,
    //       plcGlcCode: matchedEmp.plc || "",
    //     }));
    //     setPlcSearch(matchedEmp.plc || "");
    //   } else {
    //     // No exact match found yet (user is typing or entered invalid ID)
    //     setNewEntry((prev) => ({ ...prev, id: valueWithoutEmojis }));

    //     // Only throw toast and clear if user finished typing (length > 3 and no match)
    //     if (trimmedValue.length >= 5 && newEntry.idType !== "Other") {
    //        toast.error("Invalid ID. Please select from the suggestion list.", { toastId: "id-val" });
    //        // Optional: clear fields if strictly not allowing
    //     }
    //   }
    // };

    // const handleIdChange = (value) => {
    //   // KEY CHANGE 1: Keep 'value' raw for the UI, create 'trimmedValue' for lookups
    //   const trimmedValue = value.trim();

    //   if (planType === "NBBUD") {
    //     // For NBBUD, still try to populate from suggestions if available
    //     if (
    //       (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    //       employeeSuggestions.length > 0 &&
    //       trimmedValue
    //     ) {
    //       const selectedEmployee = employeeSuggestions.find(
    //         (emp) => emp.emplId === trimmedValue
    //       );

    //       if (selectedEmployee) {
    //         setNewEntry((prev) => ({
    //           ...prev,
    //           id: value, // KEY CHANGE: Use raw value to allow spaces while typing
    //           firstName: selectedEmployee.firstName || "",
    //           lastName: selectedEmployee.lastName || "",
    //           perHourRate: selectedEmployee.perHourRate || "",
    //           orgId: selectedEmployee.orgId || prev.orgId,
    //           plcGlcCode: selectedEmployee.plc || "",
    //         }));
    //         setPlcSearch(selectedEmployee.plc || "");
    //         return; // Added return to prevent double state update
    //       }
    //     }

    //     // If no match found in NBBUD, just update the ID text
    //     setNewEntry((prev) => ({ ...prev, id: value }));
    //     return;
    //   }

    //   // 1. PLC type is always “PLC”
    //   if (newEntry.idType === "PLC") {
    //     setNewEntry((prev) => ({ ...prev, id: "PLC" }));
    //     return;
    //   }

    //   // 2. Persist whatever the user typed (KEY CHANGE: Use 'value', not 'trimmedValue')
    //   setNewEntry((prev) => ({ ...prev, id: value }));

    //   // 3. If the field is cleared (checking trimmed is fine here), reset most fields and exit
    //   if (!trimmedValue) {
    //     setNewEntry((prev) => ({
    //       ...prev,
    //       id: "", // Explicitly clear
    //       firstName: "",
    //       lastName: "",
    //       perHourRate: "",
    //       orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
    //       plcGlcCode: "",
    //       acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //     }));
    //     setPlcSearch("");
    //     setAutoPopulatedPLC(false);
    //     return;
    //   }

    //   // 5. “Other” type needs no further validation
    //   if (newEntry.idType === "Other") return;

    //   // 6. For Employee / Vendor types, try to auto-populate from suggestions
    //   if (
    //     (newEntry.idType === "Employee" || newEntry.idType === "Vendor") &&
    //     employeeSuggestions.length > 0
    //   ) {
    //     // Use trimmedValue for the LOOKUP
    //     const selectedEmployee = employeeSuggestions.find(
    //       (emp) => emp.emplId === trimmedValue
    //     );

    //     if (selectedEmployee) {
    //       // Found a match – copy its details, *including PLC*
    //       setNewEntry((prev) => ({
    //         ...prev,
    //         // id: trimmedValue, // Optional: You can snap to trimmed here if you want, or keep 'value'
    //         firstName: selectedEmployee.firstName || "",
    //         lastName: selectedEmployee.lastName || "",
    //         perHourRate: selectedEmployee.perHourRate || "",
    //         orgId: selectedEmployee.orgId || prev.orgId,
    //         plcGlcCode: selectedEmployee.plc || "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));
    //       setPlcSearch(selectedEmployee.plc || "");
    //       // setAutoPopulatedPLC(!!selectedEmployee.plc);
    //     } else {
    //       // No exact match – warn only if the entry is clearly invalid
    //       if (trimmedValue.length >= 3) {
    //         const partialMatch = employeeSuggestions.some((emp) =>
    //           emp.emplId.startsWith(trimmedValue)
    //         );
    //         if (!partialMatch) {
    //           toast.error("Invalid ID, please select a valid one!", {
    //             toastId: "invalid-id",
    //             autoClose: 3000,
    //           });
    //         }
    //       }

    //       // Leave any previously auto-populated PLC untouched;
    //       // only clear PLC when it wasn’t auto-filled.
    //       setNewEntry((prev) => ({
    //         ...prev,
    //         firstName: "",
    //         lastName: "",
    //         perHourRate: "",
    //         orgId: newEntry.idType === "Vendor" ? prev.orgId : "",
    //         plcGlcCode:
    //           newEntry.idType === "Vendor" && autoPopulatedPLC
    //             ? prev.plcGlcCode
    //             : "",
    //         acctId: laborAccounts.length > 0 ? laborAccounts[0].id : "",
    //       }));

    //       if (!(newEntry.idType === "Vendor" && autoPopulatedPLC)) {
    //         setPlcSearch("");
    //         setAutoPopulatedPLC(false);
    //       }
    //     }
    //   }
    // };

    const handleRowSelection = (rowIndex, isSelected) => {
      setSelectedRows((prev) => {
        const newSelection = new Set(prev);
        if (isSelected) {
          newSelection.add(rowIndex);
        } else {
          newSelection.delete(rowIndex);
        }
        setShowCopyButton(newSelection.size > 0);
        return newSelection;
      });
    };

    const formatMonthValue = (value) => {
  if (!value) return "";
  // If yyyy-mm-dd → yyyy-mm
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 7);
  }
  return value; // already yyyy-mm
};


    // Function to select/deselect all rows
    const handleSelectAll = (isSelected) => {
      if (isSelected) {
        const allRowIndices = new Set();
        localEmployees.forEach((_, index) => {
          if (!hiddenRows[index]) {
            allRowIndices.add(index);
          }
        });
        if (showNewForm) {
          allRowIndices.add("new-entry");
        }
        setSelectedRows(allRowIndices);
        setShowCopyButton(true);
      } else {
        setSelectedRows(new Set());
        setShowCopyButton(false);
      }
    };

    // const handleCopySelectedRows = () => {
    //   if (selectedRows.size === 0) {
    //     toast.info("No rows selected to copy.", { autoClose: 2000 });
    //     return;
    //   }

    //   // const sortedDurations = durations.sort((a, b) => {
    //   //   if (a.year !== b.year) return a.year - b.year;
    //   //   return a.monthNo - b.monthNo;
    //   // });

    //   const headers = [
    //     "ID Type",
    //     "ID",
    //     "Name",
    //     "Account",
    //     "Account Name",
    //     "Organization",
    //     "PLC",
    //     "Rev",
    //     "Brd",
    //     "Status",
    //     "Hour Rate",
    //     "Total", // ADD Total header
    //   ];

    //   // Store month metadata for matching during paste
    //   const monthMetadata = [];

    //   sortedDurations.forEach((duration) => {
    //     const monthName = new Date(
    //       duration.year,
    //       duration.monthNo - 1
    //     ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    //     headers.push(monthName);
    //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
    //   });

    //   const copyData = [headers];
    //   const structuredData = [];

    //   selectedRows.forEach((rowIndex) => {
    //     const emp = localEmployees[rowIndex];
    //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
    //       const employeeRow = getEmployeeRow(emp, rowIndex);
    //       const rowData = [
    //         employeeRow.idType,
    //         employeeRow.emplId,
    //         employeeRow.name,
    //         employeeRow.acctId,
    //         employeeRow.acctName,
    //         employeeRow.orgId,
    //         employeeRow.glcPlc,
    //         typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev,
    //         typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd,
    //         employeeRow.status,
    //         employeeRow.perHourRate,
    //       ];

    //       // Calculate total hours
    //       let totalHours = 0;

    //       sortedDurations.forEach((duration) => {
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
    //         const monthHours = getMonthHours(emp);
    //         const forecastValue = monthHours[uniqueKey]?.value;
    //         const value =
    //           inputValue !== undefined && inputValue !== ""
    //             ? inputValue
    //             : forecastValue || "0.00";

    //         totalHours += value && !isNaN(value) ? Number(value) : 0;
    //       });

    //       // ADD Total to rowData - CRITICAL for both Excel and structuredData
    //       rowData.push(totalHours.toFixed(2));

    //       // Now add month values
    //       sortedDurations.forEach((duration) => {
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //         const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
    //         const monthHours = getMonthHours(emp);
    //         const forecastValue = monthHours[uniqueKey]?.value;
    //         const value =
    //           inputValue !== undefined && inputValue !== ""
    //             ? inputValue
    //             : forecastValue || "0.00";
    //         rowData.push(value);
    //       });

    //       copyData.push(rowData);
    //       structuredData.push(rowData); // Now includes Total at position 11
    //     }
    //   });

    //   const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

    //   navigator.clipboard
    //     .writeText(tsvContent)
    //     .then(() => {
    //       // CRITICAL: Store month metadata with copied data
    //       setCopiedRowsData(() => structuredData);
    //       setCopiedMonthMetadata(() => monthMetadata);
    //       setHasClipboardData(() => true);

    //       toast.success(`Copied ${structuredData.length} rows!`, {
    //         autoClose: 3000,
    //       });

    //       Promise.resolve().then(() => {
    //         setSelectedRows(new Set());
    //         setShowCopyButton(false);
    //       });
    //     })
    //     .catch((err) => {
    //       console.error("Copy failed:", err);
    //       toast.error("Failed to copy data.", { autoClose: 3000 });
    //     });
    // };

    // const handleCopySelectedRows = () => {
    //     // FIX: Check checkedRows.size instead of selectedRows.size
    //     if (checkedRows.size === 0) {
    //         toast.info("No rows selected to copy.", { autoClose: 2000 });
    //         return;
    //     }

    //     const headers = [
    //         "ID Type", "ID", "Name", "Account", "Account Name",
    //         "Organization", "PLC", "Rev", "Brd", "Status", "Hour Rate", "Total"
    //     ];

    //     const monthMetadata = [];
    //     sortedDurations.forEach((duration) => {
    //         const monthName = new Date(duration.year, duration.monthNo - 1)
    //             .toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    //         headers.push(monthName);
    //         monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
    //     });

    //     const copyData = [headers];
    //     const structuredData = [];

    //     // FIX: Iterate over checkedRows
    //     checkedRows.forEach((rowIndex) => {
    //         const emp = localEmployees[rowIndex];
    //         if (emp && emp.emple && !hiddenRows[rowIndex]) {
    //             const employeeRow = getEmployeeRow(emp, rowIndex);
    //             const rowData = [
    //                 employeeRow.idType,
    //                 employeeRow.emplId,
    //                 employeeRow.name,
    //                 employeeRow.acctId,
    //                 employeeRow.acctName,
    //                 employeeRow.orgId,
    //                 employeeRow.glcPlc,
    //                 typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev,
    //                 typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd,
    //                 employeeRow.status,
    //                 employeeRow.perHourRate,
    //             ];

    //             // Calculate total and months
    //             let totalHours = 0;
    //             const monthValues = [];
    //             sortedDurations.forEach((duration) => {
    //                 const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //                 const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
    //                 const monthHours = getMonthHours(emp);
    //                 const forecastValue = monthHours[uniqueKey]?.value;
    //                 const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue || "0.00";

    //                 totalHours += value && !isNaN(value) ? Number(value) : 0;
    //                 monthValues.push(value);
    //             });

    //             rowData.push(totalHours.toFixed(2)); // Push Total to column 12
    //             rowData.push(...monthValues);       // Add monthly data

    //             copyData.push(rowData);
    //             structuredData.push(rowData);
    //         }
    //     });

    //     const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

    //     navigator.clipboard.writeText(tsvContent)
    //         .then(() => {
    //             setCopiedRowsData(structuredData);
    //             setCopiedMonthMetadata(monthMetadata);
    //             setHasClipboardData(true);
    //             toast.success(`Copied ${structuredData.length} rows!`, { autoClose: 3000 });

    //             // Optional: Uncheck all after copying
    //             // setCheckedRows(new Set());
    //         })
    //         .catch((err) => {
    //             toast.error("Failed to copy data.");
    //         });
    // };

    // const handleCopySelectedRows = () => {
    //     if (checkedRows.size === 0) {
    //         toast.info("No rows selected to copy.", { autoClose: 2000 });
    //         return;
    //     }

    //     // Use the full durations array (sorted by date) to ensure we capture all fiscal years
    //     const allAvailableDurations = [...durations].sort((a, b) => {
    //         if (a.year !== b.year) return a.year - b.year;
    //         return a.monthNo - b.monthNo;
    //     });

    //     const headers = [
    //         "ID Type", "ID", "Name", "Account", "Account Name",
    //         "Organization", "PLC", "Rev", "Brd", "Status", "Hour Rate", "Total"
    //     ];

    //     const monthMetadata = [];
    //     allAvailableDurations.forEach((duration) => {
    //         const monthName = new Date(duration.year, duration.monthNo - 1)
    //             .toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    //         headers.push(monthName);
    //         monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
    //     });

    //     const copyData = [headers];
    //     const structuredData = [];

    //     checkedRows.forEach((rowIndex) => {
    //         const emp = localEmployees[rowIndex];
    //         if (emp && emp.emple && !hiddenRows[rowIndex]) {
    //             const employeeRow = getEmployeeRow(emp, rowIndex);

    //             // Extract core data
    //             const rowData = [
    //                 employeeRow.idType,
    //                 employeeRow.emplId,
    //                 employeeRow.name,
    //                 employeeRow.acctId,
    //                 employeeRow.acctName,
    //                 employeeRow.orgId,
    //                 employeeRow.glcPlc,
    //                 // Check if it's a React element (checkmark) or raw value
    //                 typeof employeeRow.isRev === "object" ? "✓" : employeeRow.isRev,
    //                 typeof employeeRow.isBrd === "object" ? "✓" : employeeRow.isBrd,
    //                 employeeRow.status,
    //                 employeeRow.perHourRate,
    //             ];

    //             // Calculate totals and collect hours for ALL years
    //             let totalHoursSum = 0;
    //             const monthValues = [];
    //             const empMonthHours = getMonthHours(emp);

    //             allAvailableDurations.forEach((duration) => {
    //                 const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //                 const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
    //                 const forecastValue = empMonthHours[uniqueKey]?.value;
    //                 const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue || "0.00";

    //                 totalHoursSum += value && !isNaN(value) ? Number(value) : 0;
    //                 monthValues.push(value);
    //             });

    //             rowData.push(totalHoursSum.toFixed(2)); // Total Column
    //             rowData.push(...monthValues);         // All individual months

    //             copyData.push(rowData);
    //             structuredData.push(rowData);
    //         }
    //     });

    //     const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

    //     navigator.clipboard.writeText(tsvContent)
    //         .then(() => {
    //             setCopiedRowsData(structuredData);
    //             setCopiedMonthMetadata(monthMetadata);
    //             setHasClipboardData(true);

    //             // Updated Toast Message
    //             // toast.success(`Success! ${structuredData.length} records (including all fiscal years) copied to clipboard.`, {
    //             //     autoClose: 3000,
    //             //     icon: "📋"
    //             // });
    //              toast.success(
    //                       `Copied ${structuredData.length} rows with all fiscal year data!`,
    //                       {
    //                         autoClose: 3000,
    //                       }
    //                     );
    //         })
    //        .catch((err) => {
    //         console.error("Copy failed:", err);
    //         toast.error("Failed to copy data.", { autoClose: 3000 });
    //       });
    // };

    // const handleCopySelectedRows = async () => {
    //   if (checkedRows.size === 0) {
    //     toast.info("No rows selected to copy.", { autoClose: 2000 });
    //     return;
    //   }

    //   // Use full durations for all fiscal years
    //   const allAvailableDurations = [...durations].sort((a, b) => {
    //     if (a.year !== b.year) return a.year - b.year;
    //     return a.monthNo - b.monthNo;
    //   });

    //   // ✅ FIXED HEADERS - Include Org Name column
    //   const headers = [
    //     "ID Type", "ID", "Name", "Account", "Account Name",
    //     "OrgId", "Org Name", "PLC", "Rev", "Brd", "Status", "Hour Rate", "Total"
    //   ];

    //   // Add month headers
    //   const monthMetadata = [];
    //   allAvailableDurations.forEach(duration => {
    //     const monthName = new Date(duration.year, duration.monthNo - 1)
    //       .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    //     headers.push(monthName);
    //     monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
    //   });

    //   const copyData = [headers];
    //   const structuredData = [];

    //   checkedRows.forEach(rowIndex => {
    //     const emp = localEmployees[rowIndex];
    //     if (emp && emp.emple && !hiddenRows[rowIndex]) {
    //       const employeeRow = getEmployeeRow(emp, rowIndex);

    //       // ✅ FIXED: Copy BOTH orgId AND orgName
    //       const rowData = [
    //         employeeRow.idType,
    //         employeeRow.emplId,
    //         employeeRow.name,
    //         employeeRow.acctId,
    //         employeeRow.acctName,
    //         employeeRow.orgId,
    //         employeeRow.orgName || '-',
    //         employeeRow.glcPlc,
    //         typeof employeeRow.isRev === 'object' ? employeeRow.isRev : (employeeRow.isRev ? '✓' : '-'),
    //         typeof employeeRow.isBrd === 'object' ? employeeRow.isBrd : (employeeRow.isBrd ? '✓' : '-'),
    //         employeeRow.status,
    //         employeeRow.perHourRate,
    //       ];

    //       // Calculate total
    //       let totalHoursSum = 0;
    //       const monthValues = [];
    //       const empMonthHours = getMonthHours(emp);

    //       allAvailableDurations.forEach(duration => {
    //         const uniqueKey = `${duration.monthNo}${duration.year}`;
    //         const inputValue = inputValues[rowIndex]?.[uniqueKey];
    //         const forecastValue = empMonthHours[uniqueKey]?.value;
    //         const value = inputValue !== undefined ? inputValue : forecastValue;
    //         totalHoursSum += value && !isNaN(value) ? Number(value) : 0;
    //         monthValues.push(value || '0.00');
    //       });

    //       rowData.push(totalHoursSum.toFixed(2));  // Total column
    //       rowData.push(...monthValues);            // All month columns

    //       copyData.push(rowData);
    //       structuredData.push(rowData);
    //     }
    //   });

    //   // Create TSV for Excel
    //   const tsvContent = copyData.map(row => row.join('\t')).join('\n');

    //   navigator.clipboard.writeText(tsvContent).then(() => {
    //     setCopiedRowsData(structuredData);
    //     setCopiedMonthMetadata(monthMetadata);
    //     setHasClipboardData(true);
    //     toast.success(`Copied ${structuredData.length} rows!`, { autoClose: 3000 });
    //     setCheckedRows(new Set());  // Clear selection
    //     setShowCopyButton(false);
    //   }).catch(err => {
    //     console.error("Copy failed", err);
    //     toast.error("Failed to copy data.", { autoClose: 3000 });
    //   });
    // };

    const handleCopySelectedRows = async () => {
      if (checkedRows.size === 0) {
        toast.info("No rows selected to copy.", { autoClose: 2000 });
        return;
      }

      // Use all durations to ensure all fiscal years are captured
      const allAvailableDurations = [...durations].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });

      // Headers must match the Order used in the Paste function
      const headers = [
        "ID Type",
        "ID",
        "Name",
        "Account",
        "Account Name",
        "Org ID",
        "Org Name",
        "PLC",
        "Rev",
        "Brd",
        "Status",
        "Hour Rate",
      "Effective Dt",
   "Esc Rate(%)",
        "Total",
      ];

      const monthMetadata = [];
      allAvailableDurations.forEach((duration) => {
        const monthName = new Date(
          duration.year,
          duration.monthNo - 1,
        ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        headers.push(monthName);
        monthMetadata.push({ monthNo: duration.monthNo, year: duration.year });
      });

      const copyData = [headers];
      const structuredData = [];

      checkedRows.forEach((rowIndex) => {
        const emp = localEmployees[rowIndex];
        if (emp && emp.emple && !hiddenRows[rowIndex]) {
          const employeeRow = getEmployeeRow(emp, rowIndex);

          const rowData = [
            employeeRow.idType,
            employeeRow.emplId,
            employeeRow.name,
            employeeRow.acctId,
            employeeRow.acctName,
            employeeRow.orgId,
            employeeRow.orgName || "-",
            employeeRow.glcPlc,
            emp.emple.isRev ? "✓" : "-",
            emp.emple.isBrd ? "✓" : "-",
            employeeRow.status,
            // employeeRow.perHourRate,
            ...(canView("perHouRate") ? [employeeRow.perHourRate] : []),
            emp.emple.effectiveDate,
            emp.emple.esc_Percent,
            employeeRow.total,
          ];

          // Add monthly hours
          const empMonthHours = getMonthHours(emp);
          allAvailableDurations.forEach((duration) => {
            const uniqueKey = `${duration.monthNo}_${duration.year}`; // Standardized key
            const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
            const forecastValue = empMonthHours[uniqueKey]?.value;
            const value =
              inputValue !== undefined && inputValue !== ""
                ? inputValue
                : forecastValue || "0.00";
            rowData.push(value);
          });

          copyData.push(rowData);
          structuredData.push(rowData);
        }
      });

      const tsvContent = copyData.map((row) => row.join("\t")).join("\n");

      navigator.clipboard
        .writeText(tsvContent)
        .then(() => {
          setCopiedRowsData(structuredData);
          setCopiedMonthMetadata(monthMetadata);
          setHasClipboardData(true);
          toast.success(`Copied ${structuredData.length} rows!`);
          setCheckedRows(new Set());
          setShowCopyButton(false);
        })
        .catch((err) => {
          toast.error("Failed to copy data.");
        });
    };

    // **NEW OPTIMIZED FUNCTION** - Fetches all data with minimal API calls
    const fetchAllSuggestionsOptimized = async (processedEntries) => {
      const encodedProjectId = encodeURIComponent(projectId);

      const formatVendorData = (data, type) => {
        return Array.isArray(data)
          ? data.map((emp) => ({
              emplId: type === "Vendor" ? emp.vendId : emp.empId,
              firstName: "",
              lastName: emp.employeeName,
              perHourRate: emp.perHourRate || emp.hrRate || "",
              plc: emp.plc || "",
              orgId: emp.orgId || "",
              orgName: emp.orgName || "",
              acctId: emp.acctId || emp.accId || "",
              acctName: emp.acctName || "",
              effectiveDate: emp.effectiveDate,
              esc_Percent: emp.esc_Percent,
            }))
          : [];
      };

      try {
        let projectData = cachedProjectData;
        let orgOptions = cachedOrgData;

        if (!projectData) {
          // const projectResponse = await axios.get(
          //   `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`,
          // );
          projectData = allData || []
          setCachedProjectData(projectData);
        }

        if (!orgOptions) {
          const orgResponse = allOrgData || []
          // const orgResponse = await axios.get(
          //   `${backendUrl}/Orgnization/GetAllOrgs`,
          // );
          orgOptions = Array.isArray(orgResponse)
            ? orgResponse.map((org) => ({
                value: org.orgId,
                label: org.orgId,
                name: org.orgName,
              }))
            : [];
          setCachedOrgData(orgOptions);
        }

        const employeeEntries = processedEntries.filter(
          (e) => e.idType === "Employee",
        );
        const vendorEntries = processedEntries.filter(
          (e) => e.idType === "Vendor",
        );
        const vendorEmployeeEntries = processedEntries.filter(
          (e) =>
            e.idType === "VendorEmployee" || e.idType === "Vendor Employee",
        );

        let employeeSuggestions = [];
        let vendorSuggestions = [];
        let vendorEmployeeSuggestions = [];

        if (employeeEntries.length > 0) {
          const response = await axios.get(
            `${backendUrl}/Project/GetEmployeesByProjectV1/${encodedProjectId}?type=hours&accountGroupCode=${groupCd || ""}`,
          );
          employeeSuggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                const [lastName, firstName] = emp.employeeName
                  .split(",")
                  .map((s) => s.trim());
                return {
                  emplId: emp.empId,
                  firstName: firstName || "",
                  lastName: lastName || "",
                  perHourRate: emp.perHourRate || emp.hrRate || "",
                  plc: emp.plc || "",
                  orgId: emp.orgId || "",
                  orgName: emp.orgName || "",
                  acctId: emp.acctId || emp.accId || "",
                  acctName: emp.acctName || "",
                  effectiveDate: emp.effectiveDate,
                  esc_Percent: emp.esc_Percent,
                };
              })
            : [];
        }

        if (vendorEntries.length > 0) {
          const response = await axios.get(
            `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=hours`,
          );
          vendorSuggestions = formatVendorData(response.data, "Vendor");
        }

        if (vendorEmployeeEntries.length > 0) {
          const response = await axios.get(
            `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=hours`,
          );
          vendorEmployeeSuggestions = formatVendorData(
            response.data,
            "VendorEmployee",
          );
        }

        setNewEntries((prevEntries) =>
          prevEntries.map((entry) => {
            let match = null;
            if (entry.idType === "Employee") {
              match = employeeSuggestions.find(
                (e) => String(e.emplId) === String(entry.id),
              );
            } else if (entry.idType === "Vendor") {
              match = vendorSuggestions.find(
                (v) => String(v.emplId) === String(entry.id),
              );
            } else if (
              entry.idType === "VendorEmployee" ||
              entry.idType === "Vendor Employee"
            ) {
              match = vendorEmployeeSuggestions.find(
                (ve) => String(ve.emplId) === String(entry.id),
              );
            }

            if (match) {
              const [plcCode] = (match.plc || "").split(" - ");
              return {
                ...entry,
                firstName: match.firstName || "",
                lastName: match.lastName || "",
                perHourRate: entry.perHourRate || match.perHourRate || "",
                orgId: entry.orgId || match.orgId || "",
                orgName: entry.orgName || match.orgName || "",
                plcGlcCode: entry.plcGlcCode || plcCode || "",
                acctId: entry.acctId || match.acctId || "",
                acctName: entry.acctName || match.acctName || "",
              };
            }
            return entry;
          }),
        );

        processedEntries.forEach((entry, entryIndex) => {
          let suggestionsPool = [];
          if (entry.idType === "Employee")
            suggestionsPool = employeeSuggestions;
          else if (entry.idType === "Vendor")
            suggestionsPool = vendorSuggestions;
         else if (
              entry.idType === "VendorEmployee" ||
              entry.idType === "Vendor Employee"
            )
            suggestionsPool = vendorEmployeeSuggestions;

          setPastedEntrySuggestions((prev) => ({
            ...prev,
            [entryIndex]: suggestionsPool,
          }));

          let accountsWithNames = [];
          const empAccs = Array.isArray(projectData.employeeLaborAccounts)
            ? projectData.employeeLaborAccounts
            : [];
          const vendAccs = Array.isArray(projectData.sunContractorLaborAccounts)
            ? projectData.sunContractorLaborAccounts
            : [];
          const otherAccs = Array.isArray(
            projectData.otherDirectCostLaborAccounts,
          )
            ? projectData.otherDirectCostLaborAccounts
            : [];

          if (entry.idType === "PLC") {
            accountsWithNames = [...empAccs, ...vendAccs].map((a) => ({
              id: a.accountId,
              name: a.acctName,
            }));
          } else if (entry.idType === "Employee") {
            accountsWithNames = empAccs.map((a) => ({
              id: a.accountId,
              name: a.acctName,
            }));
          }else if (
            entry.idType === "Vendor" ||
            entry.idType === "VendorEmployee" ||
            entry.idType === "Vendor Employee"
          ) {
            accountsWithNames = vendAccs.map((a) => ({
              id: a.accountId,
              name: a.acctName,
            }));
          } else if (entry.idType === "Other") {
            accountsWithNames = [...otherAccs, ...empAccs, ...vendAccs].map(
              (a) => ({ id: a.accountId, name: a.acctName }),
            );
          }

          setPastedEntryAccounts((prev) => ({
            ...prev,
            [entryIndex]: accountsWithNames,
          }));
          setPastedEntryOrgs((prev) => ({ ...prev, [entryIndex]: orgOptions }));

          if (projectData.plc && Array.isArray(projectData.plc)) {
            const plcOptions = projectData.plc.map((plc) => ({
              value: plc.laborCategoryCode,
              label: `${plc.laborCategoryCode} - ${plc.description}`,
            }));
            setPastedEntryPlcs((prev) => ({
              ...prev,
              [entryIndex]: plcOptions,
            }));
          }
        });
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    };

    // Helper to keep code clean
    const formatVendorData = (data, type) => {
      return Array.isArray(data)
        ? data.map((emp) => ({
            emplId: type === "Vendor" ? emp.vendId : emp.empId,
            firstName: "",
            lastName: emp.employeeName,
            perHourRate: emp.perHourRate || emp.hrRate || "",
            plc: emp.plc || "",
            orgId: emp.orgId || "",
            orgName: emp.orgName || "",
            acctId: emp.acctId || emp.accId || "",
            acctName: emp.acctName || "",
            effectiveDate: emp.effectiveDate,
            esc_Percent: emp.esc_Percent,
          }))
        : [];
    };

    const handlePasteMultipleRows = async () => {
      if (copiedRowsData.length === 0) {
        toast.error("No copied data available to paste", { autoClose: 2000 });
        return;
      }

      if (showNewForm) setShowNewForm(false);

      // Use all durations for mapping
      const allDurations = [...durations].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });

      const processedEntries = [];
      const processedHoursArray = [];

      copiedRowsData.forEach((rowData) => {
        // Column Mapping based on the handleCopySelectedRows structure
        const [
          idTypeLabel,
          rawId,
          name,
          acctId,
          acctName,
          orgId, // Position 5
          orgName, // Position 6
          plc, // Position 7
          isRev, // Position 8
          isBrd, // Position 9
          status, // Position 10
          hourRate, // Position 11
          effectiveDate,
          esc_Percent,
          total, // Position 12
          ...monthValues
        ] = rowData;

        const idType =
          ID_TYPE_OPTIONS.find(
            (opt) => opt.label.toLowerCase() === idTypeLabel.toLowerCase(),
          )?.value || idTypeLabel;

        // Sanitize ID
        const id = (rawId || "").replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          "",
        );

        let firstName = "";
        let lastName = "";
        if (idType === "PLC") {
          firstName = `${rawId} - ${name}`;
        } else if (idType === "Vendor") {
          lastName = name;
        } else {
          const nameParts = (name || "").split(" ");
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }

        // let firstName = "";
        // let lastName = "";

        // if (idType === "PLC") {
        //   firstName = `${rawId} - ${name}`;
        // } else if (idType === "Vendor") {
        //   // Keep vendor name exactly as is in lastName
        //   lastName = name || "";
        // } else {
        //   // Remove extra spaces that might be coming from a spreadsheet
        //   const trimmedName = (name || "").trim();
        //   const nameParts = trimmedName.split(/\s+/);

        //   if (nameParts.length > 1) {
        //     // FIX: Extracts the last word as lastName, 
        //     // and joins everything else as firstName.
        //     // Example: "James E. Cook" -> firstName: "James E.", lastName: "Cook"
        //     lastName = nameParts.pop(); 
        //     firstName = nameParts.join(" "); 
        //   } else {
        //     // If it's just one word, keep it in firstName
        //     firstName = trimmedName;
        //     lastName = "";
        //   }
        // }
        const sanitizedId = id.trim();
        const finalId =
          idType === "Other" ? "TBD" : idType === "PLC" ? "PLC" : sanitizedId;
        const entry = {
          id: finalId,
          firstName,
          lastName,
          idType,
          acctId,
          acctName,
          orgId,
          orgName: orgName || "",
          plcGlcCode: plc.split("-")[0],
          perHourRate: hourRate,
           effectiveDate,
          esc_Percent,
          status: status || "ACT",
          isRev: isRev === "✓",
          isBrd: isBrd === "✓",
         
        };

        const periodHours = {};
        // Map pasted values to the correct month_year key using metadata
        copiedMonthMetadata.forEach((meta, index) => {
          const uniqueKey = `${meta.monthNo}_${meta.year}`;
          const value = monthValues[index];
          if (value && value !== "0.00" && value !== "0" && value !== "") {
            periodHours[uniqueKey] = value;
          }
        });

        processedEntries.push(entry);
        processedHoursArray.push(periodHours);
      });

      setNewEntries(processedEntries);
      setNewEntryPeriodHoursArray(processedHoursArray);
      setHasClipboardData(false);
      setCopiedRowsData([]);
      setCopiedMonthMetadata([]);

      toast.success(`Pasted ${processedEntries.length} rows!`);

      // Trigger optimized suggestion fetch
      fetchAllSuggestionsOptimized(processedEntries);
    };

    const getLaborCost = (year, month) => {
      // ✅ FIXED: Search using month number, not month name
      const match = laborCostByMonth.find(
        (item) => item.year === year && item.month === month,
      );

      // ✅ Return hours (not laborCost) since this is used for hours display
      return match ? match.hours || 0 : 0;
    };

    const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
      // if (planType === "NBBUD") return;

      // CRITICAL FIX: URL encode project ID
      const encodedProjectId = encodeURIComponent(projectId);

      // Fetch employee suggestions based on ID type (this is entry-specific, must be called per entry)
      if (entry.idType && entry.idType !== "") {
        try {
          const endpoint =
           entry.idType === "Vendor" ||
            entry.idType === "VendorEmployee" ||
            entry.idType === "Vendor Employee"
              // ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=hours&accountGroupCode=${groupCd || ""}`
              ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=hours`
              : `${backendUrl}/Project/GetEmployeesByProjectV1/${encodedProjectId}?type=hours&accountGroupCode=${groupCd || ""}`;

          const response = await axios.get(endpoint);
          const suggestions = Array.isArray(response.data)
            ? response.data.map((emp) => {
                if (entry.idType === "Vendor") {
                  return {
                    emplId: emp.vendId,
                    firstName: "",
                    lastName: emp.employeeName,
                    perHourRate: emp.perHourRate || emp.hrRate || "",
                    plc: emp.plc || "",
                    orgId: emp.orgId || "",
                    orgName: emp.orgName || "",
                    acctId: emp.acctId || emp.accId || "",
                    acctName: emp.acctName || "",
                    effectiveDate: emp.effectiveDate,
                    esc_Percent: emp.esc_Percent,
                  };
                } else if (entry.idType === "Vendor Employee" || entry.idType === "VendorEmployee") {
                  // NEW CASE: Handle VendorEmployee
                  return {
                    emplId: emp.empId,
                    firstName: "",
                    lastName: emp.employeeName,
                    perHourRate: emp.perHourRate || emp.hrRate || "",
                    plc: emp.plc || "",
                    orgId: emp.orgId || "",
                    orgName: emp.orgName || "",
                    acctId: emp.acctId || emp.accId || "",
                    acctName: emp.acctName || "",
                    effectiveDate: emp.effectiveDate,
                    esc_Percent: emp.esc_Percent,
                  };
                } else {
                  // Employee case
                  const [lastName, firstName] = emp.employeeName
                    .split(",")
                    .map((str) => str.trim());
                  return {
                    emplId: emp.empId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    perHourRate: emp.perHourRate || emp.hrRate || "",
                    plc: emp.plc || "",
                    orgId: emp.orgId || "",
                    orgName: emp.orgName || "",
                    acctId: emp.acctId || emp.accId || "",
                    acctName: emp.acctName || "",
                    effectiveDate: emp.effectiveDate,
                    esc_Percent: emp.esc_Percent,
                  };
                }
              })
            : [];

          setPastedEntrySuggestions((prev) => ({
            ...prev,
            [entryIndex]: suggestions,
          }));
        } catch (err) {
          console.error(
            `Failed to fetch pasted entry suggestions for index ${entryIndex}:`,
            err,
          );
        }
      }

      // OPTIMIZATION: Fetch project and org data only once, then cache it
      try {
        let projectData = cachedProjectData;
        let orgOptions = cachedOrgData;

        // Only fetch project data if not already cached
        if (!projectData) {
          // const response = await axios.get(
          //   `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`,
          // );
          projectData = allData || []
          setCachedProjectData(projectData);
        }

        // Only fetch org data if not already cached
        if (!orgOptions) {
          // const orgResponse = await axios.get(
          //   `${backendUrl}/Orgnization/GetAllOrgs`,
          // );
          const orgResponse = allOrgData || []
          orgOptions = Array.isArray(orgResponse)
            ? orgResponse.map((org) => ({
                value: org.orgId,
                label: org.orgName,
                name: org.orgName,
              }))
            : [];
          setCachedOrgData(orgOptions);
        }

        // Now use the cached data to populate entry-specific options
        // Fetch accounts
        let accountsWithNames = [];
        if (entry.idType === "PLC") {
          const employeeAccounts = Array.isArray(
            projectData.employeeLaborAccounts,
          )
            ? projectData.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
          const vendorAccounts = Array.isArray(
            projectData.sunContractorLaborAccounts,
          )
            ? projectData.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
          accountsWithNames = [...employeeAccounts, ...vendorAccounts];
        } else if (entry.idType === "Employee") {
          accountsWithNames = Array.isArray(projectData.employeeLaborAccounts)
            ? projectData.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (entry.idType === "Vendor") {
          accountsWithNames = Array.isArray(
            projectData.sunContractorLaborAccounts,
          )
            ? projectData.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (
          entry.idType === "Vendor Employee" ||
          entry.idType === "VendorEmployee"
        ) {
          // NEW CASE: Same accounts as Vendor for VendorEmployee
          accountsWithNames = Array.isArray(
            projectData.sunContractorLaborAccounts,
          )
            ? projectData.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];
        } else if (entry.idType === "Other") {
          const otherAccounts = Array.isArray(
            projectData.otherDirectCostLaborAccounts,
          )
            ? projectData.otherDirectCostLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];

          const employeeAccounts = Array.isArray(
            projectData.employeeLaborAccounts,
          )
            ? projectData.employeeLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];

          const vendorAccounts = Array.isArray(
            projectData.sunContractorLaborAccounts,
          )
            ? projectData.sunContractorLaborAccounts.map((account) => ({
                id: account.accountId,
                name: account.acctName,
              }))
            : [];

          accountsWithNames = [
            ...otherAccounts,
            ...employeeAccounts,
            ...vendorAccounts,
          ];
        }
        setPastedEntryAccounts((prev) => ({
          ...prev,
          [entryIndex]: accountsWithNames,
        }));

        // Use cached organizations
        setPastedEntryOrgs((prev) => ({
          ...prev,
          [entryIndex]: orgOptions,
        }));

        // Fetch PLC options
        if (projectData.plc && Array.isArray(projectData.plc)) {
          const plcOptions = projectData.plc.map((plc) => ({
            value: plc.laborCategoryCode,
            label: `${plc.laborCategoryCode} - ${plc.description}`,
          }));

          setPastedEntryPlcs((prev) => ({
            ...prev,
            [entryIndex]: plcOptions,
          }));
        }
      } catch (err) {
        console.error(
          `Failed to fetch pasted entry options for index ${entryIndex}:`,
          err,
        );
      }
    };

    useEffect(() => {
      // Clear cached data when project changes
      setCachedProjectData(null);
      setCachedOrgData(null);
    }, [projectId, planType]);

    const handlePasteToNewEntry = async () => {
      try {
        isPastingRef.current = true;

        // Check if there's an unsaved entry
        if (showNewForm && newEntry.id) {
          toast.warning("Please save the current entry before pasting again.", {
            autoClose: 3000,
          });
          isPastingRef.current = false;
          return;
        }

        const text = await navigator.clipboard.readText();
        if (!text || !text.trim()) {
          toast.error("No data found in clipboard. Please copy data first.", {
            autoClose: 3000,
          });
          isPastingRef.current = false;
          return;
        }

        // ✅ Process the paste
        processPastedText(text);
        setTimeout(() => {
          isPastingRef.current = false;
        }, 300);
      } catch (err) {
        isPastingRef.current = false;
        toast.error(
          "Clipboard access failed. Please use Ctrl+V to paste or grant clipboard permissions.",
          { autoClose: 3000 },
        );
      }
    };

    const processPastedText = (text) => {
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        toast.error("No valid data found in clipboard.", { autoClose: 3000 });
        return;
      }

      const isFirstLineHeaders =
        lines[0].toLowerCase().includes("id type") ||
        lines[0].toLowerCase().includes("account");
      const dataLines = isFirstLineHeaders ? lines.slice(1) : lines;

      if (dataLines.length === 0) {
        toast.error("No data rows found in clipboard.", { autoClose: 3000 });
        return;
      }

      // Process first row
      const firstRow = dataLines[0].split("\t");
      pasteRowData(firstRow);

      // Handle remaining rows
      if (dataLines.length > 1) {
        // If there are more rows, save current form and show next paste option
        toast.info(
          `Pasted 1 of ${dataLines.length} rows. Save this entry, then click Paste again for next row.`,
          { autoClose: 4000 },
        );

        // Update clipboard with remaining rows
        const remainingLines = [lines[0], ...dataLines.slice(1)];
        const remainingText = remainingLines.join("\n");
        navigator.clipboard
          .writeText(remainingText)
          .then(() => {
            // Keep hasClipboardData true for next paste
            setHasClipboardData(true);
            // Update copiedRowsData to remove first row
            setCopiedRowsData((prev) => prev.slice(1));
          })
          .catch((err) => {
            console.error("Failed to update clipboard", err);
            // Even if clipboard update fails, keep states
            setHasClipboardData(true);
            setCopiedRowsData((prev) => prev.slice(1));
          });
      } else {
        // Last row - clear everything
        setHasClipboardData(false);
        setCopiedRowsData([]);
        toast.success("Data pasted successfully!", { autoClose: 2000 });
      }
    };

    const pasteRowData = (row) => {
      if (row.length < 11) {
        toast.error("Invalid data format. Please copy complete row data.", {
          autoClose: 3000,
        });
        return;
      }

      const [
        idTypeLabel,
        id,
        name,
        acctId,
        acctName,
        orgId,
        orgName,
        plc,
        rev,
        brd,
        status,
        hourRate,
        total,
        ...monthValues
      ] = row;

      const idType =
        ID_TYPE_OPTIONS.find((opt) =>
          opt.label.toLowerCase().includes(idTypeLabel?.toLowerCase()),
        )?.value || "Employee";

      let firstName = "",
        lastName = "";
      if (idType === "PLC") {
        firstName = name;
      } else if (idType === "Vendor") {
        lastName = name;
      } else {
        const nameParts = name.split(" ");
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      }

      // ✅ RESOLVE orgName FROM orgId or use copied orgName
      let resolvedOrgName = orgName;
      if (!resolvedOrgName && orgId) {
        const matchedOrg = organizationOptions.find(
          (org) => org.value.toString() === orgId?.toString(),
        );
        resolvedOrgName = matchedOrg
          ? matchedOrg.orgName || matchedOrg.label.split(" - ")[1] || ""
          : "";
      }

      const completeNewEntryData = {
        id,
        firstName,
        lastName,
        isRev: rev === "true" || rev === true,
        isBrd: brd === "true" || brd === true,
        idType,
        acctId,
        orgId,
        orgName: resolvedOrgName, // ✅ NEW: Include orgName
        plcGlcCode: plc,
        perHourRate: hourRate,
        status: status || "ACT",
      };

      setNewEntry(completeNewEntryData);
      setPlcSearch(plc);
      setOrgSearch(orgId);

      // Handle month values
      if (monthValues.length > 0 && durations.length > 0) {
        const newPeriodHours = {};
        const sortedDurations = [...durations].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.monthNo - b.monthNo;
        });

        monthValues.forEach((value, index) => {
          if (
            index < sortedDurations.length &&
            value !== "0.00" &&
            value !== "0"
          ) {
            const duration = sortedDurations[index];
            const uniqueKey = `${duration.monthNo}${duration.year}`;
            newPeriodHours[uniqueKey] = value;
          }
        });
        setNewEntryPeriodHours(newPeriodHours);
      }
    };

    // const handlePasteToNewEntry = async () => {
    //   try {
    //     isPastingRef.current = true;

    //     // Check if there's an unsaved entry
    //     if (showNewForm && newEntry.id) {
    //       toast.warning("Please save the current entry before pasting again.", {
    //         autoClose: 3000,
    //       });
    //       isPastingRef.current = false;
    //       return;
    //     }

    //     const text = await navigator.clipboard.readText();

    //     if (!text || text.trim() === "") {
    //       toast.error("No data found in clipboard. Please copy data first.", {
    //         autoClose: 3000,
    //       });
    //       isPastingRef.current = false;
    //       return;
    //     }

    //     // Process the paste
    //     processPastedText(text);

    //     setTimeout(() => {
    //       isPastingRef.current = false;
    //     }, 300);
    //   } catch (err) {
    //     isPastingRef.current = false;
    //     toast.error(
    //       "Please use Ctrl+V to paste or grant clipboard permissions.",
    //       {
    //         autoClose: 3000,
    //       }
    //     );
    //   }
    // };

    // const processPastedText = (text) => {
    //   const lines = text.split("\n").filter((line) => line.trim() !== "");

    //   if (lines.length === 0) {
    //     toast.error("No valid data found in clipboard.", { autoClose: 3000 });
    //     return;
    //   }

    //   const isFirstLineHeaders =
    //     lines[0].toLowerCase().includes("id type") ||
    //     lines[0].toLowerCase().includes("account");

    //   const dataLines = isFirstLineHeaders ? lines.slice(1) : lines;

    //   if (dataLines.length === 0) {
    //     toast.error("No data rows found in clipboard.", { autoClose: 3000 });
    //     return;
    //   }

    //   // Process first row
    //   const firstRow = dataLines[0].split("\t");
    //   pasteRowData(firstRow);

    //   // Handle remaining rows
    //   if (dataLines.length > 1) {
    //     // If there are more rows, save current form and show next paste option
    //     toast.info(
    //       `Pasted 1 of ${dataLines.length} rows. Save this entry, then click Paste again for next row.`,
    //       { autoClose: 4000 }
    //     );

    //     // Update clipboard with remaining rows
    //     const remainingLines = [lines[0], ...dataLines.slice(1)];
    //     const remainingText = remainingLines.join("\n");

    //     navigator.clipboard
    //       .writeText(remainingText)
    //       .then(() => {
    //         // Keep hasClipboardData true for next paste
    //         setHasClipboardData(true);
    //         // Update copiedRowsData to remove first row
    //         setCopiedRowsData((prev) => prev.slice(1));
    //       })
    //       .catch((err) => {
    //         console.error("Failed to update clipboard:", err);
    //         // Even if clipboard update fails, keep states
    //         setHasClipboardData(true);
    //         setCopiedRowsData((prev) => prev.slice(1));
    //       });
    //   } else {
    //     // Last row - clear everything
    //     setHasClipboardData(false);
    //     setCopiedRowsData([]);
    //     toast.success("Data pasted successfully!", { autoClose: 2000 });
    //   }
    // };

    // const pasteRowData = (row) => {
    //   if (row.length < 11) {
    //     toast.error("Invalid data format. Please copy complete row data.", {
    //       autoClose: 3000,
    //     });
    //     return;
    //   }

    //   const [
    //     idTypeLabel,
    //     id,
    //     name,
    //     acctId,
    //     acctName,
    //     orgId,
    //     plc,
    //     rev,
    //     brd,
    //     status,
    //     hourRate,
    //     ...monthValues
    //   ] = row;

    //   // const idType =
    //   //   ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value || "Employee";

    //   const idType =
    //     ID_TYPE_OPTIONS.find(
    //       (opt) => opt.label.toLowerCase() === idTypeLabel.toLowerCase()
    //     )?.value || "Employee";

    //   let firstName = "";
    //   let lastName = "";

    //   if (idType === "PLC") {
    //     firstName = name || "";
    //   } else if (idType === "Vendor") {
    //     lastName = name || "";
    //   } else {
    //     const nameParts = (name || "").split(" ");
    //     firstName = nameParts[0] || "";
    //     lastName = nameParts.slice(1).join(" ") || "";
    //   }

    //   const completeNewEntryData = {
    //     id: id || "",
    //     firstName,
    //     lastName,
    //     isRev: rev === "✓",
    //     isBrd: brd === "✓",
    //     idType,
    //     acctId: acctId || "",
    //     orgId: orgId || "",
    //     plcGlcCode: plc || "",
    //     perHourRate: hourRate || "",
    //     status: status || "ACT",
    //   };

    //   setNewEntry(completeNewEntryData);
    //   setPlcSearch(plc || "");
    //   setOrgSearch(orgId || "");

    //   if (monthValues.length > 0 && durations.length > 0) {
    //     const newPeriodHours = {};
    //     const sortedDurations = [...durations].sort((a, b) => {
    //       if (a.year !== b.year) return a.year - b.year;
    //       return a.monthNo - b.monthNo;
    //     });

    //     monthValues.forEach((value, index) => {
    //       if (
    //         index < sortedDurations.length &&
    //         value &&
    //         value !== "0.00" &&
    //         value !== "0"
    //       ) {
    //         const duration = sortedDurations[index];
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //         newPeriodHours[uniqueKey] = value;
    //       }
    //     });

    //     setNewEntryPeriodHours(newPeriodHours);
    //   }
    // };
    // Update this function to handle the Total column correctly
    // const pasteRowData = (row) => {
    //   if (row.length < 11) {
    //     toast.error("Invalid data format. Please copy complete row data.", {
    //       autoClose: 3000,
    //     });
    //     return;
    //   }

    //   const [
    //     idTypeLabel,
    //     id,
    //     name,
    //     acctId,
    //     acctName,
    //     orgId,
    //     plc,
    //     rev,
    //     brd,
    //     status,
    //     hourRate,
    //     total, // <--- ADD THIS: Capture 'Total' so it is excluded from ...monthValues
    //     ...monthValues
    //   ] = row;

    //   const idType =
    //     ID_TYPE_OPTIONS.find(
    //       (opt) => opt.label.toLowerCase() === idTypeLabel.toLowerCase()
    //     )?.value || "Employee";

    //   let firstName = "";
    //   let lastName = "";

    //   if (idType === "PLC") {
    //     firstName = name || "";
    //   } else if (idType === "Vendor") {
    //     lastName = name || "";
    //   } else {
    //     const nameParts = (name || "").split(" ");
    //     firstName = nameParts[0] || "";
    //     lastName = nameParts.slice(1).join(" ") || "";
    //   }

    //   const completeNewEntryData = {
    //     id: id || "",
    //     firstName,
    //     lastName,
    //     isRev: rev === "✓",
    //     isBrd: brd === "✓",
    //     idType,
    //     acctId: acctId || "",
    //     orgId: orgId || "",
    //     plcGlcCode: plc || "",
    //     perHourRate: hourRate || "",
    //     status: status || "ACT",
    //   };

    //   setNewEntry(completeNewEntryData);
    //   setPlcSearch(plc || "");
    //   setOrgSearch(orgId || "");

    //   if (monthValues.length > 0 && durations.length > 0) {
    //     const newPeriodHours = {};
    //     const sortedDurations = [...durations].sort((a, b) => {
    //       if (a.year !== b.year) return a.year - b.year;
    //       return a.monthNo - b.monthNo;
    //     });

    //     monthValues.forEach((value, index) => {
    //       if (
    //         index < sortedDurations.length &&
    //         value &&
    //         value !== "0.00" &&
    //         value !== "0"
    //       ) {
    //         const duration = sortedDurations[index];
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //         newPeriodHours[uniqueKey] = value;
    //       }
    //     });

    //     setNewEntryPeriodHours(newPeriodHours);
    //   }
    // };

    useEffect(() => {
      const handleKeyDown = async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        //   e.preventDefault();
        //   e.stopPropagation();

          if (hasClipboardData && copiedRowsData.length > 0) {
            handlePasteMultipleRows();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [hasClipboardData, copiedRowsData]);

    const resetNewEntryForm = () => {
      setNewEntry({
        id: "",
        firstName: "",
        lastName: "",
        isRev: false,
        isBrd: false,
        idType: "",
        acctId: "",
        orgId: "",
        plcGlcCode: "",
        perHourRate: "",
        status: "Act",
      });
      setNewEntryPeriodHours({});
      setPlcSearch("");
      setOrgSearch("");
      setAutoPopulatedPLC(false);
    };

    // const getEmployeeRow = (emp, idx) => {
    //   if (!emp || !emp.emple) {
    //     return {
    //       idType: "-",
    //       emplId: "-",
    //       warning: false,
    //       name: "-",
    //       acctId: "-",
    //       acctName: "-", // ADD THIS LINE
    //       // orgId: "-",
    //       orgId: emp.emple.orgId || "-",
    //       orgName: (() => {
    //           const organizationId = emp.emple.orgId;
    //           if (!organizationId) return "-";

    //           // Search through the cached organizationOptions
    //           const matchedOrg = organizationOptions.find(
    //               (opt) => opt.value.toString() === organizationId.toString()
    //           );

    //           // If we have it in our list, return the Name, otherwise return the ID
    //           return matchedOrg ? matchedOrg.orgName : organizationId;
    //       })(),
    //       glcPlc: "-",
    //       isRev: "-",
    //       isBrd: "-",
    //       status: "-",
    //       perHourRate: "0",
    //       total: "0",
    //     };
    //   }

    //   const formatIdType = (str) => {
    //   if (!str || str === "-") return "-";
    //   return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    // };

    // const rawType = emp.emple.type || "-";

    // const typeLabel = ID_TYPE_OPTIONS.find((opt) => opt.value === rawType)?.label || rawType;

    //   const monthHours = getMonthHours(emp);
    //   const totalHours = sortedDurations.reduce((sum, duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //     const forecastValue = monthHours[uniqueKey]?.value;
    //     const value =
    //       inputValue !== undefined && inputValue !== ""
    //         ? inputValue
    //         : forecastValue;
    //     return sum + (value && !isNaN(value) ? Number(value) : 0);
    //   }, 0);

    //   // CHECK FOR ANY LOCAL WARNINGS FOR THIS SPECIFIC EMPLOYEE
    //   const emplId = emp.emple.emplId;
    //   const plcCode = emp.emple.plcGlcCode || "";

    //   // Check hours warnings (existing logic)
    //   const hasHoursWarning = sortedDurations.some((duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     const warningKey = generateWarningKey(emplId, plcCode, uniqueKey);
    //     return localWarnings[warningKey];
    //   });

    //   // CHECK FOR ACCOUNT/ORG FIELD WARNINGS
    //   const accountWarningKey = generateFieldWarningKey(
    //     emplId,
    //     "account",
    //     emp.emple.accId
    //   );
    //   const orgWarningKey = generateFieldWarningKey(
    //     emplId,
    //     "organization",
    //     emp.emple.orgId
    //   );
    //   const hasAccountWarning = localWarnings[accountWarningKey];
    //   const hasOrgWarning = localWarnings[orgWarningKey];

    //   // Combine all warning types
    //   const warningValue =
    //     emp.isWarning ||
    //     emp.emple?.isWarning ||
    //     hasHoursWarning ||
    //     hasAccountWarning ||
    //     hasOrgWarning ||
    //     false;

    //   return {
    //     // idType:
    //     //   ID_TYPE_OPTIONS.find(
    //     //     (opt) => opt.value === (emp.emple.type || "-")
    //     //   )?.label ||
    //     //   emp.emple.type ||
    //     //   "-",
    //     idType: formatIdType(typeLabel),
    //     emplId: emp.emple.emplId,
    //     warning: Boolean(warningValue),
    //     name:
    //       emp.emple.idType === "Vendor"
    //         ? emp.emple.lastName || emp.emple.firstName || "-"
    //         : `${emp.emple.firstName || ""} ${emp.emple.lastName || ""}`.trim() ||
    //           "-",
    //     acctId:
    //       emp.emple.accId ||
    //       (laborAccounts.length > 0 ? laborAccounts[0].id : "-"),
    //     acctName: (() => {
    //       const accountId =
    //         emp.emple.accId ||
    //         (laborAccounts.length > 0 ? laborAccounts[0].id : "-");
    //       const accountWithName = accountOptionsWithNames.find(
    //         (acc) => acc.id === accountId
    //       );
    //       return accountWithName ? accountWithName.name : "-";
    //     })(),
    //     orgId: emp.emple.orgId || "-",
    //     glcPlc: (() => {
    //       const plcCode = emp.emple.plcGlcCode || "";
    //       if (!plcCode) return "-";

    //       const plcOption =
    //         plcOptions.find((option) => option.value === plcCode) ||
    //         updatePlcOptions.find((option) => option.value === plcCode);

    //       return plcOption ? plcOption.label : plcCode;
    //     })(),
    //     isRev: emp.emple.isRev ? (
    //       <span className="text-green-600 font-sm text-lg">✓</span>
    //     ) : (
    //       "-"
    //     ),
    //     isBrd: emp.emple.isBrd ? (
    //       <span className="text-green-600 font-sm text-lg">✓</span>
    //     ) : (
    //       "-"
    //     ),
    //     status: emp.emple.status || "Act",
    //     perHourRate:
    //       emp.emple.perHourRate !== undefined && emp.emple.perHourRate !== null
    //         ? Number(emp.emple.perHourRate).toFixed(2)
    //         : "0",
    //     total: totalHours.toFixed(2) || "-",
    //   };
    // };

    const getEmployeeRow = (emp, idx) => {
      // Keep the same safe default row when emp/emple is missing
      if (!emp || !emp.emple) {
        return {
          idType: "-",
          emplId: "-",
          warning: false,
          name: "-",
          acctId: "-",
          acctName: "-",
          orgId: "-",
          orgName: "-", // just "-"
          glcPlc: "-",
          isRev: "-",
          isBrd: "-",
          status: "-",
          perHourRate: "0",
          effectDt: "",
          total: "0",
        };
      }

      // const formatIdType = (str) => {
      //   if (!str || str === "-") return "-";
      //   return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      // };

      const formatIdType = (str) => {
        if (!str || str === "-") return "-";
        const trimmedStr = str.trim();
        if (trimmedStr.toUpperCase() === "PLC") {
          return "PLC";
        }
        return str
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
      };
      // const formatIdType = (str) => {
      //   if (!str || str === "-") return "-";

      //   const trimmedStr = str.trim();

      //   // Convert to uppercase once to handle any variation (plc, Plc, pLc)
      //   if (trimmedStr.toUpperCase() === "PLC") {
      //     return "PLC";
      //   }

      //   // For everything else: First letter Capital, rest lowercase
      //   return (
      //     trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase()
      //   );
      // };

      const rawType = emp.emple.type || "-";
      const typeLabel =
        ID_TYPE_OPTIONS.find((opt) => opt.value === rawType)?.label || rawType;

      const monthHours = getMonthHours(emp);
      const totalHours = sortedDurations.reduce((sum, duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        const inputValue = inputValues[`${idx}_${uniqueKey}`];
        const forecastValue = monthHours[uniqueKey]?.value;
        const value =
          inputValue !== undefined && inputValue !== ""
            ? inputValue
            : forecastValue;
        return sum + (value && !isNaN(value) ? Number(value) : 0);
      }, 0);

      // CHECK FOR ANY LOCAL WARNINGS FOR THIS SPECIFIC EMPLOYEE
      const emplId = emp.emple.emplId;
      const plcCode = emp.emple.plcGlcCode || "";

      // Check hours warnings (existing logic)
      const hasHoursWarning = sortedDurations.some((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        const warningKey = generateWarningKey(emplId, plcCode, uniqueKey);
        return localWarnings[warningKey];
      });

      // CHECK FOR ACCOUNT/ORG FIELD WARNINGS
      const accountWarningKey = generateFieldWarningKey(
        emplId,
        "account",
        emp.emple.accId,
      );
      const orgWarningKey = generateFieldWarningKey(
        emplId,
        "organization",
        emp.emple.orgId,
      );
      const hasAccountWarning = localWarnings[accountWarningKey];
      const hasOrgWarning = localWarnings[orgWarningKey];

      // Combine all warning types
      const warningValue =
        emp.isWarning ||
        emp.emple?.isWarning ||
        hasHoursWarning ||
        hasAccountWarning ||
        hasOrgWarning ||
        false;

      // NEW: resolve orgName from orgId using organizationOptions / updateOrganizationOptions
      const organizationId = emp.emple.orgId;
      let resolvedOrgName = "";

      if (organizationId) {
        const matchedOrg =
          (organizationOptions || []).find(
            (opt) => opt.value?.toString() === organizationId.toString(),
          ) ||
          (updateOrganizationOptions || []).find(
            (opt) => opt.value?.toString() === organizationId.toString(),
          );

        if (matchedOrg) {
          // prefer explicit orgName, then label, then fall back to the id
          resolvedOrgName =
            matchedOrg.orgName || matchedOrg.label || organizationId;
        } else {
          resolvedOrgName = "";
        }
      }

      const accountId =
        emp?.emple?.accId || emp?.emple?.plForecasts?.[0]?.acctId;
      const effectiveDate =
        emp?.emple?.effectiveDate || emp?.emple?.[0]?.effectiveDate;
      const esc_Percent =
        emp?.emple?.esc_Percent || emp?.emple?.[0]?.esc_Percent;
;

      let resolvedAccountName = "";

      if (accountId) {
        const accountIdStr = String(accountId);

        const matchedAccount = [
          ...(accountOptions || []),
          ...(updateAccountOptions || []),
        ].find((opt) => String(opt?.value) === accountIdStr);

        resolvedAccountName =
          matchedAccount?.accountName || matchedAccount?.label || accountIdStr;
      }

      // return {
      //   // idType:
      //   //   ID_TYPE_OPTIONS.find(
      //   //     (opt) => opt.value === (emp.emple.type || "-")
      //   //   )?.label ||
      //   //   emp.emple.type ||
      //   //   "-",
      //   idType: formatIdType(typeLabel),
      //   emplId: emp.emple.emplId,
      //   warning: Boolean(warningValue),
      //   name:
      //     emp.emple.idType === "Vendor"
      //       ? emp.emple.lastName || emp.emple.firstName || "-"
      //       : `${emp.emple.firstName || ""} ${emp.emple.lastName || ""}`.trim() ||
      //         "-",
      //   acctId:
      //     emp.emple.accId ||
      //     (laborAccounts.length > 0 ? laborAccounts[0].id : "-"),
      //   acctName: (() => {
      //     const accountId =
      //       emp.emple.accId ||
      //       (laborAccounts.length > 0 ? laborAccounts[0].id : "-");
      //     const accountWithName = accountOptionsWithNames.find(
      //       (acc) => acc.id === accountId
      //     );
      //     return accountWithName ? accountWithName.name : "-";
      //   })(),
      //   orgId: emp.emple.orgId || "-",
      //   orgName: resolvedOrgName, // <-- only addition to main return
      //   glcPlc: (() => {
      //     const plcCode = emp.emple.plcGlcCode || "";
      //     if (!plcCode) return "-";

      //     const plcOption =
      //       plcOptions.find((option) => option.value === plcCode) ||
      //       updatePlcOptions.find((option) => option.value === plcCode);

      //     return plcOption ? plcOption.label : plcCode;
      //   })(),
      //   isRev: emp.emple.isRev ? (
      //     <span className="text-green-600 font-sm text-lg">✓</span>
      //   ) : (
      //     "-"
      //   ),
      //   isBrd: emp.emple.isBrd ? (
      //     <span className="text-green-600 font-sm text-lg">✓</span>
      //   ) : (
      //     "-"
      //   ),
      //   status: emp.emple.status || "Act",
      //   perHourRate:
      //     emp.emple.perHourRate !== undefined && emp.emple.perHourRate !== null
      //       ? Number(emp.emple.perHourRate).toFixed(2)
      //       : "0",
      //   total: totalHours.toFixed(2) || "-",
      // };

      return {
        idType: formatIdType(typeLabel),
        emplId: emp.emple.emplId,
        warning: Boolean(warningValue),
        name:
          emp.emple.idType === "Vendor"
            ? emp.emple.lastName || emp.emple.firstName || "-"
            : emp.emple.idType === "PLC"
              ? emp.emple.firstName || "PLC"
              : `${emp.emple.firstName || ""} ${emp.emple.lastName || ""}`.trim() ||
                "-",
        acctId:
          emp.emple.accId ||
          (laborAccounts.length > 0 ? laborAccounts[0].id : "-"),
        // Account name resolution: Prefer mapped account options, but DO NOT
        // rely solely on `accountOptionsWithNames` because that list can be
        // temporarily empty (e.g., when toggling the New form and fetching
        // accounts). If no mapped account is found, fall back to any account
        // name that may already exist on the employee record (emp.emple.acctName
        // or emp.emple.accName) before showing a generic "-". This prevents
        // the visible account name from blanking briefly when clicking "New".
        acctName: (() => {
          const accountId =
            emp.emple.accId ||
            (laborAccounts.length > 0 ? laborAccounts[0].id : null);

          // If there is no accountId at all, try to return any employee-provided
          // account name before falling back to "-".
          if (!accountId) return emp.emple.acctName || emp.emple.accName || "-";

          const accountWithName =
            accountOptionsWithNames.find((acc) => acc.id === accountId) ||
            updateAccountOptions.find((acc) => acc.id === accountId) ||
            laborAccounts.find((acc) => acc.id === accountId);

          // Prefer the mapped account's name when available; otherwise fall back
          // to any account name already present on the employee object.
          return accountWithName
            ? accountWithName.name ||
                accountWithName.acctName ||
                accountWithName.label ||
                emp.emple.acctName ||
                emp.emple.accName ||
                resolvedAccountName
            : emp.emple.acctName || emp.emple.accName || "-";
        })(),
        orgId: emp.emple.orgId || "-",
        orgName: resolvedOrgName || "-", // Your orgName logic is already correct
        glcPlc: (() => {
          const plcCode = emp.emple.plcGlcCode || "";
          if (!plcCode) return "-";
          const plcOption =
            plcOptions.find((option) => option.value === plcCode) ||
            updatePlcOptions.find((option) => option.value === plcCode);
          return plcOption ? plcOption.label : plcCode;
        })(),
        isRev: emp.emple.isRev ? (
          <span className="text-green-600 font-sm text-lg">✓</span>
        ) : (
          "-"
        ),
        isBrd: emp.emple.isBrd ? (
          <span className="text-green-600 font-sm text-lg">✓</span>
        ) : (
          "-"
        ),
        status: emp.emple.status || "Act",
        perHourRate:
          emp.emple.perHourRate !== undefined && emp.emple.perHourRate !== null
            ? Number(emp.emple.perHourRate).toFixed(2)
            : "0",
        total: totalHours.toFixed(2) || "-",
        effectiveDate: effectiveDate,
        esc_Percent: Number(esc_Percent).toFixed(2),
      };
    };

    const getMonthHours = (emp) => {
      const monthHours = {};
      if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
        emp.emple.plForecasts.forEach((forecast) => {
          // console.log(forecast)
          const uniqueKey = `${forecast.month}_${forecast.year}`;
          const value =
            planType === "EAC" && forecast.actualhours !== undefined
              ? forecast.actualhours
              : (forecast.forecastedhours ?? 0);
          monthHours[uniqueKey] = { value, ...forecast };
        });
      }
      return monthHours;
    };
    const getMonthCost = (emp) => {
      const monthHours = {};
      if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
        emp.emple.plForecasts.forEach((forecast) => {
          const uniqueKey = `${forecast.month}_${forecast.year}`;
          const value = forecast.cost || 0;
          monthHours[uniqueKey] = { value, ...forecast };
        });
      }
      return monthHours;
    };
    // console.log(getMonthCost())

    // Calculate column totals for each month
    // const calculateColumnTotals = () => {
    //   const columnTotals = {};

    //   sortedDurations.forEach((duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     let total = 0;

    //     // Sum hours from existing employees
    //     localEmployees.forEach((emp, idx) => {
    //       if (hiddenRows[idx]) return; // Skip hidden rows

    //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //       const monthHours = getMonthHours(emp);
    //       const forecastValue = monthHours[uniqueKey]?.value;
    //       const value =
    //         inputValue !== undefined && inputValue !== ""
    //           ? inputValue
    //           : forecastValue;

    //       total += value && !isNaN(value) ? Number(value) : 0;
    //     });

    //     // Add hours from new entry form if visible
    //     if (showNewForm) {
    //       const newEntryValue = newEntryPeriodHours[uniqueKey];
    //       total +=
    //         newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
    //     }

    //     columnTotals[uniqueKey] = total;
    //   });

    //   return columnTotals;
    // };

    // Calculate column totals for each month
    // const calculateColumnTotals = () => {
    //   const columnTotals = {};

    //   // Initialize CTD and Prior Year totals
    //   let ctdTotal = 0;
    //   let priorYearTotal = 0;

    //   const currentFiscalYear = fiscalYear !== "All" ? parseInt(fiscalYear) : null;

    //   sortedDurations.forEach((duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     let total = 0;

    //     // Sum hours from existing employees
    //     localEmployees.forEach((emp, idx) => {
    //       if (hiddenRows[idx]) return; // Skip hidden rows
    //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //       const monthHours = getMonthHours(emp);
    //       const forecastValue = monthHours[uniqueKey]?.value;
    //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
    //       total += value && !isNaN(value) ? Number(value) : 0;
    //     });

    //     // Add hours from new entry form if visible
    //     if (showNewForm) {
    //       const newEntryValue = newEntryPeriodHours[uniqueKey];
    //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
    //     }

    //     columnTotals[uniqueKey] = total;

    //     // Calculate CTD and Prior Year based on fiscal year selection
    //     if (currentFiscalYear) {
    //       const startYear = parseInt(startDate.split('-')[0]); // Extract start year from startDate

    //       // Prior Year: sum of (selected fiscal year - 1)
    //       if (duration.year === currentFiscalYear - 1) {
    //         priorYearTotal += total;
    //       }

    //       // CTD: sum from start year to (selected fiscal year - 2)
    //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
    //         ctdTotal += total;
    //       }
    //     }
    //   });

    //   // Add CTD and Prior Year to columnTotals
    //   columnTotals['ctd'] = ctdTotal;
    //   columnTotals['priorYear'] = priorYearTotal;

    //   return columnTotals;
    // };

    // const calculateColumnTotals = () => {
    //   const columnTotals = {};

    //   let ctdTotal = 0;
    //   let priorYearTotal = 0;

    //   // const currentFiscalYear = normalizedFiscalYear !== "All"  ? parseInt(fiscalYear) : null;
    //    const currentFiscalYear = normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
    //   const startYear = parseInt(startDate.split('-')[0]);

    //   // ✅ First, calculate CTD and Prior Year from ALL durations
    //   if (currentFiscalYear) {
    //     durations.forEach((duration) => {
    //       let total = 0;
    //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //       // Sum hours from existing employees
    //       localEmployees.forEach((emp, idx) => {
    //         if (hiddenRows[idx]) return;
    //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //         const monthHours = getMonthHours(emp);
    //         const forecastValue = monthHours[uniqueKey]?.value;
    //         const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
    //         total += value && !isNaN(value) ? Number(value) : 0;
    //       });

    //       // Add hours from new entry form if visible
    //       if (showNewForm) {
    //         const newEntryValue = newEntryPeriodHours[uniqueKey];
    //         total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
    //       }

    //       // Prior Year: sum of (selected fiscal year - 1)
    //       if (duration.year === currentFiscalYear - 1) {
    //         priorYearTotal += total;
    //       }

    //       // CTD: sum from start year to (selected fiscal year - 2)
    //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
    //         ctdTotal += total;
    //       }
    //     });
    //   }

    //   // Now calculate monthly totals for visible columns (filtered by fiscal year)
    //   sortedDurations.forEach((duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     let total = 0;

    //     // Sum hours from existing employees
    //     localEmployees.forEach((emp, idx) => {
    //       if (hiddenRows[idx]) return;
    //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //       const monthHours = getMonthHours(emp);
    //       const forecastValue = monthHours[uniqueKey]?.value;
    //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
    //       total += value && !isNaN(value) ? Number(value) : 0;
    //     });

    //     // Add hours from new entry form if visible
    //     if (showNewForm) {
    //       const newEntryValue = newEntryPeriodHours[uniqueKey];
    //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
    //     }

    //     columnTotals[uniqueKey] = total;
    //   });

    //   // Add CTD and Prior Year to columnTotals
    //   // columnTotals['ctd'] = ctdTotal;
    //   // columnTotals['priorYear'] = priorYearTotal;
    //   if (currentFiscalYear) {
    //   columnTotals['ctd'] = ctdTotal;
    //   columnTotals['priorYear'] = priorYearTotal;
    // }

    //   return columnTotals;
    // };

    // const calculateColumnTotals = () => {
    //   const columnTotals = {};

    //   let ctdTotal = 0;
    //   let priorYearTotal = 0;

    //   const currentFiscalYear = normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;

    //   // ✅ Only calculate CTD and Prior Year when a specific fiscal year is selected
    //   if (currentFiscalYear !== null) {
    //     const startYear = parseInt(startDate.split('-')[0]);

    //     // Calculate CTD and Prior Year from ALL durations
    //     durations.forEach((duration) => {
    //       let total = 0;
    //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //       // Sum hours from existing employees
    //       localEmployees.forEach((emp, idx) => {
    //         if (hiddenRows[idx]) return;
    //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //         const monthHours = getMonthHours(emp);
    //         const forecastValue = monthHours[uniqueKey]?.value;
    //         const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
    //         total += value && !isNaN(value) ? Number(value) : 0;
    //       });

    //       // Add hours from new entry form if visible
    //       if (showNewForm) {
    //         const newEntryValue = newEntryPeriodHours[uniqueKey];
    //         total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
    //       }

    //       // Prior Year: sum of (selected fiscal year - 1)
    //       if (duration.year === currentFiscalYear - 1) {
    //         priorYearTotal += total;
    //       }

    //       // CTD: sum from start year to (selected fiscal year - 2)
    //       if (duration.year >= startYear && duration.year <= currentFiscalYear - 2) {
    //         ctdTotal += total;
    //       }
    //     });

    //     // Add CTD and Prior Year to columnTotals only when fiscal year is selected
    //     columnTotals['ctd'] = ctdTotal;
    //     columnTotals['priorYear'] = priorYearTotal;
    //   }

    //   // Now calculate monthly totals for visible columns (filtered by fiscal year)
    //   sortedDurations.forEach((duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     let total = 0;

    //     // Sum hours from existing employees
    //     localEmployees.forEach((emp, idx) => {
    //       if (hiddenRows[idx]) return;
    //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //       const monthHours = getMonthHours(emp);
    //       const forecastValue = monthHours[uniqueKey]?.value;
    //       const value = inputValue !== undefined && inputValue !== "" ? inputValue : forecastValue;
    //       total += value && !isNaN(value) ? Number(value) : 0;
    //     });

    //     // Add hours from new entry form if visible
    //     if (showNewForm) {
    //       const newEntryValue = newEntryPeriodHours[uniqueKey];
    //       total += newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
    //     }

    //     columnTotals[uniqueKey] = total;
    //   });

    //   return columnTotals;
    // };

    // REPLACE THE ENTIRE FUNCTION WITH THIS:
    // const columnTotals = useMemo(() => {
    //   const totals = {};
    //   const currentFiscalYear =
    //     normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;

    //   if (currentFiscalYear === null) {
    //     // Only calculate monthly totals
    //     sortedDurations.forEach((duration) => {
    //       const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //       let total = 0;

    //       localEmployees.forEach((emp, idx) => {
    //         if (hiddenRows[idx]) return;
    //         const monthHours = getMonthHours(emp);
    //         const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //         const forecastValue = monthHours[uniqueKey]?.value;
    //         const value =
    //           inputValue !== undefined && inputValue !== ""
    //             ? inputValue
    //             : forecastValue;
    //         total += value && !isNaN(value) ? Number(value) : 0;
    //       });

    //       totals[uniqueKey] = total;
    //     });
    //     return totals;
    //   }

    //   // Calculate CTD, Prior Year, and Monthly totals
    //   let ctdTotal = 0;
    //   let priorYearTotal = 0;
    //   const startYear = parseInt(startDate.split("-")[0]);

    //   durations.forEach((duration) => {
    //     const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //     let monthlyTotal = 0;

    //     localEmployees.forEach((emp, idx) => {
    //       if (hiddenRows[idx]) return;
    //       const monthHours = getMonthHours(emp);
    //       const inputValue = inputValues[`${idx}_${uniqueKey}`];
    //       const forecastValue = monthHours[uniqueKey]?.value;
    //       const value =
    //         inputValue !== undefined && inputValue !== ""
    //           ? inputValue
    //           : forecastValue;
    //       const numValue = value && !isNaN(value) ? Number(value) : 0;
    //       monthlyTotal += numValue;
    //     });

    //     // Only add CTD if it's a display column
    //     if (sortedDurations.some((d) => `${d.monthNo}_${d.year}` === uniqueKey)) {
    //       totals[uniqueKey] = monthlyTotal;
    //     }

    //     // Calculate CTD and Prior Year
    //     if (duration.year === currentFiscalYear - 1) {
    //       priorYearTotal += monthlyTotal;
    //     }

    //     if (
    //       duration.year >= startYear &&
    //       duration.year <= currentFiscalYear - 2
    //     ) {
    //       ctdTotal += monthlyTotal;
    //     }
    //   });

    //   totals["ctd"] = ctdTotal;
    //   totals["priorYear"] = priorYearTotal;

    //   return totals;
    // }, [
    //   durations,
    //   localEmployees,
    //   hiddenRows,
    //   inputValues,
    //   sortedDurations,
    //   normalizedFiscalYear,
    //   startDate,
    // ]);

    // REPLACE your current columnTotals useMemo with this updated version:
    const columnTotals = useMemo(() => {
      const totals = {};
      const currentFiscalYear =
        normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
      const startYear = parseInt(startDate.split("-")[0]);

      // Use durations if year is All, otherwise use all available durations to calculate CTD/Prior correctly
      const calcDurations =
        currentFiscalYear === null ? sortedDurations : durations;

      calcDurations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        let monthlyHoursTotal = 0;
        let monthlyCostTotal = 0; // New accumulator for cost

        localEmployees.forEach((emp, idx) => {
          if (hiddenRows[idx]) return;

          const monthHoursMap = getMonthHours(emp);
          const forecast = monthHoursMap[uniqueKey];

          // Hours logic (existing)
          const inputValue = inputValues[`${idx}_${uniqueKey}`];
          const hoursValue =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecast?.value || 0;
          monthlyHoursTotal +=
            hoursValue && !isNaN(hoursValue) ? Number(hoursValue) : 0;

          // Cost logic (NEW)
          // Note: We use forecast.forecastedCost from the API response
          monthlyCostTotal += forecast?.forecastedCost || 0;
        });

        // Store hours
        totals[uniqueKey] = monthlyHoursTotal;
        // Store cost with a specific suffix to distinguish it
        totals[`${uniqueKey}_cost`] = monthlyCostTotal;

        // CTD / Prior Year logic for Cost
        if (currentFiscalYear !== null) {
          if (duration.year === currentFiscalYear - 1) {
            totals["priorYear"] =
              (totals["priorYear"] || 0) + monthlyHoursTotal;
            totals["priorYear_cost"] =
              (totals["priorYear_cost"] || 0) + monthlyCostTotal;
          }
          if (
            duration.year >= startYear &&
            duration.year <= currentFiscalYear - 2
          ) {
            totals["ctd"] = (totals["ctd"] || 0) + monthlyHoursTotal;
            totals["ctd_cost"] = (totals["ctd_cost"] || 0) + monthlyCostTotal;
          }
        }
      });

      return totals;
    }, [
      durations,
      localEmployees,
      hiddenRows,
      inputValues,
      sortedDurations,
      normalizedFiscalYear,
      startDate,
    ]);

    useEffect(() => {
      if (typeof onColumnTotalsChange === "function") {
        onColumnTotalsChange(columnTotals);
      }
    }, [columnTotals, onColumnTotalsChange]);

    // ADD THIS NEW MEMOIZED VALUE:
    const employeeYearTotals = useMemo(() => {
      const totals = {};
      const currentFiscalYear =
        normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;

      if (currentFiscalYear === null) return totals;

      const startYear = parseInt(startDate.split("-")[0]);

      localEmployees.forEach((emp, idx) => {
        if (hiddenRows[idx]) return;

        const monthHours = getMonthHours(emp);
        let empCtd = 0;
        let empPriorYear = 0;

        durations.forEach((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          const inputValue = inputValues[`${idx}_${uniqueKey}`];
          const forecastValue = monthHours[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue;
          const numValue = value && !isNaN(value) ? Number(value) : 0;

          if (duration.year === currentFiscalYear - 1) {
            empPriorYear += numValue;
          }

          if (
            duration.year >= startYear &&
            duration.year <= currentFiscalYear - 2
          ) {
            empCtd += numValue;
          }
        });

        totals[idx] = { ctd: empCtd, priorYear: empPriorYear };
      });

      return totals;
    }, [
      localEmployees,
      hiddenRows,
      inputValues,
      durations,
      normalizedFiscalYear,
      startDate,
    ]);

    const handleInputChange = (empIdx, uniqueKey, newValue) => {
      if (!isEditable) return;

      // Only allow numbers and dots
      if (!/^[0-9.]*$/.test(newValue)) return;

      // Silently update state - NO validation here, so backspace works perfectly
      setInputValues((prev) => ({
        ...prev,
        [`${empIdx}_${uniqueKey}`]: newValue,
      }));

      setModifiedHours((prev) => ({
        ...prev,
        [`${empIdx}_${uniqueKey}`]: {
          empIdx,
          uniqueKey,
          newValue,
          employee: localEmployees[empIdx],
        },
      }));
      setHasUnsavedHoursChanges(true);

      // Red Warning Icon logic (Non-blocking)
      const emp = localEmployees[empIdx];
      if (emp?.emple) {
        const warningKey = generateWarningKey(
          emp.emple.emplId,
          emp.emple.plcGlcCode,
          uniqueKey,
        );
        const hasWarning = checkHoursExceedLimit(empIdx, uniqueKey, newValue);
        setLocalWarnings((prev) => {
          const updated = { ...prev };
          if (hasWarning) updated[warningKey] = true;
          else delete updated[warningKey];
          return updated;
        });
      }
    };

    const visibleEmployeeColumns = EMPLOYEE_COLUMNS.filter((col) => {
      // skip Hour Rate if no access
      if (col.key === "perHourRate" && !(canView("perHourRate"))) {
        return false;
      }

      return true;
    });

    const handleInputBlur = (empIdx, uniqueKey, value) => {
      if (!isEditable || value === "") return;

      if (!value || value.toString().trim() === "") return;

      const cellKey = `${empIdx}_${uniqueKey}`;
      if (!inputValues.hasOwnProperty(cellKey)) {
        return;
      }

      const duration = sortedDurations.find(
        (d) => `${d.monthNo}_${d.year}` === uniqueKey,
      );
      if (!duration || !duration.workingHours) return;

      const maxAllowedHours = duration.workingHours * 2;
      const currentInputNumeric = parseFloat(value) || 0;

      const targetEmp = localEmployees[empIdx];
      const targetEmplId = targetEmp?.emple?.emplId;

      if (targetEmplId) {
        // 1. Sum existing rows with same ID
        const existingRowsSum = localEmployees.reduce((sum, emp, idx) => {
          if (emp?.emple?.emplId === targetEmplId && idx !== empIdx) {
            const inputVal = inputValues[`${idx}_${uniqueKey}`];
            const forecastVal = getMonthHours(emp)[uniqueKey]?.value || 0;
            const val =
              inputVal !== undefined && inputVal !== ""
                ? inputVal
                : forecastVal;
            return sum + (parseFloat(val) || 0);
          }
          return sum;
        }, 0);

        // 2. Sum new/pasted entries with same ID
        const newEntriesSum = newEntries.reduce((sum, entry, idx) => {
          if (entry.id === targetEmplId) {
            const val = newEntryPeriodHoursArray[idx]?.[uniqueKey] || 0;
            return sum + (parseFloat(val) || 0);
          }
          return sum;
        }, 0);

        const totalForThisId =
          existingRowsSum + newEntriesSum + currentInputNumeric;

        // 3. Show Toast only on Blur if it exceeds limit
        if (totalForThisId > maxAllowedHours) {
          toast.error(
            `Total hours for ID ${targetEmplId} (${totalForThisId.toFixed(2)}) exceeds limit of ${maxAllowedHours}.`,
            { autoClose: 4000, toastId: `blur-err-${targetEmplId}` },
          );
        }
      }
    };

   const handleSaveAll = async () => {
      const hasHoursChanges = Object.keys(modifiedHours).length > 0;
      const hasEmployeeChanges = Object.keys(editedEmployeeData).length > 0;

      if (!hasHoursChanges && !hasEmployeeChanges) {
        return true;
      }
 
      // --- STRICT VALIDATION FOR EDITED GRID DATA ---
      if (hasEmployeeChanges && planType !== "NBBUD") {
        for (const empIdx in editedEmployeeData) {
          const edit = editedEmployeeData[empIdx];
          const emp = localEmployees[empIdx];
          const emplId = emp?.emple?.emplId || "Unknown";
 
          let errorFound = false;
          let errorMsg = "";
 
          // 1. Validate Account (acctId)
          if (edit.acctId !== undefined && edit.acctId !== "") {
            const isAccValid = updateAccountOptions.some(
              (opt) => opt.id === edit.acctId.trim(),
            );
            if (!isAccValid) {
              errorMsg = `ID ${emplId}: Account "${edit.acctId}" is invalid. Please select from suggestions.`;
              errorFound = true;
            }
          }
 
          // 2. Validate Organization (orgId)
          if (!errorFound && edit.orgId !== undefined && edit.orgId !== "") {
            const isOrgValid = updateOrganizationOptions.some(
              (opt) => opt.value.toString() === edit.orgId.toString().trim(),
            );
            if (!isOrgValid) {
              errorMsg = `ID ${emplId}: Organization "${edit.orgId}" is invalid. Please select from suggestions.`;
              errorFound = true;
            }
          }
 
          // 3. Validate PLC (glcPlc)
          if (
            !errorFound &&
            edit.glcPlc !== undefined &&
            edit.glcPlc !== "" &&
            emp.emple.type !== "Other"
          ) {
            const cleanPlcValue = edit.glcPlc.split("-")[0].trim();
            const isPlcValid = updatePlcOptions.some(
              (opt) => opt.value.toLowerCase() === cleanPlcValue.toLowerCase(),
            );
            if (!isPlcValid) {
              errorMsg = `ID ${emplId}: PLC "${cleanPlcValue}" is invalid. Please select from suggestions.`;
              errorFound = true;
            }
          }
 
          // If any validation failed for this specific row:
          if (errorFound) {
            toast.error(errorMsg);
 
            // AUTO-SELECT THE ROW via checkbox
            handleCheckboxSelection(parseInt(empIdx), true);
 
            // SCROLL TO THE ROW
            const rowElement = document.getElementById(`emp-row-${empIdx}`);
            if (rowElement) {
              rowElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
 
            return false; // BLOCK SAVE COMPLETELY
          }
        }
      }
 
      setIsLoading(true);
      let successCount = 0;
      let errorCount = 0;
 
      try {
        // 1. Save employee field changes (Account, Org, PLC, etc.)
        if (hasEmployeeChanges) {
          for (const empIdx in editedEmployeeData) {
            const emp = localEmployees[empIdx];
            const editedData = editedEmployeeData[empIdx];
 
            if (!emp || !emp.emple) {
              errorCount++;
              continue;
            }
 
            const payload = {
              id: emp.emple.id || 0,
              emplId: emp.emple.emplId,
              firstName:
                editedData.firstName !== undefined
                  ? editedData.firstName
                  : emp.emple.firstName || "",
              lastName: emp.emple.lastName || "",
              type: emp.emple.type || " ",
              isRev:
                editedData.isRev !== undefined
                  ? editedData.isRev
                  : emp.emple.isRev,
              isBrd:
                editedData.isBrd !== undefined
                  ? editedData.isBrd
                  : emp.emple.isBrd,
                  plcGlcCode: (editedData.glcPlc || emp.emple.plcGlcCode || "")
    .toString()
    .split("-")[0]
    .trim()
    .substring(0, 20) || null,
              // plcGlcCode: (editedData.glcPlc || emp.emple.plcGlcCode || "")
              //   .split("-")[0]
              //   .trim()
              //   .substring(0, 20),
              perHourRate: Number(
                editedData.perHourRate || emp.emple.perHourRate || 0,
              ),
              status: emp.emple.status || "Act",
              accId: editedData.acctId || emp.emple.accId || "",
              orgId: editedData.orgId || emp.emple.orgId || "",
              plId: planId,
              plForecasts: emp.emple.plForecasts || [],
              effectiveDate: getMonthEndDate(editedData.effectiveDate) || getMonthEndDate(emp.emple.effectiveDate) || "2026-01-30",
              esc_Percent: editedData.esc_Percent || emp.emple.esc_Percent || 0,
            };
 
            // if (payload.perHourRate > 10000){
            //    toast.error(
            //      `Cannot save. Hour Rate for ID ${payload.emplId} exceed limit of ${10000}.`,
            //      { autoClose: 5000 },
            //    );
            //    return;
 
            // }
              await axios.put(
                `${backendUrl}/Employee/UpdateEmployee?plid=${planId}&TemplateId=${templateId}`,
                payload,
                {
                  headers: { "Content-Type": "application/json" },
                },
              );
 
            // Update local state for fields
            setLocalEmployees((prev) => {
              const updated = [...prev];
              updated[empIdx] = {
                ...updated[empIdx],
                emple: { ...updated[empIdx].emple, ...payload },
              };
              return updated;
            });
            successCount++;
          }
        }
 
        // 2. Save hours changes (the grid monthly inputs)
        // if (hasHoursChanges) {
        //   for (const key in modifiedHours) {
        //     const { empIdx, uniqueKey, newValue, employee } =
        //       modifiedHours[key];
        //     const targetId = employee?.emple?.emplId;
        //     const newNumericValue = parseFloat(newValue) || 0;
 
        //     // Find limit
        //     const duration = sortedDurations.find(
        //       (d) => `${d.monthNo}_${d.year}` === uniqueKey,
        //     );
        //     if (duration && duration.workingHours) {
        //       const maxLimit = duration.workingHours * 2;
 
             
        //       const existingSum = localEmployees.reduce((sum, emp, idx) => {
        //         if (emp?.emple?.emplId === targetId) {
        //           if (String(idx) === String(empIdx)) return sum;
 
        //           const savedVal = getMonthHours(emp)[uniqueKey]?.value || 0;
        //           const unsavedInput = inputValues[`${idx}_${uniqueKey}`];
 
        //           const val =
        //             unsavedInput !== undefined && unsavedInput !== ""
        //               ? unsavedInput
        //               : savedVal;
 
        //           return sum + (parseFloat(val) || 0);
        //         }
        //         return sum;
        //       }, 0);
 
        //       // 2. Sum any Unsaved New Entries for the same ID
        //       const newEntrySum = newEntries.reduce((sum, entry, idx) => {
        //         if (entry.id === targetId) {
        //           const val = newEntryPeriodHoursArray[idx]?.[uniqueKey] || 0;
        //           return sum + (parseFloat(val) || 0);
        //         }
        //         return sum;
        //       }, 0);
 
        //       const total = existingSum + newEntrySum + newNumericValue;
 
        //       if (total > maxLimit) {
        //         toast.error(
        //           `Cannot save. Total hours for ID ${targetId} in ${duration.month} (${total.toFixed(2)}) exceed limit of ${maxLimit}.`,
        //           {
        //             autoClose: 5000,
        //           },
        //         );
        //         setIsLoading(false);
        //         return false; // STOP SAVING
        //       }
        //     }
        //   }
 
        //   const bulkPayload = [];
        //   for (const key in modifiedHours) {
        //     const { empIdx, uniqueKey, newValue, employee } =
        //       modifiedHours[key];
        //     const newNumericValue = newValue === "" ? 0 : Number(newValue);
        //     const emp = employee;
        //     const forecast = getMonthHours(emp)[uniqueKey];
 
        //     if (!forecast || !forecast.forecastid) continue;
 
        //     const currentDuration = sortedDurations.find(
        //       (d) => `${d.monthNo}_${d.year}` === uniqueKey,
        //     );
        //     if (!isMonthEditable(currentDuration, closedPeriod, planType))
        //       continue;
 
        //     bulkPayload.push({
        //       ...forecast,
        //       forecastid: Number(forecast.forecastid),
        //       projId: forecast.projId || projectId,
        //       plId: planId,
        //       emplId: emp.emple.emplId,
        //       ...(planType === "EAC"
        //         ? {
        //             actualhours: Number(newNumericValue),
        //             forecastedhours: forecast.forecastedhours,
        //           }
        //         : {
        //             forecastedhours: Number(newNumericValue),
        //             actualhours: forecast.actualhours,
        //           }),
        //       updatedat: new Date().toISOString(),
        //       acctId: emp.emple.accId,
        //       orgId: emp.emple.orgId,
        //       // plc: emp.emple.plcGlcCode.split("-")[0].trim(),
        //       plc: emp.emple.plcGlcCode ? emp.emple.plcGlcCode.split("-")[0].trim() : null,
        //       hrlyRate: emp.perHourRate || 0,
        //     });
        //   }
 
        //   if (bulkPayload.length > 0) {
        //     const apiType = planType === "NBBUD" ? "BUD" : planType;
        //     await axios.put(
        //       `${backendUrl}/Forecast/BulkUpdateForecastHoursV1/${apiType}?plid=${planId}&templateid=${templateId}`,
        //       bulkPayload,
        //     );
        //   }
        // }
 
        if (hasHoursChanges) {
  for (const key in modifiedHours) {
    const { empIdx, uniqueKey, newValue, employee } = modifiedHours[key];
    const targetId = employee?.emple?.emplId;
    const newNumericValue = parseFloat(newValue) || 0;
 
    // Find limit
    const duration = sortedDurations.find(
      (d) => `${d.monthNo}_${d.year}` === uniqueKey
    );
    if (duration && duration.workingHours) {
      const maxLimit = duration.workingHours * 2;
 
      const existingSum = localEmployees.reduce((sum, emp, idx) => {
        if (emp?.emple?.emplId === targetId) {
          if (String(idx) === String(empIdx)) return sum;
 
          const savedVal = getMonthHours(emp)[uniqueKey]?.value || 0;
          const unsavedInput = inputValues[`${idx}_${uniqueKey}`];
 
          const val =
            unsavedInput !== undefined && unsavedInput !== ""
              ? unsavedInput
              : savedVal;
 
          return sum + (parseFloat(val) || 0);
        }
        return sum;
      }, 0);
 
      // 2. Sum any Unsaved New Entries for the same ID
      const newEntrySum = newEntries.reduce((sum, entry, idx) => {
        if (entry.id === targetId) {
          const val = newEntryPeriodHoursArray[idx]?.[uniqueKey] || 0;
          return sum + (parseFloat(val) || 0);
        }
        return sum;
      }, 0);
 
      const total = existingSum + newEntrySum + newNumericValue;
 
      if (total > maxLimit) {
        toast.error(
          `Cannot save. Total hours for ID ${targetId} in ${
            duration.month
          } (${total.toFixed(2)}) exceed limit of ${maxLimit}.`,
          {
            autoClose: 5000,
          }
        );
        setIsLoading(false);
        return false; // STOP SAVING
      }
    }
  }
 
  const bulkPayload = [];
  for (const key in modifiedHours) {
    const { empIdx, uniqueKey, newValue, employee } = modifiedHours[key];
    const newNumericValue = newValue === "" ? 0 : Number(newValue);
    const emp = employee;
   
    // Attempt to get existing forecast data
    let forecast = getMonthHours(emp)[uniqueKey];
 
    const currentDuration = sortedDurations.find(
      (d) => `${d.monthNo}_${d.year}` === uniqueKey
    );
   
    if (!isMonthEditable(currentDuration, closedPeriod, planType)) continue;
 
   
    if (!forecast || !forecast.forecastid) {
      const [m, y] = uniqueKey.split("_").map(Number);
      forecast = {
        forecastid: 0,
        projId: projectId,
        plId: planId,
        emplId: emp.emple.emplId,
        empleId: emp.emple.id || 0,
        month: m,
        year: y,
        acctId: emp.emple.accId || "",
        orgId: emp.emple.orgId || "",
        plc: emp.emple.plcGlcCode ? emp.emple.plcGlcCode.split("-")[0].trim() : null,
        hrlyRate: emp.perHourRate || 0,
        forecastedhours: 0,
        actualhours: 0
      };
    }
 
    bulkPayload.push({
      ...forecast,
      forecastid: Number(forecast.forecastid),
      projId: forecast.projId || projectId,
      plId: planId,
      emplId: emp.emple.emplId,
      empleId: emp.emple.id || forecast.empleId || 0,
      ...(planType === "EAC"
        ? {
            actualhours: Number(newNumericValue),
            forecastedhours: forecast.forecastedhours || 0,
          }
        : {
            forecastedhours: Number(newNumericValue),
            actualhours: forecast.actualhours || 0,
          }),
      updatedat: new Date().toISOString(),
      acctId: emp.emple.accId || forecast.acctId,
      orgId: emp.emple.orgId || forecast.orgId,
      plc: emp.emple.plcGlcCode ? emp.emple.plcGlcCode.split("-")[0].trim() : forecast.plc,
      hrlyRate: emp.perHourRate || forecast.hrlyRate || 0,
    });
  }
 
  if (bulkPayload.length > 0) {
    const apiType = planType === "NBBUD" ? "BUD" : planType;
    await axios.put(
      `${backendUrl}/Forecast/BulkUpdateForecastHoursV1/${apiType}?plid=${planId}&templateid=${templateId}`,
      bulkPayload
    );
  }
}
 
        // Trigger Final Validation API
        try {
          await axios.post(
            `${backendUrl}/Forecast/ValidateForecast?planid=${planId}`,
          );
        } catch (vErr) {
          console.warn("Validation cleanup failed", vErr);
        }
 
        // Reset states
        setModifiedHours({});
        setHasUnsavedHoursChanges(false);
        setEditedEmployeeData({});
        setHasUnsavedEmployeeChanges(false);
 
        if (errorCount > 0) {
          toast.warning(`${errorCount} entries could not be saved.`);
        }
 
        return true; // Successfully saved all data
      } catch (err) {
        toast.error(
          "Failed to save changes: " +
            (err.response?.data?.message || err.message),
        );
        return false; // Error occurred
      } finally {
        setIsLoading(false);
      }
    };

    const handleMasterSave = async () => {
      
      
             const hasNewEntries = newEntries?.length > 0;
      const hasEmployeeChanges = hasUnsavedEmployeeChanges;
      const hasHoursChanges = hasUnsavedHoursChanges;
      setIsLoading(true);
      try {
        // Step 1: Save New Entries. Captures 'false' if validation fails inside.
        const newSaveSuccess = await handleSaveMultipleEntry();
        if (!newSaveSuccess) {
          setIsLoading(false);
          return; // Stops here, NO "Saved Successfully" toast will show
        }

        
        
        // Step 2: Save Existing Grid Changes
        if (hasUnsavedHoursChanges || hasUnsavedEmployeeChanges) {
          const gridSaveSuccess = await handleSaveAll();
          if (gridSaveSuccess === false) {
            setIsLoading(false);
            return;
          }
        }
        setRefreshPool(true);

        setNewEntries([]);
        setNewEntryPeriodHoursArray([]);
        setNewEntryPeriodHours({}); // Clear single entry hours
        setInputValues({}); // IMPORTANT: Clear the grid input tracking
        setModifiedHours({});
        setEditedEmployeeData({});
        setHasUnsavedHoursChanges(false);
        setHasUnsavedEmployeeChanges(false);

        // ONLY IF BOTH ABOVE PASSED:
        // setNewEntries([]);
        // setNewEntryPeriodHoursArray([]);
        // setNewEntryPeriodHours({}); // Clear single entry hours
        // setInputValues({});
        // setShowNewForm(false);
        // setModifiedHours({});
        // setEditedEmployeeData({});
        // setHasUnsavedHoursChanges(false);
        // setHasUnsavedEmployeeChanges(false);

        setShowNewForm(false);

if (hasNewEntries) {
  await fetchEmployees();
  await fetchAndSetLaborCost();
} 
else if (hasEmployeeChanges && hasHoursChanges) {
  await fetchEmployees();
  await fetchAndSetLaborCost();
}
else if (hasEmployeeChanges) {
  await fetchEmployees();
}
else if (hasHoursChanges) {
  await fetchEmployees();
  await fetchAndSetLaborCost();
}


        toast.success("All Labor changes saved and updated successfully!");
        return true;
        
      } catch (err) {
        console.error("Master Save Error", err);
        toast.error(
          "Failed to save changes: " +
            (err.response?.data?.message || err.message),
        );
      } finally {
        setIsLoading(false);
        setRefreshPool(false);
      }
    };

    // const handleAccountInputChangeForUpdate = (value, actualEmpIdx) => {
    //   handleEmployeeDataChange(actualEmpIdx, "acctId", value);

    //   // Filter accounts based on input - ensure we're using all available accounts
    //   if (value.length >= 1) {
    //     const baseAccounts =
    //       updateAccountOptions.length > 0 ? updateAccountOptions : laborAccounts;
    //     const filtered = baseAccounts.filter((acc) =>
    //       acc.id.toLowerCase().includes(value.toLowerCase())
    //     );
    //     // Don't update the state here, just use the filtered results for display
    //     // The datalist will automatically show filtered options
    //   } else {
    //     // When input is empty, ensure all accounts are available
    //     if (updateAccountOptions.length === 0 && laborAccounts.length > 0) {
    //       setUpdateAccountOptions(laborAccounts);
    //     }
    //   }
    // };

    const handleAccountInputChangeForUpdate = (value, actualEmpIdx) => {
      // 1. Update the ID in state
      handleEmployeeDataChange(actualEmpIdx, "acctId", value);

      // 2. Lookup and Update Name automatically in state
      // const matchedAccount = accountOptionsWithNames.find(acc => acc.id === value);
      const matchedAccount =
        accountOptionsWithNames.find((acc) => acc.id === value) ||
        updateAccountOptions.find((acc) => acc.id === value);
      if (matchedAccount) {
        handleEmployeeDataChange(
          actualEmpIdx,
          "acctName",
          matchedAccount.name || matchedAccount.acctName,
        );
      } else {
        handleEmployeeDataChange(actualEmpIdx, "acctName", "");
      }
    };

    // const handleFillValues = () => {
    //   if (!isEditable) return;

    //   const toKeyNum = (y, m) => y * 100 + m;
    //   const rangeStartKey = toKeyNum(
    //     new Date(fillStartDate).getFullYear(),
    //     new Date(fillStartDate).getMonth() + 1
    //   );
    //   const rangeEndKey = toKeyNum(
    //     new Date(fillEndDate).getFullYear(),
    //     new Date(fillEndDate).getMonth() + 1
    //   );

    //   let anchorMonthKey = selectedColumnKey;
    //   if (!anchorMonthKey) {
    //     const firstVis = sortedDurations.find(
    //       (d) => toKeyNum(d.year, d.monthNo) >= rangeStartKey
    //     );
    //     if (firstVis) anchorMonthKey = `${firstVis.monthNo}_${firstVis.year}`;
    //   }
    //   const [aM, aY] = anchorMonthKey
    //     ? anchorMonthKey.split("_").map(Number)
    //     : [0, 0];
    //   const anchorSortVal = toKeyNum(aY, aM);

    //   let newInputs = { ...inputValues };
    //   let newModifiedHours = { ...modifiedHours };
    //   let targetRowIdxForScroll = null;

    //   // --- PRIORITY: APPLY TO NEW ENTRIES FIRST ---
    //   if (newEntries.length > 0) {
    //     const sourceIdx =
    //       checkedRows.size > 0 ? Array.from(checkedRows)[0] : null;
    //     const sourceEmp = sourceIdx !== null ? localEmployees[sourceIdx] : null;
    //     const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

    //     setNewEntryPeriodHoursArray((prevArray) =>
    //       prevArray.map((amounts) => {
    //         const updatedAmounts = { ...amounts };
    //         const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

    //         sortedDurations.forEach((duration) => {
    //           const currentK = toKeyNum(duration.year, duration.monthNo);
    //           if (currentK < rangeStartKey || currentK > rangeEndKey) return;

    //           const key = `${duration.monthNo}_${duration.year}`;

    //           if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
    //             // Logic for "New Entry" getting data from a "Checked Row"
    //             updatedAmounts[key] =
    //               newInputs[`${sourceIdx}_${key}`] ??
    //               String(sourceMonthHours[key]?.value || "0");
    //           } else if (fillMethod === "Specify Hours") {
    //             updatedAmounts[key] = String(fillHours);
    //           } else if (fillMethod === "Use Available Hours") {
    //             updatedAmounts[key] = String(duration.workingHours || 0);
    //           } else if (fillMethod === "Use Start Period Hours") {
    //             if (currentK >= anchorSortVal)
    //               updatedAmounts[key] = valToCopyFromSelf;
    //           }
    //         });
    //         return updatedAmounts;
    //       })
    //     );
    //   }
    //   // --- SECONDARY: APPLY TO EXISTING DATA (Only if no New Entries or specifically targeted) ---
    //   else if (checkedRows.size > 0) {
    //     // Check if we are doing a specific Dropdown fill for existing rows
    //     const isDropdownCopy =
    //       fillMethod === "Copy From Checked Rows" && selectedSourceIdx !== "";
    //     const targetIndices = isDropdownCopy
    //       ? [parseInt(selectedSourceIdx)]
    //       : Array.from(checkedRows);

    //     // Only scroll/highlight for EXISTING rows
    //     targetRowIdxForScroll = targetIndices[0];

    //     targetIndices.forEach((empIdx) => {
    //       const emp = localEmployees[empIdx];
    //       if (!emp) return;
    //       const sourceIdx = Array.from(checkedRows)[0];
    //       const sourceEmp = localEmployees[sourceIdx];
    //       const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

    //       const valToCopyFromSelf =
    //         newInputs[`${empIdx}_${anchorMonthKey}`] ??
    //         String(getMonthHours(emp)[anchorMonthKey]?.value || "0");

    //       sortedDurations.forEach((d) => {
    //         const currentK = toKeyNum(d.year, d.monthNo);
    //         if (currentK < rangeStartKey || currentK > rangeEndKey) return;
    //         if (planType === "EAC" && !isMonthEditable(d, closedPeriod, planType))
    //           return;

    //         const key = `${d.monthNo}_${d.year}`;
    //         const inputKey = `${empIdx}_${key}`;
    //         let val;

    //         if (isDropdownCopy && sourceEmp) {
    //           val =
    //             newInputs[`${sourceIdx}_${key}`] ??
    //             String(sourceMonthHours[key]?.value || "0");
    //         } else if (fillMethod === "Specify Hours") {
    //           val = String(fillHours);
    //         } else if (fillMethod === "Use Available Hours") {
    //           val = String(d.workingHours || 0);
    //         } else if (fillMethod === "Use Start Period Hours") {
    //           if (currentK >= anchorSortVal) val = valToCopyFromSelf;
    //           else return;
    //         } else return;

    //         newInputs[inputKey] = val;
    //         newModifiedHours[inputKey] = {
    //           empIdx,
    //           uniqueKey: key,
    //           newValue: val,
    //           employee: emp,
    //         };
    //       });
    //     });
    //   }

    //   setInputValues(newInputs);
    //   setModifiedHours(newModifiedHours);
    //   setHasUnsavedHoursChanges(true);
    //   setShowFillValues(false);

    //   // Highlighting and Scrolling ONLY triggers for existing rows
    //   if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    //     setFindMatches([
    //       { empIdx: targetRowIdxForScroll, isFillHighlight: true },
    //     ]);
    //     setTimeout(() => {
    //       const rowElement = document.getElementById(
    //         `emp-row-${targetRowIdxForScroll}`
    //       );
    //       if (rowElement)
    //         rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    //     }, 100);
    //     setTimeout(() => {
    //       setFindMatches([]);
    //     }, 4000);
    //   }

    //   setSelectedSourceIdx("");
    //   toast.success("Values applied successfully");
    // };

    //   const handleFillValues = () => {
    //     if (!isEditable) return;

    //     const toKeyNum = (y, m) => y * 100 + m;
    //     const rangeStartKey = toKeyNum(
    //       new Date(fillStartDate).getFullYear(),
    //       new Date(fillStartDate).getMonth() + 1
    //     );
    //     const rangeEndKey = toKeyNum(
    //       new Date(fillEndDate).getFullYear(),
    //       new Date(fillEndDate).getMonth() + 1
    //     );

    //     // FIX: Ensure anchorMonthKey specifically targets the column you clicked
    //     let anchorMonthKey = selectedColumnKey;
    //     if (!anchorMonthKey) {
    //       const firstVis = sortedDurations.find(
    //         (d) => toKeyNum(d.year, d.monthNo) >= rangeStartKey
    //       );
    //       if (firstVis) anchorMonthKey = `${firstVis.monthNo}_${firstVis.year}`;
    //     }

    //     const [aM, aY] = anchorMonthKey
    //       ? anchorMonthKey.split("_").map(Number)
    //       : [0, 0];
    //     const anchorSortVal = toKeyNum(aY, aM);

    //     let newInputs = { ...inputValues };
    //     let newModifiedHours = { ...modifiedHours };
    //     let targetRowIdxForScroll = null;

    //     // --- PRIORITY: APPLY TO NEW ENTRIES FIRST ---
    //     if (newEntries.length > 0) {
    //       const sourceIdx =
    //         checkedRows.size > 0 ? Array.from(checkedRows)[0] : null;
    //       const sourceEmp = sourceIdx !== null ? localEmployees[sourceIdx] : null;
    //       const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

    //       setNewEntryPeriodHoursArray((prevArray) =>
    //         prevArray.map((amounts) => {
    //           const updatedAmounts = { ...amounts };
    //           // Get the value from the specific column clicked in the "New Entry" row
    //           const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

    //           sortedDurations.forEach((duration) => {
    //             const currentK = toKeyNum(duration.year, duration.monthNo);
    //             if (currentK < rangeStartKey || currentK > rangeEndKey) return;

    //             const key = `${duration.monthNo}_${duration.year}`;

    //             if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
    //               updatedAmounts[key] =
    //                 newInputs[`${sourceIdx}_${key}`] ??
    //                 String(sourceMonthHours[key]?.value || "0");
    //             } else if (fillMethod === "Specify Hours") {
    //               updatedAmounts[key] = String(fillHours);
    //             } else if (fillMethod === "Use Available Hours") {
    //               updatedAmounts[key] = String(duration.workingHours || 0);
    //             } else if (fillMethod === "Use Start Period Hours") {
    //               // Fill if current month is the anchor column or after it
    //               if (currentK >= anchorSortVal)
    //                 updatedAmounts[key] = valToCopyFromSelf;
    //             }
    //           });
    //           return updatedAmounts;
    //         })
    //       );
    //     }
    //     // --- SECONDARY: APPLY TO EXISTING DATA ---
    //     else if (checkedRows.size > 0) {
    //       const isDropdownCopy =
    //         fillMethod === "Copy From Checked Rows" && selectedSourceIdx !== "";

    //       const targetIndices = isDropdownCopy
    //         ? [parseInt(selectedSourceIdx)]
    //         : Array.from(checkedRows);

    //       targetRowIdxForScroll = targetIndices[0];

    //       targetIndices.forEach((empIdx) => {
    //         const emp = localEmployees[empIdx];
    //         if (!emp) return;
    //         const sourceIdx = Array.from(checkedRows)[0];
    //         const sourceEmp = localEmployees[sourceIdx];
    //         const sourceMonthHoursForSource = sourceEmp
    //           ? getMonthHours(sourceEmp)
    //           : {};
    //         const sourceMonthHoursForSelf = getMonthHours(emp);

    //         // Get value from the specific column clicked in the existing row
    //         const valToCopyFromSelf =
    //           newInputs[`${empIdx}_${anchorMonthKey}`] ??
    //           String(sourceMonthHoursForSelf[anchorMonthKey]?.value || "0");

    //         sortedDurations.forEach((d) => {
    //           const currentK = toKeyNum(d.year, d.monthNo);
    //           if (currentK < rangeStartKey || currentK > rangeEndKey) return;
    //           if (planType === "EAC" && !isMonthEditable(d, closedPeriod, planType))
    //             return;

    //           const key = `${d.monthNo}_${d.year}`;
    //           const inputKey = `${empIdx}_${key}`;
    //           let val;

    //           if (isDropdownCopy && sourceEmp) {
    //             val =
    //               newInputs[`${sourceIdx}_${key}`] ??
    //               String(sourceMonthHoursForSource[key]?.value || "0");
    //           } else if (fillMethod === "Specify Hours") {
    //             val = String(fillHours);
    //           } else if (fillMethod === "Use Available Hours") {
    //             val = String(d.workingHours || 0);
    //           } else if (fillMethod === "Use Start Period Hours") {
    //             // Fill if current month is the anchor column or after it
    //             if (currentK >= anchorSortVal) val = valToCopyFromSelf;
    //             else return;
    //           } else return;

    //           newInputs[inputKey] = val;
    //           newModifiedHours[inputKey] = {
    //             empIdx,
    //             uniqueKey: key,
    //             newValue: val,
    //             employee: emp,
    //           };
    //         });
    //       });
    //     }

    //     setInputValues(newInputs);
    //     setModifiedHours(newModifiedHours);
    //     setHasUnsavedHoursChanges(true);
    //     setShowFillValues(false);

    //     if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    //       setFindMatches([
    //         { empIdx: targetRowIdxForScroll, isFillHighlight: true },
    //       ]);
    //       setTimeout(() => {
    //         const rowElement = document.getElementById(
    //           `emp-row-${targetRowIdxForScroll}`
    //         );
    //         if (rowElement)
    //           rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    //       }, 100);
    //       setTimeout(() => {
    //         setFindMatches([]);
    //       }, 4000);
    //     }

    //     setSelectedSourceIdx("");
    //     toast.success("Values applied successfully");
    //   };


    const handleFillValues = () => {
  if (!isEditable) return;

  if (!fillStartDate || !fillEndDate) {
    toast.error("Start Period and End Period are required.");
    return;
  }

  if (fillEndDate < fillStartDate) {
    toast.error("End Period cannot be before Start Period.", {
      autoClose: 3000,
    });
    return;
  }

  const toKeyNum = (y, m) => y * 100 + m;
  const [sYear, sMonth] = fillStartDate.split("-").map(Number);
  const rangeStartKey = toKeyNum(sYear, sMonth);

  const [eYear, eMonth] = fillEndDate.split("-").map(Number);
  const rangeEndKey = toKeyNum(eYear, eMonth);

  let anchorMonthKey = selectedColumnKey;
  if (!anchorMonthKey) {
    const firstVis = sortedDurations.find(
      (d) => toKeyNum(d.year, d.monthNo) >= rangeStartKey,
    );
    if (firstVis) anchorMonthKey = `${firstVis.monthNo}_${firstVis.year}`;
  }

  const [aM, aY] = anchorMonthKey ? anchorMonthKey.split("_").map(Number) : [0, 0];
  const anchorSortVal = toKeyNum(aY, aM);

  let newInputs = { ...inputValues };
  let newModifiedHours = { ...modifiedHours };
  let targetRowIdxForScroll = null;

  // Identify Source (Dropdown has priority)
  const isDropdownCopy = fillMethod === "Copy From Checked Rows" && selectedSourceIdx !== "";
  const sourceIdx = isDropdownCopy ? parseInt(selectedSourceIdx) : (checkedRows.size > 0 ? Array.from(checkedRows)[0] : null);
  const sourceEmp = sourceIdx !== null ? localEmployees[sourceIdx] : null;
  const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

  // --- 1. APPLY TO NEW ENTRIES ---
  if (newEntries.length > 0) {
    setNewEntryPeriodHoursArray((prevArray) =>
      prevArray.map((amounts) => {
        const updatedAmounts = { ...amounts };
        const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

        sortedDurations.forEach((duration) => {
          const currentK = toKeyNum(duration.year, duration.monthNo);
          if (currentK < rangeStartKey || currentK > rangeEndKey) return;
          const key = `${duration.monthNo}_${duration.year}`;

          if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
            updatedAmounts[key] = newInputs[`${sourceIdx}_${key}`] ?? String(sourceMonthHours[key]?.value || "0");
          } else if (fillMethod === "Specify Hours") {
            updatedAmounts[key] = String(fillHours);
          } else if (fillMethod === "Use Available Hours") {
            updatedAmounts[key] = String(duration.workingHours || 0);
          } else if (fillMethod === "Use Start Period Hours") {
            if (currentK >= anchorSortVal) updatedAmounts[key] = valToCopyFromSelf;
          }
        });
        return updatedAmounts;
      })
    );
  }

  // --- 2. APPLY TO EXISTING DATA (CHECKED ROWS) ---
  if (checkedRows.size > 0) {
    const targetIndices = Array.from(checkedRows);
    targetRowIdxForScroll = targetIndices[0];

    targetIndices.forEach((empIdx) => {
      const emp = localEmployees[empIdx];
      if (!emp) return;
      const sourceMonthHoursForSelf = getMonthHours(emp);
      const valToCopyFromSelf = newInputs[`${empIdx}_${anchorMonthKey}`] ?? String(sourceMonthHoursForSelf[anchorMonthKey]?.value || "0");

      sortedDurations.forEach((d) => {
        const currentK = toKeyNum(d.year, d.monthNo);
        if (currentK < rangeStartKey || currentK > rangeEndKey) return;
        if (planType === "EAC" && !isMonthEditable(d, closedPeriod, planType)) return;

        const key = `${d.monthNo}_${d.year}`;
        const inputKey = `${empIdx}_${key}`;
        let val;

        if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
          val = newInputs[`${sourceIdx}_${key}`] ?? String(sourceMonthHours[key]?.value || "0");
        } else if (fillMethod === "Specify Hours") {
          val = String(fillHours);
        } else if (fillMethod === "Use Available Hours") {
          val = String(d.workingHours || 0);
        } else if (fillMethod === "Use Start Period Hours") {
          if (currentK >= anchorSortVal) val = valToCopyFromSelf;
          else return;
        } else return;

        newInputs[inputKey] = val;
        newModifiedHours[inputKey] = { empIdx, uniqueKey: key, newValue: val, employee: emp };
      });
    });
  }

  setInputValues(newInputs);
  setModifiedHours(newModifiedHours);
  setHasUnsavedHoursChanges(true);
  
  // Use a reset close function
  setShowFillValues(false); // Closes the modal
  setModalPos({ x: 0, y: 0 }); // Resets position for next time
  setSelectedSourceIdx(""); // Clears the dropdown selection
  
  // toast.success("Values applied successfully");

  if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    setFindMatches([{ empIdx: targetRowIdxForScroll, isFillHighlight: true }]);
    setTimeout(() => {
      const rowElement = document.getElementById(`emp-row-${targetRowIdxForScroll}`);
      if (rowElement) rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    setTimeout(() => setFindMatches([]), 4000);
  }
  toast.success("Values applied successfully");
};

//     const handleFillValues = () => {
//   if (!isEditable) return;

//   if (!fillStartDate || !fillEndDate) {
//     toast.error("Start Period and End Period are required.");
//     return;
//   }

//   if (fillEndDate < fillStartDate) {
//     toast.error("End Period cannot be before Start Period.", {
//       autoClose: 3000,
//     });
//     return;
//   }

//   const toKeyNum = (y, m) => y * 100 + m;
//   const [sYear, sMonth] = fillStartDate.split("-").map(Number);
//   const rangeStartKey = toKeyNum(sYear, sMonth);

//   const [eYear, eMonth] = fillEndDate.split("-").map(Number);
//   const rangeEndKey = toKeyNum(eYear, eMonth);

//   // FIX: Ensure anchorMonthKey specifically targets the column you clicked
//   let anchorMonthKey = selectedColumnKey;
//   if (!anchorMonthKey) {
//     const firstVis = sortedDurations.find(
//       (d) => toKeyNum(d.year, d.monthNo) >= rangeStartKey,
//     );
//     if (firstVis) anchorMonthKey = `${firstVis.monthNo}_${firstVis.year}`;
//   }

//   const [aM, aY] = anchorMonthKey
//     ? anchorMonthKey.split("_").map(Number)
//     : [0, 0];
//   const anchorSortVal = toKeyNum(aY, aM);

//   let newInputs = { ...inputValues };
//   let newModifiedHours = { ...modifiedHours };
//   let targetRowIdxForScroll = null;

//   // --- PRIORITY: APPLY TO NEW ENTRIES FIRST ---
//   // if (newEntries.length > 0) {
//   //   const sourceIdx =
//   //     checkedRows.size > 0 ? Array.from(checkedRows)[0] : null;
//   //   const sourceEmp = sourceIdx !== null ? localEmployees[sourceIdx] : null;
//   //   const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

//   //   setNewEntryPeriodHoursArray((prevArray) =>
//   //     prevArray.map((amounts) => {
//   //       const updatedAmounts = { ...amounts };
//   //       const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

//   //       sortedDurations.forEach((duration) => {
//   //         const currentK = toKeyNum(duration.year, duration.monthNo);
//   //         if (currentK < rangeStartKey || currentK > rangeEndKey) return;

//   //         const key = `${duration.monthNo}_${duration.year}`;

//   //         if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
//   //           updatedAmounts[key] =
//   //             newInputs[`${sourceIdx}_${key}`] ??
//   //             String(sourceMonthHours[key]?.value || "0");
//   //         } else if (fillMethod === "Specify Hours") {
//   //           updatedAmounts[key] = String(fillHours);
//   //         } else if (fillMethod === "Use Available Hours") {
//   //           updatedAmounts[key] = String(duration.workingHours || 0);
//   //         } else if (fillMethod === "Use Start Period Hours") {
//   //           if (currentK >= anchorSortVal)
//   //             updatedAmounts[key] = valToCopyFromSelf;
//   //         }
//   //       });
//   //       return updatedAmounts;
//   //     }),
//   //   );
//   // }
//   // --- PRIORITY: APPLY TO NEW ENTRIES FIRST ---
// if (newEntries.length > 0) {
//   // Check if a source is selected in the dropdown OR fallback to checkedRows
//   const isDropdownCopy = fillMethod === "Copy From Checked Rows" && selectedSourceIdx !== "";
  
//   const sourceIdx = isDropdownCopy 
//     ? parseInt(selectedSourceIdx) 
//     : (checkedRows.size > 0 ? Array.from(checkedRows)[0] : null);

//   const sourceEmp = sourceIdx !== null ? localEmployees[sourceIdx] : null;
//   const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

//   setNewEntryPeriodHoursArray((prevArray) =>
//     prevArray.map((amounts) => {
//       const updatedAmounts = { ...amounts };
//       // Get the value from the specific column clicked in the "New Entry" row
//       const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

//       sortedDurations.forEach((duration) => {
//         const currentK = toKeyNum(duration.year, duration.monthNo);
//         if (currentK < rangeStartKey || currentK > rangeEndKey) return;

//         const key = `${duration.monthNo}_${duration.year}`;

//         if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
//           // Now pulls from the sourceIdx (either Dropdown or Checked Row)
//           updatedAmounts[key] =
//             newInputs[`${sourceIdx}_${key}`] ??
//             String(sourceMonthHours[key]?.value || "0");
//         } else if (fillMethod === "Specify Hours") {
//           updatedAmounts[key] = String(fillHours);
//         } else if (fillMethod === "Use Available Hours") {
//           updatedAmounts[key] = String(duration.workingHours || 0);
//         } else if (fillMethod === "Use Start Period Hours") {
//           // Fill if current month is the anchor column or after it
//           if (currentK >= anchorSortVal)
//             updatedAmounts[key] = valToCopyFromSelf;
//         }
//       });
//       return updatedAmounts;
//     }),
//   );
// }
//   // --- SECONDARY: APPLY TO EXISTING DATA ---
//   else if (checkedRows.size > 0) {
//     const isDropdownCopy =
//       fillMethod === "Copy From Checked Rows" && selectedSourceIdx !== "";

//     // FLIPPED LOGIC: 
//     // If using dropdown, the Dropdown is the SOURCE, and Checked Rows are the TARGETS.
//     // If not using dropdown, we fallback to the original behavior.
//     const targetIndices = isDropdownCopy
//       ? Array.from(checkedRows) // Multiple targets (Checked Rows)
//       : Array.from(checkedRows); 

//     const sourceIdx = isDropdownCopy 
//       ? parseInt(selectedSourceIdx) // Source is from Dropdown
//       : Array.from(checkedRows)[0]; // Source is first checked row

//     targetRowIdxForScroll = targetIndices[0];

//     targetIndices.forEach((empIdx) => {
//       const emp = localEmployees[empIdx];
//       if (!emp) return;
      
//       const sourceEmp = localEmployees[sourceIdx];
//       const sourceMonthHoursForSource = sourceEmp
//         ? getMonthHours(sourceEmp)
//         : {};
//       const sourceMonthHoursForSelf = getMonthHours(emp);

//       // Get value from the specific column clicked in the existing row
//       const valToCopyFromSelf =
//         newInputs[`${empIdx}_${anchorMonthKey}`] ??
//         String(sourceMonthHoursForSelf[anchorMonthKey]?.value || "0");

//       sortedDurations.forEach((d) => {
//         const currentK = toKeyNum(d.year, d.monthNo);
//         if (currentK < rangeStartKey || currentK > rangeEndKey) return;
//         if (
//           planType === "EAC" &&
//           !isMonthEditable(d, closedPeriod, planType)
//         )
//           return;

//         const key = `${d.monthNo}_${d.year}`;
//         const inputKey = `${empIdx}_${key}`;
//         let val;

//         if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
//           val =
//             newInputs[`${sourceIdx}_${key}`] ??
//             String(sourceMonthHoursForSource[key]?.value || "0");
//         } else if (fillMethod === "Specify Hours") {
//           val = String(fillHours);
//         } else if (fillMethod === "Use Available Hours") {
//           val = String(d.workingHours || 0);
//         } else if (fillMethod === "Use Start Period Hours") {
//           if (currentK >= anchorSortVal) val = valToCopyFromSelf;
//           else return;
//         } else return;

//         newInputs[inputKey] = val;
//         newModifiedHours[inputKey] = {
//           empIdx,
//           uniqueKey: key,
//           newValue: val,
//           employee: emp,
//         };
//       });
//     });
//   }

//   setInputValues(newInputs);
//   setModifiedHours(newModifiedHours);
//   setHasUnsavedHoursChanges(true);
//   setShowFillValues(false);

//   if (targetRowIdxForScroll !== null && newEntries.length === 0) {
//     setFindMatches([
//       { empIdx: targetRowIdxForScroll, isFillHighlight: true },
//     ]);
//     setTimeout(() => {
//       const rowElement = document.getElementById(
//         `emp-row-${targetRowIdxForScroll}`,
//       );
//       if (rowElement)
//         rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
//     }, 100);
//     setTimeout(() => {
//       setFindMatches([]);
//     }, 4000);
//   }

//   setSelectedSourceIdx("");
//   toast.success("Values applied successfully");
// };

    // const handleFillValues = () => {
    //   if (!isEditable) return;

    //   if (!fillStartDate || !fillEndDate) {
    //     toast.error("Start Period and End Period are required.");
    //     return;
    //   }

    //   if (fillEndDate < fillStartDate) {
    //     toast.error("End Period cannot be before Start Period.", {
    //       autoClose: 3000,
    //     });
    //     return;
    //   }

    //   const toKeyNum = (y, m) => y * 100 + m;
    //   // const rangeStartKey = toKeyNum(
    //   //   new Date(fillStartDate).getFullYear(),
    //   //   new Date(fillStartDate).getMonth() + 1
    //   // );
    //   // const rangeEndKey = toKeyNum(
    //   //   new Date(fillEndDate).getFullYear(),
    //   //   new Date(fillEndDate).getMonth() + 1
    //   // );
    //   const [sYear, sMonth] = fillStartDate.split("-").map(Number);
    //   const rangeStartKey = toKeyNum(sYear, sMonth);

    //   const [eYear, eMonth] = fillEndDate.split("-").map(Number);
    //   const rangeEndKey = toKeyNum(eYear, eMonth);

    //   // FIX: Ensure anchorMonthKey specifically targets the column you clicked
    //   let anchorMonthKey = selectedColumnKey;
    //   if (!anchorMonthKey) {
    //     const firstVis = sortedDurations.find(
    //       (d) => toKeyNum(d.year, d.monthNo) >= rangeStartKey,
    //     );
    //     if (firstVis) anchorMonthKey = `${firstVis.monthNo}_${firstVis.year}`;
    //   }

    //   const [aM, aY] = anchorMonthKey
    //     ? anchorMonthKey.split("_").map(Number)
    //     : [0, 0];
    //   const anchorSortVal = toKeyNum(aY, aM);

    //   let newInputs = { ...inputValues };
    //   let newModifiedHours = { ...modifiedHours };
    //   let targetRowIdxForScroll = null;

    //   // --- PRIORITY: APPLY TO NEW ENTRIES FIRST ---
    //   if (newEntries.length > 0) {
    //     const sourceIdx =
    //       checkedRows.size > 0 ? Array.from(checkedRows)[0] : null;
    //     const sourceEmp = sourceIdx !== null ? localEmployees[sourceIdx] : null;
    //     const sourceMonthHours = sourceEmp ? getMonthHours(sourceEmp) : {};

    //     setNewEntryPeriodHoursArray((prevArray) =>
    //       prevArray.map((amounts) => {
    //         const updatedAmounts = { ...amounts };
    //         // Get the value from the specific column clicked in the "New Entry" row
    //         const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

    //         sortedDurations.forEach((duration) => {
    //           const currentK = toKeyNum(duration.year, duration.monthNo);
    //           if (currentK < rangeStartKey || currentK > rangeEndKey) return;

    //           const key = `${duration.monthNo}_${duration.year}`;

    //           if (fillMethod === "Copy From Checked Rows" && sourceEmp) {
    //             updatedAmounts[key] =
    //               newInputs[`${sourceIdx}_${key}`] ??
    //               String(sourceMonthHours[key]?.value || "0");
    //           } else if (fillMethod === "Specify Hours") {
    //             updatedAmounts[key] = String(fillHours);
    //           } else if (fillMethod === "Use Available Hours") {
    //             updatedAmounts[key] = String(duration.workingHours || 0);
    //           } else if (fillMethod === "Use Start Period Hours") {
    //             // Fill if current month is the anchor column or after it
    //             if (currentK >= anchorSortVal)
    //               updatedAmounts[key] = valToCopyFromSelf;
    //           }
    //         });
    //         return updatedAmounts;
    //       }),
    //     );
    //   }
    //   // --- SECONDARY: APPLY TO EXISTING DATA ---
    //   else if (checkedRows.size > 0) {
    //     const isDropdownCopy =
    //       fillMethod === "Copy From Checked Rows" && selectedSourceIdx !== "";

    //     const targetIndices = isDropdownCopy
    //       ? [parseInt(selectedSourceIdx)]
    //       : Array.from(checkedRows);

    //     targetRowIdxForScroll = targetIndices[0];

    //     targetIndices.forEach((empIdx) => {
    //       const emp = localEmployees[empIdx];
    //       if (!emp) return;
    //       const sourceIdx = Array.from(checkedRows)[0];
    //       const sourceEmp = localEmployees[sourceIdx];
    //       const sourceMonthHoursForSource = sourceEmp
    //         ? getMonthHours(sourceEmp)
    //         : {};
    //       const sourceMonthHoursForSelf = getMonthHours(emp);

    //       // Get value from the specific column clicked in the existing row
    //       const valToCopyFromSelf =
    //         newInputs[`${empIdx}_${anchorMonthKey}`] ??
    //         String(sourceMonthHoursForSelf[anchorMonthKey]?.value || "0");

    //       sortedDurations.forEach((d) => {
    //         const currentK = toKeyNum(d.year, d.monthNo);
    //         if (currentK < rangeStartKey || currentK > rangeEndKey) return;
    //         if (
    //           planType === "EAC" &&
    //           !isMonthEditable(d, closedPeriod, planType)
    //         )
    //           return;

    //         const key = `${d.monthNo}_${d.year}`;
    //         const inputKey = `${empIdx}_${key}`;
    //         let val;

    //         if (isDropdownCopy && sourceEmp) {
    //           val =
    //             newInputs[`${sourceIdx}_${key}`] ??
    //             String(sourceMonthHoursForSource[key]?.value || "0");
    //         } else if (fillMethod === "Specify Hours") {
    //           val = String(fillHours);
    //         } else if (fillMethod === "Use Available Hours") {
    //           val = String(d.workingHours || 0);
    //         } else if (fillMethod === "Use Start Period Hours") {
    //           // Fill if current month is the anchor column or after it
    //           if (currentK >= anchorSortVal) val = valToCopyFromSelf;
    //           else return;
    //         } else return;

    //         newInputs[inputKey] = val;
    //         newModifiedHours[inputKey] = {
    //           empIdx,
    //           uniqueKey: key,
    //           newValue: val,
    //           employee: emp,
    //         };
    //       });
    //     });
    //   }

    //   setInputValues(newInputs);
    //   setModifiedHours(newModifiedHours);
    //   setHasUnsavedHoursChanges(true);
    //   setShowFillValues(false);

    //   if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    //     setFindMatches([
    //       { empIdx: targetRowIdxForScroll, isFillHighlight: true },
    //     ]);
    //     setTimeout(() => {
    //       const rowElement = document.getElementById(
    //         `emp-row-${targetRowIdxForScroll}`,
    //       );
    //       if (rowElement)
    //         rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    //     }, 100);
    //     setTimeout(() => {
    //       setFindMatches([]);
    //     }, 4000);
    //   }

    //   setSelectedSourceIdx("");
    //   toast.success("Values applied successfully");
    // };

    const handleSaveNewEntry = async () => {
      if (!planId) {
        toast.error("Plan ID is required to save a new entry.", {
          autoClose: 3000,
        });
        return;
      }

      // Skip all validations if planType is NBBUD
      if (planType !== "NBBUD") {
        // Check for duplicate employee ID before validating anything else
        const isDuplicate = localEmployees.some((emp) => {
          if (!emp.emple) return false;

          // For "Other" type, only check emplId (like KBD001)
          if (newEntry.idType === "Other") {
            return emp.emple.emplId === newEntry.id.trim();
          }

          // For other types, check both emplId and plcGlcCode
          return (
            emp.emple.emplId === newEntry.id.trim() &&
            emp.emple.plcGlcCode === newEntry.plcGlcCode.trim()
          );
        });

        if (isDuplicate) {
          toast.error(
            "Can't save entry with existing ID and PLC combination. Please use a different ID or PLC.",
            {
              toastId: "duplicate-save-error",
              autoClose: 3000,
            },
          );
          return;
        }

        // UPDATED VALIDATION LOGIC - Apply to ALL ID types except "Other"
        if (newEntry.idType === "PLC") {
          if (!newEntry.id || newEntry.id !== "PLC") {
            toast.error("ID must be automatically set to 'PLC' for PLC type.", {
              autoClose: 3000,
            });
            return;
          }
        } else if (newEntry.idType === "Other") {
          // For Other type, just check that it's not empty (no further validation)
          if (!newEntry.id.trim()) {
            toast.error("ID is required.", { autoClose: 3000 });
            return;
          }
        } else {
          // For ALL other ID types (Employee, Vendor), validate against suggestions
          if (!newEntry.id.trim()) {
            toast.error("ID is required.", { autoClose: 3000 });
            return;
          }

          // MANDATORY validation against suggestions for Employee and Vendor types
          if (employeeSuggestions.length > 0) {
            const validEmployee = employeeSuggestions.find(
              (emp) => emp.emplId === newEntry.id.trim(),
            );
            if (!validEmployee) {
              toast.error("Please enter a valid ID from the available list.", {
                autoClose: 3000,
              });
              return;
            }
          } else {
            // If no suggestions are loaded, don't allow saving for Employee/Vendor
            toast.error("Employee suggestions not loaded. Please try again.", {
              autoClose: 3000,
            });
            return;
          }
        }

        if (!isValidAccount(newEntry.acctId)) {
          toast.error("Please enter a valid Account from the available list.", {
            autoClose: 3000,
          });
          return;
        }
        if (!isValidOrg(newEntry.orgId)) {
          toast.error("Organization is required.", { autoClose: 3000 });
          return;
        }

        if (!newEntry.plcGlcCode || !newEntry.plcGlcCode.trim()) {
          toast.error("PLC is required and cannot be empty.", {
            autoClose: 3000,
          });
          return;
        }
        // Enhanced PLC validation - must match exactly from suggestions
        if (newEntry.plcGlcCode && newEntry.plcGlcCode.trim() !== "") {
          const exactPlcMatch = plcOptions.find(
            (option) =>
              option.value.toLowerCase() ===
              newEntry.plcGlcCode.toLowerCase().trim(),
          );

          if (!exactPlcMatch) {
            toast.error(
              "PLC must be selected from the available suggestions. Custom values are not allowed.",
              {
                autoClose: 4000,
              },
            );
            return;
          }
        }
      }

      const targetId = newEntry.id.trim();

      // Loop through every month in the plan
      for (const duration of durations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;

        // Get the hours entered in the "New Entry" form for this month
        const val = newEntryPeriodHours[uniqueKey];
        const currentNewHours = parseFloat(val) || 0;

        // Only calculate if there are working hours defined for this month
        if (duration.workingHours) {
          const maxLimit = duration.workingHours * 2;

          // 1. Calculate sum of hours from EXISTING rows for this same Employee ID
          const existingSum = localEmployees.reduce((sum, emp) => {
            if (emp?.emple?.emplId === targetId) {
              // Re-use existing helper to get forecast value
              const monthHoursMap = getMonthHours(emp);
              const v = monthHoursMap[uniqueKey]?.value || 0;
              return sum + (parseFloat(v) || 0);
            }
            return sum;
          }, 0);

          // 2. Calculate Grand Total
          const total = existingSum + currentNewHours;

          // 3. Check Limit
          if (total > maxLimit) {
            toast.error(
              `Cannot save. Total hours for ID ${targetId} in ${duration.month} (${total.toFixed(2)}) exceed limit of ${maxLimit}.`,
              { autoClose: 5000 },
            );
            return; // STOP SAVE IMMEDIATELY
          }
        }
      }

      setIsDurationLoading(true);
      const payloadForecasts = durations.map((duration) => ({
        ...(planType === "EAC"
          ? {
              actualhours:
                Number(
                  newEntryPeriodHours[`${duration.monthNo}_${duration.year}`],
                ) || 0,
            }
          : {
              forecastedhours:
                Number(
                  newEntryPeriodHours[`${duration.monthNo}_${duration.year}`],
                ) || 0,
            }),
        projId: projectId,
        plId: planId,
        emplId: newEntry.id,
        month: duration.monthNo,
        year: duration.year,
        acctId: newEntry.acctId,
        orgId: newEntry.orgId,
        plc: newEntry.plcGlcCode || "",
        hrlyRate: Number(newEntry.perHourRate) || 0,
        effectDt: null,
        plEmployee: null,
      }));

      const payload = {
        id: 0,
        emplId: newEntry.id,
        firstName: newEntry.firstName,
        lastName: newEntry.lastName,
        type: newEntry.idType,
        isRev: newEntry.isRev,
        isBrd: newEntry.isBrd,
        plcGlcCode: (newEntry.plcGlcCode || "").substring(0, 20),
        perHourRate: Number(newEntry.perHourRate) || 0,
        status: newEntry.status || "-",
        accId: newEntry.acctId,
        orgId: newEntry.orgId || "",
        plId: planId,
        plForecasts: payloadForecasts,
        effectiveDate: getMonthEndDate(newEntry.effectiveDate) || getMonthEndDate(emp.emple.effectiveDate) || defaultEffectiveDate ||"",
        esc_Percent: newEntry.esc_Percent || emp.emple.esc_Percent || escalationPercent || "",
      };

      try {
        // REPLACED: Call AddNewEmployees bulk API with array payload and dynamic params
        await axios.post(
          `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
          [payload],
        );

        setSuccessMessageText("Entry saved successfully!");
        setShowSuccessMessage(true);
        setShowNewForm(false);
        setNewEntry({
          id: "",
          firstName: "",
          lastName: "",
          isRev: false,
          isBrd: false,
          idType: "",
          acctId: "",
          orgId: "",
          plcGlcCode: "",
          perHourRate: "",
          status: "Act",
        });
        setNewEntryPeriodHours({});
        setEmployeeSuggestions([]);
        setLaborAccounts([]);
        setPlcOptions([]);
        setPlcSearch("");
        setAutoPopulatedPLC(false);
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        fetchEmployees();
      } catch (err) {
        setSuccessMessageText("Failed to save entry.");
        setShowSuccessMessage(true);

        // Enhanced error message extraction
        let detailedErrorMessage = "Failed to save new entry. ";

        if (err?.response?.data) {
          const errorData = err.response.data;
          // Handle validation errors specifically
          if (errorData.errors) {
            const fieldErrors = [];
            Object.keys(errorData.errors).forEach((field) => {
              const errors = errorData.errors[field];
              if (Array.isArray(errors) && errors.length > 0) {
                fieldErrors.push(`${field}: ${errors[0]}`);
              }
            });
            if (fieldErrors.length > 0) {
              detailedErrorMessage += `Validation errors - ${fieldErrors.join(
                ", ",
              )}`;
            }
          } else if (errorData.error) {
            detailedErrorMessage += `Reason: ${errorData.error}`;
          } else if (errorData.message) {
            detailedErrorMessage += `Reason: ${errorData.message}`;
          } else if (typeof errorData === "string") {
            detailedErrorMessage += `Reason: ${errorData}`;
          } else {
            // Check for specific field validation messages
            const errorMessages = [];
            if (errorData.ID) errorMessages.push(`ID: ${errorData.ID}`);
            if (errorData.Account)
              errorMessages.push(`Account: ${errorData.Account}`);
            if (errorData.Organization)
              errorMessages.push(`Organization: ${errorData.Organization}`);
            if (errorData.PLC) errorMessages.push(`PLC: ${errorData.PLC}`);

            if (errorMessages.length > 0) {
              detailedErrorMessage += `Please check - ${errorMessages.join(
                ", ",
              )}`;
            } else {
              detailedErrorMessage += `Server response: ${JSON.stringify(
                errorData,
              )}`;
            }
          }
        } else if (err?.message) {
          detailedErrorMessage += `Reason: ${err.message}`;
        } else {
          detailedErrorMessage +=
            "Unknown error occurred. Please check your input and try again.";
        }

        // Show detailed error in toast
        toast.error(detailedErrorMessage, {
          toastId: "save-entry-error",
          autoClose: 7000, // Longer time for detailed messages
        });

        // Log for debugging
        console.error("Save new entry error:", {
          error: err,
          response: err?.response?.data,
          status: err?.response?.status,
        });
      } finally {
        setIsDurationLoading(false);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      }
    };

    // const handleSaveMultipleEntry = async () => {
    //   if (newEntries.length === 0) {
    //     toast.info("No entries to save.", { autoClose: 2000 });
    //     return;
    //   }

    //   setIsDurationLoading(true);
    //   let failCount = 0;
    //   const failedIndices = [];

    //   try {
    //     const bulkPayload = [];

    //     for (let i = 0; i < newEntries.length; i++) {
    //       const entry = newEntries[i];
    //       const periodHours = newEntryPeriodHoursArray[i];

    //       // Keep existing validation logic
    //       if (planType !== "NBBUD") {
    //         const isDuplicate = localEmployees.some((emp) => {
    //           if (!emp.emple) return false;
    //           if (entry.idType === "Other") {
    //             return emp.emple.emplId === entry.id.trim();
    //           }
    //           return (
    //             emp.emple.emplId === entry.id.trim() &&
    //             emp.emple.plcGlcCode === entry.plcGlcCode.trim()
    //           );
    //         });

    //         if (isDuplicate) {
    //           toast.error(
    //             "Can't save entry with existing ID and PLC combination. Please use a different ID or PLC.",
    //             { toastId: "duplicate-save-error", autoClose: 3000 }
    //           );
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         if (entry.idType === "PLC") {
    //           if (!entry.id || entry.id !== "PLC") {
    //             toast.error("ID must be automatically set to 'PLC' for PLC type.", { autoClose: 3000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         } else if (entry.idType === "Other") {
    //           if (!entry.id.trim()) {
    //             toast.error("ID is required.", { autoClose: 3000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         } else {
    //           if (!entry.id.trim()) {
    //             toast.error("ID is required.", { autoClose: 3000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //           const suggestions = pastedEntrySuggestions[i] || [];
    //           if (suggestions.length > 0) {
    //             const validEmployee = suggestions.find((emp) => emp.emplId === entry.id.trim());
    //             if (!validEmployee) {
    //               toast.error("Please enter a valid ID from the available list.", { autoClose: 3000 });
    //               failCount++;
    //               failedIndices.push(i);
    //               continue;
    //             }
    //           } else {
    //             toast.error("Employee suggestions not loaded. Please try again.", { autoClose: 3000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         }

    //         const entryAccounts = pastedEntryAccounts[i] || [];
    //         const isValidAcc = entryAccounts.some((acc) => acc.id === entry.acctId);
    //         if (!isValidAcc) {
    //           toast.error("Please enter a valid Account from the available list.", { autoClose: 3000 });
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         const entryOrgs = pastedEntryOrgs[i] || [];
    //         const hasOrgValue = entry.orgId && entry.orgId.toString().trim() !== "";
    //         const isValidOrganization = entryOrgs.length > 0
    //           ? entryOrgs.some((org) => org.value.toString() === entry.orgId.toString())
    //           : hasOrgValue;

    //         if (!isValidOrganization) {
    //           toast.error("Organization is required.", { autoClose: 3000 });
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         if (!entry.plcGlcCode || !entry.plcGlcCode.trim()) {
    //           toast.error("PLC is required and cannot be empty.", { autoClose: 3000 });
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         const entryPlcs = pastedEntryPlcs[i] || [];
    //         if (entry.plcGlcCode && entry.plcGlcCode.trim() !== "") {
    //           const exactPlcMatch = entryPlcs.find(
    //             (option) => option.value.toLowerCase() === entry.plcGlcCode.toLowerCase().trim()
    //           );
    //           if (!exactPlcMatch) {
    //             toast.error("PLC must be selected from the available suggestions.", { autoClose: 4000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         }
    //       }

    //       // Build individual payload
    //       const payloadForecasts = durations.map((duration) => ({
    //         ...(planType === "EAC"
    //           ? { actualhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }
    //           : { forecastedhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }),
    //         projId: projectId,
    //         plId: planId,
    //         emplId: entry.id,
    //         month: duration.monthNo,
    //         year: duration.year,
    //         acctId: entry.acctId,
    //         orgId: entry.orgId,
    //         plc: entry.plcGlcCode || "",
    //         hrlyRate: Number(entry.perHourRate || 0),
    //         effectDt: null,
    //         plEmployee: null,
    //       }));

    //       bulkPayload.push({
    //         id: 0,
    //         emplId: entry.id,
    //         firstName: entry.firstName,
    //         lastName: entry.lastName,
    //         type: entry.idType,
    //         isRev: entry.isRev,
    //         isBrd: entry.isBrd,
    //         plcGlcCode: (entry.plcGlcCode || "").substring(0, 20),
    //         perHourRate: Number(entry.perHourRate || 0),
    //         status: entry.status || "ACT",
    //         accId: entry.acctId,
    //         orgId: entry.orgId || "",
    //         plId: planId,
    //         plForecasts: payloadForecasts,
    //       });
    //     }

    //     // Call API only if there are valid items in the payload
    //     if (bulkPayload.length > 0) {
    //       await axios.post(
    //         `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
    //         bulkPayload
    //       );

    //       // If we made it here, bulk API call was successful
    //       if (failedIndices.length === 0) {
    //         setNewEntries([]);
    //         setNewEntryPeriodHoursArray([]);
    //       } else {
    //         // Keep only failed entries (those that failed local validation)
    //         setNewEntries(newEntries.filter((_, idx) => failedIndices.includes(idx)));
    //         setNewEntryPeriodHoursArray(newEntryPeriodHoursArray.filter((_, idx) => failedIndices.includes(idx)));
    //       }

    //       fetchEmployees();
    //       if (onSaveSuccess) onSaveSuccess();
    //     } else if (failCount > 0) {
    //        // All entries failed local validation
    //        setNewEntries(newEntries.filter((_, idx) => failedIndices.includes(idx)));
    //        setNewEntryPeriodHoursArray(newEntryPeriodHoursArray.filter((_, idx) => failedIndices.includes(idx)));
    //     }

    //   } catch (err) {
    //     console.error("Save multiple entries error:", err);
    //     toast.error("Failed to save entries: " + (err.response?.data?.message || err.message), { autoClose: 3000 });
    //   } finally {
    //     setIsDurationLoading(false);
    //   }
    // };

    // const handleSaveMultipleEntry = async () => {
    //   if (newEntries.length === 0) {
    //     toast.info("No entries to save.", { autoClose: 2000 });
    //     return;
    //   }

    //   setIsDurationLoading(true);
    //   let successCount = 0;
    //   let failCount = 0;
    //   const failedIndices = [];

    //   try {
    //     for (let i = 0; i < newEntries.length; i++) {
    //       const entry = newEntries[i];
    //       const periodHours = newEntryPeriodHoursArray[i];

    //       // Skip all validations if planType is NBBUD
    //       if (planType !== "NBBUD") {
    //         // Check for duplicate employee ID before validating anything else
    //         const isDuplicate = localEmployees.some((emp) => {
    //           if (!emp.emple) return false;

    //           // For "Other" type, only check emplId
    //           if (entry.idType === "Other") {
    //             return emp.emple.emplId === entry.id.trim();
    //           }

    //           // For other types, check both emplId and plcGlcCode
    //           return (
    //             emp.emple.emplId === entry.id.trim() &&
    //             emp.emple.plcGlcCode === entry.plcGlcCode.trim()
    //           );
    //         });

    //         if (isDuplicate) {
    //           toast.error(
    //             "Can't save entry with existing ID and PLC combination. Please use a different ID or PLC.",
    //             {
    //               toastId: "duplicate-save-error",
    //               autoClose: 3000,
    //             }
    //           );
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         // UPDATED VALIDATION LOGIC - Apply to ALL ID types except "Other"
    //         if (entry.idType === "PLC") {
    //           if (!entry.id || entry.id !== "PLC") {
    //             toast.error(
    //               "ID must be automatically set to 'PLC' for PLC type.",
    //               {
    //                 autoClose: 3000,
    //               }
    //             );
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         } else if (entry.idType === "Other") {
    //           // For Other type, just check that it's not empty (no further validation)
    //           if (!entry.id.trim()) {
    //             toast.error("ID is required.", { autoClose: 3000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         } else {
    //           // For ALL other ID types (Employee, Vendor), validate against suggestions
    //           if (!entry.id.trim()) {
    //             toast.error("ID is required.", { autoClose: 3000 });
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }

    //           // MANDATORY validation against suggestions for Employee and Vendor types
    //           const suggestions = pastedEntrySuggestions[i] || [];
    //           if (suggestions.length > 0) {
    //             const validEmployee = suggestions.find(
    //               (emp) => emp.emplId === entry.id.trim()
    //             );
    //             if (!validEmployee) {
    //               toast.error(
    //                 "Please enter a valid ID from the available list.",
    //                 {
    //                   autoClose: 3000,
    //                 }
    //               );
    //               failCount++;
    //               failedIndices.push(i);
    //               continue;
    //             }
    //           } else {
    //             // If no suggestions are loaded, don't allow saving for Employee/Vendor
    //             toast.error(
    //               "Employee suggestions not loaded. Please try again.",
    //               {
    //                 autoClose: 3000,
    //               }
    //             );
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         }

    //         // Validate Account against pastedEntryAccounts
    //         const entryAccounts = pastedEntryAccounts[i] || [];
    //         const isValidAcc = entryAccounts.some(
    //           (acc) => acc.id === entry.acctId
    //         );
    //         if (!isValidAcc) {
    //           toast.error(
    //             "Please enter a valid Account from the available list.",
    //             {
    //               autoClose: 3000,
    //             }
    //           );
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         // Validate Organization against pastedEntryOrgs
    //         const entryOrgs = pastedEntryOrgs[i] || [];

    //         const hasOrgValue = entry.orgId && entry.orgId.toString().trim() !== "";

    //         const isValidOrganization = entryOrgs.length > 0
    //           ? entryOrgs.some((org) => org.value.toString() === entry.orgId.toString())
    //           : hasOrgValue;

    //         // const isValidOrganization = entryOrgs.some(
    //         //   (org) => org.value.toString() === entry.orgId.toString()
    //         // );
    //         if (!isValidOrganization) {
    //           toast.error("Organization is required.", { autoClose: 3000 });
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         // Validate PLC is not empty
    //         if (!entry.plcGlcCode || !entry.plcGlcCode.trim()) {
    //           toast.error("PLC is required and cannot be empty.", {
    //             autoClose: 3000,
    //           });
    //           failCount++;
    //           failedIndices.push(i);
    //           continue;
    //         }

    //         // Enhanced PLC validation - must match exactly from suggestions
    //         const entryPlcs = pastedEntryPlcs[i] || [];
    //         if (entry.plcGlcCode && entry.plcGlcCode.trim() !== "") {
    //           const exactPlcMatch = entryPlcs.find(
    //             (option) =>
    //               option.value.toLowerCase() ===
    //               entry.plcGlcCode.toLowerCase().trim()
    //           );

    //           if (!exactPlcMatch) {
    //             toast.error(
    //               "PLC must be selected from the available suggestions. Custom values are not allowed.",
    //               {
    //                 autoClose: 4000,
    //               }
    //             );
    //             failCount++;
    //             failedIndices.push(i);
    //             continue;
    //           }
    //         }
    //       }

    //       // Build payload forecasts
    //       const payloadForecasts = durations.map((duration) => {
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //         return {
    //           ...(planType === "EAC"
    //             ? { actualhours: Number(periodHours[uniqueKey] || 0) }
    //             : { forecastedhours: Number(periodHours[uniqueKey] || 0) }),
    //           projId: projectId,
    //           plId: planId,
    //           emplId: entry.id,
    //           month: duration.monthNo,
    //           year: duration.year,
    //           acctId: entry.acctId,
    //           orgId: entry.orgId,
    //           plc: entry.plcGlcCode || "",
    //           hrlyRate: Number(entry.perHourRate || 0),
    //           effectDt: null,
    //           plEmployee: null,
    //         };
    //       });

    //       const payload = {
    //         id: 0,
    //         emplId: entry.id,
    //         firstName: entry.firstName,
    //         lastName: entry.lastName,
    //         type: entry.idType,
    //         isRev: entry.isRev,
    //         isBrd: entry.isBrd,
    //         plcGlcCode: (entry.plcGlcCode || "").substring(0, 20),
    //         perHourRate: Number(entry.perHourRate || 0),
    //         status: entry.status || "ACT",
    //         accId: entry.acctId,
    //         orgId: entry.orgId || "",
    //         plId: planId,
    //         plForecasts: payloadForecasts,
    //       };

    //       try {
    //         await axios.post(`${backendUrl}/Employee/AddNewEmployee`, payload);
    //         successCount++;
    //       } catch (err) {
    //         failCount++;
    //         failedIndices.push(i);

    //         // Enhanced error message extraction (same as handleSaveNewEntry)
    //         let detailedErrorMessage = "Failed to save entry. ";

    //         if (err?.response?.data) {
    //           const errorData = err.response.data;

    //           if (errorData.errors) {
    //             const fieldErrors = [];
    //             Object.keys(errorData.errors).forEach((field) => {
    //               const errors = errorData.errors[field];
    //               if (Array.isArray(errors) && errors.length > 0) {
    //                 fieldErrors.push(`${field}: ${errors[0]}`);
    //               }
    //             });
    //             if (fieldErrors.length > 0) {
    //               detailedErrorMessage += `Validation errors - ${fieldErrors.join(
    //                 ", "
    //               )}`;
    //             }
    //           } else if (errorData.error) {
    //             detailedErrorMessage += `Reason: ${errorData.error}`;
    //           } else if (errorData.message) {
    //             detailedErrorMessage += `Reason: ${errorData.message}`;
    //           } else if (typeof errorData === "string") {
    //             detailedErrorMessage += `Reason: ${errorData}`;
    //           } else {
    //             const errorMessages = [];
    //             if (errorData.ID) errorMessages.push(`ID: ${errorData.ID}`);
    //             if (errorData.Account)
    //               errorMessages.push(`Account: ${errorData.Account}`);
    //             if (errorData.Organization)
    //               errorMessages.push(`Organization: ${errorData.Organization}`);
    //             if (errorData.PLC) errorMessages.push(`PLC: ${errorData.PLC}`);

    //             if (errorMessages.length > 0) {
    //               detailedErrorMessage += `Please check - ${errorMessages.join(
    //                 ", "
    //               )}`;
    //             } else {
    //               detailedErrorMessage += `Server response: ${JSON.stringify(
    //                 errorData
    //               )}`;
    //             }
    //           }
    //         } else if (err?.message) {
    //           detailedErrorMessage += `Reason: ${err.message}`;
    //         } else {
    //           detailedErrorMessage +=
    //             "Unknown error occurred. Please check your input and try again.";
    //         }

    //         toast.error(detailedErrorMessage, {
    //           toastId: `save-entry-error-${i}`,
    //           autoClose: 7000,
    //         });

    //         console.error(`Save entry ${i + 1} error:`, {
    //           error: err,
    //           response: err?.response?.data,
    //           status: err?.response?.status,
    //         });
    //       }

    //       // Small delay between saves
    //       await new Promise((resolve) => setTimeout(resolve, 300));
    //     }

    //     // After all saves, handle results
    //     if (failedIndices.length > 0) {
    //       // Keep only failed entries
    //       const remainingEntries = newEntries.filter((_, idx) =>
    //         failedIndices.includes(idx)
    //       );
    //       const remainingHours = newEntryPeriodHoursArray.filter((_, idx) =>
    //         failedIndices.includes(idx)
    //       );

    //       setNewEntries(remainingEntries);
    //       setNewEntryPeriodHoursArray(remainingHours);
    //     } else {
    //       // All saved successfully
    //       setNewEntries([]);
    //       setNewEntryPeriodHoursArray([]);
    //       // toast.success(`Entries saved successfully!`, { autoClose: 3000 });
    //     }

    //     if (successCount > 0) {
    //       fetchEmployees();
    //       if (onSaveSuccess) {
    //         onSaveSuccess();
    //       }
    //     }
    //   } catch (err) {
    //     console.error("Save multiple entries error:", err);
    //     toast.error("Failed to save entries.", { autoClose: 3000 });
    //   } finally {
    //     setIsDurationLoading(false);
    //   }
    // };

    //   const handleSaveMultipleEntry = async () => {
    //   if (newEntries.length === 0) return true; // Nothing to do, so technically "success"

    //   setIsDurationLoading(true);
    //   let validationFailed = false;
    //   const bulkPayload = [];

    //   try {
    //     for (let i = 0; i < newEntries.length; i++) {
    //       const entry = newEntries[i];
    //       const periodHours = newEntryPeriodHoursArray[i];

    //       if (planType !== "NBBUD") {
    //         // 1. Duplicate ID/PLC Check
    //         const isDuplicate = localEmployees.some((emp) => {
    //           if (!emp.emple) return false;
    //           if (entry.idType === "Other") return emp.emple.emplId === entry.id.trim();
    //           return emp.emple.emplId === entry.id.trim() && emp.emple.plcGlcCode === entry.plcGlcCode.trim();
    //         });

    //         if (isDuplicate) {
    //           toast.error(`Row ${i + 1}: Duplicate ID and PLC combination found.`);
    //           validationFailed = true;
    //           break;
    //         }

    //         // 2. Account Validation (Added detailed message as requested)
    //         const entryAccounts = pastedEntryAccounts[i] || [];
    //         if (!entryAccounts.some((acc) => acc.id === entry.acctId)) {
    //           toast.error(`Row ${i + 1}: Account ${entry.acctId} is not valid for this project.`);
    //           validationFailed = true;
    //           break;
    //         }

    //         // 3. Organization Validation
    //         const entryOrgs = pastedEntryOrgs[i] || [];
    //         const hasOrgValue = entry.orgId && entry.orgId.toString().trim() !== "";
    //         const isValidOrg = entryOrgs.length > 0
    //           ? entryOrgs.some((org) => org.value.toString() === entry.orgId.toString())
    //           : hasOrgValue;

    //         if (!isValidOrg) {
    //           toast.error(`Row ${i + 1}: Valid Organization is required.`);
    //           validationFailed = true;
    //           break;
    //         }
    //       }

    //       // Build Forecast Data
    //       const payloadForecasts = durations.map((duration) => ({
    //         ...(planType === "EAC"
    //           ? { actualhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }
    //           : { forecastedhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }),
    //         projId: projectId,
    //         plId: planId,
    //         emplId: entry.id,
    //         month: duration.monthNo,
    //         year: duration.year,
    //         acctId: entry.acctId,
    //         orgId: entry.orgId,
    //         plc: entry.plcGlcCode || "",
    //         hrlyRate: Number(entry.perHourRate || 0),
    //       }));

    //       bulkPayload.push({
    //         id: 0,
    //         emplId: entry.id,
    //         firstName: entry.firstName,
    //         lastName: entry.lastName,
    //         type: entry.idType,
    //         isRev: entry.isRev,
    //         isBrd: entry.isBrd,
    //         plcGlcCode: (entry.plcGlcCode || "").substring(0, 20),
    //         perHourRate: Number(entry.perHourRate || 0),
    //         status: entry.status || "ACT",
    //         accId: entry.acctId,
    //         orgId: entry.orgId || "",
    //         plId: planId,
    //         plForecasts: payloadForecasts,
    //       });
    //     }

    //     if (validationFailed) return false; // EXIT WITHOUT CALLING API

    //     if (bulkPayload.length > 0) {
    //       await axios.post(
    //         `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
    //         bulkPayload
    //       );
    //       return true; // SUCCESS
    //     }
    //     return true;

    //   } catch (err) {
    //     toast.error("API Error: " + (err.response?.data?.message || err.message));
    //     return false; // FAILURE
    //   } finally {
    //     setIsDurationLoading(false);
    //   }
    // };

    // const handleSaveMultipleEntry = async () => {
    //   if (newEntries.length === 0) return true;

    //   setIsDurationLoading(true);
    //   let validationFailed = false;
    //   const bulkPayload = [];

    //   try {
    //     for (let i = 0; i < newEntries.length; i++) {
    //       const entry = newEntries[i];
    //       const periodHours = newEntryPeriodHoursArray[i];

    //       if (planType !== "NBBUD") {
    //         // 1. Duplicate Check
    //         const isDuplicate = localEmployees.some((emp) => {
    //           if (!emp.emple) return false;
    //           if (entry.idType === "Other") return emp.emple.emplId === entry.id.trim();
    //           return emp.emple.emplId === entry.id.trim() && emp.emple.plcGlcCode === entry.plcGlcCode.trim();
    //         });

    //         if (isDuplicate) {
    //           toast.error(`Duplicate ID and PLC combination`);
    //           validationFailed = true; break;
    //         }

    //         // 2. Account Validation
    //         const entryAccounts = pastedEntryAccounts[i] || [];
    //         if (!entryAccounts.some((acc) => acc.id === entry.acctId)) {
    //           toast.error(`Invalid Account selected for ID ${entry.id}.`);
    //           validationFailed = true; break;
    //         }

    //         // 3. Organization Validation
    //         const entryOrgs = pastedEntryOrgs[i] || [];
    //         const hasOrgValue = entry.orgId && entry.orgId.toString().trim() !== "";
    //         const isValidOrg = entryOrgs.length > 0
    //           ? entryOrgs.some((org) => org.value.toString() === entry.orgId.toString())
    //           : hasOrgValue;

    //         if (!isValidOrg) {
    //           toast.error(`Organization ID ${entry.orgId} is not valid.`);
    //           validationFailed = true; break;
    //         }
    //       }

    //       // Build payload for this row
    //       const payloadForecasts = durations.map((duration) => ({
    //         ...(planType === "EAC"
    //           ? { actualhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }
    //           : { forecastedhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }),
    //         projId: projectId,
    //         plId: planId,
    //         emplId: entry.id,
    //         month: duration.monthNo,
    //         year: duration.year,
    //         acctId: entry.acctId,
    //         orgId: entry.orgId,
    //         // plc: entry.plcGlcCode || "",
    //         plcGlcCode: (entry.plcGlcCode || "").split("-")[0].trim().substring(0, 20),
    //         hrlyRate: Number(entry.perHourRate || 0),
    //         effectDt: null,
    //         plEmployee: null,
    //       }));

    //       bulkPayload.push({
    //         id: 0,
    //         emplId: entry.id,
    //         firstName: entry.firstName,
    //         lastName: entry.lastName,
    //         type: entry.idType,
    //         isRev: entry.isRev,
    //         isBrd: entry.isBrd,
    //         plcGlcCode: (entry.plcGlcCode || "").substring(0, 20),
    //         perHourRate: Number(entry.perHourRate || 0),
    //         status: entry.status || "ACT",
    //         accId: entry.acctId,
    //         orgId: entry.orgId || "",
    //         plId: planId,
    //         plForecasts: payloadForecasts,
    //       });
    //     }

    //     if (validationFailed) return false;

    //     if (bulkPayload.length > 0) {
    //       // Use the new bulk endpoint
    //       await axios.post(
    //         `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
    //         bulkPayload
    //       );
    //       return true; // Return true to signal the UI can refresh
    //     }
    //     return true;

    //   } catch (err) {
    //     toast.error("Error: " + (err.response?.data?.error || err.message));
    //     return false;
    //   } finally {
    //     setIsDurationLoading(false);
    //   }
    // };

    // const handleSaveMultipleEntry = async () => {
    //   if (newEntries.length === 0) return true;

    //   setIsDurationLoading(true);
    //   let validationFailed = false;
    //   const bulkPayload = [];

    //   try {
    //     for (let i = 0; i < newEntries.length; i++) {
    //       const entry = newEntries[i];
    //       const periodHours = newEntryPeriodHoursArray[i];
    //       const cleanPlc = (entry.plcGlcCode || "").split("-")[0].trim().substring(0, 20);

    //       // --- STRICT VALIDATION FOR SUGGESTIONS ---
    //       if (entry.idType !== "Other" && planType !== "NBBUD") {

    //         // 1. Validate ID against suggestions
    //         const suggestions = pastedEntrySuggestions[i] || [];
    //         const idExists = suggestions.some(s => String(s.emplId) === String(entry.id).trim());

    //         if (!idExists) {
    //           toast.error(`Row ${i + 1}: ID "${entry.id}" is not in the suggestion list. Random keywords are not allowed.`);
    //           validationFailed = true; break;
    //         }

    //         // 2. Validate PLC against suggestions
    //         const plcOptionsList = pastedEntryPlcs[i] || [];
    //         const plcExists = plcOptionsList.some(p => p.value.toLowerCase() === cleanPlc.toLowerCase());

    //         if (!plcExists) {
    //           toast.error(`Row ${i + 1}: PLC "${cleanPlc}" is not in the suggestion list. Please select from the dropdown.`);
    //           validationFailed = true; break;
    //         }

    //         // 3. Account Validation
    //         const entryAccounts = pastedEntryAccounts[i] || [];
    //         if (!entryAccounts.some((acc) => acc.id === entry.acctId)) {
    //           toast.error(`Row ${i + 1}: Invalid Account ${entry.acctId}.`);
    //           validationFailed = true; break;
    //         }

    //         // 4. Organization Validation
    //         const entryOrgs = pastedEntryOrgs[i] || [];
    //         const isValidOrg = entryOrgs.some((org) => org.value.toString() === entry.orgId.toString());

    //         if (!isValidOrg) {
    //           toast.error(`Row ${i + 1}: Organization ID ${entry.orgId} is not valid.`);
    //           validationFailed = true; break;
    //         }
    //       }

    //       // Build payload for API
    //       const payloadForecasts = durations.map((duration) => ({
    //         ...(planType === "EAC"
    //           ? { actualhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }
    //           : { forecastedhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }),
    //         projId: projectId,
    //         plId: planId,
    //         emplId: entry.id.trim(),
    //         month: duration.monthNo,
    //         year: duration.year,
    //         acctId: entry.acctId,
    //         orgId: entry.orgId,
    //         plc: cleanPlc,
    //         hrlyRate: Number(entry.perHourRate || 0),
    //       }));

    //       bulkPayload.push({
    //         id: 0,
    //         emplId: entry.id.trim(),
    //         firstName: entry.firstName,
    //         lastName: entry.lastName,
    //         type: entry.idType,
    //         isRev: entry.isRev,
    //         isBrd: entry.isBrd,
    //         plcGlcCode: cleanPlc,
    //         perHourRate: Number(entry.perHourRate || 0),
    //         status: entry.status || "ACT",
    //         accId: entry.acctId,
    //         orgId: entry.orgId || "",
    //         plId: planId,
    //         plForecasts: payloadForecasts,
    //       });
    //     }

    //     if (validationFailed) return false; // This prevents handleMasterSave from proceeding

    //     if (bulkPayload.length > 0) {
    //       await axios.post(
    //         `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
    //         bulkPayload
    //       );
    //       return true;
    //     }
    //     return true;

    //   } catch (err) {
    //     const detailedError = err.response?.data?.error || err.response?.data?.message || err.message;
    //     toast.error("Server Error: " + detailedError);
    //     return false;
    //   } finally {
    //     setIsDurationLoading(false);
    //   }
    // };

    const handleSaveMultipleEntry = async () => {
      if (newEntries.length === 0) return true;
      setIsDurationLoading(true);

      try {
        const bulkPayload = [];
        for (let i = 0; i < newEntries.length; i++) {
          const entry = newEntries[i];
          const suggestions = pastedEntrySuggestions[i] || [];
          const plcs = pastedEntryPlcs[i] || [];

          // STRICT VALIDATION: Block random typing/keywords
          if (
            entry.idType === "Employee" ||
            entry.idType === "Vendor" ||
            entry.idType === "Vendor Employee" ||
            entry.idType === "VendorEmployee" ||
            entry.idType === "PLC"
          ) {
            const idValid =
              entry.idType === "PLC"
                ? true
                : suggestions.some(
                    (s) => String(s.emplId) === String(entry.id).trim(),
                  );
            const plcValid = plcs.some(
              (p) => p.value.trim() === entry.plcGlcCode.trim(),
            );

            if (!idValid) {
              toast.error(
                `Row ${i + 1}: ID "${entry.id}" is invalid. Please select from suggestions.`,
              );
              setIsDurationLoading(false);
              return false; // STOPS THE WHOLE PROCESS
            }
            if (!plcValid) {
              toast.error(
                `Row ${i + 1}: PLC "${entry.plcGlcCode}" is invalid. Please select from suggestions.`,
              );
              setIsDurationLoading(false);
              return false; // STOPS THE WHOLE PROCESS
            }
          }

          const targetId = entry.id.trim();

          for (const duration of durations) {
            const uniqueKey = `${duration.monthNo}_${duration.year}`;
            const currentVal = newEntryPeriodHoursArray[i][uniqueKey];
            const currentHours = parseFloat(currentVal) || 0;

            if (currentHours > 0 && duration.workingHours) {
              const maxLimit = duration.workingHours * 2;

              // 1. Sum Existing Rows for this ID
              const existingSum = localEmployees.reduce((sum, emp) => {
                if (emp?.emple?.emplId === targetId) {
                  const v = getMonthHours(emp)[uniqueKey]?.value || 0;
                  return sum + (parseFloat(v) || 0);
                }
                return sum;
              }, 0);

              // 2. Sum OTHER entries in this bulk save list for the SAME ID
              const bulkSum = newEntries.reduce((sum, e, idx) => {
                if (idx !== i && e.id === targetId) {
                  const v = newEntryPeriodHoursArray[idx]?.[uniqueKey] || 0;
                  return sum + (parseFloat(v) || 0);
                }
                return sum;
              }, 0);

              const total = existingSum + bulkSum + currentHours;

              if (total > maxLimit) {
                toast.error(
                  `Row ${i + 1}: Total hours for ID ${targetId} in ${duration.month} (${total.toFixed(2)}) exceed limit of ${maxLimit}.`,
                  {
                    autoClose: 5000,
                  },
                );
                setIsDurationLoading(false);
                return false; // STOP SAVING
              }
            }
          }

          // (Mapping logic for payloadForecasts remains the same as your existing code...)
          const payloadForecasts = durations.map((duration) => ({
            ...(planType === "EAC"
              ? {
                  actualhours: Number(
                    newEntryPeriodHoursArray[i][
                      `${duration.monthNo}_${duration.year}`
                    ] || 0,
                  ),
                }
              : {
                  forecastedhours: Number(
                    newEntryPeriodHoursArray[i][
                      `${duration.monthNo}_${duration.year}`
                    ] || 0,
                  ),
                }),
            projId: projectId,
            plId: planId,
            emplId: entry.id,
            month: duration.monthNo,
            year: duration.year,
            acctId: entry.acctId,
            orgId: entry.orgId,
            plc: entry.plcGlcCode,
            hrlyRate: Number(entry.perHourRate || 0),
          }));
          bulkPayload.push({
            emplId: entry.id.trim(),
            firstName:
              entry.idType === "PLC"
                ? entry.firstName.split(" - ")[1]
                : entry.firstName,
            lastName: entry.lastName,
            type: entry.idType,
            isRev: entry.isRev,
            isBrd: entry.isBrd,
            plcGlcCode: entry.plcGlcCode.substring(0, 20),
            perHourRate: Number(entry.perHourRate || 0),
            status: entry.status || "ACT",
            accId: entry.acctId,
            orgId: entry.orgId,
            plId: planId,
            plForecasts: payloadForecasts,
            effectiveDate: entry.effectiveDate || defaultEffectiveDate || "2026-01-30",
            esc_Percent: Number(entry.esc_Percent || escalationPercent || 0),
          });
        }

        await axios.post(
          `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
          bulkPayload,
        );
        return true;
      } catch (err) {
        toast.error(
          "Failed to save entries: " + (err.response?.data?.error || err.error),
        );
        return false;
      } finally {
        setIsDurationLoading(false);
      }
    };

    // const handleSaveMultipleEntry = async () => {
    //   if (newEntries.length === 0) return true;

    //   setIsDurationLoading(true);
    //   let validationFailed = false;
    //   const bulkPayload = [];

    //   try {
    //     for (let i = 0; i < newEntries.length; i++) {
    //       const entry = newEntries[i];
    //       const periodHours = newEntryPeriodHoursArray[i];

    //       // Robust PLC Parsing: Fixes deployment saving issues by removing trailing spaces
    //       const cleanPlc = (entry.plcGlcCode || "").split("-")[0].trim().substring(0, 20);

    //       if (planType !== "NBBUD") {
    //         // 1. Account Validation
    //         const entryAccounts = pastedEntryAccounts[i] || [];
    //         if (!entryAccounts.some((acc) => acc.id === entry.acctId)) {
    //           toast.error(` Invalid Account ${entry.acctId}.`);
    //           validationFailed = true; break;
    //         }

    //         // 2. Organization Validation
    //         const entryOrgs = pastedEntryOrgs[i] || [];
    //         const hasOrgValue = entry.orgId && entry.orgId.toString().trim() !== "";
    //         const isValidOrg = entryOrgs.length > 0
    //           ? entryOrgs.some((org) => org.value.toString() === entry.orgId.toString())
    //           : hasOrgValue;

    //         if (!isValidOrg) {
    //           toast.error(`Organization ID ${entry.orgId} is not valid.`);
    //           validationFailed = true; break;
    //         }
    //       }

    //       // Build individual payload forecasts
    //       const payloadForecasts = durations.map((duration) => ({
    //         ...(planType === "EAC"
    //           ? { actualhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }
    //           : { forecastedhours: Number(periodHours[`${duration.monthNo}_${duration.year}`] || 0) }),
    //         projId: projectId,
    //         plId: planId,
    //         emplId: entry.id.trim(),
    //         month: duration.monthNo,
    //         year: duration.year,
    //         acctId: entry.acctId,
    //         orgId: entry.orgId,
    //         plc: cleanPlc,
    //         hrlyRate: Number(entry.perHourRate || 0),
    //       }));

    //       bulkPayload.push({
    //         id: 0,
    //         emplId: entry.id.trim(),
    //         firstName: entry.firstName,
    //         lastName: entry.lastName,
    //         type: entry.idType,
    //         isRev: entry.isRev,
    //         isBrd: entry.isBrd,
    //         plcGlcCode: cleanPlc,
    //         perHourRate: Number(entry.perHourRate || 0),
    //         status: entry.status || "ACT",
    //         accId: entry.acctId,
    //         orgId: entry.orgId || "",
    //         plId: planId,
    //         plForecasts: payloadForecasts,
    //       });
    //     }

    //     if (validationFailed) return false;

    //     if (bulkPayload.length > 0) {
    //       await axios.post(
    //         `${backendUrl}/Employee/AddNewEmployees?plid=${planId}&TemplateId=${templateId}`,
    //         bulkPayload
    //       );
    //       return true;
    //     }
    //     return true;

    //   } catch (err) {
    //     console.error("Save multiple entries error:", err);
    //     // NEW: Catch specific backend error (e.g., "Employee combination already exists")
    //     const detailedError = err.response?.data?.error || err.response?.data?.message || err.message;
    //     toast.error(detailedError, {
    //         autoClose: 6000,
    //         toastId: "backend-error-toast"
    //     });
    //     return false;
    //   } finally {
    //     setIsDurationLoading(false);
    //   }
    // };

    const handleSaveMultipleEntries = async () => {
      for (let i = 0; i < newEntries.length; i++) {
        // Temporarily set state for this entry
        setNewEntry(newEntries[i]);
        setNewEntryPeriodHours(newEntryPeriodHoursArray[i]);

        // Wait for state to update
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Call existing save function with ALL validation
        await handleSaveNewEntry();

        // Delay between saves
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Clear all entries after saving
      setNewEntries([]);
      setNewEntryPeriodHoursArray([]);
    };

    //   const handleFindReplace = async () => {
    //     if (
    //       !isEditable ||
    //       findValue === "" ||
    //       (replaceScope === "row" && selectedRowIndex === null) ||
    //       (replaceScope === "column" && selectedColumnKey === null)
    //     ) {
    //       toast.warn("Please select a valid scope and enter a value to find.", {
    //         toastId: "find-replace-warning",
    //         autoClose: 3000,
    //       });
    //       return;
    //     }

    //     setIsLoading(true);
    //     let replacementsCount = 0;
    //     let skippedCount = 0;

    //     try {
    //       // Prepare bulk payload array
    //       const bulkPayload = [];
    //       const updatedInputValues = { ...inputValues };

    //       for (const empIdx in localEmployees) {
    //         const emp = localEmployees[empIdx];
    //         const actualEmpIdx = parseInt(empIdx, 10);

    //         if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) {
    //           continue;
    //         }

    //         for (const duration of sortedDurations) {
    //           const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //           if (replaceScope === "column" && uniqueKey !== selectedColumnKey) {
    //             continue;
    //           }

    //           if (!isMonthEditable(duration, closedPeriod, planType)) {
    //             continue;
    //           }

    //           const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
    //           let displayedValue;
    //           if (inputValues[currentInputKey] !== undefined) {
    //             displayedValue = String(inputValues[currentInputKey]);
    //           } else {
    //             const monthHours = getMonthHours(emp);
    //             const forecast = monthHours[uniqueKey];
    //             if (forecast && forecast.value !== undefined) {
    //               displayedValue = String(forecast.value);
    //             } else {
    //               displayedValue = "0";
    //             }
    //           }

    //           const findValueTrimmed = findValue.trim();
    //           const displayedValueTrimmed = displayedValue.trim();

    //           function isZeroLike(val) {
    //             if (val === undefined || val === null) return true;
    //             if (typeof val === "number") return val === 0;
    //             if (typeof val === "string") {
    //               const trimmed = val.trim();
    //               return (
    //                 trimmed === "" ||
    //                 trimmed === "0" ||
    //                 trimmed === "0.0" ||
    //                 trimmed === "0.00" ||
    //                 (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
    //               );
    //             }
    //             return false;
    //           }

    //           let isMatch = false;
    //           // if (
    //           //   !isNaN(Number(findValueTrimmed)) &&
    //           //   Number(findValueTrimmed) === 0
    //           // ) {
    //           //   isMatch = isZeroLike(displayedValueTrimmed);
    //           // }
    //           if (isZeroLike(findValueTrimmed)) {
    //             isMatch = isZeroLike(displayedValueTrimmed);
    //           }
    //            else {
    //             isMatch = displayedValueTrimmed === findValueTrimmed;
    //             if (!isMatch) {
    //               const findNum = parseFloat(findValueTrimmed);
    //               const displayNum = parseFloat(displayedValueTrimmed);
    //               if (!isNaN(findNum) && !isNaN(displayNum)) {
    //                 isMatch = findNum === displayNum;
    //               }
    //             }
    //           }

    //           if (isMatch) {
    //             const newValue = replaceValue.trim();
    //             const newNumericValue = newValue === "" ? 0 : Number(newValue);
    //             const monthHours = getMonthHours(emp);
    //             const forecast = monthHours[uniqueKey];

    //             if (!forecast || !forecast.forecastid) {
    //               skippedCount++;
    //               continue;
    //             }

    //             if (displayedValueTrimmed !== newValue) {
    //               updatedInputValues[currentInputKey] = newValue;
    //               replacementsCount++;

    //               // Create payload matching the bulk API structure from handleSaveAllHours
    //               const payload = {
    //                 forecastedamt: forecast?.forecastedamt ?? 0,
    //                 actualamt: forecast?.actualamt ?? 0,
    //                 forecastid: Number(forecast?.forecastid ?? 0),
    //                 projId: forecast?.projId ?? projectId ?? "",
    //                 plId: forecast?.plId ?? planId ?? 0,
    //                 emplId: forecast?.emplId ?? emp?.emple?.emplId ?? "",
    //                 dctId: forecast?.dctId ?? 0,
    //                 month: forecast?.month ?? duration?.monthNo ?? 0,
    //                 year: forecast?.year ?? duration?.year ?? 0,
    //                 totalBurdenCost: forecast?.totalBurdenCost ?? 0,
    //                 fees: forecast?.fees ?? 0,
    //                 burden: forecast?.burden ?? 0,
    //                 ccffRevenue: forecast?.ccffRevenue ?? 0,
    //                 tnmRevenue: forecast?.tnmRevenue ?? 0,
    //                 revenue: forecast?.revenue ?? 0,
    //                 cost: forecast?.cost ?? 0,
    //                 forecastedCost: forecast?.forecastedCost ?? 0,
    //                 fringe: forecast?.fringe ?? 0,
    //                 overhead: forecast?.overhead ?? 0,
    //                 gna: forecast?.gna ?? 0,
    //                 materials: forecast?.materials ?? 0,
    //                 // Update hours based on plan type
    //                 ...(planType === "EAC"
    //                   ? {
    //                       actualhours: Number(newNumericValue) || 0,
    //                       forecastedhours: forecast?.forecastedhours ?? 0,
    //                     }
    //                   : {
    //                       forecastedhours: Number(newNumericValue) || 0,
    //                       actualhours: forecast?.actualhours ?? 0,
    //                     }),
    //                 createdat: forecast?.createdat ?? new Date().toISOString(),
    //                 updatedat: new Date().toISOString(),
    //                 displayText: forecast?.displayText ?? "",
    //                 acctId: emp?.emple?.accId ?? "",
    //                 orgId: emp?.emple?.orgId ?? "",
    //                 plc: emp?.emple?.plcGlcCode ?? "",
    //                 empleId: emp?.emple?.id ?? 0,
    //                 hrlyRate: emp?.emple?.perHourRate ?? 0,
    //                 effectDt: new Date().toISOString().split("T")[0],
    //                 emple: emp?.emple
    //                   ? {
    //                       id: emp.emple.id ?? 0,
    //                       emplId: emp.emple.emplId ?? "",
    //                       orgId: emp.emple.orgId ?? "",
    //                       firstName: emp.emple.firstName ?? "",
    //                       lastName: emp.emple.lastName ?? "",
    //                       plcGlcCode: emp.emple.plcGlcCode ?? "",
    //                       perHourRate: emp.emple.perHourRate ?? 0,
    //                       salary: emp.emple.salary ?? 0,
    //                       accId: emp.emple.accId ?? "",
    //                       hireDate:
    //                         emp.emple.hireDate ??
    //                         new Date().toISOString().split("T")[0],
    //                       isRev: emp.emple.isRev ?? false,
    //                       isBrd: emp.emple.isBrd ?? false,
    //                       createdAt:
    //                         emp.emple.createdAt ?? new Date().toISOString(),
    //                       type: emp.emple.type ?? "",
    //                       status: emp.emple.status ?? "",
    //                       plId: planId ?? 0,
    //                       isWarning: emp.emple.isWarning ?? false,
    //                       plForecasts: [],
    //                       organization: emp.emple.organization ?? null,
    //                       plProjectPlan: emp.emple.plProjectPlan ?? null,
    //                     }
    //                   : null,
    //               };

    //               bulkPayload.push(payload);
    //             }
    //           }
    //         }
    //       }

    //       if (bulkPayload.length === 0) {
    //         if (replacementsCount === 0 && skippedCount === 0) {
    //           toast.info("No cells replaced.", { autoClose: 2000 });
    //         }
    //         return;
    //       }

    //       // Update input values for UI consistency
    //       setInputValues(updatedInputValues);

    //       // Use correct bulk API endpoint matching handleSaveAllHours
    //       const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

    //       const response = await axios.put(
    //         `${backendUrl}/Forecast/BulkUpdateForecastHours/${apiPlanType}`,
    //         bulkPayload,
    //         { headers: { "Content-Type": "application/json" } }
    //       );

    //       // Update local state for all successful updates matching handleSaveAllHours pattern
    //       setLocalEmployees((prev) => {
    //         const updated = [...prev];

    //         for (const empIdx in updated) {
    //           const emp = updated[empIdx];
    //           for (const duration of sortedDurations) {
    //             const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //             const currentInputKey = `${empIdx}_${uniqueKey}`;
    //             if (updatedInputValues[currentInputKey] !== undefined) {
    //               if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
    //                 const forecastIndex = emp.emple.plForecasts.findIndex(
    //                   (f) =>
    //                     f.month === duration.monthNo && f.year === duration.year
    //                 );

    //                 if (forecastIndex !== -1) {
    //                   const newValue =
    //                     parseFloat(updatedInputValues[currentInputKey]) || 0;
    //                   if (planType === "EAC") {
    //                     updated[empIdx].emple.plForecasts[
    //                       forecastIndex
    //                     ].actualhours = newValue;
    //                   } else {
    //                     updated[empIdx].emple.plForecasts[
    //                       forecastIndex
    //                     ].forecastedhours = newValue;
    //                   }
    //                 }
    //               }
    //             }
    //           }
    //         }

    //         return updated;
    //       });

    //       if (replacementsCount > 0) {
    //         toast.success(`Successfully replaced ${replacementsCount} cells.`, {
    //           autoClose: 2000,
    //         });
    //       }

    //       if (skippedCount > 0) {
    //         toast.warning(`${skippedCount} entries could not be processed.`, {
    //           autoClose: 3000,
    //         });
    //       }
    //     } catch (err) {
    //       console.error("Bulk find/replace error:", err);
    //       toast.error(
    //         "Failed to replace values: " +
    //           (err.response?.data?.message || err.message),
    //         {
    //           toastId: "replace-error",
    //           autoClose: 3000,
    //         }
    //       );
    //     } finally {
    //       setIsLoading(false);
    //       setShowFindReplace(false);
    //       setFindValue("");
    //       setReplaceValue("");
    //       setSelectedRowIndex(null);
    //       setSelectedColumnKey(null);
    //       setReplaceScope("all");
    //     }
    //   };

    //   const handleFindReplace = async () => {
    //     if (
    //       !isEditable ||
    //       findValue === "" ||
    //       (replaceScope === "row" && selectedRowIndex === null) ||
    //       (replaceScope === "column" && selectedColumnKey === null)
    //     ) {
    //       toast.warn("Please select a valid scope and enter a value to find.", {
    //         toastId: "find-replace-warning",
    //         autoClose: 3000,
    //       });
    //       return;
    //     }

    //     setIsLoading(true);
    //     let replacementsCount = 0;
    //     let skippedCount = 0;

    //     try {
    //       // Prepare bulk payload array
    //       const bulkPayload = [];
    //       const updatedInputValues = { ...inputValues };

    //       for (const empIdx in localEmployees) {
    //         const emp = localEmployees[empIdx];
    //         const actualEmpIdx = parseInt(empIdx, 10);

    //         if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) {
    //           continue;
    //         }

    //         for (const duration of sortedDurations) {
    //           const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //           if (replaceScope === "column" && uniqueKey !== selectedColumnKey) {
    //             continue;
    //           }

    //           if (!isMonthEditable(duration, closedPeriod, planType)) {
    //             continue;
    //           }

    //           const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
    //           let displayedValue;
    //           const monthHours = getMonthHours(emp);
    //           let forecast = monthHours[uniqueKey]; // Check for existing forecast

    //           // Determine the current displayed value (from input or from forecast)
    //           if (inputValues[currentInputKey] !== undefined) {
    //             displayedValue = String(inputValues[currentInputKey]);
    //           } else if (forecast && forecast.value !== undefined) {
    //             displayedValue = String(forecast.value);
    //           } else {
    //             displayedValue = "0"; // Default to 0 if no input and no forecast
    //           }
    //
    //           const findValueTrimmed = findValue.trim();
    //           const displayedValueTrimmed = displayedValue.trim();

    //           function isZeroLike(val) {
    //             if (val === undefined || val === null) return true;
    //             if (typeof val === "number") return val === 0;
    //             if (typeof val === "string") {
    //               const trimmed = val.trim();
    //               return (
    //                 trimmed === "" ||
    //                 trimmed === "0" ||
    //                 trimmed === "0.0" ||
    //                 trimmed === "0.00" ||
    //                 (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
    //               );
    //             }
    //             return false;
    //           }

    //           let isMatch = false;
    //           if (isZeroLike(findValueTrimmed)) {
    //             isMatch = isZeroLike(displayedValueTrimmed);
    //           }
    //         	else {
    //             isMatch = displayedValueTrimmed === findValueTrimmed;
    //             if (!isMatch) {
    //               const findNum = parseFloat(findValueTrimmed);
    //               const displayNum = parseFloat(displayedValueTrimmed);
    //               if (!isNaN(findNum) && !isNaN(displayNum)) {
    //                 isMatch = findNum === displayNum;
    //               }
    //             }
    //           }

    //           if (isMatch) {
    //             const newValue = replaceValue.trim();
    //             const newNumericValue = newValue === "" ? 0 : Number(newValue);
    //
    //             // --- START FIX: Handle Missing Forecast for BUD/NBBUD Plans ---
    //             if (isBudPlan && !forecast) {
    //               // Create a mock forecast object for the payload when one doesn't exist.
    //               // Set forecastid to 0 for a new record (INSERT).
    //               forecast = {
    //                 forecastid: 0,
    //                 projId: projectId,
    //                 plId: planId,
    //                 emplId: emp?.emple?.emplId ?? "",
    //                 month: duration.monthNo,
    //                 year: duration.year,
    //                 acctId: emp?.emple?.accId ?? "",
    //                 orgId: emp?.emple?.orgId ?? "",
    //                 plc: emp?.emple?.plcGlcCode ?? "",
    //                 empleId: emp?.emple?.id ?? 0,
    //                 hrlyRate: emp?.emple?.perHourRate ?? 0,
    //                 // Set defaults to 0 as per the required payload structure
    //                 totalBurdenCost: 0, fees: 0, burden: 0, ccffRevenue: 0, tnmRevenue: 0, revenue: 0,
    //                 cost: 0, forecastedCost: 0, fringe: 0, overhead: 0, gna: 0, materials: 0,
    //                 // Default dates/text
    //                 createdat: new Date().toISOString(),
    //                 updatedat: new Date().toISOString(),
    //                 displayText: `${duration.monthNo}/1 - ${duration.monthDays}/${duration.monthNo}()`,
    //               };
    //             }
    //             // If not a BUD/NBBUD plan OR if forecast still has no ID after creation attempt, skip.
    //             else if (!forecast || !forecast.forecastid) {
    //               skippedCount++;
    //               continue;
    //             }
    //             // --- END FIX: Handle Missing Forecast for BUD/NBBUD Plans ---

    //             if (displayedValueTrimmed !== newValue) {
    //               updatedInputValues[currentInputKey] = newValue;
    //               replacementsCount++;

    //               // Create payload matching the bulk API structure. The 'forecast' object is now guaranteed to exist and have a valid (or 0) forecastid.
    //               const payload = {
    //                 forecastedamt: forecast?.forecastedamt ?? 0,
    //                 actualamt: forecast?.actualamt ?? 0,
    //                 forecastid: Number(forecast?.forecastid ?? 0),
    //                 projId: forecast?.projId ?? projectId ?? "",
    //                 plId: forecast?.plId ?? planId ?? 0,
    //                 emplId: forecast?.emplId ?? emp?.emple?.emplId ?? "",
    //                 dctId: forecast?.dctId ?? 0,
    //                 month: forecast?.month ?? duration?.monthNo ?? 0,
    //                 year: forecast?.year ?? duration?.year ?? 0,
    //                 totalBurdenCost: forecast?.totalBurdenCost ?? 0,
    //                 fees: forecast?.fees ?? 0,
    //                 burden: forecast?.burden ?? 0,
    //                 ccffRevenue: forecast?.ccffRevenue ?? 0,
    //                 tnmRevenue: forecast?.tnmRevenue ?? 0,
    //                 revenue: forecast?.revenue ?? 0,
    //                 cost: forecast?.cost ?? 0,
    //                 forecastedCost: forecast?.forecastedCost ?? 0,
    //                 fringe: forecast?.fringe ?? 0,
    //                 overhead: forecast?.overhead ?? 0,
    //                 gna: forecast?.gna ?? 0,
    //                 materials: forecast?.materials ?? 0,
    //                 // Update hours based on plan type
    //                 ...(planType === "EAC"
    //                   ? {
    //                       actualhours: Number(newNumericValue) || 0,
    //                       forecastedhours: forecast?.forecastedhours ?? 0,
    //                     }
    //                   : {
    //                       forecastedhours: Number(newNumericValue) || 0,
    //                       actualhours: forecast?.actualhours ?? 0,
    //                     }),
    //                 createdat: forecast?.createdat ?? new Date().toISOString(),
    //                 updatedat: new Date().toISOString(),
    //                 displayText: forecast?.displayText ?? "",
    //                 acctId: emp?.emple?.accId ?? "",
    //                 orgId: emp?.emple?.orgId ?? "",
    //                 plc: emp?.emple?.plcGlcCode ?? "",
    //                 empleId: emp?.emple?.id ?? 0,
    //                 hrlyRate: emp?.emple?.perHourRate ?? 0,
    //                 effectDt: new Date().toISOString().split("T")[0],
    //                 emple: emp?.emple
    //                   ? {
    //                       id: emp.emple.id ?? 0,
    //                       emplId: emp.emple.emplId ?? "",
    //                       orgId: emp.emple.orgId ?? "",
    //                       firstName: emp.emple.firstName ?? "",
    //                       lastName: emp.emple.lastName ?? "",
    //                       plcGlcCode: emp.emple.plcGlcCode ?? "",
    //                       perHourRate: emp.emple.perHourRate ?? 0,
    //                       salary: emp.emple.salary ?? 0,
    //                       accId: emp.emple.accId ?? "",
    //                       hireDate:
    //                         emp.emple.hireDate ??
    //                         new Date().toISOString().split("T")[0],
    //                       isRev: emp.emple.isRev ?? false,
    //                       isBrd: emp.emple.isBrd ?? false,
    //                       createdAt:
    //                         emp.emple.createdAt ?? new Date().toISOString(),
    //                       type: emp.emple.type ?? "",
    //                       status: emp.emple.status ?? "",
    //                       plId: planId ?? 0,
    //                       isWarning: emp.emple.isWarning ?? false,
    //                       plForecasts: [],
    //                       organization: emp.emple.organization ?? null,
    //                       plProjectPlan: emp.emple.plProjectPlan ?? null,
    //                     }
    //                   : null,
    //               };

    //               bulkPayload.push(payload);
    //             }
    //           }
    //         }
    //       }

    //       if (bulkPayload.length === 0) {
    //         if (replacementsCount === 0 && skippedCount === 0) {
    //           toast.info("No cells replaced.", { autoClose: 2000 });
    //         }
    //         return;
    //       }

    //       // Update input values for UI consistency
    //       setInputValues(updatedInputValues);

    //       // Use correct bulk API endpoint matching handleSaveAllHours
    //       const apiPlanType = planType === "NBBUD" ? "BUD" : planType;

    //       const response = await axios.put(
    //         `${backendUrl}/Forecast/BulkUpdateForecastHours/${apiPlanType}`,
    //         bulkPayload,
    //         { headers: { "Content-Type": "application/json" } }
    //       );

    //       // Update local state for all successful updates matching handleSaveAllHours pattern
    //       setLocalEmployees((prev) => {
    //         const updated = [...prev];

    //         for (const empIdx in updated) {
    //           const emp = updated[empIdx];
    //           for (const duration of sortedDurations) {
    //             const uniqueKey = `${duration.monthNo}_${duration.year}`;
    //             const currentInputKey = `${empIdx}_${uniqueKey}`;
    //             if (updatedInputValues[currentInputKey] !== undefined) {
    //               if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
    //                 let forecastIndex = emp.emple.plForecasts.findIndex(
    //                   (f) =>
    //                     f.month === duration.monthNo && f.year === duration.year
    //                 );

    //                 const newValue =
    //                   parseFloat(updatedInputValues[currentInputKey]) || 0;

    //                 // If not found, and we are adding a record (for BUD), we need to insert a new forecast entry into the local state array.
    //                 if (forecastIndex === -1 && isBudPlan) {
    //                   const newForecastEntry = {
    //                     // NOTE: We don't get the real forecast ID back instantly, but this ensures the local UI stays consistent and assumes creation worked.
    //                     forecastid: 1, // Use a placeholder ID > 0 to indicate it's now 'saved'
    //                     projId: projectId,
    //                     plId: planId,
    //                     emplId: emp.emple.emplId,
    //                     month: duration.monthNo,
    //                     year: duration.year,
    //                     // Copy relevant details
    //                     acctId: emp.emple.accId,
    //                     orgId: emp.emple.orgId,
    //                     plc: emp.emple.plcGlcCode,
    //                     hrlyRate: emp.emple.perHourRate,
    //
    //                     // Apply the new hours
    //                     ...(planType === "EAC"
    //                       ? { actualhours: newValue, forecastedhours: 0 }
    //                       : { forecastedhours: newValue, actualhours: 0 }),
    //                     // Set other fields to default or null as needed
    //                     totalBurdenCost: 0, fees: 0, burden: 0, ccffRevenue: 0, tnmRevenue: 0, revenue: 0, cost: 0,
    //                   };

    //                   updated[empIdx].emple.plForecasts.push(newForecastEntry);
    //                   // Re-calculate index for the next step
    //                   forecastIndex = updated[empIdx].emple.plForecasts.length - 1;
    //                 }

    //                 if (forecastIndex !== -1) {
    //
    //                   if (planType === "EAC") {
    //                     updated[empIdx].emple.plForecasts[
    //                       forecastIndex
    //                     ].actualhours = newValue;
    //                   } else {
    //                     updated[empIdx].emple.plForecasts[
    //                       forecastIndex
    //                     ].forecastedhours = newValue;
    //                   }
    //                 }
    //               }
    //             }
    //           }
    //         }

    //         return updated;
    //       });

    //       if (replacementsCount > 0) {
    //         toast.success(`Successfully replaced ${replacementsCount} cells.`, {
    //           autoClose: 2000,
    //         });
    //       }

    //       if (skippedCount > 0) {
    //         toast.warning(`${skippedCount} entries could not be processed.`, {
    //           autoClose: 3000,
    //         });
    //       }
    //     } catch (err) {
    //       console.error("Bulk find/replace error:", err);
    //       toast.error(
    //         "Failed to replace values: " +
    //           (err.response?.data?.message || err.message),
    //         {
    //           toastId: "replace-error",
    //           autoClose: 3000,
    //         }
    //       );
    //     } finally {
    //       setIsLoading(false);
    //       setShowFindReplace(false);
    //       setFindValue("");
    //       setReplaceValue("");
    //       setSelectedRowIndex(null);
    //       setSelectedColumnKey(null);
    //       setReplaceScope("all");
    //     }
    //   };

    // ✅ REPLACE ENTIRE handleFindReplace function

    // const handleFindReplace = async () => {
    //   if (!isEditable || !findValue?.trim()) {
    //     toast.warn('Please enter a value to find.', {
    //       toastId: 'find-replace-warning',
    //       autoClose: 3000
    //     });
    //     return;
    //   }

    //   // Ensure something is selected if scope isn't "all"
    //   if (checkedRows.size === 0 && replaceScope === 'checked-rows') {
    //     toast.warn('Please check at least one row.', {
    //       toastId: 'no-rows-selected',
    //       autoClose: 3000
    //     });
    //     return;
    //   }

    //   setIsLoading(true);
    //   let replacementsCount = 0;
    //   let skippedCount = 0;

    //   try {
    //     const bulkPayload = [];
    //     const updatedInputValues = { ...inputValues };

    //     // Determine which rows to process
    //     const targetRows = replaceScope === 'checked-rows'
    //       ? Array.from(checkedRows)
    //       : localEmployees.map((_, i) => i).filter(i => !hiddenRows[i]);

    //     for (const empIdx of targetRows) {
    //       const emp = localEmployees[empIdx];
    //       if (!emp || hiddenRows[empIdx]) continue;

    //       for (const duration of sortedDurations) {
    //         // IMPORTANT: Must match the key format used in your inputValues state (with underscore)
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //         // Column scope check
    //         if (replaceScope === 'column' && uniqueKey !== selectedColumnKey) continue;

    //         // Date editability check
    //         if (!isMonthEditable(duration, closedPeriod, planType)) {
    //           continue;
    //         }

    //         // FIX: Use empIdx (defined in the loop) and the underscore separator
    //         const currentInputKey = `${empIdx}_${uniqueKey}`;

    //         let displayedValue;
    //         const monthHours = getMonthHours(emp);
    //         const forecast = monthHours[uniqueKey];

    //         // Get the current value from state or from the original forecast
    //         if (inputValues[currentInputKey] !== undefined) {
    //           displayedValue = String(inputValues[currentInputKey]);
    //         } else if (forecast?.value !== undefined) {
    //           displayedValue = String(forecast.value);
    //         } else {
    //           displayedValue = '0';
    //         }

    //         const findValueTrimmed = findValue.trim();
    //         const displayedValueTrimmed = displayedValue.trim();

    //         const isZeroLike = (val) => {
    //           if (val === undefined || val === null) return true;
    //           if (typeof val === 'number') return val === 0;
    //           const trimmed = val.trim();
    //           return !trimmed || trimmed === '0' || trimmed === '0.0' || trimmed === '0.00';
    //         };

    //         // Matching Logic
    //         let isMatch = false;
    //         if (isZeroLike(findValueTrimmed)) {
    //           isMatch = isZeroLike(displayedValueTrimmed);
    //         } else {
    //           isMatch = displayedValueTrimmed === findValueTrimmed;
    //         }

    //         if (!isMatch) {
    //           const findNum = parseFloat(findValueTrimmed);
    //           const displayNum = parseFloat(displayedValueTrimmed);
    //           if (!isNaN(findNum) && !isNaN(displayNum)) {
    //             isMatch = findNum === displayNum;
    //           }
    //         }

    //         if (isMatch) {
    //           const newValue = replaceValue?.trim() || '';
    //           const newNumericValue = newValue ? Number(newValue) : 0;

    //           updatedInputValues[currentInputKey] = newValue;
    //           replacementsCount++;

    //           // Build API Payload
    //           const payload = {
    //             forecastedamt: forecast?.forecastedamt ?? 0,
    //             actualamt: forecast?.actualamt ?? 0,
    //             forecastid: Number(forecast?.forecastid ?? 0),
    //             projId: forecast?.projId ?? projectId ?? '',
    //             plId: forecast?.plId ?? planId ?? 0,
    //             emplId: forecast?.emplId ?? emp?.emple?.emplId ?? '',
    //             dctId: forecast?.dctId ?? 0,
    //             month: duration?.monthNo ?? 0,
    //             year: duration?.year ?? 0,
    //             totalBurdenCost: forecast?.totalBurdenCost ?? 0,
    //             fees: forecast?.fees ?? 0,
    //             burden: forecast?.burden ?? 0,
    //             ccffRevenue: forecast?.ccffRevenue ?? 0,
    //             tnmRevenue: forecast?.tnmRevenue ?? 0,
    //             revenue: forecast?.revenue ?? 0,
    //             cost: forecast?.cost ?? 0,
    //             forecastedCost: forecast?.forecastedCost ?? 0,
    //             fringe: forecast?.fringe ?? 0,
    //             overhead: forecast?.overhead ?? 0,
    //             gna: forecast?.gna ?? 0,
    //             materials: forecast?.materials ?? 0,
    //             ...(planType === 'EAC'
    //               ? { actualhours: newNumericValue, forecastedhours: forecast?.forecastedhours ?? 0 }
    //               : { forecastedhours: newNumericValue, actualhours: forecast?.actualhours ?? 0 }
    //             ),
    //             createdat: forecast?.createdat ?? new Date().toISOString(),
    //             updatedat: new Date().toISOString(),
    //             displayText: forecast?.displayText ?? '',
    //             acctId: emp?.emple?.accId ?? '',
    //             orgId: emp?.emple?.orgId ?? '',
    //             plc: emp?.emple?.plcGlcCode ?? '',
    //             empleId: emp?.emple?.id ?? 0,
    //             hrlyRate: emp?.emple?.perHourRate ?? 0,
    //             effectDt: new Date().toISOString().split('T')[0],
    //             emple: emp?.emple ? {
    //               id: emp.emple.id ?? 0,
    //               emplId: emp.emple.emplId ?? '',
    //               orgId: emp.emple.orgId ?? '',
    //               firstName: emp.emple.firstName ?? '',
    //               lastName: emp.emple.lastName ?? '',
    //               plcGlcCode: emp.emple.plcGlcCode ?? '',
    //               perHourRate: emp.emple.perHourRate ?? 0,
    //               salary: emp.emple.salary ?? 0,
    //               accId: emp.emple.accId ?? '',
    //               hireDate: emp.emple.hireDate ?? new Date().toISOString().split('T')[0],
    //               isRev: emp.emple.isRev ?? false,
    //               isBrd: emp.emple.isBrd ?? false,
    //               createdAt: emp.emple.createdAt ?? new Date().toISOString(),
    //               type: emp.emple.type ?? '',
    //               status: emp.emple.status ?? '',
    //               plId: planId ?? 0,
    //               isWarning: emp.emple.isWarning ?? false,
    //               plForecasts: [],
    //             } : null,
    //           };
    //           bulkPayload.push(payload);
    //         }
    //       }
    //     }

    //     if (bulkPayload.length > 0) {
    //       const apiPlanType = planType === 'NBBUD' ? 'BUD' : planType;
    //       await axios.put(
    //         `${backendUrl}/Forecast/BulkUpdateForecastHours/${apiPlanType}`,
    //         bulkPayload,
    //         { headers: { 'Content-Type': 'application/json' } }
    //       );
    //       setInputValues(updatedInputValues);
    //       toast.success(`Successfully replaced ${replacementsCount} cells.`, { autoClose: 2000 });
    //     } else {
    //       toast.info('No matching cells found to replace.', { autoClose: 2000 });
    //     }

    //   } catch (err) {
    //     console.error('Bulk find/replace error:', err);
    //     toast.error(`Failed to replace values: ${err.response?.data?.message || err.message}`);
    //   } finally {
    //     setIsLoading(false);
    //     setShowFindReplace(false);
    //     setFindValue('');
    //     setReplaceValue('');
    //     setReplaceScope('all');
    //   }
    // };

    // const handleFindReplace = async () => {
    //   if (!isEditable || !findValue?.trim()) {
    //     toast.warn("Please enter a find value.");
    //     return;
    //   }

    //   if (replaceScope === "column" && !selectedColumnKey) {
    //     toast.warn("Please select a column by clicking its header first.");
    //     return;
    //   }

    //   setIsLoading(true);
    //   let replacementsCount = 0;

    //   try {
    //     const bulkPayload = [];
    //     const updatedInputValues = { ...inputValues };

    //     // Determine target rows based on scope
    //     const targetRows =
    //       replaceScope === "checked-rows"
    //         ? Array.from(checkedRows)
    //         : localEmployees.map((_, i) => i);

    //     for (const empIdx of targetRows) {
    //       const emp = localEmployees[empIdx];
    //       if (!emp || hiddenRows[empIdx]) continue;

    //       for (const duration of sortedDurations) {
    //         const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //         // Scope Check: If column scope is selected, only process that one column
    //         if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
    //           continue;
    //         if (!isMonthEditable(duration, closedPeriod, planType)) continue;

    //         const currentInputKey = `${empIdx}_${uniqueKey}`;
    //         let displayedValue =
    //           inputValues[currentInputKey] !== undefined
    //             ? String(inputValues[currentInputKey])
    //             : String(getMonthHours(emp)[uniqueKey]?.value || "0");

    //         // Numeric and string matching
    //         const match =
    //           displayedValue.trim() === findValue.trim() ||
    //           (parseFloat(displayedValue) === parseFloat(findValue) &&
    //             !isNaN(parseFloat(findValue)));

    //         if (match) {
    //           const newValue = replaceValue?.trim() || "0";
    //           updatedInputValues[currentInputKey] = newValue;
    //           replacementsCount++;

    //           // Build payload for API hit
    //           const forecast = getMonthHours(emp)[uniqueKey];

    //           const rawPlc = emp.emple?.plcGlcCode || "";

    //           const parsedPlc = rawPlc.split("-")[0].trim();

    //           bulkPayload.push({
    //             ...forecast, // spread existing data
    //             forecastid: Number(forecast?.forecastid || 0),
    //             emplId: emp.emple.emplId,
    //             month: duration.monthNo,
    //             year: duration.year,
    //             ProjId: emp.emple?.projId || projectId,
    //             OrgId: emp.emple?.orgId || "",
    //             // Plc: emp.emple?.plcGlcCode || "",
    //             Plc: parsedPlc,
    //             AcctId: emp.emple?.accId || "",
    //             empleId: emp.emple?.id || 0,
    //             plid: emp.emple?.plId || 0,
    //             ...(planType === "EAC"
    //               ? { actualhours: Number(newValue) }
    //               : { forecastedhours: Number(newValue) }),
    //           });
    //         }
    //       }
    //     }

    //     if (bulkPayload.length > 0) {
    //       const apiPlanType = planType === "NBBUD" ? "BUD" : planType;
    //       await axios.put(
    //         `${backendUrl}/Forecast/BulkUpdateForecastHoursV1/${apiPlanType}?plid=${planId}&templateid=${templateId}`,
    //         bulkPayload,
    //       );
    //       setInputValues(updatedInputValues);
    //       toast.success(`Replaced ${replacementsCount} matches.`);
    //     }
    //   } catch (err) {
    //     toast.error("API Error: " + err.message);
    //   } finally {
    //     setIsLoading(false);
    //     setShowFindReplace(false);
    //   }
    // };
    const handleFindReplace = async () => {
  if (!isEditable || !findValue?.trim()) {
    toast.warn("Please enter a find value.");
    return;
  }
 
  if (replaceScope === "column" && !selectedColumnKey) {
    toast.warn("Please select a column by clicking its header first.");
    return;
  }
 
  setIsLoading(true);
  let replacementsCount = 0;
 
  try {
    const updatedInputValues = { ...inputValues };
   
   
    const newModifiedHours = { ...modifiedHours };
 
   
    const targetRows =
      replaceScope === "checked-rows"
        ? Array.from(checkedRows)
        : localEmployees.map((_, i) => i);
 
    for (const empIdx of targetRows) {
      const emp = localEmployees[empIdx];
      if (!emp || hiddenRows[empIdx]) continue;
 
      for (const duration of sortedDurations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
 
       
        if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
          continue;
        if (!isMonthEditable(duration, closedPeriod, planType)) continue;
 
        const currentInputKey = `${empIdx}_${uniqueKey}`;
        let displayedValue =
          inputValues[currentInputKey] !== undefined
            ? String(inputValues[currentInputKey])
            : String(getMonthHours(emp)[uniqueKey]?.value || "0");
 
       
        const match =
          displayedValue.trim() === findValue.trim() ||
          (parseFloat(displayedValue) === parseFloat(findValue) &&
            !isNaN(parseFloat(findValue)));
 
        if (match) {
          const newValue = replaceValue?.trim() || "0";
         
         
          updatedInputValues[currentInputKey] = newValue;
          replacementsCount++;
 
         
          newModifiedHours[currentInputKey] = {
            empIdx,
            uniqueKey: uniqueKey,
            newValue: newValue,
            employee: emp,
          };
        }
      }
    }
 
    if (replacementsCount > 0) {
     
      setInputValues(updatedInputValues);
      setModifiedHours(newModifiedHours);
      setHasUnsavedHoursChanges(true);
 
      setFindValue("");
      setReplaceValue("");
     
      toast.success(`Replaced ${replacementsCount} matches.`);
    } else {
      toast.info("No matches found.");
    }
  } catch (err) {
    toast.error("Error during replacement: " + err.message);
  } finally {
    setIsLoading(false);
    setShowFindReplace(false);
  }
};
    // ✅ ADD NEW FUNCTION for Replace All
    const handleFindReplaceWithReplace = async () => {
      if (!findValue.trim() || !replaceValue.trim()) {
        toast.warn("Please enter both find and replace values.", {
          autoClose: 2000,
        });
        return;
      }

      setIsLoading(true);
      let replacementsCount = 0;
      let skippedCount = 0;

      try {
        const bulkPayload = [];
        const updatedInputValues = { ...inputValues };

        const targetRows =
          replaceScope.includes("checked-rows") && checkedRows.size > 0
            ? Array.from(checkedRows)
            : localEmployees.map((_, i) => i);

        const targetColumns =
          replaceScope.includes("checked-columns") && checkedColumns.size > 0
            ? Array.from(checkedColumns)
            : sortedDurations.map((d) => `${d.monthNo}${d.year}`);

        for (const empIdx of targetRows) {
          const emp = localEmployees[empIdx];
          if (!emp || hiddenRows[empIdx]) continue;

          for (const duration of sortedDurations) {
            const uniqueKey = `${duration.monthNo}${duration.year}`;

            if (!targetColumns.includes(uniqueKey)) continue;
            if (!isMonthEditable(duration, closedPeriod, planType)) continue;

            const currentInputKey = `${empIdx}${uniqueKey}`;
            let displayedValue =
              inputValues[currentInputKey] !== undefined
                ? String(inputValues[currentInputKey])
                : getMonthHours(emp)[uniqueKey]?.value || "0";

            const findValueTrimmed = findValue.trim();
            const displayedValueTrimmed = displayedValue.trim();

            // Same matching logic as find
            const isZeroLike = (val) => {
              if (val === undefined || val === null) return true;
              if (typeof val === "number") return val === 0;
              const trimmed = val.trim();
              return (
                !trimmed ||
                trimmed === "0" ||
                trimmed === "0.0" ||
                trimmed === "0.00"
              );
            };

            let isMatch = false;
            if (isZeroLike(findValueTrimmed)) {
              isMatch = isZeroLike(displayedValueTrimmed);
            } else {
              isMatch = displayedValueTrimmed === findValueTrimmed;
            }

            if (!isMatch) {
              const findNum = parseFloat(findValueTrimmed);
              const displayNum = parseFloat(displayedValueTrimmed);
              if (!isNaN(findNum) && !isNaN(displayNum)) {
                isMatch = findNum === displayNum;
              }
            }

            if (isMatch) {
              const newValue = replaceValue.trim();
              updatedInputValues[currentInputKey] = newValue;
              replacementsCount++;

              // Build payload (your existing payload logic)
              const monthHours = getMonthHours(emp);
              const forecast = monthHours[uniqueKey];
              const payload = {
                // ... your existing payload structure exactly same
                forecastedamt: forecast?.forecastedamt ?? 0,
                actualamt: forecast?.actualamt ?? 0,
                // ... rest exactly same
              };
              bulkPayload.push(payload);
            }
          }
        }

        if (bulkPayload.length > 0) {
          const apiPlanType = planType === "NBBUD" ? "BUD" : planType;
          await axios.put(
            `${backendUrl}/Forecast/BulkUpdateForecastHours/${apiPlanType}`,
            bulkPayload,
            {
              headers: { "Content-Type": "application/json" },
            },
          );
          setInputValues(updatedInputValues);
        }

        toast.success(`Successfully replaced ${replacementsCount} cells.`, {
          autoClose: 2000,
        });
      } catch (err) {
        console.error("Bulk find/replace error", err);
        toast.error("Failed to replace values", { autoClose: 3000 });
      } finally {
        setIsLoading(false);
        setShowFindReplace(false);
        setFindValue("");
        setReplaceValue("");
      }
    };

    //  const handleFind = () => {
    //   if (!findValue) {
    //     toast.warn("Please enter a value to find.", { autoClose: 2000 });
    //     return;
    //   }

    //   const matches = [];
    //   const findValueTrimmed = findValue.trim();

    //   // Helper function to check if value is zero-like
    //   function isZeroLike(val) {
    //     if (val === undefined || val === null) return true;
    //     if (typeof val === "number") return val === 0;
    //     if (typeof val === "string") {
    //       const trimmed = val.trim();
    //       return (
    //         !trimmed ||
    //         trimmed === "0" ||
    //         trimmed === "0.0" ||
    //         trimmed === "0.00" ||
    //         (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
    //       );
    //     }
    //     return false;
    //   }

    //   // Search through all employees and their hours
    //   for (const empIdx in localEmployees) {
    //     const emp = localEmployees[empIdx];
    //     const actualEmpIdx = parseInt(empIdx, 10);

    //     // Apply scope filter
    //     if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex) continue;

    //     for (const duration of sortedDurations) {
    //       const uniqueKey = `${duration.monthNo}${duration.year}`;

    //       // Apply scope filter
    //       if (replaceScope === "column" && uniqueKey !== selectedColumnKey) continue;

    //       if (!isMonthEditable(duration, closedPeriod, planType)) continue;

    //       const currentInputKey = `${actualEmpIdx}${uniqueKey}`;
    //       let displayedValue;

    //       if (inputValues[currentInputKey] !== undefined) {
    //         displayedValue = String(inputValues[currentInputKey]);
    //       } else {
    //         const monthHours = getMonthHours(emp);
    //         const forecast = monthHours[uniqueKey];
    //         if (forecast && forecast.value !== undefined) {
    //           displayedValue = String(forecast.value);
    //         } else {
    //           displayedValue = "0";
    //         }
    //       }

    //       const displayedValueTrimmed = displayedValue.trim();

    //       let isMatch = false;

    //       // Check if we're searching for zero/empty
    //       if (!isNaN(Number(findValueTrimmed)) && Number(findValueTrimmed) === 0) {
    //         isMatch = isZeroLike(displayedValueTrimmed);
    //       } else {
    //         // Exact string match
    //         isMatch = displayedValueTrimmed === findValueTrimmed;

    //         // Also try numeric comparison
    //         if (!isMatch) {
    //           const findNum = parseFloat(findValueTrimmed);
    //           const displayNum = parseFloat(displayedValueTrimmed);
    //           if (!isNaN(findNum) && !isNaN(displayNum)) {
    //             isMatch = findNum === displayNum;
    //           }
    //         }
    //       }

    //       if (isMatch) {
    //         matches.push({ empIdx: actualEmpIdx, uniqueKey });
    //       }
    //     }
    //   }

    //   setFindMatches(matches);

    //   if (matches.length === 0) {
    //     toast.info("No matches found.", { autoClose: 2000 });
    //   } else {
    //     // toast.success(`Found ${matches.length} matches highlighted in the table.`, { autoClose: 3000 });
    //     // Close the modal to show the table
    //     setShowFindReplace(false);
    //   }
    // };

    const handleFind = () => {
      if (!findValue) {
        toast.warn("Please enter a value to find.", { autoClose: 2000 });
        return;
      }

      const matches = [];
      const findValueTrimmed = findValue.trim();

      // Helper function to check if value is zero-like
      function isZeroLike(val) {
        if (val === undefined || val === null) return true;
        if (typeof val === "number") return val === 0;
        if (typeof val === "string") {
          const trimmed = val.trim();
          return (
            !trimmed ||
            trimmed === "0" ||
            trimmed === "0.0" ||
            trimmed === "0.00" ||
            (!isNaN(Number(trimmed)) && Number(trimmed) === 0)
          );
        }
        return false;
      }

      // Search through all employees and their hours
      for (const empIdx in localEmployees) {
        const emp = localEmployees[empIdx];
        const actualEmpIdx = parseInt(empIdx, 10);

        // Apply scope filter
        if (replaceScope === "row" && actualEmpIdx !== selectedRowIndex)
          continue;

        for (const duration of sortedDurations) {
          const uniqueKey = `${duration.monthNo}_${duration.year}`; // FIXED: Added underscore

          // Apply scope filter
          if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
            continue;

          if (!isMonthEditable(duration, closedPeriod, planType)) continue;

          const currentInputKey = `${actualEmpIdx}_${uniqueKey}`; // FIXED: Added underscore
          let displayedValue;

          if (inputValues[currentInputKey] !== undefined) {
            displayedValue = String(inputValues[currentInputKey]);
          } else {
            const monthHours = getMonthHours(emp);
            const forecast = monthHours[uniqueKey];
            if (forecast && forecast.value !== undefined) {
              displayedValue = String(forecast.value);
            } else {
              displayedValue = "0";
            }
          }

          const displayedValueTrimmed = displayedValue.trim();

          let isMatch = false;

          // Check if we're searching for zero/empty
          if (
            !isNaN(Number(findValueTrimmed)) &&
            Number(findValueTrimmed) === 0
          ) {
            isMatch = isZeroLike(displayedValueTrimmed);
          } else {
            // Exact string match
            isMatch = displayedValueTrimmed === findValueTrimmed;

            // Also try numeric comparison
            if (!isMatch) {
              const findNum = parseFloat(findValueTrimmed);
              const displayNum = parseFloat(displayedValueTrimmed);
              if (!isNaN(findNum) && !isNaN(displayNum)) {
                isMatch = findNum === displayNum;
              }
            }
          }

          if (isMatch) {
            matches.push({ empIdx: actualEmpIdx, uniqueKey });
          }
        }
      }

      setFindMatches(matches);

      if (matches.length === 0) {
        toast.info("No matches found.", { autoClose: 2000 });
      } else {
        // toast.success(`Found ${matches.length} matches highlighted in the table.`, { autoClose: 3000 });
        // Close the modal to show the table
        setShowFindReplace(false);
      }
    };

    // const handleRowClick = (actualEmpIdx) => {
    //   if (!isEditable) return;
    //   setSelectedRowIndex(
    //     actualEmpIdx === selectedRowIndex ? null : actualEmpIdx
    //   );
    //   setSelectedEmployeeId(localEmployees[actualEmpIdx]?.emple_Id);
    //   setSelectedEmployeeScheduleId(localEmployees[actualEmpIdx]?.emple?.emplId);
    //   setSelectedColumnKey(null);
    //   setReplaceScope(actualEmpIdx === selectedRowIndex ? "all" : "row");
    //   if (showNewForm) setSourceRowIndex(actualEmpIdx);
    // };

    //   const handleRowClick = (actualEmpIdx) => {
    //   // Allow row selection regardless of isEditable for Employee Schedule
    //   const isSameRow = actualEmpIdx === selectedRowIndex;

    //   setSelectedRowIndex(isSameRow ? null : actualEmpIdx);
    //   setSelectedEmployeeId(isSameRow ? null : localEmployees[actualEmpIdx]?.empleId);
    //   setSelectedEmployeeScheduleId(isSameRow ? null : localEmployees[actualEmpIdx]?.emple?.emplId);
    //   setSelectedColumnKey(null);

    //   if (isEditable) {
    //     setReplaceScope(isSameRow ? "all" : "row");
    //   }

    //   if (showNewForm && !isSameRow) {
    //     setSourceRowIndex(actualEmpIdx);
    //   }
    // };

    // ✅ ADD THESE 3 FUNCTIONS

    // const handleRowClick = (actualEmpIdx) => {
    //   // Allow row selection regardless of isEditable for Employee Schedule
    //   const isSameRow = actualEmpIdx === selectedRowIndex;

    //   const employee = localEmployees[actualEmpIdx];
    //   const emplId = employee?.emple?.emplId;

    //   console.log("Row clicked:", { actualEmpIdx, isSameRow, employee, emplId }); // Debug log

    //   setSelectedRowIndex(isSameRow ? null : actualEmpIdx);
    //   setSelectedEmployeeId(isSameRow ? null : employee?.empleId);
    //   setSelectedEmployeeScheduleId(isSameRow ? null : emplId);
    //   setSelectedColumnKey(null);

    //   if (isEditable) {
    //     setReplaceScope(isSameRow ? "all" : "row");
    //   }

    //   if (showNewForm && !isSameRow) {
    //     setSourceRowIndex(actualEmpIdx);
    //   }
    // };

    const handleRowClick = (actualEmpIdx) => {
      // DISABLED: Row clicks no longer select rows
      // Only checkboxes work now
      console.log("Row click disabled - use checkboxes only");
    };

    // ✅ ADD THESE 2 FUNCTIONS
    const handleCheckboxSelection = (rowIndex, isChecked) => {
      setCheckedRows((prev) => {
        const newSelection = new Set(prev);
        if (isChecked) newSelection.add(rowIndex);
        else newSelection.delete(rowIndex);
        setShowCopyButton(newSelection.size > 0);
        return newSelection;
      });
    };

    const handleSelectAllCheckboxes = (isChecked) => {
      if (isChecked) {
        const allRowIndices = new Set();
        localEmployees.forEach((_, index) => {
          if (!hiddenRows[index]) allRowIndices.add(index);
        });
        setCheckedRows(allRowIndices);
        setShowCopyButton(true);
      } else {
        setCheckedRows(new Set());
        setShowCopyButton(false);
      }
    };

    const handleDeleteEmployee = async (emple_Id) => {
      if (!emple_Id) return;

      try {
        await axios.delete(`${backendUrl}/Employee/DeleteEmployee/${emple_Id}`);

        toast.success("Record Deleted Successfully!");

        // Remove deleted employee from local state
        setLocalEmployees((prev) =>
          prev.filter((emp) => emp.emple_Id !== emple_Id),
        );
      } catch (err) {
        toast.error(
          "Failed to delete record: " +
            (err.response?.data?.message || err.message),
        );
      }
    };

    const handleColumnHeaderClick = (uniqueKey) => {
      if (!isEditable) return;
      setSelectedColumnKey(uniqueKey === selectedColumnKey ? null : uniqueKey);
      setSelectedRowIndex(null);
      setReplaceScope(uniqueKey === selectedColumnKey ? "all" : "column");
    };

    const hasHiddenRows = Object.values(hiddenRows).some(Boolean);
    const showHiddenRows = () => setHiddenRows({});

    // const sortedDurations = [...durations]
    //   .filter((d) => fiscalYear === "All" || d.year === parseInt(fiscalYear))
    //   .sort(
    //     (a, b) =>
    //       new Date(a.year, a.monthNo - 1, 1) - new Date(b.year, b.monthNo - 1, 1)
    //   );

    const handleWarningClick = (e, emplId) => {
      e.stopPropagation(); // Prevent row click event
      setSelectedEmployeeIdForWarning(emplId);
      setShowWarningPopup(true);
    };

    const checkHoursExceedLimit = (empIdx, uniqueKey, hours) => {
      const duration = sortedDurations.find(
        (d) => `${d.monthNo}_${d.year}` === uniqueKey,
      );
      if (!duration || !duration.workingHours) return false;

      const numericHours = parseFloat(hours) || 0;
      // CHANGE: Use just available hours for WARNING COLUMN
      const availableHours = duration.workingHours;
      return numericHours > availableHours;
    };

    const generateWarningKey = (emplId, plcCode, uniqueKey) => {
      return `${emplId}_${plcCode || "NOPLC"}_${uniqueKey}`;
    };

    const generateFieldWarningKey = (emplId, field, value) => {
      return `${emplId}_${field}_${value || "empty"}`;
    };

    const checkAccountInvalid = (value, updateOptions) => {
      if (planType === "NBBUD") return false;
      if (!value || value.trim() === "") return true;
      return !updateOptions.some((opt) => opt.id === value.trim());
    };

    const checkOrgInvalid = (value, updateOptions) => {
      if (planType === "NBBUD") return false;
      if (!value || value.trim() === "") return true;
      const trimmed = value.toString().trim();
      if (!/^[\d.]+$/.test(trimmed)) return true;
      return !updateOptions.some((opt) => opt.value.toString() === trimmed);
    };

    if (isLoading || isDurationLoading || isDurationhrLoading) {
      return (
        <div className="p-4 font-inter flex justify-center items-center min-h-[450px]">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-600">
            Loading forecast data...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 font-inter">
          <div className="bg-red-100 border border-red-400 text-red-600 px-4 py-3 rounded">
            <strong className="font-bold text-xs">Error: </strong>
            <span className="block sm:inline text-xs">{error}</span>
          </div>
        </div>
      );
    }

    const rowCount = Math.max(
      localEmployees.filter((_, idx) => !hiddenRows[idx]).length +
        (showNewForm ? 1 : 0),
      2,
    );

    // const firstEmplId = localEmployees.length > 0 && localEmployees[0]?.emple?.emplId
    // ? localEmployees[0].emple.emplId
    // : null;

    //   if (showEmployeeSchedule) {
    //   return (
    //     <div className="p-4 font-inter">
    //       {/* Back button */}
    //       <div className="mb-4">
    //         <button
    //           onClick={() => setShowEmployeeSchedule(false)}
    //           className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium cursor-pointer"
    //         >
    //            Back to Hours
    //         </button>
    //       </div>

    //       {/* Employee Schedule Component */}
    //       <EmployeeSchedule
    //         planId={planId}
    //         projectId={projectId}
    //         status={status}
    //         planType={planType}
    //         startDate={startDate}
    //         endDate={endDate}
    //         fiscalYear={fiscalYear}
    //         emplId={firstEmplId}
    //       />
    //     </div>
    //   );
    // }

    // if (showEmployeeSchedule) {
    //   return (
    //     <div className="p-4 font-inter">
    //       {/* Back button */}
    //       <div className="mb-4">
    //         <button
    //           onClick={() => setShowEmployeeSchedule(false)}
    //           className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium cursor-pointer"
    //         >
    //           Back to Hours
    //         </button>
    //       </div>

    //       {/* Employee Schedule Component */}
    //       <EmployeeSchedule
    //         planId={planId}
    //         projectId={projectId}
    //         status={status}
    //         planType={planType}
    //         startDate={startDate}
    //         endDate={endDate}
    //         fiscalYear={fiscalYear}
    //         emplId={selectedEmployeeId}
    //       />
    //     </div>
    //   );
    // }

    if (showEmployeeSchedule) {
      return (
        <div className="p-2 font-inter">
          {/* Back button */}
          <div className="mb-1">
            <button
              onClick={() => setShowEmployeeSchedule(false)}
              // className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium cursor-pointer"
              className={`btn1 btn-blue`}
            >
              Back to Hours
            </button>
          </div>

          {/* Employee Schedule Component */}
          <EmployeeSchedule
            planId={planId}
            projectId={projectId}
            status={status}
            planType={planType}
            startDate={startDate}
            endDate={endDate}
            fiscalYear={fiscalYear}
            emplId={selectedEmployeeScheduleId}
            // selectedPlan={selectedPlan}
          />
        </div>
      );
    }

    return (
      <div className="relative p-2 font-inter w-full synchronized-tables-outer">
        {showSuccessMessage && (
          <div
            className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
              successMessageText.includes("successfully") ||
              successMessageText.includes("Replaced")
                ? "bg-green-500"
                : "bg-red-500"
            } text-white text-xs`}
          >
            {successMessageText}
          </div>
        )}
        {/* <div className="pt-1 text-white rounded-t-sm">
        <span className="font-semibold bg-black px-1 rounded-t-sm text-md sm:text-sm">
          Labor
        </span>
      </div> */}
        {/* <div className="flex items-center gap-3">
    <div className="bg-[#1e293b] p-1 rounded-lg shadow-md flex items-center justify-center">
     
      <UsersIcon className="w-2 h-2 text-white" />
    </div>
    <div>
      <h2 className="text-sm text-[#1e293b]  tracking-widest leading-none">
        Labor 
      </h2>
    </div>
  </div> */}
        <div className="flex justify-center w-full">
          <div className="inline-flex items-center bg-[#17414D] px-2 py-1 rounded-md shadow-md">
            <h2 className="text-sm font-semibold text-white leading-none flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-white" />
              <span>Labor </span>
            </h2>
          </div>
        </div>
        {/* // <div className="pt-2">
        //   <span className="bg-[#1e293b] text-white px-3 py-1 rounded-t-md text-xs font-bold uppercase tracking-wider shadow-sm">
        //     Labor
        //   </span>
        // </div> */}

        <div className="w-full flex justify-between mb-1 gap-2">
          <div className="flex items-center mt-1">
            <input
              type="text"
              placeholder="Search ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-l   outline-none w-40 border-r-0"
              // Optional: Allow pressing "Enter" to search
              onKeyDown={(e) => e.key === "Enter" && fetchEmployees(true)}
            />
            <button
              onClick={() => fetchEmployees(true)} // Calls the API with current searchTerm
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
            </button>
          </div>

          <div className="flex-grow"></div>

          {/* <div className="flex-grow"></div> */}
          <div className="flex gap-2 items-center">
            {hasHiddenRows && (
              <button
                // className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                className={`btn1 btn-blue`}
                style={{
                  ...geistSansStyle,
                  backgroundColor: "#113d46",
                }}
                onClick={showHiddenRows}
              >
                Show Hidden Rows
              </button>
            )}

            {/* Add this where you want the copy button to appear */}
            {showCopyButton && (
              <button
                onClick={handleCopySelectedRows}
                // className="blue-btn-common text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                className={`btn1 btn-blue`}
                //previous button style
                // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                // style={{
                //   ...geistSansStyle,
                //   backgroundColor: "#113d46",
                // }}
                title="Copy selected rows to clipboard"
              >
                {/* <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg> */}
                Copy Selected ({checkedRows.size})
              </button>
            )}

            {/* {status === "In Progress" &&
            (hasUnsavedHoursChanges || hasUnsavedEmployeeChanges) && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAll}
                  disabled={isLoading}
                 
                   className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
            style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes (
                      {Object.keys(modifiedHours).length +
                        Object.keys(editedEmployeeData).length}
                      )
                    </>
                  )}
                </button>

               
              </div>
            )} */}

            {/* Check for In Progress status first */}

            {isEditable && (
              <>
                {isEditable && (
                  <div className="flex gap-2">
                    {/* New Entry Button: Adds one blank entry to the array every time it is clicked */}
                    <button
                      onClick={() => {
                        // 1. Define the blank new entry object
                        const defaultEntry = {
                          id: "",
                          firstName: "",
                          lastName: "",
                          isRev: false,
                          isBrd: false,
                          idType: "",
                          acctId:
                            laborAccounts.length > 0 ? laborAccounts[0].id : "",
                          // acctName: " ",
                          acctName: (() => {
                            if (laborAccounts.length === 0) return "";
                            const defaultAccount = laborAccounts[0];
                            // Lookup name from available options
                            const matched =
                              accountOptionsWithNames.find(
                                (acc) => acc.id === defaultAccount.id,
                              ) ||
                              laborAccounts.find(
                                (acc) => acc.id === defaultAccount.id,
                              );
                            return matched
                              ? matched.name ||
                                  matched.acctName ||
                                  matched.label ||
                                  defaultAccount.id
                              : defaultAccount.id;
                          })(),
                          orgId: "",
                          plcGlcCode: "",
                          perHourRate: "",
                          status: "Act",
                          effectiveDate: "",
                          esc_Percent: "",
                        };

                        // 2. Add the new entry and its corresponding period hours object
                        setNewEntries((prev) => [...prev, defaultEntry]);
                        setNewEntryPeriodHoursArray((prev) => [...prev, {}]);

                        // 3. Ensure the form display section is visible
                        setShowNewForm(true);
                      }}
                      // className="px-4 py-2 blue-btn-common text-white rounded text-xs font-medium"
                      className={`btn1 btn-blue`}
                      // className={` rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                      // style={{
                      //   ...geistSansStyle,
                      //   backgroundColor: "#113d46",
                      // }}
                    >
                      New
                    </button>

                    {/* {status === "In Progress" && ( */}
                    {/* <div className="flex gap-2"> */}
                    {/* UNIFIED SAVE BUTTON: Visible if there are New Entries OR Grid Edits */}
                    {/* {(newEntries.length > 0 ||
                      hasUnsavedHoursChanges ||
                      hasUnsavedEmployeeChanges) && (
                      <button
                        onClick={handleMasterSave}
                        className={`btn1 btn-blue`}
                        // className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white"
                        // style={{
                        //   ...geistSansStyle,
                        //   backgroundColor: "#113d46",
                        // }}
                        disabled={isLoading}
                      >
                        {isLoading
                          ? "Saving..."
                          : newEntries.length > 0
                            ? `Save All (${newEntries.length})`
                            : `Save Changes (${Object.keys(modifiedHours).length + Object.keys(editedEmployeeData).length})`}
                      </button>
                    )} */}

                    {/* CONSOLIDATED CANCEL BUTTON WITH LIFO LOGIC */}
                    {(showNewForm ||
                      newEntries.length > 0 ||
                      hasUnsavedHoursChanges ||
                      hasUnsavedEmployeeChanges) && (
                      <button
                        onClick={() => {
                          // 1. LIFO Logic: Remove the latest New Entry form first
                          if (newEntries.length > 0) {
                            const updatedEntries = newEntries.slice(0, -1);
                            const updatedHours = newEntryPeriodHoursArray.slice(
                              0,
                              -1,
                            );
                            setNewEntries(updatedEntries);
                            setNewEntryPeriodHoursArray(updatedHours);
                            // if (updatedEntries.length === 0)
                            //   setShowNewForm(false);
                            if (updatedEntries.length === 0) {
    setShowNewForm(false);
    
    
    const hasGridEdits = Object.keys(modifiedHours).length > 0 || Object.keys(editedEmployeeData).length > 0;
    if (!hasGridEdits) {
      setHasUnsavedHoursChanges(false);
      setHasUnsavedEmployeeChanges(false);
    }
    
  }
                            return;
                          }

                          // 2. Hide single manual form if visible
                          if (showNewForm) {
                            setShowNewForm(false);
                            resetNewEntryForm();
                          }

                          // 3. Revert Grid Edits (Hours & Fields)
                          if (
                            hasUnsavedHoursChanges ||
                            hasUnsavedEmployeeChanges
                          ) {
                            setInputValues({});
                            setModifiedHours({});
                            setHasUnsavedHoursChanges(false);
                            setEditedEmployeeData({});
                            setHasUnsavedEmployeeChanges(false);
                            setFindMatches([]);
                            setHasClipboardData(false);
                            setCopiedRowsData([]);
                            toast.info("Changes reverted", {
                              autoClose: 1500,
                            });
                          }
                        }}
                        className={`btn1 btn-blue`}
                        // className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer transition-colors text-white"
                        // style={{
                        //   ...geistSansStyle,
                        //   backgroundColor: "#113d46",
                        // }}
                      >
                        Cancel
                      </button>
                    )}
                    {/* </div> */}
                    {/* )} */}
                  </div>
                )}

                {hasClipboardData && status === "In Progress" && (
                  <button
                    onClick={() => {
                      handlePasteMultipleRows();
                      setHasClipboardData(false);
                      setCopiedRowsData([]);
                    }}
                    // className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                    className={`btn1 btn-blue`}
                    // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                    // style={{
                    //   ...geistSansStyle,
                    //   backgroundColor: "#113d46",
                    // }}
                  >
                    Paste ({copiedRowsData.length} data)
                  </button>
                )}

                {!showNewForm && (
                  <>
                    <button
                      // className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
                      className={`btn1 btn-blue`}
                      // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                      // style={{
                      //   ...geistSansStyle,
                      //   backgroundColor: "#113d46",
                      // }}
                      onClick={() => isEditable && setShowFindReplace(true)}
                    >
                      Find / Replace
                    </button>
                    {/* <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                    onClick={() => {
                      if (!selectedEmployeeId) {
                        toast.error("Please select an employee to delete");
                        return;
                      }
                      if (
                        window.confirm(
                          "Are you sure you want to delete this employee?"
                        )
                      ) {
                        handleDeleteEmployee(selectedEmployeeId);
                        setSelectedEmployeeId(null); // optional: clear selection
                      }
                      
                    }}
                    
                  >
                    Delete
                  </button> */}
                    {/* <button
                    className={`px-4 py-2 text-white rounded transition text-xs font-medium
    ${
      planType === "EAC"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-600 hover:bg-red-700"
    }`}
                    onClick={() => {
                      if (!selectedEmployeeId) {
                        toast.error("Please select an employee to delete");
                        return;
                      }
                      if (
                        window.confirm(
                          "Are you sure you want to delete this employee?"
                        )
                      ) {
                        handleDeleteEmployee(selectedEmployeeId);
                        setSelectedEmployeeId(null); // optional: clear selection
                      }
                    }}
                    disabled={planType === "EAC"}
                  >
                    Delete
                  </button> */}

                    {/* <button
  className={`px-4 py-2 text-white rounded transition text-xs font-medium cursor-pointer
    ${planType === "EAC" ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
  onClick={async () => {
    // FIX 1: Change selectedRows.size to checkedRows.size
    if (checkedRows.size === 0) {
      toast.error("Please select record(s) to delete");
      return;
    }

    if (window.confirm(`Are you sure you want to delete record?`)) {
      setIsLoading(true);
      try {
        // FIX 2: Iterate through all checked rows and delete them
        const indicesToDelete = Array.from(checkedRows);
        
        for (const index of indicesToDelete) {
          const empToDelete = localEmployees[index];
          if (empToDelete && empToDelete.emple_Id) {
            await axios.delete(`${backendUrl}/Employee/DeleteEmployee/${empToDelete.emple_Id}`);
          }
        }

        toast.success("Selected record(s) deleted successfully!");
        
        // Clear selection and refresh list
        setCheckedRows(new Set());
        setShowCopyButton(false);
        fetchEmployees(); // Refresh the grid
      } catch (err) {
        toast.error("Failed to delete some records.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  }}
  disabled={planType === "EAC"}
>
  Delete
</button> */}

                    <button
                      className={` btn1 ${planType === "EAC" || checkedRows.size === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
                      //                 className={`px-4 py-2 text-white rounded transition text-xs font-medium cursor-pointer
                      // ${planType === "EAC" || checkedRows.size === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
                      disabled={planType === "EAC" || checkedRows.size === 0}
                      onClick={handleDelete}
                    >
                      {checkedRows.size > 1
                        ? `Delete Selected (${checkedRows.size})`
                        : "Delete"}
                    </button>
                  </>
                )}
                {/* {showNewForm && (
                <button
                  // className="px-4 py-2 blue-btn-common text-white rounded  transition text-xs font-medium"
                   className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
            style={{
    ...geistSansStyle,
    backgroundColor:  "#113d46",
  }} 
                  onClick={() => isEditable && setShowFillValues(true)}
                >
                  Fill Values
                </button>
              )} */}

                {showNewForm || checkedRows.size > 0 ? (
                  <button
                    className={`btn1 btn-blue`}
                    // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                    // style={{
                    //   ...geistSansStyle,
                    //   backgroundColor: "#113d46",
                    // }}
                    onClick={() => isEditable && setShowFillValues(true)}
                  >
                    Fill Values
                  </button>
                ) : null}

                {/* <button
  onClick={() => setShowEmployeeSchedule(prev => !prev)}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  {showEmployeeSchedule ? 'Hide Employee Schedule' : 'Employee Schedule'}
</button> */}
                {/* <button
  onClick={() => setShowEmployeeSchedule(true)}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  Employee Schedule
</button> */}
                {/* <button 
  onClick={() => {
    if (!selectedEmployeeId) {
      toast.error("Please select a row first by clicking on it", { autoClose: 2000 });
      return;
    }
    setShowEmployeeSchedule(true);
  }}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  Employee Schedule
</button> */}
              </>
            )}
            {/* <button 
  onClick={() => {
    if (!selectedEmployeeScheduleId) {
      toast.error("Please select a row first by clicking on it", { autoClose: 2000 });
      return;
    }
    setShowEmployeeSchedule(true);
  }}
  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-medium"
>
  Employee Schedule
</button> */}
            {/* <button
            onClick={() => {
              if (!selectedEmployeeScheduleId) {
                toast.error("Please select a row first by clicking on it", {
                  autoClose: 2000,
                });
                return;
              }
              setShowEmployeeSchedule(true);
            }}
            disabled={!selectedEmployeeScheduleId}
            className={`px-4 py-2 rounded text-xs font-medium transition cursor-pointer ${
              selectedEmployeeScheduleId
                ? "blue-btn-common text-white "
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Employee Schedule
          </button> */}

            <button
              onClick={() => {
                if (checkedRows.size === 0) {
                  toast.error("Please check a row first");
                  return;
                }
                const firstIdx = Array.from(checkedRows)[0];
                const emp = localEmployees[firstIdx];
                setSelectedEmployeeScheduleId(emp?.emple?.emplId);
                setShowEmployeeSchedule(true);
              }}
              // className={`px-4 py-2 rounded text-xs font-medium ${checkedRows.size > 0 ? "blue-btn-common text-white" : "bg-gray-300 text-gray-500"}`}

              className={`btn1 btn-blue
    ${
      checkedRows.size > 0
        ? "text-white"
        : "text-gray-500 font-semibold bg-gray-200"
    }`}
              style={{
                // ...geistSansStyle,
                backgroundColor: checkedRows.size === 1 ? "#113d46" : "#e5e7eb",
              }}
            >
              Employee Schedule
            </button>
          </div>
        </div>

        {/* {showFillValues && (
   
                                   <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
                Fill Values to selected record/s
            </h3>
 
           
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                    Select Fill Method
                </label>
                <select
                    value={fillMethod}
                    onChange={(e) => setFillMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                >
                    <option value="None">None</option>
                    <option value="Copy From Source Record">
                        Copy from source record
                    </option>
                    <option value="Specify Hours">Specify Hours</option>
                    <option value="Use Available Hours">Use Available Hours</option>
                    <option value="Use Start Period Hours">
                        Use Start Period Hours
                    </option>
                </select>
            </div>
           
           
            {fillMethod === "Copy From Source Record" && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    New Entries to be filled: {newEntries.length}
                    <br />
                    Source Rows Selected (in grid): {selectedRows.size}
                    {selectedRows.size === 0 && (
                        <p className="text-red-600 font-semibold mt-1">
                            ⚠️ Please select rows in the main grid to copy from.
                        </p>
                    )}
                </div>
            )}
 
           
            {fillMethod === "Specify Hours" && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-xs font-medium mb-1">
                        Hours
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={fillHours}
                        onChange={(e) =>
                            setFillHours(parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Backspace' && (e.target.value === '0' || e.target.value === '')) {
                                e.preventDefault();
                                setFillHours("");
                            }
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-xs"
                        placeholder="0.00"
                    />
                </div>
            )}
           
          
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                    Start Period
                </label>
                <input
                    type="date"
                    value={fillStartDate}
                    onChange={(e) => setFillStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                />
            </div>
           
          
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                    End Period
                </label>
                <input
                    type="date"
                    value={fillEndDate}
                    onChange={(e) => setFillEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                />
            </div>
 
            
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setShowFillValues(false);
                        setFillMethod("None");
                        setFillHours(0.0);
                        setSourceRowIndex(null);
                        // Clear selected rows on close for a clean slate
                        setSelectedRows(new Set());
                        setSelectedColumnKey(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
                >
                    Close
                </button>
                <button
                    type="button"
                    onClick={handleFillValues} // Use the bulk function
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                    disabled={
                        fillMethod === "None" ||
                        (fillMethod === "Copy From Source Record" && selectedRows.size === 0)
                    }
                >
                    Fill
                </button>
            </div>
        </div>
    </div>
    </div>
)} */}

        {/* {showFillValues && (
  <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
        <h3 className="text-lg font-semibold mb-4">
          Fill Values
        </h3>

      
  <div>
     {checkedRows.size > 0 && (
  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
    <p className="font-bold mb-1">Selected Source:</p>
    {Array.from(checkedRows).map(idx => {
      const emp = localEmployees[idx]?.emple;
      return (
        <div key={idx} className="border-b border-blue-100 pb-1 mb-1 last:border-0">
          ID: {emp?.emplId} | Acc: {emp?.accId} | Org: {emp?.orgId} | PLC: {emp?.plcGlcCode}
        </div>
      );
    })}
  </div>
)}
  </div>
 


        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-medium mb-1">
            Select Fill Method
          </label>
          <select
            value={fillMethod}
            onChange={(e) => setFillMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs"
          >
            <option value="None">None</option>
            <option value="Copy From Checked Rows">Copy from Source Record</option>
            <option value="Specify Hours">Specify Hours</option>
            <option value="Use Available Hours">Use Available Hours</option>
            <option value="Use Start Period Hours">Use Start Period Hours</option>
          </select>
        </div>

        {fillMethod === "Specify Hours" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-xs font-medium mb-1">
              Hours
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={fillHours}
              onChange={(e) => setFillHours(parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && (e.target.value === '0' || e.target.value === '')) {
                  e.preventDefault();
                  setFillHours("");
                }
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-medium mb-1">
            Start Period
          </label>
          <input
            type="date"
            value={fillStartDate}
            onChange={(e) => setFillStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-medium mb-1">
            End Period
          </label>
          <input
            type="date"
            value={fillEndDate}
            onChange={(e) => setFillEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowFillValues(false);
              setFillMethod("None");
              setFillHours(0.0);
              setSourceRowIndex(null);
              setSelectedColumnKey(null);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
          >
            Close
          </button>
         
          <button
  type="button"
  onClick={() => {
    // Check if user selected "Copy From Checked Rows" but didn't check any rows
    if (fillMethod === "Copy From Checked Rows" && checkedRows.size === 0) {
      toast.error("Source row is not selected. Please check a row in the grid first.", {
        toastId: "source-not-selected"
      });
      return;
    }
    handleFillValues(); // Execute the actual fill logic
  }}
  // Button is enabled if a method is selected AND (it's not the copy method OR rows are checked)
  disabled={fillMethod === "None"}
  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs disabled:bg-gray-400"
>
  Fill Value
</button>
        </div>
      </div>
    </div>
  </div>
)} */}

        {/* {showFillValues && (
  <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Fill Values
        </h3>

        
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800">
          <strong>Targets:</strong> {checkedRows.size > 0 ? `${checkedRows.size} Existing Rows ` : ""} 
          {newEntries.length > 0 ? `${checkedRows.size > 0 ? '& ' : ''}${newEntries.length} New Entries` : ""}
          {checkedRows.size === 0 && newEntries.length === 0 && <span className="text-red-500">No rows selected/added.</span>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-medium mb-1">
            Select Fill Method
          </label>
          <select
            value={fillMethod}
            onChange={(e) => setFillMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="None">None</option>
            <option value="Copy From Checked Rows">Copy from Source Record</option>
            <option value="Specify Hours">Specify Hours</option>
            <option value="Use Available Hours">Use Available Hours</option>
            <option value="Use Start Period Hours">Use Start Period Hours</option>
          </select>
        </div>

       
        {fillMethod === "Copy From Checked Rows" && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1">
            <label className="block text-gray-700 text-xs font-medium mb-1">
              Choose Source Record (ID - Account - Org)
            </label>
            <select
              value={selectedSourceIdx}
              onChange={(e) => setSelectedSourceIdx(e.target.value)}
              className="w-full border border-blue-300 bg-blue-50 rounded-md p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select One --</option>
              {localEmployees.map((emp, idx) => (
                <option key={idx} value={idx}>
                  {emp.emple?.emplId} | {emp.emple?.accId} | {emp.emple?.orgId}
                </option>
              ))}
            </select>
          </div>
        )}

        {fillMethod === "Specify Hours" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-xs font-medium mb-1">
              Hours
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={fillHours}
              onChange={(e) => setFillHours(parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && (e.target.value === '0' || e.target.value === '')) {
                  e.preventDefault();
                  setFillHours("");
                }
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-xs font-medium mb-1">
              Start Period
            </label>
            <input
              type="date"
              value={fillStartDate}
              onChange={(e) => setFillStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs font-medium mb-1">
              End Period
            </label>
            <input
              type="date"
              value={fillEndDate}
              onChange={(e) => setFillEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setShowFillValues(false);
              setFillMethod("None");
              setFillHours(0.0);
              setSelectedSourceIdx("");
              setSelectedColumnKey(null);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs transition-colors"
          >
            Close
          </button>
          
          <button
  type="button"
  onClick={() => {
    // Check if user selected "Copy From Checked Rows" but didn't pick a source from dropdown
    if (fillMethod === "Copy From Checked Rows" && selectedSourceIdx === "") {
      toast.error("Source row is not selected. Please select a source from the dropdown.", {
        toastId: "source-not-selected"
      });
      return;
    }
    handleFillValues(); 
  }}
  // ENABLE logic: must have a method AND (at least one checked row OR at least one new entry)
  disabled={
    fillMethod === "None" || 
    (checkedRows.size === 0 && newEntries.length === 0)
  }
  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs disabled:bg-gray-400"
>
  Fill Value
</button>
        </div>
      </div>
    </div>
  </div>
)} */}

        {/* {showFillValues && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/20">
            <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-lg shadow-xl border animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-white p-6 text-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Fill Values
                </h3>

               
                <div>
                  {checkedRows.size > 0 && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
                      <p className="font-bold mb-1">Selected Source:</p>
                      {Array.from(checkedRows).map((idx) => {
                        const emp = localEmployees[idx]?.emple;
                        return (
                          <div
                            key={idx}
                            className="border-b border-blue-100 pb-1 mb-1 last:border-0"
                          >
                            ID: {emp?.emplId} | Acc: {emp?.accId} | Org:{" "}
                            {emp?.orgId} | PLC: {emp?.plcGlcCode}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    Select Fill Method
                  </label>
                  <select
                    value={fillMethod}
                    onChange={(e) => setFillMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="None">None</option>
                    <option value="Copy From Checked Rows">
                      Copy from Source Record
                    </option>
                    <option value="Specify Hours">Specify Hours</option>
                    <option value="Use Available Hours">
                      Use Available Hours
                    </option>
                    <option value="Use Start Period Hours">
                      Use Start Period Hours
                    </option>
                  </select>
                </div>

                
                {fillMethod === "Copy From Checked Rows" &&
                  newEntries.length === 0 && (
                    <div className="mb-4 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                        Select Record to Fill (ID | Account | Org)
                      </label>
                      <select
                        value={selectedSourceIdx}
                        onChange={(e) => setSelectedSourceIdx(e.target.value)}
                        className="w-full border border-blue-300 bg-blue-50 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Select One --</option>
                        {localEmployees.map((emp, idx) => (
                          <option key={idx} value={idx}>
                            ID: {emp.emple?.emplId} | Acc: {emp.emple?.accId} |
                            Org: {emp.emple?.orgId}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                {fillMethod === "Specify Hours" && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                      Hours
                    </label>
                    
                   
                    <input
                      type="text"
                      inputMode="decimal"
                      value={fillHours}
                      onChange={(e) => {
                        // Simply remove any character that isn't a number or a dot.
                        // We do NOT use parseFloat here, so users can type "0." freely.
                        const cleanValue = e.target.value.replace(
                          /[^0-9.]/g,
                          "",
                        );
                        setFillHours(cleanValue);
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 text-xs placeholder='0.00'"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                      Start Period
                    </label>
                    <input
                      type="date"
                      value={fillStartDate}
                      min={startDate}
                      max={endDate}
                      onChange={(e) => setFillStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                      End Period
                    </label>
                    <input
                      type="date"
                      value={fillEndDate}
                      min={startDate}
                      max={endDate}
                      onChange={(e) => setFillEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFillValues(false);
                      setFillMethod("None");
                      setSelectedSourceIdx("");
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
                  >
                    Close
                  </button>
                 
                  <button
                    type="button"
                    onClick={() => {
                      // ONLY require dropdown selection if newEntries is empty
                      if (
                        newEntries.length === 0 &&
                        fillMethod === "Copy From Checked Rows" &&
                        selectedSourceIdx === ""
                      ) {
                        toast.error(
                          "Please select a record from the dropdown.",
                        );
                        return;
                      }
                      handleFillValues();
                    }}
                    // Enable if a method is selected AND (there is a new entry OR existing rows are checked)
                    disabled={
                      fillMethod === "None" ||
                      (newEntries.length === 0 && checkedRows.size === 0)
                    }
                    className="px-4 py-2 bg-[#113d46] text-white rounded-md hover:bg-[#0d2e35] text-xs font-medium"
                  >
                    Fill Value
                  </button>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {showFillValues && (
  <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/20">
    <div 
  style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)`, transition: 'none' }}
  onMouseDown={(e) => handleDrag(e, setModalPos, modalPos)} className="w-full max-w-md bg-white rounded-t-xl sm:rounded-lg shadow-xl border animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white p-6 text-sm">
       
        {/* <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Fill Values
        </h3> */}
        <h3 className="text-lg font-semibold mb-6 text-gray-800 select-none">
          Fill Values
        </h3>

        {/* TOP BOX: Displays the Target Records (Checked Rows) */}
        <div className="pointer-events-auto">
          {checkedRows.size > 0 && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
              <p className="font-bold mb-1 text-blue-800">Records to Fill:</p>
              {Array.from(checkedRows).map((idx) => {
                const emp = localEmployees[idx]?.emple;
                return (
                  <div
                    key={idx}
                    className="border-b border-blue-100 pb-1 mb-1 last:border-0"
                  >
                    ID: {emp?.emplId} | Acc: {emp?.accId} | Org: {emp?.orgId} | PLC: {emp?.plcGlcCode}
                  </div>
                );
              })}
              {/* <p className="text-[10px] text-blue-600 mt-1 italic">
                These selected rows will be updated using the source below.
              </p> */}
            </div>
          )}
        </div>

        <div className="mb-4 pointer-events-auto">
          <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
            Select Fill Method
          </label>
          <select
            value={fillMethod}
            onChange={(e) => setFillMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="None">None</option>
            <option value="Copy From Checked Rows">
              Copy from Source Record
            </option>
            <option value="Specify Hours">Specify Hours</option>
            <option value="Use Available Hours">
              Use Available Hours
            </option>
            <option value="Use Start Period Hours">
              Use Start Period Hours
            </option>
          </select>
        </div>

        {/* DROPDOWN: Now functions as the Source Selection */}
        {fillMethod === "Copy From Checked Rows"  && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              Select Source Record (Copy From)
            </label>
            <select
              value={selectedSourceIdx}
              onChange={(e) => setSelectedSourceIdx(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select Source Record --</option>
              {localEmployees.map((emp, idx) => (
                <option key={idx} value={idx}>
                  ID: {emp.emple?.emplId} | Acc: {emp.emple?.accId} | Org: {emp.emple?.orgId}
                </option>
              ))}
            </select>
            {/* <p className="text-[10px] text-gray-500 mt-1 italic">
              Data from this record will be copied into the targets shown above.
            </p> */}
          </div>
        )}

        {fillMethod === "Specify Hours" && (
          <div className="mb-4">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              Hours
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={fillHours}
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/[^0-9.]/g, "");
                setFillHours(cleanValue);
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              Start Period
            </label>
            <input
              type="date"
              value={fillStartDate}
              min={startDate}
              max={endDate}
              onChange={(e) => setFillStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              End Period
            </label>
            <input
              type="date"
              value={fillEndDate}
              min={startDate}
              max={endDate}
              onChange={(e) => setFillEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setShowFillValues(false);
              setFillMethod("None");
              setSelectedSourceIdx("");
              setModalPos({ x: 0, y: 0 });
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                newEntries.length === 0 &&
                fillMethod === "Copy From Checked Rows" &&
                selectedSourceIdx === ""
              ) {
                toast.error("Please select a source record from the dropdown.");
                return;
              }
              handleFillValues();
            }}
            disabled={
              fillMethod === "None" ||
              (newEntries.length === 0 && checkedRows.size === 0)
            }
            className="px-4 py-2 bg-[#113d46] text-white rounded-md hover:bg-[#0d2e35] text-xs font-medium disabled:opacity-50 transition-all shadow-sm"
          >
            Fill Value
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {/* {showFillValues && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
                Fill Values to selected record/s
            </h3>

            
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                    Select Fill Method
                </label>
                <select
                    value={fillMethod}
                    onChange={(e) => setFillMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                >
                    <option value="None">None</option>
                    <option value="Copy From Source Record">
                        Copy from source record
                    </option>
                    <option value="Specify Hours">Specify Hours</option>
                    <option value="Use Available Hours">Use Available Hours</option>
                    <option value="Use Start Period Hours">
                        Use Start Period Hours
                    </option>
                </select>
            </div>
            
           
            {fillMethod === "Copy From Source Record" && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    New Entries to be filled: {newEntries.length}
                    <br />
                    Source Rows Selected (in grid): {selectedRows.size}
                    {selectedRows.size === 0 && (
                        <p className="text-red-600 font-semibold mt-1">
                            ⚠️ Please select rows in the main grid to copy from.
                        </p>
                    )}
                </div>
            )}

           
            {fillMethod === "Specify Hours" && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-xs font-medium mb-1">
                        Hours
                    </label>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={fillHours}
                        onChange={(e) =>
                            setFillHours(parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Backspace' && (e.target.value === '0' || e.target.value === '')) {
                                e.preventDefault();
                                setFillHours("");
                            }
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-xs"
                        placeholder="0.00"
                    />
                </div>
            )}
            
           
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                    Start Period
                </label>
                <input
                    type="date"
                    value={fillStartDate}
                    onChange={(e) => setFillStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                />
            </div>
            
           
            <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                    End Period
                </label>
                <input
                    type="date"
                    value={fillEndDate}
                    onChange={(e) => setFillEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                />
            </div>


            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setShowFillValues(false);
                        setFillMethod("None");
                        setFillHours(0.0);
                        setSourceRowIndex(null);
                        // Clear selected rows on close for a clean slate
                        setSelectedRows(new Set()); 
                        setSelectedColumnKey(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
                >
                    Close
                </button>
                <button
                    type="button"
                    onClick={handleFillValues} // Use the bulk function
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                    disabled={
                        fillMethod === "None" ||
                        (fillMethod === "Copy From Source Record" && selectedRows.size === 0)
                    }
                >
                    Fill
                </button>
            </div>
        </div>
    </div>
)} */}

        {localEmployees.length === 0 &&
        !showNewForm &&
        sortedDurations.length > 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs">
            No data available.
          </div>
        ) : (
          <div className="border-line">
            <div className="synchronized-tables-container flex w-full items-start">
              <div
                ref={firstTableRef}
                onScroll={handleFirstScroll}
                className="flex-1 middle-scrollbar"
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  overflowX: "scroll",
                }}
              >
                <table className="table-fixed table min-w-full ">
                  <thead className="thead h-[56px] z-10">
                    <tr
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                      className="bg-black"
                    >
                      <th className="th-thead w-6">
                        <input
                          type="checkbox"
                          checked={
                            checkedRows.size ===
                            localEmployees.filter((_, i) => !hiddenRows[i])
                              .length
                          }
                          onChange={(e) =>
                            handleSelectAllCheckboxes(e.target.checked)
                          }
                          className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                        />
                      </th>
                      {visibleEmployeeColumns.map((col) => (
                        <th
                          key={col.key}
                          className={`th-thead min-w-[70px] ${col.key === "name" ? "text-left pl-2" : "text-center"}`}
                          onClick={
                            col.key === "acctId"
                              ? () => handleSort("acctId")
                              : undefined
                          }
                          style={{
                            cursor:
                              col.key === "acctId" ? "pointer" : "default",
                            // textAlign: col.key === "name" ? "left" : "",
                          }}
                        >
                          {col.label}
                          {col.key === "acctId" && (
                            <span className="text-[15px] text-gray-500">
                              {getSortIcon("acctId")}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {newEntries.length > 0 &&
                      newEntries.map((entry, entryIndex) => (
                        <React.Fragment key={`new-entry-months-${entryIndex}`}>
                          <tr
                            key={`new-entry-${entryIndex}`}
                            // className="bg-gray-50"
                            // style={{
                            //   height: `${ROW_HEIGHT_DEFAULT}px`,
                            //   lineHeight: "normal",
                            // }}
                            // style={{
                            //   height: "36px",
                            //   maxHeight: "36px",
                            //   lineHeight: "36px",
                            //   cursor: isEditable ? "pointer" : "default",
                            // }}
                            style={{
                              height: `${ROW_HEIGHT_DEFAULT}px`,
                              lineHeight: "normal",
                            }}
                          >
                            <td className="tbody-td w-6">
                              <input
                                type="checkbox"
                                disabled
                                className="w-3 h-3 opacity-50 cursor-not-allowed"
                              />
                            </td>

                            <td className="tbody-td min-w-[70px]">
                              <select
                                name="idType"
                                value={entry.idType}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // const newId = value === "PLC" ? "PLC" : "";
                                  const newId =
                                    value === "PLC"
                                      ? "PLC"
                                      : value === "Other"
                                        ? "TBD"
                                        : "";
                                  const org_id =
                                    value === "Other" || value === "PLC"
                                      ? allData.orgId
                                      : "";
                                  const org_Name =
                                    value === "Other" || value === "PLC"
                                      ? allData.orgName
                                      : "";
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? {
                                            ...ent,
                                            id: newId,
                                            firstName: "",
                                            lastName: "",
                                            isRev: false,
                                            isBrd: false,
                                            idType: value,
                                            acctId:
                                              laborAccounts.length > 0
                                                ? laborAccounts[0].id
                                                : "",
                                            orgId: org_id,
                                            plcGlcCode: "",
                                            plcGlcDes: "",
                                            perHourRate: "",
                                            status: "Act",
                                            orgName: org_Name,
                                            acctName: "",
                                            effectiveDate: "",
                                            esc_Percent: 0
                                          }
                                        : ent,
                                    ),
                                  );
                                  setPlcSearch("");
                                  setAutoPopulatedPLC(false);
                                  const updatedEntryForFetch = {
                                    ...entry,
                                    idType: value,
                                  };
                                  fetchSuggestionsForPastedEntry(
                                    entryIndex,
                                    updatedEntryForFetch,
                                  );
                                }}
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                              >
                                {ID_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* ID Column */}
                            <td className="tbody-td min-w-[100px]">
                              <input
                                type="text"
                                name="id"
                                value={entry.id}
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  // If the user clears the input, just update the ID to empty
                                  if (!rawValue) {
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? { ...ent, id: "" }
                                          : ent,
                                      ),
                                    );
                                    return;
                                  }

                                  const [selectedId, selectedLastName] =
                                    rawValue.split(" - ");
                                  const suggestions =
                                    pastedEntrySuggestions[entryIndex] || [];

                                  // Find the match in the specific suggestions for THIS row index
                                  const match = suggestions.find(
                                    (s) =>
                                      String(s.emplId) === selectedId &&
                                      (!selectedLastName ||
                                        s.lastName === selectedLastName),
                                  );

                                  if (match) {
                                    const [plcCode] = (match.plc || "").split(
                                      " - ",
                                    );
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              id: selectedId,
                                              firstName: match.firstName || "",
                                              lastName: match.lastName || "",
                                              perHourRate:
                                                match.perHourRate || "",
                                              orgId: match.orgId || ent.orgId,
                                              plcGlcCode: plcCode || "",
                                              acctId:
                                                match.acctId || ent.acctId,
                                              acctName:
                                                match.acctName || ent.acctName,
                                              orgName:
                                                match.orgName || ent.orgName,
                                              effectiveDate:
                                                match.effectiveDate || ent.effectiveDate,
                                              esc_Percent: match.esc_Percent || ent.esc_Percent,
                                            }
                                          : ent,
                                      ),
                                    );
                                  } else {
                                    // Just update the text if no match yet (typing)
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? { ...ent, id: rawValue }
                                          : ent,
                                      ),
                                    );
                                  }
                                }}
                                title={
                                  entry.idType === "Other"
                                    ? "TBD (Other - not editable)"
                                    : entry.idType === "PLC"
                                      ? "PLC (reserved - not editable)"
                                      : ""
                                }
                                disabled={
                                  entry.idType === "PLC" ||
                                  entry.idType === "Other"
                                }
                                style={{ maxWidth: "90px" }}
                                className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none focus:ring-0 ${entry.idType === "PLC" || entry.idType === "Other" ? "bg-gray-100" : ""}`}
                                list={
                                  entry.idType !== "Other"
                                    ? `employee-id-list-${entryIndex}`
                                    : undefined
                                }
                                placeholder="Enter ID"
                              />

                              <datalist id={`employee-id-list-${entryIndex}`}>
                                {(pastedEntrySuggestions[entryIndex] || []).map(
                                  (emp, idx) => (
                                    <option
                                      key={`${entryIndex}-${idx}`}
                                      value={`${emp.emplId} - ${emp.lastName}`}
                                    >
                                      {emp.lastName}
                                      {emp.firstName
                                        ? `, ${emp.firstName}`
                                        : ""}{" "}
                                      {/* ({entry.idType}) */}
                                    </option>
                                  ),
                                )}
                              </datalist>
                            </td>

                            <td className="tbody-td text-center text-gray-400 text-xs">
                              -
                            </td>

                            {/* Name Column */}
                            <td className=" tbody-td min-w-[120px]">
                              <input
                                type="text"
                                name="name"
                                value={
                                  entry.idType === "Other"
                                    ? entry.firstName || ""
                                    : entry.idType === "PLC"
                                      ? entry.firstName?.split(" - ")?.[1]
                                      : entry.idType === "Vendor"
                                        ? entry.lastName ||
                                          entry.firstName ||
                                          ""
                                        : `${entry.lastName || ""} ${entry.firstName || ""}`.trim()
                                }
                               readOnly={
  planType !== "NBBUD" &&
  entry.idType !== "Other" 
}

                                onKeyDown={(e) =>
                                  e.key === " " && e.stopPropagation()
                                }
                                onChange={(e) => {
                                  if (
                                    entry.idType === "Other" ||
                                    planType === "NBBUD"
                                  ) {
                                    const cleanValue = e.target.value.replace(
                                      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                                      "",
                                    );

                                    const valToStore = cleanValue.startsWith(
                                      " ",
                                    )
                                      ? cleanValue.trimStart()
                                      : cleanValue;

                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              firstName: valToStore,
                                              lastName: "",
                                            }
                                          : ent,
                                      ),
                                    );
                                  }
                                }}
                                style={{ maxWidth: "90px" }}
                                className={`border border-gray-300 rounded px-1 py-0.5 text-xs  ${entry.idType === "Other" || planType === "NBBUD" ? "bg-white" : "bg-gray-100"}`}
                                // style={{
                                // }}
                                placeholder="Name"
                              />
                            </td>

                            {/* Account Column */}
                            {/* <td className="tbody-td min-w-[110px]">
          <input
            type="text"
            value={entry.acctId}
            onChange={(e) => {
              const val = e.target.value;
              const accountList = accountOptionsWithNames || [];
              const matchedAccount = accountList.find((acc) => (acc.id || acc.accountId) === val);
              setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, acctId: val, acctName: matchedAccount ? matchedAccount.name : "" } : ent)));
            }}
            style={{ maxWidth: "100px" }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
            list={`account-list-pasted-${entryIndex}`}
            placeholder="Account"
          />
          <datalist id={`account-list-pasted-${entryIndex}`}>
            {(pastedEntryAccounts[entryIndex] || []).map((account, index) => (
              <option key={index} value={account.id || account.accountId} />
            ))}
          </datalist>
        </td> */}
                            {/* account */}
                            <td className="tbody-td min-w-[110px]">
                              <input
                                type="text"
                                value={entry.acctId}
                                //  onChange={(e) => {
                                //     const val = e.target.value;
                                //     // FIX: Look up name from your existing accountOptionsWithNames state
                                //     const matchedAccount = accountOptionsWithNames.find(
                                //       (acc) => acc.id === val
                                //     );

                                //     setNewEntries((prev) =>
                                //       prev.map((ent, idx) =>
                                //         idx === entryIndex
                                //           ? {
                                //               ...ent,
                                //               acctId: val,
                                //               // AUTO-POPULATE NAME HERE
                                //               acctName: matchedAccount ? matchedAccount.name : ""
                                //             }
                                //           : ent
                                //       )
                                //     );
                                //   }}
                                onChange={(e) => {
                                  const rawValue = e.target.value;

                                  // If user selects from datalist → "ID - Name"
                                  if (rawValue.includes(" - ")) {
                                    const [acctId, acctName] =
                                      rawValue.split(" - ");

                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              acctId: acctId.trim(), // show only ID
                                              acctName: acctName.trim(),
                                            }
                                          : ent,
                                      ),
                                    );
                                  } else {
                                    // If user is typing manually
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              acctId: rawValue,
                                              acctName: "",
                                            }
                                          : ent,
                                      ),
                                    );
                                  }
                                }}
                                style={{ maxWidth: "100px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`account-list-pasted-${entryIndex}`}
                                placeholder="Account"
                              />
                              <datalist
                                id={`account-list-pasted-${entryIndex}`}
                              >
                                {(pastedEntryAccounts[entryIndex] || []).map(
                                  (account, index) => (
                                    <option
                                      key={index}
                                      value={`${account.id} - ${account.name}`}
                                    />
                                  ),
                                )}
                              </datalist>
                            </td>

                            {/* <td className="tbody-td min-w-[120px]">
          <input type="text" value={entry.acctName || ""} readOnly style={{ maxWidth: "110px" }} className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100" placeholder="Account Name" />
        </td> */}

                            <td className="tbody-td min-w-[120px]">
                              <input
                                type="text"
                                value={entry.acctName || ""}
                                readOnly
                                style={{ maxWidth: "110px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed"
                                placeholder="Account Name"
                              />
                            </td>

                            {/* Organization Column */}

                            <td className="tbody-td min-w-[110px]">
                              <input
                                type="text"
                                name="orgId"
                                value={entry.orgId}
                                // onChange={(e) => {
                                //   const val = e.target.value;
                                //   // Find the matched organization from your existing options
                                //   const matchedOrg = organizationOptions.find(
                                //     (o) => o.value.toString() === val.toString()
                                //   );

                                //   setNewEntries((prev) =>
                                //     prev.map((ent, idx) =>
                                //       idx === entryIndex
                                //         ? {
                                //             ...ent,
                                //             orgId: val,
                                //             // Automatically populate orgName if found
                                //             orgName: matchedOrg ? matchedOrg.orgName : ""
                                //           }
                                //         : ent
                                //     )
                                //   );
                                // }}
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  // const matchedOrg = organizationOptions.find(
                                  //   (o) => o.value.toString() === val.toString()
                                  // );

                                  if (rawValue.includes(" - ")) {
                                    const [orgId, orgName] =
                                      rawValue.split(" - ");

                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              orgId: orgId || "",
                                              orgName: orgName || "",
                                            }
                                          : ent,
                                      ),
                                    );
                                  } else {
                                    // Use the raw typed value; previously this referenced
                                    // `orgId` (undefined) which caused a runtime ReferenceError.
                                    // Now we store the user's typed `rawValue` and clear the
                                    // derived `orgName` until a valid selection is made.
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              orgId: rawValue,
                                              orgName: "",
                                            }
                                          : ent,
                                      ),
                                    );
                                  }
                                }}
                                style={{ maxWidth: "100px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`organization-list-${entryIndex}`}
                                placeholder="Org"
                              />
                              <datalist id={`organization-list-${entryIndex}`}>
                                 {(pastedEntryOrgs[entryIndex] || []).map(
                                  (org, index) => (
                                    <option
                                      key={index}
                                      value={`${org.value} - ${org.name}`}
                                    ></option>
                                  ),
                                )}
                              </datalist>
                            </td>

                            <td className="tbody-td min-w-[120px]">
                              <input
                                type="text"
                                value={entry.orgName}
                                readOnly
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed w-full"
                                placeholder="Org Name"
                              />
                            </td>
                            {/* <td className="tbody-td min-w-[110px]">
          <input
            type="text"
            name="orgId"
            value={entry.orgId}
            // onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, orgId: e.target.value } : ent)))}
            onChange={(e) => {
      const val = e.target.value;
      const matchedOrg = organizationOptions.find(o => o.value.toString() === val.toString());
      setNewEntries((prev) => prev.map((ent, idx) => 
        idx === entryIndex ? { 
          ...ent, 
          orgId: val, 
          orgName: matchedOrg ? matchedOrg.orgName : "" // Autopopulate Name
        } : ent
      ));
    }}
            style={{ maxWidth: "100px" }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
            list={`organization-list-${entryIndex}`}
            placeholder="Org"
          />
          <datalist id={`organization-list-${entryIndex}`}>
            {(pastedEntryOrgs[entryIndex] || []).map((org, index) => (
              <option key={index} value={org.value}>{org.label}</option>
            ))}
          </datalist>
        </td>

        <td className="tbody-td min-w-[120px]">
  <input 
    type="text" 
    value={entry.orgName || ""} 
    readOnly 
    className="border border-gray-300 rounded px-1 py-0.5 text-xs bg-gray-100 cursor-not-allowed w-full" 
    placeholder="Org Name" 
  />
</td> */}

                            {/* PLC Column */}
                            <td className="tbody-td min-w-[110px]">
                              <input
                                type="text"
                                name="plcGlcCode"
                                value={entry.plcGlcCode}
                                onChange={(e) => {
                                  const val = e.target.value;

                                  // handlePlcInputChangeForUpdate(val, entryIndex);

                                  const currentPlcOptions =
                                    pastedEntryPlcs[entryIndex] || [];

                                  const [code, description] = val.split(" - ");

                                  const selectedOption = currentPlcOptions.find(
                                    (opt) =>
                                      opt.value.toLowerCase() ===
                                      code.toLowerCase(),
                                  );

                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? {
                                            ...ent,
                                            plcGlcCode: code,
                                            // 🔥 DO NOT reformat while typing
                                            plcGlcDes: selectedOption
                                              ? `${selectedOption.label.split(" - ")[0]} - (${selectedOption.label.split(" - ")[1]})`
                                              : val,
                                            firstName:
                                              ent.idType === "PLC" &&
                                              selectedOption
                                                ? selectedOption.label
                                                : ent.firstName,
                                          }
                                        : ent,
                                    ),
                                  );
                                }}
                                style={{ maxWidth: "100px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`plc-list-${entryIndex}`}
                                placeholder="PLC"
                              />
                              <datalist id={`plc-list-${entryIndex}`}>
                                {(pastedEntryPlcs[entryIndex] || []).map(
                                  (plc, index) => (
                                    <option key={index} value={plc.label}>
                                      {plc.value}
                                    </option>
                                  ),
                                )}
                              </datalist>
                            </td>

                            <td className="tbody-td text-center">
                              <input
                                type="checkbox"
                                checked={entry.isRev}
                                onChange={(e) =>
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? { ...ent, isRev: e.target.checked }
                                        : ent,
                                    ),
                                  )
                                }
                              />
                            </td>
                            <td className="tbody-td text-center">
                              <input
                                type="checkbox"
                                checked={entry.isBrd}
                                onChange={(e) =>
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? { ...ent, isBrd: e.target.checked }
                                        : ent,
                                    ),
                                  )
                                }
                              />
                            </td>
                            <td className="tbody-td">
                              <input
                                type="text"
                                value={entry.status}
                                onChange={(e) =>
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? { ...ent, status: e.target.value }
                                        : ent,
                                    ),
                                  )
                                }
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                              />
                            </td>
                            {/* <td className="tbody-td">
          <input type="text" value={entry.perHourRate} onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, perHourRate: e.target.value.replace(/[^0-9.]/g, "") } : ent)))} className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs" />
        </td> */}
                            {canView("perHourRate") && (
                              <td className="tbody-td">
                                <input
                                  type="text"
                                  value={entry.perHourRate}
                                  onChange={(e) =>
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              perHourRate:
                                                e.target.value.replace(
                                                  /[^0-9.]/g,
                                                  "",
                                                ),
                                            }
                                          : ent,
                                      ),
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                  placeholder="0.00"
                                  disabled={!canEdit("perHourRate")}
                                  // maxLength={4}
                                />
                              </td>
                            )}
                            {/* <td className="tbody-td min-w-[70px]">
                              <input
                                type="month"
                                onChange={(e) =>
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? {
                                            ...ent,
                                            effectiveDate: e.target.value,
                                          }
                                        : ent,
                                    ),
                                  )
                                }
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                value={formatMonthValue(entry.effectiveDate)}
                              />
                            </td> */}
<td className="tbody-td min-w-[80px] relative group">
  <div className="flex flex-col items-center justify-center">
    <select
      className="table-input w-full max-h-5"
      // 1. Get the current month index (0-11) from the entry state
      value={(() => {
        const dateVal = entry.effectiveDate;

        if (!dateVal && escalationMonth) return parseInt(escalationMonth) - 1;
        if (!dateVal) return "";
        // Works for both YYYY-MM and YYYY-MM-DD
        const monthPart = dateVal.split("-")[1];
        return parseInt(monthPart, 10) - 1;
      })()}
      onChange={(e) => {
        const selectedMonthIdx = parseInt(e.target.value, 10);
        const monthStr = String(selectedMonthIdx + 1).padStart(2, "0");

        // 2. Preserve existing Year (default to current year if empty)
        const currentYear = (entry.effectiveDate || new Date().getFullYear().toString()).split("-")[0];

        // 3. Convert to YYYY-MM-DD using your helper
        const yearMonth = `${currentYear}-${monthStr}`;
        const backendReadyDate = getMonthEndDate(yearMonth);

        // 4. Update the specific entry in state
        setNewEntries((prev) =>
          prev.map((ent, idx) =>
            idx === entryIndex
              ? { ...ent, effectiveDate: backendReadyDate }
              : ent
          )
        );
      }}
    >
      <option value="" disabled>MM</option>
      {[
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ].map((m, i) => (
        <option key={m} value={i}>
          {m}
        </option>
      ))}
    </select>
  </div>
</td>
                            <td className="tbody-td min-w-[70px]">
                              <input
                                  type="number"
                                  value={entry.esc_Percent || escalationPercent}
                                  min={0}
  max={100}
                                //   onChange={(e) =>
                                //   setNewEntries((prev) =>
                                //     prev.map((ent, idx) =>
                                //       idx === entryIndex
                                //         ? {
                                //             ...ent,
                                //             esc_Percent: e.target.value,
                                //           }
                                //         : ent,
                                //     ),
                                //   )
                                // }
                                onChange={(e) =>
      setNewEntries((prev) =>
        prev.map((ent, idx) => {
          if (idx !== entryIndex) return ent;

          let value = e.target.value;

          if (value === "") {
            return { ...ent, esc_Percent: value };
          }

          value = Math.min(100, Math.max(0, Number(value)));

          return { ...ent, esc_Percent: value };
        }),
      )
    }
                                  className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                  placeholder= "0.00"
                                />
                               
                            </td>
                            <td className="tbody-td">
                              {Object.values(
                                newEntryPeriodHoursArray[entryIndex] || {},
                              )
                                .reduce(
                                  (sum, val) => sum + parseFloat(val || 0),
                                  0,
                                )
                                .toFixed(2)}
                            </td>
                            
                          </tr>
                        </React.Fragment>
                      ))}

                    {sortedEmployees
                      .filter((_, idx) => !hiddenRows[idx])
                      .map((emp, idx) => {
                        const actualEmpIdx = localEmployees.findIndex(
                          (e) => e === emp,
                        );
                        const row = getEmployeeRow(emp, actualEmpIdx);
                        const editedData =
                          editedEmployeeData[actualEmpIdx] || {};
                        return (
                          // <tr
                          //   key={`employee-${actualEmpIdx}`}
                          //   className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                          //     selectedRows.has(actualEmpIdx)
                          //       ? "bg-blue-100"
                          //       : selectedRowIndex === actualEmpIdx
                          //       ? "bg-yellow-100"
                          //       : "even:bg-gray-50"
                          //   }`}
                          //   style={{
                          //     height: `${ROW_HEIGHT_DEFAULT}px`,
                          //     lineHeight: "normal",
                          //     cursor: "pointer",
                          //   }}
                          // >
                          <tr
                            id={`emp-row-${actualEmpIdx}`} // Important for auto-scroll
                            key={`employee-${actualEmpIdx}`}
                            className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                              // Add logic to check for the fill highlight
                              findMatches.some(
                                (m) =>
                                  m.empIdx === actualEmpIdx &&
                                  m.isFillHighlight,
                              )
                                ? "bg-yellow-200"
                                : selectedRows.has(actualEmpIdx)
                                  ? "bg-blue-100"
                                  : selectedRowIndex === actualEmpIdx
                                    ? "bg-yellow-100"
                                    : "even:bg-gray-50"
                            }`}
                            // style={{
                            //   height: `${ROW_HEIGHT_DEFAULT}px`,
                            //   lineHeight: "normal",
                            //   cursor: "pointer",
                            //   transition: "background-color 0.5s ease-in-out", // Makes highlight smooth
                            // }}
                            style={{
                              height: `${ROW_HEIGHT_DEFAULT}px`,
                              lineHeight: "normal",
                              cursor: isEditable ? "pointer" : "default",
                            }}
                          >
                            <td className="tbody-td w-6 ">
                              <input
                                type="checkbox"
                                checked={checkedRows.has(actualEmpIdx)}
                                onChange={(e) =>
                                  handleCheckboxSelection(
                                    actualEmpIdx,
                                    e.target.checked,
                                  )
                                }
                                className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                              />
                            </td>
                            <td className="tbody-td min-w-[70px]">
                              {row.idType}
                            </td>

                            {/* ID Column */}
                            <td className="tbody-td min-w-[100px]">
                              {row.emplId}
                            </td>

                            {/* Warning Cell */}
                            <td className="tbody-td min-w-[70px]">
                              {row.warning ? (
                                <span
                                  className="text-yellow-500 text-lg cursor-pointer hover:text-yellow-600"
                                  title="Click to view warnings"
                                  onClick={(e) =>
                                    handleWarningClick(e, row.emplId)
                                  }
                                >
                                  ⚠️
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                            </td>

                            {/* <td
                              className="tbody-td min-w-[70px] text-left pl-2"
                              style={{
                                textAlign: "left",
                              }}
                            >
                              {editedData.firstName !== undefined
                                ? editedData.firstName
                                : row.name}
                            </td> */}
                            <td
  className="tbody-td min-w-[70px] text-left pl-2"
  style={{
    textAlign: "left",
  }}
>
  {/* If idType is 'Other', show an input field; otherwise, show the read-only name */}
  {row.idType === "Other" ? (
    <input
      type="text"
      className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
      value={editedData.firstName !== undefined ? editedData.firstName : row.name}
      onChange={(e) => handleEmployeeDataChange(actualEmpIdx, "firstName", e.target.value)}
      placeholder="Enter Name"
      disabled={!isEditable && !isBudPlan}
    />
  ) : (
    editedData.firstName !== undefined ? editedData.firstName : row.name
  )}
</td>

                            {/* Account Column - Width decreased and Input max-width added */}
                            <td className="tbody-td min-w-[110px]">
                              <input
                                type="text"
                                // value={
                                //   row.idType
                                // }
                                value={
                                  editedData.acctId !== undefined
                                    ? editedData.acctId
                                    : row.acctId
                                }
                                onChange={(e) =>
                                  handleAccountInputChangeForUpdate(
                                    e.target.value,
                                    actualEmpIdx,
                                  )
                                }
                                onBlur={(e) => {
                                  if (planType === "NBBUD") return;
                                  const val = e.target.value;
                                  const originalValue = row.acctId;
                                  if (
                                    val !== originalValue &&
                                    !isValidAccountForUpdate(
                                      val,
                                      updateAccountOptions,
                                    )
                                  ) {
                                    toast.error(
                                      "Please enter a valid Account from the available list.",
                                      { autoClose: 3000 },
                                    );
                                  }
                                }}
                                style={{ maxWidth: "100px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`account-list-${actualEmpIdx}`}
                                placeholder="Enter Account"
                                disabled={!isEditable && !isBudPlan}
                              />
                              <datalist
                                id={`account-list-${actualEmpIdx}`}
                                disabled={!isEditable}
                              >
                                {getTheAccountData(
                                  row.idType.toLowerCase(),
                                ).map((account, index) => (
                                  <option
                                    key={`${account.id}-${index}`}
                                    value={account.id}
                                  >
                                    {account.id}- {account.name}
                                  </option>
                                ))}
                              </datalist>
                            </td>

                            <td className="tbody-td min-w-[120px]">
                              {/* {row.acctName}
                               */}
                              {editedData.acctName !== undefined
                                ? editedData.acctName
                                : row.acctName}
                            </td>

                            {/* Organization Column - Width decreased and Input max-width added */}
                            <td className="tbody-td min-w-[110px]">
                              <input
                                type="text"
                                value={
                                  editedData.orgId !== undefined
                                    ? editedData.orgId
                                    : row.orgId
                                }
                                onChange={(e) =>
                                  handleOrgInputChangeForUpdate(
                                    e.target.value,
                                    actualEmpIdx,
                                  )
                                }
                                onBlur={(e) => {
                                  if (planType === "NBBUD") return;
                                  const val = e.target.value;
                                  const originalValue = row.orgId;
                                  if (
                                    val !== originalValue &&
                                    val &&
                                    !isValidOrgForUpdate(
                                      val,
                                      updateOrganizationOptions,
                                    )
                                  ) {
                                    toast.error(
                                      "Please enter a valid numeric Organization ID from the available list.",
                                      { autoClose: 3000 },
                                    );
                                  }
                                }}
                                style={{ maxWidth: "100px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`organization-list-${actualEmpIdx}`}
                                placeholder="Enter Organization ID"
                                disabled={!isBudPlan || !isEditable}
                              />
                              <datalist
                                id={`organization-list-${actualEmpIdx}`}
                              >
                                {updateOrganizationOptions.map((org, index) => (
                                  <option
                                    key={`${org.value}-${index}`}
                                    value={org.value}
                                  >
                                    {org.label}-{org.name}
                                  </option>
                                ))}
                              </datalist>
                            </td>

                            <td className="tbody-td min-w-[120px]">
                              {editedData.orgName !== undefined
                                ? editedData.orgName
                                : row.orgName}
                            </td>

                            {/* PLC Column - Width decreased and Input max-width added */}
                            <td className="tbody-td min-w-[110px]">
                              <input
                                type="text"
                                value={
                                  editedData.glcPlc !== undefined
                                    ? editedData.glcPlc
                                    : row.glcPlc
                                }
                                onChange={(e) =>
                                  handlePlcInputChangeForUpdate(
                                    e.target.value,
                                    actualEmpIdx,
                                  )
                                }
                                onBlur={(e) => {
                                  if (planType === "NBBUD") return;
                                  const val = e.target.value.trim();
                                  const originalValue = row.glcPlc;
                                  if (val !== originalValue && val !== "") {
                                    const exactPlcMatch = plcOptions.find(
                                      (option) =>
                                        option.value.toLowerCase() ===
                                        val.toLowerCase(),
                                    );
                                    if (!exactPlcMatch) {
                                      // toast.error(
                                      //   "PLC must be selected from the available suggestions. Custom values are not allowed.",
                                      //   { autoClose: 4000 }
                                      // );
                                      handleEmployeeDataChange(
                                        actualEmpIdx,
                                        "glcPlc",
                                        originalValue,
                                      );
                                      setPlcSearch(originalValue);
                                    }
                                  }
                                }}
                                style={{ maxWidth: "100px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`plc-list-${actualEmpIdx}`}
                                placeholder="Enter PLC"
                                disabled={!isBudPlan && !isEditable}
                              />

                              <datalist
                                id={`plc-list-${actualEmpIdx}`}
                                disabled={!isEditable}
                              >
                                {(updatePlcOptions.length > 0
                                  ? updatePlcOptions
                                  : plcOptions
                                ).map((plc, index) => (
                                  <option
                                    key={`${plc.value}-${index}`}
                                    value={plc.value}
                                  >
                                    {plc.label}
                                  </option>
                                ))}
                              </datalist>
                            </td>

                            <td className="tbody-td text-center">
                              <input
                                type="checkbox"
                                checked={
                                  editedData.isRev !== undefined
                                    ? editedData.isRev
                                    : emp.emple.isRev
                                }
                                onChange={(e) =>
                                  handleEmployeeDataChange(
                                    actualEmpIdx,
                                    "isRev",
                                    e.target.checked,
                                  )
                                }
                                // className="w-4 h-4"
                                className="w-3 h-3 cursor-pointer"
                                disabled={!isFieldEditable && !isEditable}
                              />
                            </td>

                            <td className="tbody-td min-w-[70px] text-center">
                              <input
                                type="checkbox"
                                checked={
                                  editedData.isBrd !== undefined
                                    ? editedData.isBrd
                                    : emp.emple.isBrd
                                }
                                onChange={(e) =>
                                  handleEmployeeDataChange(
                                    actualEmpIdx,
                                    "isBrd",
                                    e.target.checked,
                                  )
                                }
                                // className="w-4 h-4"
                                className="w-3 h-3 cursor-pointer"
                                disabled={!isFieldEditable && !isEditable}
                              />
                            </td>
                            <td className="tbody-td min-w-[70px]">
                              {row.status}
                            </td>

                            {/* <td className="tbody-td min-w-[70px]">
          {isBudPlan && isEditable && emp.emple.type !== "Employee" && emp.emple.type !== "Vendor Employee" && emp.emple.type !== "Vendor" ? (
            <input
              type="password"
              value={editingPerHourRateIdx === actualEmpIdx ? (editedData.perHourRate !== undefined ? editedData.perHourRate : row.perHourRate) : ""}
              placeholder={editingPerHourRateIdx === actualEmpIdx ? "" : "**"}
              onFocus={() => setEditingPerHourRateIdx(actualEmpIdx)}
              onChange={(e) => handleEmployeeDataChange(actualEmpIdx, "perHourRate", e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
              disabled={emp.emple.type !== "Employee" && emp.emple.type !== "Vendor Employee" && emp.emple.type !== "Vendor"}
            />
          ) : (
            <span className="text-gray-400 cursor-not-allowed">**</span>
          )}
        </td> */}
                            {canView("perHourRate") && (
                              <td className="tbody-td min-w-[70px]">
                                <input
                                  // CHANGE: Type is text for Admin, password for others
                                  type="text"
                                  // value={
                                  //   editingPerHourRateIdx === actualEmpIdx
                                  //     ? editedData.perHourRate !== undefined
                                  //       ? editedData.perHourRate
                                  //       : row.perHourRate
                                  //     : isAdmin
                                  //       ? row.perHourRate
                                  //       : ""
                                  // } // Show value if Admin even when not focused
                                  value={
   
    editedData.perHourRate !== undefined
      ? editedData.perHourRate
      : row.perHourRate
  
}
                                  
                                  
                                  onFocus={() =>
                                    setEditingPerHourRateIdx(actualEmpIdx)
                                  }
                                  onChange={(e) =>
                                    handleEmployeeDataChange(
                                      actualEmpIdx,
                                      "perHourRate",
                                      e.target.value.replace(/[^0-9.]/g, ""),
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                  disabled={
                                    !isBudPlan &&
                                    !isEditable &&
                                    (emp.emple.type === "Employee" ||
                                      emp.emple.type === "Vendor Employee" ||
                                      emp.emple.type === "VendorEmployee" ||
                                      emp.emple.type === "Vendor")  || !canEdit("perHourRate")
                                  }
                                  // maxLength={4}
                                />
                              </td>
                            )}
                            {/* <td className="tbody-td min-w-[70px]">
                              <input
                                type="month"
                                value={ formatMonthValue(
                                  editedData.effectiveDate !== undefined
                                    ? editedData.effectiveDate
                                    : row.effectiveDate
                        )}
                                onChange={(e) =>
                                  handleEmployeeDataChange(
                                    actualEmpIdx,
                                    "effectiveDate",
                                    e.target.value,
                                  )
                                }
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                disabled={!isEditable}
                              />
                            </td> */}
<td className="tbody-td min-w-[80px] relative">
  <div className="flex flex-col items-center justify-center">
    {isEditable ? (
      <select
        className="table-input w-full max-h-5"
        // 1. Logic to determine which month index (0-11) is currently selected
        value={(() => {
          const dateVal = editedData?.effectiveDate !== undefined 
                          ? editedData.effectiveDate 
                          : row.effectiveDate;
          if (!dateVal) return "";
          // Extract the month part from "YYYY-MM-DD" and convert to 0-indexed
          return parseInt(dateVal.split("-")[1], 10) - 1; 
        })()}
        onChange={(e) => {
          const selectedMonthIdx = parseInt(e.target.value, 10);
          const monthStr = String(selectedMonthIdx + 1).padStart(2, "0");
          
          // 2. Preserve the existing Year (or default to 2026)
          const currentYear = (editedData?.effectiveDate || row.effectiveDate || "2026").split("-")[0];
          
          // 3. Construct YYYY-MM and use your helper to get the end of that month (YYYY-MM-DD)
          const yearMonth = `${currentYear}-${monthStr}`;
          const backendReadyDate = getMonthEndDate(yearMonth);
          
          handleEmployeeDataChange(actualEmpIdx, "effectiveDate", backendReadyDate);
        }}
      >
        <option value="" disabled>Month</option>
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
          <option key={m} value={i}>{m}</option>
        ))}
      </select>
    ) : (
      /* Read-only Label Mode */
      <span className="text-xs text-gray-400">
        {(() => {
          const dateVal = row.effectiveDate;
          if (!dateVal) return "MM";
          const [, month] = dateVal.split("-");
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months[parseInt(month, 10) - 1] || "MM";
        })()}
      </span>
    )}
  </div>
</td>
                            <td className="tbody-td min-w-[70px]">
                              <input
                                type="number"
                                value={
                                  editedData.esc_Percent !== undefined
                                    ? editedData.esc_Percent
                                    : row.esc_Percent
                                }
                                min={0}
                                max={100}
                                // onChange={(e) =>
                                //   handleEmployeeDataChange(
                                //     actualEmpIdx,
                                //     "esc_Percent",
                                //     e.target.value,
                                //   )
                                  
                                // }
                                onChange={(e) => {
      let value = e.target.value;

      if (value === "") {
        handleEmployeeDataChange(actualEmpIdx, "esc_Percent", value);
        return;
      }

      value = Math.min(100, Math.max(0, Number(value)));

      handleEmployeeDataChange(actualEmpIdx, "esc_Percent", value);
    }}
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                                placeholder="0.00"
                                disabled={!isEditable}
                              />
                            </td>
                            <td className="tbody-td min-w-[70px]">
                              {row.total}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    {/* Total Hours row */}
                    <tr
                      className="font-bold text-center"
                      style={{
                        position: "sticky",
                        bottom: 0,
                        zIndex: 21,
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        backgroundColor: "#d7ebf3",
                        color: "#000000",
                      }}
                    >
                      {/* empty scrollable cells */}
                      {visibleEmployeeColumns.map((_, idx) => (
                        <td key={`hours-empty-${idx}`}></td>
                      ))}

                      {/* FIXED RIGHT */}
                      <td
                        className="sticky right-10 z-30 text-right font-bold text-black"
                        style={{
                          backgroundColor: "#d7ebf3",
                          minWidth: "100px",
                          whiteSpace: "nowrap",
                          zIndex: 20,
                          fontSize: "12px",
                          // paddingRight: "1rem",
                          // boxShadow: "-2px 0 0 #d1d5db",
                        }}
                      >
                        {/* Total: */}
                        Subtotal Labor Cost
                      </td>
                    </tr>

                    {/* Total Cost row */}
                  </tfoot>
                </table>
              </div>
              <div
                ref={secondTableRef}
                onScroll={handleSecondScroll}
                className="flex-1 right-scrollbar"
                style={{
                  maxHeight: "400px",
                  overflowY: "auto", // show scrollbar
                  overflowX: "scroll",
                }}
              >
                <table className="min-w-full table">
                  <thead className="thead h-[56px]">
                    <tr
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      {/* {shouldShowCTD() && (
                      <th
                        className="th-thead  border-r border-gray-300 min-w-[166px] p-0"
                        colSpan={2}
                      >
                        <div className="flex flex-col h-full w-full">
                          <div className="font-bold text-center py-1">CTD</div>
                        </div>
                      </th>
                    )}
                    {shouldShowPriorYear() && (
                      <th
                        className="th-thead  border-r border-gray-300 min-w-[166px] p-0"
                        colSpan={2}
                      >
                        <div className="flex flex-col h-full w-full">
                          <div className="font-bold text-center ">
                            Prior Year
                          </div>
                        </div>
                      </th>
                    )} */}

                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;

                        return (
                          <th
                            key={uniqueKey}
                            className={`th-thead ${canView("cost") ? "border-r" : ""} text-black border-b border-gray-300 min-w-[166px] p-0 ${
                              selectedColumnKey === uniqueKey
                                ? "bg-yellow-100"
                                : ""
                            }`}
                            colSpan={canView("cost") ? 2 : 1}
                            onClick={() => handleColumnHeaderClick(uniqueKey)}
                          >
                            {/* <div className="flex flex-col h-full w-full"> */}
                            <div className="whitespace-nowrap th-thead-nb">
                              {duration.month}
                            </div>
                            {/* </div> */}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      {/* {shouldShowCTD() && (
                      <>
                        <th className="th-thead border-gray-500 min-w-[83px] p-0 ">
                          <div className="text-center    ">Hrs</div>
                        </th>
                        <th className="th-thead border-r border-gray-300 min-w-[83px] p-0 ">
                          <div className="text-center ">Cost</div>
                        </th>
                      </>
                    )}
                    {shouldShowPriorYear() && (
                      <>
                        <th className="th-thead min-w-[83px] p-0 ">
                          <div className="text-center    ">Hrs</div>
                        </th>
                        <th className="th-thead border-r border-gray-300 min-w-[83px] p-0 ">
                          <div className="text-center ">Cost</div>
                        </th>
                      </>
                    )} */}
                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;

                        return (
                          <React.Fragment key={`sub-${uniqueKey}`}>
                            <th className="th-thead min-w-[80px] p-0 ">
                              <span className="text-center">
                                {duration.workingHours || 0}Hrs
                              </span>
                            </th>
                            {canView("cost") && (
                              <th className="th-thead border-r border-gray-300 min-w-[80px] p-0  ">
                                <span className="text-center  font-medium">
                                  Cost
                                </span>
                              </th>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="tbody">
                    {newEntries.length > 0 &&
                      newEntries.map((entry, entryIndex) => (
                        <tr
                          key={`new-entry-duration-${entryIndex}`}
                          // style={{
                          //   height: `${ROW_HEIGHT_DEFAULT }px`,
                          //   lineHeight: "normal",
                          // }}
                          // className="bg-gray-50"
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT}px`,
                            lineHeight: "normal",
                          }}
                        >
                          {/* CTD */}
                          {/* {shouldShowCTD() && (
                          <>
                            <td className="tbody-td border-gray-500">
                              <div className="text-center text-gray-400">
                                0.00
                              </div>
                            </td>

                            <td className="tbody-td border-r border-gray-300">
                              <div className="text-center text-gray-400 ">
                                0.00
                              </div>
                            </td>
                          </>
                        )} */}

                          {/* Prior Year */}
                          {/* {shouldShowPriorYear() && (
                          <>
                            <td className="tbody-td border-gray-500">
                              <div className="text-center text-gray-400  ">
                                0.00
                              </div>
                            </td>

                            <td className="tbody-td border-r border-gray-300">
                              <div className="text-center text-gray-400 ">
                                0.00
                              </div>
                            </td>
                          </>
                         )} */}

                          {/* Monthly */}
                          {sortedDurations.map((duration) => {
                            const uniqueKey = `${duration.monthNo}_${duration.year}`;
                            const value =
                              newEntryPeriodHoursArray[entryIndex]?.[
                                uniqueKey
                              ] || "";

                            const isInputEditable =
                              isEditable &&
                              isMonthEditable(duration, closedPeriod, planType);

                            return (
                              <React.Fragment
                                key={`new-entry-${entryIndex}-${uniqueKey}`}
                              >
                                <td
                                  className={`tbody-td  ${
                                    selectedColumnKey === uniqueKey
                                      ? "bg-yellow-100"
                                      : ""
                                  }`}
                                >
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    className={`border border-gray-300 text-center px-1 py-0.5 w-12  text-xs outline-none ${
                                      !isInputEditable
                                        ? "cursor-not-allowed text-gray-400 bg-gray-100"
                                        : "text-gray-700 bg-white"
                                    }`}
                                    value={value}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;

                                      // Allow completely empty input for clearing
                                      if (inputValue === "") {
                                        setNewEntryPeriodHoursArray((prev) =>
                                          prev.map((hours, idx) =>
                                            idx === entryIndex
                                              ? { ...hours, [uniqueKey]: "" }
                                              : hours,
                                          ),
                                        );
                                        return;
                                      }

                                      // Only allow numeric input with decimal
                                      if (
                                        !/^[0-9]*\.?[0-9]*$/.test(inputValue)
                                      ) {
                                        return; // Don't update if not numeric
                                      }

                                      // Check for negative values
                                      const numericValue =
                                        parseFloat(inputValue);
                                      if (numericValue < 0) {
                                        toast.error(
                                          "Hours cannot be negative",
                                          {
                                            autoClose: 2000,
                                          },
                                        );
                                        return;
                                      }

                                      // Check against available hours * 2
                                      const currentDuration =
                                        sortedDurations.find(
                                          (d) =>
                                            `${d.monthNo}_${d.year}` ===
                                            uniqueKey,
                                        );

                                      if (
                                        currentDuration &&
                                        currentDuration.workingHours
                                      ) {
                                        const maxAllowedHours =
                                          currentDuration.workingHours * 2;

                                        if (numericValue > maxAllowedHours) {
                                          toast.error(
                                            `Hours cannot exceed more than available hours * 2`,
                                            { autoClose: 3000 },
                                          );
                                          return; // Don't update the state
                                        }
                                      }

                                      // Update state if validation passes
                                      setNewEntryPeriodHoursArray((prev) =>
                                        prev.map((hours, idx) =>
                                          idx === entryIndex
                                            ? {
                                                ...hours,
                                                [uniqueKey]: inputValue,
                                              }
                                            : hours,
                                        ),
                                      );
                                    }}
                                    onKeyDown={(e) => {
                                      // Allow backspace to completely clear the field
                                      if (
                                        e.key === "Backspace" &&
                                        (value === "0" || value === "")
                                      ) {
                                        e.preventDefault();
                                        setNewEntryPeriodHoursArray((prev) =>
                                          prev.map((hours, idx) =>
                                            idx === entryIndex
                                              ? { ...hours, [uniqueKey]: "" }
                                              : hours,
                                          ),
                                        );
                                      }
                                    }}
                                    disabled={!isInputEditable}
                                    placeholder=""
                                  />
                                  {/* </div> */}
                                </td>

                                {canView("cost") && (
                                  <td
                                    className={`tbody-td border-r  text-centerborder-gray-300 py-1 ${
                                      selectedColumnKey === uniqueKey
                                        ? "bg-yellow-100"
                                        : ""
                                    }`}
                                  >
                                    {/* <div className="text-center">
                                  {value && newEntries[entryIndex]?.perHourRate
                                    ? (
                                        parseFloat(value) *
                                        parseFloat(
                                          newEntries[entryIndex].perHourRate
                                        )
                                      ).toFixed(2)
                                    : "0.00"}
                                </div> */}
                                  </td>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}

                    {/* ================= EMPLOYEE ROWS ================= */}
                    {sortedEmployees
                      .filter((_, idx) => !hiddenRows[idx])
                      .map((emp) => {
                        const actualEmpIdx = sortedEmployees.findIndex(
                          (e) => e === emp,
                        );
                        const monthHours = getMonthHours(emp);
                        const monthCost = getMonthCost(emp);

                        return (
                          <tr
                            key={`employee-row-${actualEmpIdx}`}
                            // style={{
                            //   height: `${ROW_HEIGHT_DEFAULT }px`,
                            //   lineHeight: "normal",
                            //   cursor: isEditable ? "pointer" : "default",
                            // }}
                            style={{
                              height: `${ROW_HEIGHT_DEFAULT}px`,
                              lineHeight: "normal",
                              cursor: isEditable ? "pointer" : "default",
                            }}
                            className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                              selectedRows.has(actualEmpIdx)
                                ? "bg-blue-100" // Selected row background
                                : selectedRowIndex === actualEmpIdx
                                  ? " "
                                  : "even:bg-gray-50"
                            }`}
                            onClick={() => handleRowClick(actualEmpIdx)}
                          >
                            {/* CTD */}
                            {/* {shouldShowCTD() && (
                            <>
                              <td className="tbody-td border-gray-500">
                                <div className="text-center  ">
                                  {employeeYearTotals[
                                    actualEmpIdx
                                  ]?.ctd?.toFixed(2) || "0.00"}
                                </div>
                              </td>

                              <td className="tbody-td border-r border-gray-300">
                                <div className="text-center">
                                  {employeeYearTotals[
                                    actualEmpIdx
                                  ]?.ctd?.toFixed(2) || "0.00"}
                                </div>
                              </td>
                            </>
                          )} */}

                            {/* Prior Year */}
                            {/* {shouldShowPriorYear() && (
                            <>
                              <td className="tbody-td border-gray-500">
                                <div className="text-center  ">
                                  {employeeYearTotals[
                                    actualEmpIdx
                                  ]?.priorYear?.toFixed(2) || "0.00"}
                                </div>
                              </td>

                              <td className="tbody-td border-r border-gray-300">
                                <div className="text-center">
                                  {employeeYearTotals[
                                    actualEmpIdx
                                  ]?.priorYear?.toFixed(2) || "0.00"}
                                </div>
                              </td>
                            </>
                          )} */}

                            {/* Monthly */}
                            {sortedDurations.map((duration) => {
                              const uniqueKey = `${duration.monthNo}_${duration.year}`;
                              const forecast = monthHours[uniqueKey];

                              const value =
                                inputValues[`${actualEmpIdx}_${uniqueKey}`] ??
                                forecast?.value ??
                                0;

                              const isFound = findMatches.some(
    (m) => m.empIdx === actualEmpIdx && m.uniqueKey === uniqueKey
  );

                              const costVal = monthCost[uniqueKey]?.cost ?? 0.0;

                              const isInputEditable =
                                isEditable &&
                                isMonthEditable(
                                  duration,
                                  closedPeriod,
                                  planType,
                                );

                              return (
                                <React.Fragment key={uniqueKey}>
                                  <td
                                    key={`hrs-${uniqueKey}`}
                                    className={`tbody-td min-w-[80px] border-gray-500 ${
                                      /* Changed py-2 px-3 to px-2 py-1.5, min-w-[100px] to min-w-[80px] */
                                      selectedColumnKey === uniqueKey ? " " : ""
                                    } ${
                                      planType === "EAC"
                                        ? isInputEditable
                                          ? "bg-green-50"
                                          : "bg-gray-100"
                                        : ""
                                    }`}
                                  >
                                    {/* <div className="flex items-center h-[18px]   box-border"> */}
                                    <input
                                      type="text"
                                      inputMode="numeric"
                    //                   className={`border border-gray-300 text-center px-1 py-0.5 w-12  text-xs outline-none
                    //   ${
                    //     !isInputEditable
                    //       ? "cursor-not-allowed text-gray-400"
                    //       : "text-gray-700"
                    //   }
                    // `}
                    className={`border border-gray-300 text-center px-1 py-0.5 w-12  text-xs outline-none ${
            isFound 
              ? "bg-yellow-200 font-bold border-2 border-yellow-500 shadow-sm text-gray-900" 
              : !isInputEditable 
                ? "cursor-not-allowed text-gray-400 " 
                : "text-gray-700 "
          }`}
                                      value={value}
                                      onChange={(e) =>
                                        handleInputChange(
                                          actualEmpIdx,
                                          uniqueKey,
                                          e.target.value.replace(
                                            /[^0-9.]/g,
                                            "",
                                          ),
                                        )
                                      }
                                      disabled={!isInputEditable}
                                    />
                                    {/* </div> */}
                                  </td>

                                  {canView("cost") && (
                                    <td
                                      key={`cost-${uniqueKey}`}
                                      className="tbody-td border-r border-gray-300"
                                    >
                                      {canView("cost") && (
                                        <input
                                          type="text"
                                          className="border border-gray-300 text-center w-16 bg-gray-100 text-gray-500 px-1 py-0.5 text-xs outline-none  
                      cursor-not-allowed
                    "
                                          value={formatCurrencyDisplay(costVal)}
                                          disabled
                                        />
                                      )}
                                    </td>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>

                  {/* <tfoot>
                  <tr
                    className="bg-gray-200 font-bold text-center"
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      // height: "10px",
                      lineHeight: "normal",
                      borderTop: "2px solid #d1d5db", // tailwind gray-300
                    }}
                  >
                    {(() => {
                      const columnTotals = calculateColumnTotals();
                      return sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                        const total = columnTotals[uniqueKey] || 0;

                        return (
                          <td
                            key={`total-${uniqueKey}`}
                            className="tbody-td text-center sticky bottom-0 text-xs font-bold bg-gray-200"
                          >
                            {total.toFixed(2)}
                          </td>
                        );
                      });
                    })()}
                  </tr>
                </tfoot> */}
                  {/* <tfoot>
 
  <tr
    className="font-bold text-center"
    style={{
      position: "sticky",
      bottom: `${ROW_HEIGHT_DEFAULT}px`,
      zIndex: 20,
      height: `${ROW_HEIGHT_DEFAULT}px`,
      lineHeight: "normal",
      borderTop: "2px solid #d1d5db",
      backgroundColor: "#d7ebf3", // same hours band color
      color: "#000000",
    }}
  >
    {shouldShowCTD() && (
      <td
        key="total-ctd"
        className="tbody-td text-center text-xs font-bold"
      >
        {columnTotals.ctd?.toFixed(2) || "0.00"}
      </td>
    )}

    {shouldShowPriorYear() && (
      <td
        key="total-prior-year"
        className="tbody-td text-center text-xs font-bold"
      >
        {columnTotals.priorYear?.toFixed(2) || "0.00"}
      </td>
    )}

    {sortedDurations.map((duration) => {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;
      return (
        <td
          key={`total-${uniqueKey}`}
          className="tbody-td text-center text-xs font-bold"
        >
          {columnTotals[uniqueKey]?.toFixed(2) || "0.00"}
        </td>
      );
    })}
  </tr>

 
  <tr
    className="text-center"
    style={{
      position: "sticky",
      bottom: 0,
      zIndex: 20,
      height: `${ROW_HEIGHT_DEFAULT}px`,
      lineHeight: "normal",
      backgroundColor: "#e5f3fb", // lighter blue cost band
    }}
  >
    {shouldShowCTD() && (
      <td className="tbody-td text-center text-[10px] font-bold pr-1"
          style={{ color: "#000000" }}>
      
        {columnTotals.ctd_cost?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00"}
      </td>
    )}

    {shouldShowPriorYear() && (
      <td className="tbody-td text-center text-[10px] font-bold pr-1"
          style={{ color:  "#000000" }}>
      
        {columnTotals.priorYear_cost?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00"}
      </td>
    )}

    {sortedDurations.map((duration) => {
      const key = `${duration.monthNo}_${duration.year}_cost`;
      return (
        <td
          key={`total-cost-${duration.monthNo}_${duration.year}`}
          className="tbody-td text-center text-[10px] font-bold pr-1"
          style={{ color:  "#000000" }}
        >
         
          {columnTotals[key]?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"}
        </td>
      );
    })}
  </tr>
</tfoot> */}
                  {/* --- UPDATED TFOOT FOR SECOND TABLE --- */}
                  <tfoot>
                    {/* Total Hours Row */}

                    <tr
                      className="font-bold text-center"
                      style={{
                        position: "sticky",
                        bottom: 0,
                        zIndex: 20,
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                        // borderTop: "2px solid #d1d5db",
                        backgroundColor: "#d7ebf3", // Light blue background
                        color: "#000000",
                      }}
                    >
                      {/* CTD Column */}
                      {/* {shouldShowCTD() && (
                      <>
                        <td className="tbody-td text-xs border-gray-500 font-bold px-2 text-center">
                          <span className="text-black">
                            {columnTotals.ctd?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td className="tbody-td text-xs border-r border-gray-500 font-bold px-2 text-center">
                          <span className="text-black">
                            {columnTotals.ctd_cost?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </span>
                        </td>
                      </>
                    )} */}

                      {/* Prior Year Column */}
                      {/* {shouldShowPriorYear() && (
                      <>
                        <td className="tbody-td text-xs  border-gray-500 font-bold px-2 text-center">
                          <span className="text-black">
                            {columnTotals.priorYear?.toFixed(2) || "0.00"}
                          </span>
                        </td>
                        <td className="tbody-td text-xs font-bold border-r border-gray-500 px-2 text-center">
                          <span className="text-black">
                            {columnTotals.priorYear_cost?.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            ) || "0.00"}
                          </span>
                        </td>
                      </>
                    )} */}

                      {/* Monthly/Duration Columns */}
                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;

                        // ✅ FIXED: Get correct hours and labor cost
                        const monthData = laborCostByMonth.find(
                          (item) =>
                            item.year === duration.year &&
                            item.month === duration.monthNo,
                        );

                        const hours = monthData ? monthData.hours || 0 : 0;
                        const laborCost = monthData
                          ? monthData.laborCost || 0
                          : 0;

                        return (
                          <React.Fragment key={`total-${uniqueKey}`}>
                            {/* HOURS COLUMN */}
                            <td className="tbody-td text-xs font-bold px-2 text-center">
                              <span className="text-black">
                                {hours.toFixed(2)}
                              </span>
                            </td>

                            {/* LABOR COST COLUMN */}
                            {canView("cost") && (
                              <td className="tbody-td text-xs border-r border-gray-300 font-bold px-2 text-center">
                                <span className="text-black">
                                  {laborCost.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </td>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            {/* <div className="w-full bg-black p-2 text-white flex justify-center gap-x-5">
            <button
              onClick={() => {
                setHourPage((prev) => Math.max(1, prev - 1));
              }}
            >
              {`<<`}
            </button>
            <div>Page ({hourPage})</div>
            <button
              onClick={() => {
                setHourPage((prev) => Math.min(totalPages, prev + 1));
              }}
            >
              {`>>`}
            </button>
          </div> */}
            <div className="w-full bg-[#e5f3fb] text-white flex items-center justify-center ">
             
             <div className="flex items-center justify-end gap-2 px-4 py-2  border-gray-100 w-fit ml-auto mb-1 text-sm text-gray-900">
 
  {/* Left Arrow */}
  <button
    onClick={() => handlePageClick(hourPage - 1)}
    className="text-[#17414d] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
    disabled={hourPage === 1}
  >
    <ChevronLeft size={18} />
  </button>
 
  {/* Page Numbers with Ellipsis Logic */}
  <div className="flex items-center gap-1">
    {(() => {
      const pages = [];
      const showMax = 5; // Adjustment for number of visible page buttons
      if (totalPages <= showMax + 2) {
        // If total pages are few, show all of them
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        // Logic for large page counts (like 50)
        pages.push(1); // Always show first page
 
        if (hourPage > 3) {
          pages.push("...");
        }
 
        // Show pages around the current page
        let start = Math.max(2, hourPage - 1);
        let end = Math.min(totalPages - 1, hourPage + 1);
 
        // Keep a consistent number of buttons when at the edges
        if (hourPage <= 2) end = 4;
        if (hourPage >= totalPages - 1) start = totalPages - 3;
 
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
 
        if (hourPage < totalPages - 2) {
          pages.push("...");
        }
 
        pages.push(totalPages); // Always show last page
      }
 
      return pages.map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && handlePageClick(page)}
          disabled={page === "..."}
          className={`w-8 h-8 flex items-center cursor-pointer justify-center rounded-full transition-all ${
            hourPage === page
              ? "bg-[#17414d] text-white font-bold "
              : page === "..."
                ? "cursor-default text-gray-400"
                : "hover:bg-white hover:text-[#17414d]"
          }`}
        >
          {page}
        </button>
      ));
    })()}
  </div>
 
  {/* Right Arrow */}
  <button
    onClick={() => handlePageClick(hourPage + 1)}
    className="text-[#17414d] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
    disabled={hourPage === totalPages}
  >
    <ChevronRight size={18} />
  </button>
 
  {/* Page Size Select */}
<div className="relative flex items-center rounded px-2 bg-white transition-colors">
  {/* bg-[#17414d] */}
  <select
    value={pageSize}
    onChange={(e) => {
      setPageSize(Number(e.target.value));
      setHourPage(1);
    }}
    className="appearance-none bg-transparent py-1 pr-4 pl-1 
               focus:outline-none cursor-pointer text-black"
  >
    <option value={15} className="text-black bg-white">
      15 / page
    </option>
    <option value={25} className="text-black bg-white">
      25 / page
    </option>
    <option value={35} className="text-black bg-white">
      35 / page
    </option>
  </select>

  <ChevronDown
    size={14}
    className="absolute right-2 text-gray-400 pointer-events-none"
  />
</div>
 
  {/* Go To Input */}
  <div className="flex items-center gap-2 ml-2">
    <span className="text-black font-semibold">Go to</span>
    <input
      type="text"
      value={goToValue}
      onChange={(e) => setGoToValue(e.target.value.replace(/\D/g, ""))}
      onKeyDown={handleGoTo}
      placeholder="#"
      className="w-12 border border-gray-200 outline-none bg-white rounded py-1 text-center transition-all "
    />
    <span className="text-black font-semibold">Page</span>
  </div>
</div>

            </div>
          </div>
        )}
        {/* {showFindReplace && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              Find and Replace Hours
            </h3>
            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find:
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or empty)"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="replaceValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Replace with:
              </label>
              <input
                type="text"
                id="replaceValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={replaceValue}
                onChange={(e) =>
                  setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="New value (e.g., 120 or empty)"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope:
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row (
                    {selectedRowIndex !== null
                      ? localEmployees[selectedRowIndex]?.emple.emplId
                      : "N/A"}
                    )
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}_${d.year}` === selectedColumnKey
                        )?.month
                      : "N/A"}
                    )
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFindReplace}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )} */}

        {/* {showFindReplace && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
            <h3 className="text-lg font-semibold mb-4">
              {showFindOnly ? "Find Hours" : "Find and Replace Hours"}
            </h3>

           
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(false);
                  setFindMatches([]);
                }}
                className={`px-3 py-1 rounded text-xs ${
                  !showFindOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find & Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(true);
                  setFindMatches([]);
                }}
                className={`px-3 py-1 rounded text-xs ${
                  showFindOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find Only
              </button>
            </div>

           
            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or 0)"
              />
            </div>

           
            {!showFindOnly && (
              <div className="mb-4">
                <label
                  htmlFor="replaceValue"
                  className="block text-gray-700 text-xs font-medium mb-1"
                >
                  Replace with
                </label>
                <input
                  type="text"
                  id="replaceValue"
                  className="w-full border border-gray-300 rounded-md p-2 text-xs"
                  value={replaceValue}
                  onChange={(e) =>
                    setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="New value (e.g., 120)"
                />
              </div>
            )}

           
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row (
                    {selectedRowIndex !== null
                      ? localEmployees[selectedRowIndex]?.emple.emplId
                      : "NA"}
                    )
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}${d.year}` === selectedColumnKey
                        )?.month
                      : "NA"}
                    )
                  </span>
                </label>
              </div>
            </div>

           
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                  setFindMatches([]);
                  setShowFindOnly(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Cancel
              </button>
              {showFindOnly ? (
                <button
                  type="button"
                  onClick={handleFind}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  Find & Highlight
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFindReplace}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  Replace All
                </button>
              )}
            </div>
          </div>
        </div>
      )} */}

        {showFindReplace && (
          <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
            <div style={{ 
        transform: `translate(${findReplacePos.x}px, ${findReplacePos.y}px)`,
        transition: 'none'
      }}
      onMouseDown={(e) => handleDrag(e, setFindReplacePos, findReplacePos)} className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
                <h3 className="text-lg font-semibold mb-4">
                  {showFindOnly ? "Find Hours" : "Find and Replace Hours"}
                </h3>

                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindOnly(false);
                      setFindMatches([]);
                    }}
                    className={`btn1 btn-blue ${
                      !showFindOnly ? "btn-blue" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Find & Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindOnly(true);
                      setFindMatches([]);
                    }}
                    className={`btn1 btn-blue ${
                      showFindOnly ? "btn-blue" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Find
                  </button>
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="findValue"
                    className="block text-gray-700 text-xs font-medium mb-1"
                  >
                    Find
                  </label>
                  <input
                    type="text"
                    id="findValue"
                    className="w-full border border-gray-300 rounded-md p-2 text-xs"
                    value={findValue}
                    onChange={(e) => setFindValue(e.target.value)}
                    placeholder="Value to find (e.g., 100 or 0)"
                  />
                </div>

                {!showFindOnly && (
                  <div className="mb-4">
                    <label
                      htmlFor="replaceValue"
                      className="block text-gray-700 text-xs font-medium mb-1"
                    >
                      Replace with
                    </label>
                    <input
                      type="text"
                      id="replaceValue"
                      className="w-full border border-gray-300 rounded-md p-2 text-xs"
                      value={replaceValue}
                      onChange={(e) =>
                        setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      placeholder="New value (e.g., 120)"
                    />
                  </div>
                )}

                {/* ✅ FIXED SCOPE - Now supports CHECKED ROWS */}
                <div className="mb-4">
                  <label className="block text-gray-700 text-xs font-medium mb-1">
                    Scope
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    <label className="inline-flex items-center text-xs cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="replaceScope"
                        value="all"
                        checked={replaceScope === "all"}
                        onChange={(e) => setReplaceScope(e.target.value)}
                      />
                      <span className="ml-2">All</span>
                    </label>
                    <label className="inline-flex items-center text-xs cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="replaceScope"
                        value="checked-rows"
                        checked={replaceScope === "checked-rows"}
                        onChange={(e) => setReplaceScope(e.target.value)}
                      />
                      <span className="ml-2">Selected Row </span>
                    </label>

                    <label className="inline-flex items-center text-xs cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="replaceScope"
                        value="column"
                        checked={replaceScope === "column"}
                        onChange={(e) => setReplaceScope(e.target.value)}
                        disabled={!selectedColumnKey}
                      />
                      <span
                        className={`ml-2 ${!selectedColumnKey ? "text-gray-400" : ""}`}
                      >
                        Selected Column
                      </span>
                    </label>
                    {/* <label className="inline-flex items-center text-xs cursor-pointer">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="replaceScope"
                value="row"
                checked={replaceScope === "row"}
                onChange={(e) => setReplaceScope(e.target.value)}
                disabled={selectedRowIndex === null}
              />
              <span className="ml-2">
                Selected Row ({selectedRowIndex !== null ? localEmployees[selectedRowIndex]?.emple?.emplId : "NA"})
              </span>
            </label> */}
                    {/* <label className="inline-flex items-center text-xs cursor-pointer">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="replaceScope"
                value="column"
                checked={replaceScope === "column"}
                onChange={(e) => setReplaceScope(e.target.value)}
                disabled={selectedColumnKey === null}
              />
              <span className="ml-2">
                Selected Column ({selectedColumnKey ? sortedDurations.find(d => `${d.monthNo}_${d.year}` === selectedColumnKey)?.month : "NA"})
              </span>
            </label> */}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindReplace(false);
                      setSelectedRowIndex(null);
                      setSelectedColumnKey(null);
                      setReplaceScope("all");
                      setFindMatches([]);
                      setShowFindOnly(false);
                      setFindReplacePos({ x: 0, y: 0 });
                    }}
                    // className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
                    className="btn1 btn-blue"
                  >
                    Cancel
                  </button>
                  {showFindOnly ? (
                    <button
                      type="button"
                      onClick={handleFind}
                      // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                      className={`btn1 btn-blue`}
                    >
                      Find & Highlight
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFindReplace}
                      // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                      className={`btn1 btn-blue`}
                    >
                      Replace All
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {showFindReplace && (
                   <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
    <div className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
       
            <h3 className="text-lg font-semibold mb-4">
              {showFindOnly ? "Find Hours" : "Find and Replace Hours"}
            </h3>
 
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(false);
                  setFindMatches([]);
                }}
                className={`px-3 py-1 rounded text-xs ${
                  !showFindOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find & Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFindOnly(true);
                  setFindMatches([]);
                }}
                className={`px-3 py-1 rounded text-xs ${
                  showFindOnly
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Find Only
              </button>
            </div>
 
            <div className="mb-3">
              <label
                htmlFor="findValue"
                className="block text-gray-700 text-xs font-medium mb-1"
              >
                Find
              </label>
              <input
                type="text"
                id="findValue"
                className="w-full border border-gray-300 rounded-md p-2 text-xs"
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Value to find (e.g., 100 or 0)"
              />
            </div>
 
            {!showFindOnly && (
              <div className="mb-4">
                <label
                  htmlFor="replaceValue"
                  className="block text-gray-700 text-xs font-medium mb-1"
                >
                  Replace with
                </label>
                <input
                  type="text"
                  id="replaceValue"
                  className="w-full border border-gray-300 rounded-md p-2 text-xs"
                  value={replaceValue}
                  onChange={(e) =>
                    setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="New value (e.g., 120)"
                />
              </div>
            )}
 
            <div className="mb-4">
              <label className="block text-gray-700 text-xs font-medium mb-1">
                Scope
              </label>
              <div className="flex gap-4 flex-wrap">
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="all"
                    checked={replaceScope === "all"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                  />
                  <span className="ml-2">All</span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="row"
                    checked={replaceScope === "row"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedRowIndex === null}
                  />
                  <span className="ml-2">
                    Selected Row (
                    {selectedRowIndex !== null
                      ? employees[selectedRowIndex]?.emple.emplId
                      : "NA"}
                    )
                  </span>
                </label>
                <label className="inline-flex items-center text-xs cursor-pointer">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    name="replaceScope"
                    value="column"
                    checked={replaceScope === "column"}
                    onChange={(e) => setReplaceScope(e.target.value)}
                    disabled={selectedColumnKey === null}
                  />
                  <span className="ml-2">
                    Selected Column (
                    {selectedColumnKey
                      ? sortedDurations.find(
                          (d) => `${d.monthNo}_${d.year}` === selectedColumnKey
                        )?.month
                      : "NA"}
                    )
                  </span>
                </label>
              </div>
            </div>
 
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFindReplace(false);
                  setSelectedRowIndex(null);
                  setSelectedColumnKey(null);
                  setReplaceScope("all");
                  setFindMatches([]);
                  setShowFindOnly(false);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
              >
                Cancel
              </button>
              {showFindOnly ? (
                <button
                  type="button"
                  onClick={handleFind}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  Find & Highlight
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFindReplace}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  Replace All
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      )} */}

        {/* Warning Popup Modal */}
        {showWarningPopup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Warnings for Employee: {selectedEmployeeIdForWarning}
                </h3>
                <button
                  onClick={() => setShowWarningPopup(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Warning Component */}
              <Warning
                planId={planId}
                projectId={projectId}
                planType={planType}
                emplId={selectedEmployeeIdForWarning}
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowWarningPopup(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Schedule Section */}
        {showEmployeeSchedule && (
          <div className="mt-6 border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Employee Schedule
              </h2>
              <button
                onClick={() => setShowEmployeeSchedule(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ✕ Close
              </button>
            </div>
            <EmployeeSchedule
              planId={planId}
              projectId={projectId}
              status={status}
              planType={planType}
              startDate={startDate}
              endDate={endDate}
              fiscalYear={fiscalYear}
            />
          </div>
        )}
      </div>
    );
  },
);

export default ProjectHoursDetails;