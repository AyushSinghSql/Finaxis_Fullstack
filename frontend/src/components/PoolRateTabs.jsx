
// import React, { useEffect, useState } from "react";
// import Fringe from "./Fringe";
// import HR from "./HR";
// import MH from "./MH";
// import Overhead from "./Overhead";
// import Rates from "./Rates";
// import GNA from "./GNA";
// import PoolRate from "./PoolRate";
// import Template from "./Template";
// import PoolConfigurationTable from "./PoolConfigurationTable";
// import TemplateManager from "./Template";
// import { MdRateReview } from "react-icons/md";
// import axios from "axios";
// import { backendUrl } from "./config";
// import GenericPoolTable from "./GenericPoolTable";




// const PoolRateTabs = () => {
//   // const [activeTab, setActiveTab] = useState("Rates");
//   const [activeTab, setActiveTab] = useState("Template");
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState([]);

//   const [tabs, setTabs] = useState([
//     { id: "Template", label: "Add Template" },
//     { id: "Rate Configure", label: "Rate Configure" },
//     { id: "Rate", label: "Forecast Rate" },
//   ]);

//   useEffect(() => {
//     const getPoolAccess = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);

//         // 1. Define your initial static tabs
//         const baseTabs = [
//           { id: "Template", label: "Add Template" },
//           { id: "Rate Configure", label: "Rate Configure" },
//           { id: "Rate", label: "Forecast Rate" },
//         ];

//         // 2. Map and Sort the dynamic data from API
//         // We use the 'name' for both id and label as requested
//         const dynamicTabs = res.data
//           .sort((a, b) => a.sequence - b.sequence)
//           .map((pool) => ({
//             id: pool.name,
//             label: pool.name,
//           }));

//         // 3. Combine them and add the final "Base Setup" tab
//         setTabs([
//           ...baseTabs,
//           ...dynamicTabs,
//           { id: "Base Setup", label: "Base Setup" },
//         ]);

//         setData(res.data);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     getPoolAccess();
//   }, []); // Added empty dependency array to prevent infinite loop

//   // const tabs = [
//   //   { id: "Template", label: "Add Template" },
//   //   { id: "Rate Configure", label: "Rate Configure" },
//   //   { id: "Rate", label: "Forecast Rate" },
//   //   { id: "Fringe", label: "Fringe" },
//   //   { id: "HR", label: "HR" },
//   //   { id: "Overhead", label: "Overhead" },
//   //   { id: "M&H", label: "M&H" },
//   //   { id: "G&A", label: "G&A" },
//   //   { id: "Base Setup", label: "Base Setup" },
//   // ];

//   // useEffect(() => {
//   //   const getPoolAccess = async () => {
//   //     setLoading(true)
//   //     try {
//   //       const res = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);
//   //       setData(res)
//   //     } catch (error) {
//   //       console.log(error)
//   //     } finally {
//   //       setLoading(false)
//   //     }
//   //   }
//   //   getPoolAccess()
//   // })

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case "Rate Configure":
//         return <PoolRate />;
//       case "Fringe":
//         return <Fringe />;
//       case "HR":
//         return <HR />;
//       case "Overhead":
//         return <Overhead />;
//       case "M&H":
//         return <MH />;
//       case "G&A":
//         return <GNA />;
//       case "Rate":
//         return <Rates />;
//       case "Template":
//         return (
//           <>
//             <TemplateManager />
//           </>
//         );
//       case "Base Setup":
//         return <PoolConfigurationTable />;
//       default:
//         return null;
//     }
//   };

//   const isDynamicPool = data.some(pool => pool.name === activeTab);
    
//     if (isDynamicPool) {
//       return <GenericPoolTable poolType={activeTab} />;
//     }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-4">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//         <span className="ml-2 mt-4">Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="ml-2 w-full">
//       {/* Header */}
//       <div className="p-4 w-full  flex items-center rounded-sm bg-white">
//         <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//           <MdRateReview size={20} className="text-blue-500" />
//           Burden Rate
//         </h2>
//       </div>

//       {/* Scrollable Tab Header */}
//       <div className="w-full bg-white rounded mt-2 p-4">
//         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-w-full">
//           {tabs.map((tab) => {
//             const isActive = activeTab === tab.id;
//             return (
//               <button
//                 key={tab.id}
//                 type="button"
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors ${
//                   isActive
//                     ? "border-b-2 bg-[#17414d] text-white group-hover:text-gray"
//                     : "bg-gray-100 text-gray-700 border border-gray-200 hover:text-gray-800 "
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             );
//           })}
//         </div>
//         <div className="w-full min-h-[400px] mt-2">{renderTabContent()}</div>
//       </div>

