'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function PortalNotificationsPage() {
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch {
      error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        success('All marked as read');
        fetchNotifs();
      }
    } catch {
      error('Error updating notifications');
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await fetch('/api/portal/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      fetchNotifs();
    } catch {
      // silent
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" />
            Notifications & Alerts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Official operational notices, interview reminders, document approvals, and visa status changes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={loading || notifications.every((n) => n.isRead)}
        >
          <Check className="w-4 h-4 mr-1.5" />
          Mark all as read
        </Button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading alerts...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-foreground">No notifications yet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Important updates regarding your applications and documents will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-card border-border'
                  : 'bg-primary/5 border-primary/20 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-foreground">{n.title}</h4>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{n.message}</p>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {n.link && (
                  <Link href={n.link}>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      View <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
