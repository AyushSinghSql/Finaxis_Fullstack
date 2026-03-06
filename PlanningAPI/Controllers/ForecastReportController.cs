using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PlanningAPI.Models;
using QuestPDF.Fluent;
using SQLitePCL;
using System.Collections.Generic;
using WebApi.DTO;
using WebApi.Helpers;

namespace PlanningAPI.Controllers
{


    [ApiController]
    [Route("api/[controller]")]
    public class ForecastReportController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly MydatabaseContext _context;

        public ForecastReportController(IAiService aiService, MydatabaseContext context)
        {
            _aiService = aiService;
            _context = context;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateForecastReport([FromBody] PlanForecastSummary forecast)
        {
            if (forecast == null)
                return BadRequest("Forecast data is required.");

            // 1. Call AI service for insights
            var aiInsight = await _aiService.GetForecastInsightAsync(forecast);

            // 2. Generate PDF
            var report = new ForecastReport(forecast, aiInsight);
            var pdfBytes = report.GeneratePdf();

            // 3. Return PDF as downloadable file
            return File(pdfBytes, "application/pdf", $"{forecast.Proj_Id}_ForecastReport.pdf");
        }
        [HttpGet("GetPSRData")]
        public async Task<IActionResult> GetPSRData([FromQuery] string? proj_id)
        {
            var query = _context.PSRFinalData.AsQueryable();

            if (!string.IsNullOrEmpty(proj_id))
            {
                query = query.Where(x => x.ProjId == proj_id);
            }

            var list = await query.ToListAsync();
            return Ok(list);
        }


        [HttpGet("GetPSRHeaderData")]
        public async Task<IActionResult> GetPSRHeaderData([FromQuery] string? proj_id)
        {
            var query = _context.PsrHeader.AsQueryable();

            if (!string.IsNullOrEmpty(proj_id))
            {
                query = query.Where(x => x.ProjId == proj_id);
            }

            var list = await query.ToListAsync();
            return Ok(list);
        }

        [HttpGet("GetGLData")]
        public async Task<IActionResult> GetGLData()
        {
            var list = _context.PlFinancialTransactions.ToList();
            return Ok(list);

        }

        [HttpGet("GetViewData")]
        public async Task<IActionResult> GetViewData()
        {

            var result = await _context.ViewPsrData
                                .ToListAsync();
            return Ok(result);

        }
        [HttpGet("GetForecastView")]
        public async Task<IActionResult> GetForecastView()
        {


            var result = _context.ForecastView.ToList();
            return Ok(result);

        }
        [HttpGet("GetLabHSData")]
        public async Task<IActionResult> GetLabHSData([FromQuery] int? take = null)
        {
            var query = _context.LabHours.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetAccountGroupSetupData")]
        public async Task<IActionResult> GetAccountGroupSetupData([FromQuery] int? take = null)
        {
            var query = _context.AccountGroupSetup.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetFsData")]
        public async Task<IActionResult> GetFsData([FromQuery] int? take = null)
        {
            var query = _context.Fs.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetFsLnData")]
        public async Task<IActionResult> GetFsLnData([FromQuery] int? take = null)
        {
            var query = _context.FsLns.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetFsLnAcctData")]
        public async Task<IActionResult> GetFsLnAcctData([FromQuery] int? take = null)
        {
            var query = _context.FsLnAccts.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetGlPostDetail")]
        public async Task<IActionResult> GetGlPostDetail([FromQuery] int? take = null)
        {
            var query = _context.GlPostDetails.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetISData")]
        public async Task<IActionResult> GetISData([FromQuery] int? take = null)
        {
            var query = _context.View_Is_Report.AsQueryable();

            if (take.HasValue && take.Value > 0)
            {
                query = query.Take(take.Value);
            }

            var result = await query.ToListAsync();
            return Ok(result);
        }

        [HttpGet("GetAllEmployee")]
        public async Task<IActionResult> GetAllEmployee()
        {

            var sql = $@"SELECT empl.empl_id AS EmplId, 
           s_empl_status_cd AS Status, 
           last_first_name AS FirstName, 
           effect_dt AS EffectiveDate,
           sal_amt AS Salary,
           hrly_amt AS PerHourRate,
		   bill_lab_cat_cd AS Bill_Lab_Cat_CD,
		   genl_lab_cat_cd AS Genl_Lab_Cat_CD
                FROM empl
                JOIN public.empl_lab_info 
                    ON empl.empl_id = public.empl_lab_info.empl_id
            where public.empl_lab_info.end_dt = '2078-12-31'";

            var employeeDetails = _context.Empl_Master_Dto
                .FromSqlRaw(sql)
                .ToList();

            return Ok(employeeDetails);
        }
        [HttpGet("GetDbInfo")]
        public async Task<ActionResult<DbInfoViewModel>> GetDbInfo()
        {
            var dbInfo = new DbInfoViewModel();
            var model = _context.Model;

            var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();

            foreach (var entityType in model.GetEntityTypes())
            {
                var tableName = entityType.GetTableName();
                if (string.IsNullOrEmpty(tableName)) continue;

                var table = new TableInfoViewModel
                {
                    TableName = tableName
                };

                foreach (var property in entityType.GetProperties())
                {
                    table.Columns.Add(new ColumnInfoViewModel
                    {
                        ColumnName = property.GetColumnName(),
                        ColumnType = property.GetColumnType() ?? property.ClrType.Name,
                        IsNullable = property.IsColumnNullable(),
                        DefaultValue = property.GetDefaultValueSql()
                    });
                }

                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = $"SELECT COUNT(*) FROM \"{tableName}\"";
                    var result = await cmd.ExecuteScalarAsync();
                    table.RowCount = Convert.ToInt32(result);
                }
                catch
                {
                    table.RowCount = 0; // ignore errors for unmapped/shadow tables
                }

                dbInfo.Tables.Add(table);
            }

            return Ok(dbInfo);
        }

        [HttpGet("GetDbInfoV1")]
        public async Task<ActionResult<DbInfoViewModel>> GetDbInfoV1()
        {
            var dbInfo = new DbInfoViewModel();
            var model = _context.Model;

            var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();

            foreach (var entityType in model.GetEntityTypes())
            {
                var tableName = entityType.GetTableName();
                var schema = entityType.GetSchema();

                if (string.IsNullOrEmpty(tableName))
                    continue;

                var table = new TableInfoViewModel
                {
                    TableName = tableName,
                    Schema = schema
                };

                // =========================
                // 1️⃣ PRIMARY KEY
                // =========================
                var primaryKey = entityType.FindPrimaryKey();
                if (primaryKey != null)
                {
                    table.PrimaryKeys = primaryKey.Properties
                        .Select(p => p.GetColumnName())
                        .ToList();
                }

                // =========================
                // 2️⃣ COLUMNS
                // =========================
                foreach (var property in entityType.GetProperties())
                {
                    table.Columns.Add(new ColumnInfoViewModel
                    {
                        ColumnName = property.GetColumnName(),
                        ColumnType = property.GetColumnType() ?? property.ClrType.Name,
                        IsNullable = property.IsColumnNullable(),
                        DefaultValue = property.GetDefaultValueSql(),
                        IsPrimaryKey = primaryKey?.Properties.Contains(property) ?? false
                    });
                }

                // =========================
                // 3️⃣ FOREIGN KEYS
                // =========================
                foreach (var fk in entityType.GetForeignKeys())
                {
                    table.ForeignKeys.Add(new ForeignKeyInfoViewModel
                    {
                        Name = fk.GetConstraintName() ?? "",
                        Columns = fk.Properties
                            .Select(p => p.GetColumnName())
                            .ToList(),
                        PrincipalTable = fk.PrincipalEntityType.GetTableName() ?? "",
                        PrincipalColumns = fk.PrincipalKey.Properties
                            .Select(p => p.GetColumnName())
                            .ToList()
                    });
                }

                // =========================
                // 4️⃣ INDEXES
                // =========================
                foreach (var index in entityType.GetIndexes())
                {
                    table.Indexes.Add(new IndexInfoViewModel
                    {
                        Name = index.GetDatabaseName() ?? "",
                        Columns = index.Properties
                            .Select(p => p.GetColumnName())
                            .ToList(),
                        IsUnique = index.IsUnique
                    });
                }

                // =========================
                // 5️⃣ ROW COUNT (Optional)
                // =========================
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = $"SELECT COUNT(*) FROM \"{tableName}\"";
                    var result = await cmd.ExecuteScalarAsync();
                    table.RowCount = Convert.ToInt32(result);
                }
                catch
                {
                    table.RowCount = 0;
                }

                dbInfo.Tables.Add(table);
            }

            return Ok(dbInfo);
        }

    }

}
