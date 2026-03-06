// import React, { useState, useEffect } from "react";
// import Select from "react-select";
// import { backendUrl } from "./config";


// const AnalogRate = () => {
//   // projectInput (free-text) removed — selection should come only from API-provided dropdown
//   const [selectedProjectId, setSelectedProjectId] = useState("");
//   const [activeTab, setActiveTab] = useState("Burden Cost Ceiling Details");
//   const [isSearched, setIsSearched] = useState(false);
//   const [availableProjects, setAvailableProjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   // const [nbiRateRows,setNbiRateRows] = useState([]);


// const nbiRateRows = [
//   {
//     accountType: "1 - Total Revenue (REVENUE)",
//     actual: "74,462,470.14",
//     rates: ["", "", "", "", "", ""],
//   },
//   {
//     accountType: "2 - Sumaria Labor Onsite (LABOR)",
//     actual: "32,886,490.18",
//     rates: ["44.17%", "44.17%", "44.17%", "44.17%", "44.17%", "44.17%"],
//   },
//   {
//     accountType: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)",
//     actual: "112.92",
//     rates: ["0.00%", "0.00%", "0.00%", "0.00%", "0.00%", "0.00%"],
//   },
//   {
//     accountType: "5 - Sumaria Travel (NON-LABOR)",
//     actual: "1,350,732.10",
//     rates: ["1.81%", "1.81%", "1.81%", "1.81%", "1.81%", "1.81%"],
//   },
//   {
//     accountType: "6 - Subcontractors (LABOR)",
//     actual: "14,850,167.76",
//     rates: ["19.94%", "19.94%", "19.94%", "19.94%", "19.94%", "19.94%"],
//   },
//   {
//     accountType: "6 - Subcontractors (NON-LABOR)",
//     actual: "618,959.31",
//     rates: ["0.83%", "0.83%", "0.83%", "0.83%", "0.83%", "0.83%"],
//   },
// ];
 
 

// useEffect(() => {
//   const fetchNbiRates = async () => {
//     if (!selectedProjectId) {
//       setNbiRateRows([]);
//       return;
//     }
//     try {
//       const response = await fetch(
//         `${backendUrl}/api/AnalgsRt`
//       );
//       if (!response.ok) {
//         throw new Error(`HTTP error! status ${response.status}`);
//       }
//       const data = await response.json();

//       // Transform API response to expected table format
//       const normalized = data.map(row => ({
//         id: row.analgId,
//         totRev: row.totRev || 0,
//         labOnste: row.labOnste || 0,
//         labOnsteNonBill: row.labOnsteNonBill || 0,
//         nonLabTrvl: row.nonLabTrvl || 0,
//         subLab: row.subLab || 0,
//         subNonLab: row.subNonLab || 0,
//         clsPd: row.clsPd || '',
//         ovrwrteRt: row.ovrwrteRt || false,
//         fyCd: row.fyCd || 0,
//         actualAmt: row.actualAmt || false,
//         modifiedBy: row.modifiedBy || '',
//         timeStamp: row.timeStamp || '',
//         // Add any computed fields your table needs
//         isEditing: false,
//         isNew: false
//       }));

//       setNbiRateRows(normalized);
//     } catch (err) {
//       console.error("Failed to fetch NBI rates", err);
//       setNbiRateRows([]);
//     }
//   };

//   fetchNbiRates();
// }, [selectedProjectId, backendUrl]);


 
//   return (
//     <div className="w-full mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg ml-5">
//      <div className="p-4 border-b mb-1 border-gray-100 flex items-center justify-between bg-gray-50/50">
//           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//              NBIs Analogous Rate
//           </h2>
          
