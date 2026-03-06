import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";
import { UsersIcon, CreditCardIcon, ChartBarIcon } from "@heroicons/react/24/solid";

const POOL_ROWS = [
    { key: "Fringe", label: "Fringe" },
    { key: "OH-Off Site Lanham", label: "OH-Off Site Lanham" },
    { key: "OH-On Site Lanham", label: "OH-On Site Lanham" },
    { key: "Material Handling Fee", label: "Material Handling Fee" },
    { key: "G&A", label: "G&A" },
  ];

const ROW_HEIGHT_DEFAULT = 24;
const geistSansStyle = {
  fontFamily: "'Geist', 'Geist Fallback', sans-serif",
};

const ProjectPoolCosts = ({
  refreshKey,
  planId,
  startDate,
  endDate,
  fiscalYear,
  planType,
  hoursColumnTotals, // from Hours screen: { "1_2025_cost": 45631.08, ... }
  otherColumnTotals, // from Other Cost: { "1_2025": 800, ... }
  refreshCalculation,
  allForcastData,
  loadingPools
}) => {
  const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  };

  const prevRefresh = usePrevious(refreshCalculation); // track previous value
  const [durations, setDurations] = useState([]);
  const [aggregatedData, setAggregatedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  

  const leftTableRef = useRef(null);
  const rightTableRef = useRef(null);
  const scrollingLock = useRef(false);

  const normalizedFiscalYear =
    fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();

  const syncScroll = (sourceRef, targetRef) => {
    if (!sourceRef.current || !targetRef.current) return;
    if (!scrollingLock.current) {
      scrollingLock.current = true;
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
      setTimeout(() => {
        scrollingLock.current = false;
      }, 0);
    }
  };

const [monthlyApiData, setMonthlyApiData] = useState([]);

const fetchAllData = async () => {
  if (!planId || !startDate || !endDate) return;
  setIsLoading(true);

  try {
    const monthlyRes = await axios.get(
      `${backendUrl}/Forecast/GetMonthlyDataV1?planID=${planId}&planType=${planType}`, {
          headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("currentUser") || "{}").token ?? ""}`
        }
      }
    );
    const monthlyData = Array.isArray(monthlyRes.data) ? monthlyRes.data : [];
    const durationFromMonthly = monthlyData.map((m) => ({
      year: m.year,
      monthNo: m.monthNo ?? m.month,
      month: new Date(m.year, (m.monthNo ?? m.month) - 1).toLocaleString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        },
      ),
    }));
    setDurations(durationFromMonthly);
    setMonthlyApiData(monthlyData);
  } catch (err) {
    console.error(err);
    toast.error("Failed to load pool cost data");
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  if (!monthlyApiData || monthlyApiData.length === 0) {
    setAggregatedData({});
    return;
  }

  const result = {};

  console.log(monthlyApiData)

  monthlyApiData.forEach((item) => {
    // IMPORTANT: JSON uses 'month', JSX often uses 'monthNo'. 
    // We normalize here to ensure the key is consistent.
    const m = item.month || item.monthNo;
    const key = `${m}_${item.year}`;

    const flattenedRow = {
      laborCost: Number(item.laborCost) || 0,
      nonLaborCost: Number(item.nonLaborCost) || 0,
      revenue: Number(item.revenue) || 0,
      hours: Number(item.hours) || 0,
    };

    // Map indirect costs directly to keys that match POOL_ROWS
    if (item.indirectCost && Array.isArray(item.indirectCost)) {
      item.indirectCost.forEach((ic) => {
        // ic.name is "Fringe", "G&A", etc.
        flattenedRow[ic.name] = Number(ic.value) || 0;
      });
    }

    result[key] = flattenedRow;
  });

  console.log("Verified Aggregated Data:", result);
  setAggregatedData(result);
}, [monthlyApiData]);


useEffect(() => {
  if (refreshKey || (refreshCalculation)) {
    fetchAllData();
  }
}, [planId, planType, startDate, endDate, refreshKey, refreshCalculation]);


useEffect(() => {
  if(allForcastData) {
    const monthlyData = allForcastData
    const durationFromMonthly = monthlyData.map((m) => ({
      year: m.year,
      monthNo: m.monthNo ?? m.month,
      month: new Date(m.year, (m.monthNo ?? m.month) - 1).toLocaleString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        },
      ),
    }));
    console.log(monthlyData)
    setDurations(durationFromMonthly);
    setMonthlyApiData(monthlyData);
  }
}, [allForcastData])




// const getApiValue = (year, month, key) => {
//   const record = monthlyApiData.find(d => d.year === year && d.month === month);
//   if (!record) return 0;
//   // Map API keys to your component keys
//   const mapping = {
//     fringe: record.fringe,
//     gna: record.gna,
//     overhead: record.overhead,
//     materials: record.mnh, // mnh maps to Materials row
//     revenue: record.revenue,
//     laborCost: record.laborCost,
//     nonLaborCost: record.nonLaborCost
//   };
//   return mapping[key] || 0;
// };

const getApiValue = (year, month, key) => {
  // 1. Find the specific record matching the year and month
  // We check both month and monthNo to be safe based on your previous data transformations
  const record = monthlyApiData.find(
    (d) => d.year === year && (d.monthNo === month || d.month === month)
  );

  // If no record is found for that period, return 0
  if (!record) return 0;

  // 2. Check if the key matches a name inside the nested indirectCost array
  // This handles Fringe, OH-Off Site Lanham, G&A, etc.
  if (record.indirectCost && Array.isArray(record.indirectCost)) {
    const indirectEntry = record.indirectCost.find(
      (ic) => ic.name === key
    );
    
    // If found in the array, return the numeric value
    if (indirectEntry) {
      return Number(indirectEntry.value) || 0;
    }
  }

  // 3. Fallback: Check top-level properties
  // This handles laborCost, nonLaborCost, revenue, or hours
  return Number(record[key]) || 0;
};

  const handleLeftScroll = () => syncScroll(leftTableRef, rightTableRef);
  const handleRightScroll = () => syncScroll(rightTableRef, leftTableRef);

  const visibleDurations = useMemo(() => {
    return durations
      .filter(
        (d) =>
          normalizedFiscalYear === "All" ||
          d.year === parseInt(normalizedFiscalYear, 10),
      )
      .sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.monthNo - b.monthNo,
      );
  }, [durations, normalizedFiscalYear]);

  // if (isLoading) return <div className="p-4 text-xs">Loading...</div>;
  if (isLoading || loadingPools)
    return (
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">Loading.....</span>
      </div>
    );


  
      return(
        <div
          // style={geistSansStyle}
          className="relative p-2 font-inter w-full synchronized-tables-outer"
        >
          <div className="w-full flex justify-between mb-1 gap-2">
            {/* <div className="px-1.5 w-auto bg-black  text-white rounded-t-sm flex items-center justify-between">
          <span className="font-semibold text-md sm:text-sm">
            Indirect Cost
          </span>
        </div> */}
            {/* <div className="flex items-center gap-3">
    <div className="bg-[#1e293b] p-1 rounded-lg shadow-md flex items-center justify-center">
       
      <UsersIcon className="w-2 h-2 text-white" />
    </div>
    <div>
      <h2 className="text-sm text-[#1e293b]  tracking-widest leading-none">
        Indirect Cost
      </h2>
    </div>
  </div> */}

            <div className="flex justify-center w-full">
              <div className="inline-flex items-center bg-[#17414D] px-2 py-1 rounded-md shadow-md">
                <h2 className="text-sm font-semibold text-white leading-none flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-white" />
                  <span>Indirect Cost</span>
                </h2>
              </div>
            </div>
            {/* <div className="pt-2">
  <span className="bg-[#1e293b] text-white px-3 py-1 rounded-t-md text-xs font-bold uppercase tracking-wider shadow-sm">
    Indirect Cost
  </span>
</div> */}
          </div>

          { durations.length === 0 ? ( <div className="bg-yellow-100  border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs">
            No data available.
          </div>) : 
            (<div className="border-line">
              <div className="synchronized-tables-container flex w-full overflow-hidden rounded-lg">
                {/* Left Table: Fixed Labels */}
                <div
                  ref={leftTableRef}
                  onScroll={handleLeftScroll}
                  className="hide-scrollbar"
                  style={{
                    width: "180px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    flexShrink: 0,
                  }}
                >
                  <table className="table-fixed table min-w-full border-r border-gray-300">
                    <thead className="thead">
                      <tr style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}>
                        <th className="th-thead-blue px-4 text-center">
                          Cost Pool
                        </th>
                      </tr>
                    </thead>
                    <tbody className="tbody ">
                      {POOL_ROWS.map((row) => (
                        <tr
                          key={row.key}
                          style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}
                          className="border-b border-gray-100"
                        >
                          <td className="tbody-td px-4 text-center font-medium text-gray-700">
                            {row.label}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {/* {" "}
                      <div style={{ height: "1px" }}></div>{" "} */}
                      <tr
                        className="font-bold border border-gray-300"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT}px`,
                          position: "sticky",
                          bottom: ROW_HEIGHT_DEFAULT,
                          zIndex: 20,
                          backgroundColor: "#d7ebf3", // light blue like screenshot
                          color: "#000000",
                          // borderTop: "2px solid #A9A9A9",
                        }}
                      >
                        <td className="tbody-td px-4 text-center ">
                          Subtotal Indirect Cost
                        </td>
                      </tr>
                      <tr
                      // className="bg-blue-50 border border-gray-300 font-bold"
                      // style={{
                      //   height: `${ROW_HEIGHT_DEFAULT}px`,
                      //   position: "sticky",
                      //   bottom: 0,
                      //   zIndex: 20,
                      //   backgroundColor: "#d7ebf3", // light blue like screenshot
                      //   color: "#000000",
                      // }}
                      >
                        <td className="tbody-td px-4 text-center text-blue-900 ">
                          {" "}
                        </td>
                      </tr>
                      <tr
                        className="bg-blue-50 border border-gray-300 font-bold"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT + 10}px`,
                          position: "sticky",
                          bottom: 0,
                          zIndex: 20,
                          backgroundColor: "#d7ebf3", // light blue like screenshot
                          color: "#000000",
                          fontSize: "14px",
                        }}
                      >
                        <td className="tbody-td px-4 text-center text-blue-900 ">
                          Total Expenses
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Right Table: Data (tbody logic unchanged) */}
                <div
                  ref={rightTableRef}
                  onScroll={handleRightScroll}
                  className="flex-1"
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <table className="min-w-full table border-l border-gray-300">
                    <thead className="thead">
                      <tr style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}>
                        {visibleDurations.map((d) => (
                          <th
                            key={`${d.monthNo}_${d.year}`}
                            className="th-thead-blue min-w-[110px] text-center px-2"
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="whitespace-nowrap">{d.month}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="tbody">
  {POOL_ROWS.map((row) => (
    <tr
      key={row.key}
      style={{ height: `${ROW_HEIGHT_DEFAULT}px` }}
      className="hover:bg-blue-50 transition border-b border-gray-100"
    >
      {visibleDurations.map((d) => {
        // Create the lookup key (ensure this matches your useEffect format)
        const key = `${d.monthNo}_${d.year}`;
        // Pull value directly from flattened aggregatedData
        const cellValue = aggregatedData[key]?.[row.key] || 0;

        return (
          <td
            key={`${key}-${row.key}`}
            className="tbody-td text-center text-gray-600 px-2"
          >
            {cellValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </td>
        );
      })}
    </tr>
  ))}
</tbody>
                    <tfoot>
                      {/* <div style={{ height: "1px" }}></div> */}
                      <tr
                        className="bg-gray-100 font-bold text-center border border-gray-300"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT}px`,
                          position: "sticky",
                          bottom: ROW_HEIGHT_DEFAULT,
                          zIndex: 20,
                          backgroundColor: "#d7ebf3", // light blue like screenshot
                          color: "#000000",
                          // borderTop: "2px solid #A9A9A9",
                        }}
                      >
                        {/* {visibleDurations.map((d) => {
                      const key = `${d.monthNo}_${d.year}`;
                      return (
                        <td
                          key={`footer-ind-${key}`}
                          className="tbody-td text-black px-2"
                        >
                          {(columnTotals[key]?.indirect || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </td>
                      );
                    })} */}
                        {visibleDurations.map((d) => {
                          // Sum of Fringe + Overhead + M&H + G&A
                          const totalIndirect = [
  "Fringe",
  "OH-Off Site Lanham",
  "OH-On Site Lanham",
  "Material Handling Fee",
  "G&A",
].reduce((acc, key) => acc + getApiValue(d.year, d.monthNo, key), 0);
                          return (
                            <td
                              key={`sub-indirect-${d.monthNo}_${d.year}`}
                              className="tbody-td text-blue-900 px-2"
                            >
                              {totalIndirect.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          );
                        })}
                      </tr>
                      <tr
                      // className="bg-blue-50 border border-gray-300 font-bold text-center"
                      // style={{
                      //   height: `${ROW_HEIGHT_DEFAULT}px`,
                      //   position: "sticky",
                      //   bottom: 0,
                      //   zIndex: 20,
                      //   backgroundColor: "#d7ebf3", // light blue like screenshot
                      //   color: "#000000",
                      // }}
                      >
                        {/* {visibleDurations.map((d) => {
                      const key = `${d.monthNo}_${d.year}`;
                      return (
                        <td
                          key={`footer-proj-${key}`}
                          className="tbody-td text-blue-900 px-2 "
                        >
                          {(columnTotals[key]?.project || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </td>
                      );
                    })} */}
                        {visibleDurations.map((d) => {
                          return (
                            <td className="tbody-td text-blue-900 px-2"> </td>
                          );
                        })}
                      </tr>
                      <tr
                        className="bg-blue-50 border border-gray-300 font-bold text-center"
                        style={{
                          height: `${ROW_HEIGHT_DEFAULT + 10}px`,
                          position: "sticky",
                          bottom: 0,
                          zIndex: 20,
                          backgroundColor: "#d7ebf3", // light blue like screenshot
                          color: "#000000",
                          fontSize: "14px",
                        }}
                      >
                        {/* {visibleDurations.map((d) => {
                      const key = `${d.monthNo}_${d.year}`;
                      return (
                        <td
                          key={`footer-proj-${key}`}
                          className="tbody-td text-blue-900 px-2 "
                        >
                          {(columnTotals[key]?.project || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </td>
                      );
                    })} */}
                        {visibleDurations.map((d) => {
                          const labor = getApiValue(d.year, d.monthNo, "laborCost");
  const nonLabor = getApiValue(d.year, d.monthNo, "nonLaborCost");

  // 2. Calculate Total Indirect by summing the exact keys from POOL_ROWS
  const totalIndirect = [
    "Fringe",
    "OH-Off Site Lanham",
    "OH-On Site Lanham",
    "Material Handling Fee",
    "G&A",
  ].reduce((acc, key) => acc + getApiValue(d.year, d.monthNo, key), 0);

  // 3. Final Sum
  const grandTotal = labor + nonLabor + totalIndirect;
                          return (
                            <td
                              key={`grand-total-${d.monthNo}_${d.year}`}
                              className="tbody-td text-blue-900 px-2"
                            >
                              {grandTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>)
          }
        </div>
      );
};

export default ProjectPoolCosts;
