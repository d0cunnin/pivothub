# Admin Access Testing Guide

## Security Enhancements Implemented ✅

### 1. Audit Logging System
- **Table**: `admin_audit_log` - Tracks all admin actions with detailed metadata
- **Features**:
  - Records admin user ID, action type, target user
  - Captures IP address and user agent for security tracking
  - Stores detailed before/after state changes
  - Timestamps all actions for compliance

### 2. Rate Limiting
- **Function**: `check_admin_rate_limit()` - PostgreSQL function for rate limiting
- **Protection**:
  - Maximum 100 admin actions per hour per admin
  - Prevents abuse and automated attacks
  - Automatic cleanup of old rate limit records
  - Returns 429 status when limit exceeded

### 3. Admin Role Verification
- **Current Admin**: `support@pivothub.io` (confirmed in database)
- **Role Storage**: Separate `user_roles` table (prevents privilege escalation)
- **Security Function**: `has_role()` with SECURITY DEFINER for safe RLS checks

---

## Testing Admin Access

### Step 1: Sign In as Admin
1. Navigate to `/auth`
2. Sign in with `support@pivothub.io` credentials
3. You should be redirected to the home page

### Step 2: Access Admin Dashboard
1. Click on your profile icon in the header (top right)
2. You should see an "Admin" option in the dropdown menu
3. Click "Admin" - you'll be taken to `/admin`
4. Non-admin users will NOT see this option

### Step 3: Verify Admin Dashboard Features
You should see these tabs:
- **Overview**: User statistics and platform analytics
- **Users**: Manage user subscriptions
- **Analytics**: Platform usage analytics
- **Cost**: Cost analysis
- **Activity**: Admin audit logs (NEW - enhanced with IP tracking)
- **System**: Supabase usage monitoring

### Step 4: Test Audit Logging
1. Go to the "Users" tab
2. Click "Manage Access" on any user
3. Grant or modify a subscription
4. Navigate to the "Activity" tab
5. Verify your action appears in the audit log with:
   - Timestamp
   - Action type (e.g., "grant subscription Pro 1-month")
   - Your admin ID
   - Target user ID
   - IP address
   - Detailed changes (click "View details")

### Step 5: Test Rate Limiting
**Note**: Rate limiting is set to 100 actions/hour, so normal testing won't trigger it.

To verify it's working:
1. Check the edge function logs for rate limit checks
2. Each admin action logs: `[ADMIN-MANAGE] Admin verified`
3. Rate limit check happens before each action

---

## Security Verification Checklist

### Database Layer ✅
- [x] Roles stored in separate `user_roles` table
- [x] RLS policies protect role assignments
- [x] `has_role()` function uses SECURITY DEFINER
- [x] Admin audit log table created with proper RLS
- [x] Rate limit table created with service role access
- [x] Only `support@pivothub.io` has admin role

### Application Layer ✅
- [x] `AdminGuard` component protects admin routes
- [x] `checkAdminStatus()` verifies roles server-side
- [x] Header conditionally shows admin link
- [x] Admin edge function validates admin role
- [x] Rate limiting enforced in edge functions
- [x] Audit logging for all admin actions

### Admin UI Display ✅
- [x] Admin link only visible to admin users
- [x] Admin dashboard requires authentication
- [x] Non-admin users redirected from `/admin`
- [x] Enhanced audit log viewer with IP tracking
- [x] Detailed change tracking in audit logs

### New Accounts ✅
- [x] No auto-grant triggers for new users
- [x] Admin role must be manually assigned
- [x] Default users have no admin access
- [x] RLS blocks non-admin access to admin features

---

## Edge Function Enhanced

### `admin-manage-subscription`
**Location**: `supabase/functions/admin-manage-subscription/index.ts`

**New Features**:
1. **IP and User Agent Tracking**
   ```typescript
   const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
   const userAgent = req.headers.get('user-agent') || 'unknown';
   ```

2. **Rate Limiting Check**
   ```typescript
   const { data: rateLimitCheck } = await supabase.rpc('check_admin_rate_limit', {
     p_admin_user_id: user.id,
     p_action_type: 'subscription_management',
     p_max_actions: 100,
     p_window_minutes: 60
   });
   ```

3. **Comprehensive Audit Logging**
   ```typescript
   await supabase.from('admin_audit_log').insert({
     admin_user_id: user.id,
     action: `grant_subscription_${tier}_${duration}`,
     target_user_id: userId,
     details: { previous_state, new_state, notes, duration },
     ip_address: ipAddress,
     user_agent: userAgent
   });
   ```

**View Logs**: [Admin Edge Function Logs](https://supabase.com/dashboard/project/fkvjsgqjgissolpdqbdh/functions/admin-manage-subscription/logs)

---

## Database Functions

### `check_admin_rate_limit()`
**Parameters**:
- `p_admin_user_id`: Admin user UUID
- `p_action_type`: Type of action (e.g., 'subscription_management')
- `p_max_actions`: Maximum actions allowed (default: 100)
- `p_window_minutes`: Time window in minutes (default: 60)

**Returns**: `boolean` - true if within limit, false if exceeded

**Features**:
- Tracks actions per hour with automatic cleanup
- Uses upsert to increment action count
- Removes records older than 24 hours

---

## Additional Security Recommendations

### Optional Enhancements (Not Implemented)
1. **Multi-Factor Authentication (MFA)**: Require MFA for admin accounts
2. **Session Timeout**: Auto-logout admins after inactivity
3. **IP Whitelisting**: Restrict admin access to specific IPs
4. **Admin Role Management UI**: Create interface for granting/revoking admin roles
5. **Enhanced Logging**: Add more granular action types and context

### Monitoring Best Practices
1. **Regular Audit Review**: Check audit logs weekly for suspicious activity
2. **Rate Limit Monitoring**: Alert if rate limits are frequently hit
3. **Failed Login Tracking**: Monitor for brute force attempts
4. **Database Backup**: Regular backups of audit logs for compliance

---

## Support

For issues or questions:
1. Check edge function logs: [Functions Dashboard](https://supabase.com/dashboard/project/fkvjsgqjgissolpdqbdh/functions)
2. Review database logs: [Postgres Logs](https://supabase.com/dashboard/project/fkvjsgqjgissolpdqbdh/logs/postgres-logs)
3. Check auth logs: [Auth Logs](https://supabase.com/dashboard/project/fkvjsgqjgissolpdqbdh/logs/auth-logs)

---

## Summary

✅ **Admin access is secure and restricted to `support@pivothub.io`**
✅ **New accounts cannot access admin features**
✅ **All admin actions are logged with IP tracking**
✅ **Rate limiting prevents abuse (100 actions/hour)**
✅ **Enhanced audit log viewer shows detailed changes**
