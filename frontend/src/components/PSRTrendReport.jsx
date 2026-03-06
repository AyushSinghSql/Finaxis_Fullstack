

// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import axios from 'axios';
// import { backendUrl } from "./config";
// import { 
//   FaPlay, FaLayerGroup, FaInfoCircle, FaCheckCircle, 
//   FaTimesCircle, FaSitemap, FaChevronDown, FaChevronUp,
//   FaSearch, FaCheckSquare, FaSquare
// } from 'react-icons/fa';

// const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
// const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
// const PROJECTS_API_PATH = "/Project/GetAllProjects";

// const PSRTrendReport = () => {
//   const [masterProjects, setMasterProjects] = useState([]);
//   const [masterActuals, setMasterActuals] = useState([]);
//   const [masterForecasts, setMasterForecasts] = useState([]);
  
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedTopLevelId, setSelectedTopLevelId] = useState("");
//   const [depthLevel, setDepthLevel] = useState("1");
//   const [fiscalYear, setFiscalYear] = useState("2025");
//   const [showDropdown, setShowDropdown] = useState(false);
  
//   const [loading, setLoading] = useState(false);
//   const [hasRun, setHasRun] = useState(false);

//   // Inner Project List States
//   const [selectedPeers, setSelectedPeers] = useState([]); 
//   const [isPeersExpanded, setIsPeersExpanded] = useState(false);
//   const [innerSearch, setInnerSearch] = useState("");

//   const monthsMap = [
//     { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
//     { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
//     { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
//     { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
//   ];

//   const handleRunReport = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [projRes, actualsRes, forecastRes] = await Promise.all([
//         axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
//         axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
//         axios.get(`${backendUrl}${FORECAST_API_PATH}`)
//       ]);
//       setMasterProjects(Array.isArray(projRes.data) ? projRes.data : []);
//       setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
//       setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);
//       setHasRun(true);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // --- DYNAMIC LEVEL CALCULATION ---
//   // Calculates max depth based on the selected root project family
//   const availableLevels = useMemo(() => {
//     if (!selectedTopLevelId || masterProjects.length === 0) return [1];
//     const subProjects = masterProjects.filter(p => 
//       p.projectId.toString().startsWith(selectedTopLevelId.trim())
//     );
//     const maxDepth = Math.max(...subProjects.map(p => p.projectId.split('.').length), 1);
//     return Array.from({ length: maxDepth }, (_, i) => i + 1);
//   }, [selectedTopLevelId, masterProjects]);

//   // --- PEER DISCOVERY ---
//   // Finds projects matching the selected depth within the root family
//   const potentialPeers = useMemo(() => {
//     if (!hasRun || !selectedTopLevelId) return [];
//     return [...new Set(masterProjects.filter(p => {
//       const cleanId = p.projectId.toString().trim();
//       return cleanId.startsWith(selectedTopLevelId.trim()) && 
//              cleanId.split('.').length === parseInt(depthLevel);
//     }).map(p => p.projectId))].sort();
//   }, [hasRun, selectedTopLevelId, depthLevel, masterProjects]);

//   useEffect(() => {
//     setSelectedPeers(potentialPeers);
//   }, [potentialPeers]);

//   const filteredPeers = potentialPeers.filter(id => 
//     id.toLowerCase().includes(innerSearch.toLowerCase())
//   );

//   // --- DATA AGGREGATION (ROLL-UP LOGIC) ---
//   // Aggregates data for selected projects and all their descendants
//   const reportData = useMemo(() => {
//     if (!hasRun || selectedPeers.length === 0) return null;

//     const isWithinRollup = (recordProjId) => {
//       const cleanRecordId = recordProjId?.toString().trim();
//       return selectedPeers.some(peerId => 
//         cleanRecordId === peerId || cleanRecordId.startsWith(peerId + ".")
//       );
//     };

//     const processed = {};
//     monthsMap.forEach((m) => {
//       const monthlyActuals = masterActuals.filter(d => 
//         isWithinRollup(d?.projId) && 
//         d?.fyCd?.toString() === fiscalYear.toString() && 
//         parseInt(d.pdNo) === m.id
//       );
//       const monthlyForecasts = masterForecasts.filter(d => 
//         isWithinRollup(d?.projId) && 
//         d?.year?.toString() === fiscalYear.toString() && 
//         parseInt(d.month) === m.id
//       );

