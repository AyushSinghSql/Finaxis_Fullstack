import React from 'react'

const ProjectDetailBar = ({selectedPlan, templateInfo, formatDate}) => {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2 text-xs">
                    <span>
                      <span className="font-semibold">Project ID: </span>
                      {selectedPlan.projId}
                    </span>
                    <span>
                      <span className="font-semibold">Type: </span>
                      {selectedPlan.plType || "N/A"}
                    </span>
                    <span>
                      <span className="font-semibold">Version: </span>
                      {selectedPlan.version || "N/A"}
                    </span>
                    <span>
                      <span className="font-semibold">Status: </span>
                      {selectedPlan.status || "N/A"}
                    </span>
                    <span>
                      <span className="font-semibold">POP: </span>{" "}
                      {selectedPlan.projStartDt
                        ? formatDate(selectedPlan.projStartDt)
                        : "N/A"}{" "}
                      |{" "}
                      {selectedPlan.projEndDt
                        ? formatDate(selectedPlan.projEndDt)
                        : "N/A"}
                    </span>
                    <span>
                      <span className="font-semibold">Closed Period: </span>
                      {formatDate(selectedPlan.closedPeriod || "N/A")}
                    </span>
                    <span>
                      <span className="font-semibold">Burden Type: </span>
                      {/* Using templateCode from the new state, or N/A if not loaded yet */}
                      {/* {selectedPlan?.templateId || "N/A"}
                       */}
                      {templateInfo ? templateInfo.templateCode : "N/A"}
                    </span>
    
                    <span>
                      <span className="font-semibold">Revenue Method: </span>
                      {/* Logic: T -> Target, A -> Actual */}
                      {selectedPlan?.type === "T"
                        ? "Target"
                        : selectedPlan?.type === "A"
                          ? "Actual"
                          : "N/A"}
                    </span>
                  </div>
  )
}

export default ProjectDetailBar;
