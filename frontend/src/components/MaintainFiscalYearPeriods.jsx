import React, { useState, useCallback, useMemo } from "react";
import { backendUrl } from "./config";
import { toast } from "react-toastify";
import { CalendarRange } from "lucide-react";

// Utility function for combining Tailwind CSS classes
const cn = (...args) => {
  return args.filter(Boolean).join(" ");
};

// Define years array outside the component to ensure it's always defined before render
const years = Array.from({ length: 2035 - 2020 + 1 }, (_, i) => 2020 + i);

// Function to generate fiscal year data for a given range
const generateFiscalYearData = (startYear, endYear) => {
  const data = {};
  for (let year = startYear; year <= endYear; year++) {
    const yearData = [];
    for (let month = 1; month <= 12; month++) {
      const lastDayOfMonth = new Date(year, month, 0).getDate(); // Get last day of previous month for 0 index
      const endDate = new Date(year, month - 1, lastDayOfMonth); // Month-1 because month is 0-indexed in Date constructor
      const formattedEndDate = `${(endDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${endDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${endDate.getFullYear()}`;

      const quarter = Math.ceil(month / 3); // Calculate quarter (1-4)

      yearData.push({
        id: `${year}-${month}`, // Unique ID for the row
        fiscalYear: year,
        period: month,
        subPeriod: 1, // Always 1 sub-period per month
        endDate: formattedEndDate,
        quarter: quarter,
        status: "HISTORY",
      });
    }
    data[year] = yearData;
  }
  return data;
};

const fiscalData = generateFiscalYearData(2020, 2035);

