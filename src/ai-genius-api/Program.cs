using System.Text.Json;

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

// GET /api/series — AI Genius Season 4 series info
app.MapGet("/api/series", () => Results.Ok(new
{
    name = "Microsoft AI Genius",
    season = 4,
    seriesId = "s-1453",
    url = "https://developer.microsoft.com/en-us/reactor/series/s-1453/",
    description = "Season 4 of Microsoft AI Genius — hands-on sessions on agentic AI, DevOps automation, and developer experience upgrades.",
    topics = new[]
    {
        new { episode = 1, title = "Getting Started with Microsoft Agent Framework: Build Practical AI Agents", presenter = "Rakesh L", status = "available" },
        new { episode = 2, title = "Agentic DevOps with SpecKit: Turn Specs into CI/CD Using GitHub Actions", presenter = "Daniel Fang", status = "available" },
        new { episode = 3, title = "Build Your Own Dev Experience Upgrades with GitHub Copilot SDK", presenter = "Renee Noble", status = "available" }
    }
}));

// Load Season 4 episodes from JSON file
var episodesJsonPath = Path.Combine(app.Environment.ContentRootPath, "episodes.json");
var episodesJson = File.ReadAllText(episodesJsonPath);
var season4Episodes = JsonSerializer.Deserialize<JsonElement[]>(episodesJson)!;

// GET /api/episodes — all Season 4 episodes
app.MapGet("/api/episodes", () => Results.Ok(new
{
    season = 4,
    name = "Microsoft AI Genius — Season 4",
    episodes = season4Episodes
}));

// GET /api/episodes/{id} — single Season 4 episode by number
app.MapGet("/api/episodes/{id:int}", (int id) =>
{
    var episode = season4Episodes.FirstOrDefault(e => e.GetProperty("episode").GetInt32() == id);
    return episode.ValueKind != JsonValueKind.Undefined
        ? Results.Ok(episode)
        : Results.NotFound(new { error = $"Episode {id} not found" });
});

app.Run();
