using FuelTracker.Models;

namespace FuelTracker.Services
{
    public class FuelDataService
    {
        public List<Car> Cars { get; private set; } = new();

        public List<FuelEntry> FuelEntries { get; private set; } = new();

        public bool IsLoaded { get; private set; }

        public void SetData(
            List<Car> cars,
            List<FuelEntry> fuelEntries)
        {
            Cars = cars;
            FuelEntries = fuelEntries;
            IsLoaded = true;
        }

        public void Clear()
        {
            Cars = new();
            FuelEntries = new();
            IsLoaded = false;
        }
    }
}