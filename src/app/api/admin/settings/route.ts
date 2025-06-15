import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

async function getActualSettings() {
  try {
    // Get actual environment and system settings
    const settings = {
      general: {
        siteName: process.env.SITE_NAME || 'AI Content Repurposer Studio',
        siteUrl: process.env.NEXTAUTH_URL || process.env.SITE_URL || 'http://localhost:3000',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        timezone: process.env.TZ || 'UTC',
        language: process.env.DEFAULT_LANGUAGE || 'en',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true' || false,
      },
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD ? '••••••••' : '', // Mask actual password
        fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.FROM_NAME || 'AI Content Repurposer',
        encryption: process.env.SMTP_ENCRYPTION || 'tls',
      },
      security: {
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '60'),
        requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
        enableTwoFactor: process.env.ENABLE_2FA === 'true',
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        enableCaptcha: process.env.ENABLE_CAPTCHA === 'true',
      },
      api: {
        rateLimit: parseInt(process.env.API_RATE_LIMIT || '1000'),
        enableApiKeys: process.env.ENABLE_API_KEYS !== 'false',
        enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
        webhookSecret: process.env.WEBHOOK_SECRET ? '••••••••' : '',
        corsOrigins: process.env.CORS_ORIGINS || process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      notifications: {
        emailNotifications: process.env.EMAIL_NOTIFICATIONS !== 'false',
        systemAlerts: process.env.SYSTEM_ALERTS !== 'false',
        userRegistrations: process.env.USER_REGISTRATION_ALERTS !== 'false',
        paymentNotifications: process.env.PAYMENT_NOTIFICATIONS !== 'false',
        errorNotifications: process.env.ERROR_NOTIFICATIONS !== 'false',
      },
      backup: {
        autoBackup: process.env.AUTO_BACKUP !== 'false',
        backupFrequency: process.env.BACKUP_FREQUENCY || 'daily',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
        backupLocation: process.env.BACKUP_LOCATION || 'local',
      },
    };

    // Get additional database statistics
    try {
      const userCount = await prisma.user.count();
      const contentCount = await prisma.content?.count() || 0;
      
      // Add actual system info
      settings.general = {
        ...settings.general,
        totalUsers: userCount,
        totalContent: contentCount,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (dbError) {
      console.log('Database connection issue for stats:', dbError);
    }

    return settings;
  } catch (error) {
    console.error('Error getting actual settings:', error);
    // Fallback to minimal settings if there's an error
    return {
      general: {
        siteName: 'AI Content Repurposer Studio',
        siteUrl: 'http://localhost:3000',
        supportEmail: 'support@example.com',
        timezone: 'UTC',
        language: 'en',
        maintenanceMode: false,
        totalUsers: 0,
        totalContent: 0,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
      email: {
        provider: 'smtp',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: '',
        encryption: 'tls',
      },
      security: {
        maxLoginAttempts: 5,
        sessionTimeout: 60,
        requireEmailVerification: true,
        enableTwoFactor: false,
        passwordMinLength: 8,
        enableCaptcha: false,
      },
      api: {
        rateLimit: 1000,
        enableApiKeys: true,
        enableWebhooks: false,
        webhookSecret: '',
        corsOrigins: 'http://localhost:3000',
      },
      notifications: {
        emailNotifications: true,
        systemAlerts: true,
        userRegistrations: true,
        paymentNotifications: true,
        errorNotifications: true,
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        backupLocation: 'local',
      },
    };
  }
}

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const settings = await getActualSettings();

    return NextResponse.json({
      success: true,
      settings,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return new NextResponse('Settings data required', { status: 400 });
    }

    // Validate settings structure
    const requiredSections = ['general', 'email', 'security', 'api', 'notifications', 'backup'];
    for (const section of requiredSections) {
      if (!settings[section]) {
        return new NextResponse(`Missing ${section} settings`, { status: 400 });
      }
    }

    // In a real application, you would save these to a database or configuration file
    // For now, we'll simulate saving and log the changes
    console.log('[SETTINGS_UPDATED]', {
      timestamp: new Date().toISOString(),
      sections: Object.keys(settings),
      adminRequest: true,
      changes: {
        general: settings.general?.siteName !== 'AI Content Repurposer Studio',
        email: settings.email?.smtpHost !== '',
        security: settings.security?.maxLoginAttempts !== 5,
        api: settings.api?.rateLimit !== 1000,
        notifications: Object.values(settings.notifications).some(v => !v),
        backup: settings.backup?.autoBackup !== true
      }
    });

    // TODO: In production, implement actual settings persistence:
    // 1. Save to database settings table
    // 2. Update environment variables where applicable
    // 3. Trigger system configuration reload
    // 4. Send notifications about configuration changes

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString(),
      note: 'Settings changes logged. In production, these would be persisted to database and applied system-wide.'
    });
  } catch (error) {
    console.error('[SETTINGS_UPDATE_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 