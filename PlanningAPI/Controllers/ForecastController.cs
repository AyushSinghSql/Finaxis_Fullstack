namespace WebApi.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ModelContextProtocol.Protocol;
using Newtonsoft.Json;
using Npgsql;
using NPOI.HSSF.Record;
using NPOI.SS.Formula.Functions;
using NPOI.SS.UserModel;
using NPOI.XSSF.Streaming.Values;
using NPOI.XSSF.UserModel;
using NPOI.XWPF.UserModel;
using PlanningAPI.Helpers;
using PlanningAPI.Models;
using PlanningAPI.Repositories;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Linq.Expressions;
using System.Net.NetworkInformation;
using System.Numerics;
using System.Reflection.PortableExecutable;
using System.Text.Json;
using System.Text.RegularExpressions;
using WebApi.DTO;
using WebApi.Helpers;
using WebApi.Repositories;
using WebApi.Services;
using static NPOI.HSSF.Util.HSSFColor;
using static QuestPDF.Helpers.Colors;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ForecastController : ControllerBase
{
    private IPl_ForecastService _pl_ForecastService;
    private IProjPlanService _projPlanService;
    private IProjRevWrkPdRepository _projRevWrkPdRepository;

    private readonly MydatabaseContext _context;
    private readonly ILogger<ForecastController> _logger;
    IOrgService _orgService;
    private readonly IAiService _aiService;
    private readonly IServiceProvider _serviceProvider;
    private readonly IBackgroundTaskQueue _taskQueue;
    public ForecastController(ILogger<ForecastController> logger, IPl_ForecastService pl_ForecastService, IProjPlanService projPlanService, IOrgService orgService, IProjRevWrkPdRepository projRevWrkPdRepository, MydatabaseContext context, IAiService aiService, IServiceProvider serviceProvider, IBackgroundTaskQueue taskQueue)
    {
        _pl_ForecastService = pl_ForecastService;
        _projPlanService = projPlanService;
        _context = context;
        _logger = logger;
        _orgService = orgService;
        _projRevWrkPdRepository = projRevWrkPdRepository;
        _aiService = aiService;
        _serviceProvider = serviceProvider;
        _taskQueue = taskQueue;
    }
    [HttpPost("ValidateForecast")]
    public IActionResult ValidateForecast(int planid)
    {

        _taskQueue.QueueBackgroundWorkItem(async token =>
        {
            using var scope = _serviceProvider.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<MydatabaseContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<ForecastController>>();

            try
            {
                var projPlan = db.PlProjectPlans.Where(p => p.PlId == planid).FirstOrDefault();
                if (projPlan == null)
                    return;
                //var totalEmployeeHours = await (
                //        from f in _context.PlForecasts
                //        join pp in _context.PlProjectPlans on f.PlId equals pp.PlId
                //        where f.EmplId == forecast.EmplId
                //              && f.Year == forecast.Year
                //              && f.Month == forecast.Month
                //              && (pp.FinalVersion == true || pp.PlId == forecast.PlId)
                //        select new
                //        {
                //            Hours =
                //                pp.PlId == forecast.PlId && pp.PlType == "EAC" ? f.Actualhours :
                //                pp.PlId == forecast.PlId && pp.PlType == "BUD" ? f.Forecastedhours :
                //                pp.PlId != forecast.PlId && pp.PlType == "EAC" && pp.FinalVersion == true ? f.Actualhours :
                //                pp.PlId != forecast.PlId && pp.PlType == "BUD" && pp.FinalVersion == true &&
                //                !_context.PlProjectPlans.Any(pp2 => pp2.ProjId == pp.ProjId && pp2.PlType == "EAC" && pp2.FinalVersion == true)
                //                    ? f.Forecastedhours : 0
                //        })
                //        .SumAsync(x => x.Hours);



                var validator = new ForecastValidator(db, logger);
                var forecasts = await db.PlForecasts
                    .Where(p => p.PlId == planid && p.Year == projPlan.ClosedPeriod.GetValueOrDefault().Year)
                    .ToListAsync(token);



                var result = forecasts
                    .GroupBy(f => new { f.EmplId, f.Month, f.Year })
                    .Select(g => new PlForecast
                    {
                        PlId = planid,
                        ProjId = g.First().ProjId,
                        EmplId = g.Key.EmplId,
                        Month = g.Key.Month,
                        Year = g.Key.Year,
                        Forecastedhours = g.Sum(x => x.Forecastedhours),
                        Actualhours = g.Sum(x => x.Actualamt ?? 0)
                    })
                    .ToList();

                await validator.ValidateForecastsAsync(result);

                logger.LogInformation("Background forecast validation completed for PlanId {PlanId}", planid);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating forecast for PlanId {PlanId}", planid);
            }
        });

        return Accepted(new { Message = $"Forecast validation for PlanId {planid} started in background." });

        //_ = Task.Run(async () =>
        //{
        //    try
        //    {
        //        using var scope = _serviceProvider.CreateScope();
        //        var context = scope.ServiceProvider.GetRequiredService<MydatabaseContext>();
        //        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ForecastController>>();


        //        ForecastValidator forecastValidator = new ForecastValidator(_context, _logger);
        //        forecastValidator.ValidateForecastsAsync(_context.PlForecasts.Where(p => p.PlId == planid && p.Year == 2025).ToList()).Wait();
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Background forecast validation failed for plan {PlanId}", planid);
        //    }
        //});

        //return Accepted(new { Message = "Forecast validation started in background." });
    }

    [HttpGet("GetAllForecasts")]
    public async Task<IActionResult> GetAllForecasts()
    {
        _logger.LogInformation("GetAllForecasts called at {Time}", DateTime.UtcNow);
        try
        {
            var forecasts = await _pl_ForecastService.GetAllAsync();
            return Ok(forecasts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all forecasts");
            return StatusCode(500, "An error occurred while fetching forecasts.");
        }
    }

    [HttpGet("GetForecastById/{forecastId}")]
    public async Task<IActionResult> GetForecastById(int forecastId)
    {
        _logger.LogInformation("GetForecastById called with ID {ForecastId}", forecastId);
        try
        {
            var forecast = await _pl_ForecastService.GetByIdAsync(forecastId);
            if (forecast == null)
                return NotFound($"Forecast with ID {forecastId} not found.");

            return Ok(forecast);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get forecast with ID {ForecastId}", forecastId);
            return StatusCode(500, "An error occurred while fetching the forecast.");
        }
    }

    [HttpDelete("DeleteForecastById/{forecastId}")]
    public async Task<IActionResult> DeleteForecastById(int forecastId)
    {
        _logger.LogInformation("DeleteForecastById called with ID {ForecastId}", forecastId);
        try
        {
            await _pl_ForecastService.DeleteAsync(forecastId);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete forecast with ID {ForecastId}", forecastId);
            return StatusCode(500, "An error occurred while deleting the forecast.");
        }
    }

    [HttpPut("UpdateForecastById")]
    public async Task<IActionResult> UpdateForecastById([FromBody] PlForecast plForecast)
    {
        _logger.LogInformation("UpdateForecastById called for forecast ID {ForecastId}", plForecast?.Forecastid);
        try
        {
            await _pl_ForecastService.UpdateAsync(plForecast);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast ID {ForecastId}", plForecast?.Forecastid);
            return StatusCode(500, "An error occurred while updating the forecast.");
        }
    }

    [HttpPut("UpdateForecastAmount")]
    public async Task<IActionResult> UpdateForecastAmount([FromBody] PlForecast plForecast)
    {
        _logger.LogInformation("UpdateForecastAmount called for forecast ID {ForecastId}", plForecast?.Forecastid);
        try
        {
            await _pl_ForecastService.UpdateAmountAsync(plForecast);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast amount for ID {ForecastId}", plForecast?.Forecastid);
            return StatusCode(500, "An error occurred while updating the forecast amount.");
        }
    }

    [HttpPut("UpdateForecastHours")]
    public async Task<IActionResult> UpdateForecastHours([FromBody] PlForecast plForecast)
    {
        _logger.LogInformation("UpdateForecastHours called for forecast ID {ForecastId}", plForecast?.Forecastid);
        try
        {
            await _pl_ForecastService.UpdateHoursAsync(plForecast);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast hours for ID {ForecastId}", plForecast?.Forecastid);
            return StatusCode(500, "An error occurred while updating the forecast hours.");
        }
    }

    [HttpPut("UpdateForecastAmount/{type}")]
    public async Task<IActionResult> UpdateForecastAmount([FromBody] PlForecast plForecast, string type)
    {
        _logger.LogInformation("UpdateForecastAmount called for forecast ID {ForecastId}", plForecast?.Forecastid);
        try
        {
            await _pl_ForecastService.UpdateAmountAsync(plForecast, type);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast amount for ID {ForecastId}", plForecast?.Forecastid);
            return StatusCode(500, "An error occurred while updating the forecast amount.");
        }
    }

    [HttpPut("BulkUpdateForecastAmount/{type}")]
    public async Task<IActionResult> BulkUpdateForecastAmount([FromBody] List<PlForecast> plForecast, string type)
    {
        _logger.LogInformation("UpdateForecastAmount called for forecast");
        try
        {
            await _pl_ForecastService.UpdateAmountAsync(plForecast, type);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast amount");
            return StatusCode(500, "An error occurred while updating the forecast amount.");
        }
    }

    [HttpPut("BulkUpdateForecastAmountV1/{type}")]
    public async Task<IActionResult> BulkUpdateForecastAmountV1([FromBody] List<PlForecast> plForecast, int plid, int templateid, string type)
    {
        _logger.LogInformation("UpdateForecastAmount called for forecast");
        try
        {
            await _pl_ForecastService.UpdateAmountAsync(plForecast, type);
            await _pl_ForecastService.CalculateRevenueCost(plid, templateid, type);
            //await _taskQueue.QueueBackgroundWorkItemAsync(async (sp, ct) =>
            //{
            //    await _pl_ForecastService.CalculateRevenueCost(plid, templateid, type);
            //});

            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast amount");
            return StatusCode(500, "An error occurred while updating the forecast amount.");
        }
    }

    [HttpPut("UpdateForecastHours/{type}")]
    public async Task<IActionResult> UpdateForecastHours([FromBody] PlForecast plForecast, string type)
    {
        _logger.LogInformation("UpdateForecastHours called for forecast ID {ForecastId}", plForecast?.Forecastid);
        try
        {
            await _pl_ForecastService.UpdateHoursAsync(plForecast, type);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast hours for ID {ForecastId}", plForecast?.Forecastid);
            return StatusCode(500, "An error occurred while updating the forecast hours.");
        }
    }

    [HttpPut("BulkUpdateForecastHours/{type}")]
    public async Task<IActionResult> BulkUpdateForecastHours([FromBody] List<PlForecast> plForecast, string type)
    {
        _logger.LogInformation("UpdateForecastHours called");
        try
        {
            await _pl_ForecastService.UpdateHoursAsync(plForecast, type);
            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast hours");
            return StatusCode(500, "An error occurred while updating the forecast hours.");
        }
    }

    [HttpPut("BulkUpdateForecastHoursV1/{type}")]
    public async Task<IActionResult> BulkUpdateForecastHours([FromBody] List<PlForecast> plForecast, int plid, int templateid, string type)
    {
        _logger.LogInformation("UpdateForecastHours called");
        try
        {
            await _pl_ForecastService.UpdateHoursAsync(plForecast, type);
            try
            {
                await _pl_ForecastService.CalculateRevenueCost(plid, templateid, type);
            }
            catch (Exception ex)
            {
                //logger.LogError(ex, "Error Calculation Revenue for {PlanId}", result.PlId);
            }

            return Ok("Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update forecast hours");
            return StatusCode(500, "An error occurred while updating the forecast hours.");
        }
    }

    [HttpGet("ExportPlan")]
    public async Task<IActionResult> ExportPlan(string projId, int version, string type)
    {
        _logger.LogInformation("ExportPlan called");
        ScheduleHelper helper = new ScheduleHelper();
        try
        {


            var forecasts = await _pl_ForecastService.GetForecastByProjectIDAndVersion(projId, version, type);

            IWorkbook workbook = new XSSFWorkbook();
            ISheet sheet = workbook.CreateSheet("Data");

            IRow budgetInfo = sheet.CreateRow(0);
            budgetInfo.CreateCell(0).SetCellValue("Project - ");
            budgetInfo.CreateCell(1).SetCellValue(projId);
            budgetInfo.CreateCell(2).SetCellValue("Type - ");
            budgetInfo.CreateCell(3).SetCellValue(type);
            budgetInfo.CreateCell(4).SetCellValue("Version - ");
            budgetInfo.CreateCell(5).SetCellValue(version);

            var months = helper.GetMonthsBetween(forecasts.FirstOrDefault(p => p.ProjId == projId).Proj.ProjStartDt.GetValueOrDefault(), forecasts.FirstOrDefault(p => p.ProjId == projId).Proj.ProjEndDt.GetValueOrDefault());

            {
                var projectPlans = forecasts
                                .Select(f => f.PlId).Distinct()
                                .ToList();

                string[] baseHeaders = { "Project_ID", "ID_Type", "ID", "Pool_Org_ID", "Account_ID", "GLC/PLC", "Hourly_Rate", "Burden", "Revenue" };
                List<string> headers = new List<string>(baseHeaders);

                // Append dynamic headers
                foreach (var (year, month) in months)
                {
                    var dateTime = new DateTime(year, month, 1);

                    headers.Add($"{dateTime.ToString("MMM").Replace("Sept", "Sep")} {year}");
                }


                {

                    var forecastsForPlIdTest = forecasts
                          .Select(f => new
                          {
                              ProjId = f.ProjId,
                              EmplId = f.EmplId,
                              Type = f.Empl.Type,
                              PlanId = f.PlId,
                              OrgId = f.Proj?.OrgId ?? string.Empty,
                              AccId = f.Empl?.AccId ?? string.Empty,
                              PlcGlcCode = f.Empl?.PlcGlcCode ?? string.Empty,
                              PerHourRate = f.Empl?.PerHourRate ?? 0,
                              IsBrd = f.Empl?.IsBrd == true ? "TRUE" : "FALSE",
                              Revenue = f.Empl?.IsBrd == true ? "TRUE" : "FALSE"
                          }).Distinct()
                          .ToList();
                    // Header

                    foreach (var (year, month) in months)
                    {
                        headers.Append($"Year: {year}, Month: {month}");
                    }
                    IRow headerRow = sheet.CreateRow(1);
                    for (int i = 0; i < headers.Count; i++)
                    {
                        headerRow.CreateCell(i).SetCellValue(headers[i]);
                    }

                    var distinctPlIds = forecasts.Select(f => f.PlId).Distinct();

                    int rowIndex = 2;

                    foreach (var forecast in forecastsForPlIdTest)
                    {
                        IRow row = sheet.CreateRow(rowIndex++);
                        row.CreateCell(0).SetCellValue(forecast.ProjId);
                        row.CreateCell(1).SetCellValue(forecast.Type);
                        row.CreateCell(2).SetCellValue(forecast.EmplId);
                        row.CreateCell(3).SetCellValue(forecast.OrgId);
                        row.CreateCell(4).SetCellValue(forecast.AccId);
                        row.CreateCell(5).SetCellValue(forecast.PlcGlcCode);
                        row.CreateCell(6).SetCellValue(forecast.PerHourRate.ToString());
                        row.CreateCell(7).SetCellValue(forecast.IsBrd);
                        row.CreateCell(8).SetCellValue(forecast.Revenue);

                        var hours = forecasts
                                    .Where(p => p.EmplId == forecast.EmplId && p.PlId == forecast.PlanId)
                                    .OrderBy(p => p.Year)
                                    .ThenBy(p => p.Month)
                                    .ToList();
                        for (int i = 0; i < hours.Count; i++)
                        {
                            row.CreateCell(8 + i + 1).SetCellValue(hours[i].Forecastedhours.ToString());
                        }

                    }
                }

            }

            using var stream = new MemoryStream();
            workbook.Write(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ExportedData.xlsx");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export plan");
            return StatusCode(500, "An error occurred while exporting the plan." + ex.InnerException.Message);
        }
    }


    [HttpGet("ExportPlanDirectCost")]
    public async Task<IActionResult> ExportPlanDirectCost(string projId, int version, string type)
    {
        _logger.LogInformation("ExportPlan called");
        ScheduleHelper helper = new ScheduleHelper();
        PlProject project = new PlProject();
        try
        {
            IWorkbook workbook = new XSSFWorkbook();

            //var plan = _context.PlProjectPlans.Where(p => p.ProjId == projId && p.Version == version && p.PlType.ToUpper() == type.ToUpper()).Include(p => p.Proj).FirstOrDefault();
            var plan = _context.PlProjectPlans.Where(p => p.ProjId == projId && p.Version == version && p.PlType.ToUpper() == type.ToUpper()).Include(p => p.Proj).FirstOrDefault();
            var Allforecasts = _context.PlForecasts.Where(p => p.PlId == plan.PlId && p.ProjId == plan.ProjId).Include(p => p.Emple).Include(p => p.DirectCost).ToList();
            //var Allforecasts = await _pl_ForecastService.GetForecastByProjectIDAndVersion(projId, version, type);

            var forecasts = Allforecasts.Where(p => p.Emple != null).ToList();

            ISheet sheet = workbook.CreateSheet("Hours");

            IRow budgetInfo = sheet.CreateRow(0);
            budgetInfo.CreateCell(0).SetCellValue("Project - ");
            budgetInfo.CreateCell(1).SetCellValue(projId);
            budgetInfo.CreateCell(2).SetCellValue("Type - ");
            budgetInfo.CreateCell(3).SetCellValue(type);
            budgetInfo.CreateCell(4).SetCellValue("Version - ");
            budgetInfo.CreateCell(5).SetCellValue(version);
            List<(int Year, int Month)> months = new List<(int Year, int Month)>();

            DateTime projectStartDate = DateTime.MinValue, projectEndDate = DateTime.MaxValue;
            if (Allforecasts.Count > 0)
            {
                if (plan.Proj != null)
                {
                    project = plan.Proj;
                    projectEndDate = project.ProjEndDt.GetValueOrDefault().ToDateTime(TimeOnly.MaxValue);
                    projectStartDate = project.ProjStartDt.GetValueOrDefault().ToDateTime(TimeOnly.MinValue);
                    projectEndDate = plan.ProjEndDt.GetValueOrDefault().ToDateTime(TimeOnly.MaxValue);
                    projectStartDate = plan.ProjStartDt.GetValueOrDefault().ToDateTime(TimeOnly.MinValue);
                }
                else
                {
                    var NBBud = _context.NewBusinessBudgets.FirstOrDefault(p => p.BusinessBudgetId == projId);
                    if (NBBud != null)
                    {
                        project.ProjId = NBBud.BusinessBudgetId;
                        projectEndDate = NBBud.EndDate;
                        projectStartDate = NBBud.StartDate;
                    }
                }
                months = helper.GetMonthsBetween(DateOnly.FromDateTime(projectStartDate), DateOnly.FromDateTime(projectEndDate));
            }

            var projectPlans = forecasts
                            .Select(f => f.PlId).Distinct()
                            .ToList();

            string[] baseHeaders = { "Project_ID", "ID_Type", "ID", "Pool_Org_ID", "Account_ID", "PLC", "Hourly_Rate", "Burden", "Revenue" };
            List<string> headers = new List<string>(baseHeaders);

            // Append dynamic headers
            foreach (var (year, month) in months)
            {
                var dateTime = new DateTime(year, month, 1);

                headers.Add($"{dateTime.ToString("MMM").Replace("Sept", "Sep")} {year}");
            }
            var forecastsForPlIdTest = forecasts
                  .Select(f => new
                  {
                      ProjId = f.ProjId,
                      //EmplId = f.EmplId,
                      EmplId = f.Emple?.EmplId ?? string.Empty,
                      Type = f.Emple.Type,
                      PlanId = f.PlId,
                      OrgId = f.Emple?.OrgId ?? string.Empty,
                      AccId = f.Emple?.AccId ?? string.Empty,
                      PlcGlcCode = f.Emple?.PlcGlcCode ?? string.Empty,
                      PerHourRate = f.Emple?.PerHourRate ?? 0,
                      IsBrd = f.Emple?.IsBrd == true ? "TRUE" : "FALSE",
                      Revenue = f.Emple?.IsBrd == true ? "TRUE" : "FALSE"
                  }).Distinct()
                  .ToList();
            // Header

            foreach (var (year, month) in months)
            {
                headers.Append($"Year: {year}, Month: {month}");
            }
            IRow headerRow = sheet.CreateRow(1);
            for (int i = 0; i < headers.Count; i++)
            {
                headerRow.CreateCell(i).SetCellValue(headers[i]);
            }

            var distinctPlIds = forecasts.Select(f => f.PlId).Distinct();

            int rowIndex = 2;

            foreach (var forecast in forecastsForPlIdTest)
            {
                IRow row = sheet.CreateRow(rowIndex++);
                row.CreateCell(0).SetCellValue(forecast.ProjId);
                row.CreateCell(1).SetCellValue(forecast.Type);
                row.CreateCell(2).SetCellValue(forecast.EmplId);
                row.CreateCell(3).SetCellValue(forecast.OrgId);
                row.CreateCell(4).SetCellValue(forecast.AccId);
                row.CreateCell(5).SetCellValue(forecast.PlcGlcCode);
                //row.CreateCell(6).SetCellValue(forecast.PerHourRate.ToString());
                row.CreateCell(6).SetCellValue(Convert.ToDouble(forecast.PerHourRate));
                row.CreateCell(7).SetCellValue(forecast.IsBrd);
                row.CreateCell(8).SetCellValue(forecast.Revenue);

                //var hours = forecasts
                //            .Where(p => p.EmplId == forecast.EmplId && p.PlId == forecast.PlanId && p.OrgId == forecast.OrgId && p.AcctId == forecast.AccId && p.Plc == forecast.PlcGlcCode && p.Month <= project.ProjEndDt.GetValueOrDefault().Month && p.Year <= project.ProjEndDt.GetValueOrDefault().Year)
                //            .OrderBy(p => p.Year)
                //            .ThenBy(p => p.Month)
                //            .ToList();

                if (forecast.EmplId == "1003457")
                {

                }

                //var hours = forecasts
                //    .Where(p =>
                //        p.EmplId == forecast.EmplId &&
                //         p.PlId == forecast.PlanId &&
                //         p.OrgId == forecast.OrgId &&
                //         p.AcctId == forecast.AccId &&
                //         string.Equals(Convert.ToString(p.Plc), forecast.PlcGlcCode, StringComparison.OrdinalIgnoreCase) &&
                //         new DateTime(p.Year, p.Month, 1) <= projectEndDate &&
                //         new DateTime(p.Year, p.Month, 1) >= projectStartDate
                //    )
                //    .OrderBy(p => p.Year)
                //    .ThenBy(p => p.Month)
                //    .ToList();
                var projectStartKey = projectStartDate.Year * 100 + projectStartDate.Month;
                var projectEndKey = projectEndDate.Year * 100 + projectEndDate.Month;
                //var hours = forecasts
                //            .Where(p =>
                //                p.EmplId == forecast.EmplId &&
                //                p.PlId == forecast.PlanId &&
                //                p.OrgId == forecast.OrgId &&
                //                p.AcctId == forecast.AccId &&
                //                // Only compare Plc if both are not null/empty
                //                (string.IsNullOrWhiteSpace(Convert.ToString(p.Plc)) || string.IsNullOrWhiteSpace(forecast.PlcGlcCode)
                //                    || string.Equals(Convert.ToString(p.Plc), forecast.PlcGlcCode, StringComparison.OrdinalIgnoreCase)) &&
                //                new DateTime(p.Year, p.Month, DateTime.DaysInMonth(p.Year, p.Month)) <= projectEndDate &&
                //                new DateTime(p.Year, p.Month, 1) >= projectStartDate
                //            )
                //            .OrderBy(p => p.Year)
                //            .ThenBy(p => p.Month)
                //            .ToList();

                var hours = forecasts
                            .Where(p =>
                                p.EmplId == forecast.EmplId &&
                                p.PlId == forecast.PlanId &&
                                p.OrgId == forecast.OrgId &&
                                p.AcctId == forecast.AccId &&
                                (string.IsNullOrWhiteSpace(Convert.ToString(p.Plc)) ||
                                 string.IsNullOrWhiteSpace(forecast.PlcGlcCode) ||
                                 string.Equals(Convert.ToString(p.Plc), forecast.PlcGlcCode, StringComparison.OrdinalIgnoreCase)) &&
                                (p.Year * 100 + p.Month) >= projectStartKey &&
                                (p.Year * 100 + p.Month) <= projectEndKey
                            )
                            .OrderBy(p => p.Year)
                            .ThenBy(p => p.Month)
                            .ToList();
                for (int i = 0; i < hours.Count; i++)
                {
                    if (type.ToUpper() == "EAC")
                    {
                        if (i > 45)
                        {

                        }
                        //row.CreateCell(8 + i + 1).SetCellValue(hours[i].Actualhours.ToString());

                        row.CreateCell(8 + i + 1).SetCellValue(Convert.ToDouble(hours[i].Actualhours));
                    }
                    else
                    {
                        //row.CreateCell(8 + i + 1).SetCellValue(hours[i].Forecastedhours.ToString());
                        row.CreateCell(8 + i + 1).SetCellValue(Convert.ToDouble(hours[i].Forecastedhours));

                    }
                }

            }

            /////////////////////////////////////////////////////////////////////////////////////////////////////////
            var DirectCostforecasts = Allforecasts.Where(p => p.DirectCost != null).ToList();

            ISheet DirectCostSheet = workbook.CreateSheet("Direct Cost");

            IRow budgetDirectCostInfo = DirectCostSheet.CreateRow(0);
            budgetDirectCostInfo.CreateCell(0).SetCellValue("Project - ");
            budgetDirectCostInfo.CreateCell(1).SetCellValue(projId);
            budgetDirectCostInfo.CreateCell(2).SetCellValue("Type - ");
            budgetDirectCostInfo.CreateCell(3).SetCellValue(type);
            budgetDirectCostInfo.CreateCell(4).SetCellValue("Version - ");
            budgetDirectCostInfo.CreateCell(5).SetCellValue(version);

            List<(int Year, int Month)> DirectCostMonths = new List<(int Year, int Month)>();

            if (DirectCostforecasts.Count > 0)
                DirectCostMonths = helper.GetMonthsBetween(DateOnly.FromDateTime(projectStartDate), DateOnly.FromDateTime(projectEndDate));

            //DirectCostMonths = helper.GetMonthsBetween(DirectCostforecasts.FirstOrDefault(p => p.ProjId == projId).Proj.ProjStartDt.GetValueOrDefault(), DirectCostforecasts.FirstOrDefault(p => p.ProjId == projId).Proj.ProjEndDt.GetValueOrDefault());
            //var projectPlans = Allforecasts
            //                .Select(f => f.PlId).Distinct()
            //                .ToList();

            string[] baseHeadersDirectCost = { "Project_ID", "Type", "Dct_ID", "Org_ID", "Account_ID", "PLC", "EMPL_ID", "Burden", "Revenue" };
            List<string> headersDirectCost = new List<string>(baseHeadersDirectCost);

            // Append dynamic headers
            foreach (var (year, month) in months)
            {
                var dateTime = new DateTime(year, month, 1);

                headersDirectCost.Add($"{dateTime.ToString("MMM").Replace("Sept", "Sep")} {year}");
            }


            var forecastsForDirectCostPlId = DirectCostforecasts
                  .Select(f => new
                  {
                      ProjId = f.ProjId,
                      dctId = f.DctId,
                      Type = f.DirectCost?.Type,
                      PlanId = f.PlId,
                      OrgId = f.DirectCost?.OrgId ?? string.Empty,
                      AccId = f.DirectCost?.AcctId ?? string.Empty,
                      PlcGlcCode = f.DirectCost?.PlcGlc ?? string.Empty,
                      EmplID = f.DirectCost?.Id ?? string.Empty,
                      IsBrd = f.DirectCost?.IsBrd == true ? "TRUE" : "FALSE",
                      Revenue = f.DirectCost?.IsBrd == true ? "TRUE" : "FALSE"
                  }).Distinct()
                  .ToList();

            foreach (var (year, month) in DirectCostMonths)
            {
                headersDirectCost.Append($"Year: {year}, Month: {month}");
            }
            IRow DirectCostheaderRow = DirectCostSheet.CreateRow(1);
            for (int i = 0; i < headersDirectCost.Count; i++)
            {
                DirectCostheaderRow.CreateCell(i).SetCellValue(headersDirectCost[i]);
            }

            distinctPlIds = DirectCostforecasts.Select(f => f.PlId).Distinct();

            rowIndex = 2;

            foreach (var forecast in forecastsForDirectCostPlId)
            {
                IRow row = DirectCostSheet.CreateRow(rowIndex++);
                row.CreateCell(0).SetCellValue(forecast.ProjId);
                row.CreateCell(1).SetCellValue(forecast.Type);
                row.CreateCell(2).SetCellValue(forecast.dctId.GetValueOrDefault());
                row.CreateCell(3).SetCellValue(forecast.OrgId);
                row.CreateCell(4).SetCellValue(forecast.AccId);
                row.CreateCell(5).SetCellValue(forecast.PlcGlcCode);
                row.CreateCell(6).SetCellValue(forecast.EmplID);
                row.CreateCell(7).SetCellValue(forecast.IsBrd);
                row.CreateCell(8).SetCellValue(forecast.Revenue);

                var hours = DirectCostforecasts
                            .Where(p => p.DctId == forecast.dctId && p.PlId == forecast.PlanId && new DateTime(p.Year, p.Month, DateTime.DaysInMonth(p.Year, p.Month)) <= projectEndDate &&
                         new DateTime(p.Year, p.Month, 1) >= projectStartDate)
                            .OrderBy(p => p.Year)
                            .ThenBy(p => p.Month)
                            .ToList();

                int i = 0;
                foreach (var (year, month) in DirectCostMonths)
                {
                    if (type.ToUpper() == "EAC")
                    {
                        //row.CreateCell(8 + i + 1).SetCellValue(hours.FirstOrDefault(p => p.Month == month && p.Year == year)?.Actualamt.ToString());

                        row.CreateCell(8 + i + 1).SetCellValue(Convert.ToDouble(hours.FirstOrDefault(p => p.Month == month && p.Year == year)?.Actualamt));

                    }
                    else
                    {
                        //row.CreateCell(8 + i + 1).SetCellValue(hours.FirstOrDefault(p => p.Month == month && p.Year == year)?.Forecastedamt.ToString());
                        row.CreateCell(8 + i + 1).SetCellValue(Convert.ToDouble(hours.FirstOrDefault(p => p.Month == month && p.Year == year)?.Forecastedamt));
                    }

                    i++;
                }


            }
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            using var stream = new MemoryStream();
            workbook.Write(stream);
            var content = stream.ToArray();

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ExportedData.xlsx");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export plan");
            return StatusCode(500, "An error occurred while exporting the plan." + ex.InnerException.Message);
        }
    }


    [HttpPost("ImportDirectCostPlan")]
    public async Task<IActionResult> ImportDirectCostPlan(IFormFile file)
    {
        bool newImport = false; int closingMonth = 0, closingYear = 0;
        _logger.LogInformation("ImportPlan called");

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var plForecastData = new List<PlForecast>();

        PlProjectPlan plan = new PlProjectPlan();
        string projId = string.Empty, type = string.Empty, version = string.Empty;
        try
        {
            List<PlEmployeee> plEmployees = new List<PlEmployeee>();
            List<PlDct> plDcts = new List<PlDct>();
            var random = new Random();

            using var stream = file.OpenReadStream();
            var workbook = new XSSFWorkbook(stream);
            var sheet = workbook.GetSheet("Hours");

            var infoRow = sheet.GetRow(0);
            if (infoRow != null)
            {
                projId = infoRow.GetCell(1)?.ToString() ?? string.Empty;
                type = infoRow.GetCell(3)?.ToString() ?? string.Empty;
                version = infoRow.GetCell(5)?.ToString() ?? string.Empty;

            }
            if (string.IsNullOrEmpty(version))
            {
                var proj = _context.PlProjects.FirstOrDefault(p => p.ProjId == projId);
                if (proj == null)
                {
                    return NotFound("Project Not Found - " + projId);
                }

                newImport = true;
                plan = await _projPlanService.AddProjectPlanAsync(new PlProjectPlan
                {
                    TemplateId = 1,
                    ProjId = projId,
                    Status = "In Progress",
                    PlType = type,
                    Type = "A",
                    ProjStartDt = proj.ProjStartDt,
                    ProjEndDt = proj.ProjEndDt,
                    Source = "EXCEL"
                }, "Excel");
                version = plan.Version.ToString();
            }

            plan = _context.PlProjectPlans.Where(p => p.ProjId == projId && p.Version == Convert.ToInt32(version) && p.PlType == type).Include(p => p.Proj).FirstOrDefault();

            if (plan.ClosedPeriod.HasValue)
            {
                closingMonth = plan.ClosedPeriod.Value.Month;
                closingYear = plan.ClosedPeriod.Value.Year;
            }

            if (plan != null)
            {
                if (plan?.Status.ToUpper() != "IN PROGRESS")
                {
                    return StatusCode(500, $"Import failed: Budget status is '{plan.Status}' for Project '{projId}' with Version '{version}'. If you want to Import update status to 'Working'");
                }

                plForecastData = _context.PlForecasts.Where(p => p.PlId == plan.PlId).ToList();
            }
            else
            {
                return StatusCode(500, "An error occurred while importing the plan.");
            }

            var project = plan.Proj;
            //int projectDurationMonths = (project.ProjEndDt.GetValueOrDefault().Year -
            //                project.ProjStartDt.GetValueOrDefault().Year) * 12 +
            //                project.ProjEndDt.GetValueOrDefault().Month -
            //                project.ProjStartDt.GetValueOrDefault().Month + 1;

            int projectDurationMonths = (plan.ProjEndDt.GetValueOrDefault().Year -
                plan.ProjStartDt.GetValueOrDefault().Year) * 12 +
                plan.ProjEndDt.GetValueOrDefault().Month -
                plan.ProjStartDt.GetValueOrDefault().Month + 1;

            var emplPeriod = new Dictionary<string, string>();
            var plForecasts = new List<PlForecast>();

            var headerRow = sheet.GetRow(1);

            //Get EMployee List
            var emplList = _context.PlEmployeees.Where(p => p.PlId == plan.PlId).ToList();
            for (int rowIndex = 2; rowIndex <= sheet.LastRowNum; rowIndex++)
            {
                var row = sheet.GetRow(rowIndex);

                if (row.GetCell(2)?.ToString() == "9030910")
                {

                }
                PlEmployeee employee = new PlEmployeee()
                {
                    EmplId = row.GetCell(2)?.ToString() ?? string.Empty,
                    AccId = row.GetCell(4)?.ToString() ?? string.Empty,
                    IsBrd = bool.TryParse(row.GetCell(7)?.ToString(), out bool result) && result,
                    IsRev = bool.TryParse(row.GetCell(8)?.ToString(), out result) && result,
                    PlcGlcCode = row.GetCell(5)?.ToString() ?? string.Empty,
                    OrgId = row.GetCell(3)?.ToString() ?? string.Empty,
                    Type = row.GetCell(1)?.ToString() ?? string.Empty,
                    PlId = plan.PlId,
                    PerHourRate = double.TryParse(row.GetCell(6)?.ToString() ?? string.Empty, out double d) ? (decimal)d : 0m
                };
                //plEmployees.Add(employee);

                var existingEmployee = emplList.Where(p => p.EmplId == employee.EmplId && p.OrgId == employee.OrgId && p.AccId == employee.AccId && p.PlcGlcCode == employee.PlcGlcCode).ToList();

                if (existingEmployee == null || existingEmployee.Count() == 0)
                {
                    string sql1 = "";

                    switch (row.GetCell(1)?.ToString().ToUpper())
                    {

                        case "VENDOREMPLOYEE":
                            employee.Type = "VENDOR EMPLOYEE";
                            sql1 = $@"Select vend_empl_id as EmplId,vend_empl_status as Status, vend_empl_name as FirstName, 0 AS Salary,0 AS PerHourRate, null AS EffectiveDate  
                            from public.vendor_employee where vend_empl_status = 'A' and
                            vend_empl_id = '{employee.EmplId}';";
                            break;
                        case "VENDOR EMPLOYEE":
                            employee.Type = "VENDOR EMPLOYEE";
                            sql1 = $@"Select vend_empl_id as EmplId,vend_empl_status as Status, vend_empl_name as FirstName, 0 AS Salary,0 AS PerHourRate, null AS EffectiveDate  
                            from public.vendor_employee where vend_empl_status = 'A' and
                            vend_empl_id = '{employee.EmplId}';";
                            break;
                        case "VENDOR":
                            employee.Type = "VENDOR";
                            sql1 = $@"Select vend_id as EmplId,vend_empl_status as Status, vend_empl_name as FirstName, 0 AS Salary,0 AS PerHourRate,null AS EffectiveDate  
                            from public.vendor_employee where vend_empl_status = 'A' and
                            vend_id = '{employee.EmplId}';";
                            break;
                        case "OTHER":
                            employee.Type = row.GetCell(1)?.ToString().ToUpper();
                            break;
                        case "EMPLOYEE":
                            employee.Type = "EMPLOYEE";
                            sql1 = $@"
                                SELECT empl.empl_id AS EmplId, 
                                       s_empl_status_cd AS Status, 
                                       last_first_name AS FirstName, 
                                       sal_amt AS Salary,
                                       effect_dt AS EffectiveDate,
                                       hrly_amt AS PerHourRate
                                FROM empl
                                JOIN public.empl_lab_info 
                                    ON empl.empl_id = public.empl_lab_info.empl_id
                                WHERE empl.s_empl_status_cd = 'ACT' and empl.empl_id = '{employee.EmplId}' 
                                  AND public.empl_lab_info.end_dt = '2078-12-31';";
                            break;
                    }

                    if (row.GetCell(1)?.ToString().ToUpper() == "OTHER" || row.GetCell(1)?.ToString().ToUpper() == "PLC")
                    {

                        int number = random.Next(1, 100000); // 1 to 99999

                        if (row.GetCell(1)?.ToString().ToUpper() == "PLC")
                        {
                            employee.EmplId = employee.Type + "_" + number.ToString("D5");
                        }
                        else
                        {
                            employee.EmplId = "TBD_" + number.ToString("D5");
                            employee.FirstName = employee.EmplId;

                        }

                        ////////////////////////////////////////////////////////////////////////////////////////////
                        var entry = _context.PlEmployeees.Add(employee);
                        _context.SaveChanges();
                        employee.Id = entry.Entity.Id;
                    }
                    else
                    {
                        var employeeDetails = _context.Empl_Master
                                            .FromSqlRaw(sql1)
                                            .ToList().FirstOrDefault();

                        if (employeeDetails != null)
                        {
                            if (!string.IsNullOrWhiteSpace(employeeDetails.FirstName))
                            {
                                var names = employeeDetails.FirstName.Split(',', 2);

                                employee.LastName = names[0];
                                employee.FirstName = names.Length > 1 ? names[1] : names[0];
                            }
                            employee.PerHourRate = employeeDetails.PerHourRate;
                            var entry = _context.PlEmployeees.Add(employee);
                            _context.SaveChanges();
                            employee.Id = entry.Entity.Id;
                        }
                        else
                        {
                            //_projPlanService.DeleteProjectPlanAsync(plan.PlId.GetValueOrDefault()).Wait();
                            //_context.PlProjectPlans.Remove(plan);
                            //_context.SaveChanges();
                            throw new Exception("Employee (" + employee.EmplId + ") not found.");
                        }
                    }

                }

                if (employee.Id == 0 && existingEmployee.Count() > 0)
                {
                    employee = existingEmployee.FirstOrDefault();
                }
                //else
                //{
                //    if(employee.Type.ToUpper() == "OTHER")
                //    {
                //        var entry = _context.PlEmployeees.Add(employee);
                //        _context.SaveChanges();
                //        employee.Id = entry.Entity.Id;
                //    }
                //}
                for (int i = 9; i < (9 + projectDurationMonths); i++)
                {
                    try
                    {
                        var period = headerRow.GetCell(i)?.ToString() ?? string.Empty;

                        var cell = row.GetCell(i);
                        decimal forecastedHours = 0;

                        if (cell != null)
                        {
                            switch (cell.CellType)
                            {
                                case NPOI.SS.UserModel.CellType.Numeric:
                                    forecastedHours = (decimal)cell.NumericCellValue;
                                    break;

                                case NPOI.SS.UserModel.CellType.String:
                                    decimal.TryParse(cell.StringCellValue, out forecastedHours);
                                    break;

                                case NPOI.SS.UserModel.CellType.Formula:
                                    if (cell.CachedFormulaResultType == NPOI.SS.UserModel.CellType.Numeric)
                                        forecastedHours = (decimal)cell.NumericCellValue;
                                    else if (cell.CachedFormulaResultType == NPOI.SS.UserModel.CellType.String)
                                        decimal.TryParse(cell.StringCellValue, out forecastedHours);
                                    break;
                            }
                        }


                        DateTime parsedDate = DateTime.ParseExact(period, "MMM yyyy", System.Globalization.CultureInfo.InvariantCulture);
                        if (parsedDate.Month == 8 && parsedDate.Year == 2025)
                        {

                        }
                        if (type.ToUpper() == "EAC")
                        {
                            int month = parsedDate.Month; // 6
                            int year = parsedDate.Year;

                            if (plan.ClosedPeriod < DateOnly.FromDateTime(parsedDate))
                            {

                                if (!string.IsNullOrEmpty(period))
                                {
                                    plForecasts.Add(new PlForecast() { AcctId = employee.AccId, OrgId = employee.OrgId, PlId = plan.PlId.GetValueOrDefault(), empleId = employee.Id, Plc = employee.PlcGlcCode, EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Actualhours = Convert.ToDecimal(forecastedHours) });
                                }
                                else
                                {
                                    plForecasts.Add(new PlForecast() { AcctId = employee.AccId, OrgId = employee.OrgId, PlId = plan.PlId.GetValueOrDefault(), empleId = employee.Id, Plc = employee.PlcGlcCode, EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Actualhours = Convert.ToDecimal(0) });
                                }
                            }
                            else
                            {
                                if (!string.IsNullOrEmpty(period))
                                {
                                    plForecasts.Add(new PlForecast() { AcctId = employee.AccId, OrgId = employee.OrgId, PlId = plan.PlId.GetValueOrDefault(), empleId = employee.Id, Plc = employee.PlcGlcCode, EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Actualhours = forecastedHours, Forecastedhours = forecastedHours });
                                    //plForecasts.Add(new PlForecast() { PlId = plan.PlId.GetValueOrDefault(), EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Forecastedhours = Convert.ToDecimal(row.GetCell(i).ToString()) });
                                }
                                else
                                {
                                    plForecasts.Add(new PlForecast() { AcctId = employee.AccId, OrgId = employee.OrgId, PlId = plan.PlId.GetValueOrDefault(), empleId = employee.Id, Plc = employee.PlcGlcCode, EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Actualhours = Convert.ToDecimal(0), Forecastedhours = forecastedHours });
                                    //plForecasts.Add(new PlForecast() { PlId = plan.PlId.GetValueOrDefault(), EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Forecastedhours = Convert.ToDecimal(0) });
                                }
                            }
                        }
                        else
                        {
                            int month = parsedDate.Month; // 6
                            int year = parsedDate.Year;

                            if (!string.IsNullOrEmpty(period))
                            {
                                plForecasts.Add(new PlForecast() { AcctId = employee.AccId, OrgId = employee.OrgId, PlId = plan.PlId.GetValueOrDefault(), empleId = employee.Id, Plc = employee.PlcGlcCode, EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Forecastedhours = forecastedHours });
                            }
                            else
                            {
                                plForecasts.Add(new PlForecast() { AcctId = employee.AccId, OrgId = employee.OrgId, PlId = plan.PlId.GetValueOrDefault(), empleId = employee.Id, Plc = employee.PlcGlcCode, EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Forecastedhours = Convert.ToDecimal(0) });
                            }
                        }
                    }
                    catch (Exception ex)
                    {

                    }
                }
            }

            ////////////////////////////////////////////////////////Direct COst
            random = new Random();
            var dctList = _context.PlDcts.Select(p => p.DctId).ToList();
            List<PlForecast> plForecastsDirectCost = new List<PlForecast>();

            sheet = workbook.GetSheet("Direct Cost");
            headerRow = sheet.GetRow(1);
            for (int rowIndex = 2; rowIndex <= sheet.LastRowNum; rowIndex++)
            {
                var row = sheet.GetRow(rowIndex);
                PlDct plDct = new PlDct()
                {
                    PlId = plan.PlId.GetValueOrDefault(),
                    DctId = newImport ? 0 : Convert.ToInt32(row.GetCell(2)?.ToString()),
                    AcctId = row.GetCell(4)?.ToString() ?? string.Empty,
                    OrgId = row.GetCell(3)?.ToString() ?? string.Empty,
                    AmountType = row.GetCell(1)?.ToString() ?? string.Empty,
                    IsBrd = bool.TryParse(row.GetCell(7)?.ToString(), out bool result) && result,
                    IsRev = bool.TryParse(row.GetCell(8)?.ToString(), out result) && result,
                    PlcGlc = row.GetCell(5)?.ToString() ?? string.Empty,
                    Id = row.GetCell(6)?.ToString() ?? string.Empty
                };

                if (plDct.DctId == 0)
                {
                    string sql1 = "";
                    switch (row.GetCell(1)?.ToString().ToUpper())
                    {
                        case "VENDOREMPLOYEE":
                            plDct.Type = "VENDOR EMPLOYEE";
                            sql1 = $@"Select vend_empl_id as EmplId,vend_empl_status as Status, vend_empl_name as FirstName, 0 AS Salary,0 AS PerHourRate,null AS EffectiveDate  
                            from public.vendor_employee where vend_empl_status = 'A' and
                            vend_empl_id = '{plDct.Id}';";
                            break;
                        case "VENDOR EMPLOYEE":
                            plDct.Type = "VENDOR EMPLOYEE";
                            sql1 = $@"Select vend_empl_id as EmplId,vend_empl_status as Status, vend_empl_name as FirstName, 0 AS Salary,0 AS PerHourRate,null AS EffectiveDate  
                            from public.vendor_employee where vend_empl_status = 'A' and
                            vend_empl_id = '{plDct.Id}';";
                            break;
                        case "VENDOR":
                            plDct.Type = "VENDOR";
                            sql1 = $@"Select vend_id as EmplId,vend_empl_status as Status, vend_empl_name as FirstName, 0 AS Salary,0 AS PerHourRate,null AS EffectiveDate 
                            from public.vendor_employee where vend_empl_status = 'A' and
                            vend_id = '{plDct.Id}';";
                            break;
                        case "OTHER":
                            plDct.Type = row.GetCell(1)?.ToString().ToUpper();
                            break;
                        case "EMPLOYEE":
                            plDct.Type = "EMPLOYEE";
                            sql1 = $@"
                                SELECT empl.empl_id AS EmplId, 
                                       s_empl_status_cd AS Status, 
                                       last_first_name AS FirstName, 
                                       sal_amt AS Salary,
                                       effect_dt AS EffectiveDate,
                                       hrly_amt AS PerHourRate
                                FROM empl
                                JOIN public.empl_lab_info 
                                    ON empl.empl_id = public.empl_lab_info.empl_id
                                WHERE empl.s_empl_status_cd = 'ACT' and empl.empl_id = '{plDct.Id}'
                                  AND public.empl_lab_info.end_dt = '2078-12-31';";
                            break;
                    }

                    ///////////////////////////////////////////////////////////////////////////////////
                    //var sql1 = $@"
                    //    SELECT empl.empl_id AS EmplId, 
                    //           s_empl_status_cd AS Status, 
                    //           last_first_name AS FirstName, 
                    //           sal_amt AS Salary,
                    //           hrly_amt AS PerHourRate
                    //    FROM empl
                    //    JOIN public.empl_lab_info 
                    //        ON empl.empl_id = public.empl_lab_info.empl_id
                    //    WHERE empl.empl_id = '{plDct.Id}'
                    //      AND public.empl_lab_info.end_dt = '2078-12-31';";

                    if (row.GetCell(1)?.ToString().ToUpper() != "OTHER" && row.GetCell(1)?.ToString().ToUpper() != "PLC")
                    {
                        var employeeDetails = _context.Empl_Master
                        .FromSqlRaw(sql1)
                        .ToList().FirstOrDefault();
                        if (employeeDetails != null && !string.IsNullOrWhiteSpace(employeeDetails.FirstName))
                            plDct.Category = employeeDetails.FirstName;
                        else
                        {
                            //_context.PlProjectPlans.Remove(plan);
                            //_context.SaveChanges();
                            //_projPlanService.DeleteProjectPlanAsync(plan.PlId.GetValueOrDefault()).Wait();
                            throw new Exception("Direct Cost Employee (" + plDct.Id + ") not found.");
                        }
                    }
                    else
                    {
                        //var random = new Random();
                        int number = random.Next(1, 100000); // 1 to 99999

                        if (row.GetCell(1)?.ToString().ToUpper() == "PLC")
                        {
                            plDct.Category = plDct.Type + number.ToString("D5");
                            plDct.Id = plDct.Type + number.ToString("D5");
                        }
                        else
                        {
                            plDct.Category = "TBD_" + number.ToString("D5");
                            plDct.Id = "TBD_" + number.ToString("D5");
                        }
                    }

                }
                plDcts.Add(plDct);

                if (plDct.DctId == 0)
                {
                    for (int i = 9; i < (9 + projectDurationMonths); i++)
                    {
                        try
                        {

                            var period = headerRow.GetCell(i)?.ToString() ?? string.Empty;

                            if (!string.IsNullOrEmpty(period))
                            {
                                DateTime parsedDate = DateTime.ParseExact(period, "MMM yyyy", System.Globalization.CultureInfo.InvariantCulture);

                                if (type.ToUpper() == "EAC")
                                {

                                    if (plan.ClosedPeriod <= DateOnly.FromDateTime(parsedDate))
                                    {
                                        int month = parsedDate.Month; // 6
                                        int year = parsedDate.Year;
                                        var cell = row.GetCell(i);
                                        decimal? cellValue = cell != null && !string.IsNullOrWhiteSpace(cell.ToString())
                                            ? Convert.ToDecimal(cell.ToString())
                                            : null;
                                        if (cellValue != null)
                                            plDct.PlForecasts.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue });
                                        else
                                            plDct.PlForecasts.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue });
                                    }

                                }
                                else
                                {
                                    int month = parsedDate.Month; // 6
                                    int year = parsedDate.Year;
                                    var cell = row.GetCell(i);
                                    decimal? cellValue = cell != null && !string.IsNullOrWhiteSpace(cell.ToString())
                                        ? Convert.ToDecimal(cell.ToString())
                                        : null;
                                    if (cellValue != null)
                                        plDct.PlForecasts.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue });
                                    else
                                        plDct.PlForecasts.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue });
                                }
                            }

                        }
                        catch (Exception ex)
                        {

                        }
                    }

                    var entry = _context.PlDcts.Add(plDct);
                    plDct.DctId = entry.Entity.DctId;
                    _context.SaveChanges();
                    continue;
                }


                for (int i = 9; i < (9 + projectDurationMonths); i++)
                {

                    try
                    {
                        var period = headerRow.GetCell(i)?.ToString() ?? string.Empty;

                        if (!string.IsNullOrEmpty(period))
                        {
                            DateTime parsedDate = DateTime.ParseExact(period, "MMM yyyy", System.Globalization.CultureInfo.InvariantCulture);

                            if (type.ToUpper() == "EAC")
                            {
                                if (plan.ClosedPeriod < DateOnly.FromDateTime(parsedDate))
                                {
                                    int month = parsedDate.Month; // 6
                                    int year = parsedDate.Year;

                                    if (parsedDate.Month == 8 && parsedDate.Year == 2025)
                                    {

                                    }
                                    var cell = row.GetCell(i);
                                    decimal? cellValue = cell != null && !string.IsNullOrWhiteSpace(cell.ToString())
                                        ? Convert.ToDecimal(cell.ToString())
                                        : null;
                                    if (cellValue != null)
                                        plForecastsDirectCost.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue, Actualamt = cellValue });
                                    else
                                        plForecastsDirectCost.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue, Actualamt = 0 });
                                }
                            }
                            else
                            {

                                int month = parsedDate.Month; // 6
                                int year = parsedDate.Year;
                                if (month == 2 && year == 2026)
                                {

                                }

                                var cell = row.GetCell(i);
                                decimal? cellValue = cell != null && !string.IsNullOrWhiteSpace(cell.ToString())
                                    ? Convert.ToDecimal(cell.ToString())
                                    : null;
                                if (cellValue != null)
                                    plForecastsDirectCost.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue });
                                else
                                    plForecastsDirectCost.Add(new PlForecast() { AcctId = plDct.AcctId, OrgId = plDct.OrgId, PlId = plan.PlId.GetValueOrDefault(), DctId = plDct.DctId, ProjId = projId, Year = year, Month = month, Forecastedamt = cellValue });
                            }
                        }
                    }
                    catch (Exception ex)
                    {

                    }
                }

            }

            var dctsToRemove = dctList.Except(plDcts.Select(p => p.DctId).ToList()).ToList();

            if (!newImport)
            {
                List<PlForecast> newFOrcast = new List<PlForecast>();

                var updatedList = plForecastData
                            .Select(t =>
                            {
                                if (type.ToUpper() == "EAC")
                                {
                                    var source = plForecasts.FirstOrDefault(s => s.Plc == t.Plc && s.AcctId == t.AcctId && s.OrgId == t.OrgId && s.PlId == t.PlId && s.EmplId == t.EmplId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId && (new DateOnly(s.Year, s.Month, 1) >= plan.ClosedPeriod.GetValueOrDefault()));
                                    if (source != null)
                                    {
                                        t.Actualhours = source.Actualhours;
                                        t.Forecastedhours = source.Actualhours;
                                    }
                                }
                                else
                                {
                                    var source = plForecasts.FirstOrDefault(s => s.Plc == t.Plc && s.AcctId == t.AcctId && s.OrgId == t.OrgId && s.PlId == t.PlId && s.EmplId == t.EmplId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId);
                                    if (source != null)
                                    {
                                        t.Forecastedhours = source.Forecastedhours;
                                        t.Actualhours = source.Actualhours;
                                    }
                                }
                                return t;
                            }).ToList();


                var updatedListForDirectCost = updatedList
                           .Select(t =>
                           {
                               if (type.ToUpper() == "EAC")
                               {
                                   var source = plForecastsDirectCost.FirstOrDefault(s => s.PlId == t.PlId && s.DctId == t.DctId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId && (new DateOnly(s.Year, s.Month, 1) >= plan.ClosedPeriod.GetValueOrDefault()));
                                   if (source != null)
                                   {
                                       t.Actualamt = source.Actualamt;
                                       t.Forecastedamt = source.Actualamt;

                                   }
                               }
                               else
                               {
                                   var source = plForecastsDirectCost.FirstOrDefault(s => s.PlId == t.PlId && s.DctId == t.DctId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId);
                                   if (source != null)
                                   {
                                       t.Forecastedamt = source.Forecastedamt;
                                       t.Actualamt = source.Actualamt;

                                   }
                               }
                               return t;
                           }).ToList();


                List<PlForecast> newHoursForecast = new List<PlForecast>();
                newHoursForecast = updatedList.Where(p => p.Forecastid == 0 && p.EmplId != null).ToList();

                var test = plForecasts
                            .Select(t =>
                            {
                                var source = updatedList.Where(p => p.EmplId != null).FirstOrDefault(s => s.PlId == t.PlId && s.EmplId == t.EmplId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId && s.Plc == t.Plc);
                                if (source == null)
                                {
                                    newHoursForecast.Add(t);
                                }
                                return t;
                            }).ToList();


                test = plForecastsDirectCost
               .Select(t =>
               {
                   var source = updatedList.Where(p => p.EmplId == null).FirstOrDefault(s => s.PlId == t.PlId && s.DctId == t.DctId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId);
                   if (source == null)
                   {
                       newFOrcast.Add(t);
                   }
                   return t;
               }).ToList();
                _context.PlForecasts.AddRange(newHoursForecast);
                _context.PlForecasts.AddRange(newFOrcast);

                _context.PlForecasts.UpdateRange(updatedListForDirectCost);
            }
            else
            {
                _context.PlForecasts.UpdateRange(plForecasts);
            }
            _context.SaveChanges();
            var itemsToRemove = _context.PlDcts.Where(p => dctsToRemove.Contains(p.DctId)).ToList();
            var forecastsToRemove = _context.PlForecasts.Where(p => dctsToRemove.Contains(p.DctId.GetValueOrDefault())).ToList();

            if (itemsToRemove.Count > 0)
            {
                //_context.PlForecasts.RemoveRange(forecastsToRemove);
                //_context.PlDcts.RemoveRange(itemsToRemove);
            }
            //_context.SaveChanges();

            PlForecastRepository plForecastRepository = new PlForecastRepository(_context);
            await plForecastRepository.CalculateRevenueCost(plan.PlId.GetValueOrDefault(), plan.TemplateId.GetValueOrDefault(), plan.PlType);

            if (newImport)
            {
                var responseMessage = "Successfully Imported and Created new '" + ((type == "BUD") ? "Budget" : "EAC") + "' for Project - '" + project.ProjName + "' with Version - '" + plan?.Version + "'";
                _logger.LogInformation(responseMessage);
                return Ok(responseMessage);
            }
            else
            {
                var responseMessage = "Successfully Imported and Updated existing '" + ((type == "BUD") ? "Budget" : "EAC") + "' for Project - '" + project.ProjName + "' Having version - '" + version + "'";
                _logger.LogInformation(responseMessage);
                return Ok(responseMessage);
            }
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException is PostgresException pgEx &&
                pgEx.SqlState == PostgresErrorCodes.UniqueViolation)
            {
                var formatted = FormatPgDetail(pgEx.Detail);
                if (newImport)
                    _projPlanService.DeleteProjectPlanAsync(plan.PlId.GetValueOrDefault()).Wait();
                return Conflict(formatted);
            }

            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import plan" + ex.Message);
            if (newImport)
                _projPlanService.DeleteProjectPlanAsync(plan.PlId.GetValueOrDefault()).Wait();
            return StatusCode(500, ex.Message);
        }
    }

    private static object FormatPgDetail(string detail)
    {
        // Key (id, acctid, orgid, pl_id)=(1003128, 50-400-000, 1.01.03.01, 645) already exists.

        var match = Regex.Match(detail, @"\((.*?)\)=\((.*?)\)");

        if (!match.Success)
        {
            return new
            {
                message = "Record already exists."
            };
        }

        var keys = match.Groups[1].Value.Split(", ");
        var values = match.Groups[2].Value.Split(", ");

        var dict = keys.Zip(values, (k, v) => new { k, v })
                       .Where(x => !string.Equals(x.k, "pl_id", StringComparison.OrdinalIgnoreCase))
                       .ToDictionary(x => x.k, x => x.v);

        return new
        {
            message = "A record already exists with the following values:",
            details = dict
        };
    }

    [HttpPost("ImportPlan")]
    public async Task<IActionResult> ImportPlan(IFormFile file)
    {
        bool newImport = false;
        _logger.LogInformation("ImportPlan called");

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var plForecastData = new List<PlForecast>();

        PlProjectPlan plan = new PlProjectPlan();
        string projId = string.Empty, type = string.Empty, version = string.Empty;
        try
        {
            using var stream = file.OpenReadStream();
            var workbook = new XSSFWorkbook(stream);
            var sheet = workbook.GetSheetAt(0);

            var infoRow = sheet.GetRow(0);
            if (infoRow != null)
            {
                projId = infoRow.GetCell(1)?.ToString() ?? string.Empty;
                type = infoRow.GetCell(3)?.ToString() ?? string.Empty;
                version = infoRow.GetCell(5)?.ToString() ?? string.Empty;
            }
            if (string.IsNullOrEmpty(version))
            {
                newImport = true;
                plan = await _projPlanService.AddProjectPlanAsync(new PlProjectPlan
                {
                    ProjId = projId,
                    Status = "Working",
                    PlType = type,
                    Type = "EXCEL",
                    Source = "EXCEL"
                }, "excel");
                version = plan.Version.ToString();
            }

            plan = _context.PlProjectPlans.Where(p => p.ProjId == projId && p.Version == Convert.ToInt32(version) && p.PlType == type).Include(p => p.Proj).FirstOrDefault();

            if (plan != null)
            {
                plForecastData = _context.PlForecasts.Where(p => p.PlId == plan.PlId && p.EmplId != null).ToList();
            }
            else
            {
                return StatusCode(500, "An error occurred while importing the plan.");
            }

            var project = plan.Proj;
            int projectDurationMonths = (project.ProjEndDt.GetValueOrDefault().Year -
                            project.ProjStartDt.GetValueOrDefault().Year) * 12 +
                            project.ProjEndDt.GetValueOrDefault().Month -
                            project.ProjStartDt.GetValueOrDefault().Month + 1;

            var emplPeriod = new Dictionary<string, string>();
            var plForecasts = new List<PlForecast>();

            var headerRow = sheet.GetRow(1);

            //Get EMployee List
            List<PlEmployee> plEmployees = new List<PlEmployee>();
            for (int rowIndex = 2; rowIndex <= sheet.LastRowNum; rowIndex++)
            {
                var row = sheet.GetRow(rowIndex);
                PlEmployee employee = new PlEmployee()
                {
                    EmplId = row.GetCell(2)?.ToString() ?? string.Empty,
                    AccId = row.GetCell(4)?.ToString() ?? string.Empty,
                    OrgId = row.GetCell(3)?.ToString() ?? string.Empty
                };
                for (int i = 9; i < (9 + projectDurationMonths); i++)
                {
                    var period = headerRow.GetCell(i)?.ToString() ?? string.Empty;

                    if (!string.IsNullOrEmpty(period))
                    {
                        DateTime parsedDate = DateTime.ParseExact(period, "MMM yyyy", System.Globalization.CultureInfo.InvariantCulture);

                        int month = parsedDate.Month; // 6
                        int year = parsedDate.Year;
                        plForecasts.Add(new PlForecast() { PlId = plan.PlId.GetValueOrDefault(), EmplId = employee.EmplId, ProjId = projId, Year = year, Month = month, Forecastedhours = Convert.ToDecimal(row.GetCell(i).ToString()) });
                    }
                }
            }

            if (!newImport)
            {
                var updatedList = plForecastData
                            .Select(t =>
                            {
                                var source = plForecasts.FirstOrDefault(s => s.PlId == t.PlId && s.EmplId == t.EmplId && s.Month == t.Month && s.Year == t.Year && s.ProjId == t.ProjId);
                                if (source != null)
                                {
                                    t.Forecastedhours = source.Forecastedhours;
                                }
                                return t;
                            }).ToList();

                _context.PlForecasts.UpdateRange(updatedList);
            }
            else
            {
                _context.PlForecasts.UpdateRange(plForecasts);
            }
            _context.SaveChanges();
            if (newImport)
            {
                var responseMessage = "Successfully Imported and Created new '" + ((type == "BUD") ? "Budget" : "EAC") + "' for Project - '" + project.ProjName + "' with Version - '" + plan?.Version + "'";
                _logger.LogInformation(responseMessage);
                return Ok(responseMessage);
            }
            else
            {
                var responseMessage = "Successfully Imported and Updated existing '" + ((type == "BUD") ? "Budget" : "EAC") + "' for Project - '" + project.ProjName + "' Having version - '" + version + "'";
                _logger.LogInformation(responseMessage);
                return Ok(responseMessage);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import plan" + ex.Message);
            return StatusCode(500, "An error occurred while importing the plan.");
        }
    }


    [HttpGet("CalculateCost")]
    public async Task<IActionResult> CalculateCost(int planID, int templateId, string type)
    {
        _logger.LogInformation("CalculateCost called for planID {PlanID}, templateId {TemplateId}, type {Type}", planID, templateId, type);

        try
        {
            var employeeCosts = await _pl_ForecastService.CalculateCost(planID, templateId, type);
            //await BulkUpsertProjForecastSummary(employeeCosts.Proj_Id, employeeCosts.Type, employeeCosts.Version);
            return Ok(employeeCosts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cost");
            return StatusCode(500, "An error occurred while calculating the cost.");
        }
    }

    [HttpGet("CalculateRevenueCost")]
    public async Task<IActionResult> CalculateRevenueCost(int planID, int templateId, string type)
    {
        _logger.LogInformation("CalculateCost called for planID {PlanID}, templateId {TemplateId}, type {Type}", planID, templateId, type);

        try
        {
            var employeeCosts = await _pl_ForecastService.CalculateRevenueCost(planID, templateId, type);
            //await BulkUpsertProjForecastSummary(employeeCosts.Proj_Id, employeeCosts.Type, employeeCosts.Version);
            return Ok(employeeCosts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cost");
            return StatusCode(500, "An error occurred while calculating the cost.");
        }
    }

    [HttpPost("CalculateRevenueCostForSelectedHours")]
    public async Task<IActionResult> CalculateRevenueCostForSelectedHours(int planID, int templateId, string type, List<PlForecast> hoursForecast)
    {
        _logger.LogInformation("CalculateCost called for planID {PlanID}, templateId {TemplateId}, type {Type}", planID, templateId, type);

        try
        {
            var employeeCosts = await _pl_ForecastService.CalculateRevenueCostForSelectedHours(planID, templateId, type, hoursForecast);
            await BulkUpsertProjForecastSummary(employeeCosts.Proj_Id, employeeCosts.Type, employeeCosts.Version);
            return Ok(employeeCosts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cost");
            return StatusCode(500, "An error occurred while calculating the cost.");
        }
    }

    [HttpGet("GetMonthlyData")]
    public async Task<IActionResult> GetMonthlyData(int planID, string planType)
    {
        try
        {
            //var forecastsDirectCosts = await _context.PlForecasts
            //    .Where(f => f.PlId == planID)
            //    .GroupBy(p => new { p.Month, p.Year })
            //    .Select(g => new MonthlyData
            //    {
            //        Month = g.Key.Month,
            //        Year = g.Key.Year,
            //        LaborCost = g.Sum(x => x.DctId == null ? x.Cost : 0),
            //        NonLaborCost = g.Sum(x => x.DctId != null ? x.Cost : 0),
            //        Revenue = g.Sum(x => x.Revenue),
            //        Fringe = g.Sum(x => x.Fringe),
            //        Mnh = g.Sum(x => x.Materials),
            //        Overhead = g.Sum(x => x.Overhead),
            //        Gna = g.Sum(x => x.Gna),
            //        Hr = g.Sum(x => x.Hr)
            //    })
            //    .ToListAsync();

            var forecastsDirectCosts = await _context.PlForecasts
                .Where(f => f.PlId == planID)
                .GroupBy(p => new { p.Month, p.Year })
                .Select(g => new MonthlyData
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    LaborCost = g.Sum(x => x.DctId == null ? x.Cost : 0),
                    //NonLaborCost = g.Sum(x => x.DctId != null ? x.Cost : 0),
                    NonLaborCost = g.Sum(x => x.DctId != null
                    ? (planType.ToUpper() == "BUD" || planType.ToUpper() == "NBBUD"
                        ? x.Forecastedamt
                        : x.Actualamt)
                    : 0).GetValueOrDefault(),
                    Revenue = g.Sum(x => x.Revenue),
                    Fringe = g.Sum(x => x.Fringe),
                    Mnh = g.Sum(x => x.Materials),
                    Overhead = g.Sum(x => x.Overhead),
                    Gna = g.Sum(x => x.Gna),
                    Hr = g.Sum(x => x.Hr),
                    Hours = g.Sum(x => planType.ToUpper() == "BUD" || planType.ToUpper() == "NBBUD" ? x.Forecastedhours : x.Actualhours)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();
            return Ok(forecastsDirectCosts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cost");
            return StatusCode(500, "An error occurred while calculating the cost.");
        }
    }


    [HttpGet("GetMonthlyDataV1")]
    public async Task<IActionResult> GetMonthlyDataV1(int planID, string planType)
    {
        try
        {
            List<IndirectRates> indirectRates = new List<IndirectRates>();
            //var MonthlyData = await _context.PlForecasts
            //        .Where(f => f.PlId == planID)
            //        .GroupBy(p => new { p.Month, p.Year})
            //        .Select(g => new MonthlyDataV1
            //        {
            //            Month = g.Key.Month,
            //            Year = g.Key.Year,
            //            LaborCost = g.Sum(x => x.DctId == null ? x.Cost : 0),
            //            //NonLaborCost = g.Sum(x => x.DctId != null ? x.Cost : 0),
            //            NonLaborCost = g.Sum(x => x.DctId != null
            //            ? (planType.ToUpper() == "BUD" || planType.ToUpper() == "NBBUD"
            //                ? x.Forecastedamt
            //                : x.Actualamt)
            //            : 0).GetValueOrDefault(),
            //            Revenue = g.Sum(x => x.Revenue),
            //            Fringe = g.Sum(x => x.Fringe),
            //            Mnh = g.Sum(x => x.Materials),
            //            Overhead = g.Sum(x => x.Overhead),
            //            Gna = g.Sum(x => x.Gna),
            //            Hr = g.Sum(x => x.Hr),
            //            Hours = g.Sum(x => planType.ToUpper() == "BUD" || planType.ToUpper() == "NBBUD" ? x.Forecastedhours : x.Actualhours)
            //        })
            //        .OrderBy(x => x.Year)
            //        .ThenBy(x => x.Month)
            //        .ToListAsync();

            var forecastsDirectCosts = await _context.PlForecasts
                .Where(f => f.PlId == planID)
                .GroupBy(p => new { p.Month, p.Year, p.OrgId, p.AcctId })
                .Select(g => new MonthlyDataV1
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    OrgId = g.Key.OrgId,
                    AcctId = g.Key.AcctId,
                    LaborCost = g.Sum(x => x.DctId == null ? x.Cost : 0),
                    //NonLaborCost = g.Sum(x => x.DctId != null ? x.Cost : 0),
                    NonLaborCost = g.Sum(x => x.DctId != null
                    ? (planType.ToUpper() == "BUD" || planType.ToUpper() == "NBBUD"
                        ? x.Forecastedamt
                        : x.Actualamt)
                    : 0).GetValueOrDefault(),
                    Revenue = g.Sum(x => x.Revenue),
                    Fringe = g.Sum(x => x.Fringe),
                    Mnh = g.Sum(x => x.Materials),
                    Overhead = g.Sum(x => x.Overhead),
                    Gna = g.Sum(x => x.Gna),
                    Hr = g.Sum(x => x.Hr),
                    Hours = g.Sum(x => planType.ToUpper() == "BUD" || planType.ToUpper() == "NBBUD" ? x.Forecastedhours : x.Actualhours)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            var MonthlyData = forecastsDirectCosts
               .GroupBy(p => new { p.Month, p.Year })
               .Select(g => new MonthlyDataV2
               {
                   Month = g.Key.Month,
                   Year = g.Key.Year,
                   LaborCost = g.Sum(x => x.LaborCost),
                   //NonLaborCost = g.Sum(x => x.DctId != null ? x.Cost : 0),
                   NonLaborCost = g.Sum(x => x.NonLaborCost),
                   Hours = g.Sum(x => x.Hours)
               })
               .OrderBy(x => x.Year)
               .ThenBy(x => x.Month)
               .ToList();

            var keys = forecastsDirectCosts
                    .Select(c => $"{c.OrgId}|{c.AcctId}")
                    .ToList();
            var result = _context.PlOrgAcctPoolMappings
                         .Where(plm => keys.Contains(plm.OrgId + "|" + plm.AccountId))
                         .Join(_context.AccountGroups,
                             plm => plm.PoolId,
                             pool => pool.Code,
                             (plm, pool) => new
                             {
                                 plm.OrgId,
                                 plm.AccountId,
                                 pool.Code,
                                 pool.Name,
                                 pool.Type
                             })
                         .Distinct()
                         .ToList();

            // ✅ Create lookup dictionary
            var poolLookup = result
                .GroupBy(x => (x.OrgId, x.AccountId))
                .ToDictionary(g => g.Key, g => g.ToList());

            var pools = _context.AccountGroups.Where(p => p.PoolNo != null).ToList();

            var specialMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["MNH"] = "MaterialsName"
            };

            foreach (var employee in forecastsDirectCosts)
            {
                poolLookup.TryGetValue((employee.OrgId, employee.AcctId), out var actualPools);
                if (actualPools != null)
                {
                    foreach (var pool in actualPools)
                    {
                        if (string.IsNullOrWhiteSpace(pool.Type))
                            continue;

                        var propertyName = specialMap.ContainsKey(pool.Type)
                            ? specialMap[pool.Type]
                            : char.ToUpper(pool.Type[0])
                              + pool.Type.Substring(1).ToLower()
                              + "Name";

                        var property = employee.GetType().GetProperty(propertyName);

                        if (property != null && property.CanWrite)
                            property.SetValue(employee, pool.Name);
                    }
                }
            }

            var MonthlyOverhead = forecastsDirectCosts
                .Where(p => !string.IsNullOrWhiteSpace(p.OverheadName))
                .GroupBy(p => new { p.Month, p.Year, p.OverheadName })
                .Select(g => new IndirectRates
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    Name = g.Key.OverheadName!,
                    Value = g.Sum(x => x.Overhead)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            var MonthlyFringe = forecastsDirectCosts
                .Where(p => !string.IsNullOrWhiteSpace(p.FringeName))
                .GroupBy(p => new { p.Month, p.Year, p.FringeName })
                .Select(g => new IndirectRates
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    Name = g.Key.FringeName!,
                    Value = g.Sum(x => x.Fringe)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            var MonthlyMnh = forecastsDirectCosts
                .Where(p => !string.IsNullOrWhiteSpace(p.MaterialsName))
                .GroupBy(p => new { p.Month, p.Year, p.MaterialsName })
                .Select(g => new IndirectRates
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    Name = g.Key.MaterialsName,
                    Value = g.Sum(x => x.Mnh)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            var MonthlyGna = forecastsDirectCosts
                .Where(p => !string.IsNullOrWhiteSpace(p.GnaName))
                .GroupBy(p => new { p.Month, p.Year, p.GnaName })
                .Select(g => new IndirectRates
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    Name = g.Key.GnaName,
                    Value = g.Sum(x => x.Gna)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToList();

            foreach (var data in MonthlyData)
            {
                data.IndirectCost = new List<PlanningAPI.Helpers.Indirect>();
                if (MonthlyOverhead.Any())
                {
                    data.IndirectCost.AddRange(
                        MonthlyOverhead
                            .Where(p => p.Month == data.Month && p.Year == data.Year)
                            .Select(g => new PlanningAPI.Helpers.Indirect
                            {
                                Name = g.Name,
                                Value = g.Value
                            })
                            .ToList());
                }
                if (MonthlyFringe.Any())
                {
                    data.IndirectCost.AddRange(
                        MonthlyFringe
                            .Where(p => p.Month == data.Month && p.Year == data.Year)
                            .Select(g => new PlanningAPI.Helpers.Indirect
                            {
                                Name = g.Name,
                                Value = g.Value
                            })
                            .ToList());
                }
                if (MonthlyMnh.Any())
                {
                    data.IndirectCost.AddRange(
                        MonthlyMnh
                            .Where(p => p.Month == data.Month && p.Year == data.Year)
                            .Select(g => new PlanningAPI.Helpers.Indirect
                            {
                                Name = g.Name,
                                Value = g.Value
                            })
                            .ToList());
                }
                if (MonthlyGna.Any())
                {
                    data.IndirectCost.AddRange(
                        MonthlyGna
                            .Where(p => p.Month == data.Month && p.Year == data.Year)
                            .Select(g => new PlanningAPI.Helpers.Indirect
                            {
                                Name = g.Name,
                                Value = g.Value
                            })
                            .ToList());
                }
            }
            return Ok(MonthlyData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cost");
            return StatusCode(500, "An error occurred while calculating the cost.");
        }
    }

    [HttpGet("GenerateForecastReport")]
    public async Task<IActionResult> GenerateForecastReport(int planID, int templateId, string type)
    {
        _logger.LogInformation("CalculateCost called for planID {PlanID}, templateId {TemplateId}, type {Type}", planID, templateId, type);
        try
        {
            var forecast = await _pl_ForecastService.CalculateCost(planID, templateId, type); ;

            var aiInsight = await _aiService.GetForecastInsightAsync(forecast);

            // 2. Generate PDF
            var report = new ForecastReport(forecast, aiInsight);
            var pdfBytes = report.GeneratePdf();

            // 3. Return PDF as downloadable file
            return File(pdfBytes, "application/pdf", $"{forecast.Proj_Id}_ForecastReport.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to calculate cost");
            return StatusCode(500, "An error occurred while calculating the cost.");
        }
    }

    [HttpPost("generate-variance-report-V2")]
    public async Task<IActionResult> GenerateVarianceReport(
       [FromQuery] int versionA,
       [FromQuery] int versionB)
    {
        List<ProjForecastSummary> forecastList = _context.ProjForecastSummary
            .Where(f => f.ProjId == "22003.T.0069.00" && (f.Version == versionA || f.Version == versionB) && f.PlType.ToUpper() == "EAC")
            .ToList();
        if (forecastList == null || !forecastList.Any())
            return BadRequest("Forecast data is required.");

        // -------------------------------
        // 1️⃣ Calculate variance between versions
        // -------------------------------
        //var grouped = forecastList
        //    .GroupBy(f => new { f.PlType, f.ProjId, f.Month, f.Year});

        var grouped = forecastList
            .GroupBy(f => new { f.ProjId, f.Month, f.Year })
            .OrderBy(g => g.Key.Year)
            .ThenBy(g => g.Key.Month);

        var varianceData = new List<VarianceComparison>();

        foreach (var g in grouped)
        {
            var versions = g.ToDictionary(f => f.Version, f => f);
            if (versions.ContainsKey(versionA) && versions.ContainsKey(versionB))
            {
                var a = versions[versionA];
                var b = versions[versionB];

                //varianceData.Add(new VarianceComparison
                //{
                //    ProjId = a.ProjId,
                //    PlType = a.PlType,
                //    Month = a.Month,
                //    Year = a.Year,
                //    ForecastedCostDiff = b.MonthlyForecastedAmt - a.MonthlyForecastedAmt,
                //    ActualCostDiff = b.MonthlyActualAmt - a.MonthlyActualAmt,
                //    ForecastedHoursDiff = b.MonthlyForecastedHours - a.MonthlyForecastedHours,
                //    ActualHoursDiff = b.MonthlyActualHours - a.MonthlyActualHours,
                //    RevenueDiff = b.MonthlyRevenue - a.MonthlyRevenue
                //});
                varianceData.Add(new VarianceComparison
                {
                    ProjId = a.ProjId,
                    PlType = a.PlType,
                    Month = a.Month,
                    Year = a.Year,

                    // Just assign A & B values
                    ForecastedCostA = a.MonthlyForecastedAmt,
                    ActualCostA = a.MonthlyActualAmt,
                    ForecastedHoursA = a.MonthlyForecastedHours,
                    ActualHoursA = a.MonthlyActualHours,
                    RevenueA = a.MonthlyRevenue,

                    ForecastedCostB = b.MonthlyForecastedAmt,
                    ActualCostB = b.MonthlyActualAmt,
                    ForecastedHoursB = b.MonthlyForecastedHours,
                    ActualHoursB = b.MonthlyActualHours,
                    RevenueB = b.MonthlyRevenue
                });

            }
        }

        // -------------------------------
        // 2️⃣ AI summary per PlType
        // -------------------------------
        var aiSummaries = new Dictionary<string, string>();
        var byPlType = varianceData.GroupBy(v => v.PlType);

        foreach (var group in byPlType)
        {
            var summary = await _aiService.GetVarianceSummaryAsync(group.Key, versionA, versionB, group.ToList());
            aiSummaries[group.Key] = summary;
        }

        // -------------------------------
        // 3️⃣ Generate PDF (VarianceReport class handles table + AI summary)
        // -------------------------------
        var report = new VarianceReport(varianceData, aiSummaries, versionA, versionB);
        var pdfBytes = report.GeneratePdf();

        return File(pdfBytes, "application/pdf", $"VarianceReport_V{versionA}_V{versionB}.pdf");
    }

    [HttpPost("GenerateVarianceReportForBudgetVsEAC")]
    public async Task<IActionResult> GenerateVarianceReportForBudgetVsEAC([FromQuery] string ProjId,
   [FromQuery] int BudgetVersion,
   [FromQuery] int EACVersion)
    {
        List<ProjForecastSummary> forecastList = _context.ProjForecastSummary
            .Where(f => f.ProjId == ProjId && ((f.Version == BudgetVersion && f.PlType == "BUD") || (f.Version == EACVersion && f.PlType == "EAC")))
            .ToList();
        if (forecastList == null || !forecastList.Any())
            return BadRequest("Forecast data is required.");

        // -------------------------------
        // 1️⃣ Calculate variance between versions
        // -------------------------------
        //var grouped = forecastList
        //    .GroupBy(f => new {f.ProjId, f.Month, f.Year });
        var grouped = forecastList
                    .GroupBy(f => new { f.ProjId, f.Month, f.Year })
                    .OrderBy(g => g.Key.Year)
                    .ThenBy(g => g.Key.Month);

        var varianceData = new List<VarianceComparison>();

        foreach (var g in grouped)
        {
            var versions = g.ToDictionary(f => f.Version, f => f);
            if (versions.ContainsKey(BudgetVersion) && versions.ContainsKey(EACVersion))
            {
                var a = versions[BudgetVersion];
                var b = versions[EACVersion];

                //varianceData.Add(new VarianceComparison
                //{
                //    ProjId = a.ProjId,
                //    PlType = a.PlType,
                //    Month = a.Month,
                //    Year = a.Year,
                //    ForecastedCostDiff = b.MonthlyForecastedAmt - a.MonthlyForecastedAmt,
                //    ActualCostDiff = b.MonthlyActualAmt - a.MonthlyActualAmt,
                //    ForecastedHoursDiff = b.MonthlyForecastedHours - a.MonthlyForecastedHours,
                //    ActualHoursDiff = b.MonthlyActualHours - a.MonthlyActualHours,
                //    RevenueDiff = b.MonthlyRevenue - a.MonthlyRevenue
                //});
                varianceData.Add(new VarianceComparison
                {
                    ProjId = a.ProjId,
                    PlType = a.PlType,
                    Month = a.Month,
                    Year = a.Year,

                    // Just assign A & B values
                    ForecastedCostA = a.MonthlyForecastedAmt,
                    ActualCostA = a.MonthlyActualAmt,
                    ForecastedHoursA = a.MonthlyForecastedHours,
                    ActualHoursA = a.MonthlyActualHours,
                    RevenueA = a.MonthlyRevenue,

                    ForecastedCostB = b.MonthlyForecastedAmt,
                    ActualCostB = b.MonthlyActualAmt,
                    ForecastedHoursB = b.MonthlyForecastedHours,
                    ActualHoursB = b.MonthlyActualHours,
                    RevenueB = b.MonthlyRevenue
                });

            }
        }

        // -------------------------------
        // 2️⃣ AI summary per PlType
        // -------------------------------
        var aiSummaries = new Dictionary<string, string>();
        var byPlType = varianceData.GroupBy(v => v.PlType);

        foreach (var group in byPlType)
        {
            var summary = await _aiService.GetVarianceSummaryAsync(group.Key, BudgetVersion, EACVersion, group.ToList());
            aiSummaries[group.Key] = summary;
        }

        // -------------------------------
        // 3️⃣ Generate PDF (VarianceReport class handles table + AI summary)
        // -------------------------------
        var report = new VarianceReport(varianceData, aiSummaries, BudgetVersion, EACVersion);
        var pdfBytes = report.GeneratePdf();

        return File(pdfBytes, "application/pdf", $"VarianceReport_V{BudgetVersion}_V{EACVersion}.pdf");
    }

    public class ForecastSummaryDto
    {
        public string ProjId { get; set; }
        public string PlType { get; set; }
        public int Version { get; set; }
        public string AcctId { get; set; }
        public string AccountName { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCost { get; set; }
        public decimal TotalBurden { get; set; }
    }


    [HttpPost("export-revenue-summary")]
    public async Task<IActionResult> ExportRevenueSummary(int planID, int templateId, string type)
    {

        var result = await (
            from f in _context.PlForecasts
            join a in _context.Accounts on f.AcctId equals a.AcctId
            join p in _context.PlProjectPlans on f.PlId equals p.PlId
            where p.ProjId == "22003.T.0069.00" && f.Month == 8 && f.Year == 2024 &&
                  (
                      (p.PlType == "EAC" && p.Version == 2) ||
                      (p.PlType == "BUD" && p.Version == 2)
                  )
            group new { f, a, p } by new
            {
                p.ProjId,
                p.PlType,
                p.Version,
                f.AcctId,
                a.AcctName
            } into g
            select new ForecastSummaryDto
            {
                ProjId = g.Key.ProjId,
                PlType = g.Key.PlType,
                Version = g.Key.Version.GetValueOrDefault(),
                AcctId = g.Key.AcctId,
                AccountName = g.Key.AcctName,
                TotalRevenue = g.Sum(x => x.f.Revenue),
                TotalCost = g.Sum(x => x.f.Cost),
                TotalBurden = g.Sum(x => x.f.Burden)
            }
        ).ToListAsync();






        var data = await _pl_ForecastService.CalculateCost(planID, templateId, type);
        var report = new RevenueAnalysisReport(data);
        var pdf = report.GeneratePdf();
        return File(pdf, "application/pdf", "RevenueSummary.pdf");
    }


    [HttpPost("ImportPlan_Ver1")]
    public async Task<IActionResult> ImportPlan_Ver1(IFormFile file)
    {
        _logger.LogInformation("ImportPlan_Ver1 called");

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var plForecastData = new List<PlForecast>();
        int plID = 0;

        try
        {
            using var stream = file.OpenReadStream();
            var workbook = new XSSFWorkbook(stream);
            var sheet = workbook.GetSheetAt(0);

            var plForecasts = new List<PlForecast>();

            for (int rowIndex = 1; rowIndex <= sheet.LastRowNum; rowIndex++)
            {
                var row = sheet.GetRow(rowIndex);
                if (row == null) continue;

                var dateValue = DateOnly.Parse(row.GetCell(1)?.ToString() ?? DateTime.Now.ToString());

                var forecast = new PlForecast
                {
                    ProjId = row.GetCell(0)?.ToString() ?? string.Empty,
                    EmplId = row.GetCell(3)?.ToString() ?? string.Empty,
                    Forecastedhours = decimal.TryParse(row.GetCell(8)?.ToString(), out var hours) ? hours : 0,
                    Forecastedamt = decimal.TryParse(row.GetCell(9)?.ToString(), out var amt) ? (int)amt : 0,
                    Month = dateValue.Month,
                    Year = dateValue.Year,
                    PlId = plID // will be updated below
                };

                plForecasts.Add(forecast);
            }

            var distinctProjIds = plForecasts.Select(f => f.ProjId).Distinct();

            foreach (var projId in distinctProjIds)
            {
                plID = 0;

                var plan = await _projPlanService.AddProjectPlanAsync(new PlProjectPlan
                {
                    ProjId = projId,
                    Status = "Working",
                    PlType = "BUD",
                    Type = "BUD",
                    Source = "EXCEL"
                }, "excel");

                plID = plan?.PlId ?? 0;

                var projForecasts = plForecasts.Where(f => f.ProjId == projId).ToList();

                foreach (var projForecast in projForecasts)
                {
                    projForecast.PlId = plID;
                }

                plForecastData.AddRange(projForecasts);
            }

            await _pl_ForecastService.AddRangeAsync(plForecastData);

            return Ok("Excel file processed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to import plan Ver1");
            return StatusCode(500, "An error occurred while importing the plan.");
        }
    }

    [HttpPost("RefreshForecastSummary")]
    public async Task<IActionResult> BulkUpsertProjForecastSummary(
            [FromQuery] string projId,
            [FromQuery] string plType,
            [FromQuery] int? version)
    {
        List<ProjForecastSummary> records = new List<ProjForecastSummary>();

        try
        {

            var ProjectPlan = _context.PlProjectPlans.FirstOrDefault(f => f.ProjId == projId && f.PlType == plType && f.Version == version);
            var plid = ProjectPlan.PlId;

            records = _context.PlForecasts
                        .Where(f => f.PlId == plid)
                        .GroupBy(f => new { f.ProjId, f.Year, f.Month })
                        .Select(g => new
                        {
                            g.Key.ProjId,
                            g.Key.Year,
                            g.Key.Month,
                            C = g.Sum(x => x.Cost),
                            FC = g.Sum(x => x.ForecastedCost),
                            R = g.Sum(x => x.Revenue),
                            B = g.Sum(x => x.Burden),
                            FH = g.Sum(x => x.Forecastedhours),
                            FA = g.Sum(x => x.Forecastedamt),
                            AH = g.Sum(x => x.Actualhours),
                            AA = g.Sum(x => x.Actualamt)
                        })
                        .OrderBy(r => r.ProjId).ThenBy(r => r.Year).ThenBy(r => r.Month)
                        .AsEnumerable()
                        .GroupBy(r => r.ProjId)
                        .SelectMany(g =>
                        {
                            Func<int, int, Func<dynamic, decimal>, decimal> ytd = (y, m, sel) => g.Where(z => z.Year == y && z.Month <= m).Sum(sel);
                            Func<int, Func<dynamic, decimal>, decimal> itd = (i, sel) => g.Take(i + 1).Sum(sel);
                            return g.Select((x, i) => new ProjForecastSummary
                            {
                                ProjId = x.ProjId,
                                PlType = plType.ToUpper(),
                                Version = version.GetValueOrDefault(),
                                Year = x.Year,
                                Month = x.Month,
                                MonthlyCost = x.C,
                                YtdCost = ytd(x.Year, x.Month, z => z.C),
                                ItdCost = itd(i, z => z.C),
                                ForecastedMonthlyCost = x.FC,
                                ForecastedYtdCost = ytd(x.Year, x.Month, z => z.FC),
                                ForecastedItdCost = itd(i, z => z.FC),
                                MonthlyRevenue = x.R,
                                YtdRevenue = ytd(x.Year, x.Month, z => z.R),
                                ItdRevenue = itd(i, z => z.R),
                                MonthlyBurden = x.B,
                                YtdBurden = ytd(x.Year, x.Month, z => z.B),
                                ItdBurden = itd(i, z => z.B),
                                MonthlyForecastedHours = x.FH,
                                YtdForecastedHours = ytd(x.Year, x.Month, z => z.FH),
                                ItdForecastedHours = itd(i, z => z.FH),
                                MonthlyForecastedAmt = x.FA,
                                YtdForecastedAmt = ytd(x.Year, x.Month, z => z.FA),
                                ItdForecastedAmt = itd(i, z => z.FA),
                                MonthlyActualHours = x.AH,
                                YtdActualHours = ytd(x.Year, x.Month, z => z.AH),
                                ItdActualHours = itd(i, z => z.AH),
                                MonthlyActualAmt = x.AA,
                                YtdActualAmt = ytd(x.Year, x.Month, z => z.AA),
                                ItdActualAmt = itd(i, z => z.AA)
                            });
                        })
                        .ToList();

            if (!(records?.Any() ?? false))
                return BadRequest("No records to process.");



            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            if (plType.ToUpper() == "EAC")
            {
                var actualMonthlySummary = await _context.PSRFinalData
                    .Where(p => p.ProjId == projId && (p.RateType == "A" || p.RateType == "N"))
                    .GroupBy(p => new { p.PdNo, p.FyCd, p.SubTotTypeNo, p.ProjId })
                    .Select(g => new MonthlyActualRevenueSummary
                    {
                        Month = g.Key.PdNo,
                        Year = Convert.ToInt16(g.Key.FyCd),
                        Revenue = g.Sum(x => x.PtdIncurAmt),
                        YtdRevenue = g.Sum(x => x.YtdIncurAmt),
                        ItdRevenue = g.Sum(x => x.PyIncurAmt),
                        subTotalType = g.Key.SubTotTypeNo
                        //Cost = (g.Key.SubTotTypeNo == 2 || g.Key.SubTotTypeNo == 3) ? g.Sum(x => x.PtdIncurAmt) : 0m

                    })
                    .ToListAsync();

                var summaryLookup = actualMonthlySummary
                    .ToDictionary(
                        x => (x.Month, x.Year, x.subTotalType),
                        x => new
                        {
                            x.Revenue,
                            x.YtdRevenue,
                            x.ItdRevenue
                        });

                var TargetMonthlySummary = await _context.PSRFinalData
                    .Where(p => p.ProjId == projId && (p.RateType == "T" || p.RateType == "N"))
                    .GroupBy(p => new { p.PdNo, p.FyCd, p.SubTotTypeNo, p.ProjId })
                    .Select(g => new MonthlyActualRevenueSummary
                    {
                        Month = g.Key.PdNo,
                        Year = Convert.ToInt16(g.Key.FyCd),
                        Revenue = g.Sum(x => x.PtdIncurAmt),
                        YtdRevenue = g.Sum(x => x.YtdIncurAmt),
                        ItdRevenue = g.Sum(x => x.PyIncurAmt),
                        subTotalType = g.Key.SubTotTypeNo
                        //Cost = (g.Key.SubTotTypeNo == 2 || g.Key.SubTotTypeNo == 3) ? g.Sum(x => x.PtdIncurAmt) : 0m

                    })
                    .ToListAsync();

                var TargetSummaryLookup = TargetMonthlySummary
                    .ToDictionary(
                        x => (x.Month, x.Year, x.subTotalType),
                        x => new
                        {
                            x.Revenue,
                            x.YtdRevenue,
                            x.ItdRevenue
                        });

                foreach (var temp in records)
                {
                    summaryLookup.TryGetValue((temp.Month, temp.Year, 1), out var revenue);

                    if (new DateOnly(temp.Year, temp.Month, 1) < ProjectPlan.ClosedPeriod.GetValueOrDefault())
                    {
                        if (revenue != null)
                        {
                            temp.MonthlyRevenue = revenue.Revenue;
                            temp.ItdRevenue = revenue.ItdRevenue;
                            temp.YtdRevenue = revenue.YtdRevenue;
                        }
                    }
                    else
                    {
                        temp.MonthlyCost = temp.MonthlyCost + temp.MonthlyBurden;
                    }

                    if (new DateOnly(temp.Year, temp.Month, 4) < ProjectPlan.ClosedPeriod.GetValueOrDefault())
                    {
                        if (revenue != null)
                        {
                            temp.MonthlyBurden = revenue.Revenue;
                            temp.ItdBurden = revenue.ItdRevenue;
                            temp.YtdBurden = revenue.YtdRevenue;
                        }
                    }

                    TargetSummaryLookup.TryGetValue((temp.Month, temp.Year, 1), out var TargetRevenue);

                    if (new DateOnly(temp.Year, temp.Month, 1) < ProjectPlan.ClosedPeriod.GetValueOrDefault())
                    {
                        if (TargetRevenue != null)
                        {
                            temp.MonthlyTargetRevenue = TargetRevenue.Revenue;
                            temp.ItdTargetRevenue = TargetRevenue.ItdRevenue;
                            temp.YtdTargetRevenue = TargetRevenue.YtdRevenue;
                        }
                        else
                        {
                            temp.MonthlyTargetRevenue = 0;
                            temp.ItdTargetRevenue = 0;
                            temp.YtdTargetRevenue = 0;
                        }
                    }


                    TargetSummaryLookup.TryGetValue((temp.Month, temp.Year, 4), out var TargetBurden);

                    if (new DateOnly(temp.Year, temp.Month, 1) < ProjectPlan.ClosedPeriod.GetValueOrDefault())
                    {
                        if (TargetRevenue != null)
                        {
                            temp.MonthlyTargetBurden = TargetBurden.Revenue;
                            temp.ItdTargetBurden = TargetBurden.ItdRevenue;
                            temp.YtdTargetBurden = TargetBurden.YtdRevenue;
                        }
                        else
                        {
                            temp.MonthlyTargetBurden = 0;
                            temp.ItdTargetBurden = 0;
                            temp.YtdTargetBurden = 0;
                        }
                    }
                }
            }


            var query = _context.ProjRevWrkPds.AsQueryable();

            query = query.Where(p => p.ProjId == projId);

            query = query.Where(p => p.VersionNo == version);

            query = query.Where(p => p.BgtType == plType);

            var allPds = await query.ToListAsync();

            foreach (var pd in allPds)
            {

                if (pd.EndDate.GetValueOrDefault().Year == 2024)
                {

                }
                //pd.RevAmt = records.FirstOrDefault(p => p.Month == pd.Period.GetValueOrDefault() && p.Year == pd.EndDate.GetValueOrDefault().Year)?.MonthlyRevenue;
                pd.RevAmt = records
                        .FirstOrDefault(p => p.Month == pd.Period.GetValueOrDefault()
                        && p.Year == pd.EndDate.GetValueOrDefault().Year)
                        ?.MonthlyRevenue ?? 0m;

                pd.TimeStamp = DateTime.UtcNow;
                pd.CreatedAt = pd.CreatedAt.ToLocalTime().ToUniversalTime();
            }



            _context.ProjRevWrkPds.UpdateRange(allPds);
            await _context.SaveChangesAsync();

            /////////////////////////////////////////////////////////////////////////////////////////////

            var props = typeof(ProjForecastSummary).GetProperties().Where(p => p.CanRead).ToList();
            var props1 = typeof(ProjForecastSummary)
              .GetProperties()
              .Where(p => p.CanRead)
              .Select(p =>
              {
                  var colAttr = p.GetCustomAttributes(typeof(ColumnAttribute), false)
                                 .Cast<ColumnAttribute>()
                                 .FirstOrDefault();
                  return colAttr?.Name ?? p.Name; // Fall back to property name if no attributeproj_id, pl_type, version, year, month
              })
              .ToList();

            var keyCols = new[] { "proj_id", "pl_type", "version", "month", "year" };

            var sql = $@"
                    INSERT INTO public.proj_forecast_summary ({string.Join(", ", props1.Select(p => p.ToLower()))})
                    VALUES {string.Join(", ", records.Select((r, ri) => $"({string.Join(", ", props.Select((p, pi) => $"@p{ri}_{pi}"))})"))}
                    ON CONFLICT ({string.Join(", ", keyCols.Select(c => c.ToLower()))})
                    DO UPDATE SET {string.Join(", ", props1
                                    .Where(p => !keyCols.Contains(p, StringComparer.OrdinalIgnoreCase))
                                    .Select(p => $"{p.ToLower()} = EXCLUDED.{p.ToLower()}"))};
                    ";

            var parameters = records
                .SelectMany((r, ri) => props.Select((p, pi) =>
                    new NpgsqlParameter($"@p{ri}_{pi}", p.GetValue(r) ?? DBNull.Value)))
                .ToArray();

            await _context.Database.ExecuteSqlRawAsync(sql, parameters);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
             $"Unexpected Error: {ex.Message}");
        }

        return Ok("Bulk upsert completed successfully.");
    }

    [HttpPost("GetEmployeeScheduleAsync/{emplId}")]
    public async Task<object> GetEmployeeScheduleAsync(string emplId)
    {

        var schedules = await _context.PlForecasts
            .Join(_context.PlProjectPlans,
                  f => f.PlId,
                  pp => pp.PlId,
                  (f, pp) => new { f, pp })
            .Where(x => x.f.EmplId == emplId && x.pp.FinalVersion == true)
            .GroupBy(x => new { x.f.ProjId, x.f.Year, x.f.Month })
            .Select(g => new
            {
                g.Key.ProjId,
                g.Key.Year,
                g.Key.Month,
                Hours = g.Any(x => x.pp.PlType == "EAC")
                            ? g.Where(x => x.pp.PlType == "EAC").Sum(x => x.f.Actualhours)
                            : g.Where(x => x.pp.PlType == "BUD").Sum(x => x.f.Forecastedhours)
                //Source = g.Any(x => x.pp.PlType == "EAC") ? "EAC" : "BUD"
            })
            .OrderBy(r => r.ProjId)
            .ThenBy(r => r.Year)
            .ThenBy(r => r.Month)
            .ToListAsync();

        if (schedules.Count() == 0)
            return NotFound("N Schedule found for employee - " + emplId);

        // Compute global StartDate and EndDate across all schedules
        var minYear = schedules.Min(s => s.Year);
        var minMonth = schedules.Where(s => s.Year == minYear).Min(s => s.Month);
        var maxYear = schedules.Max(s => s.Year);
        var maxMonth = schedules.Where(s => s.Year == maxYear).Max(s => s.Month);

        var startDate = new DateOnly(minYear, minMonth, 1);
        var endDate = new DateOnly(
            maxYear,
            maxMonth,
            DateTime.DaysInMonth(maxYear, maxMonth)
        );

        ScheduleHelper scheduleHelper = new ScheduleHelper();

        var schedule = scheduleHelper.GetWorkingDaysForDuration(startDate, endDate, _orgService);

        // Break schedules by ProjId
        var projects = schedules
            .GroupBy(s => s.ProjId)
            .Select(pg => new
            {
                ProjId = pg.Key,
                Schedules = pg.ToList()
            })
            .ToList();

        return new
        {
            StandardSchedule = schedule,
            StartDate = startDate,
            EndDate = endDate,
            projects = projects
        };
    }

    [HttpPost("GetEmployeeOverUtilizedScheduleAsync/{plid}/{emplId}")]
    public async Task<object> GetEmployeeOverUtilizedScheduleAsync(int plid, string emplId)
    {
        CeilingHelper helper = new CeilingHelper(_context);
        var warnings = helper.GetWarningsByEmployee(plid, emplId);
        // assume warnings is a list of objects with Year, Month

        var warningPeriods = warnings
            .Select(w => new { w.Year, w.Month })
            .ToList().Distinct();

        // query schedules, restrict by warning periods
        var schedules = await _context.PlForecasts
            .Join(_context.PlProjectPlans,
                  f => f.PlId,
                  pp => pp.PlId,
                  (f, pp) => new { f, pp })
            .Where(x => x.f.EmplId == emplId && x.pp.FinalVersion == true)
            .GroupBy(x => new { x.f.ProjId, x.f.Year, x.f.Month, x.pp.PlType, x.pp.Version })
            .Select(g => new
            {
                g.Key.ProjId,
                g.Key.Year,
                g.Key.Month,
                g.Key.Version,
                g.Key.PlType,
                Hours = g.Any(x => x.pp.PlType == "EAC")
                            ? g.Where(x => x.pp.PlType == "EAC").Sum(x => x.f.Actualhours)
                            : g.Where(x => x.pp.PlType == "BUD").Sum(x => x.f.Forecastedhours)
                //Source = g.Any(x => x.pp.PlType == "EAC") ? "EAC" : "BUD"
            })
            .OrderBy(r => r.ProjId)
            .ThenBy(r => r.Year)
            .ThenBy(r => r.Month)
            .ToListAsync();

        if (!schedules.Any())
            return new { StandardSchedule = new List<object>(), Projects = new List<object>() };

        schedules = schedules.Where(x => warningPeriods.Any(p => p.Year == x.Year && p.Month == x.Month)).ToList();

        // restrict schedule helper only to warning periods
        var periods = warningPeriods
            .Select(p => new
            {
                StartDate = new DateOnly(p.Year, p.Month, 1),
                EndDate = new DateOnly(p.Year, p.Month, DateTime.DaysInMonth(p.Year, p.Month))
            })
            .ToList();

        ScheduleHelper scheduleHelper = new ScheduleHelper();

        var standardSchedule = new List<object>();
        foreach (var p in periods)
        {
            var sched = scheduleHelper.GetWorkingDaysForDuration(p.StartDate, p.EndDate, _orgService);
            standardSchedule.Add(new
            {
                //Year = p.StartDate.Year,
                //Month = p.StartDate.Month,
                Schedule = sched.FirstOrDefault()
            });
        }

        // break schedules by ProjId new { x.f.ProjId, x.f.Year, x.f.Month, x.pp.PlType, x.pp.Version }
        var projects = schedules
            .GroupBy(s => new { s.ProjId, s.PlType, s.Version })
            .Select(pg => new
            {
                proj_id = pg.Key.ProjId,
                Type = pg.Key.PlType,
                Version = pg.Key.Version,
                Schedules = pg.Select(p => new { p.Year, p.Month, p.Hours }).ToList()
            })
            .ToList();

        return new
        {
            StandardSchedule = standardSchedule,
            Projects = projects
        };
    }


    //[HttpPost("GetProjectFinancials")]
    //public async Task<List<ProjectFinancialSummaryDto>> GetProjectFinancials(string projId, string planType)
    //{

    //    var plids = await _context.PlProjectPlans
    //        .Where(p => p.ProjId.StartsWith(projId) && p.FinalVersion == true && p.PlType == planType)
    //        .Select(p => p.PlId)
    //        .ToListAsync();

    //    var result = await _context.PlForecasts
    //            .AsNoTracking()
    //            .Where(f => plids.Contains(f.PlId))
    //            .GroupBy(f => f.ProjId)
    //            .Select(g => new ProjectFinancialSummaryDto
    //            {
    //                ProjId = g.Key!,
    //                Revenue = g.Sum(x => x.Revenue),
    //                Cost = g.Sum(x => x.Cost),

    //                Profit = g.Sum(x => x.Revenue) - g.Sum(x => x.Cost),

    //                ProfitPercent =
    //                    g.Sum(x => x.Revenue) == 0
    //                        ? 0
    //                        : ((g.Sum(x => x.Revenue) - g.Sum(x => x.Cost))
    //                            / g.Sum(x => x.Revenue)) * 100,

    //                Backlog =
    //                    g.Sum(x => x.Forecastedamt ?? 0) - g.Sum(x => x.Revenue)
    //            })
    //            .ToListAsync();

    //    return result;

    //}

    [HttpPost("GetProjectFinancials")]
    public async Task<List<ProjectFinancialSummary1Dto>> GetProjectFinancials(
    string projId,
    string planType)
    {

        var ProjModfunding = _context.ProjectModifications
            .Where(p => p.ProjId.StartsWith(projId));

        decimal costFunding = 0, feeFunding = 0;

        if (ProjModfunding != null && ProjModfunding.Count() > 0)
        {
            costFunding = ProjModfunding.ToList().Sum(p => p.ProjFCstAmt).GetValueOrDefault();
            feeFunding = ProjModfunding.ToList().Sum(p => p.ProjFFeeAmt).GetValueOrDefault();
        }


        var baseQuery =
            from p in _context.PlProjectPlans
            join f in _context.PlForecasts on p.PlId equals f.PlId
            where p.ProjId.StartsWith(projId)
                  && p.FinalVersion == true
                  && p.PlType == planType
            select new { p.ProjId, f };

        // 🔹 Leaf-level (each project)
        var projectLevel =
            from x in baseQuery
            group x by x.ProjId into g
            select new ProjectFinancialSummary1Dto
            {
                ProjId = g.Key,
                IsRollup = false,

                Revenue = g.Sum(x => x.f.Revenue),
                Cost = g.Sum(x => x.f.Cost),

                Profit = g.Sum(x => x.f.Revenue) - g.Sum(x => x.f.Cost),

                ProfitPercent =
                    g.Sum(x => x.f.Revenue) == 0
                        ? 0
                        : ((g.Sum(x => x.f.Revenue) - g.Sum(x => x.f.Cost))
                            / g.Sum(x => x.f.Revenue)) * 100,

                Backlog =
                    g.Sum(x => x.f.Forecastedamt ?? 0)
                    - g.Sum(x => x.f.Revenue)
            };

        // 🔹 Roll-up (upper / parent level)
        var rollup =
            from x in baseQuery
            group x by 1 into g
            select new ProjectFinancialSummary1Dto
            {
                ProjId = projId,
                IsRollup = true,

                Revenue = g.Sum(x => x.f.Revenue),
                Cost = g.Sum(x => x.f.Cost),

                Profit = g.Sum(x => x.f.Revenue) - g.Sum(x => x.f.Cost),

                ProfitPercent =
                    g.Sum(x => x.f.Revenue) == 0
                        ? 0
                        : ((g.Sum(x => x.f.Revenue) - g.Sum(x => x.f.Cost))
                            / g.Sum(x => x.f.Revenue)) * 100,

                Backlog =
                    g.Sum(x => x.f.Forecastedamt ?? 0)
                    - g.Sum(x => x.f.Revenue)
            };

        var projectDetails = await projectLevel
            .Concat(rollup)
            .OrderByDescending(x => x.IsRollup)
            .ThenBy(x => x.ProjId)
            .ToListAsync();


        // Add funding info to all records
        foreach (var record in projectDetails)
        {
            //record.Funding = ProjModfunding.Where(p=>p.ProjId.StartsWith(record.ProjId)).Sum(x=>x.ProjFCstAmt).GetValueOrDefault() + ProjModfunding.Where(p => p.ProjId.StartsWith(record.ProjId)).Sum(x => x.ProjFFeeAmt).GetValueOrDefault();
            record.Funding = await ProjModfunding
                            .Where(p => p.ProjId.StartsWith(record.ProjId))
                            .SumAsync(p => (p.ProjFCstAmt ?? 0m) + (p.ProjFFeeAmt ?? 0m));

            record.Backlog = (record.Funding - record.Revenue);

        }

        return projectDetails;
    }

}
