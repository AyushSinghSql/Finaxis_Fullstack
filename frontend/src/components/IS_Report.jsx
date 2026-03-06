
// "use client";
// import React, { useState, useMemo, useCallback } from 'react';
// import { backendUrl } from './config';
// import pptxgen from "pptxgenjs";

// const IS_Report = () => {
//   const [rawData, setRawData] = useState([]);
//   const [selectedMonth, setSelectedMonth] = useState(10); 
//   const [loading, setLoading] = useState(false);
//   const [hasRun, setHasRun] = useState(false);
//   const [error, setError] = useState(null);

//   const handleRunReport = async () => {
//     setLoading(true);
//     setHasRun(true);
//     setError(null);
//     try {
//       const response = await fetch(`${backendUrl}/api/ForecastReport/GetISData`);
//       if (!response.ok) throw new Error('Failed to fetch report data');
//       const result = await response.json();
//       setRawData(Array.isArray(result) ? result : [result]);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getSum = useCallback((grpDesc, lnDesc, monthLimit = null, isExact = false) => {
//     if (!rawData || rawData.length === 0) return 0;
//     const total = rawData
//       .filter(item => {
//         const matchesGrp = item.fsGrpDesc?.trim().toLowerCase() === grpDesc.trim().toLowerCase();
//         const matchesLn = item.fsLnDesc?.trim().toLowerCase() === lnDesc.trim().toLowerCase();
//         const itemPd = Number(item.pdNo);
//         const matchesPd = isExact ? itemPd === monthLimit : (monthLimit === null || itemPd <= monthLimit);
//         return matchesGrp && matchesLn && matchesPd;
//       })
//       .reduce((sum, item) => sum + (parseFloat(item.amt1) || 0), 0);
//     return total * -1;
//   }, [rawData]);

//   const calculations = useMemo(() => {
//     if (!hasRun || rawData.length === 0) return null;

//     const calcSection = (defaultGrp, lines) => {
//       const items = lines.map(ln => {
//         const isComplex = typeof ln === 'object' && !Array.isArray(ln);
//         const isMultiKey = Array.isArray(ln);
//         const label = isComplex ? ln.label : (isMultiKey ? ln[0] : ln);
//         const mappingKeys = isComplex ? ln.keys : (isMultiKey ? ln : [ln]);
        
//         let periodTotal = 0;
//         let ytdTotal = 0;
//         mappingKeys.forEach(key => {
//           const targetGrp = typeof key === 'object' ? key.grp : defaultGrp;
//           const targetLn = typeof key === 'object' ? key.ln : key;
//           periodTotal += getSum(targetGrp, targetLn, selectedMonth, true);
//           ytdTotal += getSum(targetGrp, targetLn, selectedMonth, false);
//         });
//         return { label, period: periodTotal, ytd: ytdTotal };
//       });

//       return { 
//         items, 
//         subtotalPeriod: items.reduce((a, b) => a + b.period, 0),
//         subtotalYTD: items.reduce((a, b) => a + b.ytd, 0)
//       };
//     };

//     const rev = calcSection("Revenue", ["Total Revenue"]);
//     const dc = calcSection("Direct Costs", ["Sumaria Labor Onsite", "Sumaria ODCs", "Sumaria Travel", "Subcontractors"]);
//     const grossProfitP = rev.subtotalPeriod + dc.subtotalPeriod;
//     const grossProfitY = rev.subtotalYTD + dc.subtotalYTD;
//     const equip = calcSection("Equipment Purchase", ["Income", "Expense"]);
//     const netEquipP = grossProfitP + equip.subtotalPeriod;
//     const netEquipY = grossProfitY + equip.subtotalYTD;
//     const coo = calcSection("Cost of Operations", ["Fringe Benefits", "Overhead", "Material & Handling", "HR Service Center", ["General & Admin", { grp: "Cost of Operations, EBITDA Add Back", ln: "Depreciation, General & Admin" }, { grp: "Cost of Operations, EBITDA Add Back", ln: "General & Admin, Taxes" }], "Unallocated Burden Allocations"]);
//     const opMarginP = netEquipP + coo.subtotalPeriod;
//     const opMarginY = netEquipY + coo.subtotalYTD;
//     const other = calcSection("Other Income & Expenses", [["Unallowable Expenses", { grp: "EBITDA Add Back, Other Income & Expenses", ln: "Interest, Unallowable Expenses" }, { grp: "EBITDA Add Back, Other Income & Expenses", ln: "Amortization, Unallowable Expenses" }]]);
//     const otherIncomeTotalP = opMarginP + other.subtotalPeriod;
//     const otherIncomeTotalY = opMarginY + other.subtotalYTD;

