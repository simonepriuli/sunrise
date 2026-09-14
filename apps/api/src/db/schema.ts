import {
  date,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const trainings = pgTable("trainings", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("planned"),
  durationMinutes: integer("duration_minutes"),
  distanceKm: real("distance_km"),
  elevationM: integer("elevation_m"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})
