// // import React from "react";
// // import { ToastContainer } from "react-toastify";
// // import "react-toastify/dist/ReactToastify.css";
// // import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// // import Login from "./components/Login";
// // import Dashboard from "./pages/Dashboard";

// // function App() {
// //   return (
// //     <>
// //      <Router>
// //       <Routes>
// //         <Route path="/" element={<Login />} />
// //         <Route path="/dashboard/*" element={<Dashboard />} />
// //       </Routes>
// //     </Router>
// //     <ToastContainer
// //         position="top-right"
// //         autoClose={3000}
// //         hideProgressBar={false}
// //         closeOnClick
// //       />
// //     </>

// //   );
// // }

// // export default App;

// import React from "react";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import Login from "./components/Login";
// import Dashboard from "./pages/Dashboard";

// function App() {
//   if (import.meta.env.VITE_CHECK === "production") {
//     console.log = () => {};
//     console.info = () => {};
//     console.warn = () => {};
//     console.error = () => {};
//   }

//   return (
//     <>
//       <Router>
//         <Routes>
//           <Route path="/" element={<Login />} />
//           <Route path="/login" element={<Login />} /> {/* ADD THIS LINE */}
//           <Route path="/dashboard/*" element={<Dashboard />} />
//         </Routes>
//       </Router>
//       <ToastContainer
//         position="top-right"
//         autoClose={3000}
//         hideProgressBar={false}
//         closeOnClick
//       />
//     </>
//   );
// }

// export default App;

import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages & Components
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import ProjectBudgetStatus from "./components/ProjectBudgetStatus";
import FinancialDashboard from "./components/FinancialDashboard";
import MassUtilityProject from "./components/MassUtilityProject";
import Pricing from "./components/Pricing";
import Import from "./components/Import";
import UserOrgProjectMapping from "./components/UserOrgProjectMapping";
import NewBusinessComponent from "./components/NewBusinessComponent";
import CreateProjectBudget from "./components/CreateProjectBudget";
import Opportunities from "./components/Opportunities";
import ManageGroups from "./components/ManageGroups";
import ManageUser from "./components/ManageUser";
import AnalysisByPeriodContent from "./components/AnalysisByPeriodContent";
import PoolRateTabs from "./components/PoolRateTabs";
import ConfigureField from "./components/ConfigureField";
import OverrideSettings from "./components/OverrideSettings";
import PoolConfigurationTable from "./components/PoolConfigurationTable";
import TemplatePoolMapping from "./components/TemplatePoolMapping";
import Template from "./components/Template";
import CeilingConfiguration from "./components/CeilingConfiguration";
import AnalogRate from "./components/AnalogRate";
import GlobalConfiguration from "./components/GlobalConfiguration";
import ProspectiveIdSetup from "./components/ProspectiveIdSetup";
import DisplaySettings from "./components/DisplaySettings";
import AnnualHolidays from "./components/HolidayCalendar";
import MaintainFiscalYearPeriods from "./components/MaintainFiscalYearPeriods";
import AccountMapping from "./components/AccountMapping";
import FinancialReport from "./components/FinancialReport";

// Role-based Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const storedUser = localStorage.getItem("currentUser");
  if (!storedUser) return <Navigate to="/login" replace />;
  
  const userObj = JSON.parse(storedUser);
  if (!userObj.role || !allowedRoles.includes(userObj.role.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  if (import.meta.env.VITE_CHECK === "production") {
    console.log = console.info = console.warn = console.error = () => {};
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard Layout and its Children */}
          <Route path="/dashboard" element={<Dashboard />}>
            {/* Default Index View */}
            <Route index element={
                <div className="flex items-center justify-center min-h-[80vh]">
                  <div className="max-w-md w-full text-center">
                    <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-900 text-transparent bg-clip-text">FinAxis</span>
                    <h1 className="text-2xl font-semibold text-gray-900 mt-4">Welcome to FinAxis Planning</h1>
                    <p className="text-gray-600 mt-2">Select an option from the sidebar to get started.</p>
                  </div>
                </div>
            } />

            {/* General Routes */}
            <Route path="project-budget-status" element={<ProjectBudgetStatus />} />
            <Route path="project-report" element={<div className="mt-12 ml-2"><FinancialDashboard /></div>} />
            <Route path="mass-utility" element={<div className="mt-12 ml-2"><MassUtilityProject /></div>} />
            <Route path="pricing" element={<div className="mt-12 ml-2"><Pricing /></div>} />
            <Route path="import-utility" element={<div className="mt-12 ml-2"><Import /></div>} />
            <Route path="projectmapping" element={<UserOrgProjectMapping />} />
            <Route path="new-business" element={<div className="mt-10"><NewBusinessComponent /></div>} />
            <Route path="create-project-budget" element={<div className="mt-12 ml-2"><CreateProjectBudget /></div>} />
            <Route path="import-opportunity" element={<div className="mt-12 ml-2"><Opportunities /></div>} />
            <Route path="monthly-forecast" element={<div className="mt-12 ml-2"><AnalysisByPeriodContent /></div>} />
             <Route path="financial-report" element={<div className="mt-12 ml-2"><FinancialReport /></div>} />

            {/* Admin Only Routes */}
            <Route path="manage-groups" element={<div className="mt-12 ml-2"><ManageGroups /></div>} />
            <Route path="manage-users" element={<div className="mt-12 ml-2"><ManageUser /></div>} />
            <Route path="pool-rate-tabs" element={<div className="mt-12"><PoolRateTabs /></div>} />
            <Route path="role-rights" element={<div className="mt-12 ml-2"><ConfigureField /></div>} />
            <Route path="override-settings" element={<div className="mt-12 ml-2"><OverrideSettings /></div>} />
            <Route path="pool-configuration" element={<div className="mt-12 ml-2"><PoolConfigurationTable /></div>} />
            <Route path="template-pool-mapping" element={<div className="mt-12 ml-2"><TemplatePoolMapping /></div>} />
            <Route path="template" element={<div className="mt-12 ml-2"><Template /></div>} />
            <Route path="ceiling-configuration" element={<div className="mt-12"><CeilingConfiguration /></div>} />
            <Route path="analog-rate" element={<div className="mt-12"><AnalogRate /></div>} />
            <Route path="global-configuration" element={<div className="mt-12 ml-2"><GlobalConfiguration /></div>} />
            <Route path="prospective-id-setup" element={<div className="mt-10"><ProspectiveIdSetup /></div>} />
            <Route path="display-settings" element={<div className="mt-12 ml-2"><DisplaySettings /></div>} />
            <Route path="annual-holidays" element={<div className="mt-4"><AnnualHolidays /></div>} />
            <Route path="maintain-fiscal-year-periods" element={<div className="mt-12 ml-2"><MaintainFiscalYearPeriods /></div>} />
            <Route path="account-mapping" element={<div className="mt-10"><AccountMapping /></div>} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick />
    </>
  );
}

export default App;
