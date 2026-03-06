import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const RevenueCeilingComponent = forwardRef(
  ({ selectedPlan, revenueAccount, canEdit }, ref) => {
    const [periods, setPeriods] = useState([]);
    const [orgId, setOrgId] = useState("");
    const [acctId, setAcctId] = useState("");
    const [overrideAdjustments, setOverrideAdjustments] = useState(false);
    const [useFixedRevenue, setUseFixedRevenue] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [revDefData, setRevDefData] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-CA");
      } catch (e) {
        return "Invalid Date";
      }
    };

    useImperativeHandle(ref, () => ({
      hasUnsavedChanges: () => hasUnsavedChanges,
    }));

    // useEffect(() => {
    //   const handleBeforeUnload = (e) => {
    //     if (hasUnsavedChanges) {
    //       e.preventDefault();
    //       e.returnValue = "Unsaved changes will be lost.";
    //     }
    //   };
    //   window.addEventListener("beforeunload", handleBeforeUnload);
    //   return () =>
    //     window.removeEventListener("beforeunload", handleBeforeUnload);
    // }, [hasUnsavedChanges]);
    
    // Browser-level and Internal Navigation alert logic
useEffect(() => {
  // 1. Handles Browser Refresh / Tab Close
  const handleBeforeUnload = (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "Unsaved changes will be lost.";
      return e.returnValue;
    }
  };

  // 2. Handles Internal Navigation (Link clicks / Tab switching)
  const handleInternalClick = (e) => {
    if (hasUnsavedChanges) {
      // Check if the clicked element is a link or a button
      const target = e.target.closest("a") || e.target.closest("button");

      if (target) {
        // EXCEPTION: If the user clicked the "Save" button, do not show the alert
        // This checks if the button text contains "Save"
        if (target.innerText.includes("Save")) {
          return;
        }

        const confirmLeave = window.confirm(
          "You have unsaved changes. Do you want to continue without saving?"
        );
        
        if (!confirmLeave) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  // Using 'true' for capture phase to catch the event before the router processes it
  document.addEventListener("click", handleInternalClick, true);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("click", handleInternalClick, true);
  };
}, [hasUnsavedChanges]);

    const getRevData = async () => {
      try {
        const { projId, version, plType } = selectedPlan;
        const res = await axios.get(
          `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${projId}/${version}/${plType}`,
        );
        if (res.data) {
          setRevDefData(res.data);

          setUseFixedRevenue(res.data?.overrideRevAdjFl);
          setOverrideAdjustments(res.data?.overrideRevSettingFl);
        }
        console.log(res.data);
      } catch (error) {
        // toast.error("Failed to fetch the checkbox data")
      }
    };
    useEffect(() => {
      getRevData();
    }, []);

    // const fetchRevenueData = async () => {
    //   if (!selectedPlan?.projId || !selectedPlan?.version || !selectedPlan?.plType) {
    //     setPeriods([]);
    //     return;
    //   }
    //   setLoading(true);
    //   try {
    //     const { projId, version, plType } = selectedPlan;
    //     const url = `${backendUrl}/ProjRevWrkPd/filter?projId=${projId}&versionNo=${version}&bgtType=${plType}`;
    //     const response = await axios.get(url);

    //     const newData = Array.isArray(response.data) ? response.data : [];

    //     setPeriods((prevPeriods) => {
    //       const updatedPeriods = prevPeriods.map((prevPeriod) => {
    //         const updatedPeriod = newData.find((newPeriod) => newPeriod.id === prevPeriod.id);
    //         return updatedPeriod || prevPeriod;
    //       });
    //       const newPeriodIds = new Set(updatedPeriods.map((p) => p.id));
    //       const additionalPeriods = newData.filter((newPeriod) => !newPeriodIds.has(newPeriod.id));
    //       return [...updatedPeriods, ...additionalPeriods];
    //     });
    //   } catch (error) {
    //     toast.error("Failed to fetch revenue data.");
    //     setPeriods([]);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const fetchRevenueData = async () => {
      if (
        !selectedPlan?.projId ||
        !selectedPlan?.version ||
        !selectedPlan?.plType
      ) {
        setPeriods([]);
        return;
      }
      setLoading(true);
      try {
        const { projId, version, plType, plId } = selectedPlan;
        const url = `${backendUrl}/ProjRevWrkPd/filter?projId=${projId}&versionNo=${version}&bgtType=${plType}&pl_id=${plId}`;

        const response = await axios.get(url);
        const newData = Array.isArray(response.data) ? response.data : [];

        // 1. Sort the incoming data chronologically
        const sortedNewData = [...newData].sort((a, b) => {
          // First sort by Year
          if (a.fy_Cd !== b.fy_Cd) {
            return a.fy_Cd - b.fy_Cd;
          }
          // Then sort by Period (Month)
          return a.period - b.period;
        });

        // 2. Set the state
        // If you want to keep the "merge" logic but ensure the result is sorted:
        setPeriods((prevPeriods) => {
          const updatedPeriods = prevPeriods.map((prevPeriod) => {
            const updated = sortedNewData.find((n) => n.id === prevPeriod.id);
            return updated || prevPeriod;
          });

          const existingIds = new Set(updatedPeriods.map((p) => p.id));
          const additions = sortedNewData.filter((n) => !existingIds.has(n.id));

          // Merge and then Re-sort the final combined list
          return [...updatedPeriods, ...additions].sort((a, b) => {
            if (a.fy_Cd !== b.fy_Cd) return a.fy_Cd - b.fy_Cd;
            return a.period - b.period;
          });
        });

        /* NOTE: If you don't need to preserve local unsaved changes in 'prevPeriods', 
       it is much safer to just do: 
       setPeriods(sortedNewData); 
    */
      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Failed to fetch revenue data.");
        setPeriods([]);
      } finally {
        setLoading(false);
      }
    };

    //fromat date
    const safeFormatDate = (value) => {
      if (!value) return "N/A";

      // Handle YYYY-MM-DD format
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-");
        return `${month}/${day}/${year}`;
      }

      // Handle other date formats
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      } catch (e) {
        return "N/A";
      }
    };

    useEffect(() => {
      fetchRevenueData();
      setOrgId(selectedPlan?.orgId || "");
      setAcctId(
        selectedPlan?.revenueAccount ||
          selectedPlan?.acctId ||
          setupData?.revAcctId ||
          "",
      );
    }, [selectedPlan, revenueAccount, setupData]);

    const handleInputChange = (index, field, value) => {
      setHasUnsavedChanges(true);
      const updatedPeriods = periods.map((period, i) => {
        if (i === index) {
          const updatedPeriod = { ...period, [field]: value };
          if (field === "endDate" && period.id <= 0) {
            try {
              const date = new Date(value);
              if (!isNaN(date)) {
                updatedPeriod.fiscalYear = date.getFullYear().toString();
                updatedPeriod.period = (date.getMonth() + 1).toString();
              }
            } catch (e) {}
          }
          return updatedPeriod;
        }
        return period;
      });
      console.log(updatedPeriods);
      setPeriods(updatedPeriods);
    };

    const formatNumber = (value) => {
      if (value === null || value === undefined || value === "") return "0.00";

      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // const formatCurrencyInput = (value) => {
    //   const digits = value.replace(/\D/g, "");
    //   if (!digits) return "";

    //   const cents = parseInt(digits, 10);
    //   const dollars = cents / 100;

    //   return dollars.toLocaleString("en-US", {
    //     minimumFractionDigits: 2,
    //     maximumFractionDigits: 2,
    //   });
    // };

    const formatCurrencyInput = (value) => {
  if (!value) return "";

  const isNegative = value.includes("-");

  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  const cents = parseInt(digits, 10);
  const dollars = cents / 100;

  const formatted = dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-${formatted}` : formatted;
};

const formatWithCommas = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};


    // const formatCurrencyDisplay = (value) => {
    //   if (value === null || value === undefined || value === "") return "";

    //   const num = Number(String(value).replace(/,/g, ""));
    //   if (Number.isNaN(num)) return "";

    //   return num.toLocaleString("en-US", {
    //     minimumFractionDigits: 2,
    //     maximumFractionDigits: 2,
    //   });
    // };

    // const fetchSetupData = async () => {
    //   if (
    //     !selectedPlan?.projId ||
    //     !selectedPlan?.version ||
    //     !selectedPlan?.plType
    //   )
    //     return;
    //   try {
    //     const url = `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`;
    //     const response = await axios.get(url);
    //     const data = Array.isArray(response.data)
    //       ? response.data[0]
    //       : response.data;
    //     if (data) {
    //       setUseFixedRevenue(data.overrideRevAdjFl);
    //       setOverrideAdjustments(data.overrideRevSettingFl);
    //       setSetupData(data);
    //       setAcctId(
    //         selectedPlan?.revenueAccount ||
    //           selectedPlan?.acctId ||
    //           data.revAcctId ||
    //           "",
    //       );
    //     }
    //   } catch (error) {}
    // };

    // useEffect(() => {
    //   fetchSetupData();
    // }, [selectedPlan]);

    const handleSaveChekboxFlag = async () => {
      try {
        const res = await axios.post(`${backendUrl}/ProjBgtRevSetup/upsert`, {
          ...revDefData,
          overrideRevAdjFl: useFixedRevenue,
          overrideRevSettingFl: overrideAdjustments,
        });
        if (res.data) {
          getRevData();
        }
      } catch (error) {
        console.log(error);
      }
    };

    const handleSaveAll = async () => {
      if (periods.length === 0) return;

      setIsSaving(true);
      try {
        const promises = periods.map((period) => {
          // Create the unified payload
          const payload = {
            ...period,
            // Ensure the ID is handled (upsert logic)
            id: period.id,
            // Use the current state of the checkboxes
            useFixedRevenue: useFixedRevenue,
            overrideSystemAdjustment: overrideAdjustments,
            // Sanitize numeric inputs (remove commas and parse)
            revAmt:
              parseFloat(period.revAmt?.toString().replace(/,/g, "")) || 0,
            revAdj1:
              parseFloat(period.revAdj1?.toString().replace(/,/g, "")) || 0,
            actualFeeRateOnCost:
              parseFloat(
                period.actualFeeRateOnCost?.toString().replace(/,/g, ""),
              ) || 0,
            targetFeeRateOnCost:
              parseFloat(
                period.targetFeeRateOnCost?.toString().replace(/,/g, ""),
              ) || 0,
            actualFeeAmountOnCost:
              parseFloat(
                period.actualFeeAmountOnCost?.toString().replace(/,/g, ""),
              ) || 0,
            targetFeeAmountOnCost:
              parseFloat(
                period.targetFeeAmountOnCost?.toString().replace(/,/g, ""),
              ) || 0,
            // Ensure fiscal year is mapped correctly
            fiscalYear: period.fy_Cd || period.fiscalYear || "",
          };

          return axios.post(`${backendUrl}/ProjRevWrkPd/upsert`, payload);
        });

        await Promise.all(promises);
        await handleSaveChekboxFlag();

        setHasUnsavedChanges(false);
        toast.success("All revenue changes saved successfully!");

        // Refresh data to get clean state from DB
        fetchRevenueData();
      } catch (error) {
        console.error("Save Error:", error);
        toast.error("Failed to save changes.");
      } finally {
        setIsSaving(false);
      }
    };

    const handleRevAdjBlur = async (index) => {
      const period = periods[index];
      if (period.id <= 0) return;

      const payload = {
        ...period,
        id: period.id,
        useFixedRevenue: useFixedRevenue,
        overrideSystemAdjustment: overrideAdjustments,
        revAmt: parseFloat(period.revAmt) || 0,
        revAdj:
          parseFloat((period.revAdj || "").toString().replace(/,/g, "")) || 0,
        fiscalYear: period.fiscalYear || "",
      };

      try {
        await axios.post(`${backendUrl}/ProjRevWrkPd/upsert`, payload);
        toast.success("Revenue adjustment updated successfully!");
        fetchRevenueData();
      } catch (error) {
        toast.error("Failed to update revenue adjustment.");
      }
    };

    const getAccess = (access, period) => {
      // Always allow for BUD
      if (selectedPlan.plType === "BUD" && access) {
        return false;
      }

      // Only allow EAC if period end date > closed period
      if (
        selectedPlan.plType === "EAC" &&
        new Date(period.endDate) > new Date(selectedPlan.closedPeriod) &&
        access
      ) {
        return false;
      }

      return true;
    };

    // console.log(selectedPlan);

    const handleSetupCheckboxChange = (field, value) => {
      setHasUnsavedChanges(true);
      if (field === "overrideRevAmtFl") setUseFixedRevenue(value);
      if (field === "useBillBurdenRates") setOverrideAdjustments(value);

      // Also update the setupData object locally so the UI stays in sync
      if (setupData) {
        setSetupData({ ...setupData, [field]: value });
      }
    };

    // const handleSetupCheckboxChange = async (field, value) => {
    //   if (!setupData) return;
    //   const updatedSetup = { ...setupData, [field]: value };
    //   setSetupData(updatedSetup);

    //   if (field === "overrideRevAmtFl") setUseFixedRevenue(value);
    //   if (field === "useBillBurdenRates") setOverrideAdjustments(value);

    //   try {
    //     await axios.post(`${backendUrl}/ProjBgtRevSetup/upsert`, updatedSetup);
    //     toast.success("Revenue setup updated successfully!");
    //   } catch (error) {
    //     toast.error("Failed to update revenue setup.");
    //     setSetupData(setupData);
    //     if (field === "overrideRevAmtFl") setUseFixedRevenue(setupData.overrideRevAmtFl);
    //     if (field === "useBillBurdenRates") setOverrideAdjustments(setupData.useBillBurdenRates);
    //   }
    // };

    return (
      <div
        className="p-2 sm:p-4 bg-gray rounded shadow min-h-[150px] scroll-mt-16"
        
      >
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between gap-4 w-full bg-white p-2">
            {/* LEFT SIDE: IDs and Checkboxes */}
            <div className="flex flex-row items-center gap-6">
              {/* Org ID */}
              <div className="flex items-center gap-2">
                <label className="input-label">
                  Org ID:
                </label>
                <input
                  type="text"
                  className=" rounded px-1 py-[1px] w-full sm:w-24 text-sm font-normal"
                  
                  value={orgId}
                  readOnly
                />
              </div>

              {/* Acct ID */}
              <div className="flex items-center gap-2">
                <label className="input-label">
                  Acct ID:
                </label>
                <input
                  type="text"
                  className="rounded px-1 py-[1px] w-full sm:w-24 text-sm font-normal"
                  
                  value={acctId}
                  readOnly
                />
              </div>

              {/* Checkbox 1 */}
              <div className="flex items-center gap-2">
                <label className="input-label">
                  Fixed Revenue Amount
                </label>
                <input
                  type="checkbox"
                  checked={useFixedRevenue}
                  disabled={
                    !revDefData || selectedPlan?.status !== "In Progress" || !canEdit("adjustment")
                  }
                  onChange={(e) =>
                    handleSetupCheckboxChange(
                      "overrideRevAmtFl",
                      e.target.checked,
                    )
                  }
                />
              </div>

              {/* Checkbox 2 */}
              <div className="flex items-center gap-2">
                <label className="input-label">
                  Override Revenue Adjustments
                </label>
                <input
                  type="checkbox"
                  checked={overrideAdjustments}
                  disabled={
                    !revDefData || selectedPlan?.status !== "In Progress" || !canEdit("adjustment")
                  }
                  onChange={(e) =>
                    handleSetupCheckboxChange(
                      "useBillBurdenRates",
                      e.target.checked,
                    )
                  }
                />
              </div>
            </div>

            {/* RIGHT SIDE: Save Button */}
            {canEdit("adjustment") && <div>
              <button
                onClick={handleSaveAll}
                disabled={
                  isSaving || loading || selectedPlan?.status !== "In Progress"
                }
                className="btn1 btn-blue"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>}
          </div>

          <div className="w-full max-h-[400px] overflow-x-auto overflow-y-auto border-line">
            <table className="w-full table">
              <thead className="thead sticky top-0 z-10 ">
                <tr>
                  <th className="th-thead whitespace-nowrap" >
                    Fiscal Year
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Period
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    End Date
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Fixed Revenue
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Adjustment
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Override Adjustment
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Actual Fee(%)
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Target Fee(%)
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Actual Fee
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Target Fee
                  </th>
                  <th className="th-thead whitespace-nowrap" >
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="tbody border-r border-gray-300">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center p-4"
                      
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 mt-2">Loading...</span>
                    </td>
                  </tr>
                ) : periods.length > 0 ? (
                  periods.map((period, index) => {
                    const isNewRow = period.id <= 0;
                    const isOverRevAdjDisabled = getAccess(
                      overrideAdjustments,
                      period,
                    );
                    const isRevAdjDisabled = getAccess(useFixedRevenue, period);
                    console.log(isOverRevAdjDisabled);

                    return (
                      <tr key={period.id}>
                        <td className="tbody-td">
                          {isNewRow ? (
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                              
                              value={period.fiscalYear || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "fiscalYear",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            <span
                              className="text-xs font-normal"
                              
                            >
                              {period.fy_Cd}
                            </span>
                          )}
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className="w-full px-1 py-0.5 text-xs text-center"
                            // border border-gray-300 rounded
                            
                            // value={period.period || ""}
                            // onChange={(e) => handleInputChange(index, "period", e.target.value)}
                            // Format the display value: if it's 1, show 01.
                            value={
                              period.period
                                ? period.period.toString().padStart(2, "0")
                                : ""
                            }
                            onChange={(e) => {
                              // Optional: Prevent users from typing more than 2 digits
                              const val = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 2);
                              handleInputChange(index, "period", val);
                            }}
                            disabled={!isNewRow}
                          />
                        </td>
                        <td className="tbody-td">
                          {isNewRow ? (
                            <input
                              type="date"
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs"
                              
                              value={
                                period.endDate
                                  ? period.endDate.split("T")[0]
                                  : ""
                              }
                              disabled={!canEdit("adjustment")}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "endDate",
                                  e.target.value,
                                )
                              }
                            />
                          ) : (
                            <span
                              className="text-xs font-normal"
                              
                            >
                              {safeFormatDate(period.endDate)}
                            </span>
                          )}
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                              isRevAdjDisabled ||
                              selectedPlan?.status != "In Progress"
                                ? "bg-gray-200"
                                : "bg-white"
                            }`}
                            
                            // value={period.revAmt ?? ""}
                            // onChange={(e) => {
                            //   const raw = e.target.value;
                            //   // Strict number validation: only allow positive digits and one decimal point
                            //   // if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;

                            //   handleInputChange(index, "revAmt", raw);
                            // }}
                            // value={period.revAmt ?? ""}
                            value={formatWithCommas(period.revAmt)}
                            onChange={(e) => {
                            const cleanValue = e.target.value
      // allow digits, one dot, and optional leading minus
      .replace(/[^0-9.-]/g, "")
      .replace(/(?!^)-/g, "")          // minus only at start
      .replace(/(\..*?)\..*/g, "$1");  // only one decimal

    handleInputChange(index, "revAmt", cleanValue);
  }}
                            disabled={
                              isRevAdjDisabled ||
                              selectedPlan?.status != "In Progress" || !canEdit("adjustment")
                            }
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="number"
                            className={`w-full px-1 py-0.5 text-xs text-center
                          }`}
                            // border border-gray-300 rounded
                            
                            value={formatWithCommas(period.revAdj ?? "")}
                            disabled={true}
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs ${
                              isOverRevAdjDisabled ||
                              selectedPlan?.status != "In Progress"
                                ? "bg-gray-200"
                                : "bg-white"
                            }`}
                            
                            // value={formatCurrencyDisplay(period.revAdj1)}
                            // onChange={(e) => {
                            //   const raw = e.target.value;
                            //   if (raw === "") {
                            //     handleInputChange(index, "revAdj1", "");
                            //     return;
                            //   }
                            //   // Strict number validation: only allow positive digits and one decimal point
                            //   // if (!/^\d*\.?\d*$/.test(raw)) return;

                            //   handleInputChange(index, "revAdj1", raw);
                            // }}
                            // value={period.revAdj1 ?? ""}
                            value={formatWithCommas(period.revAdj1)}
                            onChange={(e) => {
                              const cleanValue = e.target.value
      // allow digits, one dot, and optional leading minus
      .replace(/[^0-9.-]/g, "")
      .replace(/(?!^)-/g, "")          // minus only at start
      .replace(/(\..*?)\..*/g, "$1"); 
                              handleInputChange(index, "revAdj1", cleanValue);
                            }}
                            disabled={
                              isOverRevAdjDisabled ||
                              selectedPlan?.status != "In Progress" || !canEdit("adjustment")
                            }
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className="w-full px-1 py-0.5 text-xs text-center"
                            
                            value={formatWithCommas(
                              period.actualFeeRateOnCost || "",
                            )}
                            // onChange={(e) =>
                            //   handleInputChange(index, "actualFeeRateOnCost", e.target.value)
                            // }
                            // disabled={!isNewRow}
                            disabled
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className="w-full px-1 py-0.5 text-xs text-center"
                            
                            value={formatWithCommas(
                              period.targetFeeRateOnCost || "",
                            )}
                            // onChange={(e) =>
                            //   handleInputChange(index, "targetFeeRateOnCost", e.target.value)
                            // }
                            // disabled={!isNewRow}
                            disabled
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className="w-full px-1 py-0.5 text-xs text-center"
                            
                            value={formatWithCommas(
                              period.actualFeeAmountOnCost || "",
                            )}
                            // onChange={(e) =>
                            //   handleInputChange(index, "actualFeeAmountOnCost", e.target.value)
                            // }
                            // disabled={!isNewRow}
                            disabled
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className="w-full px-1 py-0.5 text-xs text-center"
                            
                            value={formatWithCommas(
                              period.targetFeeAmountOnCost || "",
                            )}
                            // onChange={(e) =>
                            //   handleInputChange(index, "targetFeeAmountOnCost", e.target.value)
                            // }
                            // disabled={!isNewRow}
                            disabled
                          />
                        </td>
                        <td className="tbody-td">
                          <input
                            type="text"
                            className={`w-full border border-gray-300 rounded px-1 py-0.5 text-xs `}
                            
                            value={period.revDesc || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "revDesc",
                                e.target.value,
                              )
                            }
                            disabled={!canEdit("adjustment")}
                            // disabled={!isNewRow}
                            // disabled={}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center p-4"
                      
                    >
                      No revenue ceiling data found for this plan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
);

export default RevenueCeilingComponent;
