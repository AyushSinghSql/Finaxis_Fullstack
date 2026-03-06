// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const Pricing = () => {
//   const [activeTab, setActiveTab] = useState("Proposed labor");
//   const [laborData, setLaborData] = useState({});
//   const [filteredLabor, setFilteredLabor] = useState([]);
//   const [isLoadingLabor, setIsLoadingLabor] = useState(false);
//   const [selectedYear, setSelectedYear] = useState("2025");
//   const [availableYears, setAvailableYears] = useState([]);
//   const [plcMap, setPlcMap] = useState({}); 
//   const [projectConfig, setProjectConfig] = useState({
//     closingDate: null,
//     escalation: 0,
//   });

//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(40);
//   const [jumpPage, setJumpPage] = useState("");

//   const tabs = ["Summarized pricing", "Pricing by elements", "Proposed labor", "Proposed non labor"];
//   const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

//   /* ---------------- API FETCH ---------------- */
//   useEffect(() => {
//     const fetchLaborData = async () => {
//       setIsLoadingLabor(true);
//       try {
//         const projId = "22209.001";
//         const [labRes, empRes, foreRes, confRes] = await Promise.all([
//           fetch(`${backendUrl}/api/ForecastReport/GetLabHSData`),
//           fetch(`${backendUrl}/api/ForecastReport/GetAllEmployee`),
//           fetch(`${backendUrl}/api/ForecastReport/GetForecastView`),
//           fetch(`${backendUrl}/api/Configuration/GetAllConfigValuesByProject/${projId}`)
//         ]);

//         const labJson = await labRes.json();
//         const empJson = await empRes.json();
//         const foreJson = await foreRes.json();
//         const confJson = await confRes.json();

//         // 1. Identify all unique PLC codes across History and Forecast
//         const uniquePlcs = new Set([
//           ...labJson.map(i => i.billLabCatCd),
//           ...foreJson.map(i => i.plc)
//         ].filter(Boolean));

//         // 2. Fetch descriptions for each unique PLC code
//         const tempMap = {};
//         await Promise.all([...uniquePlcs].map(async (code) => {
//           try {
//             // const res = await fetch(`${backendUrl}/Project/GetAllPlcs/${code}`);
//             const res = await fetch(`${backendUrl}/Project/GetAllPlcs/`);
//             const data = await res.json();
//             // Data is an array [ { description: "..." } ] based on your example
//             if (data && data.length > 0) {
//               tempMap[code] = data[0].description;
//             }
//           } catch (e) {
//             console.error(`Could not fetch description for ${code}`);
//           }
//         }));
//         setPlcMap(tempMap);

//         const closingVal = confJson.find(c => c.name === "closing_period")?.value;
//         const escVal = confJson.find(c => c.name === "escallation_percent")?.value;
//         const closingDate = closingVal ? new Date(closingVal) : new Date("2025-12-31");

//         setProjectConfig({ closingDate, escalation: escVal || 0 });

//         const employeeMap = {};
//         empJson.forEach(emp => { if (emp.emplId) employeeMap[String(emp.emplId)] = emp.firstName; });

//         const allYears = [...new Set([...labJson.map(i => String(i.fyCd)), ...foreJson.map(i => String(i.year))])].sort();
//         setAvailableYears(allYears);

//         setLaborData({ history: labJson, forecast: foreJson, empMap: employeeMap, closingDate });
//       } catch (err) {
//         console.error("api error:", err);
//       } finally {
//         setIsLoadingLabor(false);
//       }
//     };

//     if (activeTab === "Proposed labor") fetchLaborData();
//   }, [activeTab]);

//   /* ---------------- FILTER LOGIC ---------------- */
//   useEffect(() => {
//     if (!laborData.history || !laborData.forecast) return;

//     const tYear1 = parseInt(selectedYear);
//     const tYear2 = tYear1 + 1;

//     const process = (acc, item, isForecast) => {
//       const iYear = isForecast ? parseInt(item.year) : parseInt(item.fyCd);
//       const iMonth = isForecast ? parseInt(item.month) : parseInt(item.pdNo);
//       if (iYear !== tYear1 && iYear !== tYear2) return acc;

//       const itemDate = new Date(iYear, iMonth - 1, 28);
//       const isActualPeriod = itemDate <= laborData.closingDate;

//       if (isActualPeriod && isForecast) return acc;
//       if (!isActualPeriod && !isForecast) return acc;

//       const key = String(item.emplId);
//       const rawCode = isForecast ? item.plc : item.billLabCatCd;

//       if (!acc[key]) {
//         acc[key] = {
//           // MAP THE DESCRIPTION HERE
//           lcat: plcMap[rawCode] || rawCode, 
//           id: key,
//           name: laborData.empMap[key] || `Employee ${key}`,
//           org: item.orgId,
//           year1Hrs: 0,
//           year1Amt: 0,
//           year2Hrs: 0,
//           year2Amt: 0,
//           monthlyYear1: Array(12).fill(0),
//           monthlyYear2: Array(12).fill(0)
//         };
//       }

//       const hrs = isForecast ? item.forecastedHours : item.actHrs;
//       const amt = isForecast ? item.forecastedAmt : item.actAmt;

//       if (iYear === tYear1) {
//         acc[key].year1Hrs += hrs;
//         acc[key].year1Amt += amt;
//         acc[key].monthlyYear1[iMonth - 1] += hrs;
//       } else {
//         acc[key].year2Hrs += hrs;
//         acc[key].year2Amt += amt;
//         acc[key].monthlyYear2[iMonth - 1] += hrs;
//       }
//       return acc;
//     };

//     let merged = laborData.history.reduce((acc, curr) => process(acc, curr, false), {});
//     merged = laborData.forecast.reduce((acc, curr) => process(acc, curr, true), merged);

//     setFilteredLabor(Object.values(merged));
//     setCurrentPage(1);
//   }, [selectedYear, laborData, plcMap]);

//   /* ---------------- PAGINATION ---------------- */
//   const totalPages = Math.ceil(filteredLabor.length / rowsPerPage);
//   const paginatedData = filteredLabor.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

//   const handleJumpPage = (e) => {
//     e.preventDefault();
//     const pageNum = parseInt(jumpPage);
//     if (pageNum >= 1 && pageNum <= totalPages) {
//       setCurrentPage(pageNum);
//       setJumpPage("");
//     }
//   };

