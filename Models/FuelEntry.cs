namespace FuelTracker.Models
{
    public class FuelEntry
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid CarId { get; set; }

        public string CarName { get; set; } = "";

        public decimal Liters { get; set; }

        public decimal TotalCost { get; set; }

        public DateTime Date { get; set; } = DateTime.Today;

        public decimal PricePerLiter =>
            Liters > 0 ? TotalCost / Liters : 0;
    }
}