//       // Using subIncurAmt for Actuals as requested
//       const getSum = (items, typeNo) => items
//         .filter(item => parseInt(item.subTotTypeNo) === typeNo)
//         .reduce((acc, curr) => acc + (Number(curr.subIncurAmt) || 0), 0);

//       const rev = monthlyActuals.length > 0 ? getSum(monthlyActuals, 1) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
//       const labor = monthlyActuals.length > 0 ? getSum(monthlyActuals, 2) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
//       const odc = monthlyActuals.length > 0 ? getSum(monthlyActuals, 3) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
//       const ind = monthlyActuals.length > 0 ? getSum(monthlyActuals, 4) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);
      
//       const restAmt = monthlyActuals.filter(item => parseInt(item.subTotTypeNo) !== 1).reduce((acc, curr) => acc + (Number(curr.subIncurAmt) || 0), 0);

//       processed[m.name] = { 
//         rev, labor, odc, ind, 
//         netProfitActual: rev - restAmt, 
//         dataType: monthlyActuals.length > 0 ? "Actual" : "Forecast" 
//       };
//     });
//     return processed;
//   }, [hasRun, selectedPeers, fiscalYear, masterActuals, masterForecasts]);

//   // --- UI MAPPING ---
//   const monthNames = monthsMap.map(m => m.name);
//   const revenue = monthNames.map(m => reportData?.[m]?.rev || 0);
//   const labor = monthNames.map(m => reportData?.[m]?.labor || 0);
//   const odc = monthNames.map(m => reportData?.[m]?.odc || 0);
//   const indirect = monthNames.map(m => reportData?.[m]?.ind || 0);
//   const directCost = labor.map((val, i) => val + odc[i]);
//   const grossProfit = revenue.map((val, i) => val - directCost[i]);
//   const netProfit = monthNames.map((m, i) => 
//     reportData?.[m]?.dataType === "Actual" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
//   );

//   return (
//     <div className="w-full overflow-hidden p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
//       <style>{`
//         .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 1rem; border: 1px solid #e2e8f0; }
//         .psr-table { table-layout: fixed; width: max-content; border-spacing: 0; }
//         .sticky-col { position: sticky; left: 0; z-index: 20; width: 250px; background: white; border-right: 2px solid #f1f5f9 !important; padding: 1rem; }
//         .month-cell { width: 120px; text-align: right; padding: 1rem; border-right: 1px solid #f1f5f9; }
//         .total-cell { width: 150px; text-align: right; padding: 1rem; background: #f8fafc; font-weight: 900; }
//         .header-cell { background: #1e293b; color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
//         .inner-peer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
//       `}</style>

//       {/* Action Header */}
//       <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
//         <h1 className="text-2xl font-black text-slate-900 tracking-tight">PSR Trend</h1>
//         <button onClick={handleRunReport} disabled={loading} className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
//           {loading ? "SYNCING..." : "RUN ANALYSIS REPORT"}
//         </button>
//       </div>

//       {/* Control Panel */}
//       <div className="grid grid-cols-1 md:grid-cols-6 gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
//         <div className="md:col-span-3 relative">
//           <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Top Level Project</label>
//           <input 
//             type="text" 
//             value={searchTerm} 
//             disabled={!hasRun} 
//             onChange={(e) => {setSearchTerm(e.target.value); setShowDropdown(true);}} 
//             className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-400 font-bold" 
//             placeholder="Search root..."
//           />
//           {showDropdown && (
//             <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-100 shadow-2xl rounded-2xl p-2">
//               {masterProjects.filter(p => p.projectId.split('.').length === 1 && p.projectId.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
//                 <div key={p.projectId} onClick={() => {setSelectedTopLevelId(p.projectId); setSearchTerm(`${p.projectId} - ${p.name}`); setShowDropdown(false);}} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl font-bold text-slate-700">
//                   {p.projectId} — <span className="text-slate-400 font-medium ml-2">{p.name}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//         <div className="md:col-span-1">
//           <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Project Level</label>
//           <select value={depthLevel} onChange={(e) => setDepthLevel(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
//             {availableLevels.map(lvl => <option key={lvl} value={lvl}>Level {lvl}</option>)}
//           </select>
//         </div>
//         <div className="md:col-span-2">
//           <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Fiscal Year</label>
//           <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
//             {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
//           </select>
//         </div>
//       </div>