//     return { rev, dc, grossProfitP, grossProfitY, equip, netEquipP, netEquipY, coo, opMarginP, opMarginY, other, otherIncomeTotalP, otherIncomeTotalY, compP: otherIncomeTotalP, compY: otherIncomeTotalY };
//   }, [selectedMonth, getSum, hasRun, rawData]);

//   const formatCurrency = (val) => {
//     const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(val || 0));
//     return val < 0 ? `(${formatted})` : formatted;
//   };

//   const handleExportPPT = () => {
//     if (!hasRun || !calculations) return;
//     const pptx = new pptxgen();
//     pptx.layout = 'LAYOUT_WIDE';
//     const slide = pptx.addSlide();
//     slide.addText([{ text: "Science Systems & Applications, Inc.  ", options: { bold: true, fontSize: 13, color: "333333" } }, { text: "|  Income Statement", options: { italic: true, fontSize: 13, color: "1d4ed8" } }], { x: 0.5, y: 0.15, w: 12.3, align: "center" });
//     slide.addText(`Period ${selectedMonth} Consolidated Performance`, { x: 0.5, y: 0.35, w: 12.3, fontSize: 8.5, align: "center", color: "999999" });

//     let rows = [[{ text: "Account Category", options: { bold: true, fill: "F3F4F6", color: "000000" } }, { text: "Period Actuals", options: { bold: true, fill: "F3F4F6", align: "right" } }, { text: "Year-to-Date", options: { bold: true, fill: "F3F4F6", align: "right" } }]];
//     const pushSection = (title, sectionData) => {
//       rows.push([{ text: title, options: { bold: true, color: "1d4ed8", italic: true, fill: "F9FAFB" } }, "", ""]);
//       sectionData.items.forEach(item => rows.push([`    ${item.label}`, formatCurrency(item.period), formatCurrency(item.ytd)]));
//       rows.push([{ text: `Total ${title}`, options: { bold: true } }, formatCurrency(sectionData.subtotalPeriod), formatCurrency(sectionData.subtotalYTD)]);
//     };
//     const pushMargin = (label, period, ytd) => {
//       rows.push([{ text: label.toUpperCase(), options: { bold: true, fill: "DBEAFE" } }, formatCurrency(period), formatCurrency(ytd)]);
//     };

//     pushSection("Revenue", calculations.rev);
//     pushSection("Direct Costs", calculations.dc);
//     pushMargin("Gross Profit", calculations.grossProfitP, calculations.grossProfitY);
//     pushSection("Equipment Purchase", calculations.equip);
//     pushMargin("Net Income After Equip. Margin", calculations.netEquipP, calculations.netEquipY);
//     pushSection("Cost of Operations", calculations.coo);
//     pushMargin("Operating Margin", calculations.opMarginP, calculations.opMarginY);
//     pushSection("Other Income & Expenses", calculations.other);
//     pushMargin("Total Other Income & Expenses", calculations.otherIncomeTotalP, calculations.otherIncomeTotalY);
//     rows.push([{ text: "COMPREHENSIVE INCOME", options: { bold: true, fill: "111827", color: "FFFFFF" } }, formatCurrency(calculations.compP), formatCurrency(calculations.compY)]);

//     slide.addTable(rows, { x: 0.5, y: 0.6, w: 12.3, fontSize: 7.5, rowH: 0.17, border: { type: "solid", color: "E5E7EB", pt: 0.5 }, colW: [6.3, 3.0, 3.0] });
//     pptx.writeFile({ fileName: `Sumaria_IS_Export_Pd${selectedMonth}.pptx` });
//   };

//   const RenderSection = ({ title, data, indent = true }) => (
//     <div className="mb-10">
//       <h3 className="text-blue-700 text-[11px] uppercase font-bold tracking-[0.3em] mb-4 border-b border-blue-100 pb-2 italic">{title}</h3>
//       {data.items.map((item, idx) => (
//         <div key={idx} className="grid grid-cols-12 py-3 text-[14px] border-b border-slate-50 hover:bg-blue-50 transition-colors">
//           <div className={`col-span-6 ${indent ? 'pl-10 border-l-2 border-blue-100' : 'pl-4'} text-slate-700 font-medium tracking-tight`}>{item.label}</div>
//           <div className="col-span-3 text-right pr-16 tabular-nums font-semibold text-slate-800">{formatCurrency(item.period)}</div>
//           <div className="col-span-3 text-right pr-8 tabular-nums font-semibold text-slate-800">{formatCurrency(item.ytd)}</div>
//         </div>
//       ))}
//     </div>
//   );

//   const RenderMargin = ({ label, period, ytd, isFinal = false }) => (
//     <div className={`grid grid-cols-12 py-5 mb-10 items-center transition-all px-6 rounded-lg ${isFinal ? 'bg-slate-900 text-white shadow-lg' : 'bg-blue-50 border border-blue-200 text-slate-900 shadow-sm'}`}>
//       <div className="col-span-6 font-bold uppercase text-[12px] tracking-widest">{label}</div>
//       <div className="col-span-3 text-right pr-10 tabular-nums text-[16px] font-bold">{formatCurrency(period)}</div>
//       <div className="col-span-3 text-right pr-2 tabular-nums text-[16px] font-bold">{formatCurrency(ytd)}</div>
//     </div>
//   );

//   return (
//     <div className="w-full bg-[#f8fafc] p-4 md:p-10 min-h-screen font-sans">
//       <style jsx global>{`
//         @media print {
//           body * { visibility: hidden !important; }
//           #report-print-area, #report-print-area * { visibility: visible !important; }
//           #report-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 10px !important; box-shadow: none !important; border: none !important; }
//           .no-print { display: none !important; }
//         }
//         .tabular-nums { font-variant-numeric: tabular-nums; }
//       `}</style>

//       {/* Control Bar */}
//       {/* <div className="max-w-[98%] mx-auto mb-8 flex justify-between items-center no-print bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
//         <div className="flex gap-12 items-center">
//           <div className="flex flex-col">
//             <span className="text-[10px] font-bold uppercase text-blue-600 mb-1.5">Reporting Period</span>
//             <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-blue-50 border border-blue-100 py-2 px-6 rounded-xl font-bold text-sm outline-none cursor-pointer">
//               {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Period {i+1}</option>)}
//             </select>
//           </div>
//           <button onClick={handleRunReport} disabled={loading} className={`mt-4 px-12 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all shadow-lg ${loading ? 'bg-slate-100 text-slate-300 font-medium' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
//             {loading ? 'Processing...' : 'Run Report'}
//           </button>
//         </div>
//         <div className="flex gap-4">
//           {/* Export buttons: colors remain, but cursor changes to cross sign and pointer events are handled manually */}
//           {/* <button 
//             onClick={() => hasRun && handleExportPPT()} 
//             className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-orange-600 text-white shadow-xl ${!hasRun || loading ? 'cursor-not-allowed' : 'hover:bg-orange-700 active:scale-95'}`}
//           >
//             Export PPT
//           </button>
//           <button 
//             onClick={() => hasRun && window.print()} 
//             className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-slate-900 text-white shadow-xl ${!hasRun || loading ? 'cursor-not-allowed' : 'hover:bg-black active:scale-95'}`}
//           >
//             Export PDF
//           </button>
//         </div> */}
//       {/* // </div> */}
//       {/* Control Bar - Replaced for single line alignment */}
// <div className="max-w-[98%] mx-auto mb-8 flex justify-between items-center no-print bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
//   <div className="flex flex-row items-center gap-8">
//     <div className="flex flex-col">
//       <span className="text-[10px] font-bold uppercase text-blue-600 mb-1">Reporting Period</span>
//       <select 
//         value={selectedMonth} 
//         onChange={(e) => setSelectedMonth(Number(e.target.value))} 
//         className="bg-blue-50 border border-blue-100 py-2 px-6 rounded-xl font-bold text-sm outline-none cursor-pointer"
//       >
//         {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Period {i+1}</option>)}
//       </select>
//     </div>
    
//     <button 
//       onClick={handleRunReport} 
//       disabled={loading} 
//       className={`px-12 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all shadow-lg self-end ${loading ? 'bg-slate-100 text-slate-300 font-medium' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
//     >
//       {loading ? 'Processing...' : 'Run Report'}
//     </button>
//   </div>

