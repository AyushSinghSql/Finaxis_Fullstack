// import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import { 
//     FaFileExcel, FaFileImport, FaTable, FaCheckCircle, 
//     FaExclamationTriangle, FaCloudUploadAlt, FaBan, FaSort, FaSortUp, FaSortDown, 
//     FaDatabase, FaPercentage, FaFileInvoiceDollar 
// } from 'react-icons/fa';
// import * as XLSX from 'xlsx'; 
// import { backendUrl } from './config'; 
// import { toast } from 'react-toastify';

// const BATCH_SIZE = 25; 

// const ACCT_MAP = {
//     labOnste: "50-000-000",
//     labOnsteNonBill: "50-000-999",
//     nonLabTrvl: "50-400-000",
//     subLab: "51-000-000",
//     subNonLab: "51-400-000"
// };

// const MONTH_MAP = {
//     jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, 
//     jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
// };

// const EXPECTED_COLUMNS = [
//     { index: 1, field: 'year', header: 'Year' },
//     { index: 3, field: 'revProjName', header: 'Revenue Projection Name' },
//     { index: 4, field: 'growthOppName', header: 'Growth Opp Name' },
//     { index: 5, field: 'stage', header: 'Stage' },
//     { index: 6, field: 'customer', header: 'Customer' },
//     { index: 7, field: 'type', header: 'Type' },
//     { index: 8, field: 'role', header: 'Our Role' },
//     { index: 9, field: 'workshare', header: 'Our Workshare %' },
//     { index: 10, field: 'startDate', header: 'Start Date' },
//     { index: 11, field: 'endDate', header: 'Estimated End Date' },
//     { index: 12, field: 'contractValue', header: 'Our Contract Value' },
//     { index: 13, field: 'contractType', header: 'Contract Type(s)' },
//     { index: 14, field: 'pgoCalc', header: 'PGO Calculation' },
//     { index: 15, field: 'pwin', header: 'Pwin Value' },
//     { index: 16, field: 'jan', header: 'January (Factored)' },
//     { index: 17, field: 'feb', header: 'February (Factored)' },
//     { index: 18, field: 'mar', header: 'March (Factored)' },
//     { index: 19, field: 'apr', header: 'April (Factored)' },
//     { index: 20, field: 'may', header: 'May (Factored)' },
//     { index: 21, field: 'jun', header: 'June (Factored)' },
//     { index: 22, field: 'jul', header: 'July (Factored)' },
//     { index: 23, field: 'aug', header: 'August (Factored)' },
//     { index: 24, field: 'sep', header: 'September (Factored)' },
//     { index: 25, field: 'oct', header: 'October (Factored)' },
//     { index: 26, field: 'nov', header: 'November (Factored)' },
//     { index: 27, field: 'dec', header: 'December (Factored)' },
//     { index: 28, field: 'yearlyTotal', header: 'Yearly (Factored) Total' },
// ];

// const Opportunities = () => {
//     const [rawData, setRawData] = useState(null); 
//     const [opportunityData, setOpportunityData] = useState([]); 
//     const [isImporting, setIsImporting] = useState(false);
//     const [isCalculating, setIsCalculating] = useState(false); 
//     const [isVerifying, setIsVerifying] = useState(false); 
//     const [isSyncing, setIsSyncing] = useState(false);
//     const [syncProgress, setSyncProgress] = useState(0);
//     const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
//     const [verificationSummary, setVerificationSummary] = useState({ duplicates: [], isVerified: false });
    
//     const [splitResults, setSplitResults] = useState([]);
//     const [isSplitting, setIsSplitting] = useState(false);
    
//     const [calculationState, setCalculationState] = useState({ results: [], currentIndex: 0, total: 0, lastYear: null });
//     const fileInputRef = useRef(null);

//     const sortedData = useMemo(() => {
//         let sortableItems = [...opportunityData];
//         if (sortConfig.key !== null) {
//             sortableItems.sort((a, b) => {
//                 const aVal = a[sortConfig.key] ?? '';
//                 const bVal = b[sortConfig.key] ?? '';
//                 if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
//                 if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
//                 return 0;
//             });
//         }
//         return sortableItems;
//     }, [opportunityData, sortConfig]);

//     const requestSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
//         setSortConfig({ key, direction });
//     };

//     const processBatch = useCallback((data, state) => {
//         if (state.currentIndex >= data.length) {
//             setOpportunityData(state.results);
//             setRawData(null); 
//             setIsCalculating(false);
//             return;
//         }
//         const batchEndIndex = Math.min(state.currentIndex + BATCH_SIZE, data.length);
//         const newResults = [...state.results];
//         let currentYearTracker = state.lastYear;

//         for (let i = state.currentIndex; i < batchEndIndex; i++) {
//             const rowArr = data[i];
//             const yearVal = rowArr[1];
//             if (yearVal && yearVal !== "-" && yearVal.toString().trim() !== "") {
//                 currentYearTracker = yearVal;
//             }

//             const mappedRow = { 
//                 id: `row-${i}-${Date.now()}`,
//                 lineNumber: i + 11,
//                 year: currentYearTracker 
//             };

//             EXPECTED_COLUMNS.forEach(col => {
//                 if(col.field !== 'year') mappedRow[col.field] = rowArr[col.index];
//             });
//             newResults.push(mappedRow);
//         }

//         const nextState = { results: newResults, total: state.total, currentIndex: batchEndIndex, lastYear: currentYearTracker };
//         setCalculationState(nextState);
//         setTimeout(() => processBatch(data, nextState), 5); 
//     }, []);

//     useEffect(() => {
//         if (!rawData) return;
//         setIsCalculating(true);
//         const initialState = { results: [], total: rawData.length, currentIndex: 0, lastYear: null };
//         setCalculationState(initialState);
//         processBatch(rawData, initialState);
//     }, [rawData, processBatch]); 

//     const handleVerifyExistence = async () => {
//         if (opportunityData.length === 0) return;
//         setIsVerifying(true);
//         try {
//             const localRpItems = opportunityData.filter(item => item.revProjName?.toString().startsWith("RP-"));
//             const uniqueRpNames = [...new Set(localRpItems.map(item => item.revProjName))];
//             const response = await fetch(`${backendUrl}/GetAllNewBusiness`);
//             const apiData = await response.json();
//             const systemIds = new Set(apiData.map(item => item.businessBudgetId));
//             const duplicatesFound = uniqueRpNames.filter(name => systemIds.has(name));
//             setVerificationSummary({ duplicates: duplicatesFound, isVerified: true });
//             toast.success(`Verified: Found ${duplicatesFound.length} existing projects.`);
//         } catch (error) { toast.error("Verification failed."); } finally { setIsVerifying(false); }
//     };

//     const handleImportProjects = async () => {
//         const eligibleItems = opportunityData.filter(row => 
//             row.revProjName?.toString().startsWith("RP-") && 
//             !verificationSummary.duplicates.includes(row.revProjName)
//         );

//         if (eligibleItems.length === 0) return toast.info("No new projects to import.");

//         const revenueTotals = opportunityData.reduce((acc, curr) => {
//             const id = curr.revProjName?.toString();
//             const monthlyTotal = Object.keys(MONTH_MAP).reduce((sum, m) => sum + (parseFloat(curr[m]) || 0), 0);
//             acc[id] = (acc[id] || 0) + monthlyTotal;
//             return acc;
//         }, {});

//         const uniqueItemsToImport = Array.from(new Map(eligibleItems.map(item => [item.revProjName, item])).values());
//         setIsSyncing(true); setSyncProgress(0);

//         try {
//             for (let i = 0; i < uniqueItemsToImport.length; i++) {
//                 const row = uniqueItemsToImport[i];
//                 const now = new Date().toISOString();
//                 const totalRev = revenueTotals[row.revProjName] || 0;

