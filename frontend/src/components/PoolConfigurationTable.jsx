// import React, { useState, useEffect, useRef } from "react"; 
// import axios from "axios";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { backendUrl } from "./config";
// import { MonitorCog } from "lucide-react";

// const PoolConfigurationTable = () => {
//   const [tableData, setTableData] = useState([]);
//   const [originalTableData, setOriginalTableData] = useState([]);
//   const [groupCodes, setGroupCodes] = useState([]);
//   const [groupNames, setGroupNames] = useState({});
//   const [groupTypes, setGroupTypes] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [orgSearchTerm, setOrgSearchTerm] = useState(""); 
//   const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
//  const [hasLoadedForYear, setHasLoadedForYear] = useState({}); 

//  const currentYear = new Date().getFullYear();
//   const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);
 
//   const [selectedYear, setSelectedYear] = useState(currentYear);

//   // remember which year we already loaded
//   const lastLoadedYearRef = useRef(null);

//     useEffect(() => {
//     // if year didn't actually change, do nothing
//     if (lastLoadedYearRef.current === selectedYear) {
//       console.log("skip fetch, selectedYear unchanged:", selectedYear);
//       return;
//     }

//     console.log(">>> REAL fetchData call for selectedYear:", selectedYear);
//     lastLoadedYearRef.current = selectedYear;

//     const fetchData = async () => {
//       console.log("fetchData running for selectedYear:", selectedYear);
//       setLoading(true);
//       try {
//         const groupResponse = await axios.get(
//           `${backendUrl}/Orgnization/GetAllPools`
//         );
//         const codes = groupResponse.data.map((item) => item.code);
//         const names = groupResponse.data.reduce((acc, item) => {
//           acc[item.code] = item.name;
//           return acc;
//         }, {});
//         const types = groupResponse.data.reduce((acc, item) => {
//           acc[item.code] = item.type;
//           return acc;
//         }, {});
//         setGroupCodes(codes);
//         setGroupNames(names);
//         setGroupTypes(types);

//         const tableResponse = await axios.get(
//           `${backendUrl}/Orgnization/GetAccountPools?Year=${selectedYear}`
//         );
//         const tableDataRaw = tableResponse.data;

//         const mappedData = tableDataRaw.map((row) => {
//           const mappedRow = {
//             orgId: row.orgId || "",
//             acctId: row.acctId || "",
//           };
//           codes.forEach((code) => {
//             mappedRow[code] = row[code.toUpperCase()] === true;
//           });
//           return mappedRow;
//         });

//         setTableData(mappedData);
//         setOriginalTableData(mappedData);
//         setError(null);
//       } catch (err) {
//         setError(
//           err.response?.data?.message || err.message || "Unknown error"
//         );
//         setTableData([]);
//         setOriginalTableData([]);
//         setGroupCodes([]);
//         setGroupNames({});
//         setGroupTypes({});
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [selectedYear]);

//   // const handleYearChange = (e) => {
//   //   const y = Number(e.target.value);
//   //   if (!Number.isNaN(y) && y !== selectedYear) {
//   //     setSelectedYear(y); // this will trigger one fetch via useEffect
//   //   }
//   // };

//   // Only fire one warning toast per click
//   const handleCheckboxChange = (orgId, acctId, groupCode) => {
//     let showWarning = false;

//     setTableData((prev) =>
//       prev.map((row) => {
//         if (row.orgId === orgId && row.acctId === acctId) {
//           const targetType = groupTypes[groupCode];
//           const isCurrentlyChecked = row[groupCode] === true;
//           if (!isCurrentlyChecked) {
//             // Check if any other pool of same type is already checked
//             const otherChecked = groupCodes.some(
//               (code) =>
//                 code !== groupCode &&
//                 groupTypes[code] === targetType &&
//                 row[code] === true
//             );
//             if (otherChecked) {
//               showWarning = true; // Mark to show toast after state update
//               return row; // Prevent checking
//             }
//           }
//           // Toggle as normal (set this one ON/OFF)
//           return {
//             ...row,
//             [groupCode]: !row[groupCode],
//           };
//         }
//         return row;
//       })
//     );

//     // Show toast outside of state setter to avoid duplicate toasts
//     setTimeout(() => {
//       if (showWarning) {
//         toast.warn("Duplicate pool type mapping detected for this Org Account");
//       }
//     }, 0);
//   };

