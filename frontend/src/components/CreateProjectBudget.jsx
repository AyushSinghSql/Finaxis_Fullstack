import { BriefcaseBusiness, FolderKanban } from "lucide-react";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import { backendUrl } from "./config";
import axios from "axios";
import { toast } from "react-toastify";

const formatDate = (date) => {
  if (!date) return "";
  return date.split("T")[0];
};

const InputField = ({ label, value, onChange, type = "text" }) => (
  <div className="label-input-div">
    <label className="input-label">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="input-style"
      disabled
    />
  </div>
);

const CreateProjectBudget = () => {
  const [availableProjects, setAvailableProjects] = useState([]);
  const [newBusiness, setNewBusiness] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const [availableProjectForm, setAvailableProjectForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [newBusinessForm, setNewBusinessForm] = useState({
    description: "",
    startDate: "",
    endDate: "",
  });

  // useEffect(() => {
  //   fetch(`${backendUrl}/Project/GetAllProjects`)
  //     .then((res) => res.json())
  //     .then(setAvailableProjects);
  // }, []);

  // useEffect(() => {
  //   fetch(`${backendUrl}/GetAllNonTransferedNewBusinessAsync`)
  //     .then((res) => res.json())
  //     .then(setNewBusiness);
  // }, []);

  // 1. Define the fetch functions
  const fetchProjects = () => {
    fetch(`${backendUrl}/Project/GetAllProjects`)
      .then((res) => res.json())
      .then(setAvailableProjects);
  };

  const fetchNewBusiness = () => {
    fetch(`${backendUrl}/GetAllNonTransferedNewBusinessAsync`)
      .then((res) => res.json())
      .then(setNewBusiness);
  };

  // 2. Use them in Initial Mount
  useEffect(() => {
    fetchProjects();
    fetchNewBusiness();
  }, []);

  const projectOptions = availableProjects.map((p) => ({
    value: p.projectId,
    label: `${p.projectId} - ${p.name}`,
  }));

  const businessOptions = newBusiness.map((b) => ({
    value: b.businessBudgetId,
    label: b.businessBudgetId,
  }));

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const payload = {
        businessBudgetId: selectedBusiness.businessBudgetId,
        description: newBusinessForm.description,
        startDate: newBusinessForm.startDate,
        endDate: newBusinessForm.endDate,
        orgId: selectedBusiness.orgId,
        accountGroup: selectedBusiness.accountGroup,
        burdenTemplateId: selectedBusiness.burdenTemplateId,
        escalationRate: selectedBusiness.escalationRate,
        level: selectedBusiness.level,
        version: selectedBusiness.version,
        versionCode: selectedBusiness.versionCode,
        isActive: selectedBusiness.isActive,
      };

      console.log(selectedProject.projectId);
      console.log(payload);

      const sourceProjectId = selectedProject.projectId;

      const response = await axios.post(
        `${backendUrl}/Project/AddPBudgetFromNewBussinessAsync`,
        payload,
        {
          params: {
            SourceProject: sourceProjectId,
          },
        },
      );
      toast.success("Transfer successful");
      // --- REFRESH DATA HERE ---
      // 1. Refresh Data from Server
      fetchProjects();
      fetchNewBusiness();

      // 2. Reset Selection States to null
      setSelectedBusiness(null);
      setSelectedProject(null);

      // 3. Reset Form States to empty strings
      setNewBusinessForm({
        description: "",
        startDate: "",
        endDate: "",
      });

      setAvailableProjectForm({
        name: "",
        startDate: "",
        endDate: "",
      });

      setLoading(false);
      console.log(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Transfer failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="p-4 rounded-sm flex items-center justify-between bg-white">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BriefcaseBusiness size={20} className="text-blue-600" />
          New Business Transfer Utility
        </h2>
      </div>

      <div className="bg-white rounded-sm p-4">
         <div className="w-full flex justify-end mb-2">
          <button
            onClick={handleTransfer}
            disabled={!selectedBusiness || !selectedProject || loading}
            className="
    btn1 btn-blue
    text-base
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:pointer-events-none
  "
          >
            {loading ? "Transfering..." : "Transfer"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-10 mt-2">
          <div>
            <h2 className="mb-4 text-[14px] font-bold flex items-center gap-2 text-black">
              New Business
            </h2>
            <div className=" text-sm space-y-2">
              <div className="label-input-div ">
                <h2 className="input-label">Project ID</h2>
                <Select
                  options={businessOptions}
                  className="w-[60%]"
                  value={
                    selectedBusiness
                      ? {
                          value: selectedBusiness.businessBudgetId,
                          label: selectedBusiness.businessBudgetId,
                        }
                      : null
                  }
                  onChange={(o) => {
                    const business = newBusiness.find(
                      (b) => b.businessBudgetId === o?.value,
                    );
                    setSelectedBusiness(business || null);
                    setNewBusinessForm({
                      description: business?.description || "",
                      startDate: formatDate(business?.startDate),
                      endDate: formatDate(business?.endDate),
                    });
                  }}
                  placeholder="Select Business ID"
                />
              </div>

              <InputField
                label="Description"
                value={newBusinessForm.description}
                // onChange={(e) =>
                //   setNewBusinessForm({
                //     ...newBusinessForm,
                //     description: e.target.value,
                //   })
                // }
                readOnly={true}
              />

              <InputField
                label="Start Date"
                type="text"
                value={newBusinessForm.startDate}
                // onChange={(e) =>
                //   setNewBusinessForm({
                //     ...newBusinessForm,
                //     startDate: e.target.value,
                //   })
                // }
                readOnly={true}
              />

              <InputField
                label="End Date"
                type="text"
                value={newBusinessForm.endDate}
                // onChange={(e) =>
                //   setNewBusinessForm({
                //     ...newBusinessForm,
                //     endDate: e.target.value,
                //   })
                // }
                readOnly={true}
              />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-[14px] font-bold flex items-center gap-2 text-black">
              Available Projects
            </h2>

            <div className="text-sm space-y-2">
              <div className="label-input-div">
                <h2 className="input-label">Project ID</h2>
                <Select
                  options={projectOptions}
                  className="w-[60%]"
                  value={
                    selectedProject
                      ? {
                          value: selectedProject.projectId,
                          label: `${selectedProject.projectId} - ${selectedProject.name}`,
                        }
                      : null
                  }
                  onChange={(o) => {
                    const project = availableProjects.find(
                      (p) => p.projectId === o?.value,
                    );
                    setSelectedProject(project || null);
                    setAvailableProjectForm({
                      name: project?.name || "",
                      startDate: formatDate(project?.startDate),
                      endDate: formatDate(project?.endDate),
                    });
                  }}
                  placeholder="Select Project"
                />
              </div>

              <InputField
                label="Project Name"
                value={availableProjectForm.name}
                readOnly={true}
              />

              <InputField
                label="Start Date"
                type="text"
                value={availableProjectForm.startDate}
                readOnly={true}
              />

              <InputField
                label="End Date"
                type="text"
                value={availableProjectForm.endDate}
                readOnly={true}
              />
            </div>
          </div>
        </div>

        {/* <div className="w-full flex justify-end mt-4">
          <button
            onClick={handleTransfer}
            disabled={!selectedBusiness || !selectedProject || loading}
            className="
    btn1 btn-blue
    text-base
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:pointer-events-none
  "
          >
            {loading ? "Transfering..." : "Transfer"}
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default CreateProjectBudget;