//         </div>
//       {/* project selector (API-sourced) — free-text entry removed on purpose */}
//  <table className="min-w-full border border-gray-300 text-sm">
//   <thead className="bg-gray-100">
//     <tr>
//       <th className="border px-2 py-1 text-left">NBIs RATE</th>
//       <th className="border px-2 py-1 text-right">FY-25 Actual AMT</th>
//       <th className="border px-2 py-1 text-right">FY-25 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-26 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-27 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-28 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-29 Rate</th>
//       <th className="border px-2 py-1 text-right">FY-30 Rate</th>
//     </tr>
//   </thead>
//   <tbody>
//     {nbiRateRows.map((row) => (
//       <tr key={row.accountType}>
//         <td className="border px-2 py-1">{row.accountType}</td>
//         <td className="border px-2 py-1 text-right">
//           ${" "}{row.actual}
//         </td>
//         {row.rates.map((r, idx) => (
//           <td key={idx} className="border px-2 py-1 text-right">
//             {r}
//           </td>
//         ))}
//       </tr>   
//     ))}
//   </tbody>
// </table>

//     </div>
//   );
// };

// export default AnalogRate;


// Version 2 


// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const AnalogRate = () => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [rawData, setRawData] = useState([]);
//   const [isSaving, setIsSaving] = useState(false);

//   const categories = [
//     { label: "1 - Total Revenue (REVENUE)", key: "totRev" },
//     { label: "2 - Sumaria Labor Onsite (LABOR)", key: "labOnste" },
//     { label: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)", key: "labOnsteNonBill" },
//     { label: "5 - Sumaria Travel (NON-LABOR)", key: "nonLabTrvl" },
//     { label: "6 - Subcontractors (LABOR)", key: "subLab" },
//     { label: "6 - Subcontractors (NON-LABOR)", key: "subNonLab" },
//   ];

//   const fyYears = [25, 26, 27, 28, 29, 30];

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${backendUrl}/api/AnalgsRt`);
//       if (!response.ok) throw new Error("Failed to fetch data");
//       const data = await response.json();
//       setRawData(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getValue = (categoryKey, fyCode, isActual) => {
//     const record = rawData.find(d => d.fyCd === fyCode && d.actualAmt === isActual);
//     if (!record) return ""; 
//     return record[categoryKey] ?? "";
//   };

//   const handleRateChange = (categoryKey, fyCode, newValue) => {
//     setRawData((prevData) => {
//       const newData = [...prevData];
//       const index = newData.findIndex(d => d.fyCd === fyCode && d.actualAmt === false);

//       if (index > -1) {
//         newData[index] = { 
//           ...newData[index], 
//           [categoryKey]: newValue === "" ? "" : parseFloat(newValue),
//           ovrwrteRt: true 
//         };
//       } else {
//         const newRecord = {
//           fyCd: fyCode,
//           actualAmt: false,
//           ovrwrteRt: true,
//           [categoryKey]: newValue === "" ? "" : parseFloat(newValue)
//         };
//         newData.push(newRecord);
//       }
//       return newData;
//     });
//   };

//   const handleSave = async (fyCode) => {
//     const recordToSave = rawData.find(d => d.fyCd === fyCode && d.actualAmt === false);
//     if (!recordToSave) return;

//     setIsSaving(true);
//     try {
//       const response = await fetch(`${backendUrl}/api/AnalgsRt`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(recordToSave),
//       });
//       if (!response.ok) throw new Error("Update failed");
//       alert(`FY-${fyCode} rates saved successfully!`);
//     } catch (err) {
//       alert("Error: " + err.message);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (loading) return <div className="p-10 text-center text-gray-500">Loading Financial Data...</div>;

//   return (
//     <div className="w-full mx-auto bg-white p-6 rounded-xl shadow-lg ml-5">
//       {/* CSS to hide arrows and handle input styling */}
//       <style>{`
//         input::-webkit-outer-spin-button,
//         input::-webkit-inner-spin-button {
//           -webkit-appearance: none;
//           margin: 0;
//         }
//         input[type=number] {
//           -moz-appearance: textfield;
//         }
//       `}</style>

//       <div className="p-4 border-b mb-6 flex items-center justify-between bg-gray-50 rounded-t-lg">
//         <h2 className="text-xl font-bold text-gray-800">NBIs Analogous Rate</h2>
//         <button 
//           onClick={fetchData} 
//           className="px-4 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm"
//         >
//           Refresh Data
//         </button>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border-collapse">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="border border-gray-300 px-4 py-3 text-left text-gray-700">Category</th>
//               <th className="border border-gray-300 px-4 py-3 text-right bg-blue-50 text-blue-900">FY-25 Actual AMT</th>
//               {fyYears.map(year => (
//                 <th key={year} className="border border-gray-300 px-4 py-3 text-right">
//                   <div className="flex flex-col items-end gap-2">
//                     <span className="text-gray-700">FY-{year} Rate (%)</span>
//                     <button 
//                       onClick={() => handleSave(year)}
//                       className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 uppercase tracking-wider font-bold shadow-sm"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {categories.map((cat) => (
//               <tr key={cat.key} className="hover:bg-gray-50">
//                 <td className="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-white">
//                   {cat.label}
//                 </td>
                
//                 {/* READ-ONLY ACTUALS */}
//                 <td className="border border-gray-300 px-4 py-3 text-right bg-blue-50/10 font-mono text-gray-600">
//                   ${Number(getValue(cat.key, 25, true)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                 </td>

//                 {/* EDITABLE RATES WITH BORDERS */}
//                 {fyYears.map(year => {
//                   const isModified = rawData.find(d => d.fyCd === year && d.actualAmt === false)?.ovrwrteRt;
//                   return (
//                     <td key={year} className="border border-gray-300 px-2 py-2">
//                       <input
//                         type="number"
//                         step="0.01"
//                         placeholder="0.00"
//                         onWheel={(e) => e.target.blur()} 
//                         className={`w-full text-right p-2 rounded-md border transition-all outline-none font-mono
//                           ${isModified 
//                             ? 'border-blue-400 bg-blue-50/30 text-blue-700 font-bold' 
//                             : 'border-gray-200 bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200'
//                           }`}
//                         value={getValue(cat.key, year, false)}
//                         onChange={(e) => handleRateChange(cat.key, year, e.target.value)}
//                       />
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-4 flex items-center gap-4 text-xs">
//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div>
//           <span className="text-gray-600 font-medium">Modified Rates</span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
//           <span className="text-gray-600 font-medium">Default Rates</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AnalogRate;



///////////////////////////

// import React, { useState, useEffect } from "react";
// import { backendUrl } from "./config";

// const AnalogRate = () => {
//   const [loading, setLoading] = useState(true);
//   const [rawData, setRawData] = useState([]);
//   const [isSaving, setIsSaving] = useState(false);
//   const [editMode, setEditMode] = useState(null);
//   const [viewMode, setViewMode] = useState("Calculated");

//   const categories = [
//     { label: "1 - Total Revenue (REVENUE)", key: "totRev" },
//     { label: "2 - Sumaria Labor Onsite (LABOR)", key: "labOnste" },
//     { label: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)", key: "labOnsteNonBill" },
//     { label: "5 - Sumaria Travel (NON-LABOR)", key: "nonLabTrvl" },
//     { label: "6 - Subcontractors (LABOR)", key: "subLab" },
//     { label: "6 - Subcontractors (NON-LABOR)", key: "subNonLab" },
//   ];

//   const fyYears = [2025, 2026, 2027, 2028, 2029, 2030];

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${backendUrl}/api/AnalgsRt`);
//       if (!response.ok) throw new Error("Failed to fetch data");
//       const data = await response.json();
//       setRawData(data);
//     } catch (err) {
//       console.error("Fetch Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Helper to create a new Overwrite record based on existing Calculated data
//    * This ensures we don't send 0s for fields we didn't touch.
//    */
//   const initializeOverwriteRecord = (fyCd) => {
//     const calculatedRec = rawData.find(d => d.fyCd === fyCd && d.actualAmt === false && d.ovrwrteRt === false);
    
//     return {
//       ...(calculatedRec || {}), // Copy all existing values (totRev, etc.)
//       analgId: undefined,       // Ensure ID is removed for auto-gen
//       ovrwrteRt: true,          // Mark as overwrite
//       actualAmt: false,         // It's still a forecast rate
//       fyCd: fyCd,               // Ensure correct year
//       isDirty: true,            // Mark for bulk save
//       modifiedBy: "myuser",
//       timeStamp: new Date().toISOString(),
//     };
//   };

//   const getValue = (categoryKey, fyCode, isActual) => {
//     if (isActual) {
//       const record = rawData.find(d => d.fyCd === fyCode && d.actualAmt === true);
//       return record ? (record[categoryKey] ?? "") : "";
//     }
//     const targetStatus = viewMode === "Overwrite";
//     const record = rawData.find(d => d.fyCd === fyCode && d.actualAmt === false && d.ovrwrteRt === targetStatus);
//     return record ? (record[categoryKey] ?? "") : "";
//   };

//   const handleRateChange = (categoryKey, fyCode, newValue) => {
//     setRawData((prevData) => {
//       const newData = [...prevData];
//       let index = newData.findIndex(d => d.fyCd === fyCode && d.actualAmt === false && d.ovrwrteRt === true);
//       const parsedVal = newValue === "" ? 0 : parseFloat(newValue);

//       if (index > -1) {
//         newData[index] = { ...newData[index], [categoryKey]: parsedVal, isDirty: true };
//       } else {
//         const newRec = initializeOverwriteRecord(fyCode);
//         newRec[categoryKey] = parsedVal;
//         newData.push(newRec);
//       }
//       return newData;
//     });
//   };

//   const handleApplyToAll = (sourceYear) => {
//     const sourceRecord = rawData.find(d => d.fyCd === sourceYear && d.actualAmt === false && d.ovrwrteRt === true);
//     if (!sourceRecord) return;

//     // Capture the current visible values from the source column
//     const sourceValues = {};
//     categories.forEach(cat => { sourceValues[cat.key] = sourceRecord[cat.key] ?? 0; });

//     setRawData((prevData) => {
//       let newData = [...prevData];
//       fyYears.forEach(year => {
//         let index = newData.findIndex(d => d.fyCd === year && d.actualAmt === false && d.ovrwrteRt === true);
//         if (index > -1) {
//           // Update existing pending overwrite
//           newData[index] = { ...newData[index], ...sourceValues, isDirty: true };
//         } else {
//           // Create new overwrite based on that year's calculated data + source values
//           newData.push({ ...initializeOverwriteRecord(year), ...sourceValues });
//         }
//       });
//       return newData;
//     });
//   };

//   const handleCancel = () => {
//     setEditMode(null);
//     fetchData(); 
//   };

//   const handleSave = async (fyCode) => {
//     const modifiedRecords = rawData.filter(d => d.actualAmt === false && d.ovrwrteRt === true && d.isDirty === true);
//     if (modifiedRecords.length === 0) { setEditMode(null); return; }

//     setIsSaving(true);
//     try {
//       const savePromises = modifiedRecords.map(record => {
//         const { analgId, isDirty, ...payload } = record;
//         return fetch(`${backendUrl}/api/AnalgsRt`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ ...payload, timeStamp: new Date().toISOString() }),
//         });
//       });

//       const results = await Promise.all(savePromises);
//       const failed = results.filter(r => !r.ok);
//       if (failed.length > 0) throw new Error(`${failed.length} updates failed.`);

//       alert(modifiedRecords.length > 1 ? "Bulk update successful!" : `FY-${fyCode} saved!`);
//       setEditMode(null);
//       fetchData();
//     } catch (err) {
//       alert("Save Error: " + err.message);
//     } finally { setIsSaving(false); }
//   };

//   if (loading) return <div className="p-10 text-center text-gray-400 font-mono">Loading...</div>;

//   return (
//     <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-lg border border-gray-100">
//       <style>{`
//         .financial-font { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; }
//         input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
//         input[type=number] { -moz-appearance: textfield; }
//         .pulse-update { animation: pulse-bg 1s ease-in-out; }
//         @keyframes pulse-bg { 0% { background-color: rgba(79, 70, 229, 0.1); } 100% { background-color: transparent; } }
//       `}</style>

