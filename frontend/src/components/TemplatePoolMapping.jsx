// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { backendUrl } from "./config";
// import { LayoutTemplate } from "lucide-react";

// const TemplatePoolMapping = () => {
//   const [templates, setTemplates] = useState([]);
//   const [pools, setPools] = useState([]);
//   const [groupNames, setGroupNames] = useState({});
//   const [selectedTemplate, setSelectedTemplate] = useState("");
//   const [poolMappings, setPoolMappings] = useState({});
//   const [originalPoolMappings, setOriginalPoolMappings] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);

//   useEffect(() => {
//     const fetchTemplates = async () => {
//       setLoading(true);
//       try {
//         const templateResponse = await axios.get(
//           `${backendUrl}/Orgnization/GetAllTemplates`
//         );
//         setTemplates(templateResponse.data || []);
//       } catch (err) {
//         setError(
//           err.response?.data?.message ||
//             err.message ||
//             "Failed to fetch templates"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTemplates();
//   }, []);

//   const fetchPoolData = async () => {
//     setLoading(true);
//     try {
//       const poolResponse = await axios.get(
//         `${backendUrl}/Orgnization/GetAllPools`
//       );
//       const poolList =
//         poolResponse.data.map((item) => ({
//           poolId: item.code,
//           groupName: item.name || item.code,
//         })) || [];
//       setPools(poolList);
//       const names = poolList.reduce((acc, pool) => {
//         acc[pool.poolId] = pool.name;
//         return acc;
//       }, {});
//       setGroupNames(names);

//       let initialMappings = poolList.reduce((acc, pool) => {
//         acc[pool.poolId] = false;
//         return acc;
//       }, {});

//       if (selectedTemplate) {
//         const mappingResponse = await axios.get(
//           `${backendUrl}/Orgnization/GetPoolsByTemplateId?templateId=${selectedTemplate}`
//         );
//         const mappedPools = mappingResponse.data.reduce((acc, pool) => {
//           acc[pool.poolId] = true;
//           return acc;
//         }, {});

//         initialMappings = poolList.reduce((acc, pool) => {
//           acc[pool.poolId] = mappedPools[pool.poolId] || false;
//           return acc;
//         }, {});
//       }

