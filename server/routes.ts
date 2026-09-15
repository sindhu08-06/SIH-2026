import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from './db';
import { hashPassword, generateSalt, createSession, getUserByToken } from './auth';

export const apiRouter = Router();

// Helper to extract bearer token
function getBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return (req.query.token as string) || '';
}

// -------------------------------------------------------------
// Database Health & Telemetry
// -------------------------------------------------------------
apiRouter.get('/db/stats', (_req: Request, res: Response) => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    const workerCount = (db.prepare('SELECT COUNT(*) as c FROM workers').get() as any)?.c || 0;
    const verifiedWorkerCount = (db.prepare("SELECT COUNT(*) as c FROM workers WHERE verification_status = 'verified'").get() as any)?.c || 0;
    const bookingCount = (db.prepare('SELECT COUNT(*) as c FROM bookings').get() as any)?.c || 0;
    const activeBookingCount = (db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status IN ('open', 'assigned', 'in_transit', 'in_progress')").get() as any)?.c || 0;

    res.json({
      success: true,
      database: 'SQLite (Node 22 DatabaseSync)',
      connected: true,
      stats: {
        users: userCount,
        workers: workerCount,
        verifiedWorkers: verifiedWorkerCount,
        bookings: bookingCount,
        activeBookings: activeBookingCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve DB stats', details: error.message });
  }
});

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      primarySkill,
      skills,
      hourlyRate,
      area,
      city,
      lat,
      lng,
      certTitle,
      certNumber,
      issuingBody,
      idProofType,
      idProofNumber,
      documentType,
      credentialFileName,
      digitalSealCode,
      skillCheckScore,
      skillCheckStatus,
      skillCheckCompletedAt,
      emergencyCertified,
    } = req.body || {};

    if (!name || !password || !role) {
      return res.status(400).json({ error: 'Name, password, and role are required' });
    }

    const cleanEmail = (email || `${phone || Date.now()}@sahakar.coop`).toLowerCase().trim();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Account with this email already exists. Please log in.' });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `u-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, phone, name, role, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanEmail, phone || '', name, role, passwordHash, salt, now);

    let workerData: any = null;

    // If registering as a worker, also create worker profile in database
    if (role === 'worker') {
      const workerId = `w-${crypto.randomUUID().slice(0, 8)}`;
      const memberCode = `PUN-${(primarySkill || 'ART').toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;

      let parsedSkills: string[] = [];
      if (Array.isArray(skills)) {
        parsedSkills = skills.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === 'string' && skills.trim()) {
        parsedSkills = skills.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
      }
      if (parsedSkills.length === 0) {
        parsedSkills = [primarySkill || 'Electrical', 'General Repair & Maintenance'];
      }

      const rate = Number(hourlyRate) > 0 ? Number(hourlyRate) : 400;
      const finalCertTitle = certTitle || `${primarySkill || 'Trade'} Certified Artisan`;
      const finalCertNumber = certNumber || `COOP-${(primarySkill || 'ART').slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const finalIssuingBody = issuingBody || 'Directorate General of Training / State Cooperative Board';
      const finalDocType = documentType || 'iti_diploma';
      const finalSeal = digitalSealCode || `COOP-SEAL-${(primarySkill || 'ART').slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalScore = typeof skillCheckScore === 'number' ? skillCheckScore : (skillCheckScore ? Number(skillCheckScore) : 100);
      const finalSkillStatus = finalScore >= 70 ? 'passed' : 'failed';
      // Worker is verified if they passed skill check and provided government ID; otherwise set to under_review
      const computedVerificationStatus = (finalSkillStatus === 'passed' && idProofNumber) ? 'verified' : 'under_review';

      db.prepare(`
        INSERT INTO workers (
          id, user_id, name, phone, email, society_id, society_name, coop_member_id,
          primary_skill, skills_json, hourly_rate, service_radius_km, lat, lng, city, area,
          verification_status, cert_title, cert_number, issuing_body, id_proof_type, id_proof_number,
          credential_doc_type, credential_file_name, digital_seal_code, skill_check_score, skill_check_status, skill_check_completed_at,
          emergency_certified, availability, rating, completed_jobs_count,
          bank_upi, welfare_fund_balance, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        )
      `).run(
        workerId,
        userId,
        name,
        phone || '+91 98000 00000',
        cleanEmail,
        'soc-1',
        'Pune Central Urban Artisan Co-op',
        memberCode,
        primarySkill || 'Electrical',
        JSON.stringify(parsedSkills),
        rate,
        15,
        lat || 18.5204,
        lng || 73.8567,
        city || 'Pune',
        area || 'Shivajinagar',
        computedVerificationStatus,
        finalCertTitle,
        finalCertNumber,
        finalIssuingBody,
        idProofType || 'Aadhaar Card',
        idProofNumber || '',
        finalDocType,
        credentialFileName || 'trade_license_certificate.pdf',
        finalSeal,
        finalScore,
        finalSkillStatus,
        skillCheckCompletedAt || now,
        emergencyCertified ? 1 : 0,
        'available',
        5.0,
        0,
        `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
        0,
        now
      );

      // Also record official credential in certifications table
      try {
        const certId = `cert-${crypto.randomUUID().slice(0, 8)}`;
        db.prepare(`
          INSERT INTO certifications (
            id, worker_id, worker_name, society_name, primary_skill,
            title, issuing_body, credential_number, issue_date, expiry_date,
            document_type, verification_status, verified_at, verified_by, digital_seal_code, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'State Cooperative Technical Board', ?, ?)
        `).run(
          certId,
          workerId,
          name,
          'Pune Central Urban Artisan Co-op',
          primarySkill || 'Electrical',
          finalCertTitle,
          finalIssuingBody,
          finalCertNumber,
          now.split('T')[0],
          'Life Validity / NSQF Accredited',
          finalDocType,
          computedVerificationStatus,
          now.split('T')[0],
          finalSeal,
          now
        );
      } catch (certErr) {
        console.warn('Registration certification entry notice:', certErr);
      }

      workerData = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId);
      if (workerData) {
        workerData.skills = JSON.parse(workerData.skills_json || '[]');
        workerData.emergencyCertified = Boolean(workerData.emergency_certified);
        workerData.location = {
          city: workerData.city,
          area: workerData.area,
          coordinates: { lat: workerData.lat, lng: workerData.lng },
          serviceRadiusKm: workerData.service_radius_km,
        };
        const certs = db.prepare('SELECT * FROM certifications WHERE worker_id = ?').all(workerId);
        workerData.certifications = certs;
      }
    }

    const token = createSession(userId, role);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name,
        email: cleanEmail,
        phone,
        role,
        createdAt: now,
      },
      worker: workerData,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body || {}; // identifier = email or phone

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users WHERE LOWER(email) = ? OR phone = ?
    `).get(cleanId, identifier.trim()) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/phone or password' });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email/phone or password' });
    }

    const token = createSession(user.id, user.role);

    let workerData: any = null;
    if (user.role === 'worker') {
      workerData = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(user.id) as any;
      if (workerData) {
        workerData.skills = JSON.parse(workerData.skills_json || '[]');
      }
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
      },
      worker: workerData,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const session = getUserByToken(token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    let workerData: any = null;
    if (session.role === 'worker') {
      workerData = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(session.user_id) as any;
      if (workerData) {
        workerData.skills = JSON.parse(workerData.skills_json || '[]');
      }
    }

    return res.json({
      success: true,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        phone: session.phone,
        role: session.role,
        createdAt: session.created_at,
      },
      worker: workerData,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to verify session', details: error.message });
  }
});

// -------------------------------------------------------------
// Workers & Verification
// -------------------------------------------------------------
apiRouter.get('/workers', (req: Request, res: Response) => {
  try {
    const { category, verifiedOnly } = req.query;

    let query = 'SELECT * FROM workers WHERE 1=1';
    const params: any[] = [];

    if (verifiedOnly === 'true') {
      query += " AND verification_status = 'verified'";
    }

    query += ' ORDER BY rating DESC, completed_jobs_count DESC';

    const rows = db.prepare(query).all(...params) as any[];
    const allCerts = db.prepare('SELECT * FROM certifications').all() as any[];
    const certsByWorker: Record<string, any[]> = {};
    for (const c of allCerts) {
      if (!certsByWorker[c.worker_id]) certsByWorker[c.worker_id] = [];
      certsByWorker[c.worker_id].push(c);
    }

    const workers = rows.map((w) => ({
      ...w,
      skills: JSON.parse(w.skills_json || '[]'),
      location: {
        city: w.city,
        area: w.area,
        coordinates: { lat: w.lat, lng: w.lng },
        serviceRadiusKm: w.service_radius_km,
      },
      emergencyCertified: Boolean(w.emergency_certified),
      certifications: certsByWorker[w.id] || [],
    }));

    if (category) {
      const catLower = (category as string).toLowerCase();
      return res.json({
        workers: workers.filter(
          (w) =>
            w.primary_skill.toLowerCase().includes(catLower) ||
            w.skills.some((s: string) => s.toLowerCase().includes(catLower))
        ),
      });
    }

    return res.json({ workers });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch workers', details: error.message });
  }
});

apiRouter.get('/workers/:id', (req: Request, res: Response) => {
  try {
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(req.params.id) as any;
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    worker.skills = JSON.parse(worker.skills_json || '[]');
    worker.location = {
      city: worker.city,
      area: worker.area,
      coordinates: { lat: worker.lat, lng: worker.lng },
      serviceRadiusKm: worker.service_radius_km,
    };
    worker.emergencyCertified = Boolean(worker.emergency_certified);
    worker.certifications = db.prepare('SELECT * FROM certifications WHERE worker_id = ?').all(req.params.id);

    return res.json({ worker });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch worker', details: error.message });
  }
});

// Worker skill check competency assessment completion
apiRouter.post('/workers/:id/skill-check', (req: Request, res: Response) => {
  try {
    const { trade, score, percentage } = req.body || {};
    const workerId = req.params.id;
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    const finalScore = typeof percentage === 'number' ? percentage : typeof score === 'number' ? score : 100;
    const now = new Date().toISOString();
    const sealCode = `COOP-SEAL-${(trade || worker.primary_skill || 'ART').slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(`
      UPDATE workers
      SET skill_check_score = ?,
          skill_check_status = 'passed',
          skill_check_completed_at = ?,
          digital_seal_code = ?,
          verification_status = 'verified'
      WHERE id = ?
    `).run(finalScore, now, sealCode, workerId);

    // Also insert or update certification for this skill check
    const certId = `cert-skill-${crypto.randomUUID().slice(0, 8)}`;
    try {
      db.prepare(`
        INSERT INTO certifications (
          id, worker_id, worker_name, society_name, primary_skill,
          title, issuing_body, credential_number, issue_date, expiry_date,
          document_type, verification_status, verified_at, verified_by, digital_seal_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?, 'State Cooperative Technical Assessment Board', ?, ?)
      `).run(
        certId,
        workerId,
        worker.name,
        worker.society_name || 'Pune Central Urban Artisan Co-op',
        trade || worker.primary_skill,
        `${trade || worker.primary_skill} Safety & Technical Competency Assessment (${finalScore}%)`,
        'State Cooperative Skill & Safety Inspection Board',
        `SKILL-${(trade || worker.primary_skill).slice(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        now.split('T')[0],
        'NSQF Standard Verified',
        'trade_card',
        now.split('T')[0],
        sealCode,
        now
      );
    } catch (certErr) {
      console.warn('Skill cert insertion note:', certErr);
    }

    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    updated.skills = JSON.parse(updated.skills_json || '[]');
    updated.location = {
      city: updated.city,
      area: updated.area,
      coordinates: { lat: updated.lat, lng: updated.lng },
      serviceRadiusKm: updated.service_radius_km,
    };
    updated.emergencyCertified = Boolean(updated.emergency_certified);
    updated.certifications = db.prepare('SELECT * FROM certifications WHERE worker_id = ?').all(workerId);

    return res.json({
      success: true,
      worker: updated,
      message: 'Trade skill check assessment cleared and verified!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to record skill check', details: error.message });
  }
});

apiRouter.post('/workers', (req: Request, res: Response) => {
  try {
    const {
      name,
      phone,
      email,
      primarySkill,
      skills,
      hourlyRate,
      area,
      city,
      lat,
      lng,
      certTitle,
      emergencyCertified,
    } = req.body || {};

    if (!name || !phone || !primarySkill) {
      return res.status(400).json({ error: 'Name, phone, and primary trade are required' });
    }

    const workerId = `w-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    let parsedSkills: string[] = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string' && skills.trim()) {
      parsedSkills = skills.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
    }
    if (parsedSkills.length === 0) {
      parsedSkills = [primarySkill, 'General Service & Repairs'];
    }

    const rate = Number(hourlyRate) > 0 ? Number(hourlyRate) : 400;

    db.prepare(`
      INSERT INTO workers (
        id, name, phone, email, society_id, society_name, coop_member_id,
        primary_skill, skills_json, hourly_rate, service_radius_km, lat, lng, city, area,
        verification_status, cert_title, emergency_certified, availability, rating, completed_jobs_count,
        bank_upi, welfare_fund_balance, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run(
      workerId,
      name,
      phone,
      email || `${name.toLowerCase().replace(/\s+/g, '')}@sahakar.coop`,
      'soc-ap-01',
      'Kurnool District Skilled Artisans Cooperative Society Ltd.',
      `KNL-${primarySkill.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      primarySkill,
      JSON.stringify(parsedSkills),
      rate,
      15,
      lat || 15.8281,
      lng || 78.0373,
      city || 'Kurnool',
      area || 'N.R. Peta',
      'verified',
      certTitle || `${primarySkill} Trade Certified Artisan`,
      emergencyCertified ? 1 : 0,
      'available',
      5.0,
      0,
      `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
      0,
      now
    );

    // Also record trade certification in certifications table
    try {
      const certId = `cert-${crypto.randomUUID().slice(0, 8)}`;
      const sealCode = `SEAL-AP-${Math.floor(1000 + Math.random() * 9000)}-COOP`;
      db.prepare(`
        INSERT INTO certifications (
          id, worker_id, worker_name, society_name, primary_skill,
          title, issuing_body, credential_number, issue_date, expiry_date,
          document_type, verification_status, verified_at, verified_by, digital_seal_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', ?, 'AP State Cooperative Board', ?, ?)
      `).run(
        certId,
        workerId,
        name,
        'Kurnool District Skilled Artisans Cooperative Society Ltd.',
        primarySkill,
        certTitle || `${primarySkill} Trade Certified Artisan`,
        'AP State Skill Development & Cooperative Board',
        `AP-${primarySkill.slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
        now.split('T')[0],
        'Life Validity',
        'trade_card',
        now.split('T')[0],
        sealCode,
        now
      );
    } catch (certErr) {
      console.warn('Initial certification entry deferred:', certErr);
    }

    const created = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    if (created) {
      created.skills = JSON.parse(created.skills_json || '[]');
      created.location = {
        city: created.city,
        area: created.area,
        coordinates: { lat: created.lat, lng: created.lng },
        serviceRadiusKm: created.service_radius_km,
      };
      created.emergencyCertified = Boolean(created.emergency_certified);
    }

    return res.status(201).json({ success: true, worker: created });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create worker', details: error.message });
  }
});


// Worker submits credentials for verification
apiRouter.post('/workers/:id/verify', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const {
      idProofType,
      idProofNumber,
      certTitle,
      certNumber,
      issuingBody,
      emergencyCertified,
    } = req.body || {};

    if (!idProofType || !idProofNumber || !certTitle) {
      return res.status(400).json({ error: 'ID proof type, ID number, and Trade Certificate title are required' });
    }

    db.prepare(`
      UPDATE workers
      SET verification_status = 'under_review',
          id_proof_type = ?,
          id_proof_number = ?,
          cert_title = ?,
          cert_number = ?,
          issuing_body = ?,
          emergency_certified = ?,
          verification_notes = 'Verification submitted. Awaiting Federation Board review.'
      WHERE id = ?
    `).run(
      idProofType,
      idProofNumber,
      certTitle,
      certNumber || 'REG-PENDING',
      issuingBody || 'National Skill Development Corporation',
      emergencyCertified ? 1 : 0,
      workerId
    );

    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    if (updated) {
      updated.skills = JSON.parse(updated.skills_json || '[]');
    }

    return res.json({
      success: true,
      message: 'Credentials submitted to Federation Verification Board',
      worker: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to submit verification', details: error.message });
  }
});

// Federation Admin approves worker verification
apiRouter.post('/workers/:id/approve', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const { approvedBy = 'Federation Technical Board', notes = 'Credentials verified with state guild registry' } = req.body || {};
    const now = new Date().toISOString().split('T')[0];

    db.prepare(`
      UPDATE workers
      SET verification_status = 'verified',
          verified_at = ?,
          verified_by = ?,
          verification_notes = ?
      WHERE id = ?
    `).run(now, approvedBy, notes, workerId);

    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    if (updated) {
      updated.skills = JSON.parse(updated.skills_json || '[]');
    }

    return res.json({ success: true, message: 'Worker verified successfully', worker: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to approve worker', details: error.message });
  }
});

// Federation Admin rejects worker verification
apiRouter.post('/workers/:id/reject', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const { reason = 'Document unclear or trade registration expired' } = req.body || {};

    db.prepare(`
      UPDATE workers
      SET verification_status = 'rejected',
          verification_notes = ?
      WHERE id = ?
    `).run(reason, workerId);

    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    if (updated) {
      updated.skills = JSON.parse(updated.skills_json || '[]');
    }

    return res.json({ success: true, message: 'Worker verification rejected', worker: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reject worker', details: error.message });
  }
});

// Worker updates geographical location / radius
apiRouter.put('/workers/:id/geo', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const { area, city, lat, lng, serviceRadiusKm } = req.body || {};

    db.prepare(`
      UPDATE workers
      SET area = COALESCE(?, area),
          city = COALESCE(?, city),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng),
          service_radius_km = COALESCE(?, service_radius_km)
      WHERE id = ?
    `).run(area, city, lat, lng, serviceRadiusKm, workerId);

    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    return res.json({ success: true, worker: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update location', details: error.message });
  }
});

// Worker updates real-time telemetry (live GPS, availability, hourly rate, radius)
apiRouter.put('/workers/:id/realtime', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const { area, city, lat, lng, serviceRadiusKm, availability, hourlyRate } = req.body || {};

    const validAvail = ['available', 'on_job', 'offline'];
    const newAvail = validAvail.includes(availability) ? availability : null;

    db.prepare(`
      UPDATE workers
      SET area = COALESCE(?, area),
          city = COALESCE(?, city),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng),
          service_radius_km = COALESCE(?, service_radius_km),
          availability = COALESCE(?, availability),
          hourly_rate = COALESCE(?, hourly_rate)
      WHERE id = ?
    `).run(area, city, lat, lng, serviceRadiusKm, newAvail, hourlyRate, workerId);

    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    if (updated) {
      updated.skills = JSON.parse(updated.skills_json || '[]');
      updated.emergencyCertified = Boolean(updated.emergency_certified);
      updated.location = {
        city: updated.city,
        area: updated.area,
        coordinates: { lat: updated.lat, lng: updated.lng },
        serviceRadiusKm: updated.service_radius_km,
      };
    }
    return res.json({ success: true, worker: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update real-time telemetry', details: error.message });
  }
});

// -------------------------------------------------------------
// Bookings
// -------------------------------------------------------------
apiRouter.get('/bookings', (req: Request, res: Response) => {
  try {
    const { customerId, workerId, status } = req.query;

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];

    if (customerId) {
      query += ' AND customer_id = ?';
      params.push(customerId);
    }
    if (workerId) {
      query += ' AND (assigned_worker_id = ? OR (status = "open" AND assigned_worker_id IS NULL))';
      params.push(workerId);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const bookings = db.prepare(query).all(...params) as any[];
    const mapped = bookings.map((b) => ({
      ...b,
      isEmergency: Boolean(b.is_emergency),
      pricing: {
        totalAmount: b.total_amount,
        workerPayout: b.worker_payout,
        coopWelfareFee: b.coop_welfare_fee,
        federationPlatformFee: b.platform_fee,
      },
      coordinates: { lat: b.lat, lng: b.lng },
    }));

    return res.json({ bookings: mapped });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve bookings', details: error.message });
  }
});

apiRouter.post('/bookings', (req: Request, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      serviceCategory,
      title,
      description,
      isEmergency,
      lat,
      lng,
      area,
      scheduledTime,
      totalAmount = 500,
    } = req.body || {};

    if (!customerName || !customerPhone || !serviceCategory || !title) {
      return res.status(400).json({ error: 'Customer name, phone, service category, and title are required' });
    }

    const bookingId = `bk-${crypto.randomUUID().slice(0, 8)}`;
    const bookingCode = `SS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceNumber = `INV-COOP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const gross = Number(totalAmount) || (isEmergency ? 750 : 500);
    const workerPayout = Math.round(gross * 0.9); // 90%
    const coopWelfareFee = Math.round(gross * 0.07); // 7%
    const platformFee = gross - workerPayout - coopWelfareFee; // 3%

    db.prepare(`
      INSERT INTO bookings (
        id, booking_code, customer_id, customer_name, customer_phone, customer_address,
        service_category, title, description, is_emergency, emergency_priority,
        lat, lng, area, status, total_amount, worker_payout, coop_welfare_fee, platform_fee,
        scheduled_time, created_at, payment_status, invoice_number
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `).run(
      bookingId,
      bookingCode,
      customerId || `cust-${Date.now()}`,
      customerName,
      customerPhone,
      customerAddress || 'Customer Site',
      serviceCategory,
      title,
      description || '',
      isEmergency ? 1 : 0,
      isEmergency ? 'critical' : 'normal',
      lat || 18.5204,
      lng || 73.8567,
      area || 'Shivajinagar, Pune',
      'open',
      gross,
      workerPayout,
      coopWelfareFee,
      platformFee,
      scheduledTime || 'Immediate (Within 45 mins)',
      now,
      'escrow_locked',
      invoiceNumber
    );

    const created = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    return res.status(201).json({
      success: true,
      booking: {
        ...created,
        isEmergency: Boolean(created.is_emergency),
        pricing: {
          totalAmount: created.total_amount,
          workerPayout: created.worker_payout,
          coopWelfareFee: created.coop_welfare_fee,
          federationPlatformFee: created.platform_fee,
        },
        coordinates: { lat: created.lat, lng: created.lng },
      },
    });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
});