//       <div className="p-4 border-b mb-4 flex items-center justify-between bg-gray-50 rounded-t-lg">
//         <h2 className="text-xl font-bold text-slate-800">NBIs Analogous Rate</h2>
//         <div className="flex items-center gap-6">
//           <div className="flex items-center bg-gray-200 p-1 rounded-lg border border-gray-300 shadow-inner">
//             <button onClick={() => setViewMode("Calculated")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "Calculated" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>Calculated</button>
//             <button onClick={() => setViewMode("Overwrite")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "Overwrite" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}>Saved Overwrites</button>
//           </div>
//           <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-100 shadow-sm">Refresh</button>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full text-sm border-collapse">
//           <thead>
//             <tr className="bg-slate-100">
//               <th className="border border-gray-300 px-3 py-3 text-left text-slate-700 min-w-[200px]">Category</th>
//               <th className="border border-gray-300 px-3 py-3 text-right bg-blue-100/30 text-blue-900 min-w-[150px]">FY-2025 Actuals</th>
//               {fyYears.map(year => (
//                 <th key={year} className={`border border-gray-300 px-2 py-3 text-right ${editMode === year ? 'bg-orange-50' : ''} min-w-[230px]`}>
//                   <div className="flex flex-col items-end gap-2">
//                     <span className="text-slate-700 font-bold text-xs uppercase">FY-{year} Rate (%)</span>
//                     <div className="flex flex-row gap-1 whitespace-nowrap">
//                       {editMode === year ? (
//                         <>
//                           <button onClick={() => handleApplyToAll(year)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-indigo-700">Apply All</button>
//                           <button onClick={() => handleSave(year)} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-green-700">{isSaving ? '...' : 'Save'}</button>
//                           <button onClick={handleCancel} className="bg-gray-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-gray-600">Cancel</button>
//                         </>
//                       ) : (
//                         viewMode === "Calculated" && <button onClick={() => setEditMode(year)} className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase hover:bg-blue-700">Overwrite</button>
//                       )}
//                     </div>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {categories.map((cat) => (
//               <tr key={cat.key} className="hover:bg-gray-50/50">
//                 <td className="border border-gray-300 px-3 py-3 font-medium text-slate-700 text-xs">{cat.label}</td>
//                 <td className="border border-gray-300 px-3 py-3 text-right financial-font font-semibold text-sm">
//                   {getValue(cat.key, 2025, true) !== "" ? `$ ${Number(getValue(cat.key, 2025, true)).toLocaleString()}` : "—"}
//                 </td>
//                 {fyYears.map(year => {
//                   const isActive = editMode === year;
//                   const record = rawData.find(d => d.fyCd === year && d.actualAmt === false && d.ovrwrteRt === true);
//                   const isDirty = record?.isDirty;

//                   return (
//                     <td key={year} className={`border border-gray-300 px-1 py-1 transition-all ${isActive ? 'bg-orange-50/20' : isDirty ? 'pulse-update' : ''}`}>
//                       <input
//                         type="number"
//                         disabled={!isActive}
//                         className={`w-full text-right px-2 py-2.5 rounded outline-none financial-font font-bold text-xl
//                           ${isActive ? 'text-orange-700 bg-white border-2 border-orange-300 shadow-sm' 
//                             : isDirty ? 'text-indigo-600' : viewMode === "Overwrite" ? 'text-blue-700' : 'text-slate-700 bg-transparent'}`}
//                         value={isActive || isDirty ? (record?.[cat.key] ?? "") : getValue(cat.key, year, false)}
//                         onChange={(e) => handleRateChange(cat.key, year, e.target.value)}
//                       />
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default AnalogRate;



import React, { useState, useEffect } from "react";
import { backendUrl } from "./config";

