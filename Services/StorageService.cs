using System.Text.Json;
using Microsoft.JSInterop;

namespace FuelTracker.Services
{
    public class StorageService
    {
        private readonly IJSRuntime _jsRuntime;

        public StorageService(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }

        public async Task SaveAsync<T>(string key, T data)
        {
            string json = JsonSerializer.Serialize(data);

            await _jsRuntime.InvokeVoidAsync(
                "localStorage.setItem",
                key,
                json);
        }

        public async Task<T?> LoadAsync<T>(string key)
        {
            string? json = await _jsRuntime.InvokeAsync<string?>(
                "localStorage.getItem",
                key);

            if (string.IsNullOrEmpty(json))
                return default;

            return JsonSerializer.Deserialize<T>(json);
        }
    }
}