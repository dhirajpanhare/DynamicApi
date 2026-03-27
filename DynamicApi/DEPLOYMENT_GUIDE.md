# Deploy DynamicApi to Production

## Prerequisites
- .NET 8.0 SDK
- MySQL 8.0+
- Windows Server or Linux

## Deployment Steps

### 1. Publish Release Build
```bash
dotnet publish -c Release -o ./publish
```

### 2. Configure for IIS (Windows)
```bash
# Add IIS Application Pool
```

### 3. Set Environment Variables
- Set production connection string
- Set JWT secret
- Configure CORS origins

### 4. Enable HTTPS
- Install SSL certificate
- Update appsettings.production.json

### 5. Start Service
```bash
# IIS: Create App Pool and Site
# Kestrel: systemctl start dynamicapi
```

### 6. Monitor Logs
```bash
# Check logs folder for errors
```

## Production Checklist
- [ ] Update appsettings.production.json
- [ ] Enable HTTPS only
- [ ] Restrict CORS origins
- [ ] Enable authentication
- [ ] Setup database backups
- [ ] Configure logging
- [ ] Enable firewall rules
- [ ] Setup monitoring/alerts
