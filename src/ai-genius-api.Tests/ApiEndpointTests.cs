using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ai_genius_api.Tests;

public class ApiEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetStatus_ReturnsOkWithRunningStatus()
    {
        var response = await _client.GetAsync("/api/status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("running", json.RootElement.GetProperty("status").GetString());
        Assert.True(json.RootElement.GetProperty("speckit").GetProperty("enabled").GetBoolean());
    }

    [Fact]
    public async Task GetHealth_ReturnsOkWithHealthyStatus()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("healthy", json.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task GetSeries_ReturnsOkWithSeason4Info()
    {
        var response = await _client.GetAsync("/api/series");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("Microsoft AI Genius", json.RootElement.GetProperty("name").GetString());
        Assert.Equal(4, json.RootElement.GetProperty("season").GetInt32());

        var topics = json.RootElement.GetProperty("topics");
        Assert.Equal(3, topics.GetArrayLength());
    }

    [Fact]
    public async Task GetEpisodes_ReturnsAllThreeEpisodes()
    {
        var response = await _client.GetAsync("/api/episodes");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(4, json.RootElement.GetProperty("season").GetInt32());

        var episodes = json.RootElement.GetProperty("episodes");
        Assert.Equal(3, episodes.GetArrayLength());
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    public async Task GetEpisodeById_ReturnsCorrectEpisode(int id)
    {
        var response = await _client.GetAsync($"/api/episodes/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(id, json.RootElement.GetProperty("episode").GetInt32());
        Assert.Equal(4, json.RootElement.GetProperty("season").GetInt32());
    }

    [Fact]
    public async Task GetEpisodeById_WithInvalidId_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/episodes/99");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Contains("99", json.RootElement.GetProperty("error").GetString());
    }
}
