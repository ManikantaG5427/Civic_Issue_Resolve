import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ServiceArea from '../models/ServiceArea.js';
import Department from '../models/Department.js';
import IssueCategory from '../models/IssueCategory.js';
import User from '../models/User.js';

dotenv.config();

export const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicresolve';

  console.info('[Seed] Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.info('[Seed] Connected successfully.');

  try {
    // 1. Seed Pilot Service Area
    console.info('[Seed] Seeding Pilot Service Area...');
    let pilotArea = await ServiceArea.findOne({ code: 'HYD-KPK' });
    if (!pilotArea) {
      pilotArea = await ServiceArea.create({
        name: 'Kukatpally Pilot Area',
        code: 'HYD-KPK',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500072', '500085', '500090'],
        centerLocation: {
          type: 'Point',
          coordinates: [78.3967, 17.4849], // [Lng, Lat]
        },
        description: 'Designated initial pilot service area for CivicResolve rollout in Greater Hyderabad.',
        isActive: true,
      });
      console.info(`[Seed] Created Service Area: ${pilotArea.name}`);
    } else {
      console.info(`[Seed] Service Area already exists: ${pilotArea.name}`);
    }

    // 2. Seed Initial 6 Departments
    console.info('[Seed] Seeding Civic Departments...');
    const departmentsData = [
      {
        name: 'Roads and Public Works',
        code: 'DPW-RDS',
        description: 'Responsible for road repairs, pothole resurfacing, flyovers, and pavement maintenance.',
        contactEmail: 'roads@civicresolve.org',
        contactPhone: '+91 40 2345 6701',
        defaultSlaHours: 48,
      },
      {
        name: 'Sanitation',
        code: 'SAN-WST',
        description: 'Municipal waste collection, public bin clearing, and sanitation oversight.',
        contactEmail: 'sanitation@civicresolve.org',
        contactPhone: '+91 40 2345 6702',
        defaultSlaHours: 24,
      },
      {
        name: 'Water and Drainage',
        code: 'WTR-DRN',
        description: 'Drinking water pipeline maintenance, open drain repairs, and sewage overflows.',
        contactEmail: 'water@civicresolve.org',
        contactPhone: '+91 40 2345 6703',
        defaultSlaHours: 24,
      },
      {
        name: 'Electrical and Streetlights',
        code: 'ELE-LGT',
        description: 'Public streetlight repairs, electrical hazards, transformer wiring, and junction boxes.',
        contactEmail: 'electrical@civicresolve.org',
        contactPhone: '+91 40 2345 6704',
        defaultSlaHours: 24,
      },
      {
        name: 'Parks and Public Facilities',
        code: 'PRK-FAC',
        description: 'Public parks, community hall grounds, civic benches, and open gym maintenance.',
        contactEmail: 'parks@civicresolve.org',
        contactPhone: '+91 40 2345 6705',
        defaultSlaHours: 72,
      },
      {
        name: 'Public Safety and Infrastructure Review',
        code: 'SAF-INF',
        description: 'Structural inspection, encroachment hazard review, and urgent public safety risks.',
        contactEmail: 'safety@civicresolve.org',
        contactPhone: '+91 40 2345 6706',
        defaultSlaHours: 24,
      },
    ];

    const departmentMap = {};
    for (const dept of departmentsData) {
      let existing = await Department.findOne({ code: dept.code });
      if (!existing) {
        existing = await Department.create(dept);
        console.info(`[Seed] Created Department: ${existing.name}`);
      }
      departmentMap[dept.code] = existing._id;
    }

    // 3. Seed Civic Categories
    console.info('[Seed] Seeding Civic Issue Categories...');
    const categoriesData = [
      {
        name: 'Potholes & Damaged Roads',
        code: 'CAT-POTHOLE',
        description: 'Deep potholes, broken asphalt, or hazardous road surface deterioration.',
        defaultDepartment: departmentMap['DPW-RDS'],
        defaultPriority: 'high',
        estimatedSlaHours: 48,
        icon: 'cone',
      },
      {
        name: 'Broken Streetlights',
        code: 'CAT-STREETLIGHT',
        description: 'Darkened streets due to non-functioning lamps or damaged streetlight poles.',
        defaultDepartment: departmentMap['ELE-LGT'],
        defaultPriority: 'medium',
        estimatedSlaHours: 24,
        icon: 'zap',
      },
      {
        name: 'Garbage Dump & Overflowing Bins',
        code: 'CAT-GARBAGE',
        description: 'Uncollected domestic waste, illegal garbage heaps, or overflowing public dustbins.',
        defaultDepartment: departmentMap['SAN-WST'],
        defaultPriority: 'medium',
        estimatedSlaHours: 24,
        icon: 'trash',
      },
      {
        name: 'Water Pipeline Leakage & Contamination',
        code: 'CAT-WATER-LEAK',
        description: 'Burst pipelines, low pressure, discolored/contaminated municipal tap water.',
        defaultDepartment: departmentMap['WTR-DRN'],
        defaultPriority: 'critical',
        estimatedSlaHours: 12,
        icon: 'droplet',
      },
      {
        name: 'Sewage & Drainage Blockage',
        code: 'CAT-SEWAGE',
        description: 'Overflowing manholes, stagnant drain water, or clogged stormwater channels.',
        defaultDepartment: departmentMap['WTR-DRN'],
        defaultPriority: 'high',
        estimatedSlaHours: 24,
        icon: 'waves',
      },
      {
        name: 'Park Maintenance & Public Property Damage',
        code: 'CAT-PARK-DAMAGE',
        description: 'Broken park fences, damaged playground equipment, or overgrown shrubs.',
        defaultDepartment: departmentMap['PRK-FAC'],
        defaultPriority: 'low',
        estimatedSlaHours: 72,
        icon: 'trees',
      },
      {
        name: 'Illegal Construction & Encroachment',
        code: 'CAT-ENCROACHMENT',
        description: 'Obstruction of public footpaths, unauthorized road digging, or illegal structures.',
        defaultDepartment: departmentMap['SAF-INF'],
        defaultPriority: 'medium',
        estimatedSlaHours: 72,
        icon: 'shield-alert',
      },
      {
        name: 'Stray Animal & Pest Hazard',
        code: 'CAT-ANIMAL-HAZARD',
        description: 'Aggressive stray packs, mosquito breeding water pools, or rabies hazard.',
        defaultDepartment: departmentMap['SAN-WST'],
        defaultPriority: 'medium',
        estimatedSlaHours: 48,
        icon: 'bug',
      },
    ];

    for (const cat of categoriesData) {
      let existingCat = await IssueCategory.findOne({ code: cat.code });
      if (!existingCat) {
        existingCat = await IssueCategory.create(cat);
        console.info(`[Seed] Created Category: ${existingCat.name}`);
      }
    }

    // 4. Seed Demo Users for All 4 Roles
    console.info('[Seed] Seeding Demo User Accounts for All Roles...');
    const demoUsers = [
      {
        name: 'Suresh Citizen',
        email: 'citizen@civicresolve.org',
        password: 'Password123!',
        phone: '+91 98765 11111',
        role: 'citizen',
        serviceArea: pilotArea._id,
      },
      {
        name: 'Ramesh Field Worker',
        email: 'worker@civicresolve.org',
        password: 'Password123!',
        phone: '+91 98765 22222',
        role: 'field_worker',
        serviceArea: pilotArea._id,
        department: departmentMap['DPW-RDS'],
      },
      {
        name: 'Ananya Administrator',
        email: 'admin@civicresolve.org',
        password: 'Password123!',
        phone: '+91 98765 33333',
        role: 'administrator',
        serviceArea: pilotArea._id,
      },
      {
        name: 'Vikram Super Admin',
        email: 'superadmin@civicresolve.org',
        password: 'Password123!',
        phone: '+91 98765 44444',
        role: 'super_admin',
        serviceArea: pilotArea._id,
      },
    ];

    for (const u of demoUsers) {
      const existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        await User.create(u);
        console.info(`[Seed] Created User: ${u.name} (${u.role}) -> ${u.email}`);
      }
    }

    console.info('[Seed] Database configuration seeding completed successfully!');
  } catch (error) {
    console.error('[Seed Error]', error);
    throw error;
  }
};

// Allow executing directly via `node src/seeds/seedData.js`
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase()
    .then(() => {
      console.info('[Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Failed]', err);
      process.exit(1);
    });
}
