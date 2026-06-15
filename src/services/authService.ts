import prisma from '@/lib/db';
import { hashPassword, comparePassword, createToken } from '@/lib/auth';

export class AuthService {
  /**
   * User Signup & Automatic Organization Provisioning
   */
  static async signup(data: { email: string; name: string; passwordHash: string; orgName?: string }) {
    // 1. Check user uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new Error('User account with this email already registered.');
    }

    // 2. Provision new tenant organization
    const org = await prisma.organization.create({
      data: {
        name: data.orgName || `${data.name}'s Gold Vaults`
      }
    });

    // 3. Hash passwords
    const hashed = await hashPassword(data.passwordHash);

    // 4. Create User as Administrator
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashed,
        role: 'Admin',
        orgId: org.id
      }
    });

    // Proactively initialize default mock items inside the DB for demo
    await prisma.customer.createMany({
      data: [
        { name: 'Al-Jazeera Jewellers', email: 'ops@aljazeera.ae', phone: '+971 4 226', company: 'Al-Jazeera Trading', orgId: org.id, status: 'active', tags: ['Enterprise'] },
        { name: 'Nadir Refining Corp', email: 'comp@nadir.com', phone: '+90 212', company: 'Nadir Metals A.S.', orgId: org.id, status: 'active', tags: ['Refinery'] },
        { name: 'Valcambi Swiss Trade', email: 'swiss@valcambi.ch', phone: '+41 91', company: 'Valcambi SA', orgId: org.id, status: 'active', tags: ['Global Partner'] }
      ]
    });

    const token = createToken({ userId: user.id, email: user.email, role: user.role, orgId: user.orgId });

    return { user, org, token };
  }

  /**
   * User Login & Token session creation
   */
  static async login(data: { email: string; passwordPlain: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { organization: true }
    });

    if (!user) {
      throw new Error('Invalid email or password credentials.');
    }

    const matches = await comparePassword(data.passwordPlain, user.password);
    if (!matches) {
      throw new Error('Invalid email or password credentials.');
    }

    const token = createToken({ userId: user.id, email: user.email, role: user.role, orgId: user.orgId });

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      orgName: user.organization.name,
      token,
      twoFactorRequired: user.twoFactorEnabled
    };
  }

  /**
   * Verify Two-Factor secret codes
   */
  static async verify2FA(data: { userId: string; code: string }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) throw new Error('User not found.');

    // Simulated TOTP checksum validator
    if (data.code === '123456') {
      return { success: true };
    }
    
    throw new Error('Invalid 2FA code verification failed.');
  }
}
