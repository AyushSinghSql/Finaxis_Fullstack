using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebApi.DTO;

namespace PlanningAPI.Models
{
    public class ForecastReport : IDocument
    {
        private readonly PlanForecastSummary _model;
        private readonly string _aiInsight;

        public ForecastReport(PlanForecastSummary model, string aiInsight)
        {
            _model = model;
            _aiInsight = aiInsight;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);

                page.Header().Text($"Forecast Report - {_model.Proj_Id}")
                    .FontSize(20).SemiBold().AlignCenter();

                page.Content().Column(col =>
                {
                    // Existing Forecast Table
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text("Employee");
                            header.Cell().Text("Hours");
                            header.Cell().Text("Cost");
                        });

                        foreach (var emp in _model.EmployeeForecastSummary)
                        {
                            table.Cell().Text(emp.EmplId);
                            table.Cell().Text($"{emp.TotalForecastedHours}");
                            table.Cell().Text($"{emp.TotalForecastedCost:C}");
                        }
                    });

                    col.Spacing(15);

                    // 🔹 AI-Generated Insights Section
                    if (!string.IsNullOrWhiteSpace(_aiInsight))
                    {
                        col.Item().Border(1).Padding(10).Background("#F5F5F5").Column(ai =>
                        {
                            ai.Item().Text("AI Insights")
                                .FontSize(14).Bold().FontColor("#2E86C1");

                            ai.Item().Text(_aiInsight)
                                .FontSize(11)
                                .FontColor("#333333");
                        });
                    }
                });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Generated on ").FontSize(9);
                        x.Span(DateTime.Now.ToString("yyyy-MM-dd HH:mm")).FontSize(9).Italic();
                    });
            });
        }
    }

}
