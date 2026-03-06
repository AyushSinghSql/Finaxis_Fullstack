import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendUrl } from "./config";
import NewBusiness from "./NewBusiness";
import { toast } from "react-toastify";
import { BriefcaseBusiness, FolderKanban } from "lucide-react";

const NewBusinessComponent = ({canEdit}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewBusinessPopup, setShowNewBusinessPopup] = useState(false);
  const [editNewBusinessPopup, setEditNewBusinessPopup] = useState(false);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataItem, setDataItem] = useState([])

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  const [columns] = useState([
    "businessBudgetId",
    "description",
     "stage", 
     "contractValue",
    "pwinValue" ,
    "orgId",
    "accountGroup",
    // "level",
    "isActive",
    "version",
    "versionCode",
    "startDate",
    "endDate",
    
    // "escalationRate",
    // "burdenTemplateId",
    "status",
    // "trf_ProjId",
  ]);

  const isAllSelected = data.length > 0 && selectedRows.size === data.length;

  // ⭐ ADDED
  const selectedCount = selectedRows.size;
  const showEdit = selectedCount === 1;
  const showDelete = selectedCount >= 1;

  useEffect(() => {
    if (searchTerm) handleSearch();
  }, [searchTerm]);

  const COLUMN_LABELS = {
    businessBudgetId: "ID",
    description: "Description",
    // level: "Level",
   
    
    stage:"Stage",
    contractValue :"Contract Value",
     pwinValue:"Pwin Value(%)",
    isActive: "Active",
    version: "Version",
    versionCode: "Version Code",
    startDate: "Start Date",
    endDate: "End Date",
    // escalationRate: "Escalation Rate",
    orgId: "Org ID",
    accountGroup: "Account Group",
    // burdenTemplateId: "Template",
    status: "Status",
    // trf_ProjId: "Transferred Project",
  };

  const formatWithCommas = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSearch = async () => {
    const term = searchTerm.trim();

    try {
      setShowNewBusinessPopup(false);
      setEditNewBusinessPopup(false);
      setIsLoading(true);

      const res = term
        ? await axios.get(`${backendUrl}/GetAllNewBusinessById/${term}`)
        : await axios.get(`${backendUrl}/GetAllNewBusiness`);

      setData(res.data || []);
      setSelectedRows(new Set());
      setSelectedBusiness(null);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (item) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(item.businessBudgetId)) {
        newSet.delete(item.businessBudgetId);
      } else {
        newSet.add(item.businessBudgetId);
      }

      if (newSet.size === 1) {
        const id = [...newSet][0];
        setSelectedBusiness(
          data.find((d) => d.businessBudgetId === id) || null,
        );
      } else {
        setSelectedBusiness(null);
      }

      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows(new Set());
      setSelectedBusiness(null);
    } else {
      const allIds = new Set(data.map((d) => d.businessBudgetId));
      setSelectedRows(allIds);
      setSelectedBusiness(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const selectedRowsToDelete = [...selectedRows];
      console.log(selectedRowsToDelete);
      await axios.post(
        `${backendUrl}/BulkDeleteNewBusiness`,
        selectedRowsToDelete,
      );
      toast.success("Business Deleted Successfully!");
      handleSearch();
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false)
    }
  };

  const handleEdit = (item) => {
        if(!canEdit("manageNewBusiness")){
      return
    }
    setSelectedBusiness(item);
    setEditNewBusinessPopup(true);
  };

  const handleNewBusinessSave = async (savedData) => {

    handleSearch();
    setShowNewBusinessPopup(false);
    setEditNewBusinessPopup(false);
  };

  return (
    <div className="p-1 sm:p-2 space-y-2 text-sm sm:text-base text-gray-800 font-inter">
      {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"> */}
      <div className="flex flex-col gap-2 ">
        <div className="flex items-center gap-2 bg-white rounded-sm  p-4">
          <BriefcaseBusiness size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">
            Manage New Business
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative w-full sm:w-auto">
          <label className="input-label">Busniess ID:</label>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="border outline-none border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm bg-white shadow-inner w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn1 btn-blue cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      <div className="space-y-4 sm:p-4 rounded p-2 bg-white mb-1">
        <div className="flex items-center mb-2 gap-1 w-full flex-nowrap">
          {!editNewBusinessPopup && canEdit("manageNewBusiness") && (
            <button
              onClick={() => setShowNewBusinessPopup(true)}
              className="btn1 btn-blue shrink-0"
              // disabled={editNewBusinessPopup}
            >
              New Business
            </button>
          )}
          {}
          <div
            className={`flex gap-1 w-full items-center ${
              showDelete ? "inline" : "hidden"
            }`}
          >
            {dataItem.length < 2 && canEdit("manageNewBusiness") && (
              <button
                className="btn1 btn-blue mr-2"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(dataItem[0]);
                }}
                disabled={!showEdit || showNewBusinessPopup}
              >
                Edit
              </button>
            )}
            {canEdit("manageNewBusiness") && <button
              onClick={handleDelete}
              className="btn1 px-4 py-1.5 btn-red"
              title="Delete"
              disabled={
                editNewBusinessPopup || showNewBusinessPopup || isDeleting
              }
            >
              {isDeleting ? "Deleting..." : `Delete (${selectedRows.size})`}
            </button>}
          </div>
        </div>

        <div className="rounded border border-gray-200 overflow-hidden relative">
          {/* {showNewBusinessPopup && (
            <div className="absolute inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>

              <div
                className="relative bg-white w-full overflow-hidden flex flex-col
                 animate-premium-popup shadow-xl"
              >
                <div className="flex-1 overflow-y-auto p-4">
                  <NewBusiness
                    mode={"business"}
                    onClose={() => setShowNewBusinessPopup(false)}
                    selectedBusiness={null}
                    onSaveSuccess={handleNewBusinessSave}
                  />
                </div>
              </div>
            </div>
          )} */}

          {showNewBusinessPopup && (
            <div className="fixed inset-0 z-50  flex items-center justify-center p-4">
              {" "}
              <div className="absolute inset-0 bg-black/40"></div>
              <div
                className="relative top-8 bg-white w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col
                 animate-premium-popup shadow-2xl rounded"
              >
                <div className="overflow-y-auto p-4 custom-scrollbar">
                  {" "}
                  <NewBusiness
                    mode={"business"}
                    onClose={() => setShowNewBusinessPopup(false)}
                    selectedBusiness={null}
                    onSaveSuccess={handleNewBusinessSave}
                  />
                </div>
              </div>
            </div>
          )}

          {/* {editNewBusinessPopup && (
            <div className="absolute inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>

              <div
                className="relative bg-white w-full overflow-hidden flex flex-col
                 animate-premium-popup shadow-xl"
              >
                <div className="flex-1 overflow-y-auto">
                  <NewBusiness
                    mode={"business"}
                    onClose={() => setEditNewBusinessPopup(false)}
                    selectedBusiness={selectedBusiness}
                    onSaveSuccess={handleNewBusinessSave}
                  />
                </div>
              </div>
            </div>
          )} */}
          {editNewBusinessPopup && (
            <div className="fixed inset-0  z-50 flex items-center justify-center p-4">
              {/* The Background Overlay */}
              <div className="absolute inset-0 bg-black/40"></div>

              {/* The Actual Form Box */}
              <div
                className="relative top-8 bg-white w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col
                 animate-premium-popup shadow-2xl rounded"
              >
                <div className="overflow-y-auto p-4 custom-scrollbar">
                  <NewBusiness
                    mode={"business"}
                    onClose={() => setEditNewBusinessPopup(false)}
                    selectedBusiness={selectedBusiness}
                    onSaveSuccess={handleNewBusinessSave}
                  />
                </div>
              </div>
            </div>
          )}

          <div
            className={`overflow-x-auto max-h-[70vh] min-h-[70vh] ${
              showNewBusinessPopup ? "pointer-events-none" : ""
            }`}
          >
            <table className="min-w-full table-auto divide-gray-200">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                 {canEdit("manageNewBusiness") && <th className="th-thead w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>}
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="th-thead text-xs font-bold text-gray-600 text-center"
                    >
                      {COLUMN_LABELS[col] || col}
                    </th>
                  ))}
                  {/* <th className="th-thead pr-2 font-bold text-center">Edit</th> */}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">
                          Loading project plans...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : isDeleting ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 mt-4">Deleting.....</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 && searchTerm.trim() === "" ? (
                  <tr>
                    <td colSpan={columns.length + 1}>
                      <div className="p-8 text-center text-gray-500 text-lg">
                        Search and select a valid Project to view details
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item.businessBudgetId}
                      onDoubleClick={() => handleEdit(item)}
                      className={`cursor-pointer hover:bg-blue-50 ${
                        selectedRows.has(item.businessBudgetId)
                          ? "bg-blue-200"
                          : "bg-white"
                      }`}
                    >
                      {canEdit("manageNewBusiness") && <td className="tbody-td-fun">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.businessBudgetId)}
                          onChange={(e) => {
                            e.stopPropagation();

                            const isChecked = e.target.checked;

                            toggleRow(item);

                            setDataItem(
                              (prev) =>
                                isChecked
                                  ? [...prev, item] // add
                                  : prev.filter(
                                      (i) =>
                                        i.businessBudgetId !==
                                        item.businessBudgetId,
                                    ), // remove
                            );
                          }}
                        />
                      </td>}

                      {columns.map((col, idx) => (
                        <td
                          key={idx}
                          className={`px-2 py-1 text-xs border-r border-b font-normal border-gray-300 text-gray-900  ${
                            col === "description"
                              ? "text-left min-w-[300px] break-words"
                              : "text-center"
                          } ${
                            col === "startDate" ||
                            col === "endDate" ||
                            col === "trf_ProjId" ||
                            col === "businessBudgetId" 
                              ? "whitespace-nowrap"
                              : ""
                          } ${col === "trf_ProjId" ? "w-[100%]" : ""}
                          ${col === "stage" ? "whitespace-nowrap text-left" : ""} 
                          ${col === "contractValue" ? "  text-right" : ""}`}
                        >
                          {col === "startDate" || col === "endDate"
                            ? item[col]?.split("T")[0]
                            : 
                              col === "contractValue" ? (
      formatWithCommas(item[col])
    ) :
    col === "pwinValue" ? (
       ((item[col] ?? 0) * 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    ) :
    col === "isActive" ?
                                <input
      type="checkbox"
      checked={!!item[col]}
      readOnly
      className="h-3 w-3 accent-blue-600 cursor-default"
    />
                              : item[col]}
                        </td>
                      ))}
                      {/* <td className="tbody-td-fun">
                        <button
                          className="btn1 px-2 py-1.5 btn-blue"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          disabled={showNewBusinessPopup}
                        >
                          Edit
                        </button>
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBusinessComponent;
