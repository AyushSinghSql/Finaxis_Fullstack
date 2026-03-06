// //////
// "use client";
import { useState } from "react";
import React from "react";
import { FaFilePdf } from 'react-icons/fa'; 

// Components
import ForecastReport from "./ForecastReport";
import SpendChart from "./SpendChart"; 
import UtilizationChart from "./UtilizationChart"; 
import Opportunities from "./Opportunities"; 
import PSRTrendReport from "./PSRTrendReport";
import IS_Report from "./IS_Report"; // Import the new Income Statement component


const FinancialDashboard = () => {
  // Added 'is_report' to the state logic
  const [activeTab, setActiveTab] = useState('forecast'); 
  const [fullApiResponse] = useState({ employeeForecastSummary: [] }); 

  const getTabClasses = (tabName) => `px-6 py-3 text-base font-semibold transition-all duration-300 focus:outline-none ${
    activeTab === tabName 
      ? "border-b-4 border-blue-600 text-blue-600 bg-white shadow-lg" 
      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
  }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div id="financial-dashboard-content"> 
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-full mx-auto px-6 flex justify-between items-center">
            <div className="flex overflow-x-auto">
              <button className={getTabClasses('forecast')} onClick={() => setActiveTab('forecast')}>📊 Forecast</button>
              <button className={getTabClasses('spend')} onClick={() => setActiveTab('spend')}>💰 Spend</button>
              {/* <button className={getTabClasses('utilization')} onClick={() => setActiveTab('utilization')}>👥 Utilization</button> */}
              {/* <button className={getTabClasses('opportunities')} onClick={() => setActiveTab('opportunities')}>✨ Opportunities</button> */}
              <button className={getTabClasses('psrtrend')} onClick={() => setActiveTab('psrtrend')}>📈 PSR Trend</button>
              
              {/* New Income Statement Tab */}
              <button className={getTabClasses('is_report')} onClick={() => setActiveTab('is_report')}>📄 Income Statement</button>
            </div>
          </div>
        </div>

        <div className="max-w-full mx-auto">
          {activeTab === 'forecast' && <div className="p-4"><ForecastReport fullApiResponse={fullApiResponse} /></div>}
          {activeTab === 'spend' && <div className="p-4"><SpendChart fullApiResponse={fullApiResponse} /></div>}
          {/* {activeTab === 'utilization' && <div className="p-4"><UtilizationChart fullApiResponse={fullApiResponse} /></div>} */}
          {/* {activeTab === 'opportunities' && <div className="p-4"><Opportunities fullApiResponse={fullApiResponse} /></div>} */}
          
          {activeTab === 'psrtrend' && (
            <div className="p-4 bg-white min-h-screen">
              <PSRTrendReport />
            </div>
          )}

          {/* Render the Income Statement Component */}
          {activeTab === 'is_report' && (
            <div className="p-4 bg-white min-h-screen">
              <IS_Report />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;