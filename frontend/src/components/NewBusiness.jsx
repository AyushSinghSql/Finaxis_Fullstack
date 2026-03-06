import React, { useState, useEffect } from "react";
import Select from "react-select";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { backendUrl } from "./config";
import { CircleArrowLeft } from "lucide-react";

// Reusable FormField component for consistent layout
const FormField = ({ label, children }) => (
  <div className="label-input-div">
    <label className="input-label">{label}:</label>
    <div className="flex-1 ml-1">{children}</div>
  </div>
);

// Component to display all existing business data in a table
// const SavedBusinessTableDisplay = ({
//   allBusinessBudgets,
//   onNewBusiness,
//   onEditClick,
//   onDeleteClick,
//   onBackToSearch,
// }) => {
//   if (!allBusinessBudgets || allBusinessBudgets.length === 0) {
//     return (
//       <div className="bg-white rounded shadow p-4 text-center">
//         <p className="text-gray-600 mb-4">
//           No business budget data available to display.
//         </p>
//       </div>
//     );
//   }

//   // Define table headers and their corresponding keys in the data object
//   const headers = [
//     { label: "Budget ID", key: "businessBudgetId" },
//     { label: "Description", key: "description" },
//     { label: "Level", key: "level" },
//     { label: "Active", key: "isActive" },
//     { label: "Version", key: "version" },
//     { label: "Version Code", key: "versionCode" },
//     { label: "Winning Probability %", key: "winningProbability" },
//     { label: "Start Date", key: "startDate" },
//     { label: "End Date", key: "endDate" },
//     { label: "Escalation Rate", key: "escalationRate" },
//     { label: "Org ID", key: "orgId" },
//     { label: "Account Group", key: "accountGroup" },
//     { label: "Burden Template ID", key: "burdenTemplateId" },
//     { label: "Actions", key: "actions" }, // For Edit/Delete buttons
//   ];

//   // Helper function to format display values
//   const formatValue = (key, value) => {
//     if (key === "isActive") {
//       return value ? "Yes" : "No";
//     }
//     if (key === "startDate" || key === "endDate") {
//       // FIX: Explicitly check for the "0001-01-01T00:00:00" string or falsy values
//       if (!value || value === "0001-01-01T00:00:00") {
//         return "N/A";
//       }
//       const date = new Date(value);
//       // Fallback for any other invalid date that might slip through
//       if (isNaN(date.getTime())) {
//         return "N/A";
//       }
//       return date.toLocaleDateString();
//     }
//     // Specific check for Winning Probability %: ensure 0 is displayed as "0"
//     if (key === "winningProbability" && (value === 0 || value === "0")) {
//       return "0";
//     }
//     // For any other value, display it as string, otherwise "N/A"
//     return value !== null && value !== undefined && value !== ""
//       ? String(value)
//       : "N/A";
//   };

//   // FIX: Custom sort function for businessBudgetId (e.g., Test.1, Test.10, Test.2)
//   const sortBudgets = (a, b) => {
//     const idA = a.businessBudgetId;
//     const idB = b.businessBudgetId;

//     // Handle cases like "Test.1" vs "Test.10" correctly
//     const partsA = idA.split(".");
//     const partsB = idB.split(".");

//     const prefixA = partsA[0];
//     const prefixB = partsB[0];

//     const numA = parseInt(partsA[1], 10);
//     const numB = parseInt(partsB[1], 10);

//     // First, sort by the text prefix
//     if (prefixA < prefixB) return -1;
//     if (prefixA > prefixB) return 1;

//     // If prefixes are the same, sort by the numeric part
//     return numA - numB;
//   };

//   const sortedBudgets = [...allBusinessBudgets].sort(sortBudgets);

//   return (
//     <div className="p-2 sm:p-4 space-y-6 text-[11px] sm:text-xs text-gray-800 font-sans max-w-4xl mx-auto">
//       <div className="bg-white rounded shadow p-2 sm:p-4 mb-4 relative">
//         <h2 className="text-xs sm:text-sm font-normal mb-3 font-sans">
//           Business Budget Details
//         </h2>

