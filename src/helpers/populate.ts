import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "@/database/schema";

// --- CONFIGURATION ---
config({ path: ".env" });
const DATA_DIR = path.join(process.cwd(), 'datasets');
const BATCH_SIZE = 500;
// --- END CONFIGURATION ---

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function readCsv<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, fileName);
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// **THE FIX:** The map is named userExternalIdToDbId. We will use this name consistently.
const userExternalIdToDbId = new Map<string, number>();
const locationNameToDbId = new Map<string, number>();
const assetTitleToDbId = new Map<string, number>();

async function seedUsers() {
  const usersData = await readCsv<any>('student_or_staff_profiles.csv');
  console.log(`Read ${usersData.length} user profiles from CSV...`);

  const uniqueUsersMap = new Map<string, any>();
  for (const user of usersData) {
    const uniqueKey = user.student_id || user.staff_id;
    if (uniqueKey && !uniqueUsersMap.has(uniqueKey)) {
      uniqueUsersMap.set(uniqueKey, user);
    }
  }
  const uniqueUsers = Array.from(uniqueUsersMap.values());
  console.log(`Found ${uniqueUsers.length} unique users to insert.`);

  const usersToInsert = uniqueUsers.map(u => ({
    externalId: u.student_id || u.staff_id,
    fullName: u.name,
    email: u.email,
    department: u.department,
    role: u.role,
  }));

  if (!usersToInsert.length) return;

  for (let i = 0; i < usersToInsert.length; i += BATCH_SIZE) {
    const batch = usersToInsert.slice(i, i + BATCH_SIZE);
    const inserted = await db.insert(schema.users).values(batch).returning();
    inserted.forEach(insertedUser => {
        const originalUser = uniqueUsers.find(u => (u.student_id || u.staff_id) === insertedUser.externalId);
        if (originalUser && originalUser.entity_id) {
            userExternalIdToDbId.set(originalUser.entity_id, insertedUser.id);
        }
    });
  }
  console.log(`✓ Seeding users complete.`);
}

async function seedLocations() {
    const swipeData = await readCsv<any>('campus_card_swipes.csv');
    const wifiData = await readCsv<any>('wifi_associations_logs.csv');
    const labData = await readCsv<any>('lab_bookings.csv');
    const cctvData = await readCsv<any>('cctv_frames.csv');
    
    const locationSet = new Map<string, { name: string; type: any }>();

    swipeData.forEach(row => { if (row.location_id) locationSet.set(row.location_id, { name: row.location_id, type: 'entry_gate' }) });
    wifiData.forEach(row => { if (row.ap_id) locationSet.set(row.ap_id, { name: row.ap_id, type: 'wifi_ap' }) });
    labData.forEach(row => { 
        if (row.room_id) {
            let type: any = 'laboratory';
            if (row.room_id.startsWith('AUD')) type = 'auditorium';
            if (row.room_id.startsWith('SEM')) type = 'seminar_hall';
            locationSet.set(row.room_id, { name: row.room_id, type: type });
        }
    });
    cctvData.forEach(row => { if (row.location_id) locationSet.set(row.location_id, { name: row.location_id, type: 'cctv_camera' }) });
    
    const locationsToInsert = Array.from(locationSet.values());
    if (!locationsToInsert.length) return;

    for (let i = 0; i < locationsToInsert.length; i += BATCH_SIZE) {
        const batch = locationsToInsert.slice(i, i + BATCH_SIZE);
        const insertedLocations = await db.insert(schema.locations).values(batch).returning();
        insertedLocations.forEach(l => locationNameToDbId.set(l.name, l.id));
    }
    console.log(`✓ Seeded ${locationsToInsert.length} locations.`);
}

