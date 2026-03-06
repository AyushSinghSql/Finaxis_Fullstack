import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { data } from "react-router-dom";
import { backendUrl } from "./config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AnalysisByPeriodContent = ({
  onCancel,
  planID,
  templateId,
  type,
  initialApiData,
  isLoading,
  error,
  fiscalYear,
}) => {
  const [expandedStaffRows, setExpandedStaffRows] = useState([]);
  const [expandedEmployeeDetails, setExpandedEmployeeDetails] = useState([]);
  const [expandedNonLaborAcctRows, setExpandedNonLaborAcctRows] = useState([]); // State for non-labor account expansion
  const [financialData, setFinancialData] = useState([]);
  const [revenueSum, setRevenueSum] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  const [allApiData, setAllApiData] = useState(null); // This will now hold the fiscalYear-filtered data
  const [dynamicDateRanges, setDynamicDateRanges] = useState([]);

  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [availableOrgIds, setAvailableOrgIds] = useState([]);

  const [selectedRevenueView, setSelectedRevenueView] = useState("t&m");

  // Replace your existing getMonthRangeKey function with this one
  function getMonthRangeKey(period, year) {
    // Add this check to prevent crashes if period or year are missing
    if (period === undefined || year === undefined) {
      return null;
    }
    const month = String(period).padStart(2, "0");
    const monthRange = `${month}/${year}`;
    return monthRange;
  }
  

  function calculateTotalRevenue() {
    let monthlyRevenueSummary = initialApiData.monthlyRevenueSummary;
    if (!Array.isArray(monthlyRevenueSummary)) return 0;

    if (!Array.isArray(monthlyRevenueSummary)) {
      setRevenueSum(0);
      return;
    }

    const monthlyTotal = monthlyRevenueSummary
      .filter((item) => {
        if (fiscalYear === "All") return true;
        return item.year <= Number(fiscalYear);
      })
      .reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);
    const total = monthlyTotal + initialApiData.revenue;
    setRevenueSum(total);
  }

  useEffect(() => {
    if (initialApiData) calculateTotalRevenue();
  }, [fiscalYear, initialApiData]);

  // const transformApiDataToFinancialRows = useCallback(
  //   (
  //     apiResponse,
  //     currentOrgId,
  //     dynamicDateRanges,
  //     selectedRevenueView,
  //     planType,
  //   ) => {
  //     const financialRows = [];

  //     // Initialize totals
  //     const monthlyRevenueData = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );
  //     const totalExpenseData = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );
  //     const profitData = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );
  //     const profitOnCostData = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );
  //     const profitOnRevenueData = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );
  //     const totalStaffCostByMonth = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );
  //     const totalNonLaborCostByMonth = dynamicDateRanges.reduce(
  //       (acc, range) => ({ ...acc, [range]: 0 }),
  //       {},
  //     );

  //     // const totalRevenueOverall = apiResponse.revenue || 0;

  //     //       const monthlyRevenueTotal = Object.values(monthlyRevenueData).reduce(
  //     //   (s, v) => s + v,
  //     //   0
  //     // );

  //     // Match calculateTotalRevenue()
  //     // const totalRevenueOverall =
  //     //   (apiResponse.revenue || 0) + monthlyRevenueTotal;

  //     // Monthly Revenue + Staff/Non-Labor cost
  //     const monthlyRevenueSummary = apiResponse.monthlyRevenueSummary || [];
  //     monthlyRevenueSummary.forEach((monthData) => {
  //       const monthRange = getMonthRangeKey(monthData.month, monthData.year);
  //       if (monthRange && dynamicDateRanges.includes(monthRange)) {
  //         monthlyRevenueData[monthRange] = monthData.revenue || 0;

  //         const staffCost = monthData.cost || 0;
  //         const nonLaborCost = monthData.otherDifrectCost || 0;

  //         totalStaffCostByMonth[monthRange] = staffCost;
  //         totalNonLaborCostByMonth[monthRange] = nonLaborCost;

  //         totalExpenseData[monthRange] = staffCost + nonLaborCost;
  //       }
  //     });

  //     // ✅ CTD Revenue = base revenue + monthly revenue
  //     const monthlyRevenueTotal = Object.values(monthlyRevenueData).reduce(
  //       (s, v) => s + v,
  //       0,
  //     );

  //     const totalRevenueOverall =
  //       (apiResponse.revenue || 0) + monthlyRevenueTotal;

  //     // ✅ CTD Expenses
  //     const totalStaffCostOverall = Object.values(totalStaffCostByMonth).reduce(
  //       (s, v) => s + v,
  //       0,
  //     );

  //     const totalNonLaborCostOverall = Object.values(
  //       totalNonLaborCostByMonth,
  //     ).reduce((s, v) => s + v, 0);

  //     const totalExpenseOverall = Object.values(totalExpenseData).reduce(
  //       (s, v) => s + v,
  //       0,
  //     );

  //     // ✅ CTD Profit (FIX)
  //     const totalProfitOverall = totalRevenueOverall - totalExpenseOverall;

  //     // const totalStaffCostOverall = Object.values(totalStaffCostByMonth).reduce(
  //     //   (s, v) => s + v,
  //     //   0
  //     // );
  //     // const totalNonLaborCostOverall = Object.values(
  //     //   totalNonLaborCostByMonth
  //     // ).reduce((s, v) => s + v, 0);
  //     // const totalExpenseOverall = Object.values(totalExpenseData).reduce(
  //     //   (s, v) => s + v,
  //     //   0
  //     // );
  //     // const totalProfitOverall =
  //     //   totalRevenueOverall === 0
  //     //     ? 0
  //     //     : totalRevenueOverall - totalExpenseOverall;
  //     // const totalProfitOverall = totalRevenueOverall - totalExpenseOverall;
  //     // ✅ Use Map for unique employees

  //     const uniqueEmployeesMap = new Map();

  //     const filteredEmployeeSummaries = (
  //       apiResponse.employeeForecastSummary || []
  //     ).filter((empSummary) => {
  //       const isOrgMatch = currentOrgId
  //         ? empSummary.orgID === currentOrgId
  //         : true;
  //       return isOrgMatch;
  //     });

  //     if (filteredEmployeeSummaries.length > 0) {
  //       filteredEmployeeSummaries.forEach((empSummary) => {
  //         // 🔥 NEW: create composite key instead of just emplId
  //         const compositeKey = `${empSummary.emplId}-${empSummary.plcCode}-${empSummary.orgId}-${empSummary.accID}`;

  //         if (!uniqueEmployeesMap.has(compositeKey)) {
  //           uniqueEmployeesMap.set(compositeKey, {
  //             // 🔥 Changed from emplId → compositeKey
  //             id: compositeKey,
  //             // 🔥 Changed: display emplId + plcCode for clarity
  //             name: `${empSummary.name} (${empSummary.emplId}) (${empSummary.plcCode})`,
  //             cost: 0,
  //             accountId: empSummary.accID || "",
  //             orgId: empSummary.orgId || "",
  //             glcPlc: empSummary.plcCode || "",
  //             hrlyRate: empSummary.perHourRate || 0,
  //             monthlyHours: {},
  //             monthlyCost: {},

  //             // 🔥 new breakdown fields
  //             monthlyRawCost: {},
  //             monthlyFringe: {},
  //             monthlyOverhead: {},
  //             monthlyGna: {},

  //             detailSummary: {},
  //           });
  //         }

  //         // 🔥 Changed: get employee by compositeKey instead of emplId
  //         const employee = uniqueEmployeesMap.get(compositeKey);

  //         const payrollSalaries = empSummary.emplSchedule?.payrollSalary || [];
  //         payrollSalaries.forEach((salaryEntry) => {
  //           const monthRange = getMonthRangeKey(
  //             salaryEntry.month,
  //             salaryEntry.year,
  //           );

  //           if (monthRange && dynamicDateRanges.includes(monthRange)) {
  //             // 🔥 Changed: split into raw / fringe / overhead / gna
  //             employee.monthlyRawCost[monthRange] =
  //               (employee.monthlyRawCost[monthRange] || 0) +
  //               (salaryEntry.cost || 0);
  //             employee.monthlyFringe[monthRange] =
  //               (employee.monthlyFringe[monthRange] || 0) +
  //               (salaryEntry.fringe || 0);
  //             employee.monthlyOverhead[monthRange] =
  //               (employee.monthlyOverhead[monthRange] || 0) +
  //               (salaryEntry.overhead || 0);
  //             employee.monthlyGna[monthRange] =
  //               (employee.monthlyGna[monthRange] || 0) + (salaryEntry.gna || 0);

  //             // total burdened cost
  //             employee.monthlyCost[monthRange] =
  //               (employee.monthlyCost[monthRange] || 0) +
  //               (salaryEntry.totalBurdenCost || 0);

  //             // hours
  //             employee.monthlyHours[monthRange] =
  //               (employee.monthlyHours[monthRange] || 0) +
  //               (salaryEntry.hours || 0);

  //             // 🔥 Updated detailSummary to align with UI rows
  //             if (!employee.detailSummary["Raw Cost"])
  //               employee.detailSummary["Raw Cost"] = {};
  //             employee.detailSummary["Raw Cost"][monthRange] =
  //               (employee.detailSummary["Raw Cost"][monthRange] || 0) +
  //               (salaryEntry.cost || 0);

  //             if (!employee.detailSummary["Fringe Benefits"])
  //               employee.detailSummary["Fringe Benefits"] = {};
  //             employee.detailSummary["Fringe Benefits"][monthRange] =
  //               (employee.detailSummary["Fringe Benefits"][monthRange] || 0) +
  //               (salaryEntry.fringe || 0);

  //             if (!employee.detailSummary["Overhead"])
  //               employee.detailSummary["Overhead"] = {};
  //             employee.detailSummary["Overhead"][monthRange] =
  //               (employee.detailSummary["Overhead"][monthRange] || 0) +
  //               (salaryEntry.overhead || 0);

  //             if (!employee.detailSummary["General & Admin"])
  //               employee.detailSummary["General & Admin"] = {};
  //             employee.detailSummary["General & Admin"][monthRange] =
  //               (employee.detailSummary["General & Admin"][monthRange] || 0) +
  //               (salaryEntry.gna || 0);

  //             if (!employee.detailSummary["Human Resource"])
  //               employee.detailSummary["Human Resource"] = {};
  //             employee.detailSummary["Human Resource"][monthRange] =
  //               (employee.detailSummary["Human Resource"][monthRange] || 0) +
  //               (salaryEntry.hr || 0);

  //             if (!employee.detailSummary["Material"])
  //               employee.detailSummary["Material"] = {};
  //             employee.detailSummary["Material"][monthRange] =
  //               (employee.detailSummary["Material"][monthRange] || 0) +
  //               (salaryEntry.materials || 0);
  //           }
  //         });
  //       });
  //     }

  //     // ---------- NON-LABOR ----------
  //     const nonLaborAcctDetailsMap = new Map();
  //     const allNonLaborSummariesFiltered = [
  //       ...(apiResponse.directCOstForecastSummary || []),
  //       ...(apiResponse.indirectCostForecastSummary || []),
  //     ].filter((n) => (currentOrgId ? n.orgID === currentOrgId : true));

  //     allNonLaborSummariesFiltered.forEach((nonLaborSummary) => {
  //       const schedules =
  //         nonLaborSummary.directCostSchedule?.forecasts ||
  //         nonLaborSummary.indirectCostSchedule?.forecasts ||
  //         [];
  //       const accountId = nonLaborSummary.accID;
  //       const orgId = nonLaborSummary.orgID;
  //       const glcPlc = nonLaborSummary.plcCode || "";
  //       const accName = nonLaborSummary.accName || `Account: ${accountId}`;
  //       const gna = nonLaborSummary.gna || 0;
  //       const materials = nonLaborSummary.materials || 0;
  //       const overheadName = nonLaborSummary.overheadName || "Overhead";
  //       const gnaName = nonLaborSummary.gnaName || "General & Admin";
  //       const materialsName = nonLaborSummary.materialsName || "Material";
  //       const hrName = nonLaborSummary.hrName || "Human Resource";
  //       const fringeName = nonLaborSummary.fringeName || "Fringe";
  //       const hr = nonLaborSummary.hr || 0;
  //       const fringe = nonLaborSummary.fringe || 0;
  //       const overhead = nonLaborSummary.overhead || 0;

  //       // console.log('gna ', gna)
  //       // console.log('materials ', materials)
  //       // console.log('overhead ', overhead)
  //       // console.log('fringe ', fringe)

  //       if (!nonLaborAcctDetailsMap.has(accountId)) {
  //         nonLaborAcctDetailsMap.set(accountId, {
  //           id: accountId,
  //           description: accName,
  //           orgId: orgId,
  //           glcPlc: glcPlc,
  //           overheadName,
  //           gnaName,
  //           materialsName,
  //           hrName,
  //           fringeName,
  //           total: 0,
  //           monthlyData: dynamicDateRanges.reduce(
  //             (acc, range) => ({ ...acc, [range]: 0 }),
  //             {},
  //           ),
  //           employees: new Map(),
  //         });
  //       }
  //       const acctGroup = nonLaborAcctDetailsMap.get(accountId);
  //       const employeeId = nonLaborSummary.emplId || "N/A_Employee";
  //       const employeeName = nonLaborSummary.name || ` ${accountId}`;

  //       if (!acctGroup.employees.has(employeeId)) {
  //         acctGroup.employees.set(employeeId, {
  //           id: employeeId,
  //           name: `${employeeName} (${employeeId})`,
  //           total: 0,
  //           gna: gna,
  //           materials: materials,
  //           hr: hr,
  //           fringe: fringe,
  //           overheadName,
  //           gnaName,
  //           materialsName,
  //           hrName,
  //           fringeName,
  //           overhead: overhead,
  //           monthlyData: dynamicDateRanges.reduce(
  //             (acc, range) => ({ ...acc, [range]: 0 }),
  //             {},
  //           ),
  //           entries: [],
  //         });
  //       }
  //       const employeeGroup = acctGroup.employees.get(employeeId);

  //       schedules.forEach((scheduleEntry) => {
  //         const monthRange = getMonthRangeKey(
  //           scheduleEntry.month,
  //           scheduleEntry.year,
  //         );
  //         if (monthRange && dynamicDateRanges.includes(monthRange)) {
  //           let entryCost = 0;
  //           let burden = scheduleEntry.burden;
  //           if (planType === "EAC") {
  //             entryCost = scheduleEntry.actualamt || 0;
  //           } else if (planType === "BUD") {
  //             entryCost = scheduleEntry.forecastedamt  || 0;
  //           } else {
  //             entryCost =
  //               (scheduleEntry.cost || 0) +
  //               (scheduleEntry.fringe || 0) +
  //               (scheduleEntry.overhead || 0) +
  //               (scheduleEntry.gna || 0) +
  //               (scheduleEntry.materials || 0);
  //           }
  //           // determine names from scheduleEntry (preferred) or fall back to employee/account-level names
  //           const entryOverheadName =
  //             scheduleEntry.overheadName || employeeGroup.overheadName || overheadName;
  //           const entryGnaName =
  //             scheduleEntry.gnaName || employeeGroup.gnaName || gnaName;
  //           const entryMaterialsName =
  //             scheduleEntry.materialsName || employeeGroup.materialsName || materialsName;
  //           const entryHrName = scheduleEntry.hrName || employeeGroup.hrName || hrName;
  //           const entryFringeName =
  //             scheduleEntry.fringeName || employeeGroup.fringeName || fringeName;

  //           employeeGroup.entries.push({
  //             id: `${scheduleEntry.dctId || scheduleEntry.forecastid}-${monthRange}`,
  //             dctId: scheduleEntry.dctId,
  //             forecastid: scheduleEntry.forecastid,
  //             monthLabel: `${String(scheduleEntry.month).padStart(2, "0")}/${scheduleEntry.year}`,
  //             total: entryCost,
  //             monthlyValues: { [monthRange]: entryCost },
  //             gna: scheduleEntry.gna,
  //             overheadName: entryOverheadName,
  //             gnaName: entryGnaName,
  //             materialsName: entryMaterialsName,
  //             hrName: entryHrName,
  //             fringeName: entryFringeName,
  //             overhead: scheduleEntry.overhead,
  //             hr: scheduleEntry.hr,
  //             materials: scheduleEntry.materials,
  //             fringe: scheduleEntry.fringe,
  //           });

  //           // also persist these resolved names on the employeeGroup so parent rows show the backend-provided labels
  //           employeeGroup.overheadName = entryOverheadName;
  //           employeeGroup.gnaName = entryGnaName;
  //           employeeGroup.materialsName = entryMaterialsName;
  //           employeeGroup.hrName = entryHrName;
  //           employeeGroup.fringeName = entryFringeName;
  //           employeeGroup.monthlyData[monthRange] += entryCost;
  //           employeeGroup.total += entryCost;
  //           acctGroup.monthlyData[monthRange] +=  acctGroup.monthlyData[monthRange] + burden + entryCost;
  //           acctGroup.total += entryCost;
  //         }
  //       });
  //     });

  //     // ---------- FINALIZE EMPLOYEES ----------
  //     Array.from(uniqueEmployeesMap.values()).forEach((employee) => {
  //       // 🔥 recompute totals from new breakdown
  //       employee.rawCost = Object.values(employee.monthlyRawCost).reduce(
  //         (s, v) => s + v,
  //         0,
  //       );
  //       employee.fringe = Object.values(employee.monthlyFringe).reduce(
  //         (s, v) => s + v,
  //         0,
  //       );
  //       employee.overhead = Object.values(employee.monthlyOverhead).reduce(
  //         (s, v) => s + v,
  //         0,
  //       );
  //       employee.gna = Object.values(employee.monthlyGna).reduce(
  //         (s, v) => s + v,
  //         0,
  //       );
  //       employee.cost = Object.values(employee.monthlyCost).reduce(
  //         (s, v) => s + v,
  //         0,
  //       );
  //     });

  //     Array.from(nonLaborAcctDetailsMap.values()).forEach((acctGroup) => {
  //       acctGroup.total = Object.values(acctGroup.monthlyData).reduce(
  //         (s, v) => s + v,
  //         0,
  //       );
  //       acctGroup.employees = Array.from(acctGroup.employees.values());
  //     });

  //     // ---------- PROFIT ----------
  //     const selectedRevenueData =
  //       selectedRevenueView === "t&m" ? monthlyRevenueData : monthlyRevenueData;
  //     dynamicDateRanges.forEach((range) => {
  //       const revenue = selectedRevenueData[range] || 0;
  //       const expenses = totalExpenseData[range] || 0;
  //       profitData[range] = revenue === 0 ? 0 : revenue - expenses;
  //       // profitData[range] =
  //       //   (selectedRevenueData[range] || 0) - (totalExpenseData[range] || 0);
  //     });

  //     const overallProfitOnCost =
  //       totalExpenseOverall !== 0
  //         ? totalProfitOverall / totalExpenseOverall
  //         : 0;
  //     const overallProfitOnRevenue =
  //       totalRevenueOverall !== 0
  //         ? totalProfitOverall / totalRevenueOverall
  //         : 0;

  //     // ---------- BUILD ROWS ----------
  //     financialRows.push({
  //       id: `revenue-${currentOrgId}`,
  //       description: "Revenue",
  //       total: totalRevenueOverall,
  //       data: selectedRevenueData,
  //       tnmRevenueData: monthlyRevenueData,
  //       cpffRevenueData: monthlyRevenueData,
  //       type: "summary",
  //       orgId: currentOrgId,
  //     });

  //     financialRows.push({
  //       id: `total-staff-cost-${currentOrgId}`,
  //       // description: "Total Staff Cost",
  //       description: "Total Burdened Labor Cost",
  //       total: totalStaffCostOverall,
  //       data: totalStaffCostByMonth,
  //       type: "expandable",
  //       employees: Array.from(uniqueEmployeesMap.values()),
  //       orgId: currentOrgId,
  //     });

  //     financialRows.push({
  //       id: `non-labor-staff-cost-${currentOrgId}`,
  //       // description: "Non-Labor Staff Cost",
  //       description: "Total Burdened Non-Labor Cost",
  //       total: totalNonLaborCostOverall,
  //       data: totalNonLaborCostByMonth,
  //       type: "expandable",
  //       nonLaborAccts: Array.from(nonLaborAcctDetailsMap.values()),
  //       orgId: currentOrgId,
  //     });

  //     financialRows.push({
  //       id: `total-expense-${currentOrgId}`,
  //       description: "Total Expense",
  //       total: totalExpenseOverall,
  //       data: totalExpenseData,
  //       type: "summary",
  //       orgId: currentOrgId,
  //     });

  //     financialRows.push({
  //       id: `profit-${currentOrgId}`,
  //       description: "Profit",
  //       total: totalProfitOverall,
  //       data: profitData,
  //       type: "summary",
  //       orgId: currentOrgId,
  //     });

  //     dynamicDateRanges.forEach((range) => {
  //       const profit = profitData[range] || 0;
  //       const expense = totalExpenseData[range] || 0;
  //       profitOnCostData[range] = expense !== 0 ? profit / expense : 0;
  //     });

  //     financialRows.push({
  //       id: `profit-cost-${currentOrgId}`,
  //       description: "Profit % on Cost",
  //       total: overallProfitOnCost,
  //       data: profitOnCostData,
  //       type: "summary",
  //       orgId: currentOrgId,
  //     });

  //     dynamicDateRanges.forEach((range) => {
  //       const profit = profitData[range] || 0;
  //       let revenueForPercentage = selectedRevenueData[range] || 0;
  //       profitOnRevenueData[range] =
  //         revenueForPercentage !== 0 ? profit / revenueForPercentage : 0;
  //     });

  //     financialRows.push({
  //       id: `profit-revenue-${currentOrgId}`,
  //       description: "Profit % on Revenue",
  //       total: overallProfitOnRevenue,
  //       data: profitOnRevenueData,
  //       type: "summary",
  //       orgId: currentOrgId,
  //     });

  //     // console.log(
  //     //   "transformApiDataToFinancialRows: Final financialRows",
  //     //   financialRows
  //     // );
  //     return financialRows;
  //   },
  //   [selectedRevenueView],
  // );