//       {hasRun && potentialPeers.length > 0 ? (
//         <div className="table-container shadow-2xl overflow-hidden">
//           {/* INNER PROJECT CONTROLS */}
//           <div className="p-5 bg-white border-b border-slate-50">
//              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
//                 <div className="flex items-center gap-3">
//                   <FaSitemap className="text-blue-500" />
//                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                     Hierarchy Depth: L-{depthLevel} ({selectedPeers.length}/{potentialPeers.length})
//                   </span>
//                 </div>
                
//                 <div className="flex items-center gap-4">
//                   <div className="relative">
//                     <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
//                     <input 
//                       type="text" 
//                       placeholder="Search inner list..." 
//                       value={innerSearch}
//                       onChange={(e) => setInnerSearch(e.target.value)}
//                       className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400 w-48"
//                     />
//                   </div>
//                   <button 
//                     onClick={() => setSelectedPeers(selectedPeers.length === potentialPeers.length ? [] : potentialPeers)}
//                     className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:text-blue-800"
//                   >
//                     {selectedPeers.length === potentialPeers.length ? <><FaSquare className="text-slate-200"/> Deselect All</> : <><FaCheckSquare /> Select All</>}
//                   </button>
//                   {potentialPeers.length > 12 && (
//                     <button onClick={() => setIsPeersExpanded(!isPeersExpanded)} className="text-[10px] font-black text-slate-400 uppercase">
//                       {isPeersExpanded ? <FaChevronUp /> : <FaChevronDown />}
//                     </button>
//                   )}
//                 </div>
//              </div>
             
//              <div className={`inner-peer-grid transition-all duration-300 overflow-hidden ${!isPeersExpanded ? 'max-h-24' : ''}`}>
//                 {filteredPeers.map(id => (
//                   <div 
//                     key={id} 
//                     onClick={() => setSelectedPeers(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])}
//                     className={`flex items-center gap-3 p-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${selectedPeers.includes(id) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
//                   >
//                     {selectedPeers.includes(id) ? <FaCheckCircle className="text-blue-500"/> : <FaTimesCircle className="text-slate-200"/>}
//                     {id}
//                   </div>
//                 ))}
//              </div>
//           </div>

//           <div className="overflow-x-auto">
//             {selectedPeers.length > 0 ? (
//               <table className="psr-table border-collapse">
//                 <thead>
//                   <tr>
//                     <th className="sticky-col header-cell text-left border-r border-slate-700">Financial Items</th>
//                     {monthsMap.map(m => (
//                       <th key={m.id} className="month-cell header-cell text-center border-r border-slate-700">
//                         {m.name} <span className="block text-[8px] opacity-60 mt-1 font-medium">{reportData?.[m.name]?.dataType}</span>
//                       </th>
//                     ))}
//                     <th className="total-cell header-cell text-center bg-slate-900 text-white">Annual Total</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   <Row label="Contract Revenue" values={revenue} />
//                   <Row label="Direct Labor" values={labor} />
//                   <Row label="ODCs (Direct)" values={odc} />
//                   <Row label="Total Direct Costs" values={directCost} isBold bg="bg-slate-50/50" />
//                   <Row label="Gross Profit" values={grossProfit} isBold />
//                   <Row label="Indirect Burdens" values={indirect} />
//                   <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50/40" color="text-blue-700" />
//                 </tbody>
//               </table>
//             ) : (
//               <div className="p-20 text-center text-slate-400 font-bold italic">Select projects to view data.</div>
//             )}
//           </div>
//         </div>
//       ) : !hasRun && (
//         <div className="flex flex-col items-center justify-center p-32 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-inner">
//           <FaLayerGroup className="text-slate-100 w-16 h-16 mb-6" />
//           <p className="text-slate-400 font-black text-s uppercase tracking-normal">Sumaria Systems, LLC</p>
//         </div>
//       )}
//     </div>
//   );
// };

