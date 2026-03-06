import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  BarChart2,
  Layers,
  FileText,
  Settings,
  BriefcaseBusiness,
  SlidersHorizontal,
  Users, // new icon for New Business Budget section
} from "lucide-react";

const NavigationSidebar = ({setIsHovered,isHovered,setIsSidebarOpen,isSidebarOpen, canView}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [onHoverChange, setOnhoverChange] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // --- ALL ORIGINAL LOGIC PRESERVED ---
  const [generalMenuOpen, setGeneralMenuOpen] = useState(
    pathname.includes("/dashboard/project-budget-status") ||
      pathname.includes("/dashboard/new-business") ||
      pathname.includes("/dashboard/pool-rate-tabs") ||
      pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping") ||
      pathname.includes("/dashboard/template") ||
      pathname.includes("/dashboard/ceiling-configuration") ||
      pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/prospective-id-setup") ||
      pathname.includes("/dashboard/display-settings") ||
      pathname.includes("/dashboard/annual-holidays") ||
      pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
      pathname.includes("/dashboard/analog-rate") ||
      pathname.includes("/dashboard/project-report") ||
      pathname.includes("/dashboard/role-rights") ||
      pathname.includes("/dashboard/mass-utility") ||
      pathname.includes("/dashboard/import-utility") ||
      pathname.includes("/dashboard/account-mapping") ||
      pathname.includes("/dashboard/projectmapping") ||
      pathname.includes("/dashboard/monthly-forecast") ||
      pathname.includes("/dashboard/create-project-budget") ||
      pathname.includes("/dashboard/import-opportunity") ||
      pathname.includes("/dashboard/manage-users") ||
      pathname.includes("/dashboard/manage-groups") ||
      pathname.includes("/dashboard/override-settings") || pathname.includes("/dashboard/pricing")
      || pathname.includes("/dashboard/financial-report")
  );

  const [planningOpen, setPlanningOpen] = useState(
    pathname.includes("/dashboard/project-budget-status") ||
      // pathname.includes("/dashboard/new-business") ||
      pathname.includes("/dashboard/project-report") ||
      pathname.includes("/dashboard/mass-utility") ||
      pathname.includes("/dashboard/import-utility") ||
      pathname.includes("/dashboard/monthly-forecast") || pathname.includes("/dashboard/pricing") || pathname.includes("/dashboard/financial-report")
  );

  const [configurationOpen, setConfigurationOpen] = useState(
    pathname.includes("/dashboard/pool-rate-tabs") ||
      pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping") ||
      pathname.includes("/dashboard/template") ||
      pathname.includes("/dashboard/ceiling-configuration") ||
      pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/prospective-id-setup") ||
      pathname.includes("/dashboard/display-settings") ||
      pathname.includes("/dashboard/annual-holidays") ||
      pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
      pathname.includes("/dashboard/analog-rate") ||
      pathname.includes("/dashboard/role-rights") ||
      pathname.includes("/dashboard/account-mapping") ||
      pathname.includes("/dashboard/projectmapping") ||
      pathname.includes("/dashboard/override-settings")
  );

  const [poolMappingOpen, setPoolMappingOpen] = useState(
    pathname.includes("/dashboard/pool-configuration") ||
      pathname.includes("/dashboard/template-pool-mapping")
  );

  // NEW: New Business Budget section open state
  const [newBusinessSectionOpen, setNewBusinessSectionOpen] = useState(
    pathname.includes("/dashboard/new-business") ||
      pathname.includes("/dashboard/create-project-budget") || pathname.includes("/dashboard/import-opportunity") 
  );

  // NEW: Manage (Users & Groups) section open state
  const [manageSectionOpen, setManageSectionOpen] = useState(
    pathname.includes("/dashboard/manage-users") ||
      pathname.includes("/dashboard/manage-groups")
  );

  const [manageSettingOpen, setManageSettingOpen] = useState(
    pathname.includes("/dashboard/global-configuration") ||
      pathname.includes("/dashboard/display-settings")
  );

  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(pathname);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userName, setUserName] = useState("");

  // hover state (existing)
  // const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem("currentUser");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUserName(userObj.name);
        setCurrentUserRole(userObj.role ? userObj.role.toLowerCase() : null);
      } catch {
        setCurrentUserRole(null);
      }
    }
  }, []);

  const appVersion = import.meta.env.VITE_APP_VERSION || "N/A";

  useEffect(() => {
    setSelectedPage(pathname);

    if (currentUserRole === "admin") {
      setGeneralMenuOpen(
        pathname.includes("/dashboard/project-budget-status") ||
          pathname.includes("/dashboard/new-business") ||
          pathname.includes("/dashboard/pool-rate-tabs") ||
          pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping") ||
          pathname.includes("/dashboard/template") ||
          pathname.includes("/dashboard/ceiling-configuration") ||
          pathname.includes("/dashboard/global-configuration") ||
          pathname.includes("/dashboard/prospective-id-setup") ||
          pathname.includes("/dashboard/display-settings") ||
          pathname.includes("/dashboard/annual-holidays") ||
          pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
          pathname.includes("/dashboard/analog-rate") ||
          pathname.includes("/dashboard/project-report") ||
          pathname.includes("/dashboard/role-rights") ||
          pathname.includes("/dashboard/mass-utility") ||pathname.includes("/dashboard/import-utility") ||
          pathname.includes("/dashboard/account-mapping") ||
          pathname.includes("/dashboard/projectmapping") ||
          pathname.includes("/dashboard/monthly-forecast") ||
          pathname.includes("/dashboard/create-project-budget") ||
           pathname.includes("/dashboard/import-opportunity") ||
          pathname.includes("/dashboard/manage-users") ||
          pathname.includes("/dashboard/manage-groups") ||
          pathname.includes("/dashboard/override-settings") || pathname.includes("/dashboard/pricing") || pathname.includes("/dashboard/financial-report")
      );
      setPlanningOpen(
        pathname.includes("/dashboard/project-budget-status") ||
          // pathname.includes("/dashboard/new-business") ||
          pathname.includes("/dashboard/project-report") ||
          pathname.includes("/dashboard/mass-utility") ||pathname.includes("/dashboard/import-utility") ||
          pathname.includes("/dashboard/monthly-forecast") || pathname.includes("/dashboard/pricing") || pathname.includes("/dashboard/financial-report")
      );
      setConfigurationOpen(
        pathname.includes("/dashboard/pool-rate-tabs") ||
          pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping") ||
          pathname.includes("/dashboard/template") ||
          pathname.includes("/dashboard/ceiling-configuration") ||
          pathname.includes("/dashboard/global-configuration") ||
          pathname.includes("/dashboard/prospective-id-setup") ||
          pathname.includes("/dashboard/display-settings") ||
          pathname.includes("/dashboard/annual-holidays") ||
          pathname.includes("/dashboard/maintain-fiscal-year-periods") ||
          pathname.includes("/dashboard/analog-rate") ||
          pathname.includes("/dashboard/role-rights") ||
          pathname.includes("/dashboard/account-mapping") ||
          pathname.includes("/dashboard/projectmapping") ||
          pathname.includes("/dashboard/override-settings")
      );
      setPoolMappingOpen(
        pathname.includes("/dashboard/pool-configuration") ||
          pathname.includes("/dashboard/template-pool-mapping")
      );
      setNewBusinessSectionOpen(
        pathname.includes("/dashboard/new-business") ||
          pathname.includes("/dashboard/create-project-budget") ||
          pathname.includes("/dashboard/import-opportunity")
      );
      setManageSectionOpen(
        pathname.includes("/dashboard/manage-users") ||
          pathname.includes("/dashboard/manage-groups")
      );
    } else if (currentUserRole === "user" || currentUserRole === "User") {
      const isProjectBudget = pathname.includes(
        "/dashboard/project-budget-status"
      ) ||
          pathname.includes("/dashboard/project-report") ||
          pathname.includes("/dashboard/mass-utility") || pathname.includes("/dashboard/import-utility") ||pathname.includes("dashboard/new-business") || pathname.includes("/dashboard/pricing") || pathname.includes("/dashboard/financial-report") ;
      setGeneralMenuOpen(isProjectBudget);
      setPlanningOpen(isProjectBudget);
      setConfigurationOpen(false);
      setPoolMappingOpen(false);
      setNewBusinessSectionOpen(false);
      setManageSectionOpen(false);

      if (!isProjectBudget) {
        navigate("/dashboard/project-budget-status");
      }
    }
  }, [pathname, currentUserRole, navigate]);

  const handleLinkClick = (pagePath) => {
    setSelectedPage(pagePath);
    navigate(pagePath);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleCloseSidebar = () => {
    setSearchTerm("");
    setIsSidebarOpen(false);
  };
  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };
const isExpanded = isSidebarOpen || isHovered;


 return (
    <div
      // onMouseOver={handleOpenSidebar}
      // onMouseLeave={handleCloseSidebar}
      className="flex min-h-screen font-inter bg-white"
    >
      {/* Mobile Toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-1 rounded-md"
        onClick={() => setIsSidebarOpen(!isExpanded )}
      >
        {isExpanded  ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar - Hover to expand */}
      <div
        // onMouseEnter={() => setIsHovered(true)}
        // onMouseLeave={() => setIsHovered(false)}
        // className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm
        //   ${isExpanded  ? "translate-x-0" : "-translate-x-full"} 
        //   md:translate-x-0 
        //   w-14 hover:w-55
        // `}
        onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    className={`fixed inset-y-0 left-0 z-40 flex flex-col
      bg-white border-r border-gray-200
      transition-all duration-300 ease-in-out shadow-sm
      ${isExpanded  ? "translate-x-0 w-55" : "-translate-x-full w-14"}
      md:translate-x-0
      
    `}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-4 ">
          {/* Menu / General Toggle Section */}
          <div
            className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 transition`}
            onClick={() => setGeneralMenuOpen(!generalMenuOpen)}
          >
            <div className="w-8 flex justify-center">
              {generalMenuOpen ? <Minus size={16} /> : <Plus size={16} />}
            </div>
            <span
              className={`ml-4 text-sm font-semibold transition-opacity duration-200 ${
                isExpanded  ? "opacity-100" : "opacity-0"
              }`}
            >
              Menu
            </span>
          </div>

          {generalMenuOpen && (
            <div className="space-y-1 mt-2">
              {/* --- PLANNING SECTION --- */}
              <div>
                <div
                  className={`px-3 pt-4 pb-2 ${isExpanded  ? "block" : "hidden"}`}
                >
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value.toLowerCase())
                    }
                    className="border border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#17414d] w-full  bg-white shadow-inner"
                  />
                </div>
                {!searchTerm && (
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 group"
                    onClick={() => setPlanningOpen(!planningOpen)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex justify-center">
                        <BarChart2 className="w-6 h-6 text-gray-600 group-hover:text-[#17414d]" />
                      </div>
                      <span
                        className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${
                          isExpanded  ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        Planning
                      </span>
                    </div>
                    {isExpanded  &&
                      (planningOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      ))}
                  </div>
                )}

                {(planningOpen || searchTerm) && isExpanded  && (
                  <div className="ml-12 mr-4 space-y-1 border-l border-gray-100">
                    <NavItem
                      label="Project Planning"
                      path="/dashboard/project-budget-status"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                    {(canView("projectReport")  &&
                    <>
                    <NavItem
                      label="Reporting"
                      path="/dashboard/project-report"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                    </>
                    )}
                     
                    {canView("massUtility") && (
                    <NavItem
                      label="Mass Utility"
                      path="/dashboard/mass-utility"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                    )}
                    {canView("pricing") && (
                    <NavItem
                      label="Pricing"
                      path="/dashboard/pricing"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                    )}

                    {canView("financialReport") && (
                    <NavItem
                      label="Financial Report"
                      path="/dashboard/financial-report"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />)}
                    {/* <NavItem
                      label="Import"
                      path="/dashboard/import-utility"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    /> */}
                     
                    {/* <NavItem
                      label="New Business Budget"
                      path="/dashboard/new-business"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                    /> */}
                    {/* Monthly Forecast is still commented, preserving logic */}
                    {/* <NavItem
                      label="Monthly Forecast"
                      path="/dashboard/monthly-forecast"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                    /> */}
                  </div>
                )}
              </div>

              {/* --- NEW BUSINESS BUDGET SECTION (NEW) --- */}
               {/* {currentUserRole === "admin" && ( */}
               {(canView("manageNewBusiness") ||
                canView("transferUtility") ||
                canView("impOpportunity")) && (
              <div>
                {!searchTerm && (
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 group"
                    onClick={() =>
                      setNewBusinessSectionOpen(!newBusinessSectionOpen)
                    }
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex justify-center">
                        <BriefcaseBusiness className="w-6 h-6 text-gray-600 group-hover:text-[#17414d]" />
                      </div>
                      <span
                        className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${
                          isExpanded  ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        New Business Budget
                      </span>
                    </div>
                    {isExpanded  &&
                      (newBusinessSectionOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      ))}
                  </div>
                )}

                {(newBusinessSectionOpen || searchTerm) && isExpanded  && (
                  <div className="ml-12 mr-4 space-y-1 border-l border-gray-100">
                   
                   {canView("impOpportunity") && (
                    <>
                    <NavItem
                      label="Import Opportunity"
                      path="/dashboard/import-opportunity"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                    </>
                    )}
                    {canView("manageNewBusiness") && (
                    <NavItem
                      label="Manage New Business"
                      path="/dashboard/new-business"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                    )}
                   {canView("transferUtility") && (
                    <NavItem
                      label="Transfer Project Budget"
                      path="/dashboard/create-project-budget"
                      selected={selectedPage}
                      onClick={handleLinkClick}
                      searchTerm={searchTerm}
                    />
                     )}
                     
                     
                  </div>
                )}
              </div>
                )}
               {/* )} */}

              {(canView("manageUser") || canView("manageGroups")) && (
                <div>
                  {!searchTerm && (
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 group"
                      onClick={() => setManageSectionOpen(!manageSectionOpen)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 flex justify-center">
                          <Users className="w-6 h-6 text-gray-600 group-hover:text-[#17414d]" />
                        </div>
                        <span
                          className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${
                            isExpanded  ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          Manage
                        </span>
                      </div>
                      {isExpanded  &&
                        (manageSectionOpen ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        ))}
                    </div>
                  )}

                  {(manageSectionOpen || searchTerm) && isExpanded  && (
                    <div className="ml-12 mr-4 space-y-1 border-l border-gray-100">
                      {canView("manageGroups") && (
                      <NavItem
                        label="Manage Groups"
                        path="/dashboard/manage-groups"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                      )}
                      {canView("manageUser") && (
                      <NavItem
                        label="Manage Users"
                        path="/dashboard/manage-users"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Nested Pool Mapping */}
              {/* {currentUserRole === "admin" && (
    <div>
     <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:text-[#17414d] "
                    onClick={() => setPoolMappingOpen(!poolMappingOpen)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex justify-center">
                        <SlidersHorizontal className="w-6 h-6 text-gray-600 roup-hover:text-[#17414d]" />
                      </div>
                      <span
                        className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${
                          isExpanded  ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        Pool 
                      </span>
                    </div>
                    {isExpanded  &&
                      (poolMappingOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      ))}
                  </div>
{poolMappingOpen && isExpanded  && (
                      <div className="py-1">
                        {poolMappingOpen && (
                          <div className="ml-12 mr-4 space-y-1 border-l border-gray-100"> */}
              {/* <NavItem
                              label="Org Account"
                              path="/dashboard/pool-configuration"
                              selected={selectedPage}
                              onClick={handleLinkClick}
                            />
                            <NavItem
                              label="Template Pool Mapping"
                              path="/dashboard/template-pool-mapping"
                              selected={selectedPage}
                              onClick={handleLinkClick}
                            /> */}

              {/* </div>
                        )}
                      </div>
                      )}
                      </div>
   )} */}

              {/* --- CONFIGURATION SECTION --- */}
              {(canView("globalConfiguration") ||
                canView("poolRateTabs") ||
                canView("projectOrgSecurity") ||
                canView("accountMapping") ||
                canView("analogRate") ||
                canView("ceilingConfiguration") ||
                canView("fiscalYearPeriods") ||
                canView("annualHolidays") ||
                canView("prospectiveIdSetup") ||
                canView("roleRights")) && (
                <div>
                  {!searchTerm && (
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:text-[#17414d] "
                      onClick={() => setConfigurationOpen(!configurationOpen)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 flex justify-center">
                          <Layers className="w-6 h-6 text-gray-600 roup-hover:text-[#17414d]" />
                        </div>
                        <span
                          className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${
                            isExpanded  ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          Settings
                        </span>
                      </div>
                      {isExpanded  &&
                        (configurationOpen ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        ))}
                    </div>
                  )}

                  {(configurationOpen || searchTerm) && isExpanded  && (
                    <div className="ml-12 mr-4 space-y-1 border-l border-gray-100">
                      {canView("globalConfiguration") && (
                      <NavItem
                        label="Configuration Setting"
                        path="/dashboard/global-configuration"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                      )}
                      {canView("poolRateTabs") && (
                      <NavItem
                        label="Burden Setup"
                        path="/dashboard/pool-rate-tabs"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                      )}
                       {canView("projectOrgSecurity") && (
                      <NavItem
                        label="Project Org Security"
                        path="/dashboard/projectmapping"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                       )}
                       {canView("accountMapping") && (
                      <NavItem
                        label="Account Mapping"
                        path="/dashboard/account-mapping"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                       )}
                       {canView("analogRate") && (
                      <NavItem
                        label="NBIs Analogous Rate"
                        path="/dashboard/analog-rate"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                       )}
                       {canView("ceilingConfiguration") && (
                      <NavItem
                        label="Ceiling Configuration"
                        path="/dashboard/ceiling-configuration"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                       )}
                        {canView("fiscalYearPeriods") && (
                      <NavItem
                        label="Fiscal Year Periods"
                        path="/dashboard/maintain-fiscal-year-periods"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                        )}
                          {canView("annualHolidays") && (
                      <NavItem
                        label="Annual Holidays"
                        path="/dashboard/annual-holidays"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                          )}
                           {canView("prospectiveIdSetup") && (
                      <NavItem
                        label="Prospective ID Setup"
                        path="/dashboard/prospective-id-setup"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                        searchTerm={searchTerm}
                      />
                           )}
                              {canView("roleRights") && (
                      <NavItem
                        label="Rights Settings"
                        path="/dashboard/role-rights"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      />
                              )}
                      {/* <NavItem
                        label="Override Configuration"
                        path="/dashboard/override-settings"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      /> */}
                    </div>
                  )}
                </div>
              )}

              {/* Setting Tap */}
              {/* {currentUserRole === "admin" && (
    <div>
     <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:text-[#17414d] "
                    onClick={() => setManageSettingOpen(!manageSettingOpen)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 flex justify-center">
                        <Settings className="w-6 h-6 text-gray-600 roup-hover:text-[#17414d]" />
                      </div>
                      <span
                        className={`ml-4 text-sm font-medium text-gray-700 transition-opacity duration-200 ${
                          isExpanded  ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        Settings
                      </span>
                    </div>
                    {isExpanded  &&
                      (manageSettingOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      ))}
                  </div>
{manageSettingOpen && isExpanded  && (
                      <div className="py-1">
                        {manageSettingOpen && (
                          <div className="ml-12 mr-4 space-y-1 border-l border-gray-100"> */}

              {/* <NavItem
                        label="Display Settings"
                        path="/dashboard/display-settings"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      /> */}
              {/* <NavItem
                        label="Rights Settings"
                        path="/dashboard/role-rights"
                        selected={selectedPage}
                        onClick={handleLinkClick}
                      /> */}
              {/* </div>
                        )}
                      </div>
                      )}
                      </div>
   )} */}
            </div>
          )}
        </div>

        {/* Footer Version */}
        <div
          className={`mt-auto p-4 border-t border-gray-100 transition-opacity duration-200 ${
            isExpanded  ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="text-[10px] text-gray-400 font-mono select-none">
            v{appVersion}
          </div>
        </div>
      </div>

      {/* Background Overlay for mobile */}
      {/* {isExpanded  && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-30"
          onClick={handleCloseSidebar}
        ></div>
      )} */}
    </div>
  );
};

const NavItem = ({ label, path, selected, onClick, searchTerm }) => {
  if (searchTerm && !label.toLowerCase().includes(searchTerm)) {
    return null;
  }

  return (
    <Link
      to={path}
      className={`block px-3 py-2 text-xs transition-colors rounded-md ${
        selected === path
          ? "text-white font-semibold"
          : "text-gray-500 hover:text-gray-900"
      }`}
      style={{
        backgroundColor: selected === path ? "#17414d" : "rgb(245,245,245)",
      }}
      onClick={(e) => {
        e.preventDefault();
        onClick(path);
      }}
    >
      {label}
    </Link>
  );
};
  
export default NavigationSidebar;