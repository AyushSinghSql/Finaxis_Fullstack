// import React, { useMemo, useState, useEffect } from "react";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// // --- CONFIGURATION IMPORT ---
// // ⚠️ CRITICAL: Must be correctly set up in config.js
// import { backendUrl } from "./config"; 

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // --- API CONSTANTS (UNCHANGED) ---
// const ACTUAL_HOURS_API = "/api/ForecastReport/GetLabHSData"; 
// const AVAILABLE_HOURS_API = "/Orgnization/RefreshWorkingDaysForDuration"; 

// // --- COLOR CONSTANTS (UNCHANGED) ---
// const PRIMARY_TEAL = '#00A389';
// const SECONDARY_CORAL = '#FF7F50';
// const PERFORMANCE_INDIGO = '#4B0082';

// // --- HELPER FUNCTION: EXTRACT UNIQUE EMPLOYEE IDs (UNCHANGED) ---
// const getUniqueEmployees = (apiData) => {
//     if (!apiData || apiData.length === 0) {
//         return ['All'];
//     }
//     const employees = new Set();
//     apiData.forEach(item => {
//         if (item.emplId) {
//             employees.add(item.emplId);
//         }
//     });
//     return ['All', ...Array.from(employees).sort()];
// };

// // --- DATA TRANSFORMATION AND CALCULATION (FINAL LOGIC) ---
// const processData = (actualsData, capacityData, selectedEmployeeId) => {
//     // 1. Map Capacity Data for quick lookup (Key: YYYY-MM)
//     const capacityMap = new Map();
//     capacityData.forEach(item => {
//         const monthKey = `${item.year}-${String(item.monthNo).padStart(2, '0')}`;
//         capacityMap.set(monthKey, item.workingHours); 
//     });

//     // 2. Map Actuals Data (prepare for employee filtering and aggregation)
//     const mappedActuals = actualsData.map(item => {
//         const actualHours = item.actHrs || 0;
//         const dateObj = item.effectBillDt ? new Date(item.effectBillDt) : null;
        
//         const dateLabel = dateObj && !isNaN(dateObj)
//             ? dateObj.toLocaleDateString('en-US', {month: '2-digit', year: '2-digit'})
//             : 'N/A';
            
//         const capacityKey = dateObj && !isNaN(dateObj)
//             ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
//             : null;

//         return {
//             id: item.emplId,
//             date: dateLabel, 
//             direct: actualHours,       
//             capacityKey: capacityKey 
//         };
//     }).filter(item => item.date !== 'N/A');

//     // 3. Filter by selected Employee ID
//     const filteredData = selectedEmployeeId === "All"
//         ? mappedActuals
//         : mappedActuals.filter(item => item.id === selectedEmployeeId);

//     // 4. Aggregate data by Month/Year label (FIXED: Capacity not summed)
//     const aggregatedDataMap = filteredData.reduce((acc, item) => {
//         const date = item.date;
//         const capacityKey = item.capacityKey;

//         if (!acc[date]) {
//             acc[date] = { 
//                 direct: 0, 
//                 capacity: 0, 
//                 capacityKey: capacityKey 
//             };
//         }
        
//         acc[date].direct += item.direct;
        
//         if (acc[date].capacityKey) {
//              acc[date].capacity = capacityMap.get(acc[date].capacityKey) || 0;
//         }

//         return acc;
//     }, {});
    
//     // 5. Final calculation for chart arrays
//     let labels = [];
//     let directLabor = [];
//     let totalCapacity = []; 
//     let utilizationRate = []; 
    
//     const processedDates = Object.keys(aggregatedDataMap).sort((a, b) => {
//         const [aMonth, aYear] = a.split('/');
//         const [bMonth, bYear] = b.split('/');
//         return new Date(`20${aYear}-${aMonth}-01`) - new Date(`20${bYear}-${bMonth}-01`);
//     });

//     processedDates.forEach(date => {
//         const item = aggregatedDataMap[date];

//         labels.push(date);
        
//         const direct = item.direct;
//         const capacity = item.capacity; 

//         directLabor.push(direct);
//         totalCapacity.push(capacity); 
        
//         const totalLaborForUtilization = capacity; 
//         let utilization = 0;

//         if (totalLaborForUtilization > 0) {
//             utilization = (direct / totalLaborForUtilization) * 100;
//         }
        
//         utilizationRate.push(utilization); 
//     });

//     // --- LIMIT TO LAST 12 MONTHS (UNCHANGED) ---
//     const FRAME_LIMIT = 12;

//     labels = labels.slice(-FRAME_LIMIT);
//     directLabor = directLabor.slice(-FRAME_LIMIT);
//     totalCapacity = totalCapacity.slice(-FRAME_LIMIT); 
//     utilizationRate = utilizationRate.slice(-FRAME_LIMIT);
    
//     // Recalculate averages and axis max (UNCHANGED)
//     const totalDirect = directLabor.reduce((sum, val) => sum + val, 0);
//     const totalCapacitySum = totalCapacity.reduce((sum, val) => sum + val, 0);

//     const dataPointsCount = labels.length;
//     const avgDirect = dataPointsCount > 0 ? totalDirect / dataPointsCount : 0;
//     const avgCapacity = dataPointsCount > 0 ? totalCapacitySum / dataPointsCount : 0;
    
//     const avgUtilization = (totalCapacitySum > 0) ? (totalDirect / totalCapacitySum) * 100 : 0;

//     const maxDirect = Math.max(...directLabor, 0);
//     const maxCapacity = Math.max(...totalCapacity, 0);
//     const maxCombined = Math.max(maxDirect, maxCapacity); 

//     let hoursAxisMax = 250; 

