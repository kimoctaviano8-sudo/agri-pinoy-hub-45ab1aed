const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Philippine provinces and cities data (no external API needed)
const philippineProvincesData = [
  { province: "Metro Manila", cities: ["Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Pasig", "Taguig", "Parañaque", "Muntinlupa", "Valenzuela", "Marikina", "Mandaluyong", "Pasay", "Malabon", "Navotas", "San Juan"] },
  { province: "Batangas", cities: ["Batangas City", "Lipa", "Tanauan", "Santo Tomas", "Calaca", "Lemery", "Nasugbu", "Rosario", "San Jose", "Taal", "Bauan", "Agoncillo", "Alitagtag", "Balayan", "Cuenca", "Ibaan", "Laurel", "Lobo", "Mabini", "Malvar"] },
  { province: "Laguna", cities: ["Santa Rosa", "San Pedro", "Biñan", "Santa Cruz", "Calamba", "Los Baños", "Bay", "Calauan", "Alaminos", "Cabuyao", "San Pablo", "Pagsanjan", "Lumban", "Paete", "Pakil", "Pangil", "Siniloan", "Famy", "Mabitac", "Magdalena"] },
  { province: "Cavite", cities: ["Dasmarinas", "Bacoor", "Imus", "Kawit", "Noveleta", "Rosario", "Cavite City", "Trece Martires", "Tagaytay", "General Trias", "Carmona", "Silang", "Amadeo", "Mendez", "Alfonso", "General Aguinaldo", "Magallanes", "Maragondon", "Naic", "Ternate", "Tanza"] },
  { province: "Rizal", cities: ["Antipolo", "Cainta", "Marikina", "San Mateo", "Rodriguez", "Angono", "Binangonan", "Cardona", "Jala-jala", "Morong", "Pililla", "Tanay", "Teresa", "Baras", "Taytay"] },
  { province: "Bulacan", cities: ["Malolos", "Meycauayan", "San Jose del Monte", "Marilao", "Bocaue", "Guiguinto", "Balagtas", "Pandi", "Santa Maria", "Obando", "Hagonoy", "Calumpit", "Apalit", "Macabebe", "Masantol", "Pulilan", "Plaridel", "Baliuag", "Bustos", "San Rafael", "Angat", "Norzagaray", "San Miguel", "San Ildefonso"] },
  { province: "Pampanga", cities: ["San Fernando", "Angeles City", "Mabalacat", "San Jose", "Porac", "Floridablanca", "Lubao", "Guagua", "Sasmuan", "Macabebe", "Masantol", "Mexico", "Santa Rita", "Bacolor", "Santa Ana", "Arayat", "Candaba", "San Luis", "San Simon", "Minalin", "Apalit"] },
  { province: "Nueva Ecija", cities: ["Cabanatuan", "Gapan", "San Jose", "Palayan", "Muñoz", "Talavera", "Laur", "Bongabon", "Pantabangan", "Rizal", "General Mamerto Natividad", "Llanera", "Santa Rosa", "Peñaranda", "General Tinio", "Cabiao", "San Antonio", "Jaen", "San Isidro", "Aliaga", "Quezon", "Licab", "Guimba", "Cuyapo"] },
  { province: "Tarlac", cities: ["Tarlac City", "Capas", "Concepcion", "Bamban", "Moncada", "Paniqui", "Gerona", "La Paz", "Victoria", "Ramos", "Camiling", "San Manuel", "Anao", "San Clemente", "Mayantoc", "San Jose", "Pura"] },
  { province: "Zambales", cities: ["Olongapo", "Subic", "Castillejos", "San Marcelino", "San Antonio", "San Narciso", "San Felipe", "Cabangan", "Botolan", "Iba", "Palauig", "Masinloc", "Candelaria", "Santa Cruz"] },
  { province: "Bataan", cities: ["Balanga", "Mariveles", "Bagac", "Hermosa", "Orani", "Samal", "Abucay", "Pilar", "Orion", "Limay", "Dinalupihan", "Morong"] },
  { province: "Cebu", cities: ["Cebu City", "Lapu-Lapu", "Mandaue", "Talisay", "Toledo", "Danao", "Carcar", "Bogo", "Naga", "Minglanilla", "Consolacion", "Liloan", "Compostela", "Cordova", "Bantayan", "Daanbantayan", "Medellin", "Badian", "Ronda", "Dumanjug", "Barili", "Aloguinsan", "Pinamungajan", "Asturias", "Balamban", "Tuburan", "Tabuelan", "Sogod", "Catmon", "Carmen"] },
  { province: "Bohol", cities: ["Tagbilaran", "Tubigon", "Calape", "Loon", "Maribojoc", "Antequera", "Balilihan", "Catigbian", "Sagbayan", "Clarin", "Inabanga", "Buenavista", "Getafe", "Talibon", "Bien Unido", "Trinidad", "San Miguel", "Ubay", "Carlos P. Garcia", "Pilar", "Sierra Bullones", "Valencia", "Garcia Hernandez", "Jagna", "Duero", "Guindulman", "Anda", "Candijay", "Alburquerque", "Loay", "Loboc", "Sevilla", "Lila", "Dimiao", "Dauis", "Panglao", "Baclayon", "Cortes", "Corella", "Sikatuna", "Carmen", "Batuan", "Bilar"] },
  { province: "Negros Oriental", cities: ["Dumaguete", "Bais", "Tanjay", "Canlaon", "Guihulngan", "Bayawan", "La Libertad", "Jimalalud", "Tayasan", "Bindoy", "Ayungon", "Manjuyod", "Pamplona", "Amlan", "Siaton", "Valencia", "Bacong", "Dauin", "Zamboanguita", "Sibulan", "San Jose", "Basay"] },
  { province: "Negros Occidental", cities: ["Bacolod", "Silay", "Talisay", "Bago", "La Carlota", "Sagay", "San Carlos", "Kabankalan", "Himamaylan", "Cadiz", "Victorias", "Manapla", "Toboso", "Calatrava", "Escalante", "EB Magalona", "Murcia", "Don Salvador Benedicto", "Pulupandan", "Valladolid", "San Enrique", "Pontevedra", "Hinigaran", "Binalbagan", "Isabela", "Moises Padilla", "La Castellana", "Hinoba-an", "Candoni", "Cauayan", "Ilog", "Sipalay"] },
  { province: "Iloilo", cities: ["Iloilo City", "Passi", "Pototan", "Lambunao", "Calinog", "Bingawan", "Badiangan", "San Miguel", "Guimbal", "Miagao", "San Joaquin", "Tubungan", "Igbaras", "Leon", "Alimodian", "San Dionisio", "Santa Barbara", "Cabatuan", "Maasin", "New Lucena", "Dueñas", "Zarraga", "Janiuay", "Mina", "Anilao", "Banate", "Barotac Nuevo", "Barotac Viejo", "Estancia", "Batad", "Carles", "Balasan", "Sara", "Lemery", "Concepcion", "San Rafael", "Ajuy", "Dumangas", "Leganes", "Pavia", "Oton", "Tigbauan"] },
  { province: "Aklan", cities: ["Kalibo", "Boracay", "Malay", "Buruanga", "Nabas", "Ibajay", "Tangalan", "Makato", "Numancia", "Lezo", "Madalag", "Libacao", "Jamindan", "Tapaz", "Capiz", "New Washington", "Banga", "Altavas"] },
  { province: "Leyte", cities: ["Tacloban", "Ormoc", "Baybay", "Maasin", "Abuyog", "Dulag", "Hilongos", "Palompon", "Carigara", "Capoocan", "Leyte", "Alangalang", "Santa Fe", "Babatngon", "San Miguel", "Tanauan", "Tolosa", "Palo", "Pastrana", "Dagami", "Jaro", "Tunga", "Calubian", "San Isidro", "Tabango", "Villaba", "Matag-ob", "Isabel", "Merida", "Kananga", "Albuera", "Matalom", "Bato", "Hindang", "Inopacan", "Mahaplag"] },
  { province: "Samar", cities: ["Catbalogan", "Calbayog", "Gandara", "Santa Margarita", "Daram", "Zumarraga", "Santo Niño", "Almagro", "Tagapul-an", "Tarangnan", "Calbiga", "Villareal", "Paranas", "Hinabangan", "San Sebastian", "Basey", "Marabut", "San Jose de Buan", "Motiong", "Jiabong", "San Jorge", "Talalora", "Pagsanghan"] },
  { province: "Davao del Sur", cities: ["Davao City", "Digos", "Hagonoy", "Padada", "Santa Cruz", "Sulop", "Kiblawan", "Magsaysay", "Matanao", "Bansalan", "Don Marcelino", "Jose Abad Santos", "Malita", "Santa Maria", "Sarangani"] },
  { province: "Davao del Norte", cities: ["Tagum", "Panabo", "Island Garden City of Samal", "Carmen", "Kapalong", "New Corella", "Santo Tomas", "Asuncion", "Braulio E. Dujali", "San Isidro", "Talaingod"] },
  { province: "Davao Oriental", cities: ["Mati", "Baganga", "Cateel", "Boston", "Caraga", "Governor Generoso", "Lupon", "Manay", "San Isidro", "Tarragona", "Banaybanay"] },
  { province: "South Cotabato", cities: ["General Santos", "Koronadal", "Tantangan", "Banga", "Surallah", "Polomolok", "Tupi", "T'boli", "Lake Sebu", "Santo Niño", "Norala", "Tampakan"] },
  { province: "North Cotabato", cities: ["Kidapawan", "M'lang", "Tulunan", "Makilala", "Matalam", "Magpet", "President Roxas", "Antipas", "Arakan", "Banisilan", "Aleosan", "Carmen", "Kabacan", "Midsayap", "Pigkawayan", "Pikit", "Libungan"] },
  { province: "Misamis Oriental", cities: ["Cagayan de Oro", "Gingoog", "El Salvador", "Opol", "Tagoloan", "Villanueva", "Jasaan", "Claveria", "Balingasag", "Lagonglong", "Salay", "Binuangan", "Naawan", "Initao", "Libertad", "Manticao", "Lugait", "Gitagum", "Laguindingan", "Alubijid", "Medina", "Magsaysay", "Talisayan", "Kinogitan"] },
  { province: "Misamis Occidental", cities: ["Ozamiz", "Oroquieta", "Tangub", "Aloran", "Baliangao", "Bonifacio", "Calamba", "Clarin", "Concepcion", "Don Victoriano", "Jimenez", "Lopez Jaena", "Panaon", "Plaridel", "Sapang Dalaga", "Sinacaban", "Tudela"] },
  { province: "Zamboanga del Sur", cities: ["Zamboanga City", "Pagadian", "Molave", "Aurora", "Bayog", "Dimataling", "Dinas", "Dumalinao", "Dumingag", "Guipos", "Josefina", "Kumalarang", "Labangan", "Lakewood", "Lapuyan", "Mahayag", "Margosatubig", "Midsalip", "Pitogo", "Ramon Magsaysay", "San Miguel", "San Pablo", "Sominot", "Tabina", "Tambulig", "Tigbao", "Tukuran", "Vincenzo Sagun"] },
  { province: "Zamboanga del Norte", cities: ["Dipolog", "Dapitan", "Baliguian", "Godod", "Gutalac", "Jose Dalman", "Kalawit", "Katipunan", "La Libertad", "Labason", "Leon Postigo", "Liloy", "Manukan", "Mutia", "Piñan", "Polanco", "Pres. Manuel A. Roxas", "Rizal", "Salug", "Sergio Osmeña Sr.", "Siayan", "Sibuco", "Sibutad", "Sindangan", "Siocon", "Sirawai", "Tampilisan"] },
  { province: "Bukidnon", cities: ["Malaybalay", "Valencia", "Maramag", "Don Carlos", "Kitaotao", "Dangcagan", "Kibawe", "Kadingilan", "Damulog", "Impasugong", "Lantapan", "Talakag", "Baungon", "Libona", "Malitbog", "Manolo Fortich", "Pangantucan", "Quezon", "San Fernando", "Sumilao", "Kalilangan", "Cabanglasan"] },
  { province: "Lanao del Norte", cities: ["Iligan", "Tubod", "Bacolod", "Baloi", "Baroy", "Kapatagan", "Kauswagan", "Kolambugan", "Lala", "Linamon", "Magsaysay", "Maigo", "Matungao", "Munai", "Nunungan", "Pantao Ragat", "Pantar", "Poona Piagapo", "Salvador", "Sapad", "Sultan Naga Dimaporo", "Tagoloan", "Tangcal"] },
  { province: "Lanao del Sur", cities: ["Marawi", "Bacolod-Kalawi", "Balabagan", "Balindong", "Bayang", "Binidayan", "Buadiposo-Buntong", "Bubong", "Butig", "Calanogas", "Ditsaan-Ramain", "Ganassi", "Kapai", "Kapatagan", "Lumba-Bayabao", "Lumbaca-Unayan", "Lumbatan", "Lumbayanague", "Madalum", "Madamba", "Maguing", "Malabang", "Marantao", "Marogong", "Masiu", "Mulondo", "Pagayawan", "Piagapo", "Poona Bayabao", "Pualas", "Saguiaran", "Sultan Dumalondong", "Picong", "Tagoloan II", "Tamparan", "Taraka", "Tubaran", "Tugaya", "Wao"] },
  { province: "Agusan del Norte", cities: ["Butuan", "Cabadbaran", "Buenavista", "Carmen", "Jabonga", "Kitcharao", "Las Nieves", "Magallanes", "Nasipit", "Remedios T. Romualdez", "Santiago", "Tubay"] },
  { province: "Agusan del Sur", cities: ["Bayugan", "Bunawan", "Esperanza", "La Paz", "Loreto", "Prosperidad", "Rosario", "San Francisco", "San Luis", "Santa Josefa", "Sibagat", "Talacogon", "Trento", "Veruela"] },
  { province: "Surigao del Norte", cities: ["Surigao City", "Alegria", "Bacuag", "Burgos", "Claver", "Dapa", "Del Carmen", "General Luna", "Gigaquit", "Mainit", "Malimono", "Pilar", "Placer", "San Benito", "San Francisco", "San Isidro", "Santa Monica", "Sison", "Socorro", "Tagana-an", "Tubod"] },
  { province: "Surigao del Sur", cities: ["Tandag", "Bislig", "Barobo", "Bayabas", "Cagwait", "Cantilan", "Carmen", "Carrascal", "Cortes", "Hinatuan", "Lanuza", "Lianga", "Lingig", "Madrid", "Marihatag", "San Agustin", "San Miguel", "Tagbina", "Tago"] },
  { province: "Dinagat Islands", cities: ["San Jose", "Basilisa", "Cagdianao", "Dinagat", "Libjo", "Loreto", "Tubajon"] },
  { province: "Benguet", cities: ["Baguio", "La Trinidad", "Atok", "Bakun", "Bokod", "Buguias", "Itogon", "Kabayan", "Kapangan", "Kibungan", "Mankayan", "Sablan", "Tuba", "Tublay"] },
  { province: "Ifugao", cities: ["Lagawe", "Banaue", "Alfonso Lista", "Asipulo", "Aguinaldo", "Hingyon", "Hungduan", "Kiangan", "Lamut", "Mayoyao", "Tinoc"] },
  { province: "Mountain Province", cities: ["Bontoc", "Barlig", "Bauko", "Besao", "Natonin", "Paracelis", "Sabangan", "Sadanga", "Sagada", "Tadian"] },
  { province: "Abra", cities: ["Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", "Dolores", "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", "Licuan-Baay", "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", "Pilar", "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum", "Tineg", "Tubo", "Villaviciosa"] },
  { province: "Apayao", cities: ["Kabugao", "Calanasan", "Conner", "Flora", "Luna", "Pudtol", "Santa Marcela"] },
  { province: "Kalinga", cities: ["Tabuk", "Balbalan", "Lubuagan", "Pasil", "Pinukpuk", "Rizal", "Tanudan", "Tinglayan"] },
  { province: "Ilocos Norte", cities: ["Laoag", "Batac", "Adams", "Bacarra", "Badoc", "Bangui", "Banna", "Burgos", "Carasi", "Currimao", "Dingras", "Dumalneg", "Marcos", "Nueva Era", "Pagudpud", "Paoay", "Pasuquin", "Piddig", "Pinili", "San Nicolas", "Sarrat", "Solsona", "Vintar"] },
  { province: "Ilocos Sur", cities: ["Vigan", "Candon", "Alilem", "Banayoyo", "Bantay", "Burgos", "Cabugao", "Caoayan", "Cervantes", "Galimuyod", "Gregorio del Pilar", "Lidlidda", "Magsingal", "Nagbukel", "Narvacan", "Quirino", "Salcedo", "San Emilio", "San Esteban", "San Ildefonso", "San Juan", "San Vicente", "Santa", "Santa Catalina", "Santa Cruz", "Santa Lucia", "Santa Maria", "Santiago", "Santo Domingo", "Sigay", "Sinait", "Sugpon", "Suyo", "Tagudin"] },
  { province: "La Union", cities: ["San Fernando", "Agoo", "Aringay", "Bacnotan", "Bagulin", "Balaoan", "Bangar", "Bauang", "Burgos", "Caba", "Luna", "Naguilian", "Pugo", "Rosario", "San Gabriel", "San Juan", "Santo Tomas", "Santol", "Sudipen", "Tubao"] },
  { province: "Pangasinan", cities: ["Dagupan", "San Carlos", "Urdaneta", "Alaminos", "Agno", "Aguilar", "Alcala", "Anda", "Asingan", "Balungao", "Bani", "Basista", "Bautista", "Bayambang", "Binalonan", "Binmaley", "Bolinao", "Bugallon", "Burgos", "Calasiao", "Dasol", "Infanta", "Labrador", "Laoac", "Lingayen", "Mabini", "Malasiqui", "Manaoag", "Mangaldan", "Mangatarem", "Mapandan", "Natividad", "Pozorrubio", "Rosales", "San Fabian", "San Jacinto", "San Manuel", "San Nicolas", "San Quintin", "Santa Barbara", "Santa Maria", "Santo Tomas", "Sison", "Sual", "Tayug", "Umingan", "Urbiztondo", "Villasis"] },
  { province: "Cagayan", cities: ["Tuguegarao", "Aparri", "Abulug", "Alcala", "Allacapan", "Amulung", "Baggao", "Ballesteros", "Buguey", "Calayan", "Camalaniugan", "Claveria", "Enrile", "Gattaran", "Gonzaga", "Iguig", "Lal-lo", "Lasam", "Pamplona", "Peñablanca", "Piat", "Rizal", "Sanchez-Mira", "Santa Ana", "Santa Praxedes", "Santa Teresita", "Santo Niño", "Solana", "Tuao"] },
  { province: "Isabela", cities: ["Ilagan", "Cauayan", "Santiago", "Alicia", "Angadanan", "Aurora", "Benito Soliven", "Burgos", "Cabagan", "Cabatuan", "Cordon", "Delfin Albano", "Dinapigue", "Divilacan", "Echague", "Gamu", "Jones", "Luna", "Maconacon", "Mallig", "Naguilian", "Palanan", "Quezon", "Quirino", "Ramon", "Reina Mercedes", "Roxas", "San Agustin", "San Guillermo", "San Isidro", "San Manuel", "San Mariano", "San Mateo", "San Pablo", "Santa Maria", "Santo Tomas", "Tumauini"] },
  { province: "Nueva Vizcaya", cities: ["Bayombong", "Solano", "Aritao", "Ambaguio", "Alfonso Castaneda", "Bagabag", "Bambang", "Diadi", "Dupax del Norte", "Dupax del Sur", "Kasibu", "Kayapa", "Quezon", "Santa Fe", "Villaverde"] },
  { province: "Quirino", cities: ["Cabarroguis", "Aglipay", "Diffun", "Maddela", "Nagtipunan", "Saguday"] },
  { province: "Batanes", cities: ["Basco", "Itbayat", "Ivana", "Mahatao", "Sabtang", "Uyugan"] },
  { province: "Camarines Norte", cities: ["Daet", "Basud", "Capalonga", "Jose Panganiban", "Labo", "Mercedes", "Paracale", "San Lorenzo Ruiz", "San Vicente", "Santa Elena", "Talisay", "Vinzons"] },
  { province: "Camarines Sur", cities: ["Naga", "Iriga", "Baao", "Balatan", "Bato", "Bombon", "Buhi", "Bula", "Cabusao", "Calabanga", "Camaligan", "Canaman", "Caramoan", "Del Gallego", "Gainza", "Garchitorena", "Goa", "Lagonoy", "Libmanan", "Lupi", "Magarao", "Milaor", "Minalabac", "Nabua", "Ocampo", "Pamplona", "Pasacao", "Pili", "Presentacion", "Ragay", "Sagñay", "San Fernando", "San Jose", "Sipocot", "Siruma", "Tigaon", "Tinambac"] },
  { province: "Albay", cities: ["Legazpi", "Tabaco", "Ligao", "Bacacay", "Camalig", "Daraga", "Guinobatan", "Jovellar", "Libon", "Malilipot", "Malinao", "Manito", "Oas", "Pio Duran", "Polangui", "Rapu-Rapu", "Santo Domingo", "Tiwi"] },
  { province: "Sorsogon", cities: ["Sorsogon City", "Bacon", "Barcelona", "Bulan", "Bulusan", "Casiguran", "Castilla", "Donsol", "Gubat", "Irosin", "Juban", "Magallanes", "Matnog", "Pilar", "Prieto Diaz", "Santa Magdalena"] },
  { province: "Catanduanes", cities: ["Virac", "Bagamanoc", "Baras", "Bato", "Caramoran", "Gigmoto", "Pandan", "Panganiban", "San Andres", "San Miguel", "Viga"] },
  { province: "Masbate", cities: ["Masbate City", "Aroroy", "Baleno", "Balud", "Batuan", "Cataingan", "Cawayan", "Claveria", "Dimasalang", "Esperanza", "Mandaon", "Milagros", "Mobo", "Monreal", "Palanas", "Pio V. Corpuz", "Placer", "San Fernando", "San Jacinto", "San Pascual", "Uson"] },
  { province: "Marinduque", cities: ["Boac", "Buenavista", "Gasan", "Mogpog", "Santa Cruz", "Torrijos"] },
  { province: "Occidental Mindoro", cities: ["Mamburao", "Abra de Ilog", "Calintaan", "Looc", "Lubang", "Magsaysay", "Paluan", "Rizal", "Sablayan", "San Jose", "Santa Cruz"] },
  { province: "Oriental Mindoro", cities: ["Calapan", "Baco", "Bansud", "Bongabong", "Bulalacao", "Gloria", "Mansalay", "Naujan", "Pinamalayan", "Pola", "Puerto Galera", "Roxas", "San Teodoro", "Socorro", "Victoria"] },
  { province: "Romblon", cities: ["Romblon", "Alcantara", "Banton", "Cajidiocan", "Calatrava", "Concepcion", "Corcuera", "Ferrol", "Looc", "Magdiwang", "Odiongan", "San Agustin", "San Andres", "San Fernando", "San Jose", "Santa Fe", "Santa Maria"] },
  { province: "Palawan", cities: ["Puerto Princesa", "Aborlan", "Agutaya", "Araceli", "Balabac", "Bataraza", "Brooke's Point", "Busuanga", "Cagayancillo", "Coron", "Culion", "Cuyo", "Dumaran", "El Nido", "Kalayaan", "Linapacan", "Magsaysay", "Narra", "Quezon", "Rizal", "Roxas", "San Vicente", "Sofronio Española", "Taytay"] },
  { province: "Quezon", cities: ["Lucena", "Tayabas", "Infanta", "Agdangan", "Alabat", "Atimonan", "Buenavista", "Burdeos", "Calauag", "Candelaria", "Catanauan", "Dolores", "General Luna", "General Nakar", "Guinayangan", "Gumaca", "Jomalig", "Lopez", "Lucban", "Macalelon", "Mauban", "Mulanay", "Padre Burgos", "Pagbilao", "Panukulan", "Patnanungan", "Perez", "Pitogo", "Plaridel", "Polillo", "Quezon", "Real", "Sampaloc", "San Andres", "San Antonio", "San Francisco", "San Narciso", "Sariaya", "Tagkawayan", "Tiaong", "Unisan"] },
];

interface CscRequestBody {
  type: 'states' | 'cities';
  countryCode: string;
  stateCode?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as CscRequestBody;
    const { type, countryCode, stateCode } = body;

    if (!type || !countryCode) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Always use Philippine data regardless of country code (app is Philippines-only)
    console.log(`Received request for country: ${countryCode}, using Philippine data`);

    let data: { iso2?: string; name: string }[] = [];

    if (type === 'states') {
      // Return provinces as states
      data = philippineProvincesData.map((p, index) => ({
        iso2: `PH-${index.toString().padStart(2, '0')}`,
        name: p.province,
      }));
    } else if (type === 'cities') {
      // Find province and return its cities
      const provinceData = philippineProvincesData.find(p => {
        // Match by province name or iso2 code
        const expectedIso2 = `PH-${philippineProvincesData.indexOf(p).toString().padStart(2, '0')}`;
        return p.province === stateCode || expectedIso2 === stateCode;
      });

      if (provinceData) {
        data = provinceData.cities.map(city => ({ name: city }));
      }
    }

    console.log(`CSC Location: ${type} request for ${countryCode}/${stateCode || 'all'} - returning ${data.length} items`);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('CSC proxy error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch locations' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
