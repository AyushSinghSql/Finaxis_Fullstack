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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";
import { UsersIcon, CreditCardIcon, ChartBarIcon } from "@heroicons/react/24/solid";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" },
  { key: "orgId", label: "Org ID" },
  { key: "orgName", label: "Org Name" },
  // { key: "orgId", label: "Organization" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
];

export const AMOUNTS_EMPLOYEE_COLUMNS = [
  { key: "idType", label: "ID Type" },
  { key: "emplId", label: "ID" },
  { key: "name", label: "Name" },
  { key: "acctId", label: "Account" },
  { key: "acctName", label: "Account Name" },
  { key: "orgId", label: "Organization" },
  { key: "isRev", label: "Rev" },
  { key: "isBrd", label: "Brd" },
  { key: "status", label: "Status" },
  { key: "total", label: "Total" },
];

const ID_TYPE_OPTIONS = [
  { value: "", label: "Select ID Type" },
  { value: "Employee", label: "Employee" },
  { value: "Vendor", label: "Vendor" },
  { value: "Vendor Employee", label: "Vendor Employee" },
  { value: "Other", label: "Other" },
];

const ROW_HEIGHT_DEFAULT = 24;

const ProjectAmountsTable = forwardRef(
  (
    {
      initialData,
      setRefreshPool,
      startDate,
      endDate,
      planType,
      templateId,
      fiscalYear: propFiscalYear,
      onSaveSuccess,
      refreshKey,
      onColumnTotalsChange,
      allData,
      allOrgData,
      isClosedPeriodEditable,
      allForcastData,
      setIsDataLoading,
      isDataLoading,
      durations,
      groupCd,
    },
    ref,
  ) => {
    // Normalize fiscal year - add after component definition
    const normalizedFiscalYear =
      propFiscalYear === "All" || !propFiscalYear
        ? "All"
        : String(propFiscalYear).trim();

    const [employees, setEmployees] = useState([]);
    // const [durations, setDurations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findValue, setFindValue] = useState("");
    const [replaceValue, setReplaceValue] = useState("");
    const [replaceScope, setReplaceScope] = useState("all");
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [selectedColumnKey, setSelectedColumnKey] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [allEmployeeData, setAllEmployeeData] = useState([])
    const [allVendorData, setAllVendorData] = useState([])
    const [newEntry, setNewEntry] = useState({
      id: "",
      firstName: "",
      lastName: "",
      isRev: false,
      isBrd: false,
      idType: "",
      acctId: "",
      orgId: "",
      perHourRate: "",
      status: "Act",
    });
    const [newEntryPeriodAmounts, setNewEntryPeriodAmounts] = useState({});
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessageText, setSuccessMessageText] = useState("");
    const [hiddenRows, setHiddenRows] = useState({});
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [nonLaborAccounts, setNonLaborAccounts] = useState([]);
    const [
      otherDirectCostNonLaborAccounts,
      setOtherDirectCostNonLaborAccounts,
    ] = useState([]);
    const [showFillValues, setShowFillValues] = useState(false);
    const [fillAmounts, setFillAmounts] = useState("");
    const [fillStartDate, setFillStartDate] = useState(startDate);
    const [fillEndDate, setFillEndDate] = useState(endDate);

    const [fillMethod, setFillMethod] = useState("None");
    const [sourceRowIndex, setSourceRowIndex] = useState(null);
    const [editedRowData, setEditedRowData] = useState({});
    const [idError, setIdError] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null); // dctId of selected employee
    const [localEmployees, setLocalEmployees] = useState([]);
    const [employeeNonLaborAccounts, setEmployeeNonLaborAccounts] = useState(
      [],
    );
    const [subContractorNonLaborAccounts, setSubContractorNonLaborAccounts] =
      useState([]);
    const [accountOptionsWithNames, setAccountOptionsWithNames] = useState([]);
    // Locate these around line 105 and update:
const [employeeLaborAccounts, setEmployeeLaborAccounts] = useState([]);
const [subContractorLaborAccounts, setSubContractorLaborAccounts] = useState([]);
const [otherDirectCostLaborAccounts, setOtherDirectCostLaborAccounts] = useState([]);
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [modifiedAmounts, setModifiedAmounts] = useState({});
    const [hasUnsavedAmountChanges, setHasUnsavedAmountChanges] =
      useState(false);

    const [selectedSourceIdx, setSelectedSourceIdx] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    // Add after existing state declarations around line 88
    const [editingRowIndex, setEditingRowIndex] = useState(null);
    const [hasUnsavedFieldChanges, setHasUnsavedFieldChanges] = useState(false);
    const [selectedColumnKeys, setSelectedColumnKeys] = useState(new Set());

    // Copy-paste functionality states
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showCopyButton, setShowCopyButton] = useState(false);
    const [hasClipboardData, setHasClipboardData] = useState(false);
    const [copiedRowsData, setCopiedRowsData] = useState([]);
    const [newEntries, setNewEntries] = useState([]);
    const [newEntryPeriodAmountsArray, setNewEntryPeriodAmountsArray] =
      useState([]);
    const [copiedMonthMetadata, setCopiedMonthMetadata] = useState([]);
    const [pastedEntrySuggestions, setPastedEntrySuggestions] = useState({});
    const [pastedEntryAccounts, setPastedEntryAccounts] = useState({});
    const [pastedEntryOrgs, setPastedEntryOrgs] = useState({});

    const [amountPage, setAmountPage] = useState(1);
    const [totalPages, setTotalPages] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const isPastingRef = useRef(false);

    const isSilentRefreshing = useRef(false);

    const [findMatches, setFindMatches] = useState([]);
    const [showFindOnly, setShowFindOnly] = useState(false);

    // Add these after pastedEntryOrgs state
    const [cachedProjectData, setCachedProjectData] = useState(null);
    const [cachedOrgData, setCachedOrgData] = useState(null);
    // const [allowClosedPeriodEdit, setAllowClosedPeriodEdit] = useState(false);
    // const [isClosedPeriodEditable, setIsClosedPeriodEditable] = useState(false);
    const [sortConfig, setSortConfig] = useState({
      key: null,
      direction: "asc",
    });
    const [monthlyForecastData, setMonthlyForecastData] = useState([]);
    // const [isDataLoading, setIsDataLoading] = useState(false)

     const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
     const [findReplacePos, setFindReplacePos] = useState({ x: 0, y: 0 });

     const [goToValue, setGoToValue] = useState(amountPage)
     const [pageSize, setPageSize] = useState(15)


    
