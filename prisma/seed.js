/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, Role, UserStatus } = require("@prisma/client");
const { Pool } = require("pg");

const SALT_ROUNDS = 10;

const DEFAULT_USERS = [
  {
    employeeId: process.env.SEED_ADMIN_USER_ID || "admin001",
    name: "System Administrator",
    email: "admin001@skdg.local",
    role: Role.ADMIN,
    status: UserStatus.APPROVED,
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
  },
  {
    employeeId: process.env.SEED_STAFF_USER_ID || "staff001",
    name: "Municipal Staff",
    email: "staff001@skdg.local",
    role: Role.STAFF,
    status: UserStatus.APPROVED,
    password: process.env.SEED_STAFF_PASSWORD || "Staff@12345",
  },
  {
    employeeId: null,
    name: "SK Official",
    email: process.env.SEED_OFFICIAL_EMAIL || "official001@skdg.local",
    role: Role.OFFICIAL,
    status: UserStatus.APPROVED,
    password: process.env.SEED_OFFICIAL_PASSWORD || "Official@12345",
  },
];

const ORIENTAL_MINDORO_GEOGRAPHY = {
  Baco: [
    "Alag",
    "Bayanan I",
    "Bayanan II",
    "Burbuli",
    "Catwiran I",
    "Catwiran II",
    "Dulangan I",
    "Dulangan II",
    "Lumangbayan",
    "Malapad",
    "Mangangan I",
    "Mangangan II",
    "Mayabig",
    "Pambisan",
    "Putican",
    "San Andres",
    "San Ignacio",
    "Santa Cruz",
    "Santa Rosa",
    "Tabon-tabon",
    "Tagumpay",
    "Water",
  ],
  Bansud: [
    "Alcadesma",
    "Bato",
    "Buena Suerte",
    "Burgos",
    "Cambunang",
    "Don Pedro",
    "Malo",
    "Pag-asa",
    "Poblacion",
    "Proper Bansud",
    "Proper Tiguisan",
    "Rosacara",
    "Salcedo",
    "Sumagui",
    "Villa Pag-asa",
  ],
  Bongabong: [
    "Anilao",
    "Aplaya",
    "Bagumbayan I",
    "Bagumbayan II",
    "Batangan",
    "Bukal",
    "Camantigue",
    "Cawayan",
    "Dayhagan",
    "Formon",
    "Hagan",
    "Kaligtasan",
    "Labasan",
    "Mabini",
    "Mag-asawang Tubig",
    "Mapang",
    "Masaguing",
    "Morente",
    "San Isidro",
    "San Jose",
    "San Juan",
    "Santa Cruz",
    "Tawas",
  ],
  Bulalacao: [
    "Balatasan",
    "Benli",
    "Cambunang",
    "Maujao",
    "Milagrosa",
    "Nasukob",
    "Poblacion",
    "San Francisco",
    "San Isidro",
    "San Juan",
    "San Roque",
  ],
  Gloria: [
    "Agos",
    "Agsalin",
    "Andal",
    "Banutan",
    "Banus",
    "Buong Lupa",
    "Gaudencio Antonino",
    "Guimbonan",
    "Kawit",
    "Lucio Laurel",
    "Macario Adriatico",
    "Malamig",
    "Malubay",
    "Nangka I",
    "Nangka II",
    "Orion",
    "Papandungin",
    "San Antonio",
    "Santa Maria",
    "Tambong",
    "Tambong II",
  ],
  Mansalay: [
    "B. Del Mundo",
    "Balugo",
    "Bonbon",
    "Budburan",
    "Cabugao",
    "Don Pedro",
    "Maliwanag",
    "Manaul",
    "Panaytayan",
    "Poblacion",
    "Roma",
    "Santa Brigida",
    "Santa Maria",
    "Villa Celestial",
  ],
  Naujan: [
    "Adrialuna",
    "Andres Ilagan",
    "Antipolo",
    "Apitong",
    "Aurora",
    "Bacungan",
    "Bagong Buhay",
    "Bancuro",
    "Barcenaga",
    "Bayani",
    "Buhangin",
    "Caburo",
    "Concepcion",
    "Dao",
    "Del Pilar",
    "Estrella",
    "Evangelista",
    "Gamao",
    "General Esco",
    "Herrera",
    "Inarawan",
    "Kalinisan",
    "Laguna",
    "Mabini",
    "Malaya",
    "Malvar",
    "Masagana",
    "Masaguing",
    "Melgar A",
    "Melgar B",
    "Metolza",
    "Montelago",
    "Motoderazo",
    "Mulawin",
    "Nag-iba I",
    "Nag-iba II",
    "Pagkakaisa",
    "Paniquian",
    "Pinagsabangan I",
    "Pinagsabangan II",
    "Poblacion I",
    "Poblacion II",
    "Poblacion III",
    "Sampaguita",
    "San Agustin I",
    "San Agustin II",
    "San Andres",
    "San Antonio",
    "San Carlos",
    "San Isidro",
    "San Jose",
    "San Luis",
    "San Nicolas",
    "Santa Cruz",
    "Santa Isabel",
    "Santa Maria",
    "Santiago",
    "Tagumpay",
    "Tigkan",
    "Villa Magsaysay",
  ],
  Pinamalayan: [
    "Anoling",
    "Bacungan",
    "Bangbang",
    "Banilad",
    "Buli",
    "Cacawan",
    "Camilmil",
    "Guinhawa",
    "Inclanay",
    "Lumambayan",
    "Malaya",
    "Marayos",
    "Nabuslot",
    "Pagalagala",
    "Pambisan",
    "Panggulayan",
    "Pili",
    "Poblacion",
    "Quinabigan",
    "Ranzo",
    "Rosario",
    "Sabang",
    "Santa Isabel",
    "Santa Maria",
    "Santa Rita",
    "Santo Nino",
    "Wawa",
  ],
  Pola: [
    "Bacawan",
    "Calima",
    "Casague",
    "Maluanluan",
    "Matulatula",
    "Misong",
    "Poblacion",
    "Puting Cacao",
    "Tagbakin",
    "Tiguihan",
  ],
  "Puerto Galera": [
    "Aninuan",
    "Baclayan",
    "Balatero",
    "Dulangan",
    "Palangan",
    "Sabang",
    "San Antonio",
    "Sinandigan",
    "Tabinay",
    "Villaflor",
  ],
  Roxas: [
    "Bagumbayan",
    "Dangay",
    "Happy Valley",
    "Libertad",
    "Libtong",
    "Luna",
    "Mabuhay",
    "Maraska",
    "Odiong",
    "Paclasan",
    "Rizal",
    "San Aquilino",
    "San Isidro",
    "San Jose",
    "San Mariano",
    "San Rafael",
    "Sta. Teresa",
  ],
  "San Teodoro": [
    "Bigaan",
    "Calangatan",
    "Calsapa",
    "Ilag",
    "Lumangbayan",
    "Poblacion",
    "Tacligan",
  ],
  Socorro: [
    "Batong Dalig",
    "Bayuin",
    "Bugtong na Tuog",
    "Calubayan",
    "Catiningan",
    "Mabuhay I",
    "Mabuhay II",
    "Poblacion I",
    "Poblacion II",
    "Subaan",
  ],
  Victoria: [
    "Alcate",
    "Antonino",
    "Bagong Silang",
    "Bethel",
    "Duongan",
    "Loyal",
    "Macatoc",
    "Malabo",
    "Orion",
    "Poblacion",
    "San Antonio",
    "San Cristobal",
    "San Gabriel",
    "San Gelacio",
    "San Isidro",
    "San Narciso",
    "Urdaneta",
  ],
};

