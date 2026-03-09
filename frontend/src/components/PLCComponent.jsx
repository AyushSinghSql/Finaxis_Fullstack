import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa"; // Importing icons
import { v4 as uuidv4 } from "uuid"; // For unique IDs
import { backendUrl } from "./config";
import { Link } from "react-router-dom";

// Project-level PLC rates
export const PLC_PROJECT_COLUMNS = [
  { key: "plc", label: "PLC" },
  { key: "billRate", label: "Bill Rate" },
  { key: "rateType", label: "Rate Type" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
];

// Employee PLC rates
export const PLC_EMPLOYEE_COLUMNS = [
  { key: "lookupType", label: "Lookup Type" },
  { key: "empId", label: "Employee ID" },
  { key: "employeeName", label: "Employee Name" },
  { key: "plc", label: "PLC" },
  { key: "plcDescription", label: "PLC Description" },
  { key: "billRate", label: "Bill Rate" },
  { key: "rateType", label: "Rate Type" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
];

// Vendor PLC rates
export const PLC_VENDOR_COLUMNS = [
  { key: "lookupType", label: "Lookup Type" },
  { key: "vendorId", label: "Vendor ID" },
  { key: "vendorName", label: "Vendor Name" },
  { key: "vendorEmployee", label: "Vendor Employee ID" },
  { key: "vendorEmployeeName", label: "Vendor Employee Name" },
  { key: "plc", label: "PLC" },
  { key: "plcDescription", label: "PLC Description" },
  { key: "billRate", label: "Bill Rate" },
  { key: "rateType", label: "Rate Type" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
];

const PLCComponent = forwardRef(
  ({ selectedProjectId, selectedPlan, showPLC }, ref) => {
    const containerRef = useRef(null);
    const [billingRatesSchedule, setBillingRatesSchedule] = useState([]);
    const [newRate, setNewRate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editBillRate, setEditBillRate] = useState({});
    const [employees, setEmployees] = useState([]);
    const [employeeBillingRates, setEmployeeBillingRates] = useState([]);
    const [newEmployeeRate, setNewEmployeeRate] = useState(null);
    const [editEmployeeBillRate, setEditEmployeeBillRate] = useState({});
    const [editEmployeeFields, setEditEmployeeFields] = useState({});
    const [editingEmployeeRowId, setEditingEmployeeRowId] = useState(null);
    const [vendorBillingRates, setVendorBillingRates] = useState([]);
    const [newVendorRate, setNewVendorRate] = useState(null);
    const [editVendorBillRate, setEditVendorBillRate] = useState({});
    const [editVendorFields, setEditVendorFields] = useState({});
    const [editingVendorRowId, setEditingVendorRowId] = useState(null);
    const [plcs, setPlcs] = useState([]);
    const [plcSearch, setPlcSearch] = useState("");
    const [vendorEmployees, setVendorEmployees] = useState([]);
    const [editingProjectPlcRowId, setEditingProjectPlcRowId] = useState(null);
    const [editProjectPlcFields, setEditProjectPlcFields] = useState({});
    const [loadingAction, setLoadingAction] = useState({});
    const [hasFetchedPLC, setHasFetchedPLC] = useState(false);
    const [loadingPLC, setLoadingPLC] = useState(false);
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [loadingVendor, setLoadingVendor] = useState(false);

    const lookupTypeOptions = ["Select", "Employee", "Contract Employee"];
    const rateTypeOptions = ["Select", "Billing", "Actual"];
    const vendorLookupTypeOptions = ["Select", "Vendor", "Employee"];

    const [isEditing, setIsEditing] = React.useState(false);
    const [editedBillRates, setEditedBillRates] = React.useState({});
    const [selectedRows, setSelectedRows] = useState({});

    const [isEmployeeEditing, setIsEmployeeEditing] = React.useState(false);
    const [selectedEmployeeRows, setSelectedEmployeeRows] = useState({});
    const [isVendorEditing, setIsVendorEditing] = React.useState(false);
    const [selectedVendorRows, setSelectedVendorRows] = useState({});

    const dropdownStyles = {
      //  Remove borders from datalist suggestions
      noBorderDropdown: {
        border: "none",
        outline: "none",
        boxShadow: "none",
        background: "transparent",
      },
    };

    const formatWithCommas = (val) => {
      if (val === null || val === undefined || val === "") return "";
      const parts = val.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    };

    const isEditable = selectedPlan.status === "In Progress";

    const formatToMMDDYY = (isoString) => {
      if (!isoString) return "";

      const date = new Date(isoString);

      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2);

      return `${month}/${day}/${year}`;
    };

    useEffect(() => {
      setHasFetchedPLC(false);
    }, [selectedProjectId]);

    // Check if there are any unsaved changes across all sections
    const hasUnsavedPLCChanges = () => {
      return (
        // Check for new rows being drafted
        !!newRate ||
        !!newEmployeeRate ||
        !!newVendorRate ||
        // Check if bulk edit modes are active with actual data in the edit objects
        (isEditing && Object.keys(editedBillRates).length > 0) ||
        (isEmployeeEditing && Object.keys(editEmployeeBillRate).length > 0) ||
        (isVendorEditing && Object.keys(editVendorBillRate).length > 0)
      );
    };

    // Handle internal navigation / route changes
    useEffect(() => {
      const handleInternalNavigation = () => {
        if (hasUnsavedPLCChanges()) {
          return window.confirm(
            "You have unsaved changes in the PLC tables. Are you sure you want to leave?",
          );
        }
        return true;
      };

      // This logic depends on how your parent handles the "Back" button or tab switching.
      // By exposing hasUnsavedChanges via ref, the parent's confirmDiscardChanges()
      // already handles the main internal tab/back navigation.
    }, [
      newRate,
      newEmployeeRate,
      newVendorRate,
      isEditing,
      isEmployeeEditing,
      isVendorEditing,
    ]);

    // Expose the unsaved changes check to the parent component
    useImperativeHandle(ref, () => ({
      hasUnsavedChanges: () => {
        return (
          // Check for new rows being drafted
          !!newRate ||
          !!newEmployeeRate ||
          !!newVendorRate ||
          // Check if bulk edit modes are active with data in the edit objects
          (isEditing && Object.keys(editedBillRates).length > 0) ||
          (isEmployeeEditing && Object.keys(editEmployeeBillRate).length > 0) ||
          (isVendorEditing && Object.keys(editVendorBillRate).length > 0)
        );
      },
    }));

    // useEffect(() => {
    //   const handleBeforeUnload = (e) => {
    //     if (hasUnsavedPLCChanges()) {
    //       const message =
    //         "You have unsaved changes in the PLC tables. Are you sure you want to leave?";
    //       e.returnValue = message; // Standard for most browsers
    //       return message; // For some older browsers
    //     }
    //   };

    //   // This handles browser tab close/refresh
    //   window.addEventListener("beforeunload", handleBeforeUnload);

    //   // cleanup
    //   return () => {
    //     window.removeEventListener("beforeunload", handleBeforeUnload);
    //   };
    // }, [
    //   newRate,
    //   newEmployeeRate,
    //   newVendorRate,
    //   isEditing,
    //   editedBillRates,
    //   isEmployeeEditing,
    //   editEmployeeBillRate,
    //   isVendorEditing,
    //   editVendorBillRate,
    // ]);

    // const formatDate = (dateString) => {
    //   if (!dateString) return "";
    //   return dateString.split("T")[0];
    // };

    // const formatDate = (dateString) => {
    //   if (!dateString) return "";

    //   // Extract YYYY-MM-DD from ISO string
    //   const datePart = dateString.split("T")[0]; // "2025-12-01"

    //   // Parse to Date object
    //   const date = new Date(datePart);

    //   // Format as MM/DD/YYYY (full year)
    //   const month = String(date.getMonth() + 1).padStart(2, "0");
    //   const day = String(date.getDate()).padStart(2, "0");
    //   const year = date.getFullYear(); // Full 2025, not .slice(-2)

    //   return `${month}/${day}/${year}`; // "12/01/2025"
    // };

    // Handles both Browser-level (Refresh/Close) and Internal Navigation (Link/Tab clicks)
    useEffect(() => {
      // 1. Handles Browser Refresh / Tab Close
      const handleBeforeUnload = (e) => {
        if (hasUnsavedPLCChanges()) {
          e.preventDefault();
          e.returnValue = "Unsaved changes will be lost.";
          return e.returnValue;
        }
      };

      // 2. Handles Internal Navigation (Link clicks / Tab switching)
      const handleInternalClick = (e) => {
        if (hasUnsavedPLCChanges()) {
          if (containerRef.current && containerRef.current.contains(e.target)) {
            return;
          }
          // Find if the clicked element is a link or a button
          const target = e.target.closest("a") || e.target.closest("button");

          if (target) {
            // EXCEPTION: If the button clicked is a Save button, do not show the alert
            if (target.innerText.includes("Save")) {
              return;
            }

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
      // Use capture phase (true) to catch the event before other logic fires
      document.addEventListener("click", handleInternalClick, true);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("click", handleInternalClick, true);
      };
    }, [
      newRate,
      newEmployeeRate,
      newVendorRate,
      isEditing,
      editedBillRates,
      isEmployeeEditing,
      editEmployeeBillRate,
      isVendorEditing,
      editVendorBillRate,
    ]);

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";

      // Remove 'T' and everything after it
      const cleanDate = dateString.split("T")[0]; // "2023-03-01T00:00:00" → "2023-03-01"

      // Split YYYY-MM-DD → [2023, 03, 01]
      const [year, month, day] = cleanDate.split("-");

      // Return MM/DD/YYYY
      return `${month}/${day}/${year}`;
    };

    // Move the function OUTSIDE useEffect and add useCallback
    const fetchBillingRates = useCallback(async () => {
      if (!selectedProjectId) {
        // ✅ Clear states when no project selected
        setBillingRatesSchedule([]);
        setEditBillRate({});
        setEditProjectPlcFields({});
        return;
      }

      //   setLoading(true);
      setLoadingPLC(true);
      try {
        const response = await axios.get(`${backendUrl}/api/ProjectPlcRates`);
        const filteredData = response.data.filter((item) =>
          item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase()),
        );

        // Check for duplicate IDs
        // const seenKeys = new Set();
        // const uniqueData = filteredData.map((item, index) => {
        //   const id =
        //     item.id ||
        //     `${item.projId}-${item.laborCategoryCode}-${item.effectiveDate}-${index}`;
        //   if (seenKeys.has(id)) {
        //     console.warn(
        //       `Duplicate key detected in billingRatesSchedule: ${id}. Using composite key.`
        //     );
        //     return { ...item, id: `${id}-${index}` };
        //   }
        //   seenKeys.add(id);
        //   return { ...item, id };
        // });

        //   // ✅ ALWAYS generate unique IDs, store original for API calls
        // const uniqueData = filteredData.map((item, index) => {
        //   // const uniqueId = `plc-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
        //   const uniqueId = `plc-${Date.now()}-${Math.random()}-${index}-${uuidv4()}`;
        //   return {
        //     ...item,
        //     id: uniqueId,
        //     originalId: item.id // Store original for API calls
        //   };
        // });

        //     const uniqueData = filteredData.map((item, index) => {
        //   const uniqueId = `plc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}-${uuidv4()}`;
        //   return {
        //     ...item,
        //     id: uniqueId,
        //     originalId: item.id // Store original for API calls
        //   };
        // });

        const uniqueData = filteredData.map((item, index) => {
          const uniqueId = `plc-${uuidv4()}-${index}`;
          return {
            ...item,
            id: uniqueId,
            originalId: item.id,
          };
        });

        setBillingRatesSchedule(
          uniqueData.map((item) => ({
            id: item.id,
            originalId: item.originalId,
            plc: item.laborCategoryCode,
            billRate: item.billingRate,
            // rateType: item.rateType || "Select",
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.effectiveDate),
            endDate: formatDate(item.endDate),
          })),
        );

        const newEditBillRate = {};
        const newEditProjectPlcFields = {};
        uniqueData.forEach((item) => {
          newEditBillRate[item.id] = item.billingRate;
          newEditProjectPlcFields[item.id] = {
            // rateType: item.rateType,
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.effectiveDate),
            endDate: formatDate(item.endDate),
          };
        });
        setEditBillRate(newEditBillRate);
        setEditProjectPlcFields(newEditProjectPlcFields);
      } catch (error) {
        // console.error("Error fetching billing rates:", error);
        toast.error(
          `Failed to fetch billing rates: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        // setLoading(false);
        setLoadingPLC(false);
      }
    }, [selectedProjectId]); // ✅ Memoized with dependency

    // Move the function OUTSIDE useEffect and add useCallback
    const fetchEmployees = useCallback(async () => {
      if (
        !selectedProjectId ||
        typeof selectedProjectId !== "string" ||
        selectedProjectId.trim() === ""
      ) {
        // ✅ Clear employees when no valid project selected
        setEmployees([]);
        return;
      }

      //   setLoading(true);
      setLoadingEmployee(true);
      try {
        const response = await axios.get(
          `${backendUrl}/Project/GetEmployeesByProject/${selectedProjectId}?type=hours`,
        );
        setEmployees(
          response.data.map((item) => ({
            empId: item.empId,
            employeeName: item.employeeName,
          })),
        );
      } catch (error) {
        // console.error("Error fetching employees:", error);
        setEmployees([]);
      } finally {
        // setLoading(false);
        setLoadingEmployee(false);
      }
    }, [selectedProjectId]); // Memoized with dependency

    // Simple useEffect that calls the memoized function
    useEffect(() => {
      fetchEmployees();
    }, [fetchEmployees]); // Only runs when selectedProjectId changes

    // Fetch PLCs for search
    // useEffect(() => {
    //   const fetchPlcs = async () => {
    //     if (!plcSearch) {
    //       setPlcs([]);
    //       return;
    //     }
    //     try {
    //       const response = await axios.get(
    //         `${backendUrl}/Project/GetAllPlcs/${plcSearch}`
    //       );
    //       const filteredPlcs = response.data
    //         .filter((item) =>
    //           item.laborCategoryCode
    //             .toLowerCase()
    //             .includes(plcSearch.toLowerCase())
    //         )
    //         .map((item) => ({
    //           laborCategoryCode: item.laborCategoryCode,
    //           description: item.description || "",
    //         }));
    //       setPlcs(filteredPlcs);
    //     } catch (error) {
    //       console.error("Error fetching PLCs:", error);
    //       setPlcs([]);
    //     }
    //   };
    //   fetchPlcs();
    // }, [plcSearch]);

    const fetchPlcs = useCallback(async () => {
      // if (!plcSearch) {
      //   setPlcs([]);
      //   return;
      // }

      try {
        const response = await axios.get(`${backendUrl}/Project/GetAllPlcs/`);
        const filteredPlcs = response.data
          .filter((item) =>
            item.laborCategoryCode
              .toLowerCase()
              .includes(plcSearch.toLowerCase()),
          )
          .map((item) => ({
            laborCategoryCode: item.laborCategoryCode,
            description: item.description || "",
          }));
        setPlcs(filteredPlcs);
      } catch (error) {
        // console.error("Error fetching PLCs:", error);
        setPlcs([]);
      }
    }, []);

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        fetchPlcs();
      }, 100); //  debounce to prevent excessive API calls while typing

      return () => clearTimeout(timeoutId);
    }, [fetchPlcs]);

    const fetchEmployeeBillingRates = useCallback(async () => {
      if (!selectedProjectId) {
        setEmployeeBillingRates([]);
        setEditEmployeeBillRate({});
        setEditEmployeeFields({});
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/ProjEmplRt`);
        const filteredData = response.data.filter(
          (item) =>
            item.projId
              .toLowerCase()
              .startsWith(selectedProjectId.toLowerCase()) && item.emplId,
        );

        // // Check for duplicate IDs
        // const seenKeys = new Set();
        // const uniqueData = filteredData.map((item, index) => {
        //   const id =
        //     item.projEmplRtKey ||
        //     item.id ||
        //     `${item.projId}-${item.emplId}-${item.startDt}-${index}`;
        //   if (seenKeys.has(id)) {
        //     console.warn(
        //       `Duplicate key detected in employeeBillingRates: ${id}. Using composite key.`
        //     );
        //     return { ...item, id: `${id}-${index}` };
        //   }
        //   seenKeys.add(id);
        //   return { ...item, id };
        // });

        // ✅ Always generate unique IDs
        // const uniqueData = filteredData.map((item, index) => {
        //   // const uniqueId = `emp-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
        //   const uniqueId = `emp-${Date.now()}-${Math.random()}-${index}-${uuidv4()}`;
        //   return {
        //     ...item,
        //     id: uniqueId,
        //     originalId: item.projEmplRtKey || item.id // Keep original for API calls
        //   };
        // });

        //     const uniqueData = filteredData.map((item, index) => {
        //   const uniqueId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}-${uuidv4()}`;
        //   return {
        //     ...item,
        //     id: uniqueId,
        //     originalId: item.projEmplRtKey || item.id
        //   };
        // });

        const uniqueData = filteredData.map((item, index) => {
          const uniqueId = `emp-${uuidv4()}-${index}`;
          return {
            ...item,
            id: uniqueId,
            originalId: item.projEmplRtKey || item.id,
          };
        });

        setEmployeeBillingRates(
          uniqueData.map((item) => ({
            id: item.id,
            originalId: item.originalId,
            lookupType: item.type || "Select",
            empId: item.emplId,
            employeeName:
              item.emplName ||
              employees.find((emp) => emp.empId === item.emplId)
                ?.employeeName ||
              "",
            plc: item.billLabCatCd,
            plcDescription: item.plcDescription || "",
            billRate: item.billRtAmt,
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.startDt),
            endDate: formatDate(item.endDt),
          })),
        );

        const newEditEmployeeBillRate = {};
        const newEditEmployeeFields = {};
        uniqueData.forEach((item) => {
          const id = item.id;
          if (id) {
            newEditEmployeeBillRate[id] = item.billRtAmt;
            newEditEmployeeFields[id] = {
              lookupType: item.type || "Select",
              rateType: item.sBillRtTypeCd || "Select",
              startDate: formatDate(item.startDt),
              endDate: formatDate(item.endDt),
              empId: item.emplId,
              employeeName: item.employeeName,
              plc: item.billLabCatCd,
              plcDescription: item.plcDescription,
            };
          }
        });
        setEditEmployeeBillRate(newEditEmployeeBillRate);
        setEditEmployeeFields(newEditEmployeeFields);
      } catch (error) {
        // console.error("Error fetching employee billing rates:", error);
        toast.error(
          `Failed to fetch employee billing rates: ${
            error.response?.data?.message || error.message
          }`,
        );
        setEmployeeBillingRates([]);
      } finally {
        setLoading(false);
      }
    }, [selectedProjectId, employees]);

    const fetchVendorBillingRates = useCallback(async () => {
      if (!selectedProjectId) {
        setVendorBillingRates([]);
        setEditVendorBillRate({});
        setEditVendorFields({});
        return;
      }

      //   setLoading(true);
      setLoadingVendor(true);
      try {
        const response = await axios.get(`${backendUrl}/ProjVendRt`);
        const filteredData = response.data.filter((item) =>
          item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase()),
        );

        // // Check for duplicate IDs
        // const seenKeys = new Set();
        // const uniqueData = filteredData.map((item, index) => {
        //   const id =
        //     item.projVendRtKey ||
        //     item.id ||
        //     `${item.projId}-${item.vendId}-${item.startDt}-${index}`;
        //   if (seenKeys.has(id)) {
        //     console.warn(
        //       `Duplicate key detected in vendorBillingRates: ${id}. Using composite key.`
        //     );
        //     return { ...item, id: `${id}-${index}` };
        //   }
        //   seenKeys.add(id);
        //   return { ...item, id };
        // });

        //   // ✅ Generate truly unique IDs
        // const uniqueData = filteredData.map((item, index) => {
        //   const uniqueId = item.projVendRtKey || item.id || `vendor-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
        //   return { ...item, id: uniqueId };
        // });

        // ✅ ALWAYS generate unique IDs
        // const uniqueData = filteredData.map((item, index) => {
        //   // const uniqueId = `vendor-${Date.now()}-${index}-${uuidv4().substring(0, 8)}`;
        //   const uniqueId = `vendor-${Date.now()}-${Math.random()}-${index}-${uuidv4()}`;
        //   return {
        //     ...item,
        //     id: uniqueId,
        //     originalId: item.projVendRtKey || item.id // Store original for API calls
        //   };
        // });

        //     const uniqueData = filteredData.map((item, index) => {
        //   const uniqueId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}-${uuidv4()}`;
        //   return {
        //     ...item,
        //     id: uniqueId,
        //     originalId: item.projVendRtKey || item.id
        //   };
        // });

        const uniqueData = filteredData.map((item, index) => {
          const uniqueId = `vendor-${uuidv4()}-${index}`;
          return {
            ...item,
            id: uniqueId,
            originalId: item.projVendRtKey || item.id,
          };
        });

        setVendorBillingRates(
          uniqueData.map((item) => ({
            id: item.id,
            originalId: item.originalId,
            projVendRtKey: item.projVendRtKey,
            lookupType: item.type || "Select",
            vendorId: item.vendId || "",
            vendorName: item.vendorName || item.vendEmplName || "",
            vendorEmployee: item.vendEmplId || "",
            vendorEmployeeName: item.vendEmplName || "",
            plc: item.billLabCatCd,
            plcDescription: item.plcDescription || item.description || "",
            billRate: item.billRtAmt,
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.startDt),
            endDate: formatDate(item.endDt),
          })),
        );

        const newEditVendorBillRate = {};
        const newEditVendorFields = {};
        uniqueData.forEach((item) => {
          const id = item.id;
          newEditVendorBillRate[id] = item.billRtAmt;
          newEditVendorFields[id] = {
            lookupType: item.type || "Select",
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.startDt),
            endDate: formatDate(item.endDt),
            vendorId: item.vendId || "",
            vendorName: item.vendorName || item.vendEmplName || "",
            vendorEmployee: item.vendEmplId || "",
            vendorEmployeeName: item.vendEmplName || "",
            plc: item.billLabCatCd,
            plcDescription: item.plcDescription,
          };
        });
        setEditVendorBillRate(newEditVendorBillRate);
        setEditVendorFields(newEditVendorFields);
      } catch (error) {
        // console.error("Error fetching vendor billing rates:", error);
        toast.error(
          `Failed to fetch vendor billing rates: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        // setLoading(false);
        setLoadingVendor(false);
      }
    }, [selectedProjectId]);

    // const handleUpdate = async (id) => {
    //   setLoadingAction((prev) => ({ ...prev, [id]: true })); // ✅ Fixed

    //   const currentItem = billingRatesSchedule.find((item) => item.id === id);
    //   const originalId = currentItem?.originalId || id; // ✅ Use original ID for API

    //   const updatedData = {
    //     plc: currentItem?.plc,
    //     billRate: editBillRate[id],
    //     rateType: editProjectPlcFields[id]?.rateType,
    //     startDate: editProjectPlcFields[id]?.startDate,
    //     endDate: editProjectPlcFields[id]?.endDate,
    //   };

    //   if (
    //     updatedData.startDate &&
    //     updatedData.endDate &&
    //     new Date(updatedData.startDate) > new Date(updatedData.endDate)
    //   ) {
    //     toast.error("End Date cannot be before Start Date.");
    //     setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
    //     return;
    //   }

    //   try {
    //     await axios.put(
    //       `${backendUrl}/api/ProjectPlcRates/bulk-billingrate`, // ✅ Use original ID
    //       {
    //         id: originalId, // ✅ Use original ID
    //         projId: selectedProjectId,
    //         laborCategoryCode: updatedData.plc,
    //         costRate: parseFloat(updatedData.billRate) * 0.65,
    //         billingRate: parseFloat(updatedData.billRate),
    //         effectiveDate: updatedData.startDate,
    //         endDate: updatedData.endDate || null,
    //         sBillRtTypeCd: updatedData.rateType,
    //         isActive: true,
    //         modifiedBy: "admin",
    //         createdAt: new Date().toISOString(),
    //         updatedAt: new Date().toISOString(),
    //       }
    //     );

    //     setBillingRatesSchedule((prev) =>
    //       prev.map((rate) =>
    //         rate.id === id
    //           ? {
    //               ...rate,
    //               billRate: parseFloat(updatedData.billRate),
    //               rateType: updatedData.rateType,
    //               startDate: updatedData.startDate,
    //               endDate: updatedData.endDate || null,
    //             }
    //           : rate
    //       )
    //     );
    //     setEditingProjectPlcRowId(null);
    //     toast.success("Billing rate updated successfully!");
    //   } catch (error) {
    //     // console.error("Error updating billing rate:", error);
    //     toast.error(
    //       `Failed to update billing rate: ${
    //         error.response?.data?.message || error.message
    //       }`
    //     );
    //   } finally {
    //     setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
    //   }
    // };

    const handleUpdateAllChanges = async () => {
      setLoading(true);

      try {
        // Prepare array of updated items based on editedBillRates keys
        const itemsToUpdate = Object.keys(editedBillRates)
          .map((idKey) => {
            const numericId = isNaN(Number(idKey)) ? idKey : Number(idKey);
            const currentItem = billingRatesSchedule.find(
              (item) => item.id === numericId,
            );
            if (!currentItem) return null;

            // Parse the new bill rate string safely into a number
            const newBillRateStr = String(editedBillRates[idKey] ?? "");
            const newBillRateNum = parseFloat(newBillRateStr.replace(/,/g, ""));
            if (isNaN(newBillRateNum)) return null;

            // Parse original bill rate safely to number for comparison
            const originalBillRateNum = parseFloat(
              String(currentItem.billRate).replace(/,/g, ""),
            );

            // Skip if no actual change in bill rate
            if (newBillRateNum === originalBillRateNum) {
              return null;
            }

            return {
              id: currentItem.originalId || currentItem.id,
              projId: selectedProjectId,
              laborCategoryCode: currentItem.plc,
              costRate: newBillRateNum * 0.65,
              billingRate: newBillRateNum,
              // effectiveDate:
              //   editProjectPlcFields[idKey]?.startDate || currentItem.startDate,
              // endDate:
              //   editProjectPlcFields[idKey]?.endDate ??
              //   currentItem.endDate ??
              //   null,
              effectiveDate:
                editProjectPlcFields[idKey]?.startDate || currentItem.startDate
                  ? new Date(
                      editProjectPlcFields[idKey]?.startDate ||
                        currentItem.startDate,
                    ).toISOString()
                  : null,

              endDate:
                (editProjectPlcFields[idKey]?.endDate ?? currentItem.endDate)
                  ? new Date(
                      editProjectPlcFields[idKey]?.endDate ??
                        currentItem.endDate,
                    ).toISOString()
                  : null,
              sBillRtTypeCd:
                editProjectPlcFields[idKey]?.rateType || currentItem.rateType,
              isActive: true,
              modifiedBy: "admin",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          })
          .filter((item) => item !== null);

        if (itemsToUpdate.length === 0) {
          toast.warn("No changes to save.");
          setLoading(false);
          return;
        }

        // Send bulk PATCH request updating only changed records
        await axios.patch(
          `${backendUrl}/api/ProjectPlcRates/bulk-billingrate`,
          itemsToUpdate,
        );

        // Update local state with the saved changes
        setBillingRatesSchedule((prev) =>
          prev.map((rate) => {
            const updated = itemsToUpdate.find(
              (item) => item.id === (rate.originalId || rate.id),
            );
            if (updated) {
              return {
                ...rate,
                billRate: updated.billingRate,
                rateType: updated.sBillRtTypeCd,
                startDate: updated.effectiveDate,
                endDate: updated.endDate,
              };
            }
            return rate;
          }),
        );

        toast.success("Billing rates updated successfully!");

        // Clear edit states after successful save
        setEditedBillRates({});
        setEditProjectPlcFields({});
        setIsEditing(false);
        setSelectedRows({}); // Add this
        setNewRate(null);

        // setEditedBillRates({});
        // setIsEditing(false);
      } catch (error) {
        toast.error(`Failed to update billing rates: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    const fetchVendorEmployees = useCallback(async () => {
      if (!selectedProjectId) {
        setVendorEmployees([]);
        return;
      }

      try {
        const response = await axios.get(
          `${backendUrl}/Project/GetVenderEmployeesByProject/${selectedProjectId}?type=hours`,
        );
        setVendorEmployees(response.data);
      } catch (error) {
        setVendorEmployees([]);
        // console.error("Error fetching vendor employees:", error);
      }
    }, [selectedProjectId]);

    useEffect(() => {
      fetchVendorEmployees();
    }, [fetchVendorEmployees]);

    const handleDelete = async (id) => {
      if (
        !window.confirm("Are you sure you want to delete this billing rate?")
      ) {
        return; // User cancelled, do nothing
      }
      setLoading(true);
      try {
        await axios.delete(`${backendUrl}/api/ProjectPlcRates/${id}`);
        setBillingRatesSchedule((prev) =>
          prev.filter((rate) => rate.id !== id),
        );
        setEditBillRate((prev) => {
          const newEditBillRate = { ...prev };
          delete newEditBillRate[id];
          return newEditBillRate;
        });
        setEditProjectPlcFields((prev) => {
          const newEditProjectPlcFields = { ...prev };
          delete newEditProjectPlcFields[id];
          return newEditProjectPlcFields;
        });
        toast.success("Billing rate deleted successfully!");
      } catch (error) {
        // console.error("Error deleting billing rate:", error);
        toast.error(
          `Failed to delete billing rate: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    // const handleDeleteSelected = async () => {
    //   // Collect the synthetic IDs selected in the UI
    //   const selectedSyntheticIds = Object.entries(selectedRows)
    //     .filter(([id, selected]) => selected)
    //     .map(([id]) => id);

    //   if (selectedSyntheticIds.length === 0) {
    //     toast.warn("No rows selected for deletion.");
    //     return;
    //   }

    //   if (
    //     !window.confirm("Are you sure you want to delete selected billing rates?")
    //   ) {
    //     return;
    //   }

    //   // Map synthetic IDs to their corresponding original backend IDs
    //   const selectedOriginalIds = selectedSyntheticIds
    //     .map((syntheticId) => {
    //       const matchingItem = billingRatesSchedule.find(
    //         (item) => item.id === syntheticId
    //       );
    //       return matchingItem ? matchingItem.originalId || matchingItem.id : null;
    //     })
    //     .filter((id) => id !== null);

    //   setLoading(true);

    //   try {
    //     // Send original backend IDs in the bulk delete API
    //     await axios.delete(`${backendUrl}/api/ProjectPlcRates/bulk-delete`, {
    //       data: selectedOriginalIds,
    //     });

    //     // Filter out deleted items using synthetic IDs (used for UI state and rendering)
    //     setBillingRatesSchedule((prev) =>
    //       prev.filter((rate) => !selectedSyntheticIds.includes(rate.id))
    //     );

    //     setEditBillRate((prev) => {
    //       const newItems = { ...prev };
    //       selectedSyntheticIds.forEach((id) => delete newItems[id]);
    //       return newItems;
    //     });

    //     setEditProjectPlcFields((prev) => {
    //       const newItems = { ...prev };
    //       selectedSyntheticIds.forEach((id) => delete newItems[id]);
    //       return newItems;
    //     });

    //     toast.success("Selected billing rates deleted successfully!");
    //     setSelectedRows({});
    //   } catch (error) {
    //     toast.error(`Failed to delete billing rates: ${error.message}`);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const handleDeleteSelected = async () => {
      const selectedSyntheticIds = Object.entries(selectedRows)
        .filter(([id, selected]) => selected)
        .map(([id]) => id);

      if (selectedSyntheticIds.length === 0) {
        toast.warn("No rows selected for deletion.");
        return;
      }

      if (
        !window.confirm(
          "Are you sure you want to delete selected billing rates?",
        )
      ) {
        return;
      }

      const selectedOriginalIds = selectedSyntheticIds
        .map((syntheticId) => {
          const matchingItem = billingRatesSchedule.find(
            (item) => item.id === syntheticId,
          );
          return matchingItem ? matchingItem.originalId : null;
        })
        .filter((id) => id !== null);

      setLoading(true);
      try {
        await axios.delete(`${backendUrl}/api/ProjectPlcRates/bulk-delete`, {
          data: selectedOriginalIds,
        });
        setBillingRatesSchedule((prev) =>
          prev.filter((rate) => !selectedSyntheticIds.includes(rate.id)),
        );
        setSelectedRows({});
        toast.success("Selected billing rates deleted successfully!");
      } catch (error) {
        toast.error(`Failed to delete billing rates: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    const handleAddRow = () => {
      setNewRate({
        plc: "",
        billRate: "",
        rateType: "",
        startDate: "",
        endDate: "",
      });
    };

    // const handleSaveNewRate = async () => {
    //   if (!newRate || !newRate.plc || !newRate.startDate || !newRate.billRate) {
    //     toast.error(
    //       "Please fill all required fields (PLC, Bill Rate, Start Date)."
    //     );
    //     return;
    //   }

    //   if (isNaN(newRate.billRate) || Number(newRate.billRate) <= 0) {
    //     toast.error("Bill Rate must be a valid number greater than 0.");
    //     return;
    //   }

    //   // if (
    //   //   newRate.startDate &&
    //   //   newRate.endDate &&
    //   //   new Date(newRate.startDate) > new Date(newRate.endDate)
    //   // ) {
    //   //   toast.error("End Date cannot be before Start Date.");
    //   //   return;
    //   // }

    //   if (
    //     newRate.startDate &&
    //     newRate.endDate &&
    //     new Date(newRate.startDate) > new Date(newRate.endDate)
    //   ) {
    //     toast.error("End Date cannot be before Start Date.");
    //     return;
    //   }

    //   // ✅ Project boundaries
    //   const projectStart = new Date(selectedPlan.projStartDt);
    //   const projectEnd = new Date(selectedPlan.projEndDt);

    //   if (newRate.startDate) {
    //     const start = new Date(newRate.startDate);

    //     if (start < projectStart) {
    //       toast.error("Start Date cannot be before Project Start Date.");
    //       return;
    //     }

    //     if (start > projectEnd) {
    //       toast.error("Start Date cannot be after Project End Date.");
    //       return;
    //     }
    //   }

    //   if (newRate.endDate) {
    //     const end = new Date(newRate.endDate);

    //     if (end < projectStart) {
    //       toast.error("End Date cannot be before Project Start Date.");
    //       return;
    //     }

    //     if (end > projectEnd) {
    //       toast.error("End Date cannot be after Project End Date.");
    //       return;
    //     }
    //   }

    //   setLoading(true);
    //   try {
    //     await axios.post(`${backendUrl}/api/ProjectPlcRates`, {
    //       id: 0,
    //       projId: selectedProjectId,
    //       laborCategoryCode: newRate.plc,
    //       costRate: parseFloat(newRate.billRate) * 0.65,
    //       billingRate: parseFloat(newRate.billRate),
    //       effectiveDate: newRate.startDate,
    //       endDate: newRate.endDate || null,
    //       sBillRtTypeCd: newRate.rateType,
    //       isActive: true,
    //       modifiedBy: "admin",
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString(),
    //     });
    //     setNewRate(null);
    //     const fetchResponse = await axios.get(
    //       `${backendUrl}/api/ProjectPlcRates`
    //     );
    //     const filteredData = fetchResponse.data.filter((item) =>
    //       item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase())
    //     );
    //     setBillingRatesSchedule(
    //       filteredData.map((item) => ({
    //         id: item.id,
    //         plc: item.laborCategoryCode,
    //         billRate: item.billingRate,
    //         // rateType: item.rateType || "Select",
    //         rateType: item.sBillRtTypeCd || "Select",
    //         startDate: formatDate(item.effectiveDate),
    //         endDate: formatDate(item.endDate),
    //       }))
    //     );
    //     const newEditBillRate = {};
    //     const newEditProjectPlcFields = {};
    //     filteredData.forEach((item) => {
    //       newEditBillRate[item.id] = item.billingRate;
    //       newEditProjectPlcFields[item.id] = {
    //         rateType: item.rateType || "Select",
    //         startDate: formatDate(item.effectiveDate),
    //         endDate: formatDate(item.endDate),
    //       };
    //     });
    //     setEditBillRate(newEditBillRate);
    //     setEditProjectPlcFields(newEditProjectPlcFields);

    //     toast.success("New billing rate added successfully!");
    //   } catch (error) {
    //     // console.error(
    //     //   "Error adding billing rate:",
    //     //   error.response ? error.response.data : error.message
    //     // );
    //     toast.error(
    //       `Failed to add billing rate: ${
    //         error.response?.data?.message || error.message
    //       }`
    //     );
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const handleSaveNewRate = async () => {
      if (!newRate || !newRate.plc || !newRate.startDate || !newRate.billRate) {
        toast.error(
          "Please fill all required fields (PLC, Bill Rate, Start Date).",
        );
        return;
      }

      if (isNaN(newRate.billRate) || Number(newRate.billRate) <= 0) {
        toast.error("Bill Rate must be a valid number greater than 0.");
        return;
      }

      // if (
      //   newRate.startDate &&
      //   newRate.endDate &&
      //   new Date(newRate.startDate) > new Date(newRate.endDate)
      // ) {
      //   toast.error("End Date cannot be before Start Date.");
      //   return;
      // }

      // // Project boundaries
      // const projectStart = new Date(selectedPlan.projStartDt);
      // const projectEnd = new Date(selectedPlan.projEndDt);

      // if (newRate.startDate) {
      //   const start = new Date(newRate.startDate);
      //   if (start < projectStart) {
      //     toast.error("Start Date cannot be before Project Start Date.");
      //     return;
      //   }
      //   if (start > projectEnd) {
      //     toast.error("Start Date cannot be after Project End Date.");
      //     return;
      //   }
      // }

      // if (newRate.endDate) {
      //   const end = new Date(newRate.endDate);
      //   if (end < projectStart) {
      //     toast.error("End Date cannot be before Project Start Date.");
      //     return;
      //   }
      //   if (end > projectEnd) {
      //     toast.error("End Date cannot be after Project End Date.");
      //     return;
      //   }
      // }

      setLoading(true);
      const farFutureEndDate = new Date("2078-12-31T23:59:59");
      try {
        await axios.post(`${backendUrl}/api/ProjectPlcRates`, {
          id: 0,
          projId: selectedProjectId,
          laborCategoryCode: newRate.plc,
          costRate: parseFloat(newRate.billRate) * 0.65,
          billingRate: parseFloat(newRate.billRate),
          effectiveDate: newRate.startDate,
          endDate: newRate.endDate || farFutureEndDate,
          sBillRtTypeCd: newRate.rateType,
          isActive: true,
          modifiedBy: "admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setNewRate(null);

        // Fetch refreshed table data for current project
        const fetchResponse = await axios.get(
          `${backendUrl}/api/ProjectPlcRates`,
        );
        const filteredData = fetchResponse.data.filter((item) =>
          item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase()),
        );

        setBillingRatesSchedule(
          filteredData.map((item) => ({
            id: item.id,
            plc: item.laborCategoryCode,
            billRate: item.billingRate,
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.effectiveDate),
            endDate: formatDate(item.endDate),
          })),
        );

        // --- New: Auto-select new record after save ---
        if (filteredData.length > 0) {
          // Find the highest id (assuming new records get highest id)
          const newest = filteredData.reduce(
            (a, b) => (a.id > b.id ? a : b),
            filteredData[0],
          );
          setSelectedRows({ [newest.id]: true }); // Auto-select
        } else {
          setSelectedRows({});
        }

        // Update edit arrays
        const newEditBillRate = {};
        const newEditProjectPlcFields = {};
        filteredData.forEach((item) => {
          newEditBillRate[item.id] = item.billingRate;
          newEditProjectPlcFields[item.id] = {
            rateType: item.sBillRtTypeCd || "Select",
            startDate: formatDate(item.effectiveDate),
            endDate: formatDate(item.endDate),
          };
        });
        setEditBillRate(newEditBillRate);
        setEditProjectPlcFields(newEditProjectPlcFields);
        fetchBillingRates();
        toast.success("New billing rate added successfully!");
      } catch (error) {
        toast.error(
          `Failed to add billing rate: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    // const handleNewRateChange = (field, value) => {
    //   if (field === "billRate") {
    //     // Allow only digits, commas, and ONE decimal point
    //     if (!/^\d{0,3}(?:,?\d{3})*(?:\.\d*)?$/.test(value) && value !== "") {
    //       return; // ignore invalid input
    //     }

    //     // Keep value as-is (don't parse here, so user can type 4.5 naturally)
    //     setNewRate((prev) => ({ ...prev, [field]: value }));
    //     return;
    //   }

    //   setNewRate((prev) => ({ ...prev, [field]: value }));
    // };

    const handleNewRateChange = (field, value) => {
      if (field === "billRate") {
        // 1. Clean the input value:
        // - Remove everything except 0-9, dot, and minus
        // - Remove minus signs if they aren't at the start
        // - Prevent multiple decimal points
        const cleanValue = value
          .replace(/[^0-9.-]/g, "") //
          .replace(/(?!^)-/g, "") //
          .replace(/(\..*?)\..*/g, "$1"); //

        // Keep value as-is in state (numeric string) so user can type naturally
        setNewRate((prev) => ({ ...prev, [field]: cleanValue }));
        return;
      }

      setNewRate((prev) => ({ ...prev, [field]: value }));
    };

    const handleBillRateChange = (id, value) => {
      // Allow only digits, commas, and one decimal
      if (!/^\d{0,3}(?:,?\d{3})*(?:\.\d*)?$/.test(value) && value !== "") {
        return; // ignore invalid input
      }

      setEditBillRate((prev) => ({
        ...prev,
        [id]: value,
      }));
    };

    const handleProjectPlcFieldChange = (id, field, value) => {
      setEditProjectPlcFields((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      }));
    };

    const handleEditProjectPlcRow = (id) => {
      setEditingProjectPlcRowId(id);
      const currentRow = billingRatesSchedule.find((item) => item.id === id);
      if (currentRow) {
        setEditProjectPlcFields((prev) => ({
          ...prev,
          [id]: {
            rateType: currentRow.rateType,
            startDate: currentRow.startDate,
            endDate: currentRow.endDate,
          },
        }));
        setEditBillRate((prev) => ({
          ...prev,
          [id]: currentRow.billRate,
        }));
      }
    };

    // Employee Billing Rates Handlers
    const handleAddEmployeeRow = () => {
      setNewEmployeeRate({
        lookupType: "",
        empId: "",
        employeeName: "",
        plc: "",
        plcDescription: "",
        billRate: "",
        rateType: "",
        startDate: "",
        endDate: "",
      });
    };

    const handleSaveNewEmployeeRate = async () => {
      if (
        !newEmployeeRate ||
        !newEmployeeRate.empId ||
        !newEmployeeRate.plc ||
        !newEmployeeRate.startDate ||
        !newEmployeeRate.billRate
      ) {
        // console.error(
        //   "Please fill all required fields (Employee, PLC, Bill Rate, Start Date)"
        // );
        return;
      }
      setLoading(true);
      const farFutureEndDate = new Date("2078-12-31T23:59:59");
      try {
        await axios.post(`${backendUrl}/ProjEmplRt`, {
          id: 0,
          projId: selectedProjectId,
          emplId: newEmployeeRate.empId,
          employeeName: newEmployeeRate.employeeName,
          billLabCatCd: newEmployeeRate.plc,
          billRtAmt: parseFloat(newEmployeeRate.billRate),
          startDt: newEmployeeRate.startDate,
          endDt: newEmployeeRate.endDate || farFutureEndDate,
          sBillRtTypeCd: newEmployeeRate.rateType,
          type: newEmployeeRate.lookupType,
          isActive: true,
          modifiedBy: "admin",
        });
        setNewEmployeeRate(null);
        const fetchResponse = await axios.get(`${backendUrl}/ProjEmplRt`);
        const filteredData = fetchResponse.data.filter(
          (item) =>
            item.projId
              .toLowerCase()
              .startsWith(selectedProjectId.toLowerCase()) && item.emplId,
        );
        setEmployeeBillingRates(
          filteredData.map((item) => ({
            id: item.projEmplRtKey || item.id,
            lookupType: item.type || "Select",
            empId: item.emplId,
            employeeName:
              item.employeeName ||
              employees.find((emp) => emp.empId === item.emplId)
                ?.employeeName ||
              "",
            plc: item.billLabCatCd,
            plcDescription: item.plcDescription || "",
            billRate: item.billRtAmt,
            rateType: item.sBillRtTypeCd || "Select",
            startDate: item.startDt ? item.startDt.split("T")[0] : "",
            endDate: item.endDt ? item.endDt.split("T")[0] : null,
          })),
        );
        const newEditEmployeeBillRate = {};
        const newEditEmployeeFields = {};
        filteredData.forEach((item) => {
          const id = item.projEmplRtKey || item.id;
          if (id) {
            newEditEmployeeBillRate[id] = item.billRtAmt;
            newEditEmployeeFields[id] = {
              lookupType: item.type || "Select",
              rateType: item.sBillRtTypeCd || "Select",
              startDate: item.startDt ? item.startDt.split("T")[0] : "",
              endDate: item.endDt ? item.endDt.split("T")[0] : null,
            };
          }
        });
        setEditEmployeeBillRate(newEditEmployeeBillRate);
        setEditEmployeeFields(newEditEmployeeFields);
        fetchEmployeeBillingRates();
        toast.success("Added Sucessfully");
      } catch (error) {
        // console.error(
        //   "Error adding employee billing rate:",
        //   error.response ? error.response.data : error.message
        // );
      } finally {
        setLoading(false);
      }
    };

    const handleEmployeeBillRateChange = (id, value) => {
      // ✅ allow only numbers, commas, and decimals while typing
      // if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
      //   return; // ❌ ignore invalid input
      // }

      // // Remove commas for validation/storage
      // const cleanValue = value.replace(/,/g, "");

      // if (cleanValue !== "" && (isNaN(cleanValue) || Number(cleanValue) <= 0)) {
      //   toast.error("Bill Rate must be a valid number greater than 0.");
      //   return;
      // }
      const cleanValue = value
        .replace(/[^0-9.-]/g, "") //
        .replace(/(?!^)-/g, "") //
        .replace(/(\..*?)\..*/g, "$1"); //

      // 2. Reject 0 or negative values only if it's a complete parsable number
      // We check if it's not empty and not just a "." or "-"
      if (cleanValue !== "" && cleanValue !== "." && cleanValue !== "-") {
        const num = parseFloat(cleanValue);
        if (num <= 0) {
          toast.error("Bill Rate must be greater than 0.");
          return; // Ignore the update if invalid
        }
      }

      setEditEmployeeBillRate((prev) => ({
        ...prev,
        [id]: cleanValue, // store clean number string
      }));
    };

    const handleUpdateEmployee = async (id) => {
      if (!id) {
        // console.error("Invalid ID for update");
        return;
      }

      setLoadingAction((prev) => ({ ...prev, [id]: true })); // ✅ Fixed

      const updatedData = employeeBillingRates.find((item) => item.id === id);
      const originalId = updatedData?.originalId || id; // ✅ Use original ID
      const fields = editEmployeeFields[id] || {};

      if (
        fields.startDate &&
        fields.endDate &&
        new Date(fields.startDate) > new Date(fields.endDate)
      ) {
        toast.error("End Date cannot be before Start Date.");
        setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
        return;
      }

      try {
        await axios.put(`${backendUrl}/ProjEmplRt/${originalId}`, {
          // ✅ Use original ID
          projEmplRtKey: originalId, // ✅ Use original ID
          projId: selectedProjectId,
          emplId: fields.empId || updatedData.empId,
          employeeName: fields.employeeName || updatedData.employeeName,
          billLabCatCd: fields.plc || updatedData.plc,
          billRtAmt: parseFloat(
            editEmployeeBillRate[id] ?? updatedData.billRate,
          ),
          startDt: fields.startDate || updatedData.startDate,
          endDt: fields.endDate || updatedData.endDate || null,
          sBillRtTypeCd: fields.rateType || updatedData.rateType,
          type: fields.lookupType || updatedData.lookupType,
          isActive: true,
          modifiedBy: "admin",
        });

        // Update local state with the saved changes
        setEmployeeBillingRates((prev) =>
          prev.map((rate) =>
            rate.id === id
              ? {
                  ...rate,
                  lookupType: fields.lookupType || updatedData.lookupType,
                  empId: fields.empId || updatedData.empId,
                  employeeName: fields.employeeName || updatedData.employeeName,
                  plc: fields.plc || updatedData.plc,
                  plcDescription:
                    plcs.find(
                      (plc) =>
                        plc.laborCategoryCode ===
                        (fields.plc || updatedData.plc),
                    )?.description ||
                    fields.plcDescription ||
                    updatedData.plcDescription,
                  billRate: parseFloat(
                    editEmployeeBillRate[id] ?? updatedData.billRate,
                  ),
                  rateType: fields.rateType || updatedData.rateType,
                  startDate: fields.startDate || updatedData.startDate,
                  endDate: fields.endDate || updatedData.endDate || null,
                }
              : rate,
          ),
        );
        setEditingEmployeeRowId(null);
        toast.success("Employee billing rate updated successfully!");
      } catch (error) {
        // console.error("Error updating employee billing rate:", error);
        toast.error(
          `Failed to update employee billing rate: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
      }
    };

    const handleUpdateAllEmployeeChanges = async () => {
      setLoading(true);
      try {
        // Prepare items to update based on the edited bill rates keys
        const itemsToUpdate = Object.keys(editEmployeeBillRate)
          .map((idKey) => {
            const numericId = isNaN(Number(idKey)) ? idKey : Number(idKey);
            const currentItem = employeeBillingRates.find(
              (item) => item.id === numericId,
            );
            if (!currentItem) return null;

            const newBillRateStr = String(editEmployeeBillRate[idKey] ?? "");
            const newBillRateNum = parseFloat(newBillRateStr.replace(/,/g, ""));

            if (isNaN(newBillRateNum)) return null;
            if (newBillRateNum === currentItem.billRate) return null; // skip if no change

            const fields = editEmployeeFields[idKey] || {};

            return {
              projEmplRtKey: currentItem.originalId || currentItem.id,
              projId: selectedProjectId,
              emplId: fields.empId || currentItem.empId,
              billLabCatCd: fields.plc || currentItem.plc,
              plcDescription:
                fields.plcDescription || currentItem.plcDescription,
              billRtAmt: newBillRateNum,
              sBillRtTypeCd: fields.rateType || currentItem.rateType,
              // startDt: fields.startDate || currentItem.startDate,
              // endDt: fields.endDate || currentItem.endDate || null,
              startDt:
                fields.startDate || currentItem.startDate
                  ? new Date(
                      fields.startDate || currentItem.startDate,
                    ).toISOString()
                  : null,

              endDt:
                fields.endDate || currentItem.endDate
                  ? new Date(
                      fields.endDate || currentItem.endDate,
                    ).toISOString()
                  : null,

              modifiedBy: "admin",
              timeStamp: currentItem.timeStamp,
              rowVersion: currentItem.rowVersion,
              companyId: currentItem.companyId,
              type: fields.lookupType || currentItem.lookupType,
              billDiscRt: currentItem.billDiscRt || 0,
              emplName: fields.employeeName || currentItem.employeeName,
            };
          })
          .filter((item) => item !== null);

        if (itemsToUpdate.length === 0) {
          toast.warn("No changes to save.");
          setLoading(false);
          return;
        }

        // Call bulk update API
        await axios.patch(
          `${backendUrl}/ProjEmplRt/bulk-billingrate`,
          itemsToUpdate,
        );

        // Update local state with new bill rates for changed items
        setEmployeeBillingRates((prev) =>
          prev.map((rate) => {
            const updated = itemsToUpdate.find(
              (item) => item.projEmplRtKey === (rate.originalId || rate.id),
            );
            if (updated) {
              return {
                ...rate,
                lookupType: updated.type,
                empId: updated.emplId,
                employeeName: updated.emplName,
                plc: updated.billLabCatCd,
                plcDescription: updated.plcDescription,
                billRate: updated.billRtAmt,
                rateType: updated.sBillRtTypeCd,
                startDate: updated.startDt,
                endDate: updated.endDt,
              };
            }
            return rate;
          }),
        );

        setEditEmployeeBillRate({});
        setEditEmployeeFields({});
        setIsEmployeeEditing(false);
        setSelectedEmployeeRows({}); // Add this
        setNewEmployeeRate(null);

        // setEditEmployeeBillRate({});
        // setEditEmployeeFields({});
        // setIsEmployeeEditing(false);
        toast.success("Employee billing rates updated successfully!");
      } catch (error) {
        toast.error(
          `Failed to update employee billing rates: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    // const handleDeleteEmployee = async (id) => {
    //   if (
    //     !window.confirm(
    //       "Are you sure you want to delete this employee billing rate?"
    //     )
    //   ) {
    //     return;
    //   }
    //   if (!id) {
    //     // console.error("Invalid ID for deletion");
    //     return;
    //   }
    //   setLoading(true);
    //   try {
    //     await axios.delete(`${backendUrl}/ProjEmplRt/${id}`);
    //     setEmployeeBillingRates((prev) => prev.filter((rate) => rate.id !== id));
    //     setEditEmployeeBillRate((prev) => {
    //       const newEditEmployeeBillRate = { ...prev };
    //       delete newEditEmployeeBillRate[id];
    //       return newEditEmployeeBillRate;
    //     });
    //     setEditEmployeeFields((prev) => {
    //       const newEditEmployeeFields = { ...prev };
    //       delete newEditEmployeeFields[id];
    //       return newEditEmployeeFields;
    //     });
    //     setEditingEmployeeRowId(null);
    //     toast.success("Employee billing rate deleted successfully!");
    //   } catch (error) {
    //     // console.error("Error deleting employee billing rate:", error);
    //     toast.error(
    //       `Failed to delete employee billing rate: ${
    //         error.response?.data?.message || error.message
    //       }`
    //     );
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const handleDeleteEmployee = async () => {
      // Get selected synthetic IDs from UI state
      const selectedSyntheticIds = Object.entries(selectedEmployeeRows)
        .filter(([id, selected]) => selected)
        .map(([id]) => id);

      if (selectedSyntheticIds.length === 0) {
        toast.warn("No rows selected for deletion.");
        return;
      }

      if (
        !window.confirm(
          "Are you sure you want to delete selected employee billing rates?",
        )
      ) {
        return;
      }

      // Map synthetic UI IDs to original employee IDs expected by backend
      const selectedOriginalIds = selectedSyntheticIds
        .map((syntheticId) => {
          const matchingItem = employeeBillingRates.find(
            (item) => item.id === syntheticId,
          );
          return matchingItem
            ? matchingItem.originalId || matchingItem.id
            : null;
        })
        .filter((id) => id !== null);

      setLoading(true);

      try {
        await axios.delete(`${backendUrl}/ProjEmplRt/bulk-delete`, {
          data: selectedOriginalIds,
        });

        // Update UI state filtering synthetic ids
        setEmployeeBillingRates((prev) =>
          prev.filter((rate) => !selectedSyntheticIds.includes(rate.id)),
        );

        setEditEmployeeBillRate((prev) => {
          const newItems = { ...prev };
          selectedSyntheticIds.forEach((id) => delete newItems[id]);
          return newItems;
        });

        setEditEmployeeFields((prev) => {
          const newItems = { ...prev };
          selectedSyntheticIds.forEach((id) => delete newItems[id]);
          return newItems;
        });

        toast.success("Selected employee billing rates deleted successfully!");
        setSelectedEmployeeRows({});
      } catch (error) {
        toast.error(
          `Failed to delete employee billing rates: ${error.message}`,
        );
      } finally {
        setLoading(false);
      }
    };

    const handleNewEmployeeRateChange = (field, value, id = null) => {
      const updateState = (prev, selectedEmp = null, selectedPlc = null) => {
        // ✅ Special handling for billRate
        if (field === "billRate") {
          // Only allow digits, commas, decimals
          if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
            return prev; // ❌ invalid → don't update
          }
          // Clean commas for storage
          const cleanValue = value.replace(/,/g, "");
          return { ...prev, [field]: cleanValue };
        }

        const updated = {
          ...prev,
          [field]: value,
          ...(field === "empId" && selectedEmp
            ? { employeeName: selectedEmp.employeeName }
            : {}),
          ...(field === "plc" && selectedPlc
            ? { plcDescription: selectedPlc.description }
            : {}),
        };

        // ✅ Date validations
        if (updated.startDate && updated.endDate) {
          if (new Date(updated.startDate) > new Date(updated.endDate)) {
            toast.error("End Date cannot be before Start Date.");
            return prev;
          }
        }

        // if (updated.startDate) {
        //   if (
        //     new Date(updated.startDate) < new Date(selectedPlan.projStartDt) ||
        //     new Date(updated.startDate) > new Date(selectedPlan.projEndDt)
        //   ) {
        //     toast.error("Start Date must be within project dates.");
        //     return prev;
        //   }
        // }

        // if (updated.endDate) {
        //   if (
        //     new Date(updated.endDate) < new Date(selectedPlan.projStartDt) ||
        //     new Date(updated.endDate) > new Date(selectedPlan.projEndDt)
        //   ) {
        //     toast.error("End Date must be within project dates.");
        //     return prev;
        //   }
        // }

        return updated; // ✅ valid update
      };

      if (id) {
        // Editing existing row
        const selectedEmp =
          field === "empId"
            ? employees.find((emp) => emp.empId === value)
            : null;
        const selectedPlc =
          field === "plc"
            ? plcs.find((plc) => plc.laborCategoryCode === value)
            : null;

        setEditEmployeeFields((prev) => ({
          ...prev,
          [id]: updateState(prev[id] || {}, selectedEmp, selectedPlc),
        }));
      } else {
        // Adding new row
        const selectedEmp =
          field === "empId"
            ? employees.find((emp) => emp.empId === value)
            : null;
        const selectedPlc =
          field === "plc"
            ? plcs.find((plc) => plc.laborCategoryCode === value)
            : null;

        setNewEmployeeRate((prev) =>
          updateState(prev, selectedEmp, selectedPlc),
        );
      }
    };

    const handleEditEmployeeRow = (id) => {
      setEditingEmployeeRowId(id);
      const currentRow = employeeBillingRates.find((item) => item.id === id);
      if (currentRow) {
        setEditEmployeeFields((prev) => ({
          ...prev,
          [id]: {
            // lookupType: currentRow.lookupType,
            empId: currentRow.empId,
            employeeName: currentRow.employeeName,
            plc: currentRow.plc,
            plcDescription: currentRow.plcDescription,
            rateType: currentRow.rateType,
            startDate: currentRow.startDate,
            endDate: currentRow.endDate,
          },
        }));
        setEditEmployeeBillRate((prev) => ({
          ...prev,
          [id]: currentRow.billRate,
        }));
      }
    };

    // Vendor Billing Rates Handlers
    const handleAddVendorRow = () => {
      setNewVendorRate({
        lookupType: "",
        vendorId: "",
        vendorName: "",
        vendorEmployee: "",
        vendorEmployeeName: "",
        plc: "",
        plcDescription: "",
        billRate: "",
        rateType: "",
        startDate: "",
        endDate: "",
      });
    };

    const handleSaveNewVendorRate = async () => {
      if (
        !newVendorRate ||
        !newVendorRate.vendorId ||
        !newVendorRate.vendorName ||
        !newVendorRate.plc ||
        !newVendorRate.startDate ||
        !newVendorRate.billRate
      ) {
        // console.error(
        //   "Please fill all required fields (Vendor ID, Vendor Name, PLC, Bill Rate, Start Date)"
        // );
        return;
      }
      setLoading(true);
      try {
        const farFutureEndDate = new Date("2078-12-31T23:59:59");

        await axios.post(`${backendUrl}/ProjVendRt`, {
          id: 0,
          projId: selectedPlan?.projId || selectedProjectId,
          vendId: newVendorRate.vendorId,
          vendEmplId: newVendorRate.vendorEmployee,
          billLabCatCd: newVendorRate.plc,
          billDiscRt: 0,
          companyId: "1",
          billRtAmt: parseFloat(newVendorRate.billRate),
          startDt: new Date(newVendorRate.startDate).toISOString(),
          endDt: newVendorRate.endDate
            ? new Date(newVendorRate.endDate).toISOString()
            : farFutureEndDate,
          sBillRtTypeCd: newVendorRate.rateType,
          type: newVendorRate.lookupType,
          modifiedBy: "admin",
          timeStamp: new Date().toISOString(),
        });
        setNewVendorRate(null);
        const fetchResponse = await axios.get(`${backendUrl}/ProjVendRt`);
        const filteredData = fetchResponse.data.filter((item) =>
          item.projId.toLowerCase().startsWith(selectedProjectId.toLowerCase()),
        );
        // setVendorBillingRates(
        //   filteredData.map((item) => ({
        //     id: item.id,
        //     lookupType: item.type || "Select",
        //     vendorId: item.vendId || "",
        //     // vendorName: item.vendorName || "",
        //     // vendorEmployee: item.vendEmplId || "",
        //     vendorName: item.vendEmplName || newVendorRate.vendorName || "", // Use vendEmplName or fallback to newVendorRate.vendorName
        //     vendorEmployee: item.vendEmplId || "",
        //     vendorEmployeeName: item.vendEmplName || "",
        //     plc: item.billLabCatCd,
        //     plcDescription: item.description || "",
        //     billRate: item.billRtAmt,
        //     rateType: item.sBillRtTypeCd || "Select",
        //     startDate: new Date(item.startDt).toISOString().split("T")[0],
        //     endDate: item.endDt
        //       ? new Date(item.endDt).toISOString().split("T")[0]
        //       : null,
        //   }))
        // );
        setVendorBillingRates(
          filteredData.map((item) => ({
            id: item.projVendRtKey || item.id,
            projVendRtKey: item.projVendRtKey,
            lookupType: item.type || "Select",
            vendorId: item.vendId || "",
            vendorName:
              item.vendEmplName || newVendorRate.vendorEmployeeName || "", // Use vendEmplName
            vendorEmployee: item.vendEmplId || "",
            vendorEmployeeName:
              item.vendEmplName || newVendorRate.vendorEmployeeName || "", // Use vendEmplName
            plc: item.billLabCatCd,
            plcDescription: item.plcDescription || "",
            billRate: item.billRtAmt,
            rateType: item.sBillRtTypeCd || "Select",
            // startDate: new Date(item.startDt).toISOString().split("T")[0],
            // endDate: item.endDt
            //   ? new Date(item.endDt).toISOString().split("T")[0]
            //   : null,
            startDate: formatDate(item.startDt),
            endDate: formatDate(item.endDt),
          })),
        );
        const newEditVendorBillRate = {};
        const newEditVendorFields = {};
        filteredData.forEach((item) => {
          newEditVendorBillRate[item.id] = item.billRtAmt;
          newEditVendorFields[item.id] = {
            lookupType: item.type || "Select",
            rateType: item.sBillRtTypeCd || "Select",
            startDate: new Date(item.startDt).toISOString().split("T")[0],
            endDate: item.endDt
              ? new Date(item.endDt).toISOString().split("T")[0]
              : null,
          };
        });
        setEditVendorBillRate(newEditVendorBillRate);
        setEditVendorFields(newEditVendorFields);
        fetchVendorBillingRates();
        toast.success("Added Successfully!");
      } catch (error) {
        // console.error(
        //   "Error adding vendor billing rate:",
        //   error.response ? error.response.data : error.message
        // );
      } finally {
        setLoading(false);
      }
    };

    // const handleVendorBillRateChange = (id, value) => {
    //   // ✅ Allow only digits, commas, and decimals
    //   if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
    //     return; // ignore invalid characters
    //   }

    //   // ✅ Clean commas
    //   const clean = value.replace(/,/g, "");

    //   // ✅ Reject 0 or negative values
    //   if (clean !== "" && parseFloat(clean) <= 0) {
    //     toast.error("Bill Rate must be greater than 0.");
    //     return;
    //   }

    //   // setHasUnsavedChanges(true);

    //   setEditVendorBillRate((prev) => ({
    //     ...prev,
    //     [id]: clean, // keep numeric string (so "2.5" stays "2.5")
    //   }));
    // };

    const handleVendorBillRateChange = (id, value) => {
      // 1. Clean the input value:
      // - Remove everything except 0-9, dot, and minus
      // - Remove minus signs if they aren't at the start
      // - Prevent multiple decimal points
      const cleanValue = value
        .replace(/[^0-9.-]/g, "") //
        .replace(/(?!^)-/g, "") //
        .replace(/(\..*?)\..*/g, "$1"); //

      // 2. Reject 0 or negative values only if it's a complete parsable number
      // We check if it's not empty and not just a "." or "-"
      if (cleanValue !== "" && cleanValue !== "." && cleanValue !== "-") {
        const num = parseFloat(cleanValue);
        if (num <= 0) {
          toast.error("Bill Rate must be greater than 0.");
          return; // Ignore the update if invalid
        }
      }

      // 3. Update State
      // We store the clean numeric string so calculations remain accurate
      setEditVendorBillRate((prev) => ({
        ...prev,
        [id]: cleanValue,
      }));
    };

    const handleUpdateVendor = async (id) => {
      setLoadingAction((prev) => ({ ...prev, [id]: true })); // ✅ Fixed

      const row = vendorBillingRates.find((r) => r.id === id);
      const originalId = row?.originalId || row?.projVendRtKey || id; // ✅ Use original ID
      const fields = editVendorFields[id] || {};

      if (
        fields.startDate &&
        fields.endDate &&
        new Date(fields.startDate) > new Date(fields.endDate)
      ) {
        toast.error("End Date cannot be before Start Date.");
        setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
        return;
      }

      try {
        await axios.put(
          `${backendUrl}/ProjVendRt/${originalId}`, // ✅ Use original ID
          {
            projVendRtKey: originalId, // ✅ Use original ID
            projId: selectedProjectId,
            vendId: fields.vendorId || row.vendorId,
            vendEmplId: fields.vendorEmployee || row.vendorEmployee,
            billLabCatCd: fields.plc || row.plc,
            billDiscRt: 0,
            companyId: "1",
            billRtAmt: parseFloat(editVendorBillRate[id] ?? row.billRate),
            startDt: new Date(fields.startDate || row.startDate).toISOString(),
            endDt: fields.endDate
              ? new Date(fields.endDate).toISOString()
              : row.endDate
                ? new Date(row.endDate).toISOString()
                : null,
            sBillRtTypeCd: fields.rateType || row.rateType,
            type: fields.lookupType || row.lookupType,
            modifiedBy: "admin",
            timeStamp: new Date().toISOString(),
          },
        );

        setVendorBillingRates((prev) =>
          prev.map((rate) =>
            rate.id === id
              ? {
                  ...rate,
                  lookupType: fields.lookupType || rate.lookupType,
                  vendorId: fields.vendorId || rate.vendorId,
                  vendorName: fields.vendorName || rate.vendorName,
                  vendorEmployee: fields.vendorEmployee || rate.vendorEmployee,
                  vendorEmployeeName:
                    fields.vendorEmployeeName || rate.vendorEmployeeName,
                  plc: fields.plc || rate.plc,
                  plcDescription:
                    plcs.find(
                      (plc) =>
                        plc.laborCategoryCode === (fields.plc || rate.plc),
                    )?.description ||
                    fields.plcDescription ||
                    rate.plcDescription,
                  billRate: parseFloat(editVendorBillRate[id] ?? rate.billRate),
                  rateType: fields.rateType || rate.rateType,
                  startDate: fields.startDate || rate.startDate,
                  endDate: fields.endDate || rate.endDate || null,
                }
              : rate,
          ),
        );
        setEditingVendorRowId(null);
        toast.success("Vendor billing rate updated successfully!");
      } catch (error) {
        // console.error("Error updating vendor billing rate:", error);
        toast.error(
          `Failed to update vendor billing rate: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoadingAction((prev) => ({ ...prev, [id]: false })); // ✅ Fixed
      }
    };

    const handleUpdateAllVendors = async () => {
      setLoading(true);
      try {
        // Prepare payload - include only vendors with changed bill rates
        const vendorsToUpdate = Object.entries(editVendorBillRate)
          .map(([idKey, editedRate]) => {
            const id = isNaN(Number(idKey)) ? idKey : Number(idKey);
            const current = vendorBillingRates.find((v) => v.id === id);
            if (!current) return null;

            const cleanedRateStr =
              typeof editedRate === "string"
                ? editedRate.replace(/,/g, "")
                : editedRate;
            const newBillRate = parseFloat(cleanedRateStr);

            // Skip if not a valid number or unchanged
            if (isNaN(newBillRate) || newBillRate === current.billRate)
              return null;

            const fields = editVendorFields[idKey] || {};

            return {
              projVendRtKey:
                current.originalId || current.projVendRtKey || current.id,
              projId: selectedProjectId,
              vendId: fields.vendorId || current.vendorId,
              vendEmplId: fields.vendorEmployee || current.vendorEmployee,
              billLabCatCd: fields.plc || current.plc,
              billRtAmt: newBillRate,
              sBillRtTypeCd: fields.rateType || current.rateType,
              startDt: fields.startDate
                ? new Date(fields.startDate).toISOString()
                : new Date(current.startDate).toISOString(),
              endDt: fields.endDate
                ? new Date(fields.endDate).toISOString()
                : current.endDate
                  ? new Date(current.endDate).toISOString()
                  : null,
              modifiedBy: "admin",
              timeStamp: new Date().toISOString(),
              rowVersion: current.rowVersion,
              companyId: current.companyId || "1",
              type: fields.lookupType || current.lookupType,
              billDiscRt: current.billDiscRt || 0,
              vendEmplName:
                fields.vendorEmployeeName || current.vendorEmployeeName,
              plcDescription: fields.plcDescription || current.plcDescription,
            };
          })
          .filter(Boolean);

        if (vendorsToUpdate.length === 0) {
          toast.warn("No vendor billing rates were changed.");
          setLoading(false);
          return;
        }

        // Call bulk update API endpoint
        await axios.patch(
          `${backendUrl}/ProjVendRt/bulk-billingrate`,
          vendorsToUpdate,
        );

        // Update local vendorBillingRates state with changes
        setVendorBillingRates((prev) =>
          prev.map((vendor) => {
            const updated = vendorsToUpdate.find(
              (v) =>
                v.projVendRtKey ===
                (vendor.originalId || vendor.projVendRtKey || vendor.id),
            );
            return updated
              ? {
                  ...vendor,
                  lookupType: updated.type,
                  vendorId: updated.vendId,
                  vendorEmployee: updated.vendEmplId,
                  vendorEmployeeName: updated.vendEmplName,
                  plc: updated.billLabCatCd,
                  plcDescription: updated.plcDescription,
                  billRate: updated.billRtAmt,
                  rateType: updated.sBillRtTypeCd,
                  startDate: updated.startDt,
                  endDate: updated.endDt,
                }
              : vendor;
          }),
        );

        // Clear editing states
        setEditVendorBillRate({});
        setEditVendorFields({});
        setIsVendorEditing(false);
        setSelectedVendorRows({}); // Add this
        setNewVendorRate(null);

        setEditVendorBillRate({});
        setEditVendorFields({});
        setIsVendorEditing(false);
        toast.success("Vendor billing rates updated successfully.");
      } catch (error) {
        toast.error(
          `Failed to update vendor billing rates: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteVendor = async (id) => {
      if (
        !window.confirm(
          "Are you sure you want to delete this vendor billing rate?",
        )
      ) {
        return;
      }
      const rate = vendorBillingRates.find((rate) => rate.id === id);
      const deleteId = rate?.projVendRtKey || id; // Use projVendRtKey if available
      setLoadingAction((prev) => ({ ...prev, [id]: true }));
      try {
        await axios.delete(`${backendUrl}/ProjVendRt/${deleteId}`);
        setVendorBillingRates((prev) => prev.filter((rate) => rate.id !== id));
        setEditVendorBillRate((prev) => {
          const newEditVendorBillRate = { ...prev };
          delete newEditVendorBillRate[id];
          return newEditVendorBillRate;
        });
        setEditVendorFields((prev) => {
          const newEditVendorFields = { ...prev };
          delete newEditVendorFields[id];
          return newEditVendorFields;
        });
        setEditingVendorRowId(null);
        toast.success("Vendor billing rate deleted successfully!");
      } catch (error) {
        // console.error("Error deleting vendor billing rate:", error);
        toast.error(
          `Failed to delete vendor billing rate: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoadingAction((prev) => ({ ...prev, [id]: false }));
      }
    };

    const handleDeleteSelectedVendors = async () => {
      // Extract only IDs that are checked (truthy in selectedVendorRows)
      const selectedIds = vendorBillingRates
        .filter((item) => selectedVendorRows[item.id])
        .map((item) => item.projVendRtKey ?? item.id);

      if (selectedIds.length === 0) {
        toast.warn("No vendor billing rates selected for deletion.");
        return;
      }

      if (
        !window.confirm(
          `Are you sure you want to delete ${selectedIds.length} selected vendor billing rate(s)?`,
        )
      ) {
        return;
      }

      setLoading(true);
      try {
        await axios.delete(`${backendUrl}/ProjVendRt/bulk-delete`, {
          data: selectedIds,
        });

        console.log(JSON.stringify(selectedIds));

        // Remove deleted vendors from local state
        setVendorBillingRates((prev) =>
          prev.filter(
            (vendor) =>
              !selectedIds.includes(vendor.projVendRtKey ?? vendor.id),
          ),
        );

        // Clean up selection and editing state for removed IDs
        setSelectedVendorRows((prev) => {
          const updated = { ...prev };
          selectedIds.forEach((id) => {
            delete updated[id];
          });
          return updated;
        });
        setEditVendorBillRate((prev) => {
          const updated = { ...prev };
          selectedIds.forEach((id) => {
            delete updated[id];
          });
          return updated;
        });
        setEditVendorFields((prev) => {
          const updated = { ...prev };
          selectedIds.forEach((id) => {
            delete updated[id];
          });
          return updated;
        });

        setEditingVendorRowId(null);

        toast.success("Selected vendor billing rates deleted successfully!");
      } catch (error) {
        toast.error(
          `Failed to delete selected vendor billing rates: ${
            error.response?.data?.message || error.message
          }`,
        );
      } finally {
        setLoading(false);
      }
    };

    const handleNewVendorRateChange = (field, value) => {
      setNewVendorRate((prev) => {
        let updated = { ...prev, [field]: value };

        // ✅ Bill Rate validation
        if (field === "billRate") {
          // Allow only digits, commas, and ONE decimal
          if (!/^[0-9,]*\.?[0-9]*$/.test(value) && value !== "") {
            toast.error("Bill Rate must contain only numbers and decimal.");
            return prev;
          }

          // Remove commas for clean numeric value
          const clean = value.replace(/,/g, "");

          // Prevent 0 or negative
          if (clean !== "" && parseFloat(clean) <= 0) {
            toast.error("Bill Rate must be greater than 0.");
            return prev;
          }

          updated = { ...prev, [field]: clean }; // store clean value
        }

        // ✅ Date validations
        if (updated.startDate && updated.endDate) {
          if (new Date(updated.startDate) > new Date(updated.endDate)) {
            toast.error("End Date cannot be before Start Date.");
            return prev;
          }
        }

        // if (updated.startDate) {
        //   if (
        //     new Date(updated.startDate) < new Date(selectedPlan.projStartDt) ||
        //     new Date(updated.startDate) > new Date(selectedPlan.projEndDt)
        //   ) {
        //     toast.error("Start Date must be within project dates.");
        //     return prev;
        //   }
        // }

        // if (updated.endDate) {
        //   if (
        //     new Date(updated.endDate) < new Date(selectedPlan.projStartDt) ||
        //     new Date(updated.endDate) > new Date(selectedPlan.projEndDt)
        //   ) {
        //     toast.error("End Date must be within project dates.");
        //     return prev;
        //   }
        // }

        return updated; // ✅ valid update
      });
    };

    const handleVendorFieldChange = (id, field, value) => {
      if (field === "billRate") {
        handleVendorBillRateChange(id, value);
        return;
      }
      if (field === "vendorId") {
        const selectedVend = vendorEmployees.find((v) => v.vendId === value);
        setEditVendorFields((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            vendorId: value,
            vendorName: selectedVend
              ? selectedVend.employeeName
              : prev[id]?.vendorName,
            vendorEmployee: selectedVend
              ? selectedVend.empId
              : prev[id]?.vendorEmployee,
            vendorEmployeeName: selectedVend
              ? selectedVend.employeeName
              : prev[id]?.vendorEmployeeName,
          },
        }));
        setVendorBillingRates((prev) =>
          prev.map((rate) =>
            rate.id === id
              ? {
                  ...rate,
                  vendorId: value,
                  vendorName: selectedVend
                    ? selectedVend.employeeName
                    : rate.vendorName,
                  vendorEmployee: selectedVend
                    ? selectedVend.empId
                    : rate.vendorEmployee,
                  vendorEmployeeName: selectedVend
                    ? selectedVend.employeeName
                    : rate.vendorEmployeeName,
                }
              : rate,
          ),
        );
        return;
      }
      setEditVendorFields((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      }));
      if (
        field !== "lookupType" &&
        field !== "rateType" &&
        field !== "startDate" &&
        field !== "endDate" &&
        field !== "billRate"
      ) {
        setVendorBillingRates((prev) =>
          prev.map((rate) =>
            rate.id === id ? { ...rate, [field]: value } : rate,
          ),
        );
      }
    };

    const handleEditVendorRow = (id) => {
      setEditingVendorRowId(id);
    };

    useEffect(() => {
      if (!showPLC || hasFetchedPLC || !selectedProjectId) return;
      fetchBillingRates();
      fetchEmployeeBillingRates();
      fetchVendorBillingRates();
      setHasFetchedPLC(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPLC, hasFetchedPLC, selectedProjectId]);

    const handlePlcInputChange = (value) => {
      setPlcSearch(value);
    };

    const handlePlcSelect = (value) => {
      handleNewRateChange("plc", value);
      setPlcSearch(value);
    };

    function clearALL() {
      setIsEditing(false);
      setEditedBillRates({});
      setSelectedRows({});
       setIsVendorEditing(false);
      setEditVendorBillRate({});
      setEditVendorFields({});
      setIsEmployeeEditing(false);
      setEditEmployeeBillRate({});
      setEditEmployeeFields({});
      setNewRate(null);
      setNewEmployeeRate(null);
      setNewVendorRate(null);
    }

    function cancelEditing() {
      setIsEditing(false);
      setEditedBillRates({});
      setSelectedRows({});
    }

    function cancelVendorEditing() {
      setIsVendorEditing(false);
      setEditVendorBillRate({});
      setEditVendorFields({});
      // Optionally, reset selectedVendorRows if you want to clear selection too
      // setSelectedVendorRows({});
    }

    function cancelEmployeeEditing() {
      setIsEmployeeEditing(false);
      setEditEmployeeBillRate({});
      setEditEmployeeFields({});
      // Optionally clear checkboxes if you use selection for other employee batch actions
      // setSelectedEmployeeRows({});
    }

    const handleUniversalDeleteSelected = async () => {
  // 1. Identify which section we are currently working with
  // You can determine this by checking which "Selection" state has active items
  const selections = [
    { type: 'project', items: selectedRows, state: billingRatesSchedule, setter: setBillingRatesSchedule, endpoint: '/api/ProjectPlcRates/bulk-delete', reset: setSelectedRows },
    { type: 'employee', items: selectedEmployeeRows, state: employeeBillingRates, setter: setEmployeeBillingRates, endpoint: '/ProjEmplRt/bulk-delete', reset: setSelectedEmployeeRows },
    { type: 'vendor', items: selectedVendorRows, state: vendorBillingRates, setter: setVendorBillingRates, endpoint: '/ProjVendRt/bulk-delete', reset: setSelectedVendorRows }
  ];

  // Filter to find tables that actually have selections
  const activeSelections = selections.filter(s => Object.values(s.items).some(val => val));

  if (activeSelections.length === 0) {
    toast.warn("No rows selected for deletion.");
    return;
  }

  if (!window.confirm("Are you sure you want to delete the selected items?")) return;

  setLoading(true);

  try {
    // Process each table's deletions
    for (const section of activeSelections) {
      const selectedSyntheticIds = Object.entries(section.items)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);

      // Map UI ID to Backend ID (originalId)
      const originalIds = selectedSyntheticIds
        .map(syncId => section.state.find(item => item.id === syncId)?.originalId)
        .filter(id => id != null);

      if (originalIds.length > 0) {
        // API Call
        await axios.delete(`${backendUrl}${section.endpoint}`, { data: originalIds });

        // Update UI State
        section.setter(prev => prev.filter(row => !selectedSyntheticIds.includes(row.id)));
        
        // Clear checkboxes for this section
        section.reset({});
      }
    }
    toast.success("Deletions completed successfully!");
  } catch (error) {
    console.error("Bulk Delete Error:", error);
    toast.error("An error occurred during deletion.");
  } finally {
    setLoading(false);
  }
};

    const handleSaveAllChanges = async () => {
      setLoading(true);
      try {
        let tasks = [];

        // --- VENDOR TABLE LOGIC ---
        // 1. Check if we are adding a BRAND NEW vendor row
        if (newVendorRate?.vendorId && newVendorRate?.plc) {
          tasks.push(handleSaveNewVendorRate());
        }

        // 2. Check if we are editing EXISTING vendor rows (Inline Edit)
        // We check if the 'isVendorEditing' flag is true
        if (isVendorEditing) {
          tasks.push(handleUpdateAllVendors());
        }

        // --- REPEAT FOR EMPLOYEE & PROJECT TABLES ---
        if (newEmployeeRate?.empId) tasks.push(handleSaveNewEmployeeRate());
        if (isEmployeeEditing) tasks.push(handleUpdateAllEmployeeChanges());

        if (newRate?.plc) tasks.push(handleSaveNewRate());
        if (isEditing) tasks.push(handleUpdateAllChanges());

        // --- VALIDATION ---
        if (tasks.length === 0) {
          toast.info(
            "No changes detected. Please edit a row or add a new one first.",
          );
          setLoading(false);
          return;
        }

        // Execute everything
        await Promise.all(tasks);

        // --- CLEANUP ---
        setIsVendorEditing(false);
        setIsEmployeeEditing(false);
        setIsEditing(false);
        setNewVendorRate(null);

        toast.success("All changes saved!");
      } catch (error) {
        toast.error("Save failed. Please check your network.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div
        ref={containerRef}
        className=" rounded-xl border m-2 border-gray-200 p-2 min-h-[150px] scroll-mt-16 text-xs"
      >
        {/* Add this button in your UI, typically at the top or bottom of the modal */}
        <div className="flex justify-end gap-2 p-2">
        <button
    // onClick={() => {
    //   // Clear all new rate states
    //   setNewRate(null);
    //   setNewEmployeeRate(null);
    //   setNewVendorRate(null);
    // }}
    onClick={() => {
      clearALL()
    }}
    className="btn1 btn-blue"
  >
    Clear
  </button> 

         <button
            onClick={handleSaveAllChanges}
            disabled={loading}
            className={`btn1 btn-blue ${loading ? "cursor-not-allowed" : ""}`}
          > 
         {loading ?  "Saving....." :
         "Save" 
  }
          </button>
          <button
  onClick={handleUniversalDeleteSelected}
  disabled={
    !Object.values(selectedRows).some(v => v) &&
    !Object.values(selectedEmployeeRows).some(v => v) &&
    !Object.values(selectedVendorRows).some(v => v)
  }
  className="btn1 btn-blue bg-red-600"
>
Delete Selected
</button>
        </div> 
        {/* <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      /> */}
        {/* Project Labor Categories Billing Rates Schedule */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2 ">
            <h3 className="text-sm font-semibold">
              Project Labor Categories Billing Rates Schedule
            </h3>
            <div className="w-1/5 flex justify-end items-center space-x-2">
              {/* ADD BUTTON */}
              {isEditable && (
                <button
                  onClick={handleAddRow}
                  className="btn1 btn-blue cursor-pointer"
                  disabled={loading || newRate}
                >
                  Add
                </button>
              )}

              {/* NEW RATE SAVE/CANCEL */}
               {/* <span>Cancel</span> */}
              {newRate && isEditable && (
                <>
                  {/* <button
                    onClick={handleSaveNewRate}
                    className="btn1 btn-blue cursor-pointer flex items-center gap-1"
                    disabled={loading}
                    title="Save"
                  >
                    <FaSave className="text-sm" />
                    <span>Save</span>
                  </button> */}
                  <button
                    onClick={() => setNewRate(null)}
                    className="btn1 btn-blue cursor-pointer"
                    disabled={loading}
                    title="Cancel"
                  >
                    <FaTimes className="text-sm" />
                   
                  </button>
                </>
              )}

              {/* EDIT/CANCEL BUTTON */}
              {!newRate && isEditable && (
                <>
                  <button
                    onClick={() =>
                      isEditing ? cancelEditing() : setIsEditing(true)
                    }
                    className={`btn1 btn-blue cursor-pointer`}
                    disabled={loading || billingRatesSchedule.length === 0}
                    title={isEditing ? "Cancel Editing" : "Edit Bill Rates"}
                  >
                    {isEditing ? (
                      <>
                        <FaTimes className="text-sm" />
                        {/* <span>Cancel</span> */}
                      </>
                    ) : (
                      <>
                        <FaEdit className="text-sm" />
                        {/* <span>Edit</span> */}
                      </>
                    )}
                  </button>

                  {/* SAVE BUTTON (only visible in edit mode) */}
                  {/* {isEditing && (
                    <button
                      onClick={handleUpdateAllChanges}
                      className="btn1 btn-blue cursor-pointer flex items-center gap-1 "
                      disabled={loading}
                      title="Save Changes"
                    >
                      <FaSave className="text-sm" />
                      <span>Save</span>
                    </button>
                  )} */}
                </>
              )}

              {/* DELETE SELECTED (always visible, disabled when none selected) */}
              {/* {isEditable && (
                <button
                  onClick={handleDeleteSelected} // implement to delete selectedRows IDs
                  className="btn1 btn-blue cursor-pointer btn-red"
                  disabled={
                    loading || !Object.values(selectedRows).some(Boolean)
                  }
                  title="Delete Selected"
                >
                  <FaTrash className="text-sm" />
                  <span>Delete</span>
                </button>
              )} */}
            </div>
          </div>

          <div className="overflow-x-auto rounded-sm overflow-y-auto max-h-64 border border-gray-200">
            <table className="w-full border-collapse ">
              <thead className="sticky top-0 bg-gray-200">
                <tr>
                  {isEditable && (
                    <th className="th-thead border-r border-gray-300 text-left">
                      {isEditable && (
                        <input
                          type="checkbox"
                          className="w-3 h-3"
                          checked={
                            billingRatesSchedule.length > 0 &&
                            billingRatesSchedule.every(
                              (item) => selectedRows[item.id],
                            )
                          }
                          onChange={() => {
                            if (
                              billingRatesSchedule.length > 0 &&
                              billingRatesSchedule.every(
                                (item) => selectedRows[item.id],
                              )
                            ) {
                              setSelectedRows({});
                            } else {
                              const allSelected = {};
                              billingRatesSchedule.forEach((item) => {
                                allSelected[item.id] = true;
                              });
                              setSelectedRows(allSelected);
                            }
                          }}
                        />
                      )}
                    </th>
                  )}

                  <th className="th-thead border-r border-gray-300">PLC</th>
                  <th className="th-thead border-r border-gray-300">
                    Bill Rate
                  </th>
                  <th className="th-thead border-r border-gray-300">
                    Rate Type
                  </th>
                  <th className="th-thead border-r border-gray-300">
                    Start Date
                  </th>
                  <th className="th-thead border-r border-gray-300">
                    End Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {newRate && (
                  <tr className="bg-white">
                    <td className="tbody-td-fun font-normal text-center border-b border-gray-200"></td>

                    <td className="tbody-td-fun min-w-[100px] font-normal text-center border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={newRate.plc || ""}
                        onChange={(e) => {
                          handleNewRateChange("plc", e.target.value);
                          setPlcSearch(e.target.value);
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        list="plc-list"
                      />
                      <datalist id="plc-list">
                        {plcs.map((plc, index) => (
                          <option
                            key={`${plc.laborCategoryCode}-${index}`}
                            value={plc.laborCategoryCode}
                          >
                            {plc.description}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal text-center border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={formatWithCommas(newRate.billRate) || ""}
                        // onChange={(e) =>
                        //   handleNewRateChange("billRate", e.target.value)
                        // }
                        onChange={(e) => {
                          const cleanValue = e.target.value
                            .replace(/[^0-9.-]/g, "")
                            .replace(/(?!^)-/g, "")
                            .replace(/(\..*?)\..*/g, "$1");

                          handleNewRateChange("billRate", cleanValue);
                        }}
                        onBlur={() => {
                          if (newRate.billRate) {
                            const num = parseFloat(
                              newRate.billRate.replace(/,/g, ""),
                            );
                            if (!isNaN(num)) {
                              handleNewRateChange(
                                "billRate",
                                num.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }),
                              );
                            }
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      />
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal text-center border-b border-r border-gray-300">
                      <select
                        value={newRate.rateType}
                        onChange={(e) =>
                          handleNewRateChange("rateType", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      >
                        {rateTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal text-center border-b border-r border-gray-300 ">
                      <input
                        type="date"
                        value={newRate.startDate || ""}
                        onChange={(e) =>
                          handleNewRateChange("startDate", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        // min={selectedPlan.projStartDt}
                        // max={selectedPlan.projEndDt}
                      />
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal text-center border-b border-r border-gray-300 ">
                      <input
                        type="date"
                        value={newRate.endDate || ""}
                        onChange={(e) =>
                          handleNewRateChange("endDate", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        // min={newRate.startDate || selectedPlan.projStartDt}
                        // max={selectedPlan.projEndDt}
                      />
                    </td>
                  </tr>
                )}

                {loadingPLC ? (
                  <tr>
                    <td colSpan={PLC_EMPLOYEE_COLUMNS.length}>
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : billingRatesSchedule.length === 0 && !newRate ? (
                  <tr>
                    <td
                      colSpan="6"
                      // className="px-3 py-4 text-center text-gray-500"
                      className="tbody-td-fun min-w-[100px] font-normal px-3 py-4 text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  billingRatesSchedule.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {isEditable && (
                        <td className="tbody-td-fun font-normal border-b border-r border-gray-300">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={!!selectedRows[item.id]}
                            onChange={() => {
                              setSelectedRows((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }));
                            }}
                          />
                        </td>
                      )}

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-900">
                        {item.plc}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {isEditing ? (
                          <input
                            type="text"
                            // value={editedBillRates[item.id] ?? item.billRate}
                            value={
                              editedBillRates[item.id] !== undefined
                                ? formatWithCommas(editedBillRates[item.id])
                                : formatWithCommas(item.billRate)
                            }
                            // onChange={(e) =>
                            //   setEditedBillRates((prev) => ({
                            //     ...prev,
                            //     [item.id]: e.target.value,
                            //   }))
                            // }
                            onChange={(e) => {
                              // 1. Remove everything except 0-9, dot, and minus
                              // 2. Remove minus signs if they aren't at the start
                              // 3. Prevent multiple decimal points
                              const cleanValue = e.target.value
                                .replace(/[^0-9.-]/g, "")
                                .replace(/(?!^)-/g, "")
                                .replace(/(\..*?)\..*/g, "$1");

                              // setEditedBillRates(item.id, cleanValue);
                              setEditedBillRates((prev) => ({
                                ...prev,
                                [item.id]: cleanValue,
                              }));
                            }}
                            onBlur={() => {
                              const raw =
                                editedBillRates[item.id] ?? item.billRate;
                              const num = parseFloat(raw.replace(/,/g, ""));
                              if (!isNaN(num)) {
                                setEditedBillRates((prev) => ({
                                  ...prev,
                                  [item.id]: num.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }),
                                }));
                              }
                            }}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          />
                        ) : (
                          <span>{formatWithCommas(item.billRate)}</span>
                        )}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-500">
                        {item.rateType === "B" || item.rateType === "Billing"
                          ? "Billing"
                          : item.rateType === "A" || item.rateType === "Actual"
                            ? "Actual"
                            : "-"}
                        {/* {item.rateType} */}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {formatToMMDDYY(item.startDate)}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {formatToMMDDYY(item.endDate) || ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Billing Rates Schedule */}
        {/* <div className="mb-4">
        <h3 className="text-sm font-semibold">Employee Billing Rates Schedule</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-64"> */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">
              Employee Billing Rates Schedule
            </h3>
            <div className="w-1/5 flex justify-end items-center space-x-2">
              {/* ADD BUTTON */}
              {isEditable && (
                <button
                  onClick={handleAddEmployeeRow}
                  className="btn1 btn-blue cursor-pointer "
                  disabled={loading || newEmployeeRate}
                >
                  Add
                </button>
              )}

              {/* NEW RATE SAVE/CANCEL */}
              {newEmployeeRate && isEditable && (
                <>
                  {/* <button
                    onClick={handleSaveNewEmployeeRate}
                    className="btn1 btn-blue cursor-pointer flex items-center gap-1 "
                    disabled={loading}
                    title="Save"
                  >
                    <FaSave className="text-sm" />
                    <span>Save</span>
                  </button> */}
                  <button
                    onClick={() => setNewEmployeeRate(null)}
                    className="btn1 btn-blue cursor-pointer"
                    disabled={loading}
                    title="Cancel"
                  >
                    <FaTimes className="text-sm" />
                    {/* <span>Cancel</span> */}
                  </button>
                </>
              )}

              {/* EDIT/CANCEL BUTTON */}
              {!newEmployeeRate && isEditable && (
                <>
                  <button
                    onClick={() =>
                      isEmployeeEditing
                        ? cancelEmployeeEditing()
                        : setIsEmployeeEditing(true)
                    }
                    className={`btn1 btn-blue cursor-pointer `}
                    disabled={loading || employeeBillingRates.length === 0}
                    title={
                      isEmployeeEditing ? "Cancel Editing" : "Edit Bill Rates"
                    }
                  >
                    {isEmployeeEditing ? (
                      <>
                        <FaTimes className="text-sm" />
                        {/* <span>Cancel</span> */}
                      </>
                    ) : (
                      <>
                        <FaEdit className="text-sm" />
                        {/* <span>Edit</span> */}
                      </>
                    )}
                  </button>

                  {/* SAVE BUTTON (only visible in edit mode) */}
                  {/* {isEmployeeEditing && (
                    <button
                      onClick={handleUpdateAllEmployeeChanges} // implement as needed
                      className="btn1 btn-blue cursor-pointer flex items-center gap-1"
                      disabled={loading}
                      title="Save Changes"
                    >
                      <FaSave className="text-sm" />
                      <span>Save</span>
                    </button>
                  )} */}
                </>
              )}

              {/* DELETE SELECTED (always visible) */}
              {/* {isEditable && (
                <button
                  onClick={handleDeleteEmployee} // implement as needed
                  className="btn1 btn-blue cursor-pointer btn-red"
                  disabled={
                    loading ||
                    !Object.values(selectedEmployeeRows).some(Boolean)
                  }
                  title="Delete Selected"
                >
                  <FaTrash className="text-sm" />
                  <span>Delete</span>
                </button>
              )} */}
            </div>
          </div>

          <div className="overflow-x-auto  overflow-y-auto max-h-64 rounded-sm  border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-100">
                <tr>
                  {isEditable && (
                    <th className="th-thead border-b border-r border-gray-300 w-10">
                      {isEditable && (
                        <input
                          type="checkbox"
                          className="w-3 h-3"
                          checked={
                            employeeBillingRates.length > 0 &&
                            Object.values(selectedEmployeeRows).length ===
                              employeeBillingRates.length &&
                            Object.values(selectedEmployeeRows).every(Boolean)
                          }
                          onChange={() => {
                            if (
                              employeeBillingRates.length > 0 &&
                              Object.values(selectedEmployeeRows).length ===
                                employeeBillingRates.length &&
                              Object.values(selectedEmployeeRows).every(Boolean)
                            ) {
                              setSelectedEmployeeRows({});
                            } else {
                              const allSelected = {};
                              employeeBillingRates.forEach((item) => {
                                allSelected[item.id] = true;
                              });
                              setSelectedEmployeeRows(allSelected);
                            }
                          }}
                        />
                      )}
                    </th>
                  )}

                  <th className="th-thead border-b border-r border-gray-300">
                    Employee
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    Employee Name
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    PLC
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    PLC Description
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    Bill Rate
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    Rate Type
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    Start Date
                  </th>
                  <th className="th-thead border-b border-r border-gray-300">
                    End Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {newEmployeeRate && (
                  <tr className="bg-white">
                    <td className="tbody-td-fun font-normal border-b border-r border-gray-300"></td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={newEmployeeRate.empId || ""}
                        onChange={(e) =>
                          handleNewEmployeeRateChange("empId", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        list="employee-list"
                        disabled={employees.length === 0}
                      />
                      <datalist id="employee-list">
                        {employees.map((emp, index) => (
                          <option
                            key={`${emp.empId}-${index}`}
                            value={emp.empId}
                          >
                            {emp.employeeName}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      {newEmployeeRate.employeeName || ""}
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={newEmployeeRate.plc || ""}
                        onChange={(e) => {
                          handleNewEmployeeRateChange("plc", e.target.value);
                          setPlcSearch(e.target.value);
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        list="plc-list"
                      />
                      <datalist id="plc-list">
                        {plcs.map((plc) => (
                          <option
                            key={plc.laborCategoryCode}
                            value={plc.laborCategoryCode}
                          >
                            {plc.description}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      {plcs.find(
                        (plc) => plc.laborCategoryCode === newEmployeeRate.plc,
                      )?.description || ""}
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={formatWithCommas(newEmployeeRate.billRate) || ""}
                        // onChange={(e) => {
                        //   const val = e.target.value;
                        //   if (/^[0-9,]*\.?[0-9]*$/.test(val) || val === "") {
                        //     handleNewEmployeeRateChange("billRate", val);
                        //   }
                        // }}
                        onChange={(e) => {
                          const cleanValue = e.target.value
                            .replace(/[^0-9.-]/g, "")
                            .replace(/(?!^)-/g, "")
                            .replace(/(\..*?)\..*/g, "$1");

                          handleNewEmployeeRateChange("billRate", cleanValue);
                        }}
                        onBlur={() => {
                          const raw = newEmployeeRate.billRate;
                          const num = parseFloat((raw || "").replace(/,/g, ""));
                          if (!isNaN(num)) {
                            handleNewEmployeeRateChange(
                              "billRate",
                              num.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }),
                            );
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      />
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <select
                        value={newEmployeeRate.rateType}
                        onChange={(e) =>
                          handleNewEmployeeRateChange(
                            "rateType",
                            e.target.value,
                          )
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                      >
                        {rateTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="date"
                        value={newEmployeeRate.startDate || ""}
                        onChange={(e) =>
                          handleNewEmployeeRateChange(
                            "startDate",
                            e.target.value,
                          )
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        // min={selectedPlan.projStartDt}
                        // max={selectedPlan.projEndDt}
                      />
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="date"
                        value={newEmployeeRate.endDate || ""}
                        onChange={(e) =>
                          handleNewEmployeeRateChange("endDate", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                        // min={
                        //   newEmployeeRate.startDate || selectedPlan.projStartDt
                        // }
                        // max={selectedPlan.projEndDt}
                      />
                    </td>
                  </tr>
                )}

                {loadingEmployee ? (
                  <tr>
                    <td colSpan={PLC_EMPLOYEE_COLUMNS.length}>
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : employeeBillingRates.length === 0 && !newEmployeeRate ? (
                  <tr>
                    <td
                      colSpan="9"
                      // className="px-3 py-4 text-center text-gray-500"
                      className="tbody-td-fun min-w-[100px] font-normal px-3 py-4 text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  employeeBillingRates.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {isEditable && (
                        <td className="tbody-td-fun font-normal border-b border-r border-gray-300">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={!!selectedEmployeeRows[item.id]}
                            onChange={() => {
                              setSelectedEmployeeRows((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }));
                            }}
                          />
                        </td>
                      )}

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.empId}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.employeeName}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.plc}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {plcs.find((plc) => plc.laborCategoryCode === item.plc)
                          ?.description || item.plcDescription}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {isEmployeeEditing ? (
                          <input
                            type="text"
                            // value={
                            //   editEmployeeBillRate[item.id] ?? item.billRate
                            // }
                            value={
                              editEmployeeBillRate[item.id] !== undefined
                                ? formatWithCommas(
                                    editEmployeeBillRate[item.id],
                                  )
                                : formatWithCommas(item.billRate)
                            }
                            // onChange={(e) => {
                            //   const val = e.target.value;
                            //   if (
                            //     /^[0-9,]*\.?[0-9]*$/.test(val) ||
                            //     val === ""
                            //   ) {
                            //     handleEmployeeBillRateChange(item.id, val);
                            //   }
                            // }}
                            onChange={(e) => {
                              // 1. Remove everything except 0-9, dot, and minus
                              // 2. Remove minus signs if they aren't at the start
                              // 3. Prevent multiple decimal points
                              const cleanValue = e.target.value
                                .replace(/[^0-9.-]/g, "")
                                .replace(/(?!^)-/g, "")
                                .replace(/(\..*?)\..*/g, "$1");

                              handleEmployeeBillRateChange(item.id, cleanValue);
                            }}
                            onBlur={() => {
                              const raw =
                                editEmployeeBillRate[item.id] ?? item.billRate;
                              const num = parseFloat(
                                (raw || "").replace(/,/g, ""),
                              );
                              if (!isNaN(num)) {
                                handleEmployeeBillRateChange(
                                  item.id,
                                  num.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }),
                                );
                              }
                            }}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                          />
                        ) : (
                          <span>{formatWithCommas(item.billRate)}</span>
                        )}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-500">
                        {item.rateType}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {formatToMMDDYY(item.startDate)}
                      </td>

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {formatToMMDDYY(item.endDate) || ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vendor Billing Rates Schedule */}
        {/* <div className="mb-4">
        <h3 className="text-sm font-semibold">Vendor Billing Rates Schedule</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-64"> */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">
              Vendor Billing Rates Schedule
            </h3>
            <div className="w-1/5 flex justify-end items-center space-x-2">
              {isEditable && (
                <button
                  onClick={handleAddVendorRow}
                  className="btn1 btn-blue cursor-pointer "
                  disabled={loading || newVendorRate}
                >
                  Add
                </button>
              )}
              {newVendorRate && isEditable && (
                <>
                  {/* <button
                    onClick={handleSaveNewVendorRate}
                    className="btn1 btn-blue cursor-pointer flex items-center gap-1 "
                    disabled={loading}
                    title="Save"
                  >
                    <FaSave className="text-sm" />
                    <span>Save</span>
                  </button> */}
                  <button
                    onClick={() => setNewVendorRate(null)}
                    className="btn1 btn-blue cursor-pointer "
                    disabled={loading}
                    title="Cancel"
                  >
                    <FaTimes className="text-sm" />
                    {/* <span>Cancel</span> */}
                  </button>
                </>
              )}
              {!newVendorRate && isEditable && (
                <>
                  <button
                    onClick={() =>
                      isVendorEditing
                        ? cancelVendorEditing()
                        : setIsVendorEditing(true)
                    }
                    className={`btn1 btn-blue cursor-pointer `}
                    disabled={loading || vendorBillingRates.length === 0}
                    title={
                      isVendorEditing ? "Cancel Editing" : "Edit Bill Rates"
                    }
                  >
                    {isVendorEditing ? (
                      <>
                        <FaTimes className="text-sm" />
                        {/* <span>Cancel</span> */}
                      </>
                    ) : (
                      <>
                        <FaEdit className="text-sm " />
                        {/* <span>Edit</span> */}
                      </>
                    )}
                  </button>
                  {/* {isVendorEditing && (
                    <button
                      onClick={handleUpdateAllVendors} // implement as needed
                      className="btn1 btn-blue cursor-pointer flex items-center gap-1"
                      disabled={loading}
                      title="Save Changes"
                    >
                      <FaSave className="text-sm" />
                      <span>Save</span>
                    </button>
                  )} */}
                </>
              )}
              {/* {isEditable && (
                <button
                  onClick={handleDeleteSelectedVendors} // implement as needed
                  className="btn1 btn-blue cursor-pointer btn-red"
                  disabled={
                    loading || !Object.values(selectedVendorRows).some(Boolean)
                  }
                  title="Delete Selected"
                >
                  <FaTrash className="text-sm" />
                  <span>Delete</span>
                </button>
              )} */}
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-64 rounded-sm border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  {isEditable && (
                    <th className="th-thead text-gray-500 border-b border-r border-gray-300 w-10">
                      <input
                        type="checkbox"
                        className="w-3 h-3"
                        checked={
                          vendorBillingRates.length > 0 &&
                          vendorBillingRates.every(
                            (item) => selectedVendorRows[item.id],
                          )
                        }
                        onChange={() => {
                          if (
                            vendorBillingRates.length > 0 &&
                            vendorBillingRates.every(
                              (item) => selectedVendorRows[item.id],
                            )
                          ) {
                            setSelectedVendorRows({});
                          } else {
                            const allSelected = {};
                            vendorBillingRates.forEach((item) => {
                              allSelected[item.id] = true;
                            });
                            setSelectedVendorRows(allSelected);
                          }
                        }}
                      />
                    </th>
                  )}

                  <th className="th-thead">Vendor</th>
                  <th className="th-thead">Vendor Name</th>
                  <th className="th-thead">Vendor Employee ID</th>
                  <th className="th-thead">Vendor Employee Name</th>
                  <th className="th-thead">PLC</th>
                  <th className="th-thead">PLC Description</th>
                  <th className="th-thead">Bill Rate</th>
                  <th className="th-thead">Rate Type</th>
                  <th className="th-thead">Start Date</th>
                  <th className="th-thead">End Date</th>
                </tr>
              </thead>

              <tbody>
                {newVendorRate && (
                  <tr className="bg-white">
                    {isEditable && (
                      <td className="tbody-td-fun  font-normal border-b border-r border-gray-300"></td>
                    )}

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={newVendorRate.vendorId || ""}
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          const [vId, empName] = rawValue.split(" - ");

                          const selectedVend = vendorEmployees.find(
                            (v) =>
                              v.vendId === vId && v.employeeName === empName,
                          );
                          setNewVendorRate((prev) => ({
                            ...prev,
                            vendorId: vId,
                            vendorName: selectedVend
                              ? selectedVend.employeeName
                              : prev.vendorName,
                            vendorEmployee: selectedVend
                              ? selectedVend.empId
                              : prev.vendorEmployee,
                            vendorEmployeeName: selectedVend
                              ? selectedVend.employeeName
                              : prev.vendorEmployeeName,
                          }));
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                        list="vendor-list"
                      />
                      <datalist id="vendor-list">
                        {vendorEmployees.map((v, index) => (
                          <option
                            key={`${v.vendId}-${v.empId}-${index}`}
                            value={`${v.vendId} - ${v.employeeName}`}
                          >
                            {v.employeeName}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-900">
                      {newVendorRate.vendorName || ""}
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-900">
                      {newVendorRate.vendorEmployee || ""}
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-900">
                      {newVendorRate.vendorEmployeeName || ""}
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={newVendorRate.plc || ""}
                        onChange={(e) => {
                          handleNewVendorRateChange("plc", e.target.value);
                          setPlcSearch(e.target.value);
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                        list="plc-list"
                      />
                      <datalist id="plc-list">
                        {plcs.map((plc, index) => (
                          <option
                            key={`${plc.laborCategoryCode}-${index}`}
                            value={plc.laborCategoryCode}
                          >
                            {plc.description}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      {plcs.find(
                        (plc) => plc.laborCategoryCode === newVendorRate.plc,
                      )?.description || ""}
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="text"
                        value={formatWithCommas(newVendorRate.billRate) || ""}
                        // onChange={(e) => {
                        //   const val = e.target.value;
                        //   if (/^[0-9,]*\.?[0-9]*$/.test(val) || val === "") {
                        //     handleNewVendorRateChange("billRate", val);
                        //   }
                        // }}
                        onChange={(e) => {
                          const cleanValue = e.target.value
                            .replace(/[^0-9.-]/g, "")
                            .replace(/(?!^)-/g, "")
                            .replace(/(\..*?)\..*/g, "$1");

                          handleNewVendorRateChange("billRate", cleanValue);
                        }}
                        onBlur={() => {
                          if (newVendorRate.billRate) {
                            const num = parseFloat(
                              newVendorRate.billRate.replace(/,/g, ""),
                            );
                            if (!isNaN(num) && num > 0) {
                              handleNewVendorRateChange(
                                "billRate",
                                num.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }),
                              );
                            }
                          }
                        }}
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                      />
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <select
                        value={newVendorRate.rateType}
                        onChange={(e) =>
                          handleNewVendorRateChange("rateType", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                      >
                        {rateTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="date"
                        value={newVendorRate.startDate || ""}
                        onChange={(e) =>
                          handleNewVendorRateChange("startDate", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                        // min={selectedPlan.projStartDt}
                        // max={selectedPlan.projEndDt}
                      />
                    </td>

                    <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                      <input
                        type="date"
                        value={newVendorRate.endDate || ""}
                        onChange={(e) =>
                          handleNewVendorRateChange("endDate", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                        // min={newVendorRate.startDate || selectedPlan.projStartDt}
                        // max={selectedPlan.projEndDt}
                      />
                    </td>
                  </tr>
                )}

                {loadingVendor ? (
                  <tr>
                    <td colSpan={PLC_VENDOR_COLUMNS.length}>
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : vendorBillingRates.length === 0 && !newVendorRate ? (
                  <tr>
                    <td
                      colSpan="11"
                      //  className="px-3 py-4 text-center text-gray-500"
                      className="tbody-td-fun min-w-[100px] font-normal px-3 py-4 text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  vendorBillingRates.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {isEditable && (
                        <td className="tbody-td-fun font-normal border-b border-r border-gray-300">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={!!selectedVendorRows[item.id]}
                            onChange={() =>
                              setSelectedVendorRows((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                          />
                        </td>
                      )}

                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-900">
                        {item.vendorId}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.vendorName}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.vendorEmployee}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.vendorEmployeeName}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {item.plc}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {plcs.find((plc) => plc.laborCategoryCode === item.plc)
                          ?.description || item.plcDescription}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {/* {isVendorEditing ? (
                          <input
                            type="text"
                            value={editVendorBillRate[item.id] ?? item.billRate}
                            onChange={(e) =>
                              handleVendorBillRateChange(
                                item.id,
                                e.target.value,
                              )
                            }
                            
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                          />
                        ) : (
                          // <span>{item.billRate === 'B' ? 'Billing' : item.}</span>
                          <span>{formatWithCommas(item.billRate)}</span>
                        )} */}
                        {isVendorEditing ? (
                          <input
                            type="text"
                            // Use the raw value from state for editing, format for display
                            value={
                              editVendorBillRate[item.id] !== undefined
                                ? formatWithCommas(editVendorBillRate[item.id])
                                : formatWithCommas(item.billRate)
                            }
                            onChange={(e) => {
                              // 1. Remove everything except 0-9, dot, and minus
                              // 2. Remove minus signs if they aren't at the start
                              // 3. Prevent multiple decimal points
                              const cleanValue = e.target.value
                                .replace(/[^0-9.-]/g, "")
                                .replace(/(?!^)-/g, "")
                                .replace(/(\..*?)\..*/g, "$1");

                              handleVendorBillRateChange(item.id, cleanValue);
                            }}
                            className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-gray-900"
                          />
                        ) : (
                          <span>{formatWithCommas(item.billRate)}</span>
                        )}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300 text-gray-500">
                        {item.rateType === "B" || item.rateType === "Billing"
                          ? "Billing"
                          : item.rateType === "A" || item.rateType === "Actual"
                            ? "Actual"
                            : "-"}

                        {/* {item.rateType} */}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {formatToMMDDYY(item.startDate)}
                      </td>
                      <td className="tbody-td-fun min-w-[100px] font-normal border-b border-r border-gray-300">
                        {formatToMMDDYY(item.endDate) || ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
);

export default PLCComponent;