const AnalogRate = () => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [viewMode, setViewMode] = useState("Calculated");

  const categories = [
    { label: "1 - Total Revenue (REVENUE)", key: "totRev" },
    { label: "2 - Sumaria Labor Onsite (LABOR)", key: "labOnste" },
    { label: "2 - Sumaria Labor Onsite (UNALLOW-LABOR)", key: "labOnsteNonBill" },
    { label: "5 - Sumaria Travel (NON-LABOR)", key: "nonLabTrvl" },
    { label: "6 - Subcontractors (LABOR)", key: "subLab" },
    { label: "6 - Subcontractors (NON-LABOR)", key: "subNonLab" },
  ];

  // Extended to 2038
  const fyYears = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038];

  useEffect(() => {
    fetchAllData();
  }, []);



  const fetchAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/AnalgsRt`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setRawData(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchData = async () => {
    try {
      setLoading(true);
      await fetch(`${backendUrl}/Orgnization/CalculateAnalogusRates`, {
        method: "POST",
      });
      const response = await fetch(`${backendUrl}/api/AnalgsRt`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setRawData(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeOverwriteRecord = (fyCd) => {
    const calculatedRec = rawData.find(d => d.fyCd === fyCd && d.actualAmt === false && d.ovrwrteRt === false);
    
    return {
      ...(calculatedRec || {}),
      analgId: undefined,
      ovrwrteRt: true,
      actualAmt: false,
      fyCd: fyCd,
      isDirty: true,
      modifiedBy: "myuser",
      timeStamp: new Date().toISOString(),
    };
  };

  const getValue = (categoryKey, fyCode, isActual) => {
    const targetStatus = viewMode === "Overwrite";
    
    // Filtering and sorting by timeStamp to get the latest record
    const matchingRecords = rawData.filter(d => 
      d.fyCd === fyCode && 
      (isActual ? d.actualAmt === true : (d.actualAmt === false && d.ovrwrteRt === targetStatus))
    );

    if (matchingRecords.length === 0) return "";

    const latestRecord = matchingRecords.sort((a, b) => 
      new Date(b.timeStamp) - new Date(a.timeStamp)
    )[0];

    return latestRecord ? (latestRecord[categoryKey] ?? "") : "";
  };

  const handleRateChange = (categoryKey, fyCode, newValue) => {
    setRawData((prevData) => {
      const newData = [...prevData];
      let index = newData.findIndex(d => d.fyCd === fyCode && d.actualAmt === false && d.ovrwrteRt === true);
      const parsedVal = newValue === "" ? 0 : parseFloat(newValue);

      if (index > -1) {
        newData[index] = { ...newData[index], [categoryKey]: parsedVal, isDirty: true };
      } else {
        const newRec = initializeOverwriteRecord(fyCode);
        newRec[categoryKey] = parsedVal;
        newData.push(newRec);
      }
      return newData;
    });
  };

  const handleApplyToAll = (sourceYear) => {
    const sourceRecord = rawData.filter(d => d.fyCd === sourceYear && d.actualAmt === false && d.ovrwrteRt === true)
                                .sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))[0];
    if (!sourceRecord) return;

    const sourceValues = {};
    categories.forEach(cat => { sourceValues[cat.key] = sourceRecord[cat.key] ?? 0; });

    setRawData((prevData) => {
      let newData = [...prevData];
      fyYears.forEach(year => {
        let index = newData.findIndex(d => d.fyCd === year && d.actualAmt === false && d.ovrwrteRt === true);
        if (index > -1) {
          newData[index] = { ...newData[index], ...sourceValues, isDirty: true };
        } else {
          newData.push({ ...initializeOverwriteRecord(year), ...sourceValues });
        }
      });
      return newData;
    });
  };

  const handleCancel = () => {
    setEditMode(null);
    fetchData(); 
  };

  const handleSave = async (fyCode) => {
    const modifiedRecords = rawData.filter(d => d.actualAmt === false && d.ovrwrteRt === true && d.isDirty === true);
    if (modifiedRecords.length === 0) { setEditMode(null); return; }

    setIsSaving(true);
    try {
      const savePromises = modifiedRecords.map(record => {
        const { analgId, isDirty, ...payload } = record;
        return fetch(`${backendUrl}/api/AnalgsRt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, timeStamp: new Date().toISOString() }),
        });
      });

      const results = await Promise.all(savePromises);
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) throw new Error(`${failed.length} updates failed.`);

      alert(modifiedRecords.length > 1 ? "Bulk update successful!" : `FY-${fyCode} saved!`);
      setEditMode(null);
      fetchData();
    } catch (err) {
      alert("Save Error: " + err.message);
    } finally { setIsSaving(false); }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-mono">Loading...</div>;

  return (
    <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-lg border border-gray-100">
      <style>{`
        .financial-font { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .pulse-update { animation: pulse-bg 1s ease-in-out; }
        @keyframes pulse-bg { 0% { background-color: rgba(79, 70, 229, 0.1); } 100% { background-color: transparent; } }
      `}</style>

      <div className="p-4 border-b mb-4 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <h2 className="text-xl font-bold text-slate-800">NBIs Analogous Rate</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-gray-200 p-1 rounded-lg border border-gray-300 shadow-inner">
            <button onClick={() => setViewMode("Calculated")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "Calculated" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>Calculated</button>
            <button onClick={() => setViewMode("Overwrite")} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === "Overwrite" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}>Saved Overwrites</button>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold hover:bg-gray-100 shadow-sm">Calculate Rate</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-gray-300 px-3 py-3 text-left text-slate-700 min-w-[200px]">Category</th>
              <th className="border border-gray-300 px-3 py-3 text-right bg-blue-100/30 text-blue-900 min-w-[150px]">FY-2025 Actuals</th>
              {fyYears.map(year => (
                <th key={year} className={`border border-gray-300 px-2 py-3 text-right ${editMode === year ? 'bg-orange-50' : ''} min-w-[230px]`}>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-slate-700 font-bold text-xs uppercase">FY-{year} Rate (%)</span>
                    <div className="flex flex-row gap-1 whitespace-nowrap">
                      {editMode === year ? (
                        <>
                          <button onClick={() => handleApplyToAll(year)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-indigo-700">Apply All</button>
                          <button onClick={() => handleSave(year)} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-green-700">{isSaving ? '...' : 'Save'}</button>
                          <button onClick={handleCancel} className="bg-gray-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-gray-600">Cancel</button>
                        </>
                      ) : (
                        viewMode === "Calculated" && <button onClick={() => setEditMode(year)} className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase hover:bg-blue-700">Overwrite</button>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.key} className="hover:bg-gray-50/50">
                <td className="border border-gray-300 px-3 py-3 font-medium text-slate-700 text-xs">{cat.label}</td>
                <td className="border border-gray-300 px-3 py-3 text-right financial-font font-semibold text-sm">
                  {getValue(cat.key, 2025, true) !== "" ? `$ ${Number(getValue(cat.key, 2025, true)).toLocaleString()}` : "—"}
                </td>
                {fyYears.map(year => {
                  const isActive = editMode === year;
                  
                  // Sorting records to find latest for this year
                  const relevantRecords = rawData.filter(d => d.fyCd === year && d.actualAmt === false && d.ovrwrteRt === true);
                  const latestSavedRecord = relevantRecords.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp))[0];
                  
                  // Use dirty record if available, otherwise latest saved
                  const record = relevantRecords.find(r => r.isDirty) || latestSavedRecord;
                  const isDirty = record?.isDirty;

                  return (
                    <td key={year} className={`border border-gray-300 px-1 py-1 transition-all ${isActive ? 'bg-orange-50/20' : isDirty ? 'pulse-update' : ''}`}>
                      <input
                        type="number"
                        disabled={!isActive}
                        className={`w-full text-right px-2 py-2.5 rounded outline-none financial-font font-bold text-xl
                          ${isActive ? 'text-orange-700 bg-white border-2 border-orange-300 shadow-sm' 
                            : isDirty ? 'text-indigo-600' : viewMode === "Overwrite" ? 'text-blue-700' : 'text-slate-700 bg-transparent'}`}
                        value={isActive || isDirty ? (record?.[cat.key] ?? "") : getValue(cat.key, year, false)}
                        onChange={(e) => handleRateChange(cat.key, year, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalogRate;