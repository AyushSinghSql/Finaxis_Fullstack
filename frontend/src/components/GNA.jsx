import React, { useState, useEffect } from "react";
import { backendUrl } from "./config";

const monthsHeader = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

const GNA = () => {
const [costData, setCostData] = useState([]);
  const [baseData, setBaseData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [closePeriod, setClosePeriod] = useState(null);
  const [closePeriodLabel, setClosePeriodLabel] = useState("");
  const [escPercent, setEscPercent] = useState("");   // escalation %
  const [rate, setRate] = useState(0);
  const [ytdBaseAllocationActual, setYtdBaseAllocationActual] = useState(0);
  const [closePeriodMonth, setClosePeriodMonth] = useState(null); // 1–12
const [closePeriodYear, setClosePeriodYear] = useState(null);
  const [costTotals, setCostTotals] = useState({
  totalYTDCostActualAmt: 0,
  totalYTDCostBudgetAmt: 0,
  monthTotals: Array(12).fill(0),
  ytdMonthTotals: Array(12).fill(0)
});

const [baseTotals, setBaseTotals] = useState({
  ytdBaseTotal: 0,
  ytdAllocTotal: 0,
  ytdBudgetTotal: 0,
  monthBaseTotals: Array(12).fill(0),
  monthAllocTotals: Array(12).fill(0),
   monthYtdCostTotals: Array(12).fill(0),    // ✅ NEW
  monthYtdAllocTotals: Array(12).fill(0),
});

const [costSortDir, setCostSortDir] = useState("asc");   // for costData
const [baseSortDir, setBaseSortDir] = useState("asc");   // for baseData


const sortedCostData = [...costData].sort((a, b) => {
  if (a.acctId === b.acctId) return 0;
  if (costSortDir === "asc") {
    return a.acctId > b.acctId ? 1 : -1;
  }
  return a.acctId < b.acctId ? 1 : -1;
});

const sortedBaseData = [...baseData].sort((a, b) => {
  if (a.acctId === b.acctId) return 0;
  if (baseSortDir === "asc") {
    return a.acctId > b.acctId ? 1 : -1;
  }
  return a.acctId < b.acctId ? 1 : -1;
});


  const monthNames = monthsHeader;
  // config: closing_period + escallation_percent
  const fetchConfig = async () => {
    try {
      const res = await fetch(
        `${backendUrl}/api/Configuration/GetAllConfigValuesByProject/xxxxx`
      );
      const cfg = await res.json();

const closing = cfg.find((c) => c.name === "closing_period");
if (closing?.value) {
  const d = new Date(closing.value);
  const m = d.getMonth(); // 0–11
  const y = d.getFullYear();
  setClosePeriodMonth(m + 1);
  setClosePeriodYear(y);
  setClosePeriodLabel(`${monthsHeader[m]} ${y}`);
}


      const esc = cfg.find((c) => c.name === "escallation_percent");
      if (esc?.value) setEscPercent(esc.value);
    } catch {
      setClosePeriod(null);
      setClosePeriodLabel("");
      setEscPercent("");
    }
  };

 const isPeriodClosed = (period, year) => {
  if (!closePeriodMonth || !closePeriodYear) return false;
  if (year < closePeriodYear) return true;
  if (year > closePeriodYear) return false;
  return period <= closePeriodMonth;
};

  // map cost detail
  const mapCostData = (rows) =>
    rows.map((row) => ({
      orgId: row.orgId,
      acctId: row.acctId,
      accountName : row.accountName,
      ytdActual: Number(row.ytdActualAmt) || 0,
      ytdBudget: Number(row.ytdBudgetedAmt) || 0,
      ytdamt: Number(row.ytdamt) || 0,
      months: monthsHeader.map((_, idx) => {
        const period = idx + 1;
        const p =
          row.periodDetails?.find((d) => d.period === period) || {};
        return {
          actual: Number(p.actualamt) || 0,
          budget: Number(p.actualamt) || 0,
          ytdamt: Number(p.ytdamt) || 0,
        };
      }),
    }));

  // map base detail
const mapBaseData = (rows) =>
  rows.map((row) => ({
    orgId: row.orgId,
    acctId: row.acctId,
    allocationOrgId: row.allocationOrgId,
    allocationAcctId: row.allocationAcctId,
    accountName: row.accountName,
    ytdBase: Number(row.ytdActualAmt) || 0,          // 22,111,491.57
    ytdAllocation: Number(row.ytdAllocationAmt) || 0, // 3,561,851.73
    ytdBudget: Number(row.ytdBudgetedAmt) || 0,      // 0
    months: monthsHeader.map((_, idx) => {
      const period = idx + 1;
      const p =
        row.periodDetails?.find((d) => d.period === period) || {};
      return {
        base: Number(p.baseAmt) || 0,
        allocation: Number(p.allocationAmt) || 0,
        ytdcostAmt: Number(p.ytdcostAmt) || 0,
         ytdAllocationAmt: Number(p.ytdAllocationAmt) || 0,  
         
      };
    }),
  }));


  const calcCostTotals = (rows) => {
  const totalYTDCostActualAmt = rows.reduce(
    (sum, r) => sum + (Number(r.ytdActual) || 0),
    0
  );

  const totalYTDCostBudgetAmt = rows.reduce(
    (sum, r) => sum + (Number(r.ytdBudget) || 0),
    0
  );
  const monthTotals = monthsHeader.map((_, idx) => {
    const period = idx + 1;
    const closed = isPeriodClosed(period, selectedYear);
    return rows.reduce((sum, r) => {
      const val = closed
        ? Number(r.months[idx]?.actual) || 0
        : Number(r.months[idx]?.actual) || 0;
      return sum + val;
    }, 0);
  });

   // NEW: Calculate YTD totals for each period
const ytdMonthTotals = monthsHeader.map((_, idx) => {
    return rows.reduce((sum, r) => {
      return sum + Number(r.months[idx]?.ytdamt || 0);
    }, 0);
  });

  return { totalYTDCostActualAmt, monthTotals ,totalYTDCostBudgetAmt,ytdMonthTotals};
};

const calcBaseTotals = (rows) => {
  const ytdBaseTotal = rows.reduce(
    (sum, r) => sum + (Number(r.ytdBase) || 0),
    0
  );
  const ytdAllocTotal = rows.reduce(
    (sum, r) => sum + (Number(r.ytdAllocation) || 0),
    0
  );
  const ytdBudgetTotal = rows.reduce(
    (sum, r) => sum + (Number(r.ytdBudget) || 0),
    0
  );

  const monthBaseTotals = monthsHeader.map((_, idx) =>
    rows.reduce(
      (sum, r) => sum + (Number(r.months[idx]?.base) || 0),
      0
    )
  );
  const monthAllocTotals = monthsHeader.map((_, idx) =>
    rows.reduce(
      (sum, r) => sum + (Number(r.months[idx]?.allocation) || 0),
      0
    )
  );

   const monthYtdCostTotals = monthsHeader.map((_, idx) =>      // ✅ NEW
    rows.reduce((sum, r) => sum + (Number(r.months[idx]?.ytdcostAmt) || 0), 0)
  );
  const monthYtdAllocTotals = monthsHeader.map((_, idx) =>     // ✅ NEW
    rows.reduce((sum, r) => sum + (Number(r.months[idx]?.ytdAllocationAmt) || 0), 0)
  );

  return {
    ytdBaseTotal,
    ytdAllocTotal,
    ytdBudgetTotal,
    monthBaseTotals,
    monthAllocTotals,
     monthYtdCostTotals,      // ✅ NEW
    monthYtdAllocTotals, 
  };
};

    const fetchData = async (selectedYear) => {
        try {
        setLoading(true);
        setError(null);

        const res = await fetch(
            `${backendUrl}/Orgnization/GetHR?fycd=${selectedYear}&type=GNA`
        );
        if (!res.ok) throw new Error("Failed to fetch data");

        const json = await res.json();
        const costRaw = json.poolOrgCostFinancialDetail || [];
        const baseRaw = json.poolOrgBaseFinancialDetail || [];

        const mappedCost = mapCostData(costRaw);
        const mappedBase = mapBaseData(baseRaw);

        setCostData(mappedCost);
        setCostTotals(calcCostTotals(mappedCost));
setRate(json.rate ?? 0);
setYtdBaseAllocationActual(json.totalYTDBaseAllocationActualAmt ?? 0);
        setBaseData(mappedBase);
        setBaseTotals(calcBaseTotals(mappedBase));
        } catch (e) {
        setError(e.message);
        setCostData([]);
        setBaseData([]);
        } finally {
        setLoading(false);
        }
    };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchData(selectedYear);
    // recompute totals after escPercent fetched
  }, [selectedYear]);

  // Recompute cost totals whenever cost data, selected year, or close period changes
  useEffect(() => {
    setCostTotals(calcCostTotals(costData));
  }, [costData, selectedYear, closePeriodMonth, closePeriodYear]);

  const formatNumber = (n) =>
    n === null || n === undefined || n === ""
      ? ""
      : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full p-4">
      {/* Top bar */}
      <div className="flex items-center gap-6">
        {/* Closing period + Year selector keep same as before */}
        <div className="input-label">
          Closing period:&nbsp;
          <span className="input-label">{closePeriodLabel || "—"}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Escalation + rate (same styling) */}
          <div className="flex items-center gap-2">
            <label className="input-label">Rate:</label>
            <input
              type="text"
              className="border outline-none border-gray-300 rounded px-2 py-1.5 text-xs sm:text-sm w-[70px]"
              value={
                rate === null || rate === undefined || rate === ""
                  ? ""
                  : `${formatNumber(rate)}%`
              }
              readOnly
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="input-label">Year:</label>
            <select
              className="input-style w-[75px]"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const y = new Date().getFullYear() - 1 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="table">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 mt-4">Loading...</span>
          </div>
        </div>
      )}
      {error && <div className="table text-red-600">Error: {error}</div>}

      {/* COST TABLE */}
      {!loading && !error && (
        <div calssName="mt-2">
          <h3 className="input-label">Cost Account</h3>
          <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
            <table className="table w-full">
              <thead className="thead bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-20 border-b-2 border-gray-200">
                <tr>
                  <th
                    className=" th-thead border border-gray-200 font-semibold text-gray-900 cursor-pointer"
                    rowSpan={2}
                    onClick={() =>
                      setCostSortDir((prev) =>
                        prev === "asc" ? "desc" : "asc",
                      )
                    }
                  >
                    Account ID {costSortDir === "asc" ? "▲" : "▼"}
                  </th>
                  <th
                    className=" th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    Account Name
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    Org ID
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    YTD Actual Amt
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    YTD Budget Amt
                  </th>
                  {monthsHeader.map((m) => (
                    <th
                      key={m}
                      className="th-thead border border-gray-200 font-semibold text-gray-900"
                      colSpan={2}
                    >
                      {m}
                    </th>
                  ))}
                </tr>

                <tr>
                  {monthsHeader.map((_, i) => {
                    const period = i + 1;
                    const closed = isPeriodClosed(period, selectedYear);
                    return (
                      <>
                        <th
                          key={period}
                          // className="th-thead border border-gray-200 font-semibold text-gray-900"
                          className={
                            "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " 
                          }
                        >
                          {closed ? "Actual Amt" : "Budget Amt"}
                        </th>
                        <th
                          key={`ytd-${period}`}
                          className={
                            "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " 
                          }
                        >
                          YTD Amt
                        </th>
                      </>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="tbody divide-y divide-gray-100">
                {sortedCostData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.acctId}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.accountName}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.orgId}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {formatNumber(item.ytdActual)}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {formatNumber(item.ytdBudget)}
                    </td>

                    {item.months.map((m, i) => {
                      const period = i + 1;
                      const closed = isPeriodClosed(period, selectedYear);

                      return (
                        <React.Fragment key={period}>
                          <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                            {formatNumber(closed ? m.actual : m.budget)}
                          </td>
                          <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                            {formatNumber(m.ytdamt)}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="sticky-tfoot">
                  <td
                    className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm"
                    colSpan={3}
                  >
                    Totals :
                  </td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                    {formatNumber(ytdBaseAllocationActual)}
                  </td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                    {formatNumber(costTotals.totalYTDCostBudgetAmt)}
                  </td>
                  {monthsHeader.map((_, i) => (
                    <>
                      <td
                        key={i}
                        className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm"
                      >
                        {formatNumber(costTotals.monthTotals[i] ?? 0)}
                      </td>
                      <td
                        key={`ytd-total-${i}`}
                        className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm"
                      >
                        {formatNumber(costTotals.ytdMonthTotals[i] ?? 0)}
                      </td>
                    </>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
          {/* )} */}

          {/* BASE TABLE */}
          <h3 className="input-label">Base Account</h3>
          <div className="mt-1 overflow-x-auto max-h-[40vh] overflow-y-auto">
            <table className="table w-full">
              <thead className="thead">
                <tr>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900 cursor-pointer"
                    rowSpan={2}
                    onClick={() =>
                      setBaseSortDir((prev) =>
                        prev === "asc" ? "desc" : "asc",
                      )
                    }
                  >
                    Account ID {baseSortDir === "asc" ? "▲" : "▼"}
                  </th>
                  <th
                    className=" th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    Account Name
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    Org ID
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    YTD Base Amt
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    Allocation Org ID
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    Allocation Acct ID
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    YTD Allocation Amt
                  </th>
                  <th
                    className="th-thead border border-gray-200 font-semibold text-gray-900"
                    rowSpan={2}
                  >
                    YTD Budget Amt
                  </th>
                  {monthsHeader.map((m) => (
                    <th
                      key={m}
                      className="th-thead border border-gray-200 font-semibold text-gray-900"
                      colSpan={4}
                    >
                      {m}
                    </th>
                  ))}
                </tr>
                {/* <tr 
      >
        {monthsHeader.map((_, i) => (
          <React.Fragment key={i}>
            <th className="th-thead border border-gray-200 font-semibold text-gray-900">Base</th>
            <th className="th-thead border border-gray-200 font-semibold text-gray-900">
              Allocation
            </th>
          </React.Fragment>
        ))}
      </tr> */}
                <tr>
                  {monthsHeader.map((_, i) => (
                    <React.Fragment key={i}>
                      {/* Base = green */}
                      <th
                        className={
                          "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " 
                        }
                      >
                        Base Amt
                      </th>
                      {/* YTD Cost = blue */}
                      <th
                        className={
                          "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " 
                        }
                      >
                        YTD Cost
                      </th>

                      {/* Allocation = orange */}
                      <th
                        className={
                          "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " 
                        }
                      >
                        Allocation Amt
                      </th>
                      {/* YTD Allocation = purple */}
                      <th
                        className={
                          "th-thead border border-gray-200 font-semibold text-gray-900 py-2 px-2 text-center " 
                        }
                      >
                        YTD Alloc
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="tbody">
                {sortedBaseData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.acctId}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.accountName}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.orgId}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {formatNumber(item.ytdBase)}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.allocationOrgId}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {item.allocationAcctId}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {formatNumber(item.ytdAllocation)}
                    </td>
                    <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                      {formatNumber(item.ytdBudget)}
                    </td>

                    {item.months.map((m, i) => (
                      <React.Fragment key={i}>
                        <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                          {formatNumber(m.base)}
                        </td>
                        <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                          {formatNumber(m.ytdcostAmt)} {/* ✅ NEW */}
                        </td>
                        <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                          {formatNumber(m.allocation)}
                        </td>
                        <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                          {formatNumber(m.ytdAllocationAmt)} {/* ✅ NEW */}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="sticky-tfoot">
                  <td
                    className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm"
                    colSpan={3}
                  >
                    Totals:
                  </td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                    {formatNumber(baseTotals.ytdBaseTotal)}
                  </td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm"></td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm"></td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                    {formatNumber(baseTotals.ytdAllocTotal)}
                  </td>
                  <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                    {formatNumber(baseTotals.ytdBudgetTotal)}
                  </td>
                  {monthsHeader.map((_, i) => (
                    <React.Fragment key={i}>
                      <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                        {formatNumber(baseTotals.monthBaseTotals[i] ?? 0)}
                      </td>
                      <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                        {formatNumber(baseTotals.monthYtdCostTotals[i] ?? 0)}{" "}
                        {/* ✅ NEW */}
                      </td>
                      <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                        {formatNumber(baseTotals.monthAllocTotals[i] ?? 0)}
                      </td>
                      <td className="tbody-td border border-gray-200 py-3 px-4 whitespace-nowrap   text-sm">
                        {formatNumber(baseTotals.monthYtdAllocTotals[i] ?? 0)}{" "}
                        {/* ✅ NEW */}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GNA;


