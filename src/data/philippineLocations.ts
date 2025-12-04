export interface PhilippineLocation {
  city: string;
  barangays: string[];
}

export const philippineLocations: PhilippineLocation[] = [
  // Metro Manila
  {
    city: "Manila",
    barangays: [
      "Barangay 1", "Barangay 2", "Barangay 3", "Binondo", "Ermita", "Intramuros", 
      "Malate", "Paco", "Pandacan", "Port Area", "Quiapo", "Sampaloc", "San Miguel", 
      "San Nicolas", "Santa Ana", "Santa Cruz", "Santa Mesa", "Tondo"
    ]
  },
  {
    city: "Quezon City",
    barangays: [
      "Baesa", "Bagong Pag-asa", "Bagumbayan", "Bago Bantay", "Bahay Toro", 
      "Balingasa", "Bungad", "Camp Aguinaldo", "Commonwealth", "Cubao", 
      "Diliman", "Fairview", "Kamuning", "Katipunan", "La Loma", "Libis", 
      "Malibay", "Novaliches", "Project 4", "San Francisco del Monte", 
      "Tandang Sora", "Teachers Village", "Ugong Norte", "West Triangle"
    ]
  },
  {
    city: "Caloocan",
    barangays: [
      "Bagong Silang", "Baesa", "Camarin", "Grace Park East", "Grace Park West", 
      "Kaybiga", "Llano", "Maypajo", "Sangandaan", "Talipapa", "Tala", 
      "Bagumbong", "Deparo", "Kamagong", "Libjo", "Malanday", "Morning Breeze"
    ]
  },
  {
    city: "Las Piñas",
    barangays: [
      "Almanza Dos", "Almanza Uno", "B.F. International Village", "Daniel Fajardo", 
      "Elias Aldana", "Ilaya", "Manuyo Dos", "Manuyo Uno", "Pamplona Dos", 
      "Pamplona Tres", "Pamplona Uno", "Pilar", "Pulang Lupa Dos", "Pulang Lupa Uno", 
      "Talon Cuatro", "Talon Dos", "Talon Singko", "Talon Tres", "Talon Uno", "Zapote"
    ]
  },
  {
    city: "Makati",
    barangays: [
      "Bangkal", "Bel-Air", "Carmona", "Cembo", "Comembo", "Dasmariñas", 
      "East Rembo", "Forbes Park", "Guadalupe Nuevo", "Guadalupe Viejo", 
      "Kasilawan", "La Paz", "Magallanes", "Olympia", "Palanan", "Pembo", 
      "Pinagkaisahan", "Poblacion", "Post Proper Northside", "Post Proper Southside", 
      "Rizal", "San Antonio", "San Isidro", "San Lorenzo", "Santa Cruz", 
      "Singkamas", "South Cembo", "Tejeros", "Urdaneta", "Valenzuela", "West Rembo"
    ]
  },
  {
    city: "Pasig",
    barangays: [
      "Bagong Ilog", "Bagong Katipunan", "Bambang", "Buting", "Caniogan", 
      "Dela Paz", "Kalawaan", "Kapasigan", "Kapitolyo", "Malinao", "Manggahan", 
      "Maybunga", "Oranbo", "Palatiw", "Pinagbuhatan", "Rosario", "Sagad", 
      "San Antonio", "San Joaquin", "San Jose", "San Miguel", "San Nicolas", 
      "Santa Lucia", "Santa Rosa", "Santo Tomas", "Santolan", "Sumilang", 
      "Ugong", "Wawa"
    ]
  },
  {
    city: "Taguig",
    barangays: [
      "Bagumbayan", "Bambang", "Calzada", "Central Bicutan", "Central Signal Village", 
      "Fort Bonifacio", "Hagonoy", "Ibayo-Tipas", "Ligid-Tipas", "New Lower Bicutan", 
      "Napindan", "North Daang Hari", "North Signal Village", "Palingon", "Pinagsama", 
      "San Miguel", "Santa Ana", "South Daang Hari", "South Signal Village", 
      "Tanyag", "Tuktukan", "Upper Bicutan", "Ususan", "Wawa", "Western Bicutan"
    ]
  },
  {
    city: "Parañaque",
    barangays: [
      "Baclaran", "B.F. Homes", "Don Bosco", "Don Galo", "La Huerta", 
      "Marcelo Green Village", "Merville", "Moonwalk", "San Antonio", 
      "San Dionisio", "San Isidro", "San Martin de Porres", "Santo Niño", 
      "Sun Valley", "Tambo", "Vitalez"
    ]
  },
  {
    city: "Muntinlupa",
    barangays: [
      "Alabang", "Ayala Alabang", "Buli", "Cupang", "New Alabang Village", 
      "Poblacion", "Putatan", "Sucat", "Tunasan"
    ]
  },
  {
    city: "Valenzuela",
    barangays: [
      "Arkong Bato", "Bagbaguin", "Bignay", "Bisig", "Canumay East", 
      "Canumay West", "Coloong", "Dalandanan", "Gen. T. de Leon", "Karuhatan", 
      "Lawang Bato", "Lingunan", "Mabolo", "Malanday", "Malinta", 
      "Mapulang Lupa", "Marulas", "Maysan", "Palasan", "Parada", 
      "Pariancillo Villa", "Paso de Blas", "Poblacion", "Polo", "Punturin", 
      "Rincon", "Tagalag", "Ugong", "Viente Reales", "Wawang Pulo"
    ]
  },
  {
    city: "Marikina",
    barangays: [
      "Barangka", "Calumpang", "Concepcion Dos", "Concepcion Uno", "Fortune", 
      "Industrial Valley Complex", "Jesus de la Peña", "Malanday", "Marikina Heights", 
      "Nangka", "Parang", "San Roque", "Santa Elena", "Santo Niño", 
      "Tañong", "Tumana"
    ]
  },
  {
    city: "Mandaluyong",
    barangays: [
      "Addition Hills", "Bagong Silang", "Barangka", "Buayang Bato", "Burol", 
      "Daang Bakal", "Hagdang Bato Itaas", "Hagdang Bato Libis", "Harapin ang Bukas", 
      "Highway Hills", "Hulo", "Mabini-J. Rizal", "Malamig", "Mauway", 
      "Namayan", "New Zañiga", "Old Zañiga", "Plainview", "Pleasant Hills", 
      "Poblacion", "San Jose", "Vergara", "Wack Wack Greenhills"
    ]
  },
  {
    city: "Pasay",
    barangays: [
      "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", 
      "Barangay 6", "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10", 
      "Barangay 76", "Barangay 183", "Barangay 201", "Malibay", "Maricaban", 
      "San Isidro", "San Rafael", "San Roque", "Tramo", "Villamor"
    ]
  },
  {
    city: "Malabon",
    barangays: [
      "Acacia", "Baritan", "Bayan-Bayanan", "Catmon", "Concepcion", 
      "Dampalit", "Flores", "Hulong Duhat", "Ibaba", "Longos", 
      "Maysilo", "Muzon", "Niugan", "Panghulo", "Potrero", 
      "San Agustin", "Santolan", "Tañong", "Tonsuya", "Tugatog"
    ]
  },
  {
    city: "Navotas",
    barangays: [
      "Bagumbayan North", "Bagumbayan South", "Bangculasi", "Daanghari", 
      "North Bay Boulevard North", "North Bay Boulevard South", "Northbay", 
      "San Jose", "San Rafael Village", "San Roque", "Sipac-Almacen", 
      "Tangos North", "Tangos South", "Tanza 1", "Tanza 2"
    ]
  },
  {
    city: "San Juan",
    barangays: [
      "Addition Hills", "Balong-Bato", "Batis", "Corazon de Jesus", "Ermitaño", 
      "Greenhills", "Halo-Halo", "Isabelita", "Kabayanan", "Little Baguio", 
      "Maytunas", "Onse", "Pasadeña", "Pedro Cruz", "Poblacion", 
      "Progress Village", "Rivera", "Salapan", "San Perfecto", "Santa Lucia", 
      "Tibagan", "West Crame"
    ]
  },

  // Luzon - Central Luzon
  {
    city: "Angeles City",
    barangays: [
      "Agapito del Rosario", "Amsic", "Balibago", "Capaya", "Claro M. Recto", 
      "Cuayan", "Cutcut", "Lourdes Northwest", "Lourdes Sur East", "Lourdes Sur West", 
      "Malabanias", "Malabañas", "Mining", "Pampang", "Pulungbulu", 
      "Salapungan", "Santo Cristo", "Santo Domingo", "Santo Rosario", "Sapangbato"
    ]
  },
  {
    city: "San Fernando (Pampanga)",
    barangays: [
      "Alasas", "Baliti", "Bulaon", "Calulut", "Del Carmen", 
      "Del Pilar", "Del Rosario", "Dolores", "Juliana", "Lara", 
      "Lourdes", "Magliman", "Maimpis", "Malino", "Pangulo", 
      "Pulung Cacutud", "Pulung Santol", "Quebiawan", "San Agustin", "San Felipe"
    ]
  },
  {
    city: "Olongapo",
    barangays: [
      "Asinan", "Banicain", "Barretto", "East Bajac-Bajac", "East Tapinac", 
      "Gordon Heights", "Kalaklan", "Kalalake", "Mabayuan", "New Cabalan", 
      "New Kababae", "New Kalalake", "Pag-asa", "Santa Rita", "West Bajac-Bajac", 
      "West Tapinac"
    ]
  },
  {
    city: "Cabanatuan",
    barangays: [
      "Aduas Norte", "Aduas Sur", "Bagong Sikat", "Bantug", "Barrera", 
      "Bitas", "Cabu", "Camp Tinio", "Caudillo", "Dalawa", 
      "General Luna", "Imelda Valley", "Kalikid Norte", "Kalikid Sur", "Kapitan Pepe", 
      "Lagare", "Mahipon", "Mainam", "Mataas na Kahoy", "Mayapyap Norte"
    ]
  },
  {
    city: "Tarlac City",
    barangays: [
      "Aguso", "Alvindia Segundo", "Amucao", "Armenia", "Asturias", 
      "Balingcanaway", "Banaba", "Bantog", "Baras-baras", "Batang-batang", 
      "Binauganan", "Bora", "Buenavista", "Burgos", "Calingcuan", 
      "Care", "Central", "Cut-cut I", "Cut-cut II", "Dalayap"
    ]
  },
  {
    city: "Baguio",
    barangays: [
      "Ambiong", "Andres Bonifacio", "Aurora Hill", "Bakakeng Central", "Bakakeng Norte", 
      "Balsigan", "Bayan Park East", "Bayan Park West", "BGH Compound", "Brookside", 
      "Burnham-Legarda", "Cabinet Hill-Teachers Camp", "Camp 7", "Camp 8", "Campo Filipino", 
      "Country Club Village", "Crawford", "Cresencia Village", "Dagsaan", "Dizon Subdivision"
    ]
  },

  // Luzon - Southern Luzon
  {
    city: "Batangas City",
    barangays: [
      "Alangilan", "Balagtas", "Balete", "Banaba Center", "Banaba East", 
      "Banaba Kanluran", "Banaba Silangan", "Barangay 1", "Barangay 2", "Barangay 3", 
      "Barangay 4", "Barangay 5", "Barangay 6", "Barangay 7", "Barangay 8", 
      "Barangay 9", "Barangay 10", "Barangay 11", "Barangay 12", "Barangay 13"
    ]
  },
  {
    city: "Lipa",
    barangays: [
      "Adya", "Anilao-Labac", "Antipolo del Norte", "Antipolo del Sur", "Bagong Pook", 
      "Balintawak", "Banaybanay", "Bolbok", "Bugtong na Pulo", "Bulacnin", 
      "Bulaklakan", "Calamias", "Cumba", "Dagatan", "Duhatan", 
      "Gonzales", "Guilaran", "Halang", "Inosluban", "Kayumanggi"
    ]
  },
  {
    city: "Lucena",
    barangays: [
      "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", 
      "Barra", "Bocohan", "Cotta", "Dalahican", "Domoit", 
      "Gulang-Gulang", "Ibabang Dupay", "Ibabang Iyam", "Ibabang Talim", "Ilayang Dupay", 
      "Ilayang Iyam", "Ilayang Talim", "Isabang", "Market View", "Mayao Crossing"
    ]
  },
  {
    city: "Naga",
    barangays: [
      "Abella", "Bagumbayan Norte", "Bagumbayan Sur", "Balatas", "Calauag", 
      "Canaman", "Carolina", "Cararayan", "Carolino", "Concepcion Grande", 
      "Concepcion Pequeña", "Dayangdang", "Del Rosario", "Dinaga", "Igualdad Interior", 
      "Lerma", "Liboton", "Mabolo", "Pacol", "Panicuason"
    ]
  },
  {
    city: "Legazpi",
    barangays: [
      "Arimbay", "Bagacay", "Bagong Abre", "Banquerohan", "Bariis", 
      "Bigaa", "Binanuahan East", "Binanuahan West", "Bitano", "Bogña", 
      "Bonga", "Bonot", "Buyuan", "Cabangan", "Cabid-an", 
      "Cruzada", "Dap-dap", "Daraga", "Dinagaan", "Dita"
    ]
  },

  // Visayas
  {
    city: "Cebu City",
    barangays: [
      "Apas", "Banilad", "Basak Pardo", "Basak San Nicolas", "Binaliw", 
      "Busay", "Camputhaw", "Capitol Site", "Carreta", "Cogon Pardo", 
      "Day-as", "Guadalupe", "Hipodromo", "IT Park", "Kasambagan", 
      "Labangon", "Lahug", "Mabolo", "Mambaling", "Pahina Central", 
      "Pardo", "Pit-os", "Poblacion Pardo", "Punta Princesa", "Quiot", 
      "Sambag I", "Sambag II", "San Antonio", "San Jose", "San Nicolas Proper", 
      "Sikatuna", "Sirao", "Talamban", "Tisa", "Zapatera"
    ]
  },
  {
    city: "Lapu-Lapu (Opon)",
    barangays: [
      "Agus", "Babag", "Bankal", "Basak", "Buaya", 
      "Canjulao", "Caw-oy", "Gun-ob", "Ibo", "Looc", 
      "Mactan", "Marigondon", "Pajac", "Pajo", "Poblacion", 
      "Punta Engaño", "Pusok", "Sabang", "Santa Rosa", "Subabasbas", 
      "Talima", "Tingo", "Tungasan"
    ]
  },
  {
    city: "Mandaue",
    barangays: [
      "Alang-alang", "Bakilid", "Banilad", "Basak", "Cabancalan", 
      "Cambaro", "Canduman", "Casili", "Casuntingan", "Centro", 
      "Cubacub", "Guizo", "Ibabao-Estancia", "Jagobiao", "Labogon", 
      "Looc", "Maguikay", "Mantuyong", "Opao", "Pakna-an", 
      "Pagsabungan", "Subangdaku", "Tabok", "Tawason", "Tingub", 
      "Tipolo", "Umapad"
    ]
  },
  {
    city: "Iloilo City",
    barangays: [
      "Arevalo", "Balantang", "Bito-on", "Bo. Obrero", "Buntatala", 
      "Calaparan", "Calumpang", "Claudio Lopez", "Cuartero", "Danao", 
      "Desamparados", "Dulonan", "Dungon A", "Dungon B", "Gen. Hughes", 
      "Hibao-an Norte", "Hibao-an Sur", "Ingore", "Jalandoni Estate", 
      "Jaro", "Kasing-kasing", "La Paz", "Laguda", "Luna", "Ma. Clara", 
      "Magsaysay Village", "Malipayon", "Mandurriao", "Monica Blumentritt", 
      "Molo", "Nabitasan", "Our Lady of Fatima", "Our Lady of Lourdes", 
      "Pale Benedicto Rizal", "Poblacion", "Quintin Salas", "Rizal Estanzuela", 
      "Rizal Palapala I", "Rizal Palapala II", "Sambag", "San Agustin", 
      "San Antonio", "San Felix", "San Jose", "San Juan", "San Pedro", 
      "San Rafael", "Santa Filomena", "Santa Isabel", "Santa Monica", 
      "Santo Domingo", "Santo Niño Norte", "Santo Niño Sur", "Santo Rosario-Duran", 
      "Sinikway", "Tabuc Suba", "Tagbac", "Tabucan", "Tanza-Esperanza", 
      "Tibanga", "Tungkop", "Villa Anita"
    ]
  },
  {
    city: "Bacolod",
    barangays: [
      "Alangilan", "Alijis", "Banago", "Bata", "Cabug", 
      "Estefania", "Felisa", "Glendale-Crossing", "Granada", "Handumanan", 
      "Langao", "Lopez Jaena", "Mandalagan", "Mansilingan", "Montevista", 
      "Pahanocoy", "Punta Taytay", "Singcang-Airport", "Sum-ag", "Taculing", 
      "Tangub", "Villa Lucerna", "Villamonte"
    ]
  },
  {
    city: "Tacloban",
    barangays: [
      "Abucay", "Apitong", "Bagacay", "Baras", "Basper", 
      "Bon-ot", "Burauen", "Cabintan", "Cabalawan", "Caibaan", 
      "Calanipawan", "Calvaryhill", "Campetic", "Candahug", "Caratagan", 
      "Cut-cut", "Diit", "Fatima", "Guintigui-an", "Humagda", 
      "Kankabato", "Lumbang", "Magsaysay", "Marasbaras", "New Kawayan", 
      "Old Kawayan", "Palanog", "Rawis", "Sagkahan", "San Jose", 
      "San Roque", "Santa Elena", "Santo Niño", "Suhi", "Tacloban", 
      "Tagapuro", "Tigbao", "V&G Subdivision", "Zamora"
    ]
  },

  // Mindanao
  {
    city: "Davao City",
    barangays: [
      "Agdao", "Bago Gallera", "Bago Oshiro", "Bangkas Heights", "Buhangin", 
      "Bunawan", "Cabantian", "Calinan", "Carmen", "Catalunan Grande", 
      "Catalunan Pequeño", "Communal", "Daliao", "Dumoy", "Eden", 
      "Ilang", "Indangan", "Lacson", "Leon Garcia", "Lubogan", 
      "Ma-a", "Malabog", "Mamay", "Matina", "Mintal", "Mudiang", 
      "New Carmen", "Pampanga", "Poblacion", "Rafael Castillo", 
      "Sasa", "Sirib", "Talomo", "Tibungco", "Toril", "Tugbok", "Waan"
    ]
  },
  {
    city: "Cagayan de Oro",
    barangays: [
      "Agusan", "Balulang", "Baluarte", "Bayabas", "Bayanga", 
      "Bonsai", "Bonbon", "Bugo", "Bulua", "Camaman-an", 
      "Carmen", "Cogon", "F.S. Catanico", "Gusa", "Iponan", 
      "Kauswagan", "Lapasan", "Lumbia", "Macabalan", "Macasandig", 
      "Nazareth", "Pagatpat", "Puerto", "San Simon", "Tablon", 
      "Tagpangi", "Tignapoloan", "Tuburan", "Upper Carmen", "Upper Gusa"
    ]
  },
  {
    city: "General Santos",
    barangays: [
      "Apopong", "Baluan", "Batomelong", "Buayan", "Bula", 
      "Calumpang", "City Heights", "Conel", "Dadiangas East", "Dadiangas North", 
      "Dadiangas South", "Dadiangas West", "Fatima", "Katangawan", "Labangal", 
      "Lagao", "Ligaya", "Mabuhay", "Olympog", "San Isidro", 
      "San Jose", "Siguel", "Sinawal", "Tambler", "Tinagacan", 
      "Upper Labay"
    ]
  },
  {
    city: "Butuan",
    barangays: [
      "Agusan Pequeño", "Ambago", "Amparo", "Anticala", "Antongalon", 
      "Baan Km 3", "Baan Riverside", "Babag", "Bancasi", "Banza", 
      "Barangay V", "Bit-os", "Bobon", "Boding", "Bonbon", 
      "Buhanginan", "Camayahan", "Consolacion", "Dagohoy", "Diego Silang", 
      "Dumalagan", "Doongan", "Golden Ribbon", "Humabon", "Imadejas", 
      "Jose Rizal", "Kinamlutan", "Lapu-lapu", "Leon Kilat", "Libertad", 
      "Los Angeles", "Lumbocan", "Maguinda", "Mahay", "Maibu", 
      "Mandamo", "Manila de Bugabus", "Maon", "Masao", "New Society Village", 
      "Ong Yiu", "Pianing", "Port Poyohon", "Rajah Soliman", "San Ignacio", 
      "San Mateo", "San Vicente", "Sikatuna", "Silongan", "Sumilihon", 
      "Tagabaca", "Taguibo", "Tandang Sora", "Tiniwisan", "Tungao"
    ]
  },
  {
    city: "Zamboanga City",
    barangays: [
      "Ayala", "Baliwasan", "Boalan", "Bolong", "Buenavista", 
      "Bunguiao", "Busay", "Cabaluay", "Cabatangan", "Cabeza", 
      "Calabasa", "Calarian", "Camino Nuevo", "Campo Islam", "Canelar", 
      "Capisan", "Cawit", "Culianan", "Curuan", "Divisoria", 
      "Dulian", "Guiwan", "Kasanyangan", "La Paz", "Labuan", 
      "Lamisahan", "Landang Gua", "Landang Laum", "Latuan", "Limaong", 
      "Limpapa", "Lubigan", "Lukbutan", "Lumayang", "Lunzuran", 
      "Maasin", "Malagutay", "Mampang", "Manalipa", "Manicahan", 
      "Manneh", "Mariki", "Mercedes", "Muti", "Pamucutan", 
      "Pangapuyan", "Panubigan", "Pasonanca", "Paulan", "Piacan", 
      "Putik", "Quiniput", "Recodo", "Rio Hondo", "Salaan", 
      "San Jose Cawa-cawa", "San Jose Gusu", "San Roque", "Sangali", "Santa Barbara", 
      "Santa Catalina", "Santa Maria", "Sinubung", "Sinunuc", "Tagasilay", 
      "Taguiti", "Talabaan", "Talamban", "Taluksangay", "Tetuan", 
      "Tictapul", "Tigbalabag", "Tigtabon", "Tolosa", "Tugbungan", 
      "Tulungatung", "Tumaga", "Upper Bunguiao", "Upper Calarian", "Victoria", 
      "Vitali", "Yakan", "Zambowood"
    ]
  },

  // Additional Major Cities
  {
    city: "Antipolo",
    barangays: [
      "Bagong Nayon", "Beverly Hills", "Cupang", "Dalig", "Dela Paz", 
      "Mambugan", "Mayamot", "San Isidro", "San Jose", "San Juan", 
      "San Luis", "San Roque", "Santa Cruz", "Santo Niño", "Sto. Tomas"
    ]
  },
  {
    city: "Dasmarinas",
    barangays: [
      "Bagong Bayan", "Burol", "Langkaan", "Paliparan", "Sabang", 
      "Salawag", "Sampaloc", "San Agustin", "Victoria Reyes"
    ]
  }
];

export const getCitiesList = (): string[] => {
  return philippineLocations.map(location => location.city).sort();
};

export const getBarangaysByCity = (city: string): string[] => {
  const location = philippineLocations.find(loc => loc.city === city);
  return location ? location.barangays.sort() : [];
};