//       setPoolMappings(initialMappings);
//       setOriginalPoolMappings({ ...initialMappings });
//       setError(null);
//     } catch (err) {
//       setError(
//         err.response?.data?.message || err.message || "Failed to fetch pools"
//       );
//       setPools([]);
//       setGroupNames({});
//       setPoolMappings({});
//       setOriginalPoolMappings({});
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (selectedTemplate) {
//       fetchPoolData();
//     } else {
//       setPools([]);
//       setPoolMappings({});
//       setOriginalPoolMappings({});
//     }
//   }, [selectedTemplate]);

//   const handleCheckboxChange = (poolId) => {
//     setPoolMappings((prev) => ({
//       ...prev,
//       [poolId]: !prev[poolId],
//     }));
//   };

//   const handleSave = async () => {
//     if (isSaving || !selectedTemplate) return;

//     setIsSaving(true);
//     try {
//       const hasChanges = Object.keys(poolMappings).some(
//         (poolId) => poolMappings[poolId] !== originalPoolMappings[poolId]
//       );
//       if (!hasChanges) {
//         toast.info("No changes to save");
//         setIsSaving(false);
//         return;
//       }

//       const payload = [
//         {
//           templateId: parseInt(selectedTemplate),
//           ...Object.keys(poolMappings).reduce((acc, poolId) => {
//             acc[poolId] = poolMappings[poolId];
//             return acc;
//           }, {}),
//         },
//       ];

//       const response = await axios.post(
//         `${backendUrl}/Orgnization/BulkUpSertTemplatePoolMapping`,
//         payload,
//         { headers: { "Content-Type": "application/json" } }
//       );

//       setOriginalPoolMappings({ ...poolMappings });
//       localStorage.setItem(
//         `poolMappings_${selectedTemplate}`,
//         JSON.stringify(poolMappings)
//       );

//       await fetchPoolData();
//       setError(null);
//       toast.success("Data saved successfully");
//     } catch (err) {
//       const errorMessage =
//         err.response?.data?.message ||
//         err.message ||
//         "Failed to save pool mappings";
//       setError(errorMessage);
//       setPoolMappings({ ...originalPoolMappings });
//       toast.error("Failed to save data: " + errorMessage);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//     const displayNames = {
//   HR: "HR",
//   hr: "HR",
//   // add others if needed
// };

//   if (loading && templates.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64 font">
//         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//         <span className="ml-2 text-gray-600 text-sm">Loading...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col gap-2 w-[98%] mt-4">
//       <div className="p-4 rounded-sm ml-5 w-full  flex items-center justify-between bg-white">
//         <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//           <LayoutTemplate sixe={20} className="text-blue-500"/>
//           Template Pool Mapping
//         </h2>
//       </div>
//       <div className="sm:p-5 w-full mx-auto font-roboto bg-white rounded-sm  ml-5">
//         <ToastContainer
//           position="top-right"
//           autoClose={3000}
//           hideProgressBar={false}
//           closeOnClick
//         />
//         {/* <h1 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
//         Template Pool Mapping
//       </h1> */}
//         {loading && <p className="text-gray-600 text-sm">Loading...</p>}
//         {isSaving && <p className="text-gray-600 text-sm">Saving...</p>}
//         {error && <p className="text-red-600 text-sm mb-4">Error: {error}</p>}
//         <div className="space-y-6 sm:space-y-8">
//           <div>
//             <label
//               htmlFor="template"
//               className="block text-sm font-medium text-gray-900 mb-1"
//             >
//               Template
//             </label>
//             <select
//               id="template"
//               className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//               value={selectedTemplate}
//               onChange={(e) => setSelectedTemplate(e.target.value)}
//               disabled={loading || isSaving}
//             >
//               <option value="">Select Template</option>
//               {templates.map((template) => (
//                 <option key={template.id} value={template.id}>
//                   {template.templateCode}
//                 </option>
//               ))}
//             </select>
//           </div>
//           {selectedTemplate && (
//             <>
//               <div>
//                 <h2 className="text-base font-medium text-gray-900 mb-3">
//                   Pools
//                 </h2>
//                 {pools.length === 0 && !loading && (
//                   <p className="text-gray-600 text-sm">
//                     No pools available for this template.
//                   </p>
//                 )}
//                 <div className="flex flex-wrap gap-4">
//                   {pools.map((pool) => (
//                     <div
//                       key={pool.poolId}
//                       className="flex items-center space-x-1"
//                     >
//                       <input
//                         type="checkbox"
//                         id={pool.poolId}
//                         checked={poolMappings[pool.poolId] || false}
//                         onChange={() => handleCheckboxChange(pool.poolId)}
//                         className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-50"
//                         disabled={loading || isSaving}
//                         isSaving
//                       />
//                       <label
//                         htmlFor={pool.poolId}
//                         className="text-xs font-semibold text-gray-900"
//                       >
//                         {displayNames[groupNames[pool.poolId]] ||
//                           displayNames[pool.groupName] ||
//                           displayNames[pool.poolId] ||
//                           groupNames[pool.poolId] ||
//                           pool.groupName ||
//                           pool.poolId}
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="flex justify-end mt-4">
//                 <button
//                   type="button"
//                   className="px-4 py-2 rounded-lg bg-[#17414d] text-white group-hover:text-gray focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 text-sm font-semibold"
//                   onClick={handleSave}
//                   disabled={loading || isSaving}
//                 >
//                   Save
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TemplatePoolMapping;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LayoutTemplate } from "lucide-react";
import { backendUrl } from "./config";