//       {/* Content card with full width */}
//     </div>
//   );
// };

// export default PoolRateTabs;

import React, { useEffect, useState } from "react";
import Rates from "./Rates";
import PoolRate from "./PoolRate";
import TemplateManager from "./Template";
import PoolConfigurationTable from "./PoolConfigurationTable";
import GenericPoolTable from "./GenericPoolTable";
import { MdRateReview } from "react-icons/md";
import axios from "axios";
import { backendUrl } from "./config";

const PoolRateTabs = () => {
  const [activeTab, setActiveTab] = useState("Template");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [tabs, setTabs] = useState([
    { id: "Template", label: "Add Template" },
    { id: "Rate Configure", label: "Rate Configure" },
    { id: "Rate", label: "Forecast Rate" },
  ]);

  // useEffect(() => {
  //   const getPoolAccess = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);

  //       const baseTabs = [
  //         { id: "Template", label: "Add Template" },
  //         { id: "Rate Configure", label: "Rate Configure" },
  //         { id: "Rate", label: "Forecast Rate" },
  //       ];

        
  //       const dynamicTabs = res.data
  //         .sort((a, b) => a.sequence - b.sequence)
  //         .map((pool) => ({
  //           id: pool.name,
  //           label: pool.name,
  //         }));

  //       setTabs([
  //         ...baseTabs,
  //         ...dynamicTabs,
  //         { id: "Base Setup", label: "Base Setup" },
  //       ]);

  //       setData(res.data);
  //     } catch (error) {
  //       console.error("Error fetching pools:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   getPoolAccess();
  // }, []);

  useEffect(() => {
    const getPoolAccess = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);

        const baseTabs = [
          { id: "Template", label: "Add Template" },
          { id: "Rate Configure", label: "Rate Configure" },
          { id: "Rate", label: "Forecast Rate" },
        ];


        // const excludedPools = ["Pool Name A", "Secret Pool", "Test Pool"];
        // const dynamicTabs = res.data
        // .filter((pool) => !excludedPools.includes(pool.name)) // <--- ADD THIS FILTER
        // .sort((a, b) => a.sequence - b.sequence)
        // .map((pool) => ({
        //   id: pool.name,
        //   label: pool.name,
        // }));


        const dynamicTabs = res.data
          // 1. Filter out items that do not have a poolNo
          .filter((pool) => pool.poolNo !== undefined && pool.poolNo !== null)
          // 2. Sort by sequence
          .sort((a, b) => a.sequence - b.sequence)
          // 3. Map to tab format and handle "Hr" -> "HR" naming
          .map((pool) => {
            const displayName = pool.name === "Hr" ? "HR" : pool.name;
            return {
              id: pool.name, // Keep original name as ID for the Switch logic
              label: displayName,
            };
          });

        setTabs([
          ...baseTabs,
          ...dynamicTabs,
          { id: "Pool Setup", label: "Pool Setup" },
        ]);

        setData(res.data);
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setLoading(false);
      }
    };

    getPoolAccess();
  }, []);

  const renderTabContent = () => {
    // 1. Check for Static Tabs
    switch (activeTab) {
      case "Rate Configure":
        return <PoolRate />;
      case "Rate":
        return <Rates />;
      case "Template":
        return <TemplateManager />;
      case "Pool Setup":
        return <PoolConfigurationTable />;
      default:
        
        // 2. Check if the active tab is one of the dynamic pools fetched from API
        const isDynamicPool = data.some((pool) => pool.name === activeTab);
        if (isDynamicPool) {
          return <GenericPoolTable poolType={activeTab} />;
        }
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 mt-4 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="ml-2 w-full">
      {/* Header */}
      <div className="p-4 w-full flex items-center rounded-sm bg-white shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MdRateReview size={20} className="text-blue-500" />
          Burden Rate
        </h2>
      </div>

      {/* Scrollable Tab Header */}
      <div className="w-full bg-white rounded mt-2 p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#17414d] text-white"
                    : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Area */}
        <div className="w-full min-h-[400px] mt-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PoolRateTabs;