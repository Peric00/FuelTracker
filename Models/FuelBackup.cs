namespace FuelTracker.Models
{
    public class FuelBackup
    {
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<Car> Cars { get; set; } = new();

        public List<FuelEntry> FuelEntries { get; set; } = new();
    }
}