const TemplatePoolMapping = ({ 
  externalSelectedTemplateId = "", 
  disabled = false, 
  templates = [] 
}) => {
  const [localTemplates, setLocalTemplates] = useState([]);
  const [pools, setPools] = useState([]);
  const [groupNames, setGroupNames] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [poolMappings, setPoolMappings] = useState({});
  const [originalPoolMappings, setOriginalPoolMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync external template selection
  useEffect(() => {
    if (externalSelectedTemplateId && !disabled) {
      setSelectedTemplate(externalSelectedTemplateId);
    }
  }, [externalSelectedTemplateId, disabled]);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/Orgnization/GetAllTemplates`);
        setLocalTemplates(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to fetch templates");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch pool data when template changes
  useEffect(() => {
    if (!selectedTemplate) {
      setPools([]);
      setPoolMappings({});
      setOriginalPoolMappings({});
      return;
    }

    const fetchPoolData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all pools
        const poolResponse = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);
        const poolList = poolResponse.data.map(item => ({
          poolId: item.code,
          groupName: item.name || item.code,
        }));
        setPools(poolList);

        // Create group names lookup
        const names = poolList.reduce((acc, pool) => {
          acc[pool.poolId] = pool.groupName;
          return acc;
        }, {});
        setGroupNames(names);

        // Initialize mappings as false
        const initialMappings = poolList.reduce((acc, pool) => {
          acc[pool.poolId] = false;
          return acc;
        }, {});

        // Load existing mappings for this template
        try {
          const mappingResponse = await axios.get(
            `${backendUrl}/Orgnization/GetPoolsByTemplateId?templateId=${selectedTemplate}`
          );
          const mappedPools = mappingResponse.data.reduce((acc, pool) => {
            acc[pool.poolId] = true;
            return acc;
          }, {});
          
          Object.keys(initialMappings).forEach(poolId => {
            initialMappings[poolId] = mappedPools[poolId] || false;
          });
        } catch (mappingErr) {
          // No existing mappings, use defaults
        }

        setPoolMappings(initialMappings);
        setOriginalPoolMappings({ ...initialMappings });
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to fetch pools");
        setPools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPoolData();
  }, [selectedTemplate]);

  const handleCheckboxChange = (poolId) => {
    if (disabled) return;
    setPoolMappings(prev => ({
      ...prev,
      [poolId]: !prev[poolId]
    }));
  };

  const handleSave = async () => {
    if (isSaving || !selectedTemplate || disabled) return;

    setIsSaving(true);
    try {
      const hasChanges = Object.keys(poolMappings).some(
        poolId => poolMappings[poolId] !== originalPoolMappings[poolId]
      );

      if (!hasChanges) {
        toast.info("No changes to save");
        return;
      }

      const payload = {
        templateId: parseInt(selectedTemplate),
        ...Object.keys(poolMappings).reduce((acc, poolId) => {
          acc[poolId] = poolMappings[poolId];
          return acc;
        }, {}),
      };

      await axios.post(
        `${backendUrl}/Orgnization/BulkUpSertTemplatePoolMapping`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      setOriginalPoolMappings({ ...poolMappings });
      localStorage.setItem(`poolMappings-${selectedTemplate}`, JSON.stringify(poolMappings));
      
      toast.success("Pool mappings saved successfully!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to save pool mappings";
      setPoolMappings({ ...originalPoolMappings });
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = (poolId) => {
    const displayNames = { HR: "HR", hr: "HR" };
    return displayNames[poolId] || groupNames[poolId] || poolId;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading pools...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hide dropdown when externalSelectedTemplateId is provided */}
      {!externalSelectedTemplateId && !disabled && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Select Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            disabled={loading || isSaving}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white shadow-sm"
          >
            <option value="">Select a template...</option>
            {localTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.templateCode} - {template.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Show current template info when editing */}
      {externalSelectedTemplateId && (
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <div>
              <span className="font-bold text-lg text-blue-900">
                Current Template
              </span>
              <div className="text-sm font-medium text-blue-800 mt-1">
                ID: {externalSelectedTemplateId}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTemplate || externalSelectedTemplateId ? (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-blue-600" />
            Pool Mappings
          </h3>

          {pools.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No pools available for this template
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pools.map((pool) => (
                <div key={pool.poolId} className="flex items-center space-x-3 p-4 border rounded-xl hover:shadow-md transition-all duration-200 bg-white">
                  <input
                    type="checkbox"
                    id={pool.poolId}
                    checked={poolMappings[pool.poolId] || false}
                    onChange={() => handleCheckboxChange(pool.poolId)}
                    disabled={loading || isSaving || disabled}
                    className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label htmlFor={pool.poolId} className="text-sm font-semibold text-gray-900 cursor-pointer select-none flex-1">
                    {displayName(pool.poolId)}
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || isSaving || disabled}
              className="px-8 py-3 bg-[#17414d] text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:bg-[#123440] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Pool Mappings"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
          Select a template to configure pool mappings
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        theme="colored"
      />
    </div>
  );
};

export default TemplatePoolMapping;
