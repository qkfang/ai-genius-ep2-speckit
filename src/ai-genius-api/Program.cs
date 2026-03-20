var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();

// GET /api/status — runtime status
app.MapGet("/api/status", () => Results.Ok(new
{
    status = "running",
    environment = app.Environment.EnvironmentName,
    timestamp = DateTime.UtcNow.ToString("o"),
    speckit = new { enabled = true, version = "1.0.0" }
}));

// GET /api/health — health check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    uptime = Environment.TickCount64 / 1000.0,
    timestamp = DateTime.UtcNow.ToString("o")
}));

// GET /api/series — AI Genius series info
app.MapGet("/api/series", () => Results.Ok(new
{
    name = "Microsoft AI Genius",
    seriesId = "s-1453",
    url = "https://developer.microsoft.com/en-us/reactor/series/s-1453/",
    description = "A six-part progressive course with cutting-edge AI tech and tools presented by top Microsoft experts.",
    topics = new[]
    {
        new { episode = 1, title = "Introduction to AI Development", status = "available" },
        new { episode = 2, title = "SpecKit: Practical DevOps Controls", status = "available" },
        new { episode = 3, title = "Azure AI Services", status = "available" },
        new { episode = 4, title = "Responsible AI", status = "available" },
        new { episode = 5, title = "AI Agents & Orchestration", status = "available" },
        new { episode = 6, title = "Deploy & Monitor AI Apps", status = "available" }
    }
}));

app.Run();