//     if (maxCombined > 0) {
//         hoursAxisMax = Math.ceil(maxCombined * 1.10);
//         hoursAxisMax = Math.ceil(hoursAxisMax / 10) * 10;
//     }
    
//     let utilAxisMin = 80; 
//     let utilAxisMax = 100; 
    
//     if (utilizationRate.length > 0) {
//         const minVal = Math.min(...utilizationRate);
//         const maxVal = Math.max(...utilizationRate);
//         const buffer = 0.5;

//         utilAxisMin = Math.max(80, minVal - buffer); 
//         utilAxisMax = Math.min(100, maxVal + buffer); 
        
//         if (utilAxisMax - utilAxisMin < 1.5) {
//             const mean = (minVal + maxVal) / 2;
//             utilAxisMin = Math.max(80, mean - 0.75);
//             utilAxisMax = Math.min(100, mean + 0.75);
//         }
//     }
    
//     return { labels, directLabor, totalCapacity, utilizationRate, utilAxisMin, utilAxisMax, avgDirect, avgCapacity, avgUtilization, hoursAxisMax };
// };

// // --- ROBUST HELPER TO GET DATE RANGE (UNCHANGED) ---
// const getDateRange = (data) => {
//     if (!data || data.length === 0) return { startDate: null, endDate: null };
    
//     const validDates = data
//         .map(item => {
//             const date = new Date(item.effectBillDt);
//             return isNaN(date) ? null : date.getTime();
//         })
//         .filter(time => time !== null);

//     if (validDates.length === 0) return { startDate: null, endDate: null };

//     const minTime = Math.min(...validDates);
//     const maxTime = Math.max(...validDates);
    
//     // Format to YYYY-MM-DD
//     const formatDate = (timestamp) => new Date(timestamp).toISOString().split('T')[0];

//     return {
//         startDate: formatDate(minTime),
//         endDate: formatDate(maxTime)
//     };
// };

// // --- CHART OPTIONS and DATASET GENERATORS (FINALIZED FOR BAR/BAR PLOT) ---

// const getUtilizationChartOptions = (utilAxisMin, utilAxisMax, hoursAxisMax) => ({
//     responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Actual Hours (Bar) vs. Capacity (Line) and Utilization Trend' }, tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.dataset.yAxisID === 'y1') { label += context.parsed.y.toFixed(2) + '%'; } else { const value = context.parsed.y; return label + value.toFixed(0) + ' Hrs'; } return label; } } } },
//     scales: { y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Hours' }, beginAtZero: true, max: hoursAxisMax, grid: { drawOnChartArea: true }, ticks: { callback: function(value) { return value + ' Hrs'; } } }, y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Utilization (%)' }, min: utilAxisMin, max: utilAxisMax, grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return value.toFixed(2) + '%'; } } }, x: { title: { display: true, text: 'Fiscal Year Sub-Periods' } } }
// });

// const getHoursChartOptions = (hoursAxisMax) => ({
//     responsive: true, 
//     maintainAspectRatio: false, 
//     plugins: { 
//         legend: { position: 'bottom' }, 
//         title: { display: true, text: 'Actual Hours vs. Available Hours (Capacity)' }, 
//         tooltip: { 
//             callbacks: { 
//                 label: function(context) { 
//                     let label = context.dataset.label || ''; 
//                     if (label) { label += ': '; } 
//                     const value = context.parsed.y; 
//                     return label + value.toFixed(0) + ' Hrs'; 
//                 } 
//             } 
//         } 
//     }, 
//     scales: { 
//         y: { 
//             type: 'linear', 
//             display: true, 
//             position: 'left', 
//             title: { display: true, text: 'Labor Units (Hrs)' }, 
//             beginAtZero: true, 
//             max: hoursAxisMax, 
//             ticks: { callback: function(value) { return value + ' Hrs'; } } 
//         }, 
//         x: { 
//             title: { display: true, text: 'Fiscal Year Sub-Periods' } 
//         } 
//     },
//     // IMPORTANT: Stacks are used here to group bars side-by-side (Grouped Bar Chart)
//     datasets: {
//         bar: {
//             stack: 'combined', 
//             barPercentage: 0.9,
//             categoryPercentage: 0.8
//         }
//     }
// });

// const getUtilizationChartData = (labels, directLabor, totalCapacity, utilizationRate, avgUtilization) => {
//     const avgUtilData = labels.map(() => avgUtilization); return { labels, datasets: [ 
//         { label: `Avg Utilization (${avgUtilization.toFixed(2)}%)`, borderColor: PERFORMANCE_INDIGO, data: avgUtilData, borderDash: [5, 5], yAxisID: 'y1', type: 'line', tension: 0, pointRadius: 0, fill: false, order: 0, }, 
//         { label: 'Utilization (%)', borderColor: PERFORMANCE_INDIGO, backgroundColor: 'rgba(75, 0, 130, 0.2)', data: utilizationRate, yAxisID: 'y1', type: 'line', tension: 0.4, pointStyle: 'diamond', pointRadius: 6, fill: false, order: 1, }, 
//         { label: 'Actual Hours (Hrs)', data: directLabor, backgroundColor: PRIMARY_TEAL, yAxisID: 'y', type: 'bar', order: 2 }, 
//         { label: 'Available Hours (Capacity)', data: totalCapacity, borderColor: SECONDARY_CORAL, yAxisID: 'y', type: 'line', pointRadius: 4, pointStyle: 'circle', tension: 0.1, order: 1 }, 
//     ], };
// };

// const getHoursChartData = (labels, directLabor, totalCapacity, avgDirect, avgCapacity) => {
//     const avgDirectData = labels.map(() => avgDirect); 
//     const avgCapacityData = labels.map(() => avgCapacity);
    