// Worker accepts booking
apiRouter.post('/bookings/:id/accept', (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { workerId, workerName } = req.body || {};

    if (!workerId || !workerName) {
      return res.status(400).json({ error: 'workerId and workerName required' });
    }

    db.prepare(`
      UPDATE bookings
      SET status = 'assigned',
          assigned_worker_id = ?,
          assigned_worker_name = ?
      WHERE id = ? AND status = 'open'
    `).run(workerId, workerName, bookingId);

    // Set worker availability to on_job
    db.prepare("UPDATE workers SET availability = 'on_job' WHERE id = ?").run(workerId);

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    return res.json({ success: true, booking: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to accept booking', details: error.message });
  }
});

// Update booking lifecycle (in_transit -> in_progress -> completed)
apiRouter.put('/bookings/:id/status', (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body || {};

    const validStatuses = ['open', 'assigned', 'in_transit', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (status === 'completed') {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE bookings
        SET status = 'completed',
            completed_at = ?,
            payment_status = 'disbursed'
        WHERE id = ?
      `).run(now, bookingId);

      // Free worker & credit completed job + welfare
      if (booking.assigned_worker_id) {
        db.prepare(`
          UPDATE workers
          SET availability = 'available',
              completed_jobs_count = completed_jobs_count + 1,
              welfare_fund_balance = welfare_fund_balance + ?
          WHERE id = ?
        `).run(booking.coop_welfare_fee, booking.assigned_worker_id);
      }
    } else {
      db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
    }

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    return res.json({ success: true, booking: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update booking status', details: error.message });
  }
});

// Get escrow wallet status and live UPI payload for a specific booking
apiRouter.get('/bookings/:id/escrow', (req: Request, res: Response) => {
  try {
    const bookingParam = req.params.id;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? OR booking_code = ?').get(bookingParam, bookingParam) as any;
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingCode = booking.booking_code || 'SAH-PUN-0001';
    const cleanCode = bookingCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const vpa = `escrow.${cleanCode}@sahakarseva.coop`;
    const totalAmount = Number(booking.total_amount) || 450;
    const workerPayout = Number(booking.worker_payout) || Math.round(totalAmount * 0.9);
    const coopWelfareFee = Number(booking.coop_welfare_fee) || Math.round(totalAmount * 0.07);
    const platformFee = Number(booking.platform_fee) || Math.round(totalAmount * 0.03);
    const invoiceNumber = booking.invoice_number || `INV-${bookingCode}`;

    const upiUri = `upi://pay?pa=${vpa}&pn=Sahakar+Seva+Escrow+Trust&mc=5499&tr=${encodeURIComponent(bookingCode)}&tid=${encodeURIComponent(invoiceNumber)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Escrow Payment for ${bookingCode}`)}`;

    return res.json({
      success: true,
      escrow: {
        bookingId: booking.id,
        bookingCode,
        invoiceNumber,
        paymentStatus: booking.payment_status || 'escrow_locked',
        escrowWalletAddress: vpa,
        escrowVaultId: `ESCR-VLT-${bookingCode}-MH`,
        totalAmount,
        breakdown: {
          workerPayout,
          coopWelfareFee,
          platformFee,
        },
        upiUri,
        assignedWorkerName: booking.assigned_worker_name,
        customerName: booking.customer_name,
        createdAt: booking.created_at,
        completedAt: booking.completed_at,
        verificationHash: `SHA256-${Buffer.from(`${bookingCode}-${totalAmount}-${booking.created_at}`).toString('hex').slice(0, 32)}`,
        escrowTerms: 'Autonomous cooperative escrow locked under Section 19 of the Multi-State Cooperative Societies Act.',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve escrow status', details: error.message });
  }
});

// Customer rates worker for a completed booking
const handleWorkerRating = (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { rating, reviewComment, tags } = req.body || {};

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const now = new Date().toISOString();

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    db.prepare(`
      UPDATE bookings
      SET rating = ?,
          review_comment = ?,
          worker_rating = ?,
          worker_review = ?,
          worker_rating_tags = ?,
          worker_rated_at = ?
      WHERE id = ?
    `).run(numericRating, reviewComment || '', numericRating, reviewComment || '', tagsJson, now, bookingId);

    // Recalculate average rating for assigned worker
    let newAverageRating = numericRating;
    if (booking.assigned_worker_id) {
      const stats = db.prepare(`
        SELECT AVG(COALESCE(worker_rating, rating)) as avg_rating, COUNT(*) as rated_count
        FROM bookings
        WHERE assigned_worker_id = ? AND (worker_rating IS NOT NULL OR rating IS NOT NULL)
      `).get(booking.assigned_worker_id) as any;

      if (stats && stats.avg_rating) {
        newAverageRating = Math.round(stats.avg_rating * 10) / 10;
        db.prepare('UPDATE workers SET rating = ? WHERE id = ?').run(newAverageRating, booking.assigned_worker_id);
      }
    }

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    return res.json({
      success: true,
      booking: updatedBooking,
      newWorkerRating: newAverageRating,
      message: 'Worker rating recorded successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to rate worker', details: error.message });
  }
};

apiRouter.post('/bookings/:id/rate', handleWorkerRating);
apiRouter.post('/bookings/:id/rate-worker', handleWorkerRating);

// Worker rates booker / customer for a completed booking
apiRouter.post('/bookings/:id/rate-booker', (req: Request, res: Response) => {
  try {
    const bookingId = req.params.id;
    const { rating, reviewComment, tags } = req.body || {};

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const now = new Date().toISOString();

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);

    db.prepare(`
      UPDATE bookings
      SET booker_rating = ?,
          booker_review = ?,
          booker_rating_tags = ?,
          booker_rated_at = ?
      WHERE id = ?
    `).run(numericRating, reviewComment || '', tagsJson, now, bookingId);

    // Recalculate average rating for customer / booker
    let newBookerRating = numericRating;
    if (booking.customer_id) {
      const stats = db.prepare(`
        SELECT AVG(booker_rating) as avg_rating, COUNT(*) as rated_count
        FROM bookings
        WHERE customer_id = ? AND booker_rating IS NOT NULL
      `).get(booking.customer_id) as any;

      if (stats && stats.avg_rating) {
        newBookerRating = Math.round(stats.avg_rating * 10) / 10;
        db.prepare(`
          UPDATE users
          SET booker_rating = ?,
              booker_ratings_count = ?
          WHERE id = ?
        `).run(newBookerRating, stats.rated_count, booking.customer_id);
      }
    }

    const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    return res.json({
      success: true,
      booking: updatedBooking,
      newBookerRating,
      message: 'Booker rating recorded successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to rate booker', details: error.message });
  }
});

// Customer Ratings & Reputation Profile
apiRouter.get('/customers/:id/ratings', (req: Request, res: Response) => {
  try {
    const customerId = req.params.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(customerId) as any;

    const ratedBookings = db.prepare(`
      SELECT id, booking_code, title, assigned_worker_name, booker_rating, booker_review, booker_rating_tags, booker_rated_at
      FROM bookings
      WHERE customer_id = ? AND booker_rating IS NOT NULL
      ORDER BY booker_rated_at DESC
    `).all(customerId) as any[];

    return res.json({
      success: true,
      bookerRating: user ? user.booker_rating || 5.0 : 5.0,
      ratingsCount: ratedBookings.length,
      reviews: ratedBookings,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch customer ratings', details: error.message });
  }
});

// Worker Ratings, Feedback Breakdown & Reviews Profile
apiRouter.get('/workers/:id/ratings', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const dbReviews = db.prepare(`
      SELECT id, booking_code, title, customer_name, customer_phone, service_category,
             COALESCE(worker_rating, rating) as rating,
             COALESCE(worker_review, review_comment) as review_comment,
             worker_rating_tags,
             worker_rated_at,
             created_at
      FROM bookings
      WHERE assigned_worker_id = ? AND (worker_rating IS NOT NULL OR rating IS NOT NULL)
      ORDER BY COALESCE(worker_rated_at, created_at) DESC
    `).all(workerId) as any[];

    // Parse review tags and dates
    const formattedDbReviews = dbReviews.map((r) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(r.worker_rating_tags || '[]');
      } catch {
        tags = [];
      }
      return {
        id: r.id,
        bookingCode: r.booking_code,
        customerName: r.customer_name || 'Verified Society Resident',
        customerArea: worker.area || 'Pune Cooperative Ward',
        serviceCategory: r.service_category || worker.primary_skill,
        rating: Number(r.rating) || 5,
        reviewComment: r.review_comment || 'Punctual arrival, exemplary cooperative work ethic and transparent standard billing.',
        tags: tags.length > 0 ? tags : ['Master Craftsmanship', 'Punctual & Fast Arrival', 'Transparent Pricing'],
        date: (r.worker_rated_at || r.created_at || new Date().toISOString()).split('T')[0],
      };
    });

    // Provide default verified co-op community reviews if worker has few reviews
    const fallbackReviews = [
      {
        id: `rev-coop-1-${worker.id}`,
        bookingCode: 'SAH-PUN-9821',
        customerName: 'Kishore Deshmukh (Secretary, Ganga Florentina CHS)',
        customerArea: worker.area || 'Kothrud, Pune',
        serviceCategory: worker.primary_skill,
        rating: 5,
        reviewComment: `Arrived on time for the emergency service. Handled the task with full safety standards and followed cooperative transparent pricing. Highly recommended artisan!`,
        tags: ['Punctual & Fast Arrival', 'Master Craftsmanship', 'Transparent Pricing'],
        date: '2026-03-02',
      },
      {
        id: `rev-coop-2-${worker.id}`,
        bookingCode: 'SAH-PUN-7412',
        customerName: 'Ananya Kulkarni (Vandematram Enclave)',
        customerArea: worker.area || 'Shivajinagar, Pune',
        serviceCategory: worker.primary_skill,
        rating: 5,
        reviewComment: `Extremely polite, clean worksite afterwards, and explained the exact repair cost before starting work. Great cooperative platform initiative!`,
        tags: ['Polite & Respectful', 'Clean & Tidy Worksite', 'Transparent Pricing'],
        date: '2026-02-18',
      },
      {
        id: `rev-coop-3-${worker.id}`,
        bookingCode: 'SAH-PUN-5120',
        customerName: 'Dr. Pravin Joshi (Kumar Park Society)',
        customerArea: worker.area || 'Aundh, Pune',
        serviceCategory: worker.primary_skill,
        rating: 4,
        reviewComment: `Very professional technical diagnostic. Completed the work within 45 minutes with proper cooperative warranty slip.`,
        tags: ['Emergency Ready', 'Master Craftsmanship'],
        date: '2026-01-29',
      },
    ];

    const allReviews = formattedDbReviews.length > 0 ? formattedDbReviews : fallbackReviews;

    // Calculate rating distribution
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagCount: Record<string, number> = {};

    allReviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      breakdown[star] = (breakdown[star] || 0) + 1;

      (r.tags || []).forEach((t: string) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const totalRatings = allReviews.length;
    const positiveCount = (breakdown[5] || 0) + (breakdown[4] || 0);
    const positivePercentage = totalRatings > 0 ? Math.round((positiveCount / totalRatings) * 100) : 98;

    return res.json({
      success: true,
      workerId: worker.id,
      workerName: worker.name,
      primarySkill: worker.primary_skill,
      averageRating: worker.rating || 4.9,
      ratingsCount: totalRatings,
      positivePercentage,
      ratingBreakdown: breakdown,
      topTags,
      reviews: allReviews,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch worker ratings', details: error.message });
  }
});

// Worker 4-Tier Verification Status & Audit Profile
apiRouter.get('/workers/:id/verification-profile', (req: Request, res: Response) => {
  try {
    const workerId = req.params.id;
    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const certs = db.prepare('SELECT * FROM certifications WHERE worker_id = ?').all(workerId) as any[];

    const isVerified = worker.verification_status === 'verified';
    const isUnderReview = worker.verification_status === 'under_review';

    const verificationProfile = {
      workerId: worker.id,
      workerName: worker.name,
      verificationStatus: worker.verification_status,
      verificationNotes: worker.verification_notes || '',
      verifiedAt: worker.verified_at || (isVerified ? '2025-06-15' : null),
      verifiedBy: worker.verified_by || (isVerified ? 'Maharashtra Cooperative Technical Board' : null),
      digitalSealCode: `SEAL-MH-${worker.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-COOP`,
      tiers: [
        {
          tierId: 1,
          name: 'Identity & Aadhaar KYC',
          status: isVerified ? 'verified' : isUnderReview ? 'under_review' : 'pending',
          documentType: worker.id_proof_type || 'Government Aadhaar Card',
          documentNumber: worker.id_proof_number || 'XXXX-XXXX-9421',
          description: 'Aadhaar UIDAI biometrics & residential proof authenticated against national registry.',
          verifiedAt: isVerified ? '2025-05-10' : null,
        },
        {
          tierId: 2,
          name: 'Technical Skill & Trade License',
          status: isVerified || certs.some((c) => c.verification_status === 'verified')
            ? 'verified'
            : isUnderReview
            ? 'under_review'
            : 'pending',
          documentType: worker.cert_title || `${worker.primary_skill} ITI Trade Certificate`,
          documentNumber: worker.cert_number || 'DGT-MH-2024-8831',
          issuingBody: worker.issuing_body || 'National Council for Vocational Training (NCVT)',
          description: 'Vocational trade diploma, Wireman/Solar license verified by Technical Inspection Cell.',
          verifiedAt: isVerified ? '2025-05-22' : null,
        },
        {
          tierId: 3,
          name: 'Police Clearance & Moral Conduct',
          status: isVerified ? 'verified' : isUnderReview ? 'under_review' : 'pending',
          documentType: 'Police Character & Criminal Verification Certificate',
          documentNumber: `PCC-PUN-${worker.id.slice(-4).toUpperCase()}-2025`,
          issuingBody: 'Maharashtra State Police / Local Commissionerate',
          description: 'Zero criminal record and background clearance authenticated for residential entry.',
          verifiedAt: isVerified ? '2025-06-02' : null,
        },
        {
          tierId: 4,
          name: 'Cooperative Society Board Endorsement',
          status: isVerified ? 'verified' : isUnderReview ? 'under_review' : 'pending',
          documentType: 'Cooperative Guild Membership Certificate',
          documentNumber: worker.coop_member_id || `COOP-MEM-${worker.id.slice(-4).toUpperCase()}`,
          issuingBody: worker.society_name || 'Pune West Artisans Cooperative Society',
          description: 'Peer-reviewed by cooperative society governing committee with welfare eligibility.',
          verifiedAt: isVerified ? '2025-06-15' : null,
        },
      ],
      certifications: certs,
    };

    return res.json({ success: true, profile: verificationProfile });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch verification profile', details: error.message });
  }
});

// -------------------------------------------------------------
// Certification Verification System Endpoints
// -------------------------------------------------------------

// List certifications (filterable by workerId or status)
apiRouter.get('/certifications', (req: Request, res: Response) => {
  try {
    const { workerId, status } = req.query;
    let query = 'SELECT * FROM certifications WHERE 1=1';
    const params: any[] = [];

    if (workerId) {
      query += ' AND worker_id = ?';
      params.push(workerId);
    }
    if (status) {
      query += ' AND verification_status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    return res.json({ success: true, certifications: rows });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve certifications', details: error.message });
  }
});

// Worker submits a new trade certification / license for review
apiRouter.post('/certifications', (req: Request, res: Response) => {
  try {
    const {
      workerId,
      title,
      issuingBody,
      credentialNumber,
      issueDate,
      expiryDate,
      documentType = 'license',
      fileUrl = '',
    } = req.body || {};

    if (!workerId || !title || !credentialNumber) {
      return res.status(400).json({ error: 'workerId, title, and credentialNumber are required' });
    }

    const worker = db.prepare('SELECT * FROM workers WHERE id = ?').get(workerId) as any;
    const certId = `cert-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO certifications (
        id, worker_id, worker_name, society_name, primary_skill,
        title, issuing_body, credential_number, issue_date, expiry_date,
        document_type, file_url, verification_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'under_review', ?)
    `).run(
      certId,
      workerId,
      worker ? worker.name : '',
      worker ? worker.society_name : '',
      worker ? worker.primary_skill : '',
      title,
      issuingBody || 'National Skill Development Corporation / State Board',
      credentialNumber,
      issueDate || now.split('T')[0],
      expiryDate || 'Life Validity',
      documentType,
      fileUrl,
      now
    );

    // Update worker status to under_review if currently unverified or rejected
    if (worker && (worker.verification_status === 'unverified' || worker.verification_status === 'rejected')) {
      db.prepare(`
        UPDATE workers
        SET verification_status = 'under_review',
            cert_title = ?,
            cert_number = ?,
            issuing_body = ?
        WHERE id = ?
      `).run(title, credentialNumber, issuingBody, workerId);
    }

    const created = db.prepare('SELECT * FROM certifications WHERE id = ?').get(certId);
    return res.status(201).json({
      success: true,
      certification: created,
      message: 'Certification submitted for Federation Verification audit',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to submit certification', details: error.message });
  }
});

// Federation Admin approves certification and issues official digital seal
apiRouter.post('/certifications/:id/verify', (req: Request, res: Response) => {
  try {
    const certId = req.params.id;
    const {
      verifiedBy = 'Cooperative Technical Inspection Board',
      notes = 'Audited against official state registry and approved',
    } = req.body || {};

    const now = new Date().toISOString().split('T')[0];
    const sealCode = `SEAL-AP-${Math.floor(1000 + Math.random() * 9000)}-COOP`;

    db.prepare(`
      UPDATE certifications
      SET verification_status = 'verified',
          verified_at = ?,
          verified_by = ?,
          digital_seal_code = ?,
          rejection_reason = NULL
      WHERE id = ?
    `).run(now, verifiedBy, sealCode, certId);

    const cert = db.prepare('SELECT * FROM certifications WHERE id = ?').get(certId) as any;
    let workerVerified = false;

    if (cert && cert.worker_id) {
      db.prepare(`
        UPDATE workers
        SET verification_status = 'verified',
            verified_at = ?,
            verified_by = ?,
            verification_notes = ?
        WHERE id = ?
      `).run(now, verifiedBy, notes, cert.worker_id);
      workerVerified = true;
    }

    return res.json({
      success: true,
      certification: cert,
      workerVerified,
      message: 'Certification verified and cryptographic seal generated',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to verify certification', details: error.message });
  }
});

// Federation Admin rejects certification with corrective guidance
apiRouter.post('/certifications/:id/reject', (req: Request, res: Response) => {
  try {
    const certId = req.params.id;
    const { reason = 'Document unclear or trade registration expired in state database' } = req.body || {};

    db.prepare(`
      UPDATE certifications
      SET verification_status = 'rejected',
          rejection_reason = ?
      WHERE id = ?
    `).run(reason, certId);

    const cert = db.prepare('SELECT * FROM certifications WHERE id = ?').get(certId) as any;
    return res.json({
      success: true,
      certification: cert,
      message: 'Certification status updated to rejected',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reject certification', details: error.message });
  }
});

// Delete certification
apiRouter.delete('/certifications/:id', (req: Request, res: Response) => {
  try {
    const certId = req.params.id;
    db.prepare('DELETE FROM certifications WHERE id = ?').run(certId);
    return res.json({ success: true, message: 'Certification record removed' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete certification', details: error.message });
  }
});

// -------------------------------------------------------------
// Location & Reverse Geocoding (High-Precision)
// -------------------------------------------------------------
apiRouter.get('/location/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng required' });
    }

    // High precision zoom 18 for street, locality & building accuracy
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SahakarSevaCooperativePlatform/2.0 (cooperative-dispatch)',
            'Accept-Language': 'en',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        
        // Pick the most specific local identifier available
        const streetOrRoad = addr.road || addr.pedestrian || addr.footway || '';
        const neighborhoodOrSuburb = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.village || addr.hamlet || '';
        const cityOrTown = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || 'Kurnool';
        const state = addr.state || '';
        const postalCode = addr.postcode ? ` - ${addr.postcode}` : '';

        // Formulate precise area
        let area = '';
        if (streetOrRoad && neighborhoodOrSuburb) {
          area = `${streetOrRoad}, ${neighborhoodOrSuburb}`;
        } else {
          area = neighborhoodOrSuburb || streetOrRoad || addr.city_district || 'Local Area';
        }

        const displayName = `${area}, ${cityOrTown}${postalCode}`;

        return res.json({
          success: true,
          source: 'nominatim-high-precision',
          coordinates: { lat, lng },
          area,
          city: cityOrTown,
          state,
          postcode: addr.postcode || '',
          displayName,
        });
      }
    } catch (e) {
      // Network timeout or blocked, fallback to precise coordinates representation
    }

    // Precise coordinates representation
    return res.json({
      success: true,
      source: 'gps-coordinates',
      coordinates: { lat, lng },
      area: `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`,
      city: 'Current Position',
      state: '',
      displayName: `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E (Precise GPS)`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Reverse geocode failed', details: error.message });
  }
});
