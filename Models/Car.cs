namespace FuelTracker.Models
{
    public class Car
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; } = "";

        public string RegistrationNumber { get; set; } = "";

        public string FuelType { get; set; } = "";
    }
}