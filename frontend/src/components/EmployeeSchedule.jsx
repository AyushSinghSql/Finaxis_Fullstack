import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "./config";

const EmployeeSchedule = ({
  planId,
  projectId,
  status,
  planType,
  startDate,
  endDate,
  fiscalYear,
  emplId,
  selectedPlan,
}) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedEmplId = useRef(null);
  const fetchingRef = useRef(false); // Add this to prevent concurrent calls

  // Normalize fiscal year
  const normalizedFiscalYear =
    fiscalYear === "All" || !fiscalYear ? "All" : String(fiscalYear).trim();

  // Fetch schedule data using the passed emplId
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!emplId) {
        setScheduleData(null);
        lastFetchedEmplId.current = null;
        return;
      }

      // Prevent duplicate API calls for the same emplId
      if (lastFetchedEmplId.current === emplId) {
        return;
      }

      // Prevent concurrent calls
      if (fetchingRef.current) {
        return;
      }

      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `${backendUrl}/Forecast/GetEmployeeScheduleAsync/${emplId}`,
        );

        if (response.data && typeof response.data === "object") {
          setScheduleData(response.data);
          lastFetchedEmplId.current = emplId; // Store the fetched ID
        } else {
          setScheduleData(null);
        }
      } catch (err) {
        // setError("Failed to load schedule data");
        // toast.error(
        //   `Failed to load schedule data: ${
        //     err.response?.data?.message || err.message
        //   }`,
        //   { toastId: "schedule-error", autoClose: 3000 },
        // );
    const apiMessage = err.response?.data?.message || err.message || "";
  const statusCode = err.response?.status;

  // Check if it's a 404 OR contains the specific "Schedule found" phrase
  const isNotFound = 
    statusCode === 404 || 
    apiMessage.toLowerCase().includes("schedule found for employee");

  // Clean up the message for the user
  const displayMessage = isNotFound 
    ? "No employee scheduled" 
    : `Failed to load schedule data: ${apiMessage}`;

  setError(displayMessage);
  
  toast.warning(displayMessage, { 
    toastId: "schedule-error", 
    autoClose: 3000 
  });
        setScheduleData(null);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false; // Reset the flag
      }
    };

    fetchScheduleData();
  }, [emplId]);

  // Extract unique months from standardSchedule and filter by fiscal year
  const sortedDurations = useMemo(() => {
    if (!scheduleData?.standardSchedule) return [];

    const standardSchedule = scheduleData.standardSchedule;

    return standardSchedule
      .filter((schedule) => {
        // Filter by fiscal year
        if (normalizedFiscalYear === "All") return true;
        return schedule.year === parseInt(normalizedFiscalYear);
      })
      .map((schedule) => ({
        monthNo: schedule.monthNo,
        year: schedule.year,
        workingHours: schedule.workingHours || 0,
        month: schedule.month || "",
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthNo - b.monthNo;
      });
  }, [scheduleData, normalizedFiscalYear]);

  // Get all projects from the response
  const allProjects = useMemo(() => {
    if (!scheduleData?.projects) return [];
    return scheduleData.projects;
  }, [scheduleData]);

  // Get hours for a specific month and project
  const getMonthHours = (project, duration) => {
    const schedule = project.schedules.find(
      (s) => s.month === duration.monthNo && s.year === duration.year,
    );
    return schedule ? schedule.hours || 0 : 0;
  };

  // Calculate total hours for a specific project
  const calculateProjectTotalHours = (project) => {
    return sortedDurations.reduce((total, duration) => {
      return total + getMonthHours(project, duration);
    }, 0);
  };

  // Calculate total hours for a specific duration (column total)
  const calculateDurationTotalHours = (duration) => {
    return allProjects.reduce((total, project) => {
      return total + getMonthHours(project, duration);
    }, 0);
  };

  // Format date for display in US format (MM/DD/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    const correctedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000,
    );

    return correctedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 font-inter flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-xs text-gray-600">
          Loading schedule data...
        </span>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="p-4 font-inter">
  //       <div className="bg-white-100 border border-gray-700 text-gray-500 px-4 py-3 rounded">
  //         {/* <strong className="font-bold text-xs">Error:</strong> */}
  //         <span className="block text-xs text-center">{error}</span>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="p-4 font-inter">
      {/* Employee Info Header - Matching ProjectHoursDetail styling */}
      {/* <div className="w-full relative"> */}
      {/* <div className="grid grid-cols-4 gap-6 text-xs"> */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs sm:text-sm p-3 rounded-md border-l-[6px]  relative"
        style={{
          backgroundColor: "#e9f6fb",
          color: "#17414d",
          borderLeftColor: "#17414d",
          borderRadius: "8px", // Ensures consistent rounding on all corners
        }}
      >
        <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
          <div>
            <span className="font-semibold  ">Employee ID: </span>
            <span className="text-gray-700">{emplId || "-"}</span>
          </div>

          <div>
            <span className="font-semibold  ">Total Projects:</span>
            <span className="text-gray-700">{allProjects.length}</span>
          </div>

          <div>
            <span className="font-semibold  ">POP: </span>
            <span className="text-gray-700">
              {formatDate(scheduleData?.startDate)}
            </span>
            <span className="text-gray-700">
              {formatDate(scheduleData?.endDate)}
            </span>
          </div>
        </div>
        {/* </div> */}
      </div>


      {/* Employee Schedule Tables */}
      {error ? (
 
    // <tr>
       
    //     <div className="bg-white border border-gray-300 text-gray-500 px-4 py-3 rounded font-inter">
    //       <span className="block text-xs text-center font-medium">{error}</span>
    //     </div>
       
    // </tr>
    <div className="flex items-center justify-center min-h-[200px] border border-gray-200 rounded-md mt-2 bg-white">
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-600 font-inter">{error}</p>
      <p className="text-xs text-gray-400 mt-1">Please check the employee ID or schedule criteria.</p>
    </div>
  </div>
  ) : (
      <div className="border-line mt-2">
        <div className="synchronized-tables-container flex w-full">
          {/* First Table - Employee Info */}
          <div
            className="synchronized-table-scroll hide-scrollbar"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            <table className="table-fixed table min-w-full">
              <thead className="sticky-thead thead">
                <tr style={{ height: "48px", lineHeight: "normal" }}>
                  <th className="th-thead-blue min-w-[150px]">Project ID</th>
                  <th className="th-thead-blue min-w-[80px]">Source</th>
                  <th className="th-thead-blue min-w-[70px]">Version</th>
                  <th className="th-thead-blue min-w-[120px]">Manager</th>
                  <th className="th-thead-blue min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody className="tbody">
                {
allProjects.map((project, index) => (
                  <tr key={project.projId || index} >
                    <td className="tbody-td text-xs">
                      {project.projId || "-"}
                    </td>
                    <td className="tbody-td text-xs text-center">
                      {project.source || planType || "WORKING"}
                    </td>
                    <td className="tbody-td text-xs text-center">
                      {project.version ||
                        scheduleData?.version ||
                        selectedPlan?.version ||
                        "-"}
                    </td>
                    <td className="tbody-td text-xs">
                      {project.manager || emplId || "-"}
                    </td>
                    <td className="tbody-td text-xs text-right font-medium">
                      {calculateProjectTotalHours(project).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {allProjects.length === 0 && (
                  <tr style={{ height: "48px" }}>
                    <td
                      colSpan="5"
                      className="tbody-td text-xs text-center text-gray-500"
                    >
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 font-bold bg-gray-50 z-10 border-t-2 border-gray-300">
                <tr style={{ height: "28px" }}>
                  <td colSpan="5" className="th-thead text-xs"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Second Table - Duration Columns */}
          <div
            className="synchronized-table-scroll hide-scrollbar"
            style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}
          >
            <table className="table-fixed table min-w-full">
              <thead className="sticky-thead thead">
                <tr style={{ height: "48px", lineHeight: "normal" }}>
                  {sortedDurations.map((duration) => {
                    // Use the month string directly from API if available
                    const displayDate =
                      duration.month ||
                      `${new Date(duration.year, duration.monthNo - 1)
                        .toLocaleDateString("en-US", { month: "short" })
                        .toUpperCase()} ${duration.year}`;

                    return (
                      <th
                        key={`${duration.monthNo}-${duration.year}`}
                        className="th-thead-blue min-w-[100px]"
                      >
                        <div className="whitespace-nowrap th-thead-blue-nb">
                          {displayDate}
                        </div>
                        <div className="text-xs text-black ">
                          {duration.workingHours} hrs
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="tbody">
                {allProjects.map((project, index) => (
                  <tr key={project.projId || index} >
                    {sortedDurations.map((duration) => {
                      const hours = getMonthHours(project, duration);
                      return (
                        <td
                          key={`${project.projId}-${duration.monthNo}-${duration.year}`}
                          className="tbody-td text-xs text-center"
                        >
                          {hours > 0 ? hours.toFixed(2) : "0.00"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {allProjects.length === 0 && (
                  <tr >
                    <td
                      colSpan={sortedDurations.length}
                      className="tbody-td text-xs text-center text-gray-500"
                    >
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky font-bold bottom-0 bg-[#e5f3fb] z-10 border-t-2 border-gray-300">
                <tr style={{ height: "28px" }}>
                  {sortedDurations.map((duration) => (
                    <td
                      key={`total-${duration.monthNo}-${duration.year}`}
                      className="tbody-td  text-xs font-bold px-2 text-center"
                    >
                      {calculateDurationTotalHours(duration).toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
)}

      {/* {sortedDurations.length === 0 && !isLoading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-xs mt-4">
          No duration data available for the selected fiscal year.
        </div>
      )} */}
    </div>
  );
};

export default EmployeeSchedule;