//                 const payload = {
//                     businessBudgetId: row.revProjName?.toString(),
//                     description: row.growthOppName || "",
//                     level: 0, isActive: true, version: 0, versionCode: "V1",
//                     startDate: row.startDate ? new Date(row.startDate).toISOString() : now,
//                     endDate: row.endDate ? new Date(row.endDate).toISOString() : now,
//                     escalationRate: 0, orgId: "1.01.06.01", accountGroup: "Standard","nbType": "OPP", burdenTemplateId: 1,
//                     createdAt: now, updatedAt: now, modifiedBy: "System_Import", trf_ProjId: row.revProjName?.toString(),
//                     status: "Imported", stage: row.stage || "", customer: row.customer || "", type: row.type || "",
//                     ourRole: row.role || "", workshare: parseFloat(row.workshare) || 0,
//                     contractValue: row.contractValue?.toString() || "0", contractTypes: row.contractType || "",
//                     pgoCalculation: parseFloat(row.pgoCalc) || 0, pwinValue: parseFloat(row.pwin) || 0,
//                     revenue: totalRev
//                 };
//                 await fetch(`${backendUrl}/AddNewBusiness`, {
//                     method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
//                 });
//                 setSyncProgress(Math.round(((i + 1) / uniqueItemsToImport.length) * 100));
//             }
//             toast.success("Importing NB Ids Finished.");
//             handleVerifyExistence(); 
//         } catch (err) { toast.error("Sync error."); } finally { setIsSyncing(false); }
//     };

//     const handleImportRecords = async () => {
//         // We only filter for RP- projects. We DON'T filter out verificationSummary.duplicates 
//         // because even if a project exists, we still need to create its Plan (AddProjectPlan).
//         const eligibleItems = opportunityData.filter(row => 
//             row.revProjName?.toString().startsWith("RP-")
//         );

//         if (eligibleItems.length === 0) return toast.info("No valid RP- project records found in data.");

//         const totalRevenuePerProject = opportunityData.reduce((acc, curr) => {
//             const id = curr.revProjName?.toString();
//             if (!id) return acc;
//             const yearlyTotal = parseFloat(curr.yearlyTotal) || 0;
//             acc[id] = (acc[id] || 0) + yearlyTotal;
//             return acc;
//         }, {});

//         setIsSyncing(true);
//         const groupedData = eligibleItems.reduce((acc, curr) => {
//             const id = curr.revProjName?.toString();
//             if (!id) return acc;
//             if (!acc[id]) acc[id] = { ...curr };
//             return acc;
//         }, {});
//         const projects = Object.values(groupedData);

//         try {
//             for (let i = 0; i < projects.length; i++) {
//                 const proj = projects[i];
//                 const shortDate = new Date().toISOString().split('T')[0];
//                 const projRev = totalRevenuePerProject[proj.revProjName] || 0;

//                 const payload = {
                   
//                         plId: 0, projId: proj.revProjName?.toString().trim(), projType: "NBBUD", plType: "NBBUD",
//                         version: 0, templateId: 1, versionCode: "", finalVersion: false, isCompleted: false,
//                         isApproved: false, status: "In Progress", source: "", type: "NBBUD", closedPeriod: shortDate,
//                         modifiedBy: "Import", approvedBy: "Import", createdBy: "Import",
//                         projEndDt: proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : shortDate,
//                         projStartDt: proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : shortDate,
//                         proj_f_fee_amt: 0, proj_f_cst_amt: 0, proj_f_tot_amt: 0, 
//                         projName: proj.growthOppName || "", orgId: "1.01.06.01", acctGrpCd: "Revenue",
//                         revenueAccount: "", revenue: projRev, projectStatus: ""
                    
//                 };
//                 await fetch(`${backendUrl}/Project/AddProjectPlan`, {
//                     method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
//                 });
//                 setSyncProgress(Math.round(((i + 1) / projects.length) * 100));
//             }
//             toast.success(`Create NB Budgets Complete. Now click 'Calculate Splits'.`);
//         } catch (error) { toast.error("Error during Create NB Budgets."); } finally { setIsSyncing(false); }
//     };

//     const handleCalculateSplits = async () => {
//         if (opportunityData.length === 0) return toast.warning("No data to calculate.");
//         setIsSplitting(true);
//         setSyncProgress(0);

//         try {
//             const rateRes = await fetch(`${backendUrl}/api/AnalgsRt`);
//             const allRates = await rateRes.json();
//             const filteredRates = allRates.filter(r => r.ovrwrteRt === false && r.actualAmt === false);
//             if (filteredRates.length === 0) throw new Error("No applicable rates found.");
//             const latestRate = filteredRates.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))[0];

//             const uniqueProjects = [...new Set(opportunityData.map(row => row.revProjName?.toString().trim()))].filter(Boolean);
//             const projectPlanMap = {};

//             for (let i = 0; i < uniqueProjects.length; i++) {
//                 const projectId = uniqueProjects[i];
//                 try {
//                     // const planRes = await fetch(`${backendUrl}/Project/GetProjectPlans/1/admin/${projectId}`);
//                     const planRes = await fetch(`${backendUrl}/Project/GetProjectPlans/1/admin/${projectId}?status=&fetchNewBussiness=Y`);

//                     const plans = await planRes.json();
//                     if (plans && plans.length > 0) {
//                         projectPlanMap[projectId] = plans[0].plId;
//                     }
//                 } catch (err) { console.error(`Failed to fetch plan for ${projectId}`); }
//                 setSyncProgress(Math.round(((i + 1) / uniqueProjects.length) * 100));
//             }

//             const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
//             const calculatedData = [];

//             opportunityData.forEach(row => {
//                 const projId = row.revProjName?.toString().trim();
//                 months.forEach(month => {
//                     const monthlyValue = parseFloat(row[month]) || 0;
//                     if (monthlyValue === 0) return;

//                     calculatedData.push({
//                         revProjName: projId,
//                         plId: projectPlanMap[projId] || null, 
//                         month: month,
//                         year: row.year,
//                         splits: {
//                             labOnste: (monthlyValue * (latestRate.labOnste / 100)),
//                             labOnsteNonBill: (monthlyValue * (latestRate.labOnsteNonBill / 100)),
//                             nonLabTrvl: (monthlyValue * (latestRate.nonLabTrvl / 100)),
//                             subLab: (monthlyValue * (latestRate.subLab / 100)),
//                             subNonLab: (monthlyValue * (latestRate.subNonLab / 100))
//                         }
//                     });
//                 });
//             });

//             setSplitResults(calculatedData);
//             const missingIdsCount = uniqueProjects.filter(id => !projectPlanMap[id]).length;
//             if (missingIdsCount > 0) {
//                 toast.warning(`${missingIdsCount} projects are missing Plan IDs. Ensure 'Create NB Budgets' was successful.`);
//             } else {
//                 toast.success(`Calculations complete. All projects mapped successfully.`);
//             }
//         } catch (error) { toast.error(error.message || "Calculation failed."); } finally { setIsSplitting(false); setSyncProgress(0); }
//     };

//     const handleImportDirectData = async () => {
//         if (splitResults.length === 0) return toast.warning("Please calculate splits first.");
        
//         const shortDate = new Date().toISOString().split('T')[0];

//         const projectDirectCosts = splitResults.reduce((acc, curr) => {
//             const projKey = curr.revProjName;
//             const currentPlId = curr.plId; 
//             if (!currentPlId) return acc; 
//             if (!acc[projKey]) acc[projKey] = { plId: currentPlId, data: {} };

//             Object.keys(ACCT_MAP).forEach(splitType => {
//                 const acctId = ACCT_MAP[splitType];
//                 if (!acc[projKey].data[acctId]) {
//                     acc[projKey].data[acctId] = {
//                         dctId: 0, plId: currentPlId, acctId: acctId, orgId: "1.01.06.01",
//                         category: "Name", id: "TBD", type: "NB", isRev: true,
//                         isBrd: true, status: "Act", createdBy: "System",
//                         lastModifiedBy: "System", plForecasts: []
//                     };
//                 }

//                 acc[projKey].data[acctId].plForecasts.push({
//                     forecastedamt: curr.splits[splitType], forecastid: 0,
//                     projId: curr.revProjName, plId: currentPlId, emplId: "TBD",
//                     dctId: 0, month: MONTH_MAP[curr.month], year: parseInt(curr.year),
//                     updatedat: shortDate, acctId: acctId, orgId: "1.01.06.01",
//                     hrlyRate: 0, effectDt: null
//                 });
//             });
//             return acc;
//         }, {});

//         const projectGroups = Object.values(projectDirectCosts);
//         if (projectGroups.length === 0) return toast.error("No valid data with Plan IDs found.");

//         setIsSyncing(true); setSyncProgress(0);

//         try {
//             for (let i = 0; i < projectGroups.length; i++) {
//                 const group = projectGroups[i];
//                 const payloads = Object.values(group.data);
//                 const validPayloads = payloads.filter(p => p.plForecasts.length > 0);
//                 if (validPayloads.length === 0) continue;

//                 const res = await fetch(`${backendUrl}/DirectCost/AddNewDirectCosts?plid=${group.plId}&templateid=1`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(validPayloads)
//                 });
//                 if (!res.ok) console.error(`Failed to import for plid: ${group.plId}`);
//                 setSyncProgress(Math.round(((i + 1) / projectGroups.length) * 100));
//             }
//             toast.success("Direct Data imported successfully!");
//         } catch (error) { toast.error(`Sync error: ${error.message}`); } finally { setIsSyncing(false); }
//     };

//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         setIsImporting(true);
//         setVerificationSummary({ duplicates: [], isVerified: false });
//         const reader = new FileReader();
//         reader.onload = (event) => {
//             const data = new Uint8Array(event.target.result);
//             const workbook = XLSX.read(data, { type: 'array' });
//             const imported = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true });
//             setRawData(imported.slice(10)); 
//             setIsImporting(false);
//         };
//         reader.readAsArrayBuffer(file);
//     };

//     const getSortIcon = (columnField) => {
//         if (sortConfig.key !== columnField) return <FaSort className="ml-2 text-gray-400" />;
//         return sortConfig.direction === 'asc' ? <FaSortUp className="ml-2 text-blue-600" /> : <FaSortDown className="ml-2 text-blue-600" />;
//     };

//     return (
//         <div className="p-8 space-y-8 max-w-full mx-auto bg-gray-50 min-h-screen">
//             <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 flex items-center gap-3">
//                 <FaTable className="text-blue-600" /> Opportunities
//             </h1>
            
//             <div className="bg-white p-6 rounded-xl shadow-lg flex justify-between items-center">
//                 <div>
//                     <h3 className="text-lg font-bold text-gray-700">Data Management</h3>
//                     <p className="text-sm text-gray-500 italic">Sync projects and calculate dynamic direct cost splits.</p>
//                 </div>
//                 <div className="flex space-x-3">
//                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
//                     <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700">
//                         <FaFileImport className="inline mr-2" /> Upload Excel
//                     </button>
//                     <button onClick={handleVerifyExistence} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50" disabled={opportunityData.length === 0 || isVerifying}>
//                         {isVerifying ? "Verifying..." : "Verify Items"}
//                     </button>
//                     <button onClick={handleImportProjects} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={!verificationSummary.isVerified || isSyncing}>
//                         <FaCloudUploadAlt className="inline mr-2" /> Import NB Ids
//                     </button>
//                     <button onClick={handleImportRecords} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={!verificationSummary.isVerified || isSyncing}>
//                         <FaDatabase className="inline mr-2" /> Create NB Budgets
//                     </button>
//                     <button onClick={handleCalculateSplits} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={opportunityData.length === 0 || isSplitting}>
//                         <FaPercentage className="inline mr-2" /> Calculate Splits
//                     </button>
//                     <button onClick={handleImportDirectData} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={splitResults.length === 0 || isSyncing}>
//                         <FaFileInvoiceDollar className="inline mr-2" /> Import Direct Data
//                     </button>
//                 </div>
//             </div>

//             {(isSyncing || isSplitting) && (
//                 <div className="space-y-2">
//                     <div className="flex justify-between text-sm font-bold text-blue-600">
//                         <span>{isSplitting ? "Processing Calculations..." : "Uploading Data..."}</span>
//                         <span>{syncProgress}%</span>
//                     </div>
//                     <div className="w-full bg-gray-200 rounded-full h-3">
//                         <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
//                     </div>
//                 </div>
//             )}
            
//             <div className="bg-white p-6 rounded-xl shadow-lg">
//                 <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50 sticky top-0 z-10">
//                             <tr>
//                                 <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-blue-50 border-r">Status</th>
//                                 {EXPECTED_COLUMNS.map((col, idx) => (
//                                     <th key={idx} onClick={() => requestSort(col.field)} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-blue-50 border-r whitespace-nowrap cursor-pointer hover:bg-blue-100 transition-colors">
//                                         <div className="flex items-center">{col.header}{getSortIcon(col.field)}</div>
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                             {sortedData.map((opp) => {
//                                 const startsWithRP = opp.revProjName?.toString().startsWith("RP-");
//                                 const isDuplicate = verificationSummary.duplicates.includes(opp.revProjName);
//                                 let rowClass = "hover:bg-gray-50";
//                                 let statusText = <span className="text-gray-400 font-normal">-</span>;

//                                 if (verificationSummary.isVerified) {
//                                     if (startsWithRP) {
//                                         if (isDuplicate) {
//                                             rowClass = "bg-red-50";
//                                             statusText = <span className="text-red-600 font-bold flex items-center gap-1"><FaBan /> Exists</span>;
//                                         } else {
//                                             rowClass = "bg-green-50/50";
//                                             statusText = <span className="text-green-600 font-bold flex items-center gap-1"><FaCheckCircle /> Eligible</span>;
//                                         }
//                                     } else {
//                                         statusText = <span className="text-gray-400 font-normal italic">Display Only</span>;
//                                     }
//                                 }
//                                 return (
//                                     <tr key={opp.id} className={`${rowClass} transition`}>
//                                         <td className="px-4 py-3 text-xs border-r">{statusText}</td>
//                                         {EXPECTED_COLUMNS.map((col, colIdx) => (
//                                             <td key={colIdx} className={`px-4 py-3 text-sm border-r ${startsWithRP && col.field === 'revProjName' ? 'font-bold text-blue-800' : 'text-gray-600'}`}>
//                                                 {opp[col.field] || "-"}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Opportunities;


// Dynamic Burden Templates below

// import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// import { 
//     FaFileExcel, FaFileImport, FaTable, FaCheckCircle, 
//     FaExclamationTriangle, FaCloudUploadAlt, FaBan, FaSort, FaSortUp, FaSortDown, 
//     FaDatabase, FaPercentage, FaFileInvoiceDollar 
// } from 'react-icons/fa';
// import * as XLSX from 'xlsx'; 
// import { backendUrl } from './config'; 
// import { toast } from 'react-toastify';

// const BATCH_SIZE = 25; 

// const ACCT_MAP = {
//     labOnste: "50-000-000",
//     labOnsteNonBill: "50-000-999",
//     nonLabTrvl: "50-400-000",
//     subLab: "51-000-000",
//     subNonLab: "51-400-000"
// };

// const MONTH_MAP = {
//     jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, 
//     jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
// };

// const EXPECTED_COLUMNS = [
//     { index: 1, field: 'year', header: 'Year' },
//     { index: 3, field: 'revProjName', header: 'Revenue Projection Name' },
//     { index: 4, field: 'growthOppName', header: 'Growth Opp Name' },
//     { index: 5, field: 'stage', header: 'Stage' },
//     { index: 6, field: 'customer', header: 'Customer' },
//     { index: 7, field: 'type', header: 'Type' },
//     { index: 8, field: 'role', header: 'Our Role' },
//     { index: 9, field: 'workshare', header: 'Our Workshare %' },
//     { index: 10, field: 'startDate', header: 'Start Date' },
//     { index: 11, field: 'endDate', header: 'Estimated End Date' },
//     { index: 12, field: 'contractValue', header: 'Our Contract Value' },
//     { index: 13, field: 'contractType', header: 'Contract Type(s)' },
//     { index: 14, field: 'pgoCalc', header: 'PGO Calculation' },
//     { index: 15, field: 'pwin', header: 'Pwin Value' },
//     { index: 16, field: 'jan', header: 'January (Factored)' },
//     { index: 17, field: 'feb', header: 'February (Factored)' },
//     { index: 18, field: 'mar', header: 'March (Factored)' },
//     { index: 19, field: 'apr', header: 'April (Factored)' },
//     { index: 20, field: 'may', header: 'May (Factored)' },
//     { index: 21, field: 'jun', header: 'June (Factored)' },
//     { index: 22, field: 'jul', header: 'July (Factored)' },
//     { index: 23, field: 'aug', header: 'August (Factored)' },
//     { index: 24, field: 'sep', header: 'September (Factored)' },
//     { index: 25, field: 'oct', header: 'October (Factored)' },
//     { index: 26, field: 'nov', header: 'November (Factored)' },
//     { index: 27, field: 'dec', header: 'December (Factored)' },
//     { index: 28, field: 'yearlyTotal', header: 'Yearly (Factored) Total' },
// ];

// const Opportunities = () => {
//     const [rawData, setRawData] = useState(null); 
//     const [opportunityData, setOpportunityData] = useState([]); 
//     const [isImporting, setIsImporting] = useState(false);
//     const [isCalculating, setIsCalculating] = useState(false); 
//     const [isVerifying, setIsVerifying] = useState(false); 
//     const [isSyncing, setIsSyncing] = useState(false);
//     const [syncProgress, setSyncProgress] = useState(0);
//     const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
//     const [verificationSummary, setVerificationSummary] = useState({ duplicates: [], isVerified: false });
    
//     const [splitResults, setSplitResults] = useState([]);
//     const [isSplitting, setIsSplitting] = useState(false);
    
//     const [calculationState, setCalculationState] = useState({ results: [], currentIndex: 0, total: 0, lastYear: null });
//     const [templateId, setTemplateId] = useState(1); // Default to 1
//     const fileInputRef = useRef(null);

//     // Fetch dynamic template ID on mount
//     useEffect(() => {
//         const fetchTemplate = async () => {
//             try {
//                 const res = await fetch(`${backendUrl}/Orgnization/GetAllTemplates`);
//                 if (res.ok) {
//                     const data = await res.json();
//                     const forecastTemplate = data.find(t => t.templateCode?.trim() === "Forecast Rate");
//                     if (forecastTemplate) {
//                         setTemplateId(forecastTemplate.id);
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error fetching templates:", error);
//             }
//         };
//         fetchTemplate();
//     }, []);

//     const sortedData = useMemo(() => {
//         let sortableItems = [...opportunityData];
//         if (sortConfig.key !== null) {
//             sortableItems.sort((a, b) => {
//                 const aVal = a[sortConfig.key] ?? '';
//                 const bVal = b[sortConfig.key] ?? '';
//                 if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
//                 if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
//                 return 0;
//             });
//         }
//         return sortableItems;
//     }, [opportunityData, sortConfig]);

//     const requestSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
//         setSortConfig({ key, direction });
//     };

//     const processBatch = useCallback((data, state) => {
//         if (state.currentIndex >= data.length) {
//             setOpportunityData(state.results);
//             setRawData(null); 
//             setIsCalculating(false);
//             return;
//         }
//         const batchEndIndex = Math.min(state.currentIndex + BATCH_SIZE, data.length);
//         const newResults = [...state.results];
//         let currentYearTracker = state.lastYear;

//         for (let i = state.currentIndex; i < batchEndIndex; i++) {
//             const rowArr = data[i];
//             const yearVal = rowArr[1];
//             if (yearVal && yearVal !== "-" && yearVal.toString().trim() !== "") {
//                 currentYearTracker = yearVal;
//             }

//             const mappedRow = { 
//                 id: `row-${i}-${Date.now()}`,
//                 lineNumber: i + 11,
//                 year: currentYearTracker 
//             };

//             EXPECTED_COLUMNS.forEach(col => {
//                 if(col.field !== 'year') mappedRow[col.field] = rowArr[col.index];
//             });
//             newResults.push(mappedRow);
//         }

//         const nextState = { results: newResults, total: state.total, currentIndex: batchEndIndex, lastYear: currentYearTracker };
//         setCalculationState(nextState);
//         setTimeout(() => processBatch(data, nextState), 5); 
//     }, []);

//     useEffect(() => {
//         if (!rawData) return;
//         setIsCalculating(true);
//         const initialState = { results: [], total: rawData.length, currentIndex: 0, lastYear: null };
//         setCalculationState(initialState);
//         processBatch(rawData, initialState);
//     }, [rawData, processBatch]); 

//     const handleVerifyExistence = async () => {
//         if (opportunityData.length === 0) return;
//         setIsVerifying(true);
//         try {
//             const localRpItems = opportunityData.filter(item => item.revProjName?.toString().startsWith("RP-"));
//             const uniqueRpNames = [...new Set(localRpItems.map(item => item.revProjName))];
//             const response = await fetch(`${backendUrl}/GetAllNewBusiness`);
//             const apiData = await response.json();
//             const systemIds = new Set(apiData.map(item => item.businessBudgetId));
//             const duplicatesFound = uniqueRpNames.filter(name => systemIds.has(name));
//             setVerificationSummary({ duplicates: duplicatesFound, isVerified: true });
//             toast.success(`Verified: Found ${duplicatesFound.length} existing projects.`);
//         } catch (error) { toast.error("Verification failed."); } finally { setIsVerifying(false); }
//     };

//     const handleImportProjects = async () => {
//         const eligibleItems = opportunityData.filter(row => 
//             row.revProjName?.toString().startsWith("RP-") && 
//             !verificationSummary.duplicates.includes(row.revProjName)
//         );

//         if (eligibleItems.length === 0) return toast.info("No new projects to import.");

//         const revenueTotals = opportunityData.reduce((acc, curr) => {
//             const id = curr.revProjName?.toString();
//             const monthlyTotal = Object.keys(MONTH_MAP).reduce((sum, m) => sum + (parseFloat(curr[m]) || 0), 0);
//             acc[id] = (acc[id] || 0) + monthlyTotal;
//             return acc;
//         }, {});

//         const uniqueItemsToImport = Array.from(new Map(eligibleItems.map(item => [item.revProjName, item])).values());
//         setIsSyncing(true); setSyncProgress(0);

//         try {
//             for (let i = 0; i < uniqueItemsToImport.length; i++) {
//                 const row = uniqueItemsToImport[i];
//                 const now = new Date().toISOString();
//                 const totalRev = revenueTotals[row.revProjName] || 0;

//                 const payload = {
//                     businessBudgetId: row.revProjName?.toString(),
//                     description: row.growthOppName || "",
//                     level: 0, isActive: true, version: 0, versionCode: "V1",
//                     startDate: row.startDate ? new Date(row.startDate).toISOString() : now,
//                     endDate: row.endDate ? new Date(row.endDate).toISOString() : now,
//                     escalationRate: 0, orgId: "1.01.06.01", accountGroup: "Standard","nbType": "OPP", burdenTemplateId: templateId,
//                     createdAt: now, updatedAt: now, modifiedBy: "System_Import", trf_ProjId: row.revProjName?.toString(),
//                     status: "Imported", stage: row.stage || "", customer: row.customer || "", type: row.type || "",
//                     ourRole: row.role || "", workshare: parseFloat(row.workshare) || 0,
//                     contractValue: row.contractValue?.toString() || "0", contractTypes: row.contractType || "",
//                     pgoCalculation: parseFloat(row.pgoCalc) || 0, pwinValue: parseFloat(row.pwin) || 0,
//                     revenue: totalRev
//                 };
//                 await fetch(`${backendUrl}/AddNewBusiness`, {
//                     method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
//                 });
//                 setSyncProgress(Math.round(((i + 1) / uniqueItemsToImport.length) * 100));
//             }
//             toast.success("Importing NB Ids Finished.");
//             handleVerifyExistence(); 
//         } catch (err) { toast.error("Sync error."); } finally { setIsSyncing(false); }
//     };

//     const handleImportRecords = async () => {
//         const eligibleItems = opportunityData.filter(row => 
//             row.revProjName?.toString().startsWith("RP-")
//         );

//         if (eligibleItems.length === 0) return toast.info("No valid RP- project records found in data.");

//         const totalRevenuePerProject = opportunityData.reduce((acc, curr) => {
//             const id = curr.revProjName?.toString();
//             if (!id) return acc;
//             const yearlyTotal = parseFloat(curr.yearlyTotal) || 0;
//             acc[id] = (acc[id] || 0) + yearlyTotal;
//             return acc;
//         }, {});

//         setIsSyncing(true);
//         const groupedData = eligibleItems.reduce((acc, curr) => {
//             const id = curr.revProjName?.toString();
//             if (!id) return acc;
//             if (!acc[id]) acc[id] = { ...curr };
//             return acc;
//         }, {});
//         const projects = Object.values(groupedData);

//         try {
//             for (let i = 0; i < projects.length; i++) {
//                 const proj = projects[i];
//                 const shortDate = new Date().toISOString().split('T')[0];
//                 const projRev = totalRevenuePerProject[proj.revProjName] || 0;

//                 const payload = {
//                     plId: 0, projId: proj.revProjName?.toString().trim(), projType: "NBBUD", plType: "NBBUD",
//                     version: 0, templateId: templateId, versionCode: "", finalVersion: false, isCompleted: false,
//                     isApproved: false, status: "In Progress", source: "", type: "NBBUD", closedPeriod: shortDate,
//                     modifiedBy: "Import", approvedBy: "Import", createdBy: "Import",
//                     projEndDt: proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : shortDate,
//                     projStartDt: proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : shortDate,
//                     proj_f_fee_amt: 0, proj_f_cst_amt: 0, proj_f_tot_amt: 0, 
//                     projName: proj.growthOppName || "", orgId: "1.01.06.01", acctGrpCd: "Revenue",
//                     revenueAccount: "", revenue: projRev, projectStatus: ""
//                 };
//                 await fetch(`${backendUrl}/Project/AddProjectPlan`, {
//                     method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
//                 });
//                 setSyncProgress(Math.round(((i + 1) / projects.length) * 100));
//             }
//             toast.success(`Create NB Budgets Complete. Now click 'Calculate Splits'.`);
//         } catch (error) { toast.error("Error during Create NB Budgets."); } finally { setIsSyncing(false); }
//     };

//     const handleCalculateSplits = async () => {
//         if (opportunityData.length === 0) return toast.warning("No data to calculate.");
//         setIsSplitting(true);
//         setSyncProgress(0);

//         try {
//             const rateRes = await fetch(`${backendUrl}/api/AnalgsRt`);
//             const allRates = await rateRes.json();
//             const filteredRates = allRates.filter(r => r.ovrwrteRt === false && r.actualAmt === false);
//             if (filteredRates.length === 0) throw new Error("No applicable rates found.");
//             const latestRate = filteredRates.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))[0];

//             const uniqueProjects = [...new Set(opportunityData.map(row => row.revProjName?.toString().trim()))].filter(Boolean);
//             const projectPlanMap = {};

//             for (let i = 0; i < uniqueProjects.length; i++) {
//                 const projectId = uniqueProjects[i];
//                 try {
//                     const planRes = await fetch(`${backendUrl}/Project/GetProjectPlans/${templateId}/admin/${projectId}?status=&fetchNewBussiness=Y`);
//                     const plans = await planRes.json();
//                     if (plans && plans.length > 0) {
//                         projectPlanMap[projectId] = plans[0].plId;
//                     }
//                 } catch (err) { console.error(`Failed to fetch plan for ${projectId}`); }
//                 setSyncProgress(Math.round(((i + 1) / uniqueProjects.length) * 100));
//             }

//             const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
//             const calculatedData = [];

//             opportunityData.forEach(row => {
//                 const projId = row.revProjName?.toString().trim();
//                 months.forEach(month => {
//                     const monthlyValue = parseFloat(row[month]) || 0;
//                     if (monthlyValue === 0) return;

//                     calculatedData.push({
//                         revProjName: projId,
//                         plId: projectPlanMap[projId] || null, 
//                         month: month,
//                         year: row.year,
//                         splits: {
//                             labOnste: (monthlyValue * (latestRate.labOnste / 100)),
//                             labOnsteNonBill: (monthlyValue * (latestRate.labOnsteNonBill / 100)),
//                             nonLabTrvl: (monthlyValue * (latestRate.nonLabTrvl / 100)),
//                             subLab: (monthlyValue * (latestRate.subLab / 100)),
//                             subNonLab: (monthlyValue * (latestRate.subNonLab / 100))
//                         }
//                     });
//                 });
//             });

//             setSplitResults(calculatedData);
//             const missingIdsCount = uniqueProjects.filter(id => !projectPlanMap[id]).length;
//             if (missingIdsCount > 0) {
//                 toast.warning(`${missingIdsCount} projects are missing Plan IDs. Ensure 'Create NB Budgets' was successful.`);
//             } else {
//                 toast.success(`Calculations complete. All projects mapped successfully.`);
//             }
//         } catch (error) { toast.error(error.message || "Calculation failed."); } finally { setIsSplitting(false); setSyncProgress(0); }
//     };

//     const handleImportDirectData = async () => {
//         if (splitResults.length === 0) return toast.warning("Please calculate splits first.");
        
//         const shortDate = new Date().toISOString().split('T')[0];

//         const projectDirectCosts = splitResults.reduce((acc, curr) => {
//             const projKey = curr.revProjName;
//             const currentPlId = curr.plId; 
//             if (!currentPlId) return acc; 
//             if (!acc[projKey]) acc[projKey] = { plId: currentPlId, data: {} };

//             Object.keys(ACCT_MAP).forEach(splitType => {
//                 const acctId = ACCT_MAP[splitType];
//                 if (!acc[projKey].data[acctId]) {
//                     acc[projKey].data[acctId] = {
//                         dctId: 0, plId: currentPlId, acctId: acctId, orgId: "1.01.06.01",
//                         category: "Name", id: "TBD", type: "NB", isRev: true,
//                         isBrd: true, status: "Act", createdBy: "System",
//                         lastModifiedBy: "System", plForecasts: []
//                     };
//                 }

//                 acc[projKey].data[acctId].plForecasts.push({
//                     forecastedamt: curr.splits[splitType], forecastid: 0,
//                     projId: curr.revProjName, plId: currentPlId, emplId: "TBD",
//                     dctId: 0, month: MONTH_MAP[curr.month], year: parseInt(curr.year),
//                     updatedat: shortDate, acctId: acctId, orgId: "1.01.06.01",
//                     hrlyRate: 0, effectDt: null
//                 });
//             });
//             return acc;
//         }, {});

//         const projectGroups = Object.values(projectDirectCosts);
//         if (projectGroups.length === 0) return toast.error("No valid data with Plan IDs found.");

//         setIsSyncing(true); setSyncProgress(0);

//         try {
//             for (let i = 0; i < projectGroups.length; i++) {
//                 const group = projectGroups[i];
//                 const payloads = Object.values(group.data);
//                 const validPayloads = payloads.filter(p => p.plForecasts.length > 0);
//                 if (validPayloads.length === 0) continue;

//                 const res = await fetch(`${backendUrl}/DirectCost/AddNewDirectCosts?plid=${group.plId}&templateid=${templateId}`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(validPayloads)
//                 });
//                 if (!res.ok) console.error(`Failed to import for plid: ${group.plId}`);
//                 setSyncProgress(Math.round(((i + 1) / projectGroups.length) * 100));
//             }
//             toast.success("Direct Data imported successfully!");
//         } catch (error) { toast.error(`Sync error: ${error.message}`); } finally { setIsSyncing(false); }
//     };

//     const handleFileChange = (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         setIsImporting(true);
//         setVerificationSummary({ duplicates: [], isVerified: false });
//         const reader = new FileReader();
//         reader.onload = (event) => {
//             const data = new Uint8Array(event.target.result);
//             const workbook = XLSX.read(data, { type: 'array' });
//             const imported = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true });
//             setRawData(imported.slice(10)); 
//             setIsImporting(false);
//         };
//         reader.readAsArrayBuffer(file);
//     };

//     const getSortIcon = (columnField) => {
//         if (sortConfig.key !== columnField) return <FaSort className="ml-2 text-gray-400" />;
//         return sortConfig.direction === 'asc' ? <FaSortUp className="ml-2 text-blue-600" /> : <FaSortDown className="ml-2 text-blue-600" />;
//     };

//     return (
//         <div className="p-8 space-y-8 max-w-full mx-auto bg-gray-50 min-h-screen">
//             <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 flex items-center gap-3">
//                 <FaTable className="text-blue-600" /> Opportunities
//             </h1>
            
//             <div className="bg-white p-6 rounded-xl shadow-lg flex justify-between items-center">
//                 <div>
//                     <h3 className="text-lg font-bold text-gray-700">Data Management</h3>
//                     <p className="text-sm text-gray-500 italic">Sync projects and calculate dynamic direct cost splits.</p>
//                 </div>
//                 <div className="flex space-x-3">
//                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
//                     <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700">
//                         <FaFileImport className="inline mr-2" /> Upload Excel
//                     </button>
//                     <button onClick={handleVerifyExistence} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50" disabled={opportunityData.length === 0 || isVerifying}>
//                         {isVerifying ? "Verifying..." : "Verify Items"}
//                     </button>
//                     <button onClick={handleImportProjects} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={!verificationSummary.isVerified || isSyncing}>
//                         <FaCloudUploadAlt className="inline mr-2" /> Import NB Ids
//                     </button>
//                     <button onClick={handleImportRecords} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={!verificationSummary.isVerified || isSyncing}>
//                         <FaDatabase className="inline mr-2" /> Create NB Budgets
//                     </button>
//                     <button onClick={handleCalculateSplits} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={opportunityData.length === 0 || isSplitting}>
//                         <FaPercentage className="inline mr-2" /> Calculate Splits
//                     </button>
//                     <button onClick={handleImportDirectData} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={splitResults.length === 0 || isSyncing}>
//                         <FaFileInvoiceDollar className="inline mr-2" /> Import Direct Data
//                     </button>
//                 </div>
//             </div>

//             {(isSyncing || isSplitting) && (
//                 <div className="space-y-2">
//                     <div className="flex justify-between text-sm font-bold text-blue-600">
//                         <span>{isSplitting ? "Processing Calculations..." : "Uploading Data..."}</span>
//                         <span>{syncProgress}%</span>
//                     </div>
//                     <div className="w-full bg-gray-200 rounded-full h-3">
//                         <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
//                     </div>
//                 </div>
//             )}
            
//             <div className="bg-white p-6 rounded-xl shadow-lg">
//                 <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50 sticky top-0 z-10">
//                             <tr>
//                                 <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-blue-50 border-r">Status</th>
//                                 {EXPECTED_COLUMNS.map((col, idx) => (
//                                     <th key={idx} onClick={() => requestSort(col.field)} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-blue-50 border-r whitespace-nowrap cursor-pointer hover:bg-blue-100 transition-colors">
//                                         <div className="flex items-center">{col.header}{getSortIcon(col.field)}</div>
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                             {sortedData.map((opp) => {
//                                 const startsWithRP = opp.revProjName?.toString().startsWith("RP-");
//                                 const isDuplicate = verificationSummary.duplicates.includes(opp.revProjName);
//                                 let rowClass = "hover:bg-gray-50";
//                                 let statusText = <span className="text-gray-400 font-normal">-</span>;

//                                 if (verificationSummary.isVerified) {
//                                     if (startsWithRP) {
//                                         if (isDuplicate) {
//                                             rowClass = "bg-red-50";
//                                             statusText = <span className="text-red-600 font-bold flex items-center gap-1"><FaBan /> Exists</span>;
//                                         } else {
//                                             rowClass = "bg-green-50/50";
//                                             statusText = <span className="text-green-600 font-bold flex items-center gap-1"><FaCheckCircle /> Eligible</span>;
//                                         }
//                                     } else {
//                                         statusText = <span className="text-gray-400 font-normal italic">Display Only</span>;
//                                     }
//                                 }
//                                 return (
//                                     <tr key={opp.id} className={`${rowClass} transition`}>
//                                         <td className="px-4 py-3 text-xs border-r">{statusText}</td>
//                                         {EXPECTED_COLUMNS.map((col, colIdx) => (
//                                             <td key={colIdx} className={`px-4 py-3 text-sm border-r ${startsWithRP && col.field === 'revProjName' ? 'font-bold text-blue-800' : 'text-gray-600'}`}>
//                                                 {opp[col.field] || "-"}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Opportunities;


////////////////////////////////////////////////////////////////

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
    FaFileExcel, FaFileImport, FaTable, FaCheckCircle, 
    FaExclamationTriangle, FaCloudUploadAlt, FaBan, FaSort, FaSortUp, FaSortDown, 
    FaDatabase, FaPercentage, FaFileInvoiceDollar 
} from 'react-icons/fa';
import * as XLSX from 'xlsx'; 
import { backendUrl } from './config'; 
import { toast } from 'react-toastify';

const BATCH_SIZE = 25; 

const ACCT_MAP = {
    labOnste: "50-000-000",
    labOnsteNonBill: "50-000-999",
    nonLabTrvl: "50-400-000",
    subLab: "51-000-000",
    subNonLab: "51-400-000"
};

const MONTH_MAP = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, 
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

const EXPECTED_COLUMNS = [
    { index: 1, field: 'year', header: 'Year' },
    { index: 3, field: 'revProjName', header: 'Revenue Projection Name' },
    { index: 4, field: 'growthOppName', header: 'Growth Opp Name' },
    { index: 5, field: 'stage', header: 'Stage' },
    { index: 6, field: 'customer', header: 'Customer' },
    { index: 7, field: 'type', header: 'Type' },
    { index: 8, field: 'role', header: 'Our Role' },
    { index: 9, field: 'workshare', header: 'Our Workshare %' },
    { index: 10, field: 'startDate', header: 'Start Date' },
    { index: 11, field: 'endDate', header: 'Estimated End Date' },
    { index: 12, field: 'contractValue', header: 'Our Contract Value' },
    { index: 13, field: 'contractType', header: 'Contract Type(s)' },
    { index: 14, field: 'pgoCalc', header: 'PGO Calculation' },
    { index: 15, field: 'pwin', header: 'Pwin Value' },
    { index: 16, field: 'jan', header: 'January (Factored)' },
    { index: 17, field: 'feb', header: 'February (Factored)' },
    { index: 18, field: 'mar', header: 'March (Factored)' },
    { index: 19, field: 'apr', header: 'April (Factored)' },
    { index: 20, field: 'may', header: 'May (Factored)' },
    { index: 21, field: 'jun', header: 'June (Factored)' },
    { index: 22, field: 'jul', header: 'July (Factored)' },
    { index: 23, field: 'aug', header: 'August (Factored)' },
    { index: 24, field: 'sep', header: 'September (Factored)' },
    { index: 25, field: 'oct', header: 'October (Factored)' },
    { index: 26, field: 'nov', header: 'November (Factored)' },
    { index: 27, field: 'dec', header: 'December (Factored)' },
    { index: 28, field: 'yearlyTotal', header: 'Yearly (Factored) Total' },
];

const Opportunities = () => {
    const [rawData, setRawData] = useState(null); 
    const [opportunityData, setOpportunityData] = useState([]); 
    const [isImporting, setIsImporting] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false); 
    const [isVerifying, setIsVerifying] = useState(false); 
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [verificationSummary, setVerificationSummary] = useState({ duplicates: [], isVerified: false });
    
    const [splitResults, setSplitResults] = useState([]);
    const [isSplitting, setIsSplitting] = useState(false);
    
    const [calculationState, setCalculationState] = useState({ results: [], currentIndex: 0, total: 0, lastYear: null });
    const [templateId, setTemplateId] = useState(1); // Default to 1
    const fileInputRef = useRef(null);

    // Fetch dynamic template ID on mount
    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const res = await fetch(`${backendUrl}/Orgnization/GetAllTemplates`);
                if (res.ok) {
                    const data = await res.json();
                    const forecastTemplate = data.find(t => t.templateCode?.trim() === "Forecast Rate");
                    if (forecastTemplate) {
                        setTemplateId(forecastTemplate.id);
                    }
                }
            } catch (error) {
                console.error("Error fetching templates:", error);
            }
        };
        fetchTemplate();
    }, []);

    const sortedData = useMemo(() => {
        let sortableItems = [...opportunityData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key] ?? '';
                const bVal = b[sortConfig.key] ?? '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [opportunityData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const processBatch = useCallback((data, state) => {
        if (state.currentIndex >= data.length) {
            setOpportunityData(state.results);
            setRawData(null); 
            setIsCalculating(false);
            return;
        }
        const batchEndIndex = Math.min(state.currentIndex + BATCH_SIZE, data.length);
        const newResults = [...state.results];
        let currentYearTracker = state.lastYear;

        for (let i = state.currentIndex; i < batchEndIndex; i++) {
            const rowArr = data[i];
            const yearVal = rowArr[1];
            if (yearVal && yearVal !== "-" && yearVal.toString().trim() !== "") {
                currentYearTracker = yearVal;
            }

            const mappedRow = { 
                id: `row-${i}-${Date.now()}`,
                lineNumber: i + 11,
                year: currentYearTracker 
            };

            EXPECTED_COLUMNS.forEach(col => {
                if(col.field !== 'year') mappedRow[col.field] = rowArr[col.index];
            });
            newResults.push(mappedRow);
        }

        const nextState = { results: newResults, total: state.total, currentIndex: batchEndIndex, lastYear: currentYearTracker };
        setCalculationState(nextState);
        setTimeout(() => processBatch(data, nextState), 5); 
    }, []);

    useEffect(() => {
        if (!rawData) return;
        setIsCalculating(true);
        const initialState = { results: [], total: rawData.length, currentIndex: 0, lastYear: null };
        setCalculationState(initialState);
        processBatch(rawData, initialState);
    }, [rawData, processBatch]); 

    const handleVerifyExistence = async () => {
        if (opportunityData.length === 0) return;
        setIsVerifying(true);
        try {
            const localRpItems = opportunityData.filter(item => item.revProjName?.toString().startsWith("RP-"));
            const uniqueRpNames = [...new Set(localRpItems.map(item => item.revProjName))];
            const response = await fetch(`${backendUrl}/GetAllNewBusiness`);
            const apiData = await response.json();
            const systemIds = new Set(apiData.map(item => item.businessBudgetId));
            const duplicatesFound = uniqueRpNames.filter(name => systemIds.has(name));
            setVerificationSummary({ duplicates: duplicatesFound, isVerified: true });
            toast.success(`Verified: Found ${duplicatesFound.length} existing projects.`);
        } catch (error) { toast.error("Verification failed."); } finally { setIsVerifying(false); }
    };

    const handleImportProjects = async () => {
        const eligibleItems = opportunityData.filter(row => 
            row.revProjName?.toString().startsWith("RP-") && 
            !verificationSummary.duplicates.includes(row.revProjName)
        );

        if (eligibleItems.length === 0) return toast.info("No new projects to import.");

        const revenueTotals = opportunityData.reduce((acc, curr) => {
            const id = curr.revProjName?.toString();
            const monthlyTotal = Object.keys(MONTH_MAP).reduce((sum, m) => sum + (parseFloat(curr[m]) || 0), 0);
            acc[id] = (acc[id] || 0) + monthlyTotal;
            return acc;
        }, {});

        const uniqueItemsToImport = Array.from(new Map(eligibleItems.map(item => [item.revProjName, item])).values());
        setIsSyncing(true); setSyncProgress(0);

        try {
            for (let i = 0; i < uniqueItemsToImport.length; i++) {
                const row = uniqueItemsToImport[i];
                const now = new Date().toISOString();
                const totalRev = revenueTotals[row.revProjName] || 0;

                const payload = {
                    businessBudgetId: row.revProjName?.toString(),
                    description: row.growthOppName || "",
                    level: 0, isActive: true, version: 0, versionCode: "V1",
                    startDate: row.startDate ? new Date(row.startDate).toISOString() : now,
                    endDate: row.endDate ? new Date(row.endDate).toISOString() : now,
                    escalationRate: 0, orgId: "1.01.06.01", accountGroup: "Standard","nbType": "OPP", burdenTemplateId: templateId,
                    createdAt: now, updatedAt: now, modifiedBy: "System_Import", trf_ProjId: row.revProjName?.toString(),
                    status: "Imported", stage: row.stage || "", customer: row.customer || "", type: row.type || "",
                    ourRole: row.role || "", workshare: parseFloat(row.workshare) || 0,
                    contractValue: row.contractValue?.toString() || "0", contractTypes: row.contractType || "",
                    pgoCalculation: parseFloat(row.pgoCalc) || 0, pwinValue: parseFloat(row.pwin) || 0,
                    revenue: totalRev
                };
                await fetch(`${backendUrl}/AddNewBusiness`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                setSyncProgress(Math.round(((i + 1) / uniqueItemsToImport.length) * 100));
            }
            toast.success("Importing NB Ids Finished.");
            handleVerifyExistence(); 
        } catch (err) { toast.error("Sync error."); } finally { setIsSyncing(false); }
    };

    const handleImportRecords = async () => {
        const eligibleItems = opportunityData.filter(row => 
            row.revProjName?.toString().startsWith("RP-")
        );

        if (eligibleItems.length === 0) return toast.info("No valid RP- project records found in data.");

        const totalRevenuePerProject = opportunityData.reduce((acc, curr) => {
            const id = curr.revProjName?.toString();
            if (!id) return acc;
            const yearlyTotal = parseFloat(curr.yearlyTotal) || 0;
            acc[id] = (acc[id] || 0) + yearlyTotal;
            return acc;
        }, {});

        setIsSyncing(true);
        const groupedData = eligibleItems.reduce((acc, curr) => {
            const id = curr.revProjName?.toString();
            if (!id) return acc;
            if (!acc[id]) acc[id] = { ...curr };
            return acc;
        }, {});
        const projects = Object.values(groupedData);

        try {
            for (let i = 0; i < projects.length; i++) {
                const proj = projects[i];
                const shortDate = new Date().toISOString().split('T')[0];
                const projRev = totalRevenuePerProject[proj.revProjName] || 0;

                const payload = {
                    plId: 0, projId: proj.revProjName?.toString().trim(), projType: "NBBUD", plType: "NBBUD",
                    version: 0, templateId: templateId, versionCode: "", finalVersion: false, isCompleted: false,
                    isApproved: false, status: "In Progress", source: "", type: "NBBUD", closedPeriod: shortDate,
                    modifiedBy: "Import", approvedBy: "Import", createdBy: "Import",
                    projEndDt: proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : shortDate,
                    projStartDt: proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : shortDate,
                    proj_f_fee_amt: 0, proj_f_cst_amt: 0, proj_f_tot_amt: 0, 
                    projName: proj.growthOppName || "", orgId: "1.01.06.01", acctGrpCd: "Revenue",
                    revenueAccount: "", revenue: projRev, projectStatus: ""
                };
                await fetch(`${backendUrl}/Project/AddProjectPlan`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                });
                setSyncProgress(Math.round(((i + 1) / projects.length) * 100));
            }
            toast.success(`Create NB Budgets Complete. Now click 'Calculate Splits'.`);
        } catch (error) { toast.error("Error during Create NB Budgets."); } finally { setIsSyncing(false); }
    };

    const handleCalculateSplits = async () => {
        if (opportunityData.length === 0) return toast.warning("No data to calculate.");
        setIsSplitting(true);
        setSyncProgress(0);

        try {
            const rateRes = await fetch(`${backendUrl}/api/AnalgsRt`);
            const allRates = await rateRes.json();
            const filteredRates = allRates.filter(r => r.ovrwrteRt === false && r.actualAmt === false);
            if (filteredRates.length === 0) throw new Error("No applicable rates found.");
            const latestRate = filteredRates.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))[0];

            const uniqueProjects = [...new Set(opportunityData.map(row => row.revProjName?.toString().trim()))].filter(Boolean);
            const projectPlanMap = {};

            for (let i = 0; i < uniqueProjects.length; i++) {
                const projectId = uniqueProjects[i];
                try {
                    const planRes = await fetch(`${backendUrl}/Project/GetProjectPlans/${templateId}/admin/${projectId}?status=&fetchNewBussiness=Y`);
                    const plans = await planRes.json();
                    if (plans && plans.length > 0) {
                        projectPlanMap[projectId] = plans[0].plId;
                    }
                } catch (err) { console.error(`Failed to fetch plan for ${projectId}`); }
                setSyncProgress(Math.round(((i + 1) / uniqueProjects.length) * 100));
            }

            const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            const calculatedData = [];

            opportunityData.forEach(row => {
                const projId = row.revProjName?.toString().trim();
                months.forEach(month => {
                    const monthlyValue = parseFloat(row[month]) || 0;
                    if (monthlyValue === 0) return;

                    calculatedData.push({
                        revProjName: projId,
                        plId: projectPlanMap[projId] || null, 
                        month: month,
                        year: row.year,
                        splits: {
                            labOnste: (monthlyValue * (latestRate.labOnste / 100)),
                            labOnsteNonBill: (monthlyValue * (latestRate.labOnsteNonBill / 100)),
                            nonLabTrvl: (monthlyValue * (latestRate.nonLabTrvl / 100)),
                            subLab: (monthlyValue * (latestRate.subLab / 100)),
                            subNonLab: (monthlyValue * (latestRate.subNonLab / 100))
                        }
                    });
                });
            });

            setSplitResults(calculatedData);
            const missingIdsCount = uniqueProjects.filter(id => !projectPlanMap[id]).length;
            if (missingIdsCount > 0) {
                toast.warning(`${missingIdsCount} projects are missing Plan IDs. Ensure 'Create NB Budgets' was successful.`);
            } else {
                toast.success(`Calculations complete. All projects mapped successfully.`);
            }
        } catch (error) { toast.error(error.message || "Calculation failed."); } finally { setIsSplitting(false); setSyncProgress(0); }
    };

    const handleImportDirectData = async () => {
        if (splitResults.length === 0) return toast.warning("Please calculate splits first.");
        
        const shortDate = new Date().toISOString().split('T')[0];

        const projectDirectCosts = splitResults.reduce((acc, curr) => {
            const projKey = curr.revProjName;
            const currentPlId = curr.plId; 
            if (!currentPlId) return acc; 
            if (!acc[projKey]) acc[projKey] = { plId: currentPlId, projId: projKey, data: {} };

            Object.keys(ACCT_MAP).forEach(splitType => {
                const acctId = ACCT_MAP[splitType];
                if (!acc[projKey].data[acctId]) {
                    acc[projKey].data[acctId] = {
                        dctId: 0, plId: currentPlId, acctId: acctId, orgId: "1.01.06.01",
                        category: "-", id: "TBD", type: "NB", isRev: true,
                        isBrd: true, status: "Act", createdBy: "System",
                        lastModifiedBy: "System", plForecasts: []
                    };
                }

                acc[projKey].data[acctId].plForecasts.push({
                    forecastedamt: curr.splits[splitType], forecastid: 0,
                    projId: curr.revProjName, plId: currentPlId, emplId: "TBD",
                    dctId: 0, month: MONTH_MAP[curr.month], year: parseInt(curr.year),
                    updatedat: shortDate, acctId: acctId, orgId: "1.01.06.01",
                    hrlyRate: 0, effectDt: null
                });
            });
            return acc;
        }, {});

        const projectGroups = Object.values(projectDirectCosts);
        if (projectGroups.length === 0) return toast.error("No valid data with Plan IDs found.");

        setIsSyncing(true); setSyncProgress(0);

        try {
            for (let i = 0; i < projectGroups.length; i++) {
                const group = projectGroups[i];
                const payloads = Object.values(group.data);
                const validPayloads = payloads.filter(p => p.plForecasts.length > 0);
                
                // 1. Existing Direct Costs Call
                if (validPayloads.length > 0) {
                    const res = await fetch(`${backendUrl}/DirectCost/AddNewDirectCosts?plid=${group.plId}&templateid=${templateId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(validPayloads)
                    });
                    if (!res.ok) console.error(`Failed to import for plid: ${group.plId}`);
                }

                // 2. Additional Step: Add Revenue For NB
                const revPayload = [];
                const projectRows = opportunityData.filter(row => row.revProjName?.toString().trim() === group.projId);
                
                projectRows.forEach(row => {
                    Object.keys(MONTH_MAP).forEach(m => {
                        const amt = parseFloat(row[m]) || 0;
                        if (amt !== 0) {
                            revPayload.push({
                                fy_Cd: parseInt(row.year),
                                period: MONTH_MAP[m],
                                revAmt: amt
                            });
                        }
                    });
                });

                if (revPayload.length > 0) {
                    const revRes = await fetch(`${backendUrl}/ProjRevWrkPd/AddRevenueForNB?pl_id=${group.plId}&proj_id=${group.projId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(revPayload)
                    });
                    if (!revRes.ok) console.error(`Failed to import revenue for proj_id: ${group.projId}`);
                }

                setSyncProgress(Math.round(((i + 1) / projectGroups.length) * 100));
            }
            toast.success("Direct Data and Revenue imported successfully!");
        } catch (error) { toast.error(`Sync error: ${error.message}`); } finally { setIsSyncing(false); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsImporting(true);
        setVerificationSummary({ duplicates: [], isVerified: false });
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const imported = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true });
            setRawData(imported.slice(10)); 
            setIsImporting(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const getSortIcon = (columnField) => {
        if (sortConfig.key !== columnField) return <FaSort className="ml-2 text-gray-400" />;
        return sortConfig.direction === 'asc' ? <FaSortUp className="ml-2 text-blue-600" /> : <FaSortDown className="ml-2 text-blue-600" />;
    };

    return (
        <div className="p-8 space-y-8 max-w-full mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 flex items-center gap-3">
                <FaTable className="text-blue-600" /> Opportunities
            </h1>
            
            <div className="bg-white p-6 rounded-xl shadow-lg flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-700">Data Management</h3>
                    <p className="text-sm text-gray-500 italic">Sync projects and calculate dynamic direct cost splits.</p>
                </div>
                <div className="flex space-x-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700">
                        <FaFileImport className="inline mr-2" /> Upload Excel
                    </button>
                    <button onClick={handleVerifyExistence} className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50" disabled={opportunityData.length === 0 || isVerifying}>
                        {isVerifying ? "Verifying..." : "Verify Items"}
                    </button>
                    <button onClick={handleImportProjects} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={!verificationSummary.isVerified || isSyncing}>
                        <FaCloudUploadAlt className="inline mr-2" /> Import Opportunity IDs 
                    </button>
                    <button onClick={handleImportRecords} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={!verificationSummary.isVerified || isSyncing}>
                        <FaDatabase className="inline mr-2" /> Create Opportunity Budget
                    </button>
                    <button onClick={handleCalculateSplits} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={opportunityData.length === 0 || isSplitting}>
                        <FaPercentage className="inline mr-2" /> Calculate Splits
                    </button>
                    <button onClick={handleImportDirectData} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50" disabled={splitResults.length === 0 || isSyncing}>
                        <FaFileInvoiceDollar className="inline mr-2" /> Import Calculated Data
                    </button>
                </div>
            </div>

            {(isSyncing || isSplitting) && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-blue-600">
                        <span>{isSplitting ? "Processing Calculations..." : "Uploading Data..."}</span>
                        <span>{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${syncProgress}%` }}></div>
                    </div>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto border rounded-lg max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-blue-50 border-r">Status</th>
                                {EXPECTED_COLUMNS.map((col, idx) => (
                                    <th key={idx} onClick={() => requestSort(col.field)} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase bg-blue-50 border-r whitespace-nowrap cursor-pointer hover:bg-blue-100 transition-colors">
                                        <div className="flex items-center">{col.header}{getSortIcon(col.field)}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedData.map((opp) => {
                                const startsWithRP = opp.revProjName?.toString().startsWith("RP-");
                                const isDuplicate = verificationSummary.duplicates.includes(opp.revProjName);
                                let rowClass = "hover:bg-gray-50";
                                let statusText = <span className="text-gray-400 font-normal">-</span>;

                                if (verificationSummary.isVerified) {
                                    if (startsWithRP) {
                                        if (isDuplicate) {
                                            rowClass = "bg-red-50";
                                            statusText = <span className="text-red-600 font-bold flex items-center gap-1"><FaBan /> Exists</span>;
                                        } else {
                                            rowClass = "bg-green-50/50";
                                            statusText = <span className="text-green-600 font-bold flex items-center gap-1"><FaCheckCircle /> Eligible</span>;
                                        }
                                    } else {
                                        statusText = <span className="text-gray-400 font-normal italic">Display Only</span>;
                                    }
                                }
                                return (
                                    <tr key={opp.id} className={`${rowClass} transition`}>
                                        <td className="px-4 py-3 text-xs border-r">{statusText}</td>
                                        {EXPECTED_COLUMNS.map((col, colIdx) => (
                                            <td key={colIdx} className={`px-4 py-3 text-sm border-r ${startsWithRP && col.field === 'revProjName' ? 'font-bold text-blue-800' : 'text-gray-600'}`}>
                                                {opp[col.field] || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Opportunities;