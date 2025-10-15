import React from "react";
import { Progress } from "./ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Upload,
  Database,
} from "lucide-react";
import {
  MigrationProgress as MigrationProgressType,
  MigrationStatus,
} from "../lib/storage/ConversationMigrationService";

interface MigrationProgressProps {
  progress: MigrationProgressType | null;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

const statusConfig: Record<
  MigrationStatus,
  {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  not_started: {
    icon: <Database className="h-4 w-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Ready",
  },
  in_progress: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "In Progress",
  },
  validating: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Validating",
  },
  uploading: {
    icon: <Upload className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Uploading",
  },
  verifying: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Verifying",
  },
  completed: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Completed",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Failed",
  },
  rolled_back: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Rolled Back",
  },
};

export function MigrationProgress({
  progress,
  onCancel,
  onRetry,
  className = "",
}: MigrationProgressProps) {
  if (!progress) {
    return null;
  }

  const config = statusConfig[progress.status];
  const progressPercentage = Math.round(
    (progress.completedSteps / progress.totalSteps) * 100,
  );
  const conversationProgress =
    progress.totalConversations > 0
      ? Math.round(
          (progress.processedConversations / progress.totalConversations) * 100,
        )
      : 0;
  const messageProgress =
    progress.totalMessages > 0
      ? Math.round((progress.processedMessages / progress.totalMessages) * 100)
      : 0;

  const isActive = [
    "in_progress",
    "validating",
    "uploading",
    "verifying",
  ].includes(progress.status);
  const isCompleted = progress.status === "completed";
  const isFailed = ["failed", "rolled_back"].includes(progress.status);

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.round((end.getTime() - startTime.getTime()) / 1000);

    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              {config.icon}
            </div>
            Migration Status
          </CardTitle>
          <Badge
            variant="secondary"
            className={`${config.color} ${config.bgColor}`}
          >
            {config.label}
          </Badge>
        </div>
        <CardDescription>{progress.currentStep}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-xs text-gray-500">
            Step {progress.completedSteps} of {progress.totalSteps}
          </div>
        </div>

        {/* Detailed Progress */}
        {(progress.totalConversations > 0 || progress.totalMessages > 0) && (
          <div className="space-y-3 pt-2 border-t">
            {progress.totalConversations > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Conversations</span>
                  <span>
                    {progress.processedConversations}/
                    {progress.totalConversations}
                  </span>
                </div>
                <Progress value={conversationProgress} className="h-1" />
              </div>
            )}

            {progress.totalMessages > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Messages</span>
                  <span>
                    {progress.processedMessages}/{progress.totalMessages}
                  </span>
                </div>
                <Progress value={messageProgress} className="h-1" />
              </div>
            )}
          </div>
        )}

        {/* Duration */}
        <div className="text-xs text-gray-500 flex justify-between">
          <span>
            Duration: {formatDuration(progress.startTime, progress.endTime)}
          </span>
          {progress.endTime && (
            <span>Completed at {progress.endTime.toLocaleTimeString()}</span>
          )}
        </div>

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-red-600">
              Errors ({progress.errors.length})
            </div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {progress.errors.slice(0, 3).map((error, index) => (
                <div
                  key={index}
                  className="text-xs text-red-500 bg-red-50 p-2 rounded"
                >
                  {error}
                </div>
              ))}
              {progress.errors.length > 3 && (
                <div className="text-xs text-gray-500">
                  ... and {progress.errors.length - 3} more errors
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isActive && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}

          {isFailed && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex-1"
            >
              Retry
            </Button>
          )}

          {isCompleted && (
            <div className="flex-1 text-center text-sm text-green-600 font-medium py-2">
              ✓ Migration completed successfully
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
