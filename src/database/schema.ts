import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 50 }).unique(),
  fullName: text("full_name").notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  department: text("department"),
  role: text("role", { enum: ["student", "staff", "faculty"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["entry_gate", "wifi_ap", "cctv_camera", "library", "laboratory", "office", "auditorium", "seminar_hall"] }).notNull(),
  building: text("building"),
  roomNumber: varchar("room_number", { length: 20 }), // Made nullable
});

export const libraryAssets = pgTable("library_assets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  assetType: text("asset_type").default("book").notNull(),
});

export const campusCards = pgTable("campus_cards", {
    id: varchar("card_id", { length: 100 }).primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), 
    isActive: boolean("is_active").default(true).notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  deviceHash: varchar("device_hash", { length: 256 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstSeen: timestamp("first_seen", { withTimezone: true }).defaultNow().notNull(),
});

export const facialProfiles = pgTable("facial_profiles", {
  id: varchar("face_id", { length: 100 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  embedding: jsonb("embedding").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const swipeLogs = pgTable("swipe_logs", {
  id: serial("id").primaryKey(),
  cardId: varchar("card_id", { length: 100 }).references(() => campusCards.id, { onDelete: "set null" }), 
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }), 
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

export const wifiLogs = pgTable("wifi_logs", {
  id: serial("id").primaryKey(),
  deviceHash: varchar("device_hash", { length: 256 }).references(() => devices.deviceHash, { onDelete: "set null" }),
  accessPointId: integer("access_point_id").references(() => locations.id, { onDelete: "set null" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

export const libraryCheckouts = pgTable("library_checkouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assetId: integer("asset_id").notNull().references(() => libraryAssets.id),
  checkoutTime: timestamp("checkout_time", { withTimezone: true }).notNull(),
  dueTime: timestamp("due_time", { withTimezone: true }),
  returnTime: timestamp("return_time", { withTimezone: true }),
});

export const roomBookings = pgTable("room_bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  locationId: integer("location_id").notNull().references(() => locations.id),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
});

export const helpdeskTickets = pgTable("helpdesk_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title"),
  description: text("description"),
  status: text("status", { enum: ["open", "in_progress", "closed"] }).default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const cctvFrameLogs = pgTable("cctv_frame_logs", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  detectedFaceIds: jsonb("detected_face_ids"),
});

// =================================================================
// RELATIONS (Defines how Drizzle should join tables for queries)
// =================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  campusCards: many(campusCards),
  devices: many(devices),
  facialProfile: one(facialProfiles),
  libraryCheckouts: many(libraryCheckouts),
  roomBookings: many(roomBookings),
  helpdeskTickets: many(helpdeskTickets),
}));

export const campusCardsRelations = relations(campusCards, ({ one, many }) => ({
  user: one(users, { fields: [campusCards.userId], references: [users.id] }),
  swipeLogs: many(swipeLogs),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  user: one(users, { fields: [devices.userId], references: [users.id] }),
  wifiLogs: many(wifiLogs),
}));

export const facialProfilesRelations = relations(facialProfiles, ({ one }) => ({
  user: one(users, { fields: [facialProfiles.userId], references: [users.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  swipeLogs: many(swipeLogs),
  wifiLogs: many(wifiLogs),
  roomBookings: many(roomBookings),
  cctvFrameLogs: many(cctvFrameLogs),
}));

export const libraryAssetsRelations = relations(libraryAssets, ({ many }) => ({
  checkouts: many(libraryCheckouts),
}));

export const swipeLogsRelations = relations(swipeLogs, ({ one }) => ({
  card: one(campusCards, { fields: [swipeLogs.cardId], references: [campusCards.id] }),
  location: one(locations, { fields: [swipeLogs.locationId], references: [locations.id] }),
}));

export const wifiLogsRelations = relations(wifiLogs, ({ one }) => ({
  device: one(devices, { fields: [wifiLogs.deviceHash], references: [devices.deviceHash] }),
  accessPoint: one(locations, { fields: [wifiLogs.accessPointId], references: [locations.id] }),
}));

export const libraryCheckoutsRelations = relations(libraryCheckouts, ({ one }) => ({
  user: one(users, { fields: [libraryCheckouts.userId], references: [users.id] }),
  asset: one(libraryAssets, { fields: [libraryCheckouts.assetId], references: [libraryAssets.id] }),
}));

export const roomBookingsRelations = relations(roomBookings, ({ one }) => ({
  user: one(users, { fields: [roomBookings.userId], references: [users.id] }),
  location: one(locations, { fields: [roomBookings.locationId], references: [locations.id] }),
}));

export const helpdeskTicketsRelations = relations(helpdeskTickets, ({ one }) => ({
  user: one(users, { fields: [helpdeskTickets.userId], references: [users.id] }),
}));

export const cctvFrameLogsRelations = relations(cctvFrameLogs, ({ one }) => ({
  location: one(locations, { fields: [cctvFrameLogs.locationId], references: [locations.id] }),
}));