const transformApiDataToFinancialRows = useCallback(
    (
      apiResponse,
      currentOrgId,
      dynamicDateRanges,
      selectedRevenueView,
      planType,
    ) => {
      const financialRows = [];

      // Initialize totals
      const monthlyRevenueData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );
      const totalExpenseData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );
      const profitData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );
      const profitOnCostData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );
      const profitOnRevenueData = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );
      const totalStaffCostByMonth = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );
      const totalNonLaborCostByMonth = dynamicDateRanges.reduce(
        (acc, range) => ({ ...acc, [range]: 0 }),
        {},
      );

      // Monthly Revenue + Staff/Non-Labor cost
      const monthlyRevenueSummary = apiResponse.monthlyRevenueSummary || [];
      monthlyRevenueSummary.forEach((monthData) => {
        const monthRange = getMonthRangeKey(monthData.month, monthData.year);
        if (monthRange && dynamicDateRanges.includes(monthRange)) {
          monthlyRevenueData[monthRange] = monthData.revenue || 0;

          const staffCost = monthData.cost || 0;
          const nonLaborCost = monthData.otherDifrectCost || 0;

          totalStaffCostByMonth[monthRange] = staffCost;
          totalNonLaborCostByMonth[monthRange] = nonLaborCost;

          totalExpenseData[monthRange] = staffCost + nonLaborCost;
        }
      });

      const monthlyRevenueTotal = Object.values(monthlyRevenueData).reduce(
        (s, v) => s + v,
        0,
      );

      const totalRevenueOverall =
        (apiResponse.revenue || 0) + monthlyRevenueTotal;

      const totalStaffCostOverall = Object.values(totalStaffCostByMonth).reduce(
        (s, v) => s + v,
        0,
      );

      const totalNonLaborCostOverall = Object.values(
        totalNonLaborCostByMonth,
      ).reduce((s, v) => s + v, 0);

      const totalExpenseOverall = Object.values(totalExpenseData).reduce(
        (s, v) => s + v,
        0,
      );

      const totalProfitOverall = totalRevenueOverall - totalExpenseOverall;

      const uniqueEmployeesMap = new Map();

      const filteredEmployeeSummaries = (
        apiResponse.employeeForecastSummary || []
      ).filter((empSummary) => {
        const isOrgMatch = currentOrgId
          ? empSummary.orgID === currentOrgId
          : true;
        return isOrgMatch;
      });

      if (filteredEmployeeSummaries.length > 0) {
        filteredEmployeeSummaries.forEach((empSummary) => {
          const compositeKey = `${empSummary.emplId}-${empSummary.plcCode}-${empSummary.orgId}-${empSummary.accID}`;

          if (!uniqueEmployeesMap.has(compositeKey)) {
            uniqueEmployeesMap.set(compositeKey, {
              id: compositeKey,
              name: `${empSummary.name} (${empSummary.emplId}) (${empSummary.plcCode})`,
              cost: 0,
              accountId: empSummary.accID || "",
              orgId: empSummary.orgId || "",
              glcPlc: empSummary.plcCode || "",
              hrlyRate: empSummary.perHourRate || 0,
              monthlyHours: {},
              monthlyCost: {},
              monthlyRawCost: {},
              monthlyFringe: {},
              monthlyOverhead: {},
              monthlyGna: {},
              detailSummary: {},
              // ✅ Dynamic Names for Labor Breakdown
              overheadName: empSummary.overheadName || "Overhead",
              gnaName: empSummary.gnaName || "General & Admin",
              materialsName: empSummary.materialsName || "Material",
              hrName: empSummary.hrName || "Human Resource",
              fringeName: empSummary.fringeName || "Fringe Benefits",
            });
          }

          const employee = uniqueEmployeesMap.get(compositeKey);
          const payrollSalaries = empSummary.emplSchedule?.payrollSalary || [];
          
          payrollSalaries.forEach((salaryEntry) => {
            const monthRange = getMonthRangeKey(
              salaryEntry.month,
              salaryEntry.year,
            );

            if (monthRange && dynamicDateRanges.includes(monthRange)) {
              employee.monthlyRawCost[monthRange] = (employee.monthlyRawCost[monthRange] || 0) + (salaryEntry.cost || 0);
              employee.monthlyFringe[monthRange] = (employee.monthlyFringe[monthRange] || 0) + (salaryEntry.fringe || 0);
              employee.monthlyOverhead[monthRange] = (employee.monthlyOverhead[monthRange] || 0) + (salaryEntry.overhead || 0);
              employee.monthlyGna[monthRange] = (employee.monthlyGna[monthRange] || 0) + (salaryEntry.gna || 0);
              employee.monthlyCost[monthRange] = (employee.monthlyCost[monthRange] || 0) + (salaryEntry.totalBurdenCost || 0);
              employee.monthlyHours[monthRange] = (employee.monthlyHours[monthRange] || 0) + (salaryEntry.hours || 0);

              // ✅ Map detailSummary using the dynamic names
              if (!employee.detailSummary["Raw Cost"]) employee.detailSummary["Raw Cost"] = {};
              employee.detailSummary["Raw Cost"][monthRange] = (employee.detailSummary["Raw Cost"][monthRange] || 0) + (salaryEntry.cost || 0);

              if (!employee.detailSummary[employee.fringeName]) employee.detailSummary[employee.fringeName] = {};
              employee.detailSummary[employee.fringeName][monthRange] = (employee.detailSummary[employee.fringeName][monthRange] || 0) + (salaryEntry.fringe || 0);

              if (!employee.detailSummary[employee.overheadName]) employee.detailSummary[employee.overheadName] = {};
              employee.detailSummary[employee.overheadName][monthRange] = (employee.detailSummary[employee.overheadName][monthRange] || 0) + (salaryEntry.overhead || 0);

              if (!employee.detailSummary[employee.gnaName]) employee.detailSummary[employee.gnaName] = {};
              employee.detailSummary[employee.gnaName][monthRange] = (employee.detailSummary[employee.gnaName][monthRange] || 0) + (salaryEntry.gna || 0);

              if (!employee.detailSummary[employee.hrName]) employee.detailSummary[employee.hrName] = {};
              employee.detailSummary[employee.hrName][monthRange] = (employee.detailSummary[employee.hrName][monthRange] || 0) + (salaryEntry.hr || 0);

              if (!employee.detailSummary[employee.materialsName]) employee.detailSummary[employee.materialsName] = {};
              employee.detailSummary[employee.materialsName][monthRange] = (employee.detailSummary[employee.materialsName][monthRange] || 0) + (salaryEntry.materials || 0);
            }
          });
        });
      }

      // ---------- NON-LABOR ----------
      const nonLaborAcctDetailsMap = new Map();
      const allNonLaborSummariesFiltered = [
        ...(apiResponse.directCOstForecastSummary || []),
        ...(apiResponse.indirectCostForecastSummary || []),
      ].filter((n) => (currentOrgId ? n.orgID === currentOrgId : true));

      allNonLaborSummariesFiltered.forEach((nonLaborSummary) => {
        const schedules = nonLaborSummary.directCostSchedule?.forecasts || nonLaborSummary.indirectCostSchedule?.forecasts || [];
        const accountId = nonLaborSummary.accID;
        const orgId = nonLaborSummary.orgID;
        const glcPlc = nonLaborSummary.plcCode || "";
        const accName = nonLaborSummary.accName || `Account: ${accountId}`;
        
        // ✅ Map Dynamic Names for Non-Labor
        const overheadName = nonLaborSummary.overheadName || "Overhead";
        const gnaName = nonLaborSummary.gnaName || "General & Admin";
        const materialsName = nonLaborSummary.materialsName || "Material";
        const hrName = nonLaborSummary.hrName || "Human Resource";
        const fringeName = nonLaborSummary.fringeName || "Fringe";

        if (!nonLaborAcctDetailsMap.has(accountId)) {
          nonLaborAcctDetailsMap.set(accountId, {
            id: accountId,
            description: accName,
            orgId: orgId,
            glcPlc: glcPlc,
            overheadName, gnaName, materialsName, hrName, fringeName,
            total: 0,
            monthlyData: dynamicDateRanges.reduce((acc, range) => ({ ...acc, [range]: 0 }), {}),
            employees: new Map(),
          });
        }
        const acctGroup = nonLaborAcctDetailsMap.get(accountId);
        const employeeId = nonLaborSummary.emplId || "N/A_Employee";
        const employeeName = nonLaborSummary.name || ` ${accountId}`;

        if (!acctGroup.employees.has(employeeId)) {
          acctGroup.employees.set(employeeId, {
            id: employeeId,
            name: `${employeeName} (${employeeId})`,
            total: 0,
            gna: nonLaborSummary.gna || 0,
            materials: nonLaborSummary.materials || 0,
            hr: nonLaborSummary.hr || 0,
            fringe: nonLaborSummary.fringe || 0,
            overhead: nonLaborSummary.overhead || 0,
            overheadName, gnaName, materialsName, hrName, fringeName,
            monthlyData: dynamicDateRanges.reduce((acc, range) => ({ ...acc, [range]: 0 }), {}),
            entries: [],
          });
        }
        const employeeGroup = acctGroup.employees.get(employeeId);

        schedules.forEach((scheduleEntry) => {
          const monthRange = getMonthRangeKey(scheduleEntry.month, scheduleEntry.year);
          if (monthRange && dynamicDateRanges.includes(monthRange)) {
            let entryCost = 0;
            let burden = scheduleEntry.burden;
            if (planType === "EAC") {
              entryCost = scheduleEntry.actualamt || 0;
            } else if (planType === "BUD") {
              entryCost = scheduleEntry.forecastedamt  || 0;
            } else {
              entryCost = (scheduleEntry.cost || 0) + (scheduleEntry.fringe || 0) + (scheduleEntry.overhead || 0) + (scheduleEntry.gna || 0) + (scheduleEntry.materials || 0);
            }
            
            // ✅ Determine names from scheduleEntry or fallback
            const entryOverheadName = scheduleEntry.overheadName || employeeGroup.overheadName;
            const entryGnaName = scheduleEntry.gnaName || employeeGroup.gnaName;
            const entryMaterialsName = scheduleEntry.materialsName || employeeGroup.materialsName;
            const entryHrName = scheduleEntry.hrName || employeeGroup.hrName;
            const entryFringeName = scheduleEntry.fringeName || employeeGroup.fringeName;

            employeeGroup.entries.push({
              id: `${scheduleEntry.dctId || scheduleEntry.forecastid}-${monthRange}`,
              dctId: scheduleEntry.dctId,
              forecastid: scheduleEntry.forecastid,
              monthLabel: `${String(scheduleEntry.month).padStart(2, "0")}/${scheduleEntry.year}`,
              total: entryCost,
              monthlyValues: { [monthRange]: entryCost },
              gna: scheduleEntry.gna,
              overheadName: entryOverheadName,
              gnaName: entryGnaName,
              materialsName: entryMaterialsName,
              hrName: entryHrName,
              fringeName: entryFringeName,
              overhead: scheduleEntry.overhead,
              hr: scheduleEntry.hr,
              materials: scheduleEntry.materials,
              fringe: scheduleEntry.fringe,
            });

            employeeGroup.overheadName = entryOverheadName;
            employeeGroup.gnaName = entryGnaName;
            employeeGroup.materialsName = entryMaterialsName;
            employeeGroup.hrName = entryHrName;
            employeeGroup.fringeName = entryFringeName;

            employeeGroup.monthlyData[monthRange] += entryCost;
            employeeGroup.total += entryCost;
            acctGroup.monthlyData[monthRange] =  acctGroup.monthlyData[monthRange] + burden + entryCost;
            acctGroup.total += entryCost;
          }
        });
      });

      // ---------- FINALIZE ----------
      Array.from(uniqueEmployeesMap.values()).forEach((employee) => {
        employee.rawCost = Object.values(employee.monthlyRawCost).reduce((s, v) => s + v, 0);
        employee.fringe = Object.values(employee.monthlyFringe).reduce((s, v) => s + v, 0);
        employee.overhead = Object.values(employee.monthlyOverhead).reduce((s, v) => s + v, 0);
        employee.gna = Object.values(employee.monthlyGna).reduce((s, v) => s + v, 0);
        employee.cost = Object.values(employee.monthlyCost).reduce((s, v) => s + v, 0);
      });

      Array.from(nonLaborAcctDetailsMap.values()).forEach((acctGroup) => {
        acctGroup.total = Object.values(acctGroup.monthlyData).reduce((s, v) => s + v, 0);
        acctGroup.employees = Array.from(acctGroup.employees.values());
      });

      // ---------- PROFIT ----------
      const selectedRevenueData = monthlyRevenueData;
      dynamicDateRanges.forEach((range) => {
        const revenue = selectedRevenueData[range] || 0;
        const expenses = totalExpenseData[range] || 0;
        profitData[range] = revenue === 0 ? 0 : revenue - expenses;
      });

      const overallProfitOnCost = totalExpenseOverall !== 0 ? totalProfitOverall / totalExpenseOverall : 0;
      const overallProfitOnRevenue = totalRevenueOverall !== 0 ? totalProfitOverall / totalRevenueOverall : 0;

      // ---------- BUILD ROWS ----------
      financialRows.push(
        { id: `revenue-${currentOrgId}`, description: "Revenue", total: totalRevenueOverall, data: selectedRevenueData, tnmRevenueData: monthlyRevenueData, cpffRevenueData: monthlyRevenueData, type: "summary", orgId: currentOrgId },
        { id: `total-staff-cost-${currentOrgId}`, description: "Total Burdened Labor Cost", total: totalStaffCostOverall, data: totalStaffCostByMonth, type: "expandable", employees: Array.from(uniqueEmployeesMap.values()), orgId: currentOrgId },
        { id: `non-labor-staff-cost-${currentOrgId}`, description: "Total Burdened Non-Labor Cost", total: totalNonLaborCostOverall, data: totalNonLaborCostByMonth, type: "expandable", nonLaborAccts: Array.from(nonLaborAcctDetailsMap.values()), orgId: currentOrgId },
        { id: `total-expense-${currentOrgId}`, description: "Total Expense", total: totalExpenseOverall, data: totalExpenseData, type: "summary", orgId: currentOrgId },
        { id: `profit-${currentOrgId}`, description: "Profit", total: totalProfitOverall, data: profitData, type: "summary", orgId: currentOrgId }
      );

      dynamicDateRanges.forEach((range) => {
        const profit = profitData[range] || 0;
        const expense = totalExpenseData[range] || 0;
        profitOnCostData[range] = expense !== 0 ? profit / expense : 0;
      });

      financialRows.push({ id: `profit-cost-${currentOrgId}`, description: "Profit % on Cost", total: overallProfitOnCost, data: profitOnCostData, type: "summary", orgId: currentOrgId });

      dynamicDateRanges.forEach((range) => {
        const profit = profitData[range] || 0;
        let revenueForPercentage = selectedRevenueData[range] || 0;
        profitOnRevenueData[range] = revenueForPercentage !== 0 ? profit / revenueForPercentage : 0;
      });

      financialRows.push({ id: `profit-revenue-${currentOrgId}`, description: "Profit % on Revenue", total: overallProfitOnRevenue, data: profitOnRevenueData, type: "summary", orgId: currentOrgId });

      return financialRows;
    },
    [selectedRevenueView],
  );

  useEffect(() => {
    // console.log(
    //   "useEffect [initialApiData, isLoading, error, fiscalYear]: Effect triggered."
    // );
    if (isLoading) {
      // console.log("useEffect: Data is still loading.");
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
      return;
    }

    if (error) {
      // console.log("useEffect: Error received from parent:", error);
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
      return;
    }

    if (!initialApiData || Object.keys(initialApiData).length === 0) {
      // console.log("useEffect: initialApiData is null, undefined, or empty.");
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
      return;
    }

    try {
      // console.log(
      //   "useEffect: Processing initialApiData for deep fiscal year filtering..."
      // );

      const processedApiData = { ...initialApiData }; // Start with a copy

      processedApiData.employeeForecastSummary = (
        initialApiData.employeeForecastSummary || []
      )
        .map((empSummary) => {
          const filteredPayrollSalary = (
            empSummary.emplSchedule?.payrollSalary || []
          ).filter((salaryEntry) => {
            return (
              !fiscalYear ||
              fiscalYear === "All" ||
              String(salaryEntry.year) === fiscalYear
            );
          });

          if (filteredPayrollSalary.length > 0) {
            return {
              ...empSummary,
              emplSchedule: {
                ...empSummary.emplSchedule,
                payrollSalary: filteredPayrollSalary,
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      // console.log(
      //   "useEffect: employeeForecastSummary after deep fiscalYear filter:",
      //   processedApiData.employeeForecastSummary
      // );

      processedApiData.directCOstForecastSummary = (
        initialApiData.directCOstForecastSummary || []
      )
        .map((nonLaborSummary) => {
          const filteredForecasts = (
            nonLaborSummary.directCostSchedule?.forecasts || []
          ).filter((f) => {
            return (
              !fiscalYear ||
              fiscalYear === "All" ||
              String(f.year) === fiscalYear
            );
          });
          if (filteredForecasts.length > 0) {
            return {
              ...nonLaborSummary,
              directCostSchedule: {
                ...nonLaborSummary.directCostSchedule,
                forecasts: filteredForecasts,
              },
            };
          }
          return null;
        })
        .filter(Boolean);
      // console.log(
      //   "useEffect: directCOstForecastSummary after deep fiscalYear filter:",
      //   processedApiData.directCOstForecastSummary
      // );

      processedApiData.indirectCostForecastSummary = (
        initialApiData.indirectCostForecastSummary || []
      )
        .map((nonLaborSummary) => {
          const filteredForecasts = (
            nonLaborSummary.indirectCostSchedule?.forecasts || []
          ).filter((f) => {
            return (
              !fiscalYear ||
              fiscalYear === "All" ||
              String(f.year) === fiscalYear
            );
          });
          if (filteredForecasts.length > 0) {
            return {
              ...nonLaborSummary,
              indirectCostSchedule: {
                ...nonLaborSummary.indirectCostSchedule,
                forecasts: filteredForecasts,
              },
            };
          }
          return null;
        })
        .filter(Boolean);
      // console.log(
      //   "useEffect: indirectCostSummariesFiltered after deep fiscalYear filter:",
      //   processedApiData.indirectCostForecastSummary
      // );

      setAllApiData(processedApiData);

      const uniqueOrgIds = new Set();
      const uniqueDateRangesSet = new Set();

      (processedApiData.employeeForecastSummary || []).forEach((summary) => {
        uniqueOrgIds.add(summary.orgID);
        summary.emplSchedule?.payrollSalary?.forEach((salaryEntry) => {
          const monthRangeKey = getMonthRangeKey(
            salaryEntry.month,
            salaryEntry.year,
          );
          uniqueDateRangesSet.add(monthRangeKey);
        });
      });

      (processedApiData.directCOstForecastSummary || []).forEach(
        (nonLaborSummary) => {
          uniqueOrgIds.add(nonLaborSummary.orgID);
          nonLaborSummary.directCostSchedule?.forecasts?.forEach(
            (scheduleEntry) => {
              const monthRangeKey = getMonthRangeKey(
                scheduleEntry.month,
                scheduleEntry.year,
              );
              uniqueDateRangesSet.add(monthRangeKey);
            },
          );
        },
      );

      (processedApiData.indirectCostForecastSummary || []).forEach(
        (nonLaborSummary) => {
          uniqueOrgIds.add(nonLaborSummary.orgID);
          nonLaborSummary.indirectCostSchedule?.forecasts?.forEach(
            (scheduleEntry) => {
              const monthRangeKey = getMonthRangeKey(
                scheduleEntry.month,
                scheduleEntry.year,
              );
              uniqueDateRangesSet.add(monthRangeKey);
            },
          );
        },
      );

      const sortedDateRanges = Array.from(uniqueDateRangesSet).sort((a, b) => {
        const [monthAStr, yearAStr] = a.split("/");
        const yearA = parseInt(yearAStr, 10);
        const monthA = parseInt(monthAStr, 10);

        const [monthBStr, yearBStr] = b.split("/");
        const yearB = parseInt(yearBStr, 10);
        const monthB = parseInt(monthBStr, 10);

        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });

      setDynamicDateRanges(sortedDateRanges);
      // console.log("useEffect: dynamicDateRanges set to", sortedDateRanges);

      const orgs = Array.from(uniqueOrgIds).sort();
      setAvailableOrgIds(orgs);
      // console.log("useEffect: availableOrgIds set to", orgs);

      if (orgs.length > 0) {
        setSelectedOrgId(orgs[0]);
        // console.log("useEffect: selectedOrgId set to", orgs[0]);
      } else {
        setSelectedOrgId("");
        // console.log("useEffect: selectedOrgId set to empty (no orgs found)");
      }
    } catch (e) {
      // console.error("Error during initial API data processing:", e);
      setAllApiData(null);
      setDynamicDateRanges([]);
      setSelectedOrgId("");
      setAvailableOrgIds([]);
      setFinancialData([]);
    }
  }, [initialApiData, isLoading, error, fiscalYear]);

  useEffect(() => {
    // console.log(
    //   "useEffect [allApiData, selectedOrgId, dynamicDateRanges, ...]: Transform trigger effect."
    // );
    if (allApiData && selectedOrgId && dynamicDateRanges.length > 0) {
      // console.log(
      //   "useEffect (transform trigger): allApiData, selectedOrgId, dynamicDateRanges are ready. Transforming data..."
      // );
      const transformedData = transformApiDataToFinancialRows(
        allApiData,
        selectedOrgId,
        dynamicDateRanges,
        selectedRevenueView,
        type,
        initialApiData.revenue,
      );
      // console.log(
      //   "Transformed Data (after filter & transform):",
      //   transformedData
      // );
      setFinancialData(transformedData);
    } else {
      // console.log(
      //   "useEffect (transform trigger): Waiting for allApiData, selectedOrgId, or dynamicDateRanges to be ready."
      // );
      setFinancialData([]);
    }
    setExpandedStaffRows([]);
    setExpandedEmployeeDetails([]);
    setExpandedNonLaborAcctRows([]);
  }, [
    allApiData,
    selectedOrgId,
    dynamicDateRanges,
    selectedRevenueView,
    transformApiDataToFinancialRows,
    type,
  ]);

  const toggleStaffRow = (id) => {
    setExpandedStaffRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const toggleEmployeeDetail = (id) => {
    setExpandedEmployeeDetails((prev) =>
      prev.includes(id)
        ? prev.filter((detailId) => detailId !== id)
        : [...prev, id],
    );
  };

  const toggleNonLaborAcctRow = (id) => {
    setExpandedNonLaborAcctRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const formatValue = (value, isHours = false, isPercentage = false) => {
    if (typeof value === "number") {
      if (value === 0) value = 0;
      let formatted;
      if (isPercentage) {
        formatted = (value * 100).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${formatted}%`;
      }
      formatted = value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return isHours ? `${formatted} hrs` : formatted;
    }
    return isHours ? "0.00 hrs" : isPercentage ? "0.00%" : "0.00";
  };

  const getGlassmorphismClasses = () => `
    bg-white bg-opacity-5 backdrop-filter backdrop-blur-lg rounded-sm
    border border-opacity-10 border-white 
  `;

  if (isLoading) {
    return (
      // <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 text-gray-800 text-2xl">
      //   Loading data...
      // </div>
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-50 text-red-600 text-2xl">
        Error: {error}
      </div>
    );
  }

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const expandAll = () => {
    // ✅ Expand all staff rows (parents)
    const staffRowsToExpand = financialData
      .filter(
        (row) =>
          row.type === "expandable" && row.id.startsWith("total-staff-cost"),
      )
      .map((row) => row.id);
    setExpandedStaffRows(staffRowsToExpand);

    // ✅ Expand all employee details (children under staff)
    const employeeDetailsToExpand = [];
    financialData.forEach((row) => {
      if (
        row.type === "expandable" &&
        row.id.startsWith("total-staff-cost") &&
        row.employees
      ) {
        row.employees.forEach((employee) =>
          employeeDetailsToExpand.push(`${row.id}-${employee.id}`),
        );
      }
    });
    setExpandedEmployeeDetails(employeeDetailsToExpand);

    // ✅ Expand all non-labor parent rows (FIXED typo + separate state)
    const nonLaborParentRowsToExpand = financialData
      .filter(
        (row) =>
          row.type === "expandable" &&
          row.id.startsWith("non-labor-staff-cost"), // 🔥 FIXED typo
      )
      .map((row) => row.id);

    setExpandedNonLaborAcctRows(nonLaborParentRowsToExpand); // 🔥 now expands parents

    // ✅ Expand all non-labor child account rows
    const nonLaborAcctRowsToExpand = [];
    financialData.forEach((row) => {
      if (
        row.type === "expandable" &&
        row.id.startsWith("non-labor-staff-cost") &&
        row.nonLaborAccts
      ) {
        row.nonLaborAccts.forEach((acct) =>
          nonLaborAcctRowsToExpand.push(`${row.id}-${acct.id}`),
        );
      }
    });
    setExpandedNonLaborAcctRows((prev) => [
      ...new Set([
        ...prev,
        ...nonLaborParentRowsToExpand,
        ...nonLaborAcctRowsToExpand,
      ]),
    ]); //  merge parent + children
  };

  const collapseAll = () => {
    setExpandedStaffRows([]);
    setExpandedEmployeeDetails([]);
    setExpandedNonLaborAcctRows([]); // clears both parent + child IDs
  };

  // console.log(financialData);
  // const buildExcelRows = () => {
  //   const rows = [];

  //   financialData.forEach((row) => {
  //     // 🔹 Parent row
  //     const baseRow = {
  //       Description: row.description,
  //       Total: row.total ?? 0,
  //     };

  //     dynamicDateRanges.forEach((month) => {
  //       baseRow[month] = row.data?.[month] ?? 0;
  //     });

  //     rows.push(baseRow);

  //     // 🔹 Staff expandable
  //     // if (row.employees) {
  //     //   row.employees.forEach((emp) => {
  //     //     const empRow = {
  //     //       Description: `   ${emp.name}`, // indent
  //     //       Total: emp.cost ?? 0,
  //     //     };

  //     //     dynamicDateRanges.forEach((month) => {
  //     //       empRow[month] = emp.monthlyCost?.[month] ?? 0;
  //     //     });

  //     //     rows.push(empRow);

  //     //     // 🔹 Employee detail rows (Raw, Fringe, Overhead…)
  //     //     Object.entries(emp.detailSummary || {}).forEach(
  //     //       ([label, monthData]) => {
  //     //         const detailRow = {
  //     //           Description: `      ${label}`,
  //     //           Total: Object.values(monthData).reduce((s, v) => s + v, 0),
  //     //         };

  //     //         dynamicDateRanges.forEach((month) => {
  //     //           detailRow[month] = monthData?.[month] ?? 0;
  //     //         });

  //     //         rows.push(detailRow);
  //     //       }
  //     //     );
  //     //   });
  //     // }

  //     if (row.employees && row.employees.length > 0) {
  //       // rows.push({
  //       //   Description: "Employee",
  //       //   Total: 0,
  //       //   ...dynamicDateRanges.reduce((acc, month) => {
  //       //     acc[month] = 0;
  //       //     return acc;
  //       //   }, {}),
  //       // });

  //       row.employees.forEach((emp) => {
  //         const empRow = {
  //           Description: `   ${emp.name}`,
  //           Total: emp.cost ?? 0,
  //         };
  //         dynamicDateRanges.forEach((month) => {
  //           empRow[month] = emp.monthlyCost?.[month] ?? 0;
  //         });
  //         rows.push(empRow);

  //           rows.push({
  //             Description: `      Employee Hours`,
  //             Total: Object.values(emp.monthlyHours || {}).reduce(
  //               (sum, v) => sum + v,
  //               0
  //             ),
  //             ...dynamicDateRanges.reduce((acc, month) => {
  //               acc[month] = emp.monthlyHours?.[month] ?? 0;
  //               return acc;
  //             }, {}),
  //           });

  //         Object.entries(emp.detailSummary || {}).forEach(
  //           ([label, monthData]) => {
  //             const detailRow = {
  //               Description: `      ${label}`,
  //               Total: Object.values(monthData).reduce((s, v) => s + v, 0),
  //             };
  //             dynamicDateRanges.forEach((month) => {
  //               detailRow[month] = monthData?.[month] ?? 0;
  //             });
  //             rows.push(detailRow);
  //           }
  //         );
  //       });
  //     }

  //     // 🔹 Non-labor expandable
  //     if (row.nonLaborAccts) {
  //       row.nonLaborAccts.forEach((acct) => {
  //         const acctRow = {
  //           Description: `   ${acct.description}`,
  //           Total: acct.total ?? 0,
  //         };

  //         dynamicDateRanges.forEach((month) => {
  //           acctRow[month] = acct.monthlyData?.[month] ?? 0;
  //         });

  //         rows.push(acctRow);

  //         acct.employees.forEach((emp) => {
  //           const empRow = {
  //             Description: `      ${emp.name}`,
  //             Total: emp.total ?? 0,
  //           };

  //           dynamicDateRanges.forEach((month) => {
  //             empRow[month] = emp.monthlyData?.[month] ?? 0;
  //           });

  //           rows.push(empRow);
  //         });
  //       });
  //     }
  //   });

  //   return rows;
  // };

  //new

  // console.log(financialData);
  // const buildExcelRows = () => {
  //   const rows = [];

  //   financialData.forEach((row) => {
  //     // 🔹 Parent row (e.g., Total Burdened Labor Cost / Total Burdened Non-Labor Cost)
  //     // Use revenueSum for Revenue row, row.total for all others
  //     const ctdTotal = row.id.startsWith("revenue-")
  //       ? revenueSum
  //       : Number(row.total) || 0;

  //     const baseRow = {
  //       Description: row.description,
  //       "Account ID": row.accountId || "",
  //       "Org ID": row.orgId || "",
  //       "GLC/PLC": row.glcPlc || "",
  //       "Hrly Rate": row.hrlyRate || "",
  //       "CTD Total": ctdTotal,
  //     };

  //     dynamicDateRanges.forEach((month) => {
  //       baseRow[month] = Number(row.data?.[month]) || 0;
  //     });

  //     rows.push(baseRow);

  //     // 🔹 LABOR / STAFF SECTION
  //     if (row.employees && !row.id.includes("non-labor")) {
  //       row.employees.forEach((emp) => {
  //         const empRow = {
  //           Description: `   ${emp.name}`,
  //           "Account ID": emp.accountId || "",
  //           "Org ID": emp.orgId || "",
  //           "GLC/PLC": emp.glcPlc || "",
  //           "Hrly Rate": emp.hrlyRate || "",
  //           "CTD Total": Number(emp.cost) || 0,
  //         };
  //         dynamicDateRanges.forEach((month) => {
  //           empRow[month] = Number(emp.monthlyCost?.[month]) || 0;
  //         });
  //         rows.push(empRow);

  //         // Employee Hours
  //         rows.push({
  //           Description: `      Employee Hours`,
  //           "Account ID": "",
  //           "Org ID": "",
  //           "GLC/PLC": "",
  //           "Hrly Rate": "",
  //           "CTD Total":
  //             Number(
  //               Object.values(emp.monthlyHours || {}).reduce(
  //                 (sum, v) => sum + v,
  //                 0,
  //               ),
  //             ) || 0,
  //           ...dynamicDateRanges.reduce((acc, month) => {
  //             acc[month] = Number(emp.monthlyHours?.[month]) || 0;
  //             return acc;
  //           }, {}),
  //         });

  //         // Detail Breakdown (Raw, Fringe, etc)
  //         Object.entries(emp.detailSummary || {}).forEach(
  //           ([label, monthData]) => {
  //             const detailRow = {
  //               Description: `      --- ${label}`,
  //               "Account ID": "",
  //               "Org ID": "",
  //               "GLC/PLC": "",
  //               "Hrly Rate": "",
  //               "CTD Total":
  //                 Number(Object.values(monthData).reduce((s, v) => s + v, 0)) ||
  //                 0,
  //             };
  //             dynamicDateRanges.forEach((month) => {
  //               detailRow[month] = Number(monthData?.[month]) || 0;
  //             });
  //             rows.push(detailRow);
  //           },
  //         );
  //       });
  //     }

  //     // 🔹 NON-LABOR SECTION (FIXED)
  //     if (row.nonLaborAccts) {
  //       row.nonLaborAccts.forEach((acct) => {
  //         const acctRow = {
  //           Description: `   ${acct.description}`,
  //           "Account ID": acct.id || "",
  //           "Org ID": acct.orgId || "",
  //           "GLC/PLC": acct.glcPlc || "",
  //           "Hrly Rate": "",
  //           "CTD Total": Number(acct.total) || 0,
  //         };
  //         dynamicDateRanges.forEach((month) => {
  //           acctRow[month] = Number(acct.monthlyData?.[month]) || 0;
  //         });
  //         rows.push(acctRow);

  //         acct.employees.forEach((empGroup) => {
  //           // Employee Name Row
  //           const empNameRow = {
  //             Description: `      ${empGroup.name}`,
  //             "Account ID": "",
  //             "Org ID": "",
  //             "GLC/PLC": "",
  //             "Hrly Rate": "",
  //             "CTD Total": Number(empGroup.total) || 0,
  //           };
  //           dynamicDateRanges.forEach((month) => {
  //             empNameRow[month] = Number(empGroup.monthlyData?.[month]) || 0;
  //           });
  //           rows.push(empNameRow);

  //           // Breakdown Labels to match your UI
  //           const breakdownLabels = [
  //             { key: "gna", label: "General & Admin" },
  //             { key: "overhead", label: "Overhead" },
  //             { key: "hr", label: "Human Resource" },
  //             { key: "materials", label: "Material" },
  //             { key: "fringe", label: "Fringe Benefits" },
  //           ];

  //           breakdownLabels.forEach(({ key, label }) => {
  //             const detailRow = {
  //               Description: `         --- ${label}`,
  //               "Account ID": "",
  //               "Org ID": "",
  //               "GLC/PLC": "",
  //               "Hrly Rate": "",
  //               "CTD Total": Number(empGroup[key]) || 0, // Total for that category
  //             };

  //             dynamicDateRanges.forEach((month) => {
  //               // Find the entry for this specific month to get the category value
  //               const monthEntry = empGroup.entries.find(
  //                 (e) => e.monthLabel === month,
  //               );
  //               detailRow[month] =
  //                 Number(monthEntry ? (monthEntry[key] ?? 0) : 0) || 0;
  //             });

  //             rows.push(detailRow);
  //           });
  //         });
  //       });
  //     }
  //   });

  //   return rows;
  // };

  const buildExcelRows = () => {
    const rows = [];

    const isPercentageRow = (row) => row.description?.includes("Profit %");

    const formatPercent = (value) => Number(value) * 100;

    financialData.forEach((row) => {
      // 🔹 CTD Total
      const rawCtd = row.id.startsWith("revenue-")
        ? revenueSum
        : Number(row.total) || 0;

      const baseRow = {
        Description: row.description,
        "Account ID": row.accountId || "",
        "Org ID": row.orgId || "",
        "GLC/PLC": row.glcPlc || "",
        "Hrly Rate": row.hrlyRate || "",
        "CTD Total": isPercentageRow(row) ? formatPercent(rawCtd) : rawCtd,
      };

      // 🔹 Month-wise values
      dynamicDateRanges.forEach((month) => {
        const rawValue = Number(row.data?.[month]) || 0;

        baseRow[month] = isPercentageRow(row)
          ? formatPercent(rawValue)
          : rawValue;
      });

      rows.push(baseRow);

      // 🔹 LABOR / STAFF SECTION
      if (row.employees && !row.id.includes("non-labor")) {
        row.employees.forEach((emp) => {
          const empRow = {
            Description: `   ${emp.name}`,
            "Account ID": emp.accountId || "",
            "Org ID": emp.orgId || "",
            "GLC/PLC": emp.glcPlc || "",
            "Hrly Rate": emp.hrlyRate || "",
            "CTD Total": Number(emp.cost) || 0,
          };

          dynamicDateRanges.forEach((month) => {
            empRow[month] = Number(emp.monthlyCost?.[month]) || 0;
          });

          rows.push(empRow);

          // Employee Hours
          rows.push({
            Description: `      Employee Hours`,
            "Account ID": "",
            "Org ID": "",
            "GLC/PLC": "",
            "Hrly Rate": "",
            "CTD Total":
              Number(
                Object.values(emp.monthlyHours || {}).reduce(
                  (sum, v) => sum + v,
                  0,
                ),
              ) || 0,
            ...dynamicDateRanges.reduce((acc, month) => {
              acc[month] = Number(emp.monthlyHours?.[month]) || 0;
              return acc;
            }, {}),
          });

          // Detail Breakdown
          Object.entries(emp.detailSummary || {}).forEach(
            ([label, monthData]) => {
              const detailRow = {
                Description: `      --- ${label}`,
                "Account ID": "",
                "Org ID": "",
                "GLC/PLC": "",
                "Hrly Rate": "",
                "CTD Total":
                  Number(Object.values(monthData).reduce((s, v) => s + v, 0)) ||
                  0,
              };

              dynamicDateRanges.forEach((month) => {
                detailRow[month] = Number(monthData?.[month]) || 0;
              });

              rows.push(detailRow);
            },
          );
        });
      }

      // 🔹 NON-LABOR SECTION
      if (row.nonLaborAccts) {
        row.nonLaborAccts.forEach((acct) => {
          const acctRow = {
            Description: `   ${acct.description}`,
            "Account ID": acct.id || "",
            "Org ID": acct.orgId || "",
            "GLC/PLC": acct.glcPlc || "",
            "Hrly Rate": "",
            "CTD Total": Number(acct.total) || 0,
          };

          dynamicDateRanges.forEach((month) => {
            acctRow[month] = Number(acct.monthlyData?.[month]) || 0;
          });

          rows.push(acctRow);

          acct.employees.forEach((empGroup) => {
            const empNameRow = {
              Description: `      ${empGroup.name}`,
              "Account ID": "",
              "Org ID": "",
              "GLC/PLC": "",
              "Hrly Rate": "",
              "CTD Total": Number(empGroup.total) || 0,
            };

            dynamicDateRanges.forEach((month) => {
              empNameRow[month] = Number(empGroup.monthlyData?.[month]) || 0;
            });

            rows.push(empNameRow);

            const breakdownLabels = [
              { key: "gna", label: "General & Admin" },
              { key: "overhead", label: "Overhead" },
              { key: "hr", label: "Human Resource" },
              { key: "materials", label: "Material" },
              { key: "fringe", label: "Fringe Benefits" },
            ];

            breakdownLabels.forEach(({ key, label }) => {
              const detailRow = {
                Description: `         --- ${label}`,
                "Account ID": "",
                "Org ID": "",
                "GLC/PLC": "",
                "Hrly Rate": "",
                "CTD Total": Number(empGroup[key]) || 0,
              };

              dynamicDateRanges.forEach((month) => {
                const monthEntry = empGroup.entries.find(
                  (e) => e.monthLabel === month,
                );

                detailRow[month] =
                  Number(monthEntry ? (monthEntry[key] ?? 0) : 0) || 0;
              });

              rows.push(detailRow);
            });
          });
        });
      }
    });

    return rows;
  };



  const exportToExcel = () => {
    try {
      setIsExporting(true);

      const excelRows = buildExcelRows();

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Plan");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const file = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(
        file,
        `Financial_Plan_${selectedOrgId}_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      console.error("Excel export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full  text-gray-800">
      <div className="mb-2 flex item-center gap-x-1">
        <button
          onClick={expandAll}
          className="btn1 btn-blue cursor-pointer flex items-center"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="btn1 btn-blue cursor-pointer flex items-center"
        >
          Collapse All
        </button>
        <div className="flex items-center ">
          <button
            onClick={exportToExcel}
            className={`btn1 btn-blue cursor-pointer flex items-center ${isExporting ? "bg-[#11353f]bg-gray-100 text-white" : "bg-[#17414d]  text-white"}`}
            disabled={isExporting}
          >
            {isExporting ? "Exporting" : "Export"}
          </button>
        </div>
      </div>

      <div className={` ${getGlassmorphismClasses()}`}>
        <div className="mb-8 flex-wrap justify-center items-center gap-4 hidden"></div>

        <div className="overflow-x-auto max-h-120 rounded-sm overflow-y-auto">
          <table className="min-w-full rounded-sm  divide-y divide-gray-300 divide-opacity-30">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gray-200 bg-opacity-50 ">
                <th
                  className="relative px-3  pl-20 text-left text-xs
             whitespace-nowrap
             sticky top-0 left-0 z-40
             bg-opacity-95
             border-b border-gray-300
             before:absolute before:top-0 before:right-0
             before:h-full before:w-[2px]
             before:bg-gray-300 before:content-[''] py-1 font-semibold bg-[#e5f3fb] text-black capitalize"
                >
                  Description
                </th>

                <th className="px-3 py-1  text-left text-xs font-semibold bg-[#e5f3fb] text-black capitalize border-b border-gray-300 whitespace-nowrap">
                  Account ID
                </th>
                <th className="px-3 py-1 text-left text-xs font-semibold bg-[#e5f3fb] text-black capitalize border-b border-gray-300 whitespace-nowrap">
                  Org ID
                </th>
                <th className="px-3 py-1  text-left text-xs font-semibold bg-[#e5f3fb] text-black capitalize border-b border-gray-300 whitespace-nowrap">
                  GLC/PLC
                </th>
                <th className="px-3 py-1 text-right text-xs font-semibold bg-[#e5f3fb] text-black capitalize border-b border-gray-300 whitespace-nowrap">
                  Hrly Rate
                </th>
                <th className="px-3 py-1 text-right text-xs font-semibold bg-[#e5f3fb] text-black capitalize border-b border-gray-300 whitespace-nowrap">
                  CTD Total
                </th>
                {dynamicDateRanges.length > 0 &&
                  dynamicDateRanges.map((range) => {
                    const [monthPart, yearPart] = range.split("/");

                    return (
                      <th
                        key={range}
                        className="px-3 py-1 text-right text-xs font-semibold bg-[#e5f3fb] text-black capitalize border-b border-gray-200 whitespace-nowrap"
                      >
                        {`${monthPart}/${yearPart}`}
                      </th>
                    );
                  })}
              </tr>
            </thead>

            <tbody className="divide-y text-[14px] divide-gray-300 bg-white divide-opacity-10">
              {financialData.length === 0 ? (
                <tr>
                  <td
                    colSpan={dynamicDateRanges.length + 7}
                    className=" text-center text-gray-600 text-lg"
                  >
                    {isLoading
                      ? "Loading data..."
                      : "No data available for the selected criteria."}
                  </td>
                </tr>
              ) : (
                financialData.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`
                          group hover:bg-gray-100 hover:bg-opacity-50 transition-colors duration-200
                          ${
                            row.type === "summary"
                              ? "bg-gray-100 bg-opacity-20"
                              : ""
                          }
                          ${
                            row.type === "expandable"
                              ? "cursor-pointer bg-blue-100 bg-opacity-30"
                              : ""
                          }
                      `}
                      onClick={() =>
                        row.type === "expandable" &&
                        row.id.startsWith("total-staff-cost")
                          ? toggleStaffRow(row.id)
                          : row.type === "expandable" &&
                              row.id.startsWith("non-labor-staff-cost")
                            ? toggleNonLaborAcctRow(row.id)
                            : null
                      }
                    >
                      <td className="py-1 px-2 whitespace-nowrap border-r-2 border-gray-300 sticky left-0 z-10 bg-inherit flex items-center text-black text-xs">
                        {row.type === "expandable" && (
                          <span className="mr-2">
                            {(row.id.startsWith("total-staff-cost") &&
                              expandedStaffRows.includes(row.id)) ||
                            (row.id.startsWith("non-labor-staff-cost") &&
                              expandedNonLaborAcctRows.includes(row.id)) ? (
                              <ChevronUpIcon className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
                            ) : (
                              <ChevronDownIcon className="h- w-4 text-gray-600 group-hover:text-gray-900" />
                            )}
                          </span>
                        )}
                        {row.description}
                      </td>
                      <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                        {row.accountId || ""}
                      </td>
                      <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                        {row.orgId || ""}
                      </td>
                      <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                        {row.glcPlc || ""}
                      </td>
                      <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs">
                        {formatValue(row.hrlyRate)}
                      </td>
                      <td
                        className={`py-1 px-2 text-right whitespace-nowrap text-black text-xs ${
                          typeof row.total === "number" && row.total < 0
                            ? "text-red-600"
                            : typeof row.total === "number" &&
                                row.total > 0 &&
                                row.description === "Profit"
                              ? "text-green-600"
                              : ""
                        }`}
                      >
                        {row.description.includes("Profit %")
                          ? formatValue(row.total, false, true)
                          : row.description === "Revenue"
                            ? formatValue(revenueSum)
                            : formatValue(row.total)}
                      </td>
                      {dynamicDateRanges.map((range) => {
                        let dataForRange;

                        if (row.description === "Revenue") {
                          if (
                            selectedRevenueView === "t&m" &&
                            row.tnmRevenueData
                          ) {
                            dataForRange = row.tnmRevenueData[range];
                          } else if (
                            selectedRevenueView === "cpff" &&
                            row.cpffRevenueData
                          ) {
                            dataForRange = row.cpffRevenueData[range];
                          } else {
                            dataForRange = row.data[range];
                          }
                        } else {
                          dataForRange = row.data[range];
                        }
                        // console.log(
                        //   `  Rendering cell for row: ${row.description}, range: ${range}, data: ${dataForRange}`
                        // );

                        const isProfitRow = row.id.startsWith("profit-");
                        const isNegative =
                          typeof dataForRange === "number" && dataForRange < 0;
                        const isPositive =
                          typeof dataForRange === "number" && dataForRange > 0;
                        let textColorClass = "";
                        if (isProfitRow) {
                          if (isNegative) {
                            textColorClass = "text-red-600";
                          } else if (isPositive) {
                            textColorClass = "text-green-600";
                          }
                        }
                        return (
                          <td
                            key={range}
                            className={`py-1 px-2 text-right whitespace-nowrap text-black text-xs ${textColorClass}`}
                          >
                            {row.description.includes("Profit %")
                              ? formatValue(dataForRange, false, true)
                              : formatValue(dataForRange)}
                          </td>
                        );
                      })}
                    </tr>

                    {row.type === "expandable" &&
                      expandedStaffRows.includes(row.id) &&
                      row.employees &&
                      row.employees.length > 0 && (
                        <>
                          {row.employees.map((employee) => (
                            <React.Fragment key={`${row.id}-${employee.id}`}>
                              <tr
                                className="bg-gray-100 bg-opacity-20  hover:bg-gray-100 hover:bg-opacity-50 text-sm cursor-pointer group"
                                onClick={() =>
                                  toggleEmployeeDetail(
                                    `${row.id}-${employee.id}`,
                                  )
                                }
                              >
                                <td className="py-1 pl-8 pr-4 border-r-2 border-gray-300 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-black text-xs">
                                  <span className="mr-2">
                                    {expandedEmployeeDetails.includes(
                                      `${row.id}-${employee.id}`,
                                    ) ? (
                                      <ChevronUpIcon className="h-3 w-3 text-black group-hover:text-gray-900" />
                                    ) : (
                                      <ChevronDownIcon className="h-3 w-3 text-black group-hover:text-gray-900" />
                                    )}
                                  </span>
                                  {employee.name}
                                </td>
                                <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                                  {employee.accountId || ""}
                                </td>
                                <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                                  {employee.orgId || ""}
                                </td>
                                <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                                  {employee.glcPlc || ""}
                                </td>
                                <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs">
                                  {formatValue(employee.hrlyRate)}
                                </td>
                                <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs">
                                  {formatValue(employee.cost)}
                                </td>
                                {dynamicDateRanges.map((currentRange) => (
                                  <td
                                    key={`${employee.id}-${currentRange}-cost`}
                                    className="py-1 px-2 text-right whitespace-nowrap text-black text-xs"
                                  >
                                    {formatValue(
                                      employee.monthlyCost[currentRange] || 0,
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {expandedEmployeeDetails.includes(
                                `${row.id}-${employee.id}`,
                              ) && (
                                <tr
                                  key={`${employee.id}-hours-detail-row`}
                                  className="bg-gray-100 bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-60 text-xs"
                                >
                                  <td
                                    className="py-1 pl-16  relative whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px]
                                                          before:bg-gray-300 before:content-['']"
                                  >
                                    --- Employee Hours
                                  </td>
                                  <td className="py-1 px-2 text-left whitespace-nowrap"></td>
                                  <td className="py-1 px-2 text-left whitespace-nowrap"></td>
                                  <td className="py-1 px-2 text-left whitespace-nowrap"></td>
                                  <td className="py-1 px-2 text-right whitespace-nowrap"></td>
                                  <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs">
                                    {formatValue(
                                      Object.values(
                                        employee.monthlyHours,
                                      ).reduce((sum, val) => sum + val, 0),
                                    )}
                                  </td>
                                  {dynamicDateRanges.map((currentRange) => (
                                    <td
                                      key={`${employee.id}-hours-${currentRange}-amount`}
                                      className="py-1 px-2 text-right whitespace-nowrap text-black text-xs"
                                    >
                                      {formatValue(
                                        employee.monthlyHours[currentRange] ||
                                          0,
                                        true,
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              )}

                              {expandedEmployeeDetails.includes(
                                `${row.id}-${employee.id}`,
                              ) &&
                                Object.keys(employee.detailSummary).length >
                                  0 && (
                                  <>
                                    {Object.keys(employee.detailSummary).map(
                                      (detailDescription) => {
                                        const detailTotal = Object.values(
                                          employee.detailSummary[
                                            detailDescription
                                          ],
                                        ).reduce((sum, val) => sum + val, 0);

                                        return (
                                          <tr
                                            key={`${employee.id}-${detailDescription}-detail-row`}
                                            className="bg-gray-100  bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-60 text-xs"
                                          >
                                            <td
                                              className="py-1 pl-16 pr-4 relative whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px]
                                                          before:bg-gray-300 before:content-['']"
                                            >
                                              --- {detailDescription}
                                            </td>
                                            <td className="py-1 px-2 text-left whitespace-nowrap text-black">
                                              {employee.accountId || ""}
                                            </td>
                                            <td className="py-1 px-2 text-left whitespace-nowrap"></td>
                                            <td className="py-1 px-2 text-left whitespace-nowrap"></td>
                                            <td className="py-1 px-2 text-right whitespace-nowrap"></td>
                                            <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs">
                                              {formatValue(detailTotal)}
                                            </td>
                                            {dynamicDateRanges.map(
                                              (currentRange) => (
                                                <td
                                                  key={`${employee.id}-${detailDescription}-${currentRange}-amount`}
                                                  className="py-1 px-2 text-right whitespace-nowrap text-black text-xs"
                                                >
                                                  {formatValue(
                                                    employee.detailSummary[
                                                      detailDescription
                                                    ][currentRange] || 0,
                                                  )}
                                                </td>
                                              ),
                                            )}
                                          </tr>
                                        );
                                      },
                                    )}
                                  </>
                                )}
                            </React.Fragment>
                          ))}
                        </>
                      )}

                    {row.type === "expandable" &&
                      row.id.startsWith("non-labor-staff-cost") &&
                      expandedNonLaborAcctRows.includes(row.id) &&
                      row.nonLaborAccts &&
                      row.nonLaborAccts.length > 0 && (
                        <>
                          {row.nonLaborAccts.map((acctGroup) => (
                            <React.Fragment key={`${row.id}-${acctGroup.id}`}>
                              <tr
                                className="bg-gray-100 bg-opacity-20  hover:bg-gray-100 hover:bg-opacity-50 text-sm cursor-pointer group"
                                onClick={() =>
                                  toggleNonLaborAcctRow(
                                    `${row.id}-${acctGroup.id}`,
                                  )
                                }
                              >
                                <td className="py-1 pl-8 pr-4 border-r-2 border-gray-300 whitespace-nowrap sticky left-0 z-10 bg-inherit flex items-center text-black text-xs">
                                  <span className="mr-2">
                                    {expandedNonLaborAcctRows.includes(
                                      `${row.id}-${acctGroup.id}`,
                                    ) ? (
                                      <ChevronUpIcon className="h-3 w-3 text-black group-hover:text-gray-900" />
                                    ) : (
                                      <ChevronDownIcon className="h-3 w-3 text-black group-hover:text-gray-900" />
                                    )}
                                  </span>
                                  {acctGroup.description}
                                </td>
                                <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                                  {acctGroup.id || ""}
                                </td>
                                <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                                  {acctGroup.orgId || ""}
                                </td>
                                <td className="py-1 px-2 text-left whitespace-nowrap text-black text-xs">
                                  {acctGroup.glcPlc || ""}
                                </td>
                                <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs"></td>
                                <td className="py-1 px-2 text-right whitespace-nowrap text-black text-xs">
                                  {formatValue(acctGroup.total)}
                                </td>
                                {dynamicDateRanges.map((currentRange) => (
                                  <td
                                    key={`${acctGroup.id}-${currentRange}-cost`}
                                    className="py-1 px-2  text-right whitespace-nowrap text-black text-xs"
                                  >
                                    {formatValue(
                                      acctGroup.monthlyData[currentRange] || 0,
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {expandedNonLaborAcctRows.includes(
                                `${row.id}-${acctGroup.id}`,
                              ) &&
                                acctGroup.employees &&
                                acctGroup.employees.length > 0 && (
                                  <React.Fragment>
                                    <tr className="bg-gray-100 bg-opacity-30">
                                      <td
                                        className="py-1 pl-16  relative whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit text-
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px] text-xs
                                                          before:bg-gray-300 before:content-['']"
                                      >
                                        Employee
                                      </td>
                                      <td
                                        className="py-1 px-2 text-left whitespace-nowrap"
                                        colSpan="4"
                                      ></td>
                                      <td className="py-1 px-2 text-right text-xs font-semibold text-black uppercase"></td>
                                      {dynamicDateRanges.map((range) => (
                                        <td
                                          key={`header-employee-group-${range}`}
                                          className="py-1 px-2 text-right text-sm font-semibold text-gray-700 uppercase whitespace-nowrap"
                                        ></td>
                                      ))}
                                    </tr>
                                    {acctGroup.employees.map(
                                      (employeeGroup) => {
                                        // Build a lookup map once (PERFORMANCE OPTIMIZED)
                                        const entryMap = Object.fromEntries(
                                          employeeGroup.entries.map((e) => [
                                            e.month || e.id,
                                            e,
                                          ]),
                                        );

                                        return (
                                          <React.Fragment
                                            key={`${acctGroup.id}-${employeeGroup.id}-employee-block`}
                                          >
                                            <tr className="bg-gray-100  bg-opacity-30 hover:bg-gray-100 hover:bg-opacity-60 text-xs">
                                              <td
                                                className="py-1 pl-16 pr-4 relative whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px]
                                                          before:bg-gray-300 before:content-['']"
                                              >
                                                {employeeGroup.name}
                                              </td>
                                              <td colSpan={4}></td>
                                              <td className="py-1 px-2 text-right font-semibold">
                                                {formatValue(
                                                  employeeGroup.total,
                                                )}
                                              </td>
                                              {dynamicDateRanges.map(
                                                (month) => (
                                                  <td
                                                    key={`${employeeGroup.id}-${month}-total`}
                                                    className="py-1 px-2 text-right"
                                                  >
                                                    {formatValue(
                                                      employeeGroup
                                                        .monthlyData?.[month] ??
                                                        0,
                                                    )}
                                                  </td>
                                                ),
                                              )}
                                            </tr>

                                            <tr className="bg-gray-100 bg-opacity-30 text-xs">
                                              <td
                                                className="py-1 relative pl-20 whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px] text-xs
                                                          before:bg-gray-300 before:content-['']"
                                              >
                                                --- {employeeGroup.gnaName}
                                              </td>
                                              <td colSpan={4}></td>
                                              <td className="py-1 px-2 text-right text-xs  font-semibold">
                                                {formatValue(employeeGroup.gna)}
                                              </td>
                                              {dynamicDateRanges.map(
                                                (month) => {
                                                  const entry = Object.values(
                                                    entryMap,
                                                  ).find(
                                                    (e) =>
                                                      e.monthLabel === month,
                                                  );
                                                  return (
                                                    <td
                                                      key={`${employeeGroup.id}-${month}-materials`}
                                                      className="py-1 px-2 text-right text-xs"
                                                    >
                                                      {formatValue(
                                                        entry?.gna ?? 0,
                                                      )}
                                                    </td>
                                                  );
                                                },
                                              )}
                                            </tr>

                                            <tr className="bg-gray-100 bg-opacity-30 text-xs">
                                              <td
                                                className="py-1 relative pl-20 text-xs whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px]
                                                          before:bg-gray-300 before:content-['']"
                                              >
                                                --- {employeeGroup.overheadName}
                                              </td>
                                              <td colSpan={4}></td>
                                              <td className="py-1 px-2 text-right text-xs font-semibold">
                                                {formatValue(
                                                  employeeGroup.overhead,
                                                )}
                                              </td>
                                              {dynamicDateRanges.map(
                                                (month) => {
                                                  const entry = Object.values(
                                                    entryMap,
                                                  ).find(
                                                    (e) =>
                                                      e.monthLabel === month,
                                                  );

                                                  return (
                                                    <td
                                                      key={`${employeeGroup.id}-${month}-materials`}
                                                      className="py-1 px-2 text-right text-xs"
                                                    >
                                                      {formatValue(
                                                        entry?.overhead ?? 0,
                                                      )}
                                                    </td>
                                                  );
                                                },
                                              )}
                                            </tr>

                                            <tr className="bg-gray-100 bg-opacity-30 text-xs">
                                              <td
                                                className="relative py-1 pl-20 whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px]
                                                          before:bg-gray-300 before:content-['']"
                                              >
                                                --- {employeeGroup.hrName}
                                              </td>
                                              <td colSpan={4}></td>
                                              <td className="py-1 px-2 text-right text-xs font-semibold">
                                                {formatValue(employeeGroup.hr)}
                                              </td>
                                              {dynamicDateRanges.map(
                                                (month) => {
                                                  const entry = Object.values(
                                                    entryMap,
                                                  ).find(
                                                    (e) =>
                                                      e.monthLabel === month,
                                                  );

                                                  return (
                                                    <td
                                                      key={`${employeeGroup.id}-${month}-materials`}
                                                      className="py-1 px-2 text-xs text-right"
                                                    >
                                                      {formatValue(
                                                        entry?.hr ?? 0,
                                                      )}
                                                    </td>
                                                  );
                                                },
                                              )}
                                            </tr>

                                            <tr className="bg-gray-100 bg-opacity-30 text-xs">
                                              <td
                                                className="relative py-1 text-xs pl-20 whitespace-nowrap
              sticky left-0 z-20 bg-inherit
              before:absolute before:top-0 before:right-0
              before:h-full before:w-[2px]
              before:bg-gray-300 before:content-['']"
                                              >
                                                --- {employeeGroup.materialsName}
                                              </td>

                                              <td colSpan={4}></td>

                                              {/* TOTAL MATERIAL */}
                                              <td className="py-1 px-2 text-xs text-right font-semibold">
                                                {formatValue(
                                                  employeeGroup.materials,
                                                )}
                                              </td>

                                              {/* MONTH WISE MATERIAL */}
                                              {dynamicDateRanges.map(
                                                (month) => {
                                                  const entry = Object.values(
                                                    entryMap,
                                                  ).find(
                                                    (e) =>
                                                      e.monthLabel === month,
                                                  );

                                                  return (
                                                    <td
                                                      key={`${employeeGroup.id}-${month}-materials`}
                                                      className="py-1 px-2 text-xs text-right"
                                                    >
                                                      {formatValue(
                                                        entry?.materials ?? 0,
                                                      )}
                                                    </td>
                                                  );
                                                },
                                              )}
                                            </tr>

                                            <tr className="bg-gray-100 bg-opacity-30 text-xs">
                                              <td
                                                className="relative py-1 pl-20 text-xs whitespace-nowrap
                                                          sticky left-0 z-20 bg-inherit
                                                          before:absolute before:top-0 before:right-0
                                                          before:h-full before:w-[2px]
                                                          before:bg-gray-300 before:content-['']"
                                              >
                                                --- {employeeGroup.fringeName}
                                              </td>
                                              <td colSpan={4}></td>
                                              <td className="py-1 px-2 text-right font-semibold">
                                                {formatValue(
                                                  employeeGroup.fringe,
                                                )}
                                              </td>
                                              {dynamicDateRanges.map(
                                                (month) => {
                                                  const entry = Object.values(
                                                    entryMap,
                                                  ).find(
                                                    (e) =>
                                                      e.monthLabel === month,
                                                  );

                                                  return (
                                                    <td
                                                      key={`${employeeGroup.id}-${month}-materials`}
                                                      className="py-1 px-2 text-right"
                                                    >
                                                      {formatValue(
                                                        entry?.fringe ?? 0,
                                                      )}
                                                    </td>
                                                  );
                                                },
                                              )}
                                            </tr>
                                          </React.Fragment>
                                        );
                                      },
                                    )}
                                  </React.Fragment>
                                )}
                            </React.Fragment>
                          ))}
                        </>
                      )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisByPeriodContent;
