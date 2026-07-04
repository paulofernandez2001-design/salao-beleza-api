import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

import { 
  INITIAL_SERVICES, 
  INITIAL_STAFF, 
  INITIAL_APPOINTMENTS, 
  INITIAL_REVIEWS 
} from './src/data/initialData.js';

import { User, Service, Staff, Appointment, Review } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Database connection state
let pool: mysql.Pool | null = null;
let dbConnected = false;
let dbError: string | null = null;

// In-Memory Fallback State (if MySQL is not active)
let memoryUsers: User[] = [
  {
    id: 'u_client',
    name: 'Paulo Fernandez',
    email: 'fernandezpaulo214@gmail.com',
    phone: '(11) 98765-4321',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    bio: 'Cliente assíduo buscando sempre manter o corte alinhado.',
    password: '123456'
  },
  {
    id: 'u_admin',
    name: 'Roberto Cortês',
    email: 'roberto.cortes@barbearia.com',
    phone: '(11) 99999-8888',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    bio: 'Gerente geral do Prestige Barber, focado na melhor experiência.',
    password: '123456'
  }
];

let memoryServices: Service[] = [...INITIAL_SERVICES];
let memoryStaff: Staff[] = [...INITIAL_STAFF];
let memoryAppointments: Appointment[] = [...INITIAL_APPOINTMENTS];
let memoryReviews: Review[] = [...INITIAL_REVIEWS];

// Initialize MySQL database connection and tables
async function initializeDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'senaisp';
  const database = process.env.DB_NAME || 'prestige_barber';

  console.log(`[Database] Attempting connection to ${user}@${host}:${port}...`);

  try {
    // 1. Connect without database first to ensure the database exists
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });

    console.log(`[Database] Connected to server. Ensuring database '${database}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.end();

    // 2. Create the connection pool with the database selected
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test pool connection
    const testConnection = await pool.getConnection();
    console.log(`[Database] Connection pool created and verified successfully.`);
    testConnection.release();

    dbConnected = true;
    dbError = null;

    // 3. Create tables
    await createTables();

    // 4. Seed tables if empty
    await seedTables();

  } catch (error: any) {
    dbConnected = false;
    dbError = error?.message || 'Erro desconhecido ao conectar no MySQL';
    console.error(`[Database Warning] Could not connect to MySQL. Falling back to Server In-Memory state. Error: ${dbError}`);
    console.log(`[Database Info] If you are running locally, make sure your MySQL service is started, credentials are correct and database exists.`);
  }
}

async function createTables() {
  if (!pool) return;

  console.log('[Database] Ensuring tables exist...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      avatar VARCHAR(500) NOT NULL,
      bio TEXT,
      password VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      duration INT NOT NULL,
      description TEXT,
      icon VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      avatar VARCHAR(500) NOT NULL,
      rating DECIMAL(3,2) DEFAULT 5.0,
      specialties TEXT,
      availableDays TEXT,
      availableHours TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(255) PRIMARY KEY,
      clientId VARCHAR(255) NOT NULL,
      clientName VARCHAR(255) NOT NULL,
      clientPhone VARCHAR(255) NOT NULL,
      clientEmail VARCHAR(255) NOT NULL,
      serviceId VARCHAR(255) NOT NULL,
      serviceName VARCHAR(255) NOT NULL,
      servicePrice DECIMAL(10,2) NOT NULL,
      serviceDuration INT NOT NULL,
      staffId VARCHAR(255) NOT NULL,
      staffName VARCHAR(255) NOT NULL,
      date VARCHAR(255) NOT NULL,
      time VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      notes TEXT,
      rating INT,
      review TEXT,
      createdAt VARCHAR(255) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(255) PRIMARY KEY,
      clientName VARCHAR(255) NOT NULL,
      clientAvatar VARCHAR(500) NOT NULL,
      serviceName VARCHAR(255) NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      date VARCHAR(255) NOT NULL
    )
  `);

  console.log('[Database] Tables checked and created.');
}

async function seedTables() {
  if (!pool) return;

  // Seed Users
  const [userRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
  if (userRows[0].count === 0) {
    console.log('[Database Seed] Seeding users table...');
    for (const user of memoryUsers) {
      await pool.query(
        'INSERT INTO users (id, name, email, phone, role, avatar, bio, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.phone, user.role, user.avatar, user.bio || '', user.password || '123456']
      );
    }
  }

  // Seed Services
  const [serviceRows]: any = await pool.query('SELECT COUNT(*) as count FROM services');
  if (serviceRows[0].count === 0) {
    console.log('[Database Seed] Seeding services table...');
    for (const s of INITIAL_SERVICES) {
      await pool.query(
        'INSERT INTO services (id, name, category, price, duration, description, icon) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.name, s.category, s.price, s.duration, s.description, s.icon]
      );
    }
  }

  // Seed Staff
  const [staffRows]: any = await pool.query('SELECT COUNT(*) as count FROM staff');
  if (staffRows[0].count === 0) {
    console.log('[Database Seed] Seeding staff table...');
    for (const s of INITIAL_STAFF) {
      await pool.query(
        'INSERT INTO staff (id, name, role, avatar, rating, specialties, availableDays, availableHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.name, s.role, s.avatar, s.rating, JSON.stringify(s.specialties), JSON.stringify(s.availableDays), JSON.stringify(s.availableHours)]
      );
    }
  }

  // Seed Appointments
  const [appRows]: any = await pool.query('SELECT COUNT(*) as count FROM appointments');
  if (appRows[0].count === 0) {
    console.log('[Database Seed] Seeding appointments table...');
    for (const app of INITIAL_APPOINTMENTS) {
      await pool.query(
        'INSERT INTO appointments (id, clientId, clientName, clientPhone, clientEmail, serviceId, serviceName, servicePrice, serviceDuration, staffId, staffName, date, time, status, notes, rating, review, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          app.id, 
          app.clientId, 
          app.clientName, 
          app.clientPhone, 
          app.clientEmail, 
          app.serviceId, 
          app.serviceName, 
          app.servicePrice, 
          app.serviceDuration, 
          app.staffId, 
          app.staffName, 
          app.date, 
          app.time, 
          app.status, 
          app.notes || null, 
          app.rating || null, 
          app.review || null, 
          app.createdAt
        ]
      );
    }
  }

  // Seed Reviews
  const [reviewRows]: any = await pool.query('SELECT COUNT(*) as count FROM reviews');
  if (reviewRows[0].count === 0) {
    console.log('[Database Seed] Seeding reviews table...');
    for (const rev of INITIAL_REVIEWS) {
      await pool.query(
        'INSERT INTO reviews (id, clientName, clientAvatar, serviceName, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [rev.id, rev.clientName, rev.clientAvatar, rev.serviceName, rev.rating, rev.comment, rev.date]
      );
    }
  }

  console.log('[Database] Seeding completed.');
}

// REST API Endpoints

// Database Connection Status
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: dbConnected,
    mode: dbConnected ? 'MySQL' : 'In-Memory Fallback',
    config: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || '3306',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'prestige_barber'
    },
    error: dbError
  });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    if (dbConnected && pool) {
      const [rows]: any = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      const user = rows[0];
      if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
    } else {
      const user = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
    }
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { id, name, email, phone, role, avatar, bio, password } = req.body;
  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  try {
    const userId = id || `u_${Date.now()}`;
    const userAvatar = avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200';
    const userBio = bio || '';

    if (dbConnected && pool) {
      const [existing]: any = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      await pool.query(
        'INSERT INTO users (id, name, email, phone, role, avatar, bio, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, name, email, phone, role, userAvatar, userBio, password]
      );
    } else {
      if (memoryUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }
      memoryUsers.push({ id: userId, name, email, phone, role, avatar: userAvatar, bio: userBio, password });
    }

    res.json({ id: userId, name, email, phone, role, avatar: userAvatar, bio: userBio });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  const { id, name, email, phone, avatar, bio, password } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID de usuário é obrigatório.' });
  }

  try {
    if (dbConnected && pool) {
      let query = 'UPDATE users SET name = ?, email = ?, phone = ?, avatar = ?, bio = ?';
      const params = [name, email, phone, avatar, bio];

      if (password) {
        query += ', password = ?';
        params.push(password);
      }
      query += ' WHERE id = ?';
      params.push(id);

      await pool.query(query, params);
      
      const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      const updatedUser = rows[0];
      if (updatedUser) {
        const { password: _, ...userWithoutPassword } = updatedUser;
        return res.json(userWithoutPassword);
      }
    } else {
      const idx = memoryUsers.findIndex(u => u.id === id);
      if (idx !== -1) {
        memoryUsers[idx] = {
          ...memoryUsers[idx],
          name,
          email,
          phone,
          avatar,
          bio,
          ...(password ? { password } : {})
        };
        const { password: _, ...userWithoutPassword } = memoryUsers[idx];
        return res.json(userWithoutPassword);
      }
    }
    res.status(404).json({ error: 'Usuário não encontrado.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Services API
app.get('/api/services', async (req, res) => {
  try {
    if (dbConnected && pool) {
      const [rows]: any = await pool.query('SELECT * FROM services');
      const formatted: Service[] = rows.map((r: any) => ({ 
        id: r.id,
        name: r.name,
        category: r.category,
        price: parseFloat(r.price),
        duration: parseInt(r.duration),
        description: r.description || '',
        icon: r.icon
      }));
      return res.json(formatted);
    } else {
      return res.json(memoryServices);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  const { id, name, category, price, duration, description, icon } = req.body;
  const serviceId = id || `s_${Date.now()}`;
  try {
    if (dbConnected && pool) {
      await pool.query(
        'INSERT INTO services (id, name, category, price, duration, description, icon) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [serviceId, name, category, price, duration, description || '', icon || 'Scissors']
      );
    } else {
      memoryServices.push({ id: serviceId, name, category, price: Number(price), duration: Number(duration), description: description || '', icon: icon || 'Scissors' });
    }
    res.json({ id: serviceId, name, category, price: Number(price), duration: Number(duration), description: description || '', icon: icon || 'Scissors' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, duration, description, icon } = req.body;
  try {
    if (dbConnected && pool) {
      await pool.query(
        'UPDATE services SET name = ?, category = ?, price = ?, duration = ?, description = ?, icon = ? WHERE id = ?',
        [name, category, price, duration, description || '', icon || 'Scissors', id]
      );
    } else {
      const idx = memoryServices.findIndex(s => s.id === id);
      if (idx !== -1) {
        memoryServices[idx] = { id, name, category, price: Number(price), duration: Number(duration), description: description || '', icon: icon || 'Scissors' };
      }
    }
    res.json({ id, name, category, price: Number(price), duration: Number(duration), description, icon });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (dbConnected && pool) {
      await pool.query('DELETE FROM services WHERE id = ?', [id]);
    } else {
      memoryServices = memoryServices.filter(s => s.id !== id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff API
app.get('/api/staff', async (req, res) => {
  try {
    if (dbConnected && pool) {
      const [rows]: any = await pool.query('SELECT * FROM staff');
      const formatted: Staff[] = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        avatar: r.avatar,
        rating: parseFloat(r.rating || '5.0'),
        specialties: r.specialties ? JSON.parse(r.specialties) : [],
        availableDays: r.availableDays ? JSON.parse(r.availableDays) : [1, 2, 3, 4, 5, 6],
        availableHours: r.availableHours ? JSON.parse(r.availableHours) : []
      }));
      return res.json(formatted);
    } else {
      return res.json(memoryStaff);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  const { id, name, role, avatar, rating, specialties, availableDays, availableHours } = req.body;
  const staffId = id || `p_${Date.now()}`;
  const specStr = JSON.stringify(specialties || []);
  const daysStr = JSON.stringify(availableDays || [1, 2, 3, 4, 5, 6]);
  const hoursStr = JSON.stringify(availableHours || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]);
  try {
    if (dbConnected && pool) {
      await pool.query(
        'INSERT INTO staff (id, name, role, avatar, rating, specialties, availableDays, availableHours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [staffId, name, role, avatar, rating || 5.0, specStr, daysStr, hoursStr]
      );
    } else {
      memoryStaff.push({ 
        id: staffId, 
        name, 
        role, 
        avatar, 
        rating: rating || 5.0, 
        specialties: specialties || [], 
        availableDays: availableDays || [1, 2, 3, 4, 5, 6], 
        availableHours: availableHours || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"] 
      });
    }
    res.json({ 
      id: staffId, 
      name, 
      role, 
      avatar, 
      rating: rating || 5.0, 
      specialties: specialties || [], 
      availableDays: availableDays || [1, 2, 3, 4, 5, 6], 
      availableHours: availableHours || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"] 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, avatar, rating, specialties, availableDays, availableHours } = req.body;
  const specStr = JSON.stringify(specialties || []);
  const daysStr = JSON.stringify(availableDays || [1, 2, 3, 4, 5, 6]);
  const hoursStr = JSON.stringify(availableHours || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]);
  try {
    if (dbConnected && pool) {
      await pool.query(
        'UPDATE staff SET name = ?, role = ?, avatar = ?, rating = ?, specialties = ?, availableDays = ?, availableHours = ? WHERE id = ?',
        [name, role, avatar, rating || 5.0, specStr, daysStr, hoursStr, id]
      );
    } else {
      const idx = memoryStaff.findIndex(s => s.id === id);
      if (idx !== -1) {
        memoryStaff[idx] = { 
          id, 
          name, 
          role, 
          avatar, 
          rating: rating || memoryStaff[idx].rating || 5.0, 
          specialties: specialties || memoryStaff[idx].specialties, 
          availableDays: availableDays || memoryStaff[idx].availableDays, 
          availableHours: availableHours || memoryStaff[idx].availableHours 
        };
      }
    }
    res.json({ id, name, role, avatar, rating: rating || 5.0, specialties, availableDays, availableHours });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (dbConnected && pool) {
      await pool.query('DELETE FROM staff WHERE id = ?', [id]);
    } else {
      memoryStaff = memoryStaff.filter(s => s.id !== id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Appointments API
app.get('/api/appointments', async (req, res) => {
  try {
    if (dbConnected && pool) {
      const [rows]: any = await pool.query('SELECT * FROM appointments ORDER BY id DESC');
      const formatted: Appointment[] = rows.map((r: any) => ({
        id: r.id,
        clientId: r.clientId,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        clientEmail: r.clientEmail,
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        servicePrice: parseFloat(r.servicePrice),
        serviceDuration: parseInt(r.serviceDuration),
        staffId: r.staffId,
        staffName: r.staffName,
        date: r.date,
        time: r.time,
        status: r.status,
        notes: r.notes || undefined,
        rating: r.rating ? parseInt(r.rating) : undefined,
        review: r.review || undefined,
        createdAt: r.createdAt
      }));
      return res.json(formatted);
    } else {
      return res.json(memoryAppointments);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { 
    id, 
    clientId, 
    clientName, 
    clientPhone, 
    clientEmail, 
    serviceId, 
    serviceName, 
    servicePrice, 
    serviceDuration, 
    staffId, 
    staffName, 
    date, 
    time, 
    status, 
    notes,
    createdAt 
  } = req.body;
  
  const appId = id || `a_${Date.now()}`;
  const appStatus = status || 'pending';
  const createdDate = createdAt || new Date().toISOString();

  try {
    if (dbConnected && pool) {
      await pool.query(
        'INSERT INTO appointments (id, clientId, clientName, clientPhone, clientEmail, serviceId, serviceName, servicePrice, serviceDuration, staffId, staffName, date, time, status, notes, rating, review, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)',
        [
          appId, 
          clientId, 
          clientName, 
          clientPhone, 
          clientEmail, 
          serviceId, 
          serviceName, 
          servicePrice, 
          serviceDuration, 
          staffId, 
          staffName, 
          date, 
          time, 
          appStatus, 
          notes || null, 
          createdDate
        ]
      );
    } else {
      memoryAppointments.unshift({ 
        id: appId, 
        clientId, 
        clientName, 
        clientPhone, 
        clientEmail, 
        serviceId, 
        serviceName, 
        servicePrice: Number(servicePrice), 
        serviceDuration: Number(serviceDuration), 
        staffId, 
        staffName, 
        date, 
        time, 
        status: appStatus, 
        notes: notes || undefined, 
        createdAt: createdDate 
      });
    }
    res.json({ id: appId, clientId, clientName, serviceId, staffId, date, time, status: appStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status, rating, review } = req.body;
  try {
    if (dbConnected && pool) {
      let query = 'UPDATE appointments SET ';
      const updates: string[] = [];
      const params: any[] = [];

      if (status) {
        updates.push('status = ?');
        params.push(status);
      }
      if (rating !== undefined) {
        updates.push('rating = ?');
        params.push(rating);
      }
      if (review !== undefined) {
        updates.push('review = ?');
        params.push(review);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
      }

      query += updates.join(', ') + ' WHERE id = ?';
      params.push(id);

      await pool.query(query, params);

      // Recalculate average rating of the staff if rating is provided
      if (rating && pool) {
        const [appRow]: any = await pool.query('SELECT staffId FROM appointments WHERE id = ?', [id]);
        if (appRow[0]) {
          const staffId = appRow[0].staffId;
          const [completedApps]: any = await pool.query('SELECT rating FROM appointments WHERE staffId = ? AND status = "completed" AND rating IS NOT NULL', [staffId]);
          if (completedApps.length > 0) {
            const avgRating = completedApps.reduce((sum: number, a: any) => sum + a.rating, 0) / completedApps.length;
            await pool.query('UPDATE staff SET rating = ? WHERE id = ?', [avgRating, staffId]);
          }
        }
      }
    } else {
      const idx = memoryAppointments.findIndex(a => a.id === id);
      if (idx !== -1) {
        memoryAppointments[idx] = {
          ...memoryAppointments[idx],
          ...(status ? { status } : {}),
          ...(rating !== undefined ? { rating } : {}),
          ...(review !== undefined ? { review } : {})
        };

        // Recalculate average rating of the staff if rating is provided
        if (rating) {
          const staffId = memoryAppointments[idx].staffId;
          const staffApps = memoryAppointments.filter(a => a.staffId === staffId && a.status === 'completed' && a.rating);
          if (staffApps.length > 0) {
            const avgRating = staffApps.reduce((sum, a) => sum + (a.rating || 5), 0) / staffApps.length;
            const staffIdx = memoryStaff.findIndex(s => s.id === staffId);
            if (staffIdx !== -1) {
              memoryStaff[staffIdx] = { ...memoryStaff[staffIdx], rating: avgRating };
            }
          }
        }
      }
    }
    res.json({ id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    if (dbConnected && pool) {
      await pool.query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [id]);
    } else {
      const idx = memoryAppointments.findIndex(a => a.id === id);
      if (idx !== -1) {
        memoryAppointments[idx] = { ...memoryAppointments[idx], status: 'cancelled' };
      }
    }
    res.json({ id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews API
app.get('/api/reviews', async (req, res) => {
  try {
    if (dbConnected && pool) {
      const [rows]: any = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
      const formatted: Review[] = rows.map((r: any) => ({
        id: r.id,
        clientName: r.clientName,
        clientAvatar: r.clientAvatar,
        serviceName: r.serviceName,
        rating: parseInt(r.rating),
        comment: r.comment,
        date: r.date
      }));
      return res.json(formatted);
    } else {
      return res.json(memoryReviews);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { id, clientName, clientAvatar, serviceName, rating, comment, date } = req.body;
  const revId = id || `r_${Date.now()}`;
  try {
    if (dbConnected && pool) {
      await pool.query(
        'INSERT INTO reviews (id, clientName, clientAvatar, serviceName, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [revId, clientName, clientAvatar, serviceName, rating, comment, date]
      );
    } else {
      memoryReviews.unshift({ id: revId, clientName, clientAvatar, serviceName, rating: Number(rating), comment, date });
    }
    res.json({ id: revId, clientName, clientAvatar, serviceName, rating: Number(rating), comment, date });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup dev/production static file routing
async function startServer() {
  // Initialize Database Pool
  await initializeDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Prestige Barber server running on http://localhost:${PORT}`);
  });
}

startServer();
