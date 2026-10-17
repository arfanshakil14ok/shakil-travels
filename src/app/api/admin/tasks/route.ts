import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const TASKS_SETTING_KEY = 'ADMIN_CUSTOM_TASKS';

interface TaskItem {
  id: string;
  title: string;
  category: 'PASSPORT' | 'MEDICAL' | 'VISA' | 'FLIGHT' | 'GENERAL' | 'FINANCE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  assignee?: string;
  notes?: string;
  applicantName?: string;
  createdAt: string;
  isSystemGenerated?: boolean;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch custom tasks from SystemSetting
    const setting = await prisma.systemSetting.findUnique({
      where: { key: TASKS_SETTING_KEY },
    });

    let customTasks: TaskItem[] = [];
    if (setting?.value) {
      try {
        customTasks = JSON.parse(setting.value);
      } catch (e) {
        customTasks = [];
      }
    }

    // 2. Dynamically gather real operational tasks from recruitment pipeline
    const operationalTasks: TaskItem[] = [];

    // A. Pending Medicals
    try {
      const pendingMedicals = await prisma.medicalRecord.findMany({
        where: { result: 'PENDING' },
        take: 5,
        include: {
          applicant: { select: { fullName: true } },
        },
        orderBy: { appointmentDate: 'asc' },
      });

      pendingMedicals.forEach((m) => {
        operationalTasks.push({
          id: `op-med-${m.id}`,
          title: `মেডিকেল রিপোর্ট ফলোআপ ও ভেরিফিকেশন (${m.applicant.fullName})`,
          category: 'MEDICAL',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: m.appointmentDate ? m.appointmentDate.toISOString() : new Date().toISOString(),
          applicantName: m.applicant.fullName,
          notes: `মেডিকেল সেন্টার: ${(m as any).medicalCenterName || (m as any).medicalCenter || 'GAMCA'}`,
          createdAt: m.createdAt.toISOString(),
          isSystemGenerated: true,
        });
      });
    } catch (e) {
      // ignore if table doesn't have records
    }

    // B. Upcoming Interviews
    try {
      const upcomingInterviews = await prisma.interview.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { gte: new Date() },
        },
        take: 5,
        include: {
          applicant: { select: { fullName: true } },
          job: { select: { title: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      });

      upcomingInterviews.forEach((i) => {
        operationalTasks.push({
          id: `op-int-${i.id}`,
          title: `ইন্টারভিউ গ্রহণ: ${i.applicant.fullName} (${i.job.title})`,
          category: 'PASSPORT',
          priority: 'URGENT',
          status: 'IN_PROGRESS',
          dueDate: i.scheduledAt.toISOString(),
          applicantName: i.applicant.fullName,
          notes: `ইন্টারভিউ ধরন: ${i.interviewType || 'DIRECT'}`,
          createdAt: i.createdAt.toISOString(),
          isSystemGenerated: true,
        });
      });
    } catch (e) {
      // ignore
    }

    // C. Pending Visa Applications
    try {
      const pendingVisas = await prisma.visaApplication.findMany({
        where: {
          status: { in: ['APPLIED', 'SUBMITTED', 'UNDER_REVIEW'] },
        },
        take: 5,
        include: {
          applicant: { select: { fullName: true } },
          country: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      pendingVisas.forEach((v) => {
        operationalTasks.push({
          id: `op-visa-${v.id}`,
          title: `ভিসা স্ট্যাম্পিং ও এম্বাসি ফলোআপ: ${v.applicant.fullName} (${v.country?.name || 'গন্তব্য'})`,
          category: 'VISA',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: v.submissionDate ? v.submissionDate.toISOString() : (v.appointmentDate ? v.appointmentDate.toISOString() : new Date().toISOString()),
          applicantName: v.applicant.fullName,
          notes: `ভিসা ট্র্যাকিং রেফারেন্স: ${v.referenceNumber || v.visaApplicationNumber || 'Pending'}`,
          createdAt: v.createdAt.toISOString(),
          isSystemGenerated: true,
        });
      });
    } catch (e) {
      // ignore
    }

    const allTasks = [...customTasks, ...operationalTasks];

    // Calculate metrics
    const total = allTasks.length;
    const completed = allTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const pending = allTasks.filter((t) => t.status === 'PENDING').length;
    const urgent = allTasks.filter((t) => t.priority === 'URGENT' && t.status !== 'COMPLETED').length;

    return NextResponse.json({
      success: true,
      data: {
        tasks: allTasks,
        stats: {
          total,
          completed,
          inProgress,
          pending,
          urgent,
        },
      },
    });
  } catch (error: any) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, category, priority, dueDate, assignee, notes, applicantName } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'টাস্কের শিরোনাম আবশ্যক' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: TASKS_SETTING_KEY },
    });

    let tasks: TaskItem[] = [];
    if (setting?.value) {
      try {
        tasks = JSON.parse(setting.value);
      } catch (e) {
        tasks = [];
      }
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      category: category || 'GENERAL',
      priority: priority || 'MEDIUM',
      status: 'PENDING',
      dueDate: dueDate || new Date().toISOString(),
      assignee: assignee || user.name,
      notes: notes || '',
      applicantName: applicantName || '',
      createdAt: new Date().toISOString(),
      isSystemGenerated: false,
    };

    tasks.unshift(newTask);

    await prisma.systemSetting.upsert({
      where: { key: TASKS_SETTING_KEY },
      create: {
        key: TASKS_SETTING_KEY,
        value: JSON.stringify(tasks),
        group: 'tasks',
        description: 'Admin and staff recruitment tasks list',
      },
      update: {
        value: JSON.stringify(tasks),
      },
    });

    return NextResponse.json({ success: true, data: newTask });
  } catch (error: any) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, priority, dueDate, notes, title } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: TASKS_SETTING_KEY },
    });

    let tasks: TaskItem[] = [];
    if (setting?.value) {
      try {
        tasks = JSON.parse(setting.value);
      } catch (e) {
        tasks = [];
      }
    }

    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      // If it's an operational task being updated, store it as custom task state
      if (id.startsWith('op-')) {
        tasks.push({
          id,
          title: title || 'Operational Task',
          category: 'GENERAL',
          priority: priority || 'HIGH',
          status: status || 'COMPLETED',
          dueDate: dueDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isSystemGenerated: true,
        });
      } else {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      }
    } else {
      if (status !== undefined) tasks[index].status = status;
      if (priority !== undefined) tasks[index].priority = priority;
      if (dueDate !== undefined) tasks[index].dueDate = dueDate;
      if (notes !== undefined) tasks[index].notes = notes;
      if (title !== undefined) tasks[index].title = title;
    }

    await prisma.systemSetting.upsert({
      where: { key: TASKS_SETTING_KEY },
      create: {
        key: TASKS_SETTING_KEY,
        value: JSON.stringify(tasks),
        group: 'tasks',
      },
      update: {
        value: JSON.stringify(tasks),
      },
    });

    return NextResponse.json({ success: true, message: 'Task updated successfully' });
  } catch (error: any) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: TASKS_SETTING_KEY },
    });

    if (!setting?.value) {
      return NextResponse.json({ success: true });
    }

    let tasks: TaskItem[] = JSON.parse(setting.value);
    tasks = tasks.filter((t) => t.id !== id);

    await prisma.systemSetting.update({
      where: { key: TASKS_SETTING_KEY },
      data: { value: JSON.stringify(tasks) },
    });

    return NextResponse.json({ success: true, message: 'Task removed successfully' });
  } catch (error: any) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
