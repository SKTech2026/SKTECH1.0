export type OrientalMindoroLguType = "municipality" | "city";

export type OrientalMindoroLgu = {
  name: string;
  type: OrientalMindoroLguType;
  psgcCode: string;
  barangayCount: number;
  aliases?: readonly string[];
  barangays: readonly string[];
};

export type OrientalMindoroLocations = {
  metadata: {
    name: string;
    psgcCode: string;
    region: string;
    regionCode: string;
    source: string;
    psgcPublication: string;
    totalLGUs: number;
    totalMunicipalities: number;
    totalCities: number;
    totalBarangays: number;
  };
  lgus: OrientalMindoroLgu[];
};

export const ORIENTAL_MINDORO_LOCATIONS = {
  metadata: {
    name: "Oriental Mindoro",
    psgcCode: "1705200000",
    region: "MIMAROPA Region",
    regionCode: "1700000000",
    source: "https://psa.gov.ph/classification/psgc/citimuni/1705200000",
    psgcPublication: "30 June 2026",
    totalLGUs: 15,
    totalMunicipalities: 14,
    totalCities: 1,
    totalBarangays: 426,
  },
  lgus: [
    {
      name: "Baco",
      type: "municipality",
      psgcCode: "1705201000",
      barangayCount: 27,
      barangays: [
        "Alag", "Bangkatan", "Burbuli", "Catwiran I", "Catwiran II", "Dulangan I",
        "Dulangan II", "Lumang Bayan", "Malapad", "Mangangan I", "Mangangan II",
        "Mayabig", "Pambisan", "Pulang-Tubig", "Putican-Cabulo", "San Andres",
        "San Ignacio", "Santa Cruz", "Santa Rosa I", "Santa Rosa II", "Tabon-tabon",
        "Tagumpay", "Water", "Baras", "Bayanan", "Lantuyang", "Poblacion",
      ],
    },
    {
      name: "Bansud",
      type: "municipality",
      psgcCode: "1705202000",
      barangayCount: 13,
      barangays: [
        "Alcadesma", "Bato", "Conrazon", "Malo", "Manihala", "Pag-Asa", "Poblacion",
        "Proper Bansud", "Rosacara", "Salcedo", "Sumagui", "Proper Tiguisan",
        "Villa Pag-Asa",
      ],
    },
    {
      name: "Bongabong",
      type: "municipality",
      psgcCode: "1705203000",
      barangayCount: 36,
      barangays: [
        "Anilao", "Batangan", "Bukal", "Camantigue", "Carmundo", "Cawayan", "Dayhagan",
        "Formon", "Hagan", "Hagupit", "Kaligtasan", "Labasan", "Labonan", "Libertad",
        "Lisap", "Luna", "Malitbog", "Mapang", "Masaguisi", "Morente", "Ogbot",
        "Orconuma", "Polusahi", "Sagana", "San Isidro", "San Jose", "San Juan",
        "Santa Cruz", "Sigange", "Tawas", "Poblacion", "Aplaya", "Bagumbayan I",
        "Bagumbayan II", "Ipil", "Mina de Oro",
      ],
    },
    {
      name: "Bulalacao",
      type: "municipality",
      psgcCode: "1705204000",
      barangayCount: 15,
      barangays: [
        "Bagong Sikat", "Balatasan", "Benli", "Cabugao", "Cambunang", "Campaasan",
        "Maasin", "Maujao", "Milagrosa", "Nasukob", "Poblacion", "San Francisco",
        "San Isidro", "San Juan", "San Roque",
      ],
    },
    {
      name: "City of Calapan",
      type: "city",
      psgcCode: "1705205000",
      barangayCount: 62,
      aliases: ["Calapan City"],
      barangays: [
        "Balingayan", "Balite", "Baruyan", "Batino", "Bayanan I", "Bayanan II", "Biga",
        "Bondoc", "Bucayao", "Buhuan", "Bulusan", "Sta. Rita", "Calero", "Camansihan",
        "Camilmil", "Canubing I", "Canubing II", "Comunal", "Guinobatan", "Gulod",
        "Gutad", "Ibaba East", "Ibaba West", "Ilaya", "Lalud", "Lazareto", "Libis",
        "Lumangbayan", "Mahal Na Pangalan", "Maidlang", "Malad", "Malamig", "Managpi",
        "Masipit", "Nag-Iba I", "Navotas", "Pachoca", "Palhi", "Panggalaan", "Parang",
        "Patas", "Personas", "Puting Tubig", "Salong", "San Antonio",
        "San Vicente Central", "San Vicente East", "San Vicente North", "San Vicente South",
        "San Vicente West", "Sta. Cruz", "Sta. Isabel", "Sto. Niño", "Sapul", "Silonay",
        "Sta. Maria Village", "Suqui", "Tawagan", "Tawiran", "Tibag", "Wawa",
        "Nag-Iba II",
      ],
    },
    {
      name: "Gloria",
      type: "municipality",
      psgcCode: "1705206000",
      barangayCount: 27,
      barangays: [
        "Agsalin", "Agos", "Andres Bonifacio", "Balete", "Banus", "Banutan",
        "Buong Lupa", "Bulaklakan", "Gaudencio Antonino", "Guimbonan", "Kawit",
        "Lucio Laurel", "Macario Adriatico", "Malamig", "Malayong", "Maligaya",
        "Malubay", "Manguyang", "Maragooc", "Mirayan", "Narra", "Papandungin",
        "San Antonio", "Santa Maria", "Santa Theresa", "Tambong", "Alma Villa",
      ],
    },
    {
      name: "Mansalay",
      type: "municipality",
      psgcCode: "1705207000",
      barangayCount: 17,
      barangays: [
        "B. Del Mundo", "Balugo", "Bonbon", "Budburan", "Cabalwa", "Don Pedro",
        "Maliwanag", "Manaul", "Panaytayan", "Poblacion", "Roma", "Santa Brigida",
        "Santa Maria", "Villa Celestial", "Wasig", "Santa Teresita", "Waygan",
      ],
    },
    {
      name: "Naujan",
      type: "municipality",
      psgcCode: "1705208000",
      barangayCount: 70,
      barangays: [
        "Adrialuna", "Antipolo", "Apitong", "Arangin", "Aurora", "Bacungan",
        "Bagong Buhay", "Bancuro", "Barcenaga", "Bayani", "Buhangin", "Concepcion",
        "Dao", "Del Pilar", "Estrella", "Evangelista", "Gamao", "General Esco",
        "Herrera", "Inarawan", "Kalinisan", "Laguna", "Mabini", "Andres Ilagan",
        "Mahabang Parang", "Malaya", "Malinao", "Malvar", "Masagana", "Masaguing",
        "Melgar A", "Metolza", "Montelago", "Montemayor", "Motoderazo", "Mulawin",
        "Nag-Iba I", "Nag-Iba II", "Pagkakaisa", "Paniquian", "Pinagsabangan I",
        "Pinagsabangan II", "Piñahan", "Poblacion I", "Poblacion II", "Poblacion III",
        "Sampaguita", "San Agustin I", "San Agustin II", "San Andres", "San Antonio",
        "San Carlos", "San Isidro", "San Jose", "San Luis", "San Nicolas", "San Pedro",
        "Santa Isabel", "Santa Maria", "Santiago", "Santo Niño", "Tagumpay", "Tigkan",
        "Melgar B", "Santa Cruz", "Balite", "Banuton", "Caburo", "Magtibay", "Paitan",
      ],
    },
    {
      name: "Pinamalayan",
      type: "municipality",
      psgcCode: "1705209000",
      barangayCount: 37,
      barangays: [
        "Anoling", "Bacungan", "Bangbang", "Banilad", "Buli", "Cacawan", "Calingag",
        "Delrazon", "Inclanay", "Lumambayan", "Malaya", "Maliangcog", "Maningcol",
        "Marayos", "Marfrancisco", "Nabuslot", "Pagalagala", "Palayan",
        "Pambisan Malaki", "Pambisan Munti", "Panggulayan", "Papandayan", "Pili",
        "Zone II", "Zone III", "Zone IV", "Quinabigan", "Ranzo", "Rosario", "Sabang",
        "Sta. Isabel", "Sta. Maria", "Sta. Rita", "Wawa", "Zone I", "Sto. Niño",
        "Guinhawa",
      ],
    },
    {
      name: "Pola",
      type: "municipality",
      psgcCode: "1705210000",
      barangayCount: 23,
      barangays: [
        "Bacawan", "Bacungan", "Batuhan", "Bayanan", "Biga", "Buhay Na Tubig",
        "Calubasanhon", "Calima", "Casiligan", "Malibago", "Maluanluan", "Matulatula",
        "Pahilahan", "Panikihan", "Zone I", "Zone II", "Pula", "Puting Cacao",
        "Tagbakin", "Tagumpay", "Tiguihan", "Campamento", "Misong",
      ],
    },
    {
      name: "Puerto Galera",
      type: "municipality",
      psgcCode: "1705211000",
      barangayCount: 13,
      barangays: [
        "Aninuan", "Balatero", "Dulangan", "Palangan", "Sabang", "San Antonio",
        "San Isidro", "Santo Niño", "Sinandigan", "Tabinay", "Villaflor", "Poblacion",
        "Baclayan",
      ],
    },
    {
      name: "Roxas",
      type: "municipality",
      psgcCode: "1705212000",
      barangayCount: 20,
      barangays: [
        "Bagumbayan", "Cantil", "Dangay", "Happy Valley", "Libertad", "Libtong",
        "Mabuhay", "Maraska", "Odiong", "Paclasan", "San Aquilino", "San Isidro",
        "San Jose", "San Mariano", "San Miguel", "San Rafael", "San Vicente", "Uyao",
        "Victoria", "Little Tanauan",
      ],
    },
    {
      name: "San Teodoro",
      type: "municipality",
      psgcCode: "1705213000",
      barangayCount: 8,
      barangays: [
        "Bigaan", "Calangatan", "Calsapa", "Ilag", "Lumangbayan", "Tacligan",
        "Poblacion", "Caagutayan",
      ],
    },
    {
      name: "Socorro",
      type: "municipality",
      psgcCode: "1705214000",
      barangayCount: 26,
      barangays: [
        "Bagsok", "Batong Dalig", "Bayuin", "Calocmoy", "Catiningan", "Villareal",
        "Fortuna", "Happy Valley", "Calubayan", "Leuteboro I", "Leuteboro II",
        "Mabuhay I", "Malugay", "Matungao", "Monteverde", "Pasi I", "Pasi II",
        "Zone I", "Zone II", "Zone III", "Zone IV", "Santo Domingo", "Subaan",
        "Bugtong Na Tuog", "Mabuhay II", "Ma. Concepcion",
      ],
    },
    {
      name: "Victoria",
      type: "municipality",
      psgcCode: "1705215000",
      barangayCount: 32,
      barangays: [
        "Alcate", "Babangonan", "Bagong Silang", "Bagong Buhay", "Bambanin", "Bethel",
        "Canaan", "Concepcion", "Duongan", "Loyal", "Mabini", "Macatoc", "Malabo",
        "Merit", "Ordovilla", "Pakyas", "Poblacion I", "Poblacion II", "Poblacion III",
        "Poblacion IV", "Sampaguita", "San Antonio", "San Gabriel", "San Gelacio",
        "San Isidro", "San Juan", "San Narciso", "Urdaneta", "Villa Cerveza",
        "Jose Leido Jr.", "San Cristobal", "Antonino",
      ],
    },
  ],
} as const satisfies OrientalMindoroLocations;

