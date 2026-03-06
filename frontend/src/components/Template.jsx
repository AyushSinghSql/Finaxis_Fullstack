// import React, { useState, useEffect } from "react";
// import { Plus, Trash2 } from "lucide-react";
// import { backendUrl } from "./config";

// const Template = ({ updatedBy = "User" }) => {
//   const [templates, setTemplates] = useState([]);
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [newTemplate, setNewTemplate] = useState({
//     templateCode: "",
//     description: "",
//   });
//   const [loading, setLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   // Function to fetch templates
//   const fetchTemplates = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch(`${backendUrl}/Orgnization/GetAllTemplates`);
//       if (!response.ok) {
//         throw new Error("Failed to fetch templates");
//       }
//       const data = await response.json();
//       setTemplates(data);
//       setLoading(false);
//     } catch (err) {
//       setError(err.message);
//       setLoading(false);
//     }
//   };

//   // Fetch templates on component mount
//   useEffect(() => {
//     fetchTemplates();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewTemplate((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleAddTemplate = async (e) => {
//     e.preventDefault();
//     if (!newTemplate.templateCode || !newTemplate.description) {
//       setError("Please fill in all fields");
//       return;
//     }

//     setIsSubmitting(true);
//     setError(null);

//     const tempId = Date.now();
//     const optimisticTemplate = {
//       id: tempId,
//       templateCode: newTemplate.templateCode,
//       description: newTemplate.description,
//       plPoolRates: [],
//       templatePoolRate: [],
//       rates: [],
//     };
//     setTemplates((prev) => [...prev, optimisticTemplate]);

//     try {
//       const response = await fetch(
//         `${backendUrl}/Orgnization/AddTemplate?updatedBy=${encodeURIComponent(
//           updatedBy
//         )}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             templateCode: newTemplate.templateCode,
//             description: newTemplate.description,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to add template");
//       }

//       await fetchTemplates();
//       setNewTemplate({ templateCode: "", description: "" });
//       setIsFormOpen(false);
//       setIsSubmitting(false);
//     } catch (err) {
//       setTemplates((prev) => prev.filter((template) => template.id !== tempId));
//       setError(err.message);
//       setIsSubmitting(false);
//     }
//   };

//   const handleDeleteTemplate = async (template) => {
//     const templateId = template.id;
//     setTemplates((prev) => prev.filter((t) => t.id !== templateId));

//     try {
//       const response = await fetch(
//         `${backendUrl}/Orgnization/DeleteTemplate?updatedBy=${encodeURIComponent(
//           updatedBy
//         )}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             id: template.id,
//             templateCode: template.templateCode,
//             description: template.description,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to delete template");
//       }

//       await fetchTemplates();
//     } catch (err) {
//       setTemplates((prev) => [...prev, template].sort((a, b) => a.id - b.id));
//       setError(err.message);
//     }
//   };

//   if (loading && templates.length === 0) {
//     return <div className="p-6 text-gray-600">Loading...</div>;
//   }

//   if (error && templates.length === 0) {
//     return <div className="p-6 text-red-600">Error: {error}</div>;
//   }

//   return (
//     <div >
//       {/* className="bg-white rounded-lg shadow-lg p-4" */}
//       {/* <div className="flex justify-between items-center gap-2 mb-4">
//         <h2 className="w-full  bg-blue-50 border-l-4 border-blue-400 p-3 rounded-lg shadow-sm mb-4 blue-text">
//           Burden Setup
//         </h2>
//       </div> */}

//       {/* Form to Add New Template */}
//       {isFormOpen && (
//         <div className="mb-6 p-4 border border-gray-300 rounded-lg">
//           <h3 className="text-lg font-medium text-gray-800 mb-4">
//             Add New Template
//           </h3>
//           <form onSubmit={handleAddTemplate}>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Burden Code
//                 </label>
//                 <input
//                   type="text"
//                   name="templateCode"
//                   value={newTemplate.templateCode}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter burden code"
//                   disabled={isSubmitting}
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Description
//                 </label>
//                 <input
//                   type="text"
//                   name="description"
//                   value={newTemplate.description}
//                   onChange={handleInputChange}
//                   className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter description"
//                   disabled={isSubmitting}
//                 />
//               </div>
//             </div>
//             {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
//             <div className="flex space-x-3">
//               <button
//                 type="submit"
//                 className="bg-[#17414d] text-white px-4 py-2 rounded-sm transition ease-in-out duration-200 flex items-center"
//                 disabled={isSubmitting}
//               >
//                 {isSubmitting ? (
//                   <>
//                     <svg
//                       className="animate-spin h-5 w-5 mr-2 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                       ></path>
//                     </svg>
//                     Saving...
//                   </>
//                 ) : (
//                   "Save"
//                 )}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setIsFormOpen(false)}
//                 className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition ease-in-out duration-200"
//                 disabled={isSubmitting}
//               >
//                 Cancel
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Table */}
//       <div className="flex justify-end">
//         <button
//           onClick={() => setIsFormOpen(!isFormOpen)}
//           className="flex items-center space-x-2 bg-[#17414d] text-white px-3 py-1 -mt-3 mb-3 rounded-sm transition ease-in-out duration-200 "
//           disabled={isSubmitting}
//         >
//           <Plus className="w-5 h-5" />
//           <span>Burden</span>
//         </button>
//       </div>
//       <div className="overflow-x-auto border-line">
//         <table className="min-w-full table">
//           <thead className="thead">
//             <tr>
//               <th className="th-thead">Burden_Code</th>
//               <th className="th-thead">Description</th>
//               <th className="th-thead">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="tbody">
//             {templates.map((template) => (
//               <tr key={template.id} className="hover:bg-gray-50">
//                 <td className="tbody-td">{template.templateCode}</td>
//                 <td className="tbody-td">{template.description}</td>
//                 <td className="tbody-td">
//                   <button
//                     onClick={() => handleDeleteTemplate(template)}
//                     className="text-red-600 hover:text-red-800 transition ease-in-out duration-200"
//                   >
//                     <Trash2 className="w-5 h-5" />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Template;

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X } from "lucide-react";
import axios from "axios";
import { backendUrl } from "./config";
import { toast } from "react-toastify";


const updatedBy = "User";

const TemplateManager = ({canEdit}) => {
  const [templates, setTemplates] = useState([]);
  const [pools, setPools] = useState([]);
  const [poolMappings, setPoolMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [groupNames, setGroupNames] = useState({});
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    templateCode: "",
    description: ""
  });

  // Fetch templates and pools on mount
  useEffect(() => {
    fetchTemplates();
    fetchPools();
  }, []);

      const displayNames = {
  HR: "HR",
  hr: "HR",
  // add others if needed
};

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/Orgnization/GetAllTemplates`);
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    try {
      const response = await axios.get(`${backendUrl}/Orgnization/GetAllPools`);
      const poolList = response.data.map(item => ({
        poolId: item.code,
        groupName: item.name || item.code
      }));
      setPools(poolList);
      const names = poolList.reduce((acc, pool) => {
      acc[pool.poolId] = pool.groupName;
      return acc;
    }, {});
    setGroupNames(names);
    } catch (err) {
      console.error("Failed to fetch pools:", err);
    }
  };

  // Load pool mappings for template
  const loadPoolMappings = async (templateId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/Orgnization/GetPoolsByTemplateId?templateId=${templateId}`
      );
      const mappings = pools.reduce((acc, pool) => {
        acc[pool.poolId] = response.data.some(p => p.poolId === pool.poolId);
        return acc;
      }, {});
      setPoolMappings(mappings);
    } catch (err) {
      setPoolMappings(pools.reduce((acc, pool) => {
        acc[pool.poolId] = false;
        return acc;
      }, {}));
    }
  };



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({ ...prev, [name]: value }));
  };

  const openForm = (template = null) => {
    setEditingTemplate(template);
    setNewTemplate({
      templateCode: template?.templateCode || "",
      description: template?.description || ""
    });
    setIsFormOpen(true);
    if (template) {
      loadPoolMappings(template.id);
    } else {
      setPoolMappings({});
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setNewTemplate({ templateCode: "", description: "" });
    setPoolMappings({});
    setError(null);
  };

//   const handleSave = async (e) => {
//   e.preventDefault();
  
//   if (!newTemplate.templateCode || !newTemplate.description) {
//     setError("Please fill all fields");
//     return;
//   }

//   setIsSubmitting(true);
//   setError(null);

//   try {
//     // Save template first
//     let templateId;
//     if (editingTemplate) {
//       // Update existing template
//       const response = await fetch(
//         `${backendUrl}/Orgnization/UpdateTemplate?updatedBy=${encodeURIComponent(updatedBy)}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             id: editingTemplate.id,
//             ...newTemplate
//           })
//         }
//       );
//       if (!response.ok) throw new Error("Failed to update template");
//       templateId = editingTemplate.id;
//     } else {
//       // Add new template
//       const response = await fetch(
//         `${backendUrl}/Orgnization/AddTemplate?updatedBy=${encodeURIComponent(updatedBy)}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(newTemplate)
//         }
//       );
      
//       if (!response.ok) throw new Error("Failed to create template");
      
//       // Parse response to get actual template ID
//       const responseData = await response.json();
//       if (!responseData.success || !responseData.data?.id) {
//         throw new Error("Invalid response from server");
//       }
//       templateId = responseData.data.id;
//     }

//     // Save pool mappings with correct template ID
//     const payload = [
//       {
//         templateId: parseInt(templateId),
//         ...poolMappings
//       }
//     ];
    
//     const mappingResponse = await fetch(
//       `${backendUrl}/Orgnization/BulkUpSertTemplatePoolMapping`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//       }
//     );

//     if (!mappingResponse.ok) {
//       throw new Error("Failed to save pool mappings");
//     }

//     // Refresh data
//     await fetchTemplates();
//     closeForm();
//     toast.success("Template and pool mappings saved successfully!");
    
//   } catch (err) {
//     console.error("Save error:", err);
//     setError(err.message || "Failed to save template");
//     toast.error(err.message || "Failed to save template");
//   } finally {
//     setIsSubmitting(false);
//   }
// };

const handleSave = async (e) => {
  e.preventDefault();
  
  if (!newTemplate.templateCode || !newTemplate.description) {
    setError("Please fill all fields");
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    let templateId;

    if (editingTemplate) {
      // **EDIT MODE: Only update pool mappings, NO template update**
      templateId = editingTemplate.id;
      
      // Validate and prepare pool mappings
      const validPoolMappings = Object.entries(poolMappings)
        .filter(([poolId, isSelected]) => {
          const poolExists = pools.some(pool => pool.poolId === poolId);
          return poolExists && isSelected;
        })
        .reduce((acc, [poolId]) => {
          acc[poolId] = true; // All selected pools get true
          return acc;
        }, {});

      if (Object.keys(validPoolMappings).length === 0) {
        throw new Error("Please select at least one pool");
      }

      console.log("Updating pool mappings for template:", templateId, validPoolMappings);
      
    } else {
      // **CREATE MODE: Create template first, then pool mappings**
      const response = await fetch(
        `${backendUrl}/Orgnization/AddTemplate?updatedBy=${encodeURIComponent(updatedBy)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTemplate)
        }
      );
      
      if (!response.ok) throw new Error("Failed to create template");
      
      const responseData = await response.json();
      if (!responseData.success || !responseData.data?.id) {
        throw new Error("Invalid response from server");
      }
      templateId = responseData.data.id;

      // Prepare pool mappings for new template
      const validPoolMappings = Object.entries(poolMappings)
        .filter(([poolId, isSelected]) => {
          const poolExists = pools.some(pool => pool.poolId === poolId);
          return poolExists && isSelected;
        })
        .reduce((acc, [poolId]) => {
          acc[poolId] = true;
          return acc;
        }, {});
    }

    // **Save pool mappings (both create & edit)**
    const payload = [
      {
        templateId: parseInt(templateId),
        ...poolMappings // Use validated mappings from above
      }
    ];
    
    const mappingResponse = await fetch(
      `${backendUrl}/Orgnization/BulkUpSertTemplatePoolMapping`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!mappingResponse.ok) {
      const errorText = await mappingResponse.text();
      throw new Error(`Failed to save pool mappings: ${mappingResponse.status}`);
    }

    // Refresh data
    await fetchTemplates();
    closeForm();
    toast.success(
      editingTemplate 
        ? "Pool mappings updated successfully!" 
        : "Template and pool mappings created successfully!"
    );
    
  } catch (err) {
    console.error("Save error:", err);
    setError(err.message || "Failed to save");
    toast.error(err.message || "Failed to save");
  } finally {
    setIsSubmitting(false);
  }
};


  const handleDelete = async (template) => {
    if (!confirm(`Delete "${template.templateCode}"?`)) return;
    
    try {
      await fetch(
        `${backendUrl}/Orgnization/DeleteTemplate?updatedBy=${encodeURIComponent(updatedBy)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template)
        }
      );
      toast.success("Deleted Successfully!!")
      await fetchTemplates();
    } catch (err) {
      setError("Failed to delete template");
    }
  };

  const displayName = (poolId) => {
  const displayNames = {
    HR: "HR",
    hr: "HR",
    // Add more if needed
  };
  // Use groupNames lookup from state OR poolId as fallback
  return displayNames[poolId] || groupNames[poolId] || poolId;
};

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="input-label">Burden Templates</h2>
        <div>
        {canEdit("poolRateTabs") && <button
          onClick={() => openForm()}
          className="btn1 btn-blue flex items-center gap-1"
          disabled={isSubmitting}
        >
          <Plus className="w-4 h-4" />
          <span>Add Burden</span>
        </button>}
        </div>
      </div>

      {/* Form + Pool Mapping */}
      {isFormOpen && (
        <div className="mb-2 p-4 border border-gray-300 rounded bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="input-label">
              {editingTemplate
                ? `Edit ${editingTemplate.templateCode}`
                : "New Burden Template"}
            </h3>
            <button
              onClick={closeForm}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Template Form */}
          <form onSubmit={handleSave} className="space-y-2 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <label className="input-label">Burden Code</label>
                <input
                  type="text"
                  name="templateCode"
                  value={newTemplate.templateCode}
                  onChange={handleInputChange}
                  className={`input-style ${
                    editingTemplate ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitting}
                  readOnly={!!editingTemplate}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="input-label">Description</label>
                <input
                  type="text"
                  name="description"
                  value={newTemplate.description}
                  onChange={handleInputChange}
                  className={`input-style ${
                    editingTemplate ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  disabled={isSubmitting}
                  readOnly={!!editingTemplate}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            {/* Pool Mapping */}
            <div className="py-4">
              <h4 className="input-label mb-1 ">Pool Mappings</h4>
              <div className="flex items-center gap-y-2 gap-x-10 flex-wrap mb-2">
                {pools.map((pool) => (
                  <label key={pool.poolId} className="flex items-center gap-2 ">
                    <input
                      type="checkbox"
                      checked={poolMappings[pool.poolId] || false}
                      onChange={(e) =>
                        setPoolMappings((prev) => ({
                          ...prev,
                          [pool.poolId]: e.target.checked,
                        }))
                      }
                      className="w-3 h-3 text-blue-600 rounded"
                      disabled={isSubmitting}
                    />
                    {/* <span className="text-sm">{pool.groupName}</span>
                     */}
                    <span className="text-sm font-medium">
                      {displayName(pool.poolId)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Single Save Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="btn1 btn-blue px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Template & Mappings"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="btn1 btn-blue px-6 cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Table */}
      <div className="overflow-x-auto border border-gray-300 rounded ">
        <table className="min-w-full table">
          <thead className="thead">
            <tr>
              <th className="th-thead">Burden Code</th>
              <th className="th-thead">Description</th>
              {canEdit("poolRateTabs") && <th className="th-thead">Actions</th>}
            </tr>
          </thead>
          <tbody className="tbody">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="tbody-td">{template.templateCode}</td>
                <td className="tbody-td">{template.description}</td>
                {canEdit("poolRateTabs") && <td className="tbody-td">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openForm(template)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>}
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td
                  colSpan="3"
                  className="tbody-td text-center py-8 text-gray-500"
                >
                  No templates found. Click "Add Burden" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TemplateManager;