// // --- DATA ROW COMPONENT ---
// const Row = ({ label, values, isBold, bg, color }) => {
//   const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
//   return (
//     <tr className={`${bg || ''} hover:bg-slate-50 transition-colors ${isBold ? `font-black ${color || 'text-slate-900'}` : 'text-slate-500 font-medium'}`}>
//       <td className={`sticky-col text-[12px] border-r border-slate-100 ${bg || 'bg-white'}`}>{label}</td>
//       {values.map((v, i) => (
//         <td key={i} className="month-cell tabular-nums text-[12px]">
//           {/* Updated to show 2 decimal points as requested */}
//           {v === 0 ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//         </td>
//       ))}
//       <td className={`total-cell tabular-nums text-[13px] ${isBold ? (color || 'text-slate-900') : 'text-slate-800'}`}>
//         {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//       </td>
//     </tr>
//   );
// };

// export default PSRTrendReport;

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from "./config";
import { 
  FaPlay, FaLayerGroup, FaCheckCircle, 
  FaTimesCircle, FaSitemap, FaChevronDown, FaChevronUp,
  FaSearch, FaCheckSquare, FaSquare, FaFileExcel, FaFilePdf, FaFilePowerpoint
} from 'react-icons/fa';

// Export Libraries
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import pptxgen from "pptxgenjs";

const PSR_DETAIL_API_PATH = "/api/ForecastReport/GetViewData";
const FORECAST_API_PATH = "/api/ForecastReport/GetForecastView";
const PROJECTS_API_PATH = "/Project/GetAllProjects";