//     return { labels, datasets: [ 
//         { 
//             label: 'Actual Hours', 
//             data: directLabor, 
//             backgroundColor: PRIMARY_TEAL, 
//             yAxisID: 'y', 
//             type: 'bar', 
//             order: 2,
//             stack: 'actual_capacity_group' // Group bars side-by-side
//         }, 
//         { 
//             label: 'Available Hours (Capacity)', 
//             data: totalCapacity, 
//             backgroundColor: SECONDARY_CORAL, 
//             yAxisID: 'y', 
//             type: 'bar', 
//             order: 2,
//             stack: 'actual_capacity_group' // Group bars side-by-side
//         },
//         { 
//             label: `Avg Available Hours (${avgCapacity.toFixed(0)} Hrs)`, 
//             borderColor: SECONDARY_CORAL, 
//             data: avgCapacityData, 
//             borderDash: [5, 5], 
//             yAxisID: 'y', 
//             type: 'line', 
//             tension: 0, 
//             pointRadius: 0, 
//             fill: false, 
//             order: 1,
//         }, 
//         { 
//             label: `Avg Actual Hours (${avgDirect.toFixed(0)} Hrs)`, 
//             borderColor: PRIMARY_TEAL, 
//             data: avgDirectData, 
//             borderDash: [5, 5], 
//             yAxisID: 'y', 
//             type: 'line', 
//             tension: 0, 
//             pointRadius: 0, 
//             fill: false, 
//             order: 1, 
//         }, 
//     ], };
// };

// const NoDataMessage = ({ isLoading, error }) => {
//     let message = 'No data available for this chart.';
//     if (isLoading) message = 'Loading chart data...';
//     if (error) message = error;

//     return (
//         <div className="flex items-center justify-center h-full text-gray-500">
//             {message}
//         </div>
//     );
// };

// // --- MAIN UTILIZATION CHART COMPONENT ---
// const UtilizationChart = () => {
//     const [activeTab, setActiveTab] = useState('actualAvailable'); 
//     const [selectedEmployeeId, setSelectedEmployeeId] = useState('All'); 
    
//     const [actualsData, setActualsData] = useState([]);
//     const [capacityData, setCapacityData] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // 1. Fetch Actual Hours Data
//     useEffect(() => {
//         const fetchActuals = async () => {
//             setIsLoading(true);
//             setError(null);
            
//             let actualsUrl;
//             try {
//                 // --- CRITICAL CHANGE: USE DYNAMIC BACKEND URL ---
//                 actualsUrl = `${backendUrl}${ACTUAL_HOURS_API}`;
//             } catch (e) {
//                 setError("Configuration Error: The 'backendUrl' variable is missing or invalid in config.js. Check file setup.");
//                 setIsLoading(false);
//                 return;
//             }

//             try {
//                 const response = await fetch(actualsUrl); 
//                 if (!response.ok) { throw new Error(`Actuals HTTP error! status: ${response.status}`); }
//                 const data = await response.json();
                
//                 setActualsData(Array.isArray(data) ? data : []);
                
//             } catch (err) {
//                 setError(`Failed to load Actual Hours: ${err.message}. Check API URL: ${actualsUrl}`);
//                 console.error("Error fetching Actuals data:", err);
//                 setActualsData([]);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         fetchActuals();
//     }, []); 
    
//     // 2. Fetch Available Hours (Capacity) Data using the date range from Actuals
//     useEffect(() => {
//         if (actualsData.length === 0) return;

//         const { startDate, endDate } = getDateRange(actualsData);
//         if (!startDate || !endDate) {
//             console.warn("Could not determine a valid date range from actuals data.");
//             return;
//         }

//         const fetchCapacity = async () => {
//             let capacityUrl;
//             try {
//                 capacityUrl = `${backendUrl}${AVAILABLE_HOURS_API}/${startDate}/${endDate}`;
//             } catch (e) {
//                 return;
//             }
            
//             try {
//                 const response = await fetch(capacityUrl); 
//                 if (!response.ok) { throw new Error(`Capacity HTTP error! status: ${response.status}`); }
//                 const data = await response.json();
                
//                 setCapacityData(Array.isArray(data) ? data : []);
                
//             } catch (err) {
//                 console.error("Error fetching Capacity data:", err);
//                 setCapacityData([]); 
//             }
//         };

//         fetchCapacity();
//     }, [actualsData]); 

//     // 3. Generate unique Employee IDs based on fetched data
//     const uniqueEmployees = useMemo(() => getUniqueEmployees(actualsData), [actualsData]);

//     // 4. Process Data 
//     const { 
//         labels, 
//         directLabor, 
//         totalCapacity, 
//         utilizationRate, 
//         utilAxisMin, 
//         utilAxisMax,
//         avgDirect,
//         avgCapacity, 
//         avgUtilization,
//         hoursAxisMax 
//     } = useMemo(() => {
//         if (selectedEmployeeId !== 'All' && !uniqueEmployees.includes(selectedEmployeeId)) {
//             setSelectedEmployeeId('All'); 
//         }
//         return processData(actualsData, capacityData, selectedEmployeeId); 
//     }, [actualsData, capacityData, selectedEmployeeId, uniqueEmployees]); 

//     // 5. Prepare Chart Data and Options (Memoized for performance)
//     const utilizationChartOptions = useMemo(() => 
//         getUtilizationChartOptions(utilAxisMin, utilAxisMax, hoursAxisMax), 
//         [utilAxisMin, utilAxisMax, hoursAxisMax]
//     );
//     const hoursChartOptions = useMemo(() => getHoursChartOptions(hoursAxisMax), [hoursAxisMax]); 