export function normalizeLocationName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getOrientalMindoroMetadata() {
  return ORIENTAL_MINDORO_LOCATIONS.metadata;
}

export function getOrientalMindoroLgus(): readonly OrientalMindoroLgu[] {
  return ORIENTAL_MINDORO_LOCATIONS.lgus;
}

export function getOrientalMindoroBarangayCount() {
  return ORIENTAL_MINDORO_LOCATIONS.lgus.reduce(
    (total, lgu) => total + lgu.barangays.length,
    0,
  );
}

export function validateOrientalMindoroLocations() {
  const metadata = getOrientalMindoroMetadata();
  const lguCount = ORIENTAL_MINDORO_LOCATIONS.lgus.length;
  const municipalityCount = ORIENTAL_MINDORO_LOCATIONS.lgus.filter(
    (lgu) => lgu.type === "municipality",
  ).length;
  const cityCount = ORIENTAL_MINDORO_LOCATIONS.lgus.filter((lgu) => lgu.type === "city").length;
  const barangayCount = getOrientalMindoroBarangayCount();
  const lguBarangayMismatches = ORIENTAL_MINDORO_LOCATIONS.lgus
    .filter((lgu) => lgu.barangayCount !== lgu.barangays.length)
    .map((lgu) => ({
      name: lgu.name,
      expected: lgu.barangayCount,
      actual: lgu.barangays.length,
    }));
  const duplicateBarangays = ORIENTAL_MINDORO_LOCATIONS.lgus.flatMap((lgu) => {
    const seen = new Set<string>();
    return lgu.barangays
      .map((barangay) => normalizeLocationName(barangay))
      .filter((barangay) => {
        if (seen.has(barangay)) return true;
        seen.add(barangay);
        return false;
      })
      .map((barangay) => ({ lgu: lgu.name, barangay }));
  });
  const errors = [
    lguCount === metadata.totalLGUs ? null : `Expected ${metadata.totalLGUs} LGUs, got ${lguCount}.`,
    municipalityCount === metadata.totalMunicipalities
      ? null
      : `Expected ${metadata.totalMunicipalities} municipalities, got ${municipalityCount}.`,
    cityCount === metadata.totalCities ? null : `Expected ${metadata.totalCities} cities, got ${cityCount}.`,
    barangayCount === metadata.totalBarangays
      ? null
      : `Expected ${metadata.totalBarangays} barangays, got ${barangayCount}.`,
    lguBarangayMismatches.length === 0
      ? null
      : `LGU barangay count mismatch: ${JSON.stringify(lguBarangayMismatches)}.`,
    duplicateBarangays.length === 0
      ? null
      : `Duplicate barangays found: ${JSON.stringify(duplicateBarangays)}.`,
  ].filter(Boolean) as string[];

  return {
    valid: errors.length === 0,
    errors,
    totals: {
      lguCount,
      municipalityCount,
      cityCount,
      barangayCount,
    },
  };
}

export const ORIENTAL_MINDORO_LOCATION_VALIDATION = validateOrientalMindoroLocations();

if (!ORIENTAL_MINDORO_LOCATION_VALIDATION.valid) {
  throw new Error(
    `Invalid Oriental Mindoro location dataset: ${ORIENTAL_MINDORO_LOCATION_VALIDATION.errors.join(" ")}`,
  );
}
