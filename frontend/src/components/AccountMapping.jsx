import React, { useState, useEffect, useRef} from "react";
import { useParams } from "react-router-dom";
import { Save, Plus, X, Edit2, Trash2, CheckCircle } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { backendUrl } from "./config";
import { MdManageAccounts } from "react-icons/md";

const AccountMapping = () => {
  const { projectId, projectType } = useParams();

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    accountId: "",
    accountName: "",
    costType: "",
    accountType: "",
    budgetSheet: "",
  });

  const [editingIds, setEditingIds] = useState([]);
  const [multiEditData, setMultiEditData] = useState({});
  const [lastUpdatedIds, setLastUpdatedIds] = useState([]);

  const [filters, setFilters] = useState({
    accountId: "",
    accountName: "",
    accountType: "",
    budgetSheet: "",
    costType: "",
  });


   const didFetchRef = useRef(false);

  // useEffect(() => {
  //   fetchData();
  // }, [projectId, projectType]);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = `${backendUrl}/api/ChartOfAccounts`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("API not responding");

      const result = await response.json();
      const rawList = Array.isArray(result) ? result : result.data || [];
      processData(rawList);
    } catch (error) {
      console.error("Error fetching account mapping:", error);
      processData([]);
    } finally {
      setLoading(false);
    }
  };

  const processData = (list) => {
    const mappedData = list.map((item) => ({
      accountId: item.accountId || "",
      accountName: item.accountName || "",
      costType: item.costType || "",
      accountType: item.accountType || "",
      budgetSheet: item.budgetSheet || "",
    }));
    setData(mappedData);
    setFilteredData(mappedData);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

    const filtered = data.filter(
      (item) =>
        (item.accountId || "").toLowerCase().startsWith(newFilters.accountId.toLowerCase()) &&
        (item.accountName || "").toLowerCase().startsWith(newFilters.accountName.toLowerCase()) &&
        (item.accountType || "").toLowerCase().startsWith(newFilters.accountType.toLowerCase()) &&
        (item.budgetSheet || "").toLowerCase().startsWith(newFilters.budgetSheet.toLowerCase()) &&
        (item.costType || "").toLowerCase().startsWith(newFilters.costType.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleApiResponse = async (response, successMsg) => {
    const contentType = response.headers.get("content-type");
    let message = "";
    try {
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        message = result.message || result.error || (response.ok ? successMsg : "Action failed");
      } else {
        message = await response.text();
      }
    } catch (e) {
      message = response.ok ? successMsg : "Failed to parse server response";
    }

    if (response.ok) {
      return { success: true, message: message || successMsg };
    } else {
      toast.error(message || "Backend error occurred");
      return { success: false };
    }
  };

  const handleSaveNewRow = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/ChartOfAccounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newRow, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      });

      const res = await handleApiResponse(response, "Account created successfully");
      if (res.success) {
        toast.success(res.message);
        setIsAdding(false);
        setNewRow({ accountId: "", accountName: "", costType: "", accountType: "", budgetSheet: "" });
        fetchData();
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    }
  };

  const startEditing = (item) => {
    if (!editingIds.includes(item.accountId)) {
      setEditingIds([...editingIds, item.accountId]);
      setMultiEditData({ ...multiEditData, [item.accountId]: { ...item } });
    }
  };

  const cancelEditing = (accountId) => {
    setEditingIds(editingIds.filter((id) => id !== accountId));
    const updatedMultiData = { ...multiEditData };
    delete updatedMultiData[accountId];
    setMultiEditData(updatedMultiData);
  };

  const handleMultiInputChange = (accountId, field, value) => {
    setMultiEditData({
      ...multiEditData,
      [accountId]: { ...multiEditData[accountId], [field]: value },
    });
  };

  const handleUpdateRows = async (specificId = null) => {
    const idsToUpdate = specificId ? [specificId] : editingIds;
    if (idsToUpdate.length === 0) return;

    const loadingToast = toast.info(idsToUpdate.length > 1 ? "Updating records..." : "Updating record...", { autoClose: false });
    try {
      const promises = idsToUpdate.map((id) =>
        fetch(`${backendUrl}/api/ChartOfAccounts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...multiEditData[id], updatedAt: new Date().toISOString() }),
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every((r) => r.ok);

      if (allOk) {
        toast.dismiss(loadingToast);
        toast.success(idsToUpdate.length > 1 ? "All accounts updated successfully" : "Account updated successfully");
        setLastUpdatedIds([...idsToUpdate]);
        setEditingIds(editingIds.filter(id => !idsToUpdate.includes(id)));
        const newData = { ...multiEditData };
        idsToUpdate.forEach(id => delete newData[id]);
        setMultiEditData(newData);
        fetchData();
        setTimeout(() => setLastUpdatedIds([]), 3000);
      } else {
        toast.error("Some updates failed. Please try again.");
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    }
  };

  const handleDeleteRow = async (accountId) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      const response = await fetch(`${backendUrl}/api/ChartOfAccounts/${accountId}`, {
        method: "DELETE",
      });

      const res = await handleApiResponse(response, "Account deleted successfully");
      if (res.success) {
        toast.success(res.message);
        fetchData();
      }
    } catch (error) {
      toast.error(`Network Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen  text-gray-900 flex flex-col gap-y-2 items-center ml-2">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* <div className="w-full flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"> */}
      <div>
        <div className="p-4 w-full  flex items-center rounded-sm bg-white">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MdManageAccounts size={20} className="text-blue-500" />
            Account Mapping
          </h2>
        </div>

        <div className="bg-white py-2 rounded mt-2">
          <div className=" shrink-0">
            <div className=" border-gray-200 rounded bg-white overflow-hidden mb-2">
              {/* <div className="px-3 py-1.5 border-b border-gray-200 font-semibold text-[#003366]">
              Maintain Account Mapping
            </div> */}
              <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
                <div className="flex items-center gap-2">
                  <label className="input-label w-24">Account ID</label>
                  <input
                    name="accountId"
                    value={filters.accountId}
                    onChange={handleFilterChange}
                    className="input-style"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="input-label w-24">Cost Type</label>
                  <input
                    name="costType"
                    value={filters.costType}
                    onChange={handleFilterChange}
                    className="input-style"
                  />
                </div>
                 <div className="flex items-center gap-2">
                  <label className="input-label w-24">Expenses Type</label>
                  <input
                    name="budgetSheet"
                    value={filters.budgetSheet}
                    onChange={handleFilterChange}
                    className="input-style"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="input-label w-24">Account Name</label>
                  <input
                    name="accountName"
                    value={filters.accountName}
                    onChange={handleFilterChange}
                    className="input-style"
                  />
                </div>
                 <div className="flex items-center gap-2">
                  <label className="input-label w-24">Account Type</label>
                  <input
                    name="accountType"
                    value={filters.accountType}
                    onChange={handleFilterChange}
                    className="input-style"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-2 pt-2 bg-white ">

            <button
              onClick={() => setIsAdding(true)}
              className="btn1 btn-blue flex items-center gap-1"
            >
              <Plus size={14} /> Add Row
            </button>
            {editingIds.length > 1 && (
              <>
              <div className="flex flex-1 justify-end">
              <button
                onClick={() => handleUpdateRows()}
                className="btn1 btn-blue flex items-center gap-1"
              >
                {/* <CheckCircle size={14} /> */}
                 Save ({editingIds.length})
              </button>
              </div>
              </>
            )}
          </div>

          {/* Unified Scrollable Table Section */}
          <div className="flex-1 overflow-hidden px-4 pb-4">
            <div className="border border-gray-200 rounded h-full bg-white shadow-sm overflow-y-auto max-h-[500px]">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="thead">
                  <tr className="text-[10px] captialize text-gray-500 border-b">
                    <th className="th-thead">Account ID</th>
                    <th className="th-thead">Account Name</th>
                    <th className="th-thead">Cost Type</th>
                    <th className="th-thead">Account Type</th>
                    <th className="th-thead">Expenses Type Mapping</th>
                    <th className="th-thead">Action</th>
                  </tr>
                </thead>
                <tbody className="tbody">
                  {isAdding && (
                    <tr className="bg-gray-50 ">
                      <td className="tbody-td w-[15%]">
                        <input
                          className="table-input"
                          value={newRow.accountId}
                          onChange={(e) =>
                            setNewRow({ ...newRow, accountId: e.target.value })
                          }
                        />
                      </td>
                      <td className="tbody-td w-[25%]">
                        <input
                          className="table-input"
                          value={newRow.accountName}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              accountName: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="tbody-td w-[18%]">
                        <input
                          className="table-input"
                          value={newRow.costType}
                          onChange={(e) =>
                            setNewRow({ ...newRow, costType: e.target.value })
                          }
                        />
                      </td>
                      <td className="tbody-td w-[18%]">
                        <input
                          className="table-input"
                          value={newRow.accountType}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              accountType: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="tbody-td w-[18%]">
                        <input
                          className="table-input"
                          value={newRow.budgetSheet}
                          onChange={(e) =>
                            setNewRow({
                              ...newRow,
                              budgetSheet: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="tbody-td">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={handleSaveNewRow}
                            className="text-green-600 cursor-pointer"
                          >
                            <Save size={15} />
                          </button>
                          <button
                            onClick={() => setIsAdding(false)}
                            className="text-red-600 cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredData.map((item, idx) => {
                      const isEditing = editingIds.includes(item.accountId);
                      const rowData = isEditing
                        ? multiEditData[item.accountId]
                        : item;
                      const isJustUpdated = lastUpdatedIds.includes(
                        item.accountId,
                      );

                      return (
                        <tr
                          key={idx}
                          className={`border-b border-gray-200 transition-colors duration-500 text-xs text-gray-800 ${ isJustUpdated ? "bg-green-100" : "hover:bg-gray-50"}`}
                        >
                          <td className="p-2 border-r border-gray-200 w-[15%]">
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={rowData.accountId}
                                onChange={(e) =>
                                  handleMultiInputChange(
                                    item.accountId,
                                    "accountId",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              item.accountId
                            )}
                          </td>
                          <td className="p-2 border-r border-gray-200 w-[25%]">
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={rowData.accountName}
                                onChange={(e) =>
                                  handleMultiInputChange(
                                    item.accountId,
                                    "accountName",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              item.accountName
                            )}
                          </td>
                          <td className="p-2 border-r border-gray-200 w-[18%] uppercase">
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={rowData.costType}
                                onChange={(e) =>
                                  handleMultiInputChange(
                                    item.accountId,
                                    "costType",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              item.costType
                            )}
                          </td>
                          <td className="p-2 border-r border-gray-200 w-[18%] uppercase">
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={rowData.accountType}
                                onChange={(e) =>
                                  handleMultiInputChange(
                                    item.accountId,
                                    "accountType",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              item.accountType
                            )}
                          </td>
                          <td className="p-2 border-r border-gray-200 w-[18%] uppercase">
                            {isEditing ? (
                              <input
                                className="table-input"
                                value={rowData.budgetSheet}
                                onChange={(e) =>
                                  handleMultiInputChange(
                                    item.accountId,
                                    "budgetSheet",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              item.budgetSheet
                            )}
                          </td>
                          <td className="p-2 w-20 text-center">
                            <div className="flex gap-2 justify-center items-center h-full">
                              {isEditing ? (
                                <>
                                  {editingIds.length === 1 && (
                                    <button
                                      onClick={() =>
                                        handleUpdateRows(item.accountId)
                                      }
                                      className="text-green-600 cursor-pointer flex-shrink-0"
                                    >
                                      <Save size={16} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      cancelEditing(item.accountId)
                                    }
                                    className="text-red-500 cursor-pointer flex-shrink-0"
                                  >
                                    <X size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteRow(item.accountId)
                                    }
                                    className="text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="text-gray-400 hover:text-blue-600 cursor-pointer flex-shrink-0"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteRow(item.accountId)
                                    }
                                    className="text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMapping;