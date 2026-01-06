import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { ErrorFactory } from "../../lib/error-handling";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Bell, CheckCircle, RefreshCw, Mail } from "lucide-react";

interface QuotaAlert {
  user_id: string;
  fingerprint?: string;
  total_credits_consumed: number;
  threshold: number;
  alert_type: "high_usage" | "suspicious_activity";
}

interface AlertStatus {
  alerts_count: number;
  alerts: QuotaAlert[];
  last_check?: string;
}

export default function QuotaAlerts() {
  const [alertStatus, setAlertStatus] = useState<AlertStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAlertStatus();
  }, []);

  const checkAlertStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw ErrorFactory.authentication("Not authenticated");
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/quota-alerts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw ErrorFactory.api(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAlertStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check alert status");
    } finally {
      setLoading(false);
    }
  };

  const triggerAlertCheck = async () => {
    setChecking(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw ErrorFactory.authentication("Not authenticated");
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/quota-alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw ErrorFactory.api(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAlertStatus(data);
      setSuccess(`Alert check completed. Found ${data.alerts_found} alerts.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger alert check");
    } finally {
      setChecking(false);
    }
  };

  const sendTestAlert = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw ErrorFactory.authentication("Not authenticated");
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/quota-alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw ErrorFactory.api(`HTTP error! status: ${response.status}`);
      }

      setSuccess("Test alert email sent successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test alert");
    } finally {
      setSending(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "high_usage":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "suspicious_activity":
        return <Bell className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "high_usage":
        return <Badge variant="secondary">High Usage</Badge>;
      case "suspicious_activity":
        return <Badge variant="destructive">Suspicious</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading alert status...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quota Anomaly Alerts</h2>
          <p className="text-gray-600">
            Monitor and send email alerts for unusual quota consumption
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={checkAlertStatus}
            disabled={loading}
            className="flex items-center gap-2"
            data-testid="quotaalerts-button"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={triggerAlertCheck}
            disabled={checking}
            className="flex items-center gap-2"
            data-testid="quotaalerts-button"
          >
            <Bell className={`h-4 w-4 ${checking ? "animate-pulse" : ""}`} />
            {checking ? "Checking..." : "Check Now"}
          </Button>
          <Button
            variant="outline"
            onClick={sendTestAlert}
            disabled={sending}
            className="flex items-center gap-2"
            data-testid="quotaalerts-button"
          >
            <Mail className={`h-4 w-4 ${sending ? "animate-pulse" : ""}`} />
            {sending ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStatus?.alerts_count || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {alertStatus?.alerts.filter((a) => a.alert_type === "high_usage").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">&gt; 50 credits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {alertStatus?.alerts.filter((a) => a.alert_type === "suspicious_activity").length ||
                0}
            </div>
            <p className="text-xs text-muted-foreground">&gt; 30 credits/hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Users triggering quota anomaly detection</CardDescription>
        </CardHeader>
        <CardContent>
          {alertStatus?.alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No quota anomalies detected</p>
              <p className="text-sm">All users are within normal usage limits</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertStatus?.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alert_type)}
                    <div>
                      <p className="font-medium">
                        User: {alert.user_id.substring(0, 8)}...
                        {alert.fingerprint && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({alert.fingerprint.substring(0, 8)}...)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {alert.alert_type === "high_usage"
                          ? `Total consumption: ${alert.total_credits_consumed} credits`
                          : `Rapid consumption: ${alert.total_credits_consumed} credits in 1 hour`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getAlertBadge(alert.alert_type)}
                    <span className="text-sm font-medium">{alert.total_credits_consumed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>High Usage Threshold:</span>
              <Badge variant="outline">50 credits</Badge>
            </div>
            <div className="flex justify-between">
              <span>Suspicious Activity Threshold:</span>
              <Badge variant="outline">30 credits/hour</Badge>
            </div>
            <div className="flex justify-between">
              <span>Automatic Check Frequency:</span>
              <Badge variant="outline">Every 6 hours</Badge>
            </div>
            <div className="flex justify-between">
              <span>Email Recipient:</span>
              <Badge variant="outline">admin@doodates.com</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