//     const utilizationChartData = useMemo(() => 
//         getUtilizationChartData(labels, directLabor, totalCapacity, utilizationRate, avgUtilization), 
//         [labels, directLabor, totalCapacity, utilizationRate, avgUtilization]
//     );

//     const hoursChartData = useMemo(() => 
//         getHoursChartData(labels, directLabor, totalCapacity, avgDirect, avgCapacity), 
//         [labels, directLabor, totalCapacity, avgDirect, avgCapacity]
//     );

//     // 6. Conditional Rendering Logic
//     const ChartToDisplay = useMemo(() => {
//         if (isLoading || error) {
//             return <NoDataMessage isLoading={isLoading} error={error} />;
//         }
        
//         if (actualsData.length === 0 || labels.length === 0) {
//              const message = actualsData.length === 0 
//                 ? "No Actual Hours data loaded from API."
//                 : "No valid data to display after processing (check filter or dates).";

//              return <NoDataMessage isLoading={false} error={message} />;
//         }
        
//         if (activeTab === 'costUtilization') {
//             return <Bar options={utilizationChartOptions} data={utilizationChartData} />;
//         } else if (activeTab === 'actualAvailable') {
//             return <Bar options={hoursChartOptions} data={hoursChartData} />;
//         }
//         return <NoDataMessage />;
//     }, [activeTab, isLoading, error, labels, utilizationChartOptions, utilizationChartData, hoursChartOptions, hoursChartData, actualsData, capacityData]);

//     const getTabClasses = (tabName) => 
//         `px-4 py-2 font-semibold border-b-2 cursor-pointer transition-colors duration-200 ${
//             activeTab === tabName 
//                 ? 'border-blue-600 text-blue-600' 
//                 : 'border-transparent text-gray-500 hover:text-gray-700'
//         }`;

//     return (
//         <div className="p-4 bg-white rounded-lg shadow w-full">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">
//                 Labor Analysis Dashboard
//             </h2>

//             {/* Employee Filter */}
//             <div className="flex items-center space-x-4 mb-6">
//                 <label htmlFor="employee-filter" className="font-semibold text-gray-700">
//                     Employee Filter:
//                 </label>
//                 <select
//                     id="employee-filter"
//                     value={selectedEmployeeId}
//                     onChange={(e) => setSelectedEmployeeId(e.target.value)}
//                     className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
//                     disabled={isLoading || error || actualsData.length === 0}
//                 >
//                     {uniqueEmployees.map(id => (
//                         <option key={id} value={id}>
//                             {id === "All" ? "All Employees" : `${id}`}
//                         </option>
//                     ))}
//                 </select>
//             </div>
            
//             {/* Tab Navigation */}
//             <div className="flex border-b mb-6">
//                 <div 
//                     className={getTabClasses('costUtilization')} 
//                     onClick={() => setActiveTab('costUtilization')}
//                 >
//                     Labor Cost & Utilization (Actual Bar & Capacity Line)
//                 </div>
//                 <div 
//                     className={getTabClasses('actualAvailable')} 
//                     onClick={() => setActiveTab('actualAvailable')}
//                 >
//                     Actual Bar vs. Available Hours Bar
//                 </div>
//             </div>

//             {/* Chart Container */}
//             <div id="labor-chart-container" style={{ height: '500px', width: '100%' }}>
//                 {ChartToDisplay}
//             </div>

//             <p className="text-sm text-gray-600 mt-4 pt-2 border-t">
//                 Current Hours Y-axis Max: {hoursAxisMax.toFixed(0)} Hrs. Data is filtered to the last 12 periods.
//             </p>
//         </div>
//     );
// };

// export default UtilizationChart;



// import React, { useMemo, useState, useEffect, useRef } from "react";
// import { Bar } from "react-chartjs-2";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// import { backendUrl } from "./config"; 

// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// const ACTUAL_HOURS_API = "/api/ForecastReport/GetLabHSData"; 
// const AVAILABLE_HOURS_API = "/Orgnization/RefreshWorkingDaysForDuration"; 

// const PRIMARY_TEAL = '#00A389';
// const SECONDARY_CORAL = '#FF7F50';

// const processData = (actualsData, capacityData, selectedEmployeeId, selectedYear) => {
//     if (!actualsData.length) return { labels: [], directLabor: [], totalCapacity: [], avgDirect: 0, avgCapacity: 0, hoursAxisMax: 100 };

//     const totalEmployeeCount = new Set(actualsData.map(item => item.emplId)).size;
    
//     const capacityMap = new Map();
//     capacityData.forEach(item => {
//         const monthKey = `${item.year}-${String(item.monthNo).padStart(2, '0')}`;
//         const baseHours = item.workingHours || 0;
//         capacityMap.set(monthKey, selectedEmployeeId === "All" ? baseHours * totalEmployeeCount : baseHours); 
//     });

//     const mappedActuals = actualsData.map(item => {
//         const dateObj = item.effectBillDt ? new Date(item.effectBillDt) : null;
//         if (!dateObj || isNaN(dateObj)) return null;
        
//         return {
//             id: item.emplId,
//             year: dateObj.getFullYear(),
//             month: dateObj.getMonth() + 1,
//             dateLabel: dateObj.toLocaleDateString('en-US', {month: '2-digit', year: '2-digit'}),
//             direct: item.actHrs || 0,
//             capacityKey: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
//         };
//     }).filter(item => item !== null);

//     const filteredByFilters = mappedActuals.filter(item => {
//         const matchEmp = selectedEmployeeId === "All" || item.id === selectedEmployeeId;
//         const matchYear = selectedYear === "All" || item.year.toString() === selectedYear;
//         return matchEmp && matchYear;
//     });

//     const aggregatedDataMap = filteredByFilters.reduce((acc, item) => {
//         if (!acc[item.dateLabel]) acc[item.dateLabel] = { direct: 0, capacity: 0, capacityKey: item.capacityKey };
//         acc[item.dateLabel].direct += item.direct;
//         acc[item.dateLabel].capacity = capacityMap.get(item.capacityKey) || 0;
//         return acc;
//     }, {});
    
//     const labels = Object.keys(aggregatedDataMap).sort((a, b) => {
//         const [aM, aY] = a.split('/'); const [bM, bY] = b.split('/');
//         return new Date(`20${aY}-${aM}-01`) - new Date(`20${bY}-${bM}-01`);
//     });

//     const directLabor = labels.map(l => aggregatedDataMap[l].direct);
//     const totalCapacity = labels.map(l => aggregatedDataMap[l].capacity); 
//     const avgDirect = labels.length > 0 ? directLabor.reduce((a, b) => a + b, 0) / labels.length : 0;
//     const avgCapacity = labels.length > 0 ? totalCapacity.reduce((a, b) => a + b, 0) / labels.length : 0;
//     const hoursAxisMax = Math.ceil(Math.max(...directLabor, ...totalCapacity, 10) * 1.15 / 10) * 10;

//     return { labels, directLabor, totalCapacity, avgDirect, avgCapacity, hoursAxisMax };
// };

// const UtilizationChart = () => {
//     const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');
//     const [searchTerm, setSearchTerm] = useState('All');
//     const [selectedYear, setSelectedYear] = useState('All');
//     const [showDropdown, setShowDropdown] = useState(false);
//     const [showToast, setShowToast] = useState(false);
//     const [actualsData, setActualsData] = useState([]);
//     const [capacityData, setCapacityData] = useState([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [reportGenerated, setReportGenerated] = useState(false);
    
//     const dropdownRef = useRef(null);
//     const reportRef = useRef(null);

//     useEffect(() => {
//         if (reportGenerated) setShowToast(false);
//     }, [reportGenerated]);

//     const uniqueEmployees = useMemo(() => {
//         const employees = new Set(actualsData.map(item => item.emplId).filter(Boolean));
//         return ['All', ...Array.from(employees).sort()];
//     }, [actualsData]);

//     const uniqueYears = useMemo(() => {
//         const years = new Set(actualsData.map(item => new Date(item.effectBillDt).getFullYear()).filter(y => !isNaN(y)));
//         return ['All', ...Array.from(years).sort((a,b) => b-a).map(String)];
//     }, [actualsData]);

//     const handleRunReport = async () => {
//         setIsLoading(true);
//         setReportGenerated(false);
//         setShowToast(false);
//         try {
//             const actualsRes = await fetch(`${backendUrl}${ACTUAL_HOURS_API}`);
//             const actuals = await actualsRes.json();
//             setActualsData(actuals);

//             const validDates = actuals.map(i => new Date(i.effectBillDt).getTime()).filter(t => !isNaN(t));
//             const start = new Date(Math.min(...validDates)).toISOString().split('T')[0];
//             const end = new Date(Math.max(...validDates)).toISOString().split('T')[0];

//             const capRes = await fetch(`${backendUrl}${AVAILABLE_HOURS_API}/${start}/${end}`);
//             const capacity = await capRes.json();
//             setCapacityData(capacity);
//             setReportGenerated(true);
//         } catch (err) {
//             console.error("Fetch failed", err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleExportPDF = async () => {
//         if (!reportGenerated || !reportRef.current) return;
        
//         try {
//             // Manual cleanup of DOM before capture to avoid oklch errors
//             const canvas = await html2canvas(reportRef.current, {
//                 scale: 2,
//                 useCORS: true,
//                 backgroundColor: "#ffffff",
//                 logging: false,
//                 onclone: (clonedDoc) => {
//                     const elements = clonedDoc.getElementsByTagName("*");
//                     for (let i = 0; i < elements.length; i++) {
//                         // Force convert any modern CSS color to standard HEX
//                         elements[i].style.color = "#334155"; 
//                         elements[i].style.borderColor = "#e2e8f0";
//                     }
//                 }
//             });

//             const imgData = canvas.toDataURL('image/png');
//             const pdf = new jsPDF('l', 'mm', 'a4');
//             const pdfWidth = pdf.internal.pageSize.getWidth();
//             const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
//             pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
//             pdf.save(`Utilization_Report_${selectedEmployeeId}.pdf`);
//         } catch (err) {
//             console.error("PDF Export Error:", err);
//             alert("Error generating PDF. Please ensure you have run the report first.");
//         }
//     };

//     const stats = useMemo(() => processData(actualsData, capacityData, selectedEmployeeId, selectedYear), 
//                              [actualsData, capacityData, selectedEmployeeId, selectedYear]);

//     return (
//         <div className="w-full bg-[#f8fafc] min-h-screen p-6" style={{ color: '#334155' }}>
            
//             {showToast && (
//                 <div 
//                     onClick={() => setShowToast(false)}
//                     className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] bg-[#ea580c] text-white px-10 py-5 rounded-full shadow-2xl font-bold border-4 border-white cursor-pointer animate-bounce"
//                 >
//                     ⚠️ PLEASE CLICK 'RUN ANALYSIS REPORT' FIRST
//                 </div>
//             )}

//             <div className="w-full space-y-4">
//                 {/* Control Bar - Excluded from PDF naturally by not being in reportRef */}
//                 <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
//                     <div>
//                         <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Labor Utilization Dashboard</h1>
//                         <p className="text-xs text-slate-400 uppercase tracking-widest">Performance Tracking v2.0</p>
//                     </div>
//                     <div className="flex gap-4">
//                         {reportGenerated && (
//                             <button onClick={handleExportPDF} className="bg-slate-800 hover:bg-black text-white px-8 py-3 rounded-lg font-medium text-xs transition-all uppercase tracking-widest active:scale-95 shadow-lg">
//                                 Export PDF
//                             </button>
//                         )}
//                         <button onClick={handleRunReport} disabled={isLoading} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-3 rounded-lg font-medium text-xs transition-all uppercase tracking-widest active:scale-95 shadow-lg disabled:bg-slate-300">
//                             {isLoading ? 'Processing...' : 'Run Analysis Report'}
//                         </button>
//                     </div>
//                 </div>

//                 {/* Report Section - Ref for PDF Export */}
//                 <div ref={reportRef} className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 w-full overflow-hidden">
//                     <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-slate-100 pb-8">
//                         <div>
//                             <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Monthly Hours Comparison</h2>
//                             <p className="text-slate-500 italic">Actual Hours vs. Available Capacity</p>
//                         </div>

//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:w-1/2">
//                             {/* Personnel Search */}
//                             <div className="relative" ref={dropdownRef}>
//                                 <label className="text-[10px] uppercase text-slate-400 tracking-widest mb-1 block">Personnel Filter</label>
//                                 <input
//                                     type="text"
//                                     value={searchTerm}
//                                     onFocus={() => { if (!reportGenerated) setShowToast(true); else setShowDropdown(true); }}
//                                     onChange={(e) => { setSearchTerm(e.target.value); if (reportGenerated) setShowDropdown(true); }}
//                                     className="w-full p-3 bg-[#fdfdfd] border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-700"
//                                 />
//                                 {showDropdown && reportGenerated && (
//                                     <div className="absolute z-[99] w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
//                                         {uniqueEmployees.filter(e => e.toLowerCase().includes(searchTerm.toLowerCase())).map(id => (
//                                             <div key={id} onClick={() => { setSelectedEmployeeId(id); setSearchTerm(id); setShowDropdown(false); }} className="px-5 py-3 hover:bg-slate-50 cursor-pointer text-xs text-slate-600 border-b last:border-0">{id}</div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>

//                             {/* Year Selector */}
//                             <div>
//                                 <label className="text-[10px] uppercase text-slate-400 tracking-widest mb-1 block">Fiscal Year</label>
//                                 <select 
//                                     value={selectedYear} 
//                                     onChange={(e) => setSelectedYear(e.target.value)}
//                                     className="w-full p-3 bg-[#fdfdfd] border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-700 cursor-pointer"
//                                 >
//                                     {uniqueYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Data' : `FY ${year}`}</option>)}
//                                 </select>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Chart Box */}
//                     <div className="relative w-full mb-10" style={{ height: '600px' }}>
//                         {!reportGenerated && !isLoading && (
//                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
//                                 <p className="text-slate-300 uppercase italic tracking-tighter text-xl">Awaiting Report Execution</p>
//                             </div>
//                         )}
                        
//                         {reportGenerated && (
//                             <Bar 
//                                 options={{
//                                     responsive: true,
//                                     maintainAspectRatio: false,
//                                     plugins: { 
//                                         legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 30 } }
//                                     },
//                                     scales: { 
//                                         y: { beginAtZero: true, max: stats.hoursAxisMax, grid: { color: '#f1f5f9' } },
//                                         x: { grid: { display: false } }
//                                     }
//                                 }}
//                                 data={{
//                                     labels: stats.labels,
//                                     datasets: [
//                                         { label: 'ACTUAL HOURS', data: stats.directLabor, backgroundColor: '#00A389', borderRadius: 4 },
//                                         { label: 'AVAILABLE CAPACITY', data: stats.totalCapacity, backgroundColor: '#FF7F50', borderRadius: 4 },
//                                         { label: 'AVG ACTUAL', data: stats.labels.map(() => stats.avgDirect), borderColor: '#00A389', borderDash: [6, 4], type: 'line', pointRadius: 0, fill: false },
//                                         { label: 'AVG CAPACITY', data: stats.labels.map(() => stats.avgCapacity), borderColor: '#FF7F50', borderDash: [6, 4], type: 'line', pointRadius: 0, fill: false }
//                                     ]
//                                 }} 
//                             />
//                         )}
//                     </div>

//                     {/* Data Summary Grid */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-100 text-center">
//                         <div>
//                             <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Avg. Monthly Actual</p>
//                             <p className="text-3xl font-bold text-[#00A389]">{stats.avgDirect.toFixed(0)} <span className="text-sm font-normal">hrs</span></p>
//                         </div>
//                         <div>
//                             <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Avg. Monthly Capacity</p>
//                             <p className="text-3xl font-bold text-[#FF7F50]">{stats.avgCapacity.toFixed(0)} <span className="text-sm font-normal">hrs</span></p>
//                         </div>
//                         <div>
//                             <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Utilization %</p>
//                             <p className="text-3xl font-bold text-blue-600">
//                                 {stats.avgCapacity > 0 ? ((stats.avgDirect / stats.avgCapacity) * 100).toFixed(1) : 0}%
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default UtilizationChart;