const PSRTrendReport = () => {
  const [masterProjects, setMasterProjects] = useState([]);
  const [masterActuals, setMasterActuals] = useState([]);
  const [masterForecasts, setMasterForecasts] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopLevelId, setSelectedTopLevelId] = useState("");
  const [depthLevel, setDepthLevel] = useState("1");
  const [fiscalYear, setFiscalYear] = useState("2025");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const [selectedPeers, setSelectedPeers] = useState([]); 
  const [isPeersExpanded, setIsPeersExpanded] = useState(false);
  const [innerSearch, setInnerSearch] = useState("");

  const monthsMap = [
    { id: 1, name: "Jan" }, { id: 2, name: "Feb" }, { id: 3, name: "Mar" },
    { id: 4, name: "Apr" }, { id: 5, name: "May" }, { id: 6, name: "Jun" },
    { id: 7, name: "Jul" }, { id: 8, name: "Aug" }, { id: 9, name: "Sep" },
    { id: 10, name: "Oct" }, { id: 11, name: "Nov" }, { id: 12, name: "Dec" }
  ];

  const handleRunReport = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, actualsRes, forecastRes] = await Promise.all([
        axios.get(`${backendUrl}${PROJECTS_API_PATH}`),
        axios.get(`${backendUrl}${PSR_DETAIL_API_PATH}`),
        axios.get(`${backendUrl}${FORECAST_API_PATH}`)
      ]);
      setMasterProjects(Array.isArray(projRes.data) ? projRes.data : []);
      setMasterActuals(Array.isArray(actualsRes.data) ? actualsRes.data : []);
      setMasterForecasts(Array.isArray(forecastRes.data) ? forecastRes.data : []);
      setHasRun(true);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const availableLevels = useMemo(() => {
    if (!selectedTopLevelId || masterProjects.length === 0) return [1];
    const subProjects = masterProjects.filter(p => 
      p.projectId.toString().startsWith(selectedTopLevelId.trim())
    );
    const maxDepth = Math.max(...subProjects.map(p => p.projectId.split('.').length), 1);
    return Array.from({ length: maxDepth }, (_, i) => i + 1);
  }, [selectedTopLevelId, masterProjects]);

  const potentialPeers = useMemo(() => {
    if (!hasRun || !selectedTopLevelId) return [];
    return [...new Set(masterProjects.filter(p => {
      const cleanId = p.projectId.toString().trim();
      return cleanId.startsWith(selectedTopLevelId.trim()) && 
             cleanId.split('.').length === parseInt(depthLevel);
    }).map(p => p.projectId))].sort();
  }, [hasRun, selectedTopLevelId, depthLevel, masterProjects]);

  useEffect(() => {
    setSelectedPeers(potentialPeers);
  }, [potentialPeers]);

  const filteredPeers = potentialPeers.filter(id => 
    id.toLowerCase().includes(innerSearch.toLowerCase())
  );

  const reportData = useMemo(() => {
    if (!hasRun || selectedPeers.length === 0) return null;

    const isWithinRollup = (recordProjId) => {
      const cleanRecordId = recordProjId?.toString().trim();
      return selectedPeers.some(peerId => 
        cleanRecordId === peerId || cleanRecordId.startsWith(peerId + ".")
      );
    };

    const processed = {};
    monthsMap.forEach((m) => {
      const monthlyActuals = masterActuals.filter(d => 
        isWithinRollup(d?.projId) && 
        d?.fyCd?.toString() === fiscalYear.toString() && 
        parseInt(d.pdNo) === m.id
      );
      const monthlyForecasts = masterForecasts.filter(d => 
        isWithinRollup(d?.projId) && 
        d?.year?.toString() === fiscalYear.toString() && 
        parseInt(d.month) === m.id
      );

      const getSum = (items, typeNo) => items
        .filter(item => parseInt(item.subTotTypeNo) === typeNo)
        .reduce((acc, curr) => acc + (Number(curr.subIncurAmt) || 0), 0);

      const rev = monthlyActuals.length > 0 ? getSum(monthlyActuals, 1) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
      const labor = monthlyActuals.length > 0 ? getSum(monthlyActuals, 2) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
      const odc = monthlyActuals.length > 0 ? getSum(monthlyActuals, 3) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.actualAmt) || 0), 0);
      const ind = monthlyActuals.length > 0 ? getSum(monthlyActuals, 4) : monthlyForecasts.reduce((acc, curr) => acc + (Number(curr.overhead) || 0), 0);
      const restAmt = monthlyActuals.filter(item => parseInt(item.subTotTypeNo) !== 1).reduce((acc, curr) => acc + (Number(curr.subIncurAmt) || 0), 0);

      processed[m.name] = { 
        rev, labor, odc, ind, 
        netProfitActual: rev - restAmt, 
        dataType: monthlyActuals.length > 0 ? "Actual" : "Forecast" 
      };
    });
    return processed;
  }, [hasRun, selectedPeers, fiscalYear, masterActuals, masterForecasts]);

  const monthNames = monthsMap.map(m => m.name);
  const revenue = monthNames.map(m => reportData?.[m]?.rev || 0);
  const labor = monthNames.map(m => reportData?.[m]?.labor || 0);
  const odc = monthNames.map(m => reportData?.[m]?.odc || 0);
  const indirect = monthNames.map(m => reportData?.[m]?.ind || 0);
  const directCost = labor.map((val, i) => val + odc[i]);
  const grossProfit = revenue.map((val, i) => val - directCost[i]);
  const netProfit = monthNames.map((m, i) => 
    reportData?.[m]?.dataType === "Actual" ? reportData[m].netProfitActual : (revenue[i] - (labor[i] + odc[i] + indirect[i]))
  );

  // --- EXPORT LOGIC ---

  const prepareExportData = (forExcel = false) => {
    const formatter = (val) => forExcel ? Number(val.toFixed(2)) : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    return [
      ["Financial Items", ...monthNames, "Annual Total"],
      ["Contract Revenue", ...revenue.map(v => formatter(v)), formatter(revenue.reduce((a,b)=>a+b, 0))],
      ["Direct Labor", ...labor.map(v => formatter(v)), formatter(labor.reduce((a,b)=>a+b, 0))],
      ["ODCs (Direct)", ...odc.map(v => formatter(v)), formatter(odc.reduce((a,b)=>a+b, 0))],
      ["Total Direct Costs", ...directCost.map(v => formatter(v)), formatter(directCost.reduce((a,b)=>a+b, 0))],
      ["Gross Profit", ...grossProfit.map(v => formatter(v)), formatter(grossProfit.reduce((a,b)=>a+b, 0))],
      ["Indirect Burdens", ...indirect.map(v => formatter(v)), formatter(indirect.reduce((a,b)=>a+b, 0))],
      ["Net Profit / Fee", ...netProfit.map(v => formatter(v)), formatter(netProfit.reduce((a,b)=>a+b, 0))]
    ];
  };

  const exportExcel = () => {
    const data = prepareExportData(true);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PSR Trend");
    XLSX.writeFile(wb, `PSR_Trend_${fiscalYear}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(14);
    doc.text(`PSR Trend Analysis - FY ${fiscalYear}`, 14, 12);
    
    autoTable(doc, {
      head: [["Financial Items", ...monthNames, "Total"]],
      body: prepareExportData().slice(1),
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 7 }, // Reduced font size
      columnStyles: { 
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 38 } // Highlight first column, fixed width
      },
      styles: { fontSize: 6.5, cellPadding: 2, overflow: 'linebreak' }, // Reduced from 8 to 6.5
    });
    doc.save(`PSR_Trend_${fiscalYear}.pdf`);
  };

  const exportPPT = () => {
    let pres = new pptxgen();
    let slide = pres.addSlide();
    slide.addText(`PSR Trend Report ${fiscalYear}`, { x: 0.5, y: 0.3, fontSize: 18, bold: true, color: "3B82F6" });
    
    const rawData = prepareExportData();
    const tableData = rawData.map((row, index) => {
        return row.map((cell, colIndex) => {
            return {
                text: cell,
                options: {
                    bold: index === 0 || colIndex === 0, 
                    fill: index === 0 ? "3B82F6" : (colIndex === 0 ? "F1F5F9" : "FFFFFF"),
                    color: index === 0 ? "FFFFFF" : "000000",
                    fontSize: 6 // Reduced from 8 to 6
                }
            };
        });
    });

    slide.addTable(tableData, { x: 0.2, y: 0.8, w: 9.6, border: { pt: 0.5, color: "E2E8F0" } });
    pres.writeFile({ fileName: `PSR_Trend_${fiscalYear}.pptx` });
  };

  return (
    <div className="w-full overflow-hidden p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans">
      <style>{`
        .table-container { width: 100%; overflow-x: auto; background: white; border-radius: 1rem; border: 1px solid #e2e8f0; }
        .psr-table { table-layout: fixed; width: max-content; border-spacing: 0; }
        .sticky-col { position: sticky; left: 0; z-index: 20; width: 250px; background: white; border-right: 2px solid #f1f5f9 !important; padding: 1rem; }
        .month-cell { width: 120px; text-align: right; padding: 1rem; border-right: 1px solid #f1f5f9; }
        .total-cell { width: 150px; text-align: right; padding: 1rem; background: #f8fafc; font-weight: 900; }
        .header-cell { background: #1e293b; color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .btn-blue { 
          background: #3b82f6; 
          color: white; 
          border: none; 
          padding: 0.85rem 1.5rem; 
          border-radius: 0.75rem; 
          font-weight: 900; 
          font-size: 0.75rem; 
          letter-spacing: 0.1em; 
          transition: all 0.2s; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          gap: 8px; 
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .btn-blue:hover { background: #2563eb; transform: translateY(-2px); }
        .btn-blue:active { transform: scale(0.95); }
        .btn-blue:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
      `}</style>

      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">PSR Trend</h1>
        <div className="flex gap-3">
          <button onClick={handleRunReport} disabled={loading} className="btn-blue px-8">
            <FaPlay className="text-[10px]" /> {loading ? "SYNCING..." : "RUN REPORT"}
          </button>
          <button onClick={exportExcel} disabled={!hasRun} className="btn-blue">
            <FaFileExcel /> EXPORT EXCEL
          </button>
          <button onClick={exportPPT} disabled={!hasRun} className="btn-blue">
            <FaFilePowerpoint /> EXPORT PPT
          </button>
          <button onClick={exportPDF} disabled={!hasRun} className="btn-blue">
            <FaFilePdf /> EXPORT PDF
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="md:col-span-3 relative">
          <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Top Level Project</label>
          <input 
            type="text" 
            value={searchTerm} 
            disabled={!hasRun} 
            onChange={(e) => {setSearchTerm(e.target.value); setShowDropdown(true);}} 
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-400 font-bold" 
            placeholder="Search root..."
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-slate-100 shadow-2xl rounded-2xl p-2">
              {masterProjects.filter(p => p.projectId.split('.').length === 1 && p.projectId.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <div key={p.projectId} onClick={() => {setSelectedTopLevelId(p.projectId); setSearchTerm(`${p.projectId} - ${p.name}`); setShowDropdown(false);}} className="p-4 hover:bg-slate-50 cursor-pointer rounded-xl font-bold text-slate-700">
                  {p.projectId} — <span className="text-slate-400 font-medium ml-2">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Project Level</label>
          <select value={depthLevel} onChange={(e) => setDepthLevel(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
            {availableLevels.map(lvl => <option key={lvl} value={lvl}>Level {lvl}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Fiscal Year</label>
          <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-xl font-black outline-none cursor-pointer">
            {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {hasRun && potentialPeers.length > 0 ? (
        <div className="table-container shadow-2xl overflow-hidden">
          <div className="p-5 bg-white border-b border-slate-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <FaSitemap className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Hierarchy Depth: L-{depthLevel} ({selectedPeers.length}/{potentialPeers.length})
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs" />
                    <input 
                      type="text" 
                      placeholder="Search inner list..." 
                      value={innerSearch}
                      onChange={(e) => setInnerSearch(e.target.value)}
                      className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400 w-48"
                    />
                  </div>
                  <button 
                    onClick={() => setSelectedPeers(selectedPeers.length === potentialPeers.length ? [] : potentialPeers)}
                    className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:text-blue-800"
                  >
                    {selectedPeers.length === potentialPeers.length ? <><FaSquare className="text-slate-200"/> Deselect All</> : <><FaCheckSquare /> Select All</>}
                  </button>
                  {potentialPeers.length > 12 && (
                    <button onClick={() => setIsPeersExpanded(!isPeersExpanded)} className="text-[10px] font-black text-slate-400 uppercase">
                      {isPeersExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 transition-all duration-300 overflow-hidden ${!isPeersExpanded ? 'max-h-24' : ''}`}>
                {filteredPeers.map(id => (
                  <div 
                    key={id} 
                    onClick={() => setSelectedPeers(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${selectedPeers.includes(id) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    {selectedPeers.includes(id) ? <FaCheckCircle className="text-blue-500"/> : <FaTimesCircle className="text-slate-200"/>}
                    {id}
                  </div>
                ))}
              </div>
          </div>

          <div className="overflow-x-auto">
            {selectedPeers.length > 0 ? (
              <table className="psr-table border-collapse">
                <thead>
                  <tr>
                    <th className="sticky-col header-cell text-left border-r border-slate-700">Financial Items</th>
                    {monthsMap.map(m => (
                      <th key={m.id} className="month-cell header-cell text-center border-r border-slate-700">
                        {m.name} <span className="block text-[8px] opacity-60 mt-1 font-medium">{reportData?.[m.name]?.dataType}</span>
                      </th>
                    ))}
                    <th className="total-cell header-cell text-center bg-slate-900 text-white">Annual Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <Row label="Contract Revenue" values={revenue} />
                  <Row label="Direct Labor" values={labor} />
                  <Row label="ODCs (Direct)" values={odc} />
                  <Row label="Total Direct Costs" values={directCost} isBold bg="bg-slate-50/50" />
                  <Row label="Gross Profit" values={grossProfit} isBold />
                  <Row label="Indirect Burdens" values={indirect} />
                  <Row label="Net Profit / Fee" values={netProfit} isBold bg="bg-blue-50/40" color="text-blue-700" />
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center text-slate-400 font-bold italic">Select projects to view data.</div>
            )}
          </div>
        </div>
      ) : !hasRun && (
        <div className="flex flex-col items-center justify-center p-32 bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-inner">
          <FaLayerGroup className="text-slate-100 w-16 h-16 mb-6" />
          <p className="text-slate-400 font-black text-s tracking-normal">Science Systems & Applications, Inc.</p>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, values, isBold, bg, color }) => {
  const total = values.reduce((a, b) => a + (Number(b) || 0), 0);
  return (
    <tr className={`${bg || ''} hover:bg-slate-50 transition-colors ${isBold ? `font-black ${color || 'text-slate-900'}` : 'text-slate-500 font-medium'}`}>
      <td className={`sticky-col text-[12px] border-r border-slate-100 ${bg || 'bg-white'}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className="month-cell tabular-nums text-[12px]">
          {v === 0 ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      ))}
      <td className={`total-cell tabular-nums text-[13px] ${isBold ? (color || 'text-slate-900') : 'text-slate-800'}`}>
        {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  );
};

export default PSRTrendReport;