const formatWithCommas = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const handleDrag = (e, setPos, currentPos) => {
  if (e.target.closest("input, select, button, label")) return;
  const startX = e.clientX - currentPos.x;
  const startY = e.clientY - currentPos.y;
  const onMouseMove = (moveEvent) => {
    setPos({ x: moveEvent.clientX - startX, y: moveEvent.clientY - startY });
  };
  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

           const handlePageClick = (page) => {
    if (page < 1 || page > totalPages) return;
    setAmountPage(page);
  };
 
  const handleGoTo = (e) => {
    if (e.key === 'Enter') {
      const val = parseInt(goToValue);
      if (val >= 1 && val <= totalPages) {
        setAmountPage(val);
        // setGoToValue("");
      }
    }
  };
 
// useEffect(() => {
  
//   if (showFindReplace && selectedRows.size > 0) {
//     setReplaceScope("checked-rows");
//   }
// }, [selectedRows.size, showFindReplace]);

useEffect(() => {
  
  if (showFindReplace && selectedRows.size > 0) {
    setReplaceScope("checked-rows");
  }
}, [selectedRows.size, showFindReplace]);

const stripCommas = (val) => {
  return val.toString().replace(/,/g, "");
};

    // useImperativeHandle(ref, () => ({
    //   hasUnsavedChanges: () => {
    //     const hasMultipleNewEntries = newEntries.length > 0;
    //     const isSingleEntryModified =
    //       newEntry.id !== "" ||
    //       newEntry.idType !== "" ||
    //       Object.keys(newEntryPeriodAmounts).length > 0; // Use Amounts here

    //     const isAmountsModified = Object.keys(modifiedAmounts).length > 0;
    //     const isFieldsModified = Object.keys(editedRowData).length > 0;

    //     return (
    //       hasMultipleNewEntries ||
    //       isSingleEntryModified ||
    //       isAmountsModified ||
    //       isFieldsModified
    //     );
    //   },
    // }));
    useImperativeHandle(ref, () => ({
      newEntries,
      hasUnsavedAmountChanges,
      hasUnsavedFieldChanges,
      handleMasterSave,
    }));

    useEffect(() => {
      const handleBeforeUnload = (event) => {
        if (ref.current?.hasUnsavedChanges?.()) {
          const msg = "Changes you made may not be saved.";
          event.preventDefault();
          event.returnValue = msg;
          return msg;
        }
      };

      const handleInternalClick = (e) => {
        if (ref.current?.hasUnsavedChanges?.()) {
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
      document.addEventListener("click", handleInternalClick, true);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("click", handleInternalClick, true);
      };
      // Use the specific state names for Amounts component here
    }, [
      newEntry,
      newEntries,
      newEntryPeriodAmounts,
      inputValues,
      editedRowData,
    ]);

    const sortedEmployees = useMemo(() => {
      if (!sortConfig.key) return employees;

      const sorted = [...employees];

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
    }, [employees, sortConfig]);

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

    //  const isFormOpened = useRef(false);

    const isInitialRender = useRef(true);

    const isEditable = initialData.status === "In Progress";
    const planId = initialData.plId;
    const projectId = initialData.projId;
    const closedPeriod = initialData.closedPeriod;
    const isBudPlan =
      (planType && planType.toUpperCase() === "BUD") ||
      planType?.toUpperCase() === "NBBUD";
    const isFieldEditable =
      planType && ["BUD", "NBBUD", "EAC"].includes(planType.toUpperCase());
    // const isEAC = planType && planType.toUpperCase() === "EAC";
    // const shouldDisableDelete = isEAC || !isEditable;  // ADD THIS LINE
    const isEAC = planType && planType.toUpperCase() === "EAC";
    //  Add this new constant
    const shouldHideButtons =
      isEAC &&
      ["SUBMITTED", "APPROVED", "CONCLUDED"].includes(
        initialData.status?.toUpperCase(),
      );
    const shouldDisableDelete =
      isEAC && initialData.status?.toUpperCase() === "IN PROGRESS";
    const firstTableRef = useRef(null);
    const secondTableRef = useRef(null);
    const scrollingLock = useRef(false);

    const [maxKbdSuffix, setMaxKbdSuffix] = useState(0);

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

    const getMonthAmounts = (emp) => {
      const monthAmounts = {};
      if (emp.emple && Array.isArray(emp.emple.plForecasts)) {
        emp.emple.plForecasts.forEach((forecast) => {
          const uniqueKey = `${forecast.month}_${forecast.year}`;
          // Use actualhours for EAC, forecastedhours otherwise
          const value =
            planType === "EAC" && forecast.actualamt !== undefined
              ? forecast.actualamt
              : (forecast.forecastedamt ?? 0);
          monthAmounts[uniqueKey] = { value, ...forecast };
        });
      }
      return monthAmounts;
    };

    // REPLACE this useEffect (around line 252):

    const fetchMonthlyTotals = async () => {
      try {
        // ✅ Check if both planId and planType are available before making the API call
        if (!planId || !planType) {
          setMonthlyForecastData([]);
          return;
        }

        const response = await axios.get(
          `${backendUrl}/Forecast/GetMonthlyData?planID=${planId}&planType=${planType}`,
        );
        setMonthlyForecastData(response.data || []);
      } catch (error) {
        console.error("Error fetching monthly totals:", error);
        setMonthlyForecastData([]);
      }
    };
    useEffect(() => {
      // ✅ Call only when both planId and planType are defined
      if (allForcastData) {
        setMonthlyForecastData(allForcastData)
      }
    }, [allForcastData]); // ✅ ADDED planType to d
    // REPLACE the getLaborCostForPeriod function:

    const getLaborCostForPeriod = (year, month) => {
      // ✅ Safety check: ensure monthlyForecastData is an array
      if (
        !Array.isArray(monthlyForecastData) ||
        monthlyForecastData.length === 0
      ) {
        return 0;
      }

      const data = monthlyForecastData.find(
        (item) => item.year === year && item.month === month,
      );

      // ✅ Return nonLaborCost if found, otherwise return 0
      return data ? data.nonLaborCost || 0 : 0;
    };

    const columnTotals = useMemo(() => {
      const totals = {};

      // let ctdTotal = 0;
      // let priorYearTotal = 0;

      const currentFiscalYear =
        normalizedFiscalYear !== "All" ? parseInt(normalizedFiscalYear) : null;
      const startYear = startDate ? parseInt(startDate.split("-")[0]) : null;

      // Calculate CTD and Prior Year from ALL durations (use all, not filtered)
      if (currentFiscalYear && startYear) {
        durations.forEach((duration) => {
          let total = 0;
          const uniqueKey = `${duration.monthNo}_${duration.year}`;

          // Sum amounts from existing employees
          employees.forEach((emp, idx) => {
            if (hiddenRows[idx]) return;
            const inputValue = inputValues[`${idx}_${uniqueKey}`];
            const monthAmounts = getMonthAmounts(emp);
            const forecastValue = monthAmounts[uniqueKey]?.value;
            const value =
              inputValue !== undefined && inputValue !== ""
                ? inputValue
                : forecastValue;
            total += value && !isNaN(value) ? Number(value) : 0;
          });

          // Add amounts from new entry forms
          newEntries.forEach((entry, entryIndex) => {
            const newEntryValue =
              newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
            total +=
              newEntryValue && !isNaN(newEntryValue)
                ? Number(newEntryValue)
                : 0;
          });

          // Prior Year: sum of (selected fiscal year - 1)
          // if (duration.year === currentFiscalYear - 1) {
          //   priorYearTotal += total;
          // }

          // // CTD: sum from start year to (selected fiscal year - 2)
          // if (
          //   duration.year >= startYear &&
          //   duration.year <= currentFiscalYear - 2
          // ) {
          //   ctdTotal += total;
          // }
        });
      }

      // Calculate monthly totals for visible columns (filtered by fiscal year)
      sortedDurations.forEach((duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        let total = 0;

        // Sum amounts from existing employees
        employees.forEach((emp, idx) => {
          if (hiddenRows[idx]) return;
          const inputValue = inputValues[`${idx}_${uniqueKey}`];
          const monthAmounts = getMonthAmounts(emp);
          const forecastValue = monthAmounts[uniqueKey]?.value;
          const value =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue;
          total += value && !isNaN(value) ? Number(value) : 0;
        });

        // Add amounts from new entry forms
        newEntries.forEach((entry, entryIndex) => {
          const newEntryValue =
            newEntryPeriodAmountsArray[entryIndex]?.[uniqueKey];
          total +=
            newEntryValue && !isNaN(newEntryValue) ? Number(newEntryValue) : 0;
        });

        totals[uniqueKey] = total;
      });

      // totals["ctd"] = ctdTotal;
      // totals["priorYear"] = priorYearTotal;

      return totals;
    }, [
      durations,
      employees,
      inputValues,
      hiddenRows,
      newEntries,
      newEntryPeriodAmountsArray,
      sortedDurations,
      normalizedFiscalYear,
      startDate,
    ]);

    useEffect(() => {
      if (typeof onColumnTotalsChange === "function") {
        onColumnTotalsChange(columnTotals);
      }
    }, [columnTotals, onColumnTotalsChange]);

    useEffect(() => {
      setCachedProjectData(null);
      setCachedOrgData(null);
    }, [projectId, planType]);

    useEffect(() => {
      setFillStartDate(startDate);
      setFillEndDate(endDate);
    }, [startDate, endDate]);

    useEffect(() => {
      const existingKbdIds =
        employees
          ?.map((emp) => emp.emple?.emplId)
          .filter((id) => id && id.startsWith("KBD")) || [];

      const suffixes = existingKbdIds.map((id) => {
        const match = id.match(/^KBD(\d{3})$/);
        return match ? parseInt(match[1], 10) : 0;
      });

      const maxSuffix = suffixes.length ? Math.max(...suffixes) : 0;
      setMaxKbdSuffix(maxSuffix);
    }, [employees]); // ✅ Only depends on employees

    // 2. Generate ID only when idType changes to "Other"
    useEffect(() => {
      if (newEntry.idType === "Other") {
        // Check if needs new ID
        const needsNewId =
          !newEntry.id || newEntry.id === "" || !/^KBD\d{3}$/.test(newEntry.id);

        if (needsNewId) {
          const newId = `KBD${String(maxKbdSuffix + 1).padStart(3, "0")}`;
          setNewEntry((prev) => ({
            ...prev,
            id: newId,
            status: "ACT",
          }));
        } else {
          // Just ensure status is ACT
          setNewEntry((prev) => ({
            ...prev,
            status: "ACT",
          }));
        }
      }
    }, [newEntry.idType]); // ✅ Only depends on idType - NO maxKbdSuffix!

    useEffect(() => {
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
        perHourRate: "",
        status: "Act",
      });
      setNewEntryPeriodAmounts({});
      setEmployeeSuggestions([]);
      setEmployeeNonLaborAccounts([]);
      setSubContractorNonLaborAccounts([]);
    }, [planId, projectId]); // Reset when planId or projectId changes

    const syncScroll = (sourceRef, targetRef) => {
      if (!sourceRef.current || !targetRef.current) return;
      // Only sync if not already in an update
      if (!scrollingLock.current) {
        scrollingLock.current = true;
        targetRef.current.scrollTop = sourceRef.current.scrollTop;
        // Allow event on next tick
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

    const fetchData = async (resetPage = false) => {
      if (!startDate || !endDate || !planId) {
        // setDurations([]);
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      if(resetPage) setAmountPage(1)

      // setIsLoading(true);
      if (!isSilentRefreshing.current) {
        setIsLoading(true);
      }
      setError(null);

      // setIsDataLoading(true);

      try {
        // const durationResponse = await axios.get(
        //   `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startDate}/${endDate}`,
        // );
        // if (!Array.isArray(durationResponse.data)) {
        //   throw new Error("Invalid duration response format");
        // }
        // const fetchedDurations = durationResponse.data;
        // setDurations(fetchedDurations);
        const year = new Date().getFullYear();
        const apiFiscalYear = propFiscalYear === "All" ? "" : propFiscalYear;
        const response = await axios.get(
          `${backendUrl}/Project/GetDirectCostForecastByPlanIDPaged/${planId}/${apiFiscalYear}?emplid=${searchTerm}&pageNumber=${amountPage}&pageSize=${pageSize}`,
          // /${searchTerm}
        );
        setTotalRecords(response.data.totalRecords);
        const ceilValue = Math.ceil(response.data.totalRecords / pageSize);
        setTotalPages(ceilValue);
        const apiData = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
        if (apiData.length === 0) {
          setEmployees([]);
          // toast.info("No forecast data available for this plan.", {
          //   toastId: "no-forecast-data",
          //   autoClose: 3000,
          // });
        } else {
          const updatedEmployees = apiData.map((item, idx) => ({
            emple: {
              empleId: item.empl?.id || `auto-${idx}`,
              emplId: item.empl?.id || "",
              firstName: item.empl?.firstName || "",
              lastName: item.empl?.lastName || "",
              accId: item.empl?.acctId || "",
              orgId: item.empl?.orgId || "",
              perHourRate: item.empl?.hrRate || "",
              isRev: item.empl?.isRev || false,
              isBrd: item.empl?.isBrd || false,
              status: item.empl?.status || "Act",
              type: item.empl?.type || "",
              category: item.empl?.category || "",
              dctId: item.dctId || 0,
              plId: item.pl_ID || 0,
              plForecasts: item.empl?.plForecasts || [],
            },
          }));
          setEmployees(updatedEmployees);
        }
        setInputValues({});
        setNewEntryPeriodAmounts({});
      } catch (err) {
        setError("Failed to load data. Please try again.");
        if (err.response && err.response.status === 500) {
          setEmployees([]);
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
        // setIsDataLoading(false)
        isSilentRefreshing.current = false;
      }
    };
    useEffect(() => {
      fetchData();
    }, [startDate, endDate, planId, refreshKey, amountPage, propFiscalYear, pageSize]); // Added propFiscalYear for refetch on fiscal year change

    // const getAccountSuggestionsByType = (type) => {
    //   const normalizedType = type?.toLowerCase() || "";
    //   if (normalizedType === "employee") return employeeNonLaborAccounts;
    //   if (normalizedType === "vendor" || normalizedType === "vendor employee")
    //     return subContractorNonLaborAccounts;
    //   return [
    //     ...employeeNonLaborAccounts,
    //     ...subContractorNonLaborAccounts,
    //     ...otherDirectCostNonLaborAccounts,
    //   ];
    // };

    const getAccountSuggestionsByType = (type) => {
      const normalizedType = type?.toLowerCase() || "";
      if (normalizedType === "") return subContractorNonLaborAccounts;
      if (normalizedType === "employee") return employeeNonLaborAccounts;
      if (
        normalizedType === "vendor" ||
        normalizedType === "Vendor" ||
        normalizedType === "vendor employee" ||
        normalizedType === "Vendor Employee" ||
        normalizedType === "VendorEmployee"
      )
        return [...employeeNonLaborAccounts, ...subContractorNonLaborAccounts];
      return [
        ...employeeNonLaborAccounts,
        ...subContractorNonLaborAccounts,
        ...otherDirectCostNonLaborAccounts,
        ...employeeLaborAccounts,
    ...subContractorLaborAccounts,
    ...otherDirectCostLaborAccounts,
      ];
    };

    useEffect(() => {
      const loadOrganizationOptions = async () => {
        try {
          // const response = await axios.get(
          //   `${backendUrl}/Orgnization/GetAllOrgs`,
          // );
          const response = allOrgData || []
          const orgOptions = Array.isArray(response)
            ? response.map((org) => ({
                value: org.orgId,
                // label: `${org.orgId} - ${org.orgName}`,
                label: org.orgName,
                orgName: org.orgName,
              }))
            : [];
          setOrganizationOptions(orgOptions);
          // console.log('✅ Loaded', orgOptions.length, 'organizations'); // DEBUG
        } catch (err) {
          // console.error('Failed to fetch organizations', err);
        }
      };
      loadOrganizationOptions(); // ✅ Run immediately
    }, [allOrgData]); // ✅ Empty deps = mount only

useEffect(() => {
  const fetchEmpVen = async () => {
    try {
      const [empRes, venRes] = await Promise.all([
        // axios.get(
        //   `${backendUrl}/Project/GetVenderEmployeesByProject/${encodeURIComponent(projectId)}?type=othercost&accountGroupCode=${groupCd || ""}`
        // ),
        axios.get(
          `${backendUrl}/Project/GetVenderEmployeesByProject/${encodeURIComponent(projectId)}?type=othercost`
        ),
        axios.get(
          `${backendUrl}/Project/GetEmployeesByProjectV1/${encodeURIComponent(projectId)}?type=othercost&accountGroupCode=${groupCd || ""}`
        )
      ]);

      setAllEmployeeData(empRes.data);
      setAllVendorData(venRes.data);

    } catch (error) {
      console.error("Error fetching employee/vendor data:", error);
    }
  };

  if (projectId) {
    fetchEmpVen();
  }
}, []);

    useEffect(() => {
      // const formOpen = showNewForm || isEditable;
      // Force true so account names can always be resolved from the backend list
      const formOpen = showNewForm || isEditable || true;

      const fetchEmployees = async () => {
        if (!projectId || !formOpen) {
          setEmployeeSuggestions([]);
          return;
        }

        try {
          // if(allEmployeeData || allVendorData){
          //   console.log(allEmployeeData, allVendorData)
          //   return 
          // } 
          const isVendorRelated =
            newEntry.idType === "Vendor" ||
            newEntry.idType === "Vendor Employee" ||
            newEntries.some(
              (e) => e.idType === "Vendor" || e.idType === "Vendor Employee",
            );

          // const endpoint = isVendorRelated
          //   ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodeURIComponent(projectId)}?type=othercost`
          //   : `${backendUrl}/Project/GetEmployeesByProject/${encodeURIComponent(projectId)}?type=othercost`;
          const endpoint = isVendorRelated
            ? allVendorData
            : allEmployeeData

          // const response = await axios.get(endpoint);
          const response = endpoint;

          if(isVendorRelated){
            setAllVendorData(response?.data)
          } else {
            setAllEmployeeData(response?.data)

          }

          const suggestions = Array.isArray(response)
            ? response.map((emp) => {
                if (
                  newEntry.idType === "Vendor" ||
                  newEntries.some((e) => e.idType === "Vendor")
                ) {
                  return {
                    emplId: emp.vendId || "",
                    firstName: "",
                    lastName: emp.employeeName || "",
                    orgId: emp.orgId,
                    acctId: emp.acctId,
                    acctName: emp.acctName || "",
                  };
                } else if (
                  newEntry.idType === "Vendor Employee" ||
                  newEntries.some((e) => e.idType === "Vendor Employee")
                ) {
                  return {
                    emplId: emp.empId || "",
                    firstName: "",
                    lastName: emp.employeeName || "",
                    orgId: emp.orgId,
                    acctId: emp.acctId,
                    acctName: emp.acctName || "",
                  };
                } else {
                  const [lastName, firstName] = (emp.employeeName || "")
                    .split(", ")
                    .map((str) => str.trim());
                  return {
                    emplId: emp.empId || "",
                    firstName: firstName || "",
                    lastName: lastName || "",
                    orgId: emp.orgId,
                    acctId: emp.acctId,
                    acctName: emp.acctName || "",
                  };
                }
              })
            : [];
          setEmployeeSuggestions(suggestions);
        } catch (err) {
          setEmployeeSuggestions([]);
          toast.error(
            `Failed to fetch ${
              newEntry.idType === "Vendor" ||
              newEntry.idType === "Vendor Employee"
                ? "vendor "
                : ""
            }employee suggestions for project ID ${projectId}`,
          );
        }
      };

      const fetchNonLaborAccounts = async () => {
        if (!projectId || !formOpen) {
          setEmployeeNonLaborAccounts([]);
          setSubContractorNonLaborAccounts([]);
          setNonLaborAccounts([]);
          setEmployeeLaborAccounts([]);
    setSubContractorLaborAccounts([]);
    setOtherDirectCostLaborAccounts([]);
          return;
        }

        try {
          // const response = await axios.get(
          //   `${backendUrl}/Project/GetAllProjectByProjId/${projectId}/${planType}`,
          // );

          const data = allData || []

          // Standard mapper to ensure accountId and acctName are consistent
          const mapAcc = (account) => ({
            accountId: account.accountId,
            acctName: account.acctName,
          });

          // Extract the three specific lists from API response
          const empAccs = (data?.employeeNonLaborAccounts || []).map(mapAcc);
          const subAccs = (data?.subContractorNonLaborAccounts || []).map(
            mapAcc,
          );
          const otherOdcAccs = (data?.otherDirectCostNonLaborAccounts || []).map(
            mapAcc,
          );

          // Extract lists using your specific naming
    const empAcct = (data?.employeeLaborAccounts || []).map(mapAcc);
    const subAcct = (data?.sunContractorLaborAccounts || []).map(mapAcc);
    const odcAcct = (data?.otherDirectCostLaborAccounts || []).map(mapAcc);

    setEmployeeLaborAccounts(empAcct);
    setSubContractorLaborAccounts(subAcct);
    setOtherDirectCostLaborAccounts(odcAcct);

          // Store them in individual states for reference
          setEmployeeNonLaborAccounts(empAccs);
          setSubContractorNonLaborAccounts(subAccs);
          setOtherDirectCostNonLaborAccounts(otherOdcAccs);

          setAccountOptionsWithNames([...empAccs, ...subAccs, ...otherOdcAccs ,...empAcct,...subAcct,...odcAcct]);

          // --- LOGIC CHANGE START ---
          let filteredList = [];

          if (newEntry.idType === "Employee") {
            // Rule 1: Employee type sees Employee accounts only
            filteredList = empAccs;
          } else if (
            newEntry.idType === "Vendor" ||
            newEntry.idType === "Vendor Employee"
          ) {
            // Rule 2: Vendor types see SubContractor accounts only
            filteredList = subAccs;
          } else if (newEntry.idType === "Other") {
            // Rule 3: Other type sees ALL (Employee + Sub + ODC)
            filteredList = [...empAccs, ...subAccs, ...otherOdcAccs];
          } else {
            // Default fallback
            filteredList = [...empAccs, ...subAccs, ...otherOdcAccs];
          }

          setNonLaborAccounts(filteredList);
          // --- LOGIC CHANGE END ---
        } catch (err) {
          console.error("Failed to fetch non-labor accounts", err);
        }
      };

      if (formOpen) {
        fetchEmployees();
        fetchNonLaborAccounts();
      } else {
        setEmployeeNonLaborAccounts([]);
        setSubContractorNonLaborAccounts([]);
        setEmployeeSuggestions([]);
      }
    }, [projectId, showNewForm, newEntry.idType, newEntries, isEditable, allData]);

    useEffect(() => {
      const handleKeyDown = async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
          // Only handle if conditions are met
          if (hasClipboardData && copiedRowsData.length > 0) {
            // e.preventDefault();
            // e.stopPropagation();
            handlePasteMultipleRows();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
      hasClipboardData,
      copiedRowsData,
      propFiscalYear,
      durations,
      showNewForm,
      projectId,
      planType,
    ]); // Add all dependencies

    const handleIdChange = (value) => {
      // 1. Remove Emojis immediately from the input
      const rawValue = value.replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        "",
      );

      // 2. Create a trimmed version for lookups/validation
      const trimmedValue = rawValue.trim();

      // --- FIX: Bypass validation if ID Type is "Other" ---
      if (newEntry.idType === "Other") {
        setNewEntry((prev) => ({
          ...prev,
          id: rawValue, // Use the sanitized rawValue (spaces allowed, emojis removed)
          firstName: "", // Reset names or keep logic to parse them later
          lastName: "",
          // Keep existing account if selected, otherwise default
          acctId:
            prev.acctId ||
            (nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : ""),
          orgId: "",
        }));
        return; // Stop here, do not run duplicate/employee checks
      }

      // --- EXISTING LOGIC FOR EMPLOYEE / VENDOR ---

      // 1. Check for duplicate ID
      const isDuplicateId = employees.some((emp) => {
        const emple = emp.emple;
        if (!emple) return false;
        return (
          emple.emplId === trimmedValue && // Use trimmed for comparison
          emple.accId === newEntry.acctId &&
          emple.plcGlcCode === newEntry.plcGlcCode
        );
      });

      if (isDuplicateId) {
        toast.error(
          "ID with the same Account and PLC is already present, so can't save.",
          {
            toastId: "duplicate-id-error",
            autoClose: 3000,
          },
        );
        // Update input to show what user typed (sanitized), but don't proceed with selection
        setNewEntry((prev) => ({
          ...prev,
          id: rawValue,
          firstName: "",
          lastName: "",
          acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
          orgId: "",
        }));
        return;
      }

      // 2. Check against Suggestions (Validation)
      // Only run this check if the user has typed something
      if (trimmedValue.length > 0) {
        const partialMatch = employeeSuggestions.some((emp) =>
          emp.emplId.startsWith(trimmedValue),
        );

        if (!partialMatch) {
          toast.error("Invalid Employee ID, please select a valid one!", {
            toastId: "invalid-employee-id",
            autoClose: 3000,
          });

          setNewEntry((prev) => ({
            ...prev,
            id: rawValue, // Allow typing to continue (sanitized)
            firstName: "",
            lastName: "",
            acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
            orgId: "",
          }));
          return;
        }
      }

      // 3. Valid Input - Try to find exact match
      const selectedEmployee = employeeSuggestions.find(
        (emp) => emp.emplId === trimmedValue,
      );

      setNewEntry((prev) => ({
        ...prev,
        id: rawValue, // Keep spaces in the input field
        firstName: selectedEmployee ? selectedEmployee.firstName || "" : "",
        lastName: selectedEmployee ? selectedEmployee.lastName || "" : "",
        acctId: nonLaborAccounts.length > 0 ? nonLaborAccounts[0].id : "",
        orgId: selectedEmployee?.orgId ? String(selectedEmployee.orgId) : "",
      }));
    };

    const handleRowFieldChange = (rowIdx, field, value) => {
      if (!isFieldEditable || !isEditable) return;
      setEditedRowData((prev) => ({
        ...prev,
        [rowIdx]: {
          ...prev[rowIdx],
          [field]: value,
        },
      }));

      setHasUnsavedFieldChanges(true);
      setEditingRowIndex(rowIdx);
    };

    const handleRowFieldBlur = async (rowIdx, emp) => {
      if (!isFieldEditable || !isEditable) return;
      if (!emp || !emp.emple) {
        toast.error("Employee data is missing for update.");
        return;
      }

      const edited = editedRowData[rowIdx];
      if (
        edited.acctId === undefined &&
        edited.orgId === undefined &&
        edited.isRev === undefined &&
        edited.isBrd === undefined
      ) {
        return;
      }

      const payload = {
        dctId: emp.emple.dctId || 0,
        plId: emp.emple.plId || 0,
        category:
    edited?.name !== undefined
      ? edited.name
      : emp.emple.category || "",
        accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
        orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
        type: emp.emple.type || "",
        // category: emp.emple.category || "",
        amountType: emp.emple.amountType || "",
        id: emp.emple.emplId || "",
        isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
        isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
        createdBy: emp.emple.createdBy || "System",
        lastModifiedBy: "System",
      };

      // ✅ FIXED VALIDATION - Only validate if account was changed
      if (edited.acctId !== undefined) {
        const validAccounts =
          emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee"
            ? subContractorNonLaborAccounts.map((a) => a.id || a.accountId)
            : emp.emple.type === "Other"
              ? [
                  // START FIX: Combine all three lists for 'Other'
                  ...employeeNonLaborAccounts,
                  ...subContractorNonLaborAccounts,
                  ...otherDirectCostNonLaborAccounts,
                ]
              : employeeNonLaborAccounts.map((a) => a.id || a.accountId);

        if (payload.accId && !validAccounts.includes(payload.accId)) {
          toast.error("Please select a valid account from suggestions");
          return; // stop here, don't call API or show success
        }
      }

      // Validate orgId against organizationOptions - Only if changed
      if (edited.orgId !== undefined) {
        const validOrgs = organizationOptions.map((org) => org.value);
        if (payload.orgId && !validOrgs.includes(payload.orgId)) {
          toast.error("Please select a valid organization from suggestions");
          return; // block update
        }
      }

      try {
        await axios.put(
          `${backendUrl}DirectCost/UpdateDirectCost?plid=${planId}&TemplateId=${templateId}`,
          {
            ...payload,
            acctId: payload.accId,
          },
          {
            headers: { "Content-Type": "application/json" },
          },
        );

        setEditedRowData((prev) => {
          const newData = { ...prev };
          delete newData[rowIdx];
          return newData;
        });

        setEmployees((prev) => {
          const updated = [...prev];
          updated[rowIdx] = {
            ...updated[rowIdx],
            emple: {
              ...updated[rowIdx].emple,
              ...payload,
            },
          };
          return updated;
        });

        toast.success("Employee updated successfully!", {
          toastId: `employee-update-${rowIdx}`,
          autoClose: 2000,
        });
      } catch (err) {
        toast.error(
          `Failed to update row: ${err.response?.data?.message || err.message}`,
        );
      }
    };

    // Memoized org lookup for instant name resolution
    const orgLookup = useMemo(() => {
      const lookup = new Map();
      (organizationOptions || []).forEach((org) => {
        lookup.set(org.value.toString(), org);
      });
      return lookup;
    }, [organizationOptions]);

    const getEmployeeRow = (emp, idx) => {
      // console.log(emp)
      const monthAmounts = getMonthAmounts(emp);
      const totalAmount = sortedDurations.reduce((sum, duration) => {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
        const inputValue = inputValues[`${idx}_${uniqueKey}`];
        const forecastValue = monthAmounts[uniqueKey]?.value;
        const value =
          inputValue !== undefined && inputValue !== ""
            ? inputValue
            : forecastValue;
        return sum + (value && !isNaN(value) ? Number(value) : 0);
      }, 0);

      const formatIdType = (str) => {
        if (!str || str === "-") return "-";

        // If string contains multiple words (e.g., "Vendor Employee")
        return str
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" ");
      };

      const organizationId = emp.emple?.orgId;
      let resolvedOrgName = "-";
      if (organizationId && organizationOptions.length > 0) {
        const matchedOrg = organizationOptions.find(
          (org) => org.value.toString() === organizationId.toString(),
        );
        resolvedOrgName = matchedOrg
          ? matchedOrg.orgName ||
            matchedOrg.label.split(" - ")[1] ||
            organizationId
          : organizationId;
      }
      return {
        // idType: emp.emple.type || "-",
        idType: formatIdType(emp.emple.type || "-"),
        emplId: emp.emple.emplId || "-",
        name:
          emp.emple.category || emp.emple.firstName || emp.emple.lastName
            ? emp.emple.category ||
              `${emp.emple.lastName || ""}${
                emp.emple.firstName && emp.emple.lastName ? ", " : ""
              }${emp.emple.firstName || ""}`
            : "-",
        acctId: emp.emple.accId || "-",
        acctName: (() => {
          const accountId = emp.emple.accId || "-";
          const accountWithName = accountOptionsWithNames.find(
            (acc) => acc.accountId === accountId,
          );
          return accountWithName ? accountWithName.acctName : "-";
        })(),
        orgId: emp.emple?.orgId || "-", // ✅ Column 6
        orgName: resolvedOrgName || "-",
        isRev: emp.emple.isRev ? (
          <span className="text-green-600 font-sm text-xl">✓</span>
        ) : (
          "-"
        ),
        isBrd: emp.emple.isBrd ? (
          <span className="text-green-600 font-sm text-xl">✓</span>
        ) : (
          "-"
        ),
        status: emp.emple.status || "-",
        total: totalAmount.toFixed(2) || "-",
      };
    };

//     const handleInputChange = (empIdx, uniqueKey, newValue) => {
//       if (!isEditable) return;
// const cleanValue = newValue
//     .replace(/[^0-9.-]/g, "")           // Remove everything except 0-9, dot, and minus
//     .replace(/(?!^)-/g, "")             // Remove minus signs if they aren't at the start
//     .replace(/(\..*?)\..*/g, "$1");     // Prevent multiple decimal points
//       const numericValue = stripCommas(cleanValue);

//       const currentDuration = sortedDurations.find(
//         (d) => `${d.monthNo}_${d.year}` === uniqueKey,
//       );

//       if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
//         toast.warn("Cannot edit amounts for a closed period.", {
//           toastId: "closed-period-warning",
//           autoClose: 3000,
//         });
//         return;
//       }

//       if (cleanValue === "" || /^\d*\.?\d*$/.test(cleanValue)) {
//         // console.log(
//         //   `Updating inputValues for ${empIdx}_${uniqueKey}:`,
//         //   newValue,
//         // );
//         setInputValues((prev) => ({
//           ...prev,
//           [`${empIdx}_${uniqueKey}`]: cleanValue,
//         }));

//         // Track modified amounts for save functionality
//         setModifiedAmounts((prev) => ({
//           ...prev,
//           [`${empIdx}_${uniqueKey}`]: {
//             empIdx,
//             uniqueKey,
//             // cleanValue,
//             newValue: cleanValue,
//             employee: employees[empIdx],
//           },
//         }));

//         setHasUnsavedAmountChanges(true);
//       }
//     };

const handleInputChange = (empIdx, uniqueKey, newValue) => {
  if (!isEditable) return;

  // 1. Clean the input string
  const cleanValue = newValue
    .replace(/[^0-9.-]/g, "")           // Remove everything except 0-9, dot, and minus
    .replace(/(?!^)-/g, "")             // Remove minus signs if they aren't at the start
    .replace(/(\..*?)\..*/g, "$1");     // Prevent multiple decimal points

  // 2. Check month editability
  const currentDuration = sortedDurations.find(
    (d) => `${d.monthNo}_${d.year}` === uniqueKey,
  );

  if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
    toast.warn("Cannot edit amounts for a closed period.", {
      toastId: "closed-period-warning",
      autoClose: 3000,
    });
    return;
  }

  // 3. ALLOW THE STATE UPDATE (Fixed Regex)
  // Logic: allow empty, OR allow (optional minus + digits + optional dot + digits)
  if (cleanValue === "" || /^-?\d*\.?\d*$/.test(cleanValue)) {
    setInputValues((prev) => ({
      ...prev,
      [`${empIdx}_${uniqueKey}`]: cleanValue,
    }));

    // Track modified amounts for save functionality
    setModifiedAmounts((prev) => ({
      ...prev,
      [`${empIdx}_${uniqueKey}`]: {
        empIdx,
        uniqueKey,
        newValue: cleanValue,
        employee: employees[empIdx],
      },
    }));

    setHasUnsavedAmountChanges(true);
  }
};

    const handleSaveAllAmounts = async () => {
      // if (Object.keys(modifiedAmounts).length === 0) {
      //   toast.info("No changes to save.", { autoClose: 2000 });
      //   return;
      // }
 
      setIsLoading(true);
      let successCount = 0;
      let errorCount = 0;
 
      try {
        // Prepare bulk payload array - DO NOT use individual updates
        const bulkPayload = [];
 
        for (const key in modifiedAmounts) {
          const { empIdx, uniqueKey, newValue, employee } =
            modifiedAmounts[key];
 
          const newNumericValue = newValue === "" ? 0 : Number(newValue);
          const emp = employee;
          const monthAmounts = getMonthAmounts(emp);
          const forecast = monthAmounts[uniqueKey];
 
          // if (!forecast || !forecast.forecastid) {
          //   errorCount++;
          //   continue;
          // }
 
          const currentDuration = sortedDurations.find(
            (d) => `${d.monthNo}_${d.year}` === uniqueKey,
          );
 
          if (!isMonthEditable(currentDuration, closedPeriod, planType)) {
            errorCount++;
            continue;
          }
 
         
          const payload = {
            forecastedamt:
              planType === "EAC"
                ? (forecast?.forecastedamt ?? 0)
                : Number(newNumericValue) || 0,
            actualamt:
              planType === "EAC"
                ? Number(newNumericValue) || 0
                : (forecast?.actualamt ?? 0),
            forecastid: Number(forecast?.forecastid ?? 0),
            projId: String(forecast?.projId ?? projectId ?? ""),
            plId: Number(forecast?.plId ?? planId ?? 0),
            emplId: String(forecast?.emplId ?? emp?.emple?.emplId ?? ""),
            // dctId: Number(forecast?.dctId ?? 0),
            dctId: Number(forecast?.dctId ?? emp?.emple?.dctId ?? 0),
            month: Number(forecast?.month ?? currentDuration?.monthNo ?? 0),
            year: Number(forecast?.year ?? currentDuration?.year ?? 0),
            totalBurdenCost: Number(forecast?.totalBurdenCost ?? 0),
            fees: Number(forecast?.fees ?? 0),
            burden: Number(forecast?.burden ?? 0),
            ccffRevenue: Number(forecast?.ccffRevenue ?? 0),
            tnmRevenue: Number(forecast?.tnmRevenue ?? 0),
            revenue: Number(forecast?.revenue ?? 0),
            cost: Number(forecast?.cost ?? 0),
            forecastedCost: Number(forecast?.forecastedCost ?? 0),
            fringe: Number(forecast?.fringe ?? 0),
            overhead: Number(forecast?.overhead ?? 0),
            gna: Number(forecast?.gna ?? 0),
            materials: Number(forecast?.materials ?? 0),
            forecastedhours: Number(forecast?.forecastedhours ?? 0),
            actualhours: Number(forecast?.actualhours ?? 0),
            createdat: forecast?.createdat ?? new Date().toISOString(),
            updatedat: new Date().toISOString(),
            displayText: String(forecast?.displayText ?? ""),
            acctId: String(emp?.emple?.accId ?? ""),
            orgId: String(emp?.emple?.orgId ?? ""),
            // plc: String(emp?.emple?.plcGlcCode ?? ""),
            empleId: Number(emp?.emple?.id ?? 0),
            hrlyRate: Number(parseFloat(emp?.emple?.perHourRate ?? 0) || 0),
            effectDt: new Date().toISOString().split("T")[0],
            // emple: emp?.emple
            //   ? {
            //       id: Number(emp.emple.id ?? 0),
            //       emplId: String(emp.emple.emplId ?? ""),
            //       orgId: String(emp.emple.orgId ?? ""),
            //       firstName: String(emp.emple.firstName ?? ""),
            //       lastName: String(emp.emple.lastName ?? ""),
            //       plcGlcCode: String(emp.emple.plcGlcCode ?? ""),
            //       perHourRate: Number(
            //         parseFloat(emp.emple.perHourRate ?? 0) || 0,
            //       ),
            //       salary: Number(parseFloat(emp.emple.salary ?? 0) || 0),
            //       accId: String(emp.emple.accId ?? ""),
            //       hireDate:
            //         emp.emple.hireDate ??
            //         new Date().toISOString().split("T")[0],
            //       isRev: Boolean(emp.emple.isRev ?? false),
            //       isBrd: Boolean(emp.emple.isBrd ?? false),
            //       createdAt: emp.emple.createdAt ?? new Date().toISOString(),
            //       type: String(emp.emple.type ?? ""),
            //       status: String(emp.emple.status ?? ""),
            //       plId: Number(planId ?? 0),
            //       isWarning: Boolean(emp.emple.isWarning ?? false),
            //       plForecasts: [],
            //       organization: emp.emple.organization || null,
            //       plProjectPlan: emp.emple.plProjectPlan || null,
            //     }
            //   : null,
          };
          // if(payload.forecastedamt > 10000000){
          //     toast.error(
          //       `Cannot save. Amount for ID ${payload.emplId} exceed limit of ${10000000}.`,
          //       { autoClose: 5000 },
          //     );
          //     return;
          // }
          bulkPayload.push(payload);
          successCount++;
        }
 
        // if (bulkPayload.length === 0) {
        //   toast.warning("No valid entries to save.", { autoClose: 3000 });
        //   return;
        // }
 
        // SINGLE BULK API CALL - NOT individual updates
        // console.log(
        //   "Calling BULK amount API:",
        //   `${backendUrl}/Forecast/BulkUpdateForecastAmount/${planType}`,
        // );
        // console.log("Bulk Payload:", JSON.stringify(bulkPayload, null, 2));
 
        if (bulkPayload.length > 0) {
        await axios.put(
          `${backendUrl}/Forecast/BulkUpdateForecastAmountV1/${planType}?plid=${planId}&templateid=${templateId}`,
          bulkPayload,
          { headers: { "Content-Type": "application/json" } },
        );
      }
 
        // const response = await axios.put(
        //   `${backendUrl}/Forecast/BulkUpdateForecastAmountV1/${planType}?plid=${planId}&templateid=${templateId}`,
        //   bulkPayload,
        //   { headers: { "Content-Type": "application/json" } },
        // );
 
        // console.log("Bulk amount update SUCCESS:", response.data);
 
        // Update local state for all successful updates
        setEmployees((prev) => {
          const updated = [...prev];
 
          for (const key in modifiedAmounts) {
            const { empIdx, uniqueKey, newValue } = modifiedAmounts[key];
            const newNumericValue = newValue === "" ? 0 : Number(newValue);
 
            if (
              updated[empIdx] &&
              updated[empIdx].emple &&
              updated[empIdx].emple.plForecasts
            ) {
              const currentDuration = sortedDurations.find(
                (d) => `${d.monthNo}_${d.year}` === uniqueKey,
              );
 
              const forecastIndex = updated[empIdx].emple.plForecasts.findIndex(
                (f) =>
                  f.month === currentDuration?.monthNo &&
                  f.year === currentDuration?.year,
              );
 
              if (forecastIndex !== -1) {
                if (planType === "EAC") {
                  updated[empIdx].emple.plForecasts[forecastIndex].actualamt =
                    newNumericValue;
                } else {
                  updated[empIdx].emple.plForecasts[
                    forecastIndex
                  ].forecastedamt = newNumericValue;
                }
                // Update the displayed value as well
                updated[empIdx].emple.plForecasts[forecastIndex].value =
                  newNumericValue;
              }
            }
          }
 
          return updated;
        });
 
        // Clear modified amounts and reset flags
        setModifiedAmounts({});
        setHasUnsavedAmountChanges(false);
 
        // toast.success(`Successfully saved ${successCount} amount entries`, {
        //   autoClose: 3000,
        // });
 
        if (errorCount > 0) {
          toast.warning(`${errorCount} entries could not be processed.`, {
            autoClose: 3000,
          });
          return false;
        }
 
        // return true;
 
        // DO NOT call onSaveSuccess to avoid refetch
        // The local state update above should be sufficient
      } catch (err) {
        // console.error("Bulk amount update ERROR:", err);
        // toast.error(
        //   "Failed to save amounts via BULK API: " +
        //     (err.response?.data?.message || err.message),
        //   {
        //     toastId: "save-amounts-error",
        //     autoClose: 3000,
        //   },
        // );
        toast.error("Failed to save amounts: " + (err.response?.data?.message || err.message));
      return false;
      } finally {
        setIsLoading(false);
      }
    };

    // Combined save handler for both amounts and field changes
    const handleSaveAllChanges = async () => {
      if (hasUnsavedAmountChanges && hasUnsavedFieldChanges) {
        // Save both amounts and field changes
        await Promise.all([handleSaveAllAmounts(), handleSaveFieldChanges()]);
      } else if (hasUnsavedAmountChanges) {
        // Save only amounts
        await handleSaveAllAmounts();
      } else if (hasUnsavedFieldChanges) {
        // Save only field changes
        await handleSaveFieldChanges();
      }
    };

    // const handleSaveFieldChanges = async () => {
    //   if (editingRowIndex === null || !editedRowData[editingRowIndex]) {
    //     // Return true because there was nothing to save (not a failure)
    //     return true;
    //   }

  

    //   const emp = employees[editingRowIndex];
    //   if (!emp || !emp.emple) {
    //     toast.error("Employee data is missing for update.");
    //     return false;
    //   }

    //   const edited = editedRowData[editingRowIndex];

    //   // --- START VALIDATION LOGIC ---
    //   let validAccounts = [];

    //   if (emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee") {
    //     validAccounts = subContractorNonLaborAccounts.map(
    //       (a) => a.id || a.accountId || "",
    //     );
    //   } else if (emp.emple.type === "Other") {
    //     validAccounts = [
    //       ...employeeNonLaborAccounts.map((a) => a.id || a.accountId || ""),
    //       ...subContractorNonLaborAccounts.map(
    //         (a) => a.id || a.accountId || "",
    //       ),
    //       ...otherDirectCostNonLaborAccounts.map(
    //         (a) => a.id || a.accountId || "",
    //       ),
    //     ];
    //   } else {
    //     validAccounts = employeeNonLaborAccounts.map(
    //       (a) => a.id || a.accountId || "",
    //     );
    //   }

    //   if (edited.acctId && !validAccounts.includes(edited.acctId)) {
    //     toast.error("Please select a valid account from suggestions");
    //     return false; // STOP: Returns false to prevent Master Save success toast
    //   }

    //   const validOrgs = organizationOptions.map((org) => org.value);
    //   if (edited.orgId && !validOrgs.includes(edited.orgId)) {
    //     toast.error("Please select a valid organization from suggestions");
    //     return false; // STOP
    //   }
    //   // --- END VALIDATION LOGIC ---

    //   const payload = {
    //     dctId: emp.emple.dctId || 0,
    //     plId: emp.emple.plId || 0,
    //    category:
    // edited?.name !== undefined
    //   ? edited.name
    //   : emp.emple.category || "",
  
    //     accId: edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
    //     orgId: edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
    //     type: emp.emple.type || "",
    //     // category: emp.emple.category || "",
    //     amountType: emp.emple.amountType || "",
    //     id: emp.emple.emplId || "",
    //     isRev: edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
    //     isBrd: edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
    //     createdBy: emp.emple.createdBy || "System",
    //     lastModifiedBy: "System",
    //   };

    //   setIsLoading(true);
    //   try {
    //     await axios.put(
    //       `${backendUrl}/DirectCost/UpdateDirectCost?plid=${planId}&TemplateId=${templateId}`,
    //       { ...payload, acctId: payload.accId },
    //       { headers: { "Content-Type": "application/json" } },
    //     );

    //     setEditedRowData((prev) => {
    //       const newData = { ...prev };
    //       delete newData[editingRowIndex];
    //       return newData;
    //     });

    //     setEmployees((prev) => {
    //       const updated = [...prev];
    //       updated[editingRowIndex] = {
    //         ...updated[editingRowIndex],
    //         emple: { ...updated[editingRowIndex].emple, ...payload },
    //       };
    //       return updated;
    //     });

    //     setEditingRowIndex(null);
    //     setHasUnsavedFieldChanges(false);

    //     // toast.success("Employee updated successfully!", {
    //     //   toastId: `employee-update-${editingRowIndex}`,
    //     //   autoClose: 2000,
    //     // });
    //     return true; // SUCCESS: Allows Master Save to continue
    //   } catch (err) {
    //     toast.error(
    //       "Failed to update employee: " +
    //         (err.response?.data?.message || err.message),
    //     );
    //     return false; // FAILURE: Blocks Master Save success toast
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

const handleSaveFieldChanges = async () => {
  if (Object.keys(editedRowData).length === 0) {
    return true;
  }

  setIsLoading(true);

  try {
    for (const rowIndex in editedRowData) {
      const emp = employees[rowIndex];

      if (!emp || !emp.emple) {
        toast.error("Employee data is missing for update.");
        return false;
      }

      const edited = editedRowData[rowIndex];

      // --- START VALIDATION LOGIC ---
      let validAccounts = [];

      if (emp.emple.type === "Vendor" || emp.emple.type === "Vendor Employee") {
        validAccounts = subContractorNonLaborAccounts.map(
          (a) => a.id || a.accountId || ""
        );
      } else if (emp.emple.type === "Other") {
        validAccounts = [
          ...employeeNonLaborAccounts.map((a) => a.id || a.accountId || ""),
          ...subContractorNonLaborAccounts.map(
            (a) => a.id || a.accountId || ""
          ),
          ...otherDirectCostNonLaborAccounts.map(
            (a) => a.id || a.accountId || ""
          ),
        ];
      } else {
        validAccounts = employeeNonLaborAccounts.map(
          (a) => a.id || a.accountId || ""
        );
      }

      if (edited.acctId && !validAccounts.includes(edited.acctId)) {
        toast.error("Please select a valid account from suggestions");
        return false;
      }

      const validOrgs = organizationOptions.map((org) => org.value);

      if (edited.orgId && !validOrgs.includes(edited.orgId)) {
        toast.error("Please select a valid organization from suggestions");
        return false;
      }
      // --- END VALIDATION LOGIC ---

      const payload = {
        dctId: emp.emple.dctId || 0,
        plId: emp.emple.plId || 0,
        category:
          edited?.name !== undefined
            ? edited.name
            : emp.emple.category || "",
        accId:
          edited.acctId !== undefined ? edited.acctId : emp.emple.accId,
        orgId:
          edited.orgId !== undefined ? edited.orgId : emp.emple.orgId,
        type: emp.emple.type || "",
        amountType: emp.emple.amountType || "",
        id: emp.emple.emplId || "",
        isRev:
          edited.isRev !== undefined ? edited.isRev : emp.emple.isRev,
        isBrd:
          edited.isBrd !== undefined ? edited.isBrd : emp.emple.isBrd,
        createdBy: emp.emple.createdBy || "System",
        lastModifiedBy: "System",
      };

      await axios.put(
        `${backendUrl}/DirectCost/UpdateDirectCost?plid=${planId}&TemplateId=${templateId}`,
        { ...payload, acctId: payload.accId },
        { headers: { "Content-Type": "application/json" } }
      );

      // Update local state
      setEmployees((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          emple: { ...updated[rowIndex].emple, ...payload },
        };
        return updated;
      });
    }

    // Clear edited rows
    setEditedRowData({});
    setEditingRowIndex(null);
    setHasUnsavedFieldChanges(false);

    return true;
  } catch (err) {
    toast.error(
      "Failed to update employee: " +
        (err.response?.data?.message || err.message)
    );
    return false;
  } finally {
    setIsLoading(false);
  }
};
    const handleMasterSave = async () => {
      
      const hasNewEntries = newEntries?.length > 0;
const hasEmployeeChanges = hasUnsavedAmountChanges;
const hasAmtChanges = hasUnsavedAmountChanges;


      setIsLoading(true);
      try {
        let saveSuccess = true;

        // 1. Handle Multiple Pasted Entries (POST)
        if (newEntries.length > 0) {
          saveSuccess = await handleSaveMultiplePastedEntries();
        }
        // 2. Handle Single Manual New Entry (POST)
        else if (showNewForm && newEntry.id) {
          saveSuccess = await handleSaveNewEntry();
        }
        
        // CRITICAL: If new entry saving failed validation or API, STOP HERE.
        if (!saveSuccess) {
          setIsLoading(false);
          return;
        }
        
        // 3. Handle Field Changes (Account/Org validation inside handleSaveFieldChanges)
        if (hasUnsavedFieldChanges) {
          // Note: We need this to return a boolean to know if it succeeded
          const fieldSuccess = await handleSaveFieldChanges();
          if (!fieldSuccess) {
            setIsLoading(false);
            return;
          }
        }
        
        // 4. Handle Grid Amount Changes (PUT Bulk)
        // if (hasUnsavedAmountChanges) {
          //   await handleSaveAllAmounts();
          // }
          if (hasUnsavedAmountChanges && Object.keys(modifiedAmounts).length > 0) {
            await handleSaveAllAmounts();
          }
          
          setRefreshPool(true);
        // 5. Success Cleanup
        if (onSaveSuccess) {
          isSilentRefreshing.current = true;
          await onSaveSuccess();
        }

        // Reset all states only after full database commit
        setNewEntries([]);
        setNewEntryPeriodAmountsArray([]);
        setShowNewForm(false);
        setHasUnsavedAmountChanges(false);
        setHasUnsavedFieldChanges(false);
        setModifiedAmounts({});
        setEditedRowData({});
        setInputValues({});
        // setSelectedRows(new Set());
        // setShowCopyButton(false);
        // await fetchData();
        // await fetchMonthlyTotals();

        if (hasNewEntries) {
  await fetchData();
  await fetchMonthlyTotals();
  
} 
else if (hasEmployeeChanges && hasAmtChanges) {
  await fetchData();
  await fetchMonthlyTotals();
}
else if (hasEmployeeChanges) {
  await fetchData();
}
else if (hasAmtChanges) {
  await fetchData();
  await fetchMonthlyTotals();
}

toast.success("All Other cost changes saved and updated successfully!");
return true;
} catch (err) {
  console.error("Master Save Error:", err);
} finally {
        setRefreshPool(false);
        setIsLoading(false);
      }
    };

    const handleCancelAllChanges = () => {
      // Cancel amount changes
      if (hasUnsavedAmountChanges) {
        setModifiedAmounts({});
        setInputValues({});
        setHasUnsavedAmountChanges(false);
      }

      // Cancel field changes
      if (hasUnsavedFieldChanges) {
        if (editingRowIndex !== null) {
          setEditedRowData((prev) => {
            const newData = { ...prev };
            delete newData[editingRowIndex];
            return newData;
          });
          setEditingRowIndex(null);
        }
        setHasUnsavedFieldChanges(false);
      }

      toast.info("All changes cancelled.", { autoClose: 1500 });
    };

    const resetNewEntry = (newIdType) => {
      setNewEntry({
        id: "",
        firstName: "",
        lastName: "",
        isRev: false,
        isBrd: false,
        idType: newIdType || "", // preserve new idType
        acctId: "",
        orgId: "",
        perHourRate: "",
        status: "Act",
      });
    };

    const handleFillValues = async () => {
      if (!showNewForm || !isEditable) return;

      const newAmounts = {};
      if (fillMethod === "Copy From Source Record" && sourceRowIndex !== null) {
        const sourceEmp = employees[sourceRowIndex];
        const sourceMonthAmounts = getMonthAmounts(sourceEmp);
        sortedDurations.forEach((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          if (
            planType === "EAC" &&
            !isMonthEditable(duration, closedPeriod, planType)
          ) {
            newAmounts[uniqueKey] = newEntryPeriodAmounts[uniqueKey] || "0";
          } else {
            newAmounts[uniqueKey] =
              sourceMonthAmounts[uniqueKey]?.value?.toString() || "0";
          }
        });
      }

      setNewEntryPeriodAmounts((prev) => ({ ...prev, ...newAmounts }));
      setShowFillValues(false);
      setFillMethod("None");
      setSourceRowIndex(null);
    };

    // New helper to apply fill changes to selected EXISTING rows
    const applyFillToExistingRows = (
      startValue,
      startNum,
      rangeEndKey,
      selectedRows,
      employees,
      sortedDurations,
      inputValues,
      setInputValues,
      setModifiedAmounts,
      setHasUnsavedAmountChanges,
      closedPeriod,
      planType,
      toKeyNum,
    ) => {
      let updatedInputs = { ...inputValues };
      let newModifiedAmounts = {};

      selectedRows.forEach((actualEmpIdx) => {
        const emp = employees[actualEmpIdx];
        const monthAmounts = getMonthAmounts(emp);

        // Determine the starting value for this specific EXISTING row
        let currentStartValue = startValue;

        // If not using Specify Amounts, we need to read the initial value from the grid for this specific existing row
        if (startValue === null || startValue === undefined) {
          const currentInputKey = `${actualEmpIdx}_${effectiveStartPeriodKey}`; // effectiveStartPeriodKey determined in handleFillValuesAmounts
          const inputValue = inputValues[currentInputKey];
          const forecastValue = monthAmounts[effectiveStartPeriodKey]?.value;

          currentStartValue =
            inputValue !== undefined && inputValue !== ""
              ? inputValue
              : forecastValue !== undefined && forecastValue !== null
                ? String(forecastValue)
                : "";
        }

        sortedDurations.forEach((duration) => {
          const uniqueKey = `${duration.monthNo}_${duration.year}`;
          const currentNum = toKeyNum(duration.year, duration.monthNo);
          const inputKey = `${actualEmpIdx}_${uniqueKey}`;

          // 1. Check date range
          const k = toKeyNum(duration.year, duration.monthNo);
          if (k > rangeEndKey || currentNum < startNum) return; // Fill only up to end date, and starting from start month

          // 2. Check editability
          if (
            planType === "EAC" &&
            !isMonthEditable(duration, closedPeriod, planType)
          )
            return;

          let newValue = currentStartValue;

          // 3. Stage the update
          if (
            String(updatedInputs[inputKey]) !== String(newValue) ||
            updatedInputs[inputKey] === undefined
          ) {
            updatedInputs[inputKey] = String(newValue);

            // Track for eventual bulk save
            newModifiedAmounts[inputKey] = {
              empIdx: actualEmpIdx,
              uniqueKey,
              newValue: String(newValue),
              employee: emp,
            };
          }
        });
      });

      if (Object.keys(newModifiedAmounts).length > 0) {
        // Only trigger state updates if actual changes occurred
        setInputValues((prev) => ({ ...prev, ...updatedInputs }));

        // Merge with existing modified amounts to preserve pending saves
        setModifiedAmounts((prev) => ({ ...prev, ...newModifiedAmounts }));
        setHasUnsavedAmountChanges(true);
        return Object.keys(newModifiedAmounts).length;
      }
      return 0;
    };

    const parseMonth = (dateStr) => {
      const [year, month] = dateStr.split("-").map(Number);
      return { year, month };
    };

    // const handleFillValuesAmounts = () => {
    //   if (!isEditable) return;

    //   // 1. Basic Validation and Range Setup
    //   if (!fillStartDate || !fillEndDate) {
    //     toast.error("Start Period and End Period are required.");
    //     return;
    //   }

    //   const start = parseMonth(fillStartDate);
    //   const end = parseMonth(fillEndDate);

    //   const toKeyNum = (y, m) => y * 100 + m;

    //   const rangeStartKey = toKeyNum(start.year, start.month);
    //   const rangeEndKey = toKeyNum(end.year, end.month);

    //   if (rangeEndKey < rangeStartKey) {
    //     toast.error("End Period cannot be before Start Period.");
    //     return;
    //   }

    //   const isInRange = (duration) => {
    //     const k = toKeyNum(duration.year, duration.monthNo);
    //     return k >= rangeStartKey && k <= rangeEndKey;
    //   };

    //   // Identify Anchor Month for "Use Start Period Amounts"
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
    //   let newModifiedAmounts = { ...modifiedAmounts };
    //   let targetRowIdxForScroll = null;

    //   // --- SOURCE PREPARATION (Only for Copy Method) ---
    //   const sourceIdx =
    //     selectedRows.size > 0 ? Array.from(selectedRows)[0] : null;
    //   const sourceEmp = sourceIdx !== null ? employees[sourceIdx] : null;
    //   const sourceMonthAmounts = sourceEmp ? getMonthAmounts(sourceEmp) : {};

    //   // --- 2. Logic for NEW ENTRIES ---
    //   if (newEntries.length > 0) {
    //     setNewEntryPeriodAmountsArray((prevArray) =>
    //       prevArray.map((amounts) => {
    //         const updatedAmounts = { ...amounts };
    //         // Original logic: value from THIS row's anchor month
    //         const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

    //         sortedDurations.forEach((duration) => {
    //           const currentK = toKeyNum(duration.year, duration.monthNo);
    //           if (currentK < rangeStartKey || currentK > rangeEndKey) return;
    //           if (
    //             planType === "EAC" &&
    //             !isMonthEditable(duration, closedPeriod, planType)
    //           )
    //             return;

    //           const key = `${duration.monthNo}_${duration.year}`;

    //           if (fillMethod === "Copy From Source Record" && sourceEmp) {
    //             updatedAmounts[key] =
    //               newInputs[`${sourceIdx}_${key}`] ??
    //               String(sourceMonthAmounts[key]?.value || "0");
    //           } else if (fillMethod === "Specify Amounts") {
    //             updatedAmounts[key] = String(fillAmounts);
    //           } else if (fillMethod === "Use Start Period Amounts") {
    //             if (currentK >= anchorSortVal)
    //               updatedAmounts[key] = valToCopyFromSelf;
    //           }
    //         });
    //         return updatedAmounts;
    //       }),
    //     );
    //   }

    //   // --- 3. Logic for EXISTING ROWS (Checked Rows) ---
    //   if (selectedRows.size > 0) {
    //     const isDropdownCopy =
    //       fillMethod === "Copy From Source Record" && selectedSourceIdx !== "";
    //     const targetIndices = isDropdownCopy
    //       ? [parseInt(selectedSourceIdx)]
    //       : Array.from(selectedRows);

    //     targetRowIdxForScroll = targetIndices[0];

    //     targetIndices.forEach((targetIdx) => {
    //       const targetEmp = employees[targetIdx];
    //       if (!targetEmp) return;

    //       const valToCopyFromSelf =
    //         newInputs[`${targetIdx}_${anchorMonthKey}`] ??
    //         String(getMonthAmounts(targetEmp)[anchorMonthKey]?.value || "0");

    //       sortedDurations.forEach((d) => {
    //         const currentK = toKeyNum(d.year, d.monthNo);
    //         if (currentK < rangeStartKey || currentK > rangeEndKey) return;
    //         if (
    //           planType === "EAC" &&
    //           !isMonthEditable(d, closedPeriod, planType)
    //         )
    //           return;

    //         const key = `${d.monthNo}_${d.year}`;
    //         const inputKey = `${targetIdx}_${key}`;
    //         let val;

    //         if (isDropdownCopy && sourceEmp) {
    //           val =
    //             newInputs[`${sourceIdx}_${key}`] ??
    //             String(sourceMonthAmounts[key]?.value || "0");
    //         } else if (fillMethod === "Specify Amounts") {
    //           val = String(fillAmounts);
    //         } else if (fillMethod === "Use Start Period Amounts") {
    //           if (currentK >= anchorSortVal) val = valToCopyFromSelf;
    //           else return;
    //         } else return;

    //         newInputs[inputKey] = val;
    //         newModifiedAmounts[inputKey] = {
    //           empIdx: targetIdx,
    //           uniqueKey: key,
    //           newValue: val,
    //           employee: targetEmp,
    //         };
    //       });
    //     });
    //   }

    //   setInputValues(newInputs);
    //   setModifiedAmounts(newModifiedAmounts);
    //   setHasUnsavedAmountChanges(true);
    //   setShowFillValues(false);

    //   if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    //     setFindMatches([
    //       { empIdx: targetRowIdxForScroll, isFillHighlight: true },
    //     ]);
    //     setTimeout(() => {
    //       setFindMatches([]);
    //     }, 4000);
    //   }

    //   setSelectedSourceIdx("");
    //   toast.success("Values applied successfully");
    // };

    const handleFillValuesAmounts = () => {
  if (!isEditable) return;

  if (!fillStartDate || !fillEndDate) {
    toast.error("Start Period and End Period are required.");
    return;
  }

  const start = parseMonth(fillStartDate);
  const end = parseMonth(fillEndDate);
  const toKeyNum = (y, m) => y * 100 + m;

  const rangeStartKey = toKeyNum(start.year, start.month);
  const rangeEndKey = toKeyNum(end.year, end.month);

  if (rangeEndKey < rangeStartKey) {
    toast.error("End Period cannot be before Start Period.");
    return;
  }

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
  let newModifiedAmounts = { ...modifiedAmounts };
  let targetRowIdxForScroll = null;

  // Identify Source: Dropdown selection has priority for "Copy From Source Record"
  const isDropdownCopy = fillMethod === "Copy From Source Record" && selectedSourceIdx !== "";
  const sourceIdx = isDropdownCopy 
    ? parseInt(selectedSourceIdx) 
    : (selectedRows.size > 0 ? Array.from(selectedRows)[0] : null);

  const sourceEmp = sourceIdx !== null ? employees[sourceIdx] : null;
  const sourceMonthAmounts = sourceEmp ? getMonthAmounts(sourceEmp) : {};

  // --- 1. Logic for NEW ENTRIES ---
  if (newEntries.length > 0) {
    setNewEntryPeriodAmountsArray((prevArray) =>
      prevArray.map((amounts) => {
        const updatedAmounts = { ...amounts };
        const valToCopyFromSelf = updatedAmounts[anchorMonthKey] || "0";

        sortedDurations.forEach((duration) => {
          const currentK = toKeyNum(duration.year, duration.monthNo);
          if (currentK < rangeStartKey || currentK > rangeEndKey) return;
          if (planType === "EAC" && !isMonthEditable(duration, closedPeriod, planType)) return;

          const key = `${duration.monthNo}_${duration.year}`;

          if (fillMethod === "Copy From Source Record" && sourceEmp) {
            updatedAmounts[key] = newInputs[`${sourceIdx}_${key}`] ?? String(sourceMonthAmounts[key]?.value || "0");
          } else if (fillMethod === "Specify Amounts") {
            updatedAmounts[key] = String(fillAmounts);
          } else if (fillMethod === "Use Start Period Amounts") {
            if (currentK >= anchorSortVal) updatedAmounts[key] = valToCopyFromSelf;
          }
        });
        return updatedAmounts;
      }),
    );
  }

  // --- 2. Logic for EXISTING ROWS (Checked Rows) ---
  if (selectedRows.size > 0) {
    const targetIndices = Array.from(selectedRows);
    targetRowIdxForScroll = targetIndices[0];

    targetIndices.forEach((targetIdx) => {
      const targetEmp = employees[targetIdx];
      if (!targetEmp) return;

      const valToCopyFromSelf = newInputs[`${targetIdx}_${anchorMonthKey}`] ?? 
                               String(getMonthAmounts(targetEmp)[anchorMonthKey]?.value || "0");

      sortedDurations.forEach((d) => {
        const currentK = toKeyNum(d.year, d.monthNo);
        if (currentK < rangeStartKey || currentK > rangeEndKey) return;
        if (planType === "EAC" && !isMonthEditable(d, closedPeriod, planType)) return;

        const key = `${d.monthNo}_${d.year}`;
        const inputKey = `${targetIdx}_${key}`;
        let val;

        if (fillMethod === "Copy From Source Record" && sourceEmp) {
          val = newInputs[`${sourceIdx}_${key}`] ?? String(sourceMonthAmounts[key]?.value || "0");
        } else if (fillMethod === "Specify Amounts") {
          val = String(fillAmounts);
        } else if (fillMethod === "Use Start Period Amounts") {
          if (currentK >= anchorSortVal) val = valToCopyFromSelf;
          else return;
        } else return;

        newInputs[inputKey] = val;
        newModifiedAmounts[inputKey] = {
          empIdx: targetIdx,
          uniqueKey: key,
          newValue: val,
          employee: targetEmp,
        };
      });
    });
  }

  setInputValues(newInputs);
  setModifiedAmounts(newModifiedAmounts);
  setHasUnsavedAmountChanges(true);
  
  // Close and reset position
  // handleCloseFillValues();
  setShowFillValues(false);
  setModalPos({ x: 0, y: 0 }); // Reset drag position
  setSelectedSourceIdx("");

  if (targetRowIdxForScroll !== null && newEntries.length === 0) {
    setFindMatches([{ empIdx: targetRowIdxForScroll, isFillHighlight: true }]);
    setTimeout(() => setFindMatches([]), 4000);
  }

  toast.success("Values applied successfully");
};

    const handleSaveNewEntry = async () => {
      if (!planId) {
        toast.error("Plan ID is required to save a new entry.", {
          toastId: "no-plan-id",
          autoClose: 3000,
        });
        return false;
      }

      if (!newEntry.id || newEntry.id.trim() === "") {
        toast.error("ID is required to save a new entry.", {
          toastId: "empty-id-error",
          autoClose: 3000,
        });
        return false;
      }

      if (newEntry.idType !== "Other") {
        const isValidEmployeeId = employeeSuggestions.some(
          (emp) => emp.emplId === newEntry.id,
        );
        if (!isValidEmployeeId) {
          toast.error(
            "Please select a valid employee ID from the suggestions.",
            {
              toastId: "invalid-employee-selection",
              autoClose: 3000,
            },
          );
          return false;
        }
      }

      if (newEntry.acctId) {
        let validAccounts;
        if (
          newEntry.idType === "Vendor" ||
          newEntry.idType === "Vendor Employee"
        ) {
          validAccounts = subContractorNonLaborAccounts.map(
            (a) => a.id || a.accountId,
          );
        } else if (newEntry.idType === "Other") {
          validAccounts = [
            ...employeeNonLaborAccounts.map((a) => a.id || a.accountId),
            ...subContractorNonLaborAccounts.map((a) => a.id || a.accountId),
            ...otherDirectCostNonLaborAccounts.map((a) => a.id || a.accountId),
          ];
        } else {
          validAccounts = employeeNonLaborAccounts.map(
            (a) => a.id || a.accountId,
          );
        }

        if (!validAccounts.includes(newEntry.acctId)) {
          toast.error("Please select a valid account from the suggestions.", {
            toastId: "invalid-account-selection",
            autoClose: 3000,
          });
          return false;
        }
      }

      if (newEntry.orgId) {
        const validOrgs = organizationOptions.map((org) => org.value);
        if (!validOrgs.includes(newEntry.orgId)) {
          toast.error(
            "Please select a valid organization from the suggestions.",
            {
              toastId: "invalid-org-selection",
              autoClose: 3000,
            },
          );
          return false;
        }
      }

      const isDuplicateId = employees.some((emp) => {
        const emple = emp.emple;
        if (!emple) return false;
        return emple.emplId === newEntry.id && emple.accId === newEntry.acctId;
      });

      if (isDuplicateId) {
        toast.error(
          "An entry with this ID already exists; cannot save duplicate.",
          {
            toastId: "duplicate-id-error",
            autoClose: 3000,
          },
        );
        return false;
      }

      setIsLoading(true);

      const payloadForecasts = durations.map((duration) => ({
        forecastedamt:
          Number(
            newEntryPeriodAmounts[`${duration.monthNo}_${duration.year}`],
          ) || 0,
        forecastid: 0,
        projId: projectId,
        plId: planId,
        emplId: newEntry.id,
        dctId: 0,
        month: duration.monthNo,
        year: duration.year,
        totalBurdenCost: 0,
        fees: 0,
        burden: 0,
        ccffRevenue: 0,
        tnmRevenue: 0,
        revenue: 0,
        cost: 0,
        fringe: 0,
        overhead: 0,
        gna: 0,
        forecastedhours: 0,
        updatedat: new Date().toISOString().split("T")[0],
        displayText: "",
        acctId: newEntry.acctId,
        orgId: newEntry.orgId,
        hrlyRate: Number(newEntry.perHourRate) || 0,
        effectDt: null,
      }));

      const payload = {
        dctId: 0,
        plId: planId,
        acctId: newEntry.acctId || "",
        orgId: newEntry.orgId || "",
        notes: "",
        category:
          newEntry.lastName && newEntry.firstName
            ? `${newEntry.lastName}, ${newEntry.firstName}`
            : newEntry.lastName || newEntry.firstName || "",
        amountType: "",
        id: newEntry.id,
        type: newEntry.idType || "-",
        isRev: newEntry.isRev || false,
        isBrd: newEntry.isBrd || false,
        status: newEntry.status || "-",
        createdBy: "System",
        lastModifiedBy: "System",
        plForecasts: payloadForecasts,
        plDct: {},
      };

      try {
        await axios.post(
          `${backendUrl}/DirectCost/AddNewDirectCosts?plid=${planId}&templateid=${templateId}`,
          [payload],
          { headers: { "Content-Type": "application/json" } },
        );
        return true; // SUCCESS
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        toast.error(`Failed to save entry: ${errorMessage}`);
        return false; // FAILED
      } finally {
        setIsLoading(false);
      }
    };

    // useEffect(() => {
    //   if (newEntries.length === 0) {
    //     setPastedEntrySuggestions({});
    //     setPastedEntryAccounts({});
    //     setPastedEntryOrgs({});
    //     return;
    //   }

    //   const suggestionsByEntry = {};
    //   const accountsByEntry = {};
    //   const orgsByEntry = {};

    //   newEntries.forEach((entry, entryIndex) => {
    //     // 1. Employee ID suggestions (skip for Other)
    //     if (entry.idType !== "Other") {
    //       suggestionsByEntry[entryIndex] = employeeSuggestions || [];
    //     } else {
    //       suggestionsByEntry[entryIndex] = [];
    //     }

    //     // 2. Account suggestions - ALL for Other
    //     let accounts;
    //     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
    //       accounts = subContractorNonLaborAccounts.map((acc) => ({ id: acc.id }));
    //     } else if (entry.idType === "Other") {
    //       accounts = [
    //         ...employeeNonLaborAccounts.map((acc) => ({ id: acc.id })),
    //         ...subContractorNonLaborAccounts.map((acc) => ({ id: acc.id })),
    //         ...otherDirectCostNonLaborAccounts.map((acc) => ({ id: acc.id })),
    //       ];
    //     } else {
    //       accounts = employeeNonLaborAccounts.map((acc) => ({ id: acc.id }));
    //     }
    //     accountsByEntry[entryIndex] = accounts;

    //     // 3. Organization suggestions
    //     orgsByEntry[entryIndex] = organizationOptions || [];
    //   });

    //   setPastedEntrySuggestions(suggestionsByEntry);
    //   setPastedEntryAccounts(accountsByEntry);
    //   setPastedEntryOrgs(orgsByEntry);
    // }, [
    //   newEntries,
    //   employeeSuggestions,
    //   employeeNonLaborAccounts,
    //   subContractorNonLaborAccounts,
    //   otherDirectCostNonLaborAccounts,
    //   organizationOptions,
    // ]);

    // useEffect(() => {
    //   if (newEntries.length === 0) {
    //     setPastedEntrySuggestions({});
    //     setPastedEntryAccounts({});
    //     setPastedEntryOrgs({});
    //   }
    //   // NOTE: Do NOT re-populate here - let fetchAllSuggestionsOptimizedForAmounts handle it
    // }, [newEntries.length]);

    // useEffect(() => {
    //   const fetchConfig = async () => {
    //     try {
    //       const response = await axios.get(
    //         `${backendUrl}/api/Configuration/GetConfigValueByName/isClosedPeriodEditable`,
    //       );

    //       console.log('amount', response.data)

    //       const valString = response.data?.value;

    //       const isAllowed = String(valString).toLowerCase() === "true";

    //       setIsClosedPeriodEditable(isAllowed);
    //     } catch (err) {
    //       console.warn("Config fetch failed, defaulting to restricted:", err);
    //       setIsClosedPeriodEditable(false);
    //     }
    //   };
    //   fetchConfig();
    // }, []);

    function isMonthEditable(duration, closedPeriod, planType) {
      if (planType !== "EAC") return true;

      if (isClosedPeriodEditable === true) {
        return true;
      }

      if (!closedPeriod) return true;

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

    const handleSaveMultiplePastedEntries = async () => {
      if (newEntries.length === 0) return true;

      if (!planId) {
        toast.error("Plan ID is required to save entries.");
        return false;
      }

      let validationFailed = false;
      const bulkPayload = [];

      try {
        for (let i = 0; i < newEntries.length; i++) {
          const entry = newEntries[i];
          const periodAmounts = newEntryPeriodAmountsArray[i] || {};

          // 1. Basic ID Check
          if (!entry.id || entry.id.trim() === "") {
            toast.error(`Entry ${i + 1}: ID is required.`);
            validationFailed = true;
            break;
          }

          // 2. STRICT ACCOUNT VALIDATION
          // Check if selected Account exists in the allowed suggestions for this specific row type
          const rowValidAccounts = getAccountSuggestionsByType(entry.idType);
          const isAccValid = rowValidAccounts.some(
            (acc) => (acc.accountId || acc.id) === entry.acctId,
          );

          if (!isAccValid) {
            toast.error(
              `Row ${i + 1}: Invalid Account ID "${entry.acctId}". Please select from the suggestion list.`,
            );
            validationFailed = true;
            break;
          }

          // 3. STRICT ORGANIZATION VALIDATION
          // Check if selected Org exists in the master organizationOptions list
          const isOrgValid = organizationOptions.some(
            (org) => String(org.value) === String(entry.orgId),
          );

          if (!isOrgValid) {
            toast.error(
              `Row ${i + 1}: Invalid Organization "${entry.orgId}". Please select from the suggestion list.`,
            );
            validationFailed = true;
            break;
          }

          // 4. Construct Forecasts for this entry
          const payloadForecasts = durations.map((duration) => ({
            forecastedamt:
              Number(periodAmounts[`${duration.monthNo}_${duration.year}`]) ||
              0,
            forecastid: 0,
            projId: projectId,
            plId: planId,
            emplId: entry.id.trim(),
            dctId: 0,
            month: duration.monthNo,
            year: duration.year,
            updatedat: new Date().toISOString().split("T")[0],
            acctId: entry.acctId,
            orgId: entry.orgId,
            hrlyRate: 0,
            effectDt: null,
          }));

          bulkPayload.push({
            dctId: 0,
            plId: planId,
            acctId: entry.acctId || "",
            orgId: entry.orgId || "",
            category:
              entry.lastName && entry.firstName
                ? `${entry.lastName}, ${entry.firstName}`
                : entry.lastName || entry.firstName || "",
            id: entry.id.trim(),
            type: entry.idType || "-",
            isRev: entry.isRev || false,
            isBrd: entry.isBrd || false,
            status: entry.status || "Act",
            createdBy: "System",
            lastModifiedBy: "System",
            plForecasts: payloadForecasts,
          });
        }

        if (validationFailed) return false;

        if (bulkPayload.length > 0) {
          await axios.post(
            `${backendUrl}/DirectCost/AddNewDirectCosts?plid=${planId}&templateid=${templateId}`,
            bulkPayload,
            { headers: { "Content-Type": "application/json" } },
          );
          return true;
        }
        return true;
      } catch (err) {
        const apiError =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message;
        toast.error(apiError, {
          autoClose: 5000,
          toastId: "backend-error-direct-cost",
        });
        return false;
      }
    };

    const handleRowClick = (actualEmpIdx, isChecked) => {
      // const selectedEmployee = employees[actualEmpIdx];
      // const dctId = selectedEmployee ? selectedEmployee.emple.dctId : null;

      // setSelectedRowIndex((prev) =>
      //   prev === actualEmpIdx ? null : actualEmpIdx
      // );
      // setSelectedEmployeeId((prev) => (prev === dctId ? null : dctId));

      setSelectedRows((prev) => {
        if (isChecked) {
          const newSelection = new Set(prev);
          newSelection.add(actualEmpIdx);
          setShowCopyButton(newSelection.size > 0);
          return newSelection;
        }
        const newSelection = new Set(prev);
        if (newSelection.has(actualEmpIdx)) {
          newSelection.delete(actualEmpIdx);
        } else {
          newSelection.add(actualEmpIdx);
        }
        setShowCopyButton(newSelection.size > 0);
        return newSelection;
      });
    };

    const handleDeleteEmployee = async () => {
      // 1. Identify which records to delete
      // If multiple rows are checked, use those. Otherwise, use the single selectedEmployeeId
      const idsToDelete =
        selectedRows.size > 0
          ? Array.from(selectedRows)
              .map((idx) => employees[idx]?.emple?.dctId)
              .filter((id) => id)
          : [selectedEmployeeId].filter((id) => id);

      if (idsToDelete.length === 0) {
        toast.error("No record selected for deletion");
        return;
      }

      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${idsToDelete.length} record(s)?`,
      );
      if (!confirmDelete) return;

      try {
        setIsLoading(true);
        setRefreshPool(true)

        // 2. Execute Deletions (Assuming your API supports single delete, we loop)
        // If your backend has a BulkDelete endpoint, use that instead for better performance
        await Promise.all(
          idsToDelete.map((id) =>
            axios.delete(`${backendUrl}/DirectCost/DeleteDirectCost/${id}`),
          ),
        );

        toast.success("Records Deleted Successfully!");

        // 3. FIX: Update local state to remove the records
        setEmployees((prev) =>
          prev.filter((emp) => !idsToDelete.includes(emp.emple.dctId)),
        );

        // 4. FIX: Clear selection states so the "Copy Selected" number goes back to 0
        setSelectedRows(new Set());
        setShowCopyButton(false);
        setSelectedRowIndex(null);
        setSelectedEmployeeId(null);
      } catch (err) {
        toast.error(
          "Failed to delete records: " +
            (err.response?.data?.message || err.message),
        );
      } finally {
        setIsLoading(false);
        setRefreshPool(false);
      }
    };
    const handleColumnHeaderClick = (uniqueKey) => {
      if (!isEditable) return;

      setSelectedColumnKeys((prev) => {
        const next = new Set(prev);
        if (next.has(uniqueKey)) {
          next.delete(uniqueKey);
        } else {
          next.add(uniqueKey);
        }
        return next;
      });

      // optional: keep the last clicked in selectedColumnKey for backward compatibility
      setSelectedColumnKey((prev) => (prev === uniqueKey ? null : uniqueKey));

      // clear row highlight when column scope is used
      setSelectedRowIndex(null);
      setReplaceScope("column");
    };

     const handleFindReplace = async () => {
  if (!isEditable || !findValue?.trim()) {
    toast.warn("Please enter a find value.");
    return;
  }
 
  // UPDATED: Check for checked rows within the scope logic
  if (replaceScope === "checked-rows" && selectedRows.size === 0) {
    toast.warn("Please check at least one row.");
    return;
  }
 
  setIsLoading(true);
  let replacementsCount = 0;
 
  try {
    const updatedInputValues = { ...inputValues };
    // Track modifications locally for handleMasterSave/handleSaveAll
    const newModifiedAmounts = { ...modifiedAmounts };
 
    /**
     * FIX LOGIC:
     * If scope is 'row', we only iterate over indices present in the 'selectedRows' Set.
     * If scope is 'all' or 'column', we iterate over all employee indices that aren't hidden.
     */
    const targetRowIndices =
      replaceScope === "checked-rows"
        ? Array.from(selectedRows)
        : employees.map((_, i) => i).filter((i) => !hiddenRows[i]);
 
    for (const empIdx of targetRowIndices) {
      const emp = employees[empIdx];
      // Safety check: ensure the employee exists and isn't hidden
      if (!emp || hiddenRows[empIdx]) continue;
 
      for (const duration of sortedDurations) {
        const uniqueKey = `${duration.monthNo}_${duration.year}`;
 
        // If scope is 'column', skip if not the specific selected column
        if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
          continue;
 
        if (!isMonthEditable(duration, closedPeriod, planType)) continue;
 
        const currentInputKey = `${empIdx}_${uniqueKey}`;
 
        let displayedValue;
        const monthAmounts = getMonthAmounts(emp);
        let forecast = monthAmounts[uniqueKey];
 
        if (inputValues[currentInputKey] !== undefined) {
          displayedValue = String(inputValues[currentInputKey]);
        } else if (forecast?.value !== undefined) {
          displayedValue = String(forecast.value);
        } else {
          displayedValue = "0";
        }
 
        const findValueTrimmed = findValue.trim();
        const displayedValueTrimmed = displayedValue.trim();
 
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
          if (!isMatch) {
            const findNum = parseFloat(findValueTrimmed);
            const displayNum = parseFloat(displayedValueTrimmed);
            if (!isNaN(findNum) && !isNaN(displayNum)) {
              isMatch = findNum === displayNum;
            }
          }
        }
 
        if (isMatch) {
          const newValue = replaceValue?.trim() || "0";
         
          // 1. Update UI display
          updatedInputValues[currentInputKey] = newValue;
          replacementsCount++;
 
          // 2. Queue for Master Save
          newModifiedAmounts[currentInputKey] = {
            empIdx,
            uniqueKey: uniqueKey,
            newValue: newValue,
            employee: emp,
          };
        }
      }
    }
 
    if (replacementsCount > 0) {
      // Apply local updates
      setInputValues(updatedInputValues);
      setModifiedAmounts(newModifiedAmounts);
      setHasUnsavedAmountChanges(true);
 
      toast.success(`Replaced ${replacementsCount} matches.`);
    } else {
      toast.info("No matching values found.");
    }
  } catch (err) {
    toast.error("Error: " + (err.response?.data?.message || err.message));
  } finally {
    setIsLoading(false);
    setShowFindReplace(false);
    // Reset specific states to prevent leftover highlights
    setFindValue("");
    setReplaceValue("");
    setSelectedRowIndex(null);
    setSelectedColumnKey(null);
  }
};
 

    // const handleFind = () => {
    //   if (!findValue) {
    //     toast.warn("Please enter a value to find.", { autoClose: 2000 });
    //     return;
    //   }

    //   const matches = [];
    //   const findValueTrimmed = findValue.trim();

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

    //   for (const empIdx in employees) {
    //     const emp = employees[empIdx];
    //     const actualEmpIdx = parseInt(empIdx, 10);

    //     if (replaceScope === "checked-rows" && actualEmpIdx !== selectedRowIndex)
    //       continue;

    //     for (const duration of sortedDurations) {
    //       const uniqueKey = `${duration.monthNo}_${duration.year}`;

    //       if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
    //         continue;

    //       if (!isMonthEditable(duration, closedPeriod, planType)) continue;

    //       const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
    //       let displayedValue;

    //       if (inputValues[currentInputKey] !== undefined) {
    //         displayedValue = String(inputValues[currentInputKey]);
    //       } else {
    //         const monthAmounts = getMonthAmounts(emp);
    //         const forecast = monthAmounts[uniqueKey];
    //         if (forecast && forecast.value !== undefined) {
    //           displayedValue = String(forecast.value);
    //         } else {
    //           displayedValue = "0";
    //         }
    //       }

    //       const displayedValueTrimmed = displayedValue.trim();
    //       let isMatch = false;

    //       if (
    //         !isNaN(Number(findValueTrimmed)) &&
    //         Number(findValueTrimmed) === 0
    //       ) {
    //         isMatch = isZeroLike(displayedValueTrimmed);
    //       } else {
    //         isMatch = displayedValueTrimmed === findValueTrimmed;

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

  for (const empIdx in employees) {
    const emp = employees[empIdx];
    const actualEmpIdx = parseInt(empIdx, 10);

    // FIX 1: Support "checked-rows" scope using the selectedRows Set
    if (replaceScope === "checked-rows" && !selectedRows.has(actualEmpIdx))
      continue;

    // FIX 2: Support "column" scope
    for (const duration of sortedDurations) {
      const uniqueKey = `${duration.monthNo}_${duration.year}`;

      if (replaceScope === "column" && uniqueKey !== selectedColumnKey)
        continue;

      if (!isMonthEditable(duration, closedPeriod, planType)) continue;

      const currentInputKey = `${actualEmpIdx}_${uniqueKey}`;
      let displayedValue;

      if (inputValues[currentInputKey] !== undefined) {
        displayedValue = String(inputValues[currentInputKey]);
      } else {
        const monthAmounts = getMonthAmounts(emp);
        const forecast = monthAmounts[uniqueKey];
        if (forecast && forecast.value !== undefined) {
          displayedValue = String(forecast.value);
        } else {
          displayedValue = "0";
        }
      }

      const displayedValueTrimmed = displayedValue.trim();
      let isMatch = false;

      // Numeric and zero-like comparison logic
      if (
        !isNaN(Number(findValueTrimmed)) &&
        Number(findValueTrimmed) === 0
      ) {
        isMatch = isZeroLike(displayedValueTrimmed);
      } else {
        isMatch = displayedValueTrimmed === findValueTrimmed;

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
    // FIX 3: Reset modal position when closing on success
    setShowFindReplace(false);
    setFindReplacePos({ x: 0, y: 0 });
  }
};

    const showHiddenRows = () => setHiddenRows({});

    if (isLoading || isDataLoading) {
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

    // Function to select/deselect all rows
    const handleSelectAll = (isSelected) => {
      if (isSelected) {
        const allRowIndices = new Set();
        employees.forEach((_, index) => {
          if (!hiddenRows[index]) {
            allRowIndices.add(index);
          }
        });
        setSelectedRows(allRowIndices);
        setShowCopyButton(true);
      } else {
        setSelectedRows(new Set());
        setShowCopyButton(false);
      }
    };

    const visibleRowIndices = employees
      .map((_, idx) => idx)
      .filter((idx) => !hiddenRows[idx]);

    const areAllVisibleSelected =
      visibleRowIndices.length > 0 &&
      visibleRowIndices.every((idx) => selectedRows.has(idx));

    const handleCopySelectedRows = async () => {
      if (selectedRows.size === 0) {
        toast.info("No rows selected to copy.", { autoClose: 2000 });
        return;
      }

      // Use ALL durations to ensure all fiscal years are captured
      const allAvailableDurations = [...durations].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });

      // EXACT column order to match your getEmployeeRow structure
      const headers = [
        "ID Type",
        "ID",
        "Name",
        "Account",
        "Account Name",
        "Org ID",
        "Org Name",
        "Rev",
        "Brd",
        "Status",
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

      selectedRows.forEach((rowIndex) => {
        const emp = employees[rowIndex];
        if (emp && emp.emple && !hiddenRows[rowIndex]) {
          const employeeRow = getEmployeeRow(emp, rowIndex);

          // Ensure this array matches 'headers' length exactly
          const rowData = [
            employeeRow.idType,
            employeeRow.emplId,
            employeeRow.name,
            employeeRow.acctId,
            employeeRow.acctName,
            employeeRow.orgId,
            employeeRow.orgName || "-", // Added Org Name to prevent shifting
            emp.emple.isRev ? "✓" : "-", // Simple string for Excel
            emp.emple.isBrd ? "✓" : "-",
            employeeRow.status,
            employeeRow.total, // Positioned at index 10
          ];

          // Add monthly values
          const empMonthAmounts = getMonthAmounts(emp);
          allAvailableDurations.forEach((duration) => {
            const uniqueKey = `${duration.monthNo}_${duration.year}`;
            const inputValue = inputValues[`${rowIndex}_${uniqueKey}`];
            const forecastValue = empMonthAmounts[uniqueKey]?.value;
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
      navigator.clipboard.writeText(tsvContent).then(() => {
        setCopiedRowsData(structuredData);
        setCopiedMonthMetadata(monthMetadata);
        setHasClipboardData(true);
        toast.success(
          `Copied ${structuredData.length} rows with all fiscal years!`,
        );
        setSelectedRows(new Set());
        setShowCopyButton(false);
      });
    };

    // const fetchAllSuggestionsOptimizedForAmounts = async (processedEntries) => {
    //   if (processedEntries.length === 0) return;

    //   const encodedProjectId = encodeURIComponent(projectId);

    //   try {
    //     // **STEP 1: Fetch common project-level data ONCE**
    //     let projectData = cachedProjectData;
    //     let orgOptions = cachedOrgData;

    //     // Fetch project data if not cached
    //     if (!projectData) {
    //       const projectResponse = await axios.get(
    //         `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
    //       );
    //       projectData = Array.isArray(projectResponse.data)
    //         ? projectResponse.data[0]
    //         : projectResponse.data;
    //       setCachedProjectData(projectData);
    //     }

    //     // Fetch org data if not cached
    //     if (!orgOptions) {
    //       const orgResponse = await axios.get(
    //         `${backendUrl}/Orgnization/GetAllOrgs`
    //       );
    //       orgOptions = Array.isArray(orgResponse.data)
    //         ? orgResponse.data.map((org) => ({
    //             value: org.orgId,
    //             label: org.orgId,
    //           }))
    //         : [];
    //       setCachedOrgData(orgOptions);
    //     }

    //     // **STEP 2: Group entries by idType to minimize API calls**
    //     const employeeEntries = [];
    //     const vendorEntries = [];

    //     processedEntries.forEach((entry, index) => {
    //       if (entry.idType === "Employee") {
    //         employeeEntries.push({ entry, index });
    //       } else if (
    //         entry.idType === "Vendor" ||
    //         entry.idType === "Vendor Employee"
    //       ) {
    //         vendorEntries.push({ entry, index });
    //       }
    //     });

    //     // **STEP 3: Fetch employee suggestions ONCE per type**
    //     let employeeSuggestions = [];
    //     let vendorSuggestions = [];

    //     // Fetch Employee suggestions only if there are Employee entries
    //     if (employeeEntries.length > 0) {
    //       try {
    //         const response = await axios.get(
    //           `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}?type=othercost`
    //         );
    //         employeeSuggestions = Array.isArray(response.data)
    //           ? response.data.map((emp) => {
    //               const [lastName, firstName] = (emp.employeeName || "")
    //                 .split(", ")
    //                 .map((str) => str.trim());
    //               return {
    //                 emplId: emp.empId,
    //                 firstName: firstName || "",
    //                 lastName: lastName || "",
    //                 orgId: emp.orgId || "",
    //                 acctId: emp.acctId || "",
    //               };
    //             })
    //           : [];
    //       } catch (err) {
    //         console.error("Failed to fetch employee suggestions:", err);
    //       }
    //     }

    //     if (vendorEntries.length > 0) {
    //       try {
    //         const response = await axios.get(
    //           `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=othercost`
    //         );
    //         vendorSuggestions = Array.isArray(response.data)
    //           ? response.data.map((emp) => {
    //               // ✅ EXACT SAME CONDITION LOGIC AS SINGLE ENTRY
    //               const vendorEntriesWithIdType = vendorEntries.map(
    //                 (ve) => ve.entry
    //               );

    //               if (
    //                 vendorEntriesWithIdType.some((e) => e.idType === "Vendor")
    //               ) {
    //                 // Use vendId for pure Vendor entries
    //                 return {
    //                   emplId: emp.vendId || "",
    //                   firstName: "",
    //                   lastName: emp.employeeName || "",
    //                   orgId: emp.orgId,
    //                   acctId: emp.acctId,
    //                   acctName: emp.acctName || "",
    //                 };
    //               } else if (
    //                 vendorEntriesWithIdType.some(
    //                   (e) => e.idType === "Vendor Employee"
    //                 )
    //               ) {
    //                 // Use empId for Vendor Employee entries
    //                 return {
    //                   emplId: emp.empId || "",
    //                   firstName: "",
    //                   lastName: emp.employeeName || "",
    //                   orgId: emp.orgId,
    //                   acctId: emp.acctId,
    //                   acctName: emp.acctName || "",
    //                 };
    //               } else {
    //                 // Fallback (shouldn't happen for vendor API, but safe)
    //                 return {
    //                   emplId: emp.vendId || emp.empId || "",
    //                   firstName: "",
    //                   lastName: emp.employeeName || "",
    //                   orgId: emp.orgId,
    //                   acctId: emp.acctId,
    //                   acctName: emp.acctName || "",
    //                 };
    //               }
    //             })
    //           : [];
    //       } catch (err) {
    //         console.error("Failed to fetch vendor suggestions:", err);
    //       }
    //     }

    //     processedEntries.forEach((entry, entryIndex) => {
    //       let accountsForThisRow = [];

    //       if (entry.idType === "Employee") {
    //         accountsForThisRow = employeeNonLaborAccounts;
    //       } else if (
    //         entry.idType === "Vendor" ||
    //         entry.idType === "Vendor Employee"
    //       ) {
    //         accountsForThisRow = subContractorNonLaborAccounts;
    //       } else {
    //         // "Other" gets everything
    //         accountsForThisRow = [
    //           ...employeeNonLaborAccounts,
    //           ...subContractorNonLaborAccounts,
    //           ...otherDirectCostNonLaborAccounts,
    //         ];
    //       }

    //       setPastedEntryAccounts((prev) => ({
    //         ...prev,
    //         [entryIndex]: accountsForThisRow,
    //       }));
    //     });
    //   } catch (err) {
    //     console.error("Failed to fetch suggestions for pasted entries:", err);
    //   }
    // };

    // REPLACE the fetchAllSuggestionsOptimizedForAmounts function with this:

    // REPLACE the fetchAllSuggestionsOptimizedForAmounts function completely:

    const fetchAllSuggestionsOptimizedForAmounts = async (processedEntries) => {
      if (processedEntries.length === 0) return;

      const encodedProjectId = encodeURIComponent(projectId);

      try {
        // **STEP 1: Fetch common project-level data ONCE**
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
          // const orgResponse = await axios.get(
          //   `${backendUrl}/Orgnization/GetAllOrgs`,
          // );
          const orgResponse = allOrgData || []
          orgOptions = Array.isArray(orgResponse)
            ? orgResponse.map((org) => ({
                value: org.orgId,
                label: org.orgId,
              }))
            : [];
          setCachedOrgData(orgOptions);
        }

        // **STEP 2: Separate entries by idType**
        const employeeEntries = [];
        const vendorEntries = [];
        const vendorEmployeeEntries = [];
        const otherEntries = [];

        processedEntries.forEach((entry, index) => {
          if (entry.idType === "Employee") {
            employeeEntries.push({ entry, index });
          } else if (entry.idType === "Vendor") {
            vendorEntries.push({ entry, index });
          } else if (entry.idType === "Vendor Employee") {
            vendorEmployeeEntries.push({ entry, index });
          } else if (entry.idType === "Other") {
            otherEntries.push({ entry, index });
          }
        });

        // **STEP 3: Fetch suggestions for each type ONCE**
        let employeeSuggestions = [];
        let vendorResponseData = [];

        // Fetch Employee suggestions
        if (employeeEntries.length > 0) {
          try {
            // const response = await axios.get(
            //   `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}?type=othercost`,
            // );
            const response = allEmployeeData || []
            employeeSuggestions = Array.isArray(response)
              ? response.map((emp) => {
                  const [lastName, firstName] = (emp.employeeName || "")
                    .split(", ")
                    .map((str) => str.trim());
                  return {
                    emplId: emp.empId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    orgId: emp.orgId || "",
                    acctId: emp.acctId || "",
                    acctName: emp.acctName || "",
                  };
                })
              : [];
          } catch (err) {
            console.error("Failed to fetch employee suggestions:", err);
          }
        }

        // Fetch Vendor data (used for both Vendor and Vendor Employee)
        if (vendorEntries.length > 0 || vendorEmployeeEntries.length > 0) {
          try {
            // const response = await axios.get(
            //   `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=othercost`,
            // );
            const response = allVendorData || []
            vendorResponseData = Array.isArray(response)
              ? response
              : [];
          } catch (err) {
            console.error("Failed to fetch vendor suggestions:", err);
          }
        }

        // **STEP 4: Process each entry with ITS OWN idType-specific suggestions**
        processedEntries.forEach((entry, entryIndex) => {
          let suggestionList = [];
          let accountsForThisRow = [];

          if (entry.idType === "Employee") {
            // Use Employee suggestions for Employee type
            suggestionList = employeeSuggestions;
            accountsForThisRow = employeeNonLaborAccounts;
          } else if (entry.idType === "Vendor") {
            // Map vendorResponseData using vendId for Vendor type
            suggestionList = vendorResponseData
              .map((emp) => ({
                emplId: emp.vendId || "",
                firstName: "",
                lastName: emp.employeeName || "",
                orgId: emp.orgId || "",
                acctId: emp.acctId || "",
                acctName: emp.acctName || "",
              }))
              .filter((item) => item.emplId); // Only keep valid records
            accountsForThisRow = subContractorNonLaborAccounts;
          } else if (entry.idType === "Vendor Employee") {
            // Map vendorResponseData using empId for Vendor Employee type
            suggestionList = vendorResponseData
              .map((emp) => ({
                emplId: emp.empId || "",
                firstName: "",
                lastName: emp.employeeName || "",
                orgId: emp.orgId || "",
                acctId: emp.acctId || "",
                acctName: emp.acctName || "",
              }))
              .filter((item) => item.emplId); // Only keep valid records
            accountsForThisRow = subContractorNonLaborAccounts;
          } else if (entry.idType === "Other") {
            suggestionList = []; // Other doesn't need suggestions
            accountsForThisRow = [
              ...employeeNonLaborAccounts,
              ...subContractorNonLaborAccounts,
              ...otherDirectCostNonLaborAccounts,
            ];
          }

          // Update state for this specific entry index
        console.log('1 ', suggestionList)

          setPastedEntrySuggestions((prev) => ({
            ...prev,
            [entryIndex]: suggestionList,
          }));

          setPastedEntryAccounts((prev) => ({
            ...prev,
            [entryIndex]: accountsForThisRow,
          }));

          setPastedEntryOrgs((prev) => ({
            ...prev,
            [entryIndex]: organizationOptions,
          }));
        });
      } catch (err) {
        console.error("Failed to fetch suggestions for pasted entries:", err);
      }
    };

    // Replace the fetchSuggestionsForPastedEntry function with this:

    // const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
    //   const encodedProjectId = encodeURIComponent(projectId);

    //   try {
    //     let projectData = cachedProjectData;
    //     let orgOptions = cachedOrgData;

    //     if (!projectData) {
    //       // const response = await axios.get(
    //       //   `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`,
    //       // );
    //       projectData = allData || []
    //       setCachedProjectData(projectData);
    //     }

    //     if (!orgOptions) {
    //       // const orgResponse = await axios.get(
    //       //   `${backendUrl}/Orgnization/GetAllOrgs`,
    //       // );
    //       const orgResponse = allOrgData || []
    //       orgOptions = Array.isArray(orgResponse)
    //         ? orgResponse.map((org) => ({
    //             value: org.orgId,
    //             label: org.orgId,
    //           }))
    //         : [];
    //       setCachedOrgData(orgOptions);
    //     }

    //     let suggestionList = [];

    //     // **KEY FIX: Check ONLY the current entry's idType, not all entries**
    //     if (entry.idType === "Employee") {
    //       const cacheKey = `employee_${projectId}`;
    //       const cached = sessionStorage.getItem(cacheKey);

    //       if (cached) {
    //         suggestionList = JSON.parse(cached);
    //       } else {
    //         // const response = await axios.get(
    //         //   `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}?type=othercost`,
    //         // );
    //         const response = allEmployeeData || []
    //         suggestionList = Array.isArray(response)
    //           ? response.map((emp) => {
    //               const [lastName, firstName] = (emp.employeeName || "")
    //                 .split(", ")
    //                 .map((str) => str.trim());
    //               return {
    //                 emplId: emp.empId,
    //                 firstName: firstName || "",
    //                 lastName: lastName || "",
    //                 orgId: emp.orgId || "",
    //                 acctId: emp.acctId || "",
    //                 acctName: emp.acctName || "",
    //               };
    //             })
    //           : [];
    //         sessionStorage.setItem(cacheKey, JSON.stringify(suggestionList));
    //       }
    //     } else if (
    //       entry.idType === "Vendor" ||
    //       entry.idType === "Vendor Employee"
    //     ) {
    //       const cacheKey = `vendor_${projectId}`;
    //       const cached = sessionStorage.getItem(cacheKey);
    //       let vendorResponseData = [];

    //       if (cached) {
    //         vendorResponseData = JSON.parse(cached);
    //       } else {
    //         const response = allVendorData || []
    //         // const response = await axios.get(
    //         //   `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=othercost`,
    //         // );
    //         vendorResponseData = Array.isArray(response)
    //           ? response
    //           : [];
    //         sessionStorage.setItem(
    //           cacheKey,
    //           JSON.stringify(vendorResponseData),
    //         );
    //       }

    //       // **CRITICAL FIX: Check the CURRENT entry's idType, not other entries**
    //       if (entry.idType === "Vendor") {
    //         suggestionList = vendorResponseData
    //           .map((emp) => ({
    //             emplId: emp.vendId || "",
    //             firstName: "",
    //             lastName: emp.employeeName || "",
    //             orgId: emp.orgId || "",
    //             acctId: emp.acctId || "",
    //             acctName: emp.acctName || "",
    //           }))
    //           .filter((item) => item.emplId);
    //       } else if (entry.idType === "Vendor Employee" || entry.idType === "VendorEmployee") {
    //         suggestionList = vendorResponseData
    //           .map((emp) => ({
    //             emplId: emp.empId || "",
    //             firstName: "",
    //             lastName: emp.employeeName || "",
    //             orgId: emp.orgId || "",
    //             acctId: emp.acctId || "",
    //             acctName: emp.acctName || "",
    //           }))
    //           .filter((item) => item.emplId);
    //       }
    //     }
    //     console.log('2 ', suggestionList)
    //     setPastedEntrySuggestions((prev) => ({
    //       ...prev,
    //       [entryIndex]: suggestionList,
    //     }));

    //     // Set accounts based on THIS entry's idType
    //     let accountsWithNames = [];
    //     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
    //       accountsWithNames = Array.isArray(
    //         projectData.subContractorNonLaborAccounts,
    //       )
    //         ? projectData.subContractorNonLaborAccounts.map((account) => ({
    //             id: account.accountId || account,
    //             name: account.acctName || account.accountId || String(account),
    //             accountId: account.accountId,
    //             acctName: account.acctName,
    //           }))
    //         : [];
    //     } else if (entry.idType === "Employee") {
    //       accountsWithNames = Array.isArray(
    //         projectData.employeeNonLaborAccounts,
    //       )
    //         ? projectData.employeeNonLaborAccounts.map((account) => ({
    //             id: account.accountId || account,
    //             name: account.acctName || account.accountId || String(account),
    //             accountId: account.accountId,
    //             acctName: account.acctName,
    //           }))
    //         : [];
    //     } else if (entry.idType === "Other") {
    //       accountsWithNames = [
    //         ...(Array.isArray(projectData.employeeNonLaborAccounts)
    //           ? projectData.employeeNonLaborAccounts
    //           : []),
    //         ...(Array.isArray(projectData.subContractorNonLaborAccounts)
    //           ? projectData.subContractorNonLaborAccounts
    //           : []),
    //         ...(Array.isArray(projectData.otherDirectCostNonLaborAccounts)
    //           ? projectData.otherDirectCostNonLaborAccounts
    //           : []),
    //       ].map((account) => ({
    //         id: account.accountId || account,
    //         name: account.acctName || account.accountId || String(account),
    //         accountId: account.accountId,
    //         acctName: account.acctName,
    //       }));
    //     }

    //     setPastedEntryAccounts((prev) => ({
    //       ...prev,
    //       [entryIndex]: accountsWithNames,
    //     }));

    //     setPastedEntryOrgs((prev) => ({
    //       ...prev,
    //       [entryIndex]: orgOptions,
    //     }));
    //   } catch (err) {
    //     console.error(
    //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
    //       err,
    //     );
    //   }
    // };

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
                  // ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=othercost&accountGroupCode=${groupCd || ""}`
                  ? `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=othercost`
                  : `${backendUrl}/Project/GetEmployeesByProjectV1/${encodedProjectId}?type=othercost&accountGroupCode=${groupCd || ""}`;
    
              const response = await axios.get(endpoint);
              const suggestions = Array.isArray(response.data)
                ? response.data.map((emp) => {
                    if (entry.idType === "Vendor") {
                      return {
                        emplId: emp.vendId,
                        firstName: "",
                        lastName: emp.employeeName,
                        // perHourRate: emp.perHourRate || emp.hrRate || "",
                        // plc: emp.plc || "",
                        orgId: emp.orgId || "",
                        orgName: emp.orgName || "",
                        acctId: emp.acctId || emp.accId || "",
                        acctName: emp.acctName || "",
                        // effectiveDate: emp.effectiveDate,
                        // esc_Percent: emp.esc_Percent,
                      };
                    } else if (entry.idType === "Vendor Employee" || entry.idType === "VendorEmployee") {
                      // NEW CASE: Handle VendorEmployee
                      return {
                        emplId: emp.empId,
                        firstName: "",
                        lastName: emp.employeeName,
                        // perHourRate: emp.perHourRate || emp.hrRate || "",
                        // plc: emp.plc || "",
                        orgId: emp.orgId || "",
                        orgName: emp.orgName || "",
                        acctId: emp.acctId || emp.accId || "",
                        acctName: emp.acctName || "",
                        // effectiveDate: emp.effectiveDate,
                        // esc_Percent: emp.esc_Percent,
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
                        // perHourRate: emp.perHourRate || emp.hrRate || "",
                        // plc: emp.plc || "",
                        orgId: emp.orgId || "",
                        orgName: emp.orgName || "",
                        acctId: emp.acctId || emp.accId || "",
                        acctName: emp.acctName || "",
                        // effectiveDate: emp.effectiveDate,
                        // esc_Percent: emp.esc_Percent,
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

    // const handlePasteMultipleRows = async () => {
    //   if (copiedRowsData.length === 0) {
    //     toast.error("No copied data available to paste", { autoClose: 2000 });
    //     return;
    //   }

    //   if (showNewForm) {
    //     setShowNewForm(false);
    //   }

    //   // USE ALL DURATIONS (not filtered) - same as what was copied
    //   const allDurations = [...durations].sort((a, b) => {
    //     if (a.year !== b.year) return a.year - b.year;
    //     return a.monthNo - b.monthNo;
    //   });

    //   const processedEntries = [];
    //   const processedAmountsArray = [];

    //   copiedRowsData.forEach((rowData) => {
    //     // ✅ FIXED: Added orgName (position 7) - Keep ALL existing logic
    //     const [
    //       idTypeLabel,
    //       rawId,
    //       name,
    //       acctId,
    //       acctName,
    //       orgId, // Position 6
    //       orgName, // ✅ NEW Position 7 (ignore if empty)
    //       isRev, // Position 8
    //       isBrd, // Position 9
    //       status,
    //       total,
    //       ...monthValues
    //     ] = rowData;

    //     const idType =
    //       ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
    //       idTypeLabel;

    //     // --- FIX: SANITIZE ID IMMEDIATELY ---
    //     const id = (rawId || "").replace(
    //       /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    //       ""
    //     );

    //     let firstName = "";
    //     let lastName = "";

    //     if (idType === "Vendor" || idType === "Vendor Employee") {
    //       lastName = name;
    //     } else if (idType === "Employee") {
    //       const nameParts = name.split(" ");
    //       firstName = nameParts[0];
    //       lastName = nameParts.slice(1).join(" ");
    //     } else {
    //       firstName = name;
    //     }

    //     const sanitizedId = id.trim();
    //     const finalId =
    //       idType === "Other" ? "TBD" : idType === "PLC" ? "PLC" : sanitizedId;
    //     // ✅ Keep ALL existing entry logic + ADD orgName
    //     const entry = {
    //       id: finalId,
    //       firstName: firstName,
    //       lastName: lastName,
    //       idType: idType,
    //       acctId: acctId,
    //       acctName: acctName,
    //       orgId: orgId,
    //       orgName: orgName || "", // ✅ NEW - store orgName from paste
    //       perHourRate: "",
    //       status: status || "ACT",
    //       isRev: isRev === "✓",
    //       isBrd: isBrd === "✓",
    //     };

    //     // ✅ ALL existing month logic - UNCHANGED
    //     const periodAmounts = {};
    //     copiedMonthMetadata.forEach((meta, index) => {
    //       const uniqueKey = `${meta.monthNo}_${meta.year}`;
    //       const value = monthValues[index];
    //       if (value && value !== "0.00" && value !== "0" && value !== "") {
    //         periodAmounts[uniqueKey] = value;
    //       }
    //     });

    //     processedEntries.push(entry);
    //     processedAmountsArray.push(periodAmounts);
    //   });

    //   setNewEntries(processedEntries);
    //   setNewEntryPeriodAmountsArray(processedAmountsArray);

    //   setHasClipboardData(false);
    //   setCopiedRowsData([]);
    //   setCopiedMonthMetadata([]);

    //   toast.success(
    //     `Pasted ${processedEntries.length} entries with all fiscal year data!`,
    //     { autoClose: 3000 }
    //   );

    //   fetchAllSuggestionsOptimizedForAmounts(processedEntries);
    // };

    const handlePasteMultipleRows = async () => {
      if (copiedRowsData.length === 0) {
        toast.error("No copied data available to paste", { autoClose: 2000 });
        return;
      }

      if (showNewForm) {
        setShowNewForm(false);
      }

      // USE ALL DURATIONS (not filtered) - same as what was copied
      const allDurations = [...durations].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });

      const processedEntries = [];
      const processedAmountsArray = [];

      copiedRowsData.forEach((rowData) => {
        const [
          idTypeLabel,
          rawId,
          name,
          acctId,
          acctName,
          orgId,
          orgName,
          isRev,
          isBrd,
          status,
          total,
          ...monthValues
        ] = rowData;

        const idType =
          ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
          idTypeLabel;
  //       const idType =
  // idTypeLabel === "NB"
  //   ? "NB"
  //   : ID_TYPE_OPTIONS.find((opt) => opt.label === idTypeLabel)?.value ||
  //     idTypeLabel;

        // Sanitize ID
        const id = (rawId || "").replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          "",
        );

        // let firstName = "";
        // let lastName = "";

        // if (idType === "Vendor" || idType === "Vendor Employee") {
        //   lastName = name;
        // } 
        // else if (idType === "Employee") {
        //   const nameParts = name.split(" ");
        //   firstName = nameParts[0];
        //   lastName = nameParts.slice(1).join(" ");
        // } 
        // else {
        //   firstName = name;
        // }
        let firstName = "";
let lastName = "";

if (idType === "Vendor" || idType === "Vendor Employee") {
  lastName = name;
} else if (idType === "Employee") {
  // ✅ Check if the name contains a comma (e.g., "Savariar, Jai X")
  if (name.includes(",")) {
    const nameParts = name.split(",");
    // Parts: ["Savariar", " Jai X"]
    lastName = nameParts[0].trim();
    firstName = nameParts[1].trim();
  } else {
    // Fallback for space-separated names (e.g., "Jai Savariar")
    const nameParts = name.split(" ");
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(" ");
  }
} else {
  firstName = name;
}

        const sanitizedId = id.trim();
        const finalId =
          idType === "Other" ? "TBD" : idType === "PLC" ? "PLC" : sanitizedId;

        const entry = {
          id: finalId,
          firstName: firstName,
          lastName: lastName,
          idType: idType,
          acctId: acctId,
          acctName: acctName,
          orgId: orgId,
          orgName: orgName || "",
          perHourRate: "",
          status: status || "ACT",
          isRev: isRev === "✓",
          isBrd: isBrd === "✓",
        };

        const periodAmounts = {};
        copiedMonthMetadata.forEach((meta, index) => {
          const uniqueKey = `${meta.monthNo}_${meta.year}`;
          const value = monthValues[index];
          if (value && value !== "0.00" && value !== "0" && value !== "") {
            periodAmounts[uniqueKey] = value;
          }
        });

        processedEntries.push(entry);
        processedAmountsArray.push(periodAmounts);
      });

      setNewEntries(processedEntries);
      setNewEntryPeriodAmountsArray(processedAmountsArray);

      setHasClipboardData(false);
      setCopiedRowsData([]);
      setCopiedMonthMetadata([]);

      toast.success(
        `Pasted ${processedEntries.length} entries with all fiscal year data!`,
        { autoClose: 3000 },
      );

      // ✅ CRITICAL: Call fetch AFTER state is updated with processed entries
      // Use setTimeout to ensure state update completes first
      setTimeout(() => {
        fetchAllSuggestionsOptimizedForAmounts(processedEntries);
      }, 0);
    };
    // const fetchSuggestionsForPastedEntry = async (entryIndex, entry) => {
    //   const encodedProjectId = encodeURIComponent(projectId);

    //   // **OPTIMIZATION: Use cached data instead of fetching for each entry**
    //   try {
    //     let projectData = cachedProjectData;
    //     let orgOptions = cachedOrgData;
    //     let employeeSuggestions = [];
    //     let vendorSuggestions = [];

    //     // Only fetch project data if not already cached
    //     if (!projectData) {
    //       const response = await axios.get(
    //         `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${planType}`
    //       );
    //       projectData = Array.isArray(response.data)
    //         ? response.data[0]
    //         : response.data;
    //       setCachedProjectData(projectData);
    //     }

    //     // Only fetch org data if not already cached
    //     if (!orgOptions) {
    //       const orgResponse = await axios.get(
    //         `${backendUrl}/Orgnization/GetAllOrgs`
    //       );
    //       orgOptions = Array.isArray(orgResponse.data)
    //         ? orgResponse.data.map((org) => ({
    //             value: org.orgId,
    //             label: org.orgId,
    //           }))
    //         : [];
    //       setCachedOrgData(orgOptions);
    //     }

    //     // **NEW: Fetch employee suggestions ONCE and cache**
    //     if (entry.idType === "Employee") {
    //       // Check if already fetched
    //       const cacheKey = `employee_${projectId}`;
    //       const cached = sessionStorage.getItem(cacheKey);

    //       if (cached) {
    //         employeeSuggestions = JSON.parse(cached);
    //       } else {
    //         const response = await axios.get(
    //           `${backendUrl}/Project/GetEmployeesByProject/${encodedProjectId}?type=othercost`
    //         );
    //         employeeSuggestions = Array.isArray(response.data)
    //           ? response.data.map((emp) => {
    //               const [lastName, firstName] = (emp.employeeName || "")
    //                 .split(", ")
    //                 .map((str) => str.trim());
    //               return {
    //                 emplId: emp.empId,
    //                 firstName: firstName || "",
    //                 lastName: lastName || "",
    //                 orgId: emp.orgId || "",
    //                 acctId: emp.acctId || "",
    //               };
    //             })
    //           : [];
    //         sessionStorage.setItem(cacheKey, JSON.stringify(employeeSuggestions));
    //       }

    //       setPastedEntrySuggestions((prev) => ({
    //         ...prev,
    //         [entryIndex]: employeeSuggestions,
    //       }));
    //     } else if (
    //       entry.idType === "Vendor" ||
    //       entry.idType === "Vendor Employee"
    //     ) {
    //       // Check if already fetched
    //       const cacheKey = `vendor_${projectId}`;
    //       const cached = sessionStorage.getItem(cacheKey);

    //       if (cached) {
    //         vendorSuggestions = JSON.parse(cached);
    //       } else {
    //         const response = await axios.get(
    //           `${backendUrl}/Project/GetVenderEmployeesByProject/${encodedProjectId}?type=othercost`
    //         );
    //         // vendorSuggestions = Array.isArray(response.data)
    //         //   ? response.data.map((emp) => ({
    //         //       emplId: emp.vendId || emp.empId,
    //         //       firstName: "",
    //         //       lastName: emp.employeeName,
    //         //       orgId: emp.orgId || "",
    //         //       acctId: emp.acctId || "",
    //         //     }))
    //         //   : [];
    //         vendorSuggestions = Array.isArray(response.data)
    //           ? response.data.map((emp) => {
    //               if (
    //                 entry.idType === "Vendor" ||
    //                 newEntries.some((e) => e.idType === "Vendor")
    //               ) {
    //                 return {
    //                   emplId: emp.vendId || "",
    //                   firstName: "",
    //                   lastName: emp.employeeName || "",
    //                   orgId: emp.orgId || "",
    //                   acctId: emp.acctId || "",
    //                   acctName: emp.acctName || "",
    //                 };
    //               } else if (
    //                 entry.idType === "Vendor Employee" ||
    //                 newEntries.some((e) => e.idType === "Vendor Employee")
    //               ) {
    //                 return {
    //                   emplId: emp.empId || "",
    //                   firstName: "",
    //                   lastName: emp.employeeName || "",
    //                   orgId: emp.orgId || "",
    //                   acctId: emp.acctId || "",
    //                   acctName: emp.acctName || "",
    //                 };
    //               } else {
    //                 // Fallback to existing logic
    //                 return {
    //                   emplId:  "",
    //                   firstName: "",
    //                   lastName: emp.employeeName || "",
    //                   orgId: emp.orgId || "",
    //                   acctId: emp.acctId || "",
    //                   acctName: emp.acctName || "",
    //                 };
    //               }
    //             })
    //           : [];
    //         sessionStorage.setItem(cacheKey, JSON.stringify(vendorSuggestions));
    //       }

    //       setPastedEntrySuggestions((prev) => ({
    //         ...prev,
    //         [entryIndex]: vendorSuggestions,
    //       }));
    //     }

    //     // Now use the cached data to populate entry-specific options
    //     let accountsWithNames = [];
    //     if (entry.idType === "Vendor" || entry.idType === "Vendor Employee") {
    //       accountsWithNames = Array.isArray(
    //         projectData.subContractorNonLaborAccounts
    //       )
    //         ? projectData.subContractorNonLaborAccounts.map((account) => ({
    //             id: account.accountId || account,
    //             name: account.acctName || account.accountId || String(account),
    //           }))
    //         : [];
    //     } else if (entry.idType === "Employee") {
    //       accountsWithNames = Array.isArray(projectData.employeeNonLaborAccounts)
    //         ? projectData.employeeNonLaborAccounts.map((account) => ({
    //             id: account.accountId || account,
    //             name: account.acctName || account.accountId || String(account),
    //           }))
    //         : [];
    //     } else if (entry.idType === "Other") {
    //       accountsWithNames = Array.isArray(
    //         projectData.otherDirectCostNonLaborAccounts
    //       )
    //         ? projectData.otherDirectCostNonLaborAccounts.map((account) => ({
    //             id: account.accountId || account,
    //             name: account.acctName || account.accountId || String(account),
    //           }))
    //         : [];
    //     }

    //     setPastedEntryAccounts((prev) => ({
    //       ...prev,
    //       [entryIndex]: accountsWithNames,
    //     }));

    //     setPastedEntryOrgs((prev) => ({
    //       ...prev,
    //       [entryIndex]: orgOptions,
    //     }));
    //   } catch (err) {
    //     console.error(
    //       `Failed to fetch pasted entry options for index ${entryIndex}:`,
    //       err
    //     );
    //   }
    // };

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
        perHourRate: "",
        status: "Act",
      };
      setNewEntries((prev) => [...prev, newEntry]);
      setNewEntryPeriodAmountsArray((prev) => [...prev, {}]);
    };

    const removeNewEntryForm = (index) => {
      setNewEntries((prev) => prev.filter((_, i) => i !== index));
      setNewEntryPeriodAmountsArray((prev) =>
        prev.filter((_, i) => i !== index),
      );
    };

    const updateNewEntry = (index, updates) => {
      setNewEntries((prev) =>
        prev.map((entry, i) =>
          i === index ? { ...entry, ...updates } : entry,
        ),
      );
    };

    const updateNewEntryPeriodAmounts = (index, periodAmounts) => {
      setNewEntryPeriodAmountsArray((prev) =>
        prev.map((amounts, i) =>
          i === index ? { ...amounts, ...periodAmounts } : amounts,
        ),
      );
    };

    // console.log(sortedEmployees);

    const geistSansStyle = {
      fontFamily: "'Geist', 'Geist Fallback', sans-serif",
    };
    return (
      <div className="relative p-2 font-inter w-full synchronized-tables-outer">
        {/* <div className="pt-1 text-white rounded-t-sm">
          <span className="font-semibold bg-black px-1 rounded-t-sm text-md sm:text-sm">
            Other Cost
          </span>
        </div> */}
        {/* <div className="flex items-center gap-3">
            <div className="bg-[#1e293b] p-1 rounded-lg shadow-md flex items-center justify-center">
    
              <UsersIcon className="w-2 h-2 text-white" />
            </div>
            <div>
              <h2 className="text-sm text-[#1e293b]  tracking-widest leading-none">
                Other Cost
              </h2>
            </div>
          </div> */}
          
          <div className="flex justify-center w-full">
            <div className="inline-flex items-center bg-[#17414D] px-2 py-1 rounded-md shadow-md">
              <h2 className="text-sm font-semibold  text-white leading-none flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4 text-white" />
                <span>Other Cost</span>
              </h2>
            </div>
          </div>
        {/* <div className="pt-2">
          <span className="bg-[#1e293b] text-white px-3 py-1 rounded-t-md text-xs font-bold uppercase tracking-wider shadow-sm">
            Other Cost
          </span>
        </div> */}
        <div className="w-full flex justify-between mb-1 gap-2">
          <div className="flex items-center  mt-1">
            <input
              type="text"
              placeholder="Search ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-l   outline-none w-40 border-r-0"
              // Optional: Allow pressing "Enter" to search
              onKeyDown={(e) => e.key === "Enter" && fetchData(true)}
            />
            <button
              onClick={() => fetchData(true)} // Calls the API with current searchTerm
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

          <div className="flex gap-2 items-center">
            {Object.values(hiddenRows).some(Boolean) && (
              <button className="btn1 btn-blue" onClick={showHiddenRows}>
                Show Hidden Rows
              </button>
            )}

            {isEditable && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Create a new entry object
                    const newEntryItem = {
                      id: "",
                      firstName: "",
                      lastName: "",
                      isRev: false,
                      isBrd: false,
                      idType: "",
                      acctId: "",
                      orgId: "",
                      perHourRate: "",
                      status: "Act",
                    };

                    // Add the new entry and its corresponding period amounts array entry
                    setNewEntries((prev) => [...prev, newEntryItem]);
                    setNewEntryPeriodAmountsArray((prev) => [...prev, {}]);
                    setShowNewForm(true); // Ensure the section is visible
                  }}
                  className="btn1 btn-blue"
                >
                  New
                </button>
              </div>
            )}

            {/* Copy/Paste Buttons */}
            {showCopyButton &&  (
              <button
                onClick={handleCopySelectedRows}
                className={`btn1 btn-blue`}
              >
                Copy Selected ({selectedRows.size})
              </button>
            )}

            {hasClipboardData &&
              !showNewForm &&
              newEntries.length === 0 &&
              initialData.status === "In Progress" && (
                <button
                  onClick={handlePasteMultipleRows}
                  className={`btn1 btn-blue`}
                  //                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                  //           style={{
                  //   ...geistSansStyle,
                  //   backgroundColor:  "#113d46",
                  // }}
                >
                  Paste ({copiedRowsData.length} rows)
                </button>
              )}

            {isEditable && !showNewForm && !shouldHideButtons && (
              <button
                // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                // style={{
                //   ...geistSansStyle,
                //   backgroundColor: "#113d46",
                // }}
                className={`btn1 btn-blue`}
                onClick={() => {
                  // Logic is already safe, but double check is good
                  if (isEditable) {
                    setShowFindReplace(true);
                  }
                }}
              >
                Find / Replace
              </button>
            )}

            {isEditable && !shouldHideButtons && (
              <button
                className={`btn1
                   ${
                     shouldDisableDelete ||
                     (selectedRows.size === 0 && !selectedEmployeeId)
                       ? "bg-gray-400 cursor-not-allowed"
                       : "bg-red-500 hover:bg-red-600"
                   }`}
                onClick={handleDeleteEmployee} // Call the new bulk handler
                disabled={
                  shouldDisableDelete ||
                  (selectedRows.size === 0 && !selectedEmployeeId)
                }
              >
                {selectedRows.size > 1
                  ? `Delete Selected (${selectedRows.size})`
                  : "Delete"}
              </button>
            )}

            {/* Updated Fill Values Button Condition */}
            {(showNewForm || selectedRows.size > 0) && (
              <button
                // className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white`}
                // style={{
                //   ...geistSansStyle,
                //   backgroundColor: "#113d46",
                // }}
                className={`btn1 btn-blue`}
                onClick={() => {
                  if (isEditable) {
                    setShowFillValues(true);
                  }
                }}
              >
                Fill Values
              </button>
            )}

            {/* ONE UNIFIED SAVE BUTTON */}
            {/* {(newEntries.length > 0 ||
              hasUnsavedAmountChanges ||
              hasUnsavedFieldChanges) && (
              <button
                onClick={handleMasterSave}
                // className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors text-white"
                // style={{
                //   ...geistSansStyle,
                //   backgroundColor: "#113d46",
                // }}
                className={`btn1 btn-blue`}
                disabled={isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : `Save All (${
                      newEntries.length +
                      Object.keys(modifiedAmounts).length +
                      (hasUnsavedFieldChanges ? 1 : 0)
                    })`}
              </button>
            )} */}

            {(newEntries.length > 0 ||
              hasUnsavedAmountChanges ||
              hasUnsavedFieldChanges ||
              showNewForm) && (
              <button
                onClick={() => {
                  // 1. LIFO: Prioritize removing the latest New Entry form if multiple exist
                  if (newEntries.length > 0) {
                    const updatedEntries = newEntries.slice(0, -1);
                    const updatedAmounts = newEntryPeriodAmountsArray.slice(
                      0,
                      -1,
                    );
                    setNewEntries(updatedEntries);
                    setNewEntryPeriodAmountsArray(updatedAmounts);

                    if (updatedEntries.length === 0) {
                      setShowNewForm(false);
                      resetNewEntry();
                    }
                    return;
                  }

                  // 2. Otherwise, revert grid changes and hide form
                  if (hasUnsavedAmountChanges) {
                    setInputValues({});
                    setModifiedAmounts({});
                    setHasUnsavedAmountChanges(false);
                  }

                  if (hasUnsavedFieldChanges) {
                    setEditedRowData({});
                    setEditingRowIndex(null);
                    setHasUnsavedFieldChanges(false);
                  }

                  if (showNewForm) setShowNewForm(false);

                  setFindMatches([]);
                  setHasClipboardData(false);
                  setCopiedRowsData([]);
                  toast.info("Changes reverted", { autoClose: 1500 });
                }}
                // className="px-4 py-2 blue-btn-common text-white rounded text-xs font-medium cursor-pointer"
                // style={{
                //     ...geistSansStyle,
                //     backgroundColor: "#113d46", // Keeping your requested color
                // }}
                className={`btn1 btn-blue`}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

      {showFillValues && (
  <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/20">
    <div 
      style={{ transform: `translate(${modalPos.x}px, ${modalPos.y}px)`, transition: 'none' }}
      onMouseDown={(e) => handleDrag(e, setModalPos, modalPos)} 
      className="w-full max-w-md bg-white rounded-t-xl sm:rounded-lg shadow-xl border animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white p-6 text-sm">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 select-none">
          Fill Values
        </h3>

        {/* TOP BOX: Displays the Target Records (selectedRows) */}
        <div className="pointer-events-auto">
          {selectedRows.size > 0 && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs max-h-32 overflow-y-auto">
              <p className="font-bold mb-1 text-blue-800">Records to Fill:</p>
              {Array.from(selectedRows).map((idx) => {
                const emp = employees[idx]; // Fixed to use 'employees' array for Amounts
                return (
                  <div key={idx} className="border-b border-blue-100 pb-1 mb-1 last:border-0">
                    {/* ID: {emp?.emplId} | Acc: {emp?.acctId} | Org: {emp?.orgId} */}
                    ID: {emp.emple?.emplId} | Acc: {emp.emple?.accId} |{" "}
                            Org:{" "}  {emp.emple?.orgId}

                  </div>
                );
              })}
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
            <option value="Copy From Source Record">Copy from Source Record</option>
            <option value="Specify Amounts">Specify Amounts</option>
            <option value="Use Start Period Amounts">Use Start Period Amounts</option>
          </select>
        </div>

        {/* DROPDOWN: Functions as Source Selection (Visible even during New Entry) */}
        {fillMethod === "Copy From Source Record" && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1 pointer-events-auto">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              Select Source Record (Copy From)
            </label>
            <select
              value={selectedSourceIdx}
              onChange={(e) => setSelectedSourceIdx(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select Source Record --</option>
              {employees.map((emp, idx) => (
                <option key={idx} value={idx}>
                 ID: {emp.emple?.emplId} | Acc: {emp.emple?.accId} |{" "}
                            Org:{" "}  {emp.emple?.orgId}

                </option>
              ))}
            </select>
          </div>
        )}

        {fillMethod === "Specify Amounts" && (
          <div className="mb-4 pointer-events-auto">
            <label className="block text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              Amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={fillAmounts}
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/[^0-9.]/g, "");
                setFillAmounts(cleanValue);
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-xs"
              placeholder="0.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6 pointer-events-auto">
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

        <div className="flex justify-end gap-3 border-t pt-4 pointer-events-auto">
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
              if (newEntries.length === 0 && fillMethod === "Copy From Source Record" && selectedSourceIdx === "") {
                toast.error("Please select a source record from the dropdown.");
                return;
              }
              handleFillValuesAmounts();
            }}
            disabled={
              fillMethod === "None" ||
              (newEntries.length === 0 && selectedRows.size === 0)
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

        {employees.length === 0 &&
        !showNewForm &&
        sortedDurations.length > 0 ? (
          <div className="bg-yellow-100  border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs">
            No data available.
          </div>
        ) : (
          // <div ref={verticalScrollRef} className="vertical-scroll-wrapper">
          <div className="border-line">
            <div className="synchronized-tables-container flex w-full">
              <div
                ref={firstTableRef}
                onScroll={handleFirstScroll}
                className="middle-scrollbar flex-1"
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  overflowX: "scroll",
                  // marginTop: "-3px"
                }}
              >
                <table className="table-fixed min-w-full table">
                  <thead className="thead h-[50px]">
                    <tr
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      <th className="th-thead-blue w-6 text-center">
                        <input
                          type="checkbox"
                          // ref={(el) => {
                          //   if (el) el.indeterminate = isIndeterminate;
                          // }}
                          className="w-3 h-3"
                          checked={areAllVisibleSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={visibleRowIndices.length === 0}
                        />
                      </th>
                      {EMPLOYEE_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="th-thead-blue whitespace-nowrap   min-w-[70px]" // Changed p-2 to p-1.5, min-w-[80px] to min-w-[70px]
                          onClick={
                            col.key === "acctId"
                              ? () => handleSort("acctId")
                              : undefined
                          }
                          style={{
                            cursor:
                              col.key === "acctId" ? "pointer" : "default",
                            textAlign:"center",
                          }}
                        >
                          {col.label}
                          {col.key === "acctId" && (
                            <span className="text-[12px] text-gray-500">
                              {getSortIcon("acctId")}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {/* Pasted Entries */}
                    {/* Pasted Entries */}

                    {newEntries.length > 0 &&
                      newEntries.map((entry, entryIndex) => (
                        <React.Fragment key={`pasted-duration-${entryIndex}`}>
                          <tr
                            key={`new-entry-${entryIndex}`}
                            className=" "
                            style={{
                              height: `${ROW_HEIGHT_DEFAULT}px`,
                              lineHeight: "normal",
                            }}
                          >
                            <td className="tbody-td min-w-[45px] px-2 text-center">
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
                                // onChange={(e) => {
                                //   const value = e.target.value;
                                //   const newId = value === "PLC" ? "PLC" : "";
                                //   setNewEntries((prev) =>
                                //     prev.map((ent, idx) =>
                                //       idx === entryIndex
                                //         ? {
                                //             ...ent,
                                //             id: newId,
                                //             firstName: "",
                                //             lastName: "",
                                //             isRev: false,
                                //             isBrd: false,
                                //             idType: value,
                                //             acctId: "",
                                //             orgId: "",
                                //             status: "Act",
                                //           }
                                //         : ent
                                //     )
                                //   );
                                //   fetchSuggestionsForPastedEntry(entryIndex, { ...entry, idType: value });
                                // }}
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
                                    value === "Other" ? allData.orgId : "";
                                  const org_Name =
                                    value === "Other" ? allData.orgName : "";

                                  // 1. Update the local entry state
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? {
                                            ...ent,
                                            idType: value,
                                            id: newId,
                                            firstName: "",
                                            lastName: "",
                                            acctId: "",
                                            orgId: org_id,
                                            orgName: org_Name,
                                            acctName: "",
                                            status: "Act",
                                          }
                                        : ent,
                                    ),
                                  );

                                  fetchSuggestionsForPastedEntry(entryIndex, {
                                    ...entry,
                                    idType: value,
                                  });
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
                            {/* <td className="tbody-td min-w-[115px]">
          <input
            type="text"
            value={entry.id}
            onKeyDown={(e) => e.key === ' ' && e.stopPropagation()}
            // onChange={(e) => {
            //   const val = e.target.value.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "");
            //   const trimmedValue = val.trim();
            //   setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, id: val } : ent)));
            //   if (entry.idType !== "Other") {
            //     const suggestions = pastedEntrySuggestions[entryIndex] || [];
            //     const selectedEmployee = suggestions.find((emp) => emp.emplId === trimmedValue);
            //     if (selectedEmployee) {
            //       setNewEntries((prev) =>
            //         prev.map((ent, idx) =>
            //           idx === entryIndex
            //             ? {
            //                 ...ent,
            //                 id: trimmedValue,
            //                 firstName: selectedEmployee.firstName || "",
            //                 lastName: selectedEmployee.lastName || "",
            //                 orgId: selectedEmployee.orgId || ent.orgId,
            //               }
            //             : ent
            //         )
            //       );
            //     }
            //   }
            // }}
            onChange={(e) => {
  const val = e.target.value.trim();
  const suggestions = pastedEntrySuggestions[entryIndex] || [];
  
  // 1. Find the matched employee from suggestions
  const matchedEmployee = suggestions.find((emp) => emp.emplId === val);

  if (matchedEmployee) {
    // 2. Find the Account Name for this employee's acctId
    const acctList = getAccountSuggestionsByType(entry.idType);
    const matchedAcct = acctList.find(a => (a.accountId || a.id) === matchedEmployee.acctId);

    // 3. Find the Org Name for this employee's orgId
    const matchedOrg = organizationOptions.find(o => String(o.value) === String(matchedEmployee.orgId));

    updateNewEntry(entryIndex, { 
      id: val,
      firstName: matchedEmployee.firstName || "",
      lastName: matchedEmployee.lastName || "",
      acctId: matchedEmployee.acctId || "",
      acctName: matchedAcct ? matchedAcct.acctName : "", // AUTO-POPULATE ACCOUNT NAME
      orgId: String(matchedEmployee.orgId || ""),
      orgName: matchedOrg ? matchedOrg.orgName : ""     // AUTO-POPULATE ORG NAME
    });
  } else {
    updateNewEntry(entryIndex, { id: val });
  }
}}
            disabled={entry.idType === "PLC"}
            style={{ maxWidth: "100px" }}
            className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none ${entry.idType === "PLC" ? "bg-gray-100" : ""}`}
            list={`employee-id-list-${entryIndex}`}
            placeholder="ID"
          />
          <datalist id={`employee-id-list-${entryIndex}`}>
            {(pastedEntrySuggestions[entryIndex] || []).filter((emp) => emp.emplId).map((emp, idx) => (
              <option key={idx} value={emp.emplId}>{emp.lastName}, {emp.firstName}</option>
            ))}
          </datalist>
        </td> */}
                            {/* <td className="tbody-td min-w-[115px]">
  <input
    type="text"
    value={entry.id}
    onKeyDown={(e) => e.key === ' ' && e.stopPropagation()}
    onChange={(e) => {
      const val = e.target.value.trim();
      const [emplId, lastName] = val.split(" - ");
      const suggestions = pastedEntrySuggestions[entryIndex] || [];
      
      // 1. Find the matched employee object
      const matchedEmployee = suggestions.find((emp) => emp.lastName === lastName);

      if (matchedEmployee) {
        // 2. Resolve the names for Account and Org immediately
        const acctList = getAccountSuggestionsByType(entry.idType);
        const matchedAcct = acctList.find(a => (a.accountId || a.id) === matchedEmployee.acctId);
        const matchedOrg = organizationOptions.find(o => String(o.value) === String(matchedEmployee.orgId));

        // 3. Update all 6 fields in one state change
        updateNewEntry(entryIndex, { 
          id: emplId,
          firstName: matchedEmployee.firstName || "",
          lastName: matchedEmployee.lastName || "",
          acctId: matchedEmployee.acctId || "",
          acctName: matchedAcct ? matchedAcct.acctName : "", // AUTO-POPULATE
          orgId: String(matchedEmployee.orgId || ""),
          orgName: matchedOrg ? matchedOrg.orgName : ""      // AUTO-POPULATE
        });
      } else {
        updateNewEntry(entryIndex, { id: val });
      }
    }}
    disabled={entry.idType === "PLC"}
    className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none ${entry.idType === "PLC" ? "bg-gray-100" : ""}`}
    list={`employee-id-list-${entryIndex}`}
    placeholder="ID"
  />
  <datalist id={`employee-id-list-${entryIndex}`}>
    {(pastedEntrySuggestions[entryIndex] || []).filter((emp) => emp.emplId).map((emp, idx) => (
      // Adding the Name/Account here is ONLY for the user to see in the dropdown 
      // so they can choose the correct one if IDs are identical.
      <option key={idx} value={`${emp.emplId} - ${emp.lastName} ${emp.firstName}`}>
        
      </option>
    ))}
  </datalist>
</td> */}
                            <td className="tbody-td min-w-[115px]">
                              <input
                                type="text"
                                value={entry.id}
                                onKeyDown={(e) =>
                                  e.key === " " && e.stopPropagation()
                                }
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  // 1. Extract the Clean ID if selecting from datalist (split by " - ")
                                  // const cleanId = rawValue.split(" - ")[0].trim();
                                  const [emplId, lastName] =
                                    rawValue.split(" - ");

                                  // show only ID in the input
                                  setNewEntries((prev) =>
                                    prev.map((ent, idx) =>
                                      idx === entryIndex
                                        ? { ...ent, id: emplId }
                                        : ent,
                                    ),
                                  );

                                  const suggestions =
                                    pastedEntrySuggestions[entryIndex] || [];

                                  // 2. Find the matched employee object from suggestions
                                  // We check if the ID matches OR if the full display string matches what's in the datalist
                                  const matchedEmployee = suggestions.find(
                                    (emp) =>
                                      String(emp.emplId) === emplId &&
                                      emp.lastName === lastName,
                                  );

                                  if (matchedEmployee) {
                                    // 3. Resolve the names for Account and Organization
                                    const acctList =
                                      getAccountSuggestionsByType(entry.idType);
                                    const matchedAcct = acctList.find(
                                      (a) =>
                                        (a.accountId || a.id) ===
                                        matchedEmployee.acctId,
                                    );
                                    const matchedOrg = organizationOptions.find(
                                      (o) =>
                                        String(o.value) ===
                                        String(matchedEmployee.orgId),
                                    );

                                    // 4. Update the entry with clean data and auto-populated names
                                    updateNewEntry(entryIndex, {
                                      id: matchedEmployee.emplId, // Sets ONLY the numeric ID back to the field
                                      firstName:
                                        matchedEmployee.firstName || "",
                                      lastName: matchedEmployee.lastName || "",
                                      acctId: matchedEmployee.acctId || "",
                                      // acctName: matchedAcct ? ( matchedEmployee.acctName || matchedAcct.acctName || matchedAcct.name) : "",
                                      acctName:
                                        matchedEmployee.acctName ||
                                        matchedAcct?.acctName ||
                                        matchedAcct?.name ||
                                        "",
                                      orgId: String(
                                        matchedEmployee.orgId || "",
                                      ),
                                      orgName: matchedOrg
                                        ? matchedOrg.orgName || matchedOrg.label
                                        : "",
                                    });
                                  } else {
                                    // If the user is just typing and hasn't selected a match yet
                                    updateNewEntry(entryIndex, {
                                      id: rawValue,
                                    });
                                  }
                                }}
                                disabled={
                                  entry.idType === "PLC" ||
                                  entry.idType === "Other"
                                }
                                className={`border border-gray-300 rounded px-1 py-0.5 text-xs outline-none ${entry.idType === "PLC" || entry.idType === "Other" ? "bg-gray-100" : ""}`}
                                list={`employee-id-list2-${entryIndex}`}
                                placeholder="ID"
                              />
                              {/* <datalist id={`employee-id-list-${entryIndex}`}>
    {(pastedEntrySuggestions[entryIndex] || []).filter((emp) => emp.emplId).map((emp, idx) => (
      <option key={idx} value={`${emp.emplId} - ${emp.lastName} ${emp.firstName}`} />
    ))}
  </datalist> */}
                              <datalist id={`employee-id-list2-${entryIndex}`}>
                                {(pastedEntrySuggestions[entryIndex] || []).map(
                                  (emp, idx) => (
                                    <option
                                      key={idx}
                                      value={`${emp.emplId} - ${emp.lastName}`}
                                    >
                                      {emp.lastName}, {emp.firstName}
                                    </option>
                                  ),
                                )}
                              </datalist>
                            </td>
                            <td className="tbody-td min-w-[115px] ">
                              <input
                                type="text"
                                // value={entry.idType === "Other" || planType === "NBBUD" ? entry.firstName || "" : entry.lastName && entry.firstName ? `${entry.lastName}, ${entry.firstName}` : entry.lastName || entry.firstName || ""}
                                // readOnly={entry.idType !== "Other"}
                                value={
                                  entry.idType === "Other"
                                    ? entry.firstName || ""
                                    : entry.lastName && entry.firstName
                                      ? `${entry.lastName}, ${entry.firstName}`
                                      : entry.lastName || entry.firstName || ""
                                }
                                readOnly={entry.idType !== "Other"}
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
                                    setNewEntries((prev) =>
                                      prev.map((ent, idx) =>
                                        idx === entryIndex
                                          ? {
                                              ...ent,
                                              firstName: cleanValue.trimStart(),
                                              lastName: "",
                                            }
                                          : ent,
                                      ),
                                    );
                                  }
                                }}
                                style={{ maxWidth: "100px" }}
                                className={`border border-gray-300 rounded px-1 py-0.5 text-xs ${entry.idType === "Other" || planType === "NBBUD" ? "bg-white" : "bg-gray-100"}`}
                                placeholder="Name"
                              />
                            </td>

                            {/* Account ID Column */}
                            {/* <td className="tbody-td">
    <input
        type="text"
        value={newEntry.acctId}
        list="new-entry-acct-list"
        onChange={(e) => {
            const val = e.target.value;
            // Requirement: Find the matching account to auto-populate the name
            const matched = nonLaborAccounts.find(a => a.accountId === val);
            setNewEntry(prev => ({
                ...prev,
                acctId: val,
                acctName: matched ? matched.acctName : "" 
            }));
        }}
        // Requirement: Styling synced with Org ID
        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs outline-none focus:border-blue-400"
        placeholder="Account"
    />
    <datalist id="new-entry-acct-list">
        {nonLaborAccounts.map((acc, idx) => (
            <option key={idx} value={acc.accountId}>
                {acc.acctName}
            </option>
        ))}
    </datalist>
</td> */}
                            {/* Inside newEntries.map loop */}
                            {/* <td className="tbody-td">
  <input
    type="text"
    value={entry.acctId}
    // Logic: Get list based on THIS new form's selected idType
    list={`new-entry-acct-list-${entryIndex}`} 
    onChange={(e) => {
      const val = e.target.value;
      const suggestions = getAccountSuggestionsByType(entry.idType);
      const matched = suggestions.find(a => (a.accountId || a.id) === val);
      
      updateNewEntry(entryIndex, {
        acctId: val,
        acctName: matched ? (matched.acctName || matched.name) : ""
      });
    }}
    className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
  />
  <datalist id={`new-entry-acct-list-${entryIndex}`}>
    {getAccountSuggestionsByType(entry.idType).map((acc, idx) => (
      <option key={idx} value={acc.accountId || acc.id}>
        {acc.acctName || acc.name}
      </option>
    ))}
  </datalist>
</td> */}
                            {/* Inside newEntries.map loop */}
                            {/* <td className="tbody-td">
    <input
        type="text"
        value={entry.acctId || ""}
        list={`new-entry-acct-list-${entryIndex}`}
        onChange={(e) => {
            const val = e.target.value;
            // Get the specific allowed accounts for THIS row's type
            const suggestions = getAccountSuggestionsByType(entry.idType);
            
            // Find the matching account object
            const matched = suggestions.find(a => (a.accountId || a.id) === val);
            
            // Update the state for this specific index
            updateNewEntry(entryIndex, {
                acctId: val,
                acctName: matched ? (matched.acctName || matched.name) : "" 
            });
        }}
        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
        placeholder="Account"
    />
    <datalist id={`new-entry-acct-list-${entryIndex}`}>
        {getAccountSuggestionsByType(entry.idType).map((acc, idx) => (
            <option key={idx} value={acc.accountId || acc.id}>
                {acc.acctName || acc.name}
            </option>
        ))}
    </datalist>
</td> */}
                            {/* Inside newEntries.map loop - Account ID Column */}
                            <td className="tbody-td">
                              <input
                                type="text"
                                value={entry.acctId || ""}
                                list={`new-entry-acct-list-${entryIndex}`}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Get filtered suggestions based on this specific row's ID Type
                                  const suggestions =
                                    getAccountSuggestionsByType(entry.idType);
                                  const matched = suggestions.find(
                                    (a) => (a.accountId || a.id) === val,
                                  );

                                  // Update both ID and Name in the array
                                  updateNewEntry(entryIndex, {
                                    acctId: val,
                                    acctName: matched ? matched.acctName : "",
                                  });
                                }}
                                className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                placeholder="Account"
                              />
                              <datalist
                                id={`new-entry-acct-list-${entryIndex}`}
                              >
                                {getAccountSuggestionsByType(entry.idType).map(
                                  (acc, idx) => (
                                    <option
                                      key={idx}
                                      value={acc.accountId || acc.id}
                                    >
                                      {acc.acctName}
                                    </option>
                                  ),
                                )}
                              </datalist>
                            </td>

                            {/* Account Name Column - Must pull from entry.acctName */}
                            <td className="tbody-td">
                              <input
                                type="text"
                                value={entry.acctName || ""}
                                readOnly
                                className="w-full bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs cursor-not-allowed"
                                placeholder="Account Name"
                              />
                            </td>

                            {/* <td className="tbody-td">
    <input
        type="text"
        value={entry.acctName || ""} // This now pulls from the specific entry object
        readOnly
        className="w-full bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs cursor-not-allowed"
        placeholder="Account Name"
    />
</td> */}

                            {/* Account Name Column */}
                            {/* <td className="tbody-td">
    <input
        type="text"
        value={newEntry.acctName || ""}
        readOnly
        // Requirement: Styling synced with Org Name (bg-gray-100)
        className="w-full bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs cursor-not-allowed"
        placeholder="Account Name"
    />
</td> */}

                            {/* Organization Column */}
                            {/* <td className="tbody-td min-w-[125px]">
          <input
            type="text"
            value={entry.orgId}
            onChange={(e) => setNewEntries((prev) => prev.map((ent, idx) => (idx === entryIndex ? { ...ent, orgId: e.target.value } : ent)))}
            style={{ maxWidth: "110px" }}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
            list={`org-list-pasted-${entryIndex}`}
            placeholder="Org"
          />
          <datalist id={`org-list-pasted-${entryIndex}`}>
            {(pastedEntryOrgs[entryIndex] || []).map((org, index) => (
              <option key={index} value={org.value}>{org.label}</option>
            ))}
          </datalist>
        </td> */}
                            {/* <td className="tbody-td min-w-[125px]">
  <input
    type="text"
    value={entry.orgId}
    onChange={(e) => {
      const val = e.target.value;
      const matchedOrg = organizationOptions.find(org => org.value.toString() === val);
      updateNewEntry(entryIndex, { 
        orgId: val, 
        orgName: matchedOrg ? matchedOrg.orgName : "" 
      });
    }}
    style={{ maxWidth: "110px" }}
    className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
    list={`org-list-pasted-${entryIndex}`}
    placeholder="Org"
  />
  <datalist id={`org-list-pasted-${entryIndex}`}>
    {organizationOptions.map((org, index) => (
      <option key={index} value={org.value}>{org.label}</option>
    ))}
  </datalist>
</td> */}
                            <td className="tbody-td min-w-[125px]">
                              <input
                                type="text"
                                value={entry.orgId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Find matching org from the global organizationOptions state
                                  const matchedOrg = organizationOptions.find(
                                    (org) => org.value.toString() === val,
                                  );

                                  // Update Org ID and auto-populate Org Name
                                  updateNewEntry(entryIndex, {
                                    orgId: val,
                                    orgName: matchedOrg
                                      ? matchedOrg.orgName ||
                                        matchedOrg.label.split(" - ")[1]
                                      : "",
                                  });
                                }}
                                style={{ maxWidth: "110px" }}
                                className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                list={`org-list-pasted-${entryIndex}`}
                                placeholder="Org"
                              />
                              <datalist id={`org-list-pasted-${entryIndex}`}>
                                {organizationOptions.map((org, index) => (
                                  <option key={index} value={org.value}>
                                    {org.label}
                                  </option>
                                ))}
                              </datalist>
                            </td>

                            {/* <td>

              <input
  type="text"
  value={newEntry.orgName || ''}
  readOnly
  className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs"
  placeholder="Org Name (auto-populated)"
  style={{ maxWidth: "130px" }}
/>

        </td> */}
                            <td className="tbody-td min-w-[120px]"> 
                              <input
                                type="text"
                                value={entry.orgName || ""}
                                readOnly
                                className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs w-full"
                                placeholder="Org Name"
                                style={{ maxWidth: "130px" }}
                              />
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
                            <td className="tbody-td">
                              {Object.values(
                                newEntryPeriodAmountsArray[entryIndex] || {},
                              )
                                .reduce(
                                  (sum, val) => sum + (parseFloat(val) || 0),
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
                        const actualEmpIdx = employees.findIndex(
                          (e) => e === emp,
                        );
                        const row = getEmployeeRow(emp, actualEmpIdx);
                        const uniqueRowKey = `${emp.emple.emplId || "emp"}-${actualEmpIdx}`;
                        const isSelected = selectedRows.has(actualEmpIdx);

                        return (
                          <tr
                            key={uniqueRowKey}
                            className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                              isSelected
                                ? "bg-blue-100"
                                : selectedRowIndex === actualEmpIdx
                                  ? ""
                                  : "even:bg-gray-50"
                            }`}
                            style={{
                              height: `${ROW_HEIGHT_DEFAULT}px`,
                              lineHeight: "normal",
                              cursor: isEditable ? "pointer" : "default",
                            }}
                          >
                            <td className="tbody-td text-center w-6">
                              <input
                                type="checkbox"
                                className="w-3 h-3"
                                checked={isSelected}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(
                                    actualEmpIdx,
                                    e.target.checked,
                                  );
                                }}
                              />
                            </td>

                            {EMPLOYEE_COLUMNS.map((col) => {
                              let tdWidth = "min-w-[70px]";
                              if (col.key === "idType") {
  const value = row.idType;

  return (
    <td
      key={`${uniqueRowKey}-idType`}
      className={`tbody-td ${tdWidth}`}
    >
      {value?.toUpperCase() === "NB" ? "NB" : value}
    </td>
  );
}
                              if (col.key === "emplId")
                                tdWidth = "min-w-[115px]";
                              if (col.key === "acctId" || col.key === "orgId")
                                tdWidth = "min-w-[125px]";
                              // if (col.key === "acctName" || col.key === "name") tdWidth = "min-w-[130px]";
                              if (
                                col.key === "acctName" ||
                                col.key === "orgName" ||
                                col.key === "name"
                              )

                                                              if (col.key === "name") {
  const canEditName =
    row.idType === "Other" && isBudPlan && isEditable;
 
  const displayValue =
    editedRowData[actualEmpIdx]?.name !== undefined
      ? editedRowData[actualEmpIdx].name
      : row.name || "";
 
  return (
    <td
      key={`${uniqueRowKey}-name`}
      className="tbody-td min-w-[130px] text-left"
    >
      {canEditName ? (
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value;
            setEditedRowData((prev) => ({
              ...prev,
              [actualEmpIdx]: {
                ...prev[actualEmpIdx],
                name: val,
              },
            }));
            setEditingRowIndex(actualEmpIdx);
            setHasUnsavedFieldChanges(true);
          }}
          className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none w-full"
        />
      ) : (
        row.name || "-"
      )}
    </td>
  );
}
                                tdWidth = "min-w-[130px]";

                              //           if (isBudPlan && isEditable) {
                              //             if (col.key === "acctId") {
                              //               return (
                              //                 <td key={`${uniqueRowKey}-acctId`} className={`tbody-td ${tdWidth}`}>
                              //                   <input
                              //                     type="text"
                              //                     value={editedRowData[actualEmpIdx]?.acctId !== undefined ? editedRowData[actualEmpIdx].acctId : row.acctId}
                              //                     onChange={(e) => {
                              //                       const val = e.target.value;
                              //                       const matched = accountOptionsWithNames.find(acc => (acc.id || acc.accountId) === val);
                              //                       setEditedRowData(prev => ({
                              //                         ...prev,
                              //                         [actualEmpIdx]: { ...prev[actualEmpIdx], acctId: val, acctName: matched ? (matched.name || matched.acctName) : "" }
                              //                       }));
                              //                       setEditingRowIndex(actualEmpIdx);
                              //                       setHasUnsavedFieldChanges(true);
                              //                     }}
                              //                     style={{ maxWidth: "110px" }}
                              //                     className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                              //                     list={`account-list-${actualEmpIdx}`}
                              //                   />
                              //                   <datalist id={`account-list-${actualEmpIdx}`}>
                              //                     {accountOptionsWithNames.map((acc, i) => <option key={i} value={acc.id} />)}
                              //                   </datalist>
                              //                 </td>
                              //               );
                              //             }
                              //             // if (col.key === "orgId") {
                              //             //   return (
                              //             //     <td key={`${uniqueRowKey}-orgId`} className={`tbody-td ${tdWidth}`}>
                              //             //       <input
                              //             //         type="text"
                              //             //         value={editedRowData[actualEmpIdx]?.orgId !== undefined ? editedRowData[actualEmpIdx].orgId : row.orgId}
                              //             //         onChange={(e) => handleRowFieldChange(actualEmpIdx, "orgId", e.target.value)}
                              //             //         style={{ maxWidth: "110px" }}
                              //             //         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                              //             //         list={`org-list-${actualEmpIdx}`}
                              //             //       />
                              //             //       <datalist id={`org-list-${actualEmpIdx}`}>
                              //             //         {organizationOptions.map((org, i) => <option key={i} value={org.value}>{org.label}</option>)}
                              //             //       </datalist>
                              //             //     </td>
                              //             //   );
                              //             // }
                              // //             if (col.key === "orgId") {
                              // //   return (
                              // //     <td key={`${uniqueRowKey}-orgId`} className={`tbody-td ${tdWidth}`}>
                              // //       <input
                              // //         type="text"
                              // //         value={editedRowData[actualEmpIdx]?.orgId !== undefined ? editedRowData[actualEmpIdx].orgId : row.orgId}
                              // //         onChange={(e) => {
                              // //           const val = e.target.value.replace(/[^0-9.]/g, ''); // ✅ Keep decimals
                              // //           const matched = organizationOptions.find(org => org.value === val) ||
                              // //                          updateOrganizationOptions.find(org => org.value === val);
                              // //           setEditedRowData(prev => ({
                              // //             ...prev,
                              // //             [actualEmpIdx]: {
                              // //               ...prev[actualEmpIdx],
                              // //               orgId: val,
                              // //               orgName: matched ? (matched.orgName || matched.label || '') : ''
                              // //             }
                              // //           }));
                              // //           setEditingRowIndex(actualEmpIdx);
                              // //           setHasUnsavedFieldChanges(true);
                              // //         }}
                              // //         style={{ maxWidth: "110px" }}
                              // //         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                              // //         list={`org-list-${actualEmpIdx}`}
                              // //       />
                              // //       <datalist id={`org-list-${actualEmpIdx}`}>
                              // //         {organizationOptions.map((org, i) => <option key={i} value={org.value} />)}
                              // //       </datalist>
                              // //     </td>
                              // //   );
                              // // }
                              // if (col.key === "orgId" && isBudPlan && isEditable) {
                              //   return (
                              //     <td key={`${uniqueRowKey}-orgId`} className={`tbody-td min-w-[125px]`}>
                              //       <input
                              //         type="text"
                              //         value={editedRowData[actualEmpIdx]?.orgId !== undefined
                              //           ? editedRowData[actualEmpIdx].orgId
                              //           : row.orgId}
                              //         onChange={(e) => {
                              //           const val = e.target.value;
                              //           // ✅ Find matching org INSTANTLY
                              //           const matched = organizationOptions.find(org => org.value.toString() === val);
                              //           setEditedRowData(prev => ({
                              //             ...prev,
                              //             [actualEmpIdx]: {
                              //               ...prev[actualEmpIdx],
                              //               orgId: val,
                              //               orgName: matched ? matched.orgName || matched.label.split(' - ')[1] || '' : ''
                              //             }
                              //           }));
                              //           setEditingRowIndex(actualEmpIdx);
                              //           setHasUnsavedFieldChanges(true);
                              //         }}
                              //         style={{ maxWidth: "110px" }}
                              //         className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                              //         list={`org-list-${actualEmpIdx}`}  // ✅ Datalist suggestions
                              //       />
                              //       <datalist id={`org-list-${actualEmpIdx}`}>
                              //         {organizationOptions.map((org, i) => (
                              //           <option key={i} value={org.value}>{org.label}</option>  // ✅ Full label in dropdown
                              //         ))}
                              //       </datalist>
                              //     </td>
                              //   );
                              // }

                              // if (col.key === "orgName") {
                              //   return (
                              //     <td key={`${uniqueRowKey}-orgName`} className="tbody-td min-w-[130px]">
                              //       {editedRowData[actualEmpIdx]?.orgName !== undefined
                              //         ? editedRowData[actualEmpIdx].orgName
                              //         : row.orgName || '-'
                              //       }
                              //     </td>
                              //   );
                              // }

                              //           }

                              if (col.key === "acctId") {
                                // Logic: Get list based on THIS row's employee type
                                const rowSuggestions =
                                  getAccountSuggestionsByType(emp.emple.type);

                                return (
                                  <td
                                    key={`${uniqueRowKey}-acctId`}
                                    className={`tbody-td ${tdWidth}`}
                                  >
                                    <input
                                      type="text"
                                      value={
                                        editedRowData[actualEmpIdx]?.acctId !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].acctId
                                          : row.acctId
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const matched = rowSuggestions.find(
                                          (acc) =>
                                            (acc.accountId || acc.id) === val,
                                        );

                                        setEditedRowData((prev) => ({
                                          ...prev,
                                          [actualEmpIdx]: {
                                            ...prev[actualEmpIdx],
                                            acctId: val,
                                            acctName: matched
                                              ? matched.acctName || matched.name
                                              : "",
                                          },
                                        }));
                                        setEditingRowIndex(actualEmpIdx);
                                        setHasUnsavedFieldChanges(true);
                                      }}
                                      disabled={!isBudPlan || !isEditable}
                                      // disabled={!isEditable}
                                      style={{ maxWidth: "110px" }}
                                      className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                      list={`account-list-existing-${actualEmpIdx}`}
                                    />
                                    <datalist
                                      id={`account-list-existing-${actualEmpIdx}`}
                                    >
                                      {rowSuggestions.map((acc, i) => (
                                        <option
                                          key={i}
                                          value={acc.accountId || acc.id}
                                        >
                                          {acc.acctName || acc.name}
                                        </option>
                                      ))}
                                    </datalist>
                                  </td>
                                );
                              }

                              // if (col.key === "acctName") {
                              //     return (
                              //         <td key={`${uniqueRowKey}-acctName`} className="tbody-td min-w-[130px]">
                              //             {editedRowData[actualEmpIdx]?.acctName !== undefined
                              //                 ? editedRowData[actualEmpIdx].acctName
                              //                 : row.acctName || '-'}
                              //         </td>
                              //     );
                              // }

                              // if (col.key === "acctName") {
                              //   const rowSuggestions =
                              //     getAccountSuggestionsByType(emp.emple.type);
                              //   const acctName = rowSuggestions.find(
                              //     (acc) =>
                              //       (acc.accountId || acc.id) === row.acctId,
                              //   )?.acctName;

                              //   return (
                              //     <td
                              //       key={`${uniqueRowKey}-acctName`}
                              //       className="tbody-td min-w-[130px]"
                              //       disabled={!isBudPlan || !isEditable}
                              //     >
                              //       {/* {acctName} */}
                              //       {editedRowData[actualEmpIdx]?.acctName !==
                              //       undefined
                              //         ? editedRowData[actualEmpIdx].acctName
                              //         : row.acctName || "-"}
                              //       {/* {editedRowData[actualEmpIdx]?.acctName  } */}
                              //     </td>
                              //   );
                              // }

                              if (col.key === "acctName") {
                                // 1. Check for unsaved edit data
                                const editedName =
                                  editedRowData[actualEmpIdx]?.acctName;

                                // 2. Check if the row object already has a valid name
                                const rowName = row.acctName;

                                // 3. Final Fallback: Manual lookup in the master list if the above are missing or "-"
                                const manualLookup =
                                  accountOptionsWithNames.find(
                                    (acc) =>
                                      (acc.accountId || acc.id) ===
                                      (emp.emple.accId || row.acctId),
                                  )?.acctName;

                                const displayName =
                                  editedName !== undefined
                                    ? editedName
                                    : rowName && rowName !== "-"
                                      ? rowName
                                      : manualLookup || "-";

                                return (
                                  <td
                                    key={`${uniqueRowKey}-acctName`}
                                    className="tbody-td min-w-[130px]"
                                  >
                                    {displayName}
                                  </td>
                                );
                              }

                              if (col.key === "orgId") {
                                return (
                                  <td
                                    key={`${uniqueRowKey}-orgId`}
                                    className={`tbody-td min-w-[125px]`}
                                  >
                                    <input
                                      type="text"
                                      value={
                                        editedRowData[actualEmpIdx]?.orgId !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].orgId
                                          : row.orgId
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const matched =
                                          organizationOptions.find(
                                            (org) =>
                                              org.value.toString() === val,
                                          );
                                        setEditedRowData((prev) => ({
                                          ...prev,
                                          [actualEmpIdx]: {
                                            ...prev[actualEmpIdx],
                                            orgId: val,
                                            orgName: matched
                                              ? matched.orgName ||
                                                matched.label.split(" - ")[1]
                                              : "",
                                          },
                                        }));
                                        setEditingRowIndex(actualEmpIdx);
                                        setHasUnsavedFieldChanges(true);
                                      }}
                                      disabled={!isBudPlan || !isEditable}
                                      style={{ maxWidth: "110px" }}
                                      className="border border-gray-300 rounded px-1 py-0.5 text-xs outline-none"
                                      // list={`org-list-existing-${actualEmpIdx}`}
                                      list={
                                        isEditable
                                          ? `org-list-existing-${actualEmpIdx}`
                                          : undefined
                                      }
                                      // disabled={!isEditable }
                                    />
                                    {/* <datalist
                                      id={`org-list-existing-${actualEmpIdx}`}
                                    >
                                      {organizationOptions.map((org, i) => (
                                        <option key={i} value={org.value}>
                                          {org.label}
                                        </option>
                                      ))}
                                    </datalist> */}
                                    {isEditable && (
                                      <datalist
                                        id={`org-list-existing-${actualEmpIdx}`}
                                      >
                                        {organizationOptions.map((org, i) => (
                                          <option key={i} value={org.value}>
                                            {org.label}
                                          </option>
                                        ))}
                                      </datalist>
                                    )}
                                  </td>
                                );
                              }

                              if (col.key === "orgName") {
                                return (
                                  <td
                                    key={`${uniqueRowKey}-orgName`}
                                    className="tbody-td min-w-[130px]"
                                    disabled={!isBudPlan || !isEditable}
                                  >
                                    {editedRowData[actualEmpIdx]?.orgName !==
                                    undefined
                                      ? editedRowData[actualEmpIdx].orgName
                                      : row.orgName || "-"}
                                  </td>
                                );
                              }

                              // 4. ADDED: Rev Checkbox Logic
                              if (col.key === "isRev") {
                                return (
                                  <td
                                    key={`${uniqueRowKey}-isRev`}
                                    className="tbody-td text-center"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        editedRowData[actualEmpIdx]?.isRev !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].isRev
                                          : emp.emple.isRev
                                      }
                                      onChange={(e) =>
                                        handleRowFieldChange(
                                          actualEmpIdx,
                                          "isRev",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-3 h-3 cursor-pointer"
                                    />
                                  </td>
                                );
                              }

                              // 5. ADDED: Brd Checkbox Logic
                              if (col.key === "isBrd") {
                                return (
                                  <td
                                    key={`${uniqueRowKey}-isBrd`}
                                    className="tbody-td text-center"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        editedRowData[actualEmpIdx]?.isBrd !==
                                        undefined
                                          ? editedRowData[actualEmpIdx].isBrd
                                          : emp.emple.isBrd
                                      }
                                      onChange={(e) =>
                                        handleRowFieldChange(
                                          actualEmpIdx,
                                          "isBrd",
                                          e.target.checked,
                                        )
                                      }
                                      className="w-3 h-3 cursor-pointer"
                                    />
                                  </td>
                                );
                              }
                              return (
                                <td
                                  key={`${uniqueRowKey}-${col.key}`}
                                  className={`tbody-td ${tdWidth} ${col.key === "name" ? "text-left" : ""}`}
                                  style={{
                                    textAlign: col.key === "name" ? "left" : "",
                                  }}
                                >
                                  {row[col.key]}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                  {/* <tfoot>
                  <tr
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      // borderTop: "2px solid #d1d5db",
                      backgroundColor: "#d7ebf3",
                    }}
                  >
                   
                    {EMPLOYEE_COLUMNS.map((_, idx) => (
                      <td key={idx}></td>
                    ))}

                    
                    <td
                       className="sticky right-0 z-30 text-right font-bold text-black"
                      style={{
                        backgroundColor: "#d7ebf3",
                        minWidth: "125px",
                        whiteSpace: "nowrap",
                        zIndex: 20,
                        fontSize: "12px",
                        // paddingRight: "1rem",
                        // boxShadow: "-2px 0 0 #d1d5db",
                      }}
                    >
                      
                      Subtotal Other Cost 
                    </td>
                  </tr>
                </tfoot> */}
                  {/* --- LEFT TABLE FOOTER --- */}
                  <tfoot className="sticky bottom-0 z-20">
                    <tr
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        backgroundColor: "#d7ebf3",
                        lineHeight: "normal",
                      }}
                    >
                      {/* One empty cell for the checkbox column */}
                      <td className="w-6"></td>

                      {/* Empty cells for all employee metadata columns except the last one */}
                      {EMPLOYEE_COLUMNS.slice(0, -1).map((_, idx) => (
                        <td key={`empty-left-${idx}`}></td>
                      ))}

                      {/* The label cell, fixed to the right of the first table section */}
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
                        Subtotal Other Cost
                      </td>
                    </tr>
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
                  // marginBottom: "-1px"
                }}
              >
                <table className="min-w-full text-xs text-center table">
                  <thead className="  thead h-[50px]">
                    <tr
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        lineHeight: "normal",
                      }}
                    >
                      {/* CTD and Prior Year headers - only show when fiscal year is NOT "All" */}
                      {normalizedFiscalYear !== "All" && (
                        <>
                          {/* <th className="th-thead-blue min-w-80px">
      <div className="flex flex-col items-center justify-center h-full">
        <span className="whitespace-nowrap th-thead-blue">CTD</span>
        <span className="text-xs text-gray-600 font-normal normal-case">
          {(() => {
            const startYear = parseInt(startDate.split('-')[0]);
            const selectedYear = parseInt(normalizedFiscalYear);
            return `${startYear}-${selectedYear - 2}`;
          })()}
        </span>
      </div>
    </th> */}
                          {/* {shouldShowCTD() && (
                          <th className="th-thead-blue min-w-100px">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead-blue font-bold">
                                CTD
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-600 font-normal normal-case">
                                {(() => {
                                  const startYear = parseInt(
                                    startDate.split("-")[0]
                                  );
                                  const selectedYear =
                                    parseInt(normalizedFiscalYear);
                                  return `${startYear}-${selectedYear - 2}`;
                                })()}
                              </span>
                            </div>
                          </th>
                        )} */}

                          {/* {shouldShowPriorYear() && (
                          <th className="th-thead-blue min-w-100px">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead-blue font-bold">
                                Prior Year
                              </span>
                              <span className="whitespace-nowrap text-xs text-gray-600 font-normal normal-case">
                                {parseInt(normalizedFiscalYear) - 1}
                              </span>
                            </div>
                          </th>
                        )} */}
                        </>
                      )}

                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                        const isColSelected = selectedColumnKeys.has(uniqueKey);
                        return (
                          <th
                            key={uniqueKey}
                            className={`th-thead-blue border-r border-gray-300 min-w-80px ${isColSelected ? " " : ""}`}
                            style={{
                              cursor: isEditable ? "pointer" : "default",
                            }}
                            onClick={() => handleColumnHeaderClick(uniqueKey)}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap th-thead-blue-nb">
                                {duration.month}
                              </span>
                              <span className="text-xs text-black ">Amt</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="tbody">
                    {/* Pasted Entries in Second Table */}

                    {newEntries.length > 0 &&
                      newEntries.map((entry, entryIndex) => (
                        <tr
                          key={`pasted-duration-${entryIndex}`}
                          className=""
                          style={{
                            height: `${ROW_HEIGHT_DEFAULT }px`,
                            lineHeight: "normal",
                          }}
                        >
                          {/* {shouldShowCTD() && (
                          <td className="tbody-td text-center text-xs bg-gray-100">
                            0.00
                          </td>
                        )}

                        {shouldShowPriorYear() && (
                          <td className="tbody-td text-center text-xs bg-gray-100">
                            0.00
                          </td>
                        )} */}
                          {sortedDurations.map((duration) => {
                            const uniqueKey = `${duration.monthNo}_${duration.year}`;
                            const isInputEditable =
                              isEditable &&
                              isMonthEditable(duration, closedPeriod, planType);
                            const value =
                              newEntryPeriodAmountsArray[entryIndex]?.[
                                uniqueKey
                              ] || "";

                            return (
                              <td
                                key={`pasted-${entryIndex}-${uniqueKey}`}
                                className={`tbody-td border-r  border-gray-300 min-w-[80px] ${
                                  planType === "EAC"
                                    ? isInputEditable
                                      ? "bg-green-50"
                                      : "bg-gray-100"
                                    : ""
                                }`}
                              >
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatWithCommas(value)}
                                  // value={value}
                                  // onChange={(e) => {
                                  //   if (isInputEditable) {
                                      
                                  //     updateNewEntryPeriodAmounts(entryIndex, {
                                  //       [uniqueKey]: e.target.value.replace(
                                  //         /[^0-9.]/g,
                                  //         "",
                                  //       ),
                                  //     });
                                  //   }
                                  // }}
                                  onChange={(e) => {
  if (isInputEditable) {
    // Allows digits, one decimal point, and an optional leading minus sign
    const cleanValue = e.target.value
      .replace(/[^0-9.-]/g, "")     // 1. Remove everything except 0-9, dot, and minus
      .replace(/(?!^)-/g, "")       // 2. Remove minus signs if they aren't at the start
      .replace(/(\..*?)\..*/g, "$1"); // 3. Prevent multiple decimal points

    updateNewEntryPeriodAmounts(entryIndex, {
      [uniqueKey]: cleanValue,
    });
  }
}}
                                  className={`border border-gray-300  text-center px-1 py-0.5 w-12  text-xs outline-none ${
                                    !isInputEditable
                                      ? "cursor-not-allowed text-gray-400"
                                      : "text-gray-700"
                                  }`}
                                  disabled={!isInputEditable}
                                  placeholder="0.00"
                                  // maxLength={8}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                    {sortedEmployees
                      .filter((_, idx) => !hiddenRows[idx])
                      .map((emp, idx) => {
                        const actualEmpIdx = employees.findIndex(
                          (e) => e === emp,
                        );
                        const monthAmounts = getMonthAmounts(emp);
                        const uniqueRowKey = `${
                          emp.emple.emplId || "emp"
                        }-${actualEmpIdx}`;
                        return (
                          <tr
                            key={uniqueRowKey}
                            className={`whitespace-nowrap hover:bg-blue-50 transition border-b border-gray-200 ${
                              selectedRows.has(actualEmpIdx)
                                ? "bg-blue-100" // Selected row background
                                : selectedRowIndex === actualEmpIdx
                                  ? " "
                                  : "even:bg-gray-50"
                            }`}
                            style={{
                              height: `${ROW_HEIGHT_DEFAULT }px`,
                              lineHeight: "normal",
                              cursor: isEditable ? "pointer" : "default",
                            }}
                            // onClick={() => handleRowClick(actualEmpIdx)}
                          >
                            {/* CTD and Prior Year cells */}
                            {normalizedFiscalYear !== "All" && (
                              <>
                                
                              </>
                            )}
                            {sortedDurations.map((duration) => {
                              const uniqueKey = `${duration.monthNo}_${duration.year}`;
                              const forecast = monthAmounts[uniqueKey];
                              const value =
                                inputValues[`${actualEmpIdx}_${uniqueKey}`] ??
                                (forecast?.value !== undefined
                                  ? forecast.value
                                  : "0");
                              const isFound = findMatches.some(
    (m) => m.empIdx === actualEmpIdx && m.uniqueKey === uniqueKey
  );
                              const isInputEditable =
                                isEditable &&
                                isMonthEditable(
                                  duration,
                                  closedPeriod,
                                  planType,
                                );
                              return (
                                <td
                                  key={`${uniqueRowKey}-${uniqueKey}`}
                                  className={`tbody-td border-r border-gray-300 min-w-[80px] ${
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
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatWithCommas(value)}
                                    // className={`border border-gray-300 text-center px-1 py-0.5 w-12  text-xs outline-none ${
                                    //   !isInputEditable
                                    //     ? "cursor-not-allowed text-gray-400"
                                    //     : "text-gray-700"
                                    // } ${
                                    //   findMatches.some(
                                    //     (match) =>
                                    //       match.empIdx === actualEmpIdx &&
                                    //       match.uniqueKey === uniqueKey,
                                    //   )
                                    //     ? "  border-2"
                                    //     : ""
                                    // }`}
                                    
                                    
                                    className={`border border-gray-300 text-center px-1 py-0.5 w-12 text-xs outline-none ${
          isFound 
            ? "bg-yellow-200 font-bold border-2 border-yellow-500 shadow-sm text-gray-900" 
            : !isInputEditable 
              ? "cursor-not-allowed text-gray-400 " 
              : "text-gray-700 "
        }`}
                                    onChange={(e) =>
                                      handleInputChange(
                                        actualEmpIdx,
                                        uniqueKey,
                                        // e.target.value.replace(/[^0-9.]/g, ""),
                                        e.target.value,
                                      )
                                    }
                                    
                                    // onBlur={(e) =>
                                    //   handleForecastAmountBlur(
                                    //     actualEmpIdx,
                                    //     uniqueKey,
                                    //     e.target.value
                                    //   )
                                    // }
                                    disabled={!isInputEditable}
                                    placeholder="Enter Amount"
                                    // maxLength={8}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>

                  {/* <tfoot>
                  <tr
                    className="font-bold text-center"
                    style={{
                      position: "sticky",
                      bottom: 0,
                      zIndex: 20,
                      height: `${ROW_HEIGHT_DEFAULT}px`,
                      lineHeight: "normal",
                      // borderTop: "2px solid #d1d5db",
                      backgroundColor: "#d7ebf3", // same light blue
                      color: "#000000",
                    }}
                  >
                    {normalizedFiscalYear !== "All" && (
                      <>
                       
                      </>
                    )}

                   
                    {sortedDurations.map((duration) => {
      const laborCost = getLaborCostForPeriod(duration.year, duration.monthNo);
      return (
        <td
          key={`total-cost-${duration.monthNo}_${duration.year}`}
          className="px-2 py-1 text-xs text-black border-r border-gray-300  text-center sticky bottom-0 font-bold"
        >
          {laborCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
      );
    })}
                  </tr>
                </tfoot> */}
                  {/* --- RIGHT TABLE FOOTER --- */}
                  <tfoot className="sticky bottom-0 z-20">
                    <tr
                      className="font-bold text-center"
                      style={{
                        height: `${ROW_HEIGHT_DEFAULT}px`,
                        backgroundColor: "#d7ebf3",
                        color: "#000000",
                        lineHeight: "normal",
                      }}
                    >
                      {sortedDurations.map((duration) => {
                        const uniqueKey = `${duration.monthNo}_${duration.year}`;
                        // Use the calculated total for this specific month from your columnTotals useMemo
                        const total = columnTotals[uniqueKey] || 0;
                        const monthData = monthlyForecastData.find(
                          (item) =>
                            item.year === duration.year &&
                            item.month === duration.monthNo,
                        );
 
                        const laborCost = monthData
                          ? monthData.nonLaborCost || 0
                          : 0;

                        return (
                          <td
                            key={`total-amt-${uniqueKey}`}
                            className="tbody-td border-r border-gray-300 text-center font-bold px-2"
                            style={{ minWidth: "80px" }}
                          >
                            <span className="text-black text-xs">
                              {laborCost.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
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
                setAmountPage((prev) => Math.max(1, prev-1))
              }}
            >
              {`<<`}
            </button>
            <div>Page ({amountPage})</div>
            <button
              onClick={() => {
                setAmountPage((prev) => Math.min(totalPages, prev + 1));
              }}
            >
              {`>>`}
            </button>
          </div> */}

            <div className="w-full bg-[#e5f3fb] text-white flex items-center justify-center">
              {/* Only show Left Arrow if there's more than 1 page */}
               
               <div className="flex items-center justify-end gap-2 px-4 py-2  border-gray-100 w-fit ml-auto mb-1 text-sm text-gray-900">
 
  {/* Left Arrow */}
  <button
    onClick={() => handlePageClick(amountPage - 1)}
    className="text-[#17414d] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
    disabled={amountPage === 1}
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
 
        if (amountPage > 3) {
          pages.push("...");
        }
 
        // Show pages around the current page
        let start = Math.max(2, amountPage - 1);
        let end = Math.min(totalPages - 1, amountPage + 1);
 
        // Keep a consistent number of buttons when at the edges
        if (amountPage <= 2) end = 4;
        if (amountPage >= totalPages - 1) start = totalPages - 3;
 
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
 
        if (amountPage < totalPages - 2) {
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
            amountPage === page
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
    onClick={() => handlePageClick(amountPage + 1)}
    className="text-[#17414d] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
    disabled={amountPage === totalPages}
  >
    <ChevronRight size={18} />
  </button>
 
  {/* Page Size Select */}
  <div className="relative flex items-center rounded px-2 bg-white transition-colors">
    <select
      value={pageSize}
      onChange={(e) => {
        setPageSize(Number(e.target.value));
        setAmountPage(1);
      }}
      className="appearance-none bg-transparent py-1 pr-4 pl-1 
               focus:outline-none cursor-pointer text-black"
    >
      <option className="text-black bg-white" value={15}>15 / page</option>
      <option className="text-black bg-white" value={25}>25 / page</option>
      <option className="text-black bg-white" value={35}>35 / page</option>
    </select>
    <ChevronDown size={14} className="absolute right-2 text-gray-400 pointer-events-none" />
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
      className="w-12 border border-gray-200 rounded py-1 text-center bg-white outline-none transition-all "
    />
    <span className="text-black font-semibold">Page</span>
  </div>
</div>

            </div>
          </div>
        )}
        {showFindReplace && (
          <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/20">
            <div  style={{ 
        transform: `translate(${findReplacePos.x}px, ${findReplacePos.y}px)`,
        transition: 'none'
      }}
      onMouseDown={(e) => handleDrag(e, setFindReplacePos, findReplacePos)} className="mt-20 w-full max-w-md bg-white rounded-lg shadow-xl border">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm">
                {/* <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-sm"> */}
                <h3 className="text-lg font-semibold mb-4">
                  {showFindOnly ? "Find Hours" : "Find and Replace Amounts"}
                </h3>

                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindOnly(false);
                      setFindMatches([]);
                    }}
                    className={`btn-click ${
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
                    className={`btn-click ${
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
                    // onChange={(e) => setFindValue(e.target.value)}
                    onChange={(e) => {
    // Allows digits, one dot, and a leading minus
    const val = e.target.value
      .replace(/[^0-9.-]/g, "")
      .replace(/(?!^)-/g, "")
      .replace(/(\..*?)\..*/g, "$1");
    setFindValue(val);
  }}
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
                      // onChange={(e) =>
                      //   // setReplaceValue(e.target.value.replace(/[^0-9.]/g, ""))
                      //   setReplaceValue(e.target.value)
                      // }
                      onChange={(e) => {
    // ✅ This allows negative numbers like -50.00
    const val = e.target.value
      .replace(/[^0-9.-]/g, "")           // 1. Remove non-numeric (except dot/minus)
      .replace(/(?!^)-/g, "")             // 2. Remove minus if NOT at start
      .replace(/(\..*?)\..*/g, "$1");     // 3. Keep only one decimal point
    
    setReplaceValue(val);
  }}
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
                        // value="row"
                        value="checked-rows"
                        // checked={replaceScope === "row"}
                        checked={replaceScope === "checked-rows"}
                        onChange={(e) => setReplaceScope(e.target.value)}
                        disabled={selectedRows === null}
                      />
                      <span className="ml-2">
                        Selected Row
                        {/* (
                    {selectedRowIndex !== null
                      ? employees[selectedRowIndex]?.emple.emplId
                      : "NA"}
                    ) */}
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
                      <span className="ml-2">Selected Column</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFindReplace(false);
                      setFindReplacePos({ x: 0, y: 0 });
                      setSelectedRowIndex(null);
                      setSelectedColumnKey(null);
                      setReplaceScope("all");
                      setFindMatches([]);
                      setShowFindOnly(false);
                    }}
                    // className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-xs"
                    className="px-2 py-2 mt-1 mb-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  {showFindOnly ? (
                    <button
                      type="button"
                      onClick={handleFind}
                      // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                      className={`btn-click`}
                    >
                      Find & Highlight
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFindReplace}
                      // className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                      className={`btn-click`}
                    >
                      Replace All
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default ProjectAmountsTable;
