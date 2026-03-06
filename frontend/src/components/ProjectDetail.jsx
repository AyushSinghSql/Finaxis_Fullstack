import React, { useEffect, useRef, useState } from "react";
import ProjectHoursDetails from "./ProjectHoursDetails";
import ProjectAmountsTable from "./ProjectAmountsTable";
import ProjectPoolCosts from "./ProjectPoolCosts";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "./config";

const ProjectDetail = ({
  selectedPlan,
  activeTab,
  fiscalYear,
  setRefreshPool,
  onColumnTotalsChange,
  refreshKey,
  onColumnAmtTotalsChange,
  setRefreshKey,
  refreshPool,
  otherColumnTotals,
  hoursColumnTotals,
  handleActionSelect,
  canView,
  canEdit
}) => {

    const ACCOUNT_KEYS = [
      "employeeLaborAccounts",
      "employeeNonLaborAccounts",
      "sunContractorLaborAccounts",
      "subContractorNonLaborAccounts",
      "otherDirectCostLaborAccounts",
      "otherDirectCostNonLaborAccounts",
      "plc",
    ];

  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calculation, setCalculation] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [allData, setAllData] = useState([])
  const [allOrgData, setAllOrgData] = useState([])
  const [isClosedPeriodEditable, setIsClosedPeriodEditable] = useState(false);
  const [allForcastData, setAllForcastData] = useState([])
  const [durations, setDurations] = useState([])
  const [isDurationLoading, setIsDurationLoading] = useState(false) 
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [loadingPools, setLoadingPools] = useState(false)
  const [error, setError] = useState(null)
  

    const projectHoursRef = useRef(null);
    const projectAmountsRef = useRef(null);
    const fileInputRef = useRef(null);
   

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");

    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setCurrentUserRole(
          userObj.role ? userObj.role.toLowerCase() : null
        );
      } catch (error) {
        console.error("Error parsing user:", error);
        setCurrentUserRole(null);
      }
    }
  }, []);