import React, { useMemo, useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { FaPlay } from 'react-icons/fa';

import { backendUrl } from "./config"; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const ACTUAL_HOURS_API = "/api/ForecastReport/GetLabHSData"; 
const AVAILABLE_HOURS_API = "/Orgnization/RefreshWorkingDaysForDuration"; 
const ALL_EMPLOYEES_API = "/Employee/GetAllEmployees";

const PRIMARY_TEAL = '#00A389';
const SECONDARY_CORAL = '#FF7F50';

const processData = (actualsData, capacityData, selectedEmployeeId, selectedYear) => {
    if (!actualsData.length) return { labels: [], directLabor: [], totalCapacity: [], avgDirect: 0, avgCapacity: 0, hoursAxisMax: 100 };

    const totalEmployeeCount = new Set(actualsData.map(item => item.emplId)).size;
    
    const capacityMap = new Map();
    capacityData.forEach(item => {
        const monthKey = `${item.year}-${String(item.monthNo).padStart(2, '0')}`;
        const baseHours = item.workingHours || 0;
        // Multiply capacity by employee count if "All" is selected
        capacityMap.set(monthKey, selectedEmployeeId === "All" ? baseHours * totalEmployeeCount : baseHours); 
    });

    const mappedActuals = actualsData.map(item => {
        const dateObj = item.effectBillDt ? new Date(item.effectBillDt) : null;
        if (!dateObj || isNaN(dateObj)) return null;
        
        return {
            id: item.emplId,
            year: dateObj.getFullYear(),
            month: dateObj.getMonth() + 1,
            dateLabel: dateObj.toLocaleDateString('en-US', {month: '2-digit', year: '2-digit'}),
            direct: item.actHrs || 0,
            capacityKey: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
        };
    }).filter(item => item !== null);

    const filteredByFilters = mappedActuals.filter(item => {
        const matchEmp = selectedEmployeeId === "All" || item.id === selectedEmployeeId;
        const matchYear = selectedYear === "All" || item.year.toString() === selectedYear;
        return matchEmp && matchYear;
    });

    const aggregatedDataMap = filteredByFilters.reduce((acc, item) => {
        if (!acc[item.dateLabel]) acc[item.dateLabel] = { direct: 0, capacity: 0, capacityKey: item.capacityKey };
        acc[item.dateLabel].direct += item.direct;
        acc[item.dateLabel].capacity = capacityMap.get(item.capacityKey) || 0;
        return acc;
    }, {});
    
    const labels = Object.keys(aggregatedDataMap).sort((a, b) => {
        const [aM, aY] = a.split('/'); const [bM, bY] = b.split('/');
        return new Date(`20${aY}-${aM}-01`) - new Date(`20${bY}-${bM}-01`);
    });

    const directLabor = labels.map(l => aggregatedDataMap[l].direct);
    const totalCapacity = labels.map(l => aggregatedDataMap[l].capacity); 
    const avgDirect = labels.length > 0 ? directLabor.reduce((a, b) => a + b, 0) / labels.length : 0;
    const avgCapacity = labels.length > 0 ? totalCapacity.reduce((a, b) => a + b, 0) / labels.length : 0;
    const hoursAxisMax = Math.ceil(Math.max(...directLabor, ...totalCapacity, 10) * 1.15 / 10) * 10;

    return { labels, directLabor, totalCapacity, avgDirect, avgCapacity, hoursAxisMax };
};

const UtilizationChart = () => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');
    const [searchTerm, setSearchTerm] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showToast, setShowToast] = useState(false);
    
    const [actualsData, setActualsData] = useState([]);
    const [capacityData, setCapacityData] = useState([]);
    const [masterEmployees, setMasterEmployees] = useState([]); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    
    const dropdownRef = useRef(null);
    const reportRef = useRef(null);

    // Ensure toast disappears when report is generated
    useEffect(() => {
        if (reportGenerated) setShowToast(false);
    }, [reportGenerated]);

    const uniqueYears = useMemo(() => {
        const years = new Set(actualsData.map(item => new Date(item.effectBillDt).getFullYear()).filter(y => !isNaN(y)));
        return ['All', ...Array.from(years).sort((a,b) => b-a).map(String)];
    }, [actualsData]);

    // Robust Employee Search Mapping (Fixed "undefined" and missing name parts)
    const employeeOptions = useMemo(() => {
        const idsFromActuals = new Set(actualsData.map(item => item.emplId).filter(Boolean));
        
        const list = Array.from(idsFromActuals).map(id => {
            const master = masterEmployees.find(m => m.emplId === id);
            
            if (!master) return { id: id, label: id };

            const fName = master.firstName?.trim() || "";
            const lName = master.lastName?.trim() || "";
            
            // Filter out empty strings and join with a comma only if both exist
            const fullName = [lName, fName].filter(Boolean).join(", ");

            return {
                id: id,
                label: fullName ? `${id} - ${fullName}` : id
            };
        }).sort((a, b) => a.id.localeCompare(b.id));

        return [{ id: 'All', label: 'All Employees' }, ...list];
    }, [actualsData, masterEmployees]);

    const handleRunReport = async () => {
        setIsLoading(true);
        setReportGenerated(false);
        setShowToast(false);
        try {
            const [actualsRes, employeesRes] = await Promise.all([
                fetch(`${backendUrl}${ACTUAL_HOURS_API}`),
                fetch(`${backendUrl}${ALL_EMPLOYEES_API}`)
            ]);
            
            const actuals = await actualsRes.json();
            const employees = await employeesRes.json();
            
            setActualsData(actuals);
            setMasterEmployees(Array.isArray(employees) ? employees : []);

            const validDates = actuals.map(i => new Date(i.effectBillDt).getTime()).filter(t => !isNaN(t));
            if (validDates.length > 0) {
                const start = new Date(Math.min(...validDates)).toISOString().split('T')[0];
                const end = new Date(Math.max(...validDates)).toISOString().split('T')[0];

                const capRes = await fetch(`${backendUrl}${AVAILABLE_HOURS_API}/${start}/${end}`);
                const capacity = await capRes.json();
                setCapacityData(capacity);
            }
            
            setReportGenerated(true);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportGenerated || !reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    // Manual CSS override to prevent "oklch" errors in html2canvas
                    const elements = clonedDoc.getElementsByTagName("*");
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].style.color = "#334155";
                        elements[i].style.borderColor = "#e2e8f0";
                    }
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Utilization_Report_${selectedEmployeeId}.pdf`);
        } catch (err) { 
            console.error(err);
            alert("Error creating PDF. Please ensure you have run the report first.");
        }
    };

    const stats = useMemo(() => processData(actualsData, capacityData, selectedEmployeeId, selectedYear), 
                             [actualsData, capacityData, selectedEmployeeId, selectedYear]);

    return (
        <div className="w-full bg-[#f8fafc] min-h-screen p-0 md:p-6" style={{ color: '#334155', fontFamily: 'Arial, sans-serif' }}>
            
            {showToast && (
                <div 
                    onClick={() => setShowToast(false)}
                    className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] bg-[#ea580c] text-white px-10 py-5 rounded-full shadow-2xl font-medium border-4 border-white cursor-pointer animate-bounce"
                >
                    ⚠️ PLEASE CLICK 'RUN ANALYSIS REPORT' FIRST
                </div>
            )}

            <div className="w-full space-y-4">
                {/* Dashboard Controls */}
                <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Labor Utilization Dashboard</h1>
                        {/* <p className="text-xs text-slate-400 uppercase tracking-widest">Performance Metrics 2026</p> */}
                    </div>
                    <div className="flex gap-4">
                        {reportGenerated && (
                            <button onClick={handleExportPDF} className="bg-slate-800 hover:bg-black text-white px-8 py-3 rounded-lg text-xs transition-all uppercase tracking-widest shadow-lg">
                                Export PDF
                            </button>
                        )}
                        <button onClick={handleRunReport} disabled={isLoading} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-3 rounded-lg text-xs transition-all uppercase tracking-widest shadow-lg disabled:bg-slate-300">
                                      
                            {isLoading ? 'Processing...' : 'Run Report'}
                        </button>
                    </div>
                </div>

                {/* Main Report Container */}
                <div ref={reportRef} className="bg-white p-10 rounded-xl shadow-sm border border-slate-200 w-full overflow-hidden">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 border-b border-slate-100 pb-8">
                        <div>
                            {/* <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Monthly Hours Comparison</h2> */}
                            <p className="text-slate-500 italic">Actual hours vs.Available hours capacity</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full lg:w-1/2">
                            {/* Searchable Input */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="text-[10px] uppercase text-slate-400 tracking-widest mb-1 block">Employee ID & Name</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onFocus={() => { if (!reportGenerated) setShowToast(true); else setShowDropdown(true); }}
                                    onChange={(e) => { setSearchTerm(e.target.value); if (reportGenerated) setShowDropdown(true); }}
                                    className="w-full p-3 bg-[#fdfdfd] border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-700 font-normal"
                                />
                                {showDropdown && reportGenerated && (
                                    <div className="absolute z-[99] w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {employeeOptions.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase())).map(opt => (
                                            <div key={opt.id} onClick={() => { setSelectedEmployeeId(opt.id); setSearchTerm(opt.label); setShowDropdown(false); }} className="px-5 py-3 hover:bg-slate-50 cursor-pointer text-xs font-normal text-slate-600 border-b last:border-0">{opt.label}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Year Selector */}
                            <div>
                                <label className="text-[10px] uppercase text-slate-400 tracking-widest mb-1 block">Fiscal Year</label>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full p-3 bg-[#fdfdfd] border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-700 cursor-pointer font-normal">
                                    {uniqueYears.map(year => <option key={year} value={year}>{year === 'All' ? 'Full Period' : `FY ${year}`}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chart Frame */}
                    <div className="relative w-full mb-10" style={{ height: '600px' }}>
                        {!reportGenerated && !isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                {/* <p className="text-slate-300 uppercase italic text-xl font-normal">System Awaiting Initialization</p> */}
                            </div>
                        )}
                        {reportGenerated && (
                            <Bar 
                                options={{
                                    responsive: true, maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom', labels: { padding: 30, font: { size: 12 } } } },
                                    scales: { y: { beginAtZero: true, max: stats.hoursAxisMax, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                                }}
                                data={{
                                    labels: stats.labels,
                                    datasets: [
                                        { label: 'ACTUAL HOURS', data: stats.directLabor, backgroundColor: '#00A389', borderRadius: 4 },
                                        { label: 'AVAILABLE CAPACITY', data: stats.totalCapacity, backgroundColor: '#FF7F50', borderRadius: 4 },
                                        { label: 'AVG ACTUAL', data: stats.labels.map(() => stats.avgDirect), borderColor: '#00A389', borderDash: [6, 4], type: 'line', pointRadius: 0, fill: false },
                                        { label: 'AVG CAPACITY', data: stats.labels.map(() => stats.avgCapacity), borderColor: '#FF7F50', borderDash: [6, 4], type: 'line', pointRadius: 0, fill: false }
                                    ]
                                }} 
                            />
                        )}
                    </div>

                    {/* Footer Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-100 text-center">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Avg Monthly Actual</p>
                            <p className="text-3xl font-medium text-[#00A389]">{stats.avgDirect.toFixed(0)} <span className="text-sm font-normal">hrs</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Avg Monthly Capacity</p>
                            <p className="text-3xl font-medium text-[#FF7F50]">{stats.avgCapacity.toFixed(0)} <span className="text-sm font-normal">hrs</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Utilization %</p>
                            <p className="text-3xl font-medium text-blue-600">
                                {stats.avgCapacity > 0 ? ((stats.avgDirect / stats.avgCapacity) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UtilizationChart;