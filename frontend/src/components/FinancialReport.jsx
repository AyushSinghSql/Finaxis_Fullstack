import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const COLUMN_LABELS = {
  projId: "Project ID",
  funding: "Funding",
  revenue: "Revenue",
  cost: "Total Cost",
  profit: "Profit/Loss",
  profitPercent: "Profit %",
  backlog: "Backlog",
};

const FinancialReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(""); // Track explicit selection
  const [planType, setPlanType] = useState("BUD");
  const [allProjects, setAllProjects] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchContainerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("currentUser")) || {};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // --- SORTING LOGIC FOR TABLE (Rollup on Top) ---
  // const sortReportData = (data) => {
  //   return [...data].sort((a, b) => {
  //     if (a.isRollup && !b.isRollup) return -1;
  //     if (!a.isRollup && b.isRollup) return 1;
  //     return a.projId.localeCompare(b.projId);
  //   });
  // };
const sortReportData = (data) => {
    return [...data].sort((a, b) => {
      // 1. Always keep Rollup at the very top
      if (a.isRollup && !b.isRollup) return -1;
      if (!a.isRollup && b.isRollup) return 1;

      // 2. Sort sub-projects by ID descending (e.g., .04 comes before .02)
      // This handles the "level wise" requirement
      return b.projId.localeCompare(a.projId);
    });
  };

  const handleSearch = async () => {
    // Only allow search if the ID exists in our master list
    if (!selectedProjectId) {
      toast.error("Please select a valid Project ID from the suggestions");
      return;
    }

    setLoading(true);
    setShowSuggestions(false);
    try {
      const res = await axios.post(`${backendUrl}/Forecast/GetProjectFinancials?projId=${selectedProjectId}&planType=${planType}`);
      setReportData(sortReportData(res.data));
    } catch (err) {
      toast.error("Failed to fetch report data");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = async () => {
    if (allProjects.length === 0) {
      try {
        const response = await axios.get(
          `${backendUrl}/Project/GetAllProjectsForSearchV1?UserId=${user.userId}&Role=${user.role}`
        );
        const data = response.data || [];
        setAllProjects(data);
        updateSuggestions(searchTerm, data);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    }
    setShowSuggestions(true);
  };

  // --- SORTING SUGGESTIONS (Shortest/Rollup first) ---
  const updateSuggestions = (value, dataList) => {
    const lowerValue = value.toLowerCase();
    const filtered = dataList
      .filter(p => p.projectId.toLowerCase().includes(lowerValue))
      .sort((a, b) => {
        // Sort by length: shortest ID (the rollup) comes first
        return a.projectId.length - b.projectId.length;
      });
    setSuggestions(filtered);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedProjectId(""); // Reset selection if they start typing again
    updateSuggestions(value, allProjects);
    setShowSuggestions(true);
  };

  const handleSelectProject = (proj) => {
    setSearchTerm(proj.projectId);
    setSelectedProjectId(proj.projectId); // Mark as a valid selection
    setShowSuggestions(false);
  };

  return (
    <div className="p-4 space-y-6 text-sm text-gray-800 font-inter mt-9">
      {/* Search Header */}
      <div className="bg-white p-4 rounded shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto" ref={searchContainerRef}>
            <label className="font-semibold text-xs sm:text-sm whitespace-nowrap">Project ID:</label>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                className={`border rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 w-full bg-white shadow-inner ${
                    selectedProjectId ? "border-green-500 ring-green-200" : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="Search Project ID..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleFocus}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((proj, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer border-b last:border-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectProject(proj);
                      }}
                    >
                      <div className="font-bold text-blue-900">{proj.projectId}</div>
                      <div className="text-gray-600 truncate">{proj.name}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="font-semibold text-xs sm:text-sm whitespace-nowrap">Plan Type:</label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-inner cursor-pointer"
            >
              <option value="BUD">BUD</option>
              <option value="EAC">EAC</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={!selectedProjectId}
            className={`btn1 btn-blue ${
                !selectedProjectId 
                ? "bg-gray-300 cursor-not-allowed text-gray-500" 
                : "bg-[#17414d] text-white hover:bg-[#1f5666]"
            }`}
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Financial Table */}
      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#e5f3fb] sticky top-0 z-10">
              <tr>
                {Object.keys(COLUMN_LABELS).map((key) => (
                  <th key={key} className="px-2 py-2 text-center text-xs font-bold text-black captilaize whitespace-nowrap tracking-wider border-r border-gray-300">
                    {COLUMN_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center italic text-gray-400">Loading...</td></tr>
              ) : reportData.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-gray-400">Please select a project and click Generate.</td></tr>
              ) : (
                reportData.map((item, idx) => (
                  <tr key={idx} className={`${item.isRollup ? "bg-blue-50 font-bold" : "hover:bg-gray-50"} transition-colors`}>
                    <td className="px-2 py-2 whitespace-nowrap text-blue-900 border-r border-gray-100">
                      {item.projId} {item.isRollup && <span className="text-[10px] ml-2 bg-blue-200 px-1 rounded">ROLLUP</span>}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right border-r border-gray-100">{formatCurrency(item.funding)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right border-r border-gray-100">{formatCurrency(item.revenue)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right border-r border-gray-100">{formatCurrency(item.cost)}</td>
                    <td className={`px-2 py-2 whitespace-nowrap text-right font-semibold border-r border-gray-100 ${item.profit < 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(item.profit)}</td>
                    <td className={`px-2 py-2 whitespace-nowrap text-right border-r border-gray-100 ${item.profitPercent < 0 ? "text-red-500" : ""}`}>{item.profitPercent.toFixed(2)}%</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">{formatCurrency(item.backlog)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;