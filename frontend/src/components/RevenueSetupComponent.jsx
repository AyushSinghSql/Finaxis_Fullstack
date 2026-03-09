import React, {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";

const RevenueSetupComponent = forwardRef(
  ({ selectedPlan, revenueAccount }, ref) => {
    const [atRiskValue, setAtRiskValue] = useState("");
    const [revenueType, setRevenueType] = useState("");
    const [revenueAccountState, setRevenueAccountState] = useState("");
    const [labFeeRt, setLabFeeRt] = useState("");
    const [nonLabFeeRt, setNonLabFeeRt] = useState("");
    const [revenueFormula, setRevenueFormula] = useState("");
    const [formulaOptions, setFormulaOptions] = useState([]);
    const [labCostFl, setLabCostFl] = useState(false);
    const [labBurdFl, setLabBurdFl] = useState(false);
    const [labFeeCostFl, setLabFeeCostFl] = useState(false);
    const [labFeeHrsFl, setLabFeeHrsFl] = useState(false);
    const [labTmFl, setLabTmFl] = useState(false);
    const [nonLabCostFl, setNonLabCostFl] = useState(false);
    const [nonLabBurdFl, setNonLabBurdFl] = useState(false);
    const [nonLabFeeCostFl, setNonLabFeeCostFl] = useState(false);
    const [nonLabFeeHrsFl, setNonLabFeeHrsFl] = useState(false);
    const [nonLabTmFl, setNonLabTmFl] = useState(false);
    const [overrideFundingCeilingFl, setOverrideFundingCeilingFl] =
      useState(false);
    const [overrideSettingsFl, setOverrideSettingsFl] = useState(false);
    const [overrideRevAdjustmentsFl, setOverrideRevAdjustmentsFl] =
      useState(false);
    const [useFixedRevenueFl, setUseFixedRevenueFl] = useState(false);
    const [setupId, setSetupId] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [dbData, setDbData] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // const geistSansStyle = {
    //   fontFamily: "'Geist', 'Geist Fallback', sans-serif",
    // };

    // Expose the check to the parent via ref
    useImperativeHandle(ref, () => ({
      hasUnsavedChanges: () => hasUnsavedChanges,
    }));

    // Browser-level alert logic
    // useEffect(() => {
    //   const handleBeforeUnload = (e) => {
    //     if (hasUnsavedChanges) {
    //       e.preventDefault();
    //       e.returnValue = "Unsaved changes will be lost.";
    //     }
    //   };
    //   window.addEventListener("beforeunload", handleBeforeUnload);
    //   return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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

      // 2. Handles Internal Tab Switching / Link Clicks
      const handleInternalClick = (e) => {
        if (hasUnsavedChanges) {
          // Find if the clicked element is a link or a button meant for navigation
          const target = e.target.closest("a") || e.target.closest("button");

          if (target?.dataset?.saveButton === "true") {
      return;
    }

          // You can refine this check if your tab buttons have specific classes/attributes
          // e.g., e.target.closest('.tab-button')
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
      // Use 'true' for capture phase to catch the event before other logic fires
      document.addEventListener("click", handleInternalClick, true);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("click", handleInternalClick, true);
      };
    }, [hasUnsavedChanges]);

    useEffect(() => {
      // Only auto-apply settings if we have a formula and the override is turned on
      if (revenueFormula && overrideSettingsFl) {
        applyFormulaSettings(revenueFormula);
      }
    }, [overrideSettingsFl, revenueFormula]);

    // Helper to determine if a field is disabled based on formula
    // This matches the logic in your JSX 'disabled' attributes

    const isDisabled = (field, formula) => {
      // If plan is not in progress OR override settings is NOT checked, disable everything
      if (selectedPlan?.status !== "In Progress" || !overrideSettingsFl)
        return true;

      if (!formula) return false;

      const LLR_FAMILY = ["LLR", "LLRCINLB", "LLRCINL", "LLRCINBF", "LLRFNLBF"];

      switch (field) {
        case "labCost":
          return LLR_FAMILY.includes(formula);
        case "labBurd":
          return LLR_FAMILY.includes(formula);
        case "labFeeCost":
          return formula === "CPFH" || LLR_FAMILY.slice(0, 4).includes(formula);
        case "labFeeHrs":
          return (
            formula === "CPFC" ||
            formula === "CPFF" ||
            LLR_FAMILY.includes(formula)
          );
        case "labFeeRt":
          return LLR_FAMILY.slice(0, 4).includes(formula);
        case "labTm":
          return ["CPFC", "CPFH", "CPFF"].includes(formula);

        case "nonLabCost":
          return formula === "LLR";
        case "nonLabBurd":
          return formula === "LLR" || formula === "LLRCINL";
        case "nonLabFeeCost":
          return (
            formula === "CPFH" ||
            formula === "LLR" ||
            formula === "LLRCINLB" ||
            formula === "LLRCINL"
          );
        case "nonLabFeeHrs":
          return (
            formula === "CPFC" ||
            formula === "CPFF" ||
            formula === "CPFH" ||
            LLR_FAMILY.includes(formula)
          );
        case "nonLabFeeRt":
          return (
            formula === "LLR" ||
            formula === "LLRCINLB" ||
            formula === "CPFH" ||
            formula === "LLRCINL"
          );
        case "nonLabTm":
          return [
            "CPFC",
            "CPFH",
            "CPFF",
            "LLRCINLB",
            "LLRCINL",
            "LLRCINBF",
            "LLR",
            "  LLRFNLBF",
          ].includes(formula);

        default:
          return false;
      }
    };

    const applyFormulaSettings = (selectedFormula) => {
      // If selecting the formula already saved in DB, restore those specific values
      if (dbData && dbData.revType === selectedFormula) {
        setLabCostFl(!!dbData.labCostFl);
        setLabBurdFl(!!dbData.labBurdFl);
        setLabFeeCostFl(!!dbData.labFeeCostFl);
        setLabFeeHrsFl(!!dbData.labFeeHrsFl);
        setLabFeeRt(dbData.labFeeRt?.toFixed(5) || "");
        setLabTmFl(!!dbData.labTmFl);
        setNonLabCostFl(!!dbData.nonLabCostFl);
        setNonLabBurdFl(!!dbData.nonLabBurdFl);
        setNonLabFeeCostFl(!!dbData.nonLabFeeCostFl);
        setNonLabFeeHrsFl(!!dbData.nonLabFeeHrsFl);
        setNonLabFeeRt(dbData.nonLabFeeRt?.toFixed(5) || "");
        setNonLabTmFl(!!dbData.nonLabTmFl);
      } else {
        // NEW FORMULA: Auto-check if NOT disabled, otherwise false
        setLabCostFl(!isDisabled("labCost", selectedFormula));
        setLabBurdFl(!isDisabled("labBurd", selectedFormula));
        setLabFeeCostFl(!isDisabled("labFeeCost", selectedFormula));
        setLabFeeHrsFl(!isDisabled("labFeeHrs", selectedFormula));
        setLabTmFl(!isDisabled("labTm", selectedFormula));

        setNonLabCostFl(!isDisabled("nonLabCost", selectedFormula));
        setNonLabBurdFl(!isDisabled("nonLabBurd", selectedFormula));
        setNonLabFeeCostFl(!isDisabled("nonLabFeeCost", selectedFormula));
        setNonLabFeeHrsFl(!isDisabled("nonLabFeeHrs", selectedFormula));
        setNonLabTmFl(!isDisabled("nonLabTm", selectedFormula));

        // Reset rates to empty for new formulas
        setLabFeeRt("");
        setNonLabFeeRt("");
      }
    };

    // const handleFeeRateChange = (value, setter) => {
    //   if (value === "" || (/^\d*\.?\d*$/.test(value) && (value.match(/\./g) || []).length <= 1)) {
    //     const numValue = parseFloat(value);
    //     if (isNaN(numValue) || (numValue >= 0 && numValue <= 100)) {
    //       setter(value);
    //     } else {
    //       toast.warning("Fee Rate % cannot exceed 100%");
    //     }
    //   }
    // };
const handleFeeRateChange = (value, setter) => {
  if (value === "") {
    setter("");
    return;
  }

  // allow typing just "-"
  if (value === "-") {
    setter(value);
    return;
  }

  // allow digits, dot, and minus
  if (/[^0-9.-]/.test(value)) return;

  // minus only at start
  if ((value.match(/-/g) || []).length > 1 || (value.includes("-") && value[0] !== "-")) return;

  // only one decimal point
  if ((value.match(/\./g) || []).length > 1) return;

  // prevent leading zero like 01 or -01
  if (/^-?0\d/.test(value)) return;

  const numValue = parseFloat(value);

  // CPFF → allow negative & positive
  // Others → 0 to 100 only
  const isValid =
    revenueFormula === "CPFF"
      ? !isNaN(numValue)
      : !isNaN(numValue) && numValue >= 0 && numValue <= 100;

  if (isValid) {
    setter(value);
    setHasUnsavedChanges(true);
  } else if (!isNaN(numValue) && numValue > 100) {
    toast.warning("Fee Rate % cannot exceed 100%", {
      toastId: "fee-rate-limit-warning",
      autoClose: 3000,
    });
  }
};


    // const handleFeeRateChange = (value, setter) => {
    //   if (value === "") {
    //     setter("");
    //     return;
    //   }

    //   if (/[^\d.]/.test(value)) return;
    //   if ((value.match(/\./g) || []).length > 1) return;
    //   if (/^0\d/.test(value)) return;

    //   const numValue = parseFloat(value);

    //   // If formula is CPFF, allow any number >= 0. Otherwise, cap at 100.
    //   const isValid =
    //     revenueFormula === "CPFF"
    //       ? !isNaN(numValue)
    //       : !isNaN(numValue) && numValue >= 0 && numValue <= 100;

    //   if (isValid) {
    //     setter(value);
    //     setHasUnsavedChanges(true);
    //   } else if (!isNaN(numValue) && numValue > 100) {
    //     toast.warning("Fee Rate % cannot exceed 100%", {
    //       toastId: "fee-rate-limit-warning",
    //       autoClose: 3000,
    //     });
    //   }
    // };

    useEffect(() => {
      axios
        .get(`${backendUrl}/RevFormula`)
        .then((res) => setFormulaOptions(res.data))
        .catch(() => {});

      if (selectedPlan?.projId && selectedPlan?.version) {
        axios
          .get(
            `${backendUrl}/ProjBgtRevSetup/GetByProjectId/${selectedPlan.projId}/${selectedPlan.version}/${selectedPlan.plType}`,
          )
          .then((response) => {
            const data = response.data;
            setDbData(data);
            setSetupId(data.id || 0);
            setRevenueFormula(data.revType || "");
            setRevenueType(data.revType || "");
            setAtRiskValue(Number(data.atRiskAmt).toLocaleString());
            setRevenueAccountState(data.revAcctId || revenueAccount || "");
            setLabFeeRt(data.labFeeRt?.toFixed(5) || "");
            setNonLabFeeRt(data.nonLabFeeRt?.toFixed(5) || "");
            setLabCostFl(!!data.labCostFl);
            setLabBurdFl(!!data.labBurdFl);
            setLabFeeCostFl(!!data.labFeeCostFl);
            setLabFeeHrsFl(!!data.labFeeHrsFl);
            setLabTmFl(!!data.labTmFl);
            setNonLabCostFl(!!data.nonLabCostFl);
            setNonLabBurdFl(!!data.nonLabBurdFl);
            setNonLabFeeCostFl(!!data.nonLabFeeCostFl);
            setNonLabFeeHrsFl(!!data.nonLabFeeHrsFl);
            setNonLabTmFl(!!data.nonLabTmFl);
            setOverrideFundingCeilingFl(!!data.overrideFundingCeilingFl);
            setOverrideSettingsFl(!!data.overrideRevSettingFl);
            setOverrideRevAdjustmentsFl(!!data.useBillBurdenRates);
            setUseFixedRevenueFl(!!data.overrideRevAmtFl);
          })
          .catch(() => setDbData(null));
      }
    }, [selectedPlan, revenueAccount]);

    const handleSave = () => {
      if (!revenueFormula) return toast.error("Please select revenue formula");

      const payload = {
        id: setupId,
        projId: selectedPlan?.projId || "",
        plId: selectedPlan?.plId || "",
        revType: revenueFormula,
        revAcctId: revenueAccountState,
        labCostFl,
        labBurdFl,
        labFeeCostFl,
        labFeeHrsFl,
        labTmFl,
        labFeeRt: parseFloat(labFeeRt) || 0,
        nonLabCostFl,
        nonLabBurdFl,
        nonLabFeeCostFl,
        nonLabFeeHrsFl,
        nonLabTmFl,
        nonLabFeeRt: parseFloat(nonLabFeeRt) || 0,
        useBillBurdenRates: overrideRevAdjustmentsFl,
        overrideFundingCeilingFl,
        overrideRevAmtFl: useFixedRevenueFl,
        overrideRevSettingFl: overrideSettingsFl,
        atRiskAmt: parseFloat(atRiskValue.replace(/,/g, "")) || 0,
        versionNo: selectedPlan?.version || 0,
        bgtType: selectedPlan?.plType || "",
        modifiedBy: "user",
        timeStamp: new Date().toISOString(),
      };

      setIsSaving(true);
      axios
        .post(`${backendUrl}/ProjBgtRevSetup/upsert`, payload)
        .then(() => {
          setHasUnsavedChanges(false);
          toast.success("Data saved successfully!");
        })
        .catch((err) => toast.error("Failed to save"))
        .finally(() => setIsSaving(false));
    };

   const formatWithCommas = (val) => {
  if (!val) return "";
  const [intPart, decPart] = val.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};


    return (
      <div
        className="p-2 sm:p-4 bg-gray rounded shadow min-h-[150px] scroll-mt-16"
      >
        <div className="flex flex-col justify-between space-y-1">
          {/* <div>
          <label className="text-sm font-normal">Revenue Formula</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm font-normal mt-1"
            value={revenueFormula}
            onChange={(e) => {
              const newFormula = e.target.value;
              setRevenueFormula(newFormula);
              setRevenueType(newFormula);
              // 1. Reset all table checkboxes and rates first
              applyFormulaSettings(newFormula);
            }}
            disabled={selectedPlan?.status !== "In Progress"}
            style={geistSansStyle}
          >
            <option value="">---------Select----------</option>
            {formulaOptions.map((option) => (
              <option key={option.formulaCd} value={option.formulaCd}>
                {option.formulaDesc}
              </option>
            ))}
          </select>
        </div> */}
          <div className="flex items-center space-x-2">
            <label className="input-label">
              Revenue Formula :
            </label>
            <select
              className="input-style w-[350px]"
              value={revenueFormula}
              onChange={(e) => {
                const newFormula = e.target.value;
                setRevenueFormula(newFormula);
                setRevenueType(newFormula);
                // 1. Reset all table checkboxes and rates first
                applyFormulaSettings(newFormula);
                setHasUnsavedChanges(true);
              }}
              disabled={selectedPlan?.status !== "In Progress"}

            >
              <option value="">---------Select----------</option>
              {formulaOptions.map((option) => (
                <option key={option.formulaCd} value={option.formulaCd}>
                  {option.formulaDesc}
                </option>
              ))}
            </select>
            <div className="flex justify-end w-full mb-2">
            <button
              className="btn1 btn-blue cursor-pointer"
              data-save-button="true"
              // style={{ ...geistSansStyle, backgroundColor: "#113d46" }}
              onClick={handleSave}
              disabled={isSaving || selectedPlan?.status !== "In Progress"}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="input-label">
              Override Funding Ceiling
            </label>
            <input
              type="checkbox"
              className="text-sm font-normal"
              checked={overrideFundingCeilingFl}
              disabled={
                selectedPlan?.status !== "In Progress" || !revenueFormula
              }
              onChange={(e) => {
                setOverrideFundingCeilingFl(e.target.checked);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="input-label">
              Override Settings
            </label>
            <input
              type="checkbox"
              className="text-sm font-normal"
              checked={overrideSettingsFl}
              disabled={
                selectedPlan?.status !== "In Progress" || !revenueFormula
              }
              onChange={(e) => {
                setOverrideSettingsFl(e.target.checked);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <label className="input-label">At Risk Value</label>
              <input
                type="text"
                className={`border border-gray-300 rounded px-1 py-[1px] w-full sm:w-24 text-sm font-normal ${
                  !overrideFundingCeilingFl
                    ? "bg-gray-200 cursor-not-allowed"
                    : ""
                }`}
                value={formatWithCommas(atRiskValue)}
                // onChange={(e) => {
                //   const rawDigits = e.target.value.replace(/\D/g, "");
                //   // if (rawDigits === "") {
                //   //   setAtRiskValue("");
                //   //   return;
                //   // }
                //   // const cents = parseInt(rawDigits, 10);
                //   // const dollars = cents / 100;
                //   // const formatted = dollars.toLocaleString("en-US", {
                //   //   minimumFractionDigits: 2,
                //   //   maximumFractionDigits: 2,
                //   // });
                //   setAtRiskValue(rawDigits);
                //   setHasUnsavedChanges(true);
                // }}
                 onChange={(e) => {
    const input = e.target.value;

    // remove commas for processing
    const raw = input.replace(/,/g, "");

    // allow numbers with optional decimal
    if (!/^\d*\.?\d*$/.test(raw)) return;

    setAtRiskValue(raw);
    setHasUnsavedChanges(true);
  }}
                // disabled={!overrideFundingCeilingFl}
                disabled={
                  selectedPlan?.status !== "In Progress" ||
                  !overrideFundingCeilingFl ||
                  !revenueFormula
                }
              />
            </div>

            <div className="flex-1">
              <label className="text-sm font-normal mr-2">
                Revenue Account:
              </label>
              <span className="text-sm font-normal">{revenueAccountState}</span>
            </div>
            
          </div>

          <div className="rounded border border-gray-300 overflow-hidden">
            <table className="w-full table sm:w-auto">
              <tbody className="tbody">
                <tr>
                  <td className="th-thead"></td>
                  <td className="th-thead">
                    Rev on Cost
                  </td>
                  <td className="th-thead">
                    Rev on Burden
                  </td>
                  <td className="th-thead">
                    Fee on Cost/Burden
                  </td>
                  <td className="th-thead">
                    Fee on Hours
                  </td>
                  <td className="th-thead">
                    Fee Rate
                  </td>
                  <td className="th-thead">
                    Use T&M Rates
                  </td>
                </tr>
                <tr>
                  <td
                    className="tbody-td-fun font-normal "
                  >
                    Labor
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={labCostFl}
                      onChange={(e) => {
                        setLabCostFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("labCost", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={labBurdFl}
                      onChange={(e) => {
                        setLabBurdFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("labBurd", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={labFeeCostFl}
                      onChange={(e) => {
                        setLabFeeCostFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("labFeeCost", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={labFeeHrsFl}
                      onChange={(e) => {
                        setLabFeeHrsFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("labFeeHrs", revenueFormula)}
                    />
                  </td>

                  <td className="tbody-td font-normal">
                    <input
                      type="text"
                      className="w-16 border border-gray-300 rounded text-center disabled:bg-gray-200"
                      value={labFeeRt}
                      onChange={(e) => {
                        handleFeeRateChange(e.target.value, setLabFeeRt);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("labFeeRt", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={labTmFl}
                      onChange={(e) => {
                        setLabTmFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("labTm", revenueFormula)}
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    className="tbody-td-fun font-normal"
                  >
                    Non-Labor
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={nonLabCostFl}
                      onChange={(e) => {
                        setNonLabCostFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("nonLabCost", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={nonLabBurdFl}
                      onChange={(e) => {
                        setNonLabBurdFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("nonLabBurd", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={nonLabFeeCostFl}
                      onChange={(e) => {
                        setNonLabFeeCostFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("nonLabFeeCost", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={nonLabFeeHrsFl}
                      onChange={(e) => {
                        setNonLabFeeHrsFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("nonLabFeeHrs", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="text"
                      className="w-16 border border-gray-300 rounded  text-center disabled:bg-gray-200"
                      value={nonLabFeeRt}
                      onChange={(e) => {
                        handleFeeRateChange(e.target.value, setNonLabFeeRt);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("nonLabFeeRt", revenueFormula)}
                    />
                  </td>
                  <td className="tbody-td font-normal">
                    <input
                      type="checkbox"
                      checked={nonLabTmFl}
                      onChange={(e) => {
                        setNonLabTmFl(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isDisabled("nonLabTm", revenueFormula)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* <div className="flex justify-end w-full mb-2">
            <button
              className="btn1 btn-blue cursor-pointer"
              data-save-button="true"
              // style={{ ...geistSansStyle, backgroundColor: "#113d46" }}
              onClick={handleSave}
              disabled={isSaving || selectedPlan?.status !== "In Progress"}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div> */}
        </div>
      </div>
    );
  },
);

export default RevenueSetupComponent;
 