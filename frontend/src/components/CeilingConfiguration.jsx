import React, { useState, useEffect } from "react";
import BurdenCostCeilingDetails from "./BurdenCostCeilingDetails";
import EmployeeHoursCeilings from "./EmployeeHoursCeilings";
import DirectCostCeilings from "./DirectCostCeilings";
import HoursCeilings from "./HoursCeilings";
import CostFeeOverrideDetails from "./CostFeeOverrideDetails";
import Select from "react-select";
import { FcDataConfiguration } from "react-icons/fc";
import { backendUrl } from "./config";

const userName = "yourUserName"; // <-- Replace with actual user logic or prop

const CeilingConfiguration = () => {
  // projectInput (free-text) removed — selection should come only from API-provided dropdown
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [activeTab, setActiveTab] = useState("Burden Cost Ceiling Details");
  const [isSearched, setIsSearched] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    "Burden Cost Ceiling Details",
    "Employee Hours Ceilings",
    "Direct Cost Ceilings",
    "Hours Ceilings",
    "Cost Fee Override Details",
  ];

   const projectOptions = availableProjects.map((project) => ({
    value: project.projectId,
    label: project.name
      ? `${project.projectId} - ${project.name}`
      : project.projectId,
  }));

    useEffect(() => {
      const fetchAllProjects = async () => {
        setLoading(true); // Set loading to true for initial project list fetch
        setError(null);
        try {
          const apiUrl = `${backendUrl}/Project/GetAllProjects`; // Your API endpoint to get ALL projects
  
          const response = await fetch(apiUrl);
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const projects = await response.json();
          setAvailableProjects(projects);
  
          // Automatically select the first project if available
          if (projects.length > 0) {
            // prefer the API's provided logical project identifier (projectId) if present
            // const initialId = projects[0].projectId ?? projects[0].id ?? "";
            // setSelectedProjectId(initialId);
            setLoading(false);
          } else {
            setLoading(false); // No projects to load config for
          }
        } catch (e) {
          // console.error("Failed to fetch project list:", e);
          setError(
            "Failed to load project list. Please check your API connection."
          );
          setLoading(false);
        }
      };
  
      fetchAllProjects();
    }, []); 

    useEffect(() => {
      // mark searched when a user chooses a project from dropdown
      setIsSearched(!!selectedProjectId);
    }, [selectedProjectId]);

  // search is handled by selecting a project from the dropdown — no free-text search

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      // toggling the same tab off should clear selection so we don't keep a stale project
      setActiveTab("");
      setIsSearched(false);
      setSelectedProjectId("");
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 flex flex-col gap-y-2 ml-2 ">
        <div className="p-4 border-b w-full rounded-sm border-gray-100 flex justify-between bg-white">
          <h2 className="text-lg  font-bold text-gray-800 flex items-center gap-2">
            <FcDataConfiguration size={20} className="text-blue-500" />
            Ceiling Configuration
          </h2>
        </div>
      <div className="w-full mx-auto bg-white  p-4 rounded space-y-4 ">
        {/* <h1 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
        Ceiling Configuration
      </h1> */}

        {/* project selector (API-sourced) — free-text entry removed on purpose */}
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="projectId" className="input-label">
            Project ID <span className="text-red-500">*</span>
          </label>
          <Select
            inputId="projectId"
            className="w-[50%] cursor-pointer"
            options={projectOptions}
            isLoading={loading}
            value={
              selectedProjectId
                ? projectOptions.find((opt) => opt.value === selectedProjectId)
                : null
            }
            onChange={(opt) => setSelectedProjectId(opt ? opt.value : "")}
            isSearchable
            placeholder="Search & select a project"
            menuPlacement="auto"
          />
        </div>

        <div className=" mb-4">
          <nav className="flex flex-wrap gap-2 sm:gap-3" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors${
                  activeTab === tab
                    ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
                    : "text-gray-600 hover:text-gray-800 bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-[400px]">
          {activeTab === "Burden Cost Ceiling Details" && (
            <BurdenCostCeilingDetails
              projectId={selectedProjectId}
              isSearched={isSearched}
              updatedBy={userName}
            />
          )}
          {activeTab === "Employee Hours Ceilings" && (
            <EmployeeHoursCeilings
              projectId={selectedProjectId}
              isSearched={isSearched}
            />
          )}
          {activeTab === "Direct Cost Ceilings" && (
            <DirectCostCeilings
              projectId={selectedProjectId}
              isSearched={isSearched}
              updatedBy={userName}
            />
          )}
          {activeTab === "Hours Ceilings" && (
            <HoursCeilings
              projectId={selectedProjectId}
              isSearched={isSearched}
              updatedBy={userName}
            />
          )}
          {activeTab === "Cost Fee Override Details" && (
            <CostFeeOverrideDetails
              projectId={selectedProjectId}
              isSearched={isSearched}
              updatedBy={userName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CeilingConfiguration;
