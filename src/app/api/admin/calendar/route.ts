import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const CALENDAR_SETTING_KEY = 'ADMIN_CUSTOM_CALENDAR_EVENTS';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'INTERVIEW' | 'MEDICAL' | 'VISA' | 'FLIGHT' | 'MEETING' | 'EVENT';
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  candidateName?: string;
  description?: string;
  color?: string;
  isSystem?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // e.g. "2026-10"

    const events: CalendarEvent[] = [];

    // 1. Fetch Custom Events
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: CALENDAR_SETTING_KEY },
      });
      if (setting?.value) {
        const customEvents: CalendarEvent[] = JSON.parse(setting.value);
        events.push(...customEvents);
      }
    } catch (e) {}

    // 2. Fetch Interviews
    try {
      const interviews = await prisma.interview.findMany({
        take: 50,
        orderBy: { scheduledAt: 'asc' },
        include: {
          applicant: { select: { fullName: true } },
          job: { select: { title: true } },
        },
      });

      interviews.forEach((i) => {
        events.push({
          id: `ev-int-${i.id}`,
          title: `ইন্টারভিউ: ${i.applicant.fullName}`,
          type: 'INTERVIEW',
          date: i.scheduledAt.toISOString().split('T')[0],
          startTime: i.scheduledAt.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
          location: i.location || 'Agency Office',
          candidateName: i.applicant.fullName,
          description: `চাকরি: ${i.job.title} | স্ট্যাটাস: ${i.status}`,
          color: 'blue',
          isSystem: true,
        });
      });
    } catch (e) {}

    // 3. Fetch Medical Records
    try {
      const medicals = await prisma.medicalRecord.findMany({
        where: { appointmentDate: { not: null } },
        take: 50,
        orderBy: { appointmentDate: 'asc' },
        include: {
          applicant: { select: { fullName: true } },
        },
      });

      medicals.forEach((m) => {
        if (m.appointmentDate) {
          events.push({
            id: `ev-med-${m.id}`,
            title: `মেডিকেল অ্যাপয়েন্টমেন্ট: ${m.applicant.fullName}`,
            type: 'MEDICAL',
            date: m.appointmentDate.toISOString().split('T')[0],
            location: (m as any).medicalCenterName || (m as any).medicalCenter || 'GAMCA Approved Center',
            candidateName: m.applicant.fullName,
            description: `রিজাল্ট: ${m.result}`,
            color: 'emerald',
            isSystem: true,
          });
        }
      });
    } catch (e) {}

    // 4. Fetch Departure Records (Flight departures)
    try {
      const departures = await prisma.departureRecord.findMany({
        take: 50,
        orderBy: { departureDate: 'asc' },
        include: {
          applicant: { select: { fullName: true } },
        },
      });

      departures.forEach((d) => {
        if (d.departureDate) {
          events.push({
            id: `ev-dep-${d.id}`,
            title: `ফ্লাইট ডিপার্চার: ${d.applicant.fullName}`,
            type: 'FLIGHT',
            date: d.departureDate.toISOString().split('T')[0],
            startTime: d.reportingTime ? d.reportingTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '14:30',
            location: `${d.departureAirport || 'DAC'} -> ${d.destinationAirport || 'Destination'}`,
            candidateName: d.applicant.fullName,
            description: `এয়ারলাইন্স: ${d.airline || 'Biman'} (${d.flightNumber || 'Flight'}) | PNR: ${d.pnrNumber || 'N/A'}`,
            color: 'purple',
            isSystem: true,
          });
        }
      });
    } catch (e) {}

    // Sort by date ascending
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        events,
      },
    });
  } catch (error: any) {
    console.error('Failed to get calendar events:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve calendar' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, date, startTime, endTime, location, description, color } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, error: 'শিরোনাম ও তারিখ আবশ্যক' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: CALENDAR_SETTING_KEY },
    });

    let events: CalendarEvent[] = [];
    if (setting?.value) {
      try {
        events = JSON.parse(setting.value);
      } catch (e) {
        events = [];
      }
    }

    const newEvent: CalendarEvent = {
      id: `cal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      type: type || 'EVENT',
      date,
      startTime: startTime || '',
      endTime: endTime || '',
      location: location || '',
      description: description || '',
      color: color || 'indigo',
      isSystem: false,
    };

    events.push(newEvent);

    await prisma.systemSetting.upsert({
      where: { key: CALENDAR_SETTING_KEY },
      create: {
        key: CALENDAR_SETTING_KEY,
        value: JSON.stringify(events),
        group: 'calendar',
        description: 'Admin business calendar events',
      },
      update: {
        value: JSON.stringify(events),
      },
    });

    return NextResponse.json({ success: true, data: newEvent });
  } catch (error: any) {
    console.error('Failed to save calendar event:', error);
    return NextResponse.json({ success: false, error: 'Failed to save event' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: CALENDAR_SETTING_KEY },
    });

    if (!setting?.value) {
      return NextResponse.json({ success: true });
    }

    let events: CalendarEvent[] = JSON.parse(setting.value);
    events = events.filter((e) => e.id !== id);

    await prisma.systemSetting.update({
      where: { key: CALENDAR_SETTING_KEY },
      data: { value: JSON.stringify(events) },
    });

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error: any) {
    console.error('Failed to delete calendar event:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 });
  }
}