//         <div className="overflow-x-auto mt-4">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 {headers.map((header) => (
//                   <th
//                     key={header.key}
//                     scope="col"
//                     className="px-2 py-2 text-left text-[11px] sm:text-xs font-normal text-gray-700 font-sans"
//                   >
//                     {header.label}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {sortedBudgets.map((budget) => (
//                 <tr key={budget.businessBudgetId}>
//                   {headers.map((header) => (
//                     <td
//                       key={header.key}
//                       className="px-2 py-2 whitespace-nowrap text-[11px] sm:text-xs font-normal text-gray-900 font-sans"
//                     >
//                       {header.key === "actions" ? (
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => {
//                               // console.log("Edit button clicked for budget:", budget);
//                               onEditClick(budget);
//                             }}
//                             className="bg-green-600 text-white px-2 py-1 rounded text-[10px] hover:bg-green-700 transition"
//                           >
//                             Edit
//                           </button>
//                           <button
//                             onClick={() =>
//                               onDeleteClick(budget.businessBudgetId)
//                             }
//                             className="bg-red-600 text-white px-2 py-1 rounded text-[10px] hover:bg-red-700 transition"
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       ) : (
//                         <div>{formatValue(header.key, budget[header.key])}</div>
//                       )}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// Component to display all existing project plans data in a table

const SavedBusinessTableDisplay = ({
  allBusinessBudgets,
  onNewBusiness,
  onEditClick,
  onDeleteClick,
  onBackToSearch,
}) => {
  if (!allBusinessBudgets || allBusinessBudgets.length === 0) {
    return (
      <div className="bg-white rounded p-4 text-center">
        <p className="text-gray-600 mb-4">
          No project plan data available to display.
        </p>
      </div>
    );
  }

  // Define table headers matching the second image structure
  const headers = [
    { label: "Export", key: "export" },
    { label: "Project ID", key: "projId" },
    { label: "Project Name", key: "projectName" },
    { label: "BUD/EAC", key: "plType" },
    { label: "Revision", key: "version" },
    { label: "Version Type", key: "versionCode" },
    { label: "Origin", key: "origin" },
    { label: "Submitted", key: "isCompleted" },
    { label: "Approved", key: "isApproved" },
    { label: "Concluded", key: "concluded" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" }, // For Edit/Delete buttons
  ];

  // Helper function to format display values
  const formatValue = (key, value) => {
    if (key === "isCompleted" || key === "isApproved" || key === "concluded") {
      // These appear to be checkboxes in the image
      return (
        <input
          type="checkbox"
          checked={value || false}
          readOnly
          className="accent-blue-600"
          style={{ width: 14, height: 14 }}
        />
      );
    }
    if (key === "export") {
      // Excel export icon
      return (
        <div className="flex justify-center">
          <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">XAyush</span>
          </div>
        </div>
      );
    }
    if (key === "origin") {
      // Display as number, defaulting to 0 if not present
      return String(value || "0");
    }
    // For any other value, display it as string, otherwise empty
    return value !== null && value !== undefined && value !== ""
      ? String(value)
      : "";
  };

  // FIX: Updated sort function for project plans data
  const sortPlans = (a, b) => {
    // Use projId instead of businessBudgetId and handle undefined values
    const idA = a.projId || "";
    const idB = b.projId || "";

    // Basic string comparison for project IDs
    return idA.localeCompare(idB);
  };

  const sortedPlans = [...allBusinessBudgets].sort(sortPlans);

  return (
    <div className="p-2 sm:p-4 space-y-6 text-[11px] sm:text-xs text-gray-800 font-sans max-w-full mx-auto">
      <div className="bg-white rounded  p-2 sm:p-4 mb-4 relative">
        <h2 className="text-xs sm:text-sm font-normal mb-3 font-sans">
          Project Plans
        </h2>

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    scope="col"
                    className="px-2 py-2 text-left text-[11px] sm:text-xs font-normal text-gray-700 font-sans"
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPlans.map((plan, index) => (
                <tr key={plan.plId || index}>
                  {headers.map((header) => (
                    <td
                      key={header.key}
                      className="px-2 py-2 whitespace-nowrap text-[11px] sm:text-xs font-normal text-gray-900 font-sans"
                    >
                      {header.key === "actions" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onEditClick(plan);
                            }}
                            className="bg-green-600 text-white px-3 py-2 rounded text-[10px] hover:bg-green-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteClick(plan.projId)}
                            className="bg-red-600 text-white px-3 py-2 rounded text-[10px] hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div>{formatValue(header.key, plan[header.key])}</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NewBusiness = ({ mode, selectedBusiness, onClose, onSaveSuccess }) => {
  const [form, setForm] = useState({
    businessBudgetId: "",
    description: "",
    level: "",
    active: false, // Matches isActive from API
    version: "",
    versionCode: "",
    winningProbability: "",
    contractValue: "",
    contractTypes: "",
    startDate: "",
    endDate: "",
    period: "Q1 2024", // Read-only
    weeks: "12", // Read-only
    escalationRate: "",
    orgId: "",
    accountGrp: "", // Matches accountGroup from API
    burdenTemplateId: "",
    pgoCalculation: "",
    pwinValue: "",
    type: "",
    ourRole: "",
    stage: "",
    customer: "",
    workshare: "",
    trf_ProjId: "",
    status: "",
  });
  const [viewMode, setViewMode] = useState("form"); // Always start with form view
  const [allBusinessBudgets, setAllBusinessBudgets] = useState([]); // To store all budgets for the table
  const [burdenTemplates, setBurdenTemplates] = useState([]);
  const [isUpdateMode, setIsUpdateMode] = useState(Boolean(selectedBusiness)); // New state to manage update mode
  const [isSaving, setIsSaving] = useState(false); // State to track if saving is in progress
  // Add these to your state declarations inside NewBusiness component
  const [orgOptions, setOrgOptions] = useState([]);
  const [accountGroupOptions, setAccountGroupOptions] = useState([]);
  const [searchTermOrg, setSearchTermOrg] = useState("");
  const [searchTermAcc, setSearchTermAcc] = useState("");
  const [searchTermBurden, setSearchTermBurden] = useState("");
  const [focusOrg, setFocusOrg] = useState(false);
  const [focusAcc, setFocusAcc] = useState(false);
  const [focusBurden, setFocusBurden] = useState(false);

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [orgRes, accRes] = await Promise.all([
          axios.get(`${backendUrl}/Orgnization/GetAllOrgs`),
          axios.get(`${backendUrl}/Project/GetAccountGroupCodes`),
        ]);
        setOrgOptions(orgRes.data || []);
        setAccountGroupOptions(accRes.data || []);
      } catch (error) {
        console.error("Error fetching lookup data", error);
      }
    };
    fetchLookupData();
  }, []);

  const getOrgDetail = () => {
    const data = orgOptions.find(
      (opt) => String(opt.orgId) === String(form.orgId),
    );
    if (data) return `${data.orgId} - ${data.orgName}`;
  };

  useEffect(() => {
    if (!selectedBusiness) return;
    setForm({
      businessBudgetId: selectedBusiness.businessBudgetId || "",
      description: selectedBusiness.description || "",
      level: selectedBusiness.level || "",
      active: selectedBusiness.isActive || false,
      version: selectedBusiness.version || "",
      versionCode: selectedBusiness.versionCode || "",
      winningProbability: "",
      contractValue: selectedBusiness.contractValue || "",
      contractTypes: selectedBusiness.contractType || "",
      startDate: selectedBusiness.startDate
        ? selectedBusiness.startDate.split("T")[0]
        : "",
      endDate: selectedBusiness.endDate
        ? selectedBusiness.endDate.split("T")[0]
        : "",
      period: "Q1 2024",
      weeks: "12",
      escalationRate: selectedBusiness.escalationRate || "",
      orgId: selectedBusiness.orgId || "",
      accountGrp: selectedBusiness.accountGroup || "",
      burdenTemplateId: selectedBusiness.burdenTemplateId || "",
      pgoCalculation: selectedBusiness.pgoCalculation || "",
      pwinValue: selectedBusiness.pwinValue || "",
      type: selectedBusiness.type || "",
      ourRole: selectedBusiness.ourRole || "",
      stage: selectedBusiness.stage || "",
      customer: selectedBusiness.customer || "",
      workshare: selectedBusiness.ourWorkshare || "",
    });
  }, [selectedBusiness]);

  // Fetch burden templates on component mount
  useEffect(() => {
    const fetchBurdenTemplates = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`,
        );
        if (response.data && Array.isArray(response.data)) {
          setBurdenTemplates(response.data);
        } else {
          toast.error(
            "Failed to fetch burden templates: Unexpected data format.",
          );
          // console.error("Unexpected API response for burden templates:", response.data);
        }
      } catch (error) {
        toast.error(`Error fetching burden templates: ${error.message}`);
        // console.error("Error fetching burden templates:", error);
      }
    };
    fetchBurdenTemplates();
  }, []); // Empty dependency array means this runs once on mount

  // Add this function after the useEffect hooks
  const fetchAllBusinessBudgets = async () => {
    try {
      const response = await axios.get(`${backendUrl}/Project/GetProjectPlans`);
      if (response.data && Array.isArray(response.data)) {
        setAllBusinessBudgets(response.data);
      } else {
        // Handle case where response.data might be an object with a data property
        setAllBusinessBudgets(response.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching all business budgets:", error);
      toast.error("Failed to fetch business budgets");
      setAllBusinessBudgets([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Level: allowed range 1–14
    if (name === "level") {
      if (value === "") {
        // allow clearing input
      } else {
        const num = Number(value);
        if (!Number.isInteger(num) || num < 1 || num > 14) {
          toast.error("Level must be between 1 and 14", { autoClose: 2000 });
          return;
        }
      }
    }

    // Version: allowed range 1–999
    if (name === "version") {
      if (value === "") {
        // allow clearing input
      } else {
        const num = Number(value);
        if (!Number.isInteger(num) || num < 1 || num > 999) {
          toast.error("Version must be between 1 and 999", { autoClose: 2000 });
          return;
        }
      }
    }

    if (name === "winningProbability" || name === "ourWorkshare") {
      if (value > 100) {
        toast.error("Winning Probability cann't be more than 100", {
          autoClose: 2000,
        });
        return;
      }
    }

    if (name === "startDate" || name === "endDate") {
      // console.log(`handleChange: Input ${name} changed to value: ${value}`);
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // if (
    //   !form.businessBudgetId ||
    //   !form.description ||
    //   !form.startDate ||
    //   !form.endDate ||
    //   !form.orgId ||
    //   !form.accountGrp ||
    //   !form.burdenTemplateId
    // ) {
    //   toast.error(
    //     "Please fill in all required fields: Business Budget ID, Description, Start Date, End Date, OrgID, Account Group, Burden Template.",
    //   );
    //   setIsSaving(false);
    //   return;
    // }

    // if (form.startDate && form.endDate) {
    //   const startDate = new Date(form.startDate);
    //   const endDate = new Date(form.endDate);

    //   if (endDate < startDate) {
    //     toast.error(
    //       "End Date cannot be earlier than Start Date. Please select a valid date range.",
    //     );
    //     setIsSaving(false);
    //     return;
    //   }
    // }

    // First API call payload for /AddNewBusiness
    const businessPayload = {
      businessBudgetId: form.businessBudgetId,
      description: form.description,
      level: parseInt(form.level) || 0,
      isActive: form.active,
      version: parseInt(form.version) || 0,
      versionCode: form.versionCode,
      winningProbability: parseFloat(form.winningProbability) || 0,
      contractValue: String(form.contractValue || ""),
      contractTypes: String(form.contractTypes || ""),
      startDate: form.startDate
        ? `${form.startDate}T00:00:00`
        : "0001-01-01T00:00:00",
      endDate: form.endDate
        ? `${form.endDate}T00:00:00`
        : "0001-01-01T00:00:00",
      escalationRate: parseFloat(form.escalationRate) || 0,
      orgId: form.orgId || "",
      accountGroup: form.accountGrp,
      burdenTemplateId: parseInt(form.burdenTemplateId) || 0,
      modifiedBy: "admin",
      pgoCalculation: parseFloat(form.pgoCalculation || ""),
      pwinValue: parseFloat(form.pwinValue || ""),
      type: form.type || "",
      ourRole: form.ourRole || "",
      stage: form.stage || "",
      customer: form.customer || "",
      workshare: parseFloat(form.workshare || ""),
      trf_ProjId: form.trf_ProjId || "",
      status: form.status || "",
    };

    // Second API call payload for /Project/AddProjectPlan
    const projectPayload = {
      projId: form.businessBudgetId,
      plId: 0,
      plType: "NBBUD",
      source: "",
      type: "A",
      version: parseInt(form.version) || 0,
      versionCode: form.versionCode || "",
      finalVersion: false,
      isCompleted: false,
      isApproved: false,
      status: "In Progress",
      createdBy: "User",
      modifiedBy: "User",
      approvedBy: "",
      templateId: parseInt(form.burdenTemplateId) || 1,
      projStartDt: form.startDate ? `${form.startDate}` : "0001-01-01",
      projEndDt: form.endDate ? `${form.endDate}` : "2078-01-01",
    };

    try {
      let response;
      let businessResponse;

      if (isUpdateMode) {
        // For update mode
        response = await axios.put(
          `${backendUrl}/UpdateNewBusiness`,
          businessPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        toast.success("Budget details updated successfully!");
      } else {
        // Sequential API calls for new business creation
        // First call: AddNewBusiness
        console.log("Calling /AddNewBusiness with payload:", businessPayload);
        businessResponse = await axios.post(
          `${backendUrl}/AddNewBusiness`,
          businessPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        // Second call: AddProjectPlan (only if first call succeeds)
        response = await axios.post(
          `${backendUrl}/Project/AddProjectPlan`,
          projectPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        // toast.success("Budget details saved successfully!");
      }

      // Reset form and mode for next operation
      setIsUpdateMode(false);
      setForm({
        businessBudgetId: "",
        description: "",
        level: "",
        active: false,
        version: "",
        versionCode: "",
        winningProbability: "",
        contractValue: "",
        contractTypes: "",
        startDate: "",
        endDate: "",
        period: "Q1 2024",
        weeks: "12",
        escalationRate: "",
        orgId: "",
        accountGrp: "",
        burdenTemplateId: "",
        pgoCalculation: "",
        pwinValue: "",
        type: "",
        ourRole: "",
        stage: "",
        customer: "",
        workshare: "",
      });

      // NEW: Call the parent's callback function to refresh data
      if (onSaveSuccess && businessResponse && mode === "business") {
        await onSaveSuccess(businessResponse.data); // Pass the saved data to parent
        toast.success("Budget details saved successfully!");
      } else if (onSaveSuccess && response) {
        await onSaveSuccess(response.data);
      }
      setIsUpdateMode(false);
      // REMOVED: Don't fetch data or redirect to table view
      // Just close the modal/component and let user navigate to search manually
      onClose(); // Close the NewBusiness component
    } catch (error) {
      console.error("Error saving/updating form data:", error);
      const errorMessage =
        // error.response?.data?.message ||
        // error.message ||
        "Failed to save/update budget details. ID exits or check all fields.";
      toast.error(`Error: ${errorMessage}`);
      setIsUpdateMode(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (budgetId) => {
    if (
      window.confirm(
        `Are you sure you want to delete Business Budget ID: ${budgetId}? This action cannot be undone.`,
      )
    ) {
      try {
        const response = await axios.delete(
          `${backendUrl}/DeleteNewBusiness/${budgetId}`,
        );

        toast.success(`Business Budget ID ${budgetId} deleted successfully!`);
        // After deletion, return to form view
        setAllBusinessBudgets([]); // Clear table data
        setViewMode("form"); // Go back to form view
      } catch (error) {
        // console.error("Error deleting business budget:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to delete budget.";
        toast.error(`Error deleting budget: ${errorMessage}`);
      }
    }
  };

  const onEditClick = (budget) => {
    // console.log("NewBusiness.jsx -> onEditClick: Received budget for pre-filling:", budget);
    setForm({
      businessBudgetId: budget.businessBudgetId || "",
      description: budget.description || "",
      level: String(budget.level || ""), // Convert to string
      active: budget.isActive, // Boolean as is
      version: String(budget.version || ""), // Convert to string
      versionCode: budget.versionCode || "",
      winningProbability: String(budget.winningProbability || ""), // Convert to string
      // FIX: Handle "0001-01-01T00:00:00" explicitly for date inputs
      contractValue: String(budget.contractValue || ""),
      contractType: String(budget.contractType || ""),
      startDate:
        budget.startDate === "0001-01-01T00:00:00" || !budget.startDate
          ? "" // Set to empty string for date input if it's the default invalid date
          : new Date(budget.startDate).toISOString().split("T")[0],
      endDate:
        budget.endDate === "0001-01-01T00:00:00" || !budget.endDate
          ? "" // Set to empty string for date input if it's the default invalid date
          : new Date(budget.endDate).toISOString().split("T")[0],
      period: "Q1 2024", // Read-only
      weeks: "12", // Read-only
      escalationRate: String(budget.escalationRate || ""), // Convert to string
      orgId: String(budget.orgId || ""), // Convert to string
      accountGrp: budget.accountGroup || "", // String as is
      burdenTemplateId: String(budget.burdenTemplateId || ""), // Convert to string
      pgoCalculation: String(budget.pgoCalculation || ""),
      pwinValue: String(budget.pwinValue || ""),
      type: String(budget.type || ""),
      ourRole: String(budget.ourRole || ""),
      stage: String(budget.stage || ""),
      customer: String(budget.customer || ""),
      ourWorkshare: String(budget.ourWorkshare || ""),
    });
    setIsUpdateMode(true);
    setViewMode("form"); // Go to form view
  };

  const handleNewBusinessClick = () => {
    setViewMode("form"); // Show the form for a new entry
    setIsUpdateMode(false); // Ensure it's in add mode
    setForm({
      // Reset form to blank
      businessBudgetId: "",
      description: "",
      level: "",
      active: false,
      version: "",
      versionCode: "",
      winningProbability: "",
      contractValue: "",
      contractType: "",
      startDate: "",
      endDate: "",
      period: "Q1 2024",
      weeks: "12",
      escalationRate: "",
      orgId: "",
      accountGrp: "",
      burdenTemplateId: "",
      pgoCalculation: "",
      pwinValue: "",
      type: "",
      ourRole: "",
      stage: "",
      customer: "",
      ourWorkshare: "",
    });
  };

  const handleBackToForm = () => {
    setAllBusinessBudgets([]); // Clear displayed table data
    setViewMode("form"); // Go back to the form screen
    // Also reset the form in case it was pre-filled before going to table
    setForm({
      businessBudgetId: "",
      description: "",
      level: "",
      active: false,
      version: "",
      versionCode: "",
      winningProbability: "",
      contractValue: "",
      contractType: "",
      startDate: "",
      endDate: "",
      period: "Q1 2024",
      weeks: "12",
      escalationRate: "",
      orgId: "",
      accountGrp: "",
      burdenTemplateId: "",
      pgoCalculation: "",
      pwinValue: "",
      type: "",
      ourRole: "",
      stage: "",
      customer: "",
      ourWorkshare: "",
    });
    setIsUpdateMode(false);
  };

  // return (
  //   <div className="p-2 sm:p-4 space-y-6 text-[14px] sm:text-xs overflow-y-auto min-h-[500px] max-h-[500px] text-gray-800 font-sans mx-auto">
  //     {viewMode === "form" && (
  //       <form className="bg-white rounded-lg mb-4 mt-4">
  //         {/* Header */}
  //         <div className="flex justify-between items-center mb-4">
  //           <h2 className="text-[16px] font-medium text-gray-700">
  //             {isUpdateMode ? "Update Business Budget" : "New Business Budget"}
  //           </h2>

  //           <div className="flex items-center gap-2">
  //             <button
  //               type="button"
  //               onClick={handleSave}
  //               className="bg-[#17414d] btn1 btn-blue disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
  //             >
  //               {isUpdateMode ? "Update" : "Save"}
  //             </button>

  //             <button
  //               type="button"
  //               onClick={onClose}
  //               className="cursor-pointer bg-red-500 rounded text-white w-6 h-6 flex items-center justify-center text-lg font-bold transition"
  //               title="Close"
  //             >
  //               ×
  //             </button>
  //           </div>
  //         </div>

  //         {/* Budget ID */}

  //         {/* Form Grid */}
  //         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 ">
  //           {/* Left column */}
  //           <div className="space-y-3">
  //             <div className="flex items-center gap-2 mb-4">
  //               <label className="whitespace-nowrap text-gray-600">
  //                 Business Budget ID:
  //               </label>
  //               <input
  //                 name="businessBudgetId"
  //                 value={form.businessBudgetId}
  //                 onChange={handleChange}
  //                 readOnly={isUpdateMode}
  //                 className="border border-gray-300 rounded px-2 ml-3.5 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
  //                 type="text"
  //               />
  //             </div>
  //             {[
  //               ["Description", "description", "text"],
  //               ["Level", "level", "number"],
  //               ["Version", "version", "number"],
  //               ["Version Code", "versionCode", "text"],
  //               ["Contract Value", "contractValue", "number"],
  //               ["Contract Type", "contractType", "text"],
  //               ["Winning Probability %", "winningProbability", "number"],
  //               ["PGO Calculation", "pgoCalculation", "number"],
  //               ["Pwin Value", "pwinValue", "number"],
  //               ["Type", "type", "text"],
  //             ].map(([label, name, type]) => (
  //               <FormField key={name} label={label}>
  //                 <input
  //                   name={name}
  //                   value={form[name]}
  //                   onChange={handleChange}
  //                   type={type}
  //                   className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //                   //                   onKeyDown={(e) => {
  //                   //   if (type === "number" && (e.key === "-" || e.key === "e")) {
  //                   //     e.preventDefault();
  //                   //   }
  //                   // }}
  //                 />
  //               </FormField>
  //             ))}

  //             <FormField label="Active">
  //               <input
  //                 name="active"
  //                 checked={form.active}
  //                 onChange={handleChange}
  //                 type="checkbox"
  //                 className="accent-blue-600"
  //               />
  //             </FormField>
  //           </div>

  //           {/* Right column */}
  //           <div className="space-y-3">
  //             <FormField label="Start Date">
  //               <input
  //                 name="startDate"
  //                 value={form.startDate}
  //                 onChange={handleChange}
  //                 type="date"
  //                 className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //               />
  //             </FormField>

  //             <FormField label="End Date">
  //               <input
  //                 name="endDate"
  //                 value={form.endDate}
  //                 onChange={handleChange}
  //                 min={form.startDate}
  //                 type="date"
  //                 className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //               />
  //             </FormField>

  //             {/* {[
  //               ["Period", "period"],
  //               ["Weeks", "weeks"],
  //             ].map(([label, name]) => (
  //               <FormField key={name} label={label}>
  //                 <input
  //                   name={name}
  //                   value={form[name]}
  //                   readOnly
  //                   className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-100"
  //                   type="text"
  //                 />
  //               </FormField>
  //             ))} */}

  //             <FormField label="Escalation Rate">
  //               <input
  //                 name="escalationRate"
  //                 value={form.escalationRate}
  //                 onChange={handleChange}
  //                 type="number"
  //                 step="0.01"
  //                 className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //               />
  //             </FormField>

  //             {/* Searchable Org ID Lookup */}
  //             <FormField label="Org ID">
  //               <div className="relative w-full">
  //                 <input
  //                   name="orgId"
  //                   // FIX: Use the same value logic as Burden Template to ensure
  //                   // the display name shows up when selected, but the search term shows while typing.
  //                   value={
  //                     searchTermOrg ||
  //                       getOrgDetail()
  //                     ||
  //                     ""
  //                   }
  //                   placeholder="Search or select Org ID..."
  //                   onFocus={() => setFocusOrg(true)}
  //                   onBlur={() => setTimeout(() => setFocusOrg(false), 200)}
  //                   onChange={(e) => {
  //                     setSearchTermOrg(e.target.value);
  //                     // Reset the form value if the user starts typing a new search
  //                     if (form.orgId) {
  //                       setForm((prev) => ({ ...prev, orgId: "" }));
  //                     }
  //                   }}
  //                   type="text"
  //                   className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //                 />
  //                 {focusOrg && (
  //                   <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto shadow-lg rounded">
  //                     {orgOptions
  //                       .filter(
  //                         (opt) =>
  //                           // Better filtering: search both ID and Name case-insensitively
  //                           String(opt.orgId)
  //                             .toLowerCase()
  //                             .includes(searchTermOrg.toLowerCase()) ||
  //                           String(opt.orgName)
  //                             .toLowerCase()
  //                             .includes(searchTermOrg.toLowerCase())
  //                       )
  //                       .map((opt) => (
  //                         <div
  //                           key={opt.orgId}
  //                           className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-[11px] flex justify-between"
  //                           onMouseDown={() => {
  //                             setForm((prev) => ({
  //                               ...prev,
  //                               orgId: opt.orgId,
  //                             }));
  //                             setSearchTermOrg(""); // Reset search after selection
  //                           }}
  //                         >
  //                           {opt.orgId} - {opt.orgName}
  //                         </div>
  //                       ))}
  //                     {/* Optional: No Results Message */}
  //                     {searchTermOrg &&
  //                       orgOptions.filter(
  //                         (opt) =>
  //                           String(opt.orgId)
  //                             .toLowerCase()
  //                             .includes(searchTermOrg.toLowerCase()) ||
  //                           String(opt.orgName)
  //                             .toLowerCase()
  //                             .includes(searchTermOrg.toLowerCase())
  //                       ).length === 0 && (
  //                         <div className="px-3 py-2 text-gray-500 text-[11px]">
  //                           No matches found
  //                         </div>
  //                       )}
  //                   </div>
  //                 )}
  //               </div>
  //             </FormField>

  //             {/* Searchable Account Group Lookup */}
  //             {/* Searchable Account Group Lookup */}
  //             <FormField label="Account Group">
  //               <div className="relative w-full">
  //                 <input
  //                   name="accountGrp"
  //                   value={form.accountGrp}
  //                   placeholder="Search or select Account Group..."
  //                   onFocus={() => setFocusAcc(true)}
  //                   onBlur={() => setTimeout(() => setFocusAcc(false), 200)}
  //                   onChange={(e) => {
  //                     handleChange(e); // Updates form.accountGrp
  //                     setSearchTermAcc(e.target.value);
  //                   }}
  //                   type="text"
  //                   className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //                 />

  //                 {focusAcc && (
  //                   <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto shadow-lg rounded">
  //                     {accountGroupOptions
  //                       .filter((opt) =>
  //                         // opt is a string, so we call toLowerCase directly on it
  //                         opt
  //                           .toLowerCase()
  //                           .includes(searchTermAcc.toLowerCase())
  //                       )
  //                       .map((opt, idx) => (
  //                         <div
  //                           key={idx}
  //                           className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-[11px]"
  //                           onMouseDown={() => {
  //                             // Update form with the selected string
  //                             setForm((prev) => ({ ...prev, accountGrp: opt }));
  //                             setSearchTermAcc("");
  //                           }}
  //                         >
  //                           {opt}
  //                         </div>
  //                       ))}

  //                     {/* No Results Message */}
  //                     {accountGroupOptions.filter((opt) =>
  //                       opt.toLowerCase().includes(searchTermAcc.toLowerCase())
  //                     ).length === 0 && (
  //                       <div className="px-3 py-2 text-gray-500 italic text-[11px]">
  //                         No groups found
  //                       </div>
  //                     )}
  //                   </div>
  //                 )}
  //               </div>
  //             </FormField>

  //             {/* Searchable Burden Template ID Lookup */}
  //             <FormField label="Burden Template ID">
  //               <div className="relative w-full">
  //                 <input
  //                   name="burdenTemplateId"
  //                   value={
  //                     searchTermBurden ||
  //                     burdenTemplates.find(
  //                       (t) => String(t.id) === String(form.burdenTemplateId)
  //                     )?.templateCode ||
  //                     ""
  //                   }
  //                   placeholder="Search or select Template..."
  //                   onFocus={() => setFocusBurden(true)}
  //                   onBlur={() => setTimeout(() => setFocusBurden(false), 200)}
  //                   onChange={(e) => {
  //                     setSearchTermBurden(e.target.value);
  //                     if (form.burdenTemplateId) {
  //                       setForm((prev) => ({ ...prev, burdenTemplateId: "" }));
  //                     }
  //                   }}
  //                   type="text"
  //                   className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //                 />
  //                 {focusBurden && (
  //                   <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto shadow-lg rounded">
  //                     {burdenTemplates
  //                       .filter((template) =>
  //                         template.templateCode
  //                           .toLowerCase()
  //                           .includes(searchTermBurden.toLowerCase())
  //                       )
  //                       .map((template) => (
  //                         <div
  //                           key={template.id}
  //                           className="px-3 py-2 cursor-pointer hover:bg-blue-100 text-[11px] flex justify-between"
  //                           onMouseDown={() => {
  //                             // console.log(template.id)
  //                             setForm((prev) => ({
  //                               ...prev,
  //                               burdenTemplateId: template.id,
  //                             }));
  //                             setSearchTermBurden("");
  //                           }}
  //                         >
  //                           {template.templateCode}
  //                           {/* <span className="text-gray-400">ID: {template.id}</span> */}
  //                         </div>
  //                       ))}
  //                   </div>
  //                 )}
  //               </div>
  //             </FormField>

  //             {[
  //               ["Our Role", "ourRole", "text"],
  //               ["Stage", "stage", "text"],
  //               ["Customer", "customer", "text"],
  //               ["Our Workshare %", "ourWorkshare", "number"],
  //             ].map(([label, name, type]) => (
  //               <FormField key={name} label={label}>
  //                 <input
  //                   name={name}
  //                   value={form[name]}
  //                   onChange={handleChange}
  //                   type={type}
  //                   className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
  //                 />
  //               </FormField>
  //             ))}
  //           </div>
  //         </div>
  //       </form>
  //     )}

  //     {viewMode === "table" && (
  //       <SavedBusinessTableDisplay
  //         allBusinessBudgets={allBusinessBudgets}
  //         onNewBusiness={handleNewBusinessClick}
  //         onEditClick={onEditClick}
  //         onDeleteClick={handleDelete}
  //         onBackToSearch={handleBackToForm}
  //       />
  //     )}
  //   </div>
  // );

  return (
    <div
      className="p-3 py-10 space-y-6 text-[14px] sm:text-xs
             overflow-y-auto max-h-[85vh] 
             text-gray-800 font-sans mx-auto
             animate-premium-popup bg-white rounded-lg"
    >
      {viewMode === "form" && (
        <form className="space-y-4">
          {/* Header */}
          <div className="bg-white flex justify-between items-center pb-4 border-b">
            <h2 className="text-[16px] font-medium text-gray-700">
              {isUpdateMode ? "Update Business Budget" : "New Business Budget"}
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="btn1 btn-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : isUpdateMode ? "Update" : "Save"}
              </button>

              <button
                className="btn1 btn-blue flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClose}
                disabled={isSaving}
                title="Close"
              >
                <CircleArrowLeft size={12} className="text-white" />
                Back
              </button>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {/* LEFT COLUMN */}
            <div className="space-y-3">
              <div className="label-input-div">
                <label className="input-label">
                  Business Budget ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="businessBudgetId"
                  value={form.businessBudgetId}
                  onChange={handleChange}
                  readOnly={isUpdateMode}
                  className="input-style"
                  type="text"
                />
              </div>

              {[
                ["Description", "description", "text"],
                ["Level", "level", "number"],
                ["Version", "version", "number"],
                ["Version Code", "versionCode", "text"],
                ["Contract Value", "contractValue", "number"],
                ["Contract Type", "contractType", "text"],
                // ["Winning Probability %", "winningProbability", "number"],
                ["PGO Calculation", "pgoCalculation", "number"],
                ["Pwin Value", "pwinValue", "number"],
                ["Type", "type", "text"],
              ].map(([label, name, type]) => (
                <div key={name} className="label-input-div">
                  <label className="input-label">
                    {label}{" "}
                    {label === "Description" ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      ""
                    )}
                  </label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    type={type}
                    className="input-style"
                  />
                </div>
              ))}

              <div className="label-input-div">
                <label className="input-label">Active</label>
                <div className=" flex justify-start w-[60%]">
                  <input
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    type="checkbox"
                    className="accent-blue-600  "
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              <div className="label-input-div">
                <label className="input-label">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  type="date"
                  className="input-style"
                />
              </div>

              <div className="label-input-div">
                <label className="input-label">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  min={form.startDate}
                  type="date"
                  className="input-style"
                />
              </div>

              <div className="label-input-div">
                <label className="input-label">Escalation Rate</label>
                <input
                  name="escalationRate"
                  value={form.escalationRate}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                  className="input-style"
                />
              </div>

              {/* Searchable Org ID Lookup */}

              <div className="relative flex items-center w-full  justify-between">
                <label className="input-label">
                  Org ID <span className="text-red-500">*</span>
                </label>

                <Select
                  options={orgOptions.map((opt) => ({
                    label: `${opt.orgId} - ${opt.orgName}`,
                    value: opt.orgId,
                  }))}
                  className="rounded outline-none text-xs sm:text-sm bg-white w-[60%]"
                  value={
                    form.orgId
                      ? orgOptions
                          .map((opt) => ({
                            label: `${opt.orgId} - ${opt.orgName}`,
                            value: opt.orgId,
                          }))
                          .find((o) => o.value === form.orgId)
                      : null
                  }
                  onChange={(opt) =>
                    setForm((prev) => ({
                      ...prev,
                      orgId: opt ? opt.value : "",
                    }))
                  }
                  isSearchable
                  // placeholder="Search or select Org ID..."
                />
              </div>

              {/* Searchable Account Group Lookup */}
              {/* <div className="relative flex items-center w-full  justify-between">
                <label className="input-label">
                  Account Group <span className="text-red-500">*</span>
                </label>
                <input
                  name="accountGrp"
                  value={form.accountGrp}
                  placeholder="Search or select Account Group..."
                  onFocus={() => setFocusAcc(true)}
                  onBlur={() => setTimeout(() => setFocusAcc(false), 200)}
                  onChange={(e) => {
                    handleChange(e);
                    setSearchTermAcc(e.target.value);
                  }}
                  type="text"
                  className="input-style"
                />

                {focusAcc && (
                  <div className="absolute right-0 top-full z-10 w-96 bg-white border border-gray-300 mt-1 max-h-40 overflow-y-auto  rounded">
                    {accountGroupOptions
                      .filter((opt) =>
                        opt.toLowerCase().includes(searchTermAcc.toLowerCase()),
                      )
                      .map((opt, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-2 cursor-pointer w-[60%] hover:bg-blue-100 text-[11px] flex justify-between"
                          onMouseDown={() => {
                            setForm((prev) => ({
                              ...prev,
                              accountGrp: opt,
                            }));
                            setSearchTermAcc("");
                          }}
                        >
                          {opt}
                        </div>
                      ))}

                    {accountGroupOptions.filter((opt) =>
                      opt.toLowerCase().includes(searchTermAcc.toLowerCase()),
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 italic text-[11px]">
                        No groups found
                      </div>
                    )}
                  </div>
                )}
              </div> */}
              <div className="relative flex items-center w-full justify-between">
                <label className="input-label">
                  Account Group <span className="text-red-500">*</span>
                </label>

                <Select
                  options={accountGroupOptions.map((opt) => ({
                    label: opt,
                    value: opt,
                  }))}
                  className="rounded outline-none text-xs sm:text-sm bg-white w-[60%]"
                  value={
                    form.accountGrp
                      ? { label: form.accountGrp, value: form.accountGrp }
                      : null
                  }
                  onChange={(opt) =>
                    setForm((prev) => ({
                      ...prev,
                      accountGrp: opt ? opt.value : "",
                    }))
                  }
                  isSearchable
                  // placeholder="Search or select Account Group..."
                />
              </div>

              {/* Searchable Burden Template ID Lookup */}
              <div className="relative flex items-center w-full justify-between">
                <label className="input-label">
                  Burden Template ID <span className="text-red-500">*</span>
                </label>

                <Select
                  options={burdenTemplates.map((t) => ({
                    label: t.templateCode,
                    value: t.id,
                  }))}
                  className="rounded outline-none text-xs sm:text-sm bg-white w-[60%]"
                  value={
                    form.burdenTemplateId
                      ? burdenTemplates
                          .map((t) => ({
                            label: t.templateCode,
                            value: t.id,
                          }))
                          .find((o) => o.value === form.burdenTemplateId)
                      : null
                  }
                  onChange={(opt) =>
                    setForm((prev) => ({
                      ...prev,
                      burdenTemplateId: opt ? opt.value : "",
                    }))
                  }
                  isSearchable
                  // placeholder="Search or select Template..."
                />
              </div>

              {[
                ["Our Role", "ourRole"],
                ["Stage", "stage"],
                ["Customer", "customer"],
                ["Our Workshare %", "ourWorkshare"],
              ].map(([label, name]) => (
                <div key={name} className="label-input-div">
                  <label className="input-label">{label}</label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className="input-style"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewBusiness;