const MaintainFiscalYearPeriods = () => {
  const [activeTab, setActiveTab] = useState("accountingPeriods"); // 'accountingPeriods' or 'budgetingPeriods'
  const [currentYear, setCurrentYear] = useState(2020); // Start showing data for 2020

  // State to hold editable table data for the current year, specific to each tab
  const [accountingPeriodsData, setAccountingPeriodsData] = useState(
    fiscalData[2020] || []
  );
  const [budgetingPeriodsData, setBudgetingPeriodsData] = useState(
    fiscalData[2020] || []
  );

  // Sync data when currentYear or activeTab changes
  React.useEffect(() => {
    if (activeTab === "accountingPeriods") {
      // Ensure a deep copy to prevent direct mutation of fiscalData
      setAccountingPeriodsData(
        fiscalData[currentYear]
          ? JSON.parse(JSON.stringify(fiscalData[currentYear]))
          : []
      );
    } else {
      // Ensure a deep copy to prevent direct mutation of fiscalData
      setBudgetingPeriodsData(
        fiscalData[currentYear]
          ? JSON.parse(JSON.stringify(fiscalData[currentYear]))
          : []
      );
    }
  }, [currentYear, activeTab]);

  const handleYearChange = useCallback((direction) => {
    setCurrentYear((prevYear) => {
      const newYear = prevYear + direction;
      if (newYear >= 2020 && newYear <= 2035) {
        return newYear;
      }
      return prevYear; // Stay on current year if out of range
    });
  }, []);

  const handleManualYearChange = useCallback((e) => {
    const year = parseInt(e.target.value, 10);
    if (!isNaN(year) && year >= 2020 && year <= 2035) {
      setCurrentYear(year);
    }
  }, []);

  // Generic handler for table cell changes
  const handleTableCellChange = useCallback((id, field, value, tab) => {
    if (tab === "accountingPeriods") {
      setAccountingPeriodsData((prevData) =>
        prevData.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
    } else if (tab === "budgetingPeriods") {
      setBudgetingPeriodsData((prevData) =>
        prevData.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        )
      );
    }
  }, []);

  const handleSaveSettings = useCallback(() => {
    // console.log("Saving Fiscal Year Periods:");
    // console.log("Accounting Periods Data:", accountingPeriodsData);
    // console.log("Budgeting Periods Data:", budgetingPeriodsData);
    // alert("Fiscal Year Period settings saved (console logged)!");
    toast.success("Fiscal Year Period settings saved  ")
    // In a real application, you would send this data to your backend API.
  }, [accountingPeriodsData, budgetingPeriodsData]);

  // Memoize the current year's data for rendering
  const currentAccountingData = useMemo(
    () => accountingPeriodsData,
    [accountingPeriodsData]
  );
  const currentBudgetingData = useMemo(
    () => budgetingPeriodsData,
    [budgetingPeriodsData]
  );

  return (
    <div className="min-h-screen  text-gray-900 flex flex-col gap-y-2 items-center">
      {/* Adjusted max-w-7xl to w-full px-8 for wider display within its parent */}
      <div className="p-4 w-full  flex items-center rounded-sm bg-white">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CalendarRange size={20} className="text-blue-500" />
          Maintain Fiscal Year Periods
        </h2>
      </div>
      <div className="w-full px-4 bg-white rounded-sm p-4 space-y-6 ">
        {/* Header with Save Button */}
        {/* <div className="flex justify-between items-center gap-3 mb-6">
          <h2 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text  ">
            
          </h2>
        </div> */}

        {/* Tab Navigation */}
        <div className="flex mb-2 gap-3">
          <button
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors",
              activeTab === "accountingPeriods"
                ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
                : "text-gray-600 hover:text-gray-800 bg-gray-100",
            )}
            onClick={() => setActiveTab("accountingPeriods")}
          >
            Accounting Periods
          </button>
          <button
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors",
              activeTab === "budgetingPeriods"
                ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
                : "text-gray-600 hover:text-gray-800 bg-gray-100",
            )}
            onClick={() => setActiveTab("budgetingPeriods")}
          >
            Budgeting Periods
          </button>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center justify-between space-x-4 mb-2">
          <div></div>
          <div className="flex gap-3 text-sm">
            <button
              onClick={() => handleYearChange(-1)}
              disabled={currentYear === 2020}
              className="btn1 btn-blue"
            >
              &lt; Previous Year
            </button>
            <select
              value={currentYear}
              onChange={handleManualYearChange}
              className="border border-gray-300 rounded-md shadow-sm px-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleYearChange(1)}
              disabled={currentYear === 2035}
              className="btn1 btn-blue"
            >
              Next Year &gt;
            </button>
          </div>
          <div className=" mr-5">
            <button onClick={handleSaveSettings} className="btn1 btn-blue">
              Save
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className=" p-4 rounded-lg overflow-hidden">
          {" "}
          {/* Added overflow-hidden */}
          {/* <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="bg-[#17414d] text-white group-hover:text-gray  font-semibold py-2 px-4  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 -mt-3 mb-2 transition-colors duration-200"
            >
              Save
            </button>
          </div> */}
          <div className="overflow-x-auto rounded border border-gray-300">
            <table className="min-w-full divide-y divide-gray-300 table">
              <thead className="thead">
                <tr>
                  <th scope="col" className="th-thead uppercase tracking-wider">
                    Fiscal Year
                  </th>
                  <th scope="col" className="th-thead uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="th-thead uppercase tracking-wider">
                    Sub Period
                  </th>
                  <th scope="col" className="th-thead uppercase tracking-wider">
                    End Date
                  </th>
                  {activeTab === "accountingPeriods" && (
                    <th
                      scope="col"
                      className="th-thead uppercase tracking-wider"
                    >
                      Quarter
                    </th>
                  )}
                  <th scope="col" className="th-thead uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="tbody divide-y divide-gray-200">
                {activeTab === "accountingPeriods" &&
                  currentAccountingData.map((row) => (
                    <tr key={row.id}>
                      <td className=" whitespace-nowrap tbody-td">
                        {row.fiscalYear}
                      </td>
                      <td className="tbody-td">
                        <input
                          type="number"
                          value={row.period}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "period",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                      <td className=" whitespace-nowrap tbody-td">
                        <input
                          type="number"
                          value={row.subPeriod}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "subPeriod",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                      <td className=" whitespace-nowrap tbody-td">
                        <input
                          type="text"
                          value={row.endDate}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "endDate",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                      {activeTab === "accountingPeriods" && (
                        <td className=" whitespace-nowrap tbody-td">
                          <select
                            value={row.quarter}
                            onChange={(e) =>
                              handleTableCellChange(
                                row.id,
                                "quarter",
                                e.target.value,
                                activeTab,
                              )
                            }
                            className="table-input"
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </td>
                      )}
                      <td className="whitespace-nowrap tbody-td">
                        <input
                          type="text"
                          value={row.status}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "status",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                    </tr>
                  ))}
                {activeTab === "budgetingPeriods" &&
                  currentBudgetingData.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap tbody-td">
                        {row.fiscalYear}
                      </td>
                      <td className=" whitespace-nowrap tbody-td">
                        <input
                          type="number"
                          value={row.period}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "period",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                      <td className=" whitespace-nowrap tbody-td">
                        <input
                          type="number"
                          value={row.subPeriod}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "subPeriod",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                      <td className=" whitespace-nowrap tbody-td">
                        <input
                          type="text"
                          value={row.endDate}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "endDate",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                      <td className="tbody-td whitespace-nowrap">
                        <input
                          type="text"
                          value={row.status}
                          onChange={(e) =>
                            handleTableCellChange(
                              row.id,
                              "status",
                              e.target.value,
                              activeTab,
                            )
                          }
                          className="table-input"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintainFiscalYearPeriods;