//   /* ---------------- RENDER ---------------- */
//   const renderProposedLabor = () => (
//     <div className="w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
//       <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex justify-between items-center">
//         <div className="flex items-center gap-8">
//           <h2 className="text-xl font-bold text-slate-800">Proposed labor analysis</h2>
//           <div className="flex items-center gap-3">
//             <label className="text-xs font-semibold text-slate-500">Fiscal year</label>
//             <select
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(e.target.value)}
//               className="bg-white border border-slate-300 text-sm font-bold text-slate-700 rounded-md px-3 py-1.5"
//             >
//               {availableYears.map(y => <option key={y} value={y}>FY {y}</option>)}
//             </select>
//           </div>
//         </div>
//         <div className="flex gap-8 text-xs font-bold">
//           <div className="flex flex-col items-end">
//             <span className="text-slate-400">Close period</span>
//             <span>{projectConfig.closingDate?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
//           </div>
//           <div className="flex flex-col items-end">
//             <span className="text-slate-400">Escalation</span>
//             <span className="text-indigo-600">{projectConfig.escalation}%</span>
//           </div>
//         </div>
//       </div>

//       <div className="overflow-auto h-[calc(100vh-280px)] relative isolate bg-white">
//         <table className="w-full text-sm border-collapse min-w-[4200px] table-fixed">
//           <thead className="sticky top-0 z-[200] bg-white">
//             <tr className="text-xs font-bold text-slate-500 border-b border-slate-200 bg-white">
//               <th className="px-6 py-4 border-r sticky left-0 z-[210] bg-white w-56">Labor Category</th>
//               <th className="px-6 py-4 border-r sticky left-56 z-[210] bg-white w-32">Employee Id</th>
//               <th className="px-6 py-4 border-r sticky left-[22rem] z-[210] bg-white w-72 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)]">Full Name</th>
//               <th className="px-6 py-4 border-r w-32">Org</th>
//               <th className="px-4 py-4 border-r text-right">Total Hrs</th>
//               <th className="px-4 py-4 border-r text-right">Actual Amt</th>
//               {months.map(m => <th key={m} className="px-4 py-4 border-r text-center">{m}</th>)}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {paginatedData.map((r, i) => (
//               <tr key={i} className="hover:bg-slate-50">
//                 <td className="px-6 py-4 border-r sticky left-0 z-[150] bg-white text-xs font-semibold">{r.lcat}</td>
//                 <td className="px-6 py-4 border-r sticky left-56 z-[150] bg-white font-mono text-xs">{r.id}</td>
//                 <td className="px-6 py-4 border-r sticky left-[22rem] z-[150] bg-white shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)] font-bold">{r.name}</td>
//                 <td className="px-6 py-4 border-r">{r.org}</td>
//                 <td className="px-4 py-4 border-r text-right font-bold">{r.year1Hrs.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
//                 <td className="px-4 py-4 border-r text-right font-bold">${r.year1Amt.toLocaleString()}</td>
//                 {r.monthlyYear1.map((h, mi) => (
//                   <td key={mi} className="px-4 py-4 border-r text-right text-xs">{h > 0 ? h.toFixed(1) : "—"}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="bg-white border-t border-slate-200 px-8 py-5 flex items-center justify-between">
//         <div className="flex items-center gap-10">
//           <div className="flex items-center gap-3">
//             <span className="text-xs font-bold text-slate-400">Rows per page</span>
//             <select
//               value={rowsPerPage}
//               onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
//               className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold bg-white"
//             >
//               {[40, 50, 100].map(n => <option key={n} value={n}>{n} records</option>)}
//             </select>
//           </div>
//           <form onSubmit={handleJumpPage} className="flex items-center gap-3">
//             <span className="text-xs font-bold text-slate-400">Jump to</span>
//             <input
//               type="number"
//               value={jumpPage}
//               placeholder={`1-${totalPages}`}
//               onChange={(e) => setJumpPage(e.target.value)}
//               className="w-20 border border-slate-300 rounded px-2 py-1.5 text-xs font-bold"
//             />
//             <button type="submit" className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-xs font-bold">Go</button>
//           </form>
//           <div className="text-xs font-bold text-slate-400 italic">
//             Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredLabor.length)} of {filteredLabor.length} records
//           </div>
//         </div>
//         <div className="flex gap-3 items-center">
//           <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-30">Prev</button>
//           <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-30">Next</button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="w-full min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
//       <header className="bg-white border-b border-slate-200 px-10 py-5 flex justify-between items-center sticky top-0 z-[300] shadow-sm">
//         <div className="flex flex-col"><h1 className="text-2xl font-bold text-slate-900 tracking-tighter">Pricing</h1></div>
//         <div className="flex bg-slate-100 rounded-xl p-1.5 border border-slate-200 shadow-inner">
//           {tabs.map((t) => (
//             <button
//               key={t}
//               onClick={() => { setActiveTab(t); setCurrentPage(1); }}
//               className={`px-6 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 ${activeTab === t ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"}`}
//             >
//               {t}
//             </button>
//           ))}
//         </div>
//       </header>
//       <main className="w-full flex-grow p-8">
//         {isLoadingLabor ? <div className="text-center py-20 font-bold text-slate-500">Loading Analysis...</div> : activeTab === "Proposed labor" && renderProposedLabor()}
//         {activeTab === "Summarized pricing" && <div>Summarized pricing content</div>}
//         {activeTab === "Pricing by elements" && <div>Pricing by elements content</div>}
//         {activeTab === "Proposed non labor" && <div>Proposed non labor content</div>}
//       </main>
//     </div>
//   );
// };

// export default Pricing;

// Deployed version with PLC description mapping and pagination for Proposed Labor tab. Other tabs have placeholder content.


// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const Pricing = () => {
//   const [activeTab, setActiveTab] = useState(""); 
//   const [laborData, setLaborData] = useState({ history: null, forecast: null });
//   const [filteredLabor, setFilteredLabor] = useState([]);
//   const [isLoadingLabor, setIsLoadingLabor] = useState(false);
//   const [selectedYear, setSelectedYear] = useState("2025");
//   const [availableYears, setAvailableYears] = useState([]);
//   const [plcMap, setPlcMap] = useState({});
//   const [projectConfig, setProjectConfig] = useState({
//     closingDate: null,
//     escalation: 0,
//   });

//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(40);
//   const [jumpPage, setJumpPage] = useState("");

//   const tabs = ["Summarized pricing", "Pricing by elements", "Proposed labor", "Proposed non labor"];
//   const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//   /* ---------------- API FETCH ---------------- */
//   useEffect(() => {
//     const fetchLaborData = async () => {
//       if (laborData.history) return; 

//       setIsLoadingLabor(true);
//       try {
//         const projId = "22209.001";
//         const [labRes, empRes, foreRes, confRes, plcRes] = await Promise.all([
//           fetch(`${backendUrl}/api/ForecastReport/GetLabHSData`),
//           fetch(`${backendUrl}/api/ForecastReport/GetAllEmployee`),
//           fetch(`${backendUrl}/api/ForecastReport/GetForecastView`),
//           fetch(`${backendUrl}/api/Configuration/GetAllConfigValuesByProject/${projId}`),
//           fetch(`${backendUrl}/Project/GetAllPlcs/`)
//         ]);

