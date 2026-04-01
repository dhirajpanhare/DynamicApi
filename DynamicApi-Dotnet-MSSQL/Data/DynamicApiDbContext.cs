using Microsoft.EntityFrameworkCore;

namespace DynamicApi.Data
{
    public class DynamicApiDbContext : DbContext
    {
        public DynamicApiDbContext(DbContextOptions<DynamicApiDbContext> options) : base(options)
        {
        }

        public DbSet<ExecutionLog> ExecutionLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ExecutionLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProcedureName).HasMaxLength(255);
                entity.Property(e => e.Parameters).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Message).HasMaxLength(500);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => new { e.ProcedureName, e.CreatedAt });
                entity.HasIndex(e => new { e.Status, e.CreatedAt });
            });
        }
    }

    public class ExecutionLog
    {
        public int Id { get; set; }
        public string? ProcedureName { get; set; }
        public string? Parameters { get; set; }
        public bool Status { get; set; }
        public string? Message { get; set; }
        public int ExecutionTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
