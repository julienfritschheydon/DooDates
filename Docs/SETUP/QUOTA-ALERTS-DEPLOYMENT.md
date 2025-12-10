# 🚨 Quota Alerts System - Deployment Guide

## 📋 Overview

The Quota Alerts system provides:
- **Admin Dashboard**: Visual monitoring of quota usage with charts and export
- **Email Alerts**: Automatic notifications for unusual consumption patterns
- **Anomaly Detection**: High usage (>50 credits) and suspicious activity (>30 credits/hour)

## 🛠️ Setup Requirements

### 1. Email Service (Resend)

```bash
# Get API key from resend.com
# Configure in Supabase Dashboard → Settings → Environment Variables
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=julien.fritsch@gmail.com
```

### 2. Deploy Edge Function

```bash
# Deploy the quota alerts function
npx supabase functions deploy quota-alerts

# Verify deployment
npx supabase functions list
```

### 3. Configure Cron Job

The function includes `cron.json` for automatic checks:
```json
{
  "schedule": "0 */6 * * *"  // Every 6 hours
}
```

## 🧪 Testing

### Quick Test Script
```bash
npm run test:quota-alerts
```

### Manual Testing Steps

1. **Access Admin Dashboard**
   ```bash
   npm run dev
   # Navigate to: http://localhost:5173/admin/quota-dashboard
   ```

2. **Test Email Alerts**
   - Go to "Alerts & Monitoring" tab
   - Click "Send Test" button
   - Check email at julien.fritsch@gmail.com

3. **Verify Dashboard Features**
   - Statistics cards show correct numbers
   - Charts render properly
   - CSV export works
   - Status badges appear correctly

## 🔧 Configuration

### Alert Thresholds
- **High Usage**: 50 credits total
- **Suspicious Activity**: 30 credits in 1 hour
- **Check Frequency**: Every 6 hours

### Email Recipient
Default: `julien.fritsch@gmail.com`
Can be changed via `ADMIN_EMAIL` environment variable.

## 📊 Dashboard Features

### Main Dashboard Tab
- **Statistics Cards**: Total guests, credits consumed, active users, high usage
- **Charts**: Top users bar chart, action distribution pie chart
- **Detailed Table**: All users with status badges
- **Export**: Download CSV report

### Alerts & Monitoring Tab
- **Alert Summary**: Current alert counts by type
- **Active Alerts**: List of users triggering alerts
- **Manual Controls**: Check now, send test email
- **Configuration**: View current thresholds and settings

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending**
   ```bash
   # Check Resend API key
   npx supabase functions logs quota-alerts
   
   # Verify environment variables
   npx supabase secrets list
   ```

2. **Dashboard not loading**
   - Verify user has admin role in `profiles` table
   - Check browser console for errors
   - Ensure Edge Function is deployed

3. **No alerts showing**
   - Check if users have >50 credits consumption
   - Verify `quota_tracking` and `guest_quotas` tables exist
   - Run manual alert check from dashboard

### Debug Commands

```bash
# Check function logs
npx supabase functions logs quota-alerts

# Test function directly
curl -X POST https://your-project.supabase.co/functions/v1/quota-alerts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# View environment variables
npx supabase secrets list
```

## 📈 Monitoring

### Production Monitoring
- Check dashboard daily for high usage users
- Monitor email alerts for suspicious patterns
- Review function logs for errors

### Performance Metrics
- Response time should be <2 seconds
- Email delivery within 5 minutes
- Automatic checks every 6 hours

## 🔄 Maintenance

### Regular Tasks
1. **Weekly**: Review dashboard for unusual patterns
2. **Monthly**: Check email quota usage (Resend limit: 1000/month)
3. **Quarterly**: Adjust alert thresholds if needed

### Updates
- Redeploy function after code changes:
  ```bash
  npx supabase functions deploy quota-alerts
  ```

## 📞 Support

For issues:
1. Check browser console
2. Review function logs
3. Verify environment variables
4. Test with `npm run test:quota-alerts`

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-12-10
**Version**: 1.0