//         const labJson = await labRes.json();
//         const empJson = await empRes.json();
//         const foreJson = await foreRes.json();
//         const confJson = await confRes.json();
//         const plcJson = await plcRes.json();

//         const tempMap = {};
//         plcJson.forEach(item => {
//           if (item.laborCategoryCode) {
//             tempMap[item.laborCategoryCode] = item.description;
//           }
//         });
//         setPlcMap(tempMap);

//         const closingVal = confJson.find(c => c.name === "closing_period")?.value;
//         const escVal = confJson.find(c => c.name === "escallation_percent")?.value;
//         const closingDate = closingVal ? new Date(closingVal) : new Date("2025-12-31");

//         setProjectConfig({ closingDate, escalation: escVal || 0 });

//         const employeeMap = {};
//         empJson.forEach(emp => { if (emp.emplId) employeeMap[String(emp.emplId)] = emp.firstName; });

//         const allYears = [...new Set([...labJson.map(i => String(i.fyCd)), ...foreJson.map(i => String(i.year))])].sort();
//         setAvailableYears(allYears);

//         setLaborData({ history: labJson, forecast: foreJson, empMap: employeeMap, closingDate });
//       } catch (err) {
//         console.error("api error:", err);
//       } finally {
//         setIsLoadingLabor(false);
//       }
//     };

//     if (activeTab === "Proposed labor") fetchLaborData();
//   }, [activeTab, laborData.history]);

//   /* ---------------- FILTER LOGIC ---------------- */
//   useEffect(() => {
//     if (!laborData.history || !laborData.forecast) return;

//     const tYear1 = parseInt(selectedYear);
//     const tYear2 = tYear1 + 1;

//     const process = (acc, item, isForecast) => {
//       const iYear = isForecast ? parseInt(item.year) : parseInt(item.fyCd);
//       const iMonth = isForecast ? parseInt(item.month) : parseInt(item.pdNo);
//       if (iYear !== tYear1 && iYear !== tYear2) return acc;

//       const itemDate = new Date(iYear, iMonth - 1, 28);
//       const isActualPeriod = itemDate <= laborData.closingDate;

//       if (isActualPeriod && isForecast) return acc;
//       if (!isActualPeriod && !isForecast) return acc;

//       const key = String(item.emplId);
//       const rawCode = isForecast ? item.plc : item.billLabCatCd;

//       if (!acc[key]) {
//         acc[key] = {
//           lcat: plcMap[rawCode] || rawCode,
//           id: key,
//           name: laborData.empMap[key] || `Employee ${key}`,
//           org: item.orgId,
//           year1Hrs: 0,
//           year1Amt: 0,
//           year2Hrs: 0,
//           year2Amt: 0,
//           monthlyYear1: Array(12).fill(0),
//           monthlyYear2: Array(12).fill(0)
//         };
//       }

//       const hrs = isForecast ? item.forecastedHours : item.actHrs;
//       const amt = isForecast ? item.forecastedAmt : item.actAmt;

//       if (iYear === tYear1) {
//         acc[key].year1Hrs += hrs;
//         acc[key].year1Amt += amt;
//         acc[key].monthlyYear1[iMonth - 1] += hrs;
//       } else {
//         acc[key].year2Hrs += hrs;
//         acc[key].year2Amt += amt;
//         acc[key].monthlyYear2[iMonth - 1] += hrs;
//       }
//       return acc;
//     };

//     let merged = laborData.history.reduce((acc, curr) => process(acc, curr, false), {});
//     merged = laborData.forecast.reduce((acc, curr) => process(acc, curr, true), merged);

//     setFilteredLabor(Object.values(merged));
//     setCurrentPage(1);
//   }, [selectedYear, laborData, plcMap]);

//   /* ---------------- PAGINATION ---------------- */
//   const totalPages = Math.ceil(filteredLabor.length / rowsPerPage);
//   const paginatedData = filteredLabor.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

//   const handleJumpPage = (e) => {
//     e.preventDefault();
//     const pageNum = parseInt(jumpPage);
//     if (pageNum >= 1 && pageNum <= totalPages) {
//       setCurrentPage(pageNum);
//       setJumpPage("");
//     }
//   };

//   /* ---------------- RENDER ---------------- */
//   const renderProposedLabor = () => (
//     <div className="w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
//       <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex justify-between items-center z-[250]">
//         <div className="flex items-center gap-8">
//           <h2 className="text-xl font-bold text-slate-800">Proposed labor analysis</h2>
//           <div className="flex items-center gap-3">
//             <label className="text-xs font-semibold text-slate-500">Fiscal year</label>
//             <select
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(e.target.value)}
//               className="bg-white border border-slate-300 text-sm font-bold text-slate-700 rounded-md px-3 py-1.5"
//             >
//               {availableYears.map(y => <option key={y} value={y}>FY {y}</option>)}
//             </select>
//           </div>
//         </div>
//         <div className="flex gap-8 text-xs font-bold">
//           <div className="flex flex-col items-end">
//             <span className="text-slate-400">Close period</span>
//             <span>{projectConfig.closingDate?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
//           </div>
//           <div className="flex flex-col items-end">
//             <span className="text-slate-400">Escalation</span>
//             <span className="text-indigo-600">{projectConfig.escalation}%</span>
//           </div>
//         </div>
//       </div>

//       <div className="overflow-auto h-[calc(100vh-280px)] relative bg-white">
//         <table className="w-full text-sm border-collapse min-w-[4200px] table-fixed">
//           <thead className="sticky top-0 z-[200]">
//             <tr className="text-xs font-bold text-slate-500 border-b border-slate-200">
//               {/* Opaque Background on Header Cells */}
//               <th className="px-6 py-4 border-r sticky left-0 z-[210] bg-white w-56">Labor Category</th>
//               <th className="px-6 py-4 border-r sticky left-56 z-[210] bg-white w-32">Employee Id</th>
//               <th className="px-6 py-4 border-r sticky left-[22rem] z-[210] bg-white w-72 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]">Full Name</th>
//               <th className="px-6 py-4 border-r w-32 bg-slate-50">Org</th>
//               <th className="px-4 py-4 border-r text-right bg-slate-50">Total Hrs</th>
//               <th className="px-4 py-4 border-r text-right bg-slate-50">Actual Amt</th>
//               {months.map(m => <th key={m} className="px-4 py-4 border-r text-center bg-slate-50">{m}</th>)}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {paginatedData.map((r, i) => (
//               <tr key={i} className="hover:bg-slate-50 group">
//                 {/* Opaque Background on Body Cells ensures content behind doesn't show */}
//                 <td className="px-6 py-4 border-r sticky left-0 z-[150] bg-white group-hover:bg-slate-50 text-xs font-semibold">{r.lcat}</td>
//                 <td className="px-6 py-4 border-r sticky left-56 z-[150] bg-white group-hover:bg-slate-50 font-mono text-xs">{r.id}</td>
//                 <td className="px-6 py-4 border-r sticky left-[22rem] z-[150] bg-white group-hover:bg-slate-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] font-bold">{r.name}</td>
//                 <td className="px-6 py-4 border-r">{r.org}</td>
//                 <td className="px-4 py-4 border-r text-right font-bold">{r.year1Hrs.toLocaleString(undefined, { minimumFractionDigits: 1 })}</td>
//                 <td className="px-4 py-4 border-r text-right font-bold">${r.year1Amt.toLocaleString()}</td>
//                 {r.monthlyYear1.map((h, mi) => (
//                   <td key={mi} className="px-4 py-4 border-r text-right text-xs">{h > 0 ? h.toFixed(1) : "—"}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="bg-white border-t border-slate-200 px-8 py-5 flex items-center justify-between z-[250]">
//         <div className="flex items-center gap-10">
//           <div className="flex items-center gap-3">
//             <span className="text-xs font-bold text-slate-400">Rows per page</span>
//             <select
//               value={rowsPerPage}
//               onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
//               className="border border-slate-300 rounded px-3 py-1.5 text-xs font-bold bg-white"
//             >
//               {[40, 50, 100].map(n => <option key={n} value={n}>{n} records</option>)}
//             </select>
//           </div>
//           <form onSubmit={handleJumpPage} className="flex items-center gap-3">
//             <span className="text-xs font-bold text-slate-400">Jump to</span>
//             <input
//               type="number"
//               value={jumpPage}
//               placeholder={`1-${totalPages}`}
//               onChange={(e) => setJumpPage(e.target.value)}
//               className="w-20 border border-slate-300 rounded px-2 py-1.5 text-xs font-bold"
//             />
//             <button type="submit" className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-xs font-bold">Go</button>
//           </form>
//           <div className="text-xs font-bold text-slate-400 italic">
//             Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredLabor.length)} of {filteredLabor.length} records
//           </div>
//         </div>
//         <div className="flex gap-3 items-center">
//           <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-30">Prev</button>
//           <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-30">Next</button>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="w-full min-h-screen bg-[#f1f5f9] flex flex-col font-sans">
//       <header className="bg-white border-b border-slate-200 px-10 py-5 flex justify-between items-center sticky top-0 z-[300] shadow-sm">
//         <div className="flex flex-col"><h1 className="text-2xl font-bold text-slate-900 tracking-tighter">Pricing</h1></div>
//         <div className="flex bg-slate-100 rounded-xl p-1.5 border border-slate-200 shadow-inner">
//           {tabs.map((t) => (
//             <button
//               key={t}
//               onClick={() => { setActiveTab(t); setCurrentPage(1); }}
//               className={`px-6 py-2.5 text-[11px] font-bold rounded-lg transition-all duration-300 ${activeTab === t ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"}`}
//             >
//               {t}
//             </button>
//           ))}
//         </div>
//       </header>
//       <main className="w-full flex-grow p-8">
//         {activeTab === "" && (
//             <div className="text-center py-20 text-slate-400 font-medium">Please select a tab to view data.</div>
//         )}
        
//         {isLoadingLabor ? (
//             <div className="text-center py-20 font-bold text-slate-500">Loading Analysis...</div>
//         ) : (
//             activeTab === "Proposed labor" && renderProposedLabor()
//         )}
        
//         {activeTab === "Summarized pricing" && <div className="p-10 bg-white rounded-xl shadow-sm">Summarized pricing content</div>}
//         {activeTab === "Pricing by elements" && <div className="p-10 bg-white rounded-xl shadow-sm">Pricing by elements content</div>}
//         {activeTab === "Proposed non labor" && <div className="p-10 bg-white rounded-xl shadow-sm">Proposed non labor content</div>}
//       </main>
//     </div>
//   );
// };

// export default Pricing;


// Deployed version with initial empty state for activeTab, prompting user to select a tab. Added background and padding to placeholder content for better visibility.


import React, { useState, useEffect, useMemo, useRef } from "react";
import { backendUrl } from "./config";
import { 
  Download, Search, ChevronLeft, ChevronRight, LayoutGrid 
} from "lucide-react";

const ACCOUNT_TYPE_MAP = {

  "500-001-110": "1 - Direct Labor",
"500-001-120": "1 - Direct Labor",
"500-001-150": "1 - Direct Labor",
"500-001-160": "1 - Direct Labor",
"500-002-110": "1 - Direct Labor",
"500-002-120": "1 - Direct Labor",
"500-002-150": "1 - Direct Labor",
"500-002-160": "1 - Direct Labor",
"500-003-110": "1 - Direct Labor",
"500-003-120": "1 - Direct Labor",
"500-004-110": "1 - Direct Labor",
"500-004-120": "1 - Direct Labor",
"500-005-110": "1 - Direct Labor",
"500-006-110": "1 - Direct Labor",
"500-007-110": "1 - Direct Labor",
"500-008-120": "1 - Direct Labor",
"500-009-120": "1 - Direct Labor",
"500-010-110": "1 - Direct Labor",
"500-010-120": "1 - Direct Labor",
"500-010-150": "1 - Direct Labor",
"500-010-160": "1 - Direct Labor",
"500-013-110": "1 - Direct Labor",
"500-013-120": "1 - Direct Labor",
"500-017-110": "1 - Direct Labor",
"500-018-120": "1 - Direct Labor",

"642-001-135": "2 - Consultation",
"643-001-135": "2 - Consultation",
"643-001-140": "2 - Consultation",
"643-002-140": "2 - Consultation",
"643-003-140": "2 - Consultation",
"643-004-135": "2 - Consultation",
"643-050-135": "2 - Consultation",
"643-050-140": "2 - Consultation",
"643-054-135": "2 - Consultation",

"645-001-140": "3 - Materials",
"653-002-140": "3 - Materials",

"645-001-135": "4 - Material Handling",
"645-003-135": "4 - Material Handling",
"645-004-135": "4 - Material Handling",
"645-005-135": "4 - Material Handling",

"646-001-135": "5 - Subcontractors",
"646-001-140": "5 - Subcontractors",
"646-002-135": "5 - Subcontractors",
"646-002-140": "5 - Subcontractors",
"646-003-140": "5 - Subcontractors",
"646-004-135": "5 - Subcontractors",
"646-005-135": "5 - Subcontractors",
"646-050-135": "5 - Subcontractors",
"646-050-140": "5 - Subcontractors",
"646-051-135": "5 - Subcontractors",
"646-052-135": "5 - Subcontractors",
"646-053-135": "5 - Subcontractors",
"646-054-135": "5 - Subcontractors",
"654-001-140": "5 - Subcontractors",
"656-001-140": "5 - Subcontractors",

"647-001-140": "6 - Travel",
"647-002-140": "6 - Travel",
"647-003-140": "6 - Travel",
"647-004-140": "6 - Travel",
"647-005-140": "6 - Travel",
"647-006-140": "6 - Travel",
"647-007-140": "6 - Travel",
"647-008-140": "6 - Travel",
"647-009-140": "6 - Travel",
"647-010-140": "6 - Travel",

"648-001-140": "7 - Other Direct Cost",
"650-001-001": "7 - Other Direct Cost",
"651-001-140": "7 - Other Direct Cost",
"651-002-140": "7 - Other Direct Cost",
"651-003-140": "7 - Other Direct Cost",
"653-001-140": "7 - Other Direct Cost",
"653-009-140": "7 - Other Direct Cost",
"656-002-140": "7 - Other Direct Cost",
"656-005-140": "7 - Other Direct Cost",
"656-006-140": "7 - Other Direct Cost",
"656-007-140": "7 - Other Direct Cost",
"657-001-140": "7 - Other Direct Cost",
"698-001-999": "7 - Other Direct Cost",

"700-001-135": "8 - Subcont, Material & Equipment",
"810-017-135": "8 - Subcont, Material & Equipment",
"998-001-135": "8 - Subcont, Material & Equipment",
"998-001-235": "8 - Subcont, Material & Equipment",
"998-001-335": "8 - Subcont, Material & Equipment",
"998-002-135": "8 - Subcont, Material & Equipment",
"998-002-235": "8 - Subcont, Material & Equipment",
"998-002-335": "8 - Subcont, Material & Equipment",
"998-106-135": "8 - Subcont, Material & Equipment",
"998-106-235": "8 - Subcont, Material & Equipment",
"998-106-335": "8 - Subcont, Material & Equipment",
"998-120-135": "8 - Subcont, Material & Equipment",
"998-125-135": "8 - Subcont, Material & Equipment",
"998-125-235": "8 - Subcont, Material & Equipment",
"998-125-335": "8 - Subcont, Material & Equipment",

"645-002-135": "9 - Equipment",
"645-002-140": "9 - Equipment",

"900-001": "10 - Unallowables",
"900-002": "10 - Unallowables",
"900-003": "10 - Unallowables",
"900-004": "10 - Unallowables",
"900-005": "10 - Unallowables",
"900-006": "10 - Unallowables",
"900-007": "10 - Unallowables",
"900-008": "10 - Unallowables",
"900-009": "10 - Unallowables",
"900-010": "10 - Unallowables",
"900-011": "10 - Unallowables",
"900-012": "10 - Unallowables",
"900-013": "10 - Unallowables",
"900-014": "10 - Unallowables",
"900-015": "10 - Unallowables",
"900-016": "10 - Unallowables",
"900-017": "10 - Unallowables",
"900-018": "10 - Unallowables",
"900-019": "10 - Unallowables",
"900-020": "10 - Unallowables",
"900-021": "10 - Unallowables",
"900-022": "10 - Unallowables",
"900-023": "10 - Unallowables",
"900-024": "10 - Unallowables",
"900-025": "10 - Unallowables",
"900-026": "10 - Unallowables",
"900-027": "10 - Unallowables",
"900-028": "10 - Unallowables",
"900-041": "10 - Unallowables",
"998-001-999": "10 - Unallowables",
"998-002-999": "10 - Unallowables",

"699-001-140": "11 - Unallowable Direct - ODCs",
"699-001-199": "11 - Unallowable Direct - ODCs"
};

const getAccountType = (acctId) => {
  return ACCOUNT_TYPE_MAP[String(acctId).trim()] || "Unknown";
};

const Pricing = () => {
  const fetchLock = useRef(false);
  const [activeTab, setActiveTab] = useState("Pricing by elements");
  const [laborData, setLaborData] = useState(null);
  const [nonLaborData, setNonLaborData] = useState(null);
  const [plcMap, setPlcMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [projectLevel, setProjectLevel] = useState("All"); 
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(25);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // const rates = { fringe: 0.35, onsiteOH: 0.15, offsiteOH: 0.10, ga: 0.12, fee: 0.08 };
//   const rates = {
//   fringe: 0.35,
//   onsiteOH: 0.15,
//   offsiteOH: 0.10,
//   mh: 0.00,        // if M&H applies separately
//   ga: 0.12,
//   fee: 0.08
// };

const rates = {
  fringe: 0.2293,
  onsiteOH: 0.1692,
  offsiteOH: 0.3904,
  mh: 0.00,        // if M&H applies separately
  ga: 0.0865,
  fee: 0.07
};


const optionRates = {
  fringe: rates.fringe * 1.015,
  onsiteOH: rates.onsiteOH * 1.015,
  offsiteOH: rates.offsiteOH * 1.015,
  mh: rates.mh * 1.015,
  ga: rates.ga * 1.015,
  fee: rates.fee
};

  const formatNum = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  useEffect(() => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [lab, fore, plc, coa, psr, emp] = await Promise.all([
          fetch(`${backendUrl}/api/ForecastReport/GetLabHSData`).then(r => r.json()),
          fetch(`${backendUrl}/api/ForecastReport/GetForecastView`).then(r => r.json()),
          fetch(`${backendUrl}/Project/GetAllPlcs/`).then(r => r.json()),
          fetch(`${backendUrl}/api/ChartOfAccounts`).then(r => r.json()),
          fetch(`${backendUrl}/api/ForecastReport/GetPSRData`).then(r => r.json()),
          fetch(`${backendUrl}/api/ForecastReport/GetAllEmployee`).then(r => r.json())
        ]);
        
        // setPlcMap(plc.reduce((acc, curr) => ({ ...acc,[String(curr.laborCategoryCode).toUpperCase()]: curr.description }), {}));
        setPlcMap(
  plc.reduce((acc, curr) => ({
    ...acc,
    [String(curr.laborCategoryCode).trim().toUpperCase()]: curr.description
  }), {})
);
        setLaborData({ actuals: lab, forecast: fore, empMap: emp.reduce((acc, curr) => ({ ...acc, [curr.emplId]: curr.firstName }), {}) });
        setNonLaborData({ actuals: psr, coa: coa.reduce((acc, curr) => ({ ...acc, [curr.accountId]: curr.accountName }), {}) });
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const getTask = (id) => projectLevel === "All" ? id : id?.split(".").slice(0, parseInt(projectLevel)).join(".");

  const tableData = useMemo(() => {
    if (!laborData || !nonLaborData) return [];

    // --- PROPOSED LABOR SCREEN ---
    if (activeTab === "Proposed labor") {
      const agg = {};
      const process = (arr, isForecast) => {
        arr.forEach(i => {
          // console.log("Labor Row PLC Field:", i.plc); console.log("Full Labor Row:", i);
          if (String(i.year || i.fyCd) !== "2025") return;
          const key = `${i.projId || i.projectId}-${i.emplId || i.id}-${i.plc}`;
          const acctKey = String(i.acctId || "").trim();
          // const plcKey = String(i.plc || "").trim().toUpperCase();
          const plcKey = String(
  i.billLabCatCd  ||
  i.laborCategoryCode ||
  i.lcat ||
  i.laborCategory ||
  ""
).trim().toUpperCase();
          if (!agg[key]) agg[key] = { 
            task: getTask(i.projId || i.projectId), acctId: i.acctId || "N/A", acctName: nonLaborData.coa[String(i.acctId || "").trim()] || "Labor", org: i.orgId || "N/A", 
            type: getAccountType(i.acctId), plc: i.plc, lcat: plcMap[plcKey] || "Labor Category", emplId: i.emplId, emplName: laborData.empMap[String(i.emplId || i.id)] || "TBD",
            // emplName: laborData.empMap[i.emplId] || "TBD",
            rate: i.perHourRate , 
            // hrs: 0, monthly: Array(12).fill(0) 
            hrs: 0,
            fyAmt: 0,
            monthly: Array(12).fill(0)
          };
          const h = parseFloat(isForecast ? i.forecastedHours : i.actHrs) || 0;
          const m = (parseInt(isForecast ? i.month : i.pdNo) || 1) - 1;
          agg[key].hrs += h;
          agg[key].monthly[m] += h;
        });
      };
      process(laborData.actuals, false);
      process(laborData.forecast, true);
      return Object.values(agg).sort((a,b) => b.hrs - a.hrs);
    }

    // --- PROPOSED NON LABOR SCREEN ---
    if (activeTab === "Proposed non labor") {
      const agg = {};
      nonLaborData.actuals.filter(i => String(i.fyCd) === "2025" && i.acctType !== "LABOR").forEach(i => {
        const key = `${i.projId}-${i.acctId}`;
        if (!agg[key]) agg[key] = { lcat: "Non Labor ", name: nonLaborData.coa[i.acctId]?.accountName || i.acctName, total: 0, monthly: Array(12).fill(0) };
        const amt = parseFloat(i.subIncurAmt) || 0;
        const m = (parseInt(i.pdNo) || 1) - 1;
        agg[key].total += amt;
        agg[key].monthly[m] += amt;
      });
      return Object.values(agg).sort((a,b) => b.total - a.total);
    }

    // --- PRICING BY ELEMENT SCREEN ---
    // if (activeTab === "Pricing by elements") {
    //   const agg = {};
    //   const calcBurden = (cost, hrs) => {
    //     const fringe = cost * rates.fringe;
    //     const oOH = cost * rates.onsiteOH;
    //     const offOH = cost * rates.offsiteOH;
    //     const ga = (cost + fringe + oOH) * rates.ga;
    //     const fee = (cost + fringe + oOH + ga) * rates.fee;
    //     const price = cost + fringe + oOH + offOH + ga + fee;
    //     return { cost, hrs, fringe, oOH, offOH, ga, fee, price, rate: hrs > 0 ? price/hrs : 0 };
    //   };

    //   const processPricing = (year, field) => {
    //     nonLaborData.actuals.filter(i => String(i.fyCd || i.year) === year).forEach(i => {
    //       const task = getTask(i.projId || i.projectId);
    //       const type = i.acctType === "LABOR" ? "Labor" : "Non-Labor";
    //       // const cat = nonLaborData.coa[i.acctId]?.accountName || "Expense";
    //        const acctKey = String(i.acctId || "").trim();
    //       const cat = nonLaborData.coa[acctKey] || i.acctName || "Expense";
         
    //       const key = `${task}-${cat}`;
    //       if (!agg[key]) agg[key] = { task, type, cat, base: { cost: 0, hrs: 0 }, opt: { cost: 0, hrs: 0 } };
    //       agg[key][field].cost += parseFloat(i.subIncurAmt || 0);
    //       agg[key][field].hrs += parseFloat(i.actHrs || 0);
    //     });
    //   };
    //   processPricing("2025", "base");
    //   processPricing("2026", "opt");

    //   return Object.values(agg).map(r => ({
    //     ...r, base: calcBurden(r.base.cost, r.base.hrs), opt: calcBurden(r.opt.cost, r.opt.hrs)
    //   })).sort((a,b) => b.base.price - a.base.price);
    // }

    // --- SUMMARY TAB ---
if (activeTab === "Summary") {

  const pricingData = (() => {

    const agg = {};

    // ======================
    // BASE LABOR (2025)
    // ======================
    laborData.actuals
      .filter(i => String(i.year) === "2025")
      .forEach(i => {
        const type = getAccountType(i.acctId);
        if (!agg[type]) agg[type] = { base: 0, opt: 0 };
        agg[type].base += parseFloat(i.actualAmt || 0);
      });

    // ======================
    // OPTION LABOR (2026)
    // ======================
    laborData.forecast
      .filter(i => String(i.year || i.fyCd) === "2026")
      .forEach(i => {
        const type = getAccountType(i.acctId);
        if (!agg[type]) agg[type] = { base: 0, opt: 0 };
        agg[type].opt += parseFloat(i.forecastedAmt || 0);
      });

    // ======================
    // 🔥 ADD THIS HERE
    // ======================

    // Base Non-Labor 2025
    nonLaborData.actuals
      .filter(i => String(i.fyCd) === "2025")
      .forEach(i => {
        const type = getAccountType(i.acctId);
        if (!agg[type]) agg[type] = { base: 0, opt: 0 };
        agg[type].base += parseFloat(i.subIncurAmt || 0);
      });

    // Option Non-Labor 2026
    nonLaborData.actuals
      .filter(i => String(i.fyCd) === "2026")
      .forEach(i => {
        const type = getAccountType(i.acctId);
        if (!agg[type]) agg[type] = { base: 0, opt: 0 };
        agg[type].opt += parseFloat(i.forecastedAmt || i.subIncurAmt || 0);
      });

    // ======================
    // RETURN
    // ======================
    return agg;

  })();

  return pricingData;
}

    if (activeTab === "Pricing by elements") {

  const agg = {};

  const calcBurden = (cost, hrs) => {
    const fringe = cost * rates.fringe;
    const oOH = cost * rates.onsiteOH;
    const offOH = cost * rates.offsiteOH;

    const gaBase = cost + fringe + oOH + offOH;
    const ga = gaBase * rates.ga;

    const feeBase = gaBase + ga;
    const fee = feeBase * rates.fee;

    const price = cost + fringe + oOH + offOH + ga + fee;

    return {
      cost,
      hrs,
      fringe,
      oOH,
      offOH,
      ga,
      fee,
      price,
      rate: hrs > 0 ? price / hrs : 0
    };
  };

  /* ======================
     LABOR FROM LabHSData
  ====================== */

  laborData.actuals
    .filter(i => String(i.year) === "2025")
    .forEach(i => {

      const task = getTask(i.projId);
      const cat = plcMap[String(i.billLabCatCd || "").toUpperCase()] || "Labor";

      const key = `${task}-LABOR-${cat}`;

      if (!agg[key]) {
        agg[key] = {
          task,
          // type: "Labor",
          type: getAccountType(i.acctId),
          cat,
          base: { cost: 0, hrs: 0 },
          opt: { cost: 0, hrs: 0 }
        };
      }

      agg[key].base.cost += parseFloat(i.actualAmt || 0);
      agg[key].base.hrs += parseFloat(i.actualHours || 0);

    });

  /* ==========================
     NON-LABOR FROM PSRData
  ========================== */

  nonLaborData.actuals
    .filter(i => String(i.fyCd) === "2025" && i.acctType !== "LABOR")
    .forEach(i => {

      const task = getTask(i.projId);
      const acctKey = String(i.acctId || "").trim();
      const cat = nonLaborData.coa[acctKey] || i.acctName || "Expense";

      const key = `${task}-NONLABOR-${cat}`;

      if (!agg[key]) {
        agg[key] = {
          task,
          // type: "Non Labor",
          type: getAccountType(i.acctId),
          cat,
          base: { cost: 0, hrs: 0 },
          opt: { cost: 0, hrs: 0 }
        };
      }

      agg[key].base.cost += parseFloat(i.subIncurAmt || 0);

    });

/* ======================
   LABOR – OPTION (2026) FROM FORECAST
====================== */

laborData.forecast
  .filter(i => String(i.year || i.fyCd) === "2026")
  .forEach(i => {

    const task = getTask(i.projId || i.projectId);
    const cat = plcMap[String(i.billLabCatCd || "").toUpperCase()] || "Labor";
    const key = `${task}-LABOR-${cat}`;

    if (!agg[key]) {
      agg[key] = {
        task,
        type: "1 - Direct Labor",
        cat,
        base: { cost: 0, hrs: 0 },
        opt: { cost: 0, hrs: 0 }
      };
    }

    agg[key].opt.cost += parseFloat(i.forecastedAmt || 0);
    agg[key].opt.hrs += parseFloat(i.forecastedHours || 0);

  });
/* ==========================
   NON-LABOR – OPTION (2026)
========================== */

nonLaborData.actuals
  .filter(i => String(i.fyCd) === "2026" && getAccountType(i.acctId) !== "1 - Direct Labor")
  .forEach(i => {

    const task = getTask(i.projId);
    const acctKey = String(i.acctId || "").trim();
    const cat = nonLaborData.coa[acctKey] || i.acctName || "Expense";
    const key = `${task}-NONLABOR-${cat}`;

    if (!agg[key]) {
      agg[key] = {
        task,
        type: getAccountType(i.acctId),
        cat,
        base: { cost: 0, hrs: 0 },
        opt: { cost: 0, hrs: 0 }
      };
    }

    agg[key].opt.cost += parseFloat(i.forecastedAmt || i.subIncurAmt || 0);

  });

  return Object.values(agg).map(r => ({
    ...r,
    base: calcBurden(r.base.cost, r.base.hrs, rates),
    opt: calcBurden(r.opt.cost, r.opt.hrs, optionRates)
  }))
  .sort((a, b) => b.base.price - a.base.price);
}
  }, [activeTab, laborData, nonLaborData, projectLevel]);

  // const paginated = filteredData(tableData).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const paginated = activeTab === "Summary" ? []: filteredData(tableData).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  function filteredData(data) { return data; } // Placeholder for search filters

  // return (
  //   <div className="p-4 bg-gray-50 min-h-screen font-sans text-xs">

  return (
  <div className="p-4 bg-gray-50 min-h-screen font-sans text-xs">

    {/* {isLoading && (
      // <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-indigo-700 font-semibold text-sm">
            Loading...
          </span>
        </div>
      // </div>
    )} */}
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex gap-2">
          {/* {["Pricing by elements", "Proposed labor", "Proposed non labor"].map(t => ( */}
          {["Summary", "Pricing by elements", "Proposed labor", "Proposed non labor"].map(t => (
            <button key={t} onClick={() => {setActiveTab(t); setCurrentPage(1);}} className={`px-4 py-2 rounded-lg font-bold ${activeTab === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>{t}</button>
          ))}
        </div>
        <select value={projectLevel} onChange={(e) => setProjectLevel(e.target.value)} className="border rounded px-2 py-1">
          <option value="All">Task Level: All</option><option value="1">Level 1</option><option value="2">Level 2</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {activeTab === "Summary" && (
              <thead>
                <tr className="bg-black text-white">
                  <th className="p-2 border text-left">Account Type</th>
                  <th className="p-2 border text-right">BY 2025</th>
                  <th className="p-2 border text-right">OY_1 - 2026</th>
                </tr>
              </thead>
            )}
            {activeTab === "Proposed labor" && (
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-2 border">Task</th><th className="p-2 border">Acct ID</th><th className="p-2 border">Acct Name</th>
                  <th className="p-2 border">Org</th><th className="p-2 border">Type</th><th className="p-2 border">PLC</th>
                  <th className="p-2 border">LCAT</th><th className="p-2 border">EMP ID</th><th className="p-2 border">Name</th>
                  <th className="p-2 border">Rate</th><th className="p-2 border">FY Hrs</th><th className="p-2 border">FY Amt</th>
                  {months.map(m => <th key={m} className="p-2 border">{m}</th>)}
                </tr>
              </thead>
            )}
            {activeTab === "Proposed non labor" && (
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-2 border text-left">LCAT Name</th><th className="p-2 border text-left">Name</th>
                  <th className="p-2 border text-right">FY Total Amt</th>
                  {months.map(m => <th key={m} className="p-2 border">{m}</th>)}
                </tr>
              </thead>
            )}
            {activeTab === "Pricing by elements" && (
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th colSpan={3} className="p-2 border">Item</th>
                  <th colSpan={10} className="p-2 border bg-indigo-900">Base Year</th>
                  <th colSpan={10} className="p-2 border bg-emerald-900">Option Year</th>
                </tr>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="p-2 border">Task</th><th className="p-2 border">Acct Type</th><th className="p-2 border">Category</th>
                  {/* Base & Opt repeated headers */}
                  {[1, 2].map(i => (
                    <React.Fragment key={i}>
                      <th className="p-1 border">Hrs</th><th className="p-1 border">Unburdened</th><th className="p-1 border">Fringe</th>
                      <th className="p-1 border">OnOH</th><th className="p-1 border">OffOH</th><th className="p-1 border">M&H</th>
                      <th className="p-1 border">G&A</th><th className="p-1 border">Fees</th><th className="p-1 border">Price</th><th className="p-1 border">Rate</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
            )}  
            <tbody className="divide-y text-[11px]">

  {/* ================= SUMMARY TAB ================= */}
  {isLoading ? (
    <tr>
      <td colSpan={16} className="p-4 text-center text-gray-500">
         <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-indigo-700 font-semibold text-sm">
            Loading...
          </span>
        </div>
        {/* Loading summary data... */}
      </td>
    </tr>
  ) :
  activeTab === "Summary" &&
    // Object.entries(tableData).map(([type, val]) => (
      Object.entries(tableData)
  .sort(([a], [b]) => {
    const numA = parseInt(a.split(" - ")[0], 10);
    const numB = parseInt(b.split(" - ")[0], 10);
    return numA - numB;
  })
  .map(([type, val]) => (
      
      <tr key={type} className="hover:bg-gray-50">
        <td className="p-2 border font-bold">{type}</td>
        <td className="p-2 border text-right font-semibold">
          ${formatNum(val.base)}
        </td>
        <td className="p-2 border text-right font-semibold">
          ${formatNum(val.opt)}
        </td>
      </tr>
    ))
  }

  {/* ================= PRICING BURDEN % ROW ================= */}
  {activeTab === "Pricing by elements" && (
    <tr className="bg-yellow-50 font-semibold text-xs">
      <td className="p-1 border" colSpan={3}>Burden %</td>

      {/* BASE */}
      <td className="p-1 border text-center">-</td>
      <td className="p-1 border text-center">-</td>
      <td className="p-1 border text-center">{(rates.fringe * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(rates.onsiteOH * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(rates.offsiteOH * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(rates.mh * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(rates.ga * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(rates.fee * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">-</td>
      <td className="p-1 border text-center">-</td>

      {/* OPTION */}
      <td className="p-1 border text-center">-</td>
      <td className="p-1 border text-center">-</td>
      <td className="p-1 border text-center">{(optionRates.fringe * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(optionRates.onsiteOH * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(optionRates.offsiteOH * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(optionRates.mh * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(optionRates.ga * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">{(optionRates.fee * 100).toFixed(2)}%</td>
      <td className="p-1 border text-center">-</td>
      <td className="p-1 border text-center">-</td>
    </tr>
  )}

  {/* ================= ALL OTHER DATA ROWS ================= */}
  {activeTab !== "Summary" &&
    paginated.map((r, idx) => (
      <tr key={idx} className="hover:bg-gray-50">

        {activeTab === "Proposed labor" && (
          <>
            <td className="p-2 border">{r.task}</td>
            <td className="p-2 border">{r.acctId}</td>
            <td className="p-2 border font-bold">{r.acctName}</td>
            <td className="p-2 border">{r.org}</td>
            <td className="p-2 border">{r.type}</td>
            <td className="p-2 border">{r.plc}</td>
            <td className="p-2 border">{r.lcat}</td>
            <td className="p-2 border">{r.emplId}</td>
            <td className="p-2 border">{r.emplName}</td>
            <td className="p-2 border text-right">${r.rate}</td>
            <td className="p-2 border text-right font-bold">{formatNum(r.hrs)}</td>
            <td className="p-2 border text-right font-bold">
              ${formatNum(r.hrs * r.rate)}
            </td>
            {r.monthly.map((m, i) => (
              <td key={i} className="p-2 border text-right">
                {m > 0 ? formatNum(m) : "-"}
              </td>
            ))}
          </>
        )}

        {activeTab === "Proposed non labor" && (
          <>
            <td className="p-2 border italic text-gray-500">{r.lcat}</td>
            <td className="p-2 border font-bold">{r.name}</td>
            <td className="p-2 border text-right font-bold text-indigo-600">
              ${formatNum(r.total)}
            </td>
            {r.monthly.map((m, i) => (
              <td key={i} className="p-2 border text-right">
                {m > 0 ? formatNum(m) : "-"}
              </td>
            ))}
          </>
        )}

        {activeTab === "Pricing by elements" && (
          <>
            <td className="p-2 border font-bold">{r.task}</td>
            <td className="p-2 border">{r.type}</td>
            <td className="p-2 border">{r.cat}</td>
            {[r.base, r.opt].map((y, i) => (
              <React.Fragment key={i}>
                <td className="p-1 border text-right">
                  {y.hrs > 0 ? formatNum(y.hrs) : "-"}
                </td>
                <td className="p-1 border text-right">${formatNum(y.cost)}</td>
                <td className="p-1 border text-right">${formatNum(y.fringe)}</td>
                <td className="p-1 border text-right">${formatNum(y.oOH)}</td>
                <td className="p-1 border text-right">${formatNum(y.offOH)}</td>
                <td className="p-1 border text-right">${formatNum(0)}</td>
                <td className="p-1 border text-right">${formatNum(y.ga)}</td>
                <td className="p-1 border text-right">${formatNum(y.fee)}</td>
                <td className="p-1 border text-right font-bold">
                  ${formatNum(y.price)}
                </td>
                <td className="p-1 border text-right text-blue-600">
                  ${formatNum(y.rate)}
                </td>
              </React.Fragment>
            ))}
          </>
        )}

      </tr>
    ))
  }

</tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-100 flex justify-between items-center">
          {/* <span className="text-gray-500">Showing {paginated.length} of {tableData.length} entries</span> */}
          <span className="text-gray-500">
            {activeTab === "Summary"
              ? `Showing ${Object.keys(tableData).length} account types`
              : `Showing ${paginated.length} of ${tableData.length} entries`}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-2 border rounded bg-white"><ChevronLeft size={16}/></button>
            <span className="p-2 font-bold text-indigo-600">Page {currentPage}</span>
            <button onClick={() => setCurrentPage(p => p + 1)} className="p-2 border rounded bg-white"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;