async function seedOrientalMindoroGeography(prisma) {
  const province = "Oriental Mindoro";

  for (const [municipalityName, barangays] of Object.entries(ORIENTAL_MINDORO_GEOGRAPHY)) {
    const existingMunicipality = await prisma.municipality.findFirst({
      where: {
        name: {
          equals: municipalityName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    const municipality = existingMunicipality
      ? await prisma.municipality.update({
          where: { id: existingMunicipality.id },
          data: { province },
          select: { id: true },
        })
      : await prisma.municipality.create({
          data: {
            name: municipalityName,
            province,
          },
          select: { id: true },
        });

    for (const rawBarangay of barangays) {
      const barangayName = rawBarangay.trim();
      if (!barangayName) continue;

      const existingBarangay = await prisma.barangay.findFirst({
        where: {
          municipalityId: municipality.id,
          name: {
            equals: barangayName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (!existingBarangay) {
        await prisma.barangay.create({
          data: {
            municipalityId: municipality.id,
            name: barangayName,
          },
        });
      }
    }
  }
}

async function upsertSeedUser(prisma, user) {
  const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

  const orConditions = [{ email: user.email }];
  if (user.employeeId) {
    orConditions.push({ employeeId: user.employeeId });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: orConditions },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        employeeId: user.employeeId || null,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: hashedPassword,
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      employeeId: user.employeeId || null,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: hashedPassword,
    },
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  const allowSelfSignedTls =
    process.env.PGSSL_ALLOW_SELF_SIGNED === "true" ||
    process.env.NODE_ENV !== "production";
  const getPoolConnectionString = () => {
    if (!allowSelfSignedTls) {
      return databaseUrl;
    }

    const parsed = new URL(databaseUrl);
    [
      "sslmode",
      "sslcert",
      "sslkey",
      "sslrootcert",
      "sslaccept",
      "ssl_min_protocol_version",
      "ssl_max_protocol_version",
    ].forEach((key) => parsed.searchParams.delete(key));

    return parsed.toString();
  };

  const pool = new Pool({
    connectionString: getPoolConnectionString(),
    ...(allowSelfSignedTls ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: ["error"],
  });

  try {
    for (const user of DEFAULT_USERS) {
      await upsertSeedUser(prisma, user);
    }
    console.log("Default ADMIN / STAFF / OFFICIAL accounts seeded successfully.");
    await seedOrientalMindoroGeography(prisma);
    console.log("Oriental Mindoro municipalities and barangays seeded successfully.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