// BUtton function
const handleGlobalSave = async () => {
    setIsLoading(true);
    setIsSaving(true)
 
    try {
      const saveTasks = [];
 
      if (projectAmountsRef.current?.handleMasterSave && (( projectAmountsRef.current?.newEntries?.length > 0 ||
              projectAmountsRef.current?.hasUnsavedAmountChanges ||
              projectAmountsRef.current?.hasUnsavedFieldChanges))) {
        saveTasks.push(
          projectAmountsRef.current.handleMasterSave().then((res) => ({
            section: "Amounts",
            success: res !== false,
          })),
        );
      }
 
      if (projectHoursRef.current?.handleMasterSave && (projectHoursRef.current?.newEntries?.length > 0 ||
                      projectHoursRef.current?.hasUnsavedHoursChanges ||
                      projectHoursRef.current?.hasUnsavedEmployeeChanges)) {
        saveTasks.push(
          projectHoursRef.current.handleMasterSave().then((res) => ({
            section: "Hours",
            success: res !== false,
          })),
        );
      }
 
      const results = await Promise.allSettled(saveTasks);
 
      const failedSections = [];
 
      results.forEach((result) => {
        if (result.status === "rejected") {
          failedSections.push("Unknown");
        } else if (!result.value.success) {
          failedSections.push(result.value.section);
        }
      });
 
      if (failedSections.length > 0) {
        toast.error(`Failed to save: ${failedSections.join(", ")}`);
        return;
      }
    } catch (err) {
      console.error(err);
      toast.error("Global Save Failed");
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  const handleImportPlanFromDetails = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const validExtensions = [".xlsx", ".xls"];
  const fileExtension = file.name
    .slice(file.name.lastIndexOf("."))
    .toLowerCase();

  if (!validExtensions.includes(fileExtension)) {
    toast.error("Invalid file format. Please upload an Excel file (.xlsx or .xls)");
    return;
  }

  const toastId = toast.loading("Processing data import...");

  const formData = new FormData();
  formData.append("file", file);

  try {
    setIsLoading(true)
    setIsImporting(true)
    await axios.post(
      `${backendUrl}/Forecast/ImportDirectCostPlan`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    toast.update(toastId, {
      render: "Data imported successfully.",
      type: "success",
      isLoading: false,
      autoClose: 3000,
    });

    setRefreshKey((prev) => prev + 1);
  } catch (err) {
    console.error("Import Error:", err);

    let errorMessage =
      "Failed to import file. Please verify the project ID and file format.";
    let errorDetails = null;

    if (err.response?.data) {
      if (typeof err.response.data === "string") {
        errorMessage = err.response.data;
      } else {
        errorMessage = err.response.data.message || errorMessage;
        errorDetails = err.response.data.details || null;
      }
    }

    toast.update(toastId, {
      render: (
        <div>
          <strong>{errorMessage}</strong>
          {errorDetails && (
            <div className="mt-2 text-xs">
              {Object.entries(errorDetails).map(([k, v]) => (
                <div key={k}>
                  {k}: {v || "-"}
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      type: "error",
      isLoading: false,
      autoClose: 8000,
    });
  } finally {
    setIsImporting(false)
    setIsLoading(false)
    if (event.target) event.target.value = "";
  }
};

 const handleExportPlan = async (planOverride) => {
    if(!selectedPlan){
              toast.warning("Please select a plan first.");
        return;
    }
    const plan = planOverride || selectedPlan;

    if (!plan?.projId || !plan?.version || !plan?.plType) {
      toast.error("Missing required parameters for export.");
      return;
    }
    const toastId = toast.loading("Preparing Excel file, please wait...");

    try {
        setIsExporting(true)
    setIsLoading(true)
      const response = await axios.get(
        `${backendUrl}/Forecast/ExportPlanDirectCost`,
        {
          params: {
            projId: plan.projId,
            version: plan.version,
            type: plan.plType,
          },
          responseType: "blob",
        }
      );

      if (!response.data || response.data.size === 0) {
        toast.update(toastId, {
          render: "No data received from server",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      // Handle the file download silently in the background
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Plan_${plan.projId}_${plan.version}_${plan.plType}.xlsx`
      );

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.update(toastId, {
        render: "Export successful!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Export Error:", err);
      toast.update(toastId, {
        render:
          "Export failed: " + (err.response?.data?.message || err.message),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
        setIsExporting(false)
    setIsLoading(false)
    }
  };

const handleCalc = async () => {
    setIsLoading(true)
      setCalculation(true);
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
          }
        );
        return;
      }
      // setIsActionLoading(true);
      try {
        const response = await axios.get(
          `${backendUrl}/Forecast/CalculateRevenueCost?planID=${selectedPlan.plId}&templateId=${selectedPlan.templateId}&type=actual`
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
        // setIsActionLoading(false);
        setCalculation(false);
        setIsLoading(false)
      }
    };


    
    
    // optimized api calls
    
useEffect(() => {
        const encodedProjectId = encodeURIComponent(selectedPlan?.projId);

      const getAllData = async () => {
        try {
            const projectResponse = await axios.get(
                `${backendUrl}/Project/GetAllProjectByProjId/${encodedProjectId}/${selectedPlan?.plType}`,
            );
          const data = Array.isArray(projectResponse.data)
          ? projectResponse.data[0]
          : projectResponse.data;
          setAllData(data);
        } catch (error) {
            console.log(error);
        }
    };
    getAllData();
}, [selectedPlan]);

useEffect(() => {
    const loadOrganizations = async () => {
        try {
            const response = await axios.get(
                `${backendUrl}/Orgnization/GetAllOrgs`,
            );
            setAllOrgData(response.data);
        } catch (err) {
            console.error("Failed to preload organizations", err);
        }
        };
        loadOrganizations();
    }, []);

 useEffect(() => {
       const fetchConfig = async () => {
         try {
           const response = await axios.get(
             `${backendUrl}/api/Configuration/GetConfigValueByName/isClosedPeriodEditable`,
           );
           console.log('hours', response.data)
           setIsClosedPeriodEditable(response.data?.value);
         } catch (err) {
           console.warn("Config fetch failed, defaulting to editable:", err);
           setIsClosedPeriodEditable(true);
         }
       };
       fetchConfig();
     }, []); 

useEffect(() => {
                const fetchAndSetLaborCost = async () => {
                  setLoadingPools(true)
                  try {
                    const planType = selectedPlan?.plType || ""
                    const planId = selectedPlan?.plId
                    // ✅ FIXED: Pass planType correctly to the API
                    const apiPlanType = planType === "NBBUD" ? "BUD" : planType;
            
                    const response = await axios.get(
                      `${backendUrl}/Forecast/GetMonthlyDataV1?planID=${planId}&planType=${apiPlanType}`,
                    );
            
                    const data = response?.data;
            
                    if (!Array.isArray(data)) {
                      setAllForcastData([]);
                      return;
                    }
            
                    // ✅ FIXED: Map the response correctly with all fields
//                    const transformed = data.map(item => ({
//   year: item.year,
//   month: item.month,
//   laborCost: Number(item.laborCost) || 0,
//   nonLaborCost: Number(item.nonLaborCost) || 0,
//   hours: Number(item.hours) || Number(item.hr) || 0,
//   indirectCost: [
//     { name: "OH-Off Site Lanham", value: Number(item.overhead) || 0 },
//     { name: "OH-On Site Lanham", value: Number(item.overhead) || 0 }, // adjust if you have separate field
//     { name: "Fringe", value: Number(item.fringe) || 0 },
//     { name: "Material Handling Fee", value: Number(item.mnh) || 0 },
//     { name: "G&A", value: Number(item.gna) || 0 }
//   ]
// }));
            
                    setAllForcastData(response.data);
                  } catch (error) {
                    console.error("Failed to fetch labor cost data", error);
                    setAllForcastData([]);
                  } finally {
                    setLoadingPools(false)
                  }
                };
                fetchAndSetLaborCost()
            }, [selectedPlan])

   useEffect(() => {
      const fetchDurations = async () => {
        if(!selectedPlan) return;

        const startDate = selectedPlan?.projStartDt
        const endDate = selectedPlan?.projEndDt
        if (!startDate || !endDate) {
          setDurations([]);
          setIsDurationLoading(false);
          setIsDataLoading(false)
          return;
        }
        setIsDurationLoading(true);
        setIsDataLoading(true)
        setError(null);
        try {
            let startingDate;
let endingDate;

const originalStart = new Date(startDate); // e.g. 2025-06-01
const originalEnd = new Date(endDate);     // e.g. 2027-05-31

if (!fiscalYear || fiscalYear === "All") {
  startingDate = startDate;
  endingDate = endDate;
} else {
  const year = Number(fiscalYear);

  const fiscalStart = new Date(year, 0, 1);   // Jan 1 YYYY
  const fiscalEnd = new Date(year, 11, 31);   // Dec 31 YYYY

  // Take the later of originalStart and fiscalStart
  const adjustedStart = originalStart > fiscalStart
    ? originalStart
    : fiscalStart;

  // Take the earlier of originalEnd and fiscalEnd
  const adjustedEnd = originalEnd < fiscalEnd
    ? originalEnd
    : fiscalEnd;

  // Convert back to YYYY-MM-DD
  startingDate = adjustedStart.toISOString().slice(0, 10);
  endingDate = adjustedEnd.toISOString().slice(0, 10);
}
      
          const durationResponse = await axios.get(
            `${backendUrl}/Orgnization/GetWorkingDaysForDuration/${startingDate}/${endingDate}`,
          );
          if (!Array.isArray(durationResponse.data)) {
            throw new Error("Invalid duration response format");
          }
          setDurations(durationResponse.data);
        } catch (err) {
          setError("Failed to load duration data. Please try again.");
          toast.error(
            "Failed to load duration data: " +
              (err.response?.data?.message || err.message),
            {
              toastId: "duration-error",
              autoClose: 3000,
            },
          );
        } finally {
          setIsDurationLoading(false);
          setIsDataLoading(false)
        }
      };
      fetchDurations();
      // projectHoursRef.current?.fetchEmployees()
    }, [selectedPlan, fiscalYear]);

  return (
    <div className="w-full mx-auto grid md:grid-cols-1">

    <div className="flex items-center gap-2">
                {selectedPlan &&
                  (selectedPlan.status === "Approved" ||
                    selectedPlan.status === "Concluded") && (
                    <div className="flex gap-2">
                      {/* New Budget Button */}
                      <button
                        onClick={() =>
                          handleActionSelect(null, "Create Budget")
                        }
                        className="btn1 btn-blue cursor-pointer whitespace-nowrap"
                        title="Create Budget"
                      >
                        New Budget
                      </button>
                      {/* New EAC Button */}
                      <button
                        onClick={() => handleActionSelect(null, "Create EAC")}
                        className="btn1 btn-blue cursor-pointer whitespace-nowrap"
                        title="Create EAC"
                      >
                        New EAC
                      </button>
                    </div>
                  )}
                <div className="flex items-center justify-between w-full">
                <div className="flex gap-2 items-center">

                  {(canView("BUD/EAC") || canView("otherCost")) && 
                  <>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={isLoading || isImporting}
                    className="btn1 btn-blue cursor-pointer flex items-center"
                    title="Import Plan"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l-4-4m4 4l4-4"
                      />
                    </svg>
                    {isImporting ? 'Importing' :'Import'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportPlanFromDetails}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  {/* ✅ EXPORT BUTTON - uses table ref */}
                  <button
                    // onClick={(e) => {
                    //   e.stopPropagation();
                    //   handleExportPlanFromDetails;
                    // }}
                    type="button"
                    onClick={() => handleExportPlan()}
                    className="btn1 btn-blue cursor-pointer flex items-center"
                    title="Export to Excel"
                    disabled={
                      !selectedPlan?.projId ||
                      !selectedPlan?.version ||
                      !selectedPlan?.plType || isLoading || isExporting
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                   {isExporting ? 'Exporting':'Export'}
                  </button>
                  </>
               }
 
                  {canView("indirectCost") && (
                    <>
                      <button
                        onClick={handleCalc}
                        className="btn1 btn-blue cursor-pointer flex items-center"
                        title="Import Plan"
                        disabled={calculation || isLoading}
                      >
                        {calculation ? "Calculating" : "Calc"}
                      </button>
                    </>
                  )}
                </div>
                
                {(canView("BUD/EAC") || canView("otherCost") ) && (
                <div>
                  <div className="flex flex-1 justify-end p-1">
                    <button
                      onClick={handleGlobalSave}
                      disabled={isLoading || isSaving}
                      className="btn1 btn-blue"
                      
                      >
                      {isSaving ? "Saving" : "Save"}
                    </button>
                  </div>
                </div>
)}
                </div>
              </div>

      {/* HOURS CARD */}
                    {canView("BUD/EAC") && (
      <div className="border mb-2 border-gray-200 rounded-md shadow-sm bg-white">
        <div className="px-2 pb-2">

          <ProjectHoursDetails
            activeTab={activeTab}
            ref={projectHoursRef}
            planId={selectedPlan.plId}
            canView={canView}
            canEdit={canEdit}
            projectId={selectedPlan.projId}
            templateId={selectedPlan.templateId}
            refreshKey={calculation}
            status={selectedPlan.status}
            planType={selectedPlan.plType}
            closedPeriod={selectedPlan.closedPeriod}
            startDate={selectedPlan.projStartDt}
            endDate={selectedPlan.projEndDt}
            fiscalYear={fiscalYear}
            setRefreshPool={setRefreshPool}
            onSaveSuccess={() => {}}
            onColumnTotalsChange={onColumnTotalsChange}
            allData={allData}
            initialData={selectedPlan}
            allOrgData={allOrgData}
            isClosedPeriodEditable={isClosedPeriodEditable}
            // allowedPercentage={allowedPercentage}
            allForcastData={allForcastData}
            isDurationhrLoading={isDurationLoading}
            setIsDurationhrLoading={setIsDurationLoading}
            durations={durations}
            groupCd={selectedPlan.acctGrpCd}
            />
        </div>
      </div>
        )}

      {/* OTHER COST CARD */}
                    {/* {canView("otherCost") && ( */}
      <div className="border mb-2 border-gray-200 rounded-md shadow-sm bg-white">

        <div className="px-2 pb-2">
          <ProjectAmountsTable
            activeTab={activeTab}
            ref={projectAmountsRef}
            initialData={selectedPlan}
            allData={allData}
            startDate={selectedPlan.projStartDt}
            endDate={selectedPlan.projEndDt}
            planType={selectedPlan.plType}
            templateId={selectedPlan.templateId}
            fiscalYear={fiscalYear}
            refreshKey={refreshKey}
            setRefreshPool={setRefreshPool}
            onSaveSuccess={() =>
              setRefreshKey((prev) => prev + 1)
            }
            onColumnTotalsChange={onColumnAmtTotalsChange}
            allOrgData={allOrgData}
            isClosedPeriodEditable={isClosedPeriodEditable}
            allForcastData={allForcastData}
            isDataLoading={isDataLoading}
            setIsDataLoading={setIsDataLoading}
            durations={durations}
            groupCd={selectedPlan.acctGrpCd}
            />
        </div>
      </div>
        {/* )} */}

      {/* POOL COST (ADMIN ONLY) */}
      
                    {/* {canView("indirectCost") && ( */}
        <div className="border border-gray-200 rounded-md shadow-sm bg-white">

          <div className="px-2 pb-2">
            <ProjectPoolCosts
              refreshKey={refreshPool}
              planId={selectedPlan.plId}
              startDate={selectedPlan.projStartDt}
              planType={selectedPlan.plType}
              endDate={selectedPlan.projEndDt}
              fiscalYear={fiscalYear}
              hoursColumnTotals={hoursColumnTotals}
              otherColumnTotals={otherColumnTotals}
              refreshCalculation={calculation}
              allForcastData={allForcastData}
              loadingPools={loadingPools}
              groupCd={selectedPlan.acctGrpCd}
              />
          </div>
          </div>
        {/* )} */}
    </div>
  );
};

export default ProjectDetail;