async function seedLibraryAssetsAndCheckouts() {
    const checkoutData = await readCsv<any>('library_checkouts.csv');
    const assetSet = new Map<string, { title: string }>();
    
    checkoutData.forEach(row => {
        const title = row.book_title?.trim();
        if (title) assetSet.set(title, { title });
    });

    const assetsToInsert = Array.from(assetSet.values());
    if (assetsToInsert.length > 0) {
        const inserted = await db.insert(schema.libraryAssets).values(assetsToInsert).returning();
        inserted.forEach(a => assetTitleToDbId.set(a.title, a.id));
        console.log(`✓ Seeded ${inserted.length} assets.`);
    }

    const checkoutsToInsert = checkoutData.map(row => {
        const checkoutTime = row.checkout_time?.trim() ? new Date(row.checkout_time) : null;
        if (!checkoutTime || isNaN(checkoutTime.getTime())) return null;

        return {
            userId: userExternalIdToDbId.get(row.entity_id),
            assetId: assetTitleToDbId.get(row.book_title?.trim()),
            checkoutTime,
            returnTime: row.return_time?.trim() ? new Date(row.return_time) : null,
        }
    }).filter(Boolean) as any[];

    if (checkoutsToInsert.length > 0) {
        for (let i = 0; i < checkoutsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.libraryCheckouts).values(checkoutsToInsert.slice(i, i + BATCH_SIZE));
        }
        console.log(`✓ Seeded ${checkoutsToInsert.length} checkouts.`);
    }
}

async function seedIdentifiersAndLogs() {
    const usersData = await readCsv<any>('student_or_staff_profiles.csv');
    const swipeData = await readCsv<any>('campus_card_swipes.csv');
    const wifiData = await readCsv<any>('wifi_associations_logs.csv');
    const faceData = await readCsv<any>('face_embeddings.csv');
    
    const cardUserMap = new Map<string, number | null>();
    usersData.forEach(row => {
        const userId = userExternalIdToDbId.get(row.entity_id);
        if (userId && row.card_id) cardUserMap.set(row.card_id.trim(), userId);
    });
    swipeData.forEach(row => {
        const cardId = row.card_id?.trim();
        if (cardId && !cardUserMap.has(cardId)) cardUserMap.set(cardId, null);
    });

    const cardsToInsert = Array.from(cardUserMap.entries()).map(([id, userId]) => ({ id, userId }));
    if (cardsToInsert.length > 0) {
        for (let i = 0; i < cardsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.campusCards).values(cardsToInsert.slice(i, i + BATCH_SIZE)).onConflictDoNothing();
        }
        console.log(`✓ Seeded ${cardsToInsert.length} cards.`);
    }

    const uniqueDeviceHashes = Array.from(new Set(wifiData.map(row => row.device_hash?.trim()).filter(Boolean)));
    const users = await db.select().from(schema.users);
    const deviceToUserMap = new Map<string, number>();
    const devicesToInsert = [];
    const numDevicesToAssign = Math.min(uniqueDeviceHashes.length, users.length);
    for (let i = 0; i < numDevicesToAssign; i++) {
        const deviceHash = uniqueDeviceHashes[i];
        const userId = users[i].id;
        devicesToInsert.push({ userId, deviceHash });
        deviceToUserMap.set(deviceHash, userId);
    }
     if(devicesToInsert.length > 0) {
        for (let i = 0; i < devicesToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.devices).values(devicesToInsert.slice(i, i + BATCH_SIZE)).onConflictDoNothing();
        }
        console.log(`✓ Seeded ${devicesToInsert.length} devices.`);
    }

    const facesToInsert = faceData.slice(0, users.length).map((row, index) => ({
        id: row.face_id,
        userId: users[index].id,
        embedding: JSON.parse(row.embedding)
    }));
     if(facesToInsert.length > 0) {
        for (let i = 0; i < facesToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.facialProfiles).values(facesToInsert.slice(i, i + BATCH_SIZE)).onConflictDoNothing();
        }
        console.log(`✓ Seeded ${facesToInsert.length} facial profiles.`);
    }
    
    const swipeLogsToInsert = swipeData.map(row => ({
        cardId: row.card_id?.trim(),
        locationId: locationNameToDbId.get(row.location_id),
        timestamp: new Date(row.timestamp),
    })).filter(l => l.locationId && l.cardId);
    
    if (swipeLogsToInsert.length > 0) {
        for (let i = 0; i < swipeLogsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.swipeLogs).values(swipeLogsToInsert.slice(i, i + BATCH_SIZE));
        }
        console.log(`✓ Seeded ${swipeLogsToInsert.length} swipe logs.`);
    }

    const wifiLogsToInsert = wifiData.map(row => ({
        deviceHash: row.device_hash?.trim(),
        accessPointId: locationNameToDbId.get(row.ap_id),
        timestamp: new Date(row.timestamp),
    })).filter(l => l.accessPointId && l.deviceHash && deviceToUserMap.has(l.deviceHash));

    if (wifiLogsToInsert.length > 0) {
        for (let i = 0; i < wifiLogsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.wifiLogs).values(wifiLogsToInsert.slice(i, i + BATCH_SIZE));
        }
        console.log(`✓ Seeded ${wifiLogsToInsert.length} wifi logs.`);
    }
}

async function seedBookingsAndTickets() {
    const labData = await readCsv<any>('lab_bookings.csv');
    const noteData = await readCsv<any>('free_text_notes (helpdesk or RSVPs).csv');

    const bookingsToInsert = labData.map(row => ({
        userId: userExternalIdToDbId.get(row.entity_id),
        locationId: locationNameToDbId.get(row.room_id),
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
    })).filter(b => b.userId && b.locationId) as any[];
    
     if(bookingsToInsert.length > 0) {
        for (let i = 0; i < bookingsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.roomBookings).values(bookingsToInsert.slice(i, i + BATCH_SIZE));
        }
     }
    console.log(`✓ Seeded ${bookingsToInsert.length} room bookings.`);

    const ticketsToInsert = noteData.map(row => ({
        userId: userExternalIdToDbId.get(row.entity_id),
        description: String(row.text || ''),
        createdAt: new Date(row.timestamp),
    })).filter(t => t.userId) as any[];

     if(ticketsToInsert.length > 0) {
        for (let i = 0; i < ticketsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.helpdeskTickets).values(ticketsToInsert.slice(i, i + BATCH_SIZE));
        }
     }
    console.log(`✓ Seeded ${ticketsToInsert.length} helpdesk tickets.`);
}

async function seedCctvLogs() {
    const cctvData = await readCsv<any>('cctv_frames.csv');
    const cctvLogsToInsert = cctvData.map(row => {
        const detectedFaceIds = row.face_id?.trim() ? [row.face_id.trim()] : [];
        return {
            locationId: locationNameToDbId.get(row.location_id?.trim()),
            timestamp: new Date(row.timestamp),
            detectedFaceIds,
        }
    }).filter(l => l.locationId) as any[];

    if (cctvLogsToInsert.length > 0) {
        for (let i = 0; i < cctvLogsToInsert.length; i += BATCH_SIZE) {
            await db.insert(schema.cctvFrameLogs).values(cctvLogsToInsert.slice(i, i + BATCH_SIZE));
        }
        console.log(`✓ Seeded ${cctvLogsToInsert.length} CCTV logs.`);
    }
}

async function main() {
  console.log("--- Starting Database Population ---");

  console.log("🗑️ Clearing existing data...");
  await db.delete(schema.cctvFrameLogs);
  await db.delete(schema.helpdeskTickets);
  await db.delete(schema.roomBookings);
  await db.delete(schema.libraryCheckouts);
  await db.delete(schema.wifiLogs);
  await db.delete(schema.swipeLogs);
  await db.delete(schema.facialProfiles);
  await db.delete(schema.devices);
  await db.delete(schema.campusCards);
  await db.delete(schema.libraryAssets);
  await db.delete(schema.locations);
  await db.delete(schema.users);
  
  console.log("\n🌱 Seeding core data...");
  await seedUsers();
  await seedLocations();

  console.log("\n📚 Seeding library data...");
  await seedLibraryAssetsAndCheckouts();
  
  console.log("\n💳 Seeding identifiers and related logs...");
  await seedIdentifiersAndLogs();
  
  console.log("\n🗓️ Seeding bookings and tickets...");
  await seedBookingsAndTickets();

  console.log("\n📹 Seeding CCTV data...");
  await seedCctvLogs();

  console.log("\n--- Data Population Complete! ✅ ---");
}

main().catch((err) => {
  console.error("❌ Error during data population:", err);
  process.exit(1);
});