//   <div className="flex flex-row items-center gap-4 self-end">
//     <button 
//       onClick={() => hasRun && handleExportPPT()} 
//       className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-orange-600 text-white shadow-xl ${!hasRun || loading ? 'cursor-not-allowed' : 'hover:bg-orange-700 active:scale-95'}`}
//     >
//       Export PPT
//     </button>
//     <button 
//       onClick={() => hasRun && window.print()} 
//       className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-slate-900 text-white shadow-xl ${!hasRun || loading ? 'cursor-not-allowed' : 'hover:bg-black active:scale-95'}`}
//     >
//       Export PDF
//     </button>
//   </div>
// </div>


//       <div id="report-print-area" className="max-w-[98%] mx-auto bg-white shadow-2xl rounded-[3rem] p-12 md:p-24 border border-slate-100 min-h-[90vh]">
//         {hasRun && !loading && calculations ? (
//           <div className="w-full">
//             <header className="text-center mb-20">
//               <h1 className="text-[42px] font-extralight uppercase tracking-[0.8em] text-slate-900">Science Systems & Applications, Inc.</h1>
//               <div className="inline-block px-16 py-6 mt-12 bg-blue-50/80 rounded-full border border-blue-100">
//                 <h2 className="text-4xl font-light italic font-serif text-blue-800 tracking-wide">Income Statement</h2>
//               </div>
//             </header>
//             <RenderSection title="Revenue" data={calculations.rev} indent={false} />
//             <RenderSection title="Direct Costs" data={calculations.dc} />
//             <RenderMargin label="Gross Profit" period={calculations.grossProfitP} ytd={calculations.grossProfitY} />
//             <RenderSection title="Equipment Purchase" data={calculations.equip} />
//             <RenderMargin label="Net Income After Equip. Margin" period={calculations.netEquipP} ytd={calculations.netEquipY} />
//             <RenderSection title="Cost of Operations" data={calculations.coo} />
//             <RenderMargin label="Operating Margin" period={calculations.opMarginP} ytd={calculations.opMarginY} />
//             <RenderSection title="Other Income & Expenses" data={calculations.other} />
//             <RenderMargin label="Total Other Income & Expenses" period={calculations.otherIncomeTotalP} ytd={calculations.otherIncomeTotalY} />
//             <footer className="mt-40 pt-16 border-t-[8px] border-double border-slate-900">
//               <div className="grid grid-cols-12 font-bold text-slate-900 items-baseline px-4">
//                 <div className="col-span-6 text-2xl uppercase tracking-tighter">Comprehensive Income</div>
//                 <div className="col-span-3 text-right pr-16 tabular-nums text-3xl">{formatCurrency(calculations.compP)}</div>
//                 <div className="col-span-3 text-right pr-4 tabular-nums text-3xl">{formatCurrency(calculations.compY)}</div>
//               </div>
//             </footer>
//           </div>
//         ) : (
//           <div className="h-[60vh] flex flex-col items-center justify-center text-slate-300">
//             <p className="text-3xl font-extralight uppercase tracking-[0.5em] text-blue-200">{loading ? 'Science Systems & Applications, Inc.' : 'Science Systems & Applications, Inc.'}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default IS_Report;

"use client";
import React, { useState, useMemo, useCallback } from 'react';
import { backendUrl } from './config';
import pptxgen from "pptxgenjs";

const IS_Report = () => {
  const [rawData, setRawData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(10); 
  const [selectedYear, setSelectedYear] = useState(""); // Initialize empty
  // --- NEW: State for Dynamic Years ---
  const [availableYears, setAvailableYears] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState(null);

  const handleRunReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/ForecastReport/GetISData`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      const result = await response.json();
      const data = Array.isArray(result) ? result : [result];
      
      setRawData(data);

      // --- DYNAMIC YEAR EXTRACTION ---
      // Get unique fyCd values, filter out nulls, and sort them
      const uniqueYears = [...new Set(data.map(item => item.fyCd))]
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

      setAvailableYears(uniqueYears);
      
      // Set default year if none selected or if current selection isn't in new data
      if (uniqueYears.length > 0 && !uniqueYears.includes(selectedYear)) {
        setSelectedYear(uniqueYears[0]);
      }

      setHasRun(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSum = useCallback((grpDesc, lnDesc, monthLimit = null, isExact = false) => {
    if (!rawData || rawData.length === 0) return 0;
    const total = rawData
      .filter(item => {
        // Filter by the dynamically selected year
        const matchesYear = item.fyCd === selectedYear;
        const matchesGrp = item.fsGrpDesc?.trim().toLowerCase() === grpDesc.trim().toLowerCase();
        const matchesLn = item.fsLnDesc?.trim().toLowerCase() === lnDesc.trim().toLowerCase();
        const itemPd = Number(item.pdNo);
        const matchesPd = isExact ? itemPd === monthLimit : (monthLimit === null || itemPd <= monthLimit);
        
        return matchesYear && matchesGrp && matchesLn && matchesPd;
      })
      .reduce((sum, item) => sum + (parseFloat(item.amt1) || 0), 0);
    return total * -1;
  }, [rawData, selectedYear]);

  // ... (Calculations, formatCurrency, and handleExportPPT remain the same)
  // [Note: calculations memo uses selectedMonth, getSum, hasRun, rawData]
  
  const calculations = useMemo(() => {
    if (!hasRun || rawData.length === 0) return null;

    const calcSection = (defaultGrp, lines) => {
      const items = lines.map(ln => {
        const isComplex = typeof ln === 'object' && !Array.isArray(ln);
        const isMultiKey = Array.isArray(ln);
        const label = isComplex ? ln.label : (isMultiKey ? ln[0] : ln);
        const mappingKeys = isComplex ? ln.keys : (isMultiKey ? ln : [ln]);
        
        let periodTotal = 0;
        let ytdTotal = 0;
        mappingKeys.forEach(key => {
          const targetGrp = typeof key === 'object' ? key.grp : defaultGrp;
          const targetLn = typeof key === 'object' ? key.ln : key;
          periodTotal += getSum(targetGrp, targetLn, selectedMonth, true);
          ytdTotal += getSum(targetGrp, targetLn, selectedMonth, false);
        });
        return { label, period: periodTotal, ytd: ytdTotal };
      });

      return { 
        items, 
        subtotalPeriod: items.reduce((a, b) => a + b.period, 0),
        subtotalYTD: items.reduce((a, b) => a + b.ytd, 0)
      };
    };

    const rev = calcSection("Revenue", ["Total Revenue"]);
    const dc = calcSection("Direct Costs", ["Sumaria Labor Onsite", "Sumaria ODCs", "Sumaria Travel", "Subcontractors"]);
    const grossProfitP = rev.subtotalPeriod + dc.subtotalPeriod;
    const grossProfitY = rev.subtotalYTD + dc.subtotalYTD;
    const equip = calcSection("Equipment Purchase", ["Income", "Expense"]);
    const netEquipP = grossProfitP + equip.subtotalPeriod;
    const netEquipY = grossProfitY + equip.subtotalYTD;
    const coo = calcSection("Cost of Operations", ["Fringe Benefits", "Overhead", "Material & Handling", "HR Service Center", ["General & Admin", { grp: "Cost of Operations, EBITDA Add Back", ln: "Depreciation, General & Admin" }, { grp: "Cost of Operations, EBITDA Add Back", ln: "General & Admin, Taxes" }], "Unallocated Burden Allocations"]);
    const opMarginP = netEquipP + coo.subtotalPeriod;
    const opMarginY = netEquipY + coo.subtotalYTD;
    const other = calcSection("Other Income & Expenses", [["Unallowable Expenses", { grp: "EBITDA Add Back, Other Income & Expenses", ln: "Interest, Unallowable Expenses" }, { grp: "EBITDA Add Back, Other Income & Expenses", ln: "Amortization, Unallowable Expenses" }]]);
    const otherIncomeTotalP = opMarginP + other.subtotalPeriod;
    const otherIncomeTotalY = opMarginY + other.subtotalYTD;

    return { rev, dc, grossProfitP, grossProfitY, equip, netEquipP, netEquipY, coo, opMarginP, opMarginY, other, otherIncomeTotalP, otherIncomeTotalY, compP: otherIncomeTotalP, compY: otherIncomeTotalY };
  }, [selectedMonth, getSum, hasRun, rawData]);

  const formatCurrency = (val) => {
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(val || 0));
    return val < 0 ? `(${formatted})` : formatted;
  };

  const handleExportPPT = () => {
    if (!hasRun || !calculations) return;
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    const slide = pptx.addSlide();
    slide.addText([{ text: "Science Systems & Applications, Inc.  ", options: { bold: true, fontSize: 13, color: "333333" } }, { text: "|  Income Statement", options: { italic: true, fontSize: 13, color: "1d4ed8" } }], { x: 0.5, y: 0.15, w: 12.3, align: "center" });
    slide.addText(`FY ${selectedYear} Period ${selectedMonth} Consolidated Performance`, { x: 0.5, y: 0.35, w: 12.3, fontSize: 8.5, align: "center", color: "999999" });

    let rows = [[{ text: "Account Category", options: { bold: true, fill: "F3F4F6", color: "000000" } }, { text: "Period Actuals", options: { bold: true, fill: "F3F4F6", align: "right" } }, { text: "Year-to-Date", options: { bold: true, fill: "F3F4F6", align: "right" } }]];
    const pushSection = (title, sectionData) => {
      rows.push([{ text: title, options: { bold: true, color: "1d4ed8", italic: true, fill: "F9FAFB" } }, "", ""]);
      sectionData.items.forEach(item => rows.push([`    ${item.label}`, formatCurrency(item.period), formatCurrency(item.ytd)]));
      rows.push([{ text: `Total ${title}`, options: { bold: true } }, formatCurrency(sectionData.subtotalPeriod), formatCurrency(sectionData.subtotalYTD)]);
    };
    const pushMargin = (label, period, ytd) => {
      rows.push([{ text: label.toUpperCase(), options: { bold: true, fill: "DBEAFE" } }, formatCurrency(period), formatCurrency(ytd)]);
    };

    pushSection("Revenue", calculations.rev);
    pushSection("Direct Costs", calculations.dc);
    pushMargin("Gross Profit", calculations.grossProfitP, calculations.grossProfitY);
    pushSection("Equipment Purchase", calculations.equip);
    pushMargin("Net Income After Equip. Margin", calculations.netEquipP, calculations.netEquipY);
    pushSection("Cost of Operations", calculations.coo);
    pushMargin("Operating Margin", calculations.opMarginP, calculations.opMarginY);
    pushSection("Other Income & Expenses", calculations.other);
    pushMargin("Total Other Income & Expenses", calculations.otherIncomeTotalP, calculations.otherIncomeTotalY);
    rows.push([{ text: "COMPREHENSIVE INCOME", options: { bold: true, fill: "111827", color: "FFFFFF" } }, formatCurrency(calculations.compP), formatCurrency(calculations.compY)]);

    slide.addTable(rows, { x: 0.5, y: 0.6, w: 12.3, fontSize: 7.5, rowH: 0.17, border: { type: "solid", color: "E5E7EB", pt: 0.5 }, colW: [6.3, 3.0, 3.0] });
    pptx.writeFile({ fileName: `Sumaria_IS_Export_FY${selectedYear}_Pd${selectedMonth}.pptx` });
  };

  const RenderSection = ({ title, data, indent = true }) => (
    <div className="mb-10">
      <h3 className="text-blue-700 text-[11px] uppercase font-bold tracking-[0.3em] mb-4 border-b border-blue-100 pb-2 italic">{title}</h3>
      {data.items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 py-3 text-[14px] border-b border-slate-50 hover:bg-blue-50 transition-colors">
          <div className={`col-span-6 ${indent ? 'pl-10 border-l-2 border-blue-100' : 'pl-4'} text-slate-700 font-medium tracking-tight`}>{item.label}</div>
          <div className="col-span-3 text-right pr-16 tabular-nums font-semibold text-slate-800">{formatCurrency(item.period)}</div>
          <div className="col-span-3 text-right pr-8 tabular-nums font-semibold text-slate-800">{formatCurrency(item.ytd)}</div>
        </div>
      ))}
    </div>
  );

  const RenderMargin = ({ label, period, ytd, isFinal = false }) => (
    <div className={`grid grid-cols-12 py-5 mb-10 items-center transition-all px-6 rounded-lg ${isFinal ? 'bg-slate-900 text-white shadow-lg' : 'bg-blue-50 border border-blue-200 text-slate-900 shadow-sm'}`}>
      <div className="col-span-6 font-bold uppercase text-[12px] tracking-widest">{label}</div>
      <div className="col-span-3 text-right pr-10 tabular-nums text-[16px] font-bold">{formatCurrency(period)}</div>
      <div className="col-span-3 text-right pr-2 tabular-nums text-[16px] font-bold">{formatCurrency(ytd)}</div>
    </div>
  );

  return (
    <div className="w-full bg-[#f8fafc] p-4 md:p-10 min-h-screen font-sans">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print-area, #report-print-area * { visibility: visible !important; }
          #report-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 10px !important; box-shadow: none !important; border: none !important; }
          .no-print { display: none !important; }
        }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* Control Bar */}
      <div className="max-w-[98%] mx-auto mb-8 flex justify-between items-center no-print bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-row items-center gap-8">
          
          {/* DYNAMIC FISCAL YEAR FILTER */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-blue-600 mb-1">Fiscal Year</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="bg-blue-50 border border-blue-100 py-2 px-6 rounded-xl font-bold text-sm outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={availableYears.length === 0}
            >
              {availableYears.length === 0 ? (
                <option>Run Report First</option>
              ) : (
                availableYears.map(year => <option key={year} value={year}>FY {year}</option>)
              )}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase text-blue-600 mb-1">Reporting Period</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))} 
              className="bg-blue-50 border border-blue-100 py-2 px-6 rounded-xl font-bold text-sm outline-none cursor-pointer"
            >
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Period {i+1}</option>)}
            </select>
          </div>
          
          <button 
            onClick={handleRunReport} 
            disabled={loading} 
            className={`px-12 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all shadow-lg self-end ${loading ? 'bg-slate-100 text-slate-300 font-medium' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {loading ? 'Processing...' : 'Run Report'}
          </button>
        </div>

        <div className="flex flex-row items-center gap-4 self-end">
          <button 
            onClick={() => hasRun && handleExportPPT()} 
            className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-orange-600 text-white shadow-xl ${!hasRun || loading ? 'cursor-not-allowed' : 'hover:bg-orange-700 active:scale-95'}`}
          >
            Export PPT
          </button>
          <button 
            onClick={() => hasRun && window.print()} 
            className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all bg-slate-900 text-white shadow-xl ${!hasRun || loading ? 'cursor-not-allowed' : 'hover:bg-black active:scale-95'}`}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div id="report-print-area" className="max-w-[98%] mx-auto bg-white shadow-2xl rounded-[3rem] p-12 md:p-24 border border-slate-100 min-h-[90vh]">
        {hasRun && !loading && calculations ? (
          <div className="w-full">
            <header className="text-center mb-20">
              <h3 className="text-[42px] font-extralight uppercase tracking-[0.8em] text-slate-900">Science Systems & Applications, Inc.</h3>
              <div className="inline-block px-16 py-6 mt-12 bg-blue-50/80 rounded-full border border-blue-100">
                <h2 className="text-4xl font-light italic font-serif text-blue-800 tracking-wide">Income Statement</h2>
                <p className="text-sm mt-2 text-slate-500 tracking-widest uppercase">Fiscal Year {selectedYear} — Period {selectedMonth}</p>
              </div>
            </header>
            
            <RenderSection title="Revenue" data={calculations.rev} indent={false} />
            <RenderSection title="Direct Costs" data={calculations.dc} />
            <RenderMargin label="Gross Profit" period={calculations.grossProfitP} ytd={calculations.grossProfitY} />
            <RenderSection title="Equipment Purchase" data={calculations.equip} />
            <RenderMargin label="Net Income After Equip. Margin" period={calculations.netEquipP} ytd={calculations.netEquipY} />
            <RenderSection title="Cost of Operations" data={calculations.coo} />
            <RenderMargin label="Operating Margin" period={calculations.opMarginP} ytd={calculations.opMarginY} />
            <RenderSection title="Other Income & Expenses" data={calculations.other} />
            <RenderMargin label="Total Other Income & Expenses" period={calculations.otherIncomeTotalP} ytd={calculations.otherIncomeTotalY} />
            
            <footer className="mt-40 pt-16 border-t-[8px] border-double border-slate-900">
              <div className="grid grid-cols-12 font-bold text-slate-900 items-baseline px-4">
                <div className="col-span-6 text-2xl uppercase tracking-tighter">Comprehensive Income</div>
                <div className="col-span-3 text-right pr-16 tabular-nums text-3xl">{formatCurrency(calculations.compP)}</div>
                <div className="col-span-3 text-right pr-4 tabular-nums text-3xl">{formatCurrency(calculations.compY)}</div>
              </div>
            </footer>
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center text-slate-300">
            <p className="text-2xl font-light  tracking-[0.5em] text-blue-200">
              {loading ? 'Processing Data...' : 'Science Systems & Applications, Inc.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IS_Report;