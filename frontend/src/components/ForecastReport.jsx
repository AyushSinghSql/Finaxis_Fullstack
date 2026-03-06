
// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { 
//   FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, 
//   FaChevronLeft, FaChevronRight, FaPlay, FaFileDownload 
// } from 'react-icons/fa';
// import { backendUrl } from "./config"; 

// // Export Libraries
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import pptxgen from "pptxgenjs";

// // Constants and Mappings
// const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
// const ROWS_PER_PAGE = 20; 

// const GENERAL_COSTS = 'GENERAL-COSTS';
// const SECTION_LABELS = { 
//   REVENUE_SECTION: ' Revenue (REVENUE)', 
//   INDIRECT_SECTION: ' Indirect', 
//   FRINGE: '1. Fringe', OVERHEAD: '2. Overhead', MANDH: '3. Mat & Handling', GNA: '4. General & Admin', 
//   LABOR: 'Sumaria Labor Onsite (LABOR)', 
//   'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)', 
//   'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)', 
//   'NON-LABOR-SUBCON': 'Subcontractors (LABOR)', 
//   'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)', 
//   TOTAL_FEE: 'Total Fee', 
//   [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)' 
// };

// const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
// const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
// const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];

// const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
// const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
// const TRAVEL_NONLABOR_ACCTS = new Set(['50-400-000', '50-400-004', '50-400-008', '50-300-000', '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002']);
// const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
// const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);

// // Helper Functions
// const formatCurrency = (amount) => (typeof amount !== 'number' || isNaN(amount) || amount === 0) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
// const formatDate = (dateString) => { if (!dateString) return '-'; const date = new Date(dateString.split('T')[0] || dateString); return isNaN(date) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
// const getRollupId = (projId) => { if (!projId) return 'N/A'; const match = projId.match(/^(\d+)/); return match ? match[1] : projId.split('.')[0]; };

// // Dynamic Period Helpers
// const getPeriodKey = (month, year) => {
//     const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     return `${monthPrefixes[month - 1]}-${String(year).slice(-2)}`;
// };

// const isYellowZone = (periodStr) => {
//     if (periodStr === 'Total') return false;
//     const [monthStr, yearStr] = periodStr.split('-');
//     const year = 2000 + parseInt(yearStr);
//     const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
//     // Yellow zone starts from Jan-26 (Year >= 2026)
//     return year > 2026 || (year === 2026 && monthIndex >= 0);
// };

// const determineSectionAndIndirectKey = (item) => {
//     const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
//     const poolName = (item.poolName || '').toUpperCase();
//     let section = GENERAL_COSTS, indirectKey = null;
//     if (subTotTypeNo === 1) section = 'REVENUE_SECTION';
//     else if (subTotTypeNo === 4) {
//         if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
//         else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
//         else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
//         else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
//         section = GENERAL_COSTS; 
//     } 
//     return { section, indirectKey, subTotTypeNo }; 
// };

// const classifyCostSection = (acctId, currentSection) => {
//     if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
//     if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
//     if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
//     if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
//     if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
//     return currentSection; 
// };

// const transformData = (detailData, forecastData, dynamicPeriodMap, dynamicMonthlyPeriods) => {
//     const aggregatedDataMap = {}; 
//     forecastData.forEach(item => {
//         const periodKey = getPeriodKey(item.month, item.year);
//         const detailRowKey = `${item.projId}-${item.acctId}-0-0`;
//         if (!periodKey) return; 
//         let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
//         let forecastSubTotTypeNo = 0; 
//         if (item.revenue !== undefined && item.revenue !== 0) { forecastSection = 'REVENUE_SECTION'; forecastSubTotTypeNo = 1; }
//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast: ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'Total': 0, };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         if (row.section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { const costAmount = (item.cost || 0); if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; }
//         INDIRECT_KEYS.forEach(ik => {
//             const indirectAmount = (item[ik.toLowerCase()] || 0);
//             if (indirectAmount !== 0) {
//                 const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
//                 if (!aggregatedDataMap[indirectRowKey]) { aggregatedDataMap[indirectRowKey] = { id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: GENERAL_COSTS, subTotTypeNo: 4, 'Total': 0, }; }
//                 aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
//             }
//         });
//     });
//     detailData.forEach(item => {
//         let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
//         if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
//         const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 
//         const periodKey = dynamicPeriodMap[item.pdNo];
//         if (!periodKey) return; 
//         if (!aggregatedDataMap[detailRowKey]) { aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, accountName: item.l1AcctName || item.poolName || 'Unknown Pool', projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt, parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'Total': 0, };
//         } else { const row = aggregatedDataMap[detailRowKey]; row.accountName = item.l1AcctName || item.poolName || row.accountName; row.popStartDate = item.projStartDt || row.popStartDate; row.popEndDate = item.projEndDt || row.popEndDate; row.section = section; if (item.projName) row.projectName = item.projName; row.subTotTypeNo = subTotTypeNo; }
//         const row = aggregatedDataMap[detailRowKey];
//         const monthlyAmount = (item.ptdIncurAmt || 0); 
//         if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
//         else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
//         else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
//     });
//     Object.values(aggregatedDataMap).forEach(row => { 
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { 
//             let total = 0; 
//             dynamicMonthlyPeriods.forEach(period => { total += (row[period] || 0); }); 
//             row['Total'] = total; 
//         } else row['Total'] = 0; 
//     });
//     return Object.values(aggregatedDataMap); 
// };

// const ForecastReport = () => {
//     const [projectSearchTerm, setProjectSearchTerm] = useState('');
//     const [loading, setLoading] = useState(false); 
//     const [isReportRun, setIsReportRun] = useState(false); 
//     const [error, setError] = useState(null);
//     const [apiData, setApiData] = useState([]); 
//     const [currentPage, setCurrentPage] = useState(1);
//     const [showExportMenu, setShowExportMenu] = useState(false);

//     // Dynamic Period States
//     const [timePeriods, setTimePeriods] = useState([]); // Includes FY-Total
//     const [monthlyPeriods, setMonthlyPeriods] = useState([]); // Only months
//     const [periodMap, setPeriodMap] = useState({});

//     const leftPaneRef = useRef(null);
//     const rightPaneRef = useRef(null);
//     const reportContainerRef = useRef(null);

//     const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
//     const [expandedSections, setExpandedSections] = useState(initialExpandedState);
//     const [expandedProjects, setExpandedProjects] = useState({}); 

//     const toggleSection = useCallback((key) => { setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })); }, []);
//     const toggleProject = useCallback((projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); }, []);
//     const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

//     const handleToggleAll = () => {
//         if (isAllExpanded) { setExpandedSections(initialExpandedState); setExpandedProjects({}); 
//         } else { const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {}); setExpandedSections(allExpanded); }
//     };

//     const handleRunReport = async () => {
//         setLoading(true); setIsReportRun(true); setError(null);
//         try {
//             const [detailResponse, forecastResponse] = await Promise.all([
//                 fetch(`${backendUrl}${DETAIL_API_PATH}`), 
//                 fetch(`${backendUrl}${FORECAST_API_PATH}`)
//             ]);
//             if (!detailResponse.ok) throw new Error(`Detail API failed: ${detailResponse.statusText}`);
//             const detailData = await detailResponse.json();
//             const forecastData = forecastResponse.ok ? await forecastResponse.json() : [];

//             // --- Generate Dynamic Timeline ---
//             const years = forecastData.map(d => d.year).filter(y => y);
//             const minYear = years.length > 0 ? Math.min(...years, 2025) : 2025;
//             const maxYear = years.length > 0 ? Math.max(...years) : 2026;
            
//             const dynamicMonthly = [];
//             const dynamicMap = {};
//             let pdNoCounter = 1;

//             for (let y = minYear; y <= maxYear; y++) {
//                 for (let m = 1; m <= 12; m++) {
//                     const key = getPeriodKey(m, y);
//                     dynamicMonthly.push(key);
//                     dynamicMap[pdNoCounter] = key;
//                     pdNoCounter++;
//                 }
//             }

//             setMonthlyPeriods(dynamicMonthly);
//             setTimePeriods([...dynamicMonthly, 'Total']);
//             setPeriodMap(dynamicMap);

//             const transformedRows = transformData(detailData, forecastData, dynamicMap, dynamicMonthly);
//             setApiData(transformedRows);
//         } catch (e) { setApiData([]); setError(`Data load failed: ${e.message}`); } finally { setLoading(false); }
//     };

//     const handleScrollSync = (e) => {
//         if (e.target === leftPaneRef.current) rightPaneRef.current.scrollTop = e.target.scrollTop;
//         else leftPaneRef.current.scrollTop = e.target.scrollTop;
//     };

//     // --- Export Functions ---
//     const exportToExcel = () => {
//         const worksheetData = [];
//         const headers = ["Project", "Project Name", "Org", "Account ID", "Account Name", ...timePeriods];
//         worksheetData.push(headers);
//         const pushSection = (data, label, isRev = false) => {
//             worksheetData.push([label.toUpperCase()]);
//             worksheetData.push(["", "", "", "", "TOTAL", ...timePeriods.map(p => data[isRev ? `${p}_Revenue` : p] || 0)]);
//         };
//         pushSection(grandRevenueTotal, "Revenue", true);
//         DISPLAYED_SECTION_KEYS.forEach(key => pushSection(sectionTotals[key] || {}, SECTION_LABELS[key]));
//         pushSection(grandIndirectTotal, "Indirects");
//         pushSection(grandTotalFee, "Total Fee");
//         const workbook = XLSX.utils.book_new();
//         const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
//         XLSX.utils.book_append_sheet(workbook, worksheet, "Forecast Report");
//         XLSX.writeFile(workbook, "Forecast_Report.xlsx");
//         setShowExportMenu(false);
//     };

//     const exportToPDF = async () => {
//         if (!reportContainerRef.current) return;
//         const canvas = await html2canvas(reportContainerRef.current, { scale: 2 });
//         const imgData = canvas.toDataURL('image/png');
//         const pdf = new jsPDF('l', 'mm', 'a4');
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
//         pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
//         pdf.save("Forecast_Report.pdf");
//         setShowExportMenu(false);
//     };

//     const exportToPPT = async () => {
//         if (!reportContainerRef.current) return;
//         const canvas = await html2canvas(reportContainerRef.current, { scale: 2 });
//         const imgData = canvas.toDataURL('image/png');
//         const pptx = new pptxgen();
//         const slide = pptx.addSlide();
//         slide.addImage({ data: imgData, x: 0.5, y: 0.7, w: 9, h: 4.5 });
//         pptx.writeFile({ fileName: "Forecast_Report.pptx" });
//         setShowExportMenu(false);
//     };

//     // Data Memoization
//     const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
//         const lowerCaseSearch = projectSearchTerm.toLowerCase();
//         const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
//         const rollupGroup = {}; const allProjectRows = [];
//         filtered.forEach(item => {
//             const rollupId = getRollupId(item.project);
//             let groupKey; let groupSection = item.section;
//             if (item.section === 'REVENUE_SECTION') groupKey = `${rollupId}__REVENUE_SECTION`;
//             else if ([...DISPLAYED_SECTION_KEYS, GENERAL_COSTS].includes(item.section)) groupKey = `${rollupId}__${item.section}`;
//             else return; 
//             allProjectRows.push(item);
//             if (!rollupGroup[groupKey]) rollupGroup[groupKey] = { id: groupKey, project: rollupId, org: item.org || '', accountName: '', projectName: item.projectName, isRollupParent: true, 'Total': 0, section: groupSection, children: [], };
//             const parent = rollupGroup[groupKey]; parent.children.push(item);
//             timePeriods.forEach(period => {
//                 if (item.section !== 'REVENUE_SECTION') {
//                     if (item[period] !== undefined) parent[period] = (parent[period] || 0) + (item[period] || 0);
//                     INDIRECT_KEYS.forEach(ik => { if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0); });
//                 }
//                 if (item[`${period}_Revenue`] !== undefined) parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
//             });
//             if (item.section !== 'REVENUE_SECTION') parent['Total'] += (item['Total'] || 0);
//         });
//         const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project));
//         const uniqueKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
//         const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
//         const paginatedProjectKeys = uniqueKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
//         const paginatedRollups = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);
//         return { allRows: allProjectRows, uniqueProjectKeys: uniqueKeys, paginatedRollups };
//     }, [apiData, projectSearchTerm, currentPage, timePeriods]); 

//     const dimensionHeaders = [ 
//         { key: 'project', label: 'PROJECT', width: '150px' }, 
//         { key: 'projectName', label: 'PROJECT NAME', width: '260px' }, 
//         { key: 'org', label: 'ORG', width: '120px' }, 
//         { key: 'acctId', label: 'ACCOUNT ID', width: '140px' }, 
//         { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' }, 
//         { key: 'popStartDate', label: 'POP START DATE', width: '140px' }, 
//         { key: 'popEndDate', label: 'POP END DATE', width: '140px' }
//     ];

//     const handlePageChange = (newPage) => {
//         setCurrentPage(newPage);
//         if (leftPaneRef.current) leftPaneRef.current.scrollTop = 0;
//         if (rightPaneRef.current) rightPaneRef.current.scrollTop = 0;
//     };
    
//     const { sectionTotals, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee } = useMemo(() => {
//         const sT = {}; const gRT = {}; const gIC = {}; const gTF = {}; const PERIODS = timePeriods; 
//         DISPLAYED_SECTION_KEYS.forEach(k => {
//             const rows = allRows.filter(r => r.section === k); sT[k] = {};
//             PERIODS.forEach(p => { const sum = rows.reduce((acc, r) => (r[p] || 0) + acc, 0); if (sum !== 0) sT[k][p] = sum; });
//         });
//         const revRows = allRows.filter(r => r.section === 'REVENUE_SECTION');
//         PERIODS.forEach(p => { const sum = revRows.reduce((acc, r) => (r[`${p}_Revenue`] || 0) + acc, 0); if (sum !== 0) gRT[p] = sum; });
//         PERIODS.forEach(p => { INDIRECT_KEYS.forEach(ik => { const sum = allRows.reduce((acc, r) => (r[`${p}_${ik}`] || 0) + acc, 0); if (sum !== 0) { if (!gIC[ik]) gIC[ik] = {}; gIC[ik][p] = sum; } }); });
//         const gIT = {};
//         PERIODS.forEach(p => { const sum = INDIRECT_KEYS.reduce((acc, ik) => (gIC[ik]?.[p] || 0) + acc, 0); if (sum !== 0) gIT[p] = sum; });
//         PERIODS.forEach(p => { gTF[p] = (gRT[p] || 0) - (DISPLAYED_SECTION_KEYS.reduce((acc, k) => acc + (sT[k][p] || 0), 0) + (gIT[p] || 0)); });
//         const finalIKs = Object.keys(gIC).filter(k => PERIODS.some(p => gIC[k][p] > 0));
//         return { sectionTotals: sT, grandRevenueTotal: gRT, grandIndirectComponents: gIC, grandIndirectTotal: gIT, finalIndirectKeys: finalIKs, grandTotalFee: gTF };
//     }, [allRows, timePeriods]); 

//     // Dynamic Logic
//     const renderDimensionCells = (item, isRevenue, breakdownKey, isRollup = false, isHeader = false, label = "") => {
//         if (isHeader) {
//             const isFee = breakdownKey === 'TOTAL_FEE';
//             return <td colSpan={dimensionHeaders.length} className="px-3 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: isFee ? '#3b82f6' : '#10b981' }}>
//                 <div className="flex items-center">
//                     <FaCaretRight className={`w-3 h-3 mr-2 transition-transform ${expandedSections[breakdownKey] ? 'rotate-90' : ''}`} />
//                     {label}
//                 </div>
//             </td>;
//         }
//         return dimensionHeaders.map((h) => {
//             let content = ''; let pad = '12px'; let bg = isRollup ? '#f1f5f9' : 'white';
//             if (isRevenue) {
//                 if (h.key === 'project') {
//                     content = item.project;
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(`REV_${item.project}`)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} /> <span>{item.project}</span> </div> </td>;
//                     pad = '35px';
//                 } else content = item[h.key];
//             } else if (item) {
//                 if (h.key === 'project') {
//                     content = item.project; pad = isRollup ? '12px' : '35px';
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(item.project)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} /> <span>{content}</span> </div> </td>;
//                 } else content = item[h.key];
//             } else if (h.key === 'project') { content = SECTION_LABELS[breakdownKey]; pad = '25px'; }
//             if (h.key === 'popStartDate' || h.key === 'popEndDate') content = formatDate(content);
//             return <td key={h.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap border-r" style={{ minWidth: h.width, paddingLeft: pad, backgroundColor: bg }}>{content}</td>;
//         });
//     };

//     const renderMonthlyCells = (data, key, isRev = false, isInd = false, isSummary = false) => {
//         const suffix = isRev ? '_Revenue' : (isInd ? `_${key}` : '');
//         const summaryBg = isSummary ? (key === 'TOTAL_FEE' ? '#3b82f6' : '#10b981') : null;
//         return timePeriods.map(p => {
//             const val = data[`${p}${suffix}`] || data[p] || 0;
//             const yellow = isYellowZone(p);
//             return <td key={p} className="px-6 py-2 text-sm text-right min-w-[150px] font-bold border-r" style={{ backgroundColor: summaryBg || (yellow ? '#FEF9C3' : 'transparent'), color: isSummary ? 'white' : 'inherit' }}>
//                 {formatCurrency(val)}
//             </td>;
//         });
//     };

//     return (
//         <div className="flex flex-col min-h-screen p-4 bg-gray-50 overflow-auto">
//             <style>
//                 {`
//                     .main-split-container { display: flex; width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; height: auto; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
//                     .dimension-pane, .monthly-pane { width: 50%; overflow-x: auto; overflow-y: auto; }
//                     .dimension-pane { border-right: 3px solid #94a3b8; }
//                     .pane-table { width: max-content; border-collapse: separate; border-spacing: 0; }
//                     .pane-table th { position: sticky; top: 0; z-index: 60; height: 50px; border-bottom: 2px solid #94a3b8; background: #f8fafc; }
//                     .pane-table td { border-bottom: 1px solid #f1f5f9; }
//                     .rollup-parent-row td { background-color: #f1f5f9; font-weight: bold; }
//                     .revenue-breakdown-row td { background-color: #f0fdfa; border-bottom: 1px dashed #6ee7b7; }
//                 `}
//             </style>
            
//             <div className="flex justify-between items-center mb-6 flex-shrink-0">
//                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Forecast Report</h2>
//                 <div className="flex items-center gap-3">
//                     <button onClick={handleRunReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
//                         <FaPlay className="inline mr-2" /> {isReportRun ? 'REFRESH' : 'RUN REPORT'}
//                     </button>
//                 </div>
//             </div>

//             {isReportRun && (
//                 <>
//                     <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-200 flex-shrink-0">
//                         <span className="text-xs font-black text-slate-500 uppercase">Projects: {uniqueProjectKeys.length}</span>
//                         <div className="flex space-x-2">
//                             <button onClick={handleToggleAll} className="px-4 py-2 text-xs font-black rounded-lg bg-slate-800 text-white uppercase">{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
//                             <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronLeft /></button>
//                             <span className="px-4 py-2 text-xs font-bold bg-slate-100 rounded-lg">Page {currentPage} of {Math.ceil(uniqueProjectKeys.length/20)}</span>
//                             <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(uniqueProjectKeys.length/20)} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronRight /></button>
//                         </div>
//                     </div>

//                     <div className="main-split-container" ref={reportContainerRef}>
//                         <div className="dimension-pane" ref={leftPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{dimensionHeaders.map(h => <th key={h.key} className="px-3 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ minWidth: h.width }}>{h.label}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr onClick={() => toggleSection('REVENUE_SECTION')}>{renderDimensionCells(null, false, 'REVENUE_SECTION', false, true, SECTION_LABELS.REVENUE_SECTION)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderDimensionCells({...rollupItem}, true, null, true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderDimensionCells(child, true, null, false)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr onClick={() => toggleSection(sectionKey)}>{renderDimensionCells(null, false, sectionKey, false, true, SECTION_LABELS[sectionKey])}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderDimensionCells(rollupItem, false, null, true)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderDimensionCells(child, false, null, false)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr onClick={() => toggleSection('INDIRECT_SECTION')}>{renderDimensionCells(null, false, 'INDIRECT_SECTION', false, true, SECTION_LABELS.INDIRECT_SECTION)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderDimensionCells(null, false, key, false)}</tr>)}
//                                     <tr>{renderDimensionCells(null, false, 'TOTAL_FEE', false, true, SECTION_LABELS.TOTAL_FEE)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                         <div className="monthly-pane" ref={rightPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{timePeriods.map(p => <th key={p} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: isYellowZone(p) ? '#FDE047' : '#059669', color: isYellowZone(p) ? '#334155' : 'white', minWidth: '150px' }}>{p}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr>{renderMonthlyCells(grandRevenueTotal, 'REVENUE_SECTION', true, false, true)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderMonthlyCells(rollupItem, 'REVENUE_SECTION', true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderMonthlyCells(child, 'REVENUE_SECTION', true)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr>{renderMonthlyCells(sectionTotals[sectionKey], sectionKey, false, false, true)}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderMonthlyCells(rollupItem, sectionKey)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderMonthlyCells(child, sectionKey)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr>{renderMonthlyCells(grandIndirectTotal, 'INDIRECT_SECTION', false, false, true)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderMonthlyCells(grandIndirectComponents[key], key, false, true)}</tr>)}
//                                     <tr>{renderMonthlyCells(grandTotalFee, 'TOTAL_FEE', false, false, true)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };

// export default ForecastReport;



// Stable Version Below 



// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { 
//   FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, 
//   FaChevronLeft, FaChevronRight, FaPlay, FaFileDownload 
// } from 'react-icons/fa';
// import { backendUrl } from "./config"; 

// // Export Libraries
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import pptxgen from "pptxgenjs";

// // Constants and Mappings
// const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
// const ROWS_PER_PAGE = 20; 

// const GENERAL_COSTS = 'GENERAL-COSTS';
// const SECTION_LABELS = { 
//   REVENUE_SECTION: ' Revenue (REVENUE)', 
//   INDIRECT_SECTION: ' Indirect', 
//   FRINGE: '1. Fringe', OVERHEAD: '2. Overhead', MANDH: '3. Mat & Handling', GNA: '4. General & Admin', 
//   LABOR: 'Sumaria Labor Onsite (LABOR)', 
//   'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)', 
//   'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)', 
//   'NON-LABOR-SUBCON': 'Subcontractors (LABOR)', 
//   'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)', 
//   TOTAL_FEE: 'Total Fee', 
//   [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)' 
// };

// const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
// const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
// const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];

// const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
// const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
// const TRAVEL_NONLABOR_ACCTS = new Set(['50-400-000', '50-400-004', '50-400-008', '50-300-000', '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002']);
// const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
// const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);

// // Helper Functions
// const formatCurrency = (amount) => (typeof amount !== 'number' || isNaN(amount) || amount === 0) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
// const formatDate = (dateString) => { if (!dateString) return '-'; const date = new Date(dateString.split('T')[0] || dateString); return isNaN(date) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
// const getRollupId = (projId) => { if (!projId) return 'N/A'; const match = projId.match(/^(\d+)/); return match ? match[1] : projId.split('.')[0]; };

// const getPeriodKey = (month, year) => {
//     const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     return `${monthPrefixes[month - 1]}-${String(year).slice(-2)}`;
// };

// const isYellowZone = (periodStr) => {
//     if (periodStr === 'Total') return false;
//     const [monthStr, yearStr] = periodStr.split('-');
//     const year = 2000 + parseInt(yearStr);
//     const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
//     // Logic remains 2026 threshold as requested previously
//     return year > 2026 || (year === 2026 && monthIndex >= 0);
// };

// const determineSectionAndIndirectKey = (item) => {
//     const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
//     const poolName = (item.poolName || '').toUpperCase();
//     let section = GENERAL_COSTS, indirectKey = null;
//     if (subTotTypeNo === 1) section = 'REVENUE_SECTION';
//     else if (subTotTypeNo === 4) {
//         if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
//         else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
//         else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
//         else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
//         section = GENERAL_COSTS; 
//     } 
//     return { section, indirectKey, subTotTypeNo }; 
// };

// const classifyCostSection = (acctId, currentSection) => {
//     if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
//     if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
//     if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
//     if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
//     if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
//     return currentSection; 
// };

// const transformData = (detailData, forecastData, dynamicPeriodMap, dynamicMonthlyPeriods) => {
//     const aggregatedDataMap = {}; 
//     forecastData.forEach(item => {
//         const periodKey = getPeriodKey(item.month, item.year);
//         const detailRowKey = `${item.projId}-${item.acctId}-0-0`;
//         if (!periodKey) return; 
//         let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
//         let forecastSubTotTypeNo = 0; 
//         if (item.revenue !== undefined && item.revenue !== 0) { forecastSection = 'REVENUE_SECTION'; forecastSubTotTypeNo = 1; }
//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast: ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'Total': 0, };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         if (row.section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { const costAmount = (item.cost || 0); if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; }
//         INDIRECT_KEYS.forEach(ik => {
//             const indirectAmount = (item[ik.toLowerCase()] || 0);
//             if (indirectAmount !== 0) {
//                 const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
//                 if (!aggregatedDataMap[indirectRowKey]) { aggregatedDataMap[indirectRowKey] = { id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: GENERAL_COSTS, subTotTypeNo: 4, 'Total': 0, }; }
//                 aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
//             }
//         });
//     });
//     detailData.forEach(item => {
//         let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
//         if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
//         const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 
//         const periodKey = dynamicPeriodMap[item.pdNo];
//         if (!periodKey) return; 
//         if (!aggregatedDataMap[detailRowKey]) { aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, accountName: item.l1AcctName || item.poolName || 'Unknown Pool', projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt, parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'Total': 0, };
//         } else { const row = aggregatedDataMap[detailRowKey]; row.accountName = item.l1AcctName || item.poolName || row.accountName; row.popStartDate = item.projStartDt || row.popStartDate; row.popEndDate = item.projEndDt || row.popEndDate; row.section = section; if (item.projName) row.projectName = item.projName; row.subTotTypeNo = subTotTypeNo; }
//         const row = aggregatedDataMap[detailRowKey];
//         const monthlyAmount = (item.ptdIncurAmt || 0); 
//         if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
//         else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
//         else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
//     });
//     Object.values(aggregatedDataMap).forEach(row => { 
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { 
//             let total = 0; 
//             dynamicMonthlyPeriods.forEach(period => { total += (row[period] || 0); }); 
//             row['Total'] = total; 
//         } else row['Total'] = 0; 
//     });
//     return Object.values(aggregatedDataMap); 
// };

// const ForecastReport = () => {
//     const [projectSearchTerm, setProjectSearchTerm] = useState('');
//     const [loading, setLoading] = useState(false); 
//     const [isReportRun, setIsReportRun] = useState(false); 
//     const [error, setError] = useState(null);
//     const [apiData, setApiData] = useState([]); 
//     const [currentPage, setCurrentPage] = useState(1);
//     const [showExportMenu, setShowExportMenu] = useState(false);

//     const [timePeriods, setTimePeriods] = useState([]); 
//     const [monthlyPeriods, setMonthlyPeriods] = useState([]); 
//     const [periodMap, setPeriodMap] = useState({});

//     const leftPaneRef = useRef(null);
//     const rightPaneRef = useRef(null);
//     const reportContainerRef = useRef(null);

//     const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
//     const [expandedSections, setExpandedSections] = useState(initialExpandedState);
//     const [expandedProjects, setExpandedProjects] = useState({}); 

//     const toggleSection = useCallback((key) => { setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })); }, []);
//     const toggleProject = useCallback((projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); }, []);
//     const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

//     const handleToggleAll = () => {
//         if (isAllExpanded) { setExpandedSections(initialExpandedState); setExpandedProjects({}); 
//         } else { const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {}); setExpandedSections(allExpanded); }
//     };

//     const handleRunReport = async () => {
//         setLoading(true); setIsReportRun(true); setError(null);
//         try {
//             const [detailResponse, forecastResponse] = await Promise.all([
//                 fetch(`${backendUrl}${DETAIL_API_PATH}`), 
//                 fetch(`${backendUrl}${FORECAST_API_PATH}`)
//             ]);
//             if (!detailResponse.ok) throw new Error(`Detail API failed: ${detailResponse.statusText}`);
//             const detailData = await detailResponse.json();
//             const forecastData = forecastResponse.ok ? await forecastResponse.json() : [];

//             // --- Dynamic Year Logic ---
//             const detailYears = detailData.map(d => parseInt(d.fyCd)).filter(y => !isNaN(y));
//             const forecastYears = forecastData.map(d => parseInt(d.year)).filter(y => !isNaN(y));
            
//             const allFoundYears = [...detailYears, ...forecastYears];
//             const minYear = allFoundYears.length > 0 ? Math.min(...allFoundYears) : 2025;
//             const maxYear = allFoundYears.length > 0 ? Math.max(...allFoundYears) : 2026;
            
//             const dynamicMonthly = [];
//             const dynamicMap = {};
//             let pdNoCounter = 1;

//             for (let y = minYear; y <= maxYear; y++) {
//                 for (let m = 1; m <= 12; m++) {
//                     const key = getPeriodKey(m, y);
//                     dynamicMonthly.push(key);
//                     dynamicMap[pdNoCounter] = key;
//                     pdNoCounter++;
//                 }
//             }

//             setMonthlyPeriods(dynamicMonthly);
//             setTimePeriods([...dynamicMonthly, 'Total']);
//             setPeriodMap(dynamicMap);

//             const transformedRows = transformData(detailData, forecastData, dynamicMap, dynamicMonthly);
//             setApiData(transformedRows);
//         } catch (e) { setApiData([]); setError(`Data load failed: ${e.message}`); } finally { setLoading(false); }
//     };

//     const handleScrollSync = (e) => {
//         if (e.target === leftPaneRef.current) rightPaneRef.current.scrollTop = e.target.scrollTop;
//         else leftPaneRef.current.scrollTop = e.target.scrollTop;
//     };

//     const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
//         const lowerCaseSearch = projectSearchTerm.toLowerCase();
//         const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
//         const rollupGroup = {}; const allProjectRows = [];
//         filtered.forEach(item => {
//             const rollupId = getRollupId(item.project);
//             let groupKey; let groupSection = item.section;
//             if (item.section === 'REVENUE_SECTION') groupKey = `${rollupId}__REVENUE_SECTION`;
//             else if ([...DISPLAYED_SECTION_KEYS, GENERAL_COSTS].includes(item.section)) groupKey = `${rollupId}__${item.section}`;
//             else return; 
//             allProjectRows.push(item);
//             if (!rollupGroup[groupKey]) rollupGroup[groupKey] = { id: groupKey, project: rollupId, org: item.org || '', accountName: '', projectName: item.projectName, isRollupParent: true, 'Total': 0, section: groupSection, children: [], };
//             const parent = rollupGroup[groupKey]; parent.children.push(item);
//             timePeriods.forEach(period => {
//                 if (item.section !== 'REVENUE_SECTION') {
//                     if (item[period] !== undefined) parent[period] = (parent[period] || 0) + (item[period] || 0);
//                     INDIRECT_KEYS.forEach(ik => { if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0); });
//                 }
//                 if (item[`${period}_Revenue`] !== undefined) parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
//             });
//             if (item.section !== 'REVENUE_SECTION') parent['Total'] += (item['Total'] || 0);
//         });
//         const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project));
//         const uniqueKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
//         const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
//         const paginatedProjectKeys = uniqueKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
//         const paginatedRes = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);
//         return { allRows: allProjectRows, uniqueProjectKeys: uniqueKeys, paginatedRollups: paginatedRes };
//     }, [apiData, projectSearchTerm, currentPage, timePeriods]); 

//     const { sectionTotals, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee } = useMemo(() => {
//         const sT = {}; const gRT = {}; const gIC = {}; const gTF = {}; const PERIODS = timePeriods; 
//         DISPLAYED_SECTION_KEYS.forEach(k => {
//             const rows = allRows.filter(r => r.section === k); sT[k] = {};
//             PERIODS.forEach(p => { const sum = rows.reduce((acc, r) => (r[p] || 0) + acc, 0); if (sum !== 0) sT[k][p] = sum; });
//         });
//         const revRows = allRows.filter(r => r.section === 'REVENUE_SECTION');
//         PERIODS.forEach(p => { const sum = revRows.reduce((acc, r) => (r[`${p}_Revenue`] || 0) + acc, 0); if (sum !== 0) gRT[p] = sum; });
//         PERIODS.forEach(p => { INDIRECT_KEYS.forEach(ik => { const sum = allRows.reduce((acc, r) => (r[`${p}_${ik}`] || 0) + acc, 0); if (sum !== 0) { if (!gIC[ik]) gIC[ik] = {}; gIC[ik][p] = sum; } }); });
//         const gIT = {};
//         PERIODS.forEach(p => { const sum = INDIRECT_KEYS.reduce((acc, ik) => (gIC[ik]?.[p] || 0) + acc, 0); if (sum !== 0) gIT[p] = sum; });
//         PERIODS.forEach(p => { gTF[p] = (gRT[p] || 0) - (DISPLAYED_SECTION_KEYS.reduce((acc, k) => acc + (sT[k][p] || 0), 0) + (gIT[p] || 0)); });
//         const finalIKs = Object.keys(gIC).filter(k => PERIODS.some(p => gIC[k][p] > 0));
//         return { sectionTotals: sT, grandRevenueTotal: gRT, grandIndirectComponents: gIC, grandIndirectTotal: gIT, finalIndirectKeys: finalIKs, grandTotalFee: gTF };
//     }, [allRows, timePeriods]); 

//     // --- MULTI-SHEET EXCEL EXPORT ---
//     const exportToExcel = () => {
//         const workbook = XLSX.utils.book_new();
//         const cleanNum = (val) => val || 0;
//         const baseHeaders = ["Category/Project", "Project Name", "Org", "Account ID", "Account Name", ...timePeriods];

//         // SHEET 1: TOTAL LEVEL
//         const sheet1Data = [baseHeaders];
//         const addSheet1Section = (label, source, isRev = false) => {
//             const suffix = isRev ? '_Revenue' : '';
//             sheet1Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//         };
//         addSheet1Section(SECTION_LABELS.REVENUE_SECTION, grandRevenueTotal, true);
//         DISPLAYED_SECTION_KEYS.forEach(key => addSheet1Section(SECTION_LABELS[key], sectionTotals[key]));
//         sheet1Data.push([SECTION_LABELS.INDIRECT_SECTION, "", "", "", "TOTAL", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         sheet1Data.push([SECTION_LABELS.TOTAL_FEE, "", "", "", "", ...timePeriods.map(p => cleanNum(grandTotalFee[p]))]);
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet1Data), "Totals Summary");

//         // SHEET 2: TOTALS & ROLLUP
//         const sheet2Data = [baseHeaders];
//         const addSheet2Section = (sectionKey, label, isRev = false) => {
//             const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
//             const suffix = isRev ? '_Revenue' : '';
//             sheet2Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//             const rollups = paginatedRollups.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey));
//             rollups.forEach(r => {
//                 sheet2Data.push([r.project, r.projectName, r.org, "", "Subtotal", ...timePeriods.map(p => cleanNum(r[`${p}${suffix}`] || r[p]))]);
//             });
//             sheet2Data.push([]);
//         };
//         addSheet2Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
//         DISPLAYED_SECTION_KEYS.forEach(k => addSheet2Section(k, SECTION_LABELS[k]));
//         sheet2Data.push(["INDIRECTS", "", "", "", "TOTAL", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         finalIndirectKeys.forEach(ik => sheet2Data.push([`  ${ik}`, "", "", "", "", ...timePeriods.map(p => cleanNum(grandIndirectComponents[ik]?.[p]))]));
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet2Data), "Rollup Level");

//         // SHEET 3: FULL DETAILED
//         const sheet3Data = [["Project", "Project Name", "Org", "Account ID", "Account Name", "Start Date", "End Date", ...timePeriods]];
//         const addSheet3Section = (sectionKey, label, isRev = false) => {
//             const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
//             const suffix = isRev ? '_Revenue' : '';
//             sheet3Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", "", "", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//             const rollups = paginatedRollups.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey));
//             rollups.forEach(r => {
//                 sheet3Data.push([r.project, r.projectName, r.org, "", "Subtotal", "", "", ...timePeriods.map(p => cleanNum(r[`${p}${suffix}`] || r[p]))]);
//                 r.children.forEach(c => {
//                     sheet3Data.push([`  ${c.project}`, c.projectName, c.org, c.acctId, c.accountName, formatDate(c.popStartDate), formatDate(c.popEndDate), ...timePeriods.map(p => cleanNum(c[`${p}${suffix}`] || c[p]))]);
//                 });
//             });
//             sheet3Data.push([]);
//         };
//         addSheet3Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
//         DISPLAYED_SECTION_KEYS.forEach(k => addSheet3Section(k, SECTION_LABELS[k]));
//         sheet3Data.push(["INDIRECTS", "", "", "", "TOTAL", "", "", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         finalIndirectKeys.forEach(ik => sheet3Data.push([`  ${ik}`, "", "", "", "", "", "", ...timePeriods.map(p => cleanNum(grandIndirectComponents[ik]?.[p]))]));
//         sheet3Data.push([], ["TOTAL FEE", "", "", "", "", "", "", ...timePeriods.map(p => cleanNum(grandTotalFee[p]))]);
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet3Data), "Full Detailed Report");

//         XLSX.writeFile(workbook, "Forecast_Report_MultiSheet.xlsx");
//     };

//     const dimensionHeaders = [ 
//         { key: 'project', label: 'PROJECT', width: '150px' }, 
//         { key: 'projectName', label: 'PROJECT NAME', width: '260px' }, 
//         { key: 'org', label: 'ORG', width: '120px' }, 
//         { key: 'acctId', label: 'ACCOUNT ID', width: '140px' }, 
//         { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' }, 
//         { key: 'popStartDate', label: 'POP START DATE', width: '140px' }, 
//         { key: 'popEndDate', label: 'POP END DATE', width: '140px' }
//     ];

//     const handlePageChange = (newPage) => {
//         setCurrentPage(newPage);
//         if (leftPaneRef.current) leftPaneRef.current.scrollTop = 0;
//         if (rightPaneRef.current) rightPaneRef.current.scrollTop = 0;
//     };

//     const renderDimensionCells = (item, isRevenue, breakdownKey, isRollup = false, isHeader = false, label = "") => {
//         if (isHeader) {
//             const isFee = breakdownKey === 'TOTAL_FEE';
//             return <td colSpan={dimensionHeaders.length} className="px-3 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: isFee ? '#3b82f6' : '#10b981' }}>
//                 <div className="flex items-center">
//                     <FaCaretRight className={`w-3 h-3 mr-2 transition-transform ${expandedSections[breakdownKey] ? 'rotate-90' : ''}`} />
//                     {label}
//                 </div>
//             </td>;
//         }
//         return dimensionHeaders.map((h) => {
//             let content = ''; let pad = '12px'; let bg = isRollup ? '#f1f5f9' : 'white';
//             if (isRevenue) {
//                 if (h.key === 'project') {
//                     content = item.project;
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(`REV_${item.project}`)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} /> <span>{item.project}</span> </div> </td>;
//                     pad = '35px';
//                 } else content = item[h.key];
//             } else if (item) {
//                 if (h.key === 'project') {
//                     content = item.project; pad = isRollup ? '12px' : '35px';
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(item.project)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} /> <span>{content}</span> </div> </td>;
//                 } else content = item[h.key];
//             } else if (h.key === 'project') { content = SECTION_LABELS[breakdownKey]; pad = '25px'; }
//             if (h.key === 'popStartDate' || h.key === 'popEndDate') content = formatDate(content);
//             return <td key={h.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap border-r" style={{ minWidth: h.width, paddingLeft: pad, backgroundColor: bg }}>{content}</td>;
//         });
//     };

//     const renderMonthlyCells = (data, key, isRev = false, isInd = false, isSummary = false) => {
//         const suffix = isRev ? '_Revenue' : (isInd ? `_${key}` : '');
//         const summaryBg = isSummary ? (key === 'TOTAL_FEE' ? '#3b82f6' : '#10b981') : null;
//         return timePeriods.map(p => {
//             const val = data[`${p}${suffix}`] || data[p] || 0;
//             const yellow = isYellowZone(p);
//             return <td key={p} className="px-6 py-2 text-sm text-right min-w-[150px] font-bold border-r" style={{ backgroundColor: summaryBg || (yellow ? '#FEF9C3' : 'transparent'), color: isSummary ? 'white' : 'inherit' }}>
//                 {formatCurrency(val)}
//             </td>;
//         });
//     };

//     return (
//         <div className="flex flex-col min-h-screen p-4 bg-gray-50 overflow-auto">
//             <style>
//                 {`
//                     .main-split-container { display: flex; width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; height: auto; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
//                     .dimension-pane, .monthly-pane { width: 50%; overflow-x: auto; overflow-y: auto; }
//                     .dimension-pane { border-right: 3px solid #94a3b8; }
//                     .pane-table { width: max-content; border-collapse: separate; border-spacing: 0; }
//                     .pane-table th { position: sticky; top: 0; z-index: 60; height: 50px; border-bottom: 2px solid #94a3b8; background: #f8fafc; }
//                     .pane-table td { border-bottom: 1px solid #f1f5f9; }
//                     .rollup-parent-row td { background-color: #f1f5f9; font-weight: bold; }
//                     .revenue-breakdown-row td { background-color: #f0fdfa; border-bottom: 1px dashed #6ee7b7; }
//                 `}
//             </style>
            
//             <div className="flex justify-between items-center mb-6 flex-shrink-0">
//                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Forecast Report</h2>
//                 <div className="flex items-center gap-3">
//                     {isReportRun && (
//                         <button 
//                             onClick={exportToExcel}
//                             className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center"
//                         >
//                             <FaFileDownload className="mr-2" /> EXPORT EXCEL
//                         </button>
//                     )}
//                     <button onClick={handleRunReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
//                         <FaPlay className="inline mr-2" /> {isReportRun ? 'REFRESH' : 'RUN REPORT'}
//                     </button>
//                 </div>
//             </div>

//             {isReportRun && (
//                 <>
//                     <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-200 flex-shrink-0">
//                         <span className="text-xs font-black text-slate-500 uppercase">Projects: {uniqueProjectKeys.length}</span>
//                         <div className="flex space-x-2">
//                             <button onClick={handleToggleAll} className="px-4 py-2 text-xs font-black rounded-lg bg-slate-800 text-white uppercase">{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
//                             <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronLeft /></button>
//                             <span className="px-4 py-2 text-xs font-bold bg-slate-100 rounded-lg">Page {currentPage} of {Math.ceil(uniqueProjectKeys.length/20)}</span>
//                             <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(uniqueProjectKeys.length/20)} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronRight /></button>
//                         </div>
//                     </div>

//                     <div className="main-split-container" ref={reportContainerRef}>
//                         <div className="dimension-pane" ref={leftPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{dimensionHeaders.map(h => <th key={h.key} className="px-3 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ minWidth: h.width }}>{h.label}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr onClick={() => toggleSection('REVENUE_SECTION')}>{renderDimensionCells(null, false, 'REVENUE_SECTION', false, true, SECTION_LABELS.REVENUE_SECTION)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderDimensionCells({...rollupItem}, true, null, true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderDimensionCells(child, true, null, false)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr onClick={() => toggleSection(sectionKey)}>{renderDimensionCells(null, false, sectionKey, false, true, SECTION_LABELS[sectionKey])}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderDimensionCells(rollupItem, false, null, true)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderDimensionCells(child, false, null, false)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr onClick={() => toggleSection('INDIRECT_SECTION')}>{renderDimensionCells(null, false, 'INDIRECT_SECTION', false, true, SECTION_LABELS.INDIRECT_SECTION)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderDimensionCells(null, false, key, false)}</tr>)}
//                                     <tr>{renderDimensionCells(null, false, 'TOTAL_FEE', false, true, SECTION_LABELS.TOTAL_FEE)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                         <div className="monthly-pane" ref={rightPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{timePeriods.map(p => <th key={p} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: isYellowZone(p) ? '#FDE047' : '#059669', color: isYellowZone(p) ? '#334155' : 'white', minWidth: '150px' }}>{p}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr>{renderMonthlyCells(grandRevenueTotal, 'REVENUE_SECTION', true, false, true)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderMonthlyCells(rollupItem, 'REVENUE_SECTION', true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderMonthlyCells(child, 'REVENUE_SECTION', true)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr>{renderMonthlyCells(sectionTotals[sectionKey], sectionKey, false, false, true)}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderMonthlyCells(rollupItem, sectionKey)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderMonthlyCells(child, sectionKey)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr>{renderMonthlyCells(grandIndirectTotal, 'INDIRECT_SECTION', false, false, true)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderMonthlyCells(grandIndirectComponents[key], key, false, true)}</tr>)}
//                                     <tr>{renderMonthlyCells(grandTotalFee, 'TOTAL_FEE', false, false, true)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };

// export default ForecastReport;



///   For Later Use   ///

// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { 
//   FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, 
//   FaChevronLeft, FaChevronRight, FaPlay, FaFileDownload 
// } from 'react-icons/fa';
// import { backendUrl } from "./config"; 

// // Export Libraries
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import pptxgen from "pptxgenjs";

// // Constants and Mappings
// const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
// const REVENUE_WORK_PERIOD_API = "https://planning-api-dev.onrender.com/ProjRevWrkPd/filter";
// const ROWS_PER_PAGE = 20; 

// const GENERAL_COSTS = 'GENERAL-COSTS';
// const SECTION_LABELS = { 
//   REVENUE_SECTION: ' Revenue (REVENUE)', 
//   INDIRECT_SECTION: ' Indirect', 
//   FRINGE: '1. Fringe', OVERHEAD: '2. Overhead', MANDH: '3. Mat & Handling', GNA: '4. General & Admin', 
//   LABOR: 'Sumaria Labor Onsite (LABOR)', 
//   'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)', 
//   'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)', 
//   'NON-LABOR-SUBCON': 'Subcontractors (LABOR)', 
//   'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)', 
//   TOTAL_FEE: 'Total Fee', 
//   [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)' 
// };

// const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
// const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
// const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];

// const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
// const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
// const TRAVEL_NONLABOR_ACCTS = new Set(['50-400-000', '50-400-004', '50-400-008', '50-300-000', '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002']);
// const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
// const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);

// // Helper Functions
// const formatCurrency = (amount) => (typeof amount !== 'number' || isNaN(amount) || amount === 0) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
// const formatDate = (dateString) => { if (!dateString) return '-'; const date = new Date(dateString.split('T')[0] || dateString); return isNaN(date) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
// const getRollupId = (projId) => { if (!projId) return 'N/A'; const match = projId.match(/^(\d+)/); return match ? match[1] : projId.split('.')[0]; };

// const getPeriodKey = (month, year) => {
//     const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     return `${monthPrefixes[month - 1]}-${String(year).slice(-2)}`;
// };

// const isYellowZone = (periodStr) => {
//     if (periodStr === 'Total') return false;
//     const [monthStr, yearStr] = periodStr.split('-');
//     const year = 2000 + parseInt(yearStr);
//     const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
//     return year > 2026 || (year === 2026 && monthIndex >= 0);
// };

// const determineSectionAndIndirectKey = (item) => {
//     const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
//     const poolName = (item.poolName || '').toUpperCase();
//     let section = GENERAL_COSTS, indirectKey = null;
//     if (subTotTypeNo === 1) section = 'REVENUE_SECTION';
//     else if (subTotTypeNo === 4) {
//         if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
//         else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
//         else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
//         else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
//         section = GENERAL_COSTS; 
//     } 
//     return { section, indirectKey, subTotTypeNo }; 
// };

// const classifyCostSection = (acctId, currentSection) => {
//     if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
//     if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
//     if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
//     if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
//     if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
//     return currentSection; 
// };

// const transformData = (detailData, forecastData, workPeriodRevData, dynamicPeriodMap, dynamicMonthlyPeriods) => {
//     const aggregatedDataMap = {}; 
    
//     // Process Forecast Data
//     forecastData.forEach(item => {
//         const periodKey = getPeriodKey(item.month, item.year);
//         const detailRowKey = `${item.projId}-${item.acctId}-0-0`;
//         if (!periodKey) return; 
//         let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
//         let forecastSubTotTypeNo = 0; 
//         if (item.revenue !== undefined && item.revenue !== 0) { forecastSection = 'REVENUE_SECTION'; forecastSubTotTypeNo = 1; }
        
//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast: ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'Total': 0, };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         if (row.section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { const costAmount = (item.cost || 0); if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; }
//         INDIRECT_KEYS.forEach(ik => {
//             const indirectAmount = (item[ik.toLowerCase()] || 0);
//             if (indirectAmount !== 0) {
//                 const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
//                 if (!aggregatedDataMap[indirectRowKey]) { aggregatedDataMap[indirectRowKey] = { id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: GENERAL_COSTS, subTotTypeNo: 4, 'Total': 0, }; }
//                 aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
//             }
//         });
//     });

//     // Process Work Period Revenue Data
//     workPeriodRevData.forEach(item => {
//         const periodKey = getPeriodKey(item.period, item.fy_Cd);
//         const detailRowKey = `${item.projId}-REV-WORK-PERIOD`;
//         if (!periodKey) return;

//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: 'Revenue - Opportunities', org: '', accountName: 'Revenue', projectName: item.projName || '', popStartDate: '', popEndDate: '', parentProject: null, section: 'REVENUE_SECTION', subTotTypeNo: 1, 'Total': 0 };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revAmt || 0);
//     });

//     // Process Detail Data
//     detailData.forEach(item => {
//         let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
//         if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
//         const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 
//         const periodKey = dynamicPeriodMap[item.pdNo];
//         if (!periodKey) return; 
//         if (!aggregatedDataMap[detailRowKey]) { aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, accountName: item.l1AcctName || item.poolName || 'Unknown Pool', projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt, parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'Total': 0, };
//         } else { const row = aggregatedDataMap[detailRowKey]; row.accountName = item.l1AcctName || item.poolName || row.accountName; row.popStartDate = item.projStartDt || row.popStartDate; row.popEndDate = item.projEndDt || row.popEndDate; row.section = section; if (item.projName) row.projectName = item.projName; row.subTotTypeNo = subTotTypeNo; }
//         const row = aggregatedDataMap[detailRowKey];
//         const monthlyAmount = (item.ptdIncurAmt || 0); 
//         if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
//         else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
//         else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
//     });

//     Object.values(aggregatedDataMap).forEach(row => { 
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { 
//             let total = 0; 
//             dynamicMonthlyPeriods.forEach(period => { total += (row[period] || 0); }); 
//             row['Total'] = total; 
//         } else row['Total'] = 0; 
//     });
//     return Object.values(aggregatedDataMap); 
// };

// const ForecastReport = () => {
//     const [projectSearchTerm, setProjectSearchTerm] = useState('');
//     const [loading, setLoading] = useState(false); 
//     const [isReportRun, setIsReportRun] = useState(false); 
//     const [error, setError] = useState(null);
//     const [apiData, setApiData] = useState([]); 
//     const [currentPage, setCurrentPage] = useState(1);

//     const [timePeriods, setTimePeriods] = useState([]); 
//     const [monthlyPeriods, setMonthlyPeriods] = useState([]); 
//     const [periodMap, setPeriodMap] = useState({});

//     const leftPaneRef = useRef(null);
//     const rightPaneRef = useRef(null);
//     const reportContainerRef = useRef(null);

//     const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
//     const [expandedSections, setExpandedSections] = useState(initialExpandedState);
//     const [expandedProjects, setExpandedProjects] = useState({}); 

//     const toggleSection = useCallback((key) => { setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })); }, []);
//     const toggleProject = useCallback((projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); }, []);
//     const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

//     const handleToggleAll = () => {
//         if (isAllExpanded) { setExpandedSections(initialExpandedState); setExpandedProjects({}); 
//         } else { const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {}); setExpandedSections(allExpanded); }
//     };

//     const handleRunReport = async () => {
//         setLoading(true); setIsReportRun(true); setError(null);
//         try {
//             const [detailRes, forecastRes] = await Promise.all([
//                 fetch(`${backendUrl}${DETAIL_API_PATH}`), 
//                 fetch(`${backendUrl}${FORECAST_API_PATH}`)
//             ]);
//             if (!detailRes.ok) throw new Error(`Detail API failed`);
//             const detailData = await detailRes.json();
//             const forecastData = forecastRes.ok ? await forecastRes.json() : [];

//             // Multi-API Fetch for ProjRevWrkPd
//             const uniqueConfigs = [];
//             const seen = new Set();
//             forecastData.forEach(item => {
//                 const key = `${item.projId}-${item.version}-${item.plId}`;
//                 if (!seen.has(key)) {
//                     uniqueConfigs.push({ projId: item.projId, version: item.version, plId: item.plId });
//                     seen.add(key);
//                 }
//             });

//             const workPeriodPromises = uniqueConfigs.map(config => 
//                 fetch(`${REVENUE_WORK_PERIOD_API}?projId=${config.projId}&versionNo=${config.version}&bgtType=NBBUD&pl_id=${config.plId}`)
//                 .then(r => r.ok ? r.json() : [])
//                 .catch(() => [])
//             );
//             const workPeriodResults = await Promise.all(workPeriodPromises);
//             const flatWorkPeriodData = workPeriodResults.flat();

//             // Dynamic Timeline Logic with Absolute Reference
//             const detailYears = detailData.map(d => parseInt(d.fyCd)).filter(y => !isNaN(y));
//             const forecastYears = forecastData.map(d => parseInt(d.year)).filter(y => !isNaN(y));
//             const allFoundYears = [...detailYears, ...forecastYears];
//             const minYear = allFoundYears.length > 0 ? Math.min(...allFoundYears) : 2025;
//             const maxYear = allFoundYears.length > 0 ? Math.max(...allFoundYears) : 2026;
            
//             const dynamicMonthly = [];
//             const dynamicMap = {};

//             for (let y = minYear; y <= maxYear; y++) {
//                 for (let m = 1; m <= 12; m++) {
//                     const key = getPeriodKey(m, y);
//                     dynamicMonthly.push(key);
//                     // Anchor pdNo 1 to Jan 2025
//                     const calculatedPdNo = ((y - 2025) * 12) + m;
//                     dynamicMap[calculatedPdNo] = key;
//                 }
//             }

//             setMonthlyPeriods(dynamicMonthly);
//             setTimePeriods([...dynamicMonthly, 'Total']);
//             setPeriodMap(dynamicMap);

//             const transformedRows = transformData(detailData, forecastData, flatWorkPeriodData, dynamicMap, dynamicMonthly);
//             setApiData(transformedRows);
//         } catch (e) { setApiData([]); setError(`Data load failed: ${e.message}`); } finally { setLoading(false); }
//     };

//     const handleScrollSync = (e) => {
//         if (e.target === leftPaneRef.current) rightPaneRef.current.scrollTop = e.target.scrollTop;
//         else leftPaneRef.current.scrollTop = e.target.scrollTop;
//     };

//     const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
//         const lowerCaseSearch = projectSearchTerm.toLowerCase();
//         const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
//         const rollupGroup = {}; const allProjectRows = [];
//         filtered.forEach(item => {
//             const rollupId = getRollupId(item.project);
//             let groupKey; let groupSection = item.section;
//             if (item.section === 'REVENUE_SECTION') groupKey = `${rollupId}__REVENUE_SECTION`;
//             else if ([...DISPLAYED_SECTION_KEYS, GENERAL_COSTS].includes(item.section)) groupKey = `${rollupId}__${item.section}`;
//             else return; 
//             allProjectRows.push(item);
//             if (!rollupGroup[groupKey]) rollupGroup[groupKey] = { id: groupKey, project: rollupId, org: item.org || '', accountName: '', projectName: item.projectName, isRollupParent: true, 'Total': 0, section: groupSection, children: [], };
//             const parent = rollupGroup[groupKey]; parent.children.push(item);
//             timePeriods.forEach(period => {
//                 if (item.section !== 'REVENUE_SECTION') {
//                     if (item[period] !== undefined) parent[period] = (parent[period] || 0) + (item[period] || 0);
//                     INDIRECT_KEYS.forEach(ik => { if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0); });
//                 }
//                 if (item[`${period}_Revenue`] !== undefined) parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
//             });
//             if (item.section !== 'REVENUE_SECTION') parent['Total'] += (item['Total'] || 0);
//         });
//         const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project));
//         const uniqueKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
//         const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
//         const paginatedProjectKeys = uniqueKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
//         const paginatedRes = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);
//         return { allRows: allProjectRows, uniqueProjectKeys: uniqueKeys, paginatedRollups: paginatedRes };
//     }, [apiData, projectSearchTerm, currentPage, timePeriods]); 

//     const { sectionTotals, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee } = useMemo(() => {
//         const sT = {}; const gRT = {}; const gIC = {}; const gTF = {}; const PERIODS = timePeriods; 
//         DISPLAYED_SECTION_KEYS.forEach(k => {
//             const rows = allRows.filter(r => r.section === k); sT[k] = {};
//             PERIODS.forEach(p => { const sum = rows.reduce((acc, r) => (r[p] || 0) + acc, 0); if (sum !== 0) sT[k][p] = sum; });
//         });
//         const revRows = allRows.filter(r => r.section === 'REVENUE_SECTION');
//         PERIODS.forEach(p => { const sum = revRows.reduce((acc, r) => (r[`${p}_Revenue`] || 0) + acc, 0); if (sum !== 0) gRT[p] = sum; });
//         PERIODS.forEach(p => { INDIRECT_KEYS.forEach(ik => { const sum = allRows.reduce((acc, r) => (r[`${p}_${ik}`] || 0) + acc, 0); if (sum !== 0) { if (!gIC[ik]) gIC[ik] = {}; gIC[ik][p] = sum; } }); });
//         const gIT = {};
//         PERIODS.forEach(p => { const sum = INDIRECT_KEYS.reduce((acc, ik) => (gIC[ik]?.[p] || 0) + acc, 0); if (sum !== 0) gIT[p] = sum; });
//         PERIODS.forEach(p => { gTF[p] = (gRT[p] || 0) - (DISPLAYED_SECTION_KEYS.reduce((acc, k) => acc + (sT[k][p] || 0), 0) + (gIT[p] || 0)); });
//         const finalIKs = Object.keys(gIC).filter(k => PERIODS.some(p => gIC[k][p] > 0));
//         return { sectionTotals: sT, grandRevenueTotal: gRT, grandIndirectComponents: gIC, grandIndirectTotal: gIT, finalIndirectKeys: finalIKs, grandTotalFee: gTF };
//     }, [allRows, timePeriods]); 

//     const exportToExcel = () => {
//         const workbook = XLSX.utils.book_new();
//         const cleanNum = (val) => val || 0;
//         const baseHeaders = ["Category/Project", "Project Name", "Org", "Account ID", "Account Name", ...timePeriods];

//         // SHEET 1: TOTAL LEVEL
//         const sheet1Data = [baseHeaders];
//         const addSheet1Section = (label, source, isRev = false) => {
//             const suffix = isRev ? '_Revenue' : '';
//             sheet1Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//         };
//         addSheet1Section(SECTION_LABELS.REVENUE_SECTION, grandRevenueTotal, true);
//         DISPLAYED_SECTION_KEYS.forEach(key => addSheet1Section(SECTION_LABELS[key], sectionTotals[key]));
//         sheet1Data.push([SECTION_LABELS.INDIRECT_SECTION, "", "", "", "TOTAL", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         sheet1Data.push([SECTION_LABELS.TOTAL_FEE, "", "", "", "", ...timePeriods.map(p => cleanNum(grandTotalFee[p]))]);
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet1Data), "Totals Summary");

//         // SHEET 2: ROLLUP LEVEL
//         const sheet2Data = [baseHeaders];
//         const addSheet2Section = (sectionKey, label, isRev = false) => {
//             const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
//             const suffix = isRev ? '_Revenue' : '';
//             sheet2Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//             const rollups = paginatedRollups.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey));
//             rollups.forEach(r => {
//                 sheet2Data.push([r.project, r.projectName, r.org, "", "Subtotal", ...timePeriods.map(p => cleanNum(r[`${p}${suffix}`] || r[p]))]);
//             });
//             sheet2Data.push([]);
//         };
//         addSheet2Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
//         DISPLAYED_SECTION_KEYS.forEach(k => addSheet2Section(k, SECTION_LABELS[k]));
//         sheet2Data.push(["INDIRECTS", "", "", "", "TOTAL", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         finalIndirectKeys.forEach(ik => sheet2Data.push([`  ${ik}`, "", "", "", "", ...timePeriods.map(p => cleanNum(grandIndirectComponents[ik]?.[p]))]));
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet2Data), "Rollup Level");

//         // SHEET 3: FULL DETAILED
//         const sheet3Data = [["Project", "Project Name", "Org", "Account ID", "Account Name", "Start Date", "End Date", ...timePeriods]];
//         const addSheet3Section = (sectionKey, label, isRev = false) => {
//             const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
//             const suffix = isRev ? '_Revenue' : '';
//             sheet3Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", "", "", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//             const rollups = paginatedRollups.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey));
//             rollups.forEach(r => {
//                 sheet3Data.push([r.project, r.projectName, r.org, "", "Subtotal", "", "", ...timePeriods.map(p => cleanNum(r[`${p}${suffix}`] || r[p]))]);
//                 r.children.forEach(c => {
//                     sheet3Data.push([`  ${c.project}`, c.projectName, c.org, c.acctId, c.accountName, formatDate(c.popStartDate), formatDate(c.popEndDate), ...timePeriods.map(p => cleanNum(c[`${p}${suffix}`] || c[p]))]);
//                 });
//             });
//             sheet3Data.push([]);
//         };
//         addSheet3Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
//         DISPLAYED_SECTION_KEYS.forEach(k => addSheet3Section(k, SECTION_LABELS[k]));
//         sheet3Data.push(["INDIRECTS", "", "", "", "TOTAL", "", "", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         finalIndirectKeys.forEach(ik => sheet3Data.push([`  ${ik}`, "", "", "", "", "", "", ...timePeriods.map(p => cleanNum(grandIndirectComponents[ik]?.[p]))]));
//         sheet3Data.push([], ["TOTAL FEE", "", "", "", "", "", "", ...timePeriods.map(p => cleanNum(grandTotalFee[p]))]);
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet3Data), "Full Detailed Report");

//         XLSX.writeFile(workbook, "Forecast_Report_MultiSheet.xlsx");
//     };

//     const dimensionHeaders = [ 
//         { key: 'project', label: 'PROJECT', width: '150px' }, 
//         { key: 'projectName', label: 'PROJECT NAME', width: '260px' }, 
//         { key: 'org', label: 'ORG', width: '120px' }, 
//         { key: 'acctId', label: 'ACCOUNT ID', width: '140px' }, 
//         { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' }, 
//         { key: 'popStartDate', label: 'POP START DATE', width: '140px' }, 
//         { key: 'popEndDate', label: 'POP END DATE', width: '140px' }
//     ];

//     const handlePageChange = (newPage) => {
//         setCurrentPage(newPage);
//         if (leftPaneRef.current) leftPaneRef.current.scrollTop = 0;
//         if (rightPaneRef.current) rightPaneRef.current.scrollTop = 0;
//     };

//     const renderDimensionCells = (item, isRevenue, breakdownKey, isRollup = false, isHeader = false, label = "") => {
//         if (isHeader) {
//             const isFee = breakdownKey === 'TOTAL_FEE';
//             return <td colSpan={dimensionHeaders.length} className="px-3 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: isFee ? '#3b82f6' : '#10b981' }}>
//                 <div className="flex items-center">
//                     <FaCaretRight className={`w-3 h-3 mr-2 transition-transform ${expandedSections[breakdownKey] ? 'rotate-90' : ''}`} />
//                     {label}
//                 </div>
//             </td>;
//         }
//         return dimensionHeaders.map((h) => {
//             let content = ''; let pad = '12px'; let bg = isRollup ? '#f1f5f9' : 'white';
//             if (isRevenue) {
//                 if (h.key === 'project') {
//                     content = item.project;
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(`REV_${item.project}`)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} /> <span>{item.project}</span> </div> </td>;
//                     pad = '35px';
//                 } else content = item[h.key];
//             } else if (item) {
//                 if (h.key === 'project') {
//                     content = item.project; pad = isRollup ? '12px' : '35px';
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(item.project)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} /> <span>{content}</span> </div> </td>;
//                 } else content = item[h.key];
//             } else if (h.key === 'project') { content = SECTION_LABELS[breakdownKey]; pad = '25px'; }
//             if (h.key === 'popStartDate' || h.key === 'popEndDate') content = formatDate(content);
//             return <td key={h.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap border-r" style={{ minWidth: h.width, paddingLeft: pad, backgroundColor: bg }}>{content}</td>;
//         });
//     };

//     const renderMonthlyCells = (data, key, isRev = false, isInd = false, isSummary = false) => {
//         const suffix = isRev ? '_Revenue' : (isInd ? `_${key}` : '');
//         const summaryBg = isSummary ? (key === 'TOTAL_FEE' ? '#3b82f6' : '#10b981') : null;
//         return timePeriods.map(p => {
//             const val = data[`${p}${suffix}`] || data[p] || 0;
//             const yellow = isYellowZone(p);
//             return <td key={p} className="px-6 py-2 text-sm text-right min-w-[150px] font-bold border-r" style={{ backgroundColor: summaryBg || (yellow ? '#FEF9C3' : 'transparent'), color: isSummary ? 'white' : 'inherit' }}>
//                 {formatCurrency(val)}
//             </td>;
//         });
//     };

//     return (
//         <div className="flex flex-col min-h-screen p-4 bg-gray-50 overflow-auto">
//             <style>
//                 {`
//                     .main-split-container { display: flex; width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; height: auto; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
//                     .dimension-pane, .monthly-pane { width: 50%; overflow-x: auto; overflow-y: auto; }
//                     .dimension-pane { border-right: 3px solid #94a3b8; }
//                     .pane-table { width: max-content; border-collapse: separate; border-spacing: 0; }
//                     .pane-table th { position: sticky; top: 0; z-index: 60; height: 50px; border-bottom: 2px solid #94a3b8; background: #f8fafc; }
//                     .pane-table td { border-bottom: 1px solid #f1f5f9; }
//                     .rollup-parent-row td { background-color: #f1f5f9; font-weight: bold; }
//                     .revenue-breakdown-row td { background-color: #f0fdfa; border-bottom: 1px dashed #6ee7b7; }
//                 `}
//             </style>
            
//             <div className="flex justify-between items-center mb-6 flex-shrink-0">
//                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Forecast Report</h2>
//                 <div className="flex items-center gap-3">
//                     {isReportRun && (
//                         <button 
//                             onClick={exportToExcel}
//                             className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center"
//                         >
//                             <FaFileDownload className="mr-2" /> EXPORT EXCEL
//                         </button>
//                     )}
//                     <button onClick={handleRunReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
//                         <FaPlay className="inline mr-2" /> {isReportRun ? 'REFRESH' : 'RUN REPORT'}
//                     </button>
//                 </div>
//             </div>

//             {isReportRun && (
//                 <>
//                     <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-200 flex-shrink-0">
//                         <span className="text-xs font-black text-slate-500 uppercase">Projects: {uniqueProjectKeys.length}</span>
//                         <div className="flex space-x-2">
//                             <button onClick={handleToggleAll} className="px-4 py-2 text-xs font-black rounded-lg bg-slate-800 text-white uppercase">{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
//                             <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronLeft /></button>
//                             <span className="px-4 py-2 text-xs font-bold bg-slate-100 rounded-lg">Page {currentPage} of {Math.ceil(uniqueProjectKeys.length/20)}</span>
//                             <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(uniqueProjectKeys.length/20)} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronRight /></button>
//                         </div>
//                     </div>

//                     <div className="main-split-container" ref={reportContainerRef}>
//                         <div className="dimension-pane" ref={leftPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{dimensionHeaders.map(h => <th key={h.key} className="px-3 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ minWidth: h.width }}>{h.label}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr onClick={() => toggleSection('REVENUE_SECTION')}>{renderDimensionCells(null, false, 'REVENUE_SECTION', false, true, SECTION_LABELS.REVENUE_SECTION)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderDimensionCells({...rollupItem}, true, null, true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderDimensionCells(child, true, null, false)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr onClick={() => toggleSection(sectionKey)}>{renderDimensionCells(null, false, sectionKey, false, true, SECTION_LABELS[sectionKey])}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderDimensionCells(rollupItem, false, null, true)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderDimensionCells(child, false, null, false)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr onClick={() => toggleSection('INDIRECT_SECTION')}>{renderDimensionCells(null, false, 'INDIRECT_SECTION', false, true, SECTION_LABELS.INDIRECT_SECTION)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderDimensionCells(null, false, key, false)}</tr>)}
//                                     <tr>{renderDimensionCells(null, false, 'TOTAL_FEE', false, true, SECTION_LABELS.TOTAL_FEE)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                         <div className="monthly-pane" ref={rightPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{timePeriods.map(p => <th key={p} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: isYellowZone(p) ? '#FDE047' : '#059669', color: isYellowZone(p) ? '#334155' : 'white', minWidth: '150px' }}>{p}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr>{renderMonthlyCells(grandRevenueTotal, 'REVENUE_SECTION', true, false, true)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderMonthlyCells(rollupItem, 'REVENUE_SECTION', true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderMonthlyCells(child, 'REVENUE_SECTION', true)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr>{renderMonthlyCells(sectionTotals[sectionKey], sectionKey, false, false, true)}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderMonthlyCells(rollupItem, sectionKey)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderMonthlyCells(child, sectionKey)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr>{renderMonthlyCells(grandIndirectTotal, 'INDIRECT_SECTION', false, false, true)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderMonthlyCells(grandIndirectComponents[key], key, false, true)}</tr>)}
//                                     <tr>{renderMonthlyCells(grandTotalFee, 'TOTAL_FEE', false, false, true)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };

// export default ForecastReport;



// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { 
//   FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, 
//   FaChevronLeft, FaChevronRight, FaPlay, FaFileDownload 
// } from 'react-icons/fa';
// import { backendUrl } from "./config"; 

// // Export Libraries
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import pptxgen from "pptxgenjs";

// // Constants and Mappings
// const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
// const REVENUE_WORK_PERIOD_API = "https://planning-api-dev.onrender.com/ProjRevWrkPd/filter";
// const ROWS_PER_PAGE = 20; 

// const GENERAL_COSTS = 'GENERAL-COSTS';
// const SECTION_LABELS = { 
//   REVENUE_SECTION: ' Revenue (REVENUE)', 
//   INDIRECT_SECTION: ' Indirect', 
//   FRINGE: '1. Fringe', OVERHEAD: '2. Overhead', MANDH: '3. Mat & Handling', GNA: '4. General & Admin', 
//   LABOR: 'Sumaria Labor Onsite (LABOR)', 
//   'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)', 
//   'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)', 
//   'NON-LABOR-SUBCON': 'Subcontractors (LABOR)', 
//   'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)', 
//   TOTAL_FEE: 'Total Fee', 
//   [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)' 
// };

// const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
// const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
// const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];

// const LABOR_ACCTS = new Set(['50-000-000', '50-MJI-097']);
// const UNALLOW_LABOR_ACCTS = new Set(['50-000-999', '50-MJC-097', '50-MJO-097']);
// const TRAVEL_NONLABOR_ACCTS = new Set(['50-400-000', '50-400-004', '50-400-008', '50-300-000', '50-400-001', '50-400-007', '51-300-000', '50-400-005', '50-400-006', '50-400-002']);
// const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJI-097']);
// const SUB_UNALLOW_LABOR_ACCTS = new Set(['51-MJO-097', '51-MJC-097']);



// // Helper Functions
// const formatCurrency = (amount) => (typeof amount !== 'number' || isNaN(amount) || amount === 0) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
// const formatDate = (dateString) => { if (!dateString) return '-'; const date = new Date(dateString.split('T')[0] || dateString); return isNaN(date) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
// const getRollupId = (projId) => { if (!projId) return 'N/A'; const match = projId.match(/^(\d+)/); return match ? match[1] : projId.split('.')[0]; };

// const getPeriodKey = (month, year) => {
//     const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     return `${monthPrefixes[month - 1]}-${String(year).slice(-2)}`;
// };

// const isYellowZone = (periodStr) => {
//     if (periodStr === 'Total') return false;
//     const [monthStr, yearStr] = periodStr.split('-');
//     const year = 2000 + parseInt(yearStr);
//     const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
//     return year > 2026 || (year === 2026 && monthIndex >= 0);
// };

// const determineSectionAndIndirectKey = (item) => {
//     const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
//     const poolName = (item.poolName || '').toUpperCase();
//     let section = GENERAL_COSTS, indirectKey = null;
//     if (subTotTypeNo === 1) section = 'REVENUE_SECTION';
//     else if (subTotTypeNo === 4) {
//         if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
//         else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
//         else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
//         else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
//         section = GENERAL_COSTS; 
//     } 
//     return { section, indirectKey, subTotTypeNo }; 
// };

// const classifyCostSection = (acctId, currentSection) => {
//     if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
//     if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
//     if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
//     if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
//     if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
//     return currentSection; 
// };

// const transformData = (detailData, forecastData, workPeriodRevData, dynamicPeriodMap, dynamicMonthlyPeriods) => {
//     const aggregatedDataMap = {}; 
    
//     forecastData.forEach(item => {
//         const periodKey = getPeriodKey(item.month, item.year);
//         if (!periodKey || !dynamicMonthlyPeriods.includes(periodKey)) return; 

//         const detailRowKey = `${item.projId}-${item.acctId}-0-0`;
//         let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
//         let forecastSubTotTypeNo = 0; 
//         if (item.revenue !== undefined && item.revenue !== 0) { forecastSection = 'REVENUE_SECTION'; forecastSubTotTypeNo = 1; }
        
//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast: ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'Total': 0, };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         if (row.section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
//         if (DISPLAYED_SECTION_KEYS.includes(row.section)) { const costAmount = (item.cost || 0); if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; }
        
//         INDIRECT_KEYS.forEach(ik => {
//             const indirectAmount = (item[ik.toLowerCase()] || 0);
//             if (indirectAmount !== 0) {
//                 const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
//                 if (!aggregatedDataMap[indirectRowKey]) { aggregatedDataMap[indirectRowKey] = { id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: GENERAL_COSTS, subTotTypeNo: 4, 'Total': 0, }; }
//                 aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
//             }
//         });
//     });

//     workPeriodRevData.forEach(item => {
//         const periodKey = getPeriodKey(item.period, item.fy_Cd);
//         if (!periodKey || !dynamicMonthlyPeriods.includes(periodKey)) return;

//         const detailRowKey = `${item.projId}-REV-WORK-PERIOD`;
//         if (!aggregatedDataMap[detailRowKey]) {
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: 'Revenue - Opportunities', org: '', accountName: 'Revenue Work Period', projectName: item.projName || '', popStartDate: '', popEndDate: '', parentProject: null, section: 'REVENUE_SECTION', subTotTypeNo: 1, 'Total': 0 };
//         }
//         const row = aggregatedDataMap[detailRowKey];
//         row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revAmt || 0);
//     });

//     detailData.forEach(item => {
//         const periodKey = dynamicPeriodMap[item.pdNo];
//         if (!periodKey) return; 

//         let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
//         if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
//         const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 

//         if (!aggregatedDataMap[detailRowKey]) { 
//             aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, accountName: item.l1AcctName || item.poolName || 'Unknown Pool', projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt, parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'Total': 0, };
//         } else { 
//             const row = aggregatedDataMap[detailRowKey]; 
//             row.accountName = item.l1AcctName || item.poolName || row.accountName; 
//             row.popStartDate = item.projStartDt || row.popStartDate; 
//             row.popEndDate = item.projEndDt || row.popEndDate; 
//             row.section = section; 
//             if (item.projName) row.projectName = item.projName; 
//             row.subTotTypeNo = subTotTypeNo; 
//         }
        
//         const row = aggregatedDataMap[detailRowKey];
//         const monthlyAmount = (item.ptdIncurAmt || 0); 
//         if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
//         else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
//         else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
//     });

//     // Final Total Column Calculation per row
//     Object.values(aggregatedDataMap).forEach(row => { 
//         let rowTotal = 0;
//         dynamicMonthlyPeriods.forEach(period => {
//             if (row.section === 'REVENUE_SECTION') {
//                 rowTotal += (row[`${period}_Revenue`] || 0);
//             } else {
//                 rowTotal += (row[period] || 0);
//             }
//         });
//         row['Total'] = rowTotal;
//     });

//     return Object.values(aggregatedDataMap); 
// };

// const ForecastReport = () => {
//     const [projectSearchTerm, setProjectSearchTerm] = useState('');
//     const [loading, setLoading] = useState(false); 
//     const [isReportRun, setIsReportRun] = useState(false); 
//     const [error, setError] = useState(null);
//     const [apiData, setApiData] = useState([]); 
//     const [currentPage, setCurrentPage] = useState(1);

//     const [timePeriods, setTimePeriods] = useState([]); 
//     const [monthlyPeriods, setMonthlyPeriods] = useState([]); 
//     const [periodMap, setPeriodMap] = useState({});

//     const leftPaneRef = useRef(null);
//     const rightPaneRef = useRef(null);
//     const reportContainerRef = useRef(null);

//     const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
//     const [expandedSections, setExpandedSections] = useState(initialExpandedState);
//     const [expandedProjects, setExpandedProjects] = useState({}); 

//     const toggleSection = useCallback((key) => { setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })); }, []);
//     const toggleProject = useCallback((projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); }, []);
//     const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

//     const handleToggleAll = () => {
//         if (isAllExpanded) { setExpandedSections(initialExpandedState); setExpandedProjects({}); 
//         } else { const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {}); setExpandedSections(allExpanded); }
//     };

//     const handleRunReport = async () => {
//         setLoading(true); setIsReportRun(true); setError(null);
//         try {
//             const [detailRes, forecastRes] = await Promise.all([
//                 fetch(`${backendUrl}${DETAIL_API_PATH}`), 
//                 fetch(`${backendUrl}${FORECAST_API_PATH}`)
//             ]);
//             if (!detailRes.ok) throw new Error(`Detail API failed`);
//             const detailData = await detailRes.json();
//             const forecastData = forecastRes.ok ? await forecastRes.json() : [];

//             const uniqueConfigs = [];
//             const seen = new Set();
//             forecastData.forEach(item => {
//                 const key = `${item.projId}-${item.version}-${item.plId}`;
//                 if (!seen.has(key)) {
//                     uniqueConfigs.push({ projId: item.projId, version: item.version, plId: item.plId });
//                     seen.add(key);
//                 }
//             });

//             const workPeriodPromises = uniqueConfigs.map(config => 
//                 fetch(`${REVENUE_WORK_PERIOD_API}?projId=${config.projId}&versionNo=${config.version}&bgtType=NBBUD&pl_id=${config.plId}`)
//                 .then(r => r.ok ? r.json() : [])
//                 .catch(() => [])
//             );
//             const workPeriodResults = await Promise.all(workPeriodPromises);
//             const flatWorkPeriodData = workPeriodResults.flat();

//             const minYear = 2025;
//             const forecastYears = forecastData.map(d => parseInt(d.year)).filter(y => !isNaN(y));
//             const maxYear = forecastYears.length > 0 ? Math.max(...forecastYears) : 2026;
            
//             const dynamicMonthly = [];
//             const dynamicMap = {};

//             for (let y = minYear; y <= maxYear; y++) {
//                 for (let m = 1; m <= 12; m++) {
//                     const key = getPeriodKey(m, y);
//                     dynamicMonthly.push(key);
//                     const calculatedPdNo = ((y - 2025) * 12) + m;
//                     dynamicMap[calculatedPdNo] = key;
//                 }
//             }

//             setMonthlyPeriods(dynamicMonthly);
//             setTimePeriods([...dynamicMonthly, 'Total']);
//             setPeriodMap(dynamicMap);

//             const transformedRows = transformData(detailData, forecastData, flatWorkPeriodData, dynamicMap, dynamicMonthly);
//             setApiData(transformedRows);
//         } catch (e) { setApiData([]); setError(`Data load failed: ${e.message}`); } finally { setLoading(false); }
//     };

//     const handleScrollSync = (e) => {
//         if (e.target === leftPaneRef.current) rightPaneRef.current.scrollTop = e.target.scrollTop;
//         else leftPaneRef.current.scrollTop = e.target.scrollTop;
//     };

//     const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
//         const lowerCaseSearch = projectSearchTerm.toLowerCase();
//         const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
//         const rollupGroup = {}; const allProjectRows = [];
        
//         filtered.forEach(item => {
//             const rollupId = getRollupId(item.project);
//             let groupKey = `${rollupId}__${item.section}`;
            
//             allProjectRows.push(item);
            
//             if (!rollupGroup[groupKey]) {
//                 rollupGroup[groupKey] = { id: groupKey, project: rollupId, org: item.org || '', accountName: '', projectName: item.projectName, isRollupParent: true, 'Total': 0, section: item.section, children: [], };
//             }
            
//             const parent = rollupGroup[groupKey]; 
//             parent.children.push(item);
            
//             // Fixed the "Doubling" issue: Sum monthly columns, then recalculate parent total from that sum
//             monthlyPeriods.forEach(period => {
//                 if (item.section === 'REVENUE_SECTION') {
//                     parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
//                 } else {
//                     parent[period] = (parent[period] || 0) + (item[period] || 0);
//                     INDIRECT_KEYS.forEach(ik => { 
//                         if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0); 
//                     });
//                 }
//             });
//         });

//         // Recalculate parent totals from monthly sums to prevent doubling from child total sums
//         Object.values(rollupGroup).forEach(parent => {
//             let parentTotal = 0;
//             monthlyPeriods.forEach(period => {
//                 if (parent.section === 'REVENUE_SECTION') {
//                     parentTotal += (parent[`${period}_Revenue`] || 0);
//                 } else {
//                     parentTotal += (parent[period] || 0);
//                 }
//             });
//             parent['Total'] = parentTotal;
//         });

//         const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project));
//         const uniqueKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
//         const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
//         const paginatedProjectKeys = uniqueKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
//         const paginatedRes = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);
        
//         return { allRows: allProjectRows, uniqueProjectKeys: uniqueKeys, paginatedRollups: paginatedRes };
//     }, [apiData, projectSearchTerm, currentPage, timePeriods, monthlyPeriods]); 

//     const { sectionTotals, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee } = useMemo(() => {
//         const sT = {}; const gRT = {}; const gIC = {}; const gTF = {}; const PERIODS = timePeriods; 
        
//         DISPLAYED_SECTION_KEYS.forEach(k => {
//             const rows = allRows.filter(r => r.section === k); sT[k] = {};
//             PERIODS.forEach(p => { const sum = rows.reduce((acc, r) => (r[p] || 0) + acc, 0); sT[k][p] = sum; });
//         });
        
//         const revRows = allRows.filter(r => r.section === 'REVENUE_SECTION');
//         PERIODS.forEach(p => { const sum = revRows.reduce((acc, r) => (r[`${p}_Revenue`] || 0) + acc, 0); gRT[p] = sum; });
        
//         PERIODS.forEach(p => { INDIRECT_KEYS.forEach(ik => { const sum = allRows.reduce((acc, r) => (r[`${p}_${ik}`] || 0) + acc, 0); if (sum !== 0) { if (!gIC[ik]) gIC[ik] = {}; gIC[ik][p] = sum; } }); });
        
//         const gIT = {};
//         PERIODS.forEach(p => { const sum = INDIRECT_KEYS.reduce((acc, ik) => (gIC[ik]?.[p] || 0) + acc, 0); gIT[p] = sum; });
        
//         PERIODS.forEach(p => { gTF[p] = (gRT[p] || 0) - (DISPLAYED_SECTION_KEYS.reduce((acc, k) => acc + (sT[k][p] || 0), 0) + (gIT[p] || 0)); });
//         const finalIKs = Object.keys(gIC).filter(k => PERIODS.some(p => gIC[k][p] > 0));
        
//         return { sectionTotals: sT, grandRevenueTotal: gRT, grandIndirectComponents: gIC, grandIndirectTotal: gIT, finalIndirectKeys: finalIKs, grandTotalFee: gTF };
//     }, [allRows, timePeriods]); 

//     const exportToExcel = () => {
//         const workbook = XLSX.utils.book_new();
//         const cleanNum = (val) => val || 0;
//         const baseHeaders = ["Category/Project", "Project Name", "Org", "Account ID", "Account Name", ...timePeriods];

//         const sheet1Data = [baseHeaders];
//         const addSheet1Section = (label, source, isRev = false) => {
//             const suffix = isRev ? '_Revenue' : '';
//             sheet1Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//         };
//         addSheet1Section(SECTION_LABELS.REVENUE_SECTION, grandRevenueTotal, true);
//         DISPLAYED_SECTION_KEYS.forEach(key => addSheet1Section(SECTION_LABELS[key], sectionTotals[key]));
//         sheet1Data.push([SECTION_LABELS.INDIRECT_SECTION, "", "", "", "TOTAL", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
//         sheet1Data.push([SECTION_LABELS.TOTAL_FEE, "", "", "", "", ...timePeriods.map(p => cleanNum(grandTotalFee[p]))]);
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet1Data), "Totals Summary");

//         const sheet2Data = [baseHeaders];
//         const addSheet2Section = (sectionKey, label, isRev = false) => {
//             const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
//             const suffix = isRev ? '_Revenue' : '';
//             sheet2Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//             const rollups = allRows.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey)); 
//             const uniqueRollups = [...new Set(rollups.map(r => getRollupId(r.project)))];
//             uniqueRollups.forEach(rid => {
//                 const rRows = rollups.filter(r => getRollupId(r.project) === rid);
//                 const subTot = timePeriods.reduce((acc, p) => { acc[p] = rRows.reduce((s, rr) => s + (rr[isRev ? `${p}_Revenue` : p] || 0), 0); return acc; }, {});
//                 sheet2Data.push([rid, "", "", "", "Subtotal", ...timePeriods.map(p => cleanNum(subTot[p]))]);
//             });
//             sheet2Data.push([]);
//         };
//         addSheet2Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
//         DISPLAYED_SECTION_KEYS.forEach(k => addSheet2Section(k, SECTION_LABELS[k]));
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet2Data), "Rollup Level");

//         const sheet3Data = [["Project", "Project Name", "Org", "Account ID", "Account Name", "Start Date", "End Date", ...timePeriods]];
//         const addSheet3Section = (sectionKey, label, isRev = false) => {
//             const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
//             const suffix = isRev ? '_Revenue' : '';
//             sheet3Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", "", "", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
//             const rollups = paginatedRollups.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey));
//             rollups.forEach(r => {
//                 sheet3Data.push([r.project, r.projectName, r.org, "", "Subtotal", "", "", ...timePeriods.map(p => cleanNum(r[`${p}${suffix}`] || r[p]))]);
//                 r.children.forEach(c => {
//                     sheet3Data.push([`  ${c.project}`, c.projectName, c.org, c.acctId, c.accountName, formatDate(c.popStartDate), formatDate(c.popEndDate), ...timePeriods.map(p => cleanNum(c[isRev ? `${p}_Revenue` : p]))]);
//                 });
//             });
//             sheet3Data.push([]);
//         };
//         addSheet3Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
//         DISPLAYED_SECTION_KEYS.forEach(k => addSheet3Section(k, SECTION_LABELS[k]));
//         XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet3Data), "Detailed Report");

//         XLSX.writeFile(workbook, "Forecast_Report_MultiSheet.xlsx");
//     };

//     const dimensionHeaders = [ 
//         { key: 'project', label: 'PROJECT', width: '150px' }, 
//         { key: 'projectName', label: 'PROJECT NAME', width: '260px' }, 
//         { key: 'org', label: 'ORG', width: '120px' }, 
//         { key: 'acctId', label: 'ACCOUNT ID', width: '140px' }, 
//         { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' }, 
//         { key: 'popStartDate', label: 'POP START DATE', width: '140px' }, 
//         { key: 'popEndDate', label: 'POP END DATE', width: '140px' }
//     ];

//     const handlePageChange = (newPage) => {
//         setCurrentPage(newPage);
//         if (leftPaneRef.current) leftPaneRef.current.scrollTop = 0;
//         if (rightPaneRef.current) rightPaneRef.current.scrollTop = 0;
//     };

//     const renderDimensionCells = (item, isRevenue, breakdownKey, isRollup = false, isHeader = false, label = "") => {
//         if (isHeader) {
//             const isFee = breakdownKey === 'TOTAL_FEE';
//             return <td colSpan={dimensionHeaders.length} className="px-3 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: isFee ? '#3b82f6' : '#10b981' }}>
//                 <div className="flex items-center">
//                     <FaCaretRight className={`w-3 h-3 mr-2 transition-transform ${expandedSections[breakdownKey] ? 'rotate-90' : ''}`} />
//                     {label}
//                 </div>
//             </td>;
//         }
//         return dimensionHeaders.map((h) => {
//             let content = ''; let pad = '12px'; let bg = isRollup ? '#f1f5f9' : 'white';
//             if (isRevenue) {
//                 if (h.key === 'project') {
//                     content = item.project;
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(`REV_${item.project}`)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} /> <span>{item.project}</span> </div> </td>;
//                     pad = '35px';
//                 } else content = item[h.key];
//             } else if (item) {
//                 if (h.key === 'project') {
//                     content = item.project; pad = isRollup ? '12px' : '35px';
//                     if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(item.project)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} /> <span>{content}</span> </div> </td>;
//                 } else content = item[h.key];
//             } else if (h.key === 'project') { content = SECTION_LABELS[breakdownKey]; pad = '25px'; }
//             if (h.key === 'popStartDate' || h.key === 'popEndDate') content = formatDate(content);
//             return <td key={h.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap border-r" style={{ minWidth: h.width, paddingLeft: pad, backgroundColor: bg }}>{content}</td>;
//         });
//     };

//     const renderMonthlyCells = (data, key, isRev = false, isInd = false, isSummary = false) => {
//         const suffix = isRev ? '_Revenue' : (isInd ? `_${key}` : '');
//         const summaryBg = isSummary ? (key === 'TOTAL_FEE' ? '#3b82f6' : '#10b981') : null;
//         return timePeriods.map(p => {
//             const val = data[`${p}${suffix}`] || data[p] || 0;
//             const yellow = isYellowZone(p);
//             return <td key={p} className="px-6 py-2 text-sm text-right min-w-[150px] font-bold border-r" style={{ backgroundColor: summaryBg || (yellow ? '#FEF9C3' : 'transparent'), color: isSummary ? 'white' : 'inherit' }}>
//                 {formatCurrency(val)}
//             </td>;
//         });
//     };

//     return (
//         <div className="flex flex-col min-h-screen p-4 bg-gray-50 overflow-auto">
//             <style>
//                 {`
//                     .main-split-container { display: flex; width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; height: auto; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
//                     .dimension-pane, .monthly-pane { width: 50%; overflow-x: auto; overflow-y: auto; }
//                     .dimension-pane { border-right: 3px solid #94a3b8; }
//                     .pane-table { width: max-content; border-collapse: separate; border-spacing: 0; }
//                     .pane-table th { position: sticky; top: 0; z-index: 60; height: 50px; border-bottom: 2px solid #94a3b8; background: #f8fafc; }
//                     .pane-table td { border-bottom: 1px solid #f1f5f9; }
//                     .rollup-parent-row td { background-color: #f1f5f9; font-weight: bold; }
//                     .revenue-breakdown-row td { background-color: #f0fdfa; border-bottom: 1px dashed #6ee7b7; }
//                 `}
//             </style>
            
//             <div className="flex justify-between items-center mb-6 flex-shrink-0">
//                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Forecast Report</h2>
//                 <div className="flex items-center gap-3">
//                     {isReportRun && (
//                         <button 
//                             onClick={exportToExcel}
//                             className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center"
//                         >
//                             <FaFileDownload className="mr-2" /> EXPORT EXCEL
//                         </button>
//                     )}
//                     <button onClick={handleRunReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
//                         <FaPlay className="inline mr-2" /> {isReportRun ? 'REFRESH' : 'RUN REPORT'}
//                     </button>
//                 </div>
//             </div>

//             {isReportRun && (
//                 <>
//                     <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-200 flex-shrink-0">
//                         <span className="text-xs font-black text-slate-500 uppercase">Projects: {uniqueProjectKeys.length}</span>
//                         <div className="flex space-x-2">
//                             <button onClick={handleToggleAll} className="px-4 py-2 text-xs font-black rounded-lg bg-slate-800 text-white uppercase">{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
//                             <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronLeft /></button>
//                             <span className="px-4 py-2 text-xs font-bold bg-slate-100 rounded-lg">Page {currentPage} of {Math.ceil(uniqueProjectKeys.length/20)}</span>
//                             <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(uniqueProjectKeys.length/20)} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronRight /></button>
//                         </div>
//                     </div>

//                     <div className="main-split-container" ref={reportContainerRef}>
//                         <div className="dimension-pane" ref={leftPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{dimensionHeaders.map(h => <th key={h.key} className="px-3 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ minWidth: h.width }}>{h.label}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr onClick={() => toggleSection('REVENUE_SECTION')}>{renderDimensionCells(null, false, 'REVENUE_SECTION', false, true, SECTION_LABELS.REVENUE_SECTION)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderDimensionCells({...rollupItem}, true, null, true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderDimensionCells(child, true, null, false)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr onClick={() => toggleSection(sectionKey)}>{renderDimensionCells(null, false, sectionKey, false, true, SECTION_LABELS[sectionKey])}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderDimensionCells(rollupItem, false, null, true)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderDimensionCells(child, false, null, false)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr onClick={() => toggleSection('INDIRECT_SECTION')}>{renderDimensionCells(null, false, 'INDIRECT_SECTION', false, true, SECTION_LABELS.INDIRECT_SECTION)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderDimensionCells(null, false, key, false)}</tr>)}
//                                     <tr>{renderDimensionCells(null, false, 'TOTAL_FEE', false, true, SECTION_LABELS.TOTAL_FEE)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                         <div className="monthly-pane" ref={rightPaneRef} onScroll={handleScrollSync}>
//                             <table className="pane-table">
//                                 <thead><tr>{timePeriods.map(p => <th key={p} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: isYellowZone(p) ? '#FDE047' : '#059669', color: isYellowZone(p) ? '#334155' : 'white', minWidth: '150px' }}>{p}</th>)}</tr></thead>
//                                 <tbody>
//                                     <tr>{renderMonthlyCells(grandRevenueTotal, 'REVENUE_SECTION', true, false, true)}</tr>
//                                     {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
//                                         <React.Fragment key={rollupItem.id}>
//                                             <tr className="revenue-breakdown-row">{renderMonthlyCells(rollupItem, 'REVENUE_SECTION', true)}</tr>
//                                             {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderMonthlyCells(child, 'REVENUE_SECTION', true)}</tr>)}
//                                         </React.Fragment>
//                                     ))}
//                                     {DISPLAYED_SECTION_KEYS.map(sectionKey => (
//                                         <React.Fragment key={sectionKey}>
//                                             <tr>{renderMonthlyCells(sectionTotals[sectionKey], sectionKey, false, false, true)}</tr>
//                                             {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
//                                                 <React.Fragment key={rollupItem.id}>
//                                                     <tr className="rollup-parent-row">{renderMonthlyCells(rollupItem, sectionKey)}</tr>
//                                                     {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderMonthlyCells(child, sectionKey)}</tr>)}
//                                                 </React.Fragment>
//                                             ))}
//                                         </React.Fragment>
//                                     ))}
//                                     <tr>{renderMonthlyCells(grandIndirectTotal, 'INDIRECT_SECTION', false, false, true)}</tr>
//                                     {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderMonthlyCells(grandIndirectComponents[key], key, false, true)}</tr>)}
//                                     <tr>{renderMonthlyCells(grandTotalFee, 'TOTAL_FEE', false, false, true)}</tr>
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </>
//             )}
//         </div>
//     );
// };

// export default ForecastReport;



import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  FaSearch, FaChevronDown, FaChevronUp, FaCaretRight, 
  FaChevronLeft, FaChevronRight, FaPlay, FaFileDownload 
} from 'react-icons/fa';
import { backendUrl } from "./config"; 

// Export Libraries
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import pptxgen from "pptxgenjs";

// Constants and Mappings
const DETAIL_API_PATH = "/api/ForecastReport/GetViewData"; 
const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView"; 
// const REVENUE_WORK_PERIOD_API = "https://planning-api-dev.onrender.com/ProjRevWrkPd/filter";  
const REVENUE_WORK_PERIOD_API = "/ProjRevWrkPd/filter";
const ROWS_PER_PAGE = 20; 

const GENERAL_COSTS = 'GENERAL-COSTS';
const SECTION_LABELS = { 
  REVENUE_SECTION: ' Revenue (REVENUE)', 
  INDIRECT_SECTION: ' Indirect', 
  FRINGE: '1. Fringe', OVERHEAD: '2. Overhead', MANDH: '3. Mat & Handling', GNA: '4. General & Admin', 
  LABOR: 'Sumaria Labor Onsite (LABOR)', 
  'UNALLOW-LABOR': 'Sumaria Labor Onsite (NON-Billable)', 
  'NON-LABOR-TRAVEL': 'Sumaria Travel (NON-LABOR)', 
  'NON-LABOR-SUBCON': 'Subcontractors (LABOR)', 
  'UNALLOW-SUBCON': 'Subcontractors (NON-Billable)', 
  TOTAL_FEE: 'Total Fee', 
  [GENERAL_COSTS]: '7 - Other Unclassified Direct Costs (Hidden)' 
};

const DISPLAYED_SECTION_KEYS = ['LABOR', 'UNALLOW-LABOR', 'NON-LABOR-TRAVEL', 'NON-LABOR-SUBCON', 'UNALLOW-SUBCON'];
const ALL_TOGGLEABLE_SECTIONS = [...DISPLAYED_SECTION_KEYS, 'REVENUE_SECTION', 'INDIRECT_SECTION'];
const INDIRECT_KEYS = ['FRINGE', 'OVERHEAD', 'MANDH', 'GNA'];

// Updated Account Mappings
const REVENUE_ACCTS = new Set(['10-001-000']);
const LABOR_ACCTS = new Set(['50-000-000', '50-MJC-097', '50-MJI-097', '50-MJO-097']);
const UNALLOW_LABOR_ACCTS = new Set(['50-000-999']);
const TRAVEL_NONLABOR_ACCTS = new Set(['50-400-000', '50-400-001', '50-400-002', '50-400-004', '50-400-005', '50-400-006', '50-400-007', '50-400-008']);
const SUB_LABOR_ACCTS = new Set(['51-000-000', '51-MJC-097', '51-MJI-097', '51-MJO-097']);
const SUB_UNALLOW_LABOR_ACCTS = new Set(['50-300-000', '51-300-000', '51-400-000']);

// Helper Functions
const formatCurrency = (amount) => (typeof amount !== 'number' || isNaN(amount) || amount === 0) ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString) => { if (!dateString) return '-'; const date = new Date(dateString.split('T')[0] || dateString); return isNaN(date) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }); };
const getRollupId = (projId) => { if (!projId) return 'N/A'; const match = projId.match(/^(\d+)/); return match ? match[1] : projId.split('.')[0]; };

const getPeriodKey = (month, year) => {
    const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthPrefixes[month - 1]}-${String(year).slice(-2)}`;
};

const isYellowZone = (periodStr) => {
    if (periodStr === 'Total') return false;
    const [monthStr, yearStr] = periodStr.split('-');
    const year = 2000 + parseInt(yearStr);
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
    return year > 2026 || (year === 2026 && monthIndex >= 0);
};

const classifyCostSection = (acctId, currentSection) => {
    if (REVENUE_ACCTS.has(acctId)) return 'REVENUE_SECTION';
    if (LABOR_ACCTS.has(acctId)) return 'LABOR'; 
    if (UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-LABOR';
    if (TRAVEL_NONLABOR_ACCTS.has(acctId)) return 'NON-LABOR-TRAVEL';
    if (SUB_LABOR_ACCTS.has(acctId)) return 'NON-LABOR-SUBCON';
    if (SUB_UNALLOW_LABOR_ACCTS.has(acctId)) return 'UNALLOW-SUBCON';
    return currentSection; 
};

const determineSectionAndIndirectKey = (item) => {
    const subTotTypeNo = parseInt(item.subTotTypeNo) || null; 
    const poolName = (item.poolName || '').toUpperCase();
    let section = GENERAL_COSTS, indirectKey = null;
    if (subTotTypeNo === 1 || REVENUE_ACCTS.has(item.acctId)) section = 'REVENUE_SECTION';
    else if (subTotTypeNo === 4) {
        if (poolName.includes('FRINGE BENEFITS')) indirectKey = 'FRINGE';
        else if (poolName.includes('GENERAL & ADMIN') || poolName.includes('G&A')) indirectKey = 'GNA';
        else if (poolName.includes('OVERHEAD')) indirectKey = 'OVERHEAD';
        else if (poolName.includes('MAT & HANDLING') || poolName.includes('M&H')) indirectKey = 'MANDH';
        section = GENERAL_COSTS; 
    } 
    return { section, indirectKey, subTotTypeNo }; 
};

const transformData = (detailData, forecastData, workPeriodRevData, dynamicPeriodMap, dynamicMonthlyPeriods) => {
    const aggregatedDataMap = {}; 
    
    forecastData.forEach(item => {
        const periodKey = getPeriodKey(item.month, item.year);
        if (!periodKey || !dynamicMonthlyPeriods.includes(periodKey)) return; 

        const detailRowKey = `${item.projId}-${item.acctId}-0-0`;
        let forecastSection = classifyCostSection(item.acctId, GENERAL_COSTS);
        let forecastSubTotTypeNo = 0; 
        
        if (forecastSection === 'REVENUE_SECTION' || (item.revenue !== undefined && item.revenue !== 0)) { 
            forecastSection = 'REVENUE_SECTION'; 
            forecastSubTotTypeNo = 1; 
        }
        
        if (!aggregatedDataMap[detailRowKey]) {
            aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast: ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: forecastSection, subTotTypeNo: forecastSubTotTypeNo, 'Total': 0, };
        }
        const row = aggregatedDataMap[detailRowKey];
        if (row.section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revenue || 0);
        if (DISPLAYED_SECTION_KEYS.includes(row.section)) { const costAmount = (item.cost || 0); if (costAmount !== 0) row[periodKey] = (row[periodKey] || 0) + costAmount; }
        
        INDIRECT_KEYS.forEach(ik => {
            const indirectAmount = (item[ik.toLowerCase()] || 0);
            if (indirectAmount !== 0) {
                const indirectRowKey = `${item.projId}-${item.acctId}-0-4`; 
                if (!aggregatedDataMap[indirectRowKey]) { aggregatedDataMap[indirectRowKey] = { id: indirectRowKey, project: item.projId, acctId: item.acctId, org: item.orgId || '', accountName: `Forecast Indirect Costs for ${item.acctId}`, projectName: item.projName, popStartDate: '', popEndDate: '', parentProject: null, section: GENERAL_COSTS, subTotTypeNo: 4, 'Total': 0, }; }
                aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] = (aggregatedDataMap[indirectRowKey][`${periodKey}_${ik}`] || 0) + indirectAmount;
            }
        });
    });

    workPeriodRevData.forEach(item => {
        const periodKey = getPeriodKey(item.period, item.fy_Cd);
        if (!periodKey || !dynamicMonthlyPeriods.includes(periodKey)) return;

        const detailRowKey = `${item.projId}-REV-WORK-PERIOD`;
        if (!aggregatedDataMap[detailRowKey]) {
            aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: 'Revenue - Opportunities', org: '', accountName: 'Revenue Work Period', projectName: item.projName || '', popStartDate: '', popEndDate: '', parentProject: null, section: 'REVENUE_SECTION', subTotTypeNo: 1, 'Total': 0 };
        }
        const row = aggregatedDataMap[detailRowKey];
        row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + (item.revAmt || 0);
    });

    // detailData.forEach(item => {
    //     const periodKey = dynamicPeriodMap[item.pdNo];
    //     if (!periodKey) return; 

    //     let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);
    //     if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) section = classifyCostSection(item.acctId, section);
    //     const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`; 

    //     if (!aggregatedDataMap[detailRowKey]) { 
    //         aggregatedDataMap[detailRowKey] = { id: detailRowKey, project: item.projId, acctId: item.acctId, org: item.orgId, accountName: item.l1AcctName || item.poolName || 'Unknown Pool', projectName: item.projName, popStartDate: item.projStartDt, popEndDate: item.projEndDt, parentProject: null, section: section, subTotTypeNo: subTotTypeNo, 'Total': 0, };
    //     } else { 
    //         const row = aggregatedDataMap[detailRowKey]; 
    //         row.accountName = item.l1AcctName || item.poolName || row.accountName; 
    //         row.popStartDate = item.projStartDt || row.popStartDate; 
    //         row.popEndDate = item.projEndDt || row.popEndDate; 
    //         row.section = section; 
    //         if (item.projName) row.projectName = item.projName; 
    //         row.subTotTypeNo = subTotTypeNo; 
    //     }
        
    //     const row = aggregatedDataMap[detailRowKey];
    //     const monthlyAmount = (item.ptdIncurAmt || 0); 
    //     if (section === 'REVENUE_SECTION') row[`${periodKey}_Revenue`] = (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
    //     else if (indirectKey) row[`${periodKey}_${indirectKey}`] = (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
    //     else row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
    // });
        detailData.forEach(item => {

    // ✅ FIX: use (fyCd + pdNo)
    const periodKey = dynamicPeriodMap[`${item.fyCd}_${item.pdNo}`];
    if (!periodKey) return;

    let { section, indirectKey, subTotTypeNo } = determineSectionAndIndirectKey(item);

    if (section !== 'REVENUE_SECTION' && subTotTypeNo !== 4) {
        section = classifyCostSection(item.acctId, section);
    }

    const detailRowKey = `${item.projId}-${item.acctId}-${item.poolNo}-${subTotTypeNo || 0}`;

    if (!aggregatedDataMap[detailRowKey]) {
        aggregatedDataMap[detailRowKey] = {
            id: detailRowKey,
            project: item.projId,
            acctId: item.acctId,
            org: item.orgId,
            accountName: item.l1AcctName || item.poolName || 'Unknown Pool',
            projectName: item.projName,
            popStartDate: item.projStartDt,
            popEndDate: item.projEndDt,
            parentProject: null,
            section,
            subTotTypeNo,
            Total: 0,
        };
    }

    const row = aggregatedDataMap[detailRowKey];
    const monthlyAmount = item.ptdIncurAmt || 0;

    if (section === 'REVENUE_SECTION') {
        row[`${periodKey}_Revenue`] =
            (row[`${periodKey}_Revenue`] || 0) + monthlyAmount;
    } else if (indirectKey) {
        row[`${periodKey}_${indirectKey}`] =
            (row[`${periodKey}_${indirectKey}`] || 0) + monthlyAmount;
    } else {
        row[periodKey] = (row[periodKey] || 0) + monthlyAmount;
    }
});

    Object.values(aggregatedDataMap).forEach(row => { 
        let rowTotal = 0;
        dynamicMonthlyPeriods.forEach(period => {
            if (row.section === 'REVENUE_SECTION') {
                rowTotal += (row[`${period}_Revenue`] || 0);
            } else {
                rowTotal += (row[period] || 0);
            }
        });
        row['Total'] = rowTotal;
    });

    return Object.values(aggregatedDataMap); 
};

const ForecastReport = () => {
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [loading, setLoading] = useState(false); 
    const [isReportRun, setIsReportRun] = useState(false); 
    const [error, setError] = useState(null);
    const [apiData, setApiData] = useState([]); 
    const [currentPage, setCurrentPage] = useState(1);

    const [timePeriods, setTimePeriods] = useState([]); 
    const [monthlyPeriods, setMonthlyPeriods] = useState([]); 
    const [periodMap, setPeriodMap] = useState({});

    const leftPaneRef = useRef(null);
    const rightPaneRef = useRef(null);
    const reportContainerRef = useRef(null);

    const initialExpandedState = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    const [expandedSections, setExpandedSections] = useState(initialExpandedState);
    const [expandedProjects, setExpandedProjects] = useState({}); 

    const toggleSection = useCallback((key) => { setExpandedSections(prev => ({ ...prev, [key]: !prev[key] })); }, []);
    const toggleProject = useCallback((projectId) => { setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] })); }, []);
    const isAllExpanded = useMemo(() => ALL_TOGGLEABLE_SECTIONS.every(key => expandedSections[key]), [expandedSections]);

    const handleToggleAll = () => {
        if (isAllExpanded) { setExpandedSections(initialExpandedState); setExpandedProjects({}); 
        } else { const allExpanded = ALL_TOGGLEABLE_SECTIONS.reduce((acc, key) => ({ ...acc, [key]: true }), {}); setExpandedSections(allExpanded); }
    };

    const handleRunReport = async () => {
        setLoading(true); setIsReportRun(true); setError(null);
        try {
            const [detailRes, forecastRes] = await Promise.all([
                fetch(`${backendUrl}${DETAIL_API_PATH}`), 
                fetch(`${backendUrl}${FORECAST_API_PATH}`)
            ]);
            if (!detailRes.ok) throw new Error(`Detail API failed`);
            const detailData = await detailRes.json();
            const forecastData = forecastRes.ok ? await forecastRes.json() : [];

            const uniqueConfigs = [];
            const seen = new Set();
            forecastData.forEach(item => {
                const key = `${item.projId}-${item.version}-${item.plId}`;
                if (!seen.has(key)) {
                    uniqueConfigs.push({ projId: item.projId, version: item.version, plId: item.plId });
                    seen.add(key);
                }
            });

            // const workPeriodPromises = uniqueConfigs.map(config => 
            //     fetch(`${REVENUE_WORK_PERIOD_API}?projId=${config.projId}&versionNo=${config.version}&bgtType=NBBUD&pl_id=${config.plId}`)
            //     .then(r => r.ok ? r.json() : [])
            //     .catch(() => [])
            // );       

            const workPeriodPromises = uniqueConfigs.map(config => 
                fetch(`${backendUrl}${REVENUE_WORK_PERIOD_API}?projId=${config.projId}&versionNo=${config.version}&bgtType=NBBUD&pl_id=${config.plId}`)
                .then(r => r.ok ? r.json() : [])
                .catch(() => [])
                );
            const workPeriodResults = await Promise.all(workPeriodPromises);
            const flatWorkPeriodData = workPeriodResults.flat();

            const minYear = 2025;
            const forecastYears = forecastData.map(d => parseInt(d.year)).filter(y => !isNaN(y));
            const maxYear = forecastYears.length > 0 ? Math.max(...forecastYears) : 2026;
            
            // const dynamicMonthly = [];
            // const dynamicMap = {};

            // for (let y = minYear; y <= maxYear; y++) {
            //     for (let m = 1; m <= 12; m++) {
            //         const key = getPeriodKey(m, y);
            //         dynamicMonthly.push(key);
            //         const calculatedPdNo = ((y - 2025) * 12) + m;
            //         dynamicMap[calculatedPdNo] = key;
            //     }
            // }

            // setMonthlyPeriods(dynamicMonthly);
            // setTimePeriods([...dynamicMonthly, 'Total']);
            // setPeriodMap(dynamicMap);


            const dynamicMonthly = [];
                const dynamicMap = {}; // key = `${fy_cd}_${pd_no}`

                for (let y = minYear; y <= maxYear; y++) {
                    for (let m = 1; m <= 12; m++) {
                        const key = getPeriodKey(m, y);
                        dynamicMonthly.push(key);

                        // ✅ FIX: use fy_cd + pd_no (NOT rolling pd)
                        dynamicMap[`${y}_${m}`] = key;
                    }
                }

                setMonthlyPeriods(dynamicMonthly);
                setTimePeriods([...dynamicMonthly, 'Total']);
                setPeriodMap(dynamicMap);


            const transformedRows = transformData(detailData, forecastData, flatWorkPeriodData, dynamicMap, dynamicMonthly);
            setApiData(transformedRows);
        } catch (e) { setApiData([]); setError(`Data load failed: ${e.message}`); } finally { setLoading(false); }
    };

    const handleScrollSync = (e) => {
        if (e.target === leftPaneRef.current) rightPaneRef.current.scrollTop = e.target.scrollTop;
        else leftPaneRef.current.scrollTop = e.target.scrollTop;
    };

    const { allRows, uniqueProjectKeys, paginatedRollups } = useMemo(() => {
        const lowerCaseSearch = projectSearchTerm.toLowerCase();
        const filtered = apiData.filter(item => !lowerCaseSearch || item.project.toLowerCase().includes(lowerCaseSearch) || item.projectName.toLowerCase().includes(lowerCaseSearch));
        const rollupGroup = {}; const allProjectRows = [];
        
        filtered.forEach(item => {
            const rollupId = getRollupId(item.project);
            let groupKey = `${rollupId}__${item.section}`;
            
            allProjectRows.push(item);
            
            if (!rollupGroup[groupKey]) {
                rollupGroup[groupKey] = { id: groupKey, project: rollupId, org: item.org || '', accountName: '', projectName: item.projectName, isRollupParent: true, 'Total': 0, section: item.section, children: [], };
            }
            
            const parent = rollupGroup[groupKey]; 
            parent.children.push(item);
            
            monthlyPeriods.forEach(period => {
                if (item.section === 'REVENUE_SECTION') {
                    parent[`${period}_Revenue`] = (parent[`${period}_Revenue`] || 0) + (item[`${period}_Revenue`] || 0);
                } else {
                    parent[period] = (parent[period] || 0) + (item[period] || 0);
                    INDIRECT_KEYS.forEach(ik => { 
                        if (item[`${period}_${ik}`] !== undefined) parent[`${period}_${ik}`] = (parent[`${period}_${ik}`] || 0) + (item[`${period}_${ik}`] || 0); 
                    });
                }
            });
        });

        Object.values(rollupGroup).forEach(parent => {
            let parentTotal = 0;
            monthlyPeriods.forEach(period => {
                if (parent.section === 'REVENUE_SECTION') {
                    parentTotal += (parent[`${period}_Revenue`] || 0);
                } else {
                    parentTotal += (parent[period] || 0);
                }
            });
            parent['Total'] = parentTotal;
        });

        const sortedRollupParents = Object.values(rollupGroup).sort((a, b) => a.project.localeCompare(b.project));
        const uniqueKeys = [...new Set(sortedRollupParents.map(p => p.project))].sort();
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const paginatedProjectKeys = uniqueKeys.slice(startIndex, startIndex + ROWS_PER_PAGE);
        const paginatedRes = sortedRollupParents.filter(p => paginatedProjectKeys.includes(p.project) && p.section !== GENERAL_COSTS);
        
        return { allRows: allProjectRows, uniqueProjectKeys: uniqueKeys, paginatedRollups: paginatedRes };
    }, [apiData, projectSearchTerm, currentPage, timePeriods, monthlyPeriods]); 

    const { sectionTotals, grandRevenueTotal, grandIndirectComponents, grandIndirectTotal, finalIndirectKeys, grandTotalFee } = useMemo(() => {
        const sT = {}; const gRT = {}; const gIC = {}; const gTF = {}; const PERIODS = timePeriods; 
        
        DISPLAYED_SECTION_KEYS.forEach(k => {
            const rows = allRows.filter(r => r.section === k); sT[k] = {};
            PERIODS.forEach(p => { const sum = rows.reduce((acc, r) => (r[p] || 0) + acc, 0); sT[k][p] = sum; });
        });
        
        const revRows = allRows.filter(r => r.section === 'REVENUE_SECTION');
        PERIODS.forEach(p => { gRT[p] = revRows.reduce((acc, r) => (r[`${p}_Revenue`] || 0) + acc, 0); });
        
        PERIODS.forEach(p => { INDIRECT_KEYS.forEach(ik => { const sum = allRows.reduce((acc, r) => (r[`${p}_${ik}`] || 0) + acc, 0); if (sum !== 0) { if (!gIC[ik]) gIC[ik] = {}; gIC[ik][p] = sum; } }); });
        
        const gIT = {};
        PERIODS.forEach(p => { const sum = INDIRECT_KEYS.reduce((acc, ik) => (gIC[ik]?.[p] || 0) + acc, 0); gIT[p] = sum; });
        
        PERIODS.forEach(p => { gTF[p] = (gRT[p] || 0) - (DISPLAYED_SECTION_KEYS.reduce((acc, k) => acc + (sT[k][p] || 0), 0) + (gIT[p] || 0)); });
        const finalIKs = Object.keys(gIC).filter(k => PERIODS.some(p => gIC[k][p] > 0));
        
        return { sectionTotals: sT, grandRevenueTotal: gRT, grandIndirectComponents: gIC, grandIndirectTotal: gIT, finalIndirectKeys: finalIKs, grandTotalFee: gTF };
    }, [allRows, timePeriods]); 

    const exportToExcel = () => {
        const workbook = XLSX.utils.book_new();
        const cleanNum = (val) => val || 0;
        const baseHeaders = ["Category/Project", "Project Name", "Org", "Account ID", "Account Name", ...timePeriods];

        const sheet1Data = [baseHeaders];
        const addSheet1Section = (label, source, isRev = false) => {
            const suffix = isRev ? '_Revenue' : '';
            sheet1Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
        };
        addSheet1Section(SECTION_LABELS.REVENUE_SECTION, grandRevenueTotal, true);
        DISPLAYED_SECTION_KEYS.forEach(key => addSheet1Section(SECTION_LABELS[key], sectionTotals[key]));
        sheet1Data.push([SECTION_LABELS.INDIRECT_SECTION, "", "", "", "TOTAL", ...timePeriods.map(p => cleanNum(grandIndirectTotal[p]))]);
        sheet1Data.push([SECTION_LABELS.TOTAL_FEE, "", "", "", "", ...timePeriods.map(p => cleanNum(grandTotalFee[p]))]);
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet1Data), "Totals Summary");

        const sheet2Data = [baseHeaders];
        const addSheet2Section = (sectionKey, label, isRev = false) => {
            const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
            const suffix = isRev ? '_Revenue' : '';
            sheet2Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
            const rollups = allRows.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey)); 
            const uniqueRollups = [...new Set(rollups.map(r => getRollupId(r.project)))];
            uniqueRollups.forEach(rid => {
                const rRows = rollups.filter(r => getRollupId(r.project) === rid);
                const subTot = timePeriods.reduce((acc, p) => { acc[p] = rRows.reduce((s, rr) => s + (rr[isRev ? `${p}_Revenue` : p] || 0), 0); return acc; }, {});
                sheet2Data.push([rid, "", "", "", "Subtotal", ...timePeriods.map(p => cleanNum(subTot[p]))]);
            });
            sheet2Data.push([]);
        };
        addSheet2Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
        DISPLAYED_SECTION_KEYS.forEach(k => addSheet2Section(k, SECTION_LABELS[k]));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet2Data), "Rollup Level");

        const sheet3Data = [["Project", "Project Name", "Org", "Account ID", "Account Name", "Start Date", "End Date", ...timePeriods]];
        const addSheet3Section = (sectionKey, label, isRev = false) => {
            const source = isRev ? grandRevenueTotal : sectionTotals[sectionKey];
            const suffix = isRev ? '_Revenue' : '';
            sheet3Data.push([label.toUpperCase(), "", "", "", "SECTION TOTAL", "", "", ...timePeriods.map(p => cleanNum(source[`${p}${suffix}`] || source[p]))]);
            const rollups = paginatedRollups.filter(r => r.section === (isRev ? 'REVENUE_SECTION' : sectionKey));
            rollups.forEach(r => {
                sheet3Data.push([r.project, r.projectName, r.org, "", "Subtotal", "", "", ...timePeriods.map(p => cleanNum(r[`${p}${suffix}`] || r[p]))]);
                r.children.forEach(c => {
                    sheet3Data.push([`  ${c.project}`, c.projectName, c.org, c.acctId, c.accountName, formatDate(c.popStartDate), formatDate(c.popEndDate), ...timePeriods.map(p => cleanNum(c[isRev ? `${p}_Revenue` : p]))]);
                });
            });
            sheet3Data.push([]);
        };
        addSheet3Section('REVENUE_SECTION', SECTION_LABELS.REVENUE_SECTION, true);
        DISPLAYED_SECTION_KEYS.forEach(k => addSheet3Section(k, SECTION_LABELS[k]));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet3Data), "Detailed Report");

        XLSX.writeFile(workbook, "Forecast_Report_MultiSheet.xlsx");
    };

    const dimensionHeaders = [ 
        { key: 'project', label: 'PROJECT', width: '150px' }, 
        { key: 'projectName', label: 'PROJECT NAME', width: '260px' }, 
        { key: 'org', label: 'ORG', width: '120px' }, 
        { key: 'acctId', label: 'ACCOUNT ID', width: '140px' }, 
        { key: 'accountName', label: 'ACCOUNT NAME', width: '220px' }, 
        { key: 'popStartDate', label: 'POP START DATE', width: '140px' }, 
        { key: 'popEndDate', label: 'POP END DATE', width: '140px' }
    ];

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        if (leftPaneRef.current) leftPaneRef.current.scrollTop = 0;
        if (rightPaneRef.current) rightPaneRef.current.scrollTop = 0;
    };

    const renderDimensionCells = (item, isRevenue, breakdownKey, isRollup = false, isHeader = false, label = "") => {
        if (isHeader) {
            const isFee = breakdownKey === 'TOTAL_FEE';
            return <td colSpan={dimensionHeaders.length} className="px-3 py-2 text-sm font-extrabold text-white" style={{ backgroundColor: isFee ? '#3b82f6' : '#10b981' }}>
                <div className="flex items-center">
                    <FaCaretRight className={`w-3 h-3 mr-2 transition-transform ${expandedSections[breakdownKey] ? 'rotate-90' : ''}`} />
                    {label}
                </div>
            </td>;
        }
        return dimensionHeaders.map((h) => {
            let content = ''; let pad = '12px'; let bg = isRollup ? '#f1f5f9' : 'white';
            if (isRevenue) {
                if (h.key === 'project') {
                    content = item.project;
                    if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(`REV_${item.project}`)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[`REV_${item.project}`] ? 'rotate-90' : ''}`} /> <span>{item.project}</span> </div> </td>;
                    pad = '35px';
                } else content = item[h.key];
            } else if (item) {
                if (h.key === 'project') {
                    content = item.project; pad = isRollup ? '12px' : '35px';
                    if (item.isRollupParent) return <td key={h.key} className="px-3 py-2 text-sm" style={{ minWidth: h.width, backgroundColor: bg }} onClick={() => toggleProject(item.project)}> <div className="flex items-center space-x-1 cursor-pointer"> <FaCaretRight className={`w-3 h-3 transition-transform ${expandedProjects[item.project] ? 'rotate-90' : ''}`} /> <span>{content}</span> </div> </td>;
                } else content = item[h.key];
            } else if (h.key === 'project') { content = SECTION_LABELS[breakdownKey]; pad = '25px'; }
            if (h.key === 'popStartDate' || h.key === 'popEndDate') content = formatDate(content);
            return <td key={h.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap border-r" style={{ minWidth: h.width, paddingLeft: pad, backgroundColor: bg }}>{content}</td>;
        });
    };

    const renderMonthlyCells = (data, key, isRev = false, isInd = false, isSummary = false) => {
        const suffix = isRev ? '_Revenue' : (isInd ? `_${key}` : '');
        const summaryBg = isSummary ? (key === 'TOTAL_FEE' ? '#3b82f6' : '#10b981') : null;
        return timePeriods.map(p => {
            const val = data[`${p}${suffix}`] || data[p] || 0;
            const yellow = isYellowZone(p);
            return <td key={p} className="px-6 py-2 text-sm text-right min-w-[150px] font-bold border-r" style={{ backgroundColor: summaryBg || (yellow ? '#FEF9C3' : 'transparent'), color: isSummary ? 'white' : 'inherit' }}>
                {formatCurrency(val)}
            </td>;
        });
    };

    return (
        <div className="flex flex-col min-h-screen p-4 bg-gray-50 overflow-auto">
            <style>
                {`
                    .main-split-container { display: flex; width: 100%; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; height: auto; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
                    .dimension-pane, .monthly-pane { width: 50%; overflow-x: auto; overflow-y: auto; }
                    .dimension-pane { border-right: 3px solid #94a3b8; }
                    .pane-table { width: max-content; border-collapse: separate; border-spacing: 0; }
                    .pane-table th { position: sticky; top: 0; z-index: 60; height: 50px; border-bottom: 2px solid #94a3b8; background: #f8fafc; }
                    .pane-table td { border-bottom: 1px solid #f1f5f9; }
                    .rollup-parent-row td { background-color: #f1f5f9; font-weight: bold; }
                    .revenue-breakdown-row td { background-color: #f0fdfa; border-bottom: 1px dashed #6ee7b7; }
                `}
            </style>
            
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Forecast Report</h2>
                <div className="flex items-center gap-3">
                    {isReportRun && (
                        <button 
                            onClick={exportToExcel}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center"
                        >
                            <FaFileDownload className="mr-2" /> EXPORT EXCEL
                        </button>
                    )}
                    <button onClick={handleRunReport} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
                        <FaPlay className="inline mr-2" /> {isReportRun ? 'REFRESH' : 'RUN REPORT'}
                    </button>
                </div>
            </div>

            {isReportRun && (
                <>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4 border border-slate-200 flex-shrink-0">
                        <span className="text-xs font-black text-slate-500 uppercase">Projects: {uniqueProjectKeys.length}</span>
                        <div className="flex space-x-2">
                            <button onClick={handleToggleAll} className="px-4 py-2 text-xs font-black rounded-lg bg-slate-800 text-white uppercase">{isAllExpanded ? 'Collapse All' : 'Expand All'}</button>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronLeft /></button>
                            <span className="px-4 py-2 text-xs font-bold bg-slate-100 rounded-lg">Page {currentPage} of {Math.ceil(uniqueProjectKeys.length/20)}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= Math.ceil(uniqueProjectKeys.length/20)} className="p-2 rounded-lg border hover:bg-slate-50 disabled:opacity-30"><FaChevronRight /></button>
                        </div>
                    </div>

                    <div className="main-split-container" ref={reportContainerRef}>
                        <div className="dimension-pane" ref={leftPaneRef} onScroll={handleScrollSync}>
                            <table className="pane-table">
                                <thead><tr>{dimensionHeaders.map(h => <th key={h.key} className="px-3 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{ minWidth: h.width }}>{h.label}</th>)}</tr></thead>
                                <tbody>
                                    <tr onClick={() => toggleSection('REVENUE_SECTION')}>{renderDimensionCells(null, false, 'REVENUE_SECTION', false, true, SECTION_LABELS.REVENUE_SECTION)}</tr>
                                    {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
                                        <React.Fragment key={rollupItem.id}>
                                            <tr className="revenue-breakdown-row">{renderDimensionCells({...rollupItem}, true, null, true)}</tr>
                                            {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderDimensionCells(child, true, null, false)}</tr>)}
                                        </React.Fragment>
                                    ))}
                                    {DISPLAYED_SECTION_KEYS.map(sectionKey => (
                                        <React.Fragment key={sectionKey}>
                                            <tr onClick={() => toggleSection(sectionKey)}>{renderDimensionCells(null, false, sectionKey, false, true, SECTION_LABELS[sectionKey])}</tr>
                                            {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
                                                <React.Fragment key={rollupItem.id}>
                                                    <tr className="rollup-parent-row">{renderDimensionCells(rollupItem, false, null, true)}</tr>
                                                    {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderDimensionCells(child, false, null, false)}</tr>)}
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    <tr onClick={() => toggleSection('INDIRECT_SECTION')}>{renderDimensionCells(null, false, 'INDIRECT_SECTION', false, true, SECTION_LABELS.INDIRECT_SECTION)}</tr>
                                    {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderDimensionCells(null, false, key, false)}</tr>)}
                                    <tr>{renderDimensionCells(null, false, 'TOTAL_FEE', false, true, SECTION_LABELS.TOTAL_FEE)}</tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="monthly-pane" ref={rightPaneRef} onScroll={handleScrollSync}>
                            <table className="pane-table">
                                <thead><tr>{timePeriods.map(p => <th key={p} className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: isYellowZone(p) ? '#FDE047' : '#059669', color: isYellowZone(p) ? '#334155' : 'white', minWidth: '150px' }}>{p}</th>)}</tr></thead>
                                <tbody>
                                    <tr>{renderMonthlyCells(grandRevenueTotal, 'REVENUE_SECTION', true, false, true)}</tr>
                                    {expandedSections.REVENUE_SECTION && paginatedRollups.filter(p => p.section === 'REVENUE_SECTION').map(rollupItem => (
                                        <React.Fragment key={rollupItem.id}>
                                            <tr className="revenue-breakdown-row">{renderMonthlyCells(rollupItem, 'REVENUE_SECTION', true)}</tr>
                                            {expandedProjects[`REV_${rollupItem.project}`] && rollupItem.children.map(child => <tr key={child.id}>{renderMonthlyCells(child, 'REVENUE_SECTION', true)}</tr>)}
                                        </React.Fragment>
                                    ))}
                                    {DISPLAYED_SECTION_KEYS.map(sectionKey => (
                                        <React.Fragment key={sectionKey}>
                                            <tr>{renderMonthlyCells(sectionTotals[sectionKey], sectionKey, false, false, true)}</tr>
                                            {expandedSections[sectionKey] && paginatedRollups.filter(r => r.section === sectionKey).map(rollupItem => (
                                                <React.Fragment key={rollupItem.id}>
                                                    <tr className="rollup-parent-row">{renderMonthlyCells(rollupItem, sectionKey)}</tr>
                                                    {expandedProjects[rollupItem.project] && rollupItem.children.filter(c => c.section === sectionKey).map(child => <tr key={child.id}>{renderMonthlyCells(child, sectionKey)}</tr>)}
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    <tr>{renderMonthlyCells(grandIndirectTotal, 'INDIRECT_SECTION', false, false, true)}</tr>
                                    {expandedSections.INDIRECT_SECTION && finalIndirectKeys.map(key => <tr key={key} className="revenue-breakdown-row">{renderMonthlyCells(grandIndirectComponents[key], key, false, true)}</tr>)}
                                    <tr>{renderMonthlyCells(grandTotalFee, 'TOTAL_FEE', false, false, true)}</tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ForecastReport;