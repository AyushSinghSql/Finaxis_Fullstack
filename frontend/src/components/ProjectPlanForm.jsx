import React, { useState, useEffect, version } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "./config";
import Select from "react-select";

const ProjectPlanForm = ({
  projectId,
  fiscalYear,
  onClose,
  onPlanCreated,
  existingProjects,
  sourcePlan,
  planType: initialPlanType,
  handleActionSelect,
  plans,
  selectedPlan,
  setShowForm,
  action,
  setIsActionLoading,
  refreshPlans,
  handleRowClick,
  onPlanSelect,
  getAllPlans,
  editingDates,
}) => {
  const [versionCode, setVersionCode] = useState("QTR1");
  const [planType, setPlanType] = useState(initialPlanType || "BUD");
  const [template, setTemplate] = useState("");
  const [templates, setTemplates] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [sourceType, setSourceType] = useState(""); // "Actual" or "Existing"
  const [existingProjectId, setExistingProjectId] = useState("");
  const [sourcePeriodRange, setSourcePeriodRange] = useState("");
  const [targetProjectRange, setTargetProjectRange] = useState("");
  const [selectedSourceProjId, setSelectedSourceProjId] = useState("");
  const [selectedVer, setSelectedVer] = useState(0)
  const [selectedType, setSelectedType] = useState("")

  useEffect(() => {
    if (selectedProjectOption) {
      setSourcePeriodRange(selectedProjectOption.startDate || "");
      setTargetProjectRange(selectedProjectOption.endDate || "");
    }
  }, [selectedSourceProjId]);
  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const response = await axios.get(
          `${backendUrl}/Orgnization/GetAllTemplates`,
        );
        // console.log('GetAllTemplates API response:', response.data);
        if (!Array.isArray(response.data)) {
          throw new Error("Invalid response format from templates API");
        }
        setTemplates(response.data);
        setTemplate(response.data[0]?.templateCode || "SYSTEM");
      } catch (err) {
        // console.error('Fetch templates error:', err);
        toast.error(
          "Failed to load templates: " +
            (err.response?.data?.message || err.message),
          { toastId: "fetch-templates-error" },
        );
        setTemplates([
          {
            id: 1,
            templateCode: "SYSTEM",
            description: "Default System Template",
          },
        ]);
        setTemplate("SYSTEM");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const projectOptions = existingProjects
    ? Array.from(
        // new Map(existingProjects.map((p) => [p.projId, p])).values(),
        new Map(
          existingProjects.map((p) => [
            // Create a unique key using both ID and Version
            `${p.projId}-${p.version}-${p.plType}`, 
            p
          ])
        ).values(),
      ).map((project) => {
        return {
          value: project.projId,
          planId: project.plId,
          startDate: project.projStartDt,
          endDate: project.projEndDt,
          ver: project.version,
          plType: project.plType,
          // label: `${project.projId} - (${project.version} - ${project.plType} - ${project.projName || "No Name"}`,
          label: `${project.projId} | Version: ${project.version} | Type: ${project.plType} | ${project.projName || "No Name"}`,
          key: `${project.projId}-${project.version}-${project.plId}`
        };
      })
    : [];

  const selectedProjectOption = projectOptions.find(
    (opt) => opt.value === selectedSourceProjId && opt.ver === selectedVer && opt.plType === selectedType,
  );

  const isChildProjectId = (projId) => {
    return projId && typeof projId === "string" && projId.includes(".");
  };

// const createBudget = async (idx, action) => {
//     const plan = plans[idx];
//     if (
//       sourceType === "Exisiting" &&
//       !sourcePeriodRange &&
//       !targetProjectRange &&
//       !selectedPlan.projStartDt &&
//       !selectedPlan.projEndDt
//     ) {
//       toast.error("Cannot create plan: Set Source Start and End Date.");
//       return;
//     }
 
//     const startDate =
//             editingDates[plan.plId]?.startDate ||
//             plan.projStartDt ||
//             plan.startDate ||
//             "";
//           const endDate =
//             editingDates[plan.plId]?.endDate ||
//             plan.projEndDt ||
//             plan.endDate ||
//             "";
 
//     if (
//       sourceType === "Actual" &&
//       (!startDate || !endDate)
//     ) {
//       toast.error("Cannot create plan: Set Start and End Date.");
//       return;
//     }
 
//     try {

//       console.log(plan)
 
//       let payloadTemplate;
 
//       if(sourceType === "Existing"){
//         payloadTemplate = {
//           plId: plan.plId || selectedPlan.plId || 0,
//           projId: selectedPlan?.projId || plan.projId || "",
//           plType:"BUD",
//           sourceProjId: selectedProjectOption.value || "",
//           // sourcePlId: selectedProjectOption.planId || "",
//           sourceProjStartDt: selectedProjectOption.startDate || "",
//           sourceProjEndDt: selectedProjectOption.endDate || "",
//           source: `${plan.plType === "BUD" ? "B" : plan.plType === "EAC" ? "E" : ""}${plan.version || 0}`,
//           // type: plan.type || "",
//           type:
//             typeof isChildProjectId === "function" &&
//             isChildProjectId(selectedPlan?.projId)
//               ? "A"
//               : plan.type || "",
//           version: plan.version || 0,
//           copyFromExistingProject: sourceType === "Actual" ? false : true,
//           versionCode: plan.versionCode || "",
//           finalVersion: false,
//           isCompleted: false,
//           isApproved: false,
//           status: "In Progress",
//           createdBy: plan.createdBy || "User",
//           modifiedBy: plan.modifiedBy || "User",
//           approvedBy: "",
//           templateId: plan.templateId || 1,
//           fiscalYear: fiscalYear,
//           projStartDt:
//             selectedPlan?.projStartDt || editingDates[plan.plId]?.startDate,
//           projEndDt: selectedPlan?.projEndDt || editingDates[plan.plId]?.endDate,
//         };
//       } else {
//         payloadTemplate = {
//           plId: plan.plId || 0,
//           projId: selectedPlan?.projId || plan.projId || "",
//           plType: "BUD",  
//           source: `${plan.plType === "BUD" ? "B" : plan.plType === "EAC" ? "E" : ""}${plan.version || 0}`,
//           // type: plan.type || "",
//           type:
//             typeof isChildProjectId === "function" &&
//             isChildProjectId(selectedPlan?.projId)
//               ? "A"
//               : plan.type || "",
//           version: plan.version || 0,
//           copyFromExistingProject: sourceType === "Actual" ? false : true,
//           versionCode: plan.versionCode || "",
//           finalVersion: false,
//           isCompleted: false,
//           isApproved: false,
//           status: "In Progress",
//           createdBy: plan.createdBy || "User",
//           modifiedBy: plan.modifiedBy || "User",
//           approvedBy: "",
//           templateId: plan.templateId || 1,
//           fiscalYear: fiscalYear,
//           projStartDt:
//             selectedPlan?.projStartDt || editingDates[plan.plId]?.startDate,
//           projEndDt:
//             selectedPlan?.projEndDt || editingDates[plan.plId]?.endDate,
//         };
//       }
     
//       // console.log(plan)
//       console.log(payloadTemplate);
 
//       toast.info("Creating Budget");
 
//       setShowForm(false);
 
//       const response = await axios.post(
//         `${backendUrl}/Project/AddProjectPlan`,
//         payloadTemplate,
//       );
 
//       const rawCreatedPlan = response.data;
 
//       const normalizedPlan = {
//         ...plan,
//         ...rawCreatedPlan,
//         plId: rawCreatedPlan.plId || rawCreatedPlan.id || 0,
//         projId: rawCreatedPlan.projId || plan.projId,
//         // projName: rawCreatedPlan.projName || plan.projName || "",
//         projName:
//           rawCreatedPlan.projName ||
//           plan.projName ||
//           plan.description ||
//           plan.desc ||
//           "",
//         plType:
//           rawCreatedPlan.plType === "Budget"
//             ? "BUD"
//             : rawCreatedPlan.plType || "BUD",
//         version: Number(rawCreatedPlan.version) || 0,
//         status: "In Progress",
//         finalVersion: false,
//         isCompleted: false,
//         isApproved: false,
//         projStartDt: rawCreatedPlan.projStartDt || plan.projStartDt || "",
//         projEndDt: rawCreatedPlan.projEndDt || plan.projEndDt || "",
 
//         type: rawCreatedPlan.type || plan.type || "",
//       };
 
//       if (!normalizedPlan.projId || !normalizedPlan.plType) {
//         toast.error(
//           "Plan returned from backend is missing required fields. Please reload and try again.",
//         );
//         setIsActionLoading(false);
//         return;
//       }
 
//       const effectiveProjIdForRefresh = projectId || rawCreatedPlan.projId;
 
//       const newPlans = await refreshPlans(effectiveProjIdForRefresh);
 
//       if (newPlans && newPlans.length > 0) {
//         const planToSelect =
//           newPlans.find(
//             (p) =>
//               p.plId === normalizedPlan.plId &&
//               p.projId === normalizedPlan.projId &&
//               p.plType === normalizedPlan.plType,
//           ) || normalizedPlan;
 
//         handleRowClick(planToSelect);
//         // onPlanCreated?.(planToSelect);
//         if (typeof onPlanSelect === "function") {
//           onPlanSelect(planToSelect);
//         }
 
//         setTimeout(() => {
//           const rowElement = document.getElementById(
//             `plan-row-${planToSelect.plId}`,
//           );
//           if (rowElement) {
//             rowElement.scrollIntoView({
//               behavior: "smooth",
//               block: "center", // This forces the row to be in the middle of the container
//             });
//           }
//         }, 100);
//       }
 
//       toast.success(
//         `${
//           action === "Create Budget"
//             ? "Budget"
//             : action === "Create Blank Budget"
//               ? "Blank Budget"
//               : action === "Create NB BUD"
//                 ? "NB BUD"
//                 : "EAC"
//         } created successfully!`,
//       );
//       getAllPlans();
//     } catch (err) {
//       const errorMessage =
//         (typeof err.response?.data === "string" ? err.response.data : null) ||
//         err.response?.data?.message ||
//         err.message;
 
//       toast.error(errorMessage);
//     } finally {
//       setIsActionLoading(false);
//     }
//   };

const createBudget = async (idx) => {
  const plan = selectedPlan

  if (!plan) {
  toast.error("Please select a valid plan.");
  return;
}
 
if (!sourceType) {
  toast.error("Please select a source type (Actual or Existing Project).");
  return;
}
 
if (sourceType === "Existing" && !selectedProjectOption) {
  toast.error("Please select an existing project.");
  return;
}
 
  if (
  sourceType === "Existing" &&
  (!sourcePeriodRange || !targetProjectRange)
) {
  toast.error("Please select both Start Date and End Date for the existing project.");
  return;
}
 
 
  const startDate =
    editingDates[plan.plId]?.startDate ||
    selectedPlan.projStartDt ||
    plan.startDate ||
    "";
 
  const endDate =
    editingDates[plan.plId]?.endDate ||
    selectedPlan.projEndDt ||
    plan.endDate ||
    "";
 
  if (sourceType === "Actual" && (!startDate || !endDate)) {
  toast.error("Please enter Start Date and End Date.");
  return;
}
 
if (
  (sourceType === "Existing" && sourcePeriodRange > targetProjectRange) ||
  (sourceType === "Actual" && startDate > endDate)
) {
  toast.error("End Date cannot be earlier than Start Date.");
  return;
}
 
 
 
  try {
    setIsActionLoading(true);
 
    const payloadTemplate = {
      plId: selectedProjectOption?.planId || 0,
      projId: selectedPlan?.projId || plan.projId || "",
      plType: "BUD",
 
      sourceProjId: selectedProjectOption?.value || null,
      sourceProjStartDt: sourcePeriodRange || selectedProjectOption?.startDate || null,
      sourceProjEndDt: targetProjectRange || selectedProjectOption?.endDate || null,
 
      source: `${
        plan.plType === "BUD"
          ? "B"
          : plan.plType === "EAC"
          ? "E"
          : ""
      }${plan.version || 0}`,
 
      type: plan.type || "A",
 
      version: plan.version || 0,
      copyFromExistingProject: sourceType === "Existing",
 
      versionCode: plan.versionCode || "",
      finalVersion: false,
      isCompleted: false,
      isApproved: false,
      status: "In Progress",
 
      createdBy: plan.createdBy || "User",
      modifiedBy: plan.modifiedBy || "User",
      approvedBy: "",
 
      templateId: plan.templateId || 1,
      fiscalYear: fiscalYear,
 
      projStartDt:startDate || sourcePeriodRange|| selectedProjectOption?.startDate,
      projEndDt: endDate ||targetProjectRange|| selectedProjectOption?.endDate ,
    };
 
    toast.info("Creating Budget...");
    setShowForm(false);
 
    const response = await axios.post(
      `${backendUrl}/Project/AddProjectPlan?type=${
        sourceType === "Existing" ? "actual" : "actual"
      }`,
      payloadTemplate
    );
 
    const rawCreatedPlan = response.data;
 
    if (!rawCreatedPlan?.plId) {
      toast.error("Invalid response from backend.");
      return;
    }
 
    const effectiveProjIdForRefresh =
      projectId || rawCreatedPlan.projId;
 
    const newPlans = await refreshPlans(effectiveProjIdForRefresh);
 
    if (newPlans?.length > 0) {
      const planToSelect =
        newPlans.find((p) => p.plId === rawCreatedPlan.plId) ||
        rawCreatedPlan;
 
      handleRowClick(planToSelect);
 
      if (typeof onPlanSelect === "function") {
        onPlanSelect(planToSelect);
      }
 
      setTimeout(() => {
        document
          .getElementById(`plan-row-${planToSelect.plId}`)
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 100);
    }
 
    toast.success("Budget created successfully!");
    getAllPlans();
  } catch (err) {
    const errorMessage =
      (typeof err.response?.data === "string"
        ? err.response.data
        : null) ||
      err.response?.data?.message ||
      err.message;
 
    toast.error(errorMessage || "Failed to create budget. Please try again.");
 
  } finally {
    setIsActionLoading(false);
  }
};
 

  return (
    <div
      className="px-2 py-2 space-y-6 text-[14px] sm:text-xs
      overflow-y-auto max-h-[85vh] 
      text-gray-800 font-sans mx-auto
      animate-premium-popup bg-white rounded-lg"
    >
      <form>
        {/* Step 1: Selection between Actual or Existing */}
        <div className="mb-2 flex justify-between items-center">
          <label className="input-label">Select Source:</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs w-[75%] "
            required
          >
            {" "}
            <option value="">-- Select Option --</option>{" "}
            <option value="Actual">Actual</option>{" "}
            <option value="Existing">Existing Project</option>{" "}
          </select>
        </div>

        {/* Step 2: Conditional Dropdown for Existing Project */}
        {sourceType === "Existing" && (
          <div className="mb-4 flex justify-between items-center">
            <label className="input-label">Select Existing Project:</label>
            {/* <select
              value={existingProjectId}
              onChange={(e) => setExistingProjectId(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Project --</option>
              Assuming allProjectPlans contains your project list */}
            {/* {[...new Set(allProjectPlans.map(p => p.projId))].map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select> */}
            {/* <select
                value={selectedSourceProjId}
                onChange={(e) => setSelectedSourceProjId(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                required
              >
                <option value="">-- Select a Project --</option>
                {existingProjects && existingProjects.length > 0 ? (
                  // Remove duplicates if the list has multiple versions of the same project
                  Array.from(
                    new Set(existingProjects.map((p) => p.projId)),
                  ).map((projId) => {
                    const project = existingProjects.find(
                      (p) => p.projId === projId,
                    );
                    return (
                      <option key={projId} value={projId}>
                        {projId} - {project.projName || "No Name"}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No projects available</option>
                )}
              </select> */}

            <Select
              options={projectOptions}
              value={
                selectedSourceProjId
                  ? projectOptions.find((o) => o.value === selectedSourceProjId && o.version === selectedVer && o.plType === selectedType)
                  : null
              }
              onChange={(opt) =>{ setSelectedSourceProjId(opt ? opt.value : "")
                setSelectedVer(opt? opt.ver : 0)
                setSelectedType(opt? opt.plType : "")
              }}
              placeholder="Select a Project"
              isSearchable
              className="rounded text-xs w-[75%]"
              menuPortalTarget={document.body} // Render dropdown at body level
              menuPosition="fixed" // Use fixed positioning
              menuPlacement="auto"
              styles={{
                singleValue: (provided) => ({
                  ...provided,
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  
                }),
                option: (provided) => ({
                  ...provided,
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Ensure it's on top
              }}
            />
          </div>
        )}

        {/* Step 3: Fields for Source Period and Target Project */}
        {sourceType === "Existing" && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="input-label">Start Date:</label>
              <input
                type="date"
                // placeholder="e.g. FY2024 P01 - P12"
                // value={sourcePeriodRange}
                // value={selectedProjectOption?.startDate || ""}
                value={sourcePeriodRange || ""}
                onChange={(e) => setSourcePeriodRange(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs w-[75%] "
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="input-label">End Date:</label>
              <input
                type="date"
                value={targetProjectRange || ""}
                // value={selectedProjectOption?.endDate || ""}
                onChange={(e) => setTargetProjectRange(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs w-[75%] "
                // placeholder="Target Project ID"
              />
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn1 btn-blue">
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              createBudget(
                plans.findIndex((p) => p.plId === selectedPlan?.plId),
                sourceType,
              );
            }}
            disabled={!sourceType}
            className={`btn1 btn-blue`}
          >
            Create Budget
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectPlanForm;
