using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Npgsql.Replication.TestDecoding;
using NPOI.POIFS.FileSystem;
using NPOI.SS.Formula.Functions;
using PlanningAPI.DTO;
using PlanningAPI.Helpers;
using PlanningAPI.Models;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using WebApi.DTO;
using WebApi.Models;
using WebApi.Services;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace WebApi.Helpers
{
    public class Helper
    {
        private readonly MydatabaseContext _context;

        public Helper()
        {
        }

        public Helper(MydatabaseContext context)
        {
            _context = context;
        }


        public List<PlForecast> GetForecastData(List<PlForecast> forecastList, PlProjectPlan newPlan, string type)
        {

            var actualHours = getActualDataByProjectId(newPlan.ProjId);
            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            foreach (var forecast in forecastList)
            {
                forecast.PlId = newPlan.PlId.GetValueOrDefault();
                forecast.Updatedat = null;
                forecast.Createdat = null;
                if (newPlan.PlType == "EAC" || newPlan.Version == 1 && type.ToLower() == "actual")
                {
                    int daysInMonth = DateTime.DaysInMonth(forecast.Year, forecast.Month);
                    DateTime forecastDay = new DateTime(forecast.Year, forecast.Month, DateTime.DaysInMonth(forecast.Year, forecast.Month));

                    if (forecastDay <= currentMonth)
                    {
                        var actualHour = (decimal)(actualHours
                                            .FirstOrDefault(p => p.Month == forecast.Month &&
                                                                 p.Year == forecast.Year &&
                                                                 p.EmployeeId == forecast.EmplId &&
                                                                 p.AccId == forecast.AcctId &&
                                                                 p.OrgId == forecast.OrgId &&
                                                                 p.Plc == forecast.Plc)
                                            ?.ActualHours ?? 0m);

                        if (forecast.Forecastedhours != actualHour)
                        {
                            //forecast.Forecastedhours = actualHour;
                            forecast.Forecastedhours = actualHour;

                        }
                    }
                }

            }

            return forecastList;
        }
        public List<MonthlyEmployeeHours> getActualDataByProjectId(string proj_Id)
        {
            var actualHours = _context.LabHours.Where(p => p.ProjId == proj_Id).Select(p => new MonthlyEmployeeHours()
            {
                ActualHours = p.ActHrs.GetValueOrDefault(),
                EmployeeId = p.EmplId,
                Month = p.PdNo,
                Year = Convert.ToInt16(p.FyCd),
                AccId = p.AcctId,
                Plc = p.BillLabCatCd,
                VendEmplId = p.VendEmplId,
                VendId = p.VendId,
                OrgId = p.OrgId
            }).ToList();


            //List<MonthlyEmployeeHours> actualHours = new List<MonthlyEmployeeHours>();
            //using var client = new HttpClient();
            //try
            //{
            //    string jsonString = client.GetStringAsync(url).GetAwaiter().GetResult();

            //    actualHours = JsonSerializer.Deserialize<List<MonthlyEmployeeHours>>(jsonString);

            //}
            //catch (Exception ex)
            //{
            //    Console.WriteLine("Error fetching or parsing JSON: " + ex.Message);
            //}
            return actualHours;
        }

        public T? GetValue<T>(IDictionary<string, object?> dict, string key)
        {
            if (dict.TryGetValue(key, out var val) && val is T typedVal)
                return typedVal;
            return default;
        }

        public T? GetValues<T>(IDictionary<string, object?> dict, string key)
        {
            if (dict.TryGetValue(key, out var val) && val != null)
            {
                try
                {
                    if (val is JsonElement jsonElement)
                    {
                        return jsonElement.Deserialize<T>();
                    }

                    return (T)Convert.ChangeType(val, typeof(T));
                }
                catch
                {
                    // Optionally log conversion failure
                    return default;
                }
            }

            return default;
        }

        internal List<MonthlyEmployeeHours> getActualDirectDataByProjectId(string projId)
        {
            //var actualHours = _context.PSRFinalData.Where(p => p.ProjId == projId).Select(p => new MonthlyEmployeeHours()
            //{
            //    ActualHours = p.PyIncurAmt,
            //    EmployeeId = p.AcctId,
            //    Month = p.PdNo,
            //    Year = Convert.ToInt16(p.FyCd)
            //}).ToList();

            var actualHours = _context.PlFinancialTransactions.Where(p => p.ProjId == projId && !string.IsNullOrEmpty(p.Id)).Select(p => new MonthlyEmployeeHours()
            {
                ActualHours = p.Amt1.GetValueOrDefault(),
                EmployeeId = p.Id,
                Month = p.PdNo.GetValueOrDefault(),
                AccId = p.AcctId,
                OrgId = p.OrgId,
                Plc = p.BillLabCatCd,
                Year = Convert.ToInt16(p.FyCd)
            }).ToList();

            return actualHours;
        }

        internal List<PlDct> GetForecastDirectCostData1(List<PlDct> amounts, PlProjectPlan newPlan, string type)
        {
            List<PlDct> plDctForecasts = new List<PlDct>();
            List<MonthlyEmployeeHours> actualAmounts = new List<MonthlyEmployeeHours>();
            actualAmounts = getActualDirectDataByProjectId(newPlan.ProjId);

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            foreach (var dct in amounts)
            {

                PlDct tempDct = new PlDct();
                tempDct.AcctId = dct.AcctId;
                tempDct.OrgId = dct.OrgId;
                tempDct.Category = dct.Category;
                tempDct.Id = dct.Id;
                tempDct.IsBrd = dct.IsBrd;
                tempDct.IsRev = dct.IsRev;
                tempDct.PlcGlc = dct.PlcGlc;
                tempDct.PlId = newPlan.PlId.GetValueOrDefault();
                tempDct.PlForecasts = new List<PlForecast>();
                foreach (var forecast in dct.PlForecasts)
                {
                    PlForecast plForecast = new PlForecast();

                    plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                    plForecast.ProjId = newPlan.ProjId;
                    plForecast.AcctId = dct.AcctId;
                    plForecast.Plc = dct.PlcGlc;
                    plForecast.OrgId = dct.OrgId;
                    plForecast.Forecastedamt = forecast.Forecastedamt;
                    plForecast.Month = forecast.Month;
                    plForecast.Year = forecast.Year;

                    if (forecast.Month == 1 && forecast.Year == 2025)
                    {

                    }

                    if (newPlan.PlType == "EAC" || type.Trim().ToLower() == "actual")
                    {
                        DateTime forecastDay = new DateTime(forecast.Year, forecast.Month, DateTime.DaysInMonth(forecast.Year, forecast.Month));

                        if (forecastDay < currentMonth)
                        {
                            //var actualAmount = (decimal)(actualAmounts
                            //                    .FirstOrDefault(p => p.Month == plForecast.Month &&
                            //                                         p.Year == plForecast.Year &&
                            //                                         p.EmployeeId == forecast.DirectCost.Id &&
                            //                                         p.AccId == plForecast.AcctId &&
                            //                                         p.OrgId == plForecast.OrgId)
                            //                    ?.ActualHours ?? 0m);

                            var actualAmount = actualAmounts
                                .Where(p => p.Month == plForecast.Month &&
                                            p.Year == plForecast.Year &&
                                            p.EmployeeId == forecast.DirectCost.Id &&
                                            p.AccId == plForecast.AcctId &&
                                            p.OrgId == plForecast.OrgId)
                                .Sum(p => (decimal?)p.ActualHours) ?? 0m;

                            if (plForecast.Forecastedamt != actualAmount)
                            {
                                plForecast.Forecastedamt = actualAmount;
                            }
                        }
                    }
                    tempDct.PlForecasts.Add(plForecast);
                }
                plDctForecasts.Add(tempDct);
            }
            return plDctForecasts;
        }

        internal List<PlDct> GetForecastDirectCostData(List<PlDct> amounts, PlProjectPlan newPlan, string type)
        {
            List<PlDct> plDctForecasts = new List<PlDct>();
            List<MonthlyEmployeeHours> actualAmounts = new List<MonthlyEmployeeHours>();
            actualAmounts = getActualDirectDataByProjectId(newPlan.ProjId);

            //////////////////////////////////////////////////////////////////////////////////////
            var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            var grpCode = _context.PlProjects.FirstOrDefault(p => p.ProjId == newPlan.ProjId)?.AcctGrpCd;
            var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();

            var laborAccountIds = NonLaborAccounts
                    .Select(p => p.AccountId)
                    .ToList();



            //var HistoryLabHSData = _context.LabHours.Where(p => p.ProjId.StartsWith(newPlan.ProjId)).Select(p => new
            //{
            //    p.ProjId,
            //    p.EmplId,
            //    p.VendEmplId,
            //    p.VendId,
            //    p.AcctId,
            //    p.OrgId,
            //    p.PdNo,
            //    FyCd = Convert.ToInt16(p.FyCd),
            //    p.BillLabCatCd,
            //    ActHrs = p.ActHrs.GetValueOrDefault(),
            //    p.ActAmt,
            //    p.EffectBillDt

            //}).ToList();

            ///////////////////////////////////////////////////////////////////////////////////////

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            foreach (var dct in amounts)
            {

                PlDct tempDct = new PlDct();
                tempDct.AcctId = dct.AcctId;
                tempDct.OrgId = dct.OrgId;
                tempDct.Category = dct.Category;
                tempDct.Id = dct.Id;
                tempDct.IsBrd = dct.IsBrd;
                tempDct.IsRev = dct.IsRev;
                tempDct.PlcGlc = dct.PlcGlc;
                tempDct.PlId = newPlan.PlId.GetValueOrDefault();
                tempDct.PlForecasts = new List<PlForecast>();
                tempDct.CreatedDate = DateTime.Now.ToUniversalTime();
                tempDct.LastModifiedDate = DateTime.Now.ToUniversalTime();
                tempDct.Type = dct.Type;

                //var ifexistInLabor = HistoryLabHSData.FirstOrDefault(p => (p.VendEmplId == dct.Id || p.EmplId == dct.Id) && p.AcctId == dct.AcctId && p.OrgId == dct.OrgId);


                ////if (!newPlan.ProjId.ToUpper().Contains("FRNGE"))
                ////{
                //if (ifexistInLabor != null)
                //{
                //    continue;
                //}
                ////}
                foreach (var forecast in dct.PlForecasts)
                {
                    PlForecast plForecast = new PlForecast();

                    plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                    plForecast.ProjId = newPlan.ProjId;
                    plForecast.AcctId = dct.AcctId;
                    plForecast.Plc = dct.PlcGlc;
                    plForecast.OrgId = dct.OrgId;
                    plForecast.EmplId = forecast.EmplId;
                    plForecast.Forecastedamt = forecast.Forecastedamt;
                    plForecast.Month = forecast.Month;
                    plForecast.Year = forecast.Year;
                    plForecast.Actualamt = forecast.Actualamt;
                    plForecast.Forecastedhours = forecast.Forecastedhours;
                    plForecast.Actualhours = forecast.Actualhours;
                    plForecast.Fringe = forecast.Fringe;
                    plForecast.Cost = forecast.Cost;
                    plForecast.Overhead = forecast.Overhead;
                    plForecast.Gna = forecast.Gna;
                    plForecast.Materials = forecast.Materials;
                    plForecast.Hr = forecast.Hr;
                    plForecast.YtdGna = forecast.YtdGna;
                    plForecast.YtdCost = forecast.YtdCost;
                    plForecast.YtdFringe = forecast.YtdFringe;
                    plForecast.YtdOverhead = forecast.YtdOverhead;
                    plForecast.YtdMaterials = forecast.YtdMaterials;
                    plForecast.Burden = forecast.Burden;
                    tempDct.PlForecasts.Add(plForecast);
                }
                plDctForecasts.Add(tempDct);
            }
            return plDctForecasts;
        }

        internal List<PlDct> GetForecastDirectCostData_Working(List<PlDct> amounts, PlProjectPlan newPlan, string type)
        {
            List<PlDct> plDctForecasts = new List<PlDct>();
            List<MonthlyEmployeeHours> actualAmounts = new List<MonthlyEmployeeHours>();
            actualAmounts = getActualDirectDataByProjectId(newPlan.ProjId);

            //////////////////////////////////////////////////////////////////////////////////////
            var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            var grpCode = _context.PlProjects.FirstOrDefault(p => p.ProjId == newPlan.ProjId)?.AcctGrpCd;
            var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();

            var PSRData = _context.PSRFinalData
                    .Where(p => p.ProjId == newPlan.ProjId && p.SubTotTypeNo == 4 && p.RateType == "A")
                    .Select(p => new
                    {
                        p.ProjId,
                        p.PoolName,
                        p.AcctId,
                        p.OrgId,
                        p.PdNo,
                        p.FyCd,
                        p.PoolNo,
                        p.CurBurdRt
                    })
                    .ToList();

            var HistoryData = _context.PlFinancialTransactions
                        .Where(p => p.ProjId == newPlan.ProjId && !string.IsNullOrEmpty(p.Id))
                        .Select(p => new
                        {
                            p.ProjId,
                            p.Id,
                            p.AcctId,
                            p.OrgId,
                            p.PdNo,
                            p.FyCd,
                            p.BillLabCatCd,
                            p.Hrs1,
                            p.Amt1,
                            p.EffectBillDt,
                            p.Name
                        })
                        .ToList();




            ///////////////////////////////////////////////////////////////////////////////////////

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            foreach (var dct in amounts)
            {

                PlDct tempDct = new PlDct();
                tempDct.AcctId = dct.AcctId;
                tempDct.OrgId = dct.OrgId;
                tempDct.Category = dct.Category;
                tempDct.Id = dct.Id;
                tempDct.IsBrd = dct.IsBrd;
                tempDct.IsRev = dct.IsRev;
                tempDct.PlcGlc = dct.PlcGlc;
                tempDct.PlId = newPlan.PlId.GetValueOrDefault();
                tempDct.PlForecasts = new List<PlForecast>();
                tempDct.CreatedDate = DateTime.Now.ToUniversalTime();
                tempDct.LastModifiedDate = DateTime.Now.ToUniversalTime();

                foreach (var forecast in dct.PlForecasts)
                {
                    PlForecast plForecast = new PlForecast();

                    plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                    plForecast.ProjId = newPlan.ProjId;
                    plForecast.AcctId = dct.AcctId;
                    plForecast.Plc = dct.PlcGlc;
                    plForecast.OrgId = dct.OrgId;
                    plForecast.EmplId = forecast.EmplId;
                    plForecast.Forecastedamt = forecast.Forecastedamt;
                    plForecast.Month = forecast.Month;
                    plForecast.Year = forecast.Year;
                    plForecast.Actualamt = forecast.Forecastedamt;
                    plForecast.Forecastedhours = forecast.Forecastedhours;
                    plForecast.Actualhours = forecast.Actualhours;

                    if (forecast.Month == 1 && forecast.Year == 2025)
                    {

                    }

                    if (newPlan.PlType == "EAC" || type.Trim().ToLower() == "actual")
                    {
                        DateTime forecastDay = new DateTime(forecast.Year, forecast.Month, DateTime.DaysInMonth(forecast.Year, forecast.Month));

                        if (forecastDay < currentMonth)
                        {
                            var actualData = HistoryData
                                            .Where(p => p.PdNo == plForecast.Month &&
                                                  p.FyCd == plForecast.Year.ToString() &&
                                                  p.Id == plForecast.EmplId &&
                                                  p.AcctId == plForecast.AcctId &&
                                                  p.OrgId == plForecast.OrgId);

                            plForecast.Cost = actualData.Sum(p => p.Amt1).GetValueOrDefault();

                            if (actualData.Count() > 0)
                            {
                                if (string.IsNullOrEmpty(dct.Category))
                                    dct.Category = actualData.FirstOrDefault().Name;
                                plForecast.Actualamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                                plForecast.Cost = plForecast.Actualamt.GetValueOrDefault();
                                var poolrateInfo = PSRData.Where(p => p.AcctId == plForecast.AcctId && p.OrgId == p.OrgId && p.FyCd == plForecast.Year.ToString() && p.PdNo == plForecast.Month);
                                decimal fringe = 0, overhead = 0, gna = 0, material = 0;
                                if (poolrateInfo != null)
                                {
                                    foreach (var item in poolrateInfo)
                                    {
                                        if (item.PoolName.ToUpper().Contains("FRINGE"))
                                        {
                                            fringe = item.CurBurdRt;
                                        }
                                        if (item.PoolName.ToUpper().Contains("OH"))
                                        {
                                            overhead = item.CurBurdRt;
                                        }
                                        if (item.PoolName.ToUpper().Contains("G&A"))
                                        {
                                            gna = item.CurBurdRt;
                                        }
                                        if (item.PoolName.ToLower().Contains("material"))
                                        {
                                            material = item.CurBurdRt;
                                        }
                                    }
                                    plForecast.Fringe = (decimal)(plForecast.Cost * fringe);
                                    plForecast.Materials = (decimal)(plForecast.Cost * material);
                                    plForecast.Overhead = (decimal)((plForecast.Cost + plForecast.Fringe) * overhead);
                                    plForecast.Gna = (decimal)((plForecast.Cost + plForecast.Fringe + plForecast.Overhead) * gna);
                                    plForecast.Burden = plForecast.Fringe + plForecast.Overhead + plForecast.Gna + plForecast.Materials;
                                    //plForecast.Revenue = plForecast.Cost + plForecast.Burden;
                                }
                                //plForecast.Actualamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                                //plForecast.EffectDt = null;// actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToDateTime(TimeOnly.MinValue).ToUniversalTime();
                                plForecast.EffectDt = null;// actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault();
                            }
                        }
                    }
                    tempDct.PlForecasts.Add(plForecast);
                }
                plDctForecasts.Add(tempDct);
            }
            return plDctForecasts;
        }


        internal List<PlEmployeee> GetForecasEmployeeHoursData1(List<PlEmployeee> amounts, PlProjectPlan newPlan, string type)
        {
            List<PlEmployeee> plHoursForecasts = new List<PlEmployeee>();
            List<MonthlyEmployeeHours> actualHours = new List<MonthlyEmployeeHours>();
            actualHours = getActualDataByProjectId(newPlan.ProjId);

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            foreach (var emp in amounts)
            {

                PlEmployeee tempEmp = new PlEmployeee();
                tempEmp.AccId = emp.AccId;
                tempEmp.OrgId = emp.OrgId;
                tempEmp.EmplId = emp.EmplId;
                tempEmp.IsBrd = emp.IsBrd;
                tempEmp.IsRev = emp.IsRev;
                tempEmp.PlcGlcCode = emp.PlcGlcCode;
                tempEmp.FirstName = emp.FirstName;
                tempEmp.PerHourRate = emp.PerHourRate;
                tempEmp.Status = emp.Status;

                tempEmp.PlId = newPlan.PlId.GetValueOrDefault();
                tempEmp.PlForecasts = new List<PlForecast>();
                foreach (var forecast in emp.PlForecasts)
                {
                    PlForecast plForecast = new PlForecast();

                    plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                    plForecast.ProjId = newPlan.ProjId;
                    plForecast.AcctId = emp.AccId;
                    plForecast.Plc = emp.PlcGlcCode;
                    plForecast.OrgId = emp.OrgId;
                    plForecast.Forecastedamt = forecast.Forecastedamt;
                    plForecast.Month = forecast.Month;
                    plForecast.Year = forecast.Year;
                    plForecast.EmplId = forecast.EmplId;

                    //if (forecast.Month == 5 && forecast.Year == 2025)
                    //{

                    //}

                    if (newPlan.PlType == "EAC" || type.Trim().ToLower() == "actual")
                    {
                        DateTime forecastDay = new DateTime(forecast.Year, forecast.Month, DateTime.DaysInMonth(forecast.Year, forecast.Month));

                        if (forecastDay <= currentMonth)
                        {
                            var actualhour = (decimal)(actualHours
                                                .FirstOrDefault(p => p.Month == plForecast.Month &&
                                                                     p.Year == plForecast.Year &&
                                                                     p.EmployeeId == forecast.Emple.EmplId &&
                                                                     p.AccId == plForecast.AcctId &&
                                                                     p.OrgId == plForecast.OrgId)
                                                ?.ActualHours ?? 0m);
                            //if(actualAmount > 0)
                            //{

                            //}

                            if (plForecast.Actualhours != actualhour)
                            {
                                plForecast.Actualhours = actualhour;
                            }
                        }
                    }
                    tempEmp.PlForecasts.Add(plForecast);
                }
                plHoursForecasts.Add(tempEmp);
            }
            return plHoursForecasts;
        }

        internal List<PlEmployeee> GetForecasEmployeeHoursData(List<PlEmployeee> amounts, PlProjectPlan newPlan, string type)
        {
            List<PlEmployeee> plHoursForecasts = new List<PlEmployeee>();
            List<MonthlyEmployeeHours> actualHours = new List<MonthlyEmployeeHours>();

            List<PlOrgAcctPoolMapping> acctPool = new List<PlOrgAcctPoolMapping>();
            //////////////////////////////////////////////////////////////////////////////////
            if (newPlan.PlType != "NBBUD")
                acctPool = _context.PlOrgAcctPoolMappings.Where(p => p.OrgId == newPlan.Proj.OrgId).ToList();
            List<PlTemplatePoolRate> burdensByTemplate = new List<PlTemplatePoolRate>();

            if (newPlan.PlType != "NBBUD")
                burdensByTemplate = _context.PlTemplatePoolRates.Where(r => r.TemplateId == newPlan.TemplateId.GetValueOrDefault()).ToList();

            Account_Org_Helpercs account_Org_Helpercs = new Account_Org_Helpercs(_context);
            var templatePools = account_Org_Helpercs.GetPoolsByTemplateId(newPlan.TemplateId.GetValueOrDefault()).Select(p => p.PoolId).ToList();

            FinanceHelper financeHelper = new FinanceHelper(_context, newPlan.ProjId);
            //////////////////////////////////////////////////////////////////////////////////
            //var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            //var grpCode = _context.PlProjects.FirstOrDefault(p => p.ProjId == newPlan.ProjId)?.AcctGrpCd;
            //var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();

            //var HistoryData = _context.LabHours.Where(p => p.ProjId == newPlan.ProjId).Select(p => new
            //{
            //    p.ProjId,
            //    p.EmplId,
            //    p.VendEmplId,
            //    p.VendId,
            //    p.AcctId,
            //    p.OrgId,
            //    p.PdNo,
            //    FyCd = Convert.ToInt16(p.FyCd),
            //    p.BillLabCatCd,
            //    ActHrs = p.ActHrs.GetValueOrDefault(),
            //    p.ActAmt,
            //    p.EffectBillDt

            //}).ToList();


            ///////////////////////////////////////////////////////////////////////////////////
            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            foreach (var emp in amounts)
            {

                PlEmployeee tempEmp = new PlEmployeee();
                tempEmp.AccId = emp.AccId;
                tempEmp.OrgId = emp.OrgId;
                tempEmp.EmplId = emp.EmplId;
                tempEmp.IsBrd = emp.IsBrd;
                tempEmp.IsRev = emp.IsRev;
                tempEmp.PlcGlcCode = emp.PlcGlcCode;
                tempEmp.FirstName = emp.FirstName;
                tempEmp.LastName = emp.LastName;
                tempEmp.PerHourRate = emp.PerHourRate;
                tempEmp.EffectiveDate = emp.EffectiveDate;
                tempEmp.Status = emp.Status;
                tempEmp.Type = emp.Type;
                tempEmp.PlId = newPlan.PlId.GetValueOrDefault();
                tempEmp.PlForecasts = new List<PlForecast>();
                foreach (var forecast in emp.PlForecasts)
                {
                    PlForecast plForecast = new PlForecast();

                    plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                    plForecast.ProjId = newPlan.ProjId;
                    plForecast.AcctId = emp.AccId;
                    plForecast.Plc = emp.PlcGlcCode;
                    plForecast.OrgId = emp.OrgId;
                    plForecast.Forecastedamt = forecast.Forecastedamt;
                    plForecast.Month = forecast.Month;
                    plForecast.Year = forecast.Year;
                    plForecast.EmplId = forecast.EmplId;
                    plForecast.Actualamt = forecast.Actualamt;
                    plForecast.Forecastedamt = forecast.Forecastedamt;
                    plForecast.Forecastedhours = forecast.Forecastedhours;
                    plForecast.Actualhours = forecast.Actualhours;
                    plForecast.HrlyRate = forecast.HrlyRate;
                    plForecast.Revenue = forecast.Revenue;
                    plForecast.Fringe = forecast.Fringe;
                    plForecast.Cost = forecast.Cost;
                    plForecast.Overhead = forecast.Overhead;
                    plForecast.Gna = forecast.Gna;
                    plForecast.Materials = forecast.Materials;
                    plForecast.Hr = forecast.Hr;
                    plForecast.YtdGna = forecast.YtdGna;
                    plForecast.YtdCost = forecast.YtdCost;
                    plForecast.YtdFringe = forecast.YtdFringe;
                    plForecast.YtdOverhead = forecast.YtdOverhead;
                    plForecast.YtdMaterials = forecast.YtdMaterials;
                    plForecast.Burden = forecast.Burden;

                    tempEmp.PlForecasts.Add(plForecast);
                }
                plHoursForecasts.Add(tempEmp);
            }
            return plHoursForecasts;
        }


        public void CloneAdjustmentData(int pl_id, int new_plid)
        {
            try
            {
                var existingPds = _context.ProjRevWrkPds
                                          .Where(p => p.Pl_Id == pl_id)
                                          .AsNoTracking() // important
                                          .ToList();

                if (!existingPds.Any())
                    return;

                var clonedPds = existingPds.Select(p => new ProjRevWrkPd
                {
                    // DO NOT copy primary key
                    // Id = 0;

                    Pl_Id = new_plid,

                    // copy rest of the fields
                    ActualFeeAmountOnCost = p.ActualFeeAmountOnCost,
                    ActualFeeRateOnCost = p.ActualFeeRateOnCost,
                    BgtType = p.BgtType,
                    EndDate = p.EndDate,
                    ProjId = p.ProjId,
                    RevAdj = p.RevAdj,
                    RevAdj1 = p.RevAdj1,
                    RevAmt = p.RevAmt,
                    RevDesc = p.RevDesc,
                    TargetFeeAmountOnCost = p.TargetFeeAmountOnCost,
                    TargetFeeRateOnCost = p.TargetFeeRateOnCost
                    // copy whatever columns make sense
                }).ToList();

                _context.ProjRevWrkPds.AddRange(clonedPds);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error cloning adjustment data");
                throw;
            }
        }


        public void GetAdjustmentData(int pl_id, string projId, int? versionNo = null, string bgtType = null)
        {
            ProjectRevenueAdjustment projectRevenueAdjustment = new ProjectRevenueAdjustment();
            try
            {
                var query = _context.ProjRevWrkPds.AsQueryable();

                if (!string.IsNullOrEmpty(projId))
                    query = query.Where(p => p.ProjId == projId);

                query = query.Where(p => p.Pl_Id == pl_id);

                var allPds = query.ToList();

                foreach (var pd in allPds)
                {
                    pd.Fy_Cd = pd.EndDate.GetValueOrDefault().Year;
                }

                if (allPds.Count() == 0)
                {
                    var project = _context.PlProjects.FirstOrDefault(p => p.ProjId == projId);

                    if (project != null)
                    {
                        var psrData = _context.PSRFinalData.Where(p => p.ProjId.StartsWith(projId) && p.SubTotTypeNo == 1 && p.RateType == "A").ToList();
                        ScheduleHelper helper = new ScheduleHelper();
                        var months = helper.GetMonthsBetween(project.ProjStartDt.GetValueOrDefault(), project.ProjEndDt.GetValueOrDefault());

                        var AdjustmentData = _context.Set<ProjectRevenueAdjustment>()
                                    .AsNoTracking()
                                    .Where(x => x.ProjId.StartsWith(projId))
                                    .ToList();

                        foreach (var (year, month) in months)
                        {
                            projectRevenueAdjustment = new ProjectRevenueAdjustment();
                            decimal revData = 0;
                            if (psrData.FirstOrDefault(p => p.FyCd == year.ToString() && p.PdNo == month) != null)
                                revData = psrData.FirstOrDefault(p => p.FyCd == year.ToString() && p.PdNo == month).PtdIncurAmt;

                            if (AdjustmentData.FirstOrDefault(p => p.FyCd == year.ToString() && p.PdNo == month) != null)
                                projectRevenueAdjustment = AdjustmentData.FirstOrDefault(p => p.FyCd == year.ToString() && p.PdNo == month);

                            var dateTime = new DateOnly(year, month, DateTime.DaysInMonth(year, month));
                            allPds.Add(new ProjRevWrkPd() { Pl_Id = pl_id, Period = month, Fy_Cd = year, EndDate = dateTime, RevDesc = projectRevenueAdjustment.RevAdjDesc ?? string.Empty, RevAdj = projectRevenueAdjustment.RevAdjAmt ?? 0, RevAmt = revData, ProjId = projId, VersionNo = versionNo, BgtType = bgtType });
                        }


                        _context.ProjRevWrkPds.AddRange(allPds);
                        _context.SaveChanges();
                        allPds = query.ToList();
                    }
                }

            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error in GetByFilterAsync (ProjId, VersionNo, BgtType)");
                throw;
            }
        }


        public void GetRevenueDataForUnit(int pl_id, string projId, int? versionNo = null, string bgtType = null)
        {
            ProjectRevenueAdjustment projectRevenueAdjustment = new ProjectRevenueAdjustment();
            try
            {
                var query = _context.ProjRevWrkPds.AsQueryable();

                if (!string.IsNullOrEmpty(projId))
                    query = query.Where(p => p.ProjId == projId);

                query = query.Where(p => p.Pl_Id == pl_id);

                var allPds = query.ToList();

                foreach (var pd in allPds)
                {
                    pd.Fy_Cd = pd.EndDate.GetValueOrDefault().Year;
                }

                if (allPds.Count() == 0)
                {
                    var project = _context.PlProjects.FirstOrDefault(p => p.ProjId == projId);

                    if (project != null)
                    {
                        //var psrData = _context.PSRFinalData.Where(p => p.ProjId.StartsWith(projId) && p.SubTotTypeNo == 1 && p.RateType == "A").ToList();

                        var psrData = _context.ProjBillHs.Where(p => p.ProjId == projId).ToList();


                        ScheduleHelper helper = new ScheduleHelper();
                        var months = helper.GetMonthsBetween(project.ProjStartDt.GetValueOrDefault(), project.ProjEndDt.GetValueOrDefault());

                        var AdjustmentData = _context.Set<ProjectRevenueAdjustment>()
                                    .AsNoTracking()
                                    .Where(x => x.ProjId.StartsWith(projId))
                                    .ToList();

                        foreach (var (year, month) in months)
                        {
                            projectRevenueAdjustment = new ProjectRevenueAdjustment();
                            decimal revData = 0;
                            if (psrData.FirstOrDefault(p => p.FyCd == year.ToString() && p.PdNo == month) != null)
                                revData = psrData.FirstOrDefault(p => p.FyCd == year.ToString() && p.PdNo == month).BilledAmt;

                            var dateTime = new DateOnly(year, month, DateTime.DaysInMonth(year, month));
                            allPds.Add(new ProjRevWrkPd() { Pl_Id = pl_id, Period = month, Fy_Cd = year, EndDate = dateTime, RevDesc = projectRevenueAdjustment.RevAdjDesc ?? string.Empty, RevAdj = projectRevenueAdjustment.RevAdjAmt ?? 0, RevAmt = revData, ProjId = projId, VersionNo = versionNo, BgtType = bgtType });
                        }


                        _context.ProjRevWrkPds.AddRange(allPds);
                        _context.SaveChanges();
                        allPds = query.ToList();
                    }
                }

            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error in GetByFilterAsync (ProjId, VersionNo, BgtType)");
                throw;
            }
        }

        public StatusResponse CanWeCreateBudget(string projId)
        {
            List<int> revenueLevels = new List<int>();
            var response = new StatusResponse
            {
                IsSuccess = false,
                Message = "Budget cannot be created."
            };

            try
            {
                if (projId.ToUpper().Contains("FRNGE") || projId.ToUpper().Contains("MS") || projId.ToUpper().Contains("MANDH") || projId.ToUpper().Contains("OVRHD") || projId.ToUpper().Contains("GANDA") || projId.ToUpper().Contains("HRPAY") || projId.ToUpper().Contains("GRANT") || projId.ToUpper().Contains("HRPAY") || projId.ToUpper().Contains("SMEHP") || projId.ToUpper().Contains("FACIT"))
                {
                    return new StatusResponse
                    {
                        IsSuccess = true,
                        Message = "Budget cannot be created."
                    };
                }

                var parts = projId.Split('.', StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length < 2)
                {
                    revenueLevels = _context.ProjRevDefinitions
                    .Where(p => p.ProjectId != null && p.ProjectId.StartsWith(parts[0]))
                    .Select(z =>
                        z.ProjectId.Length
                        - z.ProjectId.Replace(".", "").Length
                        + 1
                    )
                    .Distinct()
                    .ToList();
                }
                else
                {
                    var prefixes = Enumerable
                        .Range(1, parts.Length - 1)
                        .Select(i => string.Join('.', parts.Take(i)))
                        .ToList();

                    revenueLevels = _context.ProjRevDefinitions
                    .Where(p => p.ProjectId != null && p.ProjectId.StartsWith(prefixes[0]))
                    .Select(z =>
                        z.ProjectId.Length
                        - z.ProjectId.Replace(".", "").Length
                        + 1
                    )
                    .Distinct()
                    .ToList();
                }
                if (revenueLevels.Any())
                {
                    int projLevel = projId.Length - projId.Replace(".", "").Length + 1;

                    if (projLevel >= revenueLevels.Min())
                    {
                        response.IsSuccess = true;
                        response.Message = "Budget can be created.";
                    }
                    else
                    {
                        response.Message = "Revenue is configured at Level  '" + revenueLevels.Min() + "' .The budget must be created at the same or a lower project level.";
                    }
                }
                else
                {
                    response.Message = "No revenue definition found for the project.";
                }
            }
            catch (Exception ex)
            {
                // _logger.LogError(ex, "Error in CanWeCreateBudget for ProjId: {ProjId}", projId);
                response.IsSuccess = false;
                response.Message = "An error occurred while validating budget creation.";
            }

            return response;
        }


        //public bool canWeCreateBudget(string projId)
        //{
        //    bool canCreate = false;
        //    try
        //    {
        //        var parts = projId.Split('.', StringSplitOptions.RemoveEmptyEntries);
        //        var prefixes = Enumerable
        //            .Range(1, parts.Length - 1)
        //            .Select(i => string.Join('.', parts.Take(i)))
        //            .ToList();

        //        var revenuelevel = _context.ProjRevDefinitions
        //                .Where(p => p.ProjectId != null && p.ProjectId.StartsWith(prefixes[0]))
        //                .Select(z =>
        //                    z.ProjectId.Length
        //                    - z.ProjectId.Replace(".", "").Length
        //                    + 1
        //                )
        //                .Distinct()
        //                .ToList();

        //        if (revenuelevel.Count() > 0)
        //        {
        //            int projLevel = projId.Length - projId.Replace(".", "").Length + 1;
        //            if (projLevel >= revenuelevel.Min())
        //            {
        //                canCreate = true;
        //            }
        //        }

        //    }
        //    catch (Exception ex)
        //    {
        //        //_logger.LogError(ex, "Error in isBudgetIsCreatedOnLowerLevel for ProjId: {ProjId}", projId);
        //        canCreate = false;
        //    }
        //    return canCreate;
        //}
        public bool isBudgetIsCreatedOnLowerLevel(string projId, int pl_id)
        {
            try
            {
                var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

                DateTime currentMonth;

                if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
                {
                    // currentMonth is now safely parsed
                }
                else
                {
                    // Handle the missing or invalid value here
                    throw new Exception("Invalid or missing 'closing_period' configuration.");
                }
                List<string> prefixes = new List<string>();

                var parts = projId.Split('.', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 1)
                {
                    prefixes = parts.ToList();
                }
                else
                {
                    prefixes = Enumerable
                        .Range(1, parts.Length - 1)
                        .Select(i => string.Join('.', parts.Take(i)))
                        .ToList();
                }
                var revenuelevel = _context.ProjRevDefinitions
                        .Where(p => p.ProjectId != null && p.ProjectId.StartsWith(prefixes[0]))
                        .Select(z =>
                            z.ProjectId.Length
                            - z.ProjectId.Replace(".", "").Length
                            + 1
                        )
                        .Distinct()
                        .ToList();
                List<MonthlyFeeSummary> monthlyFeeSummaries = new List<MonthlyFeeSummary>();
                if (revenuelevel.Count() > 0)
                {
                    int projLevel = projId.Length - projId.Replace(".", "").Length + 1;
                    if (projLevel > revenuelevel.Min())
                    {

                        var actualMonthlySummary = _context.PSRFinalData
                                .Where(p => p.ProjId.StartsWith(prefixes[revenuelevel.Min() - 1]) && (p.RateType == "T" || p.RateType == "N"))
                                .GroupBy(p => new { p.PdNo, p.FyCd, p.SubTotTypeNo, p.ProjId })
                                .Select(g => new MonthlySummary
                                {
                                    Proj_Id = g.Key.ProjId,
                                    Month = g.Key.PdNo,
                                    Year = Convert.ToInt16(g.Key.FyCd),
                                    Cost = g.Sum(x => x.PtdIncurAmt),
                                    subTotalType = g.Key.SubTotTypeNo
                                })
                                .ToList();

                        foreach (var pSummary in actualMonthlySummary.Where(p => p.subTotalType == 1))
                        {
                            MonthlyFeeSummary monthlyFeeSummary = new MonthlyFeeSummary();

                            DateTime forecastDay = new DateTime(pSummary.Year, pSummary.Month, DateTime.DaysInMonth(pSummary.Year, pSummary.Month));
                            monthlyFeeSummary.Month = pSummary.Month;
                            monthlyFeeSummary.Year = pSummary.Year;
                            if (forecastDay <= currentMonth)
                            {
                                monthlyFeeSummary.TargetCost = actualMonthlySummary.Where(p => p.subTotalType == 2 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.subTotalType == 3 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.subTotalType == 4 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost);
                                monthlyFeeSummary.TargetRevenue = actualMonthlySummary.Where(p => p.subTotalType == 1 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost);
                                //var totalCost = actualMonthlySummary.Where(p => p.Proj_Id.StartsWith(projId) && p.subTotalType == 2 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.Proj_Id.StartsWith(projId) && p.subTotalType == 3 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.Proj_Id.StartsWith(projId) && p.subTotalType == 4 && p.Month == pSummary.Month && p.Year == pSummary.Year).Sum(p => p.Cost);
                                var totalCost = actualMonthlySummary
                                      .Where(p =>
                                          !string.IsNullOrEmpty(p.Proj_Id) &&
                                          p.Proj_Id.StartsWith(projId) &&
                                          (p.subTotalType == 2 || p.subTotalType == 3 || p.subTotalType == 4) &&
                                          p.Month == pSummary.Month &&
                                          p.Year == pSummary.Year)
                                      .Sum(p => p.Cost);

                                monthlyFeeSummary.TargetFeeOnCost = (monthlyFeeSummary.TargetCost != 0) ? ((monthlyFeeSummary.TargetRevenue - monthlyFeeSummary.TargetCost) * 100 / monthlyFeeSummary.TargetCost) : 0;
                                monthlyFeeSummary.CalculatedTargetFee = Math.Round((totalCost * monthlyFeeSummary.TargetFeeOnCost / 100m), 6, MidpointRounding.AwayFromZero);
                                //monthlyFeeSummary.TargetFeeOnRevenue = (monthlyFeeSummary.TargetRevenue != 0) ? ((monthlyFeeSummary.TargetRevenue - monthlyFeeSummary.TargetCost)*100 / monthlyFeeSummary.TargetRevenue) : 0;
                            }
                            monthlyFeeSummaries.Add(monthlyFeeSummary);
                        }

                        actualMonthlySummary = _context.PSRFinalData
                                .Where(p => p.ProjId.StartsWith(prefixes[revenuelevel.Min() - 1]) && (p.RateType == "A" || p.RateType == "N"))
                                .GroupBy(p => new { p.PdNo, p.FyCd, p.SubTotTypeNo, p.ProjId })
                                .Select(g => new MonthlySummary
                                {
                                    Proj_Id = g.Key.ProjId,
                                    Month = g.Key.PdNo,
                                    Year = Convert.ToInt16(g.Key.FyCd),
                                    Cost = g.Sum(x => x.PtdIncurAmt),
                                    subTotalType = g.Key.SubTotTypeNo
                                    //Cost = (g.Key.SubTotTypeNo == 2 || g.Key.SubTotTypeNo == 3) ? g.Sum(x => x.PtdIncurAmt) : 0m
                                })
                                .ToList();
                        List<ProjRevWrkPd> allPds = new List<ProjRevWrkPd>();
                        foreach (var feeSummary in monthlyFeeSummaries)
                        {
                            DateTime forecastDay = new DateTime(feeSummary.Year, feeSummary.Month, DateTime.DaysInMonth(feeSummary.Year, feeSummary.Month));
                            var dateTime = new DateOnly(feeSummary.Year, feeSummary.Month, DateTime.DaysInMonth(feeSummary.Year, feeSummary.Month));

                            if (forecastDay <= currentMonth)
                            {
                                feeSummary.ActualCost = actualMonthlySummary.Where(p => p.subTotalType == 2 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.subTotalType == 3 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.subTotalType == 4 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost);
                                feeSummary.ActualRevenue = actualMonthlySummary.Where(p => p.subTotalType == 1 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost);
                                //var totalCost = actualMonthlySummary.Where(p => p.Proj_Id.StartsWith(projId) && p.subTotalType == 2 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.Proj_Id.StartsWith(projId) && p.subTotalType == 3 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost) + actualMonthlySummary.Where(p => p.Proj_Id.StartsWith(projId) && p.subTotalType == 4 && p.Month == feeSummary.Month && p.Year == feeSummary.Year).Sum(p => p.Cost); 
                                var totalCost = actualMonthlySummary
                                    .Where(p =>
                                        !string.IsNullOrEmpty(p.Proj_Id) &&
                                        p.Proj_Id.StartsWith(projId) &&
                                        (p.subTotalType == 2 || p.subTotalType == 3 || p.subTotalType == 4) &&
                                        p.Month == feeSummary.Month &&
                                        p.Year == feeSummary.Year)
                                    .Sum(p => p.Cost);


                                feeSummary.ActualFeeOnCost = (feeSummary.ActualCost != 0) ? ((feeSummary.ActualRevenue - feeSummary.ActualCost) * 100 / feeSummary.ActualCost) : 0;
                                //feeSummary.CalculatedActualFee = (feeSummary.ActualCost * feeSummary.ActualFeeOnCost / 100);
                                feeSummary.CalculatedActualFee = Math.Round(totalCost * feeSummary.ActualFeeOnCost / 100m, 6, MidpointRounding.AwayFromZero);
                            }
                            allPds.Add(new ProjRevWrkPd() { Pl_Id = pl_id, Period = feeSummary.Month, Fy_Cd = feeSummary.Year, EndDate = dateTime, RevDesc = "Adjustment for Revenue" ?? string.Empty, RevAdj = 0, RevAmt = feeSummary.ActualRevenue, ProjId = projId, VersionNo = 0, BgtType = "", ActualFeeRateOnCost = feeSummary.ActualFeeOnCost, ActualFeeAmountOnCost = feeSummary.CalculatedActualFee, TargetFeeAmountOnCost = feeSummary.CalculatedTargetFee, TargetFeeRateOnCost = feeSummary.TargetFeeOnCost });
                        }

                        var query = _context.ProjRevWrkPds.AsQueryable();

                        if (!string.IsNullOrEmpty(projId))
                            query = query.Where(p => p.ProjId == projId);

                        query = query.Where(p => p.Pl_Id == pl_id);

                        var ExistingPds = query.ToList();

                        if (ExistingPds.Count() == 0)
                        {
                            _context.ProjRevWrkPds.AddRange(allPds);
                            _context.SaveChanges();
                        }
                        else
                        {

                            foreach (var pd in allPds)
                            {
                                var existingPd = ExistingPds.FirstOrDefault(p => p.EndDate == pd.EndDate && p.Period == pd.Period);
                                if (existingPd != null)
                                {
                                    existingPd.ActualFeeAmountOnCost = pd.ActualFeeAmountOnCost;
                                    existingPd.ActualFeeRateOnCost = pd.ActualFeeRateOnCost;
                                    existingPd.TargetFeeAmountOnCost = pd.TargetFeeAmountOnCost;
                                    existingPd.TargetFeeRateOnCost = pd.TargetFeeRateOnCost;
                                }
                                else
                                {
                                    _context.ProjRevWrkPds.Add(pd);
                                }
                            }
                        }
                        _context.SaveChanges();
                        return true;
                    }
                }

                return false;
            }
            catch (Exception ex)
            {
                //_logger.LogError(ex, "Error in isBudgetIsCreatedOnLowerLevel for ProjId: {ProjId}", projId);
                throw;
            }
        }

        internal async Task<PlProjectPlan> GetForecastActulData(PlProjectPlan newPlan, string type)
        {
            string Proj_Id = string.Empty;

            if (newPlan.CopyFromExistingProject)
            {
                Proj_Id = newPlan.SourceProjId;
            }
            else
            {
                Proj_Id = newPlan.ProjId;
            }
            List<PlTemplatePoolRate> burdensByTemplate = new List<PlTemplatePoolRate>();
            string revenueFormula = string.Empty;
            var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            var project = _context.PlProjects.FirstOrDefault(p => p.ProjId == newPlan.ProjId);
            var grpCode = project?.AcctGrpCd;
            var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();
            var chartOfAccounts = _context.Charts_Of_Accounts.ToList();
            NonLaborAccounts = (from ags in _context.AccountGroupSetup
                                join a in _context.Accounts
                                    on ags.AccountId equals a.AcctId
                                where ags.AcctGroupCode == grpCode
                                   && validDescriptions.Contains(ags.AccountFunctionDescription.ToUpper())
                                select new AccountGroupSetupDTO
                                {
                                    AccountId = ags.AccountId,
                                    AccountFunctionDescription = ags.AccountFunctionDescription,
                                    AcctName = a.AcctName
                                }).ToList();


            ScheduleHelper scheduleHelper = new ScheduleHelper();
            var months = scheduleHelper.GetMonthsBetween(newPlan.ProjStartDt.GetValueOrDefault(), newPlan.ProjEndDt.GetValueOrDefault());
            List<PlDct> plDirectCostList = new List<PlDct>();
            List<PlEmployeee> plEmployeeCostList = new List<PlEmployeee>();

            var acctPool = _context.PlOrgAcctPoolMappings.Where(p => p.OrgId == project.OrgId).ToList();

            burdensByTemplate = _context.PlTemplatePoolRates.Where(r => r.TemplateId == newPlan.TemplateId.GetValueOrDefault()).ToList();

            Account_Org_Helpercs account_Org_Helpercs = new Account_Org_Helpercs(_context);
            var templatePools = account_Org_Helpercs.GetPoolsByTemplateId(newPlan.TemplateId.GetValueOrDefault()).Select(p => p.PoolId).ToList();

            FinanceHelper financeHelper = new FinanceHelper(_context, newPlan.ProjId);

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");
            var HistoryData = _context.LabHours.Where(p => p.ProjId.StartsWith(Proj_Id)).Select(p => new
            {
                p.ProjId,
                p.EmplId,
                p.VendEmplId,
                p.VendId,
                p.AcctId,
                p.OrgId,
                p.PdNo,
                FyCd = Convert.ToInt16(p.FyCd),
                p.BillLabCatCd,
                ActHrs = p.ActHrs.GetValueOrDefault(),
                p.ActAmt,
                p.EffectBillDt

            }).ToList();



            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }
            string sql = string.Empty;
            newPlan.PlId = null;
            var entry = _context.PlProjectPlans.Add(newPlan);
            _context.SaveChanges();
            List<string> prefixes = new List<string>();
            var parts = newPlan.ProjId.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
            {
                prefixes = parts.ToList();
            }
            else
            {

                prefixes = Enumerable
                .Range(1, parts.Length)
                .Select(i => string.Join('.', parts.Take(i)))
                .ToList();

            }


            var bgtRevDetails = GetRevenuDefinitionFromCP(entry.Entity);
            if (bgtRevDetails != null)
            {
                _context.ProjBgtRevSetups.Add(bgtRevDetails);
                await _context.SaveChangesAsync();

            }

            if (revenueFormula == "UNIT")
                GetRevenueDataForUnit(entry.Entity.PlId.GetValueOrDefault(), newPlan.ProjId, newPlan.Version, newPlan.PlType);
            else
                GetAdjustmentData(entry.Entity.PlId.GetValueOrDefault(), newPlan.ProjId, newPlan.Version, newPlan.PlType);

            var laborAccountIds = NonLaborAccounts
                                .Where(p => p.AccountFunctionDescription == "LABOR")
                                .Select(p => p.AccountId)
                                .ToList(); // Evaluated in memory
            string escallation_month = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_month" && r.ProjId == newPlan.ProjId)?.Value ?? _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_month" && r.ProjId == "xxxxx")?.Value ?? "3";
            string escallation_percent = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_percent" && r.ProjId == newPlan.ProjId)?.Value ?? _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_percent" && r.ProjId == "xxxxx")?.Value ?? "3";


            var HistoryLabHSData = _context.LabHours.Where(p => p.ProjId.StartsWith(Proj_Id)).Select(p => new
            {
                p.ProjId,
                p.EmplId,
                p.VendEmplId,
                p.VendId,
                p.AcctId,
                p.OrgId,
                p.PdNo,
                FyCd = Convert.ToInt16(p.FyCd),
                p.BillLabCatCd,
                ActHrs = p.ActHrs.GetValueOrDefault(),
                p.ActAmt,
                p.EffectBillDt

            }).ToList();

            var hoursData = _context.LabHours
                .Where(lh => lh.ProjId.StartsWith(Proj_Id)
                             && lh.EmplId != null
                             && laborAccountIds.Contains(lh.AcctId)) // Safe now
                .Select(lh => new PlEmployeee
                {
                    Type = "Employee",
                    EmplId = lh.EmplId,
                    OrgId = lh.OrgId,
                    AccId = lh.AcctId,
                    PlId = entry.Entity.PlId,
                    IsBrd = true,
                    IsRev = true,
                    PlcGlcCode = lh.BillLabCatCd
                })
                .Distinct()
                .OrderBy(lh => lh.EmplId)
                .ToList();
            if (hoursData.Count() > 0)
            {

                var employeees = hoursData.Select(p => p.EmplId).ToArray();

                var quoted = string.Join(",", employeees.Select(id => $"'{id}'"));

                sql = $@"
                        SELECT empl.empl_id AS EmplId, 
                               s_empl_status_cd AS Status, 
                               last_first_name AS FirstName, 
                               sal_amt AS Salary,
                               effect_dt AS EffectiveDate,
                               hrly_amt AS PerHourRate
                        FROM empl
                        JOIN public.empl_lab_info 
                            ON empl.empl_id = public.empl_lab_info.empl_id
                        WHERE empl.empl_id IN ({quoted}) 
                          AND public.empl_lab_info.end_dt = '2078-12-31';
";

                var employeeDetails = _context.Empl_Master
                    .FromSqlRaw(sql)
                    .ToList();

                foreach (var emp in hoursData)
                {
                    try
                    {
                        emp.FirstName = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.FirstName;
                        emp.PerHourRate = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).PerHourRate;
                        emp.Status = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).Status;
                        emp.Salary = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).Salary;
                        emp.EffectiveDate = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).EffectiveDate;
                        emp.Esc_Percent = Convert.ToDecimal(escallation_percent);

                        List<PlForecast> plForecasts = new List<PlForecast>();
                        foreach (var (year, month) in months)
                        {
                            PlForecast plForecast = new PlForecast();
                            plForecast.Year = year;
                            plForecast.Month = month;
                            plForecast.ProjId = newPlan.ProjId;
                            plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                            plForecast.Forecastedamt = 0;
                            plForecast.AcctId = emp.AccId;
                            plForecast.OrgId = emp.OrgId;
                            plForecast.Plc = emp.PlcGlcCode;
                            plForecast.EmplId = emp.EmplId;
                            plForecast.HrlyRate = emp.PerHourRate;
                            plForecast.PlId = entry.Entity.PlId.GetValueOrDefault();

                            DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                            //if (forecastDay <= currentMonth)
                            {
                                var actualData = HistoryData
                                         .Where(p => p.PdNo == plForecast.Month &&
                                                    p.FyCd == plForecast.Year &&
                                                    p.EmplId == plForecast.EmplId &&
                                                    p.AcctId == plForecast.AcctId &&
                                                    p.OrgId == plForecast.OrgId &&
                                                    p.BillLabCatCd == plForecast.Plc);

                                if (actualData.Count() > 0)
                                {
                                    plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                    if (newPlan.PlType.ToUpper() != "EAC")
                                    {
                                        plForecast.Forecastedhours = actualData.Sum(p => p.ActHrs);
                                        plForecast.ForecastedCost = actualData.Sum(p => p.ActAmt);

                                    }
                                    else
                                    {
                                        plForecast.Forecastedhours = plForecast.Forecastedhours;
                                        plForecast.Actualhours = actualData.Sum(p => p.ActHrs);
                                        plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                    }
                                    var totals = actualData
                                        .GroupBy(_ => 1)
                                        .Select(g => new
                                        {
                                            Hrs = g.Sum(x => x.ActHrs),
                                            Amt = g.Sum(x => x.ActAmt) ?? 0
                                        })
                                        .FirstOrDefault();
                                    plForecast.HrlyRate = totals.Hrs == 0 ? 0 : totals.Amt / totals.Hrs;

                                    //plForecast.HrlyRate = actualData.Sum(p => p.ActAmt).GetValueOrDefault() / actualData.Sum(p => p.ActHrs);
                                    //emp.PerHourRate = plForecast.HrlyRate;

                                    plForecast.EffectDt = DateOnly.FromDateTime(actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault()); //actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();

                                }
                            }
                            plForecasts.Add(plForecast);
                        }
                        emp.PlForecasts = plForecasts;
                        plEmployeeCostList.Add(emp);
                    }
                    catch (Exception ex)
                    {
                        // Handle exception (e.g., log the error)
                    }
                }


            }
            //////////////////////////Fetch Vendor's Actual Data

            var VenderhoursData = _context.LabHours
                    .Where(lh => lh.ProjId.StartsWith(Proj_Id) && lh.VendEmplId != null && laborAccountIds.Contains(lh.AcctId))
                    .Select(lh => new PlEmployeee
                    {
                        Type = "Vendor Employee",
                        EmplId = lh.VendEmplId,
                        OrgId = lh.OrgId,
                        AccId = lh.AcctId,
                        PlId = entry.Entity.PlId,
                        IsBrd = true,
                        IsRev = true,
                        PlcGlcCode = lh.BillLabCatCd
                    })
                    .Distinct()
                    .OrderBy(lh => lh.EmplId)
                    .ToList();

            sql = $@"
                        SELECT ve.vend_empl_id as EmpId, ve.vend_empl_name as EmployeeName, ve.df_bill_lab_cat_cd as Plc, ve.vend_id as VendId,
                            NULL::varchar AS ""OrgId"",
                            NULL::varchar AS ""OrgName"",
                            NULL::varchar AS ""AcctId"",
                            NULL::varchar AS ""AcctName""
                        FROM vendor_employee ve;
                    ";

            var VendorEmployeeDetails = _context.VendorEmployeeDTOs
                    .FromSqlRaw(sql)
                    .ToList();

            foreach (var vendEmpl in VenderhoursData)
            {
                try
                {

                    vendEmpl.FirstName = VendorEmployeeDetails.FirstOrDefault(p => p.EmpId == vendEmpl.EmplId)?.EmployeeName;

                    List<PlForecast> plForecasts = new List<PlForecast>();
                    foreach (var (year, month) in months)
                    {
                        if ((year == 2025 && month == 1) || (year == 2020 && month == 5) && vendEmpl.EmplId == "G00205")
                        {

                        }
                        PlForecast plForecast = new PlForecast();
                        plForecast.Year = year;
                        plForecast.Month = month;
                        plForecast.ProjId = newPlan.ProjId;
                        plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                        plForecast.Forecastedamt = 0;
                        plForecast.AcctId = vendEmpl.AccId;
                        plForecast.OrgId = vendEmpl.OrgId;
                        plForecast.Plc = vendEmpl.PlcGlcCode;
                        plForecast.EmplId = vendEmpl.EmplId;
                        plForecast.HrlyRate = vendEmpl.PerHourRate;
                        plForecast.PlId = newPlan.PlId.GetValueOrDefault();

                        DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                        //if (forecastDay <= currentMonth)
                        {
                            var actualData = HistoryData
                                            .Where(p => p.PdNo == plForecast.Month &&
                                                  p.FyCd == plForecast.Year &&
                                                  p.VendEmplId == plForecast.EmplId &&
                                                  p.AcctId == plForecast.AcctId &&
                                                  p.OrgId == plForecast.OrgId &&
                                                  p.BillLabCatCd == plForecast.Plc);

                            if (actualData.Count() > 0)
                            {
                                var totals = actualData
                                            .GroupBy(_ => 1)
                                            .Select(g => new
                                            {
                                                Hrs = g.Sum(x => x.ActHrs),
                                                Amt = g.Sum(x => x.ActAmt) ?? 0
                                            })
                                            .FirstOrDefault();

                                plForecast.HrlyRate = totals.Hrs == 0 ? 0 : totals.Amt / totals.Hrs;

                                //plForecast.HrlyRate = actualData.Sum(p => p.ActAmt).GetValueOrDefault() / actualData.Sum(p => p.ActHrs);
                                vendEmpl.PerHourRate = plForecast.HrlyRate;
                                plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                if (newPlan.PlType.ToUpper() != "EAC")
                                {
                                    plForecast.Forecastedhours = actualData.Sum(p => p.ActHrs);
                                    plForecast.ForecastedCost = plForecast.Cost;
                                }
                                else
                                {

                                    plForecast.Forecastedhours = actualData.Sum(p => p.ActHrs);
                                    plForecast.Actualhours = actualData.Sum(p => p.ActHrs);
                                    plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                }
                                vendEmpl.PerHourRate = plForecast.HrlyRate;
                                plForecast.EffectDt = plForecast.EffectDt = DateOnly.FromDateTime(actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault()); //actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();
                            }
                        }
                        plForecasts.Add(plForecast);
                    }
                    vendEmpl.PlForecasts = plForecasts;
                    plEmployeeCostList.Add(vendEmpl);
                }
                catch (Exception ex)
                {
                    // Handle exception (e.g., log the error)
                }
            }
            /////////////////////////////////////////////////////////
            ///


            var NonlaborAccountIds = NonLaborAccounts
                .Where(p => p.AccountFunctionDescription == "NON-LABOR")
                .Select(p => p.AccountId)
                .ToList(); // Evaluated in memory
            var result = _context.PlFinancialTransactions
                                    .Where(p =>
                                        p.ProjId.StartsWith(Proj_Id) && p.SJnlCd != "LD" &&
                                        (NonlaborAccountIds.Contains(p.AcctId) || laborAccountIds.Contains(p.AcctId)) &&
                                        !string.IsNullOrEmpty(p.Id))
                                    .GroupBy(p => new
                                    {
                                        p.SIdType,
                                        //p.Name,
                                        p.OrgId,
                                        p.AcctId,
                                        p.BillLabCatCd,
                                        p.Id,
                                        PlId = entry.Entity.PlId.GetValueOrDefault()// cast id to text
                                    })
                                    .Select(g => new PlDct
                                    {
                                        AmountType = g.Key.SIdType,
                                        Type = g.Key.SIdType == "E" ? "Employee" : "Vendor Employee",
                                        OrgId = g.Key.OrgId,
                                        AcctId = g.Key.AcctId,
                                        PlcGlc = g.Key.BillLabCatCd,
                                        IsBrd = true,
                                        IsRev = true,
                                        Id = g.Key.Id.ToString(),
                                        PlId = entry.Entity.PlId.GetValueOrDefault()
                                    }).Distinct()
                                    .ToList();



            var HistoryData1 = _context.PlFinancialTransactions
            .Where(p => p.ProjId.StartsWith(Proj_Id) && !string.IsNullOrEmpty(p.Id) && p.SJnlCd != "LD")
            .Select(p => new
            {
                p.ProjId,
                Id = p.Id == null ? null : p.Id.ToString(),
                p.AcctId,
                p.OrgId,
                p.PdNo,
                p.FyCd,
                p.BillLabCatCd,
                p.Hrs1,
                p.Amt1,
                p.EffectBillDt,
                p.Name,
                p.SIdType
            })
            .ToList();

            foreach (var dct in result)
            {
                try
                {
                    List<PlForecast> plForecasts = new List<PlForecast>();
                    foreach (var (year, month) in months)
                    {
                        PlForecast plForecast = new PlForecast();
                        plForecast.Year = year;
                        plForecast.Month = month;
                        plForecast.ProjId = newPlan.ProjId;
                        plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                        plForecast.Forecastedamt = 0;
                        plForecast.AcctId = dct.AcctId;
                        plForecast.OrgId = dct.OrgId;
                        plForecast.EmplId = dct.Id;
                        plForecast.Plc = dct.PlcGlc;
                        plForecast.DirectCost = new PlDct() { Id = dct.Id };
                        plForecast.PlId = entry.Entity.PlId.GetValueOrDefault();
                        DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                        //if (forecastDay <= currentMonth)
                        {

                            var actualData = HistoryData1
                                            .Where(p => p.PdNo == plForecast.Month &&
                                                  p.FyCd == plForecast.Year.ToString() &&
                                                  p.Id == plForecast.EmplId &&
                                                  p.AcctId == plForecast.AcctId &&
                                                  p.BillLabCatCd == plForecast.Plc &&
                                                  p.OrgId == plForecast.OrgId);

                            if (actualData.Count() > 0)
                            {
                                if (string.IsNullOrEmpty(dct.Category))
                                    dct.Category = actualData.FirstOrDefault().Name;
                                plForecast.Actualamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                                plForecast.Forecastedamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                                plForecast.Cost = plForecast.Actualamt.GetValueOrDefault();
                                plForecast.EffectDt = actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault(); //actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();

                            }

                        }
                        plForecasts.Add(plForecast);
                    }
                    dct.PlForecasts = plForecasts;
                    plDirectCostList.Add(dct);
                }
                catch (Exception ex)
                {
                    // Log the exception or handle it as needed
                    Console.WriteLine($"Error processing DCT Id {dct.Id}: {ex.Message}");
                }
            }

            _context.PlEmployeees.AddRange(hoursData);
            _context.PlEmployeees.AddRange(VenderhoursData);

            _context.PlDcts.AddRange(plDirectCostList);
            try
            {
                _context.SaveChanges();

                if (revenueFormula.ToUpper().Equals("CPFC"))
                {
                    isBudgetIsCreatedOnLowerLevel(newPlan.ProjId, entry.Entity.PlId.GetValueOrDefault());
                }
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }

            return entry.Entity;

        }




        internal async Task<PlProjectPlan> GetForecastActulData_indirect(PlProjectPlan newPlan, string type)
        {
            string Proj_Id = string.Empty;

            if (newPlan.CopyFromExistingProject)
            {
                Proj_Id = newPlan.SourceProjId;
            }
            else
            {
                Proj_Id = newPlan.ProjId;
            }
            List<PlTemplatePoolRate> burdensByTemplate = new List<PlTemplatePoolRate>();
            string revenueFormula = string.Empty;
            var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            var project = _context.PlProjects.FirstOrDefault(p => p.ProjId == newPlan.ProjId);
            DateTime? startDateTime = null;
            if (project != null)
            {
                startDateTime = DateTime.SpecifyKind(
                             newPlan.ProjStartDt.Value.ToDateTime(TimeOnly.MinValue),
                             DateTimeKind.Utc);
            }
            var grpCode = project?.AcctGrpCd;
            var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();
            var chartOfAccounts = _context.Charts_Of_Accounts.ToList();
            NonLaborAccounts = (from ags in _context.AccountGroupSetup
                                join a in _context.Accounts
                                    on ags.AccountId equals a.AcctId
                                where ags.AcctGroupCode == grpCode
                                   && validDescriptions.Contains(ags.AccountFunctionDescription.ToUpper())
                                select new AccountGroupSetupDTO
                                {
                                    AccountId = ags.AccountId,
                                    AccountFunctionDescription = ags.AccountFunctionDescription,
                                    AcctName = a.AcctName
                                }).ToList();


            ScheduleHelper scheduleHelper = new ScheduleHelper();
            var months = scheduleHelper.GetMonthsBetween(newPlan.ProjStartDt.GetValueOrDefault(), newPlan.ProjEndDt.GetValueOrDefault());
            List<PlDct> plDirectCostList = new List<PlDct>();
            List<PlEmployeee> plEmployeeCostList = new List<PlEmployeee>();

            var acctPool = _context.PlOrgAcctPoolMappings.Where(p => p.OrgId == project.OrgId).ToList();

            burdensByTemplate = _context.PlTemplatePoolRates.Where(r => r.TemplateId == newPlan.TemplateId.GetValueOrDefault()).ToList();

            Account_Org_Helpercs account_Org_Helpercs = new Account_Org_Helpercs(_context);
            var templatePools = account_Org_Helpercs.GetPoolsByTemplateId(newPlan.TemplateId.GetValueOrDefault()).Select(p => p.PoolId).ToList();

            FinanceHelper financeHelper = new FinanceHelper(_context, newPlan.ProjId);

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");
            var HistoryData = _context.LabHours.Where(p => p.ProjId.StartsWith(Proj_Id) && startDateTime <= p.TimeStamp).Select(p => new
            {
                p.ProjId,
                p.EmplId,
                p.VendEmplId,
                p.VendId,
                p.AcctId,
                p.OrgId,
                p.PdNo,
                FyCd = Convert.ToInt16(p.FyCd),
                p.BillLabCatCd,
                ActHrs = p.ActHrs.GetValueOrDefault(),
                p.ActAmt,
                p.EffectBillDt

            }).ToList();



            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }
            string sql = string.Empty;
            newPlan.PlId = null;
            var entry = _context.PlProjectPlans.Add(newPlan);
            _context.SaveChanges();
            List<string> prefixes = new List<string>();
            var parts = newPlan.ProjId.Split('.', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
            {
                prefixes = parts.ToList();
            }
            else
            {

                prefixes = Enumerable
                .Range(1, parts.Length)
                .Select(i => string.Join('.', parts.Take(i)))
                .ToList();

            }


            var bgtRevDetails = GetRevenuDefinitionFromCP(entry.Entity);
            if (bgtRevDetails != null)
            {
                _context.ProjBgtRevSetups.Add(bgtRevDetails);
                await _context.SaveChangesAsync();

            }

            if (revenueFormula == "UNIT")
                GetRevenueDataForUnit(entry.Entity.PlId.GetValueOrDefault(), newPlan.ProjId, newPlan.Version, newPlan.PlType);
            else
                GetAdjustmentData(entry.Entity.PlId.GetValueOrDefault(), newPlan.ProjId, newPlan.Version, newPlan.PlType);

            var laborAccountIds = NonLaborAccounts
                                .Where(p => p.AccountFunctionDescription == "LABOR")
                                .Select(p => p.AccountId)
                                .ToList(); // Evaluated in memory
            string escallation_month = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_month" && r.ProjId == newPlan.ProjId)?.Value ?? _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_month" && r.ProjId == "xxxxx")?.Value ?? "3";
            string escallation_percent = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_percent" && r.ProjId == newPlan.ProjId)?.Value ?? _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "escallation_percent" && r.ProjId == "xxxxx")?.Value ?? "3";


            var HistoryLabHSData = _context.LabHours.Where(p => p.ProjId.StartsWith(Proj_Id) && startDateTime <= p.TimeStamp).Select(p => new
            {
                p.ProjId,
                p.EmplId,
                p.VendEmplId,
                p.VendId,
                p.AcctId,
                p.OrgId,
                p.PdNo,
                FyCd = Convert.ToInt16(p.FyCd),
                p.BillLabCatCd,
                ActHrs = p.ActHrs.GetValueOrDefault(),
                p.ActAmt,
                p.EffectBillDt

            }).ToList();

            List<PlEmployeee> hoursData = new List<PlEmployeee>();

            var query = _context.LabHours
                .Where(lh => lh.ProjId.StartsWith(Proj_Id)
                             && lh.EmplId != null && startDateTime <= lh.TimeStamp);

            if (!string.Equals(project.ProjTypeDc, "INDIRECT", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(lh => laborAccountIds.Contains(lh.AcctId));
            }

            hoursData = query
                .Select(lh => new PlEmployeee
                {
                    Type = "Employee",
                    EmplId = lh.EmplId,
                    OrgId = lh.OrgId,
                    AccId = lh.AcctId,
                    PlId = entry.Entity.PlId,
                    IsBrd = true,
                    IsRev = true,
                    PlcGlcCode = lh.BillLabCatCd
                })
                .Distinct()
                .OrderBy(lh => lh.EmplId)
                .ToList();

            if (hoursData.Count() > 0)
            {

                var employeees = hoursData.Select(p => p.EmplId).ToArray();

                var quoted = string.Join(",", employeees.Select(id => $"'{id}'"));

                sql = $@"
                        SELECT empl.empl_id AS EmplId, 
                               s_empl_status_cd AS Status, 
                               last_first_name AS FirstName, 
                               sal_amt AS Salary,
                               effect_dt AS EffectiveDate,
                               hrly_amt AS PerHourRate
                        FROM empl
                        JOIN public.empl_lab_info 
                            ON empl.empl_id = public.empl_lab_info.empl_id
                        WHERE empl.empl_id IN ({quoted}) 
                          AND public.empl_lab_info.end_dt = '2078-12-31';
";

                var employeeDetails = _context.Empl_Master
                    .FromSqlRaw(sql)
                    .ToList();

                foreach (var emp in hoursData)
                {
                    try
                    {
                        emp.FirstName = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.FirstName;
                        emp.PerHourRate = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).PerHourRate;
                        emp.Status = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).Status;
                        emp.Salary = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).Salary;
                        emp.EffectiveDate = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId).EffectiveDate;
                        emp.Esc_Percent = Convert.ToDecimal(escallation_percent);

                        List<PlForecast> plForecasts = new List<PlForecast>();
                        foreach (var (year, month) in months)
                        {
                            PlForecast plForecast = new PlForecast();
                            plForecast.Year = year;
                            plForecast.Month = month;
                            plForecast.ProjId = newPlan.ProjId;
                            plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                            plForecast.Forecastedamt = 0;
                            plForecast.AcctId = emp.AccId;
                            plForecast.OrgId = emp.OrgId;
                            plForecast.Plc = emp.PlcGlcCode;
                            plForecast.EmplId = emp.EmplId;
                            plForecast.HrlyRate = emp.PerHourRate;
                            plForecast.PlId = entry.Entity.PlId.GetValueOrDefault();

                            DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                            //if (forecastDay <= currentMonth)
                            {
                                var actualData = HistoryData
                                         .Where(p => p.PdNo == plForecast.Month &&
                                                    p.FyCd == plForecast.Year &&
                                                    p.EmplId == plForecast.EmplId &&
                                                    p.AcctId == plForecast.AcctId &&
                                                    p.OrgId == plForecast.OrgId &&
                                                    p.BillLabCatCd == plForecast.Plc);

                                if (actualData.Count() > 0)
                                {
                                    plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                    if (newPlan.PlType.ToUpper() != "EAC")
                                    {
                                        plForecast.Forecastedhours = actualData.Sum(p => p.ActHrs);
                                        plForecast.ForecastedCost = actualData.Sum(p => p.ActAmt);

                                    }
                                    else
                                    {
                                        plForecast.Forecastedhours = plForecast.Forecastedhours;
                                        plForecast.Actualhours = actualData.Sum(p => p.ActHrs);
                                        plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                    }
                                    var totals = actualData
                                        .GroupBy(_ => 1)
                                        .Select(g => new
                                        {
                                            Hrs = g.Sum(x => x.ActHrs),
                                            Amt = g.Sum(x => x.ActAmt) ?? 0
                                        })
                                        .FirstOrDefault();
                                    plForecast.HrlyRate = totals.Hrs == 0 ? 0 : totals.Amt / totals.Hrs;

                                    //plForecast.HrlyRate = actualData.Sum(p => p.ActAmt).GetValueOrDefault() / actualData.Sum(p => p.ActHrs);
                                    //emp.PerHourRate = plForecast.HrlyRate;

                                    plForecast.EffectDt = DateOnly.FromDateTime(actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault()); //actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();

                                }
                            }
                            plForecasts.Add(plForecast);
                        }
                        emp.PlForecasts = plForecasts;
                        plEmployeeCostList.Add(emp);
                    }
                    catch (Exception ex)
                    {
                        // Handle exception (e.g., log the error)
                    }
                }


            }
            //////////////////////////Fetch Vendor's Actual Data

            query = _context.LabHours
                    .Where(lh => lh.ProjId.StartsWith(Proj_Id)
                                 && lh.VendEmplId != null && startDateTime <= lh.TimeStamp);

            if (!string.Equals(project.ProjTypeDc, "INDIRECT", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(lh => laborAccountIds.Contains(lh.AcctId));
            }



            var VenderhoursData = query
                    .Select(lh => new PlEmployeee
                    {
                        Type = "Vendor Employee",
                        EmplId = lh.VendEmplId,
                        OrgId = lh.OrgId,
                        AccId = lh.AcctId,
                        PlId = entry.Entity.PlId,
                        IsBrd = true,
                        IsRev = true,
                        PlcGlcCode = lh.BillLabCatCd
                    })
                    .Distinct()
                    .OrderBy(lh => lh.EmplId)
                    .ToList();

            sql = $@"
                        SELECT ve.vend_empl_id as EmpId, ve.vend_empl_name as EmployeeName, ve.df_bill_lab_cat_cd as Plc, ve.vend_id as VendId,
                            NULL::varchar AS ""OrgId"",
                            NULL::varchar AS ""OrgName"",
                            NULL::varchar AS ""AcctId"",
                            NULL::varchar AS ""AcctName""
                        FROM vendor_employee ve;
                    ";

            var VendorEmployeeDetails = _context.VendorEmployeeDTOs
                    .FromSqlRaw(sql)
                    .ToList();

            foreach (var vendEmpl in VenderhoursData)
            {
                try
                {

                    vendEmpl.FirstName = VendorEmployeeDetails.FirstOrDefault(p => p.EmpId == vendEmpl.EmplId)?.EmployeeName;

                    List<PlForecast> plForecasts = new List<PlForecast>();
                    foreach (var (year, month) in months)
                    {
                        if ((year == 2025 && month == 1) || (year == 2020 && month == 5) && vendEmpl.EmplId == "G00205")
                        {

                        }
                        PlForecast plForecast = new PlForecast();
                        plForecast.Year = year;
                        plForecast.Month = month;
                        plForecast.ProjId = newPlan.ProjId;
                        plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                        plForecast.Forecastedamt = 0;
                        plForecast.AcctId = vendEmpl.AccId;
                        plForecast.OrgId = vendEmpl.OrgId;
                        plForecast.Plc = vendEmpl.PlcGlcCode;
                        plForecast.EmplId = vendEmpl.EmplId;
                        plForecast.HrlyRate = vendEmpl.PerHourRate;
                        plForecast.PlId = newPlan.PlId.GetValueOrDefault();

                        DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                        //if (forecastDay <= currentMonth)
                        {
                            var actualData = HistoryData
                                            .Where(p => p.PdNo == plForecast.Month &&
                                                  p.FyCd == plForecast.Year &&
                                                  p.VendEmplId == plForecast.EmplId &&
                                                  p.AcctId == plForecast.AcctId &&
                                                  p.OrgId == plForecast.OrgId &&
                                                  p.BillLabCatCd == plForecast.Plc);

                            if (actualData.Count() > 0)
                            {
                                var totals = actualData
                                            .GroupBy(_ => 1)
                                            .Select(g => new
                                            {
                                                Hrs = g.Sum(x => x.ActHrs),
                                                Amt = g.Sum(x => x.ActAmt) ?? 0
                                            })
                                            .FirstOrDefault();

                                plForecast.HrlyRate = totals.Hrs == 0 ? 0 : totals.Amt / totals.Hrs;

                                //plForecast.HrlyRate = actualData.Sum(p => p.ActAmt).GetValueOrDefault() / actualData.Sum(p => p.ActHrs);
                                vendEmpl.PerHourRate = plForecast.HrlyRate;
                                plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                if (newPlan.PlType.ToUpper() != "EAC")
                                {
                                    plForecast.Forecastedhours = actualData.Sum(p => p.ActHrs);
                                    plForecast.ForecastedCost = plForecast.Cost;
                                }
                                else
                                {

                                    plForecast.Forecastedhours = actualData.Sum(p => p.ActHrs);
                                    plForecast.Actualhours = actualData.Sum(p => p.ActHrs);
                                    plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                }
                                vendEmpl.PerHourRate = plForecast.HrlyRate;
                                plForecast.EffectDt = plForecast.EffectDt = DateOnly.FromDateTime(actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault()); //actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();
                            }
                        }
                        plForecasts.Add(plForecast);
                    }
                    vendEmpl.PlForecasts = plForecasts;
                    plEmployeeCostList.Add(vendEmpl);
                }
                catch (Exception ex)
                {
                    // Handle exception (e.g., log the error)
                }
            }
            /////////////////////////////////////////////////////////
            ///

            var NonlaborAccountIds = NonLaborAccounts
                .Where(p => p.AccountFunctionDescription == "NON-LABOR")
                .Select(p => p.AccountId)
                .ToList(); 

            var startYear = startDateTime.Value.Year;
            var startMonth = startDateTime.Value.Month;

            var query1 = _context.PlFinancialTransactions
                    .Where(p =>
                        p.ProjId.StartsWith(Proj_Id) &&
                        p.SJnlCd != "LD" &&
                        !string.IsNullOrEmpty(p.Id) && (
            Convert.ToInt32(p.FyCd) > startYear ||
            (Convert.ToInt32(p.FyCd) == startYear && p.PdNo >= startMonth)
        ));

            if (!string.Equals(project.ProjTypeDc, "INDIRECT", StringComparison.OrdinalIgnoreCase))
            {
                var accountIds = NonlaborAccountIds
                    .Concat(laborAccountIds)
                    .Distinct()
                    .ToList();

                query1 = query1.Where(p => accountIds.Contains(p.AcctId));
            }

            var result = query1
                .Select(p => new
                {
                    p.SIdType,
                    //p.Name,
                    p.OrgId,
                    p.AcctId,
                    p.BillLabCatCd,
                    p.Id,
                    PlId = entry.Entity.PlId.GetValueOrDefault()// cast id to text
                })
                .Distinct()
                .Select(x => new PlDct
                {
                    AmountType = x.SIdType,
                    Type = x.SIdType == "E" ? "Employee" : "Vendor Employee",
                    OrgId = x.OrgId,
                    AcctId = x.AcctId,
                    PlcGlc = x.BillLabCatCd,
                    IsBrd = true,
                    IsRev = true,
                    Id = x.Id.ToString(),
                    PlId = entry.Entity.PlId.GetValueOrDefault()
                })
                .ToList();


            var HistoryData1 = _context.PlFinancialTransactions
            .Where(p => p.ProjId.StartsWith(Proj_Id) && !string.IsNullOrEmpty(p.Id) && p.SJnlCd != "LD" && (
            Convert.ToInt32(p.FyCd) > startYear ||
            (Convert.ToInt32(p.FyCd) == startYear && p.PdNo >= startMonth)))
            .Select(p => new
            {
                p.ProjId,
                Id = p.Id == null ? null : p.Id.ToString(),
                p.AcctId,
                p.OrgId,
                p.PdNo,
                p.FyCd,
                p.BillLabCatCd,
                p.Hrs1,
                p.Amt1,
                p.EffectBillDt,
                p.Name,
                p.SIdType
            })
            .ToList();

            foreach (var dct in result)
            {
                try
                {
                    List<PlForecast> plForecasts = new List<PlForecast>();
                    foreach (var (year, month) in months)
                    {
                        PlForecast plForecast = new PlForecast();
                        plForecast.Year = year;
                        plForecast.Month = month;
                        plForecast.ProjId = newPlan.ProjId;
                        plForecast.PlId = newPlan.PlId.GetValueOrDefault();
                        plForecast.Forecastedamt = 0;
                        plForecast.AcctId = dct.AcctId;
                        plForecast.OrgId = dct.OrgId;
                        plForecast.EmplId = dct.Id;
                        plForecast.Plc = dct.PlcGlc;
                        plForecast.DirectCost = new PlDct() { Id = dct.Id };
                        plForecast.PlId = entry.Entity.PlId.GetValueOrDefault();
                        DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                        //if (forecastDay <= currentMonth)
                        {

                            var actualData = HistoryData1
                                            .Where(p => p.PdNo == plForecast.Month &&
                                                  p.FyCd == plForecast.Year.ToString() &&
                                                  p.Id == plForecast.EmplId &&
                                                  p.AcctId == plForecast.AcctId &&
                                                  p.BillLabCatCd == plForecast.Plc &&
                                                  p.OrgId == plForecast.OrgId);

                            if (actualData.Count() > 0)
                            {
                                if (string.IsNullOrEmpty(dct.Category))
                                    dct.Category = actualData.FirstOrDefault().Name;
                                plForecast.Actualamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                                plForecast.Forecastedamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                                plForecast.Cost = plForecast.Actualamt.GetValueOrDefault();
                                plForecast.EffectDt = actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault(); //actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();

                            }

                        }
                        plForecasts.Add(plForecast);
                    }
                    dct.PlForecasts = plForecasts;
                    plDirectCostList.Add(dct);
                }
                catch (Exception ex)
                {
                    // Log the exception or handle it as needed
                    Console.WriteLine($"Error processing DCT Id {dct.Id}: {ex.Message}");
                }
            }

            _context.PlEmployeees.AddRange(hoursData);
            _context.PlEmployeees.AddRange(VenderhoursData);

            _context.PlDcts.AddRange(plDirectCostList);
            try
            {
                _context.SaveChanges();

                if (revenueFormula.ToUpper().Equals("CPFC"))
                {
                    isBudgetIsCreatedOnLowerLevel(newPlan.ProjId, entry.Entity.PlId.GetValueOrDefault());
                }
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }

            return entry.Entity;

        }


        internal List<PlEmployeee> GetEmployeeActulHoursData(PlProjectPlan newPlan, List<PlForecast> plForecastsCopied)
        {
            var ProjId = newPlan.ProjId;
            var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            var grpCode = _context.PlProjects.FirstOrDefault(p => p.ProjId == ProjId)?.AcctGrpCd;
            var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();

            ScheduleHelper scheduleHelper = new ScheduleHelper();
            var project = _context.PlProjects.FirstOrDefault(p => p.ProjId == ProjId);
            var months = scheduleHelper.GetMonthsBetween(newPlan.ProjStartDt.GetValueOrDefault(), newPlan.ProjEndDt.GetValueOrDefault());
            List<PlDct> plDirectCostList = new List<PlDct>();
            List<PlEmployeee> plEmployeeCostList = new List<PlEmployeee>();

            //var actualHours = getActualDataByProjectId(ProjId);
            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            var HistoryData = _context.LabHours.Where(p => p.ProjId.StartsWith(ProjId)).Select(p => new
            {
                p.ProjId,
                p.EmplId,
                p.VendEmplId,
                p.VendId,
                p.AcctId,
                p.OrgId,
                p.PdNo,
                FyCd = Convert.ToInt16(p.FyCd),
                p.BillLabCatCd,
                ActHrs = p.ActHrs.GetValueOrDefault(),
                p.ActAmt,
                p.EffectBillDt

            }).ToList();


            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }
            string sql = string.Empty;
            var laborAccountIds = NonLaborAccounts
                                .Where(p => p.AccountFunctionDescription == "LABOR")
                                .Select(p => p.AccountId)
                                .ToList(); // Evaluated in memory

            var hoursData = _context.LabHours
                            .Where(lh => lh.ProjId.StartsWith(ProjId)
                                         && lh.EmplId != null
                                         && laborAccountIds.Contains(lh.AcctId)) // Safe now
                            .Select(lh => new PlEmployeee
                            {
                                Type = "Employee",
                                EmplId = lh.EmplId,
                                OrgId = lh.OrgId,
                                AccId = lh.AcctId,
                                IsBrd = true,
                                IsRev = true,
                                PlcGlcCode = lh.BillLabCatCd
                            })
                            .Distinct()
                            .OrderBy(lh => lh.EmplId)
                            .ToList();

            if (hoursData.Count() > 0)
            {
                var employeees = hoursData.Select(p => p.EmplId).ToArray();

                var quoted = string.Join(",", employeees.Select(id => $"'{id}'"));

                sql = $@"
                        SELECT empl.empl_id AS EmplId, 
                               s_empl_status_cd AS Status, 
                               last_first_name AS FirstName, 
                               effect_dt AS EffectiveDate,
                               sal_amt AS Salary,
                               hrly_amt AS PerHourRate
                        FROM empl
                        JOIN public.empl_lab_info 
                            ON empl.empl_id = public.empl_lab_info.empl_id
                        WHERE empl.empl_id IN ({quoted}) 
                          AND public.empl_lab_info.end_dt = '2078-12-31';
";

                var employeeDetails = _context.Empl_Master
                    .FromSqlRaw(sql)
                    .ToList();

                foreach (var emp in hoursData)
                {

                    emp.FirstName = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.FirstName;
                    emp.PerHourRate = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.PerHourRate ?? 0;
                    emp.Status = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.Status;
                    emp.Salary = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.Salary;
                    emp.EffectiveDate = employeeDetails.FirstOrDefault(p => p.EmplId == emp.EmplId)?.EffectiveDate;

                    List<PlForecast> plForecasts = new List<PlForecast>();
                    foreach (var (year, month) in months)
                    {
                        PlForecast plForecast = new PlForecast();
                        plForecast.Year = year;
                        plForecast.Month = month;
                        plForecast.ProjId = ProjId;
                        plForecast.Forecastedamt = 0;
                        plForecast.AcctId = emp.AccId;
                        plForecast.OrgId = emp.OrgId;
                        plForecast.Plc = emp.PlcGlcCode;
                        plForecast.EmplId = emp.EmplId;
                        plForecast.HrlyRate = emp.PerHourRate;

                        DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                        if (forecastDay <= currentMonth)
                        {

                            if (plForecast.Month == 10 && plForecast.Year == 2025 && plForecast.EmplId == "9030951")
                            {

                            }
                            if (plForecast.Month == 1 && plForecast.Year == 2026 && plForecast.EmplId == "002643")
                            {

                            }
                            var actualData = HistoryData
                                     .Where(p => p.PdNo == plForecast.Month &&
                                                p.FyCd == plForecast.Year &&
                                                p.EmplId == plForecast.EmplId &&
                                                p.AcctId == plForecast.AcctId &&
                                                p.OrgId == plForecast.OrgId &&
                                                p.BillLabCatCd == plForecast.Plc);

                            if (actualData.Count() > 0)
                            {


                                plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();
                                plForecast.Actualhours = actualData.Sum(p => p.ActHrs);

                                var totals = actualData
                                            .GroupBy(_ => 1)
                                            .Select(g => new
                                            {
                                                Hrs = g.Sum(x => x.ActHrs),
                                                Amt = g.Sum(x => x.ActAmt) ?? 0
                                            })
                                            .FirstOrDefault();

                                plForecast.HrlyRate = totals.Hrs == 0 ? 0 : totals.Amt / totals.Hrs;
                                //plForecast.EffectDt = actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();
                            }
                            else
                            {
                                //As we are not getting actuals from history data then setting to zero
                                //plForecast.Actualhours = 0;
                                //plForecast.Cost = 0;

                                var forecastData = plForecastsCopied
                                                    .Where(p => p.Month == plForecast.Month &&
                                                               p.Year == plForecast.Year &&
                                                               p.EmplId == plForecast.EmplId &&
                                                               p.AcctId == plForecast.AcctId &&
                                                               p.OrgId == plForecast.OrgId &&
                                                               p.Plc == plForecast.Plc).ToList();

                                if (forecastData.Count() > 0)
                                {
                                    plForecast.Actualhours = 0;
                                    plForecast.Cost = 0;
                                    plForecast.Forecastedhours = forecastData[0].Forecastedhours;
                                    //plForecast.Cost = forecastData[0].Cost;
                                    plForecast.Revenue = forecastData[0].Revenue;
                                    plForecast.Fringe = forecastData[0].Fringe;
                                    plForecast.Cost = forecastData[0].Cost;
                                    plForecast.Overhead = forecastData[0].Overhead;
                                    plForecast.Gna = forecastData[0].Gna;
                                    plForecast.Materials = forecastData[0].Materials;
                                    plForecast.Hr = forecastData[0].Hr;
                                    plForecast.YtdGna = forecastData[0].YtdGna;
                                    plForecast.YtdCost = forecastData[0].YtdCost;
                                    plForecast.YtdFringe = forecastData[0].YtdFringe;
                                    plForecast.YtdOverhead = forecastData[0].YtdOverhead;
                                    plForecast.YtdMaterials = forecastData[0].YtdMaterials;
                                    plForecast.Burden = forecastData[0].Burden;
                                }
                            }
                        }

                        else
                        {
                            var forecastData = plForecastsCopied
                                    .Where(p => p.Month == plForecast.Month &&
                                               p.Year == plForecast.Year &&
                                               p.EmplId == plForecast.EmplId &&
                                               p.AcctId == plForecast.AcctId &&
                                               p.OrgId == plForecast.OrgId &&
                                               p.Plc == plForecast.Plc).ToList();

                            if (forecastData.Count() > 0)
                            {
                                plForecast.Actualhours = forecastData[0].Forecastedhours;
                                plForecast.Forecastedhours = forecastData[0].Forecastedhours;
                                plForecast.Cost = forecastData[0].Cost;
                                plForecast.Revenue = forecastData[0].Revenue;
                                plForecast.Fringe = forecastData[0].Fringe;
                                plForecast.Cost = forecastData[0].Cost;
                                plForecast.Overhead = forecastData[0].Overhead;
                                plForecast.Gna = forecastData[0].Gna;
                                plForecast.Materials = forecastData[0].Materials;
                                plForecast.Hr = forecastData[0].Hr;
                                plForecast.YtdGna = forecastData[0].YtdGna;
                                plForecast.YtdCost = forecastData[0].YtdCost;
                                plForecast.YtdFringe = forecastData[0].YtdFringe;
                                plForecast.YtdOverhead = forecastData[0].YtdOverhead;
                                plForecast.YtdMaterials = forecastData[0].YtdMaterials;
                                plForecast.Burden = forecastData[0].Burden;
                            }

                        }

                        plForecasts.Add(plForecast);
                    }
                    emp.PlForecasts = plForecasts;
                    plEmployeeCostList.Add(emp);
                }
            }
            //////////////////////////Fetch Vendor's Actual Data
            var VenderhoursData = _context.LabHours
                    .Where(lh => lh.ProjId.StartsWith(ProjId) && lh.VendEmplId != null && laborAccountIds.Contains(lh.AcctId))
                    .Select(lh => new PlEmployeee
                    {
                        Type = "Vendor Employee",
                        EmplId = lh.VendEmplId,
                        OrgId = lh.OrgId,
                        AccId = lh.AcctId,
                        IsBrd = true,
                        IsRev = true,
                        PlcGlcCode = lh.BillLabCatCd
                    })
                    .Distinct()
                    .OrderBy(lh => lh.EmplId)
                    .ToList();

            sql = $@"
                        SELECT ve.vend_empl_id as EmpId, ve.vend_empl_name as EmployeeName, ve.df_bill_lab_cat_cd as Plc, ve.vend_id as VendId,
                            NULL::varchar AS ""OrgId"",
                            NULL::varchar AS ""OrgName"",
                            NULL::varchar AS ""AcctId"",
                            NULL::varchar AS ""AcctName""
                        FROM vendor_employee ve;
                    ";

            var VendorEmployeeDetails = _context.VendorEmployeeDTOs
                    .FromSqlRaw(sql)
                    .ToList();

            foreach (var vendEmpl in VenderhoursData)
            {

                vendEmpl.FirstName = VendorEmployeeDetails.FirstOrDefault(p => p.EmpId == vendEmpl.EmplId)?.EmployeeName;

                List<PlForecast> plForecasts = new List<PlForecast>();
                foreach (var (year, month) in months)
                {
                    if ((year == 2025 && month == 9) || (year == 2025 && month == 10))
                    {

                    }

                    if (year == 2026 && month == 1 && vendEmpl.EmplId == "9030916")
                    {
                    }
                    PlForecast plForecast = new PlForecast();
                    plForecast.Year = year;
                    plForecast.Month = month;
                    plForecast.ProjId = ProjId;
                    plForecast.Forecastedamt = 0;
                    plForecast.AcctId = vendEmpl.AccId;
                    plForecast.OrgId = vendEmpl.OrgId;
                    plForecast.Plc = vendEmpl.PlcGlcCode;
                    plForecast.EmplId = vendEmpl.EmplId;
                    plForecast.HrlyRate = vendEmpl.PerHourRate;

                    DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));

                    if (forecastDay <= currentMonth)
                    {
                        var actualData = HistoryData
                                        .Where(p => p.PdNo == plForecast.Month &&
                                              p.FyCd == plForecast.Year &&
                                              p.VendEmplId == plForecast.EmplId &&
                                              p.AcctId == plForecast.AcctId &&
                                              p.OrgId == plForecast.OrgId &&
                                              p.BillLabCatCd == plForecast.Plc);

                        if (actualData.Count() > 0)
                        {
                            //if (string.IsNullOrEmpty(vendEmpl.FirstName))
                            //    vendEmpl.FirstName = actualData.FirstOrDefault().Name;
                            plForecast.Cost = actualData.Sum(p => p.ActAmt).GetValueOrDefault();

                            var totals = actualData
                                        .GroupBy(_ => 1)
                                        .Select(g => new
                                        {
                                            Hrs = g.Sum(x => x.ActHrs),
                                            Amt = g.Sum(x => x.ActAmt) ?? 0
                                        })
                                        .FirstOrDefault();
                            plForecast.HrlyRate = totals.Hrs == 0 ? 0 : totals.Amt / totals.Hrs;

                            plForecast.Actualhours = actualData.Sum(p => p.ActHrs);
                            //plForecast.HrlyRate = actualData.Sum(p => p.ActAmt).GetValueOrDefault() / actualData.Sum(p => p.ActHrs);
                            vendEmpl.PerHourRate = plForecast.HrlyRate;
                            //plForecast.EffectDt = actualData.FirstOrDefault().EffectBillDt.GetValueOrDefault().ToUniversalTime();
                        }
                    }
                    else
                    {
                        var forecastData = plForecastsCopied
                                .Where(p => p.Month == plForecast.Month &&
                                           p.Year == plForecast.Year &&
                                           p.EmplId == plForecast.EmplId &&
                                           p.AcctId == plForecast.AcctId &&
                                           p.OrgId == plForecast.OrgId &&
                                           p.Plc == plForecast.Plc).ToList();

                        if (forecastData.Count() > 0)
                        {
                            plForecast.Forecastedhours = forecastData[0].Forecastedhours;
                            plForecast.Actualhours = forecastData[0].Forecastedhours;
                            plForecast.Revenue = forecastData[0].Revenue;
                            plForecast.Fringe = forecastData[0].Fringe;
                            plForecast.Cost = forecastData[0].Cost;
                            plForecast.Overhead = forecastData[0].Overhead;
                            plForecast.Gna = forecastData[0].Gna;
                            plForecast.Materials = forecastData[0].Materials;
                            plForecast.Hr = forecastData[0].Hr;
                            plForecast.YtdGna = forecastData[0].YtdGna;
                            plForecast.YtdCost = forecastData[0].YtdCost;
                            plForecast.YtdFringe = forecastData[0].YtdFringe;
                            plForecast.YtdOverhead = forecastData[0].YtdOverhead;
                            plForecast.YtdMaterials = forecastData[0].YtdMaterials;
                            plForecast.Burden = forecastData[0].Burden;
                        }

                    }
                    plForecasts.Add(plForecast);
                }
                vendEmpl.PlForecasts = plForecasts;
                plEmployeeCostList.Add(vendEmpl);
            }
            return plEmployeeCostList;
        }


        internal List<PlDct> GetEmployeeActulAmountData(PlProjectPlan newPlan, List<PlForecast> plForecastsCopied)
        {
            var ProjId = newPlan.ProjId;
            var validDescriptions = new List<string> { "NON-LABOR", "LABOR" };
            var grpCode = _context.PlProjects.FirstOrDefault(p => p.ProjId == ProjId)?.AcctGrpCd;
            var NonLaborAccounts = _context.AccountGroupSetup.Where(p => p.AcctGroupCode == grpCode && validDescriptions.Contains(p.AccountFunctionDescription.ToUpper())).Select(p => new AccountGroupSetupDTO { AccountId = p.AccountId, AccountFunctionDescription = p.AccountFunctionDescription }).ToList();
            var laborAccountIds = NonLaborAccounts
        .Select(p => p.AccountId)
        .ToList();
            ScheduleHelper scheduleHelper = new ScheduleHelper();
            var project = _context.PlProjects.FirstOrDefault(p => p.ProjId == ProjId);
            var months = scheduleHelper.GetMonthsBetween(newPlan.ProjStartDt.GetValueOrDefault(), newPlan.ProjEndDt.GetValueOrDefault());
            List<PlDct> plDirectCostList = new List<PlDct>();

            var closingPeriodConfig = _context.PlConfigValues.FirstOrDefault(r => r.Name.ToLower() == "closing_period");

            var HistoryData = _context.PlFinancialTransactions
                        .Where(p => p.ProjId.StartsWith(ProjId) && laborAccountIds.Contains(p.AcctId) && !string.IsNullOrEmpty(p.Id))
                        .Select(p => new
                        {
                            p.ProjId,
                            Id = p.Id == null ? null : p.Id.ToString(),
                            p.AcctId,
                            p.OrgId,
                            p.PdNo,
                            p.FyCd,
                            p.BillLabCatCd,
                            p.Hrs1,
                            p.Amt1,
                            p.EffectBillDt,
                            p.Name
                        })
                        .ToList();

            DateTime currentMonth;

            if (closingPeriodConfig != null && DateTime.TryParse(closingPeriodConfig.Value, out currentMonth))
            {
                // currentMonth is now safely parsed
            }
            else
            {
                // Handle the missing or invalid value here
                throw new Exception("Invalid or missing 'closing_period' configuration.");
            }

            /////////////////////////////////////////////////////////
            var NonlaborAccountIds = NonLaborAccounts
                    .Where(p => p.AccountFunctionDescription == "NON-LABOR")
                    .Select(p => p.AccountId)
                    .ToList(); // Evaluated in memory

            var result = _context.PlFinancialTransactions
            .Where(p => p.ProjId.StartsWith(ProjId) && laborAccountIds.Contains(p.AcctId) && !string.IsNullOrEmpty(p.Id) && p.SJnlCd != "LD" && !string.IsNullOrEmpty(p.Id))
            .Select(p => new PlDct
            {
                AmountType = p.SIdType,
                Type = p.SIdType == "E" ? "Employee" : "Vendor Employee",
                Category = p.Name,
                OrgId = p.OrgId,
                AcctId = p.AcctId,
                PlcGlc = p.BillLabCatCd,
                IsBrd = true,
                IsRev = true,
                Id = p.Id.ToString(),
            })
            .Distinct()
            .ToList();


            foreach (var dct in result)
            {

                if (dct.AcctId == "65-500-000")
                {

                }

                List<PlForecast> plForecasts = new List<PlForecast>();
                foreach (var (year, month) in months)
                {
                    PlForecast plForecast = new PlForecast();

                    plForecast.Year = year;
                    plForecast.Month = month;
                    plForecast.ProjId = ProjId;
                    plForecast.Forecastedamt = 0;
                    plForecast.AcctId = dct.AcctId;
                    plForecast.OrgId = dct.OrgId;
                    plForecast.EmplId = dct.Id;
                    plForecast.Plc = dct.PlcGlc;
                    plForecast.DirectCost = new PlDct() { Id = dct.Id };
                    DateTime forecastDay = new DateTime(plForecast.Year, plForecast.Month, DateTime.DaysInMonth(plForecast.Year, plForecast.Month));
                    if (plForecast.Year == 2024 && plForecast.Month == 2 && plForecast.EmplId == "1002141")
                    {

                    }

                    if (plForecast.Year == 2025 && plForecast.Month == 10 && plForecast.EmplId == "TBD_59508")
                    {
                    }

                    if (forecastDay <= currentMonth)
                    {

                        var actualData = HistoryData
                                        .Where(p => p.PdNo == plForecast.Month &&
                                              p.FyCd == plForecast.Year.ToString() &&
                                              p.Id == plForecast.EmplId &&
                                              p.AcctId == plForecast.AcctId &&
                                              p.BillLabCatCd == plForecast.Plc &&
                                              p.OrgId == plForecast.OrgId);

                        plForecast.Cost = actualData.Sum(p => p.Amt1).GetValueOrDefault();

                        if (actualData.Count() > 0)
                        {
                            if (string.IsNullOrEmpty(dct.Category))
                                dct.Category = actualData.FirstOrDefault().Name;
                            plForecast.Actualamt = actualData.Sum(p => p.Amt1).GetValueOrDefault();
                            plForecast.Cost = plForecast.Actualamt.GetValueOrDefault();
                        }
                        else
                        {
                            //As we are not getting actuals from history data then setting to zero
                            //plForecast.Actualamt = 0;
                            //plForecast.Cost = 0;
                            var forecastData = plForecastsCopied
                               .Where(p => p.Month == plForecast.Month &&
                               p.Year == plForecast.Year &&
                               p.EmplId == plForecast.EmplId &&
                               p.AcctId == plForecast.AcctId &&
                               p.OrgId == plForecast.OrgId).ToList();

                            if (forecastData.Count() > 0)
                            {
                                var AmountsforecastData = plForecastsCopied
                                       .Where(p => p.Month == plForecast.Month &&
                                       p.Year == plForecast.Year &&
                                       p.EmplId == plForecast.EmplId &&
                                       p.AcctId == plForecast.AcctId &&
                                       p.Plc == plForecast.Plc &&
                                       p.OrgId == plForecast.OrgId).ToList();

                                if (AmountsforecastData.Count() > 0)
                                {
                                    plForecast.Forecastedamt = AmountsforecastData[0].Forecastedamt;
                                    plForecast.Actualamt = AmountsforecastData[0].Forecastedamt;
                                    plForecast.Revenue = AmountsforecastData[0].Revenue;
                                    plForecast.Fringe = AmountsforecastData[0].Fringe;
                                    plForecast.Cost = AmountsforecastData[0].Forecastedamt.GetValueOrDefault();
                                    plForecast.Overhead = AmountsforecastData[0].Overhead;
                                    plForecast.Gna = AmountsforecastData[0].Gna;
                                    plForecast.Materials = forecastData[0].Materials;
                                    plForecast.Hr = AmountsforecastData[0].Hr;
                                    plForecast.YtdGna = AmountsforecastData[0].YtdGna;
                                    plForecast.YtdCost = AmountsforecastData[0].YtdCost;
                                    plForecast.YtdFringe = AmountsforecastData[0].YtdFringe;
                                    plForecast.YtdOverhead = AmountsforecastData[0].YtdOverhead;
                                    plForecast.YtdMaterials = AmountsforecastData[0].YtdMaterials;
                                    plForecast.Burden = AmountsforecastData[0].Burden;
                                }
                            }
                        }

                    }
                    else
                    {

                        if (plForecast.Year == 2025 && plForecast.Month == 1 && plForecast.EmplId == "002652")
                        {

                        }
                        var forecastData = plForecastsCopied
                               .Where(p => p.Month == plForecast.Month &&
                               p.Year == plForecast.Year &&
                               p.EmplId == plForecast.EmplId &&
                               p.AcctId == plForecast.AcctId && p.Plc == plForecast.Plc &&
                               p.OrgId == plForecast.OrgId).ToList();

                        if (forecastData.Count() > 0)
                        {
                            plForecast.Forecastedamt = forecastData[0].Forecastedamt;
                            plForecast.Actualamt = forecastData[0].Forecastedamt;
                            plForecast.Revenue = forecastData[0].Revenue;
                            plForecast.Fringe = forecastData[0].Fringe;
                            plForecast.Cost = forecastData[0].Forecastedamt.GetValueOrDefault();
                            plForecast.Overhead = forecastData[0].Overhead;
                            plForecast.Gna = forecastData[0].Gna;
                            plForecast.Materials = forecastData[0].Materials;
                            plForecast.Hr = forecastData[0].Hr;
                            plForecast.YtdGna = forecastData[0].YtdGna;
                            plForecast.YtdCost = forecastData[0].YtdCost;
                            plForecast.YtdFringe = forecastData[0].YtdFringe;
                            plForecast.YtdOverhead = forecastData[0].YtdOverhead;
                            plForecast.YtdMaterials = forecastData[0].YtdMaterials;
                            plForecast.Burden = forecastData[0].Burden;
                        }
                    }
                    plForecasts.Add(plForecast);
                }
                dct.PlForecasts = plForecasts;


                plDirectCostList.Add(dct);
            }

            return plDirectCostList;

        }


        public ProjBgtRevSetup GetRevenuDefinitionFromCP(PlProjectPlan newPlan)
        {
            ProjBgtRevSetup projBgtRevSetup = new ProjBgtRevSetup();

            //var projIds = newPlan.ProjId.Split('.');
            //var ProjRevDef = _context.ProjRevDefinitions.FirstOrDefault(p => newPlan.ProjId.Contains(p.ProjectId));
            var parts = newPlan.ProjId.Split('.', StringSplitOptions.RemoveEmptyEntries);

            // Generate hierarchical prefixes starting from level 2
            // Example: 22003.03.300800.4313.0001
            // Produces:
            // 22003.03
            // 22003.03.300800
            // 22003.03.300800.4313
            // 22003.03.300800.4313.0001
            var prefixes = Enumerable
                .Range(1, parts.Length)
                .Select(i => string.Join('.', parts.Take(i)))
                .ToList();

            var ProjRevDef = _context.ProjRevDefinitions
                .AsNoTracking()
                .Where(p => prefixes.Contains(p.ProjectId))
                .OrderByDescending(p => p.ProjectId.Length)
                .FirstOrDefault();

            if (ProjRevDef != null)
            {
                projBgtRevSetup = new ProjBgtRevSetup();
                switch (ProjRevDef.RevenueFormulaCd.ToUpper())
                {
                    case "CPFH":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            //OverrideRevAdjFl = true,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            //OverrideFundingCeilingFl = true,
                            //OverrideRevAmtFl = true,
                            //OverrideRevSettingFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            LabCostFl = true,
                            //LabFeeCostFl = false,
                            LabFeeHrsFl = true,
                            LabFeeRt = ProjRevDef.RevenueCalculationAmount.GetValueOrDefault(),
                            //LabTmFl = false,
                            //NonLabFeeCostFl = false,
                            //NonLabFeeHrsFl = false,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "CPFC":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            LabCostFl = true,
                            LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            //LabTmFl = false,
                            NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "LLRCINL":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            //LabBurdFl = true,
                            //NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            //LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            LabTmFl = true,
                            //NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "LLR":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            //LabBurdFl = true,
                            //NonLabBurdFl = true,
                            //NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            //LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            LabTmFl = true,
                            //NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "LLRCINBF":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            //LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            //LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            LabTmFl = true,
                            NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "CPFF":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            LabCostFl = true,
                            LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            //LabTmFl = false,
                            NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "LLRCINLB":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            //LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            //LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            LabTmFl = true,
                            //NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };

                        break;

                    case "LLRFNLBF":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            //LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            LabTmFl = true,
                            NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;
                    case "RSBFNLBF":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            LabBurdFl = true,
                            NonLabBurdFl = true,
                            NonLabCostFl = true,
                            RevType = ProjRevDef.RevenueFormulaCd,
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            LabFeeCostFl = true,
                            //LabFeeHrsFl = true,
                            LabTmFl = true,
                            NonLabFeeCostFl = true,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                    case "ETBAR":
                    case "UNIT":
                        projBgtRevSetup = new ProjBgtRevSetup
                        {
                            ProjId = newPlan.ProjId,
                            VersionNo = newPlan.Version,
                            BgtType = newPlan.PlType,
                            AtRiskAmt = ProjRevDef.AtRiskAmount.GetValueOrDefault(),
                            //LabBurdFl = true,
                            NonLabBurdFl = false,
                            NonLabCostFl = false,
                            //RevType = ProjRevDef.RevenueFormulaCd,
                            RevType = "UNIT",
                            PlId = newPlan.PlId,
                            CompanyId = ProjRevDef.CompanyId.ToString(),
                            DfltFeeRt = 0,
                            //LabCostFl = true,
                            LabFeeCostFl = false,
                            //LabFeeHrsFl = true,
                            LabTmFl = false,
                            NonLabFeeCostFl = false,
                            NonLabFeeRt = ProjRevDef.RevenueCalculation1Amount.GetValueOrDefault(),
                            //NonLabTmFl = false,
                            RevAcctId = "40-0000-000",
                            //UseBillBurdenRates = true,
                            //RevAcctId = p.RevAcctId,
                        };
                        break;

                }
            }
            return projBgtRevSetup;
        }

    }

}