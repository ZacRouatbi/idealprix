# Agent Configuration

## Test Commands

### BackendNext (Dashboard)
```bash
# Type check
cd apps/backendnext && npm run type-check

# Build (includes type checking)
cd apps/backendnext && npm run build

# Run database migration
cd apps/backendnext && node scripts/apply-migration.js
```

### Storefront
```bash
# Type check (has existing errors unrelated to current work)
cd apps/storefront && npx tsc --noEmit --skipLibCheck
```

## Database Commands

### Apply Security Migration
```bash
cd apps/backendnext && node scripts/apply-migration.js
```

### Test Database Connection
```bash
cd apps/backendnext && node scripts/test-db.js
```

## Security Notes

- JWT_SECRET should be a strong random string in production
- All admin API routes require valid JWT token
- Public API routes (/api/public/*) are rate-limited but require no auth
- Role hierarchy: admin > manager > staff > customer

## Progress

### Done
- Fixed RecentActivity component typo (recentsActivities → recentActivities)
- Simplified RecentOrders and RecentActivity table overflow handling (removed redundant wrapper div and overflow classes - Table component already handles overflow)

### In Progress
- (none)

### Blocked
- (none)