//   const handleSave = async () => {
//     const changedRows = tableData
//       .filter((row) => {
//         const origRow = originalTableData.find(
//           (o) => o.orgId === row.orgId && o.acctId === row.acctId
//         );
//         if (!origRow) return false;
//         return groupCodes.some((code) => row[code] !== origRow[code]);
//       })
//       .map((row) => ({
//         orgId: row.orgId,
//         acctId: row.acctId,
//         Year: selectedYear,
//         ...groupCodes.reduce((acc, code) => {
//           acc[code] = row[code] || false;
//           return acc;
//         }, {}),
//       }));

//     if (changedRows.length === 0) {
//       toast.info("No changes to save.");
//       return;
//     }

//     setIsSaving(true);
//     try {
//       await axios.post(
//         `${backendUrl}/Orgnization/BulkUpSertOrgAccountPoolMapping`,
//         changedRows,
//         {
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//       setOriginalTableData([...tableData]);
//       setError(null);
//       toast.success("Data saved successfully");
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.message ||
//         err.message ||
//         "Failed to update pool mapping";
//       setError(errorMessage);
//       setTableData([...originalTableData]);
//       setTimeout(() => setError(null), 5000);
//       toast.error(errorMessage);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64 font-roboto">
//         <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
//         <span className="ml-2 text-gray-600 text-sm font-medium">
//           Loading...
//         </span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center text-red-500 p-3 bg-red-50 rounded-lg font-roboto text-sm font-medium shadow-sm">
//         Error: {error}
//       </div>
//     );
//   }

//   const filteredData = tableData.filter((row) => {
//   const acctMatch = searchTerm
//     ? row.acctId?.toString().toLowerCase().includes(searchTerm.toLowerCase())
//     : true;

//   const orgMatch = orgSearchTerm
//     ? row.orgId?.toString().toLowerCase().includes(orgSearchTerm.toLowerCase())
//     : true;

//   // When both entered, both must match
//   return acctMatch && orgMatch;
// });


//   const displayNames = {
//   HR: "HR",
//   hr: "HR",
//   // add others if needed
// };

//   return (
//     <div className="w-[98%] mx-auto font-roboto rounded">
//       <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         closeOnClick
//       />
//       {/* <h2 className="w-full bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
//         Pool Configuration
//       </h2> */}
//       <div className="font-roboto bg-gray-50 rounded-xl shadow-md p-2 mb-3 px-4">
//         {/* <div className="py-4 border-b border-gray-200 w-full flex items-center justify-between bg-gray-50/50">
//           <h2 className="text-lg  font-bold text-gray-800 flex items-center gap-2">
//             <MonitorCog size={20} className="text-blue-600" /> Org Account Pool Mapping
//           </h2>
//         </div> */}
//         <div className="flex items-center gap-4 my-3">
//           <label
//             htmlFor="fiscalYear"
//             className="font-medium text-gray-700 text-sm"
//           >
//             Fiscal Year:
//           </label>
//           <select
//             id="fiscalYear"
//             value={selectedYear}
//             onChange={(e) => setFiscalYear(parseInt(e.target.value))}
//             className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
//           >
//             {years.map((year) => (
//               <option key={year} value={year}>
//                 {year}
//               </option>
//             ))}
//           </select>
//           <div className="flex-grow"></div>
//           <div className="flex items-center gap-2 mb-2">
//             {/* Org ID filter */}
//             <input
//               type="text"
//               placeholder="Filter by Org ID"
//               value={orgSearchTerm}
//               onChange={(e) => setOrgSearchTerm(e.target.value)}
//               className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
//             />

//             {/* Account ID filter (existing) */}
//             <input
//               type="text"
//               placeholder="Filter by Account ID"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
//             />
//           </div>

//           <button
//             onClick={handleSave}
//             disabled={isSaving}
//             className="ml-3 bg-[#17414d] text-white group-hover:text-gray font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSaving ? (
//               <>
//                 <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
//                 Saving...
//               </>
//             ) : (
//               "Save"
//             )}
//           </button>
//         </div>
//       </div>

//       <div
//         style={{
//           maxHeight: "500px",
//           overflowY: "auto",
//           position: "relative",
//           // border: "1px solid #e5e7eb",
//           // borderRadius: "0.5rem",
//         }}
//         className="border-line"
//       >
//         <table className="min-w-full table">
//           <thead className="bg-gray-200 sticky top-0">
//             <tr>
//               <th className="px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap text-center">
//                 Org ID
//               </th>
//               <th className="px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap text-center">
//                 Account ID
//               </th>

//               {groupCodes.map((code, index) => (
//                 <th
//                   key={index}
//                   className="px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap text-center"
//                 >
//                   {displayNames[code] || groupNames[code] || code}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody className="tbody">
//             {filteredData.map((row) => (
//               <tr
//                 key={`${row.orgId}-${row.acctId}`}
//                 // className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
//               >
//                 <td className="tbody-td">{row.orgId}</td>
//                 <td className="tbody-td  whitespace-nowrap">{row.acctId}</td>
//                 {groupCodes.map((code, idx) => (
//                   <td key={idx} className="tbody-td">
//                     <input
//                       type="checkbox"
//                       checked={row[code] === true}
//                       onChange={() =>
//                         handleCheckboxChange(row.orgId, row.acctId, code)
//                       }
//                       className="h-3 w-3 text-blue-600  focus:ring-blue-500 focus:ring-opacity-50 tbody-td"
//                     />
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default PoolConfigurationTable;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";
import { MonitorCog } from "lucide-react";

const PoolConfigurationTable = ({canEdit}) => {
  const [tableData, setTableData] = useState([]);
  const [originalTableData, setOriginalTableData] = useState([]);
  const [groupCodes, setGroupCodes] = useState([]);
  const [groupNames, setGroupNames] = useState({});
  const [groupTypes, setGroupTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const lastLoadedYearRef = useRef(null);

      const fetchData = async () => {
        setLoading(true);
        try {
          const groupResponse = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);
          const codes = groupResponse.data.map((item) => item.code);
          const names = groupResponse.data.reduce((acc, item) => {
            acc[item.code] = item.name;
            return acc;
          }, {});
          const types = groupResponse.data.reduce((acc, item) => {
            acc[item.code] = item.type;
            return acc;
          }, {});

          setGroupCodes(codes);
          setGroupNames(names);
          setGroupTypes(types);

          // const tableResponse = await axios.get(
          //   `${backendUrl}/Orgnization/GetAccountPools?Year=${selectedYear}&orgId=${orgSearchTerm}&acctId=${searchTerm}`
          // );

          const tableResponse = await axios.get(
          `${backendUrl}/Orgnization/GetAccountPools?Year=${selectedYear}`
        );
          const mappedData = tableResponse.data.map((row) => {
            const mappedRow = { orgId: row.orgId || "", acctId: row.acctId || "" };
            codes.forEach((code) => {
              mappedRow[code] = row[code.toUpperCase()] === true;
            });
            return mappedRow;
          });

          setTableData(mappedData);
          setOriginalTableData(mappedData);
          setError(null);
        } catch (err) {
          setError(err.response?.data?.message || err.message || "Unknown error");
        } finally {
          setLoading(false);
        }
      };

//    useEffect(() => {
//   fetchData();
// }, []);

  const filteredData = tableData.filter((row) => {
    const acctMatch = searchTerm
  ? row.acctId?.toString().toLowerCase().startsWith(searchTerm.toLowerCase())
  : true;
    const orgMatch = orgSearchTerm ? row.orgId?.toString().toLowerCase().startsWith(orgSearchTerm.toLowerCase()) : true;
    return acctMatch && orgMatch;
  });

  const handleCheckboxChange = (orgId, acctId, groupCode) => {
    let showWarning = false;
    setTableData((prev) =>
      prev.map((row) => {
        if (row.orgId === orgId && row.acctId === acctId) {
          const targetType = groupTypes[groupCode];
          if (!row[groupCode]) {
            const otherChecked = groupCodes.some(
              (code) => code !== groupCode && groupTypes[code] === targetType && row[code] === true
            );
            if (otherChecked) {
              showWarning = true;
              return row;
            }
          }
          return { ...row, [groupCode]: !row[groupCode] };
        }
        return row;
      })
    );
    if (showWarning) toast.warn("Duplicate pool type mapping detected.");
  };

  const toggleAllInColumn = (groupCode) => {
    const allChecked = filteredData.length > 0 && filteredData.every((row) => row[groupCode] === true);
    const targetType = groupTypes[groupCode];
    let showWarning = false;

    setTableData((prev) =>
      prev.map((row) => {
        const isVisible = filteredData.some((f) => f.orgId === row.orgId && f.acctId === row.acctId);
        if (isVisible) {
          if (!allChecked) {
            const otherChecked = groupCodes.some(
              (code) => code !== groupCode && groupTypes[code] === targetType && row[code] === true
            );
            if (otherChecked) {
              showWarning = true;
              return row;
            }
            return { ...row, [groupCode]: true };
          }
          return { ...row, [groupCode]: false };
        }
        return row;
      })
    );
    if (showWarning) toast.warn("Some rows skipped to prevent duplicate pool types.");
  };

  const handleSave = async () => {
    const changedRows = tableData
      .filter((row) => {
        const origRow = originalTableData.find((o) => o.orgId === row.orgId && o.acctId === row.acctId);
        return origRow && groupCodes.some((code) => row[code] !== origRow[code]);
      })
      .map((row) => ({
        orgId: row.orgId,
        acctId: row.acctId,
        Year: selectedYear,
        ...groupCodes.reduce((acc, code) => {
          acc[code] = row[code] || false;
          return acc;
        }, {}),
      }));

    if (changedRows.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(`${backendUrl}/Orgnization/BulkUpSertOrgAccountPoolMapping`, changedRows);
      setOriginalTableData([...tableData]);
      toast.success("Data saved successfully");
    } catch (err) {
      toast.error("Failed to update pool mapping");
    } finally {
      setIsSaving(false);
    }
  };

  // if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="w-[98%] mx-auto font-roboto rounded">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* <div className="mb-2 px-4">
        <div className="flex items-center gap-4 my-3">
          <label className="input-label">Fiscal Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-style"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div className="w-[60%]"></div>
          <input
            placeholder="Filter by Org ID"
            value={orgSearchTerm}
            onChange={(e) => setOrgSearchTerm(e.target.value)}
            className="input-style"
          />
          <input
            placeholder="Filter by Account ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-style"
          />
          
        </div>

        <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn1 btn-blue"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
      </div> */}
      <div className="mb-4 px-4">
        <div className="flex items-center justify-between">
          {/* Left Side: Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="input-label">Fiscal Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input-style w-28"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <input
              placeholder="Filter by Org ID"
              value={orgSearchTerm}
              onChange={(e) => setOrgSearchTerm(e.target.value)}
              className="input-style "
            />
            
            <input
              placeholder="Filter by Account ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-style"
            />

            <button
              onClick={fetchData}
              className="btn1 btn-blue"
            >
              Search
            </button>
          </div>

          {/* Right Side: Save Button */}
          <div>
          {canEdit("poolRateTabs") && <button
            onClick={handleSave}
            disabled={isSaving}
            className={`btn1 btn-blue ${
              isSaving ? "bg-gray-400" : " "
              }`}
              >
            {isSaving ? "Saving..." : "Save"}
          </button>}
            </div>
        </div>
      </div>

      <div
        className="border-line"
        style={{ maxHeight: "500px", overflowY: "auto" }}
      >
        <table className="min-w-full table">
          <thead className="thead">
            <tr>
              <th className="px-2 py-1 border-r whitespace-nowrap border-gray-300 border-b text-xs font-semibold bg-[#e5f3fb] text-black capitalize tracking-wide text-center">
                Org ID
              </th>
              <th className="px-2 py-1 border-r whitespace-nowrap border-gray-300 border-b text-xs font-semibold bg-[#e5f3fb] text-black capitalize tracking-wide text-center">
                Account ID
              </th>
              {groupCodes.map((code, index) => (
                <th key={index} className="th-thead">
                  <div className="flex flex-col items-center gap-1">
                    <span className="px-2 py-1  whitespace-nowrap border-gray-300 text-xs font-semibold bg-[#e5f3fb] text-black capitalize tracking-wide text-center">
                      {groupNames[code] || code}
                    </span>
                    {canEdit("poolRateTabs") && <div className="flex items-center gap-1 mt-1">
                      <input
                        type="checkbox"
                        className="cursor-pointer h-3 w-3"
                        checked={
                          filteredData.length > 0 &&
                          filteredData.every((r) => r[code] === true)
                        }
                        onChange={() => toggleAllInColumn(code)}
                      />
                      <span className="px-2 py-1 whitespace-nowrap text-xs font-semibold bg-[#e5f3fb] text-black capitalize tracking-wide text-center">
                        all
                      </span>
                    </div>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tbody">
            {loading ? (
              <tr>
                      <td colSpan={10}>
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 mt-4">
                            Loading...
                          </span>
                        </div>
                      </td>
                    </tr>
            ) :
            filteredData.map((row) => (
              <tr key={`${row.orgId}-${row.acctId}`}>
                <td className="tbody-td">{row.orgId}</td>
                <td className="tbody-td whitespace-nowrap">{row.acctId}</td>
                {groupCodes.map((code, idx) => (
                  <td key={idx} className={`tbody-td`}>
                    <input
                      type="checkbox"
                      checked={row[code] === true}
                      onChange={() =>
                        handleCheckboxChange(row.orgId, row.acctId, code)
                      }
                      className={`h-3 w-3 text-blue-600 ${canEdit("poolRateTabs") ? "" : "bg-gray-600"}`}
                      disabled={!canEdit("poolRateTabs")}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoolConfigurationTable;