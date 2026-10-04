import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch { }
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
    // 1. Seed Service Areas (Multiple Zones & Municipalities)
    console.info('[Seed] Seeding Civic Service Areas...');
    const serviceAreasData = [
      {
        name: 'Kukatpally Zone',
        code: 'HYD-KPK',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500072', '500085', '500090'],
        centerLocation: { type: 'Point', coordinates: [78.3967, 17.4849] },
        description: 'Kukatpally, KPHB Colony, and surrounding residential corridors.',
        isActive: true,
      },
      {
        name: 'Hitec City & Madhapur Zone',
        code: 'HYD-HTC',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500081', '500084'],
        centerLocation: { type: 'Point', coordinates: [78.3814, 17.4474] },
        description: 'IT Corridor, Cyber Towers, Madhapur, and Kondapur.',
        isActive: true,
      },
      {
        name: 'Banjara Hills & Jubilee Hills Zone',
        code: 'HYD-BNJ',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500034', '500033'],
        centerLocation: { type: 'Point', coordinates: [78.4354, 17.4156] },
        description: 'Banjara Hills, Jubilee Hills, and Panjagutta area.',
        isActive: true,
      },
      {
        name: 'Gachibowli & Financial District Zone',
        code: 'HYD-GCB',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500032', '500075'],
        centerLocation: { type: 'Point', coordinates: [78.3489, 17.4401] },
        description: 'Gachibowli, Nanakramguda, Financial District, and Tellapur.',
        isActive: true,
      },
      {
        name: 'Secunderabad & Cantonment Zone',
        code: 'HYD-SEC',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500003', '500009', '500015'],
        centerLocation: { type: 'Point', coordinates: [78.4983, 17.4399] },
        description: 'Secunderabad Junction, Paradise, Begumpet, and Marredpally.',
        isActive: true,
      },
      {
        name: 'Charminar & Old City Zone',
        code: 'HYD-CHR',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500002', '500065'],
        centerLocation: { type: 'Point', coordinates: [78.4747, 17.3616] },
        description: 'Historic Old City, Charminar, Falaknuma, and Bahadurpura.',
        isActive: true,
      },
      {
        name: 'Greater Central Municipal Zone',
        code: 'HYD-GEN',
        city: 'Hyderabad',
        state: 'Telangana',
        pincodes: ['500001', '500004', '500028'],
        centerLocation: { type: 'Point', coordinates: [78.4867, 17.3850] },
        description: 'Central Hyderabad, Abids, Nampally, Lakdikapul, and general municipality.',
        isActive: true,
      },
      {
        name: 'Global & International Zone',
        code: 'GLB-WORLD',
        city: 'Worldwide',
        state: 'Global',
        pincodes: ['000000'],
        centerLocation: { type: 'Point', coordinates: [0.0, 20.0] },
        description: 'Worldwide open civic and community issue reporting zone for any location on Earth.',
        isActive: true,
      },
    ];

    let pilotArea = null;
    for (const area of serviceAreasData) {
      let existingArea = await ServiceArea.findOne({ code: area.code });
      if (!existingArea) {
        existingArea = await ServiceArea.create(area);
        console.info(`[Seed] Created Service Area: ${existingArea.name}`);
      } else {
        // Update to make sure it is active
        existingArea.name = area.name;
        existingArea.description = area.description;
        await existingArea.save();
      }
      if (area.code === 'HYD-KPK' || !pilotArea) {
        pilotArea = existingArea;
      }
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

    // 4. Clean up any previous default dummy demo accounts
    console.info('[Seed] Cleaning up default dummy demo user accounts...');
    const defaultEmails = [
      'maniadminsuper0@civicresolve.org',
      'citize@civicresolve.org',
      'worke@civicresolve.org',
      'admi@civicresolve.org',
      'superadmi@civicresolve.org',
      'citizen@civicresolve.org',
      'worker@civicresolve.org',
      'admin@civicresolve.org',
      'superadmin@civicresolve.org',
    ];

    const deleteResult = await User.deleteMany({ email: { $in: defaultEmails } });
    if (deleteResult.deletedCount > 0) {
      console.info(`[Seed] Successfully removed ${deleteResult.deletedCount} default dummy user(s).`);
    }

    // 5. Seed / Upsert Primary Super Admin Account
    console.info('[Seed] Seeding Super Admin Account (gundrothumanikantad@gmail.com)...');
    const superAdminEmail = 'gundrothumanikantad@gmail.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = new User({
        name: 'Manikanta Super Admin',
        email: superAdminEmail,
        password: 'MANIKANTACVM6782',
        role: 'super_admin',
        isEmailVerified: true,
        isActive: true,
        serviceArea: pilotArea?._id || null,
      });
      await superAdmin.save();
      console.info(`[Seed] Super Admin created: ${superAdmin.email}`);
    } else {
      superAdmin.name = 'Manikanta Super Admin';
      superAdmin.password = 'MANIKANTACVM6782';
      superAdmin.role = 'super_admin';
      superAdmin.isEmailVerified = true;
      superAdmin.isActive = true;
      superAdmin.failedLoginAttempts = 0;
      superAdmin.lockUntil = null;
      await superAdmin.save();
      console.info(`[Seed] Super Admin credentials updated: ${superAdmin.email}`);
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
