using Azure;
using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NPOI.SS.Formula.Functions;
using PlanningAPI.Helpers;
using PlanningAPI.Models;
using PlanningAPI.Repositories;
using QuestPDF.Infrastructure;
using Serilog;
using System;
using System.Text;
using System.Text.Json.Serialization;
using WebApi.Helpers;
using WebApi.Models;
using WebApi.Repositories;
using WebApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog for file logging
Serilog.Log.Logger = new LoggerConfiguration()
    .WriteTo.File("Logs/log-.txt",         // Output folder and rolling file name
                  rollingInterval: RollingInterval.Day,
                  retainedFileCountLimit: 7,    // Optional: keep last 7 logs
                  outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .Enrich.FromLogContext()
    .CreateLogger();
QuestPDF.Settings.License = LicenseType.Community;
builder.Host.UseSerilog(); // Use Serilog instead of default logging
// add services to DI container
{
    var services = builder.Services;
    var env = builder.Environment;

    services.AddCors();

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
        .AddJwtBearer(options =>
        {
            var jwtSettings = builder.Configuration.GetSection("Jwt");

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtSettings["Key"])
                ),
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddAuthorization();

    services.AddControllers().AddJsonOptions(x =>
    {
        // serialize enums as strings in api responses (e.g. Role)
        x.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        // ignore omitted parameters on models to enable optional params (e.g. User update)
        x.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

    builder.Services.AddEndpointsApiExplorer();
    //builder.Services.AddSwaggerGen();
    //builder.Services.AddOpenApi();

    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "FinAxis Backend API",
            Version = "v1"
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter 'Bearer' [space] and then your token.\n\nExample:\nBearer eyJhbGciOiJIUzI1NiIs..."
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    });

    var endpoint = builder.Configuration["AI:Endpoint"];
    var apiKey = builder.Configuration["AI:ApiKey"];
    var model = builder.Configuration["AI:ModelName"];

    builder.Services.AddChatClient(services =>
      new ChatClientBuilder(
        (
          !string.IsNullOrEmpty(apiKey)
            ? new AzureOpenAIClient(new Uri(endpoint!), new AzureKeyCredential(apiKey))
            : new AzureOpenAIClient(new Uri(endpoint!), new DefaultAzureCredential())
        ).GetChatClient(model).AsIChatClient()
      )
      .UseFunctionInvocation()
      .Build());

    services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

    // configure strongly typed settings object
    // services.Configure<DbSettings>(builder.Configuration.GetSection("DbSettings"));

    // configure DI for application services
    //services.AddSingleton<DataContext>();
    builder.Services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
    builder.Services.AddHostedService<PlanningAPI.Services.QueuedHostedService>();


    services.AddScoped<IOrgRepository, OrgRepository>();
    services.AddScoped<IOrgService, OrgService>();
    services.AddScoped<IPlForecastRepository, PlForecastRepository>();
    services.AddScoped<IPl_ForecastService, Pl_ForecastService>();

    services.AddScoped<IProjPlanRepository, ProjPlanRepository>();
    services.AddScoped<IProjPlanService, ProjPlanService>();

    services.AddScoped<IProjRepository, ProjRepository>();
    services.AddScoped<IProjService, ProjService>();
    services.AddScoped<IEmplRepository, EmplRepository>();
    services.AddScoped<IEmplService, EmplService>();

    services.AddScoped<IDirectCostRepository, DirectCostRepository>();
    services.AddScoped<IDirectCostService, DirectCostService>();

    services.AddScoped<IProjectFees_Repository, ProjectFees_Repository>();
    builder.Services.AddScoped<IProspectiveEntityRepository, ProspectiveEntityRepository>();

    builder.Services.AddScoped<IProjectPlcRateRepository, ProjectPlcRateRepository>();
    builder.Services.AddScoped<IProjBgtRevSetupRepository, ProjBgtRevSetupRepository>();
    builder.Services.AddScoped<IProjVendRtRepository, ProjVendRtRepository>();
    builder.Services.AddScoped<IProjEmplRtRepository, ProjEmplRtRepository>();
    services.AddScoped<IRevFormulaRepository, RevFormulaRepository>();
    services.AddScoped<IProjRevWrkPdRepository, ProjRevWrkPdRepository>();
    services.AddScoped<IVendorEmployeeRepository, VendorEmployeeRepository>();
    services.AddScoped<IVendorEmployeeRepository, VendorEmployeeRepository>();
    services.AddScoped<IHolidayCalendarRepository, HolidayCalendarRepository>();
    services.AddScoped<IHolidayCalendarRepository, HolidayCalendarRepository>();
    services.AddScoped<IUserRepository, UserRepository>();
    //services.AddScoped<IAiService, OpenAiService>();

    builder.Services.AddHttpClient<IAiService, OpenAiService>();
    //services.AddDbContext<MydatabaseContext>(options => options.UseNpgsql("Host=localhost;Database=planning;Username=myuser;Password=mypassword;Include Error Detail=true;"));
    //services.AddDbContext<MydatabaseContext>(options => options.UseNpgsql("Host=dpg-d0n1vd2li9vc7380m3o0-a.singapore-postgres.render.com;Database=planning;Username=myuser;Password=ODIfyKykuj6zdwchsnqAzccSMNeRgGQ7;Include Error Detail=true;"));

    services.AddDbContext<MydatabaseContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    //services.AddDbContext<MydatabaseContext>(options => options.UseNpgsql("Host=dpg-d0n1vd2li9vc7380m3o0-a.singapore-postgres.render.com;Database=Test_Import;Username=myuser;Password=ODIfyKykuj6zdwchsnqAzccSMNeRgGQ7;Include Error Detail=true;"));
}

var app = builder.Build();

app.UseSwagger();

app.UseSwaggerUI(c =>
{
// ✅ Correct relative path for Docker (no hardcoded localhost)
c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");

// ✅ Ensures Swagger UI is at http://localhost:<port>/swagger
c.RoutePrefix = "swagger";
});

//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    //app.UseSwaggerUI(); // Optional: you can add options here
//    app.UseSwaggerUI(c =>
//    {
//        // ✅ Explicit relative path — DO NOT use localhost URLs
//        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
//        c.RoutePrefix = "swagger"; // so it's at /swagger
//    });
//}

//// ensure database and tables exist
//{
//    using var scope = app.Services.CreateScope();
//    var context = scope.ServiceProvider.GetRequiredService<DataContext>();
//    await context.Init();
//}

app.UseDefaultFiles();
app.UseStaticFiles();

// configure HTTP request pipeline
{
    // global cors policy
    app.UseCors(x => x
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());

    // global error handler
    app.UseMiddleware<ErrorHandlerMiddleware>();

    app.UseAuthentication(); // 🔥 MUST be before UseAuthorization
    app.UseAuthorization();
    app.MapControllers();
}

app.MapFallbackToFile("index.html");

//app.Run("http://localhost:4000");
//app.Run("http://0.0.0.0:8080");